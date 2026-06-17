---
name: aigov-maturity-viz
description: Use when the user wants to turn a maturity assessment (from aigov-maturity) into a presentable HTML deliverable — phrases like "visualize the maturity assessment", "maturity dashboard", "make it presentable", "workshop deck", "make this look nice", or after aigov-maturity produces its markdown and the user wants to present or share it.
---

# Maturity Assessment Visualizer

## Overview

Render a maturity assessment as a single self-contained HTML deliverable in
the **executive/workshop register** — a board- and workshop-grade artifact,
not a data dashboard. One `.html` file: no server, no build step, opens in a
browser, prints to PDF.

## Design foundation — read FIRST

This skill renders in the **executive/workshop register** defined in the
plugin's shared report design foundation. Read both files before generating:

```python
import glob, os
def find(rel):
    for pat in [
        os.path.expanduser(f"~/.claude/plugins/cache/credoai-plugins/governance-intelligence-pro/*/{rel}"),
        os.path.expanduser(f"~/.claude/plugins/cache/*/governance-intelligence-pro/*/{rel}"),
        f"plugins/governance-intelligence-pro/{rel}",  # repo checkout fallback
    ]:
        m = glob.glob(pat)
        if m:
            return m[0]
    return None

report_design = find("design/REPORT_DESIGN.md")        # the rules
tokens_css   = find("design/credo-marketing-tokens.css")  # the marketing tokens
```

Inline the marketing tokens inside `<style>` in the `<head>`, replacing the
`@font-face` block with the Google Fonts import (per the note at the top of
the tokens file):

```html
<style>
  @import url("https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap");
  /* marketing tokens (minus @font-face block) inlined here */
  /* viz-specific styles below */
</style>
```

If the tokens asset is missing, fall back to a minimal inline block covering
the referenced values (`--credo-chin-black:#161616`, `--credo-deep-black:#0a0a0f`,
`--credo-soft-blue:#c9b6ff`, `--credo-mimi-pink:#ffd5e5`, `--credo-pale-lavender:#f2deff`,
`--credo-ghost-white:#fbf9ff`, `--credo-success:#5dd373`, `--credo-warning:#ff8a8a`,
`--credo-danger:#ff6265`, the wash gradient, radii 0/2/4/12/16/100, Instrument
Sans stack) — never emit a token-less artifact.

Register rules that most often get violated — repeat them to yourself:

- Instrument Sans for **everything**. Sentence case.
- **No drop shadows** — border highlights only.
- Three colors max per composition; text only Chin Black or True White.
- French Violet / the logo gradient ONLY on the C symbol or swirl.
- Feather Icons via CDN; no emoji, no Unicode glyph icons.
- No exclamation points anywhere in copy.

## Input

The most recent assessment in `./docs/credoai/aigov_maturity/*.md` (or a path
the user provides). If none exists, refuse with: "Run `aigov-maturity` first —
there is no assessment to visualize." Don't synthesize an assessment.

Honor the assessment's recorded mode: workshop mode includes the agenda and
dialogue-prompts sections; report mode does not.

## Output

- File: `./docs/credoai/aigov_maturity_viz/<org-slug>-aigov-maturity.html`
  (lowercase, spaces→hyphens, strip special chars)
- Title (a Hub-listing contract — exact format):

```html
<title>{Organization} — Maturity Assessment | Credo AI</title>
```

## Pages

This report is a **multi-page document**, not one long scroll: each section
below is its own `.page` (one idea per screenful), switched via the sticky top
nav. Mirror the assessment's structure (it followed the framework's canonical
report structure), rendered with the foundation's idioms. Page 1 is the dark
Hero cover (`.page--cover`); the rest are light content pages in order.

The nav is **built from the DOM** — each `.page` carries a `data-title`
attribute, and the script reads those titles to render the button strip, the
`<select>` jump menu, and the "N / M" counter. An omitted page (see the
optional/omit rules below) is simply not emitted, and the DOM-built nav,
counter, and prev/next bounds adjust to it automatically — there is no
separate nav list to edit.

1. **Hero cover** _(`.page--cover`)_ — dark full-bleed (`--bg-inverse`):
   eyebrow pill ("Credo AI · Rapid Maturity Assessment"), organization name as
   the display moment, date, one-sentence framing, headline stat tiles
   (overall score + band, domains assessed, source documents, notable counts).
   Logo per foundation rules.
2. **Executive overview** — what this is / what this is not / why now / the
   core message, as four cards.
3. **Workshop agenda** _(workshop mode only)_ — timed vertical rail.
4. **Methodology** — band legend (all five bands with ranges and
   descriptions), the four scoring criteria, source documents reviewed with
   version/status/date.
5. **Regulatory grounding** — framework cards with why-it-matters paragraphs.
6. **Domain coverage table** — six domains × what it covers / why it matters
   here / score with band.
7. **How to read this** — numbered interpretive cards.
8. **Maturity profile** — overall score as the centerpiece (large numeral +
   band + one-line position statement), then per-domain score cards: name,
   score, band, horizontal score bar on the 1–5 scale with band thresholds
   marked, and the evidentiary rationale. Render score bars with the lavender
   wash for fill and neutral track; status accents only to mark
   below/at/above-band states, sparingly.
9. **Present vs. missing matrix** — elements × designed/documented/
   operational/evidenced, with Feather check/minus icons (status accents
   sparingly).
10. **Industry benchmarks** — stat cards with claim, context, and explicit
    source line. **Only if the assessment has a benchmarks section** — if it
    was omitted there, omit the page here. Never re-add from memory.
11. **Peer comparison** — table of named industry peers with the subject org's
    row highlighted at the top; columns for AI strategy signal, public
    governance evidence, regulatory posture, and estimated maturity band. Each
    peer cell carries its public source line; render the org's own band as a
    rubric score and peer bands visibly as estimates (e.g. a "~" prefix or
    "est." tag) so the two are never conflated. **Only if the assessment has a
    peer comparison section** — omit the page entirely otherwise. Never re-add
    from memory.
12. **Priority findings** — numbered cards grouped by horizon (immediate /
    near-term / forward-looking), each with evidence, regulatory context, and
    action path. Preserve the grouping the assessment used; the forward-looking
    group (e.g. agentic AI exposure) reads as get-ahead-of, not a present gap.
13. **Strengths** — cards for genuine differentiators.
14. **90-day roadmap** — three phase lanes with owners and outcomes, each lane
    showing its single measurable output (the KPI / evidence artifact that
    proves the phase landed) as a distinct element.
15. **Dialogue prompts** _(workshop mode only)_ — per-domain discussion cards.
16. **Next steps** — commitments and the re-assessment trigger.

The **footer** sits below the pages (not a page itself): "Generated by Credo
AI Governance Hub · [ISO date] · Framework v{version}"; append " · Prepared
for [Organization]" when org config exists. Include "Confidential · Not for
distribution" when the assessment is workshop mode.

### Navigation and print

Use the paged nav and behavior from the shared foundation rather than a
smooth-scroll page. Copy the markup and script wholesale from the canonical
scaffold `design/paged-report-shell.html` — do not re-derive the JS:

- A sticky top nav (`.report-nav`) with a button per page
  (`.report-nav__item`, `data-page`), the "N / M" counter
  (`.report-nav__counter`), and a responsive `<select>` jump menu below 640px.
- `goToPage(id, opts)` drives all navigation: hash deep-linking, prev/next at
  each page foot, and Left/Right arrow paging (ignored while focus is in a form
  field). See REPORT_DESIGN.md § "Paged layout (multi-page navigation)" for the
  full contract.
- Keep the expandable evidentiary rationale (force-open in print) and a
  print/PDF button. JS stays vanilla and minimal — this artifact's job is
  reading, not exploring.

The foundation's `@media print` block un-hides every page with a break
between, so the artifact exports a **complete multi-page PDF** — one report
section per printed page — not the single-page CoAction failure mode.

### Copy quality

Every word the artifact renders is generated copy. Hold it to the foundation's
**"## Copy quality bar"** (REPORT_DESIGN.md): active voice, second person,
sentence case, no exclamation points, headlines that state the takeaway,
framework names verbatim, scores to one decimal, one date format, and every
evidentiary or benchmark claim citing a specific dated source. Run the
pre-delivery copy checklist before considering the artifact done.

## Fidelity rules

- Transcribe scores, rationale, findings, and roadmap **verbatim in
  substance** from the assessment markdown — no re-scoring, no softening, no
  new claims at render time.
- The framework version and source-document list from the assessment header
  must appear in the artifact (methodology + footer).
- Publishable via `aigov-share`, which detects `aigov_maturity_viz/` and
  sends `artifactType: "maturity"`.

## Common mistakes

**Product-register habits.** Inter, purple-ramp risk pills, and shadows
belong to plan/audit dashboards. This register is Instrument Sans, lavender
wash, borders.

**Decorating with status colors.** Success/warning/danger encode state on
scores and matrix cells only — never section accents.

**Re-deriving content.** If the assessment omitted benchmarks, the artifact
has no benchmarks. If a domain scored 2.0, no copy implies 2.5.

**Breaking the title contract.** The Hub parses `<title>` for listings;
keep the exact format.
