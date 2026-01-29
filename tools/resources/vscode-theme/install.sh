#!/bin/bash

# Themodynamic Stark VS Code Theme Installer
# This script installs the theme to your VS Code extensions directory

set -e

# Extension folder must follow VS Code naming convention: publisher.name-version
THEME_NAME="kuroki.themodynamic-stark-1.0.0"
THEME_DIR="$HOME/.vscode/extensions/$THEME_NAME"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing Themodynamic Stark VS Code Theme..."

# Remove existing installation if present
if [ -d "$THEME_DIR" ]; then
    echo "Removing existing installation..."
    rm -rf "$THEME_DIR"
fi

# Create extensions directory if it doesn't exist
mkdir -p "$HOME/.vscode/extensions"

# Copy theme files
echo "Copying theme files..."
cp -r "$SCRIPT_DIR" "$THEME_DIR"

# Remove install script from installed version
rm -f "$THEME_DIR/install.sh"

echo ""
echo "✓ Themodynamic Stark theme installed successfully!"
echo ""
echo "To activate:"
echo "  1. Restart VS Code (or run 'Developer: Reload Window')"
echo "  2. Press Cmd+K Cmd+T"
echo "  3. Select 'Themodynamic Dark' or 'Themodynamic Light'"
echo ""
echo "Recommended settings (add to settings.json):"
echo '  "editor.fontFamily": "FiraCode-Regular",'
echo '  "editor.fontLigatures": true,'
echo '  "editor.fontSize": 14'
echo ""
