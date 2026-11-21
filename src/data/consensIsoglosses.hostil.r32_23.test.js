// @vitest-environment node
import { expect, test, vi } from 'vitest';
import { filaConsensDelServidor, votDelServidor } from './consensIsoglosses.js';
const vot = { preguntaId: 'pregunta', variantClau: 'paraula' };
const fila = { pregunta_id: 'pregunta', variant_clau: 'paraula', paraula_etiqueta: 'paraula', poble_exemple: null, comarca_id: null, total_vots: 1 };
test.each([null, false, 0, ''])('R3223-ISO-01: una fila falsy (%s) no confirma un vot nou', valor => {
  expect(() => votDelServidor([valor], vot)).toThrow(expect.objectContaining({ code: 'consens-invalid' }));
});
test('R3223-ISO-02: el recompte hostil es rebutja sense executar coercions', () => {
  const valueOf = vi.fn(() => { throw new Error('coerció secreta'); });
  expect(() => filaConsensDelServidor({ ...fila, total_vots: { valueOf } })).toThrow(expect.objectContaining({ code: 'consens-invalid' }));
  expect(valueOf).not.toHaveBeenCalled();
});
test.each(['0x10', '1e2', '+1', ' 1 ', '1.0'])('R3223-ISO-02: recompte no decimal (%s) refusat', total_vots => {
  expect(() => filaConsensDelServidor({ ...fila, total_vots })).toThrow(expect.objectContaining({ code: 'consens-invalid' }));
});
