// @vitest-environment node
/* P0-08 (Llibre Mestre, 261021) · Guarda del sanejament de /legal (feaa7adc):
   cap «conta» en el sentit de compte, el barbarisme («contes» del verb contar
   sí que val), i el titular coherent entre l'avís legal (§1) i el responsable
   del tractament (§7): cap marcador de dades protegides i el mateix NIF als
   dos llocs. La prova no copia el NIF: només en compara les aparicions. */
import { expect, test } from 'vitest';
import { legalContent } from './legalContent.js';

const HTML = legalContent.html;

test('cap «conta» de compte: l’únic que queda és el verb contar («li contes»)', () => {
  const trobades = [...HTML.matchAll(/\b(?:conta|contes)\b/gi)]
    .map((m) => HTML.slice(Math.max(0, m.index - 3), m.index + m[0].length).toLowerCase());
  expect(trobades).toEqual(['li contes']);
});

test('el NIF del titular és el mateix al §1 i al §7, i no queda cap marcador de dades protegides', () => {
  expect(HTML).not.toMatch(/DADES PROTEGIDES/i);
  const nifs = [...HTML.matchAll(/\bNIF:?(?:<\/strong>)?\s*([0-9XYZ]\d{7}[A-Z])\b/g)].map((m) => m[1]);
  expect(nifs).toHaveLength(2);
  expect(new Set(nifs).size).toBe(1);
});
