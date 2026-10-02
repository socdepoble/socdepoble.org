import { describe, expect, test, vi } from 'vitest';
import {
  CODIS_CORREU, ErrorCorreu, PLANTILLA_CORREU_PER_DEFECTE, TIPUS_CSV, TIPUS_EML, TIPUS_XLSX,
  adrecaValida, base64Estandard, construeixEml, fitxersPerCompartir, nomEsborrany, ompliPlantilla,
  potCompartirFitxers, urlRedaccioGmail, valorsCorreu
} from './correuGestoria.js';

/* El coixinet es construïx: a src/ no hi pot haver cap coixinet literal davant d'un número. */
const COIXINET = String.fromCharCode(35);
const PER = 'gestoria@example.org';

const codiDe = (fn) => {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorCorreu);
    return error.codi;
  }
  return null;
};

/* ── Analitzador mínim d'un .eml, independent del que el construïx ─────── */

const bytesDeBinari = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));
const desfesBase64 = (text) => bytesDeBinari(atob(text.replace(/\r\n/g, '')));
const utf8 = (bytes) => new TextDecoder('utf-8', { fatal: true }).decode(bytes);

function desfesQp(text) {
  const net = text.replace(/=\r\n/g, '');
  const bytes = [];
  for (let i = 0; i < net.length; i += 1) {
    if (net[i] === '=') {
      expect(net.slice(i + 1, i + 3)).toMatch(/^[0-9A-F]{2}$/);
      bytes.push(parseInt(net.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(net.charCodeAt(i));
    }
  }
  return utf8(new Uint8Array(bytes));
}

function capcaleres(bloc) {
  const camps = [];
  for (const linia of bloc.split('\r\n')) {
    if (/^[ \t]/.test(linia)) camps[camps.length - 1].valor += linia;
    else {
      const dos = linia.indexOf(':');
      expect(dos).toBeGreaterThan(0);
      camps.push({ nom: linia.slice(0, dos), valor: linia.slice(dos + 1).trim() });
    }
  }
  return camps;
}

const valorDe = (camps, nom) => camps.find((c) => c.nom.toLowerCase() === nom.toLowerCase())?.valor;

function parametres(valor) {
  const params = {};
  for (const m of valor.matchAll(/;\s*([^=\s;]+)\s*=\s*("(?:[^"\\]|\\.)*"|[^;]*)/g)) {
    params[m[1].toLowerCase()] = m[2].trim().replace(/^"|"$/g, '');
  }
  return params;
}

function desfesRfc2047(valor) {
  return valor.replace(/\?=\s+=\?/g, '?==?').replace(/=\?UTF-8\?B\?([^?]*)\?=/gi, (_, b64) => utf8(desfesBase64(b64)));
}

function nomRfc2231(params) {
  if (params['filename*']) return decodeURIComponent(params['filename*'].replace(/^UTF-8''/i, ''));
  const trossos = [];
  for (let i = 0; params[`filename*${i}*`] !== undefined; i += 1) trossos.push(params[`filename*${i}*`]);
  return trossos.length ? decodeURIComponent(trossos.join('').replace(/^UTF-8''/i, '')) : null;
}

function parsejaEml(eml) {
  const fi = eml.indexOf('\r\n\r\n');
  expect(fi).toBeGreaterThan(0);
  const principals = capcaleres(eml.slice(0, fi));
  const limit = parametres(valorDe(principals, 'Content-Type')).boundary;
  expect(limit).toBeTruthy();
  const cos = eml.slice(fi + 4);
  expect(eml.endsWith(`\r\n--${limit}--\r\n`)).toBe(true);
  const trossos = cos.slice(0, cos.lastIndexOf(`\r\n--${limit}--`)).split(`\r\n--${limit}\r\n`);
  const parts = trossos.slice(1).map((tros) => {
    const separador = tros.indexOf('\r\n\r\n');
    return { capcaleres: capcaleres(tros.slice(0, separador)), cos: tros.slice(separador + 4) };
  });
  return { principals, limit, preambul: trossos[0], parts };
}

/* ── Plantilla ─────────────────────────────────────────────────────────── */

describe('plantilla', () => {
  test('la plantilla per defecte és la de sempre i no es pot canviar', () => {
    expect(PLANTILLA_CORREU_PER_DEFECTE).toEqual({
      assumpte: '{nom} - {n}T - {any}',
      cos: 'Hola{salutacio}, ací tens la facturació del {n}T.\n\nBon dia'
    });
    expect(Object.isFrozen(PLANTILLA_CORREU_PER_DEFECTE)).toBe(true);
  });

  test('sense persona la salutació és «Hola,»; amb persona, «Hola Nom,»', () => {
    const sense = valorsCorreu({ nom: 'Empresa de Prova', any: 2026, t: 1 });
    expect(sense).toEqual({ nom: 'Empresa de Prova', n: '1', any: '2026', salutacio: '' });
    expect(ompliPlantilla(PLANTILLA_CORREU_PER_DEFECTE.assumpte, sense)).toEqual({ text: 'Empresa de Prova - 1T - 2026', avisos: [] });
    expect(ompliPlantilla(PLANTILLA_CORREU_PER_DEFECTE.cos, sense).text).toBe('Hola, ací tens la facturació del 1T.\n\nBon dia');

    const amb = valorsCorreu({ nom: '  Empresa de Prova ', persona: ' Gestora\nde Prova ', any: '2026', t: '3' });
    expect(amb.salutacio).toBe(' Gestora de Prova');
    expect(ompliPlantilla(PLANTILLA_CORREU_PER_DEFECTE.cos, amb).text).toBe('Hola Gestora de Prova, ací tens la facturació del 3T.\n\nBon dia');
  });

  test('un marcador desconegut es queda tal qual i s’avisa una sola vegada', () => {
    const { text, avisos } = ompliPlantilla('{nom} {x} {x} {y} {nom}', { nom: 'A' });
    expect(text).toBe('A {x} {x} {y} A');
    expect(avisos.map((a) => a.marcador)).toEqual(['{x}', '{y}']);
    expect(avisos[0]).toEqual({ codi: 'MARCADOR_DESCONEGUT', marcador: '{x}', missatge: 'El marcador {x} no té valor: s\'ha deixat tal qual.' });
  });

  test('null o undefined compten com a desconeguts; el text buit és un valor', () => {
    expect(ompliPlantilla('[{a}][{b}][{c}]', { a: null, b: undefined, c: '' })).toEqual({
      text: '[{a}][{b}][]',
      avisos: [expect.objectContaining({ marcador: '{a}' }), expect.objectContaining({ marcador: '{b}' })]
    });
  });

  test('una sola passada: un valor amb marcadors no es torna a substituir', () => {
    expect(ompliPlantilla('{nom}-{any}', { nom: '{any}', any: 2026 }).text).toBe('{any}-2026');
  });

  test('les claus no es busquen al prototip i les claus no vàlides no són marcadors', () => {
    expect(ompliPlantilla('{toString} {constructor}', {}).avisos).toHaveLength(2);
    expect(ompliPlantilla('{ nom } {1} {{nom}} {}', { nom: 'A' })).toEqual({ text: '{ nom } {1} {A} {}', avisos: [] });
    expect(ompliPlantilla('{nom}', null).text).toBe('{nom}');
  });

  test('una plantilla que no és text és un error', () => {
    expect(codiDe(() => ompliPlantilla(undefined, {}))).toBe('PLANTILLA_INVALIDA');
    expect(codiDe(() => ompliPlantilla(42, {}))).toBe('PLANTILLA_INVALIDA');
  });

  test.each([
    [{ any: 2026, t: 0 }], [{ any: 2026, t: 5 }], [{ any: 2026, t: 1.5 }], [{ any: 2026, t: 'x' }],
    [{ any: 2026 }], [{ any: 26, t: 1 }], [{ any: '20x6', t: 1 }], [{ any: null, t: 1 }], [{ any: 2026, t: true }]
  ])('període invàlid %o', (valors) => {
    expect(codiDe(() => valorsCorreu(valors))).toBe('PERIODE_INVALID');
  });

  test('el nom de l’esborrany és ASCII i porta el període', () => {
    expect(nomEsborrany({ any: 2026, t: 1 })).toBe('esborrany_gestoria_2026_1T.eml');
    expect(nomEsborrany({ any: '2025', t: '4' })).toBe('esborrany_gestoria_2025_4T.eml');
    expect(codiDe(() => nomEsborrany({ any: 2026, t: 9 }))).toBe('PERIODE_INVALID');
  });

  test('constants i codis', () => {
    expect(TIPUS_XLSX).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(TIPUS_CSV).toBe('text/csv');
    expect(TIPUS_EML).toBe('message/rfc822');
    expect(CODIS_CORREU).toContain('ADRECA_INVALIDA');
    expect(Object.isFrozen(CODIS_CORREU)).toBe(true);
  });
});

/* ── Adreces ───────────────────────────────────────────────────────────── */

describe('adrecaValida', () => {
  test.each([PER, 'nom.cognom+factures@sub.example.com', 'A_B-c@example.co.uk', '  gestoria@example.org  ', 'x@xn--prova-abc.example.org'])(
    'accepta %s', (adreca) => expect(adrecaValida(adreca)).toBe(true)
  );
  test.each([
    '', 'gestoria', '@example.org', 'gestoria@', 'gestoria@example', 'gestoria@example.o',
    'gestoria@example.org&cc=espia@example.com', 'gestoria@example.org?cc=espia@example.com',
    'gestoria@example.org, altra@example.org', 'gestoria@example.org;altra@example.org',
    'Gestoria <gestoria@example.org>', 'gestoria @example.org', 'gestoria@exa mple.org',
    'gestoria@example.org\r\nBcc: espia@example.com', 'gestoria@example.org\nBcc: espia@example.com',
    'a@@example.org', '.gestoria@example.org', 'gestoria.@example.org', 'ges..toria@example.org',
    'gestoria@-example.org', 'gestoria@example-.org', 'gestoria@example..org', 'gestoria%40x@example.org',
    `gestoria@example.org${COIXINET}x`, 'gestòria@example.org', `${'a'.repeat(65)}@example.org`,
    `a@${'b'.repeat(250)}.org`
  ])('rebutja %j', (adreca) => expect(adrecaValida(adreca)).toBe(false));
  test('rebutja el que no és text', () => {
    expect(adrecaValida(null)).toBe(false);
    expect(adrecaValida(undefined)).toBe(false);
    expect(adrecaValida(['gestoria@example.org'])).toBe(false);
  });
});

/* ── URL de Gmail ──────────────────────────────────────────────────────── */

describe('urlRedaccioGmail', () => {
  test('forma exacta: view=cm, fs=1, tf=1, to, su i body, en eixe ordre', () => {
    const url = urlRedaccioGmail({ per: PER, assumpte: 'Empresa de Prova - 1T - 2026', cos: 'Hola, ací tens la facturació del 1T.\n\nBon dia' });
    expect(url).toBe('https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=gestoria%40example.org'
      + '&su=Empresa%20de%20Prova%20-%201T%20-%202026'
      + '&body=Hola%2C%20ac%C3%AD%20tens%20la%20facturaci%C3%B3%20del%201T.%0A%0ABon%20dia');
    const u = new URL(url);
    expect(u.origin).toBe('https://mail.google.com');
    expect(u.pathname).toBe('/mail/');
    expect([...u.searchParams.keys()]).toEqual(['view', 'fs', 'tf', 'to', 'su', 'body']);
  });

  test('caràcters especials, accents, emojis i salts de línia tornen intactes', () => {
    const assumpte = `Factures & rebuts ? = + % ${COIXINET}1 «àèéíòóúç·l» 🧾`;
    const cos = 'Primera línia\r\nSegona & tercera?\rQuarta: 100 % + IVA = total\n\nFi';
    const u = new URL(urlRedaccioGmail({ per: PER, assumpte, cos }));
    expect(u.hash).toBe('');
    expect(u.searchParams.get('su')).toBe(assumpte);
    expect(u.searchParams.get('body')).toBe('Primera línia\nSegona & tercera?\nQuarta: 100 % + IVA = total\n\nFi');
    expect([...u.searchParams.keys()]).toEqual(['view', 'fs', 'tf', 'to', 'su', 'body']);
  });

  test('un intent d’injecció a l’assumpte o al text no crea cap paràmetre nou', () => {
    const u = new URL(urlRedaccioGmail({
      per: PER,
      assumpte: 'Hola&cc=espia@example.com&bcc=altra@example.com',
      cos: 'x&to=espia@example.com&su=fals'
    }));
    expect(u.searchParams.getAll('cc')).toEqual([]);
    expect(u.searchParams.getAll('bcc')).toEqual([]);
    expect(u.searchParams.getAll('to')).toEqual([PER]);
    expect(u.searchParams.getAll('su')).toEqual(['Hola&cc=espia@example.com&bcc=altra@example.com']);
  });

  test('un intent d’injecció al destinatari és un error, no una URL', () => {
    for (const per of ['gestoria@example.org&cc=espia@example.com', 'gestoria@example.org?su=x', 'gestoria@example.org%26cc%3Despia@example.com']) {
      expect(codiDe(() => urlRedaccioGmail({ per, assumpte: 'A' }))).toBe('ADRECA_INVALIDA');
    }
  });

  test('l’assumpte és d’una línia: salts i espais repetits es tornen un espai', () => {
    const u = new URL(urlRedaccioGmail({ per: ` ${PER} `, assumpte: '  Empresa\r\n de\tProva  ', cos: null }));
    expect(u.searchParams.get('to')).toBe(PER);
    expect(u.searchParams.get('su')).toBe('Empresa de Prova');
    expect(u.searchParams.get('body')).toBe('');
  });

  test('compte: /mail/u/<n>/ amb un enter; qualsevol altra cosa és un error', () => {
    expect(new URL(urlRedaccioGmail({ per: PER, assumpte: 'A', compte: 0 })).pathname).toBe('/mail/u/0/');
    expect(urlRedaccioGmail({ per: PER, assumpte: 'A', compte: 2 })).toMatch(/^https:\/\/mail\.google\.com\/mail\/u\/2\/\?view=cm&fs=1&tf=1&to=/);
    expect(new URL(urlRedaccioGmail({ per: PER, assumpte: 'A', compte: undefined })).pathname).toBe('/mail/');
    for (const compte of [-1, 1.5, '1', NaN, Infinity, '1/../x']) {
      expect(codiDe(() => urlRedaccioGmail({ per: PER, assumpte: 'A', compte }))).toBe('COMPTE_INVALID');
    }
  });

  test('casos d’error', () => {
    expect(codiDe(() => urlRedaccioGmail())).toBe('ADRECA_INVALIDA');
    expect(codiDe(() => urlRedaccioGmail({ per: PER }))).toBe('ASSUMPTE_BUIT');
    expect(codiDe(() => urlRedaccioGmail({ per: PER, assumpte: ' \r\n\t ' }))).toBe('ASSUMPTE_BUIT');
    expect(codiDe(() => urlRedaccioGmail({ per: PER, assumpte: 'A', cos: 42 }))).toBe('TEXT_INVALID');
    expect(codiDe(() => urlRedaccioGmail({ per: PER, assumpte: 'A', cos: 'trencat \uD800 ací' }))).toBe('TEXT_INVALID');
    expect(codiDe(() => urlRedaccioGmail({ per: PER, assumpte: 'trencat \uDC00' }))).toBe('TEXT_INVALID');
  });
});

/* ── Base64 ────────────────────────────────────────────────────────────── */

describe('base64Estandard', () => {
  const ascii = (text) => new TextEncoder().encode(text);
  test('vectors de l’RFC 4648', () => {
    expect(['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar'].map((t) => base64Estandard(ascii(t))))
      .toEqual(['', 'Zg==', 'Zm8=', 'Zm9v', 'Zm9vYg==', 'Zm9vYmE=', 'Zm9vYmFy']);
  });
  test('els 256 bytes, també des d’un ArrayBuffer o una vista parcial', () => {
    const tots = Uint8Array.from({ length: 256 }, (_, i) => i);
    const esperat = btoa(String.fromCharCode(...tots));
    expect(base64Estandard(tots)).toBe(esperat);
    expect(base64Estandard(tots.buffer)).toBe(esperat);
    expect(base64Estandard(new Uint8Array(tots.buffer, 10, 5))).toBe(btoa(String.fromCharCode(10, 11, 12, 13, 14)));
  });
  test('rebutja el que no són bytes', () => {
    expect(() => base64Estandard('abc')).toThrow(TypeError);
  });
});

/* ── EML ───────────────────────────────────────────────────────────────── */

describe('construeixEml', () => {
  const BYTES = Uint8Array.from({ length: 1000 }, (_, i) => (i * 37 + 11) % 256);
  const XLSX = { nom: '2026-FACTURACIO-Empresa_de_Prova_-_1T.xlsx', tipus: TIPUS_XLSX, dades: BYTES };
  const base = {
    per: PER,
    assumpte: 'Empresa de Prova - 1T - 2026',
    cos: 'Hola, ací tens la facturació del 1T.\n\nBon dia',
    adjunts: [XLSX],
    limit: '=_sdp_prova'
  };

  test('ben format: CRLF, capçaleres, límits i línies curtes', () => {
    const eml = construeixEml(base);
    const linies = eml.split('\r\n');
    expect(linies.every((l) => !l.includes('\r') && !l.includes('\n'))).toBe(true);
    expect(linies.every((l) => l.length <= 998)).toBe(true);

    const { principals, limit, parts, preambul } = parsejaEml(eml);
    expect(limit).toBe('=_sdp_prova');
    expect(principals.map((c) => c.nom)).toEqual(['To', 'Subject', 'MIME-Version', 'X-Unsent', 'Content-Type']);
    expect(valorDe(principals, 'To')).toBe(PER);
    expect(valorDe(principals, 'Subject')).toBe('Empresa de Prova - 1T - 2026');
    expect(valorDe(principals, 'MIME-Version')).toBe('1.0');
    expect(valorDe(principals, 'X-Unsent')).toBe('1');
    expect(valorDe(principals, 'Content-Type')).toMatch(/^multipart\/mixed;/);
    expect(valorDe(principals, 'From')).toBeUndefined();
    expect(valorDe(principals, 'Date')).toBeUndefined();
    expect(preambul).not.toContain(`--${limit}`);
    expect(parts).toHaveLength(2);

    const [text, adjunt] = parts;
    expect(valorDe(text.capcaleres, 'Content-Type')).toBe('text/plain; charset=utf-8');
    expect(valorDe(text.capcaleres, 'Content-Transfer-Encoding')).toBe('quoted-printable');
    expect(desfesQp(text.cos)).toBe('Hola, ací tens la facturació del 1T.\r\n\r\nBon dia');

    expect(valorDe(adjunt.capcaleres, 'Content-Transfer-Encoding')).toBe('base64');
    const tipus = valorDe(adjunt.capcaleres, 'Content-Type');
    expect(tipus.split(';')[0]).toBe(TIPUS_XLSX);
    expect(parametres(tipus).name).toBe(XLSX.nom);
    const disposicio = valorDe(adjunt.capcaleres, 'Content-Disposition');
    expect(disposicio.split(';')[0]).toBe('attachment');
    expect(parametres(disposicio).filename).toBe(XLSX.nom);
    expect(nomRfc2231(parametres(disposicio))).toBe(XLSX.nom);
  });

  test('el base64 de l’adjunt va en línies de 76 i torna els bytes exactes', () => {
    const { parts } = parsejaEml(construeixEml(base));
    const linies = parts[1].cos.split('\r\n');
    expect(linies.slice(0, -1).every((l) => l.length === 76)).toBe(true);
    expect(linies[linies.length - 1].length).toBeLessThanOrEqual(76);
    expect(linies.every((l) => /^[A-Za-z0-9+/]+=*$/.test(l))).toBe(true);
    expect(Array.from(desfesBase64(parts[1].cos))).toEqual(Array.from(BYTES));
  });

  test.each([1, 2, 3, 56, 57, 58, 59])('adjunts de %i bytes tornen exactes', (n) => {
    const dades = Uint8Array.from({ length: n }, (_, i) => 255 - i);
    const { parts } = parsejaEml(construeixEml({ ...base, adjunts: [{ nom: 'a.bin', tipus: 'application/octet-stream', dades }] }));
    expect(Array.from(desfesBase64(parts[1].cos))).toEqual(Array.from(dades));
  });

  test('un nom curt amb accents va en un sol filename* (RFC 2231)', () => {
    const nom = 'Facturació còpia.xlsx';
    const disposicio = parametres(valorDe(parsejaEml(construeixEml({ ...base, adjunts: [{ ...XLSX, nom }] })).parts[1].capcaleres, 'Content-Disposition'));
    expect(disposicio['filename*']).toBe('UTF-8\'\'Facturaci%C3%B3%20c%C3%B2pia.xlsx');
    expect(disposicio.filename).toBe('Facturacio copia.xlsx');
    expect(nomRfc2231(disposicio)).toBe(nom);
  });

  test('noms amb accents i signes: RFC 2231 i nom ASCII de reserva', () => {
    const nom = 'Facturació 1T – còpia «d’arxiu» l·l (bis)*!.csv';
    const dades = new TextEncoder().encode('data,import\r\n2026-01-02,"12,10"\r\n');
    const { parts } = parsejaEml(construeixEml({ ...base, adjunts: [{ nom, tipus: TIPUS_CSV, dades }] }));
    const adjunt = parts[1];
    const tipus = valorDe(adjunt.capcaleres, 'Content-Type');
    expect(tipus).toMatch(/^text\/csv; charset=utf-8;/);
    expect(parametres(tipus).name).toBe('Facturacio 1T _ copia _d_arxiu_ l_l (bis)*!.csv');
    const disposicio = parametres(valorDe(adjunt.capcaleres, 'Content-Disposition'));
    expect(disposicio.filename).toBe('Facturacio 1T _ copia _d_arxiu_ l_l (bis)*!.csv');
    expect(/^[\x20-\x7E]*$/.test(disposicio.filename)).toBe(true);
    const estesos = Object.entries(disposicio).filter(([clau]) => clau.startsWith('filename*'));
    expect(estesos.length).toBeGreaterThan(0);
    for (const [, valor] of estesos) expect(valor).toMatch(/^(UTF-8'')?[A-Za-z0-9%._~-]+$/);
    expect(nomRfc2231(disposicio)).toBe(nom);
    expect(utf8(desfesBase64(adjunt.cos))).toBe('data,import\r\n2026-01-02,"12,10"\r\n');
  });

  test('un nom molt llarg es partix en continuacions RFC 2231 sense trencar cap %XX', () => {
    const nom = `${'àé'.repeat(60)}.xlsx`;
    const eml = construeixEml({ ...base, adjunts: [{ ...XLSX, nom }] });
    expect(eml.split('\r\n').every((l) => l.length <= 998)).toBe(true);
    const disposicio = parametres(valorDe(parsejaEml(eml).parts[1].capcaleres, 'Content-Disposition'));
    expect(disposicio['filename*']).toBeUndefined();
    expect(disposicio['filename*0*']).toMatch(/^UTF-8''/);
    expect(disposicio['filename*1*']).toBeDefined();
    for (const [clau, valor] of Object.entries(disposicio)) {
      if (clau.startsWith('filename*')) expect(valor.replace(/^UTF-8''/, '')).not.toMatch(/%.?$/);
    }
    expect(nomRfc2231(disposicio)).toBe(nom);
  });

  test('l’assumpte amb accents va en RFC 2047, plegat i sencer', () => {
    const assumpte = 'Facturació del 1T de 2026 · Empresa de Prova amb un nom prou llarg per a plegar-lo en dues línies 🧾';
    const eml = construeixEml({ ...base, assumpte });
    const linies = eml.slice(0, eml.indexOf('\r\n\r\n')).split('\r\n');
    expect(linies.every((l) => l.length <= 78)).toBe(true);
    const valor = valorDe(parsejaEml(eml).principals, 'Subject');
    expect(valor).toMatch(/^=\?UTF-8\?B\?/);
    expect(desfesRfc2047(valor)).toBe(assumpte);
  });

  test('un assumpte ASCII llarg es plega pels espais i torna sencer', () => {
    const assumpte = Array.from({ length: 30 }, (_, i) => `paraula${i}`).join(' ');
    const eml = construeixEml({ ...base, assumpte });
    expect(eml.slice(0, eml.indexOf('\r\n\r\n')).split('\r\n').every((l) => l.length <= 78)).toBe(true);
    expect(valorDe(parsejaEml(eml).principals, 'Subject')).toBe(assumpte);
  });

  test('un intent d’injecció de capçaleres a l’assumpte no crea cap capçalera', () => {
    const eml = construeixEml({ ...base, assumpte: 'Factures\r\nBcc: espia@example.com\r\n\r\nCos fals' });
    const { principals } = parsejaEml(eml);
    expect(principals.map((c) => c.nom)).not.toContain('Bcc');
    expect(eml.split('\r\n').some((l) => /^bcc:/i.test(l))).toBe(false);
    expect(valorDe(principals, 'Subject')).toBe('Factures Bcc: espia@example.com Cos fals');
  });

  test('el text del correu: QP amb línies ≤ 76, espais finals codificats i bytes exactes', () => {
    const cos = `${'Línia llarga amb accents àèìòù i signes = & % '.repeat(6)}\nAmb espai final \nAmb tab final\t\n.punt inicial\nFrom a l'inici\n\n🧾 fi`;
    const { parts } = parsejaEml(construeixEml({ ...base, cos }));
    const qp = parts[0].cos;
    expect(qp.split('\r\n').every((l) => l.length <= 76)).toBe(true);
    expect(qp.split('\r\n').every((l) => !/[ \t]$/.test(l))).toBe(true);
    expect(/^[\x20-\x7E]*$/.test(qp.replace(/\r\n/g, ''))).toBe(true);
    expect(desfesQp(qp)).toBe(cos.replace(/\n/g, '\r\n'));
  });

  test('esborrany: X-Unsent només si es demana; From i Date només si es donen', () => {
    const enviat = parsejaEml(construeixEml({ ...base, esborrany: false })).principals;
    expect(valorDe(enviat, 'X-Unsent')).toBeUndefined();
    const amb = parsejaEml(construeixEml({ ...base, de: 'jo@example.com', data: new Date(Date.UTC(2026, 9, 2, 8, 5, 9)) })).principals;
    expect(amb.map((c) => c.nom)).toEqual(['From', 'To', 'Subject', 'Date', 'MIME-Version', 'X-Unsent', 'Content-Type']);
    expect(valorDe(amb, 'From')).toBe('jo@example.com');
    expect(valorDe(amb, 'Date')).toBe('Fri, 02 Oct 2026 08:05:09 +0000');
  });

  test('diversos adjunts i cap adjunt', () => {
    const csv = { nom: 'full.csv', tipus: TIPUS_CSV, dades: new Uint8Array([0xef, 0xbb, 0xbf, 0x61]) };
    const { parts } = parsejaEml(construeixEml({ ...base, adjunts: [XLSX, csv] }));
    expect(parts).toHaveLength(3);
    expect(Array.from(desfesBase64(parts[2].cos))).toEqual([0xef, 0xbb, 0xbf, 0x61]);
    expect(parsejaEml(construeixEml({ ...base, adjunts: [] })).parts).toHaveLength(1);
  });

  test('tipus MIME: charset propi conservat, text/* en UTF-8 i buit com a octet-stream', () => {
    const tipusDe = (tipus) => valorDe(parsejaEml(construeixEml({ ...base, adjunts: [{ ...XLSX, tipus }] })).parts[1].capcaleres, 'Content-Type').split(';').slice(0, 2).map((p) => p.trim()).join('; ');
    expect(tipusDe('text/csv;charset=windows-1252')).toBe('text/csv; charset=windows-1252');
    expect(tipusDe('TEXT/CSV')).toBe('text/csv; charset=utf-8');
    expect(tipusDe(undefined)).toBe('application/octet-stream; name="2026-FACTURACIO-Empresa_de_Prova_-_1T.xlsx"');
  });

  test('el límit és aleatori per defecte, vàlid i diferent a cada esborrany', () => {
    const { limit, ...resta } = base;
    expect(limit).toBeTruthy();
    const a = parsejaEml(construeixEml(resta)).limit;
    const b = parsejaEml(construeixEml(resta)).limit;
    expect(a).not.toBe(b);
    for (const l of [a, b]) {
      expect(l).toMatch(/^=_sdp_[0-9a-f]{32}$/);
    }
  });

  test('sense crypto.getRandomValues el límit continua sent vàlid', () => {
    vi.stubGlobal('crypto', undefined);
    try {
      const { limit, ...resta } = base;
      expect(limit).toBeTruthy();
      expect(parsejaEml(construeixEml(resta)).limit).toMatch(/^=_sdp_[0-9a-f]{32}$/);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  test('un límit injectat invàlid o que apareix al contingut és un error', () => {
    for (const limit of ['', 'amb espai', 'cometa"', 'x'.repeat(71), 42, 'accent-à']) {
      expect(codiDe(() => construeixEml({ ...base, limit }))).toBe('LIMIT_INVALID');
    }
    expect(codiDe(() => construeixEml({ ...base, cos: 'abans\n--frontera\ndespres', limit: 'frontera' }))).toBe('LIMIT_INVALID');
  });

  test('casos d’error', () => {
    expect(codiDe(() => construeixEml())).toBe('ADRECA_INVALIDA');
    expect(codiDe(() => construeixEml({ ...base, per: 'gestoria@example.org\r\nBcc: espia@example.com' }))).toBe('ADRECA_INVALIDA');
    expect(codiDe(() => construeixEml({ ...base, de: 'no és una adreça' }))).toBe('ADRECA_INVALIDA');
    expect(codiDe(() => construeixEml({ ...base, assumpte: '' }))).toBe('ASSUMPTE_BUIT');
    expect(codiDe(() => construeixEml({ ...base, cos: 'x \uD800' }))).toBe('TEXT_INVALID');
    expect(codiDe(() => construeixEml({ ...base, data: new Date(NaN) }))).toBe('DATA_INVALIDA');
    expect(codiDe(() => construeixEml({ ...base, data: '2026-10-02' }))).toBe('DATA_INVALIDA');
    expect(codiDe(() => construeixEml({ ...base, adjunts: 'full.xlsx' }))).toBe('ADJUNT_INVALID');
    for (const adjunt of [
      null, 'full.xlsx', { ...XLSX, nom: '' }, { ...XLSX, nom: '   ' }, { ...XLSX, nom: 'a/b.xlsx' },
      { ...XLSX, nom: 'a\\b.xlsx' }, { ...XLSX, nom: 'a\r\nb.xlsx' }, { ...XLSX, nom: 'x'.repeat(256) },
      { ...XLSX, nom: 'trencat\uD800.xlsx' }, { ...XLSX, tipus: 'no-es-un-tipus' }, { ...XLSX, tipus: 'text/csv\r\nX: y' },
      { ...XLSX, tipus: 42 }, { ...XLSX, dades: 'text' }, { ...XLSX, dades: [1, 2, 3] }, { ...XLSX, dades: new Uint8Array(0) }
    ]) {
      expect(codiDe(() => construeixEml({ ...base, adjunts: [adjunt] }))).toBe('ADJUNT_INVALID');
    }
  });
});

/* ── Compartir ─────────────────────────────────────────────────────────── */

describe('compartir fitxers', () => {
  const XLSX = { nom: 'Facturació 1T.xlsx', tipus: TIPUS_XLSX, dades: new Uint8Array([0x50, 0x4b, 3, 4]) };

  test('fitxersPerCompartir crea File amb nom, tipus i bytes', async () => {
    const [fitxer] = fitxersPerCompartir([XLSX, { nom: 'f.csv', tipus: 'text/csv', dades: new Uint8Array([0x61]) }]).slice(0, 1);
    expect(fitxer.name).toBe('Facturació 1T.xlsx');
    expect(fitxer.type).toBe(TIPUS_XLSX);
    expect(fitxer.size).toBe(4);
    expect(fitxersPerCompartir([{ nom: 'f.csv', tipus: TIPUS_CSV, dades: new Uint8Array([0x61]) }])[0].type).toBe('text/csv');
    expect(codiDe(() => fitxersPerCompartir([{ ...XLSX, dades: null }]))).toBe('ADJUNT_INVALID');
    expect(codiDe(() => fitxersPerCompartir(null))).toBe('ADJUNT_INVALID');
    expect(codiDe(() => fitxersPerCompartir([XLSX], undefined))).toBe(null);
    expect(codiDe(() => fitxersPerCompartir([XLSX], null))).toBe('ADJUNT_INVALID');
  });

  test('potCompartirFitxers només és cert si share i canShare ho permeten', () => {
    expect(potCompartirFitxers(undefined)).toBe(false);
    expect(potCompartirFitxers(null)).toBe(false);
    expect(potCompartirFitxers({})).toBe(false);
    expect(potCompartirFitxers({ share: () => {} })).toBe(false);
    expect(potCompartirFitxers({ canShare: () => true })).toBe(false);

    const canShare = vi.fn(() => true);
    expect(potCompartirFitxers({ share: () => {}, canShare })).toBe(true);
    const [{ files }] = canShare.mock.calls[0];
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('prova.xlsx');
    expect(files[0].type).toBe(TIPUS_XLSX);

    const fitxers = fitxersPerCompartir([XLSX]);
    potCompartirFitxers({ share: () => {}, canShare }, fitxers);
    expect(canShare.mock.calls[1][0].files).toBe(fitxers);

    expect(potCompartirFitxers({ share: () => {}, canShare: () => false })).toBe(false);
    expect(potCompartirFitxers({ share: () => {}, canShare: () => 'sí' })).toBe(false);
    expect(potCompartirFitxers({ share: () => {}, canShare: () => { throw new TypeError('no'); } })).toBe(false);
  });

  test('sense File el navegador no pot compartir fitxers', () => {
    vi.stubGlobal('File', undefined);
    try {
      expect(potCompartirFitxers({ share: () => {}, canShare: () => true })).toBe(false);
      expect(codiDe(() => fitxersPerCompartir([XLSX]))).toBe('ADJUNT_INVALID');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
