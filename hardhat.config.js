import * as dotenv from "dotenv";
dotenv.config({ path: "backend/.env" });
import "@nomicfoundation/hardhat-ethers";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.20",
  networks: {
    shardeum: {
      type: "http",
      url: process.env.RPC_URL || "https://api-mezame.shardeum.org",
      chainId: parseInt(process.env.CHAIN_ID || "8119"),
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
