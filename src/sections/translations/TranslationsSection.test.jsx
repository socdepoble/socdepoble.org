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
import { fixaTraductorLliure } from '../../data/traductorDelLloc.js';

/* Gauntlet 261030 (cicle 2, traduccions-actiu-a-app-nativa) · Com a la web
   (main.jsx fixa el transport lliure): Traduir hi traduïx. L'app nativa, que
   no el fixa, té la seua prova. */
afterEach(() => { cleanup(); fixaTraductorLliure(null); });
beforeEach(() => { vi.clearAllMocks(); m.language = 'ca'; m.pagina = null; fixaTraductorLliure('apertium'); });

const seccio = (nom) => screen.getByRole('region', { name: nom });
const targetaDe = (llengua) => screen.getByRole('heading', { level: 3, name: llengua }).closest('article');

/* Derogat «sense logos» (ordre del Mestre, 261004, norma dels logotips): la
   pàgina signa Sóc de Poble (sense autor propi) i PageFrame hi pinta el seu
   logotip dalt de l'H1 (PageFrame.logo.test.jsx). Ací es mira que la secció
   no el lleva: ni senseLogo ni cap autoria pròpia. */
test('la pàgina existix i no és buida: crom de sistema, signada per Sóc de Poble (amb el seu logotip), tres seccions de targetes', () => {
  const { container } = render(<TranslationsSection />);
  expect(m.pagina.chrome).toBe('system');
  expect(m.pagina.senseLogo).toBeUndefined();
  expect(m.pagina.authorName).toBeUndefined();
  expect(m.pagina.authorHref).toBeUndefined();
  expect(m.pagina.title).toBe('Traduccions i llengua');
  expect(seccio('Idioma del Sistema')).toBeTruthy();
  expect(seccio('Traductor Sobirà de Pàgines')).toBeTruthy();
  expect(seccio('Traducció Dinàmica de Targetes')).toBeTruthy();
  expect(container.querySelectorAll('article.sp-card')).toHaveLength(SUPPORTED_LANGUAGES.length + 4);
});

/* IDEA-31 (C0545-S2) · El Traductor Sobirà de pàgines ja funciona: es diu,
   amb veritat, abans de la traducció de targetes, que continua en obres. */
test('el Traductor Sobirà de Pàgines es declara ACTIU, amb Apertium i MyMemory dits amb veritat, abans de les targetes', () => {
  render(<TranslationsSection />);
  const titols = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(titols).toEqual(['Idioma del Sistema', 'Traductor Sobirà de Pàgines', 'Traducció Dinàmica de Targetes']);
  const pagines = seccio('Traductor Sobirà de Pàgines');
  const targeta = within(pagines).getByRole('heading', { level: 3, name: 'Botó Traduir de la Barra Blava' }).closest('article');
  expect(within(targeta).getByText('ACTIU').classList.contains('sdp-badge-system')).toBe(true);
  expect(within(targeta).queryByText('EN OBRES')).toBeNull();
  const text = targeta.textContent;
  /* Cicle 2 (261030): el gallec i el basc al menú; MyMemory per al basc i
     l'alemany (decisions §1 i §6): els textos públics diuen la veritat. */
  expect(text).toMatch(/al castellà, al gallec, al basc, a l’anglés, al francés i a l’alemany/);
  expect(text).toMatch(/Per al castellà, el gallec, l’anglés i el francés ho fa amb Apertium, un traductor de programari lliure/);
  expect(text).toMatch(/Per al basc i l’alemany, que Apertium no oferix des del valencià, ho fa amb MyMemory, el servei de l’empresa italiana Translated, que no diu quin motor automàtic fa servir/);
  // Privacitat (ampliació del Mestre 261030): on va el text i qui veu la IP.
  expect(text).toMatch(/Només quan tries una llengua, el text de la pàgina ix cap al traductor/);
  expect(text).toMatch(/a socdepoble\.org, des del teu navegador directament al servei, que veu la teua adreça IP/);
  expect(text).toMatch(/en un lloc amb servidor propi, com WordPress, a través d’eixe servidor/);
  expect(text).toMatch(/MyMemory pot guardar els textos que rep i registrar l’adreça IP/);
  expect(text).toMatch(/només es traduïx el text de les pàgines públiques, mai els teus missatges ni les teues notes/);
  expect(text).toMatch(/On no hi ha traducció, el botó ho diu/);
  expect(text).not.toMatch(/aplicació nativa/);
});

/* Gauntlet 261030 (cicle 2, traduccions-actiu-a-app-nativa) · A l'app nativa
   (natiu/entrada.jsx no fixa cap transport ni hi ha cap servei), Traduir encara
   no traduïx: la targeta no diu «Actiu» i ho diu primer, com la pàgina legal. */
test('a l’app nativa (cap servei ni transport lliure): la targeta diu «En obres» i que el botó encara no traduïx', () => {
  fixaTraductorLliure(null);
  render(<TranslationsSection />);
  const targeta = within(seccio('Traductor Sobirà de Pàgines')).getByRole('heading', { level: 3, name: 'Botó Traduir de la Barra Blava' }).closest('article');
  expect(within(targeta).queryByText('ACTIU')).toBeNull();
  expect(within(targeta).getByText('EN OBRES').classList.contains('sdp-badge-tag')).toBe(true);
  expect(targeta.textContent).toMatch(/A l’aplicació nativa, de moment, el botó encara no fa cap traducció: si el prems, t’ho diu\. El botó Traduir de la Barra Blava traduïx/);
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

/* IDEA-31 · Decisions 261030 §6: cap promesa sobre Google que no es puga
   demostrar (MyMemory no diu quin motor fa servir): Google no hi apareix. La
   traducció de targetes continua pendent i no s'atribuïx a cap proveïdor. */
test('el motor de targetes es declara pendent i no s’atribuïx a cap proveïdor', () => {
  const { container } = render(<TranslationsSection />);
  expect(container.textContent).not.toMatch(/Google/);
  const targetes = seccio('Traducció Dinàmica de Targetes');
  expect(targetes.textContent).not.toMatch(/Google|Apertium|DeepL/);
  const motor = targetaDe('Motor de Traducció Integrat');
  expect(within(motor).getByText('EN OBRES').classList.contains('sdp-badge-tag')).toBe(true);
  expect(within(targetaDe('Com utilitzar-ho')).getByText(/Mentre la traducció de targetes no estiga connectada, el botó porta a aquesta pàgina/)).toBeTruthy();
});

test('en una altra llengua la pàgina es tradueix sencera', () => {
  m.language = 'en';
  const { container } = render(<TranslationsSection />);
  expect(seccio('System language')).toBeTruthy();
  expect(seccio('Sovereign page translator')).toBeTruthy();
  expect(seccio('Dynamic card translation')).toBeTruthy();
  expect(within(targetaDe('English')).getByText('ACTIVE')).toBeTruthy();
  expect(container.textContent).not.toMatch(/section\.translations\./);
});

const CLAUS = [
  'title', 'subtitle', 'current', 'status.active', 'status.pending',
  'system.title', 'system.lead', 'badge.own',
  'option.ca', 'option.es', 'option.en', 'option.eu', 'option.gl',
  'pages.title', 'pages.lead', 'pages.card.title', 'pages.card.body', 'pages.card.natiu',
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
    for (const clau of ['title', 'subtitle', 'system.title', 'pages.title', 'dynamic.title']) {
      expect([code, clau, t(`section.translations.${clau}`).endsWith('.')]).toEqual([code, clau, false]);
    }
  }
});
