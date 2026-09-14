# 🛡️ RESPOSTA DE CLAUDE: FASE 4.5 — PATRÓ ADAPTER

Claude: La clau és que l'adaptador expose **funcions**, no booleans precalculats: si memoritzes l'estat, la barra es congela. Memoritza l'objecte; llig l'estat en cada render.

---

## 1. `src/components/universal/richText/contracteText.js` (nou)

```js
/**
 * CONTRACTE NEUTRE DE TEXT ENRIQUIT
 *
 * L'únic vocabulari que la barra d'eines coneix. Ni "chain", ni "toggleBold",
 * ni "heading level 2": això és API de TipTap i viu a l'adaptador.
 *
 * Un adaptador és qualsevol objecte amb esta forma. Demà pot ser Lexical,
 * ProseMirror pelat o un textarea amb execCommand: la barra no se n'entera.
 *
 *   disponible : boolean            hi ha motor viu darrere?
 *   esActiu(format) → boolean       el cursor està dins d'eixe format?
 *   potFer(format) → boolean        es pot aplicar ací i ara?
 *   commuta(format) → boolean       aplica'l o lleva'l. Torna si ha anat bé.
 *   enfoca() → void                 torna el focus al cos del text.
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
 * Objecte nul. Existix perquè la barra no haja de preguntar mai
 * `if (!editor)`: un component mut no fa branques defensives, consumix
 * el contracte i prou. Sense motor, tot torna false i els botons ixen
 * desactivats sols.
 */
export const ADAPTADOR_BUIT = Object.freeze({
  disponible: false,
  esActiu: () => false,
  potFer: () => false,
  commuta: () => false,
  enfoca: () => {}
});
```

---

## 2. `src/components/universal/richText/adaptadorTipTap.js` (nou)

```js
import { useMemo } from 'react';
import { FORMATS, ADAPTADOR_BUIT } from './contracteText.js';

/**
 * L'ÚNIC FITXER DE LA CAPA DE TEXT QUE PARLA TIPTAP.
 *
 * Una fila per format. Substituir de motor és reescriure esta taula i res
 * més: la barra, els hosts i el contracte es queden com estan.
 */
const TRADUCCIO = Object.freeze({
  [FORMATS.TITOL]: {
    actiu: (e) => e.isActive('heading', { level: 2 }),
    ordena: (c) => c.toggleHeading({ level: 2 })
  },
  [FORMATS.SUBTITOL]: {
    actiu: (e) => e.isActive('heading', { level: 3 }),
    ordena: (c) => c.toggleHeading({ level: 3 })
  },
  [FORMATS.LLISTA]: {
    actiu: (e) => e.isActive('bulletList'),
    ordena: (c) => c.toggleBulletList()
  },
  [FORMATS.NEGRETA]: {
    actiu: (e) => e.isActive('bold'),
    ordena: (c) => c.toggleBold()
  },
  [FORMATS.CURSIVA]: {
    actiu: (e) => e.isActive('italic'),
    ordena: (c) => c.toggleItalic()
  },
  [FORMATS.RATLLAT]: {
    actiu: (e) => e.isActive('strike'),
    ordena: (c) => c.toggleStrike()
  },
  [FORMATS.CITACIO]: {
    actiu: (e) => e.isActive('blockquote'),
    ordena: (c) => c.toggleBlockquote()
  },
  [FORMATS.DIVISOR]: {
    actiu: () => false,
    ordena: (c) => c.setHorizontalRule()
  }
});

/**
 * Embolcalla un editor de TipTap amb el contracte neutre.
 *
 * TOT SÓN FUNCIONS, A POSTA. Si l'adaptador tornara booleans ja calculats,
 * quedarien congelats dins del useMemo i la barra no s'assabentaria de cap
 * moviment del cursor. Ací es memoritza l'OBJECTE; l'estat es llig en el
 * moment de la crida, que és en cada render.
 */
export function creaAdaptadorTipTap(editor) {
  if (!editor || editor.isDestroyed) return ADAPTADOR_BUIT;

  const fila = (format) => TRADUCCIO[format] || null;

  return {
    disponible: true,

    esActiu: (format) => {
      const f = fila(format);
      if (!f || editor.isDestroyed) return false;
      try {
        return Boolean(f.actiu(editor));
      } catch {
        return false;
      }
    },

    potFer: (format) => {
      const f = fila(format);
      if (!f || editor.isDestroyed) return false;
      try {
        return Boolean(f.ordena(editor.can().chain().focus()).run());
      } catch {
        return false;
      }
    },

    commuta: (format) => {
      const f = fila(format);
      if (!f || editor.isDestroyed) return false;
      try {
        return Boolean(f.ordena(editor.chain().focus()).run());
      } catch {
        return false;
      }
    },

    enfoca: () => {
      if (!editor.isDestroyed) editor.chain().focus().run();
    }
  };
}

/**
 * Punt d'unió per als hosts.
 */
export function useAdaptadorTipTap(editor) {
  return useMemo(() => creaAdaptadorTipTap(editor), [editor]);
}
```

---

## 3. `src/components/universal/richText/UniversalRichTextToolbar.jsx` (complet)

```jsx
import UniversalToolbar from '../UniversalToolbar';
import { FORMATS, ADAPTADOR_BUIT } from './contracteText.js';

export function UniversalRichTextToolbar({
  accions = ADAPTADOR_BUIT,
  onPublish,
  publishDisabled,
  isPublished,
  t = (key, def) => def
}) {
  const formatState = {
    isHeading: accions.esActiu(FORMATS.TITOL),
    isList: accions.esActiu(FORMATS.LLISTA),
    isBold: accions.esActiu(FORMATS.NEGRETA),
    isItalic: accions.esActiu(FORMATS.CURSIVA),
    isStrike: accions.esActiu(FORMATS.RATLLAT)
  };

  const formatActions = accions.disponible
    ? {
        toggleHeading: () => accions.commuta(FORMATS.TITOL),
        toggleList: () => accions.commuta(FORMATS.LLISTA),
        toggleBold: () => accions.commuta(FORMATS.NEGRETA),
        toggleItalic: () => accions.commuta(FORMATS.CURSIVA),
        toggleStrike: () => accions.commuta(FORMATS.RATLLAT)
      }
    : {};

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

## 4. `src/components/universal/richText/index.js` (complet)

```js
export { useUniversalRichText } from './useUniversalRichText';
export { UniversalRichTextToolbar } from './UniversalRichTextToolbar';
export { UniversalRichTextContent } from './UniversalRichTextContent';
export { FORMATS, ADAPTADOR_BUIT } from './contracteText.js';
export { creaAdaptadorTipTap, useAdaptadorTipTap } from './adaptadorTipTap.js';
```

---

## 5. `src/sections/notes/NotesEditor.jsx` — punt d'unió

```jsx
import { useUniversalRichText, useAdaptadorTipTap, UniversalRichTextToolbar, UniversalRichTextContent } from '../../components/universal/richText';

// ...
  const accions = useAdaptadorTipTap(editor);

  const topBar = (
    <UniversalRichTextToolbar 
      accions={accions}
      onPublish={() => publishNote(activeNote)}
      publishDisabled={!activeNote}
      isPublished={activeNote?.isPublished}
      t={t}
    />
  );
// ...
```
