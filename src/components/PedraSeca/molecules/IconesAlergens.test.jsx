/* Icones d'al·lèrgens (ordre del Mestre, 261006: «vital per a la Carta
   Digital i el TPV») · la peça: un sol nom accessible amb tots els
   al·lèrgens, les icones decoratives en l'ordre de l'annex II, els
   desconeguts i els repetits fora, la buida sense cap node, les dues mides,
   el «+N» i l'abreviatura quan una icona no es pot pintar. Sense xarxa: cada
   icona és una URI data: del registre. Cap avís de React a la consola. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { IconesAlergens } from './IconesAlergens.jsx';
import { ABREVIATURES, ICONES_ALERGENS, IDS_ALERGENS, PREFIX_URI } from '../recursos/alergens.js';

let errors;
beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  expect(crides).toEqual([]);
});

const pinta = (props) => render(<IconesAlergens {...props} />);
const peca = () => screen.getByRole('img', { name: /^Al·lèrgens: / });
const idsPintats = (arrel) => [...arrel.querySelectorAll('[data-alergen]')].map((element) => element.dataset.alergen);

describe('el nom i les icones', () => {
  test('un sol element amb role="img" i el nom amb tots, en minúscula i en l’ordre de l’annex II', () => {
    pinta({ alergens: ['llet', 'gluten', 'fruits-closca'] });
    expect(peca().getAttribute('aria-label')).toBe('Al·lèrgens: gluten, llet, fruits de closca');
    expect(peca().tagName).toBe('SPAN');
    expect(idsPintats(peca())).toEqual(['gluten', 'llet', 'fruits-closca']);
    /* Les icones són decoratives: dins d'un role="img", cap altra imatge amb nom. */
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  test('cada icona: una <img> 1:1 decorativa amb la URI data: del registre (cap petició)', () => {
    pinta({ alergens: ['gluten', 'sulfits'] });
    const imatges = [...peca().querySelectorAll('img')];
    expect(imatges.map((img) => img.getAttribute('alt'))).toEqual(['', '']);
    expect(imatges.map((img) => img.className)).toEqual(['sdp-alergens__icona', 'sdp-alergens__icona']);
    expect(imatges.map((img) => img.getAttribute('src'))).toEqual([ICONES_ALERGENS.gluten, ICONES_ALERGENS.sulfits]);
    for (const img of imatges) {
      expect(img.getAttribute('src').startsWith(PREFIX_URI)).toBe(true);
      expect(img.getAttribute('decoding')).toBe('async');
    }
    expect(peca().getAttribute('aria-label')).toBe('Al·lèrgens: gluten, diòxid de sofre i sulfits');
  });

  test('els desconeguts i els repetits no es pinten; sense cap conegut, cap node', () => {
    const { container, rerender } = pinta({ alergens: ['ous', 'xocolata', 'ous', 7, null] });
    expect(idsPintats(peca())).toEqual(['ous']);
    expect(peca().getAttribute('aria-label')).toBe('Al·lèrgens: ous');
    for (const buida of [[], ['xocolata'], undefined, null, 'gluten']) {
      rerender(<IconesAlergens alergens={buida} />);
      expect(container.innerHTML, String(buida)).toBe('');
    }
  });

  test('els 14 de la llista canònica tenen icona', () => {
    pinta({ alergens: IDS_ALERGENS });
    expect(IDS_ALERGENS).toHaveLength(14);
    expect(idsPintats(peca())).toEqual([...IDS_ALERGENS]);
    expect(peca().querySelectorAll('img')).toHaveLength(14);
    expect(peca().querySelector('.sdp-alergens__abreviatura')).toBeNull();
  });

  test('l’etiqueta canvia el començament del nom; una de buida torna a «Al·lèrgens»', () => {
    const { rerender } = pinta({ alergens: ['soja'], etiqueta: 'Conté' });
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Conté: soja');
    rerender(<IconesAlergens alergens={['soja']} etiqueta="  " />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Al·lèrgens: soja');
  });
});

describe('la mida i el «+N»', () => {
  test('xicoteta per defecte, mitjana amb la seua classe i una mida desconeguda torna a la xicoteta', () => {
    const { rerender } = pinta({ alergens: ['api'] });
    expect(peca().className).toBe('sdp-alergens');
    rerender(<IconesAlergens alergens={['api']} mida="mitjana" />);
    expect(peca().className).toBe('sdp-alergens sdp-alergens--mitjana');
    rerender(<IconesAlergens alergens={['api']} mida="constructor" />);
    expect(peca().className).toBe('sdp-alergens');
  });

  test('maxim: com a molt tantes peces, «+N» inclòs; el nom els diu tots', () => {
    const tots = ['gluten', 'crustacis', 'ous', 'peix', 'cacauets', 'soja'];
    const { rerender } = pinta({ alergens: tots, maxim: 4 });
    expect(idsPintats(peca())).toEqual(['gluten', 'crustacis', 'ous']);
    expect(peca().querySelector('.sdp-alergens__resta').textContent).toBe('+3');
    expect(peca().lastElementChild.className).toBe('sdp-alergens__resta');
    expect(peca().children).toHaveLength(4);
    expect(peca().getAttribute('aria-label')).toBe('Al·lèrgens: gluten, crustacis, ous, peix, cacauets, soja');
    /* Si hi caben, totes les icones i cap «+N». */
    rerender(<IconesAlergens alergens={tots.slice(0, 4)} maxim={4} />);
    expect(idsPintats(peca())).toEqual(['gluten', 'crustacis', 'ous', 'peix']);
    expect(peca().querySelector('.sdp-alergens__resta')).toBeNull();
    /* Amb una sola peça, només el «+N». */
    rerender(<IconesAlergens alergens={tots.slice(0, 2)} maxim={1} />);
    expect(idsPintats(peca())).toEqual([]);
    expect(peca().textContent).toBe('+2');
  });

  test('maxim que no fa falta o que no és un enter ≥ 1: totes, sense «+N»', () => {
    const { rerender } = pinta({ alergens: ['gluten', 'ous'], maxim: 2 });
    expect(idsPintats(peca())).toEqual(['gluten', 'ous']);
    expect(peca().querySelector('.sdp-alergens__resta')).toBeNull();
    for (const maxim of [0, -1, 2.5, '1', Number.NaN]) {
      rerender(<IconesAlergens alergens={['gluten', 'ous', 'llet']} maxim={maxim} />);
      expect(idsPintats(peca()), String(maxim)).toEqual(['gluten', 'ous', 'llet']);
      expect(peca().querySelector('.sdp-alergens__resta'), String(maxim)).toBeNull();
    }
  });
});

describe('sense xarxa: una icona que no es pot pintar', () => {
  test('deixa el lloc a la seua abreviatura, en el mateix ordre; les altres no canvien', () => {
    pinta({ alergens: ['gluten', 'llet'] });
    fireEvent.error(peca().querySelector('img[data-alergen="gluten"]'));
    const abreviatura = peca().querySelector('[data-alergen="gluten"]');
    expect(abreviatura.tagName).toBe('SPAN');
    expect(abreviatura.className).toBe('sdp-alergens__abreviatura');
    expect(abreviatura.textContent).toBe(ABREVIATURES.gluten);
    expect(idsPintats(peca())).toEqual(['gluten', 'llet']);
    expect(peca().querySelector('[data-alergen="llet"]').tagName).toBe('IMG');
    expect(peca().getAttribute('aria-label')).toBe('Al·lèrgens: gluten, llet');
  });

  test('les abreviatures: una per al·lergen, curtes i diferents', () => {
    expect(Object.keys(ABREVIATURES).sort()).toEqual([...IDS_ALERGENS].sort());
    const valors = Object.values(ABREVIATURES);
    expect(new Set(valors).size).toBe(valors.length);
    for (const valor of valors) expect(valor).toMatch(/^[A-Z]{2}$/);
  });
});
