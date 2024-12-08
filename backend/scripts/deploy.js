const hre = require("hardhat");

async function main() {
  // Validaciones de despliegue
  const [deployer] = await hre.ethers.getSigners();
  console.log("Desplegando con cuenta:", deployer.address);
  console.log("Balance de cuenta:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Parámetros del constructor
  const initialMatchLength = 2; // Dificultad inicial (1 <= valor <= 64)
  const minDeposit = hre.ethers.parseUnits("0.01", "ether"); // Depósito mínimo en wei
  const devDonationPercentage = 10; // 10% para el fondo del desarrollador

  // Despliegue del contrato invocando el constructor
  const AdversarialEntropyGame = await hre.ethers.getContractFactory("AdversarialEntropyGame");
  //const adversarialEntropyGame = await AdversarialEntropyGame.deploy(initialMatchLength);
  const adversarialEntropyGame = await AdversarialEntropyGame.deploy(
    initialMatchLength,
    minDeposit,
    devDonationPercentage
  );

  // Esperar a que se despliegue el contrato antes de continuar
  await adversarialEntropyGame.waitForDeployment();

  const contractAddress = await adversarialEntropyGame.getAddress();
  console.log(`Contrato AdversarialEntropyGame desplegado en la dirección: ${contractAddress}`);

  // Verificación automática en Arbitrum Sepolia
  if (hre.network.name === 'arbitrumSepolia') {
    try { 
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [
          initialMatchLength,
          minDeposit,
          devDonationPercentage
        ],
      });
      console.log("Contrato verificado en Arbitrum Sepolia");
    } catch (error) {
      console.error("Error en la verificación:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });