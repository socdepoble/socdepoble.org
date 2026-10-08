/**
 * Línia I1 (pla 261008_1201) · Mentre la foto de la fitxa puja, les píndoles
 * de davall de l'avatar (PageFrame, filaDeLAvatar: .page-title-avatar-accions
 * > button.sdp-classificacio-pindola) són disabled, i no han de semblar
 * actives: ni la mà (cursor: pointer de .sdp-classificacio-pindola) ni el
 * subratllat de l'etiqueta en passar-hi per damunt. jsdom no calcula la
 * cascada: es comprova la regla escrita (capa, @media i especificitat).
 * Llei del Píxel: cap color, cap opacitat i cap altra propietat; fora de
 * l'estat desactivat, la píndola es pinta com sempre.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla d'un full: { prelud, cos, pares, ordre } (pares: els blocs que la contenen). */
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
      if (marc && !marc.fills) {
        eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud), ordre: eixida.length });
      }
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}

/** Declaracions d'un cos: [[propietat, valor], …]. */
const declaracions = (cos) => cos.split(';')
  .map((d) => d.trim())
  .filter((d) => d.includes(':'))
  .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]);

/** Especificitat (classes i pseudoclasses) d'un selector sense id ni element; els pseudoelements no compten. */
function especificitat(selector) {
  const net = selector.replace(/::[\w-]+/g, '');
  return (net.match(/\.[\w-]+/g) || []).length + (net.match(/:[\w-]+/g) || []).length;
}

const MODULS = regles(readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8'));
const unica = (prelud) => {
  const trobades = MODULS.filter((r) => r.prelud === prelud);
  expect(trobades, prelud).toHaveLength(1);
  return trobades[0];
};

const DESACTIVADA = '.page-title-avatar-accions .sdp-classificacio-pindola:disabled';
const SUBRATLLAT = '.sdp-classificacio-pindola:hover > .sp-card-label';
const SENSE_SUBRATLLAT = '.page-title-avatar-accions .sdp-classificacio-pindola:disabled:hover > .sp-card-label';
const RATOLI = '@media (hover: hover) and (pointer: fine)';

describe('les píndoles de l’avatar desactivades mentre puja la foto', () => {
  test('el comptador d’especificitat compta classes i pseudoclasses', () => {
    expect(especificitat(SUBRATLLAT)).toBe(3);
    expect(especificitat(SENSE_SUBRATLLAT)).toBe(5);
    expect(especificitat('.a::before')).toBe(1);
  });

  test('cursor: not-allowed i res més, a @layer components', () => {
    const regla = unica(DESACTIVADA);
    expect(declaracions(regla.cos)).toEqual([['cursor', 'not-allowed']]);
    expect(regla.pares).toEqual(['@layer components']);
  });

  test('en passar-hi per damunt, sense el subratllat: dins del mateix @media i guanyant-li a la regla general', () => {
    const general = unica(SUBRATLLAT);
    expect(declaracions(general.cos)).toEqual([['text-decoration', 'underline']]);
    const neutre = unica(SENSE_SUBRATLLAT);
    expect(declaracions(neutre.cos)).toEqual([['text-decoration', 'none']]);
    // Mateixa capa i mateix @media que el subratllat: guanya per especificitat i per ordre.
    expect(neutre.pares).toEqual(['@layer components', RATOLI]);
    expect(general.pares).toEqual(['@layer components', RATOLI]);
    expect(especificitat(SENSE_SUBRATLLAT)).toBeGreaterThan(especificitat(SUBRATLLAT));
    expect(neutre.ordre).toBeGreaterThan(general.ordre);
  });

  test('Llei del Píxel: cap altra regla nova toca la píndola desactivada de l’avatar', () => {
    const delAvatar = MODULS.filter((r) => r.prelud.includes('.page-title-avatar-accions .sdp-classificacio-pindola'));
    expect(delAvatar.map((r) => r.prelud).sort()).toEqual([DESACTIVADA, SENSE_SUBRATLLAT].sort());
    const propietats = delAvatar.flatMap((r) => declaracions(r.cos).map(([p]) => p));
    expect(propietats.filter((p) => /^(opacity|color|background|filter)/.test(p))).toEqual([]);
  });
});
