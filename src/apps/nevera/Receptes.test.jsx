/* La Nevera de Casa · l'entrada Receptes (Onada 12, 261011; ordres 261011_0130,
   punt 6: «que l'estructura del Rebost siga capaç de fer recomanacions de
   receptes basades en els ingredients existents»), dins de la plataforma de
   veres (RutaApps → AppNevera → ClosaAplicacio → AppGridShell) i amb el
   magatzem sobre el navegador fals de P2, com AppNevera.test.jsx.
   Dades sintètiques: articles de base i propis. */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import AppNevera from './AppNevera.jsx';
import { NOM_BASE, STORE, creaMagatzemNevera } from './magatzem.js';
import manifestNevera from './manifest.js';
import { RECEPTES, estatInicial, marcaACasa } from './nucli/index.js';
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const tancats = [];

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
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const desat = (idb) => idb.files(NOM_BASE, STORE)[0];
const liniesDesades = (idb) => desat(idb)?.llistes.find((l) => l.id === 'casa')?.linies.map((l) => l.articleId);
const titols = () => detall().getAllByRole('heading', { level: 3 }).map((titol) => titol.textContent);
const seccio = (nom) => detall().getByRole('region', { name: new RegExp(`^${nom} \\d+ recept(?:a|es)$`) });
const delGrup = (nom) => [...seccio(nom).querySelectorAll('button[data-element]')].map((b) => b.dataset.element);
const targeta = (id) => [...document.querySelectorAll('#app-grid-main article.sp-card')]
  .find((article) => [...article.querySelectorAll('[data-element]')].some((node) => node.dataset.element === id));

const aCasa = (parells) => Object.entries(parells).reduce((estat, [id, valor]) => marcaACasa(estat, id, valor), estatInicial());
const PA_TOMACA_OLI = { pa: 'hi-ha', tomaques: 'hi-ha', 'oli-oliva': 'hi-ha' };
const REGIO = 'Receptes amb el que tens';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  ambAmplada(1400);
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Receptes amb el que tens (el detall)', () => {
  test('l’entrada de la barra es canonitza amb la llista, i el receptari ix en tres seccions en l’ordre del recomanador', async () => {
    munta('/app/nevera/receptes', await prepara(aCasa(PA_TOMACA_OLI)));
    await screen.findByRole('region', { name: REGIO });
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/receptes/casa'));
    expect(titols().map((titol) => titol.replace(/ \d+ recept(?:a|es)$/, ''))).toEqual(['Ho tens tot', 'Et falta poc', 'Et falta més']);
    expect(titols()[0]).toBe('Ho tens tot 1 recepta');
    expect(delGrup('Ho tens tot')).toEqual(['pa-amb-tomaca']);
    expect(delGrup('Et falta poc')).toContain('ous-amb-tomaca');
    /* Tot el receptari hi és, una targeta per recepta. */
    const totes = [...document.querySelectorAll('#app-grid-main button[data-element]')].map((b) => b.dataset.element);
    expect(totes.slice().sort()).toEqual(RECEPTES.map((r) => r.id).sort());
    expect(screen.getByRole('separator', { name: 'Redimensionar Cal comprar per a cuinar' })).toBeTruthy();
    /* Amb existències, cap avís de rebost buit. */
    expect(detall().queryByText('Encara no has marcat res a «A casa»')).toBeNull();
  });

  test('cada targeta diu què és el plat i per què va on va, i porta la boina del projecte (REGLA D’OR 1)', async () => {
    munta('/app/nevera/receptes/casa', await prepara(aCasa(PA_TOMACA_OLI)));
    await screen.findByRole('region', { name: REGIO });
    const pa = targeta('pa-amb-tomaca');
    expect(within(pa).getAllByRole('heading').map((h) => h.textContent)).toEqual(['Pa amb tomaca', 'Llesques de pa fregades amb tomaca madura i un raig d’oli']);
    expect(pa.querySelector('.sp-card-text').textContent).toBe('Tens els 3 ingredients. Aprofites el fresc que tens: tomaques.');
    const ous = targeta('ous-amb-tomaca');
    expect(ous.querySelector('.sp-card-text').textContent).toMatch(/^Tens 2 de 3 ingredients\. Falten: ous\./);
    for (const article of document.querySelectorAll('#app-grid-main article.sp-card')) {
      const boina = article.querySelector('header.sp-card-header');
      expect(boina.querySelector('.sp-card-author-name')?.textContent, article.textContent).toBe('Sóc de Poble');
      expect(within(boina).getByRole('link', { name: /^Sóc de Poble/ }).getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
    }
    /* Cap estil en línia a les targetes de les receptes. */
    expect(document.querySelectorAll('#app-grid-main [style], #app-grid-list [style]')).toHaveLength(0);
  });

  test('sense res marcat a «A casa», ho diu i porta allà; el receptari ix sencer a «Et falta més»', async () => {
    munta('/app/nevera/receptes/casa', await prepara());
    await screen.findByRole('region', { name: REGIO });
    expect(detall().getByText('Encara no has marcat res a «A casa»')).toBeTruthy();
    expect(titols()).toEqual([`Et falta més ${RECEPTES.length} receptes`]);
    expect(mig().getByText('No cal comprar res per a cuinar')).toBeTruthy();
    expect(mig().getByRole('button', { name: 'Afig-ho tot' }).disabled).toBe(true);
    fireEvent.click(detall().getByRole('button', { name: 'Ves a «A casa»' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/casa/casa'));
  });

  test('«S’ha acabat» no compta: marcar-ho tot com a acabat és com no tindre res', async () => {
    munta('/app/nevera/receptes/casa', await prepara(aCasa({ pa: 'acabat', tomaques: 'acabat', 'oli-oliva': 'acabat' })));
    await screen.findByRole('region', { name: REGIO });
    expect(titols()).toEqual([`Et falta més ${RECEPTES.length} receptes`]);
    expect(detall().getByText('Encara no has marcat res a «A casa»')).toBeTruthy();
  });
});

describe('el detall d’una recepta', () => {
  test('diu els ingredients amb la quantitat aproximada i l’explicació; «D’acord» tanca sense tocar res', async () => {
    const { idb } = munta('/app/nevera/receptes/casa?article=pa-amb-tomaca', await prepara(aCasa(PA_TOMACA_OLI)));
    const dialeg = await screen.findByRole('dialog', { name: 'Pa amb tomaca' });
    expect(within(dialeg).getByText('Tens els 3 ingredients. Aprofites el fresc que tens: tomaques.')).toBeTruthy();
    expect(within(dialeg).getByText('Per a 4 racions: pa (4 llesques); tomaques (2 de madures); oli d’oliva (un raig).')).toBeTruthy();
    expect(within(dialeg).getByText('Si en tens, també: sal (un pessic); alls (1 gra).')).toBeTruthy();
    expect(within(dialeg).getByText(/^Receptari orientatiu/)).toBeTruthy();
    /* Res a afegir: cap botó d'afegir; ni quantitat ni nota. */
    expect(within(dialeg).queryByRole('button', { name: /^Afig el que falta/ })).toBeNull();
    expect(within(dialeg).queryByRole('textbox')).toBeNull();
    fireEvent.click(within(dialeg).getByRole('button', { name: 'D’acord' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/receptes/casa'));
    expect(screen.queryByRole('dialog', { name: 'Pa amb tomaca' })).toBeNull();
    expect(liniesDesades(idb)).toEqual([]);
  });

  test('tocar una targeta obri el detall; «Afig el que falta» posa a la llista l’article de sempre i crea com a propi el que no en té', async () => {
    const { idb } = munta('/app/nevera/receptes/casa', await prepara(aCasa({ cigrons: 'hi-ha', creilles: 'hi-ha' })));
    await screen.findByRole('region', { name: REGIO });
    fireEvent.click(within(targeta('olla')).getByRole('button', { name: 'Olla de cigrons i verdura' }));
    expect(ubicacio()).toBe('/app/nevera/receptes/casa?article=olla');
    const dialeg = await screen.findByRole('dialog', { name: 'Olla de cigrons i verdura' });
    expect(within(dialeg).getByText('Tens 2 de 4 ingredients. Falten: naps i penques (o bledes).')).toBeTruthy();
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Afig el que falta a «Casa»' }));
    await waitFor(() => expect(desat(idb).propis.map((p) => p.nom)).toEqual(['Naps', 'Penques']));
    expect(liniesDesades(idb)).toEqual(desat(idb).propis.map((p) => p.id));
    expect(screen.queryByRole('dialog', { name: 'Olla de cigrons i verdura' })).toBeNull();
    /* Afegir a la llista no és tindre-ho: la recepta continua on era. */
    expect(desat(idb).casa).toEqual([{ articleId: 'cigrons', estat: 'hi-ha' }, { articleId: 'creilles', estat: 'hi-ha' }]);
  });
});

/* Correcció del refutador (261011, R3) · En mode `lectora` les accions tornen false en silenci:
   «Afig el que falta» tancava el diàleg i no feia res, i en estret la columna no deia per què. */
describe('R3 · una altra pestanya té l’escriptura', () => {
  async function lectora(amplada) {
    ambAmplada(amplada);
    const navegador = { idb: creaIdbFals(), locks: creaLocksFals(), canal: creaCanalFals() };
    const altra = creaMagatzemNevera({ idb: navegador.idb.idb, navegador: { locks: navegador.locks }, Canal: navegador.canal.Canal });
    tancats.push(altra);
    await altra.desa(aCasa({ cigrons: 'hi-ha', creilles: 'hi-ha' }));
    expect(await altra.obtinBloqueig()).toBe('escriptora');
    return munta('/app/nevera/receptes/casa?article=olla', await prepara(null, navegador));
  }

  test('en estret, la columna de les receptes ho diu, i el diàleg també: «Afig el que falta» queda desactivat i res no es tanca en silenci', async () => {
    const { idb } = await lectora(375);
    const dialeg = await screen.findByRole('dialog', { name: 'Olla de cigrons i verdura' });
    await waitFor(() => expect(within(dialeg).getByText('Només lectura')).toBeTruthy());
    expect(detall().getAllByText('Només lectura').length).toBeGreaterThanOrEqual(1);
    const boto = within(dialeg).getByRole('button', { name: 'Afig el que falta a «Casa»' });
    expect(boto.disabled).toBe(true);
    fireEvent.click(boto);
    expect(screen.getByRole('dialog', { name: 'Olla de cigrons i verdura' })).toBeTruthy();
    expect(liniesDesades(idb)).toEqual([]);
  });

  test('en ample, l’avís de la columna el porta «Cal comprar per a cuinar» (una sola vegada fora del diàleg)', async () => {
    await lectora(1400);
    await screen.findByRole('dialog', { name: 'Olla de cigrons i verdura' });
    await waitFor(() => expect(mig().getByText('Només lectura')).toBeTruthy());
    expect(document.querySelectorAll('#app-grid-main .sdp-marc-columna__cos > .sdp-alerta')).toHaveLength(0);
  });
});

describe('R1 · un producte de botiga marcat a «A casa»', () => {
  test('les creïlles i les cebes de la botiga compten com a ingredients; un plat preparat, no', async () => {
    munta('/app/nevera/receptes/casa', await prepara(aCasa({
      'mer-patatas-5-kg': 'hi-ha', 'mer-huevos-grandes-l': 'hi-ha', 'oli-oliva': 'hi-ha', 'mer-lentejas': 'hi-ha'
    })));
    await screen.findByRole('region', { name: REGIO });
    expect(delGrup('Ho tens tot')).toEqual(['truita-de-creilla']);
    /* El bol de llentilles preparades no fa «tindre llentilles». */
    expect(targeta('llentilles').querySelector('.sp-card-text').textContent).toMatch(/Falten: llentilles/);
  });
});

describe('Cal comprar per a cuinar (el mig)', () => {
  test('proposa el que falta a les receptes que són a un o dos ingredients; «+» ho afig a la llista del camí', async () => {
    const { idb } = munta('/app/nevera/receptes/casa', await prepara(aCasa(PA_TOMACA_OLI)));
    await screen.findByRole('region', { name: REGIO });
    const liniaDOus = document.querySelector('#app-grid-list [data-linia="ou"]');
    expect(liniaDOus.querySelector('.sdp-linies__nom').textContent).toBe('Ous');
    expect(liniaDOus.querySelector('.sdp-linies__detall').textContent).toMatch(/^Per a: .*Ous amb tomaca/);
    fireEvent.click(mig().getByRole('button', { name: 'Afig Ous a «Casa»' }));
    await waitFor(() => expect(liniesDesades(idb)).toEqual(['ous']));
    /* Ja és a la llista: no es torna a proposar. */
    expect(mig().queryByRole('button', { name: 'Afig Ous a «Casa»' })).toBeNull();
    expect(desat(idb).propis).toEqual([]);
  });

  test('«Afig-ho tot» ho posa tot d’una, sense repetir res', async () => {
    const { idb } = munta('/app/nevera/receptes/casa', await prepara(aCasa(PA_TOMACA_OLI)));
    await screen.findByRole('region', { name: REGIO });
    const proposats = mig().getAllByRole('button', { name: /^Afig .+ a «Casa»$/ }).length;
    expect(proposats).toBeGreaterThan(1);
    fireEvent.click(mig().getByRole('button', { name: 'Afig-ho tot' }));
    await waitFor(() => expect(liniesDesades(idb)).toHaveLength(proposats));
    expect(new Set(liniesDesades(idb)).size).toBe(proposats);
    expect(liniesDesades(idb)).toEqual(expect.arrayContaining(['ous', 'alls']));
    expect(mig().getByText('No cal comprar res per a cuinar')).toBeTruthy();
  });

  test('en pantalla estreta es veu primer el receptari, i el resum del peu porta al que cal comprar', async () => {
    ambAmplada(375);
    munta('/app/nevera/receptes/casa', await prepara(aCasa(PA_TOMACA_OLI)));
    await screen.findByRole('region', { name: REGIO });
    const closca = document.querySelector('.app-grid-shell');
    await waitFor(() => expect(closca.dataset.panell).toBe(''));
    const peu = detall().getByRole('link', { name: /Cal comprar per a cuinar/ });
    expect(peu.getAttribute('href')).toBe('/app/nevera/receptes/casa/cal-comprar');
    fireEvent.click(peu);
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/receptes/casa/cal-comprar'));
    await waitFor(() => expect(closca.dataset.panell).toBe('middle'));
  });
});
