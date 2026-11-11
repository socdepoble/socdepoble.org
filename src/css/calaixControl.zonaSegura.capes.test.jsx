/* Onada R17 · AH-R17-11 / P0-88 (Sofía Bornay, Android) + P0-93 / AH-R17-16 ·
   El calaix CONTROL (App.jsx, mode compacte: <Dialeg costat="esquerra"
   variant="sense-marc" className="sdp-dialeg-sidebar">) arriba fins a baix de
   la pantalla, i amb la finestra de vora a vora els tres botons d'Android
   tapaven «Legal i privacitat», l'última entrada de «Sistema». La llista
   (layout.css § SIDEBAR · SCROLL) acaba ara damunt de la zona segura de baix.
   jsdom no maqueta ni resol la cascada: es lligen els fulls (com
   jerarquiaBarraLateral.capes.test.js), es comprova que el selector casa amb
   el DOM que pinta el Dialeg i, amb els tokens de veres, que a 320×480 px
   (zoom del 400 %) la llista conserva lloc i fa scroll. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { Dialeg } from '../components/PedraSeca/organismes/Dialeg.jsx';

afterEach(() => { cleanup(); document.querySelectorAll('.sdp-root').forEach((el) => el.remove()); });

const ZONA_SEGURA = 'calc(var(--sdp-space-4) + env(safe-area-inset-bottom, 0px))';
const SELECTOR = ':where(.sdp-root.is-compact) .sdp-dialeg-sidebar nav.app-sidebar > .app-sidebar-nav';
const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
// Decisió del Mestre (30-10-2026) · Els noms de token es componen: tractor-tokens llig src sencer.
const tok = (nom) => ['--sdp', nom].join('-');

/** Regles fulla d'un full: { prelud, cos, pares } (pares: els blocs que la contenen). */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.split(';').pop().trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud) });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}
const declaracionsDe = (cos) => cos.split(';').map((d) => d.trim()).filter((d) => d.includes(':'))
  .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]);
const valors = (full, prelud, propietat) => full.filter((r) => r.prelud === prelud)
  .flatMap((r) => declaracionsDe(r.cos)).filter(([p]) => p === propietat).map(([, v]) => v);
/** Especificitat (0, classes, elements); :where() no compta. */
function especificitat(selector) {
  const pla = selector.replace(/:where\([^)]*\)/g, ' ');
  return [0, (pla.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) || []).length, (pla.match(/(?:^|[\s>+~])[a-z][\w-]*/g) || []).length];
}
function guanya(a, b) {
  const [x, y] = [especificitat(a), especificitat(b)];
  const i = x.findIndex((v, j) => v !== y[j]);
  return i >= 0 && x[i] > y[i];
}

const LAYOUT = regles(llig('src/css/layout.css'));
const MODULS = regles(llig('src/css/modules.css'));

describe('Onada R17 · P0-88 · el peu del calaix CONTROL, damunt de la zona segura de baix', () => {
  test('una sola regla, a la capa de la llista (legacy), només padding-bottom amb la zona segura', () => {
    const regla = LAYOUT.filter((r) => r.prelud === SELECTOR);
    expect(regla).toHaveLength(1);
    expect(regla[0].pares).toEqual(['@layer legacy']);
    expect(declaracionsDe(regla[0].cos)).toEqual([['padding-bottom', ZONA_SEGURA]]);
  });

  test('Llei del Píxel: sense zona segura, el coixí de baix de sempre de .app-sidebar-nav, i li guanya dins de la capa', () => {
    const base = MODULS.filter((r) => r.prelud === '.app-sidebar-nav');
    expect(base).toHaveLength(1);
    expect(base[0].pares).toEqual(['@layer legacy']);
    expect(valors(MODULS, '.app-sidebar-nav', 'padding')).toEqual(['0 0 var(--sdp-space-4)']);
    expect(guanya(SELECTOR, '.app-sidebar-nav')).toBe(true);
    expect(guanya('.app-sidebar-nav', SELECTOR)).toBe(false);
    // Fora del calaix (la barra fixa d'escriptori i el rail plegat) no canvia res.
    expect(LAYOUT.filter((r) => r.prelud !== SELECTOR && r.prelud.endsWith('.app-sidebar-nav') && r.cos.includes('safe-area-inset-bottom'))).toEqual([]);
  });

  test('el calaix d’App.jsx és el que diu el selector, i les dues barres pinten .app-sidebar-nav filla de la nav', () => {
    const app = llig('src/app/App.jsx');
    // L'obertura del <Dialeg> del calaix: porta fletxes (onTanca={() => …}), es talla per índexs.
    const classe = app.indexOf('className="sdp-dialeg-sidebar"');
    expect(classe).toBeGreaterThan(-1);
    const obertura = app.slice(app.lastIndexOf('<Dialeg', classe), app.indexOf('<nav id="app-sidebar"', classe));
    expect(obertura.startsWith('<Dialeg')).toBe(true);
    expect(obertura).toContain('costat="esquerra"');
    expect(obertura).toContain('variant="sense-marc"');
    expect(app).toContain('<nav id="app-sidebar" className="app-sidebar"');
    expect(app).toContain('<div className="app-sidebar-nav">');
    expect(llig('src/apps/plataforma/BarraApp.jsx')).toContain('<div className="app-sidebar-nav">');
  });

  test('el selector casa amb el DOM que pinta el Dialeg: la llista, amb «Legal i privacitat» al final, dins del calaix compacte', () => {
    const arrel = document.createElement('div');
    arrel.className = 'sdp-root is-compact';
    document.body.appendChild(arrel);
    render(
      <Dialeg obert titol="Menú Sóc de Poble" costat="esquerra" variant="sense-marc" className="sdp-dialeg-sidebar">
        <nav id="app-sidebar" className="app-sidebar" aria-label="Navegació principal">
          <button type="button" className="brand">Sóc de Poble</button>
          <div className="sidebar-control-row"><button type="button" className="sidebar-control-btn">CONTROL</button></div>
          <div className="app-sidebar-nav">
            <div className="app-sidebar-nav__llista" role="group" aria-label="Seccions">
              <a href="/mur" className="nav-item">Mur</a>
              <a href="/legal" className="nav-item">Legal i privacitat</a>
            </div>
          </div>
        </nav>
      </Dialeg>,
      { container: arrel }
    );
    const dialeg = screen.getByRole('dialog', { name: 'Menú Sóc de Poble' });
    expect([...dialeg.classList]).toEqual(expect.arrayContaining(['sdp-dialeg--calaix', 'sdp-dialeg--esquerra', 'sdp-dialeg-sidebar']));
    const llista = dialeg.querySelector('.app-sidebar-nav');
    // :where() no compta ni el resol jsdom: l'avantpassat es mira a banda.
    const [, ancestre, resta] = /^:where\(([^)]+)\)\s+(.+)$/.exec(SELECTOR);
    expect(llista.matches(resta)).toBe(true);
    expect(llista.closest(ancestre)).toBe(arrel);
    expect(llista.contains(screen.getByRole('link', { name: 'Legal i privacitat' }))).toBe(true);
    // Fora del compacte (la barra fixa) l'avantpassat no hi és.
    arrel.classList.remove('is-compact');
    expect(llista.closest(ancestre)).toBeNull();
  });
});

/* P0-93 / AH-R17-16 · Zoom del 400 % (320×480 px). Suposats, en px CSS: la
   barra d'estat (zona segura de dalt) 24 i, en vertical, els tres botons
   d'Android davall (zona segura de baix) 48; en apaïsat els botons passen al
   costat (baix 0). El calaix comença davall de la barra negra (--sdp-calaix-dalt)
   i, dins, la marca i la fila de CONTROL són fixes: la resta és la llista,
   que ha de conservar com a mínim una diana tàctil i fer scroll. */
describe('P0-93 · a 320×480 px la llista del calaix CONTROL conserva lloc i fa scroll', () => {
  const tokens = senseComentaris(llig('src/css/tokens.css'));
  const px = (nom) => Number(new RegExp(`${tok(nom)}:\\s*(\\d+)px`).exec(tokens)?.[1]);

  test('la cadena del scroll: la nav fa l’alçada del calaix, la llista s’encongix i fa scroll', () => {
    expect(valors(LAYOUT, ':where(.sdp-root.is-compact) .sdp-dialeg-sidebar nav.app-sidebar', 'height')).toEqual(['100%']);
    expect(declaracionsDe(LAYOUT.find((r) => r.prelud === 'nav.app-sidebar > .app-sidebar-nav').cos))
      .toEqual([['flex', '1 1 auto'], ['min-height', '0'], ['overflow', 'hidden']]);
    const llista = 'nav.app-sidebar > .app-sidebar-nav > .app-sidebar-nav__llista';
    expect(valors(LAYOUT, llista, 'min-height')).toEqual(['0']);
    expect(valors(LAYOUT, llista, 'overflow-y')).toEqual(['auto']);
    // Les files fixes del calaix: la marca (sense la zona segura de dalt) i CONTROL.
    expect(valors(LAYOUT, ':where(.sdp-root.is-compact) .sdp-dialeg-sidebar .brand', 'height')).toEqual([`var(${tok('alt-negra')})`]);
    expect(valors(LAYOUT, '.sidebar-control-btn', 'height')).toEqual([`var(${tok('alt-accio')})`]);
  });

  test.each([
    ['vertical, Android amb tres botons', 480, 24, 48, 0],
    ['apaïsat, botons al costat', 320, 24, 0, 0],
    ['vertical, BarraApp (fila del nom de l’app)', 480, 24, 48, 1]
  ])('%s: queda lloc per a una diana tàctil o més', (_cas, alt, dalt, baix, filesApp) => {
    const [negra, accio, espai4, tactil] = [px('alt-negra'), px('alt-accio'), px('space-4'), px('touch')];
    expect([negra, accio, espai4, tactil].every((n) => n > 0)).toBe(true);
    const calaix = alt - (negra + dalt);
    const llista = calaix - negra - accio - filesApp * tactil - (espai4 + baix);
    expect(llista).toBeGreaterThanOrEqual(tactil);
  });
});
