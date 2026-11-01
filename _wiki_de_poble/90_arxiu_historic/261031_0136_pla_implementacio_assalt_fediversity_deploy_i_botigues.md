---
type: document
status: esborrany
description: 'Pla d''implementació per al dissabte 31-10-2026: desplegament web/WordPress/TestFlight/Google Play, deute post-commit i 5 fronts Fediversity.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_af84be75-9938-4500-bf58-d7755dc43ec7:0fb7b551-1990-4608-8323-3d3ec9cdc1d8
---
# Pla d'Implementació Dissabte 31-10: Assalt Final NGI Fediversity, Deploy i Botigues

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_af84be75-9938-4500-bf58-d7755dc43ec7:0fb7b551-1990-4608-8323-3d3ec9cdc1d8 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-31T00:37:43.254Z |
| Modificació | 2026-10-31T12:35:00.000Z |
| Propietari | maria |
| Aprovació humana | aprovat pel Mestre Javi Llinares (2026-10-31) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini 3.1 Pro (High) |
| Tokens consumits | ~25.000 tokens |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- `2026-10-31T00:37:43.254Z`: Esborrany creat per al pla de dissabte 31-10.
- `2026-10-31T00:39:00.000Z`: Completat amb el full de ruta de desplegament (Web, WordPress, TestFlight, Google Play Beta), tancament del deute post-commit i els 5 fronts d'alt impacte per a la subvenció europea NLnet NGI Fediversity (Expedient `2026-08-1a6`).
- `2026-10-31T12:35:00.000Z`: Actualitzat amb l'estratègia del Mestre de **2 Rondes** per al cap de setmana després de rebre el correu de Michiel Leenaars (NLnet, 31-10 12:27 CET): **Ronda 1 (Fase 0)** centrada a tancar les 4 portes post-commit, fer els 3 commits de Git, publicar per SVN `1.1.10` a WordPress.org (`https://wordpress.org/plugins/socdepoble`) i pujar les builds a Apple TestFlight i Google Play Beta; **Ronda 2 (Fase 1)** centrada a completar i auditar els 5 fronts `F1–F5` de Fediversity i desplegar-los a `https://socdepoble.org` abans d'enviar **diumenge de matinada** el correu d'actualització d'evidències a Michiel Leenaars (`2026-08-1a6@nlnet.nl`).
- `2026-10-31T14:23:38.000Z`: font arxivada, citada en text perquè Vincles només admet notes vives (F9): `_wiki_de_poble/90_arxiu_historic/261030_2208_prompt_claude_tancament_seo_consola_publica_i_telemetria_didactica.md`. La va reapuntar a l'arxiu MarIA en la neteja de l'Escriptori del 31-10 (04:08); l'ha moguda de Vincles Claude Code (ordre del Mestre 261031, Ronda 1).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### Ronda 1 (Fase 0) · Portes Post-Commit, Git, Publicació Oficial a WordPress.org i Botigues Mòbils
1. **Tancament de les 4 Portes Post-Commit, Git i Publicació Oficial a WordPress.org (`https://wordpress.org/plugins/socdepoble`):**
   - *Nota:* El desplegament web de la matinada a `https://socdepoble.org` (`1.047` fitxers, 34 rutes socials, `/consola`, `/legal` i `/page/fediversity`) i la neteja d'`_wiki_de_poble/04_escriptori/` ja estan completats i verificats en viu (`HTTP/2 200`).
   - Tancar els 4 ítems de deute post-commit que obrin les portes **Reflex** (`DT-REFLEX-01..04`), **Nomenclatura N1** (`DT-N1-01`), **Pedra Seca** (`DT-PS-01..03`) i **Tokens** (`DT-TKN-01..05`), i executar els **3 commits atòmics de Git + `git push`**.
   - **FITA APROVADA:** El WordPress Plugin Directory ha aprovat **«Sóc de Poble. Portal de Pobles Connectats»** (`https://wordpress.org/plugins/socdepoble`, SVN a `https://plugins.svn.wordpress.org/socdepoble/`, usuari `socdepoble`). Compilar la variant del directori (`build:wp:directori` + `empaqueta.mjs --directori` — **sense sistema d'autoactualització GitHub**), preparar i pujar l'arbre SVN (`trunk/`, `tags/1.1.10/`, `assets/`) i actualitzar `/page/fediversity` i `/page/descarregues`.
2. **Actualització de Canals de Proves Natives (Apple TestFlight i Google Play Beta Testers):**
   - Incrementar `versionCode` / `CURRENT_PROJECT_VERSION` a `2` (`1.0.0 (2)`).
   - Executar `npm run build:natiu && npx cap sync`.
   - Arxivar i pujar a **Apple TestFlight** des d'Xcode (`npx cap open ios` → *Product › Archive › Distribute App*) i generar l'AAB signat des d'Android Studio (`npx cap open android` → *Generate Signed App Bundle*) per a la pista de **Beta Testers** de Google Play Console.

### Ronda 2 (Fase 1) · Assalt Final NGI Fediversity (5 Fronts abans del correu de Diumenge de Matinada a Michiel Leenaars)
1. **Front F1 (Partida 3) — Botó en viu «Descarregar Paquet Open Data del Poble» a `/pobles/<slug>`:**
   - Connectar el generador i verificador ja existents (`src/data/exportaMunicipiOpenData.js`) a la fitxa pública de cada municipi (`src/sections/pobles/`) perquè qualsevol avaluador d'NLnet o veí puga descarregar amb un clic el paquet estàndard de dades obertes municipals amb les seues llicències (`CC BY-SA 4.0` / `CC0`), passant de «encara no es pot descarregar des de l'aplicació» a **Fet hui (verificable)** a `/page/fediversity`.
2. **Front F2 (Partida 3) — `Outbox` d'ActivityPub amb Publicacions Reals dels Pobles + `NodeInfo 2.1` + Identitat Fedivers Visible:**
   - En `tooling/seo/genera-federacio.mjs` i `tooling/vite/federacio-iaia.mjs`, alimentar `/ap/outbox/<slug>.json` i `/ap/objectes/<slug>/<id>.json` amb les publicacions, notícies i esdeveniments públics reals de cada municipi i de Sóc de Poble.
   - Publicar `/.well-known/nodeinfo` i `/nodeinfo/2.1.json`, i estendre WebFinger estàtic a tots els pobles del directori.
   - Mostrar a la fitxa de cada poble el seu identificador federat (`@la-torre-de-les-macanes@socdepoble.org`) amb botó de copiar i enllaç al seu actor ActivityPub.
3. **Front F3 (Partida 4) — Construcció de `tooling/instalador/` i Verificació de `flake.nix`:**
   - Construir `tooling/instalador/` (script i assistent d'instal·lació reproduïble d'un node germà «Gent de…» amb validació d'entorn, configuració de municipi, domini, WebFinger i ActivityPub) amb la seua suite de proves, eliminant el «L'instal·lador: no existix» de `/page/fediversity`.
4. **Front F4 (Partida 1) — Documentació Tècnica de l'API del Port Neutral (`backendPort.js`), Kit de Conformitat i Requisits d'Allotjament Model B:**
   - Publicar la documentació tècnica verificable de l'API neutral (`CONTRACTE_NUCLI`), el kit de conformitat d'adaptadors i els requisits d'allotjament d'un node municipal, enllaçada des de la Partida 1 de `/page/fediversity`.
5. **Front F5 (Partida 2) — Extensió de les Fletxes de Teclat (`IDEA-58`) a totes les seccions de l'App:**
   - Estendre `src/components/universal/workspace/navegacioTeclat.js` a `Pobles`, `Mur`, `Multimèdia`, `Notes` i `Consola` i actualitzar `/page/fediversity` i `pageContent.fediversity.test.js`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- `npx vitest run src/sections/text/pageContent.fediversity.test.js src/data/activitypub.test.js src/data/exportaMunicipiOpenData.test.js`
- `npm test` i `npm run test:node`
- `npm run build` i `npm run build:natiu`
- `node tooling/gates/porta-documents.mjs && node tooling/gates/porta-olivera.mjs && node tooling/gates/verificador-scc.mjs`
- `node tooling/gates/run-portes.mjs`

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Ancoratge estricte de `pageContent.fediversity.test.js`:** Qualsevol canvi en l'estat de les 4 partides (com importar `exportaMunicipiOpenData` des d'un component de `src/` o crear `tooling/instalador`) obliga a actualitzar simètricament el text de `PAGE_COPY.fediversity` i la prova `pageContent.fediversity.test.js`, i aprovar l'empremta amb `node tooling/gates/frontissa-contingut.mjs --aprova fediversity --per javillinares`.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261031_0136_prompt_dissabte_fediversity_deploy_i_botigues]]
