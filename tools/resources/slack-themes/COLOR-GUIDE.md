# Slack Theme Color Position Guide

This guide shows which hex code controls which part of the Slack interface.

## Slack Theme Format

Slack themes use 10 comma-separated hex codes:

```
#1,#2,#3,#4,#5,#6,#7,#8,#9,#10
```

## Visual Breakdown

```
┌─────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                     │
│  Background: #9 | Text: #10                             │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │  Main Chat Area                              │
│ #1       │                                              │
│          │                                              │
│ Channels │                                              │
│ Normal   │                                              │
│ #6       │                                              │
│          │                                              │
│ Hover    │                                              │
│ #2 + #5  │                                              │
│          │                                              │
│ Active   │                                              │
│ #3 + #4  │                                              │
│          │                                              │
│ • Online │                                              │
│   #7     │                                              │
│          │                                              │
│ (1) @    │                                              │
│  #8      │                                              │
└──────────┴──────────────────────────────────────────────┘
```

## Position Details

### 1. Column Background (`#1`)
- **What**: Left sidebar main background
- **Dark**: `#131114` (Void 0 - deepest shadow)
- **Light**: `#edebe4` (Key 1 - standard paper)

### 2. Menu Background Hover (`#2`)
- **What**: Background when hovering over channels/DMs
- **Dark**: `#201d21` (Void 1 - standard dark)
- **Light**: `#e0ddd3` (Key 0 - aged parchment)

### 3. Active Item (`#3`)
- **What**: Background of selected/active channel
- **Dark**: `#7a2656` (Memory.Grace 2 - deep Tyrian)
- **Light**: `#7a2656` (Memory.Grace 2 - same accent)
- **Most visible accent color**

### 4. Active Item Text (`#4`)
- **What**: Text color for selected channel
- **Dark**: `#edebe4` (Key 1 - paper white)
- **Light**: `#f7f6f2` (Key 2 - brightest)

### 5. Hover Item (`#5`)
- **What**: Additional hover state color
- **Dark**: `#2f2c30` (Void 2 - lightest dark)
- **Light**: `#f7f6f2` (Key 2 - brightest)

### 6. Text Color (`#6`)
- **What**: Default text in sidebar
- **Dark**: `#edebe4` (Key 1 - paper white)
- **Light**: `#201d21` (Void 1 - dark text)

### 7. Active Presence (`#7`)
- **What**: Green dot for online status
- **Dark**: `#92b282` (Memory.Sage 1 - sage green)
- **Light**: `#4a6b3a` (Memory.Sage 3 - deep forest)

### 8. Mention Badge (`#8`)
- **What**: Red badge for @mentions and unread counts
- **Dark**: `#ad7676` (Memory.Whispers 0 - muted rose)
- **Light**: `#5c2828` (Memory.Whispers 2 - wine)

### 9. Top Nav Background (`#9`)
- **What**: Background of top navigation bar
- **Dark**: `#0f0e10` (Void 0 darker)
- **Light**: `#f7f6f2` (Key 2 - brightest)

### 10. Top Nav Text (`#10`)
- **What**: Text in top navigation bar
- **Dark**: `#849ab8` (Memory.Silver 1 - storm gray)
- **Light**: `#5a708f` (Memory.Silver 2 - steel blue)

## Creating Custom Variants

### To Change the Accent Color

Replace position **#3** (Active Item) with any Memory color:

**Purple Variants:**
- `#cc6aa2` (Memory.Grace 0) - Light purple
- `#a3457a` (Memory.Grace 1) - Medium purple
- `#7a2656` (Memory.Grace 2) - Deep purple **[default]**
- `#521035` (Memory.Grace 3) - Darkest purple

**Orange Variants (Colt's eyes):**
- `#e09970` (Memory.Wrath 0) - Light orange
- `#ad6c45` (Memory.Wrath 1) - Medium orange
- `#7a4322` (Memory.Wrath 2) - Deep orange
- `#47210b` (Memory.Wrath 3) - Darkest orange

**Green Variants (Alice's eyes):**
- `#bcd6b0` (Memory.Sage 0) - Pale sage
- `#92b282` (Memory.Sage 1) - Sage green
- `#6d8f5b` (Memory.Sage 2) - Forest green
- `#4a6b3a` (Memory.Sage 3) - Deep forest

**Blue Variants (Silver's eyes):**
- `#b4c6e0` (Memory.Silver 0) - Pale silver
- `#849ab8` (Memory.Silver 1) - Storm gray
- `#5a708f` (Memory.Silver 2) - Steel blue
- `#364a66` (Memory.Silver 3) - Deep storm

**Yellow Variants (Mary's hair):**
- `#f5efc9` (Memory.Garden 0) - Pale wheat
- `#d1c997` (Memory.Garden 1) - Sandy blonde
- `#ada56c` (Memory.Garden 2) - Dusty gold
- `#8a8148` (Memory.Garden 3) - Dark amber

**Red Variants (Alice's favorite):**
- `#ad7676` (Memory.Whispers 0) - Muted rose
- `#854a4a` (Memory.Whispers 1) - Burgundy
- `#5c2828` (Memory.Whispers 2) - Wine
- `#330f0f` (Memory.Whispers 3) - Deep blood

### To Change the Mention Badge

Replace position **#8** (Mention Badge) to match or contrast with your accent.

## Examples

### Full Purple Theme (Dark)
All accents use Memory.Grace:
```
#131114,#201d21,#a3457a,#edebe4,#2f2c30,#edebe4,#92b282,#cc6aa2,#0f0e10,#849ab8
```

### Colt's Theme (Dark)
Orange accents from Colt's eyes:
```
#131114,#201d21,#ad6c45,#edebe4,#2f2c30,#edebe4,#92b282,#e09970,#0f0e10,#849ab8
```

### Alice's Theme (Dark)
Green accents from Alice's eyes:
```
#131114,#201d21,#6d8f5b,#edebe4,#2f2c30,#edebe4,#92b282,#ad7676,#0f0e10,#849ab8
```

### Silver's Theme (Dark)
Blue accents from Silver's eyes:
```
#131114,#201d21,#5a708f,#edebe4,#2f2c30,#edebe4,#92b282,#ad7676,#0f0e10,#849ab8
```

---

*"Color is rare. When it appears, it means something."*
