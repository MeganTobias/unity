#!/bin/bash

# DeFi Asset Management Platform Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up DeFi Asset Management Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git."
        exit 1
    fi
    
    # Check Docker (optional)
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Some features may not work."
    fi
    
    # Check Docker Compose (optional)
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed. Some features may not work."
    fi
    
    print_success "Requirements check completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    if [ -f "package.json" ]; then
        print_status "Installing root dependencies..."
        npm install
    fi
    
    # Install backend dependencies
    if [ -d "backend" ]; then
        print_status "Installing backend dependencies..."
        cd backend
        npm install
        cd ..
    fi
    
    # Install frontend dependencies
    if [ -d "frontend" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
    fi
    
    print_success "Dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Copy example environment file
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            cp env.example .env
            print_success "Created .env file from env.example"
            print_warning "Please update .env file with your actual values"
        else
            print_warning "No env.example file found. Please create .env file manually"
        fi
    else
        print_warning ".env file already exists"
    fi
    
    # Setup backend environment
    if [ -d "backend" ] && [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            print_success "Created backend/.env file"
        fi
    fi
    
    # Setup frontend environment
    if [ -d "frontend" ] && [ ! -f "frontend/.env.local" ]; then
        if [ -f "frontend/.env.example" ]; then
            cp frontend/.env.example frontend/.env.local
            print_success "Created frontend/.env.local file"
        fi
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if MongoDB is running
    if command -v mongod &> /dev/null; then
        if pgrep -x "mongod" > /dev/null; then
            print_success "MongoDB is already running"
        else
            print_warning "MongoDB is not running. Please start MongoDB manually"
        fi
    else
        print_warning "MongoDB is not installed. Please install MongoDB or use Docker"
    fi
    
    # Check if Redis is running
    if command -v redis-server &> /dev/null; then
        if pgrep -x "redis-server" > /dev/null; then
            print_success "Redis is already running"
        else
            print_warning "Redis is not running. Please start Redis manually"
        fi
    else
        print_warning "Redis is not installed. Please install Redis or use Docker"
    fi
}

# Compile smart contracts
compile_contracts() {
    print_status "Compiling smart contracts..."
    
    if [ -f "hardhat.config.js" ] || [ -f "hardhat.config.ts" ]; then
        npx hardhat compile
        print_success "Smart contracts compiled successfully"
    else
        print_warning "No Hardhat configuration found. Skipping contract compilation"
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Run smart contract tests
    if [ -f "hardhat.config.js" ] || [ -f "hardhat.config.ts" ]; then
        print_status "Running smart contract tests..."
        npx hardhat test
        print_success "Smart contract tests passed"
    fi
    
    # Run backend tests
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        print_status "Running backend tests..."
        cd backend
        npm test
        cd ..
        print_success "Backend tests passed"
    fi
    
    # Run frontend tests
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_status "Running frontend tests..."
        cd frontend
        npm test
        cd ..
        print_success "Frontend tests passed"
    fi
}

# Setup Git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for DeFi Asset Management Platform

echo "Running pre-commit checks..."

# Run linting
if [ -f "package.json" ]; then
    npm run lint
fi

# Run tests
if [ -f "hardhat.config.js" ] || [ -f "hardhat.config.ts" ]; then
    npx hardhat test
fi

echo "Pre-commit checks passed!"
EOF
    
    chmod +x .git/hooks/pre-commit
    print_success "Git hooks set up successfully"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create logs directory
    mkdir -p logs
    
    # Create data directories
    mkdir -p data/{mongodb,redis,uploads}
    
    # Create monitoring directories
    mkdir -p monitoring/{prometheus,grafana,logstash}
    
    print_success "Directories created successfully"
}

# Main setup function
main() {
    echo "=========================================="
    echo "DeFi Asset Management Platform Setup"
    echo "=========================================="
    echo ""
    
    check_requirements
    create_directories
    install_dependencies
    setup_environment
    setup_database
    compile_contracts
    run_tests
    setup_git_hooks
    
    echo ""
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Update .env file with your actual values"
    echo "2. Start the development servers:"
    echo "   - Backend: cd backend && npm run dev"
    echo "   - Frontend: cd frontend && npm run dev"
    echo "3. Or use Docker: docker-compose up"
    echo ""
    echo "For more information, see README.md"
}

# Run main function
main "$@"
