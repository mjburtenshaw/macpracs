# macpracs CLI

Personal engineering practices command-line tool following UNIX philosophy.

## Implementation Status

✅ **Completed:**
- TypeScript project foundation with Commander and Inquirer
- Core utilities (logger, exec, config management)
- Interactive wizard system
- AWS pipeline-watch commands (pipeline, build, logs, list)
- AWS operations wizard
- Testing infrastructure with Vitest
- Development tooling with tsx

🚧 **Coming Soon:**
- Git workflow commands (branch creation, management)
- Timestamp utilities (check, update)
- Procedure automation (startup, shutdown)

## Installation

```bash
cd ~/code/github.com/mjburtenshaw/macpracs/cli
npm install
npm link
```

This will install the `macpracs` command globally. No build step required - the CLI runs TypeScript directly using `tsx`!

## Usage

### Interactive Mode

Run `macpracs` with no arguments to launch the interactive wizard:

```bash
macpracs
```

### Direct Commands

```bash
# AWS Operations (✅ Implemented)
macpracs aws pipeline-watch-pipeline <name> [options]
macpracs aws pipeline-watch-build <name> [options]
macpracs aws pipeline-watch-logs <name> [options]
macpracs aws list-pipelines [options]
macpracs aws list-builds [options]

# Git Workflows (🚧 Coming soon)
macpracs git branch create <name>

# Timestamp Utilities (🚧 Coming soon)
macpracs timestamp check <task> <hours>
macpracs timestamp update <task>

# Procedures (🚧 Coming soon)
macpracs startup [--interactive]
macpracs shutdown [--interactive]
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

User preferences are stored in `~/.macpracs/config.json`:

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
│   ├── commands/              # Command implementations
│   │   ├── aws/              # ✅ AWS utilities
│   │   │   ├── pipeline-watch.ts
│   │   │   └── index.ts
│   │   ├── git/              # 🚧 Git workflows (coming soon)
│   │   ├── procedures/       # 🚧 Procedure automation (coming soon)
│   │   ├── timestamp.ts      # 🚧 Timestamp utilities (coming soon)
│   │   └── index.ts
│   ├── lib/                  # ✅ Shared utilities
│   │   ├── exec.ts           # Execute bash scripts
│   │   ├── logger.ts         # UNIX-style logging
│   │   ├── config.ts         # Configuration management
│   │   ├── types.ts          # TypeScript types
│   │   └── index.ts
│   ├── wizards/              # ✅ Interactive wizards
│   │   ├── main-wizard.ts
│   │   ├── aws-wizard.ts
│   │   └── index.ts
│   └── index.ts              # CLI entry point
├── bin/
│   └── macpracs              # Shell script that runs tsx
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Adding New Commands

1. Create command file in `src/commands/<category>/`
2. Export registration function that adds to Commander
3. Import and call registration in `src/index.ts`
4. Create corresponding wizard in `src/wizards/` (optional)

Example:

```typescript
// src/commands/example/my-command.ts
import { Command } from 'commander';
import { createLogger } from '../../lib';

export function registerMyCommand(program: Command): void {
  program
    .command('my-command')
    .description('Does something useful')
    .action(async (options) => {
      const logger = createLogger(options.verbose, options.quiet);
      // Implementation here
    });
}
```

## License

MIT
