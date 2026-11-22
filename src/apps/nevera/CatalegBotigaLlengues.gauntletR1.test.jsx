/* v1.2.19 · Gauntlet R1 (L3-02) · «Catàleg de botiga» en les cinc llengües.
   La llista de botiga es crea amb un nom canònic (NOM_LLISTA_BOTIGA), que no
   depén de la llengua, i es pinta traduïda amb nomLlistaVisible. Les llistes
   creades abans fora del valencià («Tienda de pueblo», «Village shop»…) també
   es reconeixen. Dos tocs del botó deixen una sola llista, i s'hi pinta el
   catàleg de botiga. Dades sintètiques; el navegador fals de P2. */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import AppNevera from './AppNevera.jsx';
import { CODIS_IDIOMA_NEVERA, textosVistaNevera } from './i18nNevera.js';
import { NOM_BASE, STORE, creaMagatzemNevera } from './magatzem.js';
import manifestNevera from './manifest.js';
import { NOM_LLISTA_BOTIGA, esLlistaMercadona, nomLlistaVisible } from './mercadona.js';
import { creaLlista, estatInicial } from './nucli/index.js';
import { netejaNomLlistaEncarrec } from './nucli/encarrec.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const ALTRES_LLENGUES = CODIS_IDIOMA_NEVERA.filter((codi) => codi !== 'ca');
const tancats = [];

function prepara() {
  const idb = creaIdbFals();
  const magatzem = creaMagatzemNevera({ idb: idb.idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
  tancats.push(magatzem);
  const App = () => <AppNevera magatzem={magatzem} descarrega={vi.fn()} />;
  const registre = creaRegistre({ internes: [{ ...manifestNevera, carrega: () => Promise.resolve({ default: App }) }] });
  return { idb, magatzem, registre };
}
const munta = (url, entorn, idioma) => {
  muntaPlataforma(url, { registre: entorn.registre, entorn: ENTORN, externalConfig: { language: idioma } });
  return entorn;
};
const desat = (idb) => idb.files(NOM_BASE, STORE)[0];
const productesDeBotiga = () => document.querySelectorAll('#app-grid-main [data-element^="mer-"]').length;
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

/* El mateix que fa el botó de ColumnaLlistes, sobre el nucli pur. */
const tocaCatalegDeBotiga = (estat) => {
  const existent = estat.llistes.find(esLlistaMercadona);
  return existent ? estat : creaLlista(estat, NOM_LLISTA_BOTIGA);
};

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

describe('v1.2.19 · Gauntlet R1 (L3-02) · el nom de la llista de botiga no depén de la llengua', () => {
  test('el nom canònic és el valencià de la v1.2.18 i dos tocs en deixen una sola llista', () => {
    expect(NOM_LLISTA_BOTIGA).toBe('Botiga de poble');
    const estat = tocaCatalegDeBotiga(tocaCatalegDeBotiga(estatInicial()));
    expect(estat.llistes.map((llista) => llista.nom)).toEqual(['Casa', 'Botiga de poble']);
  });

  test('les llistes creades abans en qualsevol llengua es reconeixen, i un segon toc no en crea cap altra', () => {
    for (const codi of CODIS_IDIOMA_NEVERA) {
      const nomAntic = textosVistaNevera(codi).botigaDePoble;
      const abans = creaLlista(estatInicial(), nomAntic);
      expect(esLlistaMercadona(abans.llistes[1]), codi).toBe(true);
      expect(tocaCatalegDeBotiga(abans).llistes.map((llista) => llista.nom), codi).toEqual(['Casa', nomAntic]);
    }
    for (const nom of ['Catàleg de botiga', 'Mercadona', ' tienda DE pueblo ']) expect(esLlistaMercadona({ nom }), nom).toBe(true);
    for (const nom of ['Casa', 'Mercat del dijous', 'Tienda']) expect(esLlistaMercadona({ nom }), nom).toBe(false);
  });

  test('nomLlistaVisible pinta qualsevol nom de botiga en la llengua de la interfície; la resta, igual', () => {
    const noms = ['Botiga de poble', 'Catàleg de botiga', 'Mercadona', ...CODIS_IDIOMA_NEVERA.map((codi) => textosVistaNevera(codi).botigaDePoble)];
    for (const idioma of CODIS_IDIOMA_NEVERA) {
      for (const nom of noms) expect(nomLlistaVisible(nom, idioma), `${idioma}: ${nom}`).toBe(textosVistaNevera(idioma).botigaDePoble);
      expect(nomLlistaVisible('Casa', idioma)).toBe('Casa');
    }
    expect(nomLlistaVisible('Botiga de poble')).toBe('Botiga de poble');
  });

  test('l’encàrrec titula la llista de botiga en la llengua triada, tinga el nom que tinga', () => {
    for (const idioma of CODIS_IDIOMA_NEVERA) {
      const esperat = textosVistaNevera(idioma).botigaDePoble;
      expect(netejaNomLlistaEncarrec(NOM_LLISTA_BOTIGA, idioma), idioma).toBe(esperat);
      expect(netejaNomLlistaEncarrec('Village shop', idioma), idioma).toBe(esperat);
      expect(netejaNomLlistaEncarrec('Mercat del dijous', idioma), idioma).toBe('Mercat del dijous');
    }
  });
});

describe('v1.2.19 · Gauntlet R1 (L3-02) · el botó «Catàleg de botiga» fora del valencià', () => {
  test.each(ALTRES_LLENGUES)('%s: dos tocs, una sola llista amb el nom canònic, pintada traduïda i amb el catàleg de botiga', async (idioma) => {
    const tx = textosVistaNevera(idioma);
    const entorn = munta('/app/nevera/llista/casa', prepara(), idioma);
    fireEvent.click(await screen.findByRole('button', { name: tx.catalegDeBotiga }, { timeout: 5000 }));
    await waitFor(() => expect(desat(entorn.idb)?.llistes).toHaveLength(2));
    const llista = desat(entorn.idb).llistes[1];
    expect(llista.nom).toBe(NOM_LLISTA_BOTIGA);
    await waitFor(() => expect(ubicacio()).toBe(`/app/nevera/llista/${llista.id}`));
    await waitFor(() => expect(productesDeBotiga()).toBeGreaterThan(0));
    /* El títol de la llista, en la llengua de la interfície; el nom desat, el canònic. */
    expect(within(document.getElementById('app-grid-list')).getAllByText(tx.botigaDePoble).length).toBeGreaterThan(0);
    expect(document.getElementById('app-grid-list').textContent).not.toContain(NOM_LLISTA_BOTIGA);

    fireEvent.click(screen.getByRole('button', { name: tx.catalegDeBotiga }));
    await waitFor(() => expect(ubicacio()).toBe(`/app/nevera/llista/${llista.id}`));
    expect(desat(entorn.idb).llistes.map((l) => l.nom)).toEqual(['Casa', NOM_LLISTA_BOTIGA]);
  }, 30000);

  test('es: una llista «Tienda de pueblo» d’abans es reobri (cap llista nova) i hi ix el catàleg de botiga', async () => {
    const tx = textosVistaNevera('es');
    const entorn = prepara();
    const estat = creaLlista(estatInicial(), tx.botigaDePoble);
    await entorn.magatzem.desa(estat);
    munta('/app/nevera/llista/casa', entorn, 'es');
    fireEvent.click(await screen.findByRole('button', { name: tx.catalegDeBotiga }, { timeout: 5000 }));
    await waitFor(() => expect(ubicacio()).toBe(`/app/nevera/llista/${estat.darreraLlista}`));
    await waitFor(() => expect(productesDeBotiga()).toBeGreaterThan(0));
    expect(desat(entorn.idb).llistes.map((l) => l.nom)).toEqual(['Casa', 'Tienda de pueblo']);
  }, 30000);
});
