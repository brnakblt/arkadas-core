#!/bin/bash
# =============================================================================
# Arkadaş ERP - Automated Test Runner
# Runs all tests: Web (Unit + E2E), Mobile, PWA, Desktop, Docs
# =============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Arkadaş ERP Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Track results
FAILED_TESTS=""
PASSED_TESTS=""

run_test() {
    local name=$1
    local command=$2
    local dir=$3
    
    echo -e "${YELLOW}▶ Running: $name${NC}"
    
    if [ -n "$dir" ]; then
        cd "$dir"
    fi
    
    if eval "$command"; then
        echo -e "${GREEN}✓ $name passed${NC}"
        PASSED_TESTS="$PASSED_TESTS\n  ✓ $name"
    else
        echo -e "${RED}✗ $name failed${NC}"
        FAILED_TESTS="$FAILED_TESTS\n  ✗ $name"
    fi
    
    if [ -n "$dir" ]; then
        cd - > /dev/null
    fi
    
    echo ""
}

# =============================================================================
# WEB TESTS
# =============================================================================
echo -e "${BLUE}📦 Web Application Tests${NC}"
echo "----------------------------------------"

# Unit tests
run_test "Web Unit Tests (Vitest)" "npm run test:unit" "web"

# E2E tests (if Playwright installed)
if command -v npx &> /dev/null && [ -f "web/playwright.config.ts" ]; then
    run_test "Web E2E Tests (Playwright)" "npm run test:e2e" "web"
fi

# =============================================================================
# BACKEND TESTS
# =============================================================================
echo -e "${BLUE}⚙️  Backend Service Tests${NC}"
echo "----------------------------------------"

# AI Service (Python)
if [ -d "ai-service" ]; then
    # Ensure venv exists or use system python if preferred (CI usually does setup)
    # We assume 'pytest' is available in path or venv
    if [ -f "ai-service/venv/bin/pytest" ]; then
        run_test "AI Service Tests" "PYTHONPATH=. ./venv/bin/pytest --cov=app --cov-report=term-missing" "ai-service"
    else
        # Fallback to system pytest or just skip warning
        run_test "AI Service Tests (System Pytest)" "PYTHONPATH=. pytest --cov=app --cov-report=term-missing" "ai-service"
    fi
fi

# Mebbis Service (Node)
if [ -d "mebbis-service" ]; then
    run_test "Mebbis Service Unit Tests" "npm test -- --coverage" "mebbis-service"
fi

# =============================================================================
# MOBILE TESTS
# =============================================================================
echo -e "${BLUE}📱 Mobile Application Tests${NC}"
echo "----------------------------------------"

if [ -f "mobile/jest.config.js" ]; then
    run_test "Mobile Unit Tests (Jest)" "npm test" "mobile"
fi

# =============================================================================
# DOCS TESTS
# =============================================================================
echo -e "${BLUE}📚 Documentation Tests${NC}"
echo "----------------------------------------"

if [ -f "docs/mkdocs.yml" ]; then
    run_test "MkDocs Build" "mkdocs build --strict" "docs"
fi

# =============================================================================
# LINT CHECKS
# =============================================================================
echo -e "${BLUE}🔍 Lint Checks${NC}"
echo "----------------------------------------"

run_test "Web ESLint" "npm run lint" "web"

# =============================================================================
# TYPE CHECKS
# =============================================================================
echo -e "${BLUE}📝 TypeScript Checks${NC}"
echo "----------------------------------------"

run_test "Web TypeScript" "npx tsc --noEmit" "web"

if [ -f "strapi/tsconfig.json" ]; then
    run_test "Strapi TypeScript" "npx tsc --noEmit" "strapi"
fi

# =============================================================================
# RESULTS
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Results Summary${NC}"
echo -e "${BLUE}========================================${NC}"

if [ -n "$PASSED_TESTS" ]; then
    echo -e "${GREEN}Passed:${NC}"
    echo -e "$PASSED_TESTS"
fi

if [ -n "$FAILED_TESTS" ]; then
    echo -e "${RED}Failed:${NC}"
    echo -e "$FAILED_TESTS"
    echo ""
    exit 1
else
    echo ""
    echo -e "${GREEN}All tests passed! 🎉${NC}"
    exit 0
fi
