import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} }),
}));

import { TargetaDelMercat } from './TargetaDelMercat.jsx';
import { propsDeTargetaDeProducte } from './targetaDeProducte.js';
import { buildMercatDetailSectionMeta, portadaDElement } from '../detail/detailSectionMeta.jsx';

/* R22.1 (Gauntlet r221-dades-01/-05, r221-text-03) · Un producte SINTÈTIC amb
   vídeo propi: la infraestructura es prova sense cap fitxa ni mitjà d'un
   negoci real (cap llavor del Mercat no porta vídeo). */
const PORTADA = '/assets/mercat/mel.webp';
const VIDEO = 'https://socdepoble.org/media/mel-romer.mp4';
const PRODUCTE_AMB_VIDEO = Object.freeze({
  id: 'mel-serra-1kg',
  type: 'product',
  title: 'Mel de romer 1 kg',
  subtitle: 'Mel de la serra',
  description: 'Producte sintètic de prova.',
  price: '9,00 €',
  seller: 'Productora sintètica',
  author_name: 'Productora sintètica',
  image_url: PORTADA,
  imageSrc: PORTADA,
  images: Object.freeze([PORTADA]),
  video_url: VIDEO,
  category_slug: 'alimentacio',
  created_at: '2026-11-12T10:00:00.000Z',
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('R22.1 · Peça 1 · Vídeo Principal + Portada estil YouTube en Productes del Mercat', () => {
  test('un producte amb portada i video_url propis pinta <video poster controls playsInline preload="metadata"> a la Card', () => {
    const props = propsDeTargetaDeProducte(PRODUCTE_AMB_VIDEO);
    expect(props.imageUrl).toBe(PORTADA);
    expect(props.videoUrl).toBe(VIDEO);

    const { container } = render(<TargetaDelMercat item={PRODUCTE_AMB_VIDEO} />);
    const contenidorMitja = container.querySelector('.sp-card-media-container--video');
    expect(contenidorMitja).toBeTruthy();
    const video = contenidorMitja.querySelector('video.sp-card-media--video');
    expect(video).toBeTruthy();
    expect(video.getAttribute('src')).toBe(VIDEO);
    expect(video.getAttribute('poster')).toBe(PORTADA);
    expect(video.hasAttribute('controls')).toBe(true);
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.getAttribute('preload')).toBe('metadata');
  });

  test('qualsevol producte amb video_url propi pinta el reproductor a la Card i al Hero de la fitxa (portadaDElement), i rebutja URLs externes', () => {
    const productePropi = { ...PRODUCTE_AMB_VIDEO };
    const { container } = render(<TargetaDelMercat item={productePropi} />);
    const videoCard = container.querySelector('video.sp-card-media--video');
    expect(videoCard).toBeTruthy();
    expect(videoCard.getAttribute('src')).toBe('https://socdepoble.org/media/mel-romer.mp4');
    expect(videoCard.getAttribute('poster')).toBe('/assets/mercat/mel.webp');

    const t = (_, alt) => alt;
    const seccioMercat = buildMercatDetailSectionMeta({ marketItems: [productePropi], t });
    const portadaDetall = portadaDElement(
      seccioMercat,
      productePropi,
      { title: productePropi.title, heroImage: productePropi.image_url },
      t,
    );
    expect(portadaDetall?.topBarData?.heroComponent).toBeTruthy();
    const heroRender = render(portadaDetall.topBarData.heroComponent);
    const videoHero = heroRender.container.querySelector('.sdp-hero-video > video.sdp-hero-video__player');
    expect(videoHero).toBeTruthy();
    expect(videoHero.getAttribute('src')).toBe('https://socdepoble.org/media/mel-romer.mp4');
    expect(videoHero.getAttribute('poster')).toBe('/assets/mercat/mel.webp');
    expect(videoHero.hasAttribute('controls')).toBe(true);
    expect(videoHero.hasAttribute('playsinline')).toBe(true);
    expect(videoHero.getAttribute('preload')).toBe('metadata');

    cleanup();
    const producteExtern = {
      ...productePropi,
      video_url: 'https://cdn-extern.exemple.com/espia.mp4',
    };
    expect(propsDeTargetaDeProducte(producteExtern).videoUrl).toBeUndefined();
    const cardExterna = render(<TargetaDelMercat item={producteExtern} />);
    expect(cardExterna.container.querySelector('video')).toBeNull();
    const portadaExterna = portadaDElement(
      seccioMercat,
      producteExtern,
      { title: producteExtern.title, heroImage: producteExtern.image_url },
      t,
    );
    const heroExtern = render(portadaExterna.topBarData.heroComponent);
    expect(heroExtern.container.querySelector('video')).toBeNull();
    expect(cardExterna.container.querySelector('img.sp-card-media')?.getAttribute('src')).toBe('/assets/mercat/mel.webp');
  });
});
