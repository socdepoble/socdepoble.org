// @vitest-environment node
/* Pla 261016_1530, Onada 0.5 (mòdul 1) i relleu de Codex 261016_1639 (fila
   I09) · El normalitzador adopta l'esquema de mcr.json tal qual, pinta el
   vocabulari literal del pla i no pinta mai de verd un estat desconegut ni
   una matriu caducada. Les dades són de prova, amb la forma de Codex. */
import { describe, expect, test } from 'vitest';
import {
  ETIQUETA_ESTAT, LLINDAR_MATRIU_HORES, MARGE_FUTUR_MINUTS, PREFIX_IDENTITAT_DATA, caducitatDe, estatDeStatus, filtraFiles, instantISO,
  mateixCommit, normalitzaMcr, quadrenElsRecomptes, recompteVist, textPla, toDeLEstat, vistaMatriu
} from './matriuGovern.js';

const HORA = 60 * 60 * 1000;
const ARA = Date.parse('2026-10-16T16:00:00.000Z');
const HEAD = '7a1828ca779ef74284846c9e5a4122cd23945689';
const fila = (id, status, extra = {}) => ({
  id, source: '§0.5', requirement: `Requeriment ${id}`, status, evidence: 'Prova verda.',
  owner: 'Claude implementa; Codex verifica', priority: 'P2', acceptance: 'Prova del flux.', ...extra
});
const MCR = (extra = {}) => ({
  at: new Date(ARA - HORA).toISOString(),
  baseline_head: HEAD,
  scope: 'local-audit',
  statuses: { '[FET I SEGELLAT]': 1, '[PARCIAL]': 1, '[NO FET / PENDENT]': 1 },
  requirements: [fila('F04', '[FET I SEGELLAT]'), fila('F01', '[PARCIAL]'), fila('I09', '[NO FET / PENDENT]', { priority: 'P1' })],
  ...extra
});

describe('estatDeStatus: el vocabulari de Codex, de la taula dels auditors i del mòdul 1', () => {
  test.each([
    ['[FET I SEGELLAT]', 'fet'], ['[PARCIAL]', 'parcial'], ['[NO FET / PENDENT]', 'pendent'],
    ['[NO FET / BLOC PENDENT]', 'pendent'], ['[PENDENT DE SEGÜENT TANDA]', 'pendent'], ['[no fet/pendent]', 'pendent'],
    ['  [parcial] ', 'parcial']
  ])('%s → %s', (status, estat) => expect(estatDeStatus(status)).toBe(estat));

  /* Revisió adversarial del carril F1 (problema 11) · «[FET]» no diu cap segell:
     ja no es pinta «[FET I SEGELLAT]» en verd, cau a desconegut. Derogat:
     «[FET]» → fet. */
  test.each([['[FET]'], ['FET'], ['[GAIREBÉ]'], ['VERD'], [''], [null], [42]])('%s no s’entén: null', (status) => {
    expect(estatDeStatus(status)).toBeNull();
  });

  test('una fila «[FET]» és obsoleta, en taronja, i conserva el que deia', () => {
    const v = vistaMatriu(normalitzaMcr(MCR({ requirements: [fila('A2', '[FET]')] })), { ara: ARA });
    expect(v.files[0]).toMatchObject({ status: '[FET]', estat: 'obsolet', desconegut: true, estatVist: 'obsolet' });
    expect(toDeLEstat(v.files[0].estatVist)).toBe('avis');
  });

  test('les etiquetes són literals del pla, i cap estat és roig; el fet, verd', () => {
    expect(ETIQUETA_ESTAT).toEqual({
      fet: '[FET I SEGELLAT]', parcial: '[PARCIAL]', pendent: '[PENDENT DE SEGÜENT TANDA]', obsolet: 'Obsolet'
    });
    expect(['fet', 'parcial', 'pendent', 'obsolet', 'qualsevol'].map(toDeLEstat)).toEqual(['exit', 'avis', 'avis', 'avis', 'avis']);
  });
});

describe('normalitzaMcr', () => {
  test('adopta l’esquema de Codex sense inventar camps: el que falta és null', () => {
    const m = normalitzaMcr(MCR({ requirements: [fila('F04', '[FET I SEGELLAT]'), { id: 'X1', status: '[PARCIAL]' }] }));
    expect(m.at).toBe(new Date(ARA - HORA).toISOString());
    expect(m.baselineHead).toBe(HEAD);
    expect(m.scope).toBe('local-audit');
    expect(m.files.map((f) => [f.id, f.estat, f.desconegut])).toEqual([['F04', 'fet', false], ['X1', 'parcial', false]]);
    expect(m.files[1]).toMatchObject({ font: null, requeriment: null, evidencia: null, responsable: null, prioritat: null, acceptacio: null });
    // Els camps de Codex tal qual, per a l'empremta.
    expect(m.files[1].brut).toEqual({
      id: 'X1', source: null, requirement: null, status: '[PARCIAL]', evidence: null, owner: null, priority: null, acceptance: null
    });
  });

  test('un estat que no s’entén és obsolet, mai verd', () => {
    const m = normalitzaMcr(MCR({ requirements: [fila('A1', '[VERD]')] }));
    expect(m.files[0]).toMatchObject({ estat: 'obsolet', desconegut: true, status: '[VERD]' });
    const v = vistaMatriu(m, { ara: ARA });
    expect(v.files[0].estatVist).toBe('obsolet');
    expect(toDeLEstat(v.files[0].estatVist)).not.toBe('exit');
  });

  test('les files sense id es descarten i es compten; un id repetit es queda amb la primera', () => {
    const m = normalitzaMcr(MCR({ requirements: [fila('A1', '[PARCIAL]'), { status: '[FET]' }, null, fila('A1', '[FET I SEGELLAT]')] }));
    expect(m.files.map((f) => [f.id, f.estat])).toEqual([['A1', 'parcial']]);
    expect(m.descartades).toBe(2);
    expect(m.duplicats).toEqual(['A1']);
  });

  test.each([[null], [[]], ['text'], [{ at: 'x' }], [{ requirements: {} }]])('%j no és cap matriu: llança amb paraules planes', (brut) => {
    expect(() => normalitzaMcr(brut)).toThrow(/^Este fitxer no és una matriu de requeriments/);
  });

  test('la data de Codex porta microsegons: es llig, i es guarda en UTC amb mil·lisegons', () => {
    expect(instantISO('2026-10-16T15:02:56.740108+00:00')).toBe(Date.parse('2026-10-16T15:02:56.740Z'));
    expect(normalitzaMcr(MCR({ at: '2026-10-16T15:02:56.740108+00:00' })).at).toBe('2026-10-16T15:02:56.740Z');
    expect(instantISO('')).toBeNull();
  });

  test('una data il·legible i un commit mal format són null', () => {
    const m = normalitzaMcr(MCR({ at: 'ahir', baseline_head: 'HEAD' }));
    expect(m.at).toBeNull();
    expect(m.baselineHead).toBeNull();
  });

  /* Revisió adversarial del carril F1 (correcció del camp «pla») · El mcr.json
     de Codex no diu de quin pla és: la identitat de la matriu (la que porta cada
     decisió del Mestre) és «mcr@» i la seua data normalitzada, la mateixa a tots
     els navegadors. Si la matriu el declara, mana el seu. Derogat: `pla` null. */
  test('el pla de la matriu: el que declara, o «mcr@» i la seua data; sense res, null', () => {
    const codex = normalitzaMcr(MCR({ at: '2026-10-16T15:02:56.740108+00:00' }));
    expect(codex).toMatchObject({ pla: `${PREFIX_IDENTITAT_DATA}2026-10-16T15:02:56.740Z`, plaDeclarat: false });
    expect(PREFIX_IDENTITAT_DATA).toBe('mcr@');
    // La mateixa data escrita d'una altra manera és la mateixa matriu.
    expect(normalitzaMcr(MCR({ at: '2026-10-16T17:02:56.740+02:00' })).pla).toBe(codex.pla);
    // Una altra data, una altra matriu.
    expect(normalitzaMcr(MCR({ at: '2026-10-17T09:00:00Z' })).pla).not.toBe(codex.pla);
    expect(normalitzaMcr(MCR({ pla: ' 261016_1530 ' }))).toMatchObject({ pla: '261016_1530', plaDeclarat: true });
    expect(normalitzaMcr(MCR({ plan: '261016_1639' }))).toMatchObject({ pla: '261016_1639', plaDeclarat: true });
    expect(normalitzaMcr(MCR({ pla: '  ', at: null }))).toMatchObject({ pla: null, plaDeclarat: false });
  });
});

describe('textPla: les rutes absolutes amb el directori personal no s’ensenyen', () => {
  test('un enllaç Markdown es queda amb el seu text, sense accents greus ni negretes', () => {
    expect(textPla('[src/a.jsx:3](</Users/mestre/Som de Poble/socdepoble.org/src/a.jsx:3>) passa **la** prova de `x`'))
      .toBe('src/a.jsx:3 passa la prova de x');
    expect(textPla('[web](https://exemple.org/a) i prou')).toBe('web i prou');
  });
  test('qualsevol directori personal que quede diu «~»', () => {
    expect(textPla('mira /Users/mestre/Documents/x.md i /home/algu/y')).toBe('mira ~/Documents/x.md i ~/y');
  });
  test('sense text, null', () => {
    expect(textPla('   ')).toBeNull();
    expect(textPla(undefined)).toBeNull();
  });
  test('la matriu normalitzada no porta cap ruta absoluta a l’evidència', () => {
    const m = normalitzaMcr(MCR({ requirements: [fila('F02', '[PARCIAL]', { evidence: '[src/m.js:3](</Users/mestre/Som de Poble/socdepoble.org/src/m.js:3>) declara Javi' })] }));
    expect(m.files[0].evidencia).toBe('src/m.js:3 declara Javi');
    expect(JSON.stringify(m.files[0].evidencia)).not.toMatch(/\/Users\//);
  });
});

describe('caducitat: una matriu vella o d’un altre codi és obsoleta', () => {
  const m = () => normalitzaMcr(MCR());
  test('fresca i del mateix commit: no és obsoleta, i el commit s’ha comprovat', () => {
    expect(caducitatDe(m(), { head: HEAD.slice(0, 8), ara: ARA })).toEqual({ obsoleta: false, motius: [], commitComprovat: true, hores: 1 });
  });
  test('sense el commit d’ara (un fitxer sense servidor), no es comprova el commit però sí la data', () => {
    expect(caducitatDe(m(), { ara: ARA })).toMatchObject({ obsoleta: false, commitComprovat: false });
    expect(caducitatDe(m(), { ara: ARA + LLINDAR_MATRIU_HORES * HORA }).obsoleta).toBe(true);
  });
  test('de fa més d’un dia: obsoleta, i diu quantes hores', () => {
    const c = caducitatDe(m(), { ara: ARA + 30 * HORA });
    expect(c.obsoleta).toBe(true);
    expect(c.motius).toEqual([{ clau: 'vella', text: 'La matriu es va fer fa 31 hores: passa del dia de marge.' }]);
  });
  /* Revisió adversarial del carril F1 (problema 6) · Una data futura no caduca
     mai per data: més enllà del marge del rellotge, la matriu és obsoleta. */
  test('amb una data que encara no ha arribat: obsoleta, també sense el commit d’ara', () => {
    const futura = normalitzaMcr(MCR({ at: '2027-01-01T00:00:00Z' }));
    expect(caducitatDe(futura, { ara: ARA })).toEqual({
      obsoleta: true,
      motius: [{ clau: 'data-futura', text: 'La matriu diu una data que encara no ha arribat.' }],
      commitComprovat: false,
      hores: 0
    });
    const v = vistaMatriu(futura, { ara: ARA });
    expect(v.files.some((f) => toDeLEstat(f.estatVist) === 'exit')).toBe(false);
    // Dins del marge del rellotge (un desajust normal), no.
    const quasi = normalitzaMcr(MCR({ at: new Date(ARA + (MARGE_FUTUR_MINUTS - 1) * 60 * 1000).toISOString() }));
    expect(caducitatDe(quasi, { ara: ARA }).obsoleta).toBe(false);
    const passat = normalitzaMcr(MCR({ at: new Date(ARA + (MARGE_FUTUR_MINUTS + 1) * 60 * 1000).toISOString() }));
    expect(caducitatDe(passat, { ara: ARA }).motius.map((x) => x.clau)).toEqual(['data-futura']);
  });
  test('d’un altre commit, sense commit o sense data: obsoleta', () => {
    expect(caducitatDe(m(), { head: 'deadbeef', ara: ARA }).motius.map((x) => x.clau)).toEqual(['commit-divergent']);
    expect(caducitatDe(normalitzaMcr(MCR({ baseline_head: null })), { head: HEAD, ara: ARA }).motius.map((x) => x.clau)).toEqual(['sense-commit']);
    expect(caducitatDe(normalitzaMcr(MCR({ at: null })), { ara: ARA }).motius.map((x) => x.clau)).toEqual(['sense-data']);
  });
  test('una matriu obsoleta no pinta cap fila de verd, i conserva el que deia', () => {
    const v = vistaMatriu(m(), { head: 'deadbeef', ara: ARA });
    expect(v.files.map((f) => [f.id, f.estat, f.estatVist])).toEqual([
      ['F04', 'fet', 'obsolet'], ['F01', 'parcial', 'obsolet'], ['I09', 'pendent', 'obsolet']
    ]);
    expect(v.files.some((f) => toDeLEstat(f.estatVist) === 'exit')).toBe(false);
    expect(recompteVist(v.files)).toEqual({ fet: 0, parcial: 0, pendent: 0, obsolet: 3 });
  });
  test('mateixCommit: un sha curt i un de sencer són el mateix; res no és cap commit', () => {
    expect(mateixCommit(HEAD, '7a1828ca')).toBe(true);
    expect(mateixCommit('7a1828ca', HEAD)).toBe(true);
    expect(mateixCommit(HEAD, 'deadbeef')).toBe(false);
    expect(mateixCommit(null, HEAD)).toBe(false);
  });
});

describe('vista, recomptes i filtres', () => {
  test('els recomptes que declara la matriu quadren (o no) amb les seues files', () => {
    expect(quadrenElsRecomptes(normalitzaMcr(MCR()))).toBe(true);
    expect(quadrenElsRecomptes(normalitzaMcr(MCR({ statuses: { '[FET I SEGELLAT]': 3 } })))).toBe(false);
    expect(quadrenElsRecomptes(normalitzaMcr(MCR({ statuses: undefined })))).toBeNull();
  });
  test('filtra per estat vist; un filtre desconegut ho mostra tot', () => {
    const v = vistaMatriu(normalitzaMcr(MCR()), { ara: ARA });
    expect(recompteVist(v.files)).toEqual({ fet: 1, parcial: 1, pendent: 1, obsolet: 0 });
    expect(filtraFiles(v.files, 'pendent').map((f) => f.id)).toEqual(['I09']);
    expect(filtraFiles(v.files, 'tots')).toHaveLength(3);
    expect(filtraFiles(v.files, 'roig')).toHaveLength(3);
    expect(vistaMatriu(null)).toBeNull();
  });
});
