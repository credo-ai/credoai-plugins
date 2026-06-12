---
name: aigov-share
description: Publish, update, or remove governance artifact HTML dashboards (plans, audits, or maturity assessments) on the Governance Hub. Use when the user says "share this", "publish this", "make this shareable", "/share", "update shared", "/update", "unshare", or "remove shared".
allowed-tools: Read, Bash, Glob, Write
---

Publish a governance artifact HTML visualization (plan, audit, or maturity assessment) to the Governance Insights Hub so it's accessible via a permanent shareable URL associated with your account. Requires a Governance Hub account (govportal.lab.credoai.net).

The skill auto-detects the artifact type from the source directory of the HTML file:

- File under `aigov_plan_viz/` → `artifactType = "plan"`
- File under `aigov_audit_viz/` → `artifactType = "audit"`
- File under `aigov_maturity_viz/` → `artifactType = "maturity"`
- Anything else → `artifactType = "plan"` (back-compat default)

It also parses `systemName` from the filename slug (for maturity assessments this is the organization name) and `artifactDate` (today's date for plans; from filename or current date for audits; the assessment date for maturity) and sends them as metadata so the Governance Hub can list and filter artifacts by type, system, and date.

---

## EMAIL RESOLUTION

Before any flow, resolve the user's Governance Hub email:

1. Check `~/.claude/credoai/email.md` first (new location), then `~/.claude/governance-hub-email.md` (legacy):
   ```bash
   cat ~/.claude/credoai/email.md 2>/dev/null || cat ~/.claude/governance-hub-email.md 2>/dev/null
   ```
2. If either file exists and contains an email, use it silently.
3. If neither exists, ask the user once:

   > "What's your Governance Hub email? (govportal.lab.credoai.net)"

   After they provide it, save it to the new location:

   ```bash
   mkdir -p ~/.claude/credoai
   echo "EMAIL" > ~/.claude/credoai/email.md
   ```

   Suggest running `aigov-onboarding` to capture additional organizational context.

---

## METADATA EXTRACTION

For every share/update, derive metadata from the source path before calling the API:

| Field          | How to derive                                                                                                                                                                                                                                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `artifactType` | `"audit"` if the file path includes `/aigov_audit_viz/`; `"maturity"` if it includes `/aigov_maturity_viz/`; otherwise `"plan"` (covers `aigov_plan_viz/` and any other directory by default)                                                                                                                                                                                           |
| `systemName`   | Strip the trailing `-aigov-plan.html`, `-aigov-audit.html`, or `-aigov-maturity.html` suffix from the filename, replace hyphens with spaces, and Title Case the result. E.g. `retailassist-aigov-audit.html` → `"Retailassist"`. For maturity artifacts this is the organization name. If the user provided a name in the conversation, prefer that — it's more accurate than the slug. |
| `artifactDate` | Today's date in `YYYY-MM-DD` (use `date +%Y-%m-%d`). For audits and maturity assessments, prefer the date in the source markdown if available, but today's date is a safe fallback.                                                                                                                                                                                                     |

These three fields go in the JSON body alongside `html` and `email`. Send them on both POST (publish) and PUT (update). The backend treats every field as optional and defaults `artifactType` to `"plan"` server-side if omitted, but always send them for clarity.

---

## SHARE FLOW

Use when the user wants to publish a governance artifact visualization.

### Steps

1. **Find the HTML file:**
   - If the user provided a path in `$ARGUMENTS`, use that file.
   - Otherwise, prefer most-recently-modified `.html` files in this order:
     1. `./docs/credoai/aigov_maturity_viz/`
     2. `./docs/credoai/aigov_audit_viz/`
     3. `./docs/credoai/aigov_plan_viz/`
     4. Current directory + common output locations (`out/`, `dist/`, `build/`, `output/`)
   - If multiple files found and none specified, list them and ask which to share.

2. **Check if already shared in this conversation:**
   - If you have an `id` and `deleteKey` from a previous share of this same file, ask once:
     > "This file was shared earlier as [URL]. Update that link or create a new one?"
   - If they choose update, use the UPDATE FLOW instead.

3. **Resolve email** (see EMAIL RESOLUTION above).

4. **Extract metadata** (see METADATA EXTRACTION above).

5. **Read the file** using the Read tool. Verify it contains HTML.

6. **Publish** with metadata in the JSON body:

   ```bash
   curl -sL -X POST https://backend-development-736b.up.railway.app/api/published-plans \
     -H "Content-Type: application/json" \
     -d "$(jq -n \
       --arg html "$(cat FILE_PATH)" \
       --arg email "EMAIL" \
       --arg artifactType "ARTIFACT_TYPE" \
       --arg systemName "SYSTEM_NAME" \
       --arg artifactDate "ARTIFACT_DATE" \
       '{html: $html, email: $email, artifactType: $artifactType, systemName: $systemName, artifactDate: $artifactDate}')"
   ```

   If `systemName` is unknown, omit that field from the jq object — don't pass an empty string.

7. **Parse the response** and present clearly. Tailor the message to the artifact type:

   > Published! Your shareable link:
   > https://frontend-development-3133.up.railway.app/view/ID
   >
   > Delete key: `DELETEKEY` — save this if you want to update or remove the {{plan / audit / maturity assessment}}.
   >
   > This {{plan / audit / maturity assessment}} is linked to your Governance Hub account at EMAIL.

**If the request returns 403:**

> Your email (EMAIL) doesn't have a Governance Hub account. Sign up at https://govportal.lab.credoai.net first, then try again.
>
> To use a different email: delete `~/.claude/credoai/email.md` (or `~/.claude/governance-hub-email.md` if it's the legacy file) and run `/share` again.

**If the request fails (network error or blocked):**

> The request to the Governance Hub backend was blocked. This is a Claude settings issue.
>
> **Quick fix:** Settings → Capabilities → Code execution and file creation → set Domain allowlist to "All domains" → start a new chat and try again.

---

## UPDATE FLOW

Use when the user wants to update an existing shared artifact.

### Steps

1. **Get the artifact ID:**
   - If available from a previous share in this conversation, use it.
   - If the user provided a URL or ID in `$ARGUMENTS`, extract the ID (the part after `/view/`).
   - Otherwise ask: "Which artifact do you want to update? Provide the URL or ID."

2. **Get the delete key:**
   - If available in this conversation, use it.
   - Otherwise ask: "What is the delete key for this artifact? (It was shown when you first published it.)"

3. **Find the updated HTML file** (same logic as SHARE FLOW step 1).

4. **Extract metadata** (see METADATA EXTRACTION above) — same fields as SHARE.

5. **Read the file** using the Read tool.

6. **Update** with metadata so the listing reflects re-runs (e.g. a re-audited system gets a new `artifactDate`):

   ```bash
   curl -sL -X PUT https://backend-development-736b.up.railway.app/api/published-plans/ID \
     -H "Content-Type: application/json" \
     -d "$(jq -n \
       --arg html "$(cat FILE_PATH)" \
       --arg key "DELETEKEY" \
       --arg artifactType "ARTIFACT_TYPE" \
       --arg systemName "SYSTEM_NAME" \
       --arg artifactDate "ARTIFACT_DATE" \
       '{html: $html, deleteKey: $key, artifactType: $artifactType, systemName: $systemName, artifactDate: $artifactDate}')"
   ```

   If a metadata field is unknown, omit it from the jq object — the backend preserves the previously stored value when a field is missing from the update.

7. **Show result:**
   > Updated! Your link is still: https://frontend-development-3133.up.railway.app/view/ID

---

## UNSHARE FLOW

Use when the user wants to remove a previously shared artifact.

### Steps

1. **Get the artifact ID** (same as UPDATE FLOW step 1).

2. **Get the delete key** (same as UPDATE FLOW step 2).

3. **Delete:**

   ```bash
   curl -sL -X DELETE https://backend-development-736b.up.railway.app/api/published-plans/ID \
     -H "Content-Type: application/json" \
     -d "$(jq -n --arg key "DELETEKEY" '{deleteKey: $key}')"
   ```

4. **Show result:**
   - On success: `> Done. The artifact has been removed.`
   - On 403: `> The delete key is incorrect. Please check and try again.`
   - On 404: `> That artifact was not found. It may have already been removed.`

---

## Common mistakes

**Forgetting to send metadata.** The Governance Hub will accept a POST without metadata (defaulting `artifactType` to "plan") but the listing will be miscategorized for audits. Always extract and send all three fields.

**Empty-string metadata.** Don't send `""` — omit the field from the jq object instead. An empty string is meaningfully different from `null`.

**Hardcoding artifactType.** Detect from source path (`aigov_maturity_viz/` vs `aigov_audit_viz/` vs `aigov_plan_viz/`). Don't assume "plan" by default if the file came from a typed directory.

**Reusing a stale systemName.** If the user re-runs an audit on the same system but renames it (e.g. "HireAssist" → "HireAssist v2"), use the current name from the latest filename or conversation context, not a memory from earlier.
