#!/bin/bash
# =============================================================================
# Docker Scout Security Scanner
# Scans all project Docker images for CVEs and provides recommendations
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
SCAN_MODE="quickview"  # quickview, cves, recommendations
OUTPUT_FORMAT="table"   # table, json
ONLY_CRITICAL=false
IMAGES=()

while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            SCAN_MODE="$2"
            shift 2
            ;;
        --format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --critical)
            ONLY_CRITICAL=true
            shift
            ;;
        --image)
            IMAGES+=("$2")
            shift 2
            ;;
        -h|--help)
            echo "Docker Scout Security Scanner"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --mode <mode>       Scan mode: quickview, cves, recommendations (default: quickview)"
            echo "  --format <format>   Output format: table, json (default: table)"
            echo "  --critical          Only show critical and high severity CVEs"
            echo "  --image <name>      Scan specific image (can be repeated)"
            echo "  -h, --help          Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                           # Quick overview of all images"
            echo "  $0 --mode cves --critical    # Show only critical/high CVEs"
            echo "  $0 --mode recommendations    # Show fix recommendations"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if docker scout is available
if ! docker scout version &> /dev/null; then
    echo -e "${RED}Error: Docker Scout is not available${NC}"
    echo ""
    echo "To install Docker Scout:"
    echo "  1. Update Docker Desktop to latest version, or"
    echo "  2. Login to Docker Hub: docker login"
    echo ""
    echo "For more info: https://docs.docker.com/scout/"
    exit 1
fi

# Default images if none specified
if [ ${#IMAGES[@]} -eq 0 ]; then
    # Check for project images
    if docker images | grep -q "arkadasozelegitim-strapi"; then
        IMAGES+=("arkadasozelegitim-strapi")
    fi
    if docker images | grep -q "arkadasozelegitim-web"; then
        IMAGES+=("arkadasozelegitim-web")
    fi
fi

if [ ${#IMAGES[@]} -eq 0 ]; then
    echo -e "${YELLOW}No Docker images found to scan.${NC}"
    echo ""
    echo "Build images first with:"
    echo "  docker compose build"
    exit 0
fi

echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Docker Scout Security Scanner${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "  Mode: ${YELLOW}${SCAN_MODE}${NC}"
echo -e "  Images: ${YELLOW}${IMAGES[*]}${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

TOTAL_CRITICAL=0
TOTAL_HIGH=0

for IMAGE in "${IMAGES[@]}"; do
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  Scanning: ${IMAGE}${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    SCOUT_ARGS=""
    
    if [ "$ONLY_CRITICAL" = true ]; then
        SCOUT_ARGS="--only-severity critical,high"
    fi

    if [ "$OUTPUT_FORMAT" = "json" ]; then
        SCOUT_ARGS="$SCOUT_ARGS --format json"
    fi

    case $SCAN_MODE in
        quickview)
            docker scout quickview "$IMAGE" $SCOUT_ARGS
            ;;
        cves)
            docker scout cves "$IMAGE" $SCOUT_ARGS
            ;;
        recommendations)
            docker scout recommendations "$IMAGE" $SCOUT_ARGS
            ;;
        *)
            echo "Unknown mode: $SCAN_MODE"
            exit 1
            ;;
    esac

    echo ""
done

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Scan Complete${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "For detailed CVE information, run:"
echo -e "  ${YELLOW}docker scout cves <image>${NC}"
echo ""
echo -e "For fix recommendations, run:"
echo -e "  ${YELLOW}docker scout recommendations <image>${NC}"
echo ""
