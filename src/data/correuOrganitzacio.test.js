import { expect, test } from 'vitest';
import { normalitzaContacte, normalitzaCorreu, validaCorreu } from './correuOrganitzacio.js';

/* T43 (ordre del Mestre, 260928) · el correu opcional d'una organització. */

test('valida només formes segures i buit no és un correu', () => {
  for (const bo of ['forn@exemple.cat', 'a.b+festes@la-torre.org', 'X@Y.CO']) expect(validaCorreu(bo), bo).toBe(true);
  for (const dolent of ['', '   ', 'sense-arroba', 'a@x', 'a b@x.cat', 'a@x.cat?cc=b@y.cat', 'a%40@x.cat', 'a@-x.cat', `${'a'.repeat(250)}@x.cat`]) {
    expect(validaCorreu(dolent), dolent).toBe(false);
  }
  expect(normalitzaCorreu('  Forn@Exemple.CAT ')).toBe('forn@exemple.cat');
  expect(normalitzaCorreu(null)).toBe('');
});

test('normalitza la resposta: sense correu no hi ha públic, i l’origen és de la llista tancada', () => {
  expect(normalitzaContacte({ correu: '', public: true, perDefecte: { origen: 'creador', correu: 'jo@x.cat' } }))
    .toEqual({ correu: '', public: false, perDefecte: { origen: 'creador', correu: 'jo@x.cat' } });
  expect(normalitzaContacte({ correu: 'Forn@X.cat', public: 1, perDefecte: { origen: 'inventat', correu: 'algu@x.cat' } }))
    .toEqual({ correu: 'forn@x.cat', public: true, perDefecte: { origen: 'cap', correu: null } });
  expect(normalitzaContacte(undefined)).toEqual({ correu: '', public: false, perDefecte: { origen: 'cap', correu: null } });
});
