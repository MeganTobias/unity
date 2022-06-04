const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrossChain Integration", function () {
    let crossChainManager;
    let assetToken;
    let mockToken;
    let owner;
    let bridgeOperator;
    let user;

    beforeEach(async function () {
        [owner, bridgeOperator, user] = await ethers.getSigners();
        
        // Deploy CrossChainManager
        const CrossChainManager = await ethers.getContractFactory("CrossChainManager");
        crossChainManager = await CrossChainManager.deploy(bridgeOperator.address);
        await crossChainManager.deployed();
        
        // Deploy AssetToken
        const AssetToken = await ethers.getContractFactory("AssetToken");
        assetToken = await AssetToken.deploy();
        await assetToken.deployed();
        
        // Deploy MockToken
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Mock Token", "MOCK");
        await mockToken.deployed();
        
        // Mint tokens to user
        await assetToken.mint(user.address, ethers.utils.parseEther("10000"));
        await mockToken.mint(user.address, ethers.utils.parseEther("10000"));
        
        // Approve cross chain manager to spend tokens
        await assetToken.connect(user).approve(crossChainManager.address, ethers.utils.parseEther("10000"));
        await mockToken.connect(user).approve(crossChainManager.address, ethers.utils.parseEther("10000"));
    });

    describe("Chain Management", function () {
        it("Should allow owner to add supported chains", async function () {
            const chainId = 137; // Polygon
            const name = "Polygon";
            const bridgeContract = ethers.Wallet.createRandom().address;
            const gasLimit = 500000;
            const fee = ethers.utils.parseEther("0.01");
            
            await crossChainManager.addSupportedChain(
                chainId,
                name,
                bridgeContract,
                gasLimit,
                fee
            );
            
            const chainInfo = await crossChainManager.supportedChains(chainId);
            expect(chainInfo.chainId).to.equal(chainId);
            expect(chainInfo.name).to.equal(name);
            expect(chainInfo.bridgeContract).to.equal(bridgeContract);
            expect(chainInfo.isActive).to.be.true;
        });

        it("Should not allow non-owner to add chains", async function () {
            await expect(
                crossChainManager.connect(user).addSupportedChain(
                    137,
                    "Polygon",
                    ethers.Wallet.createRandom().address,
                    500000,
                    ethers.utils.parseEther("0.01")
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to update chain info", async function () {
            // First add a chain
            await crossChainManager.addSupportedChain(
                137,
                "Polygon",
                ethers.Wallet.createRandom().address,
                500000,
                ethers.utils.parseEther("0.01")
            );
            
            // Then update it
            await crossChainManager.updateChainInfo(
                137,
                false, // deactivate
                600000, // new gas limit
                ethers.utils.parseEther("0.02") // new fee
            );
            
            const chainInfo = await crossChainManager.supportedChains(137);
            expect(chainInfo.isActive).to.be.false;
            expect(chainInfo.gasLimit).to.equal(600000);
        });
    });

    describe("Cross-Chain Transfers", function () {
        beforeEach(async function () {
            // Add supported chains
            await crossChainManager.addSupportedChain(
                137, // Polygon
                "Polygon",
                ethers.Wallet.createRandom().address,
                500000,
                ethers.utils.parseEther("0.01")
            );
            
            await crossChainManager.addSupportedChain(
                56, // BSC
                "BSC",
                ethers.Wallet.createRandom().address,
                500000,
                ethers.utils.parseEther("0.01")
            );
        });

        it("Should allow users to initiate cross-chain transfers", async function () {
            const amount = ethers.utils.parseEther("100");
            const targetChainId = 137;
            const targetAddress = ethers.Wallet.createRandom().address;
            
            const tx = await crossChainManager.connect(user).initiateCrossChainTransfer(
                mockToken.address,
                amount,
                targetChainId,
                targetAddress
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CrossChainTransferInitiated');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.token).to.equal(mockToken.address);
            expect(event.args.amount).to.equal(amount);
            expect(event.args.targetChainId).to.equal(targetChainId);
        });

        it("Should not allow transfers to unsupported chains", async function () {
            const amount = ethers.utils.parseEther("100");
            const targetChainId = 999; // Unsupported chain
            const targetAddress = ethers.Wallet.createRandom().address;
            
            await expect(
                crossChainManager.connect(user).initiateCrossChainTransfer(
                    mockToken.address,
                    amount,
                    targetChainId,
                    targetAddress
                )
            ).to.be.revertedWith("CrossChainManager: target chain not supported");
        });

        it("Should allow bridge operator to complete transfers", async function () {
            const amount = ethers.utils.parseEther("100");
            const targetChainId = 137;
            const targetAddress = ethers.Wallet.createRandom().address;
            
            // Initiate transfer
            const tx = await crossChainManager.connect(user).initiateCrossChainTransfer(
                mockToken.address,
                amount,
                targetChainId,
                targetAddress
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CrossChainTransferInitiated');
            const transferId = event.args.transferId;
            
            // Complete transfer
            await crossChainManager.connect(bridgeOperator).completeCrossChainTransfer(
                transferId,
                true // success
            );
            
            const transfer = await crossChainManager.transfers(transferId);
            expect(transfer.isCompleted).to.be.true;
            expect(transfer.isReverted).to.be.false;
        });

        it("Should handle failed transfers by refunding", async function () {
            const amount = ethers.utils.parseEther("100");
            const targetChainId = 137;
            const targetAddress = ethers.Wallet.createRandom().address;
            
            // Initiate transfer
            const tx = await crossChainManager.connect(user).initiateCrossChainTransfer(
                mockToken.address,
                amount,
                targetChainId,
                targetAddress
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CrossChainTransferInitiated');
            const transferId = event.args.transferId;
            
            // Complete transfer with failure
            await crossChainManager.connect(bridgeOperator).completeCrossChainTransfer(
                transferId,
                false // failure
            );
            
            const transfer = await crossChainManager.transfers(transferId);
            expect(transfer.isCompleted).to.be.true;
            expect(transfer.isReverted).to.be.true;
        });
    });

    describe("Strategy Execution", function () {
        beforeEach(async function () {
            // Add supported chains
            await crossChainManager.addSupportedChain(
                137, // Polygon
                "Polygon",
                ethers.Wallet.createRandom().address,
                500000,
                ethers.utils.parseEther("0.01")
            );
        });

        it("Should allow users to initiate strategy execution", async function () {
            const strategyId = 1;
            const targetChainId = 137;
            const amount = ethers.utils.parseEther("100");
            
            const tx = await crossChainManager.connect(user).initiateStrategyExecution(
                strategyId,
                targetChainId,
                amount
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyExecutionInitiated');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.strategyId).to.equal(strategyId);
            expect(event.args.targetChainId).to.equal(targetChainId);
        });

        it("Should allow bridge operator to complete strategy execution", async function () {
            const strategyId = 1;
            const targetChainId = 137;
            const amount = ethers.utils.parseEther("100");
            
            // Initiate execution
            const tx = await crossChainManager.connect(user).initiateStrategyExecution(
                strategyId,
                targetChainId,
                amount
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyExecutionInitiated');
            const executionId = event.args.executionId;
            
            // Complete execution
            await crossChainManager.connect(bridgeOperator).completeStrategyExecution(
                executionId,
                true // success
            );
            
            const execution = await crossChainManager.executions(executionId);
            expect(execution.isCompleted).to.be.true;
        });
    });

    describe("Access Control", function () {
        it("Should not allow non-bridge operator to complete transfers", async function () {
            const transferId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
            
            await expect(
                crossChainManager.connect(user).completeCrossChainTransfer(transferId, true)
            ).to.be.revertedWith("CrossChainManager: not bridge operator");
        });

        it("Should allow owner to update bridge operator", async function () {
            const newOperator = ethers.Wallet.createRandom().address;
            
            await crossChainManager.updateBridgeOperator(newOperator);
            
            // The bridgeOperator variable is not public, so we test by trying to use the new operator
            // In a real test, you would need to deploy a new instance or add a getter function
        });
    });
});
