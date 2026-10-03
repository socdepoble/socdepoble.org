/**
 * La Nevera de Casa · l'importador de productes de botiga (pur: cap React,
 * cap xarxa, cap disc).
 *
 * Llig el full «Llista de la compra» d'una botiga, en CSV, i en torna les
 * files compactes de nucli/productes.js:
 *   [id, nom, seccioId, marca, envas, quantitat, unitat, preuCentims]
 * És la font de veritat d'eixe fitxer: la prova de deriva
 * (nucli/productes.test.js) l'aplica al full de la zona humana i exigix que
 * el resultat coincidisca exactament amb PRODUCTES.
 *
 * Viu fora del nucli perquè el nucli només s'importa a ell mateix
 * (frontera.test.js) i este mòdul fa servir el lector de CSV comú
 * (utils/fulls/csv.js) en compte d'una tercera còpia del parser. L'app no el
 * carrega: és l'eina de la prova de deriva i de la regeneració de
 * productes.js quan arriba un tall nou del full.
 *
 * Privacitat i sobirania: les columnes es busquen pel NOM de la capçalera i
 * només es llig la llista blanca (Categoria, Marca, Producte, Envàs, Quant,
 * g-l, Preu). Les imatges (Imatge, ImgUrl), el títol de la categoria
 * (TitolCat), el preu per unitat (PreuU, U, kg-l) i qualsevol altra columna
 * no es llegixen mai: ni enllaços a la botiga ni rutes de cap disc.
 *
 * Regles:
 *   · les files sense producte (capçaleres de categoria, files buides) se
 *     salten sense avís;
 *   · una fila amb un preu dins del nom («PRECIO MEDIO…») és una nota: no
 *     s'importa i se n'avisa; una categoria desconeguda, igual;
 *   · el nom es neteja (espais, anotació final entre parèntesis) i es queda
 *     en la llengua de la botiga: és la denominació de l'envàs i del tiquet;
 *   · un nom repetit, o que ja és d'un article de base, porta « · <quantitat>
 *     <unitat>»; si encara coincidix, « · 2», « · 3»…;
 *   · id = '<prefix>-' + slug del nom, de 64 caràcters com a molt (els de la
 *     URL, esIdOpac); si coincidix, '-2', '-3'… en l'ordre de les files;
 *   · un id publicat no canvia mai (opció `publicats`, el tall d'abans): viu
 *     a les llistes de cada casa, i normalitzaEstat descarta les línies d'un
 *     id que ja no hi és.
 * Mai llança: una entrada que no s'entén torna cap producte i un avís.
 */
import { llegixCsv } from '../../utils/fulls/csv.js';
import { ARTICLES_BASE, FONT, LIMITS, clauDeNom, esIdNevera, netejaText, textQuantitat } from './nucli/index.js';

/** Les categories de la botiga i la secció de la Nevera on van (cap secció nova). */
export const MAPA_SECCIONS = Object.freeze({
  'Aceite, especias y salsas': 'ingredients-especies',
  'Agua y refrescos': 'begudes',
  'Aperitivos': 'picar-dolcos',
  'Arroz, legumbres y pasta': 'cereals-pasta',
  'Azúcar, caramelos y chocolate': 'picar-dolcos',
  'Bebé': 'higiene-salut',
  'Bodega': 'begudes',
  'Cacao, café e infusiones': 'begudes',
  'Carne': 'carn-peix',
  'Cereales y galletas': 'cereals-pasta',
  'Charcutería y quesos': 'carn-peix',
  'Congelados': 'congelats',
  'Conservas, caldos y cremas': 'ingredients-especies',
  'Cuidado del cabello': 'higiene-salut',
  'Cuidado facial y corporal': 'higiene-salut',
  'Fruta y verdura': 'fruita-verdura',
  'Huevos, leche y mantequilla': 'llet-formatge',
  'Limpieza y hogar': 'llar',
  'Marisco y pescado': 'carn-peix',
  'Mascotas': 'mascotes',
  'Panadería y pastelería': 'pa-pastissos',
  'Pizzas y platos preparados': 'congelats',
  'Postres y yogures': 'llet-formatge',
  'Zumos': 'begudes'
});

/* Algunes categories es partixen per l'inici del nom (clau sense accents),
   perquè el producte vaja a la secció del seu article de base:
   · de «Charcutería y quesos», els formatges, a «Llet i formatge»
     («Salchichas Viena queso…» és embotit);
   · l'azúcar i la harina, a «Ingredients i espècies», com «Sucre» i «Farina»;
   · les galletas, a «Picar i dolços», com «Galetes». */
const PARTIDES = Object.freeze([
  ['Charcutería y quesos', /^(?:queso|mozzarella|mousse de queso|requeson)\b/, 'llet-formatge'],
  ['Azúcar, caramelos y chocolate', /^azucar\b/, 'ingredients-especies'],
  ['Panadería y pastelería', /^harina\b/, 'ingredients-especies'],
  ['Cereales y galletas', /^galletas?\b/, 'picar-dolcos']
].map(([categoria, patro, seccio]) => Object.freeze({ clau: clauDeNom(categoria), patro, seccio })));
const SECCIO_PER_CLAU = new Map(Object.entries(MAPA_SECCIONS).map(([categoria, seccio]) => [clauDeNom(categoria), seccio]));

/* Les úniques columnes que es llegixen: el camp i la clau del nom de la capçalera. */
const COLUMNES = Object.freeze({
  categoria: 'categoria', marca: 'marca', producte: 'producte', envas: 'envas', quantitat: 'quant', unitat: 'g-l', preu: 'preu'
});

const NOMBRE_ES = /^\d{1,9}(?:\.\d{3})*(?:,\d{1,6})?$/;
const PREU_ES = /^(\d{1,7}(?:\.\d{3})*)(?:,(\d{1,2}))?(?: ?€)?$/;
const ANOTACIO_FINAL = /\s*\([^()]*\)$/;
const ES_NOTA = /€|^precio medio\b/i;
const PATRO_PREFIX = /^[a-z][a-z0-9]{0,7}$/;
const DELIMITADORS = Object.freeze(['auto', ',', ';', '\t']);
const MAX_ID = 64;

/** La secció de la Nevera d'un producte, o null si la categoria no en té. */
export function seccioDe(categoria, nom) {
  const clau = clauDeNom(categoria);
  const clauNom = clauDeNom(nom);
  const partida = PARTIDES.find((regla) => regla.clau === clau && regla.patro.test(clauNom));
  return partida ? partida.seccio : SECCIO_PER_CLAU.get(clau) || null;
}

/** «1.540» → 1540, «3,96» → 3.96, «1500» → 1500 (format espanyol); el que no és un nombre, null. */
export function nombreEs(text) {
  const net = netejaText(text, 40);
  return NOMBRE_ES.test(net) ? Number(net.replace(/\./g, '').replace(',', '.')) : null;
}

/** «1,50 €» → 150: el preu en cèntims, sense coma flotant; el que no és un preu, null. */
export function centimsEs(text) {
  const parts = netejaText(text, 40).match(PREU_ES);
  return parts ? Number(parts[1].replace(/\./g, '')) * 100 + Number((parts[2] || '').padEnd(2, '0')) : null;
}

/** Un slug per a la URL: sense accents, en minúscules, amb guionets. */
export function slug(text) {
  return String(text).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* El nom net: sense l'anotació final entre parèntesis i, com a molt, LIMITS.nom caràcters. */
function nomDe(cru) {
  return netejaText(netejaText(cru, 200).replace(ANOTACIO_FINAL, ''), LIMITS.nom);
}

/* El nom amb un sufix, retallant el nom (mai el sufix) perquè càpia en LIMITS.nom. */
function ambSufix(nom, sufix) {
  return `${[...nom].slice(0, LIMITS.nom - [...sufix].length).join('').trim()}${sufix}`;
}

/* Un id que encara no s'ha donat: '<prefix>-<slug>', '-2', '-3'… i 64 caràcters com a molt. */
function idUnic(prefix, nom, usats) {
  const base = `${prefix}-${slug(nom) || 'producte'}`.slice(0, MAX_ID).replace(/-+$/, '');
  let id = base;
  for (let n = 2; usats.has(id); n += 1) {
    const sufix = `-${n}`;
    id = `${base.slice(0, MAX_ID - sufix.length).replace(/-+$/, '')}${sufix}`;
  }
  usats.add(id);
  return id;
}

/* Les files de producte del CSV, netes i amb la seua secció, i els avisos. */
function candidatsDe(files) {
  const capcalera = (files[0] || []).map((text) => clauDeNom(text));
  const index = Object.fromEntries(Object.entries(COLUMNES).map(([camp, clau]) => [camp, capcalera.indexOf(clau)]));
  if (index.categoria < 0 || index.producte < 0) {
    return { candidats: [], avisos: ['Falta la columna «Categoria» o «Producte»: cap producte importat.'] };
  }
  const cella = (fila, camp) => (index[camp] >= 0 && typeof fila[index[camp]] === 'string' ? fila[index[camp]] : '');
  const candidats = [];
  const avisos = [];
  files.slice(1).forEach((fila, i) => {
    const numero = i + 2;
    const nom = nomDe(cella(fila, 'producte'));
    if (!nom) return;
    if (ES_NOTA.test(nom)) {
      avisos.push(`Fila ${numero}: «${nom}» és una nota, no un producte: no s’importa.`);
      return;
    }
    const categoria = netejaText(cella(fila, 'categoria'), 200);
    const seccio = seccioDe(categoria, nom);
    if (!seccio) {
      avisos.push(`Fila ${numero}: la categoria «${categoria}» no té secció a la Nevera: «${nom}» no s’importa.`);
      return;
    }
    const quantitat = nombreEs(cella(fila, 'quantitat'));
    const preu = centimsEs(cella(fila, 'preu'));
    if (quantitat === null && netejaText(cella(fila, 'quantitat'), 40)) avisos.push(`Fila ${numero}: la quantitat de «${nom}» no s’entén: es guarda sense quantitat.`);
    if (preu === null && netejaText(cella(fila, 'preu'), 40)) avisos.push(`Fila ${numero}: el preu de «${nom}» no s’entén: es guarda sense preu.`);
    candidats.push({
      nom,
      clau: clauDeNom(nom),
      seccio,
      marca: netejaText(cella(fila, 'marca'), LIMITS.nom),
      envas: netejaText(cella(fila, 'envas'), LIMITS.nom),
      quantitat,
      unitat: netejaText(cella(fila, 'unitat'), 10).toLowerCase(),
      preu
    });
  });
  return { candidats, avisos };
}

/* Les files publicades que es poden aparellar: un id d'URL (la primera vegada que ix) i un nom. */
function publicatsDe(valor) {
  const vists = new Set();
  return (Array.isArray(valor) ? valor : [])
    .filter((fila) => Array.isArray(fila) && esIdNevera(fila[0]) && typeof fila[1] === 'string' && !vists.has(fila[0]) && vists.add(fila[0]))
    .map(([id, nom, , marca, , quantitat, unitat]) => {
      /* El sufix que portava el nom: « · 600 g», « · 2», « · 600 g · 2» o res. */
      const numero = / · \d+$/.exec(nom)?.[0] ?? '';
      const resta = nom.slice(0, nom.length - numero.length);
      const enQuantitat = textQuantitat(quantitat, unitat);
      const sufix = `${enQuantitat && resta.endsWith(` · ${enQuantitat}`) ? ` · ${enQuantitat}` : ''}${numero}`;
      return { id, nom, clau: clauDeNom(nom), sufix, marca: clauDeNom(marca), quantitat: `${quantitat}|${unitat}` };
    });
}

/*
 * Cada producte publicat busca el seu en el full nou: la mateixa quantitat i
 * unitat, i el nom net igual al publicat, sol o amb el sufix que portava
 * (retallat igual). Primer amb la mateixa marca i, després, amb qualsevol;
 * així dos homònims exactes no s'intercanvien l'id. Torna índex del candidat
 * → índex del publicat.
 */
function aparella(publicats, candidats) {
  const perQuantitat = new Map();
  candidats.forEach((candidat, i) => {
    const clau = `${candidat.quantitat}|${candidat.unitat}`;
    if (!perQuantitat.has(clau)) perQuantitat.set(clau, []);
    perQuantitat.get(clau).push(i);
  });
  const esElMateix = (publicat, candidat) => publicat.clau === candidat.clau
    || (publicat.sufix !== '' && publicat.clau === clauDeNom(ambSufix(candidat.nom, publicat.sufix)));
  const parelles = new Map();
  const aparellats = new Set();
  for (const ambMarca of [true, false]) {
    publicats.forEach((publicat, p) => {
      if (aparellats.has(p)) return;
      const i = (perQuantitat.get(publicat.quantitat) || []).find((c) => !parelles.has(c) && esElMateix(publicat, candidats[c])
        && (!ambMarca || publicat.marca === clauDeNom(candidats[c].marca)));
      if (i === undefined) return;
      parelles.set(i, p);
      aparellats.add(p);
    });
  }
  return parelles;
}

/* Cap producte i un sol avís. */
const cap = (avis) => ({ productes: [], avisos: [avis] });

/**
 * Els productes d'un CSV de botiga: { productes, avisos }.
 *
 * Per a regenerar un tall, `publicats` són les files d'abans (PRODUCTES):
 *   · un producte que ja hi era conserva l'id encara que ara el seu nom porte
 *     un sufix (li ha eixit un homònim o un article de base amb el mateix nom)
 *     o que el full haja canviat l'ordre de les files;
 *   · els publicats ixen primer, en el seu ordre, i els nous darrere, amb ids
 *     que no xafen cap publicat, tampoc els que ja no hi són;
 *   · un publicat que ja no és al full no es conserva: se n'avisa.
 * @param {string|Uint8Array|ArrayBuffer} font el text o els bytes del fitxer
 * @param {{ prefix?: string, publicats?: ReadonlyArray<ReadonlyArray<unknown>>, delimitador?: 'auto'|','|';'|'\t' }} [opcions]
 *   el prefix dels ids (per defecte, el de FONT), el tall publicat i el delimitador (per defecte, 'auto')
 * @returns {{ productes: Array<[string, string, string, string, string, number|null, string, number|null]>, avisos: string[] }}
 */
export function importaProductes(font, opcions) {
  const prefix = opcions?.prefix ?? FONT.id;
  const delimitador = opcions?.delimitador ?? 'auto';
  if (typeof prefix !== 'string' || !PATRO_PREFIX.test(prefix)) return cap('El prefix dels ids ha de ser de minúscules i xifres (fins a 8): cap producte importat.');
  if (!DELIMITADORS.includes(delimitador)) return cap('El delimitador ha de ser «auto», la coma, el punt i coma o el tabulador: cap producte importat.');
  if (typeof font !== 'string' && !ArrayBuffer.isView(font) && !(font instanceof ArrayBuffer)) {
    return cap('L’entrada no és el text ni els bytes d’un CSV: cap producte importat.');
  }
  const { candidats, avisos } = candidatsDe(llegixCsv(font, { delimitador }));
  const reservades = new Set(ARTICLES_BASE.map((article) => clauDeNom(article.nom)));
  const compte = new Map();
  for (const { clau } of candidats) compte.set(clau, (compte.get(clau) || 0) + 1);
  const vistes = new Set(reservades);
  const noms = candidats.map((candidat) => {
    const quantitat = textQuantitat(candidat.quantitat, candidat.unitat);
    const sufix = (compte.get(candidat.clau) > 1 || reservades.has(candidat.clau)) && quantitat ? ` · ${quantitat}` : '';
    let nom = sufix ? ambSufix(candidat.nom, sufix) : candidat.nom;
    for (let n = 2; vistes.has(clauDeNom(nom)); n += 1) nom = ambSufix(candidat.nom, `${sufix} · ${n}`);
    vistes.add(clauDeNom(nom));
    return nom;
  });
  const publicats = publicatsDe(opcions?.publicats);
  const parelles = aparella(publicats, candidats);
  const usats = new Set(publicats.map((publicat) => publicat.id));
  const files = candidats.map((candidat, i) => [
    parelles.has(i) ? publicats[parelles.get(i)].id : idUnic(prefix, noms[i], usats),
    noms[i], candidat.seccio, candidat.marca, candidat.envas, candidat.quantitat, candidat.unitat, candidat.preu
  ]);
  const aparellats = new Set(parelles.values());
  publicats.forEach((publicat, p) => {
    if (!aparellats.has(p)) avisos.push(`El producte publicat «${publicat.nom}» (${publicat.id}) ja no és al full: les llistes que el porten el perdrien.`);
  });
  const vells = [...parelles.keys()].sort((a, b) => parelles.get(a) - parelles.get(b));
  const nous = files.map((_, i) => i).filter((i) => !parelles.has(i));
  return { productes: [...vells, ...nous].map((i) => files[i]), avisos };
}
