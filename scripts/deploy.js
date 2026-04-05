import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Reputation SBT
  const Reputation = await hre.ethers.getContractFactory("TruthLensReputation");
  const reputation = await Reputation.deploy(deployer.address);
  await reputation.waitForDeployment();
  const repAddress = await reputation.getAddress();
  console.log("TruthLensReputation deployed to:", repAddress);

  // 2. Deploy TruthDAO
  const DAO = await hre.ethers.getContractFactory("TruthDAO");
  const dao = await DAO.deploy(repAddress, deployer.address);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("TruthDAO deployed to:", daoAddress);

  // 3. Deploy DeFactBridge
  const Bridge = await hre.ethers.getContractFactory("DeFactBridge");
  const bridge = await Bridge.deploy(daoAddress, deployer.address);
  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();
  console.log("DeFactBridge deployed to:", bridgeAddress);

  // 4. Deploy ContentIntegrity
  const Integrity = await hre.ethers.getContractFactory("ContentIntegrity");
  const integrity = await Integrity.deploy(deployer.address);
  await integrity.waitForDeployment();
  const integrityAddress = await integrity.getAddress();
  console.log("ContentIntegrity deployed to:", integrityAddress);

  // 5. Update .env file
  const envPath = path.join(__dirname, "..", "backend", ".env");
  let envContent = fs.readFileSync(envPath, "utf8");

  const updates = {
    "REPUTATION_CONTRACT_ADDRESS": repAddress,
    "DAO_CONTRACT_ADDRESS": daoAddress,
    "BRIDGE_CONTRACT_ADDRESS": bridgeAddress,
    "INTEGRITY_CONTRACT_ADDRESS": integrityAddress,
    "CONTRACT_ADDRESS": daoAddress // For legacy compatibility
  };

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`${key}=.*`);
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log("Environment variables updated in backend/.env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
