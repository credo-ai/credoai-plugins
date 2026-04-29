# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **CredoAI plugin marketplace** for [Claude Code](https://code.claude.com/docs/en/plugins). It is a public, curated catalog of plugins — slash commands, agents, skills, and MCP server bundles — published by [Credo AI](https://www.credo.ai) for use by customers and the broader Claude Code community. The repository layout and contribution model are modeled after [`anthropics/claude-plugins-official`](https://github.com/anthropics/claude-plugins-official).

The repo is intentionally **content-only**: nearly every file is Markdown or JSON. There is no application code to build, no service to run, no container to ship.

## Repository Structure

```
.
├── .claude-plugin/
│   └── marketplace.json        # Marketplace index that Claude Code reads
├── plugins/
│   └── <plugin-name>/
│       ├── .claude-plugin/
│       │   └── plugin.json     # Plugin metadata (required)
│       ├── .mcp.json           # MCP server configuration (optional)
│       ├── commands/           # Slash commands (optional)
│       ├── agents/             # Agent definitions (optional)
│       ├── skills/              # Skill definitions (optional)
│       └── README.md
└── .github/workflows/          # CI: marketplace + frontmatter validation
```

## Prerequisites

- [mise](https://mise.jdx.dev/) — installs the toolchain pinned in `.tool-versions` and loads env files declared in `mise.toml`
- [pre-commit](https://pre-commit.com/) — hook runner (also installed via mise)

## Setup

```bash
mise trust
mise install
pre-commit install --install-hooks
cp example.env .local.env   # only needed if you set local env overrides
```

`mise install` installs everything pinned in `.tool-versions`: `prettier`, `yamllint`, `yamlfmt`, `pre-commit`. `pre-commit install` wires hooks into git so they run on every commit.

If this is your first time committing, generate the secrets baseline once:

```bash
detect-secrets scan > .secrets.baseline
```

## Tooling

| Tool               | Scope                             | Purpose                                                                                                             |
| ------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `prettier`         | `*.md`                            | Canonical Markdown formatter for the repo                                                                           |
| `yamllint`         | `*.yaml`, `*.yml`                 | YAML linting (config: `.yamllint.yaml`)                                                                             |
| `yamlfmt`          | `*.yaml`, `*.yml`                 | YAML formatting (config: `.yamlfmt`)                                                                                |
| `check-jsonschema` | `plugin.json`, `marketplace.json` | Validates plugin and marketplace manifests against the upstream [SchemaStore](https://www.schemastore.org/) schemas |
| `actionlint`       | `.github/workflows/*`             | Lints GitHub Actions workflows                                                                                      |
| `detect-secrets`   | repo-wide                         | Catches accidentally committed secrets                                                                              |
| `shellcheck`       | `*.sh`, `*.bash`                  | Shell script linting                                                                                                |
| `pre-commit-hooks` | repo-wide                         | Whitespace, EOF, JSON/YAML/TOML well-formedness, merge-conflict markers                                             |

All hooks are run by `pre-commit` on staged files at commit time; CI runs the same set against the full tree.

## Common Commands

```bash
# Run every hook against the entire tree (matches CI)
pre-commit run --all-files

# Format all Markdown
prettier --write '**/*.md'

# Lint all YAML
yamllint .

# Format all YAML in place
yamlfmt -dstar '**/*.{yaml,yml}'

# Validate a single plugin manifest
check-jsonschema --schemafile https://www.schemastore.org/claude-code-plugin-manifest.json plugins/<name>/.claude-plugin/plugin.json
```

## Plugin Authoring

Each plugin lives under `plugins/<plugin-name>/` and must include a valid `.claude-plugin/plugin.json`. CI rejects plugins whose metadata fails schema validation.

To add a new plugin:

1. Create the directory under `plugins/<plugin-name>/`.
2. Add `.claude-plugin/plugin.json` (required) and any combination of `commands/`, `agents/`, `skills/`, or `.mcp.json`.
3. Write a `README.md` describing what the plugin does, what it requires, and any caveats.
4. Register the plugin in `.claude-plugin/marketplace.json`.
5. Run `pre-commit run --all-files` and address any findings.
6. Open a PR against `main`.

For more on plugin shape, see the [Claude Code plugin documentation](https://code.claude.com/docs/en/plugins).

## Important Notes

- **Markdown formatting is owned by `prettier`.** Do not reintroduce `markdownlint`; the project deliberately converged on a single Markdown formatter.
- **YAML uses both `yamllint` (lint) and `yamlfmt` (format).** Keep their rules aligned — if you change indentation in one, mirror it in the other.
- **Schemas come from upstream [SchemaStore](https://www.schemastore.org/).** `plugin.json` and `marketplace.json` are validated against `claude-code-plugin-manifest.json` and `claude-code-marketplace.json` from SchemaStore, which track the official Claude Code manifest shape. We don't vendor or override these — if a plugin needs a field the upstream schema doesn't know about, fix it upstream rather than forking locally.
- **No application tooling.** This repo does not host Python, Node, or container builds — keep it that way. Contributions that pull in language runtimes or service infrastructure will be rejected.
- **Pin tool versions in `.tool-versions`.** Don't introduce ad-hoc tool dependencies; if a new tool is needed, pin it via mise so every contributor and CI runs the same version.

## About Credo AI

[Credo AI](https://www.credo.ai) is the AI Governance, Risk, and Compliance platform. The plugins published here automate workflows — policy review, evidence collection, integration glue — that Credo AI users and partners commonly run inside Claude Code.

Issues with a plugin should be filed on this repository. For Credo AI product issues, contact your Credo AI representative.
