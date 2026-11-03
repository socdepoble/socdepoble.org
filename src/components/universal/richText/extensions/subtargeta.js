/**
 * subtargeta.js · O4-CLAUDE-2 (ordre del Mestre, 261102 21:38; Onada 4
 * Nocturna) · La primitiva única «Subtargeta» de Pedra Seca a l'Editor
 * Universal: una targeta interna, ben delimitada, dins del cos d'una pàgina
 * o d'un document. La mateixa peça per a les pàgines del sistema (PAGE_COPY)
 * i per a l'editor.
 *
 * És HTML pur que el sanejador ja admet (src/utils/sanitize.js no canvia:
 * div, class i els data-* de sèrie de DOMPurify):
 *
 *   <div class="sdp-subtargeta" data-sdp-subtargeta="">
 *     <h4>Títol</h4>                  el primer encapçalament (h3 a h5 segons el context)
 *     <p>Metadada o subtítol</p>      opcional: el primer paràgraf just darrere del títol
 *     …cos ric (paràgrafs, llistes, enllaços)…
 *   </div>
 *
 * Cap classe nova al contingut: el títol i la metadada els pinta el bloc
 * .sdp-subtargeta de modules.css per estructura (:first-child i
 * :first-child + p), a la lectura (article.cms-preview i
 * article.detail-content) i ací (.ProseMirror). Estàtica: el sanejador
 * lleva details i summary, i la caixa no es plega.
 *
 * El node `sdpSubtargeta`:
 *   · content `heading block*`: sempre un títol primer. Un div marcat que
 *     arriba sense encapçalament rep el títol buit que hi posa ProseMirror en
 *     llegir-lo; el que hi ha darrere és el cos (la metadada és només el
 *     primer paràgraf, cap node propi).
 *   · renderHTML idèntic a la primitiva i parseHTML pel seu data-*:
 *     sanitizeHtml(getHTML()) === getHTML(), sense cap atribut que el
 *     sanejador llevaria; si no, el bucle de sincronia d'useUniversalRichText
 *     tornaria a carregar el cos i el cursor saltaria.
 *   · isolating: les ordres de joinBackward i joinForward de sèrie no
 *     desfan mai la caixa ni fusionen el seu títol amb el paràgraf veí (sense,
 *     un Retrocés a l'inici del títol l'abocava al paràgraf d'abans). Les
 *     tecles pròpies de baix donen l'entrada i l'eixida.
 *   · O4-CLAUDE-2 · C2-02 (àrbitre) · El títol conserva el seu nivell. Les
 *     ordres de sèrie que passen per clearNodes (setParagraph,
 *     toggleBulletList i toggleOrderedList, toggleHeading del nivell actiu:
 *     les dreceres Mod-Alt-0, Mod-Shift-8 i 7, Mod-Alt-4 i l'ordre «/»
 *     escrita dins del títol) tornen false, però TipTap despatxa igualment la
 *     transacció, i el títol quedava amb el nivell 1 de reserva (un <h2> a
 *     getHTML, fora de la jerarquia de l'Índex). El connector
 *     appendTransaction de baix el torna al nivell que tenia abans de la
 *     transacció (o, si no se'n sap, al de la mostra) en la mateixa passada:
 *     un sol pas de desfer.
 *
 * L'ordre `inserirSubtargeta(textos?)` (la barra, «⋯» · Subtargeta, i
 * l'ordre «/» Subtargeta) posa una caixa de mostra al nivell de dalt del
 * document, darrere del bloc del cursor (o en el lloc d'un paràgraf buit,
 * com el que deixa l'ordre «/»): un títol del nivell del context
 * (nivellDeContext: un sota l'últim encapçalament d'abans, H3 si no n'hi ha,
 * el mateix d'una subtargeta germana), la línia de metadada i un paràgraf de
 * cos. DECISIÓ (O4-CLAUDE-2,
 * «que no es desen buits si l'autor no hi escriu»): la mostra és TEXT de
 * veres, no cap decoració. El que es veu és el que es desa: una caixa
 * inserida i oblidada mai queda com un requadre buit a la lectura (els
 * fantasmes de text d'una decoració desapareixen en llegir-la). El títol de
 * mostra queda TRIAT: la primera tecla el substituïx. Els textos arriben
 * traduïts de DocumentEditor (t(), claus section.notes.format.subtargeta*)
 * pel magatzem de l'extensió (editor.storage.sdpSubtargeta.textos, com el
 * selector de les targetes): canviar d'idioma no reconstruïx l'editor, i la
 * crida a extensionsRiques és la de sempre. Sense, l'opció `textos` i, per
 * a cada buit, les reserves de ca.js. Fora de dispatch l'ordre no fa res (la
 * barra la prova dins de can() a cada transacció).
 *
 * O4-CLAUDE-2 · C2-07 (àrbitre) · El títol i l'ajuda de l'ordre «/»
 * Subtargeta també passen pel traductor: DocumentEditor els deixa al mateix
 * magatzem (editor.storage.sdpSubtargeta.ordre) i el menú «/» (slash.js) els
 * llig en pintar-se, amb textosDeLOrdre; sense, les reserves de ca.js
 * (ORDRE_SUBTARGETA).
 *
 * Pur de React: només el nucli de TipTap i ProseMirror.
 */
import { Node } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';

export const NOM_SUBTARGETA = 'sdpSubtargeta';
export const MARCA_SUBTARGETA = 'data-sdp-subtargeta';
export const CLASSE_SUBTARGETA = 'sdp-subtargeta';
/* La reserva del nivell del títol: la de nivellDAbans (una caixa de qui no
   se sap res) i la d'inserirSubtargeta quan el nivell del context no és entre
   els admesos. La caixa nova pren el nivell del context (nivellDeContext). */
export const NIVELL_TITOL_SUBTARGETA = 4;

/* Les reserves dels textos de mostra, idèntiques a ca.js
   (section.notes.format.subtargetaTitol, …Meta i …Cos). */
export const TEXTOS_SUBTARGETA = Object.freeze({
  titol: 'Títol de la subtargeta',
  meta: 'Una línia de context: data, lloc o autoria',
  cos: 'Escriu ací el contingut de la subtargeta: paràgrafs, llistes i enllaços.'
});

/** Els textos de mostra: els que arriben (cadenes no buides) i, per a la
 *  resta, els de l'extensió o les reserves. */
export function textosDeMostra(textos = null, base = TEXTOS_SUBTARGETA) {
  const tria = (clau) => {
    const valor = textos?.[clau];
    if (typeof valor === 'string' && valor.trim()) return valor;
    const reserva = base?.[clau];
    return typeof reserva === 'string' && reserva.trim() ? reserva : TEXTOS_SUBTARGETA[clau];
  };
  return { titol: tria('titol'), meta: tria('meta'), cos: tria('cos') };
}

/* O4-CLAUDE-2 · C2-07 · Les reserves de l'ordre «/» Subtargeta, idèntiques a
   ca.js (section.notes.format.subtargeta i …subtargetaAjuda). */
export const ORDRE_SUBTARGETA = Object.freeze({
  titol: 'Subtargeta',
  ajuda: 'Una targeta dins del text: títol, context i cos'
});

/** El títol i l'ajuda de l'ordre «/»: els traduïts del magatzem (els hi posa
 *  DocumentEditor) i, per a cada buit, les reserves. */
export function textosDeLOrdre(editor) {
  const textos = editor?.storage?.[NOM_SUBTARGETA]?.ordre;
  const tria = (clau) => {
    const valor = textos?.[clau];
    return typeof valor === 'string' && valor.trim() ? valor : ORDRE_SUBTARGETA[clau];
  };
  return { titol: tria('titol'), ajuda: tria('ajuda') };
}

/* On va una subtargeta nova: sempre al nivell de dalt del document (mai
   dins d'una altra subtargeta, d'una llista o d'una cita). Amb el cursor en
   un paràgraf buit de dalt, en el seu lloc; si no, darrere del bloc de dalt
   on acaba la selecció. Una selecció del document mateix (un node de dalt
   triat, el cursor de buit), darrere d'ella. */
function llocDeLaSubtargeta(selection) {
  const { $from, $to } = selection;
  if ($from.depth === 0 || $to.depth === 0) return { inici: selection.to, fi: selection.to };
  const bloc = $from.node(1);
  const inici = $from.before(1);
  if (bloc.isTextblock && bloc.content.size === 0 && $to.before(1) === inici) return { inici, fi: inici + bloc.nodeSize };
  const darrere = $to.after(1);
  return { inici: darrere, fi: darrere };
}

/* Cert si cada fill de la caixa és un bloc de text buit (cap text, cap
   imatge, cap llista). */
const esBuida = (caixa) => {
  let buida = true;
  caixa.forEach((fill) => { if (!fill.isTextblock || fill.content.size > 0) buida = false; });
  return buida;
};

/* Retrocés a l'inici del títol. Una caixa del tot buida se'n va i hi queda
   un paràgraf buit (la manera de llevar la que s'acaba de buidar). Amb
   contingut, la tecla es consumix sense fer res: la caixa és aïllada, i el
   camí de sèrie (clearNodes) tornava el títol a l'H2 de reserva. */
function retrocesAlTitol(tr, dispatch) {
  const { selection } = tr;
  if (!selection.empty) return false;
  const { $from } = selection;
  if ($from.depth < 2 || $from.parentOffset !== 0 || $from.index(-1) !== 0) return false;
  const caixa = $from.node(-1);
  if (caixa.type.name !== NOM_SUBTARGETA) return false;
  if (!esBuida(caixa)) return true;
  if (dispatch) {
    const inici = $from.before(-1);
    tr.replaceWith(inici, inici + caixa.nodeSize, tr.doc.type.schema.nodes.paragraph.create());
    tr.setSelection(TextSelection.create(tr.doc, inici + 1));
    tr.scrollIntoView();
  }
  return true;
}

/* O4-CLAUDE-2 · C2-05 (àrbitre) · Retorn a l'inici d'un títol amb text: el
   gest de fer lloc davant de la caixa. Hi entra un paràgraf buit just davant
   (on el pare l'admet) i el cursor hi passa; la caixa no canvia. De sèrie
   (splitBlock) la caixa es quedava amb un títol buit i el de veres passava al
   cos com un encapçalament qualsevol. Un títol buit, o el cursor al mig o al
   final, seguix el camí de sempre. */
function retornAlTitol(tr, dispatch) {
  const { selection } = tr;
  if (!selection.empty) return false;
  const { $from } = selection;
  if ($from.depth < 2 || $from.parentOffset !== 0 || $from.index(-1) !== 0) return false;
  const caixa = $from.node(-1);
  if (caixa.type.name !== NOM_SUBTARGETA || $from.parent.content.size === 0) return false;
  const paragraf = tr.doc.type.schema.nodes.paragraph;
  const lloc = $from.index(-2);
  if (!paragraf || !$from.node(-2).canReplaceWith(lloc, lloc, paragraf)) return false;
  if (dispatch) {
    const inici = $from.before(-1);
    tr.insert(inici, paragraf.create());
    tr.setSelection(TextSelection.create(tr.doc, inici + 1));
    tr.scrollIntoView();
  }
  return true;
}

/* O4-CLAUDE-2 · C2-02 (àrbitre) · Els nivells que admet el títol: els de
   l'extensió Heading de l'editor (StarterKit, h2 a h6 a useUniversalRichText);
   sense, els mateixos de sèrie. */
const NIVELLS_DE_SERIE = Object.freeze([2, 3, 4, 5, 6]);
function nivellsDelTitol(editor) {
  const nivells = editor?.extensionManager?.extensions?.find((extensio) => extensio.name === 'heading')?.options?.levels;
  return Array.isArray(nivells) && nivells.length ? nivells : NIVELLS_DE_SERIE;
}

/* D5-a11y-pedra-seca-04 · El nivell del títol d'una caixa nova a `inici`:
   el que seguix l'últim encapçalament de dalt d'abans (un H3 dona h4), h3 si
   no n'hi ha cap (el títol i el subtítol de la nota són fora del cos), i el
   mateix d'una subtargeta germana (el seu títol és un apartat del mateix pare,
   no el pare). Sempre entre h3 i h6 i entre els nivells admesos; si no, la
   reserva. Cap salt de nivell per a l'Índex ni per al lector de pantalla. */
export function nivellDeContext(doc, inici, nivells = NIVELLS_DE_SERIE) {
  let darrer = null;
  let germana = false;
  doc?.forEach((node, pos) => {
    if (pos >= inici) return;
    const titol = node.type.name === NOM_SUBTARGETA ? node.firstChild : node;
    if (titol?.type.name !== 'heading') return;
    darrer = titol.attrs.level;
    germana = node !== titol;
  });
  const nivell = Math.min(Math.max(germana ? darrer : (darrer ?? 2) + 1, 3), 6);
  return nivells.includes(nivell) ? nivell : NIVELL_TITOL_SUBTARGETA;
}

/* El nivell que tenia el títol de la caixa que ara és a `pos` abans de les
   transaccions: la posició es torna enrere pel mapatge invers de cada una i,
   si allà hi havia el títol d'una subtargeta amb un nivell vàlid, és eixe.
   Si no se'n sap res (una caixa nova, un setContent), el de la mostra. */
function nivellDAbans(transaccions, vell, pos, nivells) {
  let abans = pos + 1;
  for (let i = transaccions.length - 1; i >= 0; i -= 1) abans = transaccions[i].mapping.invert().map(abans, -1);
  if (abans < 0 || abans > vell.doc.content.size) return NIVELL_TITOL_SUBTARGETA;
  const $abans = vell.doc.resolve(abans);
  const titol = $abans.nodeAfter;
  const esTitol = $abans.parent.type.name === NOM_SUBTARGETA && $abans.index() === 0 && titol?.type.name === 'heading';
  return esTitol && nivells.includes(titol.attrs.level) ? titol.attrs.level : NIVELL_TITOL_SUBTARGETA;
}

/* La passada: cada caixa del document nou amb un títol de nivell fora dels
   admesos (el nivell 1 de reserva que hi deixa clearNodes) torna al seu. Cap
   canvi, cap transacció. Els blocs de text no es recorren per dins. */
function normalitzaNivells(transaccions, vell, nou, nivells) {
  if (!transaccions.some((transaccio) => transaccio.docChanged)) return null;
  let tr = null;
  nou.doc.descendants((node, pos) => {
    if (node.isTextblock || node.isAtom) return false;
    if (node.type.name !== NOM_SUBTARGETA) return true;
    const titol = node.firstChild;
    if (titol?.type.name === 'heading' && !nivells.includes(titol.attrs.level)) {
      tr = tr || nou.tr;
      tr.setNodeMarkup(pos + 1, null, { ...titol.attrs, level: nivellDAbans(transaccions, vell, pos, nivells) });
    }
    return true;
  });
  return tr;
}

/* Retorn en un paràgraf buit que és l'últim de la caixa (i no el títol):
   l'eixida, com a una cita. El paràgraf buit se'n va i el cursor passa a un
   paràgraf nou just darrere de la caixa. Una llista de dins té les seues
   tecles: ací no hi entra (el pare del paràgraf ha de ser la caixa). */
function retornAlFinal(tr, dispatch) {
  const { selection } = tr;
  if (!selection.empty) return false;
  const { $from } = selection;
  if ($from.depth < 2) return false;
  const caixa = $from.node(-1);
  const bloc = $from.parent;
  const index = $from.index(-1);
  if (caixa.type.name !== NOM_SUBTARGETA || bloc.type.name !== 'paragraph' || bloc.content.size > 0) return false;
  if (index === 0 || index !== caixa.childCount - 1) return false;
  if (dispatch) {
    const iniciBloc = $from.before();
    const fiCaixa = $from.after(-1);
    tr.delete(iniciBloc, iniciBloc + bloc.nodeSize);
    const desti = tr.mapping.map(fiCaixa);
    tr.insert(desti, tr.doc.type.schema.nodes.paragraph.create());
    tr.setSelection(TextSelection.create(tr.doc, desti + 1));
    tr.scrollIntoView();
  }
  return true;
}

export const Subtargeta = Node.create({
  name: NOM_SUBTARGETA,
  group: 'block',
  content: 'heading block*',
  defining: true,
  isolating: true,
  draggable: false,
  /* Les tecles pròpies, davant de les de sèrie (Keymap del nucli: el Retorn
     de splitBlock i el Retrocés de clearNodes i joinBackward). Només actuen
     dins d'una subtargeta; fora, tornen false i la tecla seguix el seu camí. */
  priority: 200,

  addOptions() {
    return { textos: TEXTOS_SUBTARGETA };
  },

  /* Els textos traduïts els posa qui munta l'editor (DocumentEditor) i els
     lleva en desmuntar-se. */
  addStorage() {
    return { textos: null, ordre: null };
  },

  /* O4-CLAUDE-2 · C2-02 · El títol conserva el seu nivell (normalitzaNivells). */
  addProseMirrorPlugins() {
    const { editor } = this;
    return [new Plugin({
      key: new PluginKey('sdpSubtargetaNivell'),
      appendTransaction: (transaccions, vell, nou) => normalitzaNivells(transaccions, vell, nou, nivellsDelTitol(editor))
    })];
  },

  parseHTML() {
    return [{ tag: `div[${MARCA_SUBTARGETA}]` }];
  },

  /* La primitiva, byte a byte: la classe i després la marca (l'ordre que
     DOMPurify conserva en tornar-la a escriure). */
  renderHTML() {
    return ['div', { class: CLASSE_SUBTARGETA, [MARCA_SUBTARGETA]: '' }, 0];
  },

  addCommands() {
    return {
      inserirSubtargeta: (textos = null) => ({ tr, state, dispatch }) => {
        const tipus = state.schema.nodes[NOM_SUBTARGETA];
        const { heading: titol, paragraph: paragraf } = state.schema.nodes;
        if (!tipus || !titol || !paragraf) return false;
        if (!dispatch) return true;
        const mostra = textosDeMostra(textos, textosDeMostra(this.storage?.textos, this.options.textos));
        const { inici, fi } = llocDeLaSubtargeta(tr.selection);
        const nivell = nivellDeContext(tr.doc, inici, nivellsDelTitol(this.editor));
        const caixa = tipus.create(null, [
          titol.create({ level: nivell }, state.schema.text(mostra.titol)),
          paragraf.create(null, state.schema.text(mostra.meta)),
          paragraf.create(null, state.schema.text(mostra.cos))
        ]);
        tr.replaceWith(inici, fi, caixa);
        /* El títol de mostra, triat: inici + 1 entra a la caixa i + 1 al títol. */
        const desde = inici + 2;
        tr.setSelection(TextSelection.create(tr.doc, desde, desde + mostra.titol.length));
        tr.scrollIntoView();
        return true;
      }
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => editor.commands.command(({ tr, dispatch }) => retrocesAlTitol(tr, dispatch)),
      Enter: ({ editor }) => editor.commands.command(({ tr, dispatch }) => retornAlTitol(tr, dispatch) || retornAlFinal(tr, dispatch))
    };
  }
});

export default Subtargeta;
