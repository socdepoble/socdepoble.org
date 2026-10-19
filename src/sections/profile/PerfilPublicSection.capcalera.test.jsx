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
    /* Onada 11 (261010; prompt 261010_1730, tasca 3) · l'h1 dins de la capçalera page-title, com la de veres. */
    return <header className="page-title"><h1>{props.title}</h1></header>;
  }
}));
import PerfilPublicSection from './PerfilPublicSection.jsx';
import { oblidaEntitatDelProjecte, RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, POBLE_FUNDACIONAL } from '../../data/identitatsSeed.js';

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

/* Prompt 261014_0400 (ordre del Mestre, tasca 4: «Quan l'usuari actua com a
   Sóc de Poble, la barra taronja ha de carregar automàticament l'autoria
   oficial», el PNG verd, «evitant en qualsevol cas la silueta negra») · La
   fitxa pública del pilot (esElProjecte: el slug declarat, que registra la
   resolució de l'app dins del poble actiu, auditoria de seguretat 261019 F6,
   o l'id de la llavor) porta el PNG verd a la barra taronja, com
   l'editor, «Les vistes» i «El compte». El nom, el poble i l'enllaç no canvien.
   Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Prohibit mostrar entitats
   sense poble») · El poble desat continua manant (Alcoi es queda Alcoi);
   sense poble, el pilot porta el seu, La Torre de les Maçanes
   (POBLE_FUNDACIONAL). Abans eixia sense poble: l'expectativa del tercer cas
   s'ha actualitzat a propòsit. */
test('prompt 261014_0400 · la barra taronja de la fitxa pública del pilot porta el PNG verd oficial, mai la silueta ni el logo de la fila', async () => {
  expect(DEFAULT_AUTHOR.avatarUrl).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  const pilots = [
    { ...FORN, id: uuid, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble', avatar: '', poble: 'La Torre de les Maçanes' },
    { ...FORN, id: uuid, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble', avatar: '/assets/x.webp', poble: 'Alcoi' },
    { ...FORN, id: ENTITAT_PILOT_ID, slug: null, nom: 'Sóc de Poble', avatar: '' },
  ];
  for (const pilot of pilots) {
    mocks.id = String(pilot.id);
    mocks.renders = [];
    mocks.load.mockResolvedValue(pilot);
    render(<PerfilPublicSection />);
    await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
    /* Per id, la marca arriba quan la resolució de l'app el confirma (F6). */
    await vi.waitFor(() => expect(rendersDe('Sóc de Poble').at(-1).topBarData).toMatchObject({
      authorName: 'Sóc de Poble', authorAvatar: DEFAULT_AUTHOR.avatarUrl, authorLocation: pilot.poble || POBLE_FUNDACIONAL, authorHref: RUTA_PERFIL_PROJECTE,
    }));
    cleanup();
    oblidaEntitatDelProjecte();
  }
});

test('prompt 261014_0400 · una altra entitat (també la que es diu «Sóc de Poble») i una persona continuen portant el seu avatar', async () => {
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  const altres = [
    { perfil: FORN, avatar: '/assets/forn.png' },
    { perfil: { ...FORN, id: uuid, slug: 'soc-de-poble-de-relleu', nom: 'Sóc de Poble', avatar: '' }, avatar: '' },
    { perfil: { ...FORN, tipus: 'persona', id: 'u-1', slug: ENTITAT_PILOT_SLUG, nom: 'Pepa', avatar: '/assets/pepa.webp' }, avatar: '/assets/pepa.webp' },
  ];
  for (const { perfil, avatar } of altres) {
    mocks.id = String(perfil.id);
    mocks.renders = [];
    mocks.load.mockResolvedValue(perfil);
    render(<PerfilPublicSection />);
    await screen.findByRole('heading', { level: 1, name: perfil.nom });
    expect(rendersDe(perfil.nom).at(-1).topBarData.authorAvatar).toBe(avatar);
    cleanup();
  }
});
