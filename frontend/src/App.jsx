import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ContractInteraction from './components/ContractInteraction';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ContractABI from "./ContractABI.json";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  const contractAddress = "TU_DIRECCION_DE_CONTRATO_DESPLEGADO";
  const contractABI = [
    // Añade aquí los métodos del ABI de tu contrato
    "function getNewNumber() public payable",
    "function claimLottery() public",
    "function getContractState() public view returns (address, bytes32, uint256, uint256, uint256, uint8)"
  ];

  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum, 'hardhat');
          /* const provider = new ethers.BrowserProvider(
            window.ethereum, 
            {
              chainId: 1337,
              ensAddress: ethers.ZeroAddress  // Deshabilita explícitamente ENS
            }
          ); */
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);

          const contractInstance = new ethers.Contract(
            contractAddress, 
            contractABI, 
            signer
          );
          setContract(contractInstance);
        } catch (error) {
          console.error("Error conectando wallet", error);
        toast.error("Error conectando wallet");
        }
      }
    };

    connectWallet();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Adversarial Entropy Game</h1>
        {account ? (
          <ContractInteraction 
            contract={contract} 
            account={account} 
          />
        ) : (
          <p>Por favor, conecta tu wallet de Ethereum</p>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;