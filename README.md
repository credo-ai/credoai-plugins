# credoai-plugins

Claude Code plugin marketplace for [Credo AI](https://www.credo.ai) — the AI Governance, Risk, and Compliance platform. This repo is a curated catalog of plugins (slash commands, agents, skills, and MCP bundles) that automate governance workflows inside Claude Code.

> **⚠️ Important:** Make sure you trust a plugin before installing, updating, or using it. Anthropic does not control what MCP servers, files, or other software are included in plugins and cannot verify that they will work as intended or that they won't change. See each plugin's homepage for more information.

## Installation

Add this marketplace to Claude Code:

```
/plugin marketplace add credo-ai/credoai-plugins
```

Then install a plugin:

```
/plugin install <plugin-name>@credoai-plugins
```

Or browse interactively with `/plugin > Discover`.

## Available plugins

### [`governance-intelligence-pro`](./plugins/governance-intelligence-pro)

End-to-end AI governance pipeline powered by Credo AI Governance Intelligence — guided intake, risk-scored governance plans, evidence collection, formal audits, and interactive HTML dashboards.

| Skill | What it does | Requires MCP? |
| --- | --- | --- |
| `aigov-onboarding` | One-time setup capturing org identity, tool inventory + interaction protocol, and governance posture | No |
| `aigov-intake` | Guided interview producing a structured Governance Context Brief | No |
| `aigov-plan` | Risk-scored governance plan with control roadmap, grounded in the Harmonized Controls Framework | Yes — for catalog-grounded mapping |
| `aigov-plan-viz` | Self-contained, branded HTML dashboard for the plan (risk matrix, control swim lanes, compliance checklist) | No |
| `aigov-evidence` | Two-pass evidence collection that categorizes each control as Adequate / Partial / Missing | No |
| `aigov-audit` | Formal audit report with per-control effectiveness, residual risk, compliance posture, and catalog drift | Yes — for canonical requirement details |
| `aigov-audit-viz` | Executive/regulator-ready HTML dashboard for the audit (initial vs residual matrices, compliance scoreboard) | No |
| `aigov-share` | Publishes any plan or audit dashboard to the Governance Insights Hub and returns a shareable URL | No |

Skills work standalone; `aigov-plan` and `aigov-audit` produce their richest output when the **Governance Intelligence Pro MCP** is connected, which grounds risk and control mapping in the live Credo AI catalog. Contact [engineering@credo.ai](mailto:engineering@credo.ai) for MCP access.

See the [plugin README](./plugins/governance-intelligence-pro/README.md) for full per-skill detail and the [plugin CLAUDE.md](./plugins/governance-intelligence-pro/CLAUDE.md) for design constraints and conventions.

## Contributing

Plugins published here are developed and maintained by Credo AI. See [CLAUDE.md](./CLAUDE.md) for repo structure, tooling, and the plugin authoring workflow. External contributions are not accepted at this time — file issues against this repository for plugin bugs, and contact your Credo AI representative for product issues.

## License

See each plugin directory for its specific LICENSE file.

## Documentation

For more on developing Claude Code plugins, see the [official documentation](https://code.claude.com/docs/en/plugins).
