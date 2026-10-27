---
type: document
status: esborrany
description: Pla per a implementar el botó i Card de Descàrregues multiplataforma, aplicar Salfumant a la Wiki i calibrar la UI de Converses.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_409a64e5-477b-454c-b445-4e0c42a28d83:223a3239-be6b-4a6c-8b37-a2c15748f705
---
# Pla d'Implementació — Botó i Pàgina Card de Descàrregues, Salfumant Wiki i Converses WhatsApp

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_409a64e5-477b-454c-b445-4e0c42a28d83:223a3239-be6b-4a6c-8b37-a2c15748f705 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T20:28:32.124Z |
| Modificació | 2026-10-26T20:35:00.000Z |
| Propietari | MarIA (Directora Tècnica) |
| Aprovació humana | aprovat (Mestre Javi Llinares, en àudio d'instruccions 261026_2126) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) |
| Tokens consumits | ~2.500 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-26T20:28:32.124Z: esborrany creat via tooling canònic.
2026-10-26T20:35:00.000Z: pla completat amb els cinc eixos d'acció: Botó i Card de Descàrregues, Salfumant Wiki de 226 enllaços, TOC H1-H6 / Notes, i Calibratge Visual de Converses WhatsApp.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
- **Fita Nadiua Segellada:** El commit `d83188d2` ha deixat el Share Target (Android Intent / iOS Share Extension) i les notificacions completament integrades amb 3.627 proves verdes.
- **Nou Requeriment Humà (Àudio del Mestre Javi, 261026_2126):**
  - Afegir un botó destacat damunt de `[ Connectar-se ]` i `[ Registrar-se ]` que conduïsca a una nova pàgina de **Descàrregues**.
  - Aquesta pàgina és una **Card de Sistema en si mateixa** (`SYSTEM_PAGES`), visible al Mur (`/mur`) i accessible via ruta (`/page/descarregues` o `/descarregues`).
  - La pàgina ha d'explicar totes les modalitats de descàrrega: Android (Google Play i APK directe), iOS (TestFlight i App Store), Web Nadiua / PWA per a escriptori, i opcions futures per a sistemes operatius (Windows, Mac, Linux).
  - Ha d'explicar amb transparència absoluta la **visió arquitectònica**: actualment l'aplicació requereix internet per a la sincronització veloç de dades via Supabase, però el model de dades i de negoci està preparat com a *local-first* i evolucionarà cap a un sistema autònom i offline complet en el futur.
  - La il·lustració mestre de la Card ja ha estat generada amb el Nano (`public/assets/uploads/brain/nano_descarregues_app.webp` i `.jpg`), seguint estrictament l'escola Bruguera/Berlanga i la skill `core-identitat-visual`.
- **Deute Tècnic de la Wiki (Llei del Salfumant Radical):** El hook precommit va requerir `--no-verify` al commit previ per culpa de 226 enllaços històrics trencats a `_wiki_de_poble/10_actes/`. Cal reparar o sanejar aquests enllaços perquè `tancament.mjs --check` isca amb codi 0 net sense cap omissió.
- **Bloc de Notes (§5 i §6):** Reestructurar el calaix de Taula de Continguts (TOC H1–H6) amb respiració sota la barra de 58px i icones coherents a la barra d'eines.
- **Calibratge Visual de Converses (`P1-36` i `P1-37`):** Targetes de conversa a 96px (`2 × 48px`), avatars grans de 74–76px, apropar títol i missatge, substituir el botó `[...]` per *Long Press*, i aprofitar el desplegable existent de la caixa de cerca (`FiltreConverses.jsx`).

### 2. Fitxers Afectats i Accions Concretes

#### A. Botó i Card de Descàrregues
1. **[MODIFY] `src/sections/xat/XatSection.jsx`**:
   - A `AccesAlXat`: afegir el botó `Descarrega l'App` damunt de `sdp-alerta__accions` (amb estil píndola gran Pedra Seca, alçada tàctil de 48px, respiració i acció `navigate('/descarregues')` o `navigate('/page/descarregues')`).
2. **[MODIFY] `src/config/systemPages.js`**:
   - Afegir l'entrada canònica a `SYSTEM_PAGES`:
     `{ key: 'descarregues', isAvis: false, href: '/page/descarregues', accio: null }`.
3. **[MODIFY] `src/sections/text/pageContent.js`**:
   - Afegir `PAGE_COPY.descarregues` amb:
     - `date`: instant ISO actual.
     - `title`: 'Descàrregues i Aplicacions'.
     - `subtitle`: 'El teu poble a la butxaca, a l\'escriptori i lliure'.
     - `lead`: 'Tria la descàrrega oficial per al teu dispositiu i comença a viure el teu poble amb sobirania digital.'.
     - `image`: '/assets/uploads/brain/nano_descarregues_gamberro.webp',
     - `imageAlt`: 'Il·lustració d\'humor gamberro de la màquina impossible bullint un cervell electrònic per a les descàrregues de Sóc de Poble',
     - `imageWidth`: 1024, `imageHeight`: 1024, `imageFetchPriority`: 'high',
     - `labels`: `[{ text: 'Sistema', className: 'sdp-badge-system' }, { text: 'Descàrregues', className: 'sdp-badge-category' }, { text: 'Multiplataforma', className: 'sdp-badge-tag' }]`.
     - `html`: Redacció impecable amb H3-H5 estructurats explicant:
       - Android (Google Play i APK directe).
       - iOS / iPadOS (Apple TestFlight i App Store).
       - Ordinadors (PWA / Web Nadiua instal·lable des de Chrome/Edge/Safari).
       - Visió d'Arquitectura i Sincronització: Online-First pragmàtic hui per a la velocitat, camí a l'autonomia local-first i offline complet demà.
4. **[MODIFY] `src/app/App.jsx`**:
   - Suport a la ruta `/descarregues` (redirecció o àlies cap a `/page/descarregues`).
5. **[MODIFY] `src/config/idiomes/ca.js`** (i fitxers de llengua corresponents):
   - Claus de traducció per al botó `section.xat.sessio.descarregar` ('Descarrega l\'App').

#### B. Salfumant Radical a la Wiki i SCC (Zero `--no-verify`)
6. **[MODIFY] `_wiki_de_poble/10_actes/`** i enllaços interns:
   - Executar `node tooling/wiki/compile-wiki-to-app.mjs --check --strict` i `node tooling/gates/tancament.mjs --check`.
   - Reparar les 226 àncores trencades cap a documents que resideixen a `90_arxiu_historic/` reapuntant-les canònicament o sanejant la referència, eliminant per complet el bloqueig del hook precommit.

#### C. Taula de Continguts (§5) i Icones de Notes (§6)
7. **[MODIFY] `src/sections/notes/components/`**:
   - Reestructurar el calaix del TOC H1–H6 amb separació estricta sota la barra de 58px i paleta Pedra Seca.
   - Normalitzar les icones de la barra d'eines de Notes (Lucide / Pedra Seca).

#### D. Calibratge Visual de Converses de WhatsApp (`P1-36` i `P1-37`)
8. **[MODIFY] `src/sections/xat/`**:
   - Targetes a 96px (`2 × 48px`), avatars grans de 74–76px.
   - Compactació de títol i darrer missatge (`margin-bottom: 2-4px`).
   - Retirar els 3 punts `[...]` de la Fila 1 i habilitar selecció per *Long Press*.
   - Conservar el desplegable a la mateixa línia de la cerca (`FiltreConverses.jsx`).

#### E. Tractor Cognitiu i Baremador de Consistència Visual del Nano (`P1-41`)
9. **[NEW] `tooling/media/baremador_nano.mjs`** (i suport al tauler de Consola si s'escau):
   - Sistema de baremació i avaluació que permeta registrar les qualificacions del Mestre (1 a 10) i els motius estructurats de rebuig/acceptació:
     * `IDIOMA`: Rebuig categòric si conté text no valencià (castellà, italià, o pseudotext). Regla: «Zero Text Rule» preferent al prompt per evitar deformacions.
     * `ENQUADRAMENT`: Rebuig categòric si té marcs blancs de vinyeta o vores exteriors. Obligatori *FULL BLEED* a sang al 100%.
     * `HUMOR_GAG`: Rebuig d'estampes idíl·liques i asèptiques («Testimonis de Jehovà»). Exigència de contraposició d'extrems, màquines impossibles (Professor Bacteri/Ibáñez) i gags visuals.
     * `ESTIL`: Classificació canònica en Tríptic: Còmic Gamberro, Cyberpunk Rural de Pedra Seca, o Fotografia Panoràmica Realista.
   - Registre d'avaluacions a un magatzem persistent (`.agents/qualificacions_nano.json`) per a tancar el cicle d'automillora contínua de prompts.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Botó i Card de Descàrregues:**
   - Obrir `http://localhost:3340/xat` i verificar visualment que el botó `[ Descarrega l'App ]` apareix centrat i amb respiració damunt de `[ Connectar-se ]` i `[ Registrar-se ]`.
   - En prémer el botó, navegar cap a `/page/descarregues`.
   - Comprovar que la imatge del Nano (`nano_descarregues_app.webp`) es renderitza nítida, amb l'H1, etiquetes i text complet.
   - Obrir `http://localhost:3340/mur` i verificar que la Card de Descàrregues apareix barrejada entre les publicacions del sistema.
2. **Salfumant Radical a la Wiki:**
   - Executar `node tooling/wiki/compile-wiki-to-app.mjs --check --strict` -> codi 0.
   - Executar `node tooling/gates/tancament.mjs --check` -> codi 0 (cap necessitat de `--no-verify`).
3. **Suite Completa de Proves:**
   - `npm run test:precommit` (3.627+ proves verdes, 0 errors).
   - `npm run porta:olivera` (codi 0).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Risc de Regressió a `SYSTEM_PAGES`:**
   - *Mitigació:* `SYSTEM_PAGES` està vigilat per proves unitàries estrictes (`systemPages.test.js`, `personalitzacio.test.js`, `navigation.canoniques.test.js`). En afegir `descarregues`, actualitzar també les suites de prova associades per reflectir la nova pàgina de sistema canònica.
2. **Risc en modificar enllaços de la Wiki:**
   - *Mitigació:* No esborrar contingut d'actes; únicament reapuntar la sintaxi d'enllaços `[[nom]]` cap al camí canònic o arxivat (`[[../90_arxiu_historic/nom]]`), preservant la integritat del text.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261026_2115_acta_marmota_triomf_gauntlet_share_target_commit_d83188d2_i_relleu_rea]]
