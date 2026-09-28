/* Poliment T41 · Els textos del selector de visibilitat no prometen més del
   que fa el servidor: la RLS de lectura de section_submissions exigix ser del
   poble (private.is_town_member), el Mur no és Internet. */
import { expect, test } from 'vitest';
import { textosDeNota } from './visibilitatNota.js';

test.each([false, true])('publicar o compartir al Mur diu qui ho llig: la gent registrada del poble (connexió=%s)', (connexio) => {
  const { publica } = textosDeNota({ connexio });
  expect(publica.explicacio).toContain('la gent registrada del poble, no Internet');
  expect(publica.explicacio).not.toMatch(/qualsevol persona/);
});
