# Quick Start: Contextual Fonts for Obsidian

## 1. Install Fonts

### Recommended (Option 2 from FONT-RECOMMENDATIONS.md):

**Charter** (Serif for prose)
- Already built into macOS ✅
- No installation needed

**Inter** (Sans-serif for notes)
- Download from: [rsms.me/inter](https://rsms.me/inter/)
- Click "Download family"
- Open the downloaded file
- Install the font (double-click TTF/OTF files)
- Restart Obsidian

**FiraCode** (Monospace for code)
- You may already have this ✅
- If not: [github.com/tonsky/FiraCode](https://github.com/tonsky/FiraCode)

## 2. Install CSS Snippet

**Option A: Automatic (if in your vault)**
```bash
cp contextual-fonts.css "/path/to/your/vault/.obsidian/snippets/"
```

**Option B: Manual**
1. Copy the contents of `contextual-fonts.css`
2. In Obsidian: Settings → Appearance → CSS snippets folder icon (opens folder)
3. Create a new file: `contextual-fonts.css`
4. Paste the contents
5. Save

## 3. Enable the Snippet

1. Open Obsidian Settings (Cmd+,)
2. Go to **Appearance**
3. Scroll to **CSS snippets**
4. Toggle **contextual-fonts** ON ✅
5. Restart Obsidian (or reload with Cmd+R)

## 4. Test It

**Test prose files:**
- Open: `narratives/Hollowgraft/prose/` (any file)
- Should see: Serif font (Charter), larger text, generous line spacing
- Should feel like reading a book

**Test notes files:**
- Open: `world/people/Alice Lieber.md` (or any worldbuilding note)
- Should see: Sans-serif font (Inter), standard size
- Should feel clean and scannable

**Test code blocks:**
- Any file with ` ```code blocks``` ` or \`inline code\`
- Should see: Monospace font (FiraCode) with ligatures

## 5. Fallback Method (if path detection doesn't work)

If the automatic path detection isn't working, use frontmatter:

**For prose files:**
```yaml
---
cssclass: prose-mode
---
```

**For notes files:**
```yaml
---
cssclass: notes-mode
---
```

Add this at the top of any file to manually control which font it uses.

## Customization

### Change Fonts

Edit the CSS snippet at the top:

```css
:root {
  --font-prose-serif: "Charter", "Lora", "Georgia", serif;
  --font-notes-sans: "Inter", "SF Pro", sans-serif;
  --font-code-mono: "FiraCode-Regular", "Fira Code", monospace;
}
```

### Change Font Sizes

```css
:root {
  --font-size-prose: 18px;  /* Make larger/smaller */
  --font-size-notes: 16px;
  --font-size-code: 14px;
}
```

### Change Line Spacing

```css
:root {
  --line-height-prose: 1.8;  /* More/less spacing */
  --line-height-notes: 1.6;
  --line-height-code: 1.5;
}
```

## Troubleshooting

### Fonts aren't changing

1. ✅ Check that CSS snippet is enabled (Settings → Appearance → CSS snippets)
2. ✅ Restart Obsidian
3. ✅ Verify fonts are installed (open Font Book app on macOS)
4. ✅ Try the frontmatter method (`cssclass: prose-mode`)

### Path detection not working

Use the frontmatter method:
- Add `cssclass: prose-mode` to prose files
- Add `cssclass: notes-mode` to note files

### Code blocks using wrong font

Make sure FiraCode is installed:
1. Open Font Book app
2. Search for "Fira Code"
3. If not found, install from [github.com/tonsky/FiraCode](https://github.com/tonsky/FiraCode)

### Want different fonts

See `FONT-RECOMMENDATIONS.md` for alternatives:
- Lora (instead of Charter) - warmer serif
- SF Pro (instead of Inter) - built-in, no install
- JetBrains Mono (instead of FiraCode) - alternative monospace

## Advanced: Enable Debug Mode

Uncomment the debug section in `contextual-fonts.css` to see which mode is active:

```css
/* At the bottom of the file, remove the /* and */ */
.workspace-leaf[data-path*="/prose/"]::before {
  content: "📖 Prose Mode";
  ...
}
```

This will show a small indicator in the top-right corner showing which font mode is active.

## What You Should See

### Prose Files
```
Font: Charter (serif)
Size: 18px (larger)
Line Height: 1.8 (generous)
Feel: Like reading a book
```

### Notes Files
```
Font: Inter (sans-serif)
Size: 16px (standard)
Line Height: 1.6 (comfortable)
Feel: Clean, scannable
```

### Code Blocks
```
Font: FiraCode (monospace)
Size: 14px (compact)
Ligatures: Enabled (→, ≥, !=)
```

---

**That's it!** Your Obsidian vault now has context-aware fonts that automatically switch between prose and notes modes.
