/**
 * Onada 3 (P2, incidència de producció del Mestre a gentdelatorre.net) · Les
 * imatges pròpies d'una pàgina de text, incrustada en un amfitrió que no és el
 * nostre: el cos (les infografies de /projecte) i la capçalera pengen de la
 * carpeta del paquet; sense amfitrió, tot és com sempre (Llei del Píxel); una
 * URL externa i un data: no es reescriuen mai.
 *
 * L'element <soc-de-poble> fa dues coses quan coneix la base i és d'un altre
 * origen (PedraSecaEmbed.jsx, _aplicaBaseRecursos): la fixa i en permet
 * l'origen al sanejador. Ací es fa el mateix, perquè la prova siga la del
 * camí de veres.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ props: null }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
/* La pàgina, reduïda al que rep: les props (la capçalera) i el cos pintat. */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, ...props }) => {
    mocks.props = props;
    return React.createElement('div', { 'data-pagina': '' }, children);
  }
}));

import TextSection from './TextSection.jsx';
import { PAGE_COPY } from './pageContent.js';
import { fixaBaseRecursos } from '../../config/assetResolver.js';
import { permetOrigenMitjans, sanitizeHtml } from '../../utils/sanitize.js';

const PAQUET = 'https://amfitrio.example/wp-content/plugins/socdepoble-enxufe/dist';
const HERO_RESERVA = '/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png';
const INFOGRAFIES = [1, 2, 3, 4].map((n) => `/assets/img/que-es-socdepoble-${n}.jpg`);

/* Com l'element: la base i, si és d'un altre origen, el permís del sanejador. */
function incrustaEnAmfitrio() {
  fixaBaseRecursos(PAQUET);
  permetOrigenMitjans(PAQUET);
}

const cos = (container) => container.querySelector('[data-pagina] > article.cms-preview');
const srcs = (container) => [...cos(container).querySelectorAll('img')].map((img) => img.getAttribute('src'));

beforeEach(() => { mocks.props = null; });
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

test('sense amfitrió (dev): el cos de /projecte és el sanejat de sempre i les rutes no canvien', () => {
  const { container } = render(<TextSection page={PAGE_COPY.projecte} pageKey="projecte" />);
  expect(cos(container).innerHTML).toBe(sanitizeHtml(PAGE_COPY.projecte.html));
  expect(srcs(container)).toEqual(INFOGRAFIES);
  expect(mocks.props.heroImage).toBe(PAGE_COPY.projecte.image);
});

test('incrustada en un amfitrió: les infografies del cos i la capçalera pengen del paquet', () => {
  incrustaEnAmfitrio();
  const { container } = render(<TextSection page={PAGE_COPY.projecte} pageKey="projecte" />);
  expect(srcs(container)).toEqual(INFOGRAFIES.map((ruta) => `${PAQUET}${ruta}`));
  expect(mocks.props.heroImage).toBe(`${PAQUET}${PAGE_COPY.projecte.image}`);
  // Cap imatge del cos s'ha quedat sense font ni s'ha marcat com a bloquejada.
  expect(cos(container).querySelectorAll('img[data-sdp-bloquejada]')).toHaveLength(0);
});

test('amb amfitrió, una URL externa permesa i un data: passen intactes; només es resol la ruta pròpia', () => {
  incrustaEnAmfitrio();
  const externa = 'https://lh3.googleusercontent.com/a/foto.png';
  const dades = 'data:image/png;base64,AAAA';
  const pagina = {
    title: 'Mescla',
    html: `<p><img src="${externa}" alt="e"><img src="${dades}" alt="d"><img src="/assets/fotos/iaia-maria.png" alt="p"></p>`
  };
  const { container } = render(<TextSection page={pagina} pageKey="mescla" />);
  expect(srcs(container)).toEqual([externa, dades, `${PAQUET}/assets/fotos/iaia-maria.png`]);
});

test('una pàgina sense imatge porta la capçalera de reserva del paquet, no la del servidor de dev', () => {
  const paginaSenseImatge = { title: 'Pàgina sense imatge', html: '<p>Text de prova</p>' };
  render(<TextSection page={paginaSenseImatge} pageKey="sense-imatge" />);
  expect(mocks.props.heroImage).toBe(HERO_RESERVA);
  cleanup();
  incrustaEnAmfitrio();
  render(<TextSection page={paginaSenseImatge} pageKey="sense-imatge" />);
  expect(mocks.props.heroImage).toBe(`${PAQUET}${HERO_RESERVA}`);
});
