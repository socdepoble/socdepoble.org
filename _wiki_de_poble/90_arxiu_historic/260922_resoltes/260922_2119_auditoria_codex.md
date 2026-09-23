---
type: informe
status: esborrany
description: Auditoria del frontend, autenticació, persistència, SQL i portes abans de connectar Sollutia.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_30404528-19b7-4c18-a7c2-eac91c74331b:67683e25-3862-410b-8b0d-ad2535a31dc5
---
# Auditoria extrema de preparació per a Sollutia

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_30404528-19b7-4c18-a7c2-eac91c74331b:67683e25-3862-410b-8b0d-ad2535a31dc5 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T19:19:36.060Z |
| Modificació | 2026-09-22T19:19:36.060Z |
| Propietari | codex |
| Aprovació humana | Auditoria i lliurament autoritzats explícitament pel Mestre; no autoritza desplegament |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 6e8b597112b9b7960b3d5c4750e3fd71716887639bd9fe111ea6b89dfa27c1be. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-22T19:19:36.060Z: esborrany creat després de llegir la constitució, el genotip, l’índex i les plantilles.

2026-09-22T19:30:15Z: auditoria completada sobre l’arbre de treball, amb reproduccions aïllades, builds, navegador i consulta del registre npm. Sense modificar codi de producte.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Veredicte: LLUM ROJA per a producció amb dades i autenticació reals

**La plataforma arranca i compila, però encara no està preparada per endollar Sollutia amb confiança.** No he demostrat que tota l’aplicació caiga en connectar-la. He demostrat errors d’integritat de sessió, exposició documental, desajustos amb el SQL i degradacions silencioses que impedeixen donar llum verda. Es pot preparar un canari aïllat amb dades fictícies després de corregir els bloquejos; no s’ha de confondre això amb autoritzar producció.

Sóc de Poble, hereu del Rentonar i de més de trenta anys de defensa del territori a internet, necessita que la privacitat i la continuïtat siguen verificables. Les metàfores de Pedra Seca no substitueixen les proves: un `visibility: private` que arriba al JavaScript públic és una frontera trencada encara que totes les pedres visuals encaixen.

**Recompte honest:** 3 defectes propis de seguretat/integritat confirmats (S1–S3); 3 punts d’HTML sense sanejar, agrupats en S2 perquè no són tres explotacions independents; 7 paquets assenyalats per `npm audit` (2 high, 5 moderate), corresponents a 4 avisos diferents i tots marcats `dev: true` al lockfile. No hi ha cap vulnerabilitat crítica de dependències reportada, però això no certifica absència de vulnerabilitats. No s’ha provat cap compromís remot ni cap evasió de RLS en una base desplegada. La resta són bloquejos funcionals, d’arquitectura o de verificació, detallats separadament.

### S1 · Alta · Documents privats incorporats al producte públic — confirmat

**Fonts:** `tooling/wiki/compile-wiki-to-app.mjs:12,128`, `src/data/wikiManifest.js`, `src/app/App.jsx` (ruta `wikidepoble`), `WikiDePobleSection.jsx:225`.

El compilador recorre `_wiki_de_poble` i `.agents`; exclou arxiu/runtime i estats arxivats, però **no filtra `visibility`**. El manifest actual conté 139 documents, 40 entrades de `.agents` i 3 documents explícitament privats: `260922_0500_informe_idees_noves_skills`, `260922_1830_prompt_carpetes_workspace` i `260922_1846_auditoria_codex`.

**Reproducció:** importar el manifest, filtrar `attributes.visibility === 'private'`, i comprovar que un dels IDs apareix als chunks del build. Resultat positiu. Al navegador, sense sessió, [la ruta del document privat](http://localhost:3340/wikidepoble?item=260922_0500_informe_idees_noves_skills) mostra el document. No s’ha publicat res durant l’auditoria: l’exposició està confirmada al servidor local i als artefactes generats, no al domini de producció.

**Impacte:** una vegada distribuït el bundle, RLS, login i un botó ocult no poden retirar els bytes. La publicació voluntària de regles del projecte no equival a publicar documents classificats com a privats. Aquesta mateixa auditoria, privada, entraria en una futura recompilació si no es corregeix el filtre.

**Correcció conservadora:** manifest públic amb llista d’inclusió explícita, prova que cap document privat hi entra i tractament separat del graf intern. Preservar els documents al disc. `requires_human_decision: false` per respectar la classificació existent; qualsevol reclassificació pública sí requeriria decisió.

### S2 · Alta · El Markdown documental pot executar HTML actiu — confirmat en DOM aïllat

**Fonts:** `src/sections/wiki-de-poble/WikiDePobleSection.jsx:16,101,211`, `src/sections/disseny/DesignSection.jsx:31`, `src/utils/sanitize.js`.

`parseMarkdown()` substitueix text amb expressions regulars i conserva HTML i atributs d’esdeveniment. La prova injecta un marcador innocu `window.auditProof=1` en un `onerror`; després de passar pel parser i inserir-lo en JSDOM, l’esdeveniment executa el marcador. La porta innerHTML confirma tres sinks sense sanejar. Els dos `page.html` provenen actualment de copy local; no els presente com a injeccions remotes ja explotables.

**Precondició real de l’atac documental:** poder introduir contingut en una font compilada o comprometre la cadena de contingut. No he trobat ni afirmat un formulari públic que escriga directament en aquesta Wiki. Una vegada el contingut actiu entra al DOM, pot actuar amb l’origen de l’aplicació; el Shadow DOM no és una frontera de seguretat de JavaScript.

**Correcció:** sanejar les tres entrades amb el punt central i provar HTML brut, URI perilloses i atributs d’esdeveniment. El sanejador actual elimina taules: cal una decisió tècnica explícita sobre les etiquetes segures de taula perquè la correcció no destruïsca la presentació documental. No substituir DOMPurify per un parser artesanal. `requires_human_decision: false`.

### S3 · Alta · Una renovació antiga pot restaurar la identitat anterior — confirmat

**Fonts:** `src/data/supabase/auth.js:9,14,28,32,131,155`; `src/data/oauthRelay.js` i `src/data/identitat.js` també adopten sessions.

La renovació captura `sessioEpoch`, però només el logout l’incrementa. Una adopció o login nou no invalida una renovació pendent. Reproducció amb transport simulat: iniciar refresh de A, completar login de B, resoldre el refresh de A. Resultat: usuari desat després del login **B**; després del refresh **A**.

**Impacte:** es reprén una identitat vàlida però equivocada i les operacions posteriors poden executar-se com A. No és una falsificació criptogràfica ni prova d’accés a comptes arbitraris: requereix les sessions i l’ordre concurrent descrits.

**Correcció:** una generació d’autenticació única per a totes les entrades de sessió, comparació del token de renovació original i invalidació de peticions antigues en login, OAuth i injecció externa. Provar també logout durant descàrrega del cos. `requires_human_decision: false`.

### B1 · Alta · El registre i el trigger SQL discrepen sobre el poble — confirmat per contracte

**Fonts:** `src/sections/onboarding/OnboardingSection.jsx:33`, `src/data/supabase/auth.js:115`, `supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql` (`handle_new_user`).

El formulari envia nom, avatar i consentiment. `registerWithPassword()` copia eixe metadata a `data`, però no incorpora `config.tenantId`. El trigger final exigeix `raw_user_meta_data.tenant_id` i llança `SDP-REG-001` si falta. Per tant, el registre actual no satisfà l’esquema entregat. El flux Google tampoc mostra un mecanisme per assignar eixe metadata abans de crear l’usuari: la primera alta OAuth necessita un assaig específic; no s’ha executat una alta real.

Hi ha un segon desajust: s’espera `result.session` de l’endpoint REST `/signup`. Una resposta amb tokens al nivell superior no es desa. La prova amb resposta plana torna `storedUser: null`. El contracte REST de Supabase distingeix resposta d’usuari i resposta d’autenticació; no és l’embolcall retornat per l’SDK. Font: [OpenAPI oficial de Supabase Auth](https://github.com/supabase/auth/blob/master/openapi.yaml).

**Correcció:** enviar i validar el poble en el camí de contrasenya; definir un camí verificat per a l’alta OAuth; normalitzar respostes REST segons confirmació de correu. No relaxar el trigger per acceptar qualsevol tenant sense pertinença/control. `requires_human_decision: false` per reparar el contracte existent; l’elecció de poble en OAuth s’ha d’acordar amb Sollutia si no ve resolta del host.

### B2 · Alta · El contracte admet un backend que deixa la sessió en espera permanent — confirmat

**Fonts:** `src/data/contracte.js` (`CAPACITATS.sessio`), `src/data/sessionService.js:45`, `src/app/contexts/SessionContext.jsx:36`, `src/sections/notes/NotesDataContext.jsx`.

El nucli és obligatori i la capacitat `sessio` és opcional. Quan apareix un usuari, `sincronitza()` assigna `rol='desconegut'`. Si no hi ha la capacitat opcional, mai resol el rol. `SessionProvider` transforma aquest estat en `comprovant`; Notes espera indefinidament.

La prova aïllada dóna `state: dins`, `role: desconegut`, `effectiveState: comprovant`. **Aquesta és també la causa observable de la fallada d’`App.test.jsx:54`: el mock implementa el nucli sense `sessio`.** No és una fallada de CSS ni es pot descartar només perquè siga antiga.

**Correcció:** resoldre el rol bàsic sense la capacitat opcional, o canviar el contracte perquè siga obligatòria si el producte ho exigeix. Prova de shell per a les dues variants. `requires_human_decision: false` mantenint el contracte opcional existent.

### B3 · Alta · Errors remots disfressats de buit i dependències de dades creuades — confirmat

**Fonts:** `src/data/supabase/content.js:7,15,21,23,76,79`.

`loadMur()` i `loadMultimedia()` invoquen tots dos `loadAppData()`, que llig `app_content`, totes les publicacions i, amb sessió, notes privades. Els errors de les dues últimes consultes es capturen i es transformen en `[]`. Un 503 simulat en publicacions produeix una resposta resolta amb `feedPosts: []`. Això impedeix distingir «no hi ha dades» de «no les hem pogut carregar».

Mur i Multimèdia dupliquen consultes i s’acoblen a recursos que no necessiten. Que els components tinguen carpetes separades no acredita independència de dades.

**Correcció:** càrregues pròpies per domini, errors tipats i estat parcial visible quan siga legítim. Cap operació crítica ha de convertir una resposta de contracte invàlida en èxit. `requires_human_decision: false`.

### B4 · Alta · Publicar una nota no és una transacció — confirmat per seqüència

**Fonts:** `src/sections/notes/NotesContext.jsx:185–246`, `src/data/supabase/content.js` (`appendSectionSubmissionNetworkOnly`).

Primer es promouen adjunts a públic, després s’insereix al Mur, i finalment es marca la nota com publicada amb una altra petició. Si falla l’última actualització, el Mur ja conté la publicació però la UI informa d’error. Un reintent genera un UUID nou perquè no es reutilitza un identificador estable. No es desa `publishedSubmissionId`. El comentari «desat atòmic» no descriu una transacció entre les dues taules.

**Impacte:** duplicats en reintentar, estat de publicació inconsistent i adjunts públics encara que una passa posterior falle. No he fet publicacions reals; el diagnòstic prové de l’ordre executable i dels punts de fallada independents.

**Correcció:** RPC transaccional per a publicació i estat de nota, clau d’idempotència estable i política explícita per a adjunts orfes. Preservar esborranys fins a confirmació del resultat. `requires_human_decision: false` per la consistència; definir amb el mantenidor el cicle de vida dels adjunts.

### B5 · Mitjana · Col·leccions truncades i formats de Notes incompatibles amb el trigger

**Fonts:** `src/data/supabase/content.js:21`, `src/data/supabase/notes.js:83–125`, `src/data/supabase/runtime.js` (`mapContentRowsToData`), `260916_2300_correccions_mur_i_xat.sql:37`.

Les publicacions es limiten a les 50 més recents entre totes les seccions i després es reparteixen. Cinquanta publicacions noves del Mur poden ocultar les de Mercat o Multimèdia encara que existisquen. Notes té resolució per ID i declara `notesComplete: false`, cosa positiva, però no hi ha cursor per enumerar les notes següents en el carregador.

El trigger elimina `payload.id` de les publicacions per prevenir suplantacions. `loadNotes()` encara llig Notes publicades des de `submission.payload` i rebutja aquelles sense `note.id`; el filtre de detall també busca `payload->>id`. Eixe camí és incompatible amb el trigger final. Les notes natives continuen tenint ID i no s’han de confondre amb aquesta branca.

A més, `mapContentRowsToData()` incorpora sempre notes de `APP_SEED`, fins i tot en mode remot. Cal separar exemples editorials de notes persistides i editables.

**Correcció:** paginació per recurs, identitat obtinguda de columnes autoritatives, retirar o migrar la branca de Notes publicades i no presentar seeds com a files remotes. `requires_human_decision: false`.

### B6 · Mitjana · L’edició d’organitzacions ofereix camps que el SQL no admet

**Fonts:** `src/data/supabase/organizations.js:18`, `260908_0000_initial_schema.sql:73,863` i migracions posteriors.

L’adaptador envia `logo_url`, `slug`, `kind` i `parent_organization_id`. No hi ha columna `logo_url` en les migracions entregades d’organitzacions, i el grant d’UPDATE es limita a `name, lema, description, visibility`. Per tant, eixes actualitzacions no estan suportades pel contracte SQL local. No s’ha inspeccionat el catàleg real de Sollutia: una ampliació remota no versionada seria deriva, no evidència que la migració local funciona.

**Correcció:** alinear camps del formulari/adaptador amb l’esquema i permisos previstos; provar propietari i no propietari. `requires_human_decision: false` si es limita als camps vigents; ampliar permisos o reparentar organitzacions necessita disseny explícit.

### Q1 · Alta per al lliurament · La verificació global està roja

- Vitest: **66 passen i 1 falla**, de 67; B2 explica la fallada d’integració.
- `test:node`: **5 passen i 9 fallen**, de 14. Les nou fallen preparant fixtures perquè `reg.default` ja no existeix però encara entra en `path.join()` (`tests/backend_consolidacio.test.mjs:18–22`). No són nou forats de producte.
- Proves documentals/reflex/fortificació: **63/63 passen**.
- Lint: **374 warnings, 0 errors**; amb `--max-warnings=0`, l’eixida és fallida.
- Segell de skills: hash viu diferent del segellat. La cadena normal para en aquest punt, abans d’arribar a les proves de producte.
- Portes d’HTML, rutes internes, crom, cromàtic, tokens, inline styles i design guard fallen. Els resultats detallats són a Verificació.

La porta d’importacions anuncia una importació trencada a `wikiManifest.js:2172`, però és text documental dins d’una cadena, no una importació executable. Els dos builds passen. Cal corregir l’escàner per distingir codi de contingut; no inventar un fitxer per satisfer un fals positiu. Igualment, part dels avisos de tokens provenen del manifest textual.

**Correcció:** arreglar les proves i les causes reals, separar falsos positius, i tornar a executar la cadena. No regenerar baselines o segells per dissimular errors. `requires_human_decision: false` per corregir proves/escàners; un nou segell ha de correspondre a regles revisades.

### Q2 · Mitjana · Enllaços documentals que passen la porta però no resolen en la UI

**Fonts:** `tooling/wiki/compile-wiki-to-app.mjs:159–186`, `WikiDePobleSection.jsx:225–230`.

El validador accepta destins arxivats i comparacions sense caixa. La UI només cerca un ID exacte dins del manifest viu. En el manifest compilat actual hi ha **16 referències amb el paràmetre `item` cap a 8 IDs absents**; per exemple des d’ESTAT cap a `260922_1747_auditoria_claude`. El check del disc passa i reconeix 37 vincles cap a arxiu, però això acredita existència física, no navegabilitat.

**Correcció:** mostrar un estat explícit de document arxivat/no disponible o enllaç adequat, i verificar també el graf que rep el navegador. No tornar a incorporar tot l’arxiu al bundle. El manifest present i la Wiki viva són fotografies diferents; les xifres 16 i 37 no compten el mateix conjunt. `requires_human_decision: false`.

### Q3 · Dependències · Set paquets afectats; quatre avisos diferents

Consulta real del registre oficial npm, 22-09-2026. No s’ha executat `npm audit fix` ni modificat cap dependència.

| Paquet instal·lat al lockfile | Severitat npm | Avís / abast |
| --- | --- | --- |
| `js-yaml 4.3.1` | high | Consum de CPU amb merges; correcció publicada a 4.3.2 |
| `nanoid 3.3.17` | high | Generadors personalitzats amb mida zero |
| `vitest 4.1.10` i `@vitest/mocker 4.1.10` | moderate | Un mateix avís de traversal/lectura de fitxers |
| `decode-uri-component 0.2.2`, `source-map-resolve 0.6.0`, `css 3.0.0` | moderate | Un avís de denegació de servei propagat per dependències |

Tots estan marcats `dev: true`. Això acota l’exposició a tooling/build/tests segons ús; no implica que una visita al frontend puga explotar els set. Tampoc he demostrat que cada camí vulnerable s’execute en el projecte. `js-yaml` s’utilitza en eines documentals; cal revisar l’esquema i límits de cada carregador abans d’atribuir explotabilitat.

Fonts: [avís js-yaml](https://github.com/advisories/GHSA-2883-xcg3-v3hh), [avís nanoid](https://github.com/advisories/GHSA-2v37-7h3g-55p8), [avís Vitest](https://github.com/advisories/GHSA-82fw-gwwq-j7x9), [avís decode-uri-component](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). La proposta automàtica de npm per a `css` és una baixada major: no s’ha d’aplicar a cegues.

**Correcció:** pedaços compatibles, verificació del lockfile, builds i proves; decidir eliminació/substitució de la cadena `css` segons ús. `requires_human_decision: false` per pedaços compatibles dins d’un encàrrec d’implementació; aquesta sessió és una auditoria.

### C1 · Alta per al contracte de lliurament · «Connectar Sollutia» encara té dues definicions

**Fonts:** `AGENTS.md §8`, `_wiki_de_poble/02_saber/architecture/ADR-2026-09-SOLLUTIA-MODEL-B.md`, `src/host.js`, `src/data/adaptadors/sollutia/recursos.js`.

La constitució parla de Sollutia com a proveïdor del backend Supabase. L’ADR Model B diu que Supabase de SdP és autoritatiu i Sollutia allotja/injecta sessió, amb GET per una Frontissa. El port permet injectar una implementació alternativa; l’ADR diu que no s’ha de fer en Model B. La ruta `src/data/adaptadors/sollutia/client.js` citada per l’ADR no existeix: en eixe directori només hi ha `recursos.js`, amb un traductor de perfil. La porta d’adaptadors comprova una fixture, no una API integrada.

**Correcció:** documentar un únic contracte de lliurament: propietari del Supabase, emissor i audiència de JWT, orígens exactes, tenant, callbacks, RPCs/migracions i responsabilitat de renovació. L’audiència externa per defecte és `socdepoble`; no donar per compatible qualsevol token del proveïdor. `requires_human_decision: true` si s’ha de canviar el Model B acceptat. No bloqueja acabar l’auditoria; sí impedeix certificar una integració de significat ambigu.

### Aïllament real dels mòduls

| Àrea | Què està aïllat | Dependència o límit real |
| --- | --- | --- |
| Components visuals i Workspace | Props/models; proves pròpies; Shadow DOM en embed | Tokens/CSS compartits; falta prova completa de múltiples instàncies amb configuracions diferents |
| Core | Carregador i context propis | Combina recursos remots amb pàgines seed; valida poc la forma de dades |
| Mur, Mercat, Multimèdia | Contexts i vistes separats | `loadAppData` compartit, consultes duplicades, top 50 global i errors amagats |
| Notes | Provider amb cancel·lació, generacions, revisió i resolució per ID | Sessió, Mur per publicar, seeds, IndexedDB i Storage; no és independent de dades |
| Xat | RPCs específics i mapping propi | Sessió, singleton de client i configuració prèvia; no s’ha provat Realtime contra el servidor |
| Perfils/organitzacions/admin | Port central i guard d’admin | Contracte SQL desigual; autorització efectiva depèn de RLS/funcions desplegades |
| Wiki/Disseny/text | Poden renderitzar dades compilades sense API | Publicació documental i HTML tenen els problemes S1/S2 |
| Integració host | Configuració abans de segellar, contracte validat, global immutable | Backend, sessió i client són globals al document; no equival a instàncies multibackend independents |

**Conclusió d’aïllament:** hi ha una frontera de transport útil i components reutilitzables, però no hi ha independència completa per domini ni per instància. No cal demolir l’arquitectura: cal acabar la separació i provar contractes de resposta i errors, no només l’existència dels noms de mètode.

IndexedDB conserva esborranys a `SdpNotesQueue`; `logout()` no els elimina. El scope evita barreja ordinària a la UI, però no equival a esborrat de dades del dispositiu ni a xifrat. S’ha de decidir retenció i tractament en equips compartits sense destruir esborranys automàticament. Ho deixe com a risc de privacitat pendent de política, no com una quarta explotació confirmada.

### Reunió a l’Olivera: rèplica als plans i a Claude

He llegit els dos plans 2104 presents a l’escriptori i, per continuïtat explícita, l’auditoria anterior de Claude `260922_2030_auditoria_claude.md`, ara a l’arxiu de la jornada. No s’ha fet una ingestió massiva de l’arxiu.

1. **Ratifique Claude:** DOMPurify és necessari; els tres sinks continuen oberts. He avançat de l’avís estàtic a una reproducció de l’HTML actiu. També ratifique 66/67 proves i que Notes carrega ara al 3340 sense l’error d’importació rància.
2. **Amplie el diagnòstic:** la fallada App no és només «coneguda»; B2 n’identifica la causa funcional, independent de CSS. No convé normalitzar-la com a soroll.
3. **El pla 2104 afirma que s’ha eliminat `aria-current`, però el fitxer encara el té a `AppGridColumn.jsx:88`.** És un fet comprovable, no una discrepància estètica. El pla també afirma «cap risc» i «estan a producció»; no aporta evidència d’un desplegament i aquesta auditoria no el certifica.
4. **Port standalone:** la guarda ja s’ha copiat, però no hi ha `server: {port:3340, strictPort:true}` en aquesta configuració. Impedeix iniciar-se amb el valor per defecte, no configura per si sola el port correcte. El build standalone passa perquè no és mode serve.
5. La reparació de ports/capçaleres no és un pla complet d’integració: falten identitat, contractes de dades, errors i assaig de SQL.

### Condicions concretes per canviar el semàfor

1. Tancar S1–S3 i B1–B4 amb les proves de regressió descrites. Decidir l’abast suportat de B5/B6 abans de presentar eixes funcions com a operatives.
2. Unificar el contracte C1 amb Sollutia sense compartir claus privades; separar configuració pública i secrets.
3. Executar totes les migracions, en ordre controlat, sobre un Supabase de staging buit; comparar el catàleg final amb el desplegat. L’afirmació del README «totes idempotents» és massa àmplia: hi ha `create policy` sense `drop policy`, per exemple a `260915_0000`; cal registrar què s’ha aplicat, no repetir-ho a cegues.
4. Matriu real de permisos amb anon, usuari A, usuari B del mateix poble, usuari C d’un altre poble i superadmin: Notes, adjunts, fils, missatges, organitzacions i RPC admin. Una porta regex de SQL no substitueix executar estes proves.
5. Assaig d’alta/contrasenya/Google/injecció de sessió, caducitat, logout durant refresh, 401/403/409/429/500, timeout, pèrdua de connexió, més de 50 registres, recàrrega i reintent de publicació.
6. Build complet reproduïble i cadena verda amb falsos positius corregits, versió desplegada identificada i possibilitat de tornar enrere. Canari amb dades fictícies abans de dades del poble.

### Millora proposada del prompt local

Substituir «amb absoluta certesa» per «amb evidències reproduïbles i límits explícits». Afegir: commit i arbre de treball, model d’integració, URL/tenant de staging, accions permeses, prohibició o permís de crear usuaris de prova, matriu d’actors, condicions de llum verda, i format de troballa amb font, reproducció, impacte i correcció.

Separar sempre **paquets vulnerables, avisos únics, sinks i fallades explotables**. Incloure una regla que obligue a verificar afirmacions del pla («acabat», «producció», «zero risc»). Exigir una prova de flux complet, no només build. La plantilla encara posa 5173 com a exemple: actualitzar-lo a 3340. Mantindre l’Olivera i un sol editor per fitxer; l’autonomia AFK no ha de significar modificar el producte durant una auditoria de només lectura.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Entorn i abast executat

- Repositori: `socdepoble.org`; HEAD `6423590ed5cdb5408794f88acb157fc6d215c1c0`, amb nombrosos canvis locals previs. Els resultats descriuen **l’arbre de treball**, no un clon del commit.
- Node `v24.13.0`; Vite `7.3.6`. La CI configura Node 20: no s’ha certificat paritat entre versions en aquesta sessió.
- Inventari: 255 fitxers dins de `src`, 23 carpetes de secció, 17 migracions i `seed.sql`; la porta web detecta 45 declaracions Route i 19 seccions de navegació.
- Revisió dirigida de bootstrap/host, contracte/port, sessió/auth, transport, Notes/Mur/Xat/Storage/perfils/organitzacions, compilador Wiki, punts d’HTML, SQL i portes. Inventariar tot l’arbre no equival a llegir cada línia dels 255 fitxers.
- Dos builds a `/tmp`, sense executar `prebuild` ni regenerar el manifest viu. Web: 3,56 s; embed: 4,00 s, IIFE de 3.207,40 kB (998,71 kB gzip). Són builds Vite, **no equivalen al `npm run build` complet**, que també genera tokens/RAG/slugs/SEO.
- Navegador local 3340: `/xat`, `/notes`, `/mur` renderitzen; `/admin` redirigeix al registre sense sessió; el document privat S1 és accessible. Cap alta, missatge, publicació ni canvi de dades real.

| Comprovació | Resultat |
| --- | --- |
| Vite web i standalone | 2/2 builds passen; chunks grans al web |
| Vitest | 66/67; falla App per B2 |
| Node backend_consolidacio | 5/14; 9 fixtures trencades |
| Documental + reflex + fortificació | 63/63 |
| Lint global | Exit 1: 374 warnings, 0 errors |
| Enxufe / frontera / adaptadors / RLS estàtiques | Passen; cap d’aquestes acredita el servidor remot |
| Rutes web | Passa amb 3 avisos sobre registre/nav i àlies |
| Importacions | Exit 1; fals positiu dins del contingut de Wiki |
| Rutes internes | Exit 1; literals de rutes fora de la font comuna |
| InnerHTML | Exit 1; 3 sinks |
| Crom | Exit 1; 3 infraccions de sidebar |
| Cromàtic | Exit 1; comentaris de contrast desfasats |
| Tokens | Exit 1; inclou coincidències dins de text documental |
| Inline styles | Exit 1; 10 infraccions |
| Design guard | Exit 1; 13 infraccions de classes visuals |
| Wiki `--check` | Passa; 37 vincles d’arxiu reconeguts físicament |
| npm audit | Exit 1; 7 paquets / 4 avisos / 0 critical |

`run-portes --diagnostic` només executa les cinc entrades marcades `readOnly`; **no és una auditoria de totes les portes**. La primera execució també detectà les seccions encara pendents d’aquesta auditoria: és un efecte esperable de l’esborrany propi, no deute preexistent. El resultat final documental i de tancament s’indica al final d’aquesta secció.

### Reproduccions aïllades

Transport substituït per dobles, dades fictícies i parser real extret del fitxer. No són proves end-to-end contra Supabase ni contra la CSP de producció. Resultats:

```text
wiki-markdown-event-handler: executed=true
valid-core-without-session-capability: dins / desconegut / efectiu=comprovant
refresh-A-finishes-after-login-B: afterLogin=B, afterRefresh=A
flat-signup-session: storedUser=null
mur-submission-503: returnedSuccess=true, feedPosts=0
```

Per repetir-les, guardar el bloc següent en un fitxer `.mjs` temporal i executar-lo des de l’arrel amb Node i les dependències del projecte. Només escriu el marcador en un DOM de prova i substitueix `fetch` dins del procés temporal.

```javascript
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=process.cwd();
const require=createRequire(path.join(root,'package.json'));
const {JSDOM}=require('jsdom');
let seq=0;
async function isolated(rel,deps){globalThis.__auditDeps=deps; const source=fs.readFileSync(rel,'utf8').replace(/^import .*;\r?\n/gm,'');return import('data:text/javascript;base64,'+Buffer.from(`const {${Object.keys(deps).join(',')}}=globalThis.__auditDeps;\n${source}\n//${seq++}`).toString('base64'));}
const src=fs.readFileSync('src/sections/wiki-de-poble/WikiDePobleSection.jsx','utf8');
const parser=src.slice(src.indexOf('function parseMarkdown('),src.indexOf('\nfunction formatDate('));
const parse=new Function(parser+';return parseMarkdown')();
const dom=new JSDOM('<div id="target"></div>',{runScripts:'dangerously',url:'https://example.invalid'});
dom.window.document.querySelector('#target').innerHTML=parse('<img src="x" onerror="window.auditProof=1">');
dom.window.document.querySelector('img').dispatchEvent(new dom.window.Event('error'));
console.log(JSON.stringify({proof:'wiki-markdown-event-handler',executed:dom.window.auditProof===1}));dom.window.close();
const sess=await isolated('src/data/sessionService.js',{caducitatJwt:()=>null,MARGE_RENOVACIO_MS:60000,getCurrentUser:()=>({id:'test-user'}),teCapacitat:()=>false,refrescaSessio:async()=>true,logout:async()=>{},elMeuRol:async()=> 'usuari'});
sess.sincronitza(); const s=sess.getSessionState();console.log(JSON.stringify({proof:'valid-core-without-session-capability',state:s.estat,role:s.rol,effectiveState:s.estat==='dins'&&s.rol==='desconegut'?'comprovant':s.estat}));
let saved=null,release;
const auth=await isolated('src/data/supabase/auth.js',{getEfimer:()=> 'test-refresh-A',CLAU_REFRESC:'ref',desaSessio:x=>{saved=x.user.id;return true},esborraSessio:()=>{},usuariDeSessio:()=>null,actualitzaUsuariSessio:()=>{},entraAmbGoogle:()=>{},gestionaTornada:()=>{},configuraRefrescSessio:()=>{},getCurrentUser:()=>null,getResolvedConfig:()=>({supabaseUrl:'https://example.invalid',supabaseAnonKey:'sb_publishable_test'}),request:async(p)=>p.includes('signup')?{access_token:'dummy',refresh_token:'dummy',user:{id:'B'}}:{access_token:'dummy',user:{id:'B'}},rpc:()=>{},tancaRealtime:async()=>{},resetClient:()=>{}});
globalThis.fetch=()=>new Promise(resolve=>{release=resolve});
const old=auth.refreshSession();await auth.loginWithPassword('dummy','dummy');const afterLogin=saved;
release({ok:true,json:async()=>({access_token:'dummy',user:{id:'A'}})});await old;
console.log(JSON.stringify({proof:'refresh-A-finishes-after-login-B',afterLogin,afterRefresh:saved}));
saved=null;await auth.registerWithPassword('dummy','dummy');console.log(JSON.stringify({proof:'flat-signup-session',storedUser:saved}));
const calls=[];
const content=await isolated('src/data/supabase/content.js',{getDefaultUserId:()=> 'user',mapSectionSubmissionToItem:x=>x,mergeById:(a,b)=>[...a,...b],APP_SEED_VERSION:1,buildSeedAppData:async()=>({}),generateUUID:()=> 'uuid',getCurrentUser:()=>({id:'user'}),getResolvedConfig:()=>({runtimeDataMode:'remote',hasSupabaseConfig:true,tenantId:'tenant'}),mapContentRowsToData:()=>({feedPosts:[]}),request:async(p)=>{calls.push(p);if(p.includes('section_submissions'))throw new Error('503 synthetic');return p.includes('app_content')?[{key:'towns',payload:[]}]:[];},enviaMissatge:()=>{}});
const mur=await content.loadMur('user');console.log(JSON.stringify({proof:'mur-submission-503',returnedSuccess:true,feedPosts:mur.feedPosts.length,requests:calls.map(p=>p.split('?')[0])}));
```

### Empremtes de les fonts principals

La comparació amb l’inventari inicial del torn confirma zero canvis en codi de producte, SQL, proves, tooling i paquets durant l’auditoria. Han aparegut canvis concurrents en `.claude/settings.local.json` i l’acta 2115; no són meus i no s’han sobreescrit. Les empremtes permeten saber si una correcció posterior ha invalidat aquesta fotografia:

```text
dd4f2eb70781d8eb030d6fc7f127f8be1daf7bb7ad9dfb3a3809054aa045bd26  package.json
4b961f435ab024f2dcefeaeb1ce69a0225090882d90810a031d5a1661905435a  package-lock.json
9273e8134b9276a2dcbb2ab556907ef3b1767a139d4bc1dc7b9b61c0fa7d4fdc  src/data/wikiManifest.js
8a858bb2e08b77a7e77b5852f462812328f6e676d4ebd2a97f89bc1c4e99f58c  src/data/sessionService.js
06c8a066d3b2a1c335fcaa8744f3110e1d4548f1f53e6b788f41881051ce7d4e  src/data/supabase/auth.js
229994b1a492dfd4c8c8801b1612fe82641a8cacb6b5960e020731cfe24be7c5  src/data/supabase/content.js
c52caeb681d18719a7a494f1c4740c3601922e1aa934e0e46e2828f6d98698c8  src/sections/onboarding/OnboardingSection.jsx
ca64ae477101f09df2299acda28a36e247c461c7feb4f2450f6be8ca9ece2dd6  src/sections/notes/NotesContext.jsx
ddc9899c334450f77cfd019c83f0129f5ee08eb759d6a6d25976beb666128007  src/sections/wiki-de-poble/WikiDePobleSection.jsx
bb59a317bc6d35270a220756c068ceec9fe61a338d50ace533ea09b30d44080d  tooling/wiki/compile-wiki-to-app.mjs
```

### Tancament documental

`document.mjs check` retorna `valid: true`. Índex de l’escriptori ancorat i `.agents/ESTAT.md` actualitzat.

`tancament.mjs --turn-id torn_30404528-19b7-4c18-a7c2-eac91c74331b --check` s’ha executat. **El torn formal no queda segellat:** el workflow exigeix un pla vinculat i un relleu al LEDGER també per al torn documental, que aquesta auditoria no ha creat; a més, el segell global de skills ja estava desfasat. Són límits administratius separats dels defectes de producte. No he alterat el LEDGER ni resegellat regles alienes.

La primera passada també interpretà fragments de URL escrits en prosa en aquesta auditoria com a enllaços fins al següent parèntesi; s’ha corregit la notació pròpia. No s’ha atribuït aquest fals positiu al producte auditat. Resultat final de les comprovacions d’entorn: plantilles, autoritat, LEDGER, skills, Wiki i SCC passen; falla el segell de skills.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

No he accedit a secrets `.env`, fet migracions, desplegat, instal·lat paquets ni canviat codi de producte. L’única consulta externa activa de dependències ha sigut `npm audit` contra el registre oficial, després de l’autorització de xarxa. S’han consultat també fonts públiques oficials per contrastar el contracte REST.

No hi ha credencials de prova ni accés administratiu verificat al Supabase de Sollutia en l’abast d’aquesta auditoria. Per tant, **RLS, grants, triggers, Realtime, SMTP, proveïdor Google, backups, restauració, CORS/CSP del hosting i versions remotes queden sense certificar**. No he fet pentesting del servei remot. La manca d’evidència és un criteri de no-go, no una vulnerabilitat inventada.

Les reproduccions aïllades demostren les propietats indicades del codi, però no substitueixen proves de navegador autenticat ni transaccions PostgreSQL. No s’ha mesurat càrrega concurrent, rendiment en mòbil real, accessibilitat completa ni cada ruta de la plataforma. No es garanteix «zero forats» després d’aquesta revisió.

El tancament de la tasca consisteix a entregar el diagnòstic, no a executar-ne les reparacions. Al final de la revisió ha aparegut l’acta concurrent `260922_2115_acta_marmota.md`, que he llegit. Recull la preparació i observacions preliminars d’aquesta auditoria, no el seu resultat final. També cita un possible error d’AvisadorEfimer i requisits de mini-cards/Arrels: no els he reproduït ni implementat, i no els compte com a troballes confirmades. L’acta repeteix que `aria-current` està corregit, però el fitxer encara el conserva. Cal incorporar-hi el diagnòstic final en el relleu de la jornada.


<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
