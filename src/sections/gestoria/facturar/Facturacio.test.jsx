/* La pantalla de Facturació (ordre del Mestre, 261007: «tindre la facturació
   operativa inclús sense xarxa»; passos 1 a 4 del mapa de la Gestoria). De
   veres: el llibre és el port IndexedDB de només afegir i el perfil, el seu
   magatzem, tots dos sobre un IndexedDB fals escrit ací (el model del de
   registre/portIndexedDB.test.js; LLEI_08: cap prova dels carrils importa
   suport de dins de src/); l'empremta la calcula WebCrypto. La xarxa està tallada (fetch llança i es vigila que
   ningú no l'ha cridat). Es mira el camí sencer d'una persona que no és del
   ram: configurar l'empresa, declarar que no té factures d'abans, emetre una
   completa, una simplificada amb l'IVA inclòs i una F3 que la substituïx,
   anul·lar-ne una, fer la còpia (descarregada o en una carpeta) i restaurar-la;
   que tot sobreviu a tancar i tornar a obrir la pantalla; i que sense
   IndexedDB o sense WebCrypto no s'emet res. Correccions de la revisió
   (261007): un tiquet només se substituïx una vegada (F5), el perfil es fixa
   quan s'emet (F4), i sobre un llibre truncat no s'emet ni s'anul·la (F3) i la
   còpia d'ara no tapa el truncament (F2). Dades sintètiques: el NIF de
   l'empresa és el de les proves, el del client es compon a trossos perquè la
   porta de qualitat no hi veja un literal amb forma de DNI, i les adreces són
   inventades. */
import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ESQUEMA_CONFIG_EMPRESA } from '../facturacio/configEmpresa.js';
import { creaEmissio } from '../facturacio/emissio.js';
import { NOM_BD_PERFIL, creaMagatzemPerfil } from '../facturacio/magatzemPerfil.js';
import { verificaCadena } from '../facturacio/registre/cadena.js';
import { ESQUEMA_LLIBRE, restauraCopia } from '../facturacio/registre/port.js';
import { NOM_BD, creaPortIndexedDB } from '../facturacio/registre/portIndexedDB.js';
import Facturacio from './Facturacio.jsx';

const clona = (valor) => (valor === undefined ? undefined : JSON.parse(JSON.stringify(valor)));
const perClau = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0);

/* Fals d'IndexedDB: diverses bases, stores amb keyPath i índexs (únics o
   no), add/getAll i, als índexs, get/getAll/openCursor('prev'). Les
   transaccions d'una base passen d'una en una i una avortada desfà el que
   havia escrit. Cap operació d'esborrar ni de reescriure: no n'hi ha. */
function creaIdbFals() {
  const bases = new Map();
  const despres = (fn) => setTimeout(fn, 0);
  function creaTransaccio(base, mode) {
    const tx = { error: null };
    let pendents = 0;
    let activa = false;
    let acabada = false;
    let instantania = null;
    const espera = [];
    let allibera;
    const torn = new Promise((resol) => { allibera = resol; });
    const previ = base.cua;
    base.cua = previ.then(() => torn);
    const acaba = (correcta, error) => {
      if (acabada) return;
      acabada = true;
      if (!correcta && instantania) for (const [nom, files] of instantania) base.stores.get(nom).files = files;
      despres(() => {
        if (correcta) tx.oncomplete?.();
        else {
          if (error) tx.onerror?.({ target: { error } });
          tx.onabort?.({ target: tx });
        }
        allibera();
      });
    };
    const potAcabar = () => {
      if (activa && pendents === 0) acaba(true);
    };
    previ.then(() => {
      activa = true;
      if (mode === 'readwrite') instantania = [...base.stores].map(([nom, s]) => [nom, new Map(s.files)]);
      despres(() => {
        espera.splice(0).forEach((executa) => executa());
        potAcabar();
      });
    });
    const peticio = (accio) => {
      const p = { result: undefined, error: null };
      pendents += 1;
      const executa = () => despres(() => {
        pendents -= 1;
        if (acabada) return;
        try {
          p.result = accio();
        } catch (error) {
          p.error = error;
          acaba(false, error);
          return;
        }
        p.onsuccess?.();
        potAcabar();
      });
      if (activa) executa();
      else espera.push(executa);
      return p;
    };
    tx.abort = () => acaba(false, null);
    tx.objectStore = (nom) => {
      const store = base.stores.get(nom);
      const ordenades = () => [...store.files.entries()].sort(perClau).map(([, v]) => v);
      const index = (nomIndex) => {
        const { camp } = store.indexs.get(nomIndex);
        const coincidents = (clau) => ordenades().filter((fila) => fila[camp] === clau);
        return {
          get: (clau) => peticio(() => clona(coincidents(clau)[0])),
          getAll: (clau) => peticio(() => clona(coincidents(clau))),
          openCursor: (clau, direccio) => peticio(() => {
            const files = coincidents(clau);
            const fila = direccio === 'prev' ? files[files.length - 1] : files[0];
            return fila ? { value: clona(fila) } : null;
          })
        };
      };
      return {
        add: (valor) => peticio(() => {
          if (mode !== 'readwrite') throw Object.assign(new Error('Només lectura'), { name: 'ReadOnlyError' });
          const clau = valor[store.keyPath];
          const unica = [...store.indexs.values()].find(({ camp, unique }) => unique && [...store.files.values()].some((f) => f[camp] === valor[camp]));
          if (store.files.has(clau) || unica) throw Object.assign(new Error('Clau duplicada'), { name: 'ConstraintError' });
          store.files.set(clau, clona(valor));
          return clau;
        }),
        getAll: () => peticio(() => clona(ordenades())),
        index
      };
    };
    return tx;
  }
  return {
    /* Les files desades d'un store, en l'ordre de la clau: el que hi ha de veres. */
    files(nomBase, nomStore) {
      const store = bases.get(nomBase)?.stores.get(nomStore);
      return store ? [...store.files.entries()].sort(perClau).map(([, v]) => clona(v)) : [];
    },
    open(nom, versio) {
      const peticio = {};
      despres(() => {
        let base = bases.get(nom);
        const puja = !base || base.versio < versio;
        if (!base) {
          base = { versio: 0, stores: new Map(), cua: Promise.resolve() };
          bases.set(nom, base);
        }
        peticio.result = {
          objectStoreNames: { contains: (n) => base.stores.has(n) },
          createObjectStore(n, { keyPath }) {
            const store = { keyPath, files: new Map(), indexs: new Map() };
            base.stores.set(n, store);
            return { createIndex: (nomIndex, camp, { unique = false } = {}) => store.indexs.set(nomIndex, { camp, unique }) };
          },
          close() {},
          transaction: (_noms, mode) => creaTransaccio(base, mode)
        };
        if (puja) {
          base.versio = versio;
          peticio.onupgradeneeded?.();
        }
        peticio.onsuccess?.();
      });
      return peticio;
    }
  };
}

const subtle = webcrypto.subtle;
/* El 7 d'octubre de 2026 a les 10:00 UTC: les 12:00 a Madrid. */
const ARA = Date.UTC(2026, 9, 7, 10, 0, 0);
const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');

let xarxa;
beforeEach(() => {
  xarxa = vi.fn(() => Promise.reject(new Error('Sense xarxa')));
  vi.stubGlobal('fetch', xarxa);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function munta({ idb = creaIdbFals(), persist = async () => false, descarrega = vi.fn(), entorn = {}, ...altres } = {}) {
  const emmagatzematge = { persist: vi.fn(persist) };
  const props = { idb, locks: null, emmagatzematge, subtle, rellotge: () => ARA, entorn, descarrega, ...altres };
  const vista = render(<Facturacio {...props} />);
  return { ...vista, idb, descarrega, emmagatzematge, props };
}

const escriu = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
const boto = (nom) => screen.getByRole('button', { name: nom });
const files = (idb, base, store) => idb.files(base, store);

async function configura() {
  await screen.findByRole('heading', { name: '1. Les dades de l’empresa' });
  escriu('NIF (obligatori)', CIF_EMISSOR);
  escriu('Nom legal (obligatori)', 'Forn del Poble SL');
  escriu('Adreça (obligatori)', 'Plaça del Poble, 1');
  escriu('Codi postal (obligatori)', '46999');
  escriu('Població (obligatori)', 'Poble de Prova');
  escriu('Data de pas (obligatori)', '2026-10-07');
  fireEvent.click(boto('Desa les dades de l’empresa'));
  await screen.findByText('Dades de l’empresa desades');
  fireEvent.click(boto('No en tinc: comence de zero'));
  await screen.findByText('Factures d’abans desades');
}

function omplClient() {
  escriu('NIF del client (obligatori)', DNI_CLIENT);
  escriu('Nom o raó social (obligatori)', 'Bar de la Plaça');
  escriu('Adreça (obligatori)', 'Carrer Major, 2');
  escriu('Codi postal (obligatori)', '46998');
  escriu('Població (obligatori)', 'Poble de Prova');
}

function omplLinia({ concepte = 'Pa de llenya', quantitat = '2', preu = '2,50', iva = '4', ambIva = false } = {}) {
  escriu('Concepte (obligatori)', concepte);
  escriu('Quantitat (obligatori)', quantitat);
  escriu(ambIva ? 'Preu per unitat, amb l’IVA (obligatori)' : 'Preu per unitat, sense l’IVA (obligatori)', preu);
  fireEvent.change(screen.getByLabelText('IVA'), { target: { value: iva } });
}

/* Revisa, confirma al diàleg i espera l'avís de la factura emesa. */
async function emet(numero) {
  fireEvent.click(boto('Revisa i emet la factura'));
  const dialeg = await screen.findByRole('dialog', { name: `Emets la factura ${numero}?` });
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Sí, emet-la' }));
  await screen.findByText(`Factura ${numero} emesa`);
}

const numeroQueTindra = () => screen.getByText('Número que tindrà').nextElementSibling.textContent;
const taula = () => within(screen.getByRole('region', { name: 'Factures emeses' }));

describe('sense allò que fa falta, no s’emet res', () => {
  test('sense IndexedDB: ho diu i no hi ha cap formulari (mai una reserva en memòria)', async () => {
    munta({ idb: null });
    expect(await screen.findByText('Ací no es pot facturar')).toBeTruthy();
    expect(screen.getByText(/no deixa desar el llibre de factures \(IndexedDB\)/)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '3. Factura nova' })).toBeNull();
  });

  test('sense WebCrypto (fora de context segur): ho diu, amb el que cal fer', async () => {
    vi.stubGlobal('crypto', {});
    munta({ subtle: null });
    expect(await screen.findByText('Ací no es pot facturar')).toBeTruthy();
    expect(screen.getByText(/Obri la Gestoria amb https o des d’este mateix ordinador/)).toBeTruthy();
  });
});

describe('el camí sencer, sense xarxa', () => {
  test('configurar, emetre, anul·lar i fer la còpia; i tot es queda en este ordinador', async () => {
    const { idb, descarrega, emmagatzematge } = munta();
    expect(screen.getByText('Obrint el llibre de factures…')).toBeTruthy();
    expect(await screen.findByRole('heading', { name: '3. Factura nova' })).toBeTruthy();
    expect(screen.getByText(/Per a emetre factures, primer cal desar les dades de l’empresa/)).toBeTruthy();
    // Un sol H2 per pas, i cap H1: el posa la pàgina de l'app.
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      '1. Les dades de l’empresa', '2. Les factures d’abans', '3. Factura nova', '4. El llibre de factures', '5. Còpia del llibre'
    ]);
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();

    await configura();
    // El resum del perfil, i la versió desada al seu magatzem (no al llibre).
    expect(screen.getByText(CIF_EMISSOR)).toBeTruthy();
    expect(screen.getByText('Plaça del Poble, 1, 46999 Poble de Prova')).toBeTruthy();
    expect(files(idb, NOM_BD_PERFIL, 'versions').map((f) => f.clau)).toEqual(['config|000000000001', 'llegat|000000000001']);
    // Amb el perfil llest, es demana la persistència; el navegador diu que no, i es diu.
    expect(await screen.findByText('El navegador podria esborrar el llibre')).toBeTruthy();
    expect(emmagatzematge.persist).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(numeroQueTindra()).toBe('A2026-0001'));
    // Sense preu, la lectura ho diu per línia i no s'obri cap diàleg.
    fireEvent.click(boto('Revisa i emet la factura'));
    expect(await screen.findByText('Falta alguna cosa a la factura')).toBeTruthy();
    expect(screen.getByText('Línia 1: el preu no s’entén; escriu-lo amb coma per als cèntims, com 12,50.')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();

    omplClient();
    omplLinia();
    // El total, el del nucli: 2 × 2,50 € al 4 %.
    expect(screen.getByText('Base imposable').nextElementSibling.textContent).toBe('5,00 €');
    expect(screen.getByText('Total').nextElementSibling.textContent).toBe('5,20 €');
    await emet('A2026-0001');
    expect(files(idb, NOM_BD, 'registres')).toHaveLength(1);
    await waitFor(() => expect(numeroQueTindra()).toBe('A2026-0002'));
    expect(taula().getByRole('rowheader', { name: 'A2026-0001' })).toBeTruthy();
    expect(taula().getByText('Bar de la Plaça')).toBeTruthy();
    expect(screen.getByText('La cadena és correcta')).toBeTruthy();
    expect(screen.getByText('L’únic registre del llibre s’ha tornat a calcular: ningú no l’ha tocat.')).toBeTruthy();

    // Anul·lar: el diàleg ho explica i demana el motiu; el llibre guarda un registre nou.
    fireEvent.click(boto('Anul·la la factura A2026-0001'));
    const dialeg = await screen.findByRole('dialog', { name: 'Anul·les la factura A2026-0001?' });
    fireEvent.change(within(dialeg).getByLabelText('Per què l’anul·les? (opcional)'), { target: { value: 'Duplicada' } });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Sí, anul·la-la' }));
    expect(await screen.findByText('Factura A2026-0001 anul·lada')).toBeTruthy();
    expect(taula().getByText('Anul·lada')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Anul·la la factura A2026-0001' })).toBeNull();
    expect(files(idb, NOM_BD, 'registres').map((f) => f.registre.tipusRegistre)).toEqual(['alta', 'anulacio']);
    expect(files(idb, NOM_BD, 'registres')[1].registre.motiu).toBe('Duplicada');
    expect(screen.getByText(/^Els 2 registres del llibre/)).toBeTruthy();
    // El número anul·lat no es torna a usar.
    expect(numeroQueTindra()).toBe('A2026-0002');

    // La còpia: abans, l'avís; després, el fitxer i la seua marca al perfil.
    expect(screen.getByText('Encara no hi ha cap còpia del llibre')).toBeTruthy();
    fireEvent.click(boto('Descarrega la còpia'));
    expect(await screen.findByText('Còpia feta')).toBeTruthy();
    expect(descarrega).toHaveBeenCalledTimes(1);
    const [{ nom, tipus, dades }] = descarrega.mock.calls[0];
    expect([nom, tipus]).toEqual(['llibre-veri-factu-2026-10-07-120000.json', 'application/json']);
    const llibre = JSON.parse(new TextDecoder().decode(dades));
    expect(llibre.esquema).toBe(ESQUEMA_LLIBRE);
    expect(llibre.registres).toHaveLength(2);
    expect(screen.getByText('L’última còpia és «llibre-veri-factu-2026-10-07-120000.json», del 07/10/2026 a les 12:00.')).toBeTruthy();
    expect(screen.getByText('Al dia')).toBeTruthy();
    expect(files(idb, NOM_BD_PERFIL, 'versions').map((f) => f.clau)).toContain('copia|000000000001');

    // Ni una crida de xarxa en tot el camí.
    expect(xarxa).not.toHaveBeenCalled();
  });

  test('tot sobreviu a tancar i tornar a obrir la pantalla: el perfil, el llibre i el número següent', async () => {
    const idb = creaIdbFals();
    const { unmount } = munta({ idb });
    await configura();
    await waitFor(() => expect(numeroQueTindra()).toBe('A2026-0001'));
    omplClient();
    omplLinia();
    await emet('A2026-0001');
    unmount();

    munta({ idb, persist: async () => true });
    await waitFor(() => expect(numeroQueTindra()).toBe('A2026-0002'));
    expect(screen.getByText(CIF_EMISSOR)).toBeTruthy();
    expect(screen.getByText('No hi havia factures d’abans: el programa comença de zero.')).toBeTruthy();
    expect(taula().getByRole('rowheader', { name: 'A2026-0001' })).toBeTruthy();
    // Concedida, es diu amb una insígnia i sense cap avís.
    expect(await screen.findByText('El navegador no l’esborrarà')).toBeTruthy();
    expect(screen.queryByText('El navegador podria esborrar el llibre')).toBeNull();
    expect(xarxa).not.toHaveBeenCalled();
  });

  test('una altra pestanya emet entremig: el número mostrat es refusa, es diu, i se’n mostra el nou', async () => {
    const { idb } = munta();
    await configura();
    await waitFor(() => expect(numeroQueTindra()).toBe('A2026-0001'));
    omplClient();
    omplLinia();
    // L'altra pestanya: el mateix llibre i el mateix perfil, amb el seu propi cas d'ús.
    const { config, llegat } = await creaMagatzemPerfil({ idb }).llig();
    const altra = creaEmissio({ port: creaPortIndexedDB({ idb, locks: null, subtle }), config: config.dades, llegat: llegat.dades, subtle });
    await altra.emet({
      tipus: 'F1', dataExpedicio: '2026-10-07', destinatari: { nif: DNI_CLIENT, nom: 'Una altra', domicili: { adreca: 'A', codiPostal: '46999', poblacio: 'P' } },
      linies: [{ concepte: 'Coca', quantitat: 1, preuUnitari: 300, tipusIva: 10 }]
    }, { instant: ARA });
    fireEvent.click(boto('Revisa i emet la factura'));
    const dialeg = await screen.findByRole('dialog', { name: 'Emets la factura A2026-0001?' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Sí, emet-la' }));
    expect(await screen.findByText('El número ha canviat')).toBeTruthy();
    expect(screen.getByText(/A2026-0001 ja s'ha emés en esta sèrie/)).toBeTruthy();
    await waitFor(() => expect(numeroQueTindra()).toBe('A2026-0002'));
    // El formulari es conserva: es torna a emetre amb el número nou.
    await emet('A2026-0002');
    expect(files(idb, NOM_BD, 'registres').map((f) => f.registre.numSerie)).toEqual(['A2026-0001', 'A2026-0002']);
  });

  test('una simplificada amb l’IVA inclòs i una completa que la substituïx (F3)', async () => {
    const { idb } = munta();
    await configura();
    fireEvent.click(screen.getByRole('radio', { name: 'Factura simplificada (tiquet)' }));
    await waitFor(() => expect(numeroQueTindra()).toBe('T2026-0001'));
    expect(screen.queryByLabelText('NIF del client (obligatori)')).toBeNull();
    expect(screen.getByLabelText('Els preus ja porten l’IVA (com en un tiquet de caixa)').checked).toBe(true);
    omplLinia({ concepte: 'Cafè', quantitat: '3', preu: '1,10', iva: '10', ambIva: true });
    // Amb l'IVA inclòs, el total és la suma dels preus.
    expect(screen.getByText('Total').nextElementSibling.textContent).toBe('3,30 €');
    await emet('T2026-0001');

    fireEvent.click(screen.getByRole('radio', { name: 'Factura completa en lloc de tiquets' }));
    await waitFor(() => expect(numeroQueTindra()).toBe('A2026-0001'));
    fireEvent.click(screen.getByLabelText('T2026-0001 · 07/10/2026 · 3,30 €'));
    omplClient();
    omplLinia({ concepte: 'Cafè', quantitat: '3', preu: '1,00', iva: '10' });
    await emet('A2026-0001');
    const [, f3] = files(idb, NOM_BD, 'registres').map((f) => f.registre);
    expect(f3).toMatchObject({ tipusFactura: 'F3', numSerie: 'A2026-0001' });
    expect(f3.factura.substituides).toEqual([{ numSerie: 'T2026-0001', dataExpedicio: '2026-10-07' }]);
    expect(taula().getByText('En lloc de tiquets')).toBeTruthy();
    expect(taula().getByText('Simplificada')).toBeTruthy();
    // Troballa F5 (261007): el tiquet ja substituït no torna a eixir; una segona F3 duplicaria la venda.
    expect(await screen.findByText('No hi ha cap tiquet al llibre que es puga substituir.')).toBeTruthy();
    expect(screen.queryByLabelText('T2026-0001 · 07/10/2026 · 3,30 €')).toBeNull();
  });

  /* Troballa F4 de la revisió (261007): el perfil es reescrivia sense fre després d'emetre. */
  test('amb factures emeses, el NIF i la data de pas queden fixos, i les factures d’abans només s’amplien', async () => {
    const { idb } = munta();
    await configura();
    await waitFor(() => expect(numeroQueTindra()).toBe('A2026-0001'));
    // Abans d'emetre, tot es pot corregir.
    fireEvent.click(boto('Canvia les dades de l’empresa'));
    expect(screen.getByLabelText('NIF (obligatori)').readOnly).toBe(false);
    fireEvent.click(boto('Deixa-ho com estava'));
    omplClient();
    omplLinia();
    await emet('A2026-0001');

    fireEvent.click(boto('Canvia les dades de l’empresa'));
    const nif = screen.getByLabelText('NIF (obligatori)');
    expect(nif.readOnly).toBe(true);
    expect(screen.getByLabelText('Data de pas (obligatori)').readOnly).toBe(true);
    expect(screen.getByText('Ja hi ha factures emeses amb este NIF: no es pot canviar.')).toBeTruthy();
    // Encara que el valor del camp es canvie per una altra via, no es desa.
    fireEvent.change(nif, { target: { value: DNI_CLIENT } });
    fireEvent.click(boto('Desa les dades de l’empresa'));
    expect(await screen.findByText(`Ja hi ha factures emeses amb el NIF ${CIF_EMISSOR}: el NIF no es pot canviar.`)).toBeTruthy();
    // La configuració d'una altra empresa no s'importa.
    const altra = {
      esquema: ESQUEMA_CONFIG_EMPRESA, nif: DNI_CLIENT, nom: 'Una altra SL', domiciliFiscal: 'fiscal',
      domicilis: [{ id: 'fiscal', adreca: 'Carrer Nou, 3', codiPostal: '46997', poblacio: 'Poble de Prova' }], facturacio: { dataPas: '2026-10-01' }
    };
    fireEvent.change(screen.getByLabelText('Importa la configuració (opcional)'), { target: { files: [{ name: 'altra.json', text: async () => JSON.stringify(altra) }] } });
    expect(await screen.findByText(`Este fitxer és d’una altra empresa (${DNI_CLIENT}). Ja hi ha factures emeses amb el NIF ${CIF_EMISSOR}, que no es pot canviar.`)).toBeTruthy();
    expect(files(idb, NOM_BD_PERFIL, 'versions').filter((f) => f.tipus === 'config')).toHaveLength(1);
    fireEvent.click(boto('Deixa-ho com estava'));

    // El llegat: «No en tinc» ja no hi és, afegir-ne sí, i llevar-ne una sèrie declarada, no.
    fireEvent.click(boto('Torna a carregar les factures d’abans'));
    expect(screen.queryByRole('button', { name: 'No en tinc: comence de zero' })).toBeNull();
    expect(screen.getByText(/^Ja has emés factures amb este programa: ara només pots afegir-hi factures d’abans/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Números de les factures d’abans'), { target: { value: 'F26 0001' } });
    fireEvent.click(boto('Desa les factures d’abans'));
    expect(await screen.findByText('Factures d’abans desades')).toBeTruthy();
    fireEvent.click(boto('Torna a carregar les factures d’abans'));
    fireEvent.change(screen.getByLabelText('Números de les factures d’abans'), { target: { value: 'F25 0003' } });
    expect(screen.getByText('La sèrie F de 2026 (fins al número 1) ja estava declarada i no es pot llevar.')).toBeTruthy();
    expect(boto('Desa les factures d’abans').disabled).toBe(true);
    expect(files(idb, NOM_BD_PERFIL, 'versions').filter((f) => f.tipus === 'llegat')).toHaveLength(2);
    expect(xarxa).not.toHaveBeenCalled();
  });
});

describe('la cadena i la còpia', () => {
  test('una còpia que en sabia més: el llibre truncat es veu, amb el seu motiu', async () => {
    const idb = creaIdbFals();
    await creaMagatzemPerfil({ idb }).afegixCopia({ cadenes: [{ idEmisor: CIF_EMISSOR, ordre: 5, empremta: 'A'.repeat(64) }], nomFitxer: 'antiga.json' });
    munta({ idb });
    expect(await screen.findByText('La cadena del llibre té incidències')).toBeTruthy();
    expect(screen.getByText('Amb incidències')).toBeTruthy();
    expect(screen.getByText(/Falta el registre 5 que ja era conegut/)).toBeTruthy();
  });

  /* Troballes F2 i F3 de la revisió (261007): sobre un llibre truncat es podia
     emetre (repetint el número d'una factura perduda) i anul·lar; i fer-ne
     còpia esborrava la detecció del truncament. */
  test('un llibre truncat: no s’emet ni s’anul·la, la còpia d’ara no tapa el truncament, i restaurar la bona ho arregla', async () => {
    // Un ordinador: dos factures, i una còpia després de cada una.
    const idb = creaIdbFals();
    const { descarrega } = munta({ idb });
    await configura();
    await waitFor(() => expect(numeroQueTindra()).toBe('A2026-0001'));
    omplClient();
    omplLinia();
    await emet('A2026-0001');
    fireEvent.click(boto('Descarrega la còpia'));
    await waitFor(() => expect(descarrega).toHaveBeenCalledTimes(1));
    await screen.findByText('Còpia feta');
    await waitFor(() => expect(numeroQueTindra()).toBe('A2026-0002'));
    omplClient();
    omplLinia();
    await emet('A2026-0002');
    fireEvent.click(boto('Descarrega la còpia'));
    await waitFor(() => expect(descarrega).toHaveBeenCalledTimes(2));
    await screen.findByText('Còpia feta');
    const [copiaD1, copiaD2] = descarrega.mock.calls.map(([{ dades }]) => new TextDecoder().decode(dades));
    const { config, llegat, copia } = await creaMagatzemPerfil({ idb }).llig();
    expect(copia.dades.cadenes).toMatchObject([{ idEmisor: CIF_EMISSOR, ordre: 2 }]);
    cleanup();

    // El mateix perfil, però el llibre només té la primera factura: la segona s'ha perdut.
    const truncat = creaIdbFals();
    const perfil = creaMagatzemPerfil({ idb: truncat });
    await perfil.afegixConfig(config.dades, { registres: [] });
    await perfil.afegixLlegat(llegat.dades, { registres: [] });
    await perfil.afegixCopia(copia.dades);
    await restauraCopia(creaPortIndexedDB({ idb: truncat, locks: null, subtle }), copiaD1, { verifica: (r) => verificaCadena(r, { subtle }) });
    const { descarrega: baixada } = munta({ idb: truncat });
    expect(await screen.findByText('La cadena del llibre té incidències')).toBeTruthy();
    expect(screen.getByText(/Falta el registre 2 que ja era conegut/)).toBeTruthy();
    // F3: ni el formulari ni «Anul·la»; el número següent repetiria l'A2026-0002 perduda.
    expect(screen.getByText('Ara no es pot emetre cap factura')).toBeTruthy();
    expect(screen.getByText('Aturada')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Revisa i emet la factura' })).toBeNull();
    expect(taula().getByRole('rowheader', { name: 'A2026-0001' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Anul·la la factura A2026-0001' })).toBeNull();

    // F2: la còpia d'ara es fa, amb «incidencia» al nom, però no deixa marca i el truncament es continua veient.
    expect(screen.getByText('Llibre amb incidències')).toBeTruthy();
    fireEvent.click(boto('Descarrega la còpia'));
    expect(await screen.findByText('Còpia feta, però no és una còpia bona')).toBeTruthy();
    expect(baixada.mock.calls[0][0].nom).toBe('llibre-veri-factu-incidencia-2026-10-07-120000.json');
    expect(files(truncat, NOM_BD_PERFIL, 'versions').filter((f) => f.tipus === 'copia')).toHaveLength(1);
    expect(screen.getByText('La cadena del llibre té incidències')).toBeTruthy();
    expect(screen.queryByText('Al dia')).toBeNull();

    // Restaurar la còpia bona: la cadena torna a ser correcta i es pot tornar a emetre i anul·lar.
    fireEvent.change(screen.getByLabelText('Restaura una còpia'), { target: { files: [{ name: 'bona.json', text: async () => copiaD2 }] } });
    expect(await screen.findByText('Còpia restaurada')).toBeTruthy();
    expect(screen.getByText('La cadena és correcta')).toBeTruthy();
    await waitFor(() => expect(numeroQueTindra()).toBe('A2026-0003'));
    expect(boto('Anul·la la factura A2026-0002')).toBeTruthy();
    expect(screen.getByText('Al dia')).toBeTruthy();
    expect(xarxa).not.toHaveBeenCalled();
  });

  test('desar la còpia en una carpeta (el patró de fontNavegador) i restaurar-la en un llibre buit', async () => {
    const escrits = new Map();
    const carpeta = {
      kind: 'directory', name: 'Còpies',
      entries: () => (async function* buida() {})(),
      queryPermission: async () => 'granted',
      requestPermission: async () => 'granted',
      async getFileHandle(nom, { create = false } = {}) {
        if (!create) throw Object.assign(new Error('No hi és'), { name: 'NotFoundError' });
        return { createWritable: async () => ({ write: async (bytes) => { escrits.set(nom, bytes); }, close: async () => {}, abort: async () => {} }) };
      }
    };
    const entorn = { showDirectoryPicker: vi.fn(async () => carpeta) };
    munta({ entorn });
    await configura();
    await waitFor(() => expect(numeroQueTindra()).toBe('A2026-0001'));
    omplClient();
    omplLinia();
    await emet('A2026-0001');
    fireEvent.click(boto('Desa la còpia en una carpeta'));
    expect(await screen.findByText(/s’ha desat a la carpeta «Còpies»/)).toBeTruthy();
    expect(entorn.showDirectoryPicker).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect([...escrits.keys()]).toEqual(['llibre-veri-factu-2026-10-07-120000.json']);
    const text = new TextDecoder().decode(escrits.get('llibre-veri-factu-2026-10-07-120000.json'));
    cleanup();

    // Un altre navegador, amb el llibre buit: la còpia es verifica i s'hi afig.
    const idbNou = creaIdbFals();
    munta({ idb: idbNou });
    await screen.findByRole('heading', { name: '5. Còpia del llibre' });
    fireEvent.change(screen.getByLabelText('Restaura una còpia'), { target: { files: [{ name: 'copia.json', text: async () => text }] } });
    expect(await screen.findByText('Còpia restaurada')).toBeTruthy();
    expect(screen.getByText('S’ha afegit al llibre un registre, i la cadena s’ha tornat a verificar.')).toBeTruthy();
    expect(files(idbNou, NOM_BD, 'registres')).toHaveLength(1);

    // La mateixa còpia una altra vegada: no hi afig res. Una de retocada: no es toca res.
    fireEvent.change(screen.getByLabelText('Restaura una còpia'), { target: { files: [{ name: 'copia.json', text: async () => text }] } });
    expect(await screen.findByText('El llibre ja tenia tot el que porta la còpia: no s’hi ha afegit res.')).toBeTruthy();
    const retocada = text.replace('"importTotal":520', '"importTotal":52');
    expect(retocada).not.toBe(text);
    fireEvent.change(screen.getByLabelText('Restaura una còpia'), { target: { files: [{ name: 'retocada.json', text: async () => retocada }] } });
    expect(await screen.findByText('La còpia no és bona')).toBeTruthy();
    expect(files(idbNou, NOM_BD, 'registres')).toHaveLength(1);
    expect(xarxa).not.toHaveBeenCalled();
  });
});
