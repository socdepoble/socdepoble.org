/* Notícies del Poble · IDEA-265 (261118) · la carpeta «Observatori I+D · Mestres», dins de la
   plataforma de veres (RutaApps → AppLector), amb el port del servei de notícies com en producció
   i un servei fals que compta les peticions de cada font:
     · qui no és superadmin no veu la carpeta, no se'n demana res (tampoc si el servei l'envia al
       catàleg), l'enllaç /noticies/observatori no l'obri i un article seu desat en este navegador
       no ix a «Per a després» ni es llig;
     · qui és superadmin la veu només si el catàleg del servei ja declara la font (sense, ni
       carpeta ni avís de font caiguda);
     · qui és superadmin i el servei la declara, la lectura d'un article porta el veredicte en text i «Promou al
       Llibre Mestre» copia la fitxa al porta-retalls i ho diu.
   El superadmin és el booleà del pont de sessió (useSessioApp().esSuperadmin), que la plataforma
   només dona al Lector. Totes les dades són inventades. */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import { RSS_OBSERVATORI } from './__fixtures__/observatori.js';
import { ARA, ENTORN, tancats } from './__fixtures__/muntaLector.jsx';
import AppLector from './AppLector.jsx';
import { creaMagatzemLector } from './magatzem.js';
import manifestLector from './manifest.js';
import { analitzaFeed, estatInicial } from './nucli/index.js';
import { FONT_OBSERVATORI, NOM_OBSERVATORI } from './observatori.js';

const CATALEG = Object.freeze({
  categories: [{ id: 'coneixement', nom: 'Coneixement obert', ordre: 0, icona: 'BookOpen' }],
  fonts: [{ id: 'bloc-pedra', nom: 'El Bloc de la Pedra', categoriaId: 'coneixement', descripcio: 'Guies obertes.', lloc: 'https://example.org/' }]
});
const XML_BLOC = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel><title>El Bloc de la Pedra</title><link>https://example.org/</link><description>Guies</description>
  <item><title>Guia de la paret seca</title><link>https://example.org/guia</link><guid>https://example.org/guia</guid>
    <pubDate>Sat, 03 Oct 2026 08:00:00 GMT</pubDate><description>Les pedres grans a baix.</description></item>
</channel></rss>`;
const TITOL_IDEA = '[PROPOSAR_IDEA_SISTEMA] Memòria cau de fragments & SW';
/* El catàleg d'un servei que ja declara la font de l'observatori. */
const DECLARAT = Object.freeze({
  categories: CATALEG.categories,
  fonts: [...CATALEG.fonts, { id: FONT_OBSERVATORI, nom: 'Del servei', categoriaId: 'altra', descripcio: '', lloc: null }]
});

/* El servei fals, sense xarxa: compta les peticions de cada font. `cataleg`: el que diu GET /fonts. */
function creaServei(cataleg = DECLARAT) {
  const peticions = new Map();
  return {
    peticions,
    fonts: vi.fn(async () => cataleg),
    estat: vi.fn(async () => ({ disponible: true, personals: false })),
    feed: vi.fn(async (id) => {
      peticions.set(id, (peticions.get(id) || 0) + 1);
      return { font: id, xml: id === FONT_OBSERVATORI ? RSS_OBSERVATORI : XML_BLOC, obtingut: null, obsoleta: false };
    })
  };
}

const oberts = [];
async function obriLector(url, servei, { esSuperadmin, estat = null }) {
  const magatzem = creaMagatzemLector({ idb: creaIdbFals().idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
  oberts.push(magatzem);
  if (estat) await magatzem.desa(estat);
  const App = () => <AppLector magatzem={magatzem} ara={() => ARA} />;
  const registre = creaRegistre({ internes: [{ ...manifestLector, carrega: () => Promise.resolve({ default: App }) }] });
  muntaPlataforma(url, {
    registre,
    entorn: { ...ENTORN, serveis: { noticies: servei }, sessio: { estat: 'dins', esSuperadmin } }
  });
}

const arbre = () => within(document.querySelector('#app-grid-sidebar nav.sdp-workspace-column__body'));
const detall = () => within(document.getElementById('app-grid-main'));
const fitxes = () => [...document.getElementById('app-grid-list').querySelectorAll('button.sdp-gestor-fitxa')];
const fitxa = (titol) => fitxes().find((boto) => boto.querySelector('.sdp-gestor-fitxa__titol').textContent === titol);
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  while (oberts.length) oberts.pop().tanca();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  delete window.navigator.clipboard;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('qui no és superadmin', () => {
  test('cap carpeta, cap petició (tampoc si el servei l’envia) i /noticies/observatori no l’obri', async () => {
    const servei = creaServei();
    await obriLector('/app/lector/noticies/observatori', servei, { esSuperadmin: false });
    await waitFor(() => expect(ubicacio()).toBe('/app/lector/noticies/hui'));
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(servei.peticions.get('bloc-pedra')).toBeGreaterThan(0));
    expect(arbre().getByRole('button', { name: /^Coneixement obert/ })).toBeTruthy();
    expect(document.body.textContent).not.toContain('Observatori I+D');
    expect(servei.peticions.has(FONT_OBSERVATORI)).toBe(false);
  });

  test('un article de l’observatori desat en este navegador no ix a «Per a després» ni es llig', async () => {
    const [desat] = analitzaFeed(RSS_OBSERVATORI, { fontId: FONT_OBSERVATORI }).articles;
    const { contingutHtml, ...resum } = desat;
    expect(contingutHtml).toBeTruthy();
    const servei = creaServei();
    await obriLector(`/app/lector/noticies/despres?article=${resum.id}`, servei, {
      esSuperadmin: false, estat: { ...estatInicial(), despres: [resum] }
    });
    await screen.findByText('Esta notícia ja no hi és');
    expect(ubicacio()).toContain('/app/lector/noticies/despres');
    expect(arbre().getByRole('button', { name: /^Per a després/ }).textContent).not.toMatch(/1/);
    expect(fitxes()).toHaveLength(0);
    expect(document.body.textContent).not.toContain('Memòria cau de fragments');
    expect(document.body.textContent).not.toContain('WordPress Mestre');
    expect(servei.peticions.has(FONT_OBSERVATORI)).toBe(false);
  });

  test('un enllaç profund a un article de l’observatori no l’obri ni el demana', async () => {
    const servei = creaServei();
    await obriLector('/app/lector/noticies/hui?article=observatori-mestres-b4b02ba4222c2169', servei, { esSuperadmin: false });
    await screen.findByText('Esta notícia ja no hi és');
    expect(document.body.textContent).not.toContain('Promou al Llibre Mestre');
    expect(servei.peticions.has(FONT_OBSERVATORI)).toBe(false);
  });
});

describe('qui és superadmin', () => {
  test('si el catàleg del servei no declara la font: ni carpeta, ni petició, ni avís de font caiguda', async () => {
    const servei = creaServei(CATALEG);
    await obriLector('/app/lector/noticies/coneixement', servei, { esSuperadmin: true });
    await waitFor(() => expect(fitxa('Guia de la paret seca')).toBeTruthy());
    expect(document.body.textContent).not.toContain('Observatori I+D');
    expect(document.body.textContent).not.toContain('Alguna font no ha contestat');
    expect(servei.peticions.has(FONT_OBSERVATORI)).toBe(false);
  });

  test('la carpeta a l’arbre, el veredicte en text i «Promou al Llibre Mestre» copia la fitxa', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true });
    const servei = creaServei();
    await obriLector('/app/lector/noticies/observatori', servei, { esSuperadmin: true });
    await screen.findByRole('region', { name: NOM_OBSERVATORI });
    expect(arbre().getByRole('button', { name: new RegExp(`^${NOM_OBSERVATORI.replace('+', '\\+')}`) })).toBeTruthy();
    await waitFor(() => expect(fitxa(TITOL_IDEA)).toBeTruthy());
    expect(servei.peticions.get(FONT_OBSERVATORI)).toBe(1);
    fireEvent.click(fitxa(TITOL_IDEA));
    expect(await detall().findByText('Veredicte: Idea de sistema')).toBeTruthy();
    fireEvent.click(detall().getByRole('button', { name: 'Promou al Llibre Mestre' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const [fitxaCopiada] = writeText.mock.calls[0];
    expect(fitxaCopiada).toContain('IDEA-265-OBS · Memòria cau de fragments & SW');
    expect(fitxaCopiada).toContain('[PROPOSAR_IDEA_SISTEMA]');
    const avis = await detall().findByText('Fitxa copiada. Revisa-la i enganxa-la al Llibre Mestre.');
    expect(avis.getAttribute('role')).toBe('status');
  });

  test('sense porta-retalls, ho diu; un article d’una altra font no porta cap veredicte', async () => {
    const servei = creaServei();
    await obriLector('/app/lector/noticies/observatori', servei, { esSuperadmin: true });
    await waitFor(() => expect(fitxa('[DESCARTAR] Soroll')).toBeTruthy());
    fireEvent.click(fitxa('[DESCARTAR] Soroll'));
    expect(await detall().findByText('Veredicte: Descartar')).toBeTruthy();
    fireEvent.click(detall().getByRole('button', { name: 'Promou al Llibre Mestre' }));
    expect(await detall().findByText('No s’ha pogut copiar la fitxa.')).toBeTruthy();
    fireEvent.click(arbre().getByRole('button', { name: /^Coneixement obert/ }));
    await waitFor(() => expect(fitxa('Guia de la paret seca')).toBeTruthy());
    fireEvent.click(fitxa('Guia de la paret seca'));
    await detall().findByRole('heading', { name: 'Guia de la paret seca' });
    expect(detall().queryByText(/^Veredicte:/)).toBeNull();
    expect(detall().queryByRole('button', { name: 'Promou al Llibre Mestre' })).toBeNull();
  });
});
