---
type: informe
status: esborrany
description: Auditoria extrema arquitectònica i de disseny de la UniversalPage, amb la proposta d'unificació de lectura i edició en un sol marc i el pla d'implementació per fases.
tags:
  - arquitectura
  - disseny
---

# Informe — Auditoria Extrema i Unificació de la UniversalPage

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-UNI |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 14:12 |
| Modificació | 26-09-18 14:12 |
| Agent redactor | Claude (Mestre d'Obra) |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_index_escriptori]]
- [[260918_1350_prompt_auditoria_universal_page]]
- [[260918_1255_informe_auditoria_disseny_pedra_seca]]
- [[AGENTS]]

## Entrades

- Tall del codi: commit `d03523ec` + arbre de treball, congelat a l'inici de la sessió.
- Reverificació per md5 al tancament sobre els 19 fitxers citats: **17 intactes, 2 modificats
  en paral·lel** per un altre agent mentre s'auditava —
  `src/sections/notes/NotesEditor.jsx` i `src/sections/notes/NotesSection.jsx`.
  Les cites a eixos dos fitxers s'han **rellegit i corregides** sobre la versió nova
  (§0.1). Les dels altres 17 són vàlides sobre el tall.
- Sense cerca web, sense navegador, sense bundle. Només lectura de l'arbre local.

## Contenció

**No s'ha tocat ni una línia de codi.** L'únic fitxer escrit és aquest informe.
Tot el que hi ha ací són diagnòstics i propostes perquè els aplique la IAIA MarIA.

---

## 0. Com s'ha fet i com s'ha de llegir

Dues fases separades, com sempre: primer **cacera** (hipòtesis), després **refutació**
(intent actiu de tombar cada hipòtesi amb el codi a la mà). Al §4 hi ha les que han
sobreviscut. Al §5 hi ha les que **he tombat jo mateix**: van semblar defectes i no ho
són, o no ho són encara. El Mestre les té ací perquè cap auditoria futura les torne a obrir.

Les proves són de dues classes:

- **Estàtica** — es llig directament al codi citat i no depén de cap execució.
- **Cobertura** — s'ha comptat sobre tot `src/` quants consumidors reals té una peça.

### 0.1 · L'arbre s'ha mogut sota l'auditoria, i el que s'ha mogut confirma el diagnòstic

Entre l'inici i el tancament, un altre agent ha reescrit `src/sections/notes/NotesEditor.jsx`
i `src/sections/notes/NotesSection.jsx`. S'han rellegit els dos i s'ha corregit la cita
afectada (`renderDetail` ha passat de la línia 103 a la **112** de `NotesSection.jsx`).
Cap troballa d'este informe depenia d'eixos dos fitxers, per la qual cosa **cap conclusió
canvia**.

Però el contingut del canvi mereix quedar escrit, perquè és una **prova en viu del §3**.
El pedaç nou resol la divergència d'autoria entre lectura i edició així
(`src/sections/notes/NotesEditor.jsx:24-53`):

```js
const isExampleNote = activeNote?.id === 'n1';
const name = isExampleNote ? 'Sóc de Poble' : (currentProfile?.name || 'Foraster');
const location = isExampleNote ? 'La Torre de les Maçanes' : (currentProfile?.location || 'Identitat Lliure');
```

És a dir: els valors per defecte de la pila de lectura
(`src/components/universal/UniversalUtils.js:26-30`) s'han **tornat a escriure a mà**, dins
d'una secció, condicionats a **l'identificador d'una nota concreta**. El defecte no s'ha
arreglat: s'ha tapat a la fulla. Això és exactament el que passa quan lectura i edició són
dues piles distintes (§1) i no hi ha un sol lloc on definir qui és l'autor per defecte.

Amb el marc unificat del §6 este pedaç no faria falta: `document.autor` és un sol camp, i
l'omple qui té la informació, no el component que pinta.

---

## 1. El mapa real: no hi ha una UniversalPage, n'hi ha dues piles

El que el projecte anomena «la pàgina universal» són en realitat **dues piles que
s'encavalquen**, i la segona torna a entrar dins de la primera:

**Pila de lectura** (21 punts de crida, 18 fitxers):

```
Secció  →  UniversalPage  →  PageFrame
```

**Pila d'edició** (2 consumidors):

```
Secció → DocumentEditor → UniversalEditorShell → UniversalPage → PageFrame
                                                 ↑ ací reentra a la pila de lectura
```

- `UniversalPage` (`src/components/universal/UniversalPage.jsx:7-80`) no pinta res: llig
  el context de contingut, calcula nou manejadors per defecte i escampa tot cap avall
  (`src/components/universal/UniversalPage.jsx:64-79`).
- `PageFrame` (`src/components/universal/PageFrame.jsx:109-300`) és qui pinta de veritat:
  barra blava, imatge, barra taronja, capçalera i article.
- `UniversalEditorShell` (`src/components/universal/UniversalEditorShell.jsx:51-215`)
  **embolcalla i torna a cridar `UniversalPage`** amb `chrome="context" variant="embed"
  layout="contained"` (`src/components/universal/UniversalEditorShell.jsx:161-165`), i li
  injecta els camps editables com a nodes de React dins de `title`, `subtitle` i `lead`
  (`src/components/universal/UniversalEditorShell.jsx:175-204`).

**Esta és l'arrel de tot.** L'edició no és un *mode* de la pàgina: és una **segona
closca** que reconstruïx la pàgina des de fora. D'ahí ixen totes les condicionals, els
embolcalls buits i les divergències de comportament que venen a continuació.

### 1.1 La profunditat real d'embolcalls a l'editor de Notes

De la columna de detall fins a la primera lletra que escriu l'usuari hi ha **sis nivells**,
i **tres no tenen cap regla de CSS**:

| # | Element | Origen | CSS? |
| --- | --- | --- | --- |
| 1 | `.sdp-workspace-detail` | `src/components/universal/workspace/UniversalWorkspace.jsx:476` | sí · `src/css/modules.css:292-300` |
| 2 | `.sdp-editor-shell-atomic` | `src/components/universal/UniversalEditorShell.jsx:158` | **no** · estil en línia |
| 3 | `<div>` anònim | `src/components/universal/UniversalEditorShell.jsx:160` | **no** · estil en línia |
| 4 | `.sdp-universal-page-container--contained` | `src/components/universal/PageFrame.jsx:147` | sí · `src/css/utilities.css:68-77` |
| 5 | `article.content-wrapper` | `src/components/universal/PageFrame.jsx:286` | sí · `src/css/base.css:237-241` |
| 6 | `.sdp-canvas.sdp-canvas--ple` | `src/components/universal/UniversalEditorShell.jsx:207` | **no** · cap regla al repositori |

---

## 2. L'inventari de comandaments

`PageFrame` declara **38 props** (`src/components/universal/PageFrame.jsx:109-121`).
`UniversalPage` n'afig tres més (`titleText`, `onIaia`, `onSearch`).
`UniversalEditorShell` en declara **24 més** i un `...rest` que travessa tota la pila
(`src/components/universal/UniversalEditorShell.jsx:51-77`, escampat a la línia 165).

Comptatge de consumidors reals sobre `src/sections/` i `src/pages/`:

| Prop | Consumidors | Veredicte |
| --- | --- | --- |
| `showLogos` | 11 | viu |
| `copyright` | 5 | viu |
| `price`, `heroAlt` | 2 | viu |
| `connectLabel`, `layout` | 1 | marginal |
| `topBarData` | 1 | marginal, i el valor que passa és inert (§4.7) |
| `tone` | **0** | mort (a més no té CSS: no hi ha cap `.is-*`) |
| `noPadding` | **0** | mort |
| `contentClassName` | **0** | mort |
| `hideHeader` | **0** | mort |
| `showTopBars` | **0** | mort (llegat de l'API anterior) |
| `authorAvatarAlt` | **0** | mort |
| `titleText` | **0** | mort, ni per prop ni per `config` |
| `variant` | **0 de seccions** | mort: només el posa l'`EditorShell`, i el seu CSS està comentat (§4.3) |

Nou comandaments de crom (`chrome`, `variant`, `showTopBars`, `hideHeader`, `showLogos`,
`layout`, `noPadding`, `tone`, `contentClassName`) produïxen, en realitat, **quatre
resultats visuals distints** (§4.1).

---

## 3. La divergència lectura ↔ edició

Esta és la taula que hauria de doldre més. La **mateixa pàgina**, el **mateix document**,
es comporta distint segons la pila per la qual entra:

| Comportament | Lectura | Edició | Cita |
| --- | --- | --- | --- |
| Autor per defecte | `Sóc de Poble` | `Foraster` | `src/components/universal/UniversalUtils.js:26-30` vs `src/components/universal/UniversalEditorShell.jsx:153` |
| Poble per defecte | `La Torre de les Maçanes` | `Identitat Lliure` | `src/components/universal/UniversalUtils.js:28` vs `src/components/universal/UniversalEditorShell.jsx:154` |
| Avatar per defecte | logo verd de Sóc de Poble | `default-avatar.jpg` | `src/components/universal/UniversalUtils.js:29` vs `src/components/universal/UniversalEditorShell.jsx:152` |
| Clau de l'autor al `config` | `authorName` | `barAuthorName` | `src/components/universal/PageFrame.jsx:112` vs `src/components/universal/UniversalEditorShell.jsx:153` |
| Control de data | `<button>` clicable | `<time>` inert | `src/components/PedraSeca/atoms/controls.jsx:40-62`, cridat sense `onClick` a `src/components/universal/UniversalEditorShell.jsx:328` |
| Botó d'estat | `ActionControl` (àtom, amb `aria-label`) | `<button>` cru sense nom accessible | `src/components/universal/PageFrame.jsx:220` vs `src/components/universal/UniversalEditorShell.jsx:317-320` |
| Desat amb espera | — | **dos motors independents de 800 ms** | `src/components/universal/UniversalEditorShell.jsx:101` i `src/components/universal/richText/useUniversalRichText.js:61` |
| Frontera d'error | `SlotErrorBoundary` (amb reinici i telemetria) | `EditorErrorBoundary` (sense cap de les dues) | `src/components/universal/workspace/SlotErrorBoundary.jsx:18-68` vs `src/components/universal/UniversalEditorShell.jsx:10-34` |

Cap d'estes divergències és una decisió de disseny. Totes són l'efecte secundari
d'haver construït l'edició **per damunt** de la lectura en compte de **dins**.

---

## 4. Troballes que han sobreviscut la refutació

### 4.1 · `chrome="full"` i `chrome="context"` produïxen exactament el mateix

**Greuge:** arquitectònic. **Prova:** estàtica.

A `src/components/universal/PageFrame.jsx:139-141`:

- `showBlueBar` és cert per a `full`, `context` i `system`.
- `showOrangeBar` és cert per a `full` i `context`.
- `showPageHeader` és cert per a tot excepte `none`.

Per tant `full` i `context` coincidixen en les tres decisions. L'única diferència que
genera el JSX és la classe `bar-blue--top` / `bar-orange--top`
(`src/components/universal/PageFrame.jsx:149` i `:201`) — i eixes dues regles són
**idèntiques a la regla base**:

| Regla base | Modificador `--top` |
| --- | --- |
| `header.bar-blue { top: 0 }` · `src/css/layout.css:193` | `header.bar-blue.bar-blue--top { top: 0 }` · `src/css/layout.css:203-205` |
| `section.bar-orange { top: var(--sdp-alt-accio) }` · `src/css/layout.css:255` | `section.bar-orange.bar-orange--top { top: var(--sdp-alt-accio) }` · `src/css/layout.css:262-264` |

**Conclusió:** cinc modes documentats (`src/components/universal/UniversalUtils.js:32`)
donen **quatre resultats**. `full` i `context` es poden fusionar sense cap canvi visual.

**Solució:** §6.2 — substituir l'enum per una taula de tres booleans.

---

### 4.2 · `showLogos={false}` no apaga el logotip si `chrome="system"`

**Greuge:** defecte visible. **Prova:** estàtica.

`src/components/universal/PageFrame.jsx:239`:

```jsx
) : (showLogos || chrome === 'system') ? (
```

`RealitatSection` demana explícitament que no hi haja logotip
(`src/sections/realitat/RealitatSection.jsx:68-69`: `chrome="system" showLogos={false}`)
i el rep igualment, perquè la condició és una disjunció.

Dos agreujants al mateix punt:
1. La línia llig `chrome` **cru**, no `resolvedChrome`. Les línies 137-141 sí que usen
   `resolvedChrome`. La mateixa funció tracta el mateix valor de dues maneres.
2. El crom decidix contingut (quin logotip es pinta), que no és cosa seua.

**Solució:** el crom no pot forçar contingut. `logotip` ha de ser una decisió pròpia
(§6.2), amb el valor per defecte lligat al preset però **sempre** sobreescriptible.

---

### 4.3 · `variant="embed"` és un comandament sense CSS

**Greuge:** codi mort. **Prova:** estàtica.

`src/components/universal/UniversalEditorShell.jsx:163` passa `variant="embed"`.
`src/components/universal/PageFrame.jsx:149` i `:201` el converteixen en les classes
`bar-blue--embed` i `bar-orange--embed`. Les dues úniques regles que les aplicaven
estan **comentades**:

- `src/css/layout.css:202` → `/* header.bar-blue.bar-blue--embed { position: static; } */`
- `src/css/layout.css:261` → `/* section.bar-orange.bar-orange--embed { position: static; } */`

Cerca a tot `src/css/`, `src/components/layout/AppGridShell.css`,
`src/sections/profile/PerfilShell.css` i `public/assets/pedra-seca.css`: cap altra
aparició. **`variant` és un prop que no fa res.**

---

### 4.4 · Sis classes emeses pel marc no existixen a cap fulla d'estil

**Greuge:** fantasmes d'UI. **Prova:** estàtica (cerca a tot el CSS del repositori,
exclosos `node_modules/` i `dist/`).

| Classe | On s'emet | Conseqüència |
| --- | --- | --- |
| `sdp-editor-shell-atomic` | `src/components/universal/UniversalEditorShell.jsx:158` | l'estructura la sosté un `style={{}}` en línia |
| `sdp-canvas` i `sdp-canvas--ple` | `src/components/universal/UniversalEditorShell.jsx:207` | un `<div>` sense cap efecte entre l'article i el cos ric |
| `published` | `src/components/universal/UniversalEditorShell.jsx:317` | l'estat publicat només es distingix per la icona |
| `page-title-logo-personalitzat` | `src/components/universal/PageFrame.jsx:236` | el logotip pujat per l'usuari es pinta sense contenidor |
| `sdp-editor` | `src/components/universal/DocumentEditor.jsx:87` | l'estat buit de l'editor no té superfície |
| `sdp-estat`, `--error`, `__contenidor`, `__titol`, `__descripcio` | `src/components/universal/UniversalEditorShell.jsx:24-28` | **quan l'editor peta, l'avís ix cru** |

---

### 4.5 · Els tres marcadors de posició de l'editor no es veuen mai

**Greuge:** defecte visible. **Prova:** estàtica.

`EditableField` escriu `data-placeholder` (`src/components/universal/UniversalEditorShell.jsx:45`)
i l'`EditorShell` li passa `"Títol..."`, `"Subtítol opcional..."` i `"Entradilla opcional..."`
(`src/components/universal/UniversalEditorShell.jsx:180`, `:190`, `:200`).

**No existix cap regla `[data-placeholder]` a cap CSS del projecte.** Sense una regla
`:empty::before`, l'atribut no pinta res: una nota nova mostra tres zones en blanc sense
cap indicació del que s'espera.

Les úniques regles d'eixos camps són tres declaracions de visualització
(`src/css/modules.css:645-647`).

---

### 4.6 · Els quatre noms de classe del cos ric tampoc existixen

**Greuge:** fantasmes d'UI. **Prova:** estàtica.

`src/components/universal/richText/useUniversalRichText.js:65` assigna a l'àrea d'edició
de TipTap:

```js
class: 'editor-content page-content sdp-text-cos sdp-prose'
```

Cap de les quatre té regla. El cos editorial **només** hereta la tipografia global
d'element (`src/css/base.css`). Això vol dir que la promesa de «Pedra Seca» sobre el text
ric no està escrita enlloc: el que es veu hui és el que sobreviu per herència.

---

### 4.7 · Sis manejadors del crom no es poden apagar, i dos no existixen

**Greuge:** arquitectònic. **Prova:** estàtica.

`PageFrame` decidix si pinta un botó mirant si el manejador existix:
`onBack &&`, `onForward &&`, `onTranslate &&`, `onComment &&`, `onShare &&`, `onConnect &&`
(`src/components/universal/PageFrame.jsx:151`, `:156`, `:166`, `:171`, `:176`, `:182`).

Però `UniversalPage` **sempre** els fabrica amb `||`
(`src/components/universal/UniversalPage.jsx:16-33`) i els col·loca **després** del
`{...props}` (`src/components/universal/UniversalPage.jsx:67-76`). Com que `PageFrame`
només s'importa des de `UniversalPage`, **cap pàgina del portal pot llevar-se el botó de
Connectar, el de Compartir ni el de Traduir.** Passar `onConnect={null}` no serviria:
`null` és fals i dispara el valor per defecte.

Al mateix bloc:
- `onIaia` i `onSearch` es calculen (`src/components/universal/UniversalPage.jsx:20-21`) i
  s'envien (`:72-73`) a un component que **no els declara**
  (`src/components/universal/PageFrame.jsx:115`). Es perden.
- `onPin` no el passa **cap** consumidor. La branca de `src/components/universal/PageFrame.jsx:219-223`
  no s'ha executat mai, i per tant `topBarData={{ showPin: false }}` a
  `src/sections/text/TextSection.jsx:44` apaga una cosa que ja estava apagada.
- `onIndex` tampoc el passa ningú: el calaix de continguts sempre va per la via interna
  (`src/components/universal/PageFrame.jsx:126`).

---

### 4.8 · El `ContentProvider` congela la configuració al primer muntatge

**Greuge:** defecte visible. **Prova:** estàtica.

`src/components/universal/ContentProvider.jsx:6`:

```js
const [config, setConfig] = useState(initialConfig);
```

`useState` ignora els valors posteriors de `initialConfig`. I `updateConfig`
(`src/components/universal/ContentProvider.jsx:8-10`) **no el crida ningú** a tot `src/`.

Els tres consumidors construïxen el `config` amb `t(...)` dins del render:

- `src/sections/mur/MurSection.jsx:106-112`
- `src/sections/xat/XatSection.jsx:157-163`
- `src/sections/mercat/MercatSection.jsx:21-27`

Cap dels tres es remunta quan canvia l'idioma: les claus de remuntatge de `src/app/App.jsx:431-436`
depenen de l'actor, no de la llengua. **En canviar d'idioma, el títol, el subtítol i
l'entradeta del Mur, el Xat i el Mercat es queden en l'idioma anterior** mentre la resta
de la pàgina es tradueix.

**Agreujant arquitectònic:** el `ContentProvider` és un context de React l'única faena
del qual és passar props a un **fill directe**. A `src/sections/mur/MurSection.jsx:117-118`
el proveïdor i el consumidor estan a dues línies de distància.

---

### 4.9 · Dos motors de desat amb espera, quatre escoltadors globals

**Greuge:** arquitectònic. **Prova:** estàtica.

| Motor | Camps que cobrix | Espera | Escoltadors globals |
| --- | --- | --- | --- |
| `UniversalEditorShell` | títol, subtítol, entradeta | 800 ms · `src/components/universal/UniversalEditorShell.jsx:101` | `pagehide` + `visibilitychange` · `:127-128` |
| `useUniversalRichText` | cos ric | 800 ms · `src/components/universal/richText/useUniversalRichText.js:61` | `pagehide` + `visibilitychange` · `:96-97` |

Dues implementacions, dues semàntiques de buidatge, dues còpies de la mateixa constant
màgica i quatre escoltadors per cada editor obert. Un canvi de política de desat s'ha de
fer dues vegades i en dos fitxers que no es referencien.

---

### 4.10 · Dues fronteres d'error, i guanya la pitjor

**Greuge:** arquitectònic. **Prova:** estàtica.

`SlotErrorBoundary` (`src/components/universal/workspace/SlotErrorBoundary.jsx:18-68`) té
reinici per `resetKey`, punt de telemetria, botó de reintent i classes amb CSS
(`sdp-buit` existix).

`EditorErrorBoundary` (`src/components/universal/UniversalEditorShell.jsx:10-34`) no té
cap de les quatre coses, i les seues classes són fantasmes (§4.4).

El detall del taulell ja està embolcallat pel bo
(`src/components/universal/workspace/UniversalWorkspace.jsx:106-117`), i el dolent queda
**dins**. Com que en React guanya la frontera més pròxima, **quan peta el marc de la
pàgina l'usuari veu el fallback dèbil i sense estil, i no pot reintentar.**

---

### 4.11 · `isPublished` viatja per la barra d'eines i cau al buit

**Greuge:** codi mort. **Prova:** estàtica.

`src/components/universal/DocumentEditor.jsx:102` el passa a `UniversalRichTextToolbar`,
que el reenvia a `UniversalToolbar` (`src/components/universal/richText/UniversalRichTextToolbar.jsx:35`).
`UniversalToolbar` **no el declara** (`src/components/universal/UniversalToolbar.jsx:7-14`).
El mateix passa a `src/sections/profile/DetallAjust.jsx:319`.

Conseqüència: el botó «Publicar» de la barra d'eines mai no sap si el document ja està
publicat. L'únic indicador d'estat és el cadenat de la barra taronja
(`src/components/universal/UniversalEditorShell.jsx:317-319`), que és precisament el botó
sense nom accessible del §3.

---

### 4.12 · El bloc editorial està partit en dos contenidors

**Greuge:** disseny. **Prova:** estàtica.

`PageFrame` posa el **títol** dins de `header.page-title`
(`src/components/universal/PageFrame.jsx:245-250`) — una targeta amb fons, ombra i
cantonades arredonides (`src/css/layout.css:278-285`) — però el **subtítol** i
l'**entradeta** els deixa fora, dins de `article.content-wrapper > .page-intro`
(`src/components/universal/PageFrame.jsx:286-292`).

Rastre d'esta separació: `src/css/layout.css:293-301` encara estilitza
`header.page-title h2` i `header.page-title .lead`. **Cap dels dos selectors pot
coincidir amb el DOM actual**, perquè eixos elements ja no viuen ahí.

Per a l'editor és pitjor: els tres camps que l'usuari percep com un sol bloc
(`titleHtml`, `subtitleHtml`, `leadHtml`, `src/components/universal/UniversalEditorShell.jsx:175-204`)
es pinten en **dues superfícies visuals distintes**, i el salt de tabulació el travessa
sense cap senyal.

---

### 4.13 · La pàgina decidix qui té la barra de desplaçament, i no ho hauria de decidir

**Greuge:** arquitectònic. **Prova:** estàtica.

Hi ha **dues estratègies contradictòries per a la mateixa ranura**:

- `DesignSection` posa una `UniversalPage` amb el `layout` per defecte dins de la columna
  de detall (`src/sections/disseny/DesignSection.jsx:17-21`). Ací mana el contenidor
  hoste: `.sdp-workspace-detail { overflow-y: auto }` (`src/css/modules.css:292-300`) i
  la pàgina és `flex: none` (`src/css/utilities.css:56-60`). **Correcte.**
- `NotesEditor`, per la via de l'`EditorShell`, força `layout="contained"`
  (`src/components/universal/UniversalEditorShell.jsx:164`), que converteix el contenidor
  de la pàgina en **una segona zona de desplaçament**
  (`src/css/utilities.css:68-77`) dins d'una primera que ja ho era.

El segon desplaçador només no es nota perquè entremig hi ha un `overflow: hidden` en línia
(`src/components/universal/UniversalEditorShell.jsx:158`) que deixa el de fora inert.
És a dir: **l'arquitectura es sosté per un estil en línia.**

A més, `chrome` es valida contra un conjunt tancat
(`src/components/universal/PageFrame.jsx:138`, `src/components/universal/UniversalUtils.js:32`)
però `layout` s'interpola cru a la classe (`src/components/universal/PageFrame.jsx:147`):
un valor equivocat no dona error, dona una classe inexistent.

---

### 4.14 · El catàleg viu documenta una cosa que no és

**Greuge:** documentació. **Prova:** estàtica.

`src/sections/disseny/cataleg/detalls/EspecimenPage.jsx:12` afirma que la pàgina de
Disseny és «un espècimen viu de UniversalPage amb `chrome="full"`». La pàgina de Disseny
usa `chrome="context"` (`src/sections/disseny/DesignSection.jsx:18`).

El contracte publicat al catàleg (`src/sections/disseny/cataleg/detalls/EspecimenPage.jsx:8-10`)
documenta **4 props de 38**. No apareixen `variant`, `layout`, `topBarData`, `noPadding`,
`tone`, `showTopBars`, `hideHeader`, `copyright`, `showLogos`, `price` ni `connectLabel`.

---

### 4.15 · Cap prova cobrix la pila universal

**Greuge:** risc de la reforma. **Prova:** cobertura.

Cap dels nou fitxers de prova de `src/` menciona `UniversalPage`, `PageFrame`,
`UniversalEditorShell` ni `DocumentEditor`. Hi ha proves per a `workspaceState`
(`src/components/universal/workspace/workspaceState.test.js`) i per a `UniversalCard`,
però **el marc que pinta 21 pàgines del portal no en té cap**.

Això no és una troballa per a arreglar hui: és la **condició prèvia** de la fase 0 del §7.

---

### 4.16 · Residus menors, confirmats

| Residu | Cita |
| --- | --- |
| `isUploading` es calcula i es retorna, però no el llig ningú: **no hi ha estat de càrrega en pujar una imatge** | `src/hooks/useHeroImageHandler.js:23`, `:77` |
| `.content-wrapper > .hero-image` i `.content-wrapper > section.bar-orange`: els dos elements són **germans**, no fills | `src/css/base.css:242-247` vs `src/components/universal/PageFrame.jsx:190-198`, `:200-231`, `:286` |
| `header.page-title` usa `36px` cru; el sistema té `--sdp-radi-xl: 28px` i cap token de 36 | `src/css/layout.css:282` vs `src/css/tokens.css:143-148` |
| `useEditorShell` s'exporta com a API pública i només el crida el fitxer que el declara | `src/components/universal/UniversalEditorShell.jsx:135`, `:217` |
| Dues barres d'eines amb el mateix nom de família i contractes distints | `src/components/universal/UniversalToolbar.jsx` i `src/components/universal/richText/UniversalRichTextToolbar.jsx` |

---

## 5. Troballes que he tombat jo mateix

Perquè cap auditoria futura les torne a obrir.

**5.1 · «Els 25 `.content-wrapper` niats dins de les seccions dupliquen el farciment.»**
**Fals hui.** La regla de farciment està qualificada per element:
`article.content-wrapper` (`src/css/base.css:237`). Els niats són `<div>` i `<section>`,
i no coincidixen. També vaig comprovar `.app-grid-page > .content-wrapper`
(`src/components/layout/AppGridShell.css:24-32`): només afecta fills directes de la
graella. **Però no ho arxive del tot:** són 25 noms de classe inerts, i
`src/sections/connectar/ConnectarSection.jsx:311-313` en té **tres niats**. El dia que
algú escriga una regla `.content-wrapper` sense qualificar, s'encenen totes de colp. És
soroll semàntic amb una trampa dins, no un defecte visual.

**5.2 · «`.sdp-hero__imatge` no té CSS, per tant la imatge de l'editor ix trencada.»**
**Fals.** És cert que la classe no existix
(`src/components/universal/UniversalEditorShell.jsx:289`), però la imatge es pinta dins de
`div.hero-image` (`src/components/universal/PageFrame.jsx:190-193`) i el selector
descendent `.hero-image img` (`src/css/layout.css:236-240`) li arriba igual. La classe és
morta i inofensiva.

**5.3 · «La llista d'etiquetes del taulell pot filtrar un `0` a la pantalla.»**
**Fals.** `src/components/universal/workspace/UniversalWorkspace.jsx:377` usa un ternari,
no un `&&`. El `0` avalua com a fals i el ternari torna `null`.

**5.4 · «`presentation` a les icones de la barra blava està mal cablejat.»**
**Sense efecte.** `IconButton` només usa `presentation` per a decidir si es retira
(`src/components/PedraSeca/atoms/controls.jsx:73`) i no el reenvia a `ActionControl`. Com
que a `PageFrame` tots els manejadors arriben sempre definits (§4.7), el prop és redundant
a les sis crides, però no canvia res. Es neteja de gratis amb la reforma.

**5.5 · «El `handleDateTime` de `UniversalPage` està trencat perquè rep una data
formatada.»** **Matisat, no és un defecte actiu.** És cert que
`src/components/universal/UniversalEditorShell.jsx:173` posa `formattedDate` dins de
`topBarData.dateTime`, i que `src/components/universal/UniversalPage.jsx:43` espera una
marca ISO. Però eixe manejador no s'executa mai a l'editor: `PageFrame` pinta
`topBarData.barActions` i abandona la branca de la data
(`src/components/universal/PageFrame.jsx:217`), i el control que sí que es pinta és inert
(§3). La lògica és incoherent, però hui no és accessible. **La reforma no la pot heretar
tal com està.**

---

## 6. L'arquitectura proposada

### 6.1 Principi rector

> **L'edició no és una closca. És un mode del camp.**

Un sol marc. Els camps saben llegir-se i escriure's. El crom és una taula, no una cadena
de condicionals. I la pàgina **mai** és la seua pròpia zona de desplaçament.

### 6.2 L'arbre de fitxers

```
src/components/universal/
  UniversalPage.jsx            ← ÚNIC component públic del marc
  pagina/
    cromPagina.js              ← taula declarativa de presets (substituïx 9 comandaments)
    CampUniversal.jsx          ← camp polimòrfic: llig o edita, mateix DOM
    BarraNavegacio.jsx         ← barra blava
    BarraAutoria.jsx           ← barra taronja
    BlocEditorial.jsx          ← títol + subtítol + entradeta + etiquetes, EN UN SOL CONTENIDOR
    CalaixDeContinguts.jsx     ← el que hui és TableOfContentsDrawer
    useDesatAmbEspera.js       ← UN motor de desat per a camps i cos ric
```

Desapareixen: `PageFrame.jsx`, `UniversalEditorShell.jsx`, `ContentProvider.jsx`.
`DocumentEditor.jsx` es prima fins a ser només l'adaptador de TipTap.

### 6.3 El contracte públic: quatre props, no quaranta-una

```jsx
<UniversalPage
  crom="sistema"          // preset de crom. Un sol comandament.
  mode="lectura"          // 'lectura' | 'edicio'. Un sol interruptor.
  document={document}     // TOTES les dades editorials, en un objecte.
  accions={accions}       // TOTS els manejadors, en un objecte.
>
  {cos}
</UniversalPage>
```

**`document`** — un objecte, no vint props solts:

```js
{
  id, títol, subtítol, entradeta,
  imatgeCapçalera, logotip, etiquetes, copyright,
  autor: { nom, poble, avatar },
  data, hora, dataISO,
  publicat
}
```

Això mata d'un colp la duplicitat `authorName` / `topBarData.authorName` /
`config.authorName` / `config.barAuthorName` del §3, perquè només hi ha **un** camí.

**`accions`** — un objecte amb **absència significativa**. Si una clau no hi és, el botó no
es pinta. Això restaura la intenció que `PageFrame` ja tenia
(`src/components/universal/PageFrame.jsx:151`) i que `UniversalPage` anul·lava (§4.7):

```js
{
  arrere, avant, índex, traduir, comentar, compartir, connectar, ancorar, data,
  desaCamp, desaLocal, pujaImatge, publica     // només en mode 'edicio'
}
```

Els valors per defecte de navegació es calculen **una sola vegada**, a un ajudant
`accionsPerDefecte(navigate)` que la secció **decidix** si vol composar:

```js
accions={{ ...accionsPerDefecte(navigate), connectar: undefined }}   // ara sí es pot apagar
```

**`crom`** — la taula reemplaça els nou comandaments del §2:

```js
export const CROM = {
  cap:     { navegació: false, autoria: false, bloc: false, logotip: false },
  pàgina:  { navegació: false, autoria: false, bloc: true,  logotip: false },
  sistema: { navegació: true,  autoria: false, bloc: true,  logotip: true  },
  context: { navegació: true,  autoria: true,  bloc: true,  logotip: false }
};
```

Quatre presets per als quatre resultats reals (§4.1). `full` desapareix com a sinònim de
`context`. `logotip` passa a ser un valor per defecte del preset i **sempre**
sobreescriptible, cosa que arregla el §4.2:

```jsx
<UniversalPage crom="sistema" document={{ ...doc, logotip: null }} />
```

### 6.4 `CampUniversal`: la peça que fa possible la unificació

El **mateix element**, la **mateixa posició al DOM**, la **mateixa classe**. L'únic que
canvia és si és editable:

```jsx
export function CampUniversal({ mode, com: Element = 'span', html, marcador, className, onCanvi, onSortida }) {
  if (mode !== 'edicio') {
    return html ? <Element className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} /> : null;
  }
  return (
    <Element
      className={className}
      contentEditable
      suppressContentEditableWarning
      data-marcador={marcador}
      onInput={(e) => onCanvi?.(sanitizeHtml(e.currentTarget.innerHTML))}
      onBlur={(e) => onSortida?.(sanitizeHtml(e.currentTarget.innerHTML))}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html || '') }}
    />
  );
}
```

D'ací ixen tres garanties que hui no tenim:

1. **El «el que veus és el que hi ha» és estructural**, no un acord entre dos components.
   Lectura i edició no poden divergir perquè són el mateix node.
2. Els marcadors de posició (§4.5) es resolen amb **una regla** al sistema de disseny,
   que hui no existix:
   ```css
   [data-marcador]:empty::before {
     content: attr(data-marcador);
     color: var(--sdp-text-suau);
     pointer-events: none;
   }
   ```
3. `EditableField` i `EditorErrorBoundary` desapareixen del mapa públic.

### 6.5 `BlocEditorial`: un sol contenidor per al bloc editorial

Arregla el §4.12. Títol, subtítol, entradeta, etiquetes i copyright viuen **dins de la
mateixa superfície**:

```jsx
<header className="sdp-bloc-editorial">
  <CampUniversal com="h1" mode={mode} html={document.títol} marcador="Títol…" />
  <CampUniversal com="h2" mode={mode} html={document.subtítol} marcador="Subtítol opcional…" />
  <CampUniversal com="p" className="lead" mode={mode} html={document.entradeta} marcador="Entradeta opcional…" />
  <EtiquetesPagina etiquetes={document.etiquetes} />
  {document.copyright && <p className="sdp-bloc-editorial__credit">{document.copyright}</p>}
</header>
```

Les regles òrfenes `header.page-title h2` i `header.page-title .lead`
(`src/css/layout.css:293-301`) tornen a tindre sentit sota el nom nou, i `.page-intro`
(`src/css/base.css:265-267`) es retira.

### 6.6 La llei del desplaçament: l'hoste mana

Arregla el §4.13 i elimina els dos estils en línia.

> **La `UniversalPage` no té mai `overflow`. La ranura hoste sempre en té.**

- `layout`, `--page` i `--contained` (`src/css/utilities.css:51-95`) desapareixen. Queda
  **una** regla: `.sdp-universal-page { display: block; width: 100% }`.
- Les barres enganxades queden com estan (`src/css/layout.css:192-194`, `:254-256`), i
  s'enganxen contra la zona de desplaçament de l'hoste, siga quina siga.
- La columna de detall del taulell es partix en dos, i ací és on viu la barra d'eines de
  l'editor — que **no** ha d'anar dins de la pàgina:

```css
.sdp-workspace-detail { display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; }
.sdp-workspace-detail__eines { flex: none; }
.sdp-workspace-detail__visor { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
```

Amb això cauen, per construcció, el `<div>` anònim, el `sdp-editor-shell-atomic`, el
`sdp-canvas` i el segon desplaçador. **Quatre nivells d'embolcall menys** sobre els sis
del §1.1.

### 6.7 Un motor de desat, no dos

`useDesatAmbEspera` (§6.2) unifica el §4.9:

- Una constant `ESPERA_DESAT = 800` exportada des d'un únic punt.
- Un registre de camps pendents compartit pels camps senzills i el cos ric.
- **Un** parell d'escoltadors `pagehide` / `visibilitychange`, no dos.
- Un buidatge en desmuntar i en canviar d'`id`, amb la comprovació d'identitat que
  `useUniversalRichText` ja fa bé avui
  (`src/components/universal/richText/useUniversalRichText.js:36-48`): eixa lògica és la
  bona i és la que s'ha de conservar.

### 6.8 Una frontera d'error

Arregla el §4.10. `EditorErrorBoundary` es suprimix. `SlotErrorBoundary`
(`src/components/universal/workspace/SlotErrorBoundary.jsx`) puja a
`src/components/universal/` i el seu fallback passa a usar `Alerta` de Pedra Seca
(`src/components/PedraSeca/molecules/Alerta.jsx`), que sí que té estil, en compte de les
classes fantasma `sdp-estat*`.

### 6.9 El `ContentProvider` es retira

Arregla el §4.8. Els tres consumidors passen els valors **com a props** al fill que ja
tenen a dues línies (`src/sections/mur/MurSection.jsx:117-118`,
`src/sections/xat/XatSection.jsx:166`, `src/sections/mercat/MercatSection.jsx:30-31`).
El problema de la llengua congelada desapareix perquè ja no hi ha estat intern que
congelar. `useContent` també es lleva de `src/sections/profile/PerfilShell.jsx:145`.

---

## 7. Regles d'UI (Pedra Seca) que la reforma ha de complir

1. **Cap estil en línia al marc.** Hui n'hi ha exactament dos, tots dos a
   `src/components/universal/UniversalEditorShell.jsx:158` i `:160`. La resta de
   `src/components/universal/` ja està net. Que continue net.
2. **Cap classe sense regla.** Les set famílies del §4.4 i les quatre del §4.6 es lleven o
   es doten de CSS. El criteri: si una classe s'emet, ha de tindre regla o no ha d'existir.
3. **Cap número màgic on hi haja token.** `36px` a `src/css/layout.css:282` passa a
   `--sdp-radi-xl` (`src/css/tokens.css:147`), o es crea el token si el Mestre vol
   conservar els 36.
4. **Cap botó sense nom accessible.** El botó d'estat
   (`src/components/universal/UniversalEditorShell.jsx:317-320`) passa per `ActionControl`
   (`src/components/PedraSeca/atoms/controls.jsx:5-27`), com fan la resta de controls de
   les barres (`src/components/universal/PageFrame.jsx:220`,
   `src/components/PedraSeca/organismes/UniversalCard.jsx:290`).
5. **Un sol `h1` per pàgina.** Ja és la llei del catàleg
   (`src/sections/disseny/cataleg/detalls/EspecimenPage.jsx:11`) i el `BlocEditorial` la
   fa estructural.
6. **La mateixa acció es comporta igual als dos modes.** El control de data és clicable a
   lectura i inert a edició (§3): en el marc unificat, o és clicable als dos o a cap.
7. **L'enum es valida sempre.** `crom` es valida com ja es validava
   (`src/components/universal/PageFrame.jsx:138`); i com que `layout` desapareix, ja no hi
   ha cap cadena interpolada sense validar a un nom de classe.
8. **Les barres es componen amb àtoms**, no amb `<button>` crus. Un sol camí per a cada
   control.

---

## 8. Pla d'implementació, per fases

Cada fase és **independentment desplegable i verificable**. Cap fase deixa el portal en un
estat intermedi que no es puga alliberar.

### Fase 0 · La xarxa (obligatòria, abans de tocar res)

Sense això, el §4.15 converteix qualsevol de les fases següents en una juguesca.

1. `src/components/universal/PageFrame.test.jsx` — una prova per preset de crom que
   afirme quines barres es pinten i quantes capçaleres hi ha.
2. Una prova que fixe el defecte del §4.2 com a **comportament esperat després de la
   reforma** (`showLogos={false}` mana).
3. Una prova que afirme que sense `accions.connectar` **no** hi ha botó de Connectar (§4.7).
4. Captures del Mur, de Notes, de Disseny i d'un detall de Text, en clar i en fosc, per a
   comparar-les al final de cada fase.

### Fase 1 · Neteja sense risc (no canvia cap píxel)

Res d'ací altera el DOM que es pinta. Es pot alliberar el mateix dia.

| Acció | Cita |
| --- | --- |
| Llevar `variant` i les dues classes `--embed` | `src/components/universal/PageFrame.jsx:110`, `:149`, `:201`; `src/css/layout.css:202`, `:261` |
| Llevar les dues classes `--top` i les seues regles bessones | `src/components/universal/PageFrame.jsx:149`, `:201`; `src/css/layout.css:203-205`, `:262-264` |
| Llevar `tone`, `noPadding`, `contentClassName`, `hideHeader`, `showTopBars`, `authorAvatarAlt`, `titleText` | `src/components/universal/PageFrame.jsx:110-121`; `src/components/universal/UniversalPage.jsx:14` |
| Llevar `onIaia` i `onSearch` | `src/components/universal/UniversalPage.jsx:20-21`, `:72-73` |
| Llevar la branca d'`onPin` i el `showPin` que l'acompanya | `src/components/universal/PageFrame.jsx:219-223`; `src/sections/text/TextSection.jsx:44` |
| Llevar `sdp-canvas` i el `<div>` que el porta | `src/components/universal/UniversalEditorShell.jsx:207-209` |
| Llevar `.content-wrapper > .hero-image` i `> section.bar-orange` | `src/css/base.css:242-247` |
| Llevar `isPublished` de les dues barres d'eines **o** declarar-lo a `UniversalToolbar` | `src/components/universal/UniversalToolbar.jsx:7-14`; `src/components/universal/richText/UniversalRichTextToolbar.jsx:35`; `src/components/universal/DocumentEditor.jsx:102`; `src/sections/profile/DetallAjust.jsx:319` |
| Corregir el catàleg: `chrome="context"`, i documentar el contracte real | `src/sections/disseny/cataleg/detalls/EspecimenPage.jsx:8-12` |

### Fase 2 · Els defectes visibles (abans de moure l'arquitectura)

Es corregixen ara perquè són **independents** de la reforma i perquè arreglar-los després
amaga si va ser la reforma qui els va trencar.

1. **§4.5** — afegir la regla `[data-marcador]:empty::before` (o `[data-placeholder]`, si
   es fa abans de renomenar) a `src/css/components.css`. Tres marcadors recuperats.
2. **§4.2** — canviar `(showLogos || chrome === 'system')` per `showLogos`, amb el valor
   per defecte del preset (`src/components/universal/PageFrame.jsx:239`).
3. **§4.8** — retirar el `ContentProvider` dels tres consumidors i passar props directes.
   Esborrar `src/components/universal/ContentProvider.jsx` i les lectures de
   `src/components/universal/UniversalPage.jsx:8-9`,
   `src/components/universal/UniversalEditorShell.jsx:150-154` i
   `src/sections/profile/PerfilShell.jsx:145`.
4. **§4.4 i §4.6** — decidir, classe a classe: dotar-la de regla o esborrar-la. Les
   `sdp-estat*` no cal dotar-les: desapareixen a la fase 5.
5. **§4.16** — cablejar `isUploading` a un estat de càrrega visible, i passar `36px` a token.

### Fase 3 · El crom declaratiu

1. Crear `src/components/universal/pagina/cromPagina.js` amb la taula del §6.3.
2. Substituir les línies 137-143 de `src/components/universal/PageFrame.jsx` per una
   lectura de la taula.
3. Fusionar `full` dins de `context` amb un àlies temporal (§9).
4. **Verificació:** les proves de la fase 0 han de passar sense tocar-les. Si alguna canvia,
   la fusió `full`/`context` del §4.1 no era certa i cal parar.

### Fase 4 · La llei del desplaçament

1. Partir `.sdp-workspace-detail` en `__eines` + `__visor` (§6.6) a `src/css/modules.css:292-300`.
2. Moure la barra d'eines de l'editor fora de la pàgina, a la ranura `__eines`, des de
   `src/sections/notes/NotesSection.jsx:112`.
3. Llevar `layout` i les regles `--page` / `--contained` (`src/css/utilities.css:51-95`).
4. Llevar els dos estils en línia (`src/components/universal/UniversalEditorShell.jsx:158`, `:160`).
5. **Verificació:** les barres han de continuar enganxades a Notes, al Mur
   (`src/sections/mur/MurSection.jsx:135`, que perd el seu `layout="contained"`) i al
   detall de Disseny. Ací és on la captura de la fase 0 val el seu pes.

### Fase 5 · La unificació de veritat

1. Crear `CampUniversal` (§6.4) i `BlocEditorial` (§6.5).
2. Reescriure `UniversalPage` perquè pinte directament, absorbint `PageFrame`, amb el
   contracte de quatre props (§6.3).
3. Migrar `DocumentEditor` perquè passe `mode="edicio"` i un `document` en compte de
   construir una closca.
4. Esborrar `src/components/universal/UniversalEditorShell.jsx` sencer —
   `EditableField`, `EditorErrorBoundary` i `useEditorShell` inclosos. La lògica
   d'imatges es queda a `src/hooks/useHeroImageHandler.js`, que ja està bé.
5. Substituir `EditorErrorBoundary` per `SlotErrorBoundary` amb `Alerta` (§6.8).
6. Unificar el desat en `useDesatAmbEspera` (§6.7).
7. Migrar `src/sections/profile/DetallAjust.jsx:312-341`, l'altre consumidor de la closca.

### Fase 6 · El tancament

1. Migrar les 21 crides a `UniversalPage` al contracte nou. Són canvis mecànics:
   `title/subtitle/lead` → `document`.
2. Retirar els àlies de retrocompatibilitat (§9).
3. Netejar els 25 `.content-wrapper` niats del §5.1, començant per
   `src/sections/connectar/ConnectarSection.jsx:196-313`.
4. Actualitzar el catàleg amb el contracte real i un espècimen per preset.

---

## 9. Resposta a la incògnita: quanta retrocompatibilitat

> *«Quin grau de retrocompatibilitat hem de mantenir amb els components heretats durant
> la reestructuració?»*

La resposta depén de qui és el consumidor, i ací només n'hi ha de dues classes:

**Consumidors interns (tots).** Les 21 crides a `UniversalPage` i els 2 usos de la closca
són **del nostre repositori**. No hi ha cap consumidor extern del marc: `PageFrame` només
l'importa `UniversalPage` (comprovat: cap altra importació a `src/`). Per tant
**la retrocompatibilitat no és una obligació tècnica, és una comoditat de migració.**

La recomanació és un compromís curt i amb data:

1. **`UniversalPage` conserva el nom.** El catàleg ja avisa de no rebatejar-la
   (`src/sections/disseny/cataleg/detalls/EspecimenPage.jsx:11`) i té raó: 21 punts de
   crida i una entrada al registre (`src/sections/disseny/cataleg/registre.js:75`).
2. **Un adaptador de props prim, viu només entre la fase 3 i la fase 6.** Accepta la forma
   antiga (`title`, `subtitle`, `lead`, `authorName`…) i la plega dins de `document`, amb
   un `console.warn` en DEV. Trenta línies, un sol fitxer, data de caducitat escrita al
   capçal.
3. **`chrome="full"` es manté com a àlies de `"context"`** durant el mateix període, per
   les tres seccions que el passen.
4. **Zero retrocompatibilitat per als comandaments morts del §2.** `tone`, `noPadding`,
   `contentClassName`, `hideHeader`, `showTopBars`, `authorAvatarAlt`, `titleText` i
   `variant` **no tenen cap consumidor**: mantindre'ls és mantindre deute per ningú.
   S'esborren a la fase 1, sense adaptador i sense avís.
5. **Zero retrocompatibilitat per a `UniversalEditorShell` i `PageFrame`.** Són peces
   internes amb 2 i 1 consumidors respectivament, tots nostres. Es migren i s'esborren.
6. **El `ContentProvider` s'esborra sense adaptador**, perquè el seu comportament actual
   (§4.8) és el defecte: conservar-lo seria conservar el defecte.

En una frase: **compatibilitat de nom i de forma per a `UniversalPage` durant tres fases;
cap compatibilitat per a res que hui no tinga consumidors.**

---

## 10. Resum per al Mestre

- Hi ha **dues piles** per a la mateixa pàgina, i la d'edició reentra dins de la de
  lectura. Tot el laberint ix d'ahí (§1).
- El marc té **41 punts d'entrada**, dels quals **8 no els usa ningú** i **9 comandaments
  de crom donen 4 resultats** (§2, §4.1).
- La mateixa pàgina té **autor, avatar, poble i comportament de data distints** segons si
  la llegixes o l'edites (§3).
- **Defectes visibles hui:** els tres marcadors de l'editor no es veuen (§4.5), el logotip
  no es pot apagar (§4.2), el títol del Mur/Xat/Mercat no es tradueix (§4.8) i el fallback
  d'error de l'editor ix cru (§4.4, §4.10).
- **L'arquitectura es sosté per un `overflow: hidden` en línia** (§4.13).
- La proposta és **un marc, un camp polimòrfic, una taula de crom, un motor de desat i una
  frontera d'error** (§6), amb un pla de **set fases** de les quals les dues primeres no
  canvien ni un píxel (§8).
- La fase 0 no és opcional: **la pila universal no té cap prova** (§4.15).

---

## Bateria de veritat

- [x] He citat només rutes locals, en format `ruta:linies`.
- [x] Cap nom de fitxer, funció o variable inventat: tots els identificadors d'este
      informe apareixen literalment al codi citat, excepte els de la proposta del §6, que
      van marcats com a **proposats** i encara no existixen.
- [x] He respectat la regla de NO tocar cap fitxer de codi. L'únic fitxer escrit en tota
      la sessió és este informe.
- [x] Cap cerca web, cap navegador, cap recuperació externa.
- [x] «Pedra Seca» s'ha interpretat sempre com el sistema de disseny.
- [x] Tall reverificat per md5 al tancament: 17 dels 19 fitxers citats intactes; els 2 que
      un altre agent ha mogut en paral·lel s'han rellegit i la cita afectada s'ha corregit
      (§0.1). No s'ha donat per bona cap línia sense tornar-la a mirar.
- [x] Cacera i refutació en dues fases separades. Cinc hipòtesis tombades i documentades
      al §5 perquè no es reobrin.
