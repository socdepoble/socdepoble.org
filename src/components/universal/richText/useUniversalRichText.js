import { useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import { createDocument } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

/* Gauntlet 261016 (Bloc 3.9; ordre del Mestre: la plantilla «s'esvaeix al
   primer clic o pulsació de tecla») · La llavor del cos (`seedContent`) és
   un text HTML o una llista (la d'ara i la d'abans: el Bloc de Notes en té
   dues). Sense cap text, cap llavor. */
export function llistaDeLlavors(seedContent) {
  return (Array.isArray(seedContent) ? seedContent : [seedContent])
    .filter((llavor) => typeof llavor === 'string' && llavor.trim());
}

/* L'estructura i el text d'un document de ProseMirror, sense atributs: cada
   node amb el seu tipus i el nombre de fills (la forma de l'arbre), i cada
   text amb les seues marques. Dos documents amb la mateixa firma diuen el
   mateix encara que un atribut per defecte canvie. Els paràgrafs buits del
   final no compten: l'extensió de node final de StarterKit (TrailingNode)
   n'afig un quan el document acaba en una llista, i la llavor en porta dues. */
const esParagrafBuit = (node) => node.type.name === 'paragraph' && node.childCount === 0;
function firmaDelDocument(doc) {
  const blocs = [];
  doc.forEach((node) => blocs.push(node));
  while (blocs.length && esParagrafBuit(blocs[blocs.length - 1])) blocs.pop();
  const parts = [`doc/${blocs.length}`];
  const apunta = (node) => {
    parts.push(node.isText
      ? `${node.marks.map((marca) => marca.type.name).join('+')}:${node.text}`
      : `${node.type.name}/${node.childCount}`);
  };
  for (const bloc of blocs) {
    apunta(bloc);
    bloc.descendants(apunta);
  }
  return parts.join('|');
}

/**
 * Cert si el cos de l'editor és EXACTAMENT una de les llavors, comparades
 * amb el mateix esquema de l'editor. Abans es comparava editor.getHTML() amb
 * la cadena de la llavor, i TipTap normalitza l'HTML (lleva els salts de
 * línia entre blocs i afig un paràgraf final després d'una llista): una
 * llavor escrita en diverses línies no casava mai i la plantilla no
 * s'esborrava. Qualsevol canvi de text, d'estructura o de marques ja no és la
 * llavor: mai s'esborra el que la persona ha escrit.
 */
export function esLlavorVerge(editor, llavors) {
  if (!editor || editor.isDestroyed || !llavors?.length) return false;
  const firma = firmaDelDocument(editor.state.doc);
  return llavors.some((llavor) => {
    try {
      return firmaDelDocument(createDocument(llavor, editor.schema)) === firma;
    } catch {
      return false;
    }
  });
}

/* Correcció de la revisió adversarial (261016) · Les llavors de cada editor
   viu (la ref del hook), perquè qui l'ordena des de fora no les haja de
   conéixer. Un WeakMap: un editor destruït no es queda retingut ací. */
const LLAVORS_PER_EDITOR = new WeakMap();

/**
 * Buida el cos, en una transacció PRÒPIA, si encara és la llavor verge de
 * l'editor, i torna true; si no (text propi, una llavor tocada, un editor
 * sense llavor com el del Perfil, o un editor que no ve d'useUniversalRichText),
 * no fa res i torna false.
 *
 * Qui ordena l'editor des de fora del cos amb editor.chain().focus()… (la
 * barra negra, la inserció del canal d'emojis, una targeta triada) l'ha de
 * cridar ABANS de construir la cadena. TipTap enfoca dins de la mateixa
 * cadena: a Chrome i Firefox al fotograma següent (l'ordre s'escrivia dins de
 * la plantilla, que ja no s'esvaïa), i a Safari, iOS i Android al moment (el
 * buidatge del primer focus deixava desfasada la transacció de la cadena,
 * que petava amb un RangeError i l'acció es perdia). Amb el cos ja buit, el
 * focus no torna a despatxar res.
 */
export function buidaLlavorVerge(editor) {
  if (!editor || editor.isDestroyed) return false;
  if (!esLlavorVerge(editor, LLAVORS_PER_EDITOR.get(editor)?.current)) return false;
  return editor.commands.clearContent();
}

export function useUniversalRichText({
  content = '',
  onChange,
  onSave,
  id,
  debounceMs = 800,
  /* FASE 4. Extensions que injecta el host. L'editor base no engreixa
     si ningú les demana. */
  extensions = [],
  seedContent = null
}) {
  const timeoutRef = useRef(null);
  const pendingSaveRef = useRef({ id: null, content: null });
  const currentIdRef = useRef(id);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  /* Bloc 3.9 · Les llavors, per una ref: el focus llig les de l'últim render. */
  const llavors = llistaDeLlavors(seedContent);
  const llavorsRef = useRef(llavors);

  // Sync refs with latest props
  currentIdRef.current = id;
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;
  llavorsRef.current = llavors;

  /* Si l'array arriba nou a cada render, useEditor reconstruïx l'editor
     i perds el cursor a cada tecla. El host ha de memoritzar-lo; ací es
     memoritza la composició per si de cas. */
  const totesLesExtensions = useMemo(
    () => [StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] } }), ...extensions],
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
    /* Correcció de la revisió (261016) · Cada editor nou (també quan es
       refà) apunta a la ref de les llavors: buidaLlavorVerge les hi troba. */
    onBeforeCreate: ({ editor }) => {
      LLAVORS_PER_EDITOR.set(editor, llavorsRef);
    },
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
        class: 'editor-content page-content sdp-text-cos sdp-prose' + (llavors.includes(content) ? ' sdp-text-desactivat' : '')
      },
    },
    /* Bloc 3.9 · El primer focus (un clic, o Tab abans de la primera tecla)
       buida el cos només si encara és la llavor verge (esLlavorVerge, amb el
       document de l'editor i no amb la cadena: TipTap la normalitza). El
       buidatge emet l'actualització: el cos buit es desa i la plantilla no
       torna. Text propi, o una llavor tocada, no s'esborren mai. Les ordres
       que arriben de fora del cos ja l'han buidada abans (buidaLlavorVerge):
       ací no tornen a trobar la llavor. */
    onFocus: ({ editor }) => {
      buidaLlavorVerge(editor);
    },
    /* T47 (ordre del Mestre, 260928) · El cos també desa en perdre el focus,
       com el títol, l'H2 i l'entradilla: un clic a un enllaç abans dels 800 ms
       ja no depén només del buidatge en desmuntar. */
    onBlur: () => flush()
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
    };
  }, [flush]);

  /* Flush when note ID changes or component unmounts.
     T47 (ordre del Mestre, 260928) · En la NETEJA D'UN useLayoutEffect: React 18
     neteja un arbre esborrat de pare a fill, i les netejes de layout (fase de
     mutació) van abans de totes les passives. Així el desat pendent ix quan
     els proveïdors avantpassats (PerfilScope, NotesProvider) encara són vius.
     flush llig de les refs, no del DOM: és segur en esta fase. Ací hi havia un
     segon buidatge en la neteja passiva dels oients de dalt: era redundant. */
  useLayoutEffect(() => () => flush(id), [id, flush]);

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
