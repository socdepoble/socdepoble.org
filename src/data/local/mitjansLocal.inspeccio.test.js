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
