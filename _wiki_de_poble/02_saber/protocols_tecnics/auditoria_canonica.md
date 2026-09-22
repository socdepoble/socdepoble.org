---
type: document
status: canonic
description: Protocol de lectura per auditar l’arquitectura 4+2, el frontmatter v2 i el graf sense modificar la Wiki.
tags:
  - maquina
---

<!-- SDP:EIXIDA
type: informe
status: esborrany
description: "<12-220 caràcters: què s'audita i amb quina evidència>"
tags: [auditoria]
-->
# Auditoria canònica de la Wiki

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

## Fonts de veritat

AGENTS.md governa l’operació. .agents/protocolledge.json declara rutes, versions, tipus de sortida i seccions. tooling/wiki/schema.json governa totes les metadades; no es mantenen enums paral·lels en aquesta guia. tooling/documental/core.mjs i turns.mjs comproven el contracte i el rebut persistent.

## Abast obligatori

Inventariar les carpetes reals de la Wiki i distingir contingut operatiu, 04_escriptori i 90_arxiu_historic. No deduir salut d’una taxonomia històrica. Els camps obligatoris i opcionals són exclusivament els de schema.json, inclosos tags, visibility i reflex; revisat no està admés mentre no forme part de l’esquema.

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
npm run porta:documents -- --all
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

Auditar no autoritza esborrar, arxivar ni corregir contingut alié. Les comprovacions amb `--check` no han de modificar fitxers; qualsevol canvi necessari s’ha de registrar i verificar dins de l’abast aprovat.


## Sinapsis

- [[doc_governanca]]
- [[forja_to_core]]
- [[02_genotip]]


**Ancoratge de Seguretat:** [[00_index]]


---
**Categoria:** protocols (BROKEN LINK: skills) <!-- TODO: fix link -->
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]



## Generació amb contracte executable

La ruta `auditoria` de `.agents/protocolledge.json` defineix les seccions obligatòries. El bloc SDP:EIXIDA és l’exemple de metadades; la resta d’aquesta plantilla és context de redacció. Usa `document.mjs context` per rebre la plantilla i el rebut persistent, i `document.mjs create` per preparar el document amb totes les seccions. No copies el frontmatter de la plantilla com si fora el del fill.
