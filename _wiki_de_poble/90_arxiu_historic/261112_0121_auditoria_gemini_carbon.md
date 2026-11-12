---
type: informe
status: esborrany
description: Tancament dels tres bucles del Carril 3 en clon aïllat amb resolució de CARBON-R20-POBLE-01, verificació CDP, curació òptica de Wikimedia Commons, paritat en cinc llengües i Kit CAS Rev 3.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_6e20f03e-7665-4c26-83d5-0643222659c9:7551caf2-10e4-4a5f-af1b-041cd73d0adf
---
# Auditoria Gemini Carbon R20 · Notes al Mur en línia, CDP, òptica i editorial

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_6e20f03e-7665-4c26-83d5-0643222659c9:7551caf2-10e4-4a5f-af1b-041cd73d0adf |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-12T00:21:42.752Z |
| Modificació | 2026-11-12T00:24:00.000Z |
| Propietari | Gemini 4 Carbon (High) · Carril 3, clon /tmp/sdp_carbon_r20 |
| Aprovació humana | Encàrrec explícit del Mestre, Onada R20 de l’11-11-2026; integració final sotmesa al Mestre i a MarIA |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Carbon (High) · Antigravity IDE |
| Tokens consumits | L’entorn no exposa un comptador verificable de tokens; no s’inventa cap xifra |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-11T21:15:00+01:00: lectura íntegra del pla [[261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio]], del prompt [[../90_arxiu_historic/261111_2112_prompt_gemini_carbon_onada_r20_zero_deute_commit_unificat_i_fortificacio|261111_2112_prompt_gemini_carbon_onada_r20_zero_deute_commit_unificat_i_fortificacio]], de les auditories de la migdiada i de les skills `sdp-pedra-seca` i `sdp-universal-editor`, seguida de la construcció del clon aïllat `/tmp/sdp_carbon_r20`.
- Bucle 1 i Kit `Rev 1`: disseny i implementació de `PanellVisibilitatEnLinia.jsx` sense finestres `<dialog>` per al cas real de Damià Llorens Jordà a `/notes`, amb les cinc llengües oficials (`ca`, `es`, `en`, `eu`, `gl`).
- Bucle 1b i Kit `Rev 2`: reproducció i resolució integral de l’objecció `CARBON-R20-POBLE-01` detectada per Codex (`[[261111_2221_auditoria_codex]]`), incorporant marcador persistent LRU `notes.destinsPublicats.v1`, recuperació paginada via `loadSeccioPage` i bloqueig dur tant a la interfície com a `publishNote`.
- Bucle 2: execució de l’arnés real de Chromium CDP (`280`, `375`, `768` i `1440 px` en clar i fosc), correcció del solapament del peu d’emergències `112` a Salut i tancament del servidor efímer de proves.
- Bucle 3 i Gauntlet final (`Rev 3`): curació òptica de Wikimedia Commons (`C77-01..C77-10`) sense cap imatge sintètica publicada, sincronització editorial viva en cinc llengües, conciliació amb el Kit `v4` de Codex, esmena de les cinc troballes de la contra-auditoria independent i segellat del Kit CAS `Rev 3` (`46921c4787641632cc907b548abe661c815d3f8235b235ec0729005ccfe00f81`).
- 2026-11-12T00:21:42.752Z: emissió i validació d’este informe canònic amb `obrir_torn.mjs` i `document.mjs`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Matriu de cobertura de requisits (MCR)

| Requeriment | Estat acreditat | Evidència i límit |
| --- | --- | --- |
| Aïllament estricte del Carril 3 | Verificat | Tot el codi i les proves s’han executat a `/tmp/sdp_carbon_r20`. `git status --short` al repositori viu confirma zero mutacions a `src/`, `public/`, `tooling/`, `scripts/` i `.git/`. |
| Bucle 1 · Publicació en línia a `/notes` (Cas Damià) | Fet i verificat | `PanellVisibilitatEnLinia.jsx`, `UniversalEditorShell.jsx`, `DocumentEditor.jsx` i `BotoVisibilitat.jsx` substitueixen qualsevol `<dialog>` per un quadre en línia amb selector privat o públic, icona `SquarePen`, selector multi-poble, botó blau cap a estat verd i enllaç directe al Mur. |
| Bucle 1b · Tancament de `CARBON-R20-POBLE-01` | Fet i verificat | Marcador LRU `notes.destinsPublicats.v1` (màxim 200 entrades) darrere de `src/config/storage.js`, paginació cancel·lable amb `AbortController` (`loadSeccioPage`) i bloqueig amb `ErrorPublicacio` si el destí resta indeterminat; conserva també pobles antics desvinculats sense caure mai a `pobles[0]`. |
| Bucle 2 · Geometria Chromium CDP (`280/375/768/1440 × Clar/Fosc`) | Verificat en navegador real | `112/112` comprovacions d’aplicació i `40/40` comprovacions editorials (`152/152` totals): `overflowCount: 0`, `missingCopyCount: 0`, `consoleErrorCount: 0`, `dialogsOpen: 0` i botons d’entrada `>= 48 px` centrats. |
| Bucle 3a · Llei 0 d’òptica real de Wikimedia Commons | Fet i escenificat | Zero imatges sintètiques publicades (`variants: []` a les 24 fitxes de `laminesBotaniquesNode0.js`). Les objeccions `C77-01..C77-10` i les 6 llicències `CC-BY-3.0-US` de Forest i Kim Starr queden segellades amb SHA-256 i revisió `gemma3:12b` a `CURACIO_OPTICA_COMMONS_R20.json`, pendents d’aprovació humana (`C77-01`). |
| Bucle 3b · Coherència editorial viva en 5 llengües | Fet i verificat | `FITA_R20` a `/versions`, actualització d’`aiNode0` a `/page/node-zero` i `/page/fediversity`, 8é bloc `<h3>` a `/disseny`, mostra interactiva reparada a `EspecimenSelectorVisibilitat.jsx` i protecció `useLlenguaOpcional()` a `DesignSection.jsx`. |
| Conciliació sense deriva i Kit CAS `Rev 3` | Segellat i auto-testat | 24 fitxers objectiu i 75 entrades segellades. Pin SHA-256 de `SHA256SUMS`: `46921c4787641632cc907b548abe661c815d3f8235b235ec0729005ccfe00f81`. Supera `verifica`, `aplica`, `replay` i `rollback` sobre `primary` (amb Codex `v4`) i sobre `post_r19`. |

### Troballes corregides durant el Gauntlet Loop del Carril 3

1. **`CARBON-R20-POBLE-01` (P1, reportada per Codex sobre `Rev 1`, RESOLTA a `Rev 2/3`)**:
   - **Abast**: `src/sections/notes/NotesContext.jsx`, `src/sections/notes/NotesEditor.jsx` i `src/components/universal/PanellVisibilitatEnLinia.jsx`.
   - **Evidència**: quan una nota ja publicada d’un perfil multi-poble queia fora de la primera finestra carregada de `mur.feedPosts`, la interfície proposava `pobles[0]` i l’actualització podia canviar de municipi sense tria nova.
   - **Solució verificada**: persistència local LRU per àmbit (`notes.destinsPublicats.v1`), cerca paginada acotada (`pas < 4`, `limit: 50`), conservació de pobles antics desvinculats (cas `Alcoi`) i bloqueig tant al botó de la interfície com a `publishNote` (`ErrorPublicacio`) si el destí continua desconegut.

2. **`CARBON-R20-SALUT-PEU-01` (P2, detectada per CDP a `280 px` i `375 px`, RESOLTA)**:
   - **Abast**: `src/css/modules.css` (`.sdp-salut`, `.sdp-salut-peu`).
   - **Evidència**: el peu fix `position: sticky; bottom: 0` d’emergències `112` a `/app/salut` solapava l’última targeta quan el contenidor arribava al final del desplaçament en mòbil estret.
   - **Solució verificada**: marge intern inferior simètric i coixí estructural que garanteixen lectura completa a les quatre amplàries (`280`, `375`, `768` i `1440 px`).

3. **`CARBON-R20-DISSENY-ESPECIMEN-01` (P1, detectada en contra-auditoria `egm-codebase-details`, RESOLTA)**:
   - **Abast**: `src/sections/disseny/cataleg/detalls/EspecimenSelectorVisibilitat.jsx` i `src/sections/disseny/DesignSection.jsx`.
   - **Evidència**: el quart cas passava `t` en lloc d’`{ t }` a `textosEnLiniaDeNota` i utilitzava noms de propietats anteriors (`pobles`, `pobleInicial`, `enllacPublicat`, `obert`), impedint veure el `<select>` multi-poble, l’enllaç al Mur i el plegat `aria-expanded` a `/disseny`.
   - **Solució verificada**: connexió exacta amb `poblesDisponibles`, `poblePublicat`, `estatPublicacio`, `rutaPublicada` i muntatge condicional real, coberta amb prova automatitzada i `40/40` comprovacions CDP.

4. **`CARBON-R20-CITA-ORIGEN-01` (P1, detectada en contra-auditoria `egm-codebase-details`, RESOLTA)**:
   - **Abast**: `src/components/universal/DocumentEditor.jsx` (línies 1170–1199).
   - **Evidència**: les notes externes o connectades (`citaOrigen`) enviaven `estatPublicacio = null` al panell en línia; després de compartir-les en la mateixa sessió, editar el títol no reactivava el botó d’actualització.
   - **Solució verificada**: càlcul separat d’`estatPublicacioEnLinia` per al panell (preservant `publishState={null}` a la barra d’eines segons el contracte R16-T) i prova d’integració en verd.

5. **`CARBON-R20-GL-LEXIC-I-JSON-01` (P2, detectada en contra-auditoria `egm-codebase-details`, RESOLTA)**:
   - **Abast**: `src/sections/text/pageContent.r10.js` i `CURACIO_OPTICA_COMMONS_R20.json`.
   - **Evidència**: `FITA_R20.gl` i el huité bloc de `TRADUCCIONS_DISSENY.gl` empraven `vila` en lloc de `pobo` (contradient `gl.js`), i el registre `#74` d’all tenia un espai accidental a la clau `"etiqueta RecomanadaCa"`.
   - **Solució verificada**: unificació lèxica a `Muro do pobo` / `multipobo` / `selector de pobo` i normalització de la clau `"etiquetaRecomanadaCa"`.

### Contrast d’al·lucinacions dels cicles nocturns i alertes que requereixen decisió humana

- **Refutació d’al·lucinacions mecàniques al Tauler R20**: el cicle automàtic `M4` de les 8 escoles locals del Node 0 va suggerir alterar una inexistent «línia 18639» de `visibilitatNota.js` per prometre el retorn a privat sense esborrat al servidor, i el cicle `M6` va proposar substituir `30 dies` per la forma inexistent `30 diesos`. Totes dues propostes es descarten perquè contradiuen l’honestedat operativa de `T41` (`D01`) i la normativa lingüística. En canvi, l’auditoria focalitzada de `qwen2.5-coder:14b` sobre el codi real (`evidencia_node0_audit_final_r20.json`) emet `veredicte: "APROVAT"` i `carbon_r20_poble_01_tancada: true`.
- **Alerta transversal de privadesa (`requires_human_decision: true`)**: es fa constar i es respecta la troballa P0 reportada per Claude (`[[261111_2143_auditoria_claude]]`) i contrastada per Codex sobre la migració `2611112005_mur_lectura_publica_foraster.sql`. El Carril 3 no toca SQL ni migracions remotes, però adverteix que l’abast de lectura anònima requereix decisió expressa del Mestre abans de qualsevol desplegament.
- **Custòdia humana d’actius botànics (`requires_human_decision: true`)**: seguint l’objecció `C77-01`, cap imatge es publica ni es mou a `public/assets/` sense revisió humana del Mestre; els tres WebP òptics nous i el dossier `CURACIO_OPTICA_COMMONS_R20.json` queden escenificats dins l’evidència del Kit CAS `Rev 3`.

### Matriu doctoral D01–D15

| Codi | Dimensió | Estat al Carril 3 | Evidència verificada |
| --- | --- | --- | --- |
| D01 | Honestedat de persistència i estats | Acreditat | El panell avisa de la irreversibilitat abans de publicar, bloqueja destins multi-poble indeterminats i no promet mai despublicar sense mètode al port. |
| D02 | Seguretat, RLS i fronteres de dades | Respectat amb alerta aliena | Cap mutació SQL ni ús directe de `localStorage`; tot passa per `src/config/storage.js`. Es manté l’alerta humana de Claude sobre `2611112005`. |
| D03 | Enxufabilitat Model B (Sollutia / WP) | Acreditat | `NotesEditor.jsx` consulta `teCapacitat('paginacioSeccions')` i `loadSeccioPage` pel port neutral `backendPort.js`; `build:wp` ix net en `5,77 s`. |
| D04 | Reglament matemàtic Pedra Seca | Acreditat | 100% tokens semàntics dins `@layer components`, zero estils en línia i zero colors fora de paleta (`design_guard.mjs`: 0 crítics, 0 avisos). |
| D05 | Accessibilitat WCAG AAA i teclat | Acreditat | Dianes `>= 48 px`, ràdios natius en `<fieldset>`, `role="status"` / `role="alert"`, contrast opac sense `opacity < 1` i gestió neta del focus. |
| D06 | Paritat lingüística en 5 llengües | Acreditat | 18 claus noves en `ca, es, en, eu, gl` verificades per `i18n.p122.test.js` (`377/377`), `NotesEditor.damiaPublicacioEnLinia.test.jsx` i `pageContent.versions.test.js`. |
| D07 | Pressupost de pes i càrrega diferida | Acreditat | Entrada web `assets/index-qqcZ4vlg.js` a `225.052 B` gzip-9 (`24.948 B` sota el sostre de `250.000 B`); `laminesBotaniquesNode0` manté `0 B` síncrons. |
| D08 | Rigor patrimonial, TASL i Llei 0 òptica | Acreditat | `77/77` registres òptics verificats al dossier de Commons, zero imatges sintètiques publicades i `6/6` jurisdiccions `CC-BY-3.0-US` corregides. |
| D09 | Geometria multivista i zero desbordaments | Acreditat | `152/152` comprovacions reals amb Chromium CDP a `280`, `375`, `768` i `1440 px` en clar i fosc amb `overflowCount: 0`. |
| D10 | Resiliència asíncrona i concurrència | Acreditat | `AbortController` en la paginació de `NotesEditor.jsx`, comptador de cursa `cursaRef` a `PanellVisibilitatEnLinia.jsx` i acotament LRU a 200 entrades. |
| D11 | Coherència editorial i didàctica viva | Acreditat | `/versions`, `/page/node-zero`, `/page/fediversity` i `/disseny` actualitzats simultàniament en les cinc llengües amb terminologia canònica. |
| D12 | Cobertura de proves automatitzades | Acreditat | `107/107` suites de Notes (`1.388` proves), `51/51` suites de Text/Disseny/i18n/CSS i `EspecimensUniversals.test.jsx` (`70/70`) en verd. |
| D13 | Higiene de processos i escriptori | Acreditat | Servidor efímer Vite aturat (`0` tasques en segon pla), zero fitxers `.orig` i `porta-olivera.mjs` validada amb `exit 0`. |
| D14 | Reproductibilitat i reversibilitat CAS | Acreditat | `verifica_i_aplica.py` valida SHA-256 i modes amb `O_NOFOLLOW`, refusa estats parcials i supera `aplica`, `replay` i `rollback` en dues bases. |
| D15 | Governança i traçabilitat multi-agent | Acreditat | Consens creuat amb Codex (`CARBON-R20-POBLE-01`), subagent auditor `egm-codebase-details` i Node 0 (`qwen2.5-coder:14b` + `gemma3:12b`). |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comprovacions executades amb èxit (`exit 0`) sobre el clon reconciliat `/tmp/sdp_carbon_r20` i el Kit CAS `Rev 3`:

1. **Suites Vitest focalitzades i globals del carril**: `NotesEditor.damiaPublicacioEnLinia.test.jsx` (`12/12`), `NotesEditor.ambitEnLinia.test.jsx` (`9/9`), `NotesContext.ambit.test.jsx` (`19/19`), `qualitat.test.js` (`7/7`), `DocumentEditor.test.jsx` (`53/53`), `EspecimensUniversals.test.jsx` (`70/70`), `i18n.p122.test.js` (`377/377`), `pageContent.versions.test.js` (`73/73`), `pageContent.r9.test.js` (`36/36`) i `laminesBotaniquesNode0.rigor.test.js` (`8/8`).
2. **Qualitat estàtica i tractors**: ESLint `--max-warnings=0` sobre els 24 fitxers del carril (`0` errors, `0` avisos), `design_guard.mjs` (`3.801` fitxers, `0` crítics, `0` avisos), `tractor-persistencia.mjs` (`3.795` fonts, `0` infraccions) i `tractor-pedra-seca.mjs` (`PASSA`).
3. **Empaquetats de producció**: `npm run build:web` (`assets/index-qqcZ4vlg.js`: `645.356 B` brut / `225.052 B` gzip-9; arrencada completa amb 6 `modulepreload`: `458.738 B` gzip-9) i `npm run build:wp` (`5,77 s`, làmines fora del paquet síncron).
4. **Chromium CDP real**: `112/112` comprovacions d’interfície (`cdp_report_r20.json`) i `40/40` comprovacions editorials (`evidencia_cdp_editorial_r20.json`) amb `0` desbordaments horitzontals i `0` errors de consola.
5. **Auto-test del Kit CAS `Rev 3`**: `genera_kit_cas_rev3.py` segella 24 fitxers objectiu i 75 entrades (`pin SHA-256`: `46921c4787641632cc907b548abe661c815d3f8235b235ec0729005ccfe00f81`) i supera `verifica -> aplica -> verifica -> replay -> rollback` tant sobre `primary_post_codex_v4` com sobre `alt_post_r19`.

Ordres d’integració i d’aprovació de la frontissa de contingut estructural per al Mestre i MarIA després d’aplicar els kits de Claude i Codex `v4`:

```bash
python3 ../_investigacio_ia_de_poble/261111_kit_carbon_r20_notes_mur_ux_panell_i_optica/verifica_i_aplica.py --verifica
python3 ../_investigacio_ia_de_poble/261111_kit_carbon_r20_notes_mur_ux_panell_i_optica/verifica_i_aplica.py --aplica
node tooling/gates/frontissa-contingut.mjs --aprova disseny --per "Mestre Javi"
node tooling/gates/frontissa-contingut.mjs --aprova fedivers --per "Mestre Javi"
node tooling/gates/frontissa-contingut.mjs --aprova fediversity --per "Mestre Javi"
node tooling/gates/frontissa-contingut.mjs --aprova node-zero --per "Mestre Javi"
node tooling/gates/frontissa-contingut.mjs --aprova versions --per "Mestre Javi"
```

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense mutació del repositori viu ni desplegament**: tota l’execució del Carril 3 s’ha realitzat al clon efímer `/tmp/sdp_carbon_r20`; l’arbre de treball viu de `socdepoble.org/` roman intacte fins que el Mestre autoritze l’aplicació dels kits i el commit unificat.
- **Frontissa de contingut estructural reservada a aprovació humana**: `.agents/contingut_estructural.json` viu dins la zona protegida d’agents i no es modifica des del kit; cal executar les cinc ordres `--aprova` indicades a la secció de verificació.
- **Publicació d’imatges botàniques sotmesa a custòdia humana (`C77-01`)**: els tres fitxers WebP nous verificats amb Wikimedia Commons i `gemma3:12b` es lliuren dins `evidencia/optica/` del kit i no s’activen a `laminesBotaniquesNode0.js` fins que el Mestre els aprove visualment.
- **Abast de la verificació CDP**: l’auditoria de navegador real acredita geometria, contrast declarat, absència d’errors de consola i comportament amb dades simulades locals; no substitueix proves manuals amb comptes OAuth reals d’Apple o Google en producció ni l’arbitratge SQL de `2611112005`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio]]
- [[../90_arxiu_historic/261111_2112_prompt_gemini_carbon_onada_r20_zero_deute_commit_unificat_i_fortificacio|261111_2112_prompt_gemini_carbon_onada_r20_zero_deute_commit_unificat_i_fortificacio]]
- [[261111_2143_auditoria_claude]]
- [[261111_2221_auditoria_codex]]
- [[../90_arxiu_historic/261111_1951_auditoria_gemini_carbon|261111_1951_auditoria_gemini_carbon]]
