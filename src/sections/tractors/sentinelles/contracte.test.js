// @vitest-environment node
/* El contracte sdp.sentinella.v1: els set sentinelles el complixen, el
   manifest derivat passa la validació de la porta (sdp.tractor.v1, camps
   tancats) i qualsevol desviació es diu amb un error en valencià. */
import { describe, expect, test } from 'vitest';
import { validaManifest } from '../nucli/registre.js';
import { SENTINELLES } from '../registreSentinelles.js';
import {
  FONTS_COMUNES, PATRO_ID_SENTINELLA, SCHEMA_SENTINELLA, banderaDe, definixSentinella, nivellMinimDe, validaEixida, validaSentinella
} from './contracte.js';

const observa = () => ({ avisos: [] });
const prepara = (fitxers) => ({ fitxers });

function sentinellaDeProva(canvis = {}) {
  return definixSentinella({
    id: 'sentinella.prova',
    nom: 'Sentinella de prova',
    versio: '1.0.0',
    descripcio: 'Observa el que li passen les proves.',
    disparador: [{ tipus: 'manual', detall: 'A mà, a les proves.' }],
    llig: ['El que li passa la prova'],
    escriu: ['Res'],
    xarxa: 'cap',
    dadesPersonals: false,
    nivell: 'L0',
    eixida: ['bandera'],
    superficie: { tipus: 'consola' },
    portaHumana: 'Proposa; la persona decidix.',
    proves: ['src/sections/tractors/sentinelles/contracte.test.js'],
    llindars: { minim: 1 },
    fitxa: 'src/sections/tractors/sentinelles/fitxes/prova.md',
    fonts: [...FONTS_COMUNES, 'src/sections/tractors/sentinelles/prova.js'],
    entrada: { etiqueta: 'Fitxer de prova', accepta: '.json', multiple: false, prepara },
    observa,
    ...canvis
  });
}

describe('els set sentinelles', () => {
  test('complixen el contracte i el seu manifest passa la porta', () => {
    expect(SENTINELLES).toHaveLength(7);
    for (const s of SENTINELLES) {
      expect(validaSentinella(s), s.id).toEqual([]);
      expect(validaManifest(s.manifest), s.id).toEqual([]);
      expect(s.schema).toBe(SCHEMA_SENTINELLA);
      expect(s.id).toMatch(PATRO_ID_SENTINELLA);
      expect(s.manifest.id).toBe(s.id);
    }
  });

  test('els identificadors són únics, els set del contracte aprovat i en l’ordre de les fases', () => {
    expect(SENTINELLES.map((s) => s.id)).toEqual([
      'sentinella.estructural', 'sentinella.triturador-financer', 'sentinella.policia-disseny',
      'sentinella.consol-vendes', 'sentinella.enllac-torn', 'sentinella.auditoria-aparador', 'sentinella.detectiu-poble'
    ]);
  });

  test('tots són L0, sense xarxa, i les dades personals exigixen signatura', () => {
    for (const s of SENTINELLES) {
      expect(s, s.id).toMatchObject({ nivell: 'L0', xarxa: 'cap' });
      expect(s.manifest.nivellMinim, s.id).toBe(s.dadesPersonals ? 'signatura' : 'confirmacio');
    }
    expect(SENTINELLES.filter((s) => !s.dadesPersonals).map((s) => s.id)).toEqual(['sentinella.policia-disseny', 'sentinella.consol-vendes']);
  });

  test('les superfícies són les del contracte', () => {
    const superficies = Object.fromEntries(SENTINELLES.map((s) => [s.id, s.superficie]));
    expect(superficies).toEqual({
      'sentinella.estructural': { tipus: 'consola' },
      'sentinella.triturador-financer': { tipus: 'departament', departaments: ['Bancs', 'Facturació', 'Impostos'] },
      'sentinella.policia-disseny': { tipus: 'consola' },
      'sentinella.consol-vendes': { tipus: 'tauler-inici' },
      'sentinella.enllac-torn': { tipus: 'departament', departaments: ['TPV'] },
      'sentinella.auditoria-aparador': { tipus: 'departament', departaments: ['Comerços'] },
      'sentinella.detectiu-poble': { tipus: 'tauler-inici' }
    });
  });

  test('el descriptor és immutable', () => {
    const s = SENTINELLES[0];
    expect(Object.isFrozen(s)).toBe(true);
    expect(Object.isFrozen(s.manifest)).toBe(true);
    expect(Object.isFrozen(s.manifest.fonts)).toBe(true);
    expect(Object.isFrozen(s.disparador[0])).toBe(true);
  });
});

describe('definixSentinella', () => {
  test('deriva el manifest: camps tancats, fonts ordenades i sense repetits', () => {
    const s = sentinellaDeProva({ fonts: ['src/z.js', ...FONTS_COMUNES, 'src/a.js', 'src/a.js'] });
    expect(Object.keys(s.manifest).sort()).toEqual([
      'caducitatDies', 'descripcio', 'dadesPersonals', 'escriu', 'fitxa', 'fonts', 'id', 'llig', 'nivellMinim', 'nom', 'schema', 'versio', 'xarxa'
    ].sort());
    expect(s.manifest.fonts).toEqual([...new Set(['src/z.js', ...FONTS_COMUNES, 'src/a.js'])].sort());
    expect(s.manifest.caducitatDies).toBe(90);
    expect(validaSentinella(s)).toEqual([]);
  });

  test('nivellMinimDe: només un true explícit vol dir signatura', () => {
    expect(nivellMinimDe(true)).toBe('signatura');
    expect(nivellMinimDe(false)).toBe('confirmacio');
    expect(nivellMinimDe('true')).toBe('confirmacio');
  });
});

describe('validaSentinella: cada desviació, el seu error', () => {
  test.each([
    ['un camp desconegut', { extra: 1 }, /Camp desconegut: «extra»/],
    ['un id sense prefix', { id: 'prova.altre' }, /sentinella\.nom/],
    ['un disparador desconegut', { disparador: [{ tipus: 'cron', detall: 'x' }] }, /disparador\[0\]\.tipus/],
    ['cap disparador', { disparador: [] }, /almenys un disparador/],
    ['un L0 amb xarxa', { xarxa: 'api.exemple' }, /L0 no es connecta enlloc/],
    ['un nivell inventat', { nivell: 'L9' }, /nivell ha de ser/],
    ['una eixida repetida', { eixida: ['bandera', 'bandera'] }, /eixida/],
    ['un departament sense nom', { superficie: { tipus: 'departament' } }, /almenys un departament/],
    ['departaments fora de lloc', { superficie: { tipus: 'consola', departaments: ['x'] } }, /Només una superfície de tipus departament/],
    ['sense porta humana', { portaHumana: ' ' }, /portaHumana/],
    ['una prova que no és prova', { proves: ['src/x.js'] }, /fitxers \.test/],
    ['un llindar que no és número', { llindars: { minim: '3' } }, /llindars\.minim/],
    ['una entrada sense prepara', { entrada: { etiqueta: 'x', accepta: '.json', multiple: false } }, /entrada\.prepara/],
    ['observa que no és funció', { observa: 'x' }, /observa ha de ser una funció/],
    ['fonts sense la porta comuna', { fonts: ['src/sections/tractors/sentinelles/prova.js'] }, /no cobrixen la porta comuna/]
  ])('%s', (_cas, canvis, error) => {
    const errors = validaSentinella(sentinellaDeProva(canvis));
    expect(errors.some((e) => error.test(e)), errors.join(' | ')).toBe(true);
  });

  test('un manifest retocat a mà ja no és el derivat', () => {
    const s = sentinellaDeProva();
    const retocat = { ...s, manifest: { ...s.manifest, nom: 'Un altre nom' } };
    expect(validaSentinella(retocat)).toContain('El manifest i el descriptor no coincidixen en «nom».');
    const sensePorta = { ...s, manifest: { ...s.manifest, nivellMinim: 'confirmacio' }, dadesPersonals: true };
    expect(validaSentinella(sensePorta).join(' ')).toMatch(/exigix signatura/);
    const ambCampNou = { ...s, manifest: { ...s.manifest, superficie: 'consola' } };
    expect(validaSentinella(ambCampNou).join(' ')).toMatch(/Manifest: Camp desconegut: «superficie»/);
  });

  test('el que no és un objecte, o no té manifest', () => {
    expect(validaSentinella(null)).toEqual(['El sentinella ha de ser un objecte.']);
    const senseManifest = Object.fromEntries(Object.entries(sentinellaDeProva()).filter(([clau]) => clau !== 'manifest'));
    expect(validaSentinella(senseManifest)).toContain('Falta el manifest sdp.tractor.v1 que acompanya el sentinella.');
  });
});

describe('validaEixida i banderaDe', () => {
  const bo = { codi: 'PRV-BO', severitat: 'groga', missatge: 'Un avís.', font: 'prova' };

  test('accepta avisos ben formats, amb informe o sense', () => {
    expect(validaEixida({ avisos: [] })).toEqual([]);
    expect(validaEixida({ avisos: [bo], informe: 'Text.' })).toEqual([]);
  });

  test.each([
    ['no és un objecte', null, /ha de ser un objecte/],
    ['sense avisos', {}, /avisos ha de ser una llista/],
    ['un camp de més', { avisos: [], resum: 1 }, /Camp desconegut a l’eixida/],
    ['una severitat inventada', { avisos: [{ ...bo, severitat: 'verda' }] }, /severitat/],
    ['un codi en minúscules', { avisos: [{ ...bo, codi: 'prv-bo' }] }, /codi/],
    ['un avís sense font', { avisos: [{ ...bo, font: '' }] }, /font/],
    ['un informe que no és text', { avisos: [], informe: 3 }, /informe/],
    ['una promesa', Promise.resolve({ avisos: [] }), /avisos ha de ser una llista/]
  ])('%s', (_cas, eixida, error) => {
    expect(validaEixida(eixida).some((e) => error.test(e))).toBe(true);
  });

  test('la bandera és la severitat més alta', () => {
    expect(banderaDe([])).toBe('cap');
    expect(banderaDe([{ severitat: 'info' }])).toBe('cap');
    expect(banderaDe([{ severitat: 'info' }, { severitat: 'groga' }])).toBe('groga');
    expect(banderaDe([{ severitat: 'groga' }, { severitat: 'roja' }])).toBe('roja');
  });
});
