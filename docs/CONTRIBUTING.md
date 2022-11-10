# Contributing to DeFi Asset Management Platform

Thank you for your interest in contributing to the DeFi Asset Management Platform! This document provides guidelines for contributing to our project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Security Considerations](#security-considerations)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at conduct@yourdomain.com.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js >= 16.x
- npm >= 8.x
- Git >= 2.x
- Basic understanding of:
  - Solidity and smart contracts
  - JavaScript/TypeScript
  - React/Next.js
  - DeFi protocols

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/yourusername/platform.git
   cd platform
   ```

2. **Install Dependencies**
   ```bash
   # Smart contracts
   npm install
   
   # Backend
   cd backend && npm install && cd ..
   
   # Frontend
   cd frontend && npm install && cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   
   # Configure your environment variables
   ```

4. **Start Development**
   ```bash
   # Start local blockchain
   npx hardhat node
   
   # Deploy contracts (in another terminal)
   npx hardhat run scripts/deploy.js --network localhost
   
   # Start backend (in another terminal)
   cd backend && npm run dev
   
   # Start frontend (in another terminal)
   cd frontend && npm run dev
   ```

## Development Process

### Branching Strategy

We use a modified Git Flow:

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: New features
- **bugfix/***: Bug fixes
- **hotfix/***: Critical production fixes
- **release/***: Release preparation

### Workflow

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   ```bash
   # Make your changes
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create pull request on GitHub
   ```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(contracts): add yield farming strategy
fix(backend): resolve authentication issue
docs(api): update endpoint documentation
test(frontend): add wallet connection tests
```

## Coding Standards

### Solidity Guidelines

```solidity
// Use proper naming conventions
contract AssetManager {
    // Constants in UPPER_CASE
    uint256 public constant MAX_DEPOSIT = 1e6 ether;
    
    // State variables in camelCase
    mapping(address => uint256) public userBalances;
    
    // Events in PascalCase
    event Deposit(address indexed user, uint256 amount);
    
    // Functions in camelCase
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        // Implementation
    }
}
```

**Best Practices:**
- Use latest Solidity version
- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Add comprehensive NatSpec documentation
- Use access modifiers appropriately
- Implement proper error handling
- Add reentrancy guards where needed

### JavaScript/TypeScript Guidelines

```javascript
// Use meaningful variable names
const userWalletAddress = await getWalletAddress();

// Use async/await instead of promises
async function fetchUserData(address) {
  try {
    const response = await api.get(`/users/${address}`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch user data:', error);
    throw error;
  }
}

// Use proper error handling
const handleSubmit = async (data) => {
  try {
    await submitTransaction(data);
    showSuccessMessage('Transaction submitted');
  } catch (error) {
    showErrorMessage(error.message);
  }
};
```

**Best Practices:**
- Use TypeScript for type safety
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use ESLint and Prettier
- Write self-documenting code
- Handle errors gracefully
- Use meaningful variable names

### React/Next.js Guidelines

```jsx
// Use functional components with hooks
const WalletConnector = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const address = await connectWallet();
      onConnect(address);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, [onConnect]);

  return (
    <div className="wallet-connector">
      <button 
        onClick={handleConnect}
        disabled={isConnecting}
        className="connect-button"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

**Best Practices:**
- Use functional components with hooks
- Implement proper prop validation
- Use memo for performance optimization
- Follow component composition patterns
- Use semantic HTML
- Implement accessibility features

## Testing Guidelines

### Smart Contract Testing

```javascript
// Use comprehensive test scenarios
describe("AssetManager", function () {
  let assetManager, assetToken;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const AssetToken = await ethers.getContractFactory("AssetToken");
    assetToken = await AssetToken.deploy();
    
    const AssetManager = await ethers.getContractFactory("AssetManager");
    assetManager = await AssetManager.deploy(assetToken.address);
  });

  describe("deposit", function () {
    it("should allow valid deposits", async function () {
      const amount = ethers.utils.parseEther("100");
      await assetToken.mint(user1.address, amount);
      await assetToken.connect(user1).approve(assetManager.address, amount);
      
      await expect(assetManager.connect(user1).deposit(amount))
        .to.emit(assetManager, "Deposit")
        .withArgs(user1.address, amount);
      
      expect(await assetManager.getUserBalance(user1.address)).to.equal(amount);
    });

    it("should reject zero deposits", async function () {
      await expect(assetManager.connect(user1).deposit(0))
        .to.be.revertedWith("Amount must be greater than zero");
    });
  });
});
```

### Backend Testing

```javascript
// Use Jest for backend testing
describe('Asset API', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /api/assets/:address', () => {
    it('should return asset data for valid address', async () => {
      const response = await request(app)
        .get('/api/assets/0x123...')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        address: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        balance: expect.any(String),
        symbol: expect.any(String)
      });
    });

    it('should return 404 for invalid address', async () => {
      await request(app)
        .get('/api/assets/invalid')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });
});
```

### Frontend Testing

```jsx
// Use React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnector } from './WalletConnector';

describe('WalletConnector', () => {
  it('should connect wallet when button is clicked', async () => {
    const mockOnConnect = jest.fn();
    render(<WalletConnector onConnect={mockOnConnect} />);

    const connectButton = screen.getByText('Connect Wallet');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(mockOnConnect).toHaveBeenCalledWith(
        expect.stringMatching(/^0x[a-fA-F0-9]{40}$/)
      );
    });
  });

  it('should show error message on connection failure', async () => {
    // Mock wallet error
    window.ethereum = {
      request: jest.fn().mockRejectedValue(new Error('User rejected'))
    };

    render(<WalletConnector onConnect={jest.fn()} />);

    const connectButton = screen.getByText('Connect Wallet');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText('User rejected')).toBeInTheDocument();
    });
  });
});
```

### Test Coverage

Maintain minimum test coverage:
- **Smart Contracts**: 95%
- **Backend**: 90%
- **Frontend**: 85%

Run coverage reports:
```bash
# Smart contracts
npx hardhat coverage

# Backend
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run test:coverage
```

## Documentation

### Code Documentation

**Solidity:**
```solidity
/**
 * @title Asset Management Contract
 * @notice Manages user deposits and withdrawals
 * @dev Implements ERC-20 token management with yield farming
 */
contract AssetManager {
    /**
     * @notice Deposits tokens into the contract
     * @dev Requires prior token approval
     * @param amount The amount of tokens to deposit
     * @return success Whether the deposit was successful
     */
    function deposit(uint256 amount) external returns (bool success) {
        // Implementation
    }
}
```

**JavaScript:**
```javascript
/**
 * Connects to user's wallet
 * @param {Object} options - Connection options
 * @param {string} options.chainId - Target chain ID
 * @param {boolean} options.requestPermissions - Whether to request permissions
 * @returns {Promise<string>} The connected wallet address
 * @throws {Error} When connection fails
 */
async function connectWallet(options = {}) {
  // Implementation
}
```

### API Documentation

Use OpenAPI/Swagger for API documentation:

```yaml
/api/assets/{address}:
  get:
    summary: Get asset information
    parameters:
      - name: address
        in: path
        required: true
        schema:
          type: string
          pattern: "^0x[a-fA-F0-9]{40}$"
    responses:
      200:
        description: Asset information
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Asset'
```

### README Updates

Keep README files updated for:
- Installation instructions
- Development setup
- API endpoints
- Configuration options
- Troubleshooting guides

## Security Considerations

### Security Review Checklist

Before submitting code:

- [ ] No hardcoded secrets or private keys
- [ ] Input validation for all user inputs
- [ ] Proper access controls implemented
- [ ] SQL injection prevention
- [ ] XSS protection measures
- [ ] CSRF token validation
- [ ] Rate limiting for sensitive endpoints
- [ ] Secure error handling (no sensitive data in errors)

### Security Testing

- Run security linting tools
- Test with invalid/malicious inputs
- Verify access controls
- Check for common vulnerabilities
- Test error handling

### Responsible Disclosure

If you discover security vulnerabilities:
1. **Do not** open a public issue
2. Email security@yourdomain.com
3. Provide detailed description
4. Allow time for fix before disclosure

## Pull Request Process

### Before Submitting

1. **Code Quality**
   - [ ] Code follows style guidelines
   - [ ] All tests pass
   - [ ] Code coverage meets requirements
   - [ ] No linting errors

2. **Documentation**
   - [ ] Code is properly documented
   - [ ] README updated if needed
   - [ ] API documentation updated

3. **Testing**
   - [ ] New tests added for new features
   - [ ] All existing tests pass
   - [ ] Manual testing completed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline passes
   - Code quality checks pass
   - Security scans pass

2. **Peer Review**
   - At least 2 approvals required
   - Security review for sensitive changes
   - Architecture review for major changes

3. **Merge Requirements**
   - All checks pass
   - Conflicts resolved
   - Documentation updated

## Issue Reporting

### Bug Reports

Use this template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Add any other context about the problem.
```

### Feature Requests

Use this template:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions.

**Additional context**
Add any other context or screenshots.
```

## Community

### Communication Channels

- **Discord**: https://discord.gg/yourserver
- **Telegram**: https://t.me/yourgroup
- **Twitter**: https://twitter.com/yourhandle
- **Email**: community@yourdomain.com

### Community Guidelines

- Be respectful and professional
- Help others learn and grow
- Share knowledge and resources
- Provide constructive feedback
- Follow the code of conduct

### Getting Help

1. **Documentation**: Check existing docs first
2. **Search Issues**: Look for similar problems
3. **Discord**: Ask in appropriate channels
4. **GitHub Issues**: Create new issue if needed

### Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Social media mentions
- Annual contributor appreciation

## Development Resources

### Useful Links

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [React Documentation](https://reactjs.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### Tools and Services

- **IDE**: VS Code with Solidity extension
- **Testing**: Hardhat, Jest, React Testing Library
- **Linting**: ESLint, Prettier, Solhint
- **Security**: Slither, MythX, Echidna
- **Documentation**: Gitbook, Notion

---

Thank you for contributing to the DeFi Asset Management Platform! Your contributions help make DeFi more accessible and secure for everyone.

*Last updated: February 2023*
