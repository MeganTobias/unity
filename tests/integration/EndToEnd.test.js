const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("End-to-End Integration Tests", function () {
    let assetToken;
    let assetManager;
    let daoGovernance;
    let yieldStrategy;
    let compoundStrategy;
    let liquidityMiningStrategy;
    let strategyMarket;
    let crossChainManager;
    let priceOracle;
    let riskManager;
    let owner;
    let user1;
    let user2;
    let user3;

    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();
        
        // Deploy AssetToken
        const AssetToken = await ethers.getContractFactory("AssetToken");
        assetToken = await AssetToken.deploy();
        await assetToken.deployed();
        
        // Deploy AssetManager
        const AssetManager = await ethers.getContractFactory("AssetManager");
        assetManager = await AssetManager.deploy(assetToken.address);
        await assetManager.deployed();
        
        // Deploy DAOGovernance
        const DAOGovernance = await ethers.getContractFactory("DAOGovernance");
        daoGovernance = await DAOGovernance.deploy(assetToken.address);
        await daoGovernance.deployed();
        
        // Deploy YieldStrategy
        const YieldStrategy = await ethers.getContractFactory("YieldStrategy");
        yieldStrategy = await YieldStrategy.deploy();
        await yieldStrategy.deployed();
        
        // Deploy CompoundStrategy
        const MockCompound = await ethers.getContractFactory("MockCompound");
        const mockCompound = await MockCompound.deploy();
        await mockCompound.deployed();
        
        const CompoundStrategy = await ethers.getContractFactory("CompoundStrategy");
        compoundStrategy = await CompoundStrategy.deploy(mockCompound.address, assetToken.address);
        await compoundStrategy.deployed();
        
        // Deploy LiquidityMiningStrategy
        const MockUniswapV2Router = await ethers.getContractFactory("MockUniswapV2Router");
        const mockUniswapV2Router = await MockUniswapV2Router.deploy();
        await mockUniswapV2Router.deployed();
        
        const MockUniswapV2Factory = await ethers.getContractFactory("MockUniswapV2Factory");
        const mockUniswapV2Factory = await MockUniswapV2Factory.deploy();
        await mockUniswapV2Factory.deployed();
        
        const LiquidityMiningStrategy = await ethers.getContractFactory("LiquidityMiningStrategy");
        liquidityMiningStrategy = await LiquidityMiningStrategy.deploy(
            mockUniswapV2Router.address,
            mockUniswapV2Factory.address,
            assetToken.address
        );
        await liquidityMiningStrategy.deployed();
        
        // Deploy StrategyMarket
        const StrategyMarket = await ethers.getContractFactory("StrategyMarket");
        strategyMarket = await StrategyMarket.deploy(assetToken.address);
        await strategyMarket.deployed();
        
        // Deploy CrossChainManager
        const CrossChainManager = await ethers.getContractFactory("CrossChainManager");
        crossChainManager = await CrossChainManager.deploy(owner.address);
        await crossChainManager.deployed();
        
        // Deploy PriceOracle
        const PriceOracle = await ethers.getContractFactory("PriceOracle");
        priceOracle = await PriceOracle.deploy();
        await priceOracle.deployed();
        
        // Deploy RiskManager
        const RiskManager = await ethers.getContractFactory("RiskManager");
        riskManager = await RiskManager.deploy(priceOracle.address);
        await riskManager.deployed();
        
        // Mint tokens to users
        await assetToken.mint(user1.address, ethers.utils.parseEther("10000"));
        await assetToken.mint(user2.address, ethers.utils.parseEther("10000"));
        await assetToken.mint(user3.address, ethers.utils.parseEther("10000"));
        
        // Approve contracts to spend tokens
        await assetToken.connect(user1).approve(assetManager.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(user2).approve(assetManager.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(user3).approve(assetManager.address, ethers.utils.parseEther("10000"));
        
        await assetToken.connect(user1).approve(compoundStrategy.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(user2).approve(compoundStrategy.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(user3).approve(compoundStrategy.address, ethers.utils.parseEther("10000"));
        
        await assetToken.connect(user1).approve(liquidityMiningStrategy.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(user2).approve(liquidityMiningStrategy.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(user3).approve(liquidityMiningStrategy.address, ethers.utils.parseEther("10000"));
    });

    describe("Complete User Journey", function () {
        it("Should complete full user journey from deposit to withdrawal", async function () {
            // 1. User deposits assets
            const depositAmount = ethers.utils.parseEther("1000");
            await assetManager.connect(user1).deposit(depositAmount);
            
            // Verify deposit
            const userBalance = await assetManager.getUserBalance(user1.address);
            expect(userBalance).to.equal(depositAmount);
            
            // 2. User invests in Compound strategy
            const strategyAmount = ethers.utils.parseEther("500");
            await compoundStrategy.connect(user1).deposit(strategyAmount);
            
            // Verify strategy deposit
            const userDeposit = await compoundStrategy.userDeposits(user1.address);
            expect(userDeposit.amount).to.equal(strategyAmount);
            
            // 3. User invests in Liquidity Mining strategy
            const liquidityAmount = ethers.utils.parseEther("300");
            await liquidityMiningStrategy.connect(user1).deposit(liquidityAmount);
            
            // Verify liquidity deposit
            const liquidityDeposit = await liquidityMiningStrategy.userDeposits(user1.address);
            expect(liquidityDeposit.amount).to.equal(liquidityAmount);
            
            // 4. User participates in DAO governance
            const proposalId = 1;
            const proposalDescription = "Increase platform fees";
            const proposalDuration = 7 * 24 * 60 * 60; // 7 days
            
            await daoGovernance.connect(user1).createProposal(
                proposalDescription,
                proposalDuration
            );
            
            // Verify proposal creation
            const proposal = await daoGovernance.proposals(proposalId);
            expect(proposal.description).to.equal(proposalDescription);
            expect(proposal.creator).to.equal(user1.address);
            
            // 5. User votes on proposal
            const voteAmount = ethers.utils.parseEther("100");
            await daoGovernance.connect(user1).vote(proposalId, true, voteAmount);
            
            // Verify vote
            const userVote = await daoGovernance.userVotes(user1.address, proposalId);
            expect(userVote.amount).to.equal(voteAmount);
            expect(userVote.support).to.be.true;
            
            // 6. User subscribes to strategy market
            const subscriptionAmount = ethers.utils.parseEther("50");
            await strategyMarket.connect(user1).subscribe(1, subscriptionAmount);
            
            // Verify subscription
            const subscription = await strategyMarket.subscriptions(user1.address, 1);
            expect(subscription.amount).to.equal(subscriptionAmount);
            expect(subscription.isActive).to.be.true;
            
            // 7. User withdraws from strategies
            const withdrawAmount = ethers.utils.parseEther("200");
            await compoundStrategy.connect(user1).withdraw(withdrawAmount);
            
            // Verify withdrawal
            const updatedDeposit = await compoundStrategy.userDeposits(user1.address);
            expect(updatedDeposit.amount).to.equal(strategyAmount.sub(withdrawAmount));
            
            // 8. User withdraws from asset manager
            const finalWithdrawAmount = ethers.utils.parseEther("500");
            await assetManager.connect(user1).withdraw(finalWithdrawAmount);
            
            // Verify final withdrawal
            const finalBalance = await assetManager.getUserBalance(user1.address);
            expect(finalBalance).to.equal(depositAmount.sub(finalWithdrawAmount));
        });
    });

    describe("Multi-User Collaboration", function () {
        it("Should handle multiple users interacting with the platform", async function () {
            // User 1 deposits and invests
            await assetManager.connect(user1).deposit(ethers.utils.parseEther("2000"));
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("1000"));
            
            // User 2 deposits and invests
            await assetManager.connect(user2).deposit(ethers.utils.parseEther("1500"));
            await liquidityMiningStrategy.connect(user2).deposit(ethers.utils.parseEther("800"));
            
            // User 3 deposits and invests
            await assetManager.connect(user3).deposit(ethers.utils.parseEther("3000"));
            await compoundStrategy.connect(user3).deposit(ethers.utils.parseEther("1200"));
            await liquidityMiningStrategy.connect(user3).deposit(ethers.utils.parseEther("600"));
            
            // Verify all deposits
            const user1Balance = await assetManager.getUserBalance(user1.address);
            const user2Balance = await assetManager.getUserBalance(user2.address);
            const user3Balance = await assetManager.getUserBalance(user3.address);
            
            expect(user1Balance).to.equal(ethers.utils.parseEther("2000"));
            expect(user2Balance).to.equal(ethers.utils.parseEther("1500"));
            expect(user3Balance).to.equal(ethers.utils.parseEther("3000"));
            
            // Verify strategy deposits
            const user1StrategyDeposit = await compoundStrategy.userDeposits(user1.address);
            const user2StrategyDeposit = await liquidityMiningStrategy.userDeposits(user2.address);
            const user3CompoundDeposit = await compoundStrategy.userDeposits(user3.address);
            const user3LiquidityDeposit = await liquidityMiningStrategy.userDeposits(user3.address);
            
            expect(user1StrategyDeposit.amount).to.equal(ethers.utils.parseEther("1000"));
            expect(user2StrategyDeposit.amount).to.equal(ethers.utils.parseEther("800"));
            expect(user3CompoundDeposit.amount).to.equal(ethers.utils.parseEther("1200"));
            expect(user3LiquidityDeposit.amount).to.equal(ethers.utils.parseEther("600"));
            
            // All users participate in governance
            await daoGovernance.connect(user1).createProposal("Proposal 1", 7 * 24 * 60 * 60);
            await daoGovernance.connect(user2).createProposal("Proposal 2", 7 * 24 * 60 * 60);
            await daoGovernance.connect(user3).createProposal("Proposal 3", 7 * 24 * 60 * 60);
            
            // All users vote on proposals
            await daoGovernance.connect(user1).vote(1, true, ethers.utils.parseEther("100"));
            await daoGovernance.connect(user2).vote(1, false, ethers.utils.parseEther("50"));
            await daoGovernance.connect(user3).vote(1, true, ethers.utils.parseEther("200"));
            
            // Verify votes
            const user1Vote = await daoGovernance.userVotes(user1.address, 1);
            const user2Vote = await daoGovernance.userVotes(user2.address, 1);
            const user3Vote = await daoGovernance.userVotes(user3.address, 1);
            
            expect(user1Vote.amount).to.equal(ethers.utils.parseEther("100"));
            expect(user2Vote.amount).to.equal(ethers.utils.parseEther("50"));
            expect(user3Vote.amount).to.equal(ethers.utils.parseEther("200"));
        });
    });

    describe("Cross-Chain Operations", function () {
        it("Should handle cross-chain asset transfers", async function () {
            // Add supported chain
            const chainId = 137; // Polygon
            const bridgeContract = ethers.Wallet.createRandom().address;
            
            await crossChainManager.addSupportedChain(
                chainId,
                "Polygon",
                bridgeContract,
                500000,
                ethers.utils.parseEther("0.01")
            );
            
            // User initiates cross-chain transfer
            const transferAmount = ethers.utils.parseEther("1000");
            const targetAddress = ethers.Wallet.createRandom().address;
            
            await assetToken.connect(user1).approve(crossChainManager.address, transferAmount);
            
            const tx = await crossChainManager.connect(user1).initiateCrossChainTransfer(
                assetToken.address,
                transferAmount,
                chainId,
                targetAddress
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CrossChainTransferInitiated');
            
            expect(event.args.user).to.equal(user1.address);
            expect(event.args.amount).to.equal(transferAmount);
            expect(event.args.targetChainId).to.equal(chainId);
            
            // Bridge operator completes transfer
            const transferId = event.args.transferId;
            await crossChainManager.completeCrossChainTransfer(transferId, true);
            
            // Verify transfer completion
            const transfer = await crossChainManager.transfers(transferId);
            expect(transfer.isCompleted).to.be.true;
            expect(transfer.isReverted).to.be.false;
        });
    });

    describe("Risk Management Integration", function () {
        it("Should assess and manage risks across the platform", async function () {
            // Add risk parameters for asset token
            await riskManager.addRiskParameter(
                assetToken.address,
                200, // max leverage 2x
                3000, // max position size 30%
                500, // max daily loss 5%
                2000 // volatility threshold 20%
            );
            
            // User deposits and invests
            await assetManager.connect(user1).deposit(ethers.utils.parseEther("1000"));
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("500"));
            
            // Assess position risk
            const positionSize = ethers.utils.parseEther("500");
            const leverage = 150; // 1.5x
            const volatility = 1000; // 10%
            
            const riskScore = await riskManager.assessPositionRisk(
                assetToken.address,
                positionSize,
                leverage,
                volatility
            );
            
            expect(riskScore).to.be.gt(0);
            
            // Set stop-loss order
            const positionId = 1;
            const stopLossPrice = ethers.utils.parseEther("1800");
            const triggerPrice = ethers.utils.parseEther("1900");
            
            await riskManager.connect(user1).setStopLoss(
                positionId,
                assetToken.address,
                stopLossPrice,
                triggerPrice
            );
            
            // Verify stop-loss order
            const stopLoss = await riskManager.stopLossOrders(user1.address, positionId);
            expect(stopLoss.token).to.equal(assetToken.address);
            expect(stopLoss.stopLossPrice).to.equal(stopLossPrice);
            expect(stopLoss.isActive).to.be.true;
        });
    });

    describe("Price Oracle Integration", function () {
        it("Should provide accurate price data for risk assessment", async function () {
            // Deploy mock price feed
            const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
            const mockPriceFeed = await MockPriceFeed.deploy();
            await mockPriceFeed.deployed();
            
            // Add price feed to oracle
            await priceOracle.addPriceFeed(
                assetToken.address,
                mockPriceFeed.address,
                8,
                "ASSET/USD"
            );
            
            // Set mock price
            const mockPrice = ethers.utils.parseUnits("2000", 8); // $2000
            await mockPriceFeed.setPrice(mockPrice);
            
            // Get price from oracle
            const price = await priceOracle.getPrice(assetToken.address);
            expect(price).to.equal(mockPrice);
            
            // Convert price
            const amount = ethers.utils.parseEther("1"); // 1 token
            const convertedAmount = await priceOracle.convertPrice(assetToken.address, amount, 18);
            const expectedAmount = ethers.utils.parseUnits("2000", 8);
            expect(convertedAmount).to.equal(expectedAmount);
        });
    });

    describe("Strategy Market Integration", function () {
        it("Should handle strategy subscriptions and monetization", async function () {
            // Add strategy to market
            const strategyId = 1;
            const subscriptionFee = ethers.utils.parseEther("10");
            const monthlyFee = ethers.utils.parseEther("5");
            
            await strategyMarket.addStrategy(
                strategyId,
                "Test Strategy",
                "A test strategy for integration",
                subscriptionFee,
                monthlyFee
            );
            
            // User subscribes to strategy
            const subscriptionAmount = ethers.utils.parseEther("100");
            await strategyMarket.connect(user1).subscribe(strategyId, subscriptionAmount);
            
            // Verify subscription
            const subscription = await strategyMarket.subscriptions(user1.address, strategyId);
            expect(subscription.amount).to.equal(subscriptionAmount);
            expect(subscription.isActive).to.be.true;
            
            // User pays monthly fee
            await strategyMarket.connect(user1).payMonthlyFee(strategyId);
            
            // Verify payment
            const updatedSubscription = await strategyMarket.subscriptions(user1.address, strategyId);
            expect(updatedSubscription.lastPayment).to.be.gt(0);
        });
    });

    describe("Emergency Scenarios", function () {
        it("Should handle emergency situations gracefully", async function () {
            // User deposits and invests
            await assetManager.connect(user1).deposit(ethers.utils.parseEther("1000"));
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("500"));
            
            // Trigger emergency stop on risk manager
            await riskManager.triggerEmergencyStop();
            expect(await riskManager.emergencyStopActive()).to.be.true;
            
            // Try to assess risk during emergency stop
            await expect(
                riskManager.assessPositionRisk(
                    assetToken.address,
                    ethers.utils.parseEther("100"),
                    100,
                    1000
                )
            ).to.be.revertedWith("RiskManager: emergency stop active");
            
            // Clear emergency stop
            await riskManager.clearEmergencyStop();
            expect(await riskManager.emergencyStopActive()).to.be.false;
            
            // Now risk assessment should work
            const riskScore = await riskManager.assessPositionRisk(
                assetToken.address,
                ethers.utils.parseEther("100"),
                100,
                1000
            );
            expect(riskScore).to.be.gt(0);
        });
    });

    describe("Performance and Scalability", function () {
        it("Should handle large numbers of users efficiently", async function () {
            const numUsers = 10;
            const depositAmount = ethers.utils.parseEther("1000");
            
            // Create multiple users and deposits
            for (let i = 0; i < numUsers; i++) {
                const user = ethers.Wallet.createRandom();
                await assetToken.mint(user.address, depositAmount);
                await assetToken.connect(user).approve(assetManager.address, depositAmount);
                await assetManager.connect(user).deposit(depositAmount);
            }
            
            // Verify total deposits
            const totalDeposits = await assetManager.getTotalDeposits();
            expect(totalDeposits).to.equal(depositAmount.mul(numUsers));
            
            // Verify user count
            const userCount = await assetManager.getUserCount();
            expect(userCount).to.equal(numUsers);
        });
    });

    describe("Data Consistency", function () {
        it("Should maintain data consistency across all contracts", async function () {
            // User deposits in multiple places
            const amount1 = ethers.utils.parseEther("1000");
            const amount2 = ethers.utils.parseEther("500");
            const amount3 = ethers.utils.parseEther("300");
            
            await assetManager.connect(user1).deposit(amount1);
            await compoundStrategy.connect(user1).deposit(amount2);
            await liquidityMiningStrategy.connect(user1).deposit(amount3);
            
            // Verify balances are consistent
            const assetManagerBalance = await assetManager.getUserBalance(user1.address);
            const compoundDeposit = await compoundStrategy.userDeposits(user1.address);
            const liquidityDeposit = await liquidityMiningStrategy.userDeposits(user1.address);
            
            expect(assetManagerBalance).to.equal(amount1);
            expect(compoundDeposit.amount).to.equal(amount2);
            expect(liquidityDeposit.amount).to.equal(amount3);
            
            // Verify total deposits across strategies
            const totalCompoundDeposits = await compoundStrategy.totalDeposits();
            const totalLiquidityDeposits = await liquidityMiningStrategy.totalDeposits();
            
            expect(totalCompoundDeposits).to.equal(amount2);
            expect(totalLiquidityDeposits).to.equal(amount3);
        });
    });
});