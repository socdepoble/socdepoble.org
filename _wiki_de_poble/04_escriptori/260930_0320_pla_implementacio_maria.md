---
type: document
status: esborrany
description: Pla de la nova sessio
tags:
  - implementacio
visibility: private
reflex: sdp:torn_f734b982-8506-4d18-8c15-c593bdaf497f:42595a43-53f4-4c0b-b35a-4f2e2ef8b97c
---
# Pla Implementacio MarIA

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f734b982-8506-4d18-8c15-c593bdaf497f:42595a43-53f4-4c0b-b35a-4f2e2ef8b97c |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T01:20:21.643Z |
| Modificació | 2026-09-30T01:20:21.643Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-30T01:20:21.643Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes
S'ha tancat la tanda T1-T16. El sistema està segellat. Queden algunes tasques heretades documentades a l'acta marmota prèvia, les quals ara esdevindran el focus del nou treball (T1-T5).

### 2. Preguntes Obertes
- Com es comportarà el giny de Google Translate respecte al DOM virtual de React quan li demanem que es mostre des del nostre propi menú personalitzat?

### 3. Canvis Proposats

### [Acció: MODIFY] `src/sections/consola/consolaPagines.js`
- Modificar `mesuresPagina()` per incloure les dades d'estat de les targetes (semàfors roigs, skills òrfenes).
- Separar aquestes mètriques de manera que no alteren la signatura de "Canvis nous".

### [Acció: MODIFY] `src/components/universal/barres/BarraBlava.jsx`
- Preparar la connexió amb la nova acció de traducció (Google Translate o local) via `useAccions`.

### [Acció: MODIFY] `src/utils/esdeveniment.js` & `src/utils/ics.js`
- Revisió de la manipulació de la data de l'esdeveniment per no dependre de `created_at` (a `mapejadorSeccions.js`) i assegurar-se que la zona horària és correcta.

### 4. Pla de Verificació
- Executarem `npm test` per revisar els components modificats.
- Validarem visualment a 1440 i 375 px (Consola, Mur, Calendari, Explorador).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Proves unitàries de Vitest passades en verd.
- Verificació del segell d'Antigravity (`tancament.mjs`).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- El traductor de Google pot trencar elements reactius del DOM en incrustar nodes fora del flux normal de l'aplicació. Caldrà explorar l'opció `Bergamot` o `LibreTranslate` com a fallback.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
