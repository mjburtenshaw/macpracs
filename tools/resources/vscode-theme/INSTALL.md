# Installation Guide

## Method 1: Install from VS Code Marketplace (Coming Soon)

1. Open VS Code
2. Press `Cmd+Shift+X` (macOS) or `Ctrl+Shift+X` (Windows/Linux)
3. Search for "Themodynamic Stark"
4. Click Install
5. Press `Cmd+K Cmd+T` to open the theme picker
6. Select "Themodynamic Dark" or "Themodynamic Light"

## Method 2: Manual Installation (Current)

### macOS/Linux

```bash
# Copy theme to VS Code extensions directory
cp -r themodynamic-stark ~/.vscode/extensions/
```

### Windows

```powershell
# Copy theme to VS Code extensions directory
Copy-Item -Path themodynamic-stark -Destination $env:USERPROFILE\.vscode\extensions\ -Recurse
```

### After Installation

1. Restart VS Code (or run "Developer: Reload Window" from the command palette)
2. Press `Cmd+K Cmd+T` (macOS) or `Ctrl+K Ctrl+T` (Windows/Linux)
3. Select "Themodynamic Dark" or "Themodynamic Light"

## Recommended Font

For the best experience, use a monospace font with ligature support:

- **FiraCode** (used in screenshots)
- JetBrains Mono
- Cascadia Code
- Victor Mono

To enable font ligatures in VS Code:

```json
{
  "editor.fontFamily": "FiraCode-Regular",
  "editor.fontLigatures": true,
  "editor.fontSize": 14
}
```

## Recommended Settings

For the full Themodynamic Stark aesthetic:

```json
{
  "workbench.colorTheme": "Themodynamic Dark",
  "editor.fontFamily": "FiraCode-Regular",
  "editor.fontSize": 14,
  "editor.lineHeight": 24,
  "editor.fontLigatures": true,
  "editor.semanticHighlighting.enabled": true,
  "editor.bracketPairColorization.enabled": true,
  "workbench.tree.indent": 20,
  "terminal.integrated.fontSize": 13,
  "terminal.integrated.lineHeight": 1.3
}
```

## Customization

If you want to customize colors, add this to your `settings.json`:

```json
{
  "workbench.colorCustomizations": {
    "[Themodynamic Dark]": {
      // Your custom colors here
      "editor.background": "#131114"
    }
  },
  "editor.tokenColorCustomizations": {
    "[Themodynamic Dark]": {
      // Your custom token colors here
    }
  }
}
```

## Troubleshooting

### Theme doesn't appear in theme picker

1. Make sure the folder is in the correct location: `~/.vscode/extensions/themodynamic-stark/`
2. Restart VS Code
3. Run "Developer: Reload Window" from the command palette (`Cmd+Shift+P`)

### Colors look wrong

1. Make sure you're using VS Code version 1.60.0 or higher
2. Check that no other extensions are overriding theme colors
3. Disable "Semantic Highlighting" if colors look unexpected:
   ```json
   {
     "editor.semanticHighlighting.enabled": false
   }
   ```

### Terminal colors don't match

Make sure you're using the integrated terminal in VS Code, not an external terminal application.

## Support

For issues or questions, please file an issue at the GitHub repository.
