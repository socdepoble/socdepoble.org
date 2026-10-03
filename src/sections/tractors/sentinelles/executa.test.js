// @vitest-environment node
/* El corredor és FAIL-CLOSED: sense l'aprovació vigent de la versió exacta no
   es prepara ni s'observa res, i qualsevol dubte és un error en valencià. Les
   aprovacions es fan amb el nucli de veres (preparaRegistre) i una empremta
   sintètica: exigeixAprovacio compara l'empremta del registre amb la rebuda. */
import { describe, expect, test, vi } from 'vitest';
import { ErrorAprovacio, preparaRegistre } from '../nucli/aprovacio.js';
import { DIA_MS } from '../nucli/registre.js';
import { SENTINELLA_POLICIA } from './policiaDisseny.js';
import { ErrorSentinella, FONTS_COMUNES, definixSentinella } from './contracte.js';
import { executaSentinella } from './executa.js';

const T0 = Date.UTC(2026, 9, 2, 8);
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const ORIGEN = 'https://app.example.org';
const RP_ID = 'app.example.org';

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
    eixida: ['bandera', 'informe'],
    superficie: { tipus: 'consola' },
    portaHumana: 'Proposa; la persona decidix.',
    proves: ['src/sections/tractors/sentinelles/executa.test.js'],
    llindars: {},
    fitxa: 'src/sections/tractors/sentinelles/fitxes/prova.md',
    fonts: [...FONTS_COMUNES, 'src/sections/tractors/sentinelles/prova.js'],
    entrada: { etiqueta: 'Fitxer de prova', accepta: '.json', multiple: false, prepara: (fitxers) => ({ preparats: fitxers.length }) },
    observa: () => ({ avisos: [{ codi: 'PRV-AVIS', severitat: 'groga', missatge: 'Un avís de prova.', font: 'prova' }], informe: 'Informe de prova.' }),
    ...canvis
  });
}

const aprova = (s, { decisio = 'aprovat', ara = T0, nivell = 'confirmacio' } = {}) => preparaRegistre({ manifest: s.manifest, empremta: EMPREMTA, decisio, nivell, ara });

function aprovacioDe(manifest, registres, ara = T0 + 1000) {
  return { manifest, empremta: EMPREMTA, registres, claus: [], origen: ORIGEN, rpId: RP_ID, ara };
}

async function falla(promesa) {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  throw new Error('Havia de fallar i no ha fallat.');
}

describe('la porta va abans de res', () => {
  test('sense cap aprovació: APROVACIO_REQUERIDA i ni es prepara ni s’observa', async () => {
    const observa = vi.fn(() => ({ avisos: [] }));
    const prepara = vi.fn(() => ({}));
    const s = sentinellaDeProva({ observa, entrada: { etiqueta: 'x', accepta: '.json', multiple: false, prepara } });
    const error = await falla(executaSentinella({ sentinella: s, fitxers: [{ nom: 'a.json', bytes: new Uint8Array(1) }], aprovacio: aprovacioDe(s.manifest, []), ara: T0 }));
    expect(error).toBeInstanceOf(ErrorAprovacio);
    expect(error.codi).toBe('APROVACIO_REQUERIDA');
    expect(observa).not.toHaveBeenCalled();
    expect(prepara).not.toHaveBeenCalled();
  });

  test('sense context d’aprovació: també APROVACIO_REQUERIDA', async () => {
    const error = await falla(executaSentinella({ sentinella: sentinellaDeProva(), entrada: {}, ara: T0 }));
    expect(error.codi).toBe('APROVACIO_REQUERIDA');
  });

  test('l’aprovació d’un altre tractor no hi val', async () => {
    const s = sentinellaDeProva();
    const altre = sentinellaDeProva({ id: 'sentinella.altre' });
    const error = await falla(executaSentinella({ sentinella: s, entrada: {}, aprovacio: aprovacioDe(altre.manifest, [aprova(altre)]), ara: T0 }));
    expect(error.codi).toBe('APROVACIO_REQUERIDA');
    expect(error.message).toMatch(/no d'este sentinella/);
  });

  test('un manifest aprovat que no és el d’esta versió: EMPREMTA_DIVERGENT', async () => {
    const s = sentinellaDeProva();
    const vella = sentinellaDeProva({ descripcio: 'La descripció de la versió aprovada.' });
    const error = await falla(executaSentinella({ sentinella: s, entrada: {}, aprovacio: aprovacioDe(vella.manifest, [aprova(vella)]), ara: T0 }));
    expect(error.codi).toBe('EMPREMTA_DIVERGENT');
  });

  test('revocada, caducada o amb un nivell per davall del que exigix', async () => {
    const s = sentinellaDeProva();
    const revocada = await falla(executaSentinella({
      sentinella: s, entrada: {}, ara: T0, aprovacio: aprovacioDe(s.manifest, [aprova(s), aprova(s, { decisio: 'revocat', ara: T0 + 10 })], T0 + 20)
    }));
    expect(revocada.codi).toBe('APROVACIO_REVOCADA');
    const caducada = await falla(executaSentinella({ sentinella: s, entrada: {}, ara: T0, aprovacio: aprovacioDe(s.manifest, [aprova(s)], T0 + 91 * DIA_MS) }));
    expect(caducada.codi).toBe('APROVACIO_CADUCADA');
    const personal = sentinellaDeProva({ dadesPersonals: true });
    const baixa = await falla(executaSentinella({ sentinella: personal, entrada: {}, ara: T0, aprovacio: aprovacioDe(personal.manifest, [aprova(s)]) }));
    expect(baixa.codi).toBe('NIVELL_INSUFICIENT');
  });
});

describe('el contracte, el nivell i els paràmetres', () => {
  test('un descriptor que no complix el contracte no arriba ni a la porta', async () => {
    const observa = vi.fn(() => ({ avisos: [] }));
    const s = { ...sentinellaDeProva({ observa }), xarxa: 'api.exemple' };
    const error = await falla(executaSentinella({ sentinella: s, entrada: {}, ara: T0 }));
    expect(error).toBeInstanceOf(ErrorSentinella);
    expect(error.codi).toBe('CONTRACTE_INVALID');
    expect(observa).not.toHaveBeenCalled();
  });

  test('un sentinella L1 és vàlid, però este carril no l’executa', async () => {
    const s = sentinellaDeProva({ nivell: 'L1' });
    const error = await falla(executaSentinella({ sentinella: s, entrada: {}, aprovacio: aprovacioDe(s.manifest, [aprova(s)]), ara: T0 }));
    expect(error.codi).toBe('NIVELL_NO_EXECUTABLE');
  });

  test('sense un ara vàlid, o amb entrada i fitxers alhora: PARAMETRES_INVALIDS', async () => {
    const s = sentinellaDeProva();
    const aprovacio = aprovacioDe(s.manifest, [aprova(s)]);
    expect((await falla(executaSentinella({ sentinella: s, entrada: {}, aprovacio, ara: 'ahir' }))).codi).toBe('PARAMETRES_INVALIDS');
    expect((await falla(executaSentinella({ sentinella: s, entrada: {}, fitxers: [], aprovacio, ara: T0 }))).codi).toBe('PARAMETRES_INVALIDS');
  });
});

describe('observar', () => {
  test('amb l’aprovació vigent: prepara els fitxers, observa amb l’instant i torna una eixida congelada', async () => {
    const observa = vi.fn(() => ({ avisos: [{ codi: 'PRV-ROJA', severitat: 'roja', missatge: 'Roja.', font: 'a' }, { codi: 'PRV-INFO', severitat: 'info', missatge: 'Info.', font: 'b' }], informe: 'Fet.' }));
    const s = sentinellaDeProva({ observa });
    const eixida = await executaSentinella({ sentinella: s, fitxers: [{ nom: 'a.json' }, { nom: 'b.json' }], aprovacio: aprovacioDe(s.manifest, [aprova(s)]), ara: T0 + 5 });
    expect(observa).toHaveBeenCalledWith({ preparats: 2 }, { ara: T0 + 5 });
    expect(eixida).toEqual({
      id: 'sentinella.prova', versio: '1.0.0', ara: new Date(T0 + 5).toISOString(), bandera: 'roja',
      resum: { roja: 1, groga: 0, info: 1 },
      avisos: [{ codi: 'PRV-ROJA', severitat: 'roja', missatge: 'Roja.', font: 'a' }, { codi: 'PRV-INFO', severitat: 'info', missatge: 'Info.', font: 'b' }],
      informe: 'Fet.'
    });
    expect(Object.isFrozen(eixida)).toBe(true);
    expect(Object.isFrozen(eixida.avisos[0])).toBe(true);
  });

  test('l’entrada ja preparada passa tal qual, i sense avisos la bandera és «cap»', async () => {
    const observa = vi.fn(() => ({ avisos: [] }));
    const s = sentinellaDeProva({ observa });
    const eixida = await executaSentinella({ sentinella: s, entrada: { x: 1 }, aprovacio: aprovacioDe(s.manifest, [aprova(s)]), ara: new Date(T0) });
    expect(observa).toHaveBeenCalledWith({ x: 1 }, { ara: T0 });
    expect(eixida).toMatchObject({ bandera: 'cap', resum: { roja: 0, groga: 0, info: 0 } });
    expect('informe' in eixida).toBe(false);
  });

  test('un error en observar és ERROR_INTERN; un d’entrada passa tal qual', async () => {
    const trenca = sentinellaDeProva({ observa: () => { throw new TypeError('trencat'); } });
    const intern = await falla(executaSentinella({ sentinella: trenca, entrada: {}, aprovacio: aprovacioDe(trenca.manifest, [aprova(trenca)]), ara: T0 }));
    expect(intern.codi).toBe('ERROR_INTERN');
    expect(intern.cause).toBeInstanceOf(TypeError);
    const entrada = sentinellaDeProva({
      entrada: { etiqueta: 'x', accepta: '.json', multiple: false, prepara: () => { throw new ErrorSentinella('ENTRADA_INVALIDA', 'Fitxer il·legible.'); } }
    });
    const error = await falla(executaSentinella({ sentinella: entrada, fitxers: [], aprovacio: aprovacioDe(entrada.manifest, [aprova(entrada)]), ara: T0 }));
    expect(error.codi).toBe('ENTRADA_INVALIDA');
  });

  test('una eixida fora del contracte, o asíncrona, no es torna mai', async () => {
    for (const observa of [() => ({ avisos: [{ codi: 'x', severitat: 'verda' }] }), async () => ({ avisos: [] }), () => null]) {
      const s = sentinellaDeProva({ observa });
      const error = await falla(executaSentinella({ sentinella: s, entrada: {}, aprovacio: aprovacioDe(s.manifest, [aprova(s)]), ara: T0 }));
      expect(error.codi).toBe('EIXIDA_INVALIDA');
    }
  });

  test('un sentinella de veres, aprovat: la Policia del Disseny troba un estil en línia', async () => {
    const s = SENTINELLA_POLICIA;
    const codi = ['export const A = () => <p ', 'style={{ margin: 0 }}>x</p>;'].join('');
    const eixida = await executaSentinella({
      sentinella: s, fitxers: [{ nom: 'A.jsx', text: codi }], aprovacio: aprovacioDe(s.manifest, [aprova(s)]), ara: T0
    });
    expect(eixida.bandera).toBe('roja');
    expect(eixida.avisos.map((a) => a.codi)).toContain('PS-ESTIL-EN-LINIA');
  });
});
