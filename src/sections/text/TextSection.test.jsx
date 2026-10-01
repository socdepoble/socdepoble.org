/**
 * T71 · Prova d'igualtat de TextSection (Llei del Píxel). Servix set rutes
 * (/projecte, /constitucio, /ia, /roadmap, /versions, /legal i /page/:slug)
 * i fins ara no tenia cap prova: esta fixa, prop per prop, el que rep la
 * UniversalPage i el cos sanejat, perquè extraure'n les props a
 * paginaDeText.js (i compartir-les amb el lector de connexions) no puga
 * canviar cap píxel sense que ho sàpiga ningú.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ props: null, seo: vi.fn(), t: (_, alternativa) => alternativa }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (...args) => mocks.seo(...args) }));
/* La pàgina, reduïda al que rep: les props sense els fills, i els fills pintats. */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, ...props }) => {
    mocks.props = props;
    return React.createElement('div', { 'data-pagina': '' }, children);
  }
}));
import TextSection from './TextSection.jsx';
import { PAGE_COPY } from './pageContent.js';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';

afterEach(cleanup);
beforeEach(() => {
  mocks.props = null;
  mocks.seo.mockClear();
  mocks.t = (_, alternativa) => alternativa;
});

test('L’Ànima de la IAIA (/ia): les props exactes de la UniversalPage i el cos sanejat', () => {
  const pagina = PAGE_COPY.anima;
  const { container } = render(<TextSection page={pagina} pageKey="anima" />);
  expect(mocks.props).toEqual({
    title: "L'Ànima de la IAIA",
    subtitle: pagina.subtitle,
    lead: pagina.lead,
    heroImage: '/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp',
    heroAlt: 'Il·lustració de la IAIA',
    showLogos: true,
    labels: pagina.labels,
    copyright: COPYRIGHT_SDP,
    ...dataHoraDeBarra({ creat: '2026-08-11T00:00:00.000Z' }),
    chrome: 'full',
    topBarData: { showPin: false }
  });
  // T4 del prompt 1140 (ordre del Mestre, 261001) · La data del copy és un
  // instant: la pastilla porta l'hora i el dia locals. L'Ànima encara no té
  // hora de publicació coneguda (anterior al registre de git; capçalera de
  // pageContent.js) i conserva la mitjanit UTC: «02:00» fins que el Mestre la diga.
  expect(mocks.props.date).toBe('11/08/26');
  expect(mocks.props.time).toBe('02:00');
  const cos = container.querySelector('[data-pagina] > article.cms-preview');
  expect(cos.querySelector('h3').textContent).toBe('El Despertar de la Nina de Silici');
  expect(mocks.seo).toHaveBeenCalledWith({
    title: "L'Ànima de la IAIA", description: pagina.subtitle, image: '/assets/system/ui/og-socdepoble-1200x630.png'
  });
});

test('pàgina sense imatge, etiquetes, data ni chrome: les reserves de sempre', () => {
  mocks.t = (clau, alternativa) => (clau === 'section.text.page' ? 'Page' : alternativa);
  const pagina = { title: 'Sense res', lead: 'Només entradilla', html: '<p>Hola</p><script>alert(1)</script>' };
  const { container } = render(<TextSection page={pagina} pageKey="provant" />);
  expect(mocks.props).toEqual({
    title: 'Sense res',
    subtitle: undefined,
    lead: 'Només entradilla',
    heroImage: '/assets/img/hero_panoramic_rural_view_1774720664221.png',
    heroAlt: "Panoràmica d'un poble fictici",
    showLogos: true,
    labels: [
      { text: 'PROVANT', className: 'sdp-badge-system' },
      { text: 'Page', className: 'sdp-badge-category' }
    ],
    copyright: COPYRIGHT_SDP,
    time: '', date: '', dateTime: '',
    chrome: 'full',
    topBarData: { showPin: false }
  });
  // L'HTML passa pel sanejador: el script no arriba al DOM.
  const cos = container.querySelector('article.cms-preview');
  expect(cos.querySelector('script')).toBeNull();
  expect([...cos.children].map((fill) => fill.outerHTML)).toEqual(['<p>Hola</p>']);
  expect(mocks.seo).toHaveBeenCalledWith(expect.objectContaining({ description: 'Només entradilla' }));
});

test('el chrome del copy mana i els fills van davall del text', () => {
  const { container } = render(
    <TextSection page={{ title: 'Legal', html: '<p>Text</p>', chrome: 'context', date: '2026-09-01T10:30:00.000Z' }} pageKey="legal">
      <p className="viu">Tauler</p>
    </TextSection>
  );
  expect(mocks.props.chrome).toBe('context');
  expect(mocks.props).toMatchObject(dataHoraDeBarra({ creat: '2026-09-01T10:30:00.000Z' }));
  const fills = container.querySelector('[data-pagina]').children;
  expect(fills[0].tagName).toBe('ARTICLE');
  expect(fills[1].className).toBe('viu');
  expect(mocks.seo).toHaveBeenCalledWith(expect.objectContaining({ description: 'Sóc de Poble' }));
});
