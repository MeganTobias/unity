import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import AssetOverview from './AssetOverview';
import StrategyList from './StrategyList';
import PortfolioChart from './PortfolioChart';
import RecentTransactions from './RecentTransactions';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FullWidthSection = styled.div`
  grid-column: 1 / -1;
  margin-bottom: 2rem;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const SectionTitle = styled.h2`
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Tab = styled.button<{ active?: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 25px;
  background: ${props => props.active 
    ? 'linear-gradient(45deg, #667eea, #764ba2)' 
    : 'rgba(255, 255, 255, 0.1)'
  };
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active 
      ? 'linear-gradient(45deg, #667eea, #764ba2)' 
      : 'rgba(255, 255, 255, 0.2)'
    };
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatValue = styled.div`
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

interface DashboardProps {
  account: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ account }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    totalPnl: 0,
    activeStrategies: 0,
    totalFees: 0
  });

  useEffect(() => {
    // Mock data - in real app, this would fetch from contracts
    setPortfolioData({
      totalValue: 125000,
      totalPnl: 8500,
      activeStrategies: 3,
      totalFees: 125
    });
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div>
      <TabContainer>
        <Tab 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </Tab>
        <Tab 
          active={activeTab === 'strategies'} 
          onClick={() => setActiveTab('strategies')}
        >
          🎯 Strategies
        </Tab>
        <Tab 
          active={activeTab === 'transactions'} 
          onClick={() => setActiveTab('transactions')}
        >
          📋 Transactions
        </Tab>
      </TabContainer>

      <StatsGrid>
        <StatCard>
          <StatValue>{formatCurrency(portfolioData.totalValue)}</StatValue>
          <StatLabel>Total Portfolio Value</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue style={{ color: portfolioData.totalPnl >= 0 ? '#4ade80' : '#f87171' }}>
            {portfolioData.totalPnl >= 0 ? '+' : ''}{formatCurrency(portfolioData.totalPnl)}
          </StatValue>
          <StatLabel>Total P&L</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{portfolioData.activeStrategies}</StatValue>
          <StatLabel>Active Strategies</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{formatCurrency(portfolioData.totalFees)}</StatValue>
          <StatLabel>Total Fees Paid</StatLabel>
        </StatCard>
      </StatsGrid>

      {activeTab === 'overview' && (
        <DashboardContainer>
          <Section>
            <SectionTitle>📈 Portfolio Chart</SectionTitle>
            <PortfolioChart />
          </Section>
          <Section>
            <SectionTitle>💰 Asset Overview</SectionTitle>
            <AssetOverview />
          </Section>
        </DashboardContainer>
      )}

      {activeTab === 'strategies' && (
        <FullWidthSection>
          <Section>
            <SectionTitle>🎯 Available Strategies</SectionTitle>
            <StrategyList />
          </Section>
        </FullWidthSection>
      )}

      {activeTab === 'transactions' && (
        <FullWidthSection>
          <Section>
            <SectionTitle>📋 Recent Transactions</SectionTitle>
            <RecentTransactions />
          </Section>
        </FullWidthSection>
      )}
    </div>
  );
};

export default Dashboard;
