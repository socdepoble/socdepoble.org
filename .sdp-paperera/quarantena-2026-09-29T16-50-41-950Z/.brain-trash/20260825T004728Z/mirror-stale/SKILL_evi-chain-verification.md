---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/evi-chain-verification/SKILL.md; no editar.
source: .agents/skills/evi-chain-verification/SKILL.md
source_sha256: 84961b57e61931b40411c3d35d40e067aece57fc7483860be975eeb7abee2eda
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/evi-chain-verification/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# evi-chain-verification


## Antic: chain-of-verification

---
name: chain-of-verification
lang: ca
description: "Activa un protocol de verificació interna en tres passos abans de qualsevol resposta final per prevenir al·lucinacions."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: Chain of Verification (CoVe)

## DESCRIPCIÓ

Aquesta skill activa un protocol de verificació interna en tres passos abans de qualsevol resposta final. Previu al·lucinacions obligant el model a redactar, revisar i corregir el seu propi esborrany abans d'emetre'l.

## QUAN ACTIVAR-SE

- Quan es demanen dades factuals (dates, coordenades, xifres)
- Quan es genera codi que serà executat
- Quan es resumeixen documents complexos
- Quan l'usuari usa paraules clau: "verifica", "estàs segur", "comprova"

## PROTOCOL

### Pass 1: DRAFT
Genera una resposta interna (no visible per l'usuari) amb tot el que saps sobre el tema.

### Pass 2: VERIFY
Per cada claim factual del Draft, executa:
1. "Aquesta dada és verificable?"
2. "Quina és la font d'aquesta dada al meu entrenament?"
3. "Hi ha alguna contradicció interna?"
4. "Estic confonent dues fonts?"

### Pass 3: CORRECT
Reescriu la resposta només amb les claims que han passat la verificació. Marca explícitament qualsevol claim no verificable amb: `[⚠️ No verificable]`

## EXEMPLE D'ÚS

```
Usuari: "Quina és la població de Penàguila?"

PASS 1 (intern): Penàguila té uns 320 habitants, està a l'Alcoià...

PASS 2 (intern): 
- "320 habitants" → Font: seed data del sistema. Verificable: SÍ
- "Està a l'Alcoià" → Font: coneixement general. Verificable: SÍ

PASS 3 (resposta final): 
Penàguila té 320 habitants (segons dades del sistema Sóc de Poble) 
i pertany a la comarca de l'Alcoià.
```

## REGLES D'OR

1. MAI ometre el Pass 2, encara que estigues 99% segur
2. Si més del 30% de claims fallen la verificació, comença la resposta amb: "He de ser franc: no tinc dades suficients per..."
3. Per a codi, el Pass 2 executa un "dry-run" mental: "Què passa si aquesta funció rep null?"
4. Per a dates, comprova sempre: any bisiest, dia de la setmana, festivitat

## INTEGRACIÓ AMB IAIA

La IAIA MarIA ja té una directriu de "zero al·lucinacions" (agent GALL). Aquesta skill formalitza eixe instincte en un protocol mecànic reproducible.


## Antic: verificacio-en-cadena-qwen

---
name: verificacio-en-cadena-qwen
lang: ca
description: "Raonament auto-correctiu per prevenir al·lucinacions mitjançant metaraonament."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: VERIFICACIO_EN_CADENA

## Objectiu
Fomentar la reflexió interna i la correcció d'errors abans de lliurar la solució final.

## Instrucció
Abans de finalitzar qualsevol tasca complexa, has de realitzar una auto-revisió sistemàtica. Genera 3 preguntes d'autocorrecció basades en la teva resposta o codi generat i respon-les honestament. Només pots finalitzar quan la teva resposta a aquestes preguntes sigui coherent i satisfactoria. Aquesta reflexió interna és essencial per garantir la correcció i la fiabilitat.


## Antic: evidence-first-reasoning

---
name: evidence-first-reasoning
lang: en
description: "Prioritizes retrieval and citation of primary sources before producing conclusions. Useful for technical claims and audits."
version: 1.0.0
status: canonic
abast: ["global"]
---

# Skill: Evidence First Reasoning
## Description
Prioritizes retrieval and citation of primary sources before producing conclusions. Useful for technical claims and audits.

## Inputs
- question: string
- retrieval_limit: int (default 5)

## Outputs
- evidence_list: array of {title, snippet, url}
- synthesis: concise conclusion with numbered evidence references

## Behavior
1. Retrieve up to retrieval_limit sources.
2. Extract 1–2 supporting snippets per source.
3. Synthesize conclusion referencing evidence indices.

## Example
Input: "Best practices for React memory leaks"
Output: evidence_list: [...]; synthesis: "Use cleanup in useEffect [1], avoid global singletons [2]."


## Antic: hallucination-guard

---
name: hallucination-guard
lang: en
description: "A verification-first skill that forces the agent to label claims as verifiable, inferred, or speculative."
version: 1.0.0
status: canonic
abast: ["global"]
---

# Skill: Hallucination Guard
## Description
A verification-first skill that forces the agent to label claims as (A) verifiable, (B) inferred, or (C) speculative. For (A), require citation; for (B), require source-derived justification; for (C), require explicit flagging.

## Inputs
- claim: string
- context: optional string
- require_sources: boolean (default true)

## Outputs
- label: one of [VERIFIABLE, INFERRED, SPECULATIVE]
- justification: short text
- sources: array of citations (if VERIFIABLE or INFERRED)

## Behavior
1. Attempt to match claim to known facts (search if allowed).
2. If exact match → VERIFIABLE + citation.
3. If plausible inference from sources → INFERRED + explanation + sources.
4. Else → SPECULATIVE + explicit warning.

## Example
Input: "This library leaks memory on unmount."
Output: label: INFERRED; justification: "Patterns show missing cleanup in useEffect"; sources: [link to code snippet].


## Antic: anti-hallucination-guard

---
name: anti-hallucination-guard
lang: en
description: "Prevents AI hallucinations by enforcing source attribution, uncertainty marking, and fact-checking before any output."
version: 1.0.0
status: canonic
abast: ["global"]
---

# Anti-Hallucination Guard

## Activation
Activates automatically on ANY response that:
- References code, files, or variables
- Claims to have executed a command
- States a "fact" about the system

## Rules

### R1. Source Attribution
Every factual claim MUST be prefixed with its source:
- `[CODE:src/path/to/file:line]` — from code
- `[CONFIG:package.json]` — from config
- `[TESTED:cli-output]` — from executed command
- `[ASSUMPTION]` — if inferred, must be clearly marked

### R2. Uncertainty Marking
Any claim with < 95% confidence MUST be marked:
```
⚠️ UNCERTAIN: [reason for uncertainty]
```

### R3. Verification Requirement
Before stating that code exists, runs, or behaves a certain way:
1. Check the file system (ls, cat)
2. Check git status
3. Check package.json
4. ONLY then state the fact

### R4. Hallucination Detection
If a pattern matches hallucination risk (e.g., referencing files that don't exist), the agent MUST:
1. Stop
2. List the evidence that contradicts the claim
3. Ask for clarification

## Output Format
```
[SOURCE:src/path/to/file:42] The function `appendChatMessages()` stores messages to IndexedDB.
⚠️ UNCERTAIN: I haven't verified the actual data structure.
```

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
