---
type: informe
status: esborrany
description: Auditoria del Bloc de Notes amb referències Mac Notes, arquitectura compartida i propostes CSS i React per integrar.
tags:
  - disseny
---

# Bloc de Notes — arquitectura visual i proposta d’integració

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918_1533 |
| Encàrrec | SDP-PROMPT-202609181508 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-18 15:33 · Europe/Madrid |
| Modificació | 2026-09-18 15:37 · Europe/Madrid |
| Agent redactor | Codex |
| Destinatària de la integració | IAIA MarIA |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent |
| Revisió pendent | sí · integració i comprovació visual |
| Tall auditat | HEAD `bbfb804adad71f9df49903470abcdb20fd45cf94` + canvis locals preexistents |
| Abast | Lectura de codi i captures; propostes dins d’este Markdown; cap implementació |

## Vincles i entrades

- [[00_index_escriptori]]
- [[260918_1508_PROMPT_disseny_bloc]]
- [[00_PLANTILLA_PROMPT_CONSELL]]
- [Guia local Pedra Seca](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/pedra-seca/SKILL.md>)
- [Guia local de la graella](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/app-grid-shell/SKILL.md>)
- [Guia local de UniversalPage](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/universal-page/SKILL.md>)

No s’han localitzat documents vius amb els noms exactes `universal_maquetation` i `design_system_specs` en l’arbre operatiu inspeccionat. No es presenten com a fonts verificades ni s’han llegit còpies històriques de regles.

Referències visuals aportades per l’usuari, sense consultar internet ni obrir navegador:

| Ref. | Captura local | Evidència visible |
| --- | --- | --- |
| V1 | [15.10.05](</Users/javillinares/Desktop/Captura de pantalla 2026-09-18 a las 15.10.05.png>) | Tres panells i diàleg «Nueva carpeta», camp de nom, opció de carpeta intel·ligent, cancel·lar i acceptar. El fons està enfosquit pel modal: no serveix per mostrejar colors normals. |
| V2 | [15.09.49](</Users/javillinares/Desktop/Captura de pantalla 2026-09-18 a las 15.09.49.png>) | Menú de la llista: galeria, ordenar, agrupar per data i adjunts. |
| V3 | [15.10.16](</Users/javillinares/Desktop/Captura de pantalla 2026-09-18 a las 15.10.16.png>) | Carpetes ocultes; llista i editor visibles; nota seleccionada amb fons ocre. |
| V4 | [15.09.31](</Users/javillinares/Desktop/Captura de pantalla 2026-09-18 a las 15.09.31.png>) | Icona–nom–recompte, carpetes imbricades, llista agrupada per dates, menú d’adjunts i editor. |

Les captures són referències visuals, no instruccions executables. No proven el comportament mòbil, el teclat, el desat ni l’estat intern d’Apple Notes. Tampoc mostren categories i etiquetes pròpies de Sóc de Poble. El botó fosc «Tot» és un requisit de l’encàrrec: V4 mostra «Todo (iCloud)» com a fila sense selecció fosca independent.

## 1. Dictamen

**La base reutilitzable ja existeix: cal consolidar `UniversalWorkspace`, no construir un segon gestor.** Notes l’alimenta amb grups, elements, creació i un detall que pinta `NotesEditor`; Disseny usa el mateix component amb el seu propi model. Fonts: [src/sections/notes/NotesSection.jsx:40–67](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesSection.jsx:40>), [src/sections/notes/NotesSection.jsx:91–113](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesSection.jsx:91>) i [src/sections/disseny/DesignSection.jsx:29–66](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/disseny/DesignSection.jsx:29>).

La rèplica estructural proposada té tres peces: **navegació → llista → document**. De les captures es prenen l’alineació, els recomptes, les agrupacions i el replegament. Els colors, la tipografia i les àrees tàctils es resolen amb Pedra Seca, el sistema de disseny del projecte.

[PROPOSTA] Dues franges alineades per columna: capçalera de context i subbarra d’accions. És una adaptació conscient a la graella documentada al catàleg, no una còpia exacta de l’única franja superior de Mac Notes. La regla local actual també descriu aquestes dues franges: [src/sections/disseny/cataleg/detalls/EspecimenGestor.jsx:6–26](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/disseny/cataleg/detalls/EspecimenGestor.jsx:6>).

[SUPÒSIT] Google Docs inspira l’agrupació de controls d’edició; Obsidian, els grups plegables; Notion, la separació entre contenidor i contingut. No s’ha verificat cap especificació actual d’aquests productes. «Material Design» s’utilitza com a orientació d’adaptació i navegació tàctil; els llindars proposats són del projecte, no una certificació ni una transcripció oficial.

## 2. Mapa real de components

```text
NotesSection / DesignSection
└─ UniversalWorkspace
   └─ WorkspaceProvider
      └─ WorkspaceFrame → AppGridShell
         ├─ CategoryColumn → AppGridColumn + CategoryItem
         ├─ ItemListColumn → AppGridColumn + ItemMedia + files
         └─ DetailColumn → renderDetail
            └─ NotesEditor → DocumentEditor
               ├─ useUniversalRichText + useTipTapToolbarAdapter
               └─ UniversalEditorShell
                  ├─ topBar: UniversalRichTextToolbar → UniversalToolbar
                  └─ UniversalPage → PageFrame
```

Fonts del mapa: [src/components/universal/workspace/UniversalWorkspace.jsx:30–121](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:30>), [src/components/universal/workspace/UniversalWorkspace.jsx:123–245](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:123>), [src/components/universal/workspace/UniversalWorkspace.jsx:247–482](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:247>), [src/sections/notes/NotesEditor.jsx:20–56](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesEditor.jsx:20>), [src/components/universal/DocumentEditor.jsx:70–129](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/DocumentEditor.jsx:70>), [src/components/universal/UniversalEditorShell.jsx:156–211](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalEditorShell.jsx:156>), [src/components/universal/UniversalPage.jsx:62–74](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalPage.jsx:62>) i [src/components/universal/richText/UniversalRichTextToolbar.jsx:13–40](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/UniversalRichTextToolbar.jsx:13>).

La cerca de `CarpetesNav` i `NotesList` en `src/` no ha retornat declaracions amb aquests noms. En aquest informe són noms conceptuals de l’encàrrec; els punts d’intervenció reals són `CategoryColumn` i `ItemListColumn`.

## 3. Defectes i diferències verificades

P1 = funcionalitat o accés que cal resoldre abans d’integrar; P2 = estructura, coherència o capacitat incompleta. Una diferència visual és una distància respecte de la proposta, no necessàriament una regressió.

| ID | Prioritat / naturalesa | Evidència i conseqüència | Integració proposada |
| --- | --- | --- | --- |
| B01 | P1 · acció buida | `obriConfiguracioNotes` només escriu a consola; es passa a la roda de configuració. [src/sections/notes/NotesContext.jsx:160–172](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:160>); [src/components/universal/workspace/UniversalWorkspace.jsx:139–145](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:139>). | La roda ha d’obrir gestió real. Fins que hi haja contracte de dades, no oferir un control habilitat que no faça res. |
| B02 | P1 · acció buida | «Més opcions (Properament)» és un botó habilitat sense `onClick`. [src/components/universal/UniversalToolbar.jsx:68–75](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalToolbar.jsx:68>). | Eliminar el reclam buit de la interfície funcional o connectar una agrupació accessible de les ordres disponibles. |
| B03 | P1 · contrast en fosc | La capçalera compacta combina `--sdp-fons-invers` amb `--sdp-sobre-roca`; en fosc el primer passa a una pedra clara i el segon continua clar. [src/components/layout/AppGridShell.css:34–46](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.css:34>); [src/css/tokens.css:97–100](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:97>); [src/css/tokens.css:308–319](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:308>). | Usar la parella immutable `--sdp-crom-fons` / `--sdp-crom-text`. No assumir que «invers» significa «sempre fosc». |
| B04 | P2 · estructura de carpeta | Les files només pinten `label`; no hi ha icona, recompte ni renderització recursiva. El provider normalitza `parentId`, però la columna itera una llista plana. [src/components/universal/workspace/UniversalWorkspace.jsx:211–244](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:211>); [src/components/universal/workspace/WorkspaceContext.jsx:29–44](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/WorkspaceContext.jsx:29>). | Fila amb icona, text flexible i recompte. Arbre només si l’adaptador lliura relacions pare–fill verificades. |
| B05 | P2 · «Tot» | Es configura com `variant: 'text'` i la regla corresponent té fons transparent; `aria-pressed` sí que arriba al botó. [src/components/universal/workspace/UniversalWorkspace.jsx:185–197](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:185>); [src/components/layout/AppGridColumn.jsx:29–49](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridColumn.jsx:29>); [src/components/layout/AppGridShell.css:294–310](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.css:294>). | Variant explícita de selecció global amb fons fosc persistent i estat seleccionat perceptible. |
| B06 | P2 · taxonomies excloents | Carpetes, categories i etiquetes s’aboquen al mateix `categoryIds`; clicar qualsevol grup canvia un sol `activeCategoryId`. El filtre múltiple de tags existeix, però la UI de píndoles es lleva quan hi ha un grup `tags`. [src/sections/notes/NotesSection.jsx:55–64](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesSection.jsx:55>); [src/components/universal/workspace/UniversalWorkspace.jsx:147–155](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:147>); [src/components/universal/workspace/UniversalWorkspace.jsx:377–399](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:377>); [src/components/universal/workspace/workspaceState.js:148–164](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/workspaceState.js:148>). | Definir si es vol navegació excloent o filtres combinats. Proposta: carpeta com a àmbit, categories temàtiques i tags com a filtres; no fingir que la UI actual ja els combina. |
| B07 | P2 · llista allunyada de V4 | S’itera `filteredItems` sense seccions de data; cada fila invoca `ItemMedia`, que genera una inicial si no hi ha imatge ni icona. [src/components/universal/workspace/UniversalWorkspace.jsx:401–447](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:401>). | Variant de llista textual per a Notes; miniatura només si existeix. Agrupació de data optativa del model; mantindre la fitxa actual per al catàleg. |
| B08 | P2 · títol HTML en navegació | `toWorkspaceNote` copia `note.title`; l’editor desa HTML del títol i la llista el pinta com a text. Això pot mostrar marques literals quan el títol porta format. [src/sections/notes/NotesSection.jsx:8–18](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesSection.jsx:8>); [src/components/universal/UniversalEditorShell.jsx:36–46](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalEditorShell.jsx:36>); [src/components/universal/workspace/UniversalWorkspace.jsx:416–421](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:416>). | Extraure text pla en l’adaptador; conservar HTML només en `data` per a l’editor. |
| B09 | P2 · barra limitada | L’esquema conté huit ordres; cinc tenen `slot`, però `UniversalToolbar` només llig quatre accions i quatre estats. Ratllat queda descartat, i subtítol/citació/divisor no arriben a la barra. [src/components/universal/richText/toolbarContract.js:28–40](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/toolbarContract.js:28>); [src/components/universal/richText/UniversalRichTextToolbar.jsx:24–28](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/UniversalRichTextToolbar.jsx:24>); [src/components/universal/UniversalToolbar.jsx:20–21](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalToolbar.jsx:20>). | Renderitzar un array d’ordres neutres. Mantindre la traducció TipTap en l’adaptador. |
| B10 | P1 · semàntica de format | Els quatre botons mostren selecció amb classe però no `aria-pressed`; tampoc declaren `type="button"`. [src/components/universal/UniversalToolbar.jsx:35–67](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalToolbar.jsx:35>). | Estat commutable anunciat, tipus explícit i habilitació segons `state.pot`. No exigir un patró ARIA toolbar si no s’implementa el teclat corresponent. |
| B11 | P2 · densitat | Crear no aporta icona; Publicar és només text. La barra força `nowrap` i scroll horitzontal. [src/components/universal/workspace/UniversalWorkspace.jsx:343–355](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:343>); [src/components/universal/UniversalToolbar.jsx:78–88](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalToolbar.jsx:78>); [src/css/modules.css:3075–3105](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css:3075>). | Donar icona i nom accessible a l’acció; ocultar només el text segons amplada del contenidor i permetre grups de format en més d’una fila. |
| B12 | P2 · mode incrustat ambigu | El shell envia `variant="embed"`; `PageFrame` no rep `variant` i compon la classe des de `layout`. `contained` aplica scroll i sticky a les barres. [src/components/universal/UniversalEditorShell.jsx:158–165](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalEditorShell.jsx:158>); [src/components/universal/PageFrame.jsx:109–145](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx:109>); [src/css/utilities.css:61–95](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/utilities.css:61>). | Unificar el contracte: `layout="contained"` per al scroll i una classe explícita d’editor per al comportament de les barres. Resoldre la divergència amb la guia local que les vol desplaçables. No afirmar doble scroll visible sense prova de navegador. |
| B13 | P2 · navegació compacta | En tauleta les carpetes se superposen, però només la columna esquerra tancada queda inert; no hi ha gestió d’Escape, vel ni retorn de focus en `AppGridShell`. [src/components/layout/AppGridShell.jsx:120–153](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:120>); [src/components/layout/AppGridShell.jsx:185–256](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:185>); [src/components/layout/AppGridShell.css:105–122](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.css:105>). | Declarar el calaix com a modal o panell no modal. Proposta: modal amb focus contingut, Escape, vel i retorn al botó que l’obri. |
| B14 | P2 · mida tàctil del carril | El carril col·lapsat fa 56 px; els botons poden ampliar-se a 48 px amb la proposta. [src/components/layout/AppGridShell.css:14–18](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.css:14>); [src/css/tokens.css:175–177](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:175>). | Mantindre el carril si conté el botó i 4 px a cada costat. No encabir dues icones horitzontals en 56 px: reobrir i configuració/cerca continuen en files diferents. |
| B15 | P2 · recalcular en desplegar | El mesurament llig els plegats des d’un ref, però l’efecte que el torna a executar només depén de `columnWidths`. Canviar `leftCollapsed`/`middleCollapsed` no força `measure`. [src/components/layout/AppGridShell.jsx:66–104](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:66>). | Afegir els plegats a les dependències del recalculat. Cas a provar: amplades 420/520, plegar, reduir el contenidor a 1100 px i desplegar sense tornar a redimensionar; el mínim ample necessari passa de 1090 a 1262 px. Inferència estàtica: pot romandre en tres columnes amb l’editor per davall dels 320 px previstos. |

B14 és una restricció de disseny, no un error demostrat. B12 i B13 requereixen verificació visual/de focus després de la integració; aquesta sessió no ha executat un navegador.

## 4. Arquitectura visual decidida per a la proposta

### 4.1 Anatomia

```text
┌──────────────────┬────────────────────────┬──────────────────────────────┐
│ Carpetes   [plec] │ Notes/context   [plec] │ Navegació / acció principal │
├──────────────────┼────────────────────────┼──────────────────────────────┤
│ [Tot]       [⚙]  │ [cerca]   [+ Crear]    │ Estils │ Èmfasi │ Estructura │
├──────────────────┼────────────────────────┼──────────────────────────────┤
│ ▾ Carpetes       │ Hui                    │ Document                    │
│   icona nom   12 │   títol                │ UniversalPage               │
│ ▾ Categories     │   hora · extracte      │                             │
│   icona nom    4 │ Mes / any              │ scroll del document         │
│ ▾ Etiquetes      │   títol                │                             │
│   # etiqueta     │   data · extracte      │                             │
└──────────────────┴────────────────────────┴──────────────────────────────┘
```

[PROPOSTA] Les capçaleres comparteixen una alçada mínima de `--sdp-alt-accio`; no una alçada màxima que retalle text ampliat. Hi ha scroll independent als cossos de carpetes i llista. A la dreta, la botonera queda fora del scroll; el document té un únic contenidor de desplaçament. El cos no desplaça la pàgina hoste.

La base existent ja té scroll als cossos de les columnes i un `topBar` separat de `UniversalPage`: [src/css/modules.css:171–185](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css:171>) i [src/components/universal/UniversalEditorShell.jsx:156–209](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalEditorShell.jsx:156>). Cal mantindre aquesta separació, concretant l’amo del scroll del detall.

### 4.2 Navegació i seleccions

[PROPOSTA]

- **Tot** sempre visible a la subbarra. És una vista global, no una carpeta física. Seleccionar-lo neteja àmbit, categories i tags; conserva el text de cerca si l’usuari està cercant. El botó «Netejar filtres» neteja també la cerca. Aquests comportaments s’han de documentar al component.
- **Carpetes**: fila de 48 px com a mínim, icona de 20–24 px, nom elàstic, recompte alineat a la dreta. El recompte és el total del conjunt carregat de la carpeta, no només els resultats de la cerca. Si el backend pagina, cal un total explícit; no etiquetar un recompte parcial com a total.
- **Categories**: grup plegable separat. Una categoria activa per simplicitat inicial; filtra dins de la carpeta activa.
- **Etiquetes**: selecció múltiple independent. Política inicial AND: les notes han de contindre totes les etiquetes seleccionades. Botó de neteja i resum visible dels filtres.
- **Acordions**: títol amb botó, `aria-expanded` i `aria-controls` amb ID únic. Tancar un grup no lleva el filtre. Recordar l’estat per bloc en la sessió.
- **Subcarpetes**: fase posterior. No generar pares ficticis a partir dels noms. Si arriben `parentId`, evitar cicles i duplicats; tractar orfes com a arrels. La fila de selecció i el botó de desplegar són controls germans, mai botons imbricats.
- **Focus vs selecció**: la carpeta/nota activa conserva un marcador encara que el focus passe a l’editor; l’anell de focus és un estat diferent. V3 i V4 mostren colors de selecció diferents, però la causa exacta no es pot demostrar amb captures estàtiques.

### 4.3 Llista i menú de vista

[PROPOSTA] Capçalera amb context i recompte de resultats; llista amb títol pla, data/hora i extracte, sense inicial decorativa obligatòria. Agrupar per Hui / Ahir / mes de l’any actual / anys anteriors / Sense data. Utilitzar `updatedAt` vàlid, fus horari i locale definits; no reinterpretar `formattedDate` per ordenar. Ordenació estable amb desempat per ID. Mantindre l’ID seleccionat quan l’ordre canvie i evitar bots de posició durant l’escriptura.

`updatedAt` ja arriba al model; `plainText` es calcula en NotesContext, però `toWorkspaceNote` no el passa com a resum propi. Fonts: [src/sections/notes/NotesSection.jsx:8–18](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesSection.jsx:8>) i [src/sections/notes/NotesContext.jsx:97–107](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:97>).

El menú de V2 inspira «Ordenar» i «Agrupar». [PROPOSTA] Galeria i filtre d’adjunts només apareixeran quan el model i el renderitzador els implementen. Les carpetes intel·ligents de V1 i les integracions d’iPad de V4 queden fora del primer esquelet funcional.

### 4.4 Editor amb botonera pràctica

[PROPOSTA] Ordre estable, amb separadors discrets:

1. Navegació del bloc i acció principal «Publicar» separades del format.
2. Estils: H2 i H3; el títol principal continua en l’H1 del document.
3. Èmfasi: negreta, cursiva i ratllat.
4. Estructura: llista, citació i divisor.

Les huit ordres tenen traducció concreta en l’adaptador actual; l’H2/H3 del cos i els límits de heading estan definits localment: [src/components/universal/richText/tiptapToolbarAdapter.js:9–17](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/tiptapToolbarAdapter.js:9>) i [src/components/universal/richText/useUniversalRichText.js:29–31](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/useUniversalRichText.js:29>).

[PROPOSTA] Desfer/refer, paràgraf normal, fonts, mida, taules i altres adjunts són ampliacions del contracte; no afegir botons amb callbacks ficticis. «Publicar» no equival a «Desar»: la primera acció envia al Mur i la segona té la seua cua. Fonts: [src/sections/notes/NotesContext.jsx:114–156](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:114>). Un estat «Desat» només es mostrarà quan la capa de persistència puga confirmar-lo.

Per evitar una regressió del perfil, mantindre la compatibilitat de les props de `UniversalToolbar`: també s’utilitza des de `DetallAjust` sense accions de format. Font: [src/sections/profile/DetallAjust.jsx:313–330](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/profile/DetallAjust.jsx:313>).

## 5. Responsive, mòbil i accessibilitat

Els llindars actuals es mesuren amb `ResizeObserver` sobre el contenidor de la graella, no sobre la finestra: estret per davall de 720 px; ample a partir del màxim entre 1090 px i la suma de columnes + editor mínim + separadors. Mides inicials 270/300 i mínim dret 320. Font: [src/components/layout/AppGridShell.jsx:8–19](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:8>), [src/components/layout/AppGridShell.jsx:71–104](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:71>).

[PROPOSTA] Conservar-los en la primera integració per limitar regressions i validar-los en el catàleg:

| Amplada útil del bloc | Panells | Accions i focus |
| --- | --- | --- |
| ≥ llindar ample calculat | Tres columnes, redimensionables; carrils si es pleguen | Reobrir + configuració al carril de carpetes; reobrir + cerca al de notes. Crear només amb llista desplegada. |
| 720 px fins al llindar ample | Llista + document; carpetes en calaix | Obrir gestió de carpetes amb nom accessible; tancar amb Escape, vel o selecció; tornar el focus al desencadenant. |
| < 720 px | Una vista activa: carpetes → llista → document | En entrar sense nota explícita, llista; amb enllaç a nota vàlida, document. Tornada visible i context conservat. |
| Qualsevol panell amb barra < 320 px | Acció amb icona, sense etiqueta visual | Botó circular de 48 px, nom accessible complet; no fer desaparèixer l’acció. |
| Editor amb barra < 560 px | Acció principal compacta; formats poden ocupar diverses files | Cap scroll horitzontal obligatori de la botonera; grups amb ordre estable i sense controls tallats. |

320 i 560 són llindars **proposats**, pendents de text final, zoom i llengües; no canvien els 720/1090 del layout. No usar `window.innerWidth` per decidir la densitat: un editor de 360 px pot estar en una finestra de 1400 px.

[PROPOSTA] Barra en `min-height`, objectius de 48 px sense reduir `--sdp-touch`; icones amb `aria-hidden`; nom accessible dels botons encara que el text visual s’oculte. Formats amb `aria-pressed`; controls sense capacitat real, absents o desactivats amb causa comprensible. Usar `role="group"` i Tab normal en el primer esquelet; només migrar a `role="toolbar"` si s’afegeix navegació amb fletxes i roving tabindex.

[PROPOSTA] Quan una columna es tanca, el focus ha de passar a un control visible; quan s’obri la llista no es roba el cursor de l’editor sense acció de l’usuari. Verificar `inert` en el runtime de producció: Vite configura àlies a Preact; una prova amb ReactDOM aïllat no representa necessàriament la UI servida. Font: [vite.config.js:20–23](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/vite.config.js:20>) i [vite.config.js:35–43](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/vite.config.js:35>).

[PROPOSTA] En mòbil conservar la mateixa instància d’editor quan només es canvia de panell. Respectar safe areas i el teclat virtual al contenidor hoste; no donar `100vh` a una columna incrustada. Desplaçament reduït segons `prefers-reduced-motion`, focus interior visible i prova de zoom al 200%/400%.

## 6. Contracte React proposat

**Tots els identificadors marcats com a nous en aquest apartat són propostes. No es presenten com a API existent. Cap bloc s’ha aplicat.**

[PROPOSTA] Evolucionar `UniversalWorkspace` amb configuració de presentació, mantenint els valors actuals per defecte:

| Camp nou | Contracte | Responsabilitat |
| --- | --- | --- |
| `presentation.list` | `cards` / `notes` | Tria el renderitzat, sense condicionar-lo a la ruta. |
| `presentation.groupByDate` | boolean | Agrupació visual; les dades continuen en el model. |
| `renderItem` | `({item, active, onSelect}) => ReactNode` | Opcional; permet Gestoria o Disseny sense duplicar el gestor. |
| `navigationGroups[].kind` | folder / category / tag | Evita deduir la semàntica del text traduït del grup. |
| `navigationGroups[].options[].count` | number o absent | Recompte amb abast conegut; no mostrar zero quan és desconegut. |
| `workspaceKey` | string estable | Preferències de mida/plegat per bloc; no incloure dades personals ni compartir-les entre comptes. |

Les props existents són les de [src/components/universal/workspace/UniversalWorkspace.jsx:30–40](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:30>); els camps anteriors s’han d’implementar abans de passar-los. La mida actual es desa amb una clau compartida `sdp-grid-widths`: [src/components/layout/AppGridShell.jsx:48–53](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:48>), [src/components/layout/AppGridShell.jsx:139–146](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:139>).

[PROPOSTA] Separar progressivament l’estat de navegació (`folderId`, `categoryId`, `tagIds`, `query`) de l’estat visual (`collapsed`, grups oberts, panell mòbil) i de la selecció (`itemId`). Aquests noms de camps són nous excepte quan coincideixen amb el contracte actual. La reconciliació ha de permetre conservar una nota oberta que ja no aparega en el filtre, indicant «fora dels resultats»; no ha de canviar silenciosament els filtres per fer-la encaixar. Revisar expressament l’ajust de categoria a l’element seleccionat en [src/components/universal/workspace/WorkspaceContext.jsx:151–168](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/WorkspaceContext.jsx:151>).

### 6.1 Adaptador de Notes: text pla i dades de navegació

[PROPOSTA] Substitució de `toWorkspaceNote` en el fitxer real `NotesSection.jsx`. Afegir l’import que es mostra; la funció `extractPlainText` existeix a [src/utils/contentAdapter.js:10–51](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/utils/contentAdapter.js:10>). `excerpt` és un camp de presentació nou. Aquesta versió inclou totes les classificacions també en el retorn de creació, abans de la futura separació de facetes.

```jsx
import { extractPlainText } from '../../utils/contentAdapter.js';

const toWorkspaceNote = (note) => ({
  id: String(note.id),
  categoryIds: [
    String(note.folderId ?? 'f-notes'),
    ...(note.categories || []).map(c => `cat_${c}`),
    ...(note.tags || []).map(t => `tag_${t}`)
  ],
  kind: 'note',
  title: extractPlainText(note.title || '', Infinity) || 'Sense títol',
  subtitle: note.formattedDate,
  excerpt: note.plainText || '',
  tags: note.tags || [],
  searchText: note.searchText,
  revision: note.revision,
  updatedAt: note.updatedAt,
  data: note
});
```

[PROPOSTA] Després, `model.items = notes.map(toWorkspaceNote)`; retirar l’assignació duplicada de `categoryIds` del model. Els recomptes es calculen una vegada amb un mapa d’IDs, deduplicant membres per nota. Per a `__all__`, `items.length`; per a totals remots, utilitzar el total retornat per l’adaptador.

### 6.2 Fila de navegació

[PROPOSTA] Substitució de `CategoryItem` en `UniversalWorkspace.jsx`; `count` i `icon` són props noves. `Inbox` ja està importat en el fitxer (línia 2); usar-lo com a reserva i passar una icona adequada per a cada grup. Cal passar `count` i `icon` des del map de línies 213–219. La funció continua invocant `onSelect`, de manera que no altera el desat ni la selecció del provider.

```jsx
function CategoryItem({ active, label, count, icon: Icon = Inbox, onSelect }) {
  const hasCount = Number.isFinite(count);
  return (
    <li>
      <button
        type="button"
        className="sdp-bloc-nav-item"
        aria-current={active ? 'page' : undefined}
        onClick={onSelect}
      >
        <Icon size={20} aria-hidden="true" focusable="false" />
        <span className="sdp-bloc-nav-item__label">{label}</span>
        {hasCount && (
          <span className="sdp-bloc-nav-item__count">
            <span className="sr-only">Total: </span>{count}
          </span>
        )}
      </button>
    </li>
  );
}
```

Aquesta fila representa navegació exclusiva. [PROPOSTA] Les etiquetes múltiples han de tindre un renderer amb `aria-pressed`, no reutilitzar `aria-current="page"` per a múltiples valors seleccionats.

### 6.3 Variant de llista textual

[PROPOSTA] Fragment nou dins de `UniversalWorkspace.jsx`, activat amb `presentation.list === 'notes'`; `groups` és una projecció calculada de `filteredItems`, no una segona còpia editable de les notes. Cada grup té `{ id, label, items }`. `id` ha de ser únic i estable (`today`, `yesterday`, `month-2026-09`, `year-2025`, `undated`); el primer grup que encaixa té prioritat. Amb agrupació desactivada, usar un sol grup amb `label: null`. Importar `useId` de React al fitxer; els noms `NotesItems` i `groups` són nous.

```jsx
function NotesItems({ groups, activeItemId, onSelect }) {
  const prefix = useId();
  return (
    <div className="sdp-bloc-list--notes">
      {groups.map(group => {
        const headingId = `${prefix}-${group.id}`;
        return (
          <section key={group.id} aria-labelledby={group.label ? headingId : undefined}>
            {group.label && <h3 id={headingId} className="sdp-bloc-date-group">{group.label}</h3>}
            <ul className="sdp-gestor-llista">
              {group.items.map(item => (
                <li key={item.id}>
                  <button type="button" className="sdp-gestor-fitxa"
                    aria-current={String(activeItemId) === item.id ? 'true' : undefined}
                    onClick={() => onSelect(item.id)}>
                    <span className="sdp-gestor-fitxa__text">
                      <span className="sdp-gestor-fitxa__titol">{item.title}</span>
                      <span className="sdp-gestor-fitxa__subtitol">
                        {item.subtitle}{item.excerpt ? ` · ${item.excerpt}` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
```

[PROPOSTA] En el primer esquelet, la fila és textual. Afegir miniatura després com a camp de presentació explícit si és necessària, sense reserva amb inicial. Mantindre els estats loading/error/buit existents al voltant d’aquest renderer. La funció d’agrupació ha de treballar amb una còpia de l’array, ordenar per instant descendent i ID, i comparar dates de calendari al fus configurat: no calcular «ahir» restant simplement 24 hores en els canvis d’horari.

### 6.4 Densitat per contenidor i acció compacta

[PROPOSTA] Funció nova `useCompactControls`, per extraure a un hook compartit quan s’integre; cap fitxer nou existeix encara. La barra que rep el `ref` ha de tindre amplada imposada pel panell (`width:100%; min-width:0`), així l’etiqueta del botó no altera la mesura i no genera un bucle de redimensionament. Es torna compacta de manera conservadora abans de la primera mesura.

```jsx
import { useLayoutEffect, useRef, useState } from 'react';

function useCompactControls(threshold) {
  const ref = useRef(null);
  const [compact, setCompact] = useState(true);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const measure = () => setCompact(element.clientWidth < threshold);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, compact };
}

function BlocAction({ icon: Icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className="sdp-bloc-action"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon size={24} aria-hidden="true" focusable="false" />
      <span className="sdp-bloc-action__label">{label}</span>
    </button>
  );
}
```

[PROPOSTA] En `AppGridColumn`, connectar `ref` i `data-compact` al contenidor de la subbarra amb llindar 320, i `BlocAction` a la variant primary. L’acció Crear ha de rebre una icona des d’`ItemListColumn`; les props `desactivat`, `etiqueta`, `onAcciona` es mapen a `disabled`, `label`, `onClick`. No ocultar el text d’un botó que encara no té icona.

### 6.5 Botonera neutra i compatible

[PROPOSTA] Ampliar `UniversalToolbar` amb `formatItems` opcional. Si falta, mantindre el pont `formatState`/`formatActions`; si arriba un array, pintar-lo agrupat. Fragment del cos nou; `BlocAction` i `useCompactControls` són els components proposats en 6.4. Importar `Globe` (ja existeix en l’import actual) i `ArrowLeft`; reusar el `handleBack` actual, però només pintar tornada si hi ha `onBack` o graella compacta. No convertir la tornada d’edició en una acció de publicació.

```jsx
function ToolbarBody({ formatItems, onBack, onPublish, publishDisabled, t }) {
  const { ref, compact } = useCompactControls(560);
  const groups = ['Estils', 'Èmfasi', 'Estructura'];
  return (
    <div ref={ref} className="sdp-editor-tools" data-compact={compact}>
      <div className="sdp-editor-tools__actions" role="group" aria-label="Accions del document">
        {onBack && (
          <button type="button" className="sdp-bloc-icon"
            aria-label="Tornar a la llista" onClick={onBack}>
            <ArrowLeft size={24} aria-hidden="true" />
          </button>
        )}
        {onPublish && (
          <BlocAction icon={Globe} label={t('section.notes.publish', 'Publicar')}
            onClick={onPublish} disabled={publishDisabled} />
        )}
      </div>
      <div className="sdp-editor-tools__formats" role="group" aria-label="Format del text">
        {groups.map(group => (
          <div className="sdp-editor-tools__group" role="group" aria-label={group} key={group}>
            {formatItems.filter(item => item.group === group).map(item => (
              <button key={item.id} type="button" className="sdp-bloc-icon"
                aria-label={item.label} title={item.label}
                aria-pressed={item.toggle ? item.active : undefined}
                disabled={!item.enabled}
                onMouseDown={event => event.preventDefault()}
                onClick={item.run}>
                <span aria-hidden="true">{item.glyph}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

[PROPOSTA] `glyph` és provisional: permet revisar l’esquelet sense inventar imports d’icones ni copiar el text visible d’Apple. L’etiqueta accessible és el nom complet. En touch i teclat l’ordre acaba en `exec`, que ja fa `.chain().focus()` a l’adaptador: [src/components/universal/richText/tiptapToolbarAdapter.js:47–55](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/tiptapToolbarAdapter.js:47>). Provar expressament que es conserva la selecció de text després de prémer controls.

[PROPOSTA] En `UniversalRichTextToolbar`, substituir el pont de cinc slots per aquesta projecció. `TOOLBAR_SCHEMA` existeix; `presentation` i `formatItems` són locals nous. Mantindre els imports/valors per defecte `ESTAT_BUIT` i `EXEC_BUIT` de la funció actual.

```jsx
const presentation = {
  titol: ['Estils', 'H2'], subtitol: ['Estils', 'H3'],
  negreta: ['Èmfasi', 'B'], cursiva: ['Èmfasi', 'I'], ratllat: ['Èmfasi', 'S̶'],
  llista: ['Estructura', '≡'], citacio: ['Estructura', '❞'], divisor: ['Estructura', '―']
};
const formatItems = TOOLBAR_SCHEMA.map(command => ({
  id: command.id,
  group: presentation[command.id][0],
  glyph: presentation[command.id][1],
  label: t(command.clauI18n, command.etiqueta),
  toggle: command.commutable,
  active: Boolean(state.actiu?.[command.id]),
  enabled: Boolean(state.disponible && state.pot?.[command.id]),
  run: () => exec(command.id)
}));
// Passar formatItems a UniversalToolbar després d’ampliar-ne el contracte.
```

[PROPOSTA] El pont antic tradueix `isHeading/toggleHeading`, `isList/toggleList`, `isBold/toggleBold`, `isItalic/toggleItalic` i `isStrike/toggleStrike` a la mateixa forma `formatItems`. Sense accions de format, com al perfil, no pintar una franja de botons morts. Els noms de grup del fragment han de passar per i18n en integrar-los.

## 7. CSS proposat amb tokens de Pedra Seca

Tokens existents utilitzats: crom immutable [src/css/tokens.css:240–261](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:240>); espaiat [src/css/tokens.css:209–212](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:209>); dimensions d’acció/touch [src/css/tokens.css:168–177](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:168>); radis [src/css/tokens.css:144–148](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:144>); superfícies i accents [src/css/tokens.css:91–133](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:91>).

**[PROPOSTA] Totes les classes `sdp-bloc-*`, `sdp-editor-tools*`, `sdp-editor-document` i els àlies `--sdp-bloc-*` del bloc següent són nous.** Integrar les regles en la capa `components` de `modules.css`, i les correccions de graella en `AppGridShell.css`. Posar `className="sdp-bloc"` a `AppGridShell` des de `WorkspaceFrame`; aquesta prop ja és acceptada, però `WorkspaceFrame` encara no la passa: [src/components/layout/AppGridShell.jsx:33–45](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:33>) i [src/components/universal/workspace/UniversalWorkspace.jsx:75–82](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:75>).

```css
@layer components {
  .sdp-bloc {
    --sdp-bloc-control: max(var(--sdp-touch), var(--sdp-touch-comode));
    --sdp-bloc-nav-fons: var(--sdp-crom-fons);
    --sdp-bloc-nav-text: var(--sdp-crom-text);
    --sdp-bloc-nav-meta: var(--sdp-crom-text-suau);
    --app-grid-bg-esquerra: var(--sdp-bloc-nav-fons);
    --app-grid-bg-centre: var(--sdp-fons-targeta);
  }

  .sdp-bloc .app-grid-headers {
    background: var(--sdp-crom-fons);
    color: var(--sdp-crom-text);
  }
  .sdp-bloc .app-grid-header-btn { color: var(--sdp-crom-text); }
  .sdp-bloc .app-grid-header-btn.active {
    color: var(--sdp-crom-actiu-fons);
    border-color: var(--sdp-crom-actiu-fons);
  }
  .sdp-bloc .app-grid-column--left {
    color: var(--sdp-bloc-nav-text);
    color-scheme: dark;
  }
  .sdp-bloc .app-grid-col-header:not(.app-grid-col-header--collapsed) {
    height: auto;
    min-height: var(--sdp-alt-accio);
  }
  .sdp-bloc .app-grid-col-header--collapsed {
    display: grid;
    grid-template-rows: repeat(2, var(--sdp-alt-accio)) minmax(0, 1fr);
    justify-items: center;
    align-items: center;
    justify-content: stretch;
    gap: 0;
    padding: 0;
  }
  .sdp-bloc .app-grid-col-header__accio-text {
    min-height: var(--sdp-bloc-control);
    padding-inline: var(--sdp-space-3);
    border-radius: var(--sdp-radi-pastilla);
    background: var(--sdp-crom-fons);
    color: var(--sdp-crom-text);
  }
  .sdp-bloc .app-grid-col-header__accio-text[aria-pressed="true"] {
    outline: 2px solid var(--sdp-crom-actiu-fons);
    outline-offset: -2px;
  }
  .sdp-bloc-nav-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--sdp-space-2);
    width: 100%;
    min-height: var(--sdp-bloc-control);
    padding: var(--sdp-space-2) var(--sdp-space-3);
    border: 0;
    border-inline-start: 3px solid transparent;
    border-radius: var(--sdp-radi-s);
    background: transparent;
    color: var(--sdp-bloc-nav-text);
    font: inherit;
    text-align: start;
  }
  .sdp-bloc-nav-item:hover { background: var(--sdp-crom-hover); }
  .sdp-bloc-nav-item[aria-current="page"] {
    background: var(--sdp-crom-hover);
    border-inline-start-color: var(--sdp-crom-actiu-fons);
    font-weight: 700;
  }
  .sdp-bloc-nav-item__label {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .sdp-bloc-nav-item__count {
    color: var(--sdp-bloc-nav-meta);
    font-size: var(--sdp-text-meta);
    font-variant-numeric: tabular-nums;
  }
  .sdp-bloc-nav-item:focus-visible {
    outline: 2px solid var(--sdp-crom-focus);
    outline-offset: -2px;
  }

  /* Variant de notes; aplicar només quan presentation.list === 'notes'. */
  .sdp-bloc-list--notes .sdp-gestor-fitxa {
    min-height: var(--sdp-alt-accio);
    background: var(--sdp-fons-targeta);
    border-radius: var(--sdp-radi-s);
  }
  .sdp-bloc-list--notes .sdp-gestor-fitxa[aria-current="true"] {
    background: var(--sdp-accent-subtil);
    border-inline-start-color: var(--sdp-accent-text);
  }
  .sdp-bloc-list--notes .sdp-gestor-fitxa__titol {
    font-size: var(--sdp-text-small);
  }
  .sdp-bloc-list--notes .sdp-gestor-fitxa__subtitol {
    font-size: var(--sdp-text-meta);
  }
  .sdp-bloc-date-group {
    padding: var(--sdp-space-4) var(--sdp-space-3) var(--sdp-space-2);
    margin: 0;
    color: var(--sdp-text-suau);
    font-size: var(--sdp-text-meta);
    font-weight: 700;
  }

  .sdp-editor-tools {
    --sdp-bloc-control: max(var(--sdp-touch), var(--sdp-touch-comode));
    flex: none;
    width: 100%;
    min-width: 0;
    color: var(--sdp-crom-text);
    background: var(--sdp-crom-fons);
  }
  .sdp-editor-tools__actions,
  .sdp-editor-tools__formats {
    display: flex;
    align-items: center;
    gap: var(--sdp-space-2);
    flex-wrap: wrap;
    min-height: var(--sdp-alt-accio);
    padding: var(--sdp-space-1) var(--sdp-space-2);
    border-bottom: 1px solid var(--sdp-crom-vora);
  }
  .sdp-editor-tools__actions > .sdp-bloc-action { margin-inline-start: auto; }
  .sdp-editor-tools__group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sdp-space-1);
    border-inline-end: 1px solid var(--sdp-crom-vora-forta);
    padding-inline-end: var(--sdp-space-2);
  }
  .sdp-editor-tools__group:last-child { border-inline-end: 0; }
  .sdp-bloc-icon,
  .sdp-bloc-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    gap: var(--sdp-space-2);
    min-width: var(--sdp-bloc-control);
    min-height: var(--sdp-bloc-control);
    border: 0;
    border-radius: var(--sdp-radi-s);
    background: transparent;
    color: var(--sdp-crom-text);
    font: inherit;
    cursor: pointer;
  }
  .sdp-bloc-icon { width: var(--sdp-bloc-control); padding: 0; }
  .sdp-bloc-action {
    padding-inline: var(--sdp-space-4);
    background: var(--sdp-accio);
    color: var(--sdp-sobre-accio);
    border-radius: var(--sdp-radi-pastilla);
  }
  .sdp-bloc-icon:hover:not(:disabled) { background: var(--sdp-crom-hover); }
  .sdp-bloc-icon[aria-pressed="true"] {
    background: var(--sdp-crom-actiu-fons);
    color: var(--sdp-crom-actiu-text);
  }
  .sdp-bloc-action:hover:not(:disabled) { background: var(--sdp-accio-hover); }
  [data-compact="true"] > .sdp-bloc-action,
  [data-compact="true"] .sdp-editor-tools__actions > .sdp-bloc-action {
    width: var(--sdp-bloc-control);
    padding-inline: 0;
  }
  [data-compact="true"] > .sdp-bloc-action > .sdp-bloc-action__label,
  [data-compact="true"] .sdp-editor-tools__actions > .sdp-bloc-action > .sdp-bloc-action__label {
    display: none;
  }
  .sdp-bloc-icon:disabled,
  .sdp-bloc-action:disabled { opacity: .5; cursor: default; }
  .sdp-bloc-icon:focus-visible,
  .sdp-bloc-action:focus-visible {
    outline: 2px solid var(--sdp-crom-focus);
    outline-offset: -2px;
  }

  .sdp-bloc .sdp-workspace-detail--editor { overflow: hidden; }
  .sdp-editor-shell-atomic {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }
  .sdp-editor-document {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }
}
```

[PROPOSTA] Per a la subbarra, `BlocAction` és fill de `.app-grid-col-header__accions`, no necessàriament fill directe del node amb `data-compact`. Aplicar la compactació amb aquest selector específic addicional; així no afecta cap botó d’una barra descendent:

```css
@layer components {
  .sdp-bloc .app-grid-col-header[data-compact="true"] > .app-grid-col-header__accions > .sdp-bloc-action {
    width: var(--sdp-bloc-control);
    padding-inline: 0;
  }
  .sdp-bloc .app-grid-col-header[data-compact="true"] > .app-grid-col-header__accions > .sdp-bloc-action > .sdp-bloc-action__label {
    display: none;
  }
}
```

[PROPOSTA] En `UniversalEditorShell`, substituir els dos `style` literals per les classes del bloc anterior: classe existent `sdp-editor-shell-atomic` i nova `sdp-editor-document`. Conservar íntegrament les props de `UniversalPage` i els callbacks de desat. Perquè les barres del document pugen amb el seu scroll, canviar la regla propietària en `utilities.css`, que té més prioritat que `components` segons [src/css/index.css:45–68](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/index.css:45>). No intentar guanyar-la només amb especificitat en una capa inferior.

```css
@layer utilities {
  .sdp-bloc .sdp-editor-document > .sdp-universal-page-container--contained > .bar-blue,
  .sdp-bloc .sdp-editor-document > .sdp-universal-page-container--contained > .bar-orange {
    position: static;
    top: auto;
  }
}
```

[PROPOSTA] L’excepció de scroll anterior només s’aplica al document editor. Afegir la classe nova `sdp-workspace-detail--editor` al `DetailColumn` únicament quan l’adaptador declare un detall editor; els detalls de lectura mantenen el seu scroll actual. La classe es passa per una opció de presentació explícita, no deduint-la del nom de la ruta. Sense aquesta connexió, el CSS de scroll de la proposta no està completament activat.

[PROPOSTA] No editar `design-tokens.css` generat per afegir àlies del Bloc. Mantindre els àlies en l’abast del component; si després esdevenen contracte global, promocionar-los a `tokens.css`. El catàleg ha de mostrar clar/fosc, actiu/inactiu, focus, desactivat, buit i càrrega abans de connectar noves funcions.

## 8. Seqüència d’integració per a IAIA MarIA

1. **Fixar el contracte al catàleg.** Ampliar l’espècimen de gestor amb un exemple viu: actualment és una taula de comportaments i mides, no una demostració interactiva del bloc. Font: [src/sections/disseny/cataleg/detalls/EspecimenGestor.jsx:4–29](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/disseny/cataleg/detalls/EspecimenGestor.jsx:4>). Mostrar les dues franges, files, estat «Tot», panells i densitats. La guia Pedra Seca exigeix el referent visual abans de connectar funcions.
2. **Corregir controls sense acció i contrast.** B01, B02, B03 i B10. No introduir serveis nous per a una gestió de carpetes encara indefinida.
3. **Afegir presentació configurable.** Files amb icona/recompte, variant textual de Notes i text pla. Disseny manté les seues fitxes. No canviar la persistència.
4. **Connectar el contracte de botonera.** Renderitzar les ordres disponibles, mantindre el pont de Perfil, compactar Crear/Publicar i comprovar selecció/focus.
5. **Tancar layout i scroll.** Classe específica de detall editor, una sola zona de scroll del document, barres desplaçables dins d’eixa zona, retorn de focus i calaix accessible. Mantindre els separadors de teclat: ja suporten fletxes, Home i End. Font: [src/components/layout/AppGridResizer.jsx:7–12](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridResizer.jsx:7>), [src/components/layout/AppGridResizer.jsx:60–81](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridResizer.jsx:60>).
6. **Separar facetes en una tanda pròpia.** Actualitzar model, reducer, URL i reconciliació alhora. L’URL de Notes actual només sincronitza `nota`; no restaura carpeta/categories/tags. Font: [src/sections/notes/NotesSection.jsx:69–95](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesSection.jsx:69>). No barrejar aquesta migració funcional amb una simple substitució CSS.
7. **Afegir agrupació temporal i gestió de carpetes.** Amb contractes de dades explícits. Les carpetes intel·ligents, adjunts avançats i galeria continuen pendents.

## 9. Criteris d’acceptació

Aquests són **controls pendents de la implementació**, no proves ja superades:

- Mateix esquelet en Notes i Disseny; en Perfil, accions sense format mort; Gestoria podrà aportar model i detall sense copiar la graella.
- Tot, cerca, crear i configuració no canvien d’ordre en plegar. Crear desapareix quan la llista està plegada; cerca la torna a obrir i enfoca l’input.
- Carpeta seleccionada, focus de teclat i nota seleccionada es poden distingir sense dependre exclusivament del color.
- Cap botó buit, controls de 48 px, nom accessible amb text ocult, navegació només amb teclat, Escape i retorn de focus en calaixos/diàlegs.
- Verificar 320, 360, 390, 719, 720, 1089, 1090 i 1440 px **de contenidor**, també màxims de resizers; l’editor pot ser compacte en pantalla gran.
- Zoom 200%/400%, noms llargs, recomptes grans, grups buits, 0/1/moltes notes i dates absents. La botonera creix en altura sense solapar el document.
- En mòbil: entrar sense selecció mostra llista; enllaç directe mostra document; enrere/avant conserva context i selecció. No desmuntar l’editor només per canviar de panell.
- Cap canvi perd contingut pendent. Canviar de nota, ocultar panells i fer scroll no publica res ni confon «Publicar» amb «Desar».
- La llista no transforma HTML en text literal ni afegeix una inicial quan no hi ha miniatura. Agrupació estable amb fus horari i dates invàlides controlades.
- Verificar contrast calculat real en clar/fosc i runtime hoste; no donar per vàlids els valors a partir de les captures enfosquides del modal.

## 10. Incògnites i límits

- Textos finals, política definitiva de recompte, semàntica OR/AND de categories i tags i abast de «Tot» pendents d’adopció de la proposta.
- No s’ha verificat una API de creació/edició/subcarpetes/carpetes intel·ligents en aquesta auditoria de presentació. La roda actual no és una implementació de gestió.
- [SUPÒSIT] Capçaleres de dues franges i panell de carpetes permanentment fosc són l’adaptació escollida per al Bloc; no s’atribueixen a una mesura exacta d’Apple Notes.
- Falta prova visual de la implementació resultant; no s’ha obert navegador ni fet cap crida externa. No es declara equivalència píxel a píxel.
- Els fragments són una especificació integrable amb punts de connexió explícits, no un pegat complet ja aplicat ni una suite executable nova. La separació de facetes i el calaix modal necessiten implementació i proves pròpies.

## 11. Validació documental i contenció

- **Frontmatter individual: PASSA.** Executat el tractor real amb `--estricte --json --arrel=/private/tmp/sdp-bloc-audit-260918/single --arrels=document`, sobre una còpia del document i del mateix esquema/pany/abast del repositori: 1 document, F1–F8 = 0, eixida 0. [Registre individual](</private/tmp/sdp-bloc-audit-260918/frontmatter-single.log>).
- **Frontmatter global: NO PASSA per incidències del corpus.** `node tooling/wiki/tractor-frontmatter.mjs --estricte --json`: 303 documents; F1=49, F2=118, F3=43, F4=37, F5=7, F6=0, F7=46, F8=0; eixida 1. Cap incidència atribuïda a aquest informe. No s’ha executat cap codemod ni canviat l’esquema. [Registre global](</private/tmp/sdp-bloc-audit-260918/frontmatter-global.log>).
- **SCC de només lectura:** `node tooling/gates/verificador-scc.mjs .` retorna 14 `ORPHAN_OPERATIVE` d’altres documents; el nou informe no hi figura i està ancorat a l’índex. [Registre SCC](</private/tmp/sdp-bloc-audit-260918/scc-readonly.log>).
- **Tancament limitat al rol auditor:** no s’ha invocat `tancament.mjs`, perquè l’orquestrador executa una sincronització que escriu els espills de les skills abans de verificar. S’ha executat directament el verificador de lectura, i no es declara superada la porta completa. Fonts: [tooling/gates/tancament.mjs:18–29](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tancament.mjs:18>) i [tooling/wiki/sincronitzar_skills.mjs:24–42](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/sincronitzar_skills.mjs:24>).
- **Propostes:** els 6 blocs JSX passen el parser Babel i els 3 blocs CSS passen PostCSS. Açò acredita sintaxi, no integració, compilació completa ni comportament visual. No s’han escrit fitxers JSX/CSS ni afegit proves al projecte.
- **Cites:** rutes i rangs contrastats amb el tall local. Les empremtes SHA-256 dels 219 fitxers de `src/` abans de redactar i després de validar coincideixen. Els canvis de codi que ja constaven a Git en començar pertanyen a l’arbre preexistent.
- **Escriptures d’aquesta tasca:** aquest informe i una entrada a `00_index_escriptori.md`; registres i còpia de validació en `/private/tmp/sdp-bloc-audit-260918`. Cap canvi a codi, dependències, dades remotes ni fitxers de govern d’agents.

El PASSA individual no implica que la Wiki sencera passe el mode estricte. La bateria següent es refereix a aquest document.

## Bateria de veritat

- [x] Codi real inspeccionat; noms conceptuals distingits dels components existents.
- [x] Afirmacions sobre el codi amb ruta i línies del tall auditat.
- [x] Tokens existents comprovats; noms i API nous marcats com a propostes.
- [x] Captures locals incorporades com a evidència visual; cap cerca externa.
- [x] Supòsits i incògnites separats dels defectes verificats.
- [x] Cap fitxer de codi font modificat per aquesta tasca.
- [x] Frontmatter individual estricte superat; fallades globals declarades a l’apartat 11.
