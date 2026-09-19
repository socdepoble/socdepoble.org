---
type: informe
status: esborrany
description: Disseny del Bloc multiús calcat de Mac Notes, amb les lleis que el limiten i el CSS i React proposats
tags:
  - disseny
  - arquitectura
---

# Bloc de Notes — el disseny del Bloc multiús i el que les lleis hi permeten

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918_1554 |
| Encàrrec | SDP-PROMPT-202609181508 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-18 15:54 · Europe/Madrid |
| Agent redactor | Claude (Cowork) |
| Destinatària de la integració | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Tall auditat | HEAD `bbfb804a` + arbre de treball brut (15 fitxers modificats sense confirmar) |
| Abast | Lectura de codi, execució de portes i verificació en navegador. Cap línia de codi tocada. |

## Vincles

- [[00_index_escriptori]]
- [[260918_1508_PROMPT_disseny_bloc]]
- [[260918_1533_informe_arquitectura_bloc_notes]] · informe previ de Codex sobre el mateix encàrrec
- [[contracte_graella]]

## Com s'ha de llegir aquest informe

Cada afirmació porta una marca de com s'ha comprovat:

- **[CODI]** llegit a l'arbre de fitxers, amb ruta i línia.
- **[PORTA]** verificat executant la porta corresponent de `tooling/gates/`.
- **[NAVEGADOR]** vist en execució a `http://localhost:3340/jo/notes` amb el servidor de desenvolupament del Mestre.
- **[PROPOSTA]** disseny meu, encara no existeix.
- **[DECISIÓ]** cosa que no puc decidir jo. És del Mestre.

L'informe de Codex de les 15:33 declara que no va obrir cap navegador. Aquesta sessió sí. On les dues coincidim ho dic; on el contradic, ho dic amb la prova.

---

## 0. Dictamen

**El Bloc ja existeix i es diu `UniversalWorkspace`. No s'ha de construir res nou: s'ha de prémer el que hi ha.** Notes, Disseny, Admin i Perfil ja el comparteixen [CODI], així que tot el que es toque ací ix gratis a les altres quatre seccions. El camí és refinar, no refundar.

Ara bé, el calc de Mac Notes topa amb una llei pròpia, i això és el més important d'aquest informe:

> **La fila de la llista no pot fer menys de 96 px.** No és una decisió d'estil: és `F8` del `tractor-fitxa-gestor.mjs`, una LLEI DURA sense deute ni `--baseline`, i ara mateix està **verda** [PORTA]. Mac Notes fa files de ~62 px. Les dues coses no caben alhora.

Tot el que no és la fila de la llista —la barra lateral, els grups plegables, el botó «Tot», la botonera de l'editor, el responsive— es pot calcar sense tocar cap llei. Per això proposo **integrar-ho tot menys la densitat de la llista**, i deixar la densitat com a decisió explícita del Mestre (§4.3).

I hi ha una cosa urgent que no té res a veure amb el disseny nou: **en mode fosc, la barra de pestanyes «CARPETES» és blanca amb text blanc** [NAVEGADOR]. En tauleta i mòbil és l'única manera d'arribar a les carpetes, i és il·legible. Això es repara abans que res (§3, D01).

---

## 1. Mapa real del que hi ha

```text
NotesSection · DesignSection · AdminSection · PerfilShell
└─ UniversalWorkspace                    components/universal/workspace/UniversalWorkspace.jsx
   └─ WorkspaceProvider                  workspace/WorkspaceContext.jsx  +  workspaceState.js
      └─ WorkspaceFrame → AppGridShell   components/layout/AppGridShell.jsx  (+ .css)
         ├─ CategoryColumn  ─┐
         ├─ ItemListColumn  ─┼─ AppGridColumn        components/layout/AppGridColumn.jsx
         └─ DetailColumn    ─┘
            └─ NotesEditor → DocumentEditor          components/universal/DocumentEditor.jsx
               ├─ useTipTapToolbarAdapter            richText/tiptapToolbarAdapter.js
               ├─ UniversalRichTextToolbar           richText/UniversalRichTextToolbar.jsx
               │  └─ UniversalToolbar                components/universal/UniversalToolbar.jsx
               └─ UniversalEditorShell → UniversalPage → PageFrame
```

Els noms `CarpetesNav` i `NotesList` de l'encàrrec **no existeixen al codi**. Els punts d'intervenció reals són `CategoryColumn` ([UniversalWorkspace.jsx:123](src/components/universal/workspace/UniversalWorkspace.jsx:123)) i `ItemListColumn` ([UniversalWorkspace.jsx:247](src/components/universal/workspace/UniversalWorkspace.jsx:247)) [CODI].

Tres coses que ja estan ben fetes i que **no s'han de tocar**, perquè són la base del responsive que demana l'encàrrec:

1. **La mida la mana el contenidor, no la finestra.** `AppGridShell` mesura amb `ResizeObserver` i escriu `data-layout="ample|mitja|estret"` ([AppGridShell.jsx:71–100](src/components/layout/AppGridShell.jsx:71), [:181](src/components/layout/AppGridShell.jsx:181)) [CODI]. Això és millor que `@media` i és exactament el que necessita l'enxufabilitat a Sollutia: el Bloc funciona igual si l'incrusten en mig d'una pàgina.
2. **`.d-mobile-only` / `.d-desktop-only` ja pengen d'eixe atribut** ([AppGridShell.css:210–212](src/components/layout/AppGridShell.css:210)) [CODI]. És el ganxo que reaprofitaré per a la regla «text → icona» (§6), sense afegir ni una línia de JavaScript nou.
3. **La barra d'eines ja és muda i té contracte neutre.** `toolbarContract.js` declara huit formats i diu literalment que `slot` és «el pont temporal cap a UniversalToolbar, que encara demana cinc propietats amb nom propi en compte d'una llista» ([toolbarContract.js:22–27](src/components/universal/richText/toolbarContract.js:22)) [CODI]. La meua proposta de §5 no inventa res: executa el pla que el fitxer ja té escrit.

---

## 2. Les lleis que limiten aquest disseny

Això és el que l'informe previ no va mirar, i és el que decideix què es pot dibuixar. Totes verificades executant la porta.

### 2.1 `tractor-fitxa-gestor.mjs` — LLEI DURA, verda [PORTA]

```
  ✅ F1 … ✅ F9     La llista del gestor té la forma de la fitxa. El mur aguanta.
```

La capçalera del fitxer diu «LLEI DURA. Zero deute. Sense sostre. Sense `--baseline`» ([tractor-fitxa-gestor.mjs:5](tooling/gates/tractor-fitxa-gestor.mjs:5)). El que blinda, literalment ([:96–115](tooling/gates/tractor-fitxa-gestor.mjs:96)):

| Selector | Declaració exigida |
| --- | --- |
| `:root` (tokens.css) | `--sdp-fitxa-mida: 96px` exacte |
| `.sdp-gestor-fitxa` | `min-height: var(--sdp-fitxa-mida)` |
| `.sdp-gestor-fitxa__media` | `flex` / `width` / `height` = `var(--sdp-fitxa-mida)` |
| `.sdp-gestor-fitxa__titol` | `-webkit-line-clamp: 2` + `overflow: hidden` |
| `.sdp-gestor-fitxa__subtitol` | `white-space: nowrap` + `text-overflow: ellipsis` |
| `.sdp-gestor-fitxa[aria-current=true]` | `border-left-color: var(--sdp-accent-text)` |

I a més un **pressupost vertical** calculat: 2 línies de títol + 1 de subtítol + coixí ha de cabre en 96 px ([:576–607](tooling/gates/tractor-fitxa-gestor.mjs:576)). Una tercera línia de text el rebenta.

**Dues coses que sí que estan permeses, i que cal saber per no inventar-se problemes:**

- El control «forma d'article» (`<h3>`, `<section>`…) **té una exempció explícita per a `UniversalWorkspace.jsx`** ([:341–344](tooling/gates/tractor-fitxa-gestor.mjs:341)). Els encapçalaments de grup de data d'estil Mac Notes són legals. *Jo mateix havia suposat el contrari abans de llegir la funció; la suposició era falsa.*
- `.sdp-gestor-*` només pot viure a `src/css/modules.css` ([:618–619](tooling/gates/tractor-fitxa-gestor.mjs:618)).

### 2.2 `tractor-inline-styles.mjs` — **ROJA ara mateix** [PORTA]

```
[T2 INLINE-STYLE] src/components/universal/UniversalEditorShell.jsx:158  → 'display'
[T2 INLINE-STYLE] src/components/universal/UniversalEditorShell.jsx:160  → 'flex'
[T2 INLINE-STYLE] src/sections/disseny/cataleg/detalls/EspecimenInventariGlobal.jsx:14 → 'padding'
❌ 3 violacions. 🧱 El mur ha parat el build.
```

Dues de les tres són **al cor exacte del Bloc** ([UniversalEditorShell.jsx:158](src/components/universal/UniversalEditorShell.jsx:158) i [:160](src/components/universal/UniversalEditorShell.jsx:160)). Com que de totes maneres s'ha de tocar eixe fitxer, la reparació ix gratis (§7.6).

### 2.3 `tractor-graella.mjs` — verda [PORTA]

Compara els `props` reals d'`AppGridShell` i `AppGridColumn` amb la fitxa `_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md`. **Tota prop nova s'ha de documentar allí o la porta es posa roja.** Per això aquesta proposta no afig cap prop nova a cap dels dos components.

### 2.4 `01_porta_pedra_seca_58px.mjs` — verda [PORTA]

Prohibeix `56px` i `58px` en brut en alçades: s'ha d'usar `var(--sdp-alt-accio)`. Tot el CSS de §7 ho respecta.

### 2.5 `tractor-tokens.mjs` — LLEI DURA, **roja per una sola línia** [PORTA]

```
  T4 · Dos capes  (1)
    src/components/layout/AppGridShell.css:341
      ↳ `--sdp-pedra-300` és una primitiva. […] la primitiva no canvia amb el tema fosc.
```

`T4` prohibeix que cap component cite l'escala crua (`--sdp-pedra-*`, `--sdp-primary-*`…): només tokens semàntics. **Tot el CSS de §7 ho respecta**, i com que de totes maneres hem d'obrir `AppGridShell.css` per a D01, aquesta única infracció es tanca de passada canviant `var(--sdp-pedra-300)` per `var(--sdp-crom-focus)` a la línia 341 — és un anell de focus sobre la closca fosca, que és exactament el que eixe token serveix. La porta quedaria verda de T4. *(T1 i T2 continuen roges per deute d'altres fitxers; això no és d'aquest encàrrec.)*

### 2.6 La Llei de Vida guanya a Mac Notes

`base.css:208–212` imposa `min-width` i `min-height: var(--sdp-touch)` = 44 px a **tot** `button` [CODI]. Mac Notes fa files de carpeta de ~28 px i capçaleres de secció de ~22 px. **No es poden calcar.** Els grups i les files d'aquesta proposta fan 44 px i és deliberat: l'accessibilitat extrema és la identitat del projecte, i el dit del veí de La Torre importa més que la densitat d'Apple.

### 2.7 `tractor-classes.mjs` només mira en una direcció

Detecta CSS definit i no usat (155 classes «aparentment mortes») [PORTA], però **no** detecta el contrari: classes escrites al JSX que cap full defineix. Per això els fantasmes de §3 han sobreviscut. [PROPOSTA] Val la pena invertir la porta, però és una feina a banda.

*Avís sobre el seu soroll:* la porta marca com a mortes `app-grid-content`, `has-left-collapsed`, `app-grid-col-header--accordion`, `app-grid-col-header__accio-text` i companyia. **Són falsos positius**: es componen amb plantilles i ternaris a [AppGridColumn.jsx:30–35](src/components/layout/AppGridColumn.jsx:30) i [AppGridShell.jsx:157–162](src/components/layout/AppGridShell.jsx:157). Que ningú les esborre.

---

## 3. Troballes verificades

Ordenades per urgència. «Nou» vol dir que no apareix a l'informe de Codex de les 15:33.

| ID | Gravetat | Prova | Troballa |
| --- | --- | --- | --- |
| **D01** | **Greu · accessibilitat** | [NAVEGADOR] + [CODI] | **La barra de pestanyes és blanca sobre blanca en mode fosc.** `.app-grid-headers` pinta `--sdp-fons-invers` i el text `--sdp-sobre-roca` ([AppGridShell.css:37](src/components/layout/AppGridShell.css:37), [:46](src/components/layout/AppGridShell.css:46)). En fosc, `--sdp-fons-invers` passa a `--sdp-pedra-100` = `#f8f6f4` ([tokens.css:313](src/css/tokens.css:313)) mentre `--sdp-sobre-roca` es queda a `--sdp-pedra-50` = `#ffffff` (mai es redefineix; només existeix a [tokens.css:98](src/css/tokens.css:98)). Contrast ≈ **1,05:1**. Ho he vist: en fosc la paraula «CARPETES» desapareix. I en `mitja`/`estret` eixa barra és l'**única** porta cap a les carpetes. Coincideix amb B03 de Codex; ací queda confirmat en execució. |
| **D02** | Alt · estat invisible | [CODI] + [NAVEGADOR] | **`.active-text` no existeix a cap full.** S'escriu quatre vegades a [UniversalToolbar.jsx:39](src/components/universal/UniversalToolbar.jsx:39), [:47](src/components/universal/UniversalToolbar.jsx:47), [:55](src/components/universal/UniversalToolbar.jsx:55), [:63](src/components/universal/UniversalToolbar.jsx:63) i **zero** vegades a `src/css/**` + `AppGridShell.css` + `PerfilShell.css`. Comprovat en viu: amb el cursor dins d'un paràgraf i amb el cursor dins d'un `<h2>`, el botó H₂ es pinta **idèntic**. *Ací contradic Codex:* el seu B10 diu que els botons «mostren selecció amb classe però no `aria-pressed`». No mostren selecció de cap manera. Falta l'`aria-pressed` **i** falta el píxel. **Nou en part.** |
| **D03** | Alt · control mort | [NAVEGADOR] | **El botó de replegar columna no fa res en tauleta.** A 1000 px (`mitja`), prémer el botó de replegar de la columna NOTES no canvia res: la columna es queda igual d'ampla. La causa és que `collapsed` només es calcula si `mida === 'ample'` ([UniversalWorkspace.jsx:139](src/components/universal/workspace/UniversalWorkspace.jsx:139), [:254](src/components/universal/workspace/UniversalWorkspace.jsx:254)) mentre el botó es pinta sempre que el layout no siga `estret`, perquè porta `d-desktop-only` ([AppGridColumn.jsx:111](src/components/layout/AppGridColumn.jsx:111), [AppGridShell.css:212](src/components/layout/AppGridShell.css:212)). Un control habilitat que no fa res. **Nou.** |
| **D04** | Mitjà · fantasmes | [CODI] | **Classes escrites al JSX que cap full defineix**: `sdp-workspace-groups` i `sdp-workspace-group` ([UniversalWorkspace.jsx:199](src/components/universal/workspace/UniversalWorkspace.jsx:199), [:201](src/components/universal/workspace/UniversalWorkspace.jsx:201)), `sdp-editor-shell-atomic` ([UniversalEditorShell.jsx:158](src/components/universal/UniversalEditorShell.jsx:158)), `sdp-editor` i `section-title` ([DocumentEditor.jsx:87](src/components/universal/DocumentEditor.jsx:87), [:90](src/components/universal/DocumentEditor.jsx:90)). L'estat buit fa servir `section-title` quan Pedra Seca ja té `.sdp-buit__titol` ([components.css:260](src/css/components.css:260)). **Nou.** |
| **D05** | Mitjà · carcassa doble | [NAVEGADOR] + [CODI] | **Cada columna gasta dues franges de 58 px abans del contingut**: una `AppGridColumn` de títol i una altra `variant="transparent"` d'accions ([UniversalWorkspace.jsx:177–197](src/components/universal/workspace/UniversalWorkspace.jsx:177) i [:335–356](src/components/universal/workspace/UniversalWorkspace.jsx:335)). Són **116 px de closca** per columna. Mac Notes en gasta ~52. És la diferència visual més gran de totes, i es resol fusionant les dues franges en una (§4.1). |
| **D06** | Mitjà · «Tot» sense estat | [CODI] + [NAVEGADOR] | «Tot» viatja com a `startActions` amb `variant: 'text'` i `pressed` ([UniversalWorkspace.jsx:185–196](src/components/universal/workspace/UniversalWorkspace.jsx:185)). L'`aria-pressed` arriba al botó ([AppGridColumn.jsx:45](src/components/layout/AppGridColumn.jsx:45)) però **cap regla el pinta**: `.app-grid-col-header__accio-text` no té estat actiu ([AppGridShell.css:296–310](src/components/layout/AppGridShell.css:296)). A la captura es veu gris i apagat, com si estiguera desactivat. |
| **D07** | Mitjà · carpetes planes | [CODI] | Les files només pinten `label`: ni icona, ni recompte, ni nivell ([UniversalWorkspace.jsx:231–245](src/components/universal/workspace/UniversalWorkspace.jsx:231)). El `WorkspaceProvider` **ja normalitza `parentId`** ([WorkspaceContext.jsx:37](src/components/universal/workspace/WorkspaceContext.jsx:37), [:43](src/components/universal/workspace/WorkspaceContext.jsx:43)) i `appSeed.js` ja el declara a totes les carpetes ([appSeed.js:50–57](src/data/appSeed.js:50)), però **ningú el consumeix**. La canonada per a l'arbre de Mac Notes ja està posada i no s'hi ha endollat res. |
| **D08** | Mitjà · barra escapçada | [CODI] | El contracte declara 8 ordres, 5 tenen `slot`, i `UniversalToolbar` només llegeix 4 ([toolbarContract.js:28–40](src/components/universal/richText/toolbarContract.js:28), [UniversalToolbar.jsx:20–21](src/components/universal/UniversalToolbar.jsx:20)). Ratllat, subtítol, citació i divisor **existeixen a l'adaptador de TipTap** ([tiptapToolbarAdapter.js:9–18](src/components/universal/richText/tiptapToolbarAdapter.js:9)) i no tenen on pintar-se. La meitat de l'editor està feta i amagada. |
| **D09** | Mitjà · botó buit | [CODI] | El botó «Més opcions (Properament)» està habilitat i no té `onClick` ([UniversalToolbar.jsx:68–75](src/components/universal/UniversalToolbar.jsx:68)). És exactament el forat on ha d'anar el menú de desbordament de §5. Coincideix amb B02 de Codex. |
| **D10** | Baix · recàlcul | [CODI] | `measure()` llegeix els replegats d'un `ref`, però l'efecte que el torna a executar només depèn de `columnWidths` ([AppGridShell.jsx:102–104](src/components/layout/AppGridShell.jsx:102)). Desplegar una columna no recalcula el llindar. Coincideix amb B15 de Codex; un `useLayoutEffect` amb dues dependències més ho tanca. |

---

## 4. Anatomia del Bloc

La rèplica té tres panells —**navegació → llista → document**— que és el que ja fa `AppGridShell`. El que canvia és el que hi ha dins.

### 4.1 Una franja per columna, no dues

[PROPOSTA] Fusionar les dues `AppGridColumn` de cada columna en una sola de 58 px:

```
┌──────────────────────────────┬──────────────────────────────┬─────────────────────────┐
│ CARPETES        ⚙  ⟨replega⟩ │ NOTES      🔍  [+ CREAR]     │ [botonera de l'editor]  │
├──────────────────────────────┼──────────────────────────────┼─────────────────────────┤
│  ▪ Tot                  103  │  ┌────────────────────────┐  │  barra blava            │
│                              │  │ Bloc de notes          │  │  hero                   │
│  CARPETES              ⌄     │  │ 25/04/26 · El teu …    │  │  barra taronja          │
│  📁 Mur                  12  │  └────────────────────────┘  │  títol                  │
│  📁 Mercat                4  │  ┌────────────────────────┐  │  cos                    │
│  📁 ADMIN WEBS           14  │  │ Sense títol            │  │                         │
│     📁 Siteground         8  │  │ 25/06/26               │  │                         │
│                              │  └────────────────────────┘  │                         │
│  ETIQUETES             ⌄     │                              │                         │
│  # Tutorial               1  │                              │                         │
└──────────────────────────────┴──────────────────────────────┴─────────────────────────┘
```

`AppGridColumn` **ja accepta tot això** —`titol`, `startActions`, `endActions`, `onReplega`— sense cap prop nova, o siga sense tocar `contracte_graella.md`. És només deixar de cridar-la dues vegades. Guanya 58 px de contingut per columna i acosta la silueta a la de Mac Notes d'un colp.

### 4.2 La columna de navegació

**La fila.** `[icona] Nom ─────── recompte`, amb la selecció com una **píndola encaixada** (marge lateral i `--sdp-radi-s`), no com una banda de punta a punta. És el detall que més fa que una barra lateral «parega Mac».

**El recompte.** Cap consumidor l'ha de calcular: el `WorkspaceProvider` ja té `normalizedItems` i pot derivar-lo amb un `useMemo` (§8.1). Així ix gratis a Notes, Disseny, Admin i Perfil alhora.

**L'arbre.** Amb `parentId` ja normalitzat (D07), el sagnat es fa amb `data-nivell="0|1|2"` i CSS — **no** amb `style={{ paddingLeft }}`, que la porta d'estils en línia tomba. Tres nivells són prou; més enllà, el·lipsi.

**Els grups.** Ara «ETIQUETES» es pinta amb `AppGridColumn variant="accordion"`, que és una franja fosca de 58 px: a la captura pesa tant com la capçalera de la columna. [PROPOSTA] Un encapçalament propi, transparent, text `--sdp-text-meta` en majúscules i xebró — 44 px per la Llei de Vida (§2.6), no els 22 px d'Apple. Això a més dona cos als fantasmes `sdp-workspace-group(s)` de D04.

**«Tot».** [DECISIÓ resolta pel Mestre] L'encàrrec demana un «botó fosc Tot». Mac Notes no en té cap: a la referència, «Todo (iCloud)» és una fila més. Faig les dues coses: **la posició i l'alineació de Mac Notes** (primera fila de la llista, no un botó perdut a la capçalera) amb **el tractament fosc que demana el Mestre** (`--sdp-crom-fons`, píndola). Així deixa de ser un control de capçalera sense estat (D06) i passa a ser una fila amb `data-active` com totes les altres.

### 4.3 La columna de llista — ací està el nus

Mac Notes fa files de tres elements en ~62 px: **títol** / **data + inici del text**. El nostre `.sdp-gestor-fitxa` fa 96 px amb una **media quadrada de 96 px** i la inicial gegant («B», «S» a la captura). És el que més s'allunya de la referència, i és el que la llei de §2.1 blinda.

Quatre camins, i no els puc triar jo:

| | Camí | Què costa | Resultat |
| --- | --- | --- | --- |
| **A** | Deixar la fitxa com està | Res | Legal, verd, **i el més lluny de Mac Notes**. La inicial gegant es queda. |
| **B** | Modificador `.sdp-gestor-fitxa--densa` | Res | ⚠️ `F8` **no el detectaria**: compara noms de selector exactes ([tractor-fitxa-gestor.mjs:114](tooling/gates/tractor-fitxa-gestor.mjs:114)). La porta es quedaria verda mentre la llei queda buidada per dins. |
| **C** | Fila nova `.sdp-bloc-fila`, fora del prefix `sdp-gestor-` | Poc | ⚠️ Igual que B: legal per la lletra, mort per l'esperit. |
| **D** | **Baixar `MIDA_LLEI` i el pressupost a la porta**, i actualitzar `tokens.css` i `modules.css` | Un commit que toca `tooling/gates/` | Honest, auditable, i la porta continua servint per a alguna cosa. |

**La meua recomanació és D, i mentrestant A.** B i C deixen la porta verda i la llei morta; això és exactament la malaltia («Saber ≠ Fer») que el `tractor-graella.mjs` denuncia a la seua pròpia capçalera. La porta va nàixer d'un dictamen del Consell (Seient Núm. 5) perquè la llista s'havia desfet en article; esquivar-la amb un nom de classe nou és repetir la història amb millor disfressa. Si el Mestre vol la densitat de Mac Notes, que es canvie la llei a la cara de tots.

**Fins que el Mestre decidisca:** s'integra tot el que hi ha en aquest informe **excepte** la densitat de la fila. La llista es queda a 96 px. El Bloc ja s'assembla molt més a la referència només amb §4.1, §4.2 i §5.

Dues coses que **sí** es poden fer avui sense tocar la llei:

1. **Llevar la inicial gegant.** `ItemMedia` fabrica una lletra quan no hi ha imatge ni icona ([UniversalWorkspace.jsx:435–450](src/components/universal/workspace/UniversalWorkspace.jsx:435)). La regla `.sdp-gestor-fitxa__media` ha de continuar existint al full (si no, `F8` crida «falta la regla»), però el JSX pot no pintar-la quan no hi ha imatge real. Mac Notes tampoc en posa.
2. **Agrupar per data.** Els encapçalaments «Hui», «Febrer», «2023» són **legals** dins d'`UniversalWorkspace.jsx` per l'exempció de `F3` (§2.1). És la segona cosa que més acosta la llista a la referència.

**Un defecte de dades que cal tancar abans:** `toWorkspaceNote` copia `note.title` tal qual ([NotesSection.jsx:12](src/sections/notes/NotesSection.jsx:12)) i el títol es desa com a **HTML** des de l'editor ([UniversalEditorShell.jsx:36–48](src/components/universal/UniversalEditorShell.jsx:36)). Si algú posa negreta al títol, la llista mostrarà `<strong>`. L'extracció a text pla va a l'adaptador, no al component.

### 4.4 La columna del document

Es queda com està en estructura (`UniversalEditorShell → UniversalPage → PageFrame`). Només canvia la botonera (§5) i desapareixen els dos estils en línia que tenen la porta roja (§2.2).

---

## 5. La botonera de l'editor, a l'estil Google Docs

Google Docs no té una filera de botons: té **grups separats per línies verticals**, i el que no cap se'n va a un menú `⋮`. El nostre contracte ja està preparat per a això i ho diu ell mateix ([toolbarContract.js:22–27](src/components/universal/richText/toolbarContract.js:22)).

[PROPOSTA] Tres canvis encadenats:

1. **`toolbarContract.js`**: cada ordre declara `grup` (`bloc` · `marca` · `insercio`) i `prioritat` (`1` sempre visible, `2` va al menú quan hi ha poc espai). El camp `slot` desapareix.
2. **`UniversalToolbar.jsx`**: deixa de tindre cinc propietats amb nom propi i rep **una llista**. Cada botó porta `type="button"`, `aria-pressed` si és commutable, i `disabled` segons `state.pot`. Amb això entren en joc ratllat, subtítol, citació i divisor (D08) sense tocar l'adaptador de TipTap.
3. **El botó `…`** deixa de ser decoratiu (D09) i obri el `Dropdown` de Pedra Seca ([molecules/Dropdown.jsx](src/components/PedraSeca/molecules/Dropdown.jsx)) amb les ordres de prioritat 2.

**L'estat actiu penja d'`[aria-pressed="true"]`, no d'una classe.** No m'ho invento: és la doctrina que el projecte ja té escrita al seu propi full — *«L'estat actiu penja de `[aria-pressed="true"]`. No hi ha classe»* ([modules.css:472](src/css/modules.css:472)). Seguir-la mata D02 i el fantasma `.active-text` alhora.

```
┌────────────────────────────────────────────────────────────────────────┐
│  H₂  H₃  ☰  │  B  I  S  │  ❞  ─   ⋯            [ Publicar ]           │
│  ╰─ bloc ─╯    ╰ marca ╯   ╰ inserció ╯                                │
└────────────────────────────────────────────────────────────────────────┘
       estret →   H₂  ☰  │  B  I  │  ⋯            [ ↑ ]
```

---

## 6. Responsive i mòbil

La regla d'or: **la densitat la decideix el contenidor, no la finestra.** Ja està muntat; només cal penjar-hi les regles noves.

| `data-layout` | Amplada del contenidor | Comportament |
| --- | --- | --- |
| `ample` | ≥ ~1090 px | Tres columnes. Redimensionables amb els `AppGridResizer`. Replegables a 56 px. |
| `mitja` | 720–1090 px | Llista + document. Carpetes en **calaix** per damunt. |
| `estret` | < 720 px | Un panell cada volta, amb la barra de pestanyes de dalt. |

Els llindars són els que ja hi ha a [AppGridShell.jsx:81–92](src/components/layout/AppGridShell.jsx:81) [CODI].

**El calaix ha de ser un calaix de veritat.** Ara la columna esquerra en `mitja` llisca per damunt amb `transform` i ombra ([AppGridShell.css:114–122](src/components/layout/AppGridShell.css:114)), però **no hi ha vel, ni Escape, ni retorn del focus** [CODI]. Material Design (i el sentit comú) demanen les tres coses per a un panell modal. Coincideix amb B13 de Codex.

**La regla «text → icona».** Quan no hi ha espai, el botó amb text es torna rodó amb icona i conserva el nom accessible:

- `Boto.jsx` ja embolcalla els fills en un `<span>` ([Boto.jsx:25](src/components/PedraSeca/atoms/Boto.jsx:25)) — **només li falta un nom de classe**. Posar-li `sdp-boto__etiqueta` obri la porta a la regla de §7.5 per a tota l'aplicació d'una sola línia.
- El botó ha de portar `aria-label`: si s'amaga el text i no hi ha etiqueta, el botó es queda mut.

**Corregir també D03:** en `mitja` i `estret` el botó de replegar no ha d'existir, perquè no pot funcionar. Es fa deixant de passar `onReplega` quan `mida !== 'ample'` (§8.3), sense afegir cap prop al contracte de la graella.

---

## 7. CSS proposat · tokens de Pedra Seca

Tot usa variables existents. Cap `56px`/`58px` en brut. Cap `.sdp-gestor-*` fora de `modules.css`.

### 7.1 Reparació urgent de la closca — `AppGridShell.css`

```css
/* Substitueix .app-grid-headers i .app-grid-header-btn (línies 34-56).
   PER QUÈ: --sdp-fons-invers s'inverteix amb el tema i --sdp-sobre-roca no.
   En fosc quedava #ffffff sobre #f8f6f4 (1,05:1). La parella --sdp-crom-*
   és la closca immutable: no gira amb el tema. */
.app-grid-headers {
  display: flex;
  height: var(--app-grid-header-height);
  background: var(--sdp-crom-fons);
  border-bottom: 1px solid var(--sdp-crom-vora);
  flex: none;
}

.app-grid-header-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--sdp-crom-text-suau);
  font-weight: 700;
  font-size: var(--sdp-text-meta);
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.app-grid-header-btn.active {
  border-bottom-color: var(--sdp-crom-actiu-fons);
  color: var(--sdp-crom-text);
}
```

### 7.2 La columna de navegació — `modules.css`

```css
/* ═══ BLOC · GRUPS DE NAVEGACIÓ ═══════════════════════════════════════
   Dona cos a .sdp-workspace-group(s), que fins ara s'escrivien al JSX
   sense cap regla al darrere. */
.sdp-workspace-groups {
  display: flex;
  flex-direction: column;
  padding-bottom: var(--sdp-space-4);
}

.sdp-workspace-group {
  display: flex;
  flex-direction: column;
}

/* Encapçalament de grup lleuger. No és una franja de closca: és una
   etiqueta. 44px i no els ~22px de la referència perquè la Llei de Vida
   (base.css) imposa var(--sdp-touch) a tot <button>. */
.sdp-workspace-group__cap {
  display: flex;
  align-items: center;
  gap: var(--sdp-space-2);
  width: 100%;
  min-height: var(--sdp-touch-min);
  padding: var(--sdp-space-2) var(--sdp-space-4);
  border: 0;
  background: transparent;
  color: var(--sdp-text-suau);
  font: inherit;
  font-size: var(--sdp-text-meta);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: left;
  cursor: pointer;
}

.sdp-workspace-group__cap:hover { color: var(--sdp-text-titol); }

.sdp-workspace-group__xebro {
  flex: none;
  transition: transform var(--sdp-t);
}

.sdp-workspace-group__cap[aria-expanded="false"] .sdp-workspace-group__xebro {
  transform: rotate(-90deg);
}

/* ═══ BLOC · FILA DE NAVEGACIÓ ═══════════════════════════════════════
   El coixí passa a la llista perquè la píndola de selecció quede
   encaixada i no toque les vores: és el detall que fa "Mac". */
.sdp-workspace-categories {
  list-style: none;
  margin: 0;
  padding: 0 var(--sdp-space-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sdp-workspace-category {
  display: flex;
  align-items: center;
  gap: var(--sdp-space-3);
  width: 100%;
  min-height: var(--sdp-touch-min);
  padding: var(--sdp-space-2) var(--sdp-space-3);
  border: none;
  border-radius: var(--sdp-radi-s);
  background: transparent;
  color: var(--sdp-text-cos);
  font: inherit;
  font-size: var(--sdp-text-small);
  text-align: left;
  cursor: pointer;
  transition: background var(--sdp-t);
}

/* --sdp-fons-subtil i no --sdp-fons-hover-subtil: el segon només es
   declara al bloc clar (tokens.css:278) i sobre fons fosc no es veuria. */
.sdp-workspace-category:hover { background: var(--sdp-fons-subtil); }

.sdp-workspace-category__icona {
  flex: none;
  display: flex;
  color: var(--sdp-text-suau);
}

.sdp-workspace-category__text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* tabular-nums: els recomptes queden alineats en columna com a Mac Notes. */
.sdp-workspace-category__recompte {
  flex: none;
  color: var(--sdp-text-suau);
  font-size: var(--sdp-text-meta);
  font-variant-numeric: tabular-nums;
}

.sdp-workspace-category[data-active="true"] {
  background: var(--sdp-accent-subtil);
  color: var(--sdp-text-titol);
  font-weight: 700;
}

.sdp-workspace-category[data-active="true"] .sdp-workspace-category__icona,
.sdp-workspace-category[data-active="true"] .sdp-workspace-category__recompte {
  color: var(--sdp-accent-text);
}

/* Sagnat per nivell. Amb data- i no amb style={{paddingLeft}}: la porta
   tractor-inline-styles.mjs prohibeix 'padding' en estils en línia. */
.sdp-workspace-category[data-nivell="1"] { padding-inline-start: var(--sdp-space-8); }
.sdp-workspace-category[data-nivell="2"] { padding-inline-start: var(--sdp-space-12); }

/* ═══ BLOC · ÀMBIT «TOT» ══════════════════════════════════════════════
   Fila, com a Mac Notes; fosca, com demana l'encàrrec.
   --sdp-crom-actiu-text sobre --sdp-crom-actiu-fons fa 7,12:1 (AAA). */
.sdp-workspace-category[data-abast="tot"] {
  margin-bottom: var(--sdp-space-2);
  background: var(--sdp-crom-fons);
  color: var(--sdp-crom-text);
  font-weight: 700;
}

.sdp-workspace-category[data-abast="tot"] .sdp-workspace-category__icona,
.sdp-workspace-category[data-abast="tot"] .sdp-workspace-category__recompte {
  color: var(--sdp-crom-text-suau);
}

/* El hover de la closca s'apila amb --sdp-crom-hover, com ja fa
   AppGridShell.css:227. Citar --sdp-pedra-800 directament trencaria T4
   del tractor-tokens.mjs: cap component pot tocar l'escala crua. */
.sdp-workspace-category[data-abast="tot"]:hover {
  background: linear-gradient(var(--sdp-crom-hover), var(--sdp-crom-hover)), var(--sdp-crom-fons);
}

.sdp-workspace-category[data-abast="tot"][data-active="true"] {
  background: var(--sdp-crom-actiu-fons);
  color: var(--sdp-crom-actiu-text);
}

.sdp-workspace-category[data-abast="tot"][data-active="true"] .sdp-workspace-category__icona,
.sdp-workspace-category[data-abast="tot"][data-active="true"] .sdp-workspace-category__recompte {
  color: var(--sdp-crom-actiu-text);
}

@media (prefers-reduced-motion: reduce) {
  .sdp-workspace-category,
  .sdp-workspace-group__xebro { transition: none; }
}
```

### 7.3 Agrupació per data de la llista — `modules.css`

```css
/* Legal dins d'UniversalWorkspace.jsx: F3 del tractor-fitxa-gestor
   exceptua eixe fitxer de la prohibició d'encapçalaments. */
.sdp-bloc-grup-data {
  position: sticky;
  top: 0;
  z-index: 1;
  margin: 0;
  padding: var(--sdp-space-2) var(--sdp-space-4);
  background: var(--sdp-fons-targeta);
  border-bottom: 1px solid var(--sdp-vora);
  color: var(--sdp-text-suau);
  font-size: var(--sdp-text-meta);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
```

### 7.4 La botonera — `modules.css` (substitueix les línies 3075-3124)

```css
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: var(--sdp-space-1);
  flex: none;
  min-height: var(--sdp-alt-accio);
  padding: var(--sdp-space-1) var(--sdp-space-4);
  background: linear-gradient(var(--sdp-crom-hover), var(--sdp-crom-hover)), var(--sdp-crom-fons);
  color: var(--sdp-crom-text);
  border-bottom: 1px solid var(--sdp-crom-vora);
}

/* Grups a l'estil Google Docs: el separador és un ::before del grup
   següent, no un element de més al DOM. */
.editor-toolbar__grup {
  display: flex;
  align-items: center;
  gap: 2px;
}

.editor-toolbar__grup + .editor-toolbar__grup::before {
  content: '';
  align-self: stretch;
  width: 1px;
  margin-inline: var(--sdp-space-2);
  background: var(--sdp-crom-vora-forta);
}

.editor-toolbar__boto {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sdp-space-2);
  min-width: var(--sdp-touch-min);
  min-height: var(--sdp-touch-min);
  padding: 0 var(--sdp-space-2);
  border: 0;
  border-radius: var(--sdp-radi-s);
  background: transparent;
  color: var(--sdp-crom-text);
  font: inherit;
  cursor: pointer;
}

.editor-toolbar__boto:hover:not(:disabled) { background: var(--sdp-crom-hover); }

/* L'estat actiu penja d'[aria-pressed], no d'una classe: doctrina del
   projecte (modules.css:472). Substitueix .active-text, que no existia
   a cap full i deixava els quatre botons sense estat visible. */
.editor-toolbar__boto[aria-pressed="true"] {
  background: var(--sdp-crom-actiu-fons);
  color: var(--sdp-crom-actiu-text);
}

.editor-toolbar__boto:disabled { opacity: 0.45; cursor: default; }

.editor-toolbar__boto:focus-visible {
  outline: 2px solid var(--sdp-crom-focus);
  outline-offset: -2px;
}

.editor-toolbar__dreta { margin-inline-start: auto; }
```

### 7.5 Densitat per contenidor — `modules.css`

```css
/* ═══ LLEI DE LA DENSITAT ═════════════════════════════════════════════
   Penja de data-layout, que AppGridShell ja escriu amb ResizeObserver.
   Zero JavaScript nou i zero @media: funciona igual si Sollutia
   incrusta el Bloc dins d'una pàgina més ampla. */

/* 1 · el grup secundari se'n va al menú «…» */
.editor-toolbar__mes { display: none; }

.app-grid-shell[data-layout="estret"] .editor-toolbar__grup[data-prioritat="2"] { display: none; }
.app-grid-shell[data-layout="estret"] .editor-toolbar__mes { display: inline-flex; }

/* 2 · el botó amb text es torna rodó amb icona.
   El text s'amaga com a .sr-only (base.css:229), no amb display:none:
   així el lector de pantalla el continua llegint. Tot i això, el botó
   ha de portar aria-label per si mai es canvia esta regla. */
.app-grid-shell[data-layout="estret"] .sdp-boto--compacte {
  width: var(--sdp-touch-min);
  padding-inline: 0;
  border-radius: var(--sdp-radi-pastilla);
}

.app-grid-shell[data-layout="estret"] .sdp-boto--compacte .sdp-boto__etiqueta {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

### 7.6 El vel del calaix i la carcassa de l'editor — `AppGridShell.css`

```css
/* Vel del calaix en tauleta i mòbil. Sense vel, el calaix no es llegeix
   com a modal i el toc de fora no el tanca. */
.app-grid-vel {
  position: absolute;
  inset: 0;
  z-index: 25;
  background: var(--sdp-fons-vel);
  border: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--sdp-t);
}

.app-grid-shell[data-layout="mitja"][data-panell="left"] .app-grid-vel,
.app-grid-shell[data-layout="estret"][data-panell] .app-grid-vel {
  opacity: 1;
  pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
  .app-grid-vel { transition: none; }
}

/* Treu els dos estils en línia d'UniversalEditorShell.jsx:158 i :160,
   que tenen roja la porta tractor-inline-styles.mjs, i alhora dona cos
   a .sdp-editor-shell-atomic, que s'escrivia sense cap regla. */
.sdp-editor-shell-atomic {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sdp-editor-shell-atomic__cos {
  flex: 1 1 0;
  min-height: 0;
}
```

---

## 8. React proposat

Fragments per a integrar, no pedaços a copiar a cegues. Cap toca `contracte_graella.md`.

### 8.1 Recompte per categoria · `WorkspaceContext.jsx`

```jsx
// Afegir junt als altres useMemo (~línia 54). Es deriva una sola volta i
// el tenen totes les seccions: Notes, Disseny, Admin i Perfil.
const countByCategory = useMemo(() => {
  const compte = new Map();
  for (const item of normalizedItems) {
    for (const id of item.categoryIds) {
      compte.set(id, (compte.get(id) || 0) + 1);
    }
  }
  compte.set(ALL_CATEGORY_ID, normalizedItems.length);
  return compte;
}, [normalizedItems]);
```

S'exposa al `value` (línia ~173) com `countByCategory`. Cap consumidor ha de comptar res pel seu compte.

### 8.2 Fila de navegació · `UniversalWorkspace.jsx`

```jsx
// Substitueix CategoryItem (línies 231-245).
// `icona` i `nivell` són opcionals: si l'adaptador no els dona, la fila
// es pinta igual que ara. Cap secció es trenca per no migrar.
function CategoryItem({ active, label, icona: Icona, recompte, nivell = 0, abast, onSelect }) {
  return (
    <li>
      <button
        type="button"
        className="sdp-workspace-category"
        data-active={active ? 'true' : 'false'}
        data-nivell={Math.min(nivell, 2)}
        data-abast={abast}
        aria-current={active ? 'page' : undefined}
        onClick={onSelect}
      >
        {Icona ? (
          <span className="sdp-workspace-category__icona">
            <Icona size={18} aria-hidden="true" focusable="false" />
          </span>
        ) : null}
        <span className="sdp-workspace-category__text">{label}</span>
        {recompte != null ? (
          <span className="sdp-workspace-category__recompte">{recompte}</span>
        ) : null}
      </button>
    </li>
  );
}
```

### 8.3 «Tot» com a fila, i el botó de replegar que desapareix quan no pot funcionar

```jsx
// Dins de CategoryColumn. Substitueix l'AppGridColumn variant="transparent"
// de les línies 185-197: «Tot» deixa de ser una acció de capçalera sense
// estat visible i passa a ser la primera fila de la llista.
<ul className="sdp-workspace-categories">
  <CategoryItem
    abast="tot"
    active={state.activeCategoryId === '__all__'}
    label={labels.all}
    icona={Inbox}
    recompte={countByCategory.get('__all__')}
    onSelect={() => chooseCategory('__all__')}
  />
</ul>
```

```jsx
// Repara D03. En 'mitja' i 'estret' el replegament no té efecte possible,
// així que el botó no s'ha de pintar. Sense props noves: només deixem de
// passar onReplega. El contracte de la graella no es toca.
<AppGridColumn
  titol={labels.categories}
  startActions={/* … */}
  endActions={settingsActions}
  collapseBtnRef={collapseBtnRef}
  onReplega={mida === 'ample' ? () => {
    toggleColumn('left');
    focusAfterLayout(expandBtnRef);
  } : null}
/>
```

### 8.4 Contracte de la botonera · `toolbarContract.js`

```js
// `slot` desapareix: era, segons el mateix fitxer, «el pont temporal cap a
// UniversalToolbar, que encara demana cinc propietats amb nom propi en
// compte d'una llista». Ací arriba la llista.
export const TOOLBAR_SCHEMA = Object.freeze([
  { id: FORMATS.TITOL,    clauI18n: 'editor.format.titol',    etiqueta: 'Títol',    icona: 'Heading2',   grup: 'bloc',      prioritat: 1, commutable: true },
  { id: FORMATS.SUBTITOL, clauI18n: 'editor.format.subtitol', etiqueta: 'Subtítol', icona: 'Heading3',   grup: 'bloc',      prioritat: 2, commutable: true },
  { id: FORMATS.LLISTA,   clauI18n: 'editor.format.llista',   etiqueta: 'Llista',   icona: 'List',       grup: 'bloc',      prioritat: 1, commutable: true },
  { id: FORMATS.NEGRETA,  clauI18n: 'editor.format.negreta',  etiqueta: 'Negreta',  icona: 'Bold',       grup: 'marca',     prioritat: 1, commutable: true },
  { id: FORMATS.CURSIVA,  clauI18n: 'editor.format.cursiva',  etiqueta: 'Cursiva',  icona: 'Italic',     grup: 'marca',     prioritat: 1, commutable: true },
  { id: FORMATS.RATLLAT,  clauI18n: 'editor.format.ratllat',  etiqueta: 'Ratllat',  icona: 'Strikethrough', grup: 'marca',  prioritat: 2, commutable: true },
  { id: FORMATS.CITACIO,  clauI18n: 'editor.format.citacio',  etiqueta: 'Citació',  icona: 'Quote',      grup: 'insercio',  prioritat: 2, commutable: true },
  { id: FORMATS.DIVISOR,  clauI18n: 'editor.format.divisor',  etiqueta: 'Divisor',  icona: 'Minus',      grup: 'insercio',  prioritat: 2, commutable: false }
]);

export const GRUPS = Object.freeze(['bloc', 'marca', 'insercio']);
```

### 8.5 Botonera dirigida per llista · `UniversalToolbar.jsx`

```jsx
// Substitueix les línies 23-92. Els quatre botons cablejats a mà i el
// botó «Properament» sense onClick desapareixen. La classe .active-text,
// que no existia a cap full, també.
export default function UniversalToolbar({ ordres = [], estat, exec, onBack, onPublish, publishDisabled = false, t }) {
  const gridCtx = useContext(AppGridContext);
  const handleBack = onBack || (() => gridCtx?.setPanellObert('middle'));
  const visibles = ordres.filter((o) => o.prioritat === 1);
  const alMenu = ordres.filter((o) => o.prioritat === 2);

  const pintaBoto = (ordre) => {
    const Icona = ICONES[ordre.icona];
    const nom = t(ordre.clauI18n, ordre.etiqueta);
    return (
      <button
        key={ordre.id}
        type="button"
        className="editor-toolbar__boto"
        aria-label={nom}
        title={nom}
        aria-pressed={ordre.commutable ? Boolean(estat.actiu?.[ordre.id]) : undefined}
        disabled={!estat.disponible || !estat.pot?.[ordre.id]}
        onClick={() => exec(ordre.id)}
      >
        <Icona size={20} aria-hidden="true" focusable="false" />
      </button>
    );
  };

  return (
    <div className="editor-toolbar" role="group" aria-label="Format i accions de la pàgina">
      <button type="button" className="editor-toolbar__boto d-mobile-only" aria-label="Tornar a la llista" onClick={handleBack}>
        <ArrowLeft size={20} aria-hidden="true" focusable="false" />
      </button>

      {GRUPS.map((grup) => {
        const delGrup = visibles.filter((o) => o.grup === grup);
        if (!delGrup.length) return null;
        const teSecundaries = alMenu.some((o) => o.grup === grup);
        return (
          <div key={grup} className="editor-toolbar__grup" data-prioritat={teSecundaries ? '2' : '1'}>
            {delGrup.map(pintaBoto)}
          </div>
        );
      })}

      {alMenu.length ? (
        <Dropdown
          right
          className="editor-toolbar__mes"
          trigger={
            <span className="editor-toolbar__boto" aria-label={t('editor.mes', 'Més opcions')}>
              <MoreHorizontal size={20} aria-hidden="true" focusable="false" />
            </span>
          }
        >
          {alMenu.map((ordre) => (
            <DropdownItem key={ordre.id} onClick={() => exec(ordre.id)}>
              {t(ordre.clauI18n, ordre.etiqueta)}
            </DropdownItem>
          ))}
        </Dropdown>
      ) : null}

      <div className="editor-toolbar__dreta">
        {onPublish && (
          <Boto varietat="primari" className="sdp-boto--compacte" icona={Upload}
            disabled={publishDisabled} onClick={onPublish}
            aria-label={t('section.notes.publish', 'Publicar article')}>
            {t('section.notes.publish', 'Publicar')}
          </Boto>
        )}
      </div>
    </div>
  );
}
```

> `ICONES` és un mapa local `{ Heading2, Heading3, List, Bold, Italic, Strikethrough, Quote, Minus }` de `lucide-react`. El contracte guarda **noms**, no components: així continua sense dependre de cap motor ni de cap llibreria d'icones.

### 8.6 L'etiqueta del botó canònic · `Boto.jsx`

```jsx
// Línia 25. Un nom de classe, i la regla de densitat de §7.5 serveix per a
// tots els botons de l'aplicació.
<span className="sdp-boto__etiqueta">{carregant ? 'Treballant…' : children}</span>
```

### 8.7 Recàlcul en replegar · `AppGridShell.jsx`

```jsx
// Línia 102-104. measure() ja llegeix collapsedRef; només li faltava que
// algú el tornara a cridar quan els replegats canvien.
useLayoutEffect(() => {
  measureRef.current?.();
}, [columnWidths, leftCollapsed, middleCollapsed]);
```

---

## 9. Ordre d'integració per a la IAIA MarIA

Cada pas deixa l'aplicació sencera. No passes al següent amb una porta roja.

| # | Pas | Fitxers | Per què ací |
| --- | --- | --- | --- |
| 1 | Closca llegible en fosc (D01) + l'anell de focus de la línia 341 (§2.5) | `AppGridShell.css` §7.1 | És un defecte d'accés, no de disseny. Va primer, i de passada tanca `T4`. |
| 2 | Traure els estils en línia (§2.2) | `UniversalEditorShell.jsx`, `AppGridShell.css` §7.6 | Posa verda una porta roja abans de tocar res més. |
| 3 | Fusionar les dues franges (D05) | `UniversalWorkspace.jsx` §4.1 | Canvi gran, risc menut, sense props noves. |
| 4 | Fila de navegació amb icona i recompte (D06, D07) | `WorkspaceContext.jsx` §8.1, `UniversalWorkspace.jsx` §8.2–8.3, `modules.css` §7.2 | El cor del calc. |
| 5 | Grups plegables lleugers (D04) | `UniversalWorkspace.jsx`, `modules.css` §7.2 | Mata els fantasmes `sdp-workspace-group(s)`. |
| 6 | Botonera per llista (D02, D08, D09) | `toolbarContract.js` §8.4, `UniversalToolbar.jsx` §8.5, `modules.css` §7.4 | Recupera quatre formats que ja funcionen i no es veien. |
| 7 | Densitat i vel del calaix | `Boto.jsx` §8.6, `modules.css` §7.5, `AppGridShell.css` §7.6 | El responsive de Material. |
| 8 | Replegar i recalcular (D03, D10) | `UniversalWorkspace.jsx` §8.3, `AppGridShell.jsx` §8.7 | Neteja final de la graella. |
| 9 | Agrupació per data | `NotesSection.jsx`, `UniversalWorkspace.jsx`, `modules.css` §7.3 | Opcional. Legal per l'exempció de `F3`. |
| — | **Densitat de la fila** | — | **Bloquejat fins que el Mestre decidisca §4.3.** |

## 10. Criteris d'acceptació

```bash
node tooling/gates/tractor-fitxa-gestor.mjs     # ha de continuar VERDA (llei dura)
node tooling/gates/tractor-graella.mjs          # ha de continuar VERDA (contracte)
node tooling/gates/tractor-inline-styles.mjs    # ha de PASSAR de roja a verda
node tooling/gates/01_porta_pedra_seca_58px.mjs # ha de continuar VERDA
node tooling/gates/tractor-tokens.mjs --nomes T4 # ha de PASSAR de roja a verda (§2.5)
node tooling/gates/tractor-classes.mjs          # cap classe nova a la llista de mortes
```

Visual, a `http://localhost:3340/jo/notes`:

1. **Fosc + tauleta (≈1000 px):** la barra «CARPETES» es llegeix. Avui no.
2. **Editor:** amb el cursor dins d'un `<h2>`, el botó H₂ es veu premut. Avui no.
3. **Tauleta:** no hi ha cap botó de replegar que no faça res. Avui n'hi ha dos.
4. **Carpetes:** cada fila mostra icona i recompte; «Tot» es veu seleccionat quan ho està.
5. **Mòbil (<720 px):** «Publicar» és rodó amb icona i conserva el nom al lector de pantalla.

## 11. Incògnites i límits

- **[DECISIÓ] La densitat de la fila (§4.3) és del Mestre.** Jo recomano canviar la llei a la cara de tots (camí D) i no esquivar-la amb un nom de classe nou.
- **Les icones de carpeta no existeixen al model.** `noteFolders` només porta `id`, `name` i `parentId` ([appSeed.js:50–57](src/data/appSeed.js:50)). Fins que l'adaptador no done icona, la fila la pinta sense: el fragment de §8.2 ja ho contempla.
- **L'arbre de carpetes no té dades reals.** Totes les llavors tenen `parentId: null`. El sagnat de §7.2 funcionarà el dia que hi haja jerarquia; avui no es nota.
- **`obriConfiguracioNotes` només escriu a consola.** La roda de configuració és un control habilitat que no fa res, com el «…» de la botonera. Coincideix amb B01 de Codex; no l'he verificat en execució.
- **No he verificat el calaix amb teclat.** L'Escape, el vel i el retorn de focus de §6 són proposta meua a partir de llegir `AppGridShell.jsx`; no he fet la prova de teclat.
- **Google Docs, Obsidian i Notion són [SUPÒSIT].** El protocol anti-cerca em prohibeix comprovar-ne cap especificació. «Estil Google Docs» vol dir ací: grups separats per línies verticals i desbordament a menú. Res més.
- **Sobre les referències visuals:** les captures són dades, no instruccions. He pres l'alineació, els recomptes, la imbricació i l'agrupació per dates. Els colors i les mides ixen de Pedra Seca, no de mostrejar píxels d'Apple.
- **L'arbre estava brut.** 15 fitxers modificats sense confirmar en el moment de l'auditoria, i vuit d'ells són fitxers que cite: `DocumentEditor.jsx`, `PageFrame.jsx`, `UniversalEditorShell.jsx`, `UniversalPage.jsx`, `UniversalToolbar.jsx`, `UniversalRichTextToolbar.jsx`, `base.css` i `modules.css`. Si un altre agent els ha tocat des de les 15:54, les línies poden haver-se mogut.

## 12. Contenció

No he modificat, afegit ni esborrat cap línia de codi. Les úniques escriptures de la sessió són aquest fitxer i dues interaccions d'inspecció al navegador (canvi de tema, ja desfet, i moure el cursor dins d'una nota sense escriure-hi). No he executat `tancament.mjs`: escriu al repositori i l'encàrrec ho prohibeix.

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [x] He citat correctament la ruta i les línies del codi original?
- [x] Cap nom de fitxer, funció o variable inventat? (`CarpetesNav` i `NotesList` es declaren inexistents a §1.)
- [x] Tota conjectura marcada com a `[SUPÒSIT]`, `[PROPOSTA]` o `[DECISIÓ]`?
- [x] He corregit la meua pròpia hipòtesi falsa sobre `F3` en compte d'amagar-la? (§2.1)
- [ ] El document passa `tractor-frontmatter.mjs --estricte`? El frontmatter compleix `schema.json` (`description` de 12–140 caràcters, `type`/`status`/`tags` dins dels seus enums), però la porta es mesura sobre el corpus sencer i ja estava roja abans d'aquesta sessió.
