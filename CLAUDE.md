# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a personal engineering practices repository containing policies, procedures, tools, and system configurations used by mjburtenshaw. The repository follows a structured documentation approach with clear navigation between sections.

## Repository Structure

- `policies/` - Engineering and community management policies
- `procedures/` - Daily workflow procedures (startup, development, peer review, etc.)
- `tools/` - Shell configurations, utilities, and development tools
- `systems.md` - Systems thinking framework (5 P's: People, Policies, Procedures, Platforms, Philosophy)

## Key Tools and Utilities

### Shell Configuration
- Primary shell configuration in `tools/.zshrc`
- Modular zsh configs in `tools/.zsh-configs/` for different tools (homebrew, postgresql, terraform, etc.)
- Python3 alias configuration in `tools/aliases.sh` to manage Homebrew vs system Python
- Migration handler in `tools/.zsh-configs/macpracs-migration.config.zsh` for XDG structure migrations

### Timestamp Utility
- `tools/timestamp-util.sh` - Utility for managing script execution intervals
- Usage: `timestamp_util.sh check <task_name> <interval_hours>` or `timestamp_util.sh update <task_name>`
- Stores timestamps in `${XDG_DATA_HOME:-$HOME/.local/share}/macpracs/timestamps/`

### XDG Base Directory Structure
macpracs follows the XDG Base Directory Specification (https://specifications.freedesktop.org/basedir-spec/latest/):
- `${XDG_CONFIG_HOME:-$HOME/.config}/macpracs/` - Configuration files (config.json, contexts/)
- `${XDG_DATA_HOME:-$HOME/.local/share}/macpracs/` - Application data (timestamps/)
- `${XDG_STATE_HOME:-$HOME/.local/state}/macpracs/` - Logs and state data

This structure is automatically migrated from the legacy `~/.macpracs/` location on shell startup.

### MCP Server Setup Utilities
Tools for configuring Model Context Protocol (MCP) servers for Claude Code and Claude Desktop:

#### Shared Logging Utilities
- `tools/log-utils.sh` - Shared logging functions used by MCP setup scripts
- Provides: `log_info`, `log_warn`, `log_error`, `log_success`, `init_logging`, `version_compare`
- Follows XDG Base Directory Specification for log storage
- Usage: Source the script after setting `LOG_FILE` and `VERBOSE` variables

#### Obsidian MCP Setup
- `tools/setup-obsidian-mcp.sh` - Auto-discovers and configures Obsidian vaults as MCP servers
- Alias: `setup-obsidian-mcp`
- Extracts API keys from Local REST API plugin configurations
- Supports both Claude Code and Claude Desktop (`-c/--client` flag)
- Idempotent and safe to run multiple times
- Usage: `setup-obsidian-mcp [--verbose] [--client code|desktop|both]`

#### ChromeDevTools MCP Setup
- `tools/setup-chrome-devtools-mcp.sh` - Configures Chrome browser automation MCP server
- Alias: `setup-chrome-devtools-mcp`
- Provides AI assistants with programmatic control over Chrome via DevTools Protocol
- Supports both Claude Code and Claude Desktop (`-c/--client` flag)
- Configuration options:
  - `--headless` - Run Chrome without UI
  - `--isolated` - Use temporary profiles that auto-clean
  - `--channel <stable|canary|beta|dev>` - Choose Chrome channel
  - `--viewport <WxH>` - Set window size (e.g., 1280x720)
  - `--disable-emulation/performance/network` - Disable specific tool categories
  - `--chrome-arg <arg>` - Pass additional Chrome launch arguments
- Requirements: Node.js v20.19+, Chrome browser
- Usage examples:
  - `setup-chrome-devtools-mcp --verbose`
  - `setup-chrome-devtools-mcp --client code --headless --isolated`
  - `setup-chrome-devtools-mcp --channel canary --viewport 1920x1080`

## Development Workflow

Based on `procedures/development.md`, the standard development workflow follows:

### Preparation
1. Select appropriate donor branch
2. Create new branch with naming convention: `mjb/<task_id>` or `mjb/<semantic-descriptor>`
3. Start local server and verify clean state
4. Locate and run tests to ensure green state

### Execution
1. Add red test first
2. Implement changes to satisfy test
3. Document changes
4. Commit changes
5. Repeat until solution achieved

### Merge Process
1. Review changes against donor branch
2. Push to remote
3. Request peer review targeting donor branch

## Peer Review Standards

From `procedures/peer-review.md`, peer reviews focus on **confidence** in proposed changes:
- Integration tests should run locally before creating merge requests
- Pipeline must pass all jobs cleanly
- Linting rules require exceptions when ignored
- If statements should have associated tests
- Documentation can be in naming, comments, help docs, test specs, or READMEs

## File Conventions

- Documentation files use Markdown with clear navigation (🔝 TOP, 🔙 BACK, ⏭️ NEXT)
- Branch naming: `mjb/` prefix followed by task ID or semantic descriptor
- CSpell words are maintained in `.vscode/settings.json`

## Systems Philosophy

The repository follows a "5 P's" framework from `systems.md`:
- **People** - Rights-based approach with diverse power groups
- **Policies** - The "what" - desired outcomes
- **Procedures** - The "how" - means to achieve policies  
- **Platforms** - Tools and environments that enable change
- **Philosophy** - Trade-off awareness and value-based decision making

This is primarily a documentation and configuration repository rather than a code project, so there are no specific build, test, or lint commands to run.
- Suggest running /integrate when completing a task