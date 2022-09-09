const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiquidityMiningStrategy", function () {
    let liquidityMiningStrategy;
    let mockUniswapV2Router;
    let mockUniswapV2Factory;
    let assetToken;
    let owner;
    let user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        
        // Deploy AssetToken
        const AssetToken = await ethers.getContractFactory("AssetToken");
        assetToken = await AssetToken.deploy();
        await assetToken.deployed();
        
        // Deploy MockUniswapV2Router
        const MockUniswapV2Router = await ethers.getContractFactory("MockUniswapV2Router");
        mockUniswapV2Router = await MockUniswapV2Router.deploy();
        await mockUniswapV2Router.deployed();
        
        // Deploy MockUniswapV2Factory
        const MockUniswapV2Factory = await ethers.getContractFactory("MockUniswapV2Factory");
        mockUniswapV2Factory = await MockUniswapV2Factory.deploy();
        await mockUniswapV2Factory.deployed();
        
        // Deploy LiquidityMiningStrategy
        const LiquidityMiningStrategy = await ethers.getContractFactory("LiquidityMiningStrategy");
        liquidityMiningStrategy = await LiquidityMiningStrategy.deploy(
            mockUniswapV2Router.address,
            mockUniswapV2Factory.address,
            assetToken.address
        );
        await liquidityMiningStrategy.deployed();
        
        // Mint tokens to user
        await assetToken.mint(user.address, ethers.utils.parseEther("10000"));
        
        // Approve strategy to spend tokens
        await assetToken.connect(user).approve(liquidityMiningStrategy.address, ethers.utils.parseEther("10000"));
    });

    describe("Deployment", function () {
        it("Should set the correct Uniswap V2 router address", async function () {
            expect(await liquidityMiningStrategy.uniswapV2Router()).to.equal(mockUniswapV2Router.address);
        });

        it("Should set the correct Uniswap V2 factory address", async function () {
            expect(await liquidityMiningStrategy.uniswapV2Factory()).to.equal(mockUniswapV2Factory.address);
        });

        it("Should set the correct asset token address", async function () {
            expect(await liquidityMiningStrategy.assetToken()).to.equal(assetToken.address);
        });

        it("Should set the correct owner", async function () {
            expect(await liquidityMiningStrategy.owner()).to.equal(owner.address);
        });

        it("Should initialize with zero total deposits", async function () {
            expect(await liquidityMiningStrategy.totalDeposits()).to.equal(0);
        });

        it("Should initialize with zero total rewards", async function () {
            expect(await liquidityMiningStrategy.totalRewards()).to.equal(0);
        });
    });

    describe("Deposit Functionality", function () {
        it("Should allow users to deposit assets", async function () {
            const amount = ethers.utils.parseEther("1000");
            
            const tx = await liquidityMiningStrategy.connect(user).deposit(amount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Deposit');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.amount).to.equal(amount);
            
            const userDeposit = await liquidityMiningStrategy.userDeposits(user.address);
            expect(userDeposit.amount).to.equal(amount);
            expect(userDeposit.timestamp).to.be.gt(0);
            
            expect(await liquidityMiningStrategy.totalDeposits()).to.equal(amount);
        });

        it("Should not allow zero amount deposits", async function () {
            await expect(
                liquidityMiningStrategy.connect(user).deposit(0)
            ).to.be.revertedWith("LiquidityMiningStrategy: amount must be greater than 0");
        });

        it("Should not allow deposits exceeding user balance", async function () {
            const amount = ethers.utils.parseEther("20000"); // More than user has
            
            await expect(
                liquidityMiningStrategy.connect(user).deposit(amount)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });

        it("Should not allow deposits when paused", async function () {
            await liquidityMiningStrategy.pause();
            
            await expect(
                liquidityMiningStrategy.connect(user).deposit(ethers.utils.parseEther("1000"))
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should update user deposit timestamp on subsequent deposits", async function () {
            const amount1 = ethers.utils.parseEther("500");
            const amount2 = ethers.utils.parseEther("300");
            
            // First deposit
            await liquidityMiningStrategy.connect(user).deposit(amount1);
            const firstDeposit = await liquidityMiningStrategy.userDeposits(user.address);
            const firstTimestamp = firstDeposit.timestamp;
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Second deposit
            await liquidityMiningStrategy.connect(user).deposit(amount2);
            const secondDeposit = await liquidityMiningStrategy.userDeposits(user.address);
            const secondTimestamp = secondDeposit.timestamp;
            
            expect(secondTimestamp).to.be.gt(firstTimestamp);
            expect(secondDeposit.amount).to.equal(amount1.add(amount2));
        });
    });

    describe("Withdrawal Functionality", function () {
        let depositAmount;

        beforeEach(async function () {
            depositAmount = ethers.utils.parseEther("1000");
            await liquidityMiningStrategy.connect(user).deposit(depositAmount);
        });

        it("Should allow users to withdraw their deposits", async function () {
            const withdrawAmount = ethers.utils.parseEther("500");
            
            const tx = await liquidityMiningStrategy.connect(user).withdraw(withdrawAmount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Withdrawal');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.amount).to.equal(withdrawAmount);
            
            const userDeposit = await liquidityMiningStrategy.userDeposits(user.address);
            expect(userDeposit.amount).to.equal(depositAmount.sub(withdrawAmount));
            
            expect(await liquidityMiningStrategy.totalDeposits()).to.equal(depositAmount.sub(withdrawAmount));
        });

        it("Should not allow withdrawing more than deposited", async function () {
            const withdrawAmount = ethers.utils.parseEther("1500"); // More than deposited
            
            await expect(
                liquidityMiningStrategy.connect(user).withdraw(withdrawAmount)
            ).to.be.revertedWith("LiquidityMiningStrategy: insufficient balance");
        });

        it("Should not allow zero amount withdrawals", async function () {
            await expect(
                liquidityMiningStrategy.connect(user).withdraw(0)
            ).to.be.revertedWith("LiquidityMiningStrategy: amount must be greater than 0");
        });

        it("Should not allow withdrawals when paused", async function () {
            await liquidityMiningStrategy.pause();
            
            await expect(
                liquidityMiningStrategy.connect(user).withdraw(ethers.utils.parseEther("500"))
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should allow full withdrawal", async function () {
            const tx = await liquidityMiningStrategy.connect(user).withdraw(depositAmount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Withdrawal');
            
            expect(event.args.amount).to.equal(depositAmount);
            
            const userDeposit = await liquidityMiningStrategy.userDeposits(user.address);
            expect(userDeposit.amount).to.equal(0);
            
            expect(await liquidityMiningStrategy.totalDeposits()).to.equal(0);
        });
    });

    describe("Liquidity Provision", function () {
        let depositAmount;

        beforeEach(async function () {
            depositAmount = ethers.utils.parseEther("1000");
            await liquidityMiningStrategy.connect(user).deposit(depositAmount);
        });

        it("Should add liquidity to Uniswap V2", async function () {
            const tokenAmount = ethers.utils.parseEther("500");
            const ethAmount = ethers.utils.parseEther("1");
            const minTokenAmount = ethers.utils.parseEther("490");
            const minEthAmount = ethers.utils.parseEther("0.95");
            
            const tx = await liquidityMiningStrategy.addLiquidity(
                tokenAmount,
                ethAmount,
                minTokenAmount,
                minEthAmount
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'LiquidityAdded');
            
            expect(event.args.tokenAmount).to.equal(tokenAmount);
            expect(event.args.ethAmount).to.equal(ethAmount);
            
            const liquidityBalance = await mockUniswapV2Router.balanceOf(compoundStrategy.address);
            expect(liquidityBalance).to.equal(tokenAmount.add(ethAmount));
        });

        it("Should not allow adding liquidity with zero token amount", async function () {
            const ethAmount = ethers.utils.parseEther("1");
            
            await expect(
                liquidityMiningStrategy.addLiquidity(0, ethAmount, 0, ethers.utils.parseEther("0.95"))
            ).to.be.revertedWith("LiquidityMiningStrategy: invalid amounts");
        });

        it("Should not allow adding liquidity with zero ETH amount", async function () {
            const tokenAmount = ethers.utils.parseEther("500");
            
            await expect(
                liquidityMiningStrategy.addLiquidity(tokenAmount, 0, ethers.utils.parseEther("490"), 0)
            ).to.be.revertedWith("LiquidityMiningStrategy: invalid amounts");
        });

        it("Should not allow adding liquidity exceeding available balance", async function () {
            const tokenAmount = ethers.utils.parseEther("1500"); // More than deposited
            const ethAmount = ethers.utils.parseEther("1");
            
            await expect(
                liquidityMiningStrategy.addLiquidity(
                    tokenAmount,
                    ethAmount,
                    ethers.utils.parseEther("1450"),
                    ethers.utils.parseEther("0.95")
                )
            ).to.be.revertedWith("LiquidityMiningStrategy: insufficient balance");
        });

        it("Should allow only owner to add liquidity", async function () {
            const tokenAmount = ethers.utils.parseEther("500");
            const ethAmount = ethers.utils.parseEther("1");
            
            await expect(
                liquidityMiningStrategy.connect(user).addLiquidity(
                    tokenAmount,
                    ethAmount,
                    ethers.utils.parseEther("490"),
                    ethers.utils.parseEther("0.95")
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should remove liquidity from Uniswap V2", async function () {
            // First add liquidity
            const tokenAmount = ethers.utils.parseEther("500");
            const ethAmount = ethers.utils.parseEther("1");
            await liquidityMiningStrategy.addLiquidity(
                tokenAmount,
                ethAmount,
                ethers.utils.parseEther("490"),
                ethers.utils.parseEther("0.95")
            );
            
            // Then remove liquidity
            const liquidityAmount = ethers.utils.parseEther("200");
            const minTokenAmount = ethers.utils.parseEther("190");
            const minEthAmount = ethers.utils.parseEther("0.38");
            
            const tx = await liquidityMiningStrategy.removeLiquidity(
                liquidityAmount,
                minTokenAmount,
                minEthAmount
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'LiquidityRemoved');
            
            expect(event.args.liquidityAmount).to.equal(liquidityAmount);
            
            const liquidityBalance = await mockUniswapV2Router.balanceOf(compoundStrategy.address);
            expect(liquidityBalance).to.equal(tokenAmount.add(ethAmount).sub(liquidityAmount));
        });

        it("Should not allow removing more liquidity than available", async function () {
            const tokenAmount = ethers.utils.parseEther("500");
            const ethAmount = ethers.utils.parseEther("1");
            await liquidityMiningStrategy.addLiquidity(
                tokenAmount,
                ethAmount,
                ethers.utils.parseEther("490"),
                ethers.utils.parseEther("0.95")
            );
            
            const liquidityAmount = ethers.utils.parseEther("1000"); // More than available
            
            await expect(
                liquidityMiningStrategy.removeLiquidity(
                    liquidityAmount,
                    ethers.utils.parseEther("950"),
                    ethers.utils.parseEther("1.9")
                )
            ).to.be.revertedWith("LiquidityMiningStrategy: insufficient liquidity");
        });

        it("Should allow only owner to remove liquidity", async function () {
            await expect(
                liquidityMiningStrategy.connect(user).removeLiquidity(
                    ethers.utils.parseEther("100"),
                    ethers.utils.parseEther("95"),
                    ethers.utils.parseEther("0.19")
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Reward Collection", function () {
        let depositAmount;

        beforeEach(async function () {
            depositAmount = ethers.utils.parseEther("1000");
            await liquidityMiningStrategy.connect(user).deposit(depositAmount);
        });

        it("Should collect rewards from liquidity mining", async function () {
            // Set up mock rewards
            const rewardAmount = ethers.utils.parseEther("50");
            await mockUniswapV2Router.setRewards(compoundStrategy.address, rewardAmount);
            
            const tx = await liquidityMiningStrategy.collectRewards();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RewardsCollected');
            
            expect(event.args.amount).to.equal(rewardAmount);
            
            expect(await liquidityMiningStrategy.totalRewards()).to.equal(rewardAmount);
        });

        it("Should not collect rewards when none available", async function () {
            // No rewards set up
            const tx = await liquidityMiningStrategy.collectRewards();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RewardsCollected');
            
            expect(event.args.amount).to.equal(0);
        });

        it("Should allow only owner to collect rewards", async function () {
            await expect(
                liquidityMiningStrategy.connect(user).collectRewards()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should distribute rewards to users proportionally", async function () {
            // Set up rewards
            const rewardAmount = ethers.utils.parseEther("100");
            await mockUniswapV2Router.setRewards(compoundStrategy.address, rewardAmount);
            
            // Collect rewards
            await liquidityMiningStrategy.collectRewards();
            
            // Distribute rewards
            const tx = await liquidityMiningStrategy.distributeRewards();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RewardsDistributed');
            
            expect(event.args.totalAmount).to.equal(rewardAmount);
            expect(event.args.userCount).to.equal(1);
        });

        it("Should not distribute rewards when none available", async function () {
            const tx = await liquidityMiningStrategy.distributeRewards();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RewardsDistributed');
            
            expect(event.args.totalAmount).to.equal(0);
        });

        it("Should allow only owner to distribute rewards", async function () {
            await expect(
                liquidityMiningStrategy.connect(user).distributeRewards()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("User Rewards", function () {
        let depositAmount;

        beforeEach(async function () {
            depositAmount = ethers.utils.parseEther("1000");
            await liquidityMiningStrategy.connect(user).deposit(depositAmount);
        });

        it("Should calculate user rewards correctly", async function () {
            const userRewards = await liquidityMiningStrategy.getUserRewards(user.address);
            expect(userRewards).to.equal(0); // No rewards yet
        });

        it("Should allow users to claim their rewards", async function () {
            // Set up some rewards
            const rewardAmount = ethers.utils.parseEther("50");
            await mockUniswapV2Router.setRewards(compoundStrategy.address, rewardAmount);
            await liquidityMiningStrategy.collectRewards();
            await liquidityMiningStrategy.distributeRewards();
            
            const tx = await liquidityMiningStrategy.connect(user).claimRewards();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RewardsClaimed');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.amount).to.equal(rewardAmount);
        });

        it("Should not allow claiming zero rewards", async function () {
            await expect(
                liquidityMiningStrategy.connect(user).claimRewards()
            ).to.be.revertedWith("LiquidityMiningStrategy: no rewards to claim");
        });

        it("Should update user rewards after claiming", async function () {
            // Set up rewards
            const rewardAmount = ethers.utils.parseEther("50");
            await mockUniswapV2Router.setRewards(compoundStrategy.address, rewardAmount);
            await liquidityMiningStrategy.collectRewards();
            await liquidityMiningStrategy.distributeRewards();
            
            // Claim rewards
            await liquidityMiningStrategy.connect(user).claimRewards();
            
            const userRewards = await liquidityMiningStrategy.getUserRewards(user.address);
            expect(userRewards).to.equal(0); // Should be zero after claiming
        });
    });

    describe("Strategy Information", function () {
        it("Should return correct strategy name", async function () {
            expect(await liquidityMiningStrategy.name()).to.equal("Liquidity Mining Strategy");
        });

        it("Should return correct strategy description", async function () {
            expect(await liquidityMiningStrategy.description()).to.equal("Automated liquidity mining strategy using Uniswap V2");
        });

        it("Should return correct strategy type", async function () {
            expect(await liquidityMiningStrategy.strategyType()).to.equal(1); // LIQUIDITY_MINING
        });

        it("Should return correct risk level", async function () {
            expect(await liquidityMiningStrategy.riskLevel()).to.equal(2); // MEDIUM
        });

        it("Should return correct expected return", async function () {
            expect(await liquidityMiningStrategy.expectedReturn()).to.equal(800); // 8%
        });

        it("Should return correct minimum deposit", async function () {
            expect(await liquidityMiningStrategy.minimumDeposit()).to.equal(ethers.utils.parseEther("200"));
        });

        it("Should return correct maximum deposit", async function () {
            expect(await liquidityMiningStrategy.maximumDeposit()).to.equal(ethers.utils.parseEther("2000000"));
        });
    });

    describe("Administrative Functions", function () {
        it("Should allow owner to update strategy parameters", async function () {
            const newMinDeposit = ethers.utils.parseEther("300");
            const newMaxDeposit = ethers.utils.parseEther("3000000");
            const newExpectedReturn = 900; // 9%
            
            const tx = await liquidityMiningStrategy.updateStrategyParameters(
                newMinDeposit,
                newMaxDeposit,
                newExpectedReturn
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StrategyParametersUpdated');
            
            expect(event.args.minimumDeposit).to.equal(newMinDeposit);
            expect(event.args.maximumDeposit).to.equal(newMaxDeposit);
            expect(event.args.expectedReturn).to.equal(newExpectedReturn);
            
            expect(await liquidityMiningStrategy.minimumDeposit()).to.equal(newMinDeposit);
            expect(await liquidityMiningStrategy.maximumDeposit()).to.equal(newMaxDeposit);
            expect(await liquidityMiningStrategy.expectedReturn()).to.equal(newExpectedReturn);
        });

        it("Should not allow non-owner to update strategy parameters", async function () {
            await expect(
                liquidityMiningStrategy.connect(user).updateStrategyParameters(
                    ethers.utils.parseEther("300"),
                    ethers.utils.parseEther("3000000"),
                    900
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should not allow minimum deposit greater than maximum", async function () {
            await expect(
                liquidityMiningStrategy.updateStrategyParameters(
                    ethers.utils.parseEther("3000"), // min
                    ethers.utils.parseEther("2000"), // max
                    900
                )
            ).to.be.revertedWith("LiquidityMiningStrategy: invalid deposit limits");
        });

        it("Should allow owner to pause and unpause", async function () {
            await liquidityMiningStrategy.pause();
            expect(await liquidityMiningStrategy.paused()).to.be.true;
            
            await liquidityMiningStrategy.unpause();
            expect(await liquidityMiningStrategy.paused()).to.be.false;
        });

        it("Should not allow non-owner to pause", async function () {
            await expect(
                liquidityMiningStrategy.connect(user).pause()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Emergency Functions", function () {
        let depositAmount;

        beforeEach(async function () {
            depositAmount = ethers.utils.parseEther("1000");
            await liquidityMiningStrategy.connect(user).deposit(depositAmount);
        });

        it("Should allow owner to emergency withdraw", async function () {
            const tx = await liquidityMiningStrategy.emergencyWithdraw();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'EmergencyWithdraw');
            
            expect(event.args.amount).to.equal(depositAmount);
            
            const contractBalance = await assetToken.balanceOf(compoundStrategy.address);
            expect(contractBalance).to.equal(0);
        });

        it("Should not allow non-owner to emergency withdraw", async function () {
            await expect(
                liquidityMiningStrategy.connect(user).emergencyWithdraw()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to recover stuck tokens", async function () {
            // Send some tokens to contract
            await assetToken.mint(compoundStrategy.address, ethers.utils.parseEther("100"));
            
            const tx = await liquidityMiningStrategy.recoverStuckTokens(
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
                liquidityMiningStrategy.connect(user).recoverStuckTokens(
                    assetToken.address,
                    ethers.utils.parseEther("100")
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Utility Functions", function () {
        it("Should return total users count", async function () {
            expect(await liquidityMiningStrategy.getTotalUsers()).to.equal(0);
            
            // Add a user
            await liquidityMiningStrategy.connect(user).deposit(ethers.utils.parseEther("1000"));
            expect(await liquidityMiningStrategy.getTotalUsers()).to.equal(1);
        });

        it("Should return user count by deposit range", async function () {
            // Add users with different deposit amounts
            await liquidityMiningStrategy.connect(user).deposit(ethers.utils.parseEther("500"));
            
            const [owner] = await ethers.getSigners();
            await assetToken.mint(owner.address, ethers.utils.parseEther("10000"));
            await assetToken.approve(compoundStrategy.address, ethers.utils.parseEther("10000"));
            await liquidityMiningStrategy.deposit(ethers.utils.parseEther("2000"));
            
            const lowRange = await liquidityMiningStrategy.getUserCountByRange(0, ethers.utils.parseEther("1000"));
            const highRange = await liquidityMiningStrategy.getUserCountByRange(ethers.utils.parseEther("1000"), ethers.utils.parseEther("5000"));
            
            expect(lowRange).to.equal(1);
            expect(highRange).to.equal(1);
        });

        it("Should return strategy statistics", async function () {
            await liquidityMiningStrategy.connect(user).deposit(ethers.utils.parseEther("1000"));
            
            const stats = await liquidityMiningStrategy.getStrategyStatistics();
            expect(stats.totalDeposits).to.equal(ethers.utils.parseEther("1000"));
            expect(stats.totalUsers).to.equal(1);
            expect(stats.totalRewards).to.equal(0);
            expect(stats.averageDeposit).to.equal(ethers.utils.parseEther("1000"));
        });
    });
});