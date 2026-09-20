---
type: informe
status: esborrany
description: Auditoria del Bloc Universal i de l'enxufabilitat - causa arrel del disseny trencat, dotze forats de sistema i pla de redisseny
tags:
  - disseny
  - arquitectura
  - seguretat
  - sollutia
  - escriptori
---

# Informe del Consell — Auditoria Extrema del Bloc Universal i de l'Enxufabilitat

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260919-2 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 22:53 |
| Modificació | 26-09-19 22:53 |
| Agent redactor | Claude (Consell de la Petorreta) |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |
| Entrada | `260919_2245_PROMPT_Auditoria_Sistema_i_Disseny_Apple.md` i arbre local |
| Tall de referència | `b398115fceead16e7ebd97684e6473b8ea0c38bf` (branca `backup-notes-publish`) |
| Finestra de lectura | 26-09-19 22:35 → 22:50 |
| Reverificació | 26-09-19 23:05 · **l'arbre s'ha mogut durant l'auditoria** (vegeu més avall) |
| Contenció | Zero fitxers de codi tocats. L'únic fitxer escrit és aquest document. |
| Protocol anti-cerca | Complit. Cap eina de cerca web activada. |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260919_2245_PROMPT_Auditoria_Sistema_i_Disseny_Apple]]
- [[260919_2241_informe_editor_universal_codex]]
- [[260919_2158_auditoria_extrema_claude]]
- [[pedra_seca]]

---

## ⚠ Reverificació obligatòria · 26-09-19 23:05

**Este informe es va redactar contra un arbre que ja no existix.** Entre les 22:58 i les 23:03 —mentre jo escrivia— algú (Codex o IAIA MarIA) va tocar sis dels fitxers que cite. Marques de modificació comprovades: `UniversalToolbar.jsx` 22:58, `UniversalWorkspace.jsx` 22:59, `components.css` 22:59, `NotesEditor.jsx` 23:01, `UniversalEditorShell.jsx` 23:02, `DocumentEditor.jsx` 23:03.

He reverificat totes les cites de la Part I contra l'arbre de les 23:05. Estat real:

| Troballa | Estat a les 23:05 | Detall |
| --- | --- | --- |
| **D-0** `.sdp-bloc` absent | **MIG RESOLTA** | La classe ja s'aplica (`UniversalWorkspace.jsx:78`), però el token que justifica la seua existència perd la cascada. |
| **D-1** Controls invisibles | **AGREUJADA** | La correcció de D-0 ha convertit una fallada de dos botons en una fallada de tota la columna esquerra. |
| **D-2** Placeholders invisibles | **RESOLTA** | Regla nova a `components.css:139-149`. |
| **D-3** Doble scroll i barres flotants | **RESOLTA** | Amb `.sdp-bloc` al DOM, `modules.css:3400` i `utilities.css:124-128` ja piquen. |
| Mínim tàctil (A3) | **RESOLTA** | `--sdp-bloc-control` ja resol a `max(44px, 48px)`. |
| **D-4 · D-5 · D-6 · D-7 · D-8** | **VIGENTS** | Sense canvis. |
| **Tota la Part III** (S-1 a S-12) | **VIGENTS** | `runtimePolicy.js`, `host.js`, `GlobalSaveManager.js`, `NotesContext.jsx` i `supabase/notes.js` no s'han tocat. |

### R-1 · La correcció de D-0 ha deixat la columna esquerra il·legible · **CRÍTIC · REGRESSIÓ NOVA**

`UniversalWorkspace.jsx:78` ara passa `className={model?.presentation?.list === 'notes' ? 'sdp-bloc' : ''}` a `AppGridShell`, i eixe `className` aterra **al mateix element** que `app-grid-page` (`src/components/layout/AppGridShell.jsx:175`).

Això significa que `.sdp-bloc` i `.app-grid-page` **declaren el mateix token sobre el mateix element**:

- `.app-grid-page` amb `--app-grid-bg-esquerra: var(--sdp-fons-subtil)` (`AppGridShell.css:19`)
- `.sdp-bloc` amb `--app-grid-bg-esquerra: var(--sdp-bloc-nav-fons)` (`modules.css:3226`)

Mateixa especificitat (0,1,0) i **mateixa capa** `components`. Desempata l'ordre del document, i `src/css/index.css:63-64` importa `modules.css` **abans** que `AppGridShell.css`. **Guanya `AppGridShell.css`: el fons continua sent `#efece7`, clar.**

Però `.sdp-bloc .app-grid-column--left` (`modules.css:3239-3242`) sí que pica ara, i fixa `color: var(--sdp-bloc-nav-text)`, que resol a `--sdp-crom-text` → `--sdp-pedra-50` → **`#ffffff`**. I `.sdp-bloc-nav-item` (`modules.css:3279`) el torna a fixar explícitament.

| Abans de les 22:59 | Després de les 22:59 |
| --- | --- |
| `--sdp-bloc-nav-text` indefinit → el text heretava tinta fosca. Els noms de carpeta es llegien. | `--sdp-bloc-nav-text` = blanc sobre `#efece7`. **Contrast 1,18 : 1.** |

**Cada nom de carpeta del rail esquerre és ara blanc sobre beix clar.** Abans només eren invisibles dos botons; ara ho és la columna sencera. En tema fosc no es nota, perquè `--sdp-fons-subtil` passa a `--sdp-pedra-750`.

**Esmena mínima** (tria una, no les dos):

- *Opció recta i recomanada* — que el fons siga de veritat el que `.sdp-bloc` promet. Moure la declaració de `--app-grid-bg-*` fora de `.app-grid-page` cap a un `@layer` anterior, o donar-li a `.sdp-bloc` una especificitat superior amb `.app-grid-page.sdp-bloc`. Amb el fons fosc, tota la resta de `.sdp-bloc` és coherent i el disseny original torna sencer.
- *Opció Apple i estructural* — la de l'Onada A d'este informe: llevar `--sdp-crom-*` del llenç i pintar les columnes amb tokens semàntics, que seguixen el tema.

El que **no** es pot deixar és l'estat actual: mig aplicat, amb la tinta del tema fosc damunt del fons del tema clar.

### R-2 · Nota menor sobre la correcció de D-2

La regla nova de `components.css:140-143` inclou el selector `:not(:has(text))`. `text` no és cap element HTML: com a selector de tipus és sintàcticament vàlid, així que la llista no cau, però eixa condició no comprova res. Qui fa la faena és el primer selector, `[contenteditable][data-placeholder]:empty::before`. Es pot esborrar el segon sense perdre res.

### Correcció de números de línia

Les cites següents s'han desplaçat. Valors bons a les 23:05:

| Al cos de l'informe | Correcte ara |
| --- | --- |
| `DocumentEditor.jsx:87, 90` | `DocumentEditor.jsx:96, 99` |
| `UniversalWorkspace.jsx:186-198` i `:348-361` | `:188` i `:350` (els dos `variant="transparent"`) |
| `UniversalWorkspace.jsx:242-245` | `:243-244` |
| `UniversalWorkspace.jsx:444-452` | `:445-449` |
| `UniversalToolbar.jsx:127` | `:134` |
| `NotesEditor.jsx:39-45` | `:40` |

La resta de cites —tota la Part III, i les de `modules.css`, `utilities.css`, `tokens.css`, `base.css`, `AppGridShell.css` i `AppGridColumn.jsx`— són exactes: eixos fitxers no s'han tocat.

---

## Resum executiu

> **Llegiu primer la Reverificació de dalt.** El diagnòstic de causa arrel es manté, però D-0, D-2 i D-3 ja s'han corregit parcialment, i la correcció de D-0 ha obert la regressió R-1.

El disseny no s'ha «degradat» per acumulació. **Hi ha una causa arrel única i mecànica**: tot el tema visual del Bloc de Notes està escrit sota el selector `.sdp-bloc`, i **eixa classe no s'aplica enlloc de l'arbre**. Dotze regles — incloent-hi el bloc que declara les variables que la resta del mòdul consumix — són codi mort des del moment en què es van escriure.

La conseqüència no és «es veu un poc pitjor»: és que **hi ha controls literalment invisibles** (la lupa de cerca de la llista de notes és blanca sobre blanc), **els placeholders del document no es pinten mai**, i **els botons de carpeta han caigut per davall del mínim tàctil de 44 px** que el propi sistema declara com a Llei de Vida.

A la part de sistema, la troballa més greu no és a les notes: és que **`configura()` de Sollutia només es pot cridar una vegada i qualsevol lectura prèvia de la política la congela**, i que **amb `VITE_SOLLUTIA_ISSUER` buit —que és el cas a tots els builds— totes les sessions injectades per l'amfitrió es rebutgen en silenci**.

---

# PART I · Auditoria del Sistema de Disseny

## D-0 · LA CAUSA ARREL: `.sdp-bloc` no existix al DOM

> **Estat 23:05 · MIG RESOLTA.** La classe ja s'aplica a `UniversalWorkspace.jsx:78`. El diagnòstic de baix explica per què el mòdul estava mort i continua sent la lectura correcta del defecte; però la correcció no arriba al fons de la columna, i ha obert la regressió **R-1**. Llegiu la Reverificació.

`src/css/modules.css:3220-3266` i `src/css/utilities.css:124-128` contenen **dotze regles** sota `.sdp-bloc`. Cerca exhaustiva sobre `src/`, `index.html`, `public/`, `tooling/` i `scripts/` amb el testimoni `sdp-bloc` seguit de no-guionet: **zero coincidències**. Cap component escriu eixa classe.

El que mor amb ella:

| Regla | Línies | Què deixa de passar |
| --- | --- | --- |
| `.sdp-bloc` amb `--sdp-bloc-control`, `--sdp-bloc-nav-*`, `--app-grid-bg-*` | `modules.css:3221-3228` | **Les variables no existixen mai.** |
| `.sdp-bloc .app-grid-column--left` | `modules.css:3239-3242` | El rail esquerre perd `color` i `color-scheme: dark` |
| `.sdp-bloc .app-grid-col-header__accio-text` | `modules.css:3256-3262` | El botó «Tot» perd el seu fons i el seu estat premut |
| `.sdp-bloc .sdp-workspace-detail--editor` amb `overflow: hidden` | `modules.css:3400` | L'editor es queda amb un segon contenidor de scroll |
| `.sdp-bloc .sdp-editor-document > … > .bar-blue` i `.bar-orange` | `utilities.css:124-128` | Les barres blava i taronja continuen `sticky` dins del document |

**Efecte en cadena sobre variables.** `.sdp-bloc-nav-item` (`modules.css:3267-3282`) sí que és global, però consumix `var(--sdp-bloc-control)` i `var(--sdp-bloc-nav-text)`, que només es declaraven dins del bloc mort. Un `var()` sense valor i sense *fallback* fa la declaració **invàlida en temps de valor calculat**, i la propietat cau a `unset`:

- `min-height: var(--sdp-bloc-control)` cau a `auto`. Els botons de carpeta queden en ~40 px de coixí + interlineat. I no els salva `base.css:208-212` (`button` amb `min-height: var(--sdp-touch)`) perquè eixa regla viu a la capa `legacy` i `.sdp-bloc-nav-item` viu a `components`: l'ordre de capes de `src/css/index.css:45` decidix abans que l'especificitat. **La Llei de Vida està trencada i cap porta ho veu.**
- `color: var(--sdp-bloc-nav-text)` hereta. Sobreviu per accident, no per disseny.

**Per què cap tractor ho detecta:** el capçal de `src/css/index.css:22-23` ja ho diu textualment — *«Cap porta ho detectava: les portes compten cadenes de text, no resolen la cascada.»* Un token definit dins d'un selector que no casa mai passa qualsevol diferència entre «definits» i «usats». Ho he comprovat: un diff mecànic de custom properties sobre els 9 fulls dona **220 definides / 209 usades / 6 falsos positius**, i cap de les variables `--sdp-bloc-*` hi apareix.

## D-1 · Controls invisibles — fallada dura de contrast (WCAG 1.4.11)

> **Estat 23:05 · AGREUJADA.** El que descric ací són dos botons invisibles. Després del canvi de les 22:59, **la columna esquerra sencera** ho és. Vegeu **R-1**.

Esta és la troballa que explica «està molt mal» millor que cap altra.

`AppGridColumn` pinta sempre la classe base `app-grid-col-header` (`src/components/layout/AppGridColumn.jsx:76`), que fixa `color: var(--sdp-crom-text)` = blanc (`src/components/layout/AppGridShell.css:225`). El modificador `--transparent` (`AppGridShell.css:233-236`) **només reinicia `background` i `border-bottom-color`. No toca `color`.**

`UniversalWorkspace` usa eixe variant dues vegades:

- **Columna esquerra** (`src/components/universal/workspace/UniversalWorkspace.jsx:186-198`): hi van el botó «Tot» (`variant: 'text'`, cap a `.app-grid-col-header__accio-text`, `color: inherit`, `AppGridShell.css:295-309`) i l'engranatge de categories (sense variant, cap a `.app-grid-col-header__accio-icon`, que **força** `color: var(--sdp-crom-text)`, `AppGridShell.css:344-353`).
- **Columna central** (`UniversalWorkspace.jsx:348-361`): hi va la **lupa de cerca** (sense variant, mateixa icona blanca).

I el fons d'eixes columnes ja no és el fosc que volia `.sdp-bloc`, sinó el de defecte d'`AppGridShell.css:19-20`:

| Control | Tinta | Superfície | Contrast (tema clar) |
| --- | --- | --- | --- |
| Lupa de cerca (llista de notes) | `#ffffff` | `--sdp-fons-targeta` = `#ffffff` | **1,00 : 1** |
| Engranatge i «Tot» (carpetes) | `#ffffff` | `--sdp-fons-subtil` = `#efece7` | **1,18 : 1** |

El mínim de WCAG 1.4.11 per a components d'interfície és 3:1. **La lupa de cerca de les notes és matemàticament invisible en tema clar.** En tema fosc `--sdp-fons-targeta` passa a `--sdp-pedra-850` i el problema desapareix: per això segons la sessió sembla que «de vegades va».

Afegit: `.sdp-bloc-nav-item:hover` i `[aria-current="page"]` (`modules.css:3283-3288`) pinten amb `--sdp-crom-hover` = `rgba(255,255,255,0.09)` — un vel blanc **sobre una superfície clara**. L'únic senyal de selecció que sobreviu és la vora taronja de 3 px.

## D-2 · Els placeholders del document no es pinten mai

> **Estat 23:05 · RESOLTA** per `components.css:139-149`. Queda el detall menor de **R-2**, i queden vives les dues classes sense definició de l'estat buit (`sdp-editor` i `section-title`).

`EditableField` (`src/components/universal/UniversalEditorShell.jsx:37-50`) escriu `data-placeholder` als tres camps: títol, subtítol i entradilla (`UniversalEditorShell.jsx:180, 190, 200`).

**No hi ha cap regla `[data-placeholder]` en cap dels 10 fulls d'estil de `src/`.** Verificat sobre tot l'arbre CSS.

Resultat: una nota nova s'obri amb tres zones `contenteditable` **buides, sense etiqueta i sense cap afordança visual**. L'usuari veu un full en blanc amb una barra blava i una de taronja flotant-hi damunt. A Apple Notes el primer que veus és el cursor i una insinuació de títol.

Ho acompanyen dues classes més sense cap definició: `sdp-editor` (`src/components/universal/DocumentEditor.jsx:87`) i `section-title` (`DocumentEditor.jsx:90`) — les dues a l'**estat buit** de l'editor, que és exactament la primera pantalla que veu qualsevol usuari nou.

## D-3 · Doble contenidor de scroll i barres flotants dins del document

> **Estat 23:05 · RESOLTA** com a efecte lateral de posar `.sdp-bloc` al DOM: `modules.css:3400` i `utilities.css:124-128` ja piquen. El diagnòstic queda com a registre del defecte.

La pila real és:

- `.sdp-workspace-detail` amb `overflow-y: auto` (`modules.css:292-300`)
- `.sdp-editor-shell-atomic` amb `height: 100%` i `overflow: hidden` (`modules.css:3401-3408`)
- `.sdp-editor-document` amb `flex: 1 1 0` i `overflow: hidden` (`modules.css:3409-3414`)
- `.sdp-universal-page-container--contained` amb `height: 100%` i `overflow-y: auto` (`utilities.css:68-77`)

El scroll útil és l'últim. El primer no hauria d'existir: la regla que l'anul·lava (`modules.css:3400`) és de les mortes. Queda un contenidor de scroll imbricat i inert que a Safari/iOS produïx encadenament i rebot, i que trenca l'`overscroll-behavior: contain` del de dins.

En paral·lel, `utilities.css:83-95` deixa `.bar-blue` i `.bar-orange` en `position: sticky` amb `top: 0` i `top: var(--sdp-alt-accio)` (58 px). La regla que les tornava `static` **dins de l'editor** (`utilities.css:124-128`) també és morta. Per tant, mentre escrius un capítol, **dues barres de crom et perseguixen per damunt del text**, ocupant 116 px verticals permanents d'un panell que ja és el més estret dels tres.

## D-4 · Tipografia de cartell, no de llibre

El Mestre vol escriure llibres formals. La tipografia editorial actual fa exactament el contrari:

| Element | Regla | Problema per a un llibre |
| --- | --- | --- |
| `h1` | `color: var(--sdp-accio-text)` blau, `text-align: center` (`base.css:72-81`) | Títol blau i centrat |
| `h2` | `color: var(--sdp-accent-titol)` taronja, `text-align: center` (`base.css:83-91`) | Apartat taronja i centrat |
| `h3` | blau + `border-bottom` (`base.css:93-101`) | Subratllat de manual tècnic |
| `h4` | taronja (`base.css:102-110`) | |
| `h5` | blau (`base.css:112-120`) | |
| `h6` | `text-transform: uppercase` (`base.css:121-130`) | |
| `.lead` | `text-align: center` (`base.css:141-149`) | Entradilla centrada |

És a dir: **la jerarquia s'expressa alternant blau i taronja**, no per pes i mida. Cap llibre —ni Pages, ni Books, ni Notes— fa això. Apple usa **una sola tinta** per al text i reserva el color per a enllaços i accions.

A sobre, `header.page-title` (`src/css/layout.css:283-290`) embolica el títol en una targeta amb `border-radius: 0 0 36px 36px` i `box-shadow`, dins de l'editor. El document no és una targeta: és un full.

## D-5 · No hi ha mesura de columna

`src/css/tokens.css:211` declara `--sdp-measure: 68ch` amb el comentari **«mesura de columna · APLICADA»**.

No ho està. L'únic consumidor de tot l'arbre és `.sdp-centre` (`src/css/components.css:22`), i `.sdp-centre` només el pinta `src/components/PedraSeca/composicio/index.jsx:69` — un component que **no apareix en cap punt del camí de l'editor** (`NotesSection` cap a `UniversalWorkspace` cap a `NotesEditor` cap a `DocumentEditor` cap a `UniversalEditorShell` cap a `UniversalPage` cap a `PageFrame`).

`PageFrame` pinta `article.content-wrapper` (`src/components/universal/PageFrame.jsx:302`) i l'única restricció d'amplada que rep és el *padding* d'`article.content-wrapper` (`base.css:237-241`). En un panell dret de 1100 px, el text del llibre s'estén a **més de 120 caràcters per línia**. El comentari del token diu una cosa i el codi en fa una altra.

## D-6 · La llista de notes s'agrupa per data crua

`NotesItems` (`UniversalWorkspace.jsx:444-452`) agrupa per `note.subtitle`, que `NotesSection` omple amb `note.formattedDate` (`src/sections/notes/NotesSection.jsx:17`), i eixe camp és `toLocaleDateString` amb dia, mes i any de dos dígits (`src/sections/notes/NotesContext.jsx:142`).

Conseqüència: **una capçalera de grup per cada dia distint**. Vint notes escrites en vint dies produïxen vint capçaleres amb un element cadascuna. El propi codi ho admet al comentari de `UniversalWorkspace.jsx:446-447`. A més, l'ordre dels grups depén de l'ordre d'inserció d'`Object.entries`, no de la data.

Apple agrupa en cubells relatius: **Hui · Ahir · Els 7 dies anteriors · Els 30 dies anteriors · Mes Any**.

## D-7 · Emojis com a iconografia

`CategoryItem` pinta l'emoji de carpeta i el d'etiqueta (`UniversalWorkspace.jsx:242-245`), en un projecte que ja depén de `lucide-react` i l'usa a la mateixa columna (`UniversalWorkspace.jsx:2`). L'emoji es renderitza amb la font de color del sistema: no hereta `currentColor`, no respecta el tema fosc, i canvia de forma entre macOS, Windows i Android. A més, `.sdp-bloc-nav-item__icon` **no té cap definició CSS**, així que ni tan sols té mida controlada.

## D-8 · Inventari de CSS mort verificat

| Classe | Definida a | Consumidors a JSX |
| --- | --- | --- |
| `.sdp-workspace-category` (+ `:hover`, `[data-active]`) | `modules.css:195-216` | **0** |
| `.editor-shell--main` | `modules.css:616-625` | **0** |
| `.editor-scroll-area` | `modules.css:626-635` | **0** |
| `.editor-page-frame` | `modules.css:636-641` | **0** |
| `.editor-page-frame__content` | `modules.css:642-644` | **0** |
| `.sdp-bloc-nav-item__count` | `modules.css:3293-3297` | **0** |
| `.sdp-editor-tools__actions` | `modules.css:3335-3345` | **0** |

Això últim té cua: com que `__actions` no es pinta mai, el botó «Publicar» s'alinea a la dreta amb un **estil en línia** (`src/components/universal/UniversalToolbar.jsx:127`), en un sistema el capçal del qual declara *«Cap element de text necessita cap div embolcall ni estil inline»* (`base.css:62`).

I dos noms per al mateix valor: `--sdp-touch: 44px` (`tokens.css:171`) i `--sdp-touch-min: 44px` (`design-tokens.css:10`, autogenerat). Dues fonts de veritat per al mínim tàctil.

---

# PART II · Pla de redisseny (instruccions d'execució per a IAIA MarIA)

La recomanació estructural de fons: **el Bloc Universal ha de deixar de pintar-se amb `--sdp-crom-*`**. Eixa rampa és, per contracte propi (`tokens.css:226-235`), la **closca immutable** — TopBar i SideBar, que no canvien mai de tema. Les tres columnes d'un espai de treball **no són closca: són llenç**, i han de seguir el tema com fan Notes, Pages i Books. Ressuscitar `.sdp-bloc` afegint la classe al DOM arreglaria el símptoma i perpetuaria l'error d'atribució. Això és el pegat; això no.

## Onada A — Aturar l'hemorràgia (bloquejant, ~1 h)

**A1. Pintar les capçaleres transparents amb tinta semàntica.** El modificador ha de reiniciar la tinta, no només el fons. Afegir a `AppGridShell.css`, tocant el bloc `--transparent`:

```text
.app-grid-col-header--transparent {
  background: transparent;
  border-bottom-color: transparent;
  color: var(--sdp-text-cos);
}
.app-grid-col-header--transparent .app-grid-col-header__accio-icon,
.app-grid-col-header--transparent .app-grid-col-header__accio-text {
  color: var(--sdp-text-cos);
}
```

Cal que la segona regla existisca perquè `.app-grid-col-header__accio-icon` **força** la tinta blanca a `AppGridShell.css:344-353` amb especificitat (0,2,0); `inherit` no hi arriba.

**A2. Donar cos als placeholders.** Regla nova, a la capa `components`:

```text
[data-placeholder]:empty::before {
  content: attr(data-placeholder);
  color: var(--sdp-text-desactivat);
  pointer-events: none;
  font-weight: inherit;
}
```

**A3. Restituir el mínim tàctil de la navegació.** A `.sdp-bloc-nav-item`, substituir `min-height: var(--sdp-bloc-control)` per `min-height: var(--sdp-touch-min)` i `color: var(--sdp-bloc-nav-text)` per `color: var(--sdp-text-cos)`. Amb això `--sdp-bloc-control` i `--sdp-bloc-nav-*` queden sense cap consumidor i es poden esborrar amb el bloc `.sdp-bloc` sencer.

**A4. Estats de selecció visibles sobre superfície clara.** Reemplaçar `--sdp-crom-hover` per `--sdp-fons-hover-subtil` al `:hover`, i el fons d'`[aria-current="page"]` per `--sdp-accent-subtil`, mantenint la vora `--sdp-accent-text` (que ja és la que passa el 3:1 segons la nota de `modules.css:83-84`).

**A5. Matar el scroll imbricat.** `.sdp-workspace-detail--editor` ha de dur `overflow: hidden` sense el prefix `.sdp-bloc`. I les barres blava i taronja dins de `.sdp-editor-document` han de ser `position: static` — la mateixa regla d'`utilities.css:124-128` sense el prefix mort.

## Onada B — Dues escales tipogràfiques (~3 h)

L'error de fons és que **una sola escala servix per al crom i per al document**. `--sdp-text-base` és 1,125 rem (18 px) i s'usa tant per al cos d'un llibre com per al títol d'una fitxa de llista (`modules.css:139-150`). Apple separa **SF Pro Text** (interfície, 11–17 px) de la caixa de lectura (17–21 px).

**B1.** Introduir una escala d'interfície al costat de l'editorial, a `tokens.css`:

```text
--sdp-ui-xs:   0.6875rem;
--sdp-ui-sm:   0.8125rem;
--sdp-ui-base: 0.9375rem;
--sdp-ui-lg:   1.0625rem;
```

**B2.** Repintar la fitxa de nota amb l'escala d'interfície. La llista de notes és crom, no és el llibre:

```text
.sdp-bloc-list--notes .sdp-gestor-fitxa       { min-height: 64px; align-items: stretch; }
.sdp-bloc-list--notes .sdp-gestor-fitxa__text { gap: 2px; padding: 10px 14px; justify-content: center; }
.sdp-bloc-list--notes .sdp-gestor-fitxa__titol {
  font-size: var(--sdp-ui-base); font-weight: 600; -webkit-line-clamp: 1; line-clamp: 1;
}
.sdp-bloc-list--notes .sdp-gestor-fitxa__subtitol {
  font-size: var(--sdp-ui-sm); color: var(--sdp-text-suau); font-weight: 400;
}
```

Atenció: `--sdp-fitxa-mida` és 96 px i té **una porta pròpia** (`tooling/gates/tractor-fitxa-gestor.mjs`, segons `modules.css:18`). La variant de notes ja l'esquiva amb `min-height: var(--sdp-alt-accio)` (`modules.css:3305`); l'esmena ha de continuar vivint dins de `.sdp-bloc-list--notes` i **no tocar** la fitxa canònica, o el tractor F8 caurà.

**B3.** Separador de ferro fi entre files, en lloc d'una vora completa: `border-bottom` només des dels 14 px d'esquerra, perquè respire com a Apple.

## Onada C — El document com a llibre (~4 h)

**C1. Una sola tinta.** Dins de l'àmbit de l'editor, neutralitzar el blau i el taronja dels encapçalaments. La jerarquia la fan mida i pes:

```text
.sdp-editor-document h1, .sdp-editor-document h2,
.sdp-editor-document h3, .sdp-editor-document h4,
.sdp-editor-document h5, .sdp-editor-document h6 {
  color: var(--sdp-text-titol);
  text-align: start;
  border-bottom: 0;
  text-transform: none;
  letter-spacing: -0.012em;
}
.sdp-editor-document .lead { text-align: start; }
```

Capa: ha d'anar a `components`, i **després** de `modules.css` en l'ordre d'`index.css`, o bé guanyar per especificitat. No usar `!important`.

**C2. Aplicar la mesura de veritat.** Fer que el token deixe de ser una mentida:

```text
.sdp-editor-document .content-wrapper > * { max-width: var(--sdp-measure); margin-inline: auto; }
.sdp-editor-document .content-wrapper figure,
.sdp-editor-document .content-wrapper img { max-width: 100%; }
```

Per a l'ús de llibre, valorar baixar `--sdp-measure` a `64ch`: 68ch amb Noto Sans a 18 px ja fa ~760 px, prop del límit superior de lectura còmoda.

**C3. Llevar la targeta del títol.** Dins de l'editor, `header.page-title` ha de perdre `border-radius`, `box-shadow` i `background`, i alinear-se a l'esquerra amb la mateixa mesura que el cos. El títol d'un llibre no viu en una píndola amb 36 px de radi.

**C4. Retirar les barres del llenç.** Amb A5 ja deixen de flotar. El pas següent és decidir si la barra blava i la taronja pertanyen al **document** o a la **finestra**. A Pages pertanyen a la finestra. Recomanació: pujar-les a la capçalera del panell dret, al costat de `.sdp-editor-tools`, i deixar el full net des del primer píxel.

## Onada D — Detall d'ofici (~2 h)

**D1.** Substituir els emojis per `Folder` i `Tag` de `lucide-react` a `CategoryItem` (`UniversalWorkspace.jsx:242-245`), amb `size={16}` i `currentColor`, i donar mida fixa a `.sdp-bloc-nav-item__icon`.

**D2.** Agrupació relativa a `NotesItems`. Substituir la clau `note.subtitle` per cubells calculats sobre `updatedAt` —que ja viatja a `toWorkspaceNote` (`NotesSection.jsx:22`)— i ordenar els grups per data descendent abans de pintar. Etiquetes: `Hui`, `Ahir`, `Els 7 dies anteriors`, `Els 30 dies anteriors`, i després `Mes Any`.

**D3.** Esborrar les set classes mortes de D-8 i substituir l'estil en línia d'`UniversalToolbar.jsx:127` per una classe real.

**D4.** Unificar `--sdp-touch` i `--sdp-touch-min` en un sol nom, i fer que el generador de `design-tokens.css` en siga l'única font.

---

# PART III · Auditoria de forats de sistema i enxufabilitat

## S-1 · `configura()` de Sollutia només es pot cridar una vegada, i qualsevol lectura prèvia el mata · **CRÍTIC**

`setRuntimePolicy` **llança** si la política ja existix (`src/config/runtimePolicy.js:10-12`). Però `getRuntimePolicy()` **la crea i la congela sola** quan no n'hi ha (`runtimePolicy.js:51-53`).

I hi ha dos camins que lligen la política abans que l'amfitrió puga configurar-la:

- `adoptaSessioExterna` cap a `getRuntimePolicy()` sense `noAutoFreeze` (`src/data/identitat.js:247`).
- El pont d'iframe, comanda `injectaSessio`, cap a `getRuntimePolicy()` (`src/host.js:376`).

`injectaSessio` està documentat com a **«Vàlid en qualsevol fase»** (`host.js:302`). Si l'amfitrió l'usa abans de `configura()` —cosa que el contracte li permet explícitament— la política queda segellada amb l'emissor de l'entorn de compilació. La crida posterior a `configura()` arriba a `setRuntimePolicy` a `host.js:131`, que **llança**. I `configura()` no embolica eixa crida en cap `try`.

Resultat: l'excepció puja a la seqüència d'arrencada de Sollutia, `arrenca()` no s'executa mai, l'element personalitzat no es definix i **l'aplicació no munta**. El contracte de dues fases documentat a `host.js:29-38` es trenca per l'ordre d'una crida que el mateix contracte declara lliure.

## S-2 · Amb `issuer` buit, tota sessió externa es rebutja en silenci · **CRÍTIC**

`.env.example:14` declara `VITE_SOLLUTIA_ISSUER=` **buit**, i `.env` només conté `VITE_TENANT_ID`. Per tant `import.meta.env.VITE_SOLLUTIA_ISSUER` és indefinit a tots els builds.

Cadena:

1. `runtimePolicy.js:20-24` deixa `issuer` indefinit, i només fa un `console.warn`.
2. `identitat.js:248-249` fa `if (!issuer) return false`.

La crida directa `window.SocDePoble.injectaSessio(sessio)` (`host.js:304-306`) torna `false` **sense cap missatge**: el `console.error` d'`identitat.js:251` només salta quan hi ha discrepància d'emissors, no quan no n'hi ha cap. L'amfitrió rep un booleà fals i no té manera de saber per què.

El camí d'iframe sí que informa (`host.js:382-386`), però només arriba als hosts que incrusten en iframe, no als que carreguen el bundle standalone —que és el cas del plugin de WordPress.

**Combinat amb S-1:** eixa mateixa crida fallida congela la política, i llavors `configura()` llança. La integració amb Sollutia queda inservible per una variable d'entorn buida.

## S-3 · `getCurrentUser()` empassat, el propietari cau al de la llavor · **ALT**

`src/sections/notes/NotesDataContext.jsx:52` captura l'excepció i la descarta:

```text
try { userId = getCurrentUser()?.id; } catch { /* Sollutia pot no implementar-ho */ }
```

Si el backend no implementa el mètode, `asseguraMetode` llança (`src/data/backendPort.js:52-54`), el `catch` buit se'l menja i `userId` queda `null`. Eixe `null` viatja a `loadNotes(userId, …)`, i l'adaptador fa `const safeOwnerId = ownerUserId || getDefaultUserId()` (`src/data/supabase/notes.js:18`), que acaba consultant `owner_user_id=eq.<id-de-la-llavor>` (`notes.js:22`).

**Un propietari nul no és un propietari segur: és el propietari de demostració.** La mitigació va evitar el bloqueig, però va triar el camí que confon «no ho sé» amb «el de sempre». Amb Supabase les RLS ho paren; amb un adaptador de Sollutia que confie en el paràmetre, no.

*Recomanació:* si `getCurrentUser` no està disponible, el context ha de passar a `status: 'error'` amb un missatge explícit, no continuar amb `null`.

## S-4 · La guarda d'aïllament de `creaNota` no pot disparar mai · **ALT**

`NotesDataContext.jsx:157` captura `const myConfig = config;` i `NotesDataContext.jsx:163` comprova:

```text
if (!prev.payload || myConfig.tenantId !== config.tenantId || myActor !== actorKey) return prev;
```

`myConfig` i `config` **són el mateix enllaç del mateix tancament del mateix `useMemo`**. `myConfig.tenantId !== config.tenantId` és `x !== x`: sempre fals. Igual amb `myActor !== actorKey`. La comprovació F04 és **estructuralment incapaç** de detectar un canvi de tenant.

La comparació correcta és contra l'estat viu: `prev.scopeKey !== scopeKey`, que és exactament el que sí que es fa bé a `NotesDataContext.jsx:63`.

## S-5 · `updateNote` no comprova l'scope, i `n1` existix a tots els scopes · **ALT**

`NotesDataContext.jsx:119-139` aplica la resposta del servidor sense cap guarda d'scope: mapeja `notes` i substituïx quan `n.id === id`.

Això seria inofensiu si els identificadors foren globalment únics. **No ho són:** `n1` és la nota d'exemple fixa que `NotesEditor` tracta com a cas especial (`src/sections/notes/NotesEditor.jsx:39-45`) i que `NotesSection` obri per defecte a tot usuari que entre sense nota (`NotesSection.jsx:81-87`). Si un desat de `n1` es resol després d'un canvi d'actor, el contingut del **primer** usuari es pinta sobre el `n1` del **segon**.

## S-6 · Els esborranys d'IndexedDB es fusionen sense comparar revisió · **ALT · risc de pèrdua de dades**

`NotesDataContext.jsx:67` fusiona cada esborrany persistent damunt de la nota remota amb un *spread*, sense mirar `revision` ni marca de temps. L'esborrany guanya **sempre**. I es conserva la `revision` remota, no la local. Per tant la nota que veu l'usuari té **contingut local i revisió remota**: el desat següent enviarà el text vell amb la revisió correcta i **guanyarà en silenci** contra una versió més nova feta des d'un altre dispositiu.

Pitjor: quan un desat falla amb 409, `GlobalSaveManager` **deixa l'esborrany a IndexedDB a propòsit** (`src/sections/notes/GlobalSaveManager.js:146-149`), amb el comentari *«perquè l'usuari l'aplique damunt de la versió remota»*. **Eixa interfície de reconciliació no existix en cap punt de l'arbre.** L'esborrany queda immortal, tapant la versió remota a cada càrrega, per sempre.

A més, la línia 67 muta l'objecte `payload` **dins d'un actualitzador de `setData`**. En `StrictMode` —que està actiu a `src/app/App.jsx:475`— els actualitzadors s'invoquen dues vegades.

## S-7 · `knownRevisions` no s'invalida mai, cap a un 409 permanent · **ALT**

`GlobalSaveManager` és un singleton de mòdul (`GlobalSaveManager.js:169`) amb un `Map` de revisions conegudes que **només s'escriu en cas d'èxit** (`GlobalSaveManager.js:98-101, 136`) i **no es neteja mai**: ni en canviar d'scope, ni en tancar sessió, ni en una recàrrega externa.

Escenari complet, i és el que tanca el cercle amb S-6:

1. Es desa des del dispositiu A. `knownRevisions` queda a 6.
2. Un altre dispositiu edita la mateixa nota. El servidor va per 9.
3. `useRecarregaExterna` recarrega; el payload porta revisió 9.
4. El desat següent pren la revisió **de la memòria cau, 6** (`GlobalSaveManager.js:90-96`), i envia el `PATCH` amb `revision=eq.6`.
5. Zero files, i `ErrorSupabase(409)` (`src/data/supabase/notes.js:65`).
6. L'esborrany es queda a IDB (S-6) i tapa la versió remota a cada càrrega.

**A partir d'ací, eixa nota no es pot tornar a desar mai** sense buidar IndexedDB a mà.

## S-8 · El cos sencer de les notes va a `sessionStorage`, i la porta mira cap a una altra banda · **MITJÀ**

El contracte de `src/config/storage.js:5-7` és taxatiu: *«Només identitat i preferències. Res que puga créixer»*, imposat per `tooling/gates/tractor-persistencia.mjs`.

`src/sections/notes/NotesContext.jsx:90` escriu per eixa capa **tots els camps en edició de totes les notes**, incloent-hi `content` —l'HTML sencer— perquè `CAMPS_HTML` conté `content` (`NotesContext.jsx:13`) i `setLocalNoteField` no filtra res.

La porta no ho pot veure: la seua llei L2 comprova l'accés cru a `localStorage` o `sessionStorage` **fora de `src/config/storage.js`** (`tooling/gates/tractor-persistencia.mjs:64-68`). `NotesContext` usa `setEfimer`, que és l'API beneïda. **La porta vigila qui toca l'API, no què hi passa pel mig.** El límit de «res que puga créixer» no el custodia ningú.

Quan es depasse la quota de `sessionStorage` (~5 MB, un capítol llarg amb imatges *data-URI* hi arriba), el `catch` buit d'`NotesContext.jsx:90` **es menja l'error i l'usuari no se n'entera**.

## S-9 · La publicació al Mur no és atòmica · **MITJÀ**

`publishNote` (`NotesContext.jsx:166-224`) fa, en este ordre: promou la imatge de capçalera, promou les imatges del cos, envia la publicació al Mur (`NotesContext.jsx:215`) i **només després** marca `isPublished` (`NotesContext.jsx:216`).

Si eixe últim desat falla, **queda una publicació visible al Mur i una nota que es presenta com a privada**. A més, com que cada `saveNoteField` passa per l'`enqueue` de 600 ms de `GlobalSaveManager` (`GlobalSaveManager.js:164`) i s'espera amb `await`, publicar una nota amb imatges costa tres depuracions encadenades i tres viatges de xarxa: 1,8 s o més de latència mínima abans que el botó responga.

## S-10 · `esFontImatgeSegura` contradiu el seu propi contracte amb l'SVG · **MITJÀ**

`src/utils/sanitize.js:85` documenta l'`ALLOWED_URI_REGEXP` com *«data:image restringida sense svg»*, i efectivament només admet `png`, `jpeg`, `jpg`, `webp`, `gif` i `avif`.

Però `esFontImatgeSegura` (`sanitize.js:107-122`) accepta **qualsevol** `data:image/` a la línia 110, i és l'**única** comprovació que s'aplica a `heroImage` i `logoImage`, perquè `netejaCamp` els desvia fora de DOMPurify (`src/sections/notes/NotesContext.jsx:17`). Un `data:image/svg+xml;base64,…` hi passa, es desa a `notes.hero_image` i acaba a la càrrega útil del Mur com a `image` (`NotesContext.jsx:208`), on el veuran tots els lectors.

Dins d'un `img` un SVG no executa scripts, així que **això no és un XSS avui**. És un incompliment del contracte escrit que es convertix en vector el dia que algú pinte eixe camp amb `object`, `background-image` o un enllaç directe.

## S-11 · Concessió `anon` penjant sobre `public.notes` · **BAIX · perill latent**

`supabase/migrations/260914_0000_schema_notes.sql:50` fa `grant select on table public.notes to anon;`, però **no hi ha cap política `for select to anon`**. Amb RLS activa i sense política permissiva, `anon` no obté cap fila: **no hi ha fuita avui**.

És una concessió òrfena. El dia que s'afegisca una política `to public` o `to anon` per a qualsevol cas d'ús —notes públiques, previsualitzacions— la porta ja està oberta i ningú recordarà que ho estava. La resta de les polítiques (`260914_0000_schema_notes.sql:54-90`) són impecables: propietari **i** pertinença al *town*, tant a `using` com a `with check`.

## S-12 · Fragilitat de l'estabilització de `config` · **BAIX** · [SUPÒSIT]

`src/app/App.jsx:472` estabilitza la configuració amb un `useMemo` que depén de `JSON.stringify(config)`. Dos objectes distints que serialitzen igual es consideren el mateix, i `JSON.stringify` elimina funcions i `undefined`.

L'efecte de càrrega de `NotesDataContext` depén de `config` per referència (`NotesDataContext.jsx:107`). **[SUPÒSIT]** — no he trobat cap amfitrió que hi pose un camp variable, però si un host injectés un `config` amb una marca de temps o un testimoni rotatori, cada render produiria una identitat nova i l'efecte entraria en un bucle de recàrrega. No ho puc afirmar sense veure el `config` real de Sollutia.

---

## Prioritat d'execució

Actualitzada a les 23:05. A2, A3 i A5 ja les ha fetes un altre agent; en canvi ha aparegut R-1.

| Ordre | Item | Per què primer |
| --- | --- | --- |
| 1 | **R-1** | Regressió acabada de plantar: el rail esquerre és il·legible ara mateix. |
| 2 | **A1, A4** | La lupa de cerca continua blanca sobre blanc, i els estats de selecció no es veuen. |
| 3 | **S-1, S-2** | Sense això, Sollutia no arrenca. Bloqueja la integració sencera. |
| 4 | **S-6, S-7** | Pèrdua de dades silenciosa. Cada dia que passa fa més esborranys immortals. |
| 5 | **S-3, S-4, S-5** | Aïllament. Greu, però les RLS de Supabase el contenen mentrestant. |
| 6 | **Onada B, C** | El llibre. |
| 7 | **S-8 fins a S-12, R-2, Onada D** | Deute i ofici. |

*Ja fetes per un altre agent entre 22:58 i 23:03: A2 (placeholders), A3 (mínim tàctil) i A5 (scroll i barres). No cal repetir-les.*

---

## Bateria de veritat

- [x] Totes les afirmacions sobre codi citades com `ruta:línies` de l'arbre local.
- [x] Cap nom de fitxer, funció, classe o variable inventat — tot verificat per cerca directa.
- [x] Conjectures marcades `[SUPÒSIT]`: només S-12.
- [x] Cap eina de cerca web activada.
- [x] Cap fitxer de codi modificat. Els blocs de codi no duen ruta ni etiqueta de llenguatge.
- [x] Frontmatter conforme a `tooling/wiki/schema.json` (wiki-frontmatter-v2.1).

## El que no he pogut verificar

- L'adaptador real de Sollutia: `src/data/adaptadors/sollutia/` només conté `recursos.js`, no una implementació del contracte.
- L'estat viu de les 48 portes del projecte.
- Si la mesura de 68ch es percep bé a la pantalla del Mestre: això exigix una captura.

## Nota de contenció

Este document **no** s'ha indexat a `00_index_escriptori.md`, per instrucció expressa del Mestre de no tocar cap altre fitxer. L'alta al vincle queda pendent.
