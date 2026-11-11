/* Onada R17 · AH-R17-11 / P0-88 (Sofía Bornay, Android) + P0-93 / AH-R17-16 ·
   Amb la finestra de vora a vora d'Android, els tres botons del sistema tapen
   el que toca el baix de la pantalla. El peu del Dialeg ja hi pujava damunt
   (components.css), però un full inferior o un calaix sense peu acaba en el
   cos, i l'últim botó del cos («Descarta» d'«Envia a…», DialegCompartir.jsx)
   quedava davall dels botons. jsdom no maqueta ni resol la cascada: es
   lligen els fulls de veres (com Dialeg.test.jsx i src/css/*.capes.test.js) i
   es comprova, amb el DOM que pinta el Dialeg, que el selector casa on toca:
   sense peu, sí; amb peu o a pantalla completa, no. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { Dialeg } from './Dialeg.jsx';
import DialegCompartir from '../../../sections/xat/components/DialegCompartir.jsx';

afterEach(() => { cleanup(); });

const ZONA_SEGURA = 'calc(var(--sdp-space-4) + env(safe-area-inset-bottom, 0px))';
const FULL_INFERIOR = '@media (max-width: 720px)';
const lligFull = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

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
/** Declaracions d'un cos: [[propietat, valor], …]. */
const declaracionsDe = (cos) => cos.split(';').map((d) => d.trim()).filter((d) => d.includes(':'))
  .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]);
/** Tots els valors de `propietat` a les regles amb eixe prelud exacte. */
const valors = (full, prelud, propietat) => full.filter((r) => r.prelud === prelud)
  .flatMap((r) => declaracionsDe(r.cos)).filter(([p]) => p === propietat).map(([, v]) => v);
/** Especificitat (0, classes i pseudoclasses, elements) d'un selector senzill; :not() compta el seu argument. */
function especificitat(selector) {
  const pla = selector.replace(/:not\(([^)]*)\)/g, ' $1');
  const classes = (pla.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) || []).length;
  const elements = (pla.match(/(?:^|[\s>+~])[a-z][\w-]*/g) || []).length;
  return [0, classes, elements];
}
/** a guanya a b per especificitat (a la mateixa capa, sense comptar l'ordre). */
function guanya(a, b) {
  const [x, y] = [especificitat(a), especificitat(b)];
  const i = x.findIndex((v, j) => v !== y[j]);
  return i >= 0 && x[i] > y[i];
}
/** La declaració d'un token tal com s'escriu a tokens.css (el nom a banda: tractor-tokens, T3). */
const declaracioDeToken = (nom, valor) => `${nom}: ${valor};`;

const COMPONENTS = regles(lligFull('src/css/components.css'));
const MODULS = regles(lligFull('src/css/modules.css'));

/** Les regles del cos-últim-del-marc: [{ prelud, cos, pares }]. */
const reglesDelCosFinal = () => COMPONENTS.filter((r) => r.prelud.endsWith('> .sdp-dialeg__marc > .sdp-dialeg__cos:last-child'));
const selectorFullInferior = () => reglesDelCosFinal().find((r) => r.pares.includes(FULL_INFERIOR))?.prelud;
const selectorCalaix = () => reglesDelCosFinal().find((r) => !r.pares.some((p) => p.startsWith('@media')))?.prelud;

describe('Onada R17 · P0-88 · el cos final del Dialeg, damunt de la zona segura de baix', () => {
  test('full inferior (≤720px): una sola regla, dins de components i del tall del full inferior, només padding-bottom', () => {
    const regla = reglesDelCosFinal().filter((r) => r.pares.includes(FULL_INFERIOR));
    expect(regla).toHaveLength(1);
    expect(regla[0].pares).toEqual(['@layer components', FULL_INFERIOR]);
    expect(regla[0].prelud).toBe('.sdp-dialeg:not(.sdp-dialeg--completa) > .sdp-dialeg__marc > .sdp-dialeg__cos:last-child');
    expect(declaracionsDe(regla[0].cos)).toEqual([['padding-bottom', ZONA_SEGURA]]);
  });

  test('calaix (totes les amplades): una sola regla fora de @media, com el peu del calaix', () => {
    const regla = reglesDelCosFinal().filter((r) => !r.pares.some((p) => p.startsWith('@media')));
    expect(regla).toHaveLength(1);
    expect(regla[0].pares).toEqual(['@layer components']);
    expect(regla[0].prelud).toBe('.sdp-dialeg--calaix > .sdp-dialeg__marc > .sdp-dialeg__cos:last-child');
    expect(declaracionsDe(regla[0].cos)).toEqual([['padding-bottom', ZONA_SEGURA]]);
    // El mateix càlcul que el peu del calaix i el del full inferior (no un segon càlcul).
    expect(valors(COMPONENTS, '.sdp-dialeg--calaix .sdp-dialeg__peu', 'padding-bottom')).toEqual([ZONA_SEGURA]);
  });

  test('Llei del Píxel: sense zona segura, el coixí de baix de sempre (el del cos de base i el del cos del Xat)', () => {
    // .sdp-dialeg__cos: padding var(--sdp-space-4) var(--sdp-space-6) → el de baix és --sdp-space-4.
    expect(valors(COMPONENTS, '.sdp-dialeg__cos', 'padding')).toEqual(['var(--sdp-space-4) var(--sdp-space-6)']);
    // El cos del Xat (modules.css, mateixa capa i més tard) fa el mateix coixí de baix: tres valors, el tercer.
    const xat = valors(MODULS, '.sdp-xat-dialeg .sdp-dialeg__cos', 'padding');
    expect(xat).toHaveLength(1);
    expect(xat[0].split(' ')[2]).toBe('var(--sdp-space-4)');
    // I la regla nova li guanya per especificitat, no per l'ordre dels fulls.
    expect(guanya(selectorFullInferior(), '.sdp-xat-dialeg .sdp-dialeg__cos')).toBe(true);
    expect(guanya(selectorCalaix(), '.sdp-xat-dialeg .sdp-dialeg__cos')).toBe(true);
    // La guarda d'especificitat veu l'ordre invers.
    expect(guanya('.sdp-xat-dialeg .sdp-dialeg__cos', selectorFullInferior())).toBe(false);
  });

  test('la pantalla completa ja guarda la zona segura al farciment del <dialog>: el cos no la torna a sumar', () => {
    const farciment = valors(COMPONENTS, '.sdp-dialeg.sdp-dialeg--completa:not(.sdp-dialeg--calaix)', 'padding');
    expect(farciment).toHaveLength(1);
    expect(farciment[0]).toContain('env(safe-area-inset-bottom, 0px)');
    expect(selectorFullInferior()).toContain(':not(.sdp-dialeg--completa)');
  });
});

describe('Onada R17 · P0-88 · el selector casa amb el DOM de veres del Dialeg', () => {
  test('sense peu, el cos és l’últim del marc i rep la zona segura; amb peu, no (el peu ja la porta)', () => {
    render(<Dialeg obert titol="Sense peu"><p>Cos</p></Dialeg>);
    const sensePeu = screen.getByRole('dialog', { name: 'Sense peu' });
    expect(sensePeu.querySelector('.sdp-dialeg__cos').matches(selectorFullInferior())).toBe(true);
    cleanup();
    render(<Dialeg obert titol="Amb peu" accions={<button type="button">D’acord</button>}><p>Cos</p></Dialeg>);
    const ambPeu = screen.getByRole('dialog', { name: 'Amb peu' });
    expect(ambPeu.querySelector('.sdp-dialeg__cos').matches(selectorFullInferior())).toBe(false);
    expect(ambPeu.querySelector(':scope > .sdp-dialeg__marc > footer.sdp-dialeg__peu')).not.toBeNull();
  });

  test('«Envia a…» (DialegCompartir): el botó «Descarta» viu dins del cos que rep la zona segura', () => {
    const t = (_clau, reserva) => reserva;
    render(
      <DialegCompartir obert lot={{ fitxers: [], text: 'Hola', rebutjats: 0 }} fils={[]} t={t}
        onDescarta={() => {}} onTria={() => {}} onVes={() => {}} />
    );
    const descarta = screen.getByRole('button', { name: 'Descarta' });
    const cos = descarta.closest('.sdp-dialeg__cos');
    expect(cos).not.toBeNull();
    expect(cos.matches(selectorFullInferior())).toBe(true);
    // És el full del Xat: la regla del Xat no li torna a llevar la zona segura.
    expect(cos.closest('dialog').classList.contains('sdp-xat-dialeg')).toBe(true);
  });

  test('un calaix sense peu casa amb la regla del calaix; la pantalla completa no casa amb cap', () => {
    render(<Dialeg obert costat="dreta" titol="Calaix sense peu"><p>Cos</p></Dialeg>);
    const calaix = screen.getByRole('dialog', { name: 'Calaix sense peu' });
    expect(calaix.querySelector('.sdp-dialeg__cos').matches(selectorCalaix())).toBe(true);
    cleanup();
    render(<Dialeg obert mida="completa" titol="Completa"><p>Cos</p></Dialeg>);
    const completa = screen.getByRole('dialog', { name: 'Completa' });
    const cos = completa.querySelector('.sdp-dialeg__cos');
    expect(cos.matches(selectorFullInferior())).toBe(false);
    expect(cos.matches(selectorCalaix())).toBe(false);
  });
});

/* P0-93 / AH-R17-16 · Zoom del 400 % (320×480 px): cap botó inabastable. El
   full inferior té un sostre per davall de 100dvh i fa scroll de reserva; el
   calaix fa la resta de la pantalla davall de la barra negra (mai 100dvh
   sencer: taparia la barra, Dialeg.test.jsx O4-CLAUDE-1b) i també en fa. */
describe('P0-93 · a 320×480 px el full inferior i el calaix no passen de la pantalla i fan scroll', () => {
  test('full inferior: sostre en dvh per davall de 100, scroll de reserva, i el tall de mòbil no el deslliga', () => {
    const sostre = valors(COMPONENTS, '.sdp-dialeg', 'max-height');
    expect(sostre).toEqual(['min(88dvh, 48rem)']);
    const dvh = Number(/^min\((\d+)dvh,/.exec(sostre[0])?.[1]);
    expect(dvh).toBeGreaterThan(0);
    expect(dvh).toBeLessThanOrEqual(100);
    expect(valors(COMPONENTS, '.sdp-dialeg', 'overflow-y')).toEqual(['auto']);
    // A 480 px d'alçada: 88dvh = 422,4 px, més menut que 48rem (768 px): mana el dvh.
    expect(Math.min((480 * dvh) / 100, 48 * 16)).toBeLessThan(480);
    // Dins del tall del full inferior, cap regla del Dialeg torna a obrir el sostre.
    const mobil = COMPONENTS.filter((r) => r.pares.includes(FULL_INFERIOR) && r.prelud.split(',').some((s) => s.trim().startsWith('.sdp-dialeg')));
    const oberts = mobil.flatMap((r) => declaracionsDe(r.cos).filter(([p, v]) => /^(max-height|max-block-size|height|block-size)$/.test(p) && /none|auto|\d+(d|s|l)?vh/.test(v)).map(([p, v]) => `${r.prelud} { ${p}: ${v} }`));
    expect(oberts).toEqual([]);
  });

  test('calaix: el sostre és el token (la resta de pantalla davall de la barra) i el <dialog> fa scroll de reserva', () => {
    expect(valors(COMPONENTS, '.sdp-dialeg--calaix', 'max-height')).toEqual(['var(--sdp-calaix-alt)']);
    const tokens = senseComentaris(lligFull('src/css/tokens.css'));
    expect(tokens).toContain(declaracioDeToken('--sdp-calaix-alt', 'calc(100dvh - var(--sdp-calaix-dalt))'));
    // Cap regla del calaix li lleva el scroll de .sdp-dialeg.
    const calaix = COMPONENTS.filter((r) => /\.sdp-dialeg--calaix$|\.sdp-dialeg-sidebar$/.test(r.prelud.split(',')[0].trim()));
    expect(calaix.flatMap((r) => declaracionsDe(r.cos)).filter(([p]) => /^overflow(-y)?$/.test(p))).toEqual([]);
  });
});
