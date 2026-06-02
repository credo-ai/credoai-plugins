# credo-doc-design

A Claude Code skill that generates brand-compliant Credo AI documents (`.docx`) with the official design system applied automatically — logo, swirl decorations, typography, and brand colors.

## What it does

Invoke `/credo-doc-design` (or describe what you need: "create a Credo AI executive briefing on X") and Claude will generate a `.docx` file that matches the official Credo AI brand template:

- **Logo** — official triple-chevron mark + "credo ai" wordmark, top-right of every page
- **Swirl decorations** — brand ribbon line art on odd pages (top-left + bottom-right corners, behind text)
- **Typography** — Plus Jakarta Sans (falls back to Calibri)
- **Brand colors** — `#7B04CA` purple accents, `#161616` near-black body, `#F2DEFF` callout backgrounds
- **Page number footer** — right-aligned, every page

## Requirements

- Python 3 with `python-docx`: `pip3 install python-docx`
- Plus Jakarta Sans font (optional, for exact brand match): install from [fonts.google.com](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- macOS with Microsoft Word or Google Docs for viewing

## Supported block types

The skill accepts structured content blocks:

| Type | Purpose |
|---|---|
| `signpost` | Small muted section label (e.g. "EVENT OVERVIEW") |
| `title` | 36pt bold document title |
| `subtitle` | 13pt muted gray subtitle |
| `rule` | Horizontal divider |
| `h1`–`h6` | Heading hierarchy |
| `body` | Body paragraph (supports inline `parts` for mixed bold/italic) |
| `lead_para` | Bold lead-in + body text |
| `bullet` / `bullet_bold` | List items |
| `stat` | Large purple stat number + label |
| `callout` | Lavender background highlight box |
| `quote` | Indented italic quote |
| `caption` | Small gray source/caption line |
| `attribution` | Centered footer attribution |

## Usage

```
/credo-doc-design
```

Then describe your document — title, type, and content. Claude will assemble the JSON config and run the builder script.

## Assets

Bundled brand assets (pre-rendered PNGs from the official SVGs):

- `assets/credo-logo.png` — official logo (4556×784)
- `assets/swirl.png` — flowing ribbon decoration (600×2735, transparent)
- `assets/swirl-flipped.png` — 180° rotated swirl for bottom-right placement

## About Credo AI

[Credo AI](https://www.credo.ai) is the enterprise AI Governance, Risk, and Compliance platform — helping organizations discover, govern, and monitor AI across models, agents, applications, and third-party vendors.
