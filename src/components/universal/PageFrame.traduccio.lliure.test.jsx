import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), ui: { externalConfig: {} }, accions: null }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
/* Cicle 2 · useUIActionsOpcional: el traductor de la interfície (null, com
   abans, llevat de la prova de la llengua de la interfície). */
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => mocks.ui, useUIActionsOpcional: () => mocks.accions }));
import { UniversalPage } from './UniversalPage.jsx';
import { AVIS_SENSE_TRADUCTOR, buidaCauTraduccions } from '../PedraSeca/hooks/useTraduccioPagina.js';
import { AVIS_TRADUIT, VEURE_ORIGINAL } from './traduccio/TraduccioPagina.jsx';
import { NOM_MENU_TRADUIR } from './traduccio/MenuTraduir.jsx';
import { useLlenguaDelContingut } from './traduccio/llenguaDelContingut.js';
import { APERTIUM_BETA, MYMEMORY, buidaSessioLliure, fixaTraductorLliure } from '../../data/traductorLliure.js';
import { createTranslator } from '../../config/i18n.js';
// Els cinc diccionaris abans de cap prova (createTranslator('eu') parla basc).
import '../../../tests/helpers/diccionaris.js';

/* IDEA-31 · Ampliació del Mestre (261030): a socdepoble.org (estàtic, sense
   traductorUrl) Traduir va des del navegador a Apertium, si l'entrada pròpia
   ho ha fixat. Un servei del mateix origen sempre mana, i un amfitrió no el
   pot activar amb cap clau de configuració. La vista no canvia. */

const URL_SERVEI = '/wp-json/socdepoble/v1/traduir';
const TEXTOS = ['La festa del poble', 'Programa', 'Tres dies de festa.', 'Divendres', 'Sopar a la plaça.', 'Música', 'Ball'];

const Pagina = (props) => (
  <UniversalPage chrome="context" title="La festa del poble" subtitle="Programa" lead="Tres dies de festa." {...props}>
    <section>
      <h3>Divendres</h3>
      <p>Sopar a la plaça.</p>
      <ul><li>Música</li><li>Ball</li></ul>
    </section>
  </UniversalPage>
);

const respostaJson = (status, cos) => ({ ok: status >= 200 && status < 300, status, json: async () => cos });
/* Apertium respon «eng:text» (en HTML, el text de fora de les etiquetes en
   majúscules); MyMemory, «de:text»; el servei del mateix origen, «[srv] text». */
const fetchFals = () => vi.fn(async (url, opcions) => {
  if (String(url).startsWith(`${MYMEMORY}?`)) {
    const consulta = new URL(url).searchParams;
    const traduccio = `${consulta.get('langpair').split('|')[1]}:${consulta.get('q')}`;
    /* La forma real (261030): la traducció del motor és l'entrada «MT!» de
       `matches`, amb el segment enviat (només eixa val, cicle 2). */
    return respostaJson(200, {
      responseData: { translatedText: traduccio, match: 0.85 },
      quotaFinished: false, responseDetails: '', responseStatus: 200,
      matches: [{ id: 0, segment: consulta.get('q'), translation: traduccio, 'created-by': 'MT!', match: 0.85 }],
    });
  }
  if (opcions.body instanceof URLSearchParams) {
    const q = opcions.body.get('q');
    const traduit = opcions.body.get('format') === 'html'
      ? q.replace(/(^|>)([^<]*)/g, (_, tanca, text) => `${tanca}${text.toUpperCase()}`)
      : `${opcions.body.get('langpair').split('|')[1]}:${q}`;
    return respostaJson(200, { responseData: { translatedText: traduit }, responseDetails: null, responseStatus: 200 });
  }
  const { textos, desti } = JSON.parse(opcions.body);
  return respostaJson(200, { traduccions: textos.map((text) => `[srv] ${text}`), origen: 'CA', desti, cache: false });
});

const traduir = (container) => container.querySelector('header.bar-blue button[aria-label="Traduir"]');
const traduit = (container) => container.querySelector('article.sdp-traduccio-cos');
const avis = (container) => container.querySelector('.sdp-avis-traduccio');
const tria = async (container, nom) => {
  fireEvent.click(traduir(container));
  await act(async () => {
    fireEvent.click(within(screen.getByRole('menu', { name: NOM_MENU_TRADUIR })).getByRole('menuitemradio', { name: nom }));
  });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
};

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.toast.mockReset();
  mocks.ui = { externalConfig: {} };
  mocks.accions = null;
  buidaCauTraduccions();
  buidaSessioLliure();
  window.history.replaceState(null, '', '/festes');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  fixaTraductorLliure(null);
});

test('sense servei i amb el transport lliure fixat: Traduir → Anglés traduïx des del navegador, amb la beta d’Apertium', async () => {
  fixaTraductorLliure('apertium');
  const fetch = fetchFals();
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<Pagina />);
  expect(traduir(container).getAttribute('aria-haspopup')).toBe('menu');
  await tria(container, 'Anglés');
  expect(fetch.mock.calls.map(([url]) => url)).toEqual(TEXTOS.map(() => APERTIUM_BETA));
  expect(fetch.mock.calls.map(([, opcions]) => [opcions.body.get('langpair'), opcions.credentials])).toEqual(TEXTOS.map(() => ['cat|eng', 'omit']));
  expect(container.querySelector('h1').textContent).toBe('eng:La festa del poble');
  expect(container.querySelector('h1').getAttribute('lang')).toBe('en-GB');
  expect(traduit(container).textContent).toContain('eng:Sopar a la plaça.');
  expect(avis(container).textContent).toContain(AVIS_TRADUIT);
  expect(mocks.toast).not.toHaveBeenCalled();
});

test('un servei del mateix origen mana damunt del transport lliure', async () => {
  fixaTraductorLliure('apertium');
  mocks.ui = { externalConfig: { traductorUrl: URL_SERVEI } };
  const fetch = fetchFals();
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<Pagina />);
  await tria(container, 'Anglés');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toBe(`${window.location.origin}${URL_SERVEI}`);
  expect(container.querySelector('h1').textContent).toBe('[srv] La festa del poble');
});

/* Gauntlet 261030 (Fase 3, TC3.1; traduir-eu-de-servidor-503) · L'amfitrió
   declara els destins del seu servei (traductorLlengues: WordPress amb
   marcatge.php, :3340 amb main.jsx). Com a :3340: el transport lliure fixat
   i el servei de desenvolupament, que no servix EU ni DE. Un destí no
   declarat dona el mateix avís que el 503 d'abans, però sense cap petició;
   el menú no canvia (Llei del Píxel). */
test('TC3.1 · destins declarats pel servei: Basc i Alemany avisen sense cap petició, Castellà va al servei i el menú no canvia', async () => {
  fixaTraductorLliure('apertium');
  for (const traductorLlengues of [['ES', 'GL', 'EN-GB', 'FR'], 'ES GL EN-GB FR']) {
    mocks.toast.mockReset();
    buidaCauTraduccions();
    mocks.ui = { externalConfig: { traductorUrl: URL_SERVEI, traductorLlengues } };
    const fetch = fetchFals();
    vi.stubGlobal('fetch', fetch);
    const { container, unmount } = render(<Pagina />);
    fireEvent.click(traduir(container));
    expect(within(screen.getByRole('menu', { name: NOM_MENU_TRADUIR })).getAllByRole('menuitemradio').map((fila) => fila.textContent))
      .toEqual(['Castellà', 'Gallec', 'Basc', 'Anglés', 'Francés', 'Alemany']);
    fireEvent.click(traduir(container));
    for (const nom of ['Basc', 'Alemany']) {
      await tria(container, nom);
      expect(fetch).not.toHaveBeenCalled();
      expect(mocks.toast).toHaveBeenLastCalledWith(AVIS_SENSE_TRADUCTOR);
      expect(traduit(container)).toBeNull();
      expect(avis(container)).toBeNull();
    }
    await tria(container, 'Castellà');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe(`${window.location.origin}${URL_SERVEI}`);
    expect(JSON.parse(fetch.mock.calls[0][1].body).desti).toBe('ES');
    expect(container.querySelector('h1').textContent).toBe('[srv] La festa del poble');
    unmount();
  }
});

test('TC3.1 · sense la declaració (amfitrions vells), com abans: el Basc va al servei del mateix origen', async () => {
  mocks.ui = { externalConfig: { traductorUrl: URL_SERVEI } };
  const fetch = fetchFals();
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<Pagina />);
  await tria(container, 'Basc');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toBe(`${window.location.origin}${URL_SERVEI}`);
  expect(JSON.parse(fetch.mock.calls[0][1].body).desti).toBe('EU');
});

test('un amfitrió no el pot activar amb la configuració: sense l’entrada pròpia, l’avís honest i cap petició', () => {
  mocks.ui = { externalConfig: { traductorLliure: 'apertium', traductor: 'apertium', transport: 'apertium' } };
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<Pagina />);
  expect(traduir(container).hasAttribute('aria-haspopup')).toBe(false);
  fireEvent.click(traduir(container));
  expect(mocks.toast).toHaveBeenCalledWith(AVIS_SENSE_TRADUCTOR);
  expect(screen.queryByRole('menu')).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

/* Ordre del Mestre de la nit (261030, G3) i decisions de l'orquestrador
   (03:25, §4): l'alemany i el basc, que Apertium no oferix des del català,
   van a MyMemory amb un GET simple; el gallec, a la beta d'Apertium i prou. */
test('Alemany i basc amb el transport lliure: MyMemory, un GET simple sense capçaleres, cos, `de`, `ip` ni `key`', async () => {
  fixaTraductorLliure('apertium');
  const fetch = fetchFals();
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<Pagina />);
  await tria(container, 'Alemany');
  expect(fetch).toHaveBeenCalledTimes(TEXTOS.length);
  for (const [url, opcions] of fetch.mock.calls) {
    const adreca = new URL(url);
    expect(`${adreca.origin}${adreca.pathname}`).toBe(MYMEMORY);
    expect([...adreca.searchParams.keys()]).toEqual(['q', 'langpair']);
    expect(adreca.searchParams.get('langpair')).toBe('ca|de');
    expect(opcions).toMatchObject({ method: 'GET', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', redirect: 'error' });
    expect(opcions.headers).toBeUndefined();
    expect(opcions.body).toBeUndefined();
  }
  expect(fetch.mock.calls.map(([url]) => new URL(url).searchParams.get('q'))).toEqual(TEXTOS);
  expect(container.querySelector('h1').textContent).toBe('de:La festa del poble');
  expect(container.querySelector('h1').getAttribute('lang')).toBe('de');
  expect(traduit(container).textContent).toContain('de:Sopar a la plaça.');
  expect(mocks.toast).not.toHaveBeenCalled();
  await tria(container, 'Basc');
  expect(fetch.mock.calls.slice(TEXTOS.length).map(([url]) => new URL(url).searchParams.get('langpair'))).toEqual(TEXTOS.map(() => 'ca|eu'));
  expect(container.querySelector('h1').getAttribute('lang')).toBe('eu');
});

test('Gallec amb el transport lliure: cat|glg només a la beta d’Apertium, amb format txt', async () => {
  fixaTraductorLliure('apertium');
  const fetch = fetchFals();
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<Pagina />);
  await tria(container, 'Gallec');
  expect(fetch.mock.calls.map(([url, { body }]) => [url, body.get('langpair'), body.get('format')]))
    .toEqual(TEXTOS.map(() => [APERTIUM_BETA, 'cat|glg', 'txt']));
  expect(container.querySelector('h1').textContent).toBe('glg:La festa del poble');
  expect(container.querySelector('h1').getAttribute('lang')).toBe('gl');
});

/* C4 (Codex 261030) i decisió del Mestre (261030 §3) · La traducció conserva
   <ol> (amb el seu start) i <ul>, els enllaços amb el href de l'ORIGINAL i
   les negretes; els noms propis no ixen de la pàgina. */
const PaginaRica = () => (
  <UniversalPage chrome="context" title="Rutes del poble">
    <section>
      <p>Visita el <a href="/mur">Mur del poble</a> i llig <strong>totes</strong> les notícies.</p>
      <ol start="3">
        <li>Primer pas</li>
        <li><a href="https://gentdelatorre.net" target="_blank" rel="noopener noreferrer">Gent de la Torre</a></li>
      </ol>
      <ul><li>Sóc de Poble</li></ul>
    </section>
  </UniversalPage>
);

test('estructura: ol/ul, enllaços de l’arbre original i negretes; cap nom propi ix cap al motor', async () => {
  fixaTraductorLliure('apertium');
  const fetch = fetchFals();
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<PaginaRica />);
  await tria(container, 'Anglés');
  const enviats = fetch.mock.calls.map(([, { body }]) => [body.get('format'), body.get('q')]);
  expect(enviats.some(([, q]) => /Sóc de Poble|Gent de la Torre/.test(q))).toBe(false);
  expect(enviats).toContainEqual(['html', 'Visita el <a data-sdp="0">Mur del poble</a> i llig <strong data-sdp="1">totes</strong> les notícies.']);
  expect(enviats.every(([, q]) => !/href|target|rel=/.test(q))).toBe(true);
  const cos = traduit(container);
  const p = cos.querySelector('p');
  expect(p.textContent).toBe('VISITA EL MUR DEL POBLE I LLIG TOTES LES NOTÍCIES.');
  expect(p.querySelector('a').getAttribute('href')).toBe('/mur');
  expect(p.querySelector('a').textContent).toBe('MUR DEL POBLE');
  expect(p.querySelector('strong').textContent).toBe('TOTES');
  const ol = cos.querySelector('ol');
  expect(ol.getAttribute('start')).toBe('3');
  expect([...ol.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['eng:Primer pas', 'Gent de la Torre']);
  const extern = ol.querySelector('a');
  /* Gauntlet 261030 (cicle 4, traduccio-enllacos-sense-rel-noreferrer) · El
     rel de sanitize.js per a tot enllaç del contingut, també a la traducció. */
  expect([extern.getAttribute('href'), extern.getAttribute('target'), extern.getAttribute('rel')])
    .toEqual(['https://gentdelatorre.net', '_blank', 'noopener noreferrer nofollow']);
  expect(p.querySelector('a').getAttribute('rel')).toBe('noopener noreferrer nofollow');
  expect(cos.querySelector('ul > li').textContent).toBe('eng:Sóc de Poble');
});

/* Gauntlet 261030 (cicle 4, traduccio-llista-niuada-hereta-lang-ca) · El <li>
   que el motor torna igual (en l'original, lang="ca") no passa el seu «ca»
   als elements traduïts de la seua llista niuada: PageFrame dona a
   CosTraduit la llengua de la traducció. */
test('una llista niuada traduïda dins d’un <li> que torna en l’original porta la llengua de la traducció', async () => {
  fixaTraductorLliure('apertium');
  vi.stubGlobal('fetch', fetchFals());
  const { container } = render(
    <UniversalPage chrome="context" title="Sigles">
      <ul><li><strong>RSS</strong> 2026<ul><li>Primer pas</li></ul></li></ul>
    </UniversalPage>
  );
  await tria(container, 'Anglés');
  const cos = traduit(container);
  const [pare, fill] = cos.querySelectorAll('li');
  expect([pare.getAttribute('lang'), fill.textContent]).toEqual(['ca', 'eng:Primer pas']);
  expect(fill.closest('[lang]').getAttribute('lang')).toBe(cos.getAttribute('lang'));
  expect(cos.getAttribute('lang')).not.toBe('ca');
});

/* Una pàgina llarga amb enllaços i negretes: amb les etiquetes passaria dels
   10000 caràcters del pressupost; va per segments i es traduïx igual. */
const PaginaLlarga = () => (
  <UniversalPage chrome="context" title="Llarga">
    <section>
      {Array.from({ length: 60 }, (_, i) => (
        <p key={i}>Paràgraf {i} de la pàgina, amb <a href="/mur">el Mur</a> i <strong>una negreta</strong> per a omplir-la bé de text, amb unes quantes paraules més de farciment.</p>
      ))}
    </section>
  </UniversalPage>
);

test('pàgina llarga amb marques: no passa a «massa llarga» per les etiquetes; els enllaços es conserven', async () => {
  fixaTraductorLliure('apertium');
  mocks.ui = { externalConfig: { traductorUrl: URL_SERVEI } };
  const fetch = fetchFals();
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<PaginaLlarga />);
  const text = container.querySelector('article.content-wrapper').textContent.length;
  // Sense les etiquetes hi cap; amb les etiquetes (uns 50 caràcters per paràgraf), no.
  expect(text).toBeLessThan(10000);
  expect(text + 60 * 50).toBeGreaterThan(10000);
  await tria(container, 'Anglés');
  expect(mocks.toast).not.toHaveBeenCalled();
  const enviats = fetch.mock.calls.map(([, { body }]) => JSON.parse(body));
  expect(enviats.reduce((suma, { textos }) => suma + textos.join('').length, 0)).toBeLessThanOrEqual(10000);
  expect(new Set(enviats.map(({ format }) => format))).toEqual(new Set(['text', 'html']));
  const cos = traduit(container);
  expect([...cos.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(Array.from({ length: 60 }, () => '/mur'));
  // Els primers paràgrafs conserven la negreta; els últims, per segments, no.
  expect(cos.querySelectorAll('strong').length).toBeGreaterThan(30);
  expect(cos.querySelectorAll('strong').length).toBeLessThan(60);
});

/* Decisions 261030 §7 (les pàgines amb contingut privat porten
   traduccio={false}): Gauntlet 261030 (cicle 2) · la prova viu ara a
   PageFrame.traduccio.privades.seguretat.test.js, dins del precommit. */

/* ── Gauntlet 261030 (cicle 2), corrector de l'àrea traductor-client ────── */

const obriIndex = (container) => fireEvent.click(container.querySelector('header.bar-blue button[aria-label="Índex de secció"]'));
const entradesIndex = () => [...document.querySelectorAll('.toc-drawer .toc-nav button')].map((boto) => [boto.textContent, boto.getAttribute('lang')]);

/* traduccio-lang-index-i-blocs-de-reserva · L'Índex va en un portal: cada
   entrada porta el lang de la traducció que llig; sense traducció, cap. */
test('Índex d’una pàgina traduïda: cada entrada amb el lang de la traducció; en l’original, cap lang', async () => {
  fixaTraductorLliure('apertium');
  vi.stubGlobal('fetch', fetchFals());
  const { container } = render(<Pagina />);
  obriIndex(container);
  expect(entradesIndex()).toEqual([['La festa del poble', null], ['Programa', null], ['Divendres', null]]);
  fireEvent.click(document.querySelector('.toc-drawer .toc-close-btn'));
  await tria(container, 'Gallec');
  obriIndex(container);
  expect(entradesIndex()).toEqual([['glg:La festa del poble', 'gl'], ['glg:Programa', 'gl'], ['glg:Divendres', 'gl']]);
});

/* Un text que el motor torna tal com l'ha rebut (o en perd un nom) es queda
   en valencià: el bloc porta lang="ca" dins de l'article gallec, i un títol
   així no porta el lang de la traducció (ni a l'H1 ni a l'Índex). */
test('blocs de reserva: el que torna sense traduir porta lang="ca" dins de l’article traduït, també a l’Índex', async () => {
  fixaTraductorLliure('apertium');
  const SENSE_TRADUIR = new Set(['La festa del poble', 'Divendres', 'Ball']);
  const fetch = vi.fn(async (_, { body }) => {
    const q = body.get('q');
    return respostaJson(200, { responseData: { translatedText: SENSE_TRADUIR.has(q) ? q : `glg:${q}` }, responseDetails: null, responseStatus: 200 });
  });
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<Pagina />);
  await tria(container, 'Gallec');
  const cos = traduit(container);
  expect(cos.getAttribute('lang')).toBe('gl');
  expect([...cos.querySelectorAll('h2, h3, p, li')].map((node) => [node.textContent, node.getAttribute('lang')])).toEqual([
    ['glg:Programa', null], ['glg:Tres dies de festa.', null], ['Divendres', 'ca'], ['glg:Sopar a la plaça.', null], ['glg:Música', null], ['Ball', 'ca'],
  ]);
  const h1 = container.querySelector('h1');
  expect([h1.textContent, h1.getAttribute('lang')]).toEqual(['La festa del poble', null]);
  obriIndex(container);
  expect(entradesIndex()).toEqual([['La festa del poble', null], ['glg:Programa', 'gl'], ['Divendres', 'ca']]);
});

/* traduir-veure-original-focus-a-body · «Veure l'original» desapareix en
   tornar a l'original: el focus va al botó Traduir, no a <body>. */
test('«Veure l’original» porta el focus al botó Traduir (no es perd a <body>)', async () => {
  fixaTraductorLliure('apertium');
  vi.stubGlobal('fetch', fetchFals());
  const { container } = render(<Pagina />);
  await tria(container, 'Castellà');
  const veure = within(avis(container)).getByRole('button', { name: VEURE_ORIGINAL });
  veure.focus();
  await act(async () => { fireEvent.click(veure); });
  expect(traduit(container)).toBeNull();
  expect(avis(container)).toBeNull();
  expect(document.activeElement).toBe(traduir(container));
});

/* menu-traduir-noms-sense-i18n · L'avís, el nom del menú, «Original» i els
   errors ixen en la llengua de la interfície (els noms de les llengües, com
   els va fixar el Mestre). Sense traductor, en valencià (les proves d'abans). */
test('en la llengua de la interfície (euskara): l’error, el nom del menú, «Original» i l’avís de traducció', async () => {
  mocks.accions = { t: createTranslator('eu') };
  const { container, unmount } = render(<Pagina />);
  fireEvent.click(traduir(container));
  expect(mocks.toast).toHaveBeenCalledWith('Itzulpen automatikoa ez dago erabilgarri zerbitzari honetan.');
  unmount();
  fixaTraductorLliure('apertium');
  vi.stubGlobal('fetch', fetchFals());
  const pagina = render(<Pagina />).container;
  fireEvent.click(traduir(pagina));
  expect(screen.getByRole('menu', { name: 'Orria itzuli' })).toBeTruthy();
  await act(async () => {
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: 'Castellà' }));
  });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  expect(avis(pagina).textContent).toContain('Valentzieratik automatikoki itzulia');
  expect(within(avis(pagina)).getByRole('button', { name: 'Ikusi jatorrizkoa' })).toBeTruthy();
  fireEvent.click(traduir(pagina));
  expect(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: 'Jatorrizkoa (valentziera)' })).toBeTruthy();
});

/* Gauntlet 261030 (Fase 3, TC3.3; vista-traduida-perd-entradilla) · La vista
   traduïda conserva l'anatomia de la capçalera de l'original: el subtítol i
   l'entradilla tornen dins de div.page-intro, i l'entradilla amb .lead. */
test('TC3.3 · la vista traduïda conserva .page-intro (h2 + p.lead) i el cos va després', async () => {
  fixaTraductorLliure('apertium');
  vi.stubGlobal('fetch', fetchFals());
  const { container } = render(<Pagina />);
  const fillsDe = (node) => [...node.children].map((fill) => `${fill.tagName}${fill.className ? `.${fill.className}` : ''}`);
  const original = container.querySelector('article.content-wrapper:not(.sdp-traduccio-cos)');
  expect(fillsDe(original.querySelector('.page-intro'))).toEqual(['H2', 'P.lead']);
  await tria(container, 'Anglés');
  const cos = traduit(container);
  expect(fillsDe(cos)).toEqual(['DIV.page-intro', 'H3', 'P', 'UL']);
  expect(fillsDe(cos.querySelector('.page-intro'))).toEqual(['H2', 'P.lead']);
  expect(cos.querySelector('.page-intro > p.lead').textContent).toBe('eng:Tres dies de festa.');
  expect(cos.querySelector('.page-intro > h2').textContent).toBe('eng:Programa');
});

/* Gauntlet 261030 (Fase 3, TC3.3; lang-interficie-sobre-contingut-valencia) ·
   Una pàgina en valencià (llenguaDelContingut="ca", com TextSection i
   PAGE_COPY) amb la interfície en una altra llengua: l'H1 i l'entradilla
   original porten lang="ca" (WCAG 3.1.2); traduïda, l'H1 i el cos traduït
   porten el de la traducció i l'original amagat continua en «ca». Amb la
   interfície en valencià, o sense la prop, el DOM de sempre.
   Cicle 3 (tc3-lang-ca-sobre-interficie-traduida) · L'article sencer ja no
   porta el lang: dins també hi ha peces de la interfície. Un fill que no el
   demana (ací, la <section> crua) hereta el de la interfície. */
test('TC3.3 · lang="ca" al contingut en valencià quan la interfície és en una altra llengua', async () => {
  fixaTraductorLliure('apertium');
  vi.stubGlobal('fetch', fetchFals());
  const original = (node) => node.querySelector('article.content-wrapper:not(.sdp-traduccio-cos)');
  mocks.ui = { externalConfig: {}, llenguaDelText: 'en' };
  const { container, unmount } = render(<Pagina llenguaDelContingut="ca" />);
  expect(container.querySelector('h1').getAttribute('lang')).toBe('ca');
  expect(original(container).hasAttribute('lang')).toBe(false);
  expect(original(container).querySelector('.page-intro').getAttribute('lang')).toBe('ca');
  expect(original(container).querySelector('section').closest('[lang]')).toBeNull();
  await tria(container, 'Castellà');
  expect(container.querySelector('h1').getAttribute('lang')).toBe('es');
  expect(traduit(container).getAttribute('lang')).toBe('es');
  expect(original(container).querySelector('.page-intro').getAttribute('lang')).toBe('ca');
  unmount();
  for (const [ui, props] of [[{ externalConfig: {}, llenguaDelText: 'ca' }, { llenguaDelContingut: 'ca' }], [{ externalConfig: {}, llenguaDelText: 'en' }, {}], [{ externalConfig: {} }, { llenguaDelContingut: 'ca' }]]) {
    mocks.ui = ui;
    const pintada = render(<Pagina {...props} />);
    expect(pintada.container.querySelector('h1').hasAttribute('lang'), JSON.stringify([ui, props])).toBe(false);
    expect(original(pintada.container).hasAttribute('lang'), JSON.stringify([ui, props])).toBe(false);
    expect(pintada.container.querySelectorAll('[lang]'), JSON.stringify([ui, props])).toHaveLength(0);
    pintada.unmount();
  }
});

/* Gauntlet 261030 (cicle 3, tc3-lang-ca-sobre-interficie-traduida) · Amb la
   interfície en anglés, el lang="ca" va NOMÉS al text de la pàgina: l'H1,
   l'entradilla, el cos que el demana (useLlenguaDelContingut, com
   CosDeLaPagina), l'alt de la portada que ve de la pàgina i les etiquetes
   que el declaren. El botó de la interfície del final («Open the Console»)
   i una etiqueta traduïda («Version 1.0.0») hereten el de la interfície. Amb
   la interfície en valencià, cap lang (el DOM de sempre). */
function CosDeProva() {
  const lang = useLlenguaDelContingut();
  return <section className="cos-de-prova" lang={lang}><p>Sopar a la plaça.</p></section>;
}
const PaginaMixta = (props) => (
  <UniversalPage chrome="context" title="La festa del poble" subtitle="Programa" lead="Tres dies de festa."
    heroImage="/assets/festa.webp" heroAlt="Una plaça amb llums de festa"
    labels={[{ text: 'Col·lectius', className: 'sdp-badge-system', lang: 'ca' }, { text: 'Version 1.0.0', className: 'sdp-badge-tag' }, 'Cadena']}
    llenguaDelContingut="ca" {...props}>
    <CosDeProva />
    <div className="sdp-pagina-accio"><button type="button">Open the Console</button></div>
  </UniversalPage>
);
test('cicle 3 · el lang de la pàgina no cobrix la interfície de dins de l’article; sí les etiquetes i l’alt de la pàgina', () => {
  const langDe = (node) => node?.closest('[lang]')?.getAttribute('lang') ?? null;
  mocks.ui = { externalConfig: {}, llenguaDelText: 'en' };
  const { container, unmount } = render(<PaginaMixta />);
  expect(langDe(container.querySelector('h1'))).toBe('ca');
  expect(langDe(container.querySelector('.page-intro .lead'))).toBe('ca');
  expect(langDe(container.querySelector('.cos-de-prova p'))).toBe('ca');
  expect(langDe(screen.getByRole('button', { name: 'Open the Console' }))).toBeNull();
  expect(langDe(container.querySelector('.hero-image img'))).toBe('ca');
  expect([...container.querySelectorAll('.page-title-labels > li')].map((li) => [li.textContent, li.getAttribute('lang')]))
    .toEqual([['Col·lectius', 'ca'], ['Version 1.0.0', null], ['Cadena', null]]);
  unmount();
  mocks.ui = { externalConfig: {}, llenguaDelText: 'ca' };
  const enValencia = render(<PaginaMixta />);
  expect(enValencia.container.querySelectorAll('[lang]')).toHaveLength(0);
  enValencia.unmount();
  // Un heroAlt de topBarData (no de la pàgina) no se sap en quina llengua és: cap lang.
  mocks.ui = { externalConfig: {}, llenguaDelText: 'en' };
  const altDeLaBarra = render(<PaginaMixta topBarData={{ heroAlt: 'A square' }} />);
  expect(altDeLaBarra.container.querySelector('.hero-image img').hasAttribute('lang')).toBe(false);
});

/* Cicle 4 (auditoria matinal de Gemini 261030, ALT-02) · Una pàgina amb un
   text que ha tornat en l'original (MyMemory sense l'entrada del motor) no es
   queda així tota la sessió: ni la memòria cau de la pàgina ni la del
   transport la desen, i en tornar a triar la llengua només es torna a
   demanar eixe text. */
test('ALT-02 · tornar a triar la llengua torna a demanar NOMÉS el text que havia tornat en l’original', async () => {
  fixaTraductorLliure('apertium');
  let senseMotor = true;
  const fetch = vi.fn(async (url) => {
    const q = new URL(url).searchParams.get('q');
    const traduccio = `de:${q}`;
    const ambEntrada = !(senseMotor && q === 'Ball');
    return respostaJson(200, {
      responseData: { translatedText: traduccio, match: 0.85 }, quotaFinished: false, responseDetails: '', responseStatus: 200,
      matches: ambEntrada ? [{ id: 0, segment: q, translation: traduccio, 'created-by': 'MT!', match: 0.85 }] : [],
    });
  });
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<Pagina />);
  await tria(container, 'Alemany');
  const ball = () => [...traduit(container).querySelectorAll('li')].map((li) => [li.textContent, li.getAttribute('lang')]);
  expect(ball()).toEqual([['de:Música', null], ['Ball', 'ca']]);
  expect(fetch).toHaveBeenCalledTimes(TEXTOS.length);
  await act(async () => { fireEvent.click(within(avis(container)).getByRole('button', { name: VEURE_ORIGINAL })); });
  senseMotor = false;
  await tria(container, 'Alemany');
  expect(fetch.mock.calls.slice(TEXTOS.length).map(([url]) => new URL(url).searchParams.get('q'))).toEqual(['Ball']);
  expect(ball()).toEqual([['de:Música', null], ['de:Ball', null]]);
  // Ara tota la pàgina s'ha traduït: la tercera vegada no ix cap petició.
  await act(async () => { fireEvent.click(within(avis(container)).getByRole('button', { name: VEURE_ORIGINAL })); });
  await tria(container, 'Alemany');
  expect(fetch).toHaveBeenCalledTimes(TEXTOS.length + 1);
});
