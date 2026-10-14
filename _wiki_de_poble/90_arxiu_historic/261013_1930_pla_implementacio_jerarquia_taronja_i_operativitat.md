---
type: document
status: esborrany
description: 'Pla per a Claude i Codex: desplegables i carpetes en taronja, botó d''aprovació ràpida de tractors en dev i verificació d''operativitat de xarxa i entitats.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_42485a7d-4411-457d-b7e2-f591b38cc2b2:3d6b5d3b-9aac-4c27-9b6b-7b86ca1ac3be
---
# Pla d'Implementació — Jerarquia Taronja de Carpetes, Aprovació Ràpida de Tractors i Operativitat de Xarxa

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_42485a7d-4411-457d-b7e2-f591b38cc2b2:3d6b5d3b-9aac-4c27-9b6b-7b86ca1ac3be |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T17:29:54.525Z |
| Modificació | 2026-10-13T17:31:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovat (ordre directa del Mestre per àudio) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity / IAIA MarIA |
| Tokens consumits | orquestracio |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-13T17:29:54.525Z: esborrany creat.
2026-10-13T17:31:00.000Z: pla completat i aprovat pel Mestre per a execució de Claude Code i Codex.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes
El Mestre Javi ha traslladat tres necessitats fonamentals després de la finalització amb èxit de l'auditoria de la Gestoria JARVIS:
1. **Jerarquia Visual de Contenidors vs Contingut:** A les barres de navegació (Sidebar principal i columna de navegació de l'Espai de Treball `UniversalWorkspace`), els menús i carpetes desplegables que no tenen document propi immediat (com «Sistema» a la sidebar, o «CATEGORIES» / «ETIQUETES» / carpetes a Notes i Wiki) han de distingir-se clarament dels enllaços finals mitjançant la identitat visual taronja de la marca (`--sdp-accent-taronja` / `--sdp-orange`).
2. **Fatiga d'Aprovació de Tractors (Dev Fast-Pass):** Cada modificació de codi altera el hash SHA-256 de les fonts, fent que tots els tractors tornen a «Versió canviada». S'ha d'habilitar una opció per aprovar en bloc tots els tractors en entorn de desenvolupament (`DEV`), i distingir l'aprovació tècnica de la revisió reflexiva humana.
3. **Operativitat Real de la Xarxa Social:** Clarificació de la commutació entre dades sintètiques (`seed`) i dades vives (`remote`), assegurant que les entitats fundacionals `socdepoble` i `rentonar` i el xat estiguen operatius.

### 2. Front 1: Jerarquia Visual Taronja per a Carpetes i Desplegables
- **Sidebar Principal (`src/app/App.jsx`, `src/css/layout.css`):**
  - Dotar a la classe `.nav-item--desplegable` («Sistema») d'identitat visual taronja (color del text, icona o indicador d'acordió) tant en estat plegat com desplegat, diferenciant-lo a colp d'ull de les seccions planes com Xat, Mur o Mercat.
- **Espai de Treball (`src/components/universal/workspace/UniversalWorkspace.jsx`, `src/css/modules.css`):**
  - Estilitzar els encapçalaments de grup (`.sdp-workspace-group-heading button`) amb color taronja de capçalera de carpeta.
  - Per a les files de carpeta (`.sdp-workspace-folder-row`) que tenen fills (`hasChildren`), ressaltar la icona de carpeta i el botó desplegable amb el to taronja canònic de Pedra Seca, mantenint els documents finals (`FileText` o sense fills) en color neutre editorial.

### 3. Front 2: Aprovació Ràpida de Tractors en Desenvolupament
- **Panell de Tractors (`src/sections/tractors/PanellTractors.jsx`, `src/sections/tractors/useTractors.js`):**
  - Afegir una funció `aprovaTotsPendents()` visible exclusivament quan `import.meta.env.DEV` és actiu.
  - Incorporar un botó accessible «Aprovar tots els pendents (DEV)» a la capçalera de la porta d'aprovació que registre les signatures de les empremtes vigents a IndexedDB en una sola acció.
  - Documentar a la fitxa de govern el patró de revisió humana reflexiva.

### 4. Front 3: Operativitat de Xarxa i Entitats
- Verificar la compatibilitat de `src/data/backendPort.js` i `src/config/dataMode.js` per facilitar l'entrada al compte en viu i documentar el pas a pas per a provar el xat i la gestió d'organitzacions locals vs remotes.

### 5. Front 4: Disseny de la Botonera de Vistes (`PillToggle` a `modules.css`)
- **Regla `.sdp-cal-vistes` (`src/css/modules.css:6785-6792`):**
  - Retirar l'estil prohibit `text-decoration: underline` que apareix en activar una opció (`[aria-pressed="true"]`).
  - Corregir el radi de vora (`border-radius`) del contenidor perquè use la píndola de Pedra Seca (`--sdp-radius-pill`) en comptes del rectangle arredonit `--sdp-radi-m`.

### 6. Front 5: Accessibilitat i Selecció Massiva a «Què llegiré i què no» (`Finestreta.jsx`, `useFinestreta.js`)
- **Gestió massiva de fitxers opacs (`src/sections/gestoria/finestreta/useFinestreta.js`):**
  - Implementar funcions `marcaTotsDemanar()` i `desmarcaTotsDemanar()` per seleccionar o deseleccionar en bloc tots els documents que tenen `decisio === 'demanar'`.
- **Interfície i Accessibilitat (`src/sections/gestoria/finestreta/Finestreta.jsx`):**
  - Incorporar una botonera d'acció ràpida accessible o casella mestra a la capçalera de la taula («Marca tots els pendents (N)» / «Desmarca tots») per evitar la fatiga manual d'haver de prémer «Llig-lo» desenes de vegades d'un en un.

### 7. Front 6: Ergonomia de Verificació a Propostes («D'on ix» clicable i inspeccionable)
- **Inspecció directa de documents (`src/sections/gestoria/finestreta/Finestreta.jsx`):**
  - A la columna «D’on ix», convertir les rutes dels fitxers en elements interactius o afegir una acció ràpida per previsualitzar el document original o el fragment de text extret, evitant que la persona haja d'anar al gestor de fitxers del sistema operatiu a comprovar les discrepàncies manuals dels camps en conflicte.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. Execució de la suite de proves de Vitest per a l'espai de treball, la barra lateral i la finestreta:
   - `npx vitest run src/components/universal/workspace/UniversalWorkspace.barres.test.jsx`
   - `npx vitest run src/sections/tractors/PanellTractors.test.jsx`
   - `npx vitest run src/apps/plataforma/BarraApp.test.jsx`
   - `npx vitest run src/sections/gestoria/finestreta/Finestreta.test.jsx`
   - `npx vitest run src/sections/gestoria/finestreta/useFinestreta.test.jsx`
2. Verificació d'accessibilitat: contrast de color WCAG AA mínim 4.5:1 per als elements taronges sobre fons fosc i clar.
3. Comprovació de la Porta Olivera (`node tooling/gates/porta-olivera.mjs`) per certificar l'Escriptori net.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Contrast Cromatic:** El taronja sobre fons blanc o fons clar requereix un to fosc/caramel per complir el ràtio 4.5:1 de WCAG AA. S'ha d'usar el token canònic de Pedra Seca `--sdp-accent-taronja` / `--sdp-orange-accessible`.
- **Aïllament de Seguretat:** L'aprovació ràpida de tractors només pot estar activa en mode `DEV`, mai en el paquet compilat per a producció o WordPress.
- **Sobirania de Dades:** La selecció massiva de fitxers a la Finestreta només afecta els documents amb `decisio === 'demanar'` (fitxers ordinaris amb nom no reconegut), mantenint sempre immutables i protegits els documents mèdics i personals marcats com a `ometre`.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
