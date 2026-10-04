/**
 * targetesIncrustades.js — Targetes completes dins del cos del text de
 * l'UniversalEditor (T7, ordre del Mestre, prompt 261004_0515).
 *
 * Dos nodes i una extensió que els agrupa:
 *  · `sdpTargetes`, el grup: un bloc que només conté targetes. Porta
 *    l'alineació (per a la «sola»); la forma (sola, parella, graella) NO és
 *    atribut de l'esquema: es deriva del nombre de fills en serialitzar i,
 *    a l'editor, amb una decoració (un node sense NodeView no es repinta
 *    quan només li canvien els fills).
 *  · `sdpTargeta`, l'àtom: la clau «tipus:id», la ruta i la instantània
 *    (formaDelGrup.js). En edició, un NodeView de React amb la UniversalCard
 *    en previsualització; en l'HTML desat, un div amb data-* i un enllaç de
 *    reserva per a qui no hidrata (impressió, extractes). L'enllaç ja porta
 *    el rel del sanejador: sanitizeHtml(getHTML()) === getHTML().
 *
 * El normalitzador (appendTransaction) fusiona grups germans, i elimina les
 * targetes sense clau (les que ProseMirror crea per a omplir un grup buit) i
 * els grups que es queden sense cap targeta.
 *
 * Les comandes no tenen efectes fora de `dispatch`: la barra (llegeixEstat)
 * les prova dins de can() a cada transacció.
 */
import { Extension, Node, isMacOS, isiOS } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { ReactNodeViewRenderer } from '@tiptap/react';
import TargetaIncrustadaNodeView from './TargetaIncrustadaNodeView.jsx';
import { NOM_EXTENSIO_TARGETES } from './TargetesIncrustadesContext.js';
import {
  ALINEACIONS, ALINEACIO_PER_DEFECTE, CLASSE_AMB_TARGETES, MARCA_GRUP, MARCA_TARGETA, NOM_GRUP, NOM_TARGETA,
  alineacioValida, esTargetaValida, formaDe, netejaAtributs, teAutoriaCompleta
} from './formaDelGrup.js';

/* Cada atribut de la targeta i el seu data-* a l'HTML, en l'ordre en què
   s'escriuen. La clau és la marca mateixa del node. */
const ATRIBUTS = Object.freeze([
  ['clau', MARCA_TARGETA],
  ['ruta', 'data-ruta'],
  ['titol', 'data-titol'],
  ['subtitol', 'data-subtitol'],
  ['entradilla', 'data-entradilla'],
  ['imatge', 'data-imatge'],
  ['autor', 'data-autor'],
  ['autorRuta', 'data-autor-ruta'],
  ['poble', 'data-poble']
]);

/* Arrossegar i deixar anar (drag*, drop), com fa el stopEvent de sèrie de
   TipTap (core/src/NodeView.ts). */
const esDArrossegament = (event) => {
  const tipus = String(event?.type || '');
  return tipus.startsWith('drag') || tipus === 'drop';
};

/**
 * El stopEvent del NodeView: un event d'un botó, un enllaç o un camp de la
 * targeta (el clic, la tecla) és de React, no de l'editor.
 * Revisió del front «editor» (261004) · Arrossegar i deixar anar són de
 * ProseMirror encara que comencen en un enllaç: és ell qui arrossega el node
 * i el mou en deixar-lo anar. Si React se'ls quedara, agafar la targeta per
 * la boina de l'autor arrossegaria l'enllaç solt i la targeta no es mouria.
 */
export const esDeLaTargeta = (event) => !esDArrossegament(event) && Boolean(event?.target?.closest?.('button, a, input'));

export const GrupDeTargetes = Node.create({
  name: NOM_GRUP,
  group: 'block',
  content: `${NOM_TARGETA}+`,
  isolating: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      alineacio: {
        default: ALINEACIO_PER_DEFECTE,
        rendered: false,
        parseHTML: (element) => alineacioValida(element.getAttribute('data-alineacio'))
      }
    };
  },

  parseHTML() {
    return [{ tag: `div[${MARCA_GRUP}]` }];
  },

  renderHTML({ node }) {
    return ['div', {
      [MARCA_GRUP]: '',
      class: 'sdp-targetes',
      'data-forma': formaDe(node.childCount) || 'sola',
      'data-alineacio': alineacioValida(node.attrs.alineacio)
    }, 0];
  }
});

export const TargetaIncrustada = Node.create({
  name: NOM_TARGETA,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    /* Cada atribut es llig del seu data-* i es neteja: un atribut pla amb
       el mateix nom (titol="…") no pot colar-se per davall de la neteja. */
    return Object.fromEntries(ATRIBUTS.map(([nom, atribut]) => [nom, {
      default: '',
      rendered: false,
      parseHTML: (element) => netejaAtributs({ [nom]: element.getAttribute(atribut) })[nom]
    }]));
  },

  parseHTML() {
    return [{ tag: `div[${MARCA_TARGETA}]` }];
  },

  renderHTML({ node }) {
    const net = netejaAtributs(node.attrs);
    const dades = { [MARCA_TARGETA]: net.clau, class: 'sdp-targeta' };
    for (const [nom, atribut] of ATRIBUTS.slice(1)) {
      if (net[nom]) dades[atribut] = net[nom];
    }
    const reserva = net.ruta
      ? ['a', { href: net.ruta, rel: 'noopener noreferrer nofollow' }, net.titol || net.ruta]
      : ['strong', net.titol];
    return ['div', dades, reserva];
  },

  addNodeView() {
    /* contenteditable="false" explícit: ProseMirror el posa per la propietat
       (contentEditable), i qui no la reflectix en l'atribut (jsdom) veuria
       una targeta editable. */
    return ReactNodeViewRenderer(TargetaIncrustadaNodeView, {
      className: 'sdp-targeta',
      attrs: ({ node }) => ({ [MARCA_TARGETA]: node.attrs.clau, contenteditable: 'false' }),
      stopEvent: ({ event }) => esDeLaTargeta(event)
    });
  }
});

/* ── Normalitzador ─────────────────────────────────────────────────────── */

/* El primer arranjament pendent del document, com una funció sobre `tr`, o
   null si el document ja és net. Un per volta: les posicions de la volta
   següent es tornen a llegir del document nou. */
function arranjamentPendent(doc) {
  let arranjament = null;
  doc.descendants((node, pos, pare, index) => {
    if (arranjament) return false;
    if (node.type.name !== NOM_GRUP) return !node.isTextblock && !node.isAtom;
    const invalides = [];
    node.forEach((fill, desplacament) => {
      if (!esTargetaValida(fill.attrs)) invalides.push([pos + 1 + desplacament, fill.nodeSize]);
    });
    if (invalides.length === node.childCount) {
      /* Cap targeta vàlida: el grup se'n va. Si era l'únic bloc del pare, un
         paràgraf buit ocupa el seu lloc (el document no pot quedar buit). */
      const paragraf = doc.type.schema.nodes.paragraph;
      arranjament = (tr) => (pare.childCount === 1 && paragraf
        ? tr.replaceWith(pos, pos + node.nodeSize, paragraf.create())
        : tr.delete(pos, pos + node.nodeSize));
    } else if (invalides.length) {
      arranjament = (tr) => {
        for (const [inici, mida] of invalides.reverse()) tr.delete(inici, inici + mida);
      };
    } else if (pare.maybeChild(index + 1)?.type.name === NOM_GRUP) {
      /* Dos grups seguits són un sol grup: mana l'alineació del primer. */
      arranjament = (tr) => tr.join(pos + node.nodeSize);
    }
    return false;
  });
  return arranjament;
}

/** Normalitza les targetes de `tr.doc` dins de la mateixa transacció. Torna si ha canviat res. */
export function normalitzaTargetes(tr) {
  let canviat = false;
  /* Un sostre de seguretat: cada volta arregla un grup. */
  for (let volta = 0; volta < 500; volta += 1) {
    const arranjament = arranjamentPendent(tr.doc);
    if (!arranjament) break;
    arranjament(tr);
    canviat = true;
  }
  return canviat;
}

/* ── Formes (decoracions) ──────────────────────────────────────────────── */

const CLAU_FORMES = new PluginKey('sdpTargetesFormes');

function formesDe(doc) {
  const decoracions = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== NOM_GRUP) return !node.isTextblock && !node.isAtom;
    decoracions.push(Decoration.node(pos, pos + node.nodeSize, { 'data-forma': formaDe(node.childCount) || 'sola' }));
    return false;
  });
  return { decoracions: DecorationSet.create(doc, decoracions), grups: decoracions.length };
}

/* ── Inserció ──────────────────────────────────────────────────────────── */

/* On va un grup nou: el lloc del paràgraf buit de primer nivell on hi ha el
   cursor (el que deixa l'ordre «/»), o darrere del bloc de primer nivell de
   la selecció. Sempre al primer nivell: la lectura només hidrata els grups
   de primer nivell (formaDelGrup.segmentsAmbTargetes). */
function llocDelGrup(selection) {
  const { $from } = selection;
  if ($from.depth === 0) return { inici: selection.to, fi: selection.to };
  if ($from.depth === 1 && $from.parent.isTextblock && $from.parent.content.size === 0) {
    return { inici: $from.before(1), fi: $from.after(1) };
  }
  const darrere = $from.after(1);
  return { inici: darrere, fi: darrere };
}

/* El cursor, al principi del bloc de text que seguix el grup; si no n'hi ha
   cap, un paràgraf nou on continuar escrivint. */
function cursorDarrere(tr, fiGrup) {
  const seguent = tr.doc.resolve(fiGrup).nodeAfter;
  const paragraf = tr.doc.type.schema.nodes.paragraph;
  if ((!seguent || !seguent.isTextblock) && paragraf) tr.insert(fiGrup, paragraf.create());
  tr.setSelection(TextSelection.near(tr.doc.resolve(fiGrup + 1)));
}

/* La posició del grup que conté `pos` (o la selecció), o null. */
function grupAl($pos) {
  for (let fondaria = $pos.depth; fondaria > 0; fondaria -= 1) {
    if ($pos.node(fondaria).type.name === NOM_GRUP) return { pos: $pos.before(fondaria), node: $pos.node(fondaria) };
  }
  return null;
}

/* ── Retrocés i Supr al costat d'un grup ───────────────────────────────── */

/**
 * Revisió del front «editor» (ordre del Mestre, 261004) · Retrocés a
 * l'inici d'un bloc de text (dir -1), o Supr al final (dir 1), amb un grup
 * de targetes just a l'altre costat fa el que fa amb una imatge de bloc
 * (joinBackward i joinForward de prosemirror-commands):
 *  · si el bloc és buit, se'n va i la targeta veïna queda triada (un altre
 *    Retrocés o Supr l'esborra, per deleteSelection);
 *  · si té text, la targeta veïna s'esborra i el cursor no es mou.
 * Una targeta sola s'emporta el grup sencer (un grup no pot quedar buit).
 * Sense això no passava res: el grup és aïllat i no es pot triar, i tant
 * joinBackward com selectNodeBackward tornen false. Torna si ho ha fet.
 */
export function esborraTargetaVeina(tr, dispatch, dir) {
  const $cursor = tr.selection instanceof TextSelection ? tr.selection.$cursor : null;
  if (!$cursor || !$cursor.parent.isTextblock || $cursor.depth < 1) return false;
  const alaVora = dir < 0 ? $cursor.parentOffset === 0 : $cursor.parentOffset === $cursor.parent.content.size;
  if (!alaVora) return false;
  const fondaria = $cursor.depth - 1;
  const pare = $cursor.node(fondaria);
  const index = $cursor.index(fondaria);
  const grup = pare.maybeChild(index + dir);
  if (grup?.type.name !== NOM_GRUP || !grup.childCount) return false;
  const iniciBloc = $cursor.before();
  const fiBloc = $cursor.after();
  const iniciGrup = dir < 0 ? iniciBloc - grup.nodeSize : fiBloc;
  const targeta = dir < 0 ? grup.lastChild : grup.firstChild;
  const posTargeta = dir < 0 ? iniciGrup + grup.nodeSize - 1 - targeta.nodeSize : iniciGrup + 1;
  const llevaElBloc = $cursor.parent.content.size === 0 && pare.canReplace(index, index + 1);
  if (!llevaElBloc && grup.childCount === 1 && !pare.canReplace(index + dir, index + dir + 1)) return false;
  if (!dispatch) return true;
  if (llevaElBloc) {
    tr.delete(iniciBloc, fiBloc);
    tr.setSelection(NodeSelection.create(tr.doc, tr.mapping.map(posTargeta)));
  } else if (grup.childCount === 1) {
    tr.delete(iniciGrup, iniciGrup + grup.nodeSize);
  } else {
    tr.delete(posTargeta, posTargeta + targeta.nodeSize);
  }
  tr.scrollIntoView();
  return true;
}

/* Les combinacions del Retrocés (enrere) i del Supr (avant), les mateixes
   que el keymap de TipTap (@tiptap/core, extensions/keymap.ts) i separades
   per plataforma com ell. Revisió del front «editor» (261004) · A Mac i iOS
   s'hi afigen les d'Emacs (Ctrl-h, Ctrl-d) i les d'Opció: sense, Opció+
   Retrocés al costat d'un grup no feia res. */
const TECLES_DE_SEMPRE = Object.freeze({
  enrere: Object.freeze(['Backspace', 'Mod-Backspace', 'Shift-Backspace']),
  avant: Object.freeze(['Delete', 'Mod-Delete'])
});
const TECLES_DE_MAC = Object.freeze({
  enrere: Object.freeze([...TECLES_DE_SEMPRE.enrere, 'Ctrl-h', 'Alt-Backspace']),
  avant: Object.freeze([...TECLES_DE_SEMPRE.avant, 'Ctrl-d', 'Ctrl-Alt-Backspace', 'Alt-Delete', 'Alt-d'])
});

/** Les combinacions de la plataforma: { enrere, avant }. */
export const teclesDeLaPlataforma = (esMac) => (esMac ? TECLES_DE_MAC : TECLES_DE_SEMPRE);

/* Les tecles, en una extensió pròpia per davall del keymap de TipTap
   (prioritat 100): Retrocés i Supr hi passen primer (desfer una regla
   d'entrada, esborrar la selecció, ajuntar blocs) i només arriben ací quan
   ProseMirror no hi pot fer res. La plataforma es llig en muntar l'editor,
   com fa el keymap. */
const TeclesDeTargetes = Extension.create({
  name: 'sdpTargetesTecles',
  priority: 90,

  addKeyboardShortcuts() {
    const tecla = (dir) => ({ editor }) => editor.commands.command(({ tr, dispatch }) => esborraTargetaVeina(tr, dispatch, dir));
    const enrere = tecla(-1);
    const avant = tecla(1);
    const tecles = teclesDeLaPlataforma(isiOS() || isMacOS());
    return Object.fromEntries([
      ...tecles.enrere.map((combinacio) => [combinacio, enrere]),
      ...tecles.avant.map((combinacio) => [combinacio, avant])
    ]);
  }
});

export const TargetesIncrustades = Extension.create({
  name: NOM_EXTENSIO_TARGETES,

  /* obreSelector el posa qui munta l'editor (DocumentEditor) i el lleva en
     desmuntar-se. Sense, l'ordre de la barra ix apagada. */
  addStorage() {
    return { obreSelector: null };
  },

  addExtensions() {
    return [GrupDeTargetes, TargetaIncrustada, TeclesDeTargetes];
  },

  addCommands() {
    return {
      /* Una targeta nova. Amb una targeta triada, s'afig al seu grup darrere
         d'ella; si no, un grup nou (vegeu llocDelGrup). Un grup nou al costat
         d'un altre s'hi fusiona (normalitzador). Regla d'or 1 (revisió del
         front, 261004): una instantània amb la ruta d'un autor i sense el seu
         nom no entra, perquè la boina eixiria buida (teAutoriaCompleta). */
      inserirTargeta: (atributs) => ({ tr, state, dispatch }) => {
        const net = netejaAtributs(atributs);
        const tipusGrup = state.schema.nodes[NOM_GRUP];
        const tipusTargeta = state.schema.nodes[NOM_TARGETA];
        if (!esTargetaValida(net) || !net.titol || !teAutoriaCompleta(net) || !tipusGrup || !tipusTargeta) return false;
        if (!dispatch) return true;
        const targeta = tipusTargeta.create(net);
        const { selection } = tr;
        if (selection.node?.type === tipusTargeta) {
          tr.insert(selection.to, targeta);
          const grup = grupAl(tr.doc.resolve(selection.to));
          if (grup) cursorDarrere(tr, grup.pos + grup.node.nodeSize);
          return true;
        }
        const grup = tipusGrup.create({ alineacio: ALINEACIO_PER_DEFECTE }, targeta);
        const { inici, fi } = llocDelGrup(selection);
        tr.replaceWith(inici, fi, grup);
        cursorDarrere(tr, inici + grup.nodeSize);
        return true;
      },

      /* Obri el selector del consumidor. NOMÉS amb dispatch: llegeixEstat la
         crida dins de can() a cada transacció, i sense esta guarda el diàleg
         s'obriria a cada tecla. */
      obreSelectorDeTargeta: () => ({ editor, dispatch }) => {
        const obre = editor?.storage?.[NOM_EXTENSIO_TARGETES]?.obreSelector;
        if (typeof obre !== 'function') return false;
        if (dispatch) obre();
        return true;
      },

      /* L'alineació del grup de la targeta triada (o de la de `posTargeta`,
         la posició que dona el NodeView). */
      alineaTargetes: (alineacio, posTargeta = null) => ({ tr, dispatch }) => {
        if (!ALINEACIONS.includes(alineacio)) return false;
        const pos = typeof posTargeta === 'number' ? posTargeta : tr.selection.from;
        if (pos < 0 || pos > tr.doc.content.size) return false;
        const grup = grupAl(tr.doc.resolve(pos));
        if (!grup) return false;
        if (dispatch && grup.node.attrs.alineacio !== alineacio) {
          tr.setNodeMarkup(grup.pos, undefined, { ...grup.node.attrs, alineacio });
        }
        return true;
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: CLAU_FORMES,
        state: {
          init: (_config, estat) => formesDe(estat.doc),
          apply: (tr, previ, _vell, nou) => (tr.docChanged ? formesDe(nou.doc) : previ)
        },
        props: {
          decorations: (estat) => CLAU_FORMES.getState(estat)?.decoracions ?? null,
          attributes: (estat) => (CLAU_FORMES.getState(estat)?.grups ? { class: CLASSE_AMB_TARGETES } : {})
        }
      }),
      new Plugin({
        key: new PluginKey('sdpTargetesNormalitza'),
        appendTransaction: (transaccions, _vell, nou) => {
          if (!transaccions.some((tr) => tr.docChanged)) return null;
          const tr = nou.tr;
          return normalitzaTargetes(tr) ? tr : null;
        }
      })
    ];
  }
});

export default TargetesIncrustades;
