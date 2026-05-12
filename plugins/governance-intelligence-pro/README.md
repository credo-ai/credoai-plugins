# governance-intelligence-pro

AI governance skills for Claude Code. Guides users through intake, risk scoring, and visualization of AI governance plans powered by Credo AI Governance Intelligence.

## Skills

### `aigov-onboarding`

One-time setup that captures governance context all other skills read. Three things:

1. **Identity** — org name, user role
2. **Tool inventory and interaction protocol** — which systems hold governance-relevant info (W&B, Confluence, Jira, etc.) _and_ how Claude should interact with each (MCP, CLI, API, manual paste, file upload, screenshot). This is a protocol agreement, not a capability check — it tells downstream skills whether to pull the data themselves or phrase a request for the user.
3. **Governance posture** — regulatory baseline, risk appetite (Conservative / Balanced / Speed-focused), non-negotiables

Saved to one of two scopes (you choose at onboarding):

- **Global** — `~/.claude/credoai/` — applies across every directory
- **Local** — `./docs/credoai/` — overrides global for the current working directory (no git repo or specific project structure required — works wherever you're working)

Lookup is **local-first, global-fallback** — every downstream skill checks `./docs/credoai/` first, then falls back to `~/.claude/credoai/`. Mix-and-match works (override posture only, inherit tools and identity from global). Re-run to update any section. Resumable — picks up where you left off if you stop mid-flow.

Downstream skills skip questions already answered here, bias scoring toward the declared risk appetite, and target evidence pointers at the tools the org actually uses.

### `aigov-intake`

Conducts a focused interview to gather everything needed for a meaningful governance analysis: what the system does, who it affects, how it's built, domain, jurisdiction, and deployment status. Produces a structured **Governance Context Brief** that feeds directly into `aigov-plan`.

Works for any AI system, with or without the MCP.

### `aigov-plan`

Takes a governance context brief and produces a full governance plan:

- Risk assessment with severity × likelihood scoring
- Control roadmap (Do Now / Do Next / Quick Wins)
- Key compliance obligations
- Governance gaps

When the **Governance Intelligence Pro MCP** is connected, risks and controls are drawn from the live Credo AI Governance Intelligence catalog using exact taxonomy names — then contextualized to the specific system. Without the MCP, the skill falls back to LLM reasoning from general AI governance knowledge.

### `aigov-plan-viz`

Renders any governance brief as a self-contained interactive HTML dashboard:

- Risk matrix (5×5 severity × likelihood grid)
- Sortable risk register with expandable rationale
- Control roadmap swim lanes
- Annotatable compliance checklist
- PDF export

Branded with Credo AI visual identity. Works for any governance brief, with or without the MCP.

### `aigov-share`

Publishes a governance plan HTML visualization to the Governance Insights Hub and returns a permanent shareable URL.

- Requires a Governance Hub account at govportal.lab.credoai.net
- Reads your email from `~/.claude/credoai/email.md` (or legacy `~/.claude/governance-hub-email.md`); prompts once if neither exists
- Supports update and unshare flows via a delete key shown at publish time
- Run as `/share` after `aigov-plan-viz` produces an HTML file

### `aigov-evidence`

Closes the loop between recommended controls (from `aigov-plan`) and actual evidence they're implemented. Two-pass workflow:

1. **Bulk gathering** — generates pointer hints from your tool inventory (W&B for eval metrics, Confluence for policies, etc.) and asks for everything you have. Adapts to each tool's interaction mode (pulls via MCP/CLI/API where possible; asks for paste/upload/screenshot otherwise).
2. **First-pass evaluation** — categorizes each control as Adequate, Partial, or Missing based on sufficiency, recency, scope, and verifiability.
3. **Per-control deep dive** — interrogates Partial and Missing controls to close gaps.

Rigor is calibrated upfront — Lenient / Standard / Audit-ready — defaulting from your governance posture. Output is an Evidence Register saved to `./docs/credoai/aigov_evidence/`. Re-runnable: subsequent runs uplift Partial/Missing items as new evidence arrives.

### `aigov-audit`

Formal assessment of where you actually stand. Takes the governance plan and evidence register, re-queries the MCP for canonical requirement details, then produces a structured Audit Report covering:

- **Per-control evaluations** — Effective / Partially Effective / Ineffective / Not Implemented / Implemented but Unverifiable, with reasoning that links evidence to canonical requirements
- **Residual risk** — post-control risk that actually remains for each risk in the plan
- **Compliance posture** — per obligation, grouped by source regulation (Compliant / Partial / Non-Compliant / N/A)
- **Catalog drift** — flags requirements that have changed in the catalog since the plan was written
- **Recommendations** — 3–5 prioritized actions tied to specific risks/obligations

Audit rigor is calibrated upfront — Pragmatic / Standard / Strict — defaulting from posture. Output is saved to `./docs/credoai/aigov_audits/`. Comparison mode tracks how posture shifts between audits over time.

### `aigov-audit-viz`

Renders an audit as an interactive HTML dashboard for executives, regulators, or board reviews:

- **Initial vs Residual matrices** side by side with movement table
- **Compliance scoreboard** per regulation with stacked-bar visualizations
- **Control effectiveness table** sorted worst-first, expandable for requirement/evidence/reasoning
- **Catalog drift callout** when MCP detected changes since the plan was written
- **Trend view** when comparison-mode audits exist — residual posture and compliance over time
- **PDF export** for static board / regulator deliverables

Same brand as `aigov-plan-viz`, single self-contained HTML file. Output saved to `./docs/credoai/aigov_audit_viz/`. Publishable via `aigov-share`.

## MCP setup

For full catalog-grounded analysis, configure the Governance Intelligence Pro MCP in your Claude Code settings:

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

Contact [engineering@credo.ai](mailto:engineering@credo.ai) for access credentials.
