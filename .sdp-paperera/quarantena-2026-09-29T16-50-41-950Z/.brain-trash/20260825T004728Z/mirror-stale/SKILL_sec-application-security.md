---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/sec-application-security/SKILL.md; no editar.
source: .agents/skills/sec-application-security/SKILL.md
source_sha256: 6de0eb360fa1047d1e02dfa694e1d72bf8ea1d8a4a40967f65cd75c50d712e4f
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/sec-application-security/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# sec-application-security


## Antic: pedra-seca-security-audit

---
name: pedra-seca-security-audit
lang: ca
description: "Protocol d'auditoria de seguretat per a arquitectures React offline-first amb injecció de contingut HTML i persistència local."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: Pedra Seca Security Audit

## Description
Protocol d'auditoria de seguretat per a arquitectures React offline-first amb injecció de contingut HTML i persistència local. Dissenyat per a blindar el Mas Electrònic contra XSS, fuites de dades i mutacions destructives.

## When to use
- Abans de donar per bo qualsevol component que usa `dangerouslySetInnerHTML`.
- Quan s'introdueix una nova font de dades (API, localStorage, BroadcastChannel).
- En revisions de codi (code review) dins del projecte Sóc de Poble.

## Principles
1. **Mai confiar en l'input remot**: Tot el que ve de Supabase, localStorage o BroadcastChannel és hostil fins que es demostra el contrari.
2. **Sanitització per capes**: Validació d'esquema (Zod) → Sanitització HTML (DOMPurify strict) → Render.
3. **CSP com a muralla**: La Content Security Policy és l'última línia de defensa; mai l'ometa.
4. **Zero estils inline**: Els `style={{}}` són portes giratòries per a atacs de clickjacking i inconsistències de tema.

## Procedure
1. Identificar tots els punts d'entrada de dades (props, fetch, localStorage, URL params).
2. Preguntar: "Puc injectar un `<script>` aquí?". Si la resposta és "no ho sé", és un "sí".
3. Aplicar `DOMPurify.sanitize()` amb configuració restrictiva:
   ```js
   const STRICT = {
     ALLOWED_TAGS: ['p','br','strong','em','h1','h2','h3','h4','h5','h6','ul','ol','li','a','img','blockquote'],
     ALLOWED_ATTR: ['href','src','alt','title'],
     FORBID_ATTR: ['style','onerror','onload','onclick'],
     ALLOW_DATA_ATTR: false
   };
   ```
4. Per a inputs de text pla, usar `textContent`, mai `innerHTML`.
5. Verificar que `crypto.getRandomValues` o `crypto.randomUUID` tenen fallback per a dispositius antics (A10).

## Anti-patterns
- Usar DOMPurify amb configuració per defecte en contingut remot.
- Fer `document.head.innerHTML += ...` per a SEO.
- Depèn de `localStorage` per a payloads > 1KB sense gestió de quota.


## Antic: socdepoble-adversarial-code-review

---
name: socdepoble-adversarial-code-review
lang: en
description: Performs evidence-based red-team review of frontend systems, state flows, lifecycle boundaries, security sinks and failure modes without modifying source files.
triggers_ca:
  - red team
  - auditoria inversa
  - forat
  - estabilitat
  - memòria
triggers_en:
  - red team
  - adversarial review
  - stability audit
  - frontend security review
version: 1.0.0
status: proposed
abast:
  - global
---

# Adversarial Code Review

## Objective
Try to break the requested scope logically before proposing fixes. Review actual code, configuration and tests. Never grant a score or security claim without reproducible evidence.

## Review Dimensions
Inspect:
1. startup and build reachability;
2. route reachability and aliases;
3. state ownership and mutation boundaries;
4. asynchronous cancellation and race conditions;
5. event listener and timer cleanup;
6. circular imports and initialization order;
7. persistence, identity and idempotency;
8. HTML, URL, script and data injection sinks;
9. secret and personal-data exposure;
10. accessibility and keyboard/focus behaviour;
11. CSS/token consistency;
12. degraded network and partial failure behaviour;
13. packaging and host integration;
14. tests that can give false greens.

## Attack Scenarios
Attempt at least these scenarios when relevant:
- mount, unmount and remount the component repeatedly;
- move a custom element between DOM parents;
- change configuration attributes while mounted;
- remove configuration attributes;
- start two loads concurrently;
- navigate rapidly between routes;
- submit the same action twice;
- reload after a partial write;
- lose network after optimistic UI;
- receive malformed remote content;
- inject HTML, URLs, attributes and Markdown;
- use duplicate IDs, duplicate titles and ambiguous basenames;
- run at narrow viewport widths;
- run with reduced motion and keyboard only;
- load the standalone bundle inside a hostile host CSS environment.

## Evidence Rules
Each finding must include:
- ID;
- severity;
- exact file and symbol or line;
- observed behaviour;
- trigger;
- impact;
- confidence;
- minimal remediation;
- regression test;
- rollback consideration.

Use these severities:
- `P0`: data loss, code execution, total startup/routing failure or unsafe default;
- `P1`: major functional failure, privacy flaw, race or false success;
- `P2`: maintainability, accessibility, performance or integration risk;
- `P3`: clarity, cleanup or non-blocking improvement.

## False-Green Detection
Treat a check as invalid when:
- it scans only comments or literal class strings;
- it returns zero findings after an exception;
- it ignores missing files;
- it checks source but not the generated bundle;
- it tests only a mocked fallback;
- it reports a score without numerator, denominator, scope and timestamp;
- it silently excludes the failing path.

## Output Contract
```json
{
  "ok": false,
  "scope": [],
  "findings": [
    {
      "id": "P0-001",
      "severity": "P0",
      "file": "string",
      "symbol": "string",
      "evidence": "string",
      "trigger": "string",
      "impact": "string",
      "confidence": "high",
      "remediation": "string",
      "regression_test": "string",
      "rollback": "string"
    }
  ],
  "unverified": [],
  "recommended_order": []
}
```

## Mutation Boundary
The review is read-only. Fixes require a separate plan, exact targets, human approval when the risk is material, Reflex lease and post-change verification.

## Acceptance Criteria
- No “10/10” is issued if any P0 or P1 remains.
- No finding is based only on a documentation claim.
- Every untestable property is labelled unverified.
- Proposed changes are smaller than a rewrite unless a rewrite is proven necessary.


## Antic: socdepoble-contract-consistency

---
name: socdepoble-contract-consistency
lang: en
description: Detects contradictions between routes, schemas, tokens, documentation, build scripts, host integration and runtime behaviour before they become destructive changes.
triggers_ca:
  - contradiccions
  - contracte
  - routing
  - tokens
  - schema
triggers_en:
  - contract consistency
  - contradictory docs
  - route contract
  - schema drift
version: 1.0.0
status: proposed
abast:
  - global
---

# Contract Consistency

## Objective
Find incompatible declarations across the project and identify the authoritative source. Do not resolve a contradiction by guessing or by making the most convenient source win.

## Contracts to Compare
Build a matrix for:
- route declarations versus rendered routes;
- route aliases versus canonical URLs;
- data modes versus runtime branches;
- schema enums versus seed values;
- CSS tokens versus token consumers;
- class names versus CSS selectors;
- package scripts versus executable files;
- generated files versus source files;
- WordPress rewrite rules versus React basename;
- SEO manifest versus actual public routes;
- fallback claims versus real persistence;
- Skills versus executable tooling;
- documentation versus tests;
- demo data versus production configuration.

## Authority Resolution
For each contradiction, classify the sources:
1. executable safety protocol;
2. current tests;
3. current code/configuration;
4. canonical governance;
5. generated mirror;
6. historical document;
7. proposal or vendor reference.

Never use a generated mirror to override source code. Never use historical prose to override an executable contract.

## Procedure
1. Inventory declarations.
2. Normalize names and aliases.
3. Create a producer/consumer matrix.
4. Identify missing producers and dead consumers.
5. Detect duplicate sources of truth.
6. Mark contradictions as:
   - `same_concept_different_layer`;
   - `true_conflict`;
   - `stale_reference`;
   - `missing_implementation`;
   - `ambiguous`.
7. Propose the smallest authority-preserving change.
8. Define a negative regression test for every contradiction fixed.

## Required Checks
- A route listed in navigation must either render or be explicitly marked unsupported.
- Every canonical route must have one canonical URL policy.
- Every token consumed by CSS must be defined.
- Every build script target must exist.
- Every schema enum used by seed data must be accepted.
- Every claim of persistence must identify storage, owner and failure behaviour.
- Every generated mirror must contain source path and source hash.
- Every external host integration must declare who owns router, CSS and service worker.

## Output Contract
```json
{
  "ok": false,
  "contracts": [],
  "contradictions": [
    {
      "id": "CONTRACT-001",
      "kind": "true_conflict",
      "sources": [],
      "authority": "string",
      "evidence": [],
      "impact": "string",
      "proposal": "string",
      "requires_human_decision": true,
      "regression_test": "string"
    }
  ],
  "dead_consumers": [],
  "missing_producers": [],
  "next_actions": []
}
```

## Mutation Boundary
This skill never edits source, generated mirrors or documentation. Any update must be performed as a separate authorised mutation with a fixed plan and verification.

## Acceptance Criteria
- Every contradiction has named sources.
- Authority is explicit.
- No silent fallback or alias is introduced to hide a mismatch.
- The report distinguishes stale documentation from broken implementation.

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
