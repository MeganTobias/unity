const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AssetManager", function () {
    let assetManager;
    let assetToken;
    let mockToken;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        
        // Deploy AssetToken
        const AssetToken = await ethers.getContractFactory("AssetToken");
        assetToken = await AssetToken.deploy();
        await assetToken.deployed();
        
        // Deploy AssetManager
        const AssetManager = await ethers.getContractFactory("AssetManager");
        assetManager = await AssetManager.deploy(assetToken.address, owner.address);
        await assetManager.deployed();
        
        // Deploy mock ERC20 token
        const MockToken = await ethers.getContractFactory("MockERC20");
        try {
            mockToken = await MockToken.deploy("Mock Token", "MOCK");
            await mockToken.deployed();
        } catch (error) {
            // If MockERC20 doesn't exist, create a simple mock
            const MockERC20 = await ethers.getContractFactory("contracts/mocks/MockERC20.sol:MockERC20");
            mockToken = await MockERC20.deploy("Mock Token", "MOCK");
            await mockToken.deployed();
        }
    });

    describe("Deployment", function () {
        it("Should set the correct asset token", async function () {
            expect(await assetManager.assetToken()).to.equal(assetToken.address);
        });

        it("Should set the correct fee recipient", async function () {
            expect(await assetManager.feeRecipient()).to.equal(owner.address);
        });

        it("Should initialize with zero total assets under management", async function () {
            expect(await assetManager.totalAssetsUnderManagement()).to.equal(0);
        });
    });

    describe("Asset Management", function () {
        it("Should allow owner to add assets", async function () {
            const initialBalance = ethers.utils.parseEther("1000");
            await assetManager.addAsset(mockToken.address, initialBalance);
            
            const asset = await assetManager.assets(mockToken.address);
            expect(asset.token).to.equal(mockToken.address);
            expect(asset.balance).to.equal(initialBalance);
            expect(asset.isActive).to.be.true;
        });

        it("Should not allow non-owner to add assets", async function () {
            const initialBalance = ethers.utils.parseEther("1000");
            
            await expect(
                assetManager.connect(addr1).addAsset(mockToken.address, initialBalance)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to remove assets", async function () {
            const initialBalance = ethers.utils.parseEther("1000");
            await assetManager.addAsset(mockToken.address, initialBalance);
            
            await assetManager.removeAsset(mockToken.address);
            const asset = await assetManager.assets(mockToken.address);
            expect(asset.isActive).to.be.false;
        });
    });

    describe("Strategy Management", function () {
        it("Should allow users to create strategies", async function () {
            const strategyContract = addr2.address;
            const name = "Test Strategy";
            const description = "A test strategy for yield farming";
            const performanceFee = 500; // 5%
            
            await assetManager.connect(addr1).createStrategy(
                strategyContract,
                name,
                description,
                performanceFee
            );
            
            const strategy = await assetManager.strategies(1);
            expect(strategy.strategyContract).to.equal(strategyContract);
            expect(strategy.name).to.equal(name);
            expect(strategy.creator).to.equal(addr1.address);
            expect(strategy.isActive).to.be.true;
        });

        it("Should not allow creating strategy with zero address", async function () {
            await expect(
                assetManager.connect(addr1).createStrategy(
                    ethers.constants.AddressZero,
                    "Test Strategy",
                    "Description",
                    500
                )
            ).to.be.revertedWith("AssetManager: invalid strategy contract");
        });

        it("Should not allow performance fee above 10%", async function () {
            await expect(
                assetManager.connect(addr1).createStrategy(
                    addr2.address,
                    "Test Strategy",
                    "Description",
                    1100 // 11%
                )
            ).to.be.revertedWith("AssetManager: performance fee too high");
        });
    });

    describe("User Operations", function () {
        beforeEach(async function () {
            // Add mock token as supported asset
            await assetManager.addAsset(mockToken.address, 0);
            
            // Mint some tokens to addr1
            await mockToken.mint(addr1.address, ethers.utils.parseEther("1000"));
            
            // Approve asset manager to spend tokens
            await mockToken.connect(addr1).approve(assetManager.address, ethers.utils.parseEther("1000"));
        });

        it("Should allow users to deposit tokens", async function () {
            const depositAmount = ethers.utils.parseEther("100");
            
            await assetManager.connect(addr1).deposit(mockToken.address, depositAmount);
            
            const userBalance = await assetManager.getUserBalance(addr1.address, mockToken.address);
            expect(userBalance).to.equal(depositAmount);
            
            const totalAUM = await assetManager.getTotalAssetsUnderManagement();
            expect(totalAUM).to.equal(depositAmount);
        });

        it("Should allow users to withdraw tokens", async function () {
            const depositAmount = ethers.utils.parseEther("100");
            const withdrawAmount = ethers.utils.parseEther("50");
            
            // First deposit
            await assetManager.connect(addr1).deposit(mockToken.address, depositAmount);
            
            // Then withdraw
            await assetManager.connect(addr1).withdraw(mockToken.address, withdrawAmount);
            
            const userBalance = await assetManager.getUserBalance(addr1.address, mockToken.address);
            expect(userBalance).to.equal(depositAmount.sub(withdrawAmount));
        });

        it("Should not allow withdrawal of more than deposited", async function () {
            const depositAmount = ethers.utils.parseEther("100");
            const withdrawAmount = ethers.utils.parseEther("150");
            
            await assetManager.connect(addr1).deposit(mockToken.address, depositAmount);
            
            await expect(
                assetManager.connect(addr1).withdraw(mockToken.address, withdrawAmount)
            ).to.be.revertedWith("AssetManager: insufficient balance");
        });
    });

    describe("Pausable", function () {
        it("Should allow owner to pause and unpause", async function () {
            await assetManager.pause();
            expect(await assetManager.paused()).to.be.true;
            
            await assetManager.unpause();
            expect(await assetManager.paused()).to.be.false;
        });
    });
});
