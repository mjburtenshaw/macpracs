#!/usr/bin/env bash
#
# aws-pipeline-watch.sh - Monitor AWS CodePipeline and CodeBuild executions
#
# Usage:
#   ./aws-pipeline-watch.sh pipeline <pipeline-name> [profile] [region]
#   ./aws-pipeline-watch.sh build <project-name> [profile] [region]
#   ./aws-pipeline-watch.sh logs <project-name> [profile] [region]
#
# Examples:
#   ./aws-pipeline-watch.sh pipeline webhook-consumer-production-uk-pipeline grove-cicd-admin us-east-1
#   ./aws-pipeline-watch.sh build webhook-consumer-build-production-uk grove-cicd-admin us-east-1
#   ./aws-pipeline-watch.sh logs webhook-consumer-build-production-uk grove-cicd-admin us-east-1

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_REGION="us-east-1"
DEFAULT_PROFILE="${AWS_PROFILE:-default}"
REFRESH_INTERVAL=10

usage() {
    cat << EOF
Usage: $(basename "$0") <command> <name> [profile] [region]

Commands:
    pipeline <name>     Watch CodePipeline execution status
    build <name>        Watch CodeBuild project status
    logs <name>         Stream CodeBuild logs in real-time
    list-pipelines      List all pipelines in the region
    list-builds         List all build projects in the region

Arguments:
    name                Pipeline or build project name
    profile             AWS CLI profile (default: \$AWS_PROFILE or 'default')
    region              AWS region (default: us-east-1)

Examples:
    $(basename "$0") pipeline my-pipeline grove-cicd-admin us-east-1
    $(basename "$0") build my-build-project
    $(basename "$0") logs my-build-project grove-cicd-admin us-east-1

Environment:
    AWS_PROFILE         Default AWS profile to use
    REFRESH_INTERVAL    Seconds between refreshes (default: 10)
EOF
    exit 1
}

# Check if required commands exist
check_dependencies() {
    local deps=("aws" "jq")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            echo -e "${RED}Error: Required command '$dep' not found${NC}"
            exit 1
        fi
    done
}

# Watch pipeline execution
watch_pipeline() {
    local pipeline_name="$1"
    local profile="$2"
    local region="$3"

    echo -e "${BLUE}Watching pipeline: ${YELLOW}$pipeline_name${NC}"
    echo -e "${BLUE}Profile: ${YELLOW}$profile${NC}, Region: ${YELLOW}$region${NC}"
    echo -e "${BLUE}Refreshing every $REFRESH_INTERVAL seconds (Ctrl+C to exit)${NC}\n"

    while true; do
        clear
        echo -e "${BLUE}=== Pipeline Status: $(date '+%Y-%m-%d %H:%M:%S') ===${NC}\n"

        # Get pipeline state
        local pipeline_state
        pipeline_state=$(aws codepipeline get-pipeline-state \
            --name "$pipeline_name" \
            --region "$region" \
            --profile "$profile" \
            2>&1) || {
            echo -e "${RED}Error: Failed to get pipeline state${NC}"
            echo "$pipeline_state"
            exit 1
        }

        # Parse and display stage information
        echo "$pipeline_state" | jq -r '
            .stageStates[] |
            "\(.stageName):\t\(.latestExecution.status // "NOT_STARTED")" +
            (if .latestExecution.status == "InProgress" then " ⏳"
             elif .latestExecution.status == "Succeeded" then " ✅"
             elif .latestExecution.status == "Failed" then " ❌"
             else "" end)
        ' | while IFS=$'\t' read -r stage status; do
            if [[ "$status" == *"InProgress"* ]]; then
                echo -e "${YELLOW}  $stage: $status${NC}"
            elif [[ "$status" == *"Succeeded"* ]]; then
                echo -e "${GREEN}  $stage: $status${NC}"
            elif [[ "$status" == *"Failed"* ]]; then
                echo -e "${RED}  $stage: $status${NC}"
            else
                echo -e "  $stage: $status"
            fi
        done

        echo ""
        echo -e "${BLUE}Next refresh in $REFRESH_INTERVAL seconds...${NC}"
        sleep "$REFRESH_INTERVAL"
    done
}

# Watch build project
watch_build() {
    local project_name="$1"
    local profile="$2"
    local region="$3"

    echo -e "${BLUE}Watching build project: ${YELLOW}$project_name${NC}"
    echo -e "${BLUE}Profile: ${YELLOW}$profile${NC}, Region: ${YELLOW}$region${NC}"
    echo -e "${BLUE}Refreshing every $REFRESH_INTERVAL seconds (Ctrl+C to exit)${NC}\n"

    while true; do
        clear
        echo -e "${BLUE}=== Build Status: $(date '+%Y-%m-%d %H:%M:%S') ===${NC}\n"

        # Get latest builds
        local builds
        builds=$(aws codebuild list-builds-for-project \
            --project-name "$project_name" \
            --region "$region" \
            --profile "$profile" \
            --max-items 5 \
            --query 'ids' \
            --output json 2>&1) || {
            echo -e "${RED}Error: Failed to get builds${NC}"
            echo "$builds"
            exit 1
        }

        if [[ "$builds" == "[]" ]] || [[ -z "$builds" ]]; then
            echo -e "${YELLOW}No builds found for project${NC}"
        else
            # Get build details
            local build_ids
            build_ids=$(echo "$builds" | jq -r '.[]' | head -5)

            local build_details
            build_details=$(aws codebuild batch-get-builds \
                --ids $build_ids \
                --region "$region" \
                --profile "$profile" \
                --output json 2>&1) || {
                echo -e "${RED}Error: Failed to get build details${NC}"
                exit 1
            }

            echo "$build_details" | jq -r '
                .builds[] |
                "Build: \(.id | split(":") | .[-1])\n" +
                "  Phase: \(.currentPhase // "N/A")\n" +
                "  Status: \(.buildStatus // "IN_PROGRESS")\n" +
                "  Started: \(.startTime // "N/A")\n"
            ' | while IFS= read -r line; do
                if [[ "$line" == *"Status: SUCCEEDED"* ]]; then
                    echo -e "${GREEN}$line${NC}"
                elif [[ "$line" == *"Status: FAILED"* ]]; then
                    echo -e "${RED}$line${NC}"
                elif [[ "$line" == *"Status: IN_PROGRESS"* ]]; then
                    echo -e "${YELLOW}$line${NC}"
                else
                    echo "$line"
                fi
            done
        fi

        echo -e "${BLUE}Next refresh in $REFRESH_INTERVAL seconds...${NC}"
        sleep "$REFRESH_INTERVAL"
    done
}

# Stream build logs
stream_logs() {
    local project_name="$1"
    local profile="$2"
    local region="$3"

    echo -e "${BLUE}Streaming logs for: ${YELLOW}$project_name${NC}"
    echo -e "${BLUE}Profile: ${YELLOW}$profile${NC}, Region: ${YELLOW}$region${NC}\n"

    # Tail CloudWatch logs
    aws logs tail "/aws/codebuild/$project_name" \
        --region "$region" \
        --profile "$profile" \
        --follow \
        --format short
}

# List all pipelines
list_pipelines() {
    local profile="$1"
    local region="$2"

    echo -e "${BLUE}Listing all pipelines in ${YELLOW}$region${NC}\n"

    aws codepipeline list-pipelines \
        --region "$region" \
        --profile "$profile" \
        --output table
}

# List all build projects
list_builds() {
    local profile="$1"
    local region="$2"

    echo -e "${BLUE}Listing all build projects in ${YELLOW}$region${NC}\n"

    aws codebuild list-projects \
        --region "$region" \
        --profile "$profile" \
        --output table
}

# Main
main() {
    check_dependencies

    if [[ $# -lt 1 ]]; then
        usage
    fi

    local command="$1"
    shift

    case "$command" in
        pipeline)
            if [[ $# -lt 1 ]]; then
                echo -e "${RED}Error: Pipeline name required${NC}"
                usage
            fi
            local pipeline_name="$1"
            local profile="${2:-$DEFAULT_PROFILE}"
            local region="${3:-$DEFAULT_REGION}"
            watch_pipeline "$pipeline_name" "$profile" "$region"
            ;;
        build)
            if [[ $# -lt 1 ]]; then
                echo -e "${RED}Error: Build project name required${NC}"
                usage
            fi
            local project_name="$1"
            local profile="${2:-$DEFAULT_PROFILE}"
            local region="${3:-$DEFAULT_REGION}"
            watch_build "$project_name" "$profile" "$region"
            ;;
        logs)
            if [[ $# -lt 1 ]]; then
                echo -e "${RED}Error: Build project name required${NC}"
                usage
            fi
            local project_name="$1"
            local profile="${2:-$DEFAULT_PROFILE}"
            local region="${3:-$DEFAULT_REGION}"
            stream_logs "$project_name" "$profile" "$region"
            ;;
        list-pipelines)
            local profile="${1:-$DEFAULT_PROFILE}"
            local region="${2:-$DEFAULT_REGION}"
            list_pipelines "$profile" "$region"
            ;;
        list-builds)
            local profile="${1:-$DEFAULT_PROFILE}"
            local region="${2:-$DEFAULT_REGION}"
            list_builds "$profile" "$region"
            ;;
        -h|--help|help)
            usage
            ;;
        *)
            echo -e "${RED}Error: Unknown command '$command'${NC}"
            usage
            ;;
    esac
}

main "$@"
