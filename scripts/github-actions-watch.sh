#!/usr/bin/env bash
#
# github-actions-watch.sh - Monitor GitHub Actions workflow runs in real-time
#
# Usage:
#   ./github-actions-watch.sh <owner/repo> <run-id>
#
# Examples:
#   ./github-actions-watch.sh mjburtenshaw/macpracs 12345678
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

# Default values
REFRESH_INTERVAL=10

usage() {
    cat << EOF
Usage: $(basename "$0") <owner/repo> <run-id>

Arguments:
    owner/repo      Repository in owner/repo format
    run-id          Workflow run ID to watch

Examples:
    $(basename "$0") mjburtenshaw/macpracs 12345678

Environment:
    REFRESH_INTERVAL    Seconds between refreshes (default: 10)
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

# Watch workflow run
watch_workflow() {
    local repo="$1"
    local run_id="$2"

    echo -e "${BLUE}Watching workflow run: ${YELLOW}$run_id${NC}"
    echo -e "${BLUE}Repository: ${YELLOW}$repo${NC}"
    echo -e "${BLUE}Refreshing every $REFRESH_INTERVAL seconds (Ctrl+C to exit)${NC}\n"

    local previous_status=""

    while true; do
        clear
        local current_time=$(date '+%Y-%m-%d %H:%M:%S')

        echo -e "${BLUE}=== GitHub Actions Status: $current_time ===${NC}"

        # Get workflow run details
        local run_json
        run_json=$(gh api "repos/$repo/actions/runs/$run_id" 2>&1) || {
            echo -e "${RED}Error: Failed to get workflow run${NC}"
            echo "$run_json"
            exit 1
        }

        # Extract run metadata
        local workflow_name=$(echo "$run_json" | jq -r '.name // "N/A"')
        local status=$(echo "$run_json" | jq -r '.status // "unknown"')
        local conclusion=$(echo "$run_json" | jq -r '.conclusion // ""')
        local commit_sha=$(echo "$run_json" | jq -r '.head_sha' | cut -c1-7)
        local branch=$(echo "$run_json" | jq -r '.head_branch // "N/A"')
        local event=$(echo "$run_json" | jq -r '.event // "N/A"')
        local display_title=$(echo "$run_json" | jq -r '.display_title // .name')

        # Overall run status
        local run_status_emoji="⏸️"
        local run_status_color="${NC}"
        local run_status_text="$status"

        if [[ "$status" == "completed" ]]; then
            run_status_text="$conclusion"
            case "$conclusion" in
                success)
                    run_status_emoji="✅"
                    run_status_color="${GREEN}"
                    ;;
                failure)
                    run_status_emoji="❌"
                    run_status_color="${RED}"
                    ;;
                cancelled)
                    run_status_emoji="🚫"
                    run_status_color="${GRAY}"
                    ;;
                skipped)
                    run_status_emoji="⏭️"
                    run_status_color="${GRAY}"
                    ;;
                *)
                    run_status_emoji="⚪"
                    run_status_color="${NC}"
                    ;;
            esac
        elif [[ "$status" == "in_progress" ]]; then
            run_status_emoji="⏳"
            run_status_color="${YELLOW}"
        elif [[ "$status" == "queued" ]]; then
            run_status_emoji="⏸️"
            run_status_color="${CYAN}"
        fi

        echo -e "${CYAN}Run: ${YELLOW}#$run_id${NC} | ${CYAN}Workflow: ${YELLOW}$workflow_name${NC}"
        echo -e "${CYAN}Branch: ${YELLOW}$branch${NC} | ${CYAN}Commit: ${YELLOW}$commit_sha${NC} | ${CYAN}Event: ${YELLOW}$event${NC}"
        echo -e "${CYAN}Title: ${YELLOW}$display_title${NC}"
        echo -e "${CYAN}Status: ${run_status_color}$run_status_emoji $run_status_text${NC}"
        echo ""

        # Get workflow jobs
        local jobs_json
        jobs_json=$(gh api "repos/$repo/actions/runs/$run_id/jobs" 2>&1) || {
            echo -e "${RED}Error: Failed to get workflow jobs${NC}"
            echo "$jobs_json"
            exit 1
        }

        # Display jobs and steps
        echo "$jobs_json" | jq -c '.jobs[]' | while read -r job; do
            local job_name=$(echo "$job" | jq -r '.name')
            local job_status=$(echo "$job" | jq -r '.status')
            local job_conclusion=$(echo "$job" | jq -r '.conclusion // ""')
            local job_started_at=$(echo "$job" | jq -r '.started_at // ""')
            local job_completed_at=$(echo "$job" | jq -r '.completed_at // ""')

            # Job status emoji and color
            local job_emoji="⏸️"
            local job_color="${NC}"
            local job_status_text="$job_status"

            if [[ "$job_status" == "completed" ]]; then
                job_status_text="$job_conclusion"
                case "$job_conclusion" in
                    success)
                        job_emoji="✅"
                        job_color="${GREEN}"
                        ;;
                    failure)
                        job_emoji="❌"
                        job_color="${RED}"
                        ;;
                    cancelled)
                        job_emoji="🚫"
                        job_color="${GRAY}"
                        ;;
                    skipped)
                        job_emoji="⏭️"
                        job_color="${GRAY}"
                        ;;
                    *)
                        job_emoji="⚪"
                        job_color="${NC}"
                        ;;
                esac
            elif [[ "$job_status" == "in_progress" ]]; then
                job_emoji="⏳"
                job_color="${YELLOW}"
            elif [[ "$job_status" == "queued" ]]; then
                job_emoji="⏸️"
                job_color="${CYAN}"
            fi

            # Format job timestamp
            local job_time_display=""
            if [[ -n "$job_started_at" && "$job_started_at" != "null" ]]; then
                local formatted=$(format_timestamp "$job_started_at")
                local iso_local=$(echo "$formatted" | awk -F' \\| ' '{print $2}')
                job_time_display=$(echo "$iso_local" | awk '{print $2}')
                local relative=$(echo "$formatted" | awk -F' \\| ' '{print $1}')

                if [[ "$job_status" == "in_progress" ]]; then
                    job_time_display="$job_time_display ($relative)"
                else
                    job_time_display="$job_time_display $relative"
                fi
            fi

            # Print job line
            printf "${job_color}%-3s %-40s %-15s [%s]${NC}\n" \
                "$job_emoji" \
                "$job_name" \
                "$job_status_text" \
                "$job_time_display"

            # Display steps for in-progress or failed jobs
            if [[ "$job_status" == "in_progress" || "$job_conclusion" == "failure" ]]; then
                echo "$job" | jq -c '.steps[]?' | while read -r step; do
                    local step_name=$(echo "$step" | jq -r '.name')
                    local step_status=$(echo "$step" | jq -r '.status')
                    local step_conclusion=$(echo "$step" | jq -r '.conclusion // ""')
                    local step_number=$(echo "$step" | jq -r '.number')

                    # Step status emoji
                    local step_emoji="  "
                    local step_color="${GRAY}"
                    local step_status_text="$step_status"

                    if [[ "$step_status" == "completed" ]]; then
                        step_status_text="$step_conclusion"
                        case "$step_conclusion" in
                            success)
                                step_emoji="  ✓"
                                step_color="${GREEN}"
                                ;;
                            failure)
                                step_emoji="  ✗"
                                step_color="${RED}"
                                ;;
                            skipped)
                                step_emoji="  ○"
                                step_color="${GRAY}"
                                ;;
                        esac
                    elif [[ "$step_status" == "in_progress" ]]; then
                        step_emoji="  ▶"
                        step_color="${YELLOW}"
                    fi

                    printf "${step_color}    %s %-50s %-15s${NC}\n" \
                        "$step_emoji" \
                        "$step_name" \
                        "$step_status_text"
                done
            fi

            echo ""
        done

        # Check if run is completed
        if [[ "$status" == "completed" ]]; then
            echo -e "${BLUE}=== Workflow run completed with status: ${run_status_color}$conclusion${NC} ===${NC}"
            break
        fi

        # Store previous status for change detection
        previous_status="$status"

        sleep "$REFRESH_INTERVAL"
    done
}

# Main entry point
main() {
    if [[ $# -lt 2 ]]; then
        usage
    fi

    check_dependencies

    local repo="$1"
    local run_id="$2"

    watch_workflow "$repo" "$run_id"
}

main "$@"
