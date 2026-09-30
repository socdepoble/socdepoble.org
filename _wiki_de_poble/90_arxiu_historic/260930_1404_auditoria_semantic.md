---
type: informe
status: esborrany
description: Anàlisi de l'ús d'etiquetes h1-h6 a la Consola Termodinàmica i TargetaConsola
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ec03d02c-eeb4-4820-8ad3-edb310acdd32:c65a7140-d8d8-4e46-9e6f-74a95e87cb80
---
# Auditoria Semàntica Consola

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ec03d02c-eeb4-4820-8ad3-edb310acdd32:c65a7140-d8d8-4e46-9e6f-74a95e87cb80 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T12:04:35.133Z |
| Modificació | 2026-09-30T12:04:35.133Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-30T12:04:35.133Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**P1: L'índex de continguts (TOC) talla als H4 i ignora H5/H6**
El Mestre utilitza les etiquetes `h1-h6` intencionadament per a decorar i estructurar la interfície visualment (ex: els subtítols de `UniversalCard` són `h4`, i les mètriques de `TargetaConsola` són `h5`). La intenció és que **TOTS** els títols isquen reflectits a la Taula de Continguts (TOC) de la pàgina.
No obstant això, actualment el TOC només mostra fins a l'`h4`. Això és perquè a `src/components/universal/PageFrame.jsx` (línia 15) es defineix `NIVELL_INDEX_PER_DEFECTE = 4`. A menys que la pàgina force explícitament un nivell superior, els `h5` i `h6` són ignorats i no apareixen a l'índex.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

S'ha verificat que la constant `NIVELL_INDEX_PER_DEFECTE = 4` a `PageFrame.jsx` és el coll d'ampolla. Les targetes i els components de dades empren `H5` correctament segons la decisió de disseny del Mestre, però el sistema de navegació no els està pescant per defecte.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

L'auditoria es centra en `PageFrame.jsx` i en verificar que el CSS associat a `.toc-level-5` i `.toc-level-6` existeix i es renderitza bé. No es modifica cap component UI (`UniversalCard` o `TargetaConsola`) perquè el seu ús d'etiquetes H és considerat vàlid pel Mestre.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
