# macpracs CLI

Personal engineering practices command-line tool following UNIX philosophy.

## Implementation Status

✅ **Completed:**
- TypeScript project foundation with Commander and Inquirer
- Core utilities (logger, exec, config management)
- Interactive wizard system with hierarchical menus
- AWS operations wizard with service-based navigation
  - CodePipeline operations (watch, retry, list)
  - CodeBuild operations (watch, stream logs, retry failed builds, list)
  - ECS operations (watch tasks, tail logs, list clusters/services)
  - SSM operations (terminal sessions, RDS port forwarding, list instances)
- Testing infrastructure with Vitest
- Development tooling with tsx

🚧 **Coming Soon:**
- Git workflow commands (branch creation, management)
- Timestamp utilities (check, update)
- Procedure automation (startup, shutdown)

## Installation

```bash
cd ~/github.com/mjburtenshaw/macpracs/cli
npm install
npm link
```

This will install the `macpracs` command globally. No build step required - the CLI runs TypeScript directly using `tsx`!

## Usage

### Interactive Mode (Recommended)

Run `macpracs` with no arguments to launch the interactive wizard:

```bash
macpracs
```

The wizard provides guided access to all features organized by service:

**AWS Operations:**
- **CodePipeline**: Watch executions, retry pipelines, list all pipelines
- **CodeBuild**: Watch builds, stream logs, retry failed builds, list projects
- **ECS**: Watch task status, tail service logs, list clusters/services
- **SSM**: Start terminal sessions, connect to RDS via port forwarding, list instances

**Messaging Operations:**
- Send/receive messages from RabbitMQ or AWS SQS

**Coming Soon:**
- Git workflows
- Timestamp utilities
- Automated procedures

### Direct Commands

For scripting or automation, commands can also be called directly:

```bash
# CodePipeline & CodeBuild
macpracs aws pipeline-watch-pipeline <name> [-p profile] [-r region]
macpracs aws pipeline-watch-build <name> [-p profile] [-r region]
macpracs aws pipeline-watch-logs <name> [-p profile] [-r region]
macpracs aws retry-build <project-name> <build-id> [-p profile] [-r region]
macpracs aws retry-pipeline <name> [-p profile] [-r region]
macpracs aws list-pipelines [-p profile] [-r region]
macpracs aws list-builds [-p profile] [-r region]

# ECS
macpracs aws ecs-tasks <cluster> <service> [-p profile] [-r region]
macpracs aws ecs-logs <cluster> <service> [-p profile] [-r region]
macpracs aws list-ecs-clusters [-p profile] [-r region]
macpracs aws list-ecs-services <cluster> [-p profile] [-r region]
```

### Bash Scripts for Automation

The CLI uses bash scripts under the hood for AWS operations. These can be called directly for scripting:

```bash
# CodePipeline & CodeBuild operations
scripts/aws-pipeline-watch.sh pipeline <name> <profile> <region>
scripts/aws-pipeline-watch.sh build <name> <profile> <region>
scripts/aws-pipeline-watch.sh logs <name> <profile> <region>
scripts/aws-pipeline-watch.sh retry-build <project> <build-id> <profile> <region>
scripts/aws-pipeline-watch.sh retry-pipeline <name> <profile> <region>
scripts/aws-pipeline-watch.sh list-pipelines <profile> <region>
scripts/aws-pipeline-watch.sh list-builds <profile> <region>

# ECS operations
scripts/aws-ecs-tasks.sh tasks <cluster> <service> <profile> <region>
scripts/aws-ecs-tasks.sh logs <cluster> <service> <profile> <region>
scripts/aws-ecs-tasks.sh list-clusters <profile> <region>
scripts/aws-ecs-tasks.sh list-services <cluster> <profile> <region>

# SSM operations
scripts/aws-ssm-rds.sh terminal <instance-id> <profile> <region>
scripts/aws-ssm-rds.sh connect <db-instance> <profile> <region>
scripts/aws-ssm-rds.sh list-instances <profile> <region>
```

### Global Options

- `--verbose` - Show detailed output
- `--quiet` - Suppress all output (except errors)
- `--json` - Output in JSON format for scripting
- `--config <path>` - Use alternate config file
- `-h, --help` - Show help
- `-v, --version` - Show version

## UNIX Philosophy

This CLI follows UNIX principles:

- **Silent on success**: Commands produce no output unless `--verbose` is used
- **Verbose on failure**: Errors are always shown (unless `--quiet`)
- **Chainable**: Commands work in pipes and respect exit codes
- **Exit codes**: 0 for success, non-zero for failure

### Example: Piping

```bash
# List all pipelines in JSON format
macpracs aws list-pipelines --json | jq '.pipelines'

# Chain with other commands (when timestamp commands are implemented)
macpracs timestamp check backup 24 && macpracs startup
```

## Configuration

User preferences are stored in `${XDG_CONFIG_HOME:-$HOME/.config}/macpracs/config.json`:

```json
{
  "aws": {
    "defaultProfile": "my-profile",
    "defaultRegion": "us-east-1"
  },
  "git": {
    "defaultDonorBranch": "main",
    "branchPrefix": "mjb/"
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode (direct execution, no build needed)
npm run dev

# Type checking (optional, for catching type errors)
npm run typecheck

# Lint
npm run lint

# Test (uses Vitest)
npm test           # Run tests once
npm run test:watch # Run tests in watch mode
```

**No build step required!** The CLI uses `tsx` to run TypeScript directly, so your changes take effect immediately.

### Testing

This project uses [Vitest](https://vitest.dev/) for testing. Vitest is a blazing fast test runner with:
- Native TypeScript support
- Compatible with Jest API
- Watch mode with hot module reload
- Built-in code coverage

Example test structure:
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('MyFeature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

## Project Structure

```
cli/
├── src/
│   ├── commands/              # Command implementations (legacy, being phased out)
│   ├── lib/                  # ✅ Shared utilities
│   │   ├── aws.ts            # AWS resource listing functions
│   │   ├── exec.ts           # Execute bash scripts
│   │   ├── logger.ts         # UNIX-style logging
│   │   ├── config.ts         # Configuration management
│   │   ├── types.ts          # TypeScript types
│   │   └── index.ts
│   ├── wizards/              # ✅ Interactive wizards (primary interface)
│   │   ├── main-wizard.ts    # Main menu with category selection
│   │   ├── aws-wizard.ts     # AWS operations with service submenus
│   │   ├── mq-wizard.ts      # Messaging operations
│   │   └── index.ts
│   └── index.ts              # CLI entry point
├── bin/
│   └── macpracs              # Shell script that runs tsx
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

**Bash Scripts** (called by wizards):
```
scripts/
├── aws-pipeline-watch.sh     # CodePipeline & CodeBuild operations
├── aws-ecs-tasks.sh          # ECS cluster and service operations
├── aws-ssm-rds.sh            # SSM terminal sessions and RDS connections
└── timestamp-util.sh         # Timestamp checking (standalone utility)
```

## Adding New Features

The CLI uses an interactive wizard architecture. To add new features:

### 1. Add Menu Options

Update the appropriate wizard file in `src/wizards/`:

```typescript
// src/wizards/aws-wizard.ts
const { operation } = await inquirer.prompt([
  {
    type: 'list',
    name: 'operation',
    message: 'What would you like to do?',
    choices: [
      {
        name: '🆕 My new feature',
        value: 'my-feature',
      },
      // ... other options
    ],
  },
]);
```

### 2. Add TypeScript Helper Functions (if needed)

For operations requiring AWS API calls or complex logic:

```typescript
// src/lib/aws.ts
export async function listMyResources(
  profile: string,
  region: string
): Promise<string[]> {
  const cmd = `aws my-service list-resources --region ${region} --profile ${profile} --output json`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  return JSON.parse(output).resources;
}
```

### 3. Create or Update Bash Scripts

For operations that need to run continuously or interact with AWS:

```bash
# scripts/my-script.sh
#!/usr/bin/env bash
set -euo pipefail

# Add your implementation here
```

### 4. Wire Up in executeAWSOperation

Connect the menu choice to the script execution in the wizard file.

## License

MIT
