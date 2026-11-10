/* La Nevera de Casa · compartir la llista de la compra (R16-F) dins de la
   plataforma de veres (RutaApps → AppNevera → ClosaAplicacio), amb el
   magatzem sobre el navegador fals, en ample (1400 px).
   · Obrir un enllaç #compartida= no afig res: arriba a la llista per defecte
     amb el fragment, mostra què porta i afegir és una acció explícita que
     conserva el que ja hi havia (fusionaLlistaCompartida).
   · Compartir: l'enllaç (fragment, mai consulta) al porta-retalls o, si no es
     pot, en un camp; el fitxer, per la descàrrega de l'app.
   · Els textos nous seguixen la llengua de la interfície (5 llengües).
   Dades sintètiques: articles de base, un producte del catàleg i un propi inventat. */
import '../../../tests/helpers/diccionaris.js';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import AppNevera from './AppNevera.jsx';
import { NOM_BASE, STORE, creaMagatzemNevera } from './magatzem.js';
import manifestNevera from './manifest.js';
import {
  ARTICLES_PRODUCTES, afig, afigPerNom, creaLlista, enllacLlistaCompartida, estatInicial, exportaLlistaCompra, importaLlistaCompra,
  serialitzaLlistaCompartida
} from './nucli/index.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const PRODUCTE = ARTICLES_PRODUCTES[0];
const tancats = [];

function prepara() {
  const idb = creaIdbFals();
  const magatzem = creaMagatzemNevera({ idb: idb.idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
  tancats.push(magatzem);
  const descarrega = vi.fn();
  const App = () => <AppNevera magatzem={magatzem} descarrega={descarrega} />;
  const registre = creaRegistre({ internes: [{ ...manifestNevera, carrega: () => Promise.resolve({ default: App }) }] });
  return { idb, magatzem, descarrega, registre };
}

const munta = (url, entorn, externalConfig = {}) => {
  muntaPlataforma(url, { registre: entorn.registre, entorn: ENTORN, externalConfig });
  return entorn;
};
const desat = (idb) => idb.files(NOM_BASE, STORE)[0];
const liniesDesades = (idb) => desat(idb)?.llistes.find((l) => l.id === 'casa')?.linies;

/* La llista «Casa» de qui comparteix: un article de base, un producte de botiga i un propi. */
function emissor() {
  let estat = afig(estatInicial(), 'casa', 'tomaques', { especificacio: '1 kg de pera' });
  estat = afig(estat, 'casa', PRODUCTE.id);
  return afigPerNom(estat, 'casa', 'Kombutxa de gingebre', { especificacio: '2 ampolles' });
}
const enllacDe = (estat) => enllacLlistaCompartida(exportaLlistaCompra(estat, 'casa'), '/app/nevera/llista').url;
const rebuda = (nom = 'Llista compartida «Casa» · 3 articles') => screen.findByRole('group', { name: nom });

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  delete navigator.clipboard;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('rebre una llista compartida', () => {
  test('obrir l’enllaç no afig res: arriba a la llista per defecte amb el fragment; s’afig només el que es tria i el que hi havia es conserva', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa(afig(estatInicial(), 'casa', 'tomaques', { especificacio: 'les de penjar' }));
    const url = enllacDe(emissor());
    munta(url, entorn);
    const grup = await rebuda();
    await waitFor(() => expect(window.location.pathname).toBe('/app/nevera/llista/casa'));
    expect(window.location.hash).toBe(url.slice(url.indexOf('#')));
    expect(window.location.search).toBe('');
    expect(liniesDesades(entorn.idb)).toEqual([{ articleId: 'tomaques', especificacio: 'les de penjar' }]);
    /* Cada article, una casella triada; el producte es desmarca. */
    expect(within(grup).getAllByRole('checkbox').map((casella) => casella.checked)).toEqual([true, true, true]);
    fireEvent.click(within(grup).getByRole('checkbox', { name: PRODUCTE.nom }));
    fireEvent.click(within(grup).getByRole('button', { name: 'Afig els triats a «Casa»' }));
    await waitFor(() => expect(liniesDesades(entorn.idb)).toHaveLength(2));
    const propi = desat(entorn.idb).propis.find((p) => p.nom === 'Kombutxa de gingebre');
    expect(liniesDesades(entorn.idb)).toEqual([
      { articleId: 'tomaques', especificacio: 'les de penjar' },
      { articleId: propi.id, especificacio: '2 ampolles' }
    ]);
    expect(screen.getByText('S’ha afegit 1 article a «Casa». 1 article ja hi era.')).toBeTruthy();
    /* Afegir lleva el fragment i la previsualització. */
    await waitFor(() => expect(window.location.hash).toBe(''));
    expect(screen.queryByRole('group', { name: /^Llista compartida/ })).toBeNull();
  });

  test('un enllaç malmés només avisa; la creu lleva el fragment i la llista no canvia', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa(estatInicial());
    munta('/app/nevera/llista/casa#compartida=no-es-cap-llista', entorn);
    const titol = await screen.findByText('No s’ha pogut llegir la llista compartida');
    const alerta = titol.closest('[role="status"]');
    expect(alerta.textContent).toContain('No és un enllaç ni un fitxer de llista de la Nevera, o ha arribat incomplet. No s’ha afegit cap article.');
    expect(screen.queryByRole('group', { name: /^Llista compartida/ })).toBeNull();
    fireEvent.click(within(alerta).getByRole('button', { name: 'Tancar l\'avís' }));
    await waitFor(() => expect(window.location.hash).toBe(''));
    expect(screen.queryByText('No s’ha pogut llegir la llista compartida')).toBeNull();
    expect(liniesDesades(entorn.idb)).toEqual([]);
  });

  test('el text enganxat: un text dolent ho diu al camp; l’enllaç o el text del fitxer obrin la previsualització, que es pot descartar o afegir', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa(estatInicial());
    munta('/app/nevera/llista/casa', entorn);
    fireEvent.click(await screen.findByRole('button', { name: 'Compartix o importa la llista' }));
    const camp = screen.getByRole('textbox', { name: 'Enllaç o text rebut' });
    const revisa = () => fireEvent.click(screen.getByRole('button', { name: 'Revisa la llista rebuda' }));
    fireEvent.change(camp, { target: { value: 'una llista qualsevol' } });
    revisa();
    expect(camp.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('No és un enllaç ni un fitxer de llista de la Nevera, o ha arribat incomplet.')).toBeTruthy();
    expect(screen.queryByRole('group', { name: /^Llista compartida/ })).toBeNull();
    /* L'enllaç: la previsualització, i descartar-la no canvia res. */
    fireEvent.change(camp, { target: { value: enllacDe(emissor()) } });
    expect(camp.getAttribute('aria-invalid')).toBeNull();
    revisa();
    expect(camp.value).toBe('');
    fireEvent.click(within(await rebuda()).getByRole('button', { name: 'Descarta-la' }));
    expect(screen.queryByRole('group', { name: /^Llista compartida/ })).toBeNull();
    /* El text del fitxer descarregat: s'afig tot. */
    fireEvent.change(camp, { target: { value: serialitzaLlistaCompartida(exportaLlistaCompra(emissor(), 'casa')) } });
    revisa();
    fireEvent.click(within(await rebuda()).getByRole('button', { name: 'Afig els triats a «Casa»' }));
    await waitFor(() => expect(liniesDesades(entorn.idb)).toHaveLength(3));
    expect(liniesDesades(entorn.idb).slice(0, 2)).toEqual([
      { articleId: 'tomaques', especificacio: '1 kg de pera' }, { articleId: PRODUCTE.id, especificacio: '' }
    ]);
    expect(screen.getByText('S’han afegit 3 articles a «Casa».')).toBeTruthy();
  });
});

describe('compartir la llista', () => {
  test('l’enllaç va al porta-retalls amb la llista al fragment; si no es pot copiar, en un camp; el fitxer, per la descàrrega de l’app', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa(emissor());
    munta('/app/nevera/llista/casa', entorn);
    fireEvent.click(await screen.findByRole('button', { name: 'Compartix o importa la llista' }));
    const grup = screen.getByRole('group', { name: 'Compartir «Casa»' });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    fireEvent.click(within(grup).getByRole('button', { name: 'Copia l’enllaç' }));
    await screen.findByText(/^Enllaç de «Casa» copiat\./);
    const [url] = writeText.mock.calls[0];
    expect(url.startsWith(`${window.location.origin}/app/nevera/llista#compartida=`)).toBe(true);
    expect(url).not.toContain('?');
    expect(importaLlistaCompra(url).paquet).toEqual(exportaLlistaCompra(emissor(), 'casa'));
    /* El navegador no deixa copiar: l'enllaç, en un camp de només lectura. */
    writeText.mockRejectedValueOnce(new Error('No permés'));
    fireEvent.click(within(grup).getByRole('button', { name: 'Copia l’enllaç' }));
    const enllac = await within(grup).findByRole('textbox', { name: 'Enllaç per a compartir' });
    expect(enllac.value).toBe(url);
    expect(enllac.readOnly).toBe(true);
    /* El fitxer. */
    fireEvent.click(within(grup).getByRole('button', { name: 'Descarrega el fitxer' }));
    expect(entorn.descarrega).toHaveBeenCalledTimes(1);
    const [{ nom, tipus, dades }] = entorn.descarrega.mock.calls[0];
    expect([nom, tipus]).toEqual(['llista-casa.json', 'application/json']);
    expect(importaLlistaCompra(dades).paquet).toEqual(exportaLlistaCompra(emissor(), 'casa'));
    expect(screen.getByText('Fitxer de «Casa» descarregat.')).toBeTruthy();
  });

  /* R16a · La vista es torna a muntar per llista (key): en passar a una altra, ni l'enllaç ni l'avís
     de la d'abans es pinten davall del nom de la nova. */
  test('canviar de llista no arrossega l’enllaç ni el panell de l’altra', async () => {
    const entorn = prepara();
    const ambDues = creaLlista(emissor(), 'Mercadona');
    await entorn.magatzem.desa({ ...ambDues, darreraLlista: 'casa' });
    munta('/app/nevera/llista/casa', entorn);
    fireEvent.click(await screen.findByRole('button', { name: 'Compartix o importa la llista' }));
    const writeText = vi.fn().mockRejectedValue(new Error('No permés'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    fireEvent.click(within(screen.getByRole('group', { name: 'Compartir «Casa»' })).getByRole('button', { name: 'Copia l’enllaç' }));
    await screen.findByRole('textbox', { name: 'Enllaç per a compartir' });
    window.history.pushState(null, '', `/app/nevera/llista/${ambDues.darreraLlista}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Compartir «Casa»' })).toBeNull());
    expect(screen.queryByRole('textbox', { name: 'Enllaç per a compartir' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Compartir «Mercadona»' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Compartix o importa la llista' })).toBeTruthy();
  });

  test('una llista buida no es pot enviar', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa(estatInicial());
    munta('/app/nevera/llista/casa', entorn);
    fireEvent.click(await screen.findByRole('button', { name: 'Compartix o importa la llista' }));
    expect(screen.getByRole('button', { name: 'Copia l’enllaç' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Descarrega el fitxer' }).disabled).toBe(true);
  });
});

describe('les cinc llengües', () => {
  test.each([
    ['es', 'Comparte o importa la lista', 'Lista compartida «Casa» · 3 artículos', 'Añade los elegidos a «Casa»'],
    ['en', 'Share or import the list', 'Shared list “Casa” · 3 items', 'Add the selected items to “Casa”'],
    ['eu', 'Partekatu edo inportatu zerrenda', 'Partekatutako zerrenda «Casa» · 3 artikulu', 'Gehitu aukeratutakoak «Casa» zerrendara'],
    ['gl', 'Comparte ou importa a lista', 'Lista compartida «Casa» · 3 artigos', 'Engade os escollidos a «Casa»']
  ])('%s: la previsualització i el panell seguixen la llengua de la interfície', async (idioma, obri, llegenda, afegix) => {
    const entorn = prepara();
    await entorn.magatzem.desa(estatInicial());
    munta(enllacDe(emissor()), entorn, { language: idioma });
    const grup = await rebuda(llegenda);
    expect(within(grup).getByRole('button', { name: afegix })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: obri }));
    /* Cap text del panell en valencià. */
    for (const valencia of ['Copia l’enllaç', 'Descarrega el fitxer', 'Enllaç o text rebut', 'Revisa la llista rebuda']) {
      expect(screen.queryByText(valencia)).toBeNull();
    }
  });
});
