#!/usr/bin/env bash
#
# aws-ecs-tasks.sh - Monitor AWS ECS task status
#
# Usage:
#   ./aws-ecs-tasks.sh tasks <cluster> <service> [profile] [region]
#   ./aws-ecs-tasks.sh list-clusters [profile] [region]
#   ./aws-ecs-tasks.sh list-services <cluster> [profile] [region]
#
# Examples:
#   ./aws-ecs-tasks.sh tasks staging webhook-consumer-calllog-staging legacy-prod-power-user us-west-2
#   ./aws-ecs-tasks.sh list-clusters legacy-prod-power-user us-west-2
#   ./aws-ecs-tasks.sh list-services staging legacy-prod-power-user us-west-2

set -euo pipefail

# Source timestamp formatting utility
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/format-timestamp.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
DEFAULT_REGION="us-east-1"
DEFAULT_PROFILE="${AWS_PROFILE:-default}"
REFRESH_INTERVAL=10

usage() {
    cat << EOF
Usage: $(basename "$0") <command> [arguments] [profile] [region]

Commands:
    tasks <cluster> <service>    Watch ECS task status with timestamps
    logs <cluster> <service>     Tail CloudWatch logs for ECS service
    list-clusters                List all ECS clusters in the region
    list-services <cluster>      List all services in a cluster

Arguments:
    cluster             ECS cluster name
    service             ECS service name
    profile             AWS CLI profile (default: \$AWS_PROFILE or 'default')
    region              AWS region (default: us-east-1)

Examples:
    $(basename "$0") tasks staging webhook-consumer-calllog-staging legacy-prod-power-user us-west-2
    $(basename "$0") logs production webhook-consumer-calllog-production-uk legacy-prod-uk-admin eu-west-2
    $(basename "$0") list-clusters legacy-prod-power-user us-west-2
    $(basename "$0") list-services staging

Environment:
    AWS_PROFILE         Default AWS profile to use
    REFRESH_INTERVAL    Seconds between refreshes (default: 10)
EOF
    exit 1
}

# Check if required commands exist
check_dependencies() {
    local deps=("aws" "jq" "date")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            echo -e "${RED}Error: Required command '$dep' not found${NC}"
            exit 1
        fi
    done
}

# Watch ECS tasks
watch_tasks() {
    local cluster="$1"
    local service="$2"
    local profile="$3"
    local region="$4"

    echo -e "${BLUE}Watching ECS tasks in service: ${YELLOW}$service${NC}"
    echo -e "${BLUE}Cluster: ${YELLOW}$cluster${NC}, Profile: ${YELLOW}$profile${NC}, Region: ${YELLOW}$region${NC}"
    echo -e "${BLUE}Refreshing every $REFRESH_INTERVAL seconds (Ctrl+C to exit)${NC}\n"

    while true; do
        clear
        echo -e "${BLUE}=== ECS Task Status: $(date '+%Y-%m-%d %H:%M:%S %Z') ===${NC}\n"

        # Get task ARNs for the service
        local task_arns
        task_arns=$(aws ecs list-tasks \
            --cluster "$cluster" \
            --service-name "$service" \
            --region "$region" \
            --profile "$profile" \
            --output json 2>&1) || {
            echo -e "${RED}Error: Failed to list tasks${NC}"
            echo "$task_arns"
            exit 1
        }

        local arns
        arns=$(echo "$task_arns" | jq -r '.taskArns[]' 2>/dev/null)

        if [[ -z "$arns" ]]; then
            echo -e "${YELLOW}No tasks found for service${NC}"
        else
            # Get detailed task information
            local task_details
            task_details=$(aws ecs describe-tasks \
                --cluster "$cluster" \
                --tasks $arns \
                --region "$region" \
                --profile "$profile" \
                --output json 2>&1) || {
                echo -e "${RED}Error: Failed to describe tasks${NC}"
                exit 1
            }

            # Parse and display task information
            echo "$task_details" | jq -r '.tasks[] |
                @json' | while IFS= read -r task_json; do

                local task_id
                task_id=$(echo "$task_json" | jq -r '.taskArn | split("/") | .[-1]')

                local last_status
                last_status=$(echo "$task_json" | jq -r '.lastStatus')

                local desired_status
                desired_status=$(echo "$task_json" | jq -r '.desiredStatus')

                local created_at
                created_at=$(echo "$task_json" | jq -r '.createdAt')

                local started_at
                started_at=$(echo "$task_json" | jq -r '.startedAt // "N/A"')

                local health_status
                health_status=$(echo "$task_json" | jq -r '.healthStatus // "N/A"')

                # Format status with color and emoji
                local status_line
                local status_color="$NC"
                if [[ "$last_status" == "RUNNING" ]]; then
                    status_line="$last_status ✅"
                    status_color="$GREEN"
                elif [[ "$last_status" == "PENDING" ]]; then
                    status_line="$last_status ⏳"
                    status_color="$YELLOW"
                elif [[ "$last_status" == "STOPPED" ]]; then
                    status_line="$last_status ❌"
                    status_color="$RED"
                else
                    status_line="$last_status"
                fi

                echo -e "${CYAN}Task: ${NC}$task_id ${status_color}($status_line)${NC}"
                echo -e "  ${BLUE}Created:${NC}  $(format_timestamp "$created_at")"

                if [[ "$started_at" != "N/A" ]] && [[ "$started_at" != "null" ]]; then
                    echo -e "  ${BLUE}Started:${NC}  $(format_timestamp "$started_at")"
                fi

                if [[ "$health_status" != "N/A" ]]; then
                    local health_color="$NC"
                    if [[ "$health_status" == "HEALTHY" ]]; then
                        health_color="$GREEN"
                    elif [[ "$health_status" == "UNHEALTHY" ]]; then
                        health_color="$RED"
                    fi
                    echo -e "  ${BLUE}Health:${NC}   ${health_color}$health_status${NC}"
                fi

                # Show container statuses
                echo "$task_json" | jq -r '.containers[] |
                    "  \(.name): \(.lastStatus)"' | while IFS=: read -r name status; do
                    local container_color="$NC"
                    if [[ "$status" =~ RUNNING ]]; then
                        container_color="$GREEN"
                    elif [[ "$status" =~ PENDING ]]; then
                        container_color="$YELLOW"
                    elif [[ "$status" =~ STOPPED ]]; then
                        container_color="$RED"
                    fi
                    echo -e "  ${BLUE}Container:${NC} ${container_color}$name:$status${NC}"
                done

                echo ""
            done
        fi

        echo -e "${BLUE}Next refresh in $REFRESH_INTERVAL seconds...${NC}"
        sleep "$REFRESH_INTERVAL"
    done
}

# List all clusters
list_clusters() {
    local profile="$1"
    local region="$2"

    echo -e "${BLUE}Listing all ECS clusters in ${YELLOW}$region${NC}\n"

    aws ecs list-clusters \
        --region "$region" \
        --profile "$profile" \
        --output table
}

# List all services in a cluster
list_services() {
    local cluster="$1"
    local profile="$2"
    local region="$3"

    echo -e "${BLUE}Listing all services in cluster ${YELLOW}$cluster${NC}\n"

    aws ecs list-services \
        --cluster "$cluster" \
        --region "$region" \
        --profile "$profile" \
        --output table
}

# Tail CloudWatch logs for an ECS service
tail_logs() {
    local cluster="$1"
    local service="$2"
    local profile="$3"
    local region="$4"

    # Derive log group from service name
    # Pattern: /ecs/{service-name}
    local log_group="/ecs/$service"

    echo -e "${BLUE}Tailing logs for service: ${YELLOW}$service${NC}"
    echo -e "${BLUE}Cluster: ${YELLOW}$cluster${NC}, Profile: ${YELLOW}$profile${NC}, Region: ${YELLOW}$region${NC}"
    echo -e "${BLUE}Log Group: ${YELLOW}$log_group${NC}"
    echo -e "${BLUE}Press Ctrl+C to exit${NC}\n"

    # Use aws logs tail for real-time streaming
    aws logs tail "$log_group" \
        --follow \
        --format short \
        --region "$region" \
        --profile "$profile" \
        --color on \
        2>&1 || {
        echo -e "\n${RED}Error: Failed to tail logs${NC}"
        echo -e "${YELLOW}Hint: Check that log group '${log_group}' exists in ${region}${NC}"
        exit 1
    }
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
        tasks)
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}Error: Cluster and service names required${NC}"
                usage
            fi
            local cluster="$1"
            local service="$2"
            local profile="${3:-$DEFAULT_PROFILE}"
            local region="${4:-$DEFAULT_REGION}"
            watch_tasks "$cluster" "$service" "$profile" "$region"
            ;;
        logs)
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}Error: Cluster and service names required${NC}"
                usage
            fi
            local cluster="$1"
            local service="$2"
            local profile="${3:-$DEFAULT_PROFILE}"
            local region="${4:-$DEFAULT_REGION}"
            tail_logs "$cluster" "$service" "$profile" "$region"
            ;;
        list-clusters)
            local profile="${1:-$DEFAULT_PROFILE}"
            local region="${2:-$DEFAULT_REGION}"
            list_clusters "$profile" "$region"
            ;;
        list-services)
            if [[ $# -lt 1 ]]; then
                echo -e "${RED}Error: Cluster name required${NC}"
                usage
            fi
            local cluster="$1"
            local profile="${2:-$DEFAULT_PROFILE}"
            local region="${3:-$DEFAULT_REGION}"
            list_services "$cluster" "$profile" "$region"
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
