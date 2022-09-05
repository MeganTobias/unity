const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CompoundStrategy", function () {
    let compoundStrategy;
    let mockCompound;
    let assetToken;
    let owner;
    let user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        
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
            assetToken.address
        );
        await compoundStrategy.deployed();
        
        // Mint tokens to user
        await assetToken.mint(user.address, ethers.utils.parseEther("10000"));
        
        // Approve strategy to spend tokens
        await assetToken.connect(user).approve(compoundStrategy.address, ethers.utils.parseEther("10000"));
    });

    describe("Deployment", function () {
        it("Should set the correct compound protocol address", async function () {
            expect(await compoundStrategy.compoundProtocol()).to.equal(mockCompound.address);
        });

        it("Should set the correct asset token address", async function () {
            expect(await compoundStrategy.assetToken()).to.equal(assetToken.address);
        });

        it("Should set the correct owner", async function () {
            expect(await compoundStrategy.owner()).to.equal(owner.address);
        });

        it("Should initialize with zero total deposits", async function () {
            expect(await compoundStrategy.totalDeposits()).to.equal(0);
        });

        it("Should initialize with zero total rewards", async function () {
            expect(await compoundStrategy.totalRewards()).to.equal(0);
        });
    });

    describe("Deposit Functionality", function () {
        it("Should allow users to deposit assets", async function () {
            const amount = ethers.utils.parseEther("1000");
            
            const tx = await compoundStrategy.connect(user).deposit(amount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Deposit');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.amount).to.equal(amount);
            
            const userDeposit = await compoundStrategy.userDeposits(user.address);
            expect(userDeposit.amount).to.equal(amount);
            expect(userDeposit.timestamp).to.be.gt(0);
            
            expect(await compoundStrategy.totalDeposits()).to.equal(amount);
        });

        it("Should not allow zero amount deposits", async function () {
            await expect(
                compoundStrategy.connect(user).deposit(0)
            ).to.be.revertedWith("CompoundStrategy: amount must be greater than 0");
        });

        it("Should not allow deposits exceeding user balance", async function () {
            const amount = ethers.utils.parseEther("20000"); // More than user has
            
            await expect(
                compoundStrategy.connect(user).deposit(amount)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });

        it("Should not allow deposits when paused", async function () {
            await compoundStrategy.pause();
            
            await expect(
                compoundStrategy.connect(user).deposit(ethers.utils.parseEther("1000"))
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should update user deposit timestamp on subsequent deposits", async function () {
            const amount1 = ethers.utils.parseEther("500");
            const amount2 = ethers.utils.parseEther("300");
            
            // First deposit
            await compoundStrategy.connect(user).deposit(amount1);
            const firstDeposit = await compoundStrategy.userDeposits(user.address);
            const firstTimestamp = firstDeposit.timestamp;
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Second deposit
            await compoundStrategy.connect(user).deposit(amount2);
            const secondDeposit = await compoundStrategy.userDeposits(user.address);
            const secondTimestamp = secondDeposit.timestamp;
            
            expect(secondTimestamp).to.be.gt(firstTimestamp);
            expect(secondDeposit.amount).to.equal(amount1.add(amount2));
        });
    });

    describe("Withdrawal Functionality", function () {
        let depositAmount;

        beforeEach(async function () {
            depositAmount = ethers.utils.parseEther("1000");
            await compoundStrategy.connect(user).deposit(depositAmount);
        });

        it("Should allow users to withdraw their deposits", async function () {
            const withdrawAmount = ethers.utils.parseEther("500");
            
            const tx = await compoundStrategy.connect(user).withdraw(withdrawAmount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Withdrawal');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.amount).to.equal(withdrawAmount);
            
            const userDeposit = await compoundStrategy.userDeposits(user.address);
            expect(userDeposit.amount).to.equal(depositAmount.sub(withdrawAmount));
            
            expect(await compoundStrategy.totalDeposits()).to.equal(depositAmount.sub(withdrawAmount));
        });

        it("Should not allow withdrawing more than deposited", async function () {
            const withdrawAmount = ethers.utils.parseEther("1500"); // More than deposited
            
            await expect(
                compoundStrategy.connect(user).withdraw(withdrawAmount)
            ).to.be.revertedWith("CompoundStrategy: insufficient balance");
        });

        it("Should not allow zero amount withdrawals", async function () {
            await expect(
                compoundStrategy.connect(user).withdraw(0)
            ).to.be.revertedWith("CompoundStrategy: amount must be greater than 0");
        });

        it("Should not allow withdrawals when paused", async function () {
            await compoundStrategy.pause();
            
            await expect(
                compoundStrategy.connect(user).withdraw(ethers.utils.parseEther("500"))
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should allow full withdrawal", async function () {
            const tx = await compoundStrategy.connect(user).withdraw(depositAmount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Withdrawal');
            
            expect(event.args.amount).to.equal(depositAmount);
            
            const userDeposit = await compoundStrategy.userDeposits(user.address);
            expect(userDeposit.amount).to.equal(0);
            
            expect(await compoundStrategy.totalDeposits()).to.equal(0);
        });
    });

    describe("Compound Integration", function () {
        let depositAmount;

        beforeEach(async function () {
            depositAmount = ethers.utils.parseEther("1000");
            await compoundStrategy.connect(user).deposit(depositAmount);
        });

        it("Should supply assets to Compound protocol", async function () {
            const tx = await compoundStrategy.supplyToCompound(depositAmount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'SuppliedToCompound');
            
            expect(event.args.amount).to.equal(depositAmount);
            
            const compoundBalance = await mockCompound.balanceOf(compoundStrategy.address);
            expect(compoundBalance).to.equal(depositAmount);
        });

        it("Should not allow supplying more than available", async function () {
            const supplyAmount = ethers.utils.parseEther("1500"); // More than deposited
            
            await expect(
                compoundStrategy.supplyToCompound(supplyAmount)
            ).to.be.revertedWith("CompoundStrategy: insufficient balance");
        });

        it("Should allow only owner to supply to Compound", async function () {
            await expect(
                compoundStrategy.connect(user).supplyToCompound(depositAmount)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should redeem assets from Compound protocol", async function () {
            // First supply to Compound
            await compoundStrategy.supplyToCompound(depositAmount);
            
            // Then redeem
            const redeemAmount = ethers.utils.parseEther("500");
            const tx = await compoundStrategy.redeemFromCompound(redeemAmount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RedeemedFromCompound');
            
            expect(event.args.amount).to.equal(redeemAmount);
            
            const compoundBalance = await mockCompound.balanceOf(compoundStrategy.address);
            expect(compoundBalance).to.equal(depositAmount.sub(redeemAmount));
        });

        it("Should not allow redeeming more than supplied", async function () {
            await compoundStrategy.supplyToCompound(depositAmount);
            
            const redeemAmount = ethers.utils.parseEther("1500"); // More than supplied
            
            await expect(
                compoundStrategy.redeemFromCompound(redeemAmount)
            ).to.be.revertedWith("CompoundStrategy: insufficient compound balance");
        });

        it("Should allow only owner to redeem from Compound", async function () {
            await compoundStrategy.supplyToCompound(depositAmount);
            
            await expect(
                compoundStrategy.connect(user).redeemFromCompound(ethers.utils.parseEther("500"))
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Reward Collection", function () {
        let depositAmount;

        beforeEach(async function () {
            depositAmount = ethers.utils.parseEther("1000");
            await compoundStrategy.connect(user).deposit(depositAmount);
            await compoundStrategy.supplyToCompound(depositAmount);
        });

        it("Should collect rewards from Compound protocol", async function () {
            // Set up mock rewards
            const rewardAmount = ethers.utils.parseEther("50");
            await mockCompound.setRewards(compoundStrategy.address, rewardAmount);
            
            const tx = await compoundStrategy.collectRewards();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RewardsCollected');
            
            expect(event.args.amount).to.equal(rewardAmount);
            
            expect(await compoundStrategy.totalRewards()).to.equal(rewardAmount);
        });

        it("Should not collect rewards when none available", async function () {
            // No rewards set up
            const tx = await compoundStrategy.collectRewards();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RewardsCollected');
            
            expect(event.args.amount).to.equal(0);
        });

        it("Should allow only owner to collect rewards", async function () {
            await expect(
                compoundStrategy.connect(user).collectRewards()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should distribute rewards to users proportionally", async function () {
            // Set up rewards
            const rewardAmount = ethers.utils.parseEther("100");
            await mockCompound.setRewards(compoundStrategy.address, rewardAmount);
            
            // Collect rewards
            await compoundStrategy.collectRewards();
            
            // Distribute rewards
            const tx = await compoundStrategy.distributeRewards();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RewardsDistributed');
            
            expect(event.args.totalAmount).to.equal(rewardAmount);
            expect(event.args.userCount).to.equal(1);
        });

        it("Should not distribute rewards when none available", async function () {
            const tx = await compoundStrategy.distributeRewards();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RewardsDistributed');
            
            expect(event.args.totalAmount).to.equal(0);
        });

        it("Should allow only owner to distribute rewards", async function () {
            await expect(
                compoundStrategy.connect(user).distributeRewards()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("User Rewards", function () {
        let depositAmount;

        beforeEach(async function () {
            depositAmount = ethers.utils.parseEther("1000");
            await compoundStrategy.connect(user).deposit(depositAmount);
        });

        it("Should calculate user rewards correctly", async function () {
            const userRewards = await compoundStrategy.getUserRewards(user.address);
            expect(userRewards).to.equal(0); // No rewards yet
        });

        it("Should allow users to claim their rewards", async function () {
            // Set up some rewards
            const rewardAmount = ethers.utils.parseEther("50");
            await mockCompound.setRewards(compoundStrategy.address, rewardAmount);
            await compoundStrategy.collectRewards();
            await compoundStrategy.distributeRewards();
            
            const tx = await compoundStrategy.connect(user).claimRewards();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RewardsClaimed');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.amount).to.equal(rewardAmount);
        });

        it("Should not allow claiming zero rewards", async function () {
            await expect(
                compoundStrategy.connect(user).claimRewards()
            ).to.be.revertedWith("CompoundStrategy: no rewards to claim");
        });

        it("Should update user rewards after claiming", async function () {
            // Set up rewards
            const rewardAmount = ethers.utils.parseEther("50");
            await mockCompound.setRewards(compoundStrategy.address, rewardAmount);
            await compoundStrategy.collectRewards();
            await compoundStrategy.distributeRewards();
            
            // Claim rewards
            await compoundStrategy.connect(user).claimRewards();
            
            const userRewards = await compoundStrategy.getUserRewards(user.address);
            expect(userRewards).to.equal(0); // Should be zero after claiming
        });
    });

    describe("Strategy Information", function () {
        it("Should return correct strategy name", async function () {
            expect(await compoundStrategy.name()).to.equal("Compound Lending Strategy");
        });

        it("Should return correct strategy description", async function () {
            expect(await compoundStrategy.description()).to.equal("Automated lending strategy using Compound protocol");
        });

        it("Should return correct strategy type", async function () {
            expect(await compoundStrategy.strategyType()).to.equal(0); // LENDING
        });

        it("Should return correct risk level", async function () {
            expect(await compoundStrategy.riskLevel()).to.equal(1); // LOW
        });

        it("Should return correct expected return", async function () {
            expect(await compoundStrategy.expectedReturn()).to.equal(500); // 5%
        });

        it("Should return correct minimum deposit", async function () {
            expect(await compoundStrategy.minimumDeposit()).to.equal(ethers.utils.parseEther("100"));
        });

        it("Should return correct maximum deposit", async function () {
            expect(await compoundStrategy.maximumDeposit()).to.equal(ethers.utils.parseEther("1000000"));
        });
    });

    describe("Administrative Functions", function () {
        it("Should allow owner to update strategy parameters", async function () {
            const newMinDeposit = ethers.utils.parseEther("200");
            const newMaxDeposit = ethers.utils.parseEther("2000000");
            const newExpectedReturn = 600; // 6%
            
            const tx = await compoundStrategy.updateStrategyParameters(
                newMinDeposit,
                newMaxDeposit,
                newExpectedReturn
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyParametersUpdated');
            
            expect(event.args.minimumDeposit).to.equal(newMinDeposit);
            expect(event.args.maximumDeposit).to.equal(newMaxDeposit);
            expect(event.args.expectedReturn).to.equal(newExpectedReturn);
            
            expect(await compoundStrategy.minimumDeposit()).to.equal(newMinDeposit);
            expect(await compoundStrategy.maximumDeposit()).to.equal(newMaxDeposit);
            expect(await compoundStrategy.expectedReturn()).to.equal(newExpectedReturn);
        });

        it("Should not allow non-owner to update strategy parameters", async function () {
            await expect(
                compoundStrategy.connect(user).updateStrategyParameters(
                    ethers.utils.parseEther("200"),
                    ethers.utils.parseEther("2000000"),
                    600
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should not allow minimum deposit greater than maximum", async function () {
            await expect(
                compoundStrategy.updateStrategyParameters(
                    ethers.utils.parseEther("2000"), // min
                    ethers.utils.parseEther("1000"), // max
                    600
                )
            ).to.be.revertedWith("CompoundStrategy: invalid deposit limits");
        });

        it("Should allow owner to pause and unpause", async function () {
            await compoundStrategy.pause();
            expect(await compoundStrategy.paused()).to.be.true;
            
            await compoundStrategy.unpause();
            expect(await compoundStrategy.paused()).to.be.false;
        });

        it("Should not allow non-owner to pause", async function () {
            await expect(
                compoundStrategy.connect(user).pause()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Emergency Functions", function () {
        let depositAmount;

        beforeEach(async function () {
            depositAmount = ethers.utils.parseEther("1000");
            await compoundStrategy.connect(user).deposit(depositAmount);
        });

        it("Should allow owner to emergency withdraw", async function () {
            const tx = await compoundStrategy.emergencyWithdraw();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'EmergencyWithdraw');
            
            expect(event.args.amount).to.equal(depositAmount);
            
            const contractBalance = await assetToken.balanceOf(compoundStrategy.address);
            expect(contractBalance).to.equal(0);
        });

        it("Should not allow non-owner to emergency withdraw", async function () {
            await expect(
                compoundStrategy.connect(user).emergencyWithdraw()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to recover stuck tokens", async function () {
            // Send some tokens to contract
            await assetToken.mint(compoundStrategy.address, ethers.utils.parseEther("100"));
            
            const tx = await compoundStrategy.recoverStuckTokens(
                assetToken.address,
                ethers.utils.parseEther("100")
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StuckTokensRecovered');
            
            expect(event.args.token).to.equal(assetToken.address);
            expect(event.args.amount).to.equal(ethers.utils.parseEther("100"));
        });

        it("Should not allow non-owner to recover stuck tokens", async function () {
            await expect(
                compoundStrategy.connect(user).recoverStuckTokens(
                    assetToken.address,
                    ethers.utils.parseEther("100")
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Utility Functions", function () {
        it("Should return total users count", async function () {
            expect(await compoundStrategy.getTotalUsers()).to.equal(0);
            
            // Add a user
            await compoundStrategy.connect(user).deposit(ethers.utils.parseEther("1000"));
            expect(await compoundStrategy.getTotalUsers()).to.equal(1);
        });

        it("Should return user count by deposit range", async function () {
            // Add users with different deposit amounts
            await compoundStrategy.connect(user).deposit(ethers.utils.parseEther("500"));
            
            const [owner] = await ethers.getSigners();
            await assetToken.mint(owner.address, ethers.utils.parseEther("10000"));
            await assetToken.approve(compoundStrategy.address, ethers.utils.parseEther("10000"));
            await compoundStrategy.deposit(ethers.utils.parseEther("2000"));
            
            const lowRange = await compoundStrategy.getUserCountByRange(0, ethers.utils.parseEther("1000"));
            const highRange = await compoundStrategy.getUserCountByRange(ethers.utils.parseEther("1000"), ethers.utils.parseEther("5000"));
            
            expect(lowRange).to.equal(1);
            expect(highRange).to.equal(1);
        });

        it("Should return strategy statistics", async function () {
            await compoundStrategy.connect(user).deposit(ethers.utils.parseEther("1000"));
            
            const stats = await compoundStrategy.getStrategyStatistics();
            expect(stats.totalDeposits).to.equal(ethers.utils.parseEther("1000"));
            expect(stats.totalUsers).to.equal(1);
            expect(stats.totalRewards).to.equal(0);
            expect(stats.averageDeposit).to.equal(ethers.utils.parseEther("1000"));
        });
    });
});