#!/bin/bash

# Workflow Run Cleanup Script
# Uses gh, jq, and fzf to select and delete workflow runs.

set -e

# Check dependencies
command -v gh >/dev/null 2>&1 || { echo >&2 "Error: 'gh' CLI is required but not installed."; exit 1; }
command -v jq >/dev/null 2>&1 || { echo >&2 "Error: 'jq' is required but not installed."; exit 1; }
command -v fzf >/dev/null 2>&1 || { echo >&2 "Error: 'fzf' is required but not installed. Please install it (e.g., sudo apt install fzf)."; exit 1; }

# Get current repository
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Fetching workflow runs for $REPO..."

# JQ Filter definition
JQ_FILTER='
def symbol:
  sub("skipped"; "SKIP") |
  sub("success"; "GOOD") |
  sub("failure"; "FAIL") |
  sub("cancelled"; "CNCL") |
  sub("startup_failure"; "STUP");

def tz:
  gsub("[TZ]"; " ");

.workflow_runs[]
  | [
      (.conclusion // .status | symbol),
      (.created_at | tz),
      .id,
      .event,
      .name,
      .head_branch
    ]
  | @tsv
'

# Fetch, Select, and Delete
# 1. Fetch all runs (paginated)
# 2. Parse with jq
# 3. Select with fzf (multi-select)
# 4. Extract IDs and delete

SELECTED_RUNS=$(gh api --paginate "/repos/$REPO/actions/runs" \
  | jq -r "$JQ_FILTER" \
  | fzf --multi --header="Select workflows to DELETE (TAB to select multiple, ENTER to confirm)" --layout=reverse --height=40%)

if [ -z "$SELECTED_RUNS" ]; then
    echo "No runs selected. Exiting."
    exit 0
fi

# Confirm deletion
COUNT=$(echo "$SELECTED_RUNS" | wc -l)
echo "You have selected $COUNT workflow runs for deletion."
read -p "Are you sure you want to delete them? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo "$SELECTED_RUNS" | while read -r run; do
    # Extract ID (3rd column)
    RUN_ID=$(echo "$run" | cut -f3)
    RUN_NAME=$(echo "$run" | cut -f5)
    
    echo -n "Deleting run $RUN_ID ($RUN_NAME)... "
    if gh api -X DELETE "/repos/$REPO/actions/runs/$RUN_ID" --silent >/dev/null 2>&1; then
        echo "OK"
    else
        echo "FAILED"
    fi
done

echo "Done."
