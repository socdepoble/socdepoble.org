---
type: informe
status: esborrany
description: Auditoria passiva del Workspace, seleccions asíncrones, graella, miniatures i preparació per a dades reals.
tags:
  - arquitectura
  - disseny
---

# 260921_0215_INFORME_auditoria_extrema_Codex.md

## Registre

| Camp | Valor |
| --- | --- |
| Encàrrec | SDP-PROMPT-260921, auditoria extrema del Workspace |
| Auditor | Codex |
| Data | 21 de setembre de 2026, Europe/Madrid |
| Entorn | Repositori local socdepoble.org, arbre de treball amb canvis previs |
| HEAD de referència | c5deb0e7a7232cab32985b3061942a8f143f149d |
| Font efectiva | Fitxers presents al disc; no sols el commit HEAD |
| Aprovació humana | pendent |
| Revisió pendent | sí |
| Efecte autoritzat | Creació d’aquest informe; cap modificació de codi |

## Vincles

- [[260921_0155_pla_implementacio_mestre]]
- [[00_index_escriptori]]

## Veredicte

**No recomane donar per preparada la connexió a dades dinàmiques de producció encara.** Hi ha defectes reproduïts en la selecció després d’una creació amb resposta diferida, en la persistència de les amplàries i en la reavaluació del layout. També hi ha un límit explícit de 50 files en la consulta de notes i absència de virtualització. Açò no equival a haver demostrat pèrdua de dades o una vulnerabilitat crítica: els defectes i els límits estan detallats en I01, I02, I05, I06 i I07 amb les seues fonts.

Recompte: **0 crítics demostrats, 11 importants i 4 menors**. «Important» inclou errors funcionals i riscos de creixement justificats; els casos que depenen de dades encara no observades estan marcats [SUPÒSIT]. Les recomanacions són descriptives, no pegats ni instruccions d’aplicació automàtica. Pedra Seca significa exclusivament el Sistema de Disseny / UI Kit.

## Abast, evidència i límits

S’han llegit el Workspace, el seu context i reducer, la graella i els estils, els adaptadors de Notes i Disseny, la resolució de recursos i la consulta de notes. El manifest final identifica els fitxers citats amb SHA-256. No hi havia manifest de bundle adjunt: este és un manifest local d’evidència, no una atribució fictícia a un bundle.

- **[REPRODUÏT]**: execució local en memòria amb el codi existent, React i jsdom; cap fitxer de test nou. jsdom no calcula geometria CSS: les amplàries es van proporcionar explícitament.
- **[ESTÀTIC]**: comportament o contracte visible en el codi, sense afirmar una reproducció visual en navegador.
- **[SUPÒSIT]**: condició de dades, desplegament o ús que encara no s’ha observat en producció.

No s’ha consultat la web, activat una sessió real de Supabase ni modificat dades remotes. No s’ha fet un benchmark en dispositius reals, una prova de lector de pantalla o una certificació d’accessibilitat. L’informe no certifica permisos RLS, integritat completa de l’autoguardat ni seguretat de tot el backend.

### Addenda visual incorporada

La captura «Captura de pantalla 2026-09-04 a las 2.58.11.png», aportada per l’usuari, s’utilitza **només per a les targetes de la columna central**. En «Bloc de notes» s’observa una foto quadrada a l’esquerra i, a la dreta, títol, data i entradeta truncada. En «Sense títol» no es distingeix una miniatura o icona; per tant, la captura no demostra per si sola el comportament històric del fallback. La petició actual sí que fixa el comportament desitjat: imatge → icona → inicial, conservant el quadrat.

**El codi actual no ha eliminat l’estructura quadrada.** El contenidor genèric reserva amplària i alçària i usa `object-fit: cover`; Notes conserva una variant quadrada de 86 px per defecte. La fallada no s’ha d’atribuir automàticament a una desaparició del CSS: cal distingir dades, resolució, càrrega fallida i fallback. Fonts: `src/css/modules.css:102-120`, `src/css/modules.css:3320-3339`, `src/sections/notes/NotaFitxa.jsx:34-47`.

## Crític

**Cap defecte crític demostrat en l’abast revisat.** No s’han observat proves que permeten afirmar corrupció persistent, accés entre usuaris o execució de codi arbitrari. Els riscos amb dades reals que continuen oberts es documenten com a importants o incògnites, sense inflar-ne la severitat.

## Important

### I01 — La selecció controlada anul·la l’espera d’un element acabat de crear

**[REPRODUÏT].** `requestItem` marca l’ID com a pendent i emet la selecció. Si el consumidor retorna eixa selecció mitjançant la prop controlada abans que l’element arribe a `items`, `selection/sync` esborra `pendingItemId`. La reconciliació següent tracta el nou ID com a desaparegut i selecciona un element antic. Fonts: `src/components/universal/workspace/WorkspaceContext.jsx:101-122`, `src/components/universal/workspace/workspaceState.js:55-62`, `src/components/universal/workspace/workspaceState.js:100-128`, `src/components/universal/workspace/WorkspaceContext.jsx:140-169`.

Reproducció en memòria: element inicial `old`, creació que demana `new`, pare que reflecteix `onSelectionChange` en `selection`, llista encara amb `old`. Resultat: selecció final `old`, pendent nul, notificacions `new/create` i després `old/reconcile`. El contracte aparent d’esperar la nova fila queda trencat. Notes és un consumidor amb selecció controlada, encara que el seu proveïdor també injecta la creació localment; **no afirme que totes les creacions actuals de Notes fallen**, perquè el resultat depén de l’ordre d’arribada. Fonts: `src/sections/notes/NotesSection.jsx:129-140`, `src/sections/notes/NotesDataContext.jsx:176-188`.

El cas invers també necessita eixida: sense eco controlat, un ID pendent que mai arribe bloqueja la reconciliació indefinidament; s’ha reproduït un nou snapshot `ready` amb `pendingItemId = missing` i detall nul. Font: `src/components/universal/workspace/WorkspaceContext.jsx:140-141`.

**Aproximació sòlida:** distingir una confirmació de la mateixa selecció d’una navegació externa nova; preservar la transacció de creació fins que arribe la fila, falle o es cancel·le. Definir recuperació explícita per al pendent que no arriba i carregar per ID quan corresponga. Acceptació: resposta diferida, eco de la URL, error, canvi de categoria i navegació enrere no han de seleccionar silenciosament una altra nota.

### I02 — La consulta real talla les notes a 50 i la reconciliació interpreta absència com a desaparició

**[ESTÀTIC].** La consulta `/notes` porta `limit=50`, ordena per actualització i no implementa cursor ni una segona pàgina dins de `loadNotes`. La consulta de submissions també porta `limit=50`. Hi ha una fusió amb altres fonts, de manera que **50 no és necessàriament el total final del model**, però sí el tall de cadascuna d’eixes consultes. Font: `src/data/supabase/notes.js:11-29`.

Al Workspace, un ID actiu absent de `itemById`, amb estat `ready` i sense pendent, és substituït per un altre ID. No hi ha informació que distingisca «encara no carregat» d’«eliminat». Font: `src/components/universal/workspace/WorkspaceContext.jsx:124-151`.

**[SUPÒSIT]** Amb més de 50 notes exclusivament en la taula de notes i un enllaç a una nota antiga fora de la primera pàgina, eixa nota no entrarà per esta consulta i la selecció pot ser substituïda. No s’ha consultat la base real per saber quantes notes hi ha.

**Aproximació sòlida:** paginació explícita, estat de completitud, consulta del detall per ID i distinció entre absent, pendent i no accessible. No connectar una col·lecció parcial a una reconciliació que pressuposa inventari complet. Acceptació: les notes 51 i 1.001 han de ser accessibles per navegació i enllaç directe, sense haver de falsejar `status`.

### I03 — Les miniatures no tenen un contracte comú ni fallback en cas d’error

**[ESTÀTIC + REPRODUÏT].** Hi ha dues rutes independents:

| Ruta | Què fa ara | Defecte verificat |
| --- | --- | --- |
| Targeta per defecte | Imatge crua; si no hi ha imatge, component d’icona; si tampoc n’hi ha, inicial | No resol referències opaques ni gestiona errors d’imatge |
| `NotaFitxa` | Resol la imatge amb un hook; si no obté URL, inicial | Omet el nivell d’icona i tampoc gestiona errors de càrrega |

Fonts: `src/components/universal/workspace/UniversalWorkspace.jsx:479-487`, `src/components/universal/workspace/UniversalWorkspace.jsx:500-535`, `src/sections/notes/NotaFitxa.jsx:34-47`.

S’ha disparat un esdeveniment `error` sobre la imatge de la targeta genèrica: la imatge continua al DOM i no apareix cap inicial. Tindre una cadena no buida no significa que el navegador haja carregat la imatge. [SUPÒSIT] Una URL caducada, un 404 o una referència `sdp-media://` passada a la targeta genèrica desencadenen el problema corresponent.

Disseny injecta el manifest sense adaptador de mitjans ni `renderItem`; la construcció de Fonaments i les entrades del catàleg inspeccionades no aporten `image` o `icon`. Les icones de les capçaleres no es propaguen als elements. Per tant, les inicials de Disseny no demostren una avaria de xarxa: són l’eixida prevista amb eixes dades. Fonts: `src/sections/disseny/DesignSection.jsx:41-45`, `src/sections/disseny/DesignSection.jsx:67-75`, `src/sections/disseny/cataleg/manifest.js:15-99`, `src/components/universal/workspace/UniversalWorkspace.jsx:520-530`.

En Notes, la cadena `hero_image` → `heroImage` → `coverImage` → `item.image` existeix. No hi ha evidència per afirmar que s’haja perdut universalment el camp al mapeig. Fonts: `src/data/supabase/notes.js:5-9`, `src/sections/notes/NotesContext.jsx:153-165`, `src/sections/notes/NotesSection.jsx:29-45`.

**Aproximació Pedra Seca:** una primitiva visual compartida per les dues targetes, amb estat explícit de càrrega/error, espai quadrat estable i prioritat imatge resolta → icona de tipus → inicial. Els adaptadors decideixen la portada i una clau d’icona, resolta mitjançant un registre de components de confiança. No passar una cadena de base de dades com si fora un component React. Reiniciar l’error quan canvie la referència i mantindre `alt=""` si la imatge continua sent decorativa i el títol ja dona el nom accessible. Acceptació: foto vàlida, absent, trencada, canvi de portada i manca d’icona conserven la mateixa anatomia de la captura.

### I04 — Resolució de recursos amb URL anterior, caducitat sense renovació i context incomplet

**[ESTÀTIC].** En canviar d’una referència a una altra de tipus `sdp-media://`, el hook no buida la URL anterior abans d’esperar la nova promesa. El guard d’efecte evita que una resposta antiga sobreescriga la nova, però no evita mostrar temporalment la portada anterior mentre resol la nova. Fonts: `src/hooks/useResolvedAsset.js:13-45`.

El backend crea signatures de 3.600 segons; si la signatura falla, retorna la mateixa referència opaca. El hook la considera una URL resolta i el renderitzador intenta mostrar-la. No hi ha renovació basada en caducitat ni reintent de la imatge en este recorregut. Fonts: `src/data/supabase/storage.js:130-153`, `src/hooks/useResolvedAsset.js:23-35`, `src/sections/notes/NotaFitxa.jsx:36-43`.

**[SUPÒSIT]** Una miniatura lazy encara no descarregada quan expire la signatura pot fallar; no afirme que una imatge ja descarregada desaparega automàticament al cap d’una hora. El hook només depén d’`assetRef`; canvis de disponibilitat del backend amb la mateixa referència no disparen l’efecte. A més, la resolució local crida el resolver sense `basePath`, `pluginUrl` ni versió, encara que el resolver els admet. Fonts: `src/hooks/useResolvedAsset.js:23-45`, `src/config/assetResolver.js:34-52`.

**Aproximació sòlida:** servei de resolució amb context d’usuari/tenant, base de desplegament, deduplicació, caducitat coneguda i invalidació; retorn d’estats d’error, no d’un esquema opac com si fora una URL navegable. Separar esta infraestructura del component visual de Pedra Seca. Acceptació: canvi ràpid de portada, signatura rebutjada, desplegament sota subruta i recàrrega d’una URL expirada.

### I05 — Expandir una columna no recalcula el breakpoint necessari

**[REPRODUÏT].** La mesura llig l’estat de plec i calcula un mínim ample dinàmic, però l’efecte que actualitza `collapsedRef` no executa la mesura. La reavaluació explícita només depén d’`columnWidths`; l’observador vigila l’amplària del contenidor, que pot no canviar en desplegar una columna interna. Fonts: `src/components/layout/AppGridShell.jsx:68-106`.

Reproducció: amplàries guardades esquerra 420 i centre 520; contenidor 1.400; plegar esquerra; reduir contenidor a 1.100; expandir esquerra. El layout continua `ample`, encara que el mínim calculat amb les dues columnes obertes seria 1.262. El CSS reserva 420 + 1 + 520 + 1 i deixa aproximadament **158 px** al detall, perquè l’última pista és `minmax(0, 1fr)`. Fonts: `src/components/layout/AppGridShell.jsx:8-19`, `src/components/layout/AppGridShell.jsx:77-87`, `src/components/layout/AppGridShell.css:97-113`.

És un defecte de càlcul reproduït, no una captura visual: **[SUPÒSIT]** controls amples del detall es retallaran o refluïran deficientment a eixa amplària. El mínim de 320 expressat en JavaScript no queda garantit.

**Aproximació sòlida:** una única funció de càlcul reactiva a contenidor, amplàries i estat de plec, amb límits coherents entre CSS, resizer i atributs ARIA. Acceptació: expandir a 1.100 amb amplàries màximes ha de passar a layout mitjà o aplicar una política explícita d’ajust, sempre respectant el mínim del detall.

### I06 — La persistència de redimensió depén d’un efecte lateral dins del setter

**[REPRODUÏT].** `resizeColumn` assigna una variable local dins de l’actualitzador funcional de `setColumnWidths` i intenta guardar-la immediatament després. React pot executar l’actualitzador posteriorment; el valor local encara és nul en el moment de guardar. Font: `src/components/layout/AppGridShell.jsx:125-142`.

En execució local, primera fletxa dreta: valor visible 286, guardat 286. Segona fletxa: valor visible 302, guardat encara 286. No és una hipòtesi de concurrent mode: s’ha observat en el runtime instal·lat.

**Aproximació sòlida:** mantindre l’actualitzador pur i persistir l’estat confirmat en un efecte o en el final del gest, amb una política de freqüència definida. Acceptació: seqüència de tecles i arrossegament, seguida de remuntatge, restaura l’últim valor visible.

### I07 — Més de 1.000 ítems implica DOM complet, reprocessament i possible allau de signatures

**[REPRODUÏT + ESTÀTIC].** Amb 1.001 elements s’han comptat **1.001 `<li>` muntats**. La llista fa un `map` complet, sense finestra visible ni paginació d’interfície. Cada canvi de consulta refiltra la col·lecció; cada canvi de `items` renormalitza els elements i reconstrueix els mapes. Fonts: `src/components/universal/workspace/UniversalWorkspace.jsx:473-491`, `src/components/universal/workspace/WorkspaceContext.jsx:47-66`, `src/components/universal/workspace/workspaceState.js:149-165`.

En Notes, el model recrea els elements quan canvia la col·lecció i cada miniatura executa el hook de resolució. `loading="lazy"` retarda la càrrega de la imatge, **no la petició de signatura iniciada per l’efecte React**. [SUPÒSIT] Amb 1.001 recursos privats diferents i el backend disponible, el muntatge pot iniciar fins a 1.001 resolucions sense límit de concurrència en este hook. Fonts: `src/sections/notes/NotesSection.jsx:71-96`, `src/sections/notes/NotaFitxa.jsx:35-40`, `src/hooks/useResolvedAsset.js:15-45`.

**Resposta a la incògnita:** el CSS té un bon punt de partida per a virtualitzar: cos amb `flex: 1 1 0`, `min-height: 0` i scroll propi. Però **encara no hi ha virtualització**. Cal exposar el contenidor de scroll, incorporar l’espaiador i posicionament de la finestra i mesurar o contractar l’alçària real de les files; la targeta usa `min-height`, no una alçària universal fixa. Fonts: `src/css/modules.css:62-77`, `src/css/modules.css:171-185`, `src/css/modules.css:3320-3375`.

**Aproximació sòlida:** paginar dades; virtualitzar files preservant selecció, focus i semàntica de llista; resoldre recursos dins de la finestra amb marge de precàrrega; limitar signatures concurrents; reutilitzar identitats d’elements quan no canvien. No prometre fluïdesa per CSS. Mesurar en dispositiu representatiu amb 1.001 i 10.000 files, textos llargs, zoom i navegació per teclat abans de fixar un llindar acceptable.

### I08 — Les etiquetes de cerca poden consumir tot l’espai de la llista

**[ESTÀTIC; impacte visual pendent].** Totes les etiquetes de tots els elements es calculen i es renderitzen quan s’obri la cerca. La tira fa `flex-wrap: wrap`, està **fora** del cos desplaçable de la llista i no té límit d’alçària ni scroll propi. El pare talla el desbordament. Fonts: `src/components/universal/workspace/UniversalWorkspace.jsx:329-331`, `src/components/universal/workspace/UniversalWorkspace.jsx:448-495`, `src/css/modules.css:171-185`, `src/css/modules.css:232-239`.

**[SUPÒSIT]** Amb moltes etiquetes diferents o una finestra baixa, el mínim intrínsec de la tira deixa la llista sense espai útil i pot ocultar part dels filtres. No s’ha mesurat l’alçària exacta en navegador.

**Aproximació Pedra Seca:** filtre amb superfície limitada i desplaçable, cerca de tags o desplegable, recompte clar de filtres actius i acció de neteja accessible. No muntar milers de píndoles fora del scroll principal. Acceptació: 200 etiquetes i viewport baix manté accessibles cerca, neteja i resultats.

### I09 — Semàntica de menú incompleta i accions de plec inoperants en tauleta

**[ESTÀTIC].** La navegació declara `role="menu"` i botons `menuitem`, però no implementa fletxes, gestió del focus o tabulació pròpia d’un menú compost. Només hi ha `onClick`. Per a una navegació per categories, botons dins d’una llista normal evitarien prometre un patró de menú que no s’ha implementat. Fonts: `src/components/universal/workspace/UniversalWorkspace.jsx:272-284`, `src/components/universal/workspace/UniversalWorkspace.jsx:297-312`.

El botó `Replegar` s’amaga únicament en layout `estret`; en `mitja` continua disponible, però les columnes només interpreten `collapsed` en `ample`. El botó canvia estat intern sense plegar visualment i intenta enfocar un botó d’expansió que no s’ha muntat. Fonts: `src/components/layout/AppGridColumn.jsx:107-117`, `src/components/layout/AppGridShell.css:234-236`, `src/components/universal/workspace/UniversalWorkspace.jsx:192-192`, `src/components/universal/workspace/UniversalWorkspace.jsx:237-240`, `src/components/universal/workspace/UniversalWorkspace.jsx:327-327`, `src/components/universal/workspace/UniversalWorkspace.jsx:412-415`.

**Aproximació Pedra Seca:** semàntica i teclat coherents amb la interacció real, i controls disponibles només quan tinguen efecte o adaptats explícitament a tancar el panell. Acceptació: recorregut complet amb Tab, Enter i teclat de menú si es manté eixe rol; focus visible després de cada transició en ample, mitjà i estret.

### I10 — L’autoselecció permanent de `n1` pot expulsar l’usuari d’una categoria buida

**[ESTÀTIC].** Notes torna a posar `nota=n1` sempre que falta el paràmetre i la col·lecció conté eixa nota. No és una inicialització limitada a l’entrada: l’efecte depén dels paràmetres i les notes. Escollir una categoria sense candidats emet `itemId: null` i el consumidor esborra el paràmetre. Fonts: `src/sections/notes/NotesSection.jsx:98-118`, `src/components/universal/workspace/WorkspaceContext.jsx:81-93`.

**[SUPÒSIT, condició explícita]** Si `n1` existeix i no pertany a la categoria buida, el nou paràmetre torna a seleccionar-la; la reconciliació ajusta la categoria a la de `n1`. Això desfà la intenció de navegar a la categoria buida. Font: `src/components/universal/workspace/WorkspaceContext.jsx:154-161`.

**Aproximació sòlida:** decidir la nota inicial una sola vegada, distingint URL absent, selecció explícitament buida i navegació de l’usuari. Acceptació: després d’obrir `n1`, anar a una carpeta buida ha de mantindre la carpeta i l’estat buit fins a una acció nova.

### I11 — La frontera de dades normalitza IDs però no valida la forma del model

**[ESTÀTIC].** La normalització pressuposa `items` array, cada element no nul i `categoryIds`/`tags` arrays. Les categories també s’aplanen sense validar IDs únics. Els mapes sobreescriuen IDs repetits i el render usa eixos mateixos IDs com a claus. Fonts: `src/components/universal/workspace/WorkspaceContext.jsx:29-61`, `src/components/universal/workspace/UniversalWorkspace.jsx:274-281`, `src/components/universal/workspace/UniversalWorkspace.jsx:480-487`.

**[SUPÒSIT]** Un adaptador nou que entregue `tags` com una cadena farà fallar `.map`; una col·lisió d’IDs farà discrepar la llista i el detall resolt pel mapa. Els error boundaries dels slots no protegeixen una excepció del proveïdor que els conté ni la columna esquerra. Font: `src/components/universal/workspace/UniversalWorkspace.jsx:74-97`, `src/components/universal/workspace/UniversalWorkspace.jsx:123-164`.

**Aproximació sòlida:** validar al límit de cada adaptador la forma, les enumeracions, els IDs globals únics i les relacions; retornar un error de model identificable. Les dades JSON han de referenciar icones per clau, no fingir components executables. No tractar com a array buit tota dada incorrecta perquè ocultaria errors. Acceptació: fixtures malformats i col·lisions donen diagnòstic controlat sense esfondrar tot el Workspace.

## Menor

### M01 — IDs DOM fixos entre instàncies de la graella

**[ESTÀTIC].** `app-grid-sidebar`, `app-grid-list` i `app-grid-main` són constants, també en `aria-controls`. [SUPÒSIT] Dues graelles simultànies en una pàgina generaran IDs duplicats i controls amb destí ambigu. Font: `src/components/layout/AppGridShell.jsx:189-260`.

Proposta: prefix estable per instància, compartit pels controls i els panells. És especialment rellevant per a una arquitectura reutilitzable i incrustable.

### M02 — Els errors de slots no tenen telemetria connectada en producció

**[ESTÀTIC].** El boundary registra per consola només en DEV quan no rep `onError`; les dues instàncies del Workspace no li passen este callback. El fallback sí que es mostra a l’usuari, però el defecte queda sense registre programàtic connectat per este component en producció. Fonts: `src/components/universal/workspace/SlotErrorBoundary.jsx:28-33`, `src/components/universal/workspace/SlotErrorBoundary.jsx:53-64`, `src/components/universal/workspace/UniversalWorkspace.jsx:134-163`.

Proposta: un callback d’error de domini amb context mínim, sense incloure contingut privat. El botó de reintent ja existeix; no cal duplicar-lo.

### M03 — Avís de dependència i focus ajornat sense cancel·lació

ESLint ha donat **0 errors i 1 warning**: l’efecte llig `selection` però només enumera els seus dos camps com a dependències. Això **no prova per si mateix una closure obsoleta**, perquè els valors funcionals són eixos camps. Proposta: explicitar el contracte amb valors desestructurats i resoldre l’avís sense introduir una sincronització per identitat d’objecte a cada render. Font: `src/components/universal/workspace/WorkspaceContext.jsx:111-122`.

El helper de focus programa dos `requestAnimationFrame` i no conserva els identificadors per cancel·lar-los. El ref opcional evita actuar sobre un node nul; **no s’ha demostrat una fuita de memòria sostinguda**. [SUPÒSIT] Una transició ràpida posterior pot rebre un focus ajornat d’una intenció anterior. Proposta: focus lligat a la transició confirmada i cancel·lable. Font: `src/components/universal/workspace/UniversalWorkspace.jsx:44-51`.

### M04 — La primera inserció després d’una llista buida no s’autoselecciona

**[REPRODUÏT].** Seqüència `loading` → `ready` buit → `ready` amb una fila: el detall continua sense selecció perquè l’inventari buit ja va consumir `needsInitialSelection`. Fonts: `src/components/universal/workspace/WorkspaceContext.jsx:143-169`, `src/components/universal/workspace/workspaceState.js:89-98`.

Pot ser una decisió de producte legítima, però s’ha de fixar abans de connectar insercions dinàmiques. `requires_human_decision: true`: decidir si la primera nota externa s’ha d’obrir automàticament o si només s’han d’obrir les creacions de l’usuari. La solució no ha de desfer una selecció buida explícita.

## Comprovacions favorables i correccions ja presents

- Les dues barres d’accions del Workspace ja no passen la variant transparent; la base de la capçalera té fons explícit. Es confirma la correcció de codi, no una validació visual de totes les pells. Fonts: `src/components/universal/workspace/UniversalWorkspace.jsx:242-253`, `src/components/universal/workspace/UniversalWorkspace.jsx:417-427`, `src/components/layout/AppGridShell.css:239-252`.
- `onConnect={false}` arriba des de Disseny, es converteix en nul i el render de `PageFrame` és condicional. L’ocultació està connectada en este camí. Fonts: `src/sections/disseny/DesignSection.jsx:22-29`, `src/components/universal/UniversalPage.jsx:17-17`, `src/components/universal/UniversalPage.jsx:64-74`, `src/components/universal/PageFrame.jsx:198-202`.
- El ResizeObserver es desconnecta al desmuntatge. La creació usa guard de muntatge i generació; la resolució d’imatges invalida respostes obsoletes; no s’ha trobat una subscripció permanent oblidada en estos punts. Fonts: `src/components/layout/AppGridShell.jsx:98-102`, `src/components/universal/workspace/UniversalWorkspace.jsx:335-370`, `src/hooks/useResolvedAsset.js:15-45`.
- La cerca tancada elimina consulta i tags, evitant filtres de cerca invisibles. Font: `src/components/universal/workspace/workspaceState.js:85-87`.
- La graella usa mínims zero i ocultació de panells amb `inert`/`aria-hidden`. El resizer té semàntica de separador i tecles de mida. Fonts: `src/components/layout/AppGridShell.css:82-104`, `src/components/layout/AppGridShell.jsx:216-260`, `src/components/layout/AppGridResizer.jsx:7-12`, `src/components/layout/AppGridResizer.jsx:60-81`.
- L’aïllament de la pàgina i els nivells locals de panells/resizers estan declarats. No s’ha demostrat un conflicte global de z-index. Sí que qualsevol overlay que es renderitze dins d’un avantpassat amb overflow ocult pot ser retallat: **[SUPÒSIT]** a validar amb cada detall injectat; pujar només el z-index no elimina el clipping. Fonts: `src/components/layout/AppGridShell.css:5-20`, `src/components/layout/AppGridShell.css:90-94`, `src/components/layout/AppGridShell.css:138-170`, `src/components/layout/AppGridShell.css:203-217`.
- Hi ha una regla global de moviment reduït. No s’ha classificat com a defecte l’absència d’una regla local equivalent en la graella. Font: `src/css/base.css:331-339`.

## Arquitectura recomanada per recuperar les miniatures

1. **Adaptador de dades:** decideix la portada real de cada domini i la icona de fallback. Notes ja té el camí de portada; Disseny necessita assignar expressament representacions als elements. Fonts de la situació actual: `src/sections/notes/NotesSection.jsx:29-45`, `src/sections/disseny/cataleg/manifest.js:31-41`.
2. **Resolució de recursos:** converteix referències locals, remotes o privades en un resultat carregable amb estat i caducitat; compartit i sensible al context, segons I04.
3. **Primitiva de Pedra Seca:** preserva el quadrat i passa per càrrega → imatge vàlida o icona → inicial; gestiona `onError`, reinici i decoració accessible. La reserva quadrada actual es pot conservar; no cal reconstruir la graella per a recuperar-la. Fonts: `src/css/modules.css:102-120`, `src/css/modules.css:3332-3339`.
4. **Composició de targeta:** `DefaultItemCard` i `NotaFitxa` comparteixen la primitiva; Notes conserva data i entradeta a la dreta. L’únic botó seleccionable continua embolcallant la targeta, sense botons interactius imbricats. Fonts de l’anatomia vigent: `src/components/universal/workspace/UniversalWorkspace.jsx:501-516`, `src/sections/notes/NotaFitxa.jsx:8-31`.
5. **Escala:** finestra de files i resolució limitada als recursos necessaris; provar zoom i files d’alçària variable, segons I07.

Açò és una proposta arquitectònica, no una implementació efectuada. No s’ha usat la captura per suggerir canvis a les altres barres, columnes o botons.

## Validació efectuada

### Tests existents

Comanda executada: `./node_modules/.bin/vitest run src/components/universal/workspace/UniversalWorkspace.test.jsx src/components/universal/workspace/workspaceState.test.js src/components/layout/AppGridResizer.test.jsx --no-cache`.

**Resultat: 3 fitxers, 9 tests aprovats.** El test de miniatures substitueix el hook per un retorn directe i comprova l’atribut `src`, no una càrrega real; la graella es prova amb `clientWidth` fix de 1.400. Per tant, els tests no contradiuen I03–I06 ni certifiquen layout real o signatures. Fonts: `src/components/universal/workspace/UniversalWorkspace.test.jsx:8-18`, `src/components/universal/workspace/UniversalWorkspace.test.jsx:118-127`. Els altres tests comproven dos casos del reducer i funcions de càlcul del separador: `src/components/universal/workspace/workspaceState.test.js:4-29`, `src/components/layout/AppGridResizer.test.jsx:4-16`.

### Comprovacions addicionals en memòria

| Cas | Observació |
| --- | --- |
| Selecció controlada ordinària | Canvi de categoria i element vàlids correcte |
| Creació controlada amb fila diferida | `new/create` seguit de `old/reconcile`; pendent esborrat |
| Creació no controlada amb ID absent | Pendent conservat sense eixida automàtica |
| Redimensió per dues fletxes | DOM: 286 → 302; emmagatzematge: 286 → 286 |
| Expansió amb contenidor 1.100 | Layout `ample` encara que el mínim seria 1.262 |
| Error de la imatge genèrica | Imatge present; cap fallback |
| 1.001 elements | 1.001 files muntades |
| Primera inserció després de buit `ready` | Selecció nul·la, inicialització consumida |

Execució de codi existent compilat i avaluat en memòria, sense afegir tests al repositori. Són proves de lògica i DOM simulat; no mesuren frames, contrastos o geometria real.

### Frontmatter i tancament

S’ha executat `node tooling/wiki/tractor-frontmatter.mjs --estricte --json` sobre el corpus local: **eixida 1; porta global fallida**. El resultat ha analitzat 214 documents i dona F1=17, F2=89, F3=118, F4=113, F5=1, F6=0, F7=14, F8=0, F9=222. El nou informe té **0 incidències atribuïdes al seu fitxer**, inclosa la secció Vincles. El registre JSON de la comprovació s’ha deixat a `/private/tmp/sdp-auditoria-workspace-frontmatter.json` com a evidència auxiliar temporal.

El bloqueig global inclou tags fora de domini i absència de la secció Vincles canònica en l’índex de l’escriptori, que ja estava modificat abans de l’auditoria. **No es declara que la porta global haja passat.** La comprovació pròpia sense errors i el resultat global fallit són dues dades diferents; no s’ha corregit ni maquillat deute documental alié.

El gate de tancament s’ha executat abans de crear este informe i ja ha fallat amb `ORPHAN_OPERATIVE` sobre `_wiki_de_poble/04_escriptori/260921_0218_PROMPT_addendum_miniatures.md`. No s’ha corregit cap document alié. No s’ha actualitzat `.agents/ESTAT.md` ni cap índex: es manté l’abast passiu amb una única eixida documental. L’informe inclou vincles eixints, però l’ancoratge entrant des de l’índex queda pendent de la integració documental.

## Incògnites i següents comprovacions

- [SUPÒSIT] Estat real de `hero_image`, signatures, permisos i respostes de xarxa de les notes que l’usuari veu sense foto. El codi explica vies de fallada, però la captura antiga no identifica el payload actual.
- [SUPÒSIT] Rendiment en telèfons i equips modestos amb 1.001 i 10.000 files, moltes etiquetes i recursos privats; falta mesura en navegador.
- [SUPÒSIT] Clipping del cercador en amplàries mínimes: el flex del cercador i de l’input no declaren `min-width: 0`; el control global té `inline-size: 100%`. Cal provar-ho amb el CSS complet abans d’afirmar un desbordament visual concret. Fonts: `src/css/modules.css:189-215`, `src/css/sdp.css:102-110`.
- [SUPÒSIT] Focus en canvis de breakpoint i panells superposats, sobretot amb zoom, teclat virtual i lector de pantalla. No s’ha fet esta validació real.
- La connexió de dades ha de fixar si `ready` significa col·lecció completa o una pàgina, i si una primera inserció externa mereix autoselecció. Vegeu I02 i M04.
- Falten proves d’integració dels casos adversos anteriors: cancel·lació d’una creació, dades tardanes, URL fora de pàgina, errors d’imatge i canvi d’usuari mentre es resolen recursos.

## Ordre recomanat de resolució

Primer, contracte de dades/selecció (I01, I02 i I11); després, correccions funcionals de graella (I05–I06) i miniatures compartides (I03–I04). Abans del desplegament amb col·leccions grans, abordar I07–I08; completar navegació i estats buits d’I09–I10. Esta priorització és una recomanació de l’auditoria, no una autorització ni execució de canvis.

## Bateria de veritat

- [x] Les afirmacions sobre codi tenen fonts locals en format `ruta:linies`.
- [x] Les rutes citades estan incloses en el manifest d’evidència següent.
- [x] No s’han presentat noms de components proposats com si ja existiren.
- [x] Les conjectures estan marcades [SUPÒSIT] o a Incògnites.
- [x] La captura s’ha limitat a les targetes centrals.
- [x] No s’ha modificat codi ni consultat la web.
- [x] Tests existents executats i límits de cobertura declarats.
- [ ] Porta global `tractor-frontmatter.mjs --estricte`: vegeu resultat detallat, sense atribuir errors d’altres documents a este informe.

## Manifest local d’evidència

Les línies citades corresponen als fitxers presents al disc durant l’auditoria. El SHA-256 permet detectar canvis posteriors. Les rutes són relatives a l’arrel de `socdepoble.org`.

| Fitxer | Línies | SHA-256 |
| --- | ---: | --- |
| `src/components/layout/AppGridColumn.jsx` | 122 | `70f00c17d7802d849a7e14ca7e7b544ad7f88dcfc6cc54addc8d2b7ec147178a` |
| `src/components/layout/AppGridResizer.jsx` | 84 | `46a2298a84696899d60201d8770d1f7c892c89603df7f445f2b794311b209881` |
| `src/components/layout/AppGridResizer.test.jsx` | 16 | `955f32c014b19ddca2715106464755155bd23745e4f7cb8e60ec0ede96771599` |
| `src/components/layout/AppGridShell.css` | 440 | `ab1c1783fc69fff33cec16e06d31acb3b4f517af8d15e559ee6d4ff66575aba9` |
| `src/components/layout/AppGridShell.jsx` | 269 | `6d3878f4e2f75393a45bf628e9ac5a15a7c4694cf557cbb3755c185d884b0e24` |
| `src/components/universal/PageFrame.jsx` | 316 | `95688f147790490d4bcc8ee353389ee48bdff41119b2b3d006f44a5dfa16fae7` |
| `src/components/universal/UniversalPage.jsx` | 77 | `9899383d1b51214b6e6f26091b976acb7699c56d7efafa0cee197b237237ae03` |
| `src/components/universal/workspace/SlotErrorBoundary.jsx` | 70 | `fb332dd1eafd429b4984bd0baf6068b84ac7f9f7b773967b16927335924f21ab` |
| `src/components/universal/workspace/UniversalWorkspace.jsx` | 567 | `f2e265d7fc34bb9bc07fc194c84d9f72fecfd14e843356ec8e75b4a265c16c76` |
| `src/components/universal/workspace/UniversalWorkspace.test.jsx` | 127 | `f4d363795bd03cfa3d8771702ca2470a28daf91737ec61195071f1dffb798e9a` |
| `src/components/universal/workspace/WorkspaceContext.jsx` | 207 | `dcb64ad1cfc8dfc866bc21b0bff807acf4f719cf3ca6e1c9a072b5a1f8171041` |
| `src/components/universal/workspace/workspaceState.js` | 166 | `6e096189234aba43baf4c65ab23ff453d30e1ed74a5990cc736aa13e66844e43` |
| `src/components/universal/workspace/workspaceState.test.js` | 30 | `df8750e47ff5e5e47cc432cce11b0de94b72556eb145cf5f67eb027d87739cb4` |
| `src/config/assetResolver.js` | 82 | `130799a57daba360cf89df3096f370314d4975816c7e750f8bad882442e39514` |
| `src/css/base.css` | 340 | `49604ec0ba053ee054cb03106b95306410b90405f8656f463b5661c49b42931f` |
| `src/css/modules.css` | 3473 | `b1e866ec17bbd7f4481e073c0796671790f274ed69ed1156c20ba9f8269fcdfc` |
| `src/css/sdp.css` | 233 | `0b8b926b684580e5fb9b76d0ba35ea0f56702d4dcb2fe93033acc36c06e9a88d` |
| `src/data/supabase/notes.js` | 68 | `e61ea503316fe0f1e14dc7d0deffaadcda5917329745f04a74d10a58b344ecaf` |
| `src/data/supabase/storage.js` | 187 | `37e1731f19487e091ba7183aa96a6624754b470431ca80eda85d405ce3ea70b4` |
| `src/hooks/useResolvedAsset.js` | 48 | `e06de71da5a149eca039cad44dcb7a5fd3d601d9215fd43e85b03ef99c4102d6` |
| `src/sections/disseny/DesignSection.jsx` | 78 | `9e383692a3a46ad4eb66a002257ffbfc4f87929061439dbd390c5c94e38f82f0` |
| `src/sections/disseny/cataleg/manifest.js` | 342 | `0ffc28a83d1101739a5b66803fc5c669e0c2113f0e92613b49fd18774b947a51` |
| `src/sections/notes/NotaFitxa.jsx` | 48 | `4e4e5f5798f3cac71d961659abe214eb7fe1c97cb1efb83d1c47f13cc1212d55` |
| `src/sections/notes/NotesContext.jsx` | 279 | `6176cbd9595b1d38c875d42a5ec962fc4b4ea1346203a1c46b88b560a33eda6a` |
| `src/sections/notes/NotesDataContext.jsx` | 209 | `453668433cfb4b51beddf3817fc3b688d7266af494c2275da5558ee06cf31841` |
| `src/sections/notes/NotesSection.jsx` | 152 | `9f14c23daa8a7e2d2e8399cbba6cbe0b76c9b97aae03aac38c62bbc4008db7fc` |
