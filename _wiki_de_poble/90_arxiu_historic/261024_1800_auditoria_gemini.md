---
type: informe
status: esborrany
description: Auditoria exhaustiva de la Wiki per a la versió 2.2 (T5a), disseny interior atòmic de Pedra Seca per a pobles, empreses i entitats (T5b) i contrast de fortificació T1-T4.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_a73cc73f-9aac-4d02-aba1-03a1da4290eb:45a9fb09-18b0-4d2c-9f73-7e1e4692ae79
---
# Auditoria Gemini 4 Argon · Documentació Wiki v2.2 (T5a), Disseny Interior Pedra Seca per a Pobles, Empreses i Entitats (T5b) i Seguiment de Fortificació

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a73cc73f-9aac-4d02-aba1-03a1da4290eb:45a9fb09-18b0-4d2c-9f73-7e1e4692ae79 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T16:08:03.467Z |
| Modificació | 2026-10-24T16:15:00.000Z |
| Propietari | Gemini 4 Argon (IAIA MarIA · Directora Tècnica) |
| Aprovació humana | Autoritzada pel prompt del Mestre Javi Llinares 261024_1800 (àudio 17:54) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon High |
| Tokens consumits | ~68.400 tokens (lectura transversal Wiki, codi UI i portes mecàniques) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-24T16:08:03.467Z`: Esborrany creat amb ancoratge criptogràfic sobre el torn `torn_a73cc73f-9aac-4d02-aba1-03a1da4290eb`.
- `2026-10-24T16:15:00.000Z`: Completada l'auditoria documental de la versió 2.2 (**T5a**), l'avaluació i el plànol atòmic de Pedra Seca per al disseny interior de pobles, empreses, entitats i usuaris (**T5b**), i el contrast creuat amb la implementació de **T1–T4** (Claude Opus 5.5) i l'auditoria adversarial **T6** (Codex Sol Ultra).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Bloc A · T5a: Auditoria de Documentació de la Wiki i Manuels per a la Versió 2.2

#### T5A-01 · P1 · Desfasaments arquitectònics v2.2 a `02_saber/` i `README.md` respecte a l'estat real del codi (`f54baa09c`)

- **Evidència exacta per fitxer i línia:**
  1. `_wiki_de_poble/02_saber/00_arquitectura_tecnica_unificada.md:49,51`, `_wiki_de_poble/02_saber/00_full_de_ruta.md:34` i `_wiki_de_poble/01_ser/01_identitat.md:21` continuen declarant que els *Service Workers*, la instal·lació PWA i `IndexedDB` estan «retirats del sistema» per `ADR-2026-08`. Tanmateix, `_wiki_de_poble/02_saber/architecture/ADR-2026-10-APPS-DEL-DISPOSITIU.md:105-114` documenta explícitament que falta propagar la nova veritat: `public/sw.js` (amb neteja de les 4 cachés Workbox de juny R1+R2) ja està desplegat en viu a `socdepoble.org`, el component `<BotoInstalaApp>` (`IDEA-04`, `src/components/universal/BotoInstalaApp.jsx`) és actiu a la capçalera per a Android/escriptori i guia Safari iOS, i `creaMagatzemIdb` (`src/utils/magatzemLocal.js`) sosté les 5 aplicacions locals del dispositiu (`Bar`, `Salut`, `Nevera`, `Lector`, `Gestoria`). A més, `ADR-2026-10-APPS-DEL-DISPOSITIU.md:102` afirma encara que `socdepoble.org` servix el `sw.js` antic de juny, quan eixe desplegament ja es va tancar el `2026-10-23T17:15`.
  2. `_wiki_de_poble/02_saber/00_arquitectura_tecnica_unificada.md:22` omet l'embolcall natiu **Capacitor 8.5.3** (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capgo/capacitor-social-login`, bundle `org.socdepoble.app`, Apple Team `9KNUA4JR8P`) i els scripts de botigues (`npm run build:natiu`, `npm run botigues:preflight`).
  3. `README.md:28` apunta a una carpeta inexistent `src/styles/` en compte de `src/css/` (`tokens.css`, `pedra-seca.css`, `modules.css`), i `README.md:79-90` prescriu verificar les RPCs antigues de xat (`xat_missatges_del_fil`, `xat_marca_llegit`) sense reflectir la **Fase F0 de Xat** (`2609270200_xat_f0_esquema_i_rpcs.sql`) ni la seqüència canònica de migracions v2.2 (`2610241400` a `2610241440`) i les tres Edge Functions (`compte-apple`, `purga-fitxers`, `noticies`) que sí que estan exemplarment documentades a `supabase/README.md:482-682,1057-1453`.
  4. `_wiki_de_poble/02_saber/architecture/260913_0635_arquitectura_perfil_universal.md:18-38` descriu `PerfilShell.jsx` com un pla futur sobre `UniversalManager`, quan `src/sections/profile/PerfilShell.jsx:1-215` ja està en producció construït sobre `<UniversalWorkspace>`, `<PerfilEditor>` i `<FitxaPublica>`.
  5. `_wiki_de_poble/02_saber/estandard_integracio_react.md:50` manté la referència exclusiva a `wordpress-plugin/socdepoble-enxufe.php` sense indicar el slug oficial aprovat a WordPress.org (`socdepoble`, v1.1.9, `P0-13`) ni la purga programada de la paraula fantasma `enxufe` per a v1.1.10 (`P1-09`).
  6. Per contra, tant `supabase/README.md` com `src/data/adaptadors/noticies/README.md` estan al dia amb la v2.2 (inclosos els 6 referents de la Secció 23 i la retirada de `/app/lector/fonts`). Només caldrà actualitzar el paràgraf de quota de `supabase/README.md:587-608` quan es consolide l'historial d'admissions de **T2** (`2610241430_seguiments.sql`).
- **Acció correctiva proposada (`requires_human_decision: false`):**
  Actualitzar les files 22, 49 i 51 de `00_arquitectura_tecnica_unificada.md`, propagar els 4 vincles d'`ADR-2026-10-APPS-DEL-DISPOSITIU.md:102-114`, alinear `README.md:28,79-90` amb `supabase/README.md` i marcar `260913_0635_arquitectura_perfil_universal.md` com a implementat sobre `UniversalWorkspace`.

#### T5A-02 · P2 · Bloquejos mecànics en portes documentals (`porta:cognitiu`, `porta:frontmatter`, `porta:llaurador`) que frenen `P1-10`

- **Evidència verificada per execució directa:**
  1. `npm run porta:cognitiu` falla amb **2 bloquejos P1 B-1 (Frontmatter fantasma al cos)**: `.agents/skills/core-gauntlet-loop/SKILL.md` (6 separadors `---` al cos) i `.agents/skills/core-salfumant-radical/SKILL.md` (7 separadors `---` al cos). Substituir eixos `---` interns per `***` deixa `porta:cognitiu` amb **0 bloquejos**.
  2. `npm run porta:frontmatter` supera el sostre de deute en 4 regles (`F3: 87 > 47`, `F4: 82 > 41`, `F7: 9 > 4`, `F9: 186 > 131`) per etiquetes fora del vocabulari controlat (`seguretat-rls`, `wcag`, `salfumant`, `tellado`, `memoria`, `govern`), descripcions de més de 220 caràcters (`03_llibre_d_or_memoria_episodica.md`, `03_llibre_mestre_tasques_i_idees.md`) i absència de `## Vincles` en skills creades recentment (`core-salfumant-radical`, `core-seguretat-audit`, `sdp-vigilant-tellado`).
  3. `npm run porta:llaurador` detecta que les últimes Actes Marmota de `_wiki_de_poble/10_actes/` (`261023_1530`, `261024_0035`, `261024_0345`, `261024_1745`) encara no figuren a `_wiki_de_poble/00_index.md`, i `_wiki_de_poble/02_saber/00_full_de_ruta.md` no consta a `_wiki_de_poble/02_saber/00_index_maquina.md`.
  4. `_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md:116` conté el marcador trencat literal `(BROKEN LINK: skills)` en l'exemple de la plantilla.
- **Acció correctiva proposada (`requires_human_decision: false`):**
  Sanejar els `---` del cos als 2 skills per posar `porta:cognitiu` en verd immediat i indexar les 4 Actes Marmota a `00_index.md`.

### Bloc B · T5b: Pre-Avaluació i Plànol de Disseny Interior Atòmic (Pedra Seca) per a Pobles, Empreses, Entitats i Usuaris

L'anàlisi exhaustiva del codi actual de `src/sections/pobles/`, `src/sections/detail/`, `src/sections/profile/` i `src/sections/connectar/` demostra que **ja tenim construïdes totes les peces atòmiques de Pedra Seca necessàries** (`<UniversalPage>`, `<UniversalWorkspace>`, `<UniversalCard>`, `<Pestanyes>`, `<VistaPublicacionsDeLActor>`, `<PortaDePagina>`, `<Insignia>`, `<Taula>`, `<GestioMembres>`, `<QuiSegueixOrganitzacio>`, `<GentQueEtSegueix>`, `useSeguiment`). Per a la següent fase de disseny interior no cal inventar cap sistema nou, sinó **eliminar residus pre-Pedra Seca i connectar les peces atòmiques ja existents** en quatre punts quirúrgics:

#### T5B-01 · P2 · Pàgina Interior de Poble (`/pobles/:id`): Purga de píndoles HTML duplicades i pestanya atòmica d'Empreses i Entitats Locals

- **Estat actual al codi:**
  1. A `src/sections/detail/detailSectionMeta.jsx:615-627`, la vista de detall d'un poble (`sectionId === 'pobles'`) munta `<PortaDePagina>` per al xat comunitari, però just davall (línies `621-624`) injecta un bloc HTML antic:
     `<div className="badge-row"><span className="pill">{habitants}</span><span className="pill">{town}</span></div>`.
     Açò duplica les dades que `paginaDElement` ja entrega a la capçalera d'`<UniversalPage>` (`badges` i `subtitle`), incomplix `sdp-universal-page §4` («les píndoles decoratives duplicades s'han eliminat per Reducció Atòmica») i usa classes heretades (`.badge-row`, `.pill`) en lloc d'`<Insignia>` de Pedra Seca.
  2. A `src/sections/detail/detailSectionMeta.jsx:540-565`, `<PestanyesDelPoble>` munta l'organisme `<Pestanyes>` amb **una única pestanya** (`pestanyes={[{ id: 'gent', etiqueta: 'Publicacions de la gent del poble', contingut: <PublicacionsDelPoble /> }]}`). Una barra de pestanyes d'un sol element aporta soroll visual innecessari si no té germanes.
- **Proposta de disseny interior atòmic (Pedra Seca):**
  1. **Salfumant d'insígnies duplicades:** Eliminar les línies `621-624` de `detailSectionMeta.jsx` (`.badge-row` / `.pill`), deixant que la capçalera canònica d'`<UniversalPage>` mostre la comarca, la província i el cens d'habitants sense duplicitat.
  2. ** Segona pestanya real a `<PestanyesDelPoble>` («Comerços i entitats del poble»):** Afegir a `PestanyesDelPoble` la pestanya `{ id: 'entitats', etiqueta: 'Empreses i entitats', contingut: <EntitatsDelPoble poble={item} /> }`, alimentada pel port `listPublicOrganizations` filtrat per `town_name` / `town_id` (i preparada per als endpoints GET de la Frontissa Sollutia en Model B) i pintada amb `<GraellaTargetes>` + `<SectionItemCard>` (mateixa pell que `ProfileSection.jsx`). Així, cada poble esdevé immediatament l'aparador viu de les seues empreses, cooperatives i associacions.

#### T5B-02 · P1 · Fitxa Pública d'Empreses, Entitats i Persones (`/empresa/:id`, `/grup/:id`, `/gent/:id`): Aparador viu de publicacions/productes i acció directa de seguiment

- **Estat actual al codi:**
  1. A `src/sections/profile/PerfilPublicSection.jsx:671-720`, el component `<FitxaPublica>` només renderitza el text ric d'autopresentació (`presentacioHtml`), els botons d'acció (`.sdp-alerta__accions--centrades`), un paràgraf cru `<p>Correu: <a href={mailto}>...</a></p>` (línies `697-702`) i, si és el perfil propi d'una persona, `<GentQueEtSegueix>`.
  2. **Absència d'aparador d'activitat:** A diferència de `/pobles/:id` (que mostra `<PublicacionsDelPoble>`) i de `/notes` o `/mur` (que usen `<PublicacionsDeLActor>`), quan un veí visita la pàgina pública d'una **empresa** (`/empresa/:id`), d'una **entitat/grup** (`/grup/:id`) o d'una **persona** (`/gent/:id`), **no veu els productes que eixa empresa ven al Mercat, ni els esdeveniments que l'associació organitza a l'Agenda, ni les seues publicacions al Mur**.
  3. **La Pàgina de Connexions com a Clau de Volta (`/connectar`):** Tota la gestió de relacions (connectar amb una notícia o targeta per guardar-la/administrar-la, o connectar amb una persona, grup o empresa amb constància recíproca) viu exclusivament a la pàgina de Connectar (`/connectar`).
- **Proposta de disseny interior atòmic (Pedra Seca):**
  1. **Reutilitzar `<VistaPublicacionsDeLActor>` + `<Pestanyes>` al peu de `<FitxaPublica>`:** Muntar a `FitxaPublica` (`PerfilPublicSection.jsx`) l'organisme `<Pestanyes>` amb:
     - **Pestanya 1 («Presentació»):** El cos editorial actual (`presentacioHtml`), metadades de contacte (substituint el `<p>Correu:` cru per una `<Insignia>` / `<Boto varietat="fantasma">` dins de la botonera Pedra Seca) i la porta al xat.
     - **Pestanya 2 («Publicacions i Mercat»):** `<VistaPublicacionsDeLActor>` alimentada per `itemsPublicatsDe` per a l'identificador i tipus de la fitxa (`persona` o `entitat`), combinant Mur, Agenda i Mercat exactament com fa `PublicacionsDelPoble.jsx:44-76` (`targetaDe`: `<TargetaDelMercat>` per a productes i `<TargetaDelMur>` per a notícies i actes). Zero components nous: una sola arquitectura atòmica converteix cada fitxa d'empresa en una botiga rural i cada fitxa d'entitat en un portal comunitari.
  2. **Doctrina del Mestre (Àudio 261024 18:21 · Connectar, mai Seguir):** Rebutjada taxativament la invenció de botons de «seguir» escampats per les fitxes públiques. A Sóc de Poble no se seguix, **es connecta**. L'únic punt de veritat és la pàgina de **Connectar** (`/connectar`), on es connecta amb contingut i amb ens interactius. La fitxa pública enllaça de forma natural a `/connectar` per a qualsevol gestió de connexió.

#### T5B-03 · P2 · Backend d'Usuari i d'Organitzacions (`/el-meu-perfil`): Separació de «Membres i seguidors» en vista pròpia de 2a columna i distinció semàntica Empresa vs Grup

- **Estat actual al codi:**
  1. A `src/sections/profile/DetallCompte.jsx:200-355`, la vista `El compte` d'una organització (`empresa` o `grup`) apila verticalment fins a 6 blocs heterogenis en una sola columna llarga: `Poble`, `Correu públic`, `Correu de contacte`, `Identificador`, `Membres` (`<GestioMembres>`) i `Qui seguix {nom}` (`<QuiSegueixOrganitzacio>`), més el botó destructiu `Eixir de {nom}` o `Eliminar l'organització`.
  2. A `src/sections/profile/perfilModel.js:96-125`, `navegacioDePerfil` agrupa empreses (`company`/`entity`) i grups (`group`) sota un únic encapçalament pla `GRUPS I EMPRESES`, i `itemsDePerfil` (línies `211-250`) només oferix per a les organitzacions 4 entrades a la 2a columna (`La fitxa`, `Les vistes`, `El compte`, `Multimèdia`), sense vista pròpia per a la comunitat ni previsualització en viu com `La pàgina` dels agents.
- **Proposta de disseny interior atòmic (Pedra Seca):**
  1. **Nova entrada de 2a columna «Membres i seguidors» (`vista: 'membres'`, icona `👥`) a `itemsDePerfil` (`perfilModel.js`):** Desacoblar `<GestioMembres>` i `<QuiSegueixOrganitzacio>` de `DetallCompte.jsx` cap a la seua pròpia vista dedicada al panell dret del `<UniversalWorkspace>` quan l'element actiu és una `empresa` o `grup`. Així:
     - `El compte` queda net, atòmic i centrat exclusivament en dades censals (`Poble`, `Correus`, `Identificador`, `Baixa`).
     - `Membres i seguidors` disposa de tot l'espai de lectura per a la `<Taula>` de membres, el cercador d'alta directa i la `<Taula>` de seguidors (`QuiSegueixOrganitzacio`).
  2. **Previsualització «La pàgina» també per a Persona, Empresa i Grup:** Igual que els agents IA tenen l'entrada `{ id: 'pagina', titol: 'La pàgina', vista: 'pagina' }` a `itemsDePerfil`, oferir o mantindre l'accés immediat a `<FitxaPublica chrome="context">` perquè l'usuari o administrador veja a l'instant com queda la seua pàgina pública sense eixir d'`/el-meu-perfil`.

### Bloc C · Contrast Creuat de Fortificació T1–T4 (Claude Opus 5.5) i Auditoria T6 (Codex Sol Ultra)

1. **T1 (`supabase/functions/noticies/gestor.js` · Anti-SSRF i llista blanca §23):**
   - Hem verificat el diff en curs de Claude sobre `supabase/functions/noticies/gestor.js`: s'ha introduït `adrecaDelSistema(valor)` (exigint esquema `https:`, sense port i sense credencials en carregar el catàleg), `aprovatVetat(host, senyal)` i la validació obligatòria del primer salt i de totes les redireccions dins de `baixa()`, tancant tant el forat **C6-02** (els feeds i imatges aprovats ara passen per `xarxaDe()` quan hi ha `resolDns` i es veten si resolen a IP privada) com el **C6-03** (les redireccions d'una font del sistema ara exigeixen `seguent.port === ''`, impedint el salt a `:8443`).
   - Es mantenen íntegres els **6 canals de sistema de la Secció 23** a `supabase/functions/noticies/fonts.json` (`emowe`, `ayudawp`, `iaenaccion`, `jonhernandez`, `miguebaena`, `bencord`), evitant perdre `www.jonhernandez.education` com advertia Codex.
2. **T2 (`supabase/migrations/2610241430_seguiments.sql` i `src/data/localSeguiments.js` · Quota de 60 seguiments/hora):**
   - Confirmem el diagnòstic **C6-01** de Codex (`261024_1800_auditoria_codex.md:45-53`): la baixa tova (`deixat_al`) ja evita el bypass per `DELETE`, però com que `v_hora` compta files de parelles i `reactivat_al` sobreescriu la marca anterior, deixar i reprendre una mateixa parella no incrementa el comptador d'intents/altes. La solució canònica és una taula privada d'esdeveniments d'admissió (`seguiments_admissions` o historial equivalent sense `ON DELETE CASCADE` cap a la relació) escrita sota el mateix `pg_advisory_xact_lock`, amb paritat exacta a `src/data/localSeguiments.js:120-125`.
3. **T3 (`src/sections/notes/visibilitatNota.js` i `src/sections/notes/SnippetCurador.jsx` · Purga de «MAS»):**
   - Hem localitzat totes les ocurrències exactes que Claude ha de substituir en **T3**:
     - `src/sections/notes/visibilitatNota.js:125`: `'Privada al teu MAS'` -> `'Nota privada (només per a tu)'` (o `'Privada (només visible per a tu)'`).
     - `src/sections/notes/visibilitatNota.js:139`: `'al teu MAS el llegixes'` -> `'a les teues notes el llegixes'`.
     - `src/sections/notes/visibilitatNota.js:151,153,154,157`: `'Només al teu MAS'`, `'Deixar-lo al MAS'`, `'només al MAS'` -> `'Només per a tu (a les teues notes)'`, `'Deixar-lo privat'`, `'només per a tu'`.
     - `src/sections/notes/SnippetCurador.jsx:367`: revisar etiqueta `'Categoria del poble'` / textos associats i alinear les proves `src/sections/notes/ConnexioDetall.test.jsx` i `src/sections/notes/visibilitatNota.test.js`.
4. **T4 (`package.json` · `npm run test:precommit` < 30 segons):**
   - En `package.json:89-115` encara no figura `test:precommit`. Recomanem que `test:precommit` execute en paral·lel o seqüència ràpida `npm run test:fortificacio`, `npm run test:documental` i les suites unitàries crítiques de seguretat (`supabase/functions/noticies/gestor.test.js`, `src/data/supabase/seguiments.test.js`, `src/data/localSeguiments.test.js`, `src/sections/notes/visibilitatNota.test.js`), que s'executen en **~6–9 segons** totals (< 30 s).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes executades directament sobre l'arbre `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org` (branca `backup-notes-publish`, commit base `fe14e1756` / `f54baa09c`):

| Comanda executada | Codi d'eixida | Resultat observat |
| --- | --- | --- |
| `node tooling/gates/porta-olivera.mjs` | `0` | Porta Olivera en verd (`codi 0`), 4 arxius vius reconeguts a `04_escriptori/`. |
| `npm run porta:reflex` | `0` | `reflex_petorreta.mjs doctor --ci` en verd (`0 errors, 0 avisos`). |
| `npm run porta:documents -- --all` | `0` | `porta-documents.mjs` en verd (`9 documents comprovats: OK`). |
| `npm run porta:cognitiu` | `1` | `2 bloquejos` (`P1 B-1` frontmatter fantasma en `core-gauntlet-loop/SKILL.md` i `core-salfumant-radical/SKILL.md`) i `29 avisos` informatius. |
| `npm run porta:frontmatter` | `1` | Deute per damunt del sostre en `F3` (87>47), `F4` (82>41), `F7` (9>4) i `F9` (186>131), documentat a **T5A-02**. |
| `npm run porta:llaurador` | `1` | `262` documents no indexats a `00_index.md` / `00_index_maquina.md` (incloses les 4 últimes Actes Marmota), documentat a **T5A-02**. |
| `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261024_1800_auditoria_gemini.md` | `0` | Validació estructural, de seccions `auditoria.s1..s7` i de rebut reflex superada sense errors. |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Per respecte estricte al repartiment de rols del prompt `261024_1800`, Gemini 4 Argon no ha sobreescrit els fitxers de codi de producte de **T1–T4** mentre Claude Opus 5.5 hi treballa en paral·lel.
- Les propostes de **T5b** constituïxen el plànol tècnic atòmic (amb fitxers, línies i components exactes de Pedra Seca) llest per a ser executat tan bon punt es consolide el commit de fortificació **T1–T4**, seguint la directiva del Mestre Javi («Quan el sistema estiga completament blindat, atòmic, estructurat i resilient, llavors ens ficarem de ple amb el disseny interior...»).
- Cap cron ni tasca de fons no ha sigut creada ni deixada activa durant esta auditoria.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_1800_pla_implementacio_fortificacio_total_i_blindatge_sistema]]
- [[261024_1800_prompt_claude_gemini_codex_fortificacio_total_i_blindatge_sistema]]
- [[261024_1800_auditoria_codex]]
- [[261024_1745_acta_marmota_triomf_fortificacio_trio_adversarial_i_unificacio_lector_bloc_de_notes]]
- [[00_arquitectura_tecnica_unificada]]
- [[ADR-2026-10-APPS-DEL-DISPOSITIU]]
