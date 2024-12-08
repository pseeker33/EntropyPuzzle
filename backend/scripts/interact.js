const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const contractAddress = "TU_DIRECCION_DE_CONTRATO";
  
  const AdversarialEntropyGame = await hre.ethers.getContractFactory("AdversarialEntropyGame");
  const contract = await AdversarialEntropyGame.attach(contractAddress);

  // Demostrar primera interacción: Generar nuevo número
  const txGetNewNumber = await contract.getNewNumber({
    value: hre.ethers.parseEther("0.01") // Mínimo depósito
  });
  
  await txGetNewNumber.wait();
  
  // Obtener estado actual del contrato
  const contractState = await contract.getContractState();
  console.log("Estado actual del juego:", contractState);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });