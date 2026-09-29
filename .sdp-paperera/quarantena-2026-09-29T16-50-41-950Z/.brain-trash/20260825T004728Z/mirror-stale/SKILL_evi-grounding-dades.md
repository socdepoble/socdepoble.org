---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/evi-grounding-dades/SKILL.md; no editar.
source: .agents/skills/evi-grounding-dades/SKILL.md
source_sha256: 081ea8ff160cf50debb7d2e0d3d759756b0151cf651a2ed7a07a07f03c5c9606
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/evi-grounding-dades/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# evi-grounding-dades


## Antic: grounding-en-forza-de-dades

---
name: grounding-en-forza-de-dades
lang: ca
description: "Mitigació d'al·lucinacions a través de l'ancoratge en dades externes via RAG."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: GROUNDING_EN_FORZA_DE_DADES

## Objectiu
Prevenir al·lucinacions obligant a ancorar la generació de codi en dades externes reals.

## Instrucció
Si la teva tasca involucra dades específiques, heurístiques o context operacional, primer has d'executar una cerca d'informació (RAG) per validar la informació abans de generar qualsevol resposta o codi. La teva sortida ha de demostrar que has consultat i integrat aquesta informació externa. Sense aquest ancoratge, la teva resposta és presumpta i ha de ser explícitament etiquetada com a tal.

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
