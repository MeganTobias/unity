const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("End-to-End Integration", function () {
    let assetToken;
    let assetManager;
    let daoGovernance;
    let strategyMarket;
    let yieldStrategy;
    let crossChainManager;
    let priceOracle;
    let riskManager;
    let owner;
    let user1;
    let user2;
    let strategyCreator;

    beforeEach(async function () {
        [owner, user1, user2, strategyCreator] = await ethers.getSigners();
        
        // Deploy all contracts
        const AssetToken = await ethers.getContractFactory("AssetToken");
        assetToken = await AssetToken.deploy();
        await assetToken.deployed();
        
        const AssetManager = await ethers.getContractFactory("AssetManager");
        assetManager = await AssetManager.deploy(assetToken.address, owner.address);
        await assetManager.deployed();
        
        const DAOGovernance = await ethers.getContractFactory("DAOGovernance");
        daoGovernance = await DAOGovernance.deploy(assetToken.address);
        await daoGovernance.deployed();
        
        const StrategyMarket = await ethers.getContractFactory("StrategyMarket");
        strategyMarket = await StrategyMarket.deploy(assetToken.address, owner.address);
        await strategyMarket.deployed();
        
        const YieldStrategy = await ethers.getContractFactory("YieldStrategy");
        yieldStrategy = await YieldStrategy.deploy(
            "Test Strategy",
            "A test yield strategy",
            assetToken.address,
            assetToken.address,
            500
        );
        await yieldStrategy.deployed();
        
        const CrossChainManager = await ethers.getContractFactory("CrossChainManager");
        crossChainManager = await CrossChainManager.deploy(owner.address);
        await crossChainManager.deployed();
        
        const PriceOracle = await ethers.getContractFactory("PriceOracle");
        priceOracle = await PriceOracle.deploy();
        await priceOracle.deployed();
        
        const RiskManager = await ethers.getContractFactory("RiskManager");
        riskManager = await RiskManager.deploy(priceOracle.address);
        await riskManager.deployed();
        
        // Setup contracts
        await assetToken.addMinter(assetManager.address);
        await assetManager.addAsset(assetToken.address, 0);
        
        // Mint tokens to users
        await assetToken.mint(user1.address, ethers.utils.parseEther("1000000"));
        await assetToken.mint(user2.address, ethers.utils.parseEther("1000000"));
        await assetToken.mint(strategyCreator.address, ethers.utils.parseEther("1000000"));
        
        // Approve contracts
        await assetToken.connect(user1).approve(assetManager.address, ethers.utils.parseEther("1000000"));
        await assetToken.connect(user2).approve(assetManager.address, ethers.utils.parseEther("1000000"));
        await assetToken.connect(strategyCreator).approve(strategyMarket.address, ethers.utils.parseEther("1000000"));
        await assetToken.connect(user1).approve(yieldStrategy.address, ethers.utils.parseEther("1000000"));
        await assetToken.connect(user2).approve(yieldStrategy.address, ethers.utils.parseEther("1000000"));
    });

    describe("Complete User Journey", function () {
        it("Should complete a full user journey from deposit to strategy execution", async function () {
            // 1. User deposits assets
            const depositAmount = ethers.utils.parseEther("10000");
            await assetManager.connect(user1).deposit(assetToken.address, depositAmount);
            
            // Verify deposit
            const userBalance = await assetManager.getUserBalance(user1.address, assetToken.address);
            expect(userBalance).to.equal(depositAmount);
            
            // 2. Strategy creator creates a strategy
            const strategyId = await strategyMarket.connect(strategyCreator).callStatic.createStrategy(
                yieldStrategy.address,
                "Test Yield Strategy",
                "A comprehensive yield farming strategy",
                "Yield Farming",
                ethers.utils.parseEther("1000"), // subscription fee
                500, // performance fee
                false // not whitelist only
            );
            
            await strategyMarket.connect(strategyCreator).createStrategy(
                yieldStrategy.address,
                "Test Yield Strategy",
                "A comprehensive yield farming strategy",
                "Yield Farming",
                ethers.utils.parseEther("1000"),
                500,
                false
            );
            
            // 3. User subscribes to strategy
            const subscriptionDuration = 30 * 24 * 60 * 60; // 30 days
            const subscriptionCost = ethers.utils.parseEther("82.19"); // Approximate cost
            
            await assetToken.connect(user1).approve(strategyMarket.address, subscriptionCost);
            await strategyMarket.connect(user1).subscribeToStrategy(1, subscriptionDuration);
            
            // 4. User deposits into strategy
            const strategyDepositAmount = ethers.utils.parseEther("5000");
            await yieldStrategy.connect(user1).deposit(strategyDepositAmount);
            
            // Verify strategy deposit
            const position = await yieldStrategy.getUserPosition(user1.address);
            expect(position.depositAmount).to.equal(strategyDepositAmount);
            
            // 5. User sets risk profile
            await riskManager.connect(user1).setUserRiskProfile(
                1000, // max drawdown 10%
                500,  // max leverage 5x
                3000, // max concentration 30%
                6000, // max correlation 60%
                500,  // stop loss 5%
                2000  // take profit 20%
            );
            
            // 6. Risk assessment
            await riskManager.connect(owner).updateAssetRisk(
                assetToken.address,
                5000, // volatility 50%
                6000, // correlation 60%
                8000  // liquidity 80%
            );
            
            await riskManager.connect(owner).assessPositionRisk(
                user1.address,
                assetToken.address,
                strategyDepositAmount
            );
            
            // 7. User harvests rewards (after some time)
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
            await ethers.provider.send("evm_mine");
            
            await yieldStrategy.connect(user1).harvest();
            
            // 8. User withdraws from strategy
            const withdrawAmount = ethers.utils.parseEther("2000");
            await yieldStrategy.connect(user1).withdraw(withdrawAmount);
            
            // Verify withdrawal
            const updatedPosition = await yieldStrategy.getUserPosition(user1.address);
            expect(updatedPosition.depositAmount).to.equal(strategyDepositAmount.sub(withdrawAmount));
            
            // 9. User withdraws from asset manager
            await assetManager.connect(user1).withdraw(assetToken.address, withdrawAmount);
            
            // Verify final balance
            const finalBalance = await assetManager.getUserBalance(user1.address, assetToken.address);
            expect(finalBalance).to.equal(depositAmount.sub(withdrawAmount));
        });
    });

    describe("Governance Integration", function () {
        it("Should allow users to participate in governance", async function () {
            // User needs enough tokens to create proposals
            const proposalThreshold = await daoGovernance.proposalThreshold();
            expect(await assetToken.balanceOf(user1.address)).to.be.gte(proposalThreshold);
            
            // 1. User creates a proposal
            const proposalTx = await daoGovernance.connect(user1).propose(
                "Increase platform fee",
                "Proposal to increase platform fee from 0.25% to 0.5%",
                "0x"
            );
            
            const proposalReceipt = await proposalTx.wait();
            const proposalEvent = proposalReceipt.events.find(e => e.event === 'ProposalCreated');
            const proposalId = proposalEvent.args.proposalId;
            
            // 2. Fast forward to voting period
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
            await ethers.provider.send("evm_mine");
            
            // 3. Users vote on proposal
            await daoGovernance.connect(user1).vote(proposalId, true);
            await daoGovernance.connect(user2).vote(proposalId, true);
            
            // 4. Fast forward past voting period
            await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]); // 3 days
            await ethers.provider.send("evm_mine");
            
            // 5. Execute proposal
            await daoGovernance.execute(proposalId);
            
            // Verify proposal was executed
            const proposal = await daoGovernance.proposals(proposalId);
            expect(proposal.executed).to.be.true;
        });
    });

    describe("Cross-Chain Integration", function () {
        it("Should handle cross-chain operations", async function () {
            // 1. Add supported chains
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
            
            // 2. User initiates cross-chain transfer
            const transferAmount = ethers.utils.parseEther("1000");
            const targetChainId = 137;
            const targetAddress = ethers.Wallet.createRandom().address;
            
            const transferTx = await crossChainManager.connect(user1).initiateCrossChainTransfer(
                assetToken.address,
                transferAmount,
                targetChainId,
                targetAddress
            );
            
            const transferReceipt = await transferTx.wait();
            const transferEvent = transferReceipt.events.find(e => e.event === 'CrossChainTransferInitiated');
            const transferId = transferEvent.args.transferId;
            
            // 3. Bridge operator completes transfer
            await crossChainManager.connect(owner).completeCrossChainTransfer(transferId, true);
            
            // Verify transfer completion
            const transfer = await crossChainManager.transfers(transferId);
            expect(transfer.isCompleted).to.be.true;
            expect(transfer.isReverted).to.be.false;
        });
    });

    describe("Strategy Market Integration", function () {
        it("Should handle strategy marketplace operations", async function () {
            // 1. Strategy creator creates multiple strategies
            await strategyMarket.connect(strategyCreator).createStrategy(
                yieldStrategy.address,
                "Strategy 1",
                "First strategy",
                "Yield Farming",
                ethers.utils.parseEther("500"),
                300,
                false
            );
            
            await strategyMarket.connect(strategyCreator).createStrategy(
                yieldStrategy.address,
                "Strategy 2",
                "Second strategy",
                "Liquidity Mining",
                ethers.utils.parseEther("800"),
                400,
                true // whitelist only
            );
            
            // 2. Add user to whitelist for second strategy
            await strategyMarket.connect(strategyCreator).addToWhitelist(2, user1.address);
            
            // 3. User subscribes to both strategies
            const duration = 30 * 24 * 60 * 60; // 30 days
            
            // Subscribe to first strategy
            const cost1 = ethers.utils.parseEther("41.10"); // Approximate cost
            await assetToken.connect(user1).approve(strategyMarket.address, cost1);
            await strategyMarket.connect(user1).subscribeToStrategy(1, duration);
            
            // Subscribe to second strategy
            const cost2 = ethers.utils.parseEther("65.75"); // Approximate cost
            await assetToken.connect(user1).approve(strategyMarket.address, cost2);
            await strategyMarket.connect(user1).subscribeToStrategy(2, duration);
            
            // 4. Verify subscriptions
            const subscription1 = await strategyMarket.subscriptions(user1.address, 1);
            const subscription2 = await strategyMarket.subscriptions(user1.address, 2);
            
            expect(subscription1.isActive).to.be.true;
            expect(subscription2.isActive).to.be.true;
            
            // 5. User unsubscribes from first strategy
            await strategyMarket.connect(user1).unsubscribeFromStrategy(1);
            
            // Verify unsubscription
            const updatedSubscription1 = await strategyMarket.subscriptions(user1.address, 1);
            expect(updatedSubscription1.isActive).to.be.false;
        });
    });

    describe("Risk Management Integration", function () {
        it("Should handle comprehensive risk management", async function () {
            // 1. Users set risk profiles
            await riskManager.connect(user1).setUserRiskProfile(
                1000, // max drawdown 10%
                500,  // max leverage 5x
                3000, // max concentration 30%
                6000, // max correlation 60%
                500,  // stop loss 5%
                2000  // take profit 20%
            );
            
            await riskManager.connect(user2).setUserRiskProfile(
                2000, // max drawdown 20%
                1000, // max leverage 10x
                5000, // max concentration 50%
                8000, // max correlation 80%
                1000, // stop loss 10%
                3000  // take profit 30%
            );
            
            // 2. Update asset risks
            await riskManager.connect(owner).updateAssetRisk(
                assetToken.address,
                5000, // volatility 50%
                6000, // correlation 60%
                8000  // liquidity 80%
            );
            
            // 3. Assess position risks
            const amount1 = ethers.utils.parseEther("5000");
            const amount2 = ethers.utils.parseEther("10000");
            
            await riskManager.connect(owner).assessPositionRisk(user1.address, assetToken.address, amount1);
            await riskManager.connect(owner).assessPositionRisk(user2.address, assetToken.address, amount2);
            
            // 4. Check risk thresholds
            const user1Risk = await riskManager.checkRiskThresholds(user1.address, assetToken.address);
            const user2Risk = await riskManager.checkRiskThresholds(user2.address, assetToken.address);
            
            expect(user1Risk).to.be.true;
            expect(user2Risk).to.be.true;
            
            // 5. Update global risk score
            await riskManager.connect(owner).updateGlobalRiskScore();
            
            // 6. Trigger emergency stop if needed
            await riskManager.connect(owner).triggerEmergencyStop(user1.address, "High risk detected");
        });
    });
});
