// @vitest-environment node
/* Finestreta · nucli · Fitxa d'identitat sobirana. Ordre del Mestre,
   13-10-2026 (pla 261013_1405, front H): propostes en memòria, conflictes
   que no es trien sols, confirmats que cap proposta sobreescriu i, al cofre,
   només el confirmat. Identificadors generats amb el seu control. */
import { describe, expect, test } from 'vitest';
import {
  afegixRepresentacio, afegixTitular, afegixTribut, campsConfirmats, confirma, entraAMa, fitxaBuida, fusionaPropostes,
  llegixDelCofre, nouIdFitxa, perAlCofre, portadorDe, rebutja, resum, SCHEMA_FITXA, validaFitxa
} from './fitxaIdentitat.js';
import { CAMPS_IDENTITAT } from './validadorsIdentitat.js';

const LLETRES = 'TRWAGMYFPDXBNJZSQVHLCKE';
const dni = (n) => `${String(n).padStart(8, '0')}${LLETRES[n % 23]}`;
function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return String((10 - ((parells + senars) % 10)) % 10);
}
const cifG = (xifres) => `G${xifres}${controlCif(xifres)}`;
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

const ARA = '2026-10-13T15:40:00Z';
const DESPRES = '2026-10-13T16:05:00Z';
const ids = (n) => nouIdFitxa('tit', new Uint8Array(8).fill(n));
const PERSONA = ids(1);
const ACTIVITAT = ids(2);
const ENTITAT = ids(3);
const NIF = dni(31415926);
const ALTRE_NIF = dni(27182818);

const fontDoc = ({ nom = '251003_vida_laboral.pdf', regla = 'nif-persona', sha = 'ab', tipusDocument = 'vida-laboral' } = {}) => ({
  tipus: 'document', ruta: `01_Identitat_Legal/${nom}`, sha256: sha.repeat(32), tipusDocument, regla
});
const proposta = (camp, valor, font = fontDoc(), titularRol = CAMPS_IDENTITAT[camp].rol) => ({ titularRol, camp, valor, regla: font.regla, confianca: 'alta', font });

function base() {
  let f = fitxaBuida({ ara: ARA });
  f = afegixTitular(f, { id: PERSONA, tipus: 'persona', ambit: 'LLAR', alies: 'Jo' });
  f = afegixTitular(f, { id: ACTIVITAT, tipus: 'persona', ambit: 'ACTIVITAT', alies: 'La meua activitat', persona: PERSONA });
  return afegixTitular(f, { id: ENTITAT, tipus: 'entitat', ambit: 'ENTITAT', alies: 'L’associació' });
}
const valor = (f, id, camp) => portadorDe(f, id).portador.camps[camp];
const codi = (fn) => {
  try {
    fn();
  } catch (e) {
    return e.codi;
  }
  return null;
};

describe('construcció', () => {
  test('una fitxa buida és vàlida i va congelada', () => {
    const f = fitxaBuida();
    expect(f).toEqual({ schema: SCHEMA_FITXA, versio: 1, actualitzat: null, titulars: [], tributs: [], representacions: [] });
    expect(validaFitxa(f)).toEqual([]);
    expect(Object.isFrozen(f.titulars)).toBe(true);
    expect(codi(() => fitxaBuida({ ara: 'ahir' }))).toBe('MOMENT_INVALID');
  });

  test('ids opacs de setze lletres, sense cap xifra', () => {
    expect(PERSONA).toMatch(/^tit_[a-p]{16}$/);
    expect(nouIdFitxa('trb', new Uint8Array([255, 0, 1, 2, 3, 4, 5, 6]))).toBe('trb_ppaaabacadaeafag');
    expect(() => nouIdFitxa('xyz', new Uint8Array(8))).toThrow(TypeError);
    expect(() => nouIdFitxa('tit', new Uint8Array(4))).toThrow(TypeError);
  });

  test('els titulars: àmbits coherents, ids únics, àlies sense identificadors', () => {
    const f = base();
    expect(f.titulars.map((t) => t.ambit)).toEqual(['LLAR', 'ACTIVITAT', 'ENTITAT']);
    expect(f.titulars[1].persona).toBe(PERSONA);
    expect(codi(() => afegixTitular(f, { id: ids(4), tipus: 'persona', ambit: 'ACTIVITAT', alies: 'Sense llar' }))).toBe('FITXA_INVALIDA');
    expect(codi(() => afegixTitular(f, { id: ids(4), tipus: 'entitat', ambit: 'LLAR', alies: 'Mal' }))).toBe('FITXA_INVALIDA');
    expect(codi(() => afegixTitular(f, { id: PERSONA, tipus: 'persona', ambit: 'LLAR', alies: 'Repetit' }))).toBe('FITXA_INVALIDA');
    expect(codi(() => afegixTitular(f, { id: ids(4), tipus: 'persona', ambit: 'LLAR', alies: `DNI ${NIF}` }))).toBe('FITXA_INVALIDA');
    expect(codi(() => afegixTitular(f, { id: 'tit_12345678', tipus: 'persona', ambit: 'LLAR', alies: 'Xifres' }))).toBe('FITXA_INVALIDA');
  });

  test('tributs i representacions apunten a titulars de la fitxa', () => {
    const f = base();
    const trb = nouIdFitxa('trb', new Uint8Array(8).fill(9));
    expect(afegixTribut(f, { id: trb, titular: PERSONA }).tributs).toHaveLength(1);
    expect(codi(() => afegixTribut(f, { id: trb, titular: ACTIVITAT }))).toBe('FITXA_INVALIDA');
    const rep = nouIdFitxa('rep', new Uint8Array(8).fill(9));
    expect(afegixRepresentacio(f, { id: rep, representant: PERSONA, representat: ENTITAT }).representacions).toHaveLength(1);
    expect(codi(() => afegixRepresentacio(f, { id: rep, representant: ENTITAT, representat: PERSONA }))).toBe('FITXA_INVALIDA');
  });
});

describe('fusió de propostes', () => {
  test('una proposta vàlida sola queda «proposat», amb la seua font; la fitxa d’entrada no canvia', () => {
    const f = base();
    const nova = fusionaPropostes(f, [proposta('identificacio.nif', NIF)], { ara: DESPRES });
    expect(valor(nova, PERSONA, 'identificacio.nif')).toEqual({ valor: NIF, estat: 'proposat', fonts: [fontDoc()], alternatives: [], confirmat: null });
    expect(nova.actualitzat).toBe(DESPRES);
    expect(valor(f, PERSONA, 'identificacio.nif')).toBeUndefined();
    expect(Object.isFrozen(valor(nova, PERSONA, 'identificacio.nif').fonts)).toBe(true);
  });

  test('tornar a fusionar el mateix document no canvia res (idempotent)', () => {
    const propostes = [proposta('identificacio.nif', NIF), proposta('seguretatSocial.naf', naf(3, 12345678), fontDoc({ regla: 'naf' }))];
    const una = fusionaPropostes(base(), propostes);
    expect(fusionaPropostes(una, propostes)).toEqual(una);
  });

  test('el mateix valor des de dos documents suma fonts i continua «proposat»', () => {
    const segona = fontDoc({ nom: '260101_resolucio_afiliacio.pdf', sha: 'cd', tipusDocument: 'resolucio-afiliacio' });
    const f = fusionaPropostes(base(), [proposta('identificacio.nif', NIF), proposta('identificacio.nif', NIF, segona)]);
    expect(valor(f, PERSONA, 'identificacio.nif')).toMatchObject({ estat: 'proposat', alternatives: [] });
    expect(valor(f, PERSONA, 'identificacio.nif').fonts).toHaveLength(2);
  });

  test('dos valors vàlids diferents queden «en-conflicte»: mai es tria sol cap', () => {
    const segona = fontDoc({ nom: '260101_vida_laboral.pdf', sha: 'cd' });
    const f = fusionaPropostes(base(), [proposta('identificacio.nif', NIF), proposta('identificacio.nif', ALTRE_NIF, segona)]);
    expect(valor(f, PERSONA, 'identificacio.nif')).toMatchObject({
      valor: NIF, estat: 'en-conflicte', confirmat: null, alternatives: [{ valor: ALTRE_NIF, fonts: [segona] }]
    });
    expect(resum(f).enConflicte).toBe(1);
  });

  test('un valor confirmat no el sobreescriu cap proposta: el nou va a les alternatives (l’avís)', () => {
    let f = fusionaPropostes(base(), [proposta('identificacio.nif', NIF)]);
    f = confirma(f, { titular: PERSONA, camp: 'identificacio.nif' }, { ara: DESPRES });
    const nova = fontDoc({ nom: '260201_vida_laboral.pdf', sha: 'ef' });
    f = fusionaPropostes(f, [proposta('identificacio.nif', ALTRE_NIF, nova)]);
    expect(valor(f, PERSONA, 'identificacio.nif')).toMatchObject({ valor: NIF, estat: 'confirmat', confirmat: DESPRES, alternatives: [{ valor: ALTRE_NIF, fonts: [nova] }] });
    expect(resum(f)).toMatchObject({ confirmat: 1, ambAvis: 1 });
  });

  test('cada rol va al seu titular: la persona, l’activitat i l’entitat', () => {
    const f = fusionaPropostes(base(), [
      proposta('identificacio.nif', NIF),
      proposta('seguretatSocial.naf', naf(3, 1234567), fontDoc({ regla: 'naf' })),
      proposta('entitat.nif', cifG('7654321'), fontDoc({ regla: 'nif-entitat', tipusDocument: 'estatuts' }))
    ]);
    expect(Object.keys(campsConfirmats(f, PERSONA))).toEqual([]);
    expect(Object.keys(portadorDe(f, PERSONA).portador.camps)).toEqual(['identificacio.nif']);
    expect(Object.keys(portadorDe(f, ACTIVITAT).portador.camps)).toEqual(['seguretatSocial.naf']);
    expect(Object.keys(portadorDe(f, ENTITAT).portador.camps)).toEqual(['entitat.nif']);
  });

  test('no hi entren: valors invàlids, camps desconeguts, rols que no quadren, fonts dolentes ni camps de contacte', () => {
    const f = base();
    const nova = fusionaPropostes(f, [
      proposta('identificacio.nom', NIF),
      { titularRol: 'persona', camp: 'banc.iban', valor: 'x', regla: 'x', confianca: 'alta', font: fontDoc() },
      proposta('identificacio.nif', NIF, fontDoc(), 'entitat'),
      proposta('identificacio.nif', NIF, { ...fontDoc(), sha256: 'curt' }),
      proposta('identificacio.nif', NIF, { tipus: 'manual' }),
      proposta('contacte.telefon', ['6', '12', '345', '678'].join('')),
      null
    ]);
    expect(nova.titulars.every((t) => Object.keys(t.camps).length === 0)).toBe(true);
  });

  test('amb dues persones i cap destí, les propostes de la persona no s’hi fusionen; amb destí, sí', () => {
    const segona = ids(5);
    const f = afegixTitular(base(), { id: segona, tipus: 'persona', ambit: 'LLAR', alies: 'Ma mare' });
    expect(Object.keys(portadorDe(fusionaPropostes(f, [proposta('identificacio.nif', NIF)]), PERSONA).portador.camps)).toEqual([]);
    const ambDesti = fusionaPropostes(f, [proposta('identificacio.nif', NIF)], { desti: { persona: segona } });
    expect(valor(ambDesti, segona, 'identificacio.nif').valor).toBe(NIF);
    expect(Object.keys(portadorDe(ambDesti, PERSONA).portador.camps)).toEqual([]);
  });

  test('tributs: un per document, reconegut per la referència; fusionar dues vegades no el duplica', () => {
    const cadastral = rc('1234567', 'VH5797', 'S', '0001');
    const suma = fontDoc({ nom: '251101_notificacion_IBI.pdf', sha: '12', tipusDocument: 'suma', regla: 'referencia-cadastral' });
    const propostes = [proposta('tribut.referenciaCadastral', cadastral, suma), proposta('tribut.concepte', 'IBI-urbana', { ...suma, regla: 'concepte' })];
    const una = fusionaPropostes(base(), propostes);
    expect(una.tributs).toHaveLength(1);
    expect(una.tributs[0]).toMatchObject({ titular: PERSONA });
    expect(una.tributs[0].id).toMatch(/^trb_[a-p]{16}$/);
    expect(fusionaPropostes(una, propostes)).toEqual(una);
    const altreRebut = fontDoc({ nom: '261101_notificacion_IBI.pdf', sha: '34', tipusDocument: 'suma', regla: 'referencia-cadastral' });
    const dos = fusionaPropostes(una, [proposta('tribut.referenciaCadastral', cadastral, altreRebut)]);
    expect(dos.tributs).toHaveLength(1);
    expect(dos.tributs[0].camps['tribut.referenciaCadastral'].fonts).toHaveLength(2);
    const altre = rc('7654321', 'AB1234', 'C', '0002');
    const tres = fusionaPropostes(dos, [proposta('tribut.referenciaCadastral', altre, { ...altreRebut, sha256: '56'.repeat(32) })]);
    expect(tres.tributs).toHaveLength(2);
  });

  test('representacions: la persona i l’entitat, una sola vegada', () => {
    const cert = fontDoc({ nom: 'certificat_representacio.pdf', regla: 'carrec', tipusDocument: 'certificat-representacio' });
    const una = fusionaPropostes(base(), [proposta('representacio.carrec', 'president', cert)]);
    expect(una.representacions).toHaveLength(1);
    expect(una.representacions[0]).toMatchObject({ representant: PERSONA, representat: ENTITAT });
    expect(fusionaPropostes(una, [proposta('representacio.carrec', 'president', cert)])).toEqual(una);
  });
});

describe('les decisions de la persona', () => {
  const enConflicte = () => fusionaPropostes(base(), [
    proposta('identificacio.nif', NIF), proposta('identificacio.nif', ALTRE_NIF, fontDoc({ nom: '260101_x.pdf', sha: 'cd' }))
  ]);

  test('confirmar: sense valor, només si no hi ha alternatives; amb valor, una de les candidates', () => {
    expect(codi(() => confirma(enConflicte(), { titular: PERSONA, camp: 'identificacio.nif' }, { ara: DESPRES }))).toBe('CAL_TRIAR');
    const f = confirma(enConflicte(), { titular: PERSONA, camp: 'identificacio.nif', valor: ALTRE_NIF.toLowerCase() }, { ara: DESPRES });
    expect(valor(f, PERSONA, 'identificacio.nif')).toMatchObject({ valor: ALTRE_NIF, estat: 'confirmat', confirmat: DESPRES, alternatives: [] });
    expect(codi(() => confirma(enConflicte(), { titular: PERSONA, camp: 'identificacio.nif', valor: dni(1) }, { ara: DESPRES }))).toBe('VALOR_DESCONEGUT');
    expect(codi(() => confirma(enConflicte(), { titular: PERSONA, camp: 'identificacio.nif', valor: NIF }))).toBe('MOMENT_INVALID');
    expect(codi(() => confirma(enConflicte(), { titular: ids(9), camp: 'identificacio.nif' }, { ara: DESPRES }))).toBe('TITULAR_DESCONEGUT');
    expect(codi(() => confirma(base(), { titular: PERSONA, camp: 'identificacio.nif' }, { ara: DESPRES }))).toBe('CAMP_BUIT');
  });

  test('rebutjar una alternativa torna a «proposat»; rebutjar el principal puja l’alternativa; sense res, el camp desapareix', () => {
    const senseAlternativa = rebutja(enConflicte(), { titular: PERSONA, camp: 'identificacio.nif', valor: ALTRE_NIF });
    expect(valor(senseAlternativa, PERSONA, 'identificacio.nif')).toMatchObject({ valor: NIF, estat: 'proposat', alternatives: [] });
    const pujada = rebutja(enConflicte(), { titular: PERSONA, camp: 'identificacio.nif' });
    expect(valor(pujada, PERSONA, 'identificacio.nif')).toMatchObject({ valor: ALTRE_NIF, estat: 'proposat', alternatives: [] });
    expect(valor(rebutja(senseAlternativa, { titular: PERSONA, camp: 'identificacio.nif' }), PERSONA, 'identificacio.nif')).toBeUndefined();
    expect(codi(() => rebutja(enConflicte(), { titular: PERSONA, camp: 'identificacio.nif', valor: dni(1) }))).toBe('VALOR_DESCONEGUT');
  });

  test('entrar a mà: confirmat amb font manual; un valor que no passa el validador no entra (regressió Xylella)', () => {
    const f = entraAMa(base(), { titular: PERSONA, camp: 'contacte.telefon', valor: ['+34 6', '12 345 678'].join('') }, { ara: DESPRES });
    expect(valor(f, PERSONA, 'contacte.telefon')).toEqual({ valor: ['6', '12345678'].join(''), estat: 'confirmat', fonts: [{ tipus: 'manual' }], alternatives: [], confirmat: DESPRES });
    expect(codi(() => entraAMa(base(), { titular: PERSONA, camp: 'identificacio.nom', valor: NIF }, { ara: DESPRES }))).toBe('VALOR_INVALID');
    expect(codi(() => entraAMa(base(), { titular: PERSONA, camp: 'seguretatSocial.naf', valor: naf(3, 1) }, { ara: DESPRES }))).toBe('CAMP_INVALID');
    expect(codi(() => entraAMa(base(), { titular: PERSONA, camp: 'banc.iban', valor: 'x' }, { ara: DESPRES }))).toBe('CAMP_INVALID');
  });

  test('entrar a mà una província que no és la del codi postal confirmat: la fitxa no ho accepta', () => {
    const f = entraAMa(base(), { titular: PERSONA, camp: 'domicili.codiPostal', valor: '03837' }, { ara: DESPRES });
    expect(entraAMa(f, { titular: PERSONA, camp: 'domicili.provincia', valor: 'Alacant/Alicante' }, { ara: DESPRES })).toBeTruthy();
    expect(codi(() => entraAMa(f, { titular: PERSONA, camp: 'domicili.provincia', valor: 'Madrid' }, { ara: DESPRES }))).toBe('FITXA_INVALIDA');
  });
});

describe('validaFitxa: claus tancades i referències', () => {
  const mutable = () => JSON.parse(JSON.stringify(fusionaPropostes(base(), [proposta('identificacio.nif', NIF)])));
  const codis = (f) => validaFitxa(f).map((e) => e.codi);

  test('cap clau de més, ni a l’arrel, ni al titular, ni als camps, ni al Valor', () => {
    const arrel = mutable();
    arrel.iban = 'x';
    expect(codis(arrel)).toContain('CAMP_DESCONEGUT');
    const titular = mutable();
    titular.titulars[0].salut = 'x';
    expect(codis(titular)).toContain('CAMP_DESCONEGUT');
    const camp = mutable();
    camp.titulars[0].camps['banc.iban'] = camp.titulars[0].camps['identificacio.nif'];
    expect(codis(camp)).toContain('CAMP_DESCONEGUT');
    const v = mutable();
    v.titulars[0].camps['identificacio.nif'].csv = 'x';
    expect(codis(v)).toContain('CAMP_DESCONEGUT');
  });

  test('un camp al titular que no toca, o un valor que no passa el validador', () => {
    const lloc = mutable();
    lloc.titulars[0].camps['seguretatSocial.naf'] = { valor: naf(3, 1), estat: 'proposat', fonts: [{ tipus: 'manual' }], alternatives: [], confirmat: null };
    expect(codis(lloc)).toContain('CAMP_FORA_DE_LLOC');
    const xylella = mutable();
    xylella.titulars[0].camps['identificacio.nom'] = { valor: NIF, estat: 'confirmat', fonts: [{ tipus: 'manual' }], alternatives: [], confirmat: ARA };
    expect(codis(xylella)).toContain('VALOR_INVALID');
  });

  test('estats i moments coherents', () => {
    const sensemoment = mutable();
    sensemoment.titulars[0].camps['identificacio.nif'].estat = 'confirmat';
    expect(codis(sensemoment)).toContain('CONFIRMAT_INVALID');
    const conflicte = mutable();
    conflicte.titulars[0].camps['identificacio.nif'].estat = 'en-conflicte';
    expect(codis(conflicte)).toContain('ESTAT_INCOHERENT');
    const senseFont = mutable();
    senseFont.titulars[0].camps['identificacio.nif'].fonts = [];
    expect(codis(senseFont)).toContain('FONTS_INVALIDES');
    const fontAmbIban = mutable();
    fontAmbIban.titulars[0].camps['identificacio.nif'].fonts[0].ruta = `01_Identitat_Legal/${['ES76', '0000', '1111', '2222', '3333'].join('_')}.pdf`;
    expect(codis(fontAmbIban)).toContain('FONT_INVALIDA');
  });

  test('referències creuades: l’activitat, el tribut i la representació apunten a qui toca', () => {
    const activitat = mutable();
    activitat.titulars[1].persona = ENTITAT;
    expect(codis(activitat)).toContain('PERSONA_ABSENT');
    const tribut = mutable();
    tribut.tributs.push({ id: nouIdFitxa('trb', new Uint8Array(8)), titular: ids(9), camps: {} });
    expect(codis(tribut)).toContain('TITULAR_ABSENT');
    const rep = mutable();
    rep.representacions.push({ id: nouIdFitxa('rep', new Uint8Array(8)), representant: ENTITAT, representat: ENTITAT, camps: {} });
    expect(codis(rep)).toEqual(expect.arrayContaining(['REPRESENTANT_ABSENT']));
  });
});

describe('lectures i cofre', () => {
  function completa() {
    let f = fusionaPropostes(base(), [
      proposta('identificacio.nif', NIF),
      proposta('identificacio.nom', 'ROSA', fontDoc({ regla: 'nom-cognoms' })),
      proposta('tribut.referenciaCadastral', rc('1234567', 'VH5797', 'S', '0001'), fontDoc({ nom: 'suma.pdf', sha: '12', tipusDocument: 'suma', regla: 'referencia-cadastral' }))
    ]);
    f = confirma(f, { titular: PERSONA, camp: 'identificacio.nif' }, { ara: DESPRES });
    return fusionaPropostes(f, [proposta('identificacio.nif', ALTRE_NIF, fontDoc({ nom: 'nou.pdf', sha: 'cd' }))]);
  }

  test('campsConfirmats: només els confirmats', () => {
    expect(campsConfirmats(completa(), PERSONA)).toEqual({ 'identificacio.nif': NIF });
    expect(campsConfirmats(completa(), ids(9))).toEqual({});
  });

  test('resum: recomptes, cap valor', () => {
    const r = resum(completa());
    expect(r).toEqual({ titulars: 3, tributs: 1, representacions: 0, proposat: 2, enConflicte: 0, confirmat: 1, ambAvis: 1 });
    expect(JSON.stringify(r)).not.toContain(NIF.slice(0, 4));
  });

  test('perAlCofre: només els confirmats, sense alternatives; els tributs sense res confirmat no hi van', () => {
    const cofre = perAlCofre(completa());
    expect(cofre.titulars[0].camps).toEqual({ 'identificacio.nif': { valor: NIF, estat: 'confirmat', fonts: [fontDoc()], alternatives: [], confirmat: DESPRES } });
    expect(cofre.tributs).toEqual([]);
    expect(JSON.stringify(cofre)).not.toContain(ALTRE_NIF);
    expect(JSON.stringify(cofre)).not.toContain('ROSA');
    expect(Object.isFrozen(cofre)).toBe(true);
  });

  test('llegixDelCofre: anada i tornada; refusa propostes, un altre esquema o brossa', () => {
    const cofre = perAlCofre(completa());
    expect(llegixDelCofre(JSON.parse(JSON.stringify(cofre)))).toEqual(cofre);
    expect(codi(() => llegixDelCofre(JSON.parse(JSON.stringify(completa()))))).toBe('FITXA_INVALIDA');
    expect(codi(() => llegixDelCofre({ ...JSON.parse(JSON.stringify(cofre)), schema: 'sdp.altra.v1' }))).toBe('FITXA_INVALIDA');
    for (const brossa of [null, 'text', [], { schema: SCHEMA_FITXA, versio: 1 }]) expect(codi(() => llegixDelCofre(brossa))).toBe('FITXA_INVALIDA');
  });
});
