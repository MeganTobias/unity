import React from 'react';
import styled from 'styled-components';

const AssetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AssetItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const AssetInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AssetIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

const AssetDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const AssetName = styled.div`
  color: white;
  font-weight: 600;
  font-size: 1rem;
`;

const AssetSymbol = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const AssetValue = styled.div`
  text-align: right;
`;

const Value = styled.div`
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
`;

const Change = styled.div<{ positive?: boolean }>`
  color: ${props => props.positive ? '#4ade80' : '#f87171'};
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

const AssetOverview: React.FC = () => {
  const assets = [
    {
      name: 'Ethereum',
      symbol: 'ETH',
      icon: 'Ξ',
      value: 45000,
      change: 2.5,
      positive: true
    },
    {
      name: 'USD Coin',
      symbol: 'USDC',
      icon: '$',
      value: 25000,
      change: 0.1,
      positive: true
    },
    {
      name: 'Binance Coin',
      symbol: 'BNB',
      icon: 'B',
      value: 15000,
      change: -1.2,
      positive: false
    },
    {
      name: 'Polygon',
      symbol: 'MATIC',
      icon: 'M',
      value: 8000,
      change: 5.8,
      positive: true
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AssetList>
      {assets.map((asset, index) => (
        <AssetItem key={index}>
          <AssetInfo>
            <AssetIcon>{asset.icon}</AssetIcon>
            <AssetDetails>
              <AssetName>{asset.name}</AssetName>
              <AssetSymbol>{asset.symbol}</AssetSymbol>
            </AssetDetails>
          </AssetInfo>
          <AssetValue>
            <Value>{formatCurrency(asset.value)}</Value>
            <Change positive={asset.positive}>
              {asset.positive ? '+' : ''}{asset.change}%
            </Change>
          </AssetValue>
        </AssetItem>
      ))}
    </AssetList>
  );
};

export default AssetOverview;
