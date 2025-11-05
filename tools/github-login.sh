#!/usr/bin/env bash

# GitHub Login Script
#
# This script switches between authenticated GitHub accounts and updates git config.
# It uses gh CLI for account management and optionally updates git user.name/email
# from the account configuration stored in github-accounts.json.
#
# Usage: ./github-login.sh [-v|--verbose] [username]
#
# Options:
#   -v, --verbose     Show detailed output (default: silent on success)
#   -h, --help        Show this help message
#   username          GitHub username to switch to (optional, prompts if not provided)
#
# UNIX Principles:
# - Idempotent: Safe to run multiple times
# - Composable: Can be run standalone or from other scripts
# - Logs written to XDG_STATE_HOME per XDG Base Directory Specification

set -euo pipefail

# Configuration
# Store logs in XDG_STATE_HOME per XDG Base Directory Specification
LOG_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/macpracs/logs"
LOG_FILE="$LOG_DIR/github-login.log"
# Account configs stored in XDG_CONFIG_HOME
GITHUB_ACCOUNTS_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/macpracs/github-accounts.json"

# Parse arguments
# shellcheck disable=SC2034  # VERBOSE is used by sourced log-utils.sh
VERBOSE=false
USERNAME=""
AUTH_MODE=false

show_help() {
    echo "Usage: $0 [-v|--verbose] [-a|--auth] [username]"
    echo ""
    echo "Switch between authenticated GitHub accounts or authenticate a new one"
    echo ""
    echo "Options:"
    echo "  -v, --verbose     Show detailed output (default: silent on success)"
    echo "  -a, --auth        Authenticate a new GitHub account"
    echo "  -h, --help        Show this help message"
    echo "  username          GitHub username to switch to (optional, prompts if not provided)"
    echo ""
    echo "Logs are always written to: $LOG_FILE"
    echo ""
    echo "Examples:"
    echo "  $0                     # Interactive mode - prompts for account"
    echo "  $0 mjburtenshaw        # Direct mode - switches to specified user"
    echo "  $0 --verbose           # Interactive with verbose output"
    echo "  $0 --auth              # Authenticate a new account"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            # shellcheck disable=SC2034  # VERBOSE is used by sourced log-utils.sh
            VERBOSE=true
            shift
            ;;
        -a|--auth)
            AUTH_MODE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            echo "Unknown option: $1" >&2
            echo "Use -h or --help for usage information" >&2
            exit 1
            ;;
        *)
            USERNAME="$1"
            shift
            ;;
    esac
done

# Source shared logging utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/log-utils.sh"

# Initialize logging
init_logging "GitHub Login" "Target user: ${USERNAME:-interactive}"

# Validate gh CLI installation
log_info "Validating gh CLI installation..."
if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) is not installed."
    log_error "Install with: brew install gh"
    exit 1
fi

GH_VERSION=$(gh --version | head -n1)
log_info "Using GitHub CLI: $GH_VERSION"

# Validate jq installation (for parsing account configs)
log_info "Validating jq installation..."
if ! command -v jq &> /dev/null; then
    log_error "jq is not installed."
    log_error "Install with: brew install jq"
    exit 1
fi

# Handle authentication mode
if [[ "$AUTH_MODE" == true ]]; then
    log_info "Authentication mode activated"

    # Get accounts before authentication
    ACCOUNTS_BEFORE=$(gh auth status 2>&1 | grep -o "account [^[:space:]]*" | awk '{print $2}' || true)

    log_info "Running: gh auth login"
    if ! gh auth login; then
        log_error "Authentication failed"
        exit 1
    fi

    log_success "Authentication successful!"

    # Get accounts after authentication to detect new account
    ACCOUNTS_AFTER=$(gh auth status 2>&1 | grep -o "account [^[:space:]]*" | awk '{print $2}' || true)

    # Find new account
    NEW_ACCOUNT=""
    while IFS= read -r account; do
        if [[ -n "$account" ]] && ! echo "$ACCOUNTS_BEFORE" | grep -q "$account"; then
            NEW_ACCOUNT="$account"
            break
        fi
    done <<< "$ACCOUNTS_AFTER"

    if [[ -z "$NEW_ACCOUNT" ]]; then
        log_warn "No new account detected. You may have re-authenticated an existing account."
        exit 0
    fi

    log_info "New account detected: $NEW_ACCOUNT"

    # Ask if user wants to configure account details
    echo ""
    read -p "Would you like to configure git user details for this account? (y/N) " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "You can configure this account later with: macpracs github accounts add $NEW_ACCOUNT"
        exit 0
    fi

    # Get current git config as defaults
    GIT_NAME_DEFAULT=$(git config --global user.name 2>/dev/null || echo "")
    GIT_EMAIL_DEFAULT=$(git config --global user.email 2>/dev/null || echo "")

    # Prompt for name
    echo ""
    read -r -p "Git user name [$GIT_NAME_DEFAULT]: " GIT_NAME
    GIT_NAME="${GIT_NAME:-$GIT_NAME_DEFAULT}"

    while [[ -z "$GIT_NAME" ]]; do
        read -r -p "Git user name (required): " GIT_NAME
    done

    # Prompt for email
    read -r -p "Git user email [$GIT_EMAIL_DEFAULT]: " GIT_EMAIL
    GIT_EMAIL="${GIT_EMAIL:-$GIT_EMAIL_DEFAULT}"

    while [[ -z "$GIT_EMAIL" ]] || ! [[ "$GIT_EMAIL" =~ ^[^[:space:]]+@[^[:space:]]+\.[^[:space:]]+$ ]]; do
        if [[ -z "$GIT_EMAIL" ]]; then
            read -r -p "Git user email (required): " GIT_EMAIL
        else
            echo "Invalid email format"
            read -r -p "Git user email: " GIT_EMAIL
        fi
    done

    # Save account configuration
    mkdir -p "$(dirname "$GITHUB_ACCOUNTS_FILE")"

    if [[ -f "$GITHUB_ACCOUNTS_FILE" ]]; then
        # Update existing file
        jq --arg username "$NEW_ACCOUNT" \
           --arg hostname "github.com" \
           --arg name "$GIT_NAME" \
           --arg email "$GIT_EMAIL" \
           '. + {($username + "@" + $hostname): {username: $username, hostname: $hostname, name: $name, email: $email}}' \
           "$GITHUB_ACCOUNTS_FILE" > "${GITHUB_ACCOUNTS_FILE}.tmp" && \
           mv "${GITHUB_ACCOUNTS_FILE}.tmp" "$GITHUB_ACCOUNTS_FILE"
    else
        # Create new file
        jq -n --arg username "$NEW_ACCOUNT" \
           --arg hostname "github.com" \
           --arg name "$GIT_NAME" \
           --arg email "$GIT_EMAIL" \
           '{($username + "@" + $hostname): {username: $username, hostname: $hostname, name: $name, email: $email}}' \
           > "$GITHUB_ACCOUNTS_FILE"
    fi

    log_success "Account configuration saved for $NEW_ACCOUNT@github.com"
    log_info "Name:  $GIT_NAME"
    log_info "Email: $GIT_EMAIL"
    log_info "Switch to this account with: github-login $NEW_ACCOUNT"

    exit 0
fi

# Get list of authenticated accounts
log_info "Fetching authenticated GitHub accounts..."
ACCOUNTS_OUTPUT=$(gh auth status 2>&1 || true)

if echo "$ACCOUNTS_OUTPUT" | grep -q "You are not logged into"; then
    log_error "No authenticated GitHub accounts found."
    log_error "Run: gh auth login"
    exit 1
fi

# Parse accounts from gh auth status output
# Format: "  ✓ Logged in to github.com account username (keyring)"
ACCOUNTS=()
CURRENT_ACCOUNT=""
while IFS= read -r line; do
    if [[ $line =~ ✓[[:space:]]+Logged[[:space:]]in[[:space:]]to[[:space:]].+[[:space:]]account[[:space:]]([^[:space:]]+) ]]; then
        account="${BASH_REMATCH[1]}"
        ACCOUNTS+=("$account")

        # Check if this is the active account
        # Look ahead in output for "Active account: true"
        if echo "$ACCOUNTS_OUTPUT" | grep -A 2 "$account" | grep -q "Active account: true"; then
            CURRENT_ACCOUNT="$account"
        fi
    fi
done <<< "$ACCOUNTS_OUTPUT"

if [[ ${#ACCOUNTS[@]} -eq 0 ]]; then
    log_error "No authenticated accounts found in gh CLI output."
    exit 1
fi

log_info "Found ${#ACCOUNTS[@]} authenticated account(s)"

# Determine which account to switch to
SELECTED_ACCOUNT=""

if [[ -n "$USERNAME" ]]; then
    # Direct mode - validate username exists
    log_info "Direct mode: switching to $USERNAME"

    FOUND=false
    for account in "${ACCOUNTS[@]}"; do
        if [[ "$account" == "$USERNAME" ]]; then
            FOUND=true
            SELECTED_ACCOUNT="$USERNAME"
            break
        fi
    done

    if [[ "$FOUND" == false ]]; then
        log_error "Account '$USERNAME' not found. Available accounts: ${ACCOUNTS[*]}"
        exit 1
    fi
else
    # Interactive mode - prompt for selection
    if [[ ${#ACCOUNTS[@]} -eq 1 ]]; then
        log_info "Only one account found: ${ACCOUNTS[0]}"
        SELECTED_ACCOUNT="${ACCOUNTS[0]}"
    else
        log_info "Interactive mode: prompting for account selection"
        echo ""
        echo "Select GitHub account:"
        PS3="Enter number: "
        select account in "${ACCOUNTS[@]}"; do
            if [[ -n "$account" ]]; then
                SELECTED_ACCOUNT="$account"
                break
            else
                echo "Invalid selection. Please try again." >&2
            fi
        done
        echo ""
    fi
fi

# Check if already active
if [[ "$SELECTED_ACCOUNT" == "$CURRENT_ACCOUNT" ]]; then
    log_info "Already logged in as $SELECTED_ACCOUNT"

    # Even if already active, update git config if we have stored configuration
    if [[ -f "$GITHUB_ACCOUNTS_FILE" ]]; then
        ACCOUNT_KEY="${SELECTED_ACCOUNT}@github.com"

        if jq -e ".\"$ACCOUNT_KEY\"" "$GITHUB_ACCOUNTS_FILE" > /dev/null 2>&1; then
            GIT_NAME=$(jq -r ".\"$ACCOUNT_KEY\".name" "$GITHUB_ACCOUNTS_FILE")
            GIT_EMAIL=$(jq -r ".\"$ACCOUNT_KEY\".email" "$GITHUB_ACCOUNTS_FILE")

            if [[ -n "$GIT_NAME" && -n "$GIT_EMAIL" && "$GIT_NAME" != "null" && "$GIT_EMAIL" != "null" ]]; then
                # Update git config to match stored configuration
                git config --global user.name "$GIT_NAME"
                git config --global user.email "$GIT_EMAIL"
                log_info "Git config: $GIT_NAME <$GIT_EMAIL>"
            fi
        else
            # No stored config, just show current git config
            GIT_NAME=$(git config --global user.name 2>/dev/null || echo "")
            GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")

            if [[ -n "$GIT_NAME" && -n "$GIT_EMAIL" ]]; then
                log_info "Git config: $GIT_NAME <$GIT_EMAIL>"
            fi
        fi
    else
        # No config file, just show current git config
        GIT_NAME=$(git config --global user.name 2>/dev/null || echo "")
        GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")

        if [[ -n "$GIT_NAME" && -n "$GIT_EMAIL" ]]; then
            log_info "Git config: $GIT_NAME <$GIT_EMAIL>"
        fi
    fi

    exit 0
fi

# Switch gh CLI account
log_info "Switching to $SELECTED_ACCOUNT..."
if ! gh auth switch --user "$SELECTED_ACCOUNT"; then
    log_error "Failed to switch to account: $SELECTED_ACCOUNT"
    exit 1
fi

log_success "Switched gh CLI to $SELECTED_ACCOUNT"

# Update git config if account configuration exists
if [[ -f "$GITHUB_ACCOUNTS_FILE" ]]; then
    log_info "Loading account configuration from $GITHUB_ACCOUNTS_FILE"

    # Try to find config for this account (key format: username@hostname)
    # For github.com, we use the simple key format
    ACCOUNT_KEY="${SELECTED_ACCOUNT}@github.com"

    if jq -e ".\"$ACCOUNT_KEY\"" "$GITHUB_ACCOUNTS_FILE" > /dev/null 2>&1; then
        GIT_NAME=$(jq -r ".\"$ACCOUNT_KEY\".name" "$GITHUB_ACCOUNTS_FILE")
        GIT_EMAIL=$(jq -r ".\"$ACCOUNT_KEY\".email" "$GITHUB_ACCOUNTS_FILE")

        if [[ -n "$GIT_NAME" && -n "$GIT_EMAIL" && "$GIT_NAME" != "null" && "$GIT_EMAIL" != "null" ]]; then
            log_info "Updating git config..."
            git config --global user.name "$GIT_NAME"
            git config --global user.email "$GIT_EMAIL"

            log_success "Logged in as $SELECTED_ACCOUNT"
            log_info "Git config: $GIT_NAME <$GIT_EMAIL>"
        else
            log_warn "Account config found but missing name or email"
            log_success "Logged in as $SELECTED_ACCOUNT"
        fi
    else
        log_warn "No account configuration found for $ACCOUNT_KEY"
        log_info "Add config with: macpracs github accounts add"
        log_success "Logged in as $SELECTED_ACCOUNT"

        # Show current git config
        GIT_NAME=$(git config --global user.name 2>/dev/null || echo "")
        GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")

        if [[ -n "$GIT_NAME" && -n "$GIT_EMAIL" ]]; then
            log_info "Current git config: $GIT_NAME <$GIT_EMAIL>"
        fi
    fi
else
    log_warn "Account configuration file not found: $GITHUB_ACCOUNTS_FILE"
    log_info "Add config with: macpracs github accounts add"
    log_success "Logged in as $SELECTED_ACCOUNT"

    # Show current git config
    GIT_NAME=$(git config --global user.name 2>/dev/null || echo "")
    GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")

    if [[ -n "$GIT_NAME" && -n "$GIT_EMAIL" ]]; then
        log_info "Current git config: $GIT_NAME <$GIT_EMAIL>"
    fi
fi
