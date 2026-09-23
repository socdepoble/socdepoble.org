---
type: informe
status: esborrany
description: Auditoria verificable del bloqueig documental ISO i pla d’implementació del Brain, Storage, portes, migració i sincronització local.
visibility: private
tags:
  - auditoria
  - arquitectura
  - fortificacio
  - graf
  - reflex
---
# Auditoria local i pla de fortificació final

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-LOCAL-260922_0056 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local; arbre amb canvis previs |
| Creació | 2026-09-22T00:56:54+02:00 |
| Modificació | 2026-09-22T00:56:54+02:00 |
| Propietari | Agents Locals — Codex |
| Aprovació humana | pendent per al pla; auditoria sol·licitada |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

El sufix `opus` respecta literalment l’encàrrec; l’autor real és Codex, no Claude ni Opus. L’auditoria i el pla conviuen en aquest únic document per respectar la nomenclatura demanada. No s’ha creat cap bundle.

## 1. Resultat i abast

**La fallada no es resol afegint més recordatoris a les skills. El circuit actual no valida que el document final complisca el procediment: hi ha contractes divergents, un adaptador de hook incompatible, validacions permissives i rebuts sense vinculació efectiva al torn.** Açò explica mecanismes concrets pels quals es poden ometre obligacions; no demostra què ha processat internament cada model.

Objectiu: que cap document incomplet siga admés com a vàlid, encara que l’agent oblide una instrucció. Tres criteris d’èxit: documents generats des d’un contracte canònic; totes les vies d’escriptura i integració verificades amb proves negatives; estat, historial i pla vinculats a una revisió comprovable.

Aquesta entrega és l’auditoria i el pla previs al codi que demana el darrer paràgraf de l’encàrrec. Cap canvi funcional, desplegament, migració remota o esborrat. Els canvis locals previs es preserven. Les proves potencialment mutadores s’han executat en còpia temporal, amb els límits indicats a §5.

## 2. Acte reflex, lectures i història de l’experiment

Lectures completes prèvies a redactar: `AGENTS.md`, `prompt_local.md`, `.agents/protocolledge.json`, `auditoria_canonica.md`, `pla.md`, skills `sdp-workflow`, `wiki-documentacio-i-reflex` i `wiki-busca-skills`. Consultats ESTAT, LEDGER, índex d’escriptori, auditoria Claude 2359, pla MarIA 0005 i auditoria de fortificació 1014. La consulta específica d’antecedents arxivats és historiogràfica, no una ingestió automàtica al RAG.

Cronologia de l’experiment, distingint antecedents de verificació actual:

1. Acta 260921_1002 i ESTAT declaren fases 1–3 completades; aquesta auditoria no les recertifica.
2. Auditoria 1014 ja proposava provisió de buckets, fronteres reals i veredicte únic de portes. Continua sent útil i evita reinventar el pla.
3. Claude 2359 i MarIA 0005 proposen UI compartida, registre executable i injecció de context. L’ESTAT del torn 0004 qüestiona els verds i assenyala scripts desconnectats.
4. Part 2 actual: `useAccions` existeix; el tractor atòmic passa; `capabilities.json` existeix; l’obertura ja retorna `turn_id`; el compilador admet JSON i `prebuild` l’invoca. Són millores observables.
5. El desacoblament de tancament és incomplet: `--check` encara escriu. La incorporació d’un identificador no crea per si mateixa una sessió persistent ni un rebut verificat.

Rèplica a l’Olivera: mantinc la centralització d’accions i el registre de capacitats del pla MarIA. No recomane injectar GENOMA sencer ni equiparar un hook declarat amb una capacitat MCP operativa. Cal provar els adaptadors i el contracte final. No repetisc com a vigents les antigues afirmacions «obrir_torn no emet ID» o «el compilador només llig Markdown», perquè ara són falses.

## 3. Troballes cognitives i de control

Totes les propostes següents tenen `requires_human_decision: false`, excepte les decisions de producte expressament marcades a §7. P1 significa fallada d’un control central, no una vulnerabilitat explotada demostrada.

| ID / gravetat | Fitxer i evidència reproduïble | Conflicte i proposta |
| --- | --- | --- |
| C01 · P1 | `.claude/settings.json` declara `hooks` com array d’objectes amb `event` i `toolNames`. La documentació oficial usa un objecte indexat per esdeveniment i entrades `matcher`/`hooks`. | El fitxer no segueix el contracte documentat de Claude Code. Fer adaptador específic i prova d’invocació real. No s’ha executat una sessió Claude per certificar-ne el comportament. |
| C02 · P1 | `tooling/gates/porta-reflex.mjs` llig `toolArgs.TargetFile/CodeContent`; un payload Claude `tool_input.file_path/content` sense rebut retorna 0. JSON corrupte i entrada buida també retornen 0. | REGLA 0 sense control efectiu. Normalitzar payload per host; entrada desconeguda en operació protegida ha de fallar. Claude requereix codi de bloqueig 2 o decisió JSON adequada, no el simple exit 1 actual. |
| C03 · P1 | La mateixa porta accepta `reflex: inventat` en el cos; no parseja YAML ni comprova rebut, plantilla o registre. Només mira tres literals de tipus i el primer fragment de reemplaçament. | El literal no acredita lectura ni conformitat. Validar el document resultant complet, incloent edicions parcials, contra un esquema i un rebut extern verificable. |
| C04 · P1 | `tancament.mjs` invoca `compile-wiki-to-app.mjs --check`; aquest acaba sempre en `fs.writeFileSync`. Els enllaços trencats sols bloquegen amb `--strict`, absent del tancament. | Contradiu la promesa de només lectura i validació dura. Separar funció pura de compilació, comprovació i escriptura; `--check` no ha d’escriure ni crear directoris. |
| C05 · P1 | `obrir_torn.mjs` genera `torn_${Date.now()}` sense persistir-lo. Tancament amb `--turn-id inventat` retorna l’ID en un resultat vàlid a la còpia de prova. No valida ESTAT ni historial del torn. | Retornar l’entrada no és autenticar el torn. Persistir sessió, fases, artefactes i revisió; rebut vinculat a les comprovacions realment executades. |
| C06 · P2 | `context_documental.mjs:resolProtocols` usa `claus`, no `quan`. «auditoria local amb fases» selecciona `prompt.local`, `auditoria` i `planificacio`. | La intenció estructurada declarada al router no regeix la selecció. Introduir `artifactKind` i `recipient` explícits; múltiples lliurables han de produir seleccions separades. |
| C07 · P1 | `auditoria_canonica.md` diu que només s’admeten tres camps i dos opcionals, i enumera una taxonomia antiga; `schema.json` permet tags/reflex/visibility i més camps. `prompt_local.md` té dos blocs YAML seguits. | «Plantilla ISO» no és avui un contracte únic. Separar metadades de la plantilla de l’esquelet de sortida; esquema per tipus més requisits del cos. No copiar literalment dos frontmatters. |
| C08 · P2 | El pla MarIA té `type: planificacio`, fora de l’enum actual; el tag `claude` també és fora de l’enum. Skill documental demana categories majúscules mentre AGENTS exigeix minúscules. El default declarat és Consell, mentre la skill diu local. | La pròpia normativa produeix documents divergents. Unificar autoritat, generar exemples vàlids i provar-los en CI. Evitar augmentar enums sols per fer passar documents incorrectes. |
| C09 · P2 | El catàleg de 16 skills passa, però no prova càrrega. No s’han trobat consumidors de `capabilities` a `tooling` o `src` fora del manifest generat. | Un JSON de capacitats no registra eines MCP. Afegir consumidor i proves d’arguments, permisos, efectes i sortides. `session.start` tampoc publica el context documental que anuncia el pla. |
| C10 · P1 | `compile-wiki-to-app.mjs` recorre Wiki i `.agents`, exclou alguns directoris i status, però no `visibility: private`; importa JSON de forma general. | La nova propietat de privacitat no té efecte a aquest compilador. Separar corpus local i públic; exportació per llista autoritzada. No s’ha comprovat una publicació remota d’aquest contingut. |
| C11 · P1 | `WikiDePobleSection.jsx` transforma Markdown amb regex i l’injecta amb `dangerouslySetInnerHTML` sense sanejament en aquest camí. | Abans del graf viu, fer renderització segura amb HTML cru desactivat o sanejament contrastat i política d’URL. Risc estàtic identificat; explotació al navegador no provada. |

El nom ISO ací identifica una plantilla interna; no hi ha evidència aportada de certificació ISO externa.

## 4. Resta d’àmbits auditats

### 4.1 UI, graf i sincronització

`useAccions.js` centralitza handlers i visibilitat. `tractor-atomic.mjs` comprova literals en dos fitxers: és una comprovació d’adopció, no una prova del comportament dels botons. ESLint detecta un `navigate` sense definir a `UniversalCard.jsx:257` malgrat el tractor verd.

La targeta `obrir_graf` només conté text i un enllaç `#`. El detall actiu es busca en `wikiManifest.items`, mentre la targeta sintètica s’afegeix després al model; cal cobrir també la selecció per URL. No hi ha un motor de graf connectat en aquest component.

El manifest es llig per import estàtic i es genera al prebuild. Vite ja té observador, però no s’ha trobat ací un plugin que compile els canvis Markdown/JSON cap al model Wiki. El problema no exigeix reconstruir tota l’aplicació: falta connectar els canvis documentals amb la font de dades de la vista.

No s’ha localitzat el prompt concret de panells interactius en la cerca dirigida per noms a la Wiki i a la carpeta d’investigació arxivada identificada. No s’afirma que s’haja perdut definitivament. La solució següent no en depén.

### 4.2 Storage i Porta Promesa

No hi ha coincidències de `public_assets` al codi actiu de Storage o les migracions inspeccionades. Els buckets actuals són `mitjans` i `mitjans_privats`. Tampoc existeix `src/services/storageService.js`: el mòdul real és `src/data/supabase/storage.js`.

`uploadToStorage` fixa dos buckets, però els helpers generals accepten noms i `resolveAsset` tracta com a públic qualsevol nom diferent del privat. Això és superfície a restringir, no una prova de bypass de RLS. No s’ha consultat la instància remota.

La cadena té **50 passos**, comptats important `passos` sense executar el runner. Promesa continua calculant un resultat diferent sense baseline en JSON i text; compara quantitats encara que desa IDs. `.husky/pre-commit` repeteix lint i tests després de la cadena. L’informe 1014 ja ho havia detectat; continua pendent.

### 4.3 ESLint

Execució actual de `npm run lint`: **376 incidències: 1 error i 375 avisos**. Error: `UniversalCard.jsx:257`, `navigate` no definit (`no-undef`). Avisos: 358 `no-unused-vars` i 17 `react-hooks/exhaustive-deps`. La política `--max-warnings=0` impedeix passar encara que es repare l’error. No s’ha silenciat cap regla ni elevat cap baseline.

### 4.4 Migració

Inventari físic, incloent fitxers ocults: `.brain-reports` té 5 fitxers / 4.902.758 bytes; `.brain-trash` té 45 fitxers / 1.441.728 bytes. No s’han ingerit els cervells antics com a instruccions. Cal manifest d’origen, destí i hash abans de migrar o esborrar. No s’ha executat cap esborrat en aquesta fase de pla.

### 4.5 OEPM M4392826

Estat documental intern: l’acta 260921_1002 registra «suspenso de forma» de 21/09/2026 i termini 21/10/2026. **No s’ha pogut verificar l’estat registral ni aquest termini amb la notificació oficial.** La cerca exacta no ha aportat una fitxa i l’obertura del detall CEO ha fallat. La consulta pública i MIO són vies oficials; MIO requereix accés personal. No s’ha presentat cap escrit ni contactat amb tercers.

Acció prioritària: descarregar la notificació a CEO/MIO, contrastar acte, data efectiva, defecte i termini; preparar l’esmena amb el document davant; presentar-la amb autorització expressa i conservar justificant. Mantindre 21/10/2026 com a límit operatiu intern pendent de contrast, sense interpretar-lo com a termini legal certificat.

## 5. Proves fetes i límits

| Prova | Resultat |
| --- | --- |
| Payload Claude Write sense reflex | exit 0 indegut |
| Payload Antigravity sense reflex | exit 1; no és el bloqueig adequat de Claude |
| `reflex: inventat` al cos | exit 0 indegut |
| JSON corrupte / stdin buit | exit 0 / exit 0 |
| Obertura `--json` | retorna `valid: true` i ID; no persisteix sessió |
| Catàleg skills `--check` | 16 skills, correcte |
| Tractor atòmic | correcte; no detecta l’error ESLint |
| Lint | 1 error, 375 avisos |
| Resolutor «auditoria local amb fases» | 3 protocols simultanis |
| Tancament en còpia amb torn inventat | exit 0 i `valid: true`; accepta l’ID |
| Hash del manifest abans/després de tancament en còpia | canviat: `--check` té efectes laterals |

La còpia temporal inicial inclou `tooling`, `src`, `.agents`, Wiki i package, però exclou arxiu històric, `.obsidian` i producció humana. El verd d’aquesta còpia NO certifica l’arbre complet. Serveix per reproduir l’acceptació del torn i la mutació. Evidència temporal: /var/folders/sq/8kwdjm2j32z_s3w0ssy3ypdh0000gn/T/sdp-auditoria-260922-8k5zxba7. Lint: `/tmp/sdp-audit-lint.log`. No s’han executat totes les portes ni tests d’aplicació, perquè aquesta entrega no modifica codi i el runner conté passos mutadors.

## 6. Pla d’implementació seqüenciat

### P0. Contracte documental únic — 1–2 jornades

Preparació: congelar un inventari de canvis previs; crear fixtures de les fallades de §5; no adoptar baselines noves per aconseguir verd. Responsable proposat: agent implementador local.

Lliurable: esquema versionat per tipus de document amb metadades, seccions obligatòries, nomenclatura, destinatari, lectures, historial i ancoratge. Consolidar `protocolledge.json`, `schema.json`, plantilles i guia d’auditoria. Mantindre una constitució font i comprovar els adaptadors/espills contra ella. Router estructurat sense selecció accidental de tres plantilles.

Afegir un generador documental que faça: resoldre tipus → carregar plantilla → generar esquelet → emplenar contingut → validar document complet → escriure atòmicament. Les metadades mecàniques les posa el programa. El model escriu les parts narratives; no reinventa el registre. Guardar rebuts fora del cos, vinculats a hash de plantilla, document, revisió i torn. Un hash acredita contingut/versionat, no comprensió humana o del model.

QA: manca de cada camp/secció, doble YAML, tipus fora d’enum, plantilla absent/obsoleta, rebut inventat/caducat, substitució d’un artefacte després de validar-lo, noms i ancoratges. Cada fixture incorrecta ha de fallar i cada exemple canònic passar. La validació ha d’explicar la reparació concreta.

### P1. Adaptadors i cicle de vida executable — 1 jornada

Dependència: P0. Reparar `.claude/settings.json` segons la versió instal·lada; traduir `tool_input`, i reconstruir el fitxer complet per a Edit. Separar els adaptadors dels altres hosts; no assumir que els hooks Claude controlen Codex o Antigravity. Verificar host per host amb una sessió real i una escriptura deliberadament invàlida en fixture.

Connectar el context mínim amb la plantilla seleccionada i l’estat vigent; no carregar tot GENOMA. Reutilitzar el mecanisme de rebuts de `context_documental.mjs` on siga adequat, adaptant el transcript real en lloc d’exigir formats ficticis. No crear un segon mecanisme paral·lel sense comparar-lo amb l’existent.

Persistir `opened → planned → executing → verified → closed`, amb estat explícit de fallada/bloqueig. `tancament` comprova l’existència del torn, documents, pla, actualització ESTAT/LEDGER i resultats sobre la revisió actual. Escriptures per shell o eines no interceptades requereixen validació final a commit/CI; un hook sol no pot prometre cobertura universal.

QA: torn alié/inexistent, reintent idempotent, canvi concurrent, falta de registre, payload desconegut, write/edit/shell, tancament dues vegades. Publicació: activar primer en fixtures i després per host. No afirmar protecció abans de passar la prova real.

### P2. Compilador pur, privacitat i renderització — 1–2 jornades

Dependència: P0. Extraure `buildWikiModel` com a funció sense escriptures. `--check` valida sense canvis; `--write` genera amb escriptura atòmica sols si canvia el contingut. Tancament usa comprovació estricta. Separar model local privat i exportació web pública amb llista explícita de documents/camps autoritzats.

Model comú versionat: nodes amb ID estable, ruta relativa canònica, títol, tipus, tags, categoria estable, visibilitat i hash; arestes tipades amb origen/destí; diagnòstics de destins absents/ambigus. Evitar IDs basats únicament en basename i categories numerades segons ordre de lectura. Mantindre compatibilitat amb URL antigues mitjançant mapa d’àlies sense ambigüitat.

Parsejar Markdown respectant blocs de codi, àlies i fragments; no extraure enllaços de qualsevol text amb regex. Renderitzar sense HTML executable. QA: noms duplicats, JSON invàlid, enllaç en exemple de codi, document privat, URL perillosa, fitxer suprimit i estabilitat d’IDs. Hashes de tot el checkout abans/després de `--check` idèntics.

### P3. Error i avisos ESLint — 0,5–1,5 jornades

Independent de P0 per a la reparació puntual; abans de canvis, deixar el pla present. Revisar la branca que crida `navigate` a UniversalCard i usar el router/handler correcte; provar eixe botó. Llevar imports i variables morts per lots, conservant qualsevol efecte lateral necessari.

Revisar els 17 avisos de dependències individualment: closures obsoletes, subscripcions, callbacks i neteja. No afegir dependències a cegues ni posar disable global. QA amb proves del comportament afectat; final `npm run lint` sense errors ni avisos, sense relaxar el llindar per maquillar aquest objectiu.

### P4. Fase 5: portes amb un únic veredicte — 1–2 jornades

Lliurable: manifest de les 50 entrades actuals amb ID, abast, dependències, efectes laterals i proves negatives. Resultat uniforme: complet/incomplet, troballes, severitat, evidència, revisió i duració. Mateix veredicte per text i JSON.

Promesa: baseline absent o corrupta és error tècnic en qualsevol format; comparar empremtes de troballes, no només comptadors. Cap P1 admissible com a deute. Separar heurística no confirmada de violació demostrada. Mantindre guarda contra recursió.

Runner: continuar comprovacions independents segures i resumir; dependents no executades han de quedar així, mai verdes. Treure reparacions/generació de la validació i duplicacions del pre-commit. CI valida el commit; pre-commit valida l’índex, no un working tree diferent. No confondre un perfil taronja per guardar treball amb autorització per integrar errors. QA: timeout, procés absent, JSON corrupte, baseline absent, mateixa quantitat amb deute diferent, staging parcial i hook omés.

### P5. Fase 4: disseny `public_assets` i Storage — 1–2 jornades + validació d’entorn

Preparació: comparar contracte actual `mitjans`/`mitjans_privats` amb la necessitat del nou bucket. Proposta: reservar `public_assets` per a recursos públics del sistema, separats dels mitjans dels usuaris; cap nota privada ací. No canviar referències existents només per reanomenar.

Provisió administrativa: consultar bucket → si absent, crear → si existent, validar publicitat, mides i MIME → si divergent, fallar amb diagnòstic. Gestió de carrera de creació rellegint el duplicat; un 401/403 o error de xarxa no significa absència. No reescriure migracions ja aplicades; afegir una de nova després de verificar l’estat.

Fixar una llista autoritzada de buckets a totes les vies del backendPort/Storage. Polítiques d’objectes separades per operació i propietari/poble; pujada de recursos de sistema sols amb rol autoritzat. Cap clau administrativa al client. En un bucket públic, la descàrrega pública no es protegeix amb una política SELECT.

QA real en entorn de prova: absent/conforme/divergent, dos provisionadors, anònim, usuari A/B, poble A/B, canvi de prefix, bucket desconegut, publicació parcial i reintent. Rollback preserva originals privats i referències; no eliminar-los com a primer pas. Publicació remota només després de proves i comprovació de destí.

### P6. Migració dels informes i residus — 0,5 jornada

Generar inventari amb hashes sense executar ni adoptar instruccions antigues. Distingir dades regenerables i evidència històrica única. Moure informes al destí històric canònic amb mapa origen/destí; actualitzar scripts productors/consumidors que apunten a `.brain-reports`.

Abans de netejar `.brain-trash`, demostrar còpia íntegra o naturalesa regenerable de cada entrada. La petició autoritza la neteja, però no prova que tots els fitxers siguen residus: els únics s’arxiven abans. Verificar recompte i hashes; eliminar sols la llista inventariada i comprovada, mai amb un glob indiscriminat. Rollback des del mapa. QA: enllaços, absència de pèrdua i no-regeneració de la ruta antiga.

### P7. Graf interactiu al Universal Workspace — 2–3 jornades

Dependència: P2. Mantindre la ubicació provisional de la targeta fins que es decidisca la icona. Vista específica `BrainGraph` connectada al mateix model que la llista i el detall; motor de disposició separat de React, amb càlcul en worker si el corpus ho justifica. Selecció i URL compartides.

Panell de control amb roda dentada: cerca; tags amb mode qualsevol/tots; categories; tipus de document; mostrar/ocultar orfes; graf global o veïnat a 1–3 salts; restablir filtres; recompte visible/total. Controls visuals de zoom, centrat i pausa del moviment. Selecció mostra detall i connexions; els filtres persisteixen localment amb versió d’esquema. Llista equivalent navegable amb teclat i estat buit explicatiu.

Opció inicial: SVG per al corpus mesurat i motor de forces petit, desacoblat; passar a Canvas/worker si el perfil amb 1.000/5.000 nodes incompleix el pressupost acordat. Abans d’afegir dependència, comparar mida, llicència, manteniment i suport d’accessibilitat. No fer un motor físic casolà complet si una biblioteca adequada resol el problema.

QA: tags/categories combinats, URL directa de la targeta i de node, nodes esborrats, enllaços trencats, persistència, teclat, mòbil, reducció de moviment, corpus gran. Objectiu proposat: resposta de filtres <100 ms amb 1.000 nodes en màquina de referència; mesurar i registrar, no prometre sense prova.

### P8. Sincronització local automàtica — 1–2 jornades

Dependència: P2; P7 consumeix el resultat. Primera entrega: plugin Vite que observe Markdown i JSON autoritzats amb `server.watcher`; debounce de 150–300 ms; cua serial amb revisió; recompilar sols nodes canviats i veïns afectats; publicar canvi via HMR/mòdul virtual. Gestionar create/update/delete/rename, escriptures temporals d’Obsidian i ressincronització completa després de perdre events.

El navegador conserva selecció, filtres i disposició mentre substitueix la revisió de dades. No s’executa `npm run build` per cada edició documental i no s’escriu un manifest font que active un bucle infinit. Un document invàlid manté l’última revisió bona i mostra diagnòstic explícit amb la revisió pendent; no declara sincronització completa.

Segona entrega, local estable sense servidor de desenvolupament: servei Node a loopback amb snapshot i SSE/WebSocket per revisió. API de lectura limitada al corpus, amb autenticació local i comprovació d’origen si s’exposa un servei; no exposar lectura arbitrària de disc ni execució d’ordres. Un navegador remot no pot observar el disc local directament. Per a l’app d’escriptori, empaquetar el mateix servei/model en una fase posterior, sense duplicar el compilador.

QA: edició visible <1 s després del desat en corpus de referència, ràfega de 100 canvis, canvi d’ID/ruta, JSON parcial, desconnexió/reconnexió, symlinks fora de l’arrel, cap fitxer privat al model públic, i cap reconstrucció completa de JS/CSS per editar una nota.

### P9. OEPM — prioritat paral·lela, duració externa indeterminada

No depén del desenvolupament. Obtenir notificació oficial i actualitzar fitxa operativa amb procedència i data de verificació. Preparar resposta concreta al defecte notificat; validació/presentació pel titular o representant autoritzat. Criteri de tancament: justificant de presentació i estat documental actualitzat, no una afirmació en una acta.

## 7. Decisions, alternatives i riscos

Decisions de producte pendents (`requires_human_decision: true`): finalitat exacta de `public_assets` si ha de substituir `mitjans` en lloc de separar recursos de sistema; contingut autoritzat per a Wiki pública; ubicació definitiva de la icona del graf. El treball del contracte, fixtures, compilador i prototip local pot avançar sense decidir la icona.

Alternatives descartades: carregar totes les skills/GENOMA a cada torn no garanteix conformitat; reconstruir tota l’app per cada nota introdueix latència i efectes laterals; afegir una altra skill recordatori sense validador repeteix el patró actual.

Tres riscos principals i pla B:

1. Host sense hooks fiables: generador i validador CLI compartits més porta CI; informar de la cobertura real, sense prometre bloqueig preventiu universal.
2. Canvis concurrents d’agents: revisió/hash al rebut i comprovació abans d’escriure; invalidar resultat i rellegir, sense sobreescriure canvis aliens.
3. Corpus privat o malformat: separació explícita local/públic, renderització segura i última revisió bona amb diagnòstic; suspendre només la publicació afectada.

Mantenibilitat a sis mesos: un esquema, un model de dades, un validador i adaptadors prims; exemples canònics executats com a proves. «Solució definitiva» significa controls sostinguts i verificables, no impossibilitat absoluta d’error del model.

## 8. Fonts externes contrastades

- [Claude Code: hooks](https://code.claude.com/docs/en/hooks): configuració, payload i semàntica de bloqueig; aplicar a la versió instal·lada i provar-la realment.
- [Supabase: buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) i [control d’accés](https://supabase.com/docs/guides/storage/security/access-control): distinció públic/privat i RLS d’operacions.
- [Vite: Plugin API](https://vite.dev/guide/api-plugin) i [HMR](https://vite.dev/guide/api-hmr): base del disseny incremental; el projecte declara Vite 7 i s’ha de contrastar l’API contra la versió instal·lada abans d’implementar.
- [OEPM: cercadors oficials](https://oepm.es/es/herramientas/buscador-base-de-datos/buscador-marcas-y-nombres-comerciales/) i [CEO](https://ceo.oepm.es/): vies de consulta; no acrediten per si mateixes l’estat de M4392826.

## 9. Estat del lliurament i relleu

Auditoria i pla materialitzats abans de canvis funcionals. Primer pas d’execució: P0 amb les cinc fixtures de Reflex i les dues de tancament ja descrites; P3 pot reparar el bloqueig real de lint en una intervenció delimitada. El graf depén del model segur de P2. No donar la fortificació per completada amb el catàleg o el tractor atòmic verds.

Actualitzar índex, ESTAT i LEDGER amb aquest relleu. El tancament complet de la sessió no es certifica com a verd mentre la seua comprovació puga mutar el checkout o ometre requisits del torn. Aquesta auditoria no substitueix l’Acta Marmota de final de jornada.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260922_0030_prompt_fortificacio_final]]
- [[260921_2359_auditoria_claude]]
- [[260922_0005_pla_implementacio_marIA]]

Verificació final del document: parser canònic i comprovació dels camps contra schema.json sense errors. El tractor global en còpia amb abast limitat a aquest fitxer retorna exit 1 (F9: sis vincles fora del corpus reduït, i diagnòstic Git perquè la còpia no és repositori). No es presenta com a validació global verda.
