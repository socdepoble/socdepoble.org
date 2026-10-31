import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import TaulerTelemetria, {
  basesDelTauler, horesDelTauler, nomDeLIntent, nomDeSeccio, resumDelTauler, seccionsDelTauler
} from './TaulerTelemetria';
import {
  CLAU_APAGADA, configTelemetria, registraEsdeveniment, registraVisita, _reiniciaTelemetria
} from '../../data/telemetria.js';

const ID_DEL_TAULER = 'lQNmqOm9PM8XD3eF';
const ENLLAC_EU = `https://cloud.umami.is/analytics/eu/share/${ID_DEL_TAULER}`;
const ENLLAC_CURT = `https://cloud.umami.is/share/${ID_DEL_TAULER}`;
const ID_WEB = '6ffce900-c41a-470e-9b12-38fb6028db18';
const TESTIMONI = 'testimoni.de.prova';
const SENSE_COMPTADOR = configTelemetria({});
const AMB_TAULER = configTelemetria({ VITE_UMAMI_SHARE_URL: ENLLAC_EU });
const AMB_TAULER_CURT = configTelemetria({ VITE_UMAMI_SHARE_URL: ENLLAC_CURT });
const AMB_TAULER_PROPI = configTelemetria({ VITE_UMAMI_SHARE_URL: 'https://compta.socdepoble.org/share/Ab12/socdepoble' });
const AMB_COMPTADOR = configTelemetria({
  VITE_UMAMI_WEBSITE_ID: '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  VITE_UMAMI_HOST: 'https://compta.socdepoble.org'
});
const INTERRUPTOR = { name: "Comptar les meues visites des d'este navegador" };
const TAULER_TANCAT = 'El tauler públic no està obert ara mateix';
const ENLLAC_ORIGINAL = { name: 'Obri el tauler original en una pestanya nova' };
/* 30-10-2026 a les 22:19:59 UTC: les 23:19:59 a la Península (ja en CET). */
const ARA = Date.UTC(2026, 9, 30, 22, 19, 59);
const posaDNT = (valor) => Object.defineProperty(window.navigator, 'doNotTrack', { value: valor, configurable: true });

/* Ordre del Mestre (30-10-2026, prompt 2208, T3.1) · Cap prova toca la xarxa:
   el fetch s'injecta i respon el que va respondre cloud.umami.is el
   30-10-2026 (formes comprovades amb curl; xifres retocades). */
const resposta = ({ status = 200, cos, tipus = 'cors', redirigida = false, json } = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  type: tipus,
  redirected: redirigida,
  json: json || (async () => cos)
});
const UMAMI = Object.freeze({
  share: resposta({ cos: { shareId: 'ba8051d0', shareType: 1, parameters: {}, websiteId: ID_WEB, token: TESTIMONI } }),
  stats: resposta({ cos: { pageviews: 12345, visitors: 16, visits: 83, bounces: 9, totaltime: 101714, comparison: {} } }),
  active: resposta({ cos: { visitors: 2 } }),
  pageviews: resposta({
    cos: {
      pageviews: [
        { x: '2026-10-30T00:00:00Z', y: 92 },
        { x: '2026-10-30T03:00:00Z', y: 136 },
        { x: '2026-10-30T23:00:00Z', y: 5 }
      ],
      sessions: [
        { x: '2026-10-30T00:00:00Z', y: 6 },
        { x: '2026-10-30T03:00:00Z', y: 9 },
        { x: '2026-10-30T23:00:00Z', y: 3 }
      ]
    }
  }),
  metrics: resposta({ cos: [{ x: '/xat', y: 11 }, { x: '/notes', y: 8 }, { x: '/xat/*', y: 6 }, { x: '/page/*', y: 1 }] })
});
const PECA = /\/api\/websites\/[^/]+\/(stats|active|pageviews|metrics)$/;
/** Un Umami simulat que respon per camí. `canvis` substituïx peces: una resposta, una funció de l'adreça o un Error. */
function fetchUmami(canvis = {}) {
  const peces = { ...UMAMI, ...canvis };
  return vi.fn(async (adreca) => {
    const { pathname } = new URL(adreca);
    const nom = pathname.includes('/api/share/') ? 'share' : pathname.match(PECA)?.[1];
    const peca = typeof peces[nom] === 'function' ? peces[nom](adreca) : peces[nom];
    if (peca instanceof Error) throw peca;
    return peca ?? resposta({ status: 404 });
  });
}
const xifresPintades = (container) => Object.fromEntries([...container.querySelectorAll('.sdp-quadre__xifra')].map((targeta) => {
  const valor = targeta.querySelector('.sdp-quadre__valor');
  return [targeta.querySelector('dt').textContent, (valor.querySelector('[aria-hidden="true"]') || valor).textContent];
}));
/* «Visitants» ix a la targeta, a l'explicació i a la llegenda: s'espera l'etiqueta de la targeta. */
const esperaXifres = () => screen.findByText('Visitants', { selector: 'dt' });
const TITOL_GRAFICA = 'Visitants i vistes de cada hora, les últimes 24 hores (hora peninsular)';

let fetchOriginal;
beforeEach(() => {
  _reiniciaTelemetria(); window.localStorage.removeItem(CLAU_APAGADA); delete window.umami; posaDNT(null);
  fetchOriginal = window.fetch;
});
afterEach(() => {
  cleanup(); window.localStorage.removeItem(CLAU_APAGADA); posaDNT(null); delete window.umami;
  window.fetch = fetchOriginal;
  delete window.IntersectionObserver;
  vi.unstubAllEnvs();
});

test('sense enllaç públic: estat buit honest i cap iframe ni xifra', () => {
  const { container } = render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  expect(screen.getByText('El tauler públic encara no està endollat')).toBeTruthy();
  expect(container.querySelector('iframe')).toBeNull();
  expect(screen.getByText(/no té cap comptador propi configurat/)).toBeTruthy();
});

test('T3.1: tauler nadiu amb les xifres del comptador, en format local i sense cap iframe', async () => {
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchUmami()} ara={ARA} />);
  expect(await esperaXifres()).toBeTruthy();
  expect(container.querySelector('iframe')).toBeNull();
  expect(screen.queryByText(TAULER_TANCAT)).toBeNull();
  const xifres = xifresPintades(container);
  expect(Object.keys(xifres)).toEqual(['Visitants', 'Visites', 'Vistes', 'Percentatge de rebot', 'Temps mitjà de visita']);
  expect(xifres.Visitants).toBe('16');
  expect(xifres.Visites).toBe('83');
  expect(xifres.Vistes).toBe('12.345');
  // Les fórmules del tauler d'Umami: min(visites, rebots) / visites i temps total / visites.
  expect(xifres['Percentatge de rebot']).toMatch(/^11\s%$/);
  // Espais durs dins de cada parella: «20 min» i «25 s» no es parteixen mai.
  const dur = String.fromCharCode(0xa0);
  expect(xifres['Temps mitjà de visita']).toBe(`20${dur}min 25${dur}s`);
  expect(screen.getByText('20 minuts i 25 segons').className).toBe('sdp-nomes-lector');
  expect(container.querySelector('.sdp-quadre__estat').textContent).toBe('En línia ara mateix: 2 persones');
  expect(container.querySelector('.sdp-quadre__estat').classList.contains('sdp-quadre__estat--viu')).toBe(true);
  expect(container.querySelector('.sdp-quadre__periode').textContent)
    .toBe('Les xifres de les últimes 24 hores, fins a les 23:19 (hora peninsular).');
});

/* Ordre del Mestre (31-10-2026, 00:20, prompt 2208, T3.1) · El tauler el
   pinta la peça reutilitzable de Pedra Seca; les targetes només porten
   etiqueta i xifra, i què vol dir cada xifra va fora, a tota amplada i amb
   el cos de paràgraf (cap classe de lletra menuda dins del quadre). */
test('T3.1 (00:20): el pinta el Quadre de Comandament; targetes d’etiqueta i xifra, explicacions fora i cap lletra menuda', async () => {
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchUmami()} ara={ARA} />);
  await esperaXifres();
  const quadre = container.querySelector('.sdp-telemetria > .sdp-quadre');
  expect(quadre).not.toBeNull();
  for (const targeta of quadre.querySelectorAll('.sdp-quadre__xifra')) {
    expect([...targeta.children].map((fill) => fill.tagName)).toEqual(['DT', 'DD']);
  }
  expect(quadre.querySelector('.sdp-quadre__xifra [class*="pista"], .sdp-quadre__xifra p, .sdp-quadre__xifra li')).toBeNull();
  const explicacio = quadre.querySelector(':scope > .sdp-quadre__explicacio');
  expect(explicacio.closest('.sdp-quadre__xifres')).toBeNull();
  const definicions = [...explicacio.querySelectorAll('li')].map((li) => li.textContent);
  expect(definicions).toEqual([
    "Visitants: navegadors diferents que han entrat (el mòbil i l'ordinador d'una mateixa persona en són dos).",
    'Visites: voltes que algú ha entrat. En una visita es poden obrir moltes pàgines.',
    'Vistes: pàgines obertes en total, sumant totes les visites.',
    "Percentatge de rebot: visites que només han obert una pàgina i se n'han anat.",
    'Temps mitjà de visita: el que dura, de mitjana, cada visita.'
  ]);
  expect(explicacio.querySelector('ul').className).toBe('sdp-telemetria__punts');
  // Les classes de lletra menuda de la secció (moment i dades de la llista d'intents) no entren al quadre.
  expect(quadre.querySelector('.sdp-telemetria__dades, .sdp-telemetria__moment, .sdp-histograma')).toBeNull();
});

test('T3.1 (00:20): la gràfica porta visitants i vistes de cada hora, amb llegenda, i l’hora en curs remarcada', async () => {
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchUmami()} ara={ARA} />);
  const figura = await screen.findByRole('figure', { name: TITOL_GRAFICA });
  expect(figura.closest('.sdp-quadre')).toBeTruthy();
  expect([...figura.querySelectorAll('.sdp-quadre__llegenda > li')].map((li) => li.textContent)).toEqual(['Visitants', 'Vistes']);
  const botons = within(figura).getAllByRole('button');
  expect(botons).toHaveLength(24);
  // El nom de cada botó: el detall sencer (la marca de l'eix és aria-hidden).
  const noms = botons.map((boto) => boto.querySelector('.sdp-nomes-lector').textContent);
  expect(noms[0]).toBe('00:00 h: 92 vistes · 6 visitants');
  expect(noms[1]).toBe('01:00 h: 0 vistes · 0 visitants');
  expect(noms[3]).toBe('03:00 h: 136 vistes · 9 visitants');
  expect(noms[23]).toBe('23:00 h: 5 vistes · 3 visitants');
  /* Gauntlet f8 (F8-CRIT-01) · Alçada exacta, no escalons: la barra puja
     des de baix fins a y, i 3, 6 i 9 visitants són tres alçades. */
  const alcada = (boto, serie) => {
    const rect = boto.querySelector(`.sdp-quadre__barra--${serie}`);
    expect(rect.getAttribute('height')).toBe('200%'); // travessa el zero: la base, retallada
    return 1 - Number.parseFloat(rect.getAttribute('y')) / 100;
  };
  expect(alcada(botons[3], 'darrere')).toBe(1);
  expect(alcada(botons[3], 'davant')).toBeCloseTo(9 / 136, 5);
  const visitants = [23, 0, 3].map((h) => alcada(botons[h], 'davant'));
  expect(visitants.map((f) => Math.round(f * 136))).toEqual([3, 6, 9]);
  expect(botons[1].querySelector('rect')).toBeNull(); // 01:00 h, cap vista: cap barra
  expect(botons[23].closest('li').className).toMatch(/sdp-quadre__columna--destacada/);
  expect([...figura.querySelectorAll('.sdp-quadre__marca')].map((n) => n.textContent).filter(Boolean)).toEqual(['00', '06', '12', '18']);
  expect(container.querySelector('.sdp-quadre__detall').textContent).toBe('23:00 h: 5 vistes · 3 visitants');
});

test('T3.1 (00:20): el detall exacte de l’hora en passar el ratolí, en tocar i amb el teclat', async () => {
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchUmami()} ara={ARA} />);
  const figura = await screen.findByRole('figure', { name: TITOL_GRAFICA });
  const detall = () => container.querySelector('.sdp-quadre__detall').textContent;
  const botons = within(figura).getAllByRole('button');
  fireEvent.pointerEnter(botons[3], { pointerType: 'mouse' });
  expect(detall()).toBe('03:00 h: 136 vistes · 9 visitants');
  fireEvent.pointerLeave(figura.querySelector('.sdp-quadre__barres'), { pointerType: 'mouse' });
  expect(detall()).toBe('23:00 h: 5 vistes · 3 visitants');
  fireEvent.click(botons[0]);
  expect(detall()).toBe('00:00 h: 92 vistes · 6 visitants');
  act(() => { botons[0].focus(); });
  fireEvent.keyDown(botons[0], { key: 'ArrowRight' });
  expect(document.activeElement).toBe(botons[1]);
  expect(detall()).toBe('01:00 h: 0 vistes · 0 visitants');
});

test('T3.1 (00:20): un Umami sense sessions per hora pinta només les vistes, sense inventar visitants', async () => {
  const pageviews = resposta({ cos: { pageviews: [{ x: '2026-10-30T03:00:00Z', y: 136 }] } });
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchUmami({ pageviews })} ara={ARA} />);
  const figura = await screen.findByRole('figure', { name: 'Vistes de cada hora, les últimes 24 hores (hora peninsular)' });
  expect([...figura.querySelectorAll('.sdp-quadre__llegenda > li')].map((li) => li.textContent)).toEqual(['Vistes']);
  expect(screen.getByRole('button', { name: '03:00 h: 136 vistes' })).toBe(within(figura).getAllByRole('button')[3]);
  expect(container.querySelector('.sdp-quadre__barra--davant')).toBeNull();
});

test('T3.1 (00:20): les seccions més visitades, una línia per fila: nom humà i <code> en línia, visitants a la dreta i barra suau', async () => {
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchUmami()} ara={ARA} />);
  await screen.findByRole('heading', { level: 5, name: 'Les seccions més visitades' });
  const llista = screen.getByRole('list', { name: 'Les seccions més visitades' });
  const files = [...llista.querySelectorAll('.sdp-quadre__fila')];
  // Ordre del Mestre (31-10-2026, 01:10): el nom net de la secció, sense «Visita a:».
  expect(files.map((fila) => fila.querySelector('.sdp-quadre__nom').textContent)).toEqual([
    'Xat',
    'Bloc de notes',
    'Xat (conversa o canal)',
    'Pàgines informatives'
  ]);
  expect(llista.textContent).not.toMatch(/Visita a/);
  expect(files.map((fila) => fila.querySelector('.sdp-quadre__etiqueta code').textContent)).toEqual(['/xat', '/notes', '/xat/*', '/page/*']);
  expect(files.map((fila) => fila.querySelector('.sdp-quadre__compte').textContent)).toEqual(['11 visitants', '8 visitants', '6 visitants', '1 visitant']);
  // Amplada exacta (Gauntlet f8, F8-CRIT-05): 11, 8, 6 i 1 de 11.
  expect(files.map((fila) => fila.querySelector('.sdp-quadre__proporcio-barra').getAttribute('width'))).toEqual(['100%', '72.727%', '54.545%', '9.091%']);
  expect(container.querySelector('.sdp-quadre .sdp-telemetria__dades')).toBeNull();
  expect(screen.queryByText('Altres adreces, que no mostrem')).toBeNull();
});

/* Gauntlet f6 (31-10-2026, T3.1-rutes-de-tercers-sense-filtre) · El comptador
   és públic: qualsevol li pot enviar rutes. A /legal només es copia la ruta
   tapada que sabem nomenar; la resta es compta sense mostrar-ne el text. */
test('T3.1: una ruta enviada per un altre o una fitxa sense tapar no es pinta; es compta com a «altres adreces»', async () => {
  const metrics = resposta({
    cos: [
      { x: '/xat', y: 11 },
      { x: '/compra-ara-a-casino-exemple-com', y: 50 },
      { x: '/javillinares', y: 3 },
      { x: '/perfil/0a1b2c3d', y: 2 },
      { x: '/<b>hola</b> visita www.exemple.com', y: 9 },
      { x: '/Xat', y: 1 }
    ]
  });
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchUmami({ metrics })} ara={ARA} />);
  await screen.findByRole('heading', { level: 5, name: 'Les seccions més visitades' });
  const files = [...container.querySelectorAll('.sdp-quadre__fila')];
  expect([...container.querySelectorAll('.sdp-quadre__ranquing code')].map((codi) => codi.textContent)).toEqual(['/xat']);
  expect(files).toHaveLength(2);
  expect(files[1].querySelector('.sdp-quadre__nom').textContent).toBe('Altres adreces, que no mostrem');
  expect(files[1].textContent).toMatch(/5 adreces/);
  const tauler = container.querySelector('.sdp-quadre').textContent;
  expect(tauler).not.toMatch(/casino|javillinares|0a1b2c3d|hola|exemple/);
  expect(container.querySelector('.sdp-quadre b')).toBeNull();
  expect(screen.queryByText('Cap secció visitada en les últimes 24 hores.')).toBeNull();
});

test('T3.1: si cap ruta és de Sóc de Poble, no diu «cap secció visitada»: diu quantes adreces no mostra', async () => {
  const metrics = resposta({ cos: [{ x: '/spam-de-fora', y: 4 }] });
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchUmami({ metrics })} ara={ARA} />);
  await screen.findByRole('heading', { level: 5, name: 'Les seccions més visitades' });
  expect(screen.queryByText('Cap secció visitada en les últimes 24 hores.')).toBeNull();
  const files = [...container.querySelectorAll('.sdp-quadre__fila')];
  expect(files).toHaveLength(1);
  expect(files[0].textContent).toMatch(/Altres adreces, que no mostrem1 adreça(?!s)/);
  expect(container.querySelector('.sdp-quadre').textContent).not.toMatch(/spam-de-fora/);
});

/* Les 31 rutes que el comptador públic tornava el 30-10-2026 (90 dies; curl
   a l'API de compartició, f6/tauler-umami-critic/curl/metrics_all.json). */
const RUTES_REALS = [
  '/xat', '/notes', '/page/*', '/xat/*', '/mur', '/pobles', '/legal', '/control', '/wikidepoble', '/multimedia',
  '/disseny', '/calendari', '/app/*', '/consola', '/versions', '/consola/*', '/plugin/*', '/el-meu-perfil', '/',
  '/lector', '/mercat', '/anima', '/dispositius', '/projecte', '/constitucio', '/fedivers', '/events/*',
  '/traduccions', '/mercat/*', '/fediversity', '/registre'
];
test('T3.1 i T3.2: les rutes reals del comptador porten nom humà; només /lector, que no és cap ruta de l’app, no en té', () => {
  const generiques = RUTES_REALS.filter((ruta) => nomDeLIntent({ tipus: 'visita', url: ruta }).startsWith('Visita a una altra part'));
  expect(generiques).toEqual(['/lector']);
  let mostrades = 0;
  let amagades = 0;
  for (let i = 0; i < RUTES_REALS.length; i += 8) {
    const tros = seccionsDelTauler(RUTES_REALS.slice(i, i + 8).map((x) => ({ x, y: 1 })));
    mostrades += tros.seccions.length;
    amagades += tros.amagades;
  }
  expect([mostrades, amagades]).toEqual([30, 1]);
  expect(seccionsDelTauler({ no: 'llista' })).toBeNull();
  // Ordre del Mestre (31-10-2026, 01:10): al rànquing, nom net per a totes; cap «Visita».
  const netes = RUTES_REALS.map((ruta) => [ruta, nomDeSeccio(ruta)]);
  expect(netes.filter(([, nom]) => nom === null).map(([ruta]) => ruta)).toEqual(['/lector']);
  expect(netes.filter(([, nom]) => /visita/i.test(nom || ''))).toEqual([]);
});

/* Ordre del Mestre (31-10-2026, 01:10) · «Les seccions més visitades» ja diu
   que són visites: cada fila, el nom net de la secció. «Visita a: …» es
   queda només al registre d'activitat, on conviu amb els clics. */
test.each([
  ['/', 'Inici'],
  ['/xat', 'Xat'],
  ['/xat/*', 'Xat (conversa o canal)'],
  ['/chat/*', 'Xat (conversa o canal)'],
  ['/notes', 'Bloc de notes'],
  ['/notes/*', 'Bloc de notes (una pàgina de dins)'],
  ['/mur', 'El Mur'],
  ['/wikidepoble', 'Wiki de Poble'],
  ['/pobles', 'Pobles'],
  ['/multimedia', 'Multimèdia'],
  ['/page/*', 'Pàgines informatives'],
  ['/perfil/*', 'Fitxes i perfils'],
  ['/plugin/*', "Fitxes d'eines"],
  ['/app', 'Apps'],
  ['/app/*', 'Apps (una pàgina de dins)'],
  ['/events/*', 'Agenda (una pàgina de dins)'],
  ['/legal', 'Legal i privacitat']
])('rànquing: %s es diu «%s», sense «Visita a:»', (ruta, nom) => {
  expect(nomDeSeccio(ruta)).toBe(nom);
});

test('rànquing net i registre amb «Visita a:»: la mateixa ruta, cada nom al seu lloc', async () => {
  const metrics = resposta({ cos: [{ x: '/mur', y: 4 }] });
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchUmami({ metrics })} ara={ARA} />);
  await screen.findByRole('heading', { level: 5, name: 'Les seccions més visitades' });
  act(() => { registraVisita('/mur', { cfg: SENSE_COMPTADOR }); });
  expect(container.querySelector('.sdp-quadre__fila .sdp-quadre__nom').textContent).toBe('El Mur');
  expect(container.querySelector('.sdp-telemetria__llista .sdp-telemetria__nom').textContent).toBe('Visita a: El Mur');
});

test('T3.1: al peu, l’enllaç al tauler original en una pestanya nova, sense referent', async () => {
  render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchUmami()} ara={ARA} />);
  const enllac = await screen.findByRole('link', ENLLAC_ORIGINAL);
  expect(enllac.getAttribute('href')).toBe(ENLLAC_EU);
  expect(enllac.getAttribute('target')).toBe('_blank');
  expect(enllac.getAttribute('rel')).toBe('noopener noreferrer');
});

test('T3.1: una fitxa pública i quatre lectures amb el testimoni, sense galetes, referent ni redireccions', async () => {
  const fetchTauler = fetchUmami();
  render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchTauler} ara={ARA} />);
  await esperaXifres();
  expect(fetchTauler).toHaveBeenCalledTimes(5);
  const [[adrecaFitxa, opcionsFitxa], ...lectures] = fetchTauler.mock.calls;
  expect(adrecaFitxa).toBe(`https://cloud.umami.is/analytics/eu/api/share/${ID_DEL_TAULER}`);
  expect(opcionsFitxa).toMatchObject({
    method: 'GET', mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'manual', cache: 'no-store'
  });
  expect(opcionsFitxa.headers).toBeUndefined();
  const web = `https://cloud.umami.is/analytics/eu/api/websites/${ID_WEB}`;
  const finestra = `startAt=${ARA - 24 * 60 * 60 * 1000}&endAt=${ARA}`;
  expect(lectures.map(([adreca]) => adreca).sort()).toEqual([
    `${web}/active`,
    `${web}/metrics?${finestra}&type=path&limit=8`,
    `${web}/pageviews?${finestra}&unit=hour&timezone=Europe%2FMadrid`,
    `${web}/stats?${finestra}`
  ]);
  for (const [, opcions] of lectures) {
    expect(opcions).toMatchObject({ method: 'GET', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'manual' });
    expect(opcions.headers).toEqual({ 'x-umami-share-token': TESTIMONI, 'x-umami-share-context': '1' });
    expect(opcions.signal).toBe(opcionsFitxa.signal);
  }
});

/* Hui /api/share de l'arrel de cloud.umami.is respon 404 i el tauler viu a
   /analytics/eu: preguntar primer allí evita un 404 roig a la consola. */
test('T3.1: l’enllaç curt de cloud.umami.is pregunta primer a /analytics/eu, sense cap 404', async () => {
  const fetchTauler = fetchUmami({
    share: (adreca) => (adreca.startsWith('https://cloud.umami.is/analytics/eu/') ? UMAMI.share : resposta({ status: 404 }))
  });
  render(<TaulerTelemetria config={AMB_TAULER_CURT} fetchTauler={fetchTauler} ara={ARA} />);
  expect(await esperaXifres()).toBeTruthy();
  const adreces = fetchTauler.mock.calls.map(([adreca]) => adreca);
  expect(adreces).toHaveLength(5);
  expect(adreces[0]).toBe(`https://cloud.umami.is/analytics/eu/api/share/${ID_DEL_TAULER}`);
  expect(adreces.slice(1).every((adreca) => adreca.startsWith(`https://cloud.umami.is/analytics/eu/api/websites/${ID_WEB}/`))).toBe(true);
  expect(screen.getByRole('link', ENLLAC_ORIGINAL).getAttribute('href')).toBe(ENLLAC_CURT);
});

test('T3.1: si /analytics/eu respon 404, l’enllaç curt prova l’arrel i hi llig les xifres', async () => {
  const fetchTauler = fetchUmami({
    share: (adreca) => (adreca.startsWith('https://cloud.umami.is/analytics/eu/') ? resposta({ status: 404 }) : UMAMI.share)
  });
  render(<TaulerTelemetria config={AMB_TAULER_CURT} fetchTauler={fetchTauler} ara={ARA} />);
  expect(await esperaXifres()).toBeTruthy();
  const adreces = fetchTauler.mock.calls.map(([adreca]) => adreca);
  expect(adreces.slice(0, 2)).toEqual([
    `https://cloud.umami.is/analytics/eu/api/share/${ID_DEL_TAULER}`,
    `https://cloud.umami.is/api/share/${ID_DEL_TAULER}`
  ]);
  expect(adreces.slice(2).every((adreca) => adreca.startsWith(`https://cloud.umami.is/api/websites/${ID_WEB}/`))).toBe(true);
});

test('T3.1: només un 404 fa provar l’altra adreça (una redirecció o un 403 no)', async () => {
  for (const share of [resposta({ status: 307 }), resposta({ status: 403 })]) {
    const fetchTauler = fetchUmami({ share });
    render(<TaulerTelemetria config={AMB_TAULER_CURT} fetchTauler={fetchTauler} ara={ARA} />);
    expect(await screen.findByText(TAULER_TANCAT)).toBeTruthy();
    expect(fetchTauler.mock.calls.map(([adreca]) => adreca)).toEqual([`https://cloud.umami.is/analytics/eu/api/share/${ID_DEL_TAULER}`]);
    cleanup();
  }
});

test('T3.1: un comptador propi no prova cap regió d’Umami Cloud', async () => {
  const fetchTauler = fetchUmami({ share: resposta({ status: 404 }) });
  render(<TaulerTelemetria config={AMB_TAULER_PROPI} fetchTauler={fetchTauler} ara={ARA} />);
  expect(await screen.findByText(TAULER_TANCAT)).toBeTruthy();
  expect(fetchTauler.mock.calls.map(([adreca]) => adreca)).toEqual(['https://compta.socdepoble.org/api/share/Ab12']);
});

const HTML = async () => { throw new SyntaxError('HTML'); };
test.each([
  ['fitxa 404 a les dos regions (enllaç caducat)', AMB_TAULER_CURT, { share: resposta({ status: 404, json: HTML }) }, /no existix: pot haver caducat/],
  ['fitxa 307 cap a l’entrada (redirecció opaca)', AMB_TAULER, { share: resposta({ status: 0, tipus: 'opaqueredirect' }) }, /pantalla d'entrada amb compte/],
  ['fitxa 307 cap a l’entrada (redirecció visible)', AMB_TAULER, { share: resposta({ status: 307 }) }, /pantalla d'entrada amb compte/],
  ['fitxa seguida d’una redirecció', AMB_TAULER, { share: resposta({ redirigida: true, cos: { token: 'x', websiteId: ID_WEB } }) }, /pantalla d'entrada amb compte/],
  ['fitxa 200 amb la pàgina d’entrada en HTML', AMB_TAULER, { share: resposta({ json: HTML }) }, /no com un tauler públic/],
  ['fitxa 200 sense testimoni', AMB_TAULER, { share: resposta({ cos: { websiteId: ID_WEB } }) }, /no com un tauler públic/],
  ['fitxa 200 sense web', AMB_TAULER, { share: resposta({ cos: { token: TESTIMONI } }) }, /no com un tauler públic/],
  ['fitxa 403', AMB_TAULER, { share: resposta({ status: 403 }) }, /codi 403/],
  ['xifres 401 (testimoni caducat o sense context)', AMB_TAULER, { stats: resposta({ status: 401 }) }, /codi 401/],
  ['xifres que no són de stats', AMB_TAULER, { stats: resposta({ cos: { error: 'Unauthorized' } }) }, /no com un tauler públic/],
  ['xifres sense resposta', AMB_TAULER, { stats: new TypeError('Failed to fetch') }, /El comptador no ha contestat/],
  ['fitxa sense resposta (xarxa o CSP)', AMB_TAULER, { share: new TypeError('Failed to fetch') }, /El comptador no ha contestat/]
])('T3.1: %s → estat buit honest, sense xifres ni cap demanda d’entrada', async (_cas, config, canvis, motiu) => {
  const { container } = render(<TaulerTelemetria config={config} fetchTauler={fetchUmami(canvis)} ara={ARA} />);
  expect(await screen.findByText(TAULER_TANCAT)).toBeTruthy();
  expect(container.querySelector('iframe')).toBeNull();
  expect(container.querySelector('.sdp-quadre__xifres')).toBeNull();
  expect(container.querySelector('a[href*="/share/"]')).toBeNull();
  const explicacio = container.querySelector('.sdp-buit__text').textContent;
  expect(explicacio).toMatch(motiu);
  expect(explicacio).toMatch(/mai et demanarem cap compte, cap contrasenya ni cap inici de sessió/);
  expect(explicacio).toMatch(/cloud\.umami\.is/);
  expect(explicacio).not.toMatch(/Log in|Continue with Google|contrasenya:/);
});

test('T3.1: mentre el comptador contesta, «carregant» i cap xifra', async () => {
  let resol;
  const fetchTauler = vi.fn(() => new Promise((r) => { resol = r; }));
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchTauler} ara={ARA} />);
  expect(screen.getByRole('status').textContent).toMatch(/Demanant les xifres al comptador públic/);
  expect(container.querySelector('.sdp-quadre__xifres')).toBeNull();
  expect(container.querySelector('a[href*="/share/"]')).toBeNull();
  await act(async () => { resol(resposta({ status: 404 })); });
  expect(screen.getByText(TAULER_TANCAT)).toBeTruthy();
});

test('T3.1: temps exhaurit → avorta totes les consultes i estat buit', async () => {
  const senyals = [];
  const fetchTauler = vi.fn((adreca, opcions) => {
    senyals.push(opcions.signal);
    return adreca.includes('/api/share/') ? Promise.resolve(UMAMI.share) : new Promise(() => {});
  });
  render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchTauler} tempsLimitTaulerMs={20} ara={ARA} />);
  expect(await screen.findByText(TAULER_TANCAT)).toBeTruthy();
  expect(screen.getByText(/ha tardat massa a contestar/)).toBeTruthy();
  expect(senyals).toHaveLength(5);
  expect(senyals.every((senyal) => senyal.aborted)).toBe(true);
});

test('T3.1: un enllaç que no és /share/<id> no es pregunta', () => {
  const fetchTauler = vi.fn();
  const config = configTelemetria({ VITE_UMAMI_SHARE_URL: 'https://compta.socdepoble.org/websites/Ab12' });
  render(<TaulerTelemetria config={config} fetchTauler={fetchTauler} />);
  expect(screen.getByText(TAULER_TANCAT)).toBeTruthy();
  expect(screen.getByText(/no és el d'un tauler compartit d'Umami/)).toBeTruthy();
  expect(fetchTauler).not.toHaveBeenCalled();
});

test('T3.1: si falta una peça que no és /stats, eixa peça ho diu i la resta es pinta', async () => {
  const canvis = { active: resposta({ status: 500 }), pageviews: new TypeError('x'), metrics: resposta({ cos: { no: 'llista' } }) };
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchUmami(canvis)} ara={ARA} />);
  expect(await esperaXifres()).toBeTruthy();
  expect(container.querySelector('.sdp-quadre__estat').textContent).toBe('En línia ara mateix: el comptador no ho ha dit');
  expect(screen.getByText('El comptador no ha tornat les vistes per hores.')).toBeTruthy();
  expect(screen.getByText('El comptador no ha tornat la llista de seccions.')).toBeTruthy();
  expect(container.querySelector('.sdp-quadre__grafica')).toBeNull();
  expect(screen.getByRole('link', ENLLAC_ORIGINAL)).toBeTruthy();
});

test('T3.1: un dia sense visites no inventa cap percentatge ni cap temps', async () => {
  const canvis = {
    stats: resposta({ cos: { pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 } }),
    active: resposta({ cos: { visitors: 1 } }),
    pageviews: resposta({ cos: { pageviews: [], sessions: [] } }),
    metrics: resposta({ cos: [] })
  };
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchUmami(canvis)} ara={ARA} />);
  expect(await esperaXifres()).toBeTruthy();
  const xifres = xifresPintades(container);
  expect(xifres['Percentatge de rebot']).toBe('—');
  expect(xifres['Temps mitjà de visita']).toBe('—');
  expect(screen.getAllByText('sense cap visita encara')).toHaveLength(2);
  expect(container.querySelector('.sdp-quadre__estat').textContent).toBe('En línia ara mateix: 1 persona');
  expect(screen.getByText('Cap vista en les últimes 24 hores.')).toBeTruthy();
  expect(screen.getByText('Cap secció visitada en les últimes 24 hores.')).toBeTruthy();
});

test('T3.1: on viu el tauler: el camí base de l’enllaç, i la regió /analytics/eu (primer) només per a l’enllaç curt de cloud.umami.is', () => {
  expect(basesDelTauler(ENLLAC_EU)).toEqual({ id: ID_DEL_TAULER, bases: ['https://cloud.umami.is/analytics/eu'] });
  expect(basesDelTauler(ENLLAC_CURT)).toEqual({ id: ID_DEL_TAULER, bases: ['https://cloud.umami.is/analytics/eu', 'https://cloud.umami.is'] });
  expect(basesDelTauler('https://exemple.org/umami/share/Xy_9-z/nom')).toEqual({ id: 'Xy_9-z', bases: ['https://exemple.org/umami'] });
  expect(basesDelTauler('https://exemple.org/share/')).toBeNull();
  expect(basesDelTauler('https://exemple.org/share/a%2F..%2Fb')).toBeNull();
  expect(basesDelTauler('https://exemple.org/')).toBeNull();
  expect(basesDelTauler('javascript:alert(1)//share/x')).toBeNull();
  expect(basesDelTauler('no és una url')).toBeNull();
});

test('T3.1: les hores llegixen el rellotge de la zona (la Z d’Umami no és UTC) i el canvi d’hora d’octubre no duplica cap barra', () => {
  const hores = horesDelTauler({
    pageviews: [{ x: '2026-10-30 03:00:00', y: 7 }, { x: 'brossa', y: 9 }, { x: '2026-10-30T04:00:00Z', y: -1 }],
    sessions: [{ x: '2026-10-30T03:00:00Z', y: 2 }, { x: '2026-10-30T05:00:00Z', y: -4 }]
  }, ARA);
  expect(hores).toHaveLength(24);
  expect(hores[0]).toEqual({ id: '2026-10-30T00', etiqueta: '00:00 h', marca: '00', vistes: 0, visitants: 0 });
  expect(hores[3]).toMatchObject({ etiqueta: '03:00 h', marca: '', vistes: 7, visitants: 2 });
  expect(hores[4].vistes).toBe(0);
  expect(hores[5].visitants).toBe(0);
  expect(hores.reduce((suma, hora) => suma + hora.vistes, 0)).toBe(7);
  // Sense sessions (versions velles d'Umami): visitants és null, mai un zero inventat.
  expect(horesDelTauler({ pageviews: [] }, ARA).every((hora) => hora.visitants === null)).toBe(true);
  // 25-10-2026: a les 03:00 CEST el rellotge torna a les 02:00 CET. Una sola barra «02:00 h».
  const canvi = horesDelTauler({ pageviews: [] }, Date.UTC(2026, 9, 25, 5, 30));
  expect(canvi).toHaveLength(23);
  expect(new Set(canvi.map((hora) => hora.id)).size).toBe(23);
  expect(canvi.filter((hora) => hora.etiqueta === '02:00 h')).toHaveLength(1);
  expect(horesDelTauler({ no: 'res' }, ARA)).toBeNull();
});

test('T3.1: /stats en nombres o en { value } (versions velles); una xifra que falta no es pinta', () => {
  expect(resumDelTauler({ pageviews: { value: 10 }, visitors: { value: 4 }, visits: { value: 5 }, bounces: { value: 9 }, totaltime: { value: 50 } }))
    .toEqual({ visitants: 4, visites: 5, vistes: 10, rebot: 1, tempsMitja: 10 });
  expect(resumDelTauler({ pageviews: 1, visitors: 1, visits: 1, bounces: 0 })).toBeNull();
  expect(resumDelTauler({ pageviews: -1, visitors: 1, visits: 1, bounces: 0, totaltime: 0 })).toBeNull();
  expect(resumDelTauler([])).toBeNull();
});

test('T3.1: amb IntersectionObserver, no pregunta al comptador fins que la peça es veu', async () => {
  let avisa;
  const observa = vi.fn();
  window.IntersectionObserver = vi.fn(function IntersectionObserver(callback) {
    avisa = callback;
    this.observe = observa;
    this.disconnect = vi.fn();
  });
  const fetchTauler = fetchUmami();
  const { container } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchTauler} ara={ARA} />);
  expect(observa).toHaveBeenCalledWith(container.querySelector('.sdp-telemetria'));
  expect(fetchTauler).not.toHaveBeenCalled();
  act(() => { avisa([{ isIntersecting: false }]); });
  expect(fetchTauler).not.toHaveBeenCalled();
  act(() => { avisa([{ isIntersecting: true }]); });
  expect(await esperaXifres()).toBeTruthy();
  expect(fetchTauler).toHaveBeenCalledTimes(5);
});

test('T3.1: desmuntar a mitja consulta l’avorta i no pinta res', async () => {
  let senyal;
  const fetchTauler = vi.fn((_adreca, opcions) => { senyal = opcions.signal; return new Promise(() => {}); });
  const { unmount } = render(<TaulerTelemetria config={AMB_TAULER} fetchTauler={fetchTauler} ara={ARA} />);
  unmount();
  expect(senyal.aborted).toBe(true);
});

test('l’interruptor escriu la tria local i la torna a llegir', () => {
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  const interruptor = screen.getByRole('switch', INTERRUPTOR);
  expect(interruptor.getAttribute('aria-checked')).toBe('true');
  fireEvent.click(interruptor);
  expect(window.localStorage.getItem(CLAU_APAGADA)).toBe('1');
  expect(interruptor.getAttribute('aria-checked')).toBe('false');
  expect(screen.getByText(/Apagada per tu/)).toBeTruthy();
  fireEvent.click(interruptor);
  expect(window.localStorage.getItem(CLAU_APAGADA)).toBeNull();
  expect(interruptor.getAttribute('aria-checked')).toBe('true');
});

test('la tria guardada abans es llig en obrir la pàgina', () => {
  window.localStorage.setItem(CLAU_APAGADA, '1');
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  expect(screen.getByRole('switch', INTERRUPTOR).getAttribute('aria-checked')).toBe('false');
});

test('Do Not Track: ho diu, i l’interruptor queda apagat i sense poder-se tocar', () => {
  posaDNT('1');
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  const interruptor = screen.getByRole('switch', INTERRUPTOR);
  expect(interruptor.getAttribute('aria-checked')).toBe('false');
  expect(interruptor.disabled).toBe(true);
  expect(screen.getByText(/envia el senyal Do Not Track/)).toBeTruthy();
  expect(window.localStorage.getItem(CLAU_APAGADA)).toBeNull();
});

test('la llista reacciona a l’esdeveniment sdp:telemetria i ho diu en paraules', () => {
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  expect(screen.getByText("Encara no s'ha intentat comptar res en esta pestanya.")).toBeTruthy();
  act(() => { registraEsdeveniment('connectar', { seccio: 'mur', origen: 'targeta' }, { cfg: SENSE_COMPTADOR, ruta: '/mur?item_id=Titol' }); });
  expect(screen.getByText('Clic al botó Connectar')).toBeTruthy();
  expect(screen.getByText('/mur')).toBeTruthy();
  expect(screen.getByText('seccio: mur · origen: targeta')).toBeTruthy();
  expect(screen.getByText("No s'ha enviat res: aquest servidor té el comptador desconnectat.")).toBeTruthy();
  expect(screen.queryByText(/Titol/)).toBeNull();
});

/* Ordre del Mestre (30-10-2026, prompt 2208, T3.2) · La quarta peça en paraules
   de plaça: títol, explicació, nom humà de cada ruta i frase de cada motiu. */
test('T3.2: títol humà i explicació introductòria del Mestre', () => {
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  expect(screen.getByRole('heading', { level: 4, name: "Què s'ha apuntat de la teua visita d'hui (en directe)" })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: "Els intents de comptar d'este navegador" })).toBeNull();
  expect(screen.getByText(/Ací baix pots comprovar, en directe, tot el que aquesta pestanya ha anotat mentre camines per Sóc de\s+Poble \(fins als últims 20 passos\)/)).toBeTruthy();
  expect(screen.getByText(/sense guardar mai qui eres, ni el teu correu, ni què has\s+llegit o escrit dins/)).toBeTruthy();
  expect(screen.getByText(/no pot comprovar\s+si el comptador ho ha rebut/)).toBeTruthy();
  expect(screen.queryByText(/Petició iniciada|recepció no comprovada|Delegat/)).toBeNull();
});

test.each([
  ['/legal', 'Visita a: Legal i privacitat'],
  ['/wikidepoble', 'Visita a: Wiki de Poble'],
  ['/disseny', 'Visita a: Disseny'],
  ['/multimedia', 'Visita a: Multimèdia'],
  ['/notes', 'Visita a: Bloc de notes'],
  ['/mur', 'Visita a: El Mur'],
  ['/mercat', 'Visita a: El Mercat'],
  ['/calendari', 'Visita a: Calendari'],
  ['/pobles', 'Visita a: Pobles'],
  ['/notes/una-nota-privada', 'Visita a: Bloc de notes (una pàgina de dins, sense dir quina)'],
  ['/page/publicar_mur', 'Visita a una pàgina informativa (sense dir quina)'],
  // Gauntlet f6 (31-10-2026, T3.1-noms-generics): les rutes de fora de la barra, amb el nom del seu registre.
  ['/consola', 'Visita a: Consola'],
  ['/consola/calendari', 'Visita a: Consola (una pàgina de dins, sense dir quina)'],
  ['/app', 'Visita a: Apps'],
  ['/app/gestoria', 'Visita a una app (sense dir quina)'],
  ['/el-meu-perfil', 'Visita a: El meu perfil'],
  ['/traduccions', 'Visita a: Traduccions i llengua'],
  ['/registre', 'Visita a: Entrar o crear compte'],
  ['/login', 'Visita a: Entrar o crear compte'],
  ['/events/acte-de-prova', 'Visita a: Agenda (una pàgina de dins, sense dir quina)'],
  ['/fediversity', 'Visita a: Candidatura Europea NLnet · NGI Fediversity'],
  ['/descarregues', 'Visita a: Descàrregues i Aplicacions'],
  ['/skills', 'Visita a: Wiki de Poble'],
  ['/lector', 'Visita a una altra part de Sóc de Poble'],
  ['/ruta-que-no-existix', 'Visita a una altra part de Sóc de Poble'],
  ['/ruta-que-no-existix/fitxa', 'Visita a una altra part de Sóc de Poble (sense dir quina)']
])('T3.2: la visita a %s es diu «%s» i conserva l’adreça tècnica', (ruta, nom) => {
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  act(() => { registraVisita(ruta, { cfg: SENSE_COMPTADOR }); });
  expect(screen.getByText(nom)).toBeTruthy();
  const adreca = screen.getByText(ruta.split('/').length > 2 ? `/${ruta.split('/')[1]}/*` : ruta);
  expect(adreca.tagName).toBe('CODE');
  expect(adreca.closest('p').textContent).toMatch(/^Adreça tècnica:/);
});

test.each([
  ['/javillinares'],
  ['/perfil/0a1b2c3d'],
  ['/gent/maria-del-forn'],
  ['/empresa/forn-de-la-placa']
])('T3.2: %s és «una fitxa o perfil» i no diu quin', (ruta) => {
  const { container } = render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  act(() => { registraVisita(ruta, { cfg: SENSE_COMPTADOR }); });
  expect(screen.getByText('Visita a una fitxa o perfil (sense dir quin)')).toBeTruthy();
  const llista = container.querySelector('.sdp-telemetria__llista').textContent;
  expect(llista).not.toMatch(/javillinares|0a1b2c3d|maria-del-forn|forn-de-la-placa/);
});

test('T3.2: «umami» diu visita sumada o clic anotat segons el tipus', () => {
  window.fetch = vi.fn(async () => ({ ok: true }));
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  act(() => { registraVisita('/disseny', { cfg: AMB_COMPTADOR }); });
  act(() => { registraEsdeveniment('connectar', { seccio: 'disseny', origen: 'pagina' }, { cfg: AMB_COMPTADOR, ruta: '/disseny' }); });
  expect(window.fetch).toHaveBeenCalledTimes(2);
  expect(screen.getByText("S'ha sumat 1 visita anònima al comptador públic (sense cap dada personal).")).toBeTruthy();
  expect(screen.getByText("S'ha anotat aquest clic de manera anònima al comptador públic.")).toBeTruthy();
});

test('T3.2: la connexió que falla es diu en paraules de plaça', () => {
  window.fetch = vi.fn(() => { throw new TypeError('sense xarxa'); });
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  act(() => { registraVisita('/mur', { cfg: AMB_COMPTADOR }); });
  expect(screen.getByText("No s'ha enviat res perquè la connexió amb el comptador no ha respost.")).toBeTruthy();
});

test('T3.2: amfitrió que ja compta, amfitrió que delega i amfitrió que falla', () => {
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  window.umami = { track: vi.fn() };
  act(() => { registraVisita('/mercat', { cfg: AMB_COMPTADOR }); });
  act(() => { registraEsdeveniment('connectar', { seccio: 'mercat' }, { cfg: AMB_COMPTADOR, ruta: '/mercat' }); });
  expect(screen.getByText("No s'ha enviat dues voltes: la web que allotja Sóc de Poble ja compta la visita.")).toBeTruthy();
  expect(screen.getByText("S'ha passat l'avís de manera anònima al comptador de la web que allotja Sóc de Poble.")).toBeTruthy();
  window.umami = { track: () => { throw new Error('amfitrió trencat'); } };
  act(() => { registraEsdeveniment('connectar', { seccio: 'mercat' }, { cfg: AMB_COMPTADOR, ruta: '/mercat' }); });
  expect(screen.getByText("No s'ha enviat res perquè la connexió amb el comptador no ha respost.")).toBeTruthy();
});

test('T3.2: amb el comptador apagat, ho diu i no s’envia res', () => {
  window.fetch = vi.fn(async () => ({ ok: true }));
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  fireEvent.click(screen.getByRole('switch', INTERRUPTOR));
  act(() => { registraVisita('/calendari', { cfg: AMB_COMPTADOR }); });
  expect(screen.getByText("No s'ha enviat res: tens el comptador apagat en aquest navegador.")).toBeTruthy();
  expect(window.fetch).not.toHaveBeenCalled();
});

/* Ordre del Mestre (30-10-2026, prompt 2208, T3.3) · jsdom servix la pàgina
   des de localhost: amb el comptador de compilació configurat, l'app (que no
   passa cfg) no envia res i la llista ho diu. */
test('T3.3: des d’un servidor local la llista diu que no s’ha enviat res, i per què', () => {
  vi.stubEnv('VITE_UMAMI_WEBSITE_ID', '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d');
  vi.stubEnv('VITE_UMAMI_HOST', 'https://compta.socdepoble.org');
  window.fetch = vi.fn(async () => ({ ok: true }));
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  act(() => { registraVisita('/mur'); });
  expect(screen.getByText('Visita a: El Mur')).toBeTruthy();
  expect(screen.getByText("No s'ha enviat res: estàs en un servidor local de proves, i les visites d'ací no es sumen al comptador públic.")).toBeTruthy();
  expect(window.fetch).not.toHaveBeenCalled();
});
