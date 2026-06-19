#!/usr/bin/env node
// Structural verification for the AI system registry (Phase 1, skill-side).
// The skills are markdown, so "tests" assert that each SKILL.md carries the
// instructions the spec's Phase 1 acceptance criteria require.
// Run: node skills/aigov-registry/verify-phase1.mjs   (from the plugin root)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const skillsDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(skillsDir, name, "SKILL.md"), "utf8");

const registry = read("aigov-registry");
const intake = read("aigov-intake");
const plan = read("aigov-plan");
const evidence = read("aigov-evidence");
const audit = read("aigov-audit");

let failures = 0;
const check = (id, cond, msg) => {
  if (!cond) {
    failures++;
    console.error(`✗ ${id}: ${msg}`);
  } else {
    console.log(`✓ ${id}`);
  }
};

const has = (s, re) => re.test(s);

// AC1.1 — intake mints sys_<slug>_<hash> and writes a roster row in registry.md
check(
  "AC1.1",
  has(intake, /sys_<slug>_<6-hex>/) && has(intake, /registry\.md/) && has(intake, /roster row/i),
  "intake must mint sys_<slug>_<hex> and append a roster row to registry.md",
);

// AC1.2 — intake/plan/evidence/audit each stamp system_id + artifact_type frontmatter
for (const [name, doc, type] of [
  ["intake", intake, "intake"],
  ["plan", plan, "plan"],
  ["evidence", evidence, "evidence"],
  ["audit", audit, "audit"],
]) {
  check(
    `AC1.2/${name}`,
    has(doc, /system_id:/) && has(doc, new RegExp(`artifact_type:\\s*${type}`)),
    `${name} SKILL.md must document a frontmatter stamp with system_id + artifact_type: ${type}`,
  );
}

// AC1.3 — plan/evidence/audit resolve by system_id, with a chooser, never cross-pairing;
// and the old "ls -t … | head -1" plan/evidence discovery is gone.
for (const [name, doc] of [
  ["plan", plan],
  ["evidence", evidence],
  ["audit", audit],
]) {
  check(
    `AC1.3/${name}-byid`,
    has(doc, /system_id/) && has(doc, /registry\.md/),
    `${name} must resolve inputs by system_id via registry.md`,
  );
}
check(
  "AC1.3/no-most-recent",
  !has(evidence, /ls -t \.\/docs\/credoai\/aigov_plans\/\*\.md 2>\/dev\/null \| head -1/) &&
    !has(audit, /ls -t \.\/docs\/credoai\/aigov_plans\/\*\.md 2>\/dev\/null \| head -1/),
  "evidence/audit must not keep the 'most recent file' (ls -t | head -1) plan discovery",
);
check(
  "AC1.3/no-cross-pair",
  has(evidence, /never (?:evaluate a plan|pair)/i) && has(audit, /never (?:audit|pair)/i),
  "evidence + audit must state they never pair artifacts across system_ids",
);

// AC1.4 — aigov-registry derives state from artifact existence; never stores it
check(
  "AC1.4",
  has(registry, /derive-on-read/i) &&
    has(registry, /never (?:store|stored)/i) &&
    has(registry, /aigov_(?:intake|plans|evidence|audits)/),
  "aigov-registry must derive state from artifacts and never store it",
);

// AC1.5 — aigov-registry pre-registers un-assessed systems with triage
check(
  "AC1.5",
  has(registry, /pre-register/i) && has(registry, /triage/i) && has(registry, /not yet assessed|not been assessed/i),
  "aigov-registry must support pre-registering un-assessed systems with triage",
);

// AC1.6 — maturity is not a per-system lifecycle stage
check(
  "AC1.6",
  has(registry, /[Mm]aturity is .*org-level|never shown as a per-system|keep it out of the per-system/i),
  "aigov-registry must exclude maturity from the per-system lifecycle",
);

// AC1.7 — sync is explicit + roster-only
check(
  "AC1.7",
  has(registry, /roster-only|roster only/i) &&
    has(registry, /never (?:happens automatically|auto-?sync)|explicit/i),
  "aigov-registry must make sync explicit and roster-only",
);

// Phase-1 deleteKey contract — registry persists + resends the per-system key
check(
  "AC-KEY",
  has(registry, /deleteKey/) &&
    has(registry, /persist|saved? to the sidecar|save it/i) &&
    has(registry, /resend|re-?sync/i) &&
    has(registry, /never .*(commit|registry\.md)/i),
  "aigov-registry must persist each deleteKey locally and resend it on re-sync, never committing keys",
);

// AC1.8 — intake reuses an existing system_id (no duplicate row)
check(
  "AC1.8",
  has(intake, /reuse/i) && has(intake, /do not mint a second|never mint a second/i),
  "intake must reuse an existing system_id rather than minting a duplicate",
);

console.log(
  failures === 0
    ? "\nPhase 1 structural checks: ALL PASS"
    : `\nPhase 1 structural checks: ${failures} FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
