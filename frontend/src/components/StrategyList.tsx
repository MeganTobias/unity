import React, { useState } from 'react';
import styled from 'styled-components';

const StrategyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const StrategyCard = styled.div<{ active?: boolean }>`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  
  ${props => props.active && `
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  `}
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
`;

const StrategyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const StrategyName = styled.h3`
  color: white;
  font-size: 1.2rem;
  margin: 0;
`;

const StatusBadge = styled.div<{ active?: boolean }>`
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => props.active ? '#4ade80' : '#f87171'};
  color: white;
`;

const StrategyDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
`;

const StrategyStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Stat = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `}
`;

const StrategyList: React.FC = () => {
  const [activeStrategies, setActiveStrategies] = useState<number[]>([]);

  const strategies = [
    {
      id: 1,
      name: 'USDC Yield Farming',
      description: 'Automated USDC yield farming across multiple DeFi protocols with risk management.',
      apy: 12.5,
      tvl: 2500000,
      fee: 2.5,
      risk: 'Low',
      active: true
    },
    {
      id: 2,
      name: 'ETH Staking Strategy',
      description: 'Ethereum staking with automated compound rewards and validator selection.',
      apy: 8.2,
      tvl: 1800000,
      fee: 3.0,
      risk: 'Medium',
      active: true
    },
    {
      id: 3,
      name: 'Liquidity Mining',
      description: 'Multi-pool liquidity mining with automated rebalancing and impermanent loss protection.',
      apy: 18.7,
      tvl: 3200000,
      fee: 4.0,
      risk: 'High',
      active: false
    },
    {
      id: 4,
      name: 'Arbitrage Bot',
      description: 'Cross-DEX arbitrage opportunities with MEV protection and gas optimization.',
      apy: 25.3,
      tvl: 1500000,
      fee: 5.0,
      risk: 'High',
      active: false
    }
  ];

  const toggleStrategy = (strategyId: number) => {
    setActiveStrategies(prev => 
      prev.includes(strategyId) 
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <StrategyGrid>
      {strategies.map((strategy) => (
        <StrategyCard 
          key={strategy.id} 
          active={activeStrategies.includes(strategy.id)}
          onClick={() => toggleStrategy(strategy.id)}
        >
          <StrategyHeader>
            <StrategyName>{strategy.name}</StrategyName>
            <StatusBadge active={strategy.active}>
              {strategy.active ? 'Active' : 'Inactive'}
            </StatusBadge>
          </StrategyHeader>
          
          <StrategyDescription>
            {strategy.description}
          </StrategyDescription>
          
          <StrategyStats>
            <Stat>
              <StatValue>{strategy.apy}%</StatValue>
              <StatLabel>APY</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{formatCurrency(strategy.tvl)}</StatValue>
              <StatLabel>TVL</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{strategy.fee}%</StatValue>
              <StatLabel>Fee</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{strategy.risk}</StatValue>
              <StatLabel>Risk</StatLabel>
            </Stat>
          </StrategyStats>
          
          <ActionButton 
            variant={activeStrategies.includes(strategy.id) ? 'secondary' : 'primary'}
            onClick={(e) => {
              e.stopPropagation();
              // Handle strategy action
            }}
          >
            {activeStrategies.includes(strategy.id) ? 'Deactivate' : 'Activate'}
          </ActionButton>
        </StrategyCard>
      ))}
    </StrategyGrid>
  );
};

export default StrategyList;
