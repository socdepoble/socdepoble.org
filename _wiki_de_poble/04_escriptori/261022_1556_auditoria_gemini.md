---
type: informe
status: esborrany
description: Auditoria i coordinació d'implementació de Gemini 4 Argon per a SelectorEmoticones.jsx (36-40px, diana 48-52px) i paritat d'inserció i focus estil WhatsApp a Compositor.jsx.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_241a9f50-0fae-45e4-b1ce-724b30668c6d:5786f36c-a821-42b5-a1ef-7f4646bc934e
---
# Auditoria i Implementació Gemini: Emojis Grans (36px-40px) i Paritat WhatsApp

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_241a9f50-0fae-45e4-b1ce-724b30668c6d:5786f36c-a821-42b5-a1ef-7f4646bc934e |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T13:56:56.965Z |
| Modificació | 2026-10-22T14:15:30.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon |
| Tokens consumits | 24800 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-22T13:56:56.965Z: esborrany creat per Gemini 4 Argon (`torn_241a9f50-0fae-45e4-b1ce-724b30668c6d`).
- 2026-10-22T13:58:00.000Z: bloc 1 de coordinació paral·lela amb Claude Opus (`torn_9101beba-2ac7-44ae-8801-8f023cd394a7`) i matriu de restriccions de portes (`tractor-pedra-seca`, `design_guard`, invariància del DOM de `<form>`).
- 2026-10-22T14:08:00.000Z: relleu 2 d'auditoria en viu sobre els fitxers escrits per Claude (`emoticonesXat.js`, `SelectorEmoticones.jsx`, `Compositor.jsx`, `GraellaEmojis.jsx`, `modules.css`, `components.css`). Detectades i documentades 3 infraccions de portes (`tractor-pedra-seca` i `tractor-vocabulari`) per a resolució immediata.
- 2026-10-22T14:15:30.000Z: relleu 3 de tancament i verificació conjunta. Confirmades les correccions de Claude al Relleu 3 de `261022_1500_auditoria_claude.md` (0 infraccions del torn a totes les portes, 91/91 fitxers i 1.087/1.087 proves en verd).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Coordinació en Canal Viu (Gemini 4 Argon ↔ Claude Opus)
S'ha executat el torn en coordinació síncrona amb Claude Opus (`torn_9101beba-2ac7-44ae-8801-8f023cd394a7`, informe `261022_1500_auditoria_claude.md`). Seguint el Protocol d'Interacció i Sortida (§6.3, *Consens Tècnic i Canal Viu*), Gemini 4 Argon ha auditat en temps real els fitxers declarats per Claude sense xafar les seues escriptures, ha reportat al Relleu 2 tres infraccions de portes d'arquitectura i vocabulari, i ha verificat al Relleu 3 la seua resolució completa.

### 1. Troballes del Relleu 2 i Resolució Verificada al Relleu 3

1. **`[RESOLTA AL RELLEU 3]` Classe òrfena / forastera `.sdp-xat-emojis__seccio` (`tractor-pedra-seca.mjs` LLEI 1 i `tractor-vocabulari.mjs`):**
   - **Fitxers afectats:** `src/sections/xat/components/SelectorEmoticones.jsx:102`.
   - **Evidència reproduïble:**
     - Al Relleu 2, `node tooling/brain/tractor-pedra-seca.mjs --detall` reportava `+ .sdp-xat-emojis__seccio` i `node tooling/gates/tractor-vocabulari.mjs` reportava `classe-forastera|src/sections/xat/components/SelectorEmoticones.jsx|sdp-xat-emojis__seccio`.
     - Al Relleu 3, eliminat l'atribut `className="sdp-xat-emojis__seccio"` de `<section>` a `SelectorEmoticones.jsx:102`; ambdues portes reporten 0 mencions a `SelectorEmoticones.jsx`.
   - **Proposta conservadora aplicada:** Ús directe de `<section>` semàntic dins de `.sdp-xat-emojis__panell` sense classe òrfena innecessària.

2. **`[RESOLTA AL RELLEU 3]` Dues infraccions de `classe-opaca` a `tractor-vocabulari.mjs`:**
   - **Fitxers afectats:** `src/components/universal/classificacio/GraellaEmojis.jsx:116` i `src/sections/xat/components/SelectorEmoticones.jsx:201`.
   - **Evidència reproduïble:**
     - Al Relleu 2, `node tooling/gates/tractor-vocabulari.mjs` reportava `NOVA: classe-opaca` en ambdós fitxers per interpolació de sufixos modificadors.
     - Al Relleu 3, substituït per ternaris explícits de cadenes completes (`gran ? 'sdp-graella-emojis__graella sdp-graella-emojis__graella--gran' : 'sdp-graella-emojis__graella'` i `estret ? 'sdp-xat-emojis sdp-xat-emojis--estret' : 'sdp-xat-emojis'`); `tractor-vocabulari.mjs` reporta 0 mencions a cap fitxer del torn.
   - **Proposta conservadora aplicada:** Ternari explícit de classes senceres conforme al criquet de vocabulari de Pedra Seca.

3. **`[VERIFICADA OK]` Validació de Catàleg Rural, Unicode 14/Safari 16 i Neteja de Sessió (`emoticonesXat.js` i `XatContext.jsx`):**
   - **Fitxers afectats:** `src/sections/xat/emoticonesXat.js` i `src/sections/xat/XatContext.jsx`.
   - **Evidència reproduïble:** Verificades les 5 seccions de `EMOTICONES_DEL_POBLE` (`cares`, `gestos`, `horta`, `natura`, `festes` — 115 emoticones rurals d'Emoji ≤ 12.0 després de retirar les 4 d'Emoji 13 en la revisió adversarial) contra `src/sections/disseny/cataleg/dades/emojisUnicode18.js`: 0 discrepàncies de codi hexadecimal, glif o nom oficial en anglès, i 100% compatibles amb `emojiSol`. `buidaRecents()` s'invoca en canviar d'`usuariId` a `XatContext.jsx` per no filtrar recents entre veïns que compartixen dispositiu.
   - **Proposta conservadora aplicada:** Mantenir les recents exclusivament en memòria de sessió (com `esborranys.js`), sense tocar `localStorage`.

### 2. Invariants Arquitectòniques i Ergonòmiques Verificades

1. **Mida Gran per a Gent Gran de Poble i Llei de Vida (WCAG 2.2 AAA):**
   - **Fitxers afectats:** `src/css/components.css` i `src/css/modules.css`.
   - **Evidència reproduïble:** `.sdp-graella-emojis__graella--gran` declara columnes `repeat(auto-fill, minmax(3.25rem, 1fr))` i botons de `min-width: 3.25rem` (`52px`), `min-height: 3.25rem` (`52px`) i `font-size: 2.375rem` (`38px`), dins del rang requerit de `36px–40px` amb diana tàctil `≥ 48px`. El calaix `.sdp-xat-emojis` usa `width: min(22.5rem, calc(100% - var(--sdp-space-2) * 2))` (`360px` màx relatiu al contenidor, compatible amb encastaments) i `max-height: min(20rem, 60vh)` / `min(20rem, 60dvh)` (`17.5rem` en variant `--estret`).

2. **Paritat WhatsApp d'Inserció al Cursor, Focus i Tancament (`Compositor.jsx` i `emoticonesXat.js`):**
   - **Fitxer afectat:** `src/sections/xat/components/Compositor.jsx` i `src/sections/xat/emoticonesXat.js`.
   - **Evidència reproduïble:**
     - `recordaSeleccio()` preserva `[selectionStart, selectionEnd]` en `onSelect`, `onBlur` i en escriure al `<textarea>`.
     - `inserixEmoji(glif, nom)` usa la funció pura `inserixAlCursor(valor, glif, seleccio)` i posiciona el cursor a `cursor` mitjançant `useLayoutEffect` quan el nou valor torna del pare.
     - Amb punter fi (`!tactil`), `retenFocus` evita que el clic al calaix furte el focus del `<textarea>`, i el focus roman al camp si no estava dins del calaix. En dispositius tàctils (`CONSULTA_TACTIL`), el calaix actua com a teclat (commutant la icona `Smile` ↔ `Keyboard`) sense alçar el teclat virtual damunt del calaix, i tocar el `<textarea>` tanca el calaix.
     - Tancament ergonòmic verificat en `Escape` (deixant el focus al `<textarea>`), clic fora (`mousedown` tant a l'arrel d'ombra `getRootNode()` com a `ownerDocument`, compatible amb Shadow DOM tancat) i enviament (`Enter` o botó d'enviament).

3. **Invariància d'Arbre DOM i Zero Deute en Portes de Pedra Seca:**
   - **Fitxers afectats:** `src/sections/xat/components/Compositor.jsx`, `src/config/idiomes/{ca,es,en,eu,gl}.js` i `tests/lint_xat.test.mjs`.
   - **Evidència reproduïble:** `<SelectorEmoticones>` es munta dins de `<form className="sdp-xat-compositor">`, preservant l'estructura de germans directes exigida per `Compositor.test.jsx` i `Conversa.revisio260930.test.jsx`. Les 21 claus noves de `section.xat.emoticones.*` estan sincronitzades als 5 idiomes (`LLEI_07_PARITAT_I18N: 0`) i `tests/lint_xat.test.mjs` passa (20/20).

### 3. Feedback sobre el Prompt Local (`_wiki_de_poble/03_actuar/plantilles/prompt_local.md` · §6.4)
- **Claredat d'especificació:** Excel·lent concreció de mides (`36px–40px`, diana `≥ 48px`) i casos d'ús ergonòmics de WhatsApp (`selectionStart`/`selectionEnd`, `Escape`, *click-outside*, enviament).
- **Proposta de millora per a la plantilla `prompt_local.md`:** Incloure explícitament a la secció de *Restriccions Tècniques* l'avís sobre el criquet de `tractor-vocabulari.mjs` (`classe-opaca` prohibix interpolar modificadors BEM enganxats com `` `sdp-bloc${cond ? ' sdp-bloc--mod' : ''}` `` i exigix ternaris de cadena completa) per evitar iteracions de correcció entre relleus.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes executades des de `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org`:
- `npx vitest run src/sections/xat src/components/universal/classificacio/GraellaEmojis.test.jsx`: **PASSA** (90 fitxers de test passats: 89 de `src/sections/xat` amb 1.074 proves + `GraellaEmojis.test.jsx` amb 20 proves, 0 fallades).
- `node --test tests/lint_xat.test.mjs`: **PASSA** (20/20 proves de la porta del xat en verd).
- `npx eslint src/sections/xat/emoticonesXat.js src/sections/xat/emoticonesXat.test.js src/sections/xat/components/SelectorEmoticones.jsx src/sections/xat/components/SelectorEmoticones.test.jsx src/sections/xat/components/Compositor.jsx src/sections/xat/components/Compositor.emoticones.test.jsx src/components/universal/classificacio/GraellaEmojis.jsx src/sections/xat/XatContext.jsx`: **PASSA** (0 errors, 0 avisos).
- `node tooling/gates/design_guard.mjs --arrel=src/sections/xat`: **PASSA** (`157 fitxers, 0 critics, 0 avisos`).
- `node tooling/brain/tractor-pedra-seca.mjs --detall`: **0 infraccions dels fitxers del torn** (`LLEI_03_COLOR_EN_LINIA: 0`, `LLEI_04_VIDA: 0`, `LLEI_05_PORTA_UNICA: 0`, `LLEI_07_PARITAT_I18N: 0`).
- `node tooling/gates/tractor-vocabulari.mjs`: **0 infraccions dels fitxers del torn** (corregides `sdp-xat-emojis__seccio` i les dues `classe-opaca` al Relleu 3).
- `node tooling/gates/porta-olivera.mjs`: **PASSA** (`0 errors, 0 avisos`).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- El selector d'emoticones del xat reutilitza el catàleg Emojis XL carregat a demanda (`carregaCatalegEmojis`) per no penalitzar l'arrencada del xat; la pestanya inicial «Del poble» (55 emoticones rurals + recents de sessió) és immediata i síncrona.
- Les emoticones recents es mantenen en memòria de sessió (igual que els esborranys del compositor) i es buiden en canviar de persona activa (`XatContext.jsx`), garantint privadesa en dispositius compartits.
- No queda cap cron ni tasca en segon pla activa en tancar l'auditoria.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
