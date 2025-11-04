#!/usr/bin/env bash
#
# github-actions-list.sh - List GitHub Actions workflow runs
#
# Usage:
#   ./github-actions-list.sh <owner/repo> [--branch <branch>] [--workflow <name>] [--status <status>] [--limit <number>]
#
# Examples:
#   ./github-actions-list.sh mjburtenshaw/macpracs
#   ./github-actions-list.sh mjburtenshaw/macpracs --branch main --limit 10
#   ./github-actions-list.sh mjburtenshaw/macpracs --status in_progress
#
# Requirements:
#   - gh (GitHub CLI)
#   - jq

set -euo pipefail

# Source timestamp formatting utility
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/format-timestamp.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

usage() {
    cat << EOF
Usage: $(basename "$0") <owner/repo> [options]

Arguments:
    owner/repo      Repository in owner/repo format

Options:
    --branch <branch>       Filter by branch name
    --workflow <name>       Filter by workflow name or ID
    --status <status>       Filter by status (queued, in_progress, completed)
    --limit <number>        Limit number of results (default: 20)

Examples:
    $(basename "$0") mjburtenshaw/macpracs
    $(basename "$0") mjburtenshaw/macpracs --branch main --limit 10
    $(basename "$0") mjburtenshaw/macpracs --status in_progress
EOF
    exit 1
}

# Check if required commands exist
check_dependencies() {
    local deps=("gh" "jq")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            echo -e "${RED}Error: Required command '$dep' not found${NC}"
            if [[ "$dep" == "gh" ]]; then
                echo -e "${YELLOW}Install with: brew install gh${NC}"
            fi
            exit 1
        fi
    done

    # Check gh authentication
    if ! gh auth status &>/dev/null; then
        echo -e "${RED}Error: Not authenticated with GitHub${NC}"
        echo -e "${YELLOW}Run: gh auth login${NC}"
        exit 1
    fi
}

# List workflow runs
list_workflows() {
    local repo="$1"
    local branch="$2"
    local workflow="$3"
    local status="$4"
    local limit="$5"

    # Build API query
    local query="per_page=$limit"
    [[ -n "$branch" ]] && query+="&branch=$branch"
    [[ -n "$workflow" ]] && query+="&workflow_id=$workflow"
    [[ -n "$status" ]] && query+="&status=$status"

    echo -e "${BLUE}Workflow Runs for ${YELLOW}$repo${NC}"
    [[ -n "$branch" ]] && echo -e "${CYAN}Branch: ${YELLOW}$branch${NC}"
    [[ -n "$workflow" ]] && echo -e "${CYAN}Workflow: ${YELLOW}$workflow${NC}"
    [[ -n "$status" ]] && echo -e "${CYAN}Status: ${YELLOW}$status${NC}"
    echo ""

    # Fetch workflow runs
    local runs_json
    runs_json=$(gh api "repos/$repo/actions/runs?$query" 2>&1) || {
        echo -e "${RED}Error: Failed to get workflow runs${NC}"
        echo "$runs_json"
        exit 1
    }

    local runs_count=$(echo "$runs_json" | jq '.workflow_runs | length')

    if [[ "$runs_count" -eq 0 ]]; then
        echo -e "${YELLOW}No workflow runs found${NC}"
        exit 0
    fi

    # Print table header
    printf "${CYAN}%-10s %-15s %-40s %-15s %-10s %-20s${NC}\n" \
        "ID" "STATUS" "TITLE" "BRANCH" "SHA" "STARTED"
    printf "${GRAY}%-10s %-15s %-40s %-15s %-10s %-20s${NC}\n" \
        "----------" "---------------" "----------------------------------------" "---------------" "----------" "--------------------"

    # Display runs
    echo "$runs_json" | jq -c '.workflow_runs[]' | while read -r run; do
        local run_id=$(echo "$run" | jq -r '.id')
        local status=$(echo "$run" | jq -r '.status')
        local conclusion=$(echo "$run" | jq -r '.conclusion // ""')
        local display_title=$(echo "$run" | jq -r '.display_title // .name')
        local branch=$(echo "$run" | jq -r '.head_branch')
        local sha=$(echo "$run" | jq -r '.head_sha' | cut -c1-7)
        local started_at=$(echo "$run" | jq -r '.run_started_at // .created_at')

        # Status emoji and color
        local status_emoji="⏸️"
        local status_color="${NC}"
        local status_text="$status"

        if [[ "$status" == "completed" ]]; then
            status_text="$conclusion"
            case "$conclusion" in
                success)
                    status_emoji="✅"
                    status_color="${GREEN}"
                    ;;
                failure)
                    status_emoji="❌"
                    status_color="${RED}"
                    ;;
                cancelled)
                    status_emoji="🚫"
                    status_color="${GRAY}"
                    ;;
                skipped)
                    status_emoji="⏭️"
                    status_color="${GRAY}"
                    ;;
                *)
                    status_emoji="⚪"
                    status_color="${NC}"
                    ;;
            esac
        elif [[ "$status" == "in_progress" ]]; then
            status_emoji="⏳"
            status_color="${YELLOW}"
        elif [[ "$status" == "queued" ]]; then
            status_emoji="⏸️"
            status_color="${CYAN}"
        fi

        # Format timestamp
        local time_display=""
        if [[ -n "$started_at" && "$started_at" != "null" ]]; then
            local formatted=$(format_timestamp "$started_at")
            local relative=$(echo "$formatted" | awk -F' \\| ' '{print $1}')
            time_display="$relative"
        fi

        # Truncate title if too long
        if [[ ${#display_title} -gt 37 ]]; then
            display_title="${display_title:0:37}..."
        fi

        # Truncate branch if too long
        if [[ ${#branch} -gt 12 ]]; then
            branch="${branch:0:12}..."
        fi

        printf "${status_color}%-10s %s %-13s %-40s %-15s %-10s %-20s${NC}\n" \
            "$run_id" \
            "$status_emoji" \
            "$status_text" \
            "$display_title" \
            "$branch" \
            "$sha" \
            "$time_display"
    done

    echo ""
    echo -e "${GRAY}Total: $runs_count run(s)${NC}"
    echo -e "${GRAY}💡 Tip: Watch a run with: macpracs github actions watch --repo $repo --run-id <ID>${NC}"
}

# Main entry point
main() {
    if [[ $# -lt 1 ]]; then
        usage
    fi

    check_dependencies

    local repo="$1"
    shift

    # Parse optional flags
    local branch=""
    local workflow=""
    local status=""
    local limit="20"

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --branch)
                branch="$2"
                shift 2
                ;;
            --workflow)
                workflow="$2"
                shift 2
                ;;
            --status)
                status="$2"
                shift 2
                ;;
            --limit)
                limit="$2"
                shift 2
                ;;
            *)
                echo -e "${RED}Error: Unknown option $1${NC}"
                usage
                ;;
        esac
    done

    list_workflows "$repo" "$branch" "$workflow" "$status" "$limit"
}

main "$@"
