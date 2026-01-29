# Prose Mode Plugin

Automatically applies a `prose-mode` CSS class to files in `/prose/` directories, enabling serif fonts and prose-optimized styling.

## Features

- **Automatic detection**: Watches for file opens and applies `prose-mode` class when path contains `/prose/`
- **Clean switching**: Removes class when switching to non-prose files
- **Lightweight**: ~50 lines of TypeScript, minimal performance impact
- **Works with Themodynamic Stark theme**: Designed to trigger serif font styling in CSS snippets

## Installation

### Option 1: Automated Install Script

```bash
cd tools/resources/obsidian-prose-mode-plugin
npm install
npm run build
./install.sh
```

The install script will find your vaults and copy the built files automatically.

### Option 2: Manual Build

```bash
cd tools/resources/obsidian-prose-mode-plugin
npm install
npm run build
```

Then copy `main.js` and `manifest.json` to your vault's `.obsidian/plugins/prose-mode/` directory.

### Option 3: Development Mode

```bash
cd tools/resources/obsidian-prose-mode-plugin
npm install
npm run dev
```

This will watch for changes and rebuild automatically.

### Enable the Plugin

1. Open Obsidian Settings → Community Plugins
2. Disable "Safe Mode" (if not already disabled)
3. Enable "Prose Mode" in the installed plugins list
4. Restart Obsidian

## Usage

Simply open any file with `/prose/` in its path. The plugin will automatically:
1. Add the `prose-mode` class to the view container
2. Your CSS snippet will detect this class and apply serif fonts
3. When you switch to a non-prose file, the class is removed

## CSS Integration

This plugin is designed to work with the Themodynamic Stark infrastructure fonts CSS snippet. The CSS should include:

```css
.prose-mode .markdown-source-view.mod-cm6 .cm-content,
.prose-mode .markdown-source-view.mod-cm6 .cm-line,
.prose-mode .markdown-preview-view {
  font-family: "Charter", "Georgia", serif;
  font-size: 18px;
  line-height: 1.8;
}
```

## Development

The plugin watches for:
- `active-leaf-change`: When switching between tabs
- `file-open`: When opening files

It applies the `prose-mode` class to the active leaf's container element when the file path matches the pattern `/prose/`.

## License

MIT
