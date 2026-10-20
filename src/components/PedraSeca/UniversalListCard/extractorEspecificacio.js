/**
 * extractorEspecificacio.js — Fase E (261020, tasca 2; pla 261020_2045) · la
 * quantitat d'una entrada ràpida i la fusió de dues peticions del mateix
 * article, per al mode Rebost d'«El Comú».
 *
 * Reimplementació pròpia a partir del COMPORTAMENT descrit a l'auditoria
 * 261020_2030 (§2.2), no del codi de Bring!: ni les seues expressions ni la
 * seua llista d'unitats (alemanyes, angleses i xineses) no servien per a les
 * nostres cinc llengües, i el patró final de l'auditoria no casava amb el seu
 * propi exemple («Tomaca de penjar 2 kg»).
 *
 *   extrauEspecificacio('2 kg de tomaca de penjar')
 *     → { nom: 'Tomaca de penjar', especificacio: '2 kg', quantitat: 2, unitat: 'kg' }
 *   extrauEspecificacio('Ous 1 dotzena') → { nom: 'Ous', especificacio: '1 dotzena', quantitat: 1, unitat: 'dotzena' }
 *   extrauEspecificacio('Pa') → { nom: 'Pa', especificacio: '', quantitat: null, unitat: null }
 *
 *   fusionaEspecificacions('2 kg', '1 kg', { pendent: true }) → '2 kg + 1 kg'
 *   fusionaEspecificacions('', '', { pendent: true }) → '1 + 1' (dues persones, cap quantitat)
 *   fusionaEspecificacions('6', '12', { pendent: false }) → '12' (ja s'havia comprat: compra nova)
 *   sumaEspecificacio('2 kg + 500 g') → { quantitat: 2.5, unitat: 'kg' }
 *
 * La fusió no suma: deixa vore que dues persones han demanat el mateix. La
 * suma és a banda (sumaEspecificacio) i només quan totes les parts són de la
 * mateixa magnitud. Si la cadena passa del límit, es plega a la suma; si no es
 * pot sumar, es queda com estava (la persona queda igualment a demanatPer).
 *
 * JS pur: sense DOM ni React. Cap lookbehind (Baseline 2022).
 */
import { LIMITS_COMU, textNet } from './basesComu.js';

/* Unitat canònica → formes escrites (valencià, castellà, anglés, basc i
   gallec, sense accents). Les de massa i volum porten el factor a la base. */
const UNITATS = Object.freeze({
  g: { formes: ['g', 'gr', 'grs', 'gram', 'grams', 'gramo', 'gramos', 'gramoak'], magnitud: 'massa', factor: 1 },
  kg: { formes: ['kg', 'kgs', 'kilo', 'kilos', 'quilo', 'quilos', 'quilogram', 'quilograms', 'kilogramo', 'kilogramos', 'kiloak'], magnitud: 'massa', factor: 1000 },
  ml: { formes: ['ml', 'mililitre', 'mililitres', 'mililitro', 'mililitros'], magnitud: 'volum', factor: 1 },
  cl: { formes: ['cl', 'centilitre', 'centilitres', 'centilitro', 'centilitros'], magnitud: 'volum', factor: 10 },
  dl: { formes: ['dl'], magnitud: 'volum', factor: 100 },
  l: { formes: ['l', 'litre', 'litres', 'litro', 'litros', 'liter', 'liters', 'litroak'], magnitud: 'volum', factor: 1000 },
  u: { formes: ['u', 'ud', 'uds', 'unitat', 'unitats', 'unidad', 'unidades', 'unit', 'units', 'pc', 'pcs', 'peca', 'peces', 'pieza', 'piezas'], magnitud: 'compte', factor: 1 },
  dotzena: { formes: ['dotzena', 'dotzenes', 'docena', 'docenas', 'dozen', 'dozens', 'dozena'], magnitud: 'compte', factor: 12 },
  paquet: { formes: ['paquet', 'paquets', 'paquete', 'paquetes', 'pack', 'packs', 'pqt'], magnitud: 'paquet', factor: 1 },
  pot: { formes: ['pot', 'pots', 'bote', 'botes', 'jar', 'jars'], magnitud: 'pot', factor: 1 },
  barra: { formes: ['barra', 'barres', 'barras'], magnitud: 'barra', factor: 1 },
  manat: { formes: ['manat', 'manats', 'manojo', 'manojos', 'bunch'], magnitud: 'manat', factor: 1 },
  caixa: { formes: ['caixa', 'caixes', 'caja', 'cajas', 'box', 'boxes'], magnitud: 'caixa', factor: 1 },
  botella: { formes: ['botella', 'botelles', 'botellas', 'bottle', 'bottles', 'botila', 'botilak'], magnitud: 'botella', factor: 1 },
  llanda: { formes: ['llanda', 'llandes', 'lata', 'latas', 'can', 'cans'], magnitud: 'llanda', factor: 1 },
  bossa: { formes: ['bossa', 'bosses', 'bolsa', 'bolsas', 'bag', 'bags'], magnitud: 'bossa', factor: 1 },
  safata: { formes: ['safata', 'safates', 'bandeja', 'bandejas', 'tray', 'trays'], magnitud: 'safata', factor: 1 },
  racio: { formes: ['racio', 'racions', 'racion', 'raciones', 'portion', 'portions'], magnitud: 'racio', factor: 1 }
});

const senseAccents = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('ca');

/** Forma escrita (sense accents) → unitat canònica. */
const PER_FORMA = new Map(Object.entries(UNITATS).flatMap(([unitat, { formes }]) => formes.map((f) => [f, unitat])));

/** La unitat canònica d'una paraula, o null («Kg.» → 'kg', «racions» → 'racio'). */
export function unitatDe(paraula) {
  const net = senseAccents(String(paraula ?? '')).replace(/\.$/, '');
  return PER_FORMA.get(net) ?? null;
}

/* Un nombre: 2 · 1,5 · 0.75 · 1/2. */
const NOMBRE = '(\\d+(?:[.,]\\d+)?(?:\\/\\d+)?)';
/* Una paraula d'unitat possible (lletres, amb punt final opcional). */
const PARAULA = '(\\p{L}+\\.?)';
const DAVANT = new RegExp(`^${NOMBRE}\\s*${PARAULA}?\\s+(.+)$`, 'u');
const DARRERE = new RegExp(`^(.+?)\\s+${NOMBRE}\\s*${PARAULA}?$`, 'u');
const PER_X_DARRERE = /^(.+?)\s+x\s*(\d+)$/iu;
const PER_X_DAVANT = /^(\d+)\s*x\s+(.+)$/iu;
const DE_DAVANT = /^(?:de\s+|d['’]\s*)/iu;

/** El valor d'un nombre escrit («1,5» → 1.5, «1/2» → 0.5), o null. */
export function valorDeNombre(text) {
  const net = String(text ?? '').replace(',', '.');
  const [numerador, denominador] = net.split('/');
  const n = Number(numerador);
  if (!Number.isFinite(n)) return null;
  if (denominador === undefined) return n;
  const d = Number(denominador);
  return Number.isFinite(d) && d > 0 ? n / d : null;
}

/** «tomaca de penjar» → «Tomaca de penjar»: el nom que ix darrere d'una quantitat. */
const majusculaInicial = (text) => (text ? text[0].toLocaleUpperCase('ca') + text.slice(1) : text);

const especificacioDe = (nombre, paraula) => (paraula ? `${nombre} ${paraula}` : nombre);

/** { nom, especificacio, quantitat, unitat } d'una entrada ràpida. */
export function extrauEspecificacio(entrada) {
  const text = textNet(entrada, LIMITS_COMU.nom + LIMITS_COMU.especificacio);
  const buit = { nom: textNet(text), especificacio: '', quantitat: null, unitat: null };
  if (!text) return buit;

  const ambX = text.match(PER_X_DAVANT) ?? text.match(PER_X_DARRERE);
  if (ambX) {
    const [nombre, nom] = PER_X_DAVANT.test(text) ? [ambX[1], ambX[2]] : [ambX[2], ambX[1]];
    return { nom: majusculaInicial(textNet(nom)), especificacio: nombre, quantitat: Number(nombre), unitat: 'u' };
  }

  const davant = text.match(DAVANT);
  if (davant) {
    const [, nombre, paraula, resta] = davant;
    const unitat = paraula ? unitatDe(paraula) : null;
    /* «2 kg» sol: la quantitat no porta cap nom darrere. */
    if (!paraula && unitatDe(resta)) return buit;
    /* «3 tomaques»: la paraula no és cap unitat, és el principi del nom. */
    const nom = textNet((unitat ? resta : `${paraula ?? ''} ${resta}`).replace(DE_DAVANT, ''));
    if (nom) return { nom: majusculaInicial(nom), especificacio: especificacioDe(nombre, unitat ? paraula : ''), quantitat: valorDeNombre(nombre), unitat: unitat ?? 'u' };
  }

  const darrere = text.match(DARRERE);
  if (darrere) {
    const [, nom, nombre, paraula] = darrere;
    const unitat = paraula ? unitatDe(paraula) : null;
    /* «Llet 2 cartons»: una paraula final que no és unitat no és cap quantitat. */
    if (!paraula || unitat) {
      return { nom: textNet(nom), especificacio: especificacioDe(nombre, paraula ?? ''), quantitat: valorDeNombre(nombre), unitat: unitat ?? 'u' };
    }
  }

  /* «2 kg» sol, o una quantitat que no es pot separar: tot és el nom. */
  return buit;
}

/** Les parts d'una especificació fusionada («2 kg + 1 kg» → ['2 kg', '1 kg']). */
export const partsDe = (especificacio) => String(especificacio ?? '').split('+').map((p) => p.trim()).filter(Boolean);

/** La quantitat d'una part («500 g» → { valor: 500, unitat: 'g' }; «1» → u), o null. */
export function quantitatDe(part) {
  const m = String(part ?? '').trim().match(new RegExp(`^${NOMBRE}\\s*${PARAULA}?$`, 'u'));
  if (!m) return null;
  const valor = valorDeNombre(m[1]);
  const unitat = m[2] ? unitatDe(m[2]) : 'u';
  return valor === null || !unitat ? null : { valor, unitat };
}

const arrodonix = (n) => Math.round(n * 1000) / 1000;

/** La suma d'una especificació quan totes les parts són de la mateixa magnitud, o null. */
export function sumaEspecificacio(especificacio) {
  const parts = partsDe(especificacio).map(quantitatDe);
  if (parts.length === 0 || parts.some((p) => p === null)) return null;
  const magnituds = new Set(parts.map((p) => UNITATS[p.unitat].magnitud));
  if (magnituds.size !== 1) return null;
  const unitats = new Set(parts.map((p) => p.unitat));
  if (unitats.size === 1) {
    const [unitat] = unitats;
    return { quantitat: arrodonix(parts.reduce((s, p) => s + p.valor, 0)), unitat };
  }
  /* Unitats diferents de la mateixa magnitud: a la més gran que hi apareix. */
  const base = parts.reduce((s, p) => s + p.valor * UNITATS[p.unitat].factor, 0);
  const unitat = [...unitats].sort((a, b) => UNITATS[b].factor - UNITATS[a].factor)[0];
  return { quantitat: arrodonix(base / UNITATS[unitat].factor), unitat };
}

/** La quantitat d'una especificació expressada en `unitat` («500 g» en kg → 0,5), o null si no són de la mateixa magnitud. */
export function quantitatEn(especificacio, unitat) {
  const desti = UNITATS[unitat];
  const parts = partsDe(especificacio).map(quantitatDe);
  if (!desti || parts.length === 0 || parts.some((p) => p === null || UNITATS[p.unitat].magnitud !== desti.magnitud)) return null;
  return arrodonix(parts.reduce((s, p) => s + p.valor * UNITATS[p.unitat].factor, 0) / desti.factor);
}

const nombreEscrit = (n) => String(n).replace('.', ',');
const textDeSuma = ({ quantitat, unitat }) => (unitat === 'u' ? nombreEscrit(quantitat) : `${nombreEscrit(quantitat)} ${unitat}`);

/**
 * La fusió de dues peticions del mateix article. Sense quantitat, una petició
 * val «1». Si l'article ja no estava per comprar, la nova és una compra neta.
 */
export function fusionaEspecificacions(existent, nova, { pendent = true } = {}) {
  const ara = textNet(nova, LIMITS_COMU.especificacio);
  if (!pendent) return ara;
  const abans = textNet(existent, LIMITS_COMU.especificacio);
  const fusio = `${abans || '1'} + ${ara || '1'}`;
  if (fusio.length <= LIMITS_COMU.especificacio) return fusio;
  const suma = sumaEspecificacio(fusio);
  return suma ? textDeSuma(suma) : abans;
}
