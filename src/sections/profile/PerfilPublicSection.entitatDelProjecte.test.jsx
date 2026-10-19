/**
 * Auditoria de seguretat 261019 (F6) · Una organització d'un altre poble amb
 * el slug «socdepoble», oberta per /empresa/<uuid>, ja no es registra com
 * l'entitat del projecte ni se'n porta la marca. El projecte el reconeix la
 * resolució de l'app (loadPerfilPublic pel slug declarat, que l'adaptador
 * limita al poble actiu), i la fitxa oberta per id es torna a pintar quan eixa
 * resolució el confirma.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  id: null, navigate: vi.fn(), load: vi.fn(), renders: [], capacitats: new Set(['directori']), resol: vi.fn(),
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
    return <header className="page-title"><h1>{props.title}</h1></header>;
  }
}));
import PerfilPublicSection from './PerfilPublicSection.jsx';
import { esEntitatDelProjecte, oblidaEntitatDelProjecte, RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';

const FITXA = {
  tipus: 'entitat', slug: ENTITAT_PILOT_SLUG, avatar: '/assets/x.webp', hero: '', lema: '', bio: '',
  presentacioHtml: '', poble: 'Alcoi', esIA: false, publicat: true, propietari: false, copyright: ''
};
const UUID_DEL_PROJECTE = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
const UUID_D_UN_ALTRE_POBLE = '9e8d7c6b-5a49-4382-a716-151413121110';
const PROJECTE = { ...FITXA, id: UUID_DEL_PROJECTE, nom: 'Sóc de Poble' };
const SUPLANTADORA = { ...FITXA, id: UUID_D_UN_ALTRE_POBLE, nom: 'Sóc de Poble Oficial' };
const darrer = (nom) => mocks.renders.filter((props) => props.title === nom).at(-1);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.renders = [];
  oblidaEntitatDelProjecte();
  /* Pel slug, el poble actiu en té el projecte; per id, qualsevol poble del node. */
  mocks.load.mockImplementation(async (clau) => {
    if (clau === ENTITAT_PILOT_SLUG) return PROJECTE;
    if (clau === UUID_D_UN_ALTRE_POBLE) return SUPLANTADORA;
    if (clau === UUID_DEL_PROJECTE) return PROJECTE;
    return null;
  });
});
afterEach(() => {
  cleanup();
  oblidaEntitatDelProjecte();
});

test('la homònima d’un altre poble, oberta per id, no és el projecte ni en porta la marca', async () => {
  mocks.id = UUID_D_UN_ALTRE_POBLE;
  render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble Oficial' });
  await vi.waitFor(() => expect(esEntitatDelProjecte({ tipus: 'entitat', id: UUID_DEL_PROJECTE })).toBe(true));
  expect(esEntitatDelProjecte({ tipus: 'entitat', id: UUID_D_UN_ALTRE_POBLE })).toBe(false);
  const { topBarData } = darrer('Sóc de Poble Oficial');
  expect(topBarData.authorHref).not.toBe(RUTA_PERFIL_PROJECTE);
  expect(topBarData.authorAvatar).not.toBe(DEFAULT_AUTHOR.avatarUrl);
});

test('el projecte, obert per id, porta la marca quan la resolució de l’app el confirma', async () => {
  mocks.id = UUID_DEL_PROJECTE;
  render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
  await vi.waitFor(() => expect(darrer('Sóc de Poble').topBarData).toMatchObject({
    authorAvatar: DEFAULT_AUTHOR.avatarUrl, authorHref: RUTA_PERFIL_PROJECTE
  }));
});

test('pel slug declarat (la ruta /socdepoble), la mateixa fitxa del poble actiu es registra en carregar-se', async () => {
  mocks.id = ENTITAT_PILOT_SLUG;
  render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
  expect(esEntitatDelProjecte({ tipus: 'entitat', id: UUID_DEL_PROJECTE })).toBe(true);
  expect(darrer('Sóc de Poble').topBarData).toMatchObject({ authorAvatar: DEFAULT_AUTHOR.avatarUrl, authorHref: RUTA_PERFIL_PROJECTE });
});
