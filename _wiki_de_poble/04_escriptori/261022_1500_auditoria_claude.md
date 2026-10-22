---
type: informe
status: esborrany
description: Informe de Claude (torn de codi) sobre el selector d'emoticones gran (38 px, diana de 52 px) i la inserció al cursor estil WhatsApp al Compositor del xat.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9101beba-2ac7-44ae-8801-8f023cd394a7:2545c175-c840-4165-98f2-d00ec750baed
---
# Auditoria Claude: emoticones grans i paritat WhatsApp al compositor del xat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9101beba-2ac7-44ae-8801-8f023cd394a7:2545c175-c840-4165-98f2-d00ec750baed |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T13:55:28.851Z |
| Modificació | 2026-10-22T13:55:28.851Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-22T13:55:28.851Z: esborrany creat; contingut i verificació pendents.

2026-10-22T14:10Z (relleu 1, canal viu): torn `torn_9101beba` obert (code), pla 261022_1425 vinculat i fitxers propis declarats amb `document.mjs own`. Gemini no té cap torn obert ni cap canvi a `src/` quan començe: si arriba, que no toque els fitxers declarats sense avisar ací.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Relleu 1 (en curs).** `SelectorEmoticones.jsx` no existia: el prompt en demana «preservar les pestanyes existents», que són les famílies del catàleg Emojis XL (`src/sections/notes/familiesEmojis.js`). No es duplica res: el selector del xat reutilitza el catàleg (a demanda, `carregaCatalegEmojis`) i la llista amb fletxes de `GraellaEmojis` (s'exporta, amb variant gran). Pestanya nova «Del poble» amb la tria rural del pla i les recents (només en memòria, com els esborranys). Fet: `src/sections/xat/emoticonesXat.js`. En marxa: selector, compositor, CSS, i18n i proves.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

[pendent]

<!-- SDP:SECTION auditoria.s6 -->
## Límits

[pendent]

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
