/**
 * auditoriaPagaments.js — l'auditoria de pagaments d'un trimestre: què s'ha
 * cobrat, què s'ha pagat i què no quadra entre el full de factures i el banc.
 *
 * Onada 12 (261011; ordres 261011_0130, punt 6: «preparar el sistema per fer
 * auditories de pagaments»). auditoria.js audita el full contra la carpeta i
 * el correu, i concilia.js proposa parelles entre moviments i factures; ací es
 * junten les dues coses i es contesten, trimestre a trimestre, les cinc
 * preguntes de l'ordre:
 *   · factures emeses sense cap cobrament casat (EMESA_SENSE_COBRAMENT);
 *   · despeses del banc sense factura (DESPESA_SENSE_FACTURA), i al revés,
 *     factures rebudes sense pagament (REBUDA_SENSE_PAGAMENT: pot ser que
 *     s'haja pagat en efectiu) i entrades sense factura (INGRES_SENSE_FACTURA);
 *   · pagaments duplicats (PAGAMENT_DUPLICAT): el mateix import a la mateixa
 *     contrapart en pocs dies, o un segon moviment que cita el número d'una
 *     factura que ja té el seu pagament (mai només per l'import i la
 *     contrapart: una quota mensual sense factura no és cap repetició);
 *   · imports que no quadren entre la factura i el moviment (IMPORT_NO_QUADRA);
 *   · factures amb la data fora del trimestre del seu full (FORA_TRIMESTRE) i,
 *     com a informació, les del trimestre que es cobren o es paguen en un
 *     altre (PAGAMENT_EN_ALTRE_TRIMESTRE).
 * I el resum del trimestre que demana el full: ingressos i despeses (base),
 * IVA repercutit i suportat, retencions d'IRPF i resultat, amb el que ja s'ha
 * cobrat i pagat pel banc.
 *
 * Tot són INDICIS per a revisar, mai veredictes: una factura sense moviment
 * pot estar pagada en efectiu o des d'un compte que no és a l'extracte. No
 * diu quin IVA és deduïble ni fa cap declaració: això és de la gestoria.
 * Només es concilia una vegada, amb totes les factures i tots els moviments,
 * perquè una factura del 2n trimestre cobrada al 3r faça parella igualment.
 *
 * JS pur: sense DOM ni APIs de Node. Imports en cèntims enters. Res del que
 * rep es modifica.
 */
import { textDelsConceptes } from './c43.js';
import { citaNumero, concilia } from './concilia.js';
import { comparaDates, diesEntre, dinsDeRang, esDataValida, formatData, rangTrimestre, trimestreDe } from './dates.js';
import { formatImport } from './diners.js';
import { TIPUS_IRPF_HABITUALS, clauDuplicat, normalitzaNom, totals } from './model.js';

/* Punts de marge entre la diferència d'una factura i un tipus habitual de retenció (el mateix que l'IVA de model.js). */
const TOLERANCIA_IRPF_PUNTS = 0.6;

/** Els codis de les incidències, en l'ordre en què es donen. */
export const CODIS_PAGAMENTS = Object.freeze([
  'TRIMESTRE_INVALID', 'FACTURA_REPETIDA', 'PAGAMENT_DUPLICAT', 'IMPORT_NO_QUADRA', 'FORA_TRIMESTRE', 'EMESA_SENSE_COBRAMENT',
  'DESPESA_SENSE_FACTURA', 'INGRES_SENSE_FACTURA', 'REBUDA_SENSE_PAGAMENT', 'FACTURA_SENSE_DATA', 'PAGAMENT_EN_ALTRE_TRIMESTRE'
]);
/** Per què dos moviments pareixen el mateix pagament. */
export const MOTIUS_DUPLICAT = Object.freeze(['MATEIXOS_DIES', 'FACTURA_JA_PAGADA']);
/** Dies, com a molt, entre dos moviments iguals perquè siguen un indici de pagament repetit. */
export const DIES_DUPLICAT = 3;
/** Dies, com a molt, entre el pagament d'una factura i un segon moviment que la torna a pagar. */
export const DIES_SEGON_PAGAMENT = 100;
const MONEDA = 'EUR';
/* La moneda d'una factura sense camp `moneda` és l'euro (model.js). */
const enEuros = (f) => f.moneda == null || f.moneda === MONEDA;
const importEsperat = (f) => (Number.isSafeInteger(f.total) ? (f.tipus === 'ingres' ? f.total : -f.total) : null);
const suma = (llista) => llista.reduce((total, x) => total + x, 0);
const plural = (n, una, moltes) => (n === 1 ? una : `${n} ${moltes}`);
const nomFactura = (f) => (f.num ? `«${f.num}»` : 'sense número');
const quin = (m) => `del ${formatData(m.dataOperacio)} (${formatImport(m.centims)})`;
const textCitable = (m) => [textDelsConceptes(m), m.ref1, m.ref2, m.comerc].filter((t) => typeof t === 'string' && t !== '').join(' ');

/* Qui hi ha a l'altra banda d'un moviment, per a comparar-ne dos: el NIF del creditor d'un rebut, el comerç de
   la targeta o les paraules del concepte sense xifres (les referències i les dates canvien d'un a l'altre).
   '' si no se'n sap res: dos moviments sense contrapart no es comparen. */
function clauContrapart(m) {
  if (m.sepa?.cif) return `nif:${m.sepa.cif}`;
  if (m.comerc) return `comerc:${normalitzaNom(m.comerc)}`;
  const paraules = normalitzaNom(textDelsConceptes(m)).split(' ').filter((p) => p !== '' && !/\d/.test(p));
  return paraules.length ? `text:${paraules.join(' ')}` : '';
}

/* Els indicis de pagament repetit. `deMoviment`: la parella (amb factures) de cada moviment que en té. */
function pagamentsDuplicats(moviments, parelles, deMoviment) {
  const duplicats = [];
  const marcats = new Set();
  const anullats = new Set(parelles.filter((p) => p.regla === 'R7').flatMap((p) => p.moviments));
  const candidats = moviments.filter((m) => !anullats.has(m) && m.centims !== 0);

  /* El mateix import a la mateixa contrapart en pocs dies. Si cada moviment paga una factura diferent, no és cap repetició. */
  const grups = new Map();
  for (const m of candidats) {
    const clau = clauContrapart(m);
    if (!clau) continue;
    const id = `${clau}|${m.centims}`;
    if (!grups.has(id)) grups.set(id, []);
    grups.get(id).push(m);
  }
  for (const grup of grups.values()) {
    let tram = [];
    const tanca = () => {
      if (tram.length > 1) {
        const pagades = new Set(tram.map((m) => deMoviment.get(m)).filter(Boolean));
        const ambFactura = tram.filter((m) => deMoviment.has(m)).length;
        if (!(ambFactura === tram.length && pagades.size === tram.length)) {
          tram.forEach((m) => marcats.add(m));
          duplicats.push({ motiu: 'MATEIXOS_DIES', severitat: ambFactura > 0 ? 'mitjana' : 'baixa', moviments: tram, factures: [] });
        }
      }
      tram = [];
    };
    for (const m of grup) {
      const anterior = tram[tram.length - 1];
      if (anterior && diesEntre(anterior.dataOperacio, m.dataOperacio) > DIES_DUPLICAT) tanca();
      tram.push(m);
    }
    tanca();
  }

  /* Un moviment sense factura que torna a pagar, pel mateix import, una factura que ja té el seu pagament, i
     que la CITA pel número. Correcció 261011 (refutador, punt 1): la mateixa contrapart i el mateix import no
     basten fora de DIES_DUPLICAT, perquè una quota mensual sense factura és això mateix i no és cap repetició. */
  for (const m of candidats) {
    if (deMoviment.has(m) || marcats.has(m)) continue;
    const text = textCitable(m);
    const pagada = parelles.find((p) => {
      if (p.moviments.length === 0 || p.factures.length !== 1 || p.moviments.includes(m)) return false;
      const [f] = p.factures;
      if (!enEuros(f) || importEsperat(f) !== m.centims) return false;
      const dies = diesEntre(p.moviments[0].dataOperacio, m.dataOperacio);
      if (dies === null || Math.abs(dies) > DIES_SEGON_PAGAMENT) return false;
      return citaNumero(text, f.num);
    });
    if (!pagada) continue;
    marcats.add(m);
    duplicats.push({ motiu: 'FACTURA_JA_PAGADA', severitat: 'mitjana', moviments: [pagada.moviments[0], m], factures: [...pagada.factures] });
  }
  return duplicats.sort((x, y) => comparaDates(x.moviments[0].dataOperacio, y.moviments[0].dataOperacio));
}

/* Els totals d'unes factures en euros: { base, iva, total, incomplet }. Les que no són en euros o no tenen
   l'import llegit no se sumen, i ho diu `incomplet`. */
function totalsDe(factures) {
  const sumables = factures.filter(enEuros);
  const t = totals(sumables);
  return {
    factures: factures.length,
    base: t.subtotal,
    iva: t.iva,
    total: t.total,
    incomplet: t.incomplet || sumables.length !== factures.length
  };
}

/* Correcció 261011 (refutador, punt 4). La retenció d'IRPF d'una factura emesa, amb signe (la d'una
   rectificativa resta): { centims, deduida }, o null si no es pot saber. El full CSV de la gestoria no té columna
   de retenció i les factures que en venen no porten el camp: es deduïx de base + IVA − total quan la diferència
   és un dels tipus habituals (TIPUS_IRPF_HABITUALS, ± 0,6 punts). Si la factura quadra sense retenció, és zero
   de veres; si no quadra i la diferència no és cap tipus habitual, no se sap, i no es diu cap xifra. */
function retencioDe(f) {
  if (Number.isSafeInteger(f.retencio)) return { centims: (f.subtotal < 0 ? -1 : 1) * Math.abs(f.retencio), deduida: false };
  if (!['subtotal', 'iva', 'total'].every((camp) => Number.isSafeInteger(f[camp]))) return null;
  const diferencia = f.subtotal + f.iva - f.total;
  if (Math.abs(diferencia) <= 1) return { centims: 0, deduida: false };
  if (f.subtotal === 0) return null;
  const percentatge = (diferencia / f.subtotal) * 100;
  return TIPUS_IRPF_HABITUALS.some((tipus) => Math.abs(percentatge - tipus) <= TOLERANCIA_IRPF_PUNTS) ? { centims: diferencia, deduida: true } : null;
}

/* Les retencions d'unes factures emeses: { total, deduides, desconegudes }. Amb alguna que no es pot saber, el total és null. */
function retencionsDe(emeses) {
  const lectures = emeses.filter(enEuros).map(retencioDe);
  const desconegudes = lectures.filter((r) => r === null).length;
  return {
    total: desconegudes > 0 ? null : suma(lectures.map((r) => r.centims)),
    deduides: lectures.filter((r) => r?.deduida).length,
    desconegudes
  };
}

/* Un full del lot, net: { any, t, factures }. Admet la forma de llegeixModelCsv ({ ingressos, despeses }). Sense
   any ni trimestre, el de les dates de les factures: aquell on en cau més de la mitat (correcció 261011, punt 9:
   una factura d'un altre trimestre ja no deixa el full sense resum, i ix com a FORA_TRIMESTRE). `deduit` ho diu. */
function fullNet(full) {
  const factures = (Array.isArray(full?.factures) ? full.factures : [...(full?.ingressos ?? []), ...(full?.despeses ?? [])])
    .filter((f) => f && typeof f === 'object');
  if (rangTrimestre(full?.any, full?.t)) return { any: full.any, t: full.t, deduit: false, factures };
  const recompte = new Map();
  const ambData = factures.filter((f) => esDataValida(f.data));
  for (const f of ambData) {
    const clau = `${f.data.a}-${trimestreDe(f.data)}`;
    recompte.set(clau, (recompte.get(clau) ?? 0) + 1);
  }
  const majoria = [...recompte.entries()].find(([, n]) => n * 2 > ambData.length);
  if (!majoria) return { any: null, t: null, deduit: false, factures };
  const [any, t] = majoria[0].split('-').map(Number);
  return { any, t, deduit: true, factures };
}

/* La part del moviment d'una parella que toca a una de les seues factures, amb el signe del banc (correcció
   261011, punt 6): si paga diverses factures, en proporció al que s'esperava de cada una; si no es pot repartir
   (una altra moneda, un import sense llegir), sencer a la factura única o res. */
function partDelMoviment(parella, f) {
  const [m] = parella.moviments;
  if (parella.factures.length === 1) return m.centims;
  const esperats = parella.factures.map((x) => (enEuros(x) ? importEsperat(x) : null));
  const total = esperats.includes(null) ? 0 : suma(esperats);
  if (total === 0) return 0;
  return Math.round((m.centims * esperats[parella.factures.indexOf(f)]) / total);
}

/**
 * Audita els pagaments d'un o més trimestres.
 * @param {object} p
 * @param {Array<{ any: number, t: number, factures?: object[], ingressos?: object[], despeses?: object[] }>} [p.fulls]
 *   un per trimestre (el que torna llegeixModelCsv o la proposta del tractor); dos del mateix trimestre s'ajunten
 * @param {object[]} [p.moviments] els del banc, en euros, amb la forma de la conciliació (c43.js, o `detall` de fontMoviments.js)
 * @returns {{ conciliacio: object, trimestres: object[], duplicats: object[], incidencies: object[] }}
 *   `conciliacio`: el que torna concilia amb totes les factures i tots els moviments. Cada trimestre:
 *   { any, t, deduit, rang, resum, emesesSenseCobrament, rebudesSensePagament, despesesSenseFactura,
 *   ingressosSenseFactura, importsQueNoQuadren, foraDeTrimestre, senseData, pagamentsEnAltreTrimestre, duplicats }.
 */
export function auditaPagaments({ fulls = [], moviments = [] } = {}) {
  const incidencies = [];
  const incidencia = (codi, severitat, missatge, extra = {}) => incidencies.push({ codi, severitat, missatge, ...extra });

  /* Un full per trimestre: dos fulls del mateix s'ajunten; un sense trimestre no s'audita per trimestre.
     Correcció 261011 (refutador, punt 5): en ajuntar-los, una factura que ja hi és (el mateix full triat dos
     colps amb un altre nom) no es torna a sumar, i s'avisa. Dins d'un mateix full no es lleva res: això ho
     diu auditoria.js (DUPLICAT). */
  const empremta = (f) => [f.tipus, clauDuplicat(f), formatData(f.data, 'aaaa-mm-dd'), f.subtotal, f.iva, f.total].join('|');
  const perClau = new Map();
  const senseTrimestre = [];
  for (const full of (Array.isArray(fulls) ? fulls : []).map(fullNet)) {
    if (full.any === null) {
      senseTrimestre.push(...full.factures);
      if (full.factures.length) {
        incidencia('TRIMESTRE_INVALID', 'mitjana',
          `Un full amb ${plural(full.factures.length, 'una factura', 'factures')} no diu de quin trimestre és, i les dates no ho aclarixen: s’ha conciliat, però no entra a cap resum.`);
      }
      continue;
    }
    const clau = `${full.any}-${full.t}`;
    const previ = perClau.get(clau);
    if (!previ) {
      perClau.set(clau, { ...full, factures: [...full.factures] });
      continue;
    }
    const jaHiSon = new Set(previ.factures.map(empremta));
    const noves = full.factures.filter((f) => !jaHiSon.has(empremta(f)));
    const repetides = full.factures.length - noves.length;
    previ.factures.push(...noves);
    if (repetides > 0) {
      incidencia('FACTURA_REPETIDA', 'mitjana',
        `${plural(repetides, 'Una factura és', 'factures són')} en dos fulls del ${full.t}T de ${full.any} (el mateix full triat dues vegades?): només ${repetides === 1 ? 'compta' : 'compten'} una vegada.`,
        { any: full.any, t: full.t });
    }
  }
  const llista = [...perClau.values()].sort((x, y) => x.any - y.any || x.t - y.t);
  const totes = [...llista.flatMap((full) => full.factures), ...senseTrimestre];

  const conciliacio = concilia({ moviments, factures: totes });
  const ambMoviments = conciliacio.parelles.filter((p) => p.moviments.length > 0 && p.factures.length > 0);
  const deFactura = new Map();
  const deMoviment = new Map();
  for (const p of ambMoviments) {
    for (const f of p.factures) deFactura.set(f, p);
    for (const m of p.moviments) deMoviment.set(m, p);
  }
  const valids = (Array.isArray(moviments) ? moviments : [])
    .filter((m) => m && Number.isSafeInteger(m.centims) && esDataValida(m.dataOperacio))
    .map((m, i) => ({ m, i }))
    .sort((x, y) => comparaDates(x.m.dataOperacio, y.m.dataOperacio) || x.i - y.i)
    .map(({ m }) => m);
  const lliures = new Set(conciliacio.movimentsSenseFactura);
  const duplicats = pagamentsDuplicats(valids, conciliacio.parelles, deMoviment);

  const trimestres = llista.map((full) => {
    const rang = rangTrimestre(full.any, full.t);
    const etiqueta = `${full.t}T de ${full.any}`;
    const dins = (data) => dinsDeRang(data, rang);
    const senseData = full.factures.filter((f) => !esDataValida(f.data));
    const foraDeTrimestre = full.factures.filter((f) => esDataValida(f.data) && !dins(f.data));
    const emeses = full.factures.filter((f) => f.tipus === 'ingres');
    const rebudes = full.factures.filter((f) => f.tipus !== 'ingres');
    const emesesSenseCobrament = emeses.filter((f) => !deFactura.has(f));
    const rebudesSensePagament = rebudes.filter((f) => !deFactura.has(f));
    const delTrimestre = valids.filter((m) => dins(m.dataOperacio));
    /* Correcció 261011 (refutador, punt 1): un moviment sospitós de duplicat continua sent un moviment sense
       factura. No se'n lleva mai cap d'esta llista. */
    const senseFactura = delTrimestre.filter((m) => lliures.has(m));
    const despesesSenseFactura = senseFactura.filter((m) => m.centims < 0);
    const ingressosSenseFactura = senseFactura.filter((m) => m.centims > 0);
    const parellesDelFull = ambMoviments.filter((p) => p.factures.some((f) => full.factures.includes(f)));
    const importsQueNoQuadren = parellesDelFull.filter((p) => Number.isSafeInteger(p.diferencia) && p.diferencia !== 0);
    const pagamentsEnAltreTrimestre = parellesDelFull.filter((p) => p.moviments.some((m) => !dins(m.dataOperacio)));
    const duplicatsDelTrimestre = duplicats.filter((d) => d.moviments.some((m) => dins(m.dataOperacio)));

    const [totalsEmeses, totalsRebudes] = [totalsDe(emeses), totalsDe(rebudes)];
    /* El que el banc diu que ja s'ha cobrat i pagat, AMB SIGNE (un abonament tornat resta del cobrat) i només la
       part de cada moviment que toca a les factures d'este full. El moviment és el primer de la parella: el
       segon, si n'hi ha, és la comissió de canvi, que no paga la factura. */
    const moguts = (factures) => suma(factures.filter((f) => deFactura.has(f)).map((f) => partDelMoviment(deFactura.get(f), f)));
    const pendent = (factures) => suma(factures.filter((f) => enEuros(f) && Number.isSafeInteger(f.total)).map((f) => f.total));
    const retencions = retencionsDe(emeses);
    const resum = {
      ingressos: totalsEmeses,
      despeses: totalsRebudes,
      ivaRepercutit: totalsEmeses.iva,
      ivaSuportat: totalsRebudes.iva,
      diferenciaIva: totalsEmeses.iva - totalsRebudes.iva,
      retencions: retencions.total,
      retencionsDeduides: retencions.deduides,
      retencionsDesconegudes: retencions.desconegudes,
      resultat: totalsEmeses.base - totalsRebudes.base,
      incomplet: totalsEmeses.incomplet || totalsRebudes.incomplet,
      cobrat: moguts(emeses),
      pendentDeCobrar: pendent(emesesSenseCobrament),
      pagat: -moguts(rebudes) || 0,
      pendentDePagar: pendent(rebudesSensePagament),
      movimentsDelBanc: delTrimestre.length
    };

    const on = { any: full.any, t: full.t };
    for (const d of duplicatsDelTrimestre) {
      const [primer, ...resta] = d.moviments;
      incidencia('PAGAMENT_DUPLICAT', d.severitat, d.motiu === 'FACTURA_JA_PAGADA'
        ? `Indici: el moviment ${quin(resta[0])} torna a pagar la factura ${nomFactura(d.factures[0])}, que ja té el seu pagament ${quin(primer)}. Comprova si s’ha pagat dues vegades.`
        : `Indici: ${d.moviments.length} moviments de ${formatImport(primer.centims)} a la mateixa contrapart entre el ${formatData(primer.dataOperacio)} i el ${formatData(d.moviments[d.moviments.length - 1].dataOperacio)}. Comprova si és un pagament repetit.`,
      { ...on, motiu: d.motiu });
    }
    for (const p of importsQueNoQuadren) {
      const quines = p.factures.length === 1 ? `la factura ${nomFactura(p.factures[0])}` : `${p.factures.length} factures`;
      incidencia('IMPORT_NO_QUADRA', 'mitjana',
        `El moviment ${quin(p.moviments[0])} fa parella amb ${quines}, però hi ha ${formatImport(p.diferencia)} de diferència.`, on);
    }
    for (const f of foraDeTrimestre) {
      incidencia('FORA_TRIMESTRE', 'mitjana',
        `La factura ${nomFactura(f)} és del ${formatData(f.data)}, fora del ${etiqueta} (${formatData(rang.inici)} - ${formatData(rang.fi)}).`,
        { ...on, ...(f.id ? { facturaId: f.id } : {}) });
    }
    for (const f of emesesSenseCobrament) {
      incidencia('EMESA_SENSE_COBRAMENT', 'mitjana',
        `La factura emesa ${nomFactura(f)}${Number.isSafeInteger(f.total) ? ` (${formatImport(f.total)})` : ''} no té cap cobrament al banc.`,
        { ...on, ...(f.id ? { facturaId: f.id } : {}) });
    }
    if (despesesSenseFactura.length) {
      incidencia('DESPESA_SENSE_FACTURA', 'mitjana',
        `${plural(despesesSenseFactura.length, 'Una eixida del banc no té', 'eixides del banc no tenen')} factura al full del ${etiqueta} (${formatImport(-suma(despesesSenseFactura.map((m) => m.centims)))}): impostos, quotes i comissions no en porten; la resta, cal buscar-la.`, on);
    }
    if (ingressosSenseFactura.length) {
      incidencia('INGRES_SENSE_FACTURA', 'mitjana',
        `${plural(ingressosSenseFactura.length, 'Una entrada del banc no té', 'entrades del banc no tenen')} factura emesa al full del ${etiqueta} (${formatImport(suma(ingressosSenseFactura.map((m) => m.centims)))}).`, on);
    }
    if (rebudesSensePagament.length) {
      incidencia('REBUDA_SENSE_PAGAMENT', 'baixa',
        `${plural(rebudesSensePagament.length, 'Una factura rebuda no té', 'factures rebudes no tenen')} cap pagament al banc: pot ser en efectiu o des d’un compte que no és a l’extracte.`, on);
    }
    if (senseData.length) {
      incidencia('FACTURA_SENSE_DATA', 'mitjana', `${plural(senseData.length, 'Una factura no té', 'factures no tenen')} data al full del ${etiqueta}.`, on);
    }
    if (pagamentsEnAltreTrimestre.length) {
      incidencia('PAGAMENT_EN_ALTRE_TRIMESTRE', 'info',
        `${plural(pagamentsEnAltreTrimestre.length, 'Una factura del full es cobra o es paga', 'factures del full es cobren o es paguen')} fora del ${etiqueta}: compta per a la caixa d’un altre trimestre, no per a l’IVA d’este.`, on);
    }

    return {
      any: full.any, t: full.t, deduit: full.deduit, rang, resum, emesesSenseCobrament, rebudesSensePagament,
      despesesSenseFactura, ingressosSenseFactura, importsQueNoQuadren, foraDeTrimestre, senseData, pagamentsEnAltreTrimestre,
      duplicats: duplicatsDelTrimestre
    };
  });

  const pes = (i) => CODIS_PAGAMENTS.indexOf(i.codi);
  incidencies.sort((x, y) => (x.any ?? 0) - (y.any ?? 0) || (x.t ?? 0) - (y.t ?? 0) || pes(x) - pes(y));
  return { conciliacio, trimestres, duplicats, incidencies };
}

/** Els límits que l'auditoria hereta de la conciliació (concilia.js), dits a la persona davant de tot. */
export const AVIS_DE_LIMITS = Object.freeze([
  'ATENCIÓ: açò és una ajuda per a revisar, no un veredicte. La conciliació aparella per regles i té límits:',
  '- Un pagament a trossos: el tros que cita la factura hi fa parella (amb «import que no quadra») i la factura deixa d’eixir com a pendent encara que en falte una part; l’altre tros ix com un moviment sense factura.',
  '- Un cobrament o un pagament que no cita el número de la factura només casa si arriba entre 3 dies abans i 10 després de la data de la factura (un rebut SEPA amb el NIF del creditor, fins a 40): una factura cobrada a 30 o 60 dies ix com a «sense cobrament» encara que estiga cobrada.',
  '- Càrrecs iguals a la mateixa contrapart en dies seguits (una quota diària) s’encadenen i ixen junts com a possible duplicat.'
]);
const MAX_LINIES = 20;
const primeres = (linies) => (linies.length > MAX_LINIES ? [...linies.slice(0, MAX_LINIES), `i ${linies.length - MAX_LINIES} més`] : linies);
const liniaFactura = (f) => `${formatData(f.data) || 'sense data'} · ${nomFactura(f)} · ${formatImport(f.total) || 'import desconegut'}`;
const liniaMoviment = (m) => `${formatData(m.dataOperacio)} · ${formatImport(m.centims)} · ${(m.comerc || textDelsConceptes(m) || 'sense concepte').slice(0, 60)}`;

/**
 * L'auditoria en text, trimestre a trimestre, per a mostrar-la a la persona.
 * Amb els conceptes del banc: és per a la pantalla, no per a guardar-la.
 * @param {{ trimestres: object[] }} auditoria el que torna auditaPagaments
 * @param {{ ambBanc?: boolean }} [opcions] sense banc, només el resum del full
 * @returns {string[]} les línies
 */
export function informePagaments(auditoria, { ambBanc = true } = {}) {
  const linies = [];
  if (ambBanc && (auditoria?.trimestres ?? []).length) linies.push(...AVIS_DE_LIMITS);
  for (const q of auditoria?.trimestres ?? []) {
    const r = q.resum;
    const bloc = (titol, files) => (files.length ? [`${titol} (${files.length}):`, ...primeres(files).map((l) => `- ${l}`)] : []);
    linies.push(
      '',
      `── ${q.t}T de ${q.any} (${formatData(q.rang.inici)} - ${formatData(q.rang.fi)})${q.deduit ? ' · trimestre deduït de les dates de les factures' : ''} ──`,
      `Ingressos: ${formatImport(r.ingressos.base)} de base, ${formatImport(r.ivaRepercutit)} d’IVA repercutit i ${formatImport(r.ingressos.total)} de total (${plural(r.ingressos.factures, 'una factura', 'factures')}).`,
      `Despeses: ${formatImport(r.despeses.base)} de base, ${formatImport(r.ivaSuportat)} d’IVA suportat i ${formatImport(r.despeses.total)} de total (${plural(r.despeses.factures, 'una factura', 'factures')}).`,
      `IVA repercutit menys suportat: ${formatImport(r.diferenciaIva)} (quin IVA és deduïble ho diu la gestoria).`,
      /* Mai un «0,00 €» que no és cert: si alguna factura no quadra i no se sap per què, es diu que no se sap. */
      r.retencions === null
        ? `Retencions d’IRPF: no es poden saber (${plural(r.retencionsDesconegudes, 'una factura emesa no quadra', 'factures emeses no quadren')} i la diferència no és cap retenció habitual, o li falta algun import). Mira-les al full.`
        : `Retencions d’IRPF a les factures emeses: ${formatImport(r.retencions)}${r.retencionsDeduides > 0
          ? ` (deduïdes de base + IVA − total en ${plural(r.retencionsDeduides, 'una factura', 'factures')}: el full no té columna de retenció)` : ''}.`,
      `Resultat (base dels ingressos menys base de les despeses): ${formatImport(r.resultat)}.`
    );
    if (r.incomplet) linies.push('Atenció: alguna factura no és en euros o no té l’import llegit, i no s’ha sumat.');
    if (!ambBanc) continue;
    linies.push(
      `Banc: ${plural(r.movimentsDelBanc, 'un moviment', 'moviments')} al trimestre. Cobrat ${formatImport(r.cobrat)} i pendent de cobrar ${formatImport(r.pendentDeCobrar)}; pagat ${formatImport(r.pagat)} i sense pagament al banc ${formatImport(r.pendentDePagar)}.`,
      ...bloc('Factures emeses sense cobrament', q.emesesSenseCobrament.map(liniaFactura)),
      ...bloc('Eixides del banc sense factura', q.despesesSenseFactura.map(liniaMoviment)),
      ...bloc('Entrades del banc sense factura', q.ingressosSenseFactura.map(liniaMoviment)),
      ...bloc('Possibles pagaments duplicats', q.duplicats.map((d) => `${d.moviments.map(liniaMoviment).join('  ↔  ')}${d.factures.length ? ` · factura ${nomFactura(d.factures[0])}` : ''}`)),
      ...bloc('Imports que no quadren', q.importsQueNoQuadren.map((p) => `${liniaMoviment(p.moviments[0])} contra ${p.factures.map(nomFactura).join(', ')}: ${formatImport(p.diferencia)} de diferència`)),
      ...bloc('Factures amb la data fora del trimestre', q.foraDeTrimestre.map(liniaFactura)),
      ...bloc('Factures rebudes sense pagament al banc', q.rebudesSensePagament.map(liniaFactura)),
      ...bloc('Factures del full cobrades o pagades en un altre trimestre', q.pagamentsEnAltreTrimestre.map((p) => `${p.factures.map(nomFactura).join(', ')} · moviment ${quin(p.moviments[0])}`))
    );
  }
  return linies;
}
