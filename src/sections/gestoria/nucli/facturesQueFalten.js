/**
 * facturesQueFalten.js — les factures que falten d'un trimestre, proveïdor a
 * proveïdor i mes a mes, i el càrrec del banc que en delata el pagament.
 *
 * Ordre del Mestre, 14-10-2026 (prompt 261014_2015, tasca T4; pla 261014_2030;
 * decisions de les 21:20 a l'auditoria 261014_2035): «detectar càrrecs
 * bancaris recurrents que no tenen el seu PDF associat». Fase A: un mòdul pur
 * que no inventa cap regla de nucli; reutilitza les de sempre, que només
 * s'importen:
 *   · proveidors.js · el registre (aprenProveidors), el proveïdor de cada
 *     factura (identificaProveidor, amb els mateixos senyals que auditoria.js)
 *     i els mesos (clauMes, indexMes);
 *   · auditoria.js · les incidències del trimestre (auditaTrimestre). Només
 *     FALTA_MENSUAL, FALTA_HABITUAL, FORAT_NUMERACIO i FORA_TRIMESTRE, cada
 *     una tal com ix d'allí i una sola vegada, reduïdes a { codi, missatge }
 *     i, si en porten, proveidor, mes i numeros. Les línies no les repetixen;
 *   · concilia.js · els moviments que no paguen cap factura
 *     (movimentsSenseFactura) i les parelles de l'historial.
 *
 * LÍNIES: els proveïdors de despesa de cadència mensual o bimestral vistos
 * prop del trimestre (la finestra d'auditoria.js: de 3 mesos abans del
 * primer, 4 els bimestrals, fins a l'últim) i els que tenen alguna despesa
 * datada dins del trimestre. Cada línia porta els tres mesos del trimestre.
 * CADA MES:
 *   · trobades · els números de les despeses del proveïdor datades eixe mes,
 *     de la llista del trimestre. Es compta per la DATA de la factura: la
 *     gestoria decidix el trimestre de cada una, i una del 4T a la llista no
 *     compta en cap mes del 3T (FORA_TRIMESTRE ja ho diu);
 *   · esperades · mensual: el mínim de factures dels dos últims mesos vistos
 *     abans d'eixe (els de l'historial i, dins del trimestre, les trobades),
 *     mai menys d'1; i 0 abans del primer mes vist, com FALTA_MENSUAL.
 *     Bimestral: 1 si n'hi ha cap de trobada o si FALTA_HABITUAL l'esperava
 *     eixe mes. La resta de cadències: 0;
 *   · estat · 'futura' si el mes és posterior al d'avui (sense avui, cap ho
 *     és); 'falta' sense cap trobada i alguna d'esperada; 'potser-falta' amb
 *     menys trobades que esperades (el recompte caigut); 'completa' si no;
 *     'falta-amb-pagament' quan la que falta té el seu càrrec al banc (baix);
 *   · banc · 'cobert' si algun extracte en euros cobrix algun dia del mes
 *     (els intervals `cobert` de comptesDe o, sense, el [desde, fins] del
 *     compte); 'sense-extracte' si no, i llavors no es diu res del pagament.
 * EL PAGAMENT, només amb el banc i només d'un mes que falta: els candidats són
 * els moviments lliures dels comptes en euros (movimentsSenseFactura de
 * concilia, amb les factures del trimestre i les de l'historial) que són una
 * eixida, d'un import dins de [mínim × 0,7, màxim × 1,3] dels totals en euros
 * de l'historial del proveïdor, datats entre el dia 1 del mes i 10 dies
 * després de l'últim (DIES_DESPRES_DEL_MES: el càrrec d'una factura de
 * l'últim dia del mes arriba als primers dies del següent, però la finestra no
 * arriba al càrrec habitual del mes que ve) i, si les parelles de l'historial
 * del proveïdor diuen un concepte comú (el codi de la Norma 43), amb eixe
 * concepte. Un ÚNIC candidat és el pagament; cap o diversos, res. Un moviment
 * que és l'únic candidat de dos mesos (o de dos proveïdors) no és el pagament
 * de cap: un càrrec no paga dues factures que falten, i no es pot saber de
 * quina és.
 * Revisió adversarial 14-10-2026: sense pagament, el mes diu per què
 * (`sensePagament`), perquè la vista no diga «cap càrrec» quan n'hi ha
 * diversos o quan no s'ha buscat: 'sense-extracte' (el banc no cobrix el
 * mes), 'sense-historial' (l'historial no té cap total en euros del
 * proveïdor), 'cap', 'diversos', 'compartit' (l'únic candidat també ho és d'un
 * altre mes) i 'no-cercat' (un 'potser-falta': ja n'hi ha alguna i no es
 * busca). null en els mesos complets, futurs i amb el pagament trobat.
 *
 * PRIVACITAT (ordre del Mestre, 261004: cap xifra financera es pinta fins que
 * la persona prem l'ull, i cap títol ni subtítol porta dades): dels moviments
 * només ix la data i els cèntims, marcats `privat: true`; mai el text del
 * concepte, el comerç, el creditor ni cap referència. Cap NIF ni cap patró de
 * sèrie del catàleg: la línia porta la clau, el nom, el primer domini que el
 * registre ja coneix (cap URL nova) i la cadència. Un proveïdor que el
 * registre només coneix pel NIF (clau «nif-…», sense nom a l'historial) ix
 * amb una clau opaca, també a les incidències: eixe NIF pot ser el DNI d'una
 * persona.
 *
 * JS pur: sense DOM, React ni xarxa. Imports en cèntims enters. No modifica
 * res del que rep, i l'eixida és congelada en profunditat.
 */
import { auditaTrimestre } from './auditoria.js';
import { concilia } from './concilia.js';
import { comparaDates, diesDelMes, diesEntre, esDataValida, mesosDelTrimestre, rangTrimestre } from './dates.js';
import { hashFnv1a, MONEDA_DEL_FULL, ordenaFactures } from './model.js';
import { aprenProveidors, clauMes, identificaProveidor, indexMes } from './proveidors.js';

/** Els estats d'un mes d'una línia. */
export const ESTATS_MES = Object.freeze(['completa', 'falta', 'potser-falta', 'falta-amb-pagament', 'futura']);

/* Les incidències d'auditaTrimestre que parlen de factures que falten o que no són d'este trimestre. */
const CODIS_REUTILITZATS = Object.freeze(['FALTA_MENSUAL', 'FALTA_HABITUAL', 'FORAT_NUMERACIO', 'FORA_TRIMESTRE']);
/* La finestra d'auditoria.js: els mesos abans del primer del trimestre on s'ha d'haver vist el proveïdor, i després. */
const MESOS_ABANS = new Map([['mensual', 3], ['bimestral', 4]]);
const MESOS_DESPRES = 2;
/* La banda de l'import d'un candidat, en desenes: del 70 % del total més baix de l'historial al 130 % del més alt. */
const BANDA_BAIXA = 7;
const BANDA_ALTA = 13;
const DESENES = 10;
/* Els dies després de l'últim del mes en què encara pot arribar el càrrec d'una factura d'eixe mes (revisió
   adversarial 14-10-2026: amb 45 dies des de l'1, la finestra d'un mensual arribava al càrrec del mes següent). */
const DIES_DESPRES_DEL_MES = 10;
const SENSE_NOM = 'Proveïdor sense nom';

const indexDe = (a, m) => a * 12 + m - 1;
const mesDe = (i) => ({ a: Math.floor(i / 12), m: (i % 12) + 1 });
const clauDeIndex = (i) => clauMes({ ...mesDe(i), d: 1 });
const mesDeFactura = (f) => indexMes(clauMes(f?.data));
const enEuros = (f) => f?.moneda == null || f.moneda === MONEDA_DEL_FULL;
const esObjecte = (x) => Boolean(x) && typeof x === 'object';
/* Una clau «nif-…» porta el NIF del proveïdor (vegeu la capçalera): ix opaca i estable. */
const clauPublica = (clau) => (/^nif-/.test(String(clau ?? '')) ? `proveidor-${hashFnv1a(clau).slice(0, 12)}` : clau);

/* Congela un objecte fet ací i tot el que porta a dins. */
function congela(valor) {
  if (!esObjecte(valor)) return valor;
  for (const fill of Object.values(valor)) congela(fill);
  return Object.freeze(valor);
}

/* 'cobert' o 'sense-extracte' de cada mes (índex absolut), pels intervals dels comptes en euros. */
function coberturaDels(comptes) {
  const intervals = comptes
    .flatMap((c) => (Array.isArray(c.cobert) ? c.cobert : [{ desde: c.desde, fins: c.fins }]))
    .filter((x) => esDataValida(x?.desde) && esDataValida(x?.fins) && comparaDates(x.desde, x.fins) <= 0);
  return (i) => {
    const { a, m } = mesDe(i);
    const inici = { a, m, d: 1 };
    const fi = { a, m, d: diesDelMes(a, m) };
    return intervals.some((x) => comparaDates(x.desde, fi) <= 0 && comparaDates(x.fins, inici) >= 0) ? 'cobert' : 'sense-extracte';
  };
}

/**
 * Les factures que falten d'un trimestre (vegeu les regles a dalt).
 * @param {object} p
 * @param {number} p.any
 * @param {number} p.t trimestre (1-4)
 * @param {object[]} [p.factures] les Factures del trimestre (la proposta del Full)
 * @param {object[]} [p.historial] les Factures dels fulls anteriors: el registre, els recomptes i la banda de l'import
 * @param {object[]} [p.comptes] els de comptesDe (dadesDelTauler(...).comptes); només compten els que són en euros
 * @param {{a:number,m:number,d:number}|null} [p.avui] sense, cap mes és 'futura'
 * @returns {{ rang: { inici: object, fi: object }, linies: Array<{ clau: string, nom: string, domini: string|null,
 *   cadencia: string|null, mesos: Array<{ mes: string, estat: string, esperades: number, trobades: string[],
 *   pagament: { data: object, centims: number, privat: true }|null, banc: 'cobert'|'sense-extracte',
 *   sensePagament: 'sense-extracte'|'sense-historial'|'cap'|'diversos'|'compartit'|'no-cercat'|null }> }>,
 *   incidencies: Array<{ codi: string, missatge: string, proveidor?: string, mes?: string, numeros?: string[] }>,
 *   resum: { falten: number, potserFalten: number, ambPagament: number } }} congelat en profunditat
 * @throws {RangeError} si any i t no són un trimestre
 */
export function facturesQueFalten({ any, t, factures = [], historial = [], comptes = [], avui = null } = {}) {
  const rang = rangTrimestre(any, t);
  if (!rang) throw new RangeError(`Trimestre no vàlid: ${any} ${t}T`);
  const llista = (Array.isArray(factures) ? factures : []).filter(esObjecte);
  const anteriors = (Array.isArray(historial) ? historial : []).filter(esObjecte);
  const dataAvui = esDataValida(avui) ? avui : null;
  const futur = (i) => dataAvui !== null && i > indexDe(dataAvui.a, dataAvui.m);
  const indexs = mesosDelTrimestre(t).map((m) => indexDe(any, m));
  const [indexInici] = indexs;

  /* Regla 1: el registre, après de l'historial i fusionat amb el catàleg. Regla 2: cada despesa, al seu proveïdor. */
  const registre = aprenProveidors(anteriors);
  const perProveidor = (conjunt) => {
    const grups = new Map();
    for (const f of conjunt) {
      if (f.tipus !== 'despesa') continue;
      const p = identificaProveidor({ nif: f.nif, nom: f.contrapart, nomFitxer: f.origen?.fitxer }, registre)?.proveidor;
      if (!p) continue;
      if (!grups.has(p.clau)) grups.set(p.clau, []);
      grups.get(p.clau).push(f);
    }
    return grups;
  };
  const delTrimestre = perProveidor(llista);
  const delHistorial = perProveidor(anteriors);

  /* Regla 6: les incidències d'auditaTrimestre, reutilitzades i no duplicades. */
  const auditades = auditaTrimestre({ any, t, factures: llista, proveidors: registre, historial: anteriors, avui: dataAvui })
    .incidencies.filter((i) => CODIS_REUTILITZATS.includes(i.codi));
  const habituals = new Set(auditades.filter((i) => i.codi === 'FALTA_HABITUAL' && i.proveidor && i.mes).map((i) => `${i.proveidor}|${i.mes}`));
  const incidencies = auditades.map((i) => ({
    codi: i.codi,
    missatge: i.missatge,
    ...(i.proveidor ? { proveidor: clauPublica(i.proveidor) } : {}),
    ...(i.mes ? { mes: i.mes } : {}),
    ...(Array.isArray(i.numeros) ? { numeros: i.numeros.map(String) } : {})
  }));

  /* Regla 5: el banc, només dels comptes en euros. */
  const enEurosC = (Array.isArray(comptes) ? comptes : []).filter((c) => esObjecte(c) && c.divisa === MONEDA_DEL_FULL);
  const bancDe = coberturaDels(enEurosC);
  const moviments = enEurosC.flatMap((c) => (Array.isArray(c.moviments) ? c.moviments : []));
  const conciliacio = moviments.length > 0 ? concilia({ moviments, factures: [...llista, ...anteriors], proveidors: registre }) : null;
  const eixides = (conciliacio?.movimentsSenseFactura ?? []).filter((m) => m.centims < 0);

  /* (d) El concepte comú de les parelles de l'historial del proveïdor, o null si no en diuen cap (o més d'un). */
  const concepteDe = (clau) => {
    const seues = new Set(delHistorial.get(clau) ?? []);
    const conceptes = new Set();
    for (const parella of conciliacio?.parelles ?? []) {
      const [pagament] = parella.moviments ?? [];
      if (!pagament || !(parella.factures ?? []).some((f) => seues.has(f))) continue;
      if (typeof pagament.conceptComu === 'string' && pagament.conceptComu !== '') conceptes.add(pagament.conceptComu);
    }
    return conceptes.size === 1 ? [...conceptes][0] : null;
  };
  /* (a) eixida, (b) dins de la banda de l'historial, (c) dins del mes i dels 10 dies següents, (d) amb el concepte
     comú. null si l'historial no té cap total en euros del proveïdor: no hi ha banda, i no es busca. */
  const candidatsDe = (clau, i) => {
    const totals = (delHistorial.get(clau) ?? []).filter((f) => enEuros(f) && Number.isSafeInteger(f.total) && f.total > 0).map((f) => f.total);
    if (totals.length === 0) return null;
    const minim = Math.min(...totals);
    const maxim = Math.max(...totals);
    const concepte = concepteDe(clau);
    const { a, m: mesNum } = mesDe(i);
    const dia1 = { a, m: mesNum, d: 1 };
    const finestra = diesDelMes(a, mesNum) - 1 + DIES_DESPRES_DEL_MES;
    return eixides.filter((m) => {
      const imp = Math.abs(m.centims) * DESENES;
      const dies = diesEntre(dia1, m.dataOperacio);
      return imp >= minim * BANDA_BAIXA && imp <= maxim * BANDA_ALTA && dies !== null && dies >= 0 && dies <= finestra
        && (concepte === null || m.conceptComu === concepte);
    });
  };

  const linies = [];
  const pendents = [];
  for (const p of registre) {
    if (!p) continue;
    const propies = delTrimestre.get(p.clau) ?? [];
    const vistos = [...(p.mesosVistos ?? []).map(indexMes), ...propies.map(mesDeFactura)].filter((i) => i !== null);
    const abans = MESOS_ABANS.get(p.cadencia);
    const aprop = abans !== undefined && vistos.some((i) => i >= indexInici - abans && i <= indexInici + MESOS_DESPRES);
    if (!aprop && !propies.some((f) => indexs.includes(mesDeFactura(f)))) continue;

    /* Els recomptes de cada mes: l'historial abans del trimestre i, dins, les trobades. */
    const comptats = new Map();
    for (const f of delHistorial.get(p.clau) ?? []) {
      const i = mesDeFactura(f);
      if (i !== null && i < indexInici) comptats.set(i, (comptats.get(i) ?? 0) + 1);
    }
    const trobadesDe = new Map(indexs.map((i) => [i, []]));
    for (const f of ordenaFactures(propies)) trobadesDe.get(mesDeFactura(f))?.push(f);
    for (const [i, trobades] of trobadesDe) if (trobades.length > 0) comptats.set(i, trobades.length);
    const primer = vistos.length > 0 ? Math.min(...vistos) : null;

    /* Regla 3, i les esperades dels bimestrals i de la resta. */
    const esperadesDe = (i, trobades) => {
      if (p.cadencia === 'mensual') {
        if (primer === null || i < primer) return 0;
        const previs = [...comptats.keys()].filter((k) => k < i).sort((x, y) => y - x).slice(0, 2);
        return previs.length > 0 ? Math.max(1, Math.min(...previs.map((k) => comptats.get(k)))) : 1;
      }
      if (p.cadencia === 'bimestral') return trobades > 0 || habituals.has(`${p.clau}|${clauDeIndex(i)}`) ? 1 : 0;
      return 0;
    };

    const mesos = indexs.map((i) => {
      const trobades = trobadesDe.get(i);
      const esperades = esperadesDe(i, trobades.length);
      const banc = bancDe(i);
      let estat = 'completa';
      if (futur(i)) estat = 'futura';
      else if (trobades.length === 0 && esperades > 0) estat = 'falta';
      else if (trobades.length < esperades) estat = 'potser-falta';
      const mes = {
        mes: clauDeIndex(i), estat, esperades, trobades: trobades.map((f) => String(f.num ?? '').trim()), pagament: null, banc,
        sensePagament: null
      };
      if (estat === 'potser-falta') mes.sensePagament = 'no-cercat';
      else if (estat === 'falta' && banc !== 'cobert') mes.sensePagament = 'sense-extracte';
      else if (estat === 'falta') {
        const candidats = candidatsDe(p.clau, i);
        if (candidats === null) mes.sensePagament = 'sense-historial';
        else pendents.push({ mes, candidats });
      }
      return mes;
    });
    linies.push({
      clau: clauPublica(p.clau),
      nom: p.nom || SENSE_NOM,
      domini: (p.dominis ?? []).find((d) => typeof d === 'string' && d.trim() !== '') ?? null,
      cadencia: p.cadencia ?? null,
      mesos
    });
  }

  /* Un ÚNIC candidat és el pagament, si no és també l'únic d'un altre mes que falta. */
  const unicDe = new Map();
  for (const { candidats } of pendents) if (candidats.length === 1) unicDe.set(candidats[0], (unicDe.get(candidats[0]) ?? 0) + 1);
  for (const { mes, candidats } of pendents) {
    if (candidats.length === 0) mes.sensePagament = 'cap';
    else if (candidats.length > 1) mes.sensePagament = 'diversos';
    else if (unicDe.get(candidats[0]) !== 1) mes.sensePagament = 'compartit';
    else {
      const { dataOperacio: d, centims } = candidats[0];
      mes.estat = 'falta-amb-pagament';
      mes.pagament = { data: { a: d.a, m: d.m, d: d.d }, centims: Math.abs(centims), privat: true };
    }
  }

  const estats = linies.flatMap((l) => l.mesos.map((m) => m.estat));
  const quants = (...quins) => estats.filter((e) => quins.includes(e)).length;
  return congela({
    rang: { inici: { ...rang.inici }, fi: { ...rang.fi } },
    linies,
    incidencies,
    resum: { falten: quants('falta', 'falta-amb-pagament'), potserFalten: quants('potser-falta'), ambPagament: quants('falta-amb-pagament') }
  });
}
