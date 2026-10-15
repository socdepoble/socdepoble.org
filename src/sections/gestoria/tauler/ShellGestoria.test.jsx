/* Gestoria · ShellGestoria: la closca de la Gestoria (ordre del Mestre,
   261004; onada 2, pas 1 del MAPA). La pàgina de cada mòdul (el mòdul el tria
   la ruta: la navegació és la BarraApp global, ordre de MarIA 261012_2145),
   la boina personal (identitat de la configuració local, un sol ull amb
   aria-pressed i la data de la lectura), el titular (configurat a la closca o
   l'entrada al compte, petició 261012_2148), la porta de veres del tractor
   'gestoria.tauler' (catàleg real, empremta real, autenticador WebAuthn
   simulat, magatzem en memòria), el Tauler amb les xifres amagades, la pàgina
   pròpia de cada targeta i el Full trimestral, que és ContenidorGestoria tal
   qual. Dades sintètiques: l'entitat 9999 de prova i una empresa i una
   població inventades.
   Ordre del Mestre, 13-10-2026 (pla 261013_1405): la persona de la sessió a la
   boina i el rellotge viu a l'extrem dret de cada pàgina (front B), la Cabina
   d'Avió (front E) i l'Escàner Local dins de la closca (front D). Les proves
   que fixaven el que estes ordres canvien (la boina «sense cap data», la
   pastilla de la lectura com a primera data de la barra, el mòdul de l'Escàner
   «en obres» i la frase del net del 303 i del 130) fixen ara el comportament
   nou, amb el motiu escrit a cadascuna.
   Ordre del Mestre, 14-10-2026 (prompt 261014_2015): el trimestre de la
   capçalera és el trimestre operatiu (punt 1), la Cabina d'Avió es diu «Quadre
   de comandament» (punt 2) i hi acaba amb «Factures que falten» i «Plantilla
   Gestoria» (punt 3), i la barra i el peu porten Comentar, Compartir i
   Connectar inoperatius, que només avisen (punt 5). AVUI, el 04-10-2026, és dins
   de la finestra de presentació del 3T: les proves que fixaven el 4T com a
   trimestre per defecte fixen ara el 3T, i les que deixaven de discriminar
   injecten un altre dia, amb el motiu escrit a cadascuna. */
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { crearMagatzemMemoria } from '../../tractors/nucli/magatzem.js';
import { TRACTORS, empremtaDe } from '../../tractors/registreTractors.js';
import { CONSULTA_TRACTORS } from '../ContenidorGestoria.jsx';
import { TRACTOR_ESCANER, TRACTOR_TAULER, TRACTOR_FACTURES } from '../tractors.js';
import ShellGestoria, {
  MODULS_GESTORIA, RUTA_TITULAR, TITULAR_SENSE_CONFIGURAR, pastillaDeLectura, pastillaDeSincronitzacio, titularDe, titularLocalDe
} from './ShellGestoria.jsx';
import { AVISOS_ACCIONS_PRIVADES } from './TargetaTauler.jsx';
import { ContextTrimestre } from './Tauler.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const subtle = webcrypto.subtle;
const ARA = Date.UTC(2026, 9, 4, 8, 0, 0);
const rellotge = () => ARA;
const AVUI = () => new Date(2026, 9, 4, 10, 0, 0);
/* Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
   Gestoria i Wiki»): la closca viu a la seua app, /app/gestoria/tauler, i ja
   no a un ítem de la Wiki. */
const RUTA = '/app/gestoria/tauler';

/* L'empremta de la versió d'ara de cada tractor: la que el Mestre aprova. */
const INFO = Object.fromEntries(await Promise.all(TRACTORS.map(async (t) => [t.id, await empremtaDe(t, subtle)])));
const autenticador = await creaAutenticadorSimulat({ subtle });

async function ambSignatura(manifest = TRACTOR_TAULER) {
  const magatzem = crearMagatzemMemoria();
  await magatzem.afegixClau(autenticador.clau);
  await magatzem.afegixRegistre(await autenticador.signa({
    manifest, empremta: INFO[manifest.id].empremta, ara: ARA - 60000, nonce: new Uint8Array(16).fill(4)
  }));
  return magatzem;
}

/* ── Fitxers sintètics ───────────────────────────────────────────────── */
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const N43 = [
  `119999000100000043212606012606302${xifres(100000, 14)}9783${text('TITULAR SINTETIC', 26)}${text('', 3)}`,
  `22${text('', 4)}000126061026061099000${'1'}${xifres(2500, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`,
  `3399990001000000432100001${xifres(2500, 14)}00000${xifres(0, 14)}2${xifres(97500, 14)}978${text('', 4)}`,
  `88${'9'.repeat(18)}${xifres(3, 6)}${text('', 54)}`
].join('\r\n');
const CONFIG = JSON.stringify({
  esquema: 'sdp.gestoria.config-empresa.v1', nom: 'Empresa de Prova SL', nomComercial: 'Taller de Prova',
  domicilis: [{ id: 'fiscal', adreca: 'Carrer Inventat 1', codiPostal: '00000', poblacio: 'Poble de Prova' }],
  domiciliFiscal: 'fiscal'
});
const fitxer = (name, contingut) => {
  const bytes = new TextEncoder().encode(contingut);
  return { name, size: bytes.length, arrayBuffer: async () => bytes.slice().buffer };
};

function RutaDeLApp() {
  const { pathname, search } = useLocation();
  return <output aria-label="Ruta">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

/* La ruta de l'amfitrió, que tria el mòdul: la de l'última closca muntada (vesAlModul). */
let rutaDeLAmfitrio = null;

/* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 3): `hrefFull`, la ruta del Full trimestral que dona el
   pont. El doble `descarrega` és un de sol per muntatge (abans, un de nou a cada pintada), perquè la prova de la
   «Plantilla Gestoria» en puga comptar les crides. */
function munta({
  magatzem = crearMagatzemMemoria(), titular, modulActiu, showDirectoryPicker, hrefEntrada, hrefIdentitat, hrefFull,
  rellotge: rellotgeDeLaProva = rellotge, avui = AVUI, descarrega = vi.fn()
} = {}) {
  const entorn = { location: { origin: autenticador.origen, hostname: autenticador.rpId }, ...(showDirectoryPicker ? { showDirectoryPicker } : {}) };
  const arbre = (modul = modulActiu) => (
    <MemoryRouter rutaInicial={RUTA}>
      <ShellGestoria magatzem={magatzem} subtle={subtle} entorn={entorn} rellotge={rellotgeDeLaProva} inflate={null}
        avui={avui} descarrega={descarrega} titular={titular} modulActiu={modul} hrefEntrada={hrefEntrada} hrefIdentitat={hrefIdentitat}
        hrefFull={hrefFull} />
      <RutaDeLApp />
    </MemoryRouter>
  );
  const vista = render(arbre());
  const canviaModul = (modul) => vista.rerender(arbre(modul));
  rutaDeLAmfitrio = canviaModul;
  return { ...vista, closca: vista.container.querySelector('.sdp-gestoria-closca'), canviaModul, descarrega };
}

/* Un dia d'avui injectat (el dia de la closca), a les 10 del matí. */
const diaInjectat = (any, mes, dia) => () => new Date(any, mes - 1, dia, 10, 0, 0);
const titolDelTrimestre = (closca) => closca.querySelector('.sdp-gestoria-context .sdp-cal-navegacio__titol').textContent;
const capcalera = (closca) => within(closca.querySelector('.sdp-gestoria-context'));

const ruta = () => screen.getByLabelText('Ruta').textContent;
const h1 = (closca) => closca.querySelector('header.page-title > h1').textContent;
const boina = (closca) => closca.querySelector('section.bar-orange');
const serialitzat = (node) => new XMLSerializer().serializeToString(node);
/* La persona tria un mòdul a la BarraApp global i l'amfitrió canvia la ruta: a la closca li arriba un altre modulActiu. */
const ID_DEL_MODUL = Object.freeze({
  'Tauler d’Inici': 'tauler', Facturació: 'facturacio', Bancs: 'bancs', Impostos: 'impostos', 'Full trimestral': 'full',
  'Escàner Local': 'escaner'
});
const vesAlModul = (nom) => rutaDeLAmfitrio(ID_DEL_MODUL[nom]);
/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): el rellotge viu, l'últim fill de les accions de la barra. */
const accionsDe = (closca) => boina(closca).querySelector('.bar-actions');
const rellotgeDe = (closca) => accionsDe(closca).lastElementChild;
const ETIQUETA_RELLOTGE = /^Data i hora d’ara: /;
/* El rellotge injectat és ARA: el rellotge de la barra diu eixe minut. */
const esperaRellotge = (closca, instant = ARA) => {
  const viu = rellotgeDe(closca);
  expect(viu.tagName).toBe('TIME');
  expect(viu.classList.contains('btn-date-time')).toBe(true);
  expect(viu.getAttribute('aria-label')).toMatch(ETIQUETA_RELLOTGE);
  expect(viu.getAttribute('datetime')).toBe(pastillaDeSincronitzacio(instant).dateTime);
  expect([...accionsDe(closca).querySelectorAll('[aria-label^="Data i hora d’ara"]')]).toHaveLength(1);
};
const xipDeLectura = (closca) => boina(closca).querySelector('.sdp-gestoria-boina__lectura .btn-date-time');

async function llegixExtractes() {
  // La porta verifica la signatura amb WebCrypto després del muntatge.
  // Espera local de 3 s: inferior al pressupost de 5 s de cada prova.
  // La saturació per builds simultanis s’ha de classificar separadament.
  const input = await screen.findByLabelText('Tria els extractes del banc', {}, { timeout: 3000 });
  await act(async () => {
    fireEvent.change(input, { target: { files: [fitxer('extracte.n43', N43), fitxer('empresa.json', CONFIG)] } });
  });
  // Oblida també es veu durant la primera lectura: el selector habilitat
  // marca que ja ha acabat, i el botó comprova que hi ha dades guardades.
  await waitFor(() => expect(screen.getByLabelText('Tria els extractes del banc').disabled).toBe(false));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Oblida les dades' })).toBeTruthy());
}

describe('la navegació i els mòduls', () => {
  /* Ordre de MarIA 261012_2145, acatada pel Mestre: la closca no dibuixa cap barra ni menú; la navegació és la BarraApp global. */
  test('la closca no porta cap navegació pròpia: ni barra lateral, ni menú, ni el seu plegat', async () => {
    const { closca } = munta();
    expect(within(closca).queryByRole('navigation')).toBeNull();
    expect(closca.querySelectorAll('[class*="closca__rail"], [class*="closca__modul"], [class*="closca__plega"]')).toHaveLength(0);
    expect(closca.textContent).not.toMatch(/Panell de control|Menú de la Gestoria/i);
    await screen.findByText('Cal aprovar el tractor');
  });

  test('cada mòdul, la seua pàgina: el títol, el subtítol i, si encara no existix, «en obres»', async () => {
    const { closca, canviaModul } = munta();
    expect(h1(closca)).toBe('Tauler Central');
    await screen.findByText('Cal aprovar el tractor');
    for (const m of MODULS_GESTORIA) {
      canviaModul(m.id);
      expect(h1(closca), m.id).toBe(m.titol);
      expect(within(closca).getAllByRole('heading', { level: 2, name: m.subtitol }).length, m.id).toBeGreaterThan(0);
      expect([...closca.querySelectorAll('.page-title-labels > li')].map((li) => li.textContent), m.id)
        .toEqual(m.enObres ? ['GESTORIA', 'PANELL INTERN', 'En obres'] : ['GESTORIA', 'PANELL INTERN']);
    }
    /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D): l'Escàner Local ja existix i deixa d'estar en obres. */
    expect(MODULS_GESTORIA.filter((m) => m.enObres).map((m) => m.id)).toEqual(['facturacio', 'contactes', 'burocracia', 'informes']);
  });

  test('un mòdul en obres ho diu, amb el perquè, a la seua pàgina amb la barra taronja', async () => {
    const { closca } = munta();
    vesAlModul('Facturació');
    expect(h1(closca)).toBe('Facturació');
    expect(screen.getByText('En obres', { selector: 'p' })).toBeTruthy();
    expect(closca.querySelector('.sdp-buit__text').textContent).toMatch(/Veri\*Factu/);
    expect(boina(closca)).not.toBeNull();
    expect([...closca.querySelectorAll('.page-title-labels > li')].map((li) => li.textContent)).toEqual(['GESTORIA', 'PANELL INTERN', 'En obres']);
  });

  test('el Full trimestral és ContenidorGestoria tal qual: la seua porta i els seus passos', async () => {
    const { closca } = munta();
    vesAlModul('Full trimestral');
    expect(h1(closca)).toBe('Full trimestral');
    const primer = await screen.findByRole('heading', { level: 2, name: '1. Aprovació dels tractors' });
    expect(within(primer.closest('section')).getByText('Cal aprovar el tractor de factures')).toBeTruthy();
    expect(within(primer.closest('section')).getAllByText('Pendent')).toHaveLength(2);
  });
});

describe('la boina personal', () => {
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): «SEMPRE la data i l'hora vives» a l'extrem dret.
     Abans, sense lectura la barra no portava cap data; ara no porta cap data de LECTURA, però sí el rellotge. */
  test('sense configuració: «Titular sense configurar», enllaçada a la pàgina del titular, un sol ull, cap data de lectura i el rellotge viu', async () => {
    const { closca } = munta();
    const barra = boina(closca);
    const autor = barra.firstElementChild;
    expect(autor.getAttribute('href')).toBe(RUTA_TITULAR);
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe(TITULAR_SENSE_CONFIGURAR);
    const ulls = barra.querySelectorAll('.sdp-gestoria-ull');
    expect(ulls).toHaveLength(1);
    expect(ulls[0].getAttribute('aria-pressed')).toBe('false');
    expect(xipDeLectura(closca)).toBeNull();
    expect(within(barra).queryByLabelText(/^Dades llegides/)).toBeNull();
    expect(barra.querySelectorAll('.btn-date-time')).toHaveLength(1);
    esperaRellotge(closca);
    await screen.findByText('Cal aprovar el tractor');
  });

  test('titularDe i la pastilla de la sincronització', () => {
    expect(titularDe(null)).toEqual({ nom: TITULAR_SENSE_CONFIGURAR, poble: '', avatar: null, href: RUTA_TITULAR, configurat: false });
    expect(titularDe({ nom: ' Taller de Prova ', poble: 'Poble de Prova' })).toMatchObject({ nom: 'Taller de Prova', configurat: true });
    expect(pastillaDeSincronitzacio(null)).toBeNull();
    const d = new Date(ARA);
    const dos = (n) => String(n).padStart(2, '0');
    expect(pastillaDeSincronitzacio(ARA)).toEqual({
      time: `${dos(d.getHours())}:${dos(d.getMinutes())}`,
      date: `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/26`,
      dateTime: `2026-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`
    });
  });

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): el xip de la lectura no repetix el dia d'avui. */
  test('pastillaDeLectura: l’hora sempre; el dia, només si la lectura no és d’avui; el nom accessible i el dateTime, sencers', () => {
    const p = pastillaDeSincronitzacio(ARA);
    const d = new Date(ARA);
    const avui = { a: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
    const etiqueta = `Dades llegides a les ${p.time} del ${p.date}`;
    expect(pastillaDeLectura(null, avui)).toBeNull();
    expect(pastillaDeLectura(ARA, avui)).toEqual({ ...p, date: '', etiqueta });
    expect(pastillaDeLectura(ARA, { ...avui, d: avui.d + 1 })).toEqual({ ...p, etiqueta });
    expect(pastillaDeLectura(ARA, null)).toEqual({ ...p, etiqueta });
  });
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B; prompt, tasca 2): amb sessió, la boina és la persona de
   la sessió, que el pont passa com a `titular` ({ nom, avatar, poble } de useSessioApp().titular). Deixa sense
   efecte, amb sessió, la petició 261012_2148: cap «Configura el titular» ni «Titular sense configurar». */
describe('la persona de la sessió', () => {
  const PERSONA = Object.freeze({ nom: 'Pepa Soler', poble: 'Poble Inventat', avatar: '/assets/avatar-prova.webp' });

  test('la boina diu el nom, el poble i l’avatar de la sessió, enllaçada al perfil; cap porta del titular; l’entradeta la saluda', async () => {
    const { closca } = munta({ titular: PERSONA });
    await screen.findByText('Cal aprovar el tractor');
    const autor = boina(closca).firstElementChild;
    expect(autor.getAttribute('href')).toBe(RUTA_TITULAR);
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Pepa Soler');
    expect(autor.querySelector('.sp-card-author-location').textContent).toBe('Poble Inventat');
    expect(autor.querySelector('img.sp-card-avatar').getAttribute('src')).toMatch(/\/assets\/avatar-prova\.webp$/);
    expect(closca.querySelector('.page-intro .lead').textContent).toMatch(/^Hola, Pepa Soler!/);
    expect(closca.textContent).not.toMatch(new RegExp(TITULAR_SENSE_CONFIGURAR));
    expect(screen.queryByText('Qui porta esta gestoria?')).toBeNull();
    expect(screen.queryByText('Titular d’esta pàgina')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Configura el titular' })).toBeNull();
    /* El nom de la persona no és cap títol: l'Índex no el pot escriure a l'adreça. */
    expect([...closca.querySelectorAll('h1, h2, h3')].map((h) => h.textContent).join(' ')).not.toMatch(/Pepa|Soler|Inventat/);
  });

  test('la sessió mana sobre el fitxer de l’empresa, també a la pàgina d’una targeta i després d’«Oblida les dades»', async () => {
    const { closca } = munta({ magatzem: await ambSignatura(), titular: PERSONA });
    await llegixExtractes();
    const nom = () => boina(closca).querySelector('.sp-card-author-name').textContent;
    expect(nom()).toBe('Pepa Soler');
    expect(closca.textContent).not.toMatch(/Taller de Prova/);
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    expect(h1(closca)).toBe('Caixa real');
    expect(nom()).toBe('Pepa Soler');
    fireEvent.click(screen.getByRole('button', { name: 'Tornar arrere' }));
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    expect(nom()).toBe('Pepa Soler');
    expect(screen.queryByText('Qui porta esta gestoria?')).toBeNull();
    expect(ruta()).toBe(RUTA);
  });
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): «A la part dreta de la barra taronja, SEMPRE la data i
   l'hora vives, sense ometre-les mai». El rellotge injectat congela l'hora a ARA. */
describe('el rellotge viu de la barra', () => {
  test('a cada mòdul, a la pàgina d’una targeta i després d’«Oblida les dades», el rellotge és l’últim fill de les accions; el xip de la lectura, a la seua esquerra', async () => {
    const { closca, canviaModul } = munta({ magatzem: await ambSignatura() });
    for (const m of MODULS_GESTORIA) {
      canviaModul(m.id);
      esperaRellotge(closca);
    }
    canviaModul('tauler');
    await llegixExtractes();
    const p = pastillaDeSincronitzacio(ARA);
    const xip = within(boina(closca)).getByLabelText(`Dades llegides a les ${p.time} del ${p.date}`);
    expect(xip).toBe(xipDeLectura(closca));
    expect(xip.getAttribute('datetime')).toBe(p.dateTime);
    /* La lectura és d'avui: el xip només diu l'hora, i el dia el diu el rellotge. */
    expect(xip.textContent).toBe(p.time);
    expect(xip.compareDocumentPosition(rellotgeDe(closca)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    esperaRellotge(closca);
    for (const m of MODULS_GESTORIA) {
      canviaModul(m.id);
      esperaRellotge(closca);
      expect(xipDeLectura(closca), m.id).not.toBeNull();
    }
    canviaModul('tauler');
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    expect(h1(closca)).toBe('Caixa real');
    esperaRellotge(closca);
    expect(xipDeLectura(closca)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tornar arrere' }));
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    expect(xipDeLectura(closca)).toBeNull();
    esperaRellotge(closca);
  }, 20000);

  /* El dia de la closca seguix el rellotge: a mitjanit, sense esperar que la pestanya torne a primer pla.
     Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 1): el trimestre per defecte és l'operatiu, i l'1 de
     gener és dins de la finestra del 4T: la nit de Cap d'Any ja no canvia de trimestre (continua el 4T 2026). La
     prova passa a la mitjanit en què la finestra del 4T es tanca, del 30 al 31 de gener de 2027, perquè el
     trimestre canvie de veres i continue passant al de l'any nou. */
  test('a mitjanit, el rellotge i el dia de la closca canvien: el trimestre de la capçalera passa al de l’any nou', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      let ara = new Date(2027, 0, 30, 23, 59, 30).getTime();
      const { closca } = munta({ modulActiu: 'impostos', rellotge: () => ara, avui: null });
      const titol = () => titolDelTrimestre(closca);
      expect(titol()).toBe('4T 2026');
      /* L'últim dia de la presentació del 4T, el compte enrere diu que acaba hui. */
      expect(capcalera(closca).getByText('Ara és el termini de presentació del 303 i del 130, que acaba hui, el 30/01/2027.')).toBeTruthy();
      esperaRellotge(closca, ara);
      ara += 31000;
      act(() => { vi.advanceTimersByTime(31000); });
      expect(titol()).toBe('1T 2027');
      esperaRellotge(closca, ara);
    } finally {
      vi.useRealTimers();
    }
  });
});

/* Petició del Mestre via MarIA (261012_2148): dues portes que es diuen pel seu nom i no es barregen. */
describe('el titular', () => {
  const ENTRADA = '/registre?mode=entrar&tornar=%2Fapp%2Fgestoria%2Ftauler';
  const portes = () => screen.getByText('Qui porta esta gestoria?').closest('.sdp-alerta');

  test('titularLocalDe: el nom és obligatori; els espais es netegen; la població és opcional', () => {
    expect(titularLocalDe({ nom: '  Javi   Llinares ', poble: ' Penàguila ' })).toEqual({ nom: 'Javi Llinares', poble: 'Penàguila' });
    expect(titularLocalDe({ nom: 'Javi Llinares' })).toEqual({ nom: 'Javi Llinares', poble: '' });
    expect(titularLocalDe({ nom: '   ', poble: 'Penàguila' })).toBeNull();
    expect(titularLocalDe({ nom: null })).toBeNull();
    expect(titularLocalDe()).toBeNull();
  });

  test('sense identitat ni sessió: el Tauler oferix les dues portes; el nom de la boina i «Entra al compte» porten a l’entrada, que torna al Tauler', async () => {
    const { closca } = munta({ hrefEntrada: ENTRADA });
    await screen.findByText('Cal aprovar el tractor');
    expect(boina(closca).firstElementChild.getAttribute('href')).toBe(ENTRADA);
    expect(within(portes()).getByRole('button', { name: 'Configura el titular' })).toBeTruthy();
    fireEvent.click(within(portes()).getByRole('button', { name: 'Entra al compte' }));
    expect(ruta()).toBe(ENTRADA);
  });

  test('sense amfitrió (cap entrada): només la porta local, i la boina va al perfil', async () => {
    const { closca } = munta();
    await screen.findByText('Cal aprovar el tractor');
    expect(within(portes()).queryByRole('button', { name: 'Entra al compte' })).toBeNull();
    expect(boina(closca).firstElementChild.getAttribute('href')).toBe(RUTA_TITULAR);
  });

  test('Configura el titular: el diàleg només existix obert; desar posa el nom a la boina i el focus a l’H1; mana sobre el fitxer de l’empresa; Oblida l’esborra', async () => {
    const { closca } = munta({ magatzem: await ambSignatura(), hrefEntrada: ENTRADA });
    await screen.findByLabelText('Tria els extractes del banc', {}, { timeout: 3000 });
    /* Tancat, el seu encapçalament no és al DOM: l'Índex no el pot recollir. */
    expect(screen.queryByRole('heading', { name: 'Configura el titular' })).toBeNull();
    fireEvent.click(within(portes()).getByRole('button', { name: 'Configura el titular' }));
    const dialeg = screen.getByRole('dialog', { name: 'Configura el titular' });
    expect(within(dialeg).getByText(/no és cap compte/)).toBeTruthy();
    fireEvent.change(within(dialeg).getByLabelText(/^Nom/), { target: { value: 'Javi Llinares' } });
    fireEvent.change(within(dialeg).getByLabelText(/^Població/), { target: { value: 'Penàguila' } });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Desa' }));
    expect(screen.queryByRole('dialog', { name: 'Configura el titular' })).toBeNull();
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe('Javi Llinares');
    expect(boina(closca).querySelector('.sp-card-author-location').textContent).toBe('Penàguila');
    expect(closca.querySelector('.page-intro .lead').textContent).toMatch(/^Hola, Javi Llinares!/);
    expect(screen.queryByText('Qui porta esta gestoria?')).toBeNull();
    expect(document.activeElement).toBe(closca.querySelector('header.page-title > h1'));
    expect(ruta()).toBe(RUTA);
    /* El fitxer de l'empresa (Taller de Prova) arriba després: el titular que s'ha dit ací continua manant. */
    await llegixExtractes();
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe('Javi Llinares');
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe(TITULAR_SENSE_CONFIGURAR);
    expect(portes()).toBeTruthy();
  });

  /* GES-06 (auditoria de Codex, 261012_2022) · Sense extractes ni tractor
     aprovat no hi ha «Oblida les dades»: el titular escrit ací es pot canviar i
     oblidar igualment, i el focus no es perd. */
  test('sense cap lectura, el titular desat es pot canviar i oblidar, i el focus va a l’H1', async () => {
    const { closca } = munta({ hrefEntrada: ENTRADA });
    await screen.findByText('Cal aprovar el tractor');
    const h1 = closca.querySelector('header.page-title > h1');
    const desa = (nom, poble = '') => {
      const dialeg = screen.getByRole('dialog', { name: 'Configura el titular' });
      fireEvent.change(within(dialeg).getByLabelText(/^Nom/), { target: { value: nom } });
      fireEvent.change(within(dialeg).getByLabelText(/^Població/), { target: { value: poble } });
      fireEvent.click(within(dialeg).getByRole('button', { name: 'Desa' }));
    };
    expect(screen.queryByText('Titular d’esta pàgina')).toBeNull();
    fireEvent.click(within(portes()).getByRole('button', { name: 'Configura el titular' }));
    desa('Javi Llinares', 'Penàguila');
    expect(screen.queryByRole('button', { name: 'Oblida les dades' })).toBeNull();
    const local = () => screen.getByText('Titular d’esta pàgina').closest('.sdp-alerta');
    expect(within(local()).getByText(/no és cap compte/)).toBeTruthy();
    /* Canviar: el diàleg s'obri amb el que ja hi havia. */
    fireEvent.click(within(local()).getByRole('button', { name: 'Canvia el titular' }));
    const dialeg = screen.getByRole('dialog', { name: 'Configura el titular' });
    expect(within(dialeg).getByLabelText(/^Nom/).value).toBe('Javi Llinares');
    expect(within(dialeg).getByLabelText(/^Població/).value).toBe('Penàguila');
    desa('Javier Llinares');
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe('Javier Llinares');
    expect(boina(closca).querySelector('.sp-card-author-location')?.textContent ?? '').toBe('');
    expect(document.activeElement).toBe(h1);
    /* Oblidar: tornen les portes i la boina sense configurar; el focus, a l'H1. */
    fireEvent.click(within(local()).getByRole('button', { name: 'Oblida el titular' }));
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe(TITULAR_SENSE_CONFIGURAR);
    expect(screen.queryByText('Titular d’esta pàgina')).toBeNull();
    expect(portes()).toBeTruthy();
    expect(closca.querySelector('.page-intro .lead').textContent).not.toMatch(/Hola/);
    expect(document.activeElement).toBe(h1);
    expect(ruta()).toBe(RUTA);
  });

  test('Cancel·la tanca el diàleg sense canviar res', async () => {
    const { closca } = munta();
    await screen.findByText('Cal aprovar el tractor');
    fireEvent.click(within(portes()).getByRole('button', { name: 'Configura el titular' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Configura el titular' })).getByRole('button', { name: 'Cancel·la' }));
    expect(screen.queryByRole('dialog', { name: 'Configura el titular' })).toBeNull();
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe(TITULAR_SENSE_CONFIGURAR);
  });
});

describe('la porta del tractor del Tauler', () => {
  /* La closca demana la porta amb la consulta relativa (CONSULTA_TRACTORS,
     sense tocar-la); dins de l'app, AppGestoria la porta a la Wiki, on viu
     (src/apps/gestoria/AppGestoria.test.jsx). */
  test('sense la signatura del Mestre: «Cal aprovar el tractor», cap selector i el camí al panell de Tractors', async () => {
    const { closca } = munta();
    const avis = (await screen.findByText('Cal aprovar el tractor')).closest('.sdp-alerta');
    expect(avis.textContent).toMatch(/Gestoria · Tauler de l’empresa/);
    expect(screen.queryByLabelText('Tria els extractes del banc')).toBeNull();
    /* Les targetes hi són igual, sense cap xifra: tota targeta té pàgina i tota pàgina, targeta. */
    expect([...closca.querySelectorAll('.sp-card-title')].map((e) => e.textContent)).toEqual([
      'Caixa real', 'Hisenda', 'Cobertura', 'Factures i vendes', 'Ingressos', 'Despeses', 'Rendiment'
    ]);
    expect(closca.querySelectorAll('.sp-card .sdp-gestoria-ull')).toHaveLength(0);
    fireEvent.click(within(avis).getByRole('button', { name: 'Obri el panell de Tractors' }));
    expect(ruta()).toBe(`${RUTA}${CONSULTA_TRACTORS}`);
  });

  test('una signatura d’un altre tractor no obri el Tauler', async () => {
    munta({ magatzem: await ambSignatura(TRACTORS.find((t) => t.id === 'gestoria.factures').manifest) });
    await screen.findByText('Cal aprovar el tractor');
    expect(screen.queryByLabelText('Tria els extractes del banc')).toBeNull();
  });
});

describe('el Tauler, amb la signatura', () => {
  test('la ruta (modulActiu) controla el mòdul: conserva lectura i privacitat, però tanca el detall anterior i enfoca l’H1', async () => {
    const { closca, canviaModul } = munta({ magatzem: await ambSignatura(), modulActiu: 'tauler' });
    await llegixExtractes();
    expect(within(closca).queryByRole('navigation')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    expect(h1(closca)).toBe('Caixa real');
    fireEvent.click(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }));

    canviaModul('bancs');
    expect(h1(closca)).toBe('Bancs i Tresoreria');
    expect(document.activeElement).toBe(closca.querySelector('header.page-title > h1'));
    expect(screen.queryByRole('region', { name: 'El detall de Caixa real' })).toBeNull();
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe('Taller de Prova');
    expect(screen.getByRole('button', { name: 'Oblida les dades' })).toBeTruthy();
    expect(serialitzat(closca)).toMatch(/975,00/);

    canviaModul('impostos');
    expect(h1(closca)).toBe('Impostos');
    canviaModul('tauler');
    expect(h1(closca)).toBe('Tauler Central');
    expect(screen.queryByRole('region', { name: 'El detall de Caixa real' })).toBeNull();
    expect(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }).getAttribute('aria-pressed')).toBe('true');
    expect(closca.querySelectorAll('h1')).toHaveLength(1);
    expect(closca.querySelectorAll('section.bar-orange')).toHaveLength(1);
  });

  test('llig els extractes i la configuració: la boina diu qui ets i quan s’han llegit; les xifres, amagades', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    const barra = boina(closca);
    expect(barra.querySelector('.sp-card-author-name').textContent).toBe('Taller de Prova');
    expect(barra.querySelector('.sp-card-author-location').textContent).toBe('Poble de Prova');
    const pastilla = pastillaDeSincronitzacio(ARA);
    /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): la barra porta dues pastilles (el xip de la lectura
       i el rellotge viu); la de la lectura es busca pel seu nom accessible, no per ser la primera. */
    expect(within(barra).getByLabelText(`Dades llegides a les ${pastilla.time} del ${pastilla.date}`).getAttribute('datetime')).toBe(pastilla.dateTime);
    expect(closca.querySelector('.page-intro .lead').textContent).toMatch(/^Hola, Taller de Prova!/);
    /* Cap xifra al DOM fins a prémer l'ull. */
    expect(serialitzat(closca)).not.toMatch(/975,00|1\.000,00/);
    const caixa = screen.getByRole('button', { name: 'Caixa real' }).closest('article');
    expect(caixa.querySelector('.sp-card-calendar-badge').textContent).toBe('Import amagat');
    const ull = within(barra).getByRole('button', { name: 'Mostra les xifres' });
    fireEvent.click(ull);
    expect(ull.getAttribute('aria-pressed')).toBe('true');
    const mostrada = screen.getByRole('button', { name: 'Caixa real' }).closest('article');
    expect(mostrada.querySelector('.sp-card-calendar-badge').textContent).toBe('975,00 €');
    fireEvent.click(ull);
    expect(serialitzat(closca)).not.toMatch(/975,00/);
    expect(ruta()).toBe(RUTA);
  });

  test('tota targeta obri la seua pàgina pròpia dins de la closca (PaginaApp, barra taronja), i Tornar torna', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    expect(h1(closca)).toBe('Caixa real');
    expect(document.activeElement).toBe(closca.querySelector('header.page-title > h1'));
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe('Taller de Prova');
    const detall = screen.getByRole('region', { name: 'El detall de Caixa real' });
    expect(within(detall).getByText('Compte 1')).toBeTruthy();
    expect(serialitzat(closca)).not.toMatch(/975,00/);
    fireEvent.click(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }));
    expect(closca.querySelector('.sdp-gestoria-tauler__xifra').textContent).toBe('975,00 €');
    /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 5): la barra de la pàgina d'una targeta porta també
       Comentar, Compartir i Connectar, inoperatius (el que diuen en prémer-los, a «les accions privades»). */
    expect([...closca.querySelectorAll('header.bar-blue button')].map((b) => b.getAttribute('aria-label')))
      .toEqual(['Tornar arrere', 'Índex de secció', 'Traduir', 'Comentar', 'Compartir', 'Connectar']);
    fireEvent.click(screen.getByRole('button', { name: 'Tornar arrere' }));
    expect(h1(closca)).toBe('Tauler Central');
    expect(ruta()).toBe(RUTA);
  });

  test('Bancs i Tresoreria: una targeta per compte i la de la conciliació', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    vesAlModul('Bancs');
    expect(h1(closca)).toBe('Bancs i Tresoreria');
    expect([...closca.querySelectorAll('.sp-card-title')].map((e) => e.textContent)).toEqual(['Compte 1', 'Conciliació']);
    /* Qui és el compte es llig dins de la targeta, en un paràgraf: mai al títol. */
    const compte = screen.getByRole('button', { name: 'Compte 1' }).closest('article');
    expect(compte.querySelector('.sp-card-text').textContent).toMatch(/De l’entitat 9999, acabat en 4321\./);
    expect(compte.querySelector('.sp-card-subtitle').textContent).toBe('Saldo bancari · extracte del banc');
    expect(screen.getByText('Sense factures')).toBeTruthy();
  });

  test('Impostos: el 303 i el 130 del trimestre, «estimació incompleta» sense factures, amb el termini', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await screen.findByLabelText('Tria els extractes del banc');
    vesAlModul('Impostos');
    expect(h1(closca)).toBe('Impostos');
    const targetes = [...closca.querySelectorAll('article.sp-card')];
    expect(targetes.map((t) => t.querySelector('.sp-card-title').textContent)).toEqual(['IVA · model 303', 'IRPF · model 130']);
    for (const t of targetes) {
      const etiquetes = [...t.querySelectorAll('.sp-card-label')].map((e) => e.textContent);
      /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 1): el 04-10-2026 el trimestre és el 3T, que es
         presenta fins al 20/10/2026 (abans, el 4T, fins al 30/01/2027). */
      expect(etiquetes).toEqual(['Impostos', 'Estimació incompleta', 'Termini 20/10/2026']);
      expect(t.querySelector('.sdp-gestoria-ull')).toBeNull();
    }
  });

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): se'n va la data de la lectura, però el rellotge viu
     es queda («sense ometre-les mai»). */
  test('Oblida les dades ho buida tot: la boina torna a «Titular sense configurar» i sense data de lectura; el rellotge es queda', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe(TITULAR_SENSE_CONFIGURAR);
    expect(xipDeLectura(closca)).toBeNull();
    expect(within(boina(closca)).queryByLabelText(/^Dades llegides/)).toBeNull();
    expect(boina(closca).querySelectorAll('.btn-date-time')).toHaveLength(1);
    esperaRellotge(closca);
  });

  /* Ordre del Mestre, 261004: «Oblida les dades» torna a amagar les xifres. */
  test('Oblida les dades torna a tancar l’ull de la boina: la lectura següent arriba amb les xifres amagades', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    const ull = () => within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' });
    fireEvent.click(ull());
    expect(ull().getAttribute('aria-pressed')).toBe('true');
    expect(serialitzat(closca)).toMatch(/975,00/);
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    expect(ull().getAttribute('aria-pressed')).toBe('false');
    await llegixExtractes();
    expect(ull().getAttribute('aria-pressed')).toBe('false');
    expect(serialitzat(closca)).not.toMatch(/975,00/);
    const caixa = screen.getByRole('button', { name: 'Caixa real' }).closest('article');
    expect(caixa.querySelector('.sp-card-calendar-badge').textContent).toBe('Import amagat');
  });

  test('l’ull obert d’una targeta tampoc passa a la lectura següent', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    const badge = () => screen.getByRole('button', { name: 'Caixa real' }).closest('article').querySelector('.sp-card-calendar-badge').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Mostra la xifra de Caixa real' }));
    expect(badge()).toBe('975,00 €');
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    await llegixExtractes();
    expect(badge()).toBe('Import amagat');
    expect(serialitzat(closca)).not.toMatch(/975,00/);
  });
});

/* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 5): la barra blava de les pàgines de la closca i de la
   pàgina de cada targeta porta Comentar, Compartir i Connectar com a accions inoperatives (aria-disabled), i el peu
   de cada targeta, Comentar i Compartir. En prémer-les, la closca diu per què en una Alerta
   (AVISOS_ACCIONS_PRIVADES); cap no navega ni comparteix, i la lectura dels extractes es conserva. navigator.share i
   el porta-retalls són dobles: si algun s'hi cridara, la prova ho veuria. */
describe('les accions privades de la barra i del peu', () => {
  let share;
  let writeText;
  beforeEach(() => {
    share = vi.fn(async () => {});
    writeText = vi.fn(async () => {});
    Object.defineProperty(window.navigator, 'share', { value: share, configurable: true, writable: true });
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true, writable: true });
  });
  afterEach(() => {
    delete window.navigator.share;
    delete window.navigator.clipboard;
  });
  const barra = (closca) => [...closca.querySelectorAll('header.bar-blue button')]
    .map((b) => [b.getAttribute('aria-label'), b.getAttribute('aria-disabled')]);
  const botoDeLaBarra = (closca, nom) => [...closca.querySelectorAll('header.bar-blue button')].find((b) => b.getAttribute('aria-label') === nom);
  const alertaAmb = (text) => screen.getByText(text).closest('.sdp-alerta');
  const textosPrivats = () => Object.values(AVISOS_ACCIONS_PRIVADES).filter((text) => screen.queryByText(text));
  /* La lectura es conserva: el xip de la lectura i la boina de l'empresa i, a la pàgina del mòdul (on viu la porta),
     «Oblida les dades». */
  const lecturaViva = (closca, { delModul = true } = {}) => {
    expect(xipDeLectura(closca)).not.toBeNull();
    expect(boina(closca).querySelector('.sp-card-author-name').textContent).toBe('Taller de Prova');
    if (delModul) expect(screen.getByRole('button', { name: 'Oblida les dades' })).toBeTruthy();
  };

  test('al mòdul Tauler: les tres accions, inoperatives; Compartir avisa i no navega ni comparteix; el peu d’una targeta també avisa', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    expect(barra(closca)).toEqual([
      ['Índex de secció', null], ['Traduir', null], ['Comentar', 'true'], ['Compartir', 'true'], ['Connectar', 'true']
    ]);
    expect(textosPrivats()).toEqual([]);
    fireEvent.click(botoDeLaBarra(closca, 'Compartir'));
    const avis = alertaAmb(AVISOS_ACCIONS_PRIVADES.compartir);
    expect(closca.contains(avis)).toBe(true);
    expect(avis.classList.contains('sdp-alerta--info')).toBe(true);
    expect(textosPrivats()).toEqual([AVISOS_ACCIONS_PRIVADES.compartir]);
    expect(h1(closca)).toBe('Tauler Central');
    expect(ruta()).toBe(RUTA);
    expect(share).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
    lecturaViva(closca);
    /* Connectar i Comentar de la barra diuen el seu perquè, i l'avís nou substituïx l'anterior. */
    fireEvent.click(botoDeLaBarra(closca, 'Connectar'));
    expect(textosPrivats()).toEqual([AVISOS_ACCIONS_PRIVADES.connectar]);
    fireEvent.click(botoDeLaBarra(closca, 'Comentar'));
    expect(textosPrivats()).toEqual([AVISOS_ACCIONS_PRIVADES.comentar]);
    expect(document.querySelector('[role="menu"]')).toBeNull();
    fireEvent.click(within(alertaAmb(AVISOS_ACCIONS_PRIVADES.comentar)).getByRole('button', { name: 'Tancar l\'avís' }));
    expect(textosPrivats()).toEqual([]);
    /* El peu de la targeta: Compartir i Comentar només avisen; la targeta no s'obri. */
    fireEvent.click(screen.getByRole('button', { name: 'Compartir Caixa real' }));
    expect(textosPrivats()).toEqual([AVISOS_ACCIONS_PRIVADES.compartir]);
    fireEvent.click(screen.getByRole('button', { name: 'Comentar Caixa real' }));
    expect(textosPrivats()).toEqual([AVISOS_ACCIONS_PRIVADES.comentar]);
    expect(h1(closca)).toBe('Tauler Central');
    expect(ruta()).toBe(RUTA);
    expect(share).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
    lecturaViva(closca);
  });

  test('a la pàgina d’una targeta: l’avís es pinta dins de la pàgina, no navega, i Tornar el buida', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    expect(h1(closca)).toBe('Caixa real');
    expect(barra(closca)).toEqual([
      ['Tornar arrere', null], ['Índex de secció', null], ['Traduir', null], ['Comentar', 'true'], ['Compartir', 'true'], ['Connectar', 'true']
    ]);
    fireEvent.click(botoDeLaBarra(closca, 'Compartir'));
    const avis = alertaAmb(AVISOS_ACCIONS_PRIVADES.compartir);
    /* Dins de la pàgina de la targeta: abans del detall, al mateix contenidor que «La xifra». */
    const pagina = closca.querySelector('.sdp-gestoria-closca__pagina');
    expect(pagina.contains(avis)).toBe(true);
    expect(avis.compareDocumentPosition(screen.getByRole('heading', { level: 2, name: 'La xifra' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(h1(closca)).toBe('Caixa real');
    expect(ruta()).toBe(RUTA);
    expect(share).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
    lecturaViva(closca, { delModul: false });
    fireEvent.click(botoDeLaBarra(closca, 'Connectar'));
    expect(textosPrivats()).toEqual([AVISOS_ACCIONS_PRIVADES.connectar]);
    expect(h1(closca)).toBe('Caixa real');
    fireEvent.click(screen.getByRole('button', { name: 'Tornar arrere' }));
    expect(h1(closca)).toBe('Tauler Central');
    expect(textosPrivats()).toEqual([]);
    expect(ruta()).toBe(RUTA);
    lecturaViva(closca);
  });
});

/* Panell ERP, ordre del Mestre, 261012: la capçalera de context (el trimestre
   que tria la persona, el rellotge del termini i Hisenda sobre la caixa) i
   el commutador «Targetes | Vista comprimida». */
describe('el panell ERP', () => {
  const titolTrimestre = (closca) => closca.querySelector('.sdp-gestoria-context .sdp-cal-navegacio__titol').textContent;
  const subtitols = (closca) => [...closca.querySelectorAll('.sp-card-subtitle')].map((e) => e.textContent);

  /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 1): el 04-10-2026 el trimestre per defecte és el 3T, el
     que té oberta la presentació (abans, el 4T natural), i «Hui» hi torna. La prova recorre els mateixos passos:
     el trimestre anterior (amb el seu termini), el pas d'any i «Hui». */
  test('el trimestre de la capçalera mana sobre les estimacions, sense escriure res a la URL', async () => {
    const { closca } = munta();
    await screen.findByText('Cal aprovar el tractor');
    vesAlModul('Impostos');
    expect(titolTrimestre(closca)).toBe('3T 2026');
    expect(subtitols(closca)).toEqual(['Estimació del 3T 2026', 'Estimació del 3T 2026']);
    const terminiDeLIva = () => [...screen.getByRole('button', { name: 'IVA · model 303' }).closest('article').querySelectorAll('.sp-card-label')]
      .map((e) => e.textContent);
    expect(terminiDeLIva()).toContain('Termini 20/10/2026');
    fireEvent.click(screen.getByRole('button', { name: 'Trimestre anterior' }));
    expect(titolTrimestre(closca)).toBe('2T 2026');
    expect(subtitols(closca)).toEqual(['Estimació del 2T 2026', 'Estimació del 2T 2026']);
    expect(terminiDeLIva()).toContain('Termini 20/07/2026');
    fireEvent.click(screen.getByRole('button', { name: 'Trimestre següent' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trimestre següent' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trimestre següent' }));
    expect(titolTrimestre(closca)).toBe('1T 2027');
    fireEvent.click(screen.getByRole('button', { name: 'Hui' }));
    expect(titolTrimestre(closca)).toBe('3T 2026');
    expect(ruta()).toBe(RUTA);
    /* El títol del trimestre és un paràgraf: l'Índex no el recull. */
    expect(closca.querySelector('.sdp-gestoria-context h1, .sdp-gestoria-context h2, .sdp-gestoria-context h3')).toBeNull();
  });

  /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 1): el 04-10-2026 la capçalera mira el 3T, que és en la
     seua presentació (dia 4 de 20, amb el compte enrere), i ja no diu «Ara és oberta la presentació del 3T»:
     n'és el trimestre. Eixe avís continua quan la persona tria el 4T, que és el que abans es veia per defecte. */
  test('el rellotge del termini es veu amb l’ull tancat: és una data, no cap xifra', async () => {
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    const rellotge = screen.getByRole('progressbar', { name: 'Presentació del 3T 2026: dia 4 de 20' });
    expect(rellotge.getAttribute('value')).toBe('4');
    expect(rellotge.getAttribute('max')).toBe('20');
    expect(capcalera(closca).getByText('Ara és el termini de presentació del 303 i del 130, que acaba el 20/10/2026: queden 16 dies.')).toBeTruthy();
    expect(closca.querySelector('.sdp-gestoria-context__obert')).toBeNull();
    /* Sense factures, Hisenda sobre la caixa no té de què partir, i ho diu. */
    expect(capcalera(closca).getByText(/^Sense estimació de Hisenda/)).toBeTruthy();
    expect(serialitzat(closca)).not.toMatch(/975,00/);
    /* El 4 d'octubre, si la persona mira el 4T, la presentació del 3T corre: es diu. */
    fireEvent.click(screen.getByRole('button', { name: 'Trimestre següent' }));
    const delQuart = screen.getByRole('progressbar', { name: 'El 4T 2026: dia 4 de 92' });
    expect(delQuart.getAttribute('value')).toBe('4');
    expect(delQuart.getAttribute('max')).toBe('92');
    expect(capcalera(closca).getByText(/va del 01\/01\/2027 al 30\/01\/2027/)).toBeTruthy();
    expect(closca.querySelector('.sdp-gestoria-context__obert').textContent).toBe('Ara és oberta la presentació del 3T 2026: acaba el 20/10/2026.');
    expect(serialitzat(closca)).not.toMatch(/975,00/);
  });

  /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 1): el dia de l'ordre, el 14 d'octubre, el trimestre
     és el 3T (el que vença el 20), no el 4T que acaba de començar; i ho diu sense cap dada a la URL. */
  test('el 14-10-2026, el trimestre operatiu és el 3T: dia 14 de 20 de la presentació, queden 6 dies', async () => {
    const { closca } = munta({ avui: diaInjectat(2026, 10, 14) });
    await screen.findByText('Cal aprovar el tractor');
    expect(titolDelTrimestre(closca)).toBe('3T 2026');
    const rellotge = screen.getByRole('progressbar', { name: 'Presentació del 3T 2026: dia 14 de 20' });
    expect(rellotge.getAttribute('value')).toBe('14');
    expect(rellotge.getAttribute('max')).toBe('20');
    expect(capcalera(closca).getByText(/^Ara és el termini de presentació del 303 i del 130/).textContent).toMatch(/queden 6 dies\.$/);
    expect(closca.querySelector('.sdp-gestoria-context__obert')).toBeNull();
    vesAlModul('Impostos');
    expect(titolDelTrimestre(closca)).toBe('3T 2026');
    expect(subtitols(closca)).toEqual(['Estimació del 3T 2026', 'Estimació del 3T 2026']);
    expect(ruta()).toBe(RUTA);
  });

  /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 1): «Hui» porta al trimestre operatiu, des de qualsevol
     altre. Dins de la finestra (el 14-10) és el 3T i no el 4T natural; fora (el 25-10, vençut el 3T) és el 4T i no
     l'anterior: «Hui» no és ni «el trimestre d'avui» ni «sempre l'anterior». */
  test('«Hui» porta al trimestre operatiu des d’un altre trimestre, dins i fora de la finestra de presentació', async () => {
    const hui = () => fireEvent.click(screen.getByRole('button', { name: 'Hui' }));
    const segueix = () => fireEvent.click(screen.getByRole('button', { name: 'Trimestre següent' }));
    const anterior = () => fireEvent.click(screen.getByRole('button', { name: 'Trimestre anterior' }));

    const dins = munta({ avui: diaInjectat(2026, 10, 14) });
    await screen.findByText('Cal aprovar el tractor');
    segueix();
    expect(titolDelTrimestre(dins.closca)).toBe('4T 2026');
    expect(screen.getByRole('progressbar', { name: 'El 4T 2026: dia 14 de 92' })).toBeTruthy();
    expect(dins.closca.querySelector('.sdp-gestoria-context__obert').textContent).toBe('Ara és oberta la presentació del 3T 2026: acaba el 20/10/2026.');
    hui();
    expect(titolDelTrimestre(dins.closca)).toBe('3T 2026');
    expect(dins.closca.querySelector('.sdp-gestoria-context__obert')).toBeNull();
    anterior();
    anterior();
    expect(titolDelTrimestre(dins.closca)).toBe('1T 2026');
    hui();
    expect(titolDelTrimestre(dins.closca)).toBe('3T 2026');
    expect(ruta()).toBe(RUTA);
    cleanup();

    const fora = munta({ avui: diaInjectat(2026, 10, 25) });
    await screen.findByText('Cal aprovar el tractor');
    expect(titolDelTrimestre(fora.closca)).toBe('4T 2026');
    anterior();
    expect(titolDelTrimestre(fora.closca)).toBe('3T 2026');
    expect(capcalera(fora.closca).getByText('El termini de presentació del 3T 2026 va acabar el 20/10/2026.')).toBeTruthy();
    hui();
    expect(titolDelTrimestre(fora.closca)).toBe('4T 2026');
    expect(screen.getByRole('progressbar', { name: 'El 4T 2026: dia 25 de 92' })).toBeTruthy();
    expect(ruta()).toBe(RUTA);
  });

  /* Revisió adversarial (261012): amb l'ull tancat, la capçalera no pot dir el signe de la caixa ni el de l'estimació. */
  test('Hisenda sobre la caixa: amb l’ull tancat, una caixa en descobert i una de positiva diuen el mateix', () => {
    const rellotge = { fase: 'trimestre', valor: 4, max: 92, etiqueta: 'El 4T 2026: dia 4 de 92', text: 'Text del rellotge.', obert: null };
    const dades = (liquidacio) => ({ iva: { any: 2026, t: 4 }, rellotge, liquidacio });
    const periode = { onAnterior: vi.fn(), onHui: vi.fn(), onSeguent: vi.fn() };
    const text = (liquidacio, visible) => {
      const { container, unmount } = render(
        <ContextTrimestre dades={dades(liquidacio)} visible={visible} vista="targetes" onCanviaVista={vi.fn()} periode={periode} />
      );
      const resultat = container.querySelector('.sdp-gestoria-context__barres').textContent;
      unmount();
      return resultat;
    };
    const amagats = [
      { estat: 'descobert', completa: true }, { estat: 'res', completa: false }, { estat: 'xifra', percentatge: 25, supera: false, completa: true }
    ].map((l) => text(l, false));
    expect(new Set(amagats).size).toBe(1);
    expect(amagats[0]).toMatch(/Xifra amagada/);
    expect(amagats[0]).not.toMatch(/descobert|surten? a pagar|incompleta|25/);
    expect(text({ estat: 'descobert', completa: true }, true)).toMatch(/zero o en descobert/);
    /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, fronts I i E; Codex GES-A5): el total de Hisenda ja no és el
       net del 303 i del 130 (acord del 261012, Codex GES-04), sinó la part a pagar de cada model: «res» vol dir que
       cap dels dos en surt. */
    expect(text({ estat: 'res', completa: false }, true)).toMatch(/Ni el 303 ni el 130 d’este trimestre surten a pagar.*Estimació incompleta/);
    expect(text({ estat: 'xifra', percentatge: 25, supera: false, completa: true }, true)).toMatch(/25%/);
  });

  test('la vista comprimida: una Taula densa per bloc, xifres amagades fins a l’ull de la boina, i cada fila obri la seua pàgina', async () => {
    const { closca, container } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    const commutador = within(screen.getByRole('group', { name: 'Vista del panell' }));
    expect(commutador.getByRole('button', { name: 'Targetes' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(commutador.getByRole('button', { name: 'Vista comprimida' }));
    expect(closca.querySelectorAll('article.sp-card')).toHaveLength(0);
    expect(closca.querySelectorAll('.sp-card .sdp-gestoria-ull, .sdp-gestoria-tauler__graella')).toHaveLength(0);
    const realitat = screen.getByRole('region', { name: 'La teua realitat' });
    expect(within(realitat).getAllByRole('rowheader').map((th) => th.querySelector('button').textContent))
      .toEqual(['Caixa real', 'Hisenda', 'Cobertura']);
    const caixa = within(realitat).getByRole('button', { name: 'Caixa real' }).closest('tr');
    expect(caixa.querySelector('td').textContent).toBe('Import amagat');
    expect(serialitzat(closca)).not.toMatch(/975,00/);
    fireEvent.click(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }));
    expect(within(realitat).getByRole('button', { name: 'Caixa real' }).closest('tr').querySelector('td').textContent).toBe('975,00 €');
    fireEvent.click(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }));
    expect(serialitzat(closca)).not.toMatch(/975,00/);
    /* Tota fila té la seua pàgina, i en tornar la vista es conserva. */
    fireEvent.click(within(realitat).getByRole('button', { name: 'Caixa real' }));
    expect(h1(closca)).toBe('Caixa real');
    expect(document.activeElement).toBe(closca.querySelector('header.page-title > h1'));
    fireEvent.click(screen.getByRole('button', { name: 'Tornar arrere' }));
    expect(screen.getByRole('region', { name: 'La teua realitat' })).toBeTruthy();
    /* El commutador val també per als Bancs, que no tenen trimestre. */
    vesAlModul('Bancs');
    expect(screen.queryByRole('button', { name: 'Trimestre anterior' })).toBeNull();
    const bancs = screen.getByRole('region', { name: 'Estat de comptes reals i conciliació' });
    expect(within(bancs).getAllByRole('rowheader').map((th) => th.querySelector('button').textContent)).toEqual(['Compte 1', 'Conciliació']);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(closca.querySelectorAll('[style]')).toHaveLength(0);
    expect(ruta()).toBe(RUTA);
  });
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front E; prompt, tasca 5): la Cabina d'Avió, la tercera vista del
   Tauler. Derogat EN PART el commutador de dues vistes del 261012: el del Tauler en té tres; els Bancs i els
   Impostos es queden amb dues i, amb la Cabina triada, hi veuen la comprimida.
   Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 2): la Cabina d'Avió es diu «Quadre de comandament», al
   commutador i a l'H2 de la vista; el valor intern continua sent 'cabina'. */
const QUADRE = 'Quadre de comandament';
describe('el Quadre de comandament (abans, la Cabina d’Avió)', () => {
  const commutador = () => within(screen.getByRole('group', { name: 'Vista del panell' }));
  const opcions = () => commutador().getAllByRole('button').map((b) => b.textContent);
  const premuda = () => commutador().getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent);

  test('tres vistes al Tauler; amb l’ull tancat, cap xifra ni cap gràfic, però les dates sí; l’ull les mostra; cada instrument obri la seua targeta', async () => {
    const { closca, container } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    expect(opcions()).toEqual(['Targetes', QUADRE, 'Vista comprimida']);
    expect(premuda()).toEqual(['Targetes']);
    fireEvent.click(commutador().getByRole('button', { name: QUADRE }));
    expect(premuda()).toEqual([QUADRE]);
    expect(screen.queryByRole('button', { name: 'Cabina d’Avió' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Cabina d’Avió' })).toBeNull();
    expect(closca.querySelectorAll('article.sp-card')).toHaveLength(0);
    expect(closca.querySelectorAll('.sdp-histograma')).toHaveLength(0);
    expect(screen.getByText('Gràfics amagats')).toBeTruthy();
    expect(serialitzat(closca)).not.toMatch(/975,00|25,00/);
    /* Les dates no són xifres: la de l'últim extracte i els venciments es veuen amb l'ull tancat. */
    expect(closca.textContent).toMatch(/30\/06\/2026/);
    expect(closca.textContent).toMatch(/20\/10\/2026/);
    fireEvent.click(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }));
    expect(screen.getAllByText('975,00 €').length).toBeGreaterThan(0);
    expect(closca.querySelectorAll('figure.sdp-histograma')).toHaveLength(2);
    fireEvent.click(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }));
    expect(serialitzat(closca)).not.toMatch(/975,00/);
    /* L'instrument obri la pàgina de la seua targeta, i Tornar torna al Quadre. */
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    expect(h1(closca)).toBe('Caixa real');
    expect(document.activeElement).toBe(closca.querySelector('header.page-title > h1'));
    fireEvent.click(screen.getByRole('button', { name: 'Tornar arrere' }));
    expect(screen.getByRole('heading', { level: 2, name: QUADRE })).toBeTruthy();
    expect(premuda()).toEqual([QUADRE]);
    /* Els Bancs no tenen Quadre: hi veuen la comprimida, i la tria es conserva per al Tauler. */
    vesAlModul('Bancs');
    expect(opcions()).toEqual(['Targetes', 'Vista comprimida']);
    expect(premuda()).toEqual(['Vista comprimida']);
    const bancs = screen.getByRole('region', { name: 'Estat de comptes reals i conciliació' });
    expect(within(bancs).getAllByRole('rowheader').map((th) => th.querySelector('button').textContent)).toEqual(['Compte 1', 'Conciliació']);
    vesAlModul('Impostos');
    expect(opcions()).toEqual(['Targetes', 'Vista comprimida']);
    expect(premuda()).toEqual(['Vista comprimida']);
    vesAlModul('Tauler d’Inici');
    expect(premuda()).toEqual([QUADRE]);
    expect(screen.getByRole('heading', { level: 2, name: QUADRE })).toBeTruthy();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(closca.querySelectorAll('[style]')).toHaveLength(0);
    expect(ruta()).toBe(RUTA);
  }, 20000);

  /* L'Índex escriu a l'adreça el títol de la secció que es tria: en el Quadre, amb les xifres a la vista, cap
     entrada ni cap ruta porta un import, l'entitat, el compte ni el titular. Ordre del Mestre, 14-10-2026 (prompt
     261014_2015, punts 2 i 3): el Quadre es diu així i les seues dues seccions noves també hi són. */
  test('l’Índex del Quadre de comandament no escriu cap dada a la URL', async () => {
    const scrollAbans = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollIntoView() {};
    try {
      const { closca } = munta({ magatzem: await ambSignatura() });
      await llegixExtractes();
      fireEvent.click(commutador().getByRole('button', { name: QUADRE }));
      fireEvent.click(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }));
      const obriIndex = () => fireEvent.click(within(closca).getByRole('button', { name: 'Índex de secció' }));
      const entrades = () => [...document.querySelectorAll('.toc-nav button')];
      obriIndex();
      const textos = entrades().map((e) => e.textContent);
      expect(textos).toContain(QUADRE);
      expect(textos).toContain('Factures que falten');
      expect(textos).toContain('Plantilla Gestoria');
      const rutes = [];
      for (let k = 0; k < textos.length; k += 1) {
        if (k > 0) obriIndex();
        fireEvent.click(entrades()[k]);
        rutes.push(ruta());
      }
      expect(rutes.some((r) => /[?&]seccio=/.test(r))).toBe(true);
      for (const text of [...textos, ...rutes]) expect(text).not.toMatch(/975|25,00|9999|4321|taller|prova|titular/i);
    } finally {
      Element.prototype.scrollIntoView = scrollAbans;
    }
  }, 20000);

  /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punts 3 i 4): el Quadre acaba amb «Factures que falten» (la
     penúltima) i «Plantilla Gestoria» (l'última). Sense Full, la primera diu on es fa i la segona, l'estat buit;
     amb la ruta del Full que dona el pont (hrefFull), l'estat buit hi porta. */
  test('les dues últimes seccions: «Factures que falten» i «Plantilla Gestoria»; sense Full, els estats buits, i «Obri el Full trimestral» hi porta', async () => {
    const { closca } = munta({ hrefFull: '/app/gestoria/full' });
    await screen.findByText('Cal aprovar el tractor');
    fireEvent.click(commutador().getByRole('button', { name: QUADRE }));
    const quadre = screen.getByRole('heading', { level: 2, name: QUADRE }).closest('section');
    const seccions = [...quadre.querySelectorAll('h3')].map((h) => h.textContent);
    expect(seccions.slice(-2)).toEqual(['Factures que falten', 'Plantilla Gestoria']);
    const seccio = (nom) => within(quadre).getByRole('heading', { level: 3, name: nom }).closest('section');
    expect(within(seccio('Factures que falten')).getByText(/^Analitza el trimestre al Full trimestral/)).toBeTruthy();
    const plantilla = within(seccio('Plantilla Gestoria'));
    expect(plantilla.getByText('Encara no hi ha cap full generat')).toBeTruthy();
    expect(plantilla.queryByRole('button', { name: 'Descarrega l’XLSX' })).toBeNull();
    expect(ruta()).toBe(RUTA);
    fireEvent.click(plantilla.getByRole('button', { name: 'Obri el Full trimestral' }));
    expect(ruta()).toBe('/app/gestoria/full');
    expect(closca.querySelectorAll('[style]')).toHaveLength(0);
  });

  test('sense la ruta del Full (hrefFull), l’estat buit de la «Plantilla Gestoria» no porta cap botó', async () => {
    munta();
    await screen.findByText('Cal aprovar el tractor');
    fireEvent.click(commutador().getByRole('button', { name: QUADRE }));
    const plantilla = within(screen.getByRole('heading', { level: 3, name: 'Plantilla Gestoria' }).closest('section'));
    expect(plantilla.getByText('Encara no hi ha cap full generat')).toBeTruthy();
    expect(plantilla.queryByRole('button', { name: 'Obri el Full trimestral' })).toBeNull();
  });
});

describe('Pedra Seca i privacitat', () => {
  test('cap style= ni al codi de la closca ni al DOM; cap dada a la URL', async () => {
    /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, fronts E i D): la Cabina d'Avió i el panell de l'Escàner
       també són de la closca. Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 3): i la «Plantilla
       Gestoria» del Quadre de comandament. */
    for (const fitxerJsx of ['ShellGestoria.jsx', 'Tauler.jsx', 'CabinaAvio.jsx', '../escaner/PanellEscaner.jsx', '../PlantillaGestoria.jsx']) {
      const codi = readFileSync(path.join(process.cwd(), 'src/sections/gestoria/tauler', fitxerJsx), 'utf8');
      expect(codi, fitxerJsx).not.toMatch(/\sstyle=/);
    }
    const { closca } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    vesAlModul('Bancs');
    vesAlModul('Impostos');
    expect(closca.querySelectorAll('[style]')).toHaveLength(0);
    expect(ruta()).toBe(RUTA);
  });

  /* Ordre del Mestre, 261004 (regla d'or 2): la closca és UNA pàgina. La Wiki
     la munta sense embolcall (WikiDePobleSection.einesLocals.test.jsx). */
  test('la closca és una sola pàgina: un H1, una barra blava i una barra taronja, també a la pàgina d’una targeta', async () => {
    const { container } = munta({ magatzem: await ambSignatura() });
    await llegixExtractes();
    const una = () => {
      expect(container.querySelectorAll('h1')).toHaveLength(1);
      expect(container.querySelectorAll('header.bar-blue')).toHaveLength(1);
      expect(container.querySelectorAll('section.bar-orange')).toHaveLength(1);
    };
    una();
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    una();
  });

  /* Ordre del Mestre, 261004 (privacitat): l'Índex escriu a la URL el títol de
     la secció que es tria (?seccio=, el slug del text). Amb les xifres a la
     vista: cap entrada de l'Índex de les pàgines amb dades porta dígits del
     compte, l'entitat, un import ni el titular; i a Bancs i a la pàgina del
     compte es clica cada entrada i es mira la URL que en resulta. */
  test('l’Índex de la closca no escriu cap dada a la URL: el compte és «Compte 1»', async () => {
    const scrollAbans = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollIntoView() {};
    try {
      const { closca } = munta({ magatzem: await ambSignatura() });
      await llegixExtractes();
      fireEvent.click(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }));
      const obriIndex = () => fireEvent.click(within(closca).getByRole('button', { name: 'Índex de secció' }));
      const entrades = () => [...document.querySelectorAll('.toc-nav button')];
      const textos = [];
      const rutes = [];
      /* Les entrades de l'Índex de la pàgina; amb `clica`, cada una clicada i la URL que deixa. */
      const recorre = ({ clica }) => {
        obriIndex();
        const llista = entrades().map((e) => e.textContent);
        expect(llista.length).toBeGreaterThan(0);
        textos.push(...llista);
        if (!clica) {
          fireEvent.click(screen.getByRole('button', { name: 'Tancar taula' }));
          return;
        }
        for (let k = 0; k < llista.length; k += 1) {
          if (k > 0) obriIndex();
          fireEvent.click(entrades()[k]);
          rutes.push(ruta());
        }
      };
      vesAlModul('Tauler d’Inici');
      recorre({ clica: false });
      vesAlModul('Impostos');
      recorre({ clica: false });
      vesAlModul('Bancs');
      recorre({ clica: true });
      fireEvent.click(screen.getByRole('button', { name: 'Compte 1' }));
      expect(h1(closca)).toBe('Compte 1');
      recorre({ clica: true });
      expect(textos).toContain('Compte 1');
      expect(rutes.some((r) => /[?&]seccio=compte-1$/.test(r))).toBe(true);
      for (const text of [...textos, ...rutes]) expect(text).not.toMatch(/4321|9999|975|1\.000|taller|prova|titular/i);
    } finally {
      Element.prototype.scrollIntoView = scrollAbans;
    }
  }, 20000);
});

async function ambSignatures(manifests) {
  const magatzem = crearMagatzemMemoria();
  await magatzem.afegixClau(autenticador.clau);
  for (const [k, manifest] of manifests.entries()) {
    await magatzem.afegixRegistre(await autenticador.signa({
      manifest, empremta: INFO[manifest.id].empremta, ara: ARA - 60000, nonce: new Uint8Array(16).fill(5 + k)
    }));
  }
  return magatzem;
}

const CSV_PROVEIDOR = [
  'Número de factura,7777777777', 'Fecha de la factura,31 jul 2026', 'Importe de la factura,"12,10 €"',
  'Descripción,Importe', 'Servei,"10,00"', 'Subtotal,"10,00"', 'I.V.A. (21%),"2,10"', 'Total,"12,10"'
].join('\n');

/* Una carpeta de facturació en memòria (el contracte de File System Access, només lectura) amb el 3T de 2026. */
function carpetaDelFull() {
  const bytes = new TextEncoder().encode(CSV_PROVEIDOR);
  const csv = { kind: 'file', name: '7777777777.csv', getFile: async () => ({ size: bytes.length, lastModified: 0, arrayBuffer: async () => bytes.slice().buffer }) };
  const noTrobat = () => new DOMException('No hi és.', 'NotFoundError');
  const trimestre = {
    kind: 'directory', name: '2026_3T',
    async *entries() { yield [csv.name, csv]; },
    async getDirectoryHandle() { throw noTrobat(); },
    async getFileHandle(n) { if (n !== csv.name) throw noTrobat(); return csv; }
  };
  const arrel = {
    kind: 'directory', name: 'Facturacio',
    async *entries() { yield ['2026_3T', trimestre]; },
    async getDirectoryHandle(n) { if (n !== '2026_3T') throw noTrobat(); return trimestre; },
    async getFileHandle() { throw noTrobat(); }
  };
  return vi.fn(async () => arrel);
}

/* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 1): el 04-10-2026 el trimestre per defecte ja és el 3T,
   el mateix que analitza el Full, i la prova ja no podria distingir el Full del defecte (ni que «Oblida les dades»
   el desfà). Ara el dia de la closca és el 25-10-2026, amb la presentació del 3T vençuda: el defecte és el 4T, i el
   Full continua analitzant el 3T (el trimestre anterior, PanellGestoria). El rellotge de les signatures continua
   sent ARA. */
const DESPRES_DE_LA_FINESTRA = diaInjectat(2026, 10, 25);

describe('el cable del Full trimestral cap al Tauler (ordre del Mestre, 261012)', () => {
  test('analitzar el 3T al Full fa que Impostos parle del 3T; Oblida les dades ho desfà', async () => {
    const { closca } = munta({
      magatzem: await ambSignatures([TRACTOR_TAULER, TRACTOR_FACTURES]), showDirectoryPicker: carpetaDelFull(), avui: DESPRES_DE_LA_FINESTRA
    });
    await llegixExtractes();
    const subtitols = () => [...closca.querySelectorAll('.sp-card-subtitle')].map((e) => e.textContent);
    vesAlModul('Impostos');
    expect(subtitols()).toEqual(['Estimació del 4T 2026', 'Estimació del 4T 2026']);
    /* Panell ERP (261012): la persona tria el 2T a la capçalera, i mana… */
    fireEvent.click(screen.getByRole('button', { name: 'Trimestre anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trimestre anterior' }));
    expect(subtitols()).toEqual(['Estimació del 2T 2026', 'Estimació del 2T 2026']);
    vesAlModul('Full trimestral');
    fireEvent.click(await screen.findByRole('button', { name: 'Tria la carpeta de factures' }, { timeout: 3000 }));
    await screen.findByText('«Facturacio»');
    fireEvent.click(screen.getByRole('button', { name: 'Analitza el 3T de 2026' }));
    await screen.findByRole('region', { name: 'Despeses de la proposta' }, { timeout: 10000 });
    /* …fins que analitza un trimestre nou al Full: l'acte més recent és eixe, i el selector el seguix. */
    vesAlModul('Impostos');
    expect(subtitols()).toEqual(['Estimació del 3T 2026', 'Estimació del 3T 2026']);
    const irpf = screen.getByRole('button', { name: 'IRPF · model 130' }).closest('article');
    expect([...irpf.querySelectorAll('.sp-card-label')].map((e) => e.textContent)).toContain('Termini 20/10/2026');
    /* El rellotge del termini seguix el trimestre del Full: el 3T, vist el 25 d'octubre, ja ha vençut (abans, vist el
       4 d'octubre, era dins de la seua finestra; ara ho fixa «el 14-10-2026, el trimestre operatiu és el 3T»). */
    const context = within(closca.querySelector('.sdp-gestoria-context'));
    expect(context.getByText('El termini de presentació del 3T 2026 va acabar el 20/10/2026.')).toBeTruthy();
    expect(context.queryByRole('progressbar', { name: /T 2026/ })).toBeNull();
    /* Amb factures i caixa, Hisenda sobre la caixa és una xifra: amb l'ull tancat no diu ni si hi ha res a pagar. */
    expect(context.getByText('Xifra amagada')).toBeTruthy();
    expect(context.queryByText(/surten? a pagar/)).toBeNull();
    fireEvent.click(within(boina(closca)).getByRole('button', { name: 'Mostra les xifres' }));
    /* Cap dels dos models surt a pagar, i incomplet (sense tipus d'operació ni pagaments anteriors): ho diu. Abans
       deia el net del 303 i del 130 (Codex, GES-04, 261012); per l'ordre del Mestre del 13-10-2026 (pla
       261013_1405, fronts I i E; Codex GES-A5), cada model es paga pel seu compte. */
    expect(context.getByText(/^Ni el 303 ni el 130 d’este trimestre surten a pagar/)).toBeTruthy();
    expect(context.getByText(/^Estimació incompleta\./)).toBeTruthy();
    vesAlModul('Tauler d’Inici');
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    vesAlModul('Impostos');
    expect(subtitols()).toEqual(['Estimació del 4T 2026', 'Estimació del 4T 2026']);
  }, 30000);

  /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 3): de punta a punta, el full que genera el Full
     trimestral (segona aprovació) arriba pel cable a la «Plantilla Gestoria» del Quadre de comandament, que no en
     genera cap: hi mostra el nom canònic, amb l'ull tancat cap cel·la ni cap import, i en descarrega els bytes.
     El titular del full és el sintètic de la resta de proves. */
  test('el full generat al Full trimestral arriba a la «Plantilla Gestoria» del Quadre: el nom, cap import amb l’ull tancat i la descàrrega', async () => {
    const { closca, descarrega } = munta({
      magatzem: await ambSignatures([TRACTOR_TAULER, TRACTOR_FACTURES]), showDirectoryPicker: carpetaDelFull()
    });
    await llegixExtractes();
    vesAlModul('Full trimestral');
    fireEvent.click(await screen.findByRole('button', { name: 'Tria la carpeta de factures' }, { timeout: 3000 }));
    await screen.findByText('«Facturacio»');
    fireEvent.click(screen.getByRole('button', { name: 'Analitza el 3T de 2026' }));
    await screen.findByRole('region', { name: 'Despeses de la proposta' }, { timeout: 10000 });
    fireEvent.change(screen.getByRole('textbox', { name: /^Titular del full/ }), { target: { value: 'Taller de Prova' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /He revisat la proposta/ }));
    /* La factura sintètica no té cap incidència d'alta severitat: n'hi ha prou amb la revisió. */
    expect(screen.queryByRole('checkbox', { name: /Genera-la igualment/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Genera el full' }));
    const fitxers = (await screen.findByRole('heading', { level: 3, name: 'Fitxers generats' }, { timeout: 10000 })).closest('section');
    const nomGenerat = [...fitxers.querySelectorAll('code')].map((c) => c.textContent).find((nom) => nom.endsWith('.xlsx'));
    expect(nomGenerat).toBe('2026-FACTURACIO-Taller_de_Prova_-_3T.xlsx');
    expect(descarrega).not.toHaveBeenCalled();

    vesAlModul('Tauler d’Inici');
    fireEvent.click(within(screen.getByRole('group', { name: 'Vista del panell' })).getByRole('button', { name: QUADRE }));
    const plantilla = screen.getByRole('heading', { level: 3, name: 'Plantilla Gestoria' }).closest('section');
    expect(within(plantilla).getByText(nomGenerat).tagName).toBe('CODE');
    expect(within(plantilla).getByText('El full generat del 3T de 2026: és el que es descarrega i s’adjunta.')).toBeTruthy();
    expect(within(plantilla).getByText('Full amagat')).toBeTruthy();
    expect(plantilla.querySelector('table')).toBeNull();
    expect(serialitzat(plantilla)).not.toMatch(/€|\d,\d{2}|7777777777/);
    /* «Factures que falten» ja parla del Full: el seu trimestre, no el que mira la capçalera. */
    const falten = screen.getByRole('heading', { level: 3, name: 'Factures que falten' }).closest('section');
    expect(within(falten).getByText(/^Del Full del 3T 2026, amb els extractes que has triat\./)).toBeTruthy();
    fireEvent.click(within(plantilla).getByRole('button', { name: 'Descarrega l’XLSX' }));
    expect(descarrega).toHaveBeenCalledTimes(1);
    const [{ nom, dades }] = descarrega.mock.calls[0];
    expect(nom).toBe(nomGenerat);
    expect(nom).toMatch(/_-_3T\.xlsx$/);
    expect(dades.length).toBeGreaterThan(0);
    expect(closca.querySelectorAll('[style]')).toHaveLength(0);
    expect(ruta()).toBe(RUTA);
  }, 30000);
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D; prompt, tasca 4): l'Escàner Local viu DINS de la
   closca (derogat EN PART el precedent «pel pont i no per la closca» dels 261007 i 261009), amb el seu tractor
   propi, i aboca els extractes al Tauler pel tractor del Tauler. Carpeta sintètica: noms inventats. */
describe('l’Escàner Local', () => {
  const ARREL = 'Gestoria_Prova';
  /* Un fitxer de l'<input webkitdirectory>: la carpeta triada és el primer segment de webkitRelativePath. */
  const fitxerDeCarpeta = (ruta, contingut) => {
    const bytes = new TextEncoder().encode(contingut);
    return { name: ruta.split('/').pop(), size: bytes.length, lastModified: 0, webkitRelativePath: `${ARREL}/${ruta}`, arrayBuffer: async () => bytes.slice().buffer };
  };
  const carpeta = () => [
    fitxerDeCarpeta('02_Facturacio/2026_Bancs/moviments_compte.n43', N43),
    fitxerDeCarpeta('01_Identitat_Legal/Persona/document_escanejat.pdf', 'PDF-PROVA-IDENTITAT')
  ];
  const radiografia = () => screen.queryByRole('heading', { level: 2, name: 'Radiografia de la carpeta' });

  test('el mòdul és el panell de l’Escàner, no «en obres»; sense la signatura, «Cal aprovar el tractor» i cap selector', async () => {
    const { closca } = munta({ modulActiu: 'escaner' });
    expect(h1(closca)).toBe('Escàner Local');
    expect([...closca.querySelectorAll('.page-title-labels > li')].map((li) => li.textContent)).toEqual(['GESTORIA', 'PANELL INTERN']);
    expect(screen.queryByText('En obres', { selector: 'p' })).toBeNull();
    const avis = (await screen.findByText('Cal aprovar el tractor', {}, { timeout: 3000 })).closest('.sdp-alerta');
    expect(avis.textContent).toMatch(/Gestoria · Escàner Local de la carpeta/);
    expect(screen.queryByLabelText('Tria la carpeta arrel')).toBeNull();
    esperaRellotge(closca);
    fireEvent.click(within(avis).getByRole('button', { name: 'Obri el panell de Tractors' }));
    expect(ruta()).toBe(`${RUTA}${CONSULTA_TRACTORS}`);
  });

  test('de punta a punta: la carpeta (webkitdirectory), la radiografia, «Aboca» al Tauler i els Bancs; canviar de mòdul la conserva; «Oblida les dades» l’oblida', async () => {
    const { closca } = munta({
      magatzem: await ambSignatures([TRACTOR_TAULER, TRACTOR_ESCANER]), modulActiu: 'escaner', hrefIdentitat: '/app/gestoria/identitat'
    });
    /* Sense selector de carpetes a l'entorn (Safari, Firefox): l'<input type="file" webkitdirectory>. */
    const input = await screen.findByLabelText('Tria la carpeta arrel', {}, { timeout: 3000 });
    expect(input.hasAttribute('webkitdirectory')).toBe(true);
    await act(async () => {
      fireEvent.change(input, { target: { files: carpeta() } });
    });
    await waitFor(() => expect(radiografia()).not.toBeNull(), { timeout: 5000 });
    expect(screen.getByText(`Carpeta triada: «${ARREL}».`)).toBeTruthy();
    /* La identitat legal només es compta: cap nom dels seus fitxers enlloc de la closca (ni al text ni a cap
       atribut), i la pista cap a la seua vista. Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D): la línia
       d'estat del selector de Pedra Seca (CampFitxer, nomsVisibles={false}) ja només diu el recompte de la carpeta
       triada en l'alternativa webkitdirectory, i la comprovació torna a ser la closca sencera. */
    expect(screen.getByRole('heading', { level: 2, name: 'Extractes per al Tauler' })).toBeTruthy();
    expect(closca.textContent).not.toMatch(/document_escanejat/);
    expect(serialitzat(closca)).not.toMatch(/document_escanejat/);
    expect(screen.getByLabelText('Tria la carpeta arrel').closest('.sdp-camp-fitxer').querySelector('.sdp-camp-fitxer__estat').textContent)
      .toBe('2 fitxers');
    const aboca = screen.getByRole('button', { name: 'Aboca 1 extracte al Tauler' });
    expect(aboca.disabled).toBe(false);
    await act(async () => {
      fireEvent.click(aboca);
    });
    await screen.findByText('Compte 1: del 01/06/2026 al 30/06/2026.', {}, { timeout: 5000 });
    /* Els moviments són una xifra del banc: amagats fins a l'ull de la boina. */
    expect(screen.getByText(/^Moviments llegits:/).textContent).toMatch(/Xifra amagada/);
    expect(serialitzat(closca)).not.toMatch(/975,00/);
    /* El Tauler i els Bancs ja tenen les xifres d'eixos extractes. */
    vesAlModul('Bancs');
    expect([...closca.querySelectorAll('.sp-card-title')].map((e) => e.textContent)).toEqual(['Compte 1', 'Conciliació']);
    vesAlModul('Escàner Local');
    expect(radiografia()).not.toBeNull();
    esperaRellotge(closca);
    fireEvent.click(screen.getByRole('button', { name: 'Obri Identitat i Finestreta' }));
    expect(ruta()).toBe('/app/gestoria/identitat');
    /* «Oblida les dades» (la porta del Tauler) també oblida la carpeta i la radiografia. */
    vesAlModul('Tauler d’Inici');
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    vesAlModul('Escàner Local');
    expect(radiografia()).toBeNull();
    expect(screen.queryByText(/^Carpeta triada/)).toBeNull();
    expect(screen.getByLabelText('Tria la carpeta arrel')).toBeTruthy();
    expect(closca.querySelectorAll('[style]')).toHaveLength(0);
  }, 30000);

  test('sense la ruta de la vista d’identitat, la pista no porta cap botó', async () => {
    munta({ magatzem: await ambSignatures([TRACTOR_TAULER, TRACTOR_ESCANER]), modulActiu: 'escaner' });
    const input = await screen.findByLabelText('Tria la carpeta arrel', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.change(input, { target: { files: carpeta() } });
    });
    await waitFor(() => expect(radiografia()).not.toBeNull(), { timeout: 5000 });
    expect(screen.getByText('La identitat legal té la seua vista')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Obri Identitat i Finestreta' })).toBeNull();
  }, 20000);
});

