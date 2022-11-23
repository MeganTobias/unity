# DeFi Asset Management Platform - Frontend

This is the frontend application for the DeFi Asset Management Platform, built with Next.js, React, and TypeScript.

## Features

- 🌐 **Multi-Chain Support**: Ethereum, Polygon, Arbitrum, BSC
- 🔗 **Wallet Integration**: MetaMask, WalletConnect, Coinbase Wallet
- 📊 **Portfolio Management**: Real-time portfolio tracking and analytics
- 🤖 **Automated Strategies**: Yield farming, liquidity mining, lending
- 🗳️ **DAO Governance**: Proposal creation and voting
- 🌉 **Cross-Chain Bridge**: Seamless asset transfers between chains
- ⚠️ **Risk Management**: Real-time risk monitoring and alerts
- 📱 **Responsive Design**: Mobile-first, responsive interface
- 🌙 **Dark Mode**: Light and dark theme support
- ♿ **Accessibility**: WCAG 2.1 AA compliant

## Tech Stack

- **Framework**: Next.js 13 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer
- **Web3**: ethers.js, wagmi
- **Charts**: Chart.js, Recharts
- **UI Components**: Headless UI, Radix UI
- **Forms**: React Hook Form with Zod validation
- **Testing**: Jest, React Testing Library, Cypress
- **Linting**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js >= 16.x
- npm >= 8.x
- MetaMask or compatible wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/asset-management/platform.git
   cd platform/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Blockchain Configuration
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

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components
│   │   ├── forms/        # Form components
│   │   └── layout/       # Layout components
│   ├── pages/            # Next.js pages
│   ├── hooks/            # Custom React hooks
│   ├── context/          # React context providers
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # Global styles
│   └── constants/        # Application constants
├── tests/                # Test files
├── docs/                 # Documentation
├── .next/               # Next.js build output
└── node_modules/        # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript compiler
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run e2e` - Run end-to-end tests
- `npm run analyze` - Analyze bundle size

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint and Prettier configuration
- Use functional components with hooks
- Implement proper error boundaries
- Write comprehensive tests

### Component Guidelines

```tsx
// ✅ Good: Functional component with TypeScript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
}) => {
  return (
    <button
      className={cn(
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        disabled && 'btn-disabled'
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### State Management

```tsx
// ✅ Good: Using context with useReducer
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

### Error Handling

```tsx
// ✅ Good: Comprehensive error handling
const fetchUserData = async (address: string) => {
  try {
    const response = await api.get(`/users/${address}`);
    return response.data;
  } catch (error) {
    if (error instanceof NetworkError) {
      throw new Error('Network connection failed');
    }
    if (error instanceof ValidationError) {
      throw new Error('Invalid user address');
    }
    throw new Error('Failed to fetch user data');
  }
};
```

## Testing

### Unit Tests

```tsx
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests

```tsx
// e2e/wallet-connection.spec.ts
import { test, expect } from '@playwright/test';

test('wallet connection flow', async ({ page }) => {
  await page.goto('/');
  
  // Click connect wallet button
  await page.click('[data-testid="connect-wallet"]');
  
  // Select MetaMask
  await page.click('[data-testid="metamask-option"]');
  
  // Check if wallet is connected
  await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible();
});
```

## Deployment

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Deploy with Docker

```dockerfile
FROM node:16-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

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

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run analyze
```

### Code Splitting

```tsx
// Dynamic imports for code splitting
const Dashboard = dynamic(() => import('../components/Dashboard'), {
  loading: () => <DashboardSkeleton />,
});

const LazyChart = lazy(() => import('../components/Chart'));
```

### Image Optimization

```tsx
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority
/>
```

## Security

### Content Security Policy

```js
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
];
```

### Input Sanitization

```tsx
import DOMPurify from 'dompurify';

const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input);
};
```

## Accessibility

- Semantic HTML elements
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

## Browser Support

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

- Documentation: [docs.example.com](https://docs.example.com)
- Discord: [discord.gg/example](https://discord.gg/example)
- Email: support@example.com

---

*Happy coding! 🚀*
