/* Onada R24 · XAT-D1 (Codex, passada 2, despertar 1): dos directes personals amb la
   mateixa persona que la migració 20261114060000 deixa a private.xat_fusions_pendents
   (E2EE, visibilitat, temporal o IAIA) es pleguen en una fila. El selector de la conversa
   ha d'oferir CADA fil, perquè el més antic no quede inabastable des de la llista. Les
   píndoles de la fila continuen sent una per identitat (la Llei del Píxel de la fila). */
import { describe, expect, test } from 'vitest';
import { identitatsDeLaFila, unaFilaPerPersona } from './unaFilaPerPersona.js';

const DAMIA = { id: 'u-damia', tipus: 'persona', nom: 'Damià Llorens Jordà' };
const directe = (id, ultimAl, extra = {}) => ({
  id, tipus: 'directe', altres: [DAMIA], ultimSeq: 3, ultimText: 'Hola', ultimAl, noLlegits: 0, ...extra
});
const vell = directe('f-vell', '2026-11-03T20:56:00+01:00', { e2ee: true });
const nou = directe('f-nou', '2026-11-10T10:00:00+01:00');
const canal = directe('c-sdp', '2026-11-12T09:00:00+01:00', { comEntitat: true, entitatNom: 'Sóc de Poble', entitatId: 'org-sdp' });

describe('XAT-D1 · cap fil personal pendent de fusió queda sense selector', () => {
  test('dos personals sense entitat: el selector els oferix tots dos, amb la data', () => {
    const identitats = identitatsDeLaFila([nou, vell], 'f-nou', { totsElsFils: true });
    expect(identitats.map((i) => i.fil.id)).toEqual(['f-nou', 'f-vell']);
    expect(identitats.map((i) => i.detall)).toEqual(['10/11', '03/11']);
    expect(new Set(identitats.map((i) => i.clau)).size).toBe(2);
  });

  test('dos personals i un canal d’entitat: tres botons, personals primer i l’entitat després', () => {
    const identitats = identitatsDeLaFila([canal, nou, vell], 'c-sdp', { totsElsFils: true });
    expect(identitats.map((i) => i.fil.id)).toEqual(['f-nou', 'f-vell', 'c-sdp']);
    expect(identitats[2].nom).toBe('Sóc de Poble');
    expect(identitats[2].detall).toBeUndefined();
  });

  test('la fila no canvia: les píndoles continuen sent una per identitat', () => {
    expect(identitatsDeLaFila([nou, vell], 'f-nou')).toEqual([]);
    expect(identitatsDeLaFila([canal, nou, vell], 'c-sdp').map((i) => i.tipus)).toEqual(['personal', 'entitat']);
  });

  test('el plec continua donant una sola fila per a Damià amb els tres canals', () => {
    const files = [canal, nou, vell].map((fil) => ({ tipus: 'fil', fil }));
    const resultat = unaFilaPerPersona(files);
    expect(resultat).toHaveLength(1);
    expect(resultat[0].canals.map((f) => f.id).sort()).toEqual(['c-sdp', 'f-nou', 'f-vell']);
  });
});
