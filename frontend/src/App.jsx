import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ContractInteraction from './components/ContractInteraction';
import { networkConfig } from "./config";
import { useToast } from "./context/ToastProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import ContractABI from "./ContractABI.json"; // Asegúrate de tener el ABI del contrato

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [walletDisconnected, setWalletDisconnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const addToast = useToast();

  const resetState = () => {
    setAccount(null);
    setContract(null);
    //setIsOwner(false);
    //setIsRegistered(false);
    setUserBalance(0);
    setGameState(null);
  };

  // Escuchar cambios en la wallet y la red
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          if (!walletDisconnected) {
            addToast("Wallet desconectada", "info");
            setWalletDisconnected(true);
          }
          resetState();
        } else {
          setAccount(accounts[0]);
          fetchUserBalance(accounts[0]);          
          setWalletDisconnected(false);
        }
      });

      window.ethereum.on("chainChanged", () => {
        addToast("Red cambiada. Recargando...", "info");
        resetState();
        window.location.reload();
      });

      return () => {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      };
    }
  }, [addToast, walletDisconnected]);

  const handleAccountChange = async (newAccount) => {
    setAccount(newAccount);
    await fetchUserBalance(newAccount);
  };

  // Verificar conexión inicial
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            handleAccountChange(accounts[0]);
            await checkNetwork();
          }
        } catch (error) {
          console.error("Error checking initial connection:", error);
        }
      }
    };

    checkConnection();
  }, []);

  const checkNetwork = async () => {
    try {
      const { ethereum } = window;
      const chainId = await ethereum.request({ method: "eth_chainId" });
      const decimalChainId = parseInt(chainId, 16);

      if (!networkConfig[decimalChainId]) {
        addToast("Red no soportada. Use Sepolia o Localhost 8545", "info");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error al verificar la red", error);
      addToast("Error al verificar la red", "error");
      return false;
    }
  };

  const loadContract = async () => {
    try {
      const { ethereum } = window;
      const chainId = await ethereum.request({ method: "eth_chainId" });
      const decimalChainId = parseInt(chainId, 16);
      const contractAddress = networkConfig[decimalChainId]?.contractAddress;

      if (!contractAddress) {
        addToast("No se pudo obtener la dirección del contrato para esta red.", "info");
        return null;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const instance = new ethers.Contract(
        contractAddress,
        ContractABI,
        signer
      );

      setContract(instance);
      return instance;
    } catch (error) {
      console.error("Error al cargar el contrato:", error);
      addToast("Error al cargar el contrato", "error");
      return null;
    }
  };

  
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        addToast("MetaMask no está instalado", "info");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      const isCorrectNetwork = await checkNetwork();

      if (!isCorrectNetwork) {
        addToast("Por favor, conecta a una red", "info");
        return;
      }

      setAccount(accounts[0]);
      const contractInstance = await loadContract();
      if (contractInstance) {
        setContract(contractInstance);
      }
    } catch (error) {
      console.error("Error al conectar wallet:", error);
      addToast("Error conectando la wallet", "error");
    }
  };

  // Obtener saldo del usuario
  const fetchUserBalance = async (userAddress) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(userAddress);
      const formattedBalance = ethers.formatEther(balance);
      setUserBalance(formattedBalance);
    } catch (error) {
      console.error("Error obteniendo balance del usuario:", error);
      addToast("Error obteniendo balance", "error");
    }
  };

 

  const playGame = () => {
    setIsPlaying(true); // Muestra el componente de interacción
  };

  return (  
    <div>
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop={true}
      />
      <div className="main-container">
        <h1>Game DApp</h1>
        {!account ? (
          <button onClick={connectWallet}>Conectar Wallet</button>
        ) : (
          <div>
            <p>Conectado: {account}</p>
            <p>Saldo: {userBalance ? `${userBalance} ETH` : "Cargando..."}</p>
            {!isPlaying ? (
              <button onClick={playGame}>Jugar</button>
            ) : (
              <ContractInteraction contract={contract} account={account} />
            )}
            {gameState && <p>Estado del juego: {gameState}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
