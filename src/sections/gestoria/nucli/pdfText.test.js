// @vitest-environment node
/* Gestoria · nucli · pdfText. Els PDF es munten ací mateix, amb textos
   sintètics: font Helvetica sense compressió, FlateDecode, Type0/Identity-H
   amb ToUnicode dins d'un /ObjStm, /Length indirecta, xifrat i brossa. */
import { deflateSync, inflateSync } from 'node:zlib';
import { describe, expect, test } from 'vitest';
import { PDF_MASSA_GRAN, PRESSUPOST_PDF, extreuTextPdf } from './pdfText.js';

const latin1 = (s) => Buffer.from(s, 'latin1');
const comprimix = (s) => deflateSync(latin1(s));
const inflateNode = async (b) => new Uint8Array(inflateSync(b));

/**
 * Munta un PDF. Cada objecte és { num, cos } o un flux { num, dict, dades,
 * longitud? } (longitud pot ser un número fals o una referència «9 0 R»).
 */
function pdf(objectes, { trailer = '/Root 1 0 R', capcalera = '%PDF-1.7\n%\xe2\xe3\xcf\xd3\n' } = {}) {
  const parts = [latin1(capcalera)];
  let pos = parts[0].length;
  const offsets = new Map();
  for (const o of objectes) {
    let tros;
    if (o.dades !== undefined) {
      const dades = Buffer.isBuffer(o.dades) ? o.dades : latin1(o.dades);
      tros = Buffer.concat([
        latin1(`${o.num} 0 obj\n<< ${o.dict ?? ''} /Length ${o.longitud ?? dades.length} >>\nstream\n`),
        dades,
        latin1('\nendstream\nendobj\n')
      ]);
    } else {
      tros = latin1(`${o.num} 0 obj\n${o.cos}\nendobj\n`);
    }
    offsets.set(o.num, pos);
    parts.push(tros);
    pos += tros.length;
  }
  const mida = Math.max(...offsets.keys()) + 1;
  let xref = `xref\n0 ${mida}\n0000000000 65535 f \n`;
  for (let n = 1; n < mida; n += 1) xref += offsets.has(n) ? `${String(offsets.get(n)).padStart(10, '0')} 00000 n \n` : '0000000000 00000 f \n';
  parts.push(latin1(`${xref}trailer\n<< /Size ${mida} ${trailer} >>\nstartxref\n${pos}\n%%EOF\n`));
  return new Uint8Array(Buffer.concat(parts));
}

const HELVETICA = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';

/* Document d'una pàgina amb font Helvetica (objecte 5) i el contingut donat. */
function senzill(contingut, { filtre = '', rotacio = '', inflat = (s) => s } = {}) {
  return pdf([
    { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
    { num: 2, cos: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
    { num: 3, cos: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ${rotacio} /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>` },
    { num: 4, dict: filtre, dades: inflat(contingut) },
    { num: 5, cos: HELVETICA }
  ]);
}

const CONTINGUT_FACTURA = [
  'BT /F1 12 Tf 72 780 Td (Exemple Energia SCCL) Tj',
  '0 -16 Td (Factura n\\272: F-2026-001) Tj',
  '0 -16 Td (Par\\350ntesis \\(dins\\) i barra \\\\ ok) Tj ET',
  'BT /F1 10 Tf 72 700 Td (Total) Tj 328 0 Td (121,00 \\200) Tj ET',
  'BT /F1 10 Tf 72 680 Td [(Base) -250 (imponible) 120 (:)] TJ ET'
].join('\n');

const LINIES_FACTURA = [
  'Exemple Energia SCCL',
  'Factura nº: F-2026-001',
  'Parèntesis (dins) i barra \\ ok',
  'Total 121,00 €',
  'Base imponible:'
];

describe('extreuTextPdf: (a) sense compressió, Helvetica', () => {
  test('text, escapes, octals, WinAnsi i espais per posició i per TJ', async () => {
    const r = await extreuTextPdf(senzill(CONTINGUT_FACTURA));
    expect(r.xifrat).toBe(false);
    expect(r.avisos).toEqual([]);
    expect(r.pagines).toHaveLength(1);
    expect(r.pagines[0].split('\n')).toEqual(LINIES_FACTURA);
    expect(r.text).toBe(r.pagines[0]);
  });

  test('ordre de lectura: de dalt a baix i d’esquerra a dreta encara que el flux vaja desordenat', async () => {
    const contingut = [
      'BT /F1 10 Tf 300 500 Td (dreta) Tj ET',
      'BT /F1 10 Tf 72 600 Td (primera) Tj ET',
      'BT /F1 10 Tf 72 500 Td (esquerra) Tj ET'
    ].join('\n');
    const r = await extreuTextPdf(senzill(contingut));
    expect(r.text).toBe('primera\nesquerra dreta');
  });

  test("T*, ' i \" fan salt de línia; trossos contigus no porten espai", async () => {
    const contingut = [
      'BT /F1 10 Tf 14 TL 72 400 Td (Linia u) Tj T* (Linia dos) Tj (Linia tres) \' 0 0 (Linia quatre) " ET',
      'BT /F1 10 Tf 72 300 Td (Fact) Tj (ura) Tj ET'
    ].join('\n');
    const r = await extreuTextPdf(senzill(contingut));
    expect(r.text).toBe('Linia u\nLinia dos\nLinia tres\nLinia quatre\nFactura');
  });

  test('CTM girada (estil Skia) i matriu de text amb escala', async () => {
    const contingut = [
      'q 1 0 0 -1 0 842 cm',
      'BT /F1 1 Tf 12 0 0 -12 72 62 Tm (Capcalera) Tj ET',
      'BT /F1 1 Tf 12 0 0 -12 72 100 Tm (Peu) Tj ET Q'
    ].join('\n');
    const r = await extreuTextPdf(senzill(contingut));
    expect(r.text).toBe('Capcalera\nPeu');
  });

  test('pàgina amb /Rotate 90', async () => {
    const contingut = [
      'BT /F1 10 Tf 0 1 -1 0 100 72 Tm (Primera linia) Tj ET',
      'BT /F1 10 Tf 0 1 -1 0 120 72 Tm (Segona) Tj ET',
      'BT /F1 10 Tf 0 1 -1 0 120 200 Tm (columna) Tj ET'
    ].join('\n');
    const r = await extreuTextPdf(senzill(contingut, { rotacio: '/Rotate 90' }));
    expect(r.text).toBe('Primera linia\nSegona columna');
  });

  test('imatge en línia: se salten les dades binàries', async () => {
    const contingut = `BT /F1 10 Tf 72 700 Td (Abans) Tj ET\nBI /W 2 /H 2 /BPC 8 /CS /G ID \x00\xff(Tj) EI\x01 EI\nBT /F1 10 Tf 72 680 Td (Despres) Tj ET`;
    const r = await extreuTextPdf(senzill(contingut));
    expect(r.text).toBe('Abans\nDespres');
  });

  test('/Differences i noms de glif', async () => {
    const doc = pdf([
      { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
      { num: 2, cos: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
      { num: 3, cos: '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>' },
      { num: 4, dades: 'BT /F1 10 Tf 72 700 Td <808182 2E 838485> Tj ET' },
      {
        num: 5,
        cos: '<< /Type /Font /Subtype /Type1 /BaseFont /ExempleSerif /Encoding << /BaseEncoding /WinAnsiEncoding /Differences [128 /Euro /eacute /uni00B7 /f_i /g42 /Agrave.sc] >> >>'
      }
    ]);
    const r = await extreuTextPdf(doc);
    /* g42 no té nom conegut: el codi 132 es queda amb el «„» de WinAnsi. */
    expect(r.text).toBe('€é·.fi„À');
  });

  test('ToUnicode en una font simple: lligadura, guionet discrecional i espai dur', async () => {
    const cmap = '/CIDInit /ProcSet findresource begin 12 dict begin begincmap 1 begincodespacerange <00> <FF> endcodespacerange '
      + '3 beginbfchar <41> <FB01> <42> <00AD> <43> <00A0> endbfchar endcmap end end';
    const doc = pdf([
      { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
      { num: 2, cos: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
      { num: 3, cos: '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>' },
      { num: 4, dades: 'BT /F1 10 Tf 72 700 Td <4441424345> Tj ET' },
      { num: 5, cos: '<< /Type /Font /Subtype /TrueType /BaseFont /ExempleSans /FirstChar 65 /LastChar 69 /Widths [500 500 500 500 500] /ToUnicode 6 0 R >>' },
      { num: 6, dades: cmap }
    ]);
    expect((await extreuTextPdf(doc)).text).toBe('Dfi E');
  });

  test('arbre de pàgines amb fills niats i recursos heretats: ordre de l’arbre, no del fitxer', async () => {
    const doc = pdf([
      { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
      { num: 7, cos: '<< /Type /Page /Parent 6 0 R /Contents 8 0 R >>' },
      { num: 8, dades: 'BT /F1 10 Tf 72 700 Td (Pagina dos) Tj ET' },
      { num: 2, cos: '<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 /Resources << /Font << /F1 5 0 R >> >> >>' },
      { num: 3, cos: '<< /Type /Page /Parent 2 0 R /Contents [4 0 R 9 0 R] >>' },
      { num: 4, dades: 'BT /F1 10 Tf 72 700 Td (Pagina u,) Tj' },
      { num: 9, dades: '( segon flux) Tj ET' },
      { num: 5, cos: HELVETICA },
      { num: 6, cos: '<< /Type /Pages /Parent 2 0 R /Kids [7 0 R] /Count 1 >>' }
    ]);
    const r = await extreuTextPdf(doc);
    expect(r.pagines).toEqual(['Pagina u, segon flux', 'Pagina dos']);
    expect(r.text).toBe('Pagina u, segon flux\n\nPagina dos');
  });

  test('formulari (Do) amb /Matrix i recursos propis', async () => {
    const doc = pdf([
      { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
      { num: 2, cos: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
      { num: 3, cos: '<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Fm1 6 0 R >> >> /Contents 4 0 R >>' },
      { num: 4, dades: 'q 1 0 0 1 0 -100 cm /Fm1 Do Q /Fm1 Do' },
      { num: 5, cos: HELVETICA },
      { num: 6, dict: '/Type /XObject /Subtype /Form /BBox [0 0 595 842] /Matrix [1 0 0 1 0 50] /Resources << /Font << /F9 5 0 R >> >>', dades: 'BT /F9 10 Tf 72 600 Td (Plantilla) Tj ET' }
    ]);
    const r = await extreuTextPdf(doc);
    expect(r.text).toBe('Plantilla\nPlantilla');
  });

  test('pàgina sense text i font absent: avisos', async () => {
    const r = await extreuTextPdf(senzill('BT /F7 10 Tf 72 700 Td (Sense font) Tj ET'));
    expect(r.text).toBe('Sense font');
    expect(r.avisos.some((a) => a.includes('font'))).toBe(true);
    const buida = await extreuTextPdf(senzill('0 0 m 100 100 l S'));
    expect(buida.pagines).toEqual(['']);
    expect(buida.avisos).toContain('Pàgines sense text (potser escanejades): 1.');
  });
});

describe('extreuTextPdf: (b) FlateDecode', () => {
  test('amb el descompressor del navegador (DecompressionStream)', async () => {
    const r = await extreuTextPdf(senzill(CONTINGUT_FACTURA, { filtre: '/Filter /FlateDecode', inflat: comprimix }));
    expect(r.avisos).toEqual([]);
    expect(r.pagines[0].split('\n')).toEqual(LINIES_FACTURA);
  });

  test('amb un descompressor injectat', async () => {
    const r = await extreuTextPdf(senzill(CONTINGUT_FACTURA, { filtre: '/Filter /FlateDecode', inflat: comprimix }), { inflate: inflateNode });
    expect(r.pagines[0].split('\n')).toEqual(LINIES_FACTURA);
  });

  test('sense descompressor: text buit i avís, sense llançar', async () => {
    const r = await extreuTextPdf(senzill(CONTINGUT_FACTURA, { filtre: '/Filter /FlateDecode', inflat: comprimix }), { inflate: null });
    expect(r.text).toBe('');
    expect(r.avisos.some((a) => a.includes('DecompressionStream'))).toBe(true);
  });

  test('descompressor que falla: avís', async () => {
    const r = await extreuTextPdf(senzill(CONTINGUT_FACTURA, { filtre: '/Filter /FlateDecode', inflat: comprimix }), {
      inflate: async () => {
        throw new Error('trencat');
      }
    });
    expect(r.text).toBe('');
    expect(r.avisos).toContain("Un flux comprimit no s'ha pogut descomprimir.");
  });

  test('cadena de filtres ASCII85 + Flate i ASCIIHex', async () => {
    const a85 = (buf) => {
      let r = '';
      for (let i = 0; i < buf.length; i += 4) {
        const tros = buf.subarray(i, i + 4);
        const ple = Buffer.alloc(4);
        tros.copy(ple);
        let v = ple.readUInt32BE(0);
        if (v === 0 && tros.length === 4) {
          r += 'z';
          continue;
        }
        const xifres = [];
        for (let k = 0; k < 5; k += 1) {
          xifres.unshift(String.fromCharCode(33 + (v % 85)));
          v = Math.floor(v / 85);
        }
        r += xifres.join('').slice(0, tros.length + 1);
      }
      return `${r}~>`;
    };
    const r85 = await extreuTextPdf(senzill(CONTINGUT_FACTURA, { filtre: '/Filter [/ASCII85Decode /FlateDecode]', inflat: (s) => a85(comprimix(s)) }));
    expect(r85.pagines[0].split('\n')).toEqual(LINIES_FACTURA);
    const rHex = await extreuTextPdf(senzill('BT /F1 10 Tf 72 700 Td (Hexa) Tj ET', { filtre: '/Filter /AHx', inflat: (s) => `${latin1(s).toString('hex')}>` }));
    expect(rHex.text).toBe('Hexa');
  });

  test('filtre desconegut: avís', async () => {
    const r = await extreuTextPdf(senzill('xxx', { filtre: '/Filter /JBIG2Decode' }));
    expect(r.text).toBe('');
    expect(r.avisos).toContain('Filtre de flux no suportat: /JBIG2Decode.');
  });
});

/* ── (c) Type0 / Identity-H amb ToUnicode i la font dins d'un /ObjStm ─── */

const TO_UNICODE = [
  '/CIDInit /ProcSet findresource begin',
  '12 dict begin',
  'begincmap',
  '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def',
  '/CMapName /Adobe-Identity-UCS def',
  '/CMapType 2 def',
  '1 begincodespacerange',
  '<0000> <FFFF>',
  'endcodespacerange',
  '3 beginbfchar',
  '<0003> <0020>',
  '<0004> <20AC>',
  '<0005> <002C>',
  'endbfchar',
  '4 beginbfrange',
  '<0010> <0019> <0030> % xifres',
  '<0021> <003A> <0041>',
  '<0041> <005A> <0061>',
  '<0060> <0062> [<00660069> <00E0> <00E8>]',
  'endbfrange',
  'endcmap',
  'CMapName currentdict /CMap defineresource pop',
  'end',
  'end'
].join('\n');

/* Codifica text amb els codis de 2 bytes del CMap de dalt. */
function codifica(text) {
  const codis = [];
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (text.startsWith('fi', i)) {
      codis.push(0x60);
      i += 1;
    } else if (c === ' ') codis.push(0x03);
    else if (c === '€') codis.push(0x04);
    else if (c === ',') codis.push(0x05);
    else if (c === 'à') codis.push(0x61);
    else if (c === 'è') codis.push(0x62);
    else if (c >= '0' && c <= '9') codis.push(0x10 + Number(c));
    else if (c >= 'A' && c <= 'Z') codis.push(0x21 + c.charCodeAt(0) - 65);
    else codis.push(0x41 + c.charCodeAt(0) - 97);
  }
  return `<${codis.map((n) => n.toString(16).padStart(4, '0')).join('')}>`;
}

function documentType0({ ambObjStm = true } = {}) {
  const font = '<< /Type /Font /Subtype /Type0 /BaseFont /ExempleSans /Encoding /Identity-H /DescendantFonts [6 0 R] /ToUnicode 7 0 R >>';
  const cid = '<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ExempleSans /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /DW 1000 /W [3 [278 556] 16 25 556] >>';
  const capcalera = `5 0 6 ${font.length + 1} `;
  const contingut = [
    `BT /F1 11 Tf 72 760 Td ${codifica('Factura')} Tj`,
    `0 -14 Td ${codifica('Total 1234,56 €')} Tj`,
    `0 -14 Td [${codifica('Oficina')} -300 ${codifica('València')}] TJ ET`
  ].join('\n');
  const fontObjs = ambObjStm
    ? [{ num: 10, dict: `/Type /ObjStm /N 2 /First ${capcalera.length} /Filter /FlateDecode`, dades: comprimix(`${capcalera}${font} ${cid}`) }]
    : [{ num: 5, cos: font }, { num: 6, cos: cid }];
  return pdf([
    { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
    { num: 2, cos: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
    { num: 3, cos: '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>' },
    { num: 4, dict: '/Filter /FlateDecode', dades: comprimix(contingut) },
    { num: 7, dict: '/Filter /FlateDecode', dades: comprimix(TO_UNICODE) },
    ...fontObjs
  ]);
}

describe('extreuTextPdf: (c) Type0/Identity-H amb ToUnicode', () => {
  const ESPERAT = 'Factura\nTotal 1234,56 €\nOficina València';

  test('bfchar, bfrange simple i bfrange amb matriu; font dins d’un /ObjStm', async () => {
    const r = await extreuTextPdf(documentType0());
    expect(r.avisos).toEqual([]);
    expect(r.text).toBe(ESPERAT);
  });

  test('la mateixa font com a objectes directes', async () => {
    const r = await extreuTextPdf(documentType0({ ambObjStm: false }));
    expect(r.text).toBe(ESPERAT);
  });

  test('sense ToUnicode: glifs perduts i avís', async () => {
    const font = '<< /Type /Font /Subtype /Type0 /BaseFont /ExempleSans /Encoding /Identity-H /DescendantFonts [6 0 R] >>';
    const doc = pdf([
      { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
      { num: 2, cos: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
      { num: 3, cos: '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>' },
      { num: 4, dades: `BT /F1 11 Tf 72 760 Td ${codifica('Factura')} Tj ET` },
      { num: 5, cos: font },
      { num: 6, cos: '<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ExempleSans >>' }
    ]);
    const r = await extreuTextPdf(doc);
    expect(r.text).toBe('');
    expect(r.avisos).toContain('Hi ha glifs sense correspondència Unicode: el text pot estar incomplet.');
  });
});

describe('extreuTextPdf: (d) /Length indirecta o incorrecta', () => {
  test('/Length per referència a un objecte posterior', async () => {
    const contingut = 'BT /F1 10 Tf 72 700 Td (Longitud indirecta) Tj ET';
    const doc = pdf([
      { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
      { num: 2, cos: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
      { num: 3, cos: '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>' },
      { num: 4, dades: comprimix(contingut), dict: '/Filter /FlateDecode', longitud: '9 0 R' },
      { num: 5, cos: HELVETICA },
      { num: 9, cos: String(comprimix(contingut).length) }
    ]);
    const r = await extreuTextPdf(doc);
    expect(r.avisos).toEqual([]);
    expect(r.text).toBe('Longitud indirecta');
  });

  test('/Length falsa: es recupera per «endstream» i s’avisa', async () => {
    const contingut = 'BT /F1 10 Tf 72 700 Td (Longitud falsa) Tj ET';
    for (const longitud of [contingut.length + 40, 3]) {
      const doc = pdf([
        { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
        { num: 2, cos: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
        { num: 3, cos: '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>' },
        { num: 4, dades: contingut, longitud },
        { num: 5, cos: HELVETICA }
      ]);
      const r = await extreuTextPdf(doc);
      expect(r.text).toBe('Longitud falsa');
      expect(r.avisos).toContain("Algun flux té una /Length incorrecta: s'ha recuperat per la marca «endstream».");
    }
  });
});

describe('extreuTextPdf: (e) xifrat', () => {
  test('/Encrypt al tràiler: xifrat sense intentar res', async () => {
    const doc = pdf([
      { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
      { num: 2, cos: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
      { num: 3, cos: '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>' },
      { num: 4, dades: '\x8a\x13\xf0 bytes xifrats' },
      { num: 5, cos: HELVETICA },
      { num: 8, cos: '<< /Filter /Standard /V 2 /R 3 /Length 128 /P -1084 /O <00112233> /U <44556677> >>' }
    ], { trailer: '/Root 1 0 R /Encrypt 8 0 R /ID [<0a0b> <0a0b>]' });
    const r = await extreuTextPdf(doc);
    expect(r).toEqual({ pagines: [], text: '', xifrat: true, avisos: ["El PDF està xifrat: no se n'extrau el text."] });
  });
});

describe('extreuTextPdf: (f) brossa i PDF trencats', () => {
  test('bytes aleatoris: sense excepció, text buit i avisos', async () => {
    let llavor = 12345;
    const aleatoris = new Uint8Array(4096).map(() => {
      llavor = (llavor * 1103515245 + 12345) % 2147483648;
      return llavor & 0xff;
    });
    const r = await extreuTextPdf(aleatoris);
    expect(r.text).toBe('');
    expect(r.xifrat).toBe(false);
    expect(r.avisos).toContain('No comença per «%PDF-»: potser no és un PDF.');
    expect(r.avisos).toContain("No s'hi ha trobat cap objecte PDF.");
  });

  test('entrades que no són bytes', async () => {
    for (const entrada of [null, undefined, 'text', 42, {}]) {
      const r = await extreuTextPdf(entrada);
      expect(r).toEqual({ pagines: [], text: '', xifrat: false, avisos: ["L'entrada no són bytes: no s'ha llegit res."] });
    }
  });

  test('ArrayBuffer i només la capçalera', async () => {
    const r = await extreuTextPdf(senzill('BT /F1 10 Tf 72 700 Td (Buffer) Tj ET').buffer);
    expect(r.text).toBe('Buffer');
    const capcalera = await extreuTextPdf(latin1('%PDF-1.4\n%%EOF\n'));
    expect(capcalera.text).toBe('');
    expect(capcalera.avisos).toContain("No s'hi ha trobat cap objecte PDF.");
  });

  test('PDF tallat per la meitat, sense tràiler ni catàleg: les pàgines per ordre del fitxer', async () => {
    const sencer = pdf([
      { num: 3, cos: '<< /Type /Page /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>' },
      { num: 4, dades: 'BT /F1 10 Tf 72 700 Td (Primera meitat) Tj ET' },
      { num: 5, cos: HELVETICA },
      { num: 6, cos: '<< /Type /Page /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>' },
      { num: 7, dades: 'BT /F1 10 Tf 72 700 Td (Segona meitat) Tj ET' },
      { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
      { num: 2, cos: '<< /Type /Pages /Kids [6 0 R 3 0 R] /Count 2 >>' }
    ]);
    const tall = Buffer.from(sencer).indexOf('1 0 obj');
    const r = await extreuTextPdf(sencer.subarray(0, tall + 12));
    expect(r.pagines).toEqual(['Primera meitat', 'Segona meitat']);
    expect(r.avisos).toContain("L'arbre de pàgines no es pot llegir: les pàgines van en l'ordre del fitxer.");
  });

  test('diccionaris i cadenes mal tancats no s’emporten la resta del fitxer', async () => {
    const doc = pdf([
      { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
      { num: 2, cos: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
      { num: 3, cos: '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>' },
      { num: 11, cos: '<< /Title (sense tancar /Broken [1 2' },
      { num: 4, dades: 'BT /F1 10 Tf 72 700 Td (Encara es llig) Tj ET (cadena oberta' },
      { num: 5, cos: HELVETICA }
    ]);
    const r = await extreuTextPdf(doc);
    expect(r.text).toBe('Encara es llig');
  });
});

/* ── (g) Pressupost de descompressió per PDF (revisió adversarial, seguretat-06) ── */

/* Abans, el sostre de 64 MiB era per flux: 32 fluxos que s'inflaven fins al
   sostre retenien 2 GiB, i milers de pàgines que apuntaven al mateix flux en
   repetien la conversió a text i la lectura sencera. Ara hi ha un pressupost
   per PDF compartit per totes les descompressions, conversions i lectures. */
const KIB = 1024;

/* Un PDF de `n` pàgines (objectes 10…); `contingut(i)` diu quin objecte de
   contingut (CONTINGUTS…) porta la pàgina i. */
const CONTINGUTS = 5000;
function moltesPagines(n, { contingut = (i) => CONTINGUTS + i, fluxos = n } = {}) {
  const kids = Array.from({ length: n }, (_, i) => `${10 + i} 0 R`).join(' ');
  return pdf([
    { num: 1, cos: '<< /Type /Catalog /Pages 2 0 R >>' },
    { num: 2, cos: `<< /Type /Pages /Kids [${kids}] /Count ${n} >>` },
    { num: 5, cos: HELVETICA },
    ...Array.from({ length: n }, (_, i) => ({
      num: 10 + i, cos: `<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents ${contingut(i)} 0 R >>`
    })),
    ...Array.from({ length: fluxos }, (_, i) => ({ num: CONTINGUTS + i, dict: '/Filter /FlateDecode', dades: 'x' }))
  ]);
}

/* Un descompressor fals que «infla» cada flux fins a `mida` bytes: el text i, darrere, blancs. */
function inflaFins(mida, text = 'BT /F1 10 Tf 72 700 Td (Pagina) Tj ET') {
  const crides = { n: 0 };
  const inflate = async () => {
    crides.n += 1;
    const eixida = new Uint8Array(mida).fill(32);
    eixida.set(latin1(text));
    return eixida;
  };
  return { inflate, crides };
}

describe('extreuTextPdf: (g) pressupost de descompressió per PDF', () => {
  test('el pressupost per defecte és de 128 MiB per PDF i l’avís és constant', () => {
    expect(PRESSUPOST_PDF).toBe(128 * 1024 * 1024);
    expect(PDF_MASSA_GRAN).toMatch(/massa gran/);
  });

  test('molts fluxos que s’inflen: en passar del pressupost para, no torna mig text i ho avisa', async () => {
    const { inflate, crides } = inflaFins(300 * KIB);
    const r = await extreuTextPdf(moltesPagines(8), { inflate, pressupost: 1024 * KIB });
    expect(r).toEqual({ pagines: [], text: '', xifrat: false, avisos: [PDF_MASSA_GRAN] });
    expect(crides.n).toBeLessThanOrEqual(2);
  });

  test('un flux compartit per moltes pàgines no es torna a convertir ni a llegir sense límit', async () => {
    const { inflate, crides } = inflaFins(512 * KIB);
    const r = await extreuTextPdf(moltesPagines(100, { contingut: () => CONTINGUTS, fluxos: 1 }), { inflate, pressupost: 4 * 1024 * KIB });
    expect(r.avisos).toEqual([PDF_MASSA_GRAN]);
    expect(r.text).toBe('');
    expect(crides.n).toBe(1);
  });

  test('dins del pressupost, un flux compartit dona el text a cada pàgina i es descomprimix una sola vegada', async () => {
    const { inflate, crides } = inflaFins(64);
    const r = await extreuTextPdf(moltesPagines(3, { contingut: () => CONTINGUTS, fluxos: 1 }), { inflate, pressupost: 64 * KIB });
    expect(r.avisos).toEqual([]);
    expect(r.pagines).toEqual(['Pagina', 'Pagina', 'Pagina']);
    expect(crides.n).toBe(1);
  });

  test('el pressupost també el gasten els fluxos de la font (ToUnicode): no es perd dins de la font per defecte', async () => {
    const gran = new Uint8Array(100 * KIB).fill(32);
    const inflate = async (b) => (Buffer.from(b).equals(comprimix(TO_UNICODE)) ? gran : inflateNode(b));
    const r = await extreuTextPdf(documentType0({ ambObjStm: false }), { inflate, pressupost: 64 * KIB });
    expect(r).toEqual({ pagines: [], text: '', xifrat: false, avisos: [PDF_MASSA_GRAN] });
  });

  test('i els /ObjStm: el pressupost es comparteix amb la resta del document', async () => {
    const { inflate } = inflaFins(80 * KIB);
    const r = await extreuTextPdf(documentType0(), { inflate, pressupost: 64 * KIB });
    expect(r.avisos).toEqual([PDF_MASSA_GRAN]);
    expect(r.text).toBe('');
  });

  test('un pressupost que no és un nombre de bytes es queda en el per defecte', async () => {
    for (const pressupost of [undefined, null, -1, Number.NaN, 'molt']) {
      const r = await extreuTextPdf(senzill(CONTINGUT_FACTURA), { pressupost });
      expect(r.pagines[0].split('\n')).toEqual(LINIES_FACTURA);
    }
  });
});
