// @vitest-environment node
/* Finestreta · nucli · formularis. Ordre del Mestre, 13-10-2026 (pla
   261013_1405, front H): l'app prepara el tràmit amb els valors CONFIRMATS i
   la persona el signa i el presenta. Inclou la regressió Xylella: un NIF no
   s'escriu mai en un camp de nom. Identificadors generats amb el seu control. */
import { describe, expect, test } from 'vitest';
import {
  afegixRepresentacio, afegixTitular, afegixTribut, entraAMa, fitxaBuida, fusionaPropostes, nouIdFitxa
} from './fitxaIdentitat.js';
import { FORMULARIS, omplixFormulari, validaFormulari, VERIFICAR } from './formularisFinestreta.js';

const LLETRES = 'TRWAGMYFPDXBNJZSQVHLCKE';
const dni = (n) => `${String(n).padStart(8, '0')}${LLETRES[n % 23]}`;
function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return String((10 - ((parells + senars) % 10)) % 10);
}
const ALFABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
const PESOS = [13, 15, 12, 5, 4, 17, 9, 21, 3, 7, 1];
const lletraRc = (cadena) => 'MQWERTYUIOPASDFGHJKLBZX'[[...cadena].reduce((s, c, i) => s + (/\d/.test(c) ? Number(c) : ALFABET.indexOf(c) + 1) * PESOS[i], 0) % 23];
const rc = (...trossos) => {
  const cos = trossos.join('');
  return cos + lletraRc(cos.slice(0, 7) + cos.slice(14, 18)) + lletraRc(cos.slice(7, 14) + cos.slice(14, 18));
};

const ARA = '2026-10-13T15:40:00Z';
const AVUI = '2026-10-13';
const id = (prefix, n) => nouIdFitxa(prefix, new Uint8Array(8).fill(n));
const PERSONA = id('tit', 1);
const ENTITAT = id('tit', 3);
const TRIBUT = id('trb', 7);
const REPRESENTACIO = id('rep', 8);
const NIF = dni(31415926);
const ASSOCIACIO = `G7654321${controlCif('7654321')}`;
const CADASTRAL = rc('1234567', 'VH5797', 'S', '0001');

function fitxaCompleta() {
  let f = fitxaBuida({ ara: ARA });
  f = afegixTitular(f, { id: PERSONA, tipus: 'persona', ambit: 'LLAR', alies: 'Jo' });
  f = afegixTitular(f, { id: ENTITAT, tipus: 'entitat', ambit: 'ENTITAT', alies: 'L’associació' });
  f = afegixTribut(f, { id: TRIBUT, titular: PERSONA });
  f = afegixRepresentacio(f, { id: REPRESENTACIO, representant: PERSONA, representat: ENTITAT });
  const entra = (titular, camp, valor) => {
    f = entraAMa(f, { titular, camp, valor }, { ara: ARA });
  };
  entra(PERSONA, 'identificacio.nif', NIF);
  entra(PERSONA, 'identificacio.nom', 'Rosa Maria');
  entra(PERSONA, 'identificacio.cognom1', 'Ferrando');
  entra(PERSONA, 'identificacio.cognom2', 'de la Peña');
  entra(PERSONA, 'domicili.tipusVia', 'CL');
  entra(PERSONA, 'domicili.via', 'Major');
  entra(PERSONA, 'domicili.numero', '5');
  entra(PERSONA, 'domicili.codiPostal', '03837');
  entra(PERSONA, 'domicili.municipi', 'La Torre de les Maçanes');
  entra(PERSONA, 'contacte.mitjaNotificacio', 'electronica');
  entra(TRIBUT, 'tribut.concepte', 'IBI-urbana');
  entra(TRIBUT, 'tribut.referenciaSuma', '0312345678');
  entra(TRIBUT, 'tribut.referenciaCadastral', CADASTRAL);
  entra(ENTITAT, 'entitat.nif', ASSOCIACIO);
  entra(ENTITAT, 'entitat.denominacio', 'Associació Cultural La Sénia');
  entra(ENTITAT, 'entitat.domiciliSocial', 'Carrer Major, 1, 03837 La Torre de les Maçanes');
  entra(ENTITAT, 'registre.numeroInscripcio', 'CV-01-012345-A');
  entra(REPRESENTACIO, 'representacio.carrec', 'president');
  entra(REPRESENTACIO, 'representacio.vigentDes', '10/01/2024');
  return f;
}

const formulari = (idForm) => FORMULARIS.find((f) => f.id === idForm);
const perId = (resultat) => Object.fromEntries(resultat.camps.map((c) => [c.id, c]));

describe('els quatre formularis', () => {
  test('ids, organismes, font i la marca «a verificar»', () => {
    expect(FORMULARIS.map((f) => f.id)).toEqual(['gva-sollicitud-generica', 'ajuntament-instancia-general', 'suma-sollicitud', 'representacio-entitat']);
    for (const form of FORMULARIS) {
      expect(form.verificar, form.id).toBe(VERIFICAR);
      expect(VERIFICAR).toBe('A verificar contra el model vigent');
      expect(typeof form.font.norma).toBe('string');
      expect(typeof form.font.consulta).toBe('string');
      expect(validaFormulari(form), form.id).toEqual([]);
      expect(form.camps.some((c) => c.id === 'signatura' && c.origen === null), form.id).toBe(true);
      expect(Object.isFrozen(form.camps)).toBe(true);
    }
    expect(JSON.stringify(FORMULARIS)).not.toMatch(/https?:/);
  });

  test('cap camp bancari ix de la fitxa: l’IBAN de SUMA l’escriu la persona', () => {
    for (const form of FORMULARIS) {
      expect(form.camps.filter((c) => /iban|compte|cuenta/i.test(c.id) && c.origen !== null), form.id).toEqual([]);
    }
    expect(perId(omplixFormulari(formulari('suma-sollicitud'), fitxaCompleta(), { avui: AVUI })).iban).toMatchObject({ valor: null, perLaPersona: true });
  });
});

describe('omplir amb valors confirmats', () => {
  test('sol·licitud genèrica de la GVA: llesta, amb la província del codi postal i la data de hui', () => {
    const r = omplixFormulari(formulari('gva-sollicitud-generica'), fitxaCompleta(), { avui: AVUI });
    const c = perId(r);
    expect(r).toMatchObject({ formulari: 'gva-sollicitud-generica', verificar: VERIFICAR, llest: true, falten: 0, aMa: 4 });
    expect(c.nif).toMatchObject({ valor: NIF, estat: 'llest', perLaPersona: false });
    expect(c.nom.valor).toBe('Rosa Maria');
    expect(c.cognom2.valor).toBe('de la Peña');
    expect(c.provincia).toMatchObject({ valor: 'Alacant/Alicante', estat: 'llest' });
    expect(c.lloc.valor).toBe('La Torre de les Maçanes');
    expect(c.data.valor).toBe('13/10/2026');
    expect(c.telefon).toMatchObject({ valor: null, estat: 'falta', obligatori: false });
    expect(c.representantNif).toMatchObject({ estat: 'falta', obligatori: false });
    expect(c.exposa).toMatchObject({ valor: null, perLaPersona: true });
    expect(c.nif.font).toEqual([{ tipus: 'manual' }]);
    expect(Object.isFrozen(r.camps[0])).toBe(true);
  });

  test('instància de l’Ajuntament: també la referència cadastral del tribut', () => {
    const c = perId(omplixFormulari(formulari('ajuntament-instancia-general'), fitxaCompleta(), { avui: AVUI }));
    expect(c.referenciaCadastral).toMatchObject({ valor: CADASTRAL, estat: 'llest' });
  });

  test('SUMA: «COGNOMS, NOM» en majúscules i les dades de l’objecte tributari', () => {
    const r = omplixFormulari(formulari('suma-sollicitud'), fitxaCompleta(), { avui: AVUI, tribut: TRIBUT });
    const c = perId(r);
    expect(c.cognomsNom.valor).toBe('FERRANDO DE LA PEÑA, ROSA MARIA');
    expect(c.concepte.valor).toBe('IBI-urbana');
    expect(c.referenciaSuma.valor).toBe('0312345678');
    expect(r.llest).toBe(true);
  });

  test('representació d’una entitat: l’entitat, el representant, el càrrec i la vigència', () => {
    const r = omplixFormulari(formulari('representacio-entitat'), fitxaCompleta(), { avui: AVUI, representacio: REPRESENTACIO });
    const c = perId(r);
    expect(c.entitatNif.valor).toBe(ASSOCIACIO);
    expect(c.denominacio.valor).toBe('Associació Cultural La Sénia');
    expect(c.representantNom.valor).toBe('Rosa Maria Ferrando de la Peña');
    expect(c.carrec.valor).toBe('president');
    expect(c.vigentDes.valor).toBe('10/01/2024');
    expect(r.llest).toBe(true);
    const senseRepresentacio = omplixFormulari(formulari('representacio-entitat'), fitxaCompleta(), { avui: AVUI });
    expect(senseRepresentacio.llest).toBe(false);
    expect(perId(senseRepresentacio).entitatNif.estat).toBe('falta');
  });
});

describe('el que no s’omplix', () => {
  test('un valor només proposat queda «sense-confirmar», sense valor, i no ix enlloc', () => {
    let f = fitxaBuida();
    f = afegixTitular(f, { id: PERSONA, tipus: 'persona', ambit: 'LLAR', alies: 'Jo' });
    const font = { tipus: 'document', ruta: '01_Identitat_Legal/vida_laboral.pdf', sha256: 'ab'.repeat(32), tipusDocument: 'vida-laboral', regla: 'nif-persona' };
    f = fusionaPropostes(f, [{ titularRol: 'persona', camp: 'identificacio.nif', valor: NIF, regla: 'nif-persona', confianca: 'alta', font }]);
    const r = omplixFormulari(formulari('gva-sollicitud-generica'), f, { avui: AVUI });
    expect(perId(r).nif).toMatchObject({ valor: null, estat: 'sense-confirmar', font: null });
    expect(r.llest).toBe(false);
    expect(JSON.stringify(r)).not.toContain(NIF);
  });

  test('el que falta queda «falta»; sense data de hui, la data també', () => {
    let f = fitxaBuida();
    f = afegixTitular(f, { id: PERSONA, tipus: 'persona', ambit: 'LLAR', alies: 'Jo' });
    const r = omplixFormulari(formulari('gva-sollicitud-generica'), f);
    const c = perId(r);
    expect(c.codiPostal.estat).toBe('falta');
    expect(c.provincia.estat).toBe('falta');
    expect(c.data.estat).toBe('falta');
    expect(r.falten).toBe(11);
  });

  test('regressió Xylella: un NIF guardat al camp del nom no s’escriu mai al formulari', () => {
    const corrompuda = JSON.parse(JSON.stringify(fitxaCompleta()));
    corrompuda.titulars[0].camps['identificacio.nom'].valor = NIF;
    const c = perId(omplixFormulari(formulari('gva-sollicitud-generica'), corrompuda, { avui: AVUI }));
    expect(c.nom).toMatchObject({ valor: null, estat: 'tipus-incompatible' });
    const suma = perId(omplixFormulari(formulari('suma-sollicitud'), corrompuda, { avui: AVUI }));
    expect(suma.cognomsNom).toMatchObject({ valor: null, estat: 'tipus-incompatible' });
  });

  test('regressió Xylella: un formulari que apunta un camp de nom al NIF tampoc l’escriu', () => {
    const malFet = { id: 'prova', camps: [{ id: 'nom', etiqueta: 'Nom', origen: 'persona:identificacio.nif', tipus: 'nom-propi', obligatori: true, transformacio: null }] };
    expect(perId(omplixFormulari(malFet, fitxaCompleta())).nom).toMatchObject({ valor: null, estat: 'tipus-incompatible' });
  });

  test('un camp bancari d’un formulari nou queda per a la persona, encara que apunte a la fitxa', () => {
    const bancari = { id: 'prova', camps: [{ id: 'ibanDomiciliacio', etiqueta: 'IBAN', origen: 'persona:identificacio.nif', tipus: 'nif-persona', obligatori: true, transformacio: null }] };
    const r = omplixFormulari(bancari, fitxaCompleta());
    expect(perId(r).ibanDomiciliacio).toMatchObject({ valor: null, perLaPersona: true });
    expect(JSON.stringify(r)).not.toContain(NIF);
  });

  test('un formulari mal declarat no s’omplix', () => {
    const camp = { id: 'x', etiqueta: 'X', origen: 'persona:identificacio.nif', tipus: 'nif-persona', obligatori: true, transformacio: null };
    for (const dolent of [
      null,
      { id: 'x', camps: [] },
      { id: 'x', camps: [{ ...camp, tipus: 'inventat' }] },
      { id: 'x', camps: [{ ...camp, origen: 'persona:banc.iban' }] },
      { id: 'x', camps: [{ ...camp, origen: 'entitat:identificacio.nif' }] },
      { id: 'x', camps: [{ ...camp, transformacio: 'endevina' }] },
      { id: 'x', camps: [camp, camp] }
    ]) expect(() => omplixFormulari(dolent, fitxaCompleta()), JSON.stringify(dolent)).toThrow(TypeError);
  });

  test('una fitxa absent o estranya no trenca res: tot falta', () => {
    const r = omplixFormulari(formulari('gva-sollicitud-generica'), null, { avui: AVUI });
    expect(perId(r).nif.estat).toBe('falta');
    expect(r.llest).toBe(false);
  });
});
