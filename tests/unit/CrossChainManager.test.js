const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrossChainManager", function () {
    let crossChainManager;
    let assetToken;
    let owner;
    let bridgeOperator;
    let user;

    beforeEach(async function () {
        [owner, bridgeOperator, user] = await ethers.getSigners();
        
        // Deploy AssetToken
        const AssetToken = await ethers.getContractFactory("AssetToken");
        assetToken = await AssetToken.deploy();
        await assetToken.deployed();
        
        // Deploy CrossChainManager
        const CrossChainManager = await ethers.getContractFactory("CrossChainManager");
        crossChainManager = await CrossChainManager.deploy(bridgeOperator.address);
        await crossChainManager.deployed();
        
        // Mint tokens to user
        await assetToken.mint(user.address, ethers.utils.parseEther("10000"));
        
        // Approve cross chain manager to spend tokens
        await assetToken.connect(user).approve(crossChainManager.address, ethers.utils.parseEther("10000"));
    });

    describe("Deployment", function () {
        it("Should set the correct bridge operator", async function () {
            expect(await crossChainManager.bridgeOperator()).to.equal(bridgeOperator.address);
        });

        it("Should set the correct owner", async function () {
            expect(await crossChainManager.owner()).to.equal(owner.address);
        });

        it("Should initialize with zero chain counter", async function () {
            expect(await crossChainManager.chainCounter()).to.equal(0);
        });
    });

    describe("Chain Management", function () {
        it("Should allow owner to add supported chains", async function () {
            const chainId = 137; // Polygon
            const name = "Polygon";
            const bridgeContract = ethers.Wallet.createRandom().address;
            const gasLimit = 500000;
            const fee = ethers.utils.parseEther("0.01");
            
            const tx = await crossChainManager.addSupportedChain(
                chainId,
                name,
                bridgeContract,
                gasLimit,
                fee
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ChainAdded');
            
            expect(event.args.chainId).to.equal(chainId);
            expect(event.args.name).to.equal(name);
            expect(event.args.bridgeContract).to.equal(bridgeContract);
            
            const chainInfo = await crossChainManager.supportedChains(chainId);
            expect(chainInfo.chainId).to.equal(chainId);
            expect(chainInfo.name).to.equal(name);
            expect(chainInfo.isActive).to.be.true;
        });

        it("Should not allow adding chain with zero bridge contract", async function () {
            await expect(
                crossChainManager.addSupportedChain(
                    137,
                    "Polygon",
                    ethers.constants.AddressZero,
                    500000,
                    ethers.utils.parseEther("0.01")
                )
            ).to.be.revertedWith("CrossChainManager: invalid bridge contract");
        });

        it("Should not allow adding duplicate chains", async function () {
            const chainId = 137;
            const bridgeContract = ethers.Wallet.createRandom().address;
            
            // Add chain first time
            await crossChainManager.addSupportedChain(
                chainId,
                "Polygon",
                bridgeContract,
                500000,
                ethers.utils.parseEther("0.01")
            );
            
            // Try to add same chain again
            await expect(
                crossChainManager.addSupportedChain(
                    chainId,
                    "Polygon",
                    bridgeContract,
                    500000,
                    ethers.utils.parseEther("0.01")
                )
            ).to.be.revertedWith("CrossChainManager: chain already supported");
        });

        it("Should allow owner to update chain info", async function () {
            // First add a chain
            const chainId = 137;
            const bridgeContract = ethers.Wallet.createRandom().address;
            
            await crossChainManager.addSupportedChain(
                chainId,
                "Polygon",
                bridgeContract,
                500000,
                ethers.utils.parseEther("0.01")
            );
            
            // Then update it
            const tx = await crossChainManager.updateChainInfo(
                chainId,
                false, // deactivate
                600000, // new gas limit
                ethers.utils.parseEther("0.02") // new fee
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ChainUpdated');
            
            expect(event.args.chainId).to.equal(chainId);
            expect(event.args.isActive).to.be.false;
            
            const chainInfo = await crossChainManager.supportedChains(chainId);
            expect(chainInfo.isActive).to.be.false;
            expect(chainInfo.gasLimit).to.equal(600000);
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
    });

    describe("Cross-Chain Transfers", function () {
        let chainId;

        beforeEach(async function () {
            // Add supported chain
            chainId = 137; // Polygon
            await crossChainManager.addSupportedChain(
                chainId,
                "Polygon",
                ethers.Wallet.createRandom().address,
                500000,
                ethers.utils.parseEther("0.01")
            );
        });

        it("Should allow users to initiate cross-chain transfers", async function () {
            const amount = ethers.utils.parseEther("1000");
            const targetAddress = ethers.Wallet.createRandom().address;
            
            const tx = await crossChainManager.connect(user).initiateCrossChainTransfer(
                assetToken.address,
                amount,
                chainId,
                targetAddress
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CrossChainTransferInitiated');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.token).to.equal(assetToken.address);
            expect(event.args.amount).to.equal(amount);
            expect(event.args.targetChainId).to.equal(chainId);
            
            const transfer = await crossChainManager.transfers(event.args.transferId);
            expect(transfer.user).to.equal(user.address);
            expect(transfer.token).to.equal(assetToken.address);
            expect(transfer.amount).to.equal(amount);
            expect(transfer.targetChainId).to.equal(chainId);
        });

        it("Should not allow transfers to unsupported chains", async function () {
            const amount = ethers.utils.parseEther("1000");
            const unsupportedChainId = 999;
            const targetAddress = ethers.Wallet.createRandom().address;
            
            await expect(
                crossChainManager.connect(user).initiateCrossChainTransfer(
                    assetToken.address,
                    amount,
                    unsupportedChainId,
                    targetAddress
                )
            ).to.be.revertedWith("CrossChainManager: target chain not supported");
        });

        it("Should not allow zero amount transfers", async function () {
            const targetAddress = ethers.Wallet.createRandom().address;
            
            await expect(
                crossChainManager.connect(user).initiateCrossChainTransfer(
                    assetToken.address,
                    0,
                    chainId,
                    targetAddress
                )
            ).to.be.revertedWith("CrossChainManager: amount must be greater than 0");
        });

        it("Should not allow transfers to zero address", async function () {
            const amount = ethers.utils.parseEther("1000");
            
            await expect(
                crossChainManager.connect(user).initiateCrossChainTransfer(
                    assetToken.address,
                    amount,
                    chainId,
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("CrossChainManager: invalid target address");
        });

        it("Should calculate bridge fee correctly", async function () {
            const amount = ethers.utils.parseEther("1000");
            const targetAddress = ethers.Wallet.createRandom().address;
            const bridgeFee = await crossChainManager.bridgeFee();
            
            const tx = await crossChainManager.connect(user).initiateCrossChainTransfer(
                assetToken.address,
                amount,
                chainId,
                targetAddress
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CrossChainTransferInitiated');
            
            const expectedTransferAmount = amount.sub(amount.mul(bridgeFee).div(10000));
            expect(event.args.amount).to.equal(expectedTransferAmount);
        });
    });

    describe("Transfer Completion", function () {
        let transferId;

        beforeEach(async function () {
            // Add supported chain
            const chainId = 137;
            await crossChainManager.addSupportedChain(
                chainId,
                "Polygon",
                ethers.Wallet.createRandom().address,
                500000,
                ethers.utils.parseEther("0.01")
            );
            
            // Initiate transfer
            const amount = ethers.utils.parseEther("1000");
            const targetAddress = ethers.Wallet.createRandom().address;
            
            const tx = await crossChainManager.connect(user).initiateCrossChainTransfer(
                assetToken.address,
                amount,
                chainId,
                targetAddress
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CrossChainTransferInitiated');
            transferId = event.args.transferId;
        });

        it("Should allow bridge operator to complete transfers", async function () {
            const tx = await crossChainManager.connect(bridgeOperator).completeCrossChainTransfer(
                transferId,
                true // success
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CrossChainTransferCompleted');
            
            expect(event.args.transferId).to.equal(transferId);
            expect(event.args.success).to.be.true;
            
            const transfer = await crossChainManager.transfers(transferId);
            expect(transfer.isCompleted).to.be.true;
            expect(transfer.isReverted).to.be.false;
        });

        it("Should handle failed transfers by refunding", async function () {
            const tx = await crossChainManager.connect(bridgeOperator).completeCrossChainTransfer(
                transferId,
                false // failure
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CrossChainTransferCompleted');
            
            expect(event.args.transferId).to.equal(transferId);
            expect(event.args.success).to.be.false;
            
            const transfer = await crossChainManager.transfers(transferId);
            expect(transfer.isCompleted).to.be.true;
            expect(transfer.isReverted).to.be.true;
        });

        it("Should not allow non-bridge operator to complete transfers", async function () {
            await expect(
                crossChainManager.connect(user).completeCrossChainTransfer(transferId, true)
            ).to.be.revertedWith("CrossChainManager: not bridge operator");
        });

        it("Should not allow completing non-existent transfers", async function () {
            const nonExistentTransferId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("non-existent"));
            
            await expect(
                crossChainManager.connect(bridgeOperator).completeCrossChainTransfer(
                    nonExistentTransferId,
                    true
                )
            ).to.be.revertedWith("CrossChainManager: transfer not found");
        });

        it("Should not allow completing already completed transfers", async function () {
            // Complete transfer first time
            await crossChainManager.connect(bridgeOperator).completeCrossChainTransfer(transferId, true);
            
            // Try to complete again
            await expect(
                crossChainManager.connect(bridgeOperator).completeCrossChainTransfer(transferId, true)
            ).to.be.revertedWith("CrossChainManager: transfer already completed");
        });
    });

    describe("Strategy Execution", function () {
        let chainId;

        beforeEach(async function () {
            // Add supported chain
            chainId = 137;
            await crossChainManager.addSupportedChain(
                chainId,
                "Polygon",
                ethers.Wallet.createRandom().address,
                500000,
                ethers.utils.parseEther("0.01")
            );
        });

        it("Should allow users to initiate strategy execution", async function () {
            const strategyId = 1;
            const amount = ethers.utils.parseEther("1000");
            
            const tx = await crossChainManager.connect(user).initiateStrategyExecution(
                strategyId,
                chainId,
                amount
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyExecutionInitiated');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.strategyId).to.equal(strategyId);
            expect(event.args.targetChainId).to.equal(chainId);
            
            const execution = await crossChainManager.executions(event.args.executionId);
            expect(execution.user).to.equal(user.address);
            expect(execution.strategyId).to.equal(strategyId);
            expect(execution.amount).to.equal(amount);
        });

        it("Should not allow strategy execution to unsupported chains", async function () {
            const strategyId = 1;
            const amount = ethers.utils.parseEther("1000");
            const unsupportedChainId = 999;
            
            await expect(
                crossChainManager.connect(user).initiateStrategyExecution(
                    strategyId,
                    unsupportedChainId,
                    amount
                )
            ).to.be.revertedWith("CrossChainManager: target chain not supported");
        });

        it("Should allow bridge operator to complete strategy execution", async function () {
            const strategyId = 1;
            const amount = ethers.utils.parseEther("1000");
            
            // Initiate execution
            const tx = await crossChainManager.connect(user).initiateStrategyExecution(
                strategyId,
                chainId,
                amount
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyExecutionInitiated');
            const executionId = event.args.executionId;
            
            // Complete execution
            const completeTx = await crossChainManager.connect(bridgeOperator).completeStrategyExecution(
                executionId,
                true // success
            );
            const completeReceipt = await completeTx.wait();
            const completeEvent = completeReceipt.events.find(e => e.event === 'StrategyExecutionCompleted');
            
            expect(completeEvent.args.executionId).to.equal(executionId);
            expect(completeEvent.args.success).to.be.true;
            
            const execution = await crossChainManager.executions(executionId);
            expect(execution.isCompleted).to.be.true;
        });
    });

    describe("Administrative Functions", function () {
        it("Should allow owner to update bridge fee", async function () {
            const newFee = 500; // 5%
            
            const tx = await crossChainManager.updateBridgeFee(newFee);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'BridgeFeeUpdated');
            
            expect(event.args.newFee).to.equal(newFee);
            expect(await crossChainManager.bridgeFee()).to.equal(newFee);
        });

        it("Should not allow bridge fee above 5%", async function () {
            const newFee = 600; // 6%
            
            await expect(
                crossChainManager.updateBridgeFee(newFee)
            ).to.be.revertedWith("CrossChainManager: fee too high");
        });

        it("Should allow owner to update bridge operator", async function () {
            const newOperator = ethers.Wallet.createRandom().address;
            
            const tx = await crossChainManager.updateBridgeOperator(newOperator);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'BridgeOperatorUpdated');
            
            expect(event.args.newOperator).to.equal(newOperator);
            expect(await crossChainManager.bridgeOperator()).to.equal(newOperator);
        });

        it("Should not allow zero address as bridge operator", async function () {
            await expect(
                crossChainManager.updateBridgeOperator(ethers.constants.AddressZero)
            ).to.be.revertedWith("CrossChainManager: invalid operator");
        });

        it("Should not allow non-owner to update bridge fee", async function () {
            await expect(
                crossChainManager.connect(user).updateBridgeFee(500)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to pause and unpause", async function () {
            await crossChainManager.pause();
            expect(await crossChainManager.paused()).to.be.true;
            
            await crossChainManager.unpause();
            expect(await crossChainManager.paused()).to.be.false;
        });
    });

    describe("Utility Functions", function () {
        beforeEach(async function () {
            // Add some supported chains
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

        it("Should return supported chains", async function () {
            const supportedChains = await crossChainManager.getSupportedChains();
            expect(supportedChains.length).to.equal(2);
            expect(supportedChains[0]).to.equal(137);
            expect(supportedChains[1]).to.equal(56);
        });

        it("Should allow users to withdraw from chain", async function () {
            // First set up user balance on target chain
            const chainId = 137;
            const amount = ethers.utils.parseEther("1000");
            
            // This would normally be set by the bridge operator
            // For testing, we'll simulate it
            await crossChainManager.connect(bridgeOperator).completeCrossChainTransfer(
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-transfer")),
                true
            );
            
            // User withdraws
            await crossChainManager.connect(user).withdrawFromChain(
                assetToken.address,
                amount,
                chainId
            );
        });
    });
});
