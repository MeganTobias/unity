const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RiskManager", function () {
    let riskManager;
    let assetToken;
    let priceOracle;
    let owner;
    let user;
    let riskAnalyst;

    beforeEach(async function () {
        [owner, user, riskAnalyst] = await ethers.getSigners();
        
        // Deploy AssetToken
        const AssetToken = await ethers.getContractFactory("AssetToken");
        assetToken = await AssetToken.deploy();
        await assetToken.deployed();
        
        // Deploy PriceOracle
        const PriceOracle = await ethers.getContractFactory("PriceOracle");
        priceOracle = await PriceOracle.deploy();
        await priceOracle.deployed();
        
        // Deploy RiskManager
        const RiskManager = await ethers.getContractFactory("RiskManager");
        riskManager = await RiskManager.deploy(priceOracle.address);
        await riskManager.deployed();
        
        // Mint tokens to user
        await assetToken.mint(user.address, ethers.utils.parseEther("10000"));
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await riskManager.owner()).to.equal(owner.address);
        });

        it("Should set the correct price oracle", async function () {
            expect(await riskManager.priceOracle()).to.equal(priceOracle.address);
        });

        it("Should initialize with zero risk parameters", async function () {
            expect(await riskManager.riskParameterCount()).to.equal(0);
        });

        it("Should initialize with default risk thresholds", async function () {
            expect(await riskManager.maxLeverage()).to.equal(300); // 3x
            expect(await riskManager.maxPositionSize()).to.equal(5000); // 50%
            expect(await riskManager.maxDailyLoss()).to.equal(1000); // 10%
        });
    });

    describe("Risk Parameter Management", function () {
        it("Should allow owner to add risk parameters", async function () {
            const token = assetToken.address;
            const maxLeverage = 200; // 2x
            const maxPositionSize = 3000; // 30%
            const maxDailyLoss = 500; // 5%
            const volatilityThreshold = 2000; // 20%
            
            const tx = await riskManager.addRiskParameter(
                token,
                maxLeverage,
                maxPositionSize,
                maxDailyLoss,
                volatilityThreshold
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RiskParameterAdded');
            
            expect(event.args.token).to.equal(token);
            expect(event.args.maxLeverage).to.equal(maxLeverage);
            expect(event.args.maxPositionSize).to.equal(maxPositionSize);
            
            const riskParam = await riskManager.riskParameters(token);
            expect(riskParam.maxLeverage).to.equal(maxLeverage);
            expect(riskParam.maxPositionSize).to.equal(maxPositionSize);
            expect(riskParam.maxDailyLoss).to.equal(maxDailyLoss);
            expect(riskParam.volatilityThreshold).to.equal(volatilityThreshold);
            expect(riskParam.isActive).to.be.true;
            
            expect(await riskManager.riskParameterCount()).to.equal(1);
        });

        it("Should not allow adding risk parameters for zero address token", async function () {
            await expect(
                riskManager.addRiskParameter(
                    ethers.constants.AddressZero,
                    200,
                    3000,
                    500,
                    2000
                )
            ).to.be.revertedWith("RiskManager: invalid token address");
        });

        it("Should not allow adding duplicate risk parameters", async function () {
            const token = assetToken.address;
            
            // Add first time
            await riskManager.addRiskParameter(token, 200, 3000, 500, 2000);
            
            // Try to add again
            await expect(
                riskManager.addRiskParameter(token, 300, 4000, 600, 3000)
            ).to.be.revertedWith("RiskManager: risk parameter already exists");
        });

        it("Should not allow non-owner to add risk parameters", async function () {
            await expect(
                riskManager.connect(user).addRiskParameter(
                    assetToken.address,
                    200,
                    3000,
                    500,
                    2000
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to update risk parameters", async function () {
            const token = assetToken.address;
            
            // Add initial risk parameters
            await riskManager.addRiskParameter(token, 200, 3000, 500, 2000);
            
            // Update them
            const tx = await riskManager.updateRiskParameter(
                token,
                300, // new max leverage
                4000, // new max position size
                600, // new max daily loss
                3000 // new volatility threshold
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RiskParameterUpdated');
            
            expect(event.args.token).to.equal(token);
            expect(event.args.maxLeverage).to.equal(300);
            
            const riskParam = await riskManager.riskParameters(token);
            expect(riskParam.maxLeverage).to.equal(300);
            expect(riskParam.maxPositionSize).to.equal(4000);
        });

        it("Should not allow updating non-existent risk parameters", async function () {
            const token = ethers.Wallet.createRandom().address;
            
            await expect(
                riskManager.updateRiskParameter(token, 300, 4000, 600, 3000)
            ).to.be.revertedWith("RiskManager: risk parameter not found");
        });

        it("Should allow owner to deactivate risk parameters", async function () {
            const token = assetToken.address;
            
            // Add risk parameters
            await riskManager.addRiskParameter(token, 200, 3000, 500, 2000);
            
            // Deactivate them
            const tx = await riskManager.deactivateRiskParameter(token);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RiskParameterDeactivated');
            
            expect(event.args.token).to.equal(token);
            
            const riskParam = await riskManager.riskParameters(token);
            expect(riskParam.isActive).to.be.false;
        });
    });

    describe("Risk Assessment", function () {
        let token;

        beforeEach(async function () {
            token = assetToken.address;
            await riskManager.addRiskParameter(token, 200, 3000, 500, 2000);
        });

        it("Should assess position risk correctly", async function () {
            const positionSize = ethers.utils.parseEther("1000");
            const leverage = 150; // 1.5x
            const volatility = 1500; // 15%
            
            const riskScore = await riskManager.assessPositionRisk(
                token,
                positionSize,
                leverage,
                volatility
            );
            
            expect(riskScore).to.be.gt(0);
        });

        it("Should return high risk for excessive leverage", async function () {
            const positionSize = ethers.utils.parseEther("1000");
            const leverage = 400; // 4x (exceeds max 2x)
            const volatility = 1000; // 10%
            
            const riskScore = await riskManager.assessPositionRisk(
                token,
                positionSize,
                leverage,
                volatility
            );
            
            expect(riskScore).to.be.gt(8000); // High risk threshold
        });

        it("Should return high risk for excessive position size", async function () {
            const positionSize = ethers.utils.parseEther("5000"); // 50% of portfolio
            const leverage = 100; // 1x
            const volatility = 1000; // 10%
            
            const riskScore = await riskManager.assessPositionRisk(
                token,
                positionSize,
                leverage,
                volatility
            );
            
            expect(riskScore).to.be.gt(8000); // High risk threshold
        });

        it("Should return high risk for high volatility", async function () {
            const positionSize = ethers.utils.parseEther("1000");
            const leverage = 100; // 1x
            const volatility = 3000; // 30% (exceeds max 20%)
            
            const riskScore = await riskManager.assessPositionRisk(
                token,
                positionSize,
                leverage,
                volatility
            );
            
            expect(riskScore).to.be.gt(8000); // High risk threshold
        });

        it("Should revert for unsupported token", async function () {
            const unsupportedToken = ethers.Wallet.createRandom().address;
            
            await expect(
                riskManager.assessPositionRisk(
                    unsupportedToken,
                    ethers.utils.parseEther("1000"),
                    100,
                    1000
                )
            ).to.be.revertedWith("RiskManager: risk parameter not found");
        });

        it("Should revert for deactivated risk parameters", async function () {
            // Deactivate risk parameters
            await riskManager.deactivateRiskParameter(token);
            
            await expect(
                riskManager.assessPositionRisk(
                    token,
                    ethers.utils.parseEther("1000"),
                    100,
                    1000
                )
            ).to.be.revertedWith("RiskManager: risk parameter not active");
        });
    });

    describe("Portfolio Risk Assessment", function () {
        let token1, token2;

        beforeEach(async function () {
            token1 = assetToken.address;
            token2 = ethers.Wallet.createRandom().address;
            
            // Add risk parameters for both tokens
            await riskManager.addRiskParameter(token1, 200, 3000, 500, 2000);
            await riskManager.addRiskParameter(token2, 150, 2500, 400, 1500);
        });

        it("Should assess portfolio risk correctly", async function () {
            const positions = [
                {
                    token: token1,
                    size: ethers.utils.parseEther("1000"),
                    leverage: 150,
                    volatility: 1000
                },
                {
                    token: token2,
                    size: ethers.utils.parseEther("500"),
                    leverage: 100,
                    volatility: 800
                }
            ];
            
            const portfolioRisk = await riskManager.assessPortfolioRisk(positions);
            
            expect(portfolioRisk.totalRisk).to.be.gt(0);
            expect(portfolioRisk.positions.length).to.equal(2);
        });

        it("Should identify high-risk positions", async function () {
            const positions = [
                {
                    token: token1,
                    size: ethers.utils.parseEther("1000"),
                    leverage: 300, // High leverage
                    volatility: 1000
                },
                {
                    token: token2,
                    size: ethers.utils.parseEther("500"),
                    leverage: 100,
                    volatility: 800
                }
            ];
            
            const portfolioRisk = await riskManager.assessPortfolioRisk(positions);
            
            expect(portfolioRisk.highRiskPositions.length).to.be.gt(0);
        });

        it("Should calculate portfolio concentration risk", async function () {
            const positions = [
                {
                    token: token1,
                    size: ethers.utils.parseEther("5000"), // 50% of portfolio
                    leverage: 100,
                    volatility: 1000
                },
                {
                    token: token2,
                    size: ethers.utils.parseEther("500"),
                    leverage: 100,
                    volatility: 800
                }
            ];
            
            const portfolioRisk = await riskManager.assessPortfolioRisk(positions);
            
            expect(portfolioRisk.concentrationRisk).to.be.gt(0);
        });

        it("Should handle empty portfolio", async function () {
            const portfolioRisk = await riskManager.assessPortfolioRisk([]);
            
            expect(portfolioRisk.totalRisk).to.equal(0);
            expect(portfolioRisk.positions.length).to.equal(0);
        });
    });

    describe("Risk Alerts", function () {
        let token;

        beforeEach(async function () {
            token = assetToken.address;
            await riskManager.addRiskParameter(token, 200, 3000, 500, 2000);
        });

        it("Should trigger leverage alert", async function () {
            const positionSize = ethers.utils.parseEther("1000");
            const leverage = 400; // 4x (exceeds max 2x)
            const volatility = 1000;
            
            const tx = await riskManager.checkRiskAlerts(
                token,
                positionSize,
                leverage,
                volatility
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RiskAlert');
            
            expect(event.args.alertType).to.equal(0); // LEVERAGE_ALERT
            expect(event.args.severity).to.equal(2); // HIGH
        });

        it("Should trigger position size alert", async function () {
            const positionSize = ethers.utils.parseEther("4000"); // 40% (exceeds max 30%)
            const leverage = 100;
            const volatility = 1000;
            
            const tx = await riskManager.checkRiskAlerts(
                token,
                positionSize,
                leverage,
                volatility
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RiskAlert');
            
            expect(event.args.alertType).to.equal(1); // POSITION_SIZE_ALERT
            expect(event.args.severity).to.equal(2); // HIGH
        });

        it("Should trigger volatility alert", async function () {
            const positionSize = ethers.utils.parseEther("1000");
            const leverage = 100;
            const volatility = 3000; // 30% (exceeds max 20%)
            
            const tx = await riskManager.checkRiskAlerts(
                token,
                positionSize,
                leverage,
                volatility
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RiskAlert');
            
            expect(event.args.alertType).to.equal(2); // VOLATILITY_ALERT
            expect(event.args.severity).to.equal(2); // HIGH
        });

        it("Should not trigger alerts for safe parameters", async function () {
            const positionSize = ethers.utils.parseEther("1000");
            const leverage = 150; // 1.5x (within max 2x)
            const volatility = 1000; // 10% (within max 20%)
            
            const tx = await riskManager.checkRiskAlerts(
                token,
                positionSize,
                leverage,
                volatility
            );
            const receipt = await tx.wait();
            
            const alertEvents = receipt.events.filter(e => e.event === 'RiskAlert');
            expect(alertEvents.length).to.equal(0);
        });
    });

    describe("Stop-Loss Mechanisms", function () {
        let token;

        beforeEach(async function () {
            token = assetToken.address;
            await riskManager.addRiskParameter(token, 200, 3000, 500, 2000);
        });

        it("Should allow users to set stop-loss orders", async function () {
            const positionId = 1;
            const stopLossPrice = ethers.utils.parseEther("1800"); // 10% below current price
            const triggerPrice = ethers.utils.parseEther("1900");
            
            const tx = await riskManager.connect(user).setStopLoss(
                positionId,
                token,
                stopLossPrice,
                triggerPrice
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StopLossSet');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.positionId).to.equal(positionId);
            expect(event.args.stopLossPrice).to.equal(stopLossPrice);
            
            const stopLoss = await riskManager.stopLossOrders(user.address, positionId);
            expect(stopLoss.token).to.equal(token);
            expect(stopLoss.stopLossPrice).to.equal(stopLossPrice);
            expect(stopLoss.isActive).to.be.true;
        });

        it("Should not allow zero stop-loss price", async function () {
            const positionId = 1;
            const triggerPrice = ethers.utils.parseEther("1900");
            
            await expect(
                riskManager.connect(user).setStopLoss(
                    positionId,
                    token,
                    0,
                    triggerPrice
                )
            ).to.be.revertedWith("RiskManager: invalid stop-loss price");
        });

        it("Should allow users to update stop-loss orders", async function () {
            const positionId = 1;
            const stopLossPrice = ethers.utils.parseEther("1800");
            const triggerPrice = ethers.utils.parseEther("1900");
            
            // Set initial stop-loss
            await riskManager.connect(user).setStopLoss(
                positionId,
                token,
                stopLossPrice,
                triggerPrice
            );
            
            // Update it
            const newStopLossPrice = ethers.utils.parseEther("1700");
            const newTriggerPrice = ethers.utils.parseEther("1800");
            
            const tx = await riskManager.connect(user).updateStopLoss(
                positionId,
                newStopLossPrice,
                newTriggerPrice
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StopLossUpdated');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.positionId).to.equal(positionId);
            
            const stopLoss = await riskManager.stopLossOrders(user.address, positionId);
            expect(stopLoss.stopLossPrice).to.equal(newStopLossPrice);
        });

        it("Should allow users to cancel stop-loss orders", async function () {
            const positionId = 1;
            const stopLossPrice = ethers.utils.parseEther("1800");
            const triggerPrice = ethers.utils.parseEther("1900");
            
            // Set stop-loss
            await riskManager.connect(user).setStopLoss(
                positionId,
                token,
                stopLossPrice,
                triggerPrice
            );
            
            // Cancel it
            const tx = await riskManager.connect(user).cancelStopLoss(positionId);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'StopLossCancelled');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.positionId).to.equal(positionId);
            
            const stopLoss = await riskManager.stopLossOrders(user.address, positionId);
            expect(stopLoss.isActive).to.be.false;
        });

        it("Should not allow updating non-existent stop-loss", async function () {
            const positionId = 999;
            
            await expect(
                riskManager.connect(user).updateStopLoss(
                    positionId,
                    ethers.utils.parseEther("1700"),
                    ethers.utils.parseEther("1800")
                )
            ).to.be.revertedWith("RiskManager: stop-loss not found");
        });
    });

    describe("Emergency Functions", function () {
        let token;

        beforeEach(async function () {
            token = assetToken.address;
            await riskManager.addRiskParameter(token, 200, 3000, 500, 2000);
        });

        it("Should allow owner to trigger emergency stop", async function () {
            const tx = await riskManager.triggerEmergencyStop();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'EmergencyStopTriggered');
            
            expect(event.args.triggeredBy).to.equal(owner.address);
            expect(await riskManager.emergencyStopActive()).to.be.true;
        });

        it("Should not allow non-owner to trigger emergency stop", async function () {
            await expect(
                riskManager.connect(user).triggerEmergencyStop()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to clear emergency stop", async function () {
            // Trigger emergency stop first
            await riskManager.triggerEmergencyStop();
            
            // Clear it
            const tx = await riskManager.clearEmergencyStop();
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'EmergencyStopCleared');
            
            expect(event.args.clearedBy).to.equal(owner.address);
            expect(await riskManager.emergencyStopActive()).to.be.false;
        });

        it("Should not allow operations during emergency stop", async function () {
            // Trigger emergency stop
            await riskManager.triggerEmergencyStop();
            
            // Try to assess risk
            await expect(
                riskManager.assessPositionRisk(
                    token,
                    ethers.utils.parseEther("1000"),
                    100,
                    1000
                )
            ).to.be.revertedWith("RiskManager: emergency stop active");
        });
    });

    describe("Administrative Functions", function () {
        it("Should allow owner to update global risk thresholds", async function () {
            const newMaxLeverage = 400; // 4x
            const newMaxPositionSize = 6000; // 60%
            const newMaxDailyLoss = 800; // 8%
            
            const tx = await riskManager.updateGlobalRiskThresholds(
                newMaxLeverage,
                newMaxPositionSize,
                newMaxDailyLoss
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'GlobalRiskThresholdsUpdated');
            
            expect(event.args.maxLeverage).to.equal(newMaxLeverage);
            expect(event.args.maxPositionSize).to.equal(newMaxPositionSize);
            expect(event.args.maxDailyLoss).to.equal(newMaxDailyLoss);
            
            expect(await riskManager.maxLeverage()).to.equal(newMaxLeverage);
            expect(await riskManager.maxPositionSize()).to.equal(newMaxPositionSize);
            expect(await riskManager.maxDailyLoss()).to.equal(newMaxDailyLoss);
        });

        it("Should not allow non-owner to update global thresholds", async function () {
            await expect(
                riskManager.connect(user).updateGlobalRiskThresholds(400, 6000, 800)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to pause and unpause", async function () {
            await riskManager.pause();
            expect(await riskManager.paused()).to.be.true;
            
            await riskManager.unpause();
            expect(await riskManager.paused()).to.be.false;
        });

        it("Should not allow operations when paused", async function () {
            const token = assetToken.address;
            await riskManager.addRiskParameter(token, 200, 3000, 500, 2000);
            
            await riskManager.pause();
            
            await expect(
                riskManager.assessPositionRisk(
                    token,
                    ethers.utils.parseEther("1000"),
                    100,
                    1000
                )
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Utility Functions", function () {
        beforeEach(async function () {
            // Add some risk parameters
            const token1 = assetToken.address;
            const token2 = ethers.Wallet.createRandom().address;
            
            await riskManager.addRiskParameter(token1, 200, 3000, 500, 2000);
            await riskManager.addRiskParameter(token2, 150, 2500, 400, 1500);
        });

        it("Should return all supported tokens", async function () {
            const supportedTokens = await riskManager.getSupportedTokens();
            expect(supportedTokens.length).to.equal(2);
        });

        it("Should return risk parameter info", async function () {
            const token = assetToken.address;
            
            const riskParam = await riskManager.getRiskParameterInfo(token);
            expect(riskParam.maxLeverage).to.equal(200);
            expect(riskParam.maxPositionSize).to.equal(3000);
            expect(riskParam.isActive).to.be.true;
        });

        it("Should return false for non-existent risk parameter", async function () {
            const token = ethers.Wallet.createRandom().address;
            
            const hasRiskParam = await riskManager.hasRiskParameter(token);
            expect(hasRiskParam).to.be.false;
        });

        it("Should return true for existing risk parameter", async function () {
            const token = assetToken.address;
            
            const hasRiskParam = await riskManager.hasRiskParameter(token);
            expect(hasRiskParam).to.be.true;
        });
    });
});