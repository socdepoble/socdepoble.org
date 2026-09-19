---
type: informe
status: esborrany
description: Auditoria local de UniversalPage i proposta d'unificació de lectura, edició i regles visuals amb migració gradual.
tags:
  - disseny
---

# Auditoria de la UniversalPage — proposta Codex

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-UNI-CODEX |
| Encàrrec | SDP-PROMPT-260918-UNI, versió 1.0.0 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 14:07 · Europe/Madrid |
| Modificació | 26-09-18 14:17 · Europe/Madrid |
| Agent redactor | Codex |
| Destinatària d'implementació | IAIA MarIA |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent |
| Revisió pendent | sí |
| Base Git observada | d03523ecff3749f3d4a63926343552c73184eed7 |
| Estat auditat | Arbre de treball local, amb modificacions prèvies; no exclusivament el commit |

## Vincles i abast

- [[00_index_escriptori]]
- [[260918_1350_prompt_auditoria_universal_page]]
- [Constitució local](../../AGENTS.md)
- [Contracte UniversalPage](../../.agents/skills/universal-page/SKILL.md)
- [Sistema de Disseny Pedra Seca](../../.agents/skills/pedra-seca/SKILL.md)
- [Contracte de la graella](../../.agents/skills/app-grid-shell/SKILL.md)

Totes les cites `ruta:inici-final` es resolen des de `socdepoble.org/`, arrel real del repositori dins de l'espai de treball. Els números corresponen a l'arbre local inspeccionat el 18 de setembre de 2026. El nom real del component de Disseny és `DesignSection`, a `src/sections/disseny/DesignSection.jsx:29-68`; no s'ha assumit l'existència d'un fitxer anomenat DissenySection.

Auditoria estàtica del codi, CSS, contractes locals i proves existents, complementada amb dues comprovacions de contracte executades en memòria. No s'ha obert cap navegador, consultat cap font externa, connectat amb el backend ni executat l'aplicació. No hi ha validació visual en navegador ni certificació de persistència remota. Pedra Seca significa, en tot aquest informe, **Sistema de Disseny / UI Kit**.

Les seccions de diagnòstic descriuen l'estat existent. Les seccions marcades **Proposta** són especificacions futures. Els nous noms de propietats que s'hi suggerixen no es presenten com a API existent. No es proposa una nova col·lecció de fitxers amb noms ficticis: la distribució es concreta sobre els fitxers verificats.

## 1. Dictamen

**La unificació ha de consistir en un únic arbre visual de document, amb lectura i edició com a comportaments de les seues peces.** Cal mantindre separats l'espai de treball, la sessió d'edició i la persistència. Posar totes aquestes responsabilitats dins d'un component més gran tornaria a crear el mateix problema.

Ja hi ha una base aprofitable: `UniversalPage` delega l'estructura a `PageFrame`; `NotesEditor` aporta un adaptador de domini; `UniversalWorkspace` entrega el detall a través de `renderDetail`. Per tant, la proposta és consolidar aquests límits, no substituir la graella ni començar un editor des de zero. Evidència: `src/components/universal/UniversalPage.jsx:64-78`; `src/sections/notes/NotesEditor.jsx:18-34`; `src/components/universal/workspace/UniversalWorkspace.jsx:75-119,452-480`.

La fragmentació principal es troba en quatre fronteres:

1. **Configuració:** dades, JSX, navegació i presentació es barregen entre context, propietats planes, `topBarData` i propagacions amb `...rest`. Evidència: `src/components/universal/UniversalPage.jsx:8-38,64-77`; `src/components/universal/UniversalEditorShell.jsx:150-205`.
2. **Estructura:** la closca d'edició incorpora contenidors i una barra pròpia abans de tornar a construir la pàgina. El detall del Workspace i la pàgina continguda declaren desbordament vertical independentment. Evidència: `src/components/universal/UniversalEditorShell.jsx:156-213`; `src/css/modules.css:292-300`; `src/css/utilities.css:68-95`.
3. **Contingut:** els camps de capçalera usen HTML editable, el cos usa TipTap i les lectures de detall tenen renderitzadors diferents. Evidència: `src/components/universal/UniversalEditorShell.jsx:36-48,175-203`; `src/components/universal/DocumentEditor.jsx:70-77,129`; `src/sections/detail/detailRichText.jsx:3-50`.
4. **Contracte visual:** la norma d'incrustació i el CSS discrepen, i l'espècimen de Disseny descriu un mode diferent del que renderitza el consumidor. Evidència: `.agents/skills/universal-page/SKILL.md:72-77`; `src/css/utilities.css:83-94`; `src/sections/disseny/DesignSection.jsx:17-25`; `src/sections/disseny/cataleg/detalls/EspecimenPage.jsx:6-12`.

**Decisió recomanada:** mantindre el nom públic `UniversalPage`; consolidar `PageFrame` com a únic propietari de l'anatomia; convertir `DocumentEditor` en controlador de sessió sense estructura visual alternativa; retirar `UniversalEditorShell` després d'una transició amb adaptador sense DOM propi. La retrocompatibilitat ha de cobrir els consumidors locals durant la migració i tindre una condició explícita de retirada.

## 2. Arquitectura actual comprovada

Les cadenes següents expressen composició de components, no impliquen que cada component afegisca un node DOM.

```text
NotesSection
└─ UniversalWorkspace → WorkspaceProvider → WorkspaceFrame → AppGridShell
   └─ columna dreta → SlotErrorBoundary → DetailColumn
      └─ NotesEditor → DocumentEditor → UniversalEditorShell
         ├─ UniversalRichTextToolbar → UniversalToolbar
         └─ UniversalPage → PageFrame
            ├─ EditableField: títol, subtítol i entradeta
            └─ UniversalRichTextContent: cos TipTap

DesignSection
└─ UniversalWorkspace → columna dreta → CatalogDetail
   └─ UniversalPage → PageFrame → Suspense → espècimen seleccionat

PerfilShell
└─ UniversalWorkspace → detall de perfil → DetallAjust
   └─ UniversalEditorShell → UniversalPage → PageFrame
      └─ formulari d'ajust
```

Fonts de les cadenes: `src/sections/notes/NotesSection.jsx:82-104`; `src/components/universal/workspace/UniversalWorkspace.jsx:43-63,66-119,463-480`; `src/sections/notes/NotesEditor.jsx:18-34`; `src/components/universal/DocumentEditor.jsx:96-130`; `src/components/universal/UniversalEditorShell.jsx:156-213`; `src/sections/disseny/DesignSection.jsx:10-26,58-67`; `src/sections/profile/PerfilShell.jsx:130-138`; `src/sections/profile/DetallAjust.jsx:313-340`.

Hi ha elements que s'han de preservar expressament:

- La selecció de Workspace sincronitzada amb URL i la distinció entre accions d'usuari i reconciliació: `src/components/universal/workspace/WorkspaceContext.jsx:71-119,121-170`.
- L'aïllament d'errors de llista i detall, amb reinici per identitat: `src/components/universal/workspace/UniversalWorkspace.jsx:91-117`; `src/components/universal/workspace/SlotErrorBoundary.jsx:36-42`.
- L'esborrany pendent del cos associat a un ID i la sincronització de TipTap sense emetre actualitzacions artificials: `src/components/universal/richText/useUniversalRichText.js:15-48,75-108`.
- La separació entre contracte de format i adaptador TipTap: `src/components/universal/richText/toolbarContract.js:11-49`; `src/components/universal/richText/tiptapToolbarAdapter.js:24-55`.
- L'entrada de backend i la pujada de mitjans aportades pel domini de Notes: `src/sections/notes/NotesEditor.jsx:4,11-26`; `src/sections/notes/NotesDataContext.jsx:2,83-102`.

## 3. Troballes i correccions exigibles

P1 significa una incidència de funcionalitat, accessibilitat o integritat del contingut que convé resoldre abans de donar per bona la migració. P2 significa deute arquitectònic o incoherència d'UI amb efecte verificable en el contracte. Una conseqüència visual pendent de navegador s'indica com a risc, no com a captura reproduïda.

### F01 · P1 · La taula de continguts queda amagada a les tecnologies d'assistència

**Fet.** L'element que conté tot el calaix de l'índex porta `aria-hidden="true"`, inclosos títol, botó de tancament i navegació. La implementació local tampoc declara una modalitat accessible ni gestiona Escape o retorn del focus. Evidència: `src/components/universal/PageFrame.jsx:70-105`.

**Efecte.** L'índex que la norma considera essencial pot ser inaccessible mentre els seus botons continuen sent focusables. La regla d'un únic H1 i navegació per subseccions està documentada a `.agents/skills/universal-page/SKILL.md:32-37`.

**Proposta.** Reutilitzar `Dialeg` amb el mode calaix, que ja té nom accessible, gestió de cancel·lació i retorn de focus; mantindre el contingut de l'índex com a responsabilitat de pàgina. El component existent és a `src/components/PedraSeca/organismes/Dialeg.jsx:21-76`. Comprovar que, en saltar a una secció, el focus acaba al destí; en cancel·lar, torna al botó Índex. No copiar una segona infraestructura modal.

**Acceptació.** Obrir, recórrer, activar i tancar l'índex amb teclat i lector de pantalla; sense focus dins d'un ancestre ocult; moviment reduït respectat. Els IDs generats no s'han de convertir en dades del document: l'índex actual els escriu al DOM i els retira en la neteja (`src/components/universal/PageFrame.jsx:17-25,58-65`).

### F02 · P1 · El llenguatge de contingut de l'editor i el del sanejador no coincidixen

**Fet.** La barra ofereix ratllat i l'adaptador executa `toggleStrike`; el sanejador no admet les etiquetes `s` o `del`. A més, admet `h1`, mentre el motor del cos limita els encapçalaments a H2–H4. Evidència: `src/components/universal/richText/toolbarContract.js:28-36`; `src/components/universal/richText/tiptapToolbarAdapter.js:10-17`; `src/utils/sanitize.js:71-87`; `src/components/universal/richText/useUniversalRichText.js:29-31`.

**Comprovació local.** El sanejador real, carregat en memòria amb DOMPurify i JSDOM locals, transforma `<h1>Títol duplicat</h1><p><s>Ratllat</s> <strong>Negreta</strong></p>` en `<h1>Títol duplicat</h1><p>Ratllat <strong>Negreta</strong></p>`. No és una prova de navegador ni de servidor: confirma el desacord de l'esquema.

**Efecte.** Es pot oferir un format que no sobreviu al sanejament del desat, i el sanejament de seguretat per si sol no assegura un únic H1. Notes saneja aquests camps abans d'enviar-los a la cua (`src/sections/notes/NotesContext.jsx:12-20,114-125`).

**Proposta.** Definir un esquema editorial compartit per importació, edició, desat i lectura. Separar sanejament de seguretat de normalització estructural. Conservar el ratllat amb una representació admesa i estable; impedir H1 dins del cos amb conversió explícita dels documents antics, sense eliminar-ne el text. Fer proves d'anada i tornada de cadascun dels formats visibles.

### F03 · P1 · El callback de confirmació de desat té un contracte incompatible

**Fet.** `saveNoteField` passa `setLocalNoteField` al sisé argument de `bgSaveManager.enqueue`. Aquesta funció rep `(id, field, value)`. El gestor tracta l'argument com un setter de React i l'invoca amb una funció `prev => next`. Evidència: `src/sections/notes/NotesContext.jsx:69-79,114-125`; `src/sections/notes/GlobalSaveManager.js:22,48-64`.

**Comprovació local.** Executant el gestor real en memòria, amb temporitzador controlat i backend simulat que confirma revisió 1, la promesa retorna `true` i el callback rep un únic argument de tipus `function`, sense `field` ni `value`. Aquesta és exactament la signatura que el consumidor no espera.

**Efecte deduït del codi.** La neteja prevista dels camps confirmats no s'executa sobre l'estat d'esborranys. El setter interpreta la funció rebuda com l'ID; en el camí ordinari retorna sense canvis perquè el camp consultat i el valor rebut són tots dos `undefined`. No es conclou que la petició remota falle: el defecte afecta la reconciliació local després de l'èxit.

**Proposta.** Acordar una operació de confirmació amb ID, camps enviats i revisió retornada, i conservar únicament els canvis locals posteriors a aquella versió. No passar setters interns com si foren operacions de domini. Resoldre aquesta incidència en un canvi de dades separat i amb una prova que cobrisca un segon canvi local mentre el primer es desa. La nova UI ha de consumir aquest resultat explícit; no inferir «Desat» del venciment d'un temporitzador.

### F04 · P2 · Els camps de capçalera formen un segon editor sense contracte propi

**Fet.** `EditableField` és un `span contentEditable` que llig `innerHTML`, saneja i torna a assignar HTML; no declara etiqueta accessible ni política de contingut per camp. Es col·loca dins dels H1/H2 i del paràgraf d'entradeta. La barra de format, en canvi, està connectada únicament a l'editor TipTap del cos. Evidència: `src/components/universal/UniversalEditorShell.jsx:36-48,175-203`; `src/components/universal/PageFrame.jsx:245-249,286-291`; `src/components/universal/DocumentEditor.jsx:70-79,96-103`.

**Efecte.** El sanejador general permet blocs i imatges on el model de títol hauria de ser més restrictiu. La barra no representa necessàriament el camp que té el focus: l'adaptador executa les ordres enfocant TipTap (`src/components/universal/richText/tiptapToolbarAdapter.js:47-55`). La preservació de cursor, composició IME i enganxat en els camps de capçalera requerix proves; no s'ha reproduït una pèrdua de cursor en aquesta auditoria.

**Proposta.** En la primera migració conservar l'HTML en línia existent de títol, subtítol i entradeta, amb un esquema limitat i un nom accessible per camp. No convertir automàticament els títols antics a text pla perdent format. Separar el text pla destinat a SEO, llistes i compartir de la representació editorial. La barra de format ha d'actuar sobre el camp enfocat si aquest ho admet, o indicar que les eines corresponen al cos i desactivar les no aplicables. No ha de saltar silenciosament del títol al cos.

**Cas concret.** `DetallAjust` passa `null` per ocultar subtítol i entradeta de persones; la closca crea igualment els elements `EditableField`, i `PageFrame` avalua aquests nodes com a valors presents abans que el fill retorne `null`. Es poden construir contenidors buits. Fonts: `src/sections/profile/DetallAjust.jsx:323-325`; `src/components/universal/UniversalEditorShell.jsx:36-37,185-203`; `src/components/universal/PageFrame.jsx:287-291`. Cal decidir la presència del camp sobre dades normalitzades, abans de crear el node.

### F05 · P2 · La configuració té precedències diferents segons la propietat

**Fet.** `UniversalPage` mescla `config` i propietats, però calcula diversos callbacks només a partir de `props`; després els escriu damunt de tots dos. El títol usa `??`, el text per a accions usa `||`; l'autoria de la closca també usa `||`. `topBarData` és substituït per l'objecte construït a la closca després de `...rest`. Evidència: `src/components/universal/UniversalPage.jsx:13-38,64-77`; `src/components/universal/UniversalEditorShell.jsx:150-174`.

**Efecte.** Un callback aportat pel context pot quedar substituït per la ruta per defecte. Passar `null` no permet expressar de manera consistent «sense aquesta acció». Un consumidor no pot saber la precedència només llegint un únic contracte.

**Proposta.** Normalitzar una sola vegada a l'entrada pública. En la futura API, absència significa «no hi ha dada o acció» i una acció desactivada és un estat explícit diferent. La compatibilitat antiga conserva les seues precedències fins que migre cada consumidor; el camí nou no hereta callbacks ocults ni passa propietats desconegudes amb `...rest`.

**Derivada reactiva.** `ContentProvider` usa `initialConfig` només per iniciar `useState`; no seguix automàticament els canvis d'aquella prop. Mur i Mercat creen aquesta configuració amb traduccions. Això exposa un risc de metadades desfasades si canvia l'idioma sense remuntatge. Fonts: `src/components/universal/ContentProvider.jsx:5-15`; `src/sections/mur/MurSection.jsx:106-118`; `src/sections/mercat/MercatSection.jsx:21-31`. Preferir dades controlades; no convertir una configuració derivada de props en un segon magatzem de contingut.

### F06 · P2 · La propietat de l'scroll depén de la cadena de contenidors

**Fet.** `UniversalEditorShell` afegix un contenidor flex amb altura completa i overflow ocult, un segon contenidor flex i un `sdp-canvas`; fixa `layout="contained"`. `DetailColumn` incorpora `sdp-workspace-detail`, que declara `overflow-y:auto`, i el contenidor de pàgina continguda també el declara. Fonts: `src/components/universal/UniversalEditorShell.jsx:158-165,207-209`; `src/components/universal/workspace/UniversalWorkspace.jsx:472-480`; `src/css/modules.css:292-300`; `src/css/utilities.css:68-81`.

**Efecte.** Hi ha dos candidats al desplaçament del mateix detall. Açò és un contracte ambigu i un risc de scroll niat, no prova suficient que sempre es vegen dues barres. Disseny usa els valors per defecte del marc, mentre Notes força el contenidor intern; és una diferència real entre els dos camins (`src/sections/disseny/DesignSection.jsx:17-21`; `src/components/universal/PageFrame.jsx:110-119`).

**Proposta.** Assignar el scroll a un únic propietari per superfície segons la taula de §5. El Workspace no ha de deduir-ho inspeccionant fills ni amb selectors de contingut. Retirar els contenidors d'edició que no tinguen una responsabilitat de mida, semàntica o motor demostrable.

### F07 · P2 · Hi ha dues normes incompatibles per a les barres incrustades

**Fet.** La skill de UniversalPage prescriu que les dues barres ixquen de la vista en desplaçar un document incrustat. El CSS actual imposa `position:sticky` en el mode contingut, i les regles estàtiques d'embed apareixen comentades. Fonts: `.agents/skills/universal-page/SKILL.md:72-77`; `src/css/utilities.css:83-94`; `src/css/layout.css:201-205,260-264`.

**Proposta de resolució.** Per a la nova arquitectura, barres de document en flux normal dins del detall i sticky en una pàgina autònoma. La barra de format pot romandre visible fora de la zona desplaçable del detall. El comentari CSS al·ludeix a una petició anterior, però no acredita una decisió de producte vigent en aquest encàrrec: IAIA MarIA ha de contrastar-la abans de canviar aquest comportament. Si es ratifica sticky també al detall, cal actualitzar la norma i la matriu visual alhora; no mantindre les dues versions com si foren equivalents.

### F08 · P2 · La semàntica de les accions depén del títol i de rutes genèriques

**Fet.** Connectar i traduir construïxen `item_id` amb el text del títol; Comentar envia a `/xat` sense autor. Compartir passa `title`, que pot ser un node JSX en edició. `onIaia` i `onSearch` es calculen i s'envien, però no apareixen al contracte consumit per `PageFrame`. Fonts: `src/components/universal/UniversalPage.jsx:13-32,68-76`; `src/components/universal/PageFrame.jsx:109-120`; `src/components/universal/UniversalEditorShell.jsx:175-183`.

**Efecte.** Dos documents amb el mateix títol no tenen una identitat d'acció diferenciada en aquest fallback; un títol editable buit usa `page`. El botó Comentar no complix per si mateix el contracte de conversa privada amb l'autor, que està definit a `.agents/skills/universal-page/SKILL.md:36-37`.

**Proposta.** Resoldre les accions al domini o a la frontera de ruta, amb ID estable, identitat d'autor, URL pública vàlida i text pla. La pàgina rep les accions ja disponibles. Sense autor o URL publicable, l'estat de l'acció ha de ser explícit i comprensible. Mantindre els mateixos significats en pàgina i targeta; compartir àtoms visuals no resol tot el contracte. Les accions de la targeta estan construïdes separadament a `src/components/PedraSeca/organismes/UniversalCard.jsx:299-325`.

### F09 · P2 · La superfície de lectura i la capçalera no materialitzen tot el contracte visual

**Fet.** La regla reclama un bloc de títol contingut, logotip de fins a 600×600 i fons de lectura específic. El CSS del títol fixa marges, padding i radi literal de 36px; el logotip institucional limita l'amplària a 600px però no l'altura. L'editor reutilitza la classe circular d'avatar per al logotip. Fonts: `.agents/skills/universal-page/SKILL.md:61-70`; `src/css/layout.css:278-304`; `src/components/universal/UniversalEditorShell.jsx:260-269`; `src/css/modules.css:655`.

El contenidor de pàgina i l'article no assignen el fons de lectura en les seues regles; el detall de Workspace usa `--sdp-fons-app`. El token `--sdp-fons-lectura` està definit com a color clar, i el bloc de superfícies fosques no li aporta una equivalència. Fonts: `src/css/utilities.css:51-81`; `src/css/base.css:237-241`; `src/css/modules.css:292-300`; `src/css/tokens.css:41-45,304-319`.

**Proposta.** Aplicar les mides i superfícies del §6 al mateix marc en lectura i edició. Resoldre el token de lectura en tots dos temes abans d'usar-lo amb text de tema fosc. Un logotip de document no és un avatar: limitar ambdós eixos i conservar la proporció. Verificar els valors computats en navegador en la implementació; aquesta auditoria no afirma una captura visual concreta.

### F10 · P2 · La lectura publicada encara reconstrueix una segona fitxa dins del document

**Fet.** `PageDetailSection` aporta títol i subtítol a la pàgina i després crea una targeta interior amb imatge, etiquetes, un H2 que repetix el títol i contingut. `ItemDetailSection` afegix un altre `content-wrapper` dins del que ja crea `PageFrame`. Mur també en posa en els seus fills. Fonts: `src/sections/detail/PageDetailSection.jsx:38-65`; `src/sections/detail/ItemDetailSection.jsx:63-85`; `src/sections/mur/MurSection.jsx:118-127,134-137`; `src/components/universal/PageFrame.jsx:286-294`.

**Efecte.** No n'hi ha prou d'unificar Notes i Disseny: la visualització final continuaria tenint una anatomia diferent. No totes les repeticions impliquen el mateix padding computat, però sí dos propietaris de presentació per al mateix contingut.

**Proposta.** Projectar imatge, autoria, classificació i capçalera al model comú; reservar els fills al cos. Mantindre un slot de cos per a formularis, catàlegs o contingut especialitzat, sense permetre que torne a crear les barres o el títol principal.

### F11 · P2 · La interfície no diferencia prou publicar, privacitat, desar i informar

**Fet.** `showStatusToggle` mostra un desplegable informatiu amb una icona, sense operació de canvi d'estat dins del seu contingut. El trigger és un botó dins del `div role="button"` que crea `Dropdown`, sense text de nom al trigger aportat per la closca. `isPublished` arriba a `UniversalToolbar`, però no es recull en la seua signatura. Fonts: `src/components/universal/UniversalEditorShell.jsx:310-328`; `src/components/PedraSeca/molecules/Dropdown.jsx:19-36`; `src/components/universal/richText/UniversalRichTextToolbar.jsx:31-38`; `src/components/universal/UniversalToolbar.jsx:7-14,78-89`.

**Proposta.** Separar estat de publicació, permisos, activitat de desat i mode de lectura. Un indicador informatiu ha de dir què informa; no anomenar-lo commutador. Publicar ha d'anunciar l'estat pendent i impedir duplicacions mentre està en curs. Una sola superfície focusable per trigger, amb nom accessible. Els formats commutables han d'exposar `aria-pressed`; actualment la barra expressa l'estat amb classes (`src/components/universal/UniversalToolbar.jsx:35-75`).

**Taxonomia.** Notes construeix les etiquetes amb `SENSE_PARAMS`, de manera que no subministra les accions de filtratge previstes pel productor d'etiquetes. Fonts: `src/sections/notes/NotesEditor.jsx:7,21-31`; `src/sections/notes/NotesContext.jsx:23-40`. La proposta ha de connectar-les a la selecció de Workspace, preservant ordre carpeta → categoria → etiquetes i evitant duplicats.

**Data.** La closca passa `formattedDate` com a `dateTime` i substituïx el bloc dret per un `DateTimeControl` sense ISO ni callback; el control, a més, retorna `null` si només rep `dateTime`. Fonts: `src/components/universal/UniversalEditorShell.jsx:166-174,328`; `src/components/PedraSeca/atoms/controls.jsx:29-30,54-60`. Conservar ISO com a dada i formatar text per a presentar-lo; no reutilitzar una data localitzada com a instant canònic.

### F12 · P2 · El catàleg documenta la pàgina, però no valida la paritat entre modes

**Fet.** L'espècimen de pàgina presenta una taula de props i afirma que Disseny usa `chrome="full"`; el consumidor real usa `chrome="context"`. L'espècimen no munta ací una parella equivalent de lectura i edició. La prova de catàleg comprova càrrega i existència d'un element, no paritat visual ni interacció. Fonts: `src/sections/disseny/cataleg/detalls/EspecimenPage.jsx:4-13`; `src/sections/disseny/DesignSection.jsx:17-25`; `src/sections/disseny/cataleg/detalls/allLoaders.test.jsx:10-35`.

**Proposta.** Convertir aquest espècimen en la demostració real de les variants del mateix document, mantenint el catàleg existent. Mostrar cada pàgina de prova en una superfície aïllada per no niar una pàgina universal dins d'una altra ni acumular H1 al document principal. El catàleg ha de provar l'estructura compartida i els estats, no duplicar el JSX en una maqueta.

## 4. Proposta d'arquitectura final

### 4.1. Responsabilitats i dependències

| Peça existent | Responsabilitat final proposada | Allò que ha de delegar |
| --- | --- | --- |
| `UniversalWorkspace` | Categories, llista, selecció, columnes, estat de càrrega de la col·lecció i aïllament dels slots | Anatomia de document, motor editorial, desat |
| `NotesEditor` | Adaptar una nota, les capacitats i les operacions del domini | CSS, barres, contingut intern de capçalera |
| `DocumentEditor` | Sessió d'un document, esborrany, motor, canvi de mode i coordinació amb l'adaptador | Esquelet visual alternatiu i rutes de negoci |
| `UniversalPage` | Entrada pública única; validar i normalitzar dades/accions; compatibilitat temporal | DOM duplicat, peticions remotes i temporitzadors de desat |
| `PageFrame` | Únic arbre visual: eines opcionals, navegació, hero, autoria, capçalera, introducció, cos i índex | Backend, context de Notes, decisions de publicació |
| `useUniversalRichText` i adaptador TipTap | Integració amb el motor i emissió de canvis identificats | Política remota, temporització de negoci, navegació |
| `UniversalToolbar` | Renderitzar operacions disponibles i els seus estats accessibles | Coneixement de `AppGridContext`, TipTap o Notes |
| `UniversalEditorShell` | Durant la transició, traducció de l'API antiga al contracte únic, sense DOM propi | Qualsevol propietat exclusiva de l'estructura |
| `ContentProvider` | Compatibilitat dels consumidors que encara el necessiten | Nou magatzem paral·lel de documents |

Punts de partida verificats de la taula: `src/components/universal/workspace/UniversalWorkspace.jsx:30-119`; `src/sections/notes/NotesEditor.jsx:18-34`; `src/components/universal/DocumentEditor.jsx:25-130`; `src/components/universal/UniversalPage.jsx:7-78`; `src/components/universal/PageFrame.jsx:109-298`; `src/components/universal/UniversalToolbar.jsx:1-20`; `src/components/universal/ContentProvider.jsx:5-21`.

El resultat proposat és aquesta composició:

```text
Domini de la secció
├─ UniversalWorkspace, quan hi ha col·lecció i selecció
│  └─ detall
│     ├─ DocumentEditor, si hi ha sessió editable
│     │  └─ UniversalPage → PageFrame
│     └─ UniversalPage → PageFrame, per a consulta directa
└─ UniversalPage → PageFrame, per a pàgina autònoma

PageFrame: una anatomia comuna
├─ eines d'edició, només si hi ha operacions disponibles
└─ superfície de document
   ├─ navegació i accions
   ├─ hero
   ├─ autoria, data i estat
   ├─ capçalera: logotip, H1, classificació, copyright
   ├─ introducció: subtítol i entradeta
   └─ cos
```

El calaix d'índex és una capa d'interacció associada a la pàgina, fora del flux editorial. Cap branca de lectura o edició ha de tornar a construir els sis blocs del document. Les diferències legítimes es limiten als controls de les peces i a les eines d'edició.

### 4.2. Contracte públic proposat

**Aquesta taula és una API futura, no una descripció de propietats ja implementades.** Es conserva `layout` amb els valors existents i es proposen `mode`, `model`, `actions` i `editing` per concentrar els contractes avui dispersos.

| Entrada | Contracte proposat |
| --- | --- |
| `mode` | `read` o `edit`. No s'inferix de l'existència de callbacks, del tipus de secció ni d'`isPublished`. |
| `layout` | `page` o `contained`. Descriu allotjament i propietat de l'scroll, independentment del mode. |
| `model` | Identitat estable, capçalera normalitzada, representació editorial i text pla auxiliar, hero, logo, autoria opcional, data ISO, classificació i estat de publicació. Sense callbacks ni JSX de barres. |
| `actions` | Grups explícits de navegació, interacció i acció principal; cada acció declara identitat, nom accessible, disponibilitat, activitat i execució. |
| `editing` | En mode edició, operacions de camps, mitjans i format; estat de desat i capacitats per camp. No exposa el client de backend al marc. |
| `children` | Cos especialitzat quan no prové del document editorial. No pot reconstruir barres, hero, introducció o H1. |

Regles de validació proposades:

- `read` no activa cap control editable ni pujada de mitjans. `edit` requerix identitat i operacions aplicables; una capacitat absent no es simula amb un botó que no faça res.
- No admetre alhora un cos editorial i un cos especialitzat ambigu: triar-ne un en la normalització.
- Autor i logotip són dades diferents; ometre el logo no significa substituir-lo per l'avatar. Un camp ocult és absent en el model, no un node que acabarà retornant `null`.
- Les regions es deriven de dades i operacions: sense autoria no hi ha barra d'autoria; sense accions no hi ha barra buida. Els presets de secció es resolen abans del marc.
- La nova API no accepta `chrome`, `variant`, `showTopBars`, `hideHeader`, `showLogoUpload` ni nodes arbitraris de capçalera. Durant la transició, l'adaptador antic els traduïx de manera explícita. La combinatòria actual està declarada a `src/components/universal/PageFrame.jsx:109-143` i `src/components/universal/UniversalEditorShell.jsx:51-76`.
- `PageFrame` no ha de llegir el router ni el context de domini. `UniversalToolbar` rebrà l'acció de tornar a la llista en lloc de descobrir el Workspace pel seu compte; aquest acoblament existeix avui a `src/components/universal/UniversalToolbar.jsx:2-3,15-18`.

No cal un framework de plugins nou ni un context global addicional per aconseguir-ho. La universalitat ha de vindre de dades normalitzades, operacions limitades i un arbre compartit.

### 4.3. Sessió, esborrany i canvi de mode

**Proposta.** `DocumentEditor` conserva la sessió mentre no canvie la identitat del document. Alternar lectura i edició conserva esborrany, selecció i historial d'edició; no usa el mode ni la revisió remota com a `key`. El cos TipTap pot continuar muntat i passar a no editable per a la previsualització de la mateixa sessió. Una pàgina pública de consulta usa el mateix esquema de contingut i estils, sense haver de carregar el motor editorial.

La identitat de sessió ha d'incloure el domini i, quan corresponga, actor i tenant. La cua no ha de traslladar una operació pendent a una altra identitat perquè la UI haja canviat de selecció. El gestor actual organitza cues, bloquejos i revisions només per `noteId`; això justifica explicitar aquest requisit abans de generalitzar-lo a altres dominis (`src/sections/notes/GlobalSaveManager.js:3-19,22-38,77-82`). No s'afirma una col·lisió real de tenants en aquesta auditoria.

Flux final proposat:

1. L'entrada d'usuari actualitza immediatament l'esborrany identificat.
2. Una sola capa de persistència agrupa els canvis; el marc i els camps no programen desats remots independents.
3. El desat captura ID, camps i versió local; la resposta només confirma aquells valors.
4. Una edició posterior sobreviu a l'arribada de la resposta anterior.
5. Canviar de document buida els canvis pendents cap al gestor amb l'ID original, però no espera una xarxa lenta per permetre la navegació.
6. Publicar treballa sobre una instantània coherent, espera el resultat requerit pel domini i mostra l'error si falla. Tornar a lectura és una previsualització, no una publicació.
7. Tancar la pestanya no equival a desat remot confirmat. L'esborrany local i la possibilitat de recuperació han de tindre un contracte verificat.

**Transició segura.** Primer conservar els mecanismes existents i provar-los. Després eliminar la doble temporització en un canvi separat: la capçalera i el cos esperen 800 ms i el gestor global torna a esperar 600 ms. En el camí normal sense blur això suma aproximadament 1.400 ms abans d'iniciar l'operació, més espera de cua i xarxa. Fonts: `src/components/universal/UniversalEditorShell.jsx:94-103`; `src/components/universal/DocumentEditor.jsx:70-77`; `src/sections/notes/GlobalSaveManager.js:33-38,77-82`.

Cal retornar les promeses des de l'adaptació quan la sessió haja d'esperar una operació: `desaCamp` i `publica` invoquen però no retornen el resultat en l'estat actual (`src/components/universal/DocumentEditor.jsx:53-58,81-83`). El fallback d'error visual no substituïx la gestió d'errors asíncrons.

## 5. Proposta de propietat del DOM i de l'scroll

| Superfície | Propietari del scroll vertical | Altres contenidors | Barres de document |
| --- | --- | --- | --- |
| Pàgina autònoma, `layout=page` | Visor de l'aplicació (`app-main__content`) | `PageFrame` creix amb el contingut; no crea un altre scroll vertical | Sticky dins d'aquell visor |
| Document de Workspace, `layout=contained` | Superfície documental dins de `PageFrame` | Columna dreta i `DetailColumn` limiten mida i usen overflow ocult | Flux normal, segons la decisió de F07 |
| Eines d'edició d'un document contingut | No fan scroll vertical propi | Fila germana de la superfície documental, propietat de `PageFrame` | Visibles mentre s'edita; desapareixen en lectura |
| Detall especialitzat de Workspace sense pàgina | `DetailColumn`, segons contracte explícit del slot | No pot afegir un altre visor vertical arbitrari | Les que requerisca el detall |

L'última fila preserva els gestors que avui retornen detalls propis, com els d'Administració (`src/sections/admin/AdminSection.jsx:92-107,143-158`). La distinció s'ha de declarar a la frontera del slot, no inferir per nom de component ni per presència d'un editor.

El visor autònom existent és `app-main__content`, amb desbordament vertical a `src/css/layout.css:29-39`. Per això, en migrar el desplaçament inicial de les pàgines de detall, s'ha d'actualitzar la seua referència al contenidor correcte: avui `PageDetailSection` busca `.app-main` (`src/sections/detail/PageDetailSection.jsx:17-20`).

Regles d'implementació proposades:

- Cap scroll en `body` o arrel de l'aplicació, d'acord amb `.agents/skills/pedra-seca/SKILL.md:28-32`.
- Al detall contingut: `min-height:0` i `min-width:0` en la cadena de mida; una sola regió amb `overflow-y:auto`. El cos de l'editor creix amb el document.
- Cap `height:100%` en una successió de contenidors sense un pare de mida determinada. La barra de format consumix altura abans de calcular l'espai del document.
- Amplària i estil responsive calculats sobre l'espai disponible de la pàgina. Una columna de 320 px en un monitor ample també ha de comportar-se com una superfície estreta. La graella ja mesura amplària disponible (`src/components/layout/AppGridShell.jsx:71-85`); les regles de la barra blava, en canvi, inclouen una adaptació per viewport (`src/css/layout.css:448-467`).
- No usar `:has()` per decidir propietat ni afegir estils inline per compensar la jerarquia. La prohibició local està a `.agents/skills/app-grid-shell/SKILL.md:40-42`.
- La unitat de comprovació és cada superfície: poden desplaçar-se llista i document de manera independent; el que s'evita és niar dos scrolls del mateix document.

## 6. Proposta de regles d'UI Pedra Seca

### 6.1. Anatomia i geometria

Ordre únic: navegació → hero → autoria/data → bloc de títol → introducció → cos. Les eines de format són infraestructura d'edició fora d'aquest ordre documental. L'ordre de referència està descrit a `.agents/skills/universal-page/SKILL.md:28-70` i materialitzat en part a `src/components/universal/PageFrame.jsx:148-294`.

| Element | Regla final proposada | Referència local |
| --- | --- | --- |
| Barra blava | Tres grups estables: navegació, interacció i acció principal; índex accessible; accions amb subjecte real | `.agents/skills/universal-page/SKILL.md:32-42` |
| Hero | 100% de l'amplària del document, sense padding lateral, proporció original i altura automàtica; excepció explícita a la imatge quadrada | `.agents/skills/universal-page/SKILL.md:44-53`; `.agents/skills/pedra-seca/SKILL.md:76-77` |
| Autoria | Una única barra amb autor, poble, instant ISO formatat i estat; no duplicar-la en els fills | `.agents/skills/universal-page/SKILL.md:55-59` |
| Bloc del títol | Centrat, amplària màxima proposada de 800 px i adaptable a columna estreta; H1, classificació i copyright junts; enganxat per dalt a autoria | `.agents/skills/universal-page/SKILL.md:61-66` |
| Logo de document | Fins a 600×600 px, `contain`, dimensió automàtica i espai vertical; cap retall circular heretat d'avatar | `.agents/skills/universal-page/SKILL.md:64`; `src/css/modules.css:655` |
| Introducció | Subtítol i entradeta fora del bloc de títol; absents si no hi ha dades o capacitat de crear-los | `src/components/universal/PageFrame.jsx:286-291` |
| Cos editorial | Mesura màxima de `--sdp-measure` (68ch); mateixes classes de prosa en lectura i edició; figures i taules poden tindre excepcions locals | `.agents/skills/pedra-seca/SKILL.md:55-61`; `src/css/tokens.css:215-216` |
| Espaiat i controls | Escala existent `--sdp-space-*`; objectiu interactiu mínim de `--sdp-touch` i preferència còmoda quan hi haja espai | `src/css/tokens.css:174-177,208-212` |

### 6.2. Decisions per resoldre divergències del sistema

**Superfície del títol.** Usar `--sdp-fons-targeta`: blanc en el tema clar i superfície de targeta en el fosc. La menció literal de blanc en la skill de pàgina s'ha de reconciliar amb el contracte de tokens semàntics, sense introduir un blanc immutable en un component de lectura. Fonts del desacord: `.agents/skills/universal-page/SKILL.md:62`; `.agents/skills/pedra-seca/SKILL.md:34-46`; `src/css/tokens.css:304-319`.

**Radi.** La proposta reutilitza `--sdp-radi-xl`, actualment 28 px. Cal retirar els 36 px literals i actualitzar la referència de 32 px del manual. Així no s'inventa un tercer token per a corregir una sola pantalla. Si producte exigix exactament 32 px, s'ha de formalitzar com a decisió del sistema abans de codificar-ho. Fonts: `src/css/layout.css:278-284`; `src/css/tokens.css:143-148`; `.agents/skills/universal-page/SKILL.md:62`.

**Ombra.** Mantindre només la separació tènue del bloc de títol a través de `--sdp-ombra-1`, com a excepció documentada de la pàgina; cap extensió a targetes normals. Cal registrar aquesta excepció perquè la skill general restringix les ombres decoratives. Fonts: `.agents/skills/universal-page/SKILL.md:62`; `.agents/skills/pedra-seca/SKILL.md:63-66`; `src/css/layout.css:283`.

**Lectura en fosc.** Donar valor semàntic de tema a `--sdp-fons-lectura` i aplicar-lo a la superfície documental. No aplicar el seu valor clar actual darrere de text clar. Fonts: `src/css/tokens.css:45,308-319`. Comprovar contrast real del cos, metadades, selecció i focus en tots dos temes.

**Tipografia.** Reutilitzar els tokens actuals durant la migració, sense valors locals nous: el codi declara 1,21 per a línia compacta i 1,65 per a editorial, mentre la skill diu 1,2 i 1,6. La reconciliació del manual s'ha de fer al mateix lliurament. Fonts: `src/css/tokens.css:204-216`; `.agents/skills/pedra-seca/SKILL.md:61`.

### 6.3. Interacció, accessibilitat i estats

**Proposta.** Un H1 de document, sense H1 importats al cos; camps editables amb nom, ajuda i error; controls d'imatge amb botons natius i text accessible; formats commutables amb estat anunciat; cap focus robat en desar. La selecció d'un altre document pot moure el focus com a acció de navegació, però cada tecla o resposta remota no.

La superfície ha de distingir: càrrega inicial, cap selecció, document buit editable, lectura, edició modificada, desat en curs, desat confirmat, error de desat, conflicte, pujada de mitjà i publicació en curs. Aquests són estats proposats d'experiència, no noms d'enums existents. Publicat/privat, lectura/edició i sincronitzat/pendent són eixos diferents.

La pujada ha d'exposar l'estat real i evitar operacions duplicades. El hook actual ja retorna `isUploading`, però la closca construeix els controls sense utilitzar-lo (`src/hooks/useHeroImageHandler.js:22-24,39-62,75-82`; `src/components/universal/UniversalEditorShell.jsx:260-308`). Les notificacions d'error han d'arribar a la persona: el valor per defecte de NotesEditor només escriu a consola (`src/sections/notes/NotesEditor.jsx:8-9,18`).

Canviar de mida, obrir un calaix, alternar mode i rebre una confirmació de desat no han de reconstruir la sessió. El catàleg ha de permetre provar tots aquests estats sense backend.

## 7. Proposta de retrocompatibilitat

**Resposta a la incògnita de l'encàrrec:** mantindre compatibilitat de font per als consumidors locals mentre es migren, sense prometre compatibilitat permanent amb totes les combinacions antigues. No hi ha en aquesta auditoria evidència suficient per declarar que cap integrador extern consumix aquestes exportacions directament.

L'adaptació ha de viure en un únic punt, amb el següent comportament documentat:

| Entrada antiga | Traducció proposada |
| --- | --- |
| `title`, `subtitle`, `lead`, `heroImage`, autoria i dates planes | Normalitzar al model; text pla separat de representació editorial |
| `topBarData` | Absorbir les dades i traduir les operacions conegudes; els nodes de regions completes només es toleren temporalment en el camí antic |
| `chrome=full` o `context` | Mateixa anatomia de barres que avui; conservar inicialment el comportament antic de cada consumidor abans d'adoptar la política unificada |
| `chrome=system` | Navegació i capçalera institucional; autoria absent si no hi ha dades |
| `chrome=page` | Capçalera/cos sense les barres heretades |
| `chrome=none` | Sense capçalera ni barres; revisar qualsevol hero heretat abans de passar a cos especialitzat |
| `showTopBars=true` | Conservar l'equivalència amb `full` durant la transició |
| `hideHeader` | Ometre la regió de capçalera en el model normalitzat |
| `variant=embed` i `layout=contained` | Separar la semàntica d'allotjament de la de mode; deixar un únic contracte de scroll |
| `showLogoUpload` | Capacitat d'editar logo; independent de la presència d'un logo visible |
| `showStatusToggle` | Traduir a indicador o acció real, segons el consumidor; no perpetuar el nom enganyós |

La taula parteix de les branques existents de `src/components/universal/PageFrame.jsx:109-143,190-198,233-244` i `src/components/universal/UniversalEditorShell.jsx:70-76,260-328`. En particular, `chrome=none` no suprimix avui necessàriament el hero, perquè aquest es renderitza fora de les condicions de les barres i capçalera; la traducció ha de comprovar el resultat abans de simplificar-lo.

No s'ha de mantindre una segona implementació completa de pàgina amb l'excusa de compatibilitat. L'adaptador antic ha de retornar el mateix marc. La retirada queda condicionada a: zero consumidors locals de l'API antiga, catàleg actualitzat, validació de la integració hoste i proves de comportament aprovades. El nom públic `UniversalPage` es conserva.

## 8. Pla d'implementació per a IAIA MarIA

Cada fase ha de ser un canvi revisable. Les referències indiquen els punts existents que es tocarien; **aquesta auditoria no els modifica**.

| Fase | Treball concret | Criteri per avançar |
| --- | --- | --- |
| 0 · Fixar la referència | Capturar l'arbre local i les modificacions en curs; acordar la decisió de barres, radi i temes; registrar els consumidors de l'annex | No començar sobre una base que haja canviat sense revisar les cites |
| 1 · Tancar contractes crítics | Resoldre F01–F04 amb proves específiques; especialment el callback de confirmació i l'esquema HTML | Desat confirmat reconcilia esborrany; formats visibles sobreviuen; índex accessible |
| 2 · Construir l'espècimen real | Actualitzar `EspecimenPage` i la demostració de Disseny amb un mateix document de lectura i edició en superfícies aïllades | Anatomia, estats i geometria revisables sense backend |
| 3 · Normalitzar l'entrada | Consolidar la frontera de `UniversalPage`; afegir validació del contracte nou i adaptació del vell | Proves de precedència, absència, dades i disponibilitat d'accions |
| 4 · Unificar el marc | Consolidar regions en `PageFrame`; centralitzar propietat d'scroll i CSS; traslladar les eines al slot del marc | Un arbre d'anatomia i un scroll per superfície; cap regressió de columna estreta |
| 5 · Migrar Notes | `DocumentEditor` entrega dades i operacions al marc; `NotesEditor` conserva el domini; convertir la closca antiga en adaptador | Escriure, canviar ràpidament de nota, previsualitzar i publicar sense perdre ni barrejar esborranys |
| 6 · Migrar Perfil i lectura | Migrar `DetallAjust`, `PageDetailSection`, `ItemDetailSection`, textos i seccions restants | Formularis especialitzats, autoria, imatges i rutes mantinguts; cap segona capçalera |
| 7 · Consolidar persistència | Si les proves de F03 i canvi d'identitat ja passen, retirar la doble temporització i formalitzar confirmació, reintent i conflicte | Una sola política de cua, promeses propagades, desat mai anunciat prematurament |
| 8 · Retirar compatibilitat | Eliminar adaptadors i CSS sense consumidors; reconciliar les tres skills i el catàleg amb el resultat | Cens de referències net, proves funcionals i visuals aprovades, integració hoste verificada |

Ancoratges d'implementació: `src/sections/disseny/cataleg/detalls/EspecimenPage.jsx:4-13`; `src/sections/disseny/DesignSection.jsx:10-26`; `src/components/universal/UniversalPage.jsx:7-78`; `src/components/universal/PageFrame.jsx:109-298`; `src/components/universal/DocumentEditor.jsx:25-130`; `src/sections/notes/NotesEditor.jsx:18-34`; `src/sections/profile/DetallAjust.jsx:313-340`; `src/sections/detail/PageDetailSection.jsx:38-65`; `src/sections/detail/ItemDetailSection.jsx:63-85`; `src/sections/notes/GlobalSaveManager.js:22-83`.

La fase 2 ha d'emprar les peces reals del sistema abans de connectar canvis de negoci nous, conforme al procediment local de prototipatge (`.agents/skills/pedra-seca/SKILL.md:79-82`). Els ajustos crítics sobre components existents de la fase 1 no requerixen inventar un component visual nou.

**Reversibilitat proposada.** Migrar consumidor a consumidor; mantindre l'adaptador antic fins que totes les seues entrades estiguen substituïdes. Si falla una comprovació, revertir aquella migració de consumidor, sense desfer canvis de dades ja validats ni tocar les modificacions alienes. No combinar canvi d'esquema persistent, nou motor de text i nou layout en una única entrega.

## 9. Matriu d'acceptació

Aquesta matriu és el treball de verificació pendent per a la implementació. No s'ha executat en aquesta auditoria.

| Cas | Resultat exigible |
| --- | --- |
| Mateix document en lectura i edició | Mateix ordre de regions, amplàries, logo, autoria, classificació i prosa; només canvien controls i eines |
| Pàgina autònoma / detall contingut | Scroll en el propietari declarat; barres segons §5; cap desbordament sobre les altres columnes |
| Amplàries de contingut 320, 480, 720 i 1.100 px | Accions accessibles, text sense retall i cap scroll horitzontal general; provar també columna estreta en viewport ample |
| Zoom al 200% i tema clar/fosc | Contingut llegible, controls operables, focus visible i contrast mesurat |
| Teclat i lector de pantalla | Índex anunciat, Escape funcional, focus de retorn/destí correcte; cap botó dins d'un altre control interactiu |
| H1, camps buits i HTML enganxat | Un H1 de pàgina; cap H2/paràgraf ornamental buit; blocs no permesos normalitzats sense perdre text |
| Ratllat, llistes, citació, enllaç, codi i imatges | Edició → sanejament → desat → lectura conserva l'esquema admés; res s'oferix si es perd en el trajecte |
| Editar A i seleccionar B abans de 800 ms | Els canvis d'A continuen associats a A; B mostra les seues dades; no hi ha sobreescriptura buida |
| Resposta remota anterior després d'una nova pulsació | La confirmació no elimina el nou esborrany local |
| `null`, cadena buida i acció absent | Resultat determinista; cap fallback de ruta o d'autoria inesperat en la nova API |
| Lectura → edició → lectura del mateix document | Esborrany, posició i historial conservats; cap publicació ni desat fictici pel canvi de mode |
| Pujada pendent i canvi de document | Resultat associat a la identitat original, indicador visible, error recuperable i cap acció duplicada |
| Publicar durant un desat o error de xarxa | Instantània coherent i estat explícit; no anunciar èxit abans de confirmació |
| Canvi d'actor/tenant amb operacions pendents | Cap aplicació de respostes a la sessió nova; cues i revisions amb abast correcte |
| Recarregar o tancar després d'editar | Recuperació conforme al contracte acordat; el flush d'eixida no es considera garantia remota |
| Filtres, etiquetes, enrere/avant i deep links | Selecció coherent sense canvis d'editor provocats per cada actualització local |
| Perfil, Administració i catàleg | Continuïtat dels cossos especialitzats; no carregar TipTap si no hi ha sessió editorial |

Les proves existents són punts de partida, no acreditació d'aquesta matriu: el reducer comprova sincronització d'estat (`src/components/universal/workspace/workspaceState.test.js:4-29`); NotesDataContext comprova creació i error de creació (`src/sections/notes/NotesDataContext.test.jsx:8-20`); el catàleg comprova càrrega (`src/sections/disseny/cataleg/detalls/allLoaders.test.jsx:10-35`); els controls canònics inclouen proves de formulari i diàleg (`tests/ui/components-canonics.test.jsx:25-38,96-107`). No es deduïx d'aquestes proves que estiguen coberts els riscos d'edició i desat identificats.

Les proves de UI noves s'han d'executar amb el runtime real del projecte, que configura Preact i els àlies de React a `vite.config.js:20-23,35-55`. Les comprovacions de scroll, mida, contrast i focus real requerixen navegador durant la implementació; no es poden substituir per una prova que només trobe un node en JSDOM.

## 10. Annex de consumidors per a la migració

Inventari local de llocs de composició rellevants, comprovat amb lectura i anàlisi sintàctica del JSX. No inclou una promesa sobre consumidors fora del repositori.

| Consumidor | Ús verificat i cita |
| --- | --- |
| Notes | Workspace amb detall editable: `src/sections/notes/NotesSection.jsx:83-104`; adaptador: `src/sections/notes/NotesEditor.jsx:18-34` |
| Editor documental | Closca amb dades i cos TipTap: `src/components/universal/DocumentEditor.jsx:107-130` |
| Closca antiga | Pàgina `context`, `embed`, `contained`: `src/components/universal/UniversalEditorShell.jsx:161-210` |
| Disseny | Pàgina de detall `context` i Workspace: `src/sections/disseny/DesignSection.jsx:17-25,59-66` |
| Perfil editable | Workspace: `src/sections/profile/PerfilShell.jsx:132-138`; closca: `src/sections/profile/DetallAjust.jsx:313-340` |
| Administració | Dos Workspaces i una pàgina general: `src/sections/admin/AdminSection.jsx:92-107,143-158,169-175` |
| Mur | Context amb pàgina per defecte o continguda: `src/sections/mur/MurSection.jsx:106-137` |
| Mercat | Configuració via context: `src/sections/mercat/MercatSection.jsx:21-32` |
| Pàgina de detall | `system` i cos propi: `src/sections/detail/PageDetailSection.jsx:38-65` |
| Element de detall | Error `system` i lectura `full`: `src/sections/detail/ItemDetailSection.jsx:40-51,63-85` |
| Textos | `full` per defecte i metadades: `src/sections/text/TextSection.jsx:28-47` |
| Connectar | `system`: `src/sections/connectar/ConnectarSection.jsx:190-195` |
| Control | `system`: `src/sections/control/ControlSection.jsx:48-59` |
| Dispositius | `system`: `src/sections/dispositius/DevicesSection.jsx:235` |
| Multimèdia | `system`: `src/sections/multimedia/MultimediaSection.jsx:25-30` |
| Onboarding | `system`: `src/sections/onboarding/OnboardingSection.jsx:71-77` |
| Població | `system`: `src/sections/poblacio/PoblacioSection.jsx:28-34` |
| Pobles | `system`: `src/sections/pobles/PoblesSection.jsx:19-25` |
| Perfil públic | `system`: `src/sections/profile/ProfileSection.jsx:12-17` |
| Realitat | `system`: `src/sections/realitat/RealitatSection.jsx:62-70` |
| Cerca | `system`: `src/sections/search/SearchSection.jsx:52-60` |
| Traduccions | `system`: `src/sections/translations/TranslationsSection.jsx:12-20` |
| Control de xat | `system`: `src/sections/xat/XatControlSection.jsx:8-16` |
| Pàgina no trobada | Mode per defecte: `src/pages/NotFoundPage.jsx:17-22` |

El Xat també és un consumidor indirecte del camí de textos i del context, que cal tindre en compte en retirar-los: `src/sections/xat/XatSection.jsx:166,341,354`.

## 11. Límits, decisions pendents i registre de verificació

Queden pendents de decisió de producte: la preferència vigent de barres fixes dins del detall, l'acceptació del radi del token existent i l'abast contractual dels integradors externs. L'informe aporta una opció concreta per a cada punt; no pressuposa aprovació humana. No s'ha contrastat la proposta amb una resposta de Claude ni s'afirma consens del Consell.

Comprovacions realitzades:

- Lectura dels fitxers i contractes citats amb numeració de línies, sobre l'arbre de treball real.
- Inventari de llocs JSX de `UniversalPage`, `UniversalEditorShell`, `DocumentEditor` i `UniversalWorkspace` mitjançant el parser local, sense generar codi.
- Prova en memòria del callback de confirmació de `GlobalSaveManager`: confirma la incompatibilitat de F03, sense xarxa ni dades reals.
- Prova en memòria del sanejador: confirma la pèrdua de ratllat i l'admissió d'H1 de F02.
- Contrast SHA-256 de 498 fitxers de codi, eines i instruccions locals: cap diferència respecte de la captura inicial.
- Verificació automàtica de 192 cites distribuïdes en 67 fitxers: totes les rutes i els intervals de línies existixen. També s'han comprovat els vincles locals del document. Aquesta comprovació de rangs complementa la lectura; no substituïx la revisió del significat de les cites.
- Porta de frontmatter executada en mode de lectura amb `node tooling/wiki/tractor-frontmatter.mjs --estricte --arrels=_wiki_de_poble/04_escriptori --json`: revisa 29 documents i acaba amb codi 1 per incidències dels documents previs i dues incidències agregades sobre claus antigues. No assenyala cap incidència d'aquest informe. La descripció té 114 caràcters i els dos tags pertanyen al vocabulari admés. No s'ha executat cap correcció automàtica.

No s'ha executat build ni la bateria completa de tests. Tampoc s'ha executat el tancament general ni s'ha actualitzat l'estat compartit: la petició limita l'escriptura a aquest informe. La regla general de tancament està a `AGENTS.md:26-27`, però el seu script executa sincronització de skills (`tooling/gates/tancament.mjs:18-21`) que escriu altres documents (`tooling/wiki/sincronitzar_skills.mjs:24-42,47-57`). Aplicar-la ací excediria la contenció específica de l'encàrrec. Els vincles d'aquest informe ancoren les seues fonts; no s'ha alterat l'índex compartit.

### Bateria de veritat

- [x] Les afirmacions sobre codi tenen cites locals `ruta:linies`.
- [x] Els fitxers, funcions i variables descrits com a existents s'han verificat; l'API futura està marcada com a proposta.
- [x] Els riscos deduïts es distingixen dels defectes comprovats i de la validació visual pendent.
- [x] Pedra Seca s'ha interpretat com a Sistema de Disseny.
- [x] Cap cerca web, navegador ni recuperació externa.
- [x] Cap modificació, addició o eliminació de codi font; l'única escriptura de lliurament és aquest informe.
- [x] Lectura prèvia de la plantilla local i frontmatter adaptat a informe: `_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_CONSELL.md:34-69`.

La condició final d'èxit de la implementació és verificable: **una sola anatomia documental, una sola propietat d'scroll per superfície i cap pèrdua de semàntica o d'esborrany quan canvia el mode o el document.**
