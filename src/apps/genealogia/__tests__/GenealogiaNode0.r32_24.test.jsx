// @vitest-environment node
/* Arbre Genealògic · Onada R32.24 · T3 (Triatge i reparació Node 0 R793):
   Un objecte literal buit {} o amb tots els camps en blanc passat a respon()
   en un pas opcional o repetible de tipus 'persona' es tracta com a resposta
   buida i avança netament al pas següent sense llançar l'error 'obligatori',
   mentre que en un pas obligatori ('g4-jo') continua exigint el nom. */
import { describe, expect, test } from 'vitest';
import { estatInicialEntrevista, pasActual, respon, salta } from '../nucli/entrevista.js';

const OPCIONS = Object.freeze({ anyActual: 2026, ara: '2026-11-20T12:00:00.000Z' });

describe('Onada R32.24 · T3 · Genealogia entrevista (R793)', () => {
  test('en g4-jo (obligatori) un objecte persona buit exigix el nom, però en g4-germa i g3-pare (opcionals) avança al pas següent', () => {
    let estat = salta(salta(estatInicialEntrevista('arbre-prova')));
    expect(pasActual(estat).id).toBe('g4-jo');

    const intentObligatori = respon(estat, {}, OPCIONS);
    expect(intentObligatori.ok).toBe(false);
    expect(intentObligatori.errors).toEqual([{ camp: 'nom', clau: 'obligatori' }]);

    estat = respon(estat, { nom: 'Anna', cognom1: 'Exemple', cognom2: 'Prova', naixement: '1980' }, OPCIONS).estat;
    expect(pasActual(estat).id).toBe('g4-germa');

    /* Objecte literal buit {} en pas repetible opcional avança netament a g3-pare. */
    const pasGermaBuit = respon(estat, {}, OPCIONS);
    expect(pasGermaBuit.ok).toBe(true);
    expect(pasGermaBuit.errors).toEqual([]);
    expect(pasActual(pasGermaBuit.estat).id).toBe('g3-pare');

    /* Objecte persona amb tots els camps de text en blanc i viva per defecte avança a g3-mare. */
    const pasPareBlanc = respon(
      pasGermaBuit.estat,
      { nom: '   ', cognom1: '', cognom2: '', naixement: '', lloc: '', ofici: '', viva: 'desconegut' },
      OPCIONS,
    );
    expect(pasPareBlanc.ok).toBe(true);
    expect(pasPareBlanc.errors).toEqual([]);
    expect(pasActual(pasPareBlanc.estat).id).toBe('g3-mare');
  });
});
