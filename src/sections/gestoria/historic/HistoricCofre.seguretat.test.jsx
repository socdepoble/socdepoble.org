/* Gestoria · revisió adversarial de seguretat de l'Històric darrere del cofre
   (Onada 6, 261009, després de la integració; ordre del Mestre del 261009:
   «seguretat 1000x1000»). HistoricCofre.test.jsx mira el text de la pàgina;
   ací es mira tot el que el text no diu, amb el recorregut sencer de la
   persona (obrir, llegir el banc, mostrar les xifres, escriure una regla sense
   enviar-la, afegir-ne una altra i preparar el llibre) i un autobloqueig amb
   el diàleg del llibre obert:
     · després del bloqueig, cap dada ni als atributs (aria-label, title,
       value…) ni als valors dels camps, i cap camp fora de la porta del cofre;
     · en tot el recorregut, cap petició de xarxa (fetch, XMLHttpRequest,
       sendBeacon, window.open), cap traça a la consola amb dades, cap canvi
       del títol, de l'adreça ni de l'historial, i res de la persona a
       localStorage, sessionStorage ni a les galetes;
     · el bloqueig no reescriu la configuració desada (ni buida ni amb el que
       s'escrivia sense enviar) i, en tornar a obrir, hi és sencera.
   Tot de veres (la vista de la ruta, PortaCofre, cofre.js, el magatzem de
   producció sobre l'IndexedDB fals i WebCrypto de Node). Dades sintètiques. */
import { webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { creaIdbFals } from '../../../../tests/helpers/idbFals.js';
import { crearMagatzemMemoria } from '../../tractors/nucli/magatzem.js';
import { TRACTORS, empremtaDe } from '../../tractors/registreTractors.js';
import { creaCofreLocal, persistenciaDelCofre } from '../cofre/cofre.js';
import { NOM_BD_COFRE } from '../cofre/magatzemCofre.js';
import { TRACTOR_HISTORIC } from '../tractors.js';
import Historic, { COLLECCIO_HISTORIC } from './Historic.jsx';
import { VERSIO_CONFIGURACIO } from './useHistoric.js';

const subtle = webcrypto.subtle;
const ARA = Date.UTC(2026, 9, 9, 3, 0, 0);
const AVUI = Object.freeze({ a: 2026, m: 10, d: 9 });
const MINUT = 60 * 1000;
const FRASE = 'olivera vella del mas de baix';
const autenticador = await creaAutenticadorSimulat({ subtle });
const INFO = await empremtaDe(TRACTORS.find((t) => t.id === TRACTOR_HISTORIC.id), subtle);
const entornTractors = { location: { origin: autenticador.origen, hostname: autenticador.rpId } };

const CSV = [
  'Fecha,F. valor,Concepto,Importe,Saldo',
  '2025-01-05,2025-01-05,"OP.TARJ.COMPRA COMERCIO',
  '999999******1234 ANTHROPIC REFPRIVADA77",-21.50,978.50',
  '2025-01-10,2025-01-10,TRANSFERENCIA DE EMPRESA SINTETICA,1210.00,2188.50',
  '2025-02-03,2025-02-03,GOOGLE *SERVICES,-12.00,2176.50',
  '2025-02-28,2025-02-28,TGSS COTIZACION,-294.00,1882.50'
].join('\n');
const fitxer = (nom, text) => {
  const dades = new TextEncoder().encode(text);
  return { name: nom, size: dades.length, arrayBuffer: vi.fn(async () => dades.slice().buffer) };
};
/* El que no pot quedar enlloc després del bloqueig. */
const ESBORRANY = 'esborranyprivat';
const REGLA = 'reglaprivada';
const DEL_BANC = ['REFPRIVADA77', 'EMPRESA SINTETICA', 'OP.TARJ', 'TGSS', '999999', 'ANTHROPIC', 'moviments.csv'];
const XIFRES = ['1.882,50', '1.210,00', '294,00', '21,50'];

function entornCofre() {
  const finestra = new EventTarget();
  const doc = new EventTarget();
  doc.visibilityState = 'visible';
  finestra.document = doc;
  finestra.isSecureContext = true;
  return finestra;
}

function creaTemporitzadors() {
  let ara = 1000000;
  let seguent = 1;
  const pendents = new Map();
  return {
    rellotge: () => ara,
    setTimeout: (fn, ms) => {
      const id = seguent++;
      pendents.set(id, { fn, quan: ara + Math.max(0, ms) });
      return id;
    },
    clearTimeout: (id) => {
      pendents.delete(id);
    },
    avanca(ms) {
      const fi = ara + ms;
      for (;;) {
        const proper = [...pendents].filter(([, t]) => t.quan <= fi).sort((a, b) => a[1].quan - b[1].quan)[0];
        if (!proper) break;
        pendents.delete(proper[0]);
        ara = proper[1].quan;
        proper[1].fn();
      }
      ara = fi;
    }
  };
}

const oberts = [];
afterEach(() => {
  cleanup();
  oberts.splice(0).forEach((cofre) => cofre.tanca());
  vi.restoreAllMocks();
});

/* Tot el que porta el document: el text, cada atribut i el valor de cada camp. */
function rastre(arrel) {
  const trossos = [arrel.textContent];
  for (const element of arrel.querySelectorAll('*')) {
    for (const atribut of element.attributes) trossos.push(atribut.value);
    if (typeof element.value === 'string') trossos.push(element.value);
  }
  return trossos.join('\n');
}

const claus = (magatzem) => Array.from({ length: magatzem.length }, (_, i) => magatzem.key(i)).sort();

test('el recorregut sencer no ix de l’ordinador i, en bloquejar-se, no deixa res ni als atributs ni als camps', async () => {
  /* Les eixides que no poden passar, espiades des d'abans de muntar. */
  const xarxa = [
    typeof globalThis.fetch === 'function' ? vi.spyOn(globalThis, 'fetch') : null,
    vi.spyOn(XMLHttpRequest.prototype, 'open'),
    typeof navigator.sendBeacon === 'function' ? vi.spyOn(navigator, 'sendBeacon') : null,
    vi.spyOn(window, 'open').mockImplementation(() => null)
  ].filter(Boolean);
  const consola = ['log', 'info', 'warn', 'error', 'debug'].map((metode) => vi.spyOn(console, metode));
  const desaText = vi.spyOn(Storage.prototype, 'setItem');
  const historial = [vi.spyOn(window.history, 'pushState'), vi.spyOn(window.history, 'replaceState')];
  const abans = { titol: document.title, adreca: window.location.href, local: claus(window.localStorage), sessio: claus(window.sessionStorage) };

  /* Un cofre amb configuració desada i bloquejat, com el troba el Mestre. */
  const idb = creaIdbFals();
  const temporitzadors = creaTemporitzadors();
  const cofre = creaCofreLocal({ idb, cripto: webcrypto, entorn: entornCofre(), iteracions: 1000, temporitzadors, rellotge: temporitzadors.rellotge });
  oberts.push(cofre);
  const persistencia = persistenciaDelCofre(cofre, COLLECCIO_HISTORIC);
  await cofre.creaCofre(FRASE);
  await persistencia.desa({ versio: VERSIO_CONFIGURACIO, regles: [{ patro: 'forn de prova', categoria: 'altres' }], escenari: { facturacio: 5, despesaIa: 0 } });
  cofre.bloqueja();

  const magatzem = crearMagatzemMemoria();
  await magatzem.afegixClau(autenticador.clau);
  await magatzem.afegixRegistre(await autenticador.signa({
    manifest: TRACTOR_HISTORIC, empremta: INFO.empremta, ara: ARA - 60000, nonce: new Uint8Array(16).fill(5)
  }));
  render(
    <MemoryRouter rutaInicial="/app/gestoria/historic">
      <Historic cofre={cofre} magatzem={magatzem} subtle={subtle} entorn={entornTractors} rellotge={() => ARA} avui={AVUI} descarrega={vi.fn()} />
    </MemoryRouter>
  );

  /* Obri, llig el banc i mostra les xifres. */
  fireEvent.change(await screen.findByLabelText('Frase de pas'), { target: { value: FRASE } });
  fireEvent.click(screen.getByRole('button', { name: 'Obri el cofre' }));
  fireEvent.change(await screen.findByLabelText('Tria els extractes del banc de tot el període', {}, { timeout: 5000 }),
    { target: { files: [fitxer('moviments.csv', CSV)] } });
  await screen.findByRole('heading', { level: 2, name: 'La foto del director financer' }, { timeout: 5000 });
  fireEvent.click(screen.getByRole('button', { name: 'Mostra les xifres' }));

  /* Una regla enviada i un esborrany sense enviar. */
  const patro = screen.getByLabelText('Text que apareix al moviment');
  fireEvent.change(patro, { target: { value: REGLA } });
  fireEvent.click(screen.getByRole('button', { name: 'Afig la regla' }));
  await screen.findByText(`«${REGLA}» → Intel·ligència artificial`);
  fireEvent.change(patro, { target: { value: ESBORRANY } });
  await waitFor(async () => expect((await persistencia.llig()).regles.map((r) => r.patro)).toEqual(['forn de prova', REGLA]), { timeout: 5000 });
  const [desada] = idb.files(NOM_BD_COFRE, 'registres');

  /* El llibre preparat: el diàleg en mostra el nom i l'empremta. */
  fireEvent.click(screen.getByRole('button', { name: 'Prepara el llibre (XLSX)' }));
  const dialeg = await screen.findByRole('dialog', { name: 'Descarregar el llibre sense xifrar?' }, { timeout: 5000 });
  const empremta = within(dialeg).getByText(/^[0-9a-f]{64}$/).textContent;
  const nomLlibre = within(dialeg).getByText(/\.xlsx$/).textContent;

  /* Control: abans del bloqueig, el rastre sí que ho porta tot (també el valor del camp). */
  const obert = rastre(document.body);
  for (const que of [ESBORRANY, REGLA, empremta, nomLlibre, ...XIFRES]) expect(obert, `control: ${que}`).toContain(que);

  /* L'autobloqueig, amb el diàleg obert. */
  act(() => temporitzadors.avanca(10 * MINUT));
  expect(await screen.findByRole('button', { name: 'Obri el cofre' })).toBeTruthy();
  expect(cofre.obert).toBe(false);

  const tancat = rastre(document.body);
  for (const que of [ESBORRANY, REGLA, 'forn de prova', empremta, nomLlibre, ...XIFRES, ...DEL_BANC]) {
    expect(tancat, que).not.toContain(que);
  }
  expect(screen.queryByRole('dialog')).toBeNull();
  /* Els únics camps que queden són els de la porta del cofre. */
  const porta = screen.getByRole('region', { name: 'Cofre xifrat' });
  const camps = [...document.body.querySelectorAll('input, select, textarea')];
  expect(camps.length).toBeGreaterThan(0);
  expect(camps.filter((camp) => !porta.contains(camp))).toEqual([]);

  /* Res ha eixit ni s'ha desat en clar en tot el recorregut. */
  for (const espia of xarxa) expect(espia).not.toHaveBeenCalled();
  for (const espia of historial) expect(espia).not.toHaveBeenCalled();
  expect(document.title).toBe(abans.titol);
  expect(window.location.href).toBe(abans.adreca);
  expect(claus(window.localStorage)).toEqual(abans.local);
  expect(claus(window.sessionStorage)).toEqual(abans.sessio);
  const sensibles = [ESBORRANY, REGLA, 'forn de prova', empremta, FRASE, ...XIFRES, ...DEL_BANC];
  const traces = [...consola.flatMap((espia) => espia.mock.calls), ...desaText.mock.calls, [document.cookie]]
    .map((crida) => crida.map((valor) => (typeof valor === 'string' ? valor : String(valor?.stack ?? valor))).join(' '));
  for (const que of sensibles) expect(traces.filter((traca) => traca.includes(que)), que).toEqual([]);

  /* El bloqueig no ha reescrit la configuració; en tornar a obrir, hi és sencera i sense l'esborrany. */
  expect(idb.files(NOM_BD_COFRE, 'registres')).toEqual([desada]);
  await act(async () => { await cofre.obreCofre(FRASE); });
  const tornada = await persistencia.llig();
  expect(tornada.regles.map((r) => r.patro)).toEqual(['forn de prova', REGLA]);
  expect(JSON.stringify(tornada)).not.toContain(ESBORRANY);
  expect(JSON.stringify(idb.files(NOM_BD_COFRE, 'registres'))).not.toContain(REGLA);
});
