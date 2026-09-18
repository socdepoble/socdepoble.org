---
type: informe
status: esborrany
description: Auditoria visual i d'estructura DOM de l'espai de treball universal (Notes) contra la captura de referència. Fantasmes, línies clares i el píxel perdut.
tags:
  - auditoria
  - disseny
  - universal-workspace
---

# Informe — Fantasmes de UI a l'espai de treball universal

## Registre

| Camp | Valor |
| --- | --- |
| Respon a | SDP-PROMPT-260918-MIN |
| Entorn | entorn-dev-local · branca `backup-notes-publish` |
| Creació | 26-09-18 06:29 |
| Agent redactor | Claude Fable 5.1 |
| Codi modificat | cap (només lectura) |
| Referència visual | captura adjunta al prompt (Bloc de notes, `/notes`, disseny anterior correcte) |
| Estat estable de contrast | commit `0728da01` («save stable state before Codex/Claude audit and Notes UI overhaul») |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[pedra_seca]]
- Prompt origen: `260918_0611_PROMPT_auditoria_extrema_futura.md` (escriptori) i el prompt SDP-PROMPT-260918-MIN d'esta sessió.

## Resum executiu

1. **La línia clara entre columnes** i el **decalatge d'1 píxel** tenen el mateix origen: `src/components/layout/AppGridShell.css:195-198` afegeix `border-right: 1px solid var(--sdp-vora)` a les columnes esquerra i central. Esta regla **no existia** a l'estat estable `0728da01` (el separador visual era el redimensionador de 8px, ara reduït a 0px a `AppGridShell.css:16`). Com que tot el projecte és `box-sizing: border-box` (`src/css/base.css:8`), la vora es menja 1px de la pista de 270px/300px i, a més, travessa de dalt a baix la capçalera fosca de 58px, on la vora hauria de ser `--sdp-crom-vora` i no `--sdp-vora` (pedra-300, clara).
2. **La capçalera de columna ha perdut el títol**: `UniversalWorkspace.jsx` ja no passa `titol` a `AppGridColumn`, de manera que el botó de plegar mostra només el xebró i el `title` HTML diu «Plegar o desplegar undefined». A la captura es llig «⌄ CARPETES» i «NOTES».
3. **Els títols de grup (CATEGORIES, ETIQUETES) no tenen cap regla CSS**: les classes `sdp-workspace-groups`, `sdp-workspace-group` i `sdp-workspace-group__title` no apareixen a cap full d'estil. El `<h3>` cau a la tipografia editorial global (blau, mida h3). A la captura són barres fosques de 58px idèntiques a la capçalera.
4. **La segona fila d'accions de la captura** («Tot ⚙» / «🔍 CREAR NOTA» / «← → 📖 … CONNECTAR») ha desaparegut del DOM, però el seu CSS (`.notes-list-actions`, `.sidebar-actions`, `.notes-actions-left`) segueix viu a `modules.css:3148-3170`, incloent-hi un `margin-right: -1px` fòssil.
5. Un **`<div>` buit dins de cada capçalera** (`AppGridColumn.jsx:76-78`) afegeix 8px morts de `gap` davant del xebró quan no hi ha `startActions` (sempre a la columna esquerra).
6. Inventari complet de **classes fantasma** (CSS sense consumidor JSX, i JSX sense CSS) a la secció 6.

---

## 1. Anatomia del DOM actual (columna esquerra, amplada «ample»)

```
article.app-grid-shell[data-layout=ample]            AppGridShell.jsx:153-158
└─ div.app-grid-content                              AppGridShell.jsx:184
   ├─ section.app-grid-column.app-grid-column--left  AppGridShell.jsx:185-192   (grid-column 1, 270px, border-right 1px ← F1)
   │  └─ aside.sdp-workspace-column                  UniversalWorkspace.jsx:181 (flex col, height 100%, overflow hidden)
   │     ├─ div.app-grid-col-header                  AppGridColumn.jsx:74       (min-height 58, border-bottom crom-vora)
   │     │  ├─ button.univ-manager-inbox-header-btn  UniversalWorkspace.jsx:184-191  «Tot»
   │     │  ├─ div.app-grid-col-header__accions      AppGridColumn.jsx:76-78    ← BUIT (F5)
   │     │  ├─ button.app-grid-col-header__plec      AppGridColumn.jsx:81-92    xebró SENSE títol (F2)
   │     │  └─ div.app-grid-col-header__accions      AppGridColumn.jsx:100-115  ⚙ + replegar
   │     └─ nav.sdp-workspace-column__body           UniversalWorkspace.jsx:202
   │        └─ div.sdp-workspace-groups              UniversalWorkspace.jsx:203 ← sense CSS (F3)
   │           └─ div.sdp-workspace-group            UniversalWorkspace.jsx:205 ← sense CSS (F3)
   │              ├─ h3.sdp-workspace-group__title   UniversalWorkspace.jsx:206 ← sense CSS (F3)
   │              └─ ul.sdp-workspace-categories     UniversalWorkspace.jsx:207
   ├─ div.app-grid-resizer--left (0px d'ample)       AppGridShell.jsx:194-201, AppGridShell.css:165-174
   ├─ section.app-grid-column--middle (300px, border-right 1px ← F1)
   ├─ div.app-grid-resizer--middle (0px)
   └─ section.app-grid-column--right
      └─ div.sdp-workspace-detail                    UniversalWorkspace.jsx:445-452
         └─ section.sdp-editor                       DocumentEditor.jsx:83 ← sense CSS
            └─ div.editor-toolbar (height 58)         UniversalToolbar.jsx:24, modules.css:3133-3144
```

---

## 2. El Misteri d'1 Píxel i les línies clares (F1)

### Evidència

- `src/components/layout/AppGridShell.css:195-198`
  ```css
  .app-grid-column--left,
  .app-grid-column--middle {
    border-right: 1px solid var(--sdp-vora);
  }
  ```
- `src/css/tokens.css:112` → `--sdp-vora: var(--sdp-pedra-300)` (clar). En mode fosc, `tokens.css:322` → pedra-750.
- `src/css/base.css:8` → `*, *::before, *::after { box-sizing: border-box; }`.
- `src/components/layout/AppGridShell.css:72-82` → pistes fixes `var(--app-grid-col-sidebar)` (270px) i `var(--app-grid-col-list)` (300px), amb el redimensionador a `--app-grid-resizer: 0px` (`AppGridShell.css:16`).
- `git diff 0728da01 -- src/components/layout/AppGridShell.css`: la regla de `border-right` és **nova**; a l'estat estable el redimensionador tenia `--app-grid-resizer: 8px` i `background: var(--sdp-vora-control)` i feia de separador visible.

### Per què es veu com «línia blanca on no toca»

La vora és de la `<section>` sencera, de dalt a baix. Travessa:

1. La capçalera fosca de 58px (`.app-grid-col-header`, `AppGridShell.css:205-217`, fons `--sdp-crom-fons` = pedra-900). Una ratlla pedra-300 de 58px d'alt talla la banda fosca entre «CARPETES» i «NOTES», i entre «NOTES» i la barra d'eines de l'editor (`.editor-toolbar`, `modules.css:3133-3144`). A la captura la banda fosca és contínua.
2. La columna central, on cada fitxa ja porta `border-bottom: 1px solid var(--sdp-vora)` (`modules.css:70`) i `border-left: 3px solid transparent` (`modules.css:69`): la vora dreta de la columna s'apila amb les vores de les fitxes i genera el doble traç a la cantonada.

### Per què és «-1px»

Amb `border-box`, la pista de 270px conté 269px de contingut + 1px de vora. Tot el que dins la columna es dimensiona al 100% (capçalera, fitxes de `--sdp-fitxa-mida` 96px amb media quadrada a `modules.css:102-113`) queda 1px més estret que la pista, i la capçalera fosca acaba 1px abans de la següent. A l'estat estable no passava perquè la columna no tenia vora i el separador era una pista pròpia de la graella (8px).

A més, el `::before` del redimensionador (`AppGridShell.css:175-180`, `inset: 0 -4px`) se superposa exactament damunt d'esta vora; en `:hover` pinta `--sdp-accent-vel` per damunt, per la qual cosa la línia canvia de color en passar el ratolí, cosa que fa l'artefacte encara més visible.

### Solució (sense colors nous)

- Eliminar `AppGridShell.css:195-198`.
- Si es vol un separador clar només a la zona de contingut (no a la capçalera), posar-lo a `.sdp-workspace-column__body { border-right: 1px solid var(--sdp-vora); }` (`modules.css:180-186`), o millor, a la pista del redimensionador: tornar `--app-grid-resizer` a `1px` (`AppGridShell.css:16`) amb `background: var(--sdp-vora)` a `.app-grid-resizer` (`AppGridShell.css:165-174`) i `width: var(--app-grid-resizer)`. Així la vora és una pista de la graella, no roba amplada a cap columna, i les capçaleres fosques poden continuar a través seu amb `--sdp-crom-vora` si cal.
- Els `margin-right: -1px` de `modules.css:2208`, `2263` (xat) i `3164` (`.sidebar-actions`, fantasma) són pegats del mateix problema en un altre lloc; no s'han de replicar ací.

---

## 3. La capçalera sense títol (F2)

### Evidència

- `src/components/universal/workspace/UniversalWorkspace.jsx:182-201` (columna esquerra oberta) i `:309-328` (columna central oberta): les crides a `<AppGridColumn>` **no passen `titol`**. Només ho fan les variants `collapsed` (`:166-175` i `:293-302`).
- `src/components/layout/AppGridColumn.jsx:80-92`: amb `titol` `undefined`, el botó `.app-grid-col-header__plec` renderitza el xebró i cap `<span class="app-grid-col-header__titol">`; `title={\`Plegar o desplegar ${titol}\`}` produeix «Plegar o desplegar undefined».
- Estat estable `0728da01`, `UniversalWorkspace.jsx:124-137` i `:184-197`: es passava `titol={title}` / `titol={labels.items}`.
- Captura: «⌄ CARPETES» i «NOTES» visibles a la banda fosca.

### Solució

Passar `titol={labels.categories}` a `UniversalWorkspace.jsx:182` i `titol={labels.items}` a `:309`. Cap canvi de CSS: `.app-grid-col-header__titol` (`AppGridShell.css:254-265`) ja té la tipografia `--sdp-text-meta` 600 de la captura.

---

## 4. Títols de grup sense estil (F3)

### Evidència

- `UniversalWorkspace.jsx:203-219`: `div.sdp-workspace-groups > div.sdp-workspace-group > h3.sdp-workspace-group__title + ul.sdp-workspace-categories`.
- Cerca a `src/css/*.css` i `src/components/layout/AppGridShell.css`: **0 regles** per a `sdp-workspace-groups`, `sdp-workspace-group`, `sdp-workspace-group__title`.
- Per tant el `<h3>` hereta `src/css/base.css:91-96`: `font-size: var(--sdp-text-h3)`, `color: var(--sdp-accio-text)` (blau), sense fons ni alçada fixa.
- Captura: «CATEGORIES» i «ETIQUETES» són barres de 58px amb fons fosc, text `--sdp-text-meta` en majúscules i xebró a l'esquerra, exactament el mateix aspecte que `.app-grid-col-header`.
- Existeix una variant preparada per a això que **ningú instancia**: `.app-grid-col-header--accordion` (`AppGridShell.css:227-233`) i `variant === 'accordion'` a `AppGridColumn.jsx:24,74`. Cap fitxer JSX passa `variant="accordion"`.

### Doble «CARPETES»

`src/sections/notes/NotesSection.jsx:45` etiqueta el primer grup com `'CARPETES'` i `:96` també fa `labels.categories = 'CARPETES'`. Quan es corregisca F2, es veurà «CARPETES» dues vegades seguides (capçalera i títol de grup). A la captura les carpetes van directament sota «Tot», sense barra pròpia: el grup `folders` hauria de tindre `label: null` (`UniversalWorkspace.jsx:206` ja ho gestiona amb `group.label &&`).

### Solució

Opció A (menys DOM): eliminar `div.sdp-workspace-groups` (`:203`) i renderitzar per a cada grup amb etiqueta un `<AppGridColumn variant="accordion" titol={group.label} plegable />` en lloc del `<h3>`, i estilar `.app-grid-col-header--accordion` amb `min-height: var(--sdp-alt-accio)` (ja l'hereta de `.app-grid-col-header`).
Opció B (només CSS): definir `.sdp-workspace-group__title` amb les mateixes declaracions que `.app-grid-col-header` (`AppGridShell.css:205-217`): `display:flex; align-items:center; min-height: var(--sdp-alt-accio); padding: 0 var(--sdp-space-4); background: var(--sdp-crom-fons); color: var(--sdp-crom-text); font-size: var(--sdp-text-meta); font-weight: 600; border-bottom: 1px solid var(--sdp-crom-vora)`. Cap color nou: tots són tokens de Pedra Seca (`tokens.css:240-244`).

---

## 5. La segona fila d'accions i el `<div>` buit (F4, F5)

### F4 · La fila «Tot ⚙ / 🔍 CREAR NOTA / ← → 📖 … CONNECTAR»

A la captura hi ha **dues** bandes de 58px sobre cada columna: la capçalera (títols) i una fila d'accions (esquerra: «Tot» + engranatge; central: lupa + «CREAR NOTA»; dreta: navegació de l'editor + «CONNECTAR»). El codi actual fon les dues en una sola capçalera (`UniversalWorkspace.jsx:182-201`, `:309-328`) i col·loca «Tot», la lupa i «CREAR NOTA» a la mateixa fila que el xebró.

El CSS de la fila perduda encara existeix i ja no té cap consumidor JSX:

- `src/css/modules.css:3148-3161` `.notes-list-actions, .sidebar-actions` (height 58, `--sdp-crom-fons`, `border-bottom --sdp-vora-control`).
- `src/css/modules.css:3163-3165` `.sidebar-actions { margin-right: -1px; }` ← el mateix pegat de -1px que al xat.
- `src/css/modules.css:3167-3170` `.notes-actions-left`.
- `grep -rn "notes-list-actions\|sidebar-actions\|notes-actions-left" src --include=*.jsx` → 0 resultats.

Decisió de disseny per al Mestre: **o** es restaura la segona fila (reutilitzant estes classes, sense el `margin-right: -1px`), **o** s'esborren les tres regles. Mantindre-les sense consumidor és el fantasma més gran del fitxer.

### F5 · El `<div>` buit que desplaça 8px

- `src/components/layout/AppGridColumn.jsx:76-78`:
  ```jsx
  <div className="app-grid-col-header__accions">
    {renderActions(startActions)}
  </div>
  ```
  es renderitza sempre, també quan `startActions` és `[]` (columna esquerra: `UniversalWorkspace.jsx:182-201` no en passa).
- `.app-grid-col-header` és `display:flex; gap: var(--sdp-space-2)` (`AppGridShell.css:205-209`): un fill buit consumeix un `gap` sencer. Resultat: entre «Tot» i el xebró hi ha 8px addicionals que no existeixen a la captura, i `justify-content: space-between` reparteix l'espai entre quatre fills en lloc de tres.

Solució: `{startActions.length > 0 && (<div className="app-grid-col-header__accions">…</div>)}`.

---

## 6. Inventari de fantasmes

### 6.1 CSS sense cap consumidor JSX (candidats a esborrar)

| Selector | Ruta:línies | Notes |
| --- | --- | --- |
| `.univ-manager-header-search-trigger` | `src/components/layout/AppGridShell.css:275,292-296,386` | Cercador antic de capçalera. |
| `.univ-manager-header-search` (+ `svg`, `input`, `::placeholder`) | `src/components/layout/AppGridShell.css:298-323,387` | Ídem. |
| `.app-grid-col-header--accordion` | `src/components/layout/AppGridShell.css:227-233` | Variant mai instanciada (vegeu F3: és la peça que falta per als títols de grup). |
| `.app-grid-col-header__accio-text` | `src/components/layout/AppGridShell.css:276,384` | Només s'activa amb `variant: 'text'` (`AppGridColumn.jsx:29-30`); cap consumidor de `UniversalWorkspace` la passa. |
| `.univ-manager-toolbar__icon` (+ estats) | `src/css/modules.css:370-396` | |
| `.univ-manager-create` (+ hover) | `src/css/modules.css:407-423` | Duplicat funcional de `.app-grid-col-header__accio` (`AppGridShell.css:359-374`). |
| `.univ-manager-search` (+ input) | `src/css/modules.css:425-434` | |
| `.univ-manager-facet-tree-branch` | `src/css/modules.css:498-504` | |
| `.notes-column__body--sense-marge` | `src/css/modules.css:662` | |
| `.notes-list-actions`, `.sidebar-actions`, `.notes-actions-left` | `src/css/modules.css:3148-3170` | Vegeu F4. |

### 6.2 Duplicats byte a byte

- `.notes-column` / `.notes-column__body` (`src/css/modules.css:300-319`) són idèntics a `.sdp-workspace-column` / `.sdp-workspace-column__body` (`src/css/modules.css:171-186`). Únic consumidor: `src/sections/admin/AdminSection.jsx:13,19`. Migrar Admin a `sdp-workspace-*` i esborrar `notes-column*`.
- `.univ-manager-toolbar--list` (`modules.css:346-351`) i `.app-grid-col-header` (`AppGridShell.css:216`) declaren el mateix degradat `linear-gradient(var(--sdp-crom-hover), var(--sdp-crom-hover)), var(--sdp-crom-fons)`; també `.editor-toolbar` (`modules.css:3141`). Candidat a un sol token o classe compartida.

### 6.3 JSX amb classe però sense CSS (divs morts)

| Element | Ruta:línies | Efecte |
| --- | --- | --- |
| `div.sdp-workspace-groups` | `UniversalWorkspace.jsx:203` | Embolcall sense cap regla; `nav.sdp-workspace-column__body` pot contindre els grups directament. |
| `div.sdp-workspace-group` | `UniversalWorkspace.jsx:205` | Sense regla. Si es manté, només com a `<section>` semàntic. |
| `h3.sdp-workspace-group__title` | `UniversalWorkspace.jsx:206` | Vegeu F3. |
| `section.sdp-editor` | `src/components/universal/DocumentEditor.jsx:83` | Cap regla `.sdp-editor` a `src/css`. |
| `aside.sdp-workspace-column` dins `section.app-grid-column` | `UniversalWorkspace.jsx:181,308` + `AppGridShell.jsx:185,203` | Dos contenidors flex-columna imbricats amb `overflow:hidden` (`AppGridShell.css:57-69` i `modules.css:171-178`). Funciona, però és un nivell redundant; si es conserva, `height: 100%` de `modules.css:174` és el que garanteix l'alçada, no cal `background: inherit` (`:177`) perquè el fill ja és transparent. |

### 6.4 Regles que s'anul·len mútuament

- `.sdp-workspace-detail { background: var(--sdp-fons-app) }` (`modules.css:291-299`) tapa `:root[data-theme="dark"] .app-grid-page .app-grid-column--right { background: var(--sdp-fons-invers) }` (`AppGridShell.css:160-163`). En mode fosc la regla de la graella és lletra morta.
- `.app-grid-col-header { position: relative; z-index: 10 }` (`AppGridShell.css:212-213`) i `.notes-list-actions { position: relative; z-index: 10 }` (`modules.css:3159-3160`): eren per a cobrir vores amb `margin-right: -1px`. Sense el pegat, els `z-index` no fan res.

---

## 7. Fila d'etiquetes i cerca a la columna central (F6)

- `UniversalWorkspace.jsx:349-371` pinta `div.sdp-workspace-tags` amb un xip per etiqueta sempre que algun element en tinga. A Notes, les etiquetes ja es llisten a la columna esquerra com a grup «ETIQUETES» (`NotesSection.jsx:55`). La captura no mostra cap fila de xips.
- `modules.css:260-267`: la fila porta `border-bottom: 1px solid var(--sdp-vora)` i `background: var(--sdp-fons-app)`: una segona línia clara just sota la banda fosca, i un canvi de fons (pedra-150) respecte al blanc de les fitxes (`--sdp-fons-targeta`, `modules.css:72`).
- `modules.css:217-224`: `.sdp-workspace-search-row` idem (`border-bottom --sdp-vora` sota capçalera fosca).

Solució: fer la fila d'etiquetes opcional per model (p. ex. no renderitzar-la quan el model ja aporta un `navigationGroup` d'etiquetes), i canviar la vora inferior d'ambdues files a `--sdp-crom-vora` si estan enganxades a la capçalera, o eliminar-la.

---

## 8. Icones de carpeta (F7, menor)

La captura mostra una icona (Mur, Mercat, Pobles…) davant de cada carpeta. `CategoryItem` (`UniversalWorkspace.jsx:225-239`) només renderitza `label`; el model de `NotesSection.jsx:48-52` tampoc passa `icon`. No és un fantasma, però és una regressió respecte a la captura.

---

## 9. Regles d'altura (58px)

Verificació de les tres bandes de 58px de la captura:

| Peça | Ruta:línies | Declaració | Alçada exterior |
| --- | --- | --- | --- |
| Token | `src/css/tokens.css:168` | `--sdp-alt-accio: 58px` | — |
| Capçalera de columna | `src/components/layout/AppGridShell.css:210,214` | `min-height: var(--sdp-alt-accio)` + `border-bottom: 1px` | 58 (57 de contingut + 1 de vora, border-box) |
| Barra de l'editor | `src/css/modules.css:3137-3138,3143` | `flex: none; height: var(--sdp-alt-accio)` + `border-bottom: 1px` | 58 |
| Pestanyes mòbil | `src/components/layout/AppGridShell.css:33-38` | `height: var(--app-grid-header-height)` | 58 |
| Fila d'accions fantasma | `src/css/modules.css:3155` | `height: var(--sdp-alt-accio)` | 58 |

Conclusions:

1. Les vores inferiors de la capçalera esquerra, central i de l'editor cauen totes a y=58: **s'alineen**. El decalatge visible no ve d'ací sinó de la vora vertical (F1).
2. La capçalera usa `min-height` i pot créixer, la barra de l'editor usa `height` i no. Amb els continguts actuals (botons de 44px: `AppGridShell.css:341-342,364`; `--sdp-touch-min: 44px`, `tokens.css:176`) cap dins de 57px i no creix. Si en el futur s'afegira una segona línia (p. ex. el cercador dins la capçalera), la capçalera creixeria i l'editor no. Recomanació: unificar a `height: var(--sdp-alt-accio); flex: none` a `.app-grid-col-header`, i deixar que el desbordament el gestione la fila d'accions (F4).
3. En un contenidor flex-columna, la capçalera no té `flex: none`; com que té `min-height` 58 i el cos té `flex: 1 1 0; min-height: 0` (`modules.css:181-182`), no pot encongir-se per davall de 58. Correcte, però `flex: none` explícit ho documentaria.
4. En «estret», `.app-grid-headers` (58) se suma a la capçalera de cada columna (58): banda fosca de 116px. Fora de l'abast de la captura (escriptori), es deixa constància.

---

## 10. Pla de correcció suggerit (ordre)

1. **F1** · Esborrar `AppGridShell.css:195-198`. Si cal separador, tornar `--app-grid-resizer` a `1px` amb fons `--sdp-vora` al redimensionador.
2. **F2** · Passar `titol` a `UniversalWorkspace.jsx:182` i `:309`.
3. **F5** · Condicionar el `div` de `startActions` a `AppGridColumn.jsx:76-78`.
4. **F3** · Estilar els títols de grup (opció A amb `variant="accordion"`, o opció B amb CSS nou sobre tokens crom) i posar `label: null` al grup `folders` de `NotesSection.jsx:45`.
5. **F4** · Decidir si es restaura la fila d'accions; en tot cas eliminar `modules.css:3163-3165`.
6. **F6** · Fila d'etiquetes opcional; vores inferiors de `search-row`/`tags` a `--sdp-crom-vora` o cap.
7. **6.1–6.4** · Neteja de fantasmes.
8. **F7** · Icones de carpeta.

---

## Bateria de veritat

- [x] He citat només rutes reals en format `ruta:linies` (totes verificades amb `grep`/`sed` sobre l'arbre de treball i `git show 0728da01`).
- [x] He tingut en compte la captura de pantalla adjunta (seccions 2, 3, 4, 5, 7, 8 i 9 contrasten cada peça amb ella).
- [x] He localitzat el problema del -1px i de les línies blanques (`src/components/layout/AppGridShell.css:195-198`, absent a l'estat estable).
- [x] No he modificat cap fitxer de codi; l'únic fitxer escrit és este informe.
