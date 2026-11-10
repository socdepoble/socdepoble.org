/**
 * P0-80 / IDEA-211 (llei del Mestre, 09-11-2026: ENQUADRAMENT NO DESTRUCTIU) ·
 * El pintor del marc. Una foto amb #sdp-crop= es demana sense el fragment i,
 * en carregar, porta object-fit, object-position, scale i clip-path per
 * propietats pròpies (cap style en JSX); una sense fragment, el DOM de
 * sempre. jsdom no carrega imatges ni fa maquetació: naturalWidth,
 * naturalHeight, clientWidth i clientHeight es definixen a l'element i el
 * load es dispara a mà.
 */
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../app/contexts/RouterContext';
import { posicioDeRetall } from '../components/universal/enquadrament/enquadrament.js';
import { ambEnquadrament, posicioEnCaixa, retallCssDelZoom } from '../utils/enquadramentUrl.js';
import { ambClassesDelMarc, proporcioVisible, useEnquadramentDeImatge } from './useEnquadramentDeImatge.js';

vi.mock('../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));

import { UniversalCard } from '../components/PedraSeca/organismes/UniversalCard.jsx';
import { ImatgeDePortada } from '../components/universal/PageFrame.jsx';

afterEach(cleanup);

const BASE = '/assets/fotos/plaça.webp';
const MARC = { format: '16:9', zoom: 1.5, cx: 0.4, cy: 0.6 };
const AMB_MARC = ambEnquadrament(BASE, MARC);

function Imatge({ src, caixa, onLoad }) {
  const pintor = useEnquadramentDeImatge(src, { caixa, onLoad });
  return <img ref={pintor.ref} src={pintor.src} alt="" className={ambClassesDelMarc('caixa', pintor.className)} onLoad={pintor.onLoad} />;
}

/* La foto i la caixa, com les diria el navegador. */
function carrega(img, { amplada, alcada, ample = 0, alt = 0 }) {
  for (const [nom, valor] of [['naturalWidth', amplada], ['naturalHeight', alcada], ['clientWidth', ample], ['clientHeight', alt]]) {
    Object.defineProperty(img, nom, { configurable: true, value: valor });
  }
  act(() => { fireEvent.load(img); });
}
const propietats = (img) => Object.fromEntries(['--enquadrament-x', '--enquadrament-y', '--enquadrament-zoom', '--enquadrament-retall', '--enquadrament-forma']
  .map((nom) => [nom, img.style.getPropertyValue(nom)]));

describe('sense fragment, la imatge de sempre', () => {
  test.each(['mesura', 'marc'])('caixa %s: el mateix src, cap classe, cap style ni després de carregar; l’onLoad de la peça', (caixa) => {
    const onLoad = vi.fn();
    const { container } = render(<Imatge src={BASE} caixa={caixa} onLoad={onLoad} />);
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toBe(BASE);
    expect(img.className).toBe('caixa');
    carrega(img, { amplada: 2000, alcada: 1000, ample: 300, alt: 300 });
    expect(img.className).toBe('caixa');
    expect(img.hasAttribute('style')).toBe(false);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });
});

describe('amb el marc al fragment', () => {
  test('caixa mesurada (la targeta, ancorada dalt): es demana la base i, en carregar, el que ensenyava el retall', () => {
    const onLoad = vi.fn();
    const { container } = render(<Imatge src={AMB_MARC} caixa="mesura" onLoad={onLoad} />);
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toBe(BASE);
    // Abans de carregar, res: la caixa encara diu el seu ancoratge.
    expect(img.className).toBe('caixa');
    img.style.objectPosition = '50% 0%';
    carrega(img, { amplada: 4000, alcada: 3000, ample: 320, alt: 320 });
    const punt = posicioEnCaixa(MARC, 4 / 3, 1, { alineacio: { x: 0.5, y: 0 } });
    expect(img.className).toBe('caixa sdp-imatge-enquadrada');
    expect(propietats(img)).toEqual({
      '--enquadrament-x': `${punt.x}%`, '--enquadrament-y': `${punt.y}%`, '--enquadrament-zoom': String(punt.zoom),
      '--enquadrament-retall': retallCssDelZoom(punt), '--enquadrament-forma': '',
    });
    expect(punt.zoom).toBeGreaterThan(1);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  test('caixa del marc (la portada): la classe de la forma i, en carregar, la proporció del marc i el marc sencer', () => {
    const { container } = render(<Imatge src={AMB_MARC} caixa="marc" />);
    const img = container.querySelector('img');
    expect(img.className).toBe('caixa sdp-imatge-enquadrada sdp-imatge-enquadrada--marc');
    expect(img.hasAttribute('style')).toBe(false);
    carrega(img, { amplada: 4000, alcada: 3000 });
    const punt = posicioDeRetall(MARC, 4 / 3);
    expect(propietats(img)).toMatchObject({
      '--enquadrament-x': `${punt.x}%`, '--enquadrament-y': `${punt.y}%`, '--enquadrament-zoom': String(punt.zoom), '--enquadrament-forma': '1.7778',
    });
  });

  test('una foto nova torna a començar: cap propietat de l’anterior', () => {
    const { container, rerender } = render(<Imatge src={AMB_MARC} caixa="marc" />);
    const img = container.querySelector('img');
    carrega(img, { amplada: 4000, alcada: 3000 });
    expect(img.style.getPropertyValue('--enquadrament-x')).not.toBe('');
    rerender(<Imatge src={ambEnquadrament('/assets/fotos/altra.webp', MARC)} caixa="marc" />);
    expect(img.getAttribute('src')).toBe('/assets/fotos/altra.webp');
    expect(img.hasAttribute('style') && img.getAttribute('style') !== '').toBe(false);
  });
});

/* Trobat a Chrome amb el flux de veres (Bloc de notes): la capçalera de
   l'editor desmunta l'<img> mentre s'edita i en munta una de nova amb la
   mateixa foto. El marc ha d'anar al node nou, sense esperar cap load. */
function Remuntable({ src, mostra }) {
  const pintor = useEnquadramentDeImatge(src, { caixa: 'marc' });
  return mostra ? <img ref={pintor.ref} src={pintor.src} alt="" className={ambClassesDelMarc(pintor.className)} onLoad={pintor.onLoad} /> : <span>editant</span>;
}

describe('una imatge que es torna a muntar', () => {
  test('el node nou porta el marc de seguida, amb la mateixa foto', () => {
    const { container, rerender } = render(<Remuntable src={AMB_MARC} mostra />);
    carrega(container.querySelector('img'), { amplada: 4000, alcada: 3000 });
    const abans = propietats(container.querySelector('img'));
    expect(abans['--enquadrament-forma']).toBe('1.7778');
    rerender(<Remuntable src={AMB_MARC} mostra={false} />);
    rerender(<Remuntable src={AMB_MARC} mostra />);
    const nova = container.querySelector('img');
    expect(propietats(nova)).toEqual(abans);
  });
});

describe('proporcioVisible · la forma que es veu decidix si una portada és vertical', () => {
  test('la del marc si n’hi ha; si no, la de la foto', () => {
    expect(proporcioVisible(ambEnquadrament(BASE, { format: '9:16', zoom: 1, cx: 0.5, cy: 0.5 }), 4000, 3000)).toBeCloseTo(9 / 16);
    expect(proporcioVisible(ambEnquadrament(BASE, { format: 'original', zoom: 2, cx: 0.5, cy: 0.5 }), 4000, 3000)).toBeCloseTo(4 / 3);
    expect(proporcioVisible(BASE, 3000, 4000)).toBeCloseTo(3 / 4);
  });
});

describe('les vistes que pinten la capçalera', () => {
  const pintaTargeta = (props) => render(
    <MemoryRouter rutaInicial="/mur">
      <UniversalCard title="La plaça" imageAlt="La plaça" mainHref="/mur/placa" {...props} />
    </MemoryRouter>,
  );

  test('la targeta universal: sense fragment, l’<img> de sempre; amb, la base i el marc en carregar', () => {
    const { container } = pintaTargeta({ imageUrl: BASE });
    expect(container.querySelector('.sp-card-media-container').innerHTML).toBe(`<img class="sp-card-media" src="${BASE}" alt="La plaça" loading="lazy" decoding="async">`);
    cleanup();
    const amb = pintaTargeta({ imageUrl: AMB_MARC });
    const img = amb.container.querySelector('img.sp-card-media');
    expect(img.getAttribute('src')).toBe(BASE);
    carrega(img, { amplada: 4000, alcada: 3000, ample: 300, alt: 300 });
    expect(img.classList.contains('sdp-imatge-enquadrada')).toBe(true);
    expect(img.style.getPropertyValue('--enquadrament-zoom')).not.toBe('');
  });

  test('la targeta 16:9 del Mur sense punt focal propi pinta el marc de la foto; amb punt focal, mana el punt', () => {
    const { container } = pintaTargeta({ imageUrl: AMB_MARC, formaMitja: '16:9' });
    const img = container.querySelector('img.sp-card-media');
    expect(img.getAttribute('src')).toBe(BASE);
    carrega(img, { amplada: 4000, alcada: 3000 });
    const delMarc = posicioEnCaixa(MARC, 4 / 3, 16 / 9);
    expect(['--targeta-mitja-x', '--targeta-mitja-y', '--targeta-mitja-zoom'].map((n) => img.style.getPropertyValue(n)))
      .toEqual([`${delMarc.x}%`, `${delMarc.y}%`, String(delMarc.zoom)]);
    cleanup();
    const punt = { cx: 0.5, cy: 0.2, zoom: 1 };
    const amb = pintaTargeta({ imageUrl: AMB_MARC, formaMitja: '16:9', posicioMitja: punt });
    const img2 = amb.container.querySelector('img.sp-card-media');
    carrega(img2, { amplada: 4000, alcada: 3000 });
    expect(img2.style.getPropertyValue('--targeta-mitja-y')).toBe(`${posicioDeRetall(punt, 4 / 3).y}%`);
  });

  test('la portada de la fitxa (ImatgeDePortada): la base, la forma del marc i l’onLoad de la pàgina', () => {
    const onLoad = vi.fn();
    const { container } = render(<ImatgeDePortada src={AMB_MARC} alt="La plaça" onLoad={onLoad} />);
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toBe(BASE);
    expect(img.className).toBe('sdp-imatge-enquadrada sdp-imatge-enquadrada--marc');
    carrega(img, { amplada: 4000, alcada: 3000 });
    expect(img.style.getPropertyValue('--enquadrament-forma')).toBe('1.7778');
    expect(onLoad).toHaveBeenCalledTimes(1);
    cleanup();
    const sense = render(<ImatgeDePortada src={BASE} alt="La plaça" />);
    expect(sense.container.innerHTML).toBe(`<img alt="La plaça" src="${BASE}">`);
  });
});
