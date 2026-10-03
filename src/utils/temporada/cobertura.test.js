// @vitest-environment node
/* Temporada · la cobertura sobre noms de veres, i la frontera de privacitat.
   · La Nevera ja integra la temporada: els invariants dels seus articles de
     base viuen a src/apps/nevera/vistes/perTemporada.test.js. Ací no queda
     cap import de cap app.
   · La llista de Mercadona del Mestre (01_produccio, zona humana, només
     lectura). El CSV és a l'índex de git: on hi haja el repositori, la prova
     corre; si el fitxer no hi és, se salta. Cap recompte de files fixat (el
     Mestre la reexporta quan vol), només invariants, i cap missatge d'error
     no mostra res de la llista: només xifres o fitxer:línia.
   · La frontera: cap denominació de la llista no es copia al mòdul. Els
     exemples (els literals de les proves i les cites «» dels comentaris) són
     noms inventats que posen a prova la mateixa regla, i ho vigila el
     detector de baix. El vocabulari de dades.js (sinònims en valencià i en
     castellà) és genèric de catàleg i no es comprova: una denominació comercial
     corrent hi pot coincidir, i cap dada de cap casa hi va. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { temporadaDe } from './index.js';
import { normalitza } from './paraules.js';

const ARREL = process.cwd();
const CARPETA = 'src/utils/temporada';
const CSV = '_wiki_de_poble/04_escriptori/01_produccio/mercadona/Llista de la compra - Mercadona.csv';
const HI_HA_CSV = existsSync(path.join(ARREL, CSV));
const FRUITA_I_VERDURA = 'Fruta y verdura';
/* La proporció mínima de la fruita i la verdura de la llista que ha de casar
   (el 261003 en casaven prop de tres quarts): marge per a tropicals nous. */
const COBERTURA_MINIMA = 0.6;

/* Els camps d'una línia de CSV: comes dins de cometes i "" com a cometa. */
function campsDe(linia) {
  const camps = [];
  let camp = '';
  let dins = false;
  for (let i = 0; i < linia.length; i += 1) {
    const c = linia[i];
    if (dins && c === '"' && linia[i + 1] === '"') {
      camp += '"';
      i += 1;
    } else if (c === '"') {
      dins = !dins;
    } else if (c === ',' && !dins) {
      camps.push(camp);
      camp = '';
    } else {
      camp += c;
    }
  }
  camps.push(camp);
  return camps;
}

/* Les files de producte del CSV, { categoria, nom }: les que porten les dues
   coses (les capçaleres de categoria no porten nom). null si falten columnes. */
function productesDelCsv() {
  const linies = readFileSync(path.join(ARREL, CSV), 'utf8').split(/\r?\n/);
  const capcalera = campsDe(linies[0] || '');
  const iCategoria = capcalera.indexOf('Categoria');
  const iProducte = capcalera.indexOf('Producte');
  if (iCategoria < 0 || iProducte < 0) return null;
  return linies.slice(1).map(campsDe)
    .map((camps) => ({ categoria: (camps[iCategoria] || '').trim(), nom: (camps[iProducte] || '').trim() }))
    .filter((fila) => fila.categoria && fila.nom);
}

describe.skipIf(!HI_HA_CSV)('Mercadona: la llista del Mestre (només xifres)', () => {
  const productes = HI_HA_CSV ? productesDelCsv() : null;
  const fruitaVerdura = (productes || []).filter((fila) => fila.categoria === FRUITA_I_VERDURA);
  const altres = (productes || []).filter((fila) => fila.categoria !== FRUITA_I_VERDURA);

  test('el CSV té les columnes Categoria i Producte, i files dins i fora de fruita i verdura', () => {
    expect(productes === null).toBe(false);
    expect(fruitaVerdura.length).toBeGreaterThan(0);
    expect(altres.length).toBeGreaterThan(0);
  });

  test(`de la fruita i la verdura, en casa almenys el ${COBERTURA_MINIMA * 100} %`, () => {
    const casats = fruitaVerdura.filter((fila) => temporadaDe(fila.nom)).length;
    expect(casats / fruitaVerdura.length).toBeGreaterThanOrEqual(COBERTURA_MINIMA);
  });

  test('cap producte de les altres categories (conserves, plats, aperitius…) té temporada', () => {
    expect(altres.filter((fila) => temporadaDe(fila.nom)).length).toBe(0);
  });
});

/* Els literals d'un codi, normalitzats i amb la línia: entre cometes simples,
   dobles o inverses (sense interpolació), i entre «», que és com els comentaris
   citen els noms. L'apòstrof entre dues lletres («d'una») és d'un comentari o
   d'un text entre cometes dobles: es canvia per ’ perquè no obriga un literal. */
const CITES = /«([^»\n]*)»/g;
const LITERALS = [/'((?:[^'\\\n]|\\.)*)'/g, /"((?:[^"\\\n]|\\.)*)"/g, /`((?:[^`\\$]|\\.)*)`/g, CITES];
function literalsDe(codi, patrons) {
  const net = codi.replace(/(\p{L})'(?=\p{L})/gu, '$1’');
  return patrons.flatMap((patro) => [...net.matchAll(patro)].map((m) => ({
    text: normalitza(m[1]),
    linia: net.slice(0, m.index).split('\n').length
  })));
}

/* Les línies d'un fitxer amb una denominació copiada: un exemple de dues
   paraules o més que és el nom d'un producte de la llista, o, en una prova, un
   de tres o més que n'és un tros. Exemples: en una prova, tots els literals; en
   la producció, les cites «». Torna només fitxer:línia. */
function copiesDe(fitxer, codi, noms) {
  const entre = [...noms].map((nom) => ` ${nom} `);
  const esProva = /\.test\.jsx?$/.test(fitxer);
  return literalsDe(codi, esProva ? LITERALS : [CITES]).filter(({ text }) => {
    const mida = text ? text.split(' ').length : 0;
    if (mida >= 2 && noms.has(text)) return true;
    return esProva && mida >= 3 && entre.some((nom) => nom.includes(` ${text} `));
  }).map(({ linia }) => `${fitxer}:${linia}`);
}

describe.skipIf(!HI_HA_CSV)('la frontera: cap denominació de la llista al mòdul', () => {
  const noms = new Set(HI_HA_CSV ? (productesDelCsv() || []).map((fila) => normalitza(fila.nom)).filter(Boolean) : []);

  test('cap fitxer de la carpeta copia el nom d’un producte de la llista', () => {
    expect(noms.size).toBeGreaterThan(0);
    const fitxers = readdirSync(path.join(ARREL, CARPETA)).filter((f) => /\.jsx?$/.test(f)).sort();
    expect(fitxers.length).toBeGreaterThan(0);
    const copiats = fitxers.flatMap((fitxer) => copiesDe(fitxer, readFileSync(path.join(ARREL, CARPETA, fitxer), 'utf8'), noms));
    expect(copiats).toEqual([]);
  });

  test('sonda: el detector troba una còpia sencera i un tros, i deixa passar una paraula sola', () => {
    /* Un nom de la llista de quatre paraules o més, només en memòria (normalitzat: sense cometes). */
    const nom = [...noms].find((n) => n.split(' ').length >= 4);
    expect(typeof nom).toBe('string');
    const tros = nom.split(' ').slice(0, 3).join(' ');
    expect(copiesDe('sonda.test.js', `const a = 1;\nconst b = '${nom}';`, noms)).toEqual(['sonda.test.js:2']);
    expect(copiesDe('sonda.js', `/* «${nom}» */`, noms)).toEqual(['sonda.js:1']);
    expect(copiesDe('sonda.test.js', `test("${tros}");`, noms)).toEqual(['sonda.test.js:1']);
    /* En la producció, el vocabulari (literals) no és un exemple; una paraula sola, tampoc. */
    expect(copiesDe('sonda.js', `const b = '${nom}';`, noms)).toEqual([]);
    expect(copiesDe('sonda.test.js', `const c = '${nom.split(' ')[0]}';`, noms)).toEqual([]);
  });
});
