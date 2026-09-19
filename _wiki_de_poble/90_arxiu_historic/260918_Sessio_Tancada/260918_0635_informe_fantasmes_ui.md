---
type: informe
status: esborrany
description: Auditoria visual i DOM del Bloc de Notes contra la captura canònica, amb diagnòstic dels fantasmes i del píxel
tags:
  - disseny
---

# Informe de fantasmes UI · Bloc de Notes

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-0635 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 06:35 CEST |
| Modificació | 26-09-18 06:35 CEST |
| Agent redactor | ChatGPT Codex |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_index_escriptori]]
- [[llibre_blanc_produccio_pedra_seca]]
- [[contracte_graella]]

## Entrades i límits

- Captura de referència: `/Users/javillinares/Desktop/Captura de pantalla 2026-09-04 a las 2.58.11.png`.
- Codi local actual del projecte `socdepoble.org`.
- S'ha fet inspecció estàtica del DOM React, de la cascada CSS i de l'historial Git local. No s'ha fet cap cerca web.
- No s'ha modificat cap fitxer de codi. Este informe és l'única escriptura de l'auditoria.
- No s'ha rebut una captura de l'estat visual actual. Les diferències contra la captura antiga que deriven directament del DOM/CSS són verificables; la posició final d'una instal·lació concreta també depén de les amplades persistides en `sdp-grid-widths` (`src/components/layout/AppGridShell.jsx:48-53`).

## Veredicte executiu

La regressió principal no és un color incorrecte: és una **fila estructural desapareguda**. La captura correcta té dos nivells consecutius de capçalera de 58 px:

1. `CARPETES` / `NOTES` / eines de format.
2. `Tot + configuració` / `cerca + crear` / barra blava de la pàgina.

La columna dreta actual encara conserva els dos nivells: primer `editor-toolbar` i després `bar-blue` (`src/components/universal/UniversalEditorShell.jsx:150-155`, `src/components/universal/PageFrame.jsx:147-188`). En canvi, les columnes esquerra i central munten **una sola** `AppGridColumn` i tot seguit el cos amb scroll (`src/components/universal/workspace/UniversalWorkspace.jsx:180-220`, `src/components/universal/workspace/UniversalWorkspace.jsx:307-399`). Per tant, el contingut de Carpetes i Notes comença **58 px massa amunt** respecte del document de la dreta.

El problema d'1 px tampoc és imaginari. Hi ha tres fonts actives i una relíquia orfe:

- El hero té un `margin-bottom: -1px` explícit (`src/css/layout.css:227-240`).
- Les fronteres entre columnes són vores reals d'1 px; no són un buit de CSS Grid (`src/components/layout/AppGridShell.css:195-198`).
- Les capçaleres fosques pinten una vora inferior blanca translúcida (`src/components/layout/AppGridShell.css:204-217`, `src/css/tokens.css:240-244`). L'editor en pinta una altra amb el mateix token (`src/css/modules.css:3131-3144`).
- El pegat antic `margin-right: -1px` continua al CSS de `.sidebar-actions`, però el selector ja no té cap consumidor viu (`src/css/modules.css:3146-3170`). No origina el defecte actual; és un fantasma que cal podar.

La reparació correcta és recuperar el contracte de dues files, donar a cada junta un sol propietari i eliminar els solapaments negatius. No cal inventar cap color: els tokens Pedra Seca necessaris ja existeixen.

## 1. Anatomia que imposa la captura

### 1.1. Pila vertical esperada

Després de la barra negra global, la captura mostra esta pila:

| Franja | Esquerra | Centre | Dreta |
| --- | --- | --- | --- |
| Fila 1 · 58 px | títol `CARPETES` i replegar | títol `NOTES` i replegar | eines de format i `PUBLICAR` |
| Fila 2 · 58 px | `Tot` i configuració | cerca i `CREAR NOTA` | barra blava de navegació/context |
| Cos | carpetes, categories i etiquetes | llista de notes | hero, barra taronja i document |

El token canònic confirma que l'altura d'acció és 58 px (`src/css/tokens.css:159-176`). La barra de format usa exactament eixe token (`src/css/modules.css:3131-3144`) i la barra blava també (`src/css/layout.css:183-198`).

### 1.2. Pila actual

`UniversalWorkspace` passa els noms `CARPETES` i `NOTES` a `AppGridShell` (`src/components/universal/workspace/UniversalWorkspace.jsx:74-101`). En escriptori ample, però, `AppGridShell` no els pinta com a capçaleres: només els usa en els botons responsius i en les etiquetes dels separadors (`src/components/layout/AppGridShell.jsx:159-180`, `src/components/layout/AppGridShell.jsx:193-219`).

Al mateix temps, les instàncies obertes d'`AppGridColumn` no reben `titol`: l'esquerra rep directament `Tot` i configuració, i la central rep cerca i crear (`src/components/universal/workspace/UniversalWorkspace.jsx:180-201`, `src/components/universal/workspace/UniversalWorkspace.jsx:307-328`). El contracte documenta `titol` com a títol de columna, però el flux principal no el fa servir (`_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md:23-38`).

**Conseqüència:** `Tot/cerca` ocupen la fila on la captura situa `CARPETES/NOTES`, i els cossos laterals ocupen la fila on la captura situa `Tot/cerca`. El desfasament és exactament `var(--sdp-alt-accio)`, és a dir, 58 px.

### 1.3. Solució estructural

Cada columna oberta ha de tindre dos fills fixos abans del cos:

1. Un `AppGridColumn` de títol, amb `titol`, icona opcional i control de replegament.
2. Una barra d'accions separada, amb `Tot/configuració` o `cerca/crear`.

No convé tornar a sobrecarregar `AppGridColumn` amb títol i accions de segon nivell en una sola fila: eixa és precisament la fusió que ha fet desaparéixer la fila. `AppGridColumn` ja separa internament títol i accions, però només crea un únic contenidor (`src/components/layout/AppGridColumn.jsx:73-117`). Cal un segon component/barra semàntica per a les accions contextuals.

En estat replegat també s'han de conservar les dues cel·les de 58 px: obrir columna en la fila 1 i configuració/cerca en la fila 2. La implementació actual converteix la capçalera replegada en una tira vertical amb `min-height: 100%`, de manera que abandona el ritme de files (`src/components/layout/AppGridShell.css:219-225`).

## 2. El misteri d'1 px i les línies blanques

### 2.1. El `-1px` actiu està al hero

La imatge ja és `display: block`, però rep igualment `margin-bottom: -1px` per solapar la barra següent (`src/css/layout.css:227-240`). Este és l'únic `-1px` persistent que altera una junta del visor de Notes. Pot tapar un filet de composició, però també desplaça de veres la junta hero/barra taronja i converteix el resultat en dependent de l'escala de píxels del dispositiu.

**Solució:** eliminar el marge negatiu i fer que el contenidor del hero pinte el mateix fons que la barra següent amb `var(--sdp-accent)`. Així un possible píxel fraccionari hereta taronja en lloc de blanc, sense solapar caixes ni inventar colors. El hero i la barra taronja ja són germans consecutius en el DOM (`src/components/universal/PageFrame.jsx:190-230`).

### 2.2. Les línies verticals estan pintades expressament

La graella ampla declara separadors geomèrics de 0 px (`src/components/layout/AppGridShell.css:6-20`, `src/components/layout/AppGridShell.css:71-88`). Les columnes esquerra i central, per contra, pinten cadascuna una `border-right: 1px` (`src/components/layout/AppGridShell.css:195-198`). Per tant, qualsevol filet entre columnes prové de la vora; no és un `gap` accidental.

Hi ha a més una contradicció de càlcul: JavaScript reserva 8 px per separador i resta 16 px del pressupost de la graella, mentre CSS els dona amplada 0 (`src/components/layout/AppGridShell.jsx:18-20`, `src/components/layout/AppGridShell.jsx:99-107`, `src/components/layout/AppGridShell.css:165-180`). Això no pinta una línia, però crea **16 px d'espai fantasma en el límit de redimensionament**.

**Solució:** una sola caixa ha de ser propietària de cada junta. Opcions vàlides:

- pista de separador d'1 px, sense `border-right` en les columnes, amb pseudo-element de 8 px com a zona de toc; o
- pista de 0 px i vora de columna d'1 px, però amb `RESIZER_WIDTH = 0` en el càlcul.

La primera opció és més neta: separa geometria, pintura i zona de toc. En tots dos casos s'ha d'eliminar qualsevol `margin-right: -1px` i qualsevol doble propietari de la junta.

### 2.3. Les línies horitzontals blanques també estan pintades

`.app-grid-col-header` usa `border-bottom: 1px solid var(--sdp-crom-vora)` (`src/components/layout/AppGridShell.css:204-217`). El token `--sdp-crom-vora` és blanc al 6 % d'opacitat (`src/css/tokens.css:240-244`). `editor-toolbar` rep la mateixa vora (`src/css/modules.css:3131-3144`). No és un artefacte del navegador: és una línia blanca translúcida deliberada.

**Solució:** decidir en el contracte si la junta entre les dues files ha de ser invisible o marcada. Si ha de ser invisible com en la captura, llevar la vora de la fila 1. Si ha de continuar marcada, la mateixa regla i el mateix token han de governar les tres columnes; no s'ha de compensar amb `+1px` ni marges negatius.

### 2.4. Fons clar ocult en la columna dreta fosca

En tema fosc, la caixa exterior dreta usa `var(--sdp-fons-invers)` (`src/components/layout/AppGridShell.css:153-163`). En tema fosc eixe token es redefineix a `var(--sdp-pedra-100)`, una superfície clara (`src/css/tokens.css:304-319`). El detall interior torna a pintar `var(--sdp-fons-app)` (`src/css/modules.css:291-299`), de manera que qualsevol escletxa, arrodoniment o zona no coberta pot revelar una línia clara.

**Solució:** la caixa exterior dreta ha d'heretar o usar `var(--sdp-fons-app)`; `--sdp-fons-invers` no és el fons d'un visor en tema fosc.

## 3. Regles d'altura: 58 px

### 3.1. Estat actual

- Token canònic: 58 px (`src/css/tokens.css:165-176`).
- Barra blava: `height: var(--sdp-alt-accio)` i `flex: none` (`src/css/layout.css:183-198`).
- Barra taronja: `height: var(--sdp-alt-accio)` i `flex: none` (`src/css/layout.css:242-259`).
- Barra de format: `height: var(--sdp-alt-accio)` i `flex: none` (`src/css/modules.css:3131-3144`).
- Capçalera de columna: només `min-height`, sense `height` ni `flex: none` (`src/components/layout/AppGridShell.css:204-217`).
- El reset global aplica `box-sizing: border-box`, de manera que una vora d'1 px queda dins dels 58 px quan hi ha `height`, no els converteix en 59 px (`src/css/base.css:6-17`).

### 3.2. Risc real

En la mida tipogràfica normal, el control tàctil de 44 px cap dins dels 58 px (`src/components/layout/AppGridShell.css:235-249`, `src/css/tokens.css:174-177`). Però la capçalera lateral pot créixer o encongir-se com a fill flex mentre les barres de la dreta queden fixades. Amb zoom, traducció llarga o una acció que embolique, les files deixen d'alinear-se.

### 3.3. Contracte recomanat

Per reproduir la captura, totes les cel·les de les dues primeres files han de compartir:

- `block-size: var(--sdp-alt-accio)`;
- `flex: 0 0 var(--sdp-alt-accio)`;
- `min-block-size: var(--sdp-alt-accio)`;
- text truncat amb el·lipsi on siga necessari;
- cap compensació `calc(58px + 1px)`.

Si el projecte decideix permetre creixement per accessibilitat, no pot deixar que cada columna calcule l'altura pel seu compte: les dues files han de viure en pistes compartides de CSS Grid, de manera que el creixement d'una cel·la augmente tota la fila.

## 4. Desajustos visuals respecte de la captura

### UI-01 · [P0] Falta la capçalera `CARPETES / NOTES`

Les etiquetes existeixen, però només s'usen en la navegació responsiva i en `aria-label`; les instàncies obertes no reben `titol` (`src/components/universal/workspace/UniversalWorkspace.jsx:74-101`, `src/components/universal/workspace/UniversalWorkspace.jsx:180-201`, `src/components/universal/workspace/UniversalWorkspace.jsx:307-328`).

**Esmena:** recuperar la fila 1 i deixar les accions en la fila 2.

### UI-02 · [P0] Categories i etiquetes no són acordions visuals

`CARPETES`, `CATEGORIES` i `ETIQUETES` es creen com a grups de navegació (`src/sections/notes/NotesSection.jsx:40-56`). `UniversalWorkspace` els converteix en un `<h3>` i una llista, sense botó, chevron ni estat obert/tancat (`src/components/universal/workspace/UniversalWorkspace.jsx:202-219`).

Les classes `sdp-workspace-groups`, `sdp-workspace-group` i `sdp-workspace-group__title` no tenen cap regla en els blocs d'estil del workspace (`src/css/modules.css:170-299`, `src/components/layout/AppGridShell.css:204-390`). El `<h3>` cau, per tant, en la tipografia editorial global: text blau, marge, coixí i vora inferior (`src/css/base.css:55-101`, `src/css/tokens.css:214-227`). Això no pot reproduir les barres grises amb chevron de la captura.

**Esmena:** convertir cada grup en una secció semàntica amb botó d'acordió, o activar de veres la variant `accordion` ja preparada però sense consumidor (`src/components/layout/AppGridColumn.jsx:24-25`, `src/components/layout/AppGridShell.css:227-233`). Si no s'adopta, cal eliminar la variant orfe.

### UI-03 · [P1] Falten les icones de carpetes

El model de Notes només passa `id`, `label` i `order` per carpeta (`src/sections/notes/NotesSection.jsx:42-53`). `CategoryItem` només renderitza el text (`src/components/universal/workspace/UniversalWorkspace.jsx:225-237`). La captura mostra una icona distinta per Mur, Mercat, Pobles, Multimèdia, Esdeveniments, Mapa i Altres notes.

**Esmena:** ampliar l'opció de navegació amb `icon` i fer que `CategoryItem` la pinte amb la mateixa mida/tokens del sistema.

### UI-04 · [P1] El filtre d'etiquetes apareix duplicat

Notes introdueix les etiquetes com un grup de la columna esquerra (`src/sections/notes/NotesSection.jsx:54-55`). El gestor genèric torna a derivar totes les etiquetes dels ítems i crea una franja de xips sobre la llista (`src/components/universal/workspace/UniversalWorkspace.jsx:249-254`, `src/components/universal/workspace/UniversalWorkspace.jsx:349-371`). Eixa segona franja no existeix a la captura i desplaça verticalment les fitxes.

**Esmena:** per a Notes, conservar les etiquetes a l'esquerra i desactivar els xips centrals mitjançant una capacitat explícita del model. No deduir UI duplicada només perquè `item.tags` existeix.

### UI-05 · [P1] La fitxa de nota perd miniatura, subtítol i data lateral

El context de Notes ja calcula `coverImage` i `formattedDate` (`src/sections/notes/NotesContext.jsx:81-96`). En adaptar la nota al workspace, però, no es passa cap `image` i es reutilitza `subtitle` per a la data (`src/sections/notes/NotesSection.jsx:8-19`). `ItemMedia` només mostra foto si existeix `item.image`; si no, cau en icona o inicial (`src/components/universal/workspace/UniversalWorkspace.jsx:403-417`). La fitxa genèrica només té títol i un subtítol sota el títol (`src/components/universal/workspace/UniversalWorkspace.jsx:373-394`).

La captura, en canvi, mostra miniatura, títol, subtítol real i data alineada a la dreta.

**Esmena:** el DTO de workspace necessita com a mínim `image`, `subtitle` i `meta/date` com a camps independents. `image` ha de rebre `coverImage`; `subtitle` no ha de ser sobreescrit per la data.

### UI-06 · [P1] `Tot` rep estat actiu però no té estil actiu

El botó escriu `data-active` (`src/components/universal/workspace/UniversalWorkspace.jsx:183-191`). El CSS només defineix l'estat actiu de `.sdp-workspace-category`, no el de `.univ-manager-inbox-header-btn` (`src/css/modules.css:188-215`, `src/components/layout/AppGridShell.css:274-290`).

**Esmena:** definir l'estat actiu de `Tot` amb els tokens actius Pedra Seca; no afegir un color literal.

### UI-07 · [P1] Capçaleres esquerra i central amb el mateix to

El contracte local demana un gris diferent per a Carpetes i Notes (`.agents/skills/app-grid-shell/SKILL.md:22-30`). Les superfícies dels cossos sí són distintes (`src/components/layout/AppGridShell.css:6-21`, `src/components/layout/AppGridShell.css:153-159`), però totes les capçaleres comparteixen exactament el mateix fons (`src/components/layout/AppGridShell.css:204-217`).

**Esmena:** derivar les dues variants de tokens cromàtics existents; no usar hexadecimals ni primitives noves.

### UI-08 · [P2] Llista i visor tenen responsabilitat de scroll duplicada

La caixa de detall del workspace és scrollable (`src/css/modules.css:291-299`). Dins de Notes, `UniversalEditorShell` fixa una altra caixa a `height: 100%` i amaga l'overflow (`src/components/universal/UniversalEditorShell.jsx:150-155`), mentre `UniversalPage--contained` crea el scroll real intern (`src/css/utilities.css:61-95`).

**Esmena:** per a l'editor de Notes, el propietari del scroll ha de ser `UniversalPage--contained`. El detall exterior ha de limitar mida i amagar overflow; per a altres consumidors que necessiten scroll genèric, cal una variant explícita. No s'ha d'eliminar el wrapper fins traslladar `ref`, `tabIndex` i `data-error` (`src/components/universal/workspace/UniversalWorkspace.jsx:444-453`).

### UI-09 · [P2] El memo del marc pot congelar estats visuals

`WorkspaceFrame` passa `status` i `activeItemId` a `DetailColumn` (`src/components/universal/workspace/UniversalWorkspace.jsx:103-115`), però estos valors no apareixen en les dependències del `useMemo` (`src/components/universal/workspace/UniversalWorkspace.jsx:118-129`). Una transició `loading → ready/error` sense canvi d'ítem pot conservar una vista antiga.

**Esmena:** incloure totes les primitives consumides en les dependències o eliminar el `useMemo` de l'arbre JSX i mesurar abans si realment aporta benefici.

## 5. Fantasmes DOM

### 5.1. Eliminables o substituïbles amb seguretat

| Node | Diagnòstic | Acció |
| --- | --- | --- |
| `<div class="sdp-workspace-groups">` | No té estil propi ni rol; només embolica el `map` (`src/components/universal/workspace/UniversalWorkspace.jsx:202-219`). | Eliminar i fer que `<nav>` continga directament les seccions de grup. |
| `<div class="sdp-workspace-group">` | El grup sí és necessari, però un `div` genèric no expressa la relació amb el seu títol (`src/components/universal/workspace/UniversalWorkspace.jsx:204-218`). | Substituir per `<section aria-labelledby=...>`; no eliminar l'agrupació. |
| Primer `<div class="app-grid-col-header__accions">` | Sempre es renderitza, encara que `startActions` siga buit (`src/components/layout/AppGridColumn.jsx:73-79`). En la columna de Carpetes és un flex buit. | Renderitzat condicional o un únic contenidor d'accions quan no hi ha títol central. |

### 5.2. Duplicacions que no s'han de podar a cegues

- `section.app-grid-column > aside.sdp-workspace-column` duplica flex, altura i overflow (`src/components/layout/AppGridShell.jsx:184-228`, `src/css/modules.css:170-186`). Es pot consolidar, però la caixa exterior posseeix pista, `id`, `inert` i `aria-hidden`, mentre l'interior posseeix el landmark i l'etiqueta. Primer cal traslladar estes responsabilitats.
- `div.sdp-workspace-detail` sembla un embolcall extra, però conté el focus programàtic i l'estat d'error (`src/components/universal/workspace/UniversalWorkspace.jsx:420-453`). Només es pot eliminar si eixes propietats passen a la caixa dreta del shell.
- `app-grid-shell` i `app-grid-content` no són duplicats: el primer apila les pestanyes responsives amb el contingut i el segon és la graella de columnes (`src/components/layout/AppGridShell.jsx:153-184`, `src/components/layout/AppGridShell.css:23-31`, `src/components/layout/AppGridShell.css:71-82`).

## 6. Estils orfes i estils que semblen orfes però no ho són

### 6.1. Poda segura després de la reparació

El cens de selectors contra el JSX viu no ha trobat consumidors per als blocs següents:

| Selector o bloc | Ruta | Veredicte |
| --- | --- | --- |
| `.univ-manager-toolbar--facets` | `src/css/modules.css:341-344` | Orfe. |
| `.univ-manager-toolbar--list` i la seua regla `.btn-primary` | `src/css/modules.css:346-351`, `src/css/modules.css:398-405` | Orfe. |
| `.univ-manager-inbox` | `src/css/modules.css:353-368` | Orfe; no confondre amb el botó viu `-header-btn`. |
| `.univ-manager-toolbar__icon` | `src/css/modules.css:370-396` | Orfe. |
| `.univ-manager-create` | `src/css/modules.css:407-423` | Orfe; crear usa ara `.app-grid-col-header__accio`. |
| `.univ-manager-search` | `src/css/modules.css:425-434` | Orfe. |
| `.search-bar` | `src/css/modules.css:436-456` | Orfe; `search-bar-basic` és un selector distint. |
| `.univ-manager-facet-tree-branch` | `src/css/modules.css:498-504` | Orfe. |
| `.notes-column__body--sense-marge` | `src/css/modules.css:660-663` | Orfe. |
| `.notes-list-actions`, `.sidebar-actions`, `.notes-actions-left` | `src/css/modules.css:3146-3170` | Orfes de l'arquitectura antiga; inclou el pegat `margin-right: -1px`. |
| `.notes-editor .badge-row` | `src/css/components.css:1178-1180` | Orfe. |
| `.univ-manager-header-search-trigger` i `.univ-manager-header-search*` | `src/components/layout/AppGridShell.css:274-323` | Orfes; cal separar-los de la regla compartida amb el botó viu abans de podar. |
| `.app-grid-col-header--accordion` | `src/components/layout/AppGridShell.css:227-233` | Sense consumidor actual. Adoptar-lo per UI-02 o eliminar-lo. |

### 6.2. No podar: tenen consumidors fora de Notes

- `.notes-column`, `.notes-column__body`, `.notes-list-header`, `.univ-manager-toolbar` i `.univ-manager-facet-item*` continuen sent usats per Administració (`src/sections/admin/AdminSection.jsx:11-43`).
- `.notes-list-header`, `.univ-manager-toolbar` i `.univ-manager-facet-header` també s'usen en Multimèdia (`src/sections/multimedia/MultimediaSection.jsx:24-44`, `src/sections/multimedia/MultimediaSection.jsx:69-76`).
- Les regles `.sdp-gestor-llista` i `.sdp-gestor-fitxa*` són el patró viu que renderitza cada nota (`src/components/universal/workspace/UniversalWorkspace.jsx:373-417`, `src/css/modules.css:26-168`).

### 6.3. API latent

- `AppGridShell` accepta i renderitza `children`, però els dos consumidors actuals li passen columnes per props (`src/components/layout/AppGridShell.jsx:33-45`, `src/components/layout/AppGridShell.jsx:149-184`, `src/sections/admin/AdminSection.jsx:168-175`). Si no es vol contingut lliure, la prop i el punt d'injecció són deute d'API.
- `PRESETS` i `applyPreset` existeixen i s'exposen al context, però no hi ha control de UI que els active (`src/components/layout/AppGridShell.jsx:12-17`, `src/components/layout/AppGridShell.jsx:116-121`, `src/components/layout/AppGridShell.jsx:139-147`). O es crea el control o es poden podar.
- `accions` continua com a camí de compatibilitat deprecada en `AppGridColumn` (`src/components/layout/AppGridColumn.jsx:8-23`, `src/components/layout/AppGridColumn.jsx:51-52`) i el contracte també el marca deprecat (`_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md:23-38`).

## 7. Pla de reparació recomanat

### Fase A · Restaurar la geometria sense canviar el model de dades

1. Afegir la fila de títol `CARPETES / NOTES` a les columnes esquerra i central.
2. Moure `Tot/configuració` i `cerca/crear` a una barra d'accions de segon nivell.
3. Fer que les sis cel·les de capçalera compartisquen el contracte de 58 px.
4. Mantindre `bar-blue` confinada a la columna dreta, tal com mana el contracte local (`.agents/skills/app-grid-shell/SKILL.md:18-30`).
5. En replegat, conservar dos nivells d'icones i eliminar `min-height: 100%` de la capçalera col·lapsada.

### Fase B · Fer una sola junta d'1 px

1. Donar la vora vertical al separador o a la columna, mai als dos conceptes.
2. Igualar `RESIZER_WIDTH` amb l'amplada geomètrica real.
3. Eliminar `margin-bottom: -1px` del hero i `margin-right: -1px` de l'estil orfe.
4. Corregir el fons de la columna dreta en tema fosc.
5. Llevar les vores blanques de capçalera si la captura és la norma visual.

### Fase C · Recuperar fidelitat de contingut

1. Estil/semàntica d'acordió per a Carpetes, Categories i Etiquetes.
2. Icones de carpeta en el model de navegació.
3. `image`, `subtitle` i `meta/date` separats en la fitxa.
4. Un sol sistema de filtre d'etiquetes; per a Notes, el de l'esquerra.
5. Estat actiu visible per a `Tot`.

### Fase D · Poda

1. Eliminar només els selectors de §6.1 que continuen sense consumidor després de la reparació.
2. Consolidar wrappers només després de traslladar semàntica, focus, `inert`, errors i scroll.
3. Actualitzar el contracte de graella: la porta actual detecta que `collapseBtnRef` i `expandBtnRef` existeixen al component però no estan documentades (`src/components/layout/AppGridColumn.jsx:8-23`, `_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md:23-38`).

## 8. Bateria de verificació per a la implementació

- [ ] A 100 % de zoom, les fronteres horitzontals de les files 1 i 2 coincideixen en les tres columnes.
- [ ] A 125 %, 150 % i 200 %, cap columna calcula una altura de capçalera diferent de les altres.
- [ ] Entre columnes hi ha exactament una junta; no una vora més un separador solapat.
- [ ] El pressupost JS de separadors coincideix amb les pistes CSS.
- [ ] No existeix cap `-1px` en el recorregut de Notes.
- [ ] Tema clar i fosc no revelen el fons invers de la columna dreta.
- [ ] `CARPETES / NOTES / format` formen la fila 1.
- [ ] `Tot+configuració / cerca+crear / barra blava` formen la fila 2.
- [ ] Les carpetes recuperen icona; la fitxa recupera miniatura, subtítol i data.
- [ ] Categories i etiquetes són barres d'acordió, no títols editorials globals.
- [ ] No apareix una segona franja de xips d'etiquetes sobre la llista.
- [ ] En replegar Carpetes, queden obrir i configuració en les seues files.
- [ ] En replegar Notes, queden obrir i cerca; `CREAR NOTA` desapareix, d'acord amb el contracte (`.agents/skills/app-grid-shell/SKILL.md:32-38`).

## 9. Bateria de veritat de l'auditoria

- [x] He citat només rutes reals en format `ruta:linies`.
- [x] He tingut en compte la captura adjunta com a referència visual.
- [x] He localitzat el `-1px` actiu del hero.
- [x] He localitzat les vores d'1 px que pinten les línies entre columnes i capçaleres.
- [x] He separat els selectors realment orfes dels reutilitzats per Administració o Multimèdia.
- [x] He separat els `div` eliminables dels wrappers que encara posseeixen semàntica, focus, `inert` o scroll.
- [x] No he modificat codi ni he fet cerca web.

## Conclusió

El Bloc de Notes no necessita una nova paleta ni més pegats de píxels. Necessita restaurar la seua **matriu de dues files per tres columnes**. Quan eixa geometria torne a ser una sola font de veritat, les vores podran tindre un únic propietari, el `-1px` deixarà de ser necessari i la poda de fantasmes serà segura.
