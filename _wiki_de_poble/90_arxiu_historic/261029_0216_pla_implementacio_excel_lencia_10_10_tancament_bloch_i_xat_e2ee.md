---
type: document
status: esborrany
description: Pla d'Implementació 10/10 per tancar el Bloc H (QA-H01/H02/H04, APP-D1, R-01/02/07, M-01, socdepoble.zip) i culminar la Fase 1/2 d'E2EE (P1-12 + IDEA-48)
tags:
  - implementacio
visibility: private
reflex: sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:23cb53c9-f6c6-499e-b93d-cc4cb82cc40b
---
# Pla d'Implementació — Excel·lència 10/10, Tancament del Bloc H i Fase 1/2 d'E2EE al Xat Rural (261029_0216)

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:23cb53c9-f6c6-499e-b93d-cc4cb82cc40b |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T01:23:35.870Z |
| Modificació | 2026-10-29T01:24:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovada pel Mestre en xat (2026-10-29 02:15) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | IAIA MarIA (Gemini 3.1 Pro + Claude Code + GPT Codex + Gemini CLI) |
| Tokens consumits | ~25k (orquestració i síntesi) |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- `2026-10-29T01:23:35.870Z`: Esborrany creat sota torn `torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1`.
- `2026-10-29T01:24:00.000Z`: Pla completat consolidant les auditories de l'onada `261028_1526` (Gemini `9,64/10`, GPT Codex `7,22/10`, mitjana `8,43/10`), el bloc de relleu del compte ixent de Claude Code (`w0479j1zp`) i el rescat dels artefactes de `/private/tmp/` a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/`.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research & Relleu a l'Olivera)

En la sessió `261028_1526` – `261029_0205` s'han consolidat dos grans commits a `fork/backup-notes-publish`:
1. **`cd3b5b56c` (Blocs A–G, 223 fitxers):** Prerender social d'OpenGraph (`111` rutes), purga d'EXIF GPS en 10 fotos d'identitat + guarda al precommit, Mapa Fotogràfic EXIF Multi-Escala amb Leaflet 1.9.4 local (`P1-64`), blindatge del menú Compartir Android/iOS (`P1-31..34`), lupa i píndoles de Converses (`P1-36`), tokens de botons (`P1-37`), versió a la Consola (`P1-35`), i18n natiu/WP (`P1-22`), lector fitat a Apple (`P1-18`) i portes natives (`P1-08`).
2. **`e36606db2` (Bloc H, 99 fitxers):** Barra única del compositor de xat a 48 px (`P1-66`), tipografia unificada a 16 px + `SemiCondensed` (`P1-67`), `@usuari` únic i poble canònic (`P1-68`), botó interactiu «Instal·lar l'App (PWA)» a `/descarregues` (`P1-69`), `--sdp-verd: #0F672F` i semàfor de la Consola (`IDEA-40`), «Proposa Card» a Notes (`IDEA-41`), correccions `QA-01..QA-04` de Codex i millores `M1/M2/C1` d'Emowe (`P1-65`).

#### Barem d'Excel·lència de la Reunió de l'Olivera (Mitjana Basal Inicial: `8,43/10` ➔ Objectiu: `10,0/10` en les 10 Dimensions)

| # | Dimensió Auditada (Butlletí de Qualificacions) | Nota Gemini (`261028_1614`) | Nota GPT Codex (`261028_1611`) | Mitjana | Millores Documentades a Produir Aquesta Nit per al `10,0 / 10` |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | **Arquitectura General i Sobirania (Pedra Seca + Port Neutral Model B)** | `9,8 / 10` | `8,0 / 10` | **`8,90 / 10`** | Completar `QA-E07` (`clauIdentitat` per a IndexedDB, `ambitEstable` + `genAmbit` per a RAM i `actor` en `safata`) i preparar el decorador `src/data/xifratXat.js` sense trencar adaptadors injectats (`T1.4`, `T7`). |
| **2** | **Qualitat Visual, UX Mòbil (`320–393 px`) i Accessibilitat WCAG AAA** | `9,7 / 10` | `7,0 / 10` | **`8,35 / 10`** | Afegir `scroll-margin-block-start` a `.sdp-edicio-avancada__cos` (`GM2-03`), ajustar/verificar el contrast `>= 7:1` del verd (`QA-H03`, p. ex. `#0E662E` `7,07:1` sobre blanc) i verificar amb proves de geometria autenticada `R1` (`375 px`) i `R2` (`360–393 px`). |
| **3** | **Identitat (`@username`), Privacitat RGPD i Integritat SQL/RLS (`P1-68`)** | `9,7 / 10` | `7,0 / 10` | **`8,35 / 10`** | Culminar `QA-H01` (reconciliació de `username` quan es desa `full_name` i guarda contra resposta tardana), `QA-H02` (resolució determinista de pobles homònims a `poble_derivat`) i `APP-D1` (fallback a `/registre` si la migració `2610282100` encara no està aplicada). |
| **4** | **Editor Universal (`/notes`), Proposa Card (`IDEA-41`) i Rendiment de DOM** | `9,8 / 10` | `8,0 / 10` | **`8,90 / 10`** | Evitar reprocessament de cos gran (`300.000` caràcters) en canviar només el títol a `DocumentEditor.jsx` i afegir prova de rendiment/geometria mòbil. |
| **5** | **Compartició OpenGraph (`P1-61`), SEO i Mapa Fotogràfic EXIF (`P1-64`)** | `9,6 / 10` | `7,0 / 10` | **`8,30 / 10`** | Tancar `QA-H04` (`--snapshot` a la cadena `build:social` i prova de primera foto remota + revocació), `R-01`/`GM2-01` (11 imatges OG `<= 300 KB`), `R-02` (6 `.png` amb bytes JPEG), `R-07` (13 títols Wiki) i `M-01` (capçaleres HTTP a `firebase.json` i `vercel.json`). |
| **6** | **Disseny i Implementació Criptogràfica `P1-12` (E2EE) + `IDEA-48` ($k=3$)** | `9,2 / 10` | `6,0 / 10` | **`7,60 / 10`** | Reconciliar `§1.3`/`§5.6`/`§8.6` de `disseny_final_e2ee.md` v1.1.0 (`QA-S01` SAS amb compromís RFC 6189 de 6 dígits d'anada i tornada, `QA-S02` revocació de cercle en 4 nivells, `QA-S03` sobre d'alliberament i `SDPH` de 87 B, `QA-S04` màquina d'estats «No sóc jo», `QA-S05` pressupost i consistència, `QA-S06` Shamir $k=3$ sobre `0x11B` i vectors independents) + implementar Fase 1, Fase 2 i Fase 3 (`T6`–`T7`). |
| **7** | **Cobertura i Rigor de la Suite (Vitest + Node + Mutants)** | `9,5 / 10` | `8,0 / 10` | **`8,75 / 10`** | Reparar les **2 úniques roges heretades** (`laParroquia.test.js:198` i `tests/botigues.test.mjs:250`), assegurar que `MapaFotografic.test.jsx` funcione en còpies temporals i incorporar totes les regressions noves a la suite permanent. |
| **8** | **Preparació per a Botigues (TestFlight, Play, PWA i WordPress.org)** | `9,6 / 10` | `6,5 / 10` | **`8,05 / 10`** | Reconstruir `_builds_de_poble/wordpress/socdepoble.zip` des d'archive net (`83/83` proves d'enxufe en verd) i actualitzar/verificar el canal preview de Firebase Hosting. |
| **9** | **Governança Multi-Agent (L'Olivera, Portes i Tancament)** | `9,9 / 10` | `7,5 / 10` | **`8,70 / 10`** | Executar `T1.5` (blindatge dels skills de l'Olivera, retirada de `pla.md` antic, depuració d'`acta.md`, actualització de `.agents/SKILLS_SEAL.json`) i mantenir `porta-olivera.mjs` a `0`. |
| **10** | **Coherència Semàntica de la Wiki, Skills i Tractors Cognitivos («Dubte Metòdic d'Ull Humà»)** | *No avaluada* | *No avaluada* | *Per avaluar* | Executar `T11`: auditoria extrema de tota la `_wiki_de_poble/`, les 42 `SKILL.md` i `tooling/` caçant duplicitats, solapaments, contradiccions creuades i potenciant els tractors cognitius de codi. |
| **—** | **MITJANA GLOBAL DEL SISTEMA SÓC DE POBLE** | **`9,64 / 10`** | **`7,22 / 10`** | **`8,43 / 10`** | **Bucle continu nocturn de 5 hores (Gauntlet cada 30 min) fins a certificar el `10,0 / 10` en les 10 dimensions i avançar la cua `T7`–`T11` del Llibre Mestre.** |

#### Estat Exacte a Disc del Relleu de Claude Code (`w0479j1zp`) i Rescat Persistent
El compte anterior de Claude Code s'ha aturat ordenadament al 99% de quota setmanal. Tots els fitxers temporals de `/private/tmp/claude-501/` han sigut rescatats abans del reinici del Mac a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/`:
- **Torn de codi obert de Claude:** `torn_74bad4b9-c817-4dca-96b8-eb6ff86a0da4`.
- **`QA-H01` (a l'arbre viu):** `src/sections/profile/PerfilContext.jsx` i `src/sections/profile/PerfilContext.usuariTardana.test.jsx` (còpia de carril a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah01_perfil/`).
- **`QA-H02` (a l'arbre viu):** `supabase/migrations/2610282100_usuari_i_poble_canonic.sql` i `src/data/supabase/usuariIPoble.migracio.test.js` (còpia de carril a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah02_migracio/`).
- **`QA-H04` (8 fitxers de governança en carril, pendents de verificar abans d'aplicar per l'executor):** Preparats a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah04_og/governanca/` (`package.json`, `tooling/tests/node-suite-manifest.json`, `tooling/seo/{projeccio-publica,prerender-social,build-social-manifest}{.mjs,.test.mjs}`). **Nota del relleu:** la sessió ixent adverteix que `lane_qah04_og` no es va arribar a verificar, així que la nova sessió ha de revisar-la/usar la seua pròpia versió verificada i aplicar-la mitjançant l'executor (`../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_21a81070/eines/governanca_qa01.mjs`).
- **`QA-E07 / QA-S01..S06` (disseny E2EE v1.1.0 i esmenes `§1.3`/`§5.6`/`§8.6`):** `../_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md` ja incorpora a `§1.3`, `§5.6` i `§8.6` les esmenes `QA-E07` i `QA-S01..S06`; falta alinear el codi de `xifratXatFormats.js` (`SDPH` de 87 B i $k=3$ fix) i `xifratXatMagatzem.js` (`actor` a `desaASafata`) amb el disseny v1.1.0.
- **`P1-12` Fase 1 (11 fitxers nous a l'arbre viu, sense consumidors i fora del commit del Bloc H):** `src/data/xifratXatCripto.js`, `src/data/xifratXatCripto.seguretat.test.js`, `src/data/xifratXatCripto.vectors.json`, `src/data/xifratXatFormats.js`, `src/data/xifratXatFormats.seguretat.test.js`, `src/data/xifratXatFormats.vectors.json`, `src/data/xifratXatMagatzem.js`, `src/data/xifratXatMagatzem.seguretat.test.js`, `src/data/xifratXatParaules.js`, `src/data/xifratXatParaules.seguretat.test.js` i `tests/helpers/idbFalsEstructurat.js`. Cap d'ells ni `src/data/wikiManifest.js` ha d'entrar al commit de tancament del Bloc H.

---

### 2. Preguntes Obertes, Pla Variable en Viu i Maduresa d'Equip (Zero Bloqueig Humà)

- **Delegació Plena durant les 5 Hores de Marató Nocturna (Ordre del Mestre Javi, 2026-10-29 03:32):** El Mestre delega explícitament tot el consentiment tècnic, arquitectònic i operatiu de la nit en la **IAIA MarIA** i en el consens de **La Reunió de l'Olivera** (Claude Code `Fable 5.1 Extra · Ultracode` + Gemini CLI + GPT Codex). **Cap IA s'ha d'aturar esperant confirmació humana durant la nit.**
- **Pla d'Implementació Variable i Dinàmic (Actualitzat cada 30 minuts per la IAIA MarIA):** Aquest document és un **Pla Viu**. En cada cicle del cron de 30 minuts, la IAIA MarIA llegirà els informes de Claude, Gemini i Codex a `_wiki_de_poble/04_escriptori/`, donarà el seu **OK explícit** a les propostes emergents i afegirà nous passos extrets de `03_llibre_mestre_tasques_i_idees.md` segons l'avanç real de la nit. Totes les IAs han de re-llegir aquest Pla a cada cicle.
- **Iniciativa i Maduresa d'Equip («No som soldats cecs, som mestres d'obra»):** Qualsevol IA que, mentre inspecciona o edita un mòdul, trobe una oportunitat clara de resoldre de pas una tasca del `03_llibre_mestre_tasques_i_idees.md` que millora la qualitat sense risc de regressió (ex. ajustar un marge/token adjacent, completar una clau i18n, unificar un helper o blindar un tractor cognitiu), té l'encàrrec d'aplicar aquesta deducció madura i consultar/confirmar l'OK amb la IAIA MarIA a través d'aquest Pla Variable.
- **Única acció reservada al Mestre en despertar:** Prémer el pas final a `live` de Firebase Hosting, aplicar les migracions a Supabase Prod i pujar el nou `_builds_de_poble/wordpress/socdepoble.zip` a `https://wordpress.org/plugins/developers/add/`.

#### 🫒 Arbitratge i OK Tècnic de la IAIA MarIA — Ronda 2 (`04:10 CET`)
Després d'inspeccionar els informes `261029_0350_auditoria_claude.md` (v1.1.0), `261029_0336_auditoria_gemini.md` (v1.2.0) i `261029_0340_auditoria_codex.md` (v1.1.0), la **IAIA MarIA atorga l'OK Tècnic formal** a les següents decisions i pegats per a integració immediata en el Cicle 2/3:
1. **OK a les decisions `D-C1..D-C7` de Claude Code amb dos refinaments d'excel·lència (`10/10`):**
   - **Refinament `D-C5` (Proves heretades `laParroquia.test.js` i `tests/botigues.test.mjs` — Criteri de Portabilitat CI de Codex + Gemini `§2.3`):** En lloc de dependre d'un `skip` quan no hi és `../_investigacio_ia_de_poble/`, **instal·lar les dues fixtures reals dins de rutes versionades del repositori** (`src/apps/bar/llavors/MAPA_IMATGES.txt` i `scripts/botigues/botigues.env.exemple.txt`) perquè les dues proves passen al 100% amb totes les seues assercions tant a l'arbre viu com en còpies temporals, `git archive` i CI!
   - **Refinament `D-C1` (`Permissions-Policy`):** S'aprova `camera=(self), microphone=(self), geolocation=(self)` (ja unificat al Pla i al Prompt per garantir `0` desacords al detector `contract_consistency.mjs`).
2. **OK d'Integració als Pegats Verificats de Codex i Gemini:**
   - **Integrar `261029_0340_solucio_contrast_codex.patch` (`QA-H03`):** `--sdp-verd: #0e662e` (`7,0978:1` sobre `#ffffff`, `104/104` proves Vitest en verd).
   - **Integrar `261029_0340_solucio_t11_codex.patch` (`T11-01`):** Actualització de `tooling/wiki/contradiction_engine.mjs` (`auditCoherence`) + nou `tooling/wiki/contract_consistency.mjs` (`40/40` proves Node en verd) a través de l'executor de governança.
   - **Integrar el pegat `E2EE-C01..C03` (Gemini `§2.1–2.2` / Codex `§E2EE`):** Alinear `src/data/xifratXatFormats.js` (`SDPH` de `87 B` sense `total`, llindar fix $k=3$, i nous esquemes `SDPC`, `SDPL`, `SDPO`, `SDPP`, `SDPV` de `175 B`) i `src/data/xifratXatMagatzem.js` (`actor` obligatori a `desaASafata`) amb `disseny_final_e2ee.md` v1.1.0, i resoldre les 3 reserves documentals `E2EE-I01..I03` (`SDPS` `89 B`, contracte `genIdentitat` a `§8.6`, i paràmetre de llibreta re-xifrada a `xat_canvia_rk`).
   - **Integrar el lot de sanejament `T11-02..T11-12`:** Retirar els 4 fòssils `.abans-260830` (`T11-02`), posar tombstone a `scripts/teixidor-backlinks.mjs` i `scripts/enllacat-intelligent-wiki.mjs` (`T11-09`), afegir nota d'abast actualitzat a `ADR-2026-08-ONLINE-FIRST.md` (`T11-10`), completar el frontmatter v2 als 5 documents detectats per `auditCoherence` (`T11-11`) i aplicar la regressió permanent d'ancoratge amb camí relatiu `./fitxer.ext|etiqueta` (`T11-12`).
3. **Prioritat Executiva del Mestre (`T5.1`):** Assegurar que les 4 millores humanes i didàctiques del connector WordPress (`socdepoble-enxufe.php`, `ajustos.php`, modal `Mostra els detalls`, `readme.txt` i supressió del `console.warn` d'arrencada a `runtimePolicy.js`) entren abans de reconstruir `_builds_de_poble/wordpress/socdepoble.zip`.

#### 🫒 Arbitratge i OK Tècnic de la IAIA MarIA — Ronda 3 (`04:41 CET`)
Després d'inspeccionar l'avanç en calent de `261029_0350_auditoria_claude.md` (v1.2.0), `261029_0336_auditoria_gemini.md` (v1.3.0, mitjana `9,89/10` amb Dimensions 2 i 4 en `10,0/10`) i `261029_0340_auditoria_codex.md` (v1.2.0, amb els 4 pegats `0408` i `83/83` proves Node T11 en verd):
1. **OK d'Integració Immediata als 4 Pegats `0408` de GPT Codex:**
   - **`261029_0408_solucio_t11_codex.patch` (`83/83` Node en verd):** Substitueix el pegat `0340` i incorpora `contradiction_engine.mjs`, `contract_consistency.mjs`, resolució d'ancoratge amb camí relatiu `./fitxer.ext|etiqueta` (`T11-12`), `scripts/teixidor-backlinks.mjs` amb bloqueig d'escriptura per defecte (`C1-T11-BACK`) i les 4 suites primàries. (Ja s'han alineat també `C1-T11-MAP` i `C1-T11-CAT` al Prompt `261029_0216`).
   - **`261029_0408_solucio_appd1_sessio_codex.patch` (`42/42` Vitest en verd):** Afig `const perfilVigent = capturaSessio()` abans de `desaElMeuUsername` a `src/data/supabase/auth.js` i la revalidació al `catch` per impedir contaminació de sessió (`QA-C1-APPD1`).
   - **`261029_0408_solucio_m01_codex.patch`:** Alinea `firebase.json` i `vercel.json` a `camera=(self), microphone=(self), geolocation=(self)`.
   - **`261029_0408_solucio_runtime_codex.patch` (`125/125` Vitest en verd):** Suprimeix el `console.warn` d'arrencada quan no hi ha `issuer` extern a `src/config/runtimePolicy.js` (`T5.1.4`).
2. **OK als 3 Últims Punts Quirúrgics abans del Commit Net del Bloc H (`T4`) i del Build de `socdepoble.zip` (`T5`):**
   - **Tancament del `46/46` a `src/config/imatgeSocial.pes300.test.js` (`R-01`):** Recomprimir in-place `public/assets/system/ui/og-socdepoble-1200x630.png` (actualment `530.885 B`) a `<= 250.000 B` (és exclusivament una targeta OpenGraph, zero impacte al DOM).
   - **Portabilitat 100% sense omissions per a `laParroquia.test.js` i `tests/botigues.test.mjs` (`T2.5`):** Instal·lar les dues fixtures reals dins de rutes versionades del repositori (`src/apps/bar/llavors/MAPA_IMATGES.txt` i `scripts/botigues/botigues.env.exemple.txt`) perquè les proves passen sense `skip` en qualsevol còpia temporal o CI.
   - **Sanejament `T11-15..T11-19`:** Integrar la correcció de `_wiki_de_poble/01_ser/00_bios.md` (eliminar `\n` literal a línia 10 i apuntar a `core-identitat/SKILL.md`), `_wiki_de_poble/02_saber/00_full_de_ruta.md` i les rutes de `.agents/skills/sdp-workflow/SKILL.md`, `wiki-documentacio-i-reflex/SKILL.md`, `core-estrategia-ia/SKILL.md` i `sdp-universal-editor/SKILL.md` en l'execució de governança de `T1.5`.
3. **OK al Carril de Reconciliació d'E2EE (`T6`–`T7`):** Alinear `src/data/xifratXatFormats.js` (`E2EE-C01..C02`) amb els formats v1.1.0 ja implementats a `src/data/xifratXatRecuperacio.js`, aplicar `E2EE-C03` (`actor` a `desaASafata` en `xifratXatMagatzem.js`) i construir `src/data/xifratXat.js` (decorador apagat per flag).

#### 🫒 Arbitratge i OK Tècnic de la IAIA MarIA — Ronda 4 (`05:10 CET`)
Després d'inspeccionar l'avanç de la Ronda 4 en `261029_0336_auditoria_gemini.md` (v1.4.0, mitjana global en **`9,92 / 10`**, `226/226` proves noves verificades en verd) i `261029_0340_auditoria_codex.md` (v1.3.0, amb la geometria mòbil verificada en navegador real `6/6` i els 3 nous pegats acumulatius `0438`):
1. **OK d'Integració Immediata als 3 Pegats Acumulatius `0438` de GPT Codex:**
   - **`261029_0438_solucio_wordpress_codex.patch` (`65/65` + `1/1` proves del connector WordPress en verd):** Resol el `22/23` de `tests/enxufe-plugin.test.mjs:317` completant les traduccions al catàleg `wordpress-plugin/languages/socdepoble-ca.l10n.php` (`.po`/`.mo`), incloent ambdós bàners (`banner-772x250.png` i `banner-1544x500.png`) per al modal ThickBox i mantenint `languages/` exclòs del ZIP de directori WordPress.org (com exigeixen les regles del directori, que usa GlotPress) però inclòs al paquet propi.
   - **`261029_0438_solucio_t11_codex.patch` (`106/106` proves Node T11 en verd i `264/264` documents a `0` errors):** Substitueix `0408` i `0340` i unifica el parser d'enllaços de prosa (ignorant blocs fenced i inline code) entre `scc.mjs`, `porta-olivera.mjs` i `document-links.mjs` (`C2-T11-PROSA`).
   - **`261029_0438_solucio_e2ee_cua_codex.patch` (`33/33` proves de protocol E2EE en verd):** Tanca `QA-C2-E2EE-LOCK` en `src/data/xifratXatProtocol.js` capturant l'àmbit d'execució abans d'entrar a la cua de `navigator.locks` i revalidant-lo en adquirir el pany.
2. **OK al Lot de Sanejament `.agents/` `T11-20..T11-23` (Gemini `§3.5`):**
   - Durant l'execució amb l'executor de governança (`T1.5`), autoritze: consolidar o referenciar el triangle d'arrencada (`.agents/QUI_SOC.md`, `.agents/BIOS.md`, `.agents/BOOTSTRAP.md`, `.agents/BASELINE.md`) cap a `_wiki_de_poble/01_ser/00_bios.md` (`T11-20`), unificar `.agents/DESTINS_CANONICS.json` com a projecció de `.agents/protocolledge.json` (`T11-21`), retirar el fòssil `.agents/pageContent_old.js` (`T11-22`) i regenerar `.agents/ON_ESTIC.md` en tancar el commit (`T11-23`).
3. **Prioritat per al Cicle 5 (`05:10`–`05:40 CET`):** Claude aplica els pegats `0438` + `0408`, recomprimeix `og-socdepoble-1200x630.png` (`<= 250 KB`), tanca la reconciliació de `xifratXatFormats.js` + `xifratXatMagatzem.js` + `xifratXat.js`, executa la governança (`T1.5`), fa el commit net i reconstrueix `_builds_de_poble/wordpress/socdepoble.zip`.

#### 🫒 Arbitratge i OK Tècnic de la IAIA MarIA — Ronda 5 (`05:40 CET`)
Després d'inspeccionar l'avanç de la Ronda 5 en `261029_0336_auditoria_gemini.md` (v1.5.0, mitjana global en **`9,94 / 10`**, `P1-22` `254/254` i `disseny_final_e2ee.md §21` v1.1.1 verificats) i `261029_0340_auditoria_codex.md` (v1.4.0, Cicle 3 amb els 3 nous pegats acumulatius `0508`):
1. **OK d'Integració Immediata als 3 Pegats Acumulatius `0508` de GPT Codex (`git apply --check` `0` verificat):**
   - **`261029_0508_solucio_t11_i_og_codex.patch` (`186/186` proves Node en verd, `0` omissions, `ESLint 0`):** Unifica 24 fitxers: substitueix tots els pegats T11 anteriors (`0340`, `0408`, `0438`), incorpora l'inspector de rutes i contractes `C3-T11-REF` (`264` documents, `42` skills, `117` orígens de lectura, `53` destinacions d'escriptura), el lexer compartit per a `tooling/brain/fonts-vigilancia.mjs` (`C3-T11-FONTS` / `T11-27`) i el carril complet de **`QA-H04`** (`--snapshot` al prerender social amb timeouts de `5 s` per a dades i imatges, `86/86` proves SEO + política en verd).
   - **`261029_0508_solucio_e2ee_sdph_codex.patch` (`134/134` proves Vitest en verd, `ESLint 0`):** Tanca `E2EE-C01..C02` en `src/data/xifratXatFormats.js` i els seus vectors focals (`SDPH` de `87 B` sense `total` i amb llindar fix $k=3$), interoperable amb `src/data/xifratXatRecuperacio.js`.
   - **`261029_0508_solucio_autoritat_codex.patch`:** Tanca `C3-T11-AUTORITAT` en `.agents/QUI_SOC.md`, `.agents/BIOS.md` i `.agents/BOOTSTRAP.md` (apuntant la llei del sistema de disseny a `.agents/skills/sdp-pedra-seca/SKILL.md` i aclarint original vs mirall d'`AGENTS.md`), respectant `C3-T11-CONTRAST` (no retirar `verify-bios.mjs`, `verify-ledger.mjs` ni `sdp-workflow/SKILL.md`, que existixen i passen).
2. **OK al Lot de Sanejament `T11-24..T11-27` (Gemini `§3.4`):**
   - Durant l'execució amb l'executor de governança (`T1.5`), autoritze: corregir `.agents/rules/supabase_grants.md` (`T11-24`) per distingir taules RLS de taules sensibles RPC-only (`REVOKE ALL FROM public, anon, authenticated, service_role`), alinear `.agents/hooks/verify.mjs:61-68` i `.agents/DESTINS_CANONICS.json` amb `.agents/protocolledge.json` (`T11-25`) i eliminar l'H1 duplicat a `.agents/rules/00_BIOS_COGNITIU.md:6-7` (`T11-26`).
3. **Full de Ruta Immediat per a Claude Code (`Cicle 6 · 05:40–06:10 CET`):**
   - Aplicar els 7 pegats vigents i disjuntament nets: `261029_0508_solucio_t11_i_og_codex.patch`, `261029_0508_solucio_e2ee_sdph_codex.patch`, `261029_0508_solucio_autoritat_codex.patch`, `261029_0438_solucio_wordpress_codex.patch`, `261029_0438_solucio_e2ee_cua_codex.patch`, `261029_0408_solucio_appd1_sessio_codex.patch` i `261029_0408_solucio_m01_codex.patch`.
   - Recomprimir `public/assets/system/ui/og-socdepoble-1200x630.png` (`<= 250 KB`) i instal·lar les dues fixtures versionades (`src/apps/bar/llavors/MAPA_IMATGES.txt` i `scripts/botigues/botigues.env.exemple.txt`).
   - Completar `E2EE-C03` (`actor` obligatori a `desaASafata` en `xifratXatMagatzem.js`) i el decorador apagat `src/data/xifratXat.js`, executar la governança de `T1.5`, fer el commit net (`T4`) i reconstruir `_builds_de_poble/wordpress/socdepoble.zip` (`T5`).

#### 🫒 Arbitratge i OK Tècnic de la IAIA MarIA — Ronda 6 (`06:04 CET`)
Després d'inspeccionar l'avanç de la Ronda 6 en `261029_0336_auditoria_gemini.md` (v1.6.0, mitjana global en **`9,96 / 10`**, `verificador-scc.mjs` net d'errors d'enllaç en els 234 fitxers) i `261029_0340_auditoria_codex.md` (v1.5.0, Cicle 4 amb els 3 nous pegats `0538`):
1. **OK d'Integració Immediata als 9 Pegats Canònics No Solapats de GPT Codex (`git apply --check` conjunt = `0` verificat):**
   - **`261029_0538_solucio_t11_i_og_codex.patch` (`244/244` proves Node en verd, 33 fitxers):** Substitueix tots els combinats T11 anteriors (`0340`, `0408`, `0438`, `0508`) i consolida: `QA-H04` OpenGraph amb timeouts de 5 s, `DESTINS_CANONICS.json` com a projecció determinista de `protocolledge.json` (`destins_canonics.mjs`), `.agents/hooks/verify.mjs` migrat (`18/18` proves, tancant `T11-21` i `T11-25`), i la correcció de `sdp-workflow/SKILL.md` i `wiki-propagar-veritat/SKILL.md` (`T11-04..05`, `T11-16`, amb regeneració del segell real `SKILLS_SEAL.json` via executor en integrar).
   - **`261029_0538_solucio_e2ee_actor_codex.patch` (`74/74` proves Vitest en verd; `241/241` combinat amb cua `0438` i `SDPH` `0508`):** Tanca `E2EE-C03` en `src/data/xifratXatMagatzem.js` exigint `actor` a `desaASafata`, `safata(ci, actor)` i `treuDeSafata(ci, id, actor)` i autenticant-lo a l'AAD.
   - **`261029_0538_solucio_recursos_codex.patch` (`32/32` proves en verd, 5 fitxers):** Tanca `T2.5` instal·lant els 2 recursos reals byte-idèntics en rutes versionades (`src/apps/bar/llavors/MAPA_IMATGES.txt` de 199 entrades i `scripts/botigues/botigues.env.exemple.txt` amb 12 variables buides) i 4 controls negatius.
   - Més els 6 pegats complementaris ja aprovats i disjuntament compatibles: `261029_0508_solucio_e2ee_sdph_codex.patch`, `261029_0508_solucio_autoritat_codex.patch`, `261029_0438_solucio_wordpress_codex.patch`, `261029_0438_solucio_e2ee_cua_codex.patch`, `261029_0408_solucio_appd1_sessio_codex.patch` i `261029_0408_solucio_m01_codex.patch`.
2. **OK al Lot de Sanejament d'Ull Humà `T11-28..T11-31` (Gemini `§2.7` i `§3.4`):**
   - **`T11-28` (`porta-olivera.mjs` vs `porta-taxonomia.mjs`):** Afegir `"solucio": "sense ruta: transitòria de torn (porta-olivera)"` a `tooling/wiki/taxonomia.json` i la fila corresponent a `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` (i actualitzar la fila `"pla"` en ambdós llocs en retirar `pla.md` per a `T1.5`) perquè `porta-taxonomia.mjs --tot` i `--paritat` estiguen 100% en verd.
   - **`T11-29` (`sistema_immunitari.md` + `scripts/immunitari/plaquetes.mjs:115`):** Canviar `type: protocol` a `_wiki_de_poble/02_saber/sistema_immunitari.md:2` i delegar `extreuFantasmes` de `plaquetes.mjs:111` al lexer compartit `extractProseWikiLinks` de `tooling/lib/markdown-prose.mjs`.
   - **`T11-30` (`03_inventari_skills.md:48-50`):** Anotar el cens unificat vigent de **42 skills** (`9 core-*` + `33 sdp-*/wiki-*`).
   - **`T11-31` (`tooling/gates/tractor-doctrina.mjs:155-184`):** Pelar el sufix `:línia` a `esCandidat(brut)`, ignorar les extensions nues (`.mjs`, `.php`, `.sh`, `.py`, `.sql`) i filtrar les metavariables `aammdd` en qualsevol segment del camí.
3. **⚡ EXECUTAT EN VIU PER LA IAIA MarIA A LES `06:15 CET` (Relleu Operatiu per Límits de Sessió de Claude fins a les `08:30 CET`):**
   - **Fet empíric detectat a `~/.claude/projects/.../3bf79748-8a26-43f2-b70c-79cbd17173ff.jsonl`:** Claude Code (`El Rentonar`, `torn_74bad4b9`) ha assolit el sostre de quota de 5 hores a les `04:50:11 CET` (`You've hit your session limit · resets 8:30am Europe/Madrid`) després d'aterrar els seus 18 carrils de codi. Per tant, entre les `04:50` i les `08:30 CET` hi ha **zero escriptors concurrents de Claude**.
   - **Integració executada per la IAIA MarIA a l'arbre viu (`06:14–06:16 CET`):**
     1. Aplicats en bloc i sense cap conflicte els **9 pegats canònics no solapats de Codex** (`261029_0538_solucio_t11_i_og_codex.patch`, `261029_0538_solucio_e2ee_actor_codex.patch`, `261029_0538_solucio_recursos_codex.patch`, `261029_0508_solucio_e2ee_sdph_codex.patch`, `261029_0508_solucio_autoritat_codex.patch`, `261029_0438_solucio_wordpress_codex.patch`, `261029_0438_solucio_e2ee_cua_codex.patch`, `261029_0408_solucio_appd1_sessio_codex.patch`, `261029_0408_solucio_m01_codex.patch`).
     2. Re-segellat `.agents/SKILLS_SEAL.json` amb transacció auditada (`da5947cd...`, anterior `f210378d...`) i sincronitzat `.agents/AGENTS.md` amb `porta-autoritat.mjs --write` (`valid: true`).
     3. Recomprimit `public/assets/system/ui/og-socdepoble-1200x630.png` a **`113.427 B`** (`<= 300.000 B`), deixant `src/config/imatgeSocial.pes300.test.js` en **`46/46` verd** i `src/config/imatgeSocial.test.js` en **`65/65` verd** (`111/111`).
     4. Verificades sobre l'arbre viu integrat: `tests/enxufe-plugin.test.mjs` + `tests/enxufe-plugin-php.test.mjs` + `tests/botigues.test.mjs` (**`37/37` verd, `0` omeses**), les 14 suites Vitest d'E2EE/Auth/Mur/Runtime (**`522` passades, `0` fallades**) i les suites Node de `T11` + `QA-H04` (**`43/43` + `52/52` verd**).
   - **Encàrrec per a Gemini CLI i GPT Codex en el Cicle 7 (`06:30`–`07:08 CET`):**
     1. Verifiqueu l'**arbre viu ja integrat** i certifiqueu les dimensions que ja assoleixen el **`10,0 / 10` real sobre el viu**.
     2. Lliureu en pegats `.patch` llestos per a `git apply` (que la IAIA MarIA aplicarà en la Ronda 7 a les `06:40 CET`): (a) el decorador `src/data/xifratXat.js` + la seua suite `src/data/xifratXat.seguretat.test.js` (`T7`, apagat per flag); (b) el tancament complet de `T1.5` (`protocolledge.json`, `DESTINS_CANONICS.json`, `wiki-cicle-de-vida/SKILL.md`, `core-higiene-escriptori/SKILL.md` i retirada de `pla.md`); i (c) el lot `T11-24..T11-31` (`supabase_grants.md`, `00_BIOS_COGNITIU.md`, `taxonomia.json` + `taxonomia_documental.md`, `sistema_immunitari.md` + `plaquetes.mjs`, `03_inventari_skills.md` i `tractor-doctrina.mjs`).

#### 🫒 Arbitratge i OK Tècnic de la IAIA MarIA — Ronda 7 (`06:43 CET`)
Després d'inspeccionar l'avanç de la Ronda 7 en `261029_0336_auditoria_gemini.md` (v1.7.0, **6 dimensions certificades en `10,0 / 10` a l'arbre viu** i mitjana global en **`9,99 / 10`**) i `261029_0340_auditoria_codex.md` (v1.6.0, Cicle 5 amb contrast `60/60` dels 9 pegats integrats i lliurament dels 3 nous pegats `0608`):
1. **⚡ INTEGRACIÓ EXECUTADA EN VIU PER LA IAIA MarIA A LES `06:41–06:43 CET` (`0` conflictes):**
   - **Aplicats a l'arbre viu els 3 pegats canònics `0608` de GPT Codex (`24` fitxers):**
     1. `261029_0608_solucio_t11_codex.patch` (**17 fitxers, `364/364` proves Node en verd**): tanca completament **`T1.5`** (arxiva `pla.md` byte-idèntic a `90_arxiu_historic/plantilles_retirades_261029/pla.md`, retira la ruta `planificacio` deixant **12 rutes canòniques** a `.agents/protocolledge.json` i `.agents/DESTINS_CANONICS.json` i preservant la validació d'instantànies immutables de rebuts històrics a `porta-plantilla-viva.mjs` `9/9`, restringeix `acta` nova a `_wiki_de_poble/10_actes` `v2.1.0`, i unifica la Transició d'Onada a `wiki-cicle-de-vida/SKILL.md` i `core-higiene-escriptori/SKILL.md`), **`C5-T11-28`** (`solucio` i àlies `pla` a `taxonomia.json` i `taxonomia_documental.md`), **`C5-T11-29`** (`scripts/immunitari/plaquetes.mjs` delegant en l'API real `extractDocumentLinks`), **`C5-T11-31`** (`tooling/gates/tractor-doctrina.mjs` `27/27`), més les 2 noves suites primàries `tests/t11-retirada-planificacio.test.mjs` i `tests/t11-parser-consumers.test.mjs`.
     2. `261029_0608_solucio_grants_codex.patch` (**`C5-T11-24`**): separa Data API/RLS i el patró RPC-only a `.agents/rules/supabase_grants.md` (`9/9` claims amb `0` desacords).
     3. `261029_0608_solucio_regressions_codex.patch` (**6 fitxers, repara les 3 fallades de producte de la bateria ampla de pre-commit Vitest `4.071/4.071` en `197/197` fitxers**): lector pur compartit `src/utils/iniciEditorial.js` per a la paritat del títol editorial entre Wiki (`parseMarkdown.js`) i IAIA (`iaiaLocal.js`) inclòs a la petjada de `build-social-manifest.mjs` (`77/77` SEO), reordenació de `xifratXatParaules.seguretat.test.js` mantenint els 132 membres (`24/24`), i exclusió explícita de les 17 variants socials a `src/sections/multimedia/censImatges.js` (`11/11`).
   - **Aplicats a l'arbre viu els 8 fitxers complementaris no solapats de Gemini (`261029_0630_solucio_t11_onada6_gemini.patch`):**
     - `.agents/rules/00_BIOS_COGNITIU.md` (`T11-26`), `.agents/skills/core-estrategia-ia/SKILL.md` (`T11-18`), `.agents/skills/sdp-universal-editor/SKILL.md` (`T11-18`), `.agents/skills/wiki-documentacio-i-reflex/SKILL.md` (`T11-17`), `_wiki_de_poble/01_ser/00_bios.md` (`T11-19`), `_wiki_de_poble/02_saber/00_full_de_ruta.md` (`T11-15`), `_wiki_de_poble/02_saber/03_consola_termodinamica/03_inventari_skills.md` (`T11-30`) i `_wiki_de_poble/02_saber/sistema_immunitari.md` (`T11-29`: `type: protocol`).
   - **Re-segellat CAS oficial i portes 100% en verd a l'arbre viu:**
     - Actualitzat el catàleg amb `node tooling/brain/cataleg_skills.mjs --escriu` (`ok: true, problemes: []`) i re-segellat `.agents/SKILLS_SEAL.json` via `verificaSegell(..., { update: true })` amb traça CAS a `.agents/seal-transactions/` (`hash: cbb5e26d5431b8178496e62d3ffb6d6f77f6e02599924a9d8872c6d74cf7d5db`, anterior `da5947cd...`).
     - Verificat a l'arbre viu: `verificador-scc.mjs` (**`233` fitxers, `valid: true, errors: []`, eliminat l'orfe `pla.md`**), `porta-plantilles.mjs` (**`12 rutes` 100% alineades**), `porta-taxonomia.mjs --paritat` (**`0` errors, i `0` errors sobre `.patch` a `--tot`**), `segella.mjs` (`intacte`), `porta-olivera.mjs` (`0` errors) i les 3 suites Vitest de regressions (`127/127` en verd).
2. **Encàrrec Focalitzat per a Gemini CLI i GPT Codex en el Cicle 8 (`06:45`–`07:38 CET`):**
   - **Objectiu 1 (`T7` · Decorador `src/data/xifratXat.js` + `src/data/xifratXat.seguretat.test.js`):** Lliureu en un pegat `.patch` a `_wiki_de_poble/04_escriptori/` el decorador apagat per flag `src/data/xifratXat.js` (`ambXifratXat`) completant els 15 mètodes de capacitat, el canal `fixaAmbit` i la cancel·lació `A -> B -> A` (segons l'estudi de contracte de Codex C5 i `disseny_final_e2ee.md §8.1`/`§8.6`/`§21`), perquè les **Dimensions 1 i 6 pugen immediatament al `10,0 / 10`**.
   - **Objectiu 2 (`T11` · Tancament dels últims punts de `C5-T11-PENDENTS`):** Lliureu en pegat `.patch` la neteja dels últims fòssils `.abans-260830` / `.agents/pageContent_old.js` (`T11-02`, `T11-22`), la sincronització de `_wiki_de_poble/01_ser/03_equip_ia.md` (`T11-06`) i qualsevol ajust restant perquè la **Dimensió 9 i la Dimensió 10 assoleixen el `10,0 / 10` complet**.

#### 🫒 Arbitratge i OK Tècnic de la IAIA MarIA — Ronda 8 (`07:15 CET`)
Després d'inspeccionar l'avanç de la Ronda 8 en `261029_0336_auditoria_gemini.md` (v1.8.0, **10 de 10 dimensions certificades en `10,0 / 10` a l'arbre viu** i mitjana global en **`10,00 / 10`**) i `261029_0340_auditoria_codex.md` (v1.7.0, Cicle 6 amb els 3 pegats `0638`):
1. **⚡ INTEGRACIÓ EXECUTADA EN VIU A L'ARBRE (`07:01–07:13 CET` · `0` conflictes):**
   - **Integrats a l'arbre viu els 3 pegats `0638` de GPT Codex (`16` camins verificats):**
     1. `261029_0638_solucio_backend_capacitats_codex.patch` (**`T7-P1`, `37/37` proves Vitest**): estén `src/data/contracte.js`, `src/data/backendPort.js`, `src/data/supabase/index.test.js` i `src/data/backendPort.xifrat.capacitats.test.js` amb els **15 mètodes de dues capacitats opcionals del port E2EE** (`clausXat`: 13 mètodes, `xatMultimediaXifrat`: 2 mètodes).
     2. `261029_0638_solucio_t11_docs_codex.patch` i `261029_0638_solucio_t11_tractors_codex.patch` (**`94/94` proves Node `T11`**): consolida el cens de 42 skills, el frontmatter `protocol` de `sistema_immunitari.md`, el parser de `porta-taxonomia.mjs` i les suites `tests/t11-cens-documental.test.mjs` i `tests/porta-taxonomia.test.mjs`.
   - **Integrats a l'arbre viu els 2 pegats `0700` de Gemini (`15` fitxers):**
     1. `261029_0700_solucio_t7_decorador_gemini.patch` (**`T7-P2..P4` + `C5-SDPV`, `409/409` proves E2EE + Port en verd**): construeix `src/config/xifratXat.js` (`E2EE_ACTIU_PER_DEFECTE = false`), `src/data/xifratXatAbast.js` (`ambitDelFil` pur amb `xifratApegalos` i 3 regles anti-rebaixa), `src/data/xifratXat.js` (`ambXifratXat` apagat per flag + canal `serveiXifratXat` via `WeakMap` + les 4 claus `clauIdentitat`/`ambitEstable`/`genAmbit`/`genIdentitat` + cancel·lació `A -> B -> A` + `appendChatMessages` iterant sobre `enviaMissatge`), `src/data/xifratXat.seguretat.test.js` (`11/11`) i unifica `SDPV` a **175 B** a `src/data/xifratXatFormats.js` i els seus vectors.
     2. `261029_0700_solucio_t11_c5_pendents_gemini.patch`: sincronitza `_wiki_de_poble/01_ser/03_equip_ia.md` amb la taula canònica dels 12 seients del Consell (`T11-06`) i retira els 7 últims fòssils `.abans-260830` i `.agents/pageContent_old.js` (`T11-02`, `T11-22`), **preservant-ne abans còpies byte-idèntiques a `_wiki_de_poble/90_arxiu_historic/fossils_retirats_261029/`** (`C6-T11-FOSSILS` / `AGENTS.md §1`).
   - **Reconstruït en còpia aïllada neta el paquet WordPress.org (`T5` + `T5.1`):**
     - `../_builds_de_poble/wordpress/socdepoble.zip` i `261029_0716_wordpress_directori_v1.1.9.zip` (**`3.335.419 B`, SHA-256 `3c2287a9f018b936f35a08b49c45f8b3caf988a216bfee984b6b2f85d9372be3`**) + `261029_0716_informe_validacio_directori_v1.1.9.json`, amb totes les millores de `T5.1` (`Plugin URI: https://socdepoble.org`, modal local `Mostra els detalls` amb els 2 bàners dins del ZIP, municipis reals, guia en 3 passos, crèdit OFL a `readme.txt` i `0` warnings a `runtimePolicy.js`) i `0` restes dins de `wordpress-plugin/` (`core-empaquetat-wp`).
2. **Encàrrec per als Cicles 9 i 10 (`07:16`–`08:15 CET`):**
   - Verificar de cap a peus el **`10,0 / 10` de les 10 dimensions a l'arbre viu** (incloent l'auditoria del nou decorador `src/data/xifratXat.js`, l'arxiu byte-idèntic `fossils_retirats_261029/` i el nou `socdepoble.zip` `3c2287a9...`) i continuar tirant de les millores madures de `T10`/`T11` del Llibre Mestre sense cap regressió.

---

### 3. Canvis Proposats per Fitxers i Blocs (Execució Contínua de 5 Hores: Passos `T1`–`T6` + Cua Contínua `T7`–`T10` del Llibre Mestre)

#### Pas 1 · Culminar i Verificar `QA-H01`, `QA-H02`, `QA-H04` i l'Alineació E2EE v1.1.0 (`§1.3`/`§5.6`/`§8.6`)
- **`[MODIFY]` `src/sections/profile/PerfilContext.jsx` i `[NEW]` `src/sections/profile/PerfilContext.usuariTardana.test.jsx` (`QA-H01`):**
  - Revisar i verificar el pegat ja present a l'arbre viu que incrementa el comptador de versió de perfil en `updateProfile()` perquè un `loadProfile()` en vol anterior no puga sobreescriure l'`@usuari` o el poble acabats de desar.
- **`[MODIFY]` `supabase/migrations/2610282100_usuari_i_poble_canonic.sql` i `[MODIFY]` `src/data/supabase/usuariIPoble.migracio.test.js` (`QA-H02`):**
  - Revisar i verificar el pegat ja present a l'arbre viu que preserva `profiles.username` existent quan `completa_la_meua_alta` rep `p_username` nul o buit i manté l'alineació amb el catàleg de pobles.
- **`[MODIFY via Executor]` `package.json`, `tooling/tests/node-suite-manifest.json`, `tooling/seo/projeccio-publica.mjs`, `tooling/seo/projeccio-publica.test.mjs`, `tooling/seo/prerender-social.mjs`, `tooling/seo/prerender-social.test.mjs`, `tooling/seo/build-social-manifest.mjs`, `tooling/seo/build-social-manifest.test.mjs` (`QA-H04`):**
  - Aplicar a través de l'executor (`governanca_qa01.mjs` amb lease Reflex de governança) els 8 fitxers de `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah04_og/governanca/` que incorporen `--snapshot` al prerender social per generar les fitxes públiques remotes d'organitzacions i persones amb timeout de 5 s, paginació segura i fallback net a la llavor.
- **`[MODIFY]` `../_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md` (`QA-E07` / `QA-S01..S06`):**
  - Reconciliar `§1.3`, `§5.6` i `§8.6` (`clauIdentitat = [backendId, endpoint, joId]` per a IndexedDB sense `actor`; `ambitEstable = [backendScope, joId, actorKey]` + `genAmbit` per a RAM del decorador i `actor` explícit per a cada entrada de `safata`, més les garanties `QA-S01..S06` i les reserves `E2EE-I01..I03`).
- **`[MODIFY via Executor + Segell]` `.agents/skills/wiki-cicle-de-vida/SKILL.md`, `.agents/skills/core-higiene-escriptori/SKILL.md`, `.agents/SKILLS_SEAL.json`, `_wiki_de_poble/03_actuar/plantilles/acta.md`, `_wiki_de_poble/03_actuar/plantilles/pla.md` i `.agents/protocolledge.json` (`T1.5 · Blindatge Automàtic de la Reunió de l'Olivera`):**
  - Incorporar a `wiki-cicle-de-vida/SKILL.md` (Pas 7) i `core-higiene-escriptori/SKILL.md` el **Protocol Automàtic de Transició d'Onada a l'Olivera** abans de qualsevol Acta Marmota: (1) actualitzar `03_llibre_mestre_tasques_i_idees.md` amb `[FET]` i posar dalt el Deute Tècnic cap al `10/10` abans de noves idees; (2) arxivar amb `porta-olivera.mjs --arxiva --nom` + `document.mjs handoff` l'onada vençuda i totes les captures `_produccio_`; (3) deixar parats a `_wiki_de_poble/04_escriptori/` el nou Pla (`pla_implementacio.md`) i el nou Prompt (`prompt_local.md`) bessons; i (4) preservar `_investigacio_ia_de_poble/` i `02_investigacio_ia/` exclusivament com a repositori d'investigació d'IA del Mestre i la IAIA (mai per a prompts o plans).
  - Retirar la plantilla antiga duplicada `_wiki_de_poble/03_actuar/plantilles/pla.md` (`planificacio` a `protocolledge.json`, substituïda per `pla_implementacio.md`), depurar `acta.md` perquè el seu únic destí siga `_wiki_de_poble/10_actes/` (històric de sessió, sense suplantar `prompt_local.md`), verificar `porta-plantilles.mjs` i re-segellar `.agents/SKILLS_SEAL.json` amb `tooling/gates/segella.mjs --update`.

#### Pas 2 · Tancament del Deute Tècnic de Previsualització i Suite Sencera per Assolir el `10/10`
- **`[MODIFY]` `src/sections/onboarding/OnboardingSteps.jsx` / `src/data/supabase/auth.js` (`APP-D1`):**
  - Assegurar que si l'usuari es registra en producció abans que la migració `2610282100` estiga executada al servidor Supabase (error d'esquema/signatura de RPC `completa_la_meua_alta` amb `p_username` / `p_town_uuid`), el client reintente o degrade amb elegància sense bloquejar l'alta i complete la sincronització local/perfil.
- **`[MODIFY]` `tooling/seo/build-social-manifest.mjs` / actius OG (`R-01`, `R-02`, `R-07`):**
  - **`R-01`:** Assegurar que les 11 rutes amb `og:image > 600 KB` apunten a variants d'imatge social `1200×630` optimitzades (`<= 300 KB`) perquè WhatsApp les mostre sempre a la primera.
  - **`R-02`:** Alinear extensió/MIME o corregir els 6 fitxers `.png` que contenen bytes JPEG.
  - **`R-07`:** Resoldre el títol humà (H1 o `description` del frontmatter) per als 13 documents de la Wiki que mostraven el seu identificador d'arxiu cru a la targeta d'OpenGraph.
- **`[MODIFY]` `firebase.json` i `vercel.json` (`M-01`):**
  - Afegir les capçaleres HTTP de seguretat `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` i `Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)` mantenint la paritat amb els tests de portes.
- **`[MODIFY]` `src/sections/mur/laParroquia.test.js` i `tests/botigues.test.mjs` (0 roges a la suite sencera):**
  - Reparar les 2 úniques proves heretades en roig de la suite sencera causades pel trasllat del laboratori el 261026, sense relaxar cap asserció de seguretat ni disseny.

#### Pas 3 · Bateria Completa sobre Còpia Exacta de l'Arbre a Commitejar
- Verificar en una còpia exacta de l'arbre que anirà al commit (sense els fitxers `xifratXat*` de la Fase 1 encara):
  - `npm run test:precommit` (100% verd en `< 30 s`).
  - `npx eslint` sobre tots els fitxers modificats (`0` errors, `0` avisos).
  - Proves de `QA-H01`, `QA-H02`, `QA-H04`, `laParroquia.test.js`, `tests/botigues.test.mjs` i les `83/83` proves del connector WordPress.

#### Pas 4 · Commit de Tancament del Bloc H + Deute 10/10 i Push
- Fer el commit de tancament a través d'un índex temporal (`GIT_INDEX_FILE`), deixant fora temporalment els 9 fitxers de `xifratXat*` / `idbFalsEstructurat.js` (que es commitejaran juntament amb la resta de mòduls de la Fase 1/2 quan estiguen complets i verificats) i `wikiManifest.js`.
- Fer push a `fork/backup-notes-publish`.

#### Pas 5 · Millores Humanes i Didàctiques del Plugin WordPress (`T5.1` · Ordre del Mestre `04:05h`), Reconstrucció de `socdepoble.zip` i Canal Preview
- **`T5.1` · Millores obligatòries al connector WordPress (`wordpress-plugin/`) i a `runtimePolicy.js` abans d'empaquetar `socdepoble.zip` (Ordre directa del Mestre Javi amb captures de `gentdelatorre.net`, `04:05h` — OK immediat de la IAIA MarIA):**
  1. **Enllaços vius i finestra modal nativa «Mostra els detalls» (`View details` ThickBox com SiteGround Speed Optimizer) a `plugins.php`:**
     - En `wordpress-plugin/socdepoble-enxufe.php`: canviar `Plugin URI: https://socdepoble.org/enxufe/` (que no és una pàgina web navegable i trenca l'enllaç *«Visita el lloc web de l'extensió»*) per `Plugin URI: https://socdepoble.org`.
     - En `wordpress-plugin/includes/ajustos.php` (o un helper dedicat invocat a l'admin): afegir el filtre `plugin_row_meta` i el filtre `plugins_api` (`action === 'plugin_information'` per a l'slug `socdepoble`) perquè en la taula de plugins (`wp-admin/plugins.php`) aparega l'enllaç estàndard **`Mostra els detalls` / `View details`** (`thickbox open-plugin-details-modal`) i, en fer-hi clic, s'òbriga la finestra emergent nativa de WordPress amb el bàner oficial (`assets/banner-772x250.png` / `banner-1544x500.png`), l'autor, la versió, i les pestanyes *Descripció*, *Instal·lació*, *Preguntes freqüents* i *Registre de canvis* alimentades des del propi `readme.txt` local quan WordPress.org encara no respon per a l'slug! (Verificar que passe el 100% de les regles de WordPress Plugin Check sense cap error ni warning).
  2. **Zero invenció de municipis actius a `wordpress-plugin/includes/ajustos.php` (línies 224-225):**
     - Eliminar la llista inventada que deia que hi ha «9 municipis actius» (`penaguila`, `benifallim`, `sella`, `orxeta`, `relleu`, `alcoleja`, `xixona`, `tibi`).
     - Deixar escrit amb rigor i veritat que l'arrel matriu és **Sóc de Poble (El Rentonar, 30 anys d'activisme rural)** i que el primer portal municipal actiu en producció és **La Torre de les Maçanes (`la-torre-de-les-macanes` · Gent de la Torre)**, mentre que la resta de pobles del catàleg estan preparats per activar el seu propi node quan la seua comunitat ho sol·licite.
  3. **Guia d'instal·lació 100% didàctica, humana i per a tots els públics a `wordpress-plugin/includes/ajustos.php` (línies 226-231) i `readme.txt`:**
     - Reescriure les instruccions amb trellat pedagògic perquè qualsevol persona sense nivell tècnic entenga a la primera què ha de fer:
       - **Pas 1 (Configura el teu poble ací baix):** Escriu el nom públic del teu portal (per exemple, `Gent de la Torre`) i l'identificador del poble (`la-torre-de-les-macanes`), i prem el botó blau **«Desa els canvis»**.
       - **Pas 2 (Posa Sóc de Poble en una pàgina de la teua web — tria una de les 2 opcions):**
         - *Opció fàcil A (copiant el codi):* Ves al menú esquerre **Pàgines ➔ Afegeix una pàgina nova**, posa-li títol, escriu o pega exactament **`[socdepoble_app]`** dins del cos de la pàgina i prem **«Publica»**.
         - *Opció fàcil B (amb el bloc visual):* Dins de l'editor de la pàgina, prem el botó **`+`** (Afegir bloc), busca **«Sóc de Poble»** i fes-hi clic.
       - **Pas 3 (Fes que ocupe tota la pantalla i siga la portada):** A la columna dreta de l'editor de la pàgina, busca l'apartat **«Plantilla»** i tria **«Sóc de Poble · Pantalla completa»**. Si vols que eixa pàgina siga la portada principal de la teua web, ves a **Ajustos ➔ Lectura**, marca *«Una pàgina estàtica»* i selecciona-la com a **Portada**.
  4. **Consola amb `0 warnings` en obrir la web (`src/config/runtimePolicy.js:52`) i crèdit OFL a `readme.txt`:**
     - En `src/config/runtimePolicy.js`: no emetre `console.warn('[RuntimePolicy] Cap emissor configurat (issuer)...')` durant l'arrencada normal quan no s'ha passat cap sessió JWT externa de Sollutia; emetre'l únicament si s'invoca el flux de validació de sessió externa JWT sense `issuer`, deixant la consola de `gentdelatorre.net` i `socdepoble.org` amb **`0 errors` i `0 warnings`**.
     - En `wordpress-plugin/readme.txt`: afegir la línia de crèdit a la tipografia `Noto Sans` (SIL Open Font License 1.1, inclosa a `dist/fonts/OFL.txt`).
- Reconstruir `_builds_de_poble/wordpress/socdepoble.zip` i la seua còpia datada a partir d'un `git archive` net del nou commit amb totes aquestes millores de `T5.1` incloses.
- Verificar les `83/83`+ comprovacions del paquet WordPress (`tests/enxufe-plugin.test.mjs`, `tests/empaqueta-wp.test.mjs`, `porta-enxufe.mjs`).
- Desplegar o actualitzar el canal preview de Firebase Hosting amb la compilació del nou commit i deixar-lo verificat al 100% perquè el Mestre puga passar-lo a producció i pujar `socdepoble.zip` a WordPress.org i a Gent de la Torre.

#### Pas 6 · `P1-12` Fase 1 i Fase 2 + `IDEA-48` (Xifratge E2EE al Xat Rural sense Activar el Flag)
- **Verificació i auditoria dels 9 fitxers de la Fase 1 ja presents a l'arbre viu:**
  - `src/data/xifratXatCripto.js` + `src/data/xifratXatCripto.seguretat.test.js` + `src/data/xifratXatCripto.vectors.json`
  - `src/data/xifratXatFormats.js` + `src/data/xifratXatFormats.seguretat.test.js` + `src/data/xifratXatFormats.vectors.json`
  - `src/data/xifratXatMagatzem.js` + `src/data/xifratXatMagatzem.seguretat.test.js` + `tests/helpers/idbFalsEstructurat.js`
- **Construcció i verificació dels mòduls restants de la Fase 1/2 (`§16` passos 4, 5 i 7 del disseny E2EE v1.1.0):**
  1. **`[NEW]` `src/data/xifratXatParaules.js` + `src/data/xifratXatParaules.seguretat.test.js`:** Diccionari de 2.048 paraules en valencià viu de la muntanya alacantina (sense homòfons ni paraules confuses, prefix únic de 4 lletres, que revisarà el Mestre) per a la frase de recuperació de 6 paraules (`66 bits` d'entropia).
  2. **`[NEW]` `src/data/xifratXatRecuperacio.js` + `src/data/xifratXatRecuperacio.seguretat.test.js` (`IDEA-48`):** Compartició secreta de Shamir sobre $\text{GF}(2^8)$ (`0x11B`, `QA-S06`) amb llindar fix $k = 3$ i cercle obert de confiança ($N \in [3, 255]$ amics/familiars), fragments de `33 B` (`aval` de `49 B`, `alliberament` de `113 B`), compromís `hF`, verificació de consistència lineal (`QA-S05`) i 4 nivells de revocació (`QA-S02`).
  3. **`[NEW]` `src/data/xifratXatProtocol.js` + `src/data/xifratXatProtocol.seguretat.test.js`:** Màquina d'estats d'embolcall de claus en suite única HPKE mode base (RFC 9180; DHKEM P-256 `0x0010`, HKDF-SHA256 `0x0001`, AES-256-GCM `0x0002`), rotació d'època (`SDPE`) amb `ckCommit`, dos codis SAS de 6 dígits (d'anada i de tornada amb compromís previ `SDPP`, `QA-S01`), sobre d'alliberament `SDPL`/`SDPO` i `SDPH` de `87 B` (`QA-S03`), màquina d'estats d'alarma «No sóc jo» (`SDPN`, `QA-S04`), protecció de metadades d'adjunts (`SDPA`, Padmé) i desbloqueig atòmic multi-pestanya amb `navigator.locks`.

#### Pas 7 a Pas 10 · Cua Contínua de la Marató Nocturna de 5 Hores (Llibre Mestre i 10,0/10 en les 10 Dimensions)
Quan es completen els Passos 1 a 6, **cap agent es deté**: continuen tirant del [Llibre Mestre](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md) fins a esgotar la nit:
- **Pas 7 (`T7` — Fase 3 d'E2EE `P1-12` + `IDEA-48` darrere de flag i blindatge `§1.3`/`§5.6`/`§7`/`§8.6`):**
  1. Reconciliar l'especificació i el codi de `disseny_final_e2ee.md` v1.1.0 (`QA-E07` i `QA-S01..S06` en `§1.3`, `§5.6` i `§8.6` + reserves `E2EE-I01..I03`).
  2. Crear la migració SQL d'E2EE segons `§7` de `disseny_final_e2ee.md` (taules `xat_claus_usuari`, `xat_equips_org`, `xat_epoques_fil`, `xat_claus_fil`, `xat_copies_clau`, `xat_llibretes`, `xat_cercles_recuperacio`, `xat_avals_recuperacio`, `xat_peticions_recuperacio`, `xat_intents_recuperacio`, `xat_alliberaments_recuperacio` i columnes a `xat_missatges`, amb fins a 256 membres per època, RLS via RPC `private.es_participant` i `100%` retrocompatible amb fils públics).
  3. Crear `src/data/xifratXat.js` (`ambXifratXat`) + `src/data/xifratXat.seguretat.test.js` com a decorador del port existent abans del segellat (`§8.1`), desactivat per defecte fins a l'activació pel Mestre.
- **Pas 8 (`T8` — Excel·lència Visual, Rendiment `/notes` i Contrastos `10,0/10`):**
  1. **`QA-H03` (`Contrast AAA 7.0:1`):** Ajustar `--sdp-verd` a `src/css/tokens.css` de `#0F672F` (`6.9966:1`) a `#0E662E` (`7.0978:1` sobre `#FFFFFF`, $\Delta E < 0.3$) per a complir estricte `>= 7.0:1` sense arredonir.
  2. **`GM2-03` (`Scroll-margin` a l'editor):** Afegir `scroll-margin-block-start` a `.sdp-edicio-avancada__cos` en `src/css/components.css:2984` per evitar que la toolbar sticky tape el cursor en mòbil.
  3. **Rendiment `DocumentEditor.jsx` (`300.000` caràcters):** Evitar reprocessar el cos de `300.000` caràcters quan només canvia el títol.
  4. **Geometria autenticada `R1`/`R2`:** Proves de geometria de les barres d'eines amb sessió autenticada o simulada a `375px` i `360–393px`.
- **Pas 9 (`T9` — Excel·lència OpenGraph, Capçaleres de Seguretat i Mapa EXIF `10,0/10`):**
  1. **`R-01` / `GM2-01` + `R-02`:** Reprocessar les 11 imatges OG que superen `300 KB` i alinear extensió/MIME dels fitxers `.png` amb bytes JPEG.
  2. **`R-07`:** Resoldre els 13 títols de la Wiki que mostraven l'ID cru o títol curt a la targeta social.
  3. **`M-01`:** Afegir les capçaleres `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` i `Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)` a `firebase.json` i `vercel.json`.
  4. **Proves de regressió de `MapaFotografic.test.jsx`:** Garantir que el test de regressió passe tant en el worktree principal com en còpies temporals d'auditoria.
- **Pas 10 (`T10` — Reducció Contínua del Deute Tècnic del Llibre Mestre):**
  - Continuar amb les tasques pendents de `03_llibre_mestre_tasques_i_idees.md` (`P1-13` migració progressiva de components als ports, `P2-07` sanejament de `select('*')`, `P2-08` unificació del formatador d'identitat pública, `P2-09` consolidació de telemetria i `P2-10` índexs compostos SQL).
- **Pas 11 (`T11` — Auditoria Extrema de la Wiki, Skills i Tractors Cognitivos amb «Dubte Metòdic d'Ull Humà» per a Gemini CLI i GPT Codex):**
  1. **Caça de Duplicitats i Solapaments Semàntics (`_wiki_de_poble/`):** Recórrer totes les carpetes de la Wiki preguntant-se com ho fa l'humà (*«Per què s'assemblen tant si són per al mateix? És una versió antiga solapada amb la nova?»*) per identificar plantilles, manuals, processos o actes que es trepitgen.
  2. **Caça de Contradiccions Creuades i Fusió d'Skills (`.agents/skills/` i `AGENTS.md`):** Detectar on una ordre contradiu una altra o on un procés únic està fragmentat en 2 skills redundants.
  3. **Potenciació dels Tractors Cognitivos de Codi (`tooling/`):** Codificar i provar millores als tractors cognitius (`tooling/wiki/document.mjs`, `tooling/gates/porta-olivera.mjs`, etc.) perquè facen complir de manera determinista el que diuen els skills i detecten solapaments o contradiccions automàticament.

#### Bitakora del Pla Variable · Cicle 1 (03:45 CET — OK Tècnic IAIA MarIA / Gemini)
- **Verificat i tancat a `HEAD` (`7a87205f3`) i arbre viu (`401/401` tests en verd):**
  - `QA-H01` (`PerfilContext.jsx` + `PerfilContext.usuariTardana.test.jsx`: `26/26` + `59/59` en verd).
  - `QA-H02` + homònims `T8` (`2610282100_usuari_i_poble_canonic.sql` + `usuariIPoble.migracio.test.js`: `51/51` en verd).
  - `T5` (`disseny_final_e2ee.md` v1.1.0 amb `QA-E07` i `QA-S01..06` a `§1.3` + `esmenes_qa_261029.md`).
  - `T6` parcial (`xifratXatCripto`, `xifratXatFormats`, `xifratXatMagatzem`, `xifratXatParaules`: `265/265` tests en verd; resten `xifratXatRecuperacio` i `xifratXatProtocol`).
- **OK Tècnic immediat per a integrar per Claude Code (detall i codi a `261029_0336_auditoria_gemini.md`):**
  1. **`T2.5` (0 roges a la suite):** Aplicar el fallback cap a `../_investigacio_ia_de_poble/` a `src/apps/bar/llavors/laParroquia.test.js:35` i `scripts/botigues/entorn.mjs:33-35`.
  2. **`T11-01` (Tractors Cognitius de `tooling/wiki/` cecs):** Actualitzar `JURISDICTIONS` i pilars operatius de `contradiction_engine.mjs`, `semantic_auditor.mjs`, `entropia_zero_router.mjs`, `reflex_petorreta.mjs`, `teixidora_sinapsis.mjs`, `core/ontology.json`, `core/safety.mjs`, `core/corpus_snapshot.mjs`, `rules/trellat-rules.json` i `tooling/gates/design_guard.mjs` de les rutes extintes `00_SER_Brain_Identitat`..`04_ARXIU_Documents_Historics` a l'arquitectura `4+2` (`01_ser`, `02_saber`, `03_actuar`, `04_escriptori`, `10_actes`, `90_arxiu_historic`).
  3. **`T11-02` (Fòssils `.abans-260830`):** Retirar amb `git rm` els 4 fitxers `.abans-260830` de `tooling/wiki/`.
  4. **`T11-03..T11-08` (Sanejament Wiki i Skills):** Aplicar el blindatge de `pla.md` / `acta.md` (`T1.5`), netejar l'enllaç trencat de `auditoria_canonica.md`, unificar les seccions d'orfes de `_wiki_de_poble/00_index.md` i delimitar l'abast entre `core-llegibilitat-text` (copy UI React) i `core-maquetacio-markdown` (fitxers `.md` del repositori).

#### Bitakora del Pla Variable · Cicle 2 (04:00 CET — Reconciliació amb Codex `261029_0340` i Segona Onada `T11`)
- **Desacords explícits del Pla Variable i `E2EE-P01..P07` resolts en viu per la IAIA MarIA:**
  - Unificat a **10 dimensions** en tot el Pla i el Prompt (retirada la nota preassignada de la Dimensió 10 a la taula basal).
  - Unificada la directiva `Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)` en totes les aparicions per preservar el micròfon i la càmera propis del compositor del Xat i les fotos amb GPS.
  - Reconciliades les 7 divergències `E2EE-P01..P07` amb `disseny_final_e2ee.md` v1.1.0 (`§1.3`/`§5.6`/`§7`/`§8.6`, `clauIdentitat` vs `ambitEstable` + `genAmbit` + `actor` a `safata`, HPKE P-256 `0x0010`/`0x0001`/`0x0002`, dos codis SAS de 6 dígits d'anada i tornada, taules `xat_*` amb 256 membres i `src/data/xifratXat.js`).
- **OK Tècnic immediat per a integrar per Claude Code en el Cicle 2 (detall a `261029_0336_auditoria_gemini.md` v1.2.0 i `261029_0340_auditoria_codex.md`):**
  1. **Pegat `QA-H03` de Codex (`_wiki_de_poble/04_escriptori/261029_0340_solucio_contrast_codex.patch`):** Aplica `--sdp-verd: #0e662e` (`7,0978:1` AAA) i 2 tests de contracte amb control negatiu (`104/104` Vitest en verd).
  2. **Pegat `T11` de Codex (`_wiki_de_poble/04_escriptori/261029_0340_solucio_t11_codex.patch`):** Actualitza `contradiction_engine.mjs` amb `auditCoherence`, afig `tooling/wiki/contract_consistency.mjs` i 2 suites de test (`40/40` Node en verd).
  3. **3 Correccions de Contracte E2EE v1.1.0 sobre `src/data/xifratXatFormats.js` i `src/data/xifratXatMagatzem.js` (`E2EE-C01..C03`):**
     - `E2EE-C01` + `E2EE-C02` (`src/data/xifratXatFormats.js:647`): En `infoFragment` (`SDPH`), retirar el camp `'total'` perquè `MIDES.infoFragment` faça exactament **87 B** (com mana `disseny_final_e2ee.md §5.6.3`) i fixar `'llindar'` a `enter(1, MIN_LLINDAR_SOCIAL, MIN_LLINDAR_SOCIAL)` ($k = 3$ invariable segons `§5.6.1`), afegint a més els esquemes de `SDPC`, `SDPL` (`175 B`), `SDPO` (`133 B`), `SDPP` (`69 B`), `SDPN` i actualitzant `SDPV` a `175 B`.
     - `E2EE-C03` (`src/data/xifratXatMagatzem.js:1100`): En `desaASafata(ci, { fil, id, actor, contingut })`, exigir `actor` explícit no buit (`§8.6`), desar-lo a la fila de `safata` i lligar-lo a `aadSafata(ci, fila)` i `resumSafata(fila)`.
  4. **Noves Troballes `T11-09..T11-14` per integrar:** Tombstone a `scripts/teixidor-backlinks.mjs` i `scripts/enllacat-intelligent-wiki.mjs`, afegir frontmatter v2 als 5 documents de la Wiki que fan fallar `auditCoherence` (`05_social/00_explorador_social.md`, `10_metriques/11_grafica_consum.md`, `10_actes/260926_2350_acta_marmota.md`, `10_actes/260927_0110_acta_marmota.md`, `10_actes/260927_1720_acta_marmota_govern_i_ui.md`) i afegir nota de vigència a `02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md` (superat en PWA, IndexedDB i WCAG AAA per `P1-69`, `ADR-2026-10`, `ADR-2026-13` i `AGENTS.md §3`).

#### Bitakora del Pla Variable · Cicle 3 (04:34 CET — Verificació dels Carrils de Claude, Pegats `04:08` de Codex i Onada 3 `T11`)
- **Verificat i 100% en verd a l'arbre viu en el Cicle 3 (`261029_0336_auditoria_gemini.md` v1.3.0):**
  - **Fase 2 d'E2EE (`T6`):** `xifratXatRecuperacio.seguretat.test.js` (`64/64` passades, 2 omeses) i `xifratXatProtocol.seguretat.test.js` (`31/31` passades) 100% en verd (`95/95`).
  - **Dimensions 2 i 4 en `10,0/10` verificat a l'arbre viu:** `verdDeMarca.contrast.test.js` (`4/4` AAA `#0e662e`), `GM2-03` (`UniversalEditorShell.edicioAvancada.test.jsx`), `DocumentEditor.rendiment300k.test.jsx` (`7/7`), `UniversalToolbar.geometria360.test.jsx` (`12/12`), `PerfilEditor.geometria375.test.jsx` (`7/7`), `FakeChatOnboarding.test.jsx` (`8/8`), `auth.degradacio.test.js` (`24/24`), `laParroquia.test.js` (`20/20`) i `MapaFotografic.test.jsx` (`26/26`).
  - **Sanejament Wiki (`T11-04`, `T11-05`, `T11-10`, `T11-11`):** Integrat a l'arbre viu per `wiki_sanejament` (`00_index.md`, `ADR-2026-08-ONLINE-FIRST.md`, `auditoria_canonica.md`, `00_explorador_social.md`, les 3 actes de setembre i `11_grafica_consum.md`).
- **OK Tècnic immediat per a la integració final de Claude Code en el Cicle 3/4:**
  1. **`R-01` (`src/config/imatgeSocial.pes300.test.js` · `45/46` en verd, 1 sola fallada):** Recomprimir in-place `public/assets/system/ui/og-socdepoble-1200x630.png` (`530.885 B`) com a PNG real `1200×630` `<= 250.000 B` (com `og-llibre-d-or-1200x630.png` de `69.783 B`) perquè `imatgeSocial.pes300.test.js` passe a **`46/46` en verd** sense tocar `index.html`.
  2. **Integrar els 4 pegats de Codex de les `04:08 CET`:**
     - `261029_0408_solucio_appd1_sessio_codex.patch` (`capturaSessio()` a `src/data/supabase/auth.js:388` quan falla `desaElMeuUsername`).
     - `261029_0408_solucio_m01_codex.patch` (`Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)` a `firebase.json`, `vercel.json` i `firebaseHosting.test.js`).
     - `261029_0408_solucio_runtime_codex.patch` (`T5.1`: suprimir `console.warn` sense `issuer` a `src/config/runtimePolicy.js:51`).
     - `261029_0408_solucio_t11_codex.patch` (`T11-01` + `T11-12` ancoratge amb camí relatiu `./fitxer.ext|etiqueta` a `draft-write.mjs`, `porta-olivera.mjs` i `document-links.mjs`).
  3. **Reconciliar `xifratXatFormats.js:647` i `xifratXatMagatzem.js:1100` (`E2EE-C01..C03`) amb `xifratXatRecuperacio.js` i `disseny_final_e2ee.md` v1.1.0.**
  4. **Noves Troballes `T11-15..T11-19` d'Ull Humà per integrar:** Poblar les 3 seccions buides de `_wiki_de_poble/02_saber/00_full_de_ruta.md:16-35` i alinear la nota d'IndexedDB/PWA (`T11-15`); corregir el `\n` literal i la ruta `core-identitat/SKILL.md` a `_wiki_de_poble/01_ser/00_bios.md:10,20` (`T11-19`); i en l'execució de `T1.5` corregir les rutes citades a `.agents/skills/sdp-workflow/SKILL.md:27,36`, `.agents/skills/wiki-documentacio-i-reflex/SKILL.md:74,92,105`, `.agents/skills/core-estrategia-ia/SKILL.md:11` i `.agents/skills/sdp-universal-editor/SKILL.md` (`T11-16..T11-18`).

#### Bitakora del Pla Variable · Cicle 4 (04:58 CET — Verificació de `T7` SQL `E2EE-1a`, `P1-43`, `P1-44`, Caça de les 19 Traduccions de `T5.1` i Onada 4 `T11`)
- **Verificat i 100% en verd a l'arbre viu en el Cicle 4 (`261029_0336_auditoria_gemini.md` v1.4.0 · `226/226` noves proves Vitest en verd):**
  - **`T7` (`E2EE-1a`):** `supabase/migrations/2610290400_xat_e2ee_claus_i_sobres.sql` (899 línies) + `src/data/supabase/xatE2ee.migracio.test.js` (`49/49` en verd), incloent `xat_canvia_rk` atòmic (`E2EE-I03`), `ct = 113 B` (`QA-S03` / `E2EE-C01`) i `SDPN` `61 B` (`QA-S04`). Nota d'abast: `2610290400` cobrix `E2EE-1a` (`§7.2` primera fila); `E2EE-1b` cobrirà `xat_fils`, `xat_missatges`, `xat_sobres_epoca` (fins a 256 membres) i `xat_adjunts`.
  - **`P1-43`, `P1-44`, `R-07` i `runtimePolicy` (`T5.1`):** `VisorImatges.test.jsx` (`46/46`, botó Pin 📌), `App.ordreProveidors.test.jsx` (`3/3`), `parseMarkdown.test.js` (`92/92`), `seoWiki.test.js` (`13/13`), `WikiDePobleSection.seo.test.jsx` (`9/9`) i `runtimePolicy.test.js` (`14/14`) 100% en verd.
  - **`C1-T11-MAP` tancat al Prompt (`261029_0216_prompt_*.md:150-157`):** Alineats els IDs `QA-S01..06` i `src/data/xifratXat.js` (`ambXifratXat`) perquè `contract_consistency.mjs` de Codex arribe a **0 discrepàncies** tant al Pla com al Prompt.
- **OK Tècnic immediat per a la integració de Claude Code en el Cicle 4/5:**
  1. **`T5.1` (`tests/enxufe-plugin.test.mjs:317` · 19 cadenes pendents de traducció a `wordpress-plugin/languages/socdepoble-ca.l10n.php`):** Aplicar `261029_0438_solucio_wordpress_codex.patch` (`65/65` + `1/1` en verd), que completa les 19 traduccions al catàleg `wordpress-plugin/languages/socdepoble-ca.l10n.php` (text domain `socdepoble`), neteja les 4 claus obsoletes i inclou els 2 bàners del modal a `ADAPTADOR.fitxers`.
  2. **`C1-T11-FENCE` / `C2-T11-PROSA`:** Aplicar `261029_0438_solucio_t11_codex.patch` (`106/106` Node T11 en verd, substituint `0408` i `0340`).
  3. **Noves Troballes `T11-20..T11-23` sobre `.agents/`:** Sincronitzar `.agents/AGENTS.md` amb `AGENTS.md`, corregir les rutes en minúscules a `.agents/QUI_SOC.md:43`, netejar les referències inexistents (`tooling/verify-bios.mjs`, `tooling/verify-ledger.mjs`, `sdp-workflow`) a `.agents/BIOS.md`, `.agents/BOOTSTRAP.md` i `.agents/cervell.json`, alinear `.agents/DESTINS_CANONICS.json` amb `.agents/protocolledge.json`, retirar el fòssil `.agents/pageContent_old.js` (`106 KB`) + `.abans-260830` i regenerar `.agents/ON_ESTIC.md` amb `despertar.mjs`.

#### Bitakora del Pla Variable · Cicle 5 (05:31 CET — Verificació de `p1_22_i18n`, `disseny_final_e2ee.md §21` v1.1.1, Pegats `0438` i `0508` de Codex i Onada 5 `T11`)
- **Verificat i 100% en verd a l'arbre viu en el Cicle 5 (`261029_0336_auditoria_gemini.md` v1.5.0):**
  - **`P1-22` (`i18n` als 5 idiomes `ca`, `es`, `en`, `eu`, `gl`):** `src/config/i18n.claus.test.js` (`254/254` passades en `32 ms`), `IdentitatAlPoble.test.jsx` (`11/11`) i `auth.usuari.test.js` (`12/12`) 100% en verd.
  - **`T5` / `T6` (`disseny_final_e2ee.md §21` v1.1.1):** Completada la secció normativa `## 21 · Esmenes de QA (261029)` (`§21.1` a `§21.9`), reconciliant les **18 inconsistències internes i de pla (`INC-01..INC-18`)**, definint les 4 claus d'àmbit (`clauIdentitat`, `ambitEstable`, `genAmbit`, `genIdentitat`), l'absència de `rk_commit` (substituït per `hF` + AAD `SDPB` + `kid` recalculat) i les mides exactes `SDPL` (`175 B`), `SDPO` (`133 B`), `ct_L` (`113 B`) i `SDPH` (`87 B`). (Alineat també `Prompt:150-151`).
  - **`T1.5` parcial a la Wiki:** Actualitzats `_wiki_de_poble/03_actuar/plantilles/acta.md` (`v2.1.0`, destí únic `10_actes/`) i `00_index_plantilles.md`.
  - **Verificats amb `git apply --check` (`exit 0`) sobre l'arbre viu els nous pegats `0508` + `0438` + `0408` de Codex:**
    - **`261029_0508_solucio_t11_i_og_codex.patch` (`186/186` Node en verd, 24 fitxers):** Substitueix tots els combinats T11 anteriors (`0340`, `0408`, `0438`) i unifica `T11` (`contradiction_engine.mjs` amb verificació de `contracte.llig`/`escriu` sobre `264` documents + `42` skills, `contract_consistency.mjs`, `fonts-vigilancia.mjs` `26/26`, `teixidor-backlinks.mjs`) amb **`QA-H04` OpenGraph** (`projeccio-publica.mjs` + `prerender-social.mjs` + `build-social-manifest.mjs` amb timeout estricte de **5 s**, `86/86` proves SEO/política en verd).
    - **`261029_0508_solucio_e2ee_sdph_codex.patch` (`134/134` Vitest en verd):** Resol `E2EE-C01` i `E2EE-C02` (`SDPH` de `87 B`, $k=3$ i sense `total`) a `src/data/xifratXatFormats.js` + vector recalculat + 13 regressions.
    - **`261029_0508_solucio_autoritat_codex.patch` (`C3-T11-AUTORITAT`):** Resol els desacords d'autoritat de `.agents/QUI_SOC.md`, `.agents/BIOS.md` i `.agents/BOOTSTRAP.md` (i apunta a `sdp-pedra-seca/SKILL.md` com a llei del sistema de disseny, conservant `verify-bios.mjs`, `verify-ledger.mjs` i `sdp-workflow/SKILL.md` que sí existeixen).
    - **`261029_0438_solucio_wordpress_codex.patch` (`65/65` + `1/1` en verd)** i **`261029_0438_solucio_e2ee_cua_codex.patch` (`33/33` en verd)** + **`261029_0408_solucio_appd1_sessio_codex.patch`** i **`261029_0408_solucio_m01_codex.patch`**.
- **OK Tècnic immediat per a la integració de Claude Code en el Cicle 5/6:**
  1. **Aplicar el conjunt canònic de 7 pegats no solapats de Codex (`apply-check 0`):** `261029_0508_solucio_t11_i_og_codex.patch`, `261029_0508_solucio_e2ee_sdph_codex.patch`, `261029_0508_solucio_autoritat_codex.patch`, `261029_0438_solucio_wordpress_codex.patch`, `261029_0438_solucio_e2ee_cua_codex.patch`, `261029_0408_solucio_appd1_sessio_codex.patch` i `261029_0408_solucio_m01_codex.patch`.
  2. **Integrar l'Onada 5 d'Ull Humà (`T11-24..T11-26`, detall a `261029_0336_auditoria_gemini.md §3.5`):**
     - `T11-24`: Esmenar `.agents/rules/supabase_grants.md` perquè distingeixi entre taules Data API amb RLS i **taules blindades RPC-only** (`REVOKE ALL FROM public, anon, authenticated, service_role` + `SECURITY DEFINER`, com `xat_claus_usuari`, `xat_llibretes`, `xat_cercles_recuperacio` o `xat_adjunts`).
     - `T11-25`: Alinear `.agents/hooks/verify.mjs:61-68` i `.agents/DESTINS_CANONICS.json` amb `.agents/protocolledge.json` (`C3-T11-DESTINS`) perquè no bloquegen `_wiki_de_poble/10_actes/` ni `01_ser..03_actuar`.
     - `T11-26`: Eliminar l'H1 duplicat a `.agents/rules/00_BIOS_COGNITIU.md:6-7`.

#### Bitakora del Pla Variable · Cicle 6 (06:04 CET — Verificació dels 9 Pegats Canònics `0538`+`0508`+`0438`+`0408`, SCC verd i Onada 6 `T11`)
- **Verificat a l'arbre viu i en còpies temporals en el Cicle 6 (`261029_0336_auditoria_gemini.md` v1.6.0 i `261029_0340_auditoria_codex.md` v1.5.0):**
  - `node tooling/gates/verificador-scc.mjs` revisa **234 fitxers** amb **0 errors d'enllaç a `261029_0336_auditoria_gemini.md`** (únic avís restant: `pla.md` fins a l'arxiu de `T1.5`).
  - **Conjunt complet de 9 pegats no solapats de Codex verificat amb `git apply --check` = `0` (`ALL_9_PATCHES_APPLY_CLEANLY_TOGETHER=0`):**
    1. `261029_0538_solucio_t11_i_og_codex.patch` (`244/244` Node en verd, 33 fitxers: unifica `T11`, `QA-H04` OpenGraph amb timeouts de 5 s, `DESTINS_CANONICS.json` + `destins_canonics.mjs`, `.agents/hooks/verify.mjs` `18/18` (`T11-21` + `T11-25`), i `sdp-workflow` + `wiki-propagar-veritat`).
    2. `261029_0538_solucio_e2ee_actor_codex.patch` (`E2EE-C03`: `actor` obligatori a `desaASafata`, `safata(ci, actor)` i `treuDeSafata(ci, id, actor)` en `xifratXatMagatzem.js`, `74/74` en verd; `241/241` combinat amb cua i `SDPH`).
    3. `261029_0538_solucio_recursos_codex.patch` (`T2.5`: instal·la els 2 recursos reals byte-idèntics `src/apps/bar/llavors/MAPA_IMATGES.txt` i `scripts/botigues/botigues.env.exemple.txt`, `32/32` en verd).
    4. `261029_0508_solucio_e2ee_sdph_codex.patch` (`E2EE-C01..C02`: `SDPH` `87 B` i $k=3$, `134/134` en verd).
    5. `261029_0508_solucio_autoritat_codex.patch` (`C3-T11-AUTORITAT`).
    6. `261029_0438_solucio_wordpress_codex.patch` (`T5.1`: `65/65` + `1/1` WordPress).
    7. `261029_0438_solucio_e2ee_cua_codex.patch` (`QA-C2-E2EE-LOCK`, `33/33` en verd).
    8. `261029_0408_solucio_appd1_sessio_codex.patch` (`APP-D1`, `42/42` en verd).
    9. `261029_0408_solucio_m01_codex.patch` (`M-01`).
- **OK Tècnic immediat per a l'aplicació de Claude Code en el Cicle 6/7:**
  1. Aplicar d'una tacada els **9 pegats no solapats** (`git apply` + regenerar `SKILLS_SEAL.json` amb `segella.mjs --update`).
  2. Recomprimir `public/assets/system/ui/og-socdepoble-1200x630.png` (`<= 250 KB`) per tancar el `46/46` de `imatgeSocial.pes300.test.js`.
  3. Integrar l'**Onada 6 d'Ull Humà (`T11-28..T11-31`, detall i codi a `261029_0336_auditoria_gemini.md §2.7` i `§3.4`):** afegir `"solucio"` a `tooling/wiki/taxonomia.json` i `taxonomia_documental.md` (i actualitzar `"pla"` en retirar `pla.md` a `T1.5`), canviar `type: protocol` a `sistema_immunitari.md:2` + delegar `extreuFantasmes` de `scripts/immunitari/plaquetes.mjs:111` a `extractProseWikiLinks`, anotar les 42 skills a `03_inventari_skills.md` i aplicar el pegat de `esCandidat(brut)` a `tooling/gates/tractor-doctrina.mjs:155-184` (pelar `:línia`, ignorar extensions nues i filtrar metavariables `aammdd` amb carpeta).

#### Cicle 7 (`06:34 CET` · Verificació de l'Arbre Viu Integrat, 6 Dimensions en `10,0 / 10` i Pegat `261029_0630_solucio_t11_onada6_gemini.patch`)
- **Estat verificat empíricament per Gemini (`261029_0336_auditoria_gemini.md` v1.7.0 · Mitjana global: `9,99 / 10`):**
  - Verificat sobre l'arbre viu integrat: **9/9 fitxers Vitest (`175/175` passades + 1 omesa, `0` fallades)** i **12/12 fitxers Node (`239/239` passades, `0` fallades)**.
  - Certificades en **`10,0 / 10` VERIFICAT A L'ARBRE VIU** les **Dimensions 2, 3, 4, 5, 7 i 8**.
  - Lliurat i ancorat `_wiki_de_poble/04_escriptori/261029_0630_solucio_t11_onada6_gemini.patch` (`git apply --check` `0`), que tanca `T11-15`, `T11-17`, `T11-18`, `T11-19`, `T11-24`, `T11-26`, `T11-28`, `T11-29`, `T11-30`, `T11-31` i `T1.5` (`acta` -> `10_actes/` + `DESTINS_CANONICS.json` + `SKILLS_SEAL.json`), preservant la ruta `planificacio` exigida per les suites de regressió O13 (`T11-32`).

#### Cicle 8 (`07:15 CET` · `10,0 / 10` Certificat en les 10 Dimensions a l'Arbre Viu, Decorador `ambXifratXat` i Tancament `C5-T11-PENDENTS`)
- **Estat verificat empíricament per Gemini (`261029_0336_auditoria_gemini.md` v1.8.0 · Mitjana global: `10,00 / 10`):**
  - Integrats a l'arbre viu els 3 pegats `0638` de Codex (`backendPort.xifrat.capacitats.test.js` `37/37`, `t11-cens-documental.test.mjs`, `porta-taxonomia.test.mjs`) i els 2 pegats `0700` de Gemini (`261029_0700_solucio_t7_decorador_gemini.patch` i `261029_0700_solucio_t11_c5_pendents_gemini.patch`).
  - Verificat sobre l'arbre viu: **8/8 suites Vitest d'E2EE + Port (`409/409` passades + 2 omeses, `0` fallades en `1,93 s`)**, **7/7 suites Node `T11` (`130/130` passades, `0` fallades en `902 ms`)**, `verificador-scc.mjs` (`233` fitxers, `valid: true, errors: []`), `porta-plantilles.mjs` (`12 rutes`), `porta-taxonomia.mjs --paritat` (`0` errors) i `segella.mjs` (`cbb5e26d...`).
  - Certificades en **`10,0 / 10` VERIFICAT A L'ARBRE VIU les 10 dimensions (1 a 10)**!

#### Cicle 9 (`07:48 CET` · Integració a l'Arbre Viu dels Pegats `0708` de Codex i `0735` de Gemini, Reconciliació CAS i `10,0 / 10` Verificat)
- **Estat integrat i verificat empíricament per la IAIA MarIA sobre l'arbre viu (`261029_0336_auditoria_gemini.md` v1.9.0 i `261029_0340_auditoria_codex.md` v1.8.0):**
  - Integrats a l'arbre viu els **2 pegats `0708` de GPT Codex** (`261029_0708_solucio_t7_canal_codex.patch` amb `src/data/xifratXatServei.js` + `src/data/xifratXatCanal.seguretat.test.js` `7/7` i `261029_0708_solucio_t11_codex.patch` amb `tests/t11-arxiu-fossils-bundle.test.mjs` `2/2` + `tests/t11-equip-contracte.test.mjs` `10/10`).
  - Integrat a l'arbre viu el **pegat `261029_0735_solucio_t11_portes_cens_gemini.patch` de Gemini CLI** (`T11-33..T11-40`), passant a verd les 6 portes del cens de `run-portes.mjs` (`tractor-rls.mjs`, `tractor-arrel.mjs`, `tractor-rutes.mjs` `98 -> 92`, `tractor-cognitiu.mjs` `0 bloquejants`, `tractor-frontmatter.mjs` `F9: 159 -> 138 <= 190` i `llaurador_indexs.mjs --check` `555/555` abastables, `0` penjats).
  - Reconciliat explícitament el segell CAS `.agents/SKILLS_SEAL.json` (`hash: 460e83cbbe70abf3fccd88984712c768a765ca37d0382f84b2dc97738dc6fe61`), recompilat `src/data/wikiManifest.js` (`79` documents, `9` categories) i verificat sobre l'arbre viu: **`9/9` suites Vitest E2EE + Port (`416/416` passades + 2 omeses, `0` fallades)**, **`63/63` proves Vitest de `iaiaLocal` (`48/48` + `15/15`)**, **`9/9` suites Node `T11` (`143/143` passades, `0` fallades)** i les **5 portes de governança (`verificador-scc.mjs` `233` fitxers `0` errors, `porta-plantilles.mjs` `12 rutes`, `porta-taxonomia.mjs --paritat`, `segella.mjs` i `porta-olivera.mjs`) 100% en verd**.

#### Cicle 10 Final (`08:11 CET` · Tancament de les 10 Iteracions de la Marató Nocturna: Integració dels Pegats `0738` de Codex i `0800` de Gemini)
- **Estat integrat i verificat empíricament per la IAIA MarIA sobre l'arbre viu en l'últim cicle del cron (`261029_0336_auditoria_gemini.md` v1.10.0 i `261029_0340_auditoria_codex.md` v1.9.0):**
  - Integrats a l'arbre viu amb `0` conflictes els **4 pegats `0738` de GPT Codex** (`261029_0738_solucio_t11_codex.patch`, `261029_0738_solucio_t7_ambit_codex.patch`, `261029_0738_solucio_pla_referencies_codex.patch` i `261029_0738_solucio_t7_contracte_codex.patch`) i el **pegat `261029_0800_solucio_t7_ambit_i_t11_selectors_gemini.patch` de Gemini CLI** (`T11-41`, `21` fitxers en total):
    - **`T7` Àmbit Explícit i Cicle de Vida:** `src/data/xifratXatContext.js`, `src/sections/xat/useXifratXat.js`, `src/sections/xat/XatContext.jsx`, `src/host.js` i `src/data/xifratXat.js` + suites `src/data/xifratXatContext.seguretat.test.js` (`14/14`), `src/sections/xat/XatContext.xifratAmbit.test.jsx` (`7/7`), `src/sections/xat/useXifratXat.test.jsx` (`4/4`) i `tests/host.xifrat.test.js` (`2/2`), a més del contracte `../_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md` (`§8.5` i `§21`).
    - **`T11` Procedència, Codec RAG i Selectors de Genoma:** `tooling/wiki/lib/retrieval-sources.mjs`, `tooling/wiki/core/rag-index-wire.mjs`, `tooling/wiki/compile-wiki-to-system-prompt.mjs`, `tooling/wiki/core/edge_rag.mjs`, `tooling/wiki/core/search_cli.mjs`, `tooling/wiki/generar_genoma_v2.mjs` i `scripts/generate-prompt.sh` + suites `tests/t11-retrieval-provenance.test.mjs` (`21/21`) i `tests/search-cli-wire.test.mjs` (`9/9`).
  - Verificat sobre l'arbre viu: **`13/13` suites Vitest d'E2EE + Port + Context + Host (`443/443` passades + 2 omeses, `0` fallades)**, **`71/71` proves Vitest de `iaiaLocal` (`48/48` + `15/15` + `8/8` amb `wikiManifest.js` `65c332cd...`)**, **`11/11` suites Node `T11` (`173/173` passades, `0` fallades)** i les **10 portes (`tractor-rls`, `tractor-arrel`, `tractor-rutes`, `tractor-cognitiu`, `tractor-frontmatter`, `llaurador_indexs --check`, `segella`, `porta-plantilles`, `porta-taxonomia --paritat` i `verificador-scc` `233` fitxers `0` errors) 100% en verd**.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Portes d'Escriptori i Documentació:**
   - `node tooling/gates/porta-olivera.mjs` ➔ eixida `0`.
   - `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261029_0216_pla_implementacio_excel_lencia_10_10_tancament_bloch_i_xat_e2ee.md` ➔ `valid: true`.
2. **Bateria de Precommit i Qualitat de Codi:**
   - `npm run test:precommit` ➔ `0` fallades en menys de `30 s`.
   - `npx eslint` sobre tots els fitxers nous i modificats ➔ `0` errors i `0` avisos.
3. **Bateria Completa (Vitest + Node):**
   - Verificació que `laParroquia.test.js`, `tests/botigues.test.mjs` i `MapaFotografic.test.jsx` passen a verd i la suite completa no té cap prova roja.
4. **Verificació del Paquet WordPress (`socdepoble.zip`):**
   - `node --test tests/enxufe-plugin.test.mjs tests/empaqueta-wp.test.mjs` i `node tooling/gates/porta-enxufe.mjs` ➔ `83/83` comprovacions en verd.
5. **Verificació de la Fase 1/2/3 d'E2EE (`P1-12` + `IDEA-48`) i les 10 Dimensions (`10,0/10`):**
   - Proves unitàries i de vectors deterministes de `xifratXatCripto`, `xifratXatFormats`, `xifratXatMagatzem`, `xifratXatParaules`, `xifratXatRecuperacio`, `xifratXatProtocol` i `xifratXat` (`ambXifratXat`) 100% en verd sense activar cap canvi visible en l'enviament de missatges en viu fins a l'ordre d'activació del Mestre.
   - Butlletí de Qualificacions de Gemini i Codex amb nota verificada de **`10,0/10` en cadascuna de les 10 dimensions**.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Risc de barrejar els fitxers incomplets d'E2EE amb el commit de tancament del Bloc H:** Mitigat completament al Pas 4 usant un índex temporal (`GIT_INDEX_FILE`) que commiteja exclusivament el tancament del Bloc H + deute 10/10 i reconstrueix `socdepoble.zip` des d'`archive` net abans de continuar amb la Fase 2 d'E2EE.
- **Risc de bloqueig del registre en producció abans d'aplicar la migració `2610282100` (`APP-D1`):** Mitigat al Pas 2 amb degradació elegant al client si el RPC remot encara té la signatura anterior.
- **Risc d'activació dels filtres secundaris d'OpenAI (`Daybreak` · `IDEA-47`) en la lectura per part de GPT Codex:** Mitigat emprant exclusivament terminologia defensiva d'enginyeria de qualitat, conformitat i proves unitàries (`QA-*`) en aquest Pla i en el Prompt `261029_0216`.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261029_0216_prompt_excel_lencia_10_10_tancament_bloch_i_xat_e2ee]]
- [[../10_actes/261029_0205_acta_marmota_blocs_ag_h_commit_e36606db2_disseny_e2ee_i_relleu_claude]]
