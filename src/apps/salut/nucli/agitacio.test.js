// @vitest-environment node
/* Salut · patrons de l'agitació: l'histograma per hores, les franges, el que
   passava abans, les accions que calmen i l'associació amb les miccions amb
   un cas construït on el resultat i l'esperat se saben, i el llindar de 5. */
import { describe, expect, test } from 'vitest';
import {
  accionsQueCalmen, antecedentsFrequents, associacioMiccio, episodis, episodisPerDia, episodisPerHora, nitsDolentes,
  perFranja, textAssociacio
} from './agitacio.js';
import { assignaJornades } from './hores.js';

let n = 0;
const uuid = () => { n += 1; return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`; };
const a = (tipus, moment, camps = {}) => ({ id: uuid(), tipus, moment, ofsetMin: 120, ...camps });
const episodi = (moment, camps = {}) => a('conducta', moment, { conductes: ['cridar'], intensitat: 2, resultat: 'no-es-calma', ...camps });
const PERSONA = { horaAlcarHabitual: '07:00', horaGitarHabitual: '22:00' };
const DIES = ['2026-10-05', '2026-10-06', '2026-10-07'];
/* Tres jornades amb alçada a les 08:00 i son a les 22:00: 14 h despert cada dia. */
const son = DIES.flatMap((d) => [a('son', `${d}T08:00`, { event: 'alcar-se' }), a('son', `${d}T22:00`, { event: 'adormir-se' })]);

describe('recomptes', () => {
  const llista = assignaJornades([
    episodi('2026-10-05T17:10', { antecedents: ['ganes-vater', 'soroll-gent'], accions: ['acompanyar-vater'], resultat: 'es-calma-prompte' }),
    episodi('2026-10-05T17:50', { antecedents: ['ganes-vater'], accions: ['calmar-parlant'] }),
    episodi('2026-10-06T09:00', { antecedents: ['soroll-gent'], accions: ['acompanyar-vater', 'calmar-parlant'], resultat: 'es-calma-prompte' }),
    episodi('2026-10-07T02:30', { antecedents: ['ganes-vater'], accions: ['acompanyar-vater'] })
  ], PERSONA);

  test('histograma per hores i franges (el de les 02:30 és de la nit)', () => {
    const hores = episodisPerHora(llista);
    expect(hores).toHaveLength(24);
    expect(hores[17]).toBe(2);
    expect(hores[9]).toBe(1);
    expect(hores[2]).toBe(1);
    expect(perFranja(llista)).toEqual({ mati: 1, vesprada: 2, nit: 1 });
    expect(episodisPerDia(llista)).toEqual({ '2026-10-05': 2, '2026-10-06': 2 });
  });

  test('el que passava abans i les accions que calmen', () => {
    expect(antecedentsFrequents(llista)).toEqual([{ valor: 'ganes-vater', vegades: 3 }, { valor: 'soroll-gent', vegades: 2 }]);
    expect(accionsQueCalmen(llista)).toEqual([
      { valor: 'acompanyar-vater', vegades: 3, calmaPrompte: 2, percent: 67 },
      { valor: 'calmar-parlant', vegades: 2, calmaPrompte: 1, percent: 50 }
    ]);
  });
});

describe('associació amb les miccions', () => {
  /* Cinc episodis, cadascun amb una micció 30 minuts després i cap altra micció. */
  const hores = [['2026-10-05', '10:00'], ['2026-10-05', '15:00'], ['2026-10-06', '11:00'], ['2026-10-06', '18:00'], ['2026-10-07', '09:00']];
  const construit = (quants = 5) => assignaJornades([
    ...son,
    ...hores.slice(0, quants).flatMap(([d, h]) => [
      episodi(`${d}T${h}`),
      a('miccio', `${d}T${h.replace(':00', ':30')}`, { mesura: 'no-mesurat' })
    ])
  ], PERSONA);

  test('cas construït: 5 de 5, i per atzar n’esperaríem 5 × 300/2520', () => {
    const resultat = associacioMiccio(construit(), { persona: PERSONA, jornadesCompletes: DIES });
    // p = 5 finestres d'una hora (300 min) dins de 3 × 14 h despert (2520 min).
    expect(resultat).toEqual({ n: 5, ambOrina: 5, esperat: 0.6, p: 0.119 });
    const text = textAssociacio(resultat);
    expect(text).toContain('5 de 5 episodis');
    expect(text).toContain('uns 0,6');
    expect(text).not.toMatch(/\bp\s*[=<]|causa/i);
  });

  test('llindars: menys de 5 episodis o menys de 3 jornades completes, res', () => {
    expect(associacioMiccio(construit(4), { persona: PERSONA, jornadesCompletes: DIES })).toBeNull();
    expect(associacioMiccio(construit(), { persona: PERSONA, jornadesCompletes: DIES.slice(0, 2) })).toBeNull();
    expect(textAssociacio(null)).toBeNull();
  });

  test('una micció fora de l’hora següent no compta', () => {
    const apunts = assignaJornades([
      ...son,
      ...hores.map(([d, h]) => episodi(`${d}T${h}`)),
      a('miccio', '2026-10-05T12:30', { mesura: 'no-mesurat' })
    ], PERSONA);
    const resultat = associacioMiccio(apunts, { persona: PERSONA, jornadesCompletes: DIES });
    expect(resultat.ambOrina).toBe(0);
    expect(resultat.n).toBe(5);
  });
});

describe('nits dolentes', () => {
  test('després d’una nit amb dos despertars, els episodis de l’endemà', () => {
    const apunts = assignaJornades([
      ...son,
      a('son', '2026-10-06T01:00', { event: 'despertar' }),
      a('son', '2026-10-06T03:00', { event: 'despertar' }),
      episodi('2026-10-06T16:00'),
      episodi('2026-10-06T17:00')
    ], PERSONA);
    expect(episodis(apunts)).toHaveLength(2);
    expect(nitsDolentes(apunts, DIES)).toEqual({ nitsDolentes: 1, nitsBones: 1, despresDolenta: 2, despresBona: 0 });
  });
});
