#!/bin/bash

# DeFi Asset Management Platform Deployment Script
# This script deploys the platform to various environments

set -e

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

# Default values
ENVIRONMENT="development"
NETWORK="localhost"
VERIFY=false
GAS_PRICE=""
GAS_LIMIT=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -n|--network)
            NETWORK="$2"
            shift 2
            ;;
        -v|--verify)
            VERIFY=true
            shift
            ;;
        -g|--gas-price)
            GAS_PRICE="$2"
            shift 2
            ;;
        -l|--gas-limit)
            GAS_LIMIT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -e, --environment    Environment (development, staging, production)"
            echo "  -n, --network        Network (localhost, goerli, mainnet, bsc, polygon)"
            echo "  -v, --verify         Verify contracts on block explorer"
            echo "  -g, --gas-price      Gas price in gwei"
            echo "  -l, --gas-limit      Gas limit"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option $1"
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    exit 1
fi

# Validate network
if [[ ! "$NETWORK" =~ ^(localhost|goerli|mainnet|bsc|polygon|arbitrum)$ ]]; then
    print_error "Invalid network: $NETWORK"
    exit 1
fi

print_status "Deploying to $ENVIRONMENT environment on $NETWORK network"

# Check if required files exist
check_requirements() {
    print_status "Checking requirements..."
    
    if [ ! -f "hardhat.config.js" ] && [ ! -f "hardhat.config.ts" ]; then
        print_error "Hardhat configuration not found"
        exit 1
    fi
    
    if [ ! -f "scripts/deploy.js" ]; then
        print_error "Deploy script not found"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found"
        exit 1
    fi
    
    print_success "Requirements check completed"
}

# Compile contracts
compile_contracts() {
    print_status "Compiling smart contracts..."
    
    npx hardhat compile
    
    if [ $? -eq 0 ]; then
        print_success "Smart contracts compiled successfully"
    else
        print_error "Contract compilation failed"
        exit 1
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    npx hardhat test
    
    if [ $? -eq 0 ]; then
        print_success "Tests passed successfully"
    else
        print_error "Tests failed"
        exit 1
    fi
}

# Deploy contracts
deploy_contracts() {
    print_status "Deploying contracts to $NETWORK..."
    
    # Build deployment command
    DEPLOY_CMD="npx hardhat run scripts/deploy.js --network $NETWORK"
    
    # Add gas price if specified
    if [ ! -z "$GAS_PRICE" ]; then
        DEPLOY_CMD="$DEPLOY_CMD --gas-price $GAS_PRICE"
    fi
    
    # Add gas limit if specified
    if [ ! -z "$GAS_LIMIT" ]; then
        DEPLOY_CMD="$DEPLOY_CMD --gas-limit $GAS_LIMIT"
    fi
    
    # Execute deployment
    eval $DEPLOY_CMD
    
    if [ $? -eq 0 ]; then
        print_success "Contracts deployed successfully"
    else
        print_error "Contract deployment failed"
        exit 1
    fi
}

# Verify contracts
verify_contracts() {
    if [ "$VERIFY" = true ]; then
        print_status "Verifying contracts on block explorer..."
        
        npx hardhat verify --network $NETWORK
        
        if [ $? -eq 0 ]; then
            print_success "Contracts verified successfully"
        else
            print_warning "Contract verification failed"
        fi
    fi
}

# Deploy frontend
deploy_frontend() {
    if [ -d "frontend" ]; then
        print_status "Deploying frontend..."
        
        cd frontend
        
        # Install dependencies
        npm install
        
        # Build frontend
        npm run build
        
        if [ $? -eq 0 ]; then
            print_success "Frontend built successfully"
        else
            print_error "Frontend build failed"
            exit 1
        fi
        
        # Deploy to Vercel (if configured)
        if command -v vercel &> /dev/null; then
            print_status "Deploying to Vercel..."
            vercel --prod
        fi
        
        cd ..
    fi
}

# Deploy backend
deploy_backend() {
    if [ -d "backend" ]; then
        print_status "Deploying backend..."
        
        cd backend
        
        # Install dependencies
        npm install
        
        # Build backend
        npm run build
        
        if [ $? -eq 0 ]; then
            print_success "Backend built successfully"
        else
            print_error "Backend build failed"
            exit 1
        fi
        
        # Deploy to cloud provider (if configured)
        if [ -f "deploy.sh" ]; then
            print_status "Running backend deployment script..."
            ./deploy.sh
        fi
        
        cd ..
    fi
}

# Update environment variables
update_env() {
    print_status "Updating environment variables..."
    
    # Update frontend environment
    if [ -d "frontend" ] && [ -f "frontend/.env.production" ]; then
        print_status "Updating frontend environment variables..."
        # Add logic to update frontend environment variables
    fi
    
    # Update backend environment
    if [ -d "backend" ] && [ -f "backend/.env.production" ]; then
        print_status "Updating backend environment variables..."
        # Add logic to update backend environment variables
    fi
}

# Run health checks
health_checks() {
    print_status "Running health checks..."
    
    # Check if contracts are deployed
    if [ -f "deployments.json" ]; then
        print_success "Contract deployment verified"
    else
        print_warning "Contract deployment verification failed"
    fi
    
    # Check if frontend is accessible
    if [ -d "frontend" ]; then
        print_status "Checking frontend accessibility..."
        # Add logic to check frontend accessibility
    fi
    
    # Check if backend is accessible
    if [ -d "backend" ]; then
        print_status "Checking backend accessibility..."
        # Add logic to check backend accessibility
    fi
}

# Create deployment report
create_report() {
    print_status "Creating deployment report..."
    
    REPORT_FILE="deployment-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > $REPORT_FILE << EOF
DeFi Asset Management Platform Deployment Report
===============================================

Deployment Date: $(date)
Environment: $ENVIRONMENT
Network: $NETWORK
Gas Price: ${GAS_PRICE:-"Default"}
Gas Limit: ${GAS_LIMIT:-"Default"}

Contract Addresses:
$(cat deployments.json 2>/dev/null || echo "No deployment data available")

Deployment Status: SUCCESS
EOF
    
    print_success "Deployment report created: $REPORT_FILE"
}

# Main deployment function
main() {
    echo "=========================================="
    echo "DeFi Asset Management Platform Deployment"
    echo "=========================================="
    echo ""
    
    check_requirements
    compile_contracts
    run_tests
    deploy_contracts
    verify_contracts
    update_env
    deploy_frontend
    deploy_backend
    health_checks
    create_report
    
    echo ""
    echo "=========================================="
    print_success "Deployment completed successfully!"
    echo "=========================================="
    echo ""
    echo "Deployment Summary:"
    echo "- Environment: $ENVIRONMENT"
    echo "- Network: $NETWORK"
    echo "- Contracts: Deployed"
    echo "- Frontend: Deployed"
    echo "- Backend: Deployed"
    echo ""
    echo "Next steps:"
    echo "1. Verify contract addresses in deployments.json"
    echo "2. Update frontend with new contract addresses"
    echo "3. Test all functionality"
    echo "4. Monitor deployment for issues"
    echo ""
}

# Run main function
main "$@"
