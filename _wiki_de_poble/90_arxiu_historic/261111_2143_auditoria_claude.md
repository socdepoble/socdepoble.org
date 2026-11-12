---
type: informe
status: esborrany
description: Correccions R20 d’al·lèrgens, drets i natiu-build, oracle T8 per a plugins, h1 de les apps, kit d’integració dels kits R19 i ordre exacte del COMMIT R18+R19 per a MarIA.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9c0fcd58-0386-49f8-93e8-a35ced13d5bd:832056a9-07ff-40de-bc03-a04c794202ff
---
# Auditoria Claude de l’Onada R20 · Bucle 1 i 2 sense commit, kit postkits i honestedat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9c0fcd58-0386-49f8-93e8-a35ced13d5bd:832056a9-07ff-40de-bc03-a04c794202ff |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T20:43:36.483Z |
| Modificació | 2026-11-11T21:05:00.000Z |
| Propietari | Claude Opus 5.5 · Carril 1 (arbre viu) |
| Aprovació humana | Encàrrec del Mestre per MarIA (prompt 261111_2112, aprovat a les 21:05 CET) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`) · Claude Code, app d’escriptori |
| Tokens consumits | L’entorn no exposa cap comptador verificable |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-11T20:43:36.483Z: esborrany creat pel circuit documental (`obrir_torn` + `document.mjs context` + `create`).
- 2026-11-11T21:05:00.000Z: completades la MCR, les dimensions D01–D15, la verificació, els límits i l’ordre de comandes per a MarIA.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### ⚠️ P0 · Privadesa en producció: decisió del Mestre abans de res

`supabase/migrations/2611112005_mur_lectura_publica_foraster.sql`, aplicada a producció esta nit segons `.agents/ESTAT.md`, no té cap predicat de fila. `section_submissions.tenant_id` és `not null references public.towns(id)` (`2609080000_initial_schema.sql:47`), de manera que l’`exists (… towns …)` sempre és cert. La política equival a «`anon` llig tot el que s’ha publicat a `mur`, `mercat`, `events` i `multimedia`», de tots els pobles, a Internet.

- **Què ix:** `owner_user_id` i el `payload` sencer. Inclou el nom de l’autoria (`author_name`, que el trigger força des de `profiles.full_name` també quan el perfil és privat), l’avatar, el lloc, `poble_id`, la geolocalització i la data EXIF de les fotos (`fotos_geo`, `geolocalitzacio`, `dataCaptura`) i el contacte de les fitxes de treball i animalets.
- **Què contradiu:** la política de privacitat 2.6 («per a mostrar-lo als altres membres del teu poble … i només per a això») i el text de la interfície («la llig la gent registrada del poble, no Internet», `visibilitatNota.js:198` i `:225`, i els diccionaris).
- **Què NO ix:** les notes privades viuen a `public.notes`, sense cap permís per a `anon`. Les 2 notes del cas Damià no estan exposades. A `section_submissions` no hi ha esborranys: no té cap columna d’estat, i el client només hi escriu quan es publica.
- **Agreujant:** les publicacions que la persona creu esborrades (paperera o esborrat definitiu) només s’amaguen al `localStorage`. La fila continua al servidor i ara també la llig `anon` (`publicacionsEsborrades.js:87-96`, `notes.js:320-336`; no hi ha cap `DELETE` a `section_submissions` en tot `src/`).
- **Opcions, decisió del Mestre:**
  - (a) una migració nova que torne la lectura darrere de `private.is_town_member` i revoque el `select` de taula a `anon`;
  - (b) un Mur públic per a Foraster només amb una vista o RPC de columnes mínimes (sense `owner_user_id`, contacte ni EXIF, i sense el nom de perfils privats), amb opció per publicació, una versió nova de la política de privacitat i els textos «no Internet» corregits abans d’obrir.

  El que es va publicar sota la promesa antiga no s’hauria d’obrir de manera retroactiva.
- **Evidència:** auditoria adversarial `auditoria-kits-r20`. Dos refutadors independents la confirmen com a P0. És una deducció del codi: no he fet cap lectura REST contra producció.

### 0. El que no he pogut fer, i per què

El hook local (`tooling/gates/hooks-local.mjs` + `mutation-policy.mjs`) continua com en R19. Només admet lectures, `npx vitest run <camins>`, `node --test tests/*.test.mjs`, set portes de lectura i `git status`, `git diff` sense camí i `git log --oneline`. Refusa `git add`, `git commit`, `python3`, `npm run build:*`, ESLint, `frontissa-contingut.mjs`, `tractor-cens.mjs`, `tractor-pedra-seca.mjs`, `npx cap sync` i qualsevol escriptura fora del repositori o dins de `.agents/`, `tooling/`, `scripts/` i `package.json`. També bloqueja `mcp__ccd_turn__update_plan` i `wrap_up`.

Conseqüència: **el COMMIT R18 + R19 no està fet** i **cap dels dos kits R19 està aplicat**. No he forçat res. L’arbre queda provat i preparat, i la secció «Ordre exacte per a MarIA» diu cada comanda.

### 1. Matriu de Conformitat de Requeriments (MCR)

| Requeriment del prompt | Estat | Evidència i abast |
| --- | --- | --- |
| B1.1 · `P1-ALERGENS-02` en 5 llengües | `[FET]` | `pageContent.patrimoniR14.js`: «Quan una fila diu «— No en porta segons el text», descriu el text del llibre, no el plat: només una persona pot declarar que un al·lergen no hi és», amb l’etiqueta exacta de la matriu (`TEXTOS_MATRIU_RECEPTARI`) en cada llengua. `ReceptesQueDinem.test.jsx` ara exigix l’etiqueta i prohibix la frase falsa (`FALSA_ABSENCIA`). Vist al navegador a `/page/receptes`. |
| B1.1 · `DRETS_QUE_DINEM` | `[FET a la font]` · `[PREPARAT]` a la fitxa de recepta | `pageContent.dretsPatrimoni.js`: `© Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»`. La font (`OBRA_QUE_DINEM.permis`, generada del PDF) només diu «Text i làmines amb permís d’ús»: cap CC acreditada. La forma `© autoria` és la de drets reservats que llig `dretsAutor.js`. El copyright de la pàgina de recepta (`COPYRIGHT_QUE_DINEM` a `ReceptaDetailSection.jsx`) és un fitxer del kit de Carbon: el canvi va a la fase `despres-dels-kits`. |
| B1.1 · `tests/natiu-build.test.mjs:742-749` | `[FET]` | Només s’admet l’import de la fulla `./pageContent.dretsPatrimoni.js`, i esta no n’importa cap; la portada social és `receptes-ibanez-social-1200x630.jpg`. 38/38. |
| B1.1 · `description` del README de notícies | `[FET]` | Unes 180 lletres, per davall de 220 (comptat a mà, no amb la porta). `npm run porta:frontmatter` és bloquejada pel hook: no l’he poguda passar. |
| B1.2 · Kit Codex R19 (203 operacions) | `[NO APLICAT]` | `python3` bloquejat, i el kit fa 67 baixes de WebP i escriu `tooling/patrimoni/…`, que el hook no em deixa fer per cap via. Cap fitxer que he tocat esta nit pertany al kit: la deriva continua a 0. |
| B1.2 · Kit Carbon R19 i deriva de la línia 101 | `[NO APLICAT]` · `[DIAGNOSTICAT I RESOLT]` | La deriva són exactament 33 B: l’enllaç `<a href="/plugin/genealogia">…</a>` de l’`aiVoice` en valencià que vaig retirar a les 20:14 d’R19 perquè la llei T8 el rebutjava. La preimatge de Carbon post-Codex (`5ed28548…`) és la imatge final de Codex R2 més eixos 33 B. La fase `abans-de-carbon` del meu kit el torna a posar. Els quatre diccionaris restants i `ca.js` ja encaixen (hashes de Codex R2 = alternatives de Carbon). |
| B1.2 · Enllaç `/plugin/genealogia` legítim | `[FET]` | L’oracle de la T8 (`tests/helpers/lleiT8Prova.js`, `rutaViva`) no coneixia les pàgines de plugin. Ara `/plugin/<id>` és viva si `pluginPerId(id)` la troba, que és exactament quan `PluginPage` la pinta (un id de fora és la 404). Prova nova a `paginaDeText.test.js`. Les altres quatre llengües ja portaven l’enllaç. |
| B1.2 · `FITA_R19` honesta | `[PREPARAT]` | Fase `despres-dels-kits`: el títol, l’obertura i l’apartat botànic en 5 llengües diuen que les 67 imatges són recreacions sintètiques retirades en quarantena reversible, que hi ha 24 estudis morfològics corregits i que el catàleg viu en un mòdul diferit de 0 B a l’arrencada, i que cap text del Node 0 entra sense revisió humana. Respecta les regles de la prova de Carbon (ordre d’enllaços, cap lletra enganxada a `</a>`, 7 i 8 negretes per paràgraf). Afig una prova de veritat a `pageContent.versions.test.js`. Cada fragment antic s’ha comprovat amb `rg -c -F` sobre la imatge integrada de Carbon: 1 vegada. |
| B1.2 · Conservar `Info.plist`, migració `2611112005` i `botigues.produccio.test.js` | `[FET]` | No els he tocat. |
| B1.3 · Derivats, Frontissa (9 claus), portes, builds i commit | `[NO FET]` | Tot bloquejat pel hook. Ordre exacte més avall. |
| B2.1 · `/app/nevera/casa/casa` | `[NO ÉS DEFECTE]` | Retire la meua troballa d’R19. És l’entrada «A casa» seguida de l’id de la llista per defecte, que també és `casa` (`LLISTA_INICIAL`, `nucli/nevera.js:43`; «Clàusula dels Slugs» d’`AppNevera.jsx`). Canviar l’id migraria dades desades: és un redisseny, no un arreglo. |
| B2.1 · `h1` a les 7 apps del Panell | `[PARCIAL 6/7]` | `ClosaAplicacio.jsx` pinta `<header class="page-title sdp-sr-only"><h1>{nom de l’app}</h1></header>`: Bar, Nevera, Salut i Genealogia tenen ara un títol de primer nivell. Gestoria i L’Avisador ja en portaven un de visible. **El Lector no** (vegeu Límits). Vist al navegador: la capçalera queda retallada (`clip: rect(0,0,0,0)`), sense desbordament i sense cap canvi a la pantalla. Les dues vistes d’àrea única que són catàlegs (`/app/bar/cataleg`, `/app/nevera/rebost`) porten ara dos `h1`: el de l’app, amagat, i el seu, visible. |
| B2.2 · Suite global Vitest per lots | `[EN CURS]` | Lot 1 (`src/sections`): 1.043 fitxers, 16.216 proves, 7 roges. Detall a «Verificació». |
| B3 · Kits R20 de Codex i Carbon | `[AUDITATS · NO INTEGRABLES ENCARA]` | Van arribar a les 22:02 (Codex v1, reescrit a v2 de 41 operacions durant l’auditoria) i a les 22:07 (Carbon rev1). No s’han aplicat. Veredicte i condicions a la secció 7. |

### 2. Proves roges heretades arreglades (Bucle 2)

- `src/sections/mur/targetesMur.test.js`: esperava la portada antiga de «Què dinem?». Des de R16-AA4 + P0-117 la pàgina porta `receptes-ibanez.webp`, i la targeta del Mur seguix la de la pàgina. La prova ara la llig de `PAGE_COPY.receptes.image`.
- `src/sections/notes/NotesSection.lector.test.jsx` (2 proves): suposaven que el Lector era una app de desenvolupament. Des de P0-113 (ordre del Mestre, 261111) és oberta en producció. «Sense Lector» és ara un paquet que no el porta (`carrega: null`, `VITE_SDP_APP_LECTOR=0`), i la prova ho simula així.

### 3. Regressió meua d’R19 que arregla el kit de Codex

`src/sections/patrimoni/BancLlavorsWorkspaceSection.projeccio.test.jsx` cau perquè el seu mock de `UIContext` no exporta `useUIStateOpcional`, que vaig introduir en R19. El fitxer és del kit de Codex, i la seua imatge final ja l’exporta. No el toque: trencaria la deriva 0.

### 4. Contrast amb el Node 0 (`261111_2132_auditoria_node0_assemblea_8_escoles_r20`)

El veredicte M1 cita seccions que no existixen. Les línies 47-52 de `261111_1741_auditoria_claude.md` no diuen res de cap SHA-256 (són el bloc del tauler); «La Figuera» no apareix a l’auditoria de Carbon; el pla no té cap «secció 4.3» (`force_ask` és a «Riscos»). Comprovat amb `rg` i lectura directa. No hi ha cap acció a fer a partir d’eixe veredicte.

### 5. Dimensions D01–D15

Escala: 5 = parcial, 8 = local amb proves adversarials, 10 = complet i verificat de punta a punta.

| Codi | Dimensió | Nota | Evidència i límit |
| --- | --- | --- | --- |
| D01 | Enxufabilitat i port neutral | 8 | Cap canvi al port. `tractor-enxufe` E1–E4 en verd. |
| D02 | Seguretat, RLS i AAL2 | 7 | `tractor-rls`: 0 infraccions sobre 96 fitxers SQL. La prova AAL2 en PostgreSQL continua omesa sense `SDP_PGLITE_MODULE` (carril de Codex). |
| D03 | Pedra Seca | 8 | `design_guard` 0 crítics i 0 avisos sobre 3.771 fitxers. El `h1` amagat no canvia cap píxel (vist al navegador). `tractor-pedra-seca` no executat. |
| D04 | Accessibilitat | 7 | Títol de primer nivell a 4 apps més; el Lector en continua sense; dues vistes amb dos `h1`. |
| D05 | Rendiment | 7 | La prova `standalone-build` compila l’arbre d’ara per a WordPress: 216.401 B gzip d’entrada i 3.427 B de carregador. Cap `build:web` ni `build:natiu` nou; `natiu-build` llig el `dist-natiu` vell (221.188 B). |
| D06 | Local-first i privadesa | 7 | Sense canvis de dades. Les proves de Notes simulen el Lector fora del paquet com en producció real. |
| D07 | Paritat pentalingüe | 8 | Al·lèrgens en 5 llengües amb l’etiqueta exacta de la matriu. `FITA_R19` en 5 llengües preparada i verificada fragment a fragment, no aplicada. |
| D08 | Custòdia patrimonial i autoria | 8 | Drets de «Què dinem?» sense CC inventada; `FITA_R19` honesta preparada. |
| D09 | SEO i targetes socials | 7 | Portada social i targeta del Mur alineades amb P0-117. |
| D10 | Dades obertes | 6 | Sense canvis. |
| D11 | Proves | 7 | Lots tocats en verd; 3 roges a posta fins al pas posterior als kits; suite global incompleta. |
| D12 | Multi-dispositiu | 5 | Només navegador d’escriptori a 1.024 px; cap prova a 280, 375 ni 768 px. |
| D13 | Governança documental | 8 | Circuit formal; Olivera en verd amb l’avís `CONV-07` (301 > 300 línies). Veredicte del Node 0 refutat amb evidència. |
| D14 | Gratuïtat i plugins | 8 | L’oracle T8 reconeix les pàgines de plugin del registre; l’enllaç de l’Arbre torna amb llei. |
| D15 | Orquestració | 6 | Commit i kits sense fer pel hook; relleu amb comandes exactes i kit d’integració idempotent. |

### 6. Triatge adversarial de les proves roges heretades (workflows `triatge-roges-r20` i `triatge-ios-r20`)

Un agent per cas en diagnostica la causa arrel i un refutador independent intenta tombar el diagnòstic i la correcció. Cap diagnòstic no ha sigut refutat. Les correccions aplicades ho han estat amb la versió refinada pel refutador.

| Prova roja | Causa arrel | Acció |
| --- | --- | --- |
| `qualitat.pecesApps.test.js:134` | La prova fixava la variant `outline` d’un kit Codex R18 que no va arribar al CSS; el viu usa la vora de 2px (AH-R17-04, «Vora i no outline» a `modules.css`). | `[FET]` La prova exigix el mecanisme viu i que cap regla de premut, en tot el CSS canònic, toque l’`outline`. 15/15. Cap píxel. |
| `projecteIos.test.js:594` | `tallaSessio` (purga P1-31 en tancar sessió, kit Carbon R18) esborra la carpeta a posta; la prova la prohibia en tot el fitxer. | `[FET]` Una sola purga i dins de `tallaSessio`; prova nova pròpia de `tallaSessio` (registre, cua serial, cap crida nativa). 30/30. Deute: la capçalera del Swift i `compartirNatiu.js:98-100` encara diuen que l’iOS no en té. |
| `esquemaDoctoralArbres.test.js:75-78` | Assercions de la base 2.0.0; el catàleg viu és la 2.0.1 (arbitratge R17.3) amb camps de procedència. | `[FET]` Paritat exacta amb la font i prova nova de round-trip de la forma sense procedència (3 formats). |
| `esquemaDoctoralArbres.test.js:421` | Grafia «Rodríguez» a la prova; la font primària (WP 619), `actaRentonar.js`, `DRETS_CATALEG_ARBRES` i l’arbitratge 2.0.1 diuen «Rodriguez». El repositori barreja les dues. | `[DECISIÓ DEL MESTRE]` És el nom d’una persona real. Si fixa «Rodriguez», només canvia la prova; si fixa «Rodríguez», cal tocar fitxers dels kits i text visible. |
| `catalegMigracions.readme.test.js:21` | `2611112005_mur_lectura_publica_foraster.sql` no és al README, que és un fitxer del kit de Codex R19. | `[PREPARAT]` Vinyeta i fila 92 a la fase `despres-dels-kits`. També cura `tests/migracio-verificador.test.mjs:487`. |
| `adaptadorLocal.conformitat` ×3, `adaptadorLocal.multipoble`, `localXat.silenci` | Recompte fix de capacitats (52) desfasat des de P0-111 (53). | `[EL KIT DE CODEX HO CURA]` Els cinc fitxers són del kit (54/219); no es toquen. |
| `BancLlavorsWorkspaceSection.projeccio.test.jsx` | Regressió meua d’R19 (mock sense `useUIStateOpcional`). | `[EL KIT DE CODEX HO CURA]` |
| `policy26-sql.test.mjs` | Es nega a carregar sense `SDP_PGLITE_MODULE`, per disseny. | Cap. |

### 7. Bucle 3 · Auditoria adversarial dels kits R20 (workflow `auditoria-kits-r20`)

Cinc auditors independents (fuita en producció, SQL de Codex, dependències de Codex, UX de Carbon i compatibilitat CAS). Cada troballa P0 o P1 la revisen dos refutadors, i només compta si almenys un no la pot tombar.

- **Codex R20 (v2) · integrar amb condicions, no ara.**
  - `2611112149` és tècnicament sòlida (search_path, invocador, idempotent), però **no tanca cap fuita real**: només amaga files que porten `status`, `visibility` o `isPublished` al payload, i cap escriptor de l’app no en porta (P1, confirmat).
  - Imposa a `test:precommit` un PostgreSQL natiu amb la devDependency beta `embedded-postgres@18.6.0-beta.19` (més de 300 MB de binaris amb scripts d’instal·lació). Sense `npm ci`, cap commit passaria el pre-commit (P1, confirmat). Cal l’aprovació del Mestre (Constitució §5).
  - La prova nova no està classificada al manifest de suites (P1).
  - `2611111735` (R19) i `2149` redefinixen la mateixa `private.copub_recurs`: aplicar 1735 després desfà 2149 sense avisar (P2).
  - Ha de refer-se (v3) sobre el COMMIT R18+R19, que és qui ha de documentar 2005 a `supabase/README.md`.
- **Carbon R20 (rev1) · integrar amb condicions, no ara.**
  - Usa tokens que no existixen (`--sdp-space-9`, `--sdp-text`), i `qualitat.tokens` passaria a roig (P1, confirmat).
  - **Un sol clic publica de manera irreversible amb el ràdio «Esborrany privat» marcat i sense l’avís d’irreversibilitat**, i la prova nova ho fixa com a correcte (P1, confirmat per tots dos refutadors).
  - Les preimatges són les de HEAD, sense transicions post-R19, als 5 diccionaris i a `components.css` (P1).
  - Menors: la ploma (`Feather`) està reservada a «tria una emoticona»; el text «perquè la llija el poble» és fals mentre el Mur siga públic; «vila» en gallec on el diccionari diu «pobo»; `author_location` es reescriu en cada actualització.
- **Lectura creuada de `261111_2221_auditoria_codex` (Olivera).**
  - Coincidim que el veredicte M1 del Node 0 cita seccions inexistents, que la 2149 no està aplicada en remot i que HEAD continua a `c07f78b83`.
  - Discrepem en la fuita. Codex la descriu com «drafts amb `status:draft` o `isPublished:false`», que només ha reproduït amb files sintètiques. A les dades reals cap escriptor posa eixes marques, i el defecte real de la 2005 és l’absència de predicat de fila (vegeu el P0 del començament). La 2149 no el corregix.
  - El seu kit també documenta la 2005 i la 2149 a `supabase/README.md`. Proposta: el COMMIT R18+R19 porta la vinyeta de la 2005 (fase `despres-dels-kits`), i Codex R20 v3 hi afig la 2149 sobre eixa base, sense duplicar-la.
- **Ordre CAS.** La cadena Codex R19 → `abans-de-carbon` → Carbon R19 → pegat creuat → `despres-dels-kits` encaixa per hash. Cap ordre aplica també els dos R20: s’han de refer sobre el commit.
- **Correcció al meu kit (P2, acceptada):** no tenia mode invers i trencava el rollback dels kits R19. Ara `aplica_r20.mjs` admet `--invers`; cal desfer `despres-dels-kits` abans de revertir Carbon R19, i `abans-de-carbon` abans de revertir Codex R19.
- **Prova roja nova que no havia vist:** `node --test tests/node-suite-policy.test.mjs` falla hui. Tres proves no tenen entrada a `tooling/tests/node-suite-manifest.json`, fitxer de governança que no puc escriure. Entrades per a MarIA, en ordre alfabètic dins de la llista d’entrades:

```json
{ "path": "tests/apps-del-paquet.test.mjs", "suite": "primary", "reason": "R19 · T3: apps internes del paquet (P0-113 i l’Arbre Genealògic) i definicions de build per a WordPress; fitxers i config locals, cap xarxa." },
{ "path": "tests/migracio-cua-purga-storage-ugc.test.mjs", "suite": "primary", "reason": "P0-20: forma i guardes de la cua de purga d’objectes UGC; SQL real només amb PGlite explícit, cap base remota." },
{ "path": "tests/revisions-patrimoni-viu.test.mjs", "suite": "primary", "reason": "P1-75: campanyes anuals de patrimoni, autoria i control de versió; SQL real només amb PGlite explícit, cap base remota." }
```

### 8. Ordre exacte per a MarIA (o el Mestre), des de `socdepoble.org/`

El kit d’integració és a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261111_2140_kit_claude_r20_postkits/` (`aplica_r20.mjs` + `substitucions_r20.json`). Comprova tots els fragments abans d’escriure i, si un sol falla, no escriu res; és idempotent i admet `--sec`. Si preferiu el lloc habitual dels kits, es pot moure tal qual a `../_investigacio_ia_de_poble/`.

```bash
python3 ../_investigacio_ia_de_poble/261111_kit_codex_r19_copublicacio_gedcom_i_xat/verifica_i_aplica.py --target .
python3 ../_investigacio_ia_de_poble/261111_kit_codex_r19_copublicacio_gedcom_i_xat/verifica_i_aplica.py --target . --apply
node _wiki_de_poble/04_escriptori/02_investigacio_ia/261111_2140_kit_claude_r20_postkits/aplica_r20.mjs abans-de-carbon
shasum -a 256 src/sections/text/pageContent.r10.js
python3 ../_investigacio_ia_de_poble/261111_kit_carbon_r19_barra_taronja_composta_i_editorial/verifica_i_aplica.py --verifica
python3 ../_investigacio_ia_de_poble/261111_kit_carbon_r19_barra_taronja_composta_i_editorial/verifica_i_aplica.py --aplica
git apply --check ../_investigacio_ia_de_poble/261111_kit_codex_r19_copublicacio_gedcom_i_xat/evidencia/creuada/carbon-ruta-registre-opcional.patch
git apply ../_investigacio_ia_de_poble/261111_kit_codex_r19_copublicacio_gedcom_i_xat/evidencia/creuada/carbon-ruta-registre-opcional.patch
node _wiki_de_poble/04_escriptori/02_investigacio_ia/261111_2140_kit_claude_r20_postkits/aplica_r20.mjs despres-dels-kits
npx vitest run src tests
node --test tests/natiu-build.test.mjs tests/apps-del-paquet.test.mjs tests/standalone-build.test.mjs tests/node-suite-policy.test.mjs tests/migracio-verificador.test.mjs
```

El `shasum` ha de donar `5ed28548bdb2c333be7047fb6a444c49adad93e35a8d4580c737995bfaadf66b`; si no, Carbon refusarà el kit sencer, que és el comportament segur. Després: `node tooling/gates/frontissa-contingut.mjs` i l’aprovació humana de les claus, `node tooling/gates/tractor-cens.mjs`, `node tooling/brain/tractor-pedra-seca.mjs`, `npx eslint . --max-warnings=0`, `npm run build:web`, `npm run build:wp`, `npm run build:natiu` i el commit amb el hook complet (mai `--no-verify`), partit en dos si el diff binari passa de 16 MiB. La migració `2611111735_copublicacio_registrada.sql` es versiona però no s’aplica a producció sense el Mestre.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació (comanda real) | Resultat observat |
| --- | --- |
| `npx vitest run src/sections/patrimoni/ReceptesQueDinem.test.jsx src/sections/text/paginaDeText.test.js src/sections/patrimoni/AutoriaDosNivellsArbres.test.jsx` | 90 verdes; 2 roges a `AutoriaDosNivellsArbres` (el copyright de la fitxa de recepta, fitxer del kit de Carbon), que es curen amb `despres-dels-kits` |
| `npx vitest run src/sections/patrimoni/ReceptesQueDinem.test.jsx src/sections/patrimoni/AutoriaDosNivellsArbres.test.jsx` (després de reforçar la prova) | 39 verdes, 3 roges, les tres pel mateix `COPYRIGHT_QUE_DINEM` |
| `node --test tests/natiu-build.test.mjs` | 38/38 |
| `npx vitest run src/sections/text/paginaDeText.test.js src/sections/detail/PageDetailSection.consola.test.jsx` | 60/60 (inclou la prova nova de `/plugin/<id>`) |
| `npx vitest run src/apps` | 2.507 verdes, 2 omeses, 1 roja; la roja era el meu comentari amb `<h1>` literal, ja corregit |
| `npx vitest run src/apps/plataforma/qualitat.test.js src/apps/plataforma/RutaApps.test.jsx src/app/App.appsLocals.test.jsx` | 79/79 |
| `npx vitest run src/apps/plataforma/ClosaAplicacio.test.jsx` | 18/18 (inclou les 2 proves noves del títol) |
| `npx vitest run src/sections` (lot 1) | 1.043 fitxers; 16.204 verdes, 7 roges, 5 omeses. Roges: 3 esperen `despres-dels-kits`, 3 ja arreglades (vegeu la fila següent), 1 la cura el kit de Codex |
| `npx vitest run src/sections/notes/NotesSection.lector.test.jsx src/sections/mur/targetesMur.test.js` | 61/61 |
| `npx vitest run src/components src/data src/app src/utils src/config src/hooks src/pages src/services` (lot 2) | 1.003 fitxers; 18.147 verdes, 9 roges, 17 omeses. Roges: `esquemaDoctoralArbres` ×2, `qualitat.pecesApps` ×1, `catalegMigracions.readme` ×1, `adaptadorLocal.conformitat` ×3, `adaptadorLocal.multipoble` ×1 i `localXat.silenci` ×1. Triatge a la secció 6 de Troballes |
| `node --test tests/design-guard.test.mjs tests/apps-del-paquet.test.mjs tests/standalone-build.test.mjs tests/migracio-admin-resum-sessions-dispositius.test.mjs tests/node0-r13-municipal.test.mjs tests/policy26-sql.test.mjs tests/seed-revisions-r11.test.mjs tests/tractor-rls-realtime.test.mjs tests/migracio-cua-purga-storage-ugc.test.mjs tests/revisions-patrimoni-viu.test.mjs` | 83 proves: 77 verdes, 5 omeses (demanen PGlite) i 1 roja: `policy26-sql.test.mjs` es nega a carregar sense `SDP_PGLITE_MODULE`, per disseny. La prova `standalone-build` compila de veres el paquet de WordPress amb l’arbre d’ara: entrada de 658.649 B (216.401 B gzip), carregador de 3.427 B (sostre 4.096 B) |
| `npx vitest run src/natiu src/pwa src/css src/assets` + les proves soltes de l’arrel de `src/` (lot 3) | 85 fitxers; 1.529 verdes, 3 omeses, 1 roja: `projecteIos.test.js:594` (triatge a la secció 6 de Troballes) |
| `npx vitest run tests` (lot 4) | 25 fitxers; 254 verdes, 87 omeses (proves de producció i de PGlite, que demanen entorn), cap roja |
| `npx vitest run src/components/PedraSeca/qualitat.pecesApps.test.js` (després del triatge) | 15/15 |
| `npx vitest run src/natiu/projecteIos.test.js` (després del triatge) | 30 verdes, 1 omesa (inclou la prova nova de `tallaSessio`) |
| `npx vitest run src/data/patrimoni/esquemaDoctoralArbres.test.js` (després del triatge) | 66 verdes i 1 roja, la de la grafia del nom (decisió del Mestre); 3 proves noves de round-trip sense procedència |
| `node --test tests/node-suite-policy.test.mjs` | 8 verdes, 1 roja: tres proves sense classificar al manifest de suites (entrades a la secció 7) |
| `node tooling/gates/design_guard.mjs --arrel=src` | 3.771 fitxers, 0 crítics, 0 avisos |
| `node tooling/gates/tractor-enxufe.mjs` | E1–E4 en verd |
| `node tooling/gates/tractor-rls.mjs` | 0 infraccions sobre 96 fitxers SQL |
| `node tooling/gates/porta-olivera.mjs --informe` | Safata buida, cap consumit; avís `CONV-07` (301 línies de l’índex, llindar 300) |
| `rg -c -F` sobre la imatge integrada de Carbon | Cada fragment antic de `despres-dels-kits`: 1 vegada; l’ancoratge de `abans-de-carbon`: 1 vegada a la imatge final de Codex, i la forma enllaçada, 1 vegada a la preimatge post-Codex de Carbon |
| Navegador intern (`localhost:3340`) | `/page/receptes`: frase nova, 0 recursos amb error; `/app/nevera`: `h1` «La Nevera de Casa» retallat, `scrollWidth = clientWidth`; escombratge de les 7 eines amb el recompte de `h1` de la MCR |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **P0 de privadesa en producció** (la política 2611112005): no l’he tocat. Una migració sobre la base de producció no la puc ni la dec fer jo, i la frontera pública és decisió del Mestre.
- **Kits R20 sense integrar.** Tots dos han de refer-se sobre el COMMIT R18+R19, i Codex R20 necessita l’aprovació del Mestre per a la dependència `embedded-postgres`.
- **Grafia «Rodriguez» / «Rodríguez»** i **manifest de suites** (tres entrades): roges fins que decidisca el Mestre o escriga MarIA.
- **Sense commit, sense kits aplicats, sense builds, sense ESLint, sense Frontissa, sense `tractor-cens` ni `tractor-pedra-seca`.** Tot és per l’abast del hook; l’ordre és a la secció 8 de Troballes.
- **Tres proves roges a posta** (`AutoriaDosNivellsArbres` ×2 i `ReceptesQueDinem` ×1) fins que s’execute `despres-dels-kits`. Fan de porta: el pre-commit no deixarà segellar si el pas s’oblida.
- **El kit d’integració no l’he pogut executar** (el hook no em deixa llançar `node` sobre fitxers fora de `tests/`). He verificat cada fragment amb `rg`; si un no casa, l’aplicador no escriu res i diu quin.
- **Lector sense `h1`** a la llista de notícies. Ni passa per `ClosaAplicacio` ni pot llegir el context de la interfície (`fronteres.test.js`). La solució neta és una peça de títol a l’API pública del nucli de la plataforma, i això demana versió de `contracteNucli.js`: decisió de MarIA o del Mestre.
- **Dos `h1` a `/app/bar/cataleg` i `/app/nevera/rebost`.** Una clau de ruta `titolPropi` ho evitaria, però també toca el contracte del nucli.
- **Avís `CONV-07`** de la porta Olivera: l’índex de l’Escriptori té 301 línies (llindar 300) per l’àncora d’este informe. La higiene és de MarIA.
- **Cap prova en mòbil ni tauleta.** Només escriptori a 1.024 px.
- **La línia de `ESTAT.md` i del `LEDGER`** no la puc escriure (`.agents/` és zona de governança). Text proposat: «261111 | R20 Carril 1 | Claude: al·lèrgens, drets, natiu-build, T8 plugins, h1 apps i kit d’integració preparats; commit pendent del hook».

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio]]
- [[../90_arxiu_historic/261111_1741_auditoria_claude|261111_1741_auditoria_claude]]
- [[../90_arxiu_historic/261111_1822_auditoria_codex|261111_1822_auditoria_codex]]
- [[../90_arxiu_historic/261111_1951_auditoria_gemini_carbon|261111_1951_auditoria_gemini_carbon]]
- [[261111_2132_auditoria_node0_assemblea_8_escoles_r20]]
- [[03_llibre_mestre_tasques_i_idees]]
