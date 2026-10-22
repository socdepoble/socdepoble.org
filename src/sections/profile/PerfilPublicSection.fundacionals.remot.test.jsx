/**
 * Revisió adversarial del Gauntlet 261016 (encàrrec C; pla aprovat, Onada 1
 * punt 5, «perfilDeLaPersonaPilot»; prompt, Bloc 3.5.1) · En remot, que és
 * producció, les fitxes de les tres identitats del Mestre amb l'adaptador de
 * Supabase DE VERES (supabase/perfils.js; només el transport, runtime.js, és
 * simulat). Abans /javillinares, /gent/0001 i /gent/javi-llinares donaven
 * «Perfil no trobat» amb noindex, amb sessió i sense: el servidor no resol
 * cap persona per àlies, i la prova d'abans (canonica.test) simulava un
 * loadPerfilPublic que tornava la persona, una resposta que l'adaptador no
 * pot donar.
 *   · La reserva del paquet val NOMÉS per a les tres identitats, per un
 *     identificador declarat a la llavor (mai pel nom ni pel slug que torne
 *     el servidor), i només quan el servidor no en dona la fitxa.
 *   · Si el servidor la dona, mana el servidor.
 *   · D12 es manté per a qualsevol altra persona o entitat.
 *   · Un homònim d'un altre poble, obert pel seu UUID, no rep ni la URL
 *     canònica ni el poble del Mestre (clauFundacional estricta).
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  usuari: null, tenant: '33333333-3c3c-4000-8000-000000000000', directori: () => [], request: vi.fn(), rpc: vi.fn(),
  renders: [], seo: vi.fn(), navigate: vi.fn(), id: 'ruta',
  t: (_, alternativa) => alternativa, identitat: { memberships: [], actor: null, setActor: vi.fn() },
  ui: { externalConfig: { dataMode: 'remote' } }
}));
vi.mock('../../data/supabase/runtime.js', () => ({
  getCurrentUser: () => m.usuari, request: m.request, rpc: m.rpc,
  getResolvedConfig: () => ({ hasSupabaseConfig: true, runtimeDataMode: 'remote', tenantId: m.tenant })
}));
/* El port llig l'adaptador de Supabase de veres: cap resposta inventada. */
vi.mock('../../data/backendPort.js', async () => {
  const perfils = await import('../../data/supabase/perfils.js');
  return { teCapacitat: (capacitat) => capacitat === 'directori', loadPerfilPublic: perfils.loadPerfilPublic };
});
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => m.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ agentId: m.id }),
  useNavigate: () => m.navigate
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: m.t }),
  useUIState: () => m.ui
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (opcions) => m.seo(opcions) }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    m.renders.push(props);
    return <header className="page-title"><h1>{props.title}</h1></header>;
  }
}));
import PerfilPublicSection from './PerfilPublicSection.jsx';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import { PERSONA_PILOT, POBLE_FUNDACIONAL } from '../../data/identitatsSeed.js';

const SESSIO = Object.freeze({ id: '7a7a7a7a-1b1b-4c4c-8d8d-9e9e9e9e9e9e' });
const UUID_VEI = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
const UUID_SDP = '6c1d2e3f-4051-4b62-8c73-8d94ea5fb607';
const UUID_ALCOI = '0c1d2e3f-4051-4a62-8b73-94a5b6c7d8e9';
const UUID_ALTRA = '22222222-2b2b-4000-8000-000000000000';
const NO_TROBAT = 'Perfil no trobat';
/* Gauntlet 261022_0225 (Tasca 2) · L'entradilla oficial de Javi Llinares, literal de l'ordre. */
const ENTRADILLA_DE_JAVI = "Dissenyador gràfic, sempre disposat a integrar-me en equips de treball on aprendre i aportar valor als projectes. Dins de l'Associació El Rentonar, coordine el Projecte Sóc de Poble.";

const darrer = (nom) => m.renders.filter((props) => props.title === nom).at(-1);
const pobleDe = (props) => props.labels.filter((etiqueta) => etiqueta.className === 'sdp-badge-category').map((etiqueta) => etiqueta.text);
const consultesAlDirectori = () => m.request.mock.calls.map(([ruta]) => ruta).filter((ruta) => ruta.startsWith('/rest/v1/organization_directory'));
const senseCanonica = () => m.seo.mock.calls.every(([opcions]) => !Object.hasOwn(opcions, 'canonical'));

beforeEach(() => {
  vi.clearAllMocks();
  m.renders = [];
  m.usuari = null;
  m.id = 'ruta';
  m.directori = () => [];
  m.request.mockImplementation(async (ruta) => {
    if (ruta.startsWith('/rest/v1/organization_directory')) return m.directori(ruta);
    if (ruta.startsWith('/rest/v1/profiles')) return [];
    throw new Error(`Consulta inesperada: ${ruta}`);
  });
  m.rpc.mockResolvedValue([]);
  vi.stubEnv('VITE_CANONICAL_URL', 'https://socdepoble.org/');
  oblidaEntitatDelProjecte();
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe.each([['sense sessió', null], ['amb sessió', SESSIO]])('remot, %s', (_cas, usuari) => {
  test.each(['javillinares', '0001', 'javi-llinares', 'javi'])('la clau «%s» obri la fitxa de Javi Llinares del paquet, amb el seu poble i la URL canònica neta', async (clau) => {
    m.usuari = usuari;
    render(<PerfilPublicSection id={clau} />);
    await screen.findByRole('heading', { level: 1, name: AGENTS_MAP.JAVI.name });
    /* L'adaptador de veres ha preguntat al servidor, i el servidor no la coneix. */
    expect(consultesAlDirectori().length).toBeGreaterThan(0);
    expect(m.rpc).not.toHaveBeenCalled();
    const props = darrer(AGENTS_MAP.JAVI.name);
    expect(pobleDe(props)).toEqual([POBLE_FUNDACIONAL]);
    /* Gauntlet 261022_0225 (Tasca 2) · La fitxa autèntica, la mateixa que dona
       el servidor: H2 el seu poble, l'entradilla oficial i res de la vella. */
    expect([props.title, props.subtitle, props.lead]).toEqual([AGENTS_MAP.JAVI.name, POBLE_FUNDACIONAL, ENTRADILLA_DE_JAVI]);
    expect(JSON.stringify(m.renders.map(({ title, subtitle, lead }) => [title, subtitle, lead]))).not.toMatch(/Coordinador|visionari|buscant el trellat/);
    expect(props.topBarData.authorLocation).toBe(POBLE_FUNDACIONAL);
    expect(props.labels.map((etiqueta) => etiqueta.text)).not.toContain('La teua fitxa');
    expect(props.avatarAutor).toBeNull();
    expect(props.topBarData.authorAvatar).toBe(PERSONA_PILOT.avatar);
    expect(m.seo).toHaveBeenLastCalledWith(expect.objectContaining({
      title: AGENTS_MAP.JAVI.name, index: true, canonical: 'https://socdepoble.org/javillinares'
    }));
    expect(m.renders.some((props) => props.title === NO_TROBAT)).toBe(false);
  });

  test('una organització que pren el slug «javillinares» no es queda la fitxa del Mestre', async () => {
    m.usuari = usuari;
    m.directori = (ruta) => (ruta.includes('slug=eq.javillinares')
      ? [{ id: UUID_VEI, kind: 'company', slug: 'javillinares', name: 'Forn del Veí', town_name: POBLE_FUNDACIONAL }]
      : []);
    render(<PerfilPublicSection id="javillinares" />);
    await screen.findByRole('heading', { level: 1, name: AGENTS_MAP.JAVI.name });
    expect(m.renders.some((props) => props.title === 'Forn del Veí')).toBe(false);
  });

  test('D12 es manté per a tota altra persona o entitat: si el servidor no la torna, «Perfil no trobat»', async () => {
    m.usuari = usuari;
    for (const clau of ['pepa-soler', 'forn', UUID_ALTRA, 'Javi Llinares', 'Sóc de Poble']) {
      m.renders = [];
      render(<PerfilPublicSection id={clau} />);
      expect(await screen.findByRole('heading', { level: 1, name: NO_TROBAT })).toBeTruthy();
      expect([clau, m.renders.some((props) => props.title !== NO_TROBAT && props.title !== 'Carregant el perfil…')]).toEqual([clau, false]);
      cleanup();
    }
  });
});

test('si el servidor dona la fitxa, mana el servidor: /socdepoble pinta la fila del servidor, amb el seu poble', async () => {
  m.directori = (ruta) => (ruta.includes('slug=eq.socdepoble')
    ? [{ id: UUID_SDP, kind: 'company', slug: 'socdepoble', name: 'Sóc de Poble (servidor)', town_name: 'Benilloba' }]
    : []);
  render(<PerfilPublicSection id="socdepoble" />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble (servidor)' });
  expect(pobleDe(darrer('Sóc de Poble (servidor)'))).toEqual(['Benilloba']);
  /* Sense l'id remot declarat (IDS_REMOTS_FUNDACIONALS, identitatsSeed.js), la
     fila del servidor no es reconeix per un slug que qualsevol podria
     registrar: cap URL canònica creuada. */
  expect(senseCanonica()).toBe(true);
});

test.each([
  ['rentonar', 'Rentonar', 'https://socdepoble.org/rentonar'],
  ['socdepoble', AGENTS_MAP.SOCDEPOBLE.name, 'https://socdepoble.org/socdepoble']
])('si el servidor no dona res per a «%s», la fitxa del paquet, amb el seu poble i la canònica neta', async (clau, nom, canonica) => {
  render(<PerfilPublicSection id={clau} />);
  await screen.findByRole('heading', { level: 1, name: nom });
  expect(consultesAlDirectori().length).toBeGreaterThan(0);
  const props = darrer(nom);
  expect(pobleDe(props)).toEqual([POBLE_FUNDACIONAL]);
  expect(props.labels.map((etiqueta) => etiqueta.text)).not.toContain('La teua fitxa');
  expect(m.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: nom, index: true, canonical: canonica }));
});

test.each([
  ['un grup «rentonar»', { id: UUID_ALCOI, kind: 'group', slug: 'rentonar', name: 'Rentonar d’Alcoi', town_name: null }],
  ['una empresa «socdepoble»', { id: UUID_ALCOI, kind: 'company', slug: 'socdepoble', name: 'Sóc de Poble d’Alcoi', town_name: null }]
])('homònim · %s d’un altre poble, obert pel seu UUID, no rep ni la URL canònica ni el poble del Mestre', async (_cas, fila) => {
  m.directori = (ruta) => (ruta.includes(`id.eq.${UUID_ALCOI}`) ? [fila] : []);
  render(<PerfilPublicSection id={UUID_ALCOI} />);
  await screen.findByRole('heading', { level: 1, name: fila.name });
  const props = darrer(fila.name);
  expect(pobleDe(props)).toEqual([]);
  expect(props.topBarData.authorLocation).toBe('');
  expect(senseCanonica()).toBe(true);
});
