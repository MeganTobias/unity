const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    // Deploy AssetToken
    console.log("\nDeploying AssetToken...");
    const AssetToken = await ethers.getContractFactory("AssetToken");
    const assetToken = await AssetToken.deploy();
    await assetToken.deployed();
    console.log("AssetToken deployed to:", assetToken.address);
    
    // Deploy AssetManager
    console.log("\nDeploying AssetManager...");
    const AssetManager = await ethers.getContractFactory("AssetManager");
    const assetManager = await AssetManager.deploy(assetToken.address, deployer.address);
    await assetManager.deployed();
    console.log("AssetManager deployed to:", assetManager.address);
    
    // Deploy DAOGovernance
    console.log("\nDeploying DAOGovernance...");
    const DAOGovernance = await ethers.getContractFactory("DAOGovernance");
    const daoGovernance = await DAOGovernance.deploy(assetToken.address);
    await daoGovernance.deployed();
    console.log("DAOGovernance deployed to:", daoGovernance.address);
    
    // Deploy YieldStrategy
    console.log("\nDeploying YieldStrategy...");
    const YieldStrategy = await ethers.getContractFactory("YieldStrategy");
    const yieldStrategy = await YieldStrategy.deploy(
        "USDC Yield Farming",
        "Automated USDC yield farming strategy",
        "0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C", // Mock USDC address
        assetToken.address,
        500 // 5% performance fee
    );
    await yieldStrategy.deployed();
    console.log("YieldStrategy deployed to:", yieldStrategy.address);
    
    // Configure contracts
    console.log("\nConfiguring contracts...");
    
    // Add AssetManager as minter for AssetToken
    await assetToken.addMinter(assetManager.address);
    console.log("Added AssetManager as minter");
    
    // Add USDC as supported asset
    await assetManager.addAsset("0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C", 0);
    console.log("Added USDC as supported asset");
    
    console.log("\nDeployment completed successfully!");
    console.log("\nContract addresses:");
    console.log("AssetToken:", assetToken.address);
    console.log("AssetManager:", assetManager.address);
    console.log("DAOGovernance:", daoGovernance.address);
    console.log("YieldStrategy:", yieldStrategy.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
