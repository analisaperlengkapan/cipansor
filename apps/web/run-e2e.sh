#!/bin/bash

# E2E Test Runner Script
# Runs E2E tests with proper setup and error handling

set -e

echo "🚀 Cipansor E2E Test Runner"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend API is running
echo -e "\n${YELLOW}Checking backend API...${NC}"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is running${NC}"
else
    echo -e "${RED}✗ Backend API is not running${NC}"
    echo -e "${YELLOW}Please start the API: cd apps/api && pnpm dev${NC}"
    exit 1
fi

# Check if frontend is running
echo -e "\n${YELLOW}Checking frontend...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend is not running${NC}"
    echo -e "${YELLOW}Please start the frontend: cd apps/web && pnpm dev${NC}"
    exit 1
fi

# Check if Redis is running
echo -e "\n${YELLOW}Checking Redis...${NC}"
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${YELLOW}⚠ Redis is not running (optional for some tests)${NC}"
fi

# Check if Playwright browsers are installed
echo -e "\n${YELLOW}Checking Playwright browsers...${NC}"
if [ -d "$HOME/.cache/ms-playwright" ] || [ -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo -e "${GREEN}✓ Playwright browsers installed${NC}"
else
    echo -e "${YELLOW}Installing Playwright browsers...${NC}"
    pnpm exec playwright install
fi

# Parse arguments
TEST_FILE=""
TEST_MODE="normal"
PROJECT="chromium"

while [[ $# -gt 0 ]]; do
    case $1 in
        --file)
            TEST_FILE="$2"
            shift 2
            ;;
        --ui)
            TEST_MODE="ui"
            shift
            ;;
        --headed)
            TEST_MODE="headed"
            shift
            ;;
        --debug)
            TEST_MODE="debug"
            shift
            ;;
        --project)
            PROJECT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run tests
echo -e "\n${GREEN}Running E2E tests...${NC}"
echo "================================"

case $TEST_MODE in
    ui)
        pnpm exec playwright test $TEST_FILE --ui
        ;;
    headed)
        pnpm exec playwright test $TEST_FILE --headed --project=$PROJECT
        ;;
    debug)
        pnpm exec playwright test $TEST_FILE --debug
        ;;
    *)
        pnpm exec playwright test $TEST_FILE --project=$PROJECT
        ;;
esac

EXIT_CODE=$?

# Show results
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    echo -e "${YELLOW}View HTML report: pnpm exec playwright show-report${NC}"
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    echo -e "${YELLOW}View HTML report: pnpm exec playwright show-report${NC}"
    echo -e "${YELLOW}Screenshots saved in: test-results/${NC}"
fi

exit $EXIT_CODE
