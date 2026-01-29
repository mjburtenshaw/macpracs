#!/bin/bash

# Themodynamic Stark - Obsidian Theme Installer
# Installs the theme to your Obsidian vault

set -e

THEME_NAME="Themodynamic Stark"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "═══════════════════════════════════════════════════════════════════"
echo "  Themodynamic Stark - Obsidian Theme Installer"
echo "  \"The system does not seek peace. It seeks containment.\""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Function to find Obsidian vaults
find_vaults() {
    # Common locations for Obsidian vaults on macOS
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
# Build array (compatible with bash 3.2)
vault_list=$(find_vaults | sort -u)
IFS=$'\n' VAULTS=($vault_list)

if [ ${#VAULTS[@]} -eq 0 ]; then
    echo "❌ No Obsidian vaults found."
    echo ""
    echo "Please install manually:"
    echo "  1. Copy manifest.json and theme.css to:"
    echo "     YourVault/.obsidian/themes/Themodynamic Stark/"
    echo "  2. Copy fonts/contextual-fonts-infrastructure.css to:"
    echo "     YourVault/.obsidian/snippets/"
    echo "  3. Open Obsidian → Settings → Appearance"
    echo "  4. Select 'Themodynamic Stark' from the theme dropdown"
    echo "  5. Enable 'contextual-fonts-infrastructure' in CSS snippets"
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

# Create theme directory
THEME_DIR="$SELECTED_VAULT/.obsidian/themes/$THEME_NAME"
echo ""
echo "Creating theme directory..."
mkdir -p "$THEME_DIR"

# Copy theme files
echo "Copying theme files..."
cp "$SCRIPT_DIR/manifest.json" "$THEME_DIR/"
cp "$SCRIPT_DIR/theme.css" "$THEME_DIR/"

# Install font CSS snippet
SNIPPETS_DIR="$SELECTED_VAULT/.obsidian/snippets"
echo "Installing font CSS snippet..."
mkdir -p "$SNIPPETS_DIR"
cp "$SCRIPT_DIR/fonts/contextual-fonts-infrastructure.css" "$SNIPPETS_DIR/"

# Check if FiraCode is installed
echo "Checking for FiraCode font..."
FIRACODE_INSTALLED=false
if fc-list 2>/dev/null | grep -i "fira code" > /dev/null; then
    FIRACODE_INSTALLED=true
    echo "✓ FiraCode found"
elif system_profiler SPFontsDataType 2>/dev/null | grep -i "fira code" > /dev/null; then
    FIRACODE_INSTALLED=true
    echo "✓ FiraCode found"
else
    echo "⚠️  FiraCode not found (optional - will fall back to system monospace)"
fi

# Update appearance.json to activate theme
APPEARANCE_JSON="$SELECTED_VAULT/.obsidian/appearance.json"
if [ -f "$APPEARANCE_JSON" ]; then
    echo "Activating theme..."

    # Check if jq is available for JSON manipulation
    if command -v jq &> /dev/null; then
        # Use jq to update the theme and enable CSS snippet
        tmp=$(mktemp)
        jq --arg theme "$THEME_NAME" '.cssTheme = $theme | .enabledCssSnippets += ["contextual-fonts-infrastructure"] | .enabledCssSnippets |= unique' "$APPEARANCE_JSON" > "$tmp"
        mv "$tmp" "$APPEARANCE_JSON"
        echo "✓ Theme and font snippet activated"
    else
        echo "⚠️  jq not found - cannot auto-activate theme/snippets"
        echo "   Please select the theme and enable snippets manually in Obsidian settings"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✓ Themodynamic Stark installed successfully!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Installation locations:"
echo "  Theme:   $THEME_DIR"
echo "  Fonts:   $SNIPPETS_DIR/contextual-fonts-infrastructure.css"
echo ""
echo "To activate:"
echo "  1. Restart Obsidian (or reload the vault)"
echo "  2. Open Settings → Appearance"
echo "  3. Select 'Themodynamic Stark' from the theme dropdown"
echo "  4. Enable 'contextual-fonts-infrastructure' in CSS snippets"
echo ""
if [ "$FIRACODE_INSTALLED" = false ]; then
    echo "Optional: Install FiraCode for code ligatures"
    echo "  Download from: https://github.com/tonsky/FiraCode"
    echo "  The font will fall back to system monospace if not installed"
    echo ""
fi
echo "Font system (Infrastructure Principle):"
echo "  • Text:   SF Pro (built-in macOS sans-serif)"
echo "  • Prose:  Charter (serif) - requires Prose Mode plugin"
echo "  • Code:   FiraCode (ligatures) → SF Mono (fallback)"
echo ""
echo "Recommended settings:"
echo "  • Base color scheme: Choose Dark or Light (theme adapts to both)"
echo "  • Font size: 16px"
echo ""
echo "\"If the font is telling you to pay attention to it, it's a bad font.\""
echo "Color is rare. When it appears, it means something."
echo ""
