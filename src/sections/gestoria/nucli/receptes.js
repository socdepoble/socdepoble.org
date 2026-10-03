/**
 * receptes.js — els camps d'una factura a partir del seu text.
 *
 * Receptes, no màgia: cada camp es busca darrere d'una etiqueta coneguda (en
 * castellà, valencià/català i anglés) i, si la línia no porta el valor, a la
 * línia següent (taules amb la capçalera damunt). Una taula només es llig per
 * posició si la capçalera té tantes columnes com valors la línia de davall:
 * hi compten la columna del tipus i les paraules sense etiqueta («CUOTA»), i
 * un percentatge mai és un import. Els imports es trien en bloc: guanya la
 * terna subtotal + IVA (- IRPF) = total que quadra, i la retenció d'IRPF
 * s'exposa en positiu com a camp propi. Una terna amb l'IVA més gran que la
 * base no té mai confiança alta. Cada camp porta la seua confiança i el
 * fragment on s'ha trobat, perquè la persona ho puga revisar. El text arriba
 * de pdfText.js o d'un correu.
 *
 * MONEDA. Si els imports triats porten una moneda que no és l'euro ($, US$,
 * USD, £, GBP, CHF, ¥, JPY…, davant o darrere, o dita a la mateixa línia), o
 * si cap no en du i el text en diu una altra, el
 * resultat porta `moneda` (codi ISO 4217) i els imports, confiança baixa: el
 * full va en euros i l'import s'ha de convertir.
 *
 * MILERS AMB ESPAI. «1 020,46» és un sol import si el document no agrupa els
 * milers amb punt o coma enlloc; si ho fa, l'espai separa columnes.
 *
 * NÚMERO PARTIT (G3T-06). «QX7K 0001» és un sol número si la segona fitxa és
 * de xifres (3 o més), no enceta cap data ni cap import i, a més, el nom del
 * fitxer ho confirma, comença per 0 o és l'última fitxa (un codi postal o un
 * telèfon darrere del número no s'hi ajunta); porta el guió si el nom del
 * fitxer diu «QX7K-0001» i l'espai si no. Un guionet discrecional
 * (U+00AD) no es convertix mai en guió.
 *
 * SUBVENCIONS (G3T-11). L'import subvencionat («Importe subvencionado»,
 * «Subvenció», «A deducir») no és cap import de la factura. Si el document
 * en porta un, «Importe/Total a pagar» és el que queda després de restar-lo
 * i tampoc no és el total: es calcula de la base i l'IVA si no n'hi ha cap
 * altre. La paraula sola no hi basta: l'etiqueta ha de portar un import
 * darrere o encapçalar una taula, i un concepte com «Gestión de subvenciones»
 * no canvia res. Una taula de resum amb les últimes columnes buides (el
 * recàrrec) es llig per ordre només si la quota és el tipus de la base o la
 * terna quadra.
 *
 * ABONAMENTS. Un document que es presenta com a abonament («Credit note»,
 * «Nota de crèdit», «Factura de abono»…) i porta els imports en positiu els
 * dona en negatiu, amb confiança mitjana i `abonament: true`. Una
 * rectificativa o un «Total a abonar» també, però amb confiança baixa: una
 * rectificativa pot corregir a l'alça i «abonar» també vol dir «pagar».
 * JS pur: sense DOM ni React.
 */
import { CATALEG_PROVEIDORS, nifsDelProveidor } from './cataleg.js';
import { parseData } from './dates.js';
import { parseImport } from './diners.js';
import { TIPUS_IRPF_HABITUALS, normalitzaNom } from './model.js';
import { normalitzaNif, validaNif } from './nif.js';

/* Punts mínims perquè detectaProveidor done un proveïdor per bo. */
const LLINDAR_PROVEIDOR = 25;
/* Punts a partir dels quals el nom del catàleg té confiança alta (NIF o fitxer + text). */
const PROVEIDOR_SEGUR = 50;
const MAX_FRAGMENT = 200;
const MAX_CANDIDATS = 20;
const COMBINANTS = /\p{M}/gu;
/* Qualsevol blanc (tabulador, espai dur, espai prim…) val com un espai. */
const ESPAIS = /\s/g;

/* Text en minúscules i sense diacrítics, caràcter a caràcter: els índexs
   del text plegat coincidixen amb els de l'original. */
function plega(text) {
  let r = '';
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const p = c.normalize('NFD').replace(COMBINANTS, '').toLowerCase();
    r += p.length === 1 ? p : c;
  }
  return r;
}

const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lletres = (text) => (String(text).match(/\p{L}/gu) ?? []).length;

function retalla(text) {
  const t = String(text ?? '').trim();
  return t.length > MAX_FRAGMENT ? `${t.slice(0, MAX_FRAGMENT - 1)}…` : t;
}

/* ── Monedes ───────────────────────────────────────────────────────────── */

/* Símbols de monedes que no són l'euro, amb el seu codi ISO 4217; els compostos primer. */
const SIMBOLS_MONEDA = Object.freeze([
  ['US$', 'USD'], ['CA$', 'CAD'], ['AU$', 'AUD'], ['NZ$', 'NZD'], ['MX$', 'MXN'], ['HK$', 'HKD'], ['CN¥', 'CNY'], ['JP¥', 'JPY'],
  ['C$', 'CAD'], ['A$', 'AUD'], ['S$', 'SGD'], ['R$', 'BRL'], ['$', 'USD'], ['£', 'GBP'], ['¥', 'JPY'], ['₹', 'INR']
]);
/* Codis d'altres monedes, només en majúscules (en minúscules, alguns són paraules). */
const CODIS_MONEDA = Object.freeze([
  'USD', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD', 'NZD', 'MXN', 'BRL', 'HKD', 'SGD', 'INR', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'ZAR'
]);
const ALT_SIMBOLS = SIMBOLS_MONEDA.map(([simbol]) => escapa(simbol)).join('|');
const ALT_CODIS = CODIS_MONEDA.join('|');
const ALTRA_DAVANT = new RegExp(`(?:${ALT_SIMBOLS}|\\b(?:${ALT_CODIS}))\\s?$`);
const ALTRA_DARRERE = new RegExp(`^\\s?(?:${ALT_SIMBOLS}|(?:${ALT_CODIS})(?![A-Za-z]))`);
const ALTRA_AL_TEXT = new RegExp(`${ALT_SIMBOLS}|\\b(?:${ALT_CODIS})\\b`);
const CODI_DE_SIMBOL = new Map(SIMBOLS_MONEDA);

const codiMoneda = (trobat) => {
  const net = trobat.trim();
  return CODI_DE_SIMBOL.get(net) ?? net;
};

/* La primera moneda que no és l'euro que diu un text, o null. */
function monedaDeText(text) {
  const m = ALTRA_AL_TEXT.exec(text);
  return m ? codiMoneda(m[0]) : null;
}

/* ── Etiquetes ─────────────────────────────────────────────────────────── */

/* G3T-11: l'import subvencionat (Kit Digital) no és cap import de la factura. «Kit digital» no hi va: tallaria
   el concepte. Només compta (i talla) si porta un import darrere o encapçala una taula: «Gestión de
   subvenciones» és un concepte (vegeu marcaSubvencions). */
const SUBVENCIO = String.raw`(?:(?:importe|import|total)\s+)?subvenciona(?:d[oa]|t)|subvencio(?:n(?:es)?|ns)?`;
/* Amb una subvenció, «(Importe|Total) a pagar» és el que queda després de restar-la: no és el total. */
const A_PAGAR = /^(?:(?:importe|import|total)\s+){0,2}a\s+pagar(?![a-z])/;

/* [camp, especificitat, patró sobre el text plegat]. Dins d'una línia guanya
   la coincidència més llarga, i 'ignora' talla els segments sense donar res:
   així «Fecha de vencimiento» no passa per data ni «IVA incluido» per IVA. */
const ETIQUETES = [
  ['num', 2, String.raw`(?:numero|num\.?|n\.?\s?[º°o]\.?)\s*(?:de\s+|del\s+)?(?:la\s+)?(?:factura|fra\.?)`],
  ['num', 2, String.raw`(?:factura|fra\.?)\s*(?:numero|num\.?|n\.?\s?[º°o]\.?)`],
  ['num', 2, String.raw`invoice\s*(?:number|num\.?|no\.?|n[º°]|#|id)`],
  ['num', 1, String.raw`(?:receipt|document|bill)\s*(?:number|no\.?|#)|numero|num\.|n\.?\s?[º°]`],
  ['data', 2, String.raw`(?:fecha|data)\s+(?:de\s+|del\s+|d['’])?(?:la\s+)?(?:factura|fra\.?|emision|emissio|expedicion|expedicio)|invoice\s+date|date\s+of\s+issue|issue\s+date|date\s+issued|billing\s+date`],
  ['data', 1, String.raw`date\s+paid|fecha|data|date`],
  ['subtotal', 2, String.raw`base\s+(?:imponible|imposable)|total\s+(?:excluding|excl\.?|without|before|sin|sense)\s+(?:tax|vat|iva|impuestos|impostos)|(?:importe|import)\s+net[oa]?|net\s+(?:amount|total)|total\s+net[oa]?|amount\s+excluding\s+(?:tax|vat)`],
  ['subtotal', 1, String.raw`subtotal|sub-total|base(?:\s+imp\.?)?`],
  ['iva', 2, String.raw`(?:cuota|quota|importe|import|total)\s+(?:de\s+|del\s+|d['’])?(?:iva|i\.v\.a\.?)|vat\s+amount|tax\s+amount|total\s+(?:tax|vat)`],
  ['iva', 1, String.raw`i\.v\.a\.?|iva|vat|tax|impuestos|impostos`],
  ['tipus', 0, String.raw`(?:%|tipo|tipus|type|rate)\s*(?:de\s+|d['’])?(?:iva|i\.v\.a\.?|vat|tax)|(?:vat|tax|iva)\s+(?:rate|%)|iva\s*%`],
  ['irpf', 1, String.raw`(?:retenciones|retencions|retencion|retencio)(?:\s+(?:de\s+|del\s+|d['’])?(?:irpf|i\.r\.p\.f\.?))?|irpf|i\.r\.p\.f\.?|withholding(?:\s+tax)?`],
  ['total', 2, String.raw`total\s+\(?(?:iva|i\.v\.a\.?|impuestos|impostos|vat|tax)\s+(?:incluido|inclos|inclosa|included|incl\.?)\)?|total\s+(?:de\s+(?:la\s+)?)?factura|(?:importe|import)\s+total|total\s+a\s+(?:pagar|abonar|cobrar)|total\s+\(?eur\)?|total\s+(?:amount|due|en\s+eur|in\s+eur)|invoice\s+total|grand\s+total|total\s+(?:importe|import)`],
  ['total', 1, String.raw`amount\s+due|amount\s+paid|total|importe|import`],
  ['descripcio', 1, String.raw`concepto|concepte|descripcion|descripcio|description|detalle|detall`],
  ['client', 1, String.raw`datos\s+del\s+cliente|dades\s+del\s+client|bill(?:ed)?\s+to|facturar\s+a|cliente|client|customer|destinatario|destinatari`],
  ['emissor', 1, String.raw`proveedor|proveidor|emisor|emissor|vendor|seller|supplier|from(?=\s*:)`],
  ['ignora', 0, [
    String.raw`(?:fecha|data)\s+(?:de\s+|del\s+|d['’])?(?:vencimiento|venciment|vto\.?|pago|pagament|cargo|carrec|operacion|operacio|entrega|alta|baja|baixa|inicio|inici|fin|final|nacimiento|naixement|caducidad|caducitat|lectura)`,
    String.raw`vencimiento|venciment|vto\.|(?:due|payment)\s+date|date\s+due|due\s+(?:on|by)`,
    String.raw`periodo(?:\s+de\s+facturacion)?|periode(?:\s+de\s+facturacio)?|billing\s+period|period`,
    String.raw`nif[\s-]*iva|n\.\s?i\.\s?f\.?|c\.\s?i\.\s?f\.?|nif|cif|dni|nie`,
    String.raw`vat\s*(?:number|no\.?|id|reg(?:istration)?(?:\s+(?:number|no\.?))?)|tax\s*(?:id|number|no\.?|code)|iva\s+intracomunitari[oa]?`,
    String.raw`(?:iva|vat|i\.v\.a\.?)\s+(?:incluido|inclos|inclosa|included|incl\.?)`,
    /* «Base de retención»: és la base, no la retenció. */
    String.raw`base\s+(?:de\s+|d['’])?(?:la\s+)?(?:retencion|retencio|irpf|i\.r\.p\.f\.?)(?:\s+(?:de\s+|d['’])?irpf)?`,
    String.raw`(?:numero|num\.?|n\.?\s?[º°o]\.?)\s*(?:de\s+|del\s+)?(?:cliente|client|pedido|comanda|contrato|contracte|cuenta|compte|abonado|abonat|socio|soci|referencia|poliza|polissa|contador|comptador|cups|albaran|albara|order|customer|account)`,
    String.raw`(?:customer|client|account|order)\s*(?:number|no\.?|id|#)`
  ].join('|')],
  /* Passa a 'ignora' o desapareix segons el que la seguix (marcaSubvencions). */
  ['subvencio', 0, SUBVENCIO],
  /* «A deducir» també és ignora, llevat d'una línia de retenció («Retención IRPF 15% a deducir»): vegeu etiquetesDe. */
  ['deduccio', 0, String.raw`a\s+dedu(?:cir|ir)`]
];

const DEFINICIONS = ETIQUETES.map(([camp, esp, patro]) => ({
  camp,
  esp,
  re: new RegExp(`(^|[^a-z0-9])(?:${patro})(?![a-z])`, 'g')
}));

const CAMPS_IMPORT = new Set(['subtotal', 'iva', 'total', 'tipus', 'irpf']);
const CAMPS_TEXT = new Set(['descripcio', 'client', 'emissor']);
/* Paraules de capçalera de taula: una «Descripción» seguida només d'aquestes no és un concepte. */
const CAPCALERA_TAULA = /^(?:\s|cantidad|quantitat|qty|quantity|uds?\.?|unidades|unitats|precio|preu|price|unit(?:ari[oa])?|unitario|importe|import|amount|total|iva|vat|dto\.?|descuento|descompte|discount|%)*$/;

/* Etiquetes d'una línia plegada, sense solapar-se. */
function etiquetesDe(plec) {
  const trobades = [];
  for (const def of DEFINICIONS) {
    def.re.lastIndex = 0;
    let m;
    while ((m = def.re.exec(plec)) !== null) {
      trobades.push({ camp: def.camp, esp: def.esp, inici: m.index + m[1].length, fi: m.index + m[0].length });
      if (m[0].length === 0) def.re.lastIndex += 1;
    }
  }
  trobades.sort((a, b) => a.inici - b.inici || (b.fi - b.inici) - (a.fi - a.inici));
  const acceptades = [];
  let fins = -1;
  for (const t of trobades) {
    if (t.inici >= fins) {
      acceptades.push(t);
      fins = t.fi;
    }
  }
  /* «A deducir» talla un import a descomptar; en una línia de retenció, l'import és la retenció. */
  if (acceptades.some((e) => e.camp === 'irpf')) return acceptades.filter((e) => e.camp !== 'deduccio');
  return acceptades.map((e) => (e.camp === 'deduccio' ? { ...e, camp: 'ignora' } : e));
}

function liniesDe(text) {
  const ls = String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(ESPAIS, ' ').replace(/ {2,}/g, ' ').trim())
    .filter((l) => l !== '')
    .map((orig) => {
      const plec = plega(orig);
      return { orig, plec, ets: etiquetesDe(plec) };
    });
  marcaSubvencions(ls);
  return ls;
}

/* G3T-R08: una etiqueta de subvenció és l'import subvencionat si porta un import darrere (fins a la
   següent etiqueta) o si encapçala una taula (la línia no té xifres, té alguna altra etiqueta d'import i
   la següent porta imports): llavors talla com 'ignora' i marca `subvencio`. Si no, és text d'un
   concepte («Gestión de subvenciones») i desapareix, perquè no talle res. */
function marcaSubvencions(ls) {
  ls.forEach((l, i) => {
    if (!l.ets.some((e) => e.camp === 'subvencio')) return;
    const capcalera = !/\d/.test(l.orig) && l.ets.some((e) => CAMPS_IMPORT.has(e.camp))
      && importsDe(ls[i + 1]?.orig ?? '').length > 0;
    l.ets = l.ets.flatMap((e, k) => {
      if (e.camp !== 'subvencio') return [e];
      const fi = k + 1 < l.ets.length ? l.ets[k + 1].inici : l.orig.length;
      return capcalera || importsDe(l.orig.slice(e.fi, fi)).length > 0 ? [{ ...e, camp: 'ignora', subvencio: true }] : [];
    });
  });
}

const ambValor = (l) => l.ets.some((e) => e.camp !== 'ignora');

/* ── Valors ────────────────────────────────────────────────────────────── */

const PATRONS_DATA = [
  /(^|\D)(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})(?!\d)/g,
  /(^|\D)(\d{1,2}[-/.]\d{1,2}[-/.](?:\d{4}|\d{2}))(?!\d)/g,
  /(^|[^\p{L}\p{N}])(\d{1,2}(?:st|nd|rd|th)?\s+(?:de\s+|d['’])?\p{L}{3,}\.?,?\s+(?:de\s+|del\s+)?\d{4})(?!\d)/gu,
  /(^|[^\p{L}\p{N}])(\p{L}{3,}\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})(?!\d)/gu,
  /(^|[^\p{L}\p{N}])(\d{1,2}-\p{L}{3,}\.?-(?:\d{4}|\d{2}))(?!\d)/gu
];

/* Totes les dates llegibles d'un text, per ordre i sense solapar-se. */
function datesDe(text) {
  const trobades = [];
  for (const re of PATRONS_DATA) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const data = parseData(m[2]);
      const inici = m.index + m[1].length;
      if (data) trobades.push({ data, inici, fi: inici + m[2].length });
      re.lastIndex = inici + 1;
    }
  }
  trobades.sort((a, b) => a.inici - b.inici || b.fi - a.fi);
  const netes = [];
  for (const t of trobades) if (!netes.length || t.inici >= netes[netes.length - 1].fi) netes.push(t);
  return netes;
}

const NUMERO = /\d[\d.,]*\d|\d/g;
/* Amb milers separats per espai: «1 020,46» (grups de tres xifres) va primer. */
const NUMERO_MILERS_ESPAI = /\d{1,3}(?: \d{3})+(?!\d)(?:[.,]\d{1,2}(?!\d))?|\d[\d.,]*\d|\d/g;
/* Un document que agrupa els milers amb punt o coma («1.234,56», «1,234.56», «12.345»). */
const MILERS_AMB_SIGNE = /\d[.,]\d{3}(?!\d)/;

/* Els números d'un text, en ordre: imports (amb decimals o amb moneda, i la
   moneda que porten: 'EUR', el codi d'una altra o null si no en du),
   percentatges i enters solts. Es descarten les xifres que formen part d'un
   codi, una data o un NIF, i el grup solt d'uns milers amb espai («020,46»
   de «1 020,46») quan l'espai no fa de separador de milers. */
function numerosDe(text, { milersEspai = false } = {}) {
  const trobats = [];
  const re = new RegExp((milersEspai ? NUMERO_MILERS_ESPAI : NUMERO).source, 'g');
  let m;
  while ((m = re.exec(text)) !== null) {
    const nucli = m[0];
    const inici = m.index;
    const fi = inici + nucli.length;
    const abans = text[inici - 1] ?? '';
    if (/[\p{L}\p{N}/#]/u.test(abans) || text[fi] === '/') continue;
    let signe = '';
    let davant = text.slice(0, inici);
    if (/^0\d/.test(nucli) && /\d $/.test(davant)) continue;
    if (abans === '-' || abans === '−') {
      if (/[\p{L}\p{N}]/u.test(text[inici - 2] ?? '')) continue;
      signe = '-';
      davant = davant.slice(0, -1);
    }
    const darrere = text.slice(fi);
    if (/^\s?%/.test(darrere)) {
      trobats.push({ tipus: 'percentatge', inici, fi });
      continue;
    }
    const euroDarrere = /^\s?(?:€|eur(?:os?)?(?![\p{L}]))/iu.exec(darrere);
    const altraDarrere = euroDarrere ? null : ALTRA_DARRERE.exec(darrere);
    const monedaDarrere = euroDarrere ?? altraDarrere;
    if (!monedaDarrere && /^\p{L}/u.test(darrere)) continue;
    const davantEuro = /(?:€|eur)\s?$/i.exec(davant);
    const euroDavant = davantEuro && (davantEuro[0][0] === '€' || !/\p{L}/u.test(davant[davantEuro.index - 1] ?? '')) ? davantEuro : null;
    const altraDavant = euroDavant ? null : ALTRA_DAVANT.exec(davant);
    const monedaDavant = euroDavant ?? altraDavant;
    if (monedaDavant && !signe && /[-−]\s?$/.test(davant.slice(0, monedaDavant.index))) signe = '-';
    const decimals = /[.,]\d{1,2}$/.test(nucli);
    if (!decimals && !monedaDarrere && !monedaDavant) {
      trobats.push({ tipus: 'enter', inici, fi });
      continue;
    }
    let valorImport = parseImport(`${signe}${nucli}`);
    if (valorImport === null) continue;
    const resta = monedaDavant ? davant.slice(0, monedaDavant.index) : davant;
    const despres = darrere.slice(monedaDarrere?.[0].length ?? 0);
    if (/\(\s?$/.test(resta) && /^\s?\)/.test(despres)) valorImport = -Math.abs(valorImport);
    const altra = altraDavant ?? altraDarrere;
    let moneda = null;
    if (altra) moneda = codiMoneda(altra[0]);
    else if (monedaDavant || monedaDarrere) moneda = 'EUR';
    trobats.push({ tipus: 'import', valor: valorImport, inici, fi, moneda });
  }
  return trobats;
}

const importsDe = (text, opcions) => numerosDe(text, opcions).filter((n) => n.tipus === 'import');

/* Abreviatures de mes que no fan de prefix d'un número («MAR 2026»). */
const MESOS_ABREUJATS = /^(?:ENE|GEN|JAN|FEB|MAR|ABR|APR|MAI|MAY|JUN|JUL|AGO|AUG|SEP|SET|OCT|NOV|DIC|DES|DEC)$/;

const nomBase = (nomFitxer) => String(nomFitxer ?? '').split(/[\\/]/).pop().trim();

/* G3T-06: «A B» és un sol número partit per un espai si B, la fitxa que seguix A per un sol espai, és només
   de xifres (3 o més) i no enceta cap data ni és cap import. El separador és el guió si el nom del fitxer
   porta «A-B», i l'espai si no. G3T-R05: a més, el nom del fitxer ho ha de confirmar, B ha de començar per 0
   (un comptador farcit) o B ha de ser l'última fitxa del tros: un codi postal o un telèfon que el PDF posa
   darrere del número («AB12 46870 Ontinyent», «AB12 963 123 456») no s'hi ajunta. Torna { valor, fi } o null. */
function unioPartida(text, fiA, a, nomFitxer) {
  const resta = text.slice(fiA);
  const m = /^ (\d{3,})(?![\p{L}\p{N}])/u.exec(resta);
  if (!m) return null;
  const darrere = resta.slice(m[0].length);
  if (/^(?:[.,\-/_]\d|\s?(?:%|€|eur(?!\p{L})))/iu.test(darrere)) return null;
  if (datesDe(resta.slice(1))[0]?.inici === 0) return null;
  const ambGuio = `${a}-${m[1]}`;
  const delFitxer = new RegExp(`(^|[^a-z0-9])${escapa(plega(ambGuio))}(?![a-z0-9])`).test(plega(nomBase(nomFitxer)));
  const ultima = /^[\s.,;:|)]*$/.test(darrere);
  if (!delFitxer && !m[1].startsWith('0') && !ultima) return null;
  const valor = delFitxer ? ambGuio : `${a} ${m[1]}`;
  return parseData(valor) ? null : { valor, fi: fiA + m[0].length };
}

/* Primer testimoni amb xifres que puga ser un número de factura (ni data ni import), amb la seua posició al
   text: { valor, inici, fi } o null. Un prefix només de lletres al principi («INV 0001») compta si el seguix
   el comptador. */
function testimoniNum(text, maxim = 3, { nomFitxer = '' } = {}) {
  const re = /[A-Za-z0-9][A-Za-z0-9\-/_.]*/g;
  let m;
  let vistos = 0;
  while ((m = re.exec(text)) !== null && vistos < maxim) {
    vistos += 1;
    const t = m[0].replace(/[.\-/_]+$/, '');
    const fi = m.index + m[0].length;
    if (text[fi] === ',' && /^\d/.test(text.slice(fi + 1))) continue;
    const ambXifres = /\d/.test(t);
    const prefix = vistos === 1 && /^[A-Z]{2,5}$/.test(t) && !MESOS_ABREUJATS.test(t);
    if (!(ambXifres || prefix) || t.length > 40 || parseData(t)) continue;
    const unio = t === m[0] && (prefix || /[A-Za-z]/.test(t)) ? unioPartida(text, fi, t, nomFitxer) : null;
    if (unio) return { valor: unio.valor, inici: m.index, fi: unio.fi };
    if (ambXifres) return { valor: t, inici: m.index, fi: m.index + t.length };
  }
  return null;
}

const tokenNum = (text, maxim, opcions) => testimoniNum(text, maxim, opcions)?.valor ?? '';

const netejaText = (seg) => seg.replace(/^[\s:–\-.=]+/, '').replace(/[\s:–\-|·,]+$/, '').trim();

/* El valor d'una etiqueta en el tros de línia que la seguix. Per als imports, { valor, moneda }. */
function valorDe(camp, seg, opcions) {
  if (camp === 'num') return tokenNum(seg, 3, opcions) || null;
  if (camp === 'data') return datesDe(seg)[0]?.data ?? null;
  if (CAMPS_IMPORT.has(camp)) {
    if (camp === 'tipus') return /\d/.test(seg) ? true : null;
    const imports = importsDe(seg, opcions);
    if (!imports.length) return null;
    return camp === 'subtotal' ? imports[0] : imports[imports.length - 1];
  }
  if (CAMPS_TEXT.has(camp)) {
    const t = netejaText(seg);
    if (lletres(t) < 3) return null;
    if (camp === 'descripcio' && CAPCALERA_TAULA.test(plega(t))) return null;
    return t;
  }
  return null;
}

/* Text d'una línia sense les etiquetes, per a saber si porta valors propis. */
function senseEtiquetes(l) {
  let r = '';
  let p = 0;
  for (const e of l.ets) {
    r += l.orig.slice(p, e.inici);
    p = e.fi;
  }
  return r + l.orig.slice(p);
}

/* Paraules d'una capçalera que no són cap columna: la moneda i els connectors. */
const NO_COLUMNA = /^(?:eur|euros?|de|del|la|el|en)$/;
/* Una columna sense etiqueta que diu «Cuota»: en una taula de resum, és l'IVA. */
const QUOTA = /^(?:cuota|quota)$/;
const IVA_DE_LA_QUOTA = Object.freeze({ camp: 'iva', esp: 1 });

/* Les columnes d'una capçalera de taula, en ordre: les etiquetes d'import
   (també la del tipus i la d'IRPF) i les paraules que no són de cap etiqueta. */
function columnesDe(l) {
  const columnes = l.ets.filter((e) => CAMPS_IMPORT.has(e.camp)).map((e) => ({ inici: e.inici, etiqueta: e }));
  for (const m of l.plec.matchAll(/\p{L}+/gu)) {
    const inici = m.index;
    if (m[0].length < 2 || NO_COLUMNA.test(m[0]) || l.ets.some((e) => inici >= e.inici && inici < e.fi)) continue;
    columnes.push({ inici, paraula: m[0] });
  }
  return columnes.sort((a, b) => a.inici - b.inici);
}

/* El camp d'import d'una columna: el de la seua etiqueta, l'IVA per a «Cuota» i null per a la resta. */
const campDeColumna = (col) => col.etiqueta?.camp ?? (QUOTA.test(col.paraula) ? 'iva' : null);

/* El percentatge que dona un valor de la columna del tipus: «21,00» (import), «21» o «21 %». */
const percentDe = (v, text) => (v.tipus === 'import' ? v.valor / 100 : Number(text.slice(v.inici, v.fi).replace(',', '.')));

/* Els valors casen per posició amb estes columnes i es comproven: la quota és el tipus de la base (± 1 cèntim)
   o base + quota (− retenció) = total. Les columnes amb camp d'import han de portar un import; la del tipus,
   qualsevol número, i les columnes sense camp, qualsevol cosa. */
function taulaComprovada(columnes, valors, text) {
  const llegit = {};
  for (let k = 0; k < columnes.length; k += 1) {
    const camp = campDeColumna(columnes[k]);
    const v = valors[k];
    if (camp === 'tipus') llegit.tipus ??= percentDe(v, text);
    else if (camp && v.tipus !== 'import') return false;
    else if (camp) llegit[camp] ??= v.valor;
  }
  const { subtotal: base, iva: quota, tipus, total, irpf } = llegit;
  if (!Number.isSafeInteger(base) || base === 0 || !Number.isSafeInteger(quota)) return false;
  const perTipus = Number.isFinite(tipus) && tipus > 0 && tipus < 100
    && Math.abs(Math.abs(quota) - Math.round((Math.abs(base) * tipus) / 100)) <= 1;
  const perTotal = Number.isSafeInteger(total) && quadraTerna(base, quota, Math.abs(irpf ?? 0), total);
  return perTipus || perTotal;
}

/* G3T-11: una taula de resum amb les últimes columnes buides («Base Imponible | % IVA | Importe IVA | % Rec |
   Importe Rec» ⏎ «1.000,00 21,00 210,00») té menys valors que columnes. Els valors omplin les columnes per
   ordre, des de la primera o des de la primera etiqueta d'import (les paraules de davant poden ser d'una
   altra cosa, com «Forma de Pago: Transferencia»), i només si la lectura es comprova (taulaComprovada). */
function taulaRetallada(totes, valors, text) {
  if (valors.length < 2) return [];
  const primera = totes.findIndex((col) => col.etiqueta);
  for (const inici of new Set([0, primera])) {
    const columnes = inici < 0 ? [] : totes.slice(inici, inici + valors.length);
    if (columnes.length === valors.length && taulaComprovada(columnes, valors, text)) return columnes;
  }
  return [];
}

/* Valors d'una línia de taula davall d'una capçalera d'etiquetes, per posició:
   només si hi ha tants valors com columnes (o, si no hi ha cap tipus a la
   línia, com columnes sense la del tipus), o si en falten i la lectura es
   comprova (taulaRetallada). Un percentatge o un enter no és mai un import, i
   la columna del tipus no en dona cap. */
function assignaSeguent(l, seg, i, c, opcions) {
  const fragment = `${l.orig} ⏎ ${seg.orig}`;
  const afig = (e, v, extra = {}) => c[e.camp]?.push({ valor: v, esp: e.esp, seguent: true, linia: i + 1, fragment, ...extra });
  const totes = columnesDe(l);
  const valors = numerosDe(seg.orig, opcions);
  const senseTipus = totes.filter((col) => col.etiqueta?.camp !== 'tipus');
  let columnes = [];
  if (valors.length === totes.length) columnes = totes;
  else if (valors.length === senseTipus.length && valors.every((v) => v.tipus === 'import')) columnes = senseTipus;
  else if (valors.length < totes.length) columnes = taulaRetallada(totes, valors, seg.orig);
  if (columnes.some((col) => col.etiqueta)) {
    const monedaTaula = monedaDeText(l.orig) ?? monedaDeText(seg.orig);
    columnes.forEach((col, k) => {
      const v = valors[k];
      if (v.tipus !== 'import') return;
      const extra = { moneda: v.moneda ?? monedaTaula };
      if (col.etiqueta && col.etiqueta.camp !== 'tipus') afig(col.etiqueta, v.valor, extra);
      else if (!col.etiqueta && QUOTA.test(col.paraula)) afig(IVA_DE_LA_QUOTA, v.valor, extra);
    });
  }
  const dates = datesDe(seg.orig);
  l.ets.filter((e) => e.camp === 'data').forEach((e, k) => {
    if (dates[k]) afig(e, dates[k].data);
  });
  const num = l.ets.find((e) => e.camp === 'num');
  const testimoni = num ? testimoniNum(seg.orig, 6, opcions) : null;
  if (testimoni) afig(num, testimoni.valor);
  /* G3T-03: «Número Facturar a <marca>» ⏎ «<número> <client>». El número de la columna «Número» no és del
     client: es retalla, i el client d'esta línia passa davant del text que la capçalera porta enganxat. */
  const text = testimoni ? `${seg.orig.slice(0, testimoni.inici)} ${seg.orig.slice(testimoni.fi)}`.replace(/ {2,}/g, ' ') : seg.orig;
  for (const e of l.ets.filter((x) => CAMPS_TEXT.has(x.camp))) {
    const t = e.camp === 'descripcio' ? netejaText(text.replace(/(?:\s+[-−]?(?:€\s?)?\d[\d.,]*\s?(?:€|eur|%|uds?\.?|x)?)+\s*$/i, '')) : netejaText(text);
    if (lletres(t) >= 3) afig(e, t, testimoni && e.camp !== 'descripcio' ? { preferent: true } : {});
  }
}

/* Els camps d'import que es trien en bloc (la terna i la retenció). */
const CAMPS_DINERS = new Set(['subtotal', 'iva', 'total', 'irpf']);

function recullCandidats(ls, opcions) {
  const c = { num: [], data: [], subtotal: [], iva: [], total: [], irpf: [], descripcio: [], client: [], emissor: [] };
  ls.forEach((l, i) => {
    let buida = false;
    l.ets.forEach((e, k) => {
      if (e.camp === 'ignora') return;
      if (e.camp === 'total' && opcions.ambSubvencio && A_PAGAR.test(l.plec.slice(e.inici))) return;
      const fi = k + 1 < l.ets.length ? l.ets[k + 1].inici : l.orig.length;
      const v = valorDe(e.camp, l.orig.slice(e.fi, fi), opcions);
      if (v === null) buida = true;
      else if (CAMPS_DINERS.has(e.camp)) {
        /* Sense moneda vora l'import, la que diga la línia («Total (USD) 24.20»). */
        c[e.camp].push({ valor: v.valor, moneda: v.moneda ?? monedaDeText(l.orig), esp: e.esp, seguent: false, linia: i, pos: e.inici, fragment: l.orig });
      } else if (c[e.camp]) c[e.camp].push({ valor: v, esp: e.esp, seguent: false, linia: i, pos: e.inici, fragment: l.orig });
    });
    const seg = ls[i + 1];
    if (buida && seg && !ambValor(seg) && !/\d/.test(senseEtiquetes(l))) assignaSeguent(l, seg, i, c, opcions);
  });
  for (const camp of Object.keys(c)) c[camp] = c[camp].slice(0, MAX_CANDIDATS);
  return c;
}

/* Un nom de la línia següent a una capçalera «Número … Client» (preferent) passa davant del de la mateixa línia. */
const perPrioritat = (a, b) => b.esp - a.esp || Number(Boolean(b.preferent)) - Number(Boolean(a.preferent))
  || Number(a.seguent) - Number(b.seguent) || a.linia - b.linia;
const confiancaDe = (x) => (x.esp === 2 && !x.seguent ? 'alta' : 'mitjana');

/* ── NIF ───────────────────────────────────────────────────────────────── */

const ETIQUETA_NIF = /(^|[^a-z])(?:n\.?\s?i\.?\s?f|c\.?\s?i\.?\s?f|nif|cif|dni|nie|vat|iva|tax\s*id|ust-?id|btw|tva)(?![a-z])/;

/* Identificadors fiscals vàlids del text, un per valor normalitzat. «fort» vol
   dir espanyol (amb control) o de la UE al costat d'una etiqueta fiscal. */
function nifsDe(ls) {
  const perNif = new Map();
  ls.forEach((l, linia) => {
    const etiqueta = ETIQUETA_NIF.test(l.plec);
    const tokens = [...l.orig.matchAll(/[^\s:;,()|[\]{}<>"'«»]+/g)].map((m) => ({ t: m[0].replace(/^[#.]+|[.,]+$/g, ''), inici: m.index }));
    tokens.forEach((tk, k) => {
      const opcions = [{ text: tk.t, sol: true }];
      const seg = tokens[k + 1];
      if (seg && (/^(?:ES|[A-Z])$/i.test(tk.t) || /^[A-Z0-9]$/i.test(seg.t))) opcions.push({ text: tk.t + seg.t, sol: false });
      for (const o of opcions) {
        const { valid, tipus, normalitzat } = validaNif(o.text);
        if (!valid || (tipus === 'IVA-UE' && !o.sol)) continue;
        const fort = tipus !== 'IVA-UE' || etiqueta;
        const actual = perNif.get(normalitzat);
        if (!actual) perNif.set(normalitzat, { nif: normalitzat, tipus, linia, inici: tk.inici, etiqueta, fort });
        else if (fort && !actual.fort) Object.assign(actual, { linia, inici: tk.inici, etiqueta, fort });
      }
    });
  });
  return [...perNif.values()];
}

/* ── Proveïdor ─────────────────────────────────────────────────────────── */

function ocurrencies(plec, paraula) {
  const p = plega(String(paraula ?? '').trim());
  if (!p) return 0;
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapa(p)}(?![\\p{L}\\p{N}])`, 'gu');
  return [...plec.matchAll(re)].length;
}

function conteDomini(plec, domini) {
  const re = new RegExp(`(^|[^a-z0-9.-])(?:[a-z0-9-]+\\.)*${escapa(domini.toLowerCase())}(?![a-z0-9-]|\\.[a-z0-9])`);
  return re.test(plec);
}

/**
 * El proveïdor del catàleg que millor casa amb un document. Puntua: NIF al
 * text 50, nom de fitxer 30, domini 25, número amb el format del proveïdor 25,
 * paraules (fins a 40: 25 per expressió de diverses paraules o repetida, 15 si
 * no). Per davall de 25 punts, proveidor és null però puntuacio i motius són
 * els del millor candidat.
 * @param {{ text?: string, nomFitxer?: string }} document
 * @param {object[]} [cataleg]
 * @returns {{ proveidor: object|null, puntuacio: number, motius: string[] }}
 */
export function detectaProveidor({ text = '', nomFitxer = '' } = {}, cataleg = CATALEG_PROVEIDORS) {
  const net = String(text ?? '');
  const ls = liniesDe(net);
  const plec = ls.map((l) => l.plec).join('\n');
  const nifs = new Set(nifsDe(ls).map((n) => n.nif));
  const base = String(nomFitxer ?? '').split(/[\\/]/).pop().trim();
  let millor = { proveidor: null, puntuacio: 0, motius: [] };
  for (const p of cataleg ?? []) {
    let punts = 0;
    const motius = [];
    /* G3T-12: el NIF principal o el d'una altra societat del grup (nifsAlternatius). */
    const nif = nifsDelProveidor(p).find((n) => nifs.has(n));
    if (nif) {
      punts += 50;
      motius.push(`nif:${nif}`);
    }
    if (base && (p.patronsFitxer ?? []).some((re) => new RegExp(re.source, re.flags.replace(/[gy]/g, '')).test(base))) {
      punts += 30;
      motius.push('fitxer');
    }
    const domini = (p.dominis ?? []).find((d) => conteDomini(plec, d));
    if (domini) {
      punts += 25;
      motius.push(`domini:${domini}`);
    }
    if ((p.patronsNum ?? []).some((re) => new RegExp(re.source, re.flags.replace(/[gy]/g, '')).test(net))) {
      punts += 25;
      motius.push('numero');
    }
    let perText = 0;
    for (const paraula of p.paraulesText ?? []) {
      const n = ocurrencies(plec, paraula);
      if (!n) continue;
      perText += /\s/.test(paraula.trim()) || n >= 2 ? 25 : 15;
      motius.push(`text:${paraula}`);
    }
    punts += Math.min(perText, 40);
    if (punts > millor.puntuacio) millor = { proveidor: p, puntuacio: punts, motius };
  }
  return millor.puntuacio >= LLINDAR_PROVEIDOR ? millor : { ...millor, proveidor: null };
}

/**
 * NIF que apareixen en almenys `minim` documents de proveïdors diferents:
 * probablement el del titular, que ix a totes les factures rebudes. Cada
 * document és un text o { text, nomFitxer?, proveidor? (clau) }; si no se'n
 * diu el proveïdor es detecta, i si no es coneix, l'identifiquen els altres
 * NIF del document.
 * @param {Array<string|{ text: string, nomFitxer?: string, proveidor?: string }>} textos
 * @param {{ cataleg?: object[], minim?: number }} [opcions]
 * @returns {string[]} NIF normalitzats, del més repetit al menys
 */
export function nifsRecurrents(textos, { cataleg = CATALEG_PROVEIDORS, minim = 3 } = {}) {
  const grups = new Map();
  for (const doc of textos ?? []) {
    const text = typeof doc === 'string' ? doc : String(doc?.text ?? '');
    const ls = liniesDe(text);
    const nifs = [...new Set(nifsDe(ls).filter((n) => n.fort).map((n) => n.nif))];
    if (!nifs.length) continue;
    let clau = typeof doc === 'object' && typeof doc?.proveidor === 'string' ? doc.proveidor : null;
    let nifsProveidor = new Set();
    const delCataleg = clau ? (cataleg ?? []).find((p) => p.clau === clau) : detectaProveidor({ text, nomFitxer: doc?.nomFitxer }, cataleg).proveidor;
    if (delCataleg) {
      clau = delCataleg.clau;
      /* G3T-12: tots els NIF del proveïdor, també els d'altres societats del grup. */
      nifsProveidor = new Set(nifsDelProveidor(delCataleg));
    }
    for (const n of nifs) {
      if (nifsProveidor.has(n)) continue;
      const altres = nifs.filter((x) => x !== n).sort();
      const identitat = clau ? `p:${clau}` : altres.length ? `n:${altres.join(',')}` : null;
      if (!identitat) continue;
      if (!grups.has(n)) grups.set(n, new Set());
      grups.get(n).add(identitat);
    }
  }
  return [...grups]
    .filter(([, ids]) => ids.size >= minim)
    .sort((a, b) => b[1].size - a[1].size || (a[0] < b[0] ? -1 : 1))
    .map(([n]) => n);
}

/* ── Tria de cada camp ─────────────────────────────────────────────────── */

const SENSE_IVA = /inversion\s+del\s+sujeto\s+pasivo|inversio\s+del\s+subjecte\s+passiu|reverse\s+charge|exent[oa]\s+de\s+iva|exempt[a]?\s+d['’]iva|operacion\s+exenta|operacio\s+exempta|no\s+sujet[oa]\s+a\s+iva|no\s+subjecte\s+a\s+iva|vat\s+exempt/;

function compara(a, b) {
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

/* La retenció resta del total; en una rectificativa (import de referència
   negatiu) va girada i hi suma. */
const ambSigne = (referencia, retencio) => (referencia < 0 ? -retencio : retencio);
const quadraTerna = (s, i, retencio, t) => Math.abs(s + i - ambSigne(s, retencio) - t) <= 1;

/* Confiança d'una retenció que no ve d'una terna que quadra: mitjana si és un
   dels percentatges habituals de la base (± 1 cèntim); baixa si no ho és o si
   no hi ha base per a comprovar-ho. */
function confiancaRetencio(retencio, base) {
  if (!Number.isSafeInteger(base) || base === 0) return 'baixa';
  const habitual = TIPUS_IRPF_HABITUALS.some((p) => Math.abs(retencio - Math.round((Math.abs(base) * p) / 100)) <= 1);
  return habitual ? 'mitjana' : 'baixa';
}

/* Un IVA més gran que la base seria un tipus per damunt del 100 %: sol ser la base i l'IVA llegits al revés. */
const versemblant = (s, i) => Math.abs(i.valor) <= Math.abs(s.valor);

const GIRAT = 'girat: etiqueta de la base postposada';

/* Els percentatges d'un text («21%», «10,5 %»), com a números. */
const percentatgesDe = (text) => [...text.matchAll(/(^|[^\d.,])(\d{1,2}(?:[.,]\d{1,2})?)\s?%/g)].map((m) => Number(m[2].replace(',', '.')));

/* G3T-07: «IVA 21% <base> (BASE IMPOSABLE) <quota>». L'etiqueta de la base va darrere del seu valor i cada
   etiqueta pren l'import que la seguix: la base i l'IVA ixen girats. Només es giren si tots dos ixen de la
   mateixa línia, amb l'etiqueta de l'IVA davant de la de la base, i girats la quota és el % que diu eixa
   línia (± 1 cèntim). Cap altra plantilla no es gira. */
function etiquetaPostposada(s, i, ls) {
  if (s.seguent || i.seguent || s.linia !== i.linia || !(i.pos < s.pos)) return false;
  return percentatgesDe(ls[s.linia].orig).some((p) => p > 0
    && Math.abs(Math.abs(s.valor) - Math.round((Math.abs(i.valor) * p) / 100)) <= 1);
}

/* Tria els imports i en torna els candidats que ha fet servir (per a saber-ne la moneda). */
function triaImports(c, ls, proveidor, posa) {
  const S = c.subtotal;
  const I = c.iva;
  const T = c.total;
  /* Una retenció de 0,00 € és com no tindre'n. */
  const R = c.irpf.filter((x) => x.valor !== 0).sort(perPrioritat);
  const posaRetencio = (x, confianca) => {
    if (x) posa('retencio', Math.abs(x.valor), confianca, x.fragment);
  };
  let millor = null;
  for (const t of T) {
    for (const s of S) {
      for (const i of I) {
        /* null: quadra sense retenció; undefined: no quadra amb cap. */
        const r = [null, ...R].find((x) => quadraTerna(s.valor, i.valor, x ? Math.abs(x.valor) : 0, t.valor));
        if (r === undefined) continue;
        const clau = [Math.abs(t.valor), versemblant(s, i) ? 1 : 0, s.esp + i.esp + t.esp, -t.linia];
        if (!millor || compara(clau, millor.clau) > 0) millor = { s, i, t, r, clau };
      }
    }
  }
  if (millor) {
    /* Quadra, però amb l'IVA més gran que la base: cap confiança alta; si l'etiqueta de la base va
       postposada (G3T-07), es giren amb confiança mitjana. */
    const segura = versemblant(millor.s, millor.i);
    const girada = !segura && etiquetaPostposada(millor.s, millor.i, ls);
    const [base, quota] = girada ? [millor.i, millor.s] : [millor.s, millor.i];
    const nivell = segura ? 'alta' : girada ? 'mitjana' : 'baixa';
    posa('subtotal', base.valor, nivell, girada ? GIRAT : base.fragment);
    posa('iva', quota.valor, nivell, girada ? GIRAT : quota.fragment);
    posa('total', millor.t.valor, segura ? 'alta' : 'mitjana', millor.t.fragment);
    const retencio = millor.r ?? R[0] ?? null;
    if (millor.r) posaRetencio(millor.r, nivell);
    else if (retencio) posaRetencio(retencio, confiancaRetencio(Math.abs(retencio.valor), base.valor));
    return [millor.s, millor.i, millor.t, retencio].filter(Boolean);
  }
  const tria = (llista, perMida) => [...llista].sort((a, b) => b.esp - a.esp || Number(a.seguent) - Number(b.seguent)
    || (perMida ? Math.abs(b.valor) - Math.abs(a.valor) : b.linia - a.linia))[0] ?? null;
  const s = tria(S, false);
  const i = tria(I, false);
  const t = tria(T, true);
  const r = tria(R, false);
  const usats = [s, i, t, r].filter(Boolean);
  if (s && i && t) {
    /* Tots tres i no quadren: algun està mal llegit. */
    posa('subtotal', s.valor, 'baixa', s.fragment);
    posa('iva', i.valor, 'baixa', i.fragment);
    posa('total', t.valor, 'baixa', t.fragment);
    posaRetencio(r, 'baixa');
    return usats;
  }
  if (s) posa('subtotal', s.valor, confiancaDe(s), s.fragment);
  if (i) posa('iva', i.valor, confiancaDe(i), i.fragment);
  if (t) posa('total', t.valor, confiancaDe(t), t.fragment);
  const retencio = r ? Math.abs(r.valor) : 0;
  let base = s ? s.valor : null;
  if (s && t && !i) posa('iva', t.valor - s.valor + ambSigne(s.valor, retencio), 'mitjana', 'calculat: total − subtotal');
  else if (i && t && !s) {
    base = t.valor - i.valor + ambSigne(t.valor, retencio);
    posa('subtotal', base, 'mitjana', 'calculat: total − IVA');
  } else if (s && i && !t) posa('total', s.valor + i.valor - ambSigne(s.valor, retencio), 'mitjana', 'calculat: subtotal + IVA');
  else if (t && !s && !i) {
    const motiu = proveidor?.ivaHabitual === 0 ? `sense IVA habitual: ${proveidor.nom}` : ls.some((l) => SENSE_IVA.test(l.plec)) ? 'factura sense IVA' : '';
    if (motiu) {
      /* Sense IVA, la base és el total més la retenció que ja s'hi ha descomptat. */
      base = t.valor + ambSigne(t.valor, retencio);
      posa('subtotal', base, 'mitjana', motiu);
      posa('iva', 0, 'mitjana', motiu);
    }
  }
  posaRetencio(r, confiancaRetencio(retencio, base));
  return usats;
}

/* La moneda dels imports triats si no és l'euro. Si cap no en du, manté el
   senyal d'una altra moneda al text: un peu que mencione euros no acredita
   cap conversió dels imports («Currency: USD»). */
function monedaEstrangera(usats, ls) {
  const monedes = usats.map((x) => x.moneda).filter(Boolean);
  const altra = monedes.find((moneda) => moneda !== 'EUR');
  if (altra || monedes.length) return altra ?? null;
  const text = ls.map((l) => l.orig).join('\n');
  return monedaDeText(text);
}

function triaNum(c, ls, proveidor, posa, opcions) {
  const ordenats = [...c.num].sort(perPrioritat);
  const tria = ordenats[0];
  const patrons = (proveidor?.patronsNum ?? []).map((re) => new RegExp(re.source, re.flags.replace(/[gy]/g, '')));
  if (patrons.length && !(tria && patrons.some((re) => re.test(tria.valor)))) {
    for (const l of ls) {
      for (const re of patrons) {
        const m = re.exec(l.orig);
        if (m) {
          posa('num', m[0], 'alta', l.orig);
          return;
        }
      }
    }
  }
  if (tria) {
    posa('num', tria.valor, patrons.some((re) => re.test(tria.valor)) ? 'alta' : confiancaDe(tria), tria.fragment);
    return;
  }
  /* «Factura F-2026-001» sense etiqueta de número. */
  for (const l of ls) {
    const m = /(^|[^a-z0-9])(?:factura|invoice|receipt|fra\.?)(?![a-z])/.exec(l.plec);
    if (!m) continue;
    const t = tokenNum(l.orig.slice(m.index + m[0].length), 2, opcions);
    if (t) {
      posa('num', t, 'baixa', l.orig);
      return;
    }
  }
}

function triaData(c, ls, posa) {
  const tria = [...c.data].sort(perPrioritat)[0];
  if (tria) {
    posa('data', tria.valor, confiancaDe(tria), tria.fragment);
    return;
  }
  const trobades = [];
  for (const l of ls) {
    if (l.ets.some((e) => e.camp === 'ignora')) continue;
    for (const d of datesDe(l.orig)) trobades.push({ data: d.data, fragment: l.orig });
  }
  if (!trobades.length) return;
  const distintes = new Set(trobades.map(({ data }) => `${data.a}-${data.m}-${data.d}`));
  posa('data', trobades[0].data, distintes.size === 1 ? 'mitjana' : 'baixa', trobades[0].fragment);
}

function triaNif(ls, propis, proveidor, posa) {
  const tots = nifsDe(ls);
  const nifProveidor = proveidor?.nif ? normalitzaNif(proveidor.nif) : '';
  /* G3T-12: el NIF del proveïdor del catàleg que porta el text, el principal abans que els alternatius. */
  const delCataleg = (proveidor ? nifsDelProveidor(proveidor) : []).filter((nif) => !propis.has(nif))
    .map((nif) => tots.find((n) => n.nif === nif)).find(Boolean) ?? null;
  if (delCataleg) {
    posa('nif', delCataleg.nif, 'alta', ls[delCataleg.linia].orig);
    return delCataleg;
  }
  const candidats = tots.filter((n) => n.fort && !propis.has(n.nif));
  if (candidats.length === 1) {
    const [n] = candidats;
    posa('nif', n.nif, n.etiqueta ? 'alta' : 'mitjana', ls[n.linia].orig);
    return n;
  }
  if (candidats.length > 1) {
    const n = candidats.find((x) => x.etiqueta) ?? candidats[0];
    posa('nif', n.nif, 'baixa', ls[n.linia].orig);
    return n;
  }
  if (nifProveidor && !propis.has(nifProveidor)) posa('nif', nifProveidor, 'mitjana', `catàleg: ${proveidor.nom}`);
  return null;
}

function teFormaSocietaria(text) {
  const net = plega(text).replace(/[.'’·]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  return net !== '' && normalitzaNom(text) !== net;
}

const ETIQUETA_DAVANT = /^(?:proveedor|proveïdor|emisor|emissor|cliente|client|raz[oó]n social|ra[oó] social|nombre|nom|empresa|company|from|bill to)\s*:?\s*/i;
/* Etiqueta fiscal al final («… - CIF:») o separadors solts; el punt final d'un «S.L.» es conserva. */
const NIF_DARRERE = /(?:[\s:–\-|·,]*(?:n\.?\s?i\.?\s?f\.?|c\.?\s?i\.?\s?f\.?|nif-iva|dni|nie|vat(?:\s*(?:id|no\.?|number|reg\.?))?|tax\s*id|ust-?id)[\s:.]*|[\s:–\-|·,]+)$/i;

const netejaNom = (text) => netejaText(String(text).replace(ETIQUETA_DAVANT, '').replace(NIF_DARRERE, ''));

/* Els noms propis per a comparar (normalitzaNom), sense els buits ni els de menys de 3 lletres. */
const nomsPropisNets = (noms) => (Array.isArray(noms) ? noms : [])
  .map((nom) => (typeof nom === 'string' ? normalitzaNom(nom) : ''))
  .filter((nom) => lletres(nom) >= 3);

/* Un nom és propi si, normalitzat, és un dels noms propis, o en conté un de diverses paraules. */
function esPropi(nom, propis) {
  const net = normalitzaNom(nom);
  if (!net) return false;
  return propis.some((p) => net === p || (p.includes(' ') && ` ${net} `.includes(` ${p} `)));
}

function triaContrapart(ls, tipus, deteccio, nif, c, propis, nomsPropis, posa) {
  if (tipus === 'despesa' && deteccio.proveidor) {
    posa('contrapart', deteccio.proveidor.nom, deteccio.puntuacio >= PROVEIDOR_SEGUR ? 'alta' : 'mitjana', `catàleg: ${deteccio.motius.join(', ')}`);
    return;
  }
  /* G3T-03: la marca pròpia no és mai la contrapart. */
  const prova = (nom, confianca, fragment) => {
    if (esPropi(nom, nomsPropis)) return false;
    posa('contrapart', nom, confianca, fragment);
    return true;
  };
  for (const x of [...(tipus === 'ingres' ? c.client : c.emissor)].sort(perPrioritat)) {
    if (prova(netejaNom(x.valor), 'mitjana', x.fragment)) return;
  }
  if (nif) {
    const l = ls[nif.linia];
    const davant = netejaNom(l.orig.slice(0, nif.inici));
    if (lletres(davant) >= 3 && prova(davant, 'mitjana', l.orig)) return;
    for (let k = nif.linia - 1; k >= Math.max(0, nif.linia - 3); k -= 1) {
      if (!ambValor(ls[k]) && teFormaSocietaria(ls[k].orig) && prova(netejaNom(ls[k].orig), 'mitjana', ls[k].orig)) return;
    }
    const dalt = ls[nif.linia - 1];
    if (dalt && !ambValor(dalt) && !/\d/.test(dalt.orig) && lletres(dalt.orig) >= 3 && dalt.orig.length <= 80
      && prova(netejaNom(dalt.orig), 'baixa', dalt.orig)) return;
  }
  /* Recurs: la primera línia amb forma societària que no siga del titular. */
  const delTitular = new Set();
  for (const n of nifsDe(ls)) {
    if (propis.has(n.nif)) [n.linia - 1, n.linia, n.linia + 1].forEach((k) => delTitular.add(k));
  }
  for (let k = 0; k < Math.min(ls.length, 20); k += 1) {
    if (!delTitular.has(k) && !ambValor(ls[k]) && teFormaSocietaria(ls[k].orig) && prova(netejaNom(ls[k].orig), 'baixa', ls[k].orig)) return;
  }
}

/* ── Abonaments ────────────────────────────────────────────────────────── */

/* «Tipo de factura:», «Document type:»… davant del senyal; el senyal ha d'encetar la línia (com un títol):
   al peu, «se emitirá una factura rectificativa» no diu res del document. */
const TIPUS_DOCUMENT = String.raw`(?:(?:tipo|tipus|type)(?:\s+(?:de\s+|of\s+)?(?:factura|documento|document|invoice))?\s*:?\s*|(?:document|invoice)\s+type\s*:?\s*)?`;
/* G3T-R04: el senyal fort fa de títol. «Abono» va sol a la línia o amb nº, número, # o «:» i un testimoni amb
   xifres; «Credit note» i «Nota de crédito», sols o amb un número darrere. «Abono 3 meses…» i «Credit note
   requests must…» són frases, no títols. */
const ETIQUETA_NUMERO = String.raw`(?:n\.?\s?[º°o]\.?|numero|num\.?|no\.|nr\.?|#|:)`;
const TESTIMONI_XIFRES = String.raw`[a-z0-9\-/_.]*\d`;
const AMB_NUMERO = String.raw`(?:\s*$|\s*${ETIQUETA_NUMERO}?\s*:?\s*${TESTIMONI_XIFRES})`;
const ABONAMENT_FORT = new RegExp(`^${TIPUS_DOCUMENT}(?:${[
  String.raw`credit\s+(?:note|memo)${AMB_NUMERO}`,
  String.raw`nota\s+de\s+(?:credito|credit)${AMB_NUMERO}`,
  String.raw`(?:factura|nota)\s+(?:de\s+|d['’])?(?:abono|abonament)`,
  String.raw`abono(?:\s*$|\s*${ETIQUETA_NUMERO}\s*:?\s*${TESTIMONI_XIFRES})`
].join('|')})(?![a-z])`);
const ABONAMENT_FEBLE = new RegExp(`^${TIPUS_DOCUMENT}(?:${[
  String.raw`(?:factura\s+)?rectificativa(?!\s*:?\s*(?:no|n/a)(?![a-z]))`,
  String.raw`(?:total|importe|import)\s+a\s+abonar`
].join('|')})(?![a-z])`);

/* La línia que diu que el document és un abonament, i si ho diu sense dubte: { fort, linia } o null. */
function senyalAbonament(ls) {
  const caps = ls.map((l) => ({ l, net: l.plec.replace(/^[^\p{L}\p{N}]+/u, '') }));
  const fort = caps.find(({ net }) => ABONAMENT_FORT.test(net));
  if (fort) return { fort: true, linia: fort.l.orig };
  const feble = caps.find(({ net }) => ABONAMENT_FEBLE.test(net));
  return feble ? { fort: false, linia: feble.l.orig } : null;
}

const NIVELLS = ['alta', 'mitjana', 'baixa'];
const pitjor = (a, b) => NIVELLS[Math.max(NIVELLS.indexOf(a), NIVELLS.indexOf(b))];

/* Un abonament amb els imports en positiu els dona en negatiu. La retenció continua en positiu: en un import
   de referència negatiu ja hi suma (ambSigne). Si algun import ja és negatiu, no es toca res. */
function aplicaAbonament(res, ls) {
  const senyal = senyalAbonament(ls);
  if (!senyal) return;
  res.abonament = true;
  res.fragments.abonament = retalla(senyal.linia);
  const camps = ['subtotal', 'iva', 'total'].filter((camp) => Number.isSafeInteger(res[camp]));
  if (!camps.some((camp) => res[camp] > 0) || camps.some((camp) => res[camp] < 0)) return;
  for (const camp of camps) {
    res[camp] = res[camp] === 0 ? 0 : -res[camp];
    res.confianca[camp] = pitjor(res.confianca[camp] ?? 'alta', senyal.fort ? 'mitjana' : 'baixa');
  }
}

/**
 * Llig els camps d'una factura del seu text.
 * @param {string} text
 * @param {{ tipus?: 'ingres'|'despesa', nifsPropis?: string[], nomsPropis?: string[], cataleg?: object[], nomFitxer?: string }} [opcions]
 *   nifsPropis: NIF del titular, que no poden ser de la contrapart.
 *   nomsPropis: noms del titular i de les seues marques (la de les factures
 *   emeses); cap contrapart no pot ser-ne un: es compara amb normalitzaNom,
 *   sencer o, si el nom propi té diverses paraules, contingut. Els buits i els
 *   de menys de 3 lletres no compten. cataleg: per defecte CATALEG_PROVEIDORS
 *   (només per a despeses). nomFitxer (camí o nom) ajuda a detectar el
 *   proveïdor i dona el separador d'un número partit («A-B» si el nom el porta).
 * Al resultat, retencio és la retenció d'IRPF en cèntims positius (null si no
 * n'hi ha cap de llegible), amb confiança alta si forma part de la terna que
 * quadra; si no, mitjana quan és un percentatge habitual de la base (7, 15 o
 * 19 %) i baixa en qualsevol altre cas. moneda només hi és si els imports no
 * són en euros (vegeu la capçalera): llavors tots tenen confiança baixa.
 * abonament només hi és (true) si el text diu que és un abonament o una
 * rectificativa, amb la línia que ho diu a fragments.abonament; els imports ja
 * hi van en negatiu (vegeu la capçalera).
 * @returns {{ num: string, data: {a:number,m:number,d:number}|null, nif: string, contrapart: string,
 *   descripcio: string, subtotal: number|null, iva: number|null, total: number|null, retencio: number|null,
 *   moneda?: string, abonament?: true, confianca: Object<string, 'alta'|'mitjana'|'baixa'>, fragments: Object<string, string> }}
 */
export function extreuCamps(text, {
  tipus = 'despesa', nifsPropis = [], nomsPropis = [], cataleg = CATALEG_PROVEIDORS, nomFitxer = ''
} = {}) {
  const res = {
    num: '', data: null, nif: '', contrapart: '', descripcio: '', subtotal: null, iva: null, total: null, retencio: null, confianca: {}, fragments: {}
  };
  const posa = (camp, valorCamp, confianca, fragment) => {
    res[camp] = valorCamp;
    res.confianca[camp] = confianca;
    res.fragments[camp] = retalla(fragment);
  };
  const ls = liniesDe(text);
  if (!ls.length) return res;
  const propis = new Set((nifsPropis ?? []).map(normalitzaNif).filter(Boolean));
  const deteccio = tipus === 'despesa' ? detectaProveidor({ text, nomFitxer }, cataleg) : { proveidor: null, puntuacio: 0, motius: [] };
  const opcions = {
    milersEspai: !ls.some((l) => MILERS_AMB_SIGNE.test(l.orig)), nomFitxer, ambSubvencio: ls.some((l) => l.ets.some((e) => e.subvencio))
  };
  const c = recullCandidats(ls, opcions);
  triaNum(c, ls, deteccio.proveidor, posa, opcions);
  triaData(c, ls, posa);
  const moneda = monedaEstrangera(triaImports(c, ls, deteccio.proveidor, posa), ls);
  if (moneda) {
    /* L'import en euros no és el del document: cap dels imports és segur. */
    res.moneda = moneda;
    for (const camp of ['subtotal', 'iva', 'total', 'retencio']) if (res.confianca[camp]) res.confianca[camp] = 'baixa';
  }
  aplicaAbonament(res, ls);
  const nif = triaNif(ls, propis, deteccio.proveidor, posa);
  triaContrapart(ls, tipus, deteccio, nif, c, propis, nomsPropisNets(nomsPropis), posa);
  const descripcio = [...c.descripcio].sort((a, b) => Number(a.seguent) - Number(b.seguent) || a.linia - b.linia)[0];
  if (descripcio) posa('descripcio', descripcio.valor, descripcio.seguent ? 'baixa' : 'mitjana', descripcio.fragment);
  return res;
}
