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

## Required sections

Mirror the assessment's structure (it followed the framework's canonical
report structure), rendered with the foundation's idioms:

1. **Hero cover** — dark full-bleed (`--bg-inverse`): eyebrow pill
   ("Credo AI · Rapid Maturity Assessment"), organization name as the display
   moment, date, one-sentence framing, headline stat tiles (overall score +
   band, domains assessed, source documents, notable counts). Logo per
   foundation rules.
2. **Sticky slim navigation** — jump links to each section.
3. **Executive overview** — what this is / what this is not / why now / the
   core message, as four cards.
4. **Workshop agenda** _(workshop mode only)_ — timed vertical rail.
5. **Methodology** — band legend (all five bands with ranges and
   descriptions), the four scoring criteria, source documents reviewed with
   version/status/date.
6. **Regulatory grounding** — framework cards with why-it-matters paragraphs.
7. **Domain coverage table** — six domains × what it covers / why it matters
   here / score with band.
8. **How to read this** — numbered interpretive cards.
9. **Maturity profile** — overall score as the centerpiece (large numeral +
   band + one-line position statement), then per-domain score cards: name,
   score, band, horizontal score bar on the 1–5 scale with band thresholds
   marked, and the evidentiary rationale. Render score bars with the lavender
   wash for fill and neutral track; status accents only to mark
   below/at/above-band states, sparingly.
10. **Present vs. missing matrix** — elements × designed/documented/
    operational/evidenced, with Feather check/minus icons (status accents
    sparingly).
11. **Industry benchmarks** — stat cards with claim, context, and explicit
    source line. **Only if the assessment has a benchmarks section** — if it
    was omitted there, omit it here. Never re-add from memory.
12. **Peer comparison** — table of named industry peers with the subject org's
    row highlighted at the top; columns for AI strategy signal, public
    governance evidence, regulatory posture, and estimated maturity band. Each
    peer cell carries its public source line; render the org's own band as a
    rubric score and peer bands visibly as estimates (e.g. a "~" prefix or
    "est." tag) so the two are never conflated. **Only if the assessment has a
    peer comparison section** — omit entirely otherwise. Never re-add from
    memory.
13. **Priority findings** — numbered cards grouped by horizon (immediate /
    near-term / forward-looking), each with evidence, regulatory context, and
    action path. Preserve the grouping the assessment used; the forward-looking
    group (e.g. agentic AI exposure) reads as get-ahead-of, not a present gap.
14. **Strengths** — cards for genuine differentiators.
15. **90-day roadmap** — three phase lanes with owners and outcomes, each lane
    showing its single measurable output (the KPI / evidence artifact that
    proves the phase landed) as a distinct element.
16. **Dialogue prompts** _(workshop mode only)_ — per-domain discussion cards.
17. **Next steps** — commitments and the re-assessment trigger.
18. **Footer** — "Generated by Credo AI Governance Hub · [ISO date] ·
    Framework v{version}"; append " · Prepared for [Organization]" when org
    config exists. Include "Confidential · Not for distribution" when the
    assessment is workshop mode.

Interactive behavior: smooth-scroll nav, expandable evidentiary rationale
(open by default in print via `@media print`), and a print/PDF button. Keep
JS vanilla and minimal — this artifact's job is reading, not exploring.

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
