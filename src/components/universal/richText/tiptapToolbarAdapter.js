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
  divisor:  { actiu: () => false,                                ordena: (c) => c.setHorizontalRule() },
  /* T7 · Obri el selector del consumidor. Sense l'extensió de targetes la
     comanda no existix i el try/catch de llegeixEstat la deixa apagada; amb
     ella, dins de can() no obri res (la guarda de dispatch és de la comanda). */
  targeta:  { actiu: (e) => e.isActive('sdpTargeta'),             ordena: (c) => c.obreSelectorDeTargeta() }
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
