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

/* L'estructura, el text i els atributs d'un document de ProseMirror: cada
   node amb el seu tipus, el nombre de fills (la forma de l'arbre) i els seus
   atributs, i cada text amb les seues marques i els atributs de cada marca.
   Gauntlet 261017 (C01, auditoria Codex) · Abans els atributs no comptaven:
   una nota desada amb l'H3 passat a H2, o amb la llista numerada començant
   en 10, era «verge» i el primer focus l'esborrava. Els dos costats es lligen
   amb el MATEIX esquema: una llavor de veres porta els mateixos atributs, i el
   que l'esquema no coneix (class, dir, data-* d'un sanejador) no hi arriba.
   La firma és JSON (sense separadors que un text puga imitar) i els atributs
   hi van ordenats. Els paràgrafs buits del final no compten: l'extensió de
   node final de StarterKit (TrailingNode) n'afig un quan el document acaba en
   una llista, i la llavor en porta dues. */
const esParagrafBuit = (node) => node.type.name === 'paragraph' && node.childCount === 0;
const atributsOrdenats = (attrs) => Object.keys(attrs).sort().map((clau) => [clau, attrs[clau]]);
function firmaDelDocument(doc) {
  const blocs = [];
  doc.forEach((node) => blocs.push(node));
  while (blocs.length && esParagrafBuit(blocs[blocs.length - 1])) blocs.pop();
  const parts = [blocs.length];
  const apunta = (node) => {
    parts.push(node.isText
      ? [node.marks.map((marca) => [marca.type.name, atributsOrdenats(marca.attrs)]), node.text]
      : [node.type.name, node.childCount, atributsOrdenats(node.attrs)]);
  };
  for (const bloc of blocs) {
    apunta(bloc);
    bloc.descendants(apunta);
  }
  return JSON.stringify(parts);
}

/* Cert si `doc` és una de les llavors, llegides amb l'esquema `schema`. */
function casaAmbUnaLlavor(doc, schema, llavors) {
  if (!llavors?.length) return false;
  const firma = firmaDelDocument(doc);
  return llavors.some((llavor) => {
    try {
      return firmaDelDocument(createDocument(llavor, schema)) === firma;
    } catch {
      return false;
    }
  });
}

/**
 * Cert si el cos de l'editor és EXACTAMENT una de les llavors, comparades
 * amb el mateix esquema de l'editor. Abans es comparava editor.getHTML() amb
 * la cadena de la llavor, i TipTap normalitza l'HTML (lleva els salts de
 * línia entre blocs i afig un paràgraf final després d'una llista): una
 * llavor escrita en diverses línies no casava mai i la plantilla no
 * s'esborrava. Qualsevol canvi de text, d'estructura, de marques o
 * d'atributs ja no és la llavor: mai s'esborra el que la persona ha escrit.
 */
export function esLlavorVerge(editor, llavors) {
  if (!editor || editor.isDestroyed) return false;
  return casaAmbUnaLlavor(editor.state.doc, editor.schema, llavors);
}

/* Correcció de la revisió adversarial (261016) · Les llavors de cada editor
   viu (la ref del hook), perquè qui l'ordena des de fora no les haja de
   conéixer. Un WeakMap: un editor destruït no es queda retingut ací. */
const LLAVORS_PER_EDITOR = new WeakMap();

/* Gauntlet 261017 (C01, auditoria Codex: «consumir la condició de verge una
   sola vegada») · L'estat de la llavor de cada editor viu:
     · verge: el cos que s'ha CARREGAT (en crear l'editor o en sincronitzar un
       document de fora) era una llavor verge;
     · consumida: ja hi ha hagut el primer gest (el primer focus del cos, o una
       ordre de fora: la barra, un emoji, una targeta, deixar anar text).
   Només es buida una càrrega verge i no consumida: després, ni un cos que la
   persona torne a escriure igual que la llavor, ni una llavor que torne a
   arribar per la sincronització (la nota preparada ja creada) no s'esborren
   ni tornen a eixir. Un altre document (un altre id) és una càrrega nova. */
const VERGES_PER_EDITOR = new WeakMap();

/**
 * Buida el cos, en una transacció PRÒPIA, si encara és la llavor verge que
 * s'hi va carregar i ningú no l'ha tocada, i torna true; si no (text propi,
 * una llavor tocada, una llavor ja consumida, un editor sense llavor com el
 * del Perfil, o un editor que no ve d'useUniversalRichText), no fa res i
 * torna false. La primera crida consumix la condició de verge: no n'hi ha
 * cap altra.
 *
 * El buidatge no és cap pas de desfer (addToHistory: false): Cmd/Ctrl+Z no
 * torna mai la plantilla. Sí que emet l'actualització: el cos buit es desa.
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
  const estat = VERGES_PER_EDITOR.get(editor);
  if (!estat || estat.consumida) return false;
  estat.consumida = true;
  if (!estat.verge || !esLlavorVerge(editor, LLAVORS_PER_EDITOR.get(editor)?.current)) return false;
  return editor.chain().setMeta('addToHistory', false).clearContent().run();
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

  /* Gauntlet 261017 · Les propietats de la vista, estables: useEditor no les
     torna a aplicar a cada render.
       · La classe del cos. Fora «sdp-text-desactivat»: cap regla de CSS no
         la pintava, i casava la cadena crua de la llavor, no el document.
       · D3: deixar anar text sobre una nota nova (la plantilla verge i el cos
         sense focus). ProseMirror construïa la transacció sobre la plantilla,
         el seu view.focus() la buidava i la transacció desfasada petava
         («Applying a mismatched transaction»): el que s'havia deixat anar es
         perdia. Ara la plantilla s'esvaeix abans (buidaLlavorVerge) i el que
         s'ha deixat anar entra sol al cos buit, com el deixa ProseMirror (sense
         desplaçar la vista). Un moviment intern, un arrossegament sense
         contingut o un cos que ja no és verge seguixen el camí de sempre. */
  const editorRef = useRef(null);
  const editorProps = useMemo(() => ({
    attributes: { class: 'editor-content page-content sdp-text-cos sdp-prose' },
    handleDrop: (view, _event, slice, moved) => {
      const viu = editorRef.current;
      if (moved || !slice?.size || !viu || !buidaLlavorVerge(viu)) return false;
      view.dispatch(view.state.tr.replaceSelection(slice).setMeta('uiEvent', 'drop'));
      view.focus();
      return true;
    }
  }), []);

  const editor = useEditor({
    extensions: totesLesExtensions,
    content: content,
    /* Correcció de la revisió (261016) · Cada editor nou (també quan es
       refà) apunta a la ref de les llavors: buidaLlavorVerge les hi troba. */
    onBeforeCreate: ({ editor }) => {
      editorRef.current = editor;
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
    editorProps,
    /* Bloc 3.9 · El primer focus (un clic, o Tab abans de la primera tecla)
       buida el cos només si encara és la llavor verge (esLlavorVerge, amb el
       document de l'editor i no amb la cadena: TipTap la normalitza). El
       buidatge emet l'actualització: el cos buit es desa i la plantilla no
       torna. Text propi, o una llavor tocada, no s'esborren mai. Les ordres
       que arriben de fora del cos ja l'han buidada abans (buidaLlavorVerge):
       ací no tornen a trobar la llavor. Gauntlet 261017 · El primer focus
       consumix la condició de verge encara que no buide res: un segon focus
       no esborra mai. */
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
     carregar: el desat fantasma. L'objecte d'opcions és obligatori.
     Gauntlet 261017 (D1, C01) · Carregar no és cap pas de desfer
     (addToHistory: false): Cmd/Ctrl+Z no torna el document d'abans ni la
     plantilla. La primera passada d'un editor, o un altre id, és una càrrega:
     sense res a canviar, una transacció buida (sense historial ni desat)
     deixa que el motor hi pose el paràgraf final (TrailingNode) ara i no al
     primer focus, que el desava sense que la persona haguera escrit res. Ací
     es decidix si la càrrega és verge (l'estat de l'editor naix ací: abans,
     buidaLlavorVerge no hi troba res a buidar). Una llavor que arriba després
     del primer gest no es torna a posar. */
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    let estat = VERGES_PER_EDITOR.get(editor);
    const carrega = !estat || estat.id !== id;
    if (!estat) VERGES_PER_EDITOR.set(editor, (estat = {}));
    if (carrega) Object.assign(estat, { id, verge: false, consumida: false });
    try {
      const llavors = llavorsRef.current;
      // Només sincronitzem si no hi ha canvis pendents de l'usuari (dirty state)
      const sincronitza = editor.getHTML() !== content && pendingSaveRef.current.content === null;
      if (sincronitza) {
        const cos = content || '';
        if (estat.consumida && casaAmbUnaLlavor(createDocument(cos, editor.schema), editor.schema, llavors)) return;
        editor.chain().setMeta('addToHistory', false).setContent(cos, { emitUpdate: false }).run();
      } else if (carrega) {
        editor.chain().setMeta('addToHistory', false).setMeta('preventUpdate', true).run();
      }
      if ((sincronitza || carrega) && !estat.consumida) estat.verge = esLlavorVerge(editor, llavors);
    } catch (err) {
      console.warn('[Editor] No s’ha pogut sincronitzar el cos:', err);
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
