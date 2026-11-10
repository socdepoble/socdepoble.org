// @vitest-environment node
/* Inspecció de Codex de l'1-11-2026 (Kit Onada 2) · Reproductor d'O2-F02: un adjunt privat
   pendent de llegir (blob.arrayBuffer() lent) no ix com a data: si mentrestant canvia la
   persona o es tanca l'adaptador; torna la referència opaca. */
import { test, expect } from 'vitest';
import { creaMitjansLocal } from './mitjansLocal.js';

test('O2-F02 · un adjunt privat pendent no ix després de canviar la persona ni de tancar', async () => {
  for (const tanca of [false, true]) {
    let uid = 'anna';
    let acaba;
    let tancament;
    const mitjans = creaMitjansLocal({
      alTancar: (f) => { tancament = f; },
      usuari: () => ({ id: uid }),
      configuracio: { tenantId: 'sella' },
      nouId: () => 'foto'
    });
    const blob = new Blob(['secret'], { type: 'image/png' });
    blob.arrayBuffer = () => new Promise((resol) => { acaba = resol; });
    const { url } = await mitjans.uploadToStorage(blob, { carpeta: 'notes' });
    const pendent = mitjans.resolveAsset(url);
    if (tanca) tancament(); else uid = 'berta';
    acaba(new TextEncoder().encode('secret').buffer);
    expect(await pendent, tanca ? 'després de tancar' : 'després de canviar de persona').toBe(url);
  }
});

/* P0-80 / IDEA-211 (llei del Mestre, 09-11-2026) · En local, com a storage.js:
   el marc (#sdp-crop=) viatja amb la referència en resoldre-la i en promoure-la. */
test('P0-80 · el marc de la capçalera es conserva en resoldre i en publicar', async () => {
  const MARC = '#sdp-crop=format=1%3A1&zoom=2&cx=0.3&cy=0.7';
  const mitjans = creaMitjansLocal({ alTancar: () => {}, usuari: () => ({ id: 'anna' }), configuracio: { tenantId: 'sella' }, nouId: () => 'foto' });
  const { url } = await mitjans.uploadToStorage(new Blob(['png'], { type: 'image/png' }), { carpeta: 'notes' });
  const resolta = await mitjans.resolveAsset(`${url}${MARC}`);
  expect(resolta.startsWith('data:image/png;base64,')).toBe(true);
  expect(resolta.endsWith(MARC)).toBe(true);
  const publica = await mitjans.promoteToPublic(`${url}${MARC}`);
  expect(publica).toBe(`${url.replace('mitjans_privats', 'mitjans')}${MARC}`);
  expect((await mitjans.resolveAsset(publica)).endsWith(MARC)).toBe(true);
});
