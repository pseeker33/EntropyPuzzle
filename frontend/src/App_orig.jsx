import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ContractInteraction from './components/ContractInteraction';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ContractABI from "./ContractABI.json";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  const contractAddress = "0x06a0d9103d9dcd80eAd075379736A5FdFB4B3430";
  const contractABI = ContractABI
 

  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);
          
          // Verifica y cambia a la red Arbitrum Sepolia
          const network = await provider.getNetwork();
          if (network.chainId !== 421614) {
            // Recargar la página después de cambiar de red
            return;
          }
  
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
      } else {
        toast.error("Por favor, instala una wallet como MetaMask");
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