const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PriceOracle", function () {
    let priceOracle;
    let mockPriceFeed;
    let owner;
    let user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        
        // Deploy MockPriceFeed
        const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
        mockPriceFeed = await MockPriceFeed.deploy();
        await mockPriceFeed.deployed();
        
        // Deploy PriceOracle
        const PriceOracle = await ethers.getContractFactory("PriceOracle");
        priceOracle = await PriceOracle.deploy();
        await priceOracle.deployed();
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await priceOracle.owner()).to.equal(owner.address);
        });

        it("Should initialize with zero price feeds", async function () {
            expect(await priceOracle.priceFeedCount()).to.equal(0);
        });

        it("Should initialize with default price feed timeout", async function () {
            expect(await priceOracle.priceFeedTimeout()).to.equal(3600); // 1 hour
        });
    });

    describe("Price Feed Management", function () {
        it("Should allow owner to add price feeds", async function () {
            const token = ethers.Wallet.createRandom().address;
            const priceFeed = mockPriceFeed.address;
            const decimals = 8;
            const description = "ETH/USD";
            
            const tx = await priceOracle.addPriceFeed(token, priceFeed, decimals, description);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'PriceFeedAdded');
            
            expect(event.args.token).to.equal(token);
            expect(event.args.priceFeed).to.equal(priceFeed);
            expect(event.args.decimals).to.equal(decimals);
            
            const feedInfo = await priceOracle.priceFeeds(token);
            expect(feedInfo.priceFeed).to.equal(priceFeed);
            expect(feedInfo.decimals).to.equal(decimals);
            expect(feedInfo.isActive).to.be.true;
            
            expect(await priceOracle.priceFeedCount()).to.equal(1);
        });

        it("Should not allow adding price feed for zero address token", async function () {
            await expect(
                priceOracle.addPriceFeed(
                    ethers.constants.AddressZero,
                    mockPriceFeed.address,
                    8,
                    "ETH/USD"
                )
            ).to.be.revertedWith("PriceOracle: invalid token address");
        });

        it("Should not allow adding price feed with zero address", async function () {
            const token = ethers.Wallet.createRandom().address;
            
            await expect(
                priceOracle.addPriceFeed(
                    token,
                    ethers.constants.AddressZero,
                    8,
                    "ETH/USD"
                )
            ).to.be.revertedWith("PriceOracle: invalid price feed address");
        });

        it("Should not allow adding duplicate price feeds", async function () {
            const token = ethers.Wallet.createRandom().address;
            
            // Add first time
            await priceOracle.addPriceFeed(token, mockPriceFeed.address, 8, "ETH/USD");
            
            // Try to add again
            await expect(
                priceOracle.addPriceFeed(token, mockPriceFeed.address, 8, "ETH/USD")
            ).to.be.revertedWith("PriceOracle: price feed already exists");
        });

        it("Should not allow non-owner to add price feeds", async function () {
            const token = ethers.Wallet.createRandom().address;
            
            await expect(
                priceOracle.connect(user).addPriceFeed(
                    token,
                    mockPriceFeed.address,
                    8,
                    "ETH/USD"
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to update price feed", async function () {
            const token = ethers.Wallet.createRandom().address;
            const newPriceFeed = ethers.Wallet.createRandom().address;
            
            // Add initial price feed
            await priceOracle.addPriceFeed(token, mockPriceFeed.address, 8, "ETH/USD");
            
            // Update it
            const tx = await priceOracle.updatePriceFeed(token, newPriceFeed, 18, "ETH/USD Updated");
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'PriceFeedUpdated');
            
            expect(event.args.token).to.equal(token);
            expect(event.args.newPriceFeed).to.equal(newPriceFeed);
            
            const feedInfo = await priceOracle.priceFeeds(token);
            expect(feedInfo.priceFeed).to.equal(newPriceFeed);
            expect(feedInfo.decimals).to.equal(18);
        });

        it("Should not allow updating non-existent price feed", async function () {
            const token = ethers.Wallet.createRandom().address;
            
            await expect(
                priceOracle.updatePriceFeed(token, mockPriceFeed.address, 8, "ETH/USD")
            ).to.be.revertedWith("PriceOracle: price feed not found");
        });

        it("Should allow owner to deactivate price feed", async function () {
            const token = ethers.Wallet.createRandom().address;
            
            // Add price feed
            await priceOracle.addPriceFeed(token, mockPriceFeed.address, 8, "ETH/USD");
            
            // Deactivate it
            const tx = await priceOracle.deactivatePriceFeed(token);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'PriceFeedDeactivated');
            
            expect(event.args.token).to.equal(token);
            
            const feedInfo = await priceOracle.priceFeeds(token);
            expect(feedInfo.isActive).to.be.false;
        });
    });

    describe("Price Queries", function () {
        let token;

        beforeEach(async function () {
            token = ethers.Wallet.createRandom().address;
            await priceOracle.addPriceFeed(token, mockPriceFeed.address, 8, "ETH/USD");
        });

        it("Should return correct price for supported token", async function () {
            // Set mock price (2000 USD with 8 decimals)
            const mockPrice = ethers.utils.parseUnits("2000", 8);
            await mockPriceFeed.setPrice(mockPrice);
            
            const price = await priceOracle.getPrice(token);
            expect(price).to.equal(mockPrice);
        });

        it("Should return price with correct decimals", async function () {
            // Set mock price (2000 USD with 8 decimals)
            const mockPrice = ethers.utils.parseUnits("2000", 8);
            await mockPriceFeed.setPrice(mockPrice);
            
            const price = await priceOracle.getPrice(token);
            expect(price).to.equal(mockPrice);
        });

        it("Should revert for unsupported token", async function () {
            const unsupportedToken = ethers.Wallet.createRandom().address;
            
            await expect(
                priceOracle.getPrice(unsupportedToken)
            ).to.be.revertedWith("PriceOracle: price feed not found");
        });

        it("Should revert for deactivated price feed", async function () {
            // Deactivate price feed
            await priceOracle.deactivatePriceFeed(token);
            
            await expect(
                priceOracle.getPrice(token)
            ).to.be.revertedWith("PriceOracle: price feed not active");
        });

        it("Should revert for stale price data", async function () {
            // Set mock price with old timestamp
            const mockPrice = ethers.utils.parseUnits("2000", 8);
            const oldTimestamp = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago
            await mockPriceFeed.setPriceWithTimestamp(mockPrice, oldTimestamp);
            
            await expect(
                priceOracle.getPrice(token)
            ).to.be.revertedWith("PriceOracle: price data too old");
        });

        it("Should revert for zero price", async function () {
            await mockPriceFeed.setPrice(0);
            
            await expect(
                priceOracle.getPrice(token)
            ).to.be.revertedWith("PriceOracle: invalid price");
        });

        it("Should revert for negative price", async function () {
            // Set negative price (this would be invalid in real Chainlink)
            const negativePrice = ethers.BigNumber.from("-1");
            await mockPriceFeed.setPrice(negativePrice);
            
            await expect(
                priceOracle.getPrice(token)
            ).to.be.revertedWith("PriceOracle: invalid price");
        });
    });

    describe("Batch Price Queries", function () {
        let token1, token2, token3;

        beforeEach(async function () {
            token1 = ethers.Wallet.createRandom().address;
            token2 = ethers.Wallet.createRandom().address;
            token3 = ethers.Wallet.createRandom().address;
            
            // Add multiple price feeds
            await priceOracle.addPriceFeed(token1, mockPriceFeed.address, 8, "ETH/USD");
            await priceOracle.addPriceFeed(token2, mockPriceFeed.address, 8, "BTC/USD");
            await priceOracle.addPriceFeed(token3, mockPriceFeed.address, 8, "LINK/USD");
        });

        it("Should return prices for multiple tokens", async function () {
            const tokens = [token1, token2, token3];
            const mockPrice = ethers.utils.parseUnits("2000", 8);
            await mockPriceFeed.setPrice(mockPrice);
            
            const prices = await priceOracle.getPrices(tokens);
            
            expect(prices.length).to.equal(3);
            expect(prices[0]).to.equal(mockPrice);
            expect(prices[1]).to.equal(mockPrice);
            expect(prices[2]).to.equal(mockPrice);
        });

        it("Should handle mixed valid and invalid tokens", async function () {
            const validToken = token1;
            const invalidToken = ethers.Wallet.createRandom().address;
            const tokens = [validToken, invalidToken];
            
            const mockPrice = ethers.utils.parseUnits("2000", 8);
            await mockPriceFeed.setPrice(mockPrice);
            
            await expect(
                priceOracle.getPrices(tokens)
            ).to.be.revertedWith("PriceOracle: price feed not found");
        });

        it("Should return empty array for empty token list", async function () {
            const prices = await priceOracle.getPrices([]);
            expect(prices.length).to.equal(0);
        });
    });

    describe("Price Conversion", function () {
        let token;

        beforeEach(async function () {
            token = ethers.Wallet.createRandom().address;
            await priceOracle.addPriceFeed(token, mockPriceFeed.address, 8, "ETH/USD");
        });

        it("Should convert price correctly", async function () {
            const mockPrice = ethers.utils.parseUnits("2000", 8); // 2000 USD
            await mockPriceFeed.setPrice(mockPrice);
            
            const amount = ethers.utils.parseEther("1"); // 1 ETH
            const convertedAmount = await priceOracle.convertPrice(token, amount, 18);
            
            // 1 ETH * 2000 USD = 2000 USD (with 8 decimals)
            const expectedAmount = ethers.utils.parseUnits("2000", 8);
            expect(convertedAmount).to.equal(expectedAmount);
        });

        it("Should handle different decimal places", async function () {
            const mockPrice = ethers.utils.parseUnits("2000", 8); // 2000 USD
            await mockPriceFeed.setPrice(mockPrice);
            
            const amount = ethers.utils.parseUnits("1", 6); // 1 USDC (6 decimals)
            const convertedAmount = await priceOracle.convertPrice(token, amount, 6);
            
            // 1 USDC * 2000 USD = 2000 USD (with 8 decimals)
            const expectedAmount = ethers.utils.parseUnits("2000", 8);
            expect(convertedAmount).to.equal(expectedAmount);
        });

        it("Should revert for zero amount", async function () {
            await expect(
                priceOracle.convertPrice(token, 0, 18)
            ).to.be.revertedWith("PriceOracle: amount must be greater than 0");
        });
    });

    describe("Administrative Functions", function () {
        it("Should allow owner to update price feed timeout", async function () {
            const newTimeout = 7200; // 2 hours
            
            const tx = await priceOracle.updatePriceFeedTimeout(newTimeout);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'PriceFeedTimeoutUpdated');
            
            expect(event.args.newTimeout).to.equal(newTimeout);
            expect(await priceOracle.priceFeedTimeout()).to.equal(newTimeout);
        });

        it("Should not allow timeout less than 1 hour", async function () {
            const newTimeout = 1800; // 30 minutes
            
            await expect(
                priceOracle.updatePriceFeedTimeout(newTimeout)
            ).to.be.revertedWith("PriceOracle: timeout too short");
        });

        it("Should not allow non-owner to update timeout", async function () {
            await expect(
                priceOracle.connect(user).updatePriceFeedTimeout(7200)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to pause and unpause", async function () {
            await priceOracle.pause();
            expect(await priceOracle.paused()).to.be.true;
            
            await priceOracle.unpause();
            expect(await priceOracle.paused()).to.be.false;
        });

        it("Should not allow price queries when paused", async function () {
            const token = ethers.Wallet.createRandom().address;
            await priceOracle.addPriceFeed(token, mockPriceFeed.address, 8, "ETH/USD");
            
            await priceOracle.pause();
            
            await expect(
                priceOracle.getPrice(token)
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Emergency Functions", function () {
        let token;

        beforeEach(async function () {
            token = ethers.Wallet.createRandom().address;
            await priceOracle.addPriceFeed(token, mockPriceFeed.address, 8, "ETH/USD");
        });

        it("Should allow owner to set emergency price", async function () {
            const emergencyPrice = ethers.utils.parseUnits("1500", 8);
            
            const tx = await priceOracle.setEmergencyPrice(token, emergencyPrice);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'EmergencyPriceSet');
            
            expect(event.args.token).to.equal(token);
            expect(event.args.price).to.equal(emergencyPrice);
            
            const price = await priceOracle.getPrice(token);
            expect(price).to.equal(emergencyPrice);
        });

        it("Should not allow non-owner to set emergency price", async function () {
            const emergencyPrice = ethers.utils.parseUnits("1500", 8);
            
            await expect(
                priceOracle.connect(user).setEmergencyPrice(token, emergencyPrice)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should not allow zero emergency price", async function () {
            await expect(
                priceOracle.setEmergencyPrice(token, 0)
            ).to.be.revertedWith("PriceOracle: invalid price");
        });

        it("Should allow owner to clear emergency price", async function () {
            const emergencyPrice = ethers.utils.parseUnits("1500", 8);
            await priceOracle.setEmergencyPrice(token, emergencyPrice);
            
            const tx = await priceOracle.clearEmergencyPrice(token);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'EmergencyPriceCleared');
            
            expect(event.args.token).to.equal(token);
        });
    });

    describe("Utility Functions", function () {
        beforeEach(async function () {
            // Add some price feeds
            const token1 = ethers.Wallet.createRandom().address;
            const token2 = ethers.Wallet.createRandom().address;
            
            await priceOracle.addPriceFeed(token1, mockPriceFeed.address, 8, "ETH/USD");
            await priceOracle.addPriceFeed(token2, mockPriceFeed.address, 8, "BTC/USD");
        });

        it("Should return all supported tokens", async function () {
            const supportedTokens = await priceOracle.getSupportedTokens();
            expect(supportedTokens.length).to.equal(2);
        });

        it("Should return price feed info", async function () {
            const token = ethers.Wallet.createRandom().address;
            await priceOracle.addPriceFeed(token, mockPriceFeed.address, 8, "ETH/USD");
            
            const feedInfo = await priceOracle.getPriceFeedInfo(token);
            expect(feedInfo.priceFeed).to.equal(mockPriceFeed.address);
            expect(feedInfo.decimals).to.equal(8);
            expect(feedInfo.isActive).to.be.true;
        });

        it("Should return false for non-existent price feed", async function () {
            const token = ethers.Wallet.createRandom().address;
            
            const hasPriceFeed = await priceOracle.hasPriceFeed(token);
            expect(hasPriceFeed).to.be.false;
        });

        it("Should return true for existing price feed", async function () {
            const token = ethers.Wallet.createRandom().address;
            await priceOracle.addPriceFeed(token, mockPriceFeed.address, 8, "ETH/USD");
            
            const hasPriceFeed = await priceOracle.hasPriceFeed(token);
            expect(hasPriceFeed).to.be.true;
        });
    });
});
