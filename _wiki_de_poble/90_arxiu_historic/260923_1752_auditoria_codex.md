---
type: informe
status: esborrany
description: Contrast del Brain, proposta modular de validació i mapa de connexió amb Supabase i Sollutia, sense canvis de codi.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_e2ba17cf-1236-4725-9984-c4130d32faff:e558d785-34bd-4ffe-80fa-f24cfc675a10
---
# Auditoria de fortificació i enxufabilitat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e2ba17cf-1236-4725-9984-c4130d32faff:e558d785-34bd-4ffe-80fa-f24cfc675a10 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T15:52:37.291Z |
| Modificació | 2026-09-23T15:52:37.291Z |
| Propietari | Codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 6e8b597112b9b7960b3d5c4750e3fd71716887639bd9fe111ea6b89dfa27c1be. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-23: auditoria documental de fortificació. Mode AFK mantingut. Propostes sense aplicar; cap canvi de dades, JS, esquema, configuració o desplegament.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen i tall d’evidència

La base ja té un port de backend i adaptadors separats: cal fortificar-los, no substituir-los per un CMS ni crear una segona plataforma. El Brain ha de compartir un contracte de validació entre CLI i hooks; la validació documental no ha de dependre del backend de l’aplicació.

Tall inicial: `d2f07d65e3f088363faece4d7b920f74e517efaa`, 23-09-2026 17:51 Europe/Madrid. Arbre inicial amb `.agents/ON_ESTIC.md` modificat per un altre procés. Fonts inspeccionades: Constitució, Bootstrap, Genotip, índex, estat, skills de workflow/documentació, protocol Reflex, plantilla local, protocolledge, plantilla d’auditoria, pla de les 17:35, acta de Claude de les 16:30 i codi citat baix. No s’ha carregat l’arxiu històric com a context.

**Dependència pendent:** al tall de lectura no hi ha auditoria de Claude del cicle de les 17:35 a l’escriptori. El contrast es fa amb `_wiki_de_poble/10_actes/260923_1630_implementacio_claude.md`; no l’equipare a una auditoria nova ni declare consens de les tres IAs.

### Contrast amb Claude i defectes residuals

| ID / prioritat | Evidència actual i conseqüència | Pedaç proposat i acceptació |
| --- | --- | --- |
| B1 · P1 | `tooling/documental/turns.mjs:109` retorna en faltar `reflex`, abans de schema/seccions. Confirmada la manca de diagnòstic complet; **el document ja és rebutjat**, no és un bypass d’acceptació. | Separar diagnòstic editorial de verificació de rebut. Amb ruta explícita, validar contingut amb contracte vigent i marcar-lo provisional; el snapshot del rebut continua sent autoritat quan existix. Sense ruta fiable, informar ruta indeterminada; mai inventar-la. Cas negatiu: sense rebut i bloc mutilat ha de donar els dos errors i continuar invàlid. No basta llevar el `return`: el codi següent usa `m[1]`. |
| B2 · P1 | `prompt_sgq.mjs:67–102` retorna `[]` tant per seccions com per errors; `crear_bundle.mjs:54` encara l’importa. Un consumidor rep falsa conformitat d’un validador desactivat. | Adaptador de compatibilitat cap al contracte documental canònic, o error explícit de funcionalitat retirada. Inventariar consumidors abans de retirar API. Provar seccions absents, bloc alterat i ruta desconeguda. No ressuscitar enums SGQ paral·lels ni generar bundles locals. |
| B3 · P2 | `tooling/wiki/pre-commit.mjs:122` invoca `06_EINES/canonada.mjs`, absent, i anuncia èxit abans dels passos 5–6. Les sondes són consultives. **Però** `git config core.hooksPath` és `.husky`, i `.husky/pre-commit` invoca porta-documents, tancar, gate, lint i test; no este orquestrador. | Primer documentar i provar el camí actiu. En el camí antic, substituir la invocació només quan s’identifique la responsabilitat equivalent, o retirar l’entrada amb prova de consumidors. Èxit només al final. No afirmar que la mina bloqueja hui tots els commits. |
| B4 · P1 de procés | El pla de les 17:35 no té rebut: `document.mjs check` el rebutja. Les caselles marcades del prompt no proven ni rebut ni ancoratge; SCC denuncia els documents nous sense àncora. | MarIA ha de completar el pla pel circuit documental, amb riscos, proves, ordre i estats per agent. Distingir vincular pla de validar-lo: `bindPlan` comprova metadades, no totes les seccions/rebut. Exigir les dues comprovacions abans d’implementar. |
| B5 · P2 | La plantilla **ja** té `Instrucció del torn` i protocolledge també. La proposta 1 de Claude està aplicada. En canvi, plantilla diu v2.3 i la ruta declara 2.2.0. | No repetir el pedaç. Sincronitzar versió i afegir prova de deriva plantilla/ruta. Els hooks locals existixen i les proves passen; no descriure la seua creació com a pendent. |
| B6 · P1 de verificació | Nou execució: nou proves fallen en construir fixtures per `triggers_on invàlid` a `core-automillora/SKILL.md`. | Corregir el contracte de la skill en un torn autoritzat i tornar a executar. No usar estos errors com a evidència de nou defectes de backend. |

### Dades i validació: límits d’enxufabilitat

**E1 · P2 — El nucli del port és massa ampli per a un connector mínim.** `src/data/contracte.js` obliga 32 mètodes, inclosos xat i organitzacions. `backendPort.js:17–49` valida funcions i capacitats completes, no les dades retornades. És una bona frontera existent; no implica que qualsevol implementació siga semànticament compatible. Propose conservar el contracte v1 complet i extraure validadors purs per domini (identitat, notes, contingut, xat). Una futura v2 podria fer opcionals dominis, però només amb consumidors comprovant capacitats i adaptador de compatibilitat; canviar ara el nucli trencaria integracions.

**E2 · P2 — La traducció de contingut està mesclada amb transport i contingut inicial.** `src/data/supabase/runtime.js:103–116` transforma files, filtra IDs i injecta APP_SEED, inclosa l’assignació de notes a `f-mur`. A més assumix arrays en valors remots. Proposta: mantindre transport HTTP a l’adaptador, extraure mapatge pur i política explícita de contingut inicial; validar forma abans de fer `filter/map`. Fixtures han de demostrar la mateixa eixida actual, incloses carpetes i notes, abans de moure res. No eliminar contingut inicial ni reinterpretar IDs en una neteja. Fallada de xarxa no ha d’activar persistència local silenciosa.

**E3 · P1 d’integració — La Frontissa citada no està materialitzada.** L’ADR `ADR-2026-09-SOLLUTIA-MODEL-B.md` prescriu Supabase SdP autoritatiu i GET cap a Sollutia, però `src/data/adaptadors/sollutia/client.js` i `tooling/gates/tractor-frontissa.mjs` no existixen al tall. Només hi ha `recursos.js`. L’afirmació de l’ADR que run-portes crida eixa porta tampoc apareix en la cerca actual: cal actualitzar evidència, no donar la connexió per feta. El document té estat esborrany i firma pendent tot i afirmar acceptació; mantinc Model B com a disseny conservador, sense declarar-lo llest per a producció.

**E4 · P2 — Traductor de perfil permissiu.** `recursos.js:10` copia tot `payload` i posa `_sollutia: true` abans del spread: una entrada pot sobrescriure el marcador i afegir camps inesperats. Açò no demostra una escalada de permisos, però sí una frontera de dades no controlada. Proposta: projecció explícita dels camps acordats amb fixtures reals, validar strings no buides i posar metadades internes fora dels camps externs. Revisar consumidors abans d’eliminar camps; no inventar l’esquema de Sollutia.

### Mapa tècnic proposat per al backend

| Tram | Peça actual / peça proposada | Contracte i límit |
| --- | --- | --- |
| Host Sollutia → component | `host.js`, `PedraSecaEmbed.jsx` | Configuració abans de segellar, CSS/recursos aïllats, cicle de muntatge/desmuntatge. La possibilitat tècnica d’injectar backend no autoritza el Model A. |
| Sessió externa → sessió SdP | `identitat.js`, `sessionService.js` | Validació de sessió segons política; identitat i tenant han de quedar confirmats pel servidor. Cap clau privilegiada al navegador. |
| UI → dades SdP | `backendPort.js` + contracte v1 | Signatures i capacitats existents; futurs validadors purs compartits per adaptadors. Errors identificables sense filtrar respostes internes. |
| Dades → Supabase | `src/data/supabase/*` | Transport, renovació de sessió, timeout, cancel·lació i errors dins de l’adaptador. RLS continua sent autoritat, no el validador client. |
| Lectura de recurs Sollutia | Frontissa **pendent**, `recursos.js` existent | GET, origen acordat, credencials segons ADR, captura real + traductor + fixture obligatoris. No hi ha escriptures creuades aprovades. |
| Brain → portes | `tooling/documental/core.mjs` i `turns.mjs` | Nucli de regles compartit; adaptadors Node per lectura, rebuts, snapshots i Git. Cap dependència de CMS, Supabase o UI per validar documents locals. |

No crear una llibreria genèrica de tot el sistema. Mantindre mòduls per funció amb les dependències de xarxa i disc als límits. Interfícies proposades, no implementades: `validateContent(value) → issues`, `mapContentRows(rows, seedPolicy) → domainData`, `inspectDocument(text, contract) → issues`, `verifyReceipt(receipt, store) → evidence`. L’orquestrador combina resultats sense convertir falta d’evidència en validació positiva.

Per integrar: (1) acordar amb Sollutia orígens, emissor/audiència, tenant i fixtures; (2) completar Frontissa amb proves de contracte locals; (3) executar els mateixos casos contra adaptador fals i Supabase de proves; (4) verificar permisos entre dos tenants al servidor; (5) canari del component al host amb comprovació visual i de desmuntatge. Cap endpoint, taula ni RPC nou es considera pactat en esta auditoria.

### Esmenes concretes per a la pissarra de MarIA

Ordre proposat: **T0** validar pla/rebuts/ancoratges → **T1** corregir diagnòstic B1 i compatibilitat SGQ B2 → **T2** unificar entrada real de portes i skill invàlida → **T3** extraure validadors i mapatge sense canviar v1 → **T4** completar contracte de Frontissa → **T5** canari visual i de permisos. Cada fila del pla ha de portar fitxers, prova negativa, prova de regressió, responsable, reversió i estat de consens. El pla actual de quatre caselles és una agenda, no una especificació executable.

Criteris comuns: cap canvi de pantalla ni estructura persistent; cap import del proveïdor en la UI; dades malformades rebutjades abans del consum; sense doble escriptura; adaptador anterior compatible; cap èxit si falla una porta. Tres riscos a provar: canvis de forma del backend, carrera d’arrencada/sessió i validació amb rebuts absents o caducats.

Alternatives descartades: traslladar Brain a un CMS (acobla governança i disponibilitat externa); reescriure tots els ports amb una arquitectura nova (amplia superfície sense resoldre els errors demostrats). D’ací a sis mesos, cada regla ha de tindre un únic propietari i proves que es puguen executar sense backend real.

`requires_human_decision: false` per a esta entrega d’auditoria. La implementació continua fora d’abast i sense consens acreditat. Passar a Model A/C, escriptures Sollutia o canvis visibles requeriria decisió explícita, no es deduïx de «fortificar».

### Millora de prompt_local.md

Separar `mode: auditoria` i `mode: implementacio` en el text amb superfície autoritzada; no ordenar simultàniament fortificar codi i prohibir tocar-lo. Llistar rutes exactes d’entrada i definir què fer si Claude encara no ha lliurat. Emplenar HEAD/hora i rebut real, mai marcar caselles amb `pendent`. Afegir registre de consens individual sense considerar silenci com a aprovació. Mantindre instrucció editable i blocs fixos ja existents. Distingir proves d’entrega, comprensió i permisos. Revisar la versió 2.3/2.2 i evitar l’afirmació absoluta «portes inviolables», incompatible amb els límits reconeguts del protocol Reflex.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- Lectura i contrast estàtic dels punts citats; comprovació del hook actiu amb Git.
- `node --test tests/backend_consolidacio.test.mjs tests/hooks-local.test.mjs tests/documental.test.mjs tests/fortificacio.test.mjs`: **60 proves, 51 passen, 9 fallen**. Les nou fallen per la skill `core-automillora` en preparar fixtures. El nom backend_consolidacio correspon al cervell/tractors i no prova el backend de dades remot.
- `document.mjs check` del pla vigent: invàlid per falta de rebut persistent.
- `tancament.mjs --check`: roig; plantilles, autoritat i ledger passen; segell, skills, wiki i SCC fallen. Hi ha enllaços trencats i documents previs sense ancoratge. No s’ha resegellat contingut alié.
- No s’han executat peticions externes, migracions, builds ni publicacions. Les proves proposades dels pedaços encara no estan implementades.
- La comprovació documental de la present auditoria s’executa després de completar-la; el seu resultat es comunica al lliurament.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Auditoria focalitzada del Brain i de les fronteres de dades, no certificació completa de seguretat ni de funcionament a Sollutia. No hi ha captures de contracte remot ni prova de navegador d’este torn. L’auditoria nova de Claude i el consens de MarIA continuen pendents. Cap JS ni estructura de dades modificats. L’única entrega nova és esta auditoria, amb àncora i relleu documental d’estat. Acta Marmota global pendent de consolidació de jornada.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1735_pla_implementacio_fortificacio]]
- [[260923_1630_implementacio_claude]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
