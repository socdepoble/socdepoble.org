/**
 * Gauntlet 261016 (Bloc 3.5.1 i 3.5.2; ordre del Mestre) · La fitxa pública
 * de les tres identitats que controla el Mestre (Javi Llinares, Sóc de Poble i
 * Rentonar):
 *   · s'obri per la seua ruta canònica neta, que no porta cap paràmetre: la
 *     ruta li passa l'identificador fix (`id`, App.jsx);
 *   · declara la seua URL canònica neta (useSEO · canonical), s'obriga per on
 *     s'obriga; cap altra fitxa no en declara cap;
 *   · porta sempre el seu poble, La Torre de les Maçanes: si la fila del
 *     servidor no en porta cap, el seu (POBLE_FUNDACIONAL); el poble desat
 *     sempre mana, i cap altra fitxa no se n'inventa cap.
 * La prova grava les props de la UniversalPage, com PerfilPublicSection.capcalera.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  id: 'ruta', navigate: vi.fn(), load: vi.fn(), renders: [], seo: vi.fn(), capacitats: new Set(['directori']),
  t: (_, alternativa) => alternativa, identitat: { memberships: [], actor: null, setActor: vi.fn() },
  ui: { externalConfig: { dataMode: 'remote' } }
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
vi.mock('../../hooks/useSEO', () => ({ useSEO: (opcions) => mocks.seo(opcions) }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  loadPerfilPublic: (...args) => mocks.load(...args)
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    mocks.renders.push(props);
    return <header className="page-title"><h1>{props.title}</h1></header>;
  }
}));
import PerfilPublicSection from './PerfilPublicSection.jsx';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG, POBLE_FUNDACIONAL } from '../../data/identitatsSeed.js';

const UUID = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
const BASE = { avatar: '', hero: '', lema: '', bio: '', presentacioHtml: '', poble: '', esIA: false, publicat: true, propietari: false, copyright: '' };
const JAVI = { ...BASE, tipus: 'persona', id: AGENTS_MAP.JAVI.id, slug: null, nom: AGENTS_MAP.JAVI.name, poble: POBLE_FUNDACIONAL };
const PILOT_REMOT = { ...BASE, tipus: 'entitat', id: UUID, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble' };
const RENTONAR_REMOT = { ...BASE, tipus: 'grup', id: '0c1d2e3f-4051-4a62-8b73-94a5b6c7d8e9', slug: ENTITAT_RENTONAR_SLUG, nom: 'Rentonar' };
/* Revisió adversarial del Gauntlet 261016 (encàrrec C) · Les dues entitats
   pel seu id de la llavor: el que es reconeix sense cap id remot declarat. */
const PILOT_LLAVOR = { ...PILOT_REMOT, id: ENTITAT_PILOT_ID };
const RENTONAR_LLAVOR = { ...RENTONAR_REMOT, id: ENTITAT_RENTONAR_SLUG };
const FORN = { ...BASE, tipus: 'entitat', id: 'o-1', slug: 'forn', nom: 'Forn de la Torre' };
const darrer = (nom) => mocks.renders.filter((props) => props.title === nom).at(-1);
const pobleDe = (props) => props.labels.filter((etiqueta) => etiqueta.className === 'sdp-badge-category').map((etiqueta) => etiqueta.text);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.renders = [];
  mocks.id = 'ruta';
  vi.stubEnv('VITE_CANONICAL_URL', 'https://socdepoble.org/');
  oblidaEntitatDelProjecte();
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

test('una ruta canònica passa el seu identificador fix, que mana sobre el paràmetre de la ruta', async () => {
  mocks.load.mockResolvedValue(JAVI);
  render(<PerfilPublicSection id="javillinares" />);
  await screen.findByRole('heading', { level: 1, name: JAVI.nom });
  expect(mocks.load).toHaveBeenCalledWith('javillinares', mocks.ui.externalConfig);
  expect(mocks.load).not.toHaveBeenCalledWith('ruta', expect.anything());
});

test('sense `id`, el paràmetre de la ruta de sempre (/gent/:agentId…)', async () => {
  mocks.id = 'forn';
  mocks.load.mockResolvedValue(FORN);
  render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: FORN.nom });
  expect(mocks.load).toHaveBeenCalledWith('forn', mocks.ui.externalConfig);
});

/* Revisió adversarial del Gauntlet 261016 (encàrrec C) · DEROGAT «un UUID en
   remot, pel slug declarat»: el slug el tria qui crea l'organització i només
   és únic dins d'un poble, i un homònim d'un altre poble rebia la canònica del
   Mestre. Sense id remot declarat (IDS_REMOTS_FUNDACIONALS), una fila remota
   amb el slug declarat no en declara cap (prova de davall); les canòniques es
   proven per l'id de la llavor. */
test.each([
  ['la persona pilot', JAVI, 'https://socdepoble.org/javillinares'],
  ['l’entitat pilot (per l’id de la llavor)', PILOT_LLAVOR, 'https://socdepoble.org/socdepoble'],
  ['Rentonar (per l’id de la llavor)', RENTONAR_LLAVOR, 'https://socdepoble.org/rentonar']
])('%s declara la seua URL canònica neta, també oberta per una ruta d’abans', async (_cas, perfil, canonica) => {
  mocks.load.mockResolvedValue(perfil);
  render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: perfil.nom });
  expect(mocks.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: perfil.nom, canonical: canonica }));
});

test('cap altra fitxa no declara cap URL canònica: ni una altra entitat, ni la que es diu «Sóc de Poble» amb un altre slug, ni una fila remota amb el slug declarat i un UUID no declarat', async () => {
  for (const perfil of [FORN, { ...PILOT_REMOT, slug: 'soc-de-poble-de-relleu' }, { ...JAVI, id: UUID }, PILOT_REMOT, RENTONAR_REMOT]) {
    mocks.seo.mockClear();
    mocks.load.mockResolvedValue(perfil);
    render(<PerfilPublicSection />);
    await screen.findByRole('heading', { level: 1, name: perfil.nom });
    expect(mocks.seo.mock.calls.every(([opcions]) => !Object.hasOwn(opcions, 'canonical'))).toBe(true);
    cleanup();
  }
});

/* Revisió adversarial del Gauntlet 261016 (encàrrec C) · Abans ho provava amb
   les files remotes (un UUID qualsevol amb el slug declarat): un grup
   «rentonar» d'un altre poble sense poble rebia «La Torre de les Maçanes».
   Ara el poble de reserva només el rep una fila que és, de veres, una de les
   tres (per l'id de la llavor o un id remot declarat). */
test('Rentonar i Sóc de Poble sense poble porten el seu, a la píndola i a la barra taronja; una fila remota no declarada, cap', async () => {
  for (const [perfil, esperat] of [[RENTONAR_LLAVOR, POBLE_FUNDACIONAL], [PILOT_LLAVOR, POBLE_FUNDACIONAL], [RENTONAR_REMOT, ''], [PILOT_REMOT, '']]) {
    mocks.renders = [];
    mocks.load.mockResolvedValue(perfil);
    render(<PerfilPublicSection />);
    await screen.findByRole('heading', { level: 1, name: perfil.nom });
    const props = darrer(perfil.nom);
    expect([perfil.id, pobleDe(props)]).toEqual([perfil.id, esperat ? [esperat] : []]);
    expect([perfil.id, props.topBarData.authorLocation]).toEqual([perfil.id, esperat]);
    cleanup();
    oblidaEntitatDelProjecte();
  }
});

test('el poble desat sempre mana, i cap altra fitxa sense poble no se n’inventa cap', async () => {
  for (const [perfil, esperat] of [[{ ...RENTONAR_REMOT, poble: 'Benilloba' }, ['Benilloba']], [FORN, []]]) {
    mocks.renders = [];
    mocks.load.mockResolvedValue(perfil);
    render(<PerfilPublicSection />);
    await screen.findByRole('heading', { level: 1, name: perfil.nom });
    expect(pobleDe(darrer(perfil.nom))).toEqual(esperat);
    expect(darrer(perfil.nom).topBarData.authorLocation).toBe(esperat[0] || '');
    cleanup();
  }
});
