#!/usr/bin/env bash

# ==============================================================================
# Stack8s Performance Testing Launcher & Report Generator
# ==============================================================================

set -e

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}🚀 STACK8S K6 PERFORMANCE & LOAD TESTING SUITE${NC}"
echo -e "${BLUE}=====================================================${NC}"

# 1. Load environment variables from .env if present
if [ -f .env ]; then
  echo -e "${GREEN}✓ Loading environment configuration from .env${NC}"
  export $(grep -v '^#' .env | xargs)
fi

# 2. Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed. Please install k6: brew install k6${NC}"
    exit 1
fi

# Ensure reports directory exists
mkdir -p performance/reports

echo -e "${YELLOW}⚡ Target Environment:${NC} ${BASE_URL:-https://develop-v2.stack8s.com}"
echo -e "${YELLOW}⚡ Running performance benchmark scenario...${NC}"
echo ""

# 3. Execute k6 test suite
set +e
k6 run performance/main.js "$@"
STATUS=$?
set -e

echo ""
echo -e "${BLUE}=====================================================${NC}"
if [ $STATUS -eq 0 ]; then
  echo -e "${GREEN}✅ Performance Test Suite Completed Successfully!${NC}"
else
  echo -e "${RED}⚠️ Performance Test Completed with Threshold Warnings/Failures.${NC}"
fi
echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}📊 Interactive HTML Report Generated at:${NC}"
echo -e "   file://$(pwd)/performance/reports/performance_report.html"
echo -e "${GREEN}📄 Raw JSON Results Summary at:${NC}"
echo -e "   file://$(pwd)/performance/reports/summary.json"
echo -e "${BLUE}=====================================================${NC}"

exit $STATUS
