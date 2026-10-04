// @vitest-environment node
/* Identitat legal · el document custodiat: tipus del catàleg, organisme,
   dates, referència opaca, sha256, sensibilitat i conservació. La salut
   queda fora de l'ERP. Dades sintètiques. */
import { describe, expect, test } from 'vitest';
import {
  conservacioDe, creaDocument, duplicatsPerEmpremta, ORGANISMES, SENSIBILITATS, TIPUS_DOCUMENT, validaDocument
} from './document.js';
import { identificadorsDe, VERIFICAR } from './guardes.js';
import { creaTitular } from './titular.js';

const tros = (...parts) => parts.join('');
const codis = (errors) => errors.map((e) => e.codi);

const ACTIVITAT = creaTitular({ id: 'tit_prova_activitat', tipus: 'persona', ambit: 'ACTIVITAT', alies: 'Activitat de prova', persona: 'tit_prova_llar' });
const LLAR = creaTitular({ id: 'tit_prova_llar', tipus: 'persona', ambit: 'LLAR', alies: 'Casa de prova' });

const RETA = {
  id: 'doc_prova_reta',
  titular: 'tit_prova_activitat',
  tipus: 'reta-alta-baixa',
  organisme: 'TGSS',
  dates: { document: '2026-01-10', notificacio: '2026-01-12', efectes: '2026-01-01' },
  referencia: 'ref_prova_001',
  sha256: 'AB'.repeat(32),
  teCodiVerificacio: true
};

describe('el catàleg', () => {
  test('cada tipus té nom, sensibilitat, àmbits, conservació i cap identificador', () => {
    for (const [id, fitxa] of Object.entries(TIPUS_DOCUMENT)) {
      expect(SENSIBILITATS, id).toContain(fitxa.sensibilitat);
      expect(fitxa.ambits.length, id).toBeGreaterThan(0);
      expect(typeof fitxa.protegit, id).toBe('boolean');
      expect(fitxa.conservacio.text.length, id).toBeGreaterThan(5);
      for (const organisme of fitxa.organismes ?? []) expect(ORGANISMES, id).toContain(organisme);
      expect(identificadorsDe(`${fitxa.nom} ${fitxa.conservacio.text}`), id).toEqual([]);
    }
    expect(Object.isFrozen(TIPUS_DOCUMENT['document-identitat'].conservacio)).toBe(true);
    expect(TIPUS_DOCUMENT.desconegut).toMatchObject({ protegit: true, sensibilitat: 'identitat', conservacio: { regla: 'revisa' } });
  });
});

describe('creaDocument', () => {
  test('una fitxa congelada, amb l’empremta en minúscules i la conservació prudent', () => {
    const doc = creaDocument(RETA, { titular: ACTIVITAT });
    expect(doc).toEqual({
      schema: 'sdp.gestoria.document-custodiat.v1',
      id: 'doc_prova_reta',
      titular: 'tit_prova_activitat',
      tipus: 'reta-alta-baixa',
      organisme: 'TGSS',
      dates: { document: '2026-01-10', notificacio: '2026-01-12', efectes: '2026-01-01' },
      referencia: 'ref_prova_001',
      sha256: 'ab'.repeat(32),
      sensibilitat: 'laboral',
      teCodiVerificacio: true,
      vinculatA: null,
      conservacio: {
        regla: 'anys', fins: '2031-12-31', protegit: true,
        text: '4 anys; es recomana conservar sempre l’últim informe de vida laboral.', verificar: VERIFICAR
      }
    });
    expect(Object.isFrozen(doc.conservacio)).toBe(true);
  });

  test('sense la data de referència, la conservació no inventa cap data', () => {
    const doc = creaDocument({ ...RETA, dates: { document: '2026-01-10' } });
    expect(doc.dates).toEqual({ document: '2026-01-10', notificacio: null, efectes: null });
    expect(doc.conservacio.fins).toBeNull();
    expect(conservacioDe(TIPUS_DOCUMENT.estatuts, {})).toMatchObject({ regla: 'sempre', fins: null, protegit: true });
  });

  test('el model 145 vigent no ix mai llençable: protegit i sense data, per vells que siguen els efectes', () => {
    const doc = creaDocument({
      ...RETA, id: 'doc_prova_145', tipus: 'model-145', organisme: 'ALTRE', dates: { document: '2019-01-01', efectes: '2019-01-01' }
    });
    expect(doc.conservacio).toEqual({ regla: 'vigencia', fins: null, protegit: true, text: 'Mentre estiga vigent, i 4 anys més.', verificar: VERIFICAR });
    // Cap tipus de la regla «vigencia» té data ni ix desprotegit, encara que porte totes les dates.
    const totes = { document: '2000-01-01', notificacio: '2000-01-01', efectes: '2000-01-01' };
    for (const [id, fitxa] of Object.entries(TIPUS_DOCUMENT).filter(([, f]) => f.conservacio.regla === 'vigencia')) {
      expect(conservacioDe(fitxa, totes), id).toMatchObject({ fins: null, protegit: true });
    }
  });

  test('del codi de verificació només es guarda que n’hi ha', () => {
    expect(codis(validaDocument({ ...RETA, teCodiVerificacio: 'codi-de-prova' }))).toEqual(['CODI_VERIFICACIO_INVALID']);
    expect(codis(validaDocument({ ...RETA, codiVerificacio: 'codi-de-prova' }))).toEqual(['CAMP_DESCONEGUT']);
    expect(creaDocument({ ...RETA, teCodiVerificacio: undefined }).teCodiVerificacio).toBe(false);
  });

  test('la salut queda fora de l’ERP', () => {
    const errors = validaDocument({ ...RETA, sensibilitat: 'salut' });
    expect(codis(errors)).toEqual(['FORA_DE_LERP']);
    expect(errors[0].missatge).toMatch(/app Salut/);
  });

  test('la sensibilitat es pot pujar, mai baixar', () => {
    expect(creaDocument({ ...RETA, sensibilitat: 'identitat' }).sensibilitat).toBe('identitat');
    expect(creaDocument({ ...RETA, sensibilitat: 'fiscal' }).sensibilitat).toBe('fiscal');
    expect(codis(validaDocument({ ...RETA, sensibilitat: 'publica' }))).toEqual(['SENSIBILITAT_REBAIXADA']);
    expect(codis(validaDocument({ ...RETA, sensibilitat: 'secreta' }))).toEqual(['SENSIBILITAT_INVALIDA']);
  });

  test('cap referència ni cap camp porta el número d’un document', () => {
    expect(codis(validaDocument({ ...RETA, referencia: tros('ref-', '1234', '5678', 'z') }))).toEqual(['ID_INVALID']);
    expect(codis(validaDocument({ ...RETA, numero: tros('1234', '5678', 'Z') }))).toEqual(['CAMP_DESCONEGUT']);
  });

  test('tipus, organisme i dates', () => {
    expect(codis(validaDocument({ ...RETA, tipus: 'incapacitat-temporal' }))).toEqual(['TIPUS_DESCONEGUT']);
    expect(codis(validaDocument({ ...RETA, organisme: 'CORREUS' }))).toEqual(['ORGANISME_DESCONEGUT']);
    expect(codis(validaDocument({ ...RETA, organisme: 'OEPM' }))).toEqual(['ORGANISME_INCOMPATIBLE']);
    expect(validaDocument({ ...RETA, organisme: 'ALTRE' })).toEqual([]);
    expect(codis(validaDocument({ ...RETA, dates: { document: '2026-01-10', notificacio: '2026-01-09' } }))).toEqual(['DATES_INCOHERENTS']);
    expect(codis(validaDocument({ ...RETA, dates: { document: '2026-02-30', rebuda: '2026-03-01' } }))).toEqual(['CAMP_DESCONEGUT', 'DATA_INVALIDA']);
    expect(codis(validaDocument({ ...RETA, sha256: 'no' }))).toEqual(['SHA256_INVALID']);
  });

  test('el tipus ha de ser de l’àmbit del titular, i la fitxa, seua', () => {
    expect(codis(validaDocument({ ...RETA, titular: 'tit_prova_llar' }, { titular: LLAR }))).toEqual(['AMBIT_INCOMPATIBLE']);
    expect(codis(validaDocument(RETA, { titular: LLAR }))).toEqual(['TITULAR_DIFERENT', 'AMBIT_INCOMPATIBLE']);
    expect(codis(validaDocument(RETA, { titular: { id: 'tit_prova_activitat' } }))).toEqual(['TITULAR_INVALID']);
  });

  test('una signatura apunta al document que signa', () => {
    const signatura = { ...RETA, id: 'doc_prova_signatura', tipus: 'signatura-electronica', organisme: 'ALTRE' };
    expect(codis(validaDocument(signatura))).toEqual(['CAMP_OBLIGATORI']);
    expect(creaDocument({ ...signatura, vinculatA: 'doc_prova_reta' }).conservacio.regla).toBe('com-el-vinculat');
  });

  test('una fitxa invàlida llança DOCUMENT_INVALID', () => {
    let error;
    try { creaDocument({ ...RETA, tipus: 'res' }); } catch (e) { error = e; }
    expect(error.codi).toBe('DOCUMENT_INVALID');
    expect(codis(error.detalls)).toEqual(['TIPUS_DESCONEGUT']);
    expect(codis(validaDocument('res'))).toEqual(['DOCUMENT_INVALID']);
  });
});

describe('duplicatsPerEmpremta', () => {
  test('diu quines fitxes són el mateix fitxer; no en tria cap', () => {
    const a = creaDocument(RETA);
    const b = creaDocument({ ...RETA, id: 'doc_prova_copia', sha256: 'ab'.repeat(32) });
    const c = creaDocument({ ...RETA, id: 'doc_prova_altre', sha256: 'cd'.repeat(32) });
    expect(duplicatsPerEmpremta([c, b, a])).toEqual([{ sha256: 'ab'.repeat(32), ids: ['doc_prova_copia', 'doc_prova_reta'] }]);
    expect(duplicatsPerEmpremta([])).toEqual([]);
  });
});
