/* Notícies del Poble · el bloc «Notícies germanes» al final de la lectura (IDEA-30; B6-C de la marató
   261101_2143; D-5a per defecte: un bloc, només quan n'hi ha). Dins de la plataforma de veres, amb la
   llavor sintètica i dues fonts INVENTADES més (feeds RSS d'example.org) que parlen del mateix fet.
     · un article amb una germana: l'h3, una línia d'ajuda i un <article> pla per germana (h4 amb
       l'enllaç a …/noticies/totes?article=<id>, la font i la data, l'extracte), sense cap classe ni
       imatge; darrere de «Visita el lloc web»;
     · seguir l'enllaç obri la germana, que torna l'article de partida com a germana seua;
     · un article sense germanes: cap node nou (l'últim fill de la pàgina és «Visita el lloc web»), i el
       detall és idèntic al de la llavor tal qual;
     · una font que la persona no seguix no dona germanes. */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ARA, munta, prepara, tancats } from './__fixtures__/muntaLector.jsx';
import { FONTS_LLAVOR } from './llavor/cataleg.js';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';

const MACRO = 'La macrourbanització del pantà de Beniarrés torna al ple';
const ALLEGACIONS = 'Al·legacions contra la urbanització del pantà de Beniarrés';
const LLAVADOR = 'El ple aprova la reforma del llavador vell';
const GERMANES = 'Notícies germanes';

const feed = (id, titol, items) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${titol}</title>
    <link>https://example.org/${id}/</link>
    <description>Font inventada per a les proves.</description>
    ${items.map(([clau, titolItem, data, resum]) => `<item>
      <title>${titolItem}</title>
      <link>https://example.org/${id}/${clau}</link>
      <guid isPermaLink="false">${id}-${clau}</guid>
      <pubDate>${data}</pubDate>
      <description>${resum}</description>
    </item>`).join('\n    ')}
  </channel>
</rss>`;

const VEU_VALL = Object.freeze({
  id: 'veu-vall', nom: 'La Veu de la Vall', categoriaId: 'ajuntament', descripcio: 'Font inventada.',
  xml: feed('veu-vall', 'La Veu de la Vall', [
    ['macro', MACRO, 'Fri, 02 Oct 2026 08:00:00 +0200', 'Els veïns demanen aturar la macrourbanització al costat del pantà.']
  ])
});
const COLLA_TERRA = Object.freeze({
  id: 'colla-terra', nom: 'Colla de la Terra', categoriaId: 'camp', descripcio: 'Font inventada.',
  xml: feed('colla-terra', 'Colla de la Terra', [
    ['allegacions', ALLEGACIONS, 'Thu, 01 Oct 2026 19:00:00 +0200', 'La colla presenta al·legacions contra la macrourbanització.']
  ])
});
const FONTS = Object.freeze([...FONTS_LLAVOR, VEU_VALL, COLLA_TERRA]);

const ambGermanes = () => creaAdaptadorLlavor({ ara: ARA, fonts: FONTS });
async function idDe(fontId, adaptador = ambGermanes()) {
  const [article] = await adaptador.llistaArticles({ fontId });
  return article.id;
}

const detall = () => document.getElementById('app-grid-main');
/* El detall serialitzat (atributs, text i estructura), per a comparar-lo sencer. */
const serialitzat = (node) => new XMLSerializer().serializeToString(node);
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const titolsDeLaLlista = () => [...document.getElementById('app-grid-list').querySelectorAll('.sdp-gestor-fitxa__titol')]
  .map((titol) => titol.textContent);
async function obri(id, titol, entorn) {
  munta(`/app/lector/noticies/totes?article=${id}`, entorn);
  const h1 = await screen.findByRole('heading', { level: 1, name: titol });
  /* La llista ja és a punt: les germanes ixen de les notícies carregades. */
  await waitFor(() => expect(titolsDeLaLlista().length).toBeGreaterThan(0));
  return h1;
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('amb germanes', () => {
  test('el bloc al final de la lectura: h3, una línia, la germana amb enllaç intern, la font i cap imatge', async () => {
    const [macro, allegacions] = [await idDe('veu-vall'), await idDe('colla-terra')];
    await obri(macro, MACRO, prepara({ adaptador: ambGermanes() }));
    const h3 = await within(detall()).findByRole('heading', { level: 3, name: GERMANES });
    const pagina = h3.closest('article.content-wrapper');
    expect(pagina).not.toBeNull();
    /* Al final: darrere de «Visita el lloc web». */
    const visita = within(pagina).getByRole('link', { name: /Visita el lloc web/ });
    expect(visita.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(h3.nextElementSibling.tagName).toBe('P');
    expect(h3.nextElementSibling.textContent).toBe('Altres fonts que pareixen parlar del mateix fet, triades pel títol i la data.');
    /* Una sola germana: un <article> pla, l'últim fill de la pàgina, amb h4, la font i la data i l'extracte. */
    const resultats = [...pagina.querySelectorAll('article')];
    expect(resultats).toHaveLength(1);
    const [resultat] = resultats;
    expect(pagina.lastElementChild).toBe(resultat);
    expect([...resultat.children].map((fill) => fill.tagName)).toEqual(['H4', 'P', 'P']);
    expect(within(resultat).getByRole('heading', { level: 4 }).textContent).toBe(ALLEGACIONS);
    const enllac = within(resultat).getByRole('link', { name: ALLEGACIONS });
    expect(enllac.getAttribute('href')).toBe(`/app/lector/noticies/totes?article=${allegacions}`);
    expect(enllac.getAttribute('target')).toBeNull();
    expect(resultat.children[1].textContent).toMatch(/^Colla de la Terra · \d{1,2} d’octubre$/);
    expect(resultat.children[2].textContent).toBe('La colla presenta al·legacions contra la macrourbanització.');
    /* Cap classe nova (Pedra Seca: la tipografia editorial de l'article) i cap imatge. */
    expect([resultat, ...resultat.querySelectorAll('*')].filter((node) => node.hasAttribute('class'))).toEqual([]);
    expect(pagina.querySelectorAll('img')).toHaveLength(0);
  });

  test('seguir l’enllaç obri la germana a «Totes», i la germana torna l’article de partida', async () => {
    const [macro, allegacions] = [await idDe('veu-vall'), await idDe('colla-terra')];
    await obri(macro, MACRO, prepara({ adaptador: ambGermanes() }));
    await within(detall()).findByRole('heading', { level: 3, name: GERMANES });
    fireEvent.click(within(detall()).getByRole('link', { name: ALLEGACIONS }));
    await screen.findByRole('heading', { level: 1, name: ALLEGACIONS });
    expect(ubicacio()).toBe(`/app/lector/noticies/totes?article=${allegacions}`);
    await within(detall()).findByRole('heading', { level: 3, name: GERMANES });
    const enllac = within(detall()).getByRole('link', { name: MACRO });
    expect(enllac.getAttribute('href')).toBe(`/app/lector/noticies/totes?article=${macro}`);
  });
});

describe('sense germanes, la lectura de sempre', () => {
  test('un article de la llavor: cap h3 «Notícies germanes», cap resultat i el detall idèntic al de la llavor tal qual', async () => {
    const llavador = (await creaAdaptadorLlavor({ ara: ARA }).llistaArticles({ fontId: 'veu-placa' }))
      .find((article) => article.titol === LLAVADOR).id;
    await obri(llavador, LLAVADOR, prepara());
    /* La paritat amb HEAD: sense germanes, l'últim fill de la pàgina és el paràgraf de «Visita el lloc
       web» de sempre (cap node buit ni amagat darrere). La comparació serialitzada d'avall és codi nou
       contra codi nou i, sola, no ho garantiria. */
    const final = detall().querySelector('article.content-wrapper').lastElementChild;
    expect(final.tagName).toBe('P');
    expect(final.textContent).toMatch(/^Visita el lloc web/);
    const abans = serialitzat(detall());
    cleanup();
    while (tancats.length) tancats.pop().tanca();
    window.history.replaceState(null, '', '/');

    await obri(llavador, LLAVADOR, prepara({ adaptador: ambGermanes() }));
    /* Les fonts noves hi són (la llista les porta), però l'article no en té cap de germana. */
    await waitFor(() => expect(titolsDeLaLlista()).toContain(MACRO));
    expect(within(detall()).queryByRole('heading', { name: GERMANES })).toBeNull();
    const pagina = detall().querySelector('article.content-wrapper');
    expect(pagina.querySelector('article')).toBeNull();
    expect(pagina.lastElementChild.textContent).toMatch(/^Visita el lloc web/);
    expect(serialitzat(detall())).toBe(abans);
  });

  test('una font que no se seguix no dona germanes', async () => {
    const macro = await idDe('veu-vall');
    const entorn = prepara({ adaptador: ambGermanes() });
    await entorn.magatzem.desa({ llegits: [], despres: [], noSeguides: ['colla-terra'] });
    await obri(macro, MACRO, entorn);
    await waitFor(() => expect(titolsDeLaLlista()).toContain(LLAVADOR));
    expect(titolsDeLaLlista()).not.toContain(ALLEGACIONS);
    expect(within(detall()).queryByRole('heading', { name: GERMANES })).toBeNull();
  });
});
