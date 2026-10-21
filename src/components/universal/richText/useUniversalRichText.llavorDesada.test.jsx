/* Ordre del Mestre (261021, pla 261021_0015 §13, P1-02) · Pèrdua de dades a
   l'editor de notes: «una nota desada per la persona no s'ha de buidar mai en
   tornar-la a muntar quan el seu cos és igual que la llavor». Sobre el hook
   DE VERES i la LLAVOR_NOTA de veres:
     · la persona esvaeix la plantilla, hi torna a escriure el mateix text i el
       desa; en tornar a obrir la nota (un editor nou, o el mateix editor que
       passa per una altra nota i hi torna), el primer focus l'esborrava;
     · la plantilla efímera continua sent-ho: una nota que ningú no ha tocat
       torna a eixir verge després d'un remuntatge i s'esvaeix al primer focus;
     · tornar a una nota ja tocada carrega SEMPRE el seu cos, mai el de la
       nota d'on es ve. */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { esLlavorVerge, oblidaLlavorsConsumides, useUniversalRichText } from './useUniversalRichText.js';
import { LLAVOR_NOTA, LLAVORS_NOTA } from '../../../sections/notes/llavorNota.js';

afterEach(() => {
  cleanup();
  oblidaLlavorsConsumides();
});

const extensions = [];
const focus = (editor) => act(() => { editor.emit('focus', { editor, event: new FocusEvent('focus') }); });
const blur = (editor) => act(() => { editor.emit('blur', { editor, event: new FocusEvent('blur') }); });
const cosBuitDesat = (desats) => desats.filter(([html]) => html === '<p></p>');

/* Una nota del Bloc: l'editor amb les llavors del Bloc i un registre dels desats. */
const munta = (props) => {
  const desats = [];
  const vista = renderHook((p) => useUniversalRichText({
    seedContent: LLAVORS_NOTA, extensions, onSave: (...args) => desats.push(args), ...p
  }), { initialProps: props });
  return { ...vista, desats, editor: () => vista.result.current };
};

/* La persona esvaeix la plantilla, hi torna a escriure el mateix text i ix
   del cos: el desat porta un cos idèntic a la llavor. */
const escriuLaLlavorITancaLaNota = (id) => {
  const nota = munta({ id, content: LLAVOR_NOTA });
  focus(nota.editor());
  expect(nota.editor().isEmpty).toBe(true);
  act(() => { nota.editor().commands.setContent(LLAVOR_NOTA); });
  blur(nota.editor());
  const desat = nota.desats.at(-1);
  expect(desat?.[1]).toBe(id);
  expect(esLlavorVerge(nota.editor(), LLAVORS_NOTA)).toBe(true);
  nota.unmount();
  return desat[0];
};

describe('P1-02 · una nota desada amb el text de la llavor no es buida en tornar-la a muntar', () => {
  test('un editor nou per a la mateixa nota: el primer focus no l’esborra ni desa cap cos buit', () => {
    const desat = escriuLaLlavorITancaLaNota('nota-desada');
    const tornada = munta({ id: 'nota-desada', content: desat });
    const abans = tornada.editor().getHTML();
    expect(tornada.editor().isEmpty).toBe(false);
    focus(tornada.editor());
    blur(tornada.editor());
    expect(tornada.editor().getHTML()).toBe(abans);
    expect(cosBuitDesat(tornada.desats)).toEqual([]);
  });

  test('el mateix editor passa per una altra nota i hi torna: tampoc no l’esborra', () => {
    const nota = munta({ id: 'a', content: LLAVOR_NOTA });
    focus(nota.editor());
    act(() => { nota.editor().commands.setContent(LLAVOR_NOTA); });
    blur(nota.editor());
    const desat = nota.desats.at(-1)[0];
    nota.rerender({ id: 'b', content: '<p>Una altra nota</p>' });
    nota.rerender({ id: 'a', content: desat });
    expect(nota.editor().getHTML()).toBe(desat);
    focus(nota.editor());
    expect(nota.editor().getHTML()).toBe(desat);
    expect(cosBuitDesat(nota.desats)).toEqual([]);
  });

  test('tornar a una nota ja tocada carrega el seu cos, no el de la nota d’on es ve', () => {
    const nota = munta({ id: 'c', content: LLAVOR_NOTA });
    focus(nota.editor());
    blur(nota.editor());
    nota.rerender({ id: 'd', content: '<p>La nota d</p>' });
    expect(nota.editor().getHTML()).toBe('<p>La nota d</p>');
    // La c torna amb la llavor (un desat que no ha arribat): es pinta la c.
    nota.rerender({ id: 'c', content: LLAVOR_NOTA });
    expect(nota.editor().getHTML()).not.toBe('<p>La nota d</p>');
    expect(nota.editor().getHTML()).toContain('Títol de secció (H3)');
  });
});

describe('P1-02 · la plantilla efímera continua sent-ho', () => {
  test('una nota que ningú no ha tocat torna verge després d’un remuntatge i s’esvaeix al primer focus', () => {
    const primera = munta({ id: 'verge', content: LLAVOR_NOTA });
    primera.unmount();
    const tornada = munta({ id: 'verge', content: LLAVOR_NOTA });
    focus(tornada.editor());
    expect(tornada.editor().isEmpty).toBe(true);
    blur(tornada.editor());
    expect(tornada.desats).toEqual([['<p></p>', 'verge']]);
  });

  test('una altra nota amb la llavor, en un editor nou, s’esvaeix encara que la primera s’haja tocat', () => {
    escriuLaLlavorITancaLaNota('tocada');
    const altra = munta({ id: 'no-tocada', content: LLAVOR_NOTA });
    focus(altra.editor());
    expect(altra.editor().isEmpty).toBe(true);
  });
});
