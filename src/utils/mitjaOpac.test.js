/**
 * mitjaOpac · XAT-02 (ordre del Mestre, 261014, pla 261014_0210).
 *   esMitjaOpac reconeix les referències del port de mitjans ('sdp-media://…'),
 *   també amb espais davant, i res més. La reexportació de CaraXat la proven
 *   CaraXat.test.jsx (pel seu ús) i PedraSeca/qualitat.mitjaOpac.test.js (pel
 *   text): una prova d'utils no importa d'una secció.
 */
import { expect, test } from 'vitest';
import { esMitjaOpac, fotoDelBucketPublic } from './mitjaOpac.js';

/* Revisió del Gauntlet 261017 (ID2, contrast final) · Una sola regla per a la
   foto del bucket públic: la forma de les pujades i res més. */
test('fotoDelBucketPublic: la forma canònica d’una pujada al bucket públic', () => {
  expect(fotoDelBucketPublic('sdp-media://mitjans/la-torre/0a1b-2c/avatars/9f8e.webp')).toBe('sdp-media://mitjans/la-torre/0a1b-2c/avatars/9f8e.webp');
  expect(fotoDelBucketPublic('  SDP-MEDIA://MITJANS/t/u_1/avatars/a.v2.webp ')).toBe('sdp-media://mitjans/t/u_1/avatars/a.v2.webp');
});

test('fotoDelBucketPublic: res del bucket privat, d’un altre, ni camins que hi pugen o bruts', () => {
  for (const valor of [
    'sdp-media://mitjans_privats/t/u/notes/a.webp', 'sdp-media://altres/t/a.webp', 'sdp-media://mitjans', 'sdp-media://mitjans/',
    'sdp-media://mitjans/../mitjans_privats/t/u/a.webp', 'sdp-media://mitjans/t/../../mitjans_privats/a.webp', 'sdp-media://mitjans/./a.webp',
    'sdp-media://mitjans/%2e%2e/mitjans_privats/a.webp', 'sdp-media://mitjans/t\\..\\a.webp', 'sdp-media://mitjans/t/\u0000a.webp',
    'sdp-media://mitjans/t a.webp', 'sdp-media://mitjans//t/a.webp', 'sdp-media://mitjans/t/a.webp?x=1', 'sdp-media://mitjans/t/a.webp#f',
    'https://x.example/mitjans/a.webp', '/sdp-media://mitjans/t/a.webp', '', null, undefined, 42
  ]) {
    expect(fotoDelBucketPublic(valor), String(valor)).toBeNull();
  }
});

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
