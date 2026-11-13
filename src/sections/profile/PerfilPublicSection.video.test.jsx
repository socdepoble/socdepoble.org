/**
 * R22.1 (Gauntlet R22.1, r221-text-10) · EL VÍDEO PROTAGONISTA DE LA FITXA
 * PÚBLICA, PROVAT DE VERES.
 * src/data/supabase/perfilVideoPortada.r22_1.test.jsx anunciava les fitxes «d'Empresa, Persona
 * i Entitat», però no pintava mai FitxaPublica: el heroComponent <video> de
 * PerfilPublicSection.jsx i la resolució de vídeo i portada sdp-media:// pel
 * port (useResolvedAsset) no tenien cap prova. Ací es pinta la fitxa amb els
 * mateixos dobles que PerfilPublicSection.capcalera.test.jsx, i la
 * UniversalPage simulada pinta el heroComponent que rep (com PageFrame).
 * El que es prova: un vídeo propi (Node 0 o sdp-media:// resolt) ix amb la
 * foto de capçalera de portada; un vídeo de fora no ix.
 * Gauntlet R22.1 · Fitxes SINTÈTIQUES: cap nom ni descripció d'un negoci real.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  id: 'cooperativa-sintetica', navigate: vi.fn(), load: vi.fn(), renders: [], capacitats: new Set(['directori']), resol: vi.fn(),
  t: (_, alternativa) => alternativa, identitat: { memberships: [], actor: null, setActor: vi.fn() },
  ui: { externalConfig: {} }
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useLocation: () => ({ search: '' }),
  useParams: () => ({ agentId: mocks.id }),
  useNavigate: () => mocks.navigate
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => mocks.ui
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  loadPerfilPublic: (...args) => mocks.load(...args),
  resolveAsset: (...args) => mocks.resol(...args)
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    mocks.renders.push(props);
    return (
      <>
        <header className="page-title"><h1>{props.title}</h1></header>
        {props.topBarData?.heroComponent ? <div className="hero-image">{props.topBarData.heroComponent}</div> : null}
      </>
    );
  }
}));
import PerfilPublicSection from './PerfilPublicSection.jsx';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';

const PORTADA = 'https://socdepoble.cat/media/portada-sintetica-16x9.webp';
const VIDEO = 'https://socdepoble.cat/media/video-sintetic.mp4';
const BASE = {
  tipus: 'entitat', id: 'o-cooperativa-sintetica', slug: 'cooperativa-sintetica', nom: 'Cooperativa Sintètica', avatar: '', hero: PORTADA, lema: '',
  bio: 'Text sintètic', presentacioHtml: '', poble: 'Poble sintètic', esIA: false, publicat: true, propietari: false, copyright: ''
};
const reproductor = (container) => container.querySelector('.hero-image > .sdp-hero-video > video.sdp-hero-video__player');

beforeEach(() => {
  vi.clearAllMocks();
  mocks.renders = [];
  mocks.capacitats = new Set(['directori']);
  oblidaEntitatDelProjecte();
});
afterEach(cleanup);

test('una entitat amb vídeo del Node 0: <video> amb la foto de capçalera de portada, controls i sense descarregar-lo sencer', async () => {
  mocks.load.mockResolvedValue({ ...BASE, heroVideo: VIDEO });
  const { container } = render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Cooperativa Sintètica' });
  const video = reproductor(container);
  expect(video).toBeTruthy();
  expect(video.getAttribute('src')).toBe(VIDEO);
  expect(video.getAttribute('poster')).toBe(PORTADA);
  expect(video.hasAttribute('controls')).toBe(true);
  expect(video.hasAttribute('playsinline')).toBe(true);
  expect(video.getAttribute('preload')).toBe('metadata');
});

test('una persona amb vídeo i portada sdp-media://: tots dos passen pel port i ixen resolts', async () => {
  mocks.id = 'pepa';
  mocks.capacitats = new Set(['directori', 'mitjans']);
  const RESOLTS = {
    'sdp-media://mitjans/u/pepa/spot.mp4': 'https://socdepoble.org/media/u/pepa/spot.mp4',
    'sdp-media://mitjans/u/pepa/portada.webp': 'https://socdepoble.org/media/u/pepa/portada.webp',
  };
  mocks.resol.mockImplementation(async (ref) => RESOLTS[ref] ?? '');
  mocks.load.mockResolvedValue({
    ...BASE, tipus: 'persona', id: 'u-pepa', slug: 'pepa', nom: 'Pepa Garcia',
    hero: 'sdp-media://mitjans/u/pepa/portada.webp', heroVideo: 'sdp-media://mitjans/u/pepa/spot.mp4',
  });
  const { container } = render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Pepa Garcia' });
  await vi.waitFor(() => expect(reproductor(container)?.getAttribute('src')).toBe(RESOLTS['sdp-media://mitjans/u/pepa/spot.mp4']));
  await vi.waitFor(() => expect(reproductor(container).getAttribute('poster')).toBe(RESOLTS['sdp-media://mitjans/u/pepa/portada.webp']));
  expect(mocks.resol).toHaveBeenCalledWith('sdp-media://mitjans/u/pepa/spot.mp4', expect.anything());
  expect(mocks.resol).toHaveBeenCalledWith('sdp-media://mitjans/u/pepa/portada.webp', expect.anything());
});

test('un vídeo d’un altre servidor no ix: cap <video> ni heroComponent, i la capçalera continua sent la foto', async () => {
  mocks.load.mockResolvedValue({ ...BASE, heroVideo: 'https://altre.example/media/spot.mp4' });
  const { container } = render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Cooperativa Sintètica' });
  expect(container.querySelector('video')).toBeNull();
  const props = mocks.renders.filter((p) => p.title === 'Cooperativa Sintètica').at(-1);
  expect(props.topBarData.heroComponent).toBeUndefined();
  expect(props.heroImage).toBe(PORTADA);
});
