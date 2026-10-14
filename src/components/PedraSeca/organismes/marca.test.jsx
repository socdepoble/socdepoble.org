/**
 * marca.jsx · XAT-02 (ordre del Mestre, 261014, pla 261014_0210).
 *   · fontSegura: una referència opaca dels mitjans ('sdp-media://…', també
 *     amb espais davant) no és cap font. El navegador no la sap carregar
 *     (ERR_UNKNOWN_URL_SCHEME): torna null i qui pinta hi posa el substitut.
 *   · El camí real: el logotip d'una organització es desa com a referència
 *     opaca, i el TPV el pintava tal qual a la capçalera del tiquet.
 *   · La resta de fonts, igual que abans (Llei del Píxel).
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { fontSegura, pintaQuadrat } from './marca.jsx';
import { UniversalTPV } from './UniversalTPV.jsx';
import { fixaBaseRecursos } from '../../../config/assetResolver.js';
import { permetOrigenMitjans } from '../../../utils/sanitize.js';

const PAQUET = 'https://paquet-marca.example/wp-content/plugins/socdepoble-enxufe/dist';
const MITJANS = 'https://mitjans-marca.example';
const REFS = [
  'sdp-media://mitjans/poble/u/organitzacions/logo.webp',
  'sdp-media://mitjans_privats/poble/u/notes/foto.webp',
  '  sdp-media://mitjans/poble/u/organitzacions/logo.webp',
  /* C4-XAT-03 (Codex, 261014_0235) · L'esquema no distingix majúscules, com el filtre de sanitize.js (/i). */
  'SDP-MEDIA://mitjans/poble/u/organitzacions/logo.webp',
  'sDp-MeDiA://mitjans_privats/poble/u/notes/foto.webp'
];

afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

test('fontSegura: una referència sdp-media:// no és cap font, amb base o sense', () => {
  for (const base of ['/', PAQUET]) {
    fixaBaseRecursos(base);
    for (const ref of REFS) expect(fontSegura(ref), ref).toBeNull();
  }
});

test('fontSegura: les fonts vàlides, com abans; les insegures i el buit, null com sempre', () => {
  permetOrigenMitjans(MITJANS);
  const valides = ['/assets/bar/cafe.webp', 'data:image/png;base64,iVBORw0KGgo=', `${MITJANS}/storage/v1/object/public/mitjans/f.webp`];
  for (const valor of valides) expect(fontSegura(valor), valor).toBe(valor);
  for (const valor of ['javascript:alert(1)', 'https://rastreig-marca.example/p.gif', 'blob:https://x/1', '', null, undefined, 42]) {
    expect(fontSegura(valor), String(valor)).toBeNull();
  }
  /* Amb la base del paquet, un recurs propi continua penjant del paquet. */
  fixaBaseRecursos(PAQUET);
  permetOrigenMitjans(PAQUET);
  expect(fontSegura('/assets/bar/cafe.webp')).toBe(`${PAQUET}/assets/bar/cafe.webp`);
});

test('pintaQuadrat: amb una referència sdp-media://, la marca de l’article; amb una foto vàlida, la foto', () => {
  for (const ref of REFS) {
    const { container } = render(pintaQuadrat({ nom: 'Mel de romer', imatge: ref }, null));
    expect(container.querySelector('img'), ref).toBeNull();
    expect(container.querySelector('.sdp-marca-article__inicials').textContent).toBe('MD');
    cleanup();
  }
  const { container } = render(pintaQuadrat({ nom: 'Mel de romer', imatge: '/assets/mercat/mel.webp' }, null));
  const img = container.querySelector('img.sdp-marca-article__imatge');
  expect(img.getAttribute('src')).toBe('/assets/mercat/mel.webp');
  expect(container.querySelector('.sdp-marca-article')).toBeNull();
});

/* El TPV mínim: la capçalera del tiquet porta la marca de l'organització. */
const tpv = (marca) => (
  <UniversalTPV
    etiqueta="TPV de prova"
    marca={marca}
    tiquet={{ titol: 'Tiquet', comptador: 0, linies: [], total: { etiqueta: 'Total', valor: '0,00 €' }, buit: { titol: 'El tiquet és buit' } }}
    accions={{ principal: { text: 'Cobra', valor: '0,00 €', onClick: () => {} } }}
    cataleg={{ categories: [], articles: [], onTria: () => {}, buit: { titol: 'La carta és buida' } }}
  />
);

test('el TPV: un logotip sdp-media:// pinta les inicials de la marca, cap <img>; un de vàlid, el logotip', () => {
  for (const ref of REFS) {
    const { container } = render(tpv({ nom: 'Bar de la Plaça', logotip: ref }));
    expect(container.querySelector('.sdp-tpv__marca img'), ref).toBeNull();
    expect(container.querySelector('.sdp-tpv__marca').textContent).toBe('BD');
    cleanup();
  }
  const { container } = render(tpv({ nom: 'Bar de la Plaça', logotip: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' }));
  expect(container.querySelector('.sdp-tpv__marca > img.sdp-tpv__logotip').getAttribute('src')).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd.svg');
});
