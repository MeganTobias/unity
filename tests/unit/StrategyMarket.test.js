const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StrategyMarket", function () {
    let strategyMarket;
    let assetToken;
    let owner;
    let creator;
    let subscriber;
    let addr3;

    beforeEach(async function () {
        [owner, creator, subscriber, addr3] = await ethers.getSigners();
        
        // Deploy AssetToken
        const AssetToken = await ethers.getContractFactory("AssetToken");
        assetToken = await AssetToken.deploy();
        await assetToken.deployed();
        
        // Deploy StrategyMarket
        const StrategyMarket = await ethers.getContractFactory("StrategyMarket");
        strategyMarket = await StrategyMarket.deploy(assetToken.address, owner.address);
        await strategyMarket.deployed();
        
        // Mint tokens to users
        await assetToken.mint(creator.address, ethers.utils.parseEther("10000"));
        await assetToken.mint(subscriber.address, ethers.utils.parseEther("10000"));
        await assetToken.mint(addr3.address, ethers.utils.parseEther("10000"));
        
        // Approve strategy market to spend tokens
        await assetToken.connect(creator).approve(strategyMarket.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(subscriber).approve(strategyMarket.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(addr3).approve(strategyMarket.address, ethers.utils.parseEther("10000"));
    });

    describe("Deployment", function () {
        it("Should set the correct asset token", async function () {
            expect(await strategyMarket.assetToken()).to.equal(assetToken.address);
        });

        it("Should set the correct fee recipient", async function () {
            expect(await strategyMarket.feeRecipient()).to.equal(owner.address);
        });

        it("Should initialize with zero strategy counter", async function () {
            expect(await strategyMarket.strategyCounter()).to.equal(0);
        });
    });

    describe("Strategy Creation", function () {
        it("Should allow users to create strategies", async function () {
            const strategyContract = addr3.address;
            const name = "Test Strategy";
            const description = "A test strategy for yield farming";
            const category = "Yield Farming";
            const subscriptionFee = ethers.utils.parseEther("100"); // 100 tokens per year
            const performanceFee = 500; // 5%
            const isWhitelistOnly = false;
            
            const tx = await strategyMarket.connect(creator).createStrategy(
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
            expect(event.args.creator).to.equal(creator.address);
            expect(event.args.name).to.equal(name);
        });

        it("Should not allow creating strategy with zero address", async function () {
            await expect(
                strategyMarket.connect(creator).createStrategy(
                    ethers.constants.AddressZero,
                    "Test Strategy",
                    "Description",
                    "Category",
                    ethers.utils.parseEther("100"),
                    500,
                    false
                )
            ).to.be.revertedWith("StrategyMarket: invalid strategy contract");
        });

        it("Should not allow performance fee above 10%", async function () {
            await expect(
                strategyMarket.connect(creator).createStrategy(
                    addr3.address,
                    "Test Strategy",
                    "Description",
                    "Category",
                    ethers.utils.parseEther("100"),
                    1100, // 11%
                    false
                )
            ).to.be.revertedWith("StrategyMarket: performance fee too high");
        });
    });

    describe("Strategy Subscription", function () {
        let strategyId;

        beforeEach(async function () {
            // Create a strategy first
            const tx = await strategyMarket.connect(creator).createStrategy(
                addr3.address,
                "Test Strategy",
                "A test strategy",
                "Yield Farming",
                ethers.utils.parseEther("100"),
                500,
                false
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyCreated');
            strategyId = event.args.strategyId;
        });

        it("Should allow users to subscribe to strategies", async function () {
            const duration = 30 * 24 * 60 * 60; // 30 days
            
            const tx = await strategyMarket.connect(subscriber).subscribeToStrategy(strategyId, duration);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategySubscribed');
            
            expect(event.args.user).to.equal(subscriber.address);
            expect(event.args.strategyId).to.equal(strategyId);
        });

        it("Should not allow subscription to whitelist-only strategy without whitelist", async function () {
            // Create whitelist-only strategy
            const tx = await strategyMarket.connect(creator).createStrategy(
                addr3.address,
                "Whitelist Strategy",
                "A whitelist strategy",
                "Yield Farming",
                ethers.utils.parseEther("100"),
                500,
                true
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyCreated');
            const whitelistStrategyId = event.args.strategyId;
            
            const duration = 30 * 24 * 60 * 60;
            
            await expect(
                strategyMarket.connect(subscriber).subscribeToStrategy(whitelistStrategyId, duration)
            ).to.be.revertedWith("StrategyMarket: not whitelisted");
        });

        it("Should allow subscription to whitelist-only strategy with whitelist", async function () {
            // Create whitelist-only strategy
            const tx = await strategyMarket.connect(creator).createStrategy(
                addr3.address,
                "Whitelist Strategy",
                "A whitelist strategy",
                "Yield Farming",
                ethers.utils.parseEther("100"),
                500,
                true
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyCreated');
            const whitelistStrategyId = event.args.strategyId;
            
            // Add subscriber to whitelist
            await strategyMarket.connect(creator).addToWhitelist(whitelistStrategyId, subscriber.address);
            
            const duration = 30 * 24 * 60 * 60;
            
            await strategyMarket.connect(subscriber).subscribeToStrategy(whitelistStrategyId, duration);
            
            const subscription = await strategyMarket.subscriptions(subscriber.address, whitelistStrategyId);
            expect(subscription.isActive).to.be.true;
        });

        it("Should not allow double subscription", async function () {
            const duration = 30 * 24 * 60 * 60;
            
            await strategyMarket.connect(subscriber).subscribeToStrategy(strategyId, duration);
            
            await expect(
                strategyMarket.connect(subscriber).subscribeToStrategy(strategyId, duration)
            ).to.be.revertedWith("StrategyMarket: already subscribed");
        });
    });

    describe("Strategy Management", function () {
        let strategyId;

        beforeEach(async function () {
            const tx = await strategyMarket.connect(creator).createStrategy(
                addr3.address,
                "Test Strategy",
                "A test strategy",
                "Yield Farming",
                ethers.utils.parseEther("100"),
                500,
                false
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyCreated');
            strategyId = event.args.strategyId;
        });

        it("Should allow strategy creator to update strategy", async function () {
            const newName = "Updated Strategy";
            const newDescription = "Updated description";
            const newSubscriptionFee = ethers.utils.parseEther("150");
            const newPerformanceFee = 600;
            
            await strategyMarket.connect(creator).updateStrategy(
                strategyId,
                newName,
                newDescription,
                newSubscriptionFee,
                newPerformanceFee
            );
            
            const strategy = await strategyMarket.strategies(strategyId);
            expect(strategy.name).to.equal(newName);
            expect(strategy.description).to.equal(newDescription);
            expect(strategy.subscriptionFee).to.equal(newSubscriptionFee);
            expect(strategy.performanceFee).to.equal(newPerformanceFee);
        });

        it("Should not allow non-creator to update strategy", async function () {
            await expect(
                strategyMarket.connect(subscriber).updateStrategy(
                    strategyId,
                    "Updated Strategy",
                    "Updated description",
                    ethers.utils.parseEther("150"),
                    600
                )
            ).to.be.revertedWith("StrategyMarket: not strategy creator");
        });

        it("Should allow strategy creator to deactivate strategy", async function () {
            await strategyMarket.connect(creator).deactivateStrategy(strategyId);
            
            const strategy = await strategyMarket.strategies(strategyId);
            expect(strategy.isActive).to.be.false;
        });
    });
});
