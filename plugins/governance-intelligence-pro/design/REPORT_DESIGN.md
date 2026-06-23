# Credo AI Report Design Foundation

The shared design reference for every HTML report/visualization skill in this
plugin (`aigov-plan-viz`, `aigov-audit-viz`, `aigov-maturity-viz`). Each viz
skill declares which **register** it renders in (see below) and inherits
everything here; skill files carry only report-specific structure.

## Provenance & sync — two token sources, two canonical upstreams

| Asset                                                  | Register           | Canonical upstream                                                                                                                            | Refresh                                                                                                               |
| ------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `skills/aigov-plan-viz/assets/credo-design-tokens.css` | Product dashboard  | Credo product Figma foundations ("Foundations CSS v2")                                                                                        | Manual, with design team                                                                                              |
| `design/credo-marketing-tokens.css`                    | Executive/workshop | claude.ai/design project `019de2a0-ba19-7e91-b64d-b9e0ec242835` ("Credo AI Marketing Design System", owner: Lucy), file `colors_and_type.css` | DesignSync `get_file` / `/design-sync` — replace the synced copy verbatim, keeping only the provenance header comment |

Never hand-edit token _values_ in either file. If a value looks wrong, fix it
upstream and re-sync. The two systems are intentionally different — do not
"reconcile" them:

- **Product tokens**: Inter-led, full purple system (`--credo-purple` is a
  working color), purple-tinted shadows, radii 6/8/12/16/24/999.
- **Marketing tokens**: Instrument Sans everything, **French Violet is
  LOGO-ONLY**, **no drop shadows** (border highlights instead), radii
  0/2/4/12/16/100, lavender-wash working gradient.

## The two registers

Pick the register by audience and density, not by preference:

### Product dashboard register — `aigov-plan-viz`, `aigov-audit-viz`

Dense, explorable data surfaces for the AI/risk team (with an executive
overview up top). Rules:

- Tokens: `credo-design-tokens.css` (inlined at gen time).
- Type: **Inter** (`var(--font-sans)`) for body/tables/cards/pills/buttons;
  **Instrument Sans** (`var(--font-marketing)`) only for the hero system name
  in the dark header banner.
- Color: brand-monochrome purple ramp for risk tiers (matrices, risk pills);
  canonical status palette (success/warning/error/info) for compliance and
  control effectiveness. Don't mix the two systems in one encoding.
- Shadows: the product token shadows are allowed (this register only).

### Executive/workshop register — `aigov-maturity-viz`

Presentational deliverables for executives, boards, and workshops. Narrative
pacing, generous whitespace, one idea per screenful. Rules:

- Tokens: `design/credo-marketing-tokens.css` (inlined at gen time; replace
  its `@font-face` block with the Google Fonts import for Instrument Sans —
  see the note at the top of that file).
- Type: **Instrument Sans for everything**. Sentence case headings.
- Color: **three colors max per composition.** Text only in Chin Black
  `#161616` or True White `#ffffff`. French Violet `#7b04ca` and the logo
  gradient (French Violet → Mimi Pink) appear ONLY on the C symbol / swirl
  graphics. The working accent is the lavender wash
  (`--credo-gradient-wash`) and the secondary tints (pale lavender, soft
  violet, mimi blush). Status accents (`--credo-success/warning/danger`) very
  sparingly — score/state encodings, never decoration.
- **No drop shadows.** Highlight with the three border treatments
  (`--highlight-gradient` + wash, `--highlight-soft-blue`,
  `--highlight-chin-wash`).
- Dark sections (`--bg-inverse`) for cover/hero and section breaks; light
  (`--bg`/`--bg-soft`) for content.

## Universal rules (both registers)

- **Single self-contained HTML file.** Vanilla JS + inline CSS. No build
  step, no npm. Tailwind via CDN is acceptable for layout utilities only —
  every color, type, spacing, radius, and shadow value comes from the
  register's tokens, never Tailwind defaults (`bg-purple-500`,
  `rounded-full`, `shadow-lg` are all wrong).
- **Iconography:** Feather Icons via CDN
  (`https://unpkg.com/feather-icons`) — never emoji, never Unicode
  triangles/arrows, never hand-rolled SVG.
- **Logo:** embed as base64 data URL; fall back to an SVG wordmark. Glob:
  `~/.claude/plugins/cache/*/governance-intelligence-pro/*/skills/aigov-plan-viz/assets/logo-dark.png`
- **Voice:** clear, confident, visionary. "We" / "you". Sentence case. No
  emoji. No exclamation points.
- **Titles:** `<title>{Name} — {Artifact} | Credo AI</title>` — the
  Governance Hub extracts this for published-artifact listings, so the
  format is a contract.
- **Filenames:** `<slug>-aigov-<type>.html` (lowercase, spaces→hyphens,
  strip special chars), written to `./docs/credoai/aigov_<type>_viz/`.
- **Footer:** "Generated by Credo AI Governance Hub · [ISO date]"; append
  " · Prepared for [Organization Name]" when `org.md` config exists
  (local-first, global fallback).
- **Print/PDF-friendly:** readable when printed — avoid hover-only
  information, give expandable sections sensible print defaults. The paged
  layout below specifies the exact print stylesheet that makes this work.

## Paged layout (multi-page navigation)

Every report renders as a **multi-page document**, not one long scrolling
page: exactly one section is visible at a time, switched via a sticky top
nav, with prev/next and keyboard paging. This is register-agnostic — both
registers use the same shell, differing only in token values. The canonical,
openable implementation lives at `design/paged-report-shell.html`; copy its
markup and script wholesale rather than re-deriving it. The reference client
report (CoAction) pioneered the page-switch mechanism but shipped **no print
stylesheet**, so it exports a one-page PDF; our shell fixes that (see
Print/PDF below — this is where we beat the reference).

### 1. Structure

- Each top-level report section is a **page container**: `<section class="page" id="...">`.
  Exactly one carries the `is-active` class (visible); all others are
  `display:none`. Base CSS: `.page{display:none} .page.is-active{display:block}`.
- A **sticky top nav** (`.report-nav`) lists every page as a button
  (`.report-nav__item`, one per page, `data-page="<id>"`). The active page's
  button gets `is-active` (a visible mark — border highlight in the executive
  register, token shadow/underline in the product register).
- The nav includes a **page counter** (`.report-nav__counter`, e.g. "3 / 10")
  kept in sync by `goToPage`.

### 2. Navigation API

A single function drives all navigation:

```
goToPage(id, opts?)
  id   : string   — the target page's element id
  opts : { focus?: string, push?: boolean }
         focus — element id within the target page to scroll-into-view + pulse
         push  — default true; set false when called from a hashchange handler
                 to avoid double-writing history
```

`goToPage` must: clear `is-active` from every `.page` and every
`.report-nav__item`; add `is-active` to the target page + its nav button;
`window.scrollTo(0, 0)`; update the page counter; and unless `push === false`,
set `location.hash = '#' + id` (deep-linkable, back/forward via history).

- A `hashchange` listener calls `goToPage(hashId, { push: false })`. **The same
  handler runs on load** so a deep link (or refresh on a non-cover page) lands
  correctly; fall back to the first page when the hash is empty/unknown.
- **Prev/Next controls** (`.page-nav`) sit at the foot of every page and call
  `goToPage` with the adjacent page id; hide Prev on the first page and Next on
  the last.
- **Keyboard:** Left/Right arrows page back/forward — but **ignore the
  keypress when focus is in an `input`, `select`, `textarea`, or any
  `[contenteditable]`** so typing in a filter never flips the page.

### 3. Cross-section links (product register)

Plan/audit reports today let a chip click smooth-scroll to an element in
another section (e.g. a risk pill → its row in the controls table). Under
paging that target lives on a hidden page, so a plain anchor scroll fails. The
convention: **switch the page first, then focus the element.**

```js
// data-goto="<pageId>" data-focus="<elementId>" on the clickable
el.addEventListener("click", () => {
  goToPage(el.dataset.goto, { focus: el.dataset.focus });
});

// inside goToPage, after the page is made active:
if (opts.focus) {
  const target = document.getElementById(opts.focus);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("is-flash"); // existing highlight-pulse class
    setTimeout(() => target.classList.remove("is-flash"), 1500);
  }
}
```

Because the page is activated before the lookup, the target is laid out and
scrollable. Reuse whatever highlight-pulse class the report already defines;
do not invent a new visual.

### 4. Print / PDF (required, non-negotiable)

This is where we beat the reference. A `@media print` block must:

```css
@media print {
  .page {
    display: block !important;
    page-break-before: always;
  }
  .page:first-of-type {
    page-break-before: avoid;
  }
  /* chrome that must not print */
  .report-nav,
  .page-nav,
  .report-nav__counter,
  .print-button {
    display: none !important;
  }
  /* force-open anything collapsible so no content is hidden in the PDF */
  details[open],
  details {
    display: block !important;
  }
  details > summary {
    display: none !important;
  }
  .is-collapsed {
    display: block !important;
    max-height: none !important;
  }
}
```

The result: a complete multi-page PDF with one report section per printed
page. Without this block the artifact PDFs to a single page — exactly the
CoAction failure mode we are correcting.

### 5. Responsive

On narrow screens the top nav must not wrap into an unusable stack:

- Either let `.report-nav` become a **horizontal scroll strip**
  (`overflow-x:auto; white-space:nowrap; -webkit-overflow-scrolling:touch`)
  with the active item scrolled into view, **or**
- swap the button row for a `<select>` **jump menu** below ~640px whose
  `change` handler calls `goToPage(select.value)`.

Pick one per report and keep the page counter visible either way.

### 6. Register notes

- **Executive register** (`aigov-maturity-viz`): page 1 is the dark
  full-bleed cover (`--bg-inverse`). Marketing tokens throughout. **No
  shadows** — the active nav item and any focus pulse use the border
  treatments (`--highlight-gradient` + wash, `--highlight-soft-blue`). Nav bar
  sits on a light or dark surface per the adjacent page; counter in
  `--fg-subtle`.
- **Product register** (`aigov-plan-viz`, `aigov-audit-viz`): keep the
  existing product tokens and their shadows. **Convert** the current sticky
  jump-link nav into page switches (`goToPage`) and **convert** the
  IntersectionObserver "active link" logic into per-page `is-active` state —
  there is no scrollspy under paging, the active page IS the active nav item.
  The active nav item may use the product token shadow/underline; the focus
  pulse reuses the existing highlight class.

## Copy quality bar

Every word a report renders is generated copy, and it must read like it was
written by a senior governance consultant — not assembled by a template. The
editorial standard:

- **Active voice, second person.** "You have not documented model
  monitoring," not "Model monitoring documentation was not found."
- **Sentence case** for every heading, pill, and label. Never Title Case,
  never ALL CAPS (the only allowed uppercase is the overline token's tracking,
  not literal capitals).
- **No exclamation points.** None. Confidence comes from the claim, not the
  punctuation.
- **One idea per card/section.** If a card argues two things, split it. The
  paged layout rewards this — a page should hold one coherent thought.
- **Parallel structure in lists.** Every bullet in a list starts the same
  grammatical way (all imperative verbs, or all noun phrases). Do not mix.
- **Tighten filler.** "in order to" → "to"; "in the event that" → "if"; drop
  hedges ("it seems", "arguably", "we believe"). Cut adverbs that add no
  information ("very", "really", "quite").
- **Use the framework's EXACT names verbatim.** Band labels, domain names,
  section titles, control ids, and obligation names are reproduced exactly as
  the MCP/framework serves them — never synonym-swap ("Foundational" stays
  "Foundational"; do not render it "Basic" or "Initial"). Mismatched names
  break traceability to the source.
- **Consistent numerals.** Scores to **one decimal** (`3.2`, not `3.20` or
  `3`). Dates as **"Month YYYY"** (`June 2026`) or **ISO** (`2026-06-17`) —
  pick one per report and hold it. Counts as plain integers.
- **Headlines state the takeaway, not the topic.** "Monitoring is designed but
  not yet operational" beats "Monitoring." The reader should get the finding
  from the headline alone.
- **Cite the specific source for evidentiary claims.** Name the document and
  its date ("per the 2026 Model Risk Policy, §4"), never "various sources" or
  "internal documentation." Benchmark claims name the body and date.
- **Zero placeholder leakage.** No "TBD", "lorem", "[INSERT]", "XXX",
  "Organization Name" literal, or unfilled template tokens reach the rendered
  artifact. If a value is genuinely unknown, omit the element, do not stub it.

### Pre-delivery copy checklist

Before considering a report done, scan the generated copy for:

- [ ] No exclamation points anywhere.
- [ ] Every heading is sentence case; no stray Title Case or ALL CAPS.
- [ ] Band/domain/section/control names match the framework's names verbatim.
- [ ] Scores to one decimal; one date format used throughout.
- [ ] Every headline states a takeaway, not just a topic.
- [ ] Every evidentiary or benchmark claim names a specific dated source.
- [ ] No placeholder/TBD/lorem/unfilled-token text leaked through.
- [ ] Lists are parallel; filler and hedges removed.

## Report idioms catalog

Structural patterns proven in the field (the CoAction maturity workshop is
the reference for impressiveness; render idioms in your register's tokens).
The canonical **paged scaffold** these idioms live inside is the in-repo file
`design/paged-report-shell.html` — copy its shell rather than CoAction's,
since CoAction lacked print fidelity (one-page PDF) which our scaffold fixes.
Use what the report type calls for:

- **Hero cover** — dark full-bleed section: eyebrow pill (artifact type),
  org/system name as the display moment, date, one-sentence framing, then a
  row of headline stat tiles (overall score, counts, key totals).
- **Agenda timeline** (workshop mode) — timed blocks with durations,
  rendered as a vertical rail.
- **Methodology section** — what was analyzed, the scale with every band
  defined, the scoring criteria, and the exact source materials with dates.
  Credibility lives here; never skip it.
- **"How to read this" interpretive panel** — numbered cards preempting
  misreadings: what scores measure (operation, not design), score-in-context
  (a mid-band score is not failing), what the next band up looks like, how
  domains interact.
- **Score profile cards** — per-domain/per-dimension cards: name, score,
  band label, and an evidentiary rationale (what is present, what is
  missing, what would raise it). Expandable in product register; fully
  visible in workshop register.
- **Present-vs-missing matrix** — concrete elements × states
  (designed / documented / operational / evidenced). The activation-gap
  picture executives remember.
- **Sourced benchmark cards** — big stat, one-line claim, context
  paragraph, and an explicit source line (named body + date). Only vetted
  claims served by the backend — if none were served, the section does not
  exist.
- **Priority findings** — three to five highest-leverage gaps: evidence,
  regulatory context, concrete action path.
- **Strengths** — genuine differentiators worth protecting; where strong
  design didn't move the score, say so here.
- **Phased roadmap** — sprint lanes (e.g. 3 × 30 days) with owners and
  outcomes, sequenced by dependency.
- **Dialogue prompts** (workshop mode) — structured discussion questions
  tied to findings/roadmap items.
- **Next steps / commitments** — who does what by when; the re-assessment
  trigger.
