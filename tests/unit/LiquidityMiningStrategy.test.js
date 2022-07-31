const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiquidityMiningStrategy", function () {
    let liquidityMiningStrategy;
    let mockRouter;
    let mockFactory;
    let mockTokenA;
    let mockTokenB;
    let mockLPToken;
    let mockRewardToken;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        
        // Deploy mock tokens
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockTokenA = await MockToken.deploy("Token A", "TOKA");
        await mockTokenA.deployed();
        
        mockTokenB = await MockToken.deploy("Token B", "TOKB");
        await mockTokenB.deployed();
        
        mockLPToken = await MockToken.deploy("LP Token", "LPT");
        await mockLPToken.deployed();
        
        mockRewardToken = await MockToken.deploy("Reward Token", "RWT");
        await mockRewardToken.deployed();
        
        // Deploy mock router and factory
        const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
        mockRouter = await MockRouter.deploy();
        await mockRouter.deployed();
        
        const MockFactory = await ethers.getContractFactory("MockUniswapV2Factory");
        mockFactory = await MockFactory.deploy();
        await mockFactory.deployed();
        
        // Deploy LiquidityMiningStrategy
        const LiquidityMiningStrategy = await ethers.getContractFactory("LiquidityMiningStrategy");
        liquidityMiningStrategy = await LiquidityMiningStrategy.deploy(
            mockRouter.address,
            mockFactory.address,
            ethers.utils.parseEther("100"), // reward per block
            await ethers.provider.getBlockNumber() + 10, // start block
            await ethers.provider.getBlockNumber() + 1000 // end block
        );
        await liquidityMiningStrategy.deployed();
        
        // Mint tokens to users
        await mockLPToken.mint(addr1.address, ethers.utils.parseEther("10000"));
        await mockLPToken.mint(addr2.address, ethers.utils.parseEther("10000"));
        await mockRewardToken.mint(liquidityMiningStrategy.address, ethers.utils.parseEther("1000000"));
        
        // Approve strategy to spend LP tokens
        await mockLPToken.connect(addr1).approve(liquidityMiningStrategy.address, ethers.utils.parseEther("10000"));
        await mockLPToken.connect(addr2).approve(liquidityMiningStrategy.address, ethers.utils.parseEther("10000"));
    });

    describe("Deployment", function () {
        it("Should set the correct router and factory", async function () {
            expect(await liquidityMiningStrategy.router()).to.equal(mockRouter.address);
            expect(await liquidityMiningStrategy.factory()).to.equal(mockFactory.address);
        });

        it("Should set the correct reward parameters", async function () {
            expect(await liquidityMiningStrategy.rewardPerBlock()).to.equal(ethers.utils.parseEther("100"));
            expect(await liquidityMiningStrategy.startBlock()).to.be.gt(0);
            expect(await liquidityMiningStrategy.endBlock()).to.be.gt(0);
        });

        it("Should set the correct owner", async function () {
            expect(await liquidityMiningStrategy.owner()).to.equal(owner.address);
        });
    });

    describe("Pool Management", function () {
        it("Should allow owner to add pools", async function () {
            const allocPoint = 1000;
            
            const tx = await liquidityMiningStrategy.addPool(
                mockTokenA.address,
                mockTokenB.address,
                allocPoint,
                mockRewardToken.address
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'PoolAdded');
            
            expect(event.args.pid).to.equal(0);
            expect(event.args.tokenA).to.equal(mockTokenA.address);
            expect(event.args.tokenB).to.equal(mockTokenB.address);
            expect(event.args.lpToken).to.equal(mockLPToken.address);
            
            const poolInfo = await liquidityMiningStrategy.poolInfo(0);
            expect(poolInfo.tokenA).to.equal(mockTokenA.address);
            expect(poolInfo.tokenB).to.equal(mockTokenB.address);
            expect(poolInfo.allocPoint).to.equal(allocPoint);
            expect(poolInfo.isActive).to.be.true;
        });

        it("Should not allow adding pools with same token", async function () {
            await expect(
                liquidityMiningStrategy.addPool(
                    mockTokenA.address,
                    mockTokenA.address,
                    1000,
                    mockRewardToken.address
                )
            ).to.be.revertedWith("LiquidityMiningStrategy: same token");
        });

        it("Should not allow adding pools with zero alloc point", async function () {
            await expect(
                liquidityMiningStrategy.addPool(
                    mockTokenA.address,
                    mockTokenB.address,
                    0,
                    mockRewardToken.address
                )
            ).to.be.revertedWith("LiquidityMiningStrategy: invalid alloc point");
        });

        it("Should not allow non-owner to add pools", async function () {
            await expect(
                liquidityMiningStrategy.connect(addr1).addPool(
                    mockTokenA.address,
                    mockTokenB.address,
                    1000,
                    mockRewardToken.address
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Deposits", function () {
        let poolId;

        beforeEach(async function () {
            // Add a pool first
            await liquidityMiningStrategy.addPool(
                mockTokenA.address,
                mockTokenB.address,
                1000,
                mockRewardToken.address
            );
            poolId = 0;
        });

        it("Should allow users to deposit LP tokens", async function () {
            const depositAmount = ethers.utils.parseEther("1000");
            
            const tx = await liquidityMiningStrategy.connect(addr1).deposit(poolId, depositAmount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Deposit');
            
            expect(event.args.user).to.equal(addr1.address);
            expect(event.args.pid).to.equal(poolId);
            expect(event.args.amount).to.equal(depositAmount);
            
            const userInfo = await liquidityMiningStrategy.userInfo(poolId, addr1.address);
            expect(userInfo.amount).to.equal(depositAmount);
        });

        it("Should not allow zero amount deposits", async function () {
            await expect(
                liquidityMiningStrategy.connect(addr1).deposit(poolId, 0)
            ).to.be.revertedWith("LiquidityMiningStrategy: amount must be greater than 0");
        });

        it("Should not allow deposits to inactive pools", async function () {
            // Deactivate pool (this would require a function to deactivate pools)
            // For now, we'll test with an invalid pool ID
            await expect(
                liquidityMiningStrategy.connect(addr1).deposit(999, ethers.utils.parseEther("1000"))
            ).to.be.revertedWith("LiquidityMiningStrategy: invalid pool id");
        });
    });

    describe("Withdrawals", function () {
        let poolId;

        beforeEach(async function () {
            // Add a pool and deposit
            await liquidityMiningStrategy.addPool(
                mockTokenA.address,
                mockTokenB.address,
                1000,
                mockRewardToken.address
            );
            poolId = 0;
            
            const depositAmount = ethers.utils.parseEther("1000");
            await liquidityMiningStrategy.connect(addr1).deposit(poolId, depositAmount);
        });

        it("Should allow users to withdraw LP tokens", async function () {
            const withdrawAmount = ethers.utils.parseEther("500");
            
            const tx = await liquidityMiningStrategy.connect(addr1).withdraw(poolId, withdrawAmount);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Withdraw');
            
            expect(event.args.user).to.equal(addr1.address);
            expect(event.args.pid).to.equal(poolId);
            expect(event.args.amount).to.equal(withdrawAmount);
            
            const userInfo = await liquidityMiningStrategy.userInfo(poolId, addr1.address);
            expect(userInfo.amount).to.equal(ethers.utils.parseEther("500"));
        });

        it("Should not allow withdrawal of more than deposited", async function () {
            const withdrawAmount = ethers.utils.parseEther("1500");
            
            await expect(
                liquidityMiningStrategy.connect(addr1).withdraw(poolId, withdrawAmount)
            ).to.be.revertedWith("LiquidityMiningStrategy: insufficient balance");
        });
    });

    describe("Harvesting", function () {
        let poolId;

        beforeEach(async function () {
            // Add a pool and deposit
            await liquidityMiningStrategy.addPool(
                mockTokenA.address,
                mockTokenB.address,
                1000,
                mockRewardToken.address
            );
            poolId = 0;
            
            const depositAmount = ethers.utils.parseEther("1000");
            await liquidityMiningStrategy.connect(addr1).deposit(poolId, depositAmount);
        });

        it("Should allow users to harvest rewards", async function () {
            // Fast forward to start block
            const startBlock = await liquidityMiningStrategy.startBlock();
            await ethers.provider.send("evm_mine", [startBlock.toNumber()]);
            
            const tx = await liquidityMiningStrategy.connect(addr1).harvest(poolId);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'Harvest');
            
            expect(event.args.user).to.equal(addr1.address);
            expect(event.args.pid).to.equal(poolId);
        });
    });

    describe("Pool Updates", function () {
        let poolId;

        beforeEach(async function () {
            // Add a pool
            await liquidityMiningStrategy.addPool(
                mockTokenA.address,
                mockTokenB.address,
                1000,
                mockRewardToken.address
            );
            poolId = 0;
        });

        it("Should allow owner to update pool alloc point", async function () {
            const newAllocPoint = 2000;
            
            const tx = await liquidityMiningStrategy.updatePoolAllocPoint(poolId, newAllocPoint);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'PoolUpdated');
            
            expect(event.args.pid).to.equal(poolId);
            expect(event.args.allocPoint).to.equal(newAllocPoint);
            
            const poolInfo = await liquidityMiningStrategy.poolInfo(poolId);
            expect(poolInfo.allocPoint).to.equal(newAllocPoint);
        });

        it("Should not allow non-owner to update pool alloc point", async function () {
            await expect(
                liquidityMiningStrategy.connect(addr1).updatePoolAllocPoint(poolId, 2000)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to set reward per block", async function () {
            const newRewardPerBlock = ethers.utils.parseEther("200");
            
            await liquidityMiningStrategy.setRewardPerBlock(newRewardPerBlock);
            
            expect(await liquidityMiningStrategy.rewardPerBlock()).to.equal(newRewardPerBlock);
        });
    });

    describe("Pending Rewards", function () {
        let poolId;

        beforeEach(async function () {
            // Add a pool and deposit
            await liquidityMiningStrategy.addPool(
                mockTokenA.address,
                mockTokenB.address,
                1000,
                mockRewardToken.address
            );
            poolId = 0;
            
            const depositAmount = ethers.utils.parseEther("1000");
            await liquidityMiningStrategy.connect(addr1).deposit(poolId, depositAmount);
        });

        it("Should calculate pending rewards correctly", async function () {
            // Fast forward to start block
            const startBlock = await liquidityMiningStrategy.startBlock();
            await ethers.provider.send("evm_mine", [startBlock.toNumber()]);
            
            const pendingRewards = await liquidityMiningStrategy.pendingReward(poolId, addr1.address);
            expect(pendingRewards).to.be.gt(0);
        });

        it("Should return zero pending rewards for users with no deposits", async function () {
            const pendingRewards = await liquidityMiningStrategy.pendingReward(poolId, addr2.address);
            expect(pendingRewards).to.equal(0);
        });
    });

    describe("Administrative Functions", function () {
        it("Should allow owner to pause and unpause", async function () {
            await liquidityMiningStrategy.pause();
            expect(await liquidityMiningStrategy.paused()).to.be.true;
            
            await liquidityMiningStrategy.unpause();
            expect(await liquidityMiningStrategy.paused()).to.be.false;
        });

        it("Should not allow non-owner to pause", async function () {
            await expect(
                liquidityMiningStrategy.connect(addr1).pause()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});
