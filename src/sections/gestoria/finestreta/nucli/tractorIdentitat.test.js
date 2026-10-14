// @vitest-environment node
/* Finestreta · el tractor 'gestoria.identitat'. Ordre del Mestre, 13-10-2026
   (pla 261013_1405, front H). Fail-closed (cap nom ni cap byte de la carpeta
   sense l'aprovació vigent del seu manifest), la taula «Què llegiré i què no»
   sense obrir res, i la lectura: només els permesos i els opacs marcats, mai
   un vetat encara que vinga marcat; l'eixida sense bytes ni text. Una Font
   espia apunta cada nom que es llig. Un autenticador WebAuthn simulat signa
   de veres i la porta ho verifica. Papers sintètics fets ací; cada
   identificador es genera calculant-ne el control, cap s'escriu sencer. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../../tests/helpers/autenticadorSimulat.js';
import { ErrorAprovacio, preparaRegistre } from '../../../tractors/nucli/aprovacio.js';
import { validaManifest } from '../../../tractors/nucli/registre.js';
import { NUCLI_IDENTITAT, TRACTOR_HISTORIC, TRACTOR_IDENTITAT, UI_IDENTITAT } from '../../tractors.js';
import {
  CODIS_AVIS_IDENTITAT, CODIS_TRACTOR_IDENTITAT, ErrorIdentitat, LIMITS_IDENTITAT, MIME_PAPER, executaTractorIdentitat, obriPaperIdentitat,
  planificaTractorIdentitat
} from './tractorIdentitat.js';

const ARA = Date.UTC(2026, 9, 13, 14, 0, 0);
const DIA = 86400000;
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const ALTRA = `sha256:${'cd'.repeat(32)}`;

const autenticador = await creaAutenticadorSimulat();
const ALTERAT = Object.freeze({ ...TRACTOR_IDENTITAT, descripcio: 'Una altra descripció.' });
const SIGNATS = new Map(await Promise.all([TRACTOR_IDENTITAT, TRACTOR_HISTORIC, ALTERAT].map(async (manifest, i) => [
  manifest, await autenticador.signa({ manifest, empremta: EMPREMTA, ara: ARA - 60000, nonce: new Uint8Array(16).fill(i + 40) })
])));
function aprovacioDe(manifest, { empremta = EMPREMTA, registres, ara = ARA } = {}) {
  return {
    manifest, empremta, registres: registres ?? [SIGNATS.get(manifest)], claus: autenticador.claus,
    origen: autenticador.origen, rpId: autenticador.rpId, ara
  };
}
const APROVACIO = aprovacioDe(TRACTOR_IDENTITAT);
const errorDe = (promesa) => promesa.then(() => null, (error) => error);

/* ── Identificadors sintètics, amb el control calculat ── */
const LLETRES = 'TRWAGMYFPDXBNJZSQVHLCKE';
const dni = (n) => `${String(n).padStart(8, '0')}${LLETRES[n % 23]}`;
const PERSONA = dni(31415926);

/* ── Papers sintètics ── */
const latin1 = (text) => new Uint8Array(Buffer.from(text, 'latin1'));
const VIDA_LABORAL = [
  'INFORME DE VIDA LABORAL',
  'TEXT SENTINELLA PRIVAT',
  'Nombre y apellidos: FERRANDO PUIG, ROSA',
  `D.N.I.: ${PERSONA}`,
  'Fecha de nacimiento: 15/03/1975'
].join('\n');
const SALUT = ['INFORME DE VIDA LABORAL', 'Parte de baja por incapacidad temporal', 'Nombre y apellidos: FERRANDO PUIG, ROSA'].join('\n');

/* Un PDF mínim d'una pàgina (com els de nucli/pdfText.test.js): Helvetica sense compressió; xifrat, amb el
   diccionari /Encrypt al tràiler. */
function pdf(contingut, { xifrat = false } = {}) {
  const objectes = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    ...(xifrat ? ['<< /Filter /Standard /V 2 /R 3 /Length 128 /P -1084 /O <00112233> /U <44556677> >>'] : [])
  ];
  const trailer = xifrat ? '/Root 1 0 R /Encrypt 6 0 R /ID [<0a0b> <0a0b>]' : '/Root 1 0 R';
  let cos = '%PDF-1.7\n';
  const offsets = [];
  objectes.forEach((o, i) => {
    offsets.push(cos.length);
    cos += o === null
      ? `${i + 1} 0 obj\n<< /Length ${contingut.length} >>\nstream\n${contingut}\nendstream\nendobj\n`
      : `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const inici = cos.length;
  cos += `xref\n0 ${objectes.length + 1}\n0000000000 65535 f \n${offsets.map((n) => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}`;
  cos += `trailer\n<< /Size ${objectes.length + 1} ${trailer} >>\nstartxref\n${inici}\n%%EOF\n`;
  return latin1(cos);
}
const PDF_AMB_TEXT = pdf('BT /F1 12 Tf 72 780 Td (Nombre y apellidos: FERRANDO PUIG, ROSA) Tj 0 -16 Td (Fecha de nacimiento: 15/03/1975) Tj ET');
const PDF_ESCANEJAT = pdf('0 0 m 100 100 l S');
const PDF_XIFRAT = pdf('BT /F1 12 Tf 72 780 Td (Nombre y apellidos: FERRANDO PUIG, ROSA) Tj ET', { xifrat: true });

/* La carpeta: permesos, opacs, vetats i fora d'abast. */
const RUTES = Object.freeze({
  vida: '01_Identitat_Legal/251003_vida_laboral.txt',
  opac: '01_Identitat_Legal/escanejat_0001.txt',
  opacNoMarcat: '01_Identitat_Legal/document_0002.txt',
  salut: '01_Identitat_Legal/informe_medico.txt',
  banc: '01_Identitat_Legal/titularidad_cuenta.pdf',
  renda: '01_Identitat_Legal/renta_2024.pdf',
  imatge: '01_Identitat_Legal/foto_carnet.jpg',
  arxiu: '01_Identitat_Legal/90_Antic/vida_laboral_vella.txt',
  fora: '02_Facturacio/2026_3T/factura.pdf',
  suma: '03_Burocracia/SUMA/recibo_ibi.txt'
});
function carpeta() {
  return {
    [RUTES.vida]: latin1(VIDA_LABORAL),
    [RUTES.opac]: latin1(VIDA_LABORAL),
    [RUTES.opacNoMarcat]: latin1(VIDA_LABORAL),
    [RUTES.salut]: latin1(VIDA_LABORAL),
    [RUTES.banc]: PDF_AMB_TEXT,
    [RUTES.renda]: PDF_AMB_TEXT,
    [RUTES.imatge]: latin1('no és cap imatge'),
    [RUTES.arxiu]: latin1(VIDA_LABORAL),
    [RUTES.fora]: PDF_AMB_TEXT,
    [RUTES.suma]: latin1('RECIBO SUMA SENSE CAP ETIQUETA')
  };
}

/* La Font espia: llista i llig el que se li dona, i apunta cada crida. */
function fontEspia(fitxers = carpeta(), { limitacions = [], fallen = {} } = {}) {
  const mapa = new Map(Object.entries(fitxers));
  return {
    nom: 'gestoria_sintetica',
    limitacions,
    llista: vi.fn(async () => [...mapa.keys()].sort().map((ruta) => ({ ruta, mida: mapa.get(ruta).length, modificat: ARA }))),
    llig: vi.fn(async (ruta) => {
      if (fallen[ruta]) throw fallen[ruta];
      if (!mapa.has(ruta)) throw Object.assign(new Error('absent'), { codi: 'FITXER_ILLEGIBLE' });
      return mapa.get(ruta).slice();
    })
  };
}
const llegits = (font) => font.llig.mock.calls.map(([ruta]) => ruta).sort();
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

describe('el manifest', () => {
  test('dades personals, signatura, cap xarxa, fitxa pròpia; fonts congelades, ordenades i sense repetir', () => {
    expect(validaManifest(TRACTOR_IDENTITAT)).toEqual([]);
    expect(TRACTOR_IDENTITAT).toMatchObject({
      schema: 'sdp.tractor.v1', id: 'gestoria.identitat', nom: 'Gestoria · Fitxa d’identitat i Finestreta', dadesPersonals: true,
      nivellMinim: 'signatura', xarxa: 'cap', caducitatDies: 90, fitxa: 'src/sections/gestoria/fitxes/gestoria_identitat.md'
    });
    expect(Object.isFrozen(TRACTOR_IDENTITAT.fonts)).toBe(true);
    expect([...TRACTOR_IDENTITAT.fonts]).toEqual([...TRACTOR_IDENTITAT.fonts].sort());
    expect(new Set(TRACTOR_IDENTITAT.fonts).size).toBe(TRACTOR_IDENTITAT.fonts.length);
    expect(Object.isFrozen(UI_IDENTITAT) && Object.isFrozen(NUCLI_IDENTITAT)).toBe(true);
    for (const font of [...UI_IDENTITAT, ...NUCLI_IDENTITAT, 'src/sections/tractors/nucli/aprovacio.js', 'src/sections/gestoria/cofre/cofre.js',
      'src/sections/gestoria/font/fontNavegador.js']) expect(TRACTOR_IDENTITAT.fonts, font).toContain(font);
    for (const ruta of [...TRACTOR_IDENTITAT.fonts, TRACTOR_IDENTITAT.fitxa]) expect(existsSync(path.join(process.cwd(), ruta)), ruta).toBe(true);
    expect(LIMITS_IDENTITAT).toEqual({ fitxers: 60, midaFitxer: 10 * 1024 * 1024 });
    expect(CODIS_TRACTOR_IDENTITAT).toContain('LECTURA_CANCELLADA');
  });

  test('la fitxa diu la llista de vetats, sense OCR, que no signa ni presenta, que només es desen els confirmats i que l’exportació en clar també la porta', () => {
    const fitxa = readFileSync(path.join(process.cwd(), TRACTOR_IDENTITAT.fitxa), 'utf8');
    for (const frase of ['La llista de vetats', 'OCR', 'No signa ni presenta cap tràmit', 'confirmes', 'xifrat', 'exportació en clar',
      'public.profiles', 'No envia res per la xarxa', 'A verificar contra el model vigent']) expect(fitxa, frase).toContain(frase);
  });
});

/* La clausura de l'empremta: el graf estàtic de la vista i del tractor és a les fonts del manifest, i cap font hi
   sobra (llevat de la porta, que entra sencera). La mateixa comprovació que tractors/clausura.test.js fa per a
   l'Històric; la integració de l'onada 3 l'hi afegirà quan el tractor entre a TRACTORS_GESTORIA. */
describe('la clausura de l’empremta', () => {
  const GESTORIA = 'src/sections/gestoria';
  const TRACTORS = 'src/sections/tractors';
  const llig = (ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8');
  const existix = (ruta) => existsSync(path.join(process.cwd(), ruta));
  const dinsCarrils = (ruta) => ruta.startsWith(`${GESTORIA}/`) || ruta.startsWith(`${TRACTORS}/`);
  function especificadors(codi) {
    const trobats = [];
    const visita = (node) => {
      if (!node || typeof node !== 'object') return;
      if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) trobats.push(node.source.value);
      else if (node.type === 'ImportExpression') trobats.push(node.source.value);
      for (const valor of Object.values(node)) {
        if (Array.isArray(valor)) valor.forEach((fill) => { if (fill?.type) visita(fill); });
        else if (valor?.type) visita(valor);
      }
    };
    visita(parse(codi, { sourceType: 'module', plugins: ['jsx'], createImportExpressions: true }).program);
    return trobats;
  }
  function resol(des, especificador) {
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(des), especificador.split('?')[0]));
    return [base, `${base}.js`, `${base}.jsx`].find((ruta) => /\.(?:m?js|jsx)$/.test(ruta) && existix(ruta)) ?? base;
  }
  function clausura(entrades) {
    const vistos = new Set();
    const pendents = [...entrades];
    while (pendents.length) {
      const ruta = pendents.pop();
      if (vistos.has(ruta)) continue;
      vistos.add(ruta);
      for (const e of especificadors(llig(ruta))) {
        if (!e.startsWith('.')) continue;
        const desti = resol(ruta, e);
        if (dinsCarrils(desti) && existix(desti) && !/\.test\./.test(desti)) pendents.push(desti);
      }
    }
    return [...vistos].sort();
  }
  const GRAF = clausura([`${GESTORIA}/finestreta/Finestreta.jsx`, `${GESTORIA}/finestreta/nucli/tractorIdentitat.js`]);

  test('cada fitxer del graf és a les fonts (tractors.js, els manifests, a part) i cap font hi sobra fora de la porta', () => {
    const fora = GRAF.filter((ruta) => ruta !== `${GESTORIA}/tractors.js` && !TRACTOR_IDENTITAT.fonts.includes(ruta));
    expect(fora).toEqual([]);
    const sobrants = TRACTOR_IDENTITAT.fonts.filter((ruta) => !GRAF.includes(ruta) && !ruta.startsWith(`${TRACTORS}/`));
    expect(sobrants).toEqual([]);
    expect(GRAF).toEqual(expect.arrayContaining([`${GESTORIA}/cofre/cofre.js`, `${GESTORIA}/cofre/PortaCofre.jsx`, `${GESTORIA}/nucli/pdfText.js`,
      `${GESTORIA}/font/fontNavegador.js`, `${TRACTORS}/useTractors.js`]));
  });

  test('no penja del banc ni dels models purs: cap fitxer del Tauler, de l’Històric, de l’Escàner ni d’identitat/', () => {
    const aliens = GRAF.filter((ruta) => ['tauler/', 'historic/', 'escaner/', 'identitat/', 'despeses/'].some((c) => ruta.startsWith(`${GESTORIA}/${c}`)));
    expect(aliens).toEqual([]);
  });
});

describe('fail-closed: sense l’aprovació del seu manifest, ni la llista ni cap byte', () => {
  const revocada = [
    SIGNATS.get(TRACTOR_IDENTITAT),
    preparaRegistre({ manifest: TRACTOR_IDENTITAT, empremta: EMPREMTA, decisio: 'revocat', nivell: 'confirmacio', ara: ARA - 1000, nonce: new Uint8Array(16).fill(9) })
  ];
  const CASOS = [
    ['sense cap registre', aprovacioDe(TRACTOR_IDENTITAT, { registres: [] }), 'APROVACIO_REQUERIDA'],
    ['amb l’aprovació de l’Històric', aprovacioDe(TRACTOR_HISTORIC), 'APROVACIO_REQUERIDA'],
    ['amb l’empremta divergent', aprovacioDe(TRACTOR_IDENTITAT, { empremta: ALTRA }), 'EMPREMTA_DIVERGENT'],
    ['amb un manifest alterat', aprovacioDe(ALTERAT), 'EMPREMTA_DIVERGENT'],
    ['amb l’aprovació revocada', aprovacioDe(TRACTOR_IDENTITAT, { registres: revocada }), 'APROVACIO_REVOCADA'],
    ['amb l’aprovació caducada', aprovacioDe(TRACTOR_IDENTITAT, { ara: ARA + 91 * DIA }), 'APROVACIO_CADUCADA'],
    ['sense cap clau registrada', { ...APROVACIO, claus: [] }, 'SIGNATURA_INVALIDA'],
    ['sense aprovació', undefined, 'APROVACIO_REQUERIDA']
  ];

  test.each(CASOS)('la taula, %s: ErrorAprovacio i cap crida a la Font', async (_cas, aprovacio, codi) => {
    const font = fontEspia();
    const error = await errorDe(planificaTractorIdentitat({ font, aprovacio }));
    expect(error).toBeInstanceOf(ErrorAprovacio);
    expect(error.codi).toBe(codi);
    expect(font.llista).not.toHaveBeenCalled();
    expect(font.llig).not.toHaveBeenCalled();
  });

  test.each(CASOS)('la lectura, %s: ErrorAprovacio i cap crida a la Font', async (_cas, aprovacio, codi) => {
    const font = fontEspia();
    const error = await errorDe(executaTractorIdentitat({ font, marcats: [RUTES.opac], aprovacio }));
    expect(error).toBeInstanceOf(ErrorAprovacio);
    expect(error.codi).toBe(codi);
    expect(font.llista).not.toHaveBeenCalled();
    expect(font.llig).not.toHaveBeenCalled();
  });

  test('un senyal ja cancel·lat atura abans de la porta; una Font o unes marques invàlides, després, sense llegir res', async () => {
    const font = fontEspia();
    const controlador = new AbortController();
    controlador.abort();
    expect((await errorDe(planificaTractorIdentitat({ font, aprovacio: APROVACIO, signal: controlador.signal }))).codi).toBe('LECTURA_CANCELLADA');
    expect((await errorDe(executaTractorIdentitat({ font, aprovacio: APROVACIO, signal: controlador.signal }))).codi).toBe('LECTURA_CANCELLADA');
    const invalida = await errorDe(executaTractorIdentitat({ font: {}, aprovacio: APROVACIO }));
    expect(invalida).toBeInstanceOf(ErrorIdentitat);
    expect(invalida.codi).toBe('FONT_INVALIDA');
    expect((await errorDe(executaTractorIdentitat({ font, marcats: RUTES.opac, aprovacio: APROVACIO }))).codi).toBe('PARAMETRES_INVALIDS');
    expect(font.llista).not.toHaveBeenCalled();
    expect(font.llig).not.toHaveBeenCalled();
  });
});

describe('la taula «Què llegiré i què no»: cap byte', () => {
  test('cada fitxer amb la seua decisió i el seu motiu, pel nom i la carpeta; la Font no llig res', async () => {
    const font = fontEspia(carpeta(), { limitacions: [{ codi: 'MASSA_FITXERS', missatge: 'La carpeta té més fitxers dels que es llisten.' }] });
    const pla = await planificaTractorIdentitat({ font, aprovacio: APROVACIO });
    expect(font.llista).toHaveBeenCalledTimes(1);
    expect(font.llig).not.toHaveBeenCalled();
    const perRuta = Object.fromEntries(pla.decisions.map((d) => [d.ruta, [d.decisio, d.motiu]]));
    expect(perRuta).toEqual({
      [RUTES.vida]: ['llegir', 'permes'],
      [RUTES.opac]: ['demanar', 'nom-opac'],
      [RUTES.opacNoMarcat]: ['demanar', 'nom-opac'],
      [RUTES.salut]: ['ometre', 'salut'],
      [RUTES.banc]: ['ometre', 'banc'],
      [RUTES.renda]: ['ometre', 'renda-herencia'],
      [RUTES.imatge]: ['ometre', 'imatge'],
      [RUTES.arxiu]: ['ometre', 'carpeta-exclosa'],
      [RUTES.fora]: ['ometre', 'fora-dabast'],
      [RUTES.suma]: ['llegir', 'permes']
    });
    for (const d of pla.decisions) expect(Object.keys(d).sort()).toEqual(['decisio', 'motiu', 'organisme', 'ruta', 'tipus']);
    expect(pla.avisos).toEqual([{ codi: 'FONT_LIMITADA', severitat: 'mitjana', missatge: 'La carpeta té més fitxers dels que es llisten.', ruta: null }]);
    expect(Object.isFrozen(pla) && Object.isFrozen(pla.decisions[0])).toBe(true);
  });
});

describe('la lectura: només els permesos i els opacs marcats', () => {
  test('un vetat o un de fora no s’obri encara que vinga marcat; un opac sense marcar, tampoc', async () => {
    const font = fontEspia();
    const marcats = [RUTES.opac, RUTES.salut, RUTES.banc, RUTES.fora, RUTES.imatge, RUTES.arxiu, 'no/existix.txt'];
    const r = await executaTractorIdentitat({ font, marcats, aprovacio: APROVACIO });
    expect(llegits(font)).toEqual([RUTES.vida, RUTES.opac, RUTES.suma].sort());
    expect(r.llegits.map((l) => l.ruta).sort()).toEqual([RUTES.vida, RUTES.opac, RUTES.suma].sort());
    /* El paper de SUMA no té cap etiqueta: es llig, però no proposa res. */
    expect(r.llegits.find((l) => l.ruta === RUTES.suma).propostes).toBe(0);
  });

  test('també amb un Set de marques; sense cap marca, només els permesos', async () => {
    const font = fontEspia();
    await executaTractorIdentitat({ font, marcats: new Set([RUTES.opacNoMarcat]), aprovacio: APROVACIO });
    expect(llegits(font)).toEqual([RUTES.vida, RUTES.opacNoMarcat, RUTES.suma].sort());
    const sense = fontEspia();
    await executaTractorIdentitat({ font: sense, aprovacio: APROVACIO });
    expect(llegits(sense)).toEqual([RUTES.vida, RUTES.suma].sort());
  });

  test('les propostes porten la font (ruta i sha256 dels bytes) i cap text del paper; l’eixida és congelada', async () => {
    const font = fontEspia();
    const r = await executaTractorIdentitat({ font, marcats: [], aprovacio: APROVACIO });
    const delPaper = r.propostes.filter((p) => p.font.ruta === RUTES.vida);
    expect(Object.fromEntries(delPaper.map((p) => [p.camp, p.valor]))).toEqual({
      'identificacio.nif': PERSONA,
      'identificacio.nom': 'ROSA',
      'identificacio.cognom1': 'FERRANDO',
      'identificacio.cognom2': 'PUIG',
      'identificacio.dataNaixement': '1975-03-15'
    });
    for (const p of delPaper) {
      expect(p.font).toMatchObject({ tipus: 'document', ruta: RUTES.vida, sha256: sha(latin1(VIDA_LABORAL)), tipusDocument: 'vida-laboral', dataDocument: '2025-10-03' });
    }
    const json = JSON.stringify(r);
    expect(json).not.toContain('SENTINELLA');
    expect(json).not.toContain('INFORME DE VIDA LABORAL');
    expect(Object.isFrozen(r) && Object.isFrozen(r.propostes) && Object.isFrozen(r.avisos)).toBe(true);
  });

  test('un paper permés amb dades de salut no proposa res i ho diu', async () => {
    const font = fontEspia({ [RUTES.vida]: latin1(SALUT) });
    const r = await executaTractorIdentitat({ font, aprovacio: APROVACIO });
    expect(r.propostes).toEqual([]);
    expect(r.avisos.map((a) => [a.codi, a.ruta])).toEqual([['SALUT', RUTES.vida]]);
    expect(JSON.stringify(r)).not.toMatch(/baja|incapacidad/i);
  });
});

describe('els PDF: text de màquina sí; xifrats i escanejats, un avís i cap proposta (sense OCR)', () => {
  const ruta = (nom) => `01_Identitat_Legal/${nom}`;
  test('un PDF generat per màquina dona propostes; un xifrat i un escanejat, l’avís', async () => {
    const font = fontEspia({
      [ruta('vida_laboral.pdf')]: PDF_AMB_TEXT,
      [ruta('vida_laboral_xifrada.pdf')]: PDF_XIFRAT,
      [ruta('vida_laboral_escanejada.pdf')]: PDF_ESCANEJAT
    });
    const r = await executaTractorIdentitat({ font, aprovacio: APROVACIO });
    expect(llegits(font)).toHaveLength(3);
    const perFitxer = (nom) => r.propostes.filter((p) => p.font.ruta === ruta(nom)).map((p) => p.camp).sort();
    expect(perFitxer('vida_laboral.pdf')).toEqual(['identificacio.cognom1', 'identificacio.cognom2', 'identificacio.dataNaixement', 'identificacio.nom']);
    expect(perFitxer('vida_laboral_xifrada.pdf')).toEqual([]);
    expect(perFitxer('vida_laboral_escanejada.pdf')).toEqual([]);
    const avisos = r.avisos.map((a) => [a.codi, a.ruta]);
    expect(avisos).toContainEqual(['PDF_XIFRAT', ruta('vida_laboral_xifrada.pdf')]);
    expect(avisos).toContainEqual(['PDF_SENSE_TEXT', ruta('vida_laboral_escanejada.pdf')]);
    for (const a of r.avisos) expect(CODIS_AVIS_IDENTITAT, a.codi).toContain(a.codi);
    expect(JSON.stringify(r.avisos)).not.toMatch(/FERRANDO|ROSA/);
  });
});

describe('límits, errors de la Font i cancel·lació', () => {
  test('massa papers: MASSA_FITXERS abans de llegir-ne cap', async () => {
    const font = fontEspia();
    const error = await errorDe(executaTractorIdentitat({ font, aprovacio: APROVACIO, limits: { fitxers: 1 } }));
    expect(error.codi).toBe('MASSA_FITXERS');
    expect(font.llig).not.toHaveBeenCalled();
  });

  test('un paper massa gran no es llig; un illegible dona un avís; la resta continua', async () => {
    const font = fontEspia(carpeta(), { fallen: { [RUTES.suma]: Object.assign(new Error('no'), { codi: 'FITXER_ILLEGIBLE' }) } });
    const r = await executaTractorIdentitat({ font, aprovacio: APROVACIO, limits: { midaFitxer: 40 } });
    /* El de la vida laboral passa de 40 bytes: ni s'obri. El de SUMA (30 bytes) falla en llegir-lo. */
    expect(llegits(font)).toEqual([RUTES.suma]);
    expect(r.avisos.map((a) => [a.codi, a.ruta])).toEqual([['FITXER_MASSA_GRAN', RUTES.vida], ['FITXER_ILLEGIBLE', RUTES.suma]]);
    expect(r.propostes).toEqual([]);
  });

  test('una carpeta desenxufada (FONT_OBLIDADA) atura la lectura sencera', async () => {
    const oblidada = Object.assign(new Error('La carpeta s’ha desenxufat.'), { codi: 'FONT_OBLIDADA' });
    const font = fontEspia(carpeta(), { fallen: { [RUTES.vida]: oblidada } });
    const error = await errorDe(executaTractorIdentitat({ font, aprovacio: APROVACIO }));
    expect(error).toBe(oblidada);
    expect(llegits(font)).toEqual([RUTES.vida]);
  });

  test('cancel·lar a mitja lectura: cap paper més, LECTURA_CANCELLADA', async () => {
    const font = fontEspia();
    const controlador = new AbortController();
    const progres = [];
    const onProgres = (p) => {
      progres.push(p);
      if (p.fet === 1) controlador.abort();
    };
    const error = await errorDe(executaTractorIdentitat({ font, marcats: [RUTES.opac], aprovacio: APROVACIO, signal: controlador.signal, onProgres }));
    expect(error.codi).toBe('LECTURA_CANCELLADA');
    expect(font.llig).toHaveBeenCalledTimes(1);
    expect(progres.map((p) => [p.fase, p.fet, p.total])).toEqual([['llegint', 0, 3], ['llegint', 1, 3]]);
  });

  test('un onProgres que falla no atura la lectura', async () => {
    const font = fontEspia();
    const r = await executaTractorIdentitat({ font, aprovacio: APROVACIO, onProgres: () => { throw new Error('pantalla'); } });
    expect(r.llegits).toHaveLength(2);
  });
});

/* Front 6 (ordre del Mestre del 14-10-2026, pla 261013_1930: «Fitxa + obrir el PDF»): tornar a obrir UN paper d'una
   proposta. La mateixa porta abans de tocar la Font; mai un vetat; només PDF i text pla, amb el MIME fix; l'empremta ha
   de ser la de la proposta; l'eixida, els bytes i el tipus, sense cap text extret. */
describe('obriPaperIdentitat: tornar a obrir un paper verificat per empremta', () => {
  const empremtaDe = (ruta) => sha(carpeta()[ruta]);
  const PDF = '01_Identitat_Legal/vida_laboral.pdf';

  test.each([
    ['sense aprovació', undefined, 'APROVACIO_REQUERIDA'],
    ['amb l’aprovació de l’Històric', aprovacioDe(TRACTOR_HISTORIC), 'APROVACIO_REQUERIDA'],
    ['amb l’empremta divergent', aprovacioDe(TRACTOR_IDENTITAT, { empremta: ALTRA }), 'EMPREMTA_DIVERGENT'],
    ['amb l’aprovació caducada', aprovacioDe(TRACTOR_IDENTITAT, { ara: ARA + 91 * DIA }), 'APROVACIO_CADUCADA']
  ])('%s: ErrorAprovacio i cap crida a la Font', async (_cas, aprovacio, codi) => {
    const font = fontEspia();
    const error = await errorDe(obriPaperIdentitat({ font, ruta: RUTES.vida, sha256: empremtaDe(RUTES.vida), aprovacio }));
    expect(error).toBeInstanceOf(ErrorAprovacio);
    expect(error.codi).toBe(codi);
    expect(font.llista).not.toHaveBeenCalled();
    expect(font.llig).not.toHaveBeenCalled();
  });

  test('un vetat, un de fora, un de l’arxiu o una imatge no s’obrin mai (PAPER_VETAT), encara que l’empremta quadre', async () => {
    const font = fontEspia();
    for (const ruta of [RUTES.salut, RUTES.banc, RUTES.renda, RUTES.arxiu, RUTES.fora, RUTES.imatge]) {
      const error = await errorDe(obriPaperIdentitat({ font, ruta, sha256: empremtaDe(ruta), aprovacio: APROVACIO }));
      expect(error, ruta).toBeInstanceOf(ErrorIdentitat);
      expect(error.codi, ruta).toBe('PAPER_VETAT');
    }
    expect(font.llig).not.toHaveBeenCalled();
  });

  test('una extensió que no és PDF ni text pla no s’obri: ni HTML, ni Word, ni un fitxer sense extensió', async () => {
    const rutes = ['01_Identitat_Legal/vida_laboral.html', '01_Identitat_Legal/vida_laboral.docx', '01_Identitat_Legal/vida_laboral'];
    const bytes = latin1(VIDA_LABORAL);
    const font = fontEspia(Object.fromEntries(rutes.map((ruta) => [ruta, bytes])));
    for (const ruta of rutes) {
      expect((await errorDe(obriPaperIdentitat({ font, ruta, sha256: sha(bytes), aprovacio: APROVACIO }))).codi, ruta).toBe('PAPER_VETAT');
    }
    expect(font.llig).not.toHaveBeenCalled();
  });

  test('una empremta diferent (ha canviat o és d’una altra carpeta): PAPER_CANVIAT i cap byte a l’eixida', async () => {
    const font = fontEspia({ [RUTES.vida]: latin1(`${VIDA_LABORAL}\nUna línia de més`) });
    const error = await errorDe(obriPaperIdentitat({ font, ruta: RUTES.vida, sha256: empremtaDe(RUTES.vida), aprovacio: APROVACIO }));
    expect(error).toBeInstanceOf(ErrorIdentitat);
    expect(error.codi).toBe('PAPER_CANVIAT');
    expect(error.message).toBe('Este paper no és el que es va llegir: ha canviat o és d’una altra carpeta.');
    expect(llegits(font)).toEqual([RUTES.vida]);
  });

  test('el MIME és fix per extensió, mai del fitxer; l’eixida porta només els bytes i el tipus, sense cap text extret', async () => {
    expect(MIME_PAPER).toEqual({ pdf: 'application/pdf', txt: 'text/plain;charset=utf-8' });
    const font = fontEspia({ ...carpeta(), [PDF]: PDF_AMB_TEXT });
    /* L'empremta de la proposta es compara sense majúscules. */
    const txt = await obriPaperIdentitat({ font, ruta: RUTES.vida, sha256: empremtaDe(RUTES.vida).toUpperCase(), aprovacio: APROVACIO });
    expect(Object.keys(txt).sort()).toEqual(['bytes', 'tipus']);
    expect(txt.tipus).toBe('text/plain;charset=utf-8');
    expect(txt.bytes).toBeInstanceOf(Uint8Array);
    expect(sha(txt.bytes)).toBe(empremtaDe(RUTES.vida));
    expect(Object.isFrozen(txt)).toBe(true);
    const pdfObert = await obriPaperIdentitat({ font, ruta: PDF, sha256: sha(PDF_AMB_TEXT), aprovacio: APROVACIO });
    expect(pdfObert.tipus).toBe('application/pdf');
    expect(llegits(font)).toEqual([PDF, RUTES.vida].sort());
    expect(font.llista).not.toHaveBeenCalled();
  });

  test('un .pdf que no porta «%PDF-», massa gran o illegible: PAPER_ILLEGIBLE; la carpeta desenxufada es diu tal qual', async () => {
    const fals = latin1('no és cap PDF');
    const font = fontEspia({ ...carpeta(), [PDF]: fals }, { fallen: { [RUTES.suma]: Object.assign(new Error('no'), { codi: 'FITXER_ILLEGIBLE' }) } });
    expect((await errorDe(obriPaperIdentitat({ font, ruta: PDF, sha256: sha(fals), aprovacio: APROVACIO }))).codi).toBe('PAPER_ILLEGIBLE');
    expect((await errorDe(obriPaperIdentitat({
      font, ruta: RUTES.vida, sha256: empremtaDe(RUTES.vida), aprovacio: APROVACIO, limits: { midaFitxer: 40 }
    }))).codi).toBe('PAPER_ILLEGIBLE');
    expect((await errorDe(obriPaperIdentitat({ font, ruta: RUTES.suma, sha256: empremtaDe(RUTES.suma), aprovacio: APROVACIO }))).codi).toBe('PAPER_ILLEGIBLE');
    const oblidada = Object.assign(new Error('La carpeta s’ha desenxufat.'), { codi: 'FONT_OBLIDADA' });
    const desenxufada = fontEspia(carpeta(), { fallen: { [RUTES.vida]: oblidada } });
    expect(await errorDe(obriPaperIdentitat({ font: desenxufada, ruta: RUTES.vida, sha256: empremtaDe(RUTES.vida), aprovacio: APROVACIO }))).toBe(oblidada);
  });

  test('sense ruta, sense una empremta de 64 xifres, sense Font o ja cancel·lat: cap byte llegit; els codis nous són a la llista', async () => {
    const font = fontEspia();
    for (const [ruta, sha256] of [['', empremtaDe(RUTES.vida)], [RUTES.vida, 'abc'], [RUTES.vida, undefined]]) {
      expect((await errorDe(obriPaperIdentitat({ font, ruta, sha256, aprovacio: APROVACIO }))).codi).toBe('PARAMETRES_INVALIDS');
    }
    expect((await errorDe(obriPaperIdentitat({ font: {}, ruta: RUTES.vida, sha256: empremtaDe(RUTES.vida), aprovacio: APROVACIO }))).codi).toBe('FONT_INVALIDA');
    const controlador = new AbortController();
    controlador.abort();
    expect((await errorDe(obriPaperIdentitat({
      font, ruta: RUTES.vida, sha256: empremtaDe(RUTES.vida), aprovacio: APROVACIO, signal: controlador.signal
    }))).codi).toBe('LECTURA_CANCELLADA');
    expect(font.llig).not.toHaveBeenCalled();
    expect(CODIS_TRACTOR_IDENTITAT).toEqual(expect.arrayContaining(['PAPER_VETAT', 'PAPER_CANVIAT', 'PAPER_ILLEGIBLE']));
  });
});
