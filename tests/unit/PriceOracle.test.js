const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PriceOracle", function () {
    let priceOracle;
    let mockPriceFeed;
    let owner;
    let addr1;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        
        // Deploy PriceOracle
        const PriceOracle = await ethers.getContractFactory("PriceOracle");
        priceOracle = await PriceOracle.deploy();
        await priceOracle.deployed();
        
        // Deploy mock price feed
        const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
        mockPriceFeed = await MockPriceFeed.deploy();
        await mockPriceFeed.deployed();
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await priceOracle.owner()).to.equal(owner.address);
        });

        it("Should authorize owner as oracle", async function () {
            expect(await priceOracle.authorizedOracles(owner.address)).to.be.true;
        });
    });

    describe("Token Management", function () {
        it("Should allow owner to add tokens", async function () {
            const tokenAddress = ethers.Wallet.createRandom().address;
            const priceFeedAddress = mockPriceFeed.address;
            const decimals = 18;
            
            const tx = await priceOracle.addToken(tokenAddress, priceFeedAddress, decimals);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'TokenAdded');
            
            expect(event.args.token).to.equal(tokenAddress);
            expect(event.args.priceFeed).to.equal(priceFeedAddress);
            expect(event.args.decimals).to.equal(decimals);
            
            const tokenInfo = await priceOracle.tokenInfo(tokenAddress);
            expect(tokenInfo.token).to.equal(tokenAddress);
            expect(tokenInfo.priceFeed).to.equal(priceFeedAddress);
            expect(tokenInfo.decimals).to.equal(decimals);
            expect(tokenInfo.isActive).to.be.true;
        });

        it("Should not allow adding token with zero address", async function () {
            await expect(
                priceOracle.addToken(ethers.constants.AddressZero, mockPriceFeed.address, 18)
            ).to.be.revertedWith("PriceOracle: invalid token address");
        });

        it("Should not allow adding token with zero price feed", async function () {
            const tokenAddress = ethers.Wallet.createRandom().address;
            
            await expect(
                priceOracle.addToken(tokenAddress, ethers.constants.AddressZero, 18)
            ).to.be.revertedWith("PriceOracle: invalid price feed");
        });

        it("Should not allow adding duplicate tokens", async function () {
            const tokenAddress = ethers.Wallet.createRandom().address;
            
            await priceOracle.addToken(tokenAddress, mockPriceFeed.address, 18);
            
            await expect(
                priceOracle.addToken(tokenAddress, mockPriceFeed.address, 18)
            ).to.be.revertedWith("PriceOracle: token already added");
        });

        it("Should allow owner to remove tokens", async function () {
            const tokenAddress = ethers.Wallet.createRandom().address;
            
            // First add token
            await priceOracle.addToken(tokenAddress, mockPriceFeed.address, 18);
            
            // Then remove it
            const tx = await priceOracle.removeToken(tokenAddress);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'TokenRemoved');
            
            expect(event.args.token).to.equal(tokenAddress);
            
            const tokenInfo = await priceOracle.tokenInfo(tokenAddress);
            expect(tokenInfo.isActive).to.be.false;
        });
    });

    describe("Price Updates", function () {
        let tokenAddress;

        beforeEach(async function () {
            tokenAddress = ethers.Wallet.createRandom().address;
            await priceOracle.addToken(tokenAddress, mockPriceFeed.address, 18);
        });

        it("Should allow authorized oracles to update prices", async function () {
            const price = ethers.utils.parseEther("100");
            const confidence = 95;
            
            const tx = await priceOracle.updatePrice(tokenAddress, price, confidence);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'PriceUpdated');
            
            expect(event.args.token).to.equal(tokenAddress);
            expect(event.args.price).to.equal(price);
            
            const priceData = await priceOracle.priceData(tokenAddress);
            expect(priceData.price).to.equal(price);
            expect(priceData.confidence).to.equal(confidence);
            expect(priceData.isValid).to.be.true;
        });

        it("Should not allow unauthorized oracles to update prices", async function () {
            await expect(
                priceOracle.connect(addr1).updatePrice(tokenAddress, ethers.utils.parseEther("100"), 95)
            ).to.be.revertedWith("PriceOracle: not authorized oracle");
        });

        it("Should not allow updating price for unsupported tokens", async function () {
            const unsupportedToken = ethers.Wallet.createRandom().address;
            
            await expect(
                priceOracle.updatePrice(unsupportedToken, ethers.utils.parseEther("100"), 95)
            ).to.be.revertedWith("PriceOracle: token not supported");
        });

        it("Should not allow updating price with low confidence", async function () {
            await expect(
                priceOracle.updatePrice(tokenAddress, ethers.utils.parseEther("100"), 90)
            ).to.be.revertedWith("PriceOracle: confidence too low");
        });

        it("Should not allow updating price with zero value", async function () {
            await expect(
                priceOracle.updatePrice(tokenAddress, 0, 95)
            ).to.be.revertedWith("PriceOracle: invalid price");
        });

        it("Should check price deviation limits", async function () {
            const initialPrice = ethers.utils.parseEther("100");
            await priceOracle.updatePrice(tokenAddress, initialPrice, 95);
            
            // Try to update with high deviation
            const highDeviationPrice = ethers.utils.parseEther("120"); // 20% increase
            await expect(
                priceOracle.updatePrice(tokenAddress, highDeviationPrice, 95)
            ).to.be.revertedWith("PriceOracle: price deviation too high");
        });
    });

    describe("Price Retrieval", function () {
        let tokenAddress;

        beforeEach(async function () {
            tokenAddress = ethers.Wallet.createRandom().address;
            await priceOracle.addToken(tokenAddress, mockPriceFeed.address, 18);
            await priceOracle.updatePrice(tokenAddress, ethers.utils.parseEther("100"), 95);
        });

        it("Should return correct price", async function () {
            const price = await priceOracle.getPrice(tokenAddress);
            expect(price).to.equal(ethers.utils.parseEther("100"));
        });

        it("Should return price with confidence", async function () {
            const [price, confidence] = await priceOracle.getPriceWithConfidence(tokenAddress);
            expect(price).to.equal(ethers.utils.parseEther("100"));
            expect(confidence).to.equal(95);
        });

        it("Should calculate token value correctly", async function () {
            const amount = ethers.utils.parseEther("10");
            const value = await priceOracle.getTokenValue(tokenAddress, amount);
            expect(value).to.equal(ethers.utils.parseEther("1000")); // 10 * 100
        });

        it("Should not return price for unsupported tokens", async function () {
            const unsupportedToken = ethers.Wallet.createRandom().address;
            
            await expect(
                priceOracle.getPrice(unsupportedToken)
            ).to.be.revertedWith("PriceOracle: token not supported");
        });

        it("Should not return expired prices", async function () {
            // Fast forward time to expire price
            await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
            await ethers.provider.send("evm_mine");
            
            await expect(
                priceOracle.getPrice(tokenAddress)
            ).to.be.revertedWith("PriceOracle: price expired");
        });
    });

    describe("Oracle Management", function () {
        it("Should allow owner to authorize oracles", async function () {
            const tx = await priceOracle.authorizeOracle(addr1.address);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'OracleAuthorized');
            
            expect(event.args.oracle).to.equal(addr1.address);
            expect(await priceOracle.authorizedOracles(addr1.address)).to.be.true;
        });

        it("Should allow owner to deauthorize oracles", async function () {
            await priceOracle.authorizeOracle(addr1.address);
            
            const tx = await priceOracle.deauthorizeOracle(addr1.address);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'OracleDeauthorized');
            
            expect(event.args.oracle).to.equal(addr1.address);
            expect(await priceOracle.authorizedOracles(addr1.address)).to.be.false;
        });

        it("Should not allow non-owner to authorize oracles", async function () {
            await expect(
                priceOracle.connect(addr1).authorizeOracle(addr1.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Administrative Functions", function () {
        it("Should allow owner to update update interval", async function () {
            const newInterval = 600; // 10 minutes
            await priceOracle.setUpdateInterval(newInterval);
            
            expect(await priceOracle.updateInterval()).to.equal(newInterval);
        });

        it("Should not allow zero update interval", async function () {
            await expect(
                priceOracle.setUpdateInterval(0)
            ).to.be.revertedWith("PriceOracle: invalid interval");
        });

        it("Should allow owner to pause and unpause", async function () {
            await priceOracle.pause();
            expect(await priceOracle.paused()).to.be.true;
            
            await priceOracle.unpause();
            expect(await priceOracle.paused()).to.be.false;
        });
    });
});
