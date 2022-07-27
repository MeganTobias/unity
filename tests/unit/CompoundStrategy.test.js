const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CompoundStrategy", function () {
    let compoundStrategy;
    let mockCompound;
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
        
        // Deploy MockCompound
        const MockCompound = await ethers.getContractFactory("MockCompound");
        mockCompound = await MockCompound.deploy();
        await mockCompound.deployed();
        
        // Deploy CompoundStrategy
        const CompoundStrategy = await ethers.getContractFactory("CompoundStrategy");
        compoundStrategy = await CompoundStrategy.deploy(
            mockCompound.address,
            assetToken.address, // Mock cToken
            assetToken.address, // Mock underlying token
            ethers.utils.parseEther("1000"), // min liquidity
            ethers.utils.parseEther("100000") // max liquidity
        );
        await compoundStrategy.deployed();
        
        // Mint tokens to users
        await assetToken.mint(addr1.address, ethers.utils.parseEther("10000"));
        await assetToken.mint(addr2.address, ethers.utils.parseEther("10000"));
        
        // Approve strategy to spend tokens
        await assetToken.connect(addr1).approve(compoundStrategy.address, ethers.utils.parseEther("10000"));
        await assetToken.connect(addr2).approve(compoundStrategy.address, ethers.utils.parseEther("10000"));
    });

    describe("Deployment", function () {
        it("Should set the correct compound contract", async function () {
            expect(await compoundStrategy.compound()).to.equal(mockCompound.address);
        });

        it("Should set the correct strategy parameters", async function () {
            const params = await compoundStrategy.params();
            expect(params.cToken).to.equal(assetToken.address);
            expect(params.underlyingToken).to.equal(assetToken.address);
            expect(params.minLiquidity).to.equal(ethers.utils.parseEther("1000"));
            expect(params.maxLiquidity).to.equal(ethers.utils.parseEther("100000"));
            expect(params.isActive).to.be.true;
        });

        it("Should set the correct owner", async function () {
            expect(await compoundStrategy.owner()).to.equal(owner.address);
        });
    });

    describe("Deposits", function () {
        it("Should allow users to deposit tokens", async function () {
            const depositAmount = ethers.utils.parseEther("1000");
            
            const tx = await compoundStrategy.connect(addr1).deposit(depositAmount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Deposit');
            
            expect(event.args.user).to.equal(addr1.address);
            expect(event.args.amount).to.equal(depositAmount);
            
            const position = await compoundStrategy.getUserPosition(addr1.address);
            expect(position.depositAmount).to.equal(depositAmount);
            expect(position.cTokenBalance).to.equal(depositAmount);
        });

        it("Should not allow zero amount deposits", async function () {
            await expect(
                compoundStrategy.connect(addr1).deposit(0)
            ).to.be.revertedWith("CompoundStrategy: amount must be greater than 0");
        });

        it("Should not allow deposits when strategy is inactive", async function () {
            await compoundStrategy.deactivate();
            
            const depositAmount = ethers.utils.parseEther("1000");
            
            await expect(
                compoundStrategy.connect(addr1).deposit(depositAmount)
            ).to.be.revertedWith("CompoundStrategy: strategy not active");
        });

        it("Should not allow deposits when strategy is paused", async function () {
            await compoundStrategy.pause();
            
            const depositAmount = ethers.utils.parseEther("1000");
            
            await expect(
                compoundStrategy.connect(addr1).deposit(depositAmount)
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Withdrawals", function () {
        beforeEach(async function () {
            // Deposit some tokens first
            const depositAmount = ethers.utils.parseEther("1000");
            await compoundStrategy.connect(addr1).deposit(depositAmount);
        });

        it("Should allow users to withdraw tokens", async function () {
            const withdrawAmount = ethers.utils.parseEther("500");
            
            const tx = await compoundStrategy.connect(addr1).withdraw(withdrawAmount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Withdraw');
            
            expect(event.args.user).to.equal(addr1.address);
            expect(event.args.amount).to.equal(withdrawAmount);
            
            const position = await compoundStrategy.getUserPosition(addr1.address);
            expect(position.depositAmount).to.equal(ethers.utils.parseEther("500"));
        });

        it("Should not allow withdrawal of more than deposited", async function () {
            const withdrawAmount = ethers.utils.parseEther("1500");
            
            await expect(
                compoundStrategy.connect(addr1).withdraw(withdrawAmount)
            ).to.be.revertedWith("CompoundStrategy: insufficient balance");
        });

        it("Should not allow withdrawals when strategy is paused", async function () {
            await compoundStrategy.pause();
            
            const withdrawAmount = ethers.utils.parseEther("500");
            
            await expect(
                compoundStrategy.connect(addr1).withdraw(withdrawAmount)
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Compounding", function () {
        beforeEach(async function () {
            // Deposit some tokens first
            const depositAmount = ethers.utils.parseEther("1000");
            await compoundStrategy.connect(addr1).deposit(depositAmount);
        });

        it("Should allow compounding when interval has passed", async function () {
            // Fast forward time to pass compound interval
            await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]); // 25 hours
            await ethers.provider.send("evm_mine");
            
            const tx = await compoundStrategy.compound();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Compound');
            
            expect(event.args.user).to.equal(owner.address);
            expect(event.args.earned).to.be.gt(0);
        });

        it("Should not allow compounding before interval has passed", async function () {
            await expect(
                compoundStrategy.compound()
            ).to.be.revertedWith("CompoundStrategy: too early to compound");
        });

        it("Should not allow compounding when no interest earned", async function () {
            // Fast forward time but no interest earned
            await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]); // 25 hours
            await ethers.provider.send("evm_mine");
            
            // Mock compound to return no interest
            await mockCompound.setInterestRate(0);
            
            await expect(
                compoundStrategy.compound()
            ).to.be.revertedWith("CompoundStrategy: no interest to compound");
        });
    });

    describe("User Positions", function () {
        it("Should return correct user position data", async function () {
            const depositAmount = ethers.utils.parseEther("1000");
            await compoundStrategy.connect(addr1).deposit(depositAmount);
            
            const position = await compoundStrategy.getUserPosition(addr1.address);
            expect(position.depositAmount).to.equal(depositAmount);
            expect(position.cTokenBalance).to.equal(depositAmount);
            expect(position.lastCompound).to.be.gt(0);
        });

        it("Should return zero position for users with no deposits", async function () {
            const position = await compoundStrategy.getUserPosition(addr2.address);
            expect(position.depositAmount).to.equal(0);
            expect(position.cTokenBalance).to.equal(0);
            expect(position.lastCompound).to.equal(0);
        });
    });

    describe("Strategy Management", function () {
        it("Should allow owner to update strategy parameters", async function () {
            const newMinLiquidity = ethers.utils.parseEther("2000");
            const newMaxLiquidity = ethers.utils.parseEther("200000");
            const newRebalanceThreshold = 1500;
            
            const tx = await compoundStrategy.updateStrategyParams(
                newMinLiquidity,
                newMaxLiquidity,
                newRebalanceThreshold
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyUpdated');
            
            expect(event.args.cToken).to.equal(assetToken.address);
            expect(event.args.minLiquidity).to.equal(newMinLiquidity);
            expect(event.args.maxLiquidity).to.equal(newMaxLiquidity);
            
            const params = await compoundStrategy.params();
            expect(params.minLiquidity).to.equal(newMinLiquidity);
            expect(params.maxLiquidity).to.equal(newMaxLiquidity);
            expect(params.rebalanceThreshold).to.equal(newRebalanceThreshold);
        });

        it("Should allow owner to set compound interval", async function () {
            const newInterval = 12 * 60 * 60; // 12 hours
            await compoundStrategy.setCompoundInterval(newInterval);
            
            expect(await compoundStrategy.compoundInterval()).to.equal(newInterval);
        });

        it("Should not allow non-owner to update strategy parameters", async function () {
            await expect(
                compoundStrategy.connect(addr1).updateStrategyParams(
                    ethers.utils.parseEther("2000"),
                    ethers.utils.parseEther("200000"),
                    1500
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to pause and unpause", async function () {
            await compoundStrategy.pause();
            expect(await compoundStrategy.paused()).to.be.true;
            
            await compoundStrategy.unpause();
            expect(await compoundStrategy.paused()).to.be.false;
        });

        it("Should allow owner to deactivate strategy", async function () {
            await compoundStrategy.deactivate();
            
            const params = await compoundStrategy.params();
            expect(params.isActive).to.be.false;
        });
    });
});
