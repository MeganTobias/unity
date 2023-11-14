# Deployment Guide - DeFi Asset Management Platform

This guide provides comprehensive instructions for deploying the DeFi Asset Management Platform across different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** >= 16.x
- **npm** >= 8.x
- **Docker** >= 20.x
- **Docker Compose** >= 2.x
- **Git** >= 2.x
- **PostgreSQL** >= 13.x
- **Redis** >= 6.x

### Required Services

- **Ethereum Node** (Infura, Alchemy, or self-hosted)
- **IPFS Node** (Pinata, Infura, or self-hosted)
- **Monitoring Service** (Datadog, New Relic, or self-hosted)

### Development Tools

- **Hardhat** for smart contract development
- **PM2** for process management
- **Nginx** for reverse proxy
- **Certbot** for SSL certificates

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/asset-management/platform.git
cd platform
```

### 2. Environment Variables

Create environment files for each component:

#### Smart Contracts (.env)

```env
# Network Configuration
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
ARBITRUM_RPC_URL=https://arbitrum-mainnet.infura.io/v3/YOUR_PROJECT_ID
BSC_RPC_URL=https://bsc-dataseed.binance.org

# Private Keys (Use hardware wallet or secure key management in production)
DEPLOYER_PRIVATE_KEY=0x...
OWNER_PRIVATE_KEY=0x...

# Gas Configuration
GAS_PRICE=20000000000
GAS_LIMIT=8000000

# Verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
POLYGONSCAN_API_KEY=YOUR_POLYGONSCAN_API_KEY
ARBISCAN_API_KEY=YOUR_ARBISCAN_API_KEY
BSCSCAN_API_KEY=YOUR_BSCSCAN_API_KEY
```

#### Backend (.env)

```env
# Application
NODE_ENV=production
PORT=3001
API_VERSION=v1

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/asset_management
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
SESSION_SECRET=your-super-secure-session-secret

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID

# Contract Addresses
ASSET_TOKEN_ADDRESS=0x...
ASSET_MANAGER_ADDRESS=0x...
DAO_GOVERNANCE_ADDRESS=0x...

# External Services
IPFS_API_KEY=your-ipfs-api-key
COINGECKO_API_KEY=your-coingecko-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

#### Frontend (.env.local)

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# Blockchain Network
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID

# Contract Addresses
NEXT_PUBLIC_ASSET_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_ASSET_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_DAO_GOVERNANCE_ADDRESS=0x...

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=UA-XXXXXXXXX-X
NEXT_PUBLIC_HOTJAR_ID=XXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_TESTNET=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Smart Contract Deployment

### 1. Compile Contracts

```bash
npm install
npx hardhat compile
```

### 2. Deploy to Networks

#### Testnet Deployment (Goerli)

```bash
npx hardhat run scripts/deploy.js --network goerli
```

#### Mainnet Deployment

```bash
# Deploy to Ethereum
npx hardhat run scripts/deploy.js --network mainnet

# Deploy to Polygon
npx hardhat run scripts/deploy.js --network polygon

# Deploy to Arbitrum
npx hardhat run scripts/deploy.js --network arbitrum

# Deploy to BSC
npx hardhat run scripts/deploy.js --network bsc
```

### 3. Verify Contracts

```bash
# Verify on Etherscan
npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS "Constructor Arg 1" "Constructor Arg 2"

# Verify on Polygonscan
npx hardhat verify --network polygon DEPLOYED_CONTRACT_ADDRESS "Constructor Arg 1" "Constructor Arg 2"
```

### 4. Initialize Contracts

```bash
npx hardhat run scripts/initialize.js --network mainnet
```

## Backend Deployment

### 1. Install Dependencies

```bash
cd backend
npm install --production
```

### 2. Database Migration

```bash
# Run database migrations
npm run migrate

# Seed initial data
npm run seed
```

### 3. Build Application

```bash
npm run build
```

### 4. Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Setup startup script
pm2 startup
pm2 save
```

### 5. Configure Nginx

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Frontend Deployment

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Build Application

```bash
npm run build
```

### 3. Deploy with Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 4. Alternative: Deploy with Docker

```dockerfile
FROM node:16-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

FROM node:16-alpine AS runner
WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### 5. Configure Nginx for Frontend

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Setup

### 1. PostgreSQL Installation

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Database Creation

```sql
-- Create database
CREATE DATABASE asset_management;

-- Create user
CREATE USER asset_manager WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE asset_management TO asset_manager;
```

### 3. Redis Installation

```bash
# Ubuntu/Debian
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Configuration

### 1. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### 2. Firewall Configuration

```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow custom ports (if needed)
sudo ufw allow 3000
sudo ufw allow 3001

# Enable firewall
sudo ufw enable
```

### 3. Monitoring Setup

#### PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-server-monit
```

#### System Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs
```

## Monitoring and Logging

### 1. Application Logs

```bash
# View PM2 logs
pm2 logs

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Health Checks

#### Backend Health Check

```bash
curl https://api.yourdomain.com/health
```

#### Frontend Health Check

```bash
curl https://yourdomain.com/api/health
```

### 3. Monitoring Dashboard

Set up a monitoring dashboard using:
- **Grafana** for metrics visualization
- **Prometheus** for metrics collection
- **AlertManager** for alerting

## Security Considerations

### 1. Smart Contract Security

- [ ] Multi-signature wallet for ownership
- [ ] Time locks for critical functions
- [ ] Emergency pause mechanisms
- [ ] Regular security audits
- [ ] Bug bounty program

### 2. Backend Security

- [ ] Rate limiting
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Security headers

### 3. Infrastructure Security

- [ ] Regular security updates
- [ ] Fail2ban for intrusion prevention
- [ ] VPN for administrative access
- [ ] Regular backups
- [ ] Disaster recovery plan

## Troubleshooting

### Common Issues

#### Smart Contract Deployment Fails

```bash
# Check gas price
npx hardhat run scripts/check-gas-price.js --network mainnet

# Increase gas limit
# Edit hardhat.config.js gas settings
```

#### Backend Connection Issues

```bash
# Check database connection
npm run db:test

# Check Redis connection
redis-cli ping
```

#### Frontend Build Errors

```bash
# Clear cache
rm -rf .next
npm run build
```

### Performance Issues

#### High Memory Usage

```bash
# Check memory usage
free -h

# Restart services
pm2 restart all
```

#### Slow API Responses

```bash
# Check database performance
# Check Redis performance
# Review application logs
```

### Log Analysis

```bash
# Analyze error patterns
grep "ERROR" /var/log/app.log | tail -100

# Monitor real-time logs
tail -f /var/log/app.log | grep -i error
```

## Maintenance

### Regular Tasks

- [ ] Update dependencies monthly
- [ ] Backup database daily
- [ ] Monitor system resources
- [ ] Review security logs
- [ ] Test disaster recovery procedures

### Deployment Checklist

- [ ] Code review completed
- [ ] Tests passing
- [ ] Security scan completed
- [ ] Backup created
- [ ] Rollback plan prepared
- [ ] Monitoring in place
- [ ] Team notified

---

## Support

For additional support:
- Documentation: https://docs.yourdomain.com
- Discord: https://discord.gg/yourserver
- GitHub Issues: https://github.com/yourorg/platform/issues

---

*Last updated: January 2023*

