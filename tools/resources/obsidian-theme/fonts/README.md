# Themodynamic Stark - Font System

Context-aware fonts for Obsidian that automatically switch between prose and notes modes.

---

## 🎯 The Problem

American Typewriter is great for aesthetics but gets strained for:
- Long-form creative writing (too decorative)
- Technical documentation (too narrow)
- Extended reading sessions (not optimized for screens)

## ✨ The Solution

**Context-aware fonts** that automatically switch based on file location:

| Context | Font | Size | Use Case |
|---------|------|------|----------|
| **Prose files** | Charter (serif) | 18px | Creative writing, narrative |
| **Notes files** | Inter (sans-serif) | 16px | Documentation, worldbuilding |
| **Code blocks** | FiraCode (mono) | 14px | Code, technical content |

---

## 📚 Files in This Directory

### `contextual-fonts.css` ⭐
**The main CSS snippet** - copy this to your vault's snippets folder

### `QUICK-START.md` 🚀
**Installation guide** - start here if you want to set this up now

### `FONT-RECOMMENDATIONS.md` 📖
**Detailed font analysis** - read this to understand the font choices

### `FONT-TEST.md` 🧪
**Test document** - use this to verify fonts are working correctly

---

## 🎨 Recommended Fonts

### Option 2: The Literary Chronicler (Recommended)

**Prose:** Charter
- Built into macOS ✅
- Classic, authoritative
- Perfect for Colt's chronicles

**Notes:** Inter
- Download from [rsms.me/inter](https://rsms.me/inter/)
- Modern, highly legible
- Great for Alice's notes

**Code:** FiraCode
- You're already using this ✅
- Excellent ligatures
- Technical precision

---

## 🚀 Quick Install

### 1. Install Fonts
```bash
# Charter - already on macOS ✅
# Inter - download from rsms.me/inter
# FiraCode - already installed ✅
```

### 2. Copy CSS Snippet
```bash
cp contextual-fonts.css "/path/to/vault/.obsidian/snippets/"
```

### 3. Enable in Obsidian
Settings → Appearance → CSS snippets → Toggle ON

### 4. Test
Open a file in `narratives/Hollowgraft/prose/` - should use serif
Open a file in `world/` - should use sans-serif

---

## 🎭 How It Works

### Automatic Path Detection

The CSS snippet looks for `/prose/` in the file path:

```
✅ narratives/Hollowgraft/prose/scene-01.md → Serif (Charter)
✅ world/people/Alice Lieber.md → Sans-serif (Inter)
✅ guides/Production.md → Sans-serif (Inter)
```

### Manual Frontmatter Control

If automatic detection doesn't work, use frontmatter:

```yaml
---
cssclass: prose-mode
---
```

This forces the file to use serif fonts regardless of location.

---

## 🎨 Character Alignment

The font choices align with character voices:

- **Charter (prose)** → Colt's formal Oswikaric chronicles
- **Inter (notes)** → Alice's practical worldbuilding notes
- **FiraCode (code)** → Technical structure and precision

---

## 📊 Font Comparison

### American Typewriter (Current)
- ❌ Too decorative for long text
- ❌ Narrow letterforms strain eyes
- ❌ Not optimized for screens
- ✅ Has personality

### Charter (Recommended for Prose)
- ✅ Classic, timeless
- ✅ Excellent readability
- ✅ Authoritative but not stuffy
- ✅ Built into macOS
- ✅ Perfect for creative writing

### Inter (Recommended for Notes)
- ✅ Modern, clean
- ✅ Highly legible at all sizes
- ✅ Great for scanning
- ✅ Doesn't compete with content
- ✅ Professional appearance

---

## 🔧 Customization

All customization happens in `contextual-fonts.css` at the top:

```css
:root {
  /* Change fonts */
  --font-prose-serif: "Charter", "Lora", serif;
  --font-notes-sans: "Inter", "SF Pro", sans-serif;
  --font-code-mono: "FiraCode-Regular", monospace;

  /* Change sizes */
  --font-size-prose: 18px;
  --font-size-notes: 16px;
  --font-size-code: 14px;

  /* Change spacing */
  --line-height-prose: 1.8;
  --line-height-notes: 1.6;
  --line-height-code: 1.5;
}
```

---

## 🌟 Alternative Fonts

Don't like Charter or Inter? Try these:

### For Prose (instead of Charter)
- **Lora** - Warmer, more contemporary
- **Crimson Text** - Traditional, scholarly
- **EB Garamond** - Classic, literary
- **Iowan Old Style** - macOS system font, book-like

### For Notes (instead of Inter)
- **SF Pro** - Built-in macOS, zero setup
- **Source Sans 3** - Professional, clean
- **IBM Plex Sans** - Technical but humanist

### For Code (instead of FiraCode)
- **JetBrains Mono** - Excellent alternative
- **SF Mono** - Built-in macOS
- **Cascadia Code** - Good Windows option

---

## ❓ FAQ

### Q: Will this work with the Themodynamic Stark theme?
**A:** Yes! This CSS snippet is designed to complement the theme.

### Q: What if I want different fonts?
**A:** Edit the CSS variables at the top of `contextual-fonts.css`

### Q: Can I use this with other themes?
**A:** Yes, it's theme-independent

### Q: What if path detection doesn't work?
**A:** Use frontmatter: `cssclass: prose-mode` or `notes-mode`

### Q: Will this slow down Obsidian?
**A:** No, CSS snippets are very lightweight

### Q: Can I disable it temporarily?
**A:** Yes, toggle off in Settings → Appearance → CSS snippets

---

## 📁 File Organization

Recommended structure for automatic font switching:

```
vault/
├── narratives/
│   └── Hollowgraft/
│       └── prose/           ← Serif fonts
│           ├── scene-01.md
│           └── scene-02.md
├── world/                   ← Sans-serif fonts
│   ├── people/
│   ├── places/
│   └── magic/
└── guides/                  ← Sans-serif fonts
    └── Production.md
```

---

## 🎯 Next Steps

1. **Read** `QUICK-START.md` for installation
2. **Install** fonts (Charter + Inter)
3. **Copy** `contextual-fonts.css` to snippets folder
4. **Enable** the snippet in Obsidian
5. **Test** with `FONT-TEST.md`
6. **Customize** if needed

---

*"Color is rare. When it appears, it means something."*

The same principle applies to fonts—each context gets the right tool for its purpose.
