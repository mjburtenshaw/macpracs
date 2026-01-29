# Themodynamic Stark - Obsidian Theme

> *"The system does not seek peace. It seeks containment."*

A zero-sum narrative economy rendered in color. An Obsidian theme where color is rare—when it appears, it means something.

![Themodynamic Stark Preview](preview-dark.png)

## Design Philosophy

**Aesthetic Origin**: Pops of meaningful color against an otherwise desaturated world.

The palette is organized according to the Eldritch Keys cosmology from the Kuroki fantasy universe:

- **Void Band** (3 colors): Forgetting, absence, silence - for backgrounds and shadows
- **Key Band** (3 colors): Preservation, clarity, witness - for paper and highlights
- **Memory Band** (24 colors): What we preserve - character-themed chromatic colors

## Features

### Both Light & Dark Modes
- Seamlessly switches between dark and light themes
- Optimized for extended reading and writing sessions
- Carefully calibrated contrast ratios (WCAG AAA compliant)

### Character-Themed Colors

Every chromatic color in the theme is tied to a specific character from the Hollowgraft narrative:

| Color | Character | Significance | Usage in Theme |
|-------|-----------|--------------|----------------|
| **Memory.Wrath** (orange) | Colt's eye striations | Outlier from space | Numbers, warnings |
| **Memory.Grace** (purple) | Colt's scarf | Tyrian regal | Headers, accents, links |
| **Memory.Silver** (blue) | Silver's eyes | Storm gray | Comments, muted text |
| **Memory.Garden** (yellow) | Mary Feybrook's hair | Wheat-toned | Functions, bold text |
| **Memory.Whispers** (red) | Alice's favorite | Burgundy/wine | Errors, critical items |
| **Memory.Sage** (green) | Alice's eyes | Earthy green | Strings, code, success |

### Comprehensive Styling

- **Editor**: Live preview and source mode fully styled
- **Graph View**: Themed nodes and connections
- **File Explorer**: Clean navigation with hover states
- **Tables**: Alternating row colors for readability
- **Code Blocks**: Syntax highlighting with character colors
- **Blockquotes**: Subtle background with left border
- **Tags**: Distinctive but not overwhelming
- **Task Lists**: Styled checkboxes
- **Links**: Internal and external link differentiation

## Installation

### Method 1: Manual Installation

1. Download `manifest.json` and `theme.css`
2. Copy both files to your vault's themes folder:
   ```
   YourVault/.obsidian/themes/Themodynamic Stark/
   ```
3. Open Obsidian Settings → Appearance
4. Under "Themes", select "Themodynamic Stark"

### Method 2: Using the Install Script (macOS/Linux)

```bash
cd obsidian-theme
./install.sh
```

The script will:
- Find your Obsidian vault(s)
- Install the theme to the selected vault
- Activate the theme automatically

### Method 3: Via Obsidian Community Themes (Coming Soon)

1. Open Obsidian Settings → Appearance
2. Click "Manage" under Community Themes
3. Search for "Themodynamic Stark"
4. Click "Use"

## Recommended Settings

For the optimal Themodynamic Stark experience:

### Editor Settings
```
Editor → Readable line length: ON
Editor → Show line numbers: ON
Editor → Indent using tabs: ON
```

### Appearance Settings
```
Appearance → Base color scheme: Dark/Light (theme adapts to both)
Appearance → Font size: 16px
Appearance → Editor font: System font (or SF Mono)
Appearance → Monospace font: FiraCode-Regular (if available)
```

### Recommended Plugins

These plugins complement the Themodynamic Stark aesthetic:

- **Dataview**: Query and display your notes
- **Calendar**: Visual date navigation
- **Excalidraw**: Drawings integrate well with the palette
- **Graph Analysis**: Enhanced graph view functionality
- **Smart Connections**: AI-powered semantic search

## Customization

### Custom CSS Snippets

To customize specific aspects, create a CSS snippet in `.obsidian/snippets/`:

#### Example: Adjust Header Colors

```css
/* custom-headers.css */
.theme-dark .cm-header-1,
.theme-dark .markdown-preview-view h1 {
  color: var(--grace-0); /* Lighter purple */
}
```

#### Example: Change Link Color

```css
/* custom-links.css */
.theme-dark {
  --link-color: var(--grace-1); /* Purple instead of blue */
}
```

### Available Color Variables

All palette colors are available as CSS variables:

**Void Band:**
- `--void-0`, `--void-1`, `--void-2`

**Key Band:**
- `--key-0`, `--key-1`, `--key-2`

**Memory Colors:**
- `--whispers-0` through `--whispers-3` (red)
- `--wrath-0` through `--wrath-3` (orange)
- `--sage-0` through `--sage-3` (green)
- `--silver-0` through `--silver-3` (blue)
- `--garden-0` through `--garden-3` (yellow)
- `--grace-0` through `--grace-3` (purple)

## Troubleshooting

### Theme doesn't appear in list

1. Check that both `manifest.json` and `theme.css` are in the themes folder
2. Folder structure should be: `.obsidian/themes/Themodynamic Stark/`
3. Restart Obsidian

### Colors look wrong in graph view

1. Open Settings → Graph view
2. Reset "Color groups" to default
3. Let the theme's CSS variables control colors

### Some elements don't match the theme

This may be due to:
- **Custom CSS snippets** overriding theme styles
- **Plugins** with their own styling
- **Base theme mismatch** - ensure Obsidian's base theme matches (Settings → Appearance → Base color scheme)

To debug:
1. Disable all CSS snippets
2. Disable non-essential plugins
3. Re-enable one at a time to find conflicts

## Development

### Building from Source

The theme is pure CSS with no build process required. Simply edit `theme.css` and reload Obsidian.

### Contributing

If you'd like to contribute improvements:

1. Fork the repository
2. Make your changes
3. Test in both light and dark modes
4. Submit a pull request

### Color Palette Reference

Full palette documentation: `guides/Production -- The Bureau -- Art -- Color Palette.md`

## Credits

**Theme**: Malcolm Burtenshaw
**Palette**: Themodynamic Stark (30 colors)
**Universe**: Kuroki - The Hollowgraft narrative
**Version**: 1.0.0
**License**: MIT

## Support

For issues, questions, or feature requests:
- GitHub Issues: [github.com/mjburtenshaw/macpracs](https://github.com/mjburtenshaw/macpracs)
- Obsidian Forum: Tag @mjburtenshaw

---

*Part of the Kuroki creative writing project. "Color is rare. When it appears, it means something."*
