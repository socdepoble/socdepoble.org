/**
 * senseSubratllat.js · IDEA-59 / P1-72 (ordre del Mestre, 261101, punt 3:
 * «no s'usa subratllat a Sóc de Poble») · Cap camí deixa un subratllat al
 * cos de l'Editor Universal.
 *
 * L'esquema ja no porta la marca (useUniversalRichText configura StarterKit
 * amb `underline: false`): un <u> enganxat, arrossegat o carregat d'una nota
 * vella entra com a text normal, i el que es desa ja no el porta. Ací es
 * tanquen els dos camins del navegador que no passen per l'esquema:
 *   · la drecera Cmd/Ctrl+U, que el contenteditable aplicaria pel seu compte;
 *   · l'ordre «Subratllat» del menú de format del sistema (iOS i macOS),
 *     que arriba com un beforeinput 'formatUnderline'.
 * Totes dues es consumixen sense fer res.
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const NOM_SENSE_SUBRATLLAT = 'senseSubratllat';

export const SenseSubratllat = Extension.create({
  name: NOM_SENSE_SUBRATLLAT,
  addKeyboardShortcuts() {
    return {
      'Mod-u': () => true,
      'Mod-U': () => true
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey(NOM_SENSE_SUBRATLLAT),
        props: {
          handleDOMEvents: {
            beforeinput: (_view, event) => {
              if (event?.inputType !== 'formatUnderline') return false;
              event.preventDefault();
              return true;
            }
          }
        }
      })
    ];
  }
});
