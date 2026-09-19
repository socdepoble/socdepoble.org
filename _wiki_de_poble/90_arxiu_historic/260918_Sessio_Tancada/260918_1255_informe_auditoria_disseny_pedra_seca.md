---
type: informe
status: esborrany
description: Auditoria extrema de la capa visual — tokens, UniversalCard, PillToggle, AppGridShell i la pagina del Bloc de Notes contra la imatge de referencia.
tags:
  - disseny
---

# Auditoria — Sistema de Disseny i Pedra Seca

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-C |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 12:55 |
| Modificació | 26-09-18 12:55 |
| Agent redactor | Claude (Mestre d'Obra) |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_index_escriptori]]
- [[260918_1230_prompt_claude_disseny]]
- [[AGENTS]]

## Entrades

- Tall del codi: commit `e7f3e8ae` + arbre de treball, congelat a l'inici de la sessió.
- Totes les cites s'han reverificat per md5 al final: **cap fitxer de `src/` ha canviat** durant l'auditoria. Les rutes i línies són vàlides.
- Servidor viu: `http://localhost:3340` (el del Mestre; no s'ha arrancat cap segon procés).
- Imatge de referència adjunta pel Mestre (pàgina de Notes, tema clar).

## Contenció

No s'ha tocat ni una línia de codi. Tot el que hi ha ací són diagnòstics i
propostes perquè les aplique la IAIA MarIA.

---

## 0. Com s'ha fet i com s'ha de llegir

L'auditoria s'ha fet en **dues fases separades**: primer cacera (hipòtesis), després
refutació (intent actiu de tombar cada hipòtesi). Les troballes del §5 són les que
han **sobreviscut** la refutació i porten proves reproduïbles. Les del §6 són les que
**he tombat jo mateix**: van semblar defectes i no ho són. El Mestre les té ací per a
que cap auditoria futura les torne a obrir.

Les proves són de tres classes:

- **Espec.** — conseqüència garantida per la especificació de CSS (p. ex. una custom
  property inexistent fa la declaració IACVT).
- **Empírica** — s'ha executat i s'ha mesurat (Node, `curl`, un banc de proves de capes).
- **Visual** — captura de l'aplicació viva en el punt de ruptura indicat.

---

## 1. Diagnòstic en una pàgina

L'arquitectura és **bona**. Les dues capes de tokens, la Capa 2b de crom i l'ordre
de `@layer` declarat davant dels `@import` són decisions correctes i ben documentades.
El problema no és el disseny: és que **la documentació i el codi han divergit en
punts concrets i ningú ho detecta**, perquè les portes compten cadenes de text i no
resolen la cascada — exactament el que avisa el capçal de `src/css/index.css:20-27`.

Les tres famílies de defecte, per ordre de gravetat:

1. **Variables i variants que no existixen.** Quatre `var()` sense definició i una
   variant de botó inventada. CSS no avisa: la declaració desapareix en silenci i
   la peça es queda amb el valor inicial. En un cas (`.sp-card:hover`) això
   **invertix** la intenció: passar el ratolí per damunt d'una targeta li **lleva**
   l'ombra.
2. **Tokens que s'invertixen damunt de fons de marca que no s'invertixen.** Set llocs.
   El resultat en tema fosc és blanc damunt de taronja a **2,73:1** — literalment el
   número que el mateix sistema prohibix a `PillToggle.jsx:18`.
3. **La pàgina de Notes no està acabada.** La diferència amb la imatge del Mestre no
   és de maquetació: és que l'editor pinta **mobiliari d'edició com si fora contingut
   de pàgina** i l'avatar per defecte apunta a un fitxer que no existix.

I un punt cec estructural: **en mòbil (≤420px) la barra d'eines de l'editor es trenca
físicament** — els botons es solapen. No és un detall estètic, és una pantalla
inutilitzable.

---

## 2. Objectiu 1 · Sistema de Disseny i variants

### A1 · `--sdp-ombra-4` no existix enlloc — 4 usos · **GREU**

| Fitxer | Regla |
| --- | --- |
| `src/css/components.css:174` | `.sdp-dialeg` |
| `src/css/components.css:633` | `.sp-card:hover` |
| `src/css/components.css:747` | `.sp-card--action:hover` |
| `src/css/modules.css:1864` | `.toc-drawer` |

`tokens.css:151-153` només declara `--sdp-ombra-1`, `-2` i `-3`. Cap fitxer del
projecte declara `--sdp-ombra-4`.

**Efecte (espec.):** `box-shadow: var(--sdp-ombra-4)` és IACVT. El valor cau a `unset`;
com que `box-shadow` no s'hereta, això és `initial`, és a dir **`none`**.

- El diàleg modal i el calaix de la Taula de Continguts **no tenen ombra**: suren
  sense separar-se del fons.
- `.sp-card:hover` guanya en especificitat a `.sp-card { box-shadow: var(--sdp-ombra-3) }`
  (`components.css:517`). Per tant, **passar el ratolí per damunt d'una targeta li lleva
  l'ombra**, amb una transició de 0,3s (`--sdp-t-lenta`) que fa l'enfonsament ben visible.
  L'elevació està invertida a tot el Mur.

**Proposta.** Dos camins; el segon és el que recomane:

```css
/* a) declarar el graó que falta, a tokens.css, al costat dels altres tres */
--sdp-ombra-4: 0 18px 44px rgba(14, 13, 12, 0.14);
/* i al bloc fosc: */
--sdp-ombra-4: 0 18px 44px rgba(0, 0, 0, 0.70);
```

```css
/* b) l'escala documentada són TRES elevacions (tokens.css:150).
   Respectar-la i pujar un graó on toca: */
.sp-card { box-shadow: var(--sdp-ombra-2); }
.sp-card:hover { box-shadow: var(--sdp-ombra-3); }
.sdp-dialeg, .toc-drawer { box-shadow: var(--sdp-ombra-3); }
```

L'opció (b) no afegix vocabulari i deixa el repòs per davall de l'hover, que és el que
la targeta vol dir.

### A2 · `.sdp-boto--accio` no existix; el botó «Publicar» és blau per accident · **GREU**

`src/components/universal/UniversalToolbar.jsx:82` escriu
`className="sdp-boto sdp-boto--accio"`.

Les variants que el full canònic defineix (`components.css:67-78`) són:
`--primari`, `--secundari`, `--accent`, `--perill`, `--fantasma`, `--gran`, `--ple`.
**`--accio` no és cap d'elles**, i no hi ha cap regla `.sdp-boto--accio` al projecte.

Aleshores, per què es veu blau? Perquè `src/sections/profile/PerfilShell.css:103-116`
redefinix la **base** `.sdp-boto` amb `background: var(--sdp-accio)`. Eixe full és
d'una secció, però `src/css/index.css:65` l'importa globalment.

**Prova empírica** (banc de proves amb l'ordre real de capes d'`index.css`, valors
calculats pel navegador):

```
secundari -> rgb(255, 255, 255)   la sub-capa de PerfilShell PERD
accent    -> rgb(255, 115, 0)     la sub-capa de PerfilShell PERD
accio     -> rgb(1, 110, 191)     blau, pintat NOMÉS per PerfilShell.css
```

Les variants reals estan salvades (PerfilShell obri `@layer components` dins d'un
`@import ... layer(components)`, i una sub-capa perd contra la capa pare). Però
**`--accio`, que no té regla pròpia, es queda amb l'únic fons que hi ha: el de la fuga.**

Això vol dir que el dia que algú netege `PerfilShell.css` — que és el que toca fer —
**el botó de publicar es tornarà transparent** damunt de la barra fosca.

**Proposta**, en este ordre:

1. `UniversalToolbar.jsx:82` → `className="sdp-boto sdp-boto--primari"`.
2. Després, i no abans, renombrar la regla de `PerfilShell.css:103-116` a una classe
   pròpia de la secció (p. ex. `.perfil-boto`) o esborrar-la si ja no cal.

### A3 · Text que s'invertix damunt de fons de marca que no s'invertix — 7 llocs · **GREU**

`tokens.css:280-284` ho diu amb totes les lletres:

> *Blanc que NO s'inverteix. `--sdp-text-invers` SÍ que s'inverteix […] posar-lo damunt
> d'un fons saturat com `--sdp-error` deixaria text negre sobre roig en fosc.*

I `PillToggle.jsx:18` posa el número: *«Mai blanc sobre taronja (2,73:1)»*.

Set regles fan exactament això:

| Fitxer:línia | Regla | Fons | Text | Fosc |
| --- | --- | --- | --- | --- |
| `base.css:217` | `::selection` | `--sdp-accent` | `--sdp-text-titol` | **2,73:1** |
| `components.css:371-374` | `.btn-primary` | `--sdp-accent` | `--sdp-text-titol` | **2,73:1** |
| `components.css:410-413` | `.btn-danger` | `--sdp-error` | `--sdp-text-invers` | **3,18:1** |
| `components.css:671-680` | `.sp-card-author-name` | barra taronja | `--sdp-text-titol` | **2,73:1** |
| `components.css:682-689` | `.sp-card-author-location` | barra taronja | `--sdp-text-titol` | **2,73:1** |
| `layout.css:241-245` | `section.bar-orange` | `--sdp-accent` | `--sdp-text-titol` | **2,73:1** |
| `modules.css:2332` | `.xat-main-header` | `--sdp-accio` | `--sdp-text-invers` | **3,68:1** |

Ràtios calculades sobre els valors reals (`#FF7300`, `#016ebf`, `#c2181d`) i sobre
`--sdp-text-titol` = `pedra-50` = `#ffffff` i `--sdp-text-invers` = `pedra-900` =
`#0e0d0c` en fosc (`tokens.css:316-319`). El mínim AA és 4,5:1.

**Prova visual.** En tema fosc, la barra taronja de la nota mostra «Foraster /
Identitat Lliure» en **blanc damunt de taronja**. En clar, el mateix text és negre.
La barra ha canviat de color de text tot i que el fons no ha canviat gens.

`.btn-danger` és el cas exacte que el comentari de `tokens.css` posa d'exemple
prohibit — i `.sdp-boto--perill` (`components.css:73`), a nou línies de distància,
ho fa bé amb `--sdp-sobre-color`.

**Proposta.** Substitució mecànica, un token per regla:

```css
/* fons taronja  -> */ color: var(--sdp-sobre-accent);   /* sempre pedra-900 · 7,12:1 */
/* fons blau     -> */ color: var(--sdp-sobre-accio);    /* sempre #fff    · 5,27:1 */
/* fons d'estat  -> */ color: var(--sdp-sobre-color);    /* sempre #fff    · 6,10:1 */
```

`.sp-card-meta` (`components.css:697-704`) ja usa `--sdp-sobre-accent`: dins de la
mateixa barra, la data ho fa bé i el nom de l'autor no. És una incoherència interna
d'un sol component.

**Porta que ho impediria.** `tooling/gates/tractor-crom.mjs` ja vigila que ningú
redefinisca `--sdp-crom-*` al bloc fosc. La regla germana que falta és: *si una regla
declara `background` amb un token de marca fix, el seu `color` ha de ser un
`--sdp-sobre-*`*. Es pot escriure amb el mateix detector que he fet servir ací.

### A4 · `color: var(--sdp-text-base)` — un token de mida com a color — 4 llocs · **MITJÀ**

`--sdp-text-base` és `1.125rem` (`tokens.css:200`). És una **mida de lletra**.

| Fitxer:línia | Regla |
| --- | --- |
| `components.css:1116` | `.pill` |
| `modules.css:1927` | `.toc-item button` |
| `modules.css:2069` | `.form-control` |
| `modules.css:2111` | `.sdp-avisador-efimer` |

**Efecte (espec.):** `color: 1.125rem` és IACVT. Com que `color` **sí** que s'hereta,
el valor cau a `inherit`. El color declarat no s'aplica mai: l'element agafa el del
seu pare.

Ara mateix es veu acceptable en la majoria de casos, però **per sort, no per disseny**.
El dia que una `.pill` o un `.form-control` entren dins d'un contenidor de color
(una barra taronja, una targeta d'error) heretaran eixe color i seran il·legibles.
El toast (`.sdp-avisador-efimer`) és el més exposat: és `position: fixed` i el seu
color depén d'on el munte React.

**Proposta:** `color: var(--sdp-text-cos)` als quatre llocs (o `--sdp-text-titol` al
toast, si es vol més contrast).

### A5 · `.btn-taronja-fort` pintat amb tinta de barra de desplaçament · **MITJÀ**

`components.css:1048-1073`. La classe es diu «botó taronja fort» i **cap dels seus tres
estats fa servir cap token taronja**:

```css
.btn-taronja-fort        { background: var(--sdp-crom-scroll-pista);    /* rgba(0,0,0,0.15) */ }
.btn-taronja-fort:hover  { background: var(--sdp-crom-scroll-puny);     /* rgba(0,0,0,0.21) */ }
.btn-taronja-fort.active { background: var(--sdp-crom-scroll-puny-viu); /* rgba(0,0,0,0.35) */ }
```

Els tres tokens són els del **puny i la pista de la barra de desplaçament** de la closca
(`tokens.css:258-260`). Té tota la pinta d'un cerca-i-substituïx que va enganxar el
token per proximitat alfabètica.

**Consumidors reals:** `src/sections/xat/XatSection.jsx:215-219` — els cinc filtres
del Xat («Tot / No llegit / Grups / IAIES / +»).

**Prova visual.** Damunt de la barra taronja del Xat, els cinc filtres es lligen com a
ombres mig transparents, no com a botons. A més, `color: var(--sdp-text-invers)`
(línia 1050) és un altre cas d'A3: en fosc el text es torna negre damunt d'un fons
translúcid fosc.

**Proposta:** si han de ser botons damunt de taronja, el parell correcte és
`background: var(--sdp-crom-realc)` / `var(--sdp-crom-hover)` amb
`color: var(--sdp-sobre-accent)`. Si el nom ja no diu la veritat, també val la pena
renombrar-la.

### A6 · PillToggle: el contracte diu taronja, el CSS pinta blau · **MITJÀ**

Dos documents, la mateixa frase:

- `PillToggle.jsx:18` — *«Actiu = taronja amb text fosc (`--sdp-sobre-accent`). Mai
  blanc sobre taronja (2,73:1).»*
- `modules.css:474` — *«Actiu: taronja amb text fosc. Mai blanc sobre taronja.»*

I la regla, quatre línies més avall del segon comentari (`modules.css:513-517`):

```css
.sdp-pindola__opcio[aria-pressed="true"] { background: var(--sdp-accio); color: var(--sdp-sobre-accio); }
```

**Blau amb text blanc.** No és un problema de contrast (5,27:1, compleix AA), és un
**contracte trencat**: la peça insígnia del sistema no fa el que la seua pròpia fitxa
diu, i el taronja de marca no apareix enlloc. Qualsevol auditoria futura que confie en
el comentari donarà un veredicte fals.

**Prova visual.** Al Mur, la píndola «Mostrar tot | Mercat | Agenda | Mapa» té l'opció
activa en blau.

**Proposta.** Decidir quina de les dues veritats val i **fer que l'altra la seguisca**:
si el canon és taronja, `background: var(--sdp-accent); color: var(--sdp-sobre-accent)`;
si el canon és blau, corregir els dos comentaris. El que no pot quedar és així.

### A7 · `--sdp-hover` no existix · **MITJÀ**

`modules.css:3110`:

```css
.editor-toolbar .toolbar-actions button:hover:not(:disabled) { background: var(--sdp-hover); }
```

Cap fitxer declara `--sdp-hover`. Declaració IACVT → `background` cau a `transparent`,
que és el mateix que en repòs. **El hover dels botons de format de l'editor no pinta res.**

Hi ha un pegat parcial a `components.css:1224-1227` que sí que aplica (`outline`), així
que queda un contorn però cap realç de fons. La regla que sí que volia fer-ho
(`components.css:1192-1195`, amb `--sdp-crom-hover`) **perd la cascada**: el selector de
`modules.css` és més específic (`.editor-toolbar .toolbar-actions button:hover:not(:disabled)`
= 0,4,1 contra 0,3,0) i els dos fitxers escriuen a `@layer components`.

**Proposta:** `background: var(--sdp-crom-hover);` — el token que la regla germana ja
feia servir, i que és el correcte damunt de la closca fosca.

### A8 · CSS escrit per a enganyar una porta · **BAIX, higiene**

`components.css:1092-1102`:

```css
.grups, .iaies, .idle, .no-llegits, .totes, .pill--accent, .search-icon, .xat-control-dropdown {
  /* Dummy for gatekeeper */
  display: initial;
}
```

Són vuit classes amb una declaració real (`display: initial` = `display: inline`) posades
ací només perquè una porta les trobe. Ara mateix no trenquen res — `.pill` ve després amb
la mateixa especificitat i guanya — però és CSS viu escrit per a satisfer un comptador,
i el dia que l'ordre canvie trencarà en silenci.

**Proposta:** llevar el bloc i, si la porta les reclama, ensenyar-li a mirar el JSX en
lloc de demanar-li tribut al CSS.

### A9 · CSS mort confirmat · **BAIX**

- `.pill--icon` (`components.css:1081-1090`) — **cap consumidor** al JSX.
- `.sidebar-actions .btn-icon` i `.notes-list-actions .btn-icon` (`components.css:1197-1200`)
  — cap dels dos contenidors existix al JSX.

### A10 · `--sdp-touch-min` declarat dues vegades · **BAIX**

`design-tokens.css:10` (generat des de `design-tokens.json`) i `tokens.css:176`, amb el
mateix valor. `tokens.css` s'importa després i guanya. Vol dir que **el tauler de control
no mana**: si algú canvia el JSON, el canvi no arriba. Convé decidir qui és la font.

---

## 3. Objectiu 2 · Layout i responsive

### B1 · `inert` no arriba mai al DOM amb React 18 · **GREU, accessibilitat**

`AppGridShell.jsx:208, 226, 244`:

```jsx
inert={tancada.left ? true : undefined}
aria-hidden={tancada.left ? true : undefined}
```

React 18.3.1 **no coneix l'atribut `inert`** (zero apariciones en tot
`node_modules/react-dom/cjs/react-dom.development.js`). El suport va arribar amb React 19.

**Prova empírica** (`renderToStaticMarkup`, react-dom 18.3.1, el que hi ha instal·lat):

```
inert={true}         -> <section>x</section>        ← l'atribut DESAPAREIX
inert="true"         -> <section inert="true">x</section>
aria-hidden={true}   -> <section aria-hidden="true">x</section>
```

React tracta `inert` com a atribut no booleà, avisa per consola i **el descarta**.

**Conseqüència.** En tauleta i mòbil, el calaix tancat es queda amb `aria-hidden="true"`
però **sense `inert`**. Les columnes amagades es mouen amb `transform: translateX(-100%)`
(`AppGridShell.css:138, 143`), i `transform` **no lleva res de l'ordre de tabulació**.
Resultat: qui navega amb teclat entra amb Tab dins d'un panell que està fora de pantalla,
i com que està marcat `aria-hidden`, **el lector de pantalla no diu res**. És el patró
que WCAG marca com a fallada de 2.4.3 (ordre del focus) i 4.1.2 (nom i rol).

No hi ha cap xarxa de seguretat: no existix cap regla CSS per a `[inert]` ni cap
`visibility: hidden` en estos selectors.

**Proposta**, per ordre de preferència:

```jsx
/* a) el que React 18 sí que escriu */
inert={tancada.left ? '' : undefined}
```

```css
/* b) cinturó CSS que a més bloqueja el focus de veritat */
.app-grid-shell[data-layout="mitja"] .app-grid-column--left:not([data-obert="true"]),
.app-grid-shell[data-layout="estret"] .app-grid-column--left:not([data-obert="true"]),
.app-grid-shell[data-layout="estret"] .app-grid-column--middle:not([data-obert="true"]) {
  visibility: hidden;
}
/* i tornar-la visible en obrir, amb transition-behavior o un retard com el de
   nav.app-sidebar a layout.css:326, que ja resol exactament este problema */
```

De fet `layout.css:317-333` **ja fa bé** este patró per a `nav.app-sidebar`
(`visibility: hidden` + `transition: … visibility 0s linear 0.3s`). La graella és
l'única que no l'ha heretat.

### B2 · La barra d'eines de l'editor es trenca per davall de ~420px · **GREU**

```css
.editor-toolbar          { display: flex; height: var(--sdp-alt-accio); align-items: center; }  /* modules.css:3075-3086 · 58px FIXOS */
.editor-toolbar .toolbar-actions { flex: 1 1 240px; flex-wrap: wrap; }                          /* modules.css:3092-3098 */
```

Una **alçada fixa** en el pare i **`flex-wrap: wrap`** en el fill són incompatibles: quan
els cinc botons de format no caben, passen a una segona línia que **desborda la caixa de
58px** en lloc de fer-la créixer.

**Prova visual (375×812).** «H2 ≡ B» a la primera línia, «I S» a la segona, el botó
*Publicar* solapat damunt, i tot plegat envaint la barra blava de sota. La barra és
inservible.

**Proposta:**

```css
.editor-toolbar {
  height: auto;
  min-height: var(--sdp-alt-accio);   /* el mateix contracte visual, sense la trampa */
  flex-wrap: wrap;                     /* que el pare també puga respirar */
  padding-block: var(--sdp-space-1);
}
```

Alternativa més ajustada al patró de barra d'eines, si el Mestre vol conservar una sola
línia sempre: `.toolbar-actions { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: thin; }`.

### B3 · El botó de tornada de la barra d'eines du el crom natiu del navegador · **MITJÀ**

`UniversalToolbar.jsx:25-33` pinta el botó «Tornar a la llista» com a **fill directe** de
`.editor-toolbar`, **fora** de `.toolbar-actions`.

El reinici que neteja els botons viu a `modules.css:3100-3107` i està aparellat a
`.editor-toolbar .toolbar-actions button`. Per tant **no l'agafa**. I `.btn-icon`
(`components.css:1202-1206`) només declara `width`, `height` i `padding`: ni `background`
ni `border`. L'únic reinici global de botons és `base.css:52`
(`button, input, select, textarea { font: inherit; }`), que no toca el fons.

**Resultat:** el botó es pinta amb el fons `ButtonFace` i la vora `outset` de l'agent
d'usuari — un quadrat gris clar en relleu — damunt de la barra fosca, amb la fletxa
blanca pràcticament invisible a dins.

**Prova visual (375×812).** Quadrat blanc a l'extrem esquerre de la barra d'eines.

**Proposta:** completar el reinici a l'arrel del problema, no al lloc concret:

```css
.btn-icon {
  width: var(--sdp-touch); height: var(--sdp-touch); padding: 0;
  background: transparent;    /* ← falta */
  border: 0;                  /* ← falta */
  color: inherit;             /* ← falta */
  cursor: pointer;
}
```

Això també arregla qualsevol `.btn-icon` futur que naixca fora d'un contenidor que el
netege — que és el que ha passat ací.

### B4 · La barra blava desborda en mòbil · **MITJÀ**

`header.bar-blue` (`layout.css:183-198`) declara `display: grid` **sense
`grid-template-columns`**. Les columnes les crea `layout.css:266-268` assignant
`grid-column: 1 / 2 / 3` als fills, o siga que són **columnes implícites**, dimensionades
amb `grid-auto-columns: auto`. Una pista `auto` té mínim `min-content`: **no pot encongir**.

La mitigació de `layout.css:458` només entra a `@media (max-width: 480px)` i tampoc no
resol res: `grid-template-columns: auto auto 1fr` continua tenint mínim automàtic a les
tres pistes (`1fr` és `minmax(auto, 1fr)`).

**Prova visual (375×812).** El botó *CONNECTAR* queda tallat per la vora dreta.

**Proposta:**

```css
header.bar-blue { grid-template-columns: auto 1fr auto; }
header.bar-blue > * { min-width: 0; }
/* i a ≤480px, permetre que el grup central es desplace en lloc de desbordar */
@media (max-width: 480px) {
  header.bar-blue { grid-template-columns: auto minmax(0, 1fr) auto; }
  .bar-blue .sp-card-actions { overflow-x: auto; scrollbar-width: none; }
}
```

### B5 · Dos sistemes de punts de ruptura que no es parlen · **MITJÀ**

- `layout.css:314` — `@media (max-width: 1100px)`, mesura el **viewport**: activa el calaix
  de la barra lateral i la barra inferior de mòbil.
- `AppGridShell.jsx:75-79` — un `ResizeObserver` sobre el **contenidor** de la graella:
  `< 720` → `estret`, `< minAmple` → `mitja`.

Són dues autoritats independents sobre «què és mòbil». Ara mateix conviuen sense trencar
res de visible, però qualsevol canvi d'amplada de columna (que l'usuari pot fer arrossegant
el redimensionador, `AppGridShell.jsx:117-134`) mou el llindar de la graella sense moure el
del CSS.

**Proposta:** que `AppGridShell` publique la seua mida al DOM — ja ho fa,
`data-layout` a `AppGridShell.jsx:175` — i que les regles de `layout.css:314` que depenen
de la graella pengen d'eixe atribut en lloc d'una consulta de mitjans. Les que depenen de
veritat del viewport (barra inferior, calaix de la barra lateral global) es poden quedar
com estan.

### B6 · Tancament obsolet a la mesura del layout · **MITJÀ**

`AppGridShell.jsx:66-94`. L'efecte té dependències `[]`, però la funció `measure` que
defineix a dins llig `leftCollapsed` i `middleCollapsed` (línies 73-74) del tancament del
**primer** render. `measureRef.current = measure` s'assigna una sola vegada.

Quan l'usuari plega una columna, `minAmple` (línia 75) es continua calculant amb les
amplades d'abans de plegar. El llindar `ample → mitja` es queda encallat en el valor
inicial: la graella es pot quedar en `mitja` en una finestra on ja cabria `ample`, o al revés.

**Proposta:** moure les dues banderes a un `ref` que s'actualitze, igual que ja es fa amb
`widthsRef` i `midaRef` (línies 57-62):

```jsx
const collapsedRef = useRef({ left: leftCollapsed, middle: middleCollapsed });
useLayoutEffect(() => { collapsedRef.current = { left: leftCollapsed, middle: middleCollapsed }; },
  [leftCollapsed, middleCollapsed]);
/* i dins de measure(): const { left, middle } = collapsedRef.current; */
```

Açò frega el territori de Codex (estat de React), però el símptoma és purament de layout,
per això va ací. Convé que ho sàpiguen els dos.

### B7 · La nansa del redimensionador fa 9px i declara `touch-action: none` · **MITJÀ**

`AppGridShell.css:165-180`: `width: 1px` amb un `::before` de `inset: 0 -4px`, o siga
**9px** d'objectiu apuntable, amb `touch-action: none` (línia 173), que el declara
explícitament tàctil.

La «Llei de Vida» del projecte demana 44px (`tokens.css:174-177`). Per a un
redimensionador de ratolí 9px és el mínim habitual; per a dit no és utilitzable.

**Proposta:** eixamplar la zona sensible sense moure la línia visible d'1px, i afegir
els passos de teclat que `AppGridResizer` ja pot oferir:

```css
.app-grid-resizer::before { inset: 0 -10px; }   /* 21px, cap canvi visual */
```

I si es vol complir la llei en tàctil, la via és el gest del capçal de columna, no
eixamplar la línia fins a 44px.

### B8 · L'escala de z-index té una única font de veritat que la graella no fa servir · **BAIX**

`tokens.css:179-187` declara l'escala «única font de veritat» (`--z-barra-taronja` 99080 …
`--z-calaix` 99990). `AppGridShell.css` escriu valors en brut: `10` (línia 210), `20` (136),
`30` (116, 142), `50` (167).

Ara mateix no xoca perquè `.app-grid-page` és `position: absolute` **sense `z-index`**, i
per tant no crea context d'apilament: els valors de la graella competixen al context arrel
contra els 99xxx de la closca, i sempre perden — que és el que es vol (la closca per damunt).
Però el marge de maniobra és accidental. Un `z-index` futur a `.app-grid-page` capgiraria
tota la pila d'un colp.

**Proposta:** o bé afegir els graons que falten a l'escala (`--z-graella-columna`,
`--z-graella-calaix`, `--z-graella-nansa`), o bé donar a `.app-grid-page` un `isolation: isolate`
i documentar que la graella té la seua pila local. La segona és una línia i tanca el tema.

---

## 4. Objectiu 3 · Micro-interaccions i UX

### C1 · El hover de la píndola és literalment invisible · **MITJÀ**

```css
.sdp-pindola        { background: var(--sdp-fons-targeta); }  /* modules.css:487 · el CONTENIDOR */
.sdp-pindola__opcio:hover { background: var(--sdp-fons-targeta); }  /* modules.css:512 · l'OPCIÓ */
```

L'opció en repòs és `transparent` (línia 503), o siga que ja es veu el fons del contenidor.
En passar-hi el ratolí, es pinta **exactament del mateix color que ja hi havia darrere**.
La `transition: background var(--sdp-t)` (línia 510) anima un canvi de zero.

**Prova visual.** Dues captures del Mur, sense hover i amb el ratolí damunt de «Mercat»:
**idèntiques píxel a píxel** a la zona de la píndola.

És la peça insígnia del sistema i és l'única opció no activa que no té cap retroacció.

**Proposta:** `background: var(--sdp-fons-subtil);` — el token que la resta del sistema
fa servir per a hover damunt de superfície (`.sdp-boto--secundari:hover`,
`.sdp-pestanyes__pestanya:hover`, `.sdp-boto--fantasma:hover`).

### C2 · Les icones desactivades es veuen igual que les actives · **MITJÀ**

`AppGridShell.css:363`:

```css
.app-grid-col-header__accio-icon:disabled { opacity: 1; cursor: default; }
```

I `AppGridColumn.jsx:42` desactiva tota acció sense `onAcciona`:

```jsx
disabled={a.desactivat || (a.onAcciona == null && a.variant !== 'text')}
```

Combinats: una icona desactivada **no es distingix gens** d'una activa (opacitat plena,
mateix color, mateixa mida), però no respon i no rep focus. L'usuari fa clic i no passa res,
sense cap explicació. És el pitjor dels dos mons: sembla viva i està morta.

**Proposta:** o bé donar-li l'estat desactivat canònic del sistema
(`.sdp-boto:disabled { opacity: 0.55 }`, `components.css:66`), o bé — millor —
**no pintar-la**: si no hi ha acció, que `AppGridColumn` no genere el botó.

### C3 · Les píndoles-enllaç fan 24px d'alt · **MITJÀ, tàctil**

`components.css:589-601` fixa `height: 24px` a `.sp-card-label`. Eixa classe s'aplica a
elements **interactius**:

- `UniversalCard.jsx:142` i `:144` — `<a>` i `<Link>`
- `PageFrame.jsx:266`, `:268`, `:270` — `<a>`, `<a>` i `<LinkComponent>`

En canvi, la variant botó **sí** que complix: `.sp-card-label__action`
(`components.css:608-621`) declara `min-height: var(--sdp-touch)` amb el comentari
`/* 44px LLEI_04_VIDA */`.

O siga: **dins del mateix component, la píndola-botó obeïx la llei i la píndola-enllaç no.**
Són exactament les píndoles «Mur · Sistema · Productivitat · Manual» de la imatge del Mestre.

**Proposta:** aplicar el mateix patró de superfície tàctil que ja fa servir
`.app-grid-col-header__accio-icon::after` (`AppGridShell.css:354-361`) — ampliar l'àrea sense
tocar el dibuix:

```css
.sp-card-label a, .sp-card-label [href] { position: relative; }
.sp-card-label a::after {
  content: ''; position: absolute; inset: 50% auto auto 50%;
  width: 100%; height: var(--sdp-touch-min); transform: translate(-50%, -50%);
}
```

### C4 · Estils en línia a l'embolcall de l'editor · **BAIX**

`UniversalEditorShell.jsx:152` i `:154`:

```jsx
<div className="sdp-editor-shell-atomic" style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
  <div style={{ flex: '1 1 0', minHeight: 0 }}>
```

Un estil en línia guanya **totes** les capes, `utilities` inclosa. `.sdp-editor-shell-atomic`
ja té nom de classe: no té cap regla que l'acompanye. És l'única peça de l'editor que cap
full pot corregir mai sense `!important`.

**Proposta:** moure les dues declaracions a `@layer components` amb el nom que ja porten.

### C5 · `.sp-card-media` declarat dues vegades · **BAIX**

`components.css:706-713` i `components.css:878-883`. La segona sobreescriu `height`; la
primera conserva `aspect-ratio: 1 / 1` i `object-position: top`, que no es toquen. El
resultat net funciona, però ningú pot llegir una sola regla i saber com es pinta la
imatge d'una targeta.

**Nota rellevant per a l'objectiu 4:** eixe `aspect-ratio: 1 / 1` obliga **tota** imatge de
`UniversalCard` a ser **quadrada**, i `.sp-card` té `max-width: 500px` (línia 520). La
capçalera panoràmica que el Mestre vol a la pàgina de Notes **no pot eixir d'una
`UniversalCard`**: ha d'eixir de `PageFrame`, que és el que fa ara. Ho anote perquè no
s'intente unificar les dos peces sense saber-ho.

### C6 · Glassmorphism · **cap problema**

El Mestre preguntava pel rendiment del `backdrop-filter`. **Només n'hi ha un en tot el
projecte**: `layout.css:373-374`, a la barra inferior de mòbil, amb el prefix `-webkit-`
al costat. No hi ha res a optimitzar ací.

---

## 5. Objectiu 4 · La pàgina del Bloc de Notes

### 5.1 · L'estructura real

La pàgina es compon així (i és **correcta**; no cal refer-la):

```
NotesSection → UniversalWorkspace → renderDetail → NotesEditor → DocumentEditor
            → UniversalEditorShell → UniversalPage → PageFrame
```

I `PageFrame` pinta, per este ordre (`PageFrame.jsx:145-295`):

| DOM | Imatge del Mestre |
| --- | --- |
| `header.bar-blue` (`:148-188`) | barra blava amb fletxes, índex, traduir/comentar/compartir i CONNECTAR ✓ |
| `.hero-image` (`:190-198`) | imatge de capçalera a l'ample complet ✓ |
| `section.bar-orange` (`:200-231`) | barra taronja amb avatar + autor/poble i cadenat + data ✓ |
| `header.page-title` (`:233-284`) | targeta blanca amb el títol i les píndoles ✓ |
| `article.content-wrapper > .page-intro` (`:286-292`) | subtítol terracota centrat ✓ |

**L'ossada ja hi és i coincidix amb la referència.** Les barres sticky s'apilen bé
(blava a `top: 0`, taronja a `top: 58px`, `utilities.css:88-95`) i la targeta del títol
té els vèrtexs inferiors arredonits a 36px (`layout.css:280`), com a la imatge.

El que falla és **el contingut que s'hi injecta**, no la maqueta.

### 5.2 · Diferències mesurades contra la imatge de referència

He obert la pàgina viva (`/jo/notes`, nota «Bloc de notes») i l'he comparada amb la
imatge adjunta. Quatre diferències:

| # | Referència | Viu ara |
| --- | --- | --- |
| D1 | Res entre la barra taronja i el títol | **Un botó «Inserir Logotip» a dins de la targeta blanca** |
| D2 | Avatar amb el logo verd de Sóc de Poble | **Cercle blanc buit** (imatge trencada) |
| D3 | «© Sóc de Poble / Fet per la IAIA i Nano Banana» sota les píndoles | **No hi és** |
| D4 | — | (les píndoles i el text són dades de la nota; no és defecte de codi) |

### D1 · El mobiliari d'edició es pinta com a contingut de pàgina · **GREU · és això que el Mestre veu com a «inacabat»**

`UniversalEditorShell.jsx:252-276`. `logoComponent` **mai és fals**:

```jsx
logoComponent: (logoImage && !logoHandler.isEditing)
  ? <img … className="sdp-avatar__imatge" … />
  : <div className="sdp-alerta__accions sdp-camp"> … <button>Inserir Logotip</button> … </div>
```

I `PageFrame.jsx:235-238` pinta el que li arribe, sense preguntar:

```jsx
{topBarData?.logoComponent ? (
  <div className="page-title-logo-personalitzat">{topBarData.logoComponent}</div>
) : …}
```

Com que la branca «falsa» retorna un `<div>` (que és cert), **sempre** hi ha logotip:
quan no n'hi ha, un botó de pujada de 44px ocupa el lloc d'honor de la targeta del títol.
El mateix passa amb la capçalera (`:277-301`), però allà no es nota perquè la nota sí que
té imatge.

**Proposta.** L'afordança d'edició ha d'aparéixer **en mode edició**, no en repòs:

```jsx
/* useEditorShell — que la branca buida siga NUL·LA de veritat */
logoComponent: logoImage
  ? (logoHandler.isEditing ? <SelectorDeFitxer … /> : <img … className="sdp-avatar__imatge" … />)
  : (logoHandler.isEditing ? <SelectorDeFitxer … /> : null),
```

…i exposar la pujada des d'un lloc que no siga la pàgina: el menú del cadenat/globus de
la barra taronja (`:302-322`) ja és el calaix natural per a «propietats del document».
Amb això la pàgina queda **calcada a la referència** sense tocar ni una regla de CSS.

Si el Mestre prefereix la via mínima, n'hi ha prou amb no pintar el contenidor buit:

```jsx
/* PageFrame.jsx:235 — no pintar la caixa si no hi ha res dins */
```

…però aleshores el logotip no es podrà pujar mai des de la pàgina, i cal moure l'entrada
al calaix igualment. Per això recomane la primera.

### D2 · L'avatar per defecte apunta a un fitxer que no existix · **GREU**

`UniversalEditorShell.jsx:146`:

```jsx
const barAuthorAvatar = config.barAuthorAvatar || '/assets/system/ui/default-avatar.jpg';
```

**Prova empírica:**

```
$ ls public/assets/system/ui/
logo-socdepoble-cuadrat-verd.svg   logo-socdepoble-rect-blanc.svg
logo-socdepoble-rect-negre.svg     logo-socdepoble-rect.svg
og-socdepoble-1200x630.png         xat-bg-map-v2.jpg

$ curl -sI http://localhost:3340/assets/system/ui/default-avatar.jpg
HTTP/1.1 200 OK
Content-Type: text/html          ← el SPA torna index.html, no una imatge
```

`default-avatar.jpg` **no existix al repositori**. I com que el servidor té reserva de SPA,
torna **200 amb l'HTML de l'aplicació**: el navegador rep un document on esperava un JPEG,
falla en descodificar-lo i deixa el cercle buit. No hi ha cap 404 a la consola que ho delate.

Ho remata `PageFrame.jsx:113`: `authorAvatarAlt = ''`. Amb `alt` buit, la imatge és
decorativa i **ni tan sols mostra text alternatiu**. La fallada és completament silenciosa.

**Proposta:**

```jsx
/* UniversalEditorShell.jsx:146 — apuntar a un actiu que existix de veritat */
const barAuthorAvatar = config.barAuthorAvatar || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
```

És el mateix actiu que ja pinta bé la barra taronja del Xat, i és el que es veu a la
imatge del Mestre. Alternativament, afegir `public/assets/system/ui/default-avatar.jpg`.

I convé que la fallada deixe de ser muda: donar-li un `alt` real (p. ex. el nom de l'autor)
quan l'avatar siga el de la identitat, no una decoració.

### D3 · Falta la línia de copyright · **MITJÀ**

`PageFrame.jsx:280-282` sap pintar-la:

```jsx
{copyright && <p className="sp-card-copyright page-title-copyright">{copyright}</p>}
```

…i `layout.css:302` li dona estil. Però `UniversalEditorShell.jsx:155-199` **no passa mai
`copyright`** a `UniversalPage`. Arriba només si `ContentProvider` el posa a `config`
(`UniversalPage.jsx:66` fa `{...config}`), cosa que a Notes no passa.

**Proposta:** passar-lo des de l'adaptador, igual que ja es fa amb `labels`:

```jsx
/* NotesEditor.jsx — l'adaptador ja és el lloc on viuen les dades de la nota */
copyright: activeNote?.copyright ?? '© Sóc de Poble',
/* DocumentEditor.jsx i UniversalEditorShell.jsx — deixar-lo passar fins a UniversalPage */
```

### D4 · Tres classes de l'editor no tenen cap regla · **MITJÀ**

| Classe | On es pinta | Regles CSS |
| --- | --- | --- |
| `sdp-hero__imatge` | `UniversalEditorShell.jsx:281` | **0** |
| `sdp-canvas` / `sdp-canvas--ple` | `UniversalEditorShell.jsx:200` | **0** |
| `sdp-avatar__imatge` | `UniversalEditorShell.jsx:254` | 1 (`modules.css:655`) |

La imatge de capçalera de la nota només es veu bé perquè hereta `.hero-image img`
(`layout.css:234-238`). La classe que porta escrita no diu res. El mateix amb el llenç de
l'editor: `.sdp-canvas--ple` suggerix una variant que no existix.

Això vol dir que el `title` i el `role="button"` que porta eixa imatge
(`UniversalEditorShell.jsx:281-287`) **no tenen cap estil de focus propi**: qui hi arribe
amb el teclat només rep l'anell global de `base.css:219`, damunt d'una imatge que ocupa
tota l'amplada i que no anuncia enlloc que siga polsable.

**Proposta:** donar-li cos a la classe que ja s'escriu, i afegir l'afordança que falta:

```css
.sdp-hero__imatge { display: block; width: 100%; height: auto; cursor: pointer; }
.sdp-hero__imatge:hover { filter: brightness(0.92); }
.sdp-hero__imatge:focus-visible { outline: 3px solid var(--sdp-focus); outline-offset: -3px; }
.sdp-canvas { min-height: 0; }
.sdp-canvas--ple { flex: 1 1 auto; }
```

I, si es vol fer bé del tot, canviar `<img role="button">` per un `<button>` que embolcalle
la imatge: un botó de veritat ja porta el rol, el focus i la tecla Espai sense que ningú
els haja de simular (`:284-286` els simula a mà).

### D5 · Classes semàntiques reaprofitades per a un carregador d'imatges · **BAIX**

`UniversalEditorShell.jsx:264` i `:289` construïxen el selector de fitxer amb
`className="sdp-alerta__accions sdp-camp"` — les classes del **peu d'una alerta** i d'un
**camp de formulari**. Les dues declaren `display: flex`/`column` i marges contradictoris
(`components.css:108` i `:117`). Funciona per casualitat i fa il·legible el full: qui canvie
l'espaiat de les alertes mourà el carregador de logotips sense saber-ho.

**Proposta:** una classe pròpia (`.sdp-editor-carregador`) amb les tres declaracions que
de veritat necessita.

---

## 6. Hipòtesis que he tombat jo mateix

Perquè cap auditoria futura les torne a obrir com si foren troballes:

| Hipòtesi | Per què és FALSA |
| --- | --- |
| Les variables `--app-grid-*` no estan definides | **Sí que ho estan**, a `AppGridShell.css:13-20`, dins de `.app-grid-page`. El meu primer detector només mirava prefixos `--sdp-` i `--z-`. |
| Els panells fora de pantalla no s'amaguen als lectors | `aria-hidden` **sí** que s'aplica (`AppGridShell.jsx:209, 227, 245`). El problema real és un altre i és B1: el que no s'aplica és `inert`. |
| Falta `prefers-reduced-motion` per a les transicions dels calaixos | `base.css:336-344` té un bloc global amb `!important` **fora de tota capa**, que ho cobrix tot. Cobert. |
| Massa `backdrop-filter`, risc de rendiment | Només **un** a tot el projecte (`layout.css:373-374`). Cap problema. |
| La barra inferior de mòbil tapa el final de l'editor | Comprovat a 900px i a 375px: la graella s'atura **per damunt** de la barra. No tapa res. |
| `{availableTags.length && …}` pinta un `0` solt | És la condició d'un ternari (`UniversalWorkspace.jsx:377`), no un `&&` en el JSX. `0` és fals i pinta `null`. |
| `PerfilShell.css` trenca totes les variants de botó | **No.** El fitxer obri `@layer components` dins d'un `@import … layer(components)`: queda en una sub-capa que perd contra la capa pare. Verificat amb valors calculats. L'únic que es cola és el cas sense regla pròpia (A2). |
| `.icon-btn`, `.sdp-interruptor__botonet`, `.mobile-nav .nav-item__icon`, `.audio-play-btn svg` violen els 44px | Són **glifs i botonets dins de controls més grans**, no objectius apuntables. Els pares sí que fan 44px. |
| `.sdp-casella__control` (24px) viola la llei tàctil | La fila `.sdp-casella` fa `min-height: var(--sdp-touch-min)` (`components.css:144`) i 24px complix el mínim AA de WCAG 2.2 (2.5.8). |
| `.pill--icon` (40px) viola la llei tàctil | És **CSS mort**: cap consumidor. Va a A9, no a tàctil. |
| El bloc «Dummy for gatekeeper» trenca `.pill` | `.pill` ve després amb la mateixa especificitat (`components.css:1104`) i guanya. És higiene (A8), no un defecte viu. |

---

## 7. Ordre de treball proposat per a la IAIA MarIA

Agrupat perquè cada tanda es puga verificar d'un colp:

**Tanda 1 · Les que es veuen i són d'una línia** (30 min)
1. A1 — `--sdp-ombra-4`: decidir (a) o (b) i aplicar als 4 llocs.
2. A7 — `--sdp-hover` → `--sdp-crom-hover` a `modules.css:3110`.
3. A4 — `--sdp-text-base` → `--sdp-text-cos` als 4 llocs.
4. C1 — hover de la píndola → `--sdp-fons-subtil` (`modules.css:512`).
5. D2 — avatar per defecte → `logo-socdepoble-cuadrat-verd.svg`.

**Tanda 2 · Contrast i contracte** (1 h)
6. A3 — els 7 llocs, amb la taula de substitució del §2.
7. A6 — decidir el color canònic de la píndola i alinear codi i comentaris.
8. A5 — `.btn-taronja-fort` amb tokens de crom, no de barra de desplaçament.

**Tanda 3 · Mòbil, que ara mateix està trencat** (1 h)
9. B2 — `height` → `min-height` a `.editor-toolbar`.
10. B3 — completar el reinici de `.btn-icon`.
11. B4 — `grid-template-columns` explícit a `header.bar-blue`.
12. B1 — `inert=""` + el cinturó de `visibility`.

**Tanda 4 · La pàgina de Notes, contra la imatge** (1-2 h)
13. D1 — `logoComponent` nul quan no hi ha logotip; pujada al calaix del document.
14. D3 — passar `copyright` fins a `PageFrame`.
15. D4 — donar cos a `.sdp-hero__imatge` i `.sdp-canvas`; `<button>` en lloc de `<img role="button">`.
16. D5 — classe pròpia per al carregador.

**Tanda 5 · Deute i portes** (quan es puga)
17. A2 — `sdp-boto--primari` al JSX **i després** netejar `PerfilShell.css`.
18. A8, A9, A10, B5, B6, B7, B8, C2, C3, C4, C5.
19. La porta nova d'A3: *tot `background` amb token de marca fix exigix un `color: --sdp-sobre-*`*.

---

## 8. Incògnites

- **La URL de la referència.** La imatge del Mestre mostra `localhost:3340/notes`, però la
  ruta viva és `/jo/notes` (`App.jsx:568`, dins de `ActorRoutes`); `/notes` dona 404. No sé
  si la captura és d'abans del refactor de rutes o si hi ha una redirecció pendent.
- **Les dades de la nota.** A la referència les píndoles són quatre (Mur, Sistema,
  Productivitat, Manual) i ací n'hi ha dos (Mur, Tutorial), i el botó de publicació mostra
  el globus en lloc del cadenat. Això és contingut del llavor local, no codi: no ho he tocat.
- **El text del botó de publicar.** A la referència es llig «PUBLICAR» en majúscules amb la
  icona del globus; el codi viu escriu «Publicar» sense icona
  (`UniversalToolbar.jsx:87`). No sé si la majúscula era un estil anterior o una intenció
  nova. Si el Mestre la vol, és `text-transform: uppercase` i afegir `<Globe>` — però ho
  deixe fora de l'ordre de treball perquè no me n'ha dit res.

## 9. Apèndix · Per què la porta de tancament diu que este informe és orfe

He ancorat l'informe a `00_index_escriptori.md` i, tot i així,
`node tooling/gates/verificador-scc.mjs` el marca com a satèl·lit orfe. **No és culpa de
l'ancoratge.** La porta marca orfes **113 documents**, i entre ells hi ha:

- `00_index_escriptori.md` **mateix**,
- `00_index.md` — **l'índex arrel del wiki**,
- els 20 documents de l'escriptori, inclosos el prompt del Mestre de fa 25 minuts i
  l'informe de Codex de fa una hora.

Si l'arrel és orfa, la travessa del graf no ha començat mai. La causa es veu a
`tooling/gates/verificador-scc.mjs:207`:

```js
if (basename(node) === '00_INDEX.md' || basename(node) === 'README.md') continue;
```

La comparació és **sensible a majúscules** i el fitxer real es diu `_wiki_de_poble/00_index.md`,
en minúscules. En un sistema de fitxers insensible com el del Mac, el fitxer s'obri igualment,
però esta comparació de cadenes falla i l'arrel no s'exclou (ni, molt probablement, se sembra).
Resultat: **tot el wiki operatiu surt orfe** i la porta és roja per a qualsevol document nou,
per bé que estiga ancorat.

L'enllaç existix de veritat: `_wiki_de_poble/00_index.md:12` → `[[00_index_escriptori]]`.

**Proposta** (una línia, i una porta de 48 torna a verd):

```js
const arrel = basename(node).toLowerCase();
if (arrel === '00_index.md' || arrel === 'readme.md') continue;
```

Ho deixe ací i no a l'ordre de treball perquè és `tooling/`, no disseny: que ho decidisca
el Mestre a quina tanda va.

## Bateria de veritat

- [x] Totes les afirmacions sobre codi es citen com `ruta:línies`.
- [x] Cap nom de fitxer, funció, classe o variable inventat: tots verificats contra l'arbre.
- [x] Cada troballa porta prova d'espec., empírica o visual.
- [x] Les hipòtesis tombades estan al §6, no barrejades amb les troballes.
- [x] Cites reverificades per md5 al final: cap fitxer de `src/` canviat durant la sessió.
- [x] No s'ha modificat cap línia de codi.
