---
type: document
status: canonic
description: Protocol de lectura per auditar l’arquitectura 4+2, el frontmatter v2 i el graf sense modificar la Wiki.
tags:
  - maquina
---
# Auditoria canònica de la Wiki

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

## Fonts de veritat

1. `03_govern/` governa les normes.
2. `tooling/wiki/schema.json` governa el frontmatter v2.
3. `tooling/wiki/compiler/01_build_index.mjs` i `autoneteja_wiki.mjs` governen l’auditoria estructural i del graf.
4. `.agents/PROTOCOL_PETORRETA.md` governa qualsevol efecte lateral mitjançant el Reflex.

L’arxiu, els mirrors, els vendors i els documents d’esta carpeta són context; no poden anul·lar estes fonts.

## Abast obligatori

### Arquitectura General (Taxonomia v2)

- Pilars estructurals: `00_core_wiki`, `01_identitat_iaia`, `02_filosofia`, `03_govern`, `04_arquitectura_disseny`, `05_skills_ia`, `06_cultura`, `07_plantilles`, `08_capacitats`, `09_skills_colmena`, `10_metriques`, `11_recursos_ia`, `12_actes`.
- Dos espais de cicle de vida: `90_arxiu_historic` i `04_ESCRIPTORI`.
- Els directoris de suport, mirrors i vendors es reporten a banda; no es compten com a pilars.

### Frontmatter v2

- Camps obligatoris: `estat`, `tipus`, `description`.
- Camps opcionals: `aliases`, `revisat`.
- Qualsevol camp addicional és deriva, encara que aparega en un bloc YAML antic dins del cos.

### Graf

- Separa sempre el graf operatiu del graf físic complet.
- Un orfe amb contingut és una troballa, no una autorització d’esborrat.
- Distingix enllaç no resolt, destí ambigu, buit físic, mirror, vendor i arxiu.

### Coherència executable

- Verifica que cada script citat existisca en una ruta activa.
- No presentes scripts d’`04_ARXIU_Documents_Historics` com a eines disponibles.
- Contrasta les garanties documentals amb dependències, configuració, tests i codi observable.

## Comandes canòniques

```bash
npm run porta:esquemes
npm run porta:frontmatter
npm run porta:cognitiu
npm run porta:llaurador
npm run porta:reflex
```

Per a consum mecànic, l’auditoria estructural admet JSON:

```bash
npm run porta
```

Un error d’execució, lectura, parseig o Git és un resultat fallit. Mai es transforma en «zero incidències».

## Contracte d’informe

Cada troballa ha d’incloure:

- fitxer o scope afectat;
- evidència reproduïble;
- severitat justificada;
- font de veritat amb què entra en conflicte;
- proposta conservadora;
- `requires_human_decision: true` quan la intenció no es puga deduir.

No s’assigna una puntuació inventada ni s’activa un bloqueig per una fórmula sense dades. Els bloquejos reals provenen de portes executables, errors crítics demostrats o una decisió humana de governança.

## Frontera d’efectes

Auditar no modifica fitxers. Escriure un informe, corregir YAML, moure una nota, purgar o commitar ja és un efecte lateral i ha de seguir el [[PROTOCOL_PETORRETA|Reflex de Petorreta]] amb operació i scopes explícits.

## Sinapsis

- [[doc_governanca]]
- [[forja_to_core]]
- [[02_genotip]]


**Ancoratge de Seguretat:** [[00_index]]


---
**Categoria:** protocols (BROKEN LINK: skills) <!-- TODO: fix link -->
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]

