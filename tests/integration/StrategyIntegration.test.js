const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Strategy Integration", function () {
    let assetManager;
    let strategyMarket;
    let yieldStrategy;
    let compoundStrategy;
    let assetToken;
    let owner;
    let strategyCreator;
    let user;

    beforeEach(async function () {
        [owner, strategyCreator, user] = await ethers.getSigners();
        
        // Deploy AssetToken
        const AssetToken = await ethers.getContractFactory("AssetToken");
        assetToken = await AssetToken.deploy();
        await assetToken.deployed();
        
        // Deploy AssetManager
        const AssetManager = await ethers.getContractFactory("AssetManager");
        assetManager = await AssetManager.deploy(assetToken.address, owner.address);
        await assetManager.deployed();
        
        // Deploy StrategyMarket
        const StrategyMarket = await ethers.getContractFactory("StrategyMarket");
        strategyMarket = await StrategyMarket.deploy(assetToken.address, owner.address);
        await strategyMarket.deployed();
        
        // Deploy YieldStrategy
        const YieldStrategy = await ethers.getContractFactory("YieldStrategy");
        yieldStrategy = await YieldStrategy.deploy(
            "Test Yield Strategy",
            "A test yield farming strategy",
            assetToken.address,
            assetToken.address,
            500 // 5% performance fee
        );
        await yieldStrategy.deployed();
        
        // Deploy CompoundStrategy
        const CompoundStrategy = await ethers.getContractFactory("CompoundStrategy");
        compoundStrategy = await CompoundStrategy.deploy(
            assetToken.address, // Mock compound address
            assetToken.address, // Mock cToken address
            assetToken.address, // Mock underlying token
            ethers.utils.parseEther("1000"), // min liquidity
            ethers.utils.parseEther("100000") // max liquidity
        );
        await compoundStrategy.deployed();
        
        // Mint tokens
        await assetToken.mint(user.address, ethers.utils.parseEther("10000"));
        await assetToken.mint(strategyCreator.address, ethers.utils.parseEther("10000"));
        
        // Approve contracts
        await assetToken.connect(user).approve(assetManager.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(strategyCreator).approve(strategyMarket.address, ethers.utils.parseEther("10000"));
    });

    describe("Strategy Creation and Management", function () {
        it("Should allow users to create strategies in the marketplace", async function () {
            const strategyContract = yieldStrategy.address;
            const name = "Test Yield Strategy";
            const description = "A test strategy for yield farming";
            const category = "Yield Farming";
            const subscriptionFee = ethers.utils.parseEther("100");
            const performanceFee = 500;
            const isWhitelistOnly = false;
            
            const tx = await strategyMarket.connect(strategyCreator).createStrategy(
                strategyContract,
                name,
                description,
                category,
                subscriptionFee,
                performanceFee,
                isWhitelistOnly
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyCreated');
            
            expect(event.args.strategyId).to.equal(1);
            expect(event.args.creator).to.equal(strategyCreator.address);
        });

        it("Should allow users to subscribe to strategies", async function () {
            // First create a strategy
            await strategyMarket.connect(strategyCreator).createStrategy(
                yieldStrategy.address,
                "Test Strategy",
                "Description",
                "Category",
                ethers.utils.parseEther("100"),
                500,
                false
            );
            
            const duration = 30 * 24 * 60 * 60; // 30 days
            const totalCost = ethers.utils.parseEther("8.22"); // Approximate cost for 30 days
            
            await assetToken.connect(user).approve(strategyMarket.address, totalCost);
            
            const tx = await strategyMarket.connect(user).subscribeToStrategy(1, duration);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategySubscribed');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.strategyId).to.equal(1);
        });

        it("Should allow strategy creators to update their strategies", async function () {
            // Create strategy
            await strategyMarket.connect(strategyCreator).createStrategy(
                yieldStrategy.address,
                "Test Strategy",
                "Description",
                "Category",
                ethers.utils.parseEther("100"),
                500,
                false
            );
            
            // Update strategy
            const newName = "Updated Strategy";
            const newDescription = "Updated description";
            const newSubscriptionFee = ethers.utils.parseEther("150");
            const newPerformanceFee = 600;
            
            await strategyMarket.connect(strategyCreator).updateStrategy(
                1,
                newName,
                newDescription,
                newSubscriptionFee,
                newPerformanceFee
            );
            
            const strategy = await strategyMarket.strategies(1);
            expect(strategy.name).to.equal(newName);
            expect(strategy.description).to.equal(newDescription);
            expect(strategy.subscriptionFee).to.equal(newSubscriptionFee);
            expect(strategy.performanceFee).to.equal(newPerformanceFee);
        });
    });

    describe("Strategy Execution", function () {
        beforeEach(async function () {
            // Create a strategy
            await strategyMarket.connect(strategyCreator).createStrategy(
                yieldStrategy.address,
                "Test Strategy",
                "Description",
                "Category",
                ethers.utils.parseEther("100"),
                500,
                false
            );
        });

        it("Should allow users to deposit into strategies", async function () {
            const depositAmount = ethers.utils.parseEther("1000");
            
            await yieldStrategy.connect(user).deposit(depositAmount);
            
            const position = await yieldStrategy.getUserPosition(user.address);
            expect(position.depositAmount).to.equal(depositAmount);
        });

        it("Should allow users to withdraw from strategies", async function () {
            const depositAmount = ethers.utils.parseEther("1000");
            const withdrawAmount = ethers.utils.parseEther("500");
            
            // First deposit
            await yieldStrategy.connect(user).deposit(depositAmount);
            
            // Then withdraw
            await yieldStrategy.connect(user).withdraw(withdrawAmount);
            
            const position = await yieldStrategy.getUserPosition(user.address);
            expect(position.depositAmount).to.equal(depositAmount.sub(withdrawAmount));
        });

        it("Should allow users to harvest rewards", async function () {
            const depositAmount = ethers.utils.parseEther("1000");
            
            // Deposit first
            await yieldStrategy.connect(user).deposit(depositAmount);
            
            // Fast forward time to generate rewards
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
            await ethers.provider.send("evm_mine");
            
            // Harvest rewards
            await yieldStrategy.connect(user).harvest();
            
            const position = await yieldStrategy.getUserPosition(user.address);
            expect(position.lastUpdate).to.be.gt(0);
        });
    });

    describe("Strategy Performance", function () {
        it("Should track strategy performance metrics", async function () {
            const depositAmount = ethers.utils.parseEther("1000");
            
            // Deposit into strategy
            await yieldStrategy.connect(user).deposit(depositAmount);
            
            // Check strategy info
            const strategyInfo = await yieldStrategy.strategyInfo();
            expect(strategyInfo.totalDeposits).to.equal(depositAmount);
            expect(strategyInfo.isActive).to.be.true;
        });

        it("Should calculate pending rewards correctly", async function () {
            const depositAmount = ethers.utils.parseEther("1000");
            
            // Deposit
            await yieldStrategy.connect(user).deposit(depositAmount);
            
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]); // 12 hours
            await ethers.provider.send("evm_mine");
            
            // Check pending rewards
            const pendingRewards = await yieldStrategy.calculatePendingRewards(user.address);
            expect(pendingRewards).to.be.gt(0);
        });
    });

    describe("Strategy Pausing and Deactivation", function () {
        it("Should allow owner to pause strategies", async function () {
            await yieldStrategy.pause();
            expect(await yieldStrategy.paused()).to.be.true;
        });

        it("Should prevent operations when strategy is paused", async function () {
            await yieldStrategy.pause();
            
            const depositAmount = ethers.utils.parseEther("1000");
            
            await expect(
                yieldStrategy.connect(user).deposit(depositAmount)
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should allow owner to deactivate strategies", async function () {
            await yieldStrategy.deactivate();
            
            const strategyInfo = await yieldStrategy.strategyInfo();
            expect(strategyInfo.isActive).to.be.false;
        });
    });
});
