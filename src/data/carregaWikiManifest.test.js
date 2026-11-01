/* P1-20 · D15 (Assalt 10/10, T4a-C, 261101) · La Wiki compilada es demana
   amb import() fora de la Wiki (el detall d'una peça de la Consola). Que la
   Consola no la importe estàticament ho guarda src/config/paquetDArrencada.test.js
   (la clausura estàtica de ConsolaSection.jsx). */
import { expect, test, vi } from 'vitest';

const estat = vi.hoisted(() => ({ falla: true, demanat: 0 }));
/* Vitest torna a cridar la fàbrica si l'anterior ha fallat: com un tros
   que no baixa i que, en tornar-lo a demanar, ja baixa. */
vi.mock('./wikiManifest.js', () => {
  estat.demanat += 1;
  if (estat.falla) throw new Error('El tros de la Wiki no ha baixat.');
  return { wikiManifest: { categories: [], items: [{ id: 'prompt_local' }] } };
});
import { carregaWikiManifest, wikiManifestCarregat } from './carregaWikiManifest.js';

test('un tros que no baixa no queda guardat: el pròxim intent el torna a demanar i el manifest arriba', async () => {
  expect(wikiManifestCarregat()).toBeNull();
  // Vitest embolica l'error de la fàbrica: n'hi ha prou que la promesa es rebutge.
  await expect(carregaWikiManifest()).rejects.toBeInstanceOf(Error);
  expect(estat.demanat).toBe(1);
  expect(wikiManifestCarregat()).toBeNull();
  estat.falla = false;
  const pendent = carregaWikiManifest();
  // Mentre viatja, encara no hi ha manifest per a pintar de colp.
  expect(wikiManifestCarregat()).toBeNull();
  const manifest = await pendent;
  expect(estat.demanat).toBe(2);
  expect(manifest.items.map((i) => i.id)).toEqual(['prompt_local']);
  // Ja arribat, es llig de colp (sense esperar cap microtasca).
  expect(wikiManifestCarregat()).toBe(manifest);
  // Ja arribat, totes les crides tornen el mateix manifest, també les simultànies.
  const [a, b] = await Promise.all([carregaWikiManifest(), carregaWikiManifest()]);
  expect(a).toBe(manifest);
  expect(b).toBe(manifest);
  expect(estat.demanat).toBe(2);
});
