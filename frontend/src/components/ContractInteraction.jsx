import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';

function ContractInteraction({ contract, account }) {
  const [contractState, setContractState] = useState(null);
  const [depositAmount, setDepositAmount] = useState('0.01');

  useEffect(() => {
    const fetchContractState = async () => {
      if (contract) {
        try {
          const state = await contract.getContractState();
          setContractState({
            owner: state[0],
            lotteryNumber: state[1],
            gamePot: ethers.formatEther(state[2]),
            devPot: ethers.formatEther(state[3]),
            minDeposit: ethers.formatEther(state[4]),
            matchLength: state[5].toString()
          });
        } catch (error) {
          console.error("Error fetching contract state", error);
        }
      }
    };

    fetchContractState();
  }, [contract]);

  const handleGetNewNumber = async () => {
    try {
      const tx = await contract.getNewNumber({
        value: ethers.parseEther(depositAmount)
      });
      await tx.wait();
      toast.success('Nuevo número generado');
    } catch (error) {
      toast.error('Error generando número');
      console.error(error);
    }
  };

  const handleClaimLottery = async () => {
    try {
      const tx = await contract.claimLottery();
      await tx.wait();
      toast.success('Lotería reclamada');
    } catch (error) {
      toast.error('Error reclamando lotería');
      console.error(error);
    }
  };

  if (!contractState) return <div>Cargando estado...</div>;

  return (
    <div className="space-y-4">
      <p>Cuenta conectada: {account}</p>
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="font-bold">Estado del Contrato</h2>
        <p>Número de Lotería: {contractState.lotteryNumber}</p>
        <p>Pozo de Juego: {contractState.gamePot} ETH</p>
        <p>Pozo de Desarrollo: {contractState.devPot} ETH</p>
        <p>Longitud de Coincidencia: {contractState.matchLength}</p>
      </div>

      <div className="space-y-2">
        <input 
          type="number" 
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Monto de depósito (ETH)"
        />
        <button 
          onClick={handleGetNewNumber}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Generar Nuevo Número
        </button>
        <button 
          onClick={handleClaimLottery}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Reclamar Lotería
        </button>
      </div>
    </div>
  );
}

export default ContractInteraction;