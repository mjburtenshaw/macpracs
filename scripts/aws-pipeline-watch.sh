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
DEFAULT_REGION="us-east-1"
DEFAULT_PROFILE="${AWS_PROFILE:-default}"
REFRESH_INTERVAL=10

usage() {
    cat << EOF
Usage: $(basename "$0") <command> <name> [profile] [region]

Commands:
    pipeline <name>                Watch CodePipeline execution status
    build <name>                   Watch CodeBuild project status
    logs <name>                    Stream CodeBuild logs in real-time
    view-build-logs <build-id>     View logs for a completed build
    retry-build <project> <id>     Retry a failed CodeBuild job
    retry-pipeline <name>          Retry a pipeline execution
    list-pipelines                 List all pipelines in the region
    list-builds                    List all build projects in the region

Arguments:
    name                Pipeline or build project name
    build-id            Build ID to view logs for
    project             CodeBuild project name
    id                  Build ID to retry
    profile             AWS CLI profile (default: \$AWS_PROFILE or 'default')
    region              AWS region (default: us-east-1)

Examples:
    $(basename "$0") pipeline my-pipeline grove-cicd-admin us-east-1
    $(basename "$0") build my-build-project
    $(basename "$0") logs my-build-project grove-cicd-admin us-east-1
    $(basename "$0") view-build-logs my-project:abc123 grove-cicd-admin us-east-1
    $(basename "$0") retry-build my-project my-project:abc123 grove-cicd-admin us-east-1

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

    # Get latest pipeline execution for metadata
    local latest_execution
    latest_execution=$(aws codepipeline list-pipeline-executions \
        --pipeline-name "$pipeline_name" \
        --max-items 1 \
        --region "$region" \
        --profile "$profile" \
        --output json 2>&1) || {
        echo -e "${RED}Error: Failed to get pipeline executions${NC}"
        echo "$latest_execution"
        exit 1
    }

    local execution_id
    execution_id=$(echo "$latest_execution" | jq -r '.pipelineExecutionSummaries[0].pipelineExecutionId // "N/A"')

    local commit_sha=""
    local trigger_type=""
    local trigger_detail=""

    if [[ "$execution_id" != "N/A" ]]; then
        local execution_details
        execution_details=$(aws codepipeline get-pipeline-execution \
            --pipeline-name "$pipeline_name" \
            --pipeline-execution-id "$execution_id" \
            --region "$region" \
            --profile "$profile" \
            --output json 2>/dev/null)

        if [[ $? -eq 0 ]]; then
            commit_sha=$(echo "$execution_details" | jq -r '.pipelineExecution.artifactRevisions[0].revisionId // "N/A"' | cut -c1-7)
            trigger_type=$(echo "$execution_details" | jq -r '.pipelineExecution.trigger.triggerType // "N/A"')
            trigger_detail=$(echo "$execution_details" | jq -r '.pipelineExecution.trigger.triggerDetail // ""')
        fi
    fi

    local execution_id_short=$(echo "$execution_id" | cut -c1-8)

    while true; do
        clear
        local current_time=$(date '+%Y-%m-%d %H:%M:%S')
        local current_epoch=$(date +%s)

        echo -e "${BLUE}=== Pipeline Status: $current_time ===${NC}"
        echo -e "${CYAN}Execution: ${YELLOW}$execution_id_short${NC} | ${CYAN}Commit: ${YELLOW}$commit_sha${NC} | ${CYAN}Trigger: ${YELLOW}$trigger_type${NC}"
        echo ""

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

        # Parse and display stage information with timestamps and actions
        echo "$pipeline_state" | jq -r --arg current_epoch "$current_epoch" '
            .stageStates[] |
            {
                stageName: .stageName,
                status: (.latestExecution.status // "NOT_STARTED"),
                # Get timestamp from the most recent action in the stage
                lastStatusChange: (
                    [.actionStates[]?.latestExecution?.lastStatusChange // empty] |
                    sort |
                    reverse |
                    .[0] // ""
                ),
                actions: [.actionStates[]? | select(.latestExecution.status == "InProgress") | .actionName]
            } |
            "\(.stageName)\t\(.status)\t\(.lastStatusChange)\t\(.actions | join(", "))"
        ' | while IFS=$'\t' read -r stage status timestamp actions; do
            local status_emoji=""
            local color="${NC}"

            # Determine emoji and color
            if [[ "$status" == "InProgress" ]]; then
                status_emoji="⏳"
                color="${YELLOW}"
            elif [[ "$status" == "Succeeded" ]]; then
                status_emoji="✅"
                color="${GREEN}"
            elif [[ "$status" == "Failed" ]]; then
                status_emoji="❌"
                color="${RED}"
            else
                status_emoji="⏸️ "
                color="${NC}"
            fi

            # Format timestamp and calculate relative time
            local time_display=""
            local relative_time=""
            if [[ -n "$timestamp" && "$timestamp" != "null" ]]; then
                # Use format_timestamp utility to get formatted output
                local formatted=$(format_timestamp "$timestamp")

                # Extract the relative time (first field before |)
                local relative=$(echo "$formatted" | awk -F' \\| ' '{print $1}')

                # Extract the local time display (second field)
                local iso_local=$(echo "$formatted" | awk -F' \\| ' '{print $2}')
                time_display=$(echo "$iso_local" | awk '{print $2}')

                # For in-progress stages, show duration instead of "ago"
                if [[ "$status" == "InProgress" ]]; then
                    relative_time="(${relative/ ago/})"
                else
                    relative_time="($relative)"
                fi
            fi

            # Print stage with alignment
            printf "${color}  %-25s %s %-13s [%s] %s${NC}\n" \
                "$stage:" \
                "$status_emoji" \
                "$status" \
                "$time_display" \
                "$relative_time"

            # Show current action for InProgress stages
            if [[ "$status" == "InProgress" && -n "$actions" ]]; then
                echo -e "${CYAN}    └─ $actions${NC}"
            fi
        done

        echo ""
        echo -e "${CYAN}💡 Tips:${NC}"
        echo -e "${GRAY}  • Replay this watch: macpracs aws pipeline watch $pipeline_name --profile $profile --region $region${NC}"
        echo -e "${GRAY}  • View execution details: macpracs aws pipeline describe --execution-id $execution_id --pipeline $pipeline_name --profile $profile --region $region${NC}"
        echo -e "${GRAY}  • See commit info: macpracs aws pipeline describe --execution-id latest --pipeline $pipeline_name --profile $profile --region $region --format md${NC}"
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

    # Get project configuration to find actual log group name
    echo -e "${CYAN}Fetching project configuration...${NC}"
    local project_config
    project_config=$(aws codebuild batch-get-projects \
        --names "$project_name" \
        --region "$region" \
        --profile "$profile" \
        --output json 2>&1) || {
        echo -e "${RED}Error: Failed to get project configuration${NC}"
        echo "$project_config"
        exit 1
    }

    # Extract log group name from configuration
    local log_group
    log_group=$(echo "$project_config" | jq -r '.projects[0].logsConfig.cloudWatchLogs.groupName // ""')

    if [[ -z "$log_group" ]] || [[ "$log_group" == "null" ]]; then
        # Fallback to default naming pattern if not specified
        log_group="/aws/codebuild/$project_name"
        echo -e "${YELLOW}No custom log group configured, using default: $log_group${NC}\n"
    else
        echo -e "${GREEN}✓ Using log group: ${CYAN}$log_group${NC}\n"
    fi

    # Tail CloudWatch logs
    aws logs tail "$log_group" \
        --region "$region" \
        --profile "$profile" \
        --follow \
        --format short
}

# View logs for a completed build
view_build_logs() {
    local build_id="$1"
    local profile="$2"
    local region="$3"

    # Check if output is being piped (not a TTY)
    local IS_PIPED=false
    if [ ! -t 1 ]; then
        IS_PIPED=true
    fi

    # Only show decorative output if not piped
    if [ "$IS_PIPED" = false ]; then
        echo -e "${BLUE}Fetching logs for build: ${YELLOW}$build_id${NC}"
        echo -e "${BLUE}Profile: ${YELLOW}$profile${NC}, Region: ${YELLOW}$region${NC}\n"
    fi

    # Get build details
    local build_details
    build_details=$(aws codebuild batch-get-builds \
        --ids "$build_id" \
        --region "$region" \
        --profile "$profile" \
        --output json 2>&1) || {
        echo -e "${RED}Error: Failed to get build details${NC}"
        echo "$build_details"
        exit 1
    }

    # Extract build information
    local build_status
    build_status=$(echo "$build_details" | jq -r '.builds[0].buildStatus // "UNKNOWN"')

    local start_time
    start_time=$(echo "$build_details" | jq -r '.builds[0].startTime // "N/A"')

    local end_time
    end_time=$(echo "$build_details" | jq -r '.builds[0].endTime // "N/A"')

    local source_version
    source_version=$(echo "$build_details" | jq -r '.builds[0].sourceVersion // "N/A"')

    local project_name
    project_name=$(echo "$build_details" | jq -r '.builds[0].projectName // "N/A"')

    local log_group
    log_group=$(echo "$build_details" | jq -r '.builds[0].logs.groupName // ""')

    local log_stream
    log_stream=$(echo "$build_details" | jq -r '.builds[0].logs.streamName // ""')

    # Display build summary only if not piped
    if [ "$IS_PIPED" = false ]; then
        echo -e "${CYAN}=== Build Summary ===${NC}"
        echo -e "Project:        ${YELLOW}$project_name${NC}"
        echo -e "Build ID:       ${YELLOW}$build_id${NC}"

        if [[ "$build_status" == "SUCCEEDED" ]]; then
            echo -e "Status:         ${GREEN}$build_status${NC}"
        elif [[ "$build_status" == "FAILED" ]]; then
            echo -e "Status:         ${RED}$build_status${NC}"
        else
            echo -e "Status:         ${YELLOW}$build_status${NC}"
        fi

        echo -e "Source Version: ${CYAN}$source_version${NC}"
        echo -e "Start Time:     $start_time"
        echo -e "End Time:       $end_time"
        echo -e ""
    fi

    # Check if logs are available
    if [[ -z "$log_group" ]] || [[ -z "$log_stream" ]]; then
        if [ "$IS_PIPED" = false ]; then
            echo -e "${YELLOW}No CloudWatch logs available for this build${NC}"
            echo -e "${YELLOW}The build may have failed during initialization or logs may have been deleted${NC}"
        fi
        exit 0
    fi

    # Show logs header only if not piped
    if [ "$IS_PIPED" = false ]; then
        echo -e "${CYAN}=== Build Logs ===${NC}\n"
    fi

    # Fetch and display logs
    aws logs get-log-events \
        --log-group-name "$log_group" \
        --log-stream-name "$log_stream" \
        --region "$region" \
        --profile "$profile" \
        --output text \
        --query 'events[*].[timestamp,message]' | \
    while IFS=$'\t' read -r timestamp message; do
        # Convert timestamp from milliseconds to readable format
        local datetime
        datetime=$(date -r $((timestamp / 1000)) '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "")

        if [ "$IS_PIPED" = true ]; then
            # Plain output when piped - no colors, no timestamp decoration
            echo "$message"
        else
            # Color code error messages when not piped
            if echo "$message" | grep -qi "error\|failed\|failure"; then
                echo -e "${RED}[$datetime] $message${NC}"
            elif echo "$message" | grep -qi "warning\|warn"; then
                echo -e "${YELLOW}[$datetime] $message${NC}"
            elif echo "$message" | grep -qi "success\|succeeded\|complete"; then
                echo -e "${GREEN}[$datetime] $message${NC}"
            else
                echo "[$datetime] $message"
            fi
        fi
    done

    # Show end of logs message only if not piped
    if [ "$IS_PIPED" = false ]; then
        echo -e "\n${CYAN}=== End of Logs ===${NC}"
        echo ""
        echo -e "${CYAN}💡 Tips:${NC}"
        echo -e "${GRAY}  • View build details: macpracs aws codebuild describe --build-id $build_id --profile $profile --region $region${NC}"
        echo -e "${GRAY}  • Filter logs: macpracs aws codebuild logs --build-id $build_id --grep 'ERROR' --profile $profile --region $region${NC}"
        echo -e "${GRAY}  • Copy to clipboard: add --copy flag to the command above${NC}"
    fi
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

# Retry a failed build
retry_build() {
    local project_name="$1"
    local build_id="$2"
    local profile="$3"
    local region="$4"

    echo -e "${BLUE}Retrying failed build${NC}"
    echo -e "${BLUE}Project: ${YELLOW}$project_name${NC}"
    echo -e "${BLUE}Build ID: ${YELLOW}$build_id${NC}"
    echo -e "${BLUE}Profile: ${YELLOW}$profile${NC}, Region: ${YELLOW}$region${NC}\n"

    # Get build details to extract source version
    echo -e "${CYAN}Fetching build details...${NC}"
    local build_details
    build_details=$(aws codebuild batch-get-builds \
        --ids "$build_id" \
        --region "$region" \
        --profile "$profile" \
        --output json 2>&1) || {
        echo -e "${RED}Error: Failed to get build details${NC}"
        echo "$build_details"
        exit 1
    }

    local source_version
    source_version=$(echo "$build_details" | jq -r '.builds[0].sourceVersion // "N/A"')

    if [[ "$source_version" == "N/A" ]] || [[ "$source_version" == "null" ]]; then
        echo -e "${YELLOW}Warning: Could not determine source version, starting build without it${NC}\n"
        # Start build without source version
        local new_build
        new_build=$(aws codebuild start-build \
            --project-name "$project_name" \
            --region "$region" \
            --profile "$profile" \
            --output json 2>&1) || {
            echo -e "${RED}Error: Failed to start build${NC}"
            echo "$new_build"
            exit 1
        }
    else
        echo -e "${GREEN}✓ Source version: ${CYAN}$source_version${NC}\n"

        # Start new build with same source version
        local new_build
        new_build=$(aws codebuild start-build \
            --project-name "$project_name" \
            --source-version "$source_version" \
            --region "$region" \
            --profile "$profile" \
            --output json 2>&1) || {
            echo -e "${RED}Error: Failed to start build${NC}"
            echo "$new_build"
            exit 1
        }
    fi

    local new_build_id
    new_build_id=$(echo "$new_build" | jq -r '.build.id')

    echo -e "${GREEN}✓ Build started successfully!${NC}"
    echo -e "${BLUE}New build ID: ${YELLOW}$new_build_id${NC}"
    echo -e "\n${CYAN}You can watch the build with:${NC}"
    echo -e "  $(basename "$0") build $project_name $profile $region"
}

# Retry a pipeline execution
retry_pipeline() {
    local pipeline_name="$1"
    local profile="$2"
    local region="$3"

    echo -e "${BLUE}Retrying pipeline execution${NC}"
    echo -e "${BLUE}Pipeline: ${YELLOW}$pipeline_name${NC}"
    echo -e "${BLUE}Profile: ${YELLOW}$profile${NC}, Region: ${YELLOW}$region${NC}\n"

    # Start new pipeline execution
    local execution
    execution=$(aws codepipeline start-pipeline-execution \
        --name "$pipeline_name" \
        --region "$region" \
        --profile "$profile" \
        --output json 2>&1) || {
        echo -e "${RED}Error: Failed to start pipeline execution${NC}"
        echo "$execution"
        exit 1
    }

    local execution_id
    execution_id=$(echo "$execution" | jq -r '.pipelineExecutionId')

    echo -e "${GREEN}✓ Pipeline execution started successfully!${NC}"
    echo -e "${BLUE}Execution ID: ${YELLOW}$execution_id${NC}"
    echo -e "\n${CYAN}You can watch the pipeline with:${NC}"
    echo -e "  $(basename "$0") pipeline $pipeline_name $profile $region"
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
        view-build-logs)
            if [[ $# -lt 1 ]]; then
                echo -e "${RED}Error: Build ID required${NC}"
                usage
            fi
            local build_id="$1"
            local profile="${2:-$DEFAULT_PROFILE}"
            local region="${3:-$DEFAULT_REGION}"
            view_build_logs "$build_id" "$profile" "$region"
            ;;
        retry-build)
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}Error: Project name and build ID required${NC}"
                usage
            fi
            local project_name="$1"
            local build_id="$2"
            local profile="${3:-$DEFAULT_PROFILE}"
            local region="${4:-$DEFAULT_REGION}"
            retry_build "$project_name" "$build_id" "$profile" "$region"
            ;;
        retry-pipeline)
            if [[ $# -lt 1 ]]; then
                echo -e "${RED}Error: Pipeline name required${NC}"
                usage
            fi
            local pipeline_name="$1"
            local profile="${2:-$DEFAULT_PROFILE}"
            local region="${3:-$DEFAULT_REGION}"
            retry_pipeline "$pipeline_name" "$profile" "$region"
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
