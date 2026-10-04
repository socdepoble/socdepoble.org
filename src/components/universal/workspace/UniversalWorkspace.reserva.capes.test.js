// @vitest-environment node
/* Barres (ordre del Mestre, 261004: que la barra fixa no «es menge
   contingut») · Prova de capes de la reserva de la barra mòbil.
   En compacte, nav.mobile-nav és fixa i .app-grid-page és absoluta: la barra
   tapava els 69 px de baix del rail, de la llista i del detall del
   Workspace. Cada scroller del Workspace en reserva l'alçada dins seu, amb
   la mateixa expressió que el Xat. Abast positiu: la classe que posa
   UniversalWorkspace (sdp-workspace--universal), perquè el Xat, que també
   porta sdp-workspace, ja la reserva i no l'ha de tindre doble.
   jsdom no pinta: es llig el full sense comentaris. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const regles = (css) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selector, cos]) => ({ selectors: selector.trim().split(',').map((s) => s.trim()), cos: cos.trim() }));

const RESERVA = 'calc(var(--sdp-alt-nav-mobil) + env(safe-area-inset-bottom, 0px))';
const ABAST = ':where(.sdp-root.is-compact) .sdp-workspace--universal';
const SCROLLERS = ['.sdp-workspace-rail', '.sdp-workspace-column__body', '.sdp-workspace-detail'];
/* Correcció dels verificadors (261004) · L'abast és l'estructura pròpia de
   la closca, amb combinadors de fill: un descendent qualsevol també
   prenia els components del Xat que el detall de Disseny pinta en marcs
   fixos (doble reserva). UniversalWorkspace.reserva.test.jsx ho comprova
   sobre el DOM de veres. */
const GRAELLA = `${ABAST} > .app-grid-shell > .app-grid-content`;
const SELECTORS = [
  `${GRAELLA} > .app-grid-column > .sdp-workspace-column > .app-grid-col-header--collapsed > .sdp-workspace-rail`,
  `${GRAELLA} > .app-grid-rail > .sdp-workspace-column > .app-grid-col-header--collapsed > .sdp-workspace-rail`,
  `${GRAELLA} > .app-grid-column > .sdp-workspace-column > .sdp-workspace-column__body`,
  `${GRAELLA} > .app-grid-column--right > .sdp-workspace-detail`
];

const modules = net('src/css/modules.css');

describe('la reserva de la barra mòbil als scrollers del Workspace', () => {
  test('els tres scrollers, amb la condició de la barra i l’abast de la closca del Workspace, en una sola regla', () => {
    const regla = regles(modules).find((r) => r.selectors.some((s) => s.startsWith(ABAST)));
    expect(regla).toBeTruthy();
    expect(regla.selectors).toEqual(SELECTORS);
    expect(regla.cos).toBe(`padding-bottom: ${RESERVA};`);
  });

  test('cap selector de la reserva no baixa per un descendent qualsevol: només combinadors de fill després de l’abast', () => {
    const regla = regles(modules).find((r) => r.selectors.some((s) => s.startsWith(ABAST)));
    for (const selector of regla.selectors) {
      const cua = selector.slice(ABAST.length).trim();
      /* Cada pas és «> classe»: cap espai sense combinador. */
      expect(cua, selector).toMatch(/^(> \.[\w-]+ ?)+$/);
    }
  });

  test('cap regla més no usa l’abast del Workspace, i cap reserva als scrollers en queda fora', () => {
    const totes = regles(modules);
    expect(totes.filter((r) => r.selectors.some((s) => s.includes('sdp-workspace--universal')))).toHaveLength(1);
    /* Una reserva sobre els scrollers sense l'abast cauria també al Xat. */
    const senseAbast = totes.filter((r) => r.cos.includes('--sdp-alt-nav-mobil')
      && r.selectors.some((s) => SCROLLERS.some((sc) => s.endsWith(sc)) && !s.startsWith(ABAST)));
    expect(senseAbast).toEqual([]);
  });

  test('el Xat conserva la seua reserva i no rep la del Workspace', () => {
    const xat = regles(modules).find((r) => r.selectors.includes(':where(.sdp-root.is-compact) .app-grid-shell .sdp-xat-conversa'));
    expect(xat?.cos).toBe(`padding-bottom: ${RESERVA};`);
    const closcaXat = readFileSync(resolve(process.cwd(), 'src/sections/xat/components/ClosCaXat.jsx'), 'utf8');
    expect(closcaXat).toContain('className="sdp-workspace sdp-xat"');
    expect(closcaXat).not.toContain('sdp-workspace--universal');
    const workspace = readFileSync(resolve(process.cwd(), 'src/components/universal/workspace/UniversalWorkspace.jsx'), 'utf8');
    expect(workspace).toContain("'sdp-workspace', 'sdp-workspace--universal'");
  });
});
