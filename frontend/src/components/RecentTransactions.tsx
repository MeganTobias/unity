import React from 'react';
import styled from 'styled-components';

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TransactionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const TransactionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const TransactionIcon = styled.div<{ type: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => {
    switch(props.type) {
      case 'deposit': return 'linear-gradient(45deg, #4ade80, #22c55e)';
      case 'withdraw': return 'linear-gradient(45deg, #f87171, #ef4444)';
      case 'harvest': return 'linear-gradient(45deg, #fbbf24, #f59e0b)';
      default: return 'linear-gradient(45deg, #667eea, #764ba2)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

const TransactionDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const TransactionType = styled.div`
  color: white;
  font-weight: 600;
  font-size: 1rem;
`;

const TransactionAsset = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const TransactionValue = styled.div`
  text-align: right;
`;

const Value = styled.div`
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
`;

const Time = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const RecentTransactions: React.FC = () => {
  const transactions = [
    {
      id: 1,
      type: 'deposit',
      icon: '⬇️',
      asset: 'USDC',
      amount: 5000,
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'harvest',
      icon: '🌾',
      asset: 'ETH',
      amount: 0.15,
      time: '5 hours ago'
    },
    {
      id: 3,
      type: 'withdraw',
      icon: '⬆️',
      asset: 'MATIC',
      amount: 1000,
      time: '1 day ago'
    },
    {
      id: 4,
      type: 'deposit',
      icon: '⬇️',
      asset: 'BNB',
      amount: 2.5,
      time: '2 days ago'
    },
    {
      id: 5,
      type: 'harvest',
      icon: '🌾',
      asset: 'USDC',
      amount: 125,
      time: '3 days ago'
    }
  ];

  const formatValue = (amount: number, asset: string) => {
    if (asset === 'ETH' || asset === 'BNB') {
      return `${amount} ${asset}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'deposit': return 'Deposit';
      case 'withdraw': return 'Withdrawal';
      case 'harvest': return 'Harvest';
      default: return 'Transaction';
    }
  };

  return (
    <TransactionList>
      {transactions.map((transaction) => (
        <TransactionItem key={transaction.id}>
          <TransactionInfo>
            <TransactionIcon type={transaction.type}>
              {transaction.icon}
            </TransactionIcon>
            <TransactionDetails>
              <TransactionType>
                {getTypeLabel(transaction.type)}
              </TransactionType>
              <TransactionAsset>
                {transaction.asset}
              </TransactionAsset>
            </TransactionDetails>
          </TransactionInfo>
          <TransactionValue>
            <Value>
              {formatValue(transaction.amount, transaction.asset)}
            </Value>
            <Time>{transaction.time}</Time>
          </TransactionValue>
        </TransactionItem>
      ))}
    </TransactionList>
  );
};

export default RecentTransactions;
