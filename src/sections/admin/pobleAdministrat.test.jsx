import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ caps: ['administracioMultipoble', 'personalitzacio'], sessio: null, config: null, llista: vi.fn(), llig: vi.fn(), desa: vi.fn(), historial: vi.fn(), globalRefresh: vi.fn() }));
vi.mock('../../app/contexts/UIContext.jsx', () => ({ useUIStateOpcional: () => ({ externalConfig: m.config }), useUIActionsOpcional: () => null }));
vi.mock('../../config/runtimePolicy.js', () => ({ getRuntimePolicy: () => null }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => m.sessio, useSessioOpcional: () => m.sessio }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ status: 'ready', personalitzacio: { taxonomia: { payload: { categories: ['Global aliena'] }, versio: 99 } }, refresh: m.globalRefresh }) }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: cap => m.caps.includes(cap), adminLlistaPobles: (...a) => m.llista(...a), adminLligPersonalitzacio: (...a) => m.llig(...a),
  adminDesaPersonalitzacio: (...a) => m.desa(...a), adminHistorialPersonalitzacio: (...a) => m.historial(...a)
}));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children, title }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main> }));
import { usePobleAdministrat } from './pobleAdministrat.jsx';
import { FacetaTaxonomia } from './FacetaTaxonomia.jsx';
import { FacetaEstil } from './FacetaEstil.jsx';
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
const pobles = [{ id: A, slug: 'sella', nom: 'Sella' }, { id: B, slug: 'xixona', nom: 'Xixona' }];
const taxonomia = (nom, versio = 7) => ({ taxonomia: { payload: { v: 1, pagines: {}, categories: [nom], etiquetes: [] }, versio }, estil: null });
function Harness({ actiu = true, estil = false }) {
  const ambit = usePobleAdministrat(actiu);
  if (!ambit) return <p>Sense gestió multipoble</p>;
  return estil ? <FacetaEstil key={ambit.clau} ambit={ambit} /> : <FacetaTaxonomia key={ambit.clau} ambit={ambit} />;
}
const pendent = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
beforeEach(() => {
  m.caps = ['administracioMultipoble', 'personalitzacio'];
  m.config = { tenantId: A, backendUrl: 'https://dades.example', dataMode: 'remote' };
  m.sessio = { currentUser: { id: 'super' }, esSuperadmin: true, nivell: 'aal2', generacio: 1 };
  m.llista.mockReset().mockResolvedValue(pobles);
  m.llig.mockReset().mockImplementation(({ tenantId }) => Promise.resolve(taxonomia(tenantId === A ? 'De Sella' : 'De Xixona')));
  m.desa.mockReset().mockResolvedValue({ versio: 8 });
  m.historial.mockReset().mockResolvedValue([]);
  m.globalRefresh.mockReset();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('FEDI-04 · fora de la faceta o sense capacitat no fa cap lectura multipoble', async () => {
  const r = render(<Harness actiu={false} />);
  await act(async () => {});
  expect(m.llista).not.toHaveBeenCalled();
  m.caps = [];
  r.rerender(<Harness />);
  await act(async () => {});
  expect(m.llista).not.toHaveBeenCalled(); expect(m.llig).not.toHaveBeenCalled();
});
test.each([{ esSuperadmin: false, nivell: 'aal2' }, { esSuperadmin: true, nivell: 'aal1' }])('un rol o MFA insuficient no llista, carrega ni oferix desat: %j', async canvi => {
  m.sessio = { ...m.sessio, ...canvi };
  render(<Harness />);
  await act(async () => {});
  expect(screen.getByText(/Cal ser superadministrador/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Desar' })).toBeNull();
  expect(m.llista).not.toHaveBeenCalled(); expect(m.llig).not.toHaveBeenCalled(); expect(m.desa).not.toHaveBeenCalled();
});
test('selecció real, lectura i desat amb tenant i versió seleccionats, sense refrescar el poble global', async () => {
  render(<Harness />);
  await screen.findByText('De Sella');
  expect(screen.queryByText('Global aliena')).toBeNull();
  fireEvent.change(screen.getByLabelText('Poble que administres'), { target: { value: B } });
  await screen.findByText('De Xixona');
  expect(screen.queryByText('De Sella')).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desar' })); });
  expect(m.desa).toHaveBeenCalledWith(expect.objectContaining({ clau: 'taxonomia', versio: 7, payload: expect.objectContaining({ categories: ['De Xixona'] }) }), { tenantId: B });
  expect(m.globalRefresh).not.toHaveBeenCalled();
  await screen.findByRole('button', { name: 'Historial' });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Historial' })); });
  expect(m.historial).toHaveBeenCalledWith('taxonomia', { tenantId: B });
});
test('una lectura vella de Sella mai reapareix després de triar Xixona', async () => {
  const a = pendent(), b = pendent();
  m.llig.mockImplementation(({ tenantId }) => tenantId === A ? a.promise : b.promise);
  render(<Harness />);
  await screen.findByLabelText('Poble que administres');
  await waitFor(() => expect(m.llig).toHaveBeenCalledTimes(1));
  fireEvent.change(screen.getByLabelText('Poble que administres'), { target: { value: B } });
  await waitFor(() => expect(m.llig).toHaveBeenCalledTimes(2));
  expect(m.llig.mock.calls[0][0].signal.aborted).toBe(true);
  await act(async () => { b.resolve(taxonomia('Només Xixona')); });
  await screen.findByText('Només Xixona');
  await act(async () => { a.resolve(taxonomia('Resposta antiga')); });
  expect(screen.queryByText('Resposta antiga')).toBeNull();
  expect(screen.getByText('Només Xixona')).toBeTruthy();
});
test('canviar de sessió retira el formulari i ignora la llista anterior en vol', async () => {
  const a = pendent(); m.llista.mockReturnValueOnce(a.promise);
  const r = render(<Harness />);
  await waitFor(() => expect(m.llista).toHaveBeenCalledTimes(1));
  m.sessio = { ...m.sessio, currentUser: { id: 'altra' }, esSuperadmin: false, generacio: 2 };
  r.rerender(<Harness />);
  await act(async () => { a.resolve(pobles); });
  expect(screen.queryByLabelText('Poble que administres')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Desar' })).toBeNull();
  expect(m.llig).not.toHaveBeenCalled();
});
test('error de llista visible i reintent real, mai reserva amb pobles públics', async () => {
  m.llista.mockRejectedValueOnce(Object.assign(new Error('sense migració'), { status: 404 }));
  render(<Harness />);
  await screen.findByText('Este servidor encara no té la gestió multipoble disponible.');
  expect(screen.queryByLabelText('Poble que administres')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  await screen.findByText('De Sella');
  expect(m.llista).toHaveBeenCalledTimes(2);
});
test('un desat antic en vol no contamina la versió o el resultat del poble nou', async () => {
  const desa = pendent(); m.desa.mockReturnValueOnce(desa.promise);
  render(<Harness />);
  await screen.findByText('De Sella');
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  fireEvent.change(screen.getByLabelText('Poble que administres'), { target: { value: B } });
  await screen.findByText('De Xixona');
  await act(async () => { desa.resolve({ versio: 900 }); });
  expect(screen.queryByText(/900/)).toBeNull();
  expect(m.llig.mock.calls.filter(([c]) => c.tenantId === B)).toHaveLength(1);
});
test('l’estil d’un poble es previsualitza dins de la faceta, sense aplicar-lo a l’arrel global', async () => {
  render(<div className="sdp-root"><Harness estil /></div>);
  await screen.findByLabelText('Poble que administres');
  await screen.findByRole('button', { name: 'Previsualitza' });
  fireEvent.change(screen.getByLabelText('Radi xicotet'), { target: { value: '12px' } });
  fireEvent.click(screen.getByRole('button', { name: 'Previsualitza' }));
  const section = screen.getByRole('region', { name: 'Estil del poble' });
  const full = section.querySelector('style[data-sdp-estil-admin-full]');
  expect(full).toBeTruthy();
  expect(full.textContent).not.toMatch(/:root|:host|\.sdp-root/);
  expect(full.textContent).toContain(`[data-sdp-estil-admin="${section.dataset.sdpEstilAdmin}"]`);
  expect(full.sheet.cssRules).toHaveLength(2);
  expect(full.sheet.cssRules[0].style.getPropertyValue('--sdp-radi-s')).toBe('12px');
  expect(document.head.querySelector('style[data-sdp-estil]')).toBeNull();
  fireEvent.change(screen.getByLabelText('Poble que administres'), { target: { value: B } });
  await waitFor(() => expect(screen.getByLabelText('Poble que administres').value).toBe(B));
  expect(m.globalRefresh).not.toHaveBeenCalled();
});


test('R2-F04-02 · Ademús primer no canvia el destí: el tenant actiu autoritzat és La Torre', async () => {
  m.config = { ...m.config, tenantId: B };
  m.llista.mockResolvedValue([{ id: A, slug: 'ademus', nom: 'Ademús' }, { id: B, slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' }]);
  m.llig.mockImplementation(({ tenantId }) => Promise.resolve(taxonomia(tenantId === B ? 'De La Torre' : 'D’Ademús')));
  render(<Harness />);
  await screen.findByText('De La Torre');
  expect(screen.getByLabelText('Poble que administres').value).toBe(B);
  expect(m.llig.mock.calls.every(([c]) => c.tenantId === B)).toBe(true);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desar' })); });
  expect(m.desa).toHaveBeenCalledWith(expect.any(Object), { tenantId: B });
});

test.each([null, '33333333-3333-4333-8333-333333333333'])('sense tenant actiu autoritzat (%s), no carrega ni desa fins a una tria explícita', async tenantId => {
  m.config = { ...m.config, tenantId };
  render(<Harness />);
  const selector = await screen.findByLabelText('Poble que administres');
  expect(selector.value).toBe('');
  expect(m.llig).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Desar' })).toBeNull();
  fireEvent.change(selector, { target: { value: B } });
  await screen.findByText('De Xixona');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desar' })); });
  expect(m.desa).toHaveBeenCalledWith(expect.any(Object), { tenantId: B });
});

test('canviar backend i tenant invalida la selecció i ignora llista i lectura antigues', async () => {
  const vella = pendent();
  m.llista.mockReturnValueOnce(vella.promise).mockResolvedValueOnce(pobles);
  const { rerender } = render(<Harness />);
  await waitFor(() => expect(m.llista).toHaveBeenCalledTimes(1));
  m.config = { ...m.config, tenantId: B, backendUrl: 'https://altre.example' };
  rerender(<Harness />);
  await screen.findByText('De Xixona');
  expect(m.llista.mock.calls[0][0].signal.aborted).toBe(true);
  await act(async () => { vella.resolve([{ id: A, slug: 'ademus', nom: 'Ademús' }]); });
  expect(screen.getByLabelText('Poble que administres').value).toBe(B);
  expect(screen.queryByRole('option', { name: 'Ademús' })).toBeNull();
  expect(m.llig.mock.calls.every(([c]) => c.tenantId === B)).toBe(true);
});


test('una configuració de backend invàlida no llista ni oferix cap desat per reserva', async () => {
  m.config = { ...m.config, backendUrl: 'ftp://servidor.example' };
  render(<Harness />);
  await screen.findByText(/No es pot determinar el servidor actiu/);
  expect(m.llista).not.toHaveBeenCalled(); expect(m.llig).not.toHaveBeenCalled(); expect(m.desa).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Poble que administres')).toBeNull();
});
