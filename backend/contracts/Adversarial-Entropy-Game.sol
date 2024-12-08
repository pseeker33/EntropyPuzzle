
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Imports
import {IAdversarialEntropyGame} from "./Adversarial-Entropy-Game_Interface.sol";


// Errors
error NotAuthorized();
error InsufficientEthSent();
error HashesDontMatch();
error TransferFailed();
error InvalidMatchLength();
error ReentrancyAttempt();

/**
 * @title Adversarial Entropy Game
 * @author 
 * @notice This contract implements a lottery-like adversarial game designed to generate on-chain entropy.
 * @dev Interactions involve depositing ETH to recalculate a lottery number and potentially claim rewards if conditions are met.
 */
contract AdversarialEntropyGame {

    // State variables

    /// @notice Owner address with administrative privileges.
    address public owner;

    /// @notice Current lottery number stored on-chain.
    bytes32 public lotteryNumber;

    /// @notice Total funds accumulated for the game (lottery pot).
    uint256 public gamePot;

    /// @notice Funds reserved for development and donation.
    uint256 public devAndDonationPot;

    /// @notice Minimum required deposit in wei, set as immutable in constructor.
    uint256 public immutable MIN_DEPOSIT_IMM;

    /// @notice Percentage of deposit that goes to dev/donation pot, immutable.
    uint256 public immutable DEV_DONATION_PERCENTAGE;

    /// @notice Percentage of deposit that goes to game pot, immutable.
    uint256 public immutable GAME_PERCENTAGE;

    /// @notice Number of trailing nibbles (hex characters) to be matched to claim the lottery.
    uint8 public matchLength;

    // Reentrancy locks
    bool private getNewNumberLock;
    bool private claimLotteryLock;

    // Events
    event NewNumberGenerated(bytes32 indexed newNumber, address indexed player, uint256 amount);
    event LotteryClaimed(address indexed winner, uint256 indexed amount);
    event DevAndDonationClaimed(address indexed owner, uint256 indexed amount);
    event MatchLengthUpdated(uint8 indexed newMatchLength);

    // Modifiers
    /**
     * @dev Modifier that restricts execution to the contract owner.
     */
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    /**
     * @dev Modifier to prevent reentrancy for getNewNumber function.
     */
    modifier noReentrancyGetNewNumber() {
        if (getNewNumberLock) revert ReentrancyAttempt();
        getNewNumberLock = true;
        _;
        getNewNumberLock = false;
    }

    /**
     * @dev Modifier to prevent reentrancy for claimLottery function.
     */
    modifier noReentrancyClaimLottery() {
        if (claimLotteryLock) revert ReentrancyAttempt();
        claimLotteryLock = true;
        _;
        claimLotteryLock = false;
    }

    // Functions

    // Constructor
    /**
     * @dev Initializes the contract:
     * @param initialMatchLength initial difficulty (must be 1 <= initialMatchLength <= 64)
     * @param minDeposit minimum deposit in wei, assigned once as immutable
     * @param devDonationPercentage percentage of deposit that goes to dev/donation pot
     *
     * Note: devDonationPercentage and gamePercentage must sum to 100.
     */
    constructor(uint8 initialMatchLength, uint256 minDeposit, uint256 devDonationPercentage) {
        owner = msg.sender;

        // Set immutables
        MIN_DEPOSIT_IMM = minDeposit;
        DEV_DONATION_PERCENTAGE = devDonationPercentage;
        GAME_PERCENTAGE = 100 - devDonationPercentage;

        _validateMatchLength(initialMatchLength);
        matchLength = initialMatchLength;

        lotteryNumber = keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender));
    }

    // Receive function
    /**
     * @dev Receive function disabled to prevent accidental ETH transfers.
     */
    receive() external payable {
        revert("Use getNewNumber function to send ETH");
    }

    // Fallback function 
    /**
     * @dev Fallback function disabled to prevent accidental ETH transfers.
     */
    fallback() external payable {
        revert("Use getNewNumber function to send ETH");
    }

    // External functions

    /**
     * @notice Generates a new lottery number. Requires sending at least MIN_DEPOSIT_IMM wei.
     * @dev Redistributes the funds:
     *      - DEV_DONATION_PERCENTAGE% of the deposit goes to devAndDonationPot.
     *      - GAME_PERCENTAGE% of the deposit goes to gamePot.
     * Uses a private function `_calculateNewLotteryNumber` to update the lottery number.
     */
    function getNewNumber() external payable noReentrancyGetNewNumber {
        if (msg.value < MIN_DEPOSIT_IMM) revert InsufficientEthSent();

        uint256 devDonationShare = (msg.value * DEV_DONATION_PERCENTAGE) / 100;
        uint256 gameShare = (msg.value * GAME_PERCENTAGE) / 100;

        devAndDonationPot += devDonationShare;
        gamePot += gameShare;

        bool success = _calculateNewLotteryNumber(msg.sender, msg.value);
        if (!success) {
            revert("Lottery number calculation failed");
        }

        emit NewNumberGenerated(lotteryNumber, msg.sender, msg.value);
    }

    /**
     * @notice Claims the lottery funds if `matchLength` nibbles match.
     * @dev If successful:
     *      - Winner receives 50% of current gamePot.
     *      - Remaining 50% stays in the contract.
     */
    function claimLottery() external noReentrancyClaimLottery {
        if (!_matchesLastCharacters(msg.sender, lotteryNumber, matchLength)) revert HashesDontMatch();

        uint256 half = gamePot / 2;
        (bool success, ) = msg.sender.call{value: half}("");
        if (!success) revert TransferFailed();

        gamePot -= half;
        emit LotteryClaimed(msg.sender, half);
    }

    /**
     * @notice Claims all the development and donation funds.
     * @dev Only the owner can withdraw these funds.
     */
    function claimDevelopmentAndDonation() external onlyOwner {
        uint256 amount = devAndDonationPot;
        devAndDonationPot = 0;

        (bool success, ) = owner.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit DevAndDonationClaimed(owner, amount);
    }

    /**
     * @notice Updates the difficulty of the game by changing the matchLength.
     * @dev matchLength must be between 1 and 64 (nibbles in a bytes32).
     * @param _newMatchLength The new difficulty (nibbles required).
     */
    function setMatchLength(uint8 _newMatchLength) external onlyOwner {
        _validateMatchLength(_newMatchLength);
        matchLength = _newMatchLength;
        emit MatchLengthUpdated(_newMatchLength);
    }

    // External view functions

    /**
     * @notice Returns the current lottery number stored on-chain.
     * @return The current lottery number.
     */
    function checkNumber() external view returns (bytes32) {
        return lotteryNumber;
    }

    /**
     * @notice Returns the current state of the contract.
     */
    function getContractState()
        external
        view
        returns (
            address currentOwner,
            bytes32 currentLotteryNumber,
            uint256 currentGamePot,
            uint256 currentDevAndDonationPot,
            uint256 currentMinDeposit,
            uint8 currentMatchLength,
            uint256 devDonationPct,
            uint256 gamePct
        )
    {
        currentOwner = owner;
        currentLotteryNumber = lotteryNumber;
        currentGamePot = gamePot;
        currentDevAndDonationPot = devAndDonationPot;
        currentMinDeposit = MIN_DEPOSIT_IMM;
        currentMatchLength = matchLength;
        devDonationPct = DEV_DONATION_PERCENTAGE;
        gamePct = GAME_PERCENTAGE;
    }

    // Internal functions

    /**
     * @dev Internal function to verify whether the last `length` nibbles of the player's address hash
     *      match the last `length` nibbles of the lottery number.
     * @param player Address of the player attempting to claim.
     * @param number The lottery number to compare against.
     * @param length Number of trailing nibbles to compare.
     * @return True if the last `length` nibbles match, false otherwise.
     */
    function _matchesLastCharacters(address player, bytes32 number, uint8 length) internal pure returns (bool) {
        bytes32 addrHash = keccak256(abi.encodePacked(player));

        // Calculate mask for the last `length` nibbles
        uint256 mask = (16 ** length) - 1;
        uint256 addrVal = uint256(addrHash);
        uint256 numVal = uint256(number);

        uint256 addrSuffix = addrVal & mask;
        uint256 numSuffix = numVal & mask;

        return (addrSuffix == numSuffix);
    }

    // Private functions

    /**
     * @dev Private function that calculates the new lottery number.
     *      Returns true if successful.
     * @param sender The address calling getNewNumber.
     * @param value The value sent by the sender.
     */
    function _calculateNewLotteryNumber(address sender, uint256 value) private returns (bool) {

        lotteryNumber = keccak256(
            abi.encodePacked(
                lotteryNumber,
                sender,
                value
            )
        );

        return true;
    }

    /**
     * @dev Validate matchLength to ensure it's between 1 and 64.
     */
    function _validateMatchLength(uint8 _length) private pure {
        if (_length == 0 || _length > 64) revert InvalidMatchLength();
    }
}
