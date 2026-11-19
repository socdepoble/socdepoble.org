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

const targetaDe = (llengua) => screen.getByRole('heading', { level: 4, name: llengua }).closest('article');

/* Derogat «sense logos» (ordre del Mestre, 261004, norma dels logotips): la
   pàgina signa Sóc de Poble (sense autor propi) i PageFrame hi pinta el seu
   logotip dalt de l'H1 (PageFrame.logo.test.jsx).
   Ordre del Mestre (261118) · Jerarquia Pedra Seca pura: l'entradilla (lead)
   va davall del primer H2 (subtitle de UniversalPage), les 3 seccions van en
   H3 i només els 5 idiomes són targetes d'acció; la resta és prosa H4 + <p>. */
test('jerarquia Pedra Seca pura: lead sota el subtítol de UniversalPage, cap H2 intern, tres H3 i només les 5 ActionCards d’idioma', () => {
  const { container } = render(<TranslationsSection />);
  expect(m.pagina.chrome).toBe('system');
  expect(m.pagina.senseLogo).toBeUndefined();
  expect(m.pagina.authorName).toBeUndefined();
  expect(m.pagina.authorHref).toBeUndefined();
  expect(m.pagina.title).toBe('Traduccions i llengua');
  expect(m.pagina.subtitle).toBe('Gestió d’idiomes del sistema i contingut');
  expect(m.pagina.lead).toMatch(/Aquest ajust canvia l’idioma de tots els menús, botons i interfícies/);
  expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
  const titolsH3 = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
  expect(titolsH3).toEqual(['Idioma del Sistema', 'Traductor per a Pàgines', 'Traducció Dinàmica de Targetes']);
  expect(container.querySelectorAll('article.sp-card')).toHaveLength(SUPPORTED_LANGUAGES.length);
  expect(container.querySelector('.content-wrapper')).toBeNull();
});

/* IDEA-31 (C0545-S2) + Ordre del Mestre (261118) · El Traductor per a Pàgines
   s'explica en prosa escanejable (negretes + enllaços oficials) acompanyada de
   la mostra visual inerta de la Barra Blava + MenuTraduir, i la Traducció
   Dinàmica de Targetes mostra el peu blau de la Targeta Universal. */
test('el Traductor per a Pàgines s’explica amb mostra de Barra Blava, negretes, enllaços vius i veritat legal', () => {
  const { container } = render(<TranslationsSection />);
  const h4Pagines = screen.getByRole('heading', { level: 4, name: 'Botó Traduir de la Barra Blava' });
  expect(h4Pagines.closest('article.sp-card')).toBeNull();

  const mostraBarra = screen.getByTestId('mostra-barra-blava');
  expect(mostraBarra.getAttribute('aria-hidden')).toBe('true');
  expect(mostraBarra.hasAttribute('inert')).toBe(true);
  expect(mostraBarra.querySelector('header.bar-blue')).toBeTruthy();

  const mostraPeu = screen.getByTestId('mostra-peu-targeta');
  expect(mostraPeu.getAttribute('aria-hidden')).toBe('true');
  expect(mostraPeu.hasAttribute('inert')).toBe(true);
  expect(mostraPeu.querySelector('footer.sp-card-footer')).toBeTruthy();

  const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
  expect(hrefs).toEqual(expect.arrayContaining([
    'https://www.apertium.org/',
    'https://mymemory.translated.net/',
    'https://translated.com/',
    'https://wordpress.org/',
    '/disseny?categoria=fonaments&item=fonaments-controls-barra',
    '/legal',
    '/mur',
    '/xat',
    '/mercat',
    '/calendari'
  ]));
  expect(container.querySelectorAll('strong').length).toBeGreaterThanOrEqual(20);

  const text = container.textContent;
  expect(text).toMatch(/al castellà, al gallec, al basc, a l’anglés, al francés i a l’alemany/);
  expect(text).toMatch(/Per al castellà, el gallec, l’anglés i el francés ho fa amb Apertium, un traductor de programari lliure/);
  expect(text).toMatch(/Per al basc i l’alemany, que Apertium no oferix des del valencià, ho fa amb MyMemory, el servei de l’empresa italiana Translated, que no diu quin motor automàtic fa servir/);
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
   no traduïx: la prosa mostra l'avís «En obres» abans de l'explicació general. */
test('a l’app nativa (cap servei ni transport lliure): la prosa avisa «En obres» i que el botó encara no traduïx', () => {
  fixaTraductorLliure(null);
  const { container } = render(<TranslationsSection />);
  expect(container.textContent).toMatch(/En obres:\s*A l’aplicació nativa, de moment, el botó encara no fa cap traducció: si el prems, t’ho diu\./);
});

test('Valencià va primer i destacat com a llengua pròpia; la resta conserva l’ordre', () => {
  const { container } = render(<TranslationsSection />);
  const graella = container.querySelector('.sdp-card-grid');
  const titols = [...graella.querySelectorAll('h4.sp-card-title')].map((h) => h.textContent);
  expect(titols).toEqual(['Valencià', 'Castellà', 'English', 'Euskara', 'Galego']);
  const valencia = targetaDe('Valencià');
  expect(valencia.classList.contains('sp-card--action')).toBe(true);
  expect(within(valencia).getByText('LLENGUA PRÒPIA').classList.contains('sdp-badge-accent')).toBe(true);
  expect(within(targetaDe('Castellà')).queryByText('LLENGUA PRÒPIA')).toBeNull();
});

test('la llengua activa porta ACTIU i l’estat s’anuncia per al lector de pantalla', () => {
  m.language = 'es';
  const { container } = render(<TranslationsSection />);
  expect(screen.getByRole('status').textContent).toBe('Idioma actual: Castellà');
  const graella = container.querySelector('.sdp-card-grid');
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
  // Un SVG amb viewBox i sense width ni .icon s'estira a tot l'ample: era l'«SVG gegant».
  expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  expect(container.querySelectorAll('svg:not([width]):not(.icon)')).toHaveLength(0);
  expect(container.querySelector('hr')).toBeNull();
});

/* IDEA-31 · Decisions 261030 §6 + Ordre del Mestre (261118): els tres apartats
   de Traducció Dinàmica de Targetes van en H4 de prosa pura (sense targetes),
   no mencionen Google i expliquen què fa el botó mentre estiga pendent. */
test('el bloc de traducció dinàmica de targetes va en prosa H4 (Motor, Com utilitzar-ho, Nota) i no s’atribuïx a cap proveïdor', () => {
  const { container } = render(<TranslationsSection />);
  expect(container.textContent).not.toMatch(/Google|DeepL/);
  for (const subtitol of ['Motor de Traducció Integrat', 'Com utilitzar-ho', 'Nota']) {
    const h4 = screen.getByRole('heading', { level: 4, name: subtitol });
    expect(h4.closest('article.sp-card')).toBeNull();
  }
  expect(screen.getByText((_c, node) => node?.tagName === 'P' && /Mentre la traducció de targetes no estiga connectada, el botó porta a aquesta pàgina/.test(node.textContent))).toBeTruthy();
});

test('en una altra llengua la pàgina es tradueix sencera amb tots els H3 i H4', () => {
  m.language = 'en';
  const { container } = render(<TranslationsSection />);
  expect(m.pagina.lead).toMatch(/This setting changes the language of every menu, button and screen/);
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
    'System language',
    'Page translator',
    'Dynamic card translation'
  ]);
  expect(screen.getByRole('heading', { level: 4, name: 'The «Traduir» (Translate) button on the blue bar' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 4, name: 'Built-in translation engine' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 4, name: 'How to use it' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 4, name: 'Note' })).toBeTruthy();
  expect(within(targetaDe('English')).getByText('ACTIVE')).toBeTruthy();
  expect(container.textContent).toMatch(/Live sample of the page’s blue bar/);
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
