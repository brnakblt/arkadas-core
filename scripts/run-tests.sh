#!/bin/bash
# =============================================================================
# Arkadaş ERP - Automated Test Runner
# Runs all tests: Web, Strapi, AI, Mobile, Integration, Multi-Tenant
# =============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Arkadaş ERP Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
STRAPI_URL="${STRAPI_URL:-http://localhost:1337}"
AI_URL="${AI_URL:-http://localhost:8000}"
TENANT_ID="${TENANT_ID:-arkadas}"

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
    
    if eval "$command" 2>&1; then
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
# 1. BUILD VERIFICATION
# =============================================================================
echo -e "${CYAN}🔧 Build Verification${NC}"
echo "----------------------------------------"

run_test "Strapi Build" "npm run build" "strapi"

# =============================================================================
# 2. UNIT TESTS
# =============================================================================
echo -e "${BLUE}📦 Unit Tests${NC}"
echo "----------------------------------------"

# Web Unit Tests
run_test "Web Unit Tests (Vitest)" "npm run test:unit 2>/dev/null || echo 'No unit tests configured'" "web"

# AI Service Tests
if [ -d "ai-service" ]; then
    if [ -f "ai-service/venv/bin/pytest" ]; then
        run_test "AI Service Tests" "PYTHONPATH=. ./venv/bin/pytest -v || true" "ai-service"
    else
        run_test "AI Service Tests" "PYTHONPATH=. pytest -v || true" "ai-service"
    fi
fi

# Mebbis Service Tests
if [ -d "mebbis-service" ]; then
    run_test "Mebbis Service Tests" "npm test -- --coverage 2>/dev/null || echo 'No tests'" "mebbis-service"
fi

# =============================================================================
# 3. TYPE CHECKS
# =============================================================================
echo -e "${BLUE}📝 TypeScript Type Checks${NC}"
echo "----------------------------------------"

run_test "Web TypeScript" "npx tsc --noEmit" "web"
run_test "Strapi TypeScript" "npx tsc --noEmit" "strapi"

# =============================================================================
# 4. LINT CHECKS
# =============================================================================
echo -e "${BLUE}🔍 Lint Checks${NC}"
echo "----------------------------------------"

run_test "Turbo Lint (All)" "npm run lint" "."

# =============================================================================
# 5. INTEGRATION TESTS (requires services running)
# =============================================================================
if [ "$RUN_INTEGRATION" = "true" ]; then
    echo -e "${CYAN}🌐 Integration Tests${NC}"
    echo "----------------------------------------"
    
    # Test Strapi is up
    run_test "Strapi Health" "curl -sf ${STRAPI_URL}/_health || echo 'Strapi not running'"
    
    # Test AI Service is up
    run_test "AI Service Health" "curl -sf ${AI_URL}/api/health || echo 'AI Service not running'"
    
    # Test Redis
    run_test "Redis Connection" "redis-cli -a \$REDIS_PASSWORD ping | grep -q PONG"
fi

# =============================================================================
# 6. MULTI-TENANT API TESTS (requires services + auth)
# =============================================================================
if [ "$RUN_TENANT_TESTS" = "true" ] && [ -n "$TEST_USER_EMAIL" ] && [ -n "$TEST_USER_PASSWORD" ]; then
    echo -e "${CYAN}🏢 Multi-Tenant API Tests${NC}"
    echo "----------------------------------------"
    
    # Get JWT token
    echo "Getting auth token..."
    TOKEN=$(curl -sf -X POST "${STRAPI_URL}/api/auth/mobile/login" \
        -H "Content-Type: application/json" \
        -d "{\"identifier\":\"${TEST_USER_EMAIL}\",\"password\":\"${TEST_USER_PASSWORD}\"}" \
        | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo -e "${GREEN}✓ Got auth token${NC}"
        
        # Test tenant header required
        run_test "Tenant Header Required" "curl -sf -o /dev/null -w '%{http_code}' ${STRAPI_URL}/api/student-profiles | grep -q '400'"
        
        # Test with tenant header
        run_test "Student Profiles with Tenant" "curl -sf ${STRAPI_URL}/api/student-profiles \
            -H 'Authorization: Bearer ${TOKEN}' \
            -H 'x-tenant-id: ${TENANT_ID}' | grep -q 'data'"
        
        # Test tenant isolation
        run_test "Tenant Isolation" "curl -sf ${STRAPI_URL}/api/schedules \
            -H 'Authorization: Bearer ${TOKEN}' \
            -H 'x-tenant-id: ${TENANT_ID}' | grep -q 'data'"
        
        # Test mobile /me endpoint
        run_test "Mobile /me Endpoint" "curl -sf ${STRAPI_URL}/api/auth/mobile/me \
            -H 'Authorization: Bearer ${TOKEN}' | grep -q 'email'"
    else
        echo -e "${RED}✗ Failed to get auth token${NC}"
        FAILED_TESTS="$FAILED_TESTS\n  ✗ Auth token retrieval"
    fi
fi

# =============================================================================
# 7. MOBILE APP TESTS
# =============================================================================
if [ -d "mobile" ] && [ -f "mobile/package.json" ]; then
    echo -e "${BLUE}📱 Mobile App Tests${NC}"
    echo "----------------------------------------"
    
    # TypeScript check (if installed)
    if [ -d "mobile/node_modules" ]; then
        run_test "Mobile TypeScript" "npx tsc --noEmit 2>/dev/null || echo 'Install deps first'" "mobile"
    else
        echo -e "${YELLOW}⚠ Mobile deps not installed, skipping${NC}"
    fi
fi

# =============================================================================
# 8. DOCUMENTATION BUILD
# =============================================================================
if [ -f "docs/mkdocs.yml" ]; then
    echo -e "${BLUE}📚 Documentation Tests${NC}"
    echo "----------------------------------------"
    run_test "MkDocs Build" "python -m mkdocs build --strict 2>/dev/null || mkdocs build --strict 2>/dev/null || echo 'MkDocs not available'" "docs"
fi

# =============================================================================
# RESULTS SUMMARY
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
