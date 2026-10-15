/* Gestoria · l'Històric darrere del cofre xifrat (integració de l'Onada 6,
   ordre del Mestre, 261009: «xifra-ho i protegeix-ho perquè el Mestre puga
   provar amb dades reals»). Tot de veres: la vista que munta la ruta (l'export
   per defecte d'Historic.jsx), la porta i el hook del cofre, cofre.js amb
   WebCrypto de Node i el magatzem de producció (cofre/magatzemCofre.js)
   damunt d'un IndexedDB fals (tests/helpers/idbFals.js), la porta
   d'aprovació amb el catàleg real i un autenticador WebAuthn simulat. Els
   temporitzadors de l'autobloqueig són simulats. Dades sintètiques: cap
   compte ni NIF real. Es mira: amb el cofre sense crear o bloquejat no es
   pinta cap xifra ni cap regla; en obrir, la configuració desada es recupera;
   en bloquejar (botó, autobloqueig o des de la pàgina d'una targeta) es
   buida tot; en eixir de la vista el cofre es bloqueja; i a l'IndexedDB no
   queda res en clar.
   Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): «a la dreta
   SEMPRE la data i l'hora vives». Amb el cofre bloquejat la boina va sense
   l'ull, però el rellotge viu i el titular de la sessió s'hi queden. */
import { webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { creaIdbFals } from '../../../../tests/helpers/idbFals.js';
import { crearMagatzemMemoria } from '../../tractors/nucli/magatzem.js';
import { TRACTORS, empremtaDe } from '../../tractors/registreTractors.js';
import { ID_UNIC, creaCofreLocal, persistenciaDelCofre } from '../cofre/cofre.js';
import { NOM_BD_COFRE } from '../cofre/magatzemCofre.js';
import { TRACTOR_HISTORIC } from '../tractors.js';
import Historic, { COLLECCIO_HISTORIC } from './Historic.jsx';
import { VERSIO_CONFIGURACIO } from './useHistoric.js';

const subtle = webcrypto.subtle;
const ARA = Date.UTC(2026, 9, 9, 3, 0, 0);
const rellotge = () => ARA;
const AVUI = Object.freeze({ a: 2026, m: 10, d: 9 });
const MINUT = 60 * 1000;
const FRASE = 'olivera vella del mas de dalt';
const autenticador = await creaAutenticadorSimulat({ subtle });
const INFO = await empremtaDe(TRACTORS.find((t) => t.id === TRACTOR_HISTORIC.id), subtle);
/* L'entorn de la porta dels tractors (l'origen de la signatura), que no és el del cofre. */
const entornTractors = { location: { origin: autenticador.origen, hostname: autenticador.rpId } };

/* El mateix CSV sintètic que Historic.test.jsx. */
const CSV = [
  'Fecha,F. valor,Concepto,Importe,Saldo',
  '2025-01-05,2025-01-05,"OP.TARJ.COMPRA COMERCIO',
  '999999******1234 ANTHROPIC REFPRIVADA77",-21.50,978.50',
  '2025-01-10,2025-01-10,TRANSFERENCIA DE EMPRESA SINTETICA,1210.00,2188.50',
  '2025-02-03,2025-02-03,GOOGLE *SERVICES,-12.00,2176.50',
  '2025-02-28,2025-02-28,TGSS COTIZACION,-294.00,1882.50'
].join('\n');
const PRIVATS = ['REFPRIVADA77', 'EMPRESA SINTETICA', 'OP.TARJ', 'TGSS', '999999', 'ANTHROPIC'];
const fitxer = (nom, text) => {
  const dades = new TextEncoder().encode(text);
  return { name: nom, size: dades.length, arrayBuffer: vi.fn(async () => dades.slice().buffer) };
};
const CONFIGURACIO_DESADA = Object.freeze({
  versio: VERSIO_CONFIGURACIO,
  regles: [{ patro: 'forn de prova', categoria: 'altres' }],
  escenari: { facturacio: 5, despesaIa: 0 }
});

/* La finestra i el document del cofre, amb els esdeveniments de veres (EventTarget). */
function entornCofre() {
  const finestra = new EventTarget();
  const doc = new EventTarget();
  doc.visibilityState = 'visible';
  finestra.document = doc;
  finestra.isSecureContext = true;
  return finestra;
}

/* Temporitzadors i rellotge simulats: el temps de l'autobloqueig només avança quan es demana. */
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
function creaCofre() {
  const idb = creaIdbFals();
  const temporitzadors = creaTemporitzadors();
  const cofre = creaCofreLocal({ idb, cripto: webcrypto, entorn: entornCofre(), iteracions: 1000, temporitzadors, rellotge: temporitzadors.rellotge });
  oberts.push(cofre);
  return { cofre, idb, temporitzadors };
}

afterEach(() => {
  cleanup();
  oberts.splice(0).forEach((cofre) => cofre.tanca());
  vi.restoreAllMocks();
});

async function magatzemAprovat() {
  const magatzem = crearMagatzemMemoria();
  await magatzem.afegixClau(autenticador.clau);
  await magatzem.afegixRegistre(await autenticador.signa({
    manifest: TRACTOR_HISTORIC, empremta: INFO.empremta, ara: ARA - 60000, nonce: new Uint8Array(16).fill(3)
  }));
  return magatzem;
}

async function munta({ cofre, magatzem, titular }) {
  const descarrega = vi.fn();
  const vista = render(
    <MemoryRouter rutaInicial="/app/gestoria/historic">
      <Historic cofre={cofre} magatzem={magatzem ?? await magatzemAprovat()} subtle={subtle} entorn={entornTractors} rellotge={rellotge}
        avui={AVUI} descarrega={descarrega} titular={titular} />
    </MemoryRouter>
  );
  return { ...vista, descarrega };
}

/* Un cofre creat, amb la configuració desada i bloquejat: el que troba el Mestre en tornar. Torna { cofre, idb, temporitzadors }. */
async function cofreAmbConfiguracio() {
  const propi = creaCofre();
  await propi.cofre.creaCofre(FRASE);
  await persistenciaDelCofre(propi.cofre, COLLECCIO_HISTORIC).desa(CONFIGURACIO_DESADA);
  propi.cofre.bloqueja();
  return propi;
}

async function obriPerPantalla() {
  fireEvent.change(await screen.findByLabelText('Frase de pas'), { target: { value: FRASE } });
  fireEvent.click(screen.getByRole('button', { name: 'Obri el cofre' }));
  return screen.findByLabelText('Tria els extractes del banc de tot el període', {}, { timeout: 5000 });
}

async function llig() {
  fireEvent.change(screen.getByLabelText('Tria els extractes del banc de tot el període'), { target: { files: [fitxer('moviments.csv', CSV)] } });
  await screen.findByRole('heading', { level: 2, name: 'La foto del director financer' }, { timeout: 5000 });
}

const textDe = (container) => container.textContent;
/* Res de la vista de dins del cofre: ni la porta del tractor, ni el selector, ni xifres, ni regles, ni l'ull. */
function senseRes(container) {
  expect(screen.queryByLabelText('Tria els extractes del banc de tot el període')).toBeNull();
  expect(screen.queryByText('Cal aprovar el tractor')).toBeNull();
  expect(screen.queryByRole('heading', { level: 2, name: 'La foto del director financer' })).toBeNull();
  expect(screen.queryByRole('list', { name: 'Les teues regles' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Mostra les xifres' })).toBeNull();
  expect(textDe(container)).not.toMatch(/€|forn de prova|Import amagat|Xifra amagada/);
  for (const privat of PRIVATS) expect(textDe(container), privat).not.toContain(privat);
}

describe('la porta del cofre', () => {
  test('sense cofre: només el títol i la porta del cofre per a crear-lo', async () => {
    const { cofre } = creaCofre();
    const { container } = await munta({ cofre });
    expect(await screen.findByRole('button', { name: 'Crea el cofre' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Històric i IA');
    expect(screen.getByRole('region', { name: 'Cofre xifrat' })).toBeTruthy();
    senseRes(container);
  });

  test('amb el cofre bloquejat no es pinta cap xifra ni cap regla; en obrir, la configuració desada es recupera', async () => {
    const { cofre } = await cofreAmbConfiguracio();
    const { container } = await munta({ cofre });
    expect(await screen.findByRole('button', { name: 'Obri el cofre' })).toBeTruthy();
    senseRes(container);
    await obriPerPantalla();
    expect(screen.getByRole('button', { name: 'Mostra les xifres' }).getAttribute('aria-pressed')).toBe('false');
    await llig();
    expect(await screen.findByText('«forn de prova» → Altres')).toBeTruthy();
    expect(screen.getByLabelText('Facturació (% de canvi)').value).toBe('5');
    /* El contingut va fora de la targeta del cofre, i la gestió del cofre, al final. */
    const porta = screen.getByRole('region', { name: 'Cofre xifrat' });
    expect(within(porta).queryByRole('heading', { name: 'La foto del director financer' })).toBeNull();
    const gestio = screen.getByRole('region', { name: 'Còpies i claus del cofre' });
    const foto = screen.getByRole('heading', { level: 2, name: 'La foto del director financer' });
    expect(porta.compareDocumentPosition(foto) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(foto.compareDocumentPosition(gestio) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B). */
  test('amb el cofre bloquejat, la barra no porta l’ull però sí el titular de la sessió i el rellotge viu, l’últim de la barra', async () => {
    const { cofre } = await cofreAmbConfiguracio();
    const { container } = await munta({ cofre, titular: { nom: 'Pepa Soler', poble: 'Vilaprova de Dalt', avatar: null } });
    expect(await screen.findByRole('button', { name: 'Obri el cofre' })).toBeTruthy();
    senseRes(container);
    const barra = container.querySelector('section.bar-orange');
    expect(barra.querySelector('.sp-card-author-name').textContent).toBe('Pepa Soler');
    const accions = barra.querySelector('.bar-actions');
    expect(accions.querySelector('.sdp-gestoria-boina')).toBeNull();
    expect(accions.children).toHaveLength(1);
    const rellotgeViu = accions.lastElementChild;
    expect(rellotgeViu.tagName).toBe('TIME');
    expect(rellotgeViu.getAttribute('aria-label')).toMatch(/^Data i hora d’ara: \d{2}:\d{2} del \d{2}\/\d{2}\/\d{2}$/);
    expect(textDe(container)).not.toContain('Titular sense configurar');
  });
});

describe('el bloqueig buida l’estat', () => {
  test('«Bloqueja»: fora la lectura, les xifres, les regles i els fitxers triats; en tornar a obrir, cal tornar a triar els extractes', async () => {
    const { cofre, idb } = await cofreAmbConfiguracio();
    const { container } = await munta({ cofre });
    await obriPerPantalla();
    await llig();
    fireEvent.click(screen.getByRole('button', { name: 'Mostra les xifres' }));
    await waitFor(() => expect(textDe(container)).toContain('1.882,50 €'));
    expect(screen.getByText('«forn de prova» → Altres')).toBeTruthy();
    /* L'IV canvia a cada desament: si no canvia, ningú no hi ha escrit (tampoc una configuració buida en bloquejar). */
    const [desada] = idb.files(NOM_BD_COFRE, 'registres');

    fireEvent.click(screen.getByRole('button', { name: 'Bloqueja' }));
    expect(await screen.findByRole('button', { name: 'Obri el cofre' })).toBeTruthy();
    expect(cofre.obert).toBe(false);
    senseRes(container);
    expect(textDe(container)).not.toContain('1.882,50');

    await obriPerPantalla();
    /* La lectura s'ha oblidat (també els fitxers: no hi ha «Torna a llegir») i l'ull torna a estar tancat. */
    expect(screen.getByText('Encara no hi ha cap extracte')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Torna a llegir amb les regles' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Mostra les xifres' }).getAttribute('aria-pressed')).toBe('false');
    /* La configuració, en canvi, torna del cofre, i ningú no l'ha reescrita. */
    await llig();
    expect(await screen.findByText('«forn de prova» → Altres')).toBeTruthy();
    expect(textDe(container)).not.toContain('1.882,50');
    expect(idb.files(NOM_BD_COFRE, 'registres')).toEqual([desada]);
  });

  test('l’autobloqueig també, encara que la persona mire la pàgina d’una targeta', async () => {
    const { cofre, temporitzadors } = await cofreAmbConfiguracio();
    const { container } = await munta({ cofre });
    await obriPerPantalla();
    await llig();
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    await screen.findByRole('heading', { level: 1, name: 'Caixa real' });
    act(() => temporitzadors.avanca(10 * MINUT));
    expect(await screen.findByRole('button', { name: 'Obri el cofre' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Històric i IA');
    senseRes(container);
  });

  test('tornar de la pàgina d’una targeta amb el cofre obert no torna a demanar la frase', async () => {
    const { cofre } = await cofreAmbConfiguracio();
    await munta({ cofre });
    await obriPerPantalla();
    await llig();
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    await screen.findByRole('heading', { level: 1, name: 'Caixa real' });
    fireEvent.click(screen.getByRole('button', { name: 'Tornar arrere' }));
    /* Sense esperar res: la porta es pinta oberta de seguida, amb el contingut. */
    expect(screen.getByRole('heading', { level: 2, name: 'La foto del director financer' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Obri el cofre' })).toBeNull();
    expect(cofre.obert).toBe(true);
  });

  test('en eixir de la vista, el cofre es bloqueja', async () => {
    const { cofre } = await cofreAmbConfiguracio();
    const { unmount } = await munta({ cofre });
    await obriPerPantalla();
    expect(cofre.obert).toBe(true);
    unmount();
    expect(cofre.obert).toBe(false);
    await expect(persistenciaDelCofre(cofre, COLLECCIO_HISTORIC).llig()).rejects.toMatchObject({ codi: 'COFRE_BLOQUEJAT' });
  });
});

describe('res en clar a l’IndexedDB', () => {
  test('la configuració es desa xifrada a la col·lecció «historic»; els moviments del banc, mai', async () => {
    const { cofre, idb } = creaCofre();
    await cofre.creaCofre(FRASE);
    const { container } = await munta({ cofre });
    await screen.findByLabelText('Tria els extractes del banc de tot el període');
    await llig();
    /* Una regla, una reclassificació i un escenari: els tres camins de desar. */
    fireEvent.change(screen.getByLabelText('Text que apareix al moviment'), { target: { value: 'sentinellaprivada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Afig la regla' }));
    await screen.findByText('«sentinellaprivada» → Intel·ligència artificial');
    fireEvent.change(screen.getByLabelText('Categoria del moviment del 03/02/2025'), { target: { value: 'programari' } });
    fireEvent.change(screen.getByLabelText('Facturació (% de canvi)'), { target: { value: '12' } });

    const persistencia = persistenciaDelCofre(cofre, COLLECCIO_HISTORIC);
    await waitFor(async () => {
      const desada = await persistencia.llig();
      expect(desada?.escenari?.facturacio).toBe(12);
      expect(desada.regles).toEqual([{ patro: 'sentinellaprivada', categoria: 'ia', proveidor: null }]);
      expect(Object.values(desada.reclassificacions)).toEqual([{ categoria: 'programari', proveidor: 'google' }]);
    }, { timeout: 5000 });

    const registres = idb.files(NOM_BD_COFRE, 'registres');
    expect(registres.map((r) => [r.colleccio, r.id])).toEqual([[COLLECCIO_HISTORIC, ID_UNIC]]);
    expect(Object.keys(registres[0]).sort()).toEqual(['clau', 'colleccio', 'id', 'iv', 'xifrat']);
    const bolcat = JSON.stringify([...idb.bases.keys()].map((nom) => [nom, idb.files(nom, 'meta'), idb.files(nom, 'registres')]));
    expect([...idb.bases.keys()]).toEqual([NOM_BD_COFRE]);
    /* Textos de sis caràcters o més (o amb signes que el base64 no porta), perquè un xifrat no els puga contindre per atzar. */
    for (const clar of ['sentinellaprivada', 'programari', 'regles', 'reclassificacions', 'escenari', 'suposits', 'versio', 'categoria',
      'proveidor', 'centims', 'moviments', FRASE, '188250', '218850', '121000', '-2150', '-1200', 'REFPRIVADA77', 'EMPRESA SINTETICA',
      'OP.TARJ', 'TGSS COTIZACION', 'GOOGLE *SERVICES', '999999', 'ANTHROPIC']) {
      expect(bolcat, clar).not.toContain(clar);
    }
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    /* La pantalla sí que ho té, mentre el cofre és obert. */
    expect(textDe(container)).toContain('«sentinellaprivada» → Intel·ligència artificial');
    /* Temps propi: el PBKDF2 del cofre i el waitFor de 5 s no caben en els 5 s
       per defecte quan la suite corre en paral·lel (auditoria 261014_1636). */
  }, 20000);
});
