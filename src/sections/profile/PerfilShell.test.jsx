import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  workspace: null, proveidor: null, dialeg: null, perfil: null, refresh: vi.fn(), toast: vi.fn(), caps: new Set(),
}));
vi.mock('../../components/universal/workspace', () => ({ UniversalWorkspace: (props) => { m.workspace = props; return null; } }));
vi.mock('./PerfilContext.jsx', () => ({
  PerfilProvider: ({ children, ...props }) => { m.proveidor = props; return children; },
  usePerfil: () => m.perfil,
}));
vi.mock('./PerfilEditor.jsx', () => ({ PerfilEditor: ({ identitat }) => <p>{`fitxa de ${identitat.nom}`}</p> }));
vi.mock('./DetallCompte.jsx', () => ({ DetallCompte: ({ identitat }) => <p>{`compte de ${identitat.nom}`}</p> }));
vi.mock('./DetallPrivacitat.jsx', () => ({
  DetallPrivacitat: ({ identitat, config, onPerfilCanviat }) => (
    <p data-recarrega={String(onPerfilCanviat === m.perfil.recarrega)} data-tenant={config?.tenantId}>{`privacitat de ${identitat.nom}`}</p>
  ),
}));
vi.mock('./DialegNovaOrganitzacio.jsx', () => ({
  DialegNovaOrganitzacio: (props) => { m.dialeg = props; return props.obert ? <div role="dialog" aria-label="Nova organització" /> : null; },
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ refresh: m.refresh }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUI: () => ({ externalConfig: { tenantId: 'T' } }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }));
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
import PerfilShell, { empresesMare, itemsDePerfil } from './PerfilShell.jsx';

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
    ['app-gestoria', 'Gestoria de Poble'], ['app-llibreria', 'Llibreria'], ['app-ajuntament', 'Ajuntament'],
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
  expect(filsDe('jo')).toEqual(['jo-fitxa', 'jo-compte', 'jo-privacitat']);
  expect(filsDe('O')).toEqual(['O-fitxa', 'O-compte']);
  expect(filsDe('G')).toEqual(['G-fitxa', 'G-compte']);
  expect(filsDe('app-gestoria')).toEqual(['app-gestoria-sobre']);
  expect(filsDe('app-llibreria')).toEqual(['app-llibreria-sobre']);
  expect(filsDe('app-ajuntament')).toEqual(['app-ajuntament-sobre']);
  expect(filsDe('sense-organitzacions')).toEqual([]);
  expect(item('jo-privacitat')).toMatchObject({ title: 'Privacitat i dades' });
  expect(item('app-gestoria-sobre')).toMatchObject({ title: 'Sobre esta utilitat', subtitle: 'Pendent de connectar en este node' });
  expect(itemsDePerfil([jo])[0]).toMatchObject({ title: 'La fitxa', subtitle: 'Pep', image: 'a.webp', categoryIds: ['jo'] });
});

test('«Privacitat i dades» només apareix si el backend declara «compte» o «consentiment»', () => {
  const vista = render(<PerfilShell />);
  expect(filsDe('jo')).toEqual(['jo-fitxa', 'jo-compte']);
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
  expect(privacitat.dataset.tenant).toBe('T');
  expect(m.workspace.renderDetail({ item: { data: { vista: 'fitxa', identitatId: 'cap' } } })).toBeNull();
  expect(m.workspace.renderDetail({ item: null })).toBeNull();
});

test('una aplicació pendent: pàgina de lectura amb nom, descripció i estat, sense cap botó ni enllaç', () => {
  render(<PerfilShell />);
  for (const [id, nom] of [['gestoria', 'Gestoria de Poble'], ['llibreria', 'Llibreria'], ['ajuntament', 'Ajuntament']]) {
    const vista = render(m.workspace.renderDetail({ item: item(`app-${id}-sobre`) }));
    expect(screen.getByRole('heading', { level: 1, name: nom })).toBeTruthy();
    expect(screen.getByText('Pendent de connectar en este node')).toBeTruthy();
    expect(screen.queryAllByRole('button')).toEqual([]);
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

test('el proveïdor rep el refresh d’IdentitatContext i la configuració', () => {
  render(<PerfilShell />);
  expect(m.proveidor.onCanviOrganitzacions).toBe(m.refresh);
  expect(m.proveidor.config).toEqual({ tenantId: 'T' });
});

test('només les empreses que la persona mana poden ser mare', () => {
  expect(empresesMare([jo, forn, botiga, { id: 'G', mena: 'grup', nom: 'Colla', dades: { role: 'owner' } }]))
    .toEqual([{ valor: 'O', etiqueta: 'Forn' }]);
});

test('onCreate obri el diàleg; cancel·lar resol la promesa amb null', async () => {
  render(<PerfilShell />);
  let promesa;
  act(() => { promesa = m.workspace.onCreate(); });
  expect(screen.getByRole('dialog', { name: 'Nova organització' })).toBeTruthy();
  expect(m.dialeg.empresesMare).toEqual([{ valor: 'O', etiqueta: 'Forn' }]);
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
  m.perfil.creaOrganitzacio.mockRejectedValue(new Error('Un grup necessita una empresa mare.'));
  render(<PerfilShell />);
  act(() => { m.workspace.onCreate(); });
  await expect(m.dialeg.onCrea({ name: 'Colla', slug: 'colla', kind: 'group' })).rejects.toThrow('empresa mare');
  expect(screen.getByRole('dialog')).toBeTruthy();
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
