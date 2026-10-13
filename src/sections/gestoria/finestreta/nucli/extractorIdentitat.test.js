// @vitest-environment node
/* Finestreta · nucli · extractor d'identitat. Ordre del Mestre, 13-10-2026
   (pla 261013_1405, front H). Els textos són sintètics i cada identificador
   es genera ací calculant-ne el control: cap valor real ni escrit a mà. */
import { describe, expect, test } from 'vitest';
import { TIPUS_DOCUMENT_IDENTITAT } from './filtreDocuments.js';
import { CONFIANCES, extreuPropostes, RECEPTES, teCodiVerificacio, teSalut } from './extractorIdentitat.js';
import { CAMPS_IDENTITAT } from './validadorsIdentitat.js';

/* ---------- Generadors independents ---------- */
const LLETRES = 'TRWAGMYFPDXBNJZSQVHLCKE';
const dni = (n) => `${String(n).padStart(8, '0')}${LLETRES[n % 23]}`;
function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  const c = (10 - ((parells + senars) % 10)) % 10;
  return { xifra: String(c), lletra: 'JABCDEFGHI'[c] };
}
const cif = (lletra, xifres, forma = 'xifra') => `${lletra}${xifres}${controlCif(xifres)[forma]}`;
function naf(prov, n) {
  const p = String(prov).padStart(2, '0');
  const cos = String(n).padStart(8, '0');
  const base = n < 10000000 ? BigInt(n) + BigInt(prov) * BigInt(10000000) : BigInt(`${p}${cos}`);
  return `${p}${cos}${String(base % 97n).padStart(2, '0')}`;
}
const ALFABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
const PESOS = [13, 15, 12, 5, 4, 17, 9, 21, 3, 7, 1];
const lletraRc = (cadena) => 'MQWERTYUIOPASDFGHJKLBZX'[[...cadena].reduce((s, c, i) => s + (/\d/.test(c) ? Number(c) : ALFABET.indexOf(c) + 1) * PESOS[i], 0) % 23];
const rc = (...trossos) => {
  const cos = trossos.join('');
  return cos + lletraRc(cos.slice(0, 7) + cos.slice(14, 18)) + lletraRc(cos.slice(7, 14) + cos.slice(14, 18));
};
const altraLletra = (l) => LLETRES[(LLETRES.indexOf(l) + 1) % 23];
const iban = (cos) => `ES76 ${cos}`;

const SHA = 'ab'.repeat(32);
const font = (nom = '251003_document.pdf') => ({ ruta: `01_Identitat_Legal/${nom}`, sha256: SHA });
const extreu = (tipus, text, nom) => extreuPropostes({ tipus, text, font: font(nom) });
const perCamp = (propostes) => Object.fromEntries(propostes.map((p) => [p.camp, p.valor]));

const PERSONA = dni(31415926);
const AFILIACIO = naf(3, 12345678);
const ASSOCIACIO = cif('G', '7654321');

function vidaLaboral({ nif = `1 0${PERSONA}`, afiliacio = `${AFILIACIO.slice(0, 2)}/${AFILIACIO.slice(2, 10)}/${AFILIACIO.slice(10)}` } = {}) {
  return [
    'INFORME DE VIDA LABORAL',
    'DATOS IDENTIFICATIVOS · TEXT SENTINELLA',
    'Nombre y apellidos: FERRANDO DE LA PEÑA, ROSA MARIA',
    `Número de la Seguridad Social: ${afiliacio}`,
    `D.N.I.: ${nif}`,
    'Fecha de nacimiento: 15/03/1975',
    'Domicilio: CL MAJOR, 5 2º B',
    'Código postal: 03837',
    'Localidad: LA TORRE DE LES MAÇANES (ALACANT)',
    'SITUACIÓN',
    'R.E. TRABAJADORES AUTONOMOS   01/02/2020   01/02/2020',
    'Código seguro de verificación: QW12ER34TY56UI78'
  ].join('\n');
}

describe('vida laboral', () => {
  test('proposa NIF (des de l’IPF), NAF, nom i cognoms, naixement, domicili i alta al RETA', () => {
    const propostes = extreu('vida-laboral', vidaLaboral());
    expect(perCamp(propostes)).toEqual({
      'identificacio.nif': PERSONA,
      'seguretatSocial.naf': AFILIACIO,
      'identificacio.nom': 'ROSA MARIA',
      'identificacio.cognom1': 'FERRANDO',
      'identificacio.cognom2': 'DE LA PEÑA',
      'identificacio.dataNaixement': '1975-03-15',
      'domicili.tipusVia': 'CL',
      'domicili.via': 'MAJOR',
      'domicili.numero': '5',
      'domicili.complement': '2º B',
      'domicili.codiPostal': '03837',
      'domicili.municipi': 'LA TORRE DE LES MAÇANES',
      'seguretatSocial.dataAlta': '2020-02-01'
    });
    const rol = Object.fromEntries(propostes.map((p) => [p.camp, p.titularRol]));
    expect(rol['identificacio.nif']).toBe('persona');
    expect(rol['seguretatSocial.naf']).toBe('activitat');
    expect(propostes.find((p) => p.camp === 'seguretatSocial.dataAlta').confianca).toBe('baixa');
  });

  test('un control invàlid no es proposa', () => {
    const nifDolent = PERSONA.slice(0, 8) + altraLletra(PERSONA[8]);
    const nafDolent = AFILIACIO.slice(0, 10) + String((Number(AFILIACIO.slice(10)) + 1) % 97).padStart(2, '0');
    const camps = perCamp(extreu('vida-laboral', vidaLaboral({ nif: nifDolent, afiliacio: nafDolent })));
    expect(camps['identificacio.nif']).toBeUndefined();
    expect(camps['seguretatSocial.naf']).toBeUndefined();
    expect(camps['identificacio.nom']).toBe('ROSA MARIA');
  });

  test('sense etiqueta no hi ha proposta: els valors solts no es prenen per res', () => {
    expect(extreu('vida-laboral', `${PERSONA}\n${AFILIACIO}\n03837\n15/03/1975`)).toEqual([]);
    expect(extreu('desconegut', `Referència ${PERSONA} i ${AFILIACIO}`)).toEqual([]);
  });

  test('un nom sense la coma de «COGNOMS, NOM» no es proposa', () => {
    const text = vidaLaboral().replace('FERRANDO DE LA PEÑA, ROSA MARIA', 'ROSA MARIA FERRANDO');
    const camps = perCamp(extreu('vida-laboral', text));
    expect(camps['identificacio.nom']).toBeUndefined();
    expect(camps['identificacio.cognom1']).toBeUndefined();
  });

  test('l’eixida no porta cap text del document, i va congelada', () => {
    const propostes = extreu('vida-laboral', vidaLaboral());
    const json = JSON.stringify(propostes);
    for (const tros of ['SENTINELLA', 'INFORME DE VIDA LABORAL', 'Nombre y apellidos', 'QW12ER34TY56UI78', 'SITUACI']) expect(json).not.toContain(tros);
    expect(Object.isFrozen(propostes)).toBe(true);
    expect(Object.isFrozen(propostes[0].font)).toBe(true);
    for (const p of propostes) expect(Object.keys(p).sort()).toEqual(['camp', 'confianca', 'font', 'regla', 'titularRol', 'valor']);
  });

  test('la font porta la ruta, el sha256, el tipus, la regla i la data del nom quan n’hi ha', () => {
    const [primera] = extreu('vida-laboral', vidaLaboral());
    expect(primera.font).toEqual({ tipus: 'document', ruta: font().ruta, sha256: SHA, tipusDocument: 'vida-laboral', regla: primera.regla, dataDocument: '2025-10-03' });
    const [sensedata] = extreu('vida-laboral', vidaLaboral(), 'vida_laboral.pdf');
    expect(sensedata.font).not.toHaveProperty('dataDocument');
  });
});

describe('guardes', () => {
  test('un text amb dades de salut no proposa res, ni el NIF', () => {
    const text = `${vidaLaboral()}\nParte médico de baja por incapacidad temporal`;
    expect(teSalut(text)).toBe(true);
    expect(extreu('vida-laboral', text)).toEqual([]);
  });

  test('la cobertura d’incapacitat temporal d’una resolució del RETA no és una dada de salut', () => {
    expect(teSalut('Cobertura de incapacidad temporal: SÍ. Contingencias profesionales: SÍ')).toBe(false);
  });

  test('cap IBAN es proposa, encara que porte dins una tira amb forma de NAF', () => {
    const text = `Número de afiliación: ${iban(AFILIACIO)}\nN.º fijo: ${iban('0000 1111 2222 3333 4444')}`;
    const propostes = [...extreu('informe-bases', text), ...extreu('suma', text)];
    expect(propostes).toEqual([]);
  });

  test('cap codi segur de verificació es proposa, ni darrere d’una etiqueta', () => {
    const text = 'N.º fijo: CSV: AB12CD34EF56GH78\nConcepto: IVTM';
    expect(teCodiVerificacio(text)).toBe(true);
    const propostes = extreu('suma', text);
    expect(perCamp(propostes)).toEqual({ 'tribut.concepte': 'IVTM' });
    expect(JSON.stringify(propostes)).not.toContain('AB12CD34EF56GH78');
    expect(teCodiVerificacio('Sense cap codi')).toBe(false);
  });

  test('el CIF d’un organisme no es proposa mai com a NIF de la persona (Kit Digital)', () => {
    const redes = cif('Q', '2891006', 'lletra');
    const agent = cif('B', '1234567');
    const text = [
      'SOLICITUD DE AYUDA KIT DIGITAL',
      `Entidad gestora: Red.es   NIF: ${redes}`,
      'Datos del beneficiario',
      'Razón social: SERRA BOIX, ANNA',
      `NIF: ${PERSONA}`,
      'Domicilio fiscal: AV DEL PLA, 12',
      'Código postal: 46001',
      'Municipio: VALÈNCIA',
      'Epígrafe IAE: 659.9',
      'CNAE: 47.91',
      'Fecha de alta: 01/06/2021',
      `Agente digitalizador: NIF ${agent}`
    ].join('\n');
    const propostes = extreu('kit-digital', text);
    expect(perCamp(propostes)).toEqual({
      'identificacio.nif': PERSONA,
      'domicili.tipusVia': 'AV',
      'domicili.via': 'DEL PLA',
      'domicili.numero': '12',
      'domicili.codiPostal': '46001',
      'domicili.municipi': 'VALÈNCIA',
      'activitat.epigrafIae': '659.9',
      'activitat.cnae': '4791',
      'activitat.dataAltaCensal': '2021-06-01'
    });
    const json = JSON.stringify(propostes);
    expect(json).not.toContain(redes);
    expect(json).not.toContain(agent);
  });

  test('un CIF sol darrere de l’etiqueta del NIF no dona res', () => {
    expect(extreu('suma', `NIF: ${cif('P', '0300000', 'lletra')}`)).toEqual([]);
  });

  test('un tipus desconegut, un text buit o que no és text: cap proposta', () => {
    expect(extreu('nomina', vidaLaboral())).toEqual([]);
    expect(extreu('vida-laboral', '')).toEqual([]);
    expect(extreu('vida-laboral', null)).toEqual([]);
  });

  test('sense la font (ruta i sha256), llança', () => {
    expect(() => extreuPropostes({ tipus: 'vida-laboral', text: vidaLaboral() })).toThrow(TypeError);
    expect(() => extreuPropostes({ tipus: 'vida-laboral', text: vidaLaboral(), font: { ruta: 'x.pdf', sha256: 'curt' } })).toThrow(TypeError);
  });

  test('un document de tipus desconegut només proposa el NIF i el NAF, amb confiança baixa', () => {
    const propostes = extreu('desconegut', vidaLaboral());
    expect(propostes.map((p) => p.camp).sort()).toEqual(['identificacio.nif', 'seguretatSocial.naf']);
    expect(propostes.every((p) => p.confianca === 'baixa')).toBe(true);
  });
});

describe('RETA, SUMA, registre i representació', () => {
  test('resolució del RETA: règim, dates, CNAE i base en cèntims', () => {
    const text = [
      'RESOLUCIÓN SOBRE RECONOCIMIENTO DE ALTA EN EL RÉGIMEN ESPECIAL DE TRABAJADORES AUTÓNOMOS',
      `Número de afiliación: ${AFILIACIO}`,
      `D.N.I.: ${PERSONA}`,
      'Fecha real de alta: 01/02/2020',
      'Fecha de efectos: 01/02/2020',
      'Actividad económica: 6201 Programación informática',
      'Base de cotización: 950,00 euros',
      'Cobertura de incapacidad temporal: SÍ'
    ].join('\n');
    expect(perCamp(extreu('reta', text))).toEqual({
      'identificacio.nif': PERSONA,
      'seguretatSocial.naf': AFILIACIO,
      'seguretatSocial.regim': 'RETA',
      'seguretatSocial.dataAlta': '2020-02-01',
      'seguretatSocial.dataEfectes': '2020-02-01',
      'seguretatSocial.baseCotitzacio': 95000,
      'activitat.cnae': '6201'
    });
  });

  test('notificació de SUMA: tribut amb referència cadastral, número fix, concepte i adreça; l’IBAN no', () => {
    const cadastral = rc('1234567', 'VH5797', 'S', '0001');
    const text = [
      'SUMA GESTIÓ TRIBUTÀRIA',
      'Titular: SERRA BOIX, ANNA',
      `NIF: ${PERSONA}`,
      'Domicilio fiscal: CL SANT JOSEP, 7',
      'Concepto: IBI URBANA',
      `Referencia catastral: ${cadastral}`,
      'N.º fijo: 0312345678',
      'Domicilio tributario: CL SANT JOSEP 7 LA TORRE DE LES MAÇANES',
      `IBAN: ${iban('0000 1111 2222 3333 4444')}`,
      `Entidad: SUMA   CIF ${cif('P', '0300000', 'lletra')}`
    ].join('\n');
    const propostes = extreu('suma', text);
    expect(perCamp(propostes)).toEqual({
      'identificacio.nif': PERSONA,
      'identificacio.nom': 'ANNA',
      'identificacio.cognom1': 'SERRA',
      'identificacio.cognom2': 'BOIX',
      'domicili.tipusVia': 'CL',
      'domicili.via': 'SANT JOSEP',
      'domicili.numero': '7',
      'tribut.referenciaCadastral': cadastral,
      'tribut.referenciaSuma': '0312345678',
      'tribut.concepte': 'IBI-urbana',
      'tribut.adreca': 'CL SANT JOSEP 7 LA TORRE DE LES MAÇANES'
    });
    expect(propostes.filter((p) => p.camp.startsWith('tribut.')).every((p) => p.titularRol === 'tribut')).toBe(true);
    expect(JSON.stringify(propostes)).not.toContain('1111');
  });

  test('una referència cadastral amb el control erroni no es proposa', () => {
    const bona = rc('1234567', 'VH5797', 'S', '0001');
    const dolenta = bona.slice(0, 19) + (bona[19] === 'M' ? 'Q' : 'M');
    expect(perCamp(extreu('suma', `Referencia catastral: ${dolenta}`))).toEqual({});
  });

  test('inscripció al registre d’associacions', () => {
    const text = [
      'REGISTRO DE ASOCIACIONES',
      'Denominación: ASSOCIACIÓ CULTURAL LA SÉNIA',
      `CIF: ${ASSOCIACIO}`,
      'Número de inscripción: CV-01-012345-A',
      'Sección: Primera',
      'Fecha de inscripción: 12/05/2015',
      'Domicilio social: CL MAJOR, 1, 03837 LA TORRE DE LES MAÇANES'
    ].join('\n');
    const propostes = extreu('registre-associacions', text);
    expect(perCamp(propostes)).toEqual({
      'entitat.nif': ASSOCIACIO,
      'entitat.denominacio': 'ASSOCIACIÓ CULTURAL LA SÉNIA',
      'entitat.domiciliSocial': 'CL MAJOR, 1, 03837 LA TORRE DE LES MAÇANES',
      'registre.numeroInscripcio': 'CV-01-012345-A',
      'registre.seccio': 'PRIMERA',
      'registre.dataInscripcio': '2015-05-12'
    });
    expect(propostes.find((p) => p.camp === 'entitat.nif').confianca).toBe('alta');
  });

  test('un CIF d’entitat sense la G es proposa amb confiança baixa', () => {
    const societat = cif('B', '2468013');
    const [proposta] = extreu('estatuts', `CIF: ${societat}`);
    expect(proposta).toMatchObject({ camp: 'entitat.nif', valor: societat, confianca: 'baixa' });
  });

  test('certificat de representació: entitat, representant i càrrec; la persona, amb confiança baixa', () => {
    const text = [
      'CERTIFICADO DE REPRESENTACIÓN',
      'Denominación: ASSOCIACIÓ CULTURAL LA SÉNIA',
      `NIF de la entidad: ${ASSOCIACIO}`,
      'Apellidos y nombre: SERRA BOIX, ANNA',
      `D.N.I.: ${PERSONA}`,
      'Cargo: Presidenta',
      'Fecha de nombramiento: 10/01/2024'
    ].join('\n');
    const propostes = extreu('certificat-representacio', text);
    expect(perCamp(propostes)).toEqual({
      'entitat.nif': ASSOCIACIO,
      'entitat.denominacio': 'ASSOCIACIÓ CULTURAL LA SÉNIA',
      'identificacio.nif': PERSONA,
      'identificacio.nom': 'ANNA',
      'identificacio.cognom1': 'SERRA',
      'identificacio.cognom2': 'BOIX',
      'representacio.carrec': 'president',
      'representacio.vigentDes': '2024-01-10'
    });
    expect(propostes.find((p) => p.camp === 'identificacio.nif').confianca).toBe('baixa');
    expect(propostes.find((p) => p.camp === 'representacio.carrec').titularRol).toBe('representacio');
  });
});

/* Revisió adversarial 13-10-2026, troballa ID-F8: la guarda de salut també en valencià. Sense ella, un paper
   opac marcat amb el part mèdic en valencià proposava el NIF i no donava cap avís de salut. */
describe('ID-F8: les dades de salut en valencià', () => {
  test.each([
    'Part mèdic de baixa per incapacitat temporal',
    'PART MÈDIC DE BAIXA/ALTA D’INCAPACITAT TEMPORAL',
    'Part de baixa',
    'Part de confirmació',
    'Part mèdic d’alta',
    'Informe mèdic',
    'Informe\nmèdic',
    'Procés d’incapacitat temporal: 12 dies',
    'Procés d\'incapacitat temporal',
    'Prestació econòmica per incapacitat temporal',
    'Prestació d’incapacitat temporal',
    'Pagament directe de la prestació',
    'Grau de minusvalidesa: 33 %'
  ])('«%s» és una dada de salut', (text) => {
    expect(teSalut(text)).toBe(true);
  });

  test.each([
    'Cobertura d’incapacitat temporal: SÍ. Contingències professionals: SÍ',
    'Incapacitat temporal: opció acollida',
    'Cobertura per incapacitat temporal i per contingències professionals',
    'Una part de la quota'
  ])('la cobertura del RETA no ho és: «%s»', (text) => {
    expect(teSalut(text)).toBe(false);
  });

  test('un paper opac amb el part mèdic en valencià no proposa res, ni el NIF; amb la cobertura sola, sí', () => {
    expect(extreu('desconegut', `Part mèdic de baixa per incapacitat temporal\nDNI: ${PERSONA}`)).toEqual([]);
    expect(perCamp(extreu('desconegut', `Cobertura d’incapacitat temporal: SÍ\nDNI: ${PERSONA}`))).toEqual({ 'identificacio.nif': PERSONA });
  });
});

/* Revisió adversarial 13-10-2026, troballes ID-F3 i ID-F7: una adreça mal partida és pitjor que cap. */
describe('ID-F3 i ID-F7: el domicili, partit bé o gens', () => {
  const domicili = (text, tipus = 'vida-laboral') => Object.fromEntries(Object.entries(perCamp(extreu(tipus, text))).filter(([camp]) => camp.startsWith('domicili.')));

  test('ID-F3: el municipi de la mateixa línia no és el pis ni la porta', () => {
    expect(domicili('Domicilio fiscal: CL SANT JOSEP 7 LA TORRE DE LES MAÇANES', 'suma'))
      .toEqual({ 'domicili.tipusVia': 'CL', 'domicili.via': 'SANT JOSEP', 'domicili.numero': '7' });
    expect(domicili('Domicilio: CL MAJOR 5 ALICANTE')).toEqual({ 'domicili.tipusVia': 'CL', 'domicili.via': 'MAJOR', 'domicili.numero': '5' });
  });

  test.each(['LA TORRE DE LES MAÇANES', 'ALICANTE', 'PISA', 'PORTALET', 'BAIXADA', 'ESCOLA'])('ID-F3: «%s» darrere del número no és cap complement', (resta) => {
    expect(domicili(`Domicilio: CL MAJOR, 5 ${resta}`)['domicili.complement']).toBeUndefined();
  });

  test.each(['2º B', 'ESC A 3º 1ª', 'PORTAL 2', '3º IZQDA', '1º DRCHA', '2ª ESQ', '4t ESQUERRA', 'PIS 1 DRETA', 'ÀTIC', 'BAIXOS'])(
    'ID-F3: «%s» sí que és un complement', (complement) => {
      expect(domicili(`Domicilio: CL MAJOR, 5 ${complement}`)['domicili.complement']).toBe(complement);
    }
  );

  test.each([
    ['Domicilio: CL 9 D\'OCTUBRE 5', { 'domicili.tipusVia': 'CL', 'domicili.via': '9 D\'OCTUBRE', 'domicili.numero': '5' }],
    ['Domicilio: AV 25 D’ABRIL 3', { 'domicili.tipusVia': 'AV', 'domicili.via': '25 D’ABRIL', 'domicili.numero': '3' }],
    ['Domicilio: PZ 1 DE MAIG, 4 2º B', { 'domicili.tipusVia': 'PZ', 'domicili.via': '1 DE MAIG', 'domicili.numero': '4', 'domicili.complement': '2º B' }],
    ['Domicilio: CALLE 18 DE JULIO 7', { 'domicili.tipusVia': 'CL', 'domicili.via': '18 DE JULIO', 'domicili.numero': '7' }],
    ['Domicilio: AV 25 ABRIL 3', { 'domicili.tipusVia': 'AV', 'domicili.via': '25 ABRIL', 'domicili.numero': '3' }]
  ])('ID-F7: una via que comença per un número i és una data: «%s»', (text, esperat) => {
    expect(domicili(text)).toEqual(esperat);
  });

  test.each(['Domicilio: CL 3 CREUS 5', 'Domicilio: 9 D\'OCTUBRE 5', 'Domicilio: AVDA. 7 PINS 2', 'Domicilio: CL, 12'])(
    'ID-F7: una via que no es pot partir bé no es proposa: «%s»', (text) => {
      expect(domicili(text)).toEqual({});
    }
  );
});

describe('les receptes són dades coherents', () => {
  test('cada recepta apunta a un camp del catàleg que no és de contacte, amb tipus i confiances coneguts', () => {
    for (const r of RECEPTES) {
      expect(Object.keys(CAMPS_IDENTITAT), r.id).toContain(r.camp);
      expect(CAMPS_IDENTITAT[r.camp].manual, r.id).toBe(false);
      for (const tipus of r.tipus) expect(TIPUS_DOCUMENT_IDENTITAT, r.id).toContain(tipus);
      const confiances = typeof r.confianca === 'string' ? [r.confianca] : Object.values(r.confianca);
      for (const c of confiances) expect(CONFIANCES, r.id).toContain(c);
      expect(r.etiquetes.length, r.id).toBeGreaterThan(0);
      if (r.mode === 'finestra') expect(r.valor, r.id).toBeInstanceOf(RegExp);
      if (r.mode === 'constant') expect(r.constant, r.id).not.toBeNull();
    }
    expect(new Set(RECEPTES.map((r) => r.id)).size).toBe(RECEPTES.length);
  });

  test('cap recepta per a la salut, el banc, el CSV o el contacte', () => {
    expect(RECEPTES.filter((r) => /iban|compte|salut|csv|contacte/i.test(`${r.id} ${r.camp}`))).toEqual([]);
  });
});
