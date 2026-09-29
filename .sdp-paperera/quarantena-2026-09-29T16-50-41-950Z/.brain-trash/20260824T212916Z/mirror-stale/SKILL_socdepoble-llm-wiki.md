---
estat: actiu
tipus: skill
description: "Mirall humà de la skill socdepoble-llm-wiki"
source: .agents/skills/socdepoble-llm-wiki/SKILL.md
---

> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/socdepoble-llm-wiki/SKILL.md` exclusivament en anglés tècnic.

# LLM Wiki (Arquitectura Silenciosa)

## Activació i Abast
S’activa per una petició explícita de processar `00_Raw`, destil·lar notes o auditar el graf. No s’executa automàticament a l’inici o final d’una sessió.

## Fase A — Diagnòstic read-only
1. Verifica arrel, schema, zones canòniques i policy vigent.
2. Inventaria només les fonts incloses en la petició.
3. Per cada fragment, identifica destí, duplicats, conflictes, procedència i confiança.
4. Produeix un pla amb diff proposat i criteris de verificació.

No assumes que tot orfe és brossa. Un orfe és un senyal editorial, no una ordre d’esborrat.

## Fase B — Integració autoritzada
Només amb el flux SOURCE_MUTATION:
- integra el fragment en la secció semàntica correcta;
- conserva significat, autoria i procedència;
- evita duplicar idees equivalents;
- crea una nota nova només si no existeix un destí coherent;
- genera el frontmatter des del schema canònic, sense camps inventats ni metadades genèriques d'Obsidian;
- verifica enllaços, schema i diff abans de confirmar.

## Fase C — Origen
No esborres ni mous de `00_Raw` fins que el destí haja sigut verificat. Proposa quarantena o arxiu com una operació separada i recuperable.

## Resultat
Informa: fonts llegides, fragments integrats, duplicats omesos, conflictes oberts, fitxers canviats, verificacions i operacions no executades.

---
**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
