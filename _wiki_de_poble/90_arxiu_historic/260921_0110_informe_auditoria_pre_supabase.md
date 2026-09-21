---
type: informe
status: esborrany
description: Auditoria local de persistència de notes, SCC, rutes i preparació per a Supabase, amb reproduccions en memòria.
tags:
  - arquitectura
  - seguretat
---

# Auditoria extrema pre-Supabase

21 de setembre de 2026 · Codex · arbre local de treball.

**Veredicte: NO-GO per a confiar dades reals a la migració amb les garanties actuals de recuperació.** Hi ha pèrdua reproduïble de drafts, conflictes que eliminen la còpia recuperable i publicacions parcialment confirmades. La separació de components és aprofitable; la persistència encara no té un contracte fiable.

No s'ha demostrat cap intrusió, fuga remota ni bypass de RLS. «Migració no iniciada» pot descriure el desplegament, però al repositori ja existixen un adaptador Supabase funcional i migracions SQL. Esta auditoria examina eixes peces; no pressuposa que s'hagen aplicat a cap servidor.

## Abast i contenció

Lectura local de GlobalSaveManager, NotesContext, NotesDataContext, UniversalWorkspace, WorkspaceContext, backendPort, adaptador de notes/runtime/content, SQL de notes i polítiques posteriors, arrel, SCC, manifest, ESLint, Vite i documentació activa d'integració. No és una auditoria exhaustiva de totes les taules, autenticació o Storage.

Sense xarxa externa, navegador, credencials, instal·lacions, builds ni aplicació de migracions. L'únic fitxer creat és este informe, expressament demanat a l'escriptori. No s'han modificat fitxers existents, ESTAT, LEDGER ni índexs; no s'ha executat el tancament amb possibles efectes laterals. L'informe queda pendent d'ancoratge per respectar la contenció.

Fonts locals: `.agents/AGENTS.md`, `.agents/protocolledge.json`, plantilla canònica del Consell i protocol d'auditoria. S'ha prioritzat la instrucció de contenció de l'usuari sobre les obligacions locals d'escriptura.

## Evidència executada

| Comprovació local | Resultat |
| --- | --- |
| `node tooling/gates/verificador-scc.mjs` | Codi 1; `ERR_INVALID_ARG_TYPE`, arrel undefined. |
| `VerificadorSCC(process.cwd()).runAudits()` | 119 Markdown escanejats; valid=true, zero incidències. No reproduïx els 13 orfes anunciats. |
| `node tooling/gates/tractor-manifest.mjs --check` | Codi 0; catàleg de 16 skills coherent. |
| ESLint, mateixos directoris que `npm run lint`, sense fix/cache | 401 fitxers; 23 errors, tots `eol-last`; 357 avisos. |
| `String(ARREL)` | `Reflect.get called on non-object`. |
| `R('../outside')` / `dins(arrel, '../outside')` | R ix del repositori; dins rebutja el camí. |
| GlobalSaveManager en VM, temporitzadors i IndexedDB simulats | ACK d'A elimina el draft B; un 409 elimina el draft; 3 obertures i 0 tancaments explícits en el primer escenari. |
| Transacció IDB simulada que rebutja amb quota | El rebuig escapa del catch intern; zero avisos del catch. |
| knownRevisions=2 amb baseRevision=5 | El gestor retorna 2. |
| ESLint sobre fragments en memòria | Accepta process.cwd en frontend, import dinàmic de SDK i import directe de l'adaptador des d'una secció. |

Els arnesos carreguen el codi real en memòria i substituïxen les dependències necessàries. Demostren l'ordre lògic i el tractament de promeses; no són proves d'IndexedDB en un navegador real. No s'han creat fitxers de test ni executat Vitest/Vite, per evitar escriptures de caché i altres efectes laterals. No hi ha certificat de rendiment ni prova real de RLS.

## Troballes bloquejants

### F01 · P1 · Una confirmació antiga destruïx un draft nou

**Fonts:** `src/sections/notes/GlobalSaveManager.js:112-123,133-154`.

Cada nota té una única clau persistent, però diverses generacions en vol. A entra a xarxa; B s'escriu a IndexedDB; arriba l'ACK d'A i `removeDraftFromIDB(key)` elimina B. La serialització de peticions no serialitza la propietat del registre persistent. L'arnés ho confirma: abans de l'ACK hi ha content=B; després, el magatzem està buit mentre B continua pendent.

La branca d'error també pot sobreescriure B amb el payload antic A. A més, un nou lot només persistix els seus camps: si el lot en vol té content i el següent title, la clau deixa de contindre content encara no confirmat. Amb dues pestanyes, els locks són independents però IndexedDB és compartit.

**Impacte:** tancar o recarregar en eixa finestra perd treball que el sistema afirma protegir. Més latència amplia la finestra.

**Solució conservadora:** identificar generacions/operacions, persistir el conjunt pendent i eliminar únicament la generació confirmada, en una transacció. Definir també la coordinació entre pestanyes. No basta afegir un altre debounce.

### F02 · P1 · El conflicte es resol destruint la recuperació

**Font:** `src/sections/notes/GlobalSaveManager.js:146-150`.

En 409 s'elimina deliberadament el draft. Reproduït en memòria. El servidor ha rebutjat el canvi, però el client elimina la còpia persistent que permetia recuperar-lo. Un override visual pot sobreviure en la sessió; no substituïx una còpia durable, especialment perquè content s'exclou de sessionStorage (`NotesContext.jsx:86-94`).

**Solució:** conservar versió base, canvi local i versió remota; marcar conflicte i permetre recuperar/comparar. El 409 no és autorització per a descartar contingut.

### F03 · P1 · Recuperar un draft no significa tornar-lo a desar

**Fonts:** `src/sections/notes/NotesDataContext.jsx:60-85`; `GlobalSaveManager.js:103-165`.

La càrrega fusiona drafts amb notes remotes, però no els reencua. Si es recupera content i després només s'edita title, únicament title torna al servidor. L'èxit del títol pot eliminar el draft de content. El text recuperat sembla normal a la UI, sense estat explícit de pendent.

La comparació de `_draftTimestamp` amb updatedAt del servidor també pot descartar visualment una edició per rellotges desajustats o per una actualització remota d'un altre camp. El draft no conserva revisió base. Les notes que no arriben en el resultat remot no es recuperen per esta fusió.

**Solució:** restaurar operacions pendents amb revisió base i estat visible, i reintentar-les de manera controlada. Separar conflicte de reconciliació; no decidir propietat del canvi amb dos rellotges.

### F04 · P1 · El canvi de sessió no invalida la cua global

**Fonts:** `GlobalSaveManager.js:103-165`; `NotesDataContext.jsx:27,35-46,138-155`; `src/data/supabase/runtime.js:42-45,65-66`.

El scope etiqueta la clau local, però no comprova l'actor quan s'executa una escriptura retardada. El token es llig de la sessió vigent en fer request. Si A edita, ix i entra B abans del debounce, la tasca d'A pot executar-se amb el token de B. Les comprovacions del provider només eviten integrar la resposta en un scope diferent; no cancel·len l'operació remota.

**Impacte confirmable per codi:** operacions amb identitat temporalment incoherent i errors espuris. Amb RLS correcta, la nota d'A ha de quedar protegida; no s'afirma una fuga entre usuaris. El gestor no inclou purga de revisions ni cancel·lació per generació de sessió.

**Solució:** vincular cada tasca a una generació d'identitat/configuració, suspendre-la en logout/canvi de backend i reprendre-la només dins del seu scope autoritzat. La política de retenció de drafts privats en dispositius compartits requerix decisió humana (`requires_human_decision: true`).

### F05 · P1 · Publicar no és atòmic i evita el lock de la nota

**Fonts:** `src/sections/notes/NotesContext.jsx:233-247`; `src/data/supabase/content.js:52-66`.

Primer s'inserix al mur i després s'actualitza isPublished de la nota. El segon pas no passa pel lock de GlobalSaveManager. Un autosave concurrent pot provocar 409 després d'haver publicat. La UI informa d'error i un reintent genera un UUID nou: pot duplicar el mur. El resultat de sendSectionSubmission tampoc es registra com a publishedSubmissionId, malgrat existir eixe camp al model.

**Solució:** operació idempotent amb identificador estable i confirmació conjunta al servidor, o un protocol explícit de recuperació del pas parcial. Totes les mutacions de la mateixa nota han de compartir el control de concurrència. El comentari «atòmic i síncron» no correspon al comportament actual.

## Resiliència i preparació de dades

### F06 · P2 · IndexedDB té gestió incompleta d'errors i recursos

**Font:** `GlobalSaveManager.js:8-79,116,154`.

Cada operació obri una connexió sense tancament explícit, connexió compartida ni onversionchange. Tampoc hi ha onblocked o tx.onabort. Açò pot bloquejar futures actualitzacions d'esquema i deixar promeses pendents. No s'ha mesurat una fuita de heap real: sí que s'ha constatat l'absència de gestió del recurs.

`return new Promise(...)` dins del try no captura un rebuig posterior com ho faria `return await`. Reproduït amb un error de quota simulat. Les crides de persistència en enqueue no tenen await/catch: poden generar rebutjos no gestionats. Si falla l'obertura, en canvi, es registra un warning i el flux pot continuar sense còpia durable.

**Solució:** cicle de vida explícit de la connexió, complete/error/abort, estat de persistència observable i cap promesa abandonada. Distingir «canvi en memòria», «draft durable» i «confirmat pel servidor».

### F07 · P2 · Revisions obsoletes, cua sense límit i promeses encallables

**Font:** `GlobalSaveManager.js:90-100,108-113,125-164`.

knownRevisions preval sempre sobre la base, encara que la base siga més nova: 2 preval sobre 5 en la prova. Només es buida la clau en 409. No hi ha invalidació general per refetch o sessió ni límit de retenció.

Amb xarxa lenta, cada lot segellat s'acumula darrere de l'anterior, sense compactació entre lots. Un backend que no resol reté la cadena; el timeout de 12 segons de l'adaptador Supabase ajuda, però no és una garantia del port genèric. getBaseNote queda fora del try; si llança, o falla un callback dins del catch, la promesa del lot no es resol i una cadena dependent pot saltar-se doSave.

**Solució:** reconciliar revisions amb la font autoritativa, compactar canvis encara no enviats i garantir resolució de tots els consumidors independentment dels callbacks de UI.

### F08 · P2 · El timeout no activa la reconciliació prevista

**Fonts:** `src/data/supabase/runtime.js:78-81`; `NotesDataContext.jsx:153-155`.

El runtime crea un error amb name=TimeoutError i missatge «La petició ha trigat massa temps». El provider busca la paraula anglesa timeout en el missatge. No coincidixen. Una escriptura pot haver arribat al servidor abans de perdre la resposta; sense refetch, el següent intent usa una revisió vella i pot acabar en F02.

La classificació de xarxa també busca fetch/network, mentre el runtime transforma TypeError en ErrorSupabase amb missatge «Error de xarxa». La ruta de degradació silenciosa prevista no cobrix eixe error normalitzat (`NotesDataContext.jsx:108-117`).

**Solució:** discriminants estables (name/code/status) i reconciliació de confirmació incerta, separada d'un fracàs definitivament rebutjat.

### F09 · P2 · El model de lectura perd abast i conserva notes desaparegudes

**Fonts:** `src/data/supabase/notes.js:19-29`; `NotesDataContext.jsx:88-102`; `supabase/migrations/260920_0300_blindatge_storage_i_contingut.sql:72-83`.

La lectura de notes es limita a 50 sense paginació. Les submissions es limiten globalment a 50 abans de filtrar section_id=notes en client. La interfície no distingix «totes les notes» de «primera pàgina»; una nota anterior i el seu draft poden quedar invisibles.

La reconciliació conserva qualsevol localOnly com si fora una creació recent. No pot distingir una nota creada durant la càrrega d'una nota eliminada remotament; pot mantindre elements fantasma.

Finalment, el lector encara demana notes/noteFolders d'app_content, però la política restrictiva posterior no els permet a usuaris ordinaris. Una carpeta personal guardada allí no arriba; el mapper aporta carpetes seed. Açò necessita una decisió explícita de model, no una fusió silenciosa de fonts.

**Solució:** cursor/paginació, filtratge al servidor, seguiment de creacions pendents i model canònic de carpetes. Concretar la migració de dades antigues abans d'activar usuaris.

## Portes i rutes

### F10 · P2 · SCC continua tenint trams que fallen en obert

**Fonts:** `tooling/gates/verificador-scc.mjs:22-43,91-93,117-132,154-158,181-207,282-283`.

La detecció d'índexs canònics absents és una millora real. Però:

- La CLI està trencada: CAMINS.arrelSegura no existix. Reproduït amb la comanda usada per porta:scc.
- L'ancoratge usa 04_ESCRIPTORI/00_INDEX_ESCRIPTORI.md; els noms físics són 04_escriptori/00_index_escriptori.md. En un FS sensible a majúscules, el catch salta eixa verificació, encara que la comprovació dels índexs del graf use les minúscules correctes.
- Els errors de recorregut es silencien. Un directori il·legible pot desaparéixer del conjunt auditat sense invalidar el resultat si els índexs continuen accessibles.
- stat seguix symlinks, sense visited/realpath ni contenció. El recorregut pot eixir del repositori o entrar en cicles. No s'ha fabricat cap symlink per provar-ho.
- Els enllaços es resolen només per basename, ignorant la ruta. Una ruta incorrecta pot quedar acceptada si existix un fitxer homònim. En el tall actual no hi havia basenames duplicats entre els 119 Markdown; la col·lisió és una fragilitat latent, no un duplicat trobat.
- L'ancoratge només rep Markdown: no certifica els altres tipus de fitxer de Produccio.

**Solució:** arrel segura real, noms canònics exactes, diagnòstic fatal d'escaneig incomplet, política explícita de symlinks i resolució d'enllaços contextual amb ambigüitats reportades. «valid=true» actual no certifica tot l'escriptori.

### F11 · P2 · L'API d'arrel té un export trencat; no tota unió conté rutes

**Fonts:** `tooling/lib/arrel.mjs:275-290,152-173`; `vite.config.js:13,35-36`; `tooling/gates/tractor-rutes.mjs:31`; `tooling/gates/tractor-rutes-web.mjs:32`.

ARREL és un Proxy que passa un string a Reflect.get. String(ARREL) falla. arrelSegura sí que retorna el string correcte, i el catàleg actual l'utilitza; no s'afirma que el manifest estiga trencat.

R és un join, no una barrera: R('../outside') ix de l'arrel. dins rebutja eixe exemple, però el seu ús és explícit. No s'ha demostrat un exploit amb entrada no fiable; s'ha refutat la garantia genèrica de «rutes a prova de bales».

L'alias @ de Vite és relatiu al fitxer i és correcte. La càrrega d'entorn encara depén de process.cwd; altres portes també calculen l'arrel des de cwd. La centralització no és completa. tractor-manifest valida el catàleg de skills, no el conjunt de rutes Vite.

**Solució:** un únic contracte simple de string/arrelSegura; distingir join de validació de contenció; provar execució des de cwd alternatiu i un FS sensible a majúscules.

### F12 · P2 · ESLint executa bé, però no prova la frontera arquitectònica

**Font:** `eslint.config.js:8,12,20-22,35,46-64`.

Les exclusions de node_modules/dist existixen i la comprovació acaba; no s'ha observat el problema antic de lintar dependències. Tot i això, el tall actual no passa: 23 errors de final de línia i 357 avisos.

La regla d'import només prohibix la importació estàtica del SDK. No prohibix que una secció importe directament src/data/supabase/notes.js ni import('@supabase/supabase-js'); els dos fragments passen en memòria. Barrejar globals Node i navegador deixa passar process.cwd en frontend. Esta observació és sobre ESLint; no pressuposa que altres portes del repositori no inspeccionen imports.

exhaustive-deps és warning: publica amb dependències incompletes de scopeKey/updateNoteContext/clearLocalNoteFields/showToast a NotesContext.jsx:247. En la configuració actual no bloqueja encara que siguen dependències rellevants per a la sessió.

**Solució:** separar entorns, expressar imports per capes i tractar les captures de sessió obsoletes com a errors funcionals. Els finals de línia no són un risc de dades; no s'han confós amb els P1.

## UniversalWorkspace i arquitectura aprofitable

UniversalWorkspace no fa peticions i accepta un model injectat. Els guards de muntatge/generació en crear (`UniversalWorkspace.jsx:336-370`) eviten que una resposta tardana impose una selecció després d'un canvi de navegació. WorkspaceContext ajornà la reconciliació fins a ready. Són decisions adequades per a un backend lent.

La UI, però, substituïx el detall per loading (`UniversalWorkspace.jsx:545-548`), i el provider posa loading també en recàrregues. Amb latència, això desmunta l'editor durant refresh. La selecció robusta no equival a durabilitat del contingut: l'editor depén de F01-F03. Convé diferenciar càrrega inicial de refresc amb dades disponibles.

No hi ha prova de volum. La llista renderitza tots els filteredItems i NotesContext calcula text de cerca sobre el contingut complet (`NotesContext.jsx:156-164`). Quan es resolga el límit de 50, cal mesurar; no hi ha base per prescriure ara una virtualització complexa.

backendPort valida mètodes i capacitats abans d'adoptar la implementació. El PATCH de notes filtra id, tenant i revision, i el SQL incrementa revision en trigger (`notes.js:56-58`; `260914_0000_schema_notes.sql:30-44`). Les polítiques de notes exigixen propietari i pertinença al poble. És una base útil per a concurrència optimista i aïllament; no substituïx una prova real de les migracions aplicades.

La documentació necessita reconciliació: l'ADR Model B descriu una Frontissa client.js que no apareix entre els adaptadors actuals; el README de Supabase encara anuncia modes auto/hybrid, mentre runtime normalitza remote/seed/local. Són senyals que el pla d'integració no pot executar-se llegint només la prosa.

## Condicions de preparació recomanades

Abans de posar-hi dades reals, exigiria evidència dels casos següents:

1. Dos lots de la mateixa nota amb ACK retardat: cap canvi pendent desapareix en recarregar.
2. Error de quota/abort/open bloquejat: la UI distingix que no hi ha còpia durable i totes les promeses acaben.
3. 409 i resposta perduda després d'un commit: contingut local recuperable i reconciliació explícita.
4. Restauració seguida d'una edició d'un altre camp: tots els camps recuperats arriben al servidor o continuen marcats pendents.
5. Dues pestanyes, logout/login i canvi de tenant: cap tasca s'executa amb una identitat aliena al seu origen.
6. Publicació concurrent amb autosave i reintent: un únic element al mur, amb vinculació persistent a la nota.
7. Més de 50 notes, eliminació remota i carpetes personals: lectura completa/paginada i reconciliació correcta.
8. SCC des de la comanda npm, índex absent, lectura denegada i Linux: errors explícits, cap èxit per escaneig parcial.
9. Migracions en una base de prova controlada: accés creuat entre propietaris/tenants rebutjat i increment real de revision verificat. No s'ha fet en esta auditoria sense xarxa.

Els cinc P1 són bloquejants per integritat i recuperació de dades. Les correccions poden ser menudes i llegibles: un protocol únic de desat, identitat, revisió i confirmació. Afegir IndexedDB sense eixe protocol ha canviat el lloc on es desa el draft, però encara no n'ha garantit la supervivència.

## Vincles

- [[00_index_escriptori]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
