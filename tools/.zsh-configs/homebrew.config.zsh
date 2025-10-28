# [Homebrew](https://brew.sh)

# Quieter Homebrew
export HOMEBREW_NO_ENV_HINTS=1

TOOLS_DIR="$(dirname "$(dirname "${(%):-%x}")")"
TIMESTAMP_UTIL="$TOOLS_DIR/timestamp-util.sh"
MACPRACS_LOG_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/macpracs/logs"

if [ -f "$TIMESTAMP_UTIL" ] && ! "$TIMESTAMP_UTIL" check homebrew_update 24; then
    # Ensure log directory exists
    mkdir -p "$MACPRACS_LOG_DIR"
    HOMEBREW_LOG="$MACPRACS_LOG_DIR/homebrew.log"

    # Log update attempt with timestamp
    echo "=== Homebrew update: $(date) ===" >> "$HOMEBREW_LOG" 2>&1

    # Run brew update and capture exit code
    brew update --quiet >> "$HOMEBREW_LOG" 2>&1
    UPDATE_STATUS=$?

    # Run brew upgrade and capture exit code
    brew upgrade --quiet >> "$HOMEBREW_LOG" 2>&1
    UPGRADE_STATUS=$?

    # Check if either command failed
    if [ $UPDATE_STATUS -ne 0 ] || [ $UPGRADE_STATUS -ne 0 ]; then
        echo "⚠️  Homebrew update had issues. Check logs: $HOMEBREW_LOG"
    else
        "$TIMESTAMP_UTIL" update homebrew_update
    fi
fi
