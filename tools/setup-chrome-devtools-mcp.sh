#!/bin/zsh

# Setup ChromeDevTools MCP Server
#
# This script configures the ChromeDevTools MCP server for Claude Code and/or
# Claude Desktop. The server provides AI assistants with programmatic control
# over Chrome browser instances through the Chrome DevTools Protocol.
#
# Usage: ./setup-chrome-devtools-mcp.sh [-v|--verbose] [-c|--client <code|desktop|both>] [options]
#
# Options:
#   -v, --verbose          Show detailed output (default: silent on success)
#   -c, --client           Which client(s) to configure: code, desktop, or both (default: both)
#   -h, --help             Show this help message
#
# Chrome Configuration Options:
#   --headless             Run Chrome without UI
#   --isolated             Use temporary profiles that auto-clean on exit
#   --channel <channel>    Chrome channel: stable, canary, beta, or dev (default: stable)
#   --viewport <WxH>       Initial window size, e.g., 1280x720 (max 3840x2160 in headless)
#   --disable-emulation    Disable emulation tools (CPU throttling, network conditions)
#   --disable-performance  Disable performance tracing tools
#   --disable-network      Disable network inspection tools
#   --chrome-arg <arg>     Additional Chrome launch argument (can be repeated)
#
# UNIX Principles:
# - Idempotent: Safe to run multiple times
# - Composable: Can be run standalone or from other scripts
# - Logs written to XDG_STATE_HOME per XDG Base Directory Specification

set -euo pipefail

# Configuration
CLAUDE_DESKTOP_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
DESKTOP_BACKUP="${CLAUDE_DESKTOP_CONFIG}.backup"
LOG_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/macpracs/logs"
LOG_FILE="$LOG_DIR/setup-chrome-devtools-mcp.log"
CLAUDE_CMD="$HOME/.claude/local/claude"
MCP_SERVER_NAME="chrome-devtools"
MIN_NODE_VERSION="20.19.0"

# Parse arguments
VERBOSE=false
CLIENT="both"
HEADLESS=false
ISOLATED=false
CHANNEL="stable"
VIEWPORT=""
DISABLE_EMULATION=false
DISABLE_PERFORMANCE=false
DISABLE_NETWORK=false
CHROME_ARGS=()

show_help() {
    echo "Usage: $0 [-v|--verbose] [-c|--client <code|desktop|both>] [options]"
    echo ""
    echo "Setup ChromeDevTools MCP server for Claude Code and/or Claude Desktop"
    echo ""
    echo "Options:"
    echo "  -v, --verbose          Show detailed output (default: silent on success)"
    echo "  -c, --client           Configure 'code', 'desktop', or 'both' (default: both)"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Chrome Configuration Options:"
    echo "  --headless             Run Chrome without UI"
    echo "  --isolated             Use temporary profiles that auto-clean on exit"
    echo "  --channel <channel>    Chrome channel: stable, canary, beta, or dev (default: stable)"
    echo "  --viewport <WxH>       Initial window size, e.g., 1280x720"
    echo "  --disable-emulation    Disable emulation tools"
    echo "  --disable-performance  Disable performance tracing tools"
    echo "  --disable-network      Disable network inspection tools"
    echo "  --chrome-arg <arg>     Additional Chrome launch argument (can be repeated)"
    echo ""
    echo "Examples:"
    echo "  $0 --verbose"
    echo "  $0 --client code --headless --isolated"
    echo "  $0 --channel canary --viewport 1920x1080"
    echo "  $0 --chrome-arg='--proxy-server=localhost:8080'"
    echo ""
    echo "Logs are always written to: $LOG_FILE"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -c|--client)
            CLIENT="$2"
            if [[ "$CLIENT" != "code" && "$CLIENT" != "desktop" && "$CLIENT" != "both" ]]; then
                echo "Invalid client: $CLIENT. Must be 'code', 'desktop', or 'both'" >&2
                exit 1
            fi
            shift 2
            ;;
        --headless)
            HEADLESS=true
            shift
            ;;
        --isolated)
            ISOLATED=true
            shift
            ;;
        --channel)
            CHANNEL="$2"
            if [[ "$CHANNEL" != "stable" && "$CHANNEL" != "canary" && "$CHANNEL" != "beta" && "$CHANNEL" != "dev" ]]; then
                echo "Invalid channel: $CHANNEL. Must be 'stable', 'canary', 'beta', or 'dev'" >&2
                exit 1
            fi
            shift 2
            ;;
        --viewport)
            VIEWPORT="$2"
            if [[ ! "$VIEWPORT" =~ ^[0-9]+x[0-9]+$ ]]; then
                echo "Invalid viewport format: $VIEWPORT. Must be WxH (e.g., 1280x720)" >&2
                exit 1
            fi
            shift 2
            ;;
        --disable-emulation)
            DISABLE_EMULATION=true
            shift
            ;;
        --disable-performance)
            DISABLE_PERFORMANCE=true
            shift
            ;;
        --disable-network)
            DISABLE_NETWORK=true
            shift
            ;;
        --chrome-arg)
            CHROME_ARGS+=("$2")
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            echo "Use -h or --help for usage information" >&2
            exit 1
            ;;
    esac
done

# Source shared logging utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/log-utils.sh"

# Initialize logging
CONFIG_SUMMARY="Client target: $CLIENT | headless=$HEADLESS isolated=$ISOLATED channel=$CHANNEL"
init_logging "Setup ChromeDevTools MCP" "$CONFIG_SUMMARY"

# Validate Node.js installation
log_info "Validating Node.js installation..."
if ! command -v node &> /dev/null; then
    log_error "Node.js not found. Please install Node.js v${MIN_NODE_VERSION} or newer"
    log_error "Visit: https://nodejs.org/en/download/"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
log_info "Found Node.js version: $NODE_VERSION"

if ! version_compare "$NODE_VERSION" "$MIN_NODE_VERSION"; then
    log_error "Node.js version $NODE_VERSION is too old"
    log_error "Required: v${MIN_NODE_VERSION} or newer"
    log_error "Visit: https://nodejs.org/en/download/"
    exit 1
fi

# Validate npx availability
if ! command -v npx &> /dev/null; then
    log_error "npx not found. Please ensure npm is properly installed"
    exit 1
fi

log_info "npx is available"

# Validate Chrome installation
log_info "Validating Chrome installation..."
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [[ ! -x "$CHROME_PATH" ]]; then
    log_warn "Chrome not found at default location: $CHROME_PATH"
    log_warn "The MCP server will attempt to locate Chrome automatically"
    log_warn "If you encounter issues, install Chrome from: https://www.google.com/chrome/"
else
    CHROME_VERSION=$("$CHROME_PATH" --version 2>&1 | awk '{print $NF}')
    log_info "Found Chrome version: $CHROME_VERSION"
fi

# Check if Claude Code is available (if needed)
if [[ "$CLIENT" == "code" || "$CLIENT" == "both" ]]; then
    if [[ ! -x "$CLAUDE_CMD" ]]; then
        log_error "Claude Code CLI not found at: $CLAUDE_CMD"
        log_error "Please ensure Claude Code is installed"
        exit 1
    fi
    CLAUDE_VERSION=$("$CLAUDE_CMD" --version 2>&1 || echo "version unknown")
    log_info "Claude Code CLI found: $CLAUDE_CMD ($CLAUDE_VERSION)"
fi

# Build MCP server arguments
MCP_ARGS=()

if [[ "$HEADLESS" == "true" ]]; then
    MCP_ARGS+=("--headless")
fi

if [[ "$ISOLATED" == "true" ]]; then
    MCP_ARGS+=("--isolated")
fi

if [[ "$CHANNEL" != "stable" ]]; then
    MCP_ARGS+=("--channel=$CHANNEL")
fi

if [[ -n "$VIEWPORT" ]]; then
    MCP_ARGS+=("--viewport=$VIEWPORT")
fi

if [[ "$DISABLE_EMULATION" == "true" ]]; then
    MCP_ARGS+=("--categoryEmulation=false")
fi

if [[ "$DISABLE_PERFORMANCE" == "true" ]]; then
    MCP_ARGS+=("--categoryPerformance=false")
fi

if [[ "$DISABLE_NETWORK" == "true" ]]; then
    MCP_ARGS+=("--categoryNetwork=false")
fi

# Add custom Chrome arguments
for arg in "${CHROME_ARGS[@]}"; do
    MCP_ARGS+=("--chromeArg=$arg")
done

log_info "MCP server arguments: ${MCP_ARGS[*]}"

# Configure Claude Code
if [[ "$CLIENT" == "code" || "$CLIENT" == "both" ]]; then
    log_info "Configuring Claude Code..."

    # Remove existing server if present (idempotent)
    log_info "Removing existing '$MCP_SERVER_NAME' server (if present)..."
    "$CLAUDE_CMD" mcp remove "$MCP_SERVER_NAME" 2>&1 | while IFS= read -r line; do
        log_to_file "CLAUDE_CODE: $line"
    done || true

    # Build the add command
    CMD_ARGS=(
        "mcp" "add"
        "--scope" "user"
        "--transport" "stdio"
        "$MCP_SERVER_NAME"
        "npx"
        "-y"
        "chrome-devtools-mcp@latest"
    )

    # Add MCP arguments
    for arg in "${MCP_ARGS[@]}"; do
        CMD_ARGS+=("$arg")
    done

    log_info "Adding server '$MCP_SERVER_NAME' to Claude Code..."
    if "$CLAUDE_CMD" "${CMD_ARGS[@]}" 2>&1 | while IFS= read -r line; do
        log_to_file "CLAUDE_CODE: $line"
        [[ "$VERBOSE" == "true" ]] && echo "$line"
    done; then
        log_success "Added '$MCP_SERVER_NAME' to Claude Code"
    else
        log_error "Failed to add '$MCP_SERVER_NAME' to Claude Code"
        exit 1
    fi
fi

# Configure Claude Desktop
if [[ "$CLIENT" == "desktop" || "$CLIENT" == "both" ]]; then
    log_info "Configuring Claude Desktop..."

    # Check if Claude Desktop is running
    if pgrep -x "Claude" > /dev/null 2>&1; then
        log_error "Claude Desktop is currently running"
        log_error "Please quit Claude Desktop before running this script to avoid config conflicts"
        log_error "The application may overwrite changes with its cached configuration"
        exit 1
    fi

    # Backup existing config if it exists
    if [[ -f "$CLAUDE_DESKTOP_CONFIG" ]]; then
        log_info "Backing up existing config to: $DESKTOP_BACKUP"
        cp "$CLAUDE_DESKTOP_CONFIG" "$DESKTOP_BACKUP"
    fi

    # Generate config using Python
    export CLAUDE_DESKTOP_CONFIG
    export MCP_SERVER_NAME
    export MCP_ARGS_JSON=$(printf '%s\n' "${MCP_ARGS[@]}" | jq -R . | jq -s .)

    PYTHON_OUTPUT=$(python3 - <<'EOF' 2>&1
import json
import os
import sys

claude_config_path = os.path.expanduser(os.environ["CLAUDE_DESKTOP_CONFIG"])
server_name = os.environ["MCP_SERVER_NAME"]
mcp_args = json.loads(os.environ["MCP_ARGS_JSON"])

# Load existing config or create new one
config = {"mcpServers": {}}
if os.path.exists(claude_config_path):
    try:
        with open(claude_config_path, 'r') as f:
            config = json.load(f)
        if "mcpServers" not in config:
            config["mcpServers"] = {}
    except json.JSONDecodeError:
        print(f"Warning: Existing config is invalid JSON, creating new config", file=sys.stderr)
        config = {"mcpServers": {}}

# Build args array
args = ["-y", "chrome-devtools-mcp@latest"] + mcp_args

# Add MCP server entry
config["mcpServers"][server_name] = {
    "command": "npx",
    "args": args
}

# Ensure config directory exists
os.makedirs(os.path.dirname(claude_config_path), exist_ok=True)

# Write updated config
with open(claude_config_path, 'w') as f:
    json.dump(config, f, indent=2)

print(f"Configured MCP server: {server_name}")
print(f"Configuration written to: {claude_config_path}")
print(f"Arguments: {' '.join(args)}")
EOF
)
    PYTHON_EXIT_CODE=$?

    # Log Python output
    echo "$PYTHON_OUTPUT" | while IFS= read -r line; do
        log_to_file "PYTHON: $line"
        [[ "$VERBOSE" == "true" ]] && echo "$line"
    done

    if [[ $PYTHON_EXIT_CODE -eq 0 ]]; then
        log_success "Successfully configured Claude Desktop"
    else
        log_error "Failed to configure Claude Desktop (exit code: $PYTHON_EXIT_CODE)"
        if [[ -f "$DESKTOP_BACKUP" ]]; then
            log_info "Restoring backup configuration"
            mv "$DESKTOP_BACKUP" "$CLAUDE_DESKTOP_CONFIG"
        fi
        exit 1
    fi
fi

# Summary
log_success "Successfully configured ChromeDevTools MCP server"
log_info "Server name: $MCP_SERVER_NAME"
log_info "Configuration:"
log_info "  - Headless: $HEADLESS"
log_info "  - Isolated: $ISOLATED"
log_info "  - Channel: $CHANNEL"
if [[ -n "$VIEWPORT" ]]; then
    log_info "  - Viewport: $VIEWPORT"
fi
if [[ ${#CHROME_ARGS[@]} -gt 0 ]]; then
    log_info "  - Chrome args: ${CHROME_ARGS[*]}"
fi
log_info ""
log_info "Next steps:"
if [[ "$CLIENT" == "code" || "$CLIENT" == "both" ]]; then
    log_info "  - Claude Code: Run '$CLAUDE_CMD mcp list' to verify server"
fi
if [[ "$CLIENT" == "desktop" || "$CLIENT" == "both" ]]; then
    log_info "  - Claude Desktop: Restart the application"
fi
log_info ""
log_info "Test the server with a prompt like:"
log_info "  'Navigate to https://example.com and take a screenshot'"
log_info ""
log_info "Log file: $LOG_FILE"

# Show success message to user even in non-verbose mode
if [[ "$VERBOSE" != "true" ]]; then
    echo "Successfully configured ChromeDevTools MCP server. See log: $LOG_FILE"
fi

log_to_file "=== Setup completed successfully ==="
