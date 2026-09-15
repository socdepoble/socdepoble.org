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
        // Només sincronitzem si no hi ha canvis pendents de l'usuari (dirty state)
        if (pendingSaveRef.current.content === null) {
          editor.commands.setContent(content || '', { emitUpdate: false });
        }
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

  /* La doble destrucció de editor.view.destroy() era the Builder; 
     però editor.destroy() per a the root engine sí que és necessari 
     si ens hem d'assegurar d'alliberar referències a nivell the Node (Z). */
  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    };
  }, [editor]);

  return editor;
}
