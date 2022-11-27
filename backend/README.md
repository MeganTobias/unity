# DeFi Asset Management Platform - Backend API

This is the backend API for the DeFi Asset Management Platform, built with Node.js, Express, and PostgreSQL.

## Features

- 🔐 **Authentication**: JWT-based authentication with wallet signature verification
- 🏦 **Asset Management**: Portfolio tracking and transaction history
- 🤖 **Strategy Integration**: Automated yield farming and DeFi strategies
- 🗳️ **Governance API**: DAO proposal and voting system
- 🌉 **Cross-Chain Support**: Multi-chain asset management
- ⚠️ **Risk Management**: Real-time risk assessment and alerts
- 📊 **Analytics**: Portfolio and strategy performance analytics
- 🔄 **Real-time Updates**: WebSocket support for live data
- 📝 **API Documentation**: OpenAPI/Swagger documentation
- 🧪 **Testing**: Comprehensive unit and integration tests

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Language**: JavaScript/TypeScript
- **Database**: PostgreSQL 13+
- **Cache**: Redis 6+
- **Web3**: ethers.js
- **Authentication**: JWT, Passport.js
- **Validation**: express-validator, Joi
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest
- **Monitoring**: Winston, Morgan
- **Process Management**: PM2

## Getting Started

### Prerequisites

- Node.js >= 16.x
- PostgreSQL >= 13.x
- Redis >= 6.x
- npm >= 8.x

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/asset-management/platform.git
   cd platform/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup database**
   ```bash
   # Run migrations
   npm run migrate

   # Seed initial data
   npm run seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **API available at**
   ```
   http://localhost:3001
   ```

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/asset_management
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID

# Contract Addresses
ASSET_TOKEN_ADDRESS=0x...
ASSET_MANAGER_ADDRESS=0x...
DAO_GOVERNANCE_ADDRESS=0x...

# External Services
COINGECKO_API_KEY=your-coingecko-api-key
CHAINLINK_API_KEY=your-chainlink-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── config/           # Configuration files
│   ├── types/            # TypeScript types
│   └── index.js          # Application entry point
├── migrations/           # Database migrations
├── seeds/               # Database seeders
├── tests/               # Test files
├── docs/                # API documentation
├── scripts/             # Utility scripts
└── package.json         # Dependencies
```

## API Endpoints

### Authentication
```
POST   /api/v1/auth/nonce          # Get signing nonce
POST   /api/v1/auth/login          # Login with wallet signature
POST   /api/v1/auth/refresh        # Refresh access token
POST   /api/v1/auth/logout         # Logout user
```

### Users
```
GET    /api/v1/users/profile       # Get user profile
PUT    /api/v1/users/profile       # Update user profile
GET    /api/v1/users/stats         # Get user statistics
```

### Assets
```
GET    /api/v1/assets              # Get supported assets
GET    /api/v1/assets/:address     # Get asset details
GET    /api/v1/assets/balances     # Get user balances
GET    /api/v1/assets/prices       # Get asset prices
```

### Portfolio
```
GET    /api/v1/portfolio           # Get portfolio overview
GET    /api/v1/portfolio/history   # Get portfolio history
GET    /api/v1/portfolio/analytics # Get portfolio analytics
```

### Transactions
```
GET    /api/v1/transactions        # Get transaction history
POST   /api/v1/transactions        # Create transaction
GET    /api/v1/transactions/:id    # Get transaction details
```

### Strategies
```
GET    /api/v1/strategies          # Get available strategies
GET    /api/v1/strategies/:id      # Get strategy details
POST   /api/v1/strategies/:id/deposit    # Deposit to strategy
POST   /api/v1/strategies/:id/withdraw   # Withdraw from strategy
GET    /api/v1/strategies/:id/performance # Get strategy performance
```

### Governance
```
GET    /api/v1/governance/proposals      # Get proposals
POST   /api/v1/governance/proposals     # Create proposal
GET    /api/v1/governance/proposals/:id # Get proposal details
POST   /api/v1/governance/proposals/:id/vote # Vote on proposal
```

### Risk Management
```
GET    /api/v1/risk/assessment     # Get risk assessment
GET    /api/v1/risk/alerts         # Get risk alerts
POST   /api/v1/risk/stop-loss      # Set stop-loss order
```

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run start` - Start production server
- `npm run build` - Build TypeScript (if applicable)
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:integration` - Run integration tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run migrate` - Run database migrations
- `npm run migrate:rollback` - Rollback last migration
- `npm run seed` - Seed database with initial data
- `npm run docs` - Generate API documentation

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(50),
    email VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    hash VARCHAR(66) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    asset_address VARCHAR(42),
    amount DECIMAL(78, 0),
    value DECIMAL(20, 8),
    gas_used DECIMAL(78, 0),
    gas_price DECIMAL(78, 0),
    block_number BIGINT,
    chain_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);
```

## Authentication Flow

### Wallet Authentication
```javascript
// 1. Get nonce for signing
const { nonce } = await api.post('/auth/nonce', { address });

// 2. Sign message with wallet
const message = `Sign this message to authenticate: ${nonce}`;
const signature = await wallet.signMessage(message);

// 3. Login with signature
const { token } = await api.post('/auth/login', {
    address,
    signature,
    message,
    nonce
});

// 4. Use token for authenticated requests
api.defaults.headers.Authorization = `Bearer ${token}`;
```

## Middleware

### Authentication Middleware
```javascript
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication required' });
    }
};
```

### Validation Middleware
```javascript
const validateDeposit = [
    body('amount').isNumeric().withMessage('Amount must be numeric'),
    body('strategyId').isInt().withMessage('Strategy ID must be integer'),
    handleValidationErrors
];
```

### Rate Limiting
```javascript
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});
```

## Error Handling

### Custom Error Classes
```javascript
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
```

### Global Error Handler
```javascript
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error(err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new AppError(message, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
};
```

## Testing

### Unit Tests
```javascript
// tests/controllers/auth.test.js
describe('Auth Controller', () => {
    describe('POST /auth/login', () => {
        it('should login user with valid signature', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    address: '0x123...',
                    signature: 'valid_signature',
                    message: 'test_message',
                    nonce: 'test_nonce'
                });

            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
        });
    });
});
```

### Integration Tests
```javascript
// tests/integration/portfolio.test.js
describe('Portfolio Integration', () => {
    beforeEach(async () => {
        await setupTestDatabase();
        await seedTestData();
    });

    it('should calculate portfolio value correctly', async () => {
        const response = await authenticatedRequest
            .get('/api/v1/portfolio')
            .expect(200);

        expect(response.body.totalValue).toBeGreaterThan(0);
    });
});
```

## Logging

### Winston Configuration
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log' 
        })
    ]
});
```

## Deployment

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
    apps: [{
        name: 'asset-management-api',
        script: 'src/index.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production',
            PORT: 3001
        },
        error_file: 'logs/err.log',
        out_file: 'logs/out.log',
        log_file: 'logs/combined.log'
    }]
};
```

### Docker
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

## Performance

### Database Optimization
```sql
-- Add indexes for better query performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_users_address ON users(address);
```

### Caching Strategy
```javascript
// Redis caching middleware
const cache = (duration = 300) => {
    return async (req, res, next) => {
        const key = req.originalUrl;
        const cached = await redis.get(key);
        
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        res.sendResponse = res.json;
        res.json = (body) => {
            redis.setex(key, duration, JSON.stringify(body));
            res.sendResponse(body);
        };
        
        next();
    };
};
```

## Security

### Input Sanitization
```javascript
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

app.use(sanitize());
app.use(xss());
app.use(hpp());
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    skipSuccessfulRequests: true
});

app.use('/api/v1/auth', authLimiter);
```

## Monitoring

### Health Check
```javascript
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: 'connected',
        redis: 'connected'
    });
});
```

### Metrics Collection
```javascript
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

- Documentation: [docs.example.com](https://docs.example.com)
- API Documentation: [api.example.com/docs](https://api.example.com/docs)
- Discord: [discord.gg/example](https://discord.gg/example)
- Email: api-support@example.com

---

*Building the future of DeFi! 🚀*
