/**
 * nomenclatorIne.js · R16-S (P0-79 / IDEA-210) · Els noms del selector «El
 * teu poble» de la fitxa personal i el nomenclàtor de l'INE que hi busca.
 *
 * Mòdul a banda d'aliesDePobles.js a posta: aquell és pur (sense xarxa) i el
 * mirall del Node 0 el copia amb el sha256 fixat a
 * tooling/node0/manifest-mirall-staging.json; ací viu l'únic import() del
 * JSON de l'INE, que Vite servix en un tros a banda i que només es baixa quan
 * la persona cerca un municipi. Sense cap nom de poble al codi (qualitat.test.js).
 */
import { aliesDelPoble, catalegDePobles } from './aliesDePobles.js';
import { MOCK_TOWNS } from './townsSeed.js';

const MARQUES = /\p{M}/gu;
const ESPAIS = /\s+/g;
const BUIT = Object.freeze([]);

/* La mateixa clau que aliesDePobles.js: minúscules i sense accents. */
const clauDeForma = (forma) => forma.normalize('NFKD').replace(MARQUES, '').toLowerCase();

/* El nom visible d'un poble del catàleg (una cadena o una fitxa). */
const nomDe = (poble) => (typeof poble === 'string'
  ? poble
  : String(poble?.title ?? poble?.nom ?? poble?.name ?? '')).replace(ESPAIS, ' ').trim();

/* Els noms, nets, sense repetits (ni per accents ni per majúscules: es queda
   el primer) i en ordre alfabètic. */
function nomsSenseRepetits(pobles) {
  const vistos = new Set();
  const noms = [];
  for (const poble of pobles) {
    const nom = nomDe(poble);
    const clau = nom && clauDeForma(nom);
    if (!clau || vistos.has(clau)) continue;
    vistos.add(clau);
    noms.push(nom);
  }
  return Object.freeze(noms.sort((a, b) => a.localeCompare(b, 'ca')));
}

/**
 * Els noms del selector «El teu poble» de la fitxa personal: els pobles vius
 * de l'aplicació, els de la llavor i, darrere, els municipis de referència,
 * sense repetits i en ordre alfabètic. Síncron i sense el nomenclàtor de
 * l'INE, que arriba a part (cercaMunicipisIne).
 */
export function nomsCatalegCompletDePobles(pobles) {
  const vius = (Array.isArray(pobles) ? pobles : []).filter((poble) => poble && typeof poble === 'object');
  return nomsSenseRepetits(catalegDePobles([...vius, ...MOCK_TOWNS]));
}

/* R16a · Les claus dels noms oficials que són àlies d'un poble del catàleg present a `noms` (el nom
   castellà de l'INE d'un poble que el catàleg diu en valencià): eixe municipi ja hi és i no s'afig
   com un poble nou. Només els àlies de forma completa: un àlies que només val amb majúscula en un
   relat (ambMajuscula) pot ser el nom d'un altre municipi, i eixe sí que s'ha de poder triar. */
function clausOficialsDelCataleg(noms) {
  const presents = new Set(noms.map((nom) => clauDeForma(nomDe(nom))).filter(Boolean));
  const claus = new Set();
  for (const poble of catalegDePobles(MOCK_TOWNS)) {
    if (!presents.has(clauDeForma(nomDe(poble)))) continue;
    for (const a of aliesDelPoble(poble)) if (!a.ambMajuscula) claus.add(clauDeForma(a.forma));
  }
  return claus;
}

/**
 * Els noms d'un catàleg i, amb ells, el `valor` dels municipis de l'INE
 * trobats que no hi són (ni pel nom ni pel nom oficial que el catàleg porta
 * com a àlies): sense repetits i en ordre alfabètic.
 */
export function nomsAmbMunicipisIne(noms, municipis) {
  const cataleg = Array.isArray(noms) ? noms : [];
  const oficials = clausOficialsDelCataleg(cataleg);
  const extres = (Array.isArray(municipis) ? municipis : [])
    .filter((municipi) => !(municipi?.clauNom && municipi.valor === municipi.nom && oficials.has(municipi.clauNom)))
    .map((municipi) => municipi?.valor);
  return nomsSenseRepetits([...cataleg, ...extres]);
}

/* ═══════════════════════════════════════════════════════════════════
   EL NOMENCLÀTOR DE L'INE (relació de municipis a 1 de gener de 2026;
   font, llicència i comprovació a src/data/nomenclator/FONT.md). Els
   8.132 municipis viuen en un JSON columnar que només es baixa amb
   l'import() dinàmic de carregaNomenclatorIne: cap byte al paquet
   d'entrada. Un nom que es repetix en províncies diferents (Cabanes,
   Sada, Torrent…) porta la província entre parèntesis al seu `valor`, el
   que es tria i es desa: dos municipis no comparteixen mai valor.
   ═══════════════════════════════════════════════════════════════════ */
const NOMENCLATOR_BUIT = Object.freeze({ total: 0, municipis: BUIT });
/* Com a molt, tants municipis torna una cerca. */
const LIMIT_CERCA_INE = 50;

function indexaNomenclatorIne(modul) {
  const dades = modul?.default ?? modul;
  if (!dades || !Array.isArray(dades.nom) || !Array.isArray(dades.ine)) return NOMENCLATOR_BUIT;
  const provincies = Array.isArray(dades.provincies) ? dades.provincies : BUIT;
  const variants = dades.variants && typeof dades.variants === 'object' ? dades.variants : {};
  const files = [];
  const repeticions = new Map();
  for (let i = 0; i < dades.nom.length; i += 1) {
    const nom = String(dades.nom[i] ?? '').replace(ESPAIS, ' ').trim();
    const ine = String(dades.ine[i] ?? '').trim();
    if (!nom || !ine) continue;
    const provincia = String(provincies[dades.prov?.[i]]?.[1] ?? '').trim();
    const clauNom = clauDeForma(nom);
    const formes = Array.isArray(variants[String(i)]) ? variants[String(i)] : BUIT;
    files.push({ ine, nom, provincia, clauNom, clauCerca: [clauNom, ...formes.map((forma) => clauDeForma(String(forma)))].join('\n') });
    repeticions.set(clauNom, (repeticions.get(clauNom) ?? 0) + 1);
  }
  const municipis = files.map((fila) => Object.freeze({
    ...fila,
    valor: repeticions.get(fila.clauNom) > 1 && fila.provincia ? `${fila.nom} (${fila.provincia})` : fila.nom
  }));
  return Object.freeze({ total: municipis.length, municipis: Object.freeze(municipis) });
}

let nomenclatorIne = null;

/**
 * El nomenclàtor indexat: { total, municipis: [{ ine, nom, provincia, valor, … }] }.
 * La primera crida fa l'import() del tros diferit i les altres reutilitzen la
 * mateixa promesa. Si la baixada falla, torna el nomenclàtor buit i la crida
 * següent ho torna a provar.
 */
export function carregaNomenclatorIne() {
  nomenclatorIne ??= import('../../data/nomenclator/municipis_ine_2026_espanya.v1.json')
    .then(indexaNomenclatorIne)
    .catch(() => {
      nomenclatorIne = null;
      return NOMENCLATOR_BUIT;
    });
  return nomenclatorIne;
}

/**
 * Els municipis de l'INE que casen amb `consulta` (sense accents ni
 * majúscules; també per l'altra forma dels noms oficials bilingües): primer
 * els que hi comencen i després els que la contenen, com a molt `limit`.
 * Una consulta buida no baixa res i torna una llista buida.
 */
export async function cercaMunicipisIne(consulta, { limit = LIMIT_CERCA_INE } = {}) {
  const q = clauDeForma(String(consulta ?? '').replace(ESPAIS, ' ').trim());
  if (!q) return BUIT;
  const { municipis } = await carregaNomenclatorIne();
  const comencen = [];
  const contenen = [];
  for (const municipi of municipis) {
    if (municipi.clauNom.startsWith(q)) comencen.push(municipi);
    else if (contenen.length < limit && municipi.clauCerca.includes(q)) contenen.push(municipi);
    if (comencen.length >= limit) break;
  }
  return Object.freeze([...comencen, ...contenen].slice(0, limit));
}
