# 🛡️ RESPOSTA DE GROK: FASE 4.5 — PATRÓ ADAPTER

Grok: Solució Adapter neta, alineada amb la Caixa Única i amb l’estil de components purs que ja teniu.

## Contracte neutre

```js
// src/components/universal/richText/formatContract.js
/**
 * Contracte agnòstic de format de text enriquit.
 * Cap consumidor UI ha de saber res de TipTap / ProseMirror / Lexical.
 *
 * formatState  → booleans de lectura (reactius al cursor)
 * formatActions → funcions d’escriptura (sense retorn)
 */
export const FORMAT_KEYS = ['heading', 'list', 'bold', 'italic', 'strike'];

/** Forma canònica que consumeix UniversalToolbar / UniversalRichTextToolbar */
export function emptyFormatContract() {
  return {
    formatState: {
      isHeading: false,
      isList: false,
      isBold: false,
      isItalic: false,
      isStrike: false,
    },
    formatActions: {},
  };
}
```

## Adapter TipTap → contracte

```js
// src/components/universal/richText/tipTapFormatAdapter.js
import { emptyFormatContract } from './formatContract.js';

/**
 * Tradueix un editor TipTap al contracte neutre.
 * Únic punt del projecte que coneix `editor.chain()` / `isActive`.
 */
export function createTipTapFormatAdapter(editor) {
  if (!editor || editor.isDestroyed) return emptyFormatContract();

  return {
    formatState: {
      isHeading: editor.isActive('heading', { level: 2 }),
      isList:    editor.isActive('bulletList'),
      isBold:    editor.isActive('bold'),
      isItalic:  editor.isActive('italic'),
      isStrike:  editor.isActive('strike'),
    },
    formatActions: {
      toggleHeading: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      toggleList:    () => editor.chain().focus().toggleBulletList().run(),
      toggleBold:    () => editor.chain().focus().toggleBold().run(),
      toggleItalic:  () => editor.chain().focus().toggleItalic().run(),
      toggleStrike:  () => editor.chain().focus().toggleStrike().run(),
    },
  };
}
```

## Toolbar UI pura (sense TipTap)

```jsx
// src/components/universal/richText/UniversalRichTextToolbar.jsx
import UniversalToolbar from '../UniversalToolbar';
import { emptyFormatContract } from './formatContract.js';

/**
 * UI muda. Només sap del contracte neutre.
 * No importa @tiptap ni reben `editor`.
 */
export function UniversalRichTextToolbar({
  formatState,
  formatActions,
  onPublish,
  publishDisabled,
  isPublished,
  t = (key, def) => def,
}) {
  const contract = {
    formatState: formatState ?? emptyFormatContract().formatState,
    formatActions: formatActions ?? {},
  };

  return (
    <UniversalToolbar
      onPublish={onPublish}
      publishDisabled={publishDisabled}
      isPublished={isPublished}
      formatState={contract.formatState}
      formatActions={contract.formatActions}
      t={t}
    />
  );
}
```

`UniversalToolbar.jsx` **no cal tocar-lo**: ja era pur.

## Punt d’unió (NotesEditor)

```jsx
// fragment rellevant de src/sections/notes/NotesEditor.jsx
import { useUniversalRichText, UniversalRichTextToolbar, UniversalRichTextContent } from '../../components/universal/richText';
import { createTipTapFormatAdapter } from '../../components/universal/richText/tipTapFormatAdapter.js';
// ... resta d’imports igual

export default function NotesEditor() {
  // ... hooks existents ...

  const editor = useUniversalRichText({ /* ... igual que ara ... */ });

  // Adapter: única frontera TipTap → contracte
  const { formatState, formatActions } = createTipTapFormatAdapter(editor);

  const topBar = (
    <UniversalRichTextToolbar
      formatState={formatState}
      formatActions={formatActions}
      onPublish={() => publishNote(activeNote)}
      publishDisabled={!activeNote}
      isPublished={activeNote?.isPublished}
      t={t}
    />
  );

  // ... resta igual (UniversalRichTextContent segueix rebent `editor`
  //     perquè és el surface TipTap; el dia que canviï l’editor,
  //     només cal un Content adapter parallel)
}
```

## Export del mòdul

```js
// src/components/universal/richText/index.js
export { useUniversalRichText } from './useUniversalRichText';
export { UniversalRichTextToolbar } from './UniversalRichTextToolbar';
export { UniversalRichTextContent } from './UniversalRichTextContent';
export { createTipTapFormatAdapter } from './tipTapFormatAdapter.js';
export { emptyFormatContract, FORMAT_KEYS } from './formatContract.js';
```
