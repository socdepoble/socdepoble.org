import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* T4 · la pàgina pública d'una persona, una entitat o la IAIA. */
/* Els objectes i funcions dels mocks són estables (hoisted): un valor nou a
   cada render entraria als deps de l'efecte de càrrega i faria un bucle. */
const mocks = vi.hoisted(() => ({
  id: 'iaia', navigate: vi.fn(), load: vi.fn(), capacitat: true, seo: vi.fn(), toast: vi.fn(),
  config: {}, t: (_, alternativa) => alternativa, resolveAsset: (v) => v, agents: [],
  /* T43 · la identitat de qui mira (pertinences i actor). */
  identitat: { memberships: [], actor: null, setActor: vi.fn() },
  /* D12 (refutació del front C) · el que la fitxa llig del Xat: només `senseSessio`. */
  xat: { senseSessio: false }
}));
vi.mock('../xat/XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ agentId: mocks.id }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/perfil/${mocks.id}` }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: `/perfil/${mocks.id}`, basename: '' }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t, resolveAsset: mocks.resolveAsset }),
  useUIState: () => ({ externalConfig: mocks.config, locale: 'ca-ES', language: 'ca' })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (opcions) => mocks.seo(opcions) }));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: () => mocks.capacitat, loadPerfilPublic: mocks.load }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
import PerfilPublicSection from './PerfilPublicSection.jsx';
import { TEXTOS_COMENTAR } from '../../components/PedraSeca/organismes/textosComentar.js';
/* Onada 8 (261009) · El pilot porta al seu perfil (RUTA_PERFIL_PROJECTE), ja no a /projecte. */
import { oblidaEntitatDelProjecte, RUTA_PERFIL_PROJECTE, rutaDAutoria } from '../../config/navigation.js';
import { AGENTS_MAP, tipusDAgent } from '../../data/agentsSeed.js';
/* Ordre del Mestre (261007) · La pàgina de l'entitat pilot s'obri pel seu
   slug declarat, el de producció ('socdepoble'). */
import { ENTITAT_PILOT_SLUG, IAIA_ID, PERSONA_PILOT } from '../../data/identitatsSeed.js';
/* Gauntlet 261016 (Bloc 3) · El magatzem local de perfils, que en llavor fa de servidor. */
import { createLocalPerfilsAdapter } from '../../data/localPerfils.js';
import { RUTA_XAT_DE_LA_IAIA, RUTA_XAT_DE_MOSTRA_DE_LA_IAIA } from '../xat/useObriXatPerDefecte.js';

const IAIA = { tipus: 'ia', id: 'iaia', slug: 'iaia-maria', nom: 'IAIA MarIA', avatar: '', hero: '', lema: 'Pensant en global', bio: 'Matriarca Digital', presentacioHtml: '<p>Cor antic i circuits nous.</p>', poble: 'La Torre de les Maçanes', esIA: true, publicat: true, propietari: false, copyright: '' };
const ENTITAT = { ...IAIA, tipus: 'entitat', id: 'socdepoble', nom: 'Sóc de Poble', esIA: false, propietari: true, presentacioHtml: '' };

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks(); mocks.config = {}; mocks.id = 'iaia'; mocks.capacitat = true; mocks.load.mockResolvedValue(IAIA);
  mocks.identitat = { memberships: [], actor: null, setActor: vi.fn(() => true) };
  mocks.xat = { senseSessio: false };
  /* Els ids remots del projecte són d'abast de mòdul: cap prova en deixa per a la següent. */
  oblidaEntitatDelProjecte();
});

test('la IAIA porta avís d’intel·ligència artificial i el botó parla amb ella al xat', async () => {
  render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' })).toBeTruthy();
  expect(mocks.load).toHaveBeenCalledWith('iaia', mocks.config);
  const avis = screen.getByRole('status');
  expect(avis.textContent).toContain('Este perfil és una intel·ligència artificial');
  expect(screen.getByText('Intel·ligència artificial', { selector: '.sp-card-label' })).toBeTruthy();
  expect(screen.getByText('Cor antic i circuits nous.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Parla amb la IAIA' }));
  expect(mocks.navigate).toHaveBeenCalledWith('/xat?amb=iaia');
  expect(screen.queryByRole('button', { name: 'Edita la fitxa' })).toBeNull();
  expect(mocks.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'IAIA MarIA', index: true }));
});

test('la fitxa pròpia d’una entitat s’edita des del Workspace i no porta avís d’IA', async () => {
  mocks.id = ENTITAT_PILOT_SLUG;
  mocks.load.mockResolvedValue(ENTITAT);
  render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' })).toBeTruthy();
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByText('La teua fitxa', { selector: '.sp-card-label' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Edita la fitxa' }));
  expect(mocks.navigate).toHaveBeenCalledWith('/el-meu-perfil');
  fireEvent.click(screen.getByRole('button', { name: 'Escriu-li al xat' }));
  expect(mocks.navigate).toHaveBeenCalledWith('/xat?amb=socdepoble');
});

test('sense la capacitat del port cau al catàleg d’agents; sense ningú, «Perfil no trobat»', async () => {
  mocks.config = { dataMode: 'seed' };
  mocks.capacitat = false;
  mocks.id = '0001';
  const agents = [{ id: '0001', name: 'Javi', role: 'Coordinador', type: 'PERSON', short_bio: 'Visionari.' }];
  const { container } = render(<PerfilPublicSection agents={agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Javi' })).toBeTruthy();
  expect(mocks.load).not.toHaveBeenCalled();
  /* Gauntlet 261016 (Bloc 3; regressió de la Fase 1, T1 «Dignitat de
     persona») · DEROGADA la píndola «Persona»: una persona no es categoritza
     ni és una obra. La fitxa del catàleg (PERSON) no porta la píndola del
     tipus ni el «© Nom» de reserva. */
  expect(screen.queryByText('Persona', { selector: '.sp-card-label' })).toBeNull();
  expect(container.querySelector('.page-title-copyright')).toBeNull();
  cleanup();
  mocks.id = 'ningu';
  render(<PerfilPublicSection agents={agents} />);
  await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Perfil no trobat' })).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: 'Torna al directori' }));
  expect(mocks.navigate).toHaveBeenCalledWith('/perfil');
});

/* Revisió adversarial del Gauntlet 261016 (encàrrec C) · Abans ho provava
   amb 'socdepoble': és una de les tres identitats del Mestre, que en remot
   cauen al paquet quan el servidor no les torna
   (PerfilPublicSection.fundacionals.remot.test.jsx). La regla de sempre (D12)
   es prova ara amb una entitat qualsevol del catàleg. */
test.each([true, false])('en remot cap catàleg suplix un perfil absent (directori=%s)', async capacitat => {
  mocks.capacitat = capacitat;
  mocks.id = 'forn';
  mocks.load.mockResolvedValue(null);
  render(<PerfilPublicSection agents={[{ id: 'forn', name: 'Forn de la Torre', type: 'COMPANY' }]} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Perfil no trobat' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Escriu-li al xat' })).toBeNull();
  /* Poliment T45 · en remot la fitxa d'una altra persona encara no es pot
     llegir: el text no diu només «és privada». */
  expect(screen.getByText(/Les fitxes d’altres persones encara no es poden obrir en este servidor/)).toBeTruthy();
});

/* Onada 11 (261010; prompt 261010_1730, tasca 6, D12) · La IAIA viu al paquet
   i no a cap taula: en remot el port torna null (supabase/perfils.js) i la
   pàgina la pinta del paquet (AGENTS_IA_SEED), pel seu id i pel seu slug, amb
   el text «Qui és la IAIA MarIA?», l'avís d'IA, el seu avatar i el botó del
   xat. Una persona o una entitat absents continuen sent «Perfil no trobat»
   (prova de dalt): la resposta buida del servidor només deixa de manar per a
   la IA del paquet.
   Refutació del front C (261010) · El botó «Parla amb la IAIA» va on va la
   seua fila de la llista del Xat (rutaDelXatDeLaIAIA): en remot amb sessió,
   el xat públic de /iaia (RUTA_XAT_DE_LA_IAIA); sense sessió, la seua
   conversa de mostra (RUTA_XAT_DE_MOSTRA_DE_LA_IAIA). DEROGAT el directe
   /xat?amb=<id> en remot: el servidor no coneix el seu UUID (crea_fil_directe
   fallava amb un avís) i, sense sessió, obria la mostra de Sóc de Poble. En
   llavor i en local el directe es conserva (PerfilPublicSection.iaia.test). */
test.each([['per id', IAIA_ID], ['per slug', 'iaia-maria']])('D12 · en remot, quan el servidor no la coneix, el perfil de la IAIA ix del paquet %s', async (_, clau) => {
  mocks.config = { dataMode: 'remote' };
  mocks.id = clau;
  mocks.load.mockResolvedValue(null);
  const { container } = render(<PerfilPublicSection agents={[]} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' })).toBeTruthy();
  expect(mocks.load).toHaveBeenCalledWith(clau, mocks.config);
  expect(screen.getByRole('status').textContent).toContain('Este perfil és una intel·ligència artificial');
  expect(screen.getByText('Intel·ligència artificial', { selector: '.sp-card-label' })).toBeTruthy();
  /* Front D4 (integració) · El cos de la presentació, tal qual: es llig per
     l'outerHTML de l'article (la porta lint_logica_usuari no admet cap lectura
     directa del cos fora de sanitizeHtml). */
  expect(container.querySelector('article.detail-content').outerHTML).toContain(AGENTS_MAP.IAIA.presentacio_html);
  expect(container.querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe(AGENTS_MAP.IAIA.avatar_url);
  expect(screen.queryByText(/encara no es poden obrir/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Edita la fitxa' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Parla amb la IAIA' }));
  expect(mocks.navigate).toHaveBeenCalledWith(RUTA_XAT_DE_LA_IAIA);
  expect(mocks.navigate).not.toHaveBeenCalledWith(`/xat?amb=${IAIA_ID}`);
  expect(mocks.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'IAIA MarIA', index: true }));
});

test('D12 · en remot i sense sessió, «Parla amb la IAIA» obri la seua conversa de mostra, la mateixa fila que veu el convidat', async () => {
  mocks.config = { dataMode: 'remote' };
  mocks.id = IAIA_ID;
  mocks.load.mockResolvedValue(null);
  mocks.xat = { senseSessio: true };
  render(<PerfilPublicSection agents={[]} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Parla amb la IAIA' }));
  expect(mocks.navigate).toHaveBeenCalledWith(RUTA_XAT_DE_MOSTRA_DE_LA_IAIA);
  expect(RUTA_XAT_DE_MOSTRA_DE_LA_IAIA).not.toBe(RUTA_XAT_DE_LA_IAIA);
});

test('D12 · perfilDeLaIADelPaquet: el mateix DTO que el port, només per a una IA del paquet', async () => {
  const { perfilDeLaIADelPaquet } = await import('./PerfilPublicSection.jsx');
  const { AGENTS_IA_SEED } = await import('../../data/identitatsSeed.js');
  expect(perfilDeLaIADelPaquet(null)).toBeNull();
  expect(perfilDeLaIADelPaquet(undefined)).toBeNull();
  const [iaia] = AGENTS_IA_SEED;
  expect(perfilDeLaIADelPaquet(iaia)).toEqual({
    tipus: 'ia', id: IAIA_ID, slug: 'iaia-maria', nom: 'IAIA MarIA', avatar: AGENTS_MAP.IAIA.avatar_url, hero: '',
    lema: AGENTS_MAP.IAIA.lema, bio: AGENTS_MAP.IAIA.role, presentacioHtml: AGENTS_MAP.IAIA.presentacio_html,
    poble: AGENTS_MAP.IAIA.town_name, esIA: true, publicat: true, propietari: false, copyright: '', emoticona: ''
  });
});

test('en seed el «Perfil no trobat» no parla de cap límit del servidor', async () => {
  mocks.config = { dataMode: 'seed' };
  mocks.id = 'ningu';
  mocks.load.mockResolvedValue(null);
  render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Perfil no trobat' })).toBeTruthy();
  expect(screen.getByText('Ningú del poble té este identificador, o la seua fitxa és privada.')).toBeTruthy();
  expect(screen.queryByText(/encara no es poden obrir/)).toBeNull();
});

/* T43 (ordre del Mestre, 260928) · la fitxa pública és connectable: abans
   passava onConnect={false}, que UniversalPage no respectava (sortia el
   Connectar genèric, només amb el nom). Ara porta el descriptor del perfil. */
const destiDe = (crida) => {
  const url = new URL(crida, 'http://localhost');
  return { ruta: url.pathname, params: Object.fromEntries(url.searchParams) };
};

test('T43 · CONNECTAR d’una persona (o de la IAIA) porta objecte i ruta del perfil, sense organització', async () => {
  render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' });
  fireEvent.click(screen.getByRole('button', { name: 'Connectar' }));
  const desti = destiDe(mocks.navigate.mock.calls.at(-1)[0]);
  expect(desti.ruta).toBe('/connectar');
  expect(desti.params).toEqual({ item_id: 'iaia', title: 'IAIA MarIA', sectionId: 'perfil', objecte: 'ia', ruta: '/perfil/iaia' });
});

test('T43 · CONNECTAR d’una entitat afig organitzacio=ID per al lent d’administrar', async () => {
  mocks.id = 'socdepoble';
  mocks.load.mockResolvedValue(ENTITAT);
  render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
  fireEvent.click(screen.getByRole('button', { name: 'Connectar' }));
  expect(destiDe(mocks.navigate.mock.calls.at(-1)[0]).params).toEqual({
    item_id: 'socdepoble', title: 'Sóc de Poble', sectionId: 'perfil', objecte: 'entitat', ruta: '/empresa/socdepoble', organitzacio: 'socdepoble'
  });
});

/* ── T63.2 (doctrina del Mestre, 260928) · Comentar de la barra blava ──
   Persona i IA: el missatge directe de sempre. Entitat i grup: el xat comú
   de la seua pàgina (la Comunitat, que tria XatContext). «Escriu-li al xat»
   continua sent el directe per a tothom.
   Ordre del Mestre (261007) · «COMENTARIS = XAT» · Comentar obri el menú de
   dues vies: «En públic», el xat comú de l'entitat o del grup; «En privat»,
   el xat amb Sóc de Poble (sense proveïdor, el de la llavor). Una persona o
   la IAIA no tenen xat públic: «En públic» es queda desactivada. PREGUNTA
   OBERTA al Mestre: per a una persona o la IAIA, «En privat» ha de ser el
   directe amb ella (abans, /xat?amb=iaia o /xat?amb=u-1) en lloc de Sóc de
   Poble? «Escriu-li al xat» continua portant al directe.
   Onada 8 (261009; requeriments, punt 3) · Resposta: sí. «En privat» obri el
   xat amb la identitat del perfil (el directe, com «Escriu-li al xat»); el de
   l'entitat pilot continua sent el xat amb Sóc de Poble. */
const comentarBarra = (container) => container.querySelector('header.bar-blue .sp-card-actions').children[1];
const PUBLIC = TEXTOS_COMENTAR.public[1];
const PRIVAT = TEXTOS_COMENTAR.privat[1];
const XAT_DE_SOCDEPOBLE = '/xat?amb=socdepoble';
/* Obri el menú de Comentar de la barra (si no ho està) i en torna la fila de la via. */
function via(container, nom) {
  const boto = comentarBarra(container);
  expect(boto.getAttribute('aria-label')).toBe('Comentar');
  expect(boto.getAttribute('aria-haspopup')).toBe('menu');
  if (boto.getAttribute('aria-expanded') !== 'true') fireEvent.click(boto);
  return within(container.querySelector('header.bar-blue [role="menu"]')).getByRole('menuitem', { name: nom });
}

test('T63.2 · la IAIA (o una persona) no té xat públic: «En públic» desactivada; «En privat», el seu xat (Onada 8)', async () => {
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' });
  const publica = via(container, PUBLIC);
  expect(publica.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(publica);
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(via(container, PRIVAT).textContent).toBe(`${PRIVAT}Un xat només entre tu i IAIA MarIA`);
  fireEvent.click(via(container, PRIVAT));
  expect(mocks.navigate.mock.calls).toEqual([['/xat?amb=iaia']]);
  cleanup();
  mocks.navigate.mockClear();
  mocks.load.mockResolvedValue({ ...IAIA, tipus: 'persona', id: 'u-1', nom: 'Pepa', esIA: false });
  const persona = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Pepa' });
  expect(via(persona.container, PUBLIC).getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(via(persona.container, PRIVAT));
  expect(mocks.navigate.mock.calls).toEqual([['/xat?amb=u-1']]);
  expect(mocks.toast).not.toHaveBeenCalled();
});

test('Onada 8 · el perfil de l’entitat pilot: «En privat» continua sent el xat amb Sóc de Poble, i el menú, el de sempre', async () => {
  mocks.id = 'socdepoble';
  mocks.load.mockResolvedValue(ENTITAT);
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
  expect(via(container, PRIVAT).textContent).toBe(`${PRIVAT}${TEXTOS_COMENTAR.privatDetall[1]}`);
  fireEvent.click(via(container, PRIVAT));
  expect(mocks.navigate).toHaveBeenLastCalledWith(XAT_DE_SOCDEPOBLE);
});

test('Onada 8 · la boina de la fitxa porta a la fitxa mateixa, per la seua ruta canònica; mai al xat', async () => {
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' });
  const boina = container.querySelector('section.bar-orange .sp-card-author');
  expect(boina.matches('a.sp-card-author-link')).toBe(true);
  expect(boina.getAttribute('href')).toBe('/perfil/iaia');
  cleanup();
  mocks.id = 'socdepoble';
  mocks.load.mockResolvedValue(ENTITAT);
  const pilot = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
  expect(pilot.container.querySelector('section.bar-orange .sp-card-author').getAttribute('href')).toBe('/empresa/socdepoble');
});

test('T63.2 · «En públic» d’una entitat obri el xat comú de la seua pàgina; «Escriu-li al xat» continua sent el directe', async () => {
  mocks.id = 'socdepoble';
  mocks.load.mockResolvedValue(ENTITAT);
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
  fireEvent.click(via(container, PUBLIC));
  expect(destiDe(mocks.navigate.mock.calls.at(-1)[0])).toEqual({
    ruta: '/xat', params: { sobre: 'entitat:socdepoble', titol: 'Sóc de Poble', ruta: '/empresa/socdepoble' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Escriu-li al xat' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?amb=socdepoble');
});

test('T63.2 · un grup també té xat comú («En públic»)', async () => {
  mocks.id = 'colla';
  mocks.load.mockResolvedValue({ ...ENTITAT, tipus: 'grup', id: 'g-1', nom: 'Colla', propietari: false });
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Colla' });
  fireEvent.click(via(container, PUBLIC));
  expect(destiDe(mocks.navigate.mock.calls.at(-1)[0]).params.sobre).toBe('grup:g-1');
});

/* Revisió de T63.2 · Mentre carrega o si no el troba, encara no sabem qui és:
   ni el directe (l'id pot ser un slug) ni un xat comú de la ruta /gent/<id>.
   Comentar es queda on era.
   Ordre del Mestre (261007) · «En públic» es queda desactivada, amb la raó,
   i el clic no navega ni avisa. */
test('T63.2 · carregant o «Perfil no trobat»: Comentar no promet cap xat, «En públic» desactivada, i el clic no fa res', async () => {
  window.history.replaceState(null, '', '/gent/u-1');
  mocks.id = 'u-1';
  mocks.load.mockReturnValue(new Promise(() => {}));
  const carregant = render(<PerfilPublicSection agents={mocks.agents} />);
  const publica = via(carregant.container, PUBLIC);
  expect(publica.getAttribute('aria-disabled')).toBe('true');
  expect(publica.textContent).toBe(`${PUBLIC}${TEXTOS_COMENTAR.senseXatPublic[1]}`);
  fireEvent.click(publica);
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
  carregant.unmount();
  mocks.load.mockResolvedValue(null);
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Perfil no trobat' });
  const noTrobat = via(container, PUBLIC);
  expect(noTrobat.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(noTrobat);
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
  window.history.replaceState(null, '', '/');
});

/* ── T43b (ordre del Mestre, 260928) · administrar i correu públic ── */

const FORN = { ...ENTITAT, id: 'o-1', slug: 'forn', nom: 'Forn de la Torre', propietari: false };

test('T43 · qui administra una entitat (pertinença) veu «Edita la fitxa» cap a la seua fitxa i «Actua com a»', async () => {
  mocks.id = 'forn';
  mocks.load.mockResolvedValue(FORN);
  mocks.identitat.memberships = [{ id: 'o-1', slug: 'forn', name: 'Forn de la Torre', role: 'admin' }];
  mocks.identitat.actor = { tipus: 'persona', id: 'u-1', nom: 'Pepa' };
  render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  fireEvent.click(screen.getByRole('button', { name: 'Edita la fitxa' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/el-meu-perfil?organitzacio=o-1');
  /* Canviar d'identitat és un botó a banda, mai un efecte d'editar. */
  expect(mocks.identitat.setActor).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Actua com a Forn de la Torre' }));
  expect(mocks.identitat.setActor).toHaveBeenCalledWith('entitat', 'o-1');
});

test('T43 · si ja actues com a l’entitat no hi ha «Actua com a», i un membre no l’edita', async () => {
  mocks.id = 'forn';
  mocks.load.mockResolvedValue(FORN);
  mocks.identitat.memberships = [{ id: 'o-1', slug: 'forn', role: 'owner' }];
  mocks.identitat.actor = { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre' };
  const vista = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  expect(screen.queryByRole('button', { name: 'Actua com a Forn de la Torre' })).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('Ara actues com a Forn de la Torre.');
  vista.unmount();
  mocks.identitat.memberships = [{ id: 'o-1', slug: 'forn', role: 'member' }];
  mocks.identitat.actor = null;
  render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  expect(screen.queryByRole('button', { name: 'Edita la fitxa' })).toBeNull();
  expect(screen.queryByRole('button', { name: /Actua com a/ })).toBeNull();
});

test('T43 · el correu públic d’una organització ix amb mailto validat; un correu dubtós o d’una persona, no', async () => {
  mocks.id = 'forn';
  mocks.load.mockResolvedValue({ ...FORN, correu: 'hola@forn.cat' });
  const vista = render(<PerfilPublicSection agents={mocks.agents} />);
  const enllac = await screen.findByRole('link', { name: 'hola@forn.cat' });
  expect(enllac.getAttribute('href')).toBe('mailto:hola@forn.cat');
  expect(enllac.closest('p').textContent).toBe('Correu: hola@forn.cat');
  vista.unmount();
  mocks.load.mockResolvedValue({ ...FORN, correu: 'hola@forn.cat?bcc=altre@x.cat' });
  const dubtos = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  expect(screen.queryByText(/Correu:/)).toBeNull();
  dubtos.unmount();
  mocks.load.mockResolvedValue({ ...IAIA, tipus: 'persona', esIA: false, correu: 'pepa@x.cat' });
  render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' });
  expect(screen.queryByText(/pepa@x\.cat/)).toBeNull();
});

/* T51 · Regla del Mestre (260928): cap document sense data. La fitxa pública
   porta la de creació o, si és posterior, la de l'última modificació. */
test('T51 · la barra taronja porta la data real de la fitxa: la modificació, si és posterior a la creació', async () => {
  mocks.load.mockResolvedValue({ ...IAIA, creat: '2026-08-01T09:00:00', modificat: '2026-09-27T17:30:00' });
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' });
  const pastilla = [...container.querySelectorAll('section.bar-orange .btn-date-time span')].map((s) => s.textContent);
  expect(pastilla).toEqual(['17:30', '27/09/26']);
});

/* Els mapejadors del port ja passen `creat` i `modificat` (supabase/perfils.js
   i localPerfils.js; ho fixa la prova de contracte): sense ells, cap font. */
test('T51 · un PerfilPublic sense `creat` ni `modificat` no porta pastilla (mai la d’ara)', async () => {
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' });
  expect(container.querySelector('section.bar-orange .btn-date-time')).toBeNull();
});

/* T66 (ordre del Mestre, 260928) · La fitxa pública pinta en lectura l'emoticona
   que la persona ha triat (DTO PerfilPublic.emoticona). Sense tria, la cel·la
   buida de sempre; mai la ploma ni cap botó. */
test('T66 · la barra taronja de la fitxa pública mostra l’emoticona triada, en lectura', async () => {
  mocks.load.mockResolvedValue({ ...IAIA, tipus: 'persona', esIA: false, nom: 'Pepa', emoticona: '🌾' });
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Pepa' });
  const glif = container.querySelector('section.bar-orange .sdp-emoticona-barra--glif');
  expect(glif.getAttribute('aria-label')).toBe('Emoticona del document: 🌾');
  expect(container.querySelector('section.bar-orange .sdp-emoticona-barra--boto')).toBeNull();
});

test('T66 · sense emoticona (o un DTO sense el camp) la cel·la queda buida, sense ploma', async () => {
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' });
  expect(container.querySelector('section.bar-orange .sdp-emoticona-barra--buida')).not.toBeNull();
  expect(container.querySelector('section.bar-orange .sdp-emoticona-barra--glif')).toBeNull();
  expect(container.querySelector('section.bar-orange .sdp-emoticona-barra--boto')).toBeNull();
});

/* Norma del Mestre, 261004 (prompt 261004_1108, logotips) · La pàgina d'una
   entitat porta dalt de l'H1 el seu logotip; la d'una persona, res. Abans,
   showLogos={false} el llevava a totes, sense cap ordre escrita. */
const logosDelTitol = (container) => [...container.querySelectorAll('header.page-title img')];
/* Onada 8 (261009) · El logotip rectangular de Sóc de Poble, clar i fosc: els PNG de 985x256 (abans, els SVG). */
const LOGOTIP_SDP = ['/assets/system/ui/logo-socdepoble-rect-negre-985x256.png', '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png'];

test('logotips · l’entitat del projecte (per identificador) porta el seu logotip rectangular, clar i fosc, davant de l’H1', async () => {
  mocks.id = ENTITAT_PILOT_SLUG;
  mocks.load.mockResolvedValue(ENTITAT);
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
  const capcalera = container.querySelector('header.page-title');
  expect([...capcalera.children].slice(0, 3).map((e) => `${e.tagName}.${e.className}`)).toEqual([
    'IMG.page-title-logo light-only', 'IMG.page-title-logo dark-only', 'H1.'
  ]);
  expect(logosDelTitol(container).map((img) => img.getAttribute('src'))).toEqual(LOGOTIP_SDP);
  expect(logosDelTitol(container).map((img) => img.getAttribute('alt'))).toEqual(['Logotip Sóc de Poble', 'Logotip Sóc de Poble']);
});

test('logotips · una altra entitat porta el seu logo_url, una sola imatge per als dos temes; sense logo_url, cap', async () => {
  mocks.id = 'forn';
  mocks.load.mockResolvedValue({ ...FORN, avatar: '/assets/forn.png' });
  const vista = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  await waitFor(() => expect(logosDelTitol(vista.container)).toHaveLength(1));
  const [logo] = logosDelTitol(vista.container);
  expect(logo.className).toBe('page-title-logo page-title-logo--entitat');
  expect(logo.getAttribute('src')).toBe('/assets/forn.png');
  expect(logo.getAttribute('alt')).toBe('Logotip de Forn de la Torre');
  expect(logo.getAttribute('referrerpolicy')).toBe('no-referrer');
  expect(logo.nextElementSibling.tagName).toBe('H1');
  vista.unmount();
  mocks.load.mockResolvedValue(FORN);
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  expect(logosDelTitol(container)).toHaveLength(0);
});

/* Revisió dels verificadors (front «logo», 261004) · En remot, l'entitat del
   projecte arriba amb l'id del servidor (un UUID) i el slug declarat. Abans,
   només la resolució de l'app el registrava: si esta fitxa responia primer, o
   si la resolució havia fallat i esperava 60 s, el bloc del títol pintava
   l'avatar quadrat (fins a 600x600) en lloc del logotip rectangular. */
const UUID_DEL_PROJECTE = '5f1c2a9e-7b3d-4e8a-9c0f-1a2b3c4d5e6f';

test('logotips · en remot, l’entitat del projecte (UUID amb el slug declarat) porta el rectangular des del primer render, mai l’avatar', async () => {
  mocks.id = ENTITAT_PILOT_SLUG;
  mocks.load.mockResolvedValue({
    ...ENTITAT, id: UUID_DEL_PROJECTE, slug: ENTITAT_PILOT_SLUG, propietari: false, avatar: '/assets/avatar-quadrat.png'
  });
  /* Ningú més no l'ha registrat: ni l'app ni cap prova anterior. */
  expect(rutaDAutoria({ tipus: 'entitat', id: UUID_DEL_PROJECTE })).not.toBe(RUTA_PERFIL_PROJECTE);
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
  const srcs = () => logosDelTitol(container).map((img) => img.getAttribute('src'));
  expect(srcs()).toEqual(LOGOTIP_SDP);
  expect(container.querySelector('.page-title-logo--entitat')).toBeNull();
  /* Ni després que l'avatar s'haja pogut resoldre. */
  await new Promise((resol) => { setTimeout(resol, 0); });
  expect(srcs()).not.toContain('/assets/avatar-quadrat.png');
  expect(rutaDAutoria({ tipus: 'entitat', id: UUID_DEL_PROJECTE })).toBe(RUTA_PERFIL_PROJECTE);
});

test('logotips · el nom no fa l’entitat del projecte: una altra que es diga «Sóc de Poble» porta el seu', async () => {
  mocks.id = 'impostora';
  mocks.load.mockResolvedValue({ ...FORN, id: 'o-9', slug: 'impostora', nom: 'Sóc de Poble', avatar: '/assets/impostora.png' });
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
  await waitFor(() => expect(logosDelTitol(container)).toHaveLength(1));
  expect(logosDelTitol(container)[0].getAttribute('src')).toBe('/assets/impostora.png');
});

/* Derogat per a la persona i la IAIA (ordre del Mestre, 261004, prompt
   261004_1108 línies 66-69 i T2): ja no comencen per l'H1, porten el seu
   avatar redó (proves de davall). Un grup continua sense res. */
test.each([
  ['un grup', { ...ENTITAT, tipus: 'grup', id: 'g-1', nom: 'Colla', propietari: false, avatar: '/assets/colla.png' }, 'Colla']
])('logotips · %s no porta cap logotip: el bloc del títol comença per l’H1', async (_que, dto, nom) => {
  mocks.load.mockResolvedValue(dto);
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: nom });
  expect(logosDelTitol(container)).toHaveLength(0);
  expect(container.querySelector('header.page-title').firstElementChild.tagName).toBe('H1');
});

/* Norma del Mestre, 261004 (prompt 261004_1108, línies 66-69 i T2) · Una
   persona o la IAIA porten el seu avatar redó davant de l'H1, mai un
   logotip. Si la fitxa és de qui mira, l'avatar és un botó que porta al
   canvi d'imatge del Perfil (el mateix destí que «Edita la fitxa»). */
test.each([
  ['una persona', { ...IAIA, tipus: 'persona', id: 'u-1', nom: 'Pepa', esIA: false, avatar: '/assets/pepa.png' }, 'Pepa'],
  ['la IAIA', { ...IAIA, avatar: '/assets/iaia.png' }, 'IAIA MarIA']
])('avatar · %s porta el seu avatar redó davant de l’H1, sense logotip', async (_que, dto, nom) => {
  mocks.load.mockResolvedValue(dto);
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: nom });
  const capcalera = container.querySelector('header.page-title');
  expect([...capcalera.children].map((e) => `${e.tagName}.${e.className}`).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']);
  const img = capcalera.querySelector('img.page-title-avatar__imatge');
  expect(img.getAttribute('src')).toBe(dto.avatar);
  expect(img.getAttribute('alt')).toBe(`Avatar de ${nom}`);
  expect(container.querySelector('.page-title-logo')).toBeNull();
  expect(container.querySelector('button.page-title-avatar')).toBeNull();
});

test('avatar · la fitxa pròpia d’una persona: l’avatar és un botó que porta al canvi d’imatge del Perfil', async () => {
  mocks.load.mockResolvedValue({ ...IAIA, tipus: 'persona', id: 'u-1', nom: 'Pepa', esIA: false, propietari: true, avatar: '/assets/pepa.png' });
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Pepa' });
  const boto = screen.getByRole('button', { name: 'Canvia la teua imatge' });
  expect(boto).toBe(container.querySelector('header.page-title > button.page-title-avatar'));
  fireEvent.click(boto);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/el-meu-perfil');
});

test('avatar · una persona sense avatar no porta res: el bloc del títol comença per l’H1', async () => {
  mocks.load.mockResolvedValue({ ...IAIA, tipus: 'persona', id: 'u-1', nom: 'Pepa', esIA: false, avatar: '' });
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Pepa' });
  expect(container.querySelector('header.page-title').firstElementChild.tagName).toBe('H1');
});

/* Correcció dels verificadors (ordre del Mestre, 261004; skill sdp-pedra-seca
   §11) · Al catàleg, JAVI (una persona) portava com a avatar_url la marca de
   Sóc de Poble, i la seua fitxa no la pintava com a avatar redó (PageFrame la
   rebutja).
   Onada 11 (261010; prompt 261010_1730, tasca 6, D8) · El catàleg porta ara la
   foto del padró pilot (PERSONA_PILOT.avatar): la fitxa la pinta com a avatar
   redó davant de l'H1, com la de qualsevol persona, i la marca no ix mai com
   a avatar. DEROGAT «ni avatar ni logotip: el bloc del títol comença per l'H1». */
test('avatar · la persona pilot del catàleg porta la foto del padró com a avatar redó, mai la marca de Sóc de Poble', async () => {
  mocks.config = { dataMode: 'seed' };
  mocks.capacitat = false;
  mocks.id = AGENTS_MAP.JAVI.id;
  const { container } = render(<PerfilPublicSection agents={[AGENTS_MAP.JAVI]} />);
  await screen.findByRole('heading', { level: 1, name: AGENTS_MAP.JAVI.name });
  expect(AGENTS_MAP.JAVI.avatar_url).toBe(PERSONA_PILOT.avatar);
  expect(AGENTS_MAP.JAVI.avatar_url).not.toBe(AGENTS_MAP.SOCDEPOBLE.avatar_url);
  const capcalera = container.querySelector('header.page-title');
  expect([...capcalera.children].map((e) => `${e.tagName}.${e.className}`).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']);
  expect(capcalera.querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe(PERSONA_PILOT.avatar);
  expect([...capcalera.querySelectorAll('img')].map((img) => img.getAttribute('src'))).not.toContain(AGENTS_MAP.SOCDEPOBLE.avatar_url);
  expect(container.querySelector('.page-title-logo')).toBeNull();
});

test('avatar · una entitat no porta avatar, porta el seu logotip (també la del projecte)', async () => {
  mocks.id = ENTITAT_PILOT_SLUG;
  mocks.load.mockResolvedValue(ENTITAT);
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
  expect(container.querySelector('.page-title-avatar')).toBeNull();
  expect(container.querySelectorAll('header.page-title img.page-title-logo')).toHaveLength(2);
});

test('fins i tot en seed una resposta nul·la del port és autoritativa', async () => {
  mocks.config = { dataMode: 'seed' };
  mocks.load.mockResolvedValue(null);
  render(<PerfilPublicSection agents={[{ id: 'iaia', name: 'IAIA inventada', type: 'AI' }]} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Perfil no trobat' })).toBeTruthy();
});

/* Ordre del Mestre (261008, grup C) · «Als perfils d'organització falta
   l'opció per triar el Poble [...] perquè aparega correctament el nom del
   poble a la barra taronja superior». La fila del directori porta town_name
   (2610081401) i el mapejador del port en fa el `poble` de la fitxa. */
test('grup C · el poble triat per l’organització (town_name) ix a la barra taronja de la seua fitxa pública', async () => {
  const perfilDOrganitzacio = (org) => ({
    tipus: org.kind === 'group' ? 'grup' : 'entitat', id: org.id, slug: org.slug || null, nom: org.name || '',
    avatar: org.logo_url || '', hero: org.hero_url || '', lema: org.lema || '', bio: org.description || '',
    presentacioHtml: '', poble: org.town_name || '', esIA: false, publicat: true, propietari: org.owner_id || null,
    copyright: 'tots_els_drets_reservats', correu: org.public_email || '', creat: null, modificat: null, emoticona: ''
  });
  const fila = { id: 'o1', slug: 'forn', name: 'Forn de la Torre', kind: 'company', lema: 'Pa de llenya', description: '' };
  mocks.id = 'forn';
  mocks.load.mockResolvedValue(perfilDOrganitzacio({ ...fila, town_name: 'Benilloba' }));
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  expect(container.querySelector('section.bar-orange .sp-card-author-location').textContent).toBe('Benilloba');
  cleanup();
  // Sense poble (o sense la columna, abans de la migració), la barra no s'inventa cap poble.
  mocks.load.mockResolvedValue(perfilDOrganitzacio(fila));
  const sense = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  expect(sense.container.querySelector('section.bar-orange .sp-card-author-location')?.textContent || '').toBe('');
  expect(sense.container.textContent).not.toContain('Benilloba');
});

/* ── Gauntlet 261016 (Bloc 3) · La identitat ─────────────────────────────── */

const etiquetesDelTitol = (container) => [...container.querySelectorAll('header.page-title .page-title-labels > li')].map((li) => li.textContent);
const dretsDelTitol = (container) => container.querySelector('header.page-title .page-title-copyright')?.textContent ?? null;

/* Regressió de la Fase 1 (T1, «Dignitat de persona») · Una persona no és una
   obra ni es categoritza: la seua fitxa pública no porta la píndola del tipus
   ni els drets, ni els desats (profiles.copyright és la llicència de sèrie de
   les seues notes, perfilCamps.js) ni el «© Nom» de reserva. Es queden el
   poble i «La teua fitxa». */
test('Gauntlet 261016 · una persona no porta la píndola del tipus ni els drets; es queden el poble i «La teua fitxa»', async () => {
  mocks.id = 'u-1';
  for (const copyright of ['', 'CC BY 4.0']) {
    mocks.load.mockResolvedValue({ ...IAIA, tipus: 'persona', id: 'u-1', slug: null, nom: 'Pepa', esIA: false, propietari: true, poble: 'Benilloba', copyright });
    const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
    await screen.findByRole('heading', { level: 1, name: 'Pepa' });
    expect([copyright, etiquetesDelTitol(container)]).toEqual([copyright, ['Benilloba', 'La teua fitxa']]);
    expect([copyright, dretsDelTitol(container)]).toEqual([copyright, null]);
    expect(container.querySelector('header.page-title').textContent).not.toMatch(/Persona|©|CC BY/);
    cleanup();
  }
});

/* Mana el tipus de l'objecte representat (objecteDePerfil): un tipus que el
   descriptor no coneix és una persona, i tampoc porta ni píndola ni drets. */
test('Gauntlet 261016 · un tipus desconegut és una persona per al descriptor: ni píndola ni drets', async () => {
  mocks.load.mockResolvedValue({ ...IAIA, tipus: 'veina', id: 'u-2', slug: null, nom: 'Rosa', esIA: false, poble: '' });
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Rosa' });
  expect(etiquetesDelTitol(container)).toEqual([]);
  expect(dretsDelTitol(container)).toBeNull();
});

/* L'entitat, el grup i la IA no canvien: la píndola del seu tipus i els seus
   drets, els triats o el «© Nom» de sempre. */
test.each([
  ['una entitat', () => ({ ...FORN }), 'Forn de la Torre', ['Entitat', 'La Torre de les Maçanes'], '© Forn de la Torre'],
  ['una entitat amb drets triats', () => ({ ...FORN, copyright: 'CC BY 4.0' }), 'Forn de la Torre', ['Entitat', 'La Torre de les Maçanes'], 'CC BY 4.0'],
  ['un grup', () => ({ ...FORN, tipus: 'grup', id: 'g-1', slug: 'colla', nom: 'Colla' }), 'Colla', ['Grup', 'La Torre de les Maçanes'], '© Colla'],
  ['la IAIA', () => IAIA, 'IAIA MarIA', ['Intel·ligència artificial', 'La Torre de les Maçanes'], '© IAIA MarIA']
])('Gauntlet 261016 · %s conserva la píndola del seu tipus i els seus drets', async (_que, dto, nom, etiquetes, drets) => {
  mocks.load.mockResolvedValue(dto());
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: nom });
  expect(etiquetesDelTitol(container)).toEqual(etiquetes);
  expect(dretsDelTitol(container)).toBe(drets);
});

/* Ordre del Mestre · Els personatges ANIMAL del catàleg (El Gall, Súper
   Ratolí, La Mixa i Sultan) són IA: personatges simbòlics, bots amb
   systemPrompt. La fitxa del catàleg es conserva, també el seu type 'ANIMAL';
   només canvia com es classifica (data/agentsSeed.js · tipusDAgent, la font
   única del directori, del perfil públic, de localPerfils i del Cercador). */
const ANIMALS = ['GALL', 'RATO', 'MIXA', 'SULTAN'].map((clau) => AGENTS_MAP[clau]);

test('Gauntlet 261016 · perfilDelCataleg: els personatges ANIMAL són IA, amb la seua fitxa sencera', async () => {
  const { perfilDelCataleg } = await import('./PerfilPublicSection.jsx');
  for (const agent of ANIMALS) {
    expect([agent.name, agent.type, tipusDAgent(agent)]).toEqual([agent.name, 'ANIMAL', 'ia']);
    expect(perfilDelCataleg(agent)).toMatchObject({
      tipus: 'ia', esIA: true, id: agent.id, nom: agent.name, avatar: agent.avatar_url, lema: agent.lema,
      bio: agent.role, presentacioHtml: agent.short_bio, poble: agent.town_name
    });
  }
  /* PERSON continua sent persona, AI una IA i COMPANY una entitat. */
  expect([AGENTS_MAP.JAVI, AGENTS_MAP.FLASH, AGENTS_MAP.SOCDEPOBLE].map(tipusDAgent)).toEqual(['persona', 'ia', 'entitat']);
});

/* El prefix de la ruta és orientatiu (App.jsx munta esta pàgina a /gent/:agentId
   i a /perfil/:agentId): la clau és l'id, i perfilDelCataleg el busca per id.
   L'avís i el botó porten el seu nom; mai els textos de la IAIA, ni la
   promesa de les frases fetes, que només fa ella (RESPOSTA_IAIA). */
test.each(ANIMALS.map((agent) => [agent.name, agent]))('Gauntlet 261016 · sense el port, la fitxa de «%s» és la d’una IA amb el seu nom', async (_nom, agent) => {
  mocks.config = { dataMode: 'seed' };
  mocks.capacitat = false;
  mocks.id = agent.id;
  const { container } = render(<PerfilPublicSection agents={[AGENTS_MAP.JAVI, ...ANIMALS]} />);
  await screen.findByRole('heading', { level: 1, name: agent.name });
  expect(etiquetesDelTitol(container)).toEqual(['Intel·ligència artificial', agent.town_name]);
  const avis = screen.getByRole('status');
  expect(avis.textContent).toContain('Este perfil és una intel·ligència artificial');
  expect(avis.textContent).toContain(`${agent.name} és una màquina de Sóc de Poble, en proves. No substituïx cap persona del poble.`);
  expect(avis.textContent).not.toMatch(/IAIA|frases fetes/);
  expect(screen.queryByRole('button', { name: 'Parla amb la IAIA' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: `Parla amb ${agent.name}` }));
  expect(mocks.navigate).toHaveBeenCalledWith(`/xat?amb=${agent.id}`);
  /* La boina porta a la seua ruta canònica d'IA; l'avatar redó és el seu. */
  expect(container.querySelector('section.bar-orange .sp-card-author').getAttribute('href')).toBe(`/perfil/${agent.id}`);
  expect(container.querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe(agent.avatar_url);
});

/* En llavor, pel port (localPerfils.js, que fa de servidor): una IA del
   catàleg que no és la IAIA i un personatge ANIMAL. */
test.each([['una IA del catàleg', 'NANOBANANA'], ['un personatge ANIMAL', 'SULTAN']])('Gauntlet 261016 · en llavor, pel port, %s porta l’avís i el botó amb el seu nom', async (_que, clau) => {
  const agent = AGENTS_MAP[clau];
  const perfils = createLocalPerfilsAdapter();
  mocks.config = { dataMode: 'seed' };
  mocks.id = agent.id;
  mocks.load.mockImplementation(async (id) => perfils.loadPerfilPublic(id, null));
  render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: agent.name });
  expect(mocks.load).toHaveBeenCalledWith(agent.id, mocks.config);
  expect(screen.getByText('Intel·ligència artificial', { selector: '.sp-card-label' })).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain(`${agent.name} és una màquina de Sóc de Poble, en proves.`);
  fireEvent.click(screen.getByRole('button', { name: `Parla amb ${agent.name}` }));
  expect(mocks.navigate).toHaveBeenCalledWith(`/xat?amb=${agent.id}`);
});

/* Pla aprovat, Onada 1.5 · /gent/javi-llinares resol la persona pilot. En
   llavor i en local, el port (localPerfils.js) ja resol qualsevol àlies de la
   persona pilot: sense sessió, la seua fitxa del catàleg; amb sessió, la seua
   fitxa.
   Revisió adversarial del Gauntlet 261016 (encàrrec C; pla aprovat, Onada 1
   punt 5, «Paritat total entre local i producció») · DEROGAT «en remot
   continua sent "Perfil no trobat"»: el servidor no resol cap persona per
   àlies i la ruta que el Mestre compartirà era morta en producció. Quan el
   servidor no la torna, la fitxa del catàleg (perfilDeLaPersonaPilot), la
   mateixa que en llavor sense sessió. L'adaptador remot de veres, amb sessió
   i sense, ho prova PerfilPublicSection.fundacionals.remot.test.jsx. */
test('Gauntlet 261016 · Onada 1.5: /gent/javi-llinares és la persona pilot en llavor, sense sessió i amb sessió, i en remot quan el servidor no la torna', async () => {
  expect(PERSONA_PILOT.alies).toContain('javi-llinares');
  const perfils = createLocalPerfilsAdapter();
  mocks.config = { dataMode: 'seed' };
  mocks.id = 'javi-llinares';
  mocks.load.mockImplementation(async (id) => perfils.loadPerfilPublic(id, null));
  const convidat = render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: AGENTS_MAP.JAVI.name });
  expect(convidat.container.querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe(PERSONA_PILOT.avatar);
  expect(etiquetesDelTitol(convidat.container)).toEqual([AGENTS_MAP.JAVI.town_name]);
  expect(dretsDelTitol(convidat.container)).toBeNull();
  cleanup();
  const usuari = { id: 'u-javi', user_metadata: { full_name: 'Javi Pilot' } };
  mocks.load.mockImplementation(async (id) => perfils.loadPerfilPublic(id, usuari));
  const ambSessio = render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: 'Javi Pilot' });
  expect(etiquetesDelTitol(ambSessio.container)).toEqual(['La Torre de les Maçanes', 'La teua fitxa']);
  expect(dretsDelTitol(ambSessio.container)).toBeNull();
  cleanup();
  mocks.config = { dataMode: 'remote' };
  mocks.load.mockResolvedValue(null);
  const remot = render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: AGENTS_MAP.JAVI.name });
  expect(remot.container.querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe(PERSONA_PILOT.avatar);
  expect(etiquetesDelTitol(remot.container)).toEqual([AGENTS_MAP.JAVI.town_name]);
  expect(dretsDelTitol(remot.container)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Edita la fitxa' })).toBeNull();
});
