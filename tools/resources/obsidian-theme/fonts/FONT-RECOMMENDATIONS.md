# Themodynamic Stark - Font Recommendations

## Context-Based Font System for Obsidian

This system uses different fonts based on file location:
- **Prose files** (`/prose/` in path) → Serif font
- **Everything else** → Sans-serif font
- **Code blocks** → Monospace font

---

## Recommended Font Families

### Option 1: The System Scholar (Zero Setup)

**Prose (Serif):** Iowan Old Style
- Built into macOS (Book app font)
- Excellent readability for long-form narrative
- Traditional book-like feel
- Designed for extended reading

**Notes (Sans-serif):** SF Pro
- macOS system font
- Clean, functional, highly legible
- Doesn't compete with content
- Zero setup required

**Code (Monospace):** SF Mono
- macOS system monospace
- Clean, technical
- Good spacing for code

**Pros:**
- ✅ Built into macOS
- ✅ Zero installation
- ✅ Optimized for screen display
- ✅ Professional appearance

**Cons:**
- ❌ macOS only
- ❌ Less distinctive

---

### Option 2: The Literary Chronicler (Recommended)

**Prose (Serif):** Charter
- Designed by Matthew Carter
- Classic, timeless, authoritative
- Excellent readability
- Built into macOS (also called "Charter BT")
- Perfect for Colt's "field notes" aesthetic

**Notes (Sans-serif):** Inter
- Modern, highly legible
- Designed for UI but great for text
- Open source (download from Google Fonts)
- Excellent at all sizes

**Code (Monospace):** FiraCode
- Your current choice
- Great ligatures
- Designed for code
- Open source

**Pros:**
- ✅ Charter built into macOS
- ✅ Distinctive but not distracting
- ✅ Excellent prose readability
- ✅ Professional, literary feel
- ✅ Inter free and cross-platform

**Cons:**
- ⚠️ Need to install Inter

---

### Option 3: The Open Source Scholar

**Prose (Serif):** Lora
- Designed for body text
- Brushed curves, contemporary feel
- Excellent for creative writing
- Free from Google Fonts
- Similar to Charter but slightly warmer

**Notes (Sans-serif):** Inter
- Same as Option 2
- Pairs beautifully with Lora

**Code (Monospace):** JetBrains Mono
- Excellent ligatures
- Designed for developers
- Very readable
- Free and open source

**Pros:**
- ✅ All free and open source
- ✅ Cross-platform
- ✅ Lora is warmer, more inviting than Charter
- ✅ JetBrains Mono has great features

**Cons:**
- ⚠️ Need to install all fonts

---

### Option 4: The Adobe Professional

**Prose (Serif):** Source Serif 4
- Part of Adobe's Source family
- Designed for long-form reading
- Clean, modern serif
- Free and open source
- Excellent web font

**Notes (Sans-serif):** Source Sans 3
- Companion to Source Serif
- Professional, clean
- Great for UI and text

**Code (Monospace):** Source Code Pro
- Completes the family
- Designed for code
- Very readable

**Pros:**
- ✅ Designed as cohesive family
- ✅ All open source
- ✅ Professional appearance
- ✅ Cross-platform

**Cons:**
- ⚠️ Need to install all fonts
- ⚠️ Less distinctive than Charter/Lora

---

## My Recommendation for Themodynamic Stark

### **Option 2: The Literary Chronicler**

**Rationale:**
1. **Charter** perfectly matches the "archival field notes" aesthetic
   - Built into macOS (no installation)
   - Designed by one of the greatest type designers
   - Has gravitas without being pretentious
   - Excellent for Colt's voice in prose

2. **Inter** is the modern standard for UI/documentation
   - Clean, doesn't compete with content
   - Perfect for Alice's practical, direct voice in notes
   - Easy to install (one download)

3. **FiraCode** you're already using
   - Great ligatures
   - Technical, precise
   - Good for structural elements

### Character Alignment

- **Charter (prose)** → Colt's formal Oswikaric chronicles
- **Inter (notes)** → Alice's practical worldbuilding notes
- **FiraCode (code)** → Technical structure and code

---

## Font Sizes

### For Prose (Serif)
- **Editor:** 18px (larger for comfort during long writing sessions)
- **Line height:** 1.8 (generous spacing for readability)
- **Paragraph spacing:** 1.2em

### For Notes (Sans-serif)
- **Editor:** 16px (standard)
- **Line height:** 1.6 (tighter for scanning)
- **Paragraph spacing:** 1em

### For Code (Monospace)
- **Inline code:** 0.9em (slightly smaller than body)
- **Code blocks:** 14px (readable but distinct)
- **Line height:** 1.5

---

## Installation Instructions

### Charter (Built-in)
Already installed on macOS as "Charter" or "Charter BT"

### Inter
1. Download from [rsms.me/inter](https://rsms.me/inter/)
2. Install the variable font or install individual weights
3. Restart Obsidian

### FiraCode (if not installed)
1. Download from [GitHub](https://github.com/tonsky/FiraCode)
2. Install the TTF or OTF files
3. Restart Obsidian

---

## Alternative Recommendations

If Charter doesn't feel right, try:

**For Prose:**
- **Lora** (Google Fonts) - Warmer, more contemporary
- **Crimson Text** (Google Fonts) - More scholarly, traditional
- **EB Garamond** (Google Fonts) - Classic, literary
- **Literata** (Google Fonts) - Designed for Google Books, optimized for screens

**For Notes:**
- **SF Pro** (Built-in macOS) - Zero setup
- **Source Sans 3** (Adobe) - Professional, clean
- **IBM Plex Sans** (IBM) - Technical but humanist

**For Code:**
- **JetBrains Mono** - Excellent ligatures, modern
- **SF Mono** (Built-in macOS) - Apple's monospace
- **Cascadia Code** (Microsoft) - Great for Windows users

---

## Testing Your Fonts

After installing, open these files to test:

**Prose test:**
- `narratives/Hollowgraft/prose/` (any file)
- Should display in Charter (serif)

**Notes test:**
- Any worldbuilding file (e.g., `world/people/Alice Lieber.md`)
- Should display in Inter (sans-serif)

**Code test:**
- Any file with code blocks
- Should display in FiraCode (monospace)

---

## Next Steps

1. Choose your font family (I recommend Option 2)
2. Install any missing fonts
3. Apply the CSS snippet (see `contextual-fonts.css`)
4. Restart Obsidian
5. Test in prose vs. notes files

The CSS snippet will automatically apply the right font based on file path!
