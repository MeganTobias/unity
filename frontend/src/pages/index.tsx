import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../connectors';
import Dashboard from '../components/Dashboard';
import ConnectWallet from '../components/ConnectWallet';
import Header from '../components/Header';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Main = styled.main`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 3rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  font-size: 1.2rem;
  margin-bottom: 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

export default function Home() {
  const { active, account, activate, deactivate } = useWeb3React();
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      await activate(injected);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    deactivate();
  };

  return (
    <Container>
      <Head>
        <title>DeFi Asset Management Platform</title>
        <meta name="description" content="Decentralized Asset Management Platform for Multi-Chain DeFi" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header 
        account={account} 
        onConnect={connectWallet} 
        onDisconnect={disconnectWallet}
        isLoading={isLoading}
      />

      <Main>
        <Title>DeFi Asset Management</Title>
        <Subtitle>
          Manage your multi-chain digital assets with automated yield strategies, 
          risk management, and community-driven governance.
        </Subtitle>

        {active ? (
          <Dashboard account={account} />
        ) : (
          <ConnectWallet onConnect={connectWallet} isLoading={isLoading} />
        )}
      </Main>
    </Container>
  );
}
