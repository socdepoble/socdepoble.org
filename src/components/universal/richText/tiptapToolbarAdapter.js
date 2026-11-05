import { useEffect, useState, useCallback, useMemo } from 'react';
import { TOOLBAR_SCHEMA, ESTAT_BUIT, EXEC_BUIT, mateixEstat } from './toolbarContract.js';
import { buidaLlavorVerge } from './useUniversalRichText.js';

/**
 * L'ÚNIC FITXER DE LA BARRA QUE PARLA TIPTAP.
 *
 * Una fila per format. Substituir de motor és reescriure esta taula.
 */
const TRADUCCIO = Object.freeze({
  subtitol:       { actiu: (e) => e.isActive('heading', { level: 3 }), ordena: (c) => c.toggleHeading({ level: 3 }) },
  /* IDEA-59 / P1-72 (punt 2) · Els nivells del desplegable d'encapçalaments
     (StarterKit ja els admet: useUniversalRichText, levels [2..6]). */
  h4:             { actiu: (e) => e.isActive('heading', { level: 4 }), ordena: (c) => c.toggleHeading({ level: 4 }) },
  h5:             { actiu: (e) => e.isActive('heading', { level: 5 }), ordena: (c) => c.toggleHeading({ level: 5 }) },
  h6:             { actiu: (e) => e.isActive('heading', { level: 6 }), ordena: (c) => c.toggleHeading({ level: 6 }) },
  titol:          { actiu: (e) => e.isActive('heading', { level: 2 }), ordena: (c) => c.toggleHeading({ level: 2 }) },
  llista:         { actiu: (e) => e.isActive('bulletList'),            ordena: (c) => c.toggleBulletList() },
  llistaNumerada: { actiu: (e) => e.isActive('orderedList'),           ordena: (c) => c.toggleOrderedList() },
  negreta:        { actiu: (e) => e.isActive('bold'),                  ordena: (c) => c.toggleBold() },
  cursiva:        { actiu: (e) => e.isActive('italic'),                ordena: (c) => c.toggleItalic() },
  ratllat:        { actiu: (e) => e.isActive('strike'),                ordena: (c) => c.toggleStrike() },
  citacio:        { actiu: (e) => e.isActive('blockquote'),            ordena: (c) => c.toggleBlockquote() },
  divisor:        { actiu: () => false,                                ordena: (c) => c.setHorizontalRule() },
  /* O4-CLAUDE-2 · La subtargeta (extensions/subtargeta.js): inserix la caixa
     de mostra amb els textos de l'extensió (els traduïts que li passa
     DocumentEditor). Dins de can() no toca res (la guarda de dispatch és de
     la comanda). */
  subtargeta:     { actiu: (e) => e.isActive('sdpSubtargeta'),           ordena: (c) => c.inserirSubtargeta() },
  /* T7 · Obri el selector del consumidor. Sense l'extensió de targetes la
     comanda no existix i el try/catch de llegeixEstat la deixa apagada; amb
     ella, dins de can() no obri res (la guarda de dispatch és de la comanda). */
  targeta:        { actiu: (e) => e.isActive('sdpTargeta'),             ordena: (c) => c.obreSelectorDeTargeta() },
  /* T26-01 (Gauntlet O7 · T2.6) · Enllaç → Card d'1 clic: l'enllaç intern
     sota el cursor passa a Card. Fora d'un enllaç que es pot commutar, o
     sense l'extensió, can() torna fals i la barra no pinta el botó. */
  enllacATargeta: { actiu: () => false,                                ordena: (c) => c.convertirEnllacEnTargeta() },
  /* B3-2 (Onada R6 · Bloc 3) · L'enllaç de la imatge triada: actiu si ja en
     té; només es pot amb un NodeSelection del node `image` (updateAttributes
     tornaria true sense cap imatge). Sense valor (el can() de llegeixEstat)
     es prova el lleva; un valor sense href de text (un clic) no fa res.
     D-B4-2 (Bloc 4) · `llig` dona l'enllaç actual al diàleg de la barra. */
  enllacImatge:   { actiu: (e) => Boolean(imatgeTriada(e.state)?.attrs?.href), ordena: ordenaEnllacImatge, llig: (e) => enllacDeLaImatge(e.state) }
});

/** El node d'imatge triat (NodeSelection), o null. */
function imatgeTriada(state) {
  const node = state?.selection?.node;
  return node?.type?.name === 'image' ? node : null;
}

/** D-B4-2 · L'enllaç de la imatge triada ({ href, target }, textos o null), o null. */
function enllacDeLaImatge(state) {
  const attrs = imatgeTriada(state)?.attrs;
  if (!attrs) return null;
  const text = (valor) => (typeof valor === 'string' ? valor : null);
  return { href: text(attrs.href), target: text(attrs.target) };
}

function ordenaEnllacImatge(c, opcions = { href: '' }) {
  const href = opcions?.href;
  if (typeof href !== 'string') return c.command(() => false);
  return c
    .command(({ state }) => Boolean(imatgeTriada(state)))
    .enllacaImatge({ href, target: opcions.target ?? null, rel: opcions.rel ?? null });
}

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

/** Execució pura: editor + id neutre → ordre de TipTap.
 *  Correcció de la revisió (261016) · Un botó de la barra és el primer clic
 *  en una nota nova: la plantilla verge s'esvaeix abans de l'ordre, en una
 *  transacció pròpia (buidaLlavorVerge). Sense, a Chrome el format queia
 *  dins de la plantilla, i a Safari la cadena petava (RangeError) i el botó
 *  no feia res. Un editor sense llavor, o ja escrit, no canvia. */
export function executa(editor, id, valor) {
  const fila = TRADUCCIO[id];
  if (!fila || !editor || editor.isDestroyed) return false;
  /* D-B4-2 (Onada R6, Bloc 4) · La barra és muda (no veu l'editor): per a
     omplir el diàleg «Enllaç de la imatge» amb l'adreça actual, la ranura
     accepta { llig(valor) }. Només llig: cap ordre, cap focus, cap transacció
     (ni la llavor verge). Una fila sense `llig` no respon. */
  if (valor && typeof valor.llig === 'function') {
    if (typeof fila.llig !== 'function') return false;
    try {
      valor.llig(fila.llig(editor));
      return true;
    } catch {
      return false;
    }
  }
  try {
    buidaLlavorVerge(editor);
    /* B3-2 · `valor` només el llig la fila que en porta (enllacImatge). */
    return Boolean((valor === undefined ? fila.ordena(editor.chain().focus()) : fila.ordena(editor.chain().focus(), valor)).run());
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

  const exec = useCallback((id, valor) => executa(editor, id, valor), [editor]);

  return useMemo(
    () => ({ state, exec: editor ? exec : EXEC_BUIT }),
    [state, exec, editor]
  );
}
