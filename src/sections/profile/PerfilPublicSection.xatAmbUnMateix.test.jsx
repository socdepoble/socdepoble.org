/**
 * xat-flux-04 (Gauntlet T7a, 261104) · «Escriu-li al xat» mai porta a un
 * directe amb un mateix ni amb una entitat que representes.
 *
 * crea_fil_directe (supabase/migrations/2610081543, l'última definició) llança
 * SDP-XAT-002 quan p_altre_usuari = auth.uid() («cal un altre interlocutor») i
 * quan can_manage_organization (owner o admin: esRolQueMana, rols.js) és cert
 * («ja representes aquesta entitat»). localXat.creaFilDirecte rebutja també un
 * mateix. XatSection en fa un toast i la persona es queda a /xat?amb=… sense
 * cap fil: «cap clic que acabe en error» (P4b-3, REV-PERF-7).
 *
 * Es mantenen, i ho fixen estes proves:
 *   · un membre amb rol 'member' (el servidor li obri el directe);
 *   · una IA, encara que en siga propietari («Parla amb…»: en llavor, qui té
 *     sessió mana a Sóc de Poble i és propietari de la IAIA, localPerfils.js);
 *   · la persona pilot quan el seu id és el del padró o l'UUID declarat:
 *     XatContext.creaFil la porta a la conversa de servei tècnic (P1-70), per
 *     id i mai pel slug.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  id: 'x', navigate: vi.fn(), load: vi.fn(), seo: vi.fn(), toast: vi.fn(),
  config: { dataMode: 'remote' }, t: (_, alternativa) => alternativa, resolveAsset: (valor) => valor,
  identitat: { memberships: [], actor: null, setActor: vi.fn(() => true) },
  xat: { senseSessio: false },
  /* L'UUID remot que la prova declara com a compte de la persona pilot (com
     ho faria IDS_REMOTS_FUNDACIONALS); null, cap. */
  pilotDeclarat: null
}));
vi.mock('../xat/XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ agentId: mocks.id }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/perfil/${mocks.id}` }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: `/perfil/${mocks.id}`, basename: '' }),
  Link: ({ to, children, ...resta }) => React.createElement('a', { href: to, ...resta }, children)
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t, resolveAsset: mocks.resolveAsset }),
  useUIState: () => ({ externalConfig: mocks.config, locale: 'ca-ES', language: 'ca' })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (opcions) => mocks.seo(opcions) }));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: () => true, loadPerfilPublic: mocks.load }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
/* Només per al cas de l'UUID declarat: la resta, l'original. */
vi.mock('../../data/identitatsSeed.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    esComptePersonaPilot: (objecte, opcions) => (mocks.pilotDeclarat != null && String(objecte?.id) === mocks.pilotDeclarat)
      || original.esComptePersonaPilot(objecte, opcions)
  };
});

import PerfilPublicSection from './PerfilPublicSection.jsx';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';
import { createLocalPerfilsAdapter } from '../../data/localPerfils.js';
import { rutaDelXatDeJavi, rutaDelXatDeLaIAIA } from '../xat/useObriXatPerDefecte.js';

const ESCRIU = 'Escriu-li al xat';
const UUID_GRUP = '5f1d2c3b-4a59-4e6f-8a7b-9c0d1e2f3a4b';
const UUID_PERSONA = '0c9b8a7d-6e5f-4a3b-9c2d-1e0f9a8b7c6d';
const UUID_JAVI = '9a8b7c6d-5e4f-4321-8fed-cba987654321';
const BASE = {
  avatar: '', hero: '', lema: '', bio: '', presentacioHtml: '', poble: 'Benilloba', esIA: false, publicat: true, copyright: ''
};
/* En remot, supabase/perfils.js porta `propietari: false` a tota organització: qui l'administra ho diu la pertinença. */
const GRUP_REMOT = { ...BASE, tipus: 'grup', id: UUID_GRUP, slug: 'colla-del-forn', nom: 'Colla del Forn', propietari: false };

const naveguesAlDirecte = () => mocks.navigate.mock.calls.flat().some((ruta) => String(ruta).startsWith('/xat?amb='));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.config = { dataMode: 'remote' };
  mocks.id = 'x';
  mocks.identitat = { memberships: [], actor: null, setActor: vi.fn(() => true) };
  mocks.xat = { senseSessio: false };
  mocks.pilotDeclarat = null;
});

test.each(['owner', 'admin'])('xat-flux-04 · en remot, la fitxa d’un grup que administres (%s) no porta «Escriu-li al xat»', async (role) => {
  mocks.id = 'colla-del-forn';
  mocks.identitat.memberships = [{ id: UUID_GRUP, slug: 'colla-del-forn', name: 'Colla del Forn', role }];
  mocks.load.mockResolvedValue(GRUP_REMOT);
  render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: 'Colla del Forn' });
  expect(screen.queryByRole('button', { name: ESCRIU })).toBeNull();
  /* La resta de la fila es queda: editar-la i actuar-hi. */
  expect(screen.getByRole('button', { name: 'Edita la fitxa' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Actua com a Colla del Forn' })).toBeTruthy();
  expect(naveguesAlDirecte()).toBe(false);
});

test('xat-flux-04 · si ja actues com el grup que administres, tampoc no hi ha directe (la fila es queda amb «Edita la fitxa»)', async () => {
  mocks.id = 'colla-del-forn';
  mocks.identitat.memberships = [{ id: UUID_GRUP, slug: 'colla-del-forn', role: 'owner' }];
  mocks.identitat.actor = { tipus: 'entitat', id: UUID_GRUP, nom: 'Colla del Forn' };
  mocks.load.mockResolvedValue(GRUP_REMOT);
  render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: 'Colla del Forn' });
  expect(screen.queryByRole('button', { name: ESCRIU })).toBeNull();
  expect(screen.getByRole('button', { name: 'Edita la fitxa' })).toBeTruthy();
});

test('xat-flux-04 · un membre (rol member) conserva el directe amb el grup, com el servidor', async () => {
  mocks.id = 'colla-del-forn';
  mocks.identitat.memberships = [{ id: UUID_GRUP, slug: 'colla-del-forn', role: 'member' }];
  mocks.load.mockResolvedValue(GRUP_REMOT);
  render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: 'Colla del Forn' });
  fireEvent.click(screen.getByRole('button', { name: ESCRIU }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(`/xat?amb=${UUID_GRUP}`);
});

test('xat-flux-04 · en remot, la fitxa pròpia d’una persona no porta «Escriu-li al xat»; sí «Edita la fitxa»', async () => {
  mocks.id = UUID_PERSONA;
  mocks.load.mockResolvedValue({ ...BASE, tipus: 'persona', id: UUID_PERSONA, slug: null, nom: 'Pepa', propietari: true });
  render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: 'Pepa' });
  expect(screen.queryByRole('button', { name: ESCRIU })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Edita la fitxa' }));
  expect(mocks.navigate.mock.calls).toEqual([['/el-meu-perfil']]);
});

test('xat-flux-04 · la fitxa d’una altra persona continua portant el directe', async () => {
  mocks.id = UUID_PERSONA;
  mocks.load.mockResolvedValue({ ...BASE, tipus: 'persona', id: UUID_PERSONA, slug: null, nom: 'Pepa', propietari: false });
  render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: 'Pepa' });
  fireEvent.click(screen.getByRole('button', { name: ESCRIU }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(`/xat?amb=${UUID_PERSONA}`);
});

/* En llavor, la fitxa de qui entra és la de la persona pilot (localPerfils.js,
   perfilDe): el slug és un àlies seu, però l'id és el de la sessió.
   XatContext.creaFil només desvia al servei tècnic per id (P1-70) i
   localXat.creaFilDirecte rebutja «tu mateix»: el slug no ha de salvar el botó. */
test('xat-flux-04 · en llavor, /gent/javi-llinares amb sessió (la fitxa pròpia, slug de la pilot) no porta el directe amb tu mateix', async () => {
  const perfils = createLocalPerfilsAdapter();
  const usuari = { id: 'u-sessio', user_metadata: { full_name: 'Javi Pilot' } };
  mocks.config = { dataMode: 'seed' };
  mocks.id = 'javi-llinares';
  mocks.load.mockImplementation(async (id) => perfils.loadPerfilPublic(id, usuari));
  render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: 'Javi Pilot' });
  expect(screen.getByText('La teua fitxa', { selector: '.sp-card-label' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: ESCRIU })).toBeNull();
  expect(screen.getByRole('button', { name: 'Edita la fitxa' })).toBeTruthy();
});

/* En llavor, qui té sessió és owner de l'entitat pilot: la seua fitxa és pròpia. */
test('xat-flux-04 · en llavor, la fitxa de Sóc de Poble (pròpia de qui té sessió) no porta el directe; «Edita la fitxa» es queda', async () => {
  const perfils = createLocalPerfilsAdapter();
  const usuari = { id: 'u-sessio', user_metadata: { full_name: 'Pepa' } };
  mocks.config = { dataMode: 'seed' };
  mocks.id = 'socdepoble';
  mocks.load.mockImplementation(async (id) => perfils.loadPerfilPublic(id, usuari));
  render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
  expect(screen.queryByRole('button', { name: ESCRIU })).toBeNull();
  expect(screen.getByRole('button', { name: 'Edita la fitxa' })).toBeTruthy();
});

test('xat-flux-04 · una IA de la qual eres propietari (la IAIA en llavor) conserva «Parla amb la IAIA»', async () => {
  const perfils = createLocalPerfilsAdapter();
  const usuari = { id: 'u-sessio', user_metadata: { full_name: 'Pepa' } };
  mocks.config = { dataMode: 'seed' };
  mocks.id = 'iaia-maria';
  mocks.load.mockImplementation(async (id) => perfils.loadPerfilPublic(id, usuari));
  render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' });
  expect(screen.getByText('La teua fitxa', { selector: '.sp-card-label' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Parla amb la IAIA' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(rutaDelXatDeLaIAIA('seed', false));
  expect(rutaDelXatDeLaIAIA('seed', false)).toBe(`/xat?amb=${IAIA_ID}`);
});

test('xat-flux-04 · una altra IA pròpia (un agent del catàleg) conserva «Parla amb…»', async () => {
  const agent = AGENTS_MAP.NANOBANANA;
  mocks.id = agent.id;
  mocks.load.mockResolvedValue({ ...BASE, tipus: 'ia', id: agent.id, slug: null, nom: agent.name, esIA: true, propietari: true });
  render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: agent.name });
  fireEvent.click(screen.getByRole('button', { name: `Parla amb ${agent.name}` }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(`/xat?amb=${agent.id}`);
});

/* P4b-3 · La fitxa del paquet de la persona pilot (id del padró), mirada per
   ella en llavor: el directe de la seua fila, que creaFil desvia al servei tècnic. */
test('xat-flux-04 · la fitxa pròpia del paquet de la persona pilot conserva la seua ruta del xat (P4b-3, P1-70)', async () => {
  mocks.config = { dataMode: 'seed' };
  mocks.id = AGENTS_MAP.JAVI.id;
  mocks.load.mockResolvedValue({ ...BASE, tipus: 'persona', id: AGENTS_MAP.JAVI.id, slug: null, nom: 'Javi Llinares', propietari: true });
  render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: 'Javi Llinares' });
  fireEvent.click(screen.getByRole('button', { name: ESCRIU }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(rutaDelXatDeJavi('seed'));
});

/* P1-70 · Amb l'UUID del compte de la persona pilot declarat, XatContext.creaFil
   porta el seu ?amb= a la conversa de servei tècnic: cap SDP-XAT-002. */
test('xat-flux-04 · en remot, la fitxa pròpia de la persona pilot amb l’UUID declarat conserva el botó (servei tècnic, P1-70)', async () => {
  mocks.pilotDeclarat = UUID_JAVI;
  mocks.id = UUID_JAVI;
  mocks.load.mockResolvedValue({ ...BASE, tipus: 'persona', id: UUID_JAVI, slug: null, nom: 'Javi Llinares', propietari: true });
  render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: 'Javi Llinares' });
  fireEvent.click(screen.getByRole('button', { name: ESCRIU }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(`/xat?amb=${UUID_JAVI}`);
});
