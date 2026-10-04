/* T7 (ordre del Mestre, prompt 261004_0515) · Les portes d'entrada a les
   targetes: l'ordre «/» (només amb ambTargetes), l'extensió dins de
   extensionsRiques, i la fila «targeta» de nivell avançat al contracte de
   la barra, que mai obri res quan la barra només llig l'estat. */
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { creaOrdres, extensionsRiques } from '../index.js';
import { SCHEMA_VISIBLE, TOOLBAR_SCHEMA, FORMATS } from '../../toolbarContract.js';
import { executa, llegeixEstat } from '../../tiptapToolbarAdapter.js';
import { NOM_EXTENSIO_TARGETES } from './TargetesIncrustadesContext.js';

let editor = null;
function creaEditor(ambTargetes) {
  const element = document.createElement('div');
  document.body.appendChild(element);
  editor = new Editor({ element, extensions: [StarterKit, ...extensionsRiques({ ambTargetes })], content: '<p>Hola</p>' });
  return editor;
}

afterEach(() => {
  editor?.destroy();
  editor = null;
  document.body.replaceChildren();
});

describe('l’ordre «/» Targeta', () => {
  test('sense ambTargetes no hi és; la resta d’ordres no canvien', () => {
    const ids = creaOrdres().map((ordre) => ordre.id);
    expect(ids).toEqual(['titol', 'subtitol', 'h4', 'h5', 'h6', 'llista', 'citacio', 'divisor', 'imatge']);
  });

  test('amb ambTargetes va l’última i, després de llevar la «/», obri el selector', () => {
    const ordres = creaOrdres({ ambTargetes: true });
    expect(ordres.map((ordre) => ordre.id).slice(0, -1)).toEqual(creaOrdres().map((ordre) => ordre.id));
    const targeta = ordres.at(-1);
    expect(targeta).toMatchObject({ id: 'targeta', titol: 'Targeta' });
    expect(targeta.paraules).toEqual(expect.arrayContaining(['targeta', 'incrustar']));
    const passos = [];
    const cadena = { focus: () => cadena, deleteRange: (range) => { passos.push(['deleteRange', range]); return cadena; }, run: () => passos.push(['run']) };
    const editorFals = { chain: () => cadena, commands: { obreSelectorDeTargeta: () => passos.push(['obreSelectorDeTargeta']) } };
    targeta.executa({ editor: editorFals, range: { from: 1, to: 2 } });
    expect(passos).toEqual([['deleteRange', { from: 1, to: 2 }], ['run'], ['obreSelectorDeTargeta']]);
  });
});

describe('extensionsRiques', () => {
  test('l’extensió de targetes només entra amb ambTargetes', () => {
    expect(extensionsRiques().map((e) => e.name)).not.toContain(NOM_EXTENSIO_TARGETES);
    expect(extensionsRiques({ ambTargetes: true }).map((e) => e.name)).toContain(NOM_EXTENSIO_TARGETES);
  });
});

describe('la barra: fila «targeta» de nivell avançat', () => {
  test('és al contracte sense ranura: la barra d’ara pinta els mateixos botons', () => {
    const fila = TOOLBAR_SCHEMA.find((boto) => boto.id === FORMATS.TARGETA);
    expect(fila).toEqual({ id: 'targeta', clauI18n: 'editor.inserir.targeta', etiqueta: 'Targeta', commutable: false, slot: null, nivell: 'avancat' });
    expect(SCHEMA_VISIBLE.map((boto) => boto.id)).toEqual(['titol', 'llista', 'negreta', 'cursiva', 'ratllat', 'subtitol']);
  });

  test('sense l’extensió, la fila ix apagada i no peta', () => {
    creaEditor(false);
    const estat = llegeixEstat(editor);
    expect(estat.pot.targeta).toBe(false);
    expect(estat.actiu.targeta).toBe(false);
    expect(executa(editor, 'targeta')).toBe(false);
  });

  test('amb l’extensió, llegir l’estat no obri mai el selector; executar-la, sí', () => {
    creaEditor(true);
    expect(llegeixEstat(editor).pot.targeta).toBe(false);
    const obre = vi.fn();
    editor.storage[NOM_EXTENSIO_TARGETES].obreSelector = obre;
    for (let i = 0; i < 5; i += 1) expect(llegeixEstat(editor).pot.targeta).toBe(true);
    expect(obre).not.toHaveBeenCalled();
    expect(executa(editor, 'targeta')).toBe(true);
    expect(obre).toHaveBeenCalledTimes(1);
  });
});
