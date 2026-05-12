# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plugin Overview

`governance-intelligence-pro` is a skill pipeline for AI governance analysis powered by Credo AI Governance Intelligence. Skills work standalone; `aigov-plan` gains catalog-grounded risk/control mapping when the Governance Hub MCP is configured.

## Skill Pipeline

```
aigov-onboarding  (one-time, scope-aware config at ~/.claude/credoai/ or ./docs/credoai/)
        ↓
aigov-intake  →  aigov-plan  →  aigov-plan-viz  →  aigov-share
(context brief)       (risk + controls)    (HTML dashboard)        (publish to hub)
                              ↓
                      aigov-evidence  →  aigov-audit  →  aigov-audit-viz
                      (Adequate/Partial/        (residual risk +     (HTML dashboard for
                       Missing register)         compliance +         executive/regulator
                                                  effectiveness)       deliverables)
```

Each skill produces output that feeds the next; they don't programmatically invoke each other — the user or Claude orchestrates the chain.

Artifact flow:
- `aigov-plan` → `./docs/credoai/aigov_plans/`
- `aigov-evidence` → `./docs/credoai/aigov_evidence/`
- `aigov-audit` → `./docs/credoai/aigov_audits/`
- `aigov-audit-viz` → `./docs/credoai/aigov_audit_viz/`

Both viz outputs (plan-viz and audit-viz) are publishable via `aigov-share` — the share skill handles any HTML dashboard, not just plan viz.

## Shared Config — Two Scopes

Written by `aigov-onboarding`, read by every downstream skill. Lives in **two possible locations**:

| Scope | Path | Purpose |
|-------|------|---------|
| Global | `~/.claude/credoai/` | User-level defaults across every directory |
| Local | `./docs/credoai/` | Overrides for the current working directory (no git/project structure required) |

Files (in either scope):
- `org.md` — organization name, user role
- `tools.md` — tool inventory + interaction protocol (MCP / CLI / API / manual paste / file upload / screenshot / not accessible)
- `posture.md` — regulatory baseline, risk appetite, non-negotiables

Always global only:
- `email.md` — governance hub publishing email (tied to person, not directory; legacy fallback at `~/.claude/governance-hub-email.md`)

**Lookup precedence:** every downstream skill checks **local first**, then falls back to **global**:
```bash
cat ./docs/credoai/<file>.md 2>/dev/null || cat ~/.claude/credoai/<file>.md 2>/dev/null
```

Mix-and-match works — a directory can override `posture.md` only and inherit global `tools.md` and `org.md`.

Downstream skills read these files at start and continue gracefully if they're missing — onboarding is encouraged but never blocking. Skills should note in their output which scope a config was loaded from for audit traceability.

## MCP Server

`aigov-plan` calls three tools when the `governance-hub` MCP is connected:
- `get_catalog_overview` — confirm connection, check vector search availability
- `governance_query(query_text)` — semantic/keyword search for risks, controls, policy requirements
- `get_entities(result_ids)` — fetch full records for top matches (required before scoring — truncated descriptions produce wrong scores)

**MCP config** (Claude Code `settings.json`):
```json
{
  "mcpServers": {
    "governance-hub": {
      "command": "npx",
      "args": ["-y", "@credoai/governance-hub-mcp"]
    }
  }
}
```

Contact engineering@credo.ai for access credentials.

## Key Design Constraints

### Scoring (aigov-plan)
- Severity × Likelihood (each 1–5), score = product; tiers: Critical 20–25, High 12–19, Medium 6–11, Low 1–5
- Scores are context-specific — same risk scores differently in different deployments
- Never use semantic match scores as severity scores
- Always use exact catalog names from Credo AI Governance Intelligence; never paraphrase

### HTML Output (aigov-plan-viz, aigov-audit-viz)
- Single self-contained file: Tailwind CSS via CDN (layout utilities only), vanilla JS — no build step
- **Design tokens** are the source of truth — `aigov-plan-viz/assets/credo-design-tokens.css` (a copy of the canonical `colors_and_type.css` from the Credo AI Design System bundle) is read at gen time and inlined inside `<style>` tags. Both viz skills use the same asset (audit-viz globs to plan-viz/assets). Tokens cover: full color palette (brand purple system, full greyscale 50–900, status palette with light/dark variants), product type ladder (Inter), spacing (4pt grid), radii (6/8/12/16/24/999), and soft purple-tinted shadows. Direct Tailwind defaults (`bg-purple-500`, `rounded-full`, etc.) are NOT brand-correct — always go through tokens.
- Typography is split: Inter (`var(--font-sans)`) for body/UI/data; Instrument Sans (`var(--font-marketing)`) only for the hero system name in the dark header banner.
- Color systems are split: brand-monochrome purple for risk tier (matrices and risk pills); canonical status palette (success/warning/error/info) for compliance status and control effectiveness. Don't mix them.
- Iconography is **Feather Icons via CDN** (`https://unpkg.com/feather-icons`) — never emoji, never Unicode triangles/arrows, never hand-rolled SVG.
- Logo asset path (glob): `~/.claude/plugins/cache/credoai-plugins/governance-intelligence-pro/*/skills/aigov-plan-viz/assets/logo-dark.png` — embed as base64 data URL; fallback to SVG wordmark.
- Output filenames: `<system-name>-aigov-plan.html` and `<system-name>-aigov-audit.html` (lowercase, spaces→hyphens, strip special chars).

### Publishing (aigov-share)
- Email stored globally at `~/.claude/credoai/email.md` (legacy fallback: `~/.claude/governance-hub-email.md`) — ask once, never again
- Backend: `https://backend-development-736b.up.railway.app/api/published-plans`
- Frontend: `https://frontend-development-3133.up.railway.app/view/{id}`
- Delete key returned on POST — must be presented to user and retained for updates/deletes
- 403 "email not found" → direct user to `https://govportal.lab.credoai.net` to sign up

### Evidence (aigov-evidence)
- Two-pass: bulk gathering (with pointer hints from `tools.md`) → first-pass categorization → per-control deep dive on Partial/Missing only
- Categorization: Adequate / Partial / Missing along Sufficiency, Recency, Scope, Verifiability
- Rigor: Lenient (1) / Standard (2) / Audit-ready (3); default derived from posture (Conservative→3, Balanced→2, Speed-focused→1)
- Pointer hints adapt to each tool's interaction mode in `tools.md` — pull via MCP/CLI/API or ask for paste/upload/screenshot
- Output: `./docs/credoai/aigov_evidence/YYYY-MM-DD-<system>.md`
- Re-runs preserve Adequate items and re-evaluate Partial/Missing as new evidence arrives

### Audit (aigov-audit + aigov-audit-viz)
- Inputs: latest plan + latest evidence register; refuses to run without both
- Re-queries MCP for canonical requirement details — catalog evolves; the plan may be stale
- Per-control effectiveness: Effective / Partially Effective / Ineffective / Not Implemented / Implemented but Unverifiable
- Residual risk: judgment-based (likelihood reduction × severity reduction × detection), not formula-based
- Posture non-negotiable violations keep residual at Critical regardless of control effectiveness
- Compliance status per obligation: Compliant / Partial / Non-Compliant / N/A
- Catalog drift detection (only when MCP available) flags new/sharpened/deprecated requirements
- Comparison mode tracks posture shifts between audits over time
- Audit-viz: same brand and technical approach as plan-viz; renders Initial vs Residual matrices side by side, compliance scoreboard, effectiveness table (worst-first), drift callout, recommendations, optional trend view
- Status colors: unified darker=problem, lighter=OK across all status types (risk tiers, effectiveness states, compliance states)

## Updating Skills

Edit the relevant `SKILL.md` under `skills/<skill-name>/SKILL.md`. When adding a new skill, create the directory and `SKILL.md`, then bump the version in `.claude-plugin/plugin.json` and in the parent marketplace's `marketplace.json`. See the parent `CLAUDE.md` at `credoai-plugins/CLAUDE.md` for full plugin structure conventions.
