// @vitest-environment node
/* Gestoria · nucli · tractor: un missatge que el lector de correus no pot
   resumir no atura el creuament (seguretat-05). El mòdul de correus és el de
   veres, llevat de resumCorreu, que falla amb els missatges que porten una
   capçalera de prova (com fallaria amb un paràmetre RFC 2231 desmesurat).
   Adreces example.org; cap dada de cap persona. */
import { describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { TRACTOR_CORREUS } from '../tractors.js';
import { executaCreuamentCorreus } from './tractor.js';

vi.mock('./correus.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    resumCorreu: (text) => {
      if (text.includes('X-Prova-Illegible: si')) throw new RangeError('Maximum call stack size exceeded');
      return real.resumCorreu(text);
    }
  };
});

const ARA = Date.UTC(2026, 9, 2, 10, 0, 0);
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const autenticador = await creaAutenticadorSimulat();
const aprovacio = {
  manifest: TRACTOR_CORREUS,
  empremta: EMPREMTA,
  registres: [await autenticador.signa({ manifest: TRACTOR_CORREUS, empremta: EMPREMTA, ara: ARA - 60000 })],
  claus: autenticador.claus,
  origen: autenticador.origen,
  rpId: autenticador.rpId,
  ara: ARA
};

const missatge = (dia, extra = []) => [
  `From factures@example.org Mon Aug ${dia} 09:00:00 2026`,
  'From: Exemple Llum <factures@example.org>',
  `Subject: La teua factura del ${dia} d'agost`,
  `Date: Mon, ${dia} Aug 2026 09:00:00 +0200`,
  ...extra,
  '',
  'Cos del missatge.',
  ''
].join('\n');

describe('executaCreuamentCorreus: un missatge il·legible', () => {
  test('se salta amb l’avís MISSATGE_ILLEGIBLE (el seu número) i la resta es creua', async () => {
    const mbox = [missatge(10), missatge(11, ['X-Prova-Illegible: si']), missatge(12)].join('\n');
    const r = await executaCreuamentCorreus({ fitxers: [{ nom: 'correu.mbox', text: mbox }], any: 2026, t: 3, aprovacio });
    expect(r.avisos).toEqual([{
      codi: 'MISSATGE_ILLEGIBLE',
      severitat: 'mitjana',
      missatge: 'El missatge 2 de «correu.mbox» no s’ha pogut llegir i s’ha saltat.',
      fitxer: 'correu.mbox',
      numero: 2
    }]);
    expect(r.correus.map((c) => c.data.d)).toEqual([10, 12]);
    expect(r.cobertura).toMatchObject({ correu: 'parcial', correusRevisats: 2 });
  });

  test('el número compta dins de cada exportació', async () => {
    const r = await executaCreuamentCorreus({
      fitxers: [
        { nom: 'juliol.mbox', text: missatge(10) },
        { nom: 'agost.mbox', text: [missatge(11, ['X-Prova-Illegible: si']), missatge(12)].join('\n') }
      ],
      any: 2026,
      t: 3,
      aprovacio
    });
    expect(r.avisos.map((a) => [a.codi, a.fitxer, a.numero])).toEqual([['MISSATGE_ILLEGIBLE', 'agost.mbox', 1]]);
    expect(r.correus).toHaveLength(2);
  });

  test('molts il·legibles: vint avisos d’un en un i un de sol amb la resta', async () => {
    const dolents = Array.from({ length: 23 }, (_, k) => missatge(10 + (k % 18), ['X-Prova-Illegible: si']));
    const r = await executaCreuamentCorreus({ fitxers: [{ nom: 'correu.mbox', text: [...dolents, missatge(30)].join('\n') }], any: 2026, t: 3, aprovacio });
    expect(r.avisos).toHaveLength(21);
    expect(r.avisos[19].numero).toBe(20);
    expect(r.avisos[20]).toEqual({ codi: 'MISSATGE_ILLEGIBLE', severitat: 'mitjana', missatge: '3 missatges més tampoc no s’han pogut llegir i s’han saltat.' });
    expect(r.correus).toHaveLength(1);
  });
});
