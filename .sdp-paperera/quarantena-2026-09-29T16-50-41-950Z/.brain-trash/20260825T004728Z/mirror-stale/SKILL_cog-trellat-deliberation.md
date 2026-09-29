---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/cog-trellat-deliberation/SKILL.md; no editar.
source: .agents/skills/cog-trellat-deliberation/SKILL.md
source_sha256: 4ca2f3ea12a256741dd61b629715f4f8f2b93a8c1722f381174de439a0532c62
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/cog-trellat-deliberation/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# cog-trellat-deliberation


## Antic: trellat-reasoning

---
name: trellat-reasoning
description: Raonament pas a pas amb Trellat (sentit comú rural), verificació explícita de fets i negativa educada a inventar dades. Ús obligatori quan la pregunta involucra dates, dades locals, meteorologia, burocràcia o consells pràctics.
---

# Trellat Reasoning

## Quan usar-la
- Qualsevol consulta que demani fets concrets (oratge, lluna, ajudes PAC, horaris, població, història local).
- Quan l’agent podria tenir la temptació d’inventar.

## Instruccions
1. **Descomposició**: Divideix la pregunta en parts verificables.
2. **Font interna**: Usa només el coneixement del system prompt + dades del seed actual. Si no ho saps amb certesa, digues-ho amb gràcia rural (“m’he deixat l’almanac a la pallissa”).
3. **Veredicte de Trellat**: Acaba amb una nota 0-100 de Trellat quan avaluïs una idea.
4. **Proposta de reenviament**: Si pertany a un altre especialista, després de respondre completa, suggereix `@usuari` amb l’arrova obligatòria.
5. **Zero invenció**: Prohibit inventar dates exactes, números de CIF reals, o prediccions meteorològiques precises sense calendari.

## Format de resposta preferit
- Resposta directa i útil primer.
- Després, si cal, “Si vols mantenir el xat net… reenvia a @especialista”.


## Antic: raonament-pas-a-pas

---
name: raonament-pas-a-pas
lang: ca
description: "Raonament lògic i causal mitjançant cadenes de pensament estructurades."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: RAONAMENT_PAS_A_PAS

## Objectiu
Millorar la capacitat per resoldre problemes complexos dividint-los en passos seqüencials i clars.

## Instrucció
Per a qualsevol problema complex, has de dividir-lo en subproblemes més petits i tractables. Genera una resposta pas a pas, mostrant el teu raonament per a cada pas. Aquesta transparència no només ajuda a verificar la correcció, sinó que també facilita la depuració i l'enteniment del procés mental que porta a la solució final.


## Antic: chain-of-thought-moderation

---
name: chain-of-thought-moderation
lang: en
description: "A structured skill that enforces explicit, bounded chain-of-thought reasoning for complex tasks while preventing leakage of internal deliberation."
version: 1.0.0
status: canonic
abast: ["global"]
---

# Skill: Chain of Thought Moderation
## Description
A structured skill that enforces explicit, bounded chain-of-thought reasoning for complex tasks while preventing leakage of internal deliberation. Produces concise, verifiable reasoning steps and a final answer with confidence and citations.

## Inputs
- task_description: string
- max_steps: integer (default 6)
- require_citations: boolean (default true)

## Outputs
- reasoning_steps: array of short sentences (<= 20 words each)
- final_answer: string
- confidence_score: float (0-1)
- citations: array of {text, url} if require_citations

## Behavior
1. Parse task into subgoals.
2. For each subgoal, produce 1–2 short reasoning steps.
3. Stop if steps >= max_steps and produce a concise final answer.
4. Attach citations for any factual claim.

## Example
Input:
  task_description: "Explain why a React useEffect leak occurs and how to fix it."
Output:
  reasoning_steps: ["useEffect registers side-effect on mount", "No cleanup causes listeners to persist"]
  final_answer: "Add cleanup function returning abort/clear to avoid leaks."
  confidence_score: 0.95
  citations: [{text:"React docs useEffect", url:"https://reactjs.org/docs/hooks-effect.html"}]

## Tests
- Given a multi-step debugging task, produce <= max_steps steps and at least one citation.


## Antic: socdepoble-cot-profund

---
name: "socdepoble-cot-profund"
description: "Obliga a la IA a obrir un bloc de pensament intern abans d'escriure codi, evitant al·lucinacions i garantint el Trellat."
---
# Raonament Profund (CoT)
Abans de qualsevol canvi estructural o de proporcionar codi font, OBRIRÀS un bloc `<thought>`. Dins, detallaràs:
1. Què falla exactament segons l'auditoria?
2. Quin és el cost termodinàmic de la solució proposada?
3. Quins efectes secundaris tindrà sobre l'iPad A10?
Només després d'aquesta reflexió, procediràs a l'acció amb zero yapping.

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
