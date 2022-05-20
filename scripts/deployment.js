/* eslint-disable */

const hre = require("hardhat");
const fs = require("fs");
const process = require("process");
require("dotenv").config();

async function main() {
  // Config
  var WETH;
  const royaltyFeeLimit = 9500; //(10,000 = 100%) max 95%
  const protocolFeeRecipient = "0x1De9Dd3BeBc822c933aC97Ed644A807952D088F3";

  // Message
  console.log("🚧 Please wait for a moment 🚧");
  console.log("Deploying...");

  if (hre.network.name == "ropsten") {
    WETH = process.env.ROPSTEN_WETH;
  } else {
    throw new Error("Something went wrong!");
  }
  // Deploy CurrencyManager
  const CurrencyManager = await hre.ethers.getContractFactory("CurrencyManager");
  const currencyManager = await CurrencyManager.deploy();
  // Deploy ExecutionManager
  const ExecutionManager = await hre.ethers.getContractFactory("ExecutionManager");
  const executionManager = await ExecutionManager.deploy();
  // *** Deploy RoyaltyFeeRegistry before RoyaltyFeeManager ***
  const RoyaltyFeeRegistry = await hre.ethers.getContractFactory("RoyaltyFeeRegistry");
  const royaltyFeeRegistry = await RoyaltyFeeRegistry.deploy(royaltyFeeLimit);
  // Deploy RoyaltyFeeManager
  const RoyaltyFeeManager = await hre.ethers.getContractFactory("RoyaltyFeeManager");
  const royaltyFeeManager = await RoyaltyFeeManager.deploy(royaltyFeeRegistry.address);
  // Deploy Exchange contract
  const LooksRareExchange = await hre.ethers.getContractFactory("LooksRareExchange");
  const looks = await LooksRareExchange.deploy(
    currencyManager.address,
    executionManager.address,
    royaltyFeeManager.address,
    WETH,
    protocolFeeRecipient
  );
  await looks.deployed();
  let data = JSON.stringify(
    `export const currencyManagerAddress = "${currencyManager.address}"\nexport const executionManagerAddress = "${executionManager.address}"\nexport const royaltyFeeRegistryAddress = "${royaltyFeeRegistry.address}"\nexport const royaltyFeeManagerAddress = "${royaltyFeeManager.address}"\nexport const exchangeAddress = "${looks.address}"`
  );
  fs.writeFileSync("deployed_addresses_config.js", JSON.parse(data));
  console.log("Deployment is completed 🚀, please check ./deployed_addresses_config.js for deployed addresses 🤙");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
