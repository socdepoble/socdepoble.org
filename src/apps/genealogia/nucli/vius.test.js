// @vitest-environment node
/* Arbre Genealògic · la protecció RGPD de les persones vives: l'ordre de la
   regla, la inferència pels fills i el filtre de tota eixida. */
import { describe, expect, test } from 'vitest';
import { ANY, complet, persona, rel, uid } from './__fixtures__/arbreSintetic.js';
import { esPersonaViva, filtraVius } from './vius.js';

const viva = (p, c = null) => esPersonaViva(p, c, { anyActual: ANY });

describe('esPersonaViva', () => {
  test('l’ordre de la regla', () => {
    expect(viva(persona(1, { viva: 'si', naixement: '1850' }))).toBe(true);
    expect(viva(persona(1, { viva: 'no', naixement: '1990' }))).toBe(false);
    expect(viva(persona(1, { defuncio: '2001', naixement: '1990' }))).toBe(false);
    expect(viva(persona(1, { defuncio: { precisio: 'desconeguda' }, naixement: '1990' }))).toBe(true);
    expect(viva(persona(1, { naixement: '1927' }))).toBe(true);
    expect(viva(persona(1, { naixement: '1926' }))).toBe(false);
    expect(viva(persona(1))).toBe(true);
  });

  test('la precisió compta a favor de la protecció: s’usa l’extrem més recent', () => {
    expect(viva(persona(1, { naixement: '1920?' }))).toBe(true);
    expect(viva(persona(1, { naixement: '~1925' }))).toBe(true);
    expect(viva(persona(1, { naixement: '~1915' }))).toBe(false);
  });

  test('inferència pel fill: un fill nascut fa 113 anys o més', () => {
    const pare = persona(1);
    const vell = complet([pare, persona(2, { naixement: '1913' })], [rel(10, 'progenitor', 1, 2)]);
    const jove = complet([pare, persona(2, { naixement: '1914' })], [rel(10, 'progenitor', 1, 2)]);
    expect(viva(pare, vell)).toBe(false);
    expect(viva(pare, jove)).toBe(true);
  });

  test('sense anyActual llança', () => {
    expect(() => esPersonaViva(persona(1), null, {})).toThrow(TypeError);
  });
});

describe('filtraVius', () => {
  const arbre = () => complet(
    [
      persona(1, { nom: 'Anna', cognom1: 'Prova', naixement: '1978', lloc: 'Mas inventat', notes: 'secret', fonts: [{ id: uid(50), titol: 'DNI' }], viva: 'si', sexe: 'F' }),
      persona(2, { nom: 'Iaio', naixement: '1901', defuncio: '1980', sexe: 'M' })
    ],
    [{ ...rel(10, 'progenitor', 2, 1), notes: 'nota viva', fontIds: [uid(50)] }],
    { arrelId: uid(1) }
  );

  test('per defecte anonimitza les vives i lleva l’entrevista', () => {
    const c = { ...arbre(), entrevista: { arbreId: 'x', respostes: { 'g4-jo': { nom: 'Anna' } } } };
    const { complet: eixida, ocultes, idsOcults } = filtraVius(c, { anyActual: ANY });
    expect(ocultes).toBe(1);
    expect(idsOcults).toEqual([uid(1)]);
    const anna = eixida.persones.find((p) => p.id === uid(1));
    expect(anna).toMatchObject({ nom: '', cognom1: '', lloc: '', notes: '', fonts: [], privada: true, sexe: 'F', naixement: { precisio: 'desconeguda' } });
    expect(JSON.stringify(eixida)).not.toMatch(/Anna|Prova|Mas inventat|secret|DNI|nota viva/);
    expect(eixida.persones.find((p) => p.id === uid(2)).nom).toBe('Iaio');
    expect(eixida.relacions[0]).toMatchObject({ notes: '', fontIds: [] });
    expect(eixida.entrevista).toBeNull();
    expect(c.persones[0].nom).toBe('Anna');
  });

  test('mode omet: fora la persona, les seues relacions i l’arrel', () => {
    const { complet: eixida, ocultes } = filtraVius(arbre(), { anyActual: ANY, mode: 'omet' });
    expect(ocultes).toBe(1);
    expect(eixida.persones.map((p) => p.id)).toEqual([uid(2)]);
    expect(eixida.relacions).toEqual([]);
    expect(eixida.arbre.arrelId).toBeNull();
  });

  test('amb incloureVius (casella explícita) torna l’arbre intacte', () => {
    const c = arbre();
    expect(filtraVius(c, { anyActual: ANY, incloureVius: true })).toEqual({ complet: c, ocultes: 0, idsOcults: [] });
    expect(filtraVius(c, { anyActual: ANY, incloureVius: 'si' }).ocultes).toBe(1);
  });
});
