---
type: informe
status: esborrany
description: 'Torn QA de Claude Fable: estat de Supabase i UI, diagnosi del tractor cognitiu de prompts i plans, i estudi d auto-replicacio del cervell per a IAs de frontera.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c143d861-11d0-475c-96d8-8f7e2de61005:29b6d21c-75ce-4484-847c-aeef49b05803
---
# Auditoria Claude Fable: QA local, tractor cognitiu i auto-replicacio

Torn de QA i tancament de jornada sobre el treball de Codex (governança, login, organitzacions). Resultat en una frase: el codi de Codex passa les proves que un agent pot executar, el commit el pot fer només el Mestre amb una lease del Reflex, la creació de prompts és traumàtica per quatre causes mecàniques verificades (no per falta de voluntat), i el cervell és clonable com a fitxers però no com a sistema viu. A més, per ordre directa del Mestre a mitja sessió, el menú lateral del Xat calca ara el de WhatsApp per a Mac (T7). Cap troballa d'este informe s'ha acceptat sense passar per dos escèptics independents o per evidència llegida per l'orquestradora; les refutades es diuen.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c143d861-11d0-475c-96d8-8f7e2de61005:29b6d21c-75ce-4484-847c-aeef49b05803 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local · localhost:3340 (Vite del Mestre, PID 1921) · Supabase local declarat arrancat per MarIA, no acreditat des del panell integrat |
| Creació | 2026-09-27 17:59 (15:59Z) |
| Modificació | 2026-09-27 18:32 |
| Propietari | claude-fable |
| Aprovació humana | Via lliure del Mestre al xat (17:47, 17:53 i 18:05); T2 delegada al Mestre (18:05); ordre directa del rail del Xat (18:15) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Tall d'evidència | HEAD 76a36437 més arbre local a les 18:25, amb treball previ de Codex i MarIA sense commit |
| Model IA | Claude Fable 5.1 (claude-fable-5-1) sobre Claude Code 2.1.281; subagents amb el mateix model, refutadors amb esforç mitjà |
| Tokens consumits | Fil principal no mesurat per l'arnés. Workflow T5 (síntesi i refutació): 2.471.144 tokens de subagents, 29 agents, 9 minuts. Workflow de lectors i T6: 43 agents, total no reportat perquè s'ha aturat a mà en acabar la refutació de T6. No s'inventen xifres. |
| requires_human_decision | true (vegeu Troballes: decisions D1 a D5) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. Rebuts del torn de MarIA: context 6da3886d (15:59:07Z) i create 29b6d21c (15:59:28Z). El rebut acredita entrega, no comprensió.

Lectures completes abans d'actuar: AGENTS.md, QUI_SOC.md, el Genotip (01_ser/02_genotip.md), l'índex mestre, la taxonomia documental, la plantilla prompt_local.md (via document.mjs context), el pla i el prompt 1720 amb les notes de MarIA, l'Acta Marmota 260927_1720, el relleu de Codex (auditoria 1657, lectura dirigida i única de 90_arxiu_historic, no RAG), PROTOCOL_PETORRETA.md, i el codi de govern sencer: hooks-local, mutation-policy, command-policy, porta-plantilla-viva, porta-olivera, porta-reflex, executor-mutacio, reflex_petorreta, turns, core, draft-write, document.mjs, tancament, run-portes, git-staged i els hooks de Husky.

Subagents: dos Workflows en text pla, sense schema ni StructuredOutput (lliçó d'or de l'ESTAT 01:51), amb l'ordre explícita d'usar només Read i de no entrar a 90_arxiu_historic ni a 01_produccio. Set lectors independents (circuit, laboratori, doctrina, superfície pública, cervell, llicència, UI), dos síntesis i dos escèptics per troballa amb lents diferents (existència i rellevància). Una troballa només és «confirmada» si els dos la confirmen; les refutades es llisten amb el motiu. Els lectors han informat que Glob i Grep no existien a la seua sessió: han llegit amb Read i han marcat «no verificat» el que no han pogut obrir.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 17:43 Inici. El hook bloqueja la primera ordre composta; passe a lectures literals. Diagnòstic inicial: el commit fallaria per dos blobs de l'índex sense frontmatter (prompt 1720 i prompt Codex 1650).
- 17:47 Relleu de MarIA (via Mestre): «el linter ja no plorarà». Verificat com a fals en eixe moment amb document.mjs check.
- 17:52 MarIA regenera pla i prompt 1720 amb document.mjs create sota torn_c143d861 i neteja l'índex de git.
- 17:56 Òbric torn_acb8d3cc per error de coordinació; el Mestre demana no tocar el circuit. El torn sobrant l'ha retirat MarIA a les 18:20.
- 17:59 Context i create de l'auditoria sota el torn de MarIA. Llance el Workflow de lectors.
- 18:00 Navegador integrat: /registre es pinta; les crides directes a 54321 fallen; el Mestre ordena abandonar el navegador i assumix T2.
- 18:01 Proves: 73/73 documentals i del hook; 11/20 al laboratori de MarIA (8 fallades pel format V2, aparcades per MarIA a les 18:05).
- 18:03 a 18:22 Síntesis i refutacions de T5 i T6. Aturada manual del primer Workflow en acabar T6 per no duplicar T5.
- 18:15 Ordre del Mestre: el rail del Xat ha de calcar el menú de WhatsApp per a Mac. Implementat a les 18:23 amb 72/72 proves del Xat.
- 18:35 Retoc del Mestre: la roda dentada torna a la capçalera «Menú» del rail com a accés a la configuració; la llista de baix no canvia.
- 18:40 Informe tancat. Pendents del Mestre: preparar fitxers, lease del Reflex i commit; Acta Marmota final.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### T1 · Supabase local

- Fitxer o abast: supabase/ i supabase/README.md.
- Evidència: no existix supabase/config.toml (ls 18:02); sí que han aparegut supabase/.branches/_current_branch, supabase/.temp/cli-latest i supabase/.temp/start-secrets a les 18:02, que són les marques que deixa la CLI en arrancar. MarIA declara Docker i Supabase arrancats. Des del panell integrat, fetch a localhost:54321/auth/v1/health torna «Failed to fetch», però el panell restringix orígens (també va negar localhost:3340 fins que preview_start el va obrir), així que no és prova de caiguda.
- Severitat: P3 informativa. Font de veritat: el prompt exigix «Supabase corrent en local».
- Estat: no acreditat per esta auditoria. Les 22 migracions s'han reanomenat al format de la CLI (prefix de deu xifres) i estan preparades a l'índex; supabase/README.md encara cita els noms antics (260908_0000_...).
- Proposta: quan el Mestre acredite l'arrencada, actualitzar supabase/README.md amb els noms nous i documentar el procediment local (config.toml, clau anon local, callback de Google).

### T2 · UI de registre i Nova Org

- Evidència observada abans de l'aturada (18:00): /registre es pinta amb «Benvinguda al Mas Electrònic», el botó «Entrar amb Google» i el formulari de tres passos (nom, correu, contrasenya, confirmació, casella RGPD). Cap error a la consola.
- Mapa del lector d'UI, verificable: el botó de Google crida loginWithGoogle del port (src/data/backendPort.js:85) i obri l'emergent cap a auth/v1/authorize (src/data/oauthRelay.js:201-214); sense credencials diu «L'entrada amb Google necessita connexió amb Supabase» (oauthRelay.js:148-149). «Nova Org» viu a /el-meu-perfil darrere de RequireAuth (src/app/App.jsx:592) i no hi ha cap adaptador seed ni local per a login ni per a createOrganization (src/data/supabase/auth.js:236, organizations.js:4-10): sense GoTrue real no hi ha sessió i el diàleg no es pot exercitar.
- Incoherència documental (P2): src/data/supabase/runtime.js:27 només admet remote, seed i local, mentre .env.example:4 diu auto i supabase/README.md:302 promet auto, supabase, hybrid, seed i local.
- Estat: delegada al Mestre (18:05). No es certifica.

### T3 · Contracte i plantilla

- Evidència: porta-plantilles verda (13 rutes); el contracte v3.1.0 i la plantilla diuen el mateix. Els dos documents de MarIA porten rebut real i node --test tests/plantilla-viva-escriptori.test.mjs diu «2 revisats · 0 fora de plantilla».
- Deute observat a les 17:53 i a les 18:00: document.mjs check fallava als dos amb «Registre: falta Model IA» i «Registre: falta Tokens consumits» perquè draft() escriu el marcador pendent (tooling/wiki/document.mjs:16) i validateRegister el rebutja (tooling/documental/core.mjs:175); mentre durara, document.mjs plan llançaria (command-policy.mjs:103-104). Els escèptics ho qualifiquen de disseny (el flux és context, create, completar, check), no de defecte: per això va ací i no a T5.
- Estat a les 18:28: resolt per MarIA; porta-documents ja no denuncia cap dels dos fitxers. Queda pendent vincular el pla amb document.mjs plan perquè el torn arribe a planned.

### T4 · Commit

- Fet de disseny, documentat a PROTOCOL_PETORRETA P-01, P-03 i P-10: el pre-commit (tooling/gates/git-staged.mjs:24) exigix una lease del Reflex amb operació git-commit abans de res; sense .sdp-reflex/active.json segellada, ix en error. Cap agent davall el hook pot obrir-la (hooks-local.mjs:81 i :90). El post-commit consumix la lease (.husky/post-commit:3).
- Seqüència per al Mestre: preparar fitxers; node tooling/wiki/reflex_petorreta.mjs open --intent=... --risk=high --scope=. --operation=git-commit; petorreta i manifest al bootstrap reservat; seal amb el nonce; git commit; el post-commit fa consume-commit. La cadena materialitza l'arbre preparat i corre portes, lint i tota la bateria Vitest: compta uns quants minuts.
- Fitxers que falten a l'índex per a este torn: .agents/runtime/turns/torn_c143d861-11d0-475c-96d8-8f7e2de61005.json (modificat amb els dos rebuts de l'auditoria), .agents/runtime/contracts/72e8c987b885038af96d81c336b638edd89a19a8ed5a6b9ec3d419e53a0fccbd.json (nou), _wiki_de_poble/04_escriptori/260927_1805_auditoria_claude.md, l'índex de l'Escriptori, i els cinc fitxers del Xat de T7 (ClosCaXat.jsx, XatSection.jsx, XatControlSection.jsx, XatSection.test.jsx, i18n.js).
- Decisió D1 (requires_human_decision): les migracions 2609130500_bucket_mitjans.sql i 2609191650_bucket_mitjans_privats.sql tenen, sense preparar, la línia «alter table storage.objects enable row level security» comentada. MarIA ho ha fet perquè postgres ja no és propietari de storage.objects a les imatges noves i el servidor local rebentava. A Supabase allotjat eixa taula ja té RLS activa, així que la línia és redundant allí; però commitejar-ho canvia la semàntica declarada de la migració i toca seguretat. Cal decidir-ho conscientment, no arrossegar-ho amb git add -A. Alternativa conservadora: mantindre la línia dins d'un bloc do amb excepció capturada i un comentari que explique el cas local.

### T5 · Tractor cognitiu de prompts i plans (confirmades per dos escèptics)

Per què crear un prompt és traumàtic: hi ha dos arnesos i una sola porta, la forma del document viu en tres llocs que no coincidixen, la governança del tancament és circular, i la doctrina del Pla viu només a les Lliçons d'una skill. Detall:

- T5-01 · P0 · tooling/gates/porta-olivera.mjs:109. Cap contingut de prompt satisfà alhora porta-olivera i porta-plantilla-viva davall el hook de Claude: Olivera exigix el literal «## 0. Abans de generar» (:109-111) i plantilla-viva marca fora de plantilla qualsevol secció que no siga del contracte (porta-plantilla-viva.mjs:116), on la v3.1 diu «0. Preflight (Per a l'agent orquestrador)» (protocolledge.json:72). Les dos corren per a cada Write (hooks-local.mjs:102 i :108). Font en conflicte: el contracte. Proposta: que Olivera lligga el títol de la secció 0 del contracte (sectionIds prompt.local.s0) en lloc d'un literal; tooling, executor amb lease.
- T5-04 · P1 · laboratori 260927_1310_reflex_maria/wiki/petorreta.mjs:52. El generador d'una sola ordre busca el mateix literal mort i llança a la línia 243; tooling/wiki/petorreta.mjs no existix; 8 de 20 proves fallen i cap executor les corre (vite.config.js:64 exclou tests/**; package.json:78 i :89 no les inclouen; CI tampoc). MarIA les aparca com a format V2. Proposta: adaptar al títol del contracte, instal·lar via executor i afegir les proves a test:documental.
- T5-05 · P1 · tooling/gates/mutation-policy.mjs:6. Tancar un torn exigix escriure ESTAT i LEDGER (turns.mjs:158-160), que estan a .agents (SECURITY_PATH), que només l'executor pot tocar (hooks-local.mjs:81), i la lease s'obté amb open i seal que el hook també bloqueja (:90); tancament.mjs --check tampoc és lectura reconeguda (mutation-policy.mjs:134-142) encara que el fitxer ho declare (tancament.mjs:3). Proposta: una ordre documental de relleu dins de command-policy, o declarar per escrit a la skill que el relleu i el tancament són del Mestre.
- T5-07 · P1 · tooling/gates/porta-olivera.mjs:97. Qualsevol prompt de hui queda bloquejat si a l'Escriptori hi ha un transitori d'ahir (:40, :68), i l'ordre que la porta recomana, --arxiva, no la reconeix el hook (mutation-policy.mjs:137 només admet --informe), mentre AGENTS.md:56 prohibix buidar l'Escriptori cegament. Decisió D2 (requires_human_decision): una sola política a AGENTS.md sobre l'arxivat de transitoris de dies anteriors.
- T5-08 · P2 · _wiki_de_poble/03_actuar/plantilles/prompt_local.md:37. El Registre té tres comptes: 14 files a la plantilla, 9 al contracte (protocolledge.json:489-499), 10 a draft() (document.mjs:15-16); cap validador coneix Ruta, Rebut, Tall d'evidència ni requires_human_decision, i la fila Rebut és decorativa perquè el rebut viu al frontmatter (turns.mjs:109). Proposta: alinear la taula amb el contracte en una sola edició de Wiki, sabent que canvia templateHash i caduca els rebuts oberts (turns.mjs:121).
- T5-09 · P2 · prompt_local.md:28. El Pla és obligatori a la línia 24 («REBUTJA L'ORDRE») i opcional a la 28 («generat si cal»); la regla del cognom compartit només viu a wiki-documentacio-i-reflex/SKILL.md:81-86; AGENTS.md §6 definix la Petorreta sense Pla; Olivera comprova que hi haja un pla de hui, no el cognom (porta-olivera.mjs:72-73, :100). Proposta: corregir la línia 28 (Wiki) i pujar la regla a AGENTS §6 (lease).
- T5-10 · P2 · .agents/skills/wiki-cicle-de-vida/SKILL.md:16. Les skills descriuen la v2: --output a obrir_torn (rebutjat per command-policy.mjs:71), «Context i Olivera» i «Protocol de l'Olivera» com a blocs fixos (el contracte diu «Context Tècnic i Arquitectònic» i «Protocol d'Interacció i Sortida», protocolledge.json:83-86), i handoff com a pas del circuit (fora del circuit a command-policy.mjs:78-79). Proposta: reescriure els passos 1, 3 i 6 i la Lliçó 260922 a la v3.1 (lease).
- T5-11 · P2 · _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md:26. La plantilla del pla porta «Estat del Pla» fora de tota secció, que draft() copia (document.mjs:26) i ningú valida; duplica el status del frontmatter. Proposta: passar-lo a Historial o al frontmatter (Wiki, sense lease).
- Verificades per un lector i no sotmeses a doble refutació: el catàleg de skills diverge (core-telemetria-huma és al disc i al segell però no al manifest.yaml, a 00_INDEX_SKILLS.md ni a skills_index.json; cataleg_skills.mjs --check eixiria en roig i el router no pot disparar-la mai); el prompt 260927_1445_prompt_codex_reflex.md del laboratori cita documents que no existixen a l'Escriptori i no té frontmatter ni àncora (porta-documents ho denuncia); i sdp-workflow/SKILL.md:21 mana consultar 90_arxiu_historic quan AGENTS.md:30 ho prohibix.
- Refutades (i per què): «tot draft naix invàlid» és disseny del flux completar-abans-de-validar (queda a T3); «MarIA escriu sense hook i només el pre-commit ho caça» és fals perquè la porta té mode --vigila amb launchd (porta-plantilla-viva.mjs:28-34), si està instal·lat; «cada agent obri un torn propi» és el model d'un torn per agent amb ownedPaths (turns.mjs:152-153, :190-198); «els exemples en majúscules» són marcadors, no noms; «el pre-commit valida contra la plantilla del disc» és fals, valida contra el snapshot del rebut (porta-plantilla-viva.mjs:161), correcció que m'aplique a mi mateixa; i «el router no carrega la skill» és disseny declarat («Cap s'ha carregat sola»).
- Camí de correcció, per prioritat: (1) Olivera llig el títol de la secció 0 del contracte; (2) declarar o resoldre la circularitat de la lease i marcar a la skill els passos del Mestre; (3) alinear les skills del circuit amb command-policy real; (4) fixar a AGENTS la política d'arxivat i la del Pla amb cognom; (5) instal·lar el generador d'una sola ordre adaptat a la v3.1 amb les proves en un executor real; (6) higiene de Registre, plantilla del pla i catàleg. L'acte reflex que demana el Mestre és exactament context, create, completar, check; el que falta és que la maquinària no es contradiga i que l'ordre única del laboratori arribe a tooling.

### T6 · Auto-replicació del cervell per a una IA de frontera

Diagnòstic: el cervell és clonable com a fitxers però no com a sistema viu, i des de la web no se'n veu la porta. Confirmades per dos escèptics:

- T6-03 · P1 · .agents/cervell.json:3-11. Quatre llistes d'arrencada que no coincidixen: set entrades a cervell.json, quatre cablejades a tooling/brain/context-local.mjs:9-10 (que no llig cervell.json), una tercera a CLAUDE.md (QUI_SOC, ON_ESTIC, AGENTS i tres skills), i README.md:169 i BOOTSTRAP.md:20-21. cervell.json només el consumix porta-autoritat.mjs:17 per a validar rutes i mapa-consola.mjs:259 per a diagnòstic, mai com a seqüència. Proposta: cervell.json com a font única i que context-local.mjs i CLAUDE.md la deriven.
- T6-04 · P1 · _wiki_de_poble/01_ser/00_bios.md:20. La identitat remet a .agents/skills/identity-iaia-core/SKILL.md, que no existix (la viva és core-identitat), i nomena .agents/AGENTS.md com a BIOS executable quan AGENTS.md §15 el declara mirall generat; el frontmatter del mateix fitxer diu una tercera ruta. Té status arxivat però ordena «llegiu». Proposta: reapuntar a core-identitat i a l'AGENTS.md de l'arrel.
- T6-05 · P2 · package.json:130. El codi és AGPL-3.0 o posterior (LICENSE:5-8) però package.json no declara license, repository ni homepage (només private true); la Wiki i .agents no tenen cap llicència; QUI_SOC.md:15 diu «Creative Commons» sense concretar; la pàgina legal enllaça CC BY-NC-SA sense dir a què s'aplica. Decisió D3 (requires_human_decision): llicència del contingut (Wiki i cervell), que doc_governanca.md:21 reserva a l'humà; després publicar-la a package.json i a la Wiki.
- T6-07 · P1 · tooling/brain/despertar.mjs:203. Cada SessionStart reescriu .agents/ON_ESTIC.md, que és versionat: qualsevol clon queda brut a la primera sessió. Proposta: escriure el punter a .agents/runtime (ignorat) o només a stdout.
- T6-09 · P1 · scripts/immunitari/org.socdepoble.plaquetes.plist:15, :17, :19. Els vigilants depenen de launchd i porten la ruta absoluta de la màquina del Mestre i /usr/local/bin/node cablejats; despertar.mjs:29 resol l'arrel amb path.resolve contra la regla de tooling/lib/arrel.mjs:18. Proposta: generar el plist des de l'arrel detectada i documentar cron o systemd per a Linux.
- T6-10 · P2 · prompt_local.md:70. La plantilla que rep tota IA externa anuncia «Fedivers i App Nadiua (offline-first)» mentre la doctrina vigent diu online-first (ADR-2026-08-ONLINE-FIRST.md:10, :31, :37; BOOTSTRAP.md:14; Genotip:19). Una IA que clone no sap quina doctrina replicar. Proposta: ADR de visió futura o retirar la frase amb wiki-propagar-veritat.
- T6-13 · P2 · public/sitemap.xml:24. El sitemap indexa /registre, que la política declara privada (tooling/wiki/lib/publication-policy.mjs:80-81). L'escèptic d'existència no va trobar el fitxer per falta de ruta; l'orquestradora l'ha llegit i confirma. Proposta: generar el sitemap des de publicSeoRoute.
- Fets de disseny que una IA externa ha de saber (existència confirmada, rellevància refutada com a defecte): un clon net no pot fer cap commit sense reflex init i una lease (git-staged.mjs:24, PROTOCOL P-10 documenta init); el hook apaga totes les eines si falta una de quatre fonts (context-local.mjs:9-21, fail-closed declarat a hooks-local.mjs:76); la frontera de publicació és per directori amb opt-out per metadades: tot el que no és arxivat ni quarantena dins de 01_ser, 02_saber i 03_actuar es publica (publication-policy.mjs:10-20), plantilles i procediments inclosos; el consumidor PHP del manifest SEO no és al repositori i el generador ho contempla com a opcional (build-seo-manifest.mjs:97-102); i mutation-policy.mjs és un motor lligat al projecte per decisió (SECURITY_PATHS, READ_NODE_COMMANDS).
- Què veu hui una IA que aterra a socdepoble.org: un index.html d'SPA amb Open Graph i JSON-LD, robots.txt que permet tot sense dir res als agents, un sitemap de set URL sense la Wiki, rag-index.json (845 KB) i slugIndex.json amb els camins interns de la Wiki, i els bundles JS amb la Wiki pública inlinejada (arquitectura, governança, plantilles, ADR). No veu: cap llms.txt ni punt d'entrada per a agents, cap URL de repositori ni llicència llegible per màquines, cap HTML per ruta, ni .agents, skills, protocolledge, ESTAT o LEDGER (que és exactament el que voldria replicar).
- Decisió D4 (requires_human_decision): publicar o no un llms.txt amb repositori, llicència i rutes; l'escèptic recorda que la política actual amaga expressament skills i ia de la indexació, i que rag-index i slugIndex es tracten com a fuita, no com a porta. Decisió D5: passar la frontera de publicació a opt-in (status canonic o visibility public explícita) o mantindre l'opt-out actual.
- Què faria falta, en ordre, per a un clon viu: (1) un bootstrap.mjs únic que faça diagnòstic d'arrel, reflex init i doctor, verificació del segell contra seal-transactions, regeneració de skills_index.json, els 22 enllaços de .claude/skills (cap script els crea) i el canal fresc sense escriure ON_ESTIC; (2) una sola llista d'arrencada; (3) llicència de contingut decidida i publicada; (4) frontera de publicació decidida i registrada; (5) coherència doctrinal online-first contra Fedivers; (6) vigilants portables.

### T7 · Rail del Xat calcat de WhatsApp per a Mac (ordre del Mestre, 18:15)

- Abans: el rail tenia dos entrades (Converses i una roda dentada com a entrada del Control del xat), i la capçalera del rail («Configuració») repetia la mateixa roda: dos rodes a la vista amb dos significats.
- Ara: sis entrades en l'ordre exacte de WhatsApp per a Mac, amb icones de lucide: Xats (MessageCircle), Novetats (CircleDashed), Comunitats (Users), Telefonades (Phone), Contingut multimèdia (Image) i Destacats (Star). «Xats» porta a les converses; «Novetats» és, de moment, l'entrada del Control del xat i conserva el commutador (aria-pressed); les altres quatre no naveguen: avisen amb un toast «Encara no disponible» (UX-D03) i no fan com si. La capçalera del rail es diu «Menú» i, per ordre del Mestre (18:35), porta la roda dentada com a accés a la configuració general del Xat; la roda ja no és cap entrada de la llista.
- Fitxers: src/sections/xat/components/ClosCaXat.jsx (rail reescrit sobre una taula ENTRADES_RAIL), src/sections/xat/XatSection.jsx:268 i XatControlSection.jsx:58 (etiqueta del botó que obri el rail), src/config/i18n.js (nou claus section.xat.rail.menu, tancaMenu, xats, novetats, comunitats, telefonades, multimedia, destacats i pendent en valencià, castellà, anglés, basc i gallec; les claus antigues es conserven), src/sections/xat/XatSection.test.jsx (noms actualitzats i prova nova de l'ordre exacte i dels avisos).
- Verificació: npx vitest run src/sections/xat, 72 de 72 (dos passades: amb la icona de panell i amb la roda). En viu a localhost:3340/xat: rail plegat amb les sis icones en ordre i rail desplegat amb les etiquetes i la capçalera «Menú». Lint no executat (el hook no el permet a l'agent); el pre-commit el correrà.
- Fora d'abast i pendent del Mestre: on van Comunitats, Telefonades, Contingut multimèdia i Destacats; el bloc «Tú» amb llapis del peu de WhatsApp; el títol «Control del xat» dins de Novetats.

### Retroalimentació de la plantilla prompt_local

- Coherència interna: línia 24 (Pla obligatori) contra línia 28 (Pla «si cal»); H1 diu v3.0 i el Registre 3.1.0.
- Registre: 14 files quan el contracte en valida 9; les cinc de més no les llig cap porta.
- Dates: el text diu «AA-MM-DD» i la taxonomia mana AAAA-MM-DD dins dels documents.
- Caselles del Preflight: MarIA les marca a mà; el generador del laboratori les calcula. Fins que no s'instal·le, una casella marcada no és evidència.
- Ruta de taxonomia_documental.md sense carpeta: viu a 02_saber/protocols_tecnics.
- Espai final a la línia de «Hipermodularitat i Enxufabilitat» dins d'un bloc fix: qualsevol còpia l'ha de reproduir byte a byte.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| node tooling/gates/porta-plantilles.mjs | Verd: 13 rutes, plantilla i contracte coincidixen |
| node tooling/gates/porta-documents.mjs (18:00) | Roig: prompt i pla 1720 amb Model IA i Tokens en pendent; 260927_1445_prompt_codex_reflex.md sense frontmatter ni àncora |
| node tooling/gates/porta-documents.mjs (18:28) | Roig només per 260927_1445_prompt_codex_reflex.md; prompt, pla i auditoria passen |
| document.mjs check (auditoria 1805) | valid: true |
| node --test documental, porta-reflex, hooks-local, plantilla-viva-escriptori, porta-taxonomia | 73 de 73 |
| node --test petorreta-generador, porta-receptor (laboratori) | 11 passen, 8 fallen, 1 omesa; totes les fallades pel literal de la secció 0 |
| npx vitest run src/sections/xat (T7) | 72 de 72 |
| Navegador integrat, /registre (abans de l'aturada) | Pantalla, botó de Google i formulari presents; consola neta; fetch a 54321 «Failed to fetch» (no concloent) |
| Navegador integrat, /xat (T7) | Rail plegat i desplegat conformes a l'ordre |
| Workflow T5 | 14 troballes, 8 confirmades, 6 refutades; 29 agents |
| Workflow T6 | 14 troballes, 7 confirmades (una per l'orquestradora), 7 de disseny o decisió; 28 refutadors |
| Hook bloquejant (comprovat) | git commit, git amb -C, npx supabase, lsof, grep amb --include, rg amb barra vertical, eines de terminal, Monitor, tancament.mjs, reflex open i seal, escriptures a .agents i fora del repositori |

Les proves focalitzades del Xat se solapen amb la bateria global i no se sumen. Cap comprovació ha modificat fitxers fora de T7 i d'este informe.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- No s'ha fet commit, push ni desplegament: el hook ho prohibix a l'agent i el Mestre ha assumit el commit. ESTAT.md i LEDGER.md no s'han pogut actualitzar per la mateixa raó; el bloc de relleu es lliura al xat perquè MarIA l'incorpore. tancament.mjs no s'ha pogut executar.
- T2 no certificada: el Mestre ha ordenat abandonar el navegador integrat i fer la prova manual. El navegador sí que funcionava (captures a T7), però l'ordre és l'ordre.
- Supabase local: no acreditat des d'este arnés. Les modificacions a les migracions són de MarIA (18:05) i queden com a decisió D1.
- 90_arxiu_historic: una sola lectura dirigida (l'auditoria de Codex 1657 com a relleu); cap RAG ni lectura massiva. 01_produccio: no tocat.
- Els subagents no tenien Glob ni Grep; el que no han pogut obrir ho han marcat «no verificat». Les refutacions són a dos veus, no a tres: una troballa amb un sol escèptic en contra s'ha tractat com a no confirmada.
- Memòria persistent de l'agent fora del repositori: bloquejada pel hook; res s'ha desat a la memòria.
- El primer Workflow s'ha aturat a mà després de T6 per no repetir T5; els seus totals de tokens no s'han reportat.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260927_1720_pla_implementacio_claude]]
- [[260927_1720_prompt_claude]]
- [[../10_actes/260927_1720_ACTA_MARMOTA_Govern_i_UI]]
