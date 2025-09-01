#!/bin/bash

# SPA Backend Quick Start Script
# This script automates the complete setup process

set -e  # Exit on any error

echo "🚀 SPA Backend Quick Start"
echo "=========================="

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

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    
    print_success "npm $(npm -v) is installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    npm install
    print_success "Dependencies installed successfully"
}

# Setup environment file
setup_env() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            cp env.example .env
            print_success "Created .env file from template"
            print_warning "Please edit .env file with your configuration before continuing"
        else
            print_error "env.example not found. Cannot create .env file."
            exit 1
        fi
    else
        print_warning ".env file already exists"
    fi
}

# Check MongoDB connection
check_mongodb() {
    print_status "Checking MongoDB connection..."
    
    # Try to connect to MongoDB
    if command -v mongosh &> /dev/null; then
        # Try to connect to default MongoDB URI
        if mongosh "mongodb://localhost:27017/spa-backend" --eval "db.runCommand('ping')" &> /dev/null; then
            print_success "MongoDB connection successful"
            return 0
        fi
    fi
    
    print_warning "Could not connect to local MongoDB"
    print_warning "Please ensure MongoDB is running or update MONGODB_URI in .env file"
    print_warning "You can use MongoDB Atlas for cloud hosting"
    
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Setup cancelled"
        exit 1
    fi
}

# Run initialization
run_init() {
    print_status "Running application initialization..."
    
    if npm run init; then
        print_success "Application initialized successfully"
    else
        print_error "Initialization failed"
        exit 1
    fi
}

# Start the server
start_server() {
    print_status "Starting the server..."
    
    print_success "Setup completed successfully!"
    echo
    echo "🎉 Your SPA Backend is ready!"
    echo
    echo "📋 Next steps:"
    echo "1. The server should be running at http://localhost:3000"
    echo "2. Health check: http://localhost:3000/health"
    echo "3. API docs: http://localhost:3000/api"
    echo "4. Admin login: admin@spa.com / Admin@123"
    echo
    echo "⚠️  Important: Change the default admin password after first login!"
    echo
    echo "Press Ctrl+C to stop the server"
    echo
    
    # Start the development server
    npm run dev
}

# Main execution
main() {
    echo "Starting SPA Backend setup..."
    echo
    
    check_node
    check_npm
    install_dependencies
    setup_env
    check_mongodb
    run_init
    start_server
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT

# Run main function
main 