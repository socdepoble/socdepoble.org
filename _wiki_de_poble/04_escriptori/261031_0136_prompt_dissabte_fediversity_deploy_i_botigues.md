---
type: prompt
status: esborrany
description: 'Pla i prompt mestre de dissabte 31-10: deploy a producció i botigues, deute post-commit i 5 fronts d''alt impacte per a NLnet Fediversity.'
tags:
  - govern
visibility: private
reflex: sdp:torn_af84be75-9938-4500-bf58-d7755dc43ec7:7100dfc0-ceea-4514-b18c-cfbaca6d1842
---
# Prompt Dissabte 31-10: Assalt Final NGI Fediversity, Deploy de Producció i Botigues

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

1. Verificar que el torn nocturn `261030_2208` (`torn_f298d1e0-3122-47a0-b815-bf2f719c5be3`) ha tancat netament (`state: closed`) amb l'informe `_wiki_de_poble/04_escriptori/261031_0040_auditoria_claude.md`.
2. **Neteja immediata d'`_wiki_de_poble/04_escriptori/` abans d'arrancar:** Moure tots els documents ja tancats de les jornades `261029_*` i `261030_*` cap a `_wiki_de_poble/90_arxiu_historic/` i regenerar `00_index_escriptori.md`, deixant a l'Escriptori **exclusivament** els documents necessaris per a la sessió de dissabte (`00_index_escriptori.md`, `03_llibre_mestre_tasques_i_idees.md`, `261031_0040_auditoria_claude.md`, `261031_0136_pla_implementacio_assalt_fediversity_deploy_i_botigues.md` i `261031_0136_prompt_dissabte_fediversity_deploy_i_botigues.md`).
3. Obrir nou torn d'execució amb `node tooling/govern/inici.mjs --agent=claude --model="Claude Opus 5.5" --intent="Dissabte 31-10: Deploy de producció, botigues mòbils i 5 fronts d'alt impacte per a NGI Fediversity" --scope=code`.
4. Llegir `_wiki_de_poble/04_escriptori/261031_0136_pla_implementacio_assalt_fediversity_deploy_i_botigues.md`, `_wiki_de_poble/03_actuar/03_llibre_mestre_tasques_i_idees.md` i `src/sections/text/pageContent.js` (clau `fediversity`).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_af84be75-9938-4500-bf58-d7755dc43ec7:7100dfc0-ceea-4514-b18c-cfbaca6d1842 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-31T00:37:24.871Z |
| Modificació | 2026-10-31T12:35:00.000Z |
| Propietari | maria |
| Aprovació humana | aprovat pel Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 3.1 Pro (High) |
| Tokens consumits | ~210k tokens |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-31T00:37:24.871Z: esborrany creat; contingut i verificació pendents.
2026-10-31T00:41:00.000Z: publicat el prompt mestre de dissabte 31-10 per al desplegament a producció i botigues i l'execució dels 5 fronts d'alt impacte d'NLnet NGI Fediversity (`2026-08-1a6`).
2026-10-31T12:35:00.000Z: actualitzada l'estratègia en **2 Rondes** per ordre del Mestre Javi Llinares: **Ronda 1 (Fase 0)** per tancar les 4 portes post-commit, fer els 3 commits de Git, publicar per SVN a WordPress.org (`https://wordpress.org/plugins/socdepoble`, exclusivament variant `--directori`) i generar les builds d'Apple TestFlight i Google Play Beta; i **Ronda 2 (Fase 1)** per executar els 5 fronts `F1–F5` de Fediversity i desplegar-los a `https://socdepoble.org` abans d'enviar diumenge de matinada el correu amb totes les evidències vives a Michiel Leenaars (`2026-08-1a6@nlnet.nl`).

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar:            ,                                      ,                             , i                          .

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (                ). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de                  i                        . No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (                         ): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (                               ), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

**🌍 Ecosistema Físic i Distribució de Carpetes (               vs                 ):**
- **Directori Mare (              ):** És l'entorn contenidor global de tot el projecte (                                                         ). No conté                ni és un repositori git (està protegit per un              de seguretat).
- **Nucli Operatiu i Git (                ):** És l'aplicació web, la Wiki oficial (                 ), el motor de regles i el repositori Git. Tota comanda de consola (          ,              ,             ,                   ) **s'ha d'executar obligatòriament a                 ** (p. ex.                                ). Si s'editen fitxers des de l'arrel de               , cal prefixar les rutes amb                  .
- **Carpetes Satèl·lit Exteriors de                (Ja Creades i Canòniques):**
  *                        : Únic destí oficial per a l'arxiu fred i la memòria històrica pesada que s'evacua d'Obsidian.
  *                    ,                         ,                     ,                      ,                             ,                            ,                        ,                     ,                 ,                      ,                   .
- **Prohibició Absoluta:** Està terminantment prohibit que qualsevol IA invente carpetes noves a                o a                 . La informació que calga preservar s'ubica exclusivament a les carpetes satèl·lit oficials ja establertes.

**⚡ ORQUESTRACIÓ DEL TRIO LOCAL I EXCLUSIVITAT DE CARRILS (Doctrina 2026):**
- **Rols i Models Actius:** IAIA MarIA (Directora Tècnica en Antigravity sobre                         /                 ), Claude Code (                                     com a motor principal d'implementació i refactorització multi-carril el 80% del temps, i                           reservat el 20% per a arquitectura fundacional i auditories extremes), GPT Codex (                    per a cicles d'enginyeria de portes i contractes, i             per a l'auditoria adversarial extrema final) i Gemini CLI (higiene de portes, cens i índexs).
- **Matriu d'Exclusivitat de Carrils (Zero Col·lisions d'Escriptura):** Quan operen múltiples agents en paral·lel sobre                 , cada agent modifica exclusivament els fitxers assignats al seu carril. Si detecta una millora fora del seu carril, deixa un pegat net          a                                 o l'anota al seu informe sense trepitjar l'arbre d'un altre agent.

**🔬 ENGINYERIA INVERSA I PARITAT AMB REA (Incentiu de Fidelitat):**
Totes les IAs (Claude, Codex, Gemini) tenen registrat i operatiu el conjunt d'eines MCP de REA (*Reverse Engineer Anything*) i la skill 'reverse-engineer-anything'. Quan se us encomane replicar, millorar o auditar una funcionalitat basada en un sistema o aplicació de referència existent (ex. el clon/patró WhatsApp, el TPV Loiverse, la Gestoria autònoma o la Frontissa de Sollutia), teniu autorització expressa i encoratjament per a utilitzar REA per a disseccionar bundles, lògica i comportament del patró de referència. L'objectiu és capturar la saviesa i el funcionament real de les millors aplicacions i traslladar-les al patró de Pedra Seca de Sóc de Poble amb el màxim trellat i sense duplicar codi.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Executar de cap a peus el pla `_wiki_de_poble/04_escriptori/261031_0136_pla_implementacio_assalt_fediversity_deploy_i_botigues.md` per deixar l'arbre commitejat, desplegat a producció (`socdepoble.org`, Git, connector WordPress i builds de TestFlight / Google Play Beta Testers), saldar el deute post-commit de l'Escriptori i completar els **5 fronts d'alt impacte (F1–F5)** perquè els avaluadors d'**NLnet NGI Fediversity (Expedient `2026-08-1a6`)** troben totes les partides amb evidència verificable en viu i puguen comprovar en `/page/fediversity` un estat d'execució sòlid, honest i sorprenent.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Fase 0 — Commit, Desplegament a Producció, Botigues Mòbils i Deute Post-Commit
1. **Commit i Push a Git + Deploy Web (`socdepoble.org`):**
   - Verificar que la suite completa (`vitest`, `test:node`, `porta-precommit`, `eslint`, `run-portes`) està en verd (`0` errors) després del tancament de `261030_2208`.
   - Executar `npm run build` (que genera les 34 rutes prerenderitzades i la instantània sanejada `dist/__iaia/{consola,mapa,govern,empaquetats}.json`).
   - Fer commit canònic a Git, pujar a la branca principal i desplegar a producció a `https://socdepoble.org`, verificant en viu:
     - Els `curl -sI` i `<meta property="og:image">` de les rutes clau (`/`, `/page/fediversity`, `/pobles/la-torre-de-les-macanes`, `/consola`, `/legal`).
     - Que `https://socdepoble.org/consola` carrega la instantània pública sanejada de les 4 fonts amb zero dades personals i zero bloqueig de `superadmin`.
     - Que `https://socdepoble.org/legal` mostra el nou Tauler públic amb l'organisme `QuadreDeComandament.jsx`, la gràfica horària bicolor Visitants + Vistes, la llei tipogràfica de llistes (`--sdp-li-gap: 4px`) i el rànquing de seccions sense `"Visita a: "`.
2. **Publicació Oficial a WordPress.org (`https://wordpress.org/plugins/socdepoble`) i Builds Mòbils (Apple TestFlight i Google Play Beta Testers):**
   - **NOVETAT MAJOR:** El WordPress Plugin Directory ha aprovat oficialment el plugin **«Sóc de Poble. Portal de Pobles Connectats»**! El repositori SVN ja està actiu a `https://plugins.svn.wordpress.org/socdepoble/` (`Revision 3776702`, amb `assets/`, `tags/`, `trunk/`) i l'URL pública és `https://wordpress.org/plugins/socdepoble` (usuari SVN: `socdepoble`).
   - Compilar la variant oficial de WordPress.org (`npm run build:wp:directori` + `node wordpress-plugin/eines/empaqueta.mjs --directori`) i deixar preparada la carpeta local d'escenificació SVN (`trunk/`, `tags/1.1.10/` i `assets/{banner-772x250.png,banner-1544x500.png,icon-128x128.png,icon-256x256.png,icon.svg}`) més l'script de publicació SVN per fer el primer commit oficial a `https://plugins.svn.wordpress.org/socdepoble`.
   - Actualitzar `/page/descarregues` i `/page/fediversity` (`src/sections/text/pageContent.js`) per reflectir que el connector de WordPress ja ha estat **aprovat oficialment al directori de WordPress.org** (`https://wordpress.org/plugins/socdepoble`).
   - Incrementar `versionCode` / `CFBundleVersion`, executar `npm run build:natiu && npx cap sync` i `node scripts/botigues/preflight.mjs --plataforma totes --signa`.
   - Preparar l'arxiu d'Xcode (`ios/App/App.xcworkspace`) per a la pujada a **Apple TestFlight** i l'`app-release.aab` d'Android Studio (`android/`) per a la pista de **Beta Testers** de **Google Play Console**.
3. **Sanejament del Deute Tècnic Post-Commit (Escriptori Net):**
   - **Carril Reflex (`DT-REFLEX-01`..`04`):** Afegir timeout explícit als hooks i runners, rotació automàtica de `.sdp/reflex-events.ndjson` quan supere `5 MB`, i netejar `writeFileSync` directes fora del circuit documental.
   - **Carril N1 (`DT-N1-01`):** Consolidar el helper compartit `tooling/vite/html-base-segur.mjs` per a `prerender-pobles.mjs` i `prerender-rutes-socials.mjs`.
   - **Carril Pedra Seca i Tokens (`DT-PS-01`..`03`, `DT-TKN-01`..`05`):** Purgar les classes `.sdp-ps-*` orfes a `pedra-seca.css` i substituir els literals finals per semàntics.
   - **Blindatge del Nom Termodinàmic de Sessió a les Skills (`wiki-cicle-de-vida` i `core-telemetria-huma`):** Fixar com a pas obligatori de tancament i d'Acta Marmota que MarIA entregue sempre en un bloc de codi copiable el nom termodinàmic de la sessió d'Antigravity amb el format uniforme `AAMMDD_HHMM · Tema Principal, Subtema 2 i Subtema 3` (sense paraules farcides com «tancament» o «sessió» al principi perquè en els ~27 caràcters visibles de la barra lateral d'Antigravity es llija sempre data, hora i tema clau).
   - Executar el ritual d'arxivat d'`_wiki_de_poble/04_escriptori/` cap a `90_arxiu_historic/` deixant l'Escriptori amb només els documents actius de la ronda.

### Fase 1 — Els 5 Fronts d'Alt Impacte per a NLnet NGI Fediversity (`2026-08-1a6`)
4. **Front F1 (Partida 3 — Open Data i Eixida de Dades verificable per l'usuari):**
   - En la fitxa pública de cada poble (`/pobles/<slug>`, `DetallPoble.jsx` / `PoblesSection.jsx`), incorporar un botó explícit i accessible **«Descarregar paquet Open Data del poble (JSON / ActivityStreams 2.0 + JSON-LD Schema.org)»** connectat a `exportaMunicipiOpenData(slug)` (`src/data/exportaMunicipiOpenData.js`) que descarregue al navegador el fitxer `<slug>-opendata.json` verificable amb el seu SHA-256 i llicència CC BY-SA 4.0.
   - Afegir test unitari i e2e que valide l'estructura de l'exportació i l'acció del botó.
5. **Front F2 (Partida 3 — ActivityPub estàtic amb publicacions reals, NodeInfo 2.1 i WebFinger):**
   - Estendre `tooling/vite/prerender-pobles.mjs` perquè cada `/ap/outbox/<slug>.json` incloga les **publicacions, notícies i esdeveniments públics reals** vinculats a eixe municipi com a activitats `Create` amb objectes `Note`, `Article` o `Event` d'ActivityStreams 2.0, generant també els seus respectius `/ap/objectes/<slug>/<id>.json` estàtics.
   - Generar en el build `public/.well-known/nodeinfo` i `public/nodeinfo/2.1.json` declarant el protocol `activitypub`, el programari `socdepoble` i el recompte real d'actors municipals i publicacions.
   - Mostrar l'identificador federat del poble (`@<slug>@socdepoble.org`) amb botó de còpia ràpida i enllaç al seu Actor JSON i Outbox en la fitxa de cada municipi (`/pobles/<slug>`).
6. **Front F3 (Partida 4 — Instal·lador reproduïble `tooling/instalador/` per a nodes germans «Gent de…»):**
   - Construir `tooling/instalador/inicia-node-germa.mjs` (juntament amb `tooling/instalador/flake.nix` o plantilla declarativa de configuració municipal) capaç d'inicialitzar en un sol comandament un node germà «Gent de `<Municipi>`» amb la seua identitat, colors, domini, WebFinger, Actor ActivityPub i paquet Open Data inicials.
   - Afegir el test `tooling/instalador/inicia-node-germa.test.mjs` que valide la creació reproduïble d'un node germà en un directori temporal.
7. **Front F4 (Partida 1 — Documentació pública del Port Neutral, Kit de Conformitat i Model B):**
   - Publicar i enllaçar des de `/page/fediversity` la guia tècnica verificable del contracte `CONTRACTE_NUCLI` (`src/ports/backendPort.js`), com executar el test de conformitat (`src/ports/backendPort.conformitat.test.js`) per a qualsevol nou adaptador, i els requisits mínims d'allotjament d'un amfitrió Model B (Web Component + GET per la Frontissa).
8. **Front F5 (Partida 2 — Extensió d'`IDEA-58` de navegació amb fletxes de teclat a totes les llistes):**
   - Estendre el helper reutilitzable `src/components/universal/workspace/navegacioTeclat.js` (`Home`, `End`, `ArrowUp`, `ArrowDown`) a les llistes mestres de `Pobles`, `Mur`, `Multimèdia`, `Notes` i `Consola`, amb tests de teclat en cada secció.
9. **Actualització d'Honestedat Verificable a `/page/fediversity` (`src/sections/text/pageContent.js`):**
   - Actualitzar els estats de la Partida 1, Partida 2, Partida 3 i Partida 4 a `src/sections/text/pageContent.js` i els seus tests a `src/sections/text/pageContent.fediversity.test.js` perquè reflectisquen amb rigor mil·limètric les proves vives desplegades en F1–F5, distingint sempre amb total honestedat l'ActivityPub estàtic de lectura de la futura bústia d'entrada (`inbox`) amb signatura HTTP.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Privacitat en l'Outbox ActivityPub i la Instantània de Consola:** Tant `/ap/outbox/<slug>.json` com `dist/__iaia/*.json` només poden exposar contingut 100% públic i sanejat; qualsevol correu, telèfon, NIF, ruta absoluta `/Users/` o secret ha de fer fallar el build.
- **Honestedat absoluta davant d'NLnet:** En `/page/fediversity` mai no s'ha de declarar com a «Acabat» l'`inbox` d'escriptura amb signatura HTTP ni la rotació criptogràfica si encara són estàtics; cal descriure exactament què és operatiu en viu i com l'avaluador ho pot comprovar amb un clic o un `curl`.
- **Integritat del Layout i Pedra Seca:** Els nous botons d'Open Data i d'identificador federat a `/pobles/<slug>` han d'usar exclusivament àtoms i tokens de Pedra Seca (`Boto`, ` CapcaleraSeccio`, `--sdp-*`), amb 0 píxels de desbordament a `375px` i `1440px`.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida i Rebut Canònic:** Genereu el vostre document d'informe o auditoria exclusivament a                                 seguint la taxonomia                                     mitjançant el circuit formal (                                    +                                          +          +        ), declarant al Registre el vostre            exacte en ús (prohibit deixar placeholders o models històrics obsolets).
2. **Context Compartit i Llibre Mestre:** Qualsevol altre document present a                  és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe. És obligatori consultar i mantindre actualitzat el Llibre Mestre Permanent (                                                   ) anotant-hi qualsevol idea emergent, troballa o deute tècnic per a no perdre'n el rastre.
3. **Consens Tècnic, Diàleg Creuat i Asincronia (2 o 3 Bandes):** Totes les IAs locals convocades opereu en estricta igualtat de condicions d'accés natiu a disc. El flux és autònom i no bloquejant: cap IA s'ha d'aturar a esperar les altres; cadascuna avança en el seu rol i carril exclusiu d'escriptura i diposita els seus informes a l'Escriptori. A mesura que les companyes publiquen informes, és obligatori llegir-los per auditar les seues conclusions i enriquir el consens tècnic. L'orquestradora (MarIA) actua com a Directora Tècnica canalitzant el diàleg creuat, arbitrant discrepàncies i coordinant la decisió final amb el Mestre.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 edf7daf4d81ab3640d195369807d5ab047bbc60027abd2663f86de3b076d992a. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
