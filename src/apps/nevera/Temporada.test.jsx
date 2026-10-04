/* La Nevera de Casa · l'entrada Temporada (decisió 1 del Mestre, 261003): la
   llista de la compra creuada amb el calendari agrícola, dins de la
   plataforma de veres (RutaApps → AppNevera → ClosaAplicacio → AppGridShell)
   i amb el magatzem sobre el navegador fals de P2, com AppNevera.test.jsx.
   El mes va fix a la URL (?mes=); el mes d'ara només on la prova ho diu, i
   els camins que l'esperen es calculen (el mes d'ara no s'escriu a la URL).
   Dades sintètiques: articles de base i propis; els productes de botiga es
   prenen d'ARTICLES_PRODUCTES, mai escrits a mà. */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { estatTemporada, temporadaDe } from '../../utils/temporada/index.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import AppNevera from './AppNevera.jsx';
import { NOM_BASE, STORE, creaMagatzemNevera } from './magatzem.js';
import manifestNevera from './manifest.js';
import { ARTICLES_BASE, ARTICLES_PRODUCTES, afig, afigPerNom, estatInicial } from './nucli/index.js';
import { mesVei, nomDelMes, titolDeTemporada } from './vistes/perTemporada.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const tancats = [];

/* Ordre del Mestre, 261004 (verificació «lector-nevera», D1) · autoriaDe de la plataforma
   pot tornar null (una identitat que no coneix). Hui el padró pilot sempre la resol, així
   que la prova de la guarda força el null ací, sense tocar el padró; la resta de proves
   veuen l'autoria de veres. */
const autoriaForcada = vi.hoisted(() => ({ nulla: false }));
vi.mock('./vistes/autoria.js', async (original) => {
  const real = await original();
  return { ...real, autoriaDArticle: (article) => (autoriaForcada.nulla ? null : real.autoriaDArticle(article)) };
});

/* Un navegador fals (compartible amb una altra «pestanya») i l'app registrada
   amb el seu magatzem; `estat`, el que ja hi ha al disc. */
async function prepara(estat = null, { idb = creaIdbFals(), locks = creaLocksFals(), canal = creaCanalFals() } = {}) {
  const magatzem = creaMagatzemNevera({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
  tancats.push(magatzem);
  if (estat) await magatzem.desa(estat);
  const App = () => <AppNevera magatzem={magatzem} descarrega={vi.fn()} />;
  const registre = creaRegistre({ internes: [{ ...manifestNevera, carrega: () => Promise.resolve({ default: App }) }] });
  return { idb, registre };
}

const munta = (url, entorn) => {
  muntaPlataforma(url, { registre: entorn.registre, entorn: ENTORN });
  return entorn;
};
const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
const columna = (id) => within(document.getElementById(id));
const mig = () => columna('app-grid-list');
const detall = () => columna('app-grid-main');
const closca = () => document.querySelector('.app-grid-shell');
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const desat = (idb) => idb.files(NOM_BASE, STORE)[0];
const liniesDesades = (idb) => desat(idb)?.llistes.find((l) => l.id === 'casa')?.linies.map((l) => l.articleId);
const espera = (ms) => act(() => new Promise((resolve) => { setTimeout(resolve, ms); }));
const titols = (columnaDe) => columnaDe().getAllByRole('heading', { level: 3 }).map((titol) => titol.textContent);
/* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, «no inventar targetes») · Les
   rajoles ja són UniversalCard dins de GraellaTargetes: cada secció és una regió amb el nom de la
   capçalera («Plena temporada 2 articles») i l'element principal de cada targeta porta data-element. */
const seccio = (columnaDe, grup) => columnaDe().getByRole('region', { name: new RegExp(`^${grup} \\d+ articles?$`) });
/* Els articles d'una secció de la graella, en ordre. */
const delGrup = (columnaDe, grup) => [...seccio(columnaDe, grup).querySelectorAll('button[data-element]')].map((b) => b.dataset.element);
const mesDAra = () => new Date().getMonth() + 1;
/* El camí de la Temporada de «Casa» en un mes: el mes d'ara no s'escriu. */
const cami = (mes) => `/app/nevera/temporada/casa${mes === mesDAra() ? '' : `?mes=${mes}`}`;

/* La llista «casa» amb estos articles, en este ordre d'arribada. */
const ambLinies = (ids) => ids.reduce((estat, id) => afig(estat, 'casa', id), estatInicial());
/* A l'agost (calendari de src/utils/temporada): tomaques i alls en plena, pomes
   comença, creïlles s'acaba, maduixes i taronges fora; plàtans i llet, sense dada. */
const LLISTA_AGOST = ['tomaques', 'maduixes', 'alls', 'pomes', 'creilles', 'taronges', 'platans', 'llet'];
const REGIO = '«Casa» per temporada';

/* Dos productes de botiga de «Fruita i verdura»: un que el calendari diu en
   plena a l'agost i un que no coneix. La rajola del detall del primer és la
   del seu producte del calendari (l'article de base de la mateixa clau, si n'hi ha). */
const FRESCOS = ARTICLES_PRODUCTES.filter((producte) => producte.categoriaId === 'fruita-verdura');
const FRESC_DE_TEMPORADA = FRESCOS.find((producte) => estatTemporada(producte.nom, 8) === 'plena');
const FRESC_SENSE_DADA = FRESCOS.find((producte) => !temporadaDe(producte.nom));
const RAJOLA_DEL_FRESC = (() => {
  const temporada = FRESC_DE_TEMPORADA ? temporadaDe(FRESC_DE_TEMPORADA.nom) : null;
  return temporada ? ARTICLES_BASE.find((article) => article.id === temporada.clau)?.nom ?? temporada.nom : null;
})();

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  ambAmplada(1400);
});

afterEach(() => {
  cleanup();
  autoriaForcada.nulla = false;
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('La llista per temporada (el mig)', () => {
  test('les línies s’agrupen per l’estat de temporada del mes de la URL; el detall diu el mateix mes', async () => {
    munta('/app/nevera/temporada/casa?mes=8', await prepara(ambLinies(LLISTA_AGOST)));
    await screen.findByRole('region', { name: REGIO });
    expect(titols(mig)).toEqual([
      'Plena temporada 2 articles', 'Comença la temporada 1 article', 'S’acaba la temporada 1 article',
      'Fora de temporada 2 articles', 'Sense dada de temporada 2 articles'
    ]);
    expect(delGrup(mig, 'Plena temporada')).toEqual(['tomaques', 'alls']);
    expect(delGrup(mig, 'Comença la temporada')).toEqual(['pomes']);
    expect(delGrup(mig, 'S’acaba la temporada')).toEqual(['creilles']);
    expect(delGrup(mig, 'Fora de temporada')).toEqual(['maduixes', 'taronges']);
    expect(delGrup(mig, 'Sense dada de temporada')).toEqual(['platans', 'llet']);
    /* Tot el que hi ha al mig és per comprar, com a La compra: ho diuen aria-pressed i el text d'estat. */
    const rajoles = mig().getAllByRole('button').filter((boto) => boto.dataset.element);
    expect(rajoles).toHaveLength(LLISTA_AGOST.length);
    expect(rajoles.every((rajola) => rajola.getAttribute('aria-pressed') === 'true')).toBe(true);
    expect(mig().getAllByText('Per comprar')).toHaveLength(LLISTA_AGOST.length);
    expect(mig().getByText('Agost')).toBeTruthy();
    expect(mig().getByRole('group', { name: 'Filtre' })).toBeTruthy();
    expect(within(mig().getByRole('group', { name: 'Filtre' })).getByRole('button', { name: 'Tot' }).getAttribute('aria-pressed')).toBe('true');
    /* El detall: el que és de temporada a l'agost, amb les tres seccions de temporada del mig. */
    expect(screen.getByRole('region', { name: 'De temporada a l’agost' })).toBeTruthy();
    expect(titols(detall).map((titol) => titol.replace(/ \d+ articles?$/, ''))).toEqual(['Plena temporada', 'Comença la temporada', 'S’acaba la temporada']);
    expect(within(seccio(detall, 'S’acaba la temporada')).getByRole('button', { name: 'Creïlles' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('separator', { name: 'Redimensionar La llista per temporada' })).toBeTruthy();
  });

  /* Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») · La graella solta del mig
     ja és de UniversalCard, com les de l'esquelet. */
  test('cada línia del mig és una UniversalCard: la icona de la secció de temporada al quadrat, «Per comprar» en etiqueta i el peu sense Compartir', async () => {
    munta('/app/nevera/temporada/casa?mes=8', await prepara(ambLinies(['tomaques'])));
    await screen.findByRole('region', { name: REGIO });
    const targeta = within(seccio(mig, 'Plena temporada')).getByRole('button', { name: 'Tomaques' }).closest('article.sp-card');
    expect(targeta.querySelector('.sp-card-calendar-badge').getAttribute('aria-label')).toBe('Plena temporada');
    expect(targeta.querySelector('.sp-card-calendar-badge svg[aria-hidden="true"]')).not.toBeNull();
    expect(targeta.querySelector('.sp-card-title').tagName).toBe('H4');
    expect(within(targeta).getByText('Per comprar').className).toBe('sp-card-label sdp-badge-tag');
    expect([...targeta.querySelectorAll('footer button')].map((b) => b.getAttribute('aria-label')))
      .toEqual(['Traduir Tomaques', 'Comentar Tomaques', 'Connectar amb Tomaques']);
    expect(document.querySelector('#app-grid-list .sdp-graella-articles, #app-grid-list .sdp-rajola')).toBeNull();
  });

  test('el filtre «De temporada» amaga Fora i Sense dada (a la URL); «Tot» ho torna', async () => {
    munta('/app/nevera/temporada/casa?mes=8', await prepara(ambLinies(LLISTA_AGOST)));
    await screen.findByRole('region', { name: REGIO });
    const filtre = () => within(mig().getByRole('group', { name: 'Filtre' }));
    fireEvent.click(filtre().getByRole('button', { name: 'De temporada' }));
    expect(ubicacio()).toBe('/app/nevera/temporada/casa?mes=8&filtre=temporada');
    expect(titols(mig)).toEqual(['Plena temporada 2 articles', 'Comença la temporada 1 article', 'S’acaba la temporada 1 article']);
    for (const nom of ['Maduixes', 'Taronges', 'Plàtans', 'Llet']) expect(mig().queryByRole('button', { name: nom }), nom).toBeNull();
    expect(filtre().getByRole('button', { name: 'De temporada' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(filtre().getByRole('button', { name: 'Tot' }));
    expect(ubicacio()).toBe('/app/nevera/temporada/casa?mes=8');
    expect(titols(mig)).toHaveLength(5);
  });

  test('la llista buida i el filtre que no deixa res ho diuen amb paraules', async () => {
    munta('/app/nevera/temporada/casa?mes=8', await prepara());
    expect(await screen.findByText('La llista és buida')).toBeTruthy();
    cleanup();
    munta('/app/nevera/temporada/casa?mes=8&filtre=temporada', await prepara(ambLinies(['maduixes', 'llet'])));
    expect(await screen.findByText('Res de temporada a la llista')).toBeTruthy();
    expect(mig().queryByRole('button', { name: 'Maduixes' })).toBeNull();
  });

  test('la navegació de mes fa la volta de l’any (push) i reagrupa; «Este mes» torna al d’ara', async () => {
    munta('/app/nevera/temporada/casa?mes=1', await prepara(ambLinies(['maduixes'])));
    await screen.findByRole('region', { name: REGIO });
    expect(mig().getByText('Gener')).toBeTruthy();
    expect(titols(mig)).toEqual(['Comença la temporada 1 article']);
    fireEvent.click(mig().getByRole('button', { name: 'Mes anterior' }));
    expect(ubicacio()).toBe(cami(12));
    expect(mig().getByText('Desembre')).toBeTruthy();
    expect(titols(mig)).toEqual(['Fora de temporada 1 article']);
    expect(screen.getByRole('region', { name: 'De temporada al desembre' })).toBeTruthy();
    fireEvent.click(mig().getByRole('button', { name: 'Mes següent' }));
    expect(ubicacio()).toBe(cami(1));
    expect(screen.getByRole('region', { name: 'De temporada al gener' })).toBeTruthy();
    /* Arrere torna al mes d'abans. */
    await act(async () => { window.history.back(); });
    await waitFor(() => expect(ubicacio()).toBe(cami(12)));
    fireEvent.click(mig().getByRole('button', { name: 'Este mes' }));
    expect(ubicacio()).toBe('/app/nevera/temporada/casa');
    expect(mig().getByText(nomDelMes(mesDAra()))).toBeTruthy();
  });

  test('el mes d’ara no s’escriu: les fletxes hi tornen sense ?mes, i «Este mes» no navega si ja es veu', async () => {
    const ara = mesDAra();
    munta(`/app/nevera/temporada/casa?mes=${mesVei(ara, -1)}&filtre=temporada`, await prepara());
    await screen.findByRole('region', { name: REGIO });
    fireEvent.click(mig().getByRole('button', { name: 'Mes següent' }));
    expect(ubicacio()).toBe('/app/nevera/temporada/casa?filtre=temporada');
    expect(mig().getByText(nomDelMes(ara))).toBeTruthy();
    fireEvent.click(mig().getByRole('button', { name: 'Mes següent' }));
    expect(ubicacio()).toBe(`/app/nevera/temporada/casa?filtre=temporada&mes=${mesVei(ara, 1)}`);
    fireEvent.click(mig().getByRole('button', { name: 'Mes anterior' }));
    expect(ubicacio()).toBe('/app/nevera/temporada/casa?filtre=temporada');
    cleanup();
    /* El mes d'ara escrit a mà es veu igual, i «Este mes» no hi afig cap pas a l'historial. */
    munta(`/app/nevera/temporada/casa?mes=${ara}`, await prepara());
    await screen.findByRole('region', { name: REGIO });
    fireEvent.click(mig().getByRole('button', { name: 'Este mes' }));
    expect(ubicacio()).toBe(`/app/nevera/temporada/casa?mes=${ara}`);
  });

  test('un ?mes= que no val és el mes d’ara (i «Este mes» no navega)', async () => {
    for (const valor of ['13', '0', '01', 'abc']) {
      munta(`/app/nevera/temporada/casa?mes=${valor}`, await prepara());
      await screen.findByRole('region', { name: REGIO });
      expect(mig().getByText(nomDelMes(mesDAra())), valor).toBeTruthy();
      expect(screen.getByRole('region', { name: titolDeTemporada(mesDAra()) }), valor).toBeTruthy();
      fireEvent.click(mig().getByRole('button', { name: 'Este mes' }));
      expect(ubicacio(), valor).toBe(`/app/nevera/temporada/casa?mes=${valor}`);
      cleanup();
    }
  });

  test('un toc al mig ho marca com a comprat, com a La compra: ix i passa a Recents amb l’especificació', async () => {
    const estat = afig(ambLinies(['tomaques']), 'casa', 'llet', { especificacio: 'sense lactosa' });
    const { idb } = munta('/app/nevera/temporada/casa?mes=8', await prepara(estat));
    await screen.findByRole('region', { name: REGIO });
    const llet = mig().getByRole('button', { name: 'Llet' });
    expect(llet.closest('article.sp-card').querySelector('.sp-card-text').textContent).toBe('sense lactosa');
    fireEvent.click(llet);
    expect(mig().queryByRole('button', { name: 'Llet' })).toBeNull();
    await waitFor(() => expect(liniesDesades(idb)).toEqual(['tomaques']));
    expect(desat(idb).llistes[0].recents).toEqual([{ articleId: 'llet', especificacio: 'sense lactosa' }]);
  });

  test('els productes de botiga de «Fruita i verdura» s’etiqueten pel nom, i el detall els reconeix', async () => {
    expect(FRESC_DE_TEMPORADA && FRESC_SENSE_DADA && RAJOLA_DEL_FRESC, 'cal un producte fresc de temporada i un sense dada').toBeTruthy();
    const { idb } = munta('/app/nevera/temporada/casa?mes=8', await prepara(ambLinies([FRESC_DE_TEMPORADA.id, FRESC_SENSE_DADA.id])));
    await screen.findByRole('region', { name: REGIO });
    expect(delGrup(mig, 'Plena temporada')).toEqual([FRESC_DE_TEMPORADA.id]);
    expect(delGrup(mig, 'Sense dada de temporada')).toEqual([FRESC_SENSE_DADA.id]);
    /* La rajola del seu producte del calendari diu que ja és a la llista; el
       toc lleva eixa línia, sense crear cap article. */
    const rajola = () => within(seccio(detall, 'Plena temporada')).getByRole('button', { name: RAJOLA_DEL_FRESC });
    expect(rajola().getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(rajola());
    expect(rajola().getAttribute('aria-pressed')).toBe('false');
    expect(mig().queryByRole('region', { name: /^Plena temporada / })).toBeNull();
    await waitFor(() => expect(liniesDesades(idb)).toEqual([FRESC_SENSE_DADA.id]));
    expect(desat(idb).propis).toEqual([]);
  });

  test('en una pestanya lectora, el mig ho diu i cap toc canvia res', async () => {
    const navegador = { idb: creaIdbFals(), locks: creaLocksFals(), canal: creaCanalFals() };
    const altra = creaMagatzemNevera({ idb: navegador.idb.idb, navegador: { locks: navegador.locks }, Canal: navegador.canal.Canal });
    tancats.push(altra);
    expect(await altra.obtinBloqueig()).toBe('escriptora');
    await altra.desa(ambLinies(['tomaques']));
    munta('/app/nevera/temporada/casa?mes=8', await prepara(null, navegador));
    await waitFor(() => expect(mig().getByText('Només lectura')).toBeTruthy());
    await waitFor(() => expect(delGrup(mig, 'Plena temporada')).toEqual(['tomaques']));
    fireEvent.click(mig().getByRole('button', { name: 'Tomaques' }));
    fireEvent.click(detall().getByRole('button', { name: 'Carabassó' }));
    expect(delGrup(mig, 'Plena temporada')).toEqual(['tomaques']);
    expect(detall().getByRole('button', { name: 'Carabassó' }).getAttribute('aria-pressed')).toBe('false');
    await espera(30);
    expect(liniesDesades(navegador.idb)).toEqual(['tomaques']);
    expect(desat(navegador.idb).llistes[0].recents).toEqual([]);
  });
});

describe('De temporada a… (el detall)', () => {
  test('un article que ja existix commuta; un nom sense article es crea com a propi (afigPerNom)', async () => {
    const { idb } = munta('/app/nevera/temporada/casa?mes=8', await prepara(ambLinies(['tomaques'])));
    await screen.findByRole('region', { name: 'De temporada a l’agost' });
    expect(detall().getByRole('button', { name: 'Tomaques' }).getAttribute('aria-pressed')).toBe('true');

    /* Un article de base: el toc el posa a la llista. */
    const carabasso = detall().getByRole('button', { name: 'Carabassó' });
    expect(carabasso.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(carabasso);
    expect(detall().getByRole('button', { name: 'Carabassó' }).getAttribute('aria-pressed')).toBe('true');
    expect(delGrup(mig, 'Plena temporada')).toEqual(['tomaques', 'carabasso']);
    await waitFor(() => expect(liniesDesades(idb)).toEqual(['tomaques', 'carabasso']));

    /* Un producte del calendari que la Nevera no té: es crea com a propi i va a la llista. */
    fireEvent.click(detall().getByRole('button', { name: 'Albergínies' }));
    expect(detall().getByRole('button', { name: 'Albergínies' }).getAttribute('aria-pressed')).toBe('true');
    expect(delGrup(mig, 'Plena temporada')).toEqual(['tomaques', 'carabasso', 'p-1']);
    await waitFor(() => expect(desat(idb)?.propis).toEqual([{ id: 'p-1', nom: 'Albergínies' }]));
    expect(liniesDesades(idb)).toEqual(['tomaques', 'carabasso', 'p-1']);

    /* Un altre toc el lleva; el propi es queda al catàleg. */
    fireEvent.click(detall().getByRole('button', { name: 'Albergínies' }));
    expect(mig().queryByRole('button', { name: 'Albergínies' })).toBeNull();
    fireEvent.click(detall().getByRole('button', { name: 'Tomaques' }));
    expect(mig().queryByRole('button', { name: 'Tomaques' })).toBeNull();
    await waitFor(() => expect(liniesDesades(idb)).toEqual(['carabasso']));
    expect(desat(idb).propis).toEqual([{ id: 'p-1', nom: 'Albergínies' }]);
  });
});

/* REGLA D'OR 1 (ordre del Mestre, 261004) · Tota targeta porta la boina taronja amb l'autor real:
   els articles del catàleg i els suggeriments del calendari, l'entitat Sóc de Poble (a la pàgina
   del projecte); un article propi, «Tu», sense enllaç (la plataforma no dona a les apps la identitat
   de la persona, i no se n'inventa cap). */
describe('la boina de totes les targetes (REGLA D’OR 1)', () => {
  const boinaDe = (boto) => boto.closest('article.sp-card').querySelector('header.sp-card-header');
  const delProjecte = (boto) => {
    const boina = boinaDe(boto);
    expect(boina.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
    expect(within(boina).getByRole('link', { name: /^Sóc de Poble/ }).getAttribute('href')).toBe('/projecte');
  };
  const propia = (boto) => {
    const boina = boinaDe(boto);
    expect(boina.querySelector('.sp-card-author-name').textContent).toBe('Tu');
    expect(within(boina).queryByRole('link')).toBeNull();
  };

  test('el mig i el detall: el catàleg i el calendari signen Sóc de Poble; un article propi, «Tu»', async () => {
    munta('/app/nevera/temporada/casa?mes=8', await prepara(afigPerNom(ambLinies(['tomaques']), 'casa', 'Kombutxa')));
    await screen.findByRole('region', { name: REGIO });
    const targetes = [...document.querySelectorAll('#app-grid-main article.sp-card, #app-grid-list article.sp-card')];
    expect(targetes.length).toBeGreaterThan(5);
    for (const targeta of targetes) {
      expect(targeta.querySelector('header.sp-card-header .sp-card-author-name'), targeta.textContent).not.toBeNull();
    }
    delProjecte(mig().getByRole('button', { name: 'Tomaques' }));
    propia(mig().getByRole('button', { name: 'Kombutxa' }));
    delProjecte(detall().getByRole('button', { name: 'Carabassó' }));
    /* Un suggeriment del calendari que encara no és cap article: el calendari és del projecte. */
    delProjecte(detall().getByRole('button', { name: 'Albergínies' }));
    /* Tocat, es crea com a article propi: des d'ara el signa la persona, al mig i al detall. */
    fireEvent.click(detall().getByRole('button', { name: 'Albergínies' }));
    propia(mig().getByRole('button', { name: 'Albergínies' }));
    propia(detall().getByRole('button', { name: 'Albergínies' }));
  });

  /* Verificació «lector-nevera», D1 · Sense la guarda, `boina.nom` sobre null petava tota la
     columna del mig. Amb ella, la targeta es queda sense boina (com a l'esquelet) i no
     s'inventa cap autor. */
  test('una identitat que la plataforma no coneix (autoriaDe torna null): cap boina inventada, i el mig no peta', async () => {
    autoriaForcada.nulla = true;
    munta('/app/nevera/temporada/casa?mes=8', await prepara(ambLinies(['tomaques'])));
    await screen.findByRole('region', { name: REGIO });
    const targeta = mig().getByRole('button', { name: 'Tomaques' }).closest('article.sp-card');
    expect(targeta.querySelector('.sp-card-author-name')).toBeNull();
    expect(within(targeta).queryByRole('link')).toBeNull();
    expect(within(targeta).getByText('Per comprar')).toBeTruthy();
    /* El detall (l'esquelet) ja ho tolerava: també sense boina. */
    const carabasso = detall().getByRole('button', { name: 'Carabassó' }).closest('article.sp-card');
    expect(carabasso.querySelector('.sp-card-author-name')).toBeNull();
  });
});

describe('el camí i la pantalla estreta', () => {
  test('l’entrada sense llista, o amb una que no existix, es canonitza amb la consulta', async () => {
    const entorn = await prepara();
    munta('/app/nevera/temporada?mes=3', entorn);
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/temporada/casa?mes=3'));
    cleanup();
    munta('/app/nevera/temporada/cataleg?mes=3&filtre=temporada', await prepara());
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/temporada/casa/cataleg?mes=3&filtre=temporada'));
    cleanup();
    munta('/app/nevera/temporada/l-99', await prepara());
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/temporada/casa'));
  });

  test('en estret, la llista primer; el botó de la capçalera porta a «De temporada a…» (push) i el resum del peu hi torna', async () => {
    ambAmplada(375);
    munta('/app/nevera/temporada/casa?mes=8', await prepara(ambLinies(['tomaques'])));
    await screen.findByRole('region', { name: REGIO });
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    fireEvent.click(mig().getByRole('button', { name: 'De temporada a l’agost' }));
    expect(ubicacio()).toBe('/app/nevera/temporada/casa/cataleg?mes=8');
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    fireEvent.click(detall().getByRole('link', { name: 'Casa 1 article' }));
    expect(ubicacio()).toBe('/app/nevera/temporada/casa?mes=8');
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
  });
});

describe('Llei del Píxel', () => {
  test('La compra no porta cap etiqueta de temporada (ni a la llista ni al catàleg)', async () => {
    munta('/app/nevera/llista/casa', await prepara(ambLinies(['tomaques'])));
    await screen.findByRole('region', { name: 'Catàleg' });
    expect(mig().getByRole('button', { name: 'Tomaques' })).toBeTruthy();
    expect(detall().getByRole('button', { name: 'Tomaques' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryAllByText(/temporada/i)).toEqual([]);
  });
});
