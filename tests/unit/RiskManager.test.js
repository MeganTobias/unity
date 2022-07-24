const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RiskManager", function () {
    let riskManager;
    let priceOracle;
    let owner;
    let riskAssessor;
    let user;

    beforeEach(async function () {
        [owner, riskAssessor, user] = await ethers.getSigners();
        
        // Deploy PriceOracle
        const PriceOracle = await ethers.getContractFactory("PriceOracle");
        priceOracle = await PriceOracle.deploy();
        await priceOracle.deployed();
        
        // Deploy RiskManager
        const RiskManager = await ethers.getContractFactory("RiskManager");
        riskManager = await RiskManager.deploy(priceOracle.address);
        await riskManager.deployed();
        
        // Authorize risk assessor
        await riskManager.authorizeRiskAssessor(riskAssessor.address);
    });

    describe("Deployment", function () {
        it("Should set the correct price oracle", async function () {
            expect(await riskManager.priceOracle()).to.equal(priceOracle.address);
        });

        it("Should set the correct owner", async function () {
            expect(await riskManager.owner()).to.equal(owner.address);
        });

        it("Should authorize owner as risk assessor", async function () {
            expect(await riskManager.authorizedRiskAssessors(owner.address)).to.be.true;
        });
    });

    describe("Risk Profile Management", function () {
        it("Should allow users to set their risk profile", async function () {
            const maxDrawdown = 1000; // 10%
            const maxLeverage = 500; // 5x
            const maxConcentration = 3000; // 30%
            const maxCorrelation = 6000; // 60%
            const stopLossThreshold = 500; // 5%
            const takeProfitThreshold = 2000; // 20%
            
            const tx = await riskManager.connect(user).setUserRiskProfile(
                maxDrawdown,
                maxLeverage,
                maxConcentration,
                maxCorrelation,
                stopLossThreshold,
                takeProfitThreshold
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RiskProfileUpdated');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.maxDrawdown).to.equal(maxDrawdown);
            expect(event.args.maxLeverage).to.equal(maxLeverage);
            
            const profile = await riskManager.userRiskProfiles(user.address);
            expect(profile.maxDrawdown).to.equal(maxDrawdown);
            expect(profile.maxLeverage).to.equal(maxLeverage);
            expect(profile.isActive).to.be.true;
        });

        it("Should not allow max drawdown above 20%", async function () {
            await expect(
                riskManager.connect(user).setUserRiskProfile(
                    2500, // 25%
                    500,
                    3000,
                    6000,
                    500,
                    2000
                )
            ).to.be.revertedWith("RiskManager: max drawdown too high");
        });

        it("Should not allow max leverage above 10x", async function () {
            await expect(
                riskManager.connect(user).setUserRiskProfile(
                    1000,
                    1200, // 12x
                    3000,
                    6000,
                    500,
                    2000
                )
            ).to.be.revertedWith("RiskManager: max leverage too high");
        });

        it("Should not allow max concentration above 50%", async function () {
            await expect(
                riskManager.connect(user).setUserRiskProfile(
                    1000,
                    500,
                    6000, // 60%
                    6000,
                    500,
                    2000
                )
            ).to.be.revertedWith("RiskManager: max concentration too high");
        });

        it("Should not allow max correlation above 80%", async function () {
            await expect(
                riskManager.connect(user).setUserRiskProfile(
                    1000,
                    500,
                    3000,
                    9000, // 90%
                    500,
                    2000
                )
            ).to.be.revertedWith("RiskManager: max correlation too high");
        });
    });

    describe("Asset Risk Assessment", function () {
        it("Should allow authorized risk assessors to update asset risk", async function () {
            const token = ethers.Wallet.createRandom().address;
            const volatility = 5000; // 50%
            const correlation = 6000; // 60%
            const liquidity = 8000; // 80%
            
            const tx = await riskManager.connect(riskAssessor).updateAssetRisk(
                token,
                volatility,
                correlation,
                liquidity
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'AssetRiskUpdated');
            
            expect(event.args.token).to.equal(token);
            expect(event.args.volatility).to.equal(volatility);
            
            const assetRisk = await riskManager.assetRisks(token);
            expect(assetRisk.volatility).to.equal(volatility);
            expect(assetRisk.correlation).to.equal(correlation);
            expect(assetRisk.liquidity).to.equal(liquidity);
        });

        it("Should not allow unauthorized users to update asset risk", async function () {
            await expect(
                riskManager.connect(user).updateAssetRisk(
                    ethers.Wallet.createRandom().address,
                    5000,
                    6000,
                    8000
                )
            ).to.be.revertedWith("RiskManager: not authorized risk assessor");
        });

        it("Should not allow updating risk for zero address token", async function () {
            await expect(
                riskManager.connect(riskAssessor).updateAssetRisk(
                    ethers.constants.AddressZero,
                    5000,
                    6000,
                    8000
                )
            ).to.be.revertedWith("RiskManager: invalid token address");
        });
    });

    describe("Position Risk Assessment", function () {
        let token;

        beforeEach(async function () {
            token = ethers.Wallet.createRandom().address;
            await riskManager.connect(riskAssessor).updateAssetRisk(token, 5000, 6000, 8000);
        });

        it("Should assess position risk correctly", async function () {
            const amount = ethers.utils.parseEther("1000");
            
            const tx = await riskManager.connect(riskAssessor).assessPositionRisk(
                user.address,
                token,
                amount
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'PositionRiskAlert');
            
            // Risk score should be calculated
            const positionRisk = await riskManager.positionRisks(user.address, token);
            expect(positionRisk.riskScore).to.be.gt(0);
        });

        it("Should not assess risk for users without risk profile", async function () {
            const amount = ethers.utils.parseEther("1000");
            
            await expect(
                riskManager.connect(riskAssessor).assessPositionRisk(
                    user.address,
                    token,
                    amount
                )
            ).to.be.revertedWith("RiskManager: user risk profile not set");
        });

        it("Should not assess risk for unassessed assets", async function () {
            const unassessedToken = ethers.Wallet.createRandom().address;
            const amount = ethers.utils.parseEther("1000");
            
            // Set user risk profile first
            await riskManager.connect(user).setUserRiskProfile(1000, 500, 3000, 6000, 500, 2000);
            
            await expect(
                riskManager.connect(riskAssessor).assessPositionRisk(
                    user.address,
                    unassessedToken,
                    amount
                )
            ).to.be.revertedWith("RiskManager: asset risk not assessed");
        });
    });

    describe("Risk Threshold Checking", function () {
        let token;

        beforeEach(async function () {
            token = ethers.Wallet.createRandom().address;
            await riskManager.connect(riskAssessor).updateAssetRisk(token, 5000, 6000, 8000);
            await riskManager.connect(user).setUserRiskProfile(1000, 500, 3000, 6000, 500, 2000);
            await riskManager.connect(riskAssessor).assessPositionRisk(user.address, token, ethers.utils.parseEther("1000"));
        });

        it("Should check risk thresholds correctly", async function () {
            const isWithinThresholds = await riskManager.checkRiskThresholds(user.address, token);
            expect(isWithinThresholds).to.be.true;
        });
    });

    describe("Risk Score Calculation", function () {
        it("Should calculate risk score correctly", async function () {
            const volatility = 5000; // 50%
            const correlation = 6000; // 60%
            const liquidity = 8000; // 80%
            
            const riskScore = await riskManager.calculateRiskScore(volatility, correlation, liquidity);
            expect(riskScore).to.be.gt(0);
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow authorized risk assessors to trigger emergency stop", async function () {
            const reason = "High risk detected";
            
            const tx = await riskManager.connect(riskAssessor).triggerEmergencyStop(user.address, reason);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'EmergencyStop');
            
            expect(event.args.user).to.equal(user.address);
            expect(event.args.reason).to.equal(reason);
        });

        it("Should not allow unauthorized users to trigger emergency stop", async function () {
            await expect(
                riskManager.connect(user).triggerEmergencyStop(user.address, "Test reason")
            ).to.be.revertedWith("RiskManager: not authorized risk assessor");
        });
    });

    describe("Global Risk Management", function () {
        it("Should allow authorized risk assessors to update global risk score", async function () {
            const tx = await riskManager.connect(riskAssessor).updateGlobalRiskScore();
            const receipt = await tx.wait();
            
            // Should not revert
            expect(receipt.status).to.equal(1);
        });

        it("Should not allow updating global risk score too frequently", async function () {
            await riskManager.connect(riskAssessor).updateGlobalRiskScore();
            
            await expect(
                riskManager.connect(riskAssessor).updateGlobalRiskScore()
            ).to.be.revertedWith("RiskManager: too early to update");
        });
    });

    describe("Administrative Functions", function () {
        it("Should allow owner to authorize risk assessors", async function () {
            const newAssessor = ethers.Wallet.createRandom().address;
            
            const tx = await riskManager.authorizeRiskAssessor(newAssessor);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RiskAssessorAuthorized');
            
            expect(event.args.assessor).to.equal(newAssessor);
            expect(await riskManager.authorizedRiskAssessors(newAssessor)).to.be.true;
        });

        it("Should allow owner to deauthorize risk assessors", async function () {
            await riskManager.authorizeRiskAssessor(riskAssessor.address);
            
            const tx = await riskManager.deauthorizeRiskAssessor(riskAssessor.address);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'RiskAssessorDeauthorized');
            
            expect(event.args.assessor).to.equal(riskAssessor.address);
            expect(await riskManager.authorizedRiskAssessors(riskAssessor.address)).to.be.false;
        });

        it("Should not allow non-owner to authorize risk assessors", async function () {
            await expect(
                riskManager.connect(user).authorizeRiskAssessor(ethers.Wallet.createRandom().address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to update risk update interval", async function () {
            const newInterval = 1800; // 30 minutes
            await riskManager.setRiskUpdateInterval(newInterval);
            
            expect(await riskManager.riskUpdateInterval()).to.equal(newInterval);
        });

        it("Should not allow zero risk update interval", async function () {
            await expect(
                riskManager.setRiskUpdateInterval(0)
            ).to.be.revertedWith("RiskManager: invalid interval");
        });

        it("Should allow owner to pause and unpause", async function () {
            await riskManager.pause();
            expect(await riskManager.paused()).to.be.true;
            
            await riskManager.unpause();
            expect(await riskManager.paused()).to.be.false;
        });
    });
});
