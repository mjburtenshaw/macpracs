#!/usr/bin/env bash

# Log Utilities
#
# Shared logging functions for macpracs scripts.
#
# Usage:
#   # Set configuration variables
#   LOG_FILE="/path/to/logfile.log"
#   VERBOSE=true  # or false
#
#   # Source this script
#   source "$(dirname "$0")/log-utils.sh"
#
#   # Initialize logging (creates directory, writes header)
#   init_logging "Script Name"
#
#   # Use logging functions
#   log_info "Information message"
#   log_warn "Warning message"
#   log_error "Error message"
#   log_success "Success message"
#
# Required Variables (must be set before sourcing):
#   LOG_FILE  - Path to the log file
#   VERBOSE   - true/false flag for verbose output
#
# Provided Functions:
#   init_logging <script_name> [additional_info]
#       - Creates log directory if needed
#       - Writes header with timestamp and script name
#       - Writes any additional info lines
#
#   log_to_file <message>
#       - Writes timestamped message directly to log file
#
#   log_info <message>
#       - INFO level: Logs to file, shows to stdout if VERBOSE=true
#
#   log_warn <message>
#       - WARN level: Logs to file, shows to stderr if VERBOSE=true
#
#   log_error <message>
#       - ERROR level: Logs to file, always shows to stderr
#
#   log_success <message>
#       - SUCCESS level: Logs to file, shows to stdout if VERBOSE=true
#
#   version_compare <version1> <version2>
#       - Compares semantic versions (e.g., "1.2.3" vs "1.2.4")
#       - Returns 0 if version1 >= version2
#       - Returns 1 if version1 < version2
#
# UNIX Principles:
# - Single responsibility: Only handles logging
# - Composable: Can be sourced by any script
# - No side effects: Caller controls LOG_FILE and VERBOSE
# - XDG compliant: Designed for use with XDG_STATE_HOME

# Validation: Ensure required variables are set
if [[ -z "${LOG_FILE}" ]]; then
    echo "[ERROR] log-utils.sh: LOG_FILE must be set before sourcing this script" >&2
    # shellcheck disable=SC2317
    return 1 2>/dev/null || exit 1
fi

if [[ -z "${VERBOSE}" ]]; then
    echo "[ERROR] log-utils.sh: VERBOSE must be set before sourcing this script" >&2
    # shellcheck disable=SC2317
    return 1 2>/dev/null || exit 1
fi

# Initialize logging
# Usage: init_logging "Script Name" ["Additional info line 1" "Additional info line 2" ...]
init_logging() {
    local script_name="$1"
    shift
    local additional_info=("$@")

    # Ensure log directory exists
    local log_dir
    log_dir=$(dirname "$LOG_FILE")
    mkdir -p "$log_dir"

    # Write header
    echo "=== $script_name - $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG_FILE"

    # Write any additional info
    for info in "${additional_info[@]+"${additional_info[@]}"}"; do
        echo "$info" >> "$LOG_FILE"
    done
}

# Write directly to log file with timestamp
log_to_file() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# INFO level logging
log_info() {
    local msg="$1"
    log_to_file "INFO: $msg"
    if [[ "$VERBOSE" == "true" ]]; then
        echo "[INFO] $msg"
    fi
}

# WARN level logging
log_warn() {
    local msg="$1"
    log_to_file "WARN: $msg"
    if [[ "$VERBOSE" == "true" ]]; then
        echo "[WARN] $msg" >&2
    fi
}

# ERROR level logging (always shown)
log_error() {
    local msg="$1"
    log_to_file "ERROR: $msg"
    echo "[ERROR] $msg" >&2
}

# SUCCESS level logging
log_success() {
    local msg="$1"
    log_to_file "SUCCESS: $msg"
    if [[ "$VERBOSE" == "true" ]]; then
        echo "[SUCCESS] $msg"
    fi
}

# Compare semantic versions
# Returns 0 if version1 >= version2, 1 otherwise
# Usage: version_compare "1.2.3" "1.2.4"
version_compare() {
    local version1=$1
    local version2=$2

    # Split versions into arrays
    IFS='.' read -ra v1 <<< "$version1"
    IFS='.' read -ra v2 <<< "$version2"

    # Compare each component
    for i in 0 1 2; do
        local num1=${v1[$i]:-0}
        local num2=${v2[$i]:-0}

        if (( num1 > num2 )); then
            return 0
        elif (( num1 < num2 )); then
            return 1
        fi
    done

    return 0  # Equal
}
