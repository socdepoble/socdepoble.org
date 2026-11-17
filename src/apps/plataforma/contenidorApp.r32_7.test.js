// @vitest-environment node
/* v1.2.7 · R325-02 · En mòbil, el final de Gestoria · Facturació i d'Escàner Local quedava davall de la
   barra inferior. .sdp-app-contenidor és un ítem de la columna flex .app-main__content (layout.css), que és
   el scroller i, en compacte, reserva a baix l'alçada de la barra mòbil amb un padding-bottom. Amb
   «height: 100%» l'ítem quedava fixat a l'alçada del visor: la banda beta i el contingut en desbordaven
   la caixa, i el padding del scroller es comptava després de la caixa, no després del contingut. El
   contenidor ha de créixer amb el contingut (flex: 1 0 auto, sense height) i omplir com a mínim el visor
   (min-height: 100%), que és el que necessiten les apps d'inset absolut (.app-grid-page, .sdp-app-unica).
   Vitest no fa disseny: la prova és sobre la font. La de navegador (Chrome headless a 375 px, arnés
   estàtic) és a l'informe de la correcció. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(path.join(process.cwd(), 'src/apps/plataforma/apps.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const declaracions = (selector) => {
  const regles = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, sel]) => sel.trim() === selector);
  expect(regles, selector).toHaveLength(1);
  return Object.fromEntries(regles[0][2].split(';').map((d) => d.trim()).filter(Boolean)
    .map((d) => d.split(/:(.*)/s).slice(0, 2).map((part) => part.trim())));
};

describe('R325-02 · el contenidor d’una app creix amb el contingut', () => {
  test('.sdp-app-contenidor: columna flex que no s’encongix ni fixa l’alçada (el padding de la barra mòbil queda després del final)', () => {
    const contenidor = declaracions('.sdp-app-contenidor');
    expect(contenidor).toEqual({
      display: 'flex',
      'flex-direction': 'column',
      flex: '1 0 auto',
      'min-height': '100%'
    });
    expect(Object.hasOwn(contenidor, 'height')).toBe(false);
    expect(Object.hasOwn(contenidor, 'max-height')).toBe(false);
    expect(Object.hasOwn(contenidor, 'overflow')).toBe(false);
  });

  test('.sdp-app-contenidor__cos omple la resta (les apps d’inset absolut conserven l’alçada del visor)', () => {
    const cos = declaracions('.sdp-app-contenidor__cos');
    expect(cos.position).toBe('relative');
    expect(['auto', '1 1 auto']).toContain(cos.flex);
    expect(cos['min-height']).toBe('0');
  });
});
