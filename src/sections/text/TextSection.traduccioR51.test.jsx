/* R51 (P0-46 / IDEA-177) · TextSection consumix el pla de traducció
   (planTraduccioPagina.js). L'arnés de TextSection.appNativa.test.jsx: la
   pàgina reduïda als seus fills, amb les props a la vista. */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ props: null, language: 'en', t: (_, alternativa) => alternativa }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t, language: mocks.language }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, ...props }) => {
    mocks.props = props;
    return React.createElement('div', { 'data-pagina': '' }, children);
  }
}));
import TextSection from './TextSection.jsx';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const revisades = () => Object.fromEntries(LLENGUES.map((llengua) => [llengua, { title: `Títol ${llengua}`, html: `<p>Cos ${llengua}</p>`, reviewed: true }]));
const pagina = (extra) => ({
  title: 'Títol ca', subtitle: 'Subtítol ca', html: '<p>Cos ca</p>', date: '2026-11-06T09:00:00.000Z', source_language: 'ca',
  translations: { en: { title: 'Old English title', html: '<p>Old English body</p>' } }, ...extra
});
const cos = () => document.querySelector('[data-pagina] .cms-preview');
const AVIS = 'Esta pàgina no té la traducció ben configurada: es mostra en la llengua original, sense traducció automàtica.';

afterEach(cleanup);
beforeEach(() => { mocks.props = null; mocks.language = 'en'; });

test('sense translation_mode, el camí de sempre: la traducció antiga i cap prop nova', () => {
  render(<TextSection page={pagina({})} pageKey="prova-r51" />);
  expect(mocks.props.title).toBe('Old English title');
  expect(cos().textContent).toBe('Old English body');
  expect(mocks.props).not.toHaveProperty('traduccio');
  expect(screen.queryByText(AVIS)).toBeNull();
});

test('none: l’original, sense Traduir (traduccio={false}) i sense la traducció antiga', () => {
  render(<TextSection page={pagina({ translation_mode: 'none' })} pageKey="prova-r51" />);
  expect(mocks.props.title).toBe('Títol ca');
  expect(cos().textContent).toBe('Cos ca');
  expect(mocks.props.traduccio).toBe(false);
  expect(mocks.props.llenguaDelContingut).toBe('ca');
});

test('on_the_fly: l’original i el Traduir de sempre (cap prop traduccio)', () => {
  render(<TextSection page={pagina({ translation_mode: 'on_the_fly' })} pageKey="prova-r51" />);
  expect(mocks.props.title).toBe('Títol ca');
  expect(mocks.props).not.toHaveProperty('traduccio');
});

test('curated: el títol i el cos revisats, sanejats pel mateix camí, en la llengua de destinació', () => {
  const translations = revisades();
  translations.en.html = '<p>Cos en</p><script>alert(1)</script><img src="x" onerror="alert(2)">';
  render(<TextSection page={pagina({ translation_mode: 'curated_5_langs', translations })} pageKey="prova-r51" />);
  expect(mocks.props.title).toBe('Títol en');
  expect(cos().textContent).toBe('Cos en');
  expect(cos().querySelector('script')).toBeNull();
  expect(cos().innerHTML).not.toContain('onerror');
  expect(mocks.props.traduccio).toBe(false);
  expect(mocks.props.llenguaDelContingut).toBe('en');
});

test('curated incomplet: l’original, un avís accessible i cap Traduir (mai Apertium callat)', () => {
  render(<TextSection page={pagina({ translation_mode: 'curated_5_langs' })} pageKey="prova-r51" />);
  expect(mocks.props.title).toBe('Títol ca');
  expect(cos().textContent).toBe('Cos ca');
  expect(mocks.props.traduccio).toBe(false);
  expect(screen.getByRole('status').textContent).toContain(AVIS);
});
