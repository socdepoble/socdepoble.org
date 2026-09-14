---
tipus: document
estat: esborrany
description: 🛡️ RESPOSTA FINAL DE CLAUDE (AMB CODI COMPLET) — FASE 4.5
---
# 🛡️ RESPOSTA FINAL DE CLAUDE (AMB CODI COMPLET) — FASE 4.5

Claude: Una contradicció a resoldre abans del codi: **`UniversalToolbar` encara espera cinc propietats amb nom propi** (`isBold`, `toggleBold`…). Un esquema iterable i un consumidor de cinc ranures fixes no casen. Com que no puc reescriure el crom de `UniversalToolbar` a cegues sense arriscar deriva visual, l'esquema declara la seua pròpia ranura de llegat i la barra hi projecta. Quan `UniversalToolbar` accepte un array de botons (Fase 5), lleves el camp `slot` i itera directament: l'esquema ja hi és.

---

## 1. `src/components/universal/richText/toolbarContract.js`

```js
/**
 * CONTRACTE NEUTRE DE LA BARRA D'EINES
 *
 * Ací no hi ha ni una crida a cap motor d'edició. Només dades: quins
 * botons existixen, com es diuen i quina acció neutra disparen.
 *
 * Afegir un botó és afegir una fila. Canviar de motor és reescriure
 * l'adaptador i no tocar este fitxer.
 */

export const FORMATS = Object.freeze({
  TITOL: 'titol',
  SUBTITOL: 'subtitol',
  LLISTA: 'llista',
  NEGRETA: 'negreta',
  CURSIVA: 'cursiva',
  RATLLAT: 'ratllat',
  CITACIO: 'citacio',
  DIVISOR: 'divisor'
});

/**
 * L'esquema. `slot` és el pont temporal cap a UniversalToolbar, que encara
 * demana cinc propietats amb nom propi en compte d'una llista. Les files
 * sense `slot` ja viuen al contracte i esperen la Fase 5: existixen a
 * l'adaptador, però encara no tenen on pintar-se.
 */
export const TOOLBAR_SCHEMA = Object.freeze([
  { id: FORMATS.TITOL,    clauI18n: 'editor.format.titol',    etiqueta: 'Títol',    commutable: true,  slot: { estat: 'isHeading', accio: 'toggleHeading' } },
  { id: FORMATS.LLISTA,   clauI18n: 'editor.format.llista',   etiqueta: 'Llista',   commutable: true,  slot: { estat: 'isList',    accio: 'toggleList' } },
  { id: FORMATS.NEGRETA,  clauI18n: 'editor.format.negreta',  etiqueta: 'Negreta',  commutable: true,  slot: { estat: 'isBold',    accio: 'toggleBold' } },
  { id: FORMATS.CURSIVA,  clauI18n: 'editor.format.cursiva',  etiqueta: 'Cursiva',  commutable: true,  slot: { estat: 'isItalic',  accio: 'toggleItalic' } },
  { id: FORMATS.RATLLAT,  clauI18n: 'editor.format.ratllat',  etiqueta: 'Ratllat',  commutable: true,  slot: { estat: 'isStrike',  accio: 'toggleStrike' } },
  { id: FORMATS.SUBTITOL, clauI18n: 'editor.format.subtitol', etiqueta: 'Subtítol', commutable: true,  slot: null },
  { id: FORMATS.CITACIO,  clauI18n: 'editor.format.citacio',  etiqueta: 'Citació',  commutable: true,  slot: null },
  { id: FORMATS.DIVISOR,  clauI18n: 'editor.format.divisor',  etiqueta: 'Divisor',  commutable: false, slot: null }
]);

/** Els botons que UniversalToolbar sap pintar hui. */
export const SCHEMA_VISIBLE = Object.freeze(TOOLBAR_SCHEMA.filter((b) => b.slot));

/**
 * Estat neutre. Dos mapes plans a posta: així la comparació és barata i
 * llegible, sense recórrer arbres.
 */
export const ESTAT_BUIT = Object.freeze({
  disponible: false,
  actiu: Object.freeze({}),
  pot: Object.freeze({})
});

/** Cap motor: l'exec no fa res i no peta. */
export const EXEC_BUIT = () => false;

export function mateixEstat(a, b) {
  if (a === b) return true;
  if (!a || !b || a.disponible !== b.disponible) return false;
  for (const mapa of ['actiu', 'pot']) {
    const x = a[mapa] || {};
    const y = b[mapa] || {};
    const claus = Object.keys(x);
    if (claus.length !== Object.keys(y).length) return false;
    for (const k of claus) if (x[k] !== y[k]) return false;
  }
  return true;
}
```

---

## 2. `src/components/universal/richText/tiptapToolbarAdapter.js`

```js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { TOOLBAR_SCHEMA, ESTAT_BUIT, EXEC_BUIT, mateixEstat } from './toolbarContract.js';

/**
 * L'ÚNIC FITXER DE LA BARRA QUE PARLA TIPTAP.
 *
 * Una fila per format. Substituir de motor és reescriure esta taula.
 */
const TRADUCCIO = Object.freeze({
  titol:    { actiu: (e) => e.isActive('heading', { level: 2 }), ordena: (c) => c.toggleHeading({ level: 2 }) },
  subtitol: { actiu: (e) => e.isActive('heading', { level: 3 }), ordena: (c) => c.toggleHeading({ level: 3 }) },
  llista:   { actiu: (e) => e.isActive('bulletList'),            ordena: (c) => c.toggleBulletList() },
  negreta:  { actiu: (e) => e.isActive('bold'),                  ordena: (c) => c.toggleBold() },
  cursiva:  { actiu: (e) => e.isActive('italic'),                ordena: (c) => c.toggleItalic() },
  ratllat:  { actiu: (e) => e.isActive('strike'),                ordena: (c) => c.toggleStrike() },
  citacio:  { actiu: (e) => e.isActive('blockquote'),            ordena: (c) => c.toggleBlockquote() },
  divisor:  { actiu: () => false,                                ordena: (c) => c.setHorizontalRule() }
});

/**
 * Traducció pura: editor → estat neutre. Sense hooks, sense efectes.
 * Es pot provar amb un editor de mentira i sense muntar res.
 */
export function llegeixEstat(editor) {
  if (!editor || editor.isDestroyed) return ESTAT_BUIT;

  const actiu = {};
  const pot = {};

  for (const boto of TOOLBAR_SCHEMA) {
    const fila = TRADUCCIO[boto.id];
    if (!fila) continue;
    try {
      actiu[boto.id] = Boolean(fila.actiu(editor));
      /* `can()` no muta res. Un format que l'StarterKit no porta no és
         un error: és un botó que ha d'eixir apagat. */
      pot[boto.id] = Boolean(fila.ordena(editor.can().chain().focus()).run());
    } catch {
      actiu[boto.id] = false;
      pot[boto.id] = false;
    }
  }

  return { disponible: true, actiu, pot };
}

/** Execució pura: editor + id neutre → ordre de TipTap. */
export function executa(editor, id) {
  const fila = TRADUCCIO[id];
  if (!fila || !editor || editor.isDestroyed) return false;
  try {
    return Boolean(fila.ordena(editor.chain().focus()).run());
  } catch {
    return false;
  }
}

/**
 * Hook reactiu.
 *
 * PER QUÈ SE SUBSCRIU I NO LLIG EN CADA RENDER: `useEditor` repinta el
 * host sencer a cada transacció, i el host de Notes és tot l'editor. Ací
 * el senyal es queda tancat en un estat propi i `mateixEstat` talla el
 * repintat quan el cursor s'ha mogut però el format no ha canviat, que
 * és el 95% de les pulsacions.
 *
 * `useState` i no `useSyncExternalStore`: el projecte compila amb Preact,
 * i no puc verificar ací el suport d'eixe hook al preset. Este camí
 * funciona als dos.
 *
 * `selectionUpdate` a més de `transaction`: moure el cursor amb les
 * fletxes no genera transacció de document, i sense això la barra es
 * queda mostrant el format del paràgraf anterior.
 */
export function useTipTapToolbarAdapter(editor) {
  const [state, setState] = useState(() => llegeixEstat(editor));

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      setState((previ) => (previ.disponible ? ESTAT_BUIT : previ));
      return undefined;
    }

    const rellig = () => {
      const nou = llegeixEstat(editor);
      setState((previ) => (mateixEstat(previ, nou) ? previ : nou));
    };

    rellig();
    editor.on('transaction', rellig);
    editor.on('selectionUpdate', rellig);
    editor.on('focus', rellig);
    editor.on('blur', rellig);

    return () => {
      /* `off` amb la mateixa referència: sense això, cada canvi de nota
         deixa un oient viu apuntant a un editor mort. */
      editor.off('transaction', rellig);
      editor.off('selectionUpdate', rellig);
      editor.off('focus', rellig);
      editor.off('blur', rellig);
    };
  }, [editor]);

  const exec = useCallback((id) => executa(editor, id), [editor]);

  return useMemo(
    () => ({ state, exec: editor ? exec : EXEC_BUIT }),
    [state, exec, editor]
  );
}
```

---

## 3. `src/components/universal/richText/UniversalRichTextToolbar.jsx`

```jsx
import UniversalToolbar from '../UniversalToolbar';
import { SCHEMA_VISIBLE, ESTAT_BUIT, EXEC_BUIT } from './toolbarContract.js';

/**
 * Barra muda. No rep `editor`, no importa cap motor, no fa cap crida
 * d'edició. Rep dades (`state`) i una porta (`exec`), i itera l'esquema.
 *
 * La projecció cap a les cinc ranures de UniversalToolbar és mecànica i
 * la declara l'esquema (`slot`), no este component: quan UniversalToolbar
 * accepte una llista de botons, este bucle es queda igual i el `slot`
 * desapareix.
 */
export function UniversalRichTextToolbar({
  state = ESTAT_BUIT,
  exec = EXEC_BUIT,
  onPublish,
  publishDisabled,
  isPublished,
  t = (key, def) => def
}) {
  const formatState = {};
  const formatActions = {};

  for (const boto of SCHEMA_VISIBLE) {
    formatState[boto.slot.estat] = Boolean(state.actiu?.[boto.id]);
    if (state.disponible && state.pot?.[boto.id]) {
      formatActions[boto.slot.accio] = () => exec(boto.id);
    }
  }

  return (
    <UniversalToolbar
      onPublish={onPublish}
      publishDisabled={publishDisabled}
      isPublished={isPublished}
      formatState={formatState}
      formatActions={formatActions}
      t={t}
    />
  );
}
```

---

## 4. `src/components/universal/richText/index.js`

```js
export { useUniversalRichText } from './useUniversalRichText';
export { UniversalRichTextToolbar } from './UniversalRichTextToolbar';
export { UniversalRichTextContent } from './UniversalRichTextContent';
export { FORMATS, TOOLBAR_SCHEMA, SCHEMA_VISIBLE, ESTAT_BUIT, EXEC_BUIT } from './toolbarContract.js';
export { useTipTapToolbarAdapter, llegeixEstat, executa } from './tiptapToolbarAdapter.js';
```

---

## 5. `src/sections/notes/NotesEditor.jsx` — la costura

Import:

```jsx
import { useUniversalRichText, useTipTapToolbarAdapter, UniversalRichTextToolbar, UniversalRichTextContent } from '../../components/universal/richText';
```

Just davall del `useUniversalRichText`, i **abans** del `if (!activeNote)` — un hook darrere d'un retorn primerenc trenca l'ordre de hooks:

```jsx
  /* El host sap quin motor gasta. La barra, no. */
  const { state, exec } = useTipTapToolbarAdapter(editor);
```

I la barra:

```jsx
  const topBar = (
    <UniversalRichTextToolbar 
      state={state}
      exec={exec}
      onPublish={() => publishNote(activeNote)}
      publishDisabled={!activeNote}
      isPublished={activeNote?.isPublished}
      t={t}
    />
  );
```

---

### Comprovació

```bash
grep -rln "tiptap\|editor\." src/components/universal/richText/UniversalRichTextToolbar.jsx src/components/universal/richText/toolbarContract.js
```

Ha de tornar buit. Si un dia torna alguna cosa, A2 ha recaigut.

**Optimització opcional, quan ho hages provat:** ara que l'adaptador se subscriu pel seu compte, pots afegir `shouldRerenderOnTransaction: false` a `useEditor` dins de `useUniversalRichText`. Estalvia un repintat del host sencer a cada tecla. No ho actives el mateix dia que fusiones açò: si alguna cosa més del host depenia d'eixe repintat, voldràs saber quin dels dos canvis l'ha trencada.
