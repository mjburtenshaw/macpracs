---
cssclass: prose-mode
---

# Font Test Document

This document tests all font contexts in the Themodynamic Stark theme.

## Prose Mode Test

This paragraph should appear in **Charter** (or your chosen serif font). The font should feel literary, book-like, and comfortable for extended reading. The line height should be generous (1.8), and the font size should be larger (18px by default).

This is a longer paragraph to test readability. When you write long-form narrative prose, the serif font should create a sense of immersion and comfort. The characters should be distinct and easy to read. The spacing should encourage a natural reading rhythm. If you're seeing this in Charter, you'll notice it has a classic, authoritative quality that's perfect for Colt Mercer's chronicles.

**Bold text** should remain readable and **_bold italic_** should work well too. *Italic text* should have distinct letterforms that don't interfere with readability.

## Inline Elements Test

Here we test `inline code` which should appear in monospace (FiraCode). The code should be distinct from the surrounding text but not jarring.

Here's a link: [[Internal Link]] and [External Link](https://example.com).

Here's a tag: #example-tag

## Block Elements Test

> This is a blockquote. It should maintain the serif font in prose mode, appearing in Charter. Blockquotes in prose often represent character dialogue or emphasized passages.

### Lists

- Unordered list item in serif
- Another item
  - Nested item
  - Another nested

1. Ordered list in serif
2. Second item
3. Third item

### Code Blocks

```javascript
// This should appear in FiraCode (monospace)
function example() {
  const variable = "test";
  return variable !== null ? variable : "default";
}
```

The code block above should show:
- Monospace font (FiraCode)
- Ligatures enabled (→, ≥, !=, !==)
- Proper syntax highlighting colors from Themodynamic Stark

### Tables

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

## Font Comparison

If you switch this file's `cssclass` from `prose-mode` to `notes-mode`, you should see:

**Prose Mode (Charter):**
- Serif font with serifs on letters
- Slightly larger (18px)
- More generous line spacing
- Feels literary and book-like

**Notes Mode (Inter):**
- Sans-serif font, no serifs
- Standard size (16px)
- Tighter line spacing
- Feels clean and functional

## Testing Character Set

### Common Characters
The quick brown fox jumps over the lazy dog.
THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG.
0123456789

### Punctuation
"Quotation marks" and 'single quotes'
Em dash — and en dash –
Ellipsis… and question?

### Special Characters (if supported)
← → ⇒ ≠ ≤ ≥ ∞ √ ∑ ∏ ∂ ∫

## Prose Paragraph Flow

The first paragraph after a heading or break should have normal margin.

This second paragraph should flow naturally from the first. In traditional book typography, subsequent paragraphs might have a first-line indent, but we've kept it simple with spacing for screen readability.

This third paragraph demonstrates that the rhythm and flow should feel natural when reading multiple paragraphs in sequence. The generous line height (1.8) creates breathing room without feeling too loose.

---

## How to Use This Test

1. **Open this file in Obsidian**
2. **Check the top** - If it says `cssclass: prose-mode`, it's using serif (Charter)
3. **Toggle modes:**
   - Change to `cssclass: notes-mode` to see sans-serif (Inter)
   - Remove the cssclass line entirely to use default (sans-serif)
4. **Compare readability** - Which feels better for long-form writing?
5. **Check code blocks** - Are ligatures showing properly?

## Expected Results

### In Prose Mode (cssclass: prose-mode)
- ✅ Body text: Charter (serif), 18px, 1.8 line height
- ✅ Inline code: FiraCode (monospace)
- ✅ Code blocks: FiraCode with ligatures
- ✅ Generous paragraph spacing
- ✅ Book-like reading experience

### In Notes Mode (cssclass: notes-mode)
- ✅ Body text: Inter (sans-serif), 16px, 1.6 line height
- ✅ Inline code: FiraCode (monospace)
- ✅ Code blocks: FiraCode with ligatures
- ✅ Standard paragraph spacing
- ✅ Clean, scannable experience

### Code Elements (Both Modes)
- ✅ Monospace font (FiraCode)
- ✅ Ligatures enabled (→ instead of ->)
- ✅ Syntax colors from Themodynamic Stark
- ✅ Slightly smaller than body text

---

*If everything looks correct, you're all set! The contextual fonts are working properly.*
