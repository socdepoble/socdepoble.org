---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/prm-craft-architecture/SKILL.md; no editar.
source: .agents/skills/prm-craft-architecture/SKILL.md
source_sha256: 8d7d56c6b1b769c10b837191e101b5ac4307c582920f71d93381e71950935dc5
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/prm-craft-architecture/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# prm-craft-architecture


## Antic: prompt-architecture-council

---
name: prompt-architecture-council
lang: ca
description: "Protocol avançat d'enginyeria de prompts per a consells d'IA multi-agent."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: Prompt Architecture Council

## Description
Protocol avançat d'enginyeria de prompts per a consells d'IA multi-agent (el Consell de la Petorreta). Optimitza el raonament, redueix al·lucinacions i garanteix coherència entre agents especialitzats.

## When to use
- Quan es dissenya un nou agent (IAIA, Capatàs, Gall, etc.).
- Quan es vol que múltiples IAs col·laborin en una mateixa tasca sense contradir-se.
- Quan la resposta ha de ser tècnica i alhora culturalment arrelada al territori valencià.

## Principles
1. **Identitat Teatral**: Cada agent ha de tenir un "paper" clar (rol, to, lèxic). Això redueix la variància en les respostes.
2. **Chain-of-Thought Rural**: Abans de respondre, l'agent ha de "pensar en veu alta" usant metàfores del camp (Pedra Seca, Trellat, Bancal).
3. **Few-Shot amb Context Local**: Proporcionar 2-3 exemples de respostes correctes en valencià abans de la petició.
4. **Guàrdia d'Al·lucinació**: Si l'agent no està segur al 100%, ha de dir-ho amb frases com "M'he deixat l'almanac a la pallissa..." en lloc d'inventar dades.

## Procedure
1. **System Prompt Template**:
   ```
   Ets [NOM], [ROL] de Sóc de Poble.
   Context: [ENTORN RURAL CONCRET].
   Tasca: [OBJECTIU CLAR I MESURABLE].
   Estil: [TO DIRECTE/ENTRANYABLE/POÈTIC].
   Restriccions: [QUÈ PROHIBIT FER].
   Exemples:
   - Usuari: ... → Resposta: ...
   ```
2. **Delimitar el "Teatre"**: Usar tags XML per a separar instruccions de contingut:
   ```xml
   <instructions>...</instructions>
   <user_input>...</user_input>
   ```
3. **Refredament (Cooldown)**: Després de 5 interaccions complexes, demanar a l'agent que resumeixi el context per a evitar "demència de context".

## Anti-patterns
- Donar instruccions contradictòries ("sigues breu però explica-ho tot").
- Barrejar anglès i valencià en el system prompt (desdibuixa la veu).
- Ometre el fallback quan no hi ha dades concretes.


## Antic: prompt-safety-and-context

---
name: prompt-safety-and-context
lang: en
description: "Ensures prompts are safe, unambiguous, and include minimal necessary context."
version: 1.0.0
status: canonic
abast: ["global"]
---

# Skill: Prompt Safety and Context
## Description
Ensures prompts are safe, unambiguous, and include minimal necessary context. Normalizes user intent, strips unsafe requests, and reformulates for downstream agents.

## Inputs
- raw_prompt: string
- user_role: optional string
- safety_policy: optional object

## Outputs
- safe_prompt: string
- removed_content: array of strings (if any)
- rationale: string

## Behavior
1. Detect disallowed content (policy) and redact.
2. Extract minimal context required.
3. Return reformulated prompt with explicit constraints (format, length, style).

## Example
Input: raw_prompt with ambiguous timeframe.
Output: safe_prompt: "Summarize the article (200 words) focusing on security fixes since 2023."

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
