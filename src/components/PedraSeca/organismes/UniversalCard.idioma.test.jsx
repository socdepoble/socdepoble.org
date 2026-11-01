/* Gauntlet 2 · 261101 (G2-T7-02; resta de P1-22) · Els botons del peu de
   cada targeta (UniversalCard) es diuen en la llengua de la interfície, amb
   una frase sencera per llengua (TEXTOS_PEU_TARGETA, buit {titol}): «Traduir
   <títol>», «Comentar <títol>», «Compartir <títol>» i «Ancorar <títol>»; sense
   títol, el verb sol (el de la barra blava). Fora de l'app (sense traductor)
   i en valencià, el nom de sempre (Llei del Píxel). */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';

const mocks = vi.hoisted(() => ({ t: null }));
vi.mock('../../../app/contexts/RouterContext', async () => {
  const { createElement: h } = await import('react');
  return { useNavigate: () => vi.fn(), Link: ({ to, children, ...resta }) => h('a', { href: to, ...resta }, children) };
});
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActionsOpcional: () => (mocks.t ? { t: mocks.t } : null)
}));
import { UniversalCard } from './UniversalCard.jsx';
import { TEXTOS_PEU_TARGETA } from '../../universal/barres/textosBarres.js';

beforeEach(() => { mocks.t = null; });
afterEach(() => cleanup());

const TARGETA = {
  mainHref: '/mur/1', hasFooter: true, showTranslate: true, showComment: true, showShare: true, showConnect: false,
  showPin: true, onPin: () => {}
};
/* Els noms del peu, en l'ordre del DOM: Ancorar (a la capçalera), Traduir, Comentar i Compartir. */
const noms = (props) => {
  const { container } = render(<UniversalCard {...TARGETA} {...props} />);
  return ['.btn-icon-orange', '.sp-card-actions button']
    .flatMap((selector) => [...container.querySelectorAll(selector)])
    .map((boto) => boto.getAttribute('aria-label'))
    .filter((nom, i, tots) => nom && tots.indexOf(nom) === i);
};

describe('les reserves són el text de sempre', () => {
  test('cada parell de TEXTOS_PEU_TARGETA: la reserva és el valor de ca, i el buit {titol} és a les cinc llengües', () => {
    const ca = createTranslator('ca');
    for (const { sol, ambTitol } of Object.values(TEXTOS_PEU_TARGETA)) {
      expect([sol[0], ca(sol[0])]).toEqual([sol[0], sol[1]]);
      expect([ambTitol[0], ca(ambTitol[0])]).toEqual([ambTitol[0], ambTitol[1]]);
      for (const llengua of ['ca', 'es', 'en', 'eu', 'gl']) {
        expect([llengua, ambTitol[0], createTranslator(llengua)(ambTitol[0]).match(/\{titol\}/g)]).toEqual([llengua, ambTitol[0], ['{titol}']]);
      }
    }
  });
});

describe('en la llengua de la interfície', () => {
  test('anglés: frases senceres amb el títol, i el verb sol sense títol', () => {
    mocks.t = createTranslator('en');
    expect(noms({ title: 'Festes' })).toEqual(['Pin Festes', 'Translate Festes', 'Comment on Festes', 'Share Festes']);
    cleanup();
    expect(noms({})).toEqual(['Pin', 'Translate', 'Comment', 'Share']);
  });

  test('basc: el títol al seu lloc, i Traduir no es diu com Tornar («Itzuli»)', () => {
    mocks.t = createTranslator('eu');
    expect(noms({ title: 'Jaiak' })).toEqual(['Jaiak: finkatu', 'Jaiak: itzulpena', 'Jaiak: iruzkindu', 'Jaiak: partekatu']);
    cleanup();
    const sols = noms({});
    expect(sols).toEqual(['Finkatu', 'Itzulpena', 'Iruzkindu', 'Partekatu']);
    const eu = createTranslator('eu');
    for (const clau of ['common.back', 'section.detail.back', 'section.notes.back']) expect(sols).not.toContain(eu(clau));
  });

  test('un títol amb «$&» o «{titol}» es posa tal qual', () => {
    mocks.t = createTranslator('en');
    expect(noms({ title: '$& {titol}' })[1]).toBe('Translate $& {titol}');
  });
});

describe('fora de l’app i en valencià: el nom de sempre', () => {
  test('sense traductor', () => {
    expect(noms({ title: 'Festes' })).toEqual(['Ancorar Festes', 'Traduir Festes', 'Comentar Festes', 'Compartir Festes']);
    cleanup();
    expect(noms({})).toEqual(['Ancorar', 'Traduir', 'Comentar', 'Compartir']);
  });

  test('amb el traductor valencià', () => {
    mocks.t = createTranslator('ca');
    expect(noms({ title: 'Festes' })).toEqual(['Ancorar Festes', 'Traduir Festes', 'Comentar Festes', 'Compartir Festes']);
  });
});
