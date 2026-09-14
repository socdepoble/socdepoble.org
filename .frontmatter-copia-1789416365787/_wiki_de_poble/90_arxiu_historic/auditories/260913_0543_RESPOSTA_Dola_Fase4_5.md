# 🛡️ RESPOSTA DE DOLA: FASE 4.5 — PATRÓ ADAPTER

Dola: Primer llegiré l'estat actual del sistema que adjuntes per conèixer exactament com està implementat avui la `UniversalRichTextToolbar` i el `useUniversalRichText`. [...] Perfecte. Ara tinc tota la radiografia completa del sistema. Ja puc dissenyar la solució del patró Adapter. Aquí tens la proposta exacta, fitxer a fitxer:

---

## 🏗️ SOLUCIÓ: Patró Adapter per a la Toolbar

### Visió general

```
┌─────────────────────────┐         ┌──────────────────────────┐         ┌──────────────────┐
│ UniversalRichTextToolbar │ ──────► │ RichTextCommandApi       │ ──────► │ useTipTapAdapter │
│  (UI pura, agnóstica)    │         │  (contracte neutre)      │         │  (traductor)     │
└─────────────────────────┘         └──────────────────────────┘         └────────┬─────────┘
                                                                                   │
                                                                                   ▼
                                                                          ┌──────────────────┐
                                                                          │ TipTap editor    │
                                                                          │ (useUniversalRichText)
                                                                          └──────────────────┘
```

---

### 📄 Fitxer 1: `src/components/universal/richText/useTipTapCommandApi.js` (NOU — l'adapter)

Aquest hook **és l'adapter**. Implementa el contracte neutre traduint cada crida a l'API específica de TipTap.

```jsx
/**
 * Contracte neutre RichTextCommandApi:
 * {
 *   isActive: (markOrNode, attrs?) => boolean
 *   toggleBold:   () => void
 *   toggleItalic: () => void
 *   toggleStrike: () => void
 *   toggleHeading: (level) => void
 *   toggleBulletList: () => void
 *   focus: () => void  // per si cal, no exposat a la UI actual
 * }
 *
 * La toolbar NUNEA veurà TipTap. Només consumeix eixe contracte.
 */
export function useTipTapCommandApi(editor) {
  if (!editor) return null;

  return {
    // ——————————————————————————————————————————————
    // Consulta d'estat neutra
    // ——————————————————————————————————————————————
    isActive: (name, attrs) => editor.isActive(name, attrs),

    // ——————————————————————————————————————————————
    // Accions neutres (cap menció a chain/focus/run)
    // ——————————————————————————————————————————————
    toggleBold: () => editor.chain().focus().toggleBold().run(),
    toggleItalic: () => editor.chain().focus().toggleItalic().run(),
    toggleStrike: () => editor.chain().focus().toggleStrike().run(),
    toggleHeading: (level = 2) => editor.chain().focus().toggleHeading({ level }).run(),
    toggleBulletList: () => editor.chain().focus().toggleBulletList().run(),
  };
}
```

> 💡 Si demà passem a ProseMirror / Quill / Lexical, només cal escriure un `useProseMirrorCommandApi.js` que implemente el MATEIX contracte. La toolbar no canvia ni una línia.

---

### 📄 Fitxer 2: `src/components/universal/richText/UniversalRichTextToolbar.jsx` (REFACTORITZADA)

Ara és **component pur i visual**. No sap res de TipTap, no sap res de `chain()`, `focus()`, `run()`. Només coneix el contracte neutre que rep per `commandApi`.

```jsx
import UniversalToolbar from '../UniversalToolbar';

/**
 * @param {Object} props
 * @param {import('./useTipTapCommandApi').RichTextCommandApi} props.commandApi
 *   Contracte neutre d'accions. Si null, la toolbar es renderitza desactivada.
 * @param {Function} props.onPublish
 * @param {boolean}  props.publishDisabled
 * @param {boolean}  props.isPublished
 * @param {Function} props.t
 */
export function UniversalRichTextToolbar({
  commandApi,
  onPublish,
  publishDisabled,
  isPublished,
  t = (key, def) => def,
}) {
  // ——————————————————————————————————————————————
  // TOTA la lògica usa el contracte neutre.
  // Cap menció a TipTap en aquest fitxer.
  // ——————————————————————————————————————————————
  const formatState = commandApi
    ? {
        isHeading: commandApi.isActive('heading', { level: 2 }),
        isList: commandApi.isActive('bulletList'),
        isBold: commandApi.isActive('bold'),
        isItalic: commandApi.isActive('italic'),
        isStrike: commandApi.isActive('strike'),
      }
    : {};

  const formatActions = commandApi
    ? {
        toggleHeading: () => commandApi.toggleHeading(2),
        toggleList: () => commandApi.toggleBulletList(),
        toggleBold: () => commandApi.toggleBold(),
        toggleItalic: () => commandApi.toggleItalic(),
        toggleStrike: () => commandApi.toggleStrike(),
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

### 📄 Fitxer 3: `src/components/universal/richText/index.js` (ACTUALITZAT)

Exportem l'adapter perquè el pugui consumir el host.

```js
export { useUniversalRichText } from './useUniversalRichText';
export { UniversalRichTextToolbar } from './UniversalRichTextToolbar';
export { UniversalRichTextContent } from './UniversalRichTextContent';
export { useTipTapCommandApi } from './useTipTapCommandApi'; // ← nou
```

---

### 📄 Fitxer 4: Punt d'unió — `src/sections/notes/NotesEditor.jsx` (EXEMPLE)

Ací és on s'injecta l'adapter. L'editor TipTap surt del hook, passa per l'adapter, i la toolbar rep l'API neutra.

```jsx
import {
  useUniversalRichText,
  UniversalRichTextToolbar,
  UniversalRichTextContent,
  useTipTapCommandApi, // ← importem l'adapter
} from '../../components/universal/richText';

// …

export default function NotesEditor() {
  // …

  const editor = useUniversalRichText({
    content: activeNote?.content || '',
    id: activeNote?.id,
    extensions,
    // ...
    debounceMs: 800,
  });

  // ——————————————————————————————————————————————
  // PUNT D'UNIÓ: adaptem TipTap → contracte neutre
  // ——————————————————————————————————————————————
  const commandApi = useTipTapCommandApi(editor);

  // …

  const topBar = (
    <UniversalRichTextToolbar
      commandApi={commandApi} // ← JA NO PASSEM editor, PASSEM L'API NEUTRA
      onPublish={() => publishNote(activeNote)}
      publishDisabled={!activeNote}
      isPublished={activeNote?.isPublished}
      t={t}
    />
  );

  // …
}
```
