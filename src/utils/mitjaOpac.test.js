/**
 * mitjaOpac · XAT-02 (ordre del Mestre, 261014, pla 261014_0210).
 *   esMitjaOpac reconeix les referències del port de mitjans ('sdp-media://…'),
 *   també amb espais davant, i res més. La reexportació de CaraXat la proven
 *   CaraXat.test.jsx (pel seu ús) i PedraSeca/qualitat.mitjaOpac.test.js (pel
 *   text): una prova d'utils no importa d'una secció.
 */
import { expect, test } from 'vitest';
import { esMitjaOpac } from './mitjaOpac.js';

test('reconeix les referències del port, dels dos buckets i amb espais davant', () => {
  for (const ref of [
    'sdp-media://mitjans/t/u/avatars/foto.webp',
    'sdp-media://mitjans_privats/t/u/notes/foto.webp',
    '  sdp-media://mitjans/t/u/avatars/foto.webp',
    '\tsdp-media://mitjans_privats/t/u/notes/foto.webp'
  ]) {
    expect(esMitjaOpac(ref), ref).toBe(true);
  }
});

test('qualsevol altra font no és opaca: recursos propis, https, blob:, data:image i res', () => {
  for (const valor of [
    '/assets/fotos/iaia-maria.png',
    'https://lh3.googleusercontent.com/a/pepa=s96-c',
    'blob:https://x/1',
    'data:image/png;base64,iVBORw0KGgo=',
    /* Un camí que ja ha passat per resolveAsset és un camí del mateix lloc, no l'esquema. */
    '/sdp-media://mitjans/u/foto.webp',
    '', null, undefined, 42, {}
  ]) {
    expect(esMitjaOpac(valor), String(valor)).toBe(false);
  }
});
