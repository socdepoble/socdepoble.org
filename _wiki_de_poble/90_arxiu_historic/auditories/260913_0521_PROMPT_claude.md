---
tipus: document
estat: esborrany
description: "🛡️ PETORRETA AL CONSELL: FASE 4.5 — FORTIFICACIÓ ATÒMICA DE LA TOOLBAR"
---
# 🛡️ PETORRETA AL CONSELL: FASE 4.5 — FORTIFICACIÓ ATÒMICA DE LA TOOLBAR

Mestre Claude, l'aplicació del teu codi per a Supabase i TipTap de la Fase 4 ha estat un èxit. La pujada d'imatges via Storage i el menú Slash ja conviuen perfectament respectant el contracte de la Caixa Única. T'agraïm l'esforç.

*Nota:* Atès que ja tens el bundle `260913_0420_BUNDLE_auditoria.md` en memòria, **no et passe un bundle sencer nou per no ofegar els teus tokens (et queda un 12%)**. En el seu lloc, t'adjunte ací mateix el codi dels únics 3 fitxers que han canviat i que estan implicats en aquesta última tasca. La resta de l'arquitectura de la Fase 3 segueix exactament igual.

## El Repte: Agnòsticisme a la Barra d'Eines

Tal com va apuntar l'auditoria prèvia, tenim un deute tècnic pendent (el punt **A2** de l'auditoria de Deepseek):
L'`UniversalRichTextToolbar` ara mateix està estretament acoblada a l'API de TipTap. Als seus botons executa directament cadenes com `editor.chain().focus().toggleBold().run()`.

Açò trenca la promesa d'agnosticisme de la "Caixa Única". Si demà passat l'Associació haguera de canviar TipTap per ProseMirror pur, Quill o Lexical, hauríem de reescriure la UI de la barra d'eines.

## La Petició

Dissenya una solució basada en el patró **Adapter** per a la barra d'eines:
1. Defineix una interfície/contracte neutra per a les accions de text enriquit (ex: `toggleBold()`, `isActive('bold')`).
2. Converteix `UniversalRichTextToolbar` en un component totalment mut i visual (UI pura), que només consumisca eixe contracte neutre sense saber res de TipTap.
3. Proposa la capa intermèdia (un adapter o un hook) que traduïsca les instruccions d'aquest contracte a les crides de l'`editor` específic de TipTap que ens proporciona `useUniversalRichText`.

Aporta el codi exacte dels fitxers que caldria refactoritzar (com a mínim `UniversalRichTextToolbar.jsx`, l'adapter, i el punt d'unió a on s'injecta) de la forma més escarida i elegant possible, seguint l'estil de components purs.

Esgotem este context deixant la casa perfecta. Endavant!

---

## 📄 FITXERS ACTUALITZATS (Context Reduït)

### `src/components/universal/richText/UniversalRichTextToolbar.jsx`
```jsx
import UniversalToolbar from '../UniversalToolbar';

export function UniversalRichTextToolbar({ 
  editor, 
  onPublish, 
  publishDisabled, 
  isPublished, 
  t = (key, def) => def 
}) {
  const formatState = {
    isHeading: editor?.isActive('heading', { level: 2 }),
    isList: editor?.isActive('bulletList'),
    isBold: editor?.isActive('bold'),
    isItalic: editor?.isActive('italic'),
    isStrike: editor?.isActive('strike'),
  };

  const formatActions = editor ? {
    toggleHeading: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    toggleList: () => editor.chain().focus().toggleBulletList().run(),
    toggleBold: () => editor.chain().focus().toggleBold().run(),
    toggleItalic: () => editor.chain().focus().toggleItalic().run(),
    toggleStrike: () => editor.chain().focus().toggleStrike().run(),
  } : {};

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

### `src/sections/notes/NotesEditor.jsx`
```jsx
import { FileText } from 'lucide-react';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { useManager } from '../../components/universal/manager/ManagerContext';
import { UniversalEditorShell } from '../../components/universal/UniversalEditorShell';
import { useUniversalRichText, UniversalRichTextToolbar, UniversalRichTextContent } from '../../components/universal/richText';
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
      editor={editor}
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

### `src/components/universal/richText/useUniversalRichText.js`
```javascript
import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function useUniversalRichText({
  content = '',
  onChange,
  onSave,
  id,
  debounceMs = 800,
  /* FASE 4. Extensions que injecta el host. L'editor base no engreixa
     si ningú les demana. */
  extensions = []
}) {
  const timeoutRef = useRef(null);
  const pendingSaveRef = useRef({ id: null, content: null });
  const currentIdRef = useRef(id);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);

  // Sync refs with latest props
  currentIdRef.current = id;
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  /* Si l'array arriba nou a cada render, useEditor reconstruïx l'editor
     i perds el cursor a cada tecla. El host ha de memoritzar-lo; ací es
     memoritza la composició per si de cas. */
  const totesLesExtensions = useMemo(
    () => [StarterKit.configure({ heading: { levels: [2, 3, 4] } }), ...extensions],
    [extensions]
  );

  // The flush function reads from the draft, never from the editor, 
  // preventing empty-string overwrites if the editor is already destroyed.
  const flush = useCallback((expectedId) => {
    const pending = pendingSaveRef.current;
    if (pending.content === null) return;
    if (expectedId !== undefined && pending.id !== expectedId) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    pendingSaveRef.current = { id: null, content: null };
    
    if (pending.id != null) {
      onSaveRef.current?.(pending.content, pending.id);
    }
  }, []);

  const editor = useEditor({
    extensions: totesLesExtensions,
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const currentId = currentIdRef.current;
      pendingSaveRef.current = { id: currentId, content: html };
      
      onChangeRef.current?.(html, currentId);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => flush(currentId), debounceMs);
    },
    editorProps: {
      attributes: {
        class: 'editor-content page-content sdp-text-cos sdp-prose'
      },
    },
  });

  /* Sync incoming content changes (e.g. when changing notes).
     TipTap 3 va llevar el segon argument posicional `emitUpdate`. Amb
     `setContent(html, false)` la supressió s'ignora, l'onUpdate dispara
     i cada canvi de nota programa un desat del contingut que acabes de
     carregar: el desat fantasma. L'objecte d'opcions és obligatori. */
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    try {
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content || '', { emitUpdate: false });
      }
    } catch (err) {
      console.warn('Editor sync skipped', err);
    }
  }, [content, editor, id]);

  // Global exit hooks (pagehide, visibilitychange)
  useEffect(() => {
    const flushSave = () => flush();
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };

    window.addEventListener('pagehide', flushSave);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('pagehide', flushSave);
      document.removeEventListener('visibilitychange', flushWhenHidden);
      flushSave();
    };
  }, [flush]);

  // Flush when note ID changes or component unmounts
  useEffect(() => {
    return () => flush(id);
  }, [id, flush]);

  /* LLEVAT A POSTA (Fase 4). Ací hi havia un `editor.view.destroy()` de
     neteja. `useEditor` ja destruïx l'editor en desmuntar, i això destruïx
     la vista: era una doble destrucció. Amb l'StarterKit pelat no es notava;
     amb node views (imatges, embeds) trenca la desconstrucció dels nodes. */

  return editor;
}

```
