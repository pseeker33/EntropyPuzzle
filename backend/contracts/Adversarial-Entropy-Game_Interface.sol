
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IAdversarialEntropyGame
 * @notice Interface defining the functions, events, and getters of the Adversarial Entropy Game.
 */
interface IAdversarialEntropyGame {
    /// @notice Emitted when a new number is generated.
    event NewNumberGenerated(bytes32 newNumber, address indexed player, uint256 amount);

    /// @notice Emitted when the lottery is successfully claimed.
    event LotteryClaimed(address indexed winner, uint256 amount);

    /// @notice Emitted when the development and donation funds are claimed.
    event DevAndDonationClaimed(address indexed owner, uint256 amount);

    /// @notice Emitted when the match length (difficulty) is updated.
    event MatchLengthUpdated(uint8 newMatchLength);

    /**
     * @notice Returns the current lottery number.
     * @return The current lottery number.
     */
    function lotteryNumber() external view returns (bytes32);

    /**
     * @notice Returns the owner address.
     * @return The owner address.
     */
    function owner() external view returns (address);

    /**
     * @notice Returns the current game pot in wei.
     * @return The current game pot.
     */
    function gamePot() external view returns (uint256);

    /**
     * @notice Returns the development and donation pot in wei.
     * @return The current development and donation pot.
     */
    function devAndDonationPot() external view returns (uint256);

    /**
     * @notice Returns the minimum required deposit in wei.
     * @return The minimum deposit requirement.
     */
    function MIN_DEPOSIT() external view returns (uint256);

    /**
     * @notice Returns the current match length (number of trailing nibbles to match).
     * @return The current match length.
     */
    function matchLength() external view returns (uint8);

    /**
     * @notice Returns the current state of the contract.
     * @return currentOwner The owner's address.
     * @return currentLotteryNumber The current lottery number.
     * @return currentGamePot The current game pot.
     * @return currentDevAndDonationPot The current dev/donation pot.
     * @return currentMinDeposit The minimum deposit required.
     * @return currentMatchLength The current match length.
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
            uint8 currentMatchLength
        );

    /**
     * @notice Reads the current lottery number.
     * @return The current lottery number.
     */
    function checkNumber() external view returns (bytes32);

    /**
     * @notice Generates a new lottery number by sending at least the minimum required ETH.
     * @dev Updates lotteryNumber and redistributes incoming funds.
     */
    function getNewNumber() external payable;

    /**
     * @notice Claims the lottery pot if the sender's address matches the trailing nibbles of the lottery number.
     */
    function claimLottery() external;

    /**
     * @notice Claims the development and donation funds, only callable by the owner.
     */
    function claimDevelopmentAndDonation() external;

    /**
     * @notice Updates the match length (game difficulty), only callable by the owner.
     * @param _newMatchLength New number of trailing nibbles to match.
     */
    function setMatchLength(uint8 _newMatchLength) external;
}
