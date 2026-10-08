import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  workspace: null, proveidor: null, dialeg: null, perfil: null, refresh: vi.fn(), toast: vi.fn(), caps: new Set(),
  actor: null, params: new URLSearchParams(), ui: null,
}));
vi.mock('../../components/universal/workspace', () => ({ UniversalWorkspace: (props) => { m.workspace = props; return null; } }));
vi.mock('./PerfilContext.jsx', () => ({
  PerfilProvider: ({ children, ...props }) => { m.proveidor = props; return children; },
  usePerfil: () => m.perfil,
}));
vi.mock('./PerfilEditor.jsx', () => ({ PerfilEditor: ({ identitat }) => <p>{`fitxa de ${identitat.nom}`}</p> }));
vi.mock('./DetallCompte.jsx', () => ({
  DetallCompte: ({ identitat, ambMembres }) => <p data-membres={String(ambMembres)}>{`compte de ${identitat.nom}`}</p>,
}));
/* Ordre del Mestre (261008) · «Les vistes»: la seua pàgina té proves pròpies (DetallVistes.test.jsx). */
vi.mock('./DetallVistes.jsx', () => ({ DetallVistes: ({ identitat }) => <p>{`vistes de ${identitat.nom}`}</p> }));
vi.mock('./DetallPrivacitat.jsx', () => ({
  DetallPrivacitat: ({ identitat, config, onPerfilCanviat }) => (
    <p data-recarrega={String(onPerfilCanviat === m.perfil.recarrega)} data-tenant={config?.tenantId}>{`privacitat de ${identitat.nom}`}</p>
  ),
}));
vi.mock('./DialegNovaOrganitzacio.jsx', () => ({
  DialegNovaOrganitzacio: (props) => { m.dialeg = props; return props.obert ? <div role="dialog" aria-label="Nova organització" /> : null; },
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ refresh: m.refresh, actor: m.actor }) }));
/* T9 · configurable: «Els nodes» llig externalConfig (nomPoble, dataMode) i status. */
vi.mock('../../app/contexts/UIContext', () => ({ useUI: () => m.ui }));
vi.mock('../../app/contexts/RouterContext', () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
  useSearchParams: () => [m.params],
}));
vi.mock('../../components/universal/ContentProvider', () => ({ useContent: () => null }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, lead, labels = [], children }) => (
    <main>
      <header className="page-title"><h1>{title}</h1></header><p>{lead}</p>
      <ul aria-label="Etiquetes">{labels.map((l) => <li key={l.text}>{l.text}</li>)}</ul>
      {children}
    </main>
  ),
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: (cap) => m.caps.has(cap) }));
import PerfilShell, * as modulShell from './PerfilShell.jsx';

const { itemsDePerfil } = modulShell;

const jo = { id: 'jo', mena: 'persona', nom: 'Pep', avatar: 'a.webp', dades: {} };
const forn = { id: 'O', mena: 'empresa', nom: 'Forn', dades: { role: 'owner' } };
const colla = { id: 'G', mena: 'grup', nom: 'Colla', dades: { role: 'member' } };
const botiga = { id: 'B', mena: 'empresa', nom: 'Botiga', dades: { role: 'member' } };

const grups = () => m.workspace.model.navigationGroups;
const filsDe = (categoria) => m.workspace.model.items.filter((i) => i.categoryIds.includes(categoria)).map((i) => i.id);
const item = (id) => m.workspace.model.items.find((i) => i.id === id);

beforeEach(() => {
  m.workspace = null; m.proveidor = null; m.dialeg = null; m.refresh.mockClear(); m.toast.mockClear();
  m.caps = new Set();
  m.actor = null; m.params = new URLSearchParams();
  m.ui = { externalConfig: { tenantId: '00000000-0000-4000-8000-000000000000' } };
  m.perfil = {
    identitats: [jo, forn, colla], carregant: false, error: null,
    guardarAjust: vi.fn(), pujaMitja: vi.fn(), recarrega: vi.fn(), creaOrganitzacio: vi.fn(),
  };
});
afterEach(cleanup);

test('primera columna: tres grups en ordre, la persona amb el seu nom, les organitzacions i les aplicacions', () => {
  render(<PerfilShell />);
  expect(grups().map((g) => g.id)).toEqual(['persona', 'organitzacions', 'aplicacions']);
  // Com les carpetes de Notes: el primer grup no porta etiqueta, el títol de la columna li fa de capçalera.
  expect(grups().map((g) => g.label)).toEqual([null, 'GRUPS I EMPRESES', 'APLICACIONS']);
  expect(grups()[0].options.map((o) => [o.id, o.label])).toEqual([['jo', 'Pep']]);
  expect(grups()[1].options.map((o) => [o.id, o.label])).toEqual([['O', 'Forn'], ['G', 'Colla']]);
  expect(grups()[2].options.map((o) => [o.id, o.label])).toEqual([
    ['app-gestoria', 'Gestoria de Poble'], ['app-metriques', 'Consola de Mètriques'],
    ['app-lector-rss', 'Curation AI (Lector RSS)'], ['app-cervell', 'Cervell (Node Graph)'], ['app-snippet', 'Snippet'],
  ]);
  for (const opcio of grups().flatMap((g) => g.options)) expect(opcio.icon).toBeTruthy();
  expect(grups()[1].options[0].icon).not.toBe(grups()[1].options[1].icon);
  expect(m.workspace.labels).toMatchObject({ categories: 'PERFIL', items: 'APARTATS', create: 'NOVA ORG' });
  expect(m.workspace.icons.categories).toBeTruthy();
  expect(m.workspace.initialSelection).toEqual({ categoryId: 'jo' });
  expect(m.workspace.model.itemsComplete).toBe(true);
});

test('sense organitzacions el grup es mostra igualment, amb una opció que explica com crear-ne una', () => {
  m.perfil = { ...m.perfil, identitats: [jo] };
  render(<PerfilShell />);
  expect(grups()[1]).toMatchObject({ label: 'GRUPS I EMPRESES', options: [{ id: 'sense-organitzacions', label: 'Encara no en tens cap' }] });
  expect(filsDe('sense-organitzacions')).toEqual(['sense-organitzacions-crear']);
  render(m.workspace.renderDetail({ item: item('sense-organitzacions-crear') }));
  expect(screen.getByRole('heading', { level: 1, name: 'Grups i empreses' })).toBeTruthy();
  expect(screen.getByText(/botó NOVA ORG/)).toBeTruthy();
  expect(screen.queryAllByRole('button')).toEqual([]);
  // El botó NOVA ORG continua obrint el diàleg.
  expect(typeof m.workspace.onCreate).toBe('function');
});

test('segona columna: els fills de cada element segons el tipus', () => {
  m.caps = new Set(['compte']);
  render(<PerfilShell />);
  /* T9 (261001) · «Els nodes» és l'últim apartat de la persona; una organització no en té.
     Ordre del Mestre (261008) · «Les vistes» just després de «La fitxa», només
     per a qui la pot editar: la Colla (membre) no en té. */
  expect(filsDe('jo')).toEqual(['jo-fitxa', 'jo-vistes', 'jo-compte', 'jo-privacitat', 'jo-nodes']);
  expect(filsDe('O')).toEqual(['O-fitxa', 'O-vistes', 'O-compte']);
  expect(filsDe('G')).toEqual(['G-fitxa', 'G-compte']);
  expect(filsDe('app-gestoria')).toEqual(['app-gestoria-sobre']);
  for (const id of ['metriques', 'lector-rss', 'cervell', 'snippet']) {
    expect(filsDe(`app-${id}`)).toEqual([`app-${id}-sobre`]);
  }
  expect(filsDe('sense-organitzacions')).toEqual([]);
  expect(item('jo-privacitat')).toMatchObject({ title: 'Privacitat i dades' });
  expect(item('app-gestoria-sobre')).toMatchObject({ title: 'Sobre esta utilitat', subtitle: 'Pendent de connectar en este node' });
  expect(itemsDePerfil([jo])[0]).toMatchObject({ title: 'La fitxa', subtitle: 'Pep', image: 'a.webp', categoryIds: ['jo'] });
});

/* Ordre del Mestre (261008) · «Vista A4 / PDF», «Crear portada» i «Vista
   targeta» ixen de l'espai d'edició i fan un apartat més, com «El compte». */
test('261008 · «Les vistes»: l’apartat, la icona de l’ull i la seua pàgina; per a la persona, l’organització que mana i els agents', async () => {
  const { Eye } = await import('lucide-react');
  render(<PerfilShell />);
  expect(item('jo-vistes')).toMatchObject({
    title: 'Les vistes', subtitle: 'Vista A4 / PDF, portada i targeta', categoryIds: ['jo'],
    data: { vista: 'vistes', identitatId: 'jo' },
  });
  expect(item('jo-vistes').icon).toBe(Eye);
  expect(item('jo-vistes').searchText).toContain('portada');
  render(m.workspace.renderDetail({ item: item('jo-vistes') }));
  render(m.workspace.renderDetail({ item: item('O-vistes') }));
  expect(screen.getByText('vistes de Pep')).toBeTruthy();
  expect(screen.getByText('vistes de Forn')).toBeTruthy();
  // Un agent IA només té fitxa i les seues vistes.
  const agent = { id: 'A', mena: 'agent', nom: 'IAIA', dades: {} };
  expect(itemsDePerfil([jo, agent]).filter((i) => i.categoryIds.includes('A')).map((i) => i.id)).toEqual(['A-fitxa', 'A-vistes']);
});

test('261008 · «Les vistes» no hi és per a qui no pot editar la fitxa: un membre, una baixa en curs o la fila de reserva', () => {
  const ids = (identitats) => itemsDePerfil(identitats).map((i) => i.id);
  expect(ids([colla, botiga])).toEqual(['G-fitxa', 'G-compte', 'B-fitxa', 'B-compte']);
  expect(ids([{ ...forn, dades: { role: 'admin' } }])).toEqual(['O-fitxa', 'O-vistes', 'O-compte']);
  expect(ids([{ ...jo, dades: { baixa_demanada_at: '2026-09-26T10:00:00Z' } }])).not.toContain('jo-vistes');
  expect(ids([{ ...jo, dades: { reserva: true } }])).not.toContain('jo-vistes');
});

test('«Privacitat i dades» només apareix si el backend declara «compte» o «consentiment»', () => {
  const vista = render(<PerfilShell />);
  expect(filsDe('jo')).toEqual(['jo-fitxa', 'jo-vistes', 'jo-compte', 'jo-nodes']);
  m.caps = new Set(['consentiment']);
  vista.rerender(<PerfilShell />);
  expect(filsDe('jo')).toContain('jo-privacitat');
  // Una organització no en té mai.
  expect(filsDe('O')).not.toContain('O-privacitat');
});

test('tercera columna: l’editor per a la fitxa, El compte, i Privacitat i dades', () => {
  m.caps = new Set(['compte', 'consentiment']);
  render(<PerfilShell />);
  render(m.workspace.renderDetail({ item: item('jo-fitxa') }));
  render(m.workspace.renderDetail({ item: item('O-compte') }));
  render(m.workspace.renderDetail({ item: item('jo-privacitat') }));
  expect(screen.getByText('fitxa de Pep')).toBeTruthy();
  expect(screen.getByText('compte de Forn')).toBeTruthy();
  const privacitat = screen.getByText('privacitat de Pep');
  expect(privacitat.dataset.recarrega).toBe('true');
  // La configuració arriba sencera: el tenant (UUID sintètic) és el de l'externalConfig del beforeEach.
  expect(privacitat.dataset.tenant).toBe('00000000-0000-4000-8000-000000000000');
  expect(m.workspace.renderDetail({ item: { data: { vista: 'fitxa', identitatId: 'cap' } } })).toBeNull();
  expect(m.workspace.renderDetail({ item: null })).toBeNull();
});

test('una aplicació pendent: estat honest, només la preferència del Panell i cap enllaç d’obertura', () => {
  render(<PerfilShell />);
  for (const [id, nom] of [['gestoria', 'Gestoria de Poble'], ['metriques', 'Consola de Mètriques'], ['lector-rss', 'Curation AI (Lector RSS)'], ['cervell', 'Cervell (Node Graph)'], ['snippet', 'Snippet']]) {
    const vista = render(m.workspace.renderDetail({ item: item(`app-${id}-sobre`) }));
    expect(screen.getByRole('heading', { level: 1, name: nom })).toBeTruthy();
    expect(screen.getByText('Pendent de connectar en este node')).toBeTruthy();
    /* Ordre del Mestre (261007, prompt 261007_1628, peça C) · Sense
       preferència la utilitat ja és al Panell: el botó diu «Ocultar». */
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Ocultar del Panell de Control']);
    expect(screen.queryAllByRole('link')).toEqual([]);
    vista.unmount();
  }
});

test('una instància federada hi endolla les seues utilitats: la connectada s’enllaça, la mal formada no es pinta', () => {
  const Icona = () => null;
  render(<PerfilShell aplicacions={[
    { id: 'forn-comunal', nom: 'Forn comunal', descripcio: 'Torns del forn.', icona: Icona, estat: 'connectada', ruta: '/mercat' },
    { id: 'Mal Format', nom: 'No' },
    { id: 'forn-comunal', nom: 'Repetida' },
  ]} />);
  expect(grups()[2].options.map((o) => o.id)).toEqual(['app-forn-comunal']);
  render(m.workspace.renderDetail({ item: item('app-forn-comunal-sobre') }));
  expect(screen.getByText('Connectada en este node')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Obrir Forn comunal' }).getAttribute('href')).toBe('/mercat');
});

test('sense utilitats, cap capçalera APLICACIONS buida', () => {
  render(<PerfilShell aplicacions={[]} />);
  expect(grups().map((g) => g.id)).toEqual(['persona', 'organitzacions']);
});

test('el detall del Perfil porta la classe que el deixa sense scroll propi (el fa la pàgina)', () => {
  render(<PerfilShell />);
  expect(m.workspace.className).toBe('perfil-espai');
  expect(m.workspace.detailClassName).toBe('perfil-espai__detall');
});

/* Els botons del Perfil viuen dins de .perfil-pagina (PerfilShell.css,
   PerfilShell.ambit.test.js): la pàgina, el diàleg de NOVA ORG, l'espera i el
   botó de reintent de l'error en queden dins. */
test('l’àmbit dels botons del Perfil abraça la pàgina, el diàleg de NOVA ORG, l’espera i l’error', () => {
  const vista = render(<PerfilShell />);
  expect(vista.container.firstChild.className).toBe('sdp-gestor-pagina perfil-pagina');
  act(() => { m.workspace.onCreate(); });
  expect(screen.getByRole('dialog', { name: 'Nova organització' }).closest('.perfil-pagina')).toBe(vista.container.firstChild);
  m.perfil = { ...m.perfil, carregant: true };
  vista.rerender(<PerfilShell />);
  expect(screen.getByText('Carregant el teu perfil…').closest('.perfil-pagina')).toBeTruthy();
  m.perfil = { ...m.perfil, carregant: false, error: 'Sense xarxa' };
  vista.rerender(<PerfilShell />);
  expect(screen.getByRole('button', { name: 'Tornar a provar' }).closest('.perfil-pagina')).toBeTruthy();
});

test('el proveïdor rep el refresh d’IdentitatContext i la configuració', () => {
  render(<PerfilShell />);
  expect(m.proveidor.onCanviOrganitzacions).toBe(m.refresh);
  expect(m.proveidor.config).toEqual({ tenantId: '00000000-0000-4000-8000-000000000000' });
});

/* Ordre del Mestre (261008) · «un grup no té per què pertànyer a cap empresa»:
   el diàleg de NOVA ORG ja no rep cap llista de mares, i PerfilShell ja no la
   reexporta (perfilModel.mare.test.js continua vigilant empresesMare). */
test('261008 · el diàleg de NOVA ORG ja no rep empresesMare, i PerfilShell ja no la reexporta', () => {
  render(<PerfilShell />);
  act(() => { m.workspace.onCreate(); });
  expect(m.dialeg).not.toHaveProperty('empresesMare');
  expect(Object.hasOwn(modulShell, 'empresesMare')).toBe(false);
});

/* Contracte amb el grup de les organitzacions (261008) · «El compte» rep
   ambMembres del context del Perfil; sense declarar-ho (undefined), false. */
test('261008 · «El compte» rep ambMembres del context; sense, false', () => {
  render(<PerfilShell />);
  expect(m.workspace.renderDetail({ item: item('O-compte') }).props.ambMembres).toBe(false);
  cleanup();
  m.perfil = { ...m.perfil, ambMembres: true };
  render(<PerfilShell />);
  const detall = render(m.workspace.renderDetail({ item: item('O-compte') }));
  expect(detall.getByText('compte de Forn').dataset.membres).toBe('true');
});

test('onCreate obri el diàleg; cancel·lar resol la promesa amb null', async () => {
  render(<PerfilShell />);
  let promesa;
  act(() => { promesa = m.workspace.onCreate(); });
  expect(screen.getByRole('dialog', { name: 'Nova organització' })).toBeTruthy();
  act(() => m.dialeg.onTanca('boto'));
  await expect(promesa).resolves.toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
  /* No es desmunta: passa a obert=false, i així Dialeg torna el focus a NOVA ORG. */
  expect(m.dialeg.obert).toBe(false);
});

test('crear resol la promesa amb la fitxa nova quan la identitat ja és al model', async () => {
  const nova = { id: 'O2', name: 'Colla' };
  m.perfil.creaOrganitzacio.mockResolvedValue(nova);
  m.perfil = { ...m.perfil, identitats: [jo] };
  const vista = render(<PerfilShell />);
  let promesa, resolta = null;
  act(() => { promesa = m.workspace.onCreate(); });
  promesa.then((v) => { resolta = v; });
  await act(() => m.dialeg.onCrea({ name: 'Colla', slug: 'colla', kind: 'company' }));
  expect(m.perfil.creaOrganitzacio).toHaveBeenCalledWith({ name: 'Colla', slug: 'colla', kind: 'company' });
  expect(m.toast).toHaveBeenCalledWith('«Colla» ja és al teu perfil.', 'success');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(resolta).toBeNull();
  // La identitat arriba al context: ara el Workspace ja la pot trobar, i l'avís de grup buit se'n va.
  m.perfil = { ...m.perfil, identitats: [jo, { id: 'O2', mena: 'empresa', nom: 'Colla', dades: { role: 'owner' } }] };
  vista.rerender(<PerfilShell />);
  await expect(promesa).resolves.toEqual({ id: 'O2-fitxa' });
  expect(m.workspace.model.items.map((i) => i.id)).toContain('O2-fitxa');
  expect(grups()[1].options.map((o) => o.id)).toEqual(['O2']);
  expect(filsDe('sense-organitzacions')).toEqual([]);
});

test('si crear falla, l’error torna al diàleg i la promesa espera', async () => {
  m.perfil.creaOrganitzacio.mockRejectedValue(new Error('Eixe identificador ja és d’una altra organització.'));
  render(<PerfilShell />);
  act(() => { m.workspace.onCreate(); });
  await expect(m.dialeg.onCrea({ name: 'Colla', slug: 'colla', kind: 'group' })).rejects.toThrow('identificador');
  expect(screen.getByRole('dialog')).toBeTruthy();
});

/* T43 (ordre del Mestre, 260928) · què obri primer el Perfil. */
test('T43 · actuant com una entitat seua, el Perfil obri la seua fitxa; una que no és seua, la persona', () => {
  m.actor = { tipus: 'entitat', id: 'O', nom: 'Forn' };
  const vista = render(<PerfilShell />);
  expect(m.workspace.initialSelection).toEqual({ categoryId: 'O' });
  vista.unmount();
  m.actor = { tipus: 'entitat', id: 'desconeguda', nom: 'Altra' };
  render(<PerfilShell />);
  expect(m.workspace.initialSelection).toEqual({ categoryId: 'jo' });
});

test('T43 · «Edita la fitxa de {Org}» (?organitzacio=ID) mana sobre l’actor, sense canviar d’identitat', () => {
  m.actor = { tipus: 'persona', id: 'jo', nom: 'Pep' };
  m.params = new URLSearchParams('organitzacio=G');
  render(<PerfilShell />);
  expect(m.workspace.initialSelection).toEqual({ categoryId: 'G' });
});

test('T43 · «El compte» d’una organització rep el seu correu tal com l’ha llegit el context', () => {
  const contacte = { estat: 'llest', correu: 'forn@x.cat', public: false, perDefecte: { origen: 'cap', correu: null } };
  m.perfil = { ...m.perfil, contactes: { O: contacte } };
  render(<PerfilShell />);
  const detall = m.workspace.renderDetail({ item: item('O-compte') });
  expect(detall.props.contacte).toBe(contacte);
  expect(m.workspace.renderDetail({ item: item('G-compte') }).props.contacte).toBeNull();
});

test('mentre carrega o si falla, ho diu', () => {
  m.perfil = { ...m.perfil, carregant: true };
  const vista = render(<PerfilShell />);
  expect(screen.getByText('Carregant el teu perfil…')).toBeTruthy();
  m.perfil = { ...m.perfil, carregant: false, error: 'Sense xarxa' };
  vista.rerender(<PerfilShell />);
  expect(screen.getByRole('alert').textContent).toContain('Sense xarxa');
  // Sense reintent es perdia l'accés a «El compte» i a «Privacitat i dades».
  fireEvent.click(screen.getByRole('button', { name: 'Tornar a provar' }));
  expect(m.perfil.recarrega).toHaveBeenCalledTimes(1);
});

/* T9 (ordre del Mestre, 261001) · «Els nodes»: on està connectada la persona. */
test('T9 · «Els nodes» dins d’un amfitrió: el seu node actiu amb «Connexió activa», Sóc de Poble després, enllaç a /fedivers i cap botó', () => {
  m.ui = { externalConfig: { tenantId: '00000000-0000-4000-8000-000000000000', nomPoble: 'Gent de la Torre', dataMode: 'remote' }, status: 'ready' };
  render(<PerfilShell />);
  expect(item('jo-nodes')).toMatchObject({ title: 'Els nodes', subtitle: 'On estàs connectat', data: { vista: 'nodes', identitatId: 'jo' } });
  const { container } = render(m.workspace.renderDetail({ item: item('jo-nodes') }));
  expect(screen.getByRole('heading', { level: 1, name: 'Els nodes' })).toBeTruthy();
  const fills = [...container.querySelectorAll('ul.sdp-llista-nodes > li')];
  expect(fills.map((li) => li.querySelector('strong').textContent)).toEqual(['Gent de la Torre', 'Sóc de Poble']);
  expect(fills.map((li) => li.getAttribute('aria-current'))).toEqual(['true', null]);
  expect(fills[0].querySelector('.sdp-pilot').getAttribute('data-estat')).toBe('connectat');
  expect(fills[0].querySelector('.sdp-pilot').getAttribute('aria-hidden')).toBe('true');
  expect(fills[0].querySelector('.sr-only').textContent).toBe('Connexió activa');
  expect(fills[1].querySelector('.sdp-pilot')).toBeNull();
  expect(screen.getByRole('link', { name: 'Com funcionen els nodes i el Fedivers' }).getAttribute('href')).toBe('/fedivers');
  expect(screen.queryAllByRole('button')).toEqual([]);
  // Cap hostname del backend a la pàgina.
  expect(container.textContent).not.toMatch(/supabase|https?:\/\//i);
});

test('T9 · «Els nodes» sense amfitrió (socdepoble.org): només Sóc de Poble, actiu; en llavor, groc i «Sense connexió»', () => {
  m.ui = { externalConfig: { tenantId: '00000000-0000-4000-8000-000000000000', dataMode: 'seed' }, status: 'ready' };
  render(<PerfilShell />);
  const { container } = render(m.workspace.renderDetail({ item: item('jo-nodes') }));
  const fills = [...container.querySelectorAll('ul.sdp-llista-nodes > li')];
  expect(fills).toHaveLength(1);
  expect(fills[0].getAttribute('aria-current')).toBe('true');
  expect(fills[0].querySelector('strong').textContent).toBe('Sóc de Poble');
  expect(fills[0].querySelector('.sdp-pilot').getAttribute('data-estat')).toBe('desconnectat');
  expect(fills[0].querySelector('.sr-only').textContent).toBe('Sense connexió');
});

test('T9 · una instància federada hi pot afegir nodes, que mai són actius', () => {
  m.ui = { externalConfig: { tenantId: '00000000-0000-4000-8000-000000000000', dataMode: 'remote' }, status: 'loading' };
  render(<PerfilShell nodes={[{ id: 'la-vall', nom: 'La Vall', actiu: true }, { id: 'Mal Format', nom: 'No' }]} />);
  const { container } = render(m.workspace.renderDetail({ item: item('jo-nodes') }));
  const fills = [...container.querySelectorAll('ul.sdp-llista-nodes > li')];
  expect(fills.map((li) => li.querySelector('strong').textContent)).toEqual(['Sóc de Poble', 'La Vall']);
  expect(fills.map((li) => li.getAttribute('aria-current'))).toEqual(['true', null]);
  expect(fills[0].querySelector('.sdp-pilot').getAttribute('data-estat')).toBe('connectant');
});
