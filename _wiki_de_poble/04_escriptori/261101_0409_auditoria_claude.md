---
type: informe
status: canonic
description: 'Execució Gauntlet de T1-T8 del prompt 261101_0311: WordPress.org obert, Fediversity verificable, Notes, Multimèdia, botigues i deute del Llibre Mestre'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_e16bf731-8a9a-4245-aa3f-d81416b0ae05:ac7ab8cf-5162-486f-a697-e60ae50e41f0
---
# Auditoria de Claude · Marató nocturna Fediversity, Notes i Llibre Mestre

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e16bf731-8a9a-4245-aa3f-d81416b0ae05:ac7ab8cf-5162-486f-a697-e60ae50e41f0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-01T03:09:30.771Z |
| Modificació | 2026-11-01T06:50:00.000Z |
| Propietari | claude |
| Aprovació humana | Ordre del Mestre al xat (2026-11-01 ~04:00 CET): executar T1-T8 del prompt 261101_0311 en mode Gauntlet; resultat pendent de la seua revisió |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) · Ultracode, amb subagents del mateix model en workflows |
| Tokens consumits | ~13,3 M de subagents (sis workflows, 49 agents) més el fil principal |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-01T03:09:30.771Z: esborrany creat; contingut i verificació pendents.
- 2026-11-01 04:00–04:25 CET: lectura sencera del pla, del prompt i del Llibre Mestre; torn de codi `torn_e16bf731` obert; comprovació en viu de WordPress.org, NodeInfo, actors, outbox, host-meta i gentdelatorre.net.
- 04:25–05:15: nou carrils d'implementació en paral·lel (T1-T6) i un explorador de T7.
- 05:15–06:50: integració, fase 2 (T7 i fitxa OKF a Proposa Card), Gauntlet 1 (8 revisors, 77 troballes) i correccions (7 carrils).
- 06:50–07:30: Gauntlet 2 (5 revisors, auditor de kits i crític de completesa), correccions finals (5 carrils), kits integrats i transacció de governança.
- 07:30–07:50: verificació final T8 i este informe.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum

**Fet, a l'arbre viu, sense commit ni desplegament.** Les huit tasques del Mestre estan executades i provades; les que depenen d'una decisió seua o d'una acció fora de la màquina queden llistades a «Decisions del Mestre». Dos Gauntlets adversarials (13 revisors) han trobat 4 P1, 41 P2 i 92 P3; tots els P1 i la gran majoria de P2 estan corregits i tornats a provar. La suite sencera, el build i les portes són a «Verificació».

**Abans d'enviar el correu a NLnet:** desplegar el web (producció servix el build de les 01:39 i no porta res d'este torn), pujar el readme corregit de WordPress.org per SVN i decidir la 1.1.11 del connector, perquè socdepoble.org, wordpress.org i gentdelatorre.net diguen el mateix (D-2).

### Correccions al pla i al prompt (verificades)

- **Slug de WordPress.org:** és `socdepoble` (API oficial: versió 1.1.10, requerix WordPress 6.6, provat fins a 7.1.4, PHP 7.4). L'slug `soc-de-poble-mur` que proposa Gemini (TG-02) és erroni i no s'ha usat.
- **Bústia de La Torre:** `/ap/actors/la-torre-de-les-macanes/outbox.json` dona 404. La bona és `/ap/outbox/la-torre-de-les-macanes.json` (200, buida: `totalItems` 0).
- **Rutes inexistents:** `tooling/quality/*` (les portes són a `tooling/gates/`), `src/utils/exportaMunicipiOpenData.js` (és `src/data/`), `src/utils/proposaCard.js` (és `src/sections/notes/`), `src/sections/Mur.jsx` (és `src/sections/mur/TargetaDelMur.jsx`), `_wiki_de_poble/01_sistema/` i `_wiki_de_poble/00_index_maquina.md` (és `02_saber/00_index_maquina.md`). No s'ha creat cap carpeta.
- **Captura de la Card:** `01_produccio/261101_0256_card_bloc_de_notes_ploma.jpg` és una captura de la Card sencera (capçalera, títols, etiquetes). La foto de la mà i la ploma ja és `public/assets/notes/bloc_notes_vintage.webp`; copiar la captura hauria pintat una Card dins d'una altra. No s'ha tocat `01_produccio/`.
- **WebFinger:** la consulta estàndard `?resource=` dona 404 (Firebase no encamina per query); funciona la ruta `/.well-known/webfinger/acct:…` i `host-meta`, que és el que diuen ara les pàgines i el readme.

### T1 · WordPress.org a /page/descarregues

- `src/config/canalsDeBotiga.js`: canal `wordpress-org` obert amb `https://wordpress.org/plugins/socdepoble/`; `urlDeCanal` només admet la fitxa de l'slug `socdepoble`. Google Play i App Store continuen tancats.
- `PAGE_COPY.descarregues`: connector oficial 1.1.10 públic, instal·lació des del tauler, `[socdepoble_app poble="la-torre-de-les-macanes"]` i la plantilla «Sóc de Poble · full screen» (comprovats al tag 1.1.10 de l'SVN), com fa gentdelatorre.net. La promesa «no enllaça botigues que encara no estan obertes» continua certa i es prova contra `canalsOberts()`.
- `tooling/seo/check-editorial-copy.mjs` (governança): Descàrregues només pot enllaçar la fitxa d'una botiga oberta.
- Frontissa: empremta aprovada en nom del Mestre per l'ordre del xat (16/16).
- `src/data/iaiaLocal.js`: l'Atles de la IAIA ja no diu que la fitxa s'obrirà.

### T2 · /page/fediversity verificable

- WordPress.org 1.1.10 publicat i actiu amb 10 captures (comprovat al readme publicat, a l'API i als assets de l'SVN).
- «Fet hui (verificable)» només per al que és cert al codi o en producció: connector i node gentdelatorre.net, perfil mínim d'allotjament, fletxes IDEA-58 i traductor IDEA-31 (els seus chunks són al paquet de producció), proves de contrast 7:1 i design_guard, alertes municipals, Open Data 1.1.0, fitxa de memòria oral OKF v0.2 a Proposa Card, federació fase 1 només de lectura i la prova de l'instal·lador.
- Queden a «Pendent», amb el motiu: administració multimunicipi, federació fase 2, Karpathy amb models de llenguatge, Nix, compilació d'una còpia real i l'E2EE (el motor P-256/AES-GCM-256 és al repositori darrere d'una bandera apagada; el paquet de producció no porta ECDH). Este és l'únic punt on la pàgina es desvia del pla aprovat, i a propòsit (D-1).
- Verificació en viu en 1 clic: WordPress.org, gentdelatorre.net, `/.well-known/nodeinfo`, `/nodeinfo/2.1.json`, els dos actors, les dues bústies de sortida i `/.well-known/host-meta`, amb adreces absolutes i enllaços que es distingixen del codi.
- El comentari de la clau diu què és desplegat i què arriba amb el pròxim desplegament.

### T3 · Partides 1, 3 i 4 de NLnet

- **Open Data (`src/data/exportaMunicipiOpenData.js`):** format 1.1.0. Ja escrivia NewsArticle, Event, CreativeWork, Data Package v2 i BagIt SHA-256; ara també `agenda.ics` (RFC 5545) amb el serialitzador únic de `src/utils/ics.js` (`escapa` i `plega` exportats). Corregit un desfasament d'un dia en els actes de dia sencer (`fiInclusiva`, B1-01), la compatibilitat amb els lectors 1.0.0 documentada i provada, el nom del calendari amb contraccions («Agenda d'Alcoi», «del Campello») i un error clar per a dates fora de l'any 9999. La descàrrega real de la fitxa encara només porta el directori i la memòria: notícies i agenda necessiten una lectura pública al port (D-11).
- **Memòria oral (Mètode Karpathy local):** `src/sections/notes/memoriaOral.js` genera títol, descripció, resum extractiu, etiquetes d'un vocabulari rural tancat, poble detectat i una fitxa OKF v0.2 en esborrany, sense xarxa, rellotge ni tòkens. «🎴 Proposa Card» obri el diàleg `src/components/universal/FitxaMemoriaOral.jsx`: mostra la fitxa i el fitxer sencer, deixa llevar etiquetes i triar el poble abans de «L'he revisada» i la descarrega en Markdown. El fitxer no porta cap identificador del compte. Falsos positius de cognoms, «sella», «riu» o «li deia» corregits; queden decisions de vocabulari (D-5).
- **Alertes municipals al Mur:** distintiu «Alerta municipal» o «Bàndol urgent» (AAA en clar i fosc, 7,2:1 a 10,5:1) només si signa un ajuntament (`kind` `city_hall` del directori; el payload no compta; fail-closed); les vigents (72 h) pugen dalt amb una sola regió `role="status"`. Sense alertes, el DOM del Mur no canvia.
- **Instal·lador:** `tests/inicia-node-germa.test.mjs` executa `tooling/instalador/inicia-node-germa.mjs` de punta a punta per a Xixona en `os.tmpdir()`, amb una font immutable (git archive de HEAD), i comprova SHA-256, absència de secrets, repositori intacte i federació. Marca com a [DEFECTE] que el node nou encara hereta l'actor de La Torre (D-13). S'hi afigen dues proves de frontera del kit de Codex.
- **Perfil mínim d'allotjament:** `_wiki_de_poble/02_saber/architecture/perfil_minim_allotjament_node_municipal.md`, amb xifres mesurades (dist/ de 1.100 fitxers, gzip i brotli en producció), preus oficials amb data i tres escenaris; ancorat a `02_saber/00_index_maquina.md` i `00_index.md`.

### T4 · IDEA-59 / P1-72 al Bloc de Notes

Verificat en viu a `http://localhost:3340/notes`:

0. La Card «Bloc de notes» (mà i ploma) és a «Tot», també amb sessió (element de només lectura que no es desa al servidor), i `/notes` sense paràmetres l'obri seleccionada a la columna 3 i la porta a la vista a la columna 2. `nota=` i `carpeta=` explícits es respecten.
1. Guia del cos (`richText/extensions/guiaCos.js`): decoració que mai es desa, publica ni arriba a la Card; desapareix en focus, torna en blur amb 0 caràcters i no torna si s'ha escrit almenys un caràcter.
2. Desplegable d'encapçalaments H3, H4, H5, H6 i H2 amb `useMenuEmergent` de Pedra Seca, teclat complet i nom accessible que conté el text visible (WCAG 2.5.3).
3. Subratllat fora del tot: botó, marca, Cmd/Ctrl+U i `<u>` enganxat. La «S» ratllada es conserva (D-4).
4. Icones pròpies (`richText/iconesBarra.jsx`, contracte lucide, 24 px dins de 48 px) i botó «⋯» amb segona fila (`aria-expanded`, `aria-controls`, focus en ordre). En compacte, Escape torna el focus a «⋯» i un diàleg obert no tanca el panell.

### T5 · Multimèdia, xat i readme

- **P1-71:** la Barra de volums és a la Columna 1 davall de les vistes (`UniversalWorkspace` · `peuNavegacio`, fora del `<nav>`), sense desbordaments de 390 a 1440 px; «Carpeta local» sense volum porta una línia d'ajuda. `MultimediaProvider` ja no peta fora d'`IdentitatProvider` (`IDENTITAT_DE_RESERVA` única a `CoreContentContext.jsx`). Blindar Mur, Notes i Xat igual és decisió de privacitat (D-7).
- **P1-70:** les cares del xat carreguen `javi-llinares-256x256.jpg` (16 KB, bessona WebP 13 KB) via `src/sections/xat/caresLleugeres.js`; comprovat en viu. El perfil continua amb la foto gran (D-8).
- **readme.txt:** sincronitzat amb la 1.1.10 publicada sense copiar-ne els errors: el publicat diu coses que el codi desmentix (E2EE, iCal, `og_remots`, `api.socdepoble.org`, «Basc i Alemany» amb Apertium…). La variant del directori corregida i les comandes SVN són a `_builds_de_poble/wordpress/261101_0615_wordpress_directori_readme_v1.1.10.txt` i `…_svn_readme_v1.1.10.txt` (D-9).
- **Proactiu (T7):** «Mostra els detalls» del connector ja no pinta `**` ni `*` literals i protegix el codi (`ajustos.php`, `actualitzador.php` comparteixen una funció). Arriba amb la pròxima versió del connector.

### T6 · Google Play i App Store

- `ios/App/App/PrivacyInfo.xcprivacy`: `NSPrivacyTracking` false, motius d'API revisats i tipus de dades coherents amb el codi (ubicació precisa i aproximada, contactes pel graf de seguiments); `plutil -lint` OK.
- **App Links:** `firebase.json` passa a `appAssociation: NONE` (amb AUTO, Firebase servia `[]` des de fora del repositori). `tooling/vite/associacio-apps.mjs` (governança, registrat a `vite.config.js`) només emet `assetlinks.json` amb empremtes reals de Play a `scripts/botigues/associacio-apps.json`; hui buit. No s'ha creat `public/.well-known/` ni cap AASA: l'App no declara cap domini associat.
- **Eliminació del compte:** Perfil → Privacitat i dades → Esborrar el compte, en dos tocs i una confirmació (Apple admet la confirmació); «Privacitat i dades» ja es traduïx.
- **Dossier:** `_wiki_de_poble/02_saber/architecture/guia_publicacio_app_store_i_google_play.md`, privat (`visibility: private`, tipus `protocol`) perquè porta bloquejants interns: textos en valencià, castellà i anglés comptats contra els límits oficials, respostes Data Safety amb el fitxer que les justifica, mides de captures de 2026 i comandes `sips` provades, i els passos pendents. Ancorat al Llibre Mestre.

### Millores Proactives Reversibles Aplicades

| Millora | Fitxers | Com es desfà |
| --- | --- | --- |
| P1-22: barra blava i taronja, calaix de l'Índex, «Categories», «Pantalla completa», accions del peu de les targetes, alertes i «Privacitat i dades» en la llengua de la interfície (en valencià, cap atribut canvia) | `src/components/universal/barres/textosBarres.js`, `BarraBlava.jsx`, `BarraTaronja.jsx`, `PageFrame.jsx`, `UniversalCard.jsx`, `PantallaCompleta.jsx`, `PerfilShell.jsx`, `perfilModel.js`, blocs «T7 · P1-22» i «Gauntlet 2 · Y-Alertes-T7» dels diccionaris | Tornar els literals i llevar els blocs marcats dels cinc diccionaris |
| Fitxa de memòria oral OKF a Proposa Card | `FitxaMemoriaOral.jsx`, `memoriaOralDelBloc.js`, clau `memoriaOral` de `DocumentEditor.jsx` i `NotesEditor.jsx` | Passar `memoriaOral: null` a NotesEditor (el DOM torna al de sempre) |
| Mini-Markdown de «Mostra els detalls» del connector | `wordpress-plugin/includes/ajustos.php`, `actualitzador.php` | Llevar les dues línies de cursiva i negreta i la protecció del codi |
| Text de l'espècimen de la barra al catàleg de Disseny | `src/sections/disseny/cataleg/manifest.js`, `EspecimenBarraEines.jsx` | Tornar el text anterior |
| Entrada nova a /versions (01-11) | `PAGE_COPY.versions` | Llevar l'entrada; la frontissa ho marcarà |
| Kit de Gemini: `article`/`section` als espècimens Indicador, Tasques i Utilitats (design_guard de 12 a 9 avisos) | tres `Especimen*.jsx` | `git checkout -- <fitxer>` |
| Kit de Codex: proves de frontera de l'Open Data i de l'instal·lador | `tests/codex-k1-*.test.mjs` i dues entrades del manifest | Esborrar els dos fitxers i les entrades |
| Guarda del verificador de secrets: el perfil d'allotjament ja no nomena els secrets d'Apple | document del perfil | — (era una fallada de la porta) |
| «Què és un node?» de la IAIA respon primer amb el perfil d'allotjament, que ara definix el node i remet al Model B | `src/data/iaiaLocal.test.js`, document del perfil | Restaurar la fila del 261031 i llevar la primera frase del document (D-3) |

### Kits de Gemini i Codex

Auditats en dues còpies, mai aplicats en cru. **Gemini:** 3 de 13 pegats integrats (espècimens). Rebutjats: 7 canvis `div`→`section` sense capçalera que només silencien l'heurística `div-soup` (la proposta és arreglar la regla del design_guard), el pegat que trencava `sanitize.test.js`, la vCard que duplica `vcardOrganitzacio.js` i escapa pitjor, i un pegat opcional anunciat que no existix. **Codex:** 2 proves integrades i classificades; la d'associacions espera les empremtes reals; la d'OKF duplicava `proposaCard.test.js`; el pegat documental 01 ja l'havia fet MarIA (la reancoració de l'acta 0142 queda per a MarIA). Cap `--apply` dels scripts dels kits s'ha executat al viu.

### Qualificació dels 15 punts de la Matriu Universal

| # | Punt | Nota | Què falta per al 10 |
| --- | --- | --- | --- |
| 1 | Port neutral, Model B, zero lock-in | 8,5 | Un segon adaptador real que passe el kit de conformitat; cancel·lació real a upload/sign/remove (P1-27) |
| 2 | Pedra Seca i geometria | 8,5 | Les decisions de P1-28; 9 avisos de design_guard; trencament de paraules a la Columna 1 a 1024 px |
| 3 | Accessibilitat AAA | 7,5 | Auditoria amb lectors de pantalla reals, P1-22 sencer (Connectar, GestioMembres, Enquadrament), certificació WCAG |
| 4 | Sobirania i Open Data | 7,5 | Lectura pública de notícies i agenda al port (D-11) i fitxes OKF revisades dins del paquet |
| 5 | Federació oberta | 5,5 | Bústia d'entrada, signatures HTTP, WebFinger amb `?resource=`, outbox de La Torre amb contingut |
| 6 | Enxufabilitat (WordPress.org 1.1.10) | 8,0 | Readme corregit publicat i 1.1.11 amb el text nou i el Markdown de detalls |
| 7 | Nodes germans | 6,0 | Actor propi del node nou (proposta a `genera-federacio.mjs`), flake.nix verificat, un node independent desplegat |
| 8 | Privacitat, RLS i RGPD | 7,5 | E2EE actiu, P0-02 (token n8n), `.env` de la branca main (D-9), Apple al servidor |
| 9 | Bloc de Notes i Karpathy local | 8,0 | Decisions D-4 i D-5; afegir etiquetes o pobles en revisar |
| 10 | Memòria oral, patrimoni i multimèdia | 6,5 | Mòdul de memòria cultural, OKF a l'Open Data, decisió de blindatge HMR |
| 11 | Comunicació i xat | 7,5 | E2EE actiu, autoritat d'alertes per poble (D-6), rellotge de vigència |
| 12 | Multilingüisme i traductor sobirà | 7,5 | Revisió nadiua d'eu i gl, P1-22 sencer, traducció del connector a translate.wordpress.org |
| 13 | Botigues i PWA | 5,0 | Apple al servidor o botó amagat, empremtes de Play, captures reals, enviament a revisió |
| 14 | Governança, telemetria i Consola | 7,5 | Hook de pre-commit que puga passar (deute heretat), recepció verificable de mètriques (P2-14) |
| 15 | Rendiment i resiliència | 6,0 | Paquet principal de 1,46 MB (403 KB gzip) i manifest de la Wiki de 578 KB (200 KB gzip): partir-los; mode sense xarxa (ADR) |

### Visió de futur: fins on pot arribar el Mas perquè siga indestructible

Esta secció respon la T7.3 del prompt esmenat. Separa el que ja hi ha (amb el fitxer que ho prova) del que encara és camí, perquè el correu a NLnet no prometa res que el codi no sostinga.

#### 1. Clonable des del que publica

- **Hui:** cada poble pot descarregar-se el seu paquet Open Data (JSON-LD de schema.org, Data Package v2 de Frictionless i manifest BagIt SHA-256) des de la seua fitxa (`src/data/exportaMunicipiOpenData.js`, format 1.1.0). L'instal·lador `tooling/instalador/inicia-node-germa.mjs` copia una versió local del Mas a un node germà, i la prova `tests/inicia-node-germa.test.mjs` el fa córrer de punta a punta per a Xixona en una carpeta temporal.
- **Camí:** que el paquet porte també notícies, agenda i memòria (avui «pendents» perquè el port no té lectura pública anònima d'eixes col·leccions), que el node germà publique el seu propi actor (avui hereta el de La Torre) i que el `flake.nix` es verifique amb Nix. Amb això, un poble podria refer el seu node sencer a partir del seu paquet i d'una versió del codi, sense demanar res a ningú.

#### 2. Federació d'emergència entre pobles

- **Hui:** fase 1 de lectura: actors, outbox, NodeInfo 2.1 i host-meta publicats a socdepoble.org. Els bàndols i alertes municipals pugen al capdamunt del Mur (només si els signa un ajuntament).
- **Camí:** fase 2 amb bústia d'entrada i signatures HTTP perquè un bàndol urgent d'un poble arribe als nodes veïns; un perfil «emergència» que només federe alertes signades per ajuntaments, amb caducitat explícita.

#### 3. Supervivència sense núvols privatius

- **Hui:** port neutral (`src/data/backendPort.js`) amb kit de conformitat; Model B (Sollutia o WordPress com a amfitrions, dades al Supabase de Sóc de Poble); connector oficial a WordPress.org; traductor sense Google (Apertium i MyMemory); IAIA local sense models ni tòkens.
- **Camí:** un adaptador de dades autoallotjat (Postgres propi) que passe el kit de conformitat, i la doctrina online-first revisada amb una ADR abans de qualsevol mode sense xarxa (CRDT).

#### 4. Memòria oral immortal en format obert

- **Hui:** el Bloc de Notes estructura un relat en una fitxa Open Knowledge Format v0.2 en esborrany, sense xarxa ni tòkens, que només una persona pot donar per revisada i que es descarrega en Markdown amb el seu frontmatter.
- **Camí:** que les fitxes revisades entren al paquet Open Data del poble (amb `index.md` i `log.md` de l'OKF) i que es puguen federar com a `CreativeWork`.

#### 5. Argumentari per al correu a NLnet (sense promeses falses)

1. **Verificable en 1 clic:** /page/fediversity enllaça cada peça viva (WordPress.org 1.1.10, gentdelatorre.net, NodeInfo, actors, outbox i host-meta), i diu en «Pendent» el que encara no hi és.
2. **Lliure i portable:** AGPL-3.0-or-later, port neutral amb kit de conformitat i paquet de dades obertes per poble amb integritat SHA-256.
3. **Replicable:** instal·lador de nodes germans amb prova de punta a punta i perfil mínim d'allotjament amb xifres mesurades.
4. **Honest:** l'E2EE del xat és codi amb proves darrere d'una bandera apagada, i la federació és de lectura. Ho diem així.
5. **Ordre recomanat abans d'enviar:** desplegar el web, pujar el readme corregit de WordPress.org i decidir la 1.1.11 del connector (vegeu les decisions), perquè els dos nodes diguen el mateix.

### Decisions del Mestre

- **D-1 · Desviacions honestes del pla a /page/fediversity:** multimunicipi, E2EE, Nix i Karpathy amb models no van a «Fet hui» perquè el codi no ho fa. Confirmar-les abans del correu.
- **D-2 · Ordre de desplegament:** (1) desplegar Firebase (porta la miniatura de Javi i `appAssociation: NONE`); (2) a /versions, canviar «build pendent de desplegar» pel segell real; (3) pujar el readme corregit a SVN (trunk i tags/1.1.10) amb `_builds_de_poble/wordpress/261101_0615_wordpress_svn_readme_v1.1.10.txt` (este Mac no té svn); (4) decidir la 1.1.11 del connector, perquè gentdelatorre.net encara porta el text vell de /page/descarregues dins del paquet 1.1.10; (5) després, el correu a NLnet. Aprovació de la frontissa: s'ha fet en nom vostre per l'ordre del xat (descarregues i fediversity) i pel §0.2 (versions); confirmeu-ho.
- **D-3 · IAIA i «Què és un node?»:** ara respon primer el perfil d'allotjament; la decisió del 261031 era el document del Model B. Es desfà en una línia.
- **D-4 · Notes:** fixar la Card dalt de «Tot» (ara s'ordena per data i es porta a la vista); la nota nova des de l'entrada nua naix a «Tot» i no a «Mur»; en mòbil, l'entrada comença per CARPETES; sense sessió ja no es veu «Connecta per veure les teues notes»; la «S» ratllada es conserva; el text de la Card de `supabase/seed.sql` encara és el vell.
- **D-5 · Memòria oral:** autor sense identificador (`human:sense-identificador`) o àlies públic; afegir pobles o etiquetes en revisar; àlies castellans (Jijona, Torremanzanas…) i «la Torre» sol; vocabulari (cognoms, «festejar», «font»); Proposa Card ara s'encén amb qualsevol text.
- **D-6 · Alertes del Mur:** finestra de 72 h; autoritat de qualsevol ajuntament del node o només del poble (`pot_signar_com_organitzacio` no mira el tenant: cal una migració per a fer-ho estricte); semàfor (alerta en roig, bàndol en ambre); `role="status"`; consulta del directori amb sostre de 500.
- **D-7 · Blindatge HMR:** posar la reserva anònima també a Mur, Notes i Xat (funcionarien com a anònims sense proveïdor) i reproduir «Comprovant la sessió…» amb HMR real.
- **D-8 · Avatar de Javi:** camp nou `avatar_miniatura` en lloc de canviar `avatar_url` (que usen el perfil i altres pantalles).
- **D-9 · WordPress:** «Requires at least» 6.5 (repo) / 6.6 (publicat) / 6.8 (readme publicat); la captura 1 mostra noms de converses privades i la 3 i la 4 les DevTools; la 9 mostra un cistell de monedes; el Donate link s'ha llevat; traducció catalana a translate.wordpress.org (PTE); **seguretat: la branca main de github.com/socdepoble/socdepoble.org publica un `.env` de 149 bytes: reviseu-lo i, si porta cap secret, retireu-lo i roteu les claus.**
- **D-10 · Botigues:** el botó de Sign in with Apple ix a iOS però Apple està apagat al servidor (motiu de rebuig 2.1); declarar Contactes i, si els registres de Supabase guarden les cerques, l'historial de cerques; classificació 16+ (les condicions diuen 14 anys); empremtes de Play per a App Links; «1 clic» d'esborrat són dos tocs i una confirmació.
- **D-11 · Open Data:** capacitat de lectura pública de notícies i agenda al port (`contracte.js`, SDP-LOCK); `uid` i recurrència de la font; `dct:publisher` per a DCAT-AP.
- **D-12 · /versions:** la capçalera «Versió actual: v1.0.0 (build 261029)» ja no és certa i les Rondes 1-3 del 31-10 no hi tenen entrada.
- **D-13 · Nodes germans:** aplicar la proposta de `genera-federacio.mjs` amb `node-germa.json` (provada al scratch) i decidir si `supabase/` viatja amb la release.
- **D-14 · Torn sobrant:** `node tooling/gates/obrir_torn.mjs --help` va obrir el torn «agent-local» `torn_cff80b84` sense voler; no s'ha usat ni esborrat.

### Retroalimentació de la plantilla prompt_local

- Les rutes del pla i del prompt s'haurien de generar des de l'arbre (o validar amb una porta) abans de convocar: n'hi havia sis d'inexistents.
- La numeració de tasques del xat i la del prompt esmenat (T7-T9) no coincidien; convé que el prompt esmenat diga quines tasques renumera.
- Els enllaços d'1 clic d'un prompt s'haurien de comprovar amb curl en crear-lo (la bústia de La Torre donava 404).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les comandes s'han executat a l'arbre viu, sobre el tall final (07:24–07:39 CET).

| Comprovació | Comanda | Resultat |
| --- | --- | --- |
| Vitest sencer | `npx vitest run` | **1.573 fitxers i 27.243 proves passades, 0 fallades**, 103 omeses (07:32–07:39). La passada anterior (07:24) en va trobar una de roja, una frase de prova amb un nom vetat per `identitatDual.guarda.test.js`; s'ha corregit i s'ha tornat a passar la suite sencera. |
| Proves de Node | `npm run test:node` | 1.795 proves: **1.789 passades, 0 fallades**, 3 omeses i 3 diagnòstics heretats (classes de `PageFrame.jsx` i `App.jsx` sense regla d'abans del torn; fitxers tocats fora de la llista del torn). Inclou `tests/inicia-node-germa.test.mjs`, les dues proves de Codex i `node-suite-policy`. |
| Build de producció | `npm run build` | **exit 0**: tokens, RAG, slugs, web (2.997 mòduls), connector WordPress, SEO i social. `dist/.well-known/` no porta `assetlinks.json` (cap empremta configurada). El build regenera `public/rag-index.json` i `public/slugIndex.json`. |
| ESLint | eslint sobre els 142 fitxers JS tocats | 0 errors, 0 avisos |
| Porta d'autoritat | `node tooling/gates/porta-autoritat.mjs` | exit 0 |
| Porta Olivera | `node tooling/gates/porta-olivera.mjs` | exit 0 |
| Design Guard | `node tooling/gates/design_guard.mjs --arrel=src` | exit 0 · 0 crítics, 9 avisos (abans 12) |
| Contrast | `node tooling/gates/tractor-cromatic.mjs` | exit 0 (el `wcag_contrast_audit.mjs` del prompt no existix) |
| Frontissa | `node tooling/gates/frontissa-contingut.mjs` | 16/16 |
| Vocabulari, promesa i Pedra Seca | `tractor-vocabulari`, `tractor-promesa`, `tractor-pedra-seca` | exit 0 |
| Wiki | `compile-wiki-to-app --check`, `tractor-orfandat`, `tractor-frontmatter` | exit 0 · 0 enllaços trencats, 0 orfes |
| Porta editorial | `node tooling/seo/check-editorial-copy.mjs` | exit 0 |
| LEDGER | `node tooling/verify-ledger.mjs` | signatura vàlida |
| En viu | curl a WordPress.org (API i SVN), NodeInfo, actors, outbox, host-meta i gentdelatorre.net | 200; la ruta del pla `/ap/actors/la-torre-de-les-macanes/outbox.json` dona 404 |
| Navegador | `http://localhost:3340` (servidor del Mestre) al navegador integrat | `/notes` obri «Tot» amb la Card; `/page/descarregues` i `/page/fediversity` amb el text nou; `/multimedia` amb la Barra a la Columna 1; `/xat` carrega la miniatura de 256 px; 0 errors de consola |

Gauntlet: 13 revisors adversarials en dues rondes (G1: 77 troballes, 3 P1; G2: 60 troballes, 1 P1), 12 carrils de correcció i un crític de completesa. Les troballes obertes són decisions del Mestre (D-1 a D-14).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense commit ni desplegament.** Res d'este torn és en producció; el commit i el desplegament són decisió del Mestre. Els canvis conviuen amb fitxers d'altres mans sense commit (ESTAT, LEDGER, índexs, acta i informes de MarIA, Gemini i Codex).
- **Governança:** els 8 fitxers de camins protegits s'han aplicat amb una transacció Reflex (`open` → `seal` → `executor-mutacio.mjs` → `consume`, sessió `5353c955`). El primer intent el va refusar el segell per format i no va escriure res. `vite.config.js` s'ha editat directament (no és camí protegit) i ha reiniciat el servidor de :3340.
- **No verificat:** mòbils i tauletes reals, l'App nativa (flux de baixa, lectura sense compte), HMR real per a «Comprovant la sessió…», lectors de pantalla reals, la pujada a SVN (no hi ha svn), producció de Supabase i preus d'Hetzner (plans marcats com a no disponibles el 01-11). La fitxa OKF no s'ha mirat a 375 px.
- **Tancament del torn:** `tancament.mjs --check` ix amb `planned` només per quatre captures noves del Mestre a `01_produccio/` durant el torn (zona humana: el reconeixement és seu). El pla esmenat per MarIA a les 04:16 s'ha tornat a vincular. El torn no s'ha tancat amb `--close`.
- **Hooks:** la sessió va arrencar a la carpeta pare `Som de Poble/`, i els hooks de `socdepoble.org/.claude/settings.json` no hi carreguen; la política de mutació s'ha complit a mà.
- **Lectura:** s'han llegit sencers el pla, el prompt (també esmenat a les 04:16-04:17), el Llibre Mestre, l'acta 261101_0334 i els informes de Codex (0403) i Gemini (0407). No s'ha llegit `90_arxiu_historic/` ni cap `.env`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261101_0311_pla_implementacio_marato_nocturna_fediversity_notes_i_llibre_mestre]]
- [[261101_0311_prompt_marato_nocturna_fediversity_notes_i_llibre_mestre]]
- [[261101_0403_auditoria_codex_marato_nocturna]]
- [[261101_0407_auditoria_gemini_marato_nocturna]]
- [[perfil_minim_allotjament_node_municipal]]
- [[guia_publicacio_app_store_i_google_play]]
