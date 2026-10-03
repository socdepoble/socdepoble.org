/**
 * proveidors.js — registre de proveïdors après de l'historial i del catàleg.
 *
 * aprenProveidors agrupa les despeses dels trimestres ja lliurats per NIF (si
 * és vàlid) o pel nom normalitzat, en deduïx la cadència i l'IVA habitual i
 * ho fusiona amb el catàleg integrat (per NIF o per nom). El registre porta
 * també les entrades del catàleg que no s'han vist mai (mesosVistos buit):
 * servixen per a identificar un correu o un fitxer d'un proveïdor nou, però
 * cap auditoria espera res d'elles. JS pur: sense DOM ni React.
 *
 * CADÈNCIA (cadenciaDe), sobre els mesos 'aaaa-mm' vistos:
 *   mensual    tres mesos seguits, o parelles de mesos contigus que
 *              comencen en dos trimestres diferents (gener-febrer i
 *              abril-maig). Dos mesos qualssevol d'un trimestre no basten;
 *   bimestral  salts de dos mesos, almenys dos seguits (gener, març, maig),
 *              i cap parella de mesos contigus;
 *   trimestral mesos en dos trimestres o més, almenys dos d'ells seguits;
 *   anual      el mateix mes de l'any en anys diferents;
 *   puntual    la resta. Sense cap mes vist: null.
 * aprenProveidors només deixa que les mostres canvien la cadència del
 * catàleg quan n'hi ha tres o més: dues compres no fan cap proveïdor mensual.
 *
 * NIF alternatius (G3T-12): una societat del mateix grup declarada al
 * catàleg (nifsAlternatius) és el mateix proveïdor; a l'historial s'agrupa
 * amb el NIF principal i identificaProveidor la reconeix.
 * Cada entrada porta també el país (pais: el del catàleg o el del NIF, o
 * null) i els números de factura vistos a l'historial (numerosVistos), que
 * l'auditoria fa servir per a saber si un rebut cita una factura d'un
 * trimestre anterior.
 */
import { CATALEG_PROVEIDORS, nifsDelProveidor } from './cataleg.js';
import { comparaDates, esDataValida } from './dates.js';
import { normalitzaNom, TIPUS_IVA_HABITUALS } from './model.js';
import { normalitzaNif, validaNif } from './nif.js';

/* La forma d'un NIF espanyol (DNI, NIE o CIF), sense mirar-ne el control. */
const FORMA_ESPANYOLA = /^(?:\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J])$/;
/* Prefixos de NIF-IVA d'altres països: la Unió Europea (Grècia és EL i Irlanda del Nord, XI) i els veïns que en fan servir. */
const PREFIXOS_IVA = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL',
  'PT', 'RO', 'SE', 'SI', 'SK', 'XI', 'GB', 'CH', 'NO', 'IS', 'LI'
]);
const NIF_AMB_PREFIX = /^([A-Z]{2})(?=[A-Z0-9]*\d)[A-Z0-9]{2,13}$/;

/**
 * El país d'un NIF: 'ES' si té la forma d'un NIF espanyol (amb el prefix
 * «ES» o sense), el prefix si és un NIF-IVA d'un altre país conegut, i null
 * si no se sap (buit, il·legible o sense prefix, com els dels Estats Units).
 * @param {string} nif
 * @returns {string|null}
 */
export function paisDelNif(nif) {
  const n = normalitzaNif(nif);
  if (!n) return null;
  if (FORMA_ESPANYOLA.test(n)) return 'ES';
  const r = NIF_AMB_PREFIX.exec(n);
  return r && PREFIXOS_IVA.has(r[1]) ? r[1] : null;
}

/* Un número de factura tal com es compara entre fulls: sense espais de més i en majúscules. */
const numeroNet = (num) => String(num ?? '').trim().replace(/\s+/g, ' ').toUpperCase();

const TOLERANCIA_IVA_PUNTS = 0.6;
/* Puntuació de cada senyal d'identificació; cada senyal de més suma 5. */
const PUNTS = Object.freeze({ nif: 100, domini: 90, nom: 80, paraula: 65, fitxer: 50 });
const LLARGARIA_MINIMA_PARAULA = 3;

const dosXifres = (n) => String(n).padStart(2, '0');

/** Clau de mes 'aaaa-mm' d'una Data, o '' si no és vàlida. */
export const clauMes = (d) => (esDataValida(d) ? `${d.a}-${dosXifres(d.m)}` : '');

/** Índex absolut d'un mes 'aaaa-mm' (any × 12 + mes − 1), o null. */
export function indexMes(clau) {
  const r = /^(\d{4})-(\d{2})$/.exec(String(clau ?? ''));
  if (!r) return null;
  const m = Number(r[2]);
  return m >= 1 && m <= 12 ? Number(r[1]) * 12 + m - 1 : null;
}

/* Mostres a partir de les quals la cadència apresa substituïx la del catàleg. */
const MOSTRES_PER_A_CADENCIA = 3;

/* Tres mesos seguits, o parelles contigües que comencen en dos trimestres. */
function esMensual(index) {
  const trimestresAmbParella = new Set();
  let seguits = 1;
  for (let k = 1; k < index.length; k += 1) {
    if (index[k] !== index[k - 1] + 1) {
      seguits = 1;
      continue;
    }
    seguits += 1;
    if (seguits >= 3) return true;
    trimestresAmbParella.add(Math.floor(index[k - 1] / 3));
  }
  return trimestresAmbParella.size >= 2;
}

/* Dos salts seguits de dos mesos i cap parella de mesos contigus. */
function esBimestral(index) {
  if (index.some((i, k) => k > 0 && i - index[k - 1] === 1)) return false;
  let salts = 0;
  for (let k = 1; k < index.length; k += 1) {
    salts = index[k] - index[k - 1] === 2 ? salts + 1 : 0;
    if (salts >= 2) return true;
  }
  return false;
}

/**
 * Cadència d'uns mesos vistos (vegeu les regles a dalt).
 * @param {string[]} mesosVistos claus 'aaaa-mm'
 * @returns {'mensual'|'bimestral'|'trimestral'|'anual'|'puntual'|null}
 */
export function cadenciaDe(mesosVistos) {
  const index = [...new Set((mesosVistos ?? []).map(indexMes).filter((i) => i !== null))].sort((x, y) => x - y);
  if (index.length === 0) return null;
  if (esMensual(index)) return 'mensual';
  if (esBimestral(index)) return 'bimestral';
  const perTrimestre = new Map();
  for (const i of index) perTrimestre.set(Math.floor(i / 3), (perTrimestre.get(Math.floor(i / 3)) ?? 0) + 1);
  const trimestres = [...perTrimestre.keys()];
  if (trimestres.some((q, k) => k > 0 && q === trimestres[k - 1] + 1)) return 'trimestral';
  const perMes = new Map();
  for (const i of index) perMes.set(i % 12, (perMes.get(i % 12) ?? 0) + 1);
  if ([...perMes.values()].some((n) => n >= 2)) return 'anual';
  return 'puntual';
}

/* El tipus d'IVA més repetit (en percentatge), arrimat als tipus coneguts. */
function ivaApres(factures) {
  const comptes = new Map();
  for (const f of factures) {
    if (!Number.isSafeInteger(f.subtotal) || !Number.isSafeInteger(f.iva) || f.subtotal <= 0) continue;
    const percentatge = (f.iva / f.subtotal) * 100;
    const tipus = TIPUS_IVA_HABITUALS.find((t) => Math.abs(percentatge - t) <= TOLERANCIA_IVA_PUNTS) ?? Math.round(percentatge);
    comptes.set(tipus, (comptes.get(tipus) ?? 0) + 1);
  }
  let millor = null;
  let maxim = 0;
  for (const [tipus, n] of comptes) {
    if (n > maxim) {
      millor = tipus;
      maxim = n;
    }
  }
  return millor;
}

const textNet = (valor) => (valor == null ? '' : String(valor).replace(/\s+/g, ' ').trim());
const nifValid = (nif) => (validaNif(nif).valid ? normalitzaNif(nif) : '');
const fitxes = (nom) => (nom ? nom.split(' ') : []);
const esPrefix = (curt, llarg) => curt.length > 0 && curt.length <= llarg.length && curt.every((fitxa, i) => fitxa === llarg[i]);

/* El més repetit d'un recompte; en cas d'empat, el primer que va aparéixer. */
function mesRepetit(comptes) {
  let millor = '';
  let maxim = 0;
  for (const [v, n] of comptes) {
    if (n > maxim) {
      millor = v;
      maxim = n;
    }
  }
  return millor;
}

/* Punts per nom: igual al nom o a una paraula del proveïdor, o una paraula que n'és el principi. */
function puntsNom(nomNet, p) {
  if (!nomNet) return 0;
  const candidats = [p.nom, ...(p.paraulesText ?? [])].map(normalitzaNom).filter(Boolean);
  if (candidats.includes(nomNet)) return PUNTS.nom;
  const delNom = fitxes(nomNet);
  const perParaula = candidats.some((c) => c.length >= LLARGARIA_MINIMA_PARAULA && esPrefix(fitxes(c), delNom));
  return perParaula ? PUNTS.paraula : 0;
}

/* L'entrada del catàleg que correspon a un grup de l'historial: primer per NIF (principal o alternatiu), després per nom. */
function entradaDelCataleg(grup, cataleg) {
  if (grup.nif) {
    const perNif = cataleg.find((c) => nifsDelProveidor(c).includes(grup.nif));
    if (perNif) return perNif;
  }
  return cataleg.find((c) => {
    const nifs = nifsDelProveidor(c);
    if (grup.nif && nifs.length > 0 && !nifs.includes(grup.nif)) return false;
    return [...grup.noms.keys()].some((nom) => puntsNom(normalitzaNom(nom), c) > 0);
  }) ?? null;
}

/* Cada NIF alternatiu del catàleg apunta al NIF principal del seu proveïdor: a l'historial s'agrupen junts. */
function nifsCanonics(cataleg) {
  const canonic = new Map();
  for (const c of cataleg) {
    const [principal, ...alternatius] = nifsDelProveidor(c);
    for (const alternatiu of alternatius) if (!canonic.has(alternatiu)) canonic.set(alternatiu, principal);
  }
  return canonic;
}

function slug(text) {
  return normalitzaNom(text).replace(/\s+/g, '-');
}

/**
 * Aprén el registre de proveïdors de les factures dels trimestres anteriors
 * (només les despeses) i el fusiona amb el catàleg.
 * @param {object[]} facturesHistoriques Factures
 * @param {{ cataleg?: object[], nifsPropis?: string[] }} [opcions] nifsPropis:
 *   els NIF del titular, que mai no són d'un proveïdor.
 * @returns {Array<{ clau: string, nom: string, nif: string|null, nifsAlternatius: string[], pais: string|null,
 *   dominis: string[], patronsFitxer: RegExp[], patronsNum: RegExp[], paraulesText: string[], cadencia: string|null,
 *   mesosVistos: string[], numerosVistos: string[], ivaHabitual: number|null, ultimaDescripcio: string,
 *   nombreFactures: number }>}
 */
export function aprenProveidors(facturesHistoriques, { cataleg = CATALEG_PROVEIDORS, nifsPropis = [] } = {}) {
  const llistaCataleg = cataleg ?? [];
  const canonic = nifsCanonics(llistaCataleg);
  const propis = new Set((nifsPropis ?? []).map(normalitzaNif).filter(Boolean));
  const grups = [];
  const perNif = new Map();
  const perNom = new Map();
  for (const f of facturesHistoriques ?? []) {
    if (!f || f.tipus !== 'despesa') continue;
    const llegit = nifValid(f.nif);
    const nif = canonic.get(llegit) ?? llegit;
    if (propis.has(normalitzaNif(f.nif))) continue;
    const nom = normalitzaNom(f.contrapart);
    if (!nif && !nom) continue;
    let grup = (nif && perNif.get(nif)) || null;
    if (!grup && nom && perNom.has(nom) && (!nif || !perNom.get(nom).nif)) grup = perNom.get(nom);
    if (!grup) {
      grup = { nif: '', nifs: new Set(), noms: new Map(), factures: [] };
      grups.push(grup);
    }
    if (nif && !grup.nif) {
      grup.nif = nif;
      perNif.set(nif, grup);
    }
    if (llegit) grup.nifs.add(llegit);
    if (nom && !perNom.has(nom)) perNom.set(nom, grup);
    const original = textNet(f.contrapart);
    if (original) grup.noms.set(original, (grup.noms.get(original) ?? 0) + 1);
    grup.factures.push(f);
  }

  const claus = new Set(llistaCataleg.map((c) => c.clau));
  const fusionades = new Set();
  const unica = (base) => {
    let clau = base || 'proveidor';
    for (let n = 2; claus.has(clau); n += 1) clau = `${base || 'proveidor'}-${n}`;
    claus.add(clau);
    return clau;
  };

  const apresos = grups.map((grup) => {
    const c = entradaDelCataleg(grup, llistaCataleg);
    const nomVist = mesRepetit(grup.noms);
    const mesosVistos = [...new Set(grup.factures.map((f) => clauMes(f.data)).filter(Boolean))].sort();
    /* La descripció de la factura més recent; les que no tenen data compten com les més antigues. */
    const darrera = grup.factures.filter((f) => textNet(f.descripcio)).reduce((x, f) => {
      if (!x) return f;
      if (!esDataValida(f.data)) return x;
      return !esDataValida(x.data) || comparaDates(f.data, x.data) >= 0 ? f : x;
    }, null);
    /* Una entrada del catàleg només es fusiona una vegada: la segona empresa que hi casa pren «clau-2». */
    let clau;
    if (c && !fusionades.has(c.clau)) clau = c.clau;
    else clau = unica(c ? c.clau : slug(nomVist) || `nif-${grup.nif.toLowerCase()}`);
    if (c) fusionades.add(c.clau);
    const nif = grup.nif || (c?.nif ? normalitzaNif(c.nif) : null);
    return {
      clau,
      nom: nomVist || c?.nom || '',
      nif,
      nifsAlternatius: [...new Set([...(c ? nifsDelProveidor(c) : []), ...grup.nifs])].filter((n) => n !== nif),
      pais: c?.pais ?? paisDelNif(nif),
      dominis: [...(c?.dominis ?? [])],
      patronsFitxer: [...(c?.patronsFitxer ?? [])],
      patronsNum: [...(c?.patronsNum ?? [])],
      paraulesText: [...new Set([...(c ? [c.nom, ...(c.paraulesText ?? [])] : []), ...grup.noms.keys()])],
      cadencia: mesosVistos.length >= MOSTRES_PER_A_CADENCIA || !c?.cadencia ? cadenciaDe(mesosVistos) : c.cadencia,
      mesosVistos,
      numerosVistos: [...new Set(grup.factures.map((f) => numeroNet(f.num)).filter(Boolean))].sort(),
      ivaHabitual: ivaApres(grup.factures) ?? c?.ivaHabitual ?? null,
      ultimaDescripcio: darrera ? textNet(darrera.descripcio) : '',
      nombreFactures: grup.factures.length
    };
  });

  const col = new Intl.Collator('ca', { sensitivity: 'base' });
  apresos.sort((x, y) => col.compare(x.nom, y.nom) || (x.clau < y.clau ? -1 : 1));
  const delCataleg = llistaCataleg.filter((c) => !fusionades.has(c.clau)).map((c) => {
    const nif = c.nif ? normalitzaNif(c.nif) : null;
    return {
      clau: c.clau,
      nom: c.nom,
      nif,
      nifsAlternatius: nifsDelProveidor(c).filter((n) => n !== nif),
      pais: c.pais ?? paisDelNif(nif),
      dominis: [...(c.dominis ?? [])],
      patronsFitxer: [...(c.patronsFitxer ?? [])],
      patronsNum: [...(c.patronsNum ?? [])],
      paraulesText: [...new Set([c.nom, ...(c.paraulesText ?? [])])],
      cadencia: c.cadencia ?? null,
      mesosVistos: [],
      numerosVistos: [],
      ivaHabitual: c.ivaHabitual ?? null,
      ultimaDescripcio: '',
      nombreFactures: 0
    };
  });
  return [...apresos, ...delCataleg];
}

/* L'amfitrió d'un domini, correu («Nom <compte@domini>») o URL: minúscules, sense www. */
function amfitrioDe(text) {
  let s = String(text ?? '').trim().toLowerCase();
  const arroba = s.lastIndexOf('@');
  if (arroba >= 0) s = s.slice(arroba + 1);
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  return s.split(/[/?:>\s]/)[0].replace(/\.$/, '').replace(/^www\./, '');
}

const nomDeFitxer = (ruta) => String(ruta ?? '').split(/[\\/]/).pop().trim();

/**
 * Identifica el proveïdor del registre que millor casa amb uns senyals. Un NIF
 * vàlid que no és cap dels d'un proveïdor (el principal o un d'alternatiu)
 * el descarta. Punts: NIF 100, domini 90, nom 80, paraula 65, nom de fitxer
 * 50; cada senyal de més +5 (fins a 100). En un empat guanya el proveïdor ja
 * vist a l'historial.
 * @param {{ nif?: string, nom?: string, domini?: string, nomFitxer?: string }} senyals
 * @param {object[]} registre el d'aprenProveidors
 * @returns {{ proveidor: object, puntuacio: number }|null}
 */
export function identificaProveidor(senyals, registre) {
  const { nif, nom, domini, nomFitxer } = senyals ?? {};
  const nifNet = nifValid(nif);
  const nomNet = normalitzaNom(nom);
  const amfitrio = amfitrioDe(domini);
  const fitxer = nomDeFitxer(nomFitxer);
  let millor = null;
  for (const p of registre ?? []) {
    if (!p) continue;
    const nifsP = nifsDelProveidor(p);
    if (nifNet && nifsP.length > 0 && !nifsP.includes(nifNet)) continue;
    const punts = [];
    if (nifNet && nifsP.includes(nifNet)) punts.push(PUNTS.nif);
    if (amfitrio && (p.dominis ?? []).some((d) => amfitrio === d || amfitrio.endsWith(`.${d}`))) punts.push(PUNTS.domini);
    const perNom = puntsNom(nomNet, p);
    if (perNom) punts.push(perNom);
    if (fitxer && (p.patronsFitxer ?? []).some((patro) => patro.test(fitxer))) punts.push(PUNTS.fitxer);
    if (punts.length === 0) continue;
    const puntuacio = Math.min(100, Math.max(...punts) + 5 * (punts.length - 1));
    const vist = (x) => (x.mesosVistos?.length ?? 0) > 0;
    if (!millor || puntuacio > millor.puntuacio || (puntuacio === millor.puntuacio && vist(p) && !vist(millor.proveidor))) {
      millor = { proveidor: p, puntuacio };
    }
  }
  return millor;
}
