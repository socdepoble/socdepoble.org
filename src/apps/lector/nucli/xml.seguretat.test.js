// @vitest-environment node
/* Gauntlet 261025_0545 (RX-M2) · nsNet llevava les barres finals d'un espai de
   noms amb /\/+$/: amb una tira llarga de «/» que no acaba el valor, tornava a
   recórrer la tira des de cada barra (quadràtic). llegixXml la crida per a cada
   xmlns del feed, al fil principal: un xmlns de 250 KB eren més de 20 s. Ara és
   lineal i torna exactament el mateix que l'expressió d'abans. */
import { describe, expect, test } from 'vitest';
import { analitzaFeed } from './analitzador.js';
import { NS, llegixXml, nsNet } from './xml.js';

/* L'expressió d'abans, només com a oracle de la prova. */
const nsNetDAbans = (uri) => String(uri ?? '').trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/\/+$/, '');

/* Un generador determinista (LCG): la mateixa sèrie en cada execució. */
function generador(llavor) {
  let estat = llavor >>> 0;
  return (maxim) => {
    estat = (Math.imul(estat, 1664525) + 1013904223) >>> 0;
    return estat % maxim;
  };
}

/* Tots els textos fets d'entre 0 i `maxim` trossos, i `quantitat` d'aleatoris més llargs. */
function textos(trossos, maxim, quantitat, llargariaMaxima, llavor) {
  let nivell = [''];
  const tots = [''];
  for (let n = 1; n <= maxim; n += 1) {
    nivell = nivell.flatMap((text) => trossos.map((tros) => text + tros));
    for (const text of nivell) tots.push(text);
  }
  const atzar = generador(llavor);
  for (let k = 0; k < quantitat; k += 1) {
    let text = '';
    for (let i = atzar(llargariaMaxima + 1); i > 0; i -= 1) text += trossos[atzar(trossos.length)];
    tots.push(text);
  }
  return tots;
}

describe('RX-M2 · nsNet és lineal', () => {
  test('un espai de noms de 100.000 barres i una lletra: menys d’1 s', () => {
    const uri = `${'/'.repeat(100000)}x`;
    const inici = performance.now();
    expect(nsNet(uri)).toBe(uri);
    expect(nsNet(`https://${uri}`)).toBe(uri);
    expect(nsNet(`${uri}${'/'.repeat(1000)}`)).toBe(uri);
    expect(performance.now() - inici).toBeLessThan(1000);
  });

  test('pel feed sencer: cinc items amb un xmlns de 60 KB cada un, menys d’1 s', () => {
    const items = Array.from({ length: 5 }, (_, i) => `<item xmlns:z="${'/'.repeat(60000)}x"><title>t${i}</title><link>https://example.org/${i}</link></item>`).join('');
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>t</title><link>https://example.org/</link>${items}</channel></rss>`;
    const inici = performance.now();
    const { articles } = analitzaFeed(xml, { fontId: 'f', base: 'https://example.org/feed' });
    expect(performance.now() - inici).toBeLessThan(1000);
    expect(articles).toHaveLength(5);
  });

  test('torna el mateix que l’expressió d’abans en tots els textos curts i en milers d’aleatoris', () => {
    const trossos = ['/', '//', 'a', 'Z', ' ', '\t', '\n', 'http://', 'HTTPS://', 'x+.-:', ':', '://', '9', String.fromCharCode(0xA0), String.fromCharCode(0x2028)];
    const valors = [...textos(trossos, 4, 20000, 14, 20261025), null, undefined, 0, 12, ' https:// ', 'https://www.w3.org/2005/Atom/'];
    expect(valors.length).toBeGreaterThan(70000);
    expect(valors.filter((valor) => nsNet(valor) !== nsNetDAbans(valor))).toEqual([]);
  });

  test('els espais de noms dels feeds es resolen com sempre', () => {
    const { arrel } = llegixXml('<feed xmlns="https://www.w3.org/2005/Atom//"><title>t</title></feed>');
    expect(arrel.ns).toBe(NS.atom);
    expect(nsNet('HTTP://purl.org/rss/1.0/modules/content/')).toBe(NS.content);
  });
});
