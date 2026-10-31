/**
 * placeholderCos.js · P1-59 (a) (Llibre Mestre, Fita 23, «Didàctica Activa:
 * placeholder intel·ligent anti-error»; guàrdia nocturna 261030, Fase 3) ·
 * El text fantasma del cos de l'Editor Universal: un placeholder de veres,
 * que «desapareix en escriure i torna quan està buit».
 *
 * No és una llavor (seedContent): la llavor és contingut, es buida en el
 * primer focus i no torna. Ací no s'escriu res al document: és una
 * decoració de ProseMirror (cap node, cap transacció, cap desat), i el text
 * viu en un atribut `data-placeholder` del primer paràgraf mentre el cos és
 * buit de veres (un sol paràgraf sense contingut). La pinta la regla
 * `.sdp-editor-full-canvas p[data-placeholder]:first-child::before`
 * (components.css, § PLACEHOLDERS), amb el mateix color que els
 * placeholders dels camps (EditableField).
 *
 * Només mentre l'editor és editable: en lectura, res. Pur de React: només
 * importa el nucli de TipTap i ProseMirror (els mateixos que
 * targetesIncrustades.js).
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const NOM_PLACEHOLDER_COS = 'placeholderCos';
const CLAU = new PluginKey(NOM_PLACEHOLDER_COS);

/**
 * Cert si el document és buit de veres: un sol bloc de text sense cap
 * contingut (el paràgraf que ProseMirror hi posa quan no hi ha res). Una
 * llista buida, una imatge o un títol buit ja no ho són.
 */
export function esCosBuit(doc) {
  if (!doc || doc.childCount !== 1) return false;
  const primer = doc.firstChild;
  return Boolean(primer?.isTextblock) && primer.type.name === 'paragraph' && primer.content.size === 0;
}

/**
 * L'extensió amb el text (`text`, una cadena no buida). Sense text, cap
 * decoració. Es configura una vegada, en crear l'editor (les extensions han
 * de ser constants: useUniversalRichText).
 */
export const PlaceholderCos = Extension.create({
  name: NOM_PLACEHOLDER_COS,
  addOptions() {
    return { text: '' };
  },
  addProseMirrorPlugins() {
    const { text } = this.options;
    const editor = this.editor;
    if (typeof text !== 'string' || !text.trim()) return [];
    return [
      new Plugin({
        key: CLAU,
        props: {
          decorations(state) {
            if (!editor?.isEditable || !esCosBuit(state.doc)) return null;
            const primer = state.doc.firstChild;
            return DecorationSet.create(state.doc, [
              Decoration.node(0, primer.nodeSize, { 'data-placeholder': text })
            ]);
          }
        }
      })
    ];
  }
});
