---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/ops-safe-mutation/SKILL.md; no editar.
source: .agents/skills/ops-safe-mutation/SKILL.md
source_sha256: 713b02de7af0d86c98d02be9111334a3c933f941f5b7a4e2a97a731da1e0a5f9
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/ops-safe-mutation/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# ops-safe-mutation


## Antic: socdepoble-safe-patch-planning

---
name: socdepoble-safe-patch-planning
lang: en
description: Converts verified findings into minimal, reversible implementation plans with exact files, tests, risk classification, rollback and receipt requirements.
triggers_ca:
  - pegat
  - pla de correcció
  - reparació
  - aplicar canvis
  - rollback
triggers_en:
  - patch plan
  - remediation plan
  - safe fix
  - rollback plan
version: 1.0.0
status: proposed
abast:
  - global
---

# Safe Patch Planning

## Objective
Turn an audit finding into a bounded patch plan. This skill plans changes; it does not apply them automatically.

## Planning Rules
1. Start from a reproduced finding.
2. Define the smallest complete behaviour change.
3. Name exact files and symbols.
4. Separate source files from generated files.
5. Do not combine unrelated cleanup.
6. Preserve uncommitted work.
7. Avoid renames unless required.
8. Avoid broad codemods when a local patch suffices.
9. Add a regression test before or with the fix.
10. State what cannot be proven from the available scope.

## Risk Classification
Classify each operation:
- `low`: isolated reversible source change with no security/data/routing impact;
- `medium`: multiple files, public UI, route or persistence behaviour;
- `high`: security, privacy, schema, routing, generated artifacts, more than five files, deletion, rename, restoration, deployment or external communication.

High-risk changes require:
- human decision;
- exact scope;
- immutable plan digest;
- Reflex `open`;
- selective manifest;
- `seal`;
- one-time mutation claim;
- backup or rollback;
- post-change verification.

## Plan Format
```json
{
  "schema": "socdepoble.safe-patch-plan.v1",
  "problem": "string",
  "evidence": [],
  "risk": "low|medium|high",
  "operations": [
    {
      "id": "PATCH-001",
      "file": "src/example.js",
      "symbol": "functionName",
      "change": "string",
      "reason": "string",
      "test": "string",
      "rollback": "string"
    }
  ],
  "unchanged": [],
  "human_decisions": [],
  "verification": [
    "build",
    "lint",
    "unit test",
    "route smoke test",
    "accessibility check",
    "security check"
  ],
  "receipt_required": true
}
```

## Patch Discipline
- Never overwrite a file from HEAD without checking current worktree state.
- Never restore or reset Git state automatically.
- Never delete a file to silence an audit finding.
- Never update a generated mirror without updating or verifying its source.
- Never claim “fixed” before the regression test passes.
- If the plan becomes stale, stop and regenerate it.
- If an operation fails after partially changing state, stop, inspect, restore through the recorded rollback and invalidate the lease if required.

## Verification Matrix
For frontend routing changes, verify:
- direct navigation;
- browser refresh;
- legacy alias;
- unknown route;
- WordPress rewrite;
- canonical URL;
- keyboard navigation.

For persistence changes, verify:
- first write;
- duplicate write;
- reload;
- network failure;
- recovery;
- ownership isolation;
- error visibility.

For security changes, verify:
- malicious HTML;
- malicious URL;
- malformed config;
- secret scanning;
- generated bundle;
- production build.

## Acceptance Criteria
A plan is complete only when another engineer can apply it without guessing:
- exact targets;
- exact expected diff;
- exact tests;
- exact rollback;
- exact authority;
- exact unresolved decisions.


## Antic: trust-verify-execute

---
name: trust-verify-execute
lang: en
description: "Three-step verification before ANY code mutation: Trust the intention, Verify the state, Execute only after confirmation."
version: 1.0.0
status: canonic
abast: ["global"]
---

# Trust, Verify, Execute

## Activation
Before ANY code mutation, file write, or system command.

## Rules

### R1. Trust
- Understand the user's INTENT
- What are they trying to achieve?
- What's the context?
- Document the assumption

### R2. Verify
Before touching ANYTHING:
1. `git status` — what's changed?
2. `git diff` — what's the current state?
3. `ls -la` — what files exist?
4. `npm list` — what dependencies are there?
5. Check the specific file(s) to be modified

### R3. Execute
Only after R1 and R2 are complete:
1. Create a backup (copy to .sdp-backups/)
2. Make the change
3. Verify the change
4. Test the change
5. If any step fails → revert and report

## Prohibited
- NEVER execute `git checkout HEAD <file>` without first checking the file exists
- NEVER execute `git reset --hard` without explicit user confirmation
- NEVER delete a file without checking if it's referenced elsewhere
- NEVER refactor "because it looks cleaner" — only if it fixes a bug or adds a feature

## Output Format
```
TRUST: I understand you want to fix the memory leak in chat messages.
VERIFY: 
  - git status: clean
  - File exists: src/sections/xat/chatRuntime.js
  - Current code: lines 27-32 show the accumulator pattern
EXECUTE: 
  - Backup created: .sdp-backups/chatRuntime.js.bak
  - Modified: added limit of 1000 messages
  - Tested: with 2000 messages, memory usage now stable
  - Verified: no regressions
```


## Antic: codi-corrector-segons-esquema

---
name: codi-corrector-segons-esquema
lang: ca
description: "Precisió en la generació de codi mitjançant decodificació restringida."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: CODI_CORRECTOR_SEGONS_ESQUEMA

## Objectiu
Garantir que el codi generat compleixi estrictament amb les especificacions requerides i eviti errors de sintaxi o tipus.

## Instrucció
Si s'està generant codi, has d'identificar l'esquema o tipus esperat (p. ex., TypeScript interface, JSON Schema, SQL grammar). Has d'aplicar un decodificador restringit que obligui la teva sortida a complir estrictament amb aquest esquema. Aquesta validació a temps d'execució és més fiable que una posterior revisió manual i garanteix la generació de codi sintàcticament i semànticament correcte.


## Antic: socdepoble-autosanacio

---
name: socdepoble-autosanacio
lang: en
description: "Audits the Sóc de Poble graph in read-only mode and generates a verifiable plan for unresolved links, orphans, and empty notes. Use when graph hygiene or repair is requested."
triggers_ca: ["autosanacio", "reparar graf", "orfes", "enllaços trencats"]
triggers_en: ["graph hygiene", "orphans", "repair links"]
version: 2.0.0
status: canonic
abast: ["global"]
---

# Graph Auto-Healing (Immune System)

## Contract and Authority

This skill executes graph diagnostics. Diagnostics are **100% READ_ONLY**. The audit generates an issue list and never mutates files directly. 
If the canonical auditor is unavailable or a precondition fails, return ERROR or NOT_RUN, never PASS. Do not deceive the user with false greens.

## Diagnostic Execution (Phase 1)

Use system tools to analyze the state of knowledge (e.g., searching for broken wikilinks, unlinked orphans, or empty pages).

For each detected issue, indicate:
- Error identifier and severity.
- File/line and evidence.
- Classification: ghost (unresolved link), ambiguous, orphan, empty, or exclusion.
- Proposed solution, confidence level of your proposal, and alternatives.
- Files that would change and rollback proof.

**Diagnostic Limits:** Do not invent destinations just to make an error disappear quickly. Do not rewrite a link purely based on name similarity without being certain. Respect canaries, exclusions, and Escriptori zones.

## Applying Solutions (Phase 2)

Applying the recommended solutions or recipes from the diagnostic is a completely different **SOURCE_MUTATION** operation. To execute it, you must comply with the Universal Workflow:
1. Re-audit the state if time has passed since the original audit.
2. Request permission from the Master with a clear plan (`implementation_plan.md` or a sealed Petorreta).
3. Obtain authorization / lease from the Reflex protocol.
4. Apply the changes with the appropriate tools.
5. Verify the resulting graph.

Quarantine can only affect exact and recoverable targets. Code or notes are never deleted without Reflex and explicit confirmation.


## Antic: socdepoble-llm-wiki

---
name: socdepoble-llm-wiki
lang: en
description: "Distills raw notes into the Wiki with traceability, idempotency, and canonical schema. Use when the user asks to process 00_Raw or reorganize knowledge."
triggers_ca: ["processar", "00_Raw", "destil·lar", "notes"]
triggers_en: ["process raw", "distill notes", "reorganize knowledge"]
version: 2.0.0
status: canonic
abast: ["global"]
---

# LLM Wiki (Silent Architecture)

## Activation and Scope
Activated by an explicit request to process `00_Raw`, distill notes, or audit the graph. It does not run automatically at the start or end of a session.

## Phase A — Read-only diagnostic
1. Verify root, schema, canonical zones, and current policy.
2. Inventory only the sources included in the request.
3. For each fragment, identify destination, duplicates, conflicts, provenance, and confidence.
4. Produce a plan with proposed diff and verification criteria.

Do not assume that every orphan is trash. An orphan is an editorial signal, not a delete command.

## Phase B — Authorized integration
Only with the SOURCE_MUTATION flow:
- integrate the fragment into the correct semantic section;
- preserve meaning, authorship, and provenance;
- avoid duplicating equivalent ideas;
- create a new note only if no coherent destination exists;
- generate the frontmatter from the canonical schema, without invented fields or generic Obsidian metadata;
- verify links, schema, and diff before confirming.

## Phase C — Origin
Do not delete or move from `00_Raw` until the destination has been verified. Propose quarantine or archive as a separate and recoverable operation.

## Result
Report: read sources, integrated fragments, omitted duplicates, open conflicts, changed files, verifications, and unexecuted operations.


## Antic: socdepoble-zero-slop

---
name: "socdepoble-zero-slop"
description: "Instrucció estricta per retornar únicament diffs o funcions modificades, conservant l'energia humana."
---
# Cirurgia de Codi
Queda terminantment prohibit retornar fitxers sencers si només canvia un bloc de codi.
Utilitza sempre el format "Search & Replace" o mostra exclusivament la funció alterada. Mai trenques la regla termodinàmica de sobrescriure fitxers sans amb codi innecessari.

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
