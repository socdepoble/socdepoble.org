/* T7 · P1-22 (261101) · Els noms accessibles de la barra d'accions, en la
   llengua de la interfície (WCAG 3.1.2 i 4.1.2):
     · BarraBlava: aria-label i title de «Tornar arrere», «Índex de secció»,
       «Tornar endavant», «Traduir», «Comentar» i «Compartir»;
     · BarraTaronja: el nom de la regió «Autoria i data» (una etiqueta
       explícita mana, com abans);
     · PageFrame: el calaix de l'Índex («Taula de continguts», «Tancar taula»,
       «No s'han trobat seccions.») i la llista «Categories» de la capçalera.
   Fora de l'app (sense traductor), el valencià de sempre: cap atribut ni
   text canvia (Llei del Píxel). */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';

const mocks = vi.hoisted(() => ({ t: null, toast: vi.fn(), ui: { externalConfig: {} } }));
vi.mock('../../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIState: () => mocks.ui,
  useUIActionsOpcional: () => (mocks.t ? { t: mocks.t } : null)
}));
import { BarraBlava } from './BarraBlava.jsx';
import { BarraTaronja } from './BarraTaronja.jsx';
import { TEXTOS_BARRA, TEXTOS_INDEX } from './textosBarres.js';
import { PageFrame } from '../PageFrame.jsx';

beforeEach(() => {
  mocks.t = null;
  mocks.toast.mockClear();
});
afterEach(() => cleanup());

const enAngles = () => { mocks.t = createTranslator('en'); };
const BARRA = {
  onBack: () => {}, onForward: () => {}, onIndex: () => {},
  traduirVisible: true, comentarVisible: true, compartirVisible: true,
  onTranslate: () => {}, onComment: () => {}, onShare: () => {}
};
/* [aria-label, title] de cada botó de la barra blava, en l'ordre del DOM. */
const nomsDeLaBarra = (container) => [...container.querySelectorAll('header.bar-blue button')]
  .map((boto) => [boto.getAttribute('aria-label'), boto.getAttribute('title')]);
const parells = (...noms) => noms.map((nom) => [nom, nom]);
const AUTORIA = { authorName: 'Pepa', authorLocation: 'La Torre de les Maçanes' };

describe('les reserves són el valencià del diccionari', () => {
  test('cada parell de TEXTOS_BARRA i TEXTOS_INDEX: la reserva és el valor de ca', () => {
    const ca = createTranslator('ca');
    for (const [clau, reserva] of [...Object.values(TEXTOS_BARRA), ...Object.values(TEXTOS_INDEX)]) {
      expect([clau, ca(clau)]).toEqual([clau, reserva]);
    }
  });
});

describe('en anglés', () => {
  test('BarraBlava: els sis botons es diuen en anglés (aria-label i title)', () => {
    enAngles();
    const { container } = render(<BarraBlava {...BARRA} />);
    expect(nomsDeLaBarra(container)).toEqual(parells('Go back', 'Section index', 'Go forward', 'Translate', 'Comment', 'Share'));
  });

  test('BarraTaronja: la regió es diu «Author and date»; una etiqueta explícita mana', () => {
    enAngles();
    render(<BarraTaronja {...AUTORIA} />);
    expect(screen.getByRole('region', { name: 'Author and date' })).toBeTruthy();
    cleanup();
    render(<BarraTaronja {...AUTORIA} etiqueta="Autoria i data (espècimen)" />);
    expect(screen.getByRole('region', { name: 'Autoria i data (espècimen)' })).toBeTruthy();
  });

  test('PageFrame: el calaix de l’Índex, buit, i la llista de categories', () => {
    enAngles();
    const { container } = render(
      <PageFrame chrome="full" title="Notícia" labels={['Festes']}><p>Text.</p></PageFrame>
    );
    expect(container.querySelector('header.page-title ul.sp-card-labels').getAttribute('aria-label')).toBe('Categories');
    fireEvent.click(screen.getByRole('button', { name: 'Section index' }));
    const calaix = screen.getByRole('dialog', { name: 'Table of contents' });
    expect(within(calaix).getByRole('button', { name: 'Close the table of contents' })).toBeTruthy();
    // L'H1 de la capçalera hi entra: sense títol, el calaix és buit.
    cleanup();
    render(<PageFrame chrome="full" labels={['Festes']}><p>Text.</p></PageFrame>);
    fireEvent.click(screen.getByRole('button', { name: 'Section index' }));
    expect(screen.getByRole('dialog', { name: 'Table of contents' }).querySelector('.toc-empty').textContent).toBe('No sections found.');
  });

  test('PageFrame en castellà: la llista de categories es diu «Categorías»', () => {
    mocks.t = createTranslator('es');
    const { container } = render(<PageFrame chrome="full" title="Noticia" labels={['Fiestas']}><p>Texto.</p></PageFrame>);
    expect(container.querySelector('header.page-title ul.sp-card-labels').getAttribute('aria-label')).toBe('Categorías');
  });
});

/* Gauntlet 2 · 261101 (G2-T7-03) · En basc, «itzuli» és alhora «traduir» i
   «tornar»: l'app ja diu «Itzuli» als botons de Tornar (common.back,
   section.detail.back, section.notes.back, section.xat.torna). Traduir obri el
   menú de traducció i es diu «Itzulpena»: cap botó de la barra no comparteix
   nom amb un de Tornar. */
describe('en basc', () => {
  test('BarraBlava: Traduir es diu «Itzulpena», i cap nom de la barra és el d’un botó de Tornar', () => {
    mocks.t = createTranslator('eu');
    const { container } = render(<BarraBlava {...BARRA} />);
    const noms = nomsDeLaBarra(container).map(([nom]) => nom);
    expect(noms[3]).toBe('Itzulpena');
    const tornar = ['common.back', 'section.detail.back', 'section.notes.back', 'section.xat.torna'].map((clau) => mocks.t(clau));
    expect(tornar).toEqual(['Itzuli', 'Itzuli', 'Itzuli', 'Itzuli']);
    expect(noms.filter((nom) => tornar.includes(nom))).toEqual([]);
  });
});

describe('sense traductor (fora de l’app): el valencià de sempre', () => {
  test('BarraBlava, BarraTaronja, el calaix de l’Índex i «Categories»', () => {
    const { container } = render(<BarraBlava {...BARRA} />);
    expect(nomsDeLaBarra(container)).toEqual(parells('Tornar arrere', 'Índex de secció', 'Tornar endavant', 'Traduir', 'Comentar', 'Compartir'));
    cleanup();
    render(<BarraTaronja {...AUTORIA} />);
    expect(screen.getByRole('region', { name: 'Autoria i data' })).toBeTruthy();
    cleanup();
    const pagina = render(<PageFrame chrome="full" labels={['Festes']}><p>Text.</p></PageFrame>).container;
    expect(pagina.querySelector('header.page-title ul.sp-card-labels').getAttribute('aria-label')).toBe('Categories');
    fireEvent.click(screen.getByRole('button', { name: 'Índex de secció' }));
    const calaix = screen.getByRole('dialog', { name: 'Taula de continguts' });
    expect(calaix.querySelector('#toc-title').textContent).toBe('Taula de continguts');
    expect(calaix.querySelector('.toc-close-btn').getAttribute('aria-label')).toBe('Tancar taula');
    expect(calaix.querySelector('.toc-empty').textContent).toBe("No s'han trobat seccions.");
  });
});
