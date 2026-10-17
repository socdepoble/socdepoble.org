// @vitest-environment node
/* Onada 0.3 (Gauntlet 261016, I35) · La Cronologia de /multimedia, calculada
   (cronologia.js): un grup per mes, del més nou al més vell; les dates
   absents o il·legibles, a l'últim grup («Sense data»); cap mitjà s'omet ni es
   repetix. Abans es llegia payload.mediaTimelineGroups, que no existix. */
import { describe, expect, test } from 'vitest';
import { SENSE_DATA, agrupaPerMes, dataDelMitja, etiquetaDelMes } from './cronologia.js';

const m = (id, extra) => ({ id, ...extra });

describe('agrupaPerMes', () => {
  test('per mes, del més nou al més vell, i dins de cada mes, també', () => {
    const grups = agrupaPerMes([
      m('a', { created_at: '2026-02-15T12:00:00.000Z' }),
      m('b', { created_at: '2026-08-16T08:00:00.000Z' }),
      m('c', { created_at: '2026-08-20T08:00:00.000Z' }),
      m('d', { created_at: '2023-01-01T00:00:00Z' })
    ]);
    expect(grups.map((g) => [g.key, g.items.map((i) => i.id)])).toEqual([
      ['2026-08', ['c', 'b']],
      ['2026-02', ['a']],
      ['2023-01', ['d']]
    ]);
    /* El mes en lletra, amb majúscula; el «de»/«del» és del CLDR de l'entorn. */
    expect(grups[0].label).toMatch(/^Agost (?:de |del )?2026$/);
  });

  test('la data de captura mana sobre la de l’article', () => {
    const [grup] = agrupaPerMes([m('foto', { dataCaptura: '2017-05-14T10:22:33+02:00', created_at: '2026-09-01T10:00:00.000Z' })]);
    expect(grup.key).toBe('2017-05');
  });

  test('POLÍTICA · sense data o amb una data il·legible: l’últim grup, «Sense data», en l’ordre d’arribada', () => {
    const grups = agrupaPerMes([
      m('sense'),
      m('buida', { created_at: '' }),
      m('dolenta', { created_at: 'ahir' }),
      m('mes13', { created_at: '2026-13-01T00:00:00Z' }),
      m('bona', { created_at: '2026-09-01T10:00:00.000Z' })
    ]);
    expect(grups.map((g) => g.key)).toEqual(['2026-09', SENSE_DATA]);
    expect(grups.at(-1)).toEqual({ key: SENSE_DATA, label: null, items: [m('sense'), m('buida', { created_at: '' }), m('dolenta', { created_at: 'ahir' }), m('mes13', { created_at: '2026-13-01T00:00:00Z' })] });
  });

  test('cap mitjà es perd ni es repetix: la suma dels grups és la llista', () => {
    const items = Array.from({ length: 60 }, (_, i) => m(`m${i}`, i % 7 === 0 ? {} : { created_at: `20${20 + (i % 6)}-0${1 + (i % 9)}-1${i % 9}T10:00:00Z` }));
    const grups = agrupaPerMes(items);
    const ids = grups.flatMap((g) => g.items.map((i) => i.id));
    expect(ids.sort()).toEqual(items.map((i) => i.id).sort());
    const claus = grups.map((g) => g.key).filter((k) => k !== SENSE_DATA);
    expect([...claus].sort().reverse()).toEqual(claus);
  });

  test('el mes es llig del text, no de la zona horària: el 31 a les 23:30 és d’eixe mes', () => {
    expect(agrupaPerMes([m('nit', { dataCaptura: '2026-01-31T23:30:00-05:00' })])[0].key).toBe('2026-01');
  });

  test('sense res, cap grup; un nul de la llista no peta', () => {
    expect(agrupaPerMes([])).toEqual([]);
    expect(agrupaPerMes(undefined)).toEqual([]);
    expect(agrupaPerMes([null, m('a', { created_at: '2026-09-01T10:00:00Z' })]).map((g) => g.key)).toEqual(['2026-09']);
  });

  test('l’etiqueta, en la llengua demanada', () => {
    expect(agrupaPerMes([m('a', { created_at: '2026-09-01T10:00:00Z' })], { locale: 'en-GB' })[0].label).toBe('September 2026');
  });
});

/* Revisió adversarial del 261016 · Qui pinta la Cronologia (MultimediaSection)
   passa el locale actiu: abans els mesos eixien sempre en ca-ES. */
describe('etiquetaDelMes', () => {
  test('el mes d’una clau AAAA-MM en la llengua activa; una clau que no és cap mes, null', () => {
    expect(etiquetaDelMes('2026-09', 'es-ES')).toBe('Septiembre de 2026');
    expect(etiquetaDelMes('2026-09', 'en-GB')).toBe('September 2026');
    expect(etiquetaDelMes('2026-09')).toMatch(/^Setembre (?:de |del )?2026$/);
    expect(agrupaPerMes([m('a', { created_at: '2026-09-01T10:00:00Z' })], { locale: 'es-ES' })[0].label).toBe('Septiembre de 2026');
    expect([etiquetaDelMes(SENSE_DATA), etiquetaDelMes('2026-9'), etiquetaDelMes(null)]).toEqual([null, null, null]);
  });
});

describe('dataDelMitja', () => {
  test('la de captura, si no la de l’article, i null si cap no es pot llegir', () => {
    expect(dataDelMitja({ dataCaptura: '2017-05-14T10:22:33', created_at: '2026-01-01' })).toBe('2017-05-14T10:22:33');
    expect(dataDelMitja({ dataCaptura: 'no', created_at: '2026-01-01' })).toBe('2026-01-01');
    expect(dataDelMitja({ created_at: 1234 })).toBeNull();
    expect(dataDelMitja(null)).toBeNull();
  });
});
