/**
 * auditoria.js — avisos d'un trimestre: factures que falten, duplicats i dubtes.
 *
 * Creua les factures del trimestre amb el registre de proveïdors (historial i
 * catàleg), els documents de la carpeta i, si n'hi ha, els resums del correu.
 * Els avisos són indicis per a revisar, no veredictes: mai no es declara el
 * trimestre «complet». Només importa nuclis compartits pels dos tractors
 * (classifica.js i correus.js no): els documents i els correus arriben ja
 * classificats i resumits. JS pur: sense DOM ni React.
 *
 * Correus: els resums de resumCorreu. Un correu compta com de factura si no
 * porta esFactura === false (passa esFactura amb esCorreuDeFactura, o passa
 * només els de factura); tots compten per a la cobertura.
 * Documents: { ruta, mida?, sha256?, tipus, proveidor? (clau), import? (cèntims),
 * numeroCitat? (als rebuts: el número de factura que citen, o null) }.
 *
 * A més de les de validaFactura, les incidències del trimestre: NIF_PROPI,
 * DUPLICAT, FALTA_MENSUAL, FALTA_HABITUAL, REBUT_SENSE_FACTURA (alta si el
 * rebut cita un número que no hi és, G3T-04, entre les factures del seu
 * proveïdor si se sap, G3T-R06; mitjana si es casa per proveïdor i import),
 * PAGAMENT_AGRUPAT (informativa, R3T-03: un rebut sense número que paga
 * alhora dues o més factures del proveïdor, pels totals o per l'IVA),
 * FORAT_NUMERACIO (indici, G3T-05: números absents dins d'una sèrie densa
 * d'un proveïdor, amb tres números vistos o més, o de la sèrie emesa pròpia),
 * IVA_ESTRANGER (una despesa d'una empresa d'un altre país: amb IVA o
 * sense, és cosa de la gestoria), POSSIBLE_DOBLE_COBRAMENT (indici: mateix
 * proveïdor, dia i import amb números diferents) i les del correu.
 */
import {
  comparaDates, diesEntre, dinsDeRang, esDataValida, formatData, mesosDelTrimestre, nomMes, rangTrimestre
} from './dates.js';
import { formatImport } from './diners.js';
import { clauDuplicat, numeroCompacte, validaFactura } from './model.js';
import { normalitzaNif } from './nif.js';
import { aprenProveidors, clauMes, identificaProveidor, indexMes, paisDelNif } from './proveidors.js';

export const SEVERITATS = Object.freeze(['alta', 'mitjana', 'baixa', 'info']);
const DIES_CORREU = 7;
const MISSATGE_CORREU_NO_REVISAT = "Correu no revisat: la detecció de factures absents es basa només en la carpeta i l'historial.";
/* Una cita només casa pel nom del fitxer de la factura si té almenys 5 caràcters (sense separadors). */
const MIN_CITA_PEL_FITXER = 5;
const MIN_CITA_SENSE_SEPARADORS = 3;
/* Una sèrie és densa si el rang no passa de 3 vegades els números vistos (no la numeració global d'una gran empresa). */
const DENSITAT_SERIE = 3;
/* G3T-R07: la sèrie pròpia ha de ser correlativa i dos números ja diuen prou; la d'un proveïdor, no: un autònom
   numera igual per a tots els clients i dos números seus amb un salt són factures d'altres. Calen tres. */
const MIN_VISTOS_EMESA = 2;
const MIN_VISTOS_PROVEIDOR = 3;
const MAX_XIFRES_SERIE = 15;
/* R3T-03: un pagament agrupat es busca entre les factures d'un proveïdor si no en són més d'estes. */
const MAX_FACTURES_AGRUPADES = 12;
const MAX_NUMEROS_LLISTATS = 10;
/* El nom del país dels prefixos més habituals; la resta, amb el codi. */
const NOMS_PAIS = Object.freeze({
  IE: 'Irlanda', US: 'Estats Units', GB: 'Regne Unit', DE: 'Alemanya', FR: 'França', NL: 'Països Baixos', LU: 'Luxemburg',
  PT: 'Portugal', IT: 'Itàlia', BE: 'Bèlgica', CH: 'Suïssa', XI: 'Irlanda del Nord'
});

const nomDeFitxer = (ruta) => String(ruta ?? '').split(/[\\/]/).pop();
const senseExtensio = (nom) => nom.replace(/\.[a-z0-9]{1,5}$/i, '');
/* Un número sense espais ni separadors, en majúscules: «X-0004», «x 0004» i «X.0004» són el mateix. */
const senseSeparadors = (num) => numeroCompacte(num).replace(/[-_./]/g, '');
const dadesDeFactura = (f) => ({ ...(f.origen?.fitxer ? { fitxer: f.origen.fitxer } : {}), ...(f.id ? { facturaId: f.id } : {}) });
/* «a», «a i b», «a, b i c». */
const enumera = (textos) => (textos.length <= 1 ? textos.join('') : `${textos.slice(0, -1).join(', ')} i ${textos[textos.length - 1]}`);
/* «de» o «d'» davant d'un nom: d'abril, d'Adobe, però de iogurt (vocals amb accent incloses). */
const VOCAL = '[aeiou\\u00e0\\u00e8\\u00e9\\u00ed\\u00f2\\u00f3\\u00fa]';
const AMB_APOSTROF = new RegExp(`^h?${VOCAL}`, 'i');
const SEMIVOCAL = new RegExp(`^h?[iu]${VOCAL}`, 'i');
const de = (text) => (AMB_APOSTROF.test(text) && !SEMIVOCAL.test(text) ? `d'${text}` : `de ${text}`);
const indexDe = (a, m) => a * 12 + m - 1;
const compara = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
/* L'ordre d'un grup de factures repetides no depén de l'ordre d'entrada (el tractor les passa per fitxer i la
   revisió, per data): primer el número i després el fitxer, com la llista de la carpeta. */
const perNumIFitxer = (x, y) => compara(numeroCompacte(x.num), numeroCompacte(y.num))
  || compara(String(x.origen?.fitxer ?? ''), String(y.origen?.fitxer ?? ''));

function sumaDies(d, n) {
  const x = new Date(Date.UTC(d.a, d.m - 1, d.d + n));
  return { a: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() };
}

/* Índexs de mes ordenats i sense repetir d'unes claus 'aaaa-mm'. */
const indexsDe = (claus) => [...new Set(claus.map(indexMes).filter((i) => i !== null))].sort((x, y) => x - y);

/* Cert si els mesos vistos cobrixen els tres mesos d'algun trimestre anterior a `trimestre`. */
function trimestreSencerAbans(mesosVistos, trimestre) {
  const perTrimestre = new Map();
  for (const i of indexsDe(mesosVistos ?? [])) {
    const q = Math.floor(i / 3);
    if (q < trimestre) perTrimestre.set(q, (perTrimestre.get(q) ?? 0) + 1);
  }
  return [...perTrimestre.values()].some((n) => n >= 3);
}

/* El millor proveïdor d'un correu: pel domini, el nom del remitent i cada adjunt. */
function proveidorDelCorreu(correu, registre) {
  let millor = null;
  for (const nomFitxer of [undefined, ...(correu.adjunts ?? [])]) {
    const r = identificaProveidor({ domini: correu.domini || correu.de, nom: correu.nomRemitent, nomFitxer }, registre);
    if (r && (!millor || r.puntuacio > millor.puntuacio)) millor = r;
  }
  return millor?.proveidor ?? null;
}

/* G3T-04: cert si la factura és la que cita un rebut. Pel número normalitzat com a clauDuplicat, o sense
   separadors; i, si el número es va llegir truncat, pel nom del fitxer de la factura, que acaba amb el citat. */
function casaAmbCita(f, cita) {
  const compacta = numeroCompacte(cita);
  if (!compacta) return false;
  if (numeroCompacte(f.num) === compacta) return true;
  const pelada = senseSeparadors(cita);
  if (pelada.length >= MIN_CITA_SENSE_SEPARADORS && senseSeparadors(f.num) === pelada) return true;
  return pelada.length >= MIN_CITA_PEL_FITXER && senseSeparadors(senseExtensio(nomDeFitxer(f.origen?.fitxer))).endsWith(pelada);
}

/* G3T-05: un número partit en prefix i comptador final: «QX7ZK2WM-0004» → prefix «QX7ZK2WM-», n 4, amplada 4.
   La clau del prefix no porta espais ni separadors, perquè «X 0004» i «X-0005» són de la mateixa sèrie. */
function partNumero(num) {
  const net = String(num ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
  const r = /^(.*?)(\d+)$/.exec(net);
  if (!r || r[2].length > MAX_XIFRES_SERIE) return null;
  return { prefix: r[1], clau: r[1].replace(/[\s\-_./]+/g, ''), n: Number(r[2]), amplada: r[2].length };
}

/* Els comptadors absents d'una sèrie densa: entre el mínim del trimestre (o l'últim número anterior de
   l'historial, si n'hi ha) i el màxim del trimestre. Una sèrie que no és densa, o amb menys de `minimVistos`
   números, no en dona cap. */
function absentsDe(delTrimestre, anteriors = [], minimVistos = MIN_VISTOS_EMESA) {
  const presents = new Set(delTrimestre.map((x) => x.n));
  if (presents.size === 0) return { absents: [], des: null, fins: null };
  const minim = Math.min(...presents);
  const fins = Math.max(...presents);
  const abans = anteriors.map((x) => x.n).filter((n) => n < minim);
  const des = abans.length > 0 ? Math.max(...abans) : minim;
  const vistos = new Set([...presents, ...anteriors.map((x) => x.n)].filter((n) => n >= des && n <= fins));
  if (vistos.size < minimVistos || fins - des + 1 > DENSITAT_SERIE * vistos.size) return { absents: [], des, fins };
  const absents = [];
  for (let n = des + 1; n < fins; n += 1) if (!vistos.has(n)) absents.push(n);
  return { absents, des, fins };
}

function missatgeForat(numeros, { serie, primer, ultim, motiu }) {
  const mostrats = numeros.slice(0, MAX_NUMEROS_LLISTATS).map((n) => `«${n}»`);
  const resta = numeros.length - mostrats.length;
  const quins = resta > 0 ? `${mostrats.join(', ')} i ${resta} més` : enumera(mostrats);
  const falta = numeros.length === 1 ? `falta el número ${quins}` : `falten els números ${quins}`;
  return `Indici: ${falta} ${serie} (entre «${primer}» i «${ultim}»). Pot ser una factura anul·lada o ${motiu}; si no, falta a la carpeta.`;
}

/* R3T-03: el subconjunt més curt (dos o més) de valors positius que suma l'objectiu (± 1 cèntim), en índexs, o null. */
function subconjuntAmbSuma(valors, objectiu) {
  let millor = null;
  const triats = [];
  const recorre = (des, suma) => {
    if (suma > objectiu + 1 || (millor && triats.length >= millor.length)) return;
    if (triats.length >= 2 && Math.abs(suma - objectiu) <= 1) {
      millor = [...triats];
      return;
    }
    for (let k = des; k < valors.length; k += 1) {
      triats.push(k);
      recorre(k + 1, suma + valors[k]);
      triats.pop();
    }
  };
  recorre(0, 0);
  return millor;
}

/* R3T-03: si l'import d'un rebut és la suma dels totals (o, si no, de les quotes d'IVA) de dues o més factures
   del proveïdor, { part: 'total'|'iva', factures }; si no, o si el proveïdor en té massa per a provar-ho, null. */
function pagamentAgrupat(imp, factures) {
  if (!(imp > 0) || factures.length < 2 || factures.length > MAX_FACTURES_AGRUPADES) return null;
  for (const part of ['total', 'iva']) {
    const amb = factures.filter((f) => Number.isSafeInteger(f[part]) && f[part] > 0);
    const index = subconjuntAmbSuma(amb.map((f) => f[part]), imp);
    if (index) return { part, factures: index.map((k) => amb[k]).sort(perNumIFitxer) };
  }
  return null;
}

/* Els forats de cada sèrie: [{ numeros, primer, ultim, ...extra }]. `series` és un Map clau → { numeros, extra }. */
function foratsDe(series, anteriorsDe = () => [], minimVistos = MIN_VISTOS_EMESA) {
  const forats = [];
  for (const [clau, { numeros, extra }] of series) {
    const { absents, des, fins } = absentsDe(numeros, anteriorsDe(clau), minimVistos);
    if (absents.length === 0) continue;
    const model = numeros.reduce((x, y) => (y.n < x.n ? y : x));
    const escriu = (n) => `${model.prefix}${String(n).padStart(model.amplada, '0')}`;
    forats.push({ numeros: absents.map(escriu), primer: escriu(des), ultim: escriu(fins), ...extra });
  }
  return forats;
}

/**
 * Audita un trimestre.
 * @param {object} p
 * @param {number} p.any
 * @param {number} p.t trimestre (1-4)
 * @param {object[]} p.factures les Factures del trimestre
 * @param {object[]} [p.documents] els documents classificats de la carpeta del trimestre
 * @param {object[]} [p.proveidors] el registre d'aprenProveidors (sense: només el catàleg)
 * @param {object[]|null} [p.correus] resums de resumCorreu, o null si no s'ha revisat el correu
 * @param {string[]} [p.nifsPropis] els NIF del titular
 * @param {{a:number,m:number,d:number}|null} [p.avui] sense avisos de mesos que encara no han arribat
 * @param {Array<{ motiu: string, documents: object[] }>|null} [p.duplicats] els grups de detectaDuplicats;
 *   sense, només es comparen els sha256 dels documents
 * @param {object[]|null} [p.historial] les Factures dels fulls anteriors: la correlativitat de la sèrie
 *   emesa pròpia entre trimestres i les factures que pot citar un rebut
 * @returns {{ incidencies: object[], cobertura: object, resum: object }}
 */
export function auditaTrimestre({
  any, t, factures = [], documents = [], proveidors = null, correus = null, nifsPropis = [], avui = null, duplicats = null,
  historial = null
} = {}) {
  const rang = rangTrimestre(any, t);
  if (!rang) throw new RangeError(`Trimestre no vàlid: ${any} ${t}T`);
  const registre = Array.isArray(proveidors) ? proveidors : aprenProveidors([]);
  const anteriors = (Array.isArray(historial) ? historial : []).filter(Boolean);
  const llista = (factures ?? []).filter(Boolean);
  const docs = (documents ?? []).filter((d) => d && typeof d.ruta === 'string');
  const propis = new Set((nifsPropis ?? []).map(normalitzaNif).filter(Boolean));
  const ambAvui = esDataValida(avui);
  const mesFutur = (a, m) => ambAvui && indexDe(a, m) > indexDe(avui.a, avui.m);
  const incidencies = [];
  const afig = (incidencia) => incidencies.push(incidencia);

  for (const f of llista) incidencies.push(...validaFactura(f, { rang }));

  for (const f of llista) {
    if (!propis.has(normalitzaNif(f.nif))) continue;
    afig({
      codi: 'NIF_PROPI',
      severitat: 'alta',
      missatge: f.tipus === 'ingres'
        ? 'El NIF del client és el teu: revisa si la factura és emesa o rebuda.'
        : "El NIF del proveïdor és el teu: segurament s'ha llegit el NIF del destinatari en lloc del de l'emissor.",
      ...(f.origen?.fitxer ? { fitxer: f.origen.fitxer } : {}),
      ...(f.id ? { facturaId: f.id } : {})
    });
  }

  /* Duplicats de factures: el mateix NIF (o nom) i el mateix número. */
  const perClau = new Map();
  for (const f of llista) {
    const clau = clauDuplicat(f);
    const [qui, num] = clau.split('|');
    if (!qui || !num) continue;
    const grup = perClau.get(`${f.tipus}|${clau}`) ?? [];
    grup.push(f);
    perClau.set(`${f.tipus}|${clau}`, grup);
  }
  for (const grup of perClau.values()) {
    const [primera, ...repetides] = [...grup].sort(perNumIFitxer);
    for (const f of repetides) {
      const on = primera.origen?.fitxer ? ` (també a «${nomDeFitxer(primera.origen.fitxer)}»)` : '';
      afig({
        codi: 'DUPLICAT',
        severitat: 'mitjana',
        missatge: `Possible duplicat: la factura «${f.num}»${f.contrapart ? ` ${de(f.contrapart)}` : ''} apareix més d'una vegada${on}.`,
        ...(f.origen?.fitxer ? { fitxer: f.origen.fitxer } : {}),
        ...(f.id ? { facturaId: f.id } : {})
      });
    }
  }

  /* Duplicats de documents: els grups de detectaDuplicats o, si no n'hi ha, el mateix sha256. */
  let grupsDocs = duplicats;
  if (!Array.isArray(grupsDocs)) {
    const perSha = new Map();
    for (const d of docs) if (d.sha256) perSha.set(d.sha256, [...(perSha.get(d.sha256) ?? []), d]);
    grupsDocs = [...perSha.values()].filter((g) => g.length > 1).map((g) => ({ motiu: 'contingut', documents: g }));
  }
  for (const grup of grupsDocs) {
    const [original, ...copies] = grup?.documents ?? [];
    for (const d of copies) {
      const relacio = grup.motiu === 'contingut' ? 'té el mateix contingut que' : 'pareix una còpia de';
      afig({
        codi: 'DUPLICAT',
        severitat: 'mitjana',
        missatge: `Document duplicat: «${nomDeFitxer(d.ruta)}» ${relacio} «${nomDeFitxer(original.ruta)}».`,
        fitxer: d.ruta
      });
    }
  }

  /* Les despeses del trimestre, per proveïdor. */
  const despeses = llista.filter((f) => f.tipus === 'despesa');
  const proveidorDe = new Map();
  const perProveidor = new Map();
  for (const f of despeses) {
    const nif = propis.has(normalitzaNif(f.nif)) ? '' : f.nif;
    const p = identificaProveidor({ nif, nom: f.contrapart, nomFitxer: f.origen?.fitxer }, registre)?.proveidor ?? null;
    proveidorDe.set(f, p);
    if (p) perProveidor.set(p.clau, [...(perProveidor.get(p.clau) ?? []), f]);
  }

  const mesos = mesosDelTrimestre(t);
  const indexInici = indexDe(any, mesos[0]);
  const trimestreActual = Math.floor(indexInici / 3);

  /* FALTA_MENSUAL: proveïdors que facturen cada mes i que han facturat el trimestre anterior o este.
     Alta només si l'historial els ha vist els tres mesos d'algun trimestre anterior; si no, mitjana. */
  for (const p of registre) {
    if (p?.cadencia !== 'mensual') continue;
    const propies = perProveidor.get(p.clau) ?? [];
    const presents = new Set(propies.map((f) => clauMes(f.data)).filter(Boolean));
    const vistos = [...(p.mesosVistos ?? []), ...presents].map(indexMes).filter((i) => i !== null);
    if (!vistos.some((i) => i >= indexInici - 3 && i <= indexInici + 2)) continue;
    const primer = Math.min(...vistos);
    const senseData = propies.filter((f) => !esDataValida(f.data)).length;
    const severitat = trimestreSencerAbans(p.mesosVistos, trimestreActual) ? 'alta' : 'mitjana';
    for (const m of mesos) {
      if (indexDe(any, m) < primer || mesFutur(any, m) || presents.has(clauMes({ a: any, m, d: 1 }))) continue;
      const nota = senseData > 0 ? ` Hi ha ${senseData === 1 ? 'una factura seua' : `${senseData} factures seues`} sense data: revisa-la.` : '';
      afig({
        codi: 'FALTA_MENSUAL',
        severitat,
        missatge: `Falta la factura ${de(nomMes(m))} de ${any} ${de(p.nom)}, que factura cada mes.${nota}`,
        proveidor: p.clau,
        mes: clauMes({ a: any, m, d: 1 })
      });
    }
  }

  /* Els bimestrals: la factura s'espera dos mesos després de l'última vista (o un mes
     abans o després, si la data s'ha mogut). Una que falta és un indici (FALTA_HABITUAL). */
  for (const p of registre) {
    if (p?.cadencia !== 'bimestral') continue;
    const propies = perProveidor.get(p.clau) ?? [];
    const vistos = indexsDe([...(p.mesosVistos ?? []), ...propies.map((f) => clauMes(f.data)).filter(Boolean)]);
    if (!vistos.some((i) => i >= indexInici - 4 && i <= indexInici + 2)) continue;
    const anteriors = vistos.filter((i) => i < indexInici);
    let ancora = anteriors.length > 0 ? anteriors[anteriors.length - 1] : vistos[0];
    for (let esperat = ancora + 2; esperat <= indexInici + 2; esperat = ancora + 2) {
      const trobat = [esperat, esperat - 1, esperat + 1].find((i) => vistos.includes(i));
      ancora = trobat ?? esperat;
      const m = (esperat % 12) + 1;
      if (trobat !== undefined || esperat < indexInici || mesFutur(any, m)) continue;
      afig({
        codi: 'FALTA_HABITUAL',
        severitat: 'mitjana',
        missatge: `Indici: falta la factura ${de(nomMes(m))} de ${any} ${de(p.nom)}, que factura cada dos mesos. Pot ser normal; revisa-ho.`,
        proveidor: p.clau,
        mes: clauMes({ a: any, m, d: 1 })
      });
    }
  }

  /* FALTA_HABITUAL: proveïdors no mensuals ni bimestrals que s'esperaven i no hi són. És un indici. */
  const trimestreAcabat = !ambAvui || comparaDates(avui, rang.fi) > 0;
  for (const p of registre) {
    if (!p || p.cadencia === 'mensual' || p.cadencia === 'bimestral' || perProveidor.has(p.clau)) continue;
    const anteriors = (p.mesosVistos ?? []).map(indexMes).filter((i) => i !== null && i < indexInici);
    if (anteriors.length === 0) continue;
    const trimestres = new Set(anteriors.map((i) => Math.floor(i / 3)));
    let motiu = null;
    if (p.cadencia === 'anual') {
      const esperats = anteriors.filter((i) => Math.floor(i / 3) === trimestreActual - 4).map((i) => (i % 12) + 1);
      if (esperats.length > 0 && esperats.some((m) => !mesFutur(any, m))) motiu = "va facturar en este trimestre l'any passat";
    } else if (trimestreAcabat && trimestres.has(trimestreActual - 1)) {
      if (p.cadencia === 'trimestral') motiu = 'va facturar el trimestre anterior';
      else if (trimestres.size >= 2) motiu = "ha facturat en diversos trimestres anteriors, també en l'últim";
    }
    if (!motiu) continue;
    afig({
      codi: 'FALTA_HABITUAL',
      severitat: 'mitjana',
      missatge: `Indici: ${p.nom} ${motiu} i en este no hi ha cap factura seua. Pot ser normal; revisa-ho.`,
      proveidor: p.clau
    });
  }

  /* La identitat d'una despesa per a agrupar-la: el proveïdor del registre o, si no se sap, el NIF o el nom. */
  const quiDe = (f) => {
    const p = proveidorDe.get(f);
    if (p) return `p:${p.clau}`;
    const [qui] = clauDuplicat(f).split('|');
    return qui ? `q:${qui}` : '';
  };

  /* FORAT_NUMERACIO (G3T-05): números absents dins d'una sèrie densa de cada proveïdor i prefix. És un indici. */
  const seriesRebudes = new Map();
  for (const f of despeses) {
    const part = partNumero(f.num);
    const qui = part ? quiDe(f) : '';
    if (!qui) continue;
    const clau = `${qui}|${part.clau}`;
    const p = proveidorDe.get(f);
    const serie = seriesRebudes.get(clau) ?? { numeros: [], extra: { p, nom: p?.nom || f.contrapart } };
    serie.numeros.push(part);
    seriesRebudes.set(clau, serie);
  }
  for (const { numeros, primer, ultim, p, nom } of foratsDe(seriesRebudes, undefined, MIN_VISTOS_PROVEIDOR)) {
    afig({
      codi: 'FORAT_NUMERACIO',
      severitat: 'mitjana',
      missatge: missatgeForat(numeros, {
        serie: nom ? `a la sèrie de factures ${de(nom)}` : "a la sèrie de factures d'un proveïdor", primer, ultim, motiu: "d'un altre compte"
      }),
      numeros,
      ...(p ? { proveidor: p.clau } : {})
    });
  }

  /* La sèrie emesa pròpia ha de ser correlativa: amb l'historial, també entre trimestres. */
  const perPrefix = (conjunt) => {
    const series = new Map();
    for (const f of conjunt) {
      const part = f?.tipus === 'ingres' ? partNumero(f.num) : null;
      if (!part) continue;
      const serie = series.get(part.clau) ?? { numeros: [], extra: {} };
      serie.numeros.push(part);
      series.set(part.clau, serie);
    }
    return series;
  };
  const emesesAnteriors = perPrefix(anteriors);
  for (const { numeros, primer, ultim } of foratsDe(perPrefix(llista), (clau) => emesesAnteriors.get(clau)?.numeros ?? [])) {
    afig({
      codi: 'FORAT_NUMERACIO',
      severitat: 'mitjana',
      missatge: missatgeForat(numeros, { serie: 'a la teua sèrie de factures emeses', primer, ultim, motiu: "d'una altra sèrie" }),
      numeros
    });
  }

  /* IVA_ESTRANGER: una despesa d'una empresa d'un altre país (pel prefix del NIF-IVA o, sense NIF, pel país del
     proveïdor). Sense IVA pot ser una autoliquidació; amb IVA, cal saber si és deduïble. Ho decidix la gestoria. */
  for (const f of despeses) {
    if (propis.has(normalitzaNif(f.nif)) || !Number.isSafeInteger(f.iva)) continue;
    const pais = paisDelNif(f.nif) ?? proveidorDe.get(f)?.pais ?? null;
    if (!pais || pais === 'ES') continue;
    const on = NOMS_PAIS[pais] ?? pais;
    const tipus = Number.isSafeInteger(f.subtotal) && f.subtotal !== 0
      ? ` (${String(Math.round((f.iva / Math.abs(f.subtotal)) * 1000) / 10).replace('.', ',')} %)` : '';
    afig({
      codi: 'IVA_ESTRANGER',
      severitat: 'mitjana',
      missatge: f.iva === 0
        ? `Factura d'una empresa d'un altre país (${on}) sense IVA: pot ser una operació amb autoliquidació `
          + '(inversió del subjecte passiu). Pregunta-ho a la gestoria.'
        : `Factura d'una empresa d'un altre país (${on}) amb IVA${tipus}: pregunta a la gestoria si eixe IVA és deduïble.`,
      pais,
      ...dadesDeFactura(f)
    });
  }

  /* POSSIBLE_DOBLE_COBRAMENT: el mateix proveïdor, el mateix dia i el mateix import amb números diferents. */
  const perDiaImport = new Map();
  for (const f of despeses) {
    if (!esDataValida(f.data) || !Number.isSafeInteger(f.total) || f.total === 0 || !numeroCompacte(f.num)) continue;
    const qui = quiDe(f);
    if (!qui) continue;
    const clau = `${qui}|${formatData(f.data, 'aaaa-mm-dd')}|${f.total}`;
    perDiaImport.set(clau, [...(perDiaImport.get(clau) ?? []), f]);
  }
  for (const [primera, ...resta] of [...perDiaImport.values()].map((grup) => [...grup].sort(perNumIFitxer))) {
    for (const f of resta) {
      if (numeroCompacte(f.num) === numeroCompacte(primera.num)) continue;
      const nom = proveidorDe.get(f)?.nom || f.contrapart;
      afig({
        codi: 'POSSIBLE_DOBLE_COBRAMENT',
        severitat: 'baixa',
        missatge: `Indici: «${f.num}» i «${primera.num}»${nom ? ` ${de(nom)}` : ''} són del mateix dia (${formatData(f.data)}) `
          + `i del mateix import (${formatImport(f.total)}): possible doble cobrament, comprova-ho.`,
        ...dadesDeFactura(f)
      });
    }
  }

  /* Els números de les factures d'altres trimestres (registre i historial): un rebut en pot citar una. Si se
     sap el proveïdor del rebut, només els seus (G3T-R06): els que el registre li ha vist i els de l'historial
     que són seus, d'un proveïdor que no se sap o emesos. */
  const citablesDe = new Map();
  const proveidorDeHistorial = (f) => identificaProveidor({
    nif: propis.has(normalitzaNif(f?.nif)) ? '' : f?.nif, nom: f?.contrapart
  }, registre)?.proveidor ?? null;
  const jaDeclarada = (cita, p) => {
    const clau = p ? `p:${p.clau}` : '';
    if (!citablesDe.has(clau)) {
      const vistos = p ? (p.numerosVistos ?? []) : registre.flatMap((x) => x?.numerosVistos ?? []);
      const historials = p ? anteriors.filter((f) => f?.tipus === 'ingres' || [null, p.clau].includes(proveidorDeHistorial(f)?.clau ?? null))
        : anteriors;
      citablesDe.set(clau, new Set([...vistos, ...historials.map((f) => f.num)].map(senseSeparadors).filter(Boolean)));
    }
    return citablesDe.get(clau).has(senseSeparadors(cita));
  };
  /* G3T-R06: un rebut d'un proveïdor conegut només cita les seues factures, les d'un proveïdor que no se sap
     o les emeses; sense proveïdor, qualsevol. */
  const citableDe = (f, p) => !p || f.tipus === 'ingres' || [undefined, null, p.clau].includes(proveidorDe.get(f)?.clau);

  /* REBUT_SENSE_FACTURA: un rebut que cita un número demana eixa factura (G3T-04); un que no en cita cap,
     una factura del mateix proveïdor i import. Si l'import és la suma dels totals o de les quotes d'IVA de
     dues o més factures del proveïdor, és un pagament agrupat (R3T-03): un avís informatiu, no cap falta. */
  for (const d of docs) {
    if (d.tipus !== 'rebut') continue;
    const nom = nomDeFitxer(d.ruta);
    const p = (d.proveidor && registre.find((x) => x?.clau === d.proveidor))
      || identificaProveidor({ nomFitxer: nom }, registre)?.proveidor || null;
    const cita = typeof d.numeroCitat === 'string' ? d.numeroCitat.trim() : '';
    if (cita) {
      if (llista.some((f) => citableDe(f, p) && casaAmbCita(f, cita)) || jaDeclarada(cita, p)) continue;
      afig({
        codi: 'REBUT_SENSE_FACTURA',
        severitat: 'alta',
        missatge: `Rebut «${nom}»${p ? ` ${de(p.nom)}` : ''}: cita la factura «${cita}», que no és entre les factures del trimestre. `
          + "Si és d'un altre trimestre, comprova que consta al seu full; si no, falta la factura. Un rebut de pagament no substituïx la factura.",
        fitxer: d.ruta,
        numero: cita,
        ...(p ? { proveidor: p.clau } : {})
      });
      continue;
    }
    const imp = Number.isSafeInteger(d.import) ? d.import : null;
    if (p || imp !== null) {
      const casa = despeses.some((f) => (!p || proveidorDe.get(f)?.clau === p.clau)
        && (imp === null || (Number.isSafeInteger(f.total) && Math.abs(f.total - imp) <= 1)));
      if (casa) continue;
    }
    const agrupat = p && imp !== null ? pagamentAgrupat(imp, perProveidor.get(p.clau) ?? []) : null;
    if (agrupat) {
      const quines = enumera(agrupat.factures.map((f) => `«${f.num || nomDeFitxer(f.origen?.fitxer)}»`));
      afig({
        codi: 'PAGAMENT_AGRUPAT',
        severitat: 'info',
        missatge: `Rebut «${nom}» ${de(p.nom)}: l'import (${formatImport(imp)}) és la suma ${agrupat.part === 'iva' ? "de l'IVA" : 'dels totals'} `
          + `de les factures ${quines}. Pareix un pagament agrupat d'eixes factures, que ja són a la proposta: no cal buscar-ne cap més.`,
        fitxer: d.ruta,
        numeros: agrupat.factures.map((f) => f.num).filter(Boolean),
        proveidor: p.clau
      });
      continue;
    }
    let detall;
    if (p && imp !== null) detall = `${de(p.nom)} per ${formatImport(imp)} sense cap factura seua d'eixe import`;
    else if (p) detall = `${de(p.nom)} sense cap factura d'eixe proveïdor al trimestre`;
    else if (imp !== null) detall = `per ${formatImport(imp)} sense cap factura d'eixe import`;
    else detall = "sense factura relacionada: no se n'ha pogut saber el proveïdor ni l'import";
    afig({
      codi: 'REBUT_SENSE_FACTURA',
      severitat: 'mitjana',
      missatge: `Rebut «${nom}» ${detall}. Un rebut de pagament no substituïx la factura.`,
      fitxer: d.ruta,
      ...(p ? { proveidor: p.clau } : {})
    });
  }

  /* Correu: cobertura i correus de factura sense document. */
  let cobertura = { carpeta: 'revisada', correu: 'no-revisat', correusRevisats: 0, periodeCorreu: null };
  if (!Array.isArray(correus)) {
    afig({ codi: 'CORREU_NO_REVISAT', severitat: 'info', missatge: MISSATGE_CORREU_NO_REVISAT });
  } else {
    const dates = correus.map((c) => c?.data).filter(esDataValida).sort(comparaDates);
    const periodeCorreu = dates.length > 0 ? { inici: dates[0], fi: dates[dates.length - 1] } : null;
    cobertura = { carpeta: 'revisada', correu: 'revisat', correusRevisats: correus.length, periodeCorreu };
    if (!periodeCorreu) {
      afig({ codi: 'CORREU_PARCIAL', severitat: 'info', missatge: 'El correu revisat no té cap missatge amb data: no cobrix el trimestre.' });
    } else if (comparaDates(periodeCorreu.inici, rang.inici) > 0 || comparaDates(periodeCorreu.fi, rang.fi) < 0) {
      afig({
        codi: 'CORREU_PARCIAL',
        severitat: 'info',
        missatge: `El correu revisat va del ${formatData(periodeCorreu.inici)} al ${formatData(periodeCorreu.fi)}: no cobrix tot el trimestre.`
      });
    }

    const senseDocument = new Map();
    for (const c of correus) {
      if (!c || c.esFactura === false || !dinsDeRang(c.data, rang)) continue;
      const p = proveidorDelCorreu(c, registre);
      if (!p) continue;
      const casa = (perProveidor.get(p.clau) ?? []).some((f) => esDataValida(f.data)
        && (Math.abs(diesEntre(f.data, c.data)) <= DIES_CORREU || (f.data.a === c.data.a && f.data.m === c.data.m)));
      /* Una factura de just abans o just després del trimestre ja és a l'historial d'eixe mes. */
      const fora = [sumaDies(c.data, -DIES_CORREU), sumaDies(c.data, DIES_CORREU)]
        .filter((d) => !dinsDeRang(d, rang))
        .some((d) => (p.mesosVistos ?? []).includes(clauMes(d)));
      if (casa || fora) continue;
      const clau = `${p.clau}|${clauMes(c.data)}`;
      const grup = senseDocument.get(clau) ?? { p, mes: clauMes(c.data), dates: [] };
      grup.dates.push(c.data);
      senseDocument.set(clau, grup);
    }
    for (const { p, mes, dates: diesCorreu } of senseDocument.values()) {
      const quins = diesCorreu.length === 1 ? 'Un correu' : `${diesCorreu.length} correus`;
      afig({
        codi: 'CORREU_SENSE_DOCUMENT',
        severitat: 'alta',
        missatge: `${quins} de factura ${de(p.nom)} (${diesCorreu.map((d) => formatData(d)).join(', ')}) sense cap factura seua a la carpeta en ±${DIES_CORREU} dies ni en el mateix mes.`,
        proveidor: p.clau,
        mes
      });
    }
  }

  const pes = (s) => {
    const i = SEVERITATS.indexOf(s);
    return i < 0 ? SEVERITATS.length : i;
  };
  incidencies.sort((x, y) => pes(x.severitat) - pes(y.severitat));
  const completes = llista.filter((f) => f.estat === 'completa').length;
  return {
    incidencies,
    cobertura,
    resum: {
      factures: llista.length,
      completes,
      pendents: llista.length - completes,
      ingressos: llista.filter((f) => f.tipus === 'ingres').length,
      despeses: despeses.length
    }
  };
}
