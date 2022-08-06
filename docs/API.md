# API Documentation

## Overview

The DeFi Asset Management Platform provides a comprehensive REST API for managing assets, strategies, and user interactions.

## Base URL

```
https://api.defiassetmanagement.com/v1
```

## Authentication

The API uses Web3 signature-based authentication. Users must sign a message with their private key to authenticate.

### Authentication Flow

1. **Get Nonce**
   ```http
   POST /api/auth/nonce
   Content-Type: application/json
   
   {
     "address": "0x1234567890123456789012345678901234567890"
   }
   ```

2. **Authenticate**
   ```http
   POST /api/auth/authenticate
   Content-Type: application/json
   
   {
     "address": "0x1234567890123456789012345678901234567890",
     "signature": "0x...",
     "message": "Sign this message to authenticate..."
   }
   ```

3. **Use Token**
   ```http
   GET /api/user/profile/0x1234567890123456789012345678901234567890
   Authorization: Bearer <token>
   ```

## Endpoints

### Assets

#### Get All Assets
```http
GET /api/assets
```

**Response:**
```json
[
  {
    "id": "eth",
    "name": "Ethereum",
    "symbol": "ETH",
    "address": "0x0000000000000000000000000000000000000000",
    "decimals": 18,
    "price": 1800.50,
    "change24h": 2.5,
    "marketCap": 220000000000,
    "volume24h": 15000000000,
    "isActive": true
  }
]
```

#### Get Asset by ID
```http
GET /api/assets/{id}
```

#### Get Asset Price
```http
GET /api/assets/{id}/price
```

#### Get Asset Balance
```http
GET /api/assets/{id}/balance/{address}
```

### Strategies

#### Get All Strategies
```http
GET /api/strategies?category=yield-farming&risk=low&active=true
```

**Query Parameters:**
- `category`: Filter by strategy category
- `risk`: Filter by risk level (low, medium, high)
- `active`: Filter by active status

#### Get Strategy by ID
```http
GET /api/strategies/{id}
```

#### Get Strategy Performance
```http
GET /api/strategies/{id}/performance?period=30d
```

#### Subscribe to Strategy
```http
POST /api/strategies/{id}/subscribe
Content-Type: application/json

{
  "userAddress": "0x1234567890123456789012345678901234567890",
  "duration": 2592000,
  "amount": 1000
}
```

### Portfolio

#### Get Portfolio Overview
```http
GET /api/portfolio/overview/{address}
```

#### Get Portfolio Performance
```http
GET /api/portfolio/performance/{address}?period=30d
```

#### Get Portfolio Allocation
```http
GET /api/portfolio/allocation/{address}
```

#### Get Portfolio Risk Metrics
```http
GET /api/portfolio/risk/{address}
```

### Risk Management

#### Get Risk Assessment
```http
GET /api/risk/assessment/{address}
```

#### Get Risk Alerts
```http
GET /api/risk/alerts/{address}
```

#### Update Risk Limits
```http
PUT /api/risk/limits/{address}
Content-Type: application/json

{
  "maxDrawdown": 20,
  "maxConcentration": 50,
  "maxLeverage": 3,
  "maxVolatility": 25,
  "stopLoss": 10,
  "takeProfit": 30
}
```

### Governance

#### Get All Proposals
```http
GET /api/governance/proposals?status=active&page=1&limit=20
```

#### Get Proposal by ID
```http
GET /api/governance/proposals/{id}
```

#### Create Proposal
```http
POST /api/governance/proposals
Content-Type: application/json

{
  "title": "Increase platform fee",
  "description": "Proposal to increase platform fee from 0.25% to 0.5%",
  "calldata": "0x..."
}
```

#### Vote on Proposal
```http
POST /api/governance/proposals/{id}/vote
Content-Type: application/json

{
  "support": true,
  "voter": "0x1234567890123456789012345678901234567890"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 10 requests per 15 minutes per IP
- **High-frequency endpoints**: 50 requests per 15 minutes per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Pagination

List endpoints support pagination:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## WebSocket Events

Real-time updates are available via WebSocket:

```javascript
const ws = new WebSocket('wss://api.defiassetmanagement.com/ws');

// Subscribe to portfolio updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'portfolio',
  address: '0x1234567890123456789012345678901234567890'
}));

// Listen for events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

### Available Channels

- `portfolio`: Portfolio updates
- `prices`: Price updates
- `strategies`: Strategy updates
- `governance`: Governance updates
- `risk`: Risk alerts

## SDKs

Official SDKs are available for:

- **JavaScript/TypeScript**: `npm install @defi-asset-management/sdk`
- **Python**: `pip install defi-asset-management-sdk`
- **Go**: `go get github.com/defi-asset-management/sdk-go`

## Support

For API support and questions:

- **Documentation**: [docs.defiassetmanagement.com](https://docs.defiassetmanagement.com)
- **Discord**: [discord.gg/defiassetmanagement](https://discord.gg/defiassetmanagement)
- **Email**: api-support@defiassetmanagement.com
