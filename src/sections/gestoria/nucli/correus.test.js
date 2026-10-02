// @vitest-environment node
/* Gestoria · nucli · correus: separació d'un mbox, capçaleres, paraules
   codificades (RFC 2047), noms d'adjunts (RFC 2231) i resum sense cos.
   Missatges sintètics amb dominis example.com i example.org. */
import { describe, expect, test } from 'vitest';
import { adjuntsDe, capcaleres, decodificaParaula, esCorreuDeFactura, resumCorreu, separaMbox } from './correus.js';

const b64 = (text) => btoa(String.fromCharCode(...new TextEncoder().encode(text)));
const PDF = 'JVBERi0xLjQK';

const MISSATGE_FACTURA = [
  `From: =?UTF-8?B?${b64('Factures Exemple Energia')}?= <Factures@Example.com>`,
  'To: titular@example.org',
  'Subject: =?UTF-8?Q?La_teua_factura_d=E2=80=99abril?=',
  'Date: Thu, 30 Apr 2026 23:30:00 -0700 (PDT)',
  'Message-ID: <abc.123@example.com>',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="ext-1"',
  '',
  'Preàmbul que no es llig.',
  '--ext-1',
  'Content-Type: multipart/alternative;',
  '  boundary=int-2',
  '',
  '--int-2',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'COS-PRIVAT: filename="no-es-un-adjunt.pdf"',
  '--int-2',
  'Content-Type: text/html; charset=utf-8',
  '',
  '<p>COS-PRIVAT</p>',
  '--int-2--',
  '',
  '--ext-1',
  'Content-Type: application/pdf; name="factura-abril.pdf"',
  'Content-Disposition: attachment; filename="factura-abril.pdf"',
  'Content-Transfer-Encoding: base64',
  '',
  PDF,
  '--ext-1',
  'Content-Type: application/pdf',
  "Content-Disposition: attachment; filename*=utf-8''Factura%20d%E2%80%99abril%20%C3%A0.pdf",
  '',
  PDF,
  '--ext-1',
  'Content-Type: application/pdf;',
  ' name*0="detall_";',
  ' name*1="llarg.pdf"',
  '',
  PDF,
  '--ext-1',
  `Content-Type: image/png; name="=?UTF-8?B?${b64('logotip ç.png')}?="`,
  'Content-Disposition: inline',
  '',
  'iVBORw0KGgo=',
  '--ext-1',
  'Content-Type: application/pdf; name="factura-abril.pdf"',
  '',
  PDF,
  '--ext-1--',
  'Epíleg.'
].join('\r\n');

describe('separaMbox', () => {
  const mbox = [
    'From 1111@xxx Thu Apr 30 10:00:00 2026',
    'From: a@example.com',
    'Subject: U',
    '',
    'Hola',
    '>From la plaça',
    'From aquí no separa: no hi ha línia buida',
    '',
    'From 2222@xxx Fri May 01 10:00:00 2026',
    'From: b@example.com',
    'Subject: Dos',
    '',
    'Cos dos',
    'From 3333@xxx Sat May 02 10:00:00 2026',
    'From: c@example.com',
    'Subject: Tres',
    '',
    'Cos tres',
    ''
  ];

  test('separa per les línies From_ i desfà el «>From»', () => {
    const missatges = separaMbox(mbox.join('\n'));
    expect(missatges).toHaveLength(3);
    expect(missatges[0]).toBe('From: a@example.com\nSubject: U\n\nHola\nFrom la plaça\nFrom aquí no separa: no hi ha línia buida');
    expect(missatges.map((m) => capcaleres(m).subject)).toEqual(['U', 'Dos', 'Tres']);
    expect(missatges[2].endsWith('Cos tres')).toBe(true);
  });

  test('amb salts CRLF dona el mateix', () => {
    expect(separaMbox(mbox.join('\r\n'))).toEqual(separaMbox(mbox.join('\n')));
  });

  test('un .eml solt és un sol missatge', () => {
    expect(separaMbox('From: a@example.com\nSubject: x\n\ncos')).toEqual(['From: a@example.com\nSubject: x\n\ncos']);
  });

  test('buit o no text: cap missatge', () => {
    expect(separaMbox('')).toEqual([]);
    expect(separaMbox(null)).toEqual([]);
    expect(separaMbox('From 1@xxx Thu Apr 30 10:00:00 2026\n\n')).toEqual([]);
  });
});

describe('capcaleres', () => {
  test('desplega les línies plegades, claus en minúscules i la primera repetida guanya', () => {
    const text = "Subject: Primera part\r\n de l'assumpte\r\nX-Repetida: u\r\nx-repetida: dos\r\nNo és capçalera\r\nContent-Type: text/plain\r\n\r\nCos: no és capçalera\r\n";
    expect(capcaleres(text)).toEqual({ subject: "Primera part de l'assumpte", 'x-repetida': 'u', 'content-type': 'text/plain' });
  });

  test('sense capçaleres o amb noms perillosos', () => {
    expect(capcaleres('\ncos')).toEqual({});
    expect(capcaleres(null)).toEqual({});
    const resultat = capcaleres('__proto__: x\nconstructor: y\n\n');
    expect(Object.getPrototypeOf(resultat)).toBe(Object.prototype);
    expect(resultat.constructor).toBe('y');
    expect({}.x).toBeUndefined();
  });
});

describe('decodificaParaula', () => {
  test.each([
    [`=?utf-8?B?${b64('Factura núm. 7')}?=`, 'Factura núm. 7'],
    ['=?ISO-8859-1?Q?Factura_n=FAm=2E_7?=', 'Factura núm. 7'],
    ['=?windows-1252?Q?Import_=80_12?=', 'Import € 12'],
    ['=?utf-8?Q?Factura?= =?utf-8?Q?_d=E2=80=99abril?=', 'Factura d’abril'],
    ['=?utf-8?Q?pla=C3?=\r\n =?utf-8?Q?=A7a?=', 'plaça'],
    ['=?utf-8?Q?a?= =?iso-8859-1?Q?=E7?=', 'aç'],
    ['Re: =?utf-8?Q?factura?= pendent', 'Re: factura pendent'],
    ['=?utf-8*ca?Q?hola?=', 'hola'],
    [`=?utf-8?b?${b64('ç').replace(/=+$/, '')}?=`, 'ç'],
    ['=?x-desconegut?Q?abc?=', '=?x-desconegut?Q?abc?='],
    ['=?utf-8?B?***?=', '=?utf-8?B?***?='],
    ['Text sense codificar', 'Text sense codificar']
  ])('«%s» → «%s»', (entrada, eixida) => {
    expect(decodificaParaula(entrada)).toBe(eixida);
  });

  test('no text: buit', () => {
    expect(decodificaParaula(null)).toBe('');
    expect(decodificaParaula(7)).toBe('');
  });
});

describe('adjuntsDe', () => {
  test('noms de totes les parts MIME: filename, filename*, name*0… i name codificat, sense repetits', () => {
    expect(adjuntsDe(MISSATGE_FACTURA)).toEqual(['factura-abril.pdf', 'Factura d’abril à.pdf', 'detall_llarg.pdf', 'logotip ç.png']);
  });

  test('un missatge d\'una sola part que és un adjunt; les carpetes del nom es lleven', () => {
    const text = 'Content-Type: application/pdf\nContent-Disposition: attachment; filename="carpeta/rebut.pdf"\n\nJVBER';
    expect(adjuntsDe(text)).toEqual(['rebut.pdf']);
  });

  test('sense el delimitador de tancament, l\'última part també compta', () => {
    const text = 'Content-Type: multipart/mixed; boundary=b\n\n--b\nContent-Disposition: attachment; filename=u.pdf\n\nx\n--b\nContent-Disposition: attachment; filename=dos.pdf\n\ny';
    expect(adjuntsDe(text)).toEqual(['u.pdf', 'dos.pdf']);
  });

  test('sense adjunts o sense text: llista buida', () => {
    expect(adjuntsDe('Subject: res\n\nNomés text, filename="fals.pdf"')).toEqual([]);
    expect(adjuntsDe(undefined)).toEqual([]);
  });

  /* Revisió adversarial (seguretat-05) · Els bytes d'un segment de
     continuació (filename*0=…) es passaven com a arguments d'una crida
     (push(...bytes)): un segment de centenars de milers de caràcters llançava
     RangeError i tot el creuament del trimestre queia sense dir quin missatge era. */
  test('un paràmetre RFC 2231 de centenars de milers de caràcters no fa caure la lectura', () => {
    const parts = (disposicio) => `From: brossa@example.org\nContent-Type: multipart/mixed; boundary=b\n\n--b\nContent-Disposition: attachment; ${disposicio}\n\nx\n--b--`;
    const pla = parts(`filename*0="${'a'.repeat(600000)}"; filename*1=".pdf"`);
    const [nomPla] = adjuntsDe(pla);
    expect(nomPla).toHaveLength(600004);
    expect(nomPla.endsWith('aaa.pdf')).toBe(true);
    const codificat = parts(`filename*0*=utf-8''${'%41'.repeat(300000)}; filename*1*=%C3%A0.pdf`);
    const [nomCodificat] = adjuntsDe(codificat);
    expect(nomCodificat).toHaveLength(300005);
    expect(nomCodificat.endsWith('AAAà.pdf')).toBe(true);
    expect(() => resumCorreu(pla)).not.toThrow();
    expect(resumCorreu(codificat).de).toBe('brossa@example.org');
  });
});

describe('resumCorreu', () => {
  test('només metadades: remitent, domini, assumpte, data, id i adjunts', () => {
    const resum = resumCorreu(MISSATGE_FACTURA);
    expect(resum).toEqual({
      de: 'factures@example.com',
      nomRemitent: 'Factures Exemple Energia',
      domini: 'example.com',
      assumpte: 'La teua factura d’abril',
      data: { a: 2026, m: 4, d: 30 },
      idMissatge: 'abc.123@example.com',
      adjunts: ['factura-abril.pdf', 'Factura d’abril à.pdf', 'detall_llarg.pdf', 'logotip ç.png']
    });
    expect(JSON.stringify(resum)).not.toContain('COS-PRIVAT');
    expect(JSON.stringify(resum)).not.toContain(PDF);
  });

  test.each([
    ['factures@example.com (Exemple Energia)', 'factures@example.com', 'Exemple Energia'],
    ['"Exemple, SL" <Factures@Example.ORG>', 'factures@example.org', 'Exemple, SL'],
    ['factures@example.com', 'factures@example.com', ''],
    ['', '', '']
  ])('From «%s»', (from, de, nom) => {
    const resum = resumCorreu(`From: ${from}\nSubject: x\n\n`);
    expect(resum.de).toBe(de);
    expect(resum.nomRemitent).toBe(nom);
    expect(resum.domini).toBe(de ? de.split('@')[1] : '');
  });

  test.each([
    ['Fri, 1 May 2026 10:00:00 +0200', { a: 2026, m: 5, d: 1 }],
    ['1 May 26 10:00 GMT', { a: 2026, m: 5, d: 1 }],
    ['Sat, 31 Dec 2025 23:59:59 +0000 (UTC)', { a: 2025, m: 12, d: 31 }],
    ['30 abr 2026', { a: 2026, m: 4, d: 30 }],
    ['2026-04-30T10:00:00Z', { a: 2026, m: 4, d: 30 }],
    ['31 Feb 2026 10:00:00 +0000', null],
    ['demà', null]
  ])('Date «%s»', (date, data) => {
    expect(resumCorreu(`Date: ${date}\n\n`).data).toEqual(data);
  });

  test('sense capçaleres', () => {
    expect(resumCorreu('')).toEqual({ de: '', nomRemitent: '', domini: '', assumpte: '', data: null, idMissatge: '', adjunts: [] });
  });
});

describe('esCorreuDeFactura', () => {
  test.each([
    ['Tu factura de Exemple está disponible', 'tu factura'],
    ['Your invoice from Example', 'your invoice'],
    ['Payment received', 'payment received'],
    ['Facturación de abril', 'facturacion'],
    ['FACTURA F-1', 'factura'],
    ['Invoice 123', 'invoice'],
    ['Your receipt from Example', 'receipt'],
    ['Rebut de la quota', 'rebut'],
    ['Recibo mensual', 'recibo']
  ])('assumpte «%s» → %s', (assumpte, paraula) => {
    expect(esCorreuDeFactura({ assumpte, adjunts: [] })).toEqual({ es: true, motiu: `L'assumpte diu «${paraula}».` });
  });

  test('per un adjunt PDF amb nom de factura', () => {
    const r = esCorreuDeFactura({ assumpte: 'Documentació', adjunts: ['logo.png', 'Invoice-0001.pdf'] });
    expect(r.es).toBe(true);
    expect(r.motiu).toContain('Invoice-0001.pdf');
  });

  test.each([
    [{ assumpte: 'Novetats del poble', adjunts: [] }],
    [{ assumpte: 'Autofacturable', adjunts: [] }],
    [{ assumpte: 'Fotos', adjunts: ['factura.png', 'document.pdf'] }],
    [{}],
    [null]
  ])('no és de factura: %j', (resum) => {
    expect(esCorreuDeFactura(resum).es).toBe(false);
  });

  test('el resum d\'un missatge real de factura', () => {
    expect(esCorreuDeFactura(resumCorreu(MISSATGE_FACTURA)).es).toBe(true);
  });
});
