#!/bin/zsh

# Setup Obsidian MCP Servers
#
# This script discovers Obsidian vaults with MCP capability and registers
# them with Claude Code and/or Claude Desktop. It extracts API keys from each
# vault's Local REST API plugin configuration.
#
# Usage: ./setup-obsidian-mcp.sh [-v|--verbose] [-c|--client <code|desktop|both>]
#
# Options:
#   -v, --verbose     Show detailed output (default: silent on success)
#   -c, --client      Which client(s) to configure: code, desktop, or both (default: both)
#   -h, --help        Show this help message
#
# UNIX Principles:
# - Idempotent: Safe to run multiple times
# - Single source of truth: Reads from Obsidian plugin configs
# - Composable: Can be run standalone or from other scripts
# - Logs always written to ~/.macpracs/logs/ regardless of verbosity

set -euo pipefail

# Configuration
OBSIDIAN_DIR="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents"
CLAUDE_DESKTOP_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
DESKTOP_BACKUP="${CLAUDE_DESKTOP_CONFIG}.backup"
LOG_DIR="$HOME/.macpracs/logs"
LOG_FILE="$LOG_DIR/setup-obsidian-mcp.log"
SYSTEM_PYTHON="/usr/local/bin/python3"
CLAUDE_CMD="$HOME/.claude/local/claude"

# Parse arguments
VERBOSE=false
CLIENT="both"  # code, desktop, or both

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
        -h|--help)
            echo "Usage: $0 [-v|--verbose] [-c|--client <code|desktop|both>]"
            echo ""
            echo "Setup Obsidian MCP servers for Claude Code and/or Claude Desktop"
            echo ""
            echo "Options:"
            echo "  -v, --verbose     Show detailed output (default: silent on success)"
            echo "  -c, --client      Configure 'code', 'desktop', or 'both' (default: both)"
            echo "  -h, --help        Show this help message"
            echo ""
            echo "Logs are always written to: $LOG_FILE"
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            echo "Use -h or --help for usage information" >&2
            exit 1
            ;;
    esac
done

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Initialize log file with timestamp
echo "=== Setup Obsidian MCP - $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG_FILE"
echo "Client target: $CLIENT" >> "$LOG_FILE"

# Logging functions
log_to_file() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log_info() {
    local msg="$1"
    log_to_file "INFO: $msg"
    if [[ "$VERBOSE" == "true" ]]; then
        echo "[INFO] $msg"
    fi
}

log_warn() {
    local msg="$1"
    log_to_file "WARN: $msg"
    if [[ "$VERBOSE" == "true" ]]; then
        echo "[WARN] $msg" >&2
    fi
}

log_error() {
    local msg="$1"
    log_to_file "ERROR: $msg"
    # Errors always shown, even without verbose
    echo "[ERROR] $msg" >&2
}

log_success() {
    local msg="$1"
    log_to_file "SUCCESS: $msg"
    if [[ "$VERBOSE" == "true" ]]; then
        echo "[SUCCESS] $msg"
    fi
}

# Validate Python installation
log_info "Validating Python installation..."
if [[ ! -x "$SYSTEM_PYTHON" ]]; then
    log_error "System Python not found at: $SYSTEM_PYTHON"
    log_error "This script requires the system Python installation (not Homebrew)."
    log_error "Please install Python from: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$("$SYSTEM_PYTHON" --version 2>&1)
log_info "Using Python: $SYSTEM_PYTHON ($PYTHON_VERSION)"

# Check if required directories exist
if [[ ! -d "$OBSIDIAN_DIR" ]]; then
    log_error "Obsidian directory not found: $OBSIDIAN_DIR"
    log_error "Please ensure Obsidian is installed and vaults are synced to iCloud"
    exit 1
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

log_info "Discovering Obsidian vaults with MCP capability..."

# Discover vaults with MCP server capability
vaults=()
vault_paths=()
api_keys=()

for vault_path in "$OBSIDIAN_DIR"/*; do
    if [[ -d "$vault_path" ]]; then
        vault_name=$(basename "$vault_path")
        mcp_server="$vault_path/.obsidian/plugins/mcp-tools/bin/mcp-server"
        api_config="$vault_path/.obsidian/plugins/obsidian-local-rest-api/data.json"

        # Check if vault has both MCP server and API config
        if [[ -f "$mcp_server" && -f "$api_config" ]]; then
            # Extract API key using Python
            api_key=$("$SYSTEM_PYTHON" -c "import json; print(json.load(open('$api_config'))['apiKey'])" 2>/dev/null || echo "")

            if [[ -n "$api_key" ]]; then
                vaults+=("$vault_name")
                vault_paths+=("$vault_path")
                api_keys+=("$api_key")
                log_info "Found vault: $vault_name"
            else
                log_warn "Vault '$vault_name' has MCP tools but no API key found"
            fi
        else
            log_info "Skipping vault '$vault_name' (missing MCP tools or REST API plugin)"
        fi
    fi
done

if [[ ${#vaults[@]} -eq 0 ]]; then
    log_warn "No vaults found with MCP capability"
    log_info "Ensure vaults have both:"
    log_info "  1. MCP Tools plugin (.obsidian/plugins/mcp-tools/)"
    log_info "  2. Local REST API plugin (.obsidian/plugins/obsidian-local-rest-api/)"
    exit 0
fi

log_info "Found ${#vaults[@]} vault(s) with MCP capability: ${vaults[*]}"

# Configure Claude Code
if [[ "$CLIENT" == "code" || "$CLIENT" == "both" ]]; then
    log_info "Configuring Claude Code..."

    for ((i=1; i<=${#vaults[@]}; i++)); do
        vault_name="${vaults[$i]}"
        vault_path="${vault_paths[$i]}"
        api_key="${api_keys[$i]}"
        server_name="obsidian-mcp-${vault_name}"
        mcp_server="$vault_path/.obsidian/plugins/mcp-tools/bin/mcp-server"

        log_info "Adding server '$server_name' to Claude Code..."

        # Remove existing server if present (idempotent)
        "$CLAUDE_CMD" mcp remove "$server_name" 2>&1 | while IFS= read -r line; do
            log_to_file "CLAUDE_CODE: $line"
        done || true

        # Add server
        if "$CLAUDE_CMD" mcp add --scope user --transport stdio "$server_name" "$mcp_server" \
            --env "OBSIDIAN_API_KEY=$api_key" 2>&1 | while IFS= read -r line; do
            log_to_file "CLAUDE_CODE: $line"
            [[ "$VERBOSE" == "true" ]] && echo "$line"
        done; then
            log_success "Added '$server_name' to Claude Code"
        else
            log_error "Failed to add '$server_name' to Claude Code"
        fi
    done
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
    export OBSIDIAN_DIR
    export CLAUDE_DESKTOP_CONFIG
    export VAULTS="${vaults[*]}"
    export VAULT_PATHS="${vault_paths[*]}"
    export API_KEYS="${api_keys[*]}"

    PYTHON_OUTPUT=$("$SYSTEM_PYTHON" - <<'EOF' 2>&1
import json
import os
import sys

obsidian_dir = os.path.expanduser(os.environ["OBSIDIAN_DIR"])
claude_config_path = os.path.expanduser(os.environ["CLAUDE_DESKTOP_CONFIG"])
vaults = os.environ["VAULTS"].split()
vault_paths = os.environ["VAULT_PATHS"].split()
api_keys = os.environ["API_KEYS"].split()

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

# Add/update MCP server entries for each vault
configured_servers = []
for vault_name, vault_path, api_key in zip(vaults, vault_paths, api_keys):
    mcp_server_path = os.path.join(vault_path, ".obsidian/plugins/mcp-tools/bin/mcp-server")

    # Add MCP server entry
    server_name = f"obsidian-mcp-{vault_name}"
    config["mcpServers"][server_name] = {
        "command": mcp_server_path,
        "env": {
            "OBSIDIAN_API_KEY": api_key
        }
    }
    configured_servers.append(server_name)
    print(f"Configured MCP server: {server_name}")

# Ensure config directory exists
os.makedirs(os.path.dirname(claude_config_path), exist_ok=True)

# Write updated config
with open(claude_config_path, 'w') as f:
    json.dump(config, f, indent=2)

print(f"Configuration written to: {claude_config_path}")
print(f"Configured {len(configured_servers)} server(s): {', '.join(configured_servers)}")
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
log_success "Successfully configured ${#vaults[@]} Obsidian MCP server(s)"
log_info "Configured servers:"
for vault in "${vaults[@]}"; do
    log_info "  - obsidian-mcp-$vault"
done
log_info ""
log_info "Next steps:"
if [[ "$CLIENT" == "code" || "$CLIENT" == "both" ]]; then
    log_info "  - Claude Code: Run '$CLAUDE_CMD mcp list' to verify servers"
fi
if [[ "$CLIENT" == "desktop" || "$CLIENT" == "both" ]]; then
    log_info "  - Claude Desktop: Restart the application"
fi
log_info ""
log_info "Log file: $LOG_FILE"

# Show success message to user even in non-verbose mode
if [[ "$VERBOSE" != "true" ]]; then
    echo "Successfully configured ${#vaults[@]} Obsidian MCP server(s). See log: $LOG_FILE"
fi

log_to_file "=== Setup completed successfully ==="
