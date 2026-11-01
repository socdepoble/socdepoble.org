/* T7 · P1-22 (261101) · Dos noms accessibles fixos de Pedra Seca, en la
   llengua de la interfície (WCAG 3.1.2 i 4.1.2):
     · UniversalCard: la llista d'etiquetes, «Categories» (common.categories);
     · BotoPantallaCompleta: aria-label i title, «Pantalla completa»
       (common.pantallaCompleta).
   «Eixir de la pantalla completa» es queda fora: és una frase cosida en dos
   trossos (PantallaCompleta.jsx). Fora de l'app (sense traductor), el
   valencià de sempre: cap atribut canvia (Llei del Píxel). */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';
import { MemoryRouter } from '../../../app/contexts/RouterContext';

const mocks = vi.hoisted(() => ({ t: null }));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIState: () => ({ externalConfig: {} }),
  useUIActionsOpcional: () => (mocks.t ? { t: mocks.t } : null)
}));
import { UniversalCard } from './UniversalCard.jsx';
import { BotoPantallaCompleta } from './PantallaCompleta.jsx';

beforeEach(() => { mocks.t = null; });
afterEach(() => cleanup());

const TARGETA = { title: 'Fira del Porrat', labels: ['festes'] };
const targeta = () => render(<MemoryRouter><UniversalCard {...TARGETA} /></MemoryRouter>).container;
const nomCategories = (container) => container.querySelector('ul.sp-card-labels').getAttribute('aria-label');
const nomPantalla = () => {
  const boto = screen.getByRole('button');
  return [boto.getAttribute('aria-label'), boto.getAttribute('title')];
};

describe('en la llengua de la interfície', () => {
  test('castellà: «Categorías» i «Pantalla completa»', () => {
    mocks.t = createTranslator('es');
    expect(nomCategories(targeta())).toBe('Categorías');
    cleanup();
    render(<BotoPantallaCompleta onClick={() => {}} />);
    expect(nomPantalla()).toEqual(['Pantalla completa', 'Pantalla completa']);
  });

  test('anglés: «Categories» i «Full screen»; basc: «Kategoriak» i «Pantaila osoa»', () => {
    mocks.t = createTranslator('en');
    expect(nomCategories(targeta())).toBe('Categories');
    cleanup();
    render(<BotoPantallaCompleta onClick={() => {}} />);
    expect(nomPantalla()).toEqual(['Full screen', 'Full screen']);
    cleanup();
    mocks.t = createTranslator('eu');
    expect(nomCategories(targeta())).toBe('Kategoriak');
    cleanup();
    render(<BotoPantallaCompleta onClick={() => {}} />);
    expect(nomPantalla()).toEqual(['Pantaila osoa', 'Pantaila osoa']);
  });
});

describe('sense traductor (fora de l’app): el valencià de sempre', () => {
  test('UniversalCard i BotoPantallaCompleta', () => {
    expect(nomCategories(targeta())).toBe('Categories');
    cleanup();
    render(<BotoPantallaCompleta onClick={() => {}} />);
    expect(nomPantalla()).toEqual(['Pantalla completa', 'Pantalla completa']);
  });

  test('les reserves són el valencià del diccionari', () => {
    const ca = createTranslator('ca');
    expect([ca('common.categories'), ca('common.pantallaCompleta')]).toEqual(['Categories', 'Pantalla completa']);
  });
});
