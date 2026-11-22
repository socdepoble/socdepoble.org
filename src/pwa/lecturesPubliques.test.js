// @vitest-environment node
import { expect, test } from 'vitest';
import { lecturesPubliques, registraLecturaPublica, subscriuLecturesPubliques } from './lecturesPubliques.js';

test('la captura no comparteix referències amb el payload que transformen les vistes', () => {
  const original = { feedPosts: [{ id: 'a', content: 'Text públic original', seguretat: { xifrat: false } }], notes: [{ content: 'SECRET' }] };
  registraLecturaPublica('mur', original, 2);
  original.feedPosts[0].content = 'ESBORRANY LOCAL';
  original.feedPosts[0].seguretat.xifrat = true;
  const guardada = lecturesPubliques().get('mur');
  expect(guardada.payload.feedPosts[0]).toEqual({ id: 'a', content: 'Text públic original', seguretat: { xifrat: false } });
  expect(guardada.payload).not.toHaveProperty('notes');
  guardada.payload.feedPosts[0].content = 'CANVI DEL CONSUMIDOR';
  expect(lecturesPubliques().get('mur').payload.feedPosts[0].content).toBe('Text públic original');
  expect(lecturesPubliques()).not.toHaveProperty('set');
});

test('les col·leccions tenen sostre i un oient opcional trencat no afecta la lectura', () => {
  const deixa = subscriuLecturesPubliques(() => { throw new Error('Oient trencat'); });
  expect(() => registraLecturaPublica('core', { towns: Array.from({ length: 51 }, (_, id) => ({ id })) }, 2)).not.toThrow();
  expect(lecturesPubliques().get('core').payload.towns).toHaveLength(50);
  deixa();
});
