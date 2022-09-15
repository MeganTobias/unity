const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Strategy Integration Tests", function () {
    let assetToken;
    let compoundStrategy;
    let liquidityMiningStrategy;
    let strategyMarket;
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
        
        // Deploy MockCompound
        const MockCompound = await ethers.getContractFactory("MockCompound");
        const mockCompound = await MockCompound.deploy();
        await mockCompound.deployed();
        
        // Deploy CompoundStrategy
        const CompoundStrategy = await ethers.getContractFactory("CompoundStrategy");
        compoundStrategy = await CompoundStrategy.deploy(mockCompound.address, assetToken.address);
        await compoundStrategy.deployed();
        
        // Deploy MockUniswapV2Router
        const MockUniswapV2Router = await ethers.getContractFactory("MockUniswapV2Router");
        const mockUniswapV2Router = await MockUniswapV2Router.deploy();
        await mockUniswapV2Router.deployed();
        
        // Deploy MockUniswapV2Factory
        const MockUniswapV2Factory = await ethers.getContractFactory("MockUniswapV2Factory");
        const mockUniswapV2Factory = await MockUniswapV2Factory.deploy();
        await mockUniswapV2Factory.deployed();
        
        // Deploy LiquidityMiningStrategy
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
        
        // Mint tokens to users
        await assetToken.mint(user1.address, ethers.utils.parseEther("10000"));
        await assetToken.mint(user2.address, ethers.utils.parseEther("10000"));
        await assetToken.mint(user3.address, ethers.utils.parseEther("10000"));
        
        // Approve contracts to spend tokens
        await assetToken.connect(user1).approve(compoundStrategy.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(user2).approve(compoundStrategy.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(user3).approve(compoundStrategy.address, ethers.utils.parseEther("10000"));
        
        await assetToken.connect(user1).approve(liquidityMiningStrategy.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(user2).approve(liquidityMiningStrategy.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(user3).approve(liquidityMiningStrategy.address, ethers.utils.parseEther("10000"));
        
        await assetToken.connect(user1).approve(strategyMarket.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(user2).approve(strategyMarket.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(user3).approve(strategyMarket.address, ethers.utils.parseEther("10000"));
    });

    describe("Strategy Market Integration", function () {
        it("Should allow users to subscribe to multiple strategies", async function () {
            // Add strategies to market
            await strategyMarket.addStrategy(1, "Compound Strategy", "Lending strategy", ethers.utils.parseEther("10"), ethers.utils.parseEther("5"));
            await strategyMarket.addStrategy(2, "Liquidity Mining", "Liquidity mining strategy", ethers.utils.parseEther("15"), ethers.utils.parseEther("8"));
            
            // User subscribes to both strategies
            await strategyMarket.connect(user1).subscribe(1, ethers.utils.parseEther("100"));
            await strategyMarket.connect(user1).subscribe(2, ethers.utils.parseEther("150"));
            
            // Verify subscriptions
            const subscription1 = await strategyMarket.subscriptions(user1.address, 1);
            const subscription2 = await strategyMarket.subscriptions(user1.address, 2);
            
            expect(subscription1.amount).to.equal(ethers.utils.parseEther("100"));
            expect(subscription1.isActive).to.be.true;
            expect(subscription2.amount).to.equal(ethers.utils.parseEther("150"));
            expect(subscription2.isActive).to.be.true;
        });

        it("Should handle strategy fee payments", async function () {
            // Add strategy
            await strategyMarket.addStrategy(1, "Test Strategy", "Test description", ethers.utils.parseEther("10"), ethers.utils.parseEther("5"));
            
            // User subscribes
            await strategyMarket.connect(user1).subscribe(1, ethers.utils.parseEther("100"));
            
            // User pays monthly fee
            const tx = await strategyMarket.connect(user1).payMonthlyFee(1);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'MonthlyFeePaid');
            
            expect(event.args.user).to.equal(user1.address);
            expect(event.args.strategyId).to.equal(1);
            expect(event.args.amount).to.equal(ethers.utils.parseEther("5"));
        });

        it("Should handle strategy cancellations", async function () {
            // Add strategy
            await strategyMarket.addStrategy(1, "Test Strategy", "Test description", ethers.utils.parseEther("10"), ethers.utils.parseEther("5"));
            
            // User subscribes
            await strategyMarket.connect(user1).subscribe(1, ethers.utils.parseEther("100"));
            
            // User cancels subscription
            const tx = await strategyMarket.connect(user1).cancelSubscription(1);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'SubscriptionCancelled');
            
            expect(event.args.user).to.equal(user1.address);
            expect(event.args.strategyId).to.equal(1);
            
            // Verify cancellation
            const subscription = await strategyMarket.subscriptions(user1.address, 1);
            expect(subscription.isActive).to.be.false;
        });
    });

    describe("Strategy Performance Tracking", function () {
        it("Should track strategy performance across multiple users", async function () {
            // Users deposit in Compound strategy
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("1000"));
            await compoundStrategy.connect(user2).deposit(ethers.utils.parseEther("1500"));
            await compoundStrategy.connect(user3).deposit(ethers.utils.parseEther("800"));
            
            // Users deposit in Liquidity Mining strategy
            await liquidityMiningStrategy.connect(user1).deposit(ethers.utils.parseEther("500"));
            await liquidityMiningStrategy.connect(user2).deposit(ethers.utils.parseEther("700"));
            await liquidityMiningStrategy.connect(user3).deposit(ethers.utils.parseEther("300"));
            
            // Verify total deposits
            const totalCompoundDeposits = await compoundStrategy.totalDeposits();
            const totalLiquidityDeposits = await liquidityMiningStrategy.totalDeposits();
            
            expect(totalCompoundDeposits).to.equal(ethers.utils.parseEther("3300"));
            expect(totalLiquidityDeposits).to.equal(ethers.utils.parseEther("1500"));
            
            // Verify user counts
            const compoundUserCount = await compoundStrategy.getTotalUsers();
            const liquidityUserCount = await liquidityMiningStrategy.getTotalUsers();
            
            expect(compoundUserCount).to.equal(3);
            expect(liquidityUserCount).to.equal(3);
        });

        it("Should calculate average deposits correctly", async function () {
            // Users deposit different amounts
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("1000"));
            await compoundStrategy.connect(user2).deposit(ethers.utils.parseEther("2000"));
            await compoundStrategy.connect(user3).deposit(ethers.utils.parseEther("3000"));
            
            // Get strategy statistics
            const stats = await compoundStrategy.getStrategyStatistics();
            
            expect(stats.totalDeposits).to.equal(ethers.utils.parseEther("6000"));
            expect(stats.totalUsers).to.equal(3);
            expect(stats.averageDeposit).to.equal(ethers.utils.parseEther("2000"));
        });
    });

    describe("Strategy Rewards Distribution", function () {
        it("Should distribute rewards proportionally among users", async function () {
            // Users deposit different amounts
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("1000"));
            await compoundStrategy.connect(user2).deposit(ethers.utils.parseEther("2000"));
            await compoundStrategy.connect(user3).deposit(ethers.utils.parseEther("3000"));
            
            // Set up rewards (this would normally come from the protocol)
            const totalRewards = ethers.utils.parseEther("600"); // 10% of total deposits
            
            // Distribute rewards
            await compoundStrategy.distributeRewards();
            
            // Users claim their rewards
            const user1Rewards = await compoundStrategy.getUserRewards(user1.address);
            const user2Rewards = await compoundStrategy.getUserRewards(user2.address);
            const user3Rewards = await compoundStrategy.getUserRewards(user3.address);
            
            // Verify proportional distribution
            expect(user1Rewards).to.be.gt(0);
            expect(user2Rewards).to.be.gt(user1Rewards);
            expect(user3Rewards).to.be.gt(user2Rewards);
        });

        it("Should handle zero rewards gracefully", async function () {
            // Users deposit
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("1000"));
            await compoundStrategy.connect(user2).deposit(ethers.utils.parseEther("2000"));
            
            // Distribute rewards (no rewards available)
            await compoundStrategy.distributeRewards();
            
            // Users should have zero rewards
            const user1Rewards = await compoundStrategy.getUserRewards(user1.address);
            const user2Rewards = await compoundStrategy.getUserRewards(user2.address);
            
            expect(user1Rewards).to.equal(0);
            expect(user2Rewards).to.equal(0);
        });
    });

    describe("Strategy Risk Management", function () {
        it("Should handle strategy pauses and resumptions", async function () {
            // Users deposit
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("1000"));
            await compoundStrategy.connect(user2).deposit(ethers.utils.parseEther("2000"));
            
            // Pause strategy
            await compoundStrategy.pause();
            expect(await compoundStrategy.paused()).to.be.true;
            
            // Users should not be able to deposit when paused
            await expect(
                compoundStrategy.connect(user3).deposit(ethers.utils.parseEther("500"))
            ).to.be.revertedWith("Pausable: paused");
            
            // Users should not be able to withdraw when paused
            await expect(
                compoundStrategy.connect(user1).withdraw(ethers.utils.parseEther("100"))
            ).to.be.revertedWith("Pausable: paused");
            
            // Resume strategy
            await compoundStrategy.unpause();
            expect(await compoundStrategy.paused()).to.be.false;
            
            // Now users can deposit and withdraw
            await compoundStrategy.connect(user3).deposit(ethers.utils.parseEther("500"));
            await compoundStrategy.connect(user1).withdraw(ethers.utils.parseEther("100"));
        });

        it("Should handle emergency withdrawals", async function () {
            // Users deposit
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("1000"));
            await compoundStrategy.connect(user2).deposit(ethers.utils.parseEther("2000"));
            
            // Emergency withdraw
            const tx = await compoundStrategy.emergencyWithdraw();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'EmergencyWithdraw');
            
            expect(event.args.amount).to.equal(ethers.utils.parseEther("3000"));
            
            // Contract should have zero balance
            const contractBalance = await assetToken.balanceOf(compoundStrategy.address);
            expect(contractBalance).to.equal(0);
        });
    });

    describe("Strategy Parameter Updates", function () {
        it("Should allow owner to update strategy parameters", async function () {
            // Update Compound strategy parameters
            const newMinDeposit = ethers.utils.parseEther("200");
            const newMaxDeposit = ethers.utils.parseEther("2000000");
            const newExpectedReturn = 600; // 6%
            
            await compoundStrategy.updateStrategyParameters(
                newMinDeposit,
                newMaxDeposit,
                newExpectedReturn
            );
            
            // Verify updates
            expect(await compoundStrategy.minimumDeposit()).to.equal(newMinDeposit);
            expect(await compoundStrategy.maximumDeposit()).to.equal(newMaxDeposit);
            expect(await compoundStrategy.expectedReturn()).to.equal(newExpectedReturn);
        });

        it("Should not allow invalid parameter updates", async function () {
            // Try to set minimum deposit greater than maximum
            await expect(
                compoundStrategy.updateStrategyParameters(
                    ethers.utils.parseEther("2000"), // min
                    ethers.utils.parseEther("1000"), // max
                    600
                )
            ).to.be.revertedWith("CompoundStrategy: invalid deposit limits");
        });

        it("Should not allow non-owner to update parameters", async function () {
            await expect(
                compoundStrategy.connect(user1).updateStrategyParameters(
                    ethers.utils.parseEther("200"),
                    ethers.utils.parseEther("2000000"),
                    600
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Strategy Market Analytics", function () {
        it("Should track strategy market performance", async function () {
            // Add multiple strategies
            await strategyMarket.addStrategy(1, "Strategy 1", "Description 1", ethers.utils.parseEther("10"), ethers.utils.parseEther("5"));
            await strategyMarket.addStrategy(2, "Strategy 2", "Description 2", ethers.utils.parseEther("15"), ethers.utils.parseEther("8"));
            await strategyMarket.addStrategy(3, "Strategy 3", "Description 3", ethers.utils.parseEther("20"), ethers.utils.parseEther("10"));
            
            // Users subscribe to different strategies
            await strategyMarket.connect(user1).subscribe(1, ethers.utils.parseEther("100"));
            await strategyMarket.connect(user1).subscribe(2, ethers.utils.parseEther("150"));
            await strategyMarket.connect(user2).subscribe(1, ethers.utils.parseEther("200"));
            await strategyMarket.connect(user2).subscribe(3, ethers.utils.parseEther("300"));
            await strategyMarket.connect(user3).subscribe(2, ethers.utils.parseEther("250"));
            await strategyMarket.connect(user3).subscribe(3, ethers.utils.parseEther("400"));
            
            // Get market statistics
            const totalStrategies = await strategyMarket.getTotalStrategies();
            const totalSubscriptions = await strategyMarket.getTotalSubscriptions();
            const totalRevenue = await strategyMarket.getTotalRevenue();
            
            expect(totalStrategies).to.equal(3);
            expect(totalSubscriptions).to.equal(6);
            expect(totalRevenue).to.be.gt(0);
        });

        it("Should track user subscription history", async function () {
            // Add strategy
            await strategyMarket.addStrategy(1, "Test Strategy", "Test description", ethers.utils.parseEther("10"), ethers.utils.parseEther("5"));
            
            // User subscribes
            await strategyMarket.connect(user1).subscribe(1, ethers.utils.parseEther("100"));
            
            // User pays monthly fee
            await strategyMarket.connect(user1).payMonthlyFee(1);
            
            // Get user subscription history
            const subscription = await strategyMarket.subscriptions(user1.address, 1);
            expect(subscription.amount).to.equal(ethers.utils.parseEther("100"));
            expect(subscription.isActive).to.be.true;
            expect(subscription.lastPayment).to.be.gt(0);
        });
    });

    describe("Strategy Cross-Integration", function () {
        it("Should allow users to participate in multiple strategies simultaneously", async function () {
            // User deposits in both strategies
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("1000"));
            await liquidityMiningStrategy.connect(user1).deposit(ethers.utils.parseEther("500"));
            
            // User subscribes to strategy market
            await strategyMarket.addStrategy(1, "Test Strategy", "Test description", ethers.utils.parseEther("10"), ethers.utils.parseEther("5"));
            await strategyMarket.connect(user1).subscribe(1, ethers.utils.parseEther("100"));
            
            // Verify all participations
            const compoundDeposit = await compoundStrategy.userDeposits(user1.address);
            const liquidityDeposit = await liquidityMiningStrategy.userDeposits(user1.address);
            const subscription = await strategyMarket.subscriptions(user1.address, 1);
            
            expect(compoundDeposit.amount).to.equal(ethers.utils.parseEther("1000"));
            expect(liquidityDeposit.amount).to.equal(ethers.utils.parseEther("500"));
            expect(subscription.amount).to.equal(ethers.utils.parseEther("100"));
            expect(subscription.isActive).to.be.true;
        });

        it("Should handle strategy interactions and dependencies", async function () {
            // User deposits in Compound strategy
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("1000"));
            
            // User uses some of the Compound rewards to invest in Liquidity Mining
            // This simulates a real-world scenario where users rebalance between strategies
            await liquidityMiningStrategy.connect(user1).deposit(ethers.utils.parseEther("200"));
            
            // Verify both strategies have the user
            const compoundDeposit = await compoundStrategy.userDeposits(user1.address);
            const liquidityDeposit = await liquidityMiningStrategy.userDeposits(user1.address);
            
            expect(compoundDeposit.amount).to.equal(ethers.utils.parseEther("1000"));
            expect(liquidityDeposit.amount).to.equal(ethers.utils.parseEther("200"));
        });
    });

    describe("Strategy Error Handling", function () {
        it("Should handle insufficient balance errors gracefully", async function () {
            // Try to deposit more than user has
            await expect(
                compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("20000"))
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });

        it("Should handle withdrawal errors gracefully", async function () {
            // Try to withdraw without depositing
            await expect(
                compoundStrategy.connect(user1).withdraw(ethers.utils.parseEther("100"))
            ).to.be.revertedWith("CompoundStrategy: insufficient balance");
        });

        it("Should handle subscription errors gracefully", async function () {
            // Try to subscribe to non-existent strategy
            await expect(
                strategyMarket.connect(user1).subscribe(999, ethers.utils.parseEther("100"))
            ).to.be.revertedWith("StrategyMarket: strategy not found");
        });

        it("Should handle fee payment errors gracefully", async function () {
            // Try to pay fee without subscription
            await expect(
                strategyMarket.connect(user1).payMonthlyFee(1)
            ).to.be.revertedWith("StrategyMarket: subscription not found");
        });
    });

    describe("Strategy Performance Metrics", function () {
        it("Should calculate strategy performance metrics", async function () {
            // Users deposit in Compound strategy
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("1000"));
            await compoundStrategy.connect(user2).deposit(ethers.utils.parseEther("2000"));
            
            // Get strategy statistics
            const stats = await compoundStrategy.getStrategyStatistics();
            
            expect(stats.totalDeposits).to.equal(ethers.utils.parseEther("3000"));
            expect(stats.totalUsers).to.equal(2);
            expect(stats.totalRewards).to.equal(0);
            expect(stats.averageDeposit).to.equal(ethers.utils.parseEther("1500"));
        });

        it("Should track strategy user distribution", async function () {
            // Users deposit different amounts
            await compoundStrategy.connect(user1).deposit(ethers.utils.parseEther("500"));
            await compoundStrategy.connect(user2).deposit(ethers.utils.parseEther("1000"));
            await compoundStrategy.connect(user3).deposit(ethers.utils.parseEther("2000"));
            
            // Get user count by deposit range
            const lowRange = await compoundStrategy.getUserCountByRange(0, ethers.utils.parseEther("1000"));
            const highRange = await compoundStrategy.getUserCountByRange(ethers.utils.parseEther("1000"), ethers.utils.parseEther("5000"));
            
            expect(lowRange).to.equal(1); // user1
            expect(highRange).to.equal(2); // user2 and user3
        });
    });
});