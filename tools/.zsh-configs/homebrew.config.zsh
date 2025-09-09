# [Homebrew](https://brew.sh)

TOOLS_DIR="$(dirname "$(dirname "${(%):-%x}")")"
TIMESTAMP_UTIL="$TOOLS_DIR/timestamp-util.sh"

if [ -f "$TIMESTAMP_UTIL" ] && ! "$TIMESTAMP_UTIL" check homebrew_update 24; then
    echo "Updating Homebrew..."
    brew update --quiet
    brew upgrade --quiet
    "$TIMESTAMP_UTIL" update homebrew_update
fi
