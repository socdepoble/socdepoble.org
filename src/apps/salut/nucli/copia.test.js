// @vitest-environment node
/* Salut · la còpia de seguretat: anada i tornada; una importació amb camps
   desconeguts es neteja; sense duplicats per id; una versió d'esquema
   desconeguda es rebutja. */
import { describe, expect, test } from 'vitest';
import { ESQUEMA_COPIA, creaCopia, fusionaCopia, llegixCopia, nomCopia } from './copia.js';

const id = (i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
const apunt = (i, camps = {}) => ({ id: id(i), tipus: 'miccio', moment: '2026-10-05T08:00', ofsetMin: 120, jornada: '2026-10-05', mesura: 'no-mesurat', lloc: 'vater', ...camps });
const DADES = {
  persona: { alias: 'el pare', horaAlcarHabitual: '07:30' },
  apunts: [apunt(1), apunt(2, { tipus: 'ingesta', volumMl: 200, beguda: 'aigua', mesura: undefined, lloc: undefined })],
  jornades: [{ data: '2026-10-05', completa: true }],
  periodes: [{ id: id(9), inici: '2026-10-05', dies: 3, estat: 'en-curs' }],
  valoracions: []
};

describe('còpia', () => {
  test('anada i tornada: el JSON es llig i torna les mateixes dades', () => {
    const copia = creaCopia(DADES, { ara: new Date('2026-10-05T20:00:00.000Z') });
    expect(copia.schema).toBe(ESQUEMA_COPIA);
    expect(copia.creada).toBe('2026-10-05T20:00:00.000Z');
    const llegida = llegixCopia(JSON.stringify(copia));
    expect(llegida.ok).toBe(true);
    expect(llegida.descartats).toBe(0);
    expect(llegida.dades.apunts).toEqual([
      { id: id(1), tipus: 'miccio', moment: '2026-10-05T08:00', ofsetMin: 120, jornada: '2026-10-05', mesura: 'no-mesurat', lloc: 'vater' },
      { id: id(2), tipus: 'ingesta', moment: '2026-10-05T08:00', ofsetMin: 120, jornada: '2026-10-05', volumMl: 200, beguda: 'aigua' }
    ]);
    expect(llegida.dades.jornades).toEqual(DADES.jornades);
    expect(llegida.dades.periodes).toEqual(DADES.periodes);
    expect(llegida.dades.persona.horaAlcarHabitual).toBe('07:30');
    expect(nomCopia('2026-10-05')).toBe('copia_2026-10-05.json');
  });

  test('els camps desconeguts es descarten i el que no és vàlid no entra', () => {
    const copia = { ...creaCopia(DADES), apunts: [apunt(1, { secret: 'x', diagnosi: 'y' }), apunt(3, { volumMl: 99999, mesura: 'mesurat' }), { tipus: 'cap' }] };
    copia.persona = { alias: 'el pare', script: '<b>' };
    const llegida = llegixCopia(copia);
    expect(llegida.ok).toBe(true);
    expect(llegida.dades.apunts).toHaveLength(1);
    expect(Object.keys(llegida.dades.apunts[0])).not.toContain('secret');
    expect(llegida.descartats).toBe(2);
    expect(Object.keys(llegida.dades.persona)).not.toContain('script');
  });

  test('una versió d’esquema desconeguda o un fitxer que no és una còpia es rebutgen', () => {
    expect(llegixCopia({ ...creaCopia(DADES), schema: 'sdp.salut.copia.v2' })).toEqual({ ok: false, error: 'Esta còpia és d’una versió que esta app no coneix.' });
    expect(llegixCopia({ schema: 'sdp.bar.traspas.v1' }).ok).toBe(false);
    expect(llegixCopia('no és json').ok).toBe(false);
    expect(llegixCopia('[]').ok).toBe(false);
  });
});

describe('importació', () => {
  const actual = llegixCopia(creaCopia(DADES)).dades;

  test('afegir: sense duplicats per id, i ho diu l’informe', () => {
    const entrant = { ...actual, apunts: [apunt(1), apunt(4)], jornades: [{ data: '2026-10-06', completa: false }], periodes: [], valoracions: [] };
    const { dades, informe } = fusionaCopia(actual, entrant, 'afegir');
    expect(dades.apunts.map((x) => x.id)).toEqual([id(1), id(2), id(4)]);
    expect(dades.jornades.map((x) => x.data)).toEqual(['2026-10-05', '2026-10-06']);
    expect(informe).toEqual({ afegits: 2, duplicats: 1, substituits: false });
    expect(dades.persona).toBe(actual.persona);
  });

  test('substituir: la còpia ho reemplaça tot', () => {
    const entrant = { ...actual, apunts: [apunt(5)], jornades: [], periodes: [], valoracions: [] };
    const { dades, informe } = fusionaCopia(actual, entrant, 'substituir');
    expect(dades.apunts.map((x) => x.id)).toEqual([id(5)]);
    expect(informe).toEqual({ afegits: 1, duplicats: 0, substituits: true });
    expect(() => fusionaCopia(actual, entrant, 'barrejar')).toThrow(RangeError);
  });
});
