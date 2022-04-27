import React from 'react';
import styled from 'styled-components';

const ChartContainer = styled.div`
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ChartPlaceholder = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
`;

const ChartIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const ChartText = styled.div`
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const ChartSubtext = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
`;

const PortfolioChart: React.FC = () => {
  return (
    <ChartContainer>
      <ChartPlaceholder>
        <ChartIcon>📊</ChartIcon>
        <ChartText>Portfolio Performance Chart</ChartText>
        <ChartSubtext>
          Interactive chart showing your portfolio value over time
        </ChartSubtext>
      </ChartPlaceholder>
    </ChartContainer>
  );
};

export default PortfolioChart;
