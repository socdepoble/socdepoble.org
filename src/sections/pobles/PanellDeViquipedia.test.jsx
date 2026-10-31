/**
 * VQ · Fase 3a de l'eina de pobles nous (261030; disseny
 * nit/viquipedia_disseny.md §4.4, §4.6, §4.7, §4.8 i §6.4) · El panell
 * «Porta-ho de la Viquipèdia», de cap a peus i sense xarxa: el lector de
 * Wikimedia de veres (client.js) sobre un fetch fals que només serveix les
 * captures reals del 261009 (tests/frontissa/fixtures/viquipedia/), per URL.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import PanellDeViquipedia, { TERMINI_MS } from './PanellDeViquipedia.jsx';
import { TEXTOS_VIQUIPEDIA, dataLlegible } from './CreditsDeViquipedia.jsx';
import { MAXIM_CREDIT, pobleDeViquipedia } from './pobleDeViquipedia.js';
import { UIContext } from '../../app/contexts/objectesDeContext.js';
import { NOM_BD, STORE, cauDeViquipedia, creaCauDeViquipedia } from './cauDeViquipedia.js';
import { creaIdbFals } from '../../utils/__fixtures__/navegadorFals.js';
import { oblidaConsentimentDeLaVisita, retiraConsentiment } from './consentimentViquipedia.js';
import { clauDeViquipedia, fusionaAmbViquipedia } from './fitxaDelPoble.js';
import { AGENT_USUARI, creaLectorViquipedia } from '../../data/adaptadors/viquipedia/client.js';

const DIR = resolve(process.cwd(), 'tests/frontissa/fixtures/viquipedia');
const captura = (nom) => JSON.parse(readFileSync(resolve(DIR, `${nom}.json`), 'utf8'));
const clauDUrl = (url) => {
  const u = new URL(url);
  return `${u.origin}${u.pathname}?${[...u.searchParams].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map((p) => p.join('=')).join('&')}`;
};
const TORRE = ['cerca-la-torre-de-les-macanes', 'entitats-la-torre-de-les-macanes', 'article-la-torre-de-les-macanes',
  'etiquetes-la-torre-de-les-macanes', 'fitxers-la-torre-de-les-macanes'];
const INEXISTENT = ['cerca-inexistent', 'article-inexistent'];

/* El fetch fals: cada URL amb la seua captura; la resta, 404 i apuntada.
   Amb `penja`, cap resposta fins que s'avorta (una connexió que no torna).
   Amb `canvia(nom, cos)`, el cos d'una captura es retoca (dades inventades). */
function wikimediaFals(serveix, { penja = false, canvia = null } = {}) {
  const peticions = [];
  const fora = [];
  const perUrl = new Map(serveix.map((nom) => {
    const resposta = captura(nom);
    return [clauDUrl(resposta.url), canvia ? { ...resposta, body: canvia(nom, resposta.body) } : resposta];
  }));
  const fetchImpl = vi.fn(async (url, init) => {
    peticions.push({ url, init });
    if (penja) {
      return new Promise((_, rebutja) => {
        init?.signal?.addEventListener('abort', () => rebutja(new DOMException('Avortat', 'AbortError')), { once: true });
      });
    }
    const resposta = perUrl.get(clauDUrl(url));
    if (!resposta) {
      fora.push(url);
      return new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify(resposta.body), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  });
  const { llig } = creaLectorViquipedia({ fetchImpl, espaiMs: 0, atzar: () => 0 });
  return { llig, peticions, fora, fetchImpl };
}

const t = (_, reserva) => reserva;
const text = (nom) => TEXTOS_VIQUIPEDIA[nom][1];
/* La fitxa incompleta: sense entradilla, sense foto i sense comarca. */
const TORRE_INCOMPLETA = Object.freeze({ id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes', provincia: 'Alacant' });
const CLAU = clauDeViquipedia(TORRE_INCOMPLETA);
const IMATGE_960 = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/Torre_Gran_%28Torremanzanas%29_3.jpg/960px-Torre_Gran_%28Torremanzanas%29_3.jpg';

const boto = (nom) => screen.getByRole('button', { name: text(nom) });
const portaHo = async () => {
  await act(async () => { fireEvent.click(boto('porta')); });
};

beforeEach(async () => {
  await cauDeViquipedia().oblidaTot();
  retiraConsentiment();
  oblidaConsentimentDeLaVisita();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('abans del clic', () => {
  test('cap petició: el títol, l’explicació, «Recorda-ho» i el botó', () => {
    const { llig, fetchImpl } = wikimediaFals(TORRE);
    const global = vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('cap fetch global'); });
    const { container } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} />);
    expect(container.querySelector('h3').textContent).toBe(text('titol'));
    expect(container.textContent).toContain(text('explica'));
    expect(screen.getByRole('checkbox', { name: text('recorda') }).checked).toBe(false);
    expect(boto('porta').disabled).toBe(false);
    expect(container.querySelector('img')).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(global).not.toHaveBeenCalled();
  });

  test('a l’app nativa el panell no es pinta', () => {
    vi.stubGlobal('Capacitor', { isNativePlatform: () => true });
    const { container } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={wikimediaFals(TORRE).llig} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('en prémer «Porta-ho de la Viquipèdia»', () => {
  test('les 5 URL de les captures, sense referent ni galetes i amb Api-User-Agent; la cau desada; els crèdits i la foto', async () => {
    const { llig, peticions, fora } = wikimediaFals(TORRE);
    const { container } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} />);
    await portaHo();
    await waitFor(() => expect(container.querySelector('h3').textContent).toBe(text('creditsTitol')));
    expect(fora).toEqual([]);
    expect(peticions.map(({ url }) => clauDUrl(url)).sort()).toEqual(TORRE.map((nom) => clauDUrl(captura(nom).url)).sort());
    for (const { url, init } of peticions) {
      expect(['https://www.wikidata.org', 'https://ca.wikipedia.org', 'https://commons.wikimedia.org']).toContain(new URL(url).origin);
      expect(init).toMatchObject({ method: 'GET', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
      expect(init.headers['Api-User-Agent']).toBe(AGENT_USUARI);
    }
    // La cau: la proposta parcial de la Torre, sense chat.
    const entrada = await cauDeViquipedia().llig(CLAU);
    expect(entrada.dto).toMatchObject({ estat: 'parcial', title: 'La Torre de les Maçanes', comarca: 'L\'Alacantí', wikidata_id: 'Q1641908' });
    expect(entrada.dto).not.toHaveProperty('chat');
    // Els crèdits: l'article, la llicència del text i Wikidata.
    const enllacos = [...container.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href'), a.getAttribute('rel'), a.getAttribute('target')]);
    expect(enllacos).toEqual([
      ['«La Torre de les Maçanes»', 'https://ca.wikipedia.org/wiki/La_Torre_de_les_Ma%C3%A7anes', 'noopener noreferrer nofollow', '_blank'],
      ['CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/deed.ca', 'noopener noreferrer nofollow', '_blank'],
      ['Wikidata Q1641908', 'https://www.wikidata.org/wiki/Q1641908', 'noopener noreferrer nofollow', '_blank'],
      ['CC BY-SA 3.0 es', 'https://creativecommons.org/licenses/by-sa/3.0/es/deed.en', 'noopener noreferrer nofollow', '_blank'],
      ['Torre Gran (Torremanzanas) 3.jpg', 'https://commons.wikimedia.org/wiki/File:Torre_Gran_(Torremanzanas)_3.jpg', 'noopener noreferrer nofollow', '_blank']
    ]);
    // Una sola foto (l'avatar repetix la panoràmica): sense galetes ni referent, a 960 px.
    const fotos = [...container.querySelectorAll('figure img')];
    expect(fotos).toHaveLength(1);
    expect(fotos[0].getAttribute('src')).toBe(IMATGE_960);
    expect(fotos[0].getAttribute('crossorigin')).toBe('anonymous');
    expect(fotos[0].getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(fotos[0].getAttribute('loading')).toBe('lazy');
    expect([fotos[0].getAttribute('width'), fotos[0].getAttribute('height')]).toEqual(['960', '638']);
    expect(fotos[0].hasAttribute('class')).toBe(false);
    expect(container.querySelector('figcaption').textContent).toContain('Relleu');
    expect(container.textContent).toMatch(/Consultat el /);
    // Sense «Recorda-ho», res al navegador.
    expect(window.localStorage.getItem('sdp_embed_viquipedia')).toBeNull();
    expect(boto('deixa')).toBeTruthy();
  });

  test('«Recorda-ho en este navegador» escriu sdp_embed_viquipedia', async () => {
    const { llig } = wikimediaFals(TORRE);
    render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} />);
    fireEvent.click(screen.getByRole('checkbox', { name: text('recorda') }));
    await portaHo();
    expect(window.localStorage.getItem('sdp_embed_viquipedia')).toBe('"sempre"');
    await waitFor(() => expect(boto('deixa')).toBeTruthy());
  });

  test('sense connexió: el botó desactivat, l’avís i cap petició', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    const { llig, fetchImpl } = wikimediaFals(TORRE);
    render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} />);
    expect(boto('porta').disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toContain(text('senseXarxa'));
    await act(async () => { fireEvent.click(boto('porta')); });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(await cauDeViquipedia().llig(CLAU)).toBeNull();
  });

  test('desmuntar a mitges avorta: cap proposta desada', async () => {
    const { llig, fetchImpl } = wikimediaFals(TORRE, { penja: true });
    const { unmount } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} />);
    await portaHo();
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    const [, init] = fetchImpl.mock.calls[0];
    unmount();
    expect(init.signal.aborted).toBe(true);
    await act(async () => { await Promise.resolve(); });
    expect(await cauDeViquipedia().llig(CLAU)).toBeNull();
  });

  test(`una consulta que no torna es talla com a molt als ${TERMINI_MS / 1000} s: avís, i res desat`, async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { llig } = wikimediaFals(TORRE, { penja: true });
    render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} />);
    await portaHo();
    await act(async () => { await vi.advanceTimersByTimeAsync(TERMINI_MS); });
    expect(screen.getByRole('status').textContent).toContain(text('noDisponible'));
    expect(await cauDeViquipedia().llig(CLAU)).toBeNull();
  });

  test('una proposta d’un poble amb un altre nom no es desa (la guarda de l’homònim)', async () => {
    const { llig: base } = wikimediaFals(TORRE);
    /* La fitxa diu «Torre de les Maçanes» i Wikimedia torna «La Torre de les
       Maçanes»: un altre slug. Les URL són les de les captures. */
    const llig = (recurs, entrada, opcions) => base(recurs, Object.fromEntries(Object.entries(entrada)
      .map(([k, v]) => [k, v.replace(/^Torre de les Maçanes/, 'La Torre de les Maçanes')])), opcions);
    const poble = { id: 'torre-de-les-macanes', title: 'Torre de les Maçanes', provincia: 'Alacant' };
    const { container } = render(<PanellDeViquipedia poble={poble} t={t} llig={llig} />);
    await portaHo();
    await waitFor(() => expect(container.textContent).toContain(text('senseArticle')));
    expect(await cauDeViquipedia().llig(clauDeViquipedia(poble))).toBeNull();
    expect(container.querySelector('figure')).toBeNull();
  });

  test('un municipi que no existix: «sense-article», sense res inventat', async () => {
    const { llig, fora } = wikimediaFals(INEXISTENT);
    const poble = { id: 'poble-inexistent-de-prova-sdp', title: 'Poble Inexistent de Prova SdP' };
    const { container } = render(<PanellDeViquipedia poble={poble} t={t} llig={llig} />);
    await portaHo();
    await waitFor(() => expect(container.textContent).toContain(text('senseArticle')));
    expect(fora).toEqual([]);
    expect(container.querySelector('h3').textContent).toBe(text('titol'));
    expect(container.querySelector('figure')).toBeNull();
    expect((await cauDeViquipedia().llig(clauDeViquipedia(poble))).dto.estat).toBe('sense-article');
  });
});

describe('amb la proposta ja a la cau', () => {
  test('una visita nova: el text sí, les fotos no fins al gest, i el gest no fa cap petició', async () => {
    await cauDeViquipedia().desa(CLAU, (await (async () => {
      const { llig } = wikimediaFals(TORRE);
      const { pobleDeViquipedia } = await import('./pobleDeViquipedia.js');
      return pobleDeViquipedia('La Torre de les Maçanes', { llig });
    })()));
    const { llig, fetchImpl } = wikimediaFals(TORRE);
    const entrada = await cauDeViquipedia().llig(CLAU);
    const hidratat = fusionaAmbViquipedia(TORRE_INCOMPLETA, entrada);
    const { container } = render(<PanellDeViquipedia poble={hidratat} t={t} llig={llig} />);
    await waitFor(() => expect(container.querySelector('h3').textContent).toBe(text('creditsTitol')));
    expect(container.querySelector('figure')).toBeNull();
    expect(container.textContent).toContain(text('fotosAmbGest'));
    await portaHo();
    expect(container.querySelectorAll('figure img')).toHaveLength(1);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('«Deixa de portar-ho de la Viquipèdia» oblida el sí i la proposta', async () => {
    const { llig } = wikimediaFals(TORRE);
    window.localStorage.setItem('sdp_embed_viquipedia', '"sempre"');
    const { container } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} />);
    expect(screen.queryByRole('checkbox')).toBeNull();
    await portaHo();
    await waitFor(() => expect(boto('deixa')).toBeTruthy());
    await act(async () => { fireEvent.click(boto('deixa')); });
    expect(window.localStorage.getItem('sdp_embed_viquipedia')).toBeNull();
    expect(await cauDeViquipedia().llig(CLAU)).toBeNull();
    await waitFor(() => expect(container.querySelector('h3').textContent).toBe(text('titol')));
  });
});

/* ── Gauntlet 261030, cicle 3 · àrea viquipedia ─────────────────────────── */

/* La proposta de la Torre a la cau, com si s'haguera portat en una visita d'abans. */
async function desaLaTorre() {
  const { llig } = wikimediaFals(TORRE);
  return cauDeViquipedia().desa(CLAU, await pobleDeViquipedia('La Torre de les Maçanes', { llig }));
}
const regioViva = (container) => container.querySelector('.sdp-accions [aria-live="polite"]');
/* Retoca les fotos de la captura de Commons de la Torre (dades inventades, cap petició). */
const ambFotosRetocades = (retoca) => (nom, cos) => {
  if (nom !== 'fitxers-la-torre-de-les-macanes') return cos;
  const copia = structuredClone(cos);
  for (const pagina of copia.query.pages) {
    if (pagina.imageinfo?.[0]) retoca(pagina.imageinfo[0]);
  }
  return copia;
};

describe('c3 · «Deixa de portar-ho» sense el sí (viquipedia-oblit-inabastable-sense-consentiment)', () => {
  test('després de recarregar sense «Recorda-ho»: «Deixa» hi és i esborra la proposta sense cap petició ni cap foto', async () => {
    await desaLaTorre();
    oblidaConsentimentDeLaVisita(); // la recàrrega: el sí de la visita mor, la cau no
    const { llig, fetchImpl } = wikimediaFals(TORRE);
    const global = vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('cap fetch global'); });
    const crea = vi.spyOn(document, 'createElement');
    const { container } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} />);
    await waitFor(() => expect(container.querySelector('h3').textContent).toBe(text('creditsTitol')));
    expect(boto('porta')).toBeTruthy();
    await act(async () => { fireEvent.click(boto('deixa')); });
    expect(await cauDeViquipedia().llig(CLAU)).toBeNull();
    expect(container.querySelector('h3').textContent).toBe(text('titol'));
    expect(screen.queryByRole('button', { name: text('deixa') })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(global).not.toHaveBeenCalled();
    expect(crea.mock.calls.filter(([etiqueta]) => String(etiqueta).toLowerCase() === 'img')).toEqual([]);
    expect(window.localStorage.getItem('sdp_embed_viquipedia')).toBeNull();
  });

  test('una entrada «sense-article» (també diu quins pobles s’han mirat) es pot oblidar', async () => {
    const { llig, fetchImpl } = wikimediaFals(INEXISTENT);
    const poble = { id: 'poble-inexistent-de-prova-sdp', title: 'Poble Inexistent de Prova SdP' };
    await cauDeViquipedia().desa(clauDeViquipedia(poble), await pobleDeViquipedia(poble.title, { llig }));
    oblidaConsentimentDeLaVisita();
    fetchImpl.mockClear();
    const { container } = render(<PanellDeViquipedia poble={poble} t={t} llig={llig} />);
    await waitFor(() => expect(container.textContent).toContain(text('senseArticle')));
    await act(async () => { fireEvent.click(boto('deixa')); });
    expect(await cauDeViquipedia().llig(clauDeViquipedia(poble))).toBeNull();
    expect(container.textContent).not.toContain(text('senseArticle'));
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('c3 · el focus i l’anunci de l’èxit (vq-panell-focus-perdut-i-exit-mut)', () => {
  test('amb el teclat: «Porta-ho» deixa el focus a «Deixa», «Deixa» el torna a «Porta-ho», i l’èxit s’anuncia', async () => {
    const { llig } = wikimediaFals(TORRE);
    const { container } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} />);
    expect(regioViva(container).textContent).toBe('');
    expect(regioViva(container).className).toBe('sdp-sr-only');
    boto('porta').focus();
    await portaHo();
    await waitFor(() => expect(document.activeElement).toBe(boto('deixa')));
    expect(regioViva(container).textContent).toBe(text('portat'));
    // Cap títol enfocable: cap anell nou.
    expect(container.querySelector('h3').hasAttribute('tabindex')).toBe(false);
    await act(async () => { fireEvent.click(document.activeElement); });
    await waitFor(() => expect(document.activeElement).toBe(boto('porta')));
    expect(regioViva(container).textContent).toBe(text('deixat'));
  });

  test('si mentre esperava la persona ha posat el focus en un altre lloc, no se li toca', async () => {
    let solta;
    const espera = new Promise((resol) => { solta = resol; });
    const { llig: base } = wikimediaFals(TORRE);
    const llig = async (...args) => { await espera; return base(...args); };
    const { container } = render(
      <><input aria-label="un altre camp" /><PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} /></>
    );
    boto('porta').focus();
    await portaHo();
    const altre = screen.getByRole('textbox', { name: 'un altre camp' });
    altre.focus();
    await act(async () => { solta(); });
    await waitFor(() => expect(container.querySelector('h3').textContent).toBe(text('creditsTitol')));
    expect(document.activeElement).toBe(altre);
    expect(regioViva(container).textContent).toBe(text('portat'));
  });
});

describe('c3 · una resposta que la cau no guardava (vq-autor-commons-llarg-rebutja-tota-la-proposta)', () => {
  test('un autor de Commons de més de 200 punts de codi es talla: la fitxa es completa i el crèdit acaba en «…»', async () => {
    const llarg = `<a href="//commons.wikimedia.org/wiki/User:Relleu">Relleu</a>, ${'Arxiu Fotogràfic Municipal i Comissió de Festes de la Torre de les Maçanes, '.repeat(4)}`;
    const { llig } = wikimediaFals(TORRE, { canvia: ambFotosRetocades((info) => { info.extmetadata.Artist.value = llarg; }) });
    const { container } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} />);
    await portaHo();
    await waitFor(() => expect(container.querySelector('h3').textContent).toBe(text('creditsTitol')));
    expect(container.textContent).not.toContain(text('noDisponible'));
    const { autor } = (await cauDeViquipedia().llig(CLAU)).dto.imatges.hero;
    expect(Array.from(autor).length).toBeLessThanOrEqual(MAXIM_CREDIT);
    expect(autor).toMatch(/^Relleu\b.*Arxiu Fotogràfic Municipal.*…$/u);
    expect(container.querySelector('figcaption').textContent).toContain(autor);
  });

  test('si la cau rebutja la proposta, l’avís no diu que no s’ha pogut parlar amb la Viquipèdia', async () => {
    // Una foto més ampla del que la cau accepta: Wikimedia respon i la llista blanca la rebutja.
    const { llig } = wikimediaFals(TORRE, { canvia: ambFotosRetocades((info) => { info.width = 200000; info.height = 100000; }) });
    const { container } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} />);
    await portaHo();
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain(text('noValida')));
    expect(container.textContent).not.toContain(text('noDisponible'));
    expect(await cauDeViquipedia().llig(CLAU)).toBeNull();
    expect(boto('porta').disabled).toBe(false);
  });
});

/* Cicle 4 · auditoria matinal de Codex (MITJÀ-C3) · «Deixa» espera que el
   disc esborre la proposta: l'èxit només s'anuncia confirmat, i si el disc no
   respon, «oblit pendent» amb un reintent (la fitxa continua sense les dades). */
describe('c4 · «Deixa de portar-ho» espera l’esborrat; si falla, oblit pendent i reintent (MITJÀ-C3)', () => {
  test('el disc no respon: cap «Fet», l’avís d’oblit pendent i «Torna a provar d’esborrar-ho», que l’acaba', async () => {
    const { idb, control, files } = creaIdbFals();
    const cau = creaCauDeViquipedia({ idb, Canal: null, navegador: null });
    const { llig, fetchImpl } = wikimediaFals(TORRE);
    await cau.desa(CLAU, await pobleDeViquipedia('La Torre de les Maçanes', { llig }));
    fetchImpl.mockClear();
    const { container } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} cau={cau} />);
    await waitFor(() => expect(container.querySelector('h3').textContent).toBe(text('creditsTitol')));
    control.fallaObrir = true;
    await act(async () => { fireEvent.click(boto('deixa')); });
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain(text('oblitPendent')));
    expect(regioViva(container).textContent).toBe('');
    // La fitxa ja no mostra les dades, encara que el disc les guarde.
    expect(container.querySelector('h3').textContent).toBe(text('titol'));
    expect(files(NOM_BD, STORE)).toHaveLength(1);
    control.fallaObrir = false;
    await act(async () => { fireEvent.click(boto('tornaAOblidar')); });
    await waitFor(() => expect(regioViva(container).textContent).toBe(text('deixat')));
    expect(screen.queryByRole('button', { name: text('tornaAOblidar') })).toBeNull();
    expect(container.textContent).not.toContain(text('oblitPendent'));
    expect(files(NOM_BD, STORE)).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('un panell nou (un altre poble i tornar) encara pot acabar un oblit que havia fallat', async () => {
    const { idb, control, files } = creaIdbFals();
    const cau = creaCauDeViquipedia({ idb, Canal: null, navegador: null });
    const { llig } = wikimediaFals(TORRE);
    await cau.desa(CLAU, await pobleDeViquipedia('La Torre de les Maçanes', { llig }));
    control.fallaObrir = true;
    await expect(cau.oblida(CLAU)).rejects.toThrow();
    control.fallaObrir = false;
    const { container } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} cau={cau} />);
    expect(screen.getByRole('status').textContent).toContain(text('oblitPendent'));
    await act(async () => { fireEvent.click(boto('tornaAOblidar')); });
    await waitFor(() => expect(regioViva(container).textContent).toBe(text('deixat')));
    expect(files(NOM_BD, STORE)).toEqual([]);
  });

  test('sense cap fallada, l’èxit s’anuncia quan el disc l’ha confirmat i cap avís', async () => {
    const { idb, files } = creaIdbFals();
    const cau = creaCauDeViquipedia({ idb, Canal: null, navegador: null });
    const { llig } = wikimediaFals(TORRE);
    await cau.desa(CLAU, await pobleDeViquipedia('La Torre de les Maçanes', { llig }));
    const { container } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} cau={cau} />);
    await waitFor(() => expect(container.querySelector('h3').textContent).toBe(text('creditsTitol')));
    await act(async () => { fireEvent.click(boto('deixa')); });
    await waitFor(() => expect(regioViva(container).textContent).toBe(text('deixat')));
    expect(files(NOM_BD, STORE)).toEqual([]);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('button', { name: text('tornaAOblidar') })).toBeNull();
  });

  test('si abans que el disc responga la persona torna a portar-ho, l’oblit vell ja no anuncia «Fet»', async () => {
    const real = creaCauDeViquipedia({ idb: null, Canal: null, navegador: null });
    let solta = null;
    const cau = { ...real, oblida: (clau) => real.oblida(clau).then((confirmat) => new Promise((resol) => { solta = () => resol(confirmat); })) };
    const { llig } = wikimediaFals(TORRE);
    await real.desa(CLAU, await pobleDeViquipedia('La Torre de les Maçanes', { llig }));
    const { container } = render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} cau={cau} />);
    await waitFor(() => expect(container.querySelector('h3').textContent).toBe(text('creditsTitol')));
    await act(async () => { fireEvent.click(boto('deixa')); });
    await waitFor(() => expect(solta).not.toBeNull());
    await portaHo();
    await waitFor(() => expect(regioViva(container).textContent).toBe(text('portat')));
    await act(async () => { solta(); });
    expect(regioViva(container).textContent).toBe(text('portat'));
  });

  test('amb un oblit fallit, mentre es torna a portar (el sí ja hi és), un sol botó d’oblidar: «Deixa»', async () => {
    const { idb, control } = creaIdbFals();
    const cau = creaCauDeViquipedia({ idb, Canal: null, navegador: null });
    const { llig: lligDeLaTorre } = wikimediaFals(TORRE);
    await cau.desa(CLAU, await pobleDeViquipedia('La Torre de les Maçanes', { llig: lligDeLaTorre }));
    control.fallaObrir = true;
    await expect(cau.oblida(CLAU)).rejects.toThrow();
    control.fallaObrir = false;
    const { llig } = wikimediaFals(TORRE, { penja: true });
    render(<PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} cau={cau} />);
    expect(boto('tornaAOblidar')).toBeTruthy();
    await portaHo();
    expect(boto('deixa')).toBeTruthy();
    expect(screen.queryByRole('button', { name: text('tornaAOblidar') })).toBeNull();
  });
});

describe('c3 · la data dels crèdits en la llengua de la interfície (vq-data-credits-llengua-del-document)', () => {
  const formata = (locale, ms) => new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(ms));
  const langOriginal = document.documentElement.getAttribute('lang');
  afterEach(() => {
    if (langOriginal === null) document.documentElement.removeAttribute('lang');
    else document.documentElement.setAttribute('lang', langOriginal);
  });

  test('dataLlegible no mira l’<html> de l’amfitrió', () => {
    document.documentElement.lang = 'es-ES';
    const ms = Date.UTC(2026, 9, 30, 12);
    expect(dataLlegible(ms, 'ca-ES')).toBe(formata('ca-ES', ms));
    expect(dataLlegible(ms, 'ca-ES')).not.toBe(formata('es-ES', ms));
    expect(dataLlegible(ms)).toBe(formata('ca-ES', ms));
  });

  test.each(['ca-ES', 'en-GB'])('amb l’<html> en castellà i la interfície en %s, «Consultat el …» va en la de la interfície', async (locale) => {
    document.documentElement.lang = 'es-ES';
    const { llig } = wikimediaFals(TORRE);
    const { container } = render(
      <UIContext.Provider value={{ locale }}><PanellDeViquipedia poble={TORRE_INCOMPLETA} t={t} llig={llig} /></UIContext.Provider>
    );
    await portaHo();
    await waitFor(() => expect(container.textContent).toMatch(/Consultat el /));
    const { llegitEl } = await cauDeViquipedia().llig(CLAU);
    const consultat = [...container.querySelectorAll('p')].find((p) => p.textContent.startsWith('Consultat el '));
    expect(consultat.textContent).toBe(`Consultat el ${formata(locale, llegitEl)}.`);
    expect(consultat.textContent).not.toContain(formata('es-ES', llegitEl));
  });
});
