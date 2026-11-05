// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

/* FEDI-22 (ordre del Mestre, 261103; captura 261103_2055) · /connectar a tota
   l'amplària. La Llei del Píxel per a Notes (SnippetCurador i
   PrevisualitzacioExtern reutilitzen .sdp-connectar*): cap regla de sempre
   canvia, i tot el que és nou són classes i modificadors nous, dins de
   @layer components, amb tokens, sense :has(), sense colors hex i amb el
   :hover només per a punter fi. Es llig el text de src/css/modules.css. */
const CSS = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla en ordre de font: { prelud, cos, pares }. */
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
const TOTES = regles(CSS);
const amb = (prelud) => TOTES.filter((r) => r.prelud === prelud);
const una = (prelud) => {
  const trobades = amb(prelud);
  expect(trobades, prelud).toHaveLength(1);
  return trobades[0];
};
const declaracions = (cos) => Object.fromEntries(cos.split(';').map((d) => d.trim()).filter(Boolean)
  .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]));

/* El bloc nou, del seu comentari fins al del resum. */
const INICI = CSS.indexOf('/* FEDI-22 (ordre del Mestre, 261103; captura 261103_2055) · /connectar a');
const FI = CSS.indexOf('/* Resum per destinatari (ResumConnexio)');
const BLOC = CSS.slice(INICI, FI);
const NOVES = regles(BLOC);

describe('Llei del Píxel · les regles de sempre no canvien', () => {
  test('la base .sdp-connectar continua estreta i centrada, amb el mateix ritme', () => {
    expect(declaracions(una('.sdp-connectar').cos)).toEqual({
      display: 'flex', 'flex-direction': 'column', gap: 'var(--sdp-space-8)', 'max-width': 'var(--sdp-measure)',
      'margin-inline': 'auto', 'padding-bottom': 'var(--sdp-space-16)'
    });
  });

  test('__seccio, __panell, __peu, __objecte i __ajuda, com sempre', () => {
    expect(una('.sdp-connectar__seccio').cos).toBe('display: flex; flex-direction: column; gap: var(--sdp-space-3);');
    expect(una('.sdp-connectar__peu').cos).toBe('display: flex; flex-direction: column; gap: var(--sdp-space-3);');
    expect(una('.sdp-connectar__ajuda').cos).toBe('margin: 0; font-size: var(--sdp-text-meta); line-height: 1.6; color: var(--sdp-text-suau);');
    expect(declaracions(una('.sdp-connectar__panell').cos)).toMatchObject({ padding: 'var(--sdp-space-4)', border: '1px solid var(--sdp-vora)' });
    expect(declaracions(una('.sdp-connectar__objecte').cos)).toMatchObject({ 'align-items': 'center', padding: 'var(--sdp-space-5)', 'text-align': 'center' });
  });

  test('cap regla nova redefinix una classe de sempre', () => {
    const vells = new Set(regles(CSS.slice(0, INICI) + CSS.slice(FI)).map((r) => r.prelud));
    for (const { prelud } of NOVES) expect(vells.has(prelud), prelud).toBe(false);
  });
});

describe('les regles noves', () => {
  test('són dins de @layer components (el bloc T43)', () => {
    expect(NOVES.length).toBeGreaterThan(20);
    for (const regla of NOVES) {
      const real = TOTES.find((r) => r.prelud === regla.prelud && r.cos === regla.cos);
      expect(real?.pares[0], regla.prelud).toBe('@layer components');
    }
  });

  test('dues columnes amb el tall de 64rem de la pàgina, i la xarxa de 90rem sense @container', () => {
    const graella = amb('.sdp-connectar--amb-lateral');
    expect(graella).toHaveLength(2);
    expect(graella[0].pares).toEqual(['@layer components', '@container (min-width: 64rem)']);
    expect(graella[1].pares).toEqual(['@layer components', '@supports not (container-type: inline-size)', '@media (min-width: 90rem)']);
    for (const regla of graella) {
      expect(declaracions(regla.cos)).toEqual({
        display: 'grid', 'grid-template-columns': 'minmax(0, 1fr) minmax(18rem, 24rem)', gap: 'var(--sdp-space-8)', 'align-items': 'start'
      });
    }
    expect(amb('.sdp-connectar--amb-lateral > .sdp-alerta').map((r) => r.cos)).toEqual(['grid-column: 1 / -1;', 'grid-column: 1 / -1;']);
    expect(una('.sdp-connectar--graella').cos).toBe('max-width: none;');
  });

  test('IDEA-93 · el logotip manté els 600px canònics (.page-title-logo) sense excepció de 260px a /connectar', () => {
    expect(amb('.sdp-connectar-pagina .page-title-logo')).toHaveLength(0);
    expect(una('.page-title-logo').cos).toBe('width: min(100%, 600px); min-width: min(100%, 260px);');
  });

  test('C8 · la llegenda i les píndoles del selector, centrades a les targetes; cap línia centrada més llarga que la mesura', () => {
    expect(una('.sdp-connectar__targeta .sdp-variants__llegenda').cos).toBe('margin-inline: auto;');
    expect(una('.sdp-connectar__targeta .sdp-variants__pindoles').cos).toBe('justify-content: center;');
    expect(una('.sdp-connectar__targeta--directa p').cos).toBe('max-inline-size: var(--sdp-measure);');
  });

  test('C7 · la fitxa compacta és flex i fa salt de línia', () => {
    expect(declaracions(una('.sdp-connectar__fitxa').cos)).toMatchObject({ display: 'flex', 'flex-wrap': 'wrap' });
  });

  test('RA-01 (revisió 261104) · T2 davall de T1 per sota de 2 × 36rem; dins de T1, dues columnes des de 36rem; en un mòbil, més compacta', () => {
    expect(declaracions(una('.sdp-connectar__principal--targetes').cos)['grid-template-columns'])
      .toBe('repeat(auto-fit, minmax(min(100%, 36rem), 1fr))');
    const directa = amb('.sdp-connectar__targeta--directa').filter((r) => r.pares.length === 1);
    expect(directa).toHaveLength(1);
    expect(declaracions(directa[0].cos).container).toBe('sdp-connectar-directa / inline-size');
    const dues = una('.sdp-connectar__directa--dues');
    expect(dues.pares).toEqual(['@layer components', '@container sdp-connectar-directa (min-width: 36rem)']);
    expect(declaracions(dues.cos)).toEqual({
      display: 'grid', 'grid-template-columns': 'repeat(2, minmax(0, 1fr))', gap: 'var(--sdp-space-8)', 'align-items': 'start'
    });
    /* Ronda 7 (GLOBAL-04) · El tall de mòbil, amb el nom de la pàgina: T1 i els seus fills al mateix tall. */
    expect(declaracions(una('.sdp-connectar-pagina').cos)).toEqual({ container: 'sdp-connectar-pagina / inline-size' });
    const mobil = amb('.sdp-connectar__targeta--directa').filter((r) => r.pares.at(-1) === '@container sdp-connectar-pagina (max-width: 30rem)');
    expect(mobil).toHaveLength(1);
    expect(declaracions(mobil[0].cos)).toEqual({ gap: 'var(--sdp-space-3)', padding: 'var(--sdp-space-4)' });
    const fills = amb('.sdp-connectar__directa, .sdp-connectar__qui, .sdp-connectar__relacio').filter((r) => /max-width: 30rem/.test(r.pares.at(-1) ?? ''));
    expect(fills.map((r) => r.pares.at(-1))).toEqual(['@container sdp-connectar-pagina (max-width: 30rem)']);
    expect(amb('.sdp-connectar__targeta--directa').some((r) => r.pares.at(-1) === '@container (max-width: 30rem)')).toBe(false);
  });

  test('RA-03 · la píndola triada de les targetes no és el blau ple del primari, porta una marca i, en colors forçats, la selecció del sistema', () => {
    const triada = amb('.sdp-connectar__targeta .sdp-variant__control:checked + .sdp-variant__pindola');
    expect(triada).toHaveLength(2);
    expect(declaracions(triada[0].cos)).toEqual({
      'border-color': 'var(--sdp-accio-forta)', background: 'var(--sdp-accio-subtil)', color: 'var(--sdp-text-titol)'
    });
    expect(triada[1].pares.at(-1)).toBe('@media (forced-colors: active)');
    expect(declaracions(triada[1].cos)).toEqual({ 'border-color': 'Highlight', background: 'Highlight', color: 'HighlightText' });
    const marca = declaracions(una('.sdp-connectar__targeta .sdp-variant__control:checked + .sdp-variant__pindola::before').cos);
    expect(marca).toMatchObject({ content: "''", 'border-inline-end': '2px solid currentColor', 'border-block-end': '2px solid currentColor' });
  });

  test('C-02 · l’avís d’error que rep el focus, a tota l’amplària i sense el marge de l’Alerta', () => {
    expect(una('.sdp-connectar__error').cos).toBe('align-self: stretch;');
    expect(una('.sdp-connectar__error > .sdp-alerta').cos).toBe('margin-block: 0;');
  });

  test('el resum de les notes: diana tàctil de 48 + 16 i focus visible amb contorn', () => {
    expect(declaracions(una('.sdp-connectar__notes-resum').cos)['min-block-size']).toBe('calc(var(--sdp-touch) + var(--sdp-space-4))');
    expect(una('.sdp-connectar__notes-resum:focus-visible').cos).toMatch(/^outline: var\(--sdp-focus-gruix\) solid var\(--sdp-focus\);/);
  });
});

describe('les prohibicions de Pedra Seca, al bloc nou', () => {
  test('cap :has(), cap color hex, cap transition: all, cap temps literal ni cap style d’amplària fixa en px fora del logotip', () => {
    const net = senseComentaris(BLOC);
    expect(net).not.toMatch(/:has\(/);
    expect(net).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(net).not.toMatch(/transition:\s*all/);
    expect(net).not.toMatch(/\b\d+m?s\b/);
    expect(net).not.toMatch(/position:\s*sticky/);
    expect(net).not.toMatch(/\border:/);
  });

  test('el :hover només dins de la consulta de punter fi', () => {
    for (const regla of NOVES.filter((r) => r.prelud.includes(':hover'))) {
      expect(regla.pares.at(-1), regla.prelud).toBe('@media (hover: hover) and (pointer: fine)');
    }
  });
});
