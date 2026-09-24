---
type: informe
status: esborrany
description: 'Implementació del pla 1245: Mapa de la Consola, entradeta de la Wiki, tractors en quarantena, pàgina de taxonomia i resegellat.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_521ee9db-46ae-4d42-a550-4b9ac3f20b00:50faf196-6fcc-4a36-919c-6dbccb756c5a
---
# Auditoria Claude 260924: implementació de la Consola, la Wiki i els tractors

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_521ee9db-46ae-4d42-a550-4b9ac3f20b00:50faf196-6fcc-4a36-919c-6dbccb756c5a |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T12:07:26.853Z |
| Modificació | 2026-09-24T12:36Z (14:36 local; `updatedAt` del registre del torn) |
| Propietari | Claude (Claude Code, agent local, sessió d'este torn) |
| Aprovació humana | aprovat per a implementar (prompt 1445, «Aprovació humana: aprovat»); pendent per a D1–D5 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`) |
| Tokens consumits | estimats: ~500 k de context llegit i ~110 k d'eixida; mesurats: no disponibles |
| Respon a | `260924_1445_prompt_claude.md` i pla `260924_1245_pla_implementacio_claude.md` |
| Tall d'evidència | branca `backup-notes-publish`, HEAD `57ec5684`, arbre brut heretat; torn obert a les 12:07 UTC (14:07 hora local) |
| requires_human_decision | true (D1–D5, vegeu el resum) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Circuit seguit: `obrir_torn` → `document.mjs context` (plantilla llegida sencera) → `create` → este contingut → `check`. Abans de tocar res vaig llegir sencers el prompt 1445, el pla 1245, `.agents/protocolledge.json`, `prompt_local.md`, `skill.md`, `acta.md`, els sis documents de `02_saber/03_consola_termodinamica/`, la meua auditoria anterior (`90_arxiu_historic/260924_1317_auditoria_claude.md`, lectura nominal i explícita, no RAG) i el codi de totes les portes que em podien bloquejar (`hooks-local`, `mutation-policy`, `command-policy`, `porta-reflex`, `porta-olivera`, `segella`, `segell-auto`, `executor-mutacio`, `reflex_petorreta`).

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-24T12:07Z: torn `torn_521ee9db-46ae-4d42-a550-4b9ac3f20b00` obert (abast `code`); esborrany d'esta auditoria creat amb rebut i ancorat.
- Mateix torn: entradeta de la Wiki, `systemPages.js`, avisos de desenvolupament, Mapa de la Consola amb proves, tractors al laboratori, pàgina de taxonomia i enllaços a les plantilles.
- Mateix torn, abans de tancar: detectat un actor concurrent que ha escrit a l'Escriptori i al pla 1245 en nom de Claude (C10).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum per al Mestre

- **Fet i viu al codi (`src/`):**
  - l'entradeta de la portada de la Wiki torna a pintar-se (C1);
  - la Consola té el Mapa del Mas: compilador pur, validació estricta, panell i 40 proves (C3);
  - la llista de pàgines de sistema del Mur ha passat a configuració, sense canviar cap píxel, i Mur i Wiki avisen en desenvolupament si en falta una (C4).
- **Fet i en quarantena** (`04_escriptori/02_investigacio_ia/260924_1410_tractors_claude/`): la closca del Mapa, el middleware, la frontissa de contingut, el Time Machine, la porta de taxonomia, el registre de tasques ampliat, el `pre-commit` i quatre fitxers de proves (C4–C6, C8). Van ací perquè el hook denega tota escriptura a `tooling/`, `.agents/` i `.husky/`.
- **Fet a la Wiki:** la pàgina `02_saber/protocols_tecnics/taxonomia_documental.md`, enllaçada des de `00_index`, des del bloc Context de `prompt_local.md` i des de `skill.md` (C6).
- **Decisions teues:**
  - **D1** · què ha de dir la barra taronja (C2);
  - **D2** · si la Consola i el Mapa se servixen en producció darrere de superadministració o només en local (C3, C10);
  - **D3** · resegellar després de revisar el diff (C7);
  - **D4** · instal·lar els tractors (C8);
  - **D5** · què fem amb el document 1500 i el diàleg escrit en nom de Claude al pla (C10).
- **No fet:** relleu d'ESTAT i LEDGER, `tancament.mjs`, commit i verificació al navegador. El hook ho denega tot. El text del relleu va preparat al final.

### C1 · Punt 9A: l'entradeta de la portada de la Wiki (fet)

- **Causa:** `PAGE_COPY.wikidepoble` sí que existix (`src/sections/text/pageContent.js:118-126`, restaurada al commit `57ec5684`) i porta `lead`. El que faltava era passar-lo: `WikiDetail` construïa la `UniversalPage` de la portada sense la prop `lead`.
- **Qui la pinta:** `PageFrame.jsx:334-339` la pinta dins de `.page-intro`, davall de l'H2. La plantilla canònica de pàgines de text ja la passava (`TextSection.jsx:31`).
- **Reparació:** `WikiDePobleSection.jsx:49` passa `lead={page.lead}`. La clau es llig de `COVER_PAGE_KEYS.wiki` (`src/config/systemPages.js`), no d'un literal. Així la portada de la Wiki i el Mur beuen de la mateixa font, i la frontissa en deriva la clau obligatòria.
- **Mateix defecte en un altre lloc, no tocat:** la portada de `DesignSection.jsx:17-31` tampoc passa `lead`. És la «font de veritat única» de la skill `sdp-universal-page`, i canviar-la és un canvi de píxel que ningú ha ordenat.
- **Verificació visual pendent:** el navegador està denegat pel hook. Cal mirar `http://localhost:3340/wikidepoble`.

### C2 · Punt 9B: la barra taronja (no tocada, D1)

- **Què pinta hui:** la barra taronja és la casella d'autoria. `PageFrame.jsx:240-278` hi posa l'avatar, `DEFAULT_AUTHOR.name` («Sóc de Poble», `UniversalUtils.js:26-30`), el poble i el botó de data i hora. La plantilla canònica (`/projecte`, `TextSection.jsx`) pinta exactament el mateix «Sóc de Poble». El títol de la pàgina va a l'H1, davall de la barra, i la Wiki el pinta bé.
- **Què diu la doctrina:** la skill `sdp-universal-page` §1.C diu literalment que la barra taronja «Conté l'autoria de l'usuari, el seu poble i la data/hora de la publicació».
- **Per què no l'he tocada:** posar-hi el títol de la pàgina contradiu la skill. A més, no he pogut vore la pantalla, i «Sóc de Poble» pot ser l'autoria o una altra barra que no identifique. Una captura ho resol.
- **Opcions:**
  - **(a)** deixar la barra com a `/projecte`, i si vols, completar la resta de la plantilla canònica (etiquetes, logotip, data i hora);
  - **(b)** autoria «Wiki de Poble» a la portada i, als documents, l'autor del frontmatter (una prop, `authorName`; no cal tocar la skill);
  - **(c)** el títol de la pàgina a la barra; cal reescriure la skill (governança).
- `requires_human_decision: true`.

### C3 · Consola Termodinàmica: el Mapa del Mas (fet a `src/`, servidor en quarantena)

- **Peces**, totes a `src/sections/consola/mapa/` (una sola llesca):
  - `contracteMapa.js`: vocabulari tancat de `sdp.mapa.v1`;
  - `construeixMapa.js`: compilador pur, sense disc, sense git i sense xarxa;
  - `mapaContent.js`: lectura i validació estricta;
  - `MapaConsola.jsx`: el panell;
  - `peces.jsx`: `Xifra` i `Mono`, trets de `ConsolaSection.jsx` per a compartir-los sense duplicar-los.
- **On es veu:** s'integra a `ConsolaSection.jsx:257`, així que apareix a `/consola` i a l'element «Consola Termodinàmica» de la Wiki.
- **Regles del contracte aplicades:**
  - tres confiances: declarat, derivat i inferit;
  - una aresta inferida mai decidix si una skill és orfe;
  - una menció de prosa mai crea una skill;
  - la plantilla d'una ruta és plantilla per declaració, encara que visca a `02_saber/`;
  - una skill governada o carregada que no és al disc és un fantasma;
  - semàfor adaptat d'`03_inventari_skills.md`;
  - estats de tasca de `02_calendari.md`; sense rellotge, l'estat és «desconegut», mai «viu»;
  - salut amb numerador, denominador i prova, o `N/A`.
- **On viu:** la font és `GET /__iaia/mapa.json`, només en desenvolupament i només des de la mateixa màquina, igual que la Consola actual. En producció, o sense el middleware, el panell diu «Mapa no disponible» i explica per què. D2 decidix si això canvia.
- **Arquitectura:** el nucli pur viu a `src/` perquè vitest el prove i perquè la interfície valide amb el mateix vocabulari (`contracteMapa.js`). El paquet del navegador no importa el compilador. La closca que llig el disc (`tooling/brain/mapa-consola.mjs`) és al laboratori.
- **Proves:** `construeixMapa.test.js` (21) i `mapaContent.test.js` (19). Escrites i traçades a mà línia a línia, no executades (Límits).
- **Previsió, no mesura, del que pintarà el Mapa quan s'instal·le.** La trac de fonts ja llegides:
  - **Skills fora de l'índex:** `core-edicio-segura`, `core-estrategia-ia`, `core-higiene-escriptori` i `core-taxonomia-estricta`. L'índex en té 17; el segell, 20 skills.
  - **Fora del catàleg de Claude:** les quatre anteriors i `core-automillora`. El catàleg té 16.
  - **`core-taxonomia-estricta`:** frontmatter invàlid (sense `type` ni `status`) i fora del segell.
  - **Disparador decoratiu (8):** `core-automillora` (buit), `core-identitat`, `core-memoria-historica`, `sdp-casos-us-essencials`, `sdp-estudi-mercat`, `wiki-busca-skills`, `wiki-cicle-de-vida` i `wiki-propagar-veritat`.
  - **Disparador ample:** `sdp-pedra-seca` («ui», «css») i `core-context-panic` («error»).
  - **Tasques:** Reflex daemon mort; hooks d'Antigravity sense consumidor; les cinc tasques de Plaquetes sense llançador declarat.

### C4 · Frontissa de contingut (en quarantena) i canvis de suport a `src/` (fets)

- **Disseny:** implementa T2 de l'auditoria 1317.
  - Importa l'objecte `PAGE_COPY`.
  - Deriva les claus obligatòries de `SYSTEM_PAGES`, de `COVER_PAGE_KEYS` i dels `pageKey` de `sections.js`.
  - Guarda una empremta SHA-256 i la longitud de l'HTML de cada clau a `.agents/contingut_estructural.json`.
  - L'aprovació queda lligada a l'empremta exacta.
  - Un retall del 30% o més no s'aprova sense `--accepta-retall`.
  - El missatge de recuperació prohibix restaurar fitxers sencers.
- **`sections.js` es llig com a text:** importa icones de `lucide-react`, que en node no es carrega sense el paquet del navegador. Un literal comentat només faria la porta més estricta.
- **Trasllat de `systemPages`:** T2 el marcava com a decisió humana; l'he executat perquè el prompt ordena implementar la frontissa. És un refactor sense canvi de píxel: `MurSection.jsx:33-49` fa el mateix recorregut sobre la mateixa llista.
- **En temps d'execució, veu alta:**
  - `MurSection.jsx:35-39`: `console.warn` en desenvolupament quan falta una pàgina declarada;
  - `WikiDePobleSection.jsx:35-39`: el mateix per a la portada.
  - En producció no canvia res.
- **Bootstrap:** fins que existisca el registre, la porta ix roja, i el `pre-commit` proposat bloquejaria. Primer `--inicia --per Mestre` (C8).

### C5 · Time Machine (en quarantena)

- **Disseny:** implementa T3 de l'auditoria 1317 amb l'engranatge intern de git.
  - Un índex privat (`<git-dir>/time-machine.index`).
  - `commit-tree`: no executa hooks.
  - `update-ref` amb CAS a `refs/time-machine/<branca>`.
  - No toca HEAD, ni l'índex, ni la branca.
- **Salvaguardes afegides en implementar-lo:**
  - un fitxer nou amb nom de secret (`.env*`, claus, `.wwebjs_auth`) avorta la instantània;
  - el pany caduca als 10 minuts;
  - l'entorn de git es neteja de `GIT_DIR` i `GIT_INDEX_FILE`, perquè dins d'un hook apuntarien a un altre repositori;
  - les dates van en format intern de git;
  - la poda reescriu només la referència privada.
- **Llançador:** `--llancador` imprimix el plist de launchd amb les rutes de la màquina. Les rutes de l'usuari no entren al repositori.
- **Declaració:** la tasca queda declarada al registre ampliat (C8).

### C6 · Taxonomia: porta (en quarantena) i pàgina de la Wiki (feta)

- **Porta:** `porta-taxonomia.mjs` aplica sis lleis.
  - T1: format, amb la causa concreta.
  - T2: data i hora reals.
  - T3: categoria del catàleg.
  - T4: títol.
  - T5: data del futur.
  - T6: un fitxer nou amb data de fa més de 30 dies. És el que delata un `ddmmaa` escrit com si fóra `aammdd`.
- **Abast** declarat per superfície: primer nivell de l'Escriptori i de `10_actes`. En el `pre-commit` només mira els fitxers afegits: el deute heretat no bloqueja.
- **Catàleg:** viu a `tooling/wiki/taxonomia.json`. `--paritat` comprova que la pàgina de la Wiki diu el mateix.
- **No duplica res:** `tractor-nomenclatura.mjs` només mira el snake_case (N1), les rutes mortes (N2) i les col·lisions (N3). `document.mjs` i `porta-olivera.mjs` accepten qualsevol paraula com a categoria.
- **Pàgina** (`status: esborrany`): anatomia del nom, exemples rebutjats, catàleg de 19 categories entre marques, superfícies, excepcions i portes. La paritat amb el JSON està comprovada a mà: 19 contra 19.
- **Enllaços:**
  - `00_index.md`, secció Taxonomia;
  - `prompt_local.md`, dins del bloc fix Context. És la llista de lectures obligatòries i `create` la copia a cada petorreta local nova; les antigues conserven la seua instantània del contracte.
  - `prompt_local.md` i `skill.md`, als Vincles.
- **«A l'entrada de cada xat»:** els únics canals que carreguen a l'arrencada són els `@`-imports de `CLAUDE.md`, l'`entrada` de `.agents/cervell.json` i el hook `SessionStart`. Tots tres són governança. Proposta per al Mestre: afegir la pàgina a `cervell.json` → `entrada`.
- **Evidència nova de la inversió de dates:**
  - l'acta `10_actes/260924_1445_ACTA_MARMOTA_consola_termodinamica.md` es titula «26 de Setembre de 2026» i la seua descripció diu «Acta de Tancament del 26 de setembre de 2026»;
  - el prompt 1445 registra «Creació 26-09-24 14:45»;
  - els dos fitxers ja existien a les 13:59 hora local (llistat del hook `SessionStart`), així que el `hhmm` 1445 tampoc és l'hora de creació.

### C7 · Resegellat: les ordres exactes (T11 de l'auditoria 1317 corregit)

- **Correcció:** `npm run porta:segella:update` no funciona tal com està: `segella.mjs:87` exigix `--expected-hash`, `--expected-previous` i `--reason`, i el hash ha de ser el complet de 64 caràcters. La proposta del document 1500 (`--expected-hash=455a0fad --expected-previous=88f0ec03`) falla pel CAS.
- **Causa segura:** el manifest segellat (2026-09-24T02:54:33Z) té 21 fitxers i no inclou `core-taxonomia-estricta/SKILL.md`, que existix. Poden haver-hi més canvis; el pas 1 els llista.
- **Ordre:**
  1. Llista quins fitxers de skills han canviat des del segell.
  2. Revisa'ls amb `git log`.
  3. Arregla el frontmatter de `core-taxonomia-estricta` abans de segellar: li falten `type: skill` i `status` (proposta: `esborrany`), o la porta de frontmatter caurà.
  4. Trau el hash complet.
  5. Resegella amb CAS.
  6. Comprova que torna el ✅.

```bash
node -e "import('./tooling/gates/segella.mjs').then(({calculaSegell}) => { const ara = calculaSegell('.').manifest; const abans = JSON.parse(require('fs').readFileSync('.agents/SKILLS_SEAL.json','utf8')).manifest; for (const f of new Set([...Object.keys(ara), ...Object.keys(abans)])) if (ara[f] !== abans[f]) console.log(!abans[f] ? 'NOU     ' : !ara[f] ? 'ESBORRAT' : 'CANVIAT ', f); })"
git log --since=2026-09-24T02:54:33Z --format='%h %ad %an %s' --date=iso -- .agents/skills
node tooling/gates/segella.mjs --json
node tooling/gates/segella.mjs --update --expected-hash=HASH_COMPLET_DEL_PAS_ANTERIOR --expected-previous=88f0ec03b3910a6e95785b3a3e0e67a69170357a319a5c005474e0eec148104d --reason="Reconciliació 260924: core-taxonomia-estricta i canvis revisats"
node tooling/gates/segella.mjs
```

- **Després del resegellat:** perquè un agent escriga a governança (ESTAT, LEDGER, skills) encara cal una lease de Reflex (`reflex_petorreta.mjs open/seal`, operació `governance-write`). El hook no deixa que cap agent l'òbriga: l'ha d'obrir el Mestre. Els tractors de `tooling/`, en canvi, no estan segellats: el Mestre els pot copiar sense resegellar.

### C8 · Instal·lació dels tractors (ordres per al Mestre)

| Fitxer al laboratori | Destí |
|---|---|
| `mapa_consola.mjs` | `tooling/brain/mapa-consola.mjs` |
| `consola_iaia.mjs` | `tooling/vite/consola-iaia.mjs` (substitució: l'original més la ruta del Mapa) |
| `frontissa_contingut.mjs` | `tooling/gates/frontissa-contingut.mjs` |
| `time_machine.mjs` | `tooling/brain/time-machine.mjs` |
| `porta_taxonomia.mjs` | `tooling/gates/porta-taxonomia.mjs` |
| `taxonomia.json` | `tooling/wiki/taxonomia.json` |
| `registre_tasques.json` | `.agents/cron/registre_tasques.json` (substitució: el d'ara més `tasques`) |
| `husky_pre_commit.sh` | `.husky/pre-commit` (substitució) |
| `*_test.mjs` (4) | `tests/<nom>.test.mjs` |

Els noms del laboratori són snake_case a posta: `tractor-nomenclatura` escaneja tota la Wiki i un nom amb guions faria pujar el deute N1.

```bash
L="_wiki_de_poble/04_escriptori/02_investigacio_ia/260924_1410_tractors_claude"
cp "$L/mapa_consola.mjs" tooling/brain/mapa-consola.mjs
cp "$L/consola_iaia.mjs" tooling/vite/consola-iaia.mjs
cp "$L/frontissa_contingut.mjs" tooling/gates/frontissa-contingut.mjs
cp "$L/time_machine.mjs" tooling/brain/time-machine.mjs
cp "$L/porta_taxonomia.mjs" tooling/gates/porta-taxonomia.mjs
cp "$L/taxonomia.json" tooling/wiki/taxonomia.json
cp "$L/registre_tasques.json" .agents/cron/registre_tasques.json
cp "$L/husky_pre_commit.sh" .husky/pre-commit
cp "$L/frontissa_contingut_test.mjs" tests/frontissa-contingut.test.mjs
cp "$L/porta_taxonomia_test.mjs" tests/porta-taxonomia.test.mjs
cp "$L/time_machine_test.mjs" tests/time-machine.test.mjs
cp "$L/mapa_consola_test.mjs" tests/mapa-consola.test.mjs
node --test tests/frontissa-contingut.test.mjs tests/porta-taxonomia.test.mjs tests/time-machine.test.mjs tests/mapa-consola.test.mjs
npx vitest run src/sections/consola/mapa
node tooling/gates/frontissa-contingut.mjs --inicia --per Mestre
node tooling/gates/porta-taxonomia.mjs --paritat
node tooling/brain/mapa-consola.mjs
node tooling/brain/time-machine.mjs
node tooling/brain/time-machine.mjs --llancador > ~/Library/LaunchAgents/org.socdepoble.time-machine.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/org.socdepoble.time-machine.plist
```

- **Ordre del bootstrap:** `--inicia` ha d'anar abans del primer commit amb el `pre-commit` nou. Sense registre, la frontissa ix roja i bloqueja.
- **`package.json`** (edició humana; la clau `porta:frontissa` ja és de la frontissa del catàleg de Sollutia, per això el nom és un altre):
  - `"porta:contingut": "node tooling/gates/frontissa-contingut.mjs"`
  - `"porta:taxonomia": "node tooling/gates/porta-taxonomia.mjs --paritat"`
  - `"mapa": "node tooling/brain/mapa-consola.mjs"`
  - `"time-machine": "node tooling/brain/time-machine.mjs"`
  - afegir els quatre fitxers de proves a `test:node`.
- **Riscos de la instal·lació:**
  - `reflex_petorreta` exigix que el `pre-commit` continga la línia `exec node tooling/gates/git-staged.mjs`, i el fitxer nou la conserva;
  - Vite reinicia sol en canviar una dependència de la configuració;
  - els noms amb guions a `tooling/` no entren a N1, perquè `tooling` no és arrel de Wiki.

### C9 · El que no s'ha fet

- **Relleu d'ESTAT i LEDGER, i `tancament.mjs`:** `.agents/` és governança; el hook denega l'escriptura i l'ordre. El text del relleu va ací baix.
- **Commit:** denegat pel hook; el fa el Mestre.
- **Fora de les prioritats del prompt:** els punts 4 (Mode AFK amb motor), 5 (Format Zero Fricció), 7 (Graph View) i 8 (propietats i categories) del pla. Els dissenys T4 i T5 de l'auditoria 1317 continuen vigents.
- **Neteja de `.agents/skills/`:** és una mutació de governança sense pla aprovat. L'avaluació sí que està feta: és la previsió de C3, que el Mapa convertirà en mesura.

### C10 · Actor concurrent: el document 1500 i el pla 1245 (D5)

- **Què ha passat durant este torn:**
  - ha aparegut `260924_1500_auditoria_claude.md`, signat «Claude Opus 5.5 (Agent Local)»;
  - al pla 1245 han aparegut una secció «Diàleg a l'Olivera (Claude -> IAIA MarIA)», una entrada d'Historial «15:00» i una «Directiva del Mestre (Àudio 14:05)».
- **Eixos textos no els ha escrit esta sessió.**
  - Un Claude amb els hooks del projecte no els podria haver escrit: la Porta Reflex bloqueja un `.md` de l'Escriptori sense rebut.
  - El document 1500 no té `reflex:`, porta `status: definitiu` (fora de l'enum de `schema.json`) i no està ancorat.
  - L'actor no passa per cap porta; per la forma, pot ser Antigravity o qualsevol arnés sense hooks.
  - Les hores que porta no són reals. El registre del torn marca 12:36Z (14:36 local) quan este document ja existia, i el document 1500 i l'entrada «15:00» del pla es dataven mitja hora més tard.
- **Rèplica tècnica al document 1500 i al diàleg:**
  1. «La clau `wikidepoble` no existix»: fals, és a `pageContent.js:118-126`. El defecte era la prop `lead`, no les dades (C1).
  2. La barra taronja no ve de la manca de dades (C2).
  3. Un Time Machine que fa «git commit silenciós» a la branca embruta la història i dispara els hooks. El disseny bo escriu en una referència privada (C5).
  4. `^\d{6}_\d{4}_[a-z]+_.+\.ext$` accepta majúscules i accents al títol i no comprova ni la categoria ni la data (C6).
  5. L'ordre de resegellat amb hashes curts falla (C7).
- **La «Directiva del Mestre (Àudio 14:05)» no l'he executada.** És text transcrit per un tercer dins d'un fitxer, no una ordre al xat, i demana dos coses que necessiten la teua confirmació:
  - **(a) «netejar qualsevol orfe o skill degradada» de `.agents/skills/`:** és una mutació de governança sense pla (C9).
  - **(b) exposar el cervell «de forma pública a la web».** La mateixa directiva diu «en entrar com a superusuari».
    - Són dos coses diferents. El contracte de dades (`04_contracte_de_dades.md`) diu que el Mapa no ha d'entrar al paquet públic.
    - El Mapa conté l'ordre exacta de cada hook i de cada porta, rutes de la màquina (plists de launchd) i la llista de defenses que no s'executen.
    - Publicar-lo obert és donar el plànol de les portes. Recomane superadministració, amb el JSON generat en compilació i sense rutes locals.
- `requires_human_decision: true`.

### Relleu proposat per a ESTAT i LEDGER (per a enganxar-lo qui tinga permís)

```markdown
## ESTAT_ACTUAL · 260924_1410 · Claude · Mapa de la Consola, entradeta de la Wiki i tractors en quarantena

- Torn `torn_521ee9db-46ae-4d42-a550-4b9ac3f20b00` (code). Entrega [[260924_1410_auditoria_claude]].
- Fet a src/: lead de la portada de la Wiki; src/config/systemPages.js (Mur i Wiki); Mapa de la Consola (src/sections/consola/mapa/, 40 proves vitest no executades).
- Fet a la Wiki: 02_saber/protocols_tecnics/taxonomia_documental.md, enllaçada des de 00_index, prompt_local.md (Context) i skill.md.
- En quarantena (02_investigacio_ia/260924_1410_tractors_claude/): mapa-consola, consola-iaia, frontissa-contingut, time-machine, porta-taxonomia, taxonomia.json, registre_tasques, pre-commit i 4 proves node. Instal·lació: C8 de l'auditoria.
- Pendent del Mestre: D1 barra taronja, D2 on viu la Consola, D3 resegellat (ordres a C7), D4 instal·lació, D5 document 1500 i diàleg escrit en nom de Claude al pla 1245. Commit pendent.
```

```markdown
260924 | torn | Claude | Mapa Consola, entradeta Wiki, tractors en quarantena, taxonomia
```

### Millores per a `prompt_local.md` (Olivera §4)

- **Una contradicció interna:** la «Instrucció del torn» cedix l'execució, però el bloc fix de l'Olivera diu «Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe». Proposta: un camp «Mode: auditoria | execució» al Registre, i un bloc Olivera que el llija.
- **Dos Registres que es contradiuen:** el prompt 1445 diu «Aprovació humana: aprovat» i el pla 1245 diu «pendent».
- **Repetixc la proposta de T8 (1317):**
  - una quarta casella a la secció 0, «`document.mjs check` → `valid: true`»;
  - la Creació en format `AAAA-MM-DD HH:MM`.

  El prompt 1445 no du rebut, té la tercera casella sense marcar i la seua data està girada.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Ordres executades en este torn (totes de només lectura, o documentals autoritzades) i el seu resultat:

- `node tooling/gates/obrir_torn.mjs --actor Claude --scope code`: `valid: true`, torn `torn_521ee9db-46ae-4d42-a550-4b9ac3f20b00`.
- `node tooling/wiki/document.mjs context … --route auditoria …` i `create …`: rebut `…:50faf196-…`, estat `draft`.
- `node tooling/gates/segella.mjs`: exit 1, ruptura 455a0fad contra 88f0ec03.
- `node tooling/gates/porta-plantilles.mjs`, després d'editar `prompt_local.md` i `skill.md`: «✅ 13 rutes: la plantilla i el contracte diuen el mateix».
- `node tooling/gates/design_guard.mjs --arrel=src`, amb el panell nou: «288 fitxers, 41 critics, 5 avisos. PASSA. El deute de disseny no puja» (41 és la línia base de l'ESTAT de les 06:00).
- `node tooling/gates/porta-olivera.mjs --informe`: exit 1. Sense àncora: el pla 1245 i el prompt 1445 (de MarIA) i el document 1500 (C10). Esta auditoria sí que està ancorada.
- `git diff --stat` i `git status --short`:
  - a `src/`, modificats `ConsolaSection.jsx`, `MurSection.jsx` i `WikiDePobleSection.jsx`; nous `src/config/systemPages.js`, `src/sections/consola/peces.jsx` i `src/sections/consola/mapa/` (6 fitxers);
  - `wikiManifest.js` ja estava modificat en arrencar; el regenera el vigilant de la Wiki del servidor de desenvolupament.
- **Traçat manual de proves:** cada `expect` i cada `assert` s'ha contrastat línia a línia amb el codi. En este procés he trobat i corregit set errors abans d'entregar:
  1. arestes cap a nodes inexistents;
  2. un node absent per a `npm run` d'una ordre que no existix;
  3. tasques duplicades;
  4. la plantilla d'auditoria classificada com a document;
  5. la franja horària de la prova de retenció;
  6. l'edat de la prova de poda;
  7. dates ISO passades a git.
- `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/260924_1410_auditoria_claude.md`: s'executa després d'esta escriptura; el resultat va a la resposta del xat.

**No executat** (el hook no ho permet): `npm test`, `npx vitest`, `node --test`, `npm run lint`, `npm run build`, `npm run porta`, `tancament.mjs` i el navegador. Cap d'estes proves s'ha d'entendre com a passada.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Hook de sessió sense `matcher`.** Denega Workflow, subagents, `AskUserQuestion`, el navegador, Glob, Grep i qualsevol shell que no siga una lectura auditada.
  - L'ordre «ultracode» no s'ha pogut complir: cap workflow ni revisor independent ha corregut. La revisió adversarial ha sigut meua i manual.
  - Les preguntes D1–D5 van per escrit perquè el diàleg de preguntes està denegat.
- **Cap verificació visual.** L'entradeta i el panell del Mapa no s'han vist pintats.
- **Governança bloquejada.** Cap escriptura a `.agents/`, `tooling/`, `.husky/` ni `package.json`. Per això els tractors són al laboratori i el relleu va com a text.
- **Nom d'este document.** El vaig fixar a 1410 abans del `context`, i la creació real és 12:07:26Z (14:07 local). Tres minuts de desfasament. El nom no es pot canviar: el rebut hi està lligat.
- **Previsions.** El que diu C3 sobre el que pintarà el Mapa és previsió a partir de fonts llegides, no mesura.
- **Arbre concurrent.** Un altre actor ha escrit a l'Escriptori i al pla durant el torn (C10). Els meus fitxers de `src/` els he rellegit després de detectar-ho i conserven els meus canvis. No puc garantir que ningú els toque després d'este document.
- **Sense comprovar en execució:**
  - que `lucide-react` es carregue en node (la frontissa ja no ho necessita);
  - el comportament real de git amb índex privat;
  - la resolució d'imports dels tractors al seu destí.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_1245_pla_implementacio_claude]]
- [[260924_1445_prompt_claude]]
- [[taxonomia_documental]]
- [[04_contracte_de_dades]]
- [[05_actors_i_salut]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
