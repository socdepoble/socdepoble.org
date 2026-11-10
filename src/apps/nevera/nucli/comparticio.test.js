// @vitest-environment node
/* La Nevera de Casa · compartir la llista de la compra (R16-F): anar i
   tornar pel fitxer i per l'enllaç (#compartida=, mai ?compartida=), la
   llista blanca del que es rep i la fusió, que no xafa el que ja hi ha.
   Dades sintètiques: articles de base i propis inventats. */
import { describe, expect, test } from 'vitest';
import {
  ESQUEMA_LLISTA_COMPARTIDA, MAX_TESTIMONI_ENLLAC, MAX_TEXT_COMPARTIT, PREFIX_FRAGMENT_COMPARTIDA, enllacLlistaCompartida,
  exportaLlistaCompra, fusionaLlistaCompartida, importaLlistaCompra, serialitzaLlistaCompartida
} from './comparticio.js';
import { ARTICLES_PRODUCTES, LIMITS, afig, afigPerNom, creaLlista, estatInicial } from './index.js';

const RUTA = '/app/nevera/llista';
const PRODUCTE = ARTICLES_PRODUCTES[0];

/* La llista «Casa» amb un article de base, un producte de botiga i un propi. */
function estatQueComparteix() {
  let estat = afig(estatInicial(), 'casa', 'tomaques', { especificacio: '1 kg de pera' });
  estat = afig(estat, 'casa', PRODUCTE.id);
  return afigPerNom(estat, 'casa', 'Kombutxa de gingebre', { especificacio: '2 ampolles' });
}

const testimoniDe = (url) => url.slice(url.indexOf(PREFIX_FRAGMENT_COMPARTIDA) + PREFIX_FRAGMENT_COMPARTIDA.length);
const codifica = (objecte) => btoa(JSON.stringify(objecte)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const linies = (estat, llistaId = 'casa') => estat.llistes.find((l) => l.id === llistaId).linies;

describe('exportar', () => {
  test('el paquet porta el títol i, per a cada línia, l’id del catàleg o el nom del propi', () => {
    const paquet = exportaLlistaCompra(estatQueComparteix(), 'casa');
    expect(paquet.esquema).toBe(ESQUEMA_LLISTA_COMPARTIDA);
    expect(paquet.titol).toBe('Casa');
    expect(paquet.linies).toEqual([
      { articleId: 'tomaques', nom: 'Tomaques', especificacio: '1 kg de pera' },
      { articleId: PRODUCTE.id, nom: PRODUCTE.nom, especificacio: '' },
      { articleId: null, nom: 'Kombutxa de gingebre', especificacio: '2 ampolles' }
    ]);
    expect(exportaLlistaCompra(estatInicial(), 'no-hi-es')).toBeNull();
  });

  test('l’enllaç porta la llista al fragment, mai a la consulta, i un article del catàleg hi va només amb l’id', () => {
    const enllac = enllacLlistaCompartida(exportaLlistaCompra(estatQueComparteix(), 'casa'), `${RUTA}#vell`);
    expect(enllac.ok).toBe(true);
    expect(enllac.url.startsWith(`${RUTA}${PREFIX_FRAGMENT_COMPARTIDA}`)).toBe(true);
    expect(enllac.url).not.toContain('?');
    expect(enllac.url).not.toContain('#vell');
    expect(testimoniDe(enllac.url)).toMatch(/^[A-Za-z0-9_-]+$/);
    const compacte = JSON.parse(atob(testimoniDe(enllac.url).replace(/-/g, '+').replace(/_/g, '/')));
    expect(compacte).toEqual({
      v: 1, t: 'Casa', l: [['tomaques', '', '1 kg de pera'], [PRODUCTE.id], ['', 'Kombutxa de gingebre', '2 ampolles']]
    });
  });

  test('una llista que no cap en un enllaç ho diu (cal el fitxer)', () => {
    let estat = estatInicial();
    for (let i = 0; i < LIMITS.linies; i += 1) estat = afigPerNom(estat, 'casa', `Article propi ${i} ${'x'.repeat(30)}`, { especificacio: 'y'.repeat(LIMITS.especificacio) });
    const paquet = exportaLlistaCompra(estat, 'casa');
    expect(paquet.linies).toHaveLength(LIMITS.linies);
    expect(enllacLlistaCompartida(paquet, RUTA)).toEqual({ ok: false, codi: 'massa-llarga' });
    expect(serialitzaLlistaCompartida(paquet).length).toBeLessThan(MAX_TEXT_COMPARTIT);
    expect(importaLlistaCompra(serialitzaLlistaCompartida(paquet)).paquet.linies).toHaveLength(LIMITS.linies);
    expect(MAX_TESTIMONI_ENLLAC).toBeLessThan(MAX_TEXT_COMPARTIT);
  });
});

describe('importar', () => {
  test('anar i tornar: el fitxer, l’enllaç sencer, el fragment sol i el testimoni sol donen el mateix paquet', () => {
    const paquet = exportaLlistaCompra(estatQueComparteix(), 'casa');
    const { url } = enllacLlistaCompartida(paquet, `https://exemple.invalid${RUTA}`);
    for (const entrada of [serialitzaLlistaCompartida(paquet), url, ` ${url}\n`, url.slice(url.indexOf('#')), testimoniDe(url)]) {
      const resultat = importaLlistaCompra(entrada);
      expect(resultat.ok, entrada.slice(0, 40)).toBe(true);
      expect(resultat.paquet).toEqual(paquet);
    }
  });

  test('UTF-8 sencer: accents, apòstrofs i emoticones arriben igual', () => {
    const estat = afigPerNom(estatInicial(), 'casa', 'Pésols d’horta 🌱', { especificacio: 'un grapat, ½ kg' });
    const { url } = enllacLlistaCompartida(exportaLlistaCompra(estat, 'casa'), RUTA);
    expect(importaLlistaCompra(url).paquet.linies).toEqual([{ articleId: null, nom: 'Pésols d’horta 🌱', especificacio: 'un grapat, ½ kg' }]);
  });

  test('el que no és una llista compartida es rebutja amb un codi, sense llançar', () => {
    expect(importaLlistaCompra('')).toEqual({ ok: false, codi: 'buit' });
    expect(importaLlistaCompra('   ')).toEqual({ ok: false, codi: 'buit' });
    expect(importaLlistaCompra(null)).toEqual({ ok: false, codi: 'buit' });
    expect(importaLlistaCompra('x'.repeat(MAX_TEXT_COMPARTIT + 1))).toEqual({ ok: false, codi: 'massa-gran' });
    expect(importaLlistaCompra('{ això no és JSON')).toEqual({ ok: false, codi: 'format' });
    expect(importaLlistaCompra('#compartida=no és base64!')).toEqual({ ok: false, codi: 'format' });
    expect(importaLlistaCompra(`#compartida=${codifica({ esquema: 'altra.cosa', linies: [] })}`)).toEqual({ ok: false, codi: 'format' });
    expect(importaLlistaCompra('{"esquema":"sdp.nevera.copia.v1","dades":{}}')).toEqual({ ok: false, codi: 'format' });
    expect(importaLlistaCompra('[1,2,3]')).toEqual({ ok: false, codi: 'format' });
    /* Un testimoni que no és UTF-8 (0xFF sol). */
    expect(importaLlistaCompra('_w')).toEqual({ ok: false, codi: 'format' });
    expect(importaLlistaCompra(JSON.stringify({ esquema: ESQUEMA_LLISTA_COMPARTIDA, linies: [{ nom: '   ' }, 7, null] }))).toEqual({ ok: false, codi: 'sense-articles' });
  });

  test('l’enllaç vell amb ?compartida= no s’accepta: la llista només viatja al fragment', () => {
    const { url } = enllacLlistaCompartida(exportaLlistaCompra(estatQueComparteix(), 'casa'), RUTA);
    expect(importaLlistaCompra(url.replace('#compartida=', '?compartida='))).toEqual({ ok: false, codi: 'format' });
  });

  test('llista blanca: mana el nom del catàleg, el text es neteja i es talla, i cap clau de més passa', () => {
    /* La primera línia porta una clau «__proto__» de veres, com la deixa JSON.parse. */
    const resultat = importaLlistaCompra(JSON.stringify({
      esquema: ESQUEMA_LLISTA_COMPARTIDA,
      titol: `  Mercat\u0007 del dijous ${'z'.repeat(100)}`,
      linies: [
        { articleId: 'tomaques', nom: 'Un altre nom que no es veu', especificacio: '<b>1 kg</b>', preu: 999, proto: { contaminat: true } },
        { articleId: 'p-77', nom: '  Kombutxa\u{200B} de gingebre ', especificacio: 'e'.repeat(200) },
        { articleId: 'tomaques' },
        { nom: 'KOMBUTXA DE GINGEBRE' },
        { nom: 'n'.repeat(200) }
      ]
    }).replace('"proto":', '"__proto__":'));
    expect(resultat.ok).toBe(true);
    const { paquet } = resultat;
    expect([...paquet.titol].length).toBeLessThanOrEqual(LIMITS.nom);
    expect(paquet.titol.startsWith('Mercat del dijous')).toBe(true);
    expect(paquet.linies[0]).toEqual({ articleId: 'tomaques', nom: 'Tomaques', especificacio: '<b>1 kg</b>' });
    expect(paquet.linies[1]).toEqual({ articleId: null, nom: 'Kombutxa de gingebre', especificacio: 'e'.repeat(LIMITS.especificacio) });
    expect(paquet.linies[2]).toEqual({ articleId: null, nom: 'n'.repeat(LIMITS.nom), especificacio: '' });
    expect(paquet.linies).toHaveLength(3);
    expect(Object.keys(paquet.linies[0])).toEqual(['articleId', 'nom', 'especificacio']);
    expect({}.contaminat).toBeUndefined();
    expect(Object.isFrozen(paquet) && Object.isFrozen(paquet.linies) && Object.isFrozen(paquet.linies[0])).toBe(true);
  });

  test('com a molt LIMITS.linies línies, també si el paquet en porta més', () => {
    const l = Array.from({ length: LIMITS.linies + 50 }, (_, i) => ['', `Propi ${i}`]);
    expect(importaLlistaCompra(codifica({ v: 1, t: 'Gran', l })).paquet.linies).toHaveLength(LIMITS.linies);
  });
});

describe('fusionar', () => {
  test('afig el que falta (pel catàleg o pel nom), conserva el que ja hi és amb la seua especificació i no toca les altres llistes', () => {
    const { paquet } = importaLlistaCompra(enllacLlistaCompartida(exportaLlistaCompra(estatQueComparteix(), 'casa'), RUTA).url);
    let rep = creaLlista(estatInicial(), 'Mercat');
    rep = afig(rep, 'casa', 'tomaques', { especificacio: 'les de penjar' });
    const resultat = fusionaLlistaCompartida(rep, 'casa', paquet);
    expect(resultat).toMatchObject({ afegits: 2, conservats: 1, descartats: 0 });
    const propi = resultat.estat.propis.find((p) => p.nom === 'Kombutxa de gingebre');
    expect(propi).toBeTruthy();
    expect(linies(resultat.estat)).toEqual([
      { articleId: 'tomaques', especificacio: 'les de penjar' },
      { articleId: PRODUCTE.id, especificacio: '' },
      { articleId: propi.id, especificacio: '2 ampolles' }
    ]);
    expect(linies(resultat.estat, 'l-1')).toEqual([]);
    /* Una segona vegada no canvia res: tot hi és. */
    const segona = fusionaLlistaCompartida(resultat.estat, 'casa', paquet);
    expect(segona).toMatchObject({ afegits: 0, conservats: 3, descartats: 0 });
    expect(segona.estat).toBe(resultat.estat);
  });

  test('un propi que ja existix amb el mateix nom no se’n crea cap altre', () => {
    const rep = afigPerNom(estatInicial(), 'casa', 'kombutxa de gingebre');
    const { paquet } = importaLlistaCompra(serialitzaLlistaCompartida(exportaLlistaCompra(estatQueComparteix(), 'casa')));
    const resultat = fusionaLlistaCompartida(rep, 'casa', paquet);
    expect(resultat.estat.propis).toHaveLength(1);
    expect(resultat.conservats).toBe(1);
  });

  test('el que no hi cap es descarta sencer: cap línia ni cap propi orfe', () => {
    /* La llista plena de productes de botiga: hi ha lloc per a propis, però no per a línies. */
    let rep = estatInicial();
    for (const producte of ARTICLES_PRODUCTES.slice(0, LIMITS.linies)) rep = afig(rep, 'casa', producte.id);
    expect(linies(rep)).toHaveLength(LIMITS.linies);
    const { paquet } = importaLlistaCompra(codifica({ v: 1, t: 'x', l: [['tomaques'], ['', 'Article nou del bancal']] }));
    const resultat = fusionaLlistaCompartida(rep, 'casa', paquet);
    expect(resultat).toMatchObject({ afegits: 0, conservats: 0, descartats: 2 });
    expect(resultat.estat).toBe(rep);
    expect(resultat.estat.propis).toEqual([]);
  });

  test('una llista que no existix o un paquet que no ho és no canvien res', () => {
    const rep = estatInicial();
    const { paquet } = importaLlistaCompra(codifica({ v: 1, t: 'x', l: [['tomaques']] }));
    expect(fusionaLlistaCompartida(rep, 'no-hi-es', paquet)).toEqual({ estat: rep, afegits: 0, conservats: 0, descartats: 0 });
    expect(fusionaLlistaCompartida(rep, 'casa', null).estat).toBe(rep);
    expect(fusionaLlistaCompartida(rep, 'casa', { linies: 'no' }).estat).toBe(rep);
  });

  test('la vista pot passar un paquet triat a mà: torna a passar per la llista blanca', () => {
    const rep = estatInicial();
    const resultat = fusionaLlistaCompartida(rep, 'casa', { linies: [{ articleId: 'llet', nom: 'Un altre nom' }, { nom: '\u0000' }, { nom: 'Xirivia del bancal' }] });
    expect(resultat.afegits).toBe(2);
    expect(linies(resultat.estat).map((l) => l.articleId)).toEqual(['llet', resultat.estat.propis[0].id]);
    expect(resultat.estat.propis.map((p) => p.nom)).toEqual(['Xirivia del bancal']);
  });
});
