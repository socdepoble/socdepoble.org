/* Gauntlet 261025_0545 (RX-04) · segmentaEnllacos llevava la puntuació final
   d'una adreça amb /[.,;:!?)\]}]+$/, sense àncora a l'esquerra: amb una tira
   llarga de punts que no acaba l'adreça, la tornava a recórrer des de cada punt
   (quadràtic). Cada bombolla ho paga en muntar-se i la cerca amb el filtre
   d'Enllaços, a cada tecla per a cada missatge carregat. Ara és lineal i
   segmenta exactament igual que abans. */
import { describe, expect, test } from 'vitest';
import { segmentaEnllacos, segmentaRutesDeLaWiki } from './enllacos.js';

/* La segmentació d'abans, només com a oracle de la prova. */
function segmentaDAbans(text) {
  const font = String(text ?? '');
  if (!font) return [];
  const segments = [];
  let ultim = 0;
  for (const coincidencia of font.matchAll(/https?:\/\/[^\s<>"'`]+/gi)) {
    let brut = coincidencia[0];
    const inici = coincidencia.index;
    const cua = brut.match(/[.,;:!?)\]}]+$/);
    if (cua) brut = brut.slice(0, brut.length - cua[0].length);
    let url;
    try {
      url = new URL(brut);
    } catch {
      continue;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:' || !url.hostname) continue;
    if (inici > ultim) segments.push({ tipus: 'text', text: font.slice(ultim, inici) });
    const sospitos = url.hostname.toLowerCase().split('.').some((part) => part.startsWith('xn--'));
    segments.push({ tipus: 'enllac', text: brut, href: url.href, host: url.hostname, sospitos });
    ultim = inici + brut.length;
  }
  if (ultim < font.length) segments.push({ tipus: 'text', text: font.slice(ultim) });
  return segments;
}

/* Un generador determinista (LCG): la mateixa sèrie en cada execució. */
function generador(llavor) {
  let estat = llavor >>> 0;
  return (maxim) => {
    estat = (Math.imul(estat, 1664525) + 1013904223) >>> 0;
    return estat % maxim;
  };
}

describe('RX-04 · la puntuació final d’una adreça es lleva en temps lineal', () => {
  test('una adreça de 100.000 caràcters amb una tira de punts pel mig: menys d’1 s', () => {
    const tira = '.'.repeat(100000);
    const inici = performance.now();
    const [enllac] = segmentaEnllacos(`http://a.b/${tira}x`);
    const segments = segmentaEnllacos(`Mira http://a.b/${')'.repeat(100000)}x${tira}`);
    expect(performance.now() - inici).toBeLessThan(1000);
    expect(enllac).toMatchObject({ tipus: 'enllac', text: `http://a.b/${tira}x`, host: 'a.b' });
    expect(segments.map((segment) => segment.tipus)).toEqual(['text', 'enllac', 'text']);
    expect(segments[2].text).toBe(tira);
  });

  test('500 missatges del màxim (4096 caràcters) amb la tira: menys d’1 s', () => {
    const missatge = `http://a.b/${'.'.repeat(4096 - 12)}x`;
    const inici = performance.now();
    for (let i = 0; i < 500; i += 1) segmentaEnllacos(missatge);
    expect(performance.now() - inici).toBeLessThan(1000);
  });

  test('segmenta igual que abans en milers de missatges amb adreces i puntuació', () => {
    const trossos = ['http://a.b/', 'https://x.cat', 'HTTP://Q.ES/', 'http://xn--pple-43d.com/', '.', ',', ';', ':', '!', '?', ')', ']', '}',
      '(', '[', '{', 'a', '/', ' ', '\n', '"', '<', '%', '#', '?q=1', 'http://', 'x.', '/wikidepoble?item=p'];
    const atzar = generador(20261025);
    const missatges = [];
    for (let k = 0; k < 20000; k += 1) {
      let missatge = '';
      for (let i = atzar(14); i > 0; i -= 1) missatge += trossos[atzar(trossos.length)];
      missatges.push(missatge);
    }
    for (const a of trossos) for (const b of trossos) for (const c of trossos) missatges.push(`http://a.b/${a}${b}${c}`);
    expect(missatges.length).toBeGreaterThan(40000);
    const distints = missatges.filter((missatge) => JSON.stringify(segmentaEnllacos(missatge)) !== JSON.stringify(segmentaDAbans(missatge)));
    expect(distints).toEqual([]);
    expect(segmentaRutesDeLaWiki(segmentaEnllacos('Mira /wikidepoble?item=x. i http://a.b/c).'))).toEqual(segmentaRutesDeLaWiki(segmentaDAbans('Mira /wikidepoble?item=x. i http://a.b/c).')));
  });
});
