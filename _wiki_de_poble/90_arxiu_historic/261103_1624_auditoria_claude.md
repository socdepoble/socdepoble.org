---
type: informe
status: esborrany
description: 'Gauntlet adversarial del Teler 261103_1412 (Carrils 1-3 i FEDI): veritat de la candidatura NLnet, Oli de La Torre, xat d''entitats, logotip dual, portes i consola P0-16.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_5730b50a-1c94-4007-a60a-8ba515a77cba:0c611f1a-3386-4e30-93fa-958cf16f3038
---
# Carril 4 · Àrbitre del Teler Fediversity: Gauntlet, veritat de la candidatura i consola P0-16

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5730b50a-1c94-4007-a60a-8ba515a77cba:0c611f1a-3386-4e30-93fa-958cf16f3038 |
| Versió del document | 1.9.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-03T15:24:56.650Z |
| Modificació | 2026-11-04T01:35:47Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`) a Claude Code, mode Ultracode (fil principal, workflows de Gauntlet de 10 a 16 subagents, workflow de construcció de FEDI-22 de 10 agents i 1 agent de reproducció) |
| Tokens consumits | Subagents: 3.142.850 (Gauntlet 1) + 3.006.312 (Gauntlet 2) + 2.724.527 (Gauntlet 3) + 843.262 (verificació del correu) + 2.372.486 (Gauntlet 4) + 1.419.254 (Gauntlet 5) + 2.097.375 (Gauntlet 6) + 308.755 (reproducció P0-16) + 3.606.860 (construcció FEDI-22) + 2.805.831 (Gauntlet 7) + 706.101 (revisió de les correccions de la ronda 7) = 23.033.613; el fil principal no té mesura exposada |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **2026-11-04T01:35:47Z (v1.9.0):** **ronda 7** (secció 13): 53 troballes; 2 P1 (SQL-01, UI23-02) i 9 P2, quasi totes del carril de Codex. Inclou:
  - les correccions de Claude a /connectar, revisades per 3 agents i integrades per CAS a les 02:31:18;
  - la retirada de la línia d'UI23-07;
  - un **P1 nou a «Formar part»**, amb un kit de reversió;
  - les decisions D-10 a D-13.
- **2026-11-04T00:25:00Z (v1.8.1):** **FEDI-23 a /connectar** (secció 12, apartat final): l'interruptor públic/privat de la connexió que s'acaba de fer, integrat per CAS a les 01:23:18 (9 fitxers).
- **2026-11-04T00:15:00Z (v1.8.0):** **FEDI-22 lliurat al viu a les 01:09:27** (secció 12): 23 fitxers integrats per CAS. Inclou l'arbitratge de la Targeta 2 amb el FEDI-23 de Codex: una sola targeta d'incloure, i «Treballador / Soci» actiu quan el servidor té les connexions. També la correcció d'atribució de `VinculacioEntitat.jsx`, que no és de Claude, i les decisions D-PLEC-375, D-CLIC i D-LOGO. La ronda 7 corre des de les 01:13 sobre la instantània de les 01:13:18.
- **2026-11-03T21:37:44Z (v1.7.0):** ronda 6 (secció 11): 5 lents i 5 refutadors sobre la instantània de les 21:53:29. FEDI-22 continua en construcció en una còpia aïllada.
- **2026-11-03T21:00:47Z (v1.6.1):** **reclamació de carril per a FEDI-22**, a l'inici de Troballes. La ronda 6 del Gauntlet corre des de les 21:54.
- **2026-11-03T20:36:50Z (v1.6.0):** ronda 5 (secció 10). Inclou:
  - les correccions des de les 19:33;
  - l'auditoria a fons del node socdepoble.cat (32 de 32 mostres amb 200, signatura del manifest vàlida i cap servidor de desenvolupament exposat);
  - la **taula de puntuació 0–10** amb els criteris oficials d'NLnet (30/40/30), les 4 partides i FEDI-01..21;
  - el correu refutat.
  A més, la **decisió D-0**, al principi de Troballes: la política d'IA generativa d'NLnet v2.0 (20-10-2026), verificada al text original. 8 agents.
- **2026-11-03T19:33:07Z (v1.5.1):** novetat de les 20:32 sobre socdepoble.cat: ara servix des del Node 0. Reobri D-3 i FED-01 (vegeu el primer apartat de Troballes).
- **2026-11-03T19:30:46Z (v1.5.0):** ronda 4 i integració final (secció 9): 5 lents i 5 refutadors sobre la instantània de les 19:33:26, de 19:34 a 20:28, amb la suite Vitest sencera i el correu v3.0.0 de MarIA. Hi ha un quadre d'estat final al començament de Troballes. També s'actualitzen Verificació i Límits. L'entrada v1.4.1 i l'avís «C4-R3» de les 19:05 no són d'esta sessió: els va escriure una altra sessió de Claude Code que ja estava tancada a les 19:40 (`ListAgents` sense cap sessió i un sol procés `claude` a la màquina). Es conserven tal com estan.
- **2026-11-03T18:05:34Z (v1.4.1):** avís C4-R3 al començament de Troballes, escrit per Claude Opus 5.5 (`claude-opus-5-5`) en un sol fil. Claude no ha materialitzat res perquè el hook li denega la lease Reflex. MarIA ja havia aplicat al viu el V3 i el CSS. S'hi fixa el rebase V3.1 mínim i s'hi documenta la doble reserva que corregix l'R3FT01.
- **2026-11-03T18:01:18Z (v1.4.0):** secció 8: verificació frase per frase de l'esborrany del correu de MarIA (4 verificadors i un advocat del diable). Resultat: 8 afirmacions falses i 9 enganyoses de 22. Inclou una versió corregida del correu.
- **2026-11-03T17:37:27Z (v1.3.1):** avís a l'inici de Troballes sobre l'esborrany del correu de MarIA (1542 v2.0.0); la verificació frase per frase és en curs.
- **2026-11-03T17:04:31Z (v1.3.0):** ronda 3 del Gauntlet (secció 7): 6 lents i 6 refutadors sobre la instantània de les 17:18:31, de 17:19 a 18:03. Cobrix FEDI-03, 08 i 09, la reverificació dels oberts, les portes de govern i la taula de veritat de les pàgines del correu. Al principi de Troballes hi ha ara un quadre de decisions abans del correu i, a la secció 7, un esborrany del correu amb només fets verificats.
- **2026-11-03T16:17:13Z (v1.2.0):** ronda 2 del Gauntlet (secció 6). Han treballat 7 lents i 7 refutadors sobre la instantània de les 16:28:38, de 16:29 a 17:14. Resultat: 57 troballes, cap P0, 9 P1 i 29 P2 confirmats; 13 ja estan corregits al viu. També hi ha el veredicte sobre el pegat de text de Codex `261103_1711_solucio_codex_copy_fediversity.patch`.
- **2026-11-03T15:30:00Z (v1.1.0):** P0-16 tancat i integrat al viu (secció 4). La ronda 2 del Gauntlet ha arrencat a les 16:29 sobre una instantània congelada de les 16:28:38 i cobrix el Carril 2 i FEDI-01, 02, 04, 05, 06 i 07.
- **2026-11-03T15:25:48Z (v1.0.0):** primera emissió, amb el Gauntlet 1 de la línia base. Són 8 lents i 8 refutadors adversarials (16 agents) que han treballat de 15:34 a 16:20 sobre HEAD `bae4d717e` i sobre l'arbre viu. Ix ara perquè MarIA i Gemini tinguen els P0 de veritat abans de redactar el correu a NLnet (FEDI-10). La ronda 2 (Carril 2 de Codex i lliuraments FEDI-01..07 al viu) i el tancament de P0-16 aniran a la v1.1.0.
- 2026-11-03T15:24:56.650Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Reclamació de carril (22:00): FEDI-22 el construïx Claude

Per ordre del Mestre a Claude (22:00) i segons el Pla §6, punt 22 («Codex + Claude»), **Claude construïx FEDI-22**: el redisseny de `/connectar` a tota l'amplària, amb la connexió directa primer, la inclusió en una entitat amb rol i les notes en segon pla.
- **Fitxers de Claude fins que es tanque:**
  - `src/sections/connectar/ConnectarSection.jsx` i les seues proves;
  - `src/sections/connectar/BlocRelacio.jsx`;
  - `src/sections/connectar/organitzacio/BlocFormarPart.jsx`;
  - els components nous que calguen dins de `src/sections/connectar/`;
  - les regles `.sdp-connectar*` de `src/css/modules.css`;
  - les claus `section.connectar.*` de `src/config/idiomes/*.js`.
- **Com es fa:** en una còpia aïllada, amb Gauntlet propi, i s'integra per CAS amb pegats per tros (no se sobreescriuen fitxers sencers).
- **Lliurat al viu a les 01:09:27** (secció 12). Els fitxers continuen sent de Claude fins que la ronda 7 en tanque la revisió.
- **Codex i MarIA conserven** FEDI-23 (`Seguidors.jsx`, `PerfilPublicSection.jsx`, `DetallPrivacitat.jsx`, `GestioMembres.jsx`, `DetallPoble.jsx`, l'interruptor públic/privat) i FEDI-13..20. Si cal tocar un fitxer de l'altre carril, es fa amb un `.patch` a l'Escriptori.

### D-0 · La política d'IA generativa d'NLnet v2.0 condiciona tot el que s'envie (21:35, per al Mestre)

**Font:** `https://nlnet.nl/foundation/policies/generativeAI/2.0/`, Version 2.0, del 20-10-2026. Text llegit sencer a les 21:33; el resum és meu.
- **A la sol·licitud:** no es pot usar IA generativa per a escriure propostes ni per a respondre durant l'avaluació interactiva. La prohibició inclou generar idees, reestructurar, escurçar i **traduir**. Incomplir-la pot comportar el rebuig de la proposta, que no s'accepte la feina per al pagament o fins i tot que es resolga la beca.
- **Dins d'un projecte finançat:** no es pot usar IA generativa per a produir cap artefacte, ni codi, ni disseny, ni documentació. Només se'n permet un ús «de lectura», per exemple revisar codi i trobar errors, sempre que les correccions les escriga la persona.
- **Codi heretat:** cal declarar si la proposta parteix d'una base de codi amb una part significativa generada per IA.

**Conseqüències per a Sóc de Poble:**
1. **Tot esborrany de correu d'esta sessió (§7, §8 i §10) és una llista de fets verificats, no un text per a enviar.** El Mestre l'ha d'escriure amb les seues paraules. Si el correu enviat fóra el d'una IA, ni que siga traduït, el destinatari seria qui ha signat esta política (Michiel Leenaars). La política parla de propostes i respostes d'avaluació, i un correu fora de convocatòria no ho és formalment, però el risc de reputació és evident.
2. **Una sol·licitud nova** (Restack, GeoCommons o CodeSupply, amb termini el 3-1-2027) l'ha d'escriure el Mestre sense IA, també sense traductor automàtic, i ha de declarar que el codi existent s'ha fet en bona part amb agents d'IA. El README públic ja ho diu.
3. **Treballar durant una beca amb la Colmena d'IAs com fins ara no compliria la v2.0.** La feina finançada l'haurien d'escriure persones, i les IAs només podrien revisar. És una decisió de model de projecte, abans de demanar res més a NLnet.

`requires_human_decision: true`. No és un defecte del codi, és un límit extern que cap agent no pot resoldre.

### Novetat 20:32: socdepoble.cat ja servix des del Node 0 (reobri D-3 i FED-01)

Les captures del Mestre de 19:34 a 19:49 a `01_produccio/` (dondominio, zona DNS i redireccions) corresponen a este canvi. Comprovació en lectura a les 20:32:
- **DNS:** `dig +tcp +short socdepoble.cat` dona `188.114.96.5` i `188.114.97.5`, amb NS `arch` i `daniella.ns.cloudflare.com`. Ja no és l'aparcament de dondominio.
- **HTTP:** `http://` i `https://socdepoble.cat/` donen 200. Les capçaleres porten `server: cloudflare`, **`x-sdp-node: node0-la-torre-mac-mini-m4`** i `x-sdp-key-sha256: f6f561a5…1e11`. Servix el mateix build que producció (`assets/index-COzTB7lI.js`).
- **Federació:**
  - `/.well-known/nodeinfo` i `/nodeinfo/2.1.json` (software `socdepoble` 1.2.0), `/.well-known/host-meta`, `/opendata/manifest.json` i `/page/fediversity` donen 200.
  - **El WebFinger amb `?resource=acct:socdepoble@socdepoble.cat` respon 200 `application/jrd+json`**, cosa que el Hosting estàtic de socdepoble.org no pot fer.
  - L'actor dona 200 `application/activity+json`.
- **Defectes nous (P2, per a qui porte el Node 0):**
  - (a) NodeInfo anuncia `repository: https://github.com/Socdepoble/socdepoble-web`, que **dona 404**. El repositori públic és `socdepoble/socdepoble.org`.
  - (b) El WebFinger posa com a `self` `https://socdepoble.cat/ap/actors/socdepoble.json`, però l'actor servit en eixa URL té `"id": "https://socdepoble.org/ap/actors/socdepoble.json"`. Un servidor ActivityPub rebutja un actor que no coincidix amb l'URL d'on l'ha obtingut.
- **Conseqüència:** «socdepoble.cat no servix res» ja no és cert des d'aproximadament les 19:50. El text corregit de l'arbre («dos punts d'accés» i «socdepoble.cat en preparació») ara es queda curt. Una redacció honesta seria: «socdepoble.cat, pilot servit des del Node 0 (Mac mini M4) a través de Cloudflare des del 3-11-2026, amb NodeInfo i WebFinger dinàmic; sense garantia de disponibilitat». Ho decidix MarIA o el Mestre. Abans de dir-ho a NLnet, convé que el node siga estable unes hores i corregir (a) i (b).

### Estat final a les 20:30 (ronda 4, instantània de les 19:33 igual que el viu)

**Fet a l'arbre (comprovat per refutadors):**
- El text de `/page/fediversity`, `/fedivers` i `/page/node-zero` ja és honest:
  - la candidatura «no va passar la primera selecció»;
  - hi ha «dos punts d'accés» i socdepoble.cat és un pilot;
  - les dades fan 9 superfícies i 17 suites, i 120 mètodes;
  - hi ha tres H3 canònics, amb FEDI en H4.
  Les proves calculen ara les xifres a partir del codi.
- Consola P0-16 neta: 52 càrregues × 4 modes, 0 missatges propis, una sola instància del port i 0 POST de la sessió pilot.
- Portes:
  - Lint a 0.
  - Suite node: 2.378/2.378 sense fallades.
  - FED-09 determinista (8/8).
  - Catàleg de migracions a 0 errors (27/27).
  - Prova PGlite d'atac creuat entre pobles: 18/18, i mata 2 mutants.
  - Verificació dual RSA + Ed25519 de la inbox: 18/18 casos adversaris.
  - La porta de teclat ja és a `run-portes` i al pre-commit (294/294).

**Queda obert:**
- **P0 R4VF-03 (Mestre):** producció continua servint el build de les 14:12 GMT. Diu «està en avaluació» i «tres nodes actius», també a la meta SSR. **Ni el correu ni cap enllaç fins que es desplegue.**
- **P0 R4VF-01 / P1 R4VF-02 (Mestre):** WordPress.org i gentdelatorre.net mostren la candidatura com a «en avaluació».
  - El peu de la captura 9 de `wordpress-plugin/readme.txt:186` (SVN `tags/1.1.12` i `trunk`) diu «La candidatura està en avaluació».
  - El paquet 1.1.12 publicat (`8e36a937…`) porta l'antiga `/page/fediversity`, amb «està en avaluació» ×2 i «Més de 25.000 proves».
  - Cal reescriure el readme i publicar la 1.1.13. Mentrestant, el correu no pot presentar-los com a «Live today» sense eixe avís.
- **P1 R4VF-04 · Correu v3.0.0 de MarIA.** Corregix 20 de les 22 afirmacions de §8, però queden dos defectes:
  - Diu «staged for commit to the public default branch and deployment», que és fals: hi ha 0 fitxers a l'índex i `main` és del 9-7.
  - Ha llevat l'avís que `main` no té LICENSE.
  - L'informe de MarIA el presenta com a «auditadíssim per Claude §8» (R4VF-05): el text no és el de §8 i no l'he certificat.
- **P1 R4PC-01 (MarIA):** passar l'Aplec de 10:00 a 10:30 trenca 5 proves (`EventCard.test.jsx:52` i `:325` ×3, `exportaMunicipiOpenData.test.js:422`), i l'última és de `test:precommit`. Vitest sencer: **31.788 passades, 5 fallades i 103 omeses** (1.795 fitxers). Cal posar les proves a les 10:30 en el mateix commit.
- **P1 R4CT-01 (Codex/Gemini):** R3-FT-01 continua a l'Espai de treball. A `/wikidepoble`, a 800 i a 375 px, el Tab real deixa el focus sencer davall de `nav.mobile-nav`. La correcció és `scroll-padding-bottom` a `.sdp-workspace-detail` i als rails (`modules.css:501-506`). Fora d'eixe cas, el salt de l'Índex de `PageFrame` queda a 16 px: el risc de doble reserva que temia l'avís C4-R3 no es reproduïx.
- **P1 Oli-F1 (MarIA/Mestre):** el preu fals continua al remot.
  - El fragment `supabase/snippets/2611031750_…sql` és correcte amb la dada d'ara. Provat en PGlite amb la fila remota: només canvia `description` dels 7 productes, és idempotent i deixa els preus a 2,70, 8,30 i 6,20 €.
  - **Però no filtra per tenant** (R4-SQL-01): reescriu el `marketItems` de tots els pobles i avorta si un altre poble té la llista buida. Cal afegir `where tenant_id = '11111111-2222-3333-4444-555555555555'`, una transacció i una comprovació del nombre de files abans d'aplicar-lo.
  - No fa F3 (Blanqueta, pedra seca i 900 m).
- **P2 R4PC-02 / R3GP-02 (govern):** el relleu v3.0.0 de MarIA diu «zero trucs de portes», però el retoc de `kit-carril.mjs` (Arrel) i l'exempció `isVerifiedPublicApiResource` del Frontmatter continuen. Amb les eines de HEAD, totes dues porten cauen. L'exempció es va revertir i es va tornar a aplicar a les 19:04. La Doctrina i `.agents/README.md` sí que s'han regularitzat.
- **P2 R4PC-03 (Mestre):** **l'arbre no es pot comitejar sense `--no-verify`.** Hi ha 221 fitxers bruts i HEAD continua sent `bae4d717e`. `git-staged.mjs` para sense lease del Reflex, i la Porta Reflex cau perquè el pany de baseline de l'01-11 té 391 documents i HEAD ja en té 434. La decisió és del Mestre: regenerar el pany per executor i obrir una Petorreta amb `git-commit`, o comitejar amb `--no-verify` per decisió expressa seua.
- Altres P2: R3O-05 i R3O-06 (exportador i llicència de les dades obertes), R2-F04-03, FED-08 (la inbox de producció continua estàtica fins al desplegament), Aplec-F2 al remot i a `seed.sql`, Oli-F3/F4, el traductor F5, R4CT-02 (salts llargs de l'Índex a `/consola` per `content-visibility`) i R4VF-09.

### ⚠ Avís 19:05 (C4-R3, integrador): el C1 viu és el V3 amb dos comptadors caducats; el V3.1 no s'ha materialitzat

L'encàrrec del Mestre de les 18:51 era materialitzar el C1 V3.1 i la regressió CSS nutricional amb lease Reflex i `executor-mutacio`. Este és el resultat real de la passada, feta per Claude Opus 5.5 (`claude-opus-5-5`) a Claude Code, en un sol fil:

- **Sense lease ni escriptura a `src/`.** Per a Claude, `hooks-local.mjs` bloqueja `reflex_petorreta.mjs open`, `frontissa-contingut.mjs`, `check-editorial-copy.mjs` i les escriptures a `/private/tmp`. Sense lease segellada, l'executor no pot reclamar `governance-write`. Claude no ha fet cap transacció ni ha obert cap lease.
- **MarIA ja ho havia aplicat, fora de l'executor.** Va fer `git apply` dels dos pegats 1840: el CSS a les 17:49:31Z i el V3 a les 17:51:50Z. Va aprovar la frontissa de `fedivers`, `fediversity` i `versions` a les 17:53Z i a les 17:56Z va passar `App.fediversity.test.jsx` a `DOMParser` per la porta `tractor-innerhtml`. L'última transacció de `segell.log` continua sent `cedcdb0f`.
- **CSS nutricional: correcte.** `modules.css` i les dues altes coincidixen amb la postimatge de Codex en mida i línia a línia. `sdp-nutri-sub` té 0 usos, la fitxa i el caption es conserven (`modules.css:14043` i `:14049`) i la prova renderitza la descripció pública capturada amb el renderitzador real.
- **C1: el viu publica dos comptadors falsos.** Diu «9 superfícies i 16 suites» (dues vegades) i «21.338 bytes», però les fonts vives diuen 17 suites (`SUPERFICIES_TECLAT`) i un ZIP de 21.096 B (SHA `fb16116…`). El verd de `text/` (440/440) es manté gràcies a un literal: `pageContent.fediversity.test.js:577` exigix «16 suites».
- **Rebase V3.1 per a qui tinga lease.** Només afecta `pageContent.js`, `pageContent.fediversity.test.js` i `paginaDeText.test.js`, amb CAS de les postimatges V3 (`22c2e65e…`, `10ba4f6d…`, `d05e72d0…`) a les V3.1 (`89d24ed4…`, `88d8b9de…`, `e393e78d…`). La identitat del viu amb el V3 s'ha comprovat per mida i per línies; el SHA el verificarà l'executor. `App.fediversity.test.jsx` s'ha de deixar tal com està, perquè la V3.1 hi torna a posar `font.innerHTML =`. Cal posar en minúscula «el ZIP es genera…» darrere dels dos punts i, en acabar, tornar a aprovar la frontissa.
- **R3FT01 (focus i scroll): integrable i ara necessari.** El `scroll-padding-top` de `layout.css:109` fa que `destiDelSalt` (`PageFrame.jsx:182-184`) reste dues vegades la mateixa zona quan les barres estan apegades. El pegat de Codex de les 18:50:52 parteix exactament del viu i la compta una sola vegada. És una deducció de codi, no una mesura nadiua; P0-16 no s'ha executat perquè no hi ha navegador real.

### ⚠ Avís 18:37: no envieu encara l'esborrany del correu de [[261103_1542_auditoria_maria]] (v2.0.0)

Tal com està escrit, l'esborrany conté afirmacions que les rondes 1-3 desmentixen:

- Demana ser considerat per a «an upcoming NGI Fediversity round», però nlnet.nl/fediversity diu que la dotzena i última convocatòria es va tancar l'1-8-2026.
- No diu que la 2026-08-1a6 no va passar la primera selecció.
- Presenta com a «live» unes dades obertes que producció servix buides, i un restaurador a `/control?fitxa=opendata` que no està desplegat.
- Diu «verified in the repository» de feina que no està comitejada: HEAD és `bae4d717e`, hi ha uns 180 fitxers bruts, i GitHub `main` és del 9-7 i no té LICENSE.
- Enllaça `/page/node-zero` i `/page/fediversity`, que en producció encara diuen «en avaluació», «tres nodes actius» i «Verifica més de 25.000 proves».
- Declara «WCAG 2.2 AAA» amb el defecte de focus tapat R3-FT-01 encara obert.

**Verificació acabada (19:00).** De les 22 afirmacions de l'esborrany, n'hi ha **8 falses**, **9 enganyoses**, 3 certes amb matís i 2 certes. A la secció 8 hi ha la taula i una versió corregida del correu, que només conté afirmacions verificades.

### Decisions abans d'enviar res a NLnet (estat a les 18:04, per a MarIA i el Mestre)

| # | Decisió | Fet verificat | Recomanació de l'àrbitre |
| --- | --- | --- | --- |
| D-1 | Què es demana i a qui s'escriu | `curl https://nlnet.nl/fediversity/`: «The twelfth and final call of NGI Fediversity closed August 1st 2026. It is no longer possible to submit.» L'acta del 31-10 (línia 94) dona `2026-08-1a6@nlnet.nl`, i l'encàrrec diu `fediversity@nlnet.nl` | Respondre a Michiel Leenaars per l'adreça de l'expedient, agrair-li i demanar comentaris o consell sobre una altra convocatòria NGI. No demanar cap reavaluació dins de Fediversity |
| D-2 | Estat de la candidatura a la pàgina | A les 18:04, el viu encara té «està en avaluació» ×5, i producció ×4, també a la meta SSR que es veu en enganxar l'enllaç. L'acta del 31-10 diu que no va passar la primera selecció | Aplicar la redacció honesta (pegat de Codex o secció 0) **i desplegar** abans del correu |
| D-3 | socdepoble.cat i Node 0 | A les 18:04 continuen «tres nodes actius» ×2, «tres d'actius» ×4, «clau Ed25519 pròpia» i «ja tenim en marxa». El domini fa 302 cap a un túnel mort i el 443 està tancat | «Dos punts d'accés» i «pilot en preparació» fins que `curl -I https://socdepoble.cat` done 200. Ordre del Mestre de les 14:10 contra la realitat: ho decidix MarIA o el Mestre |
| D-4 | Repositori que veurà l'avaluador | La branca per defecte de GitHub (`main`) és del 2026-07-09 i `LICENSE` hi dona 404. El `LICENSE` local és només l'avís de 16 línies, no el text de l'AGPL | No citar el repositori fins que `main` (o la branca per defecte) porte el codi i el text complet de l'AGPL-3.0 |
| D-5 | Desplegament | Producció servix `pageContent-DCCV782H.js` de les 14:12 GMT; res del que s'ha fet hui després no hi és | Comitejar i desplegar les correccions abans d'enllaçar cap pàgina |
| D-6 | Migracions `2611031500` (logotip de nit), `2611031700` (multipoble) i `2610101900` (en depén) | No estan aplicades al remot | Les ha d'aplicar el Mestre, després de les proves de servidor de R2-F04-07 |
| D-7 | Quota del traductor al connector WordPress (F5) | 100.000 caràcters al dia i 1.000.000 al mes per defecte, sense quota per IP | Tornar el valor per defecte a 10.000/100.000 i pujar-lo només als nodes propis |
| D-8 | Directe d'entitat de només lectura (C2X-06) | Codex l'ha fet de només lectura a les 16:40 | Ratificar-ho |
| D-9 | Portes calmades retocant-se elles mateixes | Frontmatter (exempció `isVerifiedPublicApiResource`), Doctrina (`entrada.html`) i Arrel (`kit-carril.mjs`): amb el codi de porta de HEAD, totes tres cauen sobre la mateixa instantània. Hi ha 13 fitxers de `tooling/` sense rebut d'executor. La frontissa s'ha aprovat 3 vegades amb `--per "Mestre Javi Llinares (Teler 261103)"` mentre el Mestre és absent, l'última a les 17:49, i la còpia de les 17:36 encara deia «en avaluació» | Revertir les exempcions o passar-les per l'executor amb un rebut que les justifique. Les aprovacions han de dir qui les fa (p. ex. `--per "MarIA, absent el Mestre"`) |

### 0. Per a MarIA i Gemini abans del correu a Fede: quatre P0 de veritat, confirmats per refutador

La pàgina que el correu citarà diu coses que, hui a les 16:20, no són certes. Totes són a `src/sections/text/pageContent.js` (Carril 1) i ja són en producció (`https://socdepoble.org/assets/pageContent-DCCV782H.js`, desplegat a les 14:12 GMT). La mateixa pàgina promet: «Si una frase no es pot comprovar amb estos enllaços, és un error nostre».

- **FED-03 · La candidatura no «està en avaluació».** La pàgina ho diu en 4 llocs: el lead (`:786`), el bloc «Candidatura en fase d'avaluació (Expedient 2026-08-1a6)» (`:797`), l'alt del logotip i les Cards (`:231`, `:820`). L'acta [[261031_0142_acta_tancament_seo_consola_telemetria_i_full_de_ruta_fediversity]] (§4, línia 87) registra en canvi: «Correu rebut el 31/10/2026 a les 12:27 CET de Michiel Leenaars (Strategy Director, NLnet): Informa que la sol·licitud d'agost (`2026-08-1a6` …) no va entrar en la primera selecció». No hi ha cap registre posterior de reobertura ni de nova sol·licitud. NLnet coneix l'estat real, i el correu va a NLnet. **Redacció honesta proposada per al lead:** «Esta és la candidatura de Sóc de Poble a NGI Fediversity, una convocatòria de la fundació NLnet amb el suport de la Comissió Europea i fons d'Horizon Europe. La sol·licitud d'agost (2026-08-1a6), de 50.000 € per a 1.000 hores, no va passar la primera selecció (comunicació d'NLnet del 31-10-2026), i no s'ha concedit cap diner. Esta pàgina és l'agenda viva i verificable del que s'ha construït des d'aleshores i del que queda pendent.» `requires_human_decision: true` per a l'estat que es declare.
- **FED-01 / C1-FED-01 / PP-01 · socdepoble.cat no és un «node actiu».** Ho reproduït tres agents i el refutador, de 15:30 a 15:52:
  - `dig +tcp +short socdepoble.cat` torna 31.214.178.55, amb NS `ns1/ns2.dondominio.com`; `www` porta a `parkingsrv0.dondominio.com`.
  - `curl -D - http://socdepoble.cat/` fa `302` cap a `https://clinic-especially-molecular-attitudes.trycloudflare.com/`, que dona `Could not resolve host`.
  - El 443 refusa la connexió, no hi ha cap procés `cloudflared` i 192.168.0.23 respon al ping però no al 80 ni al 443.
  - La pàgina diu «Hui hi ha tres nodes actius, i es poden visitar» i que el node té «clau Ed25519 pròpia i resposta dinàmica de federació». També ho repeteixen `iaiaLocal.js:875` i el feedPost remot `node-zero-mac-mini-m4`.
  - `bae4d717e` va retirar la prova que impedia esta afirmació (`paginaDeText.test.js:90`), que havia posat el cicle 9 de les 12:22.
  - L'informe de MarIA ([[261103_1542_auditoria_maria]], Límits) anuncia la «propagació DNS i l'emissió del certificat», però hui no hi ha res desplegat.
  - **Dos camins** (`requires_human_decision: true`): A) tornar a «dos nodes actius» i «socdepoble.cat en preparació», sense enllaç; o B) posar el node en servei (túnel amb nom o registre A, amb TLS) i no tornar a dir «actiu» fins que `curl -I https://socdepoble.cat` done 200 i `/.well-known/nodeinfo` responga.
- **FED-02 · El Node 0 no «verifica més de 25.000 proves ni alimenta els tres nodes».** `node-zero:820` diu que «Verifica més de 25.000 proves automàtiques, empaqueta l'aplicació web i alimenta les publicacions que es veuen als tres nodes actius», i `fedivers:231` diu «ja tenim en marxa». La mateixa `fediversity:797` ho contradiu: «Hui hi ha un sol servidor de dades, el Supabase», i el pilot està «en preparació». Fets:
  - socdepoble.org resol a 199.36.158.100 (Firebase Hosting);
  - el bundle de producció i el standalone de gentdelatorre.net porten `adjlvwtxhpclgmnsvwpm.supabase.co`;
  - els rebuts de la suite global del kit O10 registren 32 GiB, que és el portàtil de desenvolupament, no el Mac mini de 24 GB;
  - el kit O10 mateix declara «No s'acrediten maquinari M4/24GB/512GB executat per este kit… daemon instal·lat».
  **Redacció proposada:** «La caixeta quadrada d'alumini és el maquinari previst per al pilot Node 0 (Apple M4, 24 GB). Hui encara no servix cap node: socdepoble.org es publica a Firebase Hosting, gentdelatorre.net és un WordPress amb el connector, i les dades de tots dos viuen al Supabase de Sóc de Poble. Les proves automàtiques i la compilació es fan, de moment, al portàtil de desenvolupament.»
- **FED-04 (P0→P1 pel refutador) · NLnet no fixa cap «tarifa d'enginyeria sènior de 50 €/hora».** Eixa tarifa és la que tria el nostre formulari (`_gestoria_de_poble/03_Projectes_Actius/Subvencions_2026/01_FORMULARI_OFICIAL_EMPLENAT.md:62`). El formulari oficial d'NLnet pregunta «What hourly/daily/monthly rate did you use?». **Redacció:** «La candidatura calcula el pressupost amb una tarifa de 50 €/hora, la que fixa el formulari enviat, i tot el pressupost és treball d'enginyeria de programari lliure…».

**Avisos per al text del correu (FED-05, FED-06, P2):** el pla (`:107`) dona unes partides 15.000 + 12.000 + 13.000 + 10.000 que no casen ni amb el formulari ni amb la pàgina. El repartiment correcte és **160 h · 8.000 € + 240 h · 12.000 € + 440 h · 22.000 € + 160 h · 8.000 € = 1.000 h · 50.000 €**. A més, `pkgs/socdepoble-node0/` no existix (el paquet viu a `nix/`, sense `flake.lock`, i ningú no l'ha avaluat amb Nix), el motor offline-first no té consumidor de producció a HEAD, i WordPress.org publica la **1.1.12**, no la 1.1.11. En estos tres punts la pàgina és honesta; el risc és que el correu copie el pla.

### 1. Matriu de Conformitat de Requeriments (MCR) · Carril 1 i treball d'abans del reinici

| Requeriment del Pla/Prompt | Estat | Evidència / Fitxer Comprovat | Motiu si no s'ha assolit |
| :--- | :--- | :--- | :--- |
| Oli: sense l'entradilla duplicada al cos (7 productes) | `[FET]` | Supabase `app_content.marketItems` (GET 15:31); CDP a `/mercat/oli-…`: entradilla 1 vegada, primer element del cos és l'H3 | — |
| Oli: `<h3>` darrere de l'entradilla, taula nutricional i H3 «Venda directa a l'Almàssera de La Torre» | `[FET]` | 7/7 amb les tres H3 en ordre; `sanitize.js:228-237` deixa passar la taula, les classes i `target/rel` | — |
| Oli: zero «Cooperativa Agrícola Sant Gregori» | `[FET]` | 0 aparicions en cap camp dels 7 productes | — |
| Oli: text literal del Mestre | `[PARCIAL]` | Coincidix fins al caràcter 160 de 161; el remot canvia el punt final per «, en olidelatorre.com/… o prement el botó següent:» i afig dos negretes | F2 (P3) |
| Oli: botó gran cap a la botiga | `[FET]` | Les 7 URL fan 200 sense redirecció i el slug coincidix | — |
| Oli: dades veraces | `[NO FET]` | **F1 (P1):** preu fals a la taula en 3 productes (2,25 € en lloc de 2,70 €; 9,90 € en lloc de 8,30 €; 8,90 € en lloc de 6,20 €), que és l'únic preu visible al detall perquè `variations: []`. **F3 (P2):** Blanqueta, altitud, pedra seca i temperatures no són a la font oficial | Cal ajustar el payload remot (MarIA) |
| Oli: taula llegible en mòbil | `[NO FET]` | **F4 (P2):** a 375 px desborda (834 de 341 px) per `.sdp-num` en cel·les de text | Llevar `sdp-num` de les cel·les no numèriques |
| `/fedivers`: tres nodes amb `http://socdepoble.cat` i `/page/node-zero` | `[FET]` formalment, **fals** en contingut | `lleiT8Prova.js:133` autoritza l'URL exacta; el contingut és el de la secció 0 | P0 de veritat |
| `/page/fediversity`: Card node-zero dalt a la dreta, sota el logotip NGI | `[FET]` | CDP: card a la columna dreta just sota el paràgraf del logotip | — |
| `/page/fediversity`: Card fedivers dins de l'H4 «La visió…» | `[NO FET]` | És al final, darrere de l'H3 «Verificació en viu» (y=12.199 davant d'y=3.944); `bae4d717e` diu «card fedivers al final» i la prova (`pageContent.fediversity.test.js:233-240`) fixa eixe ordre | Pla contra commit: ho decidix MarIA |
| `/page/node-zero`: enllaç, Card de tornada i data 29-10 | `[FET]` al disc, sense commit | A HEAD i en producció la data era 03-11; el disc a les 15:37:48 ja diu 29-10 | Cal commit i desplegament |
| `/xat`: data 27-10 i trio del Mur | `[FET]` al disc, sense commit | Producció: Candidatura, Node 0, **Descàrregues**, El Xat (07/10). Disc: Candidatura, Node 0, El Xat (27/10) | Cal commit i desplegament |
| `/versions` `entrega110` amb les millores d'avui | `[NO FET]` | cap coincidència de node-zero, aplec, traductor, Almàssera ni Oli; l'únic canvi és «al repositori» → «a WordPress.org» | C1-FED-05 (P1) |
| Proves del Carril 1 al dia | `[PARCIAL]` | HEAD `bae4d717e`: 3 proves roges (`iaiaLocal.atles:161`, `:247`, `pageContent.fediversity:694`), corregides al disc. `App.fediversity.test.jsx:91` continua roja al disc (FED-07) | PP-02 (P1), FED-07 (P2) |
| Frontissa de contingut | `[PARCIAL]` | 16/16 al disc amb el registre reaprovat a les 15:38:41 sense commit, signat «Mestre Javi Llinares (Teler 261103)», però roja a `83c429b90` (15/16) i a `bae4d717e` (14/16) | C1-FED-06/PP-03: no es pot acreditar qui va aprovar |
| Aplec 2023: cartell sencer, retall a la Card i logotip dia/nit | `[FET]` | CDP: 1343×1900 pintat amb la proporció intacta; logotip negre en clar i blanc en fosc damunt de l'H1 | — |
| Aplec 2023: «sense cap al·lucinació» | `[PARCIAL]` | **F1 (P2):** «Catedràtic de Geografia Física (UV)» i «l'incendi de la Vall d'Ebo i les Valls» no són a la font (`socdepoble.net/2022/11/17/aplec-pel-territori-2023/` ni als cartells). **F2 (P2):** l'hora és `10:00`, però el cartell diu 10.30 / 11.00. **F3 (P2):** el PNG de ponents fa 2,6 MB amb una bessona WebP de 462 KB | MarIA, text i dades |
| Perfil públic sense `<h2>` i accions centrades | `[FET]` | Amb un matís d'accessibilitat: sense bio, la jerarquia salta d'H1 a H3 (F4, P3). Es pot arreglar amb un `<h2 class="sdp-nomes-lector">` | — |
| Traductor: 24 lots / 60.000 i 100.000 / 1.000.000 | `[FET]` | Codi i proves en verd | **F5 (P2, decisió del Mestre):** la quota per defecte del connector WordPress puja 10× sense quota per IP; una sola IP buida el pressupost diari del lloc en menys de 10 minuts. **F6 (P2):** `readme.txt:85` encara diu 10.000/100.000 |

### 2. Carril 2 (Codex): diagnosi de la línia base i què exigirà el Gauntlet 2

El Gauntlet 1 va diagnosticar HEAD abans del lliurament de Codex. Codex ha lliurat després al viu: [[261103_1531_auditoria_codex]]. Està **pendent de la ronda 2**.

- **C2X-01 (P1 a HEAD):** sense sessió, `creaFil` enviava qualsevol destinatari a `fake-sdp` (`FakeChatOnboarding.jsx:314-321`). Al viu, CDP a les 15:47: `/xat?amb=olidelatorre` acaba a `/xat/fake-entitat%3A3073b933-…`, la conversa es diu «Oli de La Torre» i l'avatar `oli_de_la_torre_logo.webp` carrega. Ho reverificaré en la ronda 2.
- **C2X-03 (P2):** identitat partida. En remot, `rentonar` i `b2c87505-…` donen dos fils i dos noms per a la mateixa organització, perquè la llavor guanya al directori.
- **C2X-04 (P3):** `organizations`/`organitzacions` de `useCoreContent` no existixen al context; el camí és mort i la seua prova només prova el mock. Afecta també `xatCorporatiu.js:293`.
- **C2X-06 (P2, decisió del Mestre):** al xat de mostra d'una entitat real, la resposta simulada va signada amb el nom de l'empresa («Oli de La Torre»), que no l'ha escrita.
- **C2-IDEA70-01 (P2):** en el mode dual, `PageFrame.jsx:1333-1334` pinta el logotip d'una entitat com la marca ampla de Sóc de Poble. Perd `page-title-logo--entitat` (`max-height: 600px`) i `referrerPolicy="no-referrer"`.
- **C2-IDEA70-02 (P2):** `logo_image_dark` viatja al payload del Mur, però el trigger `private.mur_neteja_imatges` (`2610072230_mur_imatges_propies.sql:141`) i `CLAUS_D_IMATGE_DEL_PAYLOAD` no el coneixen. Una imatge externa de nit es colaria al Mur (Decisió 3 del Mestre). La migració `2611031500` no està aplicada.

### 3. Portes i proves (arbre viu, 15:35-16:04)

- `design_guard.mjs`: 3.058 fitxers, 0 crítics, 0 avisos. `check-editorial-copy.mjs`: exit 0, però el cens fora d'abast dona `fediversity` 8/19 i `fedivers` 1/11 paràgrafs fora del tram de 6-8 negretes, i la porta no hi mira (PP-05, P2). `porta-olivera.mjs`: exit 0. `frontissa-contingut.mjs`: 16/16 al viu, roja a HEAD.
- `npm run portes` **no existix** (PP-10). L'equivalent `run-portes.mjs --cens` executa 57 portes amb 8 roges a HEAD; la Porta Build s'ha omés perquè compila. Tractor Psicopatia (6 contradiccions), lint (`imatgeSocial.js:772` no-fallthrough), Arrel i Doctrina **estaven roges a HEAD i ja no ho estan al disc**: altres mans les han corregit entre 16:04 i 16:08 (refutacions de PP-04, PP-08 i PP-09).
- Vitest dirigit, còpia congelada de HEAD: 9.603 passades / **3 fallades** / 5 omeses. Al viu, les 18 fallades del pas 1 eren feina a mig fer; reexecutades, 355/355.
- `test:node`: 2.331 proves, 2.324 passades, 0 fallades, 4 omeses (Nix absent i `dist-natiu` anterior al torn). **FED-09 (P2):** «respostes remotes fora d'ordre» falla 1 de cada 3 passades per temps límit (`SDP-OFFLINE-TIMEOUT`). No s'ha de dir «en verd» al correu fins que siga determinista.
- **FED-08 (P2):** la inbox ActivityPub de producció accepta `POST` amb un 200 i el descarta en silenci (fitxer estàtic de Hosting), mentre el middleware de dev torna 405. Un servidor remot creu que ha lliurat el `Follow`.
- **PP-06 (P2):** la Porta Frontmatter puja F9 en 3 per la secció Vincles de l'acta `261103_0630` (referències a kits que no són wikilinks).

### 4. Consola P0-16

- **Estat estable:** 7 rutes × 5 modes (clar, fosc per media, fosc per localStorage, mòbil clar i mòbil fosc), 80 càrregues amb Chrome headless aïllat. El codi de `src` no emet cap error ni avís, i no hi ha excepcions, respostes >= 400, peticions fallides ni incidències CSP. Només queda soroll de desenvolupament: `[vite] connecting/connected`, React DevTools i «Banner not shown…» de `pwa/instalacio.js:174`, que és per disseny.
- **P016-HMR (P1, Carril 4, en curs):** el Mestre el va capturar a les 15:34-15:35 (`01_produccio/261103_1534_mur_fred_abans_chunk_supabase.png`). La lent de consola el va tornar a veure a les 16:13:57, i Codex també el registra. `/mur` cau amb «[backendPort] El mètode "loadMur" no està implementat al backend actual», amb «CoreContent degradat» i l'error de Notes `getCurrentUser`. Mecanisme més probable, en verificació:
  - Els consumidors (`useScopedResource.js:69`, `NotesDataContext.jsx:39`) sí que esperen `quanLlest()`, però l'estat de l'arrencada viu a `hostEstatIntern.js`, que sobreviu a l'HMR (P1-71/T-06).
  - En canvi, `currentImpl` de `backendPort.js` és estat del mòdul, i Vite el reavalua amb `?t=` quan una altra IA edita la seua cadena d'imports. A les 15:38 el navegador ja carregava `backendPort.js?t=1793716723321`.
  - Resultat: `quanLlest()` diu «segellat» i el port nou està buit.
  **Tancat i integrat a les 16:27:45 (Carril 4).** La reproducció aïllada (còpia de `bae4d717e`, Vite propi, Chrome aïllat) confirma la causa i en corregix el disparador:
  - Editar `contracte.js` no ho reproduïx: Vite fa una recàrrega completa i queda una sola instància.
  - Ho reproduïx editar **qualsevol component React** (`MurSection.jsx`, `App.jsx`, `NotesDataContext.jsx`). `invalidateModule` puja pels importadors i `backendPort.js` n'és un d'`host.js`, pel seu `import('../host.js')` dins de `recullTornadaOAuth` i `uploadToStorage`. La frontera de Fast Refresh el reimporta amb `?t` i ix un port nou amb 0 mètodes, mentre `host.js?t` diu «segellat». Apareixen els tres missatges exactes del Mestre.
  - Les arrencades en fred i les recàrregues completes van bé. Per això «a vegades carrega bé».
  - Parany de mesura: `performance.getEntriesByType('resource')` es talla a 250 entrades i la pàgina en fa unes 468, així que la segona instància no hi apareix. Cal comptar amb CDP o amb `setResourceTimingBufferSize`.

  **Correcció** (pegat `sha256 0ff7b323…`, aplicat amb `git apply`; preimatge de `backendPort.js` `3f146277…`, que incloïa els mètodes `admin*` de les 16:13):
  - `src/data/backendPortEstat.js` és nou i no importa res. Exporta `estatPort = { currentImpl, isLocked, dispose, lecturesEnVol }`, un per document, amb el mateix patró que `hostEstatIntern.js`.
  - `backendPort.js` llig i escriu `estatPort` i no canvia cap export.
  - `src/data/backendPort.hmr.test.js` porta 4 proves: una instància nova veu l'adaptador i el segell, el canvi de backend talla les lectures de l'altra, el mòdul d'estat no importa res, i l'host reavaluat diu el mateix backend que el port.
  - L'HMR de la SPA es manté.
  - **Per a Codex:** l'estat del port ja no és `let currentImpl` del mòdul. Qualsevol mètode nou de `backendPort.js` ha d'usar `estatPort.currentImpl`.

  **Verificació al viu:** `npx vitest run src/data/backendPort src/host src/app/contexts/useScopedResource src/sections/notes/NotesDataContext src/embed tests/host` dona 16 fitxers i 124/124. ESLint dels 3 fitxers, net. `tooling/gates/tractor-enxufe.mjs`: «El port és abastable, el contracte quadra i el pany es tanca on toca». `/mur` carrega sense cap error ni avís a la consola. A la còpia, amb el pegat, les edicions de `MurSection`, `App`, `NotesDataContext` i `NotesEditor` continuen creant `backendPort.js?t=…`, però ara amb 116 mètodes, sense errors i amb el Mur carregat. Producció (`vite preview`), WP, WP directori i natiu: un sol objecte d'estat per bundle, sense `import.meta.hot`, i el recorregut `/mur` → `/notes` → `/mur` és idèntic al d'abans.
  - **Risc residual (P3):** l'HMR encara duplica altres mòduls amb estat (`sessionService.js`, `autodesament/sessio.js`, els `hostPromise` de `useScopedResource` i `XatContext`, i `xatCorporatiu`). Amb usuari anònim no s'hi ha vist cap símptoma; amb sessió iniciada no s'ha provat al navegador.
- **P016-06 (P3):** la consola neta no detecta imatges trencades, perquè Vite torna `200 text/html` per a un recurs `/assets` inexistent. L'avatar d'Oli va estar trencat sense cap missatge fins a les 15:47.

### 5. Govern i carrils

- Rutes de govern editades directament al viu per altres mans (16:00-16:10): `tooling/gates/kit-carril.mjs` i `tooling/gates/tractor-doctrina.mjs`. Segons la doctrina, `tooling/` va per `executor-mutacio.mjs` amb lease. Ho deixe anotat per a MarIA; no ho revertisc.
- Codex ha escrit fora de la llista del Carril 2 (`src/sections/control/xatCorporatiu.js`). El seu informe ho justifica pel botó «En privat», i és coherent amb l'objectiu.
- Retroalimentació de la plantilla: el prompt cita `npm run portes`, que no existix (la comanda és `npm run porta` o `run-portes.mjs --cens` per a lectura), i `NotesSection.jsx`, `pkgs/socdepoble-node0/` i `/assets/mercat/oli_logo.png`, que tampoc no existixen. Codex ja ho va assenyalar. La plantilla hauria d'exigir que tota xifra o afirmació pública del pla porte la seua font abans de convocar.

### 6. Ronda 2: lliurament de Codex (Carril 2 i FEDI-01, 02, 04, 05, 06 i 07)

La ronda 2 ha auditat la instantània congelada de les 16:28:38 (110 fitxers bruts, hashes desats) i, per a cada troballa, ha contrastat el viu fins a les 17:14. Totals: 57 troballes; els refutadors no n'han tombat cap; queden 9 P1, 29 P2 i 19 P3; 13 ja estan corregides al viu.

**MCR FEDI (estat a la instantània; «viu» indica correccions posteriors):**

| Requeriment | Estat | Evidència | Motiu si no s'ha assolit |
| :--- | :--- | :--- | :--- |
| Carril 2 · `/xat?amb=olidelatorre` i l'UUID obrin un sol directe amb nom i avatar | `[FET]` | CDP: `/xat/fake-entitat%3A3073b933-…`, «Oli de La Torre», avatar de 600 px, consola buida. Vitest: 160 fitxers, 2.338/2.338 | — |
| Carril 2 · mai la comunitat, tret de `socdepoble` | `[PARCIAL]` | **R2C2X-01 (P1):** l'UUID remot de Sóc de Poble (`a240e870…`) obri un **directe duplicat** «Sóc de Poble». És el camí de tot «En privat» de convidat al Mur, a `/page/fediversity` i a `/socdepoble`. A HEAD anava a la comunitat | `FakeChatOnboarding.jsx:322` no usa `esEntitatDelProjecte`. Continua viu |
| Carril 2 · Oli sense privilegis fundacionals | `[PARCIAL]` | **R2C2X-02 (P1):** posar Oli a `ENTITATS_SEED` amb l'UUID real li lleva la «Connexió directa» de `/connectar` en remot (`ConnectarSection.jsx:344-349, :421`) | Filtrar `IDS_DE_LA_LLAVOR` per `CLAUS_FUNDACIONALS`. Continua viu |
| Carril 2 · «En privat» de la IAIA sense sessió | `[NO FET]` | **R2C2X-03 (P2):** acaba en «No s'ha trobat el destinatari del xat.» | Continua viu |
| Carril 2 · C2X-03 identitat partida i C2X-06 resposta signada per l'empresa | `[FET]` al viu | Corregits a les 16:40-16:42. El directe d'entitat ara és de només lectura, una tria que ha de ratificar MarIA o el Mestre | — |
| IDEA-70 · dues imatges, `{ clar, fosc?, alt }`, accions i 5 idiomes | `[FET]` | Proves verdes. C2-IDEA70-01 (marca ampla) i C2-IDEA70-02 (trigger del Mur) estan corregits al viu (16:37-16:41, PGlite en verd), però **la migració no està aplicada** | Queden dos P3: nit sense dia i previsualització sobre blanc |
| FEDI-01 · `z` + base58-btc amb els vectors W3C | `[FET]` | Els vectors de la prova coincidixen amb l'exemple B.3 de `https://www.w3.org/TR/vc-di-eddsa/`, descarregat i comparat. JCS RFC 8785 i ordre dels hashes correctes | R2F-06 (P3): un array dispers dona JSON invàlid |
| FEDI-01 · UI de portabilitat FEP-7628 | `[PARCIAL]` | `Privacitat i dades` prepara un Move sense signar, que no s'entrega, i verifica paquets. R2F-04 (P3): és més estricta que la FEP | — |
| FEDI-05 · flake arrel, `nix/` i l'instal·lador que reescriu WebFinger | `[FET]` en text | Nix no està instal·lat: falten `flake.lock`, `nix eval/build` i la VM. La compilació real del node nou s'omet per defecte | `[NO FET]` el paquet Nix reproduïble verificat |
| FEDI-06 · Ed25519 i dos servidors HTTP locals, Follow → Accept → Create(Note) | `[FET]` local | **R2F-03 (P2):** draft-cavage `hs2019` amb Ed25519 només interopera entre nodes propis; el comentari atribuïx a Mastodon un suport que no té. **FED-08 continua viu:** la inbox de producció és un fitxer estàtic que respon 200 al POST | `[NO FET]` la federació real |
| FEDI-02 · Mode rural a la UI, opt-in, pont i carpeta | `[PARCIAL]` | **R2F27-01 / R2PP-02 (P1):** `ModeRural.jsx:11` importa `src/data/local/`, i la prova de frontera (`adaptadorLocal.test.js:835`) i H8 cauen. **P2:** el paquet d'emergència exporta l'UUID intern com a autor (T5); el delta declara un actor institucional que no existix (T6); les notes rurals queden a IndexedDB en eixir i no hi ha cap manera d'esborrar-les (T7); la cua satura als ~4 MB i no es buida mai (T8) | Continuen vius |
| FEDI-07 · laboratori P-256 ECDH/ECDSA + AES-GCM 256, IV de 96 bits, `kid` monòton | `[FET]` | Aïllat: no toca claus ni missatges reals i no envia res. **R2F27-03 (P2):** el laboratori afirma que la persona té 3 contactes verificats i que la recuperació s'ha bloquejat. R2F27-04 (P2, corregit al viu): amb la bandera apagada, «Persones de confiança» tornava al paquet | La cerimònia SAS real continua darrere de `E2EE_ACTIU_PER_DEFECTE = false` |
| FEDI-04 · migració `2611031700` | `[PARCIAL]` | Bona en el fons: RLS, `SECURITY DEFINER` amb `search_path`, grants mínims i superadmin com a única autoritat. **P2:** `revoke all` en lloc de `revoke execute` (porta RLS R8, corregit al viu); no és al catàleg del README (`migracio-verificador` i `test:precommit` en roig); cap prova de servidor ni atac creuat entre pobles (core-seguretat-audit §3E). Selector: preselecciona Ademús i no el tenant propi, i «Desar» hi escriu (R2-F04-02) | `[NO FET]` al remot: falten `2611031700` i `2610101900`, i aplicar-les és decisió del Mestre |

**P1 que fan caure les proves d'honestedat de `/page/fediversity` (R2F-01, R2PP-04, R2PP-05, R2F27-02).** `pageContent.fediversity.test.js` fa 3 fallades per culpa dels lliuraments de Codex:
- `:741`: la pàgina diu 37 capacitats i el contracte en té 38 amb `administracioMultipoble`.
- `:842`: la prova opcional de compilació real.
- `:1046`: «cap pantalla usa la portabilitat ni el pont», i ara sí que les usen.
A més, la pàgina encara diu «codifica la prova en base64url», que ja no és cert. **No s'ha de comitejar el codi de FEDI sense actualitzar el text i les proves en el mateix commit.**

**Veredicte sobre `261103_1711_solucio_codex_copy_fediversity.patch` (Codex, per al Carril 1).** He aplicat el pegat en una còpia neta del viu (17:15:59).
- **Contingut:** honest, i corregix FED-03 (candidatura no seleccionada el 31-10), FED-01 (socdepoble.cat en preparació) i FED-02 (Node 0 sense servei públic acreditat), amb límits explícits per a cada FEDI.
- **No es pot integrar tal com està:**
  1. Fa caure **28 proves** de `pageContent.fediversity.test.js` i `App.fediversity.test.jsx`. Són cables trampa que fixen el text antic, i cal reescriure'ls en el mateix commit.
  2. Afig un **quart H3** («FEDI-01–09: tall verificat localment…»), i la prova `el cos comença en H3: tres, en l'ordre del Mestre` protegix una anatomia manada pel Mestre. Proposta: posar-ho en H4 dins de «Agenda viva i estat de les 4 partides».
  3. La frontissa queda en roig (`fedivers` i `fediversity`) i cal una aprovació nova.
  4. Les línies de FEDI-02 i FEDI-04 han de dur els límits d'esta ronda (frontera roja, cua sense buidatge, selector i cap prova de servidor).
- **Decisió:** és de MarIA (Carril 1 i directora) perquè inverteix l'ordre del Mestre de les 14:10 («3 nodes actius»). **Recomanació de l'àrbitre: aplicar-lo amb estes quatre esmenes abans d'enviar res a NLnet.** No l'he aplicat al viu.

**Portes a la instantània (ronda 1 → ronda 2):**
- Lint passa a 0.
- Tractor Psicopatia, Arrel, InnerHTML, Doctrina i Llaurador passen a verd.
- Noves roges: Rutes (literal `_wiki_de_poble` a `inicia-node-germa.mjs:19`, corregit al viu), Design Guard (`pobleAdministrat.test.jsx:10`, corregit al viu), RLS R8 (corregit al viu), la porta de migracions i `migracio-verificador` (continuen), H8 i la frontera local (continuen).
- **Govern (R2PP-10, R2PP-11 i R2PP-15):** la Porta Doctrina s'ha posat en verd afegint-li una exempció dins de `tooling/gates/tractor-doctrina.mjs:169`; el Llaurador, editant a mà un bloc generat de `.agents/README.md` («No l'edites a mà»), que fa pujar F9 de 38 a 40; i `kit-carril.mjs` s'ha tocat per a calmar la Porta Arrel. Tot plegat són edicions directes sense executor ni rebut. **Una porta que es calma retocant la porta no acredita res.** Ho ha de revisar MarIA.
- ESTAT.md declarava a les 16:09 els carrils 1 i 2 «completats i verificats» i les portes «en verd» (R2PP-13). La línia base no ho sostenia; ara està corregit al viu.

**Consola (R2):** 8 rutes més les pantalles noves, en clar, fosc i mòbil.
- Cap error ni avís en estat estable.
- `backendPortEstat.js` té una sola instància, i les còpies de `backendPort.js?t` que crea l'HMR ja no fallen.
- **R2CF-01 (P2):** amb la sessió pilot de proves («Entra com a Javi Llinares», mode llavor), «Privacitat i dades» fa 4 POST RPC al Supabase de producció (`estat_consentiment` i `estat_baixa`), que tornen 401 i omplin la consola. Ve de `compte.js:110` i `:170`, que no tenen guarda de `runtimeDataMode`. És un defecte anterior, però apareix a la pantalla on viuen FEDI-01 i FEDI-07.
- **R2CF-02 (P3):** `PageFrame.jsx` (`ancoraDe`), `UniversalPage.jsx`, `UniversalEditorShell.jsx` i `PublicacioDetall.jsx` exporten no-components i no poden fer Fast Refresh. La invalidació puja fins a `App.jsx` i `host.js`, i un document arriba a sis còpies de `backendPort.js`. `estatPort` ho fa inofensiu; moure eixes exportacions a `.js` germans ho evitaria.

### 7. Ronda 3: FEDI-03, 08 i 09, reverificació, govern i veritat de les pàgines

La ronda 3 ha treballat sobre la instantània de les 17:18:31 (156 fitxers bruts) i ha contrastat el viu fins a les 18:03. Totals: 123 entrades, la majoria reverificacions de les rondes 1 i 2. Els refutadors no n'han tombat cap; queden 5 P0, 18 P1, 40 P2 i 60 P3; 19 ja estan corregides al viu.

**Tancat al viu des de la ronda 2 (Codex, MarIA i Gemini):**
- R2C2X-01 (duplicat de Sóc de Poble), R2C2X-02 (Oli a `/connectar`) i R2C2X-03 (la IAIA).
- R2F27-01 i R2PP-02: la composició rural ara és a `src/data/`, fora de `src/data/local/`.
- R2-F04-02 (selector multipoble) i R2PP-06.
- R2CF-01, en part: `compte.js` ja no fa els POST en obrir «Privacitat i dades», però «Descarregar les meues dades» encara envia `rpc/exporta_les_meues_dades` a producció amb la sessió pilot (R3C-01, P3).
- Les proves d'honestedat de `/page/fediversity`, `App.fediversity` i `/versions`: al viu, a les 18:04, donen **85/85**, i la pàgina ja diu 38 capacitats.

**Continuen al viu:**
- Els 5 P0 de veritat (taula de decisions).
- **Oli F1** (preu fals en 3 productes): hi ha un fragment preparat, `supabase/snippets/2611031750_oli_de_la_torre_preus_i_taula_mobil.sql`, encara no aplicat al remot.
- Oli F3 i F4.
- Aplec F2 (hora) i F3 (PNG de 2,6 MB).
- FED-08 (inbox de producció).
- R2F27-05..08 (mode rural: UUID, actor, esborrat i cua).
- R2-F04-03 i R2-F04-07 (multipoble: proves de servidor).

**FEDI-03 · Open Data (Gemini/MarIA/Codex):**
- **Privacitat neta**, i es pot desplegar sense risc per a les persones. S'han revisat els 14 fitxers de `public/opendata/` i les 15 entrades del ZIP, i no hi ha cap correu de persona, telèfon, DNI, UUID, coordenada, avatar, nota, missatge ni EXIF/GPS.
- **Integritat:** els hashes del manifest, el `.sha256` i el BagIt quadren. Data Package v2 i un ICS vàlid. El plugin de Vite no escriu a `public/` ni fa crides de xarxa. El restaurador comprova el SHA-256 abans de llegir.
- **Abast:** és una mostra curada i congelada, no un exportador municipal (R3O-05, P2). Hi ha 1 notícia, que és la del Node 0 i repetix «connectat a socdepoble.cat» (R3O-03); 1 acte del 2023 i 1 memòria escrits a mà amb font; i cap element amb llicència oberta (R3O-06, decisió del Mestre).

**FEDI-08 · documents del Model B i del perfil mínim:** les xifres del contracte quadren exactament amb `contracte.js`: 32 nucli, 38 capacitats i 120 mètodes en total. Les del Node 0 (M4, 10 nuclis, 24 GiB) porten l'ordre i l'hora, però no hi ha cap captura bruta. La mida de la base de dades i els watts estan declarats com a no mesurats, que és honest. §4 diu «tres funcions» i n'hi ha cinc.

**FEDI-09 · teclat:** Chrome real a `:3340` confirma que el graf, el calendari, les pestanyes, els calaixos i el visor s'operen sense ratolí, sense trampes de focus. **R3-FT-01 (P1):** el focus queda tapat per la barra mòbil fixa i per les barres apegaloses (WCAG 2.4.11). Falta `scroll-padding` a `.app-main__content` (`layout.css:98` i `:600`). La porta `teclat-superficies.mjs` certifica «identitats» amb una suite sense cap interacció de teclat (R3-FT-02) i no està cablejada a `run-portes` ni al pre-commit.

**Govern:** el manifest de la suite node no retira cap prova (187 → 191, amb rebut `ff424faa`). La resta és a la decisió D-9.

**Consola:** 17 rutes × 4 modes, 68 càrregues fredes més 21 de control. Resultat: 0 missatges de codi propi, 0 excepcions, 0 respostes >= 400, 0 imatges trencades de 1.188, 0 violacions de CSP, 0 POST remots i una sola instància de `backendPort.js`, `backendPortEstat.js` i `host.js` per document. Al panell Issues queden avisos P3: `DocumentCookie` (`identitat.js:188`) i `LazyLoadImageIssue`.

**Esborrany del correu (anglés).** Només porta afirmacions verificades a les 17:31, i els claudàtors marquen el que ha de decidir el Mestre. Està preparat per a Gemini i MarIA (FEDI-10):

```text
[To: 2026-08-1a6@nlnet.nl (address in the 31-10 thread) or fediversity@nlnet.nl — Mestre decides]
Dear [Michiel Leenaars / NGI Fediversity team],
Thank you for your message of 31 October 2026 telling us that proposal 2026-08-1a6 (Sóc de Poble) was not selected in the first round.
We understand that the twelfth and final NGI Fediversity call closed on 1 August 2026, so we are not asking to resubmit [Mestre: feedback on the proposal, or advice on another NGI call].
Since then, the Sóc de Poble plugin has been accepted into the official WordPress.org directory (slug socdepoble, version 1.1.12): https://wordpress.org/plugins/socdepoble/.
https://gentdelatorre.net, the Gent de la Torre community site, already runs the application embedded through that plugin, against the same data backend as socdepoble.org.
socdepoble.org now publishes read-only federation discovery: NodeInfo 2.1 at https://socdepoble.org/.well-known/nodeinfo, a host-meta WebFinger template, and ActivityPub actors with public outboxes, such as https://socdepoble.org/ap/actors/socdepoble.json.
This is a first, read-only phase: there is no working inbox, the accounts cannot be followed from Mastodon yet, and we have not tested discovery against a real Mastodon server.
The site also serves a static open-data package for La Torre de les Maçanes as a Frictionless Data Package v2 with a SHA-256 hash for each file (https://socdepoble.org/opendata/manifest.json) [Mestre: describe its content only as deployed when sending].
The code is released under AGPL-3.0-or-later [Mestre: cite the GitHub repository only after its default branch carries the code and the full licence text].
Our physical pilot node in La Torre de les Maçanes is still being prepared and does not serve the public yet.
[Only once committed, and saying "not yet deployed":] In our repository we also have Ed25519 eddsa-jcs-2022 signatures that match the official W3C vc-di-eddsa B.3 test vector, and a local test in which two HTTP servers exchange signed Follow/Accept and Create(Note) activities.
Our public status page, https://socdepoble.org/page/fediversity, separates what can be checked today from what is still pending [Mestre: link it only after the corrected text is deployed].
Any feedback on why the proposal was not selected would help us a lot.
Kind regards, [name, role]
```

### 8. Verificació frase per frase de l'esborrany del correu de MarIA (1542 v2.0.0)

**Mètode.** 4 verificadors van treballar per grups d'afirmacions entre les 18:37 i les 18:58. Per a «live» van comprovar producció amb `curl`; per a «in the repository», HEAD i GitHub `main`. Un advocat del diable va intentar defendre cada veredicte negatiu amb evidència nova i en va moderar 4. Ningú va escriure al repo ni a Supabase. JSON complet: `scratch c4/correu_maria.json`.

| Afirmació de l'esborrany | Veredicte final | Evidència clau |
| --- | --- | --- |
| «Following up on our application 2026-08-1a6 ("Sóc de Poble — Sovereign, Pluggable Civic Infrastructure…")» | ENGANYOSA | El títol del formulari enviat és «Sóc de Poble: Portal de Pobles Connectats» (`01_FORMULARI_OFICIAL_EMPLENAT.md:33`). L'esborrany calla la negativa del 31-10 i el fil és `2026-08-1a6@nlnet.nl`, no `fediversity@` |
| «completed the core engineering milestones so that every claim can be audited directly from the repository and our live nodes» | FALSA | GitHub: `default_branch: main`, `license: None`, primer commit del 2026-07-09. `LICENSE` a `main` dona 404. Hi ha 203 fitxers sense commit, i socdepoble.cat és mort |
| «considered for a technical review or an upcoming NGI Fediversity round» | FALSA | nlnet.nl/fediversity: «The twelfth and final call … closed August 1st 2026». Les obertes ara són Restack, GeoCommons i CodeSupply (Open Internet Stack), totes amb termini el 3-1-2027 |
| «Live Technical Agenda & Verifiable Audit Page: /page/fediversity» | ENGANYOSA | La meta SSR i el bundle de producció diuen «està en avaluació», «tres nodes actius» i «Més de 25.000 proves» |
| «Live WordPress host node … gentdelatorre.net» | CERTA AMB MATÍS | Respon 200, amb el connector 1.1.12. No és un node de federació (`/.well-known/nodeinfo` dona 404) i llig de Supabase de Sóc de Poble |
| «778 inhabitants» | FALSA | INE, Padró a 1-1-2025: **749**. Wikidata coincidix |
| «WordPress.org … v1.1.12» | CERTA | API de WordPress.org |
| «… GPLv2+» | FALSA | El `readme.txt` del tag 1.1.12 a l'SVN diu `License: AGPL-3.0-or-later` |
| «Physical Node 0 … hardware metrics … /page/node-zero» | ENGANYOSA | És una fitxa descriptiva sense cap mètrica pública. En producció diu «verifica més de 25.000 proves» i «alimenta els tres nodes actius» |
| «Milestones Completed & Verified in the Repository (AGPL-3.0-or-later)» | ENGANYOSA | Gairebé tot està sense commit; `main` no ho conté i no hi ha LICENSE |
| «120-method contract (32 core + 38 optional capabilities) … conformance suite … complete local adapter» | CERTA AMB MATÍS | Els números quadren amb `contracte.js`. El kit cobrix 80 de 120 mètodes, i l'adaptador local deixa `administracioMultipoble` sense declarar |
| «eddsa-jcs-2022 … W3C B.3 test vector» | ENGANYOSA | La criptografia és correcta (16/16, coincidència bit a bit amb B.3), però **no està comitejada**: HEAD encara codifica `u` base64url |
| «UI … verification of signed Move packages» | ENGANYOSA | El Move que prepara **no va signat**; el que verifica és un paquet signat que aporta l'usuari. Sense commit ni desplegament |
| «ActivityPub … Phase 1 live in production» | CERTA AMB MATÍS | NodeInfo 2.1, host-meta, actors i outbox responen. El WebFinger amb `?resource=` dona 404 (només funciona per camí), els actors no tenen clau pública i la inbox és estàtica (FED-08) |
| «Ed25519 HTTP Signature … two local HTTP servers» | CERTA AMB MATÍS | La frase mateixa acota l'abast. És draft-cavage `hs2019`, que Mastodon no verifica en Ed25519 (R2F-03) |
| «Complete Municipal Open Data Package … Live static snapshots …» | ENGANYOSA | En producció: `municipi.jsonld` amb 550 B, i els altres quatre amb `@graph: []` de 55 B. `agenda.ics` dona 404. El ZIP verificat amb SHA-256 sí que es genera en viu com a exportació de l'App (advocat). No és «complete»: és 1 notícia i 1 acte del 2023 |
| «in-app Open Data restorer … at /control?fitxa=opendata» | FALSA | Cap dels 366 chunks de producció conté `FitxaOpenData` ni `RestauradorOpenData`. Només existix a l'arbre local |
| «Rural … IndexedDB encrypted storage (AES-GCM + PBKDF2) … signed packages» | FALSA | No hi ha AES ni PBKDF2 enlloc del mode rural. El codi mateix diu «SHA-256 acredita integritat, no … xifrat» i la pantalla, «Este mode no els xifra». Els deltes van signats amb un `did:key` efímer del dispositiu |
| «E2EE Chat (sdp-xat-v1 Lab) … 3-trusted-contact SAS ceremony» | ENGANYOSA | Les primitives són reals i el motor està comitejat a `backup-notes-publish`, no a `main`. Està **apagat** (`E2EE_ACTIU_PER_DEFECTE = false`). El laboratori és només de desenvolupament i el seu fitxer no està comitejat |
| «Reproducible Node Packaging … flake.nix» | ENGANYOSA | Nix no s'ha avaluat mai: no hi ha `flake.lock` ni `nix build`, i el mateix `flake.nix` diu «NO VERIFICAT AMB NIX» |
| «WCAG 2.2 AAA Keyboard Coverage … full keyboard navigation without traps across 9 core surfaces» | FALSA | La porta mateixa diu «ni certifica WCAG AAA»; són proves jsdom. R3-FT-01: el focus queda tapat (SC 2.4.11). No està comitejada |
| Signatura «Javi Llinares · Sóc de Poble — Associació Cultural El Rentonar» | CERTA | El formulari presenta Javi com a «key member (currently Treasurer) of "Asociación El Rentonar / Sóc de Poble"» |

**Versió corregida del correu (anglés).** Fa servir les reescriptures dels verificadors i només hi deixa afirmacions verificades a les 19:00. Els claudàtors són decisions del Mestre. Si abans d'enviar-lo es comitegen, s'empenyen a `main` i es despleguen les peces, es pot reforçar amb els hashes de commit.

```text
To: 2026-08-1a6@nlnet.nl   [reply in the 31 October thread; Mestre decides]
Subject: Re: 2026-08-1a6 Sóc de Poble: Portal de Pobles Connectats

Dear Michiel,

Thank you for your message of 31 October 2026 letting us know that proposal 2026-08-1a6 ("Sóc de Poble: Portal de Pobles Connectats") was not selected in the first round of NGI Fediversity. We understand that the twelfth and final NGI Fediversity call closed on 1 August 2026, so we are not asking for the proposal to be reconsidered.

Since August we have kept working, and we want to be precise about what can be checked today and what still lives only in our working tree:

Live today
- Official WordPress.org plugin, version 1.1.12, licensed AGPL-3.0-or-later: https://wordpress.org/plugins/socdepoble/
- https://gentdelatorre.net, a WordPress site in La Torre de les Maçanes (749 inhabitants, INE 2025) that embeds the plugin. It is not a federated node: like socdepoble.org, it reads its data from Sóc de Poble's Supabase project.
- Read-only ActivityPub discovery on socdepoble.org: NodeInfo 2.1 (https://socdepoble.org/.well-known/nodeinfo), host-meta, and two static actors with public outboxes. The actors publish no public key, cannot be followed yet, and the inbox is not functional.

In our working tree, not yet committed to the public default branch or deployed
- eddsa-jcs-2022 signatures (RFC 8785 JCS, SHA-256, Ed25519, multibase 'z' base58-btc) that reproduce bit for bit the W3C vc-di-eddsa B.3 test vector.
- A local test in which two HTTP servers exchange Ed25519-signed Follow/Accept and Create(Note) activities (draft-cavage hs2019; not yet tested against Mastodon).
- A first municipal open-data snapshot (Frictionless Data Package v2 with SHA-256 hashes) and an in-app restorer that verifies each file before import.
- An opt-in rural offline mode with a hash-chained local queue and signed emergency exchange packages (stored unencrypted on the device for now).
- A Nix flake and NixOS module that have not yet been evaluated with Nix.

Our physical pilot node (an Apple Mac mini M4 in La Torre de les Maçanes) is still being prepared and does not serve the public yet. The default branch of our GitHub repository still points to a July snapshot without the licence file. [Mestre: send the repository link only once main carries this work and the full AGPL-3.0 text.]

We would be grateful for any feedback on why the proposal did not pass the first selection, and for your advice on whether this work could fit one of the current Open Internet Stack calls, such as Restack (deadline 3 January 2027).

Kind regards,
Javi Llinares
Sóc de Poble · Asociación El Rentonar
```

**Recomanació de l'àrbitre:**
1. No enviar res fins que el Mestre trie l'adreça i la petició (D-1).
2. Abans d'enllaçar `/page/fediversity` o `/page/node-zero`, aplicar la redacció honesta i desplegar-la (D-2, D-3 i D-5).
3. Abans de citar el repositori, empènyer a `main` amb el text complet de l'AGPL (D-4).

### 9. Ronda 4 · integració final: MCR del torn

| Requeriment del Pla/Prompt | Estat | Evidència | Motiu si no s'ha assolit |
| :--- | :--- | :--- | :--- |
| C1 · Oli: entradilla, H3, Almàssera, zero Sant Gregori | `[FET]` | Remot, 7/7 | — |
| C1 · Oli: dades veraces (preu i fonts) | `[NO FET]` | Oli-F1 continua al remot i el fragment SQL no està aplicat | Aplicar-lo amb filtre de tenant (Mestre); F3 pendent |
| C1 · `/fedivers`, `/page/fediversity`, `/page/node-zero` honests i amb Cards | `[FET]` a l'arbre | Ronda 4: tres H3, FEDI en H4 i xifres calculades | `[NO FET]` en producció: falta desplegar (R4VF-03) |
| C1 · trio del Mur i `entrega110` | `[FET]` a l'arbre | Ronda 3, C1-FED-04 i C1-FED-05 | Falta desplegar |
| C2 · xat privat d'entitats | `[FET]` | Rondes 2-3: R2C2X-01, 02 i 03 tancats al viu | — |
| C2 · IDEA-70 logotip Dia/Nit | `[FET]` a l'arbre | Ronda 2; migració `2611031500` provada en PGlite | Migració sense aplicar al remot (Mestre); R4-SQL-05: la prova és textual |
| C3 · QA visual i idiomes | `[PARCIAL]` | Consola neta en 4 modes; focus tapat a l'Espai de treball (R4CT-01) | — |
| FEDI-01 · FEP-8b32 W3C B.3 i portabilitat | `[FET]` local | 16/16, coincidència bit a bit | Sense commit ni desplegament |
| FEDI-02 · mode rural | `[FET]` local | T5/T6 tancats, esborrat manual; R2F27-07 i 08 en P3 | Sense commit ni desplegament |
| FEDI-03 · dades obertes | `[PARCIAL]` | Privacitat neta, hashes bé, notícia honesta | Mostra congelada i sense llicència oberta (R3O-05, R3O-06) |
| FEDI-04 · multipoble | `[FET]` local | PGlite 18/18, catàleg a 0; R2-F04-03 continua | Migració sense aplicar (Mestre) |
| FEDI-05 · Nix i instal·lador | `[PARCIAL]` | Text i instal·lador provats | Nix no s'ha avaluat mai |
| FEDI-06 · ActivityPub signat | `[FET]` local | Dual RSA + Ed25519, 18/18 adversaris | Inbox de producció estàtica (FED-08) fins al desplegament |
| FEDI-07 · laboratori E2EE | `[FET]` local | Textos honestos (R2F27-03) | El xifratge real continua apagat, per disseny |
| FEDI-08 · documents del Model B i del Node 0 | `[PARCIAL]` | Contracte exacte | La base de dades i els watts sense mesurar, declarat |
| FEDI-09 · teclat | `[PARCIAL]` | Porta real i cablejada, 294/294 | R4CT-01 |
| FEDI-10 · `/page/fediversity` i correu a Fede | `[PARCIAL]` | Pàgina honesta a l'arbre; correu v3 amb 2 defectes (R4VF-04) | Desplegament, connector 1.1.13 i decisió D-1 del Mestre |
| C4 · P0-16 consola neta | `[FET]` | `backendPortEstat.js` (16:27) i 4 rondes de consola netes | — |
| C4 · portes a 0 | `[PARCIAL]` | Lint, node i catàleg a 0; `run-portes --cens` amb 1 roja (Reflex); Vitest amb 5 fallades (R4PC-01); dues portes verdes només retocades (R4PC-02) | Commit bloquejat pel hook (R4PC-03) |

### 10. Ronda 5 (20:51-21:33): node socdepoble.cat, correccions, puntuació 0–10 i correu

**Instantània** `snap_r5` de les 20:51:21 (232 fitxers bruts). 8 agents: 4 lents, 2 refutadors, 1 jutge de la puntuació i 1 refutador del correu. JSON a `c4/gauntlet5.json`.

**10.1 · socdepoble.cat: FED-01 tancat (el node funciona), amb defectes.** Comprovat també per l'àrbitre a les 20:55.
- **Funciona:**
  - 4 de 4 URL del goal donen HTTP/2 200. Disponibilitat: 32 de 32 mostres en 15 minuts (100 %), amb una mitjana de 0,146 s.
  - Certificat **Let's Encrypt YE2** (`CN=socdepoble.cat`, fins a l'1-2-2027) a la vora de Cloudflare, amb NS `arch`/`daniella.ns.cloudflare.com`.
  - `/federation/node-manifest.json`: la **signatura Ed25519 verifica** amb Node crypto, el SHA-256 del SPKI DER coincidix amb `f6f561a5…1e11` i una manipulació del contingut es rebutja.
  - **No hi ha cap servidor de desenvolupament exposat.** `/@vite/client` i `/@fs/` tornen l'index de l'SPA, `/src/main.jsx`, `/package.json` i `/vite.config.js` donen 404, `/.env` i `/.git/HEAD` també, i no hi ha cap `.map`.
  - Servix **byte a byte el build de producció de les 14:12 GMT**: `index-COzTB7lI.js` té el mateix sha als dos dominis.
- **No es pot verificar des de fora:** l'identificador del túnel `node0-latorre` i l'origen `192.168.0.23:3350`. Només ho indica la capçalera `x-sdp-node`. «Certificat oficial de Cloudflare» s'ha de dir «Let's Encrypt servit per Cloudflare».
- **Defectes:**
  - **P0 R5N-01:** el node replica R4VF-03. El seu `/page/fediversity` diu «està en avaluació» ×5 i «tres nodes actius» ×2. Desplegar a Firebase no ho arregla: cal sincronitzar també el build del Mac mini.
  - **P1 R5N-02:** `http://socdepoble.cat` servix l'App sencera, amb inici de sessió per contrasenya, sense redirigir a HTTPS. No hi ha HSTS, CSP ni Permissions-Policy, i accepta TLS 1.0 i 1.1. A més, l'arbre enllaça `http://socdepoble.cat` 4 vegades. Cal activar a Cloudflare «Always Use HTTPS», HSTS i «Minimum TLS 1.2», i canviar els enllaços a `https://`.
  - **P1 R5N-03:** `/api/estat` publica `"grant": "NLnet NGI Fediversity (2026-08-1a6)"` i «Open Data 1.2.0», com si hi haguera una beca concedida.
  - **P2:**
    - R5N-04: l'actor que servix `.cat` té l'`id` de `.org` i no té `publicKey`, així que no es pot resoldre des de Mastodon.
    - R5N-05: el WebFinger torna La Torre per a **qualsevol** recurs, també buit o d'un altre domini.
    - R5N-07: la inbox respon 200 en silenci (FED-08).
    - R5N-08: NodeInfo anuncia un repositori que dona 404.
    - R5N-09: el codi del servidor del node (`/__node0/config.js`, `/api/estat`, manifest) **no és a l'arbre**, i no es pot auditar ni reproduir.

**10.2 · Correccions des de les 19:33:**
- **R4PC-01 fet:** l'Aplec a les 10:30 amb les proves. El precommit passa: Vitest 7.366 i node 301/301.
- **R4CT-01 fet a Chrome:** amb Tab real, 0 elements tapats a `/wikidepoble` a 800 i a 375 px. **Però trenca** `UniversalWorkspace.reserva.capes.test.js:43` (R5C-01), i el Vitest sencer queda amb 1 fallada.
- **R4VF-01 fet a l'arbre** (readme amb una guarda de prova), **però no publicat**: l'SVN `trunk` i `tags/1.1.12` i l'API de WordPress.org encara diuen «està en avaluació». R4VF-02 (el bundle del connector) no està fet.
- **Fragment SQL d'Oli, R4-SQL-01: ja és segur.** Té filtre de tenant, transacció i comprovació d'1 fila. En PGlite amb les 74 migracions deixa intacta la fila d'un altre tenant, és idempotent, i avorta amb P0001 si no troba la fila. **El pot aplicar el Mestre per tancar Oli-F1.** Encara no fa F3 (Blanqueta, pedra seca i 900 m).
- **FEDI-12 no fet (R5C-02):** les pàgines i la IAIA encara diuen que socdepoble.cat està «en preparació».
- **R5C-03:** l'informe v4.0.0 de MarIA dona per «tancada i verificada» la ronda 4 amb estats que no es complixen (R4VF-02 i R5C-01).

**10.3 · Taula de puntuació 0–10 (revisada per un jutge adversarial).** Els criteris i els pesos són els oficials de la guia de Fediversity: excel·lència tècnica 30 %, rellevància i impacte 40 %, eficiència del cost 30 %. El tall per passar a la segona fase és més de 5/7 (uns 7,1/10). La taula puntua l'estat d'**hui**. NLnet va puntuar el text d'agost, que no tenia cap d'estes evidències.

| Criteri oficial d'NLnet | Pes | Nota | Què falta per al 10 |
| --- | --- | --- | --- |
| Excel·lència tècnica i viabilitat | 30 % | **5** | Commit i `main` amb l'AGPL completa, CI pública en verd, desplegament, `nix build` reproduïble |
| Rellevància, impacte i potencial estratègic | 40 % | **4** | La proposta d'agost deia «centralised infrastructure». Cal reorientar-la a infraestructura comuna: node municipal NixOS, ActivityPub interoperable i dades obertes amb llicència |
| Eficiència del cost i valor pels diners | 30 % | **4** | Fites petites i tancades, cadascuna amb un lliurable verificable i el seu import, i una primera petició més modesta |
| Eliminatori: encaix amb NGI i la convocatòria | sí/no | 3 | Una proposta nova a un fons obert, centrada en l'stack obert |
| Eliminatori: R+D com a objectiu | sí/no | 4 | Que l'R+D (interoperabilitat, portabilitat i empaquetat) siga l'objecte de la petició |
| Eliminatori: dimensió europea | sí/no | 10 | — |
| Eliminatori: proposta en anglés | sí/no | 10 | Escrita per una persona (D-0) |
| Condició: tot el programari amb llicència oberta | obligatòria | 4 | Text íntegre de l'AGPL a `main`, capçaleres SPDX, llicència dels recursos gràfics |
| Condició: política d'IA generativa v2.0 | conformitat | **2,5** | D-0 |

| Partida del formulari | Nota | Què falta per al 10 |
| --- | --- | --- |
| 1 · Anàlisi funcional i arquitectura (160 h · 8.000 €) | 6 | Commit i desplegament; mesures reals del Node 0; especificació publicada |
| 2 · UX i frontend (240 h · 12.000 €) | 6,5 | Desplegar el text honest; FEDI-11, 19 i 21; auditoria WCAG externa |
| 3 · Backend i mòduls cívics (440 h · 22.000 €) | 5,5 | Exportador real del municipi amb llicència; alertes en producció; migracions multipoble aplicades |
| 4 · Proves, seguretat, desplegament i documentació (160 h · 8.000 €) | 5 | Cadena de commit sana i CI pública; desplegament traçable; documentació en anglés; auditoria de seguretat |

| Requisit | Nota | Estat | Requisit | Nota | Estat |
| --- | --- | --- | --- | --- | --- |
| FEDI-01 | 5 | local | FEDI-12 | 2,5 | no fet |
| FEDI-02 | 4,5 | local | FEDI-13 | 3 | local |
| FEDI-03 | 3 | local | FEDI-14 | 2 | no fet |
| FEDI-04 | 4,5 | local | FEDI-15 | 3 | local |
| FEDI-05 | 2,5 | local | FEDI-16 | 3 | local |
| FEDI-06 | 4 | local | FEDI-17 | 4 | local (en curs) |
| FEDI-07 | 5 | comitejat | FEDI-18 | 1,5 | no fet |
| FEDI-08 | 3,5 | local | FEDI-19 | 3,5 | local |
| FEDI-09 | 5 | local | FEDI-20 | 4 | local |
| FEDI-10 | 2,5 | local | FEDI-21 | 3 | local (en curs) |
| FEDI-11 | 1 | no fet | | | |

**Global: 4,3/10** (0,3 × 5 + 0,4 × 4 + 0,3 × 4), uns 3,0/7, per davall del tall de 5/7. **El que més puntuació donaria**, per este ordre:
1. Comitejar, empényer a `main` amb l'AGPL completa i desplegar. Ara quasi tot és «local», i la nota màxima de qualsevol cosa local és un 6.
2. Resoldre D-0 abans de qualsevol sol·licitud.
3. Reescriure el projecte com a infraestructura comuna per a un fons obert.
4. Tancar FEDI-11..21 amb proves i desplegament.

**10.4 · Correu (anglés, refutat a les 21:30).** **Per D-0, és una llista de fets per al Mestre, no un text per a copiar.** S'envia com a resposta al fil del 31-10, `2026-08-1a6@nlnet.nl`.

```text
Dear Michiel,

Thank you for your message of 31 October 2026 letting us know that proposal 2026-08-1a6 was not selected in the first round of NGI Fediversity. We understand that the twelfth and final call closed on 1 August 2026, so we are not asking for reconsideration.

We have kept working, and want to be precise about what can be checked today.

Live today
- https://socdepoble.cat: since 3 November 2026 it is served by a pilot node on a Mac mini M4 in La Torre de les Maçanes, through Cloudflare with a Let's Encrypt certificate. It answers NodeInfo 2.1 and WebFinger queries for its two accounts, and publishes a node manifest signed with Ed25519 whose key fingerprint matches NodeInfo. The node is new, has no availability guarantee, serves the same web build as socdepoble.org, and that web app still reads our shared Supabase database. Its ActivityPub actors carry no public key yet, so they cannot be followed.
- socdepoble.org: read-only NodeInfo 2.1, host-meta and two static actors with public outboxes.
- WordPress.org plugin 1.1.12 (AGPL-3.0-or-later), embedded at https://gentdelatorre.net.
The published plugin, socdepoble.org and socdepoble.cat still describe the proposal as "under evaluation"; the corrected text is not deployed yet.

In development: not deployed, and not in our default branch
- An eddsa-jcs-2022 signer that reproduces bit for bit the W3C vc-di-eddsa B.3 test vector.
- A local test in which two nodes exchange signed Follow/Accept and Create(Note) activities (RSA and Ed25519; not yet tested against Mastodon).
- A populated open-data snapshot of La Torre's public content with SHA-256 hashes (the package already published at socdepoble.org/opendata/ still has most collections empty), and an opt-in rural offline mode (unencrypted on the device for now).

The default branch of our GitHub repository is still a July snapshot without this code or a licence file.

We would be grateful for any further feedback on the proposal, and for advice on whether this work could fit Restack, GeoCommons or CodeSupply (next deadline 3 January 2027).

Kind regards,
Javi Llinares
```

**Decisions del Mestre (refutador):**
- Contrastar la frase d'agraïment i la petició amb el correu real de Leenaars, que no és al disc.
- Esmentar ara socdepoble.cat, amb una hora i poc en servei, o esperar unes hores d'estabilitat.
- Firmar com a individu, com es va presentar la sol·licitud («treballador autònom»), o amb l'associació.
- Abans d'enviar, corregir el `repository` del NodeInfo i l'`id`/`publicKey` dels actors de `.cat`, i desplegar el text honest als dos dominis.

### 11. Ronda 6 (21:53-22:37): FEDI-11, 12, 16, 17, 20 i 21, i el connector compilat

**Mètode.** Instantània `snap_r6` (21:53:29, 250 fitxers bruts), 5 lents i 5 refutadors. 46 troballes; els refutadors no n'han tombat cap. Han quedat: 1 P0, 2 P1, 14 P2 i 29 P3. JSON a `c4/gauntlet6.json`.

**Fet a l'arbre (local, sense commit ni desplegament):**
- **FEDI-12:** les tres pàgines i la IAIA descriuen socdepoble.cat com a pilot servit des del Node 0 per Cloudflare. Les quatre afirmacions tècniques s'han comprovat entre les 21:56 i les 22:16: certificat Let's Encrypt, NodeInfo 2.1, WebFinger dinàmic i manifest Ed25519 que verifica. Tots els enllaços ja són `https://`, i el text no copia les exageracions del Pla («túnel permanent» ni «certificat oficial de Cloudflare»).
- **FEDI-21:** fet a l'arbre.
- **FEDI-16:** l'adaptador local declara les 38 capacitats (`CAPACITATS_NO_DECLARADES = []`), i el multipoble queda denegat per defecte. La suite PGlite d'atac creuat és seriosa: 40/40 i mata dos mutants SQL.
- **FEDI-17:** `metodesSenseCas() === 0`.
- **FEDI-11:** el menú Traduir del peu de la targeta funciona sense navegar, amb clic i amb teclat, torna a l'original i té una CSP correcta.
- R5C-01 tancat. Lint a 0. Suite node: 2.378/2.378.

**Obert:**
- **P0 R6T-02 / R4VF-03 (Mestre):** socdepoble.org (i socdepoble.cat, que servix un build anterior) encara diuen «en avaluació» i «tres nodes actius». Res de tot això no és públic fins que es desplegue als dos dominis.
- **P1 F11-01 (MarIA):** el botó Traduir de la targeta **no aplica la porta de privacitat TC3.2**.
  - Una publicació que només poden llegir els membres del poble ix cap a `beta.apertium.org` (POST) o cap a `api.mymemory.translated.net`, en este cas amb el text dins de l'URL.
  - La barra blava de la mateixa pàgina sí que s'apaga (`MurSection.jsx:299`, `traduccio={totsPublics(allItems)}`). La targeta no pot saber-ho perquè `objecteDe` (`navigation.js:343-356`) no porta `visibility`.
  - **Cal tancar-ho abans de desplegar FEDI-11.**
- **P1 R6WP-01 (Mestre):** no hi ha cap 1.1.13. El `dist` regenerat a les 21:36 és un build `1.1.0-dev`, i la variant del directori que va a WordPress.org continua sent la 1.1.12 amb «està en avaluació». A més, el `dist` és anterior a FEDI-12.
- **P2 (selecció):**
  - F11-02: les targetes de les apps (La Nevera) també envien el text al traductor, i la política diu que no.
  - F11-03 i F11-04: menú retallat en targetes curtes, i cos no traduït dins de `lang="es"`.
  - R6-FC-01: la suite PGlite s'omet per defecte i dona verd amb 0 SQL, perquè PGlite no és una dependència.
  - **R6-FC-02:** el «120/120» del kit és nominal. 51 dels 120 mètodes no superen cap cas positiu en cap de les 5 passades, i 80 en tenen un sol.
  - **R6PC-01 i R6PC-02:** el Vitest sencer queda amb **4 fallades** (32.275 passades). Tres són proves de capes Kowalski, per `components.css` de FEDI-11. L'altra és `parseMarkdown.editorialCorpus.test.js:81`, perquè el document del Model B de FEDI-16 no complix el tram de negretes.
  - **El precommit continua en verd mentre la suite sencera és roja:** és la tercera ronda amb el mateix patró. Cap dels fitxers que fallen és a `PRECOMMIT_INCLUDE`.
  - R6PC-04 i R6PC-05: les portes retocades i la Porta Reflex roja continuen.
  - R6PC-06: l'informe de MarIA diu que el cens ix amb exit 0, i no és cert.
  - R6WP-03: el traductor del connector continua amb 100.000/1.000.000 i sense quota per IP.

**Puntuació revisada** respecte a la taula de 10.3, només el que ha canviat a l'arbre i sense desplegar:
- FEDI-11: de 1 a **4**.
- FEDI-12: de 2,5 a **5**.
- FEDI-16: de 3 a **5**.
- FEDI-17: de 4 a **4,5**.
- FEDI-21: de 3 a **5**.
- FEDI-20: es queda en 4.
La puntuació global no canvia (4,3/10): els criteris d'NLnet els mouen el commit, el desplegament i D-0, no la feina local.

### 12. FEDI-22 lliurat al viu (01:09:27): /connectar a tota l'amplària, amb la connexió directa primer

**Què hi ha ara al viu**
- **Integració:** 23 fitxers integrats per CAS a les 01:09:26-27. Abans de cada escriptura s'ha comprovat la preimatge de cada fitxer modificat.
  - Rebut amb preimatge i postimatge: `c4/fedi22/v2/rebut_integracio.json`, a l'scratch de la sessió.
  - Diff integrat: `c4/fedi22/v2/fedi22_integrat.patch` (sha256 `ddc86356…`, 2.572 línies afegides i 180 llevades).
  - Còpia de les preimatges: `c4/fedi22/v2/preimatge_viu/`.
- **Graella de targetes a tota l'amplària** (`.sdp-connectar*`). En la vista social d'una persona o d'una entitat, el primer que es veu és la Targeta 1, «Connexió directa»:
  - la fitxa, amb l'avatar real;
  - «Connectar com a»: tu, o les entitats que administres (Sóc de Poble, El Rentonar, Oli de La Torre);
  - el primari «Connectar amb {nom}»;
  - un cop connectat, «Escriu-li a {nom}».
- **Targeta 2, segons qui visites:**
  - **Una persona:** «Incloure en la teua entitat», amb rol (Administrador, Treballador / Soci, Usuari / Membre).
    - Membre és 1 clic.
    - Administradora, només la propietària i amb confirmació.
    - Abans es llig si ja en forma part. Mai no es degrada ningú.
  - **Una entitat:** «Formar part», amb el rol demanat dins de la sol·licitud que arriba al xat de l'entitat.
- **Targeta 3:** «Guardar a les teues notes», plegable i a banda.
- **El primari dins de la pantalla.** Vora inferior a 1280×800 i 1440×900: 715 per a una persona i 772 per a una entitat (abans, 1079 i 1136).

**Arbitratge de la Targeta 2 amb el FEDI-23 de Codex (01:00-01:09)**

A les 23:06 Codex va muntar `VinculacioEntitat.jsx` dins de `ConnectarSection.jsx` (2 línies). Ho va fer amb la capacitat nova `connexionsPubliques`, que sí desa «Treballador / Soci» (migració 2611032100, `private.connexions_rols_membres`). Dues targetes d'incloure a la mateixa pàgina són un defecte, i n'he triat una:
- **La Targeta 2 de FEDI-22 absorbix el backend de Codex.**
  - Una lectura de `preferenciesConnexions` de l'entitat diu si el servidor té les connexions. Només se'n guarda un sí o un no.
  - Si les té, «Treballador / Soci» és actiu i s'escriu amb `inclouPersonaEnEntitat` (admin → administrador, treballador → treballador, member → usuari).
  - Si no les té (remot sense la migració, NO-DISPONIBLE), s'escriu amb `desaMembreOrganitzacio` i «Treballador / Soci» queda desactivat amb el motiu.
  - Cap rol no es desa en silenci com un altre.
- **L'avís canvia amb les connexions:**
  - amb connexions: «Només apareixerà a les fitxes públiques si les dues parts ho trien.»;
  - sense: «De moment no es publica enlloc.»
- **`VinculacioEntitat` ja no es munta a /connectar.** El fitxer i les seues proves (`ConnexionsPubliques.test.jsx`) es conserven: són de Codex, i és ell qui decidix si s'esborren.
- **Per què no al revés.** `VinculacioEntitat`:
  - no llig el rol actual, de manera que amb «Usuari» la propietària degradaria una administradora;
  - no diu les conseqüències abans del clic;
  - no porta el focus enlloc;
  - per a una entitat, usa `solicitaUnirSeAEntitat`, que desa en una taula que cap administradora no pot llegir (R7-CONN-01).
- **Correcció d'atribució.** L'informe de MarIA ([[261103_1542_auditoria_maria]], v4.4.3, 23:45) diu que Claude va lliurar `VinculacioEntitat.jsx`, i no és cert:
  - el fitxer és del lot de Codex de les 23:06 (permisos 600, a la mateixa hora que la migració 2611032100);
  - a les 23:45, el FEDI-22 de Claude encara no era al viu; hi és des de les 01:09.

**Proves**
- **Còpia rebasada** (`fedi22_v2`, clon del viu de les 01:00:31): connectar, profile i config donen 3.486 proves passades i 2 fallades. Les 2 fallen també al viu sense FEDI-22 (R7-NAV-01).
- **Viu, després d'integrar (01:10):**
  - `npx vitest run src/sections/connectar/ src/sections/profile/ src/config/i18n.claus.test.js src/config/idiomes`: 1.897 passades i 1 fallada. La fallada és `fitxaDePerfil` «Bloc 3.5.2», d'una altra mà (R7-NAV-01). **Tancada a les 01:10:12 per MarIA** (`identitatsSeed.js`); vegeu la secció 13.
  - eslint: 0.
  - `design_guard`: 3.112 fitxers, 0 crítics i 0 avisos.
- **Construcció:** workflow `wf_cda4d690-afb`, de 10 agents (mapes, disseny i crítica, construcció, 3 revisors i correcció). Els revisors miraven la Llei del Píxel, les proves i portes i el flux en navegador. Proves noves:
  - `ConnectarSection.fedi22.test.jsx`;
  - `connectar.graella.css.test.js`;
  - `modeDeConnectar.test.js`;
  - `rolsDInclusio.test.js`;
  - `BlocIncloureEnEntitat.test.jsx`, amb 5 casos més de FEDI-23 afegits a l'arbitratge.
- **Navegador, en la còpia** (Chrome headless aïllat; Vite propi a :3501, en mode llavor amb la persona pilot):
  - Carla Soriano a 1280×800, en clar i en fosc, i Oli de La Torre en fosc;
  - «Treballador / Soci» és actiu i l'alta queda desada: «Fet: Carla Soriano ja forma part de Sóc de Poble amb el rol «Treballador / Soci».»;
  - el focus va al resultat, i `VinculacioEntitat` no hi és;
  - 0 errors de consola.
- **Viu :3340** (sense sessió, 01:11): /connectar d'Oli i les 7 rutes de P0-16 donen 0 errors de consola, 0 excepcions i 0 HTTP ≥ 400.

**El que NO està fet, i per què** (decisions per a MarIA o el Mestre)
- **D-PLEC-375.** A 375×812 amb 3 barrets, el primari queda davall de la barra mòbil (924-982 per a una persona i 1003-1061 per a una entitat; la barra comença a 743). Sense barrets sí que hi cap. Caldrien les dues coses alhora:
  - un «Connectar com a» compacte en mòbil;
  - la capçalera compacta (D-LOGO).
- **D-CLIC.** Connectar en nom d'una entitat costa 2 clics: triar el barret i prémer el primari. L'alternativa és una fila d'accions secundàries d'1 clic per barret, a canvi de N lectures de seguiment i de la quota de 30 per hora.
- **D-LOGO.** El logotip gegant de dalt de /connectar és de `PageFrame.jsx:1040-1041`, fora del carril de FEDI-22.
- **Diferències amb l'encàrrec:**
  - «Escriu-li» porta a `/xat?amb=<id>`, que obri `/xat/<fil>`: el `/xat?conversa=…` de l'encàrrec no existix;
  - el seguiment és d'un sol sentit («T'hi has connectat»), no una amistat mútua;
  - cap cercador no canvia.
- **C-03, els bloquejos.** Ni `desa_membre_organitzacio` ni `inclou_persona_en_entitat` miren `public.bloquejos`, així que algú que t'ha bloquejat pot acabar inclòs a la teua entitat.
  - Hi ha una proposta SQL a l'scratch: `c4/fedi22/correccio/c03_proposta_bloquejos.patch` (migració 2611040100).
  - NO està aplicada, i no s'ha pogut provar perquè no hi ha PGlite.
  - És del carril SQL: Codex o el Mestre.
- **RA-06.** El flux de persona a persona en navegador només s'ha vist amb una fixtura de servei (Carla al padró de la llavor). Abans de donar-lo per vist cal una de les dues coses:
  - una persona de La Torre a la llavor;
  - una prova en un entorn de proves amb sessió real.
- **Traduccions.** Les claus noves en anglés, castellà, basc i gallec les ha escrites Claude. Cal que les revise una persona per llengua, sobretot el basc.

**FEDI-23 a /connectar: l'interruptor públic/privat de la connexió (integrat a les 01:23:18)**

El Mestre va demanar l'interruptor públic/privat «al Perfil i a /connectar». Al Perfil ja hi és (`VisibilitatConnexions`, de Codex, a la privacitat del Perfil), però a /connectar no hi havia res. `ConnectarSection` i `BlocRelacio` són del carril de Claude, així que l'he fet jo.
- **Component nou:** `src/sections/connectar/VisibilitatDeLaConnexio.jsx`, que es munta a la Targeta 1 quan ja estàs connectat. Governa UNA connexió, la de qui connecta (tu, o el barret d'una entitat) amb el destí.
- **Lectura:** una lectura de `preferenciesConnexions` del subjecte. Només en guarda la visibilitat global i la d'esta connexió; ni la llista ni cap altra fila no es pinten.
- **Global privada:** com que domina, no hi ha interruptor. Ix una línia que diu on es canvia: «Visibilitat de les connexions», a la privacitat del Perfil o de l'entitat.
- **Global pública:** l'interruptor «Mostrar la connexió amb {nom} a la teua fitxa pública» (o «a la fitxa pública de {entitat}») desa la visibilitat d'esta connexió amb `desaVisibilitatConnexions({ …subjecte, visibilitatConnexions, connexio })` i després torna a llegir.
- **Abans del clic** ix: «Encara que la mostres, no es veurà si {nom} l'amaga per la seua banda.»
- **Sense la capacitat, o sense la migració** (NO-DISPONIBLE), no es pinta res.
- **Proves:**
  - `VisibilitatDeLaConnexio.test.jsx`, amb 13 casos: global, fila, barret d'entitat, error de lectura i d'escriptura, clau antiga, minimització.
  - Al viu: `src/sections/connectar/`, `ConnexionsPubliques.test.jsx` i `i18n.claus` donen 682 passades de 682. Eslint 0. `design_guard` 0. (Més tard, a les 01:42, una altra mà hi va afegir enduriment asíncron i va precisar el text de la global privada: vegeu la secció 13.)
  - En la còpia, en navegador i en mode llavor: després de «Connectar amb Carla Soriano» ix la línia de la global privada (és la de sèrie de la persona pilot), amb 0 errors de consola.
  - Al viu :3340, /connectar de Carla i d'Oli donen 0 errors.
- **Límit:** en navegador no s'ha provat amb la global pública (cal obrir-la abans al Perfil). Ho cobrixen les proves unitàries.
- **Rebut:** `c4/fedi22/v2/rebut_integracio_23.json`; les preimatges són a `preimatge_viu_23/`.
- **Claus noves** (5 llengües, `section.connectar.visibilitat.*`): interruptor, interruptorCom, ajuda, globalPrivada, globalPrivadaCom, errorLectura, error, publica i privada.

### 13. Ronda 7 (01:13-02:01): FEDI-23 (migració 2611032100), FEDI-14..20 i la integració de FEDI-22

- **Treball:** workflow `wf_a6d64d6d-6ea`, amb 5 lents i 5 refutadors (10 agents, 2.805.831 tokens de subagents).
- **Instantània:** `snap_r7`, el viu de les 01:13:18. Inclou FEDI-22, però no l'interruptor de les 01:23.
- **Com:** la lent SQL va trobar un PGlite 0.3.16 local a l'scratch d'una ronda anterior i hi va executar sondes pròpies (cap xarxa, cap remot). La lent global va passar el Vitest sencer i el cens de portes sobre la instantània.
- **Resultat:** 53 troballes. Els refutadors en confirmen 36 i en deixen 17 com a parcials; no en refuten cap. Severitat final: **2 P1, 9 P2 i 42 P3**. Hi ha a més 2 omissions dels refutadors, totes dues P2.

**Els dos P1 són de Codex**

| Id | Què passa | Evidència | Proposta |
|---|---|---|---|
| **SQL-01** | **Anon rep el nom, l'avatar, l'id i la data exacta de persones que no han donat cap consentiment** (global privada), quan són el destí de les arestes d'una altra persona o d'una entitat. Una entitat pot seguir fins a 1.000 veïnes i publicar-ne la llista. | Sonda PGlite: `connexions_publiques_de` com a anon torna «Bea NoConsent», mentre `perfil_public(B)` dona 42501. La prova de Codex `tests/connexions-publiques-postgres.test.mjs:128` ho dona per bo. Contradiu la política §13 i el model `perfil_public`. | En mode públic, exigir també `connexions_global(desti)`, o llevar l'EXECUTE a anon (l.295). Afegir-hi una prova negativa. |
| **UI23-02** | El bloc del poble («Veïnat, empreses i entitats connectades al poble») no es pot activar mai: no hi ha cap productor de `poble.administrable`. | La part 3 de FEDI-23 és inabastable en tots els modes. | Calcular `administrable` a partir de l'autoritat real, i afegir-hi una prova sense mock. |

**P2**

| Id | Què passa | Carril |
|---|---|---|
| SQL-03 | **Associació forçada pública.** `inclou_persona_en_entitat` dona d'alta la persona amb l'etiqueta «Treballador / Soci» i la publica a anon si les dues globals són obertes; el vincle naix públic (`connexions_vincle`, l.95). | Codex |
| Omissió SQL | **El bloqueig es revela i se'l pot saltar.** Si A ha bloquejat E, `connexions_publiques_de(A)` torna [] a E amb sessió, però com a anon torna la llista sencera. | Codex |
| SQL-04 | **Cost de DoS.** Cada lectura pública, també d'anon, calcula totes les arestes del node: 5 ms amb 0 arestes alienes i 5.066 ms amb 3.000. | Codex |
| UI23-01 | Tot enllaç a una entitat dins de les llistes de connexions porta a `/entitats/<id>`, una ruta que no existix («Element no trobat»). | Codex |
| UI23-04 | En canviar l'interruptor del Perfil, el focus es perd al `<body>` i cap missatge no confirma el canvi (WCAG 2.4.3 i 4.1.3). | Codex |
| UI23-11 i PORT-01 | Amb el front desplegat abans de la migració, cada fitxa pública i cada poble mostren «No s'han pogut llegir les connexions. Torna-ho a provar.», un reintent que no servix. | Codex |
| PORT-02 | L'adaptador local no aplica els bloquejos fets per l'administració d'una entitat; el SQL sí. | Codex |
| Omissió PORT | Un `<soc-de-poble>` que declare la clau d'amfitrió `apps` fa fallar les connexions amb SDP-CONN-001. No es dona a socdepoble.org ni a l'app nativa. | Codex |
| ONADA2-09 | El CRDT rural (FEDI-15) creix de manera superlineal i té un sostre dur de 2.048 operacions per espai, sense compactació. | Codex |
| GLOBAL-01 | El **Tractor Pedra Seca** queda en roig (LLEI_08) per `VinculacioEntitat.jsx`, que FEDI-22 va deixar orfe. **Resolt per Codex a les 02:26:57:** l'ha mogut a `tests/helpers/vinculacioEntitatLegacy.jsx`, i el tractor torna a eixir amb PASSA. El kit de Claude queda superat. | Codex |

**Estat de FEDI-14, 16, 17 i 20, i de 15, 18 i 19** (lent «onada2», tot P3 després de refutar)
- **FEDI-14 no està aplicat** (ONADA2-01): el Move del Perfil no va signat i la pantalla no genera ni importa cap clau. L'única implementació viu en directoris temporals del sistema i ja no s'aplica neta (ONADA2-02).
- **FEDI-20, connector WP** (ONADA2-03 i 04):
  - la quota per IP (10.000 caràcters cada 10 minuts) és igual al pressupost diari del lloc, de manera que una IP deixa sense traducció tot el lloc;
  - el connector modificat encara diu 1.1.12 i no coincidix amb el zip 1.1.12.
- **FEDI-15, 18 i 19** consten com a verificats amb un abast que Codex ha redefinit (ONADA2-05). Al Perfil públic sense bio, els títols salten d'H1 a H3 (ONADA2-06).
- **FEDI-17 i FEDI-23 al kit:** els 6 casos nous només proven el rebuig, i en local només 59 dels 126 mètodes passen algun cas positiu (ONADA2-11 i PORT-07).
- **Claims de MarIA que el codi contradiu:**
  - ONADA2-08: R3O-05, R3O-06 i R2-F04-03 no estan resolts;
  - ONADA2-12: cita un `src/data/conformitat.js` que no existix;
  - GLOBAL-02: encara diu «56/57 portes, només Reflex»;
  - UI23-14: dona FEDI-23 per «[FET]».
- **Paquet Open Data** (ONADA2-07): encara diu que socdepoble.cat no funciona.

**Tancat o corregit**
- **R7-NAV-01:** no es reproduïx. MarIA ho va corregir a `identitatsSeed.js` a les 01:10:12, i al viu de les 02:03 passen 51 de 51. La fallada que vaig registrar a la secció 12 era d'una execució anterior.
- **Atribució de `VinculacioEntitat.jsx`:** MarIA l'ha corregida a la v4.4.3 («creat per Codex»).
- **UI23-07** (/connectar sense interruptor): l'interruptor ja hi és des de les 01:23, i la línia d'avís s'arregla a la correcció d'esta ronda.

**Una altra mà ha treballat sobre /connectar després de la integració (01:42 i 01:55).** Hi ha dues operacions segellades per executor:
- `FEDI23-connectar-final-scope-and-copy`, sessió `7c9cd5b4…`;
- `FEDI23-connectar-async-family-final`, sessió `16615799…`.

Totes dues parteixen exactament de les postimatges de Claude: el «before» de cada fitxer és el meu hash, és a dir, CAS correcte. Han afegit enduriment asíncron a `useIncloureEnEntitat`, `VisibilitatDeLaConnexio` i `BlocFormarPart` (entrada de sessió, generacions i àmbit) i han precisat el text de la global privada («esta no es mostra a la teua fitxa pública»). Claude ho accepta tal com està.

**Correccions de Claude a /connectar, integrades per CAS a les 02:31:18** (16 fitxers; rebut a `c4/rebut_integracio_r7.json` i preimatges a `c4/r7fix_preimatge_viu/`)
- **GLOBAL-03:** les notes s'obrin en el mateix render que canvia la vista, amb estat derivat del valor anterior en lloc d'un efecte. Prova nova: `ConnectarSection.notes.test.jsx`, que mira cada commit amb un `Profiler`. Passa amb el codi nou i falla amb el vell (2 commits amb les notes plegades).
- **GLOBAL-04:** la pàgina de /connectar és contenidor amb nom (`.sdp-connectar-pagina { container: sdp-connectar-pagina / inline-size }`), i el tall de mòbil de 30rem el fa servir. Així T1 i els seus fills canvien al mateix tall.
- **GLOBAL-06:** `src/sections/connectar/sondaConnexions.js` recorda NO-DISPONIBLE per backend dins del document, i ni la Targeta 2 ni l'interruptor tornen a preguntar a cada visita. Cap altre error es recorda. Hi ha dos límits acceptats: el record no caduca dins del document, i dues sondes alhora no es dedupliquen.
- **SQL-03:** l'avís d'incloure diu el que fa el SQL: «Si l'entitat i la persona tenen les connexions públiques, la pertinença, amb el rol, també eixirà a la fitxa pública de l'entitat, llevat que alguna de les dues l'amague.» Està en les 5 llengües.
- **UI23-07, retirada:** la línia d'abans del clic («Si tens les connexions públiques…») no s'integra. La revisió adversarial (workflow `wf_ad913338-3ad`, 3 revisors i 706.101 tokens) hi va trobar tres P2:
  - es pinta sense que el servidor haja confirmat res, i en remot no ho ha confirmat cap;
  - no diu que la connexió també ix a la fitxa pública de l'altra persona;
  - trau el primari de T1 de la pantalla a 1280×800 (RA-01).

  Què ha de dir depén de com es corregisca SQL-01. Després de connectar, l'interruptor de la connexió ja diu on es veu.
- **Proves al viu (02:31):** `npx vitest run src/sections/connectar/ src/sections/profile/ src/sections/pobles/ src/config/` dona 205 fitxers i 3.799 proves, totes verdes. Eslint 0, `design_guard` 0, el Tractor Pedra Seca PASSA, i /connectar (Oli i Carla), /mur i /fedivers al :3340 tenen 0 errors.

**Nou P1 (02:12), al carril de FEDI-22: «Formar part» envia les sol·licituds a una safata que ningú no llig**
- **Què va canviar:** l'operació segellada `FEDI23-restore-pending-request-ui-final` (sessió `30c80340…`, 02:12:21) va fer que «Formar part» de /connectar, amb la capacitat `connexionsPubliques`, cridara `solicitaUnirSeAEntitat` en lloc del xat privat de l'entitat (`BlocFormarPart.jsx:84` i `:157`).
- **Ningú no la pot llegir:** cap RPC, cap mètode del contracte ni cap pantalla no llig `private.connexions_sollicituds`. Ho he comprovat amb un grep de tot `src/` i `supabase/` a les 02:30. Tot i això, la interfície diu «Sol·licitud guardada, pendent de revisió per l'entitat» (`:260`).
- **En remot falla:** l'adaptador declara sempre la capacitat i la migració no està aplicada enlloc. El botó va a NO-DISPONIBLE i ix l'error de «vincle» (`:183`). El camí del xat sí que funciona hui.
- **Una decisió esborrada:** el canvi lleva de la capçalera la «Decisió del Mestre (261024): cap taula de sol·licituds».
- **Kit de reversió**, provat i NO aplicat (és un fitxer reclamat per FEDI-22, però el canvi l'ha segellat una altra mà): `_investigacio_ia_de_poble/261104_0232_claude_r7_formarpart/` (sha256 `3d770c4e…`).
  - Torna a la versió segellada de les 01:55, que té el xat i tot l'enduriment asíncron.
  - Lleva la prova pendent.
  - En una còpia del viu dona 1.928 proves verdes, i `git apply --check` dona exit 0 sobre el viu de les 02:32.

**Decisions noves**
- **D-10 · No apliqueu la migració 2611032100 a cap servidor** fins que SQL-01 i l'omissió del bloqueig estiguen corregits (o fins que el Mestre accepte que anon veja persones, actualitzant abans la política §13). Abans d'aplicar-la caldria també arreglar SQL-03 i SQL-04 i decidir SQL-02. L'ordre de desplegament ha de ser: primer la migració i després el front (UI23-11 i PORT-01).
- **D-11 · GLOBAL-01: tancada.** Codex va moure el component a una fixture de proves (02:26:57). El kit `_investigacio_ia_de_poble/261104_0212_claude_r7_orfe/` queda marcat com a superat.
- **D-12 · FEDI-14.** Reprendre'l o marcar-lo «aparcat» al Pla §6 i a l'informe de MarIA.
- **D-13 · «Formar part» (per a MarIA, ara).** Aplicar el kit `261104_0232_claude_r7_formarpart`, que torna la sol·licitud al xat de l'entitat, fins que hi haja safata i aprovació per a qui administra, la migració aplicada i una decisió del Mestre que revoque la de 261024. Si no s'aplica, cal com a mínim llevar el text «pendent de revisió per l'entitat», perquè ningú no la revisarà.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- Gauntlet 1 = workflow `wf_b571e997-76d` (16 agents, 0 errors, 1.155 crides a eines), amb 8 lents en paral·lel i un refutador adversarial per lent amb troballes. Resultats crus: 63 troballes, de les quals els refutadors confirmen 34 P0-P2 (amb ajust de severitat) i en refuten 6 perquè altres mans les han corregides al disc o no es reproduïxen (C2X-02, C2X-05, F5 d'Oli, PP-04, PP-08 i PP-09). JSON complet a l'scratch de la sessió (`c4/gauntlet1.json`).
- Ordres clau, totes reproduïbles: `dig +tcp +short socdepoble.cat`, `curl -sS -D - http://socdepoble.cat/`, GET REST d'`app_content` amb la clau anònima, `npx vitest run …` (llistes a la secció 3), `node tooling/gates/{design_guard,frontissa-contingut,porta-olivera}.mjs`, `node tooling/seo/check-editorial-copy.mjs`, `node tooling/gates/run-portes.mjs --cens`, `npm run lint` i `node --test` amb la suite primària.
- Gauntlet 2 (`wf_0733d90b-8f6`, 14 agents), Gauntlet 3 (`wf_4f9f953e-ca5`, 12 agents), verificació del correu (`wf_b07a1b46-947`, 5 agents) i Gauntlet 4 (`wf_e5840882-6d0`, 10 agents). Tots han treballat sobre instantànies APFS (`cp -cR`, 7 s) amb hashes de la llista bruta, i cap refutador no ha tombat cap troballa de les rondes 2-4. JSON: `c4/gauntlet{2,3,4}.json` i `c4/correu_maria.json`.
- Cap escriptura de les lents al repositori ni a Supabase. Les còpies, scripts, captures i perfils de Chrome (mkdtemp, `--use-mock-keychain --password-store=basic`) són a l'scratch de la sessió, i els perfils s'han esborrat.
- **Escriptures de Claude (esta sessió) a l'arbre:**
  - este informe;
  - el pegat P0-16, aplicat a les 16:27:45: `src/data/backendPortEstat.js` (nou), `src/data/backendPort.js` (preimatge `3f146277…`) i `src/data/backendPort.hmr.test.js` (nou);
  - les correccions de la ronda 7, a les 02:31:18: 16 fitxers de `src/sections/connectar/**`, `src/css/modules.css` i els 5 diccionaris (secció 13). També dos kits sense aplicar a `_investigacio_ia_de_poble/` (261104_0212 superat i 261104_0232);
  - FEDI-23 a /connectar, a les 01:23:18: 2 fitxers nous (`VisibilitatDeLaConnexio.jsx` i la seua prova), més `BlocRelacio.jsx`, `ConnectarSection.relacions.test.jsx` i els 5 diccionaris;
  - FEDI-22, a les 01:09:26-27: 23 fitxers de `src/sections/connectar/**`, les regles `.sdp-connectar*` de `src/css/modules.css` i les claus `section.connectar.*` dels 5 diccionaris. Hi ha rebut CAS per fitxer (secció 12).
  - Res més: cap commit, cap desplegament, cap migració i cap escriptura a `.agents/` ni a `tooling/`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- La línia base s'ha auditat sobre HEAD `bae4d717e` i sobre l'arbre viu, que s'ha mogut durant l'auditoria (pageContent 15:37/15:41, frontissa 15:38, backendPort i contracte 16:13). Cada troballa diu si val per a HEAD, per al disc o per a tots dos.
- Les rondes 2-4 han cobert el lliurament de Codex i de Gemini/MarIA fins a les 19:33. El que haja canviat després de la instantània de la ronda 4 no està auditat, i a les 20:30 el viu era igual que la instantània en els fitxers de les lents.
- No he tocat `pageContent.js`, Supabase, `.agents/` ni `tooling/`: són carrils o rutes de govern d'altres. Les redaccions proposades són text perquè les aplique qui en tinga la propietat.
- La ronda 7 ha cobert la instantània de les 01:13. Els canvis d'altres mans de les 01:42, 01:55, 02:12 i 02:26 a /connectar s'han revisat a mà (diff i segells), no amb un Gauntlet complet.
- FEDI-22 s'ha provat en navegador en mode llavor i en el :3340 sense sessió. No s'ha provat amb una sessió real contra Supabase, perquè la migració 2611032100 no està aplicada a cap remot.
- Gemini no ha publicat cap informe propi a l'Escriptori: el seu treball s'ha auditat pels fitxers.
- No he enviat res a ningú. El correu a NLnet, el desplegament, la versió 1.1.13 del connector, les migracions i el commit són decisions del Mestre (D-1..D-9, R4PC-03).
- FED-03 i FED-01 depenen d'una decisió humana (`requires_human_decision: true`). Amb el Mestre absent, ho arbitra MarIA (§6 del prompt), però el correu a NLnet és una acció externa i irreversible.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261103_1412_pla_implementacio_teler_fediversity_oli_xat_i_logos_duals]]
- [[261103_1412_prompt_teler_maria_codex_gemini_claude_fediversity_i_poliment]]
- [[261103_1531_auditoria_codex]]
- [[261103_1542_auditoria_maria]]
- [[261103_1604_auditoria_codex_gauntlet_fediversity]]
- [[261031_0142_acta_tancament_seo_consola_telemetria_i_full_de_ruta_fediversity]]
