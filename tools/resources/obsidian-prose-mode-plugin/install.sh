#!/bin/bash

# Prose Mode Plugin - Obsidian Installer
# Installs the plugin to your Obsidian vault

set -e

PLUGIN_NAME="prose-mode"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "═══════════════════════════════════════════════════════════════════"
echo "  Prose Mode Plugin - Obsidian Installer"
echo "  \"Font is infrastructure. This plugin makes it automatic.\""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check if main.js exists
if [ ! -f "$SCRIPT_DIR/main.js" ]; then
    echo "⚠️  main.js not found. Building plugin..."
    echo ""

    if ! command -v npm &> /dev/null; then
        echo "❌ npm not found. Please install Node.js first."
        exit 1
    fi

    cd "$SCRIPT_DIR"
    npm install
    npm run build

    if [ ! -f "$SCRIPT_DIR/main.js" ]; then
        echo "❌ Build failed. Please check errors above."
        exit 1
    fi

    echo "✓ Plugin built successfully"
    echo ""
fi

# Function to find Obsidian vaults
find_vaults() {
    local search_paths=(
        "$HOME/Documents"
        "$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents"
        "$HOME/Obsidian"
    )

    for path in "${search_paths[@]}"; do
        if [ -d "$path" ]; then
            find "$path" -maxdepth 3 -type d -name ".obsidian" 2>/dev/null | sed 's|/.obsidian$||'
        fi
    done
}

# Find vaults
echo "Searching for Obsidian vaults..."
vault_list=$(find_vaults | sort -u)
IFS=$'\n' VAULTS=($vault_list)

if [ ${#VAULTS[@]} -eq 0 ]; then
    echo "❌ No Obsidian vaults found."
    echo ""
    echo "Please install manually:"
    echo "  1. Copy main.js and manifest.json to:"
    echo "     YourVault/.obsidian/plugins/$PLUGIN_NAME/"
    echo "  2. Open Obsidian → Settings → Community Plugins"
    echo "  3. Reload plugins and enable 'Prose Mode'"
    exit 1
fi

echo "Found ${#VAULTS[@]} vault(s):"
echo ""

# Display vaults
for i in "${!VAULTS[@]}"; do
    vault_name=$(basename "${VAULTS[$i]}")
    echo "  $((i+1)). $vault_name"
    echo "     ${VAULTS[$i]}"
    echo ""
done

# Select vault
if [ ${#VAULTS[@]} -eq 1 ]; then
    SELECTED_VAULT="${VAULTS[0]}"
    vault_name=$(basename "$SELECTED_VAULT")
    echo "Installing to: $vault_name"
else
    echo -n "Select vault number (1-${#VAULTS[@]}): "
    read selection

    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#VAULTS[@]} ]; then
        echo "❌ Invalid selection"
        exit 1
    fi

    SELECTED_VAULT="${VAULTS[$((selection-1))]}"
    vault_name=$(basename "$SELECTED_VAULT")
fi

# Create plugin directory
PLUGIN_DIR="$SELECTED_VAULT/.obsidian/plugins/$PLUGIN_NAME"
echo ""
echo "Creating plugin directory..."
mkdir -p "$PLUGIN_DIR"

# Copy plugin files
echo "Copying plugin files..."
cp "$SCRIPT_DIR/main.js" "$PLUGIN_DIR/"
cp "$SCRIPT_DIR/manifest.json" "$PLUGIN_DIR/"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✓ Prose Mode plugin installed successfully!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Installation location:"
echo "  $PLUGIN_DIR"
echo ""
echo "To activate:"
echo "  1. Restart Obsidian (or reload plugins)"
echo "  2. Open Settings → Community Plugins"
echo "  3. Disable 'Safe Mode' if needed"
echo "  4. Enable 'Prose Mode' in the plugins list"
echo ""
echo "What it does:"
echo "  • Watches for files with '/prose/' in the path"
echo "  • Automatically adds 'prose-mode' CSS class"
echo "  • Triggers Charter serif font (via CSS snippet)"
echo ""
echo "\"Font is infrastructure. This makes it automatic.\""
echo ""
