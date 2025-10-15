#!/usr/bin/env bash
#
# aws-ssm-rds.sh - Connect to RDS instances via AWS Systems Manager
#
# Usage:
#   ./aws-ssm-rds.sh connect <db-instance-identifier> [profile] [region]
#   ./aws-ssm-rds.sh list-instances [profile] [region]
#
# Examples:
#   ./aws-ssm-rds.sh connect my-postgres-db legacy-prod-power-user us-west-2
#   ./aws-ssm-rds.sh list-instances legacy-prod-power-user us-west-2

set -euo pipefail

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
DEFAULT_LOCAL_PORT="5432"

usage() {
    cat << EOF
Usage: $(basename "$0") <command> [arguments] [profile] [region]

Commands:
    terminal <instance-id>   Start basic SSM terminal session to EC2 instance
    connect <db-instance>    Start SSM port forwarding session to RDS instance
    list-instances          List all RDS instances in the region

Arguments:
    instance-id         EC2 instance ID (e.g., i-1234567890abcdef0)
    db-instance         RDS database instance identifier
    profile             AWS CLI profile (default: \$AWS_PROFILE or 'default')
    region              AWS region (default: us-east-1)

Examples:
    $(basename "$0") terminal i-0d99b352edeaf5f85 legacy-prod-uk-admin eu-west-2
    $(basename "$0") connect my-postgres-db legacy-prod-power-user us-west-2
    $(basename "$0") list-instances legacy-prod-power-user us-west-2

Environment:
    AWS_PROFILE         Default AWS profile to use
    LOCAL_PORT          Local port for port forwarding (default: 5432)

Note:
    This script requires the AWS Session Manager plugin to be installed.
    Install from: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html
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

    # Check for Session Manager plugin
    if ! aws --version 2>&1 | grep -q "session-manager-plugin" || ! command -v session-manager-plugin &> /dev/null; then
        echo -e "${YELLOW}Warning: AWS Session Manager plugin may not be installed${NC}"
        echo -e "${YELLOW}Install from: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html${NC}"
    fi
}

# List all RDS instances
list_instances() {
    local profile="$1"
    local region="$2"

    echo -e "${BLUE}Listing all RDS instances in ${YELLOW}$region${NC}\n"

    aws rds describe-db-instances \
        --region "$region" \
        --profile "$profile" \
        --output table \
        --query 'DBInstances[*].[DBInstanceIdentifier,Engine,DBInstanceStatus,Endpoint.Address,Endpoint.Port]'
}

# Get RDS instance endpoint details
get_rds_endpoint() {
    local instance="$1"
    local profile="$2"
    local region="$3"

    local endpoint_data
    endpoint_data=$(aws rds describe-db-instances \
        --db-instance-identifier "$instance" \
        --region "$region" \
        --profile "$profile" \
        --output json 2>&1) || {
        echo -e "${RED}Error: Failed to describe RDS instance${NC}"
        echo "$endpoint_data"
        exit 1
    }

    local endpoint
    endpoint=$(echo "$endpoint_data" | jq -r '.DBInstances[0].Endpoint.Address')

    local port
    port=$(echo "$endpoint_data" | jq -r '.DBInstances[0].Endpoint.Port')

    local engine
    engine=$(echo "$endpoint_data" | jq -r '.DBInstances[0].Engine')

    if [[ "$endpoint" == "null" ]] || [[ -z "$endpoint" ]]; then
        echo -e "${RED}Error: Could not retrieve endpoint for instance ${YELLOW}$instance${NC}"
        exit 1
    fi

    echo "$endpoint:$port:$engine"
}

# Start basic SSM terminal session to EC2 instance
start_terminal_session() {
    local instance_id="$1"
    local profile="$2"
    local region="$3"

    echo -e "${BLUE}Starting SSM terminal session to instance: ${YELLOW}$instance_id${NC}"
    echo -e "${BLUE}Profile: ${YELLOW}$profile${NC}, Region: ${YELLOW}$region${NC}\n"
    echo -e "${GREEN}Connecting to terminal...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to terminate the session${NC}\n"

    aws ssm start-session \
        --target "$instance_id" \
        --region "$region" \
        --profile "$profile" || {
        echo -e "\n${RED}Error: Failed to start SSM session${NC}"
        echo -e "${YELLOW}Possible issues:${NC}"
        echo -e "  - SSM Session Manager plugin not installed"
        echo -e "  - Instance $instance_id doesn't have proper IAM role"
        echo -e "  - Instance is not running or not SSM-enabled"
        exit 1
    }
}

# Connect to RDS instance via SSM port forwarding
connect_to_rds() {
    local instance="$1"
    local profile="$2"
    local region="$3"
    local local_port="${LOCAL_PORT:-$DEFAULT_LOCAL_PORT}"

    echo -e "${BLUE}Connecting to RDS instance: ${YELLOW}$instance${NC}"
    echo -e "${BLUE}Profile: ${YELLOW}$profile${NC}, Region: ${YELLOW}$region${NC}\n"

    # Get RDS endpoint details
    echo -e "${CYAN}Fetching RDS endpoint details...${NC}"
    local endpoint_info
    endpoint_info=$(get_rds_endpoint "$instance" "$profile" "$region")

    local endpoint
    endpoint=$(echo "$endpoint_info" | cut -d: -f1)

    local remote_port
    remote_port=$(echo "$endpoint_info" | cut -d: -f2)

    local engine
    engine=$(echo "$endpoint_info" | cut -d: -f3)

    echo -e "${GREEN}✓ Found endpoint: ${CYAN}$endpoint:$remote_port${NC} (Engine: ${CYAN}$engine${NC})\n"

    # Get the VPC and find an appropriate bastion/EC2 instance with SSM
    echo -e "${CYAN}Looking for SSM-enabled EC2 instance to use as bastion...${NC}"

    local instance_id
    instance_id=$(aws ec2 describe-instances \
        --region "$region" \
        --profile "$profile" \
        --filters "Name=instance-state-name,Values=running" \
        --query 'Reservations[*].Instances[?Tags[?Key==`Name` && contains(Value, `bastion`)]] | [0][0].InstanceId' \
        --output text 2>&1)

    if [[ "$instance_id" == "None" ]] || [[ -z "$instance_id" ]] || [[ "$instance_id" == "null" ]]; then
        echo -e "${YELLOW}Warning: No bastion instance found. Attempting to find any SSM-managed instance...${NC}"

        # Try to get any running instance with SSM
        instance_id=$(aws ssm describe-instance-information \
            --region "$region" \
            --profile "$profile" \
            --filters "Key=PingStatus,Values=Online" \
            --query 'InstanceInformationList[0].InstanceId' \
            --output text 2>&1)
    fi

    if [[ "$instance_id" == "None" ]] || [[ -z "$instance_id" ]] || [[ "$instance_id" == "null" ]]; then
        echo -e "${RED}Error: No SSM-enabled EC2 instances found in region ${YELLOW}$region${NC}"
        echo -e "${YELLOW}Please ensure you have an EC2 instance with SSM agent running${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Using instance: ${CYAN}$instance_id${NC}\n"

    # Start port forwarding session
    echo -e "${BLUE}Starting SSM port forwarding session...${NC}"
    echo -e "${CYAN}Local port: ${YELLOW}$local_port${NC} → Remote: ${YELLOW}$endpoint:$remote_port${NC}\n"
    echo -e "${GREEN}Connection established! You can now connect to:${NC}"
    echo -e "  ${CYAN}Host:${NC} localhost"
    echo -e "  ${CYAN}Port:${NC} $local_port\n"
    echo -e "${YELLOW}Press Ctrl+C to terminate the session${NC}\n"

    aws ssm start-session \
        --target "$instance_id" \
        --document-name AWS-StartPortForwardingSessionToRemoteHost \
        --parameters "{\"host\":[\"$endpoint\"],\"portNumber\":[\"$remote_port\"],\"localPortNumber\":[\"$local_port\"]}" \
        --region "$region" \
        --profile "$profile" || {
        echo -e "\n${RED}Error: Failed to start SSM session${NC}"
        echo -e "${YELLOW}Possible issues:${NC}"
        echo -e "  - SSM Session Manager plugin not installed"
        echo -e "  - Instance $instance_id doesn't have proper IAM role"
        echo -e "  - Security groups don't allow connection to RDS"
        echo -e "  - RDS endpoint is not accessible from the EC2 instance"
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
        terminal)
            if [[ $# -lt 1 ]]; then
                echo -e "${RED}Error: EC2 instance ID required${NC}"
                usage
            fi
            local instance_id="$1"
            local profile="${2:-$DEFAULT_PROFILE}"
            local region="${3:-$DEFAULT_REGION}"
            start_terminal_session "$instance_id" "$profile" "$region"
            ;;
        connect)
            if [[ $# -lt 1 ]]; then
                echo -e "${RED}Error: DB instance identifier required${NC}"
                usage
            fi
            local instance="$1"
            local profile="${2:-$DEFAULT_PROFILE}"
            local region="${3:-$DEFAULT_REGION}"
            connect_to_rds "$instance" "$profile" "$region"
            ;;
        list-instances)
            local profile="${1:-$DEFAULT_PROFILE}"
            local region="${2:-$DEFAULT_REGION}"
            list_instances "$profile" "$region"
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
