/* Notícies del Poble · SN (261003) · Les fonts personals a la gestió de fonts,
   dins de la plataforma de veres (RutaApps → AppLector → ClosaAplicacio), amb
   la llavor sintètica i el magatzem sobre el navegador fals de P2. Les fonts
   s'hi posen per l'API pública (fontsPersonals.js), com ho fa el Snippet
   Curador del Bloc. Adreces d'example.org: cap dada personal. */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import { ARA, munta, prepara, tancats } from './__fixtures__/muntaLector.jsx';
import AppLector from './AppLector.jsx';
import { creaFontNoticies } from './fontNoticies.js';
import { creaFontsPersonals } from './fontsPersonals.js';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';
import { creaMagatzemLector } from './magatzem.js';
import manifestLector from './manifest.js';

const URL_BARRI = 'https://www.example.org/barri';
const NOM_BARRI = 'La Veu del Barri';
const mig = () => within(document.getElementById('app-grid-list'));
const detall = () => within(document.getElementById('app-grid-main'));

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
  test('la font afegida: pendent del connector, amb el domini i la categoria, i cap notícia seua', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI, categoriaId: 'festes' });
    munta('/app/lector/fonts', nav.entorn());
    await screen.findByRole('region', { name: 'Fonts del poble' });
    const llista = await mig().findByRole('list', { name: 'Les teues fonts' });
    const linia = within(llista).getByText(NOM_BARRI).closest('li');
    expect(within(linia).getByText('Pendent del connector · example.org · Cultura i festes')).toBeTruthy();
    expect(mig().getByText(/L’app no baixa res per ella mateixa/)).toBeTruthy();
    /* Cap article seu: no és al catàleg del poble ni entre les seguides (el port no la servix). */
    expect(detall().queryByText(NOM_BARRI)).toBeNull();
    expect(mig().queryByRole('link', { name: new RegExp(NOM_BARRI) })).toBeNull();
    expect(document.querySelectorAll('img')).toHaveLength(0);
  });

  test('es lleva amb la paperera, i ja no és al magatzem', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI });
    munta('/app/lector/fonts', nav.entorn());
    await screen.findByRole('region', { name: 'Fonts del poble' });
    const llista = await mig().findByRole('list', { name: 'Les teues fonts' });
    expect(within(llista).getByText('Pendent del connector · example.org')).toBeTruthy();
    fireEvent.click(within(llista).getByRole('button', { name: `Lleva la font ${NOM_BARRI}` }));
    await waitFor(() => expect(mig().queryByRole('list', { name: 'Les teues fonts' })).toBeNull());
    expect(await nav.api.llistaFontsPersonals()).toEqual([]);
  });

  test('correcció SN-R3 · van davant de les seguides del poble: on aterra el snippet, es veuen sense baixar', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI });
    munta('/app/lector/fonts/colleccio', nav.entorn());
    await screen.findByRole('region', { name: 'Fonts del poble' });
    const personals = await mig().findByRole('list', { name: 'Les teues fonts' });
    /* Derogat per l'ordre del Mestre, 261004 (integració final, arreglo 6) · Les seguides ja no són
       una llista de TargetesColleccions: són UniversalCard en la graella de Pedra Seca (un grup amb
       nom, GraellaTargetes). L'ordre que es comprova és el mateix. */
    const seguides = mig().getByRole('group', { name: 'Les que seguixes' });
    expect(within(seguides).getAllByRole('link').length).toBeGreaterThan(0);
    expect(personals.compareDocumentPosition(seguides) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(mig().getByText('Les teues fonts').compareDocumentPosition(seguides) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('correcció SN-R6 · llevar-ne una porta el focus a la paperera veïna i, sense cap, a la columna; mai al <body>', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: 'https://example.org/una', nom: 'La Una' });
    await nav.api.afigFontPersonal({ url: 'https://example.org/dos', nom: 'La Dos' });
    munta('/app/lector/fonts', nav.entorn());
    await screen.findByRole('region', { name: 'Fonts del poble' });
    const llista = await mig().findByRole('list', { name: 'Les teues fonts' });
    /* La més nova davant: La Dos i, davall, La Una. */
    const primera = within(llista).getByRole('button', { name: 'Lleva la font La Dos' });
    primera.focus();
    fireEvent.click(primera);
    await waitFor(() => expect(document.activeElement).toBe(mig().getByRole('button', { name: 'Lleva la font La Una' })));
    fireEvent.click(document.activeElement);
    await waitFor(() => expect(mig().queryByRole('list', { name: 'Les teues fonts' })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(mig().getByRole('region', { name: 'Les que seguixes' })));
    expect(await nav.api.llistaFontsPersonals()).toEqual([]);
  });

  test('SN-R6 · dues retirades amb la lectura pendent esperen el DOM nou abans de moure el focus', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: 'https://example.org/una', nom: 'La Una' });
    await nav.api.afigFontPersonal({ url: 'https://example.org/dos', nom: 'La Dos' });
    const retardat = retardaLectures(nav.magatzem());
    munta('/app/lector/fonts', nav.entorn(retardat.magatzem));
    await screen.findByRole('region', { name: 'Fonts del poble' });
    const llista = await mig().findByRole('list', { name: 'Les teues fonts' });
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
      await waitFor(() => expect(mig().queryByRole('list', { name: 'Les teues fonts' })).toBeNull());
      expect(document.activeElement).toBe(mig().getByRole('region', { name: 'Les que seguixes' }));
      expect(await nav.api.llistaFontsPersonals()).toEqual([]);
    } finally {
      await act(async () => { retardat.allibera(); });
    }
  });

  test('SN-R6 · la lectura retardada no recupera el focus si la persona ja ha canviat de columna', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI });
    const retardat = retardaLectures(nav.magatzem());
    munta('/app/lector/fonts', nav.entorn(retardat.magatzem));
    const altraColumna = await screen.findByRole('region', { name: 'Fonts del poble' });
    const llista = await mig().findByRole('list', { name: 'Les teues fonts' });
    const paperera = within(llista).getByRole('button', { name: `Lleva la font ${NOM_BARRI}` });
    retardat.retarda();
    try {
      paperera.focus();
      fireEvent.click(paperera);
      await waitFor(() => expect(retardat.escriptures).toHaveBeenCalledTimes(1));
      await act(async () => { await retardat.escriptures.mock.results[0].value; });
      await waitFor(() => expect(retardat.pendents.length).toBeGreaterThan(0));
      altraColumna.focus();
      expect(document.activeElement).toBe(altraColumna);
      await act(async () => { retardat.allibera(); });
      await waitFor(() => expect(mig().queryByRole('list', { name: 'Les teues fonts' })).toBeNull());
      expect(document.activeElement).toBe(altraColumna);
    } finally {
      await act(async () => { retardat.allibera(); });
    }
  });

  test('sense cap font personal, res de nou a la columna', async () => {
    munta('/app/lector/fonts', prepara());
    await screen.findByRole('region', { name: 'Fonts del poble' });
    expect(mig().queryByRole('list', { name: 'Les teues fonts' })).toBeNull();
    expect(mig().queryByText('Les teues fonts')).toBeNull();
  });

  test('afegida des d’una altra pestanya (el snippet) mentre el Lector és obert: apareix sense recarregar', async () => {
    const nav = navegador();
    munta('/app/lector/fonts', nav.entorn());
    await screen.findByRole('region', { name: 'Fonts del poble' });
    expect(mig().queryByRole('list', { name: 'Les teues fonts' })).toBeNull();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI });
    const llista = await mig().findByRole('list', { name: 'Les teues fonts' });
    expect(within(llista).getByText(NOM_BARRI)).toBeTruthy();
  });

  test('en una pestanya lectora (una altra escriu) es veuen, però sense paperera: el magatzem no hi deixa escriure', async () => {
    const nav = navegador();
    await nav.api.afigFontPersonal({ url: URL_BARRI, nom: NOM_BARRI });
    expect(await nav.magatzem().obtinBloqueig()).toBe('escriptora');
    const delLector = nav.magatzem();
    munta('/app/lector/fonts', nav.entorn(delLector));
    await screen.findByRole('region', { name: 'Fonts del poble' });
    const llista = await mig().findByRole('list', { name: 'Les teues fonts' });
    await waitFor(() => expect(delLector.mode).toBe('lectora'));
    await waitFor(() => expect(within(mig().getByRole('list', { name: 'Les teues fonts' })).queryByRole('button')).toBeNull());
    expect(within(llista).getByText(NOM_BARRI)).toBeTruthy();
  });
});

describe('la destinació d’enllaços que exporta el mòdul de l’app', () => {
  test('amb la llavor (desenvolupament): la forma de la plataforma, sense obrir res en carregar-se', async () => {
    const { destinacioEnllac } = await import('./AppLector.jsx');
    expect(destinacioEnllac).not.toBeNull();
    expect(destinacioEnllac.nomMaxim).toBe(80);
    expect(typeof destinacioEnllac.categories).toBe('function');
    expect(typeof destinacioEnllac.afig).toBe('function');
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
