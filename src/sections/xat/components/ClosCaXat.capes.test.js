/* Revisió adversarial 260930 (P3) · El peu del rail als fulls d'estil. jsdom
   no resol la cascada: es comproven les regles de modules.css.
   Plegat, el peu viu dins de la capçalera plegada, que porta
   var(--sdp-space-2) de coixí de baix, i el compensa amb un marge de −8px.
   En compacte ample (900–1023px: arrel .is-compact i closca 'ample'), la
   reserva de la barra mòbil substituïa eixe marge i el peu plegat acabava
   8px més amunt que el desplegat: plegar feia bot. La regla compacta del
   peu plegat ha de ser la reserva MENYS el coixí. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const modules = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();

/** El valor d'una propietat a les regles d'un selector exacte (l'última guanya). */
function valor(selector, propietat) {
  let trobat = null;
  for (const m of modules.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = net(m[1].split(';').pop()).split(',').map(net);
    if (!selectors.includes(selector)) continue;
    for (const declaracio of m[2].split(';')) {
      const [prop, ...resta] = declaracio.split(':');
      if (net(prop || '') === propietat) trobat = net(resta.join(':'));
    }
  }
  return trobat;
}

test('P3 · en compacte, el peu plegat reserva la barra mòbil menys el coixí de la capçalera plegada: plegar no fa bot', () => {
  expect(valor('.sdp-xat-rail-peu.sdp-xat-rail-peu--plegat', 'margin-bottom')).toBe('calc(var(--sdp-space-2) * -1)');
  const reserva = valor(':where(.sdp-root.is-compact) .app-grid-shell .sdp-xat-rail-peu', 'margin-bottom');
  expect(reserva).toBe('calc(var(--sdp-alt-nav-mobil) + env(safe-area-inset-bottom, 0px))');
  const plegat = valor(':where(.sdp-root.is-compact) .app-grid-shell .sdp-xat-rail-peu.sdp-xat-rail-peu--plegat', 'margin-bottom');
  expect(plegat).toBe(`${reserva.slice(0, -1)} - var(--sdp-space-2))`);
});
