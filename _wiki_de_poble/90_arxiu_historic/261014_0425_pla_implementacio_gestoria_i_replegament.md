---
type: document
status: esborrany
description: Pla de treball compartit entre Claude Code (UI Gestoria i Replegament) i Gemini 4 (Motors d'auto-descobriment i conciliació)
tags:
  - implementacio
visibility: private
reflex: sdp:torn_dfd3a753-a75b-4317-9332-814fce86cb2f:10073355-f4a6-4f40-9a0c-b3946544b3e6
---
# PLA D'IMPLEMENTACIÓ: Gestoria Full Width, Auto-descobriment i Replegament

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_dfd3a753-a75b-4317-9332-814fce86cb2f:10073355-f4a6-4f40-9a0c-b3946544b3e6 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T02:16:36.218Z |
| Modificació | 2026-10-14T02:16:36.218Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | IAIA MarIA (Orquestradora) + Consell (Claude / Gemini 4) |
| Tokens consumits | [en curs] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-14T02:16:36.218Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### FRONT 1 (Gemini 4 Argon High · Nucli i Dades Local-First)
1. **Creació de `src/sections/gestoria/font/handleStore.js`:**
   - Magatzem dedicat a IndexedDB (`sdp-gestoria-handles`, clau `'arrel_gestoria'`) usant clonació estructurada nativa (separat del JSON xifrat de `cofre.js`).
   - Mètodes: `desaHandleCarpeta(handle)`, `recuperaHandleCarpeta()`, `oblidaHandleCarpeta()`.
   - Test unitari a `src/sections/gestoria/font/handleStore.test.js`.
2. **Unificació de CSV bancaris a `src/sections/gestoria/nucli/movimentsBanc.js`:**
   - Implementació de `llegeixQualsevolCsvBanc(text)` que fa fallback de `llegeixMovimentsCsv` a `llegeixExtracteCsv` de Sabadell, BBVA, CaixaBank, Cajamar i targetes.
   - Promoció automàtica a `escaner.js:378-380` com a `seleccionable: true`.
   - Test unitari a `src/sections/gestoria/nucli/movimentsBanc.test.js`.
3. **Propostes automàtiques de NIF/Proveïdor a `src/sections/gestoria/nucli/proveidors.js`:**
   - Funció `proposaProveidorDesDeMoviment(moviment, registre)` creuant creditor SEPA C43, comerç de targeta i catàleg mestre.
   - Test unitari a `src/sections/gestoria/nucli/proveidors.test.js`.

### FRONT 2 (Claude Code · UI, Ergonomia i Replegament)
1. **Taula Full-Width i Ergonomia FacturaDirecta/Holded a `src/sections/gestoria/PanellGestoria.jsx`:**
   - Taula al 100% de l'amplada útil, `tabular-nums` a cel·les numèriques.
   - Columna derivada `% IVA` i règim fiscal didàctic (UE ISP / Extracomunitari per a proveïdors com fal.ai, Google Cloud, Anthropic) sense alarmismes vermells.
   - Deep-linking d'1 clic des de la conciliació (`/app/gestoria/full?factura=...`).
2. **Blindatge del Patró de Replegament Lateral (`sdp-app-grid-shell`):**
   - Garantir que el botó `[|<]` (`PanelLeftClose`/`PanelLeftOpen`) col·lapsa la barra lateral cap a l'esquerra a 56px (només icones) a tot el sistema.
   - Tancar les 3 llacunes detectades per Gemini: `ShellGestoria.jsx` (I3), `AdminSection.jsx` (I1) i `ClosaAplicacio.jsx` (I2).
3. **Logo verd oficial de Sóc de Poble a la barra d'autoria:**
   - Carregar `/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png` quan s'actua com a entitat Sóc de Poble.
4. **Guarda de SessionProvider a `useIdentitatDeLaBarra` / `TopBar2`:**
   - Fallback segur per evitar l'excepció no capturada quan `useSession` es crida fora del provider.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Gemini 4:** `npm test -- src/sections/gestoria/nucli/` i `npm test -- src/sections/gestoria/font/`.
2. **Claude Code:** `npm test -- src/sections/gestoria/PanellGestoria.test.jsx` i comprovació del patró de replegament a `AppGridShell.test.jsx`.
3. **Consell Global:** Execució de la suite global per preservar les 17.488 proves verdes.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Trepitjat de fitxers:** Risc zero: Gemini treballa exclusivament sobre `src/sections/gestoria/nucli/` i `src/sections/gestoria/font/`. Claude treballa sobre `src/sections/gestoria/PanellGestoria.jsx`, `Gestoria.css` i components de shell.
- **Trencament de privacitat:** Els nous extractes bancaris han de mantindre intacta la regla que cap URL ni títol continga dades financeres privades.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
