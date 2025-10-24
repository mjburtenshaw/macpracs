# Scripts

Bash scripts for AWS operations and utilities, designed to be called by the macpracs CLI or used standalone.

## AWS Scripts

### aws-pipeline-watch.sh

Monitor and manage AWS CodePipeline and CodeBuild resources.

**Requirements:**
- AWS CLI
- jq (JSON processor)
- Valid AWS credentials

**Commands:**

```bash
# Watch a pipeline execution in real-time
./aws-pipeline-watch.sh pipeline <pipeline-name> [profile] [region]

# Watch a CodeBuild project
./aws-pipeline-watch.sh build <project-name> [profile] [region]

# Stream CodeBuild logs
./aws-pipeline-watch.sh logs <project-name> [profile] [region]

# Retry a failed CodeBuild job
./aws-pipeline-watch.sh retry-build <project-name> <build-id> [profile] [region]

# Retry a pipeline execution
./aws-pipeline-watch.sh retry-pipeline <pipeline-name> [profile] [region]

# List all pipelines in region
./aws-pipeline-watch.sh list-pipelines [profile] [region]

# List all build projects in region
./aws-pipeline-watch.sh list-builds [profile] [region]
```

**Examples:**

```bash
# Watch a pipeline with default profile
./aws-pipeline-watch.sh pipeline my-pipeline default us-east-1

# Retry a pipeline execution (starts a new execution)
./aws-pipeline-watch.sh retry-pipeline my-pipeline my-profile us-east-1

# Retry a failed build (only manually-triggered builds)
./aws-pipeline-watch.sh retry-build my-project my-project:abc123 my-profile us-west-2

# List all pipelines in a region
./aws-pipeline-watch.sh list-pipelines my-profile eu-west-1
```

**Notes:**
- Pipeline and build names are fetched automatically by the CLI wizard
- **Retry Pipeline**: Starts a new pipeline execution from the beginning (all stages)
- **Retry Build**: Only works for manually-triggered builds. Builds triggered by CodePipeline must be retried by retrying the pipeline itself
- Watch commands refresh every 10 seconds (configurable via REFRESH_INTERVAL env var)

---

### aws-ecs-tasks.sh

Monitor and manage AWS ECS clusters and services.

**Requirements:**
- AWS CLI
- jq (JSON processor)
- Valid AWS credentials

**Commands:**

```bash
# Watch ECS task status
./aws-ecs-tasks.sh tasks <cluster-name> <service-name> [profile] [region]

# Tail ECS service logs
./aws-ecs-tasks.sh logs <cluster-name> <service-name> [profile] [region]

# List all clusters in region
./aws-ecs-tasks.sh list-clusters [profile] [region]

# List all services in a cluster
./aws-ecs-tasks.sh list-services <cluster-name> [profile] [region]
```

**Examples:**

```bash
# Watch task status for a service
./aws-ecs-tasks.sh tasks my-cluster my-service default us-east-1

# Tail logs from a service
./aws-ecs-tasks.sh logs my-cluster my-service my-profile us-west-2

# List all clusters
./aws-ecs-tasks.sh list-clusters my-profile eu-west-1
```

**Notes:**
- Task watching shows running/pending/stopped task counts
- Log tailing requires CloudWatch Logs to be configured for the service
- Uses `aws logs tail` for real-time log streaming

---

### aws-ssm-rds.sh

Connect to EC2 instances and RDS databases via AWS Systems Manager.

**Requirements:**
- AWS CLI
- jq (JSON processor)
- AWS Session Manager plugin ([installation guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html))
- Valid AWS credentials

**Commands:**

```bash
# Start an SSM terminal session to EC2 instance
./aws-ssm-rds.sh terminal <instance-id> [profile] [region]

# Connect to RDS instance via port forwarding
./aws-ssm-rds.sh connect <db-instance-identifier> [profile] [region]

# List all RDS instances in region
./aws-ssm-rds.sh list-instances [profile] [region]
```

**Examples:**

```bash
# Start terminal session to EC2 instance
./aws-ssm-rds.sh terminal i-0d99b352edeaf5f85 my-profile eu-west-2

# Connect to RDS instance (opens port 5432 locally)
./aws-ssm-rds.sh connect my-postgres-db my-profile us-west-2

# List all RDS instances
./aws-ssm-rds.sh list-instances my-profile us-east-1
```

**Notes:**
- Terminal sessions require the EC2 instance to have SSM agent installed and proper IAM role
- RDS connections automatically find a bastion/SSM-enabled instance to use for port forwarding
- Default local port is 5432 (configurable via LOCAL_PORT env var)
- RDS connections remain open until you press Ctrl+C

**Port Forwarding:**

When connecting to RDS, the script:
1. Finds the RDS endpoint and port
2. Locates an SSM-enabled EC2 instance (preferably named "bastion")
3. Creates a port forwarding tunnel: `localhost:5432` → `rds-endpoint:5432`
4. You can then connect using your database client to `localhost:5432`

---

## Utility Scripts

### timestamp-util.sh

Check and update task execution timestamps for automation and scheduling.

**Commands:**

```bash
# Check if enough time has passed since last execution
./timestamp-util.sh check <task-name> <interval-hours>

# Update timestamp for a task (marks as executed now)
./timestamp-util.sh update <task-name>
```

**Examples:**

```bash
# Check if backup task should run (every 24 hours)
if ./timestamp-util.sh check backup 24; then
  echo "Running backup..."
  ./run-backup.sh
  ./timestamp-util.sh update backup
fi

# Check if sync should run (every 6 hours)
./timestamp-util.sh check sync 6 && ./sync-data.sh && ./timestamp-util.sh update sync
```

**Notes:**
- Timestamps are stored in `${XDG_DATA_HOME:-$HOME/.local/share}/macpracs/timestamps/`
- Returns exit code 0 if interval has elapsed (task should run)
- Returns exit code 1 if interval has not elapsed (task should skip)
- Useful for cron jobs or startup procedures that should run periodically

---

## Environment Variables

All scripts respect these environment variables:

- `AWS_PROFILE` - Default AWS profile to use
- `AWS_REGION` - Default AWS region (defaults to us-east-1)
- `REFRESH_INTERVAL` - Seconds between refreshes for watch commands (default: 10)
- `LOCAL_PORT` - Local port for RDS port forwarding (default: 5432)

## Exit Codes

All scripts follow standard UNIX conventions:
- `0` - Success
- `1` - General error
- Script-specific error codes documented in each script's header

## Error Handling

All scripts use `set -euo pipefail` for strict error handling:
- `-e` - Exit on any command failure
- `-u` - Exit on undefined variable reference
- `-o pipefail` - Exit on pipe command failure

This ensures scripts fail fast and don't continue with invalid state.

## Color Output

Scripts use ANSI color codes for better readability:
- 🔵 Blue - Informational messages
- 🟢 Green - Success messages
- 🟡 Yellow - Warnings
- 🔴 Red - Errors
- 🔷 Cyan - Highlighted values

## Integration with macpracs CLI

These scripts are designed to be called by the `macpracs` CLI wizard, which provides:
- Interactive resource selection (no need to remember resource names)
- AWS profile and region selection
- SSO authentication handling
- Better error messages and user guidance

For automation and scripting, use the bash scripts directly.
For interactive use, use `macpracs` command.
