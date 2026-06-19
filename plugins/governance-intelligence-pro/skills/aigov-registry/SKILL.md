---
name: aigov-registry
description: Use to see or manage the registry of AI systems under governance — phrases like "registry", "inventory", "my systems", "what systems do we govern", "portfolio", "pre-register a system", "sync my registry", "/registry". Renders the roster with derived lifecycle state, pre-registers systems not yet assessed, and (explicitly, per-system) syncs the roster to the Governance Hub.
---

# Governance Registry

## Overview

The registry is the roster of every entity under governance. The local files
are the source of truth: each system has a stable `system_id`, and its
lifecycle state is **derived from which artifacts exist** — never stored — so
the roster can never drift from what has actually been done.

This skill does three things:

1. **View** the portfolio (derive-on-read render of the roster + state).
2. **Pre-register** a system that has not been assessed yet (triage front-end).
3. **Sync** selected systems to the Governance Hub — explicit, per-system,
   roster-only.

## The registry file — `docs/credoai/registry.md`

One roster file, local-first (`./docs/credoai/registry.md`), global fallback
(`~/.claude/credoai/registry.md`). It holds only **maintained** fields; it does
**not** store lifecycle state.

```markdown
---
schema_version: 1
---

| System ID            | Name        | Domain        | Autonomy   | Triage       | Registered |
| -------------------- | ----------- | ------------- | ---------- | ------------ | ---------- |
| sys_hireassist_a1b2  | HireAssist  | HR & hiring   | advisory   | full plan    | 2026-06-18 |
| sys_supportbot_g7h8  | SupportBot  | General       | advisory   | light screen | 2026-06-18 |
```

`Triage` is one of: `full plan` / `light screen` / `out-of-scope`.

## `system_id`

Format: `sys_<slug>_<6-hex>` (slug = lowercase name, spaces→hyphens, special
chars stripped). Minted once by `aigov-intake` (or by pre-registration here) and
reused forever — re-running intake on the same system MUST reuse the existing
`system_id`, never mint a second row. Every artifact-producing skill stamps the
`system_id` into its output file's frontmatter.

## Step 1 — View the portfolio (derive-on-read)

Read the roster, then compute each system's state by scanning the artifact
directories — do NOT read state from any stored field.

```bash
cat ./docs/credoai/registry.md 2>/dev/null || cat ~/.claude/credoai/registry.md 2>/dev/null
ls ./docs/credoai/aigov_intake/ ./docs/credoai/aigov_plans/ \
   ./docs/credoai/aigov_evidence/ ./docs/credoai/aigov_audits/ 2>/dev/null
```

For each roster row, match artifacts by their frontmatter `system_id` (fall back
to slug match for pre-existing files written before IDs existed):

| Stage     | Complete when…                                                            |
| --------- | ------------------------------------------------------------------------- |
| Intake    | an `aigov_intake/` file matches the `system_id`                           |
| Plan      | an `aigov_plans/` file matches                                            |
| Evidence  | an `aigov_evidence/` register matches; read its Adequate/Partial/Missing summary — all evaluated → `complete`, some still Partial/Missing → `in_progress` |
| Audit     | an `aigov_audits/` file matches                                           |

Last activity = newest matching artifact date. **Maturity is org-level — never
shown as a per-system stage.** Render a compact table: Name · `system_id` ·
lifecycle (Intake→Plan→Evidence→Audit) · state label · last activity.

## Step 2 — Pre-register a system (not yet assessed)

When the user wants to track a system before assessing it, capture it with
`AskUserQuestion` (name; domain; triage = full plan / light screen /
out-of-scope) and append a roster row with a freshly minted `system_id`. Create
`registry.md` with the `schema_version: 1` frontmatter if it does not exist. The
system appears as "Registered · not yet assessed" until artifacts exist.

## Step 3 — Sync to the Governance Hub (explicit, per-system, roster-only)

Sync never happens automatically. When the user asks to sync, show the roster
and let them pick which systems to publish. For each selected system, derive its
current state (Step 1) and POST the **roster only** — never artifact content
(artifacts continue through `aigov-share`).

Resolve the publishing email exactly as `aigov-share` does:

```bash
cat ~/.claude/credoai/email.md 2>/dev/null || cat ~/.claude/governance-hub-email.md 2>/dev/null
```

**The `deleteKey` is the per-system bearer token.** The first sync of a system
returns a `deleteKey`; the server then **requires that same key to update
(re-sync) or unsync** the entry — the body email alone is unauthenticated, so
without the key anyone who knew an account email + `system_id` could overwrite
another account's roster. So you must **persist each system's key and resend it
on every later sync.**

Persist keys in a local, non-committed sidecar keyed by `system_id` — never in
`registry.md` (that roster is human-readable and may be committed; keys must not
leak into git):

```bash
# docs/credoai/.registry-sync.json  (add to .gitignore)
# { "sys_hireassist_a1b2": "<deleteKey>", ... }
```

On **first sync** of a system, omit `deleteKey`; on **re-sync**, read the saved
key for that `system_id` and include it:

```bash
# look up a previously saved key (empty on first sync)
KEY=$(jq -r --arg id "sys_hireassist_a1b2" '.[$id] // empty' docs/credoai/.registry-sync.json 2>/dev/null)

curl -sL -X POST https://backend-development-736b.up.railway.app/api/registry \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg email "EMAIL" \
    --arg systemId "sys_hireassist_a1b2" \
    --arg systemName "HireAssist" \
    --arg domain "HR & hiring" \
    --arg triage "full plan" \
    --arg key "$KEY" \
    --argjson state '{"intake":true,"plan":true,"evidence":"complete","audit":true,"lastActivity":"2026-06-12"}' \
    '{email:$email, systemId:$systemId, systemName:$systemName, domain:$domain, triage:$triage, state:$state}
       + (if $key == "" then {} else {deleteKey:$key} end)')"
```

The response returns the `deleteKey`. On first sync, **save it** to the sidecar
above so future re-syncs and unsync can authenticate. A 403 with "already
synced" means you re-synced without the saved key — recover it from the sidecar
(or unsync and re-create). A 403 with "no account" means the email has no
Governance Hub account → point the user to govportal.lab.credoai.net.

Unsync one system:

```bash
curl -sL -X DELETE https://backend-development-736b.up.railway.app/api/registry/sys_hireassist_a1b2 \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg email "EMAIL" --arg key "DELETEKEY" '{email:$email, deleteKey:$key}')"
```

The synced systems appear in the Governance Intelligence client (name ·
`system_id` · derived state · last activity).

## Common mistakes

**Storing derived state in the roster.** State is recomputed from artifact
existence every time. Never add a "state" column to `registry.md`.

**Auto-syncing.** Sync is always an explicit user action, per system. Never push
on intake/plan/audit completion.

**Syncing artifacts.** The registry sync is roster-only. Artifact HTML goes
through `aigov-share`, not here.

**Minting a second `system_id`.** Always reuse the existing row's `system_id`
for a system already in the roster.

**Showing maturity as a per-system stage.** Maturity is an org-level assessment;
keep it out of the per-system lifecycle.

**Losing the `deleteKey`.** Re-syncing a system without its saved key is a 403.
Persist every key to the local sidecar on first sync and resend it on update;
never write keys into the committed `registry.md`.
