#!/usr/bin/env bash
#
# format-timestamp.sh - Reusable timestamp formatting utility
#
# Usage:
#   source scripts/lib/format-timestamp.sh
#   result=$(format_timestamp "2025-10-14T13:05:22.123Z")
#
# Or call directly:
#   ./scripts/lib/format-timestamp.sh "2025-10-14T13:05:22.123Z"
#
# Output format: relative | ISO local | ISO UTC
# Example: 2h 15m ago | 2025-10-14 06:05:22 | 2025-10-14T13:05:22Z

set -euo pipefail

# Format timestamp as: relative | ISO local | ISO UTC
format_timestamp() {
    local timestamp="$1"

    if [[ -z "$timestamp" ]] || [[ "$timestamp" == "null" ]]; then
        echo "N/A"
        return
    fi

    # Parse ISO 8601 timestamp with timezone offset
    # AWS can return formats like:
    #   2025-10-14T12:28:58.923000-06:00 (with milliseconds and offset)
    #   2025-10-14T20:28:58Z (UTC)
    #   2025-10-14T20:28:58.123Z (UTC with milliseconds)

    # Remove milliseconds but keep timezone
    # Pattern: YYYY-MM-DDTHH:MM:SS.milliseconds+/-HH:MM or Z
    local clean_timestamp
    if [[ "$timestamp" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2})\.[0-9]+(.*)$ ]]; then
        # Has milliseconds - remove them but keep timezone suffix
        clean_timestamp="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
    else
        # No milliseconds
        clean_timestamp="$timestamp"
    fi

    # If no timezone indicator, assume UTC
    if [[ ! "$clean_timestamp" =~ (Z|[+-][0-9]{2}:[0-9]{2})$ ]]; then
        clean_timestamp="${clean_timestamp}Z"
    fi

    # Convert to epoch (date will parse timezone correctly)
    local epoch
    if [[ "$clean_timestamp" =~ Z$ ]]; then
        # UTC timestamp with Z suffix - parse as UTC
        epoch=$(date -j -u -f "%Y-%m-%dT%H:%M:%SZ" "$clean_timestamp" "+%s" 2>/dev/null || echo "0")
    else
        # Timestamp with timezone offset (e.g., -06:00)
        # macOS date expects %z format without colon, so remove it
        local timestamp_no_colon="${clean_timestamp%:*}${clean_timestamp##*:}"
        epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S%z" "$timestamp_no_colon" "+%s" 2>/dev/null || echo "0")
    fi

    if [[ "$epoch" == "0" ]]; then
        echo "N/A"
        return
    fi

    # Calculate relative time (time ago)
    local now_epoch
    now_epoch=$(date +%s)
    local diff=$((now_epoch - epoch))

    local days=$((diff / 86400))
    local hours=$(( (diff % 86400) / 3600 ))
    local minutes=$(( (diff % 3600) / 60 ))

    local relative
    if [[ $diff -lt 60 ]]; then
        relative="just now"
    elif [[ $days -gt 0 ]]; then
        relative="${days}d ${hours}h ago"
    elif [[ $hours -gt 0 ]]; then
        relative="${hours}h ${minutes}m ago"
    else
        relative="${minutes}m ago"
    fi

    # Convert epoch to local timezone ISO format (YYYY-MM-DD HH:MM:SS)
    local iso_local
    iso_local=$(date -j -r "$epoch" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "N/A")

    # Convert epoch to UTC ISO format (YYYY-MM-DDTHH:MM:SSZ)
    local iso_utc
    iso_utc=$(date -j -u -r "$epoch" "+%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "N/A")

    # Output: relative | ISO local | ISO UTC
    echo "${relative} | ${iso_local} | ${iso_utc}"
}

# If script is executed directly (not sourced), format the argument
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -lt 1 ]]; then
        echo "Usage: $0 <ISO-8601-timestamp>"
        echo "Example: $0 '2025-10-14T13:05:22.123Z'"
        exit 1
    fi
    format_timestamp "$1"
fi
