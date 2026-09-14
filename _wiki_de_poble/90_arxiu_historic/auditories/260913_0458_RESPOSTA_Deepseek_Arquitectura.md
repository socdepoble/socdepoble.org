---
tipus: document
estat: esborrany
description: Auditoria d'Arquitectura React + Caça de Fantasmes Pedra Seca
---
# Auditoria d'Arquitectura React + Caça de Fantasmes Pedra Seca

---

# PART A · Arquitectura React (Enxufabilitat i Plugins)

## A1. `useUniversalRichText.js` — destrucció doble de la instància TipTap

**Fitxer:** `src/components/universal/richText/useUniversalRichText.js`

```js
useEffect(() => {
  return () => {
    if (editor && !editor.isDestroyed && editor.view) {
       editor.view.destroy();
    }
  };
}, [editor]);
```

**Problema:** `useEditor` de `@tiptap/react` ja gestiona el cicle de vida de l'editor. Cridar `editor.view.destroy()` manualment en el cleanup és:

1. **Redundant** quan `useEditor` ja ha destruït l'editor (unmount normal).
2. **Perillós** quan `editor` canvia de referència: el cleanup destrueix l'editor VELL, però TipTap pot haver ja planificat la seua pròpia destrucció. Cridar `view.destroy()` dues vegades llança `TypeError: Cannot read property 'dom' of null` en el pitjor cas, o deixa l'editor en estat inconsistent.
3. **No cobreix el cas real**: si l'extensions array canvia, TipTap crea un editor nou internament, però el cleanup amb `[editor]` deps no es dispara perquè `editor` és la MATEIXA referència fins que TipTap el substituïx.

**Correcció:** eliminar el bloc sencer. `useEditor` ja fa la seua faena. Si cal netejar estat propi (el `timeoutRef`, els listeners globals), ja ho fa el cleanup anterior.

---

## A2. `UniversalRichTextToolbar` — acoblament dur a TipTap

**Fitxer:** `src/components/universal/richText/UniversalRichTextToolbar.jsx`

```jsx
const formatState = {
  isHeading: editor?.isActive('heading', { level: 2 }),
  isList: editor?.isActive('bulletList'),
  isBold: editor?.isActive('bold'),
  isItalic: editor?.isActive('italic'),
  isStrike: editor?.isActive('strike'),
};
```

**Problema:** la toolbar rep l'editor TipTap CRU i crida mètodes específics (`isActive`, `chain().focus().toggleHeading({ level: 2 }).run()`). Si demà canvies TipTap per ProseMirror pur, Lexical, Slate o un editor custom, la toolbar sencera s'ha de reescriure.

**Açò és el coll d'ampolla principal de l'objectiu "editor endollable".**

**Correcció:** interposar un adapter.

```js
// richText/EditorAdapter.js — contracte
export function crearAdapter(editor) {
  return {
    // Estat (només lectura)
    estaActiu: (format, attrs) => editor.isActive(format, attrs),
    potDesfer: () => editor.can().undo(),
    potRefer: () => editor.can().redo(),

    // Accions (escometen canvi)
    alternaEncapcalament: (nivell) => editor.chain().focus().toggleHeading({ level: nivell }).run(),
    alternaNegreta: () => editor.chain().focus().toggleBold().run(),
    alternaCursiva: () => editor.chain().focus().toggleItalic().run(),
    alternaRatllat: () => editor.chain().focus().toggleStrike().run(),
    alternaLlista: () => editor.chain().focus().toggleBulletList().run(),
    inserixEnllac: (href) => editor.chain().focus().setLink({ href }).run(),
    // ... el que calga
  };
}
```

La toolbar rep l'adapter, no l'editor. **TipTap queda confinat a un sol fitxer** (`useUniversalRichText.js` + `UniversalRichTextContent.jsx` + `UniversalRichTextToolbar.jsx` no sap res de TipTap). El shell i la toolbar són agnòstics.

Cost: ~50 línies d'adapter. Benefici: swap d'editor = reescriure un fitxer.

---

## A3. Slash Menu al Shadow DOM — la fuita garantida

**Fitxers implicats:** `src/PedraSecaEmbed.jsx` (shadow root), `useUniversalRichText.js` (extensions)

**Problema:** per defecte, `@tiptap/suggestion` renderitza el menú flotant a `document.body`. Dins del Shadow DOM:

- `document.body` és l'**amfitrió** (WordPress, Sollutia), NO el shadow root.
- Els tokens `--sdp-*` no arriben a `document.body`.
- L'estil del menú flotant serà el del lloc amfitrió, no el de Pedra Seca.
- `overflow: hidden` del contenidor pare pot retallar-lo.

**Correcció:** obligar TipTap a renderitzar dins del shadow root.

```js
import Suggestion from '@tiptap/suggestion';

Suggestion.configure({
  suggestion: {
    // ...
    render: () => {
      let component;
      let popup;
      return {
        onStart: (props) => {
          // Crear el contenidor DINS del shadow root
          const arrel = document.querySelector('soc-de-poble')?.shadowRoot?.querySelector('.sdp-root');
          if (!arrel) return;
          popup = document.createElement('div');
          popup.className = 'sdp-slash-menu'; // classe Pedra Seca
          arrel.appendChild(popup);
          // render del component preact
          component = render(<SlashMenu {...props} />, popup);
        },
        onUpdate: (props) => component?.update?.(props),
        onKeyDown: (props) => component?.onKeyDown?.(props),
        onExit: () => {
          component?.unmount?.();
          popup?.remove();
        },
      };
    },
  },
});
```

**Conseqüència arquitectònica:** el Slash Menu és un component Preact que viu a `src/plugins/editor/slash/` i usa `.sdp-slash-menu` (tokenitzat). Si el dia de demà es canvia d'editor, el component Slash Menu es reutilitza si el nou editor té un mecanisme equivalent. **La UI no canvia, només l'acoblament amb el motor.**

---

## A4. Doble runtime React/Preact — bomba de rellotgeria

**Fitxer:** `package.json`

```json
"dependencies": {
  "@tiptap/react": "^3.31.0",   // ← espera React real
  "preact": "^10.29.8",          // ← runtime de l'app
  "react": ">=18.0.0",           // ← present per a @tiptap/react
  "react-dom": ">=18.0.0"
}
```

**Problema:** `@preact/preset-vite` aliasta `react` → `preact/compat` per a la majoria de codi, PERÒ `@tiptap/react` pot importar símbols de React que `preact/compat` no implementa exactament (casos coneguts: `useSyncExternalStore` amb `getServerSnapshot`, alguns detalls de `StrictMode` doble-effect).

**Símptomes potencials:**
- Efectes que es disparan una sola vegada en React real i zero en Preact (o al revés).
- `useEditor` que torna `null` o que no es re-renderitza en canviar `content`.
- Errors de hidratació si algun dia es fa SSR.

**Verificació:** comprovar que `vite.config.js` (ABSENT al bundle) té `@preact/preset-vite` configurat amb `alias: true`. Si no, hi ha dos runtimes simultanis al bundle.

**Recomanació:** si la verificació falla, moure TipTap a un subpaquet aïllat o acceptar el doble runtime com a deute declarat.

---

## A5. `useEditorState` absent — toolbar actualitza per la via pesada

**Fitxer:** `src/components/universal/richText/useUniversalRichText.js`

`useEditor` en TipTap v3 **NO re-renderitza** el component pare en cada transacció per defecte (`shouldRerenderOnTransaction: false`). La toolbar actualitza el seu estat perquè el `onUpdate` crida `setLocalNoteField`, que dispara un re-render del `NotesProvider` sencer.

**Cost:** cada tecla → re-render del NotesProvider (centenars de components) → re-render de NotesEditor → re-render de la toolbar.

**Correcció:** usar `useEditorState` per subscriure només als bits que la toolbar necessita.

```js
import { useEditorState } from '@tiptap/react';

const state = useEditorState({
  editor,
  selector: ({ editor }) => ({
    isHeading: editor.isActive('heading', { level: 2 }),
    isBold: editor.isActive('bold'),
    // ...
  }),
});
```

**Benefici:** cada tecla → re-render només de la toolbar. **Deixa de re-renderitzar NotesProvider sencer per cada caràcter.**

---

## A6. `contentEditable` + TipTap — dos paradigmes al mateix shell

**Fitxer:** `src/components/universal/UniversalEditorShell.jsx`

```jsx
<EditableField key={`${id}-title`} ... />      // ← contentEditable
<EditableField key={`${id}-subtitle`} ... />   // ← contentEditable
<EditableField key={`${id}-lead`} ... />       // ← contentEditable
{children}                                     // ← TipTap aquí
```

**Problema:** el títol, subtítol i entradilla es renderitzen amb `contentEditable` + `dangerouslySetInnerHTML`. El cos amb TipTap. **Dues APIs d'edició diferents al mateix shell.**

**Conseqüències:**
1. `onPaste` no està gestionat → el títol pot rebre HTML arbitrari del porta-retalls que s'apega al DOM abans del `onInput` sanititzador.
2. El formatatge (negreta, cursiva) del títol funciona per drecera de teclat del navegador però no és coherent amb el cos.
3. Si demà vols canviar l'editor, el títol NO es canvia (no és TipTap).

**Correcció:** o bé (a) migrar títol/subtítol/entradilla a TipTap amb extensió `Document` limitada, o bé (b) mantindre `contentEditable` però amb un `onPaste` netejador explícit:

```jsx
onPaste={(e) => {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, text);
}}
```

Recomane **opció (a)** si vols coherència real. Si no, **opció (b)** com a pedaç immediat.

---

## A7. Trencaments d'encapsulament (`document.*`)

**Fitxers:** `App.jsx`, `UIContext.jsx`, `AvisadorEfimer.jsx`, `useSEO.js`

```
src/app/App.jsx                    → document.body, document.documentElement
src/app/contexts/UIContext.jsx     → document.documentElement
src/components/universal/AvisadorEfimer.jsx → document.body
src/hooks/useSEO.js                → document.head
```

**Problema:** el shadow DOM és la frontera de l'embed. Aquests accessos surten fora i **modifiquen l'amfitrió** (WordPress/Sollutia). Si Sollutia té un altre `AvisadorEfimer`, entren en conflicte. Si Sollutia canvia el tema del seu body, l'app s'hi adapta però el shadow root no.

**Correcció:** confinar-ho tot al shadow root.

```js
// AvisadorEfimer
const target = document.querySelector('soc-de-poble')?.shadowRoot?.querySelector('.sdp-root')
             || document.querySelector('.sdp-root');
target.appendChild(sharedContainer);

// App.jsx
const root = mainRef.current.getRootNode();
const host = root instanceof ShadowRoot ? root.host : document.documentElement;
host.setAttribute('lang', language);
```

`useSEO` (document.head) és **legítim** perquè SEO només té sentit a la pàgina amfitriona. Però s'ha de documentar com a excepció explícita.

---

## A8. Resum d'arquitectura React

| Troballa | Severitat | Bloqueja l'objectiu? |
|---|---|---|
| A1 · destroy doble TipTap | Alta | No, però cal arreglar-ho abans de canviar d'editor |
| A2 · toolbar acoblada a TipTap | **Crítica** | **SÍ** — impedeix swap d'editor |
| A3 · Slash Menu fora del shadow | Alta | SÍ — cal configurar abans d'afegir-lo |
| A4 · doble runtime React/Preact | Mitjana | Potencialment SÍ |
| A5 · toolbar re-render via context | Mitjana | No, però frena |
| A6 · dos paradigmes d'edició | Mitjana | No |
| A7 · accessos `document.*` | Baixa | No |

**Ordre d'actuació:**
1. **A2** (adapter de toolbar) — és la peça que permet el swap d'editor.
2. **A1** (eliminar destroy) — 5 minuts.
3. **A3** (configurar Slash Menu al shadow root) — abans d'afegir cap extensió rica.
4. **A5** (`useEditorState`) — millora immediata de rendiment.
5. **A4** (verificar runtime) — abans de desplegar res.

---

# PART B · Caça de Fantasmes Pedra Seca

## B1. Tokens fantasma — 18 noms, cap definició

**Font:** `.agents/deute/.pedra-seca-deute.json` → `LLEI_02_TOKEN_FANTASMA`

Tokens usats i mai declarats:

| Token | Usat a | Impacte |
|---|---|---|
| `--sdp-bg` | `src/PedraSecaEmbed.jsx` (a `blank.php` via JS) | `background-color` del cos de l'amfitrió no s'aplica → **el fons del WordPress és sempre el beix clar, mai el fosc** |
| `--sdp-bg-alt` | `src/css/index.css` | Descartable si no es referencia |
| `--sdp-bg-principal` | `src/css/index.css` | Descartable |
| `--sdp-bg-secundari` | `src/css/index.css` | Descartable |
| `--sdp-border` | `src/css/index.css` | Vores invisibles |
| `--sdp-danger` | `src/css/index.css` | Alerta d'error sense color |
| `--sdp-text-fort` | `src/css/index.css` | Text que hauria de ser negreta però no |
| `--sdp-text-principal` | `src/css/index.css` | Text sense color |
| `--sdp-text-sm` | `src/css/index.css` | Text petit sense mida |
| `--sdp-text-xs` | `src/css/index.css` | Text mini sense mida |
| `--sdp-espai-6` | `src/css/index.css` | Espaiat zero |
| `--sdp-space-7` | `src/css/index.css` | Espaiat zero |
| `--sdp-radi-3xl` | `src/css/index.css` | Cantonades rectes |
| `--sdp-radi-full` | `src/css/index.css` | Pastilla sense radi |
| `--sdp-radi-md` | `src/css/index.css` | Radi zero |
| `--sdp-accio-suau` | `src/css/index.css` | Acció secundària sense color |
| `--avatar-size` | `src/css/index.css` | Avatar sense mida |
| `--mida` | `src/css/index.css` | Mida indefinida |

**Nota crítica:** el `.pedra-seca-deute.json` té `congelat: 2026-09-10T03:49:57.851Z` i el bundle és del 2026-09-13. L'`src/css/index.css` actual és **l'orchestrator** (només @imports), no el monòlit on es van detectar els fantasmes. **El baseline és probablement obsolet.** Cal regenerar-lo amb:

```bash
node tooling/brain/tractor-pedra-seca.mjs --baseline
```

I comprovar quins dels 18 segueixen vius.

### Correcció quirúrgica

Cada fantasma s'ha de resoldre d'una de tres maneres:

1. **Declarar el token** al bloc correcte de `src/css/tokens.css`:
   ```css
   :root, :host, .sdp-root {
     --sdp-text-sm: var(--sdp-text-small);   /* àlies útil */
     --sdp-text-xs: var(--sdp-text-meta);
     --sdp-radi-full: var(--sdp-radi-pastilla);
     --sdp-danger: var(--sdp-error);
   }
   ```

2. **Substituir l'ús** per un token existent (preferible):
   ```css
   /* abans */
   color: var(--sdp-text-principal);
   /* després */
   color: var(--sdp-text-titol);
   ```

3. **Eliminar l'ús** si és mort.

**Regla:** cap token `--sdp-*` s'usa sense estar declarat al `:root, :host, .sdp-root` de `tokens.css`. El `tractor-tokens.mjs` (T1) ja ho fa complir — però la llei dura no s'aplica a tokens sense prefix `--sdp-` com `--mida` i `--avatar-size`. **Recomanació:** T1 hauria d'estendre's a qualsevol custom property que no siga declarada al mateix fitxer.

---

## B2. Classes òrfenes — 115 noms, la cua del diable

**Font:** `.agents/deute/.pedra-seca-deute.json` → `LLEI_01_CLASSE_ORFENA`

No les repetiré totes. **Els grups crítics:**

### B2.1 · Fantasmes d'error i carrega (`App.jsx`)

```
.sdp-error-pre
.sdp-route-error
.sdp-route-loading-screen
.sdp-route-loading-screen__dots
.sdp-route-loading-screen__glow
.sdp-route-loading-screen__glow--left
.sdp-route-loading-screen__glow--right
.sdp-route-loading-screen__logo
.sdp-route-loading-screen__panel
.sdp-route-loading-screen__subtitle
.sdp-route-loading-screen__title
```

Usats a `App.jsx` (línies 60-75) per al fallback de Suspense. **No estan definits al CSS.** Resultat: la pantalla de càrrega no s'estil·la, mostra text pla amb logo descol·locat. **Es veu lletja cada vegada que es canvia de secció.**

### B2.2 · Fantasmes de la graella (`AppGridShell`)

```
.left, .middle, .right
.btn-icon--transparent
.hover-bg
```

Usats a `AppGridShell.jsx` i `AppGridColumn.jsx`. No definits. `left`/`middle`/`right` són genèrics i **poden col·lisionar amb Tailwind o Bootstrap de Sollutia**.

### B2.3 · Fantasmes del xat

```
.active-on-mobile
.has-thread
.xat-header-btn--active
.xat-settings-wrapper
```

Usats a `XatSection.jsx`. No definits. La UI del xat no té indicador visual d'activitat.

### B2.4 · Fantasmes d'onboarding

```
.fork-grid
.flex-1
.onboarding-field-help
.sdp-border-error
.sdp-border-vora
.sdp-text-accio-text
```

Usats a `OnboardingSteps.jsx`. **`.flex-1` és Tailwind pur** — la regla diu que no s'usa Tailwind al nucli. **Açò és una violació activa no detectada per cap porta.**

### B2.5 · Fantasmes de la fitxa de gestor

```
.app-grid-col-header${…}
```

**Classe dinàmica opaca.** El `tractor-vocabulari` ho detecta com a "classe-opaca". **No verificable estàticament** fins que es convertisca en un mapa explícit:

```js
// abans
`app-grid-col-header${cond ? '--collapsible' : ''}`
// després
const CLASSES = { collapsible: 'app-grid-col-header--collapsible', default: '' };
```

### Correcció: estratègia Salfumà

El `tractor-classes.mjs` (Salfumà) ja llista "mortes". Però no distingix:

- **Classe USADA en JSX i NO definida en CSS** → el JSX està trencat, cal CSS.
- **Classe DEFINIDA en CSS i NO usada en JSX** → el CSS és brossa, cal llevar.

Les 115 del baseline son del segon tipus. Però a `tractor-pedra-seca.mjs` LLEI_01, es llisten com si foren del primer tipus — perquè el parser busca `className="..."` literal.

**Recomanació:** bifurcar el tractament:

- **Salfumà A (urgent):** classes USADES al JSX i NO definides al CSS → afegir al CSS o llevar del JSX. **Açò és el que trenca la pantalla.**
- **Salfumà B (neteja):** classes DEFINIDES al CSS i NO usades al JSX → esborrar del CSS. **Açò és poda, no urgència.**

`tractor-classes-orfes.mjs` ja separa correctament. Cal **executar-lo i prioritzar Salfumà A.**

---

## B3. Estils en línia — 23 ocurrències, 10 fitxers

**Font:** `.agents/deute/.design-guard-deute.json` → `inline-style`

| Fitxer | Ocurrència trobada | Correcció |
|---|---|---|
| `UniversalEditorShell.jsx` | `style={{ marginBottom: '2rem' }}` al `<div className="hero-image">` | `.hero-image { margin-bottom: var(--sdp-space-8); }` |
| `Dropdown.jsx` | `style={{ '--sdp-desplegable-ample': minWidth }}` | **Legítim** (variable dinàmica). Mantindre. |
| `UniversalIndicatorCard.jsx` | `style={iconColor ? { '--custom-icon-color': iconColor } : {}}` | **Legítim** (color dinàmic per consumidor). Mantindre. |
| `icones.jsx` | `style={{ willChange: 'transform' }}` (IaiaIcon) | Llevar. `willChange` no cal, cap animació canvia el transform. |
| `icones.jsx` | `style={{ fillRule: 'nonzero', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2 }}` (path dins SVG) | Moure a `.iaia-icon path { ... }` |
| `detailSectionMeta.jsx` | Múltiples `style={{ marginTop: 18 }}` | `.stack-grid > * + * { margin-top: var(--sdp-space-4); }` |
| `XatSection.jsx` | `style={{ position: 'relative' }}` al wrapper de settings | `.xat-settings-wrapper { position: relative; }` |
| `DevicesSection.jsx` | Estils posicionals | Revisar i moure a CSS |
| `DetallAjust.jsx` | Preview d'imatge | Moure a classe |
| `Accordion.jsx` | ? | Revisar (probablement cap al JSX, però el gate el compta) |
| `TranslationsSection.jsx` | ? | Revisar |

**Correcció sistemàtica:**

1. **Estils legítims (variables CSS dinàmiques)** → mantenir, però marcar amb `data-sdp-dinamic` perquè el gate els exempte.
2. **Estils estàtics** → moure a CSS.
3. **Estils de posicionament d'1 línia** → `.classe { position: relative; }` al CSS del component.

**Patró de exempció al gate:**

```js
// design_guard.mjs
if (/style\s*=\s*\{\{[^}]*--/.test(m[0])) continue; // variable CSS dinàmica
if (/style\s*=\s*\{\{[^}]*data-sdp-dinamic/.test(text)) continue;
```

---

## B4. Aïllament de plugins — com fer-ho hermètic

### El problema actual

`src/css/index.css` importa tot globalment dins del shadow root. Un sol `<style>` al shadow root, una sola cascada. **Si dos plugins comparteixen `.sdp-root`, comparteixen tokens i selectors.**

### La solució: wrapper per plugin + tokens per wrapper

**Estructura proposada:**

```
src/plugins/
  editor/
    styles.css        → tots els selectors sota .sdp-plugin-editor
    index.jsx         → munta el plugin
  gestoria/
    styles.css        → tots els selectors sota .sdp-plugin-gestoria
    index.jsx
  mur/
    styles.css        → tots els selectors sota .sdp-plugin-mur
    index.jsx
```

**Cada plugin s'injecta amb un wrapper:**

```html
<div class="sdp-plugin sdp-plugin-editor">
  <!-- contingut del plugin -->
</div>
```

**Al CSS base (`src/css/tokens.css`):**

```css
:root, :host {
  /* Capa 0 — constants globals, no canvia mai */
  --sdp-canon-taronja: #FF7300;
  --sdp-canon-blau: #016ebf;
  --sdp-pedra-50: #ffffff;
  /* ... */
  --sdp-touch-min: 44px;
}

.sdp-plugin {
  /* Capa 2 — semàntics. Es re-declaren a cada plugin per aïllar-los. */
  --sdp-fons-app: var(--sdp-pedra-150);
  --sdp-fons-targeta: var(--sdp-pedra-50);
  --sdp-text-titol: var(--sdp-pedra-900);
  --sdp-accio: var(--sdp-secondary-500);
  /* ... */
}

.sdp-plugin[data-theme="dark"] {
  --sdp-fons-app: var(--sdp-pedra-900);
  --sdp-text-titol: var(--sdp-pedra-50);
  /* ... */
}

.sdp-plugin--gestoria {
  /* Overrides específics del plugin */
  --sdp-accio: #1a5276; /* blau comptable */
}
```

**Al CSS del plugin (`src/plugins/editor/styles.css`):**

```css
/* Tots els selectors comencen per .sdp-plugin-editor */
.sdp-plugin-editor .ues-root { ... }
.sdp-plugin-editor .ues-header { ... }
.sdp-plugin-editor .ues-canvas { ... }
.sdp-plugin-editor .sdp-slash-menu { ... }
```

**Al CSS compartit (`src/css/components.css`):**

```css
.sdp-plugin .sdp-boto { ... }
.sdp-plugin .sdp-insignia { ... }
```

### Beneficis

1. **Passar Salfumà:** cada classe `.sdp-plugin-editor .foo` és exclusiva del plugin. Si el plugin mor, la classe mor. Zero zombies.
2. **Swap de plugin:** treure el plugin = treure la seua `styles.css` del `@import`. Zero impacte en altres plugins.
3. **Tema per plugin:** `sdp-plugin--gestoria[data-theme="light"]` sense afectar `sdp-plugin--editor`.
4. **Col·lisió amb Sollutia:** impossible. Cap selector del plugin ix del wrapper.

### Cost

- **Refactor de CSS:** cada `@import` de `src/css/index.css` ha de passar a un plugin concret.
- **Canvi al mount:** cada plugin ha d'injectar el wrapper.
- **Adaptació de tokens:** `:root, :host, .sdp-root` → `:root, :host, .sdp-plugin`.

### El cas del Slash Menu

El Slash Menu s'ha d'injectar **dins** del wrapper del plugin editor:

```js
const target = document.querySelector('.sdp-plugin-editor');
target.appendChild(popup);
```

Així hereva els tokens del plugin i els estils de `.sdp-plugin-editor .sdp-slash-menu`.

### El cas de la Gestoria

La Gestoria existeix en dues formes:

1. **React (`GestoriaSection.jsx`)** — viu dins del plugin.
2. **Standalone (`public/gestoria/index.html`)** — fitxer HTML separat, **ABSENT al bundle**, amb el seu propi `public/assets/pedra-seca.css` (**també absent**).

**Recomanació:** unificar. Si la Gestoria va a `/gestoria`, ha de ser el plugin React. L'standalone ha de desaparèixer o convertir-se en un embed del React.

---

# PART C · Resum Executiu

## Problemes estructurals bloquejants

| # | Problema | Bloqueja |
|---|---|---|
| 1 | `UniversalRichTextToolbar` acoblada a TipTap (A2) | Swap d'editor |
| 2 | Slash Menu renderitza fora del shadow root (A3) | Afegir extensions riques |
| 3 | Classes òrfenes usades al JSX (B2.1, B2.3, B2.4) | Aspecte visual correcte |
| 4 | Tokens fantasma sense declarar (B1) | Contrast i colors |
| 5 | Estils en línia estàtics (B3) | Mida del bundle, manteniment |
| 6 | CSS global sense scope per plugin (B4) | Plugins hermètics |

## Ordre d'execució recomanat

**Fase 1 — Preparar el terreny (1-2 dies):**
1. Verificar runtime React/Preact (A4).
2. Eliminar `editor.view.destroy()` redundant (A1).
3. Moure els estils en línia estàtics a CSS (B3).
4. Resoldre els tokens fantasma declarant-los o substituint-los (B1).
5. Executar `tractor-classes-orfes.mjs` i prioritzar les classes USADES però no definides (B2).

**Fase 2 — Adapter d'editor (2-3 dies):**
6. Crear `richText/EditorAdapter.js` (A2).
7. Refactor de `UniversalRichTextToolbar` per rebre l'adapter.
8. Migrar a `useEditorState` (A5).
9. Configurar el Slash Menu al shadow root (A3).

**Fase 3 — Aïllament de plugins (3-5 dies):**
10. Definir l'estructura `src/plugins/<nom>/`.
11. Refactor de CSS: scope per wrapper (B4).
12. Migrar `sdp-root` → `sdp-plugin-editor` (o equivalent).
13. Migrar els altres plugins (gestoria, mur, etc.).

**Fase 4 — Tancament:**
14. Regenerar baselines de deute.
15. Executar `npm run porta` i verificar que tot passa.
16. Actualitzar el LEDGER.

## El que cal NO fer

- **No afegir el Slash Menu abans de tancar A3.** Si el renderitza fora del shadow root, el menú flotant serà text pla sobre fons blanc, trencant tota la il·lusió.
- **No canviar d'editor abans de tancar A2.** La toolbar sencera s'ha de reescriure; seria un doble esforç.
- **No refactoritzar el CSS per plugins abans de resoldre els fantasmes.** Seria escampar la brutícia en comptes de netejar-la.

---

**Conclusió:** l'arquitectura React és sòlida per a un sol plugin. Per a múltiples plugins hermètics (editor + gestoria + mur + mercat), falten dues peces: **l'adapter d'editor** i **el wrapper de plugin amb scope CSS**. Amb eixes dues peces, el swap d'editor i l'afegit d'extensions riques són operacions d'un dia.

**Risc si no es fa:** cada mes que passa, l'acoblament a TipTap creix. La migració futura es converteix en setmanes.
