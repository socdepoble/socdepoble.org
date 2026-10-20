/**
 * Proves de /traduccions (pla 260924_1850 §4): la pàgina viu de les targetes
 * unificades, Valencià va primer i destacat, la llengua activa es llig també
 * amb lector de pantalla i no torna cap fantasma de l'HTML antic.
 * El traductor és el real (createTranslator): les claus es proven de veritat.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n';
/* El diccionari no s'exporta: es compta sobre el text de la font. */
import { FONT_DELS_DICCIONARIS as fontI18n } from '../../../tests/helpers/diccionaris.js';

const m = vi.hoisted(() => ({ language: 'ca', setLanguage: vi.fn(), navigate: vi.fn(), pagina: null }));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement: h } = await import('react');
  return {
    useNavigate: () => m.navigate,
    Link: ({ to, children, ...resta }) => h('a', { href: to, ...resta }, children)
  };
});
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
/* El marc de pàgina té les seues proves: ací només es mira què li demana la secció. */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => { m.pagina = props; return <div>{props.children}</div>; }
}));
vi.mock('../../app/contexts/UIContext', async () => {
  const { createTranslator: tradueix } = await import('../../config/i18n');
  return {
    useUIState: () => ({ language: m.language, locale: `${m.language}-ES` }),
    useUIActions: () => ({ setLanguage: m.setLanguage, t: tradueix(m.language) })
  };
});

import TranslationsSection from './TranslationsSection';

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); m.language = 'ca'; m.pagina = null; });

const seccio = (nom) => screen.getByRole('region', { name: nom });
const targetaDe = (llengua) => screen.getByRole('heading', { level: 3, name: llengua }).closest('article');

/* Derogat «sense logos» (ordre del Mestre, 261004, norma dels logotips): la
   pàgina signa Sóc de Poble (sense autor propi) i PageFrame hi pinta el seu
   logotip dalt de l'H1 (PageFrame.logo.test.jsx). Ací es mira que la secció
   no el lleva: ni senseLogo ni cap autoria pròpia. */
test('la pàgina existix i no és buida: crom de sistema, signada per Sóc de Poble (amb el seu logotip), dues seccions de targetes', () => {
  const { container } = render(<TranslationsSection />);
  expect(m.pagina.chrome).toBe('system');
  expect(m.pagina.senseLogo).toBeUndefined();
  expect(m.pagina.authorName).toBeUndefined();
  expect(m.pagina.authorHref).toBeUndefined();
  expect(m.pagina.title).toBe('Traduccions i llengua');
  expect(seccio('Idioma del Sistema')).toBeTruthy();
  expect(seccio('Traducció Dinàmica de Targetes')).toBeTruthy();
  expect(container.querySelectorAll('article.sp-card')).toHaveLength(SUPPORTED_LANGUAGES.length + 3);
});

test('Valencià va primer i destacat com a llengua pròpia; la resta conserva l’ordre', () => {
  render(<TranslationsSection />);
  const titols = within(seccio('Idioma del Sistema')).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
  expect(titols).toEqual(['Valencià', 'Castellà', 'English', 'Euskara', 'Galego']);
  const valencia = targetaDe('Valencià');
  expect(valencia.classList.contains('sp-card--action')).toBe(true);
  expect(within(valencia).getByText('LLENGUA PRÒPIA').classList.contains('sdp-badge-accent')).toBe(true);
  expect(within(targetaDe('Castellà')).queryByText('LLENGUA PRÒPIA')).toBeNull();
});

test('la llengua activa porta ACTIU i l’estat s’anuncia per al lector de pantalla', () => {
  m.language = 'es';
  render(<TranslationsSection />);
  expect(screen.getByRole('status').textContent).toBe('Idioma actual: Castellà');
  const graella = seccio('Idioma del sistema');
  expect(within(graella).getAllByText('ACTIVO')).toHaveLength(1);
  expect(within(targetaDe('Castellà')).getByText('ACTIVO').classList.contains('sdp-badge-system')).toBe(true);
  expect(within(targetaDe('Valencià')).queryByText('ACTIVO')).toBeNull();
  // La llengua pròpia es destaca encara que no siga l'activa.
  expect(within(targetaDe('Valencià')).getByText('LENGUA PROPIA')).toBeTruthy();
});

test('clicar una llengua crida setLanguage amb el seu codi', () => {
  render(<TranslationsSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Euskara' }));
  expect(m.setLanguage).toHaveBeenCalledTimes(1);
  expect(m.setLanguage).toHaveBeenCalledWith('eu');
});

test('cap fantasma: ni classes .card/.pill antigues ni SVG sense mida', () => {
  const { container } = render(<TranslationsSection />);
  expect(container.querySelector('.card, .card__body, .card__title, .card__text, .pill, .sdp-llista')).toBeNull();
  // Un SVG amb viewBox i sense width s'estira a tot l'ample: era l'«SVG gegant».
  expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  expect(container.querySelectorAll('svg:not([width])')).toHaveLength(0);
  expect(container.querySelector('hr')).toBeNull();
});

test('el motor de traducció es declara pendent i no s’atribuïx a cap proveïdor', () => {
  const { container } = render(<TranslationsSection />);
  expect(container.textContent).not.toMatch(/Google/);
  const motor = targetaDe('Motor de Traducció Integrat');
  expect(within(motor).getByText('EN OBRES').classList.contains('sdp-badge-tag')).toBe(true);
  expect(within(targetaDe('Com utilitzar-ho')).getByText(/el botó porta a aquesta pàgina/)).toBeTruthy();
});

test('en una altra llengua la pàgina es tradueix sencera', () => {
  m.language = 'en';
  const { container } = render(<TranslationsSection />);
  expect(seccio('System language')).toBeTruthy();
  expect(seccio('Dynamic card translation')).toBeTruthy();
  expect(within(targetaDe('English')).getByText('ACTIVE')).toBeTruthy();
  expect(container.textContent).not.toMatch(/section\.translations\./);
});

const CLAUS = [
  'title', 'subtitle', 'current', 'status.active', 'status.pending',
  'system.title', 'system.lead', 'badge.own',
  'option.ca', 'option.es', 'option.en', 'option.eu', 'option.gl',
  'dynamic.title', 'dynamic.lead', 'engine.title', 'engine.body',
  'howto.title', 'howto.body', 'note.title', 'note.body'
].map((clau) => `section.translations.${clau}`);

test('cada clau de la pàgina existix una vegada per llengua al diccionari', () => {
  for (const clau of CLAUS) {
    const vegades = fontI18n.split(`'${clau}':`).length - 1;
    expect([clau, vegades]).toEqual([clau, SUPPORTED_LANGUAGES.length]);
  }
});

test('cap títol (h1/h2) acaba en punt, en cap llengua', () => {
  for (const { code } of SUPPORTED_LANGUAGES) {
    const t = createTranslator(code);
    for (const clau of ['title', 'subtitle', 'system.title', 'dynamic.title']) {
      expect([code, clau, t(`section.translations.${clau}`).endsWith('.')]).toEqual([code, clau, false]);
    }
  }
});
