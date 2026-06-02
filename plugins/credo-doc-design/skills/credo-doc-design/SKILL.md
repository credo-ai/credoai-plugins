---
name: credo-doc-design
description: "Generate a brand-compliant Credo AI .docx file with logo, swirl decorations on odd pages, Plus Jakarta Sans typography, brand colors, and proper section styling. Triggers on: new document, branded doc, credo doc, credo template, credo-doc-design."
---

# Credo AI — Branded Document Generator

Produces a `.docx` file matching the official Credo AI brand design system. The skill bundles the actual logo PNG, swirl decoration PNGs, and a Python builder script. No design tools required — output opens in Word or Google Docs ready to publish.

## When to use

User says any of: "create a new doc", "branded document", "credo doc", "write me a [briefing/report/one-pager] for Credo AI", or invokes `/credo-doc-design` directly.

## What gets produced

A single `.docx` file with:
- **Logo** (top-right of every page) — the official triple-chevron mark + "credo ai" wordmark, embedded as PNG
- **Swirl decorations** (top-left + bottom-right corners, behind text) — on **odd pages only** (1, 3, 5...) to provide brand presence without overwhelming
- **Page number** (footer, right-aligned)
- **Typography**: Plus Jakarta Sans (falls back to Calibri if not installed)
- **Brand colors**: `#7B04CA` purple accents, `#161616` near-black body text, `#F2DEFF` callout backgrounds
- Proper heading hierarchy (H1 22pt → H6 9pt, all black)
- Callout boxes with lavender background fill
- Subtle `#D6D6D6` section dividers

## Step 1 — Gather inputs

If the user's request doesn't include all of these, ask for them in one combined message:

1. **Document title** — main page title
2. **Subtitle** — optional secondary line (date, location, etc.)
3. **Content** — section outline, bullets, or full text to populate
4. **Output path** — default: `~/Desktop/<Title>.docx`

If the user gives a rough brief, fill gaps with reasonable assumptions and flag them rather than stalling.

## Step 2 — Build the JSON config

The skill's Python script takes a JSON config with a `blocks` array. Each block has a `type` and optional fields. Supported block types:

| Type | Fields | Purpose |
|---|---|---|
| `signpost` | `text` | Small purple/gray uppercase section label (e.g. "EVENT OVERVIEW") |
| `title` | `text` | 36pt bold document title |
| `subtitle` | `text` | 13pt muted gray subtitle under title |
| `rule` | (none) | Horizontal divider, gray |
| `h1`–`h6` | `text` | Heading levels |
| `body` | `text` OR `parts: [{text, bold, italic, color}]` | Paragraph; use `parts` for inline mixed formatting |
| `lead_para` | `lead`, `rest` | Bold lead-in followed by body text |
| `bullet` | `text` | Standard bullet |
| `bullet_bold` | `lead`, `rest` | Bullet with bold lead phrase |
| `stat` | `number`, `label` | Big purple stat number + descriptive label |
| `callout` | `text` | Lavender background box (use 💡 emoji to mark it as a callout) |
| `quote` | `text` | Indented italic quote in muted gray |
| `caption` | `text` | Small italic gray caption (e.g. "Source: ...") |
| `attribution` | `text` | Centered small gray text for footers like "Prepared for X" |

## Step 3 — Run the builder

Execute via Bash:

```bash
python3 "/Users/jerome/Documents/Credo AI GTM Projects/.claude/skills/credo-doc-design/scripts/build_doc.py" /tmp/credo_doc_config.json
```

Write the config to `/tmp/credo_doc_config.json` first. Example minimal config:

```json
{
  "title": "Document Title",
  "output_path": "~/Desktop/My_Document.docx",
  "swirls": true,
  "blocks": [
    {"type": "signpost", "text": "EXECUTIVE BRIEFING"},
    {"type": "title", "text": "Document Title"},
    {"type": "subtitle", "text": "Subtitle goes here"},
    {"type": "rule"},
    {"type": "signpost", "text": "OVERVIEW"},
    {"type": "body", "text": "Body paragraph content."},
    {"type": "callout", "text": "💡 A highlighted insight."},
    {"type": "rule"},
    {"type": "attribution", "text": "Prepared for Credo AI  |  June 2026"}
  ]
}
```

## Step 4 — Open and verify

After saving:
- `open ~/Desktop/<filename>.docx` to launch in Word
- If Word was already open with a previous version, quit it first: `osascript -e 'tell application "Microsoft Word" to quit saving no'`
- For Google Docs: user uploads to drive.google.com → Open with Google Docs

## Brand Design Reference

### Typography
| Element | Weight | Size | Color |
|---|---|---|---|
| Title | Bold | 36pt | `#161616` |
| Subtitle | Regular | 13pt | `#8A8A8A` |
| H1 | Bold | 22pt | `#161616` |
| H2 | Bold | 16pt | `#161616` |
| H3 | Bold | 13pt | `#161616` |
| H4 | Bold | 11pt | `#161616` |
| H5 | Regular | 10pt | `#8A8A8A` |
| H6 | Regular | 9pt | `#AAAAAA` |
| Body | Regular | 11pt | `#161616` |
| Signpost | Regular | 9pt | `#8A8A8A` |
| Stat number | Bold | 14pt | `#7B04CA` |
| Caption | Italic | 9pt | `#9A9A9A` |
| Quote | Italic | 11pt | `#5A5A5A` |

**Key rules**:
- Headings are BLACK, not purple
- Purple (`#7B04CA`) is reserved for logo, stat numbers, signposts, text links
- Use weight for emphasis, not color
- Left-align everything

### Layout
- Page: US Letter (8.5×11")
- Margins: 1.25" sides, 1.1" top, 1.0" bottom
- Header distance: 0.4"
- Logo in header: 1.8" wide, right-aligned
- Swirls: ~1.4" × 6.4", anchored to page corners, behind text

### Callout Box
- Background: `#F2DEFF` (soft lavender-purple)
- Padding via 0.25" left/right indent
- No left border — full-width fill
- Often marked with 💡 emoji

## Assets

Bundled in `.claude/skills/credo-doc-design/assets/`:
- `credo-logo.png` (4556×784) — official triple-chevron logo
- `swirl.png` (600×2735) — flowing ribbon decoration (transparent bg)
- `swirl-flipped.png` (600×2735) — 180° rotation for bottom-right placement

## Notes

- The `python-docx` package is required: `pip3 install python-docx`
- macOS Chrome is used elsewhere to render SVGs to PNG; the bundled PNGs are pre-rendered so no Chrome dependency at run time
- Word caches open documents — if regenerating, quit Word first to see changes
- The skill auto-detects Plus Jakarta Sans (then falls back to Calibri); install from fonts.google.com for exact brand match
