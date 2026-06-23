---
name: aigov-audit-viz
description: Use when the user wants to visualize a governance audit as an interactive HTML dashboard. Trigger whenever a governance audit exists and the user wants a presentable artifact for executives, regulators, or board reviews — even if they just say "make this look nice", "turn this into a dashboard", "audit dashboard", or after running aigov-audit they ask to share or present it.
---

# Governance Audit Visualizer

## Overview

Transform a governance audit (the markdown produced by `aigov-audit`) into a beautiful, self-contained interactive HTML dashboard branded for Credo AI. This is the most external-facing artifact in the pipeline — what you'd show a regulator, board, or auditing customer.

Single `.html` file, no server, no dependencies, rendered as a **multi-page document** (one section visible at a time, switched via a sticky top nav) — not one long scroll. Two audiences:

- **Executives / board** want a 1-page posture summary with residual risk and compliance at a glance — page 1 (the cover) delivers it.
- **Compliance officers / auditors** want to drill into per-control effectiveness, evidence reasoning, and recommended actions — the later pages carry the depth.

## Design foundation

This skill renders in the **product dashboard register** defined in the plugin's shared report design foundation — read `design/REPORT_DESIGN.md` before generating:

```python
import glob, os
patterns = [
    os.path.expanduser("~/.claude/plugins/cache/credoai-plugins/governance-intelligence-pro/*/design/REPORT_DESIGN.md"),
    os.path.expanduser("~/.claude/plugins/cache/*/governance-intelligence-pro/*/design/REPORT_DESIGN.md"),
    "plugins/governance-intelligence-pro/design/REPORT_DESIGN.md",  # repo checkout fallback
]
```

The foundation carries the universal rules (single self-contained file, tokens-not-Tailwind-defaults, Feather icons, logo handling, voice, title/filename/footer contracts), the **paged layout contract** (multi-page navigation, `goToPage`, cross-section focus, print stylesheet), the **copy quality bar**, and the report idioms catalog. This file carries only what is specific to the product register and the audit dashboard. Do NOT use the marketing tokens here — this register uses the product tokens bundled under `aigov-plan-viz/assets/`.

**Paged layout — read this first.** This dashboard uses the multi-page shell from `design/paged-report-shell.html` ("Paged layout (multi-page navigation)" in the foundation). Copy that markup and script wholesale; only the page content and the product token values change. Every section below is a `.page` container, exactly one carries `is-active`, and the sticky jump-link nav becomes the DOM-built `.report-nav`. Honor the **copy quality bar** in the generated copy — sentence case, active voice, takeaway headlines, exact framework names, one decimal on scores, no placeholder leakage.

## What to produce

A self-contained HTML file. Each top-level view is a `.page` container (`<section class="page" id="...">`), exactly one carrying `is-active`; a sticky `.report-nav` built from each page's `data-title` switches between them. Pages, in order:

1. **Executive Summary (page 1 — cover)** — the 1-page posture view. Credo AI logo, system name, audit date, rigor badge, posture badge, next-audit-date badge, a row of headline stat tiles (controls evaluated, % effective, obligations compliant, residual criticals), then the residual posture strip, initial→residual delta callout, compliance summary, and top-recommendations preview. This is page 1 and the dark cover (`#260838` header banner reads as the cover surface) — a board member who opens only this page leaves with the right mental model. `data-title="Executive summary"`.
2. **How to read this audit** — short interpretive panel: what the effectiveness states mean, how residual differs from initial, why evidence (not intent) drives ratings. `data-title="How to read this"`.
3. **Risk Delta View** — two side-by-side 5×5 matrices (Initial / Residual) plus movement table sorted by magnitude. `data-title="Risk delta"`.
4. **Compliance Scoreboard** — per-regulation cards with obligation status breakdown. `data-title="Compliance"`.
5. **Control Effectiveness View** — sortable, expandable table grouped by effectiveness rating, opening with a designed/documented/operational/evidenced rollup. `data-title="Control effectiveness"`.
6. **Catalog Drift** — only render (as a page, with a nav entry) if drift data exists. `data-title="Catalog drift"`.
7. **Recommendations** — prioritized action cards with owner-type badges. `data-title="Recommendations"`.
8. **Trend View** — only render (as a page, with a nav entry) if the audit is in comparison mode with prior audits. `data-title="Trend"`.

The **sticky nav** is the foundation's `.report-nav`: built from the DOM (`data-title` per page), with `.report-nav__item` buttons (`data-page`, `is-active`), a `.report-nav__counter` ("3 / 7"), and a `<select>` jump menu below 640px. The Credo AI logo sits in the nav brand slot. There is no scrollspy — the active page IS the active nav item.

A **footer** sits below the pages (outside the page containers): "Generated by Credo AI Governance Hub · [ISO date]"; read `./docs/credoai/org.md` (local) or `~/.claude/credoai/org.md` (global fallback); if either exists, append " · Prepared for [Organization Name]".

### `<title>` element

Pin the document title in `<head>` to exactly this format:

```html
<title>{System Name} — Governance Audit · {YYYY-MM-DD} | Credo AI</title>
```

`{System Name}` is the title-cased system name from the audit (e.g. `RetailAssist`). `{YYYY-MM-DD}` is the audit date — including it disambiguates successive audits of the same system in the Governance Hub listing. `aigov-share` sends `artifactType: "audit"` alongside, so the title format must stay consistent for the listing UI to render correctly.

## Technical approach

Single self-contained HTML file: vanilla JS + inline CSS, no build step, no npm. Tailwind via CDN is fine for layout utilities, but **all color, type, spacing, radius, and shadow values must come from the bundled Credo AI design tokens** (see below) — do not substitute Tailwind defaults.

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Risk matrices are pure CSS grids — no charting library needed. Trend sparklines use inline SVG.

### Paged layout — copy the shell

Copy the markup and script from `design/paged-report-shell.html` wholesale and restyle with the product tokens. Do not re-derive the navigation logic. The contract (exact class/function names):

- **Pages:** `<section class="page" id="...">` with `data-title="..."`; exactly one `is-active`. Base CSS `.page{display:none}` / `.page.is-active{display:block}`. Page 1 (Executive Summary) is the dark cover — render the `#260838` header banner as its top surface.
- **Nav:** built from the DOM — `.report-nav`, one `.report-nav__item` per page (`data-page`, `is-active`), `.report-nav__counter`, and `.report-nav__select` (shown <640px). The active nav item uses the product token shadow/underline (this register has shadows), not a border highlight. The brand slot holds the Credo AI logo.
- **`goToPage(id, opts)`** with `opts = { focus?, push? }`: clear `is-active` from every page and nav item, add it to the target page + its button, `window.scrollTo(0,0)`, update the counter, and (unless `push === false`) set `location.hash`. A `hashchange` listener calls `goToPage(hashId, { push: false })`; **the same handler runs on load** so deep links land. Unknown/empty hash → first page.
- **Prev/Next** controls (`.page-nav`) at the foot of every page; **Left/Right arrows** page back/forward but are **ignored when focus is in an `input`, `select`, `textarea`, or `[contenteditable]`** so typing in a filter never flips the page.
- **Cross-section links:** `data-goto="<pageId>"` (+ optional `data-focus="<elementId>"`) → `goToPage(goto, { focus })`. After the page is active, `goToPage` scrolls the focus element into view and pulses it with the existing highlight class (`.is-flash`, ~1.2–1.5s). See "Interactivity" for the audit-specific rewires.
- **Print:** the foundation's `@media print` block — un-hide every page, `page-break-before: always` (first page `avoid`), hide nav/prev-next/counter/print-button, force-open every collapsible (control cards, obligation rows, recommendation cards). See "PDF export" below.

There is no IntersectionObserver scrollspy — the active page is the active nav item, set inside `goToPage`.

### Design tokens — inline at gen time

The Credo AI design system ships a single CSS variables file (`credo-design-tokens.css`) bundled as a shared asset under `aigov-plan-viz/assets/` (this skill reuses it via the same glob path used for the logo). **Read it at generation time and inline its contents inside `<style>` tags in the `<head>`.**

```python
import glob, os
patterns = [
    os.path.expanduser("~/.claude/plugins/cache/credoai-plugins/governance-intelligence-pro/*/skills/aigov-plan-viz/assets/credo-design-tokens.css"),
    os.path.expanduser("~/.claude/plugins/cache/*/governance-intelligence-pro/*/skills/aigov-plan-viz/assets/credo-design-tokens.css"),
]
tokens_css = ""
for pattern in patterns:
    matches = glob.glob(pattern)
    if matches:
        with open(matches[0]) as f:
            tokens_css = f.read()
        break
```

Embed in head:

```html
<style>
  {{tokens_css}}
  /* viz-specific overrides go below the canonical tokens */
</style>
```

If the asset is missing, fall back to a minimal inline `:root` block covering values referenced by this skill — never leave the dashboard token-less.

### Typography — Inter for product, Instrument Sans for hero

Two font systems split by surface:

- **Body, tables, cards, pills, buttons, captions:** Inter (`var(--font-sans)`) — what every product surface uses
- **Hero system name in the dark header banner only:** Instrument Sans (`var(--font-marketing)`) — the brand-marketing moment

Apply globally:

```css
body {
  font-family: var(--font-sans);
  color: var(--grey-800);
  background: var(--ghost-white);
}
.font-marketing {
  font-family: var(--font-marketing);
}
```

**Product type ladder** (from `colors_and_type.css`):

| Token           | Size | Weight                  | Use                              |
| --------------- | ---- | ----------------------- | -------------------------------- |
| `--fs-display`  | 40px | 700 / -0.02em           | Hero system name                 |
| `--fs-h1`       | 32px | 700 / -0.01em           | Page-level titles                |
| `--fs-h2`       | 24px | 700                     | Section headings                 |
| `--fs-h3`       | 18px | 700                     | Card titles, group headers       |
| `--fs-h4`       | 16px | 600                     | Sub-headers, posture-tile labels |
| `--fs-body-lg`  | 15px | 400                     | Default body                     |
| `--fs-body`     | 14px | 400                     | Table cells, dense body          |
| `--fs-body-sm`  | 13px | 500 / +0.012em          | Button + input labels            |
| `--fs-sm`       | 12px | 400                     | Hint, metadata, caption          |
| `--fs-overline` | 10px | 700 / +0.08em uppercase | Eyebrows, group labels           |

Use weight, not color, for emphasis. **No italics** for decorative emphasis. Body text is `--grey-800` on light, `--white` on dark.

## Credo AI Brand

### Colors — token mapping

Every color must reference a token from `credo-design-tokens.css` (or be derived via the recipes below).

**Brand purple system:**

| Token                   | Hex       | Use                                                                            |
| ----------------------- | --------- | ------------------------------------------------------------------------------ |
| `--credo-purple`        | `#7B04CA` | Primary brand, active states, section headings, "Effective"/"Compliant" border |
| `--credo-purple-hover`  | `#41006B` | Hover/pressed primary, primary-tone pill text                                  |
| `--purple-lighter`      | `#E2CBFB` | Hover bg tint                                                                  |
| `--purple-lightest`     | `#F1EBFF` | Subtle bg, primary-tone pill bg                                                |
| `--russ-violet`         | `#31084B` | Secondary dark surface                                                         |
| `#260838` (Dark Purple) | —         | Header banner, "Critical"/"Non-Compliant"/"Not Implemented" fill               |
| `--lavender`            | `#F2DEFF` | Card hover, table-header bg, "Effectively Mitigated" residual fill             |
| `--ghost-white`         | `#FBF9FF` | Page background                                                                |
| `--mimi-pink`           | `#FFD5E5` | Header gradient terminus                                                       |

**Greyscale**: `--grey-50` → `--grey-900`. Use `--grey-200` for hairline borders and dividers, `--grey-700` for secondary text, `--grey-800` for body, `--grey-900` for headings.

**Status palette** (canonical product status colors, adopted unchanged from the platform UI kit). Compliance status, control effectiveness, and info callouts use these — _not_ the brand purple gradient. Each has light/dark variants:

| State   | Fill bg                     | Fill text                  | Solid bg              | Solid text |
| ------- | --------------------------- | -------------------------- | --------------------- | ---------- |
| Info    | `--info-light` `#EAEEFE`    | `--info` `#3B58BF`         | `--info`              | `#FFFFFF`  |
| Success | `--success-light` `#E9F6F2` | `--success-dark` `#298567` | `--success` `#40CDA0` | `#FFFFFF`  |
| Warning | `--warning-light` `#FFF8E7` | `--warning-dark` `#8F6D1D` | `--warning` `#FFC333` | `#161616`  |
| Error   | `--error-light` `#FAEEEA`   | `--error-dark` `#993F21`   | `--error` `#CD552C`   | `#FFFFFF`  |

### Status color mapping

The dashboard mixes two color systems by intent:

- **Risk tier** uses the brand-monochrome purple gradient (a deliberate Credo aesthetic — darker = more critical). This is purely visual hierarchy on the matrices and risk pills; the label still carries the meaning.
- **Compliance status and control effectiveness** use the **canonical status palette** (success/warning/error/info). These states are evaluative judgements, and the conventional traffic-light mapping is what auditors and regulators expect.

Unified rule across both systems: **darker = problem, lighter = OK**.

**Risk tier (brand-monochrome purple — matrices and risk pills):**

| Tier                                  | Pill bg                    | Pill text                                                    | Matrix cell bg           |
| ------------------------------------- | -------------------------- | ------------------------------------------------------------ | ------------------------ |
| Critical                              | `#260838`                  | `#FFFFFF`                                                    | `--lavender` `#F2DEFF`   |
| High                                  | `--credo-purple` `#7B04CA` | `#FFFFFF`                                                    | `#E7C9FA`                |
| Medium                                | `#C9B6FF` (Soft Blue)      | `#161616`                                                    | `--mimi-blush` `#FCF2FA` |
| Low                                   | `#E7C9FA` (Pale Lavender)  | `#161616`                                                    | `--ghost-white`          |
| Effectively Mitigated (residual only) | `--lavender` `#F2DEFF`     | `#161616` + Feather `check` icon at 12px in `--success-dark` | —                        |

**Control effectiveness (canonical status palette):**

| State                        | Pill recipe                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Effective                    | `success` fill (`bg #E9F6F2 / fg #298567`)                                                                       |
| Partially Effective          | `warning` fill (`bg #FFF8E7 / fg #8F6D1D`)                                                                       |
| Ineffective                  | `error` fill (`bg #FAEEEA / fg #993F21`)                                                                         |
| Not Implemented              | `error` solid (`bg #CD552C / fg #FFFFFF`) — solid signals "actively missing"                                     |
| Implemented but Unverifiable | `ghost` outline (`bg transparent / fg #7B04CA / 1px dashed #7B04CA`) — dashed border signals "incomplete signal" |

**Compliance status (canonical status palette):**

| State          | Pill recipe                                                      |
| -------------- | ---------------------------------------------------------------- |
| Compliant      | `success` fill                                                   |
| Partial        | `warning` fill                                                   |
| Non-Compliant  | `error` solid                                                    |
| Not Applicable | `ghost` outline (`bg #FFFFFF / fg #4D4D5B / 1px dashed #E0E0E5`) |

### Movement indicators (Risk Delta)

Use Feather icons next to risk movement entries (no Unicode triangles or arrows — Feather is the brand vocabulary):

| Movement                                | Feather icon                                    | Color                      |
| --------------------------------------- | ----------------------------------------------- | -------------------------- |
| Improved (residual tier < initial tier) | `arrow-down-right` (or `trending-down`) at 14px | `--success-dark` `#298567` |
| Unchanged                               | `minus` at 14px                                 | `--grey-600` `#9999A4`     |
| Worsened (residual tier > initial tier) | `arrow-up-right` (or `trending-up`) at 14px     | `--error-dark` `#993F21`   |

### Logo

Same approach as `aigov-plan-viz`. Find via glob:

```python
import glob, base64, os

patterns = [
    os.path.expanduser("~/.claude/plugins/cache/credoai-plugins/governance-intelligence-pro/*/skills/aigov-plan-viz/assets/logo-dark.png"),
    os.path.expanduser("~/.claude/plugins/cache/*/governance-intelligence-pro/*/skills/aigov-plan-viz/assets/logo-dark.png"),
]
logo_b64 = ""
for pattern in patterns:
    matches = glob.glob(pattern)
    if matches:
        with open(matches[0], "rb") as f:
            logo_b64 = base64.b64encode(f.read()).decode()
        break
```

If not found, fall back to inline SVG wordmark — never leave the header blank.

Embed: `<img src="data:image/png;base64,{logo_b64}" alt="Credo AI" style="height:36px;">`

### Design principles (from the brand guide and the platform Figma)

- **Less is more** — generous whitespace. Repeated four times in the brand guide.
- **Strong text hierarchy via weight, not color** — 400/500/600/700; never colorize body words.
- **Left-aligned text** — always, except in centered hero moments.
- **Sentence case in body and UI** — no ALL-CAPS for emphasis. Eyebrow/overline (10px / 700 / +0.08em tracking) is the only uppercase.
- **Rounded corners (product scale)** — `--r-sm` (6px) for buttons, status pills, inputs; `--r-md` (8px) for small cards; `--r-lg` (12px) for primary cards; `--r-xl` (16px) for hero panels. Reserve `--r-pill` (999px) for header badges only.
- **Sharp corners on data tables** — don't round table cells (per brand guide).
- **Soft purple-tinted shadows** — never hard black. Use `--shadow-xs` / `--shadow-sm` defaults, `--shadow-md` for hover, `--shadow-lg` for floating menus.
- **Header gradient** — French Violet → Mimi Pink (`linear-gradient(90deg, var(--credo-purple), var(--mimi-pink))`) as a 3px accent line. Never on backgrounds, never on text.
- **No emoji, no decorative italics, no left-border-accent cards** — explicitly banned.

### Header design

Dark background (`#260838`), full width:

- Top-left: Credo AI logo (height 36px)
- Below: hero system name in **Instrument Sans** (`var(--font-marketing)`), `--fs-display` (40px) / 600, color `--white`
- Row of pill badges: audit date, rigor level, posture, next-audit-date. Header pills are the marketing pill shape — `--r-pill` (999px), `rgba(255,255,255,0.15)` bg, white text, 12px font, padding `4px 12px`. Each leads with a Feather icon at 14px (`calendar`, `target`, `compass`, `repeat`).
- **Headline stat tiles** — a 3–4 tile row inside the dark header (per the foundation's hero-cover idiom): big numeral + small label, e.g. "14 controls evaluated", "64% effective", "8/11 obligations compliant", "1 residual critical". Tile: `rgba(255,255,255,0.06)` bg, `1px solid rgba(255,255,255,0.12)` border, `--r-md` radius, numeral `--fs-h1` / 700 white, label `--fs-sm` `rgba(255,255,255,0.7)`. Derive every number from DATA — never invent.
- Bottom: 3px gradient accent line.

### Section design

- Page background: `--ghost-white`
- Section (page) headings: `--credo-purple`, weight 700, `--fs-h2` (24px), 3px left border same color, padding-left 12px. Optional `--fs-overline` eyebrow above (10px / 700 / +0.08em tracking, color `--grey-700`).
- Cards: `--white` bg, `border: 1px solid var(--grey-200)`, `border-radius: var(--r-lg)`, `box-shadow: var(--shadow-sm)`, padding 24px.
- Sticky `.report-nav`: white bg, `border-bottom: 1px solid var(--grey-200)`. Active `.report-nav__item`: `--credo-purple` text + 2px bottom border (or `--shadow-sm` — the product register may use the token shadow). Set by `goToPage`, not by scroll position.

### Component recipes — Pill, Card, Button

Match the platform UI kit's `Primitives.jsx` exactly. Reuse everywhere:

**Pill** (`--r-sm` 6px, Inter 11px / 600 / +0.012em, padding `2px 8px`, leading icon optional at 12px):

- `neutral` — `bg #EBEBF2 / fg #4D4D5B`
- `primary` — `bg #F1EBFF / fg #41006B`
- `info` — `bg #EAEEFE / fg #3B58BF`
- `success` — `bg #E9F6F2 / fg #298567`
- `warning` — `bg #FFF8E7 / fg #8F6D1D`
- `error` — `bg #FAEEEA / fg #993F21`
- `ghost` — `bg transparent / fg #4D4D5B / 1px border #E7E7EE`

**Button** (rectangle, `--r-sm` 6px, Inter 13/20 Medium, +0.012em, height 36px md):

- `primary` — `bg #7B04CA / fg #FFFFFF`, hover `#41006B`
- `secondary` — `bg #FFFFFF / fg #7B04CA / 1px border #7B04CA`, hover bg `#F1EBFF`
- `tertiary` — `bg transparent / fg #7B04CA`, hover bg `#F1EBFF`
- `ghost` — `bg transparent / fg #4D4D5B / 1px border #E0E0E5`, hover bg `#F8F8FA`

**Card** — `--white` bg, `1px solid #E7E7EE`, `--r-lg` 12px, `--shadow-sm`, padding 24px (16-20px for compact list items).

### Iconography — Feather Icons via CDN

The brand uses **Feather Icons** (1.5–2px stroke, square endpoints, non-rounded corners) — never emoji, never hand-rolled SVGs, never Unicode triangles/arrows. Load via CDN and let `feather.replace()` swap `<i data-feather>` placeholders into inline SVGs:

```html
<script src="https://unpkg.com/feather-icons"></script>
<i data-feather="alert-triangle" style="width:16px;height:16px"></i>
...
<script>
  feather.replace({ "stroke-width": 2 });
</script>
```

Re-call `feather.replace()` after dynamic content insertion. Sizes: 12 / 14 / 16 / 20 / 24 px. Color via `color:` on the parent (`feather.replace()` produces `stroke="currentColor"`).

Curated icon vocabulary for the audit dashboard:

- Header badges: `calendar` (audit date), `target` (rigor), `compass` (posture), `repeat` (next-audit)
- Risk delta: `arrow-down-right` / `arrow-up-right` / `minus` (movement); `bar-chart-2` (matrix); `check-circle` (effectively mitigated marker)
- Compliance: `check-circle` (Compliant), `alert-circle` (Partial), `x-circle` (Non-Compliant), `slash` (N/A), `book-open` (regulation source)
- Effectiveness: `check` (Effective), `alert-triangle` (Partially Effective), `x` (Ineffective), `x-octagon` (Not Implemented), `help-circle` (Implemented but Unverifiable)
- Drift: `git-branch` (drift section), `plus-circle` (New), `zap` (Sharpened), `archive` (Deprecated)
- Recommendations: `flag`, `users` (owner), `arrow-right` (chip click-through)
- Footer / nav: `external-link`, `download`, `printer`

## Data structure

Embed as a JS constant at the top of the `<script>` block:

```javascript
const DATA = {
  meta: {
    system: "...",
    auditDate: "YYYY-MM-DD",
    rigor: "Pragmatic | Standard | Strict",
    posture: { level: "Conservative | Balanced | Speed-focused", scope: "local | global | none" },
    nextAuditDate: "YYYY-MM-DD",
    planRef: "path/to/plan.md",
    evidenceRef: "path/to/evidence.md",
    catalogVersion: "...", // null if MCP was unavailable
  },
  risks: [
    {
      name: "...", // exact catalog name
      type: "...",
      initial: { severity: 1 - 5, likelihood: 1 - 5, score: int, tier: "Critical|High|Medium|Low" },
      residual: { tier: "Critical|High|Medium|Low|Effectively Mitigated", rationale: "..." },
      contributingControls: [
        {
          name: "...",
          effectiveness:
            "Effective|Partially Effective|Ineffective|Not Implemented|Implemented but Unverifiable",
        },
      ],
    },
  ],
  controls: [
    {
      name: "...", // exact catalog name
      requirement: "...", // canonical from MCP, or plan text
      evidence: "...", // reference to evidence-register entry
      effectiveness:
        "Effective|Partially Effective|Ineffective|Not Implemented|Implemented but Unverifiable",
      reasoning: "...",
      gap: "...", // optional, for Partial/Ineffective
      remediation: "...", // optional
    },
  ],
  compliance: [
    {
      obligation: "...",
      source: "...", // e.g., "EU AI Act"
      status: "Compliant|Partial|Non-Compliant|Not Applicable",
      satisfyingControls: [{ name: "...", effectiveness: "..." }],
      notes: "...",
    },
  ],
  drift: [
    {
      // optional — empty if MCP unavailable or no drift
      item: "...",
      type: "New|Sharpened|Deprecated",
      impact: "...",
      recommendation: "...",
    },
  ],
  recommendations: [
    {
      priority: 1,
      action: "...",
      rationale: "...",
      owner: "engineering|compliance|procurement|leadership",
    },
  ],
  trend:
    null |
    {
      // optional — only in comparison mode
      audits: [
        {
          date: "YYYY-MM-DD",
          residualCounts: { critical, high, medium, low, mitigated },
          complianceCounts: { compliant, partial, nonCompliant },
        },
      ],
      riskMovement: [{ name: "...", history: [{ date, tier }] }],
    },
};
```

## Page 1: Executive Summary (cover)

The 1-page view and the report's cover (page 1, `is-active` on load). If a board member opens this and reads only this page, they should leave with the right mental model. The dark `#260838` header banner is the top of this page.

**System context card** — white card (`border: 1px solid var(--grey-200)`, `border-radius: var(--r-lg)`, `box-shadow: var(--shadow-sm)`). System name in `--fs-h1` / 700. Audit metadata pills (audit date, rigor, posture, next audit) use the **product Pill `primary` tone** (`bg #F1EBFF / fg #41006B`, `border-radius: var(--r-sm)`, Inter 11 / 600 / +0.012em). Each pill leads with a 12px Feather icon (`calendar`, `target`, `compass`, `repeat`).

**Residual risk posture strip** — five tiles for residual counts (Critical / High / Medium / Low / Effectively Mitigated). Color-coded by tier per the Status color mapping.

**Risk delta callout** — text-only line below the strip:

> "Since the plan: **{{X}} risks improved, {{Y}} unchanged, {{Z}} worsened.**"
> With each number colored per movement indicator (improved=French Violet, unchanged=gray, worsened=Dark Purple).

**Compliance summary** — single-line aggregate per regulation:

> "EU AI Act: 3 of 5 obligations Compliant, 2 Partial, 0 Non-Compliant"
> Each line followed by a small horizontal bar visualizing proportions (CSS-only stacked bar). Each line carries `data-goto="compliance"` (optionally `data-focus="<source-card-id>"`) so a click pages to the Compliance Scoreboard.

**Top recommendations preview** — first 3 items from `DATA.recommendations` as a numbered list with owner-type badges. Below: a text link "See all recommendations →" with `data-goto="recommendations"` that pages to the Recommendations page.

**MCP availability flag** — if `DATA.meta.catalogVersion` is null, render a small notice: "Catalog drift not assessed — MCP unavailable when audit was generated. Re-run with MCP for full assessment."

## Page 2: How to read this audit

A compact interpretive panel (per the foundation's how-to-read idiom) — its own page between the Executive Summary and the Risk Delta View — three or four numbered cards, `--fs-body` text:

1. **Ratings reflect evidence, not intent** — a control is Effective only when gathered evidence shows it operating; a well-specified control with no evidence rates Not Implemented or Implemented but Unverifiable.
2. **Residual is the number that matters** — initial risk is what the plan scored; residual is what remains after the controls as they actually operate today. The delta between the two matrices is the audit's headline.
3. **The five effectiveness states** — one line each, in worst-first order, matching the pill colors used below.
4. **Catalog drift** — when present, the framework itself moved since the plan was written; drift items are inputs to the next planning cycle, not findings against the team (only when drift exists).

Keep it tight — orientation in under a minute, not methodology prose.

## Page 3: Risk Delta View

**Two 5×5 matrices side by side.** Use CSS grid: `grid-template-columns: 1fr 1fr; gap: 24px`. Headers above each matrix:

- "Initial Risk" (left) — uses `risks[].initial.tier`
- "Residual Risk" (right) — uses `risks[].residual.tier`

For "Effectively Mitigated" residuals, place them in the Low quadrant with a subtle marker (Feather `check` at 12px in the corner of the pill — not a Unicode checkmark).

Each matrix: severity X-axis (1–5 left to right), likelihood Y-axis (5–1 high at top). Risk pills placed in their cells (allow text wrapping). Cell backgrounds use the muted tier colors from `aigov-plan-viz`.

**Movement table** below the matrices, sorted by magnitude (biggest movement first):

| Risk        | Initial  | Residual | Movement              | Driver                                        |
| ----------- | -------- | -------- | --------------------- | --------------------------------------------- |
| [Risk name] | Critical | High     | ▼ -1 tier (`#7B04CA`) | [shortened from `risks[].residual.rationale`] |

Click a risk row to jump to the matching control entries on the Control Effectiveness page — specifically the contributing controls that drove the movement. Because the controls live on a different page, this is a cross-section link: the row carries `data-goto="controls"` and `data-focus="<contributing-control-id>"`, so `goToPage` switches to the Control Effectiveness page and then pulses the target control card (`.is-flash`). If a movement has several contributing controls, focus the first and let the rest sit in view around it.

## Page 4: Compliance Scoreboard

One card per unique `source` value in `DATA.compliance`. Sort cards alphabetically by source name. "Not Applicable" obligations grouped at the bottom of each card.

Card header: source name in SemiBold + breakdown pills (e.g., "3 Compliant · 2 Partial · 0 Non-Compliant") with status colors per the unified mapping.

**Stacked horizontal bar** under the header showing proportions visually (full status palette — match the pill recipes):

- Compliant: `--success` `#40CDA0`
- Partial: `--warning` `#FFC333`
- Non-Compliant: `--error` `#CD552C`
- N/A: outlined `--white` with dashed `--grey-400` border

Below the bar, expandable list of obligations. Each row:

- Status indicator (small filled circle, color per status)
- Obligation text in `#161616`
- Click row to expand → show satisfying controls and notes. Expanding a row is a **within-page** interaction (no paging). Each satisfying-control chip is a **cross-section** link: `data-goto="controls"` + `data-focus="<control-id>"`, so clicking it pages to the Control Effectiveness page and pulses that control card.

No persistent annotation in this section — keep it read-only for audit credibility.

## Page 5: Control Effectiveness View

**Activation rollup** — open the section with a compact present-vs-missing-style matrix (per the foundation's idiom): one row per control, four state columns — **Designed** (in the plan) / **Documented** (requirement specified) / **Operational** (evidence shows it running) / **Evidenced** (evidence is verifiable and current) — derived from each control's effectiveness rating and evidence reasoning. Feather `check` / `minus` cells, status accents sparingly. This is the activation-gap picture an executive screenshots; the detailed cards below justify it.

This page is the target of the cross-section links from the Risk Delta and Compliance pages. Give each control card a **stable element id** (e.g. `control-<slug>`) so `goToPage(.., { focus })` can scroll it into view and pulse it. When a focus arrives for a control hidden by the active filter, reset the filter to "All" so the target is visible before pulsing.

**Filter pills** at the top — "All / Effective / Partially Effective / Ineffective / Not Implemented / Implemented but Unverifiable". Clicking a pill filters **within this page** (no paging); default shows All grouped by effectiveness rating in the order: Not Implemented, Ineffective, Implemented but Unverifiable, Partially Effective, Effective (worst-first — readers want to see problems first). Sorting and card expand/collapse are also within-page.

Each effectiveness group is a section with a labeled header (status color background + title + count).

Within a group, controls render as cards (`background: #FFFFFF; border: 1px solid var(--grey-200); border-radius: var(--r-lg); box-shadow: var(--shadow-xs); padding: 16px; margin-bottom: 12px`):

1. Control `name` — bold, `color: #161616`
2. Effectiveness chip — color per Status mapping
3. **Click to expand** — chevron (▾) in the corner. Expanded content:
   - **Requirement:** `requirement` field, in a slightly indented block
   - **Evidence:** `evidence` reference text — if it points to an evidence register entry, link it as text (no actual hyperlink resolution, but show the reference)
   - **Reasoning:** `reasoning` field, full prose
   - **Gap:** `gap` field, only if present, prefixed by status-colored "Gap:" label
   - **To remediate:** `remediation` field, only if present, in a callout style

Sortable: by control name (alphabetical) or by effectiveness severity (default).

## Page 6: Catalog Drift

Only render this page (and its nav entry) if `DATA.drift.length > 0`. If there is no drift, omit the page entirely — do not render an empty page with a "no drift" line, since the foundation's "omit, do not stub" rule applies and an empty page wastes a nav slot. (The Executive Summary still carries the "MCP unavailable" notice when `catalogVersion` is null.)

Render each drift item as a card:

- Type badge (New / Sharpened / Deprecated) — same status color treatment
- Item name in SemiBold
- Impact text
- Recommendation text in a callout pill

Cards sorted by recommendation severity: items recommending "Re-run plan" first, then "Note in audit" / minor.

## Page 7: Recommendations

Three audiences-by-owner, but render as a single prioritized list (priority 1 first). Each recommendation as a card:

- Large priority number (1, 2, 3...) in `--credo-purple`, `--fs-h1` / 700
- Action text in `--grey-900`, `--fs-h3` / 700
- Owner-type badge (engineering / compliance / procurement / leadership) — **product Pill `primary` tone** (`bg #F1EBFF / fg #41006B`, `--r-sm`), leading with a Feather icon: `users` (engineering), `clipboard` (compliance), `briefcase` (procurement), `flag` (leadership)
- Rationale text in `--grey-700`, `--fs-body-lg` / 400 below action

Click a card to expand → show which risks/obligations the action addresses. Expanding is **within-page**; each addressed-risk or addressed-obligation chip is a **cross-section** link (`data-goto="risk-delta"` + `data-focus="<risk-row-id>"`, or `data-goto="compliance"` + `data-focus="<source-card-id>"`) that pages to that view and pulses the target.

## Page 8: Trend View

Only render this page (and its nav entry) if `DATA.trend != null`.

**Residual posture over time** — stacked area chart (inline SVG, no library) showing residual risk counts across audit dates. X-axis = audit date, Y-axis = count. Stack order: Critical (bottom, darkest) → High → Medium → Low → Effectively Mitigated.

**Compliance over time** — same idea but for `complianceCounts` per audit. Below the residual chart, smaller.

**Per-risk movement** — list of every risk in `riskMovement`, each with a tiny inline sparkline showing tier across audit dates. Hover for tooltip with date + tier per point.

If only one prior audit exists, render just the comparison delta (no chart): "Posture changes since {{prior date}}: {{N risks improved, M worsened}}." Skip the chart and show a comparison table instead.

## Interactivity

Interactions split into **within-page** (scroll/expand/filter/sort on the visible page — unchanged from a single-scroll report) and **cross-section** (target lives on another page — route through `goToPage(targetPage, { focus })`, never a plain anchor scroll, because the target page is hidden until activated). The pulse on arrival is the existing highlight class (`.is-flash`).

| Interaction                                       | Type          | Behavior                                                                                       |
| ------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| Nav item / prev-next / Left-Right arrows          | paging        | `goToPage` switches the active page; arrows ignored while typing in input/select/textarea      |
| Hover risk pill in matrix                         | within-page   | Tooltip: name, type, initial vs residual rationale                                             |
| Click risk pill in matrix                         | within-page   | Highlight matching row in movement table; expand it (same page)                                |
| Click row in movement table                       | cross-section | `goToPage("controls", { focus: contributingControlId })` → pulse the contributing control card |
| Click control card on Control Effectiveness page  | within-page   | Expand requirement/evidence/reasoning                                                          |
| Click obligation row on Compliance page           | within-page   | Expand satisfying controls inline                                                              |
| Click satisfying-control chip on Compliance page  | cross-section | `goToPage("controls", { focus: controlId })` → pulse that control card                         |
| Click compliance line in Executive Summary        | cross-section | `goToPage("compliance", { focus?: sourceCardId })`                                             |
| Click "See all recommendations →"                 | cross-section | `goToPage("recommendations")`                                                                  |
| Click recommendation card                         | within-page   | Expand to show addressed risks/obligations                                                     |
| Click addressed-risk / addressed-obligation chip  | cross-section | `goToPage("risk-delta" \| "compliance", { focus })` → pulse the target                         |
| Click filter pill / sort on Control Effectiveness | within-page   | Filter/sort visible controls (no paging)                                                       |

No IntersectionObserver scrollspy — under paging the active page is set by `goToPage`, which marks the matching `.report-nav__item` as `is-active`.

## PDF export

Use the foundation's paged `@media print` block (from `design/paged-report-shell.html`) as the base — it un-hides **every** `.page` (`display:block !important`), inserts `page-break-before: always` between them (first page `avoid`), and hides the nav, prev/next, counter, and print button. This is what makes the PDF a complete multi-page document instead of the one-page CoAction failure mode. Without it, only the active page prints.

Layer the audit-specific print rules on top of that base:

```css
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @page {
    margin: 1.5cm;
    size: A4;
  }
  .tooltip {
    display: none !important;
  }
  /* force-open every collapsible so the PDF carries all detail */
  .control-card-detail,
  .obligation-detail,
  .recommendation-detail {
    display: block !important;
  }
  .control-card,
  .obligation-row,
  .recommendation-card,
  .gap-item {
    page-break-inside: avoid;
  }
}
```

The print stylesheet alone expands `details`/`.is-collapsed` collapsibles via the foundation block. For card detail toggled with a JS class rather than `details`, the Print button handler must also force every collapsed card open before calling `window.print()` (and may restore state after). Bind it to a small Print button in the nav (right-aligned) — `.print-button` so the foundation rule hides it from the printed output. All hover/filter/expand chrome stays hidden in print.

## Parsing the audit

The audit arrives as Markdown produced by `aigov-audit`. Extract:

- **Header block**: system name, audit date, rigor, posture (level + scope), next-audit-date, plan/evidence references, MCP catalog version
- **Residual risk table**: per row, name + initial tier + residual tier + rationale; pull contributing controls + their effectiveness from the rationale narrative or per-control sections
- **Compliance section**: per regulation, parse obligations and statuses; capture satisfying controls and their effectiveness
- **Per-control sections**: under each effectiveness heading, parse name + requirement + evidence + reasoning + gap + remediation
- **Catalog drift**: if section exists, parse type / item / impact / recommendation
- **Recommendations**: numbered list of action items with owner mentions
- **Audit trail**: dates and next-audit-date

If a comparison-mode audit is detected (presence of prior-audit references), parse the historical data into `DATA.trend`.

## File output

Save to:

```
./docs/credoai/aigov_audit_viz/<system-name>-aigov-audit.html
```

Slug: lowercase system name from the audit, spaces → hyphens, strip special chars.

Create the directory if needed. After saving, tell the user the path and suggest:

```
open ./docs/credoai/aigov_audit_viz/<system-name>-aigov-audit.html
```

Also remind them: this dashboard can be published to the Governance Hub via `aigov-share` — the share skill handles any HTML governance dashboard, not just plan viz.

## Common mistakes

**Treating residual the same as initial.** The whole point of this view is the _delta_. If your matrices look identical or your callout reads "0 risks improved", verify you're reading `risks[].residual.tier` — not just rendering the same data twice.

**Hiding "Not Implemented" by sorting it last.** Worst-first ordering matters in audit contexts. Readers want to see problems immediately, not scroll past Effective controls to find them.

**Skipping the catalog drift section silently when MCP was unavailable.** Render the explicit "MCP unavailable" notice. The absence of drift data is meaningful information for the reader.

**Rendering an empty trend or drift page.** If `DATA.trend` is null (single-audit mode), don't render the Trend page at all — omit the `.page` so no nav item is built for it. Same for Catalog Drift when `DATA.drift` is empty. Don't show "no trend data available" — the nav is DOM-built, so an empty page becomes a dead nav slot and a blank printed page.

**Leaving a plain anchor scroll on a cross-section link.** Under paging the target lives on a hidden page; `el.scrollIntoView()` against a `display:none` ancestor does nothing. Every link that targets another page must go through `goToPage(targetPage, { focus })` — only within-page scrolls stay as direct scrolls. The risk-row → control, satisfying-control chip → control, and recommendation chip → risk/obligation links are all cross-section.

**Color soup.** Stick to the two-system mapping: monochrome purple for risk tier, canonical status palette (success/warning/error/info) for compliance + control effectiveness. Don't mix them. Don't introduce new status colors. The reader's mental model is "darker means more problematic" — preserve it across both systems.

**Substituting Tailwind defaults.** Tailwind via CDN is loaded for layout utilities, but every color, type, radius, shadow, and spacing value must come from `credo-design-tokens.css` (or one of the recipes derived from it). `bg-purple-500` is _not_ the brand purple. `rounded-full` is _not_ the product pill radius (the product uses 6px). Stick to tokens.

**Skipping Feather icons.** No emoji, no Unicode triangles (▲▼), no hand-rolled SVG iconography. The brand vocabulary is the Feather set — use it. Movement indicators, status icons, header badge prefixes all need real Feather glyphs.

**Italics for emphasis.** Banned in the brand guide. Use weight (600/700) instead. The only acceptable italics are interpunctual (titles of works, emphasis within quoted speech).

**Forgetting to bind PDF expand.** The Export PDF button must expand every collapsed section before calling `window.print()`, otherwise the printed output is a list of headlines with no detail.

**Putting interactivity in PDF mode.** All hover, expand, and filter UI must be hidden in `@media print`. The PDF should be a clean, complete static document.
