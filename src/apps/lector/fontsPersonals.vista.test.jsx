/* Notícies del Poble · SN (261003) · Les fonts personals a la gestió de fonts,
   dins de la plataforma de veres (RutaApps → AppLector), amb la llavor sintètica
   i el magatzem sobre el navegador fals de P2. Les fonts s'hi posen per l'API
   pública (fontsPersonals.js), com ho fa el Snippet Curador del Bloc, o des del
   formulari «Afig una font». Adreces d'example.org: cap dada personal.
   Actualitzada a posta (261024 Lector): ordre del Mestre de les 15:05, «adeu a
   la pàgina inflada de /app/lector/fonts: les fonts viuen a l'arbre». La gestió
   de fonts ja no és la columna «Les que seguixes» (ClosaAplicacio): és l'arbre
   de l'espai de treball (cada font, amb el seu estat) i el diàleg «Gestiona les
   fonts» de la seua capçalera. Les mateixes regles (pendent, domini, carpeta,
   paperera, SN-R6, la pestanya lectora, l'altra pestanya, el servei), on viuen
   ara; la columna de reserva del focus és el primer camp d'«Afig una font». */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import { ARA, ENTORN, munta, prepara, tancats } from './__fixtures__/muntaLector.jsx';
import AppLector from './AppLector.jsx';
import { creaFontNoticies } from './fontNoticies.js';
import { creaFontsPersonals } from './fontsPersonals.js';
import { CATEGORIES_LLAVOR, FONTS_LLAVOR } from './llavor/cataleg.js';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';
import { creaMagatzemLector } from './magatzem.js';
import manifestLector from './manifest.js';
import { idFontPersonal } from './nucli/index.js';

const URL_BARRI = 'https://www.example.org/barri';
const NOM_BARRI = 'La Veu del Barri';
const mig = () => within(document.getElementById('app-grid-list'));
const detall = () => within(document.getElementById('app-grid-main'));
/* L'arbre de l'espai de treball i el diàleg de la gestió de fonts de la seua capçalera. */
const arbre = () => within(document.querySelector('#app-grid-sidebar nav.sdp-workspace-column__body'));
const filaDeLArbre = (nom) => arbre().getByRole('button', { name: new RegExp(`^${nom}(?: \\d+ sense llegir)?$`) });
async function obriGestio() {
  fireEvent.click(await screen.findByRole('button', { name: 'Gestiona les fonts' }));
  return within(await screen.findByRole('dialog', { name: 'Gestiona les fonts' }));
}
const campDeLAdreca = () => screen.getByRole('textbox', { name: /^Adreça del feed/ });
const TEXT_PENDENTS = 'Les teues fonts queden guardades en este dispositiu. El servei de notícies encara no les llig: '
  + 'les llegirà quan el servei les active.';

/* Un Lector muntat sobre un navegador fals que es pot compartir amb una
   altra «pestanya» (la del snippet) o amb una escriptora que ja hi era. */
function navegador() {
  const idb = creaIdbFals();
  const locks = creaLocksFals();
  const canal = creaCanalFals();
  const magatzem = () => {
    const nou = creaMagatzemLector({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
    tancats.push(nou);
    return nou;
  };
  const font = creaFontNoticies(creaAdaptadorLlavor({ ara: ARA }));
  const api = creaFontsPersonals({ obriMagatzem: magatzem, font: () => font });
  const entorn = (delLector = magatzem()) => {
    const App = () => <AppLector magatzem={delLector} font={font} ara={() => ARA} />;
    return { registre: creaRegistre({ internes: [{ ...manifestLector, carrega: () => Promise.resolve({ default: App }) }] }) };
  };
  return { idb, api, magatzem, entorn };
}

/* L'escriptura i els avisos són reals; només es retarda la publicació de la
   lectura. El magatzem és immutable: el delegat conserva els getters vius. */
function retardaLectures(magatzem) {
  let retardades = false;
  const pendents = [];
  const descriptors = Object.getOwnPropertyDescriptors(magatzem);
  const escriptures = vi.fn(magatzem.actualitzaPersonals);
  descriptors.actualitzaPersonals.value = escriptures;
  descriptors.llegixPersonals.value = vi.fn(async () => {
    const registre = await magatzem.llegixPersonals();
    if (!retardades) return registre;
    return new Promise((resolve) => pendents.push(() => resolve(registre)));
  });
  return {
    magatzem: Object.defineProperties({}, descriptors),
    escriptures,
    pendents,
    retarda: () => { retardades = true; },
    allibera: () => {
      retardades = false;
      while (pendents.length) pendents.shift()();
    }
  };
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('a la gestió de fonts', () => {
  test('la font afegida: pendent, a l’arbre dins de la seua carpeta i a la gestió amb el domini; cap notícia seua', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI, categoriaId: 'festes' });
    munta('/app/lector/noticies', nav.entorn());
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(arbre().getByRole('button', { name: 'Desplegar Cultura i festes' }));
    const pendent = await arbre().findByRole('button', { name: `${NOM_BARRI} · pendent` });
    expect(pendent.querySelector('svg').getAttribute('class')).toMatch(/lucide-hourglass/);
    /* Triar-la diu per què no porta res, sense cap notícia inventada. */
    fireEvent.click(pendent);
    await screen.findByRole('region', { name: NOM_BARRI });
    expect(detall().getByText('Esta font encara no es llig')).toBeTruthy();
    expect(detall().getByText(/^Queda guardada en este dispositiu\. El servei de notícies encara no llig les fonts teues/)).toBeTruthy();
    expect(mig().getByText('Esta font encara no es llig.')).toBeTruthy();
    expect(detall().getByRole('button', { name: 'Lleva la font' })).toBeTruthy();
    const gestio = await obriGestio();
    const llista = gestio.getByRole('list', { name: 'Les teues fonts' });
    const linia = within(llista).getByText(NOM_BARRI).closest('li');
    expect(within(linia).getByText('Pendent · example.org · Cultura i festes')).toBeTruthy();
    expect(gestio.getByText(TEXT_PENDENTS)).toBeTruthy();
    /* No és del catàleg: cap interruptor seu. */
    expect(gestio.queryByRole('switch', { name: NOM_BARRI })).toBeNull();
    expect(document.querySelectorAll('img')).toHaveLength(0);
  });

  test('es lleva amb la paperera (de la gestió i del detall), i ja no és al magatzem ni a l’arbre', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI });
    await nav.api.afigFontPersonal({ url: 'https://example.org/altra', nom: 'L’Altra' });
    munta('/app/lector/noticies', nav.entorn());
    await screen.findByRole('region', { name: 'Hui' });
    const gestio = await obriGestio();
    const llista = gestio.getByRole('list', { name: 'Les teues fonts' });
    expect(within(llista).getAllByText('Pendent · example.org')).toHaveLength(2);
    fireEvent.click(within(llista).getByRole('button', { name: `Lleva la font ${NOM_BARRI}` }));
    await waitFor(() => expect(within(llista).queryByText(NOM_BARRI)).toBeNull());
    expect((await nav.api.llistaFontsPersonals()).map((font) => font.nom)).toEqual(['L’Altra']);
    expect(arbre().queryByRole('button', { name: new RegExp(`^${NOM_BARRI}`) })).toBeNull();
    fireEvent.click(gestio.getByRole('button', { name: 'Tancar' }));
    /* Des del detall de la font, a l'arbre. */
    fireEvent.click(filaDeLArbre('L’Altra · pendent'));
    await screen.findByRole('region', { name: 'L’Altra' });
    fireEvent.click(detall().getByRole('button', { name: 'Lleva la font' }));
    await waitFor(async () => expect(await nav.api.llistaFontsPersonals()).toEqual([]));
    await waitFor(() => expect(arbre().queryByRole('button', { name: /^L’Altra/ })).toBeNull());
  });

  /* Correcció SN-R3 · On aterra el snippet, la font es veu sense baixar. Actualitzada a posta (261024
     Lector): el Curador ja no porta a la gestió de fonts (no és cap pàgina), sinó a la font mateixa,
     a l'arbre (fontsPersonals.js · destinacioDe): la fila triada i el seu detall. */
  test('correcció SN-R3 · on aterra el snippet (la font, a l’arbre de les notícies), es veu sense baixar', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI, categoriaId: 'festes' });
    munta(`/app/lector/noticies/festes/${idFontPersonal(URL_BARRI)}`, nav.entorn());
    await screen.findByRole('region', { name: NOM_BARRI });
    expect(filaDeLArbre(`${NOM_BARRI} · pendent`).getAttribute('aria-current')).toBe('page');
    expect(detall().getByText('Esta font encara no es llig')).toBeTruthy();
  });

  test('correcció SN-R6 · llevar-ne una porta el focus a la paperera veïna i, sense cap, al primer camp d’«Afig una font»; mai al <body>', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: 'https://example.org/una', nom: 'La Una' });
    await nav.api.afigFontPersonal({ url: 'https://example.org/dos', nom: 'La Dos' });
    munta('/app/lector/noticies', nav.entorn());
    await screen.findByRole('region', { name: 'Hui' });
    const gestio = await obriGestio();
    const llista = gestio.getByRole('list', { name: 'Les teues fonts' });
    /* La més nova davant: La Dos i, davall, La Una. */
    const primera = within(llista).getByRole('button', { name: 'Lleva la font La Dos' });
    primera.focus();
    fireEvent.click(primera);
    await waitFor(() => expect(document.activeElement).toBe(gestio.getByRole('button', { name: 'Lleva la font La Una' })));
    fireEvent.click(document.activeElement);
    await waitFor(() => expect(gestio.queryByRole('list', { name: 'Les teues fonts' })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(campDeLAdreca()));
    expect(await nav.api.llistaFontsPersonals()).toEqual([]);
  });

  test('SN-R6 · dues retirades amb la lectura pendent esperen el DOM nou abans de moure el focus', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: 'https://example.org/una', nom: 'La Una' });
    await nav.api.afigFontPersonal({ url: 'https://example.org/dos', nom: 'La Dos' });
    const retardat = retardaLectures(nav.magatzem());
    munta('/app/lector/noticies', nav.entorn(retardat.magatzem));
    await screen.findByRole('region', { name: 'Hui' });
    const gestio = await obriGestio();
    const llista = gestio.getByRole('list', { name: 'Les teues fonts' });
    const primera = within(llista).getByRole('button', { name: 'Lleva la font La Dos' });
    const segona = within(llista).getByRole('button', { name: 'Lleva la font La Una' });
    retardat.retarda();
    try {
      primera.focus();
      fireEvent.click(primera);
      await waitFor(() => expect(retardat.escriptures).toHaveBeenCalledTimes(1));
      await act(async () => { await retardat.escriptures.mock.results[0].value; });
      await waitFor(() => expect(retardat.pendents.length).toBeGreaterThan(0));
      expect(primera.isConnected).toBe(true);
      expect(document.activeElement).toBe(primera);

      /* Un segon toc real posa el focus al segon botó, encara visible. */
      segona.focus();
      fireEvent.click(segona);
      await waitFor(() => expect(retardat.escriptures).toHaveBeenCalledTimes(2));
      await act(async () => { await retardat.escriptures.mock.results[1].value; });
      expect(document.activeElement).toBe(segona);
      await act(async () => { retardat.allibera(); });
      await waitFor(() => expect(gestio.queryByRole('list', { name: 'Les teues fonts' })).toBeNull());
      expect(document.activeElement).toBe(campDeLAdreca());
      expect(await nav.api.llistaFontsPersonals()).toEqual([]);
    } finally {
      await act(async () => { retardat.allibera(); });
    }
  });

  test('SN-R6 · la lectura retardada no recupera el focus si la persona ja ha anat a un altre lloc', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI });
    const retardat = retardaLectures(nav.magatzem());
    munta('/app/lector/noticies', nav.entorn(retardat.magatzem));
    await screen.findByRole('region', { name: 'Hui' });
    const gestio = await obriGestio();
    const altre = gestio.getByRole('textbox', { name: /^Nom de la font/ });
    const llista = gestio.getByRole('list', { name: 'Les teues fonts' });
    const paperera = within(llista).getByRole('button', { name: `Lleva la font ${NOM_BARRI}` });
    retardat.retarda();
    try {
      paperera.focus();
      fireEvent.click(paperera);
      await waitFor(() => expect(retardat.escriptures).toHaveBeenCalledTimes(1));
      await act(async () => { await retardat.escriptures.mock.results[0].value; });
      await waitFor(() => expect(retardat.pendents.length).toBeGreaterThan(0));
      altre.focus();
      expect(document.activeElement).toBe(altre);
      await act(async () => { retardat.allibera(); });
      await waitFor(() => expect(gestio.queryByRole('list', { name: 'Les teues fonts' })).toBeNull());
      expect(document.activeElement).toBe(altre);
    } finally {
      await act(async () => { retardat.allibera(); });
    }
  });

  test('sense cap font personal, res de nou a la gestió ni a l’arbre', async () => {
    munta('/app/lector/noticies', prepara());
    await screen.findByRole('region', { name: 'Hui' });
    expect(arbre().queryByRole('button', { name: /· pendent$/ })).toBeNull();
    const gestio = await obriGestio();
    expect(gestio.queryByRole('list', { name: 'Les teues fonts' })).toBeNull();
    expect(gestio.queryByText('Les teues fonts')).toBeNull();
  });

  test('afegida des d’una altra pestanya (el snippet) mentre el Lector és obert: apareix sense recarregar', async () => {
    const nav = navegador();
    munta('/app/lector/noticies', nav.entorn());
    await screen.findByRole('region', { name: 'Hui' });
    const gestio = await obriGestio();
    expect(gestio.queryByRole('list', { name: 'Les teues fonts' })).toBeNull();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI });
    const llista = await gestio.findByRole('list', { name: 'Les teues fonts' });
    expect(within(llista).getByText(NOM_BARRI)).toBeTruthy();
    expect(filaDeLArbre(`${NOM_BARRI} · pendent`)).toBeTruthy();
  });

  test('en una pestanya lectora (una altra escriu) es veuen, però sense paperera ni formulari: el magatzem no hi deixa escriure', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI });
    expect(await nav.magatzem().obtinBloqueig()).toBe('escriptora');
    const delLector = nav.magatzem();
    munta('/app/lector/noticies', nav.entorn(delLector));
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(delLector.mode).toBe('lectora'));
    const gestio = await obriGestio();
    const llista = gestio.getByRole('list', { name: 'Les teues fonts' });
    await waitFor(() => expect(within(gestio.getByRole('list', { name: 'Les teues fonts' })).queryByRole('button')).toBeNull());
    expect(within(llista).getByText(NOM_BARRI)).toBeTruthy();
    expect(campDeLAdreca().disabled).toBe(true);
    expect(gestio.getByRole('button', { name: 'Afig la font' }).disabled).toBe(true);
    expect(gestio.getByText(/ací no es poden afegir ni llevar fonts/)).toBeTruthy();
  });
});

/* Codex D-06 (261024) · Afegir una font ja no depén del literal de la llavor ni del Snippet Curador:
   el formulari «Afig una font» de la gestió de l'arbre, sobre l'API de sempre (afigFontPersonal). */
describe('«Afig una font» (Codex D-06)', () => {
  test('una adreça https amb el seu nom i la seua carpeta: es desa, es diu i és a l’arbre; els camps es buiden', async () => {
    const nav = navegador();
    munta('/app/lector/noticies', nav.entorn());
    await screen.findByRole('region', { name: 'Hui' });
    const gestio = await obriGestio();
    fireEvent.change(campDeLAdreca(), { target: { value: `  ${URL_BARRI}  ` } });
    fireEvent.change(gestio.getByRole('textbox', { name: /^Nom de la font/ }), { target: { value: NOM_BARRI } });
    fireEvent.change(gestio.getByRole('combobox', { name: 'Carpeta' }), { target: { value: 'festes' } });
    expect(gestio.getAllByRole('option').map((opcio) => opcio.textContent))
      .toEqual(['Sense carpeta', 'Ajuntament i serveis', 'Cultura i festes', 'Camp i temps', 'Esports']);
    fireEvent.click(gestio.getByRole('button', { name: 'Afig la font' }));
    expect(await gestio.findByText('Font afegida')).toBeTruthy();
    expect(await nav.api.llistaFontsPersonals()).toEqual([
      expect.objectContaining({ url: URL_BARRI, nom: NOM_BARRI, categoriaId: 'festes' })
    ]);
    expect(campDeLAdreca().value).toBe('');
    expect(within(await gestio.findByRole('list', { name: 'Les teues fonts' })).getByText(NOM_BARRI)).toBeTruthy();
    fireEvent.click(arbre().getByRole('button', { name: 'Desplegar Cultura i festes' }));
    expect(filaDeLArbre(`${NOM_BARRI} · pendent`)).toBeTruthy();
  });

  test('sense nom, el del lloc web; sense https o amb usuari, el motiu al camp i res desat; repetida, el motiu del Lector', async () => {
    const nav = navegador();
    munta('/app/lector/noticies', nav.entorn());
    await screen.findByRole('region', { name: 'Hui' });
    const gestio = await obriGestio();
    const afig = () => fireEvent.click(gestio.getByRole('button', { name: 'Afig la font' }));
    /* L'adreça amb usuari es compon a trossos: la porta de dades sintètiques la llegiria com un correu. */
    const ambUsuari = ['https://usuari:clau', 'example.org/feed'].join('@');
    for (const dolenta of ['', 'http://example.org/vell', ambUsuari, 'no és cap adreça']) {
      fireEvent.change(campDeLAdreca(), { target: { value: dolenta } });
      afig();
      expect(await gestio.findByText(dolenta === '' ? 'Falta l’adreça de la font.' : /^Només es poden afegir adreces web segures \(https\)/)).toBeTruthy();
      expect(campDeLAdreca().getAttribute('aria-invalid')).toBe('true');
      await waitFor(() => expect(document.activeElement).toBe(campDeLAdreca()));
    }
    expect(await nav.api.llistaFontsPersonals()).toEqual([]);
    fireEvent.change(campDeLAdreca(), { target: { value: URL_BARRI } });
    afig();
    expect(await gestio.findByText('Font afegida')).toBeTruthy();
    expect((await nav.api.llistaFontsPersonals()).map((font) => [font.nom, font.categoriaId])).toEqual([['example.org', null]]);
    fireEvent.change(campDeLAdreca(), { target: { value: URL_BARRI } });
    afig();
    expect(await gestio.findByText('Esta font ja és al teu Lector.')).toBeTruthy();
    expect(gestio.getByText('La font no s’ha afegit')).toBeTruthy();
    expect(await nav.api.llistaFontsPersonals()).toHaveLength(1);
  });
});

describe('la destinació d’enllaços que exporta el mòdul de l’app', () => {
  /* Ordre del Mestre, 261016 (prompt 261016_0015, Bloc 0, «Purga de Mocks») · Actualitzada a posta:
     abans n'hi havia amb el servidor de desenvolupament tot sol (la llavor s'hi encenia). Ara la
     llavor, i amb ella la destinació, només amb el literal EXACTE. */
  test('amb el literal de la llavor (VITE_SDP_LECTOR_LLAVOR=1): la forma de la plataforma, sense obrir res en carregar-se', async () => {
    vi.stubEnv('VITE_SDP_LECTOR_LLAVOR', '1');
    vi.resetModules();
    try {
      const { destinacioEnllac } = await import('./AppLector.jsx');
      expect(destinacioEnllac).not.toBeNull();
      expect(destinacioEnllac.nomMaxim).toBe(80);
      expect(typeof destinacioEnllac.categories).toBe('function');
      expect(typeof destinacioEnllac.afig).toBe('function');
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  /* La conseqüència al Snippet Curador: en desenvolupament sense el literal no hi ha port, i el
     Curador oferix només el Bloc (correcció SN-R1, NotesSection.lector.test.jsx). Una font personal
     desada sense port no es veuria enlloc: la gestió de fonts, sense port, és l'estat buit. */
  test('en desenvolupament sense el literal (Purga de Mocks, 261016): cap destinació', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_SDP_LECTOR_LLAVOR', '');
    vi.resetModules();
    try {
      const { destinacioEnllac } = await import('./AppLector.jsx');
      expect(destinacioEnllac).toBeNull();
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  test('sense port ni llavor (producció): cap destinació', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_SDP_LECTOR_LLAVOR', '0');
    vi.resetModules();
    try {
      const { destinacioEnllac } = await import('./AppLector.jsx');
      expect(destinacioEnllac).toBeNull();
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});

/* T5b (ordre del Mestre, 261024) · Amb el servei de notícies (el port de la plataforma, com en
   producció: AppLector sense prop `font`): les fonts del sistema se seguixen totes i cada una es pot
   apagar (es desa i ja no es demana); les fonts personals es lligen pel MATEIX servei
   (feedPersonal), mai pel navegador, i la gestió de fonts ho diu. Un servei fals servix els feeds
   de la llavor (adreces d'example.org).
   Actualitzada a posta (261024 Lector): la gestió és l'arbre i el seu diàleg (ordre del Mestre de
   les 15:05); el text del servei diu el que de veres en sap (correcció R5-04); i, amb les personals
   apagades al servei (estat().personals false, 'personals-off'), queden pendents, guardades ací. */
describe('pel servei de notícies (T5b)', () => {
  const XML = Object.fromEntries(FONTS_LLAVOR.map((font) => [font.id, font.xml]));
  const CATALEG = Object.freeze({
    categories: CATEGORIES_LLAVOR,
    fonts: FONTS_LLAVOR.map(({ id, nom, categoriaId, descripcio }) => ({ id, nom, categoriaId, descripcio, lloc: null }))
  });
  const COOPERATIVA = 'Cooperativa de l’Horta Vella';

  function delServei({ ambPersonals = true, estat = null } = {}) {
    const nav = navegador();
    const servei = {
      fonts: vi.fn(async () => CATALEG),
      feed: vi.fn(async (id) => ({ font: id, xml: XML[id], obtingut: null, obsoleta: false })),
      ...(ambPersonals ? {
        feedPersonal: vi.fn(async (url) => {
          if (estat?.personals === false) throw Object.assign(new Error('apagades'), { motiu: 'personals-off' });
          return { url, xml: XML.pregoner, obtingut: null, obsoleta: false };
        })
      } : {}),
      ...(estat ? { estat: vi.fn(async () => estat) } : {})
    };
    const obri = (url) => {
      const delLector = nav.magatzem();
      const App = () => <AppLector magatzem={delLector} ara={() => ARA} />;
      const registre = creaRegistre({ internes: [{ ...manifestLector, carrega: () => Promise.resolve({ default: App }) }] });
      muntaPlataforma(url, { registre, entorn: { ...ENTORN, serveis: { noticies: servei } } });
      return delLector;
    };
    return { nav, servei, obri };
  }

  test('una font personal es llig pel servei amb la seua adreça, és a l’arbre i la gestió ho diu; mai al catàleg', async () => {
    const { nav, servei, obri } = delServei();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI, categoriaId: 'festes' });
    obri('/app/lector/noticies/festes');
    /* La carpeta de la seua categoria la porta, amb les seues notícies sense llegir. */
    fireEvent.click(await screen.findByRole('button', { name: 'Desplegar Cultura i festes' }));
    expect(await arbre().findByRole('button', { name: new RegExp(`^${NOM_BARRI} \\d+ sense llegir$`) })).toBeTruthy();
    expect(servei.feedPersonal.mock.calls.map(([url]) => url)).toEqual([URL_BARRI]);
    expect(servei.feed.mock.calls.map(([id]) => id)).toEqual(FONTS_LLAVOR.map((font) => font.id));
    const gestio = await obriGestio();
    const llista = gestio.getByRole('list', { name: 'Les teues fonts' });
    expect(within(within(llista).getByText(NOM_BARRI).closest('li')).getByText('example.org · Cultura i festes')).toBeTruthy();
    /* Correcció R5-04 · Qui la llig i què en sap, sense prometre el que no és. */
    expect(gestio.getByText(/^Les teues fonts també les llig el servei de notícies\./)).toBeTruthy();
    expect(gestio.getByText(/des de quina connexió \(l’adreça IP\), però no qui eres/)).toBeTruthy();
    expect(gestio.getByText(/pot quedar als registres del servidor/)).toBeTruthy();
    expect(gestio.getByText(/^Les fonts les llig el servei de notícies, no este dispositiu/)).toBeTruthy();
    expect(gestio.queryByText(/uns minuts|empremta/)).toBeNull();
    expect(gestio.queryByText(/Pendent/)).toBeNull();
    /* No és del catàleg: cap interruptor seu. */
    expect(gestio.queryByRole('switch', { name: NOM_BARRI })).toBeNull();
    expect(document.querySelectorAll('img')).toHaveLength(0);
  });

  test('llevar-ne una: desapareix de l’arbre i ja no es demana', async () => {
    const { nav, servei, obri } = delServei();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI });
    obri('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(servei.feedPersonal).toHaveBeenCalledTimes(1));
    const gestio = await obriGestio();
    const llista = gestio.getByRole('list', { name: 'Les teues fonts' });
    fireEvent.click(within(llista).getByRole('button', { name: `Lleva la font ${NOM_BARRI}` }));
    await waitFor(() => expect(gestio.queryByRole('list', { name: 'Les teues fonts' })).toBeNull());
    expect(await nav.api.llistaFontsPersonals()).toEqual([]);
    cleanup();
    servei.feedPersonal.mockClear();
    obri('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(servei.feed).toHaveBeenCalledTimes(FONTS_LLAVOR.length * 2));
    expect(arbre().queryByRole('button', { name: new RegExp(`^${NOM_BARRI}`) })).toBeNull();
    expect(servei.feedPersonal).not.toHaveBeenCalled();
  });

  test('les fonts del sistema, totes seguides; apagar-ne una es desa, no es torna a demanar i, en tornar, tampoc; encendre-la només demana eixa', async () => {
    const { nav, servei, obri } = delServei();
    obri('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(servei.feed).toHaveBeenCalledTimes(FONTS_LLAVOR.length));
    let gestio = await obriGestio();
    for (const font of FONTS_LLAVOR) expect(gestio.getByRole('switch', { name: font.nom }).getAttribute('aria-checked'), font.id).toBe('true');
    fireEvent.click(gestio.getByRole('switch', { name: COOPERATIVA }));
    expect(gestio.getByRole('switch', { name: COOPERATIVA }).getAttribute('aria-checked')).toBe('false');
    await waitFor(async () => expect((await nav.magatzem().llegix()).noSeguides).toEqual(['cooperativa']));
    /* La ronda nova (sense «carregant») ho troba tot a la memòria: cap petició més. */
    await act(async () => { await new Promise((resol) => { setTimeout(resol, 20); }); });
    expect(servei.feed).toHaveBeenCalledTimes(FONTS_LLAVOR.length);
    cleanup();
    servei.feed.mockClear();
    obri('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(servei.feed).toHaveBeenCalledTimes(FONTS_LLAVOR.length - 1));
    expect(servei.feed.mock.calls.map(([id]) => id)).not.toContain('cooperativa');
    gestio = await obriGestio();
    expect(gestio.getByRole('switch', { name: COOPERATIVA }).getAttribute('aria-checked')).toBe('false');
    fireEvent.click(gestio.getByRole('switch', { name: COOPERATIVA }));
    await waitFor(() => expect(servei.feed).toHaveBeenCalledTimes(FONTS_LLAVOR.length));
    expect(servei.feed.mock.calls.at(-1)[0]).toBe('cooperativa');
  });

  test('un servei que no llig fonts personals (sense feedPersonal): queden pendents, guardades ací', async () => {
    const { nav, obri } = delServei({ ambPersonals: false });
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI, categoriaId: 'festes' });
    obri('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const gestio = await obriGestio();
    const llista = gestio.getByRole('list', { name: 'Les teues fonts' });
    expect(within(llista).getByText('Pendent · example.org · Cultura i festes')).toBeTruthy();
    expect(gestio.getByText(TEXT_PENDENTS)).toBeTruthy();
  });

  /* Actualitzada a posta (261024 Lector final): correcció L-07. Amb les personals apagades, l'estat no
     és encara el definitiu i es torna a llegir en acabar la ronda: dues consultes (muntar i la ronda),
     exactes, i cap més en obrir la gestió. */
  test('interfície amb el servei · amb les personals apagades al servei: pendents, sense cap avís de caiguda, i el text ho diu', async () => {
    const { nav, servei, obri } = delServei({ estat: { disponible: true, personals: false } });
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI, categoriaId: 'festes' });
    obri('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    await waitFor(() => expect(servei.estat).toHaveBeenCalledTimes(2));
    fireEvent.click(arbre().getByRole('button', { name: 'Desplegar Cultura i festes' }));
    expect(await arbre().findByRole('button', { name: `${NOM_BARRI} · pendent` })).toBeTruthy();
    expect(screen.queryByText('Alguna font no ha contestat')).toBeNull();
    const gestio = await obriGestio();
    expect(gestio.getByText(TEXT_PENDENTS)).toBeTruthy();
    expect(gestio.queryByText(/també les llig el servei/)).toBeNull();
    expect(servei.estat).toHaveBeenCalledTimes(2);
  });

  test('una adreça sense https: la gestió diu que no es pot llegir', async () => {
    const { nav, obri } = delServei();
    await nav.api.afigFontPersonal({ url: 'http://example.org/vell', nom: 'El Vell' });
    obri('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const gestio = await obriGestio();
    const llista = gestio.getByRole('list', { name: 'Les teues fonts' });
    expect(within(llista).getByText('Sense https: no es pot llegir · example.org')).toBeTruthy();
  });

  test('Codex D-06 · en producció (el port del servei, sense llavor): «Afig una font» la desa i el servei la llig', async () => {
    const { nav, servei, obri } = delServei();
    obri('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(servei.feed).toHaveBeenCalledTimes(FONTS_LLAVOR.length));
    expect(servei.feedPersonal).not.toHaveBeenCalled();
    const gestio = await obriGestio();
    fireEvent.change(campDeLAdreca(), { target: { value: URL_BARRI } });
    fireEvent.change(gestio.getByRole('textbox', { name: /^Nom de la font/ }), { target: { value: NOM_BARRI } });
    fireEvent.click(gestio.getByRole('button', { name: 'Afig la font' }));
    expect(await gestio.findByText(`«${NOM_BARRI}» ja és a l’arbre.`)).toBeTruthy();
    await waitFor(() => expect(servei.feedPersonal.mock.calls.map(([url]) => url)).toEqual([URL_BARRI]));
    expect(await arbre().findByRole('button', { name: new RegExp(`^${NOM_BARRI}(?: \\d+ sense llegir)?$`) })).toBeTruthy();
    expect(await nav.api.llistaFontsPersonals()).toEqual([expect.objectContaining({ url: URL_BARRI, nom: NOM_BARRI })]);
  });
});
