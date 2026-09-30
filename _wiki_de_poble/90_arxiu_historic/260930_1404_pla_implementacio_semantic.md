---
type: document
status: esborrany
description: Pla per a corregir les etiquetes d'encapçalament a la Consola
tags:
  - implementacio
visibility: private
reflex: sdp:torn_ec03d02c-eeb4-4820-8ad3-edb310acdd32:b6c6f857-ede0-4ad0-8553-a9d74e73bb0f
---
# Pla Semàntic

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ec03d02c-eeb4-4820-8ad3-edb310acdd32:b6c6f857-ede0-4ad0-8553-a9d74e73bb0f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T12:04:35.183Z |
| Modificació | 2026-09-30T12:04:35.183Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-30T12:04:35.183Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

**1. Habilitar l'índex fins a H6 per defecte:**
- A `src/components/universal/PageFrame.jsx` (línia 15), canviar la constant `NIVELL_INDEX_PER_DEFECTE` de `4` a `6`. Això permetrà que qualsevol pàgina puga indexar els elements `h5` i `h6` sense necessitat de forçar explícitament la propietat a `UniversalPage`.

**2. Revisar el suport CSS per a `.toc-level-5` i `.toc-level-6`:**
- Comprovar que el fitxer CSS pertinent (probablement `src/css/modules.css` o `components.css`) té estils correctes (padding, tipografia) per als nivells 5 i 6 de l'índex.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- **Criteri d'Acreditació:** La pàgina `/consola` s'obri correctament, i en obrir la Taula de Continguts de la UniversalPage, **els subtítols de les targetes (H4) i les xifres/mètriques (H5) hi apareixen correctament indentats**.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Canviar el nivell per defecte a 6 afectarà a **TOTES** les pàgines de l'aplicació. Qualsevol ús incidental d'un H5 o H6 en altres pàgines es començarà a indexar. Segons el Mestre, aquesta és la decisió de disseny correcta (tot H ha d'anar a l'índex).

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
