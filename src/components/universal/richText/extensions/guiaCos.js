/**
 * guiaCos.js · IDEA-59 / P1-72 (ordre del Mestre, 261101 02:03 i 02:55,
 * punt 1) · El cartell guia reversible del cos de l'Editor Universal.
 *
 * Quan el cos d'un document té 0 caràcters, l'editor mostra una plantilla
 * de format (un títol de secció H3, un paràgraf que explica què és, un
 * subtítol H4 i dues llistes) perquè sempre quede clar que ahí es pot
 * escriure:
 *   · en punxar al cos (o en rebre'l amb el teclat), desapareix i l'espai
 *     queda net per a escriure;
 *   · si la persona ix del cos sense haver escrit res, torna;
 *   · si en eixe document s'ha escrit encara que siga UN caràcter, ja no
 *     torna mai, encara que s'esborre tot.
 *
 * No és contingut: és una decoració de ProseMirror (un giny que no és cap
 * node). No entra al document, ni a getHTML(), ni al desat, ni a la
 * publicació, ni a la targeta. Per a un lector de pantalla el giny és mut
 * (aria-hidden) i el cos porta el seu nom i el seu `aria-placeholder`.
 *
 * Diferent de la llavor (seedContent, useUniversalRichText): la llavor era
 * contingut que es buidava al primer focus i no tornava. Les notes velles
 * que encara la porten desada la buiden igual (la mateixa llavor), i
 * després hi apareix esta guia.
 *
 * L'estat del connector: { focus, escrit, id }.
 *   · `focus` el porten les transaccions de focus i de pèrdua de focus de
 *     TipTap (FocusEvents: les metes 'focus' i 'blur');
 *   · `escrit` es fa cert amb la primera transacció de la persona que deixa
 *     text al cos (una que entra a l'historial: les càrregues, el buidatge
 *     de la llavor i un desfer no en són);
 *   · `id` i l'`escrit` d'una càrrega els posa useUniversalRichText amb la
 *     meta CLAU_GUIA_COS: la memòria de cada document viu ací
 *     (IDS_AMB_COS_ESCRIT), dura el que dura la pàgina i sobreviu als
 *     remuntatges de l'editor, com la de la llavor consumida.
 *
 * Pur de React: només el nucli de TipTap i ProseMirror (com placeholderCos.js).
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const NOM_GUIA_COS = 'guiaCos';
export const CLAU_GUIA_COS = new PluginKey(NOM_GUIA_COS);

/* Els documents on ja s'ha escrit (per id). */
const IDS_AMB_COS_ESCRIT = new Set();

/** Cert si en el document `id` ja s'ha escrit almenys un caràcter. */
export function cosEscrit(id) {
  return id != null && IDS_AMB_COS_ESCRIT.has(String(id));
}

/** Per a les proves: oblida els documents on s'havia escrit. */
export function oblidaCossosEscrits() {
  IDS_AMB_COS_ESCRIT.clear();
}

/** Cert si el document porta almenys un caràcter (un espai també ho és). */
export function teText(doc) {
  return Boolean(doc) && doc.textContent.length > 0;
}

/**
 * Cert si el cos té 0 caràcters i cap peça que no siga text (una imatge, una
 * targeta, un divisor): un paràgraf buit, o els blocs buits que hi deixa
 * canviar el format sense escriure (un títol buit i el paràgraf final que hi
 * afig TipTap). Damunt d'una imatge no hi ha guia.
 */
export function esCosSenseText(doc) {
  if (!doc || teText(doc)) return false;
  let ambPeca = false;
  doc.descendants((node) => {
    if (ambPeca) return false;
    if (node.isLeaf && !node.isText && node.type.name !== 'hardBreak') ambPeca = true;
    return !ambPeca;
  });
  return !ambPeca;
}

const TIPUS_DE_TEXT = new Set(['h2', 'h3', 'h4', 'h5', 'h6', 'p']);
const TIPUS_DE_LLISTA = new Set(['ul', 'ol']);

/* Gauntlet 261101 · X-C-notes (C-09) · Un text de la guia és una cadena o
   el parell [clau i18n, reserva en valencià] (el de tradueix, Pedra Seca):
   amb traductor, la clau traduïda; sense, la reserva. */
function textDeGuia(valor, t) {
  if (!Array.isArray(valor)) return valor;
  const [clau, reserva] = valor;
  return typeof t === 'function' ? t(clau, reserva) : reserva;
}

/**
 * La guia amb tots els textos resolts (`t`, el traductor de la interfície;
 * sense, la reserva en valencià): { etiqueta, resum, blocs } amb cadenes.
 * Pur. Null si no hi ha guia.
 */
export function traduixGuia(guia, t = null) {
  if (!guia || typeof guia !== 'object') return null;
  const blocs = Array.isArray(guia.blocs) ? guia.blocs : [];
  return {
    etiqueta: textDeGuia(guia.etiqueta, t),
    resum: textDeGuia(guia.resum, t),
    blocs: blocs.map((bloc) => (
      TIPUS_DE_LLISTA.has(bloc?.tipus) && Array.isArray(bloc.items)
        ? { tipus: bloc.tipus, items: bloc.items.map((item) => textDeGuia(item, t)) }
        : { tipus: bloc?.tipus, text: textDeGuia(bloc?.text, t) }
    ))
  };
}

/** Els blocs vàlids d'una guia: { tipus: 'h3'|'p'|…, text } o { tipus: 'ul'|'ol', items: [text] }; un parell [clau, reserva] val la reserva. */
export function blocsDeGuia(blocs) {
  if (!Array.isArray(blocs)) return [];
  return traduixGuia({ blocs }).blocs.filter((bloc) => (
    (TIPUS_DE_TEXT.has(bloc?.tipus) && typeof bloc.text === 'string' && bloc.text.trim())
    || (TIPUS_DE_LLISTA.has(bloc?.tipus) && Array.isArray(bloc.items) && bloc.items.some((item) => typeof item === 'string' && item.trim()))
  ));
}

/* El giny: els mateixos elements que pintaria el cos (els elements de
   llista porten el seu paràgraf, com els serialitza TipTap), perquè la
   prosa de l'editor els vista igual. Només text (textContent), mai HTML. */
function pintaGuia(view, blocs) {
  const doc = view.dom.ownerDocument;
  const arrel = doc.createElement('div');
  arrel.className = 'sdp-guia-cos';
  arrel.setAttribute('contenteditable', 'false');
  arrel.setAttribute('aria-hidden', 'true');
  arrel.setAttribute('data-guia-cos', '');
  for (const bloc of blocs) {
    if (TIPUS_DE_LLISTA.has(bloc.tipus)) {
      const llista = doc.createElement(bloc.tipus);
      for (const text of bloc.items) {
        if (typeof text !== 'string' || !text.trim()) continue;
        const element = doc.createElement('li');
        const paragraf = doc.createElement('p');
        paragraf.textContent = text;
        element.append(paragraf);
        llista.append(element);
      }
      arrel.append(llista);
    } else {
      const element = doc.createElement(bloc.tipus);
      element.textContent = bloc.text;
      arrel.append(element);
    }
  }
  /* Punxar damunt de la guia és punxar al cos: el focus va al cos buit (la
     guia s'amaga amb la transacció de focus). Sense el preventDefault, el
     navegador posaria el cursor en un element que no és editable. */
  arrel.addEventListener('mousedown', (event) => {
    event.preventDefault();
    view.focus();
  });
  return arrel;
}

/**
 * L'extensió. Opcions (constants, es fixen en crear l'editor):
 *   · blocs: la plantilla (blocsDeGuia);
 *   · etiqueta: el nom accessible del cos (aria-label);
 *   · resum: l'aria-placeholder del cos mentre es veu la guia.
 * Cada text ja ve traduït (traduixGuia, DocumentEditor); un parell
 * [clau, reserva] que hi arribe sense traduir val la reserva.
 * Sense cap bloc, cap connector: l'editor és el de sempre.
 */
export const GuiaCos = Extension.create({
  name: NOM_GUIA_COS,
  addOptions() {
    return { blocs: [], etiqueta: '', resum: '' };
  },
  addProseMirrorPlugins() {
    const blocs = blocsDeGuia(this.options.blocs);
    if (!blocs.length) return [];
    const { etiqueta: nom, resum: resumCru } = traduixGuia(this.options);
    const etiqueta = typeof nom === 'string' ? nom.trim() : '';
    const resum = typeof resumCru === 'string' ? resumCru.trim() : '';
    const editor = this.editor;
    const visible = (state) => {
      const guia = CLAU_GUIA_COS.getState(state);
      return Boolean(editor?.isEditable) && Boolean(guia) && !guia.focus && !guia.escrit && esCosSenseText(state.doc);
    };
    return [
      new Plugin({
        key: CLAU_GUIA_COS,
        state: {
          init: () => ({ focus: Boolean(editor?.isFocused), escrit: false, id: null }),
          apply(tr, abans, _vell, nou) {
            let { focus, escrit, id } = abans;
            const meta = tr.getMeta(CLAU_GUIA_COS);
            if (meta && typeof meta === 'object') {
              if (Object.hasOwn(meta, 'id')) id = meta.id == null ? null : String(meta.id);
              if (typeof meta.escrit === 'boolean') escrit = meta.escrit;
            }
            if (tr.getMeta('focus')) focus = true;
            if (tr.getMeta('blur')) focus = false;
            if (!escrit && tr.docChanged && tr.getMeta('addToHistory') !== false && teText(nou.doc)) escrit = true;
            if (escrit && id != null) IDS_AMB_COS_ESCRIT.add(id);
            return focus === abans.focus && escrit === abans.escrit && id === abans.id ? abans : { focus, escrit, id };
          }
        },
        props: {
          /* El cos és un camp de text de diverses línies amb nom; mentre es
             veu la guia, el seu aria-placeholder la resumix (la guia és muda). */
          attributes: (state) => ({
            role: 'textbox',
            'aria-multiline': 'true',
            ...(etiqueta ? { 'aria-label': etiqueta } : {}),
            ...(resum && visible(state) ? { 'aria-placeholder': resum } : {})
          }),
          decorations(state) {
            if (!visible(state)) return null;
            return DecorationSet.create(state.doc, [
              Decoration.widget(0, (view) => pintaGuia(view, blocs), {
                key: 'sdp-guia-cos', side: -1, ignoreSelection: true, stopEvent: () => true
              })
            ]);
          }
        }
      })
    ];
  }
});
