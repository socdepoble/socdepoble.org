#!/usr/bin/env node
/** Importació reproduïble del CSV humà. No consulta ni descarrega cap imatge. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { importaProductes, nombreEs, centimsEs } from '../../src/apps/nevera/importador.js';
import { FONT, PRODUCTES } from '../../src/apps/nevera/nucli/productes.js';
import { LIMITS, netejaText } from '../../src/apps/nevera/nucli/index.js';
import { llegixCsv } from '../../src/utils/fulls/csv.js';

const COLUMNES = ['Categoria', 'Imatge', 'Marca', 'Producte', 'Envàs', 'Quant', 'g-l', 'Preu', 'PreuU', 'U', '/', 'kg-l', 'ImgUrl', 'TitolCat'];
const empremta = (valor) => createHash('sha256').update(valor).digest('hex');
const clau = (fila) => JSON.stringify(fila.slice(3));

export function imatgeMercadonaSegura(valor) {
  const url = new URL(valor);
  if (url.protocol !== 'https:' || url.hostname !== 'prod-mercadona.imgix.net' || url.port || url.username || url.password
    || !/^\/images\/[a-f0-9]+\.(?:jpe?g|png)$/.test(url.pathname) || url.hash
    || url.href !== valor || url.searchParams.get('fit') !== 'crop' || [...url.searchParams].length !== 3
    || url.searchParams.get('h') !== '600' || url.searchParams.get('w') !== '600'
    || [...url.searchParams.keys()].some((key) => !['fit', 'h', 'w'].includes(key))) {
    throw new TypeError('La imatge del producte no és una URL Mercadona de 600 × 600 admesa.');
  }
  return valor;
}

/** Manté els ids publicats; una deriva demana revisar el tall. */
export function importaMercadona(bytes) {
  const files = llegixCsv(bytes, { delimitador: ',' });
  if (JSON.stringify(files[0]) !== JSON.stringify(COLUMNES)) throw new TypeError('El CSV no conserva les 14 columnes esperades.');
  const { productes, avisos } = importaProductes(bytes, { publicats: PRODUCTES, delimitador: ',' });
  if (JSON.stringify(productes) !== JSON.stringify(PRODUCTES)) throw new TypeError('El CSV ha canviat respecte dels ids publicats: cal revisar el tall.');
  const pendents = new Map();
  for (const fila of PRODUCTES) {
    const k = clau(fila);
    if (!pendents.has(k)) pendents.set(k, []);
    pendents.get(k).push(fila);
  }
  const productesComplets = [];
  const notes = [];
  const categories = new Set();
  const capcaleres = [];
  files.slice(1).forEach((fila, index) => {
    if (fila.every((cella) => !cella)) return;
    if (fila.length !== COLUMNES.length) throw new TypeError(`Fila ${index + 2}: amplària incorrecta.`);
    const [categoria, , marca, nom, envas, quant, unitatFont, preu, preuU, denominador, barra, unitatPreu, imatge] = fila;
    if (!nom) {
      if (categoria) { categories.add(categoria); capcaleres.push({ fila: index + 2, categoria }); }
      return;
    }
    if (/€|^precio medio\b/i.test(nom)) { notes.push({ fila: index + 2, text: nom }); return; }
    categories.add(categoria);
    const quantitatOriginal = nombreEs(quant);
    const preuCentims = centimsEs(preu);
    const preuUnitariCentims = centimsEs(preuU);
    if (!(quantitatOriginal > 0) || !Number.isSafeInteger(preuCentims) || !Number.isSafeInteger(preuUnitariCentims)
      || barra !== '/' || !['kg', 'l', 'u'].includes(unitatPreu) || !['g', 'kg', 'l', 'ml', 'u'].includes(unitatFont)) {
      throw new TypeError(`Fila ${index + 2}: quantitat, unitat o preu no interpretables.`);
    }
    const k = JSON.stringify([marca, envas, quantitatOriginal, unitatFont, preuCentims]);
    const possibles = pendents.get(k);
    const nomNet = netejaText(netejaText(nom, 200).replace(/\s*\([^()]*\)$/, ''), LIMITS.nom);
    const posicio = possibles?.findIndex((filaPublicada) => filaPublicada[1] === nomNet || filaPublicada[1].startsWith(`${nomNet} · `));
    if (posicio === undefined || posicio < 0) throw new TypeError(`Fila ${index + 2}: no es troba l'id publicat.`);
    const [publicat] = possibles.splice(posicio, 1);
    productesComplets.push({
      id: publicat[0], categoria, categoriaId: publicat[2], marca, nom, nomNevera: publicat[1], envas,
      quantitat: unitatFont === 'kg' ? quantitatOriginal * 1000 : unitatFont === 'ml' ? quantitatOriginal / 1000 : quantitatOriginal,
      unitat: unitatFont === 'kg' ? 'g' : unitatFont === 'ml' ? 'l' : unitatFont,
      quantitatOriginal, unitatOriginal: unitatFont,
      preuEnvas: preuCentims / 100, preuCentims,
      preuUnitari: preuUnitariCentims / 100, preuUnitariCentims, unitatPreuUnitari: unitatPreu,
      moneda: 'EUR', denominadorOriginal: denominador, imatgeUrl: imatgeMercadonaSegura(imatge),
      filaFont: index + 2, font: 'mer', tall: FONT.tall
    });
  });
  if (productesComplets.length !== PRODUCTES.length || [...pendents.values()].some((restants) => restants.length)) {
    throw new TypeError('La reconciliació no conserva tots els productes publicats.');
  }
  const ordre = new Map(PRODUCTES.map(([id], index) => [id, index]));
  productesComplets.sort((a, b) => ordre.get(a.id) - ordre.get(b.id));
  return {
    metadades: {
      font: 'Llista de la compra - Mercadona.csv', sha256: empremta(bytes), tall: FONT.tall,
      columnes: COLUMNES.length, filesDades: files.length - 1, productes: productesComplets.length,
      categories: [...categories], capcaleres, notes, avisos,
      estatPreus: 'Instantània del catàleg conservada pel projecte; no és una consulta de preus vigents.'
    },
    productes: productesComplets
  };
}

export function serialitzaMercadona(resultat) {
  return `/** Generat amb tooling/menjarIBeure/importa-mercadona.mjs. No editar a mà. */\n`
    + `const congela = (valor) => { if (valor && typeof valor === 'object') { Object.values(valor).forEach(congela); Object.freeze(valor); } return valor; };\n`
    + `export const METADADES_MERCADONA = congela(${JSON.stringify(resultat.metadades, null, 2)});\n`
    + `export const PRODUCTES_MERCADONA = Object.freeze([\n${resultat.productes.map((p) => `  Object.freeze(${JSON.stringify(p)})`).join(',\n')}\n]);\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [font, desti = 'src/data/menjarIBeure/mercadona.generated.js'] = process.argv.slice(2);
  if (!font) throw new TypeError('Ús: node tooling/menjarIBeure/importa-mercadona.mjs CSV [DESTÍ]');
  const resultat = importaMercadona(readFileSync(font));
  writeFileSync(desti, serialitzaMercadona(resultat));
  console.log(JSON.stringify({ productes: resultat.productes.length, categories: resultat.metadades.categories.length, sha256: resultat.metadades.sha256, desti }));
}
