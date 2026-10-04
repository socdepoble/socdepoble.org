// @vitest-environment node
/* Gestoria · documents · rebut d'esborrat. Cap rebut sense una confirmació
   vàlida d'una persona; cap contingut ni nom de fitxer dins del rebut; i
   l'empremta i la cadena delaten qualsevol alteració. Dades sintètiques. */
import { describe, expect, test } from 'vitest';
import { CAMPS_REBUT, CODIS_REBUT, ErrorRebut, SCHEMA_REBUT, creaRebutEsborrat, verificaCadena, verificaRebut } from './rebutEsborrat.js';

const SHA_C = 'c'.repeat(64);
const SHA_D = 'd'.repeat(64);
const ARA = { a: 2026, m: 10, d: 4 };
const SENTINELLA = 'Frase Sentinella Sintetica';

/* Un rebut de pagament del 2018 (no protegit), amb ruta i text que el rebut NO ha de portar. */
const justificant = (extra = {}) => ({
  ruta: 'banc/justificant_sentinella.pdf',
  text: SENTINELLA,
  tipus: 'rebut-pagament',
  sha256: SHA_C,
  dates: { data: { a: 2018, m: 1, d: 1 } },
  fets: { basesNegatives: false },
  ...extra
});

const crea = (extra = {}) => creaRebutEsborrat({ document: justificant(), confirmacio: { passos: 2 }, qui: 'titular', ara: ARA, ...extra });

async function codiDe(promesa) {
  try {
    await promesa;
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorRebut);
    return error.codi;
  }
  return null;
}

describe('el rebut', () => {
  test('porta el tipus, el sha256, la data, la regla, qui i la confirmació; res més', async () => {
    const rebut = await crea();
    expect(Object.keys(rebut).sort()).toEqual([...CAMPS_REBUT].sort());
    expect(rebut).toMatchObject({
      schema: SCHEMA_REBUT,
      tipus: 'rebut-pagament',
      sha256: SHA_C,
      data: '2026-10-04',
      dataMinima: '2025-12-31',
      abansDelTermini: false,
      confirmacio: 'dos-passos',
      qui: 'titular',
      anterior: null
    });
    expect(rebut.regla).toMatch(/a verificar amb la gestoria\)$/);
    expect(rebut.empremta).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.isFrozen(rebut)).toBe(true);
    // Ni text ni nom de fitxer original.
    expect(JSON.stringify(rebut)).not.toMatch(/sentinella|justificant|banc\//i);
  });

  test('una persona pot esborrar abans del termini: el rebut ho diu', async () => {
    const rebut = await crea({ ara: { a: 2024, m: 1, d: 1 } });
    expect(rebut).toMatchObject({ data: '2024-01-01', dataMinima: '2025-12-31', abansDelTermini: true });
  });

  test('mai «dins de termini» per defecte: termini desconegut, document vigent o condició pendent, cap rebut', async () => {
    // Una factura sense data: no es pot saber el termini.
    const senseData = { tipus: 'factura-rebuda', sha256: SHA_D, dates: {} };
    expect(await codiDe(creaRebutEsborrat({ document: senseData, confirmacio: { text: 'DDDD-DDDD' }, qui: 'titular', ara: ARA }))).toBe('TERMINI_DESCONEGUT');
    // Un document d'identitat sense data de fi: encara és vigent.
    const vigent = { tipus: 'document-identitat', sha256: SHA_D, dates: {} };
    expect(await codiDe(creaRebutEsborrat({ document: vigent, confirmacio: { text: 'DDDD-DDDD' }, qui: 'titular', ara: ARA }))).toBe('DOCUMENT_VIGENT');
    // Un informe de vida laboral sense saber si n'hi ha un de més nou.
    const informe = { tipus: 'informe-vida-laboral', sha256: SHA_D };
    expect(await codiDe(creaRebutEsborrat({ document: informe, confirmacio: { passos: 2 }, qui: 'titular', ara: ARA }))).toBe('CONDICIO_PENDENT');
    expect(await codiDe(creaRebutEsborrat({ document: { ...informe, fets: { teMesNou: false } }, confirmacio: { passos: 2 }, qui: 'titular', ara: ARA })))
      .toBe('CONDICIO_PENDENT');
    // Amb la condició complida sí: el tipus no té cap termini, i el rebut ho diu (sense data mínima).
    const rebut = await creaRebutEsborrat({ document: { ...informe, fets: { teMesNou: true } }, confirmacio: { passos: 2 }, qui: 'titular', ara: ARA });
    expect(rebut).toMatchObject({ tipus: 'informe-vida-laboral', dataMinima: null, abansDelTermini: false });
    expect(CODIS_REBUT).toEqual(expect.arrayContaining(['DOCUMENT_VIGENT', 'TERMINI_DESCONEGUT', 'CONDICIO_PENDENT']));
  });

  test('determinista: les mateixes dades fan la mateixa empremta', async () => {
    expect((await crea()).empremta).toBe((await crea()).empremta);
    expect((await crea({ qui: 'gestora' })).empremta).not.toBe((await crea()).empremta);
  });
});

describe('cap rebut sense una confirmació vàlida', () => {
  test('un tipus protegit demana el codi escrit; els dos passos no hi basten', async () => {
    const factura = justificant({ tipus: 'factura-rebuda', sha256: SHA_D });
    expect(await codiDe(creaRebutEsborrat({ document: factura, confirmacio: { passos: 2 }, qui: 'titular', ara: ARA }))).toBe('CONFIRMACIO_INVALIDA');
    expect(await codiDe(creaRebutEsborrat({ document: factura, confirmacio: { text: 'DDDD-DDDE' }, qui: 'titular', ara: ARA }))).toBe('CONFIRMACIO_INVALIDA');
    const rebut = await creaRebutEsborrat({ document: factura, confirmacio: { text: 'dddd-dddd' }, qui: 'titular', ara: ARA });
    expect(rebut.confirmacio).toBe('escrita');
  });

  test('un tipus no protegit: dos passos o el codi; un sol pas, no', async () => {
    expect(await codiDe(crea({ confirmacio: { passos: 1 } }))).toBe('CONFIRMACIO_INVALIDA');
    expect(await codiDe(crea({ confirmacio: undefined }))).toBe('CONFIRMACIO_INVALIDA');
    expect((await crea({ confirmacio: { text: 'CCCC-CCCC' } })).confirmacio).toBe('escrita');
  });

  test('el que no s’esborra mai des de l’app no té rebut possible', async () => {
    for (const tipus of ['llibre-verifactu', 'expedient-marca', 'plantilla-en-blanc', 'desconegut']) {
      const paper = justificant({ tipus });
      expect(await codiDe(creaRebutEsborrat({ document: paper, confirmacio: { text: 'CCCC-CCCC' }, qui: 'titular', ara: ARA })), tipus).toBe('TIPUS_MAI');
    }
  });

  test('dades que no valen: tipus, sha256, data, qui i anterior', async () => {
    expect(await codiDe(crea({ document: justificant({ tipus: 'factura' }) }))).toBe('DADES_INVALIDES');
    expect(await codiDe(crea({ document: justificant({ sha256: 'curt' }) }))).toBe('DADES_INVALIDES');
    expect(await codiDe(crea({ ara: 'demà' }))).toBe('DADES_INVALIDES');
    expect(await codiDe(crea({ anterior: 'no és una empremta' }))).toBe('DADES_INVALIDES');
    // Qui: un rol o un àlies, només lletres; mai xifres ni un correu.
    for (const qui of ['', '   ', 'Titular 2', 'persona@casa', 42, null]) {
      expect(await codiDe(crea({ qui })), String(qui)).toBe('DADES_INVALIDES');
    }
    expect((await crea({ qui: '  Na Gestora  ' })).qui).toBe('Na Gestora');
  });
});

describe('verificable', () => {
  test('un rebut íntegre es verifica; un camp canviat, afegit o llevat, no', async () => {
    const rebut = await crea();
    expect(await verificaRebut(rebut)).toEqual({ valid: true, motiu: 'Rebut íntegre.' });
    const alterat = await verificaRebut({ ...rebut, qui: 'altra' });
    expect(alterat.valid).toBe(false);
    expect(alterat.motiu).toMatch(/s'ha alterat/);
    expect((await verificaRebut({ ...rebut, data: '2026-10-05' })).valid).toBe(false);
    const ambRuta = await verificaRebut({ ...rebut, ruta: 'banc/x.pdf' });
    expect(ambRuta).toEqual({ valid: false, motiu: 'Rebut malformat: els camps no són els del rebut.' });
    const sense = { ...rebut };
    delete sense.qui;
    expect((await verificaRebut(sense)).valid).toBe(false);
    for (const res of [null, [], 'rebut', 42]) expect((await verificaRebut(res)).valid).toBe(false);
  });

  test('la cadena: cada rebut apunta a l’anterior; reordenar-la o llevar-ne un es veu', async () => {
    const r1 = await crea();
    const r2 = await crea({ document: justificant({ sha256: SHA_D }), anterior: r1 });
    const r3 = await crea({ anterior: r2.empremta });
    expect(r2.anterior).toBe(r1.empremta);
    expect(await verificaCadena([r1, r2, r3])).toEqual({ valid: true, motiu: '3 rebuts encadenats i íntegres.', index: null });
    expect(await verificaCadena([r2, r1, r3])).toMatchObject({ valid: false, index: 0 });
    expect(await verificaCadena([r1, r3])).toMatchObject({ valid: false, index: 1 });
    expect(await verificaCadena([r1, { ...r2, tipus: 'pressupost' }, r3])).toMatchObject({ valid: false, index: 1 });
    expect(await verificaCadena([])).toMatchObject({ valid: true });
  });
});
