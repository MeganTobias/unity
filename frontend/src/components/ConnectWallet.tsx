import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Icon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const Title = styled.h2`
  color: white;
  font-size: 2rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  text-align: center;
  margin-bottom: 2rem;
  max-width: 500px;
  line-height: 1.6;
`;

const Button = styled.button<{ isLoading?: boolean }>`
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Features = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
  width: 100%;
  max-width: 600px;
`;

const Feature = styled.div`
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const FeatureIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`;

const FeatureTitle = styled.h3`
  color: white;
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const FeatureDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

interface ConnectWalletProps {
  onConnect: () => void;
  isLoading: boolean;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ onConnect, isLoading }) => {
  return (
    <Container>
      <Icon>🔗</Icon>
      <Title>Connect Your Wallet</Title>
      <Description>
        Connect your wallet to start managing your DeFi assets with automated 
        yield strategies and risk management tools.
      </Description>
      
      <Button onClick={onConnect} disabled={isLoading}>
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      
      <Features>
        <Feature>
          <FeatureIcon>🌐</FeatureIcon>
          <FeatureTitle>Multi-Chain</FeatureTitle>
          <FeatureDescription>
            Support for Ethereum, BSC, Polygon, and more
          </FeatureDescription>
        </Feature>
        
        <Feature>
          <FeatureIcon>📈</FeatureIcon>
          <FeatureTitle>Yield Optimization</FeatureTitle>
          <FeatureDescription>
            Automated strategies for maximum returns
          </FeatureDescription>
        </Feature>
        
        <Feature>
          <FeatureIcon>🛡️</FeatureIcon>
          <FeatureTitle>Risk Management</FeatureTitle>
          <FeatureDescription>
            Built-in protection and monitoring
          </FeatureDescription>
        </Feature>
      </Features>
    </Container>
  );
};

export default ConnectWallet;
