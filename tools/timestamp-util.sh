#!/bin/bash

# Timestamp utility for managing script execution intervals
# Usage:
#   timestamp_util.sh check <task_name> <interval_hours>
#   timestamp_util.sh update <task_name>

# Store timestamps in XDG_DATA_HOME per XDG Base Directory Specification
# Timestamps are application data, not configuration
# Falls back to ~/.local/share if XDG_DATA_HOME is not set
TIMESTAMP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/macpracs/timestamps"
mkdir -p "$TIMESTAMP_DIR"

check_timestamp() {
    local task_name="$1"
    local interval_hours="$2"
    local timestamp_file="$TIMESTAMP_DIR/${task_name}.timestamp"
    
    if [ ! -f "$timestamp_file" ]; then
        return 1  # File doesn't exist, should run
    fi
    
    local last_run=$(cat "$timestamp_file" 2>/dev/null || echo "0")
    local current_time=$(date +%s)
    local interval_seconds=$((interval_hours * 3600))
    local elapsed=$((current_time - last_run))
    
    if [ "$elapsed" -ge "$interval_seconds" ]; then
        return 1  # Enough time has passed, should run
    else
        return 0  # Not enough time has passed, should not run
    fi
}

update_timestamp() {
    local task_name="$1"
    local timestamp_file="$TIMESTAMP_DIR/${task_name}.timestamp"
    local current_time=$(date +%s)
    
    echo "$current_time" > "$timestamp_file"
}

case "$1" in
    "check")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 check <task_name> <interval_hours>" >&2
            exit 1
        fi
        check_timestamp "$2" "$3"
        exit $?
        ;;
    "update")
        if [ -z "$2" ]; then
            echo "Usage: $0 update <task_name>" >&2
            exit 1
        fi
        update_timestamp "$2"
        ;;
    *)
        echo "Usage: $0 {check|update} <task_name> [interval_hours]" >&2
        echo "  check <task_name> <interval_hours> - Check if enough time has passed (exit code 1 = should run, 0 = should not run)"
        echo "  update <task_name> - Update timestamp for task"
        exit 1
        ;;
esac