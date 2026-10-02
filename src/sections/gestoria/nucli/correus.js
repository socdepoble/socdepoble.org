/**
 * correus.js — metadades d'una exportació de correu (.mbox o .eml).
 *
 * Només capçaleres: remitent, domini, assumpte, data, identificador i noms
 * dels adjunts. El cos dels missatges no es copia mai en el resum; només es
 * recorren les capçaleres de les parts MIME per a saber com es diuen els
 * adjunts. Decodifica les paraules codificades (RFC 2047) i els paràmetres
 * estesos (RFC 2231) en utf-8, iso-8859-1 i windows-1252. JS pur: sense DOM.
 */
import { esDataValida, parseData } from './dates.js';

const MAX_PROFUNDITAT_MIME = 12;
/* La línia From_ completa d'un mbox: «From compte@domini Thu Apr 30 10:22:00 2026». */
const FROM_ASCTIME = /^From \S+\s+[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{1,2}:\d{2}/;
const PARAULA_CODIFICADA = /=\?([^?\s]+)\?([BbQq])\?([^?\s]*)\?=/g;
const MESOS_RFC = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
/* Etiquetes que es decodifiquen com a windows-1252, com fa WHATWG. Es fa ací
   a mà perquè el TextDecoder de Node les llig com a latin1 (0x80 no és «€»). */
const LLATINS = new Set(['iso-8859-1', 'iso8859-1', 'latin1', 'l1', 'us-ascii', 'ascii', 'windows-1252', 'cp1252']);
/* Bytes de 0x80 a 0x9F en windows-1252; els cinc que no hi són es queden com el byte. */
const WINDOWS_1252 = [
  0x20AC, 0x81, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021, 0x02C6, 0x2030, 0x0160, 0x2039, 0x0152, 0x8D, 0x017D, 0x8F,
  0x90, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014, 0x02DC, 0x2122, 0x0161, 0x203A, 0x0153, 0x9D, 0x017E, 0x0178
];
const CODIFICADOR = new TextEncoder();

/* Afig els bytes d'una llista al final d'una altra, d'un en un. Revisió
   adversarial (seguretat-05) · Mai push(...bytes): passar-los com a arguments
   d'una crida llança RangeError amb unes desenes de milers d'elements (en
   Safari, des de 65.536), i un sol correu brossa feia caure tot el creuament. */
function afigBytes(desti, bytes) {
  for (let i = 0; i < bytes.length; i += 1) desti.push(bytes[i]);
  return desti;
}

/**
 * Separa un .mbox en missatges. Un missatge comença en una línia «From » que
 * va després d'una línia buida (o al principi), o que té la forma completa de
 * la línia From_. Les línies «>From » del cos (mboxrd) no separen i perden un
 * «>». Un text sense cap línia From_ (un .eml solt) és un sol missatge.
 * @param {string} text
 * @returns {string[]} cada missatge sense la línia From_, amb salts '\n'
 */
export function separaMbox(text) {
  if (typeof text !== 'string' || text === '') return [];
  const missatges = [];
  let actual = null;
  let anteriorBuida = true;
  const tanca = () => {
    if (!actual) return;
    while (actual.length > 0 && actual[actual.length - 1] === '') actual.pop();
    if (actual.length > 0) missatges.push(actual.join('\n'));
  };
  for (const linia of text.split(/\r\n|\r|\n/)) {
    if (linia.startsWith('From ') && (anteriorBuida || FROM_ASCTIME.test(linia))) {
      tanca();
      actual = [];
    } else {
      if (!actual) actual = [];
      actual.push(/^>+From /.test(linia) ? linia.slice(1) : linia);
    }
    anteriorBuida = linia === '';
  }
  tanca();
  return missatges;
}

/* Capçalera i cos d'un missatge o d'una part MIME, separats per la primera línia buida. */
function separaCapcalera(text) {
  const net = String(text ?? '').replace(/\r\n?/g, '\n');
  if (net.startsWith('\n')) return { capcalera: '', cos: net.slice(1) };
  const i = net.indexOf('\n\n');
  return i < 0 ? { capcalera: net, cos: '' } : { capcalera: net.slice(0, i), cos: net.slice(i + 2) };
}

/**
 * Les capçaleres d'un missatge (o d'una part MIME): les línies plegades es
 * despleguen i les claus van en minúscules. Si una capçalera es repetix, val
 * la primera. Els valors no es decodifiquen (vegeu decodificaParaula).
 * @param {string} textMissatge
 * @returns {Object<string, string>}
 */
export function capcaleres(textMissatge) {
  const resultat = {};
  const bloc = separaCapcalera(textMissatge).capcalera.replace(/\n(?=[ \t])/g, '');
  for (const linia of bloc.split('\n')) {
    const dosPunts = linia.indexOf(':');
    if (dosPunts <= 0) continue;
    const clau = linia.slice(0, dosPunts).trim().toLowerCase();
    if (!/^[!-9;-~]+$/.test(clau) || clau === '__proto__') continue;
    if (!Object.prototype.hasOwnProperty.call(resultat, clau)) resultat[clau] = linia.slice(dosPunts + 1).trim();
  }
  return resultat;
}

function bytesBase64(dades) {
  const net = dades.replace(/\s+/g, '');
  try {
    const binari = atob(net + '='.repeat((4 - (net.length % 4)) % 4));
    return Uint8Array.from(binari, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

function bytesQ(dades) {
  const bytes = [];
  for (let i = 0; i < dades.length; i += 1) {
    const c = dades[i];
    if (c === '_') bytes.push(0x20);
    else if (c === '=' && /^[0-9a-f]{2}$/i.test(dades.slice(i + 1, i + 3))) {
      bytes.push(parseInt(dades.slice(i + 1, i + 3), 16));
      i += 2;
    } else bytes.push(c.charCodeAt(0) & 0xff);
  }
  return Uint8Array.from(bytes);
}

/* Bytes amb el %XX de l'RFC 2231; els caràcters no ASCII van en UTF-8. */
function bytesPercent(text) {
  const bytes = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '%' && /^[0-9a-f]{2}$/i.test(text.slice(i + 1, i + 3))) {
      bytes.push(parseInt(text.slice(i + 1, i + 3), 16));
      i += 2;
    } else afigBytes(bytes, CODIFICADOR.encode(text[i]));
  }
  return bytes;
}

/* Decodifica bytes amb un joc de caràcters; null si el joc és desconegut. */
function decodificaBytes(bytes, charset) {
  const etiqueta = String(charset || 'utf-8').toLowerCase();
  const dades = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  if (LLATINS.has(etiqueta)) {
    return Array.from(dades, (b) => String.fromCharCode(b >= 0x80 && b <= 0x9F ? WINDOWS_1252[b - 0x80] : b)).join('');
  }
  try {
    return new TextDecoder(etiqueta).decode(dades);
  } catch {
    return null;
  }
}

/**
 * Decodifica les paraules codificades de l'RFC 2047 («=?utf-8?B?…?=»,
 * «=?iso-8859-1?Q?…?=»). L'espai entre dues paraules codificades seguides
 * desapareix i, si tenen el mateix joc de caràcters, se'n decodifiquen els
 * bytes junts (un caràcter pot quedar partit entre les dues). Una paraula que
 * no es pot decodificar es queda com estava.
 * @param {string} text
 * @returns {string}
 */
export function decodificaParaula(text) {
  if (typeof text !== 'string') return '';
  if (!text.includes('=?')) return text;
  const trossos = [];
  let ultim = 0;
  for (const r of text.matchAll(PARAULA_CODIFICADA)) {
    const entre = text.slice(ultim, r.index);
    const anterior = trossos[trossos.length - 1];
    const charset = r[1].split('*')[0].toLowerCase();
    const bytes = r[2].toLowerCase() === 'b' ? bytesBase64(r[3]) : bytesQ(r[3]);
    const seguida = anterior?.charset !== undefined && /^\s*$/.test(entre);
    if (!seguida && entre) trossos.push({ text: entre });
    if (!bytes) trossos.push({ text: r[0] });
    else if (seguida && anterior.charset === charset) {
      /* Al mateix vector: copiar-lo sencer a cada paraula seguida era quadràtic. */
      afigBytes(anterior.bytes, bytes);
      anterior.cru += r[0];
    } else trossos.push({ charset, bytes: Array.from(bytes), cru: r[0] });
    ultim = r.index + r[0].length;
  }
  trossos.push({ text: text.slice(ultim) });
  return trossos.map((t) => (t.charset === undefined ? t.text : decodificaBytes(t.bytes, t.charset) ?? t.cru)).join('');
}

/* Partix el valor d'una capçalera pels «;» que no són dins de cometes. */
function trossosParametres(text) {
  const trossos = [];
  let actual = '';
  let cometes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (cometes && c === '\\' && i + 1 < text.length) {
      actual += c + text[i + 1];
      i += 1;
    } else if (c === ';' && !cometes) {
      trossos.push(actual);
      actual = '';
    } else {
      if (c === '"') cometes = !cometes;
      actual += c;
    }
  }
  trossos.push(actual);
  return trossos;
}

const llevaCometes = (v) => (/^".*"$/s.test(v) ? v.slice(1, -1).replace(/\\(.)/g, '$1') : v);

/* Valor d'un paràmetre estés de l'RFC 2231: «charset'idioma'text%20codificat». */
function decodifica2231(valor) {
  const r = /^([^']*)'[^']*'(.*)$/s.exec(valor);
  const charset = r ? r[1] || 'utf-8' : 'utf-8';
  return decodificaBytes(bytesPercent(r ? r[2] : valor), charset) ?? valor;
}

/**
 * El valor principal d'una capçalera estructurada (en minúscules) i els seus
 * paràmetres, amb els de l'RFC 2231 (nom*, nom*0, nom*0*, …) ja reconstruïts.
 */
function parametres(valorCapcalera) {
  const [principal, ...resta] = trossosParametres(String(valorCapcalera ?? ''));
  /* Sense prototip: els noms dels paràmetres venen del missatge. */
  const simples = Object.create(null);
  const estesos = Object.create(null);
  const continuacions = Object.create(null);
  for (const tros of resta) {
    const igual = tros.indexOf('=');
    if (igual <= 0) continue;
    const clau = tros.slice(0, igual).trim().toLowerCase();
    const valor = llevaCometes(tros.slice(igual + 1).trim());
    const r = /^([^*]+)(?:\*(\d+))?(\*)?$/.exec(clau);
    if (!r || r[1] === '__proto__') continue;
    if (r[2] !== undefined) {
      continuacions[r[1]] = continuacions[r[1]] ?? [];
      continuacions[r[1]][Number(r[2])] = { valor, codificat: Boolean(r[3]) };
    } else if (r[3]) estesos[r[1]] = valor;
    else simples[r[1]] = valor;
  }
  const params = Object.create(null);
  for (const nom of new Set([...Object.keys(simples), ...Object.keys(estesos), ...Object.keys(continuacions)])) {
    if (estesos[nom] !== undefined) params[nom] = decodifica2231(estesos[nom]);
    else if (continuacions[nom]?.[0]) {
      const segments = [];
      for (let k = 0; continuacions[nom][k]; k += 1) segments.push(continuacions[nom][k]);
      let charset = 'utf-8';
      const bytes = [];
      segments.forEach(({ valor, codificat }, k) => {
        let v = valor;
        if (codificat && k === 0) {
          const r = /^([^']*)'[^']*'(.*)$/s.exec(v);
          if (r) {
            charset = r[1] || 'utf-8';
            v = r[2];
          }
        }
        afigBytes(bytes, codificat ? bytesPercent(v) : CODIFICADOR.encode(v));
      });
      params[nom] = decodificaBytes(bytes, charset) ?? segments.map((s) => s.valor).join('');
    } else if (simples[nom] !== undefined) params[nom] = decodificaParaula(simples[nom]);
  }
  return { valor: principal.trim().toLowerCase(), params };
}

/* Nom d'adjunt net: sense carpetes (alguns clients hi posen la ruta) ni caràcters de control. */
const netejaNom = (nom) => String(nom ?? '').split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f]/g, '').trim();

function recorrePart(text, noms, profunditat) {
  const { capcalera, cos } = separaCapcalera(text);
  const cap = capcaleres(`${capcalera}\n\n`);
  const disposicio = parametres(cap['content-disposition']);
  const tipus = parametres(cap['content-type']);
  const nom = netejaNom(disposicio.params.filename || tipus.params.name);
  if (nom) noms.push(nom);
  const frontera = tipus.params.boundary;
  if (!tipus.valor.startsWith('multipart/') || !frontera || profunditat >= MAX_PROFUNDITAT_MIME) return;
  const obre = `--${frontera}`;
  let part = null;
  for (const linia of cos.split('\n')) {
    const marca = linia.trimEnd();
    if (marca === obre || marca === `${obre}--`) {
      if (part) recorrePart(part.join('\n'), noms, profunditat + 1);
      part = marca === obre ? [] : null;
      if (marca !== obre) return;
    } else if (part) part.push(linia);
  }
  if (part) recorrePart(part.join('\n'), noms, profunditat + 1);
}

/**
 * Els noms dels adjunts d'un missatge: filename (o filename*) de
 * Content-Disposition i, si no n'hi ha, name de Content-Type, de totes les
 * parts MIME. Sense repetits, en l'ordre en què apareixen.
 * @param {string} textMissatge
 * @returns {string[]}
 */
export function adjuntsDe(textMissatge) {
  const noms = [];
  if (typeof textMissatge === 'string') recorrePart(textMissatge, noms, 0);
  return [...new Set(noms)];
}

/* Adreça i nom visible d'un From: «Nom <compte@domini>», «compte@domini (Nom)» o «compte@domini». */
function remitent(valor) {
  const cru = String(valor ?? '').trim();
  const angles = /<([^<>]*)>/.exec(cru);
  if (angles) {
    const nom = cru.slice(0, angles.index).trim().replace(/^"(.*)"$/s, '$1');
    return { adreca: angles[1].trim().toLowerCase(), nom: decodificaParaula(nom).trim() };
  }
  const comentari = /\(([^()]*)\)/.exec(cru);
  const adreca = cru.replace(/\([^()]*\)/g, ' ').split(/\s+/).find((t) => t.includes('@')) ?? '';
  return { adreca: adreca.toLowerCase(), nom: comentari ? decodificaParaula(comentari[1]).trim() : '' };
}

/* La data d'una capçalera Date (RFC 5322) tal com l'escriu el remitent, sense convertir zones. */
function dataCorreu(valor) {
  const text = String(valor ?? '');
  const r = /(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{4}|\d{2})(?!\d)/.exec(text);
  if (!r) return parseData(text.trim());
  const m = MESOS_RFC.indexOf(r[2].toLowerCase()) + 1;
  /* Un mes que no és en anglés no és RFC 5322, però parseData el pot conéixer («30 abr 2026»). */
  if (m === 0) return parseData(r[0]);
  const any = r[3].length === 4 ? Number(r[3]) : Number(r[3]) + (Number(r[3]) < 50 ? 2000 : 1900);
  const data = { a: any, m, d: Number(r[1]) };
  return esDataValida(data) ? data : null;
}

/**
 * Resum d'un missatge, només amb metadades: mai el cos.
 * @param {string} textMissatge
 * @returns {{ de: string, nomRemitent: string, domini: string, assumpte: string,
 *   data: {a:number,m:number,d:number}|null, idMissatge: string, adjunts: string[] }}
 */
export function resumCorreu(textMissatge) {
  const cap = capcaleres(textMissatge);
  const { adreca, nom } = remitent(cap.from);
  const arroba = adreca.lastIndexOf('@');
  return {
    de: adreca,
    nomRemitent: nom,
    domini: arroba >= 0 ? adreca.slice(arroba + 1) : '',
    assumpte: decodificaParaula(cap.subject ?? '').replace(/\s+/g, ' ').trim(),
    data: dataCorreu(cap.date),
    idMissatge: String(cap['message-id'] ?? '').trim().replace(/^<|>$/g, ''),
    adjunts: adjuntsDe(textMissatge)
  };
}

const senseAccents = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/* Les expressions llargues primer, perquè el motiu siga el més precís. */
const EXPRESSIONS_ASSUMPTE = ['tu factura', 'your invoice', 'payment received', 'facturacion', 'factura', 'invoice', 'receipt', 'rebut', 'recibo'];
const PARAULES_ADJUNT = ['factura', 'invoice', 'receipt', 'rebut', 'recibo'];

/**
 * Cert si el resum d'un correu pareix d'una factura: per l'assumpte (factura,
 * invoice, receipt, rebut, recibo, «tu factura», «your invoice», «payment
 * received», «facturación») o per un adjunt .pdf amb eixes paraules al nom.
 * @param {{ assumpte?: string, adjunts?: string[] }} resum
 * @returns {{ es: boolean, motiu: string }}
 */
export function esCorreuDeFactura(resum) {
  const assumpte = senseAccents(resum?.assumpte);
  for (const expressio of EXPRESSIONS_ASSUMPTE) {
    if (new RegExp(`(^|[^a-z0-9])${expressio}`).test(assumpte)) return { es: true, motiu: `L'assumpte diu «${expressio}».` };
  }
  for (const adjunt of resum?.adjunts ?? []) {
    const nom = senseAccents(adjunt);
    if (nom.endsWith('.pdf') && PARAULES_ADJUNT.some((p) => nom.includes(p))) {
      return { es: true, motiu: `L'adjunt «${adjunt}» té nom de factura.` };
    }
  }
  return { es: false, motiu: "Ni l'assumpte ni els adjunts parlen de cap factura." };
}
