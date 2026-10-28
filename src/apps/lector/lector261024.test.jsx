/* Notícies del Poble · ordre del Mestre del 261024 (15:05), dins de la plataforma de veres
   (RutaApps → AppLector), amb el port del servei de notícies com en producció (sense prop `font`)
   i un servei fals que servix feeds inventats (adreces d'example.org i un vídeo de prova):
     · la fila de la llista és la del Bloc de notes: miniatura (només la del servei), títol,
       «font · data · Nou» i entradeta, amb la variant de la llista del Bloc;
     · un feed de vídeo porta el reproductor dins de la lectura, darrere d'una façana: res no es
       demana a YouTube abans del clic;
     · una carpeta és el flux de totes les seues fonts i una font, només el seu;
     · una adreça que el servei no llig ho diu tal qual (correcció R5-08), i el servei es consulta
       una sola vegada (interfície estat());
     · la barra verda és només del Lector (correcció R5-09).
   Totes les dades són inventades. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, fireEvent, cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { BarraLateral } from '../plataforma/BarraLateral.jsx';
import { manifestDeProva } from '../plataforma/__fixtures__/manifests.js';
import { muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import RutaApps from '../plataforma/RutaApps.jsx';
import { Route, Routes } from '../../app/contexts/RouterContext.jsx';
import { ARA, ENTORN, tancats } from './__fixtures__/muntaLector.jsx';
import AppLector from './AppLector.jsx';
import { creaFontsPersonals } from './fontsPersonals.js';
import { creaMagatzemLector } from './magatzem.js';
import manifestLector from './manifest.js';
import { mitjansDe } from './mitjans.js';

const BASE = 'https://servei.example';
const VIDEO_ID = 'abcdefghijk';
const MIRA = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const INCRUSTACIO = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`;
const TITOL_VIDEO = 'Com es fa una paret de pedra seca';
const TITOL_TEXT = 'Guia de la paret seca per a principiants';
const URL_PERSONAL = 'https://example.org/barri/feed';

const CATALEG = Object.freeze({
  categories: [
    { id: 'coneixement', nom: 'Coneixement obert', ordre: 0, icona: 'BookOpen' },
    { id: 'videos', nom: 'Vídeos per a aprendre', ordre: 1, icona: 'Sprout' }
  ],
  fonts: [
    { id: 'bloc-pedra', nom: 'El Bloc de la Pedra', categoriaId: 'coneixement', descripcio: 'Guies obertes.', lloc: 'https://example.org/' },
    { id: 'canal-pedra', nom: 'Canal de la Pedra', categoriaId: 'videos', descripcio: 'Vídeos per a aprendre.', lloc: 'https://example.org/' }
  ]
});

const XML = Object.freeze({
  'bloc-pedra': `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel>
  <title>El Bloc de la Pedra</title><link>https://example.org/</link><description>Guies</description>
  <item>
    <title>${TITOL_TEXT}</title>
    <link>https://example.org/guia-paret-seca</link>
    <guid>https://example.org/guia-paret-seca</guid>
    <pubDate>Sat, 03 Oct 2026 08:00:00 GMT</pubDate>
    <description>Les pedres grans a baix, les menudes a dalt i cap gota de ciment.</description>
    <media:thumbnail url="https://example.org/fotos/paret.jpg"/>
  </item>
</channel></rss>`,
  'canal-pedra': `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <title>Canal de la Pedra</title><id>tag:example.org,2026:canal</id><updated>2026-10-03T09:00:00Z</updated>
  <entry>
    <title>${TITOL_VIDEO}</title>
    <link rel="alternate" href="${MIRA}"/>
    <id>tag:example.org,2026:canal/1</id>
    <published>2026-10-03T09:00:00Z</published>
    <updated>2026-10-03T09:00:00Z</updated>
    <media:group><media:thumbnail url="https://example.org/fotos/video.jpg"/><media:description>El mestre paredador ho ensenya pas a pas.</media:description></media:group>
    <summary>El mestre paredador ho ensenya pas a pas.</summary>
  </entry>
</feed>`
});

/* El servei fals: la forma de la interfície (client.js), sense xarxa. `estat`: el que diu de si mateix. */
function creaServei({ estat = { disponible: true, personals: true }, motiuPersonal = null } = {}) {
  return {
    fonts: vi.fn(async () => CATALEG),
    estat: vi.fn(async () => estat),
    feed: vi.fn(async (id) => {
      if (!estat.disponible) throw Object.assign(new Error('absent'), { motiu: 'servidor' });
      return { font: id, xml: XML[id], obtingut: null, obsoleta: false };
    }),
    feedPersonal: vi.fn(async (url) => {
      if (motiuPersonal) throw Object.assign(new Error('vetada'), { motiu: motiuPersonal });
      return { url, xml: XML['bloc-pedra'], obtingut: null, obsoleta: false };
    }),
    imatge: vi.fn((url) => (typeof url === 'string' && url.startsWith('https:') ? `${BASE}/functions/v1/noticies/imatge?u=${encodeURIComponent(url)}` : null)),
    video: vi.fn((enllac) => (enllac === MIRA ? { proveidor: 'youtube', id: VIDEO_ID, incrustacio: INCRUSTACIO, enllac: MIRA } : null))
  };
}

const oberts = [];
function obriLector(url, servei) {
  const idb = creaIdbFals();
  const locks = creaLocksFals();
  const canal = creaCanalFals();
  const magatzem = () => {
    const nou = creaMagatzemLector({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
    oberts.push(nou);
    return nou;
  };
  const delLector = magatzem();
  const App = () => <AppLector magatzem={delLector} ara={() => ARA} />;
  const registre = creaRegistre({ internes: [{ ...manifestLector, carrega: () => Promise.resolve({ default: App }) }] });
  muntaPlataforma(url, { registre, entorn: { ...ENTORN, serveis: { noticies: servei } } });
  return { api: creaFontsPersonals({ obriMagatzem: magatzem }) };
}

const columna = (id) => within(document.getElementById(id));
const detall = () => columna('app-grid-main');
const arbre = () => within(document.querySelector('#app-grid-sidebar nav.sdp-workspace-column__body'));
const fitxes = () => [...document.getElementById('app-grid-list').querySelectorAll('button.sdp-gestor-fitxa')];
const fitxa = (titol) => fitxes().find((boto) => boto.querySelector('.sdp-gestor-fitxa__titol').textContent === titol);
/* Tot el que porta una adreça al document: atributs src, href, srcdoc i data. */
const adreces = () => [...document.querySelectorAll('[src], [href], [srcdoc], [data]')]
  .flatMap((node) => ['src', 'href', 'srcdoc', 'data'].map((nom) => node.getAttribute(nom)).filter(Boolean));

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  while (oberts.length) oberts.pop().tanca();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('la fila de la llista és la del Bloc de notes', () => {
  test('miniatura del servei, títol, «font · data · Nou» i entradeta, amb la variant de la llista del Bloc', async () => {
    const servei = creaServei();
    obriLector('/app/lector/noticies/coneixement', servei);
    await waitFor(() => expect(fitxa(TITOL_TEXT)).toBeTruthy());
    const fila = fitxa(TITOL_TEXT);
    expect(fila.closest('ul').classList.contains('sdp-bloc-list--notes')).toBe(true);
    const [meta, entradeta] = fila.querySelectorAll('.sdp-gestor-fitxa__text > .sdp-gestor-fitxa__subtitol');
    expect(meta.textContent).toMatch(/^El Bloc de la Pedra · \d\d:\d\d 03\/10\/26 · Nou$/);
    expect(entradeta.textContent).toBe('Les pedres grans a baix, les menudes a dalt i cap gota de ciment.');
    const img = fila.querySelector('.sdp-gestor-fitxa__media img.sdp-gestor-fitxa__imatge');
    expect(img.getAttribute('src')).toBe(`${BASE}/functions/v1/noticies/imatge?u=${encodeURIComponent('https://example.org/fotos/paret.jpg')}`);
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('alt')).toBe('');
    expect(servei.imatge).toHaveBeenCalledWith('https://example.org/fotos/paret.jpg');
    /* Cap imatge de l'origen de la font, enlloc. */
    expect([...document.querySelectorAll('img')].map((node) => node.getAttribute('src')).filter((src) => !src.startsWith(`${BASE}/`))).toEqual([]);
    /* Cap targeta: la fila és un botó amb la fitxa del Bloc. */
    expect(document.querySelectorAll('.sp-card, .sdp-card-llista, .sdp-card-grid')).toHaveLength(0);
  });

  test('si la miniatura no carrega, la icona de la carpeta; un servei sense imatge, cap miniatura', async () => {
    const servei = creaServei();
    obriLector('/app/lector/noticies/coneixement', servei);
    await waitFor(() => expect(fitxa(TITOL_TEXT)).toBeTruthy());
    fireEvent.error(fitxa(TITOL_TEXT).querySelector('img'));
    expect(fitxa(TITOL_TEXT).querySelector('img')).toBeNull();
    expect(fitxa(TITOL_TEXT).querySelector('.sdp-gestor-fitxa__media svg').getAttribute('class')).toMatch(/lucide-book-open/);
    cleanup();
    const sense = { ...creaServei(), imatge: undefined };
    obriLector('/app/lector/noticies/coneixement', sense);
    await waitFor(() => expect(fitxa(TITOL_TEXT)).toBeTruthy());
    expect(document.querySelectorAll('#app-grid-list img')).toHaveLength(0);
  });

  test('mitjans.js no es fia del servei: cap esquema que no siga https, cap objecte mal fet, cap excepció', () => {
    expect(mitjansDe(null).imatge('https://example.org/a.jpg')).toBeNull();
    const dolent = {
      imatge: (url) => (url.endsWith('a.jpg') ? 'javascript:alert(1)' : url.endsWith('b.jpg') ? `${BASE}/i?u=b` : (() => { throw new Error('x'); })()),
      video: (enllac) => (enllac === 'x' ? { proveidor: 'youtube', id: 'x', incrustacio: 'data:text/html,hola' } : { proveidor: 'altre', id: 'y', incrustacio: INCRUSTACIO })
    };
    const mitjans = mitjansDe(dolent);
    expect(mitjans.imatge('https://example.org/a.jpg')).toBeNull();
    expect(mitjans.imatge('https://example.org/b.jpg')).toBe(`${BASE}/i?u=b`);
    expect(mitjans.imatge('https://example.org/c.jpg')).toBeNull();
    expect(mitjans.video('x')).toBeNull();
    expect(mitjans.video('y')).toBeNull();
    expect(Object.isFrozen(mitjansDe(creaServei()).video(MIRA))).toBe(true);
  });
});

describe('les fonts a l’arbre: una carpeta és el flux dels seus autors; una font, només el seu', () => {
  test('la carpeta i la font, a l’arbre del servei', async () => {
    obriLector('/app/lector/noticies/totes', creaServei());
    await waitFor(() => expect(fitxes()).toHaveLength(2));
    fireEvent.click(arbre().getByRole('button', { name: /^Vídeos per a aprendre/ }));
    await screen.findByRole('region', { name: 'Vídeos per a aprendre' });
    expect(fitxes().map((boto) => boto.querySelector('.sdp-gestor-fitxa__titol').textContent)).toEqual([TITOL_VIDEO]);
    fireEvent.click(arbre().getByRole('button', { name: /^Coneixement obert/ }));
    await screen.findByRole('region', { name: 'Coneixement obert' });
    fireEvent.click(await arbre().findByRole('button', { name: /^El Bloc de la Pedra/ }));
    await screen.findByRole('region', { name: 'El Bloc de la Pedra' });
    expect(fitxes().map((boto) => boto.querySelector('.sdp-gestor-fitxa__titol').textContent)).toEqual([TITOL_TEXT]);
    expect(detall().getByRole('button', { name: 'Deixa de seguir-la' })).toBeTruthy();
  });
});

describe('el vídeo, dins de la lectura i darrere d’una façana', () => {
  test('abans del clic, cap iframe ni cap adreça de YouTube que el navegador puga demanar; després, l’iframe del servei', async () => {
    const xarxa = vi.fn();
    vi.stubGlobal('fetch', xarxa);
    const servei = creaServei();
    obriLector('/app/lector/noticies/videos', servei);
    await waitFor(() => expect(fitxa(TITOL_VIDEO)).toBeTruthy());
    fireEvent.click(fitxa(TITOL_VIDEO));
    await screen.findByRole('heading', { level: 1, name: TITOL_VIDEO });
    expect(servei.video).toHaveBeenCalledWith(MIRA);
    const boto = detall().getByRole('button', { name: 'Mira el vídeo ací' });
    expect(detall().getByText('En prémer, YouTube rebrà la teua adreça IP.')).toBeTruthy();
    /* La façana: res a carregar. Només l'enllaç a l'original, que el navegador no segueix tot sol. */
    expect(document.querySelector('iframe, video, embed, object')).toBeNull();
    expect(adreces().filter((adreca) => adreca.includes('youtube-nocookie'))).toEqual([]);
    expect(adreces().filter((adreca) => /youtube/.test(adreca))).toEqual([MIRA, MIRA]);
    expect([...document.querySelectorAll('a')].filter((a) => a.getAttribute('href') === MIRA)
      .every((a) => a.getAttribute('target') === '_blank' && a.getAttribute('rel') === 'noopener noreferrer')).toBe(true);
    expect(detall().getByRole('link', { name: /^Obri’l a YouTube/ }).getAttribute('href')).toBe(MIRA);
    expect(xarxa).not.toHaveBeenCalled();
    fireEvent.click(boto);
    const iframe = document.querySelector('#app-grid-main iframe');
    expect(iframe.getAttribute('src')).toBe(INCRUSTACIO);
    expect(iframe.getAttribute('title')).toBe(`Vídeo: ${TITOL_VIDEO}`);
    expect(iframe.getAttribute('allow')).toBe('encrypted-media; picture-in-picture; fullscreen');
    expect(iframe.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin allow-presentation');
    expect(iframe.parentElement.className).toBe('embed-container');
    expect(document.querySelectorAll('iframe')).toHaveLength(1);
    expect(detall().queryByRole('button', { name: 'Mira el vídeo ací' })).toBeNull();
    expect(detall().getByRole('link', { name: /^Obri’l a YouTube/ })).toBeTruthy();
    expect(xarxa).not.toHaveBeenCalled();
  });

  test('una notícia que no és un vídeo no porta cap façana; sense servei.video, tampoc', async () => {
    obriLector('/app/lector/noticies/coneixement', creaServei());
    await waitFor(() => expect(fitxa(TITOL_TEXT)).toBeTruthy());
    fireEvent.click(fitxa(TITOL_TEXT));
    await screen.findByRole('heading', { level: 1, name: TITOL_TEXT });
    expect(detall().queryByRole('button', { name: 'Mira el vídeo ací' })).toBeNull();
    cleanup();
    obriLector('/app/lector/noticies/videos', { ...creaServei(), video: undefined });
    await waitFor(() => expect(fitxa(TITOL_VIDEO)).toBeTruthy());
    fireEvent.click(fitxa(TITOL_VIDEO));
    await screen.findByRole('heading', { level: 1, name: TITOL_VIDEO });
    expect(detall().queryByRole('button', { name: 'Mira el vídeo ací' })).toBeNull();
    expect(document.querySelector('iframe')).toBeNull();
  });
});

describe('interfície amb el servei: el que de veres ha passat', () => {
  test('correcció R5-08 · una adreça que el servei no llig: ho diu tal qual, sense «no ha respost» ni «ha enviat»', async () => {
    const servei = creaServei({ motiuPersonal: 'adreca' });
    const { api } = obriLector('/app/lector/noticies/totes', servei);
    await api.afigFontPersonal({ url: URL_PERSONAL, nom: 'El Barri' });
    const avis = await screen.findByText('Alguna adreça no es pot llegir');
    const text = avis.closest('[role="status"]').textContent;
    expect(text).toContain('El servei de notícies no llig l’adreça de El Barri: no és pública o no és segura, i no s’hi ha demanat res.');
    expect(text).not.toMatch(/no ha respost|ha enviat/);
    expect(detall().queryByRole('button', { name: 'Torna-ho a provar' })).toBeNull();
    fireEvent.click(await arbre().findByRole('button', { name: /^El Barri/ }));
    await screen.findByRole('region', { name: 'El Barri' });
    expect(detall().getByText('Esta adreça no es pot llegir')).toBeTruthy();
    expect(detall().getByText('El servei de notícies no llig esta adreça (no és pública o no és segura), i no ha demanat res a la web.')).toBeTruthy();
    expect(detall().queryByText(/ha enviat/)).toBeNull();
  });

  /* Actualitzada a posta (261024 Lector final): correcció L-07. L'estat ja no és una foto del muntatge:
     mentre el servei no ha dit la resposta definitiva (que hi és i que llig les teues), es torna a
     llegir en acabar cada ronda. Les xifres continuen sent exactes: una en muntar i una per ronda
     acabada, mai una per pintada ni en bucle. */
  test('el servei es consulta en muntar i en acabar cada ronda, mai a cada pintada; si no hi és (disponible false), el detall ho diu sense cap notícia inventada', async () => {
    const servei = creaServei({ estat: { disponible: false, personals: false } });
    obriLector('/app/lector/noticies/coneixement', servei);
    await screen.findByText('Ara mateix no arriben les notícies');
    expect(detall().getByText('El servei de notícies no respon. Pot ser cosa d’un moment.')).toBeTruthy();
    await waitFor(() => expect(servei.estat).toHaveBeenCalledTimes(2));
    expect(fitxes()).toHaveLength(0);
    await act(async () => { await new Promise((resol) => { setTimeout(resol, 20); }); });
    expect(servei.estat).toHaveBeenCalledTimes(2);
    fireEvent.click(detall().getByRole('button', { name: 'Torna-ho a provar' }));
    await screen.findByText('Ara mateix no arriben les notícies');
    await waitFor(() => expect(servei.estat).toHaveBeenCalledTimes(3));
    await act(async () => { await new Promise((resol) => { setTimeout(resol, 20); }); });
    expect(servei.estat).toHaveBeenCalledTimes(3);
  });

  test('correcció L-07 · amb la resposta definitiva (hi és i llig les teues), una sola consulta: cap ronda més la torna a fer', async () => {
    const servei = creaServei();
    obriLector('/app/lector/noticies/coneixement', servei);
    await waitFor(() => expect(fitxa(TITOL_TEXT)).toBeTruthy());
    await act(async () => { await new Promise((resol) => { setTimeout(resol, 20); }); });
    expect(servei.estat).toHaveBeenCalledTimes(1);
    /* Una ronda nova (apagar una font en fa una, sense «carregant»): cap consulta més. */
    fireEvent.click(arbre().getByRole('button', { name: 'Desplegar Coneixement obert' }));
    fireEvent.click(await arbre().findByRole('button', { name: /^El Bloc de la Pedra/ }));
    await screen.findByRole('region', { name: 'El Bloc de la Pedra' });
    fireEvent.click(detall().getByRole('button', { name: 'Deixa de seguir-la' }));
    await screen.findByText('No seguixes esta font');
    await act(async () => { await new Promise((resol) => { setTimeout(resol, 20); }); });
    expect(servei.estat).toHaveBeenCalledTimes(1);
  });
});

/* Correcció R5-09 · El #0F672F en brut d'apps.css pintava el títol de la barra de TOTES les apps.
   L'ordre del Mestre de les 14:40 el volia només per al Lector: un token del crom (tokens.css) i una
   regla per a l'id de l'app (data-sdp-app, que posa BarraApp). */
describe('correcció R5-09 · la barra verda és només del Lector', () => {
  const llig = (ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  test('el full: cap color en brut, la regla base sense fons i la del Lector amb el token del crom, declarat a tokens.css', () => {
    const apps = llig('src/apps/plataforma/apps.css');
    expect(apps).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    const base = apps.match(/\n\.sdp-app-barra__titol \{([^}]*)\}/)[1];
    expect(base).not.toMatch(/background/);
    expect(base).toMatch(/color:\s*var\(--sdp-crom-text\)/);
    const lector = apps.match(/\n\.sdp-app-barra__titol\[data-sdp-app="lector"\] \{([^}]*)\}/)[1];
    expect(lector.trim()).toBe('background-color: var(--sdp-crom-barra-lector);');
    // IDEA-40 (Mestre, 261028) · El token del Lector cita el verd de marca únic, --sdp-verd.
    expect(llig('src/css/tokens.css')).toMatch(/--sdp-crom-barra-lector:\s*var\(--sdp-verd\);/);
    const verdDeMarca = /* ALLOW_RAW_COLOR */ '#0f672f'; // el valor que va fixar el Mestre (IDEA-40)
    expect(llig('src/css/tokens.css')).toMatch(new RegExp(`--sdp-verd:\\s*${verdDeMarca};`, 'i'));
    expect(apps.match(/data-sdp-app/g)).toHaveLength(1);
  });

  test('BarraApp posa l’id de l’app al títol: el del Lector casa amb la regla; el d’una altra app, no', async () => {
    const registre = creaRegistre({ internes: [{ ...manifestLector, carrega: () => Promise.resolve({ default: () => null }) }, manifestDeProva()] });
    const munta = (url) => muntaPlataforma(url, {
      registre,
      entorn: ENTORN,
      fills: (
        <>
          <nav aria-label="Navegació principal"><BarraLateral><p>Barra de Sóc de Poble</p></BarraLateral></nav>
          <Routes><Route path="/app/*" element={<RutaApps />} /></Routes>
        </>
      )
    });
    munta('/app/lector/noticies');
    const titol = await waitFor(() => {
      const node = document.querySelector('.sdp-app-barra__titol');
      expect(node).not.toBeNull();
      return node;
    });
    expect(titol.getAttribute('data-sdp-app')).toBe('lector');
    expect(titol.matches('.sdp-app-barra__titol[data-sdp-app="lector"]')).toBe(true);
    cleanup();
    munta(`/app/${manifestDeProva().id}`);
    const altre = await waitFor(() => {
      const node = document.querySelector('.sdp-app-barra__titol');
      expect(node).not.toBeNull();
      return node;
    });
    expect(altre.matches('.sdp-app-barra__titol[data-sdp-app="lector"]')).toBe(false);
  });
});

/* Correcció L-04 (261024 Lector final, WCAG 2.4.3) · Cap acció de la font ni del vídeo deixa el focus
   al <body>: el botó premut es desmunta i el focus va al control que en pren el lloc. */
describe('correcció L-04 · el focus, després de les accions de la font i del vídeo', () => {
  /* `carpeta`: la de la font, que es desplega a l'arbre (una font sense carpeta és a l'arrel). */
  const triaLaFont = async (nom, carpeta = null) => {
    if (carpeta) fireEvent.click(await arbre().findByRole('button', { name: `Desplegar ${carpeta}` }));
    fireEvent.click(await arbre().findByRole('button', { name: new RegExp(`^${nom}`) }));
    await screen.findByRole('region', { name: nom });
  };

  test('«Deixa de seguir-la» porta el focus a «Torna a seguir-la», i a l’inrevés', async () => {
    obriLector('/app/lector/noticies/coneixement', creaServei());
    await waitFor(() => expect(fitxa(TITOL_TEXT)).toBeTruthy());
    await triaLaFont('El Bloc de la Pedra', 'Coneixement obert');
    const deixa = detall().getByRole('button', { name: 'Deixa de seguir-la' });
    deixa.focus();
    fireEvent.click(deixa);
    const torna = await detall().findByRole('button', { name: 'Torna a seguir-la' });
    expect(deixa.isConnected).toBe(false);
    expect(document.activeElement).toBe(torna);
    fireEvent.click(torna);
    await waitFor(() => expect(document.activeElement).toBe(detall().getByRole('button', { name: 'Deixa de seguir-la' })));
    expect(torna.isConnected).toBe(false);
    expect(document.activeElement).not.toBe(document.body);
  });

  test('si el focus ja és en un altre lloc (l’arbre), no es furta', async () => {
    obriLector('/app/lector/noticies/coneixement', creaServei());
    await waitFor(() => expect(fitxa(TITOL_TEXT)).toBeTruthy());
    await triaLaFont('El Bloc de la Pedra', 'Coneixement obert');
    const delArbre = arbre().getByRole('button', { name: /^Vídeos per a aprendre/ });
    delArbre.focus();
    fireEvent.click(detall().getByRole('button', { name: 'Deixa de seguir-la' }));
    await detall().findByRole('button', { name: 'Torna a seguir-la' });
    expect(document.activeElement).toBe(delArbre);
  });

  test('«Lleva la font» al detall: el focus va a la fila de l’arbre de la llista on queda la persona', async () => {
    const servei = creaServei();
    const { api } = obriLector('/app/lector/noticies/coneixement', servei);
    await waitFor(() => expect(fitxa(TITOL_TEXT)).toBeTruthy());
    await api.afigFontPersonal({ url: URL_PERSONAL, nom: 'El Barri' });
    await triaLaFont('El Barri');
    const lleva = detall().getByRole('button', { name: 'Lleva la font' });
    lleva.focus();
    fireEvent.click(lleva);
    await waitFor(() => expect(arbre().queryByRole('button', { name: /^El Barri/ })).toBeNull());
    await waitFor(() => expect(document.activeElement.getAttribute('aria-current')).toBe('page'));
    const actiu = document.activeElement;
    expect(actiu.closest('#app-grid-sidebar')).not.toBeNull();
    expect(actiu.tagName).toBe('BUTTON');
    /* La fila enfocada és la de la llista que es veu ara, al detall. */
    const regio = detall().getByRole('region');
    expect(actiu.querySelector('.sdp-workspace-nav-item__label').textContent).toBe(regio.getAttribute('aria-label'));
    expect(await api.llistaFontsPersonals()).toEqual([]);
  });

  test('«Mira el vídeo ací» porta el focus al reproductor', async () => {
    obriLector('/app/lector/noticies/videos', creaServei());
    await waitFor(() => expect(fitxa(TITOL_VIDEO)).toBeTruthy());
    fireEvent.click(fitxa(TITOL_VIDEO));
    await screen.findByRole('heading', { level: 1, name: TITOL_VIDEO });
    const boto = detall().getByRole('button', { name: 'Mira el vídeo ací' });
    boto.focus();
    fireEvent.click(boto);
    const iframe = document.querySelector('#app-grid-main iframe');
    expect(iframe).not.toBeNull();
    expect(document.activeElement).toBe(iframe);
  });
});

/* Correcció L-07 (261024 Lector final) · L'estat del servei es torna a llegir: una foto del muntatge
   deixava les fonts teues «pendents» quan el servei ja les llegia. */
describe('correcció L-07 · l’estat del servei no es queda vell', () => {
  /* navigator.onLine és un getter del prototip: es tapa a la instància (espaiNoticies.test.jsx). */
  const posaEnLinia = (valor) => act(() => {
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => valor });
    window.dispatchEvent(new Event(valor ? 'online' : 'offline'));
  });
  afterEach(() => {
    delete window.navigator.onLine;
  });
  const senseXarxa = () => Object.assign(new Error('fora'), { motiu: 'sense-connexio' });

  test('muntat fora de línia: les teues no es marquen pendents; quan torna la xarxa, el servei les llig i ho diu', async () => {
    posaEnLinia(false);
    const enLinia = () => window.navigator.onLine !== false;
    const base = creaServei();
    const servei = {
      ...base,
      estat: vi.fn(async () => (enLinia() ? { disponible: true, personals: true } : { disponible: false, personals: false })),
      feed: vi.fn(async (id) => {
        if (!enLinia()) throw senseXarxa();
        return base.feed(id);
      }),
      feedPersonal: vi.fn(async (url) => {
        if (!enLinia()) throw senseXarxa();
        return base.feedPersonal(url);
      })
    };
    const { api } = obriLector('/app/lector/noticies/totes', servei);
    await api.afigFontPersonal({ url: URL_PERSONAL, nom: 'El Barri' });
    await screen.findByText('Sembla que este dispositiu no té connexió. Quan torne, les notícies arribaran soles.');
    expect(await arbre().findByRole('button', { name: /^El Barri/ })).toBeTruthy();
    expect(arbre().queryByRole('button', { name: 'El Barri · pendent' })).toBeNull();
    /* Fora de línia no es pregunta: la resposta seria la falta de xarxa, no el servei. */
    expect(servei.estat).not.toHaveBeenCalled();
    posaEnLinia(true);
    await waitFor(() => expect(fitxes().length).toBeGreaterThan(0));
    expect(servei.estat).toHaveBeenCalled();
    expect(await arbre().findByRole('button', { name: /^El Barri \d+ sense llegir$/ })).toBeTruthy();
    expect(arbre().queryByRole('button', { name: /^El Barri · pendent/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Gestiona les fonts' }));
    const gestio = within(await screen.findByRole('dialog', { name: 'Gestiona les fonts' }));
    expect(gestio.getByText(/^Les teues fonts també les llig el servei de notícies\./)).toBeTruthy();
    expect(gestio.queryByText(/encara no les llig/)).toBeNull();
  });

  test('el servei diu primer que no llig les teues i després que sí: la ronda següent les llig i l’arbre deixa de dir «pendent»', async () => {
    let estat = { disponible: true, personals: false };
    const base = creaServei();
    const servei = {
      ...base,
      estat: vi.fn(async () => estat),
      feedPersonal: vi.fn(async (url) => {
        if (!estat.personals) throw Object.assign(new Error('apagades'), { motiu: 'personals-off' });
        return base.feedPersonal(url);
      })
    };
    const { api } = obriLector('/app/lector/noticies/coneixement', servei);
    await waitFor(() => expect(fitxa(TITOL_TEXT)).toBeTruthy());
    await api.afigFontPersonal({ url: URL_PERSONAL, nom: 'El Barri' });
    expect(await arbre().findByRole('button', { name: 'El Barri · pendent' })).toBeTruthy();
    estat = { disponible: true, personals: true };
    /* Una ronda nova qualsevol (apagar una font en fa una): en acabar, l'estat es torna a llegir. */
    fireEvent.click(arbre().getByRole('button', { name: /^Vídeos per a aprendre/ }));
    fireEvent.click(await arbre().findByRole('button', { name: /^Canal de la Pedra/ }));
    await screen.findByRole('region', { name: 'Canal de la Pedra' });
    fireEvent.click(detall().getByRole('button', { name: 'Deixa de seguir-la' }));
    expect(await arbre().findByRole('button', { name: /^El Barri \d+ sense llegir$/ })).toBeTruthy();
    expect(arbre().queryByRole('button', { name: 'El Barri · pendent' })).toBeNull();
    expect(servei.feedPersonal.mock.calls.at(-1)[0]).toBe(URL_PERSONAL);
  });
});

/* Correcció L-10 (261024 Lector final) · «Afig una font» valida amb la regla del client del servei,
   que arriba per la porta del servei (servei.adrecaPersonal → mitjans.js · adreca), sense cap còpia a
   l'app. Ací, un servei fals amb la regla que ha de complir el client (https, sense usuari ni port,
   com a molt 512 caràcters, un nom públic amb punt, cap IP ni nom local). */
describe('correcció L-10 · «Afig una font» no desa cap adreça que el servei no llegiria', () => {
  const NOMS_LOCALS = /(?:^|\.)(?:localhost|local|internal|lan|home|test|invalid)$/;
  function reglaDelClient(valor) {
    if (typeof valor !== 'string' || valor.length === 0 || valor.length > 512) return null;
    let url;
    try {
      url = new URL(valor);
    } catch {
      return null;
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname;
    if (!host.includes('.') || host.startsWith('[') || /^\d+(?:\.\d+){3}$/.test(host) || NOMS_LOCALS.test(host)) return null;
    url.hash = '';
    return url.href.length > 512 ? null : url.href;
  }
  const ADRECA = 'El servei de notícies no llig esta adreça (no és pública o no és segura), i no ha demanat res a la web.';
  const campDeLAdreca = () => screen.getByRole('textbox', { name: /^Adreça del feed/ });

  test('un port, una IP, localhost, un nom sense punt, una adreça massa llarga o amb usuari: el motiu \'adreca\' abans de desar, i res desat ni demanat', async () => {
    const servei = { ...creaServei(), adrecaPersonal: vi.fn(reglaDelClient) };
    const { api } = obriLector('/app/lector/noticies/coneixement', servei);
    await waitFor(() => expect(fitxa(TITOL_TEXT)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Gestiona les fonts' }));
    const gestio = within(await screen.findByRole('dialog', { name: 'Gestiona les fonts' }));
    /* L'adreça amb usuari es compon a trossos: la porta de dades sintètiques la llegiria com un correu. */
    const dolentes = [
      'https://feed.example.org:8443/rss',
      'https://192.0.2.10/feed',
      'https://localhost/feed',
      'https://intranet/feed',
      `https://example.org/${'a'.repeat(500)}`,
      ['https://usuari', 'example.org/feed'].join('@')
    ];
    for (const dolenta of dolentes) {
      fireEvent.change(campDeLAdreca(), { target: { value: dolenta } });
      fireEvent.click(gestio.getByRole('button', { name: 'Afig la font' }));
      expect(await gestio.findByText(ADRECA), dolenta).toBeTruthy();
      expect(campDeLAdreca().getAttribute('aria-invalid')).toBe('true');
      await waitFor(() => expect(document.activeElement).toBe(campDeLAdreca()));
    }
    expect(servei.adrecaPersonal.mock.calls.map(([valor]) => valor)).toEqual(dolentes);
    expect(await api.llistaFontsPersonals()).toEqual([]);
    expect(servei.feedPersonal).not.toHaveBeenCalled();
    expect(gestio.queryByText('Font afegida')).toBeNull();
  });

  test('una adreça que el servei llig es desa tal com l’enviaria (normalitzada, sense el fragment) i el servei la llig', async () => {
    const servei = { ...creaServei(), adrecaPersonal: vi.fn(reglaDelClient) };
    const { api } = obriLector('/app/lector/noticies/coneixement', servei);
    await waitFor(() => expect(fitxa(TITOL_TEXT)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Gestiona les fonts' }));
    const gestio = within(await screen.findByRole('dialog', { name: 'Gestiona les fonts' }));
    fireEvent.change(campDeLAdreca(), { target: { value: `  ${URL_PERSONAL}#ara  ` } });
    fireEvent.change(gestio.getByRole('textbox', { name: /^Nom de la font/ }), { target: { value: 'El Barri' } });
    fireEvent.click(gestio.getByRole('button', { name: 'Afig la font' }));
    expect(await gestio.findByText('«El Barri» ja és a l’arbre.')).toBeTruthy();
    expect((await api.llistaFontsPersonals()).map((font) => font.url)).toEqual([URL_PERSONAL]);
    await waitFor(() => expect(servei.feedPersonal.mock.calls.map(([url]) => url)).toEqual([URL_PERSONAL]));
  });

  test('mitjans.js no es fia de la regla: només una adreça https neta; sense regla, null (el formulari fa la seua comprovació de sempre)', () => {
    expect(mitjansDe(null).adreca).toBeNull();
    expect(mitjansDe(creaServei()).adreca).toBeNull();
    const adreca = mitjansDe({
      adrecaPersonal: (valor) => {
        if (valor.endsWith('/a')) return 'javascript:alert(1)';
        if (valor.endsWith('/b')) return 'http://example.org/b';
        if (valor.endsWith('/c')) throw new Error('x');
        if (valor.endsWith('/d')) return { href: 'https://example.org/d' };
        return valor;
      }
    }).adreca;
    expect(adreca('https://example.org/a')).toBeNull();
    expect(adreca('https://example.org/b')).toBeNull();
    expect(adreca('https://example.org/c')).toBeNull();
    expect(adreca('https://example.org/d')).toBeNull();
    expect(adreca('')).toBeNull();
    expect(adreca(42)).toBeNull();
    expect(adreca('https://example.org/e')).toBe('https://example.org/e');
  });
});
