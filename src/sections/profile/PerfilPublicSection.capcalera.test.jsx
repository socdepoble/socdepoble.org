/**
 * Correcció final (ordre del Mestre, 261004; front «persones-logo») · El
 * logotip d'una entitat que no és el projecte no ha d'entrar un commit més
 * tard. useResolvedAsset torna '' en el primer render d'una referència nova,
 * fins i tot per a un '/assets/…' que es resol de manera síncrona: la fitxa
 * es pintava primer sense logotip i, en arribar-li la URL, la imatge (fins a
 * 600x600) feia baixar l'H1 i el cos. Ara només un sdp-media:// passa pel
 * port; la resta es resol en el mateix render.
 * La prova grava les props de cada render de la UniversalPage: cap render de
 * la fitxa ja carregada pot eixir sense el logotip.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Valors estables (hoisted): un objecte nou a cada render entraria als deps
   de l'efecte de càrrega i el faria girar sense parar. */
const mocks = vi.hoisted(() => ({
  id: 'forn', navigate: vi.fn(), load: vi.fn(), renders: [], capacitats: new Set(['directori']), resol: vi.fn(),
  t: (_, alternativa) => alternativa, identitat: { memberships: [], actor: null, setActor: vi.fn() },
  ui: { externalConfig: {} }
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
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
    return <h1>{props.title}</h1>;
  }
}));
import PerfilPublicSection from './PerfilPublicSection.jsx';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';

const FORN = {
  tipus: 'entitat', id: 'o-1', slug: 'forn', nom: 'Forn de la Torre', avatar: '/assets/forn.png', hero: '', lema: '',
  bio: '', presentacioHtml: '', poble: '', esIA: false, publicat: true, propietari: false, copyright: ''
};
const rendersDe = (nom) => mocks.renders.filter((props) => props.title === nom);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.renders = [];
  mocks.capacitats = new Set(['directori']);
  oblidaEntitatDelProjecte();
});
afterEach(cleanup);

test('el logotip d’una altra entitat (un camí) ja hi és en el primer render de la fitxa carregada', async () => {
  mocks.load.mockResolvedValue(FORN);
  render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  const renders = rendersDe('Forn de la Torre');
  expect(renders.length).toBeGreaterThan(0);
  for (const props of renders) expect(props.logoEntitat).toEqual({ clar: '/assets/forn.png', alt: 'Logotip de Forn de la Torre' });
  expect(mocks.resol).not.toHaveBeenCalled();
});

test('un sdp-media:// continua passant pel port (i només ell)', async () => {
  mocks.capacitats = new Set(['directori', 'mitjans']);
  mocks.resol.mockResolvedValue('https://mitjans.socdepoble.org/forn.webp');
  mocks.load.mockResolvedValue({ ...FORN, avatar: 'sdp-media://organitzacions/forn' });
  render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  await vi.waitFor(() => expect(rendersDe('Forn de la Torre').at(-1).logoEntitat?.clar).toBe('https://mitjans.socdepoble.org/forn.webp'));
  expect(mocks.resol).toHaveBeenCalledWith('sdp-media://organitzacions/forn', expect.anything());
});

test('una persona passa el seu avatar a PageFrame (avatarAutor), sense logotip', async () => {
  mocks.id = 'pepa';
  mocks.load.mockResolvedValue({ ...FORN, tipus: 'persona', id: 'u-1', slug: 'pepa', nom: 'Pepa', avatar: 'sdp-media://avatars/pepa' });
  render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Pepa' });
  const props = rendersDe('Pepa').at(-1);
  expect(props.logoEntitat).toBeNull();
  /* PageFrame resol l'sdp-media:// (useResolvedAsset): la fitxa li passa la referència tal qual. */
  expect(props.avatarAutor).toMatchObject({ src: 'sdp-media://avatars/pepa', alt: 'Avatar de Pepa' });
  expect(props.avatarAutor.onCanvia).toBeUndefined();
});
