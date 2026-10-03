/* Gestoria · el 3T de 2026 amb la carpeta real del Mestre (node:test).
   Executa el tractor de factures sencer (executaTractorFactures) sobre una
   Font de disc NOMÉS LECTURA de ../_gestoria_de_poble/02_Facturacio, amb
   l'aprovació WebAuthn simulada (tests/helpers/autenticadorSimulat.js) i el
   descompressor de node:zlib; després llig l'extracte Norma 43 del 3T i en
   concilia els moviments amb les factures proposades. També imprimix
   l'empremta curta actual dels dos tractors, calculada des del disc, perquè
   el Mestre sàpia si la que va signar continua valent.

   PRIVACITAT. Este fitxer no porta cap valor real: les assercions són sobre
   agregats i invariants (cap duplicat al full, cap justificant com a factura,
   base + IVA = total...). La taula diagnòstica s'imprimix per la consola de
   la màquina del Mestre i no es versiona mai. Si la carpeta no hi és (la CI,
   un altre ordinador), tot se salta.

   DEFECTES CONEGUTS. Les invariants que encara no es complixen porten `todo`
   amb l'identificador del defecte (G3T-…) i el motiu: node:test les mostra
   però no fan fallar l'execució. Quan una onada en corregix un, se'n lleva el
   `todo` i la prova passa a ser una porta. L'onada G3T del 2 d'octubre de
   2026 n'ha tancat G3T-01, 02, 03, 06, 07, 08, 10, 11 i 14, que ara són
   portes. G3T-04 i G3T-05 queden amb `todo` perquè ja no depenen del codi
   sinó de la carpeta (vegeu cada prova), i cada una té al costat la porta del
   que sí que fa el producte. G3T-12 i G3T-15 tenen la part del producte feta
   i provada amb dades sintètiques (vitest); G3T-09 i G3T-13 continuen oberts.

   G3T-03 (R3T-01). L'arranjament és la prioritat «preferent» de receptes.js,
   provada amb dades sintètiques. Amb les dades reals, r.nomsPropis només porta
   el titular (la marca no es deduïx d'una sola factura emesa), i per això la
   porta ho contrasta a més amb el text de les factures emeses de la sèrie als
   trimestres de l'historial: la marca de l'emissor ix a totes, i un client de
   veres només a les del seu NIF. Un control comprova que la porta distingix. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { constants, inflateRawSync, inflateSync } from 'node:zlib';
import { creaAutenticadorSimulat } from './helpers/autenticadorSimulat.js';
import { TRACTOR_CORREUS, TRACTOR_FACTURES } from '../src/sections/gestoria/tractors.js';
import { calculaEmpremta, empremtaCurta } from '../src/sections/tractors/nucli/empremta.js';
import { esRutaOculta, executaTractorFactures, trimestreDeCarpeta } from '../src/sections/gestoria/nucli/tractor.js';
import { llegeixC43, textDelsConceptes, totsElsMoviments, filtraTrimestre } from '../src/sections/gestoria/nucli/c43.js';
import { concilia } from '../src/sections/gestoria/nucli/concilia.js';
import { detectaDuplicats, serieEmesa } from '../src/sections/gestoria/nucli/classifica.js';
import { decodificaText } from '../src/sections/gestoria/nucli/csv.js';
import { dinsDeRang, esDataValida, formatData, rangTrimestre } from '../src/sections/gestoria/nucli/dates.js';
import { formatImport } from '../src/sections/gestoria/nucli/diners.js';
import { generaEntregables } from '../src/sections/gestoria/nucli/entregables.js';
import { llegeixModelCsv } from '../src/sections/gestoria/nucli/fullModel.js';
import { inflateDisponible } from '../src/sections/gestoria/nucli/inflate.js';
import { clauDuplicat, normalitzaNom, numeroCompacte, totals } from '../src/sections/gestoria/nucli/model.js';
import { normalitzaNif } from '../src/sections/gestoria/nucli/nif.js';
import { extreuTextPdf } from '../src/sections/gestoria/nucli/pdfText.js';
import { paisDelNif } from '../src/sections/gestoria/nucli/proveidors.js';
import { extreuCamps } from '../src/sections/gestoria/nucli/receptes.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FACTURACIO = path.resolve(ARREL, '../_gestoria_de_poble/02_Facturacio');
const ANY = 2026;
const T = 3;
const CARPETA_T = `${ANY}_${T}T`;
const HI_ES = existsSync(path.join(FACTURACIO, CARPETA_T));
const SALTA = HI_ES ? false : 'no hi ha la carpeta real de facturació en esta màquina';
const RANG = rangTrimestre(ANY, T);

/* Noms de fitxer que són justificants o rebuts de pagament, no factures (paraules genèriques). */
const NOM_DE_JUSTIFICANT = /(^|[^a-z])(justi|justificant|justificante|comprovant|comprobante|receipt|rebut|recibo)/i;
const PROFUNDITAT = 8;

/* ── La Font de disc, només lectura ─────────────────────────────────────── */

/* Mateix contracte que fontNavegador.js: rutes relatives amb «/», sense ocults, fins a 8 nivells. Cap `escriu`. */
function fontDeDisc(arrel) {
  const llegits = [];
  const recorre = (directori, prefix, nivell, entrades) => {
    for (const nom of readdirSync(directori).sort()) {
      if (esRutaOculta(nom)) continue;
      const ruta = prefix ? `${prefix}/${nom}` : nom;
      const absoluta = path.join(directori, nom);
      const info = statSync(absoluta);
      if (info.isDirectory()) {
        if (nivell + 1 <= PROFUNDITAT) recorre(absoluta, ruta, nivell + 1, entrades);
      } else if (info.isFile()) entrades.push({ ruta, mida: info.size, modificat: info.mtimeMs });
    }
    return entrades;
  };
  const font = {
    nom: path.basename(arrel),
    limitacions: [],
    async llista() {
      return recorre(arrel, '', 0, []);
    },
    async llig(ruta) {
      const absoluta = path.resolve(arrel, ...String(ruta).split('/'));
      if (!absoluta.startsWith(`${arrel}${path.sep}`)) throw new Error('ruta fora de la carpeta');
      llegits.push(ruta);
      return new Uint8Array(readFileSync(absoluta));
    }
  };
  return { font, llegits };
}

/* zlib tolerant, com el del navegador: un flux truncat torna el que s'ha pogut descomprimir. */
async function inflateNode(bytes) {
  const opcions = { finishFlush: constants.Z_SYNC_FLUSH };
  try {
    return new Uint8Array(inflateSync(bytes, opcions));
  } catch {
    return new Uint8Array(inflateRawSync(bytes, opcions));
  }
}

/* ── L'aprovació simulada ───────────────────────────────────────────────── */

/* L'empremta és sintètica: la prova no recalcula la de les fonts (eixa la mira la porta de la Wiki). */
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
async function aprovacioSimulada() {
  const autenticador = await creaAutenticadorSimulat();
  const ara = Date.now();
  const registre = await autenticador.signa({ manifest: TRACTOR_FACTURES, empremta: EMPREMTA, ara: ara - 60000 });
  return {
    manifest: TRACTOR_FACTURES, empremta: EMPREMTA, registres: [registre], claus: autenticador.claus,
    origen: autenticador.origen, rpId: autenticador.rpId, ara
  };
}

const avuiDe = (d) => ({ a: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() });

/* ── L'anàlisi, una sola vegada per a totes les proves ──────────────────── */

let analisiPromesa = null;
function analisi() {
  analisiPromesa ??= (async () => {
    const aprovacio = await aprovacioSimulada();
    const { font, llegits } = fontDeDisc(FACTURACIO);
    const inici = Date.now();
    const r = await executaTractorFactures({ font, any: ANY, t: T, aprovacio, inflate: inflateNode, avui: avuiDe(new Date()) });
    return { r, llegits, aprovacio, ms: Date.now() - inici };
  })();
  return analisiPromesa;
}

const nomDe = (ruta) => String(ruta ?? '').split('/').pop();
const totesDe = (proposta) => [...proposta.ingressos, ...proposta.despeses];
const incidenciesDe = (r, f) => r.incidencies.filter((i) => i.facturaId === f.id || (i.fitxer && i.fitxer === f.origen?.fitxer));
const tall = (text, n) => {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const imp = (x) => (Number.isSafeInteger(x) ? formatImport(x) : '—');
const quadra = (f) => {
  if (![f.subtotal, f.iva, f.total].every(Number.isSafeInteger)) return null;
  const retencio = Number.isSafeInteger(f.retencio) ? Math.abs(f.retencio) : 0;
  const sense = Math.abs(f.subtotal + f.iva - f.total) <= 1;
  const amb = retencio > 0 && Math.abs(f.subtotal + f.iva + (f.subtotal < 0 ? retencio : -retencio) - f.total) <= 1;
  return sense || amb;
};
const confiancaMinima = (f) => {
  const nivells = Object.values(f.confianca ?? {});
  return nivells.includes('baixa') ? 'baixa' : nivells.includes('mitjana') ? 'mitjana' : nivells.length ? 'alta' : '—';
};
/* Un número sense espais ni separadors, en majúscules: «X-0004», «x 0004» i «X.0004» són el mateix. */
const pelat = (num) => numeroCompacte(num).replace(/[-_./]/g, '');
const ambCodi = (r, codi) => r.incidencies.filter((i) => i.codi === codi);

/* Les factures del full que repetixen una altra: mateix NIF/nom i número, mateix contingut o còpia pel nom. */
function duplicatsDelFull(proposta) {
  const factures = totesDe(proposta);
  const grups = [];
  const perClau = new Map();
  for (const f of factures) {
    const [qui, num] = clauDuplicat(f).split('|');
    if (!qui || !num) continue;
    const clau = `${f.tipus}|${qui}|${num}`;
    perClau.set(clau, [...(perClau.get(clau) ?? []), f]);
  }
  for (const grup of perClau.values()) if (grup.length > 1) grups.push({ motiu: 'nif-o-nom i número', factures: grup });
  const perSha = new Map();
  for (const f of factures) if (f.origen?.sha256) perSha.set(f.origen.sha256, [...(perSha.get(f.origen.sha256) ?? []), f]);
  for (const grup of perSha.values()) if (grup.length > 1) grups.push({ motiu: 'mateix contingut', factures: grup });
  const ambFitxer = factures.filter((f) => f.origen?.fitxer);
  const perRuta = new Map(ambFitxer.map((f) => [f.origen.fitxer, f]));
  const docs = ambFitxer.map((f) => ({
    ruta: f.origen.fitxer, mida: statSync(path.join(FACTURACIO, ...f.origen.fitxer.split('/'))).size, ...(f.origen.sha256 ? { sha256: f.origen.sha256 } : {})
  }));
  for (const grup of detectaDuplicats(docs)) grups.push({ motiu: `còpia (${grup.motiu})`, factures: grup.documents.map((d) => perRuta.get(d.ruta)) });
  return grups;
}

/* La sèrie de factures emeses que el tractor aprén dels fulls anteriors, refeta ací amb els mateixos mòduls. */
function serieDeLHistorial(llegits) {
  const ingressos = [];
  for (const ruta of llegits.filter((r) => /\.csv$/i.test(r) && /facturacio/i.test(r))) {
    const model = llegeixModelCsv(decodificaText(new Uint8Array(readFileSync(path.join(FACTURACIO, ...ruta.split('/'))))), { fitxer: ruta });
    ingressos.push(...model.ingressos);
  }
  return serieEmesa(ingressos);
}

/* ── Diagnòstic (només consola) ─────────────────────────────────────────── */

function imprimix(titol, files) {
  console.log(`\n## ${titol}`);
  if (files.length === 0) {
    console.log('(cap)');
    return;
  }
  const columnes = Object.keys(files[0]);
  const ample = columnes.map((c) => Math.max(c.length, ...files.map((f) => String(f[c] ?? '').length)));
  const linia = (valors) => valors.map((v, i) => String(v ?? '').padEnd(ample[i])).join(' | ');
  console.log(linia(columnes));
  console.log(ample.map((n) => '-'.repeat(n)).join('-|-'));
  for (const f of files) console.log(linia(columnes.map((c) => f[c])));
}

/* ── Proves ─────────────────────────────────────────────────────────────── */

test('el tractor llig el 3T real amb l’aprovació simulada i només toca el que declara', { skip: SALTA }, async () => {
  const { r, llegits, ms } = await analisi();
  assert.equal(r.proposta.any, ANY);
  assert.equal(r.proposta.t, T);
  assert.equal(r.cobertura.carpetaTrimestre, CARPETA_T);
  assert.ok(r.proposta.titular.trim() !== '', 'el titular s’aprén dels fulls anteriors');
  assert.ok(r.cobertura.historial.length >= 1, 'almenys un full anterior per a l’historial');
  assert.ok(r.proposta.ingressos.length + r.proposta.despeses.length > 0, 'hi ha factures proposades');
  /* Només es llig la carpeta del trimestre i els fulls CSV dels quatre trimestres anteriors. */
  const forans = llegits.filter((ruta) => {
    const [carpeta] = ruta.split('/');
    if (carpeta === CARPETA_T) return false;
    const q = trimestreDeCarpeta(carpeta);
    return !(q && /facturacio/i.test(nomDe(ruta)) && /\.csv$/i.test(ruta));
  });
  assert.equal(forans.length, 0, 'cap lectura fora del trimestre i dels fulls anteriors');
  const docs = r.documents.filter((d) => d.ambit === 'trimestre');
  console.log(`\n# Anàlisi: ${docs.length} documents del trimestre, ${llegits.length} lectures, ${ms} ms; `
    + `${r.proposta.ingressos.length} ingressos, ${r.proposta.despeses.length} despeses, ${r.incidencies.length} incidències; `
    + `historial: ${r.cobertura.historial.join(', ')}`);
});

test('taula diagnòstica dels documents del trimestre (només consola)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const perId = new Map(totesDe(r.proposta).map((f) => [f.id, f]));
  const files = r.documents.filter((d) => d.ambit === 'trimestre').map((d) => {
    const f = d.facturaId ? perId.get(d.facturaId) : null;
    const delFitxer = r.incidencies.filter((i) => i.fitxer === d.ruta || (f && i.facturaId === f.id)).map((i) => i.codi);
    return {
      fitxer: tall(nomDe(d.ruta), 46),
      tipus: d.tipus,
      sentit: d.sentit ?? '?',
      estat: d.estat,
      full: f ? (f.tipus === 'ingres' ? 'I' : 'D') : '',
      data: f ? formatData(f.data) : '',
      num: f ? tall(f.num, 22) : '',
      contrapart: f ? tall(f.contrapart, 26) : (d.proveidor ?? ''),
      nif: f ? f.nif : '',
      base: f ? imp(f.subtotal) : '',
      iva: f ? imp(f.iva) : '',
      total: f ? imp(f.total) : '',
      moneda: f?.moneda ?? '',
      estatF: f ? f.estat : '',
      conf: f ? confiancaMinima(f) : '',
      incidencies: [...new Set([...delFitxer, ...d.avisos.map((a) => a.codi)])].join(',')
    };
  });
  imprimix('Documents del trimestre', files);
  /* D'on ix cada camp: el fragment del PDF, amb els caràcters no ASCII escapats (guions especials, espais durs...). */
  const escapa = (text) => tall(text, 70).replace(/[^\x20-\x7E]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
  imprimix('Fragments de lectura', r.documents.filter((d) => d.fragments).map((d) => ({
    fitxer: tall(nomDe(d.ruta), 32),
    num: escapa(d.fragments.num ?? ''),
    contrapart: escapa(d.fragments.contrapart ?? ''),
    subtotal: escapa(d.fragments.subtotal ?? ''),
    iva: escapa(d.fragments.iva ?? ''),
    total: escapa(d.fragments.total ?? '')
  })));
  imprimix('Avisos de lectura', r.documents.filter((d) => d.ambit === 'trimestre').flatMap((d) => d.avisos
    .filter((a) => ['LECTURA_PDF', 'POSSIBLE_COPIA', 'DUPLICAT', 'FITXER_ILLEGIBLE'].includes(a.codi))
    .map((a) => ({ fitxer: tall(nomDe(d.ruta), 32), codi: a.codi, missatge: tall(a.missatge, 120) }))));
  imprimix('Incidències sense fitxer', r.incidencies.filter((i) => !i.fitxer && !i.facturaId)
    .map((i) => ({ codi: i.codi, severitat: i.severitat, missatge: tall(i.missatge, 150) })));
  const recompte = {};
  for (const i of r.incidencies) recompte[i.severitat] = (recompte[i.severitat] ?? 0) + 1;
  console.log(`\n# Incidències per severitat: ${JSON.stringify(recompte)}`);
  assert.ok(files.length > 0);
});

test('cada document del trimestre té un destí i cap PDF de factura queda sense llegir en silenci', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const docs = r.documents.filter((d) => d.ambit === 'trimestre');
  for (const d of docs) assert.ok(['extreta', 'parcial', 'manual', 'ignorada'].includes(d.estat), `estat conegut (${d.tipus})`);
  const ids = new Set(totesDe(r.proposta).map((f) => f.id));
  /* G3T-10: un PDF protegit o sense cap dada no fa fila, però porta el motiu (PDF_XIFRAT, PDF_SENSE_DADES). */
  const MOTIUS = ['DUPLICAT', 'MATEIXA_FACTURA', 'FITXER_ILLEGIBLE', 'FITXER_MASSA_GRAN', 'PDF_XIFRAT', 'PDF_SENSE_DADES'];
  for (const d of docs.filter((x) => x.tipus === 'factura' && /\.pdf$/i.test(x.ruta))) {
    const comptada = d.facturaId && ids.has(d.facturaId);
    const avisada = d.avisos.some((a) => MOTIUS.includes(a.codi));
    assert.ok(comptada || avisada, 'una factura en PDF va al full o porta el motiu de no anar-hi');
    if (!comptada) assert.ok(d.estat === 'manual' || d.estat === 'ignorada', 'la que no va al full no es compta com a extreta');
  }
});

test('cap justificant ni rebut de pagament entra al full com a factura (G3T-01)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const colats = totesDe(r.proposta).filter((f) => NOM_DE_JUSTIFICANT.test(nomDe(f.origen?.fitxer)));
  assert.equal(colats.length, 0, `${colats.length} justificants o rebuts al full`);
});

test('cap duplicat al full: ni el mateix número, ni el mateix contingut, ni una còpia pel nom (G3T-02, G3T-06)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const grups = duplicatsDelFull(r.proposta);
  imprimix('Duplicats al full', grups.map((g) => ({
    motiu: g.motiu, fitxers: g.factures.map((f) => nomDe(f?.origen?.fitxer)).join(' + '), totals: g.factures.map((f) => imp(f?.total)).join(' + ')
  })));
  assert.equal(grups.length, 0, `${grups.length} grups de factures repetides al full`);
});

test('imports: cada factura completa quadra (base + IVA − retenció = total) i la que no, porta IVA_INCOHERENT', { skip: SALTA }, async () => {
  const { r } = await analisi();
  for (const f of totesDe(r.proposta)) {
    const q = quadra(f);
    if (f.estat === 'completa') assert.equal(q, true, 'una factura completa quadra');
    if (q === false) {
      assert.equal(f.estat, 'pendent', 'una factura que no quadra és pendent');
      assert.ok(incidenciesDe(r, f).some((i) => i.codi === 'IVA_INCOHERENT'), 'i porta IVA_INCOHERENT');
    }
  }
});

test('base i IVA no van girats: cap factura té l’IVA més gran que la base quan girats donen un tipus habitual (G3T-07)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const habitual = (base, quota) => [4, 5, 10, 21].some((tipus) => Math.abs(quota - Math.round((base * tipus) / 100)) <= 1);
  const girades = totesDe(r.proposta).filter((f) => Number.isSafeInteger(f.subtotal) && Number.isSafeInteger(f.iva)
    && f.subtotal > 0 && f.iva > f.subtotal && habitual(f.iva, f.subtotal));
  assert.equal(girades.length, 0, `${girades.length} factures amb la base i l’IVA girats`);
});

test('cap fila buida al full: una factura sense cap camp llegit no entra com a despesa en blanc (G3T-10)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const buides = totesDe(r.proposta).filter((f) => f.origen?.metode === 'pdf' && !esDataValida(f.data) && !f.num
    && ![f.subtotal, f.iva, f.total].some(Number.isSafeInteger));
  assert.equal(buides.length, 0, `${buides.length} files buides al full`);
});

test('una factura amb el total llegit també porta base i IVA (o un IVA 0 justificat) (G3T-11)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const coixes = totesDe(r.proposta).filter((f) => f.origen?.metode === 'pdf' && Number.isSafeInteger(f.total)
    && (!Number.isSafeInteger(f.subtotal) || !Number.isSafeInteger(f.iva)));
  assert.equal(coixes.length, 0, `${coixes.length} factures amb total i sense base o IVA`);
});

test('la factura en una altra moneda porta MONEDA_ESTRANGERA i queda pendent', { skip: SALTA }, async () => {
  const { r } = await analisi();
  for (const f of totesDe(r.proposta).filter((x) => x.moneda && x.moneda !== 'EUR')) {
    assert.equal(f.estat, 'pendent');
    assert.ok(incidenciesDe(r, f).some((i) => i.codi === 'MONEDA_ESTRANGERA'));
  }
});

test('la data: cada factura de fora del trimestre porta FORA_TRIMESTRE', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const fora = totesDe(r.proposta).filter((f) => esDataValida(f.data) && !dinsDeRang(f.data, RANG));
  for (const f of fora) assert.ok(incidenciesDe(r, f).some((i) => i.codi === 'FORA_TRIMESTRE'));
  console.log(`\n# Factures amb data fora del ${T}T: ${fora.length}`);
});

test('el sentit: un document amb un número de la sèrie emesa de l’historial va als ingressos', { skip: SALTA }, async () => {
  const { r, llegits } = await analisi();
  const serie = serieDeLHistorial(llegits);
  assert.ok(serie instanceof RegExp, 'l’historial té una sèrie de factures emeses');
  const perId = new Map(totesDe(r.proposta).map((f) => [f.id, f]));
  const delaSerie = r.documents.filter((d) => d.ambit === 'trimestre' && d.tipus === 'factura' && serie.test(nomDe(d.ruta)));
  assert.ok(delaSerie.length > 0, 'hi ha almenys una factura emesa al trimestre');
  for (const d of delaSerie) assert.equal(perId.get(d.facturaId)?.tipus, 'ingres', 'la factura emesa és un ingrés');
});

/* Les factures emeses de la sèrie (pel nom del fitxer), del trimestre i dels trimestres de l'historial, amb el
   text i el NIF del client que en llig la recepta. Només per a la porta de G3T-03: el tractor no les llig. */
let lecturaEmeses = null;
function emesesDeLaSerie() {
  lecturaEmeses ??= (async () => {
    const { r, llegits } = await analisi();
    const serie = serieDeLHistorial(llegits);
    const carpetes = [...new Set([CARPETA_T, ...llegits.filter((ruta) => /\.csv$/i.test(ruta)).map((ruta) => ruta.split('/')[0])])];
    const emeses = [];
    for (const carpeta of carpetes) {
      for (const nom of readdirSync(path.join(FACTURACIO, carpeta)).filter((n) => /\.pdf$/i.test(n) && serie?.test(n)).sort()) {
        const pdf = await extreuTextPdf(new Uint8Array(readFileSync(path.join(FACTURACIO, carpeta, nom))), { inflate: inflateNode });
        const camps = extreuCamps(pdf.text, { tipus: 'ingres', nifsPropis: r.nifsPropis, nomsPropis: r.nomsPropis, nomFitxer: nom });
        emeses.push({ ruta: `${carpeta}/${nom}`, text: pdf.text, nif: normalitzaNif(camps.nif) });
      }
    }
    return emeses;
  })();
  return lecturaEmeses;
}

/* Cert si el nom, normalitzat, ix sencer (per paraules) al text normalitzat. */
const ixAlText = (text, nom) => {
  const n = normalitzaNom(nom);
  return n.length >= 3 && ` ${normalitzaNom(text)} `.includes(` ${n} `);
};
/* El que una línia porta enganxat darrere de l'etiqueta del client («Facturar a <…>»): la lectura del defecte. */
const plegat = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const darrereEtiquetaClient = (text) => String(text ?? '').split('\n').map((linia) => {
  const m = /(?:^|[^a-z])(?:facturar\s+a|bill(?:ed)?\s+to|cliente?|customer)(?![a-z])\s*:?\s*(.*)$/.exec(plegat(linia));
  return m ? m[1].trim() : '';
}).find((resta) => (resta.match(/\p{L}/gu) ?? []).length >= 3) ?? '';

test('cap ingrés té de client el titular, una marca pròpia ni un NIF propi (G3T-03)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  assert.ok(Array.isArray(r.nomsPropis), 'el tractor diu quins noms són propis');
  assert.ok(r.nomsPropis.map(normalitzaNom).includes(normalitzaNom(r.proposta.titular)), 'el titular dels fulls anteriors és un nom propi');
  const propis = new Set(r.nomsPropis.map(normalitzaNom));
  for (const f of r.proposta.ingressos) {
    assert.ok(!propis.has(normalitzaNom(f.contrapart)), 'el client no és un nom propi');
    assert.ok(!r.nifsPropis.includes(normalitzaNif(f.nif)), 'el NIF del client no és propi');
  }
  /* R3T-01: la porta que no depén de nomsPropis. La marca de l'emissor ix al text de les factures emeses a
     altres clients (amb un altre NIF); el client de veres, no. */
  const emeses = await emesesDeLaSerie();
  let contrastades = 0;
  let controls = 0;
  for (const f of r.proposta.ingressos) {
    const altres = emeses.filter((e) => e.ruta !== f.origen?.fitxer && e.nif && e.nif !== normalitzaNif(f.nif));
    contrastades += altres.length;
    for (const e of altres) assert.ok(!ixAlText(e.text, f.contrapart), 'el client d’un ingrés no ix a les factures emeses a altres clients');
    /* Control: el que la capçalera porta enganxat a l'etiqueta del client sí que ix a les altres (és la marca):
       la porta hauria fallat amb el defecte original. */
    const propia = emeses.find((e) => e.ruta === f.origen?.fitxer);
    const enganxat = darrereEtiquetaClient(propia?.text);
    if (enganxat && altres.length > 0 && normalitzaNom(enganxat) !== normalitzaNom(f.contrapart)) {
      controls += 1;
      assert.ok(altres.some((e) => ixAlText(e.text, enganxat)), 'control: el valor enganxat a l’etiqueta del client és la marca');
    }
  }
  assert.ok(contrastades > 0, 'hi ha factures emeses a altres clients per a contrastar el client');
  console.log(`\n# G3T-03: ${contrastades} contrastos amb factures emeses a altres clients; ${controls} controls de la marca`);
});

/* G3T-R01: el text identifica el proveïdor de veres si en porta el NIF o el domini, o si el nom del fitxer és seu;
   unes paraules del concepte no hi basten. */
const CATALEG_FORT = /^catàleg: (?:.*, )?(?:nif:|domini:|fitxer(?:,|$))/;

test('cap factura d’un proveïdor del catàleg ben identificat (pel text) queda amb SENTIT_DESCONEGUT (G3T-14)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const delCataleg = r.documents.filter((d) => d.ambit === 'trimestre' && d.tipus === 'factura' && CATALEG_FORT.test(d.fragments?.contrapart ?? ''));
  assert.ok(delCataleg.length > 0, 'hi ha factures del catàleg identificades pel text');
  for (const d of delCataleg) assert.ok(!d.avisos.some((a) => a.codi === 'SENTIT_DESCONEGUT'), 'sap que és una factura rebuda');
});

test('les còpies pel nom fusionades són a les excloses, restaurables, i no al full (G3T-02)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const delFull = new Set(totesDe(r.proposta).map((f) => f.id));
  for (const d of r.documents.filter((x) => x.copiaDe && x.facturaId)) {
    assert.ok(!delFull.has(d.facturaId), 'la còpia no és al full');
    assert.ok(r.excloses.some((f) => f.id === d.facturaId && f.origen?.fitxer === d.ruta), 'la còpia es pot tornar a la proposta');
  }
});

test('cada despesa d’una empresa d’un altre país (pel NIF-IVA) porta IVA_ESTRANGER (omissió de la refutació)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  for (const f of r.proposta.despeses) {
    const pais = paisDelNif(f.nif);
    if (!pais || pais === 'ES' || !Number.isSafeInteger(f.iva) || r.nifsPropis.includes(normalitzaNif(f.nif))) continue;
    assert.ok(incidenciesDe(r, f).some((i) => i.codi === 'IVA_ESTRANGER' && i.pais === pais), 'l’IVA estranger el decidix la gestoria');
  }
});

test('dues despeses del mateix proveïdor, dia i import amb números diferents porten POSSIBLE_DOBLE_COBRAMENT (omissió de la refutació)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const grups = new Map();
  for (const f of r.proposta.despeses) {
    if (!esDataValida(f.data) || !Number.isSafeInteger(f.total) || f.total === 0 || !f.num || !normalitzaNom(f.contrapart)) continue;
    const clau = `${normalitzaNom(f.contrapart)}|${formatData(f.data)}|${f.total}`;
    grups.set(clau, [...(grups.get(clau) ?? []), f]);
  }
  for (const grup of grups.values()) {
    if (new Set(grup.map((f) => pelat(f.num))).size < 2) continue;
    assert.ok(grup.some((f) => incidenciesDe(r, f).some((i) => i.codi === 'POSSIBLE_DOBLE_COBRAMENT')), 'el doble cobrament possible té l’indici');
  }
});

test('el full (CSV i XLSX) es genera de la proposta i els totals són la suma de les files', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const e = await generaEntregables({ proposta: r.proposta });
  for (const bloc of ['ingressos', 'despeses']) {
    const files = e.full.files.filter((f) => f.bloc === bloc);
    assert.equal(files.filter((f) => f.rol === 'dada').length, r.proposta[bloc].length, `una fila per factura (${bloc})`);
    const fila = files.find((f) => f.rol === 'totals');
    const esperat = totals(r.proposta[bloc]);
    const importsFila = fila.celles.filter((c) => c?.tipus === 'import').map((c) => c.valor);
    assert.deepEqual(importsFila, [esperat.subtotal, esperat.iva, esperat.total].slice(0, importsFila.length), `totals (${bloc})`);
    if (!esperat.incomplet) assert.ok(Math.abs(esperat.subtotal + esperat.iva - esperat.total) <= r.proposta[bloc].length, 'base + IVA ≈ total del bloc');
  }
  assert.ok(e.xlsx.dades.length > 0 && e.csv.dades.length > 0);
  assert.match(e.empremtes.xlsx, /^[0-9a-f]{64}$/);
  console.log(`\n# Full generat: ${e.full.files.filter((f) => f.rol === 'dada').length} files de dades; totals incomplets: `
    + `${['ingressos', 'despeses'].map((b) => `${b}=${totals(r.proposta[b]).incomplet}`).join(', ')}`);
});

/* Els rebuts en PDF del trimestre (sense les còpies), amb el text, i el que en diu R6 de la conciliació. */
let lecturaRebuts = null;
function rebutsAmbR6() {
  lecturaRebuts ??= (async () => {
    const { r } = await analisi();
    const rebuts = [];
    for (const d of r.documents.filter((x) => x.ambit === 'trimestre' && x.tipus === 'rebut' && !x.copiaDe && /\.pdf$/i.test(x.ruta))) {
      const pdf = await extreuTextPdf(new Uint8Array(readFileSync(path.join(FACTURACIO, ...d.ruta.split('/')))), { inflate: inflateNode });
      rebuts.push({ ruta: d.ruta, text: pdf.text, document: d });
    }
    const c = concilia({ moviments: [], factures: totesDe(r.proposta), rebuts, rang: RANG, proveidors: r.proveidors });
    const r6 = c.parelles.filter((p) => p.regla === 'R6');
    const citats = new Set(r6.flatMap((p) => p.rebuts.map((x) => x.ruta)));
    return { r, rebuts, c, r6, orfes: rebuts.filter((x) => !citats.has(x.ruta)) };
  })();
  return lecturaRebuts;
}

test('cada rebut del trimestre cita una factura del full (no basta el mateix import)', {
  skip: SALTA,
  todo: 'G3T-04: el producte ja casa pel número citat (vegeu la porta següent). Queda orfe el justificant de la transferència, '
    + 'que no cita cap número i paga l’IVA de dues factures alhora. L’auditoria ja l’explica com a PAGAMENT_AGRUPAT (info, R3T-03), '
    + 'però R6 de la conciliació, que encara no és al producte, no casa pagaments agrupats'
}, async () => {
  const { c, orfes } = await rebutsAmbR6();
  /* El número de factura que cita cada rebut, tal com el dona el text del PDF (amb o sense guió). */
  const citaDe = (text) => tall((text.match(/invoice\s+(?:number|no\.?|#)\s*[A-Z0-9]+(?:[\s-]+\d+)?/gi) ?? []).join(' · '), 70);
  imprimix('Rebuts que no citen cap factura del full', orfes.map((x) => ({ rebut: nomDe(x.ruta), cita: citaDe(x.text) })));
  imprimix('Ambigüitats dels rebuts', c.incidencies.map((i) => ({ codi: i.codi, missatge: tall(i.missatge, 120) })));
  assert.equal(orfes.length, 0, `${orfes.length} rebuts sense la seua factura al full`);
});

test('cap rebut amaga una factura absent: el número que cita casa amb el full o porta REBUT_SENSE_FACTURA alta (G3T-04)', { skip: SALTA }, async () => {
  const { r, rebuts, r6, orfes } = await rebutsAmbR6();
  /* Una cita pot ser d'una factura del full o d'una d'un altre trimestre (l'historial i els números ja vistos). */
  const delFull = new Set([
    ...totesDe(r.proposta).map((f) => f.num), ...r.historial.map((f) => f.num), ...r.proveidors.flatMap((p) => p.numerosVistos ?? [])
  ].map(pelat).filter(Boolean));
  /* Com casaAmbCita: també pel final del nom del fitxer de la factura, si la cita té 5 caràcters o més. */
  const pelFitxer = (cita) => pelat(cita).length >= 5
    && totesDe(r.proposta).some((f) => pelat(nomDe(f.origen?.fitxer).replace(/\.[a-z0-9]+$/i, '')).endsWith(pelat(cita)));
  const avisDe = (ruta) => ambCodi(r, 'REBUT_SENSE_FACTURA').filter((i) => i.fitxer === ruta);
  for (const { ruta, document: d } of rebuts) {
    if (!d.numeroCitat) continue;
    /* El número que llig el tractor és el que cita R6, i és al full; si no, l'avís alt el nomena. */
    const parella = r6.find((p) => p.rebuts.some((x) => x.ruta === ruta));
    if (parella) assert.ok(parella.factures.some((f) => pelat(f.num) === pelat(d.numeroCitat)), 'R6 i el tractor llegixen la mateixa cita');
    if (!delFull.has(pelat(d.numeroCitat)) && !pelFitxer(d.numeroCitat)) {
      assert.ok(avisDe(ruta).some((i) => i.severitat === 'alta' && pelat(i.numero) === pelat(d.numeroCitat)), 'una cita absent porta l’avís alt');
    }
  }
  /* Un rebut que R6 no pot casar no queda en silenci: porta REBUT_SENSE_FACTURA o, si paga alhora dues o més
     factures del full, PAGAMENT_AGRUPAT amb els seus números (R3T-03). */
  const delaProposta = new Set(totesDe(r.proposta).map((f) => pelat(f.num)).filter(Boolean));
  for (const { ruta } of orfes) {
    const agrupats = ambCodi(r, 'PAGAMENT_AGRUPAT').filter((i) => i.fitxer === ruta);
    assert.ok(avisDe(ruta).length > 0 || agrupats.length > 0, 'un rebut orfe porta REBUT_SENSE_FACTURA o PAGAMENT_AGRUPAT');
    for (const i of agrupats) {
      assert.ok(i.numeros.length >= 2 && i.numeros.every((n) => delaProposta.has(pelat(n))), 'un pagament agrupat nomena factures de la proposta');
    }
  }
});

/* Els números que falten dins d'una sèrie densa (prefix + comptador): pel número llegit o pel nom del fitxer.
   Una sèrie és densa si el rang no passa de tres vegades els números vistos (no la numeració global d'una gran
   empresa). Com l'auditoria (G3T-R07): la d'un proveïdor necessita tres números vistos; la sèrie emesa, dos. */
const MIN_VISTOS_PROVEIDOR = 3;
function foratsDe(etiquetes, minimVistos = 2) {
  const series = new Map();
  for (const { qui, text } of etiquetes) {
    const m = /^(.*?[^\d])(\d+)$/.exec(String(text ?? '').trim());
    if (!m) continue;
    const clau = `${qui}|${m[1]}`;
    series.set(clau, [...(series.get(clau) ?? []), { n: Number(m[2]), amplada: m[2].length, prefix: m[1] }]);
  }
  const forats = [];
  for (const [clau, numeros] of series) {
    const vistos = new Set(numeros.map((x) => x.n));
    if (vistos.size < minimVistos) continue;
    const [min, max] = [Math.min(...vistos), Math.max(...vistos)];
    if (max - min + 1 > 3 * vistos.size) continue;
    for (let n = min + 1; n < max; n += 1) {
      if (!vistos.has(n)) forats.push({ qui: clau.split('|')[0], numero: `${numeros[0].prefix}${String(n).padStart(numeros[0].amplada, '0')}` });
    }
  }
  return forats;
}

const foratsDelTrimestre = (r) => ({
  perNumero: foratsDe(r.proposta.despeses.map((f) => ({ qui: normalitzaNom(f.contrapart), text: f.num })), MIN_VISTOS_PROVEIDOR),
  perFitxer: foratsDe(r.proposta.despeses.map((f) => ({ qui: 'fitxer', text: nomDe(f.origen?.fitxer).replace(/\.[a-z0-9]+$/i, '') })),
    MIN_VISTOS_PROVEIDOR)
});

test('les sèries de cada proveïdor no tenen forats dins del trimestre (pel número llegit)', {
  skip: SALTA,
  todo: 'G3T-05: el producte ja avisa de cada forat amb FORAT_NUMERACIO (vegeu la porta següent). La prova continua roja perquè '
    + 'a la carpeta falta de veres una factura de la sèrie: passarà quan el Mestre l’afija o confirme que és anul·lada'
}, async () => {
  const { r } = await analisi();
  const { perNumero, perFitxer } = foratsDelTrimestre(r);
  imprimix('Forats de numeració (pel número llegit)', perNumero);
  imprimix('Forats de numeració (pel nom del fitxer)', perFitxer);
  assert.equal(perNumero.length + perFitxer.length, 0, `${perNumero.length + perFitxer.length} números de factura que falten entre dos de presents`);
});

test('cada forat d’una sèrie de proveïdor té el seu FORAT_NUMERACIO, pel número o pel nom del fitxer (G3T-05)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const { perNumero, perFitxer } = foratsDelTrimestre(r);
  const avisats = ambCodi(r, 'FORAT_NUMERACIO').flatMap((i) => i.numeros ?? []).map(pelat);
  for (const { numero } of perNumero) assert.ok(avisats.includes(pelat(numero)), 'el forat pel número llegit té l’avís');
  for (const { numero } of perFitxer) assert.ok(avisats.some((a) => pelat(numero).endsWith(a)), 'el forat pel nom del fitxer té l’avís');
});

test('la sèrie emesa és correlativa amb l’historial: cada forat porta FORAT_NUMERACIO (omissió de la refutació)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const emeses = (llista) => llista.filter((f) => f.tipus === 'ingres' && f.num);
  const delTrimestre = emeses(r.proposta.ingressos);
  if (delTrimestre.length === 0) return;
  /* Com l'auditoria: des de l'últim número de l'historial anterior al primer del trimestre fins a l'últim del trimestre. */
  const comptador = (f) => Number(/(\d+)$/.exec(String(f.num).trim())?.[1] ?? Number.NaN);
  const primer = Math.min(...delTrimestre.map(comptador));
  const abans = emeses(r.historial).filter((f) => comptador(f) < primer);
  const ultimAbans = abans.length ? [abans.reduce((x, y) => (comptador(y) > comptador(x) ? y : x))] : [];
  const forats = foratsDe([...ultimAbans, ...delTrimestre].map((f) => ({ qui: 'emesa', text: f.num })));
  const avisats = ambCodi(r, 'FORAT_NUMERACIO').filter((i) => !i.proveidor).flatMap((i) => i.numeros ?? []).map(pelat);
  imprimix('Forats de la sèrie emesa', forats);
  for (const { numero } of forats) assert.ok(avisats.includes(pelat(numero)), 'el forat de la sèrie emesa té l’avís');
});

test('el número de factura es llig sencer: cap número del full és només un prefix compartit per factures diferents (G3T-06)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const perNum = new Map();
  for (const f of totesDe(r.proposta)) {
    const clau = clauDuplicat(f);
    if (!clau.split('|')[1]) continue;
    perNum.set(clau, [...(perNum.get(clau) ?? []), f]);
  }
  /* El mateix número en factures amb totals o dates diferents no és un duplicat: és un número mal llegit. */
  const truncats = [...perNum.values()].filter((g) => g.length > 1
    && new Set(g.map((f) => `${formatData(f.data)}|${f.total}`)).size > 1);
  assert.equal(truncats.length, 0, `${truncats.length} números compartits per factures diferents`);
});

test('conciliació amb la Norma 43: parelles coherents i diagnòstic del que només diu el banc', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const c43 = readdirSync(path.join(FACTURACIO, CARPETA_T)).filter((n) => /\.txt$/i.test(n) && /c43/i.test(n)).sort()[0];
  assert.ok(c43, 'hi ha l’extracte Norma 43 a la carpeta del trimestre');
  const lectura = llegeixC43(new Uint8Array(readFileSync(path.join(FACTURACIO, CARPETA_T, c43))));
  const moviments = totsElsMoviments(lectura);
  const factures = totesDe(r.proposta);
  const c = concilia({ moviments, factures, rebuts: [], rang: RANG, proveidors: r.proveidors });

  /* Invariants: cada moviment i cada factura, com a molt en una parella amb moviments. */
  const ambMoviments = c.parelles.filter((p) => p.moviments.length > 0);
  const movimentsUsats = ambMoviments.flatMap((p) => p.moviments);
  assert.equal(new Set(movimentsUsats).size, movimentsUsats.length, 'cap moviment en dues parelles');
  const facturesUsades = ambMoviments.flatMap((p) => p.factures);
  assert.equal(new Set(facturesUsades).size, facturesUsades.length, 'cap factura pagada dues vegades');
  for (const p of ambMoviments.filter((x) => x.confianca === 'alta' && ['R1', 'R2', 'R3'].includes(x.regla))) {
    assert.equal(p.diferencia, 0, `una parella ${p.regla} d’alta confiança quadra al cèntim`);
  }

  const delTrimestre = filtraTrimestre(moviments, ANY, T);
  const perRegla = {};
  for (const p of c.parelles) perRegla[p.regla] = (perRegla[p.regla] ?? 0) + 1;
  console.log(`\n# Conciliació: ${moviments.length} moviments (${delTrimestre.length} del ${T}T), ${factures.length} factures; `
    + `parelles ${JSON.stringify(perRegla)}; ${c.facturesSensePagament.length} factures sense pagament; `
    + `${c.movimentsSenseFactura.length} moviments del ${T}T sense factura; ${c.incidencies.length} incidències`);
  const parellaDe = new Map();
  for (const p of c.parelles) for (const f of p.factures) parellaDe.set(f, p);
  imprimix('Factures del full i el seu pagament', factures.map((f) => {
    const p = parellaDe.get(f);
    return {
      fitxer: tall(nomDe(f.origen?.fitxer), 40), data: formatData(f.data), total: imp(f.total), moneda: f.moneda ?? '',
      regla: p?.regla ?? '—', conf: p?.confianca ?? '', pagament: p?.moviments.map((m) => `${formatData(m.dataOperacio)} ${imp(m.centims)}`).join(' + ') ?? '',
      comissio: p?.comissio ? imp(p.comissio) : '', canvi: p?.tipusCanvi ?? ''
    };
  }));
  imprimix(`Moviments del ${T}T sense factura`, c.movimentsSenseFactura.map((m) => ({
    data: formatData(m.dataOperacio), import: imp(m.centims), cc: m.conceptComu, divisa: m.divisa ? `${m.divisa.moneda ?? m.divisa.codi} ${imp(m.divisa.centims)}` : '',
    creditor: tall(m.sepa?.creditor ?? '', 24), concepte: tall(textDelsConceptes(m), 70)
  })));
  imprimix('Incidències de la conciliació', c.incidencies.map((i) => ({ codi: i.codi, severitat: i.severitat, missatge: tall(i.missatge, 140) })));
});

test('cada ingrés del trimestre amb un cobrament exacte al banc (fins a 60 dies després) queda conciliat (G3T-08)', { skip: SALTA }, async () => {
  const { r } = await analisi();
  const c43 = readdirSync(path.join(FACTURACIO, CARPETA_T)).filter((n) => /\.txt$/i.test(n) && /c43/i.test(n)).sort()[0];
  const moviments = totsElsMoviments(llegeixC43(new Uint8Array(readFileSync(path.join(FACTURACIO, CARPETA_T, c43)))));
  const c = concilia({ moviments, factures: totesDe(r.proposta), rebuts: [], rang: RANG, proveidors: r.proveidors });
  const pagades = new Set(c.parelles.filter((p) => p.moviments.length > 0).flatMap((p) => p.factures));
  const mesDies = (d, n) => {
    const x = new Date(Date.UTC(d.a, d.m - 1, d.d + n));
    return { a: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() };
  };
  const senseCobrament = r.proposta.ingressos.filter((f) => !pagades.has(f) && Number.isSafeInteger(f.total) && esDataValida(f.data)
    && moviments.some((m) => m.centims === f.total && esDataValida(m.dataOperacio)
      && dinsDeRang(m.dataOperacio, { inici: f.data, fi: mesDies(f.data, 60) })));
  assert.equal(senseCobrament.length, 0, `${senseCobrament.length} ingressos amb cobrament exacte i sense parella`);
});

/* L'empremta que el panell de Tractors ha de mostrar ara mateix, calculada amb el nucli des del disc
   (mateixa normalització que Vite). Si no és la que el Mestre va aprovar, la Gestoria demanarà tornar a signar. */
test('empremta actual dels dos tractors de la Gestoria (només consola)', { skip: SALTA }, async () => {
  for (const manifest of [TRACTOR_FACTURES, TRACTOR_CORREUS]) {
    const llig = (ruta) => readFileSync(path.join(ARREL, ...ruta.split('/')), 'utf8');
    const empremta = await calculaEmpremta({
      manifest, fitxa: llig(manifest.fitxa), fonts: manifest.fonts.map((ruta) => ({ ruta, contingut: llig(ruta) }))
    });
    assert.match(empremta, /^sha256:[0-9a-f]{64}$/);
    console.log(`# Empremta curta de «${manifest.id}»: ${empremtaCurta(empremta)}`);
  }
});

test('el descompressor del navegador (DecompressionStream) dona la mateixa proposta que node:zlib', { skip: SALTA }, async () => {
  const { r, aprovacio } = await analisi();
  const { font } = fontDeDisc(FACTURACIO);
  const navegador = await executaTractorFactures({ font, any: ANY, t: T, aprovacio, inflate: inflateDisponible(globalThis), avui: avuiDe(new Date()) });
  const firma = (p) => totesDe(p).map((f) => `${f.tipus}|${f.origen?.fitxer}|${f.total}|${f.estat}`).sort();
  assert.deepEqual(firma(navegador.proposta), firma(r.proposta));
});
