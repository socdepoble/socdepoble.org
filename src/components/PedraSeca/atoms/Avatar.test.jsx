/**
 * Avatar · base dels recursos (T5, 261001).
 *
 * Incrustat a gentdelatorre.net, el xat demanava '/assets/fotos/iaia-maria.png'
 * i el logo de la comunitat a l'arrel de l'amfitrió (404): l'àtom pintava el
 * src tal qual. Ara un recurs propi es resol amb la base del paquet abans del
 * filtre de seguretat. Sense base, el DOM ha de ser el de sempre (Llei del
 * Píxel).
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { Avatar, toDeLlavor } from './Avatar.jsx';
import { fixaBaseRecursos } from '../../../config/assetResolver.js';
import { permetOrigenMitjans } from '../../../utils/sanitize.js';

const IAIA = '/assets/fotos/iaia-maria.png';
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
/* El connector de WordPress declara plugin-url en el mateix origen que la
   pàgina: és la base que l'element <soc-de-poble> fixa allà. */
const PAQUET = `${window.location.origin}/wp-content/plugins/socdepoble-enxufe/dist`;
const CAMI = '/wp-content/plugins/socdepoble-enxufe/dist';

afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

const srcDe = (props) => {
  const { container } = render(<Avatar nom="IAIA MarIA" {...props} />);
  const img = container.querySelector('img.sdp-avatar__imatge');
  const resultat = img ? img.getAttribute('src') : null;
  cleanup();
  return resultat;
};

test('sense base, el src propi es pinta idèntic i el DOM no canvia (Llei del Píxel)', () => {
  const { container } = render(<Avatar nom="IAIA MarIA" src={IAIA} mida="sm" llavor="iaia" alt="" />);
  expect(container.innerHTML).toBe(
    `<span class="sdp-avatar sdp-avatar--sm sdp-avatar--to-${toDeLlavor('iaia')}" title="IAIA MarIA">`
    + `<img class="sdp-avatar__imatge" src="${IAIA}" alt="" loading="lazy" referrerpolicy="no-referrer"></span>`
  );
  cleanup();
  expect(srcDe({ src: LOGO })).toBe(LOGO);
});

test('amb la base del paquet, la IAIA i el logo de la comunitat pengen del paquet', () => {
  fixaBaseRecursos(PAQUET);
  expect(srcDe({ src: IAIA })).toBe(`${PAQUET}${IAIA}`);
  expect(srcDe({ src: LOGO })).toBe(`${PAQUET}${LOGO}`);
  // Amb una base-camí (mateix origen, sense esquema), igual.
  fixaBaseRecursos(CAMI);
  expect(srcDe({ src: IAIA })).toBe(`${CAMI}${IAIA}`);
});

test('un valor ja resolt no es torna a prefixar', () => {
  fixaBaseRecursos(PAQUET);
  expect(srcDe({ src: `${PAQUET}${IAIA}` })).toBe(`${PAQUET}${IAIA}`);
  fixaBaseRecursos(CAMI);
  expect(srcDe({ src: `${CAMI}${IAIA}` })).toBe(`${CAMI}${IAIA}`);
});

test('amb base, https:, data:, sdp-media:// i els camins que no són /assets/ queden intactes', () => {
  fixaBaseRecursos(PAQUET);
  const intactes = [
    'https://lh3.googleusercontent.com/a/foto.jpg',
    'data:image/png;base64,AAAA',
    'sdp-media://mitjans/u/cara.jpg',
    '/altres/foto.png'
  ];
  for (const valor of intactes) expect(srcDe({ src: valor })).toBe(valor);
});

test('sense src, o amb una font insegura, les inicials; la base no ho canvia', () => {
  fixaBaseRecursos(PAQUET);
  for (const src of [null, undefined, '', 'javascript:alert(1)']) {
    const { container } = render(<Avatar nom="IAIA MarIA" src={src} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]').textContent).toBe('IM');
    cleanup();
  }
});

/* D'un altre origen, el filtre de sanitize.js només l'admet si l'element
   <soc-de-poble> l'ha registrat (PedraSecaEmbed.jsx, permetOrigenMitjans).
   Origen propi d'esta prova: no contamina cap altre cas del fitxer. */
test('una base d’un altre origen: sense registrar, inicials; registrada com fa l’element, la imatge resolta', () => {
  const ALIE = 'https://paquet.example/wp-content/plugins/socdepoble-enxufe/dist';
  fixaBaseRecursos(ALIE);
  expect(srcDe({ src: IAIA })).toBeNull();
  permetOrigenMitjans(ALIE);
  expect(srcDe({ src: IAIA })).toBe(`${ALIE}${IAIA}`);
});
