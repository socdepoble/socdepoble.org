// @vitest-environment node
/* Gestoria · Escàner Local · nucli pur (ordre del Mestre, 13-10-2026, pla
   261013_1405, front D). Arbres SINTÈTICS que imiten l'estructura de la
   carpeta de la Gestoria (els noms de les carpetes: 02_Facturacio/2026_Bancs,
   2025_4T, 2026_1T..3T, carpetes d'any, 01_Identitat_Legal, 03_Burocracia/SUMA,
   90_Arxiu_Historic i 04_Quarantena_Llegat_Web) amb noms de fitxer inventats:
   cap nom ni valor real. Les empremtes són lletres repetides, no hashos. */
import { describe, expect, test } from 'vitest';
import { SEVERITATS } from '../../nucli/auditoria.js';
import {
  CATEGORIES_ESCANER, CODIS_ESCANER, ESQUEMA_RADIOGRAFIA, FORMATS_CAP, SEVERITAT_ESCANER, alertesDe, analitzaCarpeta,
  buitsDe, candidatBanc, classificaArbre, contextDeRuta, dataDelNom, duplicatsDe, formatDelCap, incongruenciesDe,
  radiografiaDe, rutesPerEmpremta, triaExtractes
} from './escaner.js';

const F = '02_Facturacio';
const B = `${F}/2026_Bancs`;
const MODIFICAT = 1760000000000;
const sha = (lletra) => lletra.repeat(64);
const e = (ruta, mida = 1000, extra = {}) => ({ ruta, mida, modificat: MODIFICAT, ...extra });
const AVUI = { a: 2026, m: 10, d: 13 };
const perRuta = (llista) => Object.fromEntries(llista.map((x) => [x.ruta, x]));

/* L'arbre de prova: l'estructura de la carpeta de la Gestoria, amb noms inventats. */
const ARBRE = [
  e('00_Tauler_Central/tauler_antic.js', 2100),
  e('00_Tauler_Central/index.html', 2200),
  e('01_Identitat_Legal/Persona/document_escanejat.pdf', 5000),
  e('01_Identitat_Legal/Persona/Domicili/certificat_empadronament.pdf', 5000),
  e('01_Identitat_Legal/Empresa/escriptura_constitucio.pdf', 7000),
  e(`${F}/2024/240315_1010_ASSET_proveidor_beta.pdf`, 3100),
  e(`${F}/2024/llibre.gnucash.20240301101010.gnucash`, 9000),
  e(`${B}/moviments_compte.n43`, 4000),
  e(`${B}/bancpoble.csv`, 1200),
  e(`${B}/bancpoble_2026.csv`, 3600),
  e(`${B}/moviments_export.xls`, 8000),
  e(`${F}/2025_4T/2025-4T-llibre_exemple.pdf`, 6000, { sha256: sha('a') }),
  e(`${F}/2025_4T/251230_0900_DOC_proveidor-exemple-12-2025.pdf`, 3300),
  e(`${F}/2026_1T/2025-4T-llibre_exemple.pdf`, 6000, { sha256: sha('a') }),
  e(`${F}/2026_1T/proveidor-exemple-11-2025.pdf`, 5000),
  e(`${F}/2026_1T/2026-FACTURACIO-Titular_Prova_-_1T.xlsx`, 2500),
  e(`${F}/2026_1T/moviments_2026_01.csv`, 900),
  e(`${F}/2026_2T/260310_0900_DOC_rebut_lloguer.pdf`, 1500),
  e(`${F}/2026_3T/Invoice-PROVA-0001.pdf`, 2001),
  e(`${F}/2026_3T/Invoice-PROVA-0002.pdf`, 2002),
  e(`${F}/2026_3T/Invoice-PROVA-0004.pdf`, 2004),
  e(`${F}/2026_3T/Invoice-PROVA-0005.pdf`, 2005),
  e(`${F}/2026_3T/proveidor_alfa.pdf`, 1000),
  e(`${F}/2026_3T/proveidor_alfa copia.pdf`, 1005),
  e(`${F}/2026_3T/Captura 2026-10-02 a les 10.15.30.png`, 4400),
  e('03_Burocracia/SUMA/rebut_ibi_2026.pdf', 1700),
  e('03_Burocracia/Agencia_Tributaria/model_303_2T.pdf', 1800),
  e('03_Projectes_Actius/pla_de_treball.pdf', 1900),
  e('04_Quarantena_Llegat_Web/web/app.js', 2300),
  e('90_Arxiu_Historic/Banc_Historic/extracte_2019.pdf', 5000),
  e('90_Arxiu_Historic/certificat_antic.pfx', 3000),
  e('.DS_Store', 10),
  e(`${F}/2026_3T/._Invoice-PROVA-0001.pdf`, 10)
];
/* El que haurien dit els caps dels extractes candidats (formatDelCap). */
const FORMATS = Object.freeze({
  [`${B}/moviments_compte.n43`]: 'n43',
  [`${B}/bancpoble.csv`]: 'csv-tauler',
  [`${B}/bancpoble_2026.csv`]: 'csv-tauler',
  [`${F}/2026_1T/moviments_2026_01.csv`]: 'csv-altre'
});

/* ── Caps sintètics ──────────────────────────────────────────────────── */
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const N43 = [
  `119999000100000043212606012606302${xifres(100000, 14)}9783${text('TITULAR SINTETIC', 26)}${text('', 3)}`,
  `22${text('', 4)}000126061026061099000${'1'}${xifres(2500, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`,
  `3399990001000000432100001${xifres(2500, 14)}00000${xifres(0, 14)}2${xifres(97500, 14)}978${text('', 4)}`,
  `88${'9'.repeat(18)}${xifres(3, 6)}${text('', 54)}`
].join('\r\n');
const CSV_TAULER = [
  'Fecha,F. valor,Concepto,Importe,Saldo',
  '2026-06-10,2026-06-10,COMPRA PROVA,-25.00,975.00',
  '2026-06-11,2026-06-11,ALTRA PROVA,-5.00,970.00'
].join('\n');
const CSV_ALTRE_BANC = [
  'Fecha;Concepto;Importe;Saldo',
  '10/06/2026;COMPRA PROVA;-25,00;975,00',
  '11/06/2026;ALTRA PROVA;-5,00;970,00'
].join('\n');
const CSV_GOOGLE = [
  `Número de factura,${'7'.repeat(10)}`,
  'Fecha de la factura,30 abr 2026',
  'Importe de la factura,"12,10 €"',
  'ID de facturación,0000-0000-0000',
  '',
  'Descripción,Intervalo,Cantidad,Importe(€)',
  'Servei de prova,1 abr 2026 - 30 abr 2026,1,"10,00"',
  'Subtotal en EUR,,,"10,00"',
  'I.V.A. (21%),,,"2,10"',
  'Total en EUR,,,"12,10"'
].join('\r\n');

describe('les constants', () => {
  test('codis, categories i severitats: cada codi té la seua severitat, de les de l’auditoria', () => {
    expect(ESQUEMA_RADIOGRAFIA).toBe('sdp.gestoria.radiografia.v1');
    expect(CATEGORIES_ESCANER).toEqual(['bancs', 'factures', 'identitat', 'burocracia', 'arxiu', 'codi', 'altres']);
    expect(Object.keys(SEVERITAT_ESCANER).sort()).toEqual([...CODIS_ESCANER].sort());
    for (const severitat of Object.values(SEVERITAT_ESCANER)) expect(SEVERITATS).toContain(severitat);
    expect(FORMATS_CAP).toEqual(['n43', 'csv-tauler', 'csv-altre', 'no']);
    expect(Object.isFrozen(CODIS_ESCANER) && Object.isFrozen(SEVERITAT_ESCANER)).toBe(true);
  });
});

describe('dataDelNom', () => {
  test('el prefix aammdd_hhmm és la data d’arxiu, mai la del document', () => {
    expect(dataDelNom('260106_1030_ASSET_proveidor_beta.pdf')).toEqual({ arxiu: { a: 2026, m: 1, d: 6 }, document: null, mes: null, trimestre: null });
    expect(dataDelNom('251230_0900_DOC_proveidor-exemple-12-2025.pdf')).toEqual({
      arxiu: { a: 2025, m: 12, d: 30 }, document: null, mes: { a: 2025, m: 12 }, trimestre: null
    });
    // Una hora impossible no és cap prefix d'arxiu.
    expect(dataDelNom('260106_2599_x.pdf').arxiu).toBeNull();
  });

  test('els mesos: MM-AAAA, AAAA_MM i _AAAAMM (sis xifres justes); també des d’una ruta', () => {
    expect(dataDelNom('proveidor-exemple-11-2025.pdf').mes).toEqual({ a: 2025, m: 11 });
    expect(dataDelNom(`${F}/2026_1T/proveidor-exemple-11-2025.pdf`).mes).toEqual({ a: 2025, m: 11 });
    expect(dataDelNom('moviments_202601.csv').mes).toEqual({ a: 2026, m: 1 });
    expect(dataDelNom('moviments_2026_03.csv').mes).toEqual({ a: 2026, m: 3 });
  });

  test('un identificador llarg no és cap data', () => {
    for (const nom of [`${'7'.repeat(10)}.csv`, 'Invoice-PROVA-2026011.pdf', '2026010203.csv', 'Receipt-2345-6789.pdf']) {
      expect(dataDelNom(nom), nom).toEqual({ arxiu: null, document: null, mes: null, trimestre: null });
    }
  });

  test('els trimestres escrits al nom', () => {
    expect(dataDelNom('2025-4T-llibre_exemple.pdf').trimestre).toEqual({ any: 2025, t: 4 });
    expect(dataDelNom('2026-FACTURACIO-Titular_Prova_-_1T.csv').trimestre).toEqual({ any: 2026, t: 1 });
    expect(dataDelNom('4T_2025_resum.pdf').trimestre).toEqual({ any: 2025, t: 4 });
    expect(dataDelNom('resum_26_3t.pdf').trimestre).toEqual({ any: 2026, t: 3 });
    expect(dataDelNom('resum_2025-Q2.pdf').trimestre).toEqual({ any: 2025, t: 2 });
    expect(dataDelNom('resum_2T.pdf').trimestre).toEqual({ any: null, t: 2 });
  });

  test('les dates senceres: AAAA-MM-DD, AAAA_MM_DD i DD-MM-AAAA; una data que no existix és null', () => {
    expect(dataDelNom('Captura 2026-10-02 a les 10.15.30.png').document).toEqual({ a: 2026, m: 10, d: 2 });
    expect(dataDelNom('escaneig_2026_03_15.pdf').document).toEqual({ a: 2026, m: 3, d: 15 });
    expect(dataDelNom('15-03-2026_rebut.pdf').document).toEqual({ a: 2026, m: 3, d: 15 });
    // La data falsa no deixa cap mes de rebuig: el tros es lleva sencer.
    expect(dataDelNom('escaneig_2026-02-30.pdf')).toEqual({ arxiu: null, document: null, mes: null, trimestre: null });
  });
});

describe('contextDeRuta', () => {
  test('el trimestre i l’any de les carpetes (no del nom del fitxer)', () => {
    expect(contextDeRuta(`${F}/2026_3T/sub/x.pdf`)).toMatchObject({
      carpeta: `${F}/2026_3T/sub`, trimestre: { any: 2026, t: 3, carpeta: `${F}/2026_3T` }, any: null
    });
    expect(contextDeRuta(`${F}/2024/x.pdf`)).toMatchObject({ trimestre: null, any: 2024, carpetaAny: `${F}/2024` });
    expect(contextDeRuta(`${F}/2025-4T revisat/x.pdf`).trimestre).toEqual({ any: 2025, t: 4, carpeta: `${F}/2025-4T revisat` });
    expect(contextDeRuta(`${F}/2026_1T/2025-4T-x.pdf`).trimestre).toMatchObject({ any: 2026, t: 1 });
    expect(contextDeRuta('x.pdf')).toMatchObject({ carpeta: '', trimestre: null, any: null, banc: false, arxiu: false });
  });

  test('les carpetes del banc, la identitat, els tràmits, l’arxiu i els projectes, sense accents', () => {
    expect(contextDeRuta(`${B}/x.csv`).banc).toBe(true);
    expect(contextDeRuta('01_Identitat_Legal/Persona/x.pdf')).toMatchObject({ identitat: true, carpetaIdentitat: '01_Identitat_Legal' });
    expect(contextDeRuta('03_Burocracia/SUMA/x.pdf').burocracia).toBe(true);
    expect(contextDeRuta('Tràmits/x.pdf').burocracia).toBe(true);
    expect(contextDeRuta('90_Arxiu_Historic/Banc_Historic/x.pdf')).toMatchObject({ arxiu: true, banc: true });
    expect(contextDeRuta('04_Quarantena_Llegat_Web/web/x.js').arxiu).toBe(true);
    expect(contextDeRuta('03_Projectes_Actius/x.pdf').projectes).toBe(true);
    // Un bancal és terra, no diners.
    expect(contextDeRuta('Bancals/collita.csv').banc).toBe(false);
  });
});

describe('candidatBanc', () => {
  test.each([
    [`${B}/notes.txt`, 'n43', true],
    [`${B}/moviments_compte.n43`, 'n43', true],
    [`${F}/2026_3T/n43_compte_principal.txt`, 'n43', true],
    [`${B}/bancpoble.csv`, 'csv', true],
    [`${F}/2026_1T/moviments_2026_01.csv`, 'csv', true],
    [`${B}/moviments_export.xls`, 'xls', false],
    [`${F}/2026_3T/extracte_juliol.pdf`, 'pdf', false]
  ])('«%s» → %s', (ruta, format, llegible) => {
    expect(candidatBanc({ ruta })).toMatchObject({ format, llegible });
  });

  test.each([
    `${F}/2026_3T/resum.txt`,
    `${B}/${'7'.repeat(10)}.csv`,
    `${B}/2026-FACTURACIO-Titular_Prova_-_1T.csv`,
    `${B}/Justificante_transferencia.pdf`,
    '90_Arxiu_Historic/Banc_Historic/extracte_2019.pdf',
    '90_Arxiu_Historic/Banc_Historic/moviments.n43',
    '01_Identitat_Legal/certificat_titularitat_banc.pdf',
    '01_Identitat_Legal/extracte.csv',
    `${B}/dni_escanejat.csv`,
    `${B}/contrasenya.csv`,
    'Bancals/collita.csv'
  ])('«%s» no és mai un extracte per al Tauler', (ruta) => {
    expect(candidatBanc({ ruta }).format).toBeNull();
  });

  test('un document sensible pel nom dins de la carpeta del banc no és candidat: no se’n llig ni el cap', () => {
    const [doc] = classificaArbre([e(`${B}/dni_escanejat.csv`)]);
    expect(doc).toMatchObject({ categoria: 'identitat', banc: { format: null } });
    expect(triaExtractes([doc], { formats: { [doc.ruta]: 'csv-tauler' } })).toEqual([]);
  });
});

describe('formatDelCap', () => {
  test('una Norma 43 sintètica és n43; amb extensió de CSV, no (el Tauler la llegiria com a CSV)', () => {
    expect(formatDelCap(N43, 'n43')).toBe('n43');
    expect(formatDelCap(N43, '.TXT')).toBe('n43');
    expect(formatDelCap(N43)).toBe('n43');
    expect(formatDelCap(N43, 'csv')).toBe('no');
  });

  test('el CSV del Tauler, el d’un altre banc i el d’una factura de proveïdor', () => {
    expect(formatDelCap(CSV_TAULER, 'csv')).toBe('csv-tauler');
    expect(formatDelCap(CSV_ALTRE_BANC, 'csv')).toBe('csv-altre');
    expect(formatDelCap(CSV_GOOGLE, 'csv')).toBe('no');
    // Amb una extensió de Norma 43, un CSV no és res que el Tauler sàpia llegir.
    expect(formatDelCap(CSV_TAULER, 'txt')).toBe('no');
  });

  test('un cap tallat a mitja fila encara es reconeix; el buit i el que no és text, no', () => {
    expect(formatDelCap(N43.slice(0, 200), 'n43')).toBe('n43');
    expect(formatDelCap(CSV_TAULER.slice(0, 70), 'csv')).toBe('csv-tauler');
    expect(formatDelCap('', 'csv')).toBe('no');
    expect(formatDelCap('   ', 'n43')).toBe('no');
    expect(formatDelCap(new Uint8Array([49, 49]), 'n43')).toBe('no');
    expect(formatDelCap('11 de març: recordatori per a la gestoria', 'txt')).toBe('no');
  });
});

describe('classificaArbre', () => {
  const docs = perRuta(classificaArbre(ARBRE));

  test('cada fitxer de l’arbre té la seua categoria; els ocults del sistema no hi són', () => {
    expect(Object.keys(docs)).toHaveLength(31);
    expect(docs['.DS_Store']).toBeUndefined();
    expect(Object.keys(docs).some((r) => r.includes('/._'))).toBe(false);
    const esperades = {
      '00_Tauler_Central/tauler_antic.js': 'codi',
      '00_Tauler_Central/index.html': 'codi',
      '01_Identitat_Legal/Persona/document_escanejat.pdf': 'identitat',
      '01_Identitat_Legal/Persona/Domicili/certificat_empadronament.pdf': 'identitat',
      '01_Identitat_Legal/Empresa/escriptura_constitucio.pdf': 'identitat',
      [`${F}/2024/240315_1010_ASSET_proveidor_beta.pdf`]: 'factures',
      [`${F}/2024/llibre.gnucash.20240301101010.gnucash`]: 'codi',
      [`${B}/moviments_compte.n43`]: 'bancs',
      [`${B}/bancpoble.csv`]: 'bancs',
      [`${B}/bancpoble_2026.csv`]: 'bancs',
      [`${B}/moviments_export.xls`]: 'bancs',
      [`${F}/2025_4T/2025-4T-llibre_exemple.pdf`]: 'factures',
      [`${F}/2026_1T/2026-FACTURACIO-Titular_Prova_-_1T.xlsx`]: 'factures',
      [`${F}/2026_1T/moviments_2026_01.csv`]: 'bancs',
      [`${F}/2026_2T/260310_0900_DOC_rebut_lloguer.pdf`]: 'factures',
      [`${F}/2026_3T/Invoice-PROVA-0001.pdf`]: 'factures',
      [`${F}/2026_3T/Captura 2026-10-02 a les 10.15.30.png`]: 'factures',
      '03_Burocracia/SUMA/rebut_ibi_2026.pdf': 'burocracia',
      '03_Burocracia/Agencia_Tributaria/model_303_2T.pdf': 'burocracia',
      '03_Projectes_Actius/pla_de_treball.pdf': 'altres',
      '04_Quarantena_Llegat_Web/web/app.js': 'arxiu',
      '90_Arxiu_Historic/Banc_Historic/extracte_2019.pdf': 'arxiu',
      '90_Arxiu_Historic/certificat_antic.pfx': 'arxiu'
    };
    for (const [ruta, categoria] of Object.entries(esperades)) expect(docs[ruta]?.categoria, ruta).toBe(categoria);
  });

  test('els PDF del banc dins de l’arxiu no s’aboquen mai; el codi llegat és «codi»', () => {
    expect(docs['90_Arxiu_Historic/Banc_Historic/extracte_2019.pdf'].banc.format).toBeNull();
    expect(docs['00_Tauler_Central/index.html'].banc.format).toBeNull();
  });

  test('un document d’identitat pel nom dins d’un trimestre és «identitat», no una factura', () => {
    const [doc] = classificaArbre([e(`${F}/2026_3T/dni_escanejat.pdf`)]);
    expect(doc).toMatchObject({ categoria: 'identitat', tipus: 'document-identitat', sensibilitat: 'identitat' });
  });

  test('porta el context, les dates, el tipus de nucli/classifica.js i la fitxa del catàleg; una còpia exacta, l’original', () => {
    const copia = docs[`${F}/2026_1T/2025-4T-llibre_exemple.pdf`];
    expect(copia).toMatchObject({
      nom: '2025-4T-llibre_exemple.pdf', carpeta: `${F}/2026_1T`, extensio: 'pdf', mida: 6000, sha256: sha('a'),
      base: { tipus: 'factura' }, tipus: 'duplicat-exacte', original: `${F}/2025_4T/2025-4T-llibre_exemple.pdf`
    });
    expect(copia.dates.trimestre).toEqual({ any: 2025, t: 4 });
    expect(docs[`${F}/2025_4T/2025-4T-llibre_exemple.pdf`].original).toBeNull();
  });

  test('una empremta que no és sha256 no es creu, i una ruta amb «..» no entra', () => {
    const arbre = classificaArbre([e(`${F}/2026_3T/a.pdf`, 10, { sha256: 'fals' }), e('../fora.pdf'), e(`${F}/../x.pdf`)]);
    expect(arbre.map((d) => d.ruta)).toEqual([`${F}/2026_3T/a.pdf`]);
    expect(arbre[0].sha256).toBeNull();
  });
});

describe('rutesPerEmpremta', () => {
  test('només factures i extractes que comparteixen la mida exacta; mai la identitat, l’arxiu ni una credencial', () => {
    expect(rutesPerEmpremta(ARBRE)).toEqual([`${F}/2025_4T/2025-4T-llibre_exemple.pdf`, `${F}/2026_1T/2025-4T-llibre_exemple.pdf`]);
    const arbre = [
      e('01_Identitat_Legal/a.pdf', 500), e('01_Identitat_Legal/b.pdf', 500),
      e(`${F}/2026_3T/dni_escanejat.pdf`, 500), e(`${F}/2026_3T/factura_x.pdf`, 500),
      e('90_Arxiu_Historic/c.pdf', 500), e(`${F}/2026_3T/clau.pfx`, 500), e(`${F}/2026_3T/clau2.pfx`, 500),
      e(`${F}/2026_3T/buit_a.pdf`, 0), e(`${F}/2026_3T/buit_b.pdf`, 0)
    ];
    expect(rutesPerEmpremta(arbre)).toEqual([]);
  });

  test('extractes i factures amb la mateixa mida, i el sostre de mida', () => {
    const arbre = [e(`${B}/banc_a.csv`, 50), e(`${F}/2026_3T/factura_y.pdf`, 50), e(`${F}/2026_3T/factura_z.pdf`, 51)];
    expect(rutesPerEmpremta(arbre)).toEqual([`${F}/2026_3T/factura_y.pdf`, `${B}/banc_a.csv`]);
    expect(rutesPerEmpremta(arbre, { midaMaxima: 40 })).toEqual([]);
  });

  test('un full o un PDF del banc, que no s’aboquen, no es llegixen per a l’empremta', () => {
    const arbre = [e(`${B}/export_a.xls`, 60), e(`${B}/export_b.xls`, 60), e(`${B}/extracte_a.pdf`, 70), e(`${B}/extracte_b.pdf`, 70)];
    expect(rutesPerEmpremta(arbre)).toEqual([]);
  });
});

describe('duplicatsDe', () => {
  test('la mateixa factura a 2025_4T i 2026_1T és DUPLICAT_ENTRE_TRIMESTRES, alta; l’original no es marca', () => {
    const grups = duplicatsDe(classificaArbre(ARBRE));
    const entre = grups.find((g) => g.codi === 'DUPLICAT_ENTRE_TRIMESTRES');
    expect(entre).toMatchObject({
      severitat: 'alta', motiu: 'contingut', original: `${F}/2025_4T/2025-4T-llibre_exemple.pdf`,
      copies: [`${F}/2026_1T/2025-4T-llibre_exemple.pdf`], trimestres: ['2025_4T', '2026_1T']
    });
    for (const g of grups) expect(g.copies).not.toContain(g.original);
  });

  test('«x copia.pdf» sense el mateix sha256 és POSSIBLE_COPIA, baixa', () => {
    const copia = duplicatsDe(classificaArbre(ARBRE)).find((g) => g.codi === 'POSSIBLE_COPIA');
    expect(copia).toMatchObject({
      severitat: 'baixa', motiu: 'nom', original: `${F}/2026_3T/proveidor_alfa.pdf`, copies: [`${F}/2026_3T/proveidor_alfa copia.pdf`]
    });
  });

  test('el mateix contingut al mateix trimestre és DUPLICAT_EXACTE, informatiu; l’arxiu i la identitat no hi entren', () => {
    const grups = duplicatsDe(classificaArbre([
      e(`${F}/2026_3T/rebut_a.pdf`, 70, { sha256: sha('c') }), e(`${F}/2026_3T/rebut_b.pdf`, 70, { sha256: sha('c') }),
      e('90_Arxiu_Historic/rebut_a.pdf', 70, { sha256: sha('c') }), e('01_Identitat_Legal/rebut_a.pdf', 70, { sha256: sha('c') })
    ]));
    expect(grups).toHaveLength(1);
    expect(grups[0]).toMatchObject({ codi: 'DUPLICAT_EXACTE', severitat: 'info', original: `${F}/2026_3T/rebut_a.pdf`, copies: [`${F}/2026_3T/rebut_b.pdf`] });
  });
});

describe('incongruenciesDe', () => {
  const troballes = perRuta(incongruenciesDe(classificaArbre(ARBRE)));

  test('un mes d’un altre trimestre i un «2025-4T» dins de 2026_1T es diuen', () => {
    expect(troballes[`${F}/2026_1T/proveidor-exemple-11-2025.pdf`]).toMatchObject({
      codi: 'DATA_FORA_TRIMESTRE', severitat: 'baixa', diuCarpeta: '1T de 2026', diuNom: '11/2025'
    });
    expect(troballes[`${F}/2026_1T/2025-4T-llibre_exemple.pdf`]).toMatchObject({
      codi: 'DATA_FORA_TRIMESTRE', severitat: 'mitjana', diuCarpeta: '1T de 2026', diuNom: '4T de 2025'
    });
    expect(troballes[`${F}/2026_3T/Captura 2026-10-02 a les 10.15.30.png`]).toMatchObject({ severitat: 'baixa', diuNom: '02/10/2026' });
  });

  test('arxivar després que acabe el trimestre no es diu; abans que comence, és informatiu', () => {
    expect(troballes[`${F}/2025_4T/251230_0900_DOC_proveidor-exemple-12-2025.pdf`]).toBeUndefined();
    expect(troballes[`${F}/2026_2T/260310_0900_DOC_rebut_lloguer.pdf`]).toMatchObject({
      codi: 'ARXIVAT_ABANS_DEL_TRIMESTRE', severitat: 'info', diuNom: '10/03/2026'
    });
    const despres = incongruenciesDe(classificaArbre([e(`${F}/2025_4T/260106_1030_ASSET_proveidor_beta.pdf`)]));
    expect(despres).toEqual([]);
    expect(Object.keys(troballes)).toHaveLength(4);
  });

  test('fora d’una carpeta de trimestre, o fora de factures i extractes, no hi ha res a comparar', () => {
    expect(incongruenciesDe(classificaArbre([
      e(`${F}/2024/proveidor-exemple-11-2025.pdf`), e('03_Burocracia/2026_1T/model_303_4T.pdf')
    ]))).toEqual([]);
  });
});

describe('buitsDe', () => {
  test('un trimestre sense carpeta entre 2025_4T i 2026_2T; una carpeta d’any el cobrix', () => {
    const arbre = [e(`${F}/2025_4T/a.pdf`), e(`${F}/2026_2T/b.pdf`)];
    const buits = buitsDe(classificaArbre(arbre), { avui: { a: 2026, m: 5, d: 10 } });
    expect(buits).toEqual([expect.objectContaining({ codi: 'TRIMESTRE_SENSE_CARPETA', severitat: 'mitjana', any: 2026, t: 1 })]);
    // Fins al trimestre d'abans d'avui: amb el 13-10-2026, també el 3T.
    expect(buitsDe(classificaArbre(arbre), { avui: AVUI }).map((b) => `${b.any}_${b.t}T`)).toEqual(['2026_1T', '2026_3T']);
    expect(buitsDe(classificaArbre([...arbre, e(`${F}/2026/c.pdf`)]), { avui: AVUI })).toEqual([]);
    // L'arbre complet no en té cap.
    expect(buitsDe(classificaArbre(ARBRE), { avui: AVUI }).filter((b) => b.codi === 'TRIMESTRE_SENSE_CARPETA')).toEqual([]);
  });

  test('extractes mensuals 01, 02, 03 i 05: falta el 04, i res després de l’últim mes sencer d’abans d’avui', () => {
    const arbre = ['01', '02', '03', '05'].map((mm) => e(`${B}/moviments_2026_${mm}.csv`));
    const [buit] = buitsDe(classificaArbre(arbre), { avui: { a: 2026, m: 6, d: 15 } });
    expect(buit).toMatchObject({ codi: 'MES_SENSE_EXTRACTE', severitat: 'mitjana', serie: 'moviments', falten: ['04/2026'], mesos: [{ a: 2026, m: 4 }] });
    expect(buitsDe(classificaArbre(arbre), { avui: AVUI })[0].falten).toEqual(['04/2026', '06/2026', '07/2026', '08/2026', '09/2026']);
    // Un mes sol no fa sèrie.
    expect(buitsDe(classificaArbre([e(`${B}/moviments_2026_01.csv`)]), { avui: AVUI })).toEqual([]);
  });

  test('un comptador dens 0001..0005 sense el 0003 és una pista FORAT_SERIE, baixa; uns identificadors escampats, res', () => {
    const buits = buitsDe(classificaArbre(ARBRE), { avui: AVUI });
    expect(buits.filter((b) => b.codi === 'FORAT_SERIE')).toEqual([
      expect.objectContaining({ severitat: 'baixa', serie: 'invoice-prova-', falten: ['0003'] })
    ]);
    const escampats = ['0010', '0040', '0090'].map((n) => e(`${F}/2026_3T/Invoice-ALTRE-${n}.pdf`));
    expect(buitsDe(classificaArbre(escampats), { avui: AVUI })).toEqual([]);
    // Sense cap zero davant (un any, un import) no és un comptador.
    const senseZeros = ['2023', '2024', '2026'].map((n) => e(`${F}/2026_3T/resum-${n}.pdf`));
    expect(buitsDe(classificaArbre(senseZeros), { avui: AVUI })).toEqual([]);
  });

  test('una sèrie mensual de factures densa amb un mes absent', () => {
    const arbre = ['01', '02', '04', '05'].map((mm) => e(`${F}/2026_2T/proveidor-gamma-${mm}-2026.pdf`));
    const forats = buitsDe(classificaArbre(arbre), { avui: AVUI }).filter((b) => b.codi === 'FORAT_SERIE');
    expect(forats).toEqual([expect.objectContaining({ serie: 'proveidor gamma', falten: ['03/2026'] })]);
  });
});

describe('alertesDe', () => {
  test('un .pfx o un .p12 és CREDENCIAL_SOLTA, alta; un .p7s no; un .key, mitjana', () => {
    const alertes = perRuta(alertesDe(classificaArbre([
      e('x/clau.pfx'), e('x/certificat.p12'), e('x/firma.p7s'), e('x/presentacio.key'), e('x/contrasenya.txt'),
      e('90_Arxiu_Historic/certificat_antic.pfx')
    ])));
    expect(alertes['x/clau.pfx']).toMatchObject({ codi: 'CREDENCIAL_SOLTA', severitat: 'alta' });
    expect(alertes['x/certificat.p12']).toMatchObject({ severitat: 'alta' });
    expect(alertes['x/contrasenya.txt']).toMatchObject({ severitat: 'alta' });
    expect(alertes['x/presentacio.key']).toMatchObject({ severitat: 'mitjana' });
    expect(alertes['90_Arxiu_Historic/certificat_antic.pfx']).toMatchObject({ severitat: 'alta' });
    expect(alertes['x/firma.p7s']).toBeUndefined();
  });

  /* Revisió adversarial 13-10-2026, troballes PRIV-2, ORD-1 i FP-1: una credencial de la carpeta de la identitat legal
     (també la de dins de l'arxiu) no porta cap ruta ni cap nom: una alerta per carpeta, amb el recompte. Sense el
     canvi, alertesDe copiava `ruta: d.ruta` i el JSON portava els noms dels fitxers. */
  test('les credencials de la identitat (també dins de l’arxiu): la carpeta i el recompte, cap nom ni cap ruta', () => {
    const arbre = [
      e('01_Identitat_Legal/certificat_titular_prova.p12'), e('01_Identitat_Legal/Titular_Prova/clau_signatura_prova.pfx'),
      e('90_Arxiu_Historic/01_Identitat_Legal/presentacio_antiga_prova.key'), e('x/clau.pfx')
    ];
    const alertes = alertesDe(classificaArbre(arbre));
    const json = JSON.stringify(alertes);
    for (const tros of ['certificat_titular_prova', 'clau_signatura_prova', 'presentacio_antiga_prova', 'Titular_Prova', '.p12']) {
      expect(json).not.toContain(tros);
    }
    expect(alertes).toEqual([
      expect.objectContaining({ codi: 'CREDENCIAL_SOLTA', severitat: 'alta', identitat: true, carpeta: '01_Identitat_Legal', n: 2 }),
      expect.objectContaining({ codi: 'CREDENCIAL_SOLTA', severitat: 'mitjana', identitat: true, carpeta: '90_Arxiu_Historic/01_Identitat_Legal', n: 1 }),
      expect.objectContaining({ codi: 'CREDENCIAL_SOLTA', severitat: 'alta', ruta: 'x/clau.pfx' })
    ]);
    expect(alertes.filter((a) => a.identitat).every((a) => !('ruta' in a))).toBe(true);
    expect(alertes[0].missatge).toMatch(/^2 fitxers de la carpeta de la identitat legal pareixen credencials/);
    // La radiografia compta fitxers (4 credencials) i files de la Taula · Alertes (3).
    const { radiografia } = analitzaCarpeta({ entrades: arbre, avui: AVUI });
    expect(radiografia.alertes).toEqual({ total: 3, credencials: 4 });
  });
});

describe('triaExtractes', () => {
  const tria = (arbre, formats, opcions = {}) => perRuta(triaExtractes(classificaArbre(arbre), { formats, ...opcions }));

  test('amb una Norma 43, s’hi afigen només els CSV del Tauler; el CSV d’un altre format no', () => {
    const files = tria(ARBRE, FORMATS);
    expect(files[`${B}/moviments_compte.n43`]).toMatchObject({ format: 'n43', preseleccionat: true, seleccionable: true, codi: null });
    expect(files[`${B}/bancpoble.csv`]).toMatchObject({ format: 'csv-tauler', preseleccionat: true });
    expect(files[`${B}/bancpoble_2026.csv`]).toMatchObject({ format: 'csv-tauler', preseleccionat: true });
    expect(files[`${F}/2026_1T/moviments_2026_01.csv`]).toMatchObject({ format: 'csv-altre', preseleccionat: false, seleccionable: false, codi: 'CSV_ALTRE_FORMAT' });
    expect(files[`${B}/moviments_export.xls`]).toMatchObject({ format: 'xls', preseleccionat: false, codi: 'EXTRACTE_NO_LLEGIBLE' });
    expect(Object.keys(files)).toHaveLength(5);
  });

  test('sense Norma 43, «bancpoble» i «bancpoble_2026» poden solapar-se: se’n preselecciona un, el més gran', () => {
    const arbre = [e(`${B}/bancpoble.csv`, 1200), e(`${B}/bancpoble_2026.csv`, 3600)];
    const files = tria(arbre, { [`${B}/bancpoble.csv`]: 'csv-tauler', [`${B}/bancpoble_2026.csv`]: 'csv-tauler' });
    expect(files[`${B}/bancpoble_2026.csv`]).toMatchObject({ preseleccionat: true, codi: null });
    expect(files[`${B}/bancpoble.csv`]).toMatchObject({
      preseleccionat: false, seleccionable: true, codi: 'EXTRACTES_SOLAPATS_POSSIBLES', severitat: 'mitjana', solapaAmb: `${B}/bancpoble_2026.csv`
    });
  });

  test('una sèrie de mesos diferents no se solapa', () => {
    const arbre = [e(`${B}/moviments_2026_01.csv`), e(`${B}/moviments_2026_02.csv`)];
    const files = Object.values(tria(arbre, { [`${B}/moviments_2026_01.csv`]: 'csv-tauler', [`${B}/moviments_2026_02.csv`]: 'csv-tauler' }));
    expect(files.map((f) => f.preseleccionat)).toEqual([true, true]);
  });

  test('el mateix sha256 no s’aboca dues vegades', () => {
    const arbre = [e(`${B}/banc_alfa.csv`, 80, { sha256: sha('b') }), e(`${F}/2026_3T/moviments_juliol.csv`, 80, { sha256: sha('b') })];
    const files = tria(arbre, { [`${B}/banc_alfa.csv`]: 'csv-tauler', [`${F}/2026_3T/moviments_juliol.csv`]: 'csv-tauler' });
    const [primer, segon] = [files[`${F}/2026_3T/moviments_juliol.csv`], files[`${B}/banc_alfa.csv`]];
    expect(primer).toMatchObject({ preseleccionat: true, codi: null });
    expect(segon).toMatchObject({ preseleccionat: false, seleccionable: false, codi: 'DUPLICAT_EXACTE', solapaAmb: `${F}/2026_3T/moviments_juliol.csv` });
  });

  test('sense el cap llegit, o amb un cap que no és d’extracte, no se suposa res: no s’aboca', () => {
    const files = tria([e(`${B}/moviments_compte.n43`), e(`${B}/notes.txt`)], { [`${B}/notes.txt`]: 'no' });
    expect(files[`${B}/moviments_compte.n43`]).toMatchObject({ format: 'no', preseleccionat: false, codi: 'EXTRACTE_NO_LLEGIBLE' });
    expect(files[`${B}/notes.txt`]).toMatchObject({ format: 'no', preseleccionat: false, codi: 'EXTRACTE_NO_LLEGIBLE' });
  });

  test('una Norma 43 que el cap diu CSV no s’aboca (el Tauler la llegiria per l’extensió)', () => {
    const files = tria([e(`${B}/moviments.txt`)], new Map([[`${B}/moviments.txt`, 'csv-tauler']]));
    expect(files[`${B}/moviments.txt`]).toMatchObject({ format: 'no', preseleccionat: false });
  });

  test('més de 24: MASSA_EXTRACTES, amb exactament 24 preseleccionats, els més recents pel nom', () => {
    const noms = Array.from({ length: 30 }, (_, i) => `${B}/extracte_${2024 + Math.floor(i / 12)}${String((i % 12) + 1).padStart(2, '0')}.n43`);
    const files = triaExtractes(classificaArbre(noms.map((ruta) => e(ruta))), { formats: Object.fromEntries(noms.map((r) => [r, 'n43'])) });
    expect(files.filter((f) => f.preseleccionat)).toHaveLength(24);
    const fora = files.filter((f) => f.codi === 'MASSA_EXTRACTES');
    expect(fora.map((f) => f.ruta)).toEqual(noms.slice(0, 6));
    expect(fora.every((f) => f.seleccionable && f.severitat === 'mitjana')).toBe(true);
    expect(triaExtractes(classificaArbre(noms.map((ruta) => e(ruta))), { formats: Object.fromEntries(noms.map((r) => [r, 'n43'])), maxim: 5 })
      .filter((f) => f.preseleccionat).map((f) => f.ruta)).toEqual(noms.slice(25));
  });
});

describe('radiografiaDe i analitzaCarpeta', () => {
  const analisi = analitzaCarpeta({ nom: 'carpeta_de_prova', entrades: ARBRE, formats: FORMATS, avui: AVUI });

  test('els recomptes de l’arbre de prova', () => {
    const { radiografia } = analisi;
    expect(radiografia).toMatchObject({
      esquema: ESQUEMA_RADIOGRAFIA, carpeta: 'carpeta_de_prova', fitxers: 31, descartats: 2,
      perCategoria: { bancs: 5, factures: 14, identitat: 3, burocracia: 2, arxiu: 3, codi: 3, altres: 1 },
      bancs: { candidats: 5, llegibles: 3, noLlegibles: 2, preseleccionats: 3 },
      identitat: { carpetes: 1, fitxers: 3 },
      duplicats: { grups: 2, copies: 2, entreTrimestres: 1 },
      incongruencies: { total: 4, alta: 0, mitjana: 1, baixa: 2, info: 1 },
      buits: { total: 1, trimestres: 0, mesos: 0, series: 1 },
      alertes: { total: 1, credencials: 1 }
    });
    expect(radiografia.factures.perAny).toEqual([{ any: 2024, n: 1 }]);
    expect(radiografia.factures.perTrimestre).toEqual([
      { any: 2025, t: 4, carpeta: `${F}/2025_4T`, factures: 2, rebuts: 0, fulls: 0, csvProveidor: 0, imatges: 0, extractes: 0, altres: 0 },
      { any: 2026, t: 1, carpeta: `${F}/2026_1T`, factures: 2, rebuts: 0, fulls: 1, csvProveidor: 0, imatges: 0, extractes: 1, altres: 0 },
      { any: 2026, t: 2, carpeta: `${F}/2026_2T`, factures: 0, rebuts: 1, fulls: 0, csvProveidor: 0, imatges: 0, extractes: 0, altres: 0 },
      { any: 2026, t: 3, carpeta: `${F}/2026_3T`, factures: 6, rebuts: 0, fulls: 0, csvProveidor: 0, imatges: 1, extractes: 0, altres: 0 }
    ]);
    expect(radiografia.avisos.map((a) => a.codi)).toEqual(['CSV_ALTRE_FORMAT', 'EXTRACTE_NO_LLEGIBLE']);
  });

  test('la radiografia no porta cap ruta: només recomptes (les rutes són a les llistes de detall)', () => {
    const json = JSON.stringify(analisi.radiografia);
    for (const tros of ['Identitat_Legal', 'document_escanejat', 'certificat_antic', 'Invoice-PROVA']) expect(json).not.toContain(tros);
  });

  test('determinista i independent de l’ordre de l’entrada', () => {
    const girat = [...ARBRE].reverse();
    const barrejat = ARBRE.map((x, i) => [(i * 7) % ARBRE.length, x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x);
    for (const entrades of [girat, barrejat]) {
      expect(JSON.stringify(analitzaCarpeta({ nom: 'carpeta_de_prova', entrades, formats: FORMATS, avui: AVUI }))).toBe(JSON.stringify(analisi));
    }
  });

  test('l’eixida no porta cap byte ni cap text dels fitxers', () => {
    const MARCA = 'MARCADOR-SINTETIC-DE-CONTINGUT';
    const ambContingut = ARBRE.map((x) => ({ ...x, bytes: new TextEncoder().encode(MARCA), text: MARCA, contingut: MARCA }));
    const json = JSON.stringify(analitzaCarpeta({ nom: 'carpeta_de_prova', entrades: ambContingut, formats: FORMATS, avui: AVUI }));
    expect(json).not.toContain(MARCA);
    expect(json).not.toContain('"bytes"');
  });

  test('les limitacions de la Font i un arbre sense carpetes són avisos FONT_LIMITADA', () => {
    const { radiografia } = analitzaCarpeta({
      entrades: [e('a.pdf'), e('b.csv')], limitacions: [{ codi: 'X', missatge: 'Una subcarpeta no s’ha pogut llegir.' }, null, { codi: 'Y' }]
    });
    expect(radiografia.avisos.map((a) => [a.codi, a.severitat])).toEqual([['FONT_LIMITADA', 'mitjana'], ['FONT_LIMITADA', 'mitjana']]);
    expect(radiografia.avisos.map((a) => a.missatge)).toContain('Una subcarpeta no s’ha pogut llegir.');
  });

  test('sense entrades, una radiografia buida i vàlida', () => {
    expect(radiografiaDe()).toMatchObject({ esquema: ESQUEMA_RADIOGRAFIA, fitxers: 0, avisos: [], factures: { perTrimestre: [], perAny: [] } });
    expect(analitzaCarpeta({ entrades: null }).radiografia.fitxers).toBe(0);
  });
});
