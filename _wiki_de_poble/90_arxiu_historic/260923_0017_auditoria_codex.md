---
type: informe
status: esborrany
description: Auditoria arquitectònica de Notes, Wiki i Disseny amb diagnòstic dels fantasmes, contracte unificat i esmenes al pla de MarIA.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_16bdcf0c-b12e-4623-85de-dfd6d74cb0f9:586e81eb-272e-4356-86b0-a8f386110753
---
# Auditoria: UniversalWorkspace, creació i portades

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_16bdcf0c-b12e-4623-85de-dfd6d74cb0f9:586e81eb-272e-4356-86b0-a8f386110753 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T22:18:29.636Z |
| Modificació | 2026-09-22T22:18:29.636Z |
| Propietari | Codex |
| Aprovació humana | Auditoria autoritzada per l’usuari; implementació fora d’este torn |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 6e8b597112b9b7960b3d5c4750e3fd71716887639bd9fe111ea6b89dfa27c1be. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-23, hora local Europe/Madrid: auditoria del worktree, reproducció en localhost:3340, revisió del pla 0010 i entrega documental sense modificar codi de producte.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen

Cal separar **documents, vistes de sistema i esborranys**, conservant un únic Workspace per a navegació i disposició visual. Recomane props explícites per a les portades i el graf, i un controlador compartit de creació amb adaptadors per secció. No recomane seed per a representar accions o pantalles.

El símptoma de Notes està confirmat, però no he demostrat que una línia `ghostItem` haja sigut esborrada recentment: el títol de reserva «Sense títol» continua present. El problema observable és l’absència d’una entitat provisional abans de la resposta remota, junt amb contractes desconnectats entre providers. L’informe distingix estes causes de les hipòtesis històriques del prompt.

### F1 · P1 · La creació depén del servidor i no té estat provisional

**Fonts:** `src/sections/notes/NotesSection.jsx:101,127,136`; `src/sections/notes/NotesDataContext.jsx:386,393`; `src/components/universal/workspace/UniversalWorkspace.jsx:417,427,430`; `src/data/supabase/notes.js`, funció `createNote`.

La cadena és `clic → onCreate → await creaNota → await apiCreateNote → setData → notes.map → requestItem`. Abans de l’alta confirmada només canvia el booleà `creating`; no existix cap element que la llista puga pintar. `pendingItemId` és una espera de selecció **posterior** al resultat, no un esborrany. `Sense títol` és un fallback de presentació (`NotesSection:37`), no una ordre de creació.

**Reproducció executada:** en `/notes`, perfil Foraster, obrir NOTES i prémer CREAR NOTA: apareix «Cal iniciar sessió per crear una nota.» i es manté «No hi ha notes.». No s’ha creat cap nota de prova remota. Amb xarxa lenta, per lectura de la cadena async, tampoc hi haurà targeta abans del resultat. Amb sessió i alta correcta, el provider sí incorpora la resposta: la prova existent ho confirma amb backend simulat.

**Impacte:** falla l’expectativa central del prompt de començar a escriure immediatament. **Correcció:** `beginDraft` síncron amb ID local estable, fila i editor immediats; persistència separada, explícitament pendent/error/guardada. No afegir una fila decorativa sense connectar-la a l’editor. `NotesContext.jsx:144` deriva notes només de `rawNotes`, així que un override local aïllat tampoc crea una nota nova.

**Història verificada:** `b8f0ee3a` ja introduïa el Workspace amb `await creaNota`; el seu predecessor `UniversalManager` també esperava `creaNota`. `63f81d95` manté l’espera al backend abans d’inserir. Les cerques Git acotades no identifiquen una eliminació explícita de `ghost`. No atribuir la regressió a eixos commits sense una versió bona reproduïble.

### F2 · P1 · NotesContext talla el contracte de resolució i d’aïllament

**Fonts:** `NotesDataContext.jsx:422–446`; `NotesContext.jsx:52,252–269`; `NotesSection.jsx:57,82–84`; `WorkspaceContext.jsx:17–18,193`.

El provider de dades exposa `notesComplete`, `resolveNote` i `workspaceKey`, però `NotesContext` ni els recull ni els retorna. `NotesSection` els desestructura del segon context i rep `undefined`. Conseqüència: el Workspace tracta la llista com parcial sense resolvedor i perd la clau de remuntatge per actor/tenant/generació. Una URL d’una nota fora de la pàgina carregada no pot resoldre’s; l’estat de navegació pot sobreviure al canvi de sessió. Açò no prova per si sol una filtració de dades: el provider inferior conserva les seues barreres de token.

**Correcció prèvia al redisseny:** transmetre els tres camps amb les dependències del memo i una prova que munte la cadena real `NotesDataProvider → NotesProvider → NotesSection`. Mantindre les proteccions de respostes tardanes. Font de veritat: el contracte ja declarat pels dos extrems, no un requisit nou.

### F3 · P1 · Crear a Wiki i Disseny requerix una via d’escriptura real

**Fonts:** `WikiDePobleSection.jsx:238–303`; `DesignSection.jsx:58–104`; `UniversalWorkspace.jsx:494`; imports `wikiManifest`, `CATALOG_ITEMS`, `CATALOG_DETAIL_LOADERS`.

Les dues seccions no passen `onCreate`; el botó queda desactivat. Confirmat en navegador en `/wikidepoble` i `/disseny`. La font de Wiki és un manifest compilat, i la de Disseny un catàleg de codi amb loaders. Un nou `onCreate={() => ...}` no pot escriure estos fitxers des d’una app web desplegada. Font de veritat: requisit del prompt de crear articles en totes les seccions.

**Correcció proposada:** totes tres seccions obrin un esborrany; cada adaptador valida el domini i persistix per un port de backend. Wiki/Disseny necessiten un contracte d’articles autorats (secció, autor, tenant, categoria, contingut, revisió, estat de publicació). Conservar els manifests com a contingut incorporat i compondre’ls amb articles remots, amb identitats sense col·lisió i procedència explícita. És una proposta de contracte, no una API existent certificada.

Un article nou de Disseny és documentació, no un mòdul JSX executable: generar un component i incorporar-lo a `detailRegistry` continua requerint treball de codi. Crear un article no modifica automàticament la BIOS, les skills ni la Wiki local. Si es vol editar també els fitxers canònics de Git des de la UI, caldrà un flux de revisió/importació separat; no doble escriptura implícita.

### F4 · P2 · Portades i eines compartixen indegudament el canal documental

**Fonts:** `WikiDePobleSection.jsx:249–288`; `DesignSection.jsx:62–74`; `workspaceState.js:185` i següents (filtratge).

`__intro` i `obrir_graf` entren en `items`, amb carpetes artificials `brain` o `fonaments`. No és un error sintàctic del normalitzador: tenen els camps mínims necessaris. És un problema semàntic: les vistes participen en cerca, filtres, selecció de primer element i categorització com si foren documents. Una portada de secció desapareix en altres categories o davant un filtre. Retirar-les sense introduir una selecció de vista també trencaria els seus enllaços actuals.

**Correcció:** `views` (o `headerItems` tipat com a vista) fora de `model.items`; accessos visibles en un bloc propi de la columna central, sense comptar documents ni requerir categories. No aplicar filtres documentals a eixos accessos. Selecció discriminada de document/vista/esborrany i compatibilitat de les URL antigues.

**Carpetes:** el compilador `compile-wiki-to-app.mjs:88–104,130` deriva l’arbre de la ruta física. El codi revisat no prova que les portades obligaren a moure fitxers. No avale «traure els documents de les subcarpetes» com a part del fix: preserveu les rutes, IDs de carpeta i enllaços. Una projecció visual més plana pot fer-se en l’adaptador, sense migrar el disc ni alterar la frontera pública/privada.

### F5 · P2 · El detall del graf no rep el callback per obrir documents

**Fonts:** `WikiDePobleSection.jsx:114–117,302`; `UniversalWorkspace.jsx:601–607`.

Wiki desestructura `onSelectionChange` de l’argument de `renderDetail`, però el Workspace només hi entrega `item` i `selection`. La guarda del graf comprova el callback absent i no navega. El problema és de connexió entre components; canviar els arrays no el resol.

**Correcció mínima possible en una implementació futura:** capturar el callback de la secció en el closure. **Contracte unificat recomanat:** entregar `actions.openDocument(id)` als renderers, utilitzant el mateix canal de selecció i URL que la llista. No escriure directament estat del router des de cada widget.

### F6 · P2 · Absència, càrrega i portada es confonen

**Fonts:** `WikiDePobleSection.jsx:85`; `DesignSection.jsx:17`; `WorkspaceContext.jsx:257–285`; `UniversalWorkspace.jsx:593–608`.

Els manifests estàtics no declaren `itemsComplete: true` ni tenen resolvedor. Un ID desconegut queda com a resolució fallida en el context. Però `DetailColumn` no passa `itemResolution` al renderer i `item === null` es converteix en portada. Així una URL invàlida i una portada legítima mostren el mateix contingut.

**Correcció:** els catàlegs complets han de declarar-se complets; passar estats explícits de resolució (`loading`, `not-found`, `error`) i acció de reintent. Una portada és una vista seleccionada, no el fallback de qualsevol error. Amb documents remots paginats, el model global torna a ser parcial i requerix resolvedor per origen.

### F7 · P2 · La creació pot quedar oculta pels filtres existents

**Fonts:** `UniversalWorkspace.jsx:427–430`; `WorkspaceContext.jsx:requestItem`; `workspaceState.js:filterWorkspaceItems`.

`requestItem` selecciona l’ID però conserva query i etiquetes. Una nota nova sense text no encaixa amb una cerca activa; encara que l’alta haja funcionat, la targeta no apareix en `filteredItems`. És una conseqüència determinista del codi, no una alta autenticada reproduïda en esta sessió.

**Correcció:** fixar el draft actiu en una zona «En edició» fora dels filtres; en confirmar, revelar el document i netejar els filtres que l’amaguen amb una política explícita. No duplicar la nota entre la fila provisional i la definitiva.

### Referència visual aportada pel Mestre durant l’auditoria

La captura `Captura de pantalla 2026-09-23 a las 0.18.36.png` concreta el resultat: barra amb cerca i CREAR NOTA, targeta de benvinguda «Bloc de notes» i una fila «Sense títol» amb data dins de la mateixa columna central. No demana un modal ni una nova disposició visual. La captura mostra l’aspecte desitjat; no prova quin codi històric el produïa.

**Criteri d’acceptació refinat:** un clic crea immediatament una fila amb la mateixa anatomia de les notes i obri el seu editor. La benvinguda es conserva; la fila de draft pot situar-se davall d’ella, com a la captura. En començar a escriure, el títol de la fila s’actualitza sense perdre la selecció. Si el guardat falla, la fila i el text continuen disponibles, amb un indicador discret de pendent/error. No s’ha de copiar la data històrica de la captura.

La separació entre `views`, `drafts` i `items` és interna: **no obliga a crear tres llistes visuals**. El Workspace pot compondre-les en la mateixa columna, amb les targetes existents. La zona «En edició» proposada és una política de visibilitat davant filtres, no una obligació d’afegir una capçalera ni canviar l’estètica.

### Arquitectura proposada (contracte per consensuar, no codi implementat)

```text
NotesSection / WikiSection / DesignSection
  ├─ adaptador de contingut: items + categories + completesa + resolució
  ├─ adaptador d’edició: beginDraft / persistDraft / discardDraft
  ├─ vistes de sistema: intro, brain (segons la secció)
  └─ UniversalWorkspace
       ├─ WorkspaceProvider: selecció, filtres, navegació i resolució
       ├─ controlador compartit de drafts: transicions i estat visible
       └─ renderers: document / vista / esborrany / error
```

| Canal | Responsabilitat | Invariant |
| --- | --- | --- |
| `model.items` | Documents persistits o incorporats al catàleg | Cada ID identifica contingut real; mai una acció de sistema |
| `views` | Portada i eines amb ID i renderer | No entren en cerca, categories ni recompte documental |
| `drafts` | Contingut autorat encara no confirmat | Propietari únic; visibles i diferenciats de «guardat» |
| `selection.target` | `{kind: document|view|draft, id}` o null | Una sola selecció activa; el detall es deriva de la selecció |
| `actions` | Crear, obrir document/vista, reintentar, descartar | Tots els renderers usen el mateix canal |
| `capabilities` | Crear esborrany, guardar, editar, publicar | La creació accessible no concedix permisos de servidor |

La UI no ha d’endevinar la secció a partir de la ruta o d’IDs especials. El domini el declara l’adaptador. Es pot mantindre `onCreate` com a compatibilitat durant la migració; no cal substituir tot el motor alhora. `views` és preferible a un `headerItems` de tipus documental; un simple `renderIntroCard` és insuficient perquè no resol selecció, URL ni graf.

**Propietat del draft:** un hook/controlador compartit, instanciat per workspace i controlat per l’adaptador, conserva el contingut i la transacció. El Workspace projecta eixe estat sense una segona còpia editable. `NotesEditor`/`DocumentEditor` han de rebre un document i un adaptador de guardat; no poden enviar un PATCH amb revisió a un ID provisional que encara no existix al servidor.

**Cicle proposat:** `beginDraft → editing → saving → persisted`; davant error, `saving → error → retry`. El draft buit es veu com «Sense títol» fins i tot sense títol; escriure’n un no implica haver-lo guardat. Un error conserva el text i la fila amb reintent. Un segon clic recupera el draft buit vigent en lloc de crear duplicats. Descartar recupera l’última selecció vàlida; si té contingut, cal protegir-lo d’una pèrdua accidental.

**Carreres i persistència:** assignar UUID de transacció abans del POST i reutilitzar-lo en reintents (l’adaptador Notes ja admet `input.id`, però això no resol per si sol una resposta perduda: recuperar per ID abans de repetir un INSERT). Confirmació atòmica draft→document: actualitzar col·lecció, selecció i URL; conservar edits posteriors al snapshot enviat. Respostes d’una sessió/tenant antic no entren al nou workspace. Navegar mentres es guarda no ha de robar després el focus. Un cancel·lar visual no equival a cancel·lar un POST ja acceptat.

**Sense sessió:** CREAR inicia un esborrany de memòria, clarament no guardat; guardar necessita sessió i capacitat. No presentar un localStorage com a base autoritativa ni publicar contingut anònim. Per traspassar el draft després del login, definir adopció explícita al nou actor; mai arrossegar automàticament drafts d’un altre usuari. Si es vol recuperació després de recarregar, usar la infraestructura asíncrona de drafts amb scope i estat d’alta, després de revisar-ne l’aïllament; no és un requisit completat ací.

**URL:** suportar vista (`view=intro|brain`), document (`nota`/`item` existents) i draft amb identitat de sessió. Un draft efímer que ja no existix ha de mostrar «Esborrany no disponible», no una nota diferent. Migrar `item=__intro` i `item=obrir_graf` amb `replace`; selecció manual amb `push`, reconciliació amb `replace`. Preservar paràmetres aliens. L’efecte de Notes que força `n1` quan falta `nota` ha de respectar les seleccions de vista/draft.

**Persistència per domini:** Notes manté el port existent. Wiki i Disseny afegixen articles via adaptadors nous després de concretar contracte backend i permisos; cap recompilació del manifest com a mecanisme de guardat web. Els articles són privats/esborranys per defecte i la publicació és una acció diferenciada. El contingut escrit no és HTML o codi executable sense el tractament de seguretat corresponent.

**Alternatives descartades:** (1) posar portades/graf al seed: trasllada el mateix acoblament al magatzem i obliga a excepcions en cerca/CRUD; (2) tres workspaces independents: replica les carreres i filtres; (3) afegir només una prop visual de portada: no tanca el cicle d’edició ni de selecció. A sis mesos, un controlador amb proves de transicions i tres adaptadors petits és més mantenible que IDs màgics dispersos.

### Rèplica al pla de MarIA 0010 i seqüència de treball

- **A, acord amb esmena:** props explícites, però cal `views` amb selecció i renderer; no només «pintar targetes al capdamunt».
- **B, esmena necessària:** el ghost és un draft real d’edició, no desapareix quan es posa títol; es transforma només després de confirmar persistència. Primer corregir F2.
- **C, acord parcial:** retirar els sentinelles dels items. Rebutge la migració de carpetes sense proves de causalitat i inventari de rutes.
- **Omissió principal:** especificar on es guarden articles de Wiki/Disseny. El botó habilitat sense backend no satisfà el requisit.

Ordre proposat: (1) contracte i proves d’integració de F2/F5/F6; (2) vistes i compatibilitat URL; (3) controlador de draft en Notes; (4) adaptadors de contingut autorat Wiki/Disseny i prova de persistència; (5) matriu de regressió i validació humana del resultat visual. Sense canvis de fonts fins al consens que demana el prompt. `requires_human_decision: false` per a esta proposta tècnica; el consens de les altres auditores encara no està acreditat.

S’ha llegit també `260923_0016_auditoria_claude.md`: en el moment de consulta era un esborrany amb troballes pendents i un altre abast (al·lucinació visual). No és una aprovació d’esta arquitectura. No invente una reunió finalitzada ni una resposta de MarIA.

### Millores al prompt/plantilla

1. Separar símptoma observat i causa suposada; demanar commit bo, pas exacte, sessió i mode de dades. No donar per fet que «s’ha perdut codi» o que les carpetes són conseqüència de les portades.
2. Definir «crear»: obrir esborrany, persistir i publicar són tres operacions diferents; especificar quina està permesa a Foraster i a cada rol.
3. Fixar un tall de fonts (HEAD més hashes del worktree), perquè hi ha molts canvis sense commit i treball concurrent.
4. Donar un criteri finit de consens: auditoria rebuda, objeccions resoltes al pla, responsable que consolida; l’absència d’una resposta no implica acord.
5. Separar nom del fitxer (`auditoria`) del tipus del frontmatter (`informe` segons ruta canònica) i alinear versions: el prompt declara 2.1.0 mentre `protocolledge` anuncia 2.0.0 per a prompt.local.
6. Afegir proves obligatòries d’integració per a creació i URL, i evitar que una tasca acotada es convertisca en migració del disc o redisseny visual no demanat.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Executat:** `./node_modules/.bin/vitest run src/components/universal/workspace src/sections/notes/NotesDataContext.test.jsx` → 4 fitxers, 11 proves correctes. Cobrixen arbre de carpetes, reducer, renderització i alta confirmada amb backend simulat. No proven la cadena NotesContext completa, un draft immediat, el clic de graf dins de Wiki ni escriptura de Wiki/Disseny.

**Navegador:** servidor existent `http://localhost:3340`; Notes sense sessió mostra error d’autenticació i cap fila nova. Wiki i Disseny mostren CREAR desactivat. No s’ha fet login, publicat dades ni creat contingut remot.

**Matriu d’acceptació per a la implementació:**

| Cas | Resultat exigible |
| --- | --- |
| Crear en cadascuna de les tres seccions | Fila Sense títol i editor visibles abans de cap resposta de xarxa |
| Xarxa lenta/error/401 | Draft conservat; estat no guardat i reintent o connexió explícits |
| Doble clic/reintent després de timeout | Un únic document, cap duplicat |
| Escriure mentres arriba l’alta | Cap pèrdua dels caràcters posteriors al snapshot |
| Canviar nota/carpeta mentres es guarda | La resposta no roba selecció ni focus |
| Canviar usuari/tenant i tornar | Cap resolució ni draft de l’altre scope |
| Cerca i tags actius | Draft visible; confirmació revela la fila definitiva |
| Portada/graf en qualsevol carpeta | No altera carpetes, recomptes ni dades documentals |
| Obrir document des del graf | Mateixa selecció, URL i detall que des de la llista |
| URL antiga, invàlida, enrere/endavant | Traducció compatible o error explícit; cap fallback silenciós |
| Recarregar article guardat Wiki/Disseny | Continua existint amb permisos i revisió correctes |
| Vista mòbil i teclat | Crear obri l’editor, focus útil i retorn a la llista |

**Tall auditat:** HEAD `6423590ed5cdb5408794f88acb157fc6d215c1c0` més el worktree existent. No és un repositori net. Empremtes SHA-256 de les fonts principals en el moment d’entrega:

- `src/components/universal/workspace/UniversalWorkspace.jsx`: `d4a2db8e454d5a67bb88022ca4d402402ccc4cb2168e799ea110ca029fdfce0c`.
- `src/components/universal/workspace/WorkspaceContext.jsx`: `51c2dd23a489f0df84391ab2e8fba59acc1cac95401d98962b1d6dbe8ef918dd`.
- `src/components/universal/workspace/workspaceState.js`: `00a109bd73ed7e3e9d2ebf5a5996fd628b7c1f5eebe23507dc40b34e30a597f6`.
- `src/sections/notes/NotesSection.jsx`: `bd1fc8c5fc4a90a26dce8b9c9ae3dc29c2d7786db924dcc32ef8ed873ddc334d`.
- `src/sections/notes/NotesContext.jsx`: `ca64ae477101f09df2299acda28a36e247c461c7feb4f2450f6be8ca9ece2dd6`.
- `src/sections/notes/NotesDataContext.jsx`: `9743216282ccd23719eb9c44043f5366bef13c33622422dba4e30163e4eddd71`.
- `src/sections/wiki-de-poble/WikiDePobleSection.jsx`: `54c9f9bb5b844adb53664d4f37293d786c9c9b11db6820ac4a81cba38a1c2bbd`.
- `src/sections/disseny/DesignSection.jsx`: `b331a507385f681f9f99139c21b9490acbafeb141d14b4b473c7b1de390b7f53`.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

Auditoria arquitectònica i documental: no implementa els canvis ni certifica el backend real, RLS, l’autoguardat autenticat o la persistència d’articles nous. Les troballes de connexió són evidència estàtica directa; els casos no executats estan marcats com a proves futures. No s’ha llegit el contingut de l’arxiu històric ni secrets.

Validació individual `document.mjs check`: correcta. Tancament executat en mode lectura: no vàlid. Passen plantilles, autoritat i catàleg de skills; fallen signatura del LEDGER, segell de regles, enllaços de la Wiki i ancoratges SCC. A més, este torn no té pla vinculat ni relleu al LEDGER: el pla existent de MarIA no té frontmatter, així que no s’ha presentat com a pla validat. Estos requisits documentals queden pendents; no són errors del nou informe ni un consens tècnic. No s’ha resegellat governança aliena per convertir el resultat en verd. Acta Marmota de jornada pendent, sense condicionar l’entrega d’esta auditoria.


<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

- [[260923_0005_prompt_auditoria_codex]]
- [[260923_0010_pla_implementacio_universal_workspace]]
- [[260923_0016_auditoria_claude]]

Referències primàries consultades: [React: estructura de l’estat](https://react.dev/learn/choosing-the-state-structure) i [React: propietari compartit de l’estat](https://react.dev/learn/sharing-state-between-components). Sustenten evitar estat duplicat i establir-ne un propietari; la proposta específica anterior és una inferència d’esta auditoria sobre el codi local.

**Ancoratge de Seguretat:** [[00_index_escriptori]].
