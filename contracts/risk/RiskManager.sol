// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../oracle/PriceOracle.sol";

/**
 * @title RiskManager
 * @dev Comprehensive risk management system for asset protection
 * @author DeFi Asset Management Team
 */
contract RiskManager is ReentrancyGuard, Ownable, Pausable {
    struct RiskProfile {
        uint256 maxDrawdown; // Maximum allowed drawdown in basis points
        uint256 maxLeverage; // Maximum leverage ratio
        uint256 maxConcentration; // Maximum single asset concentration
        uint256 maxCorrelation; // Maximum correlation between assets
        uint256 stopLossThreshold; // Stop loss threshold in basis points
        uint256 takeProfitThreshold; // Take profit threshold in basis points
        bool isActive;
    }
    
    struct AssetRisk {
        address token;
        uint256 volatility;
        uint256 correlation;
        uint256 liquidity;
        uint256 lastUpdate;
        bool isHighRisk;
    }
    
    struct PositionRisk {
        address user;
        address token;
        uint256 amount;
        uint256 entryPrice;
        uint256 currentPrice;
        uint256 pnl;
        uint256 riskScore;
        bool isAtRisk;
    }
    
    mapping(address => RiskProfile) public userRiskProfiles;
    mapping(address => AssetRisk) public assetRisks;
    mapping(address => mapping(address => PositionRisk)) public positionRisks;
    mapping(address => bool) public authorizedRiskAssessors;
    
    PriceOracle public priceOracle;
    
    uint256 public constant MAX_DRAWDOWN = 2000; // 20%
    uint256 public constant MAX_LEVERAGE = 1000; // 10x
    uint256 public constant MAX_CONCENTRATION = 5000; // 50%
    uint256 public constant MAX_CORRELATION = 8000; // 80%
    uint256 public constant HIGH_RISK_THRESHOLD = 7000; // 70%
    
    uint256 public globalRiskScore;
    uint256 public lastRiskUpdate;
    uint256 public riskUpdateInterval = 3600; // 1 hour
    
    event RiskProfileUpdated(address indexed user, uint256 maxDrawdown, uint256 maxLeverage);
    event AssetRiskUpdated(address indexed token, uint256 volatility, uint256 riskScore);
    event PositionRiskAlert(address indexed user, address indexed token, uint256 riskScore);
    event RiskThresholdBreached(address indexed user, string riskType, uint256 value);
    event EmergencyStop(address indexed user, string reason);
    event RiskAssessorAuthorized(address indexed assessor);
    event RiskAssessorDeauthorized(address indexed assessor);
    
    modifier onlyAuthorizedRiskAssessor() {
        require(authorizedRiskAssessors[msg.sender], "RiskManager: not authorized risk assessor");
        _;
    }
    
    constructor(address _priceOracle) {
        priceOracle = PriceOracle(_priceOracle);
        authorizedRiskAssessors[msg.sender] = true;
    }
    
    function setUserRiskProfile(
        uint256 _maxDrawdown,
        uint256 _maxLeverage,
        uint256 _maxConcentration,
        uint256 _maxCorrelation,
        uint256 _stopLossThreshold,
        uint256 _takeProfitThreshold
    ) external {
        require(_maxDrawdown <= MAX_DRAWDOWN, "RiskManager: max drawdown too high");
        require(_maxLeverage <= MAX_LEVERAGE, "RiskManager: max leverage too high");
        require(_maxConcentration <= MAX_CONCENTRATION, "RiskManager: max concentration too high");
        require(_maxCorrelation <= MAX_CORRELATION, "RiskManager: max correlation too high");
        
        userRiskProfiles[msg.sender] = RiskProfile({
            maxDrawdown: _maxDrawdown,
            maxLeverage: _maxLeverage,
            maxConcentration: _maxConcentration,
            maxCorrelation: _maxCorrelation,
            stopLossThreshold: _stopLossThreshold,
            takeProfitThreshold: _takeProfitThreshold,
            isActive: true
        });
        
        emit RiskProfileUpdated(msg.sender, _maxDrawdown, _maxLeverage);
    }
    
    function updateAssetRisk(
        address _token,
        uint256 _volatility,
        uint256 _correlation,
        uint256 _liquidity
    ) external onlyAuthorizedRiskAssessor {
        require(_token != address(0), "RiskManager: invalid token address");
        
        uint256 riskScore = calculateRiskScore(_volatility, _correlation, _liquidity);
        
        assetRisks[_token] = AssetRisk({
            token: _token,
            volatility: _volatility,
            correlation: _correlation,
            liquidity: _liquidity,
            lastUpdate: block.timestamp,
            isHighRisk: riskScore >= HIGH_RISK_THRESHOLD
        });
        
        emit AssetRiskUpdated(_token, _volatility, riskScore);
    }
    
    function assessPositionRisk(
        address _user,
        address _token,
        uint256 _amount
    ) external onlyAuthorizedRiskAssessor returns (uint256) {
        require(_user != address(0), "RiskManager: invalid user address");
        require(_token != address(0), "RiskManager: invalid token address");
        require(_amount > 0, "RiskManager: invalid amount");
        
        RiskProfile memory profile = userRiskProfiles[_user];
        require(profile.isActive, "RiskManager: user risk profile not set");
        
        AssetRisk memory assetRisk = assetRisks[_token];
        require(assetRisk.lastUpdate > 0, "RiskManager: asset risk not assessed");
        
        uint256 currentPrice = priceOracle.getPrice(_token);
        uint256 positionValue = (_amount * currentPrice) / 1e18;
        
        // Calculate position risk score
        uint256 riskScore = calculatePositionRiskScore(
            profile,
            assetRisk,
            positionValue,
            _amount
        );
        
        positionRisks[_user][_token] = PositionRisk({
            user: _user,
            token: _token,
            amount: _amount,
            entryPrice: currentPrice,
            currentPrice: currentPrice,
            pnl: 0,
            riskScore: riskScore,
            isAtRisk: riskScore >= HIGH_RISK_THRESHOLD
        });
        
        if (riskScore >= HIGH_RISK_THRESHOLD) {
            emit PositionRiskAlert(_user, _token, riskScore);
        }
        
        return riskScore;
    }
    
    function checkRiskThresholds(address _user, address _token) external view returns (bool) {
        RiskProfile memory profile = userRiskProfiles[_user];
        if (!profile.isActive) return true;
        
        PositionRisk memory position = positionRisks[_user][_token];
        if (position.amount == 0) return true;
        
        // Check drawdown
        if (position.pnl < 0) {
            uint256 drawdown = (uint256(-position.pnl) * 10000) / position.amount;
            if (drawdown > profile.maxDrawdown) {
                return false;
            }
        }
        
        // Check concentration
        // This would require total portfolio value calculation
        // Simplified check for now
        if (position.riskScore > profile.maxConcentration) {
            return false;
        }
        
        return true;
    }
    
    function calculateRiskScore(
        uint256 _volatility,
        uint256 _correlation,
        uint256 _liquidity
    ) public pure returns (uint256) {
        // Weighted risk score calculation
        uint256 volatilityScore = (_volatility * 40) / 100; // 40% weight
        uint256 correlationScore = (_correlation * 30) / 100; // 30% weight
        uint256 liquidityScore = ((10000 - _liquidity) * 30) / 100; // 30% weight (inverted)
        
        return volatilityScore + correlationScore + liquidityScore;
    }
    
    function calculatePositionRiskScore(
        RiskProfile memory _profile,
        AssetRisk memory _assetRisk,
        uint256 _positionValue,
        uint256 _amount
    ) internal pure returns (uint256) {
        uint256 baseRiskScore = calculateRiskScore(
            _assetRisk.volatility,
            _assetRisk.correlation,
            _assetRisk.liquidity
        );
        
        // Adjust for position size
        uint256 sizeMultiplier = _positionValue > 1000000 * 1e18 ? 120 : 100; // 20% increase for large positions
        
        return (baseRiskScore * sizeMultiplier) / 100;
    }
    
    function triggerEmergencyStop(address _user, string memory _reason) external onlyAuthorizedRiskAssessor {
        emit EmergencyStop(_user, _reason);
        // In a real implementation, this would pause user operations
    }
    
    function updateGlobalRiskScore() external onlyAuthorizedRiskAssessor {
        require(block.timestamp >= lastRiskUpdate + riskUpdateInterval, "RiskManager: too early to update");
        
        // Calculate global risk score based on all positions
        // This is a simplified calculation
        globalRiskScore = 5000; // Placeholder
        lastRiskUpdate = block.timestamp;
    }
    
    function authorizeRiskAssessor(address _assessor) external onlyOwner {
        require(_assessor != address(0), "RiskManager: invalid assessor address");
        authorizedRiskAssessors[_assessor] = true;
        emit RiskAssessorAuthorized(_assessor);
    }
    
    function deauthorizeRiskAssessor(address _assessor) external onlyOwner {
        require(_assessor != address(0), "RiskManager: invalid assessor address");
        authorizedRiskAssessors[_assessor] = false;
        emit RiskAssessorDeauthorized(_assessor);
    }
    
    function setRiskUpdateInterval(uint256 _interval) external onlyOwner {
        require(_interval > 0, "RiskManager: invalid interval");
        riskUpdateInterval = _interval;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
