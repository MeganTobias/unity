const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldStrategy", function () {
    let yieldStrategy;
    let assetToken;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        
        // Deploy AssetToken
        const AssetToken = await ethers.getContractFactory("AssetToken");
        assetToken = await AssetToken.deploy();
        await assetToken.deployed();
        
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
        
        // Mint tokens to users
        await assetToken.mint(addr1.address, ethers.utils.parseEther("10000"));
        await assetToken.mint(addr2.address, ethers.utils.parseEther("10000"));
        
        // Approve strategy to spend tokens
        await assetToken.connect(addr1).approve(yieldStrategy.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(addr2).approve(yieldStrategy.address, ethers.utils.parseEther("10000"));
    });

    describe("Deployment", function () {
        it("Should set the correct strategy info", async function () {
            const strategyInfo = await yieldStrategy.strategyInfo();
            expect(strategyInfo.name).to.equal("Test Yield Strategy");
            expect(strategyInfo.description).to.equal("A test yield farming strategy");
            expect(strategyInfo.targetToken).to.equal(assetToken.address);
            expect(strategyInfo.rewardToken).to.equal(assetToken.address);
            expect(strategyInfo.performanceFee).to.equal(500);
            expect(strategyInfo.isActive).to.be.true;
        });

        it("Should set the correct owner", async function () {
            expect(await yieldStrategy.owner()).to.equal(owner.address);
        });
    });

    describe("Deposits", function () {
        it("Should allow users to deposit tokens", async function () {
            const depositAmount = ethers.utils.parseEther("1000");
            
            const tx = await yieldStrategy.connect(addr1).deposit(depositAmount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Deposit');
            
            expect(event.args.user).to.equal(addr1.address);
            expect(event.args.amount).to.equal(depositAmount);
            
            const position = await yieldStrategy.getUserPosition(addr1.address);
            expect(position.depositAmount).to.equal(depositAmount);
        });

        it("Should not allow zero amount deposits", async function () {
            await expect(
                yieldStrategy.connect(addr1).deposit(0)
            ).to.be.revertedWith("YieldStrategy: amount must be greater than 0");
        });

        it("Should not allow deposits when strategy is inactive", async function () {
            await yieldStrategy.deactivate();
            
            const depositAmount = ethers.utils.parseEther("1000");
            
            await expect(
                yieldStrategy.connect(addr1).deposit(depositAmount)
            ).to.be.revertedWith("YieldStrategy: strategy not active");
        });

        it("Should not allow deposits when strategy is paused", async function () {
            await yieldStrategy.pause();
            
            const depositAmount = ethers.utils.parseEther("1000");
            
            await expect(
                yieldStrategy.connect(addr1).deposit(depositAmount)
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Withdrawals", function () {
        beforeEach(async function () {
            // Deposit some tokens first
            const depositAmount = ethers.utils.parseEther("1000");
            await yieldStrategy.connect(addr1).deposit(depositAmount);
        });

        it("Should allow users to withdraw tokens", async function () {
            const withdrawAmount = ethers.utils.parseEther("500");
            
            const tx = await yieldStrategy.connect(addr1).withdraw(withdrawAmount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Withdraw');
            
            expect(event.args.user).to.equal(addr1.address);
            expect(event.args.amount).to.equal(withdrawAmount);
            
            const position = await yieldStrategy.getUserPosition(addr1.address);
            expect(position.depositAmount).to.equal(ethers.utils.parseEther("500"));
        });

        it("Should not allow withdrawal of more than deposited", async function () {
            const withdrawAmount = ethers.utils.parseEther("1500");
            
            await expect(
                yieldStrategy.connect(addr1).withdraw(withdrawAmount)
            ).to.be.revertedWith("YieldStrategy: insufficient balance");
        });

        it("Should not allow withdrawals when strategy is paused", async function () {
            await yieldStrategy.pause();
            
            const withdrawAmount = ethers.utils.parseEther("500");
            
            await expect(
                yieldStrategy.connect(addr1).withdraw(withdrawAmount)
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Harvesting", function () {
        beforeEach(async function () {
            // Deposit some tokens first
            const depositAmount = ethers.utils.parseEther("1000");
            await yieldStrategy.connect(addr1).deposit(depositAmount);
        });

        it("Should allow users to harvest rewards", async function () {
            // Fast forward time to generate rewards
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
            await ethers.provider.send("evm_mine");
            
            const tx = await yieldStrategy.connect(addr1).harvest();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Harvest');
            
            expect(event.args.user).to.equal(addr1.address);
            expect(event.args.reward).to.be.gt(0);
        });

        it("Should not allow harvesting when no rewards available", async function () {
            await expect(
                yieldStrategy.connect(addr1).harvest()
            ).to.be.revertedWith("YieldStrategy: no rewards to harvest");
        });

        it("Should not allow harvesting when strategy is paused", async function () {
            await yieldStrategy.pause();
            
            await expect(
                yieldStrategy.connect(addr1).harvest()
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Reward Calculation", function () {
        it("Should calculate pending rewards correctly", async function () {
            const depositAmount = ethers.utils.parseEther("1000");
            await yieldStrategy.connect(addr1).deposit(depositAmount);
            
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]); // 12 hours
            await ethers.provider.send("evm_mine");
            
            const pendingRewards = await yieldStrategy.calculatePendingRewards(addr1.address);
            expect(pendingRewards).to.be.gt(0);
        });

        it("Should return zero pending rewards for users with no deposits", async function () {
            const pendingRewards = await yieldStrategy.calculatePendingRewards(addr2.address);
            expect(pendingRewards).to.equal(0);
        });
    });

    describe("Strategy Management", function () {
        it("Should allow owner to update strategy info", async function () {
            const newName = "Updated Strategy";
            const newDescription = "Updated description";
            
            const tx = await yieldStrategy.updateStrategyInfo(newName, newDescription);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyUpdated');
            
            expect(event.args.name).to.equal(newName);
            expect(event.args.description).to.equal(newDescription);
            
            const strategyInfo = await yieldStrategy.strategyInfo();
            expect(strategyInfo.name).to.equal(newName);
            expect(strategyInfo.description).to.equal(newDescription);
        });

        it("Should allow owner to update performance fee", async function () {
            const newFee = 750; // 7.5%
            
            const tx = await yieldStrategy.updatePerformanceFee(newFee);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'PerformanceFeeUpdated');
            
            expect(event.args.newFee).to.equal(newFee);
            
            const strategyInfo = await yieldStrategy.strategyInfo();
            expect(strategyInfo.performanceFee).to.equal(newFee);
        });

        it("Should not allow performance fee above 10%", async function () {
            const newFee = 1100; // 11%
            
            await expect(
                yieldStrategy.updatePerformanceFee(newFee)
            ).to.be.revertedWith("YieldStrategy: fee too high");
        });

        it("Should not allow non-owner to update strategy info", async function () {
            await expect(
                yieldStrategy.connect(addr1).updateStrategyInfo("New Name", "New Description")
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to pause and unpause strategy", async function () {
            await yieldStrategy.pause();
            expect(await yieldStrategy.paused()).to.be.true;
            
            await yieldStrategy.unpause();
            expect(await yieldStrategy.paused()).to.be.false;
        });

        it("Should allow owner to deactivate strategy", async function () {
            await yieldStrategy.deactivate();
            
            const strategyInfo = await yieldStrategy.strategyInfo();
            expect(strategyInfo.isActive).to.be.false;
        });

        it("Should allow owner to activate strategy", async function () {
            await yieldStrategy.deactivate();
            await yieldStrategy.activate();
            
            const strategyInfo = await yieldStrategy.strategyInfo();
            expect(strategyInfo.isActive).to.be.true;
        });
    });

    describe("User Positions", function () {
        it("Should return correct user position data", async function () {
            const depositAmount = ethers.utils.parseEther("1000");
            await yieldStrategy.connect(addr1).deposit(depositAmount);
            
            const position = await yieldStrategy.getUserPosition(addr1.address);
            expect(position.depositAmount).to.equal(depositAmount);
            expect(position.lastUpdate).to.be.gt(0);
        });

        it("Should return zero position for users with no deposits", async function () {
            const position = await yieldStrategy.getUserPosition(addr2.address);
            expect(position.depositAmount).to.equal(0);
            expect(position.lastUpdate).to.equal(0);
        });
    });
});
