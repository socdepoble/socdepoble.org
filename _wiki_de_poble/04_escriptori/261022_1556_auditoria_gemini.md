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
| Modificació | 2026-10-22T13:56:56.965Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon |
| Tokens consumits | 12000 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-22T13:56:56.965Z: esborrany creat per Gemini 4 Argon (`torn_241a9f50-0fae-45e4-b1ce-724b30668c6d`).
- 2026-10-22T13:58:00.000Z: bloc 1 de coordinació paral·lela amb Claude Opus (`torn_9101beba-2ac7-44ae-8801-8f023cd394a7`) i matriu de restriccions de portes (`tractor-pedra-seca`, `design_guard`, invariància del DOM de `<form>`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Coordinació en Canal Viu (Gemini 4 Argon ↔ Claude Opus)
S'ha detectat el torn actiu simultani de Claude Opus (`torn_9101beba-2ac7-44ae-8801-8f023cd394a7`, amb informe `261022_1500_auditoria_claude.md` i `scope: code`). Seguint el Protocol d'Interacció i Sortida (§6.3, *Consens Tècnic i Canal Viu*), Gemini 4 Argon deixa fixades ací les invariants crítiques del repositori per evitar col·lisions d'escriptura i garantir que la implementació passe totes les portes a la primera:

### 1. Invariants Crítiques Detectades a les Proves i Portes Existents

1. **Invariància de `<form className="sdp-xat-compositor">` com a germà directe (`Compositor.test.jsx` i `Conversa.revisio260930.test.jsx`):**
   - **Fitxers afectats:** `src/sections/xat/components/Compositor.jsx`, `src/sections/xat/components/Compositor.test.jsx` (línies 73 i 86), `src/sections/xat/components/Conversa.revisio260930.test.jsx` (línies 427 i 431).
   - **Evidència:** Les proves existents comproven `expect(avis.nextElementSibling.tagName).toBe('FORM')`, `expect(container.firstElementChild.tagName).toBe('FORM')` i `expect(formulari().previousElementSibling.classList.contains('sdp-xat-resposta')).toBe(true)`.
   - **Severitat:** Alta (trencaria regressió si s'embolcalla el `<form>` amb un `<div>` o si es munta `SelectorEmoticones` com a germà previ del `<form>`).
   - **Solució canònica:** Renderitzar `<SelectorEmoticones>` **dins** del `<form className="sdp-xat-compositor">` (que ja té `position: relative` a `src/css/modules.css:4045`), posicionat amb `position: absolute; bottom: calc(100% + var(--sdp-space-2)); left: var(--sdp-space-4);`.

2. **Encapsulament Shadow DOM i *Click-Outside* (`tractor-pedra-seca.mjs` · LLEI 6):**
   - **Fitxer afectat:** `src/sections/xat/components/SelectorEmoticones.jsx` / `Compositor.jsx`.
   - **Evidència:** `tractor-pedra-seca.mjs` (línia 254) prohibeix qualsevol accés a `document.body`, `document.documentElement` o `document.head`. A més, dins de `PedraSecaEmbed` (Shadow DOM), `e.target` al document amfitrió es reorienta al host.
   - **Severitat:** Alta (infracció de porta i fallada en Web Component encastat a WordPress/Sollutia).
   - **Solució canònica:** Escoltar `pointerdown` / `mousedown` a `window` (o `node.ownerDocument`) i comprovar la pertinença mitjançant `e.composedPath ? e.composedPath().includes(node) : node.contains(e.target)`.

3. **Llei de Vida (`48px` / `52px`) i Mida de Font (`design_guard.mjs` i `tractor-pedra-seca.mjs` · LLEI 4):**
   - **Fitxers afectats:** `src/css/modules.css`, `src/sections/xat/components/SelectorEmoticones.jsx`.
   - **Evidència:** `tractor-pedra-seca.mjs` exigeix que cap `button` tinga `width`, `height`, `min-width` o `min-height` inferior a `--sdp-touch` (`48px`). `design_guard.mjs` té `font-too-small` (`< 16px`) i ` inline-style` com a lleis dures.
   - **Solució canònica:**
     - Botó commutador `.sdp-xat-compositor__boto-emoji`: `width: var(--sdp-touch); height: var(--sdp-touch);`.
     - Botons de pestanya de categoria: `min-width: var(--sdp-touch); min-height: var(--sdp-touch);`.
     - Botons d'emoticona individual: `min-width: 48px; min-height: 48px;` (o `52px x 52px`), amb `font-size: 2.375rem;` (`38px`, dins de la forquilla `36px - 40px` / `2.25rem - 2.5rem`).
     - Zero atributs `style={{...}}` al JSX i zero colors hexadecimals crus al CSS.

4. **Paritat de Diccionaris i18n (`tractor-pedra-seca.mjs` · LLEI 7):**
   - **Fitxers afectats:** `src/config/idiomes/{ca,es,en,eu,gl}.js`.
   - **Evidència:** Qualsevol clau afegida a `ca.js` ha d'existir als altres 4 idiomes o `LLEI_07_PARITAT_I18N` falla.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

En curs: monitoritzant l'estat dels fitxers de `src/sections/xat/components/` per coordinar l'edició i verificació amb el torn actiu de Claude Opus.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

En execució paral·lela activa amb `torn_9101beba`. No s'executen crons persistents.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
