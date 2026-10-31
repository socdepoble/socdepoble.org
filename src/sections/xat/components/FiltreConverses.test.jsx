/* P1-36 (decisió 3 del Mestre, 261028; deroga el desplegable de T12 i de
   261026_2126) · Els filtres de la llista de converses són una fila
   horitzontal de píndoles: un grup amb nom i un botó amb aria-pressed per
   filtre, cada un de --sdp-touch d'alt (Llei de Vida). Cap menú. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import FiltreConverses from './FiltreConverses.jsx';

const t = (_, alternativa) => alternativa;
const OPCIONS = [
  ['tot', 'section.xat.filtres.tot', 'Tot'],
  ['noLlegits', 'section.xat.filtres.noLlegits', 'No llegits'],
  ['preferits', 'section.xat.filtres.preferits', 'Preferits'],
  ['grups', 'section.xat.filtres.grups', 'Grups']
];
afterEach(cleanup);

test('un grup amb nom i un botó amb aria-pressed per filtre; la triada és la premuda', () => {
  const onTria = vi.fn();
  render(<FiltreConverses opcions={OPCIONS} filtre="preferits" onTria={onTria} t={t} />);
  const grup = screen.getByRole('group', { name: 'Filtra les converses' });
  expect(grup.classList.contains('sdp-xat-pindoles')).toBe(true);
  const botons = within(grup).getAllByRole('button');
  expect(botons.map((b) => [b.textContent, b.getAttribute('aria-pressed'), b.getAttribute('type')])).toEqual([
    ['Tot', 'false', 'button'], ['No llegits', 'false', 'button'], ['Preferits', 'true', 'button'], ['Grups', 'false', 'button']
  ]);
  expect(grup.querySelector('[aria-haspopup], [role="menu"], [role="menuitemradio"]')).toBeNull();
  fireEvent.click(botons[1]);
  expect(onTria).toHaveBeenCalledWith('noLlegits');
  fireEvent.click(botons[2]);
  expect(onTria).toHaveBeenLastCalledWith('preferits');
});

/* Gauntlet 261030 (cicle 3) · La lupa anomena el grup a aria-controls, i
   Escape des d'una píndola arriba a qui la munta (XatSection). */
test('el grup porta l’id que li passen i el teclat de les píndoles arriba a onKeyDown', () => {
  const onKeyDown = vi.fn();
  render(<FiltreConverses opcions={OPCIONS} filtre="tot" onTria={() => {}} onKeyDown={onKeyDown} idGrup="pindoles-de-prova" t={t} />);
  const grup = screen.getByRole('group', { name: 'Filtra les converses' });
  expect(grup.id).toBe('pindoles-de-prova');
  fireEvent.keyDown(within(grup).getByRole('button', { name: 'Grups' }), { key: 'Escape' });
  expect(onKeyDown).toHaveBeenCalledTimes(1);
  expect(onKeyDown.mock.calls[0][0].key).toBe('Escape');
});

test('el nom del grup i de cada píndola passen per t()', () => {
  const tradueix = (clau) => `«${clau}»`;
  render(<FiltreConverses opcions={OPCIONS} filtre="tot" onTria={() => {}} t={tradueix} />);
  const grup = screen.getByRole('group', { name: '«section.xat.filtres.etiqueta»' });
  expect(within(grup).getAllByRole('button').map((b) => b.textContent)).toEqual(OPCIONS.map(([, clau]) => `«${clau}»`));
});

/* jsdom no pinta: es comproven les regles escrites i el contrast dels tokens
   (els hex de tokens.css, primer el tema clar i després el fosc). */
const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const MODULS = llig('src/css/modules.css').replace(/\/\*[\s\S]*?\*\//g, '');
const TOKENS = llig('src/css/tokens.css');
/** Les declaracions d'un selector exacte de modules.css (l'última guanya). */
function regla(selector) {
  const net = (text) => text.replace(/\s+/g, ' ').trim();
  const eixida = {};
  for (const m of MODULS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!net(m[1]).split(',').map(net).includes(selector)) continue;
    for (const declaracio of m[2].split(';')) {
      const [prop, ...resta] = declaracio.split(':');
      if (prop?.trim()) eixida[net(prop)] = net(resta.join(':'));
    }
  }
  return eixida;
}
const declaracions = (nom) => [...TOKENS.matchAll(new RegExp(`${nom}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].trim());
function hexDe(valor) {
  let v = valor;
  for (let i = 0; i < 6 && v.startsWith('var('); i += 1) v = declaracions(v.slice(4, -1).trim())[0];
  return v;
}
function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [clar, fosc] = [lum(hexDe(a)), lum(hexDe(b))].sort((x, y) => y - x);
  return (clar + 0.05) / (fosc + 0.05);
}

test('la fila de píndoles es desplaça en horitzontal amb el coixí de la cerca, i cada píndola fa --sdp-touch d’alt', () => {
  expect(regla('.sdp-xat-pindoles')).toMatchObject({
    display: 'flex',
    'overflow-x': 'auto',
    gap: 'var(--sdp-space-2)',
    padding: 'var(--sdp-space-2) var(--sdp-space-3)',
    background: 'var(--sdp-fons-targeta)'
  });
  /* El mateix coixí que .sdp-xat-cerca: obrir la lupa no canvia l'alçada de la fila. */
  expect(regla('.sdp-xat-cerca').padding).toBe(regla('.sdp-xat-pindoles').padding);
  /* Revisió adversarial (P1-36) · I la mateixa alçada de dins: el camp fa
     --sdp-touch (l'etiqueta) més la seua vora, sense coixí vertical; la
     píndola (border-box, base.css) l'ha de dur sumada. Amb var(--sdp-touch)
     a seques, la fila de píndoles feia 2px menys i la llista botava en cada
     obrir i plegar de la lupa. */
  const camp = regla('.sdp-xat-cerca__camp');
  const boto = regla('.sdp-xat-pindoles__boto');
  expect(camp.border).toBe('1px solid transparent');
  expect(boto.border).toBe(camp.border);
  expect(camp.padding.split(' ')[0]).toBe('0');
  expect(boto.padding.split(' ')[0]).toBe('0');
  expect(regla('.sdp-xat-cerca__etiqueta')['min-height']).toBe('var(--sdp-touch)');
  expect(boto['box-sizing']).toBeUndefined();
  expect(boto['min-block-size']).toBe(`calc(var(--sdp-touch) + ${2 * parseInt(camp.border, 10)}px)`);
  expect(boto).toMatchObject({
    flex: 'none',
    'white-space': 'nowrap',
    'border-radius': 'var(--sdp-radi-pastilla)',
    background: 'var(--sdp-fons-subtil)'
  });
  expect(regla('.sdp-xat-pindoles__boto[aria-pressed="true"]')).toMatchObject({
    background: 'var(--sdp-accio-subtil)',
    color: 'var(--sdp-accio-text)',
    'border-color': 'var(--sdp-accio-text)'
  });
  expect(declaracions('--sdp-touch')).toEqual(['48px']);
  /* Tokens només: cap hex cru a les regles noves. */
  for (const selector of ['.sdp-xat-pindoles', '.sdp-xat-pindoles__boto', '.sdp-xat-pindoles__boto[aria-pressed="true"]', '.sdp-xat-lupa[aria-expanded="true"]']) {
    expect(Object.values(regla(selector)).join(' '), selector).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  }
  /* El desplegable derogat no deixa regles. */
  expect(MODULS).not.toMatch(/\.sdp-xat-filtre(?![\w-])|\.sdp-xat-filtre__|\.sdp-xat-menu__buit/);
});

test('el text de la píndola, premuda o no, passa AA, i la vora de la premuda fa 3:1 sobre la fila, en clar i en fosc', () => {
  const [subtil, cos, accioSubtil, accioText, targeta] = ['--sdp-fons-subtil', '--sdp-text-cos', '--sdp-accio-subtil', '--sdp-accio-text', '--sdp-fons-targeta'].map(declaracions);
  for (const tema of [0, 1]) {
    expect(contrast(cos[tema], subtil[tema])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(accioText[tema], accioSubtil[tema])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(accioText[tema], targeta[tema])).toBeGreaterThanOrEqual(3);
  }
});
