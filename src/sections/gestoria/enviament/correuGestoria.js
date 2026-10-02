/**
 * correuGestoria.js — l'esborrany del correu que porta el full trimestral a
 * la gestoria.
 *
 * Pur: sense React, sense DOM i sense xarxa. Prepara l'esborrany (l'adreça
 * de redacció de Gmail o un fitxer .eml) i mai no l'envia: enviar és una
 * acció externa i irreversible, i la fa la persona en prémer «Envia» al seu
 * correu. Cap nom ni adreça real viu ací: tot ho escriu qui l'usa.
 */

export const TIPUS_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const TIPUS_CSV = 'text/csv';
export const TIPUS_EML = 'message/rfc822';

/* {nom}, {n} (trimestre), {any} i {salutacio} ('' o ' ' + la persona). */
export const PLANTILLA_CORREU_PER_DEFECTE = Object.freeze({
  assumpte: '{nom} - {n}T - {any}',
  cos: 'Hola{salutacio}, ací tens la facturació del {n}T.\n\nBon dia'
});

export const CODIS_CORREU = Object.freeze([
  'PLANTILLA_INVALIDA', 'PERIODE_INVALID', 'ADRECA_INVALIDA', 'ASSUMPTE_BUIT',
  'TEXT_INVALID', 'COMPTE_INVALID', 'ADJUNT_INVALID', 'LIMIT_INVALID', 'DATA_INVALIDA'
]);

export class ErrorCorreu extends Error {
  constructor(codi, missatge) {
    super(missatge);
    this.name = 'ErrorCorreu';
    this.codi = codi;
  }
}

const CRLF = '\r\n';
const MARCADOR = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
const ALFABET_B64 = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789', '+/'].join('');
const PATRO_LOCAL = /^[A-Za-z0-9_+-]+(\.[A-Za-z0-9_+-]+)*$/;
const PATRO_DOMINI = /^([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+([A-Za-z]{2,63}|xn--[A-Za-z0-9-]{1,59})$/;
const PATRO_TIPUS = /^[A-Za-z0-9][A-Za-z0-9!$&^_.+-]*\/[A-Za-z0-9][A-Za-z0-9!$&^_.+-]*$/;
const PATRO_CHARSET = /^charset\s*=\s*"?([A-Za-z0-9._:-]+)"?$/i;
/* bchars de l'RFC 2046 sense l'espai (no pot acabar en espai i així no cal pensar-hi). */
const PATRO_LIMIT = /^[0-9A-Za-z'()+_,./:=?-]{1,70}$/;
const MAX_LINIA = 78;
/* 39 bytes → 52 caràcters de base64 → paraula codificada de 64 (RFC 2047: ≤ 75). */
const BYTES_PER_PARAULA = 39;
const TROS_RFC2231 = 60;

const codificador = new TextEncoder();

/* ── Plantilla ─────────────────────────────────────────────────────────── */

/**
 * Substituïx els marcadors {clau} d'una passada (un valor que porte «{x}» no
 * es torna a substituir). Un marcador sense valor (absent, null o undefined)
 * es queda tal qual i es retorna a `avisos`, una vegada per marcador.
 * @returns {{ text: string, avisos: Array<{ codi: string, marcador: string, missatge: string }> }}
 */
export function ompliPlantilla(text, valors = {}) {
  if (typeof text !== 'string') throw new ErrorCorreu('PLANTILLA_INVALIDA', 'La plantilla ha de ser un text.');
  const fonts = valors !== null && typeof valors === 'object' ? valors : {};
  const desconeguts = [];
  const omplit = text.replace(MARCADOR, (sencer, clau) => {
    const valor = Object.prototype.hasOwnProperty.call(fonts, clau) ? fonts[clau] : undefined;
    if (valor === undefined || valor === null) {
      if (!desconeguts.includes(clau)) desconeguts.push(clau);
      return sencer;
    }
    return String(valor);
  });
  return {
    text: omplit,
    avisos: desconeguts.map((clau) => ({
      codi: 'MARCADOR_DESCONEGUT',
      marcador: `{${clau}}`,
      missatge: `El marcador {${clau}} no té valor: s'ha deixat tal qual.`
    }))
  };
}

const unaLinia = (valor) => String(valor ?? '').replace(/\s+/g, ' ').trim();

function enter(valor) {
  if (typeof valor === 'number') return Number.isInteger(valor) ? valor : NaN;
  if (typeof valor === 'string' && /^\s*\d+\s*$/.test(valor)) return Number(valor);
  return NaN;
}

/** Els valors de la plantilla per defecte a partir del que escriu la persona. */
export function valorsCorreu({ nom = '', persona = '', any, t } = {}) {
  const trimestre = enter(t);
  const exercici = enter(any);
  if (!(trimestre >= 1 && trimestre <= 4)) {
    throw new ErrorCorreu('PERIODE_INVALID', 'El trimestre ha de ser 1, 2, 3 o 4.');
  }
  if (!(exercici >= 1000 && exercici <= 9999)) {
    throw new ErrorCorreu('PERIODE_INVALID', 'L\'any ha de tindre quatre xifres.');
  }
  const qui = unaLinia(persona);
  return { nom: unaLinia(nom), n: String(trimestre), any: String(exercici), salutacio: qui ? ` ${qui}` : '' };
}

/** «esborrany_gestoria_2026_1T.eml»: només ASCII, perquè qualsevol sistema el deixe tal qual. */
export function nomEsborrany({ any, t } = {}) {
  const { n, any: exercici } = valorsCorreu({ any, t });
  return `esborrany_gestoria_${exercici}_${n}T.eml`;
}

/* ── Validació ─────────────────────────────────────────────────────────── */

/**
 * Una sola adreça plausible (nom@domini.tld), sense nom visible, comes ni
 * espais. És deliberadament estricta: el que no passa no pot injectar res a
 * l'adreça de Gmail ni a les capçaleres del .eml.
 */
export function adrecaValida(adreca) {
  if (typeof adreca !== 'string') return false;
  const neta = adreca.trim();
  if (neta.length > 254) return false;
  const arrova = neta.indexOf('@');
  if (arrova < 1 || arrova !== neta.lastIndexOf('@')) return false;
  const local = neta.slice(0, arrova);
  const domini = neta.slice(arrova + 1);
  return local.length <= 64 && PATRO_LOCAL.test(local) && PATRO_DOMINI.test(domini);
}

function adrecaObligatoria(adreca, que) {
  if (!adrecaValida(adreca)) {
    throw new ErrorCorreu('ADRECA_INVALIDA', `${que} no és una adreça de correu vàlida.`);
  }
  return adreca.trim();
}

function benFormat(text, que) {
  try {
    encodeURIComponent(text);
  } catch {
    throw new ErrorCorreu('TEXT_INVALID', `${que} conté caràcters trencats.`);
  }
  return text;
}

/* Una sola línia: salts, tabuladors i espais repetits es tornen un espai, i
   la resta de caràcters de control es lleven. Així no hi ha injecció de
   capçaleres ni línies plegades fetes només d'espais. */
function assumpteNet(assumpte) {
  if (typeof assumpte !== 'string') throw new ErrorCorreu('ASSUMPTE_BUIT', 'Falta l\'assumpte.');
  const net = assumpte.replace(/[\u0000-\u0008\u000E-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
  if (!net) throw new ErrorCorreu('ASSUMPTE_BUIT', 'L\'assumpte no pot quedar buit.');
  return benFormat(net, 'L\'assumpte');
}

function cosNet(cos) {
  if (cos === undefined || cos === null) return '';
  if (typeof cos !== 'string') throw new ErrorCorreu('TEXT_INVALID', 'El text del correu ha de ser un text.');
  return benFormat(cos.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''), 'El text del correu');
}

function codifica(text) {
  try {
    return encodeURIComponent(text);
  } catch {
    throw new ErrorCorreu('TEXT_INVALID', 'El text conté caràcters trencats.');
  }
}

/* ── Gmail ─────────────────────────────────────────────────────────────── */

/**
 * L'adreça que obri la redacció de Gmail amb destinatari, assumpte i text.
 * Gmail no admet adjunts per l'adreça: el full s'hi ha d'arrossegar a mà.
 * `compte` (0, 1, 2…) tria el compte quan n'hi ha més d'un (/mail/u/<n>/).
 */
export function urlRedaccioGmail({ per, assumpte, cos = '', compte = null } = {}) {
  const desti = adrecaObligatoria(per, 'El destinatari');
  const su = assumpteNet(assumpte);
  const text = cosNet(cos).replace(/\r\n?/g, '\n');
  let base = 'https://mail.google.com/mail/';
  if (compte !== null && compte !== undefined) {
    if (!Number.isSafeInteger(compte) || compte < 0) {
      throw new ErrorCorreu('COMPTE_INVALID', 'El compte de Gmail ha de ser un enter: 0, 1, 2…');
    }
    base += `u/${compte}/`;
  }
  return `${base}?view=cm&fs=1&tf=1&to=${codifica(desti)}&su=${codifica(su)}&body=${codifica(text)}`;
}

/* ── Codificacions MIME ────────────────────────────────────────────────── */

function aBytes(valor) {
  if (ArrayBuffer.isView(valor)) return new Uint8Array(valor.buffer, valor.byteOffset, valor.byteLength);
  if (Object.prototype.toString.call(valor) === '[object ArrayBuffer]') return new Uint8Array(valor);
  return null;
}

/** Base64 estàndard (RFC 4648 §4), amb farciment. */
export function base64Estandard(bytes) {
  const b = aBytes(bytes);
  if (!b) throw new TypeError('base64Estandard: s\'esperaven bytes.');
  let eixida = '';
  let i = 0;
  for (; i + 2 < b.length; i += 3) {
    const n = (b[i] << 16) | (b[i + 1] << 8) | b[i + 2];
    eixida += ALFABET_B64[n >> 18] + ALFABET_B64[(n >> 12) & 63] + ALFABET_B64[(n >> 6) & 63] + ALFABET_B64[n & 63];
  }
  const resta = b.length - i;
  if (resta === 1) {
    const n = b[i] << 16;
    eixida += `${ALFABET_B64[n >> 18]}${ALFABET_B64[(n >> 12) & 63]}==`;
  } else if (resta === 2) {
    const n = (b[i] << 16) | (b[i + 1] << 8);
    eixida += `${ALFABET_B64[n >> 18]}${ALFABET_B64[(n >> 12) & 63]}${ALFABET_B64[(n >> 6) & 63]}=`;
  }
  return eixida;
}

function enLinies(text, mida) {
  const linies = [];
  for (let i = 0; i < text.length; i += mida) linies.push(text.slice(i, i + mida));
  return linies.join(CRLF);
}

const hexQp = (byte) => `=${byte.toString(16).toUpperCase().padStart(2, '0')}`;

/* Quoted-printable (RFC 2045 §6.7) d'una línia: cap línia passa de 76 i cap
   =XX es partix; l'espai o el tabulador final es codifiquen. */
function qpLinia(bytes) {
  const linies = [];
  let actual = '';
  for (let i = 0; i < bytes.length; i += 1) {
    const b = bytes[i];
    const espai = b === 0x20 || b === 0x09;
    const literal = espai ? i < bytes.length - 1 : b >= 33 && b <= 126 && b !== 61;
    const tros = literal ? String.fromCharCode(b) : hexQp(b);
    if (actual.length + tros.length > 75) {
      linies.push(`${actual}=`);
      actual = '';
    }
    actual += tros;
  }
  linies.push(actual);
  return linies.join(CRLF);
}

function quotedPrintable(text) {
  return text.split(/\r\n|\r|\n/).map((linia) => qpLinia(codificador.encode(linia))).join(CRLF);
}

/* RFC 2047: paraules =?UTF-8?B?…?= de caràcters sencers, plegades en línies. */
function paraulesCodificades(text) {
  const paraules = [];
  let tros = '';
  let mida = 0;
  for (const caracter of text) {
    const bytes = codificador.encode(caracter).length;
    if (tros && mida + bytes > BYTES_PER_PARAULA) {
      paraules.push(tros);
      tros = '';
      mida = 0;
    }
    tros += caracter;
    mida += bytes;
  }
  if (tros) paraules.push(tros);
  return paraules.map((p) => `=?UTF-8?B?${base64Estandard(codificador.encode(p))}?=`);
}

/* Plega pels espais per no passar de 78 columnes. En desplegar, el CRLF se'n
   va i l'espai es queda: el text torna sencer. */
function plegaAscii(prefix, valor) {
  const paraules = valor.split(' ');
  const linies = [];
  let actual = prefix + paraules[0];
  for (const paraula of paraules.slice(1)) {
    if (actual.length + 1 + paraula.length > MAX_LINIA) {
      linies.push(actual);
      actual = ` ${paraula}`;
    } else {
      actual += ` ${paraula}`;
    }
  }
  linies.push(actual);
  return linies.join(CRLF);
}

function capcaleraAssumpte(assumpte) {
  const ascii = /^[\x20-\x7E]*$/.test(assumpte) && !assumpte.includes('=?') && !/\S{70,}/.test(assumpte);
  if (ascii) return plegaAscii('Subject: ', assumpte);
  return `Subject: ${paraulesCodificades(assumpte).join(`${CRLF} `)}`;
}

function dataRfc5322(data) {
  const ms = Object.prototype.toString.call(data) === '[object Date]' ? data.getTime() : NaN;
  if (!Number.isFinite(ms)) throw new ErrorCorreu('DATA_INVALIDA', 'La data del correu no és vàlida.');
  return new Date(ms).toUTCString().replace(/GMT$/, '+0000');
}

function nomAscii(nom) {
  const net = nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_').trim();
  return net || 'adjunt';
}

/* RFC 2231: percentatge sobre l'UTF-8, deixant només lletres, xifres i «-._~»
   (més estricte que attr-char, que també és vàlid). */
const percentatge = (nom) => encodeURIComponent(nom)
  .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

function trossosPercentatge(text) {
  const trossos = [];
  let i = 0;
  while (i < text.length) {
    let fi = Math.min(i + TROS_RFC2231, text.length);
    /* No es partix cap %XX. */
    if (text[fi - 1] === '%') fi -= 1;
    else if (text[fi - 2] === '%') fi -= 2;
    trossos.push(text.slice(i, fi));
    i = fi;
  }
  return trossos;
}

function parametresNom(nom) {
  const ascii = `filename="${nomAscii(nom)}"`;
  const trossos = trossosPercentatge(percentatge(nom));
  if (trossos.length === 1) return [ascii, `filename*=UTF-8''${trossos[0]}`];
  return [ascii, ...trossos.map((tros, i) => `filename*${i}*=${i === 0 ? 'UTF-8\'\'' : ''}${tros}`)];
}

function tipusMime(tipus) {
  if (tipus === undefined || tipus === null || tipus === '') return 'application/octet-stream';
  if (typeof tipus !== 'string') return null;
  const [base, ...params] = tipus.split(';').map((p) => p.trim());
  if (!PATRO_TIPUS.test(base)) return null;
  const minuscules = base.toLowerCase();
  const charset = params.map((p) => PATRO_CHARSET.exec(p)).find(Boolean);
  if (charset) return `${minuscules}; charset=${charset[1]}`;
  /* El text que genera la Gestoria és UTF-8 (TextEncoder). */
  return minuscules.startsWith('text/') ? `${minuscules}; charset=utf-8` : minuscules;
}

function partAdjunt(adjunt, posicio) {
  const que = `L'adjunt ${posicio + 1}`;
  if (adjunt === null || typeof adjunt !== 'object') throw new ErrorCorreu('ADJUNT_INVALID', `${que} ha de ser { nom, tipus, dades }.`);
  const { nom, tipus, dades } = adjunt;
  if (typeof nom !== 'string' || !nom.trim() || nom.length > 255
    || /[\u0000-\u001F\u007F/\\]/.test(nom)) {
    throw new ErrorCorreu('ADJUNT_INVALID', `${que} necessita un nom de fitxer sense barres ni caràcters de control.`);
  }
  try {
    encodeURIComponent(nom);
  } catch {
    throw new ErrorCorreu('ADJUNT_INVALID', `${que} té un nom amb caràcters trencats.`);
  }
  const mime = tipusMime(tipus);
  if (!mime) throw new ErrorCorreu('ADJUNT_INVALID', `L'adjunt «${nom}» té un tipus MIME invàlid.`);
  const bytes = aBytes(dades);
  if (!bytes) throw new ErrorCorreu('ADJUNT_INVALID', `L'adjunt «${nom}» no porta bytes (Uint8Array).`);
  if (!bytes.length) throw new ErrorCorreu('ADJUNT_INVALID', `L'adjunt «${nom}» és buit.`);
  return {
    capcaleres: [
      `Content-Type: ${mime};${CRLF} name="${nomAscii(nom)}"`,
      `Content-Disposition: attachment;${CRLF} ${parametresNom(nom).join(`;${CRLF} `)}`,
      'Content-Transfer-Encoding: base64'
    ].join(CRLF),
    cos: enLinies(base64Estandard(bytes), 76)
  };
}

function limitAleatori() {
  const cripto = globalThis.crypto;
  let bytes = new Uint8Array(16);
  if (typeof cripto?.getRandomValues === 'function') bytes = cripto.getRandomValues(bytes);
  else bytes = bytes.map(() => Math.floor(Math.random() * 256));
  /* «=_» no pot aparéixer ni en quoted-printable ni en base64. */
  return `=_sdp_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * L'esborrany sencer en RFC 5322/MIME, amb línies CRLF: multipart/mixed amb
 * el text (quoted-printable, UTF-8) i els adjunts en base64. `X-Unsent: 1`
 * fa que Outlook l'obriga com a esborrany per a enviar. Sense `de`, no hi ha
 * capçalera From: la posa el programa de correu. `limit` és per a proves.
 */
export function construeixEml({
  per, assumpte, cos = '', adjunts = [], esborrany = true, de = null, data = null, limit
} = {}) {
  const desti = adrecaObligatoria(per, 'El destinatari');
  const remitent = de === null || de === undefined || de === '' ? null : adrecaObligatoria(de, 'El remitent');
  const su = assumpteNet(assumpte);
  const text = cosNet(cos);
  if (!Array.isArray(adjunts)) throw new ErrorCorreu('ADJUNT_INVALID', 'Els adjunts han de ser una llista.');
  const parts = adjunts.map(partAdjunt);
  const cosQp = quotedPrintable(text);
  const continguts = [cosQp, ...parts.flatMap((p) => [p.capcaleres, p.cos])];

  let frontera;
  if (limit === undefined) {
    do frontera = limitAleatori();
    while (continguts.some((c) => c.includes(`--${frontera}`)));
  } else {
    if (typeof limit !== 'string' || !PATRO_LIMIT.test(limit)) {
      throw new ErrorCorreu('LIMIT_INVALID', 'El límit MIME ha de tindre d\'1 a 70 caràcters vàlids (RFC 2046).');
    }
    if (continguts.some((c) => c.includes(`--${limit}`))) {
      throw new ErrorCorreu('LIMIT_INVALID', 'El límit MIME apareix dins del contingut.');
    }
    frontera = limit;
  }

  const capcaleres = [];
  if (remitent) capcaleres.push(`From: ${remitent}`);
  capcaleres.push(`To: ${desti}`, capcaleraAssumpte(su));
  if (data !== null && data !== undefined) capcaleres.push(`Date: ${dataRfc5322(data)}`);
  capcaleres.push('MIME-Version: 1.0');
  if (esborrany) capcaleres.push('X-Unsent: 1');
  capcaleres.push(`Content-Type: multipart/mixed;${CRLF} boundary="${frontera}"`);

  return [
    ...capcaleres,
    '',
    'Missatge en format MIME.',
    `--${frontera}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    cosQp,
    ...parts.flatMap((p) => [`--${frontera}`, p.capcaleres, '', p.cos]),
    `--${frontera}--`,
    ''
  ].join(CRLF);
}

/* ── Compartir ─────────────────────────────────────────────────────────── */

/** Els adjunts com a File, per al menú de compartir del sistema. */
export function fitxersPerCompartir(adjunts, Fitxer = globalThis.File) {
  if (typeof Fitxer !== 'function') throw new ErrorCorreu('ADJUNT_INVALID', 'Este navegador no sap crear fitxers.');
  if (!Array.isArray(adjunts)) throw new ErrorCorreu('ADJUNT_INVALID', 'Els adjunts han de ser una llista.');
  return adjunts.map((adjunt, i) => {
    partAdjunt(adjunt, i);
    return new Fitxer([aBytes(adjunt.dades)], adjunt.nom, { type: tipusMime(adjunt.tipus).split(';')[0] });
  });
}

/**
 * Si el navegador pot compartir fitxers (Web Share amb `files`). Sense
 * `fitxers`, prova amb un .xlsx mínim. Chrome d'escriptori no admet .xlsx;
 * Safari sí: per això es prova amb els fitxers de veritat quan n'hi ha.
 */
export function potCompartirFitxers(nav = globalThis.navigator, fitxers = null) {
  if (!nav || typeof nav.share !== 'function' || typeof nav.canShare !== 'function') return false;
  let prova = fitxers;
  if (!Array.isArray(prova) || prova.length === 0) {
    const Fitxer = globalThis.File;
    if (typeof Fitxer !== 'function') return false;
    try {
      prova = [new Fitxer([new Uint8Array([0x50, 0x4b])], 'prova.xlsx', { type: TIPUS_XLSX })];
    } catch {
      return false;
    }
  }
  try {
    return nav.canShare({ files: prova }) === true;
  } catch {
    return false;
  }
}
