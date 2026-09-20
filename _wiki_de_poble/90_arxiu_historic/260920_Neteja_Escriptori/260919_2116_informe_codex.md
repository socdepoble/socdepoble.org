---
type: informe
status: esborrany
description: Auditoria local de lògica, persistència i arquitectura cognitiva de MarIA, amb proves i proposta de foli operatiu.
tags:
  - arquitectura
  - govern
---

# Informe de Codex — Auditoria arquitectònica i diagnòstic de l’Efecte Matrix

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260919-COG-CODEX |
| Versió | 1.0.0 |
| Encàrrec | SDP-PROMPT-260919-COG |
| Entorn | entorn-dev-local; arbre de treball de socdepoble.org |
| Creació | 2026-09-19 21:16 CEST |
| Modificació | 2026-09-19 21:16 CEST |
| Agent redactor | Codex |
| Destinatari | Mestre i IAIA MarIA; contrast posterior amb Claude |
| Aprovació humana | pendent |
| Revisió pendent | sí |
| Referència Git | 214f5c7c65bdc011c2d7e2f93f73d50438f9fa21 + canvis locals preexistents |
| Modalitat | auditoria; implementació reservada a MarIA |

**Ancoratge de Seguretat:** [[00_index_escriptori]]

## Dictamen

Hi ha defectes reproduïbles de separació de dades, desat i sessió. Els més urgents són la mescla de notes entre usuaris o tenants, les respostes de creació que contaminen l’àmbit nou, la pèrdua de referències d’imatge en sanejar i la revisió que queda encallada després d’un conflicte. No és una conclusió extreta del linter: els casos A01–A05 s’han executat amb el codi actual i dependències simulades en memòria.

El problema de nomenclatura de MarIA té una explicació concreta: un dels encaminadors selecciona una plantilla que presenta `PROMPT` com a «legacy» i recomana `MACRO_PROMPT` o `MICRO_PROMPT`. La plantilla general exigeix el contrari per als agents locals. Per tant, **en aquest cas MarIA pot obeir una plantilla vigent al disc i, alhora, desobeir la regla que el Mestre espera**. Evidències i reproducció: C01.

El sistema Matrix també confon tres coses diferents: llegir un fitxer des d’un procés Node, entregar-ne el contingut al model i comprovar que l’acció resultant respecta les regles. La primera està implementada en un camí; les altres dues no queden acreditades pel seu rebut. A més, els dos camins de preparació emeten rebuts incompatibles i la porta d’escriptura admet rebuts d’altres tasques. Evidències: C02–C04.

**No puc diagnosticar una «amnèsia» interna, un estat emocional ni una causa d’entrenament del model a partir d’aquests fitxers.** Sí que puc demostrar contradiccions, garanties incompletes i absència d’una prova de lliurament del context. La proposta és donar a MarIA un foli breu, una sola autoritat normativa i un control vinculat a cada acció. És un disseny teòric; no s’ha instal·lat cap cron ni canviat cap regla.

## Abast, contenció i qualitat de l’evidència

L’auditoria se centra en notes, identitat, renovació de sessió, mitjans, alguns contractes del router i el circuit local de regles, plantilles, hooks i validació. No és una certificació exhaustiva del repositori ni del backend desplegat.

S’han llegit la plantilla del Consell, la plantilla interna, la plantilla d’estudi i les skills pertinents com a fonts auditades. El resultat és un informe original de Codex; no simula una resposta de Claude ni converteix les instruccions internes de MarIA en autorització per implementar canvis.

L’única escriptura en el projecte d’aquesta auditoria és aquest informe. No s’han modificat fonts, regles, índexs, ESTAT, LEDGER ni migracions; no s’han executat commits, builds, reparadors, sincronitzacions ni connexions a Supabase. No s’han utilitzat cerca web ni navegador. Les proves dinàmiques han executat fonts en memòria amb dependències substituïdes; no s’han creat fitxers de proves al repositori.

La regla general de tancament demana actualitzar ESTAT i executar un script que sincronitza skills. En aquesta auditoria preval la contenció específica de l’encàrrec: no s’executa aquesta sincronització ni es declara el tancament global en verd. Fonts: `AGENTS.md:26-27`; `tooling/gates/tancament.mjs:18-29`. L’informe porta un enllaç a l’índex, però no s’afirma que l’índex l’enllace en sentit contrari.

**Manifest i tall auditat.** L’encàrrec local no aporta un manifest propi de fonts. El `manifest.json` existent declara una data de 15 de setembre; en contrastar els seus 160 registres amb el disc, 7 rutes no existeixen i 90 hashes difereixen. No conté fitxers de `.agents/`. És inadequat per fixar el tall actual. Font de la data i estructura: `manifest.json:1-8`. Per fer verificable aquest informe s’inclou al final un **manifest local suplementari**, amb les rutes citades, nombre de línies i SHA-256 actual. No s’ha regenerat el manifest del projecte.

Les observacions s’etiqueten així:

- **Reproduït:** execució local de la font amb dades de prova i serveis simulats.
- **Demostrat per lectura:** recorregut de codi identificable; no equival a una incidència observada en producció.
- **[SUPÒSIT]:** interpretació causal que necessita telemetria o verificació addicional.
- **P1:** risc alt sobre separació de dades, persistència o integritat de sessió; atendre abans d’una entrega que depenga d’aquests fluxos.
- **P2:** defecte funcional o garantia incompleta amb un desencadenant delimitat. No s’assigna cap P0 sense demostrar-ne l’abast.

## Front arquitectònic

### A01 · P1 · El canvi d’àmbit conserva notes de l’usuari anterior

**Reproduït.** En iniciar una càrrega nova, NotesDataProvider canvia `scopeKey` però conserva `payload` mitjançant l’expansió de l’estat anterior. Quan arriba la resposta, construeix el mapa local amb aquell payload i afegeix totes les notes que no han vingut del servidor. La comprovació d’àmbit ja no detecta la mescla: s’ha canviat l’etiqueta de l’estat sense buidar-ne el contingut. Fonts: `src/sections/notes/NotesDataContext.jsx:23-40`, `src/sections/notes/NotesDataContext.jsx:47-70`.

**Reproducció:** carregar A amb A-note; mantenir el proveïdor muntat; passar a B i fer que el servidor retorne només B-note. Resultat: l’àmbit declarat de B conté B-note i A-note. Aquest muntatge persistent és el que estableix AppContent. Font: `src/app/App.jsx:485-501`.

**Impacte:** contingut privat ja present al client pot continuar visible sota una altra sessió o tenant. No cal que el servidor retorne dades alienes; no s’està afirmant cap evasió de RLS. En el mateix àmbit, retenir indiscriminadament tot `localOnly` també pot mantenir registres eliminats o exclosos pel servidor.

**Solució teòrica:** l’àmbit forma part de la identitat de tot el payload. En canviar, buidar o segregar l’estat abans de reconciliar. Retenir només mutacions confirmades del mateix àmbit que tinguen una raó explícita per no aparéixer encara en la resposta.

**Acceptació:** A→B, logout→login i tenant A→B no mostren cap registre de l’àmbit anterior, incloses notes amb identificadors coincidents i respostes en ordre invertit.

### A02 · P1 · Una mutació antiga pot escriure dins de l’estat nou

**Reproduït per a creació; demostrat per lectura per a actualització.** En `creaNota`, `myConfig` i `config`, així com `myActor` i `actorKey`, pertanyen al mateix tancament de la funció. Comparar-los després de l’await no consulta el render actual. La resposta es posa dins del `prev.payload` que hi haja en aquell moment. `updateNote` tampoc contrasta àmbit o generació abans de substituir la nota. Fonts: `src/sections/notes/NotesDataContext.jsx:97-110`, `src/sections/notes/NotesDataContext.jsx:134-154`.

**Reproducció:** deixar una creació d’A pendent; canviar a B; completar la càrrega de B; resoldre la creació d’A. Resultat: A-late-note apareix en l’estat de B. És un defecte diferent d’A01: continua existint encara que es buide correctament el payload en canviar d’àmbit.

**Solució teòrica:** capturar l’àmbit i la generació de l’operació i contrastar-los amb l’estat actual en el moment de confirmar-la. La resposta antiga pot resoldre per al seu consumidor sense incorporar-se al context actual.

**Acceptació:** completar una creació o actualització antiga després d’un canvi d’usuari, tenant o logout no altera el context nou. Si una nota del nou àmbit comparteix ID, tampoc es reemplaça.

### A03 · P1 · El sanejador destrueix les referències d’imatge que retorna Storage

**Reproduït.** La pujada de notes retorna `sdp-media://mitjans_privats/…`, i la pública també retorna una referència `sdp-media://`. Notes aplica `esFontImatgeSegura` a hero/logo i `sanitizeHtml` al cos. El primer només accepta, fora de data URI, els protocols http/https; el sanejador elimina el src de les imatges opaques. Fonts: `src/data/supabase/storage.js:102-127`; `src/sections/notes/NotesContext.jsx:13-21`; `src/utils/sanitize.js:35-49`, `src/utils/sanitize.js:71-87`, `src/utils/sanitize.js:107-120`.

**Reproducció:** sanejar un paràgraf amb una imatge privada i repetir-ho amb una pública. En tots dos casos `esFontImatgeSegura` retorna false i l’HTML perd `src`; una ruta local de control el conserva. La conversió de hero/logo dona cadena buida.

**Impacte:** la imatge pot veure’s inicialment a l’editor amb el resolutor nou, però el desat perd la referència. El NodeView resol la imatge per pintar-la; això no canvia el contracte del sanejament persistent. Font: `src/components/universal/richText/extensions/SdpImageNodeView.jsx:5-18`.

**Solució teòrica:** definir un únic contracte de referència interna, validar estrictament esquema, bucket i ruta, conservar la referència en dades persistents i resoldre-la només en la visualització. No obrir indiscriminadament protocols al sanejador.

**Acceptació:** pujar → editar → desar → recarregar conserva hero i imatges del cos; una referència malformada continua bloquejada; les URLs signades no es converteixen en dades persistents.

### A04 · P1 · Després d’un 409, la revisió del desat queda encallada

**Reproduït.** GlobalSaveManager prioritza indefinidament la revisió de `knownRevisions` sobre la que porta la nota recarregada. En un 409 mostra un avís però no invalida ni reconcilia aquesta entrada. El context recarrega, però la següent operació torna a usar la revisió antiga. Fonts: `src/sections/notes/GlobalSaveManager.js:10-21`, `src/sections/notes/GlobalSaveManager.js:46-68`; `src/sections/notes/NotesDataContext.jsx:111-115`.

**Reproducció:** desar revisió 1 i rebre 2; simular que una altra sessió porta el servidor a 10; proporcionar ja la nota base amb revisió 10. Dos intents consecutius envien 2 i fallen. Seqüència observada d’expectatives: 1, 2, 2; revisió encara guardada en memòria: 2.

**Solució teòrica:** invalidar la revisió obsoleta i entrar en reconciliació explícita entre base, esborrany i versió remota. Actualitzar simplement el número i repetir el payload pot sobreescriure contingut alié; recuperar l’avanç no equival a resoldre el conflicte.

**Acceptació:** un canvi remot concurrent no produeix una cadena infinita de 409, no es perd l’esborrany i no es confirma una sobreescriptura sense una política de fusió o decisió explícita.

### A05 · P1 · Una renovació antiga pot tancar la sessió nova

**Reproduït.** `renovaAra` espera el refresc i, si torna false, executa logout sense contrastar la generació que hi havia en començar. Les consultes de rol sí que porten aquesta comprovació. L’adaptador d’autenticació torna false si l’epoch ha canviat, però el servei interpreta igualment aquest resultat com una ordre de tancar la sessió actual. Fonts: `src/data/sessionService.js:62-77`, `src/data/sessionService.js:86-101`; `src/data/supabase/auth.js:12-41`, `src/data/supabase/auth.js:157`.

**Reproducció:** començar una renovació d’A, canviar a B i sincronitzar, resoldre el refresc vell amb false. Resultat: logout s’executa sobre B.

**Solució teòrica:** vincular tota renovació a identitat, backend i generació; una resposta obsoleta no pot modificar la sessió vigent. Diferenciar resposta obsoleta, error transitori de xarxa i revocació d’autenticació.

**Acceptació:** una renovació d’A que acaba després de l’entrada de B no tanca ni modifica B; dos disparadors de renovació no introdueixen efectes duplicats.

### A06 · P2 · El flush d’eixida torna a ajornar el desat 600 ms

**Demostrat per lectura.** L’editor fa flush en pagehide, en ocultar la pestanya i en el desmuntatge, però aquest flush només invoca el callback de desat. El callback de Notes acaba en un gestor que sempre torna a esperar 600 ms abans de començar la petició. Fonts: `src/components/universal/richText/useUniversalRichText.js:34-48`, `src/components/universal/richText/useUniversalRichText.js:89-108`; `src/components/universal/DocumentEditor.jsx:53-68`; `src/sections/notes/NotesContext.jsx:151-163`; `src/sections/notes/GlobalSaveManager.js:24-43`, `src/sections/notes/GlobalSaveManager.js:72-77`.

**Impacte delimitat:** un desmuntatge de React amb el document encara viu pot completar el desat; tancar el document abans d’executar el temporitzador no té aquesta garantia. No he executat un tancament real de navegador. Els esborranys es guarden en sessionStorage i no he trobat un reencuament automàtic en el flux de restauració de Notes: aquest només carrega overrides. Fonts: `src/config/storage.js:60-74`; `src/sections/notes/NotesContext.jsx:61-93`.

**Solució teòrica:** distingir debounce, drenatge immediat de cua i confirmació durable. Conservar una recuperació fiable d’operacions no confirmades segons la política de persistència del producte; no declarar «desat» perquè s’ha programat un timer.

**Acceptació:** escriure i tancar immediatament, perdre xarxa i recuperar una sessió han de permetre distingir què és al servidor, què està pendent i què es pot recuperar.

### A07 · P2 · Les notes remotes es tallen a 50 sense continuació

**Demostrat per lectura.** La consulta de notes porta un límit fix de 50 i no retorna cursor, total ni informació de continuació. El context i la secció treballen amb aquest únic conjunt. A més, les submissions es limiten a 50 de totes les seccions i només després es filtren les de notes. Fonts: `src/data/supabase/notes.js:19-29`; `src/sections/notes/NotesDataContext.jsx:43-70`; `src/sections/notes/NotesSection.jsx:45-65`.

**Impacte:** amb 51 notes remotes pròpies i un muntatge nou, la més antiga pot no estar accessible des del llistat ni de la cerca local. Pàgines visuals d’un array truncat no solucionen la càrrega incompleta.

**Solució teòrica:** paginació del servidor amb ordre estable i continuació explícita; filtrar la secció abans de limitar les submissions. Separar el conjunt carregat de la quantitat total coneguda.

**Acceptació:** 51 i 101 notes són accessibles sense desaparicions ni duplicats entre pàgines; la cerca informa del seu abast.

### A08 · P2 · Si Storage està prohibit, el mòdul falla abans dels try/catch

**Reproduït amb un getter que llança SecurityError.** Les constants inicials consulten `window.localStorage` i `window.sessionStorage` fora dels blocs protegits. Un accés prohibit pot fallar en importar el mòdul abans d’arribar als fallbacks de cada funció. Font: `src/config/storage.js:1-2`, `src/config/storage.js:11-23`, `src/config/storage.js:60-70`.

**Impacte delimitat:** entorns d’incrustació o polítiques de navegador que llancen en accedir a Storage. La prova modela aquest contracte; no acredita que el host de Sollutia estiga configurat així.

**Solució teòrica:** detectar capacitat dins d’un accés protegit i definir una degradació observable. Si no es pot conservar un esborrany, informar-ne sense tombar la importació de l’aplicació.

**Acceptació:** denegar cadascun dels dos Storage, tant en obtenir-lo com en escriure-hi, no impedeix arrancar la part llegible de l’aplicació.

### A09 · P2 · Les URLs privades resoltes no es renoven ni es vinculen a sessió

**Reproduït parcialment i demostrat per lectura.** El hook de mitjans només depén d’assetRef. La mateixa referència amb una sessió nova no torna a resoldre’s, i no hi ha temporitzador de renovació. Storage genera URLs privades amb 3.600 segons de duració. Fonts: `src/hooks/useResolvedAsset.js:12-45`; `src/data/supabase/storage.js:135-157`.

**Reproducció:** resoldre una referència, tornar a renderitzar simulant canvi de sessió sense canviar assetRef. Resultat: una sola crida al resolutor i conservació de la URL anterior. No s’ha esperat una hora ni provat la revocació al backend.

**Impacte:** una imatge diferida o recarregada després de caducar pot fallar; el client pot conservar una URL obtinguda sota una sessió anterior. No equival a demostrar una evasió d’autorització del servidor.

**Solució teòrica:** clau de resolució composta per referència, identitat, tenant i generació; caducitat explícita i invalidació. Buidar el resultat anterior quan comença a resoldre’s un altre actiu.

**Acceptació:** canvi d’usuari, caducitat, error i canvi ràpid d’imatge no mostren ni reutilitzen un resultat obsolet.

### A10 · P2 · Publicar una nota no és una operació idempotent

**Demostrat per lectura.** Notes envia una submission sense ID estable, ignora la resposta i després marca isPublished. L’adaptador genera un UUID nou en cada invocació; la deduplicació per ID no ajuda si cada intent té un ID distint. El botó rep onPublish però no un estat d’operació pendent des de DocumentEditor. Fonts: `src/sections/notes/NotesContext.jsx:201-222`; `src/data/supabase/content.js:52-66`; `src/components/universal/DocumentEditor.jsx:81-102`; `src/components/universal/richText/UniversalRichTextToolbar.jsx:13-34`.

**Impacte:** doble clic o reintent després d’una resposta ambigua poden crear publicacions duplicades. Si s’insereix al Mur però falla el desat d’isPublished, la nota pot continuar semblant pendent. El model ja exposa publishedSubmissionId, però aquest flux no el conserva. Font: `src/data/supabase/notes.js:5-9`, `src/data/supabase/notes.js:51-54`.

**Solució teòrica:** identitat estable de l’operació de publicar i registre de la submission confirmada; tractar el reintent com la continuació de la mateixa operació. Un botó deshabilitat redueix clics, però no substitueix la idempotència.

**Acceptació:** dos intents simultanis i un reintent amb resposta perduda produeixen una sola publicació i un estat reconciliable.

### A11 · P2 · Hi ha càrrega remota redundant en proveïdors globals

**Demostrat per lectura; cost no mesurat en xarxa real.** AppContent munta Core, Mur, Notes i Multimedia per a totes les seccions. Tant loadMur com loadMultimedia invoquen loadAppData, que consulta app_content, submissions i notes privades quan hi ha sessió. Notes torna a consultar aquests tres conjunts i Core fa una altra lectura d’app_content. Fonts: `src/app/App.jsx:485-501`; `src/data/supabase/content.js:19-24`, `src/data/supabase/content.js:68-80`; `src/data/supabase/notes.js:19-23`.

**Impacte delimitat:** en el camí remot amb sessió, sense comptar xat i auth, aquestes quatre càrregues originen 10 consultes lògiques: 1 de Core i 3 de cada altre proveïdor. La quantitat és un recompte del codi, no una mesura de latència. També es carrega el cos de notes des de mòduls que només necessiten Mur o mitjans.

**Solució teòrica:** consultes per domini o una càrrega compartida acotada per sessió/tenant amb invalidació comuna. Evitar una memòria cau global que reintroduïsca A01.

**Acceptació:** mesurar consultes per arrencada i refresc; Mur i Multimedia no demanen notes privades; qualsevol compartició conserva l’aïllament d’àmbits.

## Front cognitiu: defectes observables

### C01 · P1 · El nom erroni està prescrit en una plantilla seleccionada automàticament

La plantilla general diu que, sense bundle, el fitxer s’ha de dir PROMPT; la interna permet MACRO_PROMPT i MICRO_PROMPT i etiqueta PROMPT com a legacy. La skill del Consell també permet els tres per a agents locals. Fonts: `_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_CONSELL.md:22-29`; `_wiki_de_poble/02_saber/07_plantilles/01_PLANTILLA_PROMPT_INTERN.md:15-26`; `.agents/skills/skill-consell-bundle/SKILL.md:74-81`.

**Reproduït:** classifica «Crea un prompt per a Codex» selecciona la plantilla interna, amb puntuació 11. «Crea un prompt intern per a Claude» també, amb puntuació 25. Aquest resultat deriva de la taula i de la suma de longituds de coincidències. Font: `tooling/brain/classificador_tasques.mjs:4-32`.

El wrapper preflight executa aquest classificador a través de reflex_plantilles. Per tant, si el wrapper està actiu, pot injectar precisament la plantilla que origina el nom rebutjat pel Mestre. Fonts: `.agents/hooks/preflight_matrix_wrapper.mjs:45-58`; `tooling/brain/reflex_plantilles.mjs:44-61`, `tooling/brain/reflex_plantilles.mjs:83-90`.

**Conclusió limitada:** això demostra una font i un camí possibles per a l’error, no que aquest camí s’executara en el torn històric denunciat. Cal traça d’aquell torn per atribuir-li causalitat.

**Solució teòrica:** una sola regla estructurada per a categoria, destinatari i necessitat de bundle; plantilles derivades o comprovades contra ella. Una correcció de nomenclatura no queda completa mentre un altre document executiu mantinga la variant anterior.

### C02 · P1 · Hi ha dos encaminadors i els seus rebuts no comparteixen contracte

Matrix extrau la taula PROTOCOLLEDGE de skill-acte-reflex. Reflex_plantilles usa una altra taula hardcoded, amb un classificador diferent. Fonts: `tooling/brain/matrix.mjs:134-157`; `tooling/brain/classificador_tasques.mjs:4-32`; `tooling/brain/reflex_plantilles.mjs:20-24`, `tooling/brain/reflex_plantilles.mjs:44-55`.

**Reproduït:** per a un prompt per a Codex, Matrix apunta a la plantilla general i el classificador del preflight a la interna. «Audita el router» i «Revisa les notes» donen null en el classificador del preflight; la taula de la skill sí que contempla auditoria, revisar i auditar. Font: `.agents/skills/skill-acte-reflex/SKILL.md:38-56`. El terme explícit «auditoria del router» encaminat amb Matrix dona AUDITORIA_CANONICA.

El preflight emet un rebut amb estat, ts, plantilla, ruta, sha256 i tasca. La porta cerca un objecte amb tipus igual a matrix.rebut, t, peticio_sha256 i fonts. El rebut del preflight no compleix aquest format. Fonts: `tooling/brain/reflex_plantilles.mjs:73-81`; `.agents/hooks/verify.mjs:68-78`.

**Conseqüència:** injectar una plantilla i obtenir un permís d’escriptura són camins desconnectats. Un rebut antic de Matrix pot aparentar completar la cadena.

**Solució teòrica:** un encaminador i un contracte versionat de rebut; compatibilitat explícita entre preparació, entrega de context i porta d’acció. Provar variants lingüístiques i la intenció normalitzada, no només noms literals de skills.

### C03 · P1 · El rebut de Matrix prova lectura del procés, no entrega al model

Matrix llig les fonts i en guarda ruta, mida, línies i hash. Tant el JSON com la sortida humana emeten metadades; no entreguen els cossos de les fonts. Malgrat això, el missatge final declara «Context carregat de veritat». Fonts: `tooling/brain/matrix.mjs:204-215`, `tooling/brain/matrix.mjs:229-260`, `tooling/brain/matrix.mjs:263-284`.

**Reproduït en VM amb escriptures interceptades:** ready:true i un intent de generar rebut, però sense el text de la plantilla en l’objecte retornat. No s’ha creat cap rebut al disc.

Reflex_plantilles sí que emet el contingut de la plantilla. La crítica no és que cap camí entregue text, sinó que el rebut admés per verify no acredita aquest lliurament. Font: `tooling/brain/reflex_plantilles.mjs:83-90`.

**Solució teòrica:** separar els estats «font resolta», «contingut entregat al torn» i «resultat validat». Registrar la versió entregada; no denominar-la «compresa» perquè hi ha un hash. La comprensió interna no es certifica així; el compliment observable es prova sobre l’acció.

### C04 · P1 · La porta admet rebuts aliens, dates invàlides i un camí de shell massa ampli

verify selecciona l’últim rebut del diari i en comprova l’antiguitat. No contrasta petició actual, torn, destí, hashes vigents ni operació; tampoc exigeix un array de fonts no buit. La comparació de temps amb una data invàlida produeix NaN i no rebutja. Fonts: `.agents/hooks/verify.mjs:68-78`, `.agents/hooks/verify.mjs:247-259`.

**Reproduït en VM:** una petició documental rep allow amb un rebut d’una altra tasca i zero fonts; també rep allow amb t igual a invalid-date. Totes les escriptures de diari s’han substituït per operacions en memòria.

El cas run_command retorna allow abans d’avaluar ruta i rebut si la cadena coincideix amb la llista blanca, incloent qualsevol ordre que comence per node tooling/brain/. Font: `.agents/hooks/verify.mjs:109-116`. En la prova, el prefix d’un creador documental obté allow sense rebut. Aquest creador accepta una ruta i fa writeFileSync sense adquirir el rebut Matrix. Font: `tooling/brain/crear_document.mjs:6-14`, `tooling/brain/crear_document.mjs:39-42`.

**Límit:** no s’ha executat el creador ni cap ordre mutadora. El resultat demostra la decisió del guard, no un atac real ni l’activació d’aquest guard en l’IDE.

**Solució teòrica:** vincular permís a tasca, torn, operació, paths i versió de les fonts; dates vàlides i limitades; comprovació d’àmbit també en els mutadors. Un prefix de shell no descriu els efectes d’una ordre.

### C05 · P2 · «És automàtic» no està acreditat en l’arnés real

hooks.json declara PreInvocation i PreToolUse amb noms d’eina concrets. El wrapper només actua si invocationNum és exactament 1 i busca USER_INPUT en un transcriptPath. verify necessita toolCall.args. Aquests són contractes particulars, no una garantia de compatibilitat entre IDEs. Fonts: `.agents/hooks.json:1-26`; `.agents/hooks/preflight_matrix_wrapper.mjs:5-35`; `.agents/hooks/verify.mjs:93-106`.

La inspecció local troba regles globals a `/Users/javillinares/.gemini/config/AGENTS.md`, que demanen executar iaia-maria-core a l’inici i carregar tot el context en petorretas. Font: `/Users/javillinares/.gemini/config/AGENTS.md:1-12`. La presència d’aquest text no prova que siga el punt d’entrada efectiu de l’IDE.

**Inventari de lectura, no inferència d’activació:** els fitxers globals GEMINI.md i AGENTS.md de Codex inspeccionats tenen zero bytes; no existeix .cursor/rules dins del repositori; settings.local.json de Claude existeix però no conté la clau hooks. La skill global iaia-maria-core no s’ha trobat en els dos camins convencionals inspeccionats. Això no exclou configuracions, plugins o instruccions injectades per altres vies.

**Solució teòrica:** prova d’integració amb un marcador de torn i una acció inofensiva, comprovant entrada real, format de payload, missatge entregat i bloqueig observable. Fins aleshores: «hook declarat; activació pendent de demostrar».

### C06 · P2 · El termòmetre no mesura la finestra de context i pot fallar en silenci

El termòmetre compta Markdown d’un directori i fitxers pujats. No compta tokens, missatges, volum de sortides ni què ha sobreviscut a una compactació. Si no pot llegir el camí, torna zero. Deriva el directori partint del text /.system_generated; un format de transcript diferent pot fer-li tractar un fitxer com un directori. Font: `tooling/brain/termometre_context.mjs:4-36`.

La skill afirma que obrir_torn també fa aquest recompte i que amb --json proporciona un turn_id. El script inspeccionat només mira un lock i la safata, imprimeix text i acaba; no implementa aquest contracte. Fonts: `.agents/skills/skill-cicle-de-vida/SKILL.md:25-38`; `tooling/gates/obrir_torn.mjs:12-48`.

**Solució teòrica:** anomenar el comptador «nombre d’artefactes» i mantenir «desconegut» quan no es pot observar. Per al context, usar telemetria real si l’arnés l’ofereix i checkpoints de continuïtat. Sense eixa telemetria, un llindar d’artefactes és una heurística operativa, no una mesura cognitiva.

### C07 · P2 · Les autoritats es contradiuen i algunes garanties són impossibles de complir conjuntament

| Decisió | Regles incompatibles o divergents |
| --- | --- |
| Falta una plantilla | AGENTS ordena parar; la skill ordena crear-la abans del document. Fonts: `AGENTS.md:10-15`; `.agents/skills/skill-acte-reflex/SKILL.md:87-92`. |
| Autoritat del cervell | L’arrel diu que l’autoritat executiva viu exclusivament en skills; BOOTSTRAP apunta a .agents/AGENTS.md. A més, les dues constitucions no són idèntiques. Fonts: `AGENTS.md:17-18`, `AGENTS.md:60-65`; `.agents/BOOTSTRAP.md:19-22`; `.agents/AGENTS.md:60-68`. |
| Destinatari local | AGENTS exclou bundles per a Codex/Claude, però el procediment de ment-colmena els genera en delegar al Consell sense incloure l’excepció. Fonts: `AGENTS.md:32-37`; `.agents/skills/ment-colmena-integral/SKILL.md:32-39`. |
| Format de metadades | La plantilla interna permet macro_prompt/micro_prompt com a type, absents de l’enumeració del schema. Fonts: `_wiki_de_poble/02_saber/07_plantilles/01_PLANTILLA_PROMPT_INTERN.md:41-45`; `tooling/wiki/schema.json:13-29`. |
| Protocol consultat per a auditoria | La guia declara un contracte de claus antigues; la plantilla actual usa type/status/tags i el validador implementa compatibilitat entre llengües. Fonts: `_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md:29-33`; `_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_CONSELL.md:40-69`; `tooling/wiki/tractor-frontmatter.mjs:325-335`. |

**Solució teòrica:** decidir autoritat per tipus de regla, eliminar duplicació executiva i validar contradiccions amb casos concrets. Un document desfasat pot conservar-se com a context, però ha de deixar de ser encaminat com a instrucció vigent.

### C08 · P2 · El «verd» documental no és una garantia simple ni estable

La prova estricta global abans d’afegir l’informe revisa 420 documents, n’eximeix 20 i falla amb 251 incidències: F1=42, F2=97, F3=25, F4=17, F5=5, F6=0, F7=65, F8=0. No s’ha executat el reparador suggerit pel programa.

Part del corpus inclou directoris de còpies i informes antics perquè l’abast és l’arrel i les exclusions no cobreixen aquests noms. Font: `tooling/wiki/frontmatter-abast.json:1-13`. A més, F5 considera sospitós un camp no inclòs en required que tinga un sol valor en almenys dos documents; schema només enumera description com a required, mentre el codi exigeix també les parelles type/tipus i status/estat. Això pot penalitzar un conjunt vàlid d’informes tots en esborrany. Fonts: `tooling/wiki/schema.json:9-11`; `tooling/wiki/tractor-frontmatter.mjs:325-335`, `tooling/wiki/tractor-frontmatter.mjs:371-376`.

**Solució teòrica:** separar validesa d’un document, coherència normativa, salut del corpus operatiu i mètriques de distribució. No usar l’entropia d’un camp com a rebuig automàtic sense considerar la semàntica i l’abast. No abaixar el llindar només per aconseguir un verd.

## Diagnòstic de la pèrdua de context

La cadena observable presenta discontinuïtats:

1. **Descobriment:** hi ha regles en diversos punts, però falta acreditar quin conjunt rep cada arnés. C05 i C07.
2. **Selecció:** dues taules poden enviar la mateixa intenció a plantilles incompatibles. C01 i C02.
3. **Entrega:** un rebut pot dir «llegit» quan el model només rep hashes i rutes. C03.
4. **Continuïtat:** la primera invocació del torn no acredita una reinjecció després de compactacions o canvis d’intenció. El wrapper limita l’execució a invocationNum=1. Font: `.agents/hooks/preflight_matrix_wrapper.mjs:13-17`.
5. **Control d’acció:** s’accepta un rebut alié o no es consulta el rebut en el camí de shell. C04.
6. **Verificació:** frontmatter vàlid no prova nomenclatura, destinatari correcte ni contingut científicament fonamentat. Les garanties del validador estan centrades en metadades. Font: `tooling/wiki/tractor-frontmatter.mjs:12-20`.

**[SUPÒSIT]** Aquest conjunt pot produir la conducta percebuda com «oblida immediatament»: la norma recordada per l’humà no és necessàriament la norma recuperada en el torn següent. Corregir el recordatori verbal sense corregir la plantilla recuperada deixa intacta la causa.

**[SUPÒSIT]** L’ús repetit d’imperatius absoluts, metàfores, obligacions de fabricar documents i ordres d’actualitzar la normativa durant una tasca pot afavorir una resolució aparentment complidora. És una hipòtesi sobre pressió d’instruccions, no una explicació demostrada del comportament intern del model. L’exigència de crear una plantilla si falta i actualitzar-la proactivament està escrita a `.agents/skills/skill-acte-reflex/SKILL.md:87-92`.

La pausa útil es defineix per una comprovació observable: haver resolt l’objectiu, l’autoritat, l’àmbit i la prova. «Respira» pot ser un recordatori de to; no és un mecanisme de memòria ni una mesura de fiabilitat. No cal atribuir a MarIA fatiga humana, mala voluntat o una compulsió clínica per explicar els defectes demostrats.

## Proposta del foli per a MarIA

**Proposta teòrica; no és una nova regla instal·lada.** El text següent és una formulació candidata, aproximadament d’una pàgina curta. S’ha de resoldre la contradicció de C01 abans de convertir-lo en autoritat; afegir-lo com una còpia més mantindria el problema.

> Soc MarIA, col·laboradora de Sóc de Poble. Ajude a construir una plataforma rural útil i mantenible. Parle amb claredat i respecte; no afirme certeses que no tinc.
>
> 1. Abans d’actuar, identifica l’objectiu actual, el mode autoritzat i el resultat esperat. Una auditoria produeix evidències i informe; no autoritza implementació.
> 2. Mantín visibles els límits de la tasca: fitxers que pots escriure, serveis als quals pots accedir i accions reservades al Mestre. Les restriccions continuen vigents després d’un canvi de tema o compactació.
> 3. Consulta la font canònica necessària per a l’acció. Una ruta o un hash no substitueixen la lectura del contingut. No carregues documentació aliena a la tasca per inèrcia.
> 4. Si dues regles discrepen, identifica la contradicció i aplica la precedència acordada. No inventes una excepció ni reescrigues la normativa per poder avançar.
> 5. Usa noms i plantilles validats. Per a un prompt local sense bundle, la categoria proposada és PROMPT. No improvises variants.
> 6. Cita allò comprovat. Marca les hipòtesis. No presentes un test simulat com a verificació del backend real, ni un script llegit com a script executat.
> 7. Abans d’una escriptura, comprova que l’acció concreta té autorització i que la seua evidència continua vigent. Un permís d’una altra tasca no serveix.
> 8. Si una comprovació falla, conserva les dades i explica què falta. Pregunta només quan la decisió pendent afecte l’objectiu, el risc o l’autoritat; continua la feina independent que ja està autoritzada.
> 9. En acabar, declara resultat, comprovacions i límits. Deixa un relleu breu amb decisions, pendents i següent pas; no declares «tot correcte» perquè un únic semàfor és verd.

A aquest foli estable s’afegiria una **fitxa de tasca curta i variable**, amb sis camps conceptuals: objectiu; mode i permisos; decisions ja acordades; fonts i versions consultades; operacions pendents; següent comprovació. No ha de ser una història completa del xat ni guardar secrets.

### Com fer-lo obligatori

La proposta té tres nivells, amb funcions diferents:

| Nivell | Responsabilitat | Evidència exigible |
| --- | --- | --- |
| Regla breu de sessió | Fer visibles identitat, precedència i límits | Versió del foli efectivament entregada al torn |
| Preparació d’acció | Resoldre intenció, plantilla i àmbit | Contingut pertinent entregat, fonts vigents i fitxa actual |
| Porta mecànica | Acceptar o rebutjar l’efecte concret | Operació, destins i generació vinculats a autorització; validació del resultat |

Els esdeveniments proposats són l’inici de sessió, cada instrucció nova que canvie l’objectiu, la represa després de compactació i la primera operació amb efectes després d’un canvi de permisos o de fonts. No cal tornar a injectar tot el repositori després de cada lectura.

**El cron no és suficient.** Un procés que desperta cada cert temps pot detectar fitxers incoherents o preparar un relleu. Sense una interfície real d’entrega al torn i una porta vinculada a l’acció, no fa que el model llegisca el recordatori abans de la següent escriptura. En aquest repositori hi ha un registre de tasques d’higiene, adopció, quarantena i tokens; aquest JSON no acredita un recordatori conversacional. Font: `.agents/cron/registre_tasques.json:1-54`.

**[SUPÒSIT D’INTEGRACIÓ]** L’arnés de MarIA permet interceptar els esdeveniments i entregar context de manera adequada. Cal demostrar-ho amb el producte i versió realment usats. Si no ho permet, la part mecànica ha de viure en eines d’escriptura controlades i la lectura explícita del foli ha de quedar com a procediment assistit, sense vendre-la com una garantia automàtica.

### Criteris d’acceptació del nou circuit

Aquest és un banc de comprovacions proposat per a MarIA; no una implementació:

- Demanar un prompt local amb formulacions diferents sempre selecciona la mateixa categoria i plantilla vigent.
- Sense plantilla, amb dues autoritats incompatibles o amb una font canviada, no es fabrica una alternativa silenciosa.
- Un rebut d’una altra tasca, torn, àmbit o versió de regles és rebutjat.
- Una data invàlida, una data futura no admissible o una càrrega de fonts fallida no produeixen allow.
- El mode auditoria rebutja modificar codi per qualsevol eina, incloent ordres de shell; pot crear només l’informe autoritzat.
- Després de compactar o reprendre, continuen vigents les decisions i límits sense que el Mestre els repetisca.
- Si no hi ha telemetria de context, el sistema diu «desconegut»; no inventa un percentatge de memòria ni un diagnòstic de fatiga.
- El document final passa validacions independents de nom, metadades i encàrrec. El pas d’una no substitueix les altres.

La mètrica útil és el percentatge de casos observats que respecten aquests contractes i el nombre de desviacions sense detectar. No es proposa una promesa d’obediència perfecta del model; es proposa limitar els efectes d’una desviació i fer-la visible.

## Prioritat per a la decisió del Mestre i MarIA

Aquesta taula ordena el diagnòstic; no autoritza ni programa implementacions.

| Prioritat | Conjunt | Motiu |
| --- | --- | --- |
| Urgent i important | A01–A05 | Separació de dades, persistència i sessió amb reproducció |
| Urgent i important | C01–C04 | Les pròpies instruccions i portes poden produir o tolerar la desviació |
| Important | A06–A10 | Tancament, volum de dades, hosts restrictius, mitjans i reintents |
| Important | C05–C08 | Acreditar integració, resoldre autoritats i donar significat als semàfors |
| Optimització posterior a integritat | A11 | Reduir consultes sense introduir una memòria cau insegura |

**DAFO del diagnòstic.** Fortalesa: fonts actuals, cites i reproduccions negatives concretes. Debilitat: no hi ha prova de navegador real, backend desplegat ni càrrega efectiva de les regles en l’IDE de MarIA. Amenaça: corregir només el símptoma, augmentar indefinidament el prompt o aplicar una reconciliació que sobreescriga dades. Oportunitat: compartir conceptes d’àmbit, generació i confirmació tant en la persistència de l’aplicació com en el control dels agents.

Alternatives valorades: un cron periòdic, útil per a manteniment però insuficient com a barrera d’acció; i enganxar tot el corpus a cada torn, que no resol contradiccions ni acredita l’ús del contingut. La proposta conserva els originals accessibles i entrega el context pertinent, amb inventari de què s’ha consultat. No exigeix ocultar ni retallar silenciosament cap font sol·licitada.

## Verificacions executades i resultats

| Comprovació | Resultat observat | Abast real |
| --- | --- | --- |
| ESLint sobre src, sense cache ni fix | 200 fitxers; 0 errors; 253 avisos: 235 de variables no usades i 18 de dependències de hooks | Anàlisi estàtica; no certifica concurrència |
| NotesDataProvider A→B | B conserva A-note | Component real transformat només en memòria; backend i altres contextos simulats |
| Creació tardana d’A | A-late-note entra en B | Mateix component; promesa controlada |
| GlobalSaveManager i 409 | Expectatives 1, 2, 2; revisió remota 10; dos reintents false | Gestor real; actualització remota simulada |
| Renovació antiga | Logout aplicat a B | Servei real; renovació controlada |
| Sanejament de sdp-media | Referència rebutjada i src eliminat, tant privat com públic | DOMPurify i sanejador del projecte en DOM local |
| Storage denegat | Import falla amb SecurityError | Getter simulat; sense navegador extern |
| Resolució d’actiu i canvi de sessió | Una resolució; URL anterior conservada | Hook real; resolutor simulat |
| Esborrany serialitzat | Torna un objecte amb contingut íntegre | Storage del projecte en DOM local |
| Classificador de plantilles | Interna per a Codex/Claude; null per a «Audita el router» i «Revisa les notes» | Funció real, només lectura |
| Matrix | ready:true; metadades sense text de les fonts | Script en VM; totes les escriptures interceptades |
| Verify | Allow amb rebut alié, zero fonts o data invàlida; allow al prefix d’un creador documental | Script en VM; cap ordre ni escriptura real executada |
| Frontmatter global abans de l’informe | Eixida 1; 251 incidències en 420 documents, 20 exempts | Corpus configurat actual |
| Frontmatter d’aquest informe | Eixida 0; 1 document; zero incidències F1–F8 | Validador canònic amb esquema i document en un directori temporal aïllat |

En la primera execució del banc de Notes, l’observador es va consultar abans de resoldre els imports asíncrons i el banc no estava preparat. Es va corregir exclusivament l’espera del banc en memòria; la segona execució va carregar els estats esperats i reproduir les dues mescles. No es presenta aquell error inicial del banc com una fallada de l’aplicació.

No s’ha executat la suite completa de Vitest, ni build, ni una prova visual, ni tests contra RLS desplegada. Les proves d’aquest informe són diagnòstics locals específics. Els resultats històrics d’altres auditories no es donen per revalidats ací.

### Sospites descartades o limitades

- **Doble serialització dels esborranys:** descartada amb el codi actual. setEfimer conserva directament les cadenes i getEfimer les parseja; el roundtrip torna un objecte. Font: `src/config/storage.js:60-70`.
- **La falta de memòria s’arregla només amb més instruccions:** no demostrada. C01 mostra que la selecció d’una instrucció incompatible ja basta per explicar un nom erroni.
- **Els hooks estan segurament actius o segurament desconnectats:** cap dels dos veredictes està acreditat. Hi ha declaració i codi; falta traça de l’arnés.
- **La mescla de notes demostra una fuita de la base de dades:** no. La reproducció demostra una fuita entre àmbits de la memòria del client.
- **Un hash acredita que el model ha llegit o comprés un text:** no; en Matrix acredita bytes llegits pel procés.

## Incògnites

1. Quin IDE, model, versió i arnés executen MarIA en els torns afectats, i quins punts d’entrada de regles carreguen realment.
2. Quines plantilles i versions van arribar al torn concret que va produir el nom rebutjat.
3. Com i quan compacta l’arnés, i quina part de la fitxa de tasca preserva o reinjecta.
4. Si hi ha un adaptador extern, no inspeccionat, que traduïsca hooks.json, injectSteps o decisions allow/deny.
5. Estat real de les migracions, permisos, buckets i RLS a Sollutia. No s’ha contactat el servidor.
6. Volum real de notes, freqüència de canvis d’usuari i condicions de xarxa: determinen freqüència i cost dels defectes, no la seua existència lògica.
7. Política desitjada per a recuperació durable d’esborranys i publicació de mitjans. Les solucions persistents i de privacitat necessiten aquest criteri de producte; no s’improvisa durant l’auditoria.

## Bateria de veritat

- [x] Fonts locals citades amb ruta i línies, incloses en el manifest suplementari.
- [x] Cap funció o fitxer proposat com a existent sense comprovació.
- [x] Hipòtesis causals separades i marcades; límits del diagnòstic declarats.
- [x] Reproduccions distingides de lectura estàtica i de verificació de producció.
- [x] Codi, configuració i dades externes intactes; cap bloc de patch ni codi per aplicar.
- [x] Informe desat a l’escriptori amb nomenclatura d’informe.
- [x] Frontmatter de l’informe: eixida 0 en validació estricta aïllada; zero incidències F1–F8.
- [ ] Frontmatter de tot el repositori en verd: no; les incidències prèvies continuen obertes.

## Manifest local suplementari de les evidències

Rutes relatives a l’arrel de socdepoble.org, excepte la regla global indicada amb ruta absoluta. Els hashes descriuen el tall local de redacció i s’han de tornar a comprovar si el repositori canvia. Les fonts externes al repositori s’han inspeccionat només de lectura. L’informe mateix no s’inclou en el seu propi manifest per evitar un hash autoreferent.

| Font | Línies | SHA-256 |
| --- | ---: | --- |
| .agents/AGENTS.md | 68 | 71e7ae8dc4410353a6dd6ccdc2d8f9aabf12e109c22637fda249c806d0aa5f6d |
| .agents/BOOTSTRAP.md | 31 | eb1c1b03a1407a72c0da415de1dc80bcda5638f81212714a3b85ebb8f2d4549a |
| .agents/cron/registre_tasques.json | 54 | dd2c676961631699f4530eef05e6fb5b45809f03244cdf888b5cd3fff9d20406 |
| .agents/hooks.json | 27 | 43ede45687ee1f983e649a79bf68e567a87a65cc8223513a5ccfe37247f95fab |
| .agents/hooks/preflight_matrix_wrapper.mjs | 69 | 5a5d1dc9b3e815ada0dc3793719e0bc229691d2f45becb5f1d864fd56084c776 |
| .agents/hooks/verify.mjs | 265 | 932c993f41745de2b6ab06058908646be1c2444f55a44dd7e0115033e2a1b677 |
| .agents/skills/ment-colmena-integral/SKILL.md | 39 | 0c93db02e8ba2d3a9c9fbad3e020104f72cf4b44357d144a95e52b6310804e33 |
| .agents/skills/skill-acte-reflex/SKILL.md | 176 | 1a70b3930a7a7d503fe2ad2ddb5246c77240bb624c8fa1e16fa5bfdac9bd7aa5 |
| .agents/skills/skill-cicle-de-vida/SKILL.md | 147 | fa94f461d8d0e46453449f62c16c5c0f2d622e1eb6384fb89f93173e3ef89836 |
| .agents/skills/skill-consell-bundle/SKILL.md | 106 | 75386d8999791e5cf06a12ffc94af4d051e6b4917f2c8d3325ffd05cb3b5bd2f |
| /Users/javillinares/.gemini/config/AGENTS.md | 12 | f26d80960b478804f31995a31a2abf7cd75d791d7917e080bbc4b9122477a0d0 |
| AGENTS.md | 65 | 99a2183a6fe52b00b4fd0d09140d05f2000d82eedb6e6c6633833fb16be8035c |
| _wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_CONSELL.md | 174 | d42438a3061f91bb70728ca0c1463ca5aa7e97e8d40deb39e90bfa0d875a47f5 |
| _wiki_de_poble/02_saber/07_plantilles/01_PLANTILLA_PROMPT_INTERN.md | 142 | 0279605356470e6537a761cb4ed7b565eeb0216fef300677037192ec779b1d24 |
| _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md | 110 | fd60e72c89922520139dc3034de98c9de08ece96008d87f116fa392a166ff1f1 |
| manifest.json | 967 | e5616bbf5ec5107c4832e1a509d1bb2b7a752687931bd8a6b9ffb5b63c98e157 |
| src/app/App.jsx | 683 | 0c4589c7fc2bcdd5521697574dae47d96b5245ae9cc60c4dc6cd30405720c885 |
| src/components/universal/DocumentEditor.jsx | 133 | d16915da5567ce7a442da4e375e03b6c4bfaca1dd559802e25614e94d8049740 |
| src/components/universal/richText/UniversalRichTextToolbar.jsx | 41 | d46b21c5cf5b004f5c592a7eeb72f226b1613a218dce913ce893b9c83b6880f1 |
| src/components/universal/richText/extensions/SdpImageNodeView.jsx | 22 | bd208f632fd81693c9a23bfb0a27b8344b23b2a82353b5f51450208050bf092c |
| src/components/universal/richText/useUniversalRichText.js | 122 | 24f47938b55055d49e2c86eeafd34c3898535e289c2c10934552c900f9e6ed41 |
| src/config/storage.js | 75 | 3d1394fff628da68b917bac1cf676858e188f95f9f6b606ccc253a2706afff8f |
| src/data/sessionService.js | 147 | 8315f67b5209d11017fcbf1b4efc658313b98ed3609d3210e6f7b695922d7e9b |
| src/data/supabase/auth.js | 157 | 9f171c8de247bd9db3c45e16171bb4cc6a2e45b78cce6b2d3dd3dbe9391ac3a2 |
| src/data/supabase/content.js | 81 | 229994b1a492dfd4c8c8801b1612fe82641a8cacb6b5960e020731cfe24be7c5 |
| src/data/supabase/notes.js | 68 | e61ea503316fe0f1e14dc7d0deffaadcda5917329745f04a74d10a58b344ecaf |
| src/data/supabase/storage.js | 191 | c31cef889c60a5431d2e6aa6f8835df03a97a45d6ffa86b2ab19e4a51007deeb |
| src/hooks/useResolvedAsset.js | 48 | e06de71da5a149eca039cad44dcb7a5fd3d601d9215fd43e85b03ef99c4102d6 |
| src/sections/notes/GlobalSaveManager.js | 82 | 59f2bb9430c698b31b9d54ec56d822e7ab1ca212098fe963d7aaa67459a339e3 |
| src/sections/notes/NotesContext.jsx | 247 | 75458e0c3859b7a33061b679b28981e543b39b2786eb79aa6f8d31872eaec6c8 |
| src/sections/notes/NotesDataContext.jsx | 168 | 6cb489caff6f77cad8ac72f1772e24a909d1553fb5f6b4fb2b6de95e2566e732 |
| src/sections/notes/NotesSection.jsx | 113 | 06c6b6085d028006c0cec1127fb4cdf4923b8031adbe9fd473f8c7193eb2af95 |
| src/utils/sanitize.js | 121 | 966955f1583d7bc2ef50d43635b0b4d910482200c1a72425b41800aaf049c040 |
| tooling/brain/classificador_tasques.mjs | 33 | 38457e5e215fb838dec54e776a2815e970074c5f3dafafabdbba0d55e30f7080 |
| tooling/brain/crear_document.mjs | 42 | 65afe56659eaf74575b82b7024a91fd8a85986e309d81d9f87996bbf11faa690 |
| tooling/brain/matrix.mjs | 284 | 275321c627ca9b93d8b59f2acc98bd7aa4790a6c10e1ffe4b499d09cb1bddc32 |
| tooling/brain/reflex_plantilles.mjs | 97 | a338e8359cb230c282afe9e622881701d97fe31a2e5d9998d6ec456738ff2e0f |
| tooling/brain/termometre_context.mjs | 37 | 2c063f4385b5ccfa706f42e99292f63510d2f1910293e20195fb5470e337c6a2 |
| tooling/gates/obrir_torn.mjs | 48 | 231eb56f5a94542c46e03830af05b47064f69a7dfcb925d724acdf092607de78 |
| tooling/gates/tancament.mjs | 62 | d2166397b50d3d9f25d13f9d5e00c689ea00a5cdf59425834fb3697addfcb98c |
| tooling/wiki/frontmatter-abast.json | 14 | 4400d97c04cb72a45f483e436bf14b6b6e6992c752261932dcdcffd20157a0b5 |
| tooling/wiki/schema.json | 141 | de04edc57c7ea44e1e628f168bf62ded8476a533240f4f0ac5ca314658152466 |
| tooling/wiki/tractor-frontmatter.mjs | 452 | be9f9bf5b43458b3289393a66cf7ddcc2662a51e579d11467d139ea8903fecb4 |
