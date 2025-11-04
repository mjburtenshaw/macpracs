#!/usr/bin/env bash
#
# github-actions-describe.sh - Get detailed information about a GitHub Actions workflow run
#
# Usage:
#   ./github-actions-describe.sh <owner/repo> <run-id>
#
# Examples:
#   ./github-actions-describe.sh mjburtenshaw/macpracs 12345678
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
Usage: $(basename "$0") <owner/repo> <run-id>

Arguments:
    owner/repo      Repository in owner/repo format
    run-id          Workflow run ID to describe

Examples:
    $(basename "$0") mjburtenshaw/macpracs 12345678
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

# Describe workflow run
describe_workflow() {
    local repo="$1"
    local run_id="$2"

    # Get workflow run details
    local run_json
    run_json=$(gh api "repos/$repo/actions/runs/$run_id" 2>&1) || {
        echo -e "${RED}Error: Failed to get workflow run${NC}"
        echo "$run_json"
        exit 1
    }

    # Extract run metadata
    local workflow_name=$(echo "$run_json" | jq -r '.name // "N/A"')
    local workflow_id=$(echo "$run_json" | jq -r '.workflow_id')
    local status=$(echo "$run_json" | jq -r '.status // "unknown"')
    local conclusion=$(echo "$run_json" | jq -r '.conclusion // "N/A"')
    local commit_sha=$(echo "$run_json" | jq -r '.head_sha')
    local commit_sha_short=$(echo "$commit_sha" | cut -c1-7)
    local branch=$(echo "$run_json" | jq -r '.head_branch // "N/A"')
    local event=$(echo "$run_json" | jq -r '.event // "N/A"')
    local display_title=$(echo "$run_json" | jq -r '.display_title // .name')
    local html_url=$(echo "$run_json" | jq -r '.html_url')
    local created_at=$(echo "$run_json" | jq -r '.created_at')
    local updated_at=$(echo "$run_json" | jq -r '.updated_at')
    local run_started_at=$(echo "$run_json" | jq -r '.run_started_at // .created_at')
    local run_attempt=$(echo "$run_json" | jq -r '.run_attempt // 1')

    # Overall run status
    local run_status_emoji="⏸️"
    local run_status_color="${NC}"

    if [[ "$status" == "completed" ]]; then
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

    # Print workflow run summary
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                     GITHUB ACTIONS WORKFLOW RUN                           ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${CYAN}## Run Information${NC}"
    echo -e "${CYAN}Run ID:${NC}           ${YELLOW}#$run_id${NC}"
    echo -e "${CYAN}Workflow:${NC}         ${YELLOW}$workflow_name${NC} (ID: $workflow_id)"
    echo -e "${CYAN}Title:${NC}            ${YELLOW}$display_title${NC}"
    echo -e "${CYAN}Status:${NC}           ${run_status_color}$run_status_emoji $status${NC}"
    if [[ "$status" == "completed" ]]; then
        echo -e "${CYAN}Conclusion:${NC}       ${run_status_color}$run_status_emoji $conclusion${NC}"
    fi
    echo -e "${CYAN}Run Attempt:${NC}      ${YELLOW}$run_attempt${NC}"
    echo -e "${CYAN}URL:${NC}              ${BLUE}$html_url${NC}"
    echo ""

    echo -e "${CYAN}## Source Information${NC}"
    echo -e "${CYAN}Branch:${NC}           ${YELLOW}$branch${NC}"
    echo -e "${CYAN}Commit SHA:${NC}       ${YELLOW}$commit_sha${NC} (${YELLOW}$commit_sha_short${NC})"
    echo -e "${CYAN}Trigger Event:${NC}    ${YELLOW}$event${NC}"
    echo ""

    # Format timestamps
    local created_formatted=$(format_timestamp "$created_at")
    local updated_formatted=$(format_timestamp "$updated_at")
    local started_formatted=$(format_timestamp "$run_started_at")

    echo -e "${CYAN}## Timing${NC}"
    echo -e "${CYAN}Created:${NC}          $(echo "$created_formatted" | awk -F' \\| ' '{print $2}') ($(echo "$created_formatted" | awk -F' \\| ' '{print $1}'))"
    echo -e "${CYAN}Started:${NC}          $(echo "$started_formatted" | awk -F' \\| ' '{print $2}') ($(echo "$started_formatted" | awk -F' \\| ' '{print $1}'))"
    echo -e "${CYAN}Last Updated:${NC}     $(echo "$updated_formatted" | awk -F' \\| ' '{print $2}') ($(echo "$updated_formatted" | awk -F' \\| ' '{print $1}'))"
    echo ""

    # Get workflow jobs
    local jobs_json
    jobs_json=$(gh api "repos/$repo/actions/runs/$run_id/jobs" 2>&1) || {
        echo -e "${RED}Error: Failed to get workflow jobs${NC}"
        echo "$jobs_json"
        exit 1
    }

    local jobs_count=$(echo "$jobs_json" | jq '.jobs | length')

    echo -e "${CYAN}## Jobs (${YELLOW}$jobs_count${CYAN})${NC}"
    echo ""

    # Display jobs
    local job_num=0
    echo "$jobs_json" | jq -c '.jobs[]' | while read -r job; do
        job_num=$((job_num + 1))

        local job_id=$(echo "$job" | jq -r '.id')
        local job_name=$(echo "$job" | jq -r '.name')
        local job_status=$(echo "$job" | jq -r '.status')
        local job_conclusion=$(echo "$job" | jq -r '.conclusion // "N/A"')
        local job_started_at=$(echo "$job" | jq -r '.started_at // ""')
        local job_completed_at=$(echo "$job" | jq -r '.completed_at // ""')
        local job_html_url=$(echo "$job" | jq -r '.html_url')
        local runner_name=$(echo "$job" | jq -r '.runner_name // "N/A"')

        # Job status emoji and color
        local job_emoji="⏸️"
        local job_color="${NC}"

        if [[ "$job_status" == "completed" ]]; then
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

        echo -e "${job_color}### $job_emoji Job: $job_name${NC}"
        echo -e "${CYAN}  ID:${NC}             ${YELLOW}$job_id${NC}"
        echo -e "${CYAN}  Status:${NC}         ${job_color}$job_status${NC}"
        if [[ "$job_status" == "completed" ]]; then
            echo -e "${CYAN}  Conclusion:${NC}     ${job_color}$job_conclusion${NC}"
        fi
        echo -e "${CYAN}  Runner:${NC}         ${YELLOW}$runner_name${NC}"

        if [[ -n "$job_started_at" && "$job_started_at" != "null" ]]; then
            local job_started_formatted=$(format_timestamp "$job_started_at")
            echo -e "${CYAN}  Started:${NC}        $(echo "$job_started_formatted" | awk -F' \\| ' '{print $2}') ($(echo "$job_started_formatted" | awk -F' \\| ' '{print $1}'))"
        fi

        if [[ -n "$job_completed_at" && "$job_completed_at" != "null" ]]; then
            local job_completed_formatted=$(format_timestamp "$job_completed_at")
            echo -e "${CYAN}  Completed:${NC}      $(echo "$job_completed_formatted" | awk -F' \\| ' '{print $2}') ($(echo "$job_completed_formatted" | awk -F' \\| ' '{print $1}'))"
        fi

        echo -e "${CYAN}  URL:${NC}            ${BLUE}$job_html_url${NC}"
        echo ""

        # Display steps
        local steps_count=$(echo "$job" | jq '.steps | length')
        echo -e "${CYAN}  Steps (${YELLOW}$steps_count${CYAN}):${NC}"

        echo "$job" | jq -c '.steps[]?' | while read -r step; do
            local step_name=$(echo "$step" | jq -r '.name')
            local step_status=$(echo "$step" | jq -r '.status')
            local step_conclusion=$(echo "$step" | jq -r '.conclusion // "N/A"')
            local step_number=$(echo "$step" | jq -r '.number')
            local step_started_at=$(echo "$step" | jq -r '.started_at // ""')
            local step_completed_at=$(echo "$step" | jq -r '.completed_at // ""')

            # Step status emoji
            local step_emoji="  "
            local step_color="${GRAY}"

            if [[ "$step_status" == "completed" ]]; then
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

            # Calculate step duration if completed
            local duration_text=""
            if [[ -n "$step_completed_at" && "$step_completed_at" != "null" && -n "$step_started_at" && "$step_started_at" != "null" ]]; then
                local start_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$step_started_at" "+%s" 2>/dev/null || echo "0")
                local end_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$step_completed_at" "+%s" 2>/dev/null || echo "0")
                if [[ "$start_epoch" -gt 0 && "$end_epoch" -gt 0 ]]; then
                    local duration=$((end_epoch - start_epoch))
                    if [[ $duration -ge 60 ]]; then
                        local minutes=$((duration / 60))
                        local seconds=$((duration % 60))
                        duration_text=" (${minutes}m ${seconds}s)"
                    else
                        duration_text=" (${duration}s)"
                    fi
                fi
            fi

            printf "${step_color}    %2d. %s %-50s [%-10s]%s${NC}\n" \
                "$step_number" \
                "$step_emoji" \
                "$step_name" \
                "$step_conclusion" \
                "$duration_text"
        done

        echo ""
    done

    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                           END OF REPORT                                   ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
}

# Main entry point
main() {
    if [[ $# -lt 2 ]]; then
        usage
    fi

    check_dependencies

    local repo="$1"
    local run_id="$2"

    describe_workflow "$repo" "$run_id"
}

main "$@"
