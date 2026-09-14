---
tipus: document
estat: esborrany
description: "🛡️ RESPOSTA DE DEEPSEEK: FASE 4.5 — PATRÓ ADAPTER"
---
# 🛡️ RESPOSTA DE DEEPSEEK: FASE 4.5 — PATRÓ ADAPTER

Deepseek: # 🧱 FORTIFICACIÓ ATÒMICA DE LA TOOLBAR — PATRÓ ADAPTER

Honorable Consell, ací teniu la destil·lació. La clau és separar **tres responsabilitats** que ara viuen totes dins de `UniversalRichTextToolbar`:

| Capa | Responsabilitat | Sap de TipTap? |
|---|---|---|
| **Contracte** | Què es pot fer (`isBold`, `toggleBold`…) | ❌ No |
| **Adapter** | Com es fa amb TipTap | ✅ Sí (únic lloc) |
| **UI** | Pintar botons i gestionar estats | ❌ No |

El punt d'unió és **`NotesEditor.jsx`**: l'únic lloc on l'editor i la UI es troben.

---

## 1. L'ADAPTER — `richTextAdapter.js` (NOU)

Aquest és **l'únic fitxer del projecte** que importarà mai res de `@tiptap/*` per a formatar. Si demà es canvia a ProseMirror, Quill o Lexical, es reescriu només aquest.

```js
// src/components/universal/richText/richTextAdapter.js

/**
 * richTextAdapter.js — L'ÚNIC punt on la UI de text enriquit toca TipTap.
 *
 * CONTRACTE NEUTRE (el que consumeix UniversalRichTextToolbar):
 *   {
 *     formatState:   { isHeading, isList, isBold, isItalic, isStrike },
 *     formatActions: { toggleHeading, toggleList, toggleBold, toggleItalic, toggleStrike },
 *   }
 *
 * PER QUÈ NO ES MEMOITZA:
 *   `formatState` depén de la selecció del cursor. Si es memoitzara l'adapter,
 *   `isBold` quedaria congelat en el valor del primer render i el botó no
 *   s'encendria mai en seleccionar text en negreta. Es crea de nou a cada
 *   render; el cost (cinc `isActive` + cinc closures) és negligible.
 */

const ESTAT_BUIT = Object.freeze({
  isHeading: false,
  isList: false,
  isBold: false,
  isItalic: false,
  isStrike: false,
});

export function createRichTextAdapter(editor) {
  if (!editor) {
    return { formatState: ESTAT_BUIT, formatActions: {} };
  }

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

---

## 2. EL HOOK — `useRichTextAdapter.js` (NOU)

Pont React entre l'editor de TipTap i el contracte neutre. No memoitza (vegeu el comentari del fitxer anterior).

```js
// src/components/universal/richText/useRichTextAdapter.js

import { createRichTextAdapter } from './richTextAdapter';

/**
 * Pont React entre l'editor de TipTap i el contracte neutre.
 *
 * NO es memoitza: `formatState` depén de la selecció del cursor i ha de
 * refrescar-se a cada transacció.
 */
export function useRichTextAdapter(editor) {
  return createRichTextAdapter(editor);
}
```

---

## 3. LA UI PURA — `UniversalRichTextToolbar.jsx` (REFACTORITZAT)

Ara és un component mut. **No importa res de TipTap.** Només rep l'adapter i el passa cap avall. Zero lògica de domini.

```jsx
// src/components/universal/richText/UniversalRichTextToolbar.jsx

import UniversalToolbar from '../UniversalToolbar';

/**
 * UniversalRichTextToolbar — UI PURA.
 *
 * No sap res de TipTap ni de cap motor de text enriquit. Consumix el
 * contracte neutre que li passa el punt d'unió (NotesEditor):
 *
 *   adapter = {
 *     formatState:   { isHeading, isList, isBold, isItalic, isStrike },
 *     formatActions: { toggleHeading, toggleList, toggleBold, toggleItalic, toggleStrike },
 *   }
 *
 * Tota la traducció a l'API del motor viu a richTextAdapter.js.
 */
export function UniversalRichTextToolbar({
  adapter,
  onPublish,
  publishDisabled,
  isPublished,
  t = (key, def) => def,
}) {
  const { formatState = {}, formatActions = {} } = adapter ?? {};

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

## 4. LA FAÇANA — `index.js` (ACTUALITZAT)

```js
// src/components/universal/richText/index.js

export { useUniversalRichText } from './useUniversalRichText';
export { useRichTextAdapter } from './useRichTextAdapter';
export { createRichTextAdapter } from './richTextAdapter';
export { UniversalRichTextToolbar } from './UniversalRichTextToolbar';
export { UniversalRichTextContent } from './UniversalRichTextContent';
```

---

## 5. EL PUNT D'UNIÓ — `NotesEditor.jsx` (ACTUALITZAT)

Ací és on es fa la simbiosi. Només canvien **dues línies**: la importació del hook i la creació de l'adapter abans del `topBar`. La resta del fitxer queda intacte.

```jsx
// src/sections/notes/NotesEditor.jsx

import { FileText } from 'lucide-react';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { useManager } from '../../components/universal/manager/ManagerContext';
import { UniversalEditorShell } from '../../components/universal/UniversalEditorShell';
import {
  useUniversalRichText,
  useRichTextAdapter,          // ← NOU
  UniversalRichTextToolbar,
  UniversalRichTextContent
} from '../../components/universal/richText';
import { extensionsRiques } from '../../components/universal/richText/extensions/index.js';
import { uploadToStorage, teCapacitat } from '../../data/backendPort.js';
import { PageFrame } from '../../components/universal/PageFrame';
import { useMemo } from 'react';

export default function NotesEditor() {
  const { saveNoteField, setLocalNoteField, publishNote, noteFolders, t } = useNotes();
  const { activeItem: activeNote } = useManager();

  const extensions = useMemo(() => {
    return extensionsRiques({
      onImageUpload: teCapacitat('mitjans')
        ? async (fitxer) => {
            const res = await uploadToStorage(fitxer, { carpeta: 'notes' });
            return res.url;
          }
        : null
    });
  }, []);

  const editor = useUniversalRichText({
    content: activeNote?.content || '',
    id: activeNote?.id,
    extensions,
    onChange: (html, noteId) => {
      if (noteId) setLocalNoteField(noteId, 'content', html);
    },
    onSave: (html, noteId) => {
      if (noteId) saveNoteField(noteId, 'content', html);
    },
    debounceMs: 800
  });

  // ── PUNT D'UNIÓ ────────────────────────────────────────────────
  // L'únic lloc on l'editor (TipTap) i la UI es troben. Ací es crea
  // l'adapter; el toolbar només rep el contracte neutre.
  const adapter = useRichTextAdapter(editor);

  if (!activeNote) {
    return (
      <section className="editor-shell--main">
        <div className="chat-empty">
          <FileText size={64} />
          <h2 className="section-title">{t('section.notes.open', 'Obre un solc')}</h2>
        </div>
      </section>
    );
  }

  const topBar = (
    <UniversalRichTextToolbar
      adapter={adapter}                              // ← CANVI: era `editor`
      onPublish={() => publishNote(activeNote)}
      publishDisabled={!activeNote}
      isPublished={activeNote?.isPublished}
      t={t}
    />
  );

  return (
    <PageFrame chrome="none" variant="embed" layout="editor">
      <UniversalEditorShell
        key={activeNote.id}
        id={activeNote.id}
        topBar={topBar}
        titleHtml={activeNote.title}
        subtitleHtml={activeNote.subtitle}
        leadHtml={activeNote.lead}
        heroImage={activeNote.heroImage}
        logoImage={activeNote.logoImage}
        isPublished={activeNote.isPublished}
        formattedTime={activeNote.formattedTime}
        formattedDate={activeNote.formattedDate}
        labels={etiquetesDeNota(activeNote, noteFolders, {})}
        onImageUpload={teCapacitat('mitjans') ? async (f) => (await uploadToStorage(f, { carpeta: 'notes' })).url : null}
        onLocalChange={(field, val, noteId) => setLocalNoteField(noteId, field, val)}
        onSaveField={(field, val, noteId) => saveNoteField(noteId, field, val)}
        onToast={(msg, type) => console.log('Toast:', msg, type)}
      >
        <UniversalRichTextContent editor={editor} />
      </UniversalEditorShell>
    </PageFrame>
  );
}
```

---

## ✅ PER QUÈ FUNCIONA

| Abans | Després |
|---|---|
| `UniversalRichTextToolbar` importava indirectament `@tiptap/react` | Només rep un objecte pla amb `formatState` i `formatActions` |
| La lògica TipTap (`chain().focus().toggleBold().run()`) vivia dins del component de UI | Viu a `richTextAdapter.js`, l'únic punt de contacte |
| Canviar de motor implicava reescriure la UI | Canviar de motor implicava reescriure **un sol fitxer** |
| `NotesEditor` passava `editor` directament | Passa `adapter` (contracte neutre) |

**La regla d'or que es respecta ara:** *"un component només ha de saber allò que necessita per pintar-se"*. La toolbar només sap que existeixen cinc accions i cinc estats booleans. Res més.

**Llei de l'Enxufabilitat reforçada:** el dia que el Consell decidisca migrar a ProseMirror pur, la UI no es toca. Es reescriu `richTextAdapter.js`, s'adapta el `useUniversalRichText` (que és on viu el `useEditor` de TipTap) i la resta del sistema ni se n'assabenta.

**Zero dependències noves. Zero canvis al `UniversalToolbar`.** El patró Adapter queda encapsulat en un sol fitxer i el contracte és explícit i documentat. La casa queda perfecta, Mestre.
