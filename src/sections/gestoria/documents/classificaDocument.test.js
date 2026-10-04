// @vitest-environment node
/* Gestoria · documents · classificador d'autoneteja. Tres passes (nom i ruta,
   text, duplicats), fail-closed: si dubta, «revisa'l». Tot és sintètic: noms
   genèrics, textos inventats i sha256 fets de lletres repetides; cap document
   real. El text i els bytes no ixen mai del classificador. */
import { describe, expect, test } from 'vitest';
import { LLINDAR_TIPUS, MARGE_TIPUS, PUNTS_EXTENSIO_OBERTA, classificaDocument, classificaDocuments, classificaPdf } from './classificaDocument.js';

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);
const SENTINELLA = 'Frase Sentinella Sintetica Que No Ha D Eixir';

const latin1 = (s) => Buffer.from(s, 'latin1');

/* Un PDF d'una pàgina, sense compressió, amb font Helvetica i les línies donades. */
function pdfSintetic(linies) {
  const contingut = ['BT /F1 11 Tf 72 780 Td', ...linies.map((l, i) => `${i ? '0 -16 Td ' : ''}(${l}) Tj`), 'ET'].join('\n');
  const objectes = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${latin1(contingut).length} >>\nstream\n${contingut}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  ];
  const parts = ['%PDF-1.7\n'];
  const offsets = [];
  objectes.forEach((cos, i) => {
    offsets.push(latin1(parts.join('')).length);
    parts.push(`${i + 1} 0 obj\n${cos}\nendobj\n`);
  });
  const inici = latin1(parts.join('')).length;
  const xref = ['xref', `0 ${objectes.length + 1}`, '0000000000 65535 f ', ...offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n `)].join('\n');
  parts.push(`${xref}\ntrailer\n<< /Size ${objectes.length + 1} /Root 1 0 R >>\nstartxref\n${inici}\n%%EOF\n`);
  return new Uint8Array(latin1(parts.join('')));
}

describe('passa 1 · pel nom i la ruta', () => {
  test.each([
    ['enllacos/servei.webloc', 'enllac', 'alta'],
    ['disseny/cartell.afpub', 'font-disseny', 'alta'],
    ['comptabilitat/llibre.gnucash.20240315103000.gnucash', 'copia-automatica', 'alta'],
    ['Modelo_145.pdf', 'model-145', 'alta'],
    ['2026-FACTURACIO-3T.xlsx', 'full-trimestral', 'mitjana'],
    ['account_activities_2026.csv', 'extracte-bancari', 'mitjana'],
    ['vida_laboral_2026.pdf', 'informe-vida-laboral', 'mitjana'],
    ['cures/diari_miccional_setmana.pdf', 'mostra-salut', 'mitjana']
  ])('%s → %s (%s)', (ruta, tipus, confianca) => {
    const c = classificaDocument({ ruta });
    expect(c).toMatchObject({ ruta, tipus, confianca, revisa: false });
    expect(c.motius.length).toBeGreaterThan(0);
  });

  test('la fitxa ve del catàleg: què és, per a què servix, quan es pot esborrar, àmbit i sensibilitat', () => {
    const c = classificaDocument({ ruta: 'cures/diari_miccional_setmana.pdf' });
    expect(c).toMatchObject({ ambit: 'llar', sensibilitat: 'salut', protegit: 'sempre', queEs: "Dades de salut d'una tercera persona" });
    const v = classificaDocument({ ruta: 'vida_laboral_2026.pdf' });
    expect(v.quanEsborrar).toBe("Quan n'hi ha un de més nou (es conserva l'últim)");
    expect(classificaDocument({ ruta: '2026-FACTURACIO-3T.xlsx' }).quanEsborrar).toBe('4 anys (a verificar amb la gestoria)');
  });

  test('una carpeta compta la meitat que el nom', () => {
    const c = classificaDocument({ ruta: 'Kit_Digital/annex.webloc' });
    expect(c.tipus).toBe('enllac');
    expect(c.candidats.find((x) => x.tipus === 'subvencio')).toEqual({ tipus: 'subvencio', punts: 20 });
    expect(c.candidats.find((x) => x.tipus === 'subvencio').punts).toBeLessThan(LLINDAR_TIPUS);
  });

  test('els ocults del sistema no es tornen', () => {
    expect(classificaDocument({ ruta: 'carpeta/.DS_Store' })).toBeNull();
    expect(classificaDocument({ ruta: '' })).toBeNull();
  });
});

describe('fail-closed · si dubta, «revisa\'l»', () => {
  test('un PDF amb un nom genèric i sense text no arriba al llindar', () => {
    const c = classificaDocument({ ruta: 'document.pdf' });
    expect(c).toMatchObject({ tipus: 'desconegut', revisa: true, confianca: 'baixa' });
    expect(c.motius.join(' ')).toMatch(/revisa'l/);
    expect(c.quanEsborrar).toBe("MAI: «revisa'l»");
  });

  test('dos tipus massa a prop: desconegut, amb els candidats per a la persona', () => {
    const c = classificaDocument({ ruta: 'diari_miccional_plantilla.pdf' });
    const [primer, segon] = c.candidats;
    expect(primer.punts - segon.punts).toBeLessThan(MARGE_TIPUS);
    expect(c).toMatchObject({ tipus: 'desconegut', revisa: true });
    expect(c.motius[0]).toMatch(/^dubte entre «Mostra emplenada de salut» i «Plantilla en blanc/);
  });

  test('un fitxer d’extensió desconeguda sense cap recepta és desconegut', () => {
    expect(classificaDocument({ ruta: 'carpeta/x.qqq' })).toMatchObject({ tipus: 'desconegut', revisa: true, candidats: [] });
  });
});

describe('l’extensió sola no classifica', () => {
  test.each(['web/factura_001.html', 'pagina.html', 'carpeta/estil.css', 'registre.log', 'contracte.pdf.bak'])('%s → desconegut, «revisa\'l»', (ruta) => {
    expect(classificaDocument({ ruta })).toMatchObject({ tipus: 'desconegut', revisa: true, confianca: 'baixa' });
  });

  test('una factura desada en HTML, encara que el text diga «factura», va a «revisa\'l»', () => {
    expect(classificaDocument({ ruta: 'factures/f_001.html', text: 'Factura núm. 1\nTotal' })).toMatchObject({ tipus: 'desconegut', revisa: true });
  });

  test('amb un altre indici, sí: el nom o la carpeta del codi', () => {
    expect(PUNTS_EXTENSIO_OBERTA).toBeLessThan(LLINDAR_TIPUS);
    expect(classificaDocument({ ruta: 'eines/prototip.py' })).toMatchObject({ tipus: 'codi-antic', revisa: false });
    expect(classificaDocument({ ruta: 'codi/index.html' })).toMatchObject({ tipus: 'codi-antic', revisa: false });
  });
});

describe('passa 2 · pel text', () => {
  test('l’organisme emissor i les paraules de la capçalera', () => {
    const c = classificaDocument({
      ruta: 'escaneig.pdf',
      text: `TESORERÍA GENERAL DE LA SEGURIDAD SOCIAL\nINFORME DE VIDA LABORAL\n${SENTINELLA}`
    });
    expect(c).toMatchObject({ tipus: 'informe-vida-laboral', organisme: 'TGSS', revisa: false });
    expect(c.motius).toContain('organisme emissor: TGSS');
  });

  test('el proveïdor del catàleg (receptes.js) decidix que és una factura rebuda', () => {
    const c = classificaDocument({ ruta: 'f_123.pdf', text: 'Som Energia\nFactura de subministrament\nPeríode sintètic' });
    expect(c).toMatchObject({ tipus: 'factura-rebuda', revisa: false });
    expect(c.motius).toContain('proveïdor del catàleg: Som Energia, SCCL');
  });

  test('el nom i el text que no coincidixen fan dubtar', () => {
    const c = classificaDocument({ ruta: 'vida_laboral.pdf', text: 'Justificante de presentación\nModelo 303' });
    expect(c).toMatchObject({ tipus: 'desconegut', revisa: true });
  });

  test('el text no ix mai: ni el camp ni cap tros', () => {
    const doc = { ruta: 'escaneig.pdf', text: `Informe de vida laboral ${SENTINELLA}`, sha256: SHA_A };
    for (const c of [classificaDocument(doc), ...classificaDocuments([doc])]) {
      expect(c).not.toHaveProperty('text');
      expect(JSON.stringify(c)).not.toContain('Sentinella');
    }
  });
});

describe('el PDF es llig ací i el text es deixa anar', () => {
  test('classificaPdf extrau el text amb pdfText.js i no torna ni el text ni els bytes', async () => {
    const bytes = pdfSintetic(['TESORERIA GENERAL DE LA SEGURIDAD SOCIAL', 'Informe de vida laboral', SENTINELLA]);
    const c = await classificaPdf({ ruta: 'escaneig.pdf', mida: bytes.length, sha256: SHA_A, bytes }, { inflate: null });
    expect(c).toMatchObject({ ruta: 'escaneig.pdf', tipus: 'informe-vida-laboral', organisme: 'TGSS', sha256: SHA_A });
    expect(c).not.toHaveProperty('bytes');
    expect(c).not.toHaveProperty('text');
    expect(JSON.stringify(c)).not.toContain('Sentinella');
  });

  test('un PDF sense text es classifica només pel nom, i ho diu', async () => {
    const c = await classificaPdf({ ruta: 'Modelo_145.pdf', bytes: pdfSintetic([]) }, { inflate: null });
    expect(c.tipus).toBe('model-145');
    expect(c.motius).toContain('el PDF no porta text (potser escanejat)');
  });

  test('uns bytes que no són un PDF no fan petar res: desconegut', async () => {
    const c = await classificaPdf({ ruta: 'document.pdf', bytes: new Uint8Array([1, 2, 3]) }, { inflate: null });
    expect(c).toMatchObject({ tipus: 'desconegut', revisa: true });
  });
});

describe('passa 3 · duplicats', () => {
  test('el mateix sha256: es marca la còpia, mai l’original, i hereta l’àmbit i la sensibilitat', () => {
    const [original, copia] = classificaDocuments([
      { ruta: 'a/vida_laboral.pdf', mida: 900, sha256: SHA_A },
      { ruta: 'b/vida_laboral.pdf', mida: 900, sha256: SHA_A }
    ]);
    expect(original).toMatchObject({ tipus: 'informe-vida-laboral', revisa: false });
    expect(original).not.toHaveProperty('original');
    expect(copia).toMatchObject({
      tipus: 'duplicat-exacte', original: 'a/vida_laboral.pdf', revisa: false, confianca: 'alta',
      ambit: original.ambit, sensibilitat: original.sensibilitat
    });
  });

  test('una còpia que només ho sembla pel nom no canvia de tipus, però va a «revisa\'l»', () => {
    const [original, copia] = classificaDocuments([
      { ruta: 'x/justificant_pagament.pdf', mida: 1000, sha256: SHA_A },
      { ruta: 'x/justificant_pagament copia.pdf', mida: 1001, sha256: SHA_B }
    ]);
    expect(original).toMatchObject({ tipus: 'rebut-pagament', revisa: false });
    expect(copia.tipus).toBe(original.tipus);
    expect(copia.revisa).toBe(true);
    expect(copia.motius.at(-1)).toMatch(/contingut no s'ha comprovat/);
  });

  test('determinista, sense ocults i sense tocar l’entrada', () => {
    const entrada = Object.freeze([
      Object.freeze({ ruta: 'carpeta/.DS_Store' }),
      Object.freeze({ ruta: 'a/servei.webloc', sha256: SHA_B }),
      Object.freeze({ ruta: 'b/servei.webloc', sha256: SHA_B })
    ]);
    const primera = classificaDocuments(entrada);
    expect(primera.map((c) => c.ruta)).toEqual(['a/servei.webloc', 'b/servei.webloc']);
    expect(classificaDocuments(entrada)).toEqual(primera);
  });
});
