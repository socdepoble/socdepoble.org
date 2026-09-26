import React, { forwardRef, memo } from 'react';
import { render, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Newspaper } from 'lucide-react';
import { NavGlyph, GLIF_DOCUMENT, emojiInicial, esGlif, primerGlif } from './NavGlyph.jsx';

afterEach(() => cleanup());

test('un emoji en text es pinta en un span amagat als lectors, sense petar', () => {
  const { container } = render(<NavGlyph glyph=" 🧱 " />);
  const span = container.querySelector('span.sdp-nav-glyph');
  expect(span?.textContent).toBe('🧱');
  expect(span?.getAttribute('aria-hidden')).toBe('true');
  expect(container.querySelector('svg')).toBeNull();
});

test('un component d’icona (forwardRef de lucide) es pinta com a icona', () => {
  const { container } = render(<NavGlyph glyph={Newspaper} size={20} />);
  const svg = container.querySelector('svg');
  expect(svg?.classList.contains('lucide-newspaper')).toBe(true);
  expect(svg?.getAttribute('width')).toBe('20');
  expect(svg?.getAttribute('aria-hidden')).toBe('true');
});

test('també accepta funcions i memo com a icona', () => {
  const Funcio = (props) => <svg data-testid="funcio" {...props} />;
  const Memo = memo(forwardRef((props, ref) => <svg data-testid="memo" ref={ref} {...props} />));
  expect(render(<NavGlyph glyph={Funcio} />).getByTestId('funcio')).toBeTruthy();
  expect(render(<NavGlyph glyph={Memo} />).getByTestId('memo')).toBeTruthy();
});

/* El títol du el nom del cas, no el valor: formatar un element React amb
   %s fa que vitest recórrega tot el seu graf (fins a `process`) i es penge. */
test.each([
  ['undefined', undefined],
  ['null', null],
  ['text buit', ''],
  ['espais', '   '],
  ['zero', 0],
  ['objecte pla', {}],
  ['element ja pintat', <span key="x">X</span>]
])(
  'sense glif vàlid (%s) cau a la carpeta: mai buit ni lletra',
  (_cas, glyph) => {
    const { container } = render(<NavGlyph glyph={glyph} />);
    expect(container.querySelector('svg.lucide-folder')).toBeTruthy();
    expect(container.textContent).toBe('');
  }
);

test('el recurs per defecte d’un document és el full', () => {
  const { container } = render(<NavGlyph glyph={null} fallback={GLIF_DOCUMENT} />);
  expect(container.querySelector('svg.lucide-file-text')).toBeTruthy();
});

test('esGlif, primerGlif i emojiInicial', () => {
  expect(esGlif('📦')).toBe(true);
  expect(esGlif(Newspaper)).toBe(true);
  expect(esGlif(' ')).toBe(false);
  expect(esGlif(<Newspaper />)).toBe(false);
  expect(primerGlif(null, '', Newspaper, '📦')).toBe(Newspaper);
  expect(primerGlif(undefined, null)).toBeNull();
  expect(emojiInicial('🍅 Tomaques')).toBe('🍅');
  expect(emojiInicial('Tomaques 🍅')).toBeNull();
  expect(emojiInicial('')).toBeNull();
});

/* Mateix criteri amb i sense Intl.Segmenter (Firefox < 125): un símbol de
   text no és emoji i una seqüència es conserva sencera, mai a mitges. */
const CASOS_EMOJI = [
  ['🗂️ Arxiu', '🗂️'],
  ['🇪🇸 Espanya', '🇪🇸'],
  ['👩‍🌾 Llauradora', '👩‍🌾'],
  ['👍🏽 Bé', '👍🏽'],
  ['1️⃣ Primer pas', '1️⃣'],
  ['© Sóc de Poble', null],
  ['▶ Vídeo', null],
  ['1r pas', null]
];

test.each(CASOS_EMOJI)('emojiInicial(%s) → %s amb segmentador', (text, esperat) => {
  expect(emojiInicial(text)).toBe(esperat);
});

test('emojiInicial sense Intl.Segmenter dona el mateix resultat', async () => {
  vi.stubGlobal('Intl', Object.create(Intl, { Segmenter: { value: undefined } }));
  vi.resetModules();
  try {
    const { emojiInicial: senseSegmentador } = await import('./NavGlyph.jsx');
    for (const [text, esperat] of CASOS_EMOJI) expect(senseSegmentador(text)).toBe(esperat);
    expect(senseSegmentador('🍅 Tomaques')).toBe('🍅');
    expect(senseSegmentador('Tomaques 🍅')).toBeNull();
  } finally {
    vi.unstubAllGlobals();
  }
});
