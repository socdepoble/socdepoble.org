---
tipus: document
estat: esborrany
description: "🛡️ RESPOSTA DE GEMINI FLASH: FASE 4.5 — PATRÓ ADAPTER"
---
# 🛡️ RESPOSTA DE GEMINI FLASH: FASE 4.5 — PATRÓ ADAPTER

Gemini Flash: El patró **Adapter** desacobla la interfície d'usuari (`UniversalRichTextToolbar`) del motor d'edició subjacent (TipTap), fent realitat la promesa de la Caixa Única: la barra d'eines passa a ser un component purament visual que només parla un contracte neutre.

---

### 1. El Contracte Neutre de Text Enriquit (`RichTextAdapter`)

El contracte defineix una superfície d'accions i consultes d'estat independents del motor:

```typescript
/**
 * Contracte Neutre: RichTextAdapter
 *
 * Consultes d'estat:
 * - isActive(format: 'bold'|'italic'|'strike'|'heading'|'list', options?: object): boolean
 *
 * Accions de formatació:
 * - toggleBold(): void
 * - toggleItalic(): void
 * - toggleStrike(): void
 * - toggleHeading(options?: { level?: number }): void
 * - toggleList(): void
 */

```

---

### 2. L'Adapter: `src/components/universal/richText/tiptapAdapter.js`

Aquest fitxer tradueix les instruccions del contracte neutre a les crides de l'API de TipTap (`editor.chain().focus()`, `bulletList`, etc.).

```javascript
import { useMemo } from 'react';

/**
 * Tradueix una instància d'editor TipTap al contracte neutre RichTextAdapter.
 *
 * @param {import('@tiptap/react').Editor|null} editor
 * @returns {object|null}
 */
export function createTipTapAdapter(editor) {
  if (!editor) return null;

  return {
    isActive(format, options = {}) {
      if (format === 'list') {
        return editor.isActive('bulletList') || editor.isActive('orderedList');
      }
      return editor.isActive(format, options);
    },
    toggleBold() {
      editor.chain().focus().toggleBold().run();
    },
    toggleItalic() {
      editor.chain().focus().toggleItalic().run();
    },
    toggleStrike() {
      editor.chain().focus().toggleStrike().run();
    },
    toggleHeading(options = { level: 2 }) {
      editor.chain().focus().toggleHeading(options).run();
    },
    toggleList() {
      editor.chain().focus().toggleBulletList().run();
    }
  };
}

/**
 * Hook reactiu que encapsula la creació de l'adaptador per a components React.
 *
 * @param {import('@tiptap/react').Editor|null} editor
 * @returns {object|null}
 */
export function useTipTapAdapter(editor) {
  return useMemo(() => createTipTapAdapter(editor), [editor]);
}

```

---

### 3. La Barra d'Eines Pura: `src/components/universal/richText/UniversalRichTextToolbar.jsx`

El component es converteix en una vista 100% muta que desconeix TipTap i només consumeix la prop `adapter`.

```jsx
import UniversalToolbar from '../UniversalToolbar';

/**
 * UniversalRichTextToolbar — Component mut i visual (UI pura).
 * Consumix exclusivament el contracte neutre RichTextAdapter.
 */
export function UniversalRichTextToolbar({ 
  adapter, 
  onPublish, 
  publishDisabled, 
  isPublished, 
  onBack,
  t = (key, def) => def 
}) {
  const formatState = adapter ? {
    isHeading: adapter.isActive('heading', { level: 2 }),
    isList: adapter.isActive('list'),
    isBold: adapter.isActive('bold'),
    isItalic: adapter.isActive('italic'),
    isStrike: adapter.isActive('strike'),
  } : {};

  const formatActions = adapter ? {
    toggleHeading: () => adapter.toggleHeading({ level: 2 }),
    toggleList: () => adapter.toggleList(),
    toggleBold: () => adapter.toggleBold(),
    toggleItalic: () => adapter.toggleItalic(),
    toggleStrike: () => adapter.toggleStrike(),
  } : {};

  return (
    <UniversalToolbar 
      onBack={onBack}
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

### 4. Façana del Mòdul: `src/components/universal/richText/index.js`

Exportem l'adaptador i el hook des del punt d'entrada del paquet `richText`.

```javascript
export { useUniversalRichText } from './useUniversalRichText';
export { UniversalRichTextToolbar } from './UniversalRichTextToolbar';
export { UniversalRichTextContent } from './UniversalRichTextContent';
export { createTipTapAdapter, useTipTapAdapter } from './tiptapAdapter';

```

---

### 5. Punt d'Unió i Injecció: `src/sections/notes/NotesEditor.jsx`

`NotesEditor` obté l'editor concret, el passa per `useTipTapAdapter` i injecta l'adaptador resultant a `UniversalRichTextToolbar`.

```jsx
import { FileText } from 'lucide-react';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { useManager } from '../../components/universal/manager/ManagerContext';
import { UniversalEditorShell } from '../../components/universal/UniversalEditorShell';
import { 
  useUniversalRichText, 
  UniversalRichTextToolbar, 
  UniversalRichTextContent,
  useTipTapAdapter 
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

  const adapter = useTipTapAdapter(editor);

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
      adapter={adapter}
      onPublish={() => publishNote(activeNote)}
      publishDisabled={!activeNote}
      isPublished={activeNote?.isPublished}
      t={t}
    />
  );

  return (
    <PageFrame
      chrome="none"
      variant="embed"
      layout="editor"
    >
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

### Garanties Arquitectòniques Assolides

* **Agnosticisme absolut:** Si en el futur es canvia TipTap per Lexical o ProseMirror pur, només caldrà crear un `lexicalAdapter.js` que complisca el mateix contracte `isActive()` / `toggle*()`. La interfície visual `UniversalRichTextToolbar` no requerirà cap canvi.
* **Component pur i testable:** `UniversalRichTextToolbar` es pot testejar aïlladament passant-li un simple mock de l'adaptador en Javascript pla (`{ isActive: () => true, toggleBold: vi.fn() }`), sense necessitat de muntar instàncies de TipTap ni simular el DOM de ProseMirror.
* **Manteniment del contracte de la Caixa Única:** La responsabilitat de cada peça queda delimitada estrictament segons els principis de Pedra Seca.
