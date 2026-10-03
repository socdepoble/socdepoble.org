// @vitest-environment node
/* Salut · el diccionari, font única: cada camp s'explica (definició i per què
   importa), té unitat quan toca i valors o límits; les claus no es repetixen;
   cada columna de l'exportació hi existix; i validaApunt rebutja el que no
   és vàlid i avisa del que no és versemblant. */
import { describe, expect, test } from 'vitest';
import {
  CAMPS_COMUNS, ENTITATS, IDS_TIPUS, INTERRUPTOR_DE_TIPUS, TIPUS_APUNT, TIPUS_CAMP, campActiu, campDe, etiquetaValor,
  llegixDecimes, netejaApunt, netejaPeriode, netejaValoracio, opcionsDe, resumApunt, textDecimes, validaApunt,
  validaPersona, valorsPerDefecte
} from './diccionari.js';
import { COLUMNES_PER_FULLA, fontExistix } from './full.js';

const ID = '00000000-0000-4000-8000-000000000001';
const base = (tipus, camps = {}) => ({ id: ID, tipus, moment: '2026-10-02T07:30', ofsetMin: 120, ...valorsPerDefecte(tipus), ...camps });

describe('cada camp s’explica', () => {
  const tots = ENTITATS.flatMap((entitat) => entitat.camps.map((c) => [entitat.id, c]));

  test.each(tots.map(([entitat, c]) => [`${entitat}.${c.clau}`, c]))('%s', (_nom, c) => {
    expect(TIPUS_CAMP).toContain(c.tipus);
    expect(typeof c.etiqueta).toBe('string');
    expect(c.definicio.length).toBeGreaterThan(8);
    expect(c.perQueImporta.length).toBeGreaterThan(8);
    if (['enter', 'decimes'].includes(c.tipus) && !['frequenciaDiurna', 'nicturia'].includes(c.clau)) expect(c.unitat, c.clau).toBeTruthy();
    if (['enter', 'decimes', 'escala'].includes(c.tipus) && Number.isFinite(c.min)) expect(c.max).toBeGreaterThan(c.min);
    if (['opcio', 'multiopcio'].includes(c.tipus)) expect(opcionsDe(c).length).toBeGreaterThan(1);
  });

  test('els textos que s’escriuen tenen llargada màxima', () => {
    for (const [entitat, c] of tots) {
      if (c.tipus === 'text' && !['metriques', 'derivats'].includes(entitat)) expect(c.maxLlargada, `${entitat}.${c.clau}`).toBeGreaterThan(0);
    }
  });

  test('els camps que s’apunten tenen valors o límits', () => {
    for (const tipus of TIPUS_APUNT) {
      for (const c of tipus.camps) {
        const teLimits = Number.isFinite(c.min) && Number.isFinite(c.max);
        expect(teLimits || opcionsDe(c).length > 0 || c.tipus === 'boolea' || c.tipus === 'text', `${tipus.id}.${c.clau}`).toBe(true);
      }
    }
  });

  test('les claus són úniques dins de cada entitat i els valors d’opció són únics i en forma de slug o enter', () => {
    for (const entitat of ENTITATS) {
      const claus = entitat.camps.map((c) => c.clau);
      expect(new Set(claus).size, entitat.id).toBe(claus.length);
      for (const c of entitat.camps) {
        const valors = opcionsDe(c).map((o) => o.valor);
        expect(new Set(valors).size, `${entitat.id}.${c.clau}`).toBe(valors.length);
        for (const valor of valors) expect(Number.isSafeInteger(valor) || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(valor), `${c.clau}: ${valor}`).toBe(true);
      }
    }
    expect(new Set(IDS_TIPUS).size).toBe(IDS_TIPUS.length);
    expect(Object.keys(INTERRUPTOR_DE_TIPUS).every((tipus) => IDS_TIPUS.includes(tipus))).toBe(true);
  });

  test('cada columna de l’exportació existix al diccionari', () => {
    for (const [fulla, columnes] of Object.entries(COLUMNES_PER_FULLA)) {
      for (const columna of columnes) expect(fontExistix(columna.font), `${fulla} · ${columna.titol} (${columna.font})`).toBe(true);
    }
    expect(fontExistix('miccio.inventat')).toBe(false);
    expect(fontExistix('metriques.inventat')).toBe(false);
    /* I a l'inrevés: cada camp que declara una columna del Diari hi és. */
    const titolsDiari = COLUMNES_PER_FULLA.Diari.map((c) => c.titol);
    for (const tipus of TIPUS_APUNT) {
      for (const c of [...CAMPS_COMUNS, ...tipus.camps]) {
        if (c.columna && c.clau !== 'moment' && !['conducta'].includes(tipus.id)) expect(titolsDiari, `${tipus.id}.${c.clau}`).toContain(c.columna);
      }
    }
  });
});

describe('validaApunt', () => {
  test('un apunt correcte passa i el que no és del diccionari es descarta', () => {
    const { ok, apunt, avisos } = validaApunt(base('miccio', { volumMl: 250, mesura: 'mesurat', intrus: '<b>x</b>', pes: 3 }));
    expect(ok).toBe(true);
    expect(avisos).toEqual({});
    expect(apunt).toEqual({ id: ID, tipus: 'miccio', moment: '2026-10-02T07:30', ofsetMin: 120, volumMl: 250, mesura: 'mesurat', lloc: 'vater' });
    expect(Object.isFrozen(apunt)).toBe(true);
  });

  test('rebutja els valors fora de rang o de les opcions', () => {
    const casos = [
      [base('miccio', { volumMl: 1600, mesura: 'mesurat' }), 'volumMl'],
      [base('miccio', { volumMl: -1, mesura: 'mesurat' }), 'volumMl'],
      [base('miccio', { volumMl: 2.5, mesura: 'mesurat' }), 'volumMl'],
      [base('miccio', { mesura: 'mesurat' }), 'volumMl'],
      [base('miccio', { volumMl: 200, mesura: 'no-mesurat' }), 'volumMl'],
      [base('miccio', { urgencia: 5 }), 'urgencia'],
      [base('miccio', { molesties: ['cap', 'dolor'] }), 'molesties'],
      [base('ingesta', { beguda: 'gasosa' }), 'beguda'],
      [base('deposicio', { bristol: 8 }), 'bristol'],
      [base('deposicio'), 'bristol'],
      [base('observacio', { que: 'temperatura', temperaturaDecimes: 450 }), 'temperaturaDecimes'],
      [base('observacio', { que: 'temperatura' }), 'temperaturaDecimes'],
      [base('medicacio', { nom: '' }), 'nom'],
      [base('medicacio', { nom: 'x'.repeat(61) }), 'nom'],
      [base('conducta', { intensitat: 2, resultat: 'es-calma-prompte', conductes: [] }), 'conductes'],
      [base('conducta', { intensitat: 2, resultat: 'es-calma-prompte', conductes: ['volar'] }), 'conductes'],
      [base('miccio', { mesura: 'no-mesurat', nota: 'hola <script>' }), 'nota'],
      [{ ...base('miccio', { mesura: 'no-mesurat' }), moment: '2026-02-30T07:00' }, 'moment'],
      [{ ...base('miccio', { mesura: 'no-mesurat' }), ofsetMin: undefined }, 'ofsetMin'],
      [{ ...base('miccio', { mesura: 'no-mesurat' }), id: 'no-uuid' }, 'id']
    ];
    for (const [cru, clau] of casos) {
      const { ok, errors } = validaApunt(cru);
      expect(ok, clau).toBe(false);
      expect(Object.keys(errors), JSON.stringify(cru)).toContain(clau);
    }
    expect(validaApunt({ tipus: 'inventat' }).errors.tipus).toBeTruthy();
    expect(validaApunt(null).ok).toBe(false);
  });

  test('avisa del que és possible però poc versemblant, i ho desa igual', () => {
    const { ok, avisos, apunt } = validaApunt(base('miccio', { volumMl: 900, mesura: 'mesurat' }));
    expect(ok).toBe(true);
    expect(avisos.volumMl).toMatch(/revisa/);
    expect(apunt.volumMl).toBe(900);
  });

  test('un camp amb condició només existix quan es complix', () => {
    const despertar = validaApunt(base('son', { event: 'despertar', motiu: 'orinar' }));
    expect(despertar.apunt.motiu).toBe('orinar');
    const alcar = validaApunt(base('son', { event: 'alcar-se', motiu: 'orinar' }));
    expect(alcar.ok).toBe(true);
    expect(alcar.apunt.motiu).toBeUndefined();
    expect(campActiu(campDe('observacio', 'temperaturaDecimes'), { que: 'caiguda' })).toBe(false);
  });

  test('netejaApunt (la llista blanca del magatzem) exigix l’id i llança si no és vàlid', () => {
    const { id, ...senseId } = base('miccio', { mesura: 'no-mesurat' });
    expect(id).toBe(ID);
    expect(validaApunt(senseId).ok).toBe(true);
    expect(() => netejaApunt(senseId)).toThrow(TypeError);
    expect(netejaApunt(base('miccio', { mesura: 'no-mesurat', jornada: '2026-10-01' })).jornada).toBe('2026-10-01');
  });
});

describe('les altres entitats i els textos', () => {
  test('persona amb valors per defecte i camps dolents descartats', () => {
    const { persona, errors } = validaPersona({ pesKg: 300, horaAlcarHabitual: '08:00', inventat: 1 });
    expect(persona).toEqual({ alias: 'el pare', majorDe65: true, usaAbsorbent: false, horaAlcarHabitual: '08:00', horaGitarHabitual: '22:00' });
    expect(errors.pesKg).toBeTruthy();
  });

  test('períodes i valoracions', () => {
    expect(netejaPeriode({ id: ID, inici: '2026-10-02', dies: 3, estat: 'en-curs', sobra: 1 })).toEqual({ id: ID, inici: '2026-10-02', dies: 3, estat: 'en-curs' });
    expect(() => netejaPeriode({ id: ID, inici: '2026-10-02', dies: 30, estat: 'en-curs' })).toThrow();
    const valoracio = netejaValoracio({ id: ID, setmanaInici: '2026-09-28', conductesFreq: { verbal: 4 }, dominis: { apatia: { gravetat: 2, angoixa: 3 } },
      oficial: { instrument: 'NPI-Q', total: 12, data: '2026-09-30', perProfessional: false } });
    expect(valoracio.oficial.perProfessional).toBe(true);
    expect(() => netejaValoracio({ id: ID, setmanaInici: '2026-09-28', conductesFreq: { verbal: 9 } })).toThrow();
  });

  test('dècimes, etiquetes i el resum d’una línia', () => {
    expect(llegixDecimes('37,8')).toBe(378);
    expect(llegixDecimes('37.8')).toBe(378);
    expect(llegixDecimes('37')).toBe(370);
    expect(llegixDecimes('37,85')).toBeNull();
    expect(textDecimes(378)).toBe('37,8');
    expect(etiquetaValor(campDe('absorbent', 'estat'), 'mullat')).toBe('Mullat');
    expect(resumApunt(base('miccio', { volumMl: 250, mesura: 'mesurat', urgencia: 2 }))).toBe('Ha orinat · 250 ml · ganes 2');
    expect(resumApunt(base('miccio'))).toBe('Ha orinat · sense mesurar');
    expect(resumApunt(base('ingesta'))).toBe('Ha begut · aigua 200 ml');
    expect(resumApunt(base('observacio', { que: 'temperatura', temperaturaDecimes: 378 }))).toBe('Altres · 37,8 °C');
  });
});
