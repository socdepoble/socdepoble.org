import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* FEDI-23 (ordre del Mestre, 261103) · L'interruptor públic/privat de la
   connexió que s'acaba de fer, a /connectar. El port es simula: cap prova no
   escriu enlloc de veres. */
const m = vi.hoisted(() => ({
  t: (_, alternativa) => alternativa, user: { id: 'U' }, capacitats: new Set(),
  preferencies: vi.fn(), desa: vi.fn()
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: m.t }), useUIActionsOpcional: () => ({ t: m.t }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.user }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (cap) => m.capacitats.has(cap),
  preferenciesConnexions: (...args) => m.preferencies(...args),
  desaVisibilitatConnexions: (...args) => m.desa(...args)
}));
import { configuraBackendSessio, desaSessio, entradaSessio } from '../../data/identitat.js';
import { VisibilitatDeLaConnexio, visibilitatDe } from './VisibilitatDeLaConnexio.jsx';
import { oblidaSondaConnexions } from './sondaConnexions.js';

const PEPA = Object.freeze({ tipus: 'persona', id: 'pepa' });
const fila = (id, visibilitatConnexions, tipus = 'persona', nom = 'Algú') => ({ tipus, id, nom, avatar: '', ruta: `/gent/${id}`, creatAl: '2026-11-03T10:00:00Z', direccio: 'sortint', visibilitatConnexions });
const preferencies = (global, connexions) => ({ tipus: 'persona', id: 'U', visibilitatConnexions: global, connexions });
const bloc = (props = {}) => <VisibilitatDeLaConnexio connexio={PEPA} nom="Pepa Soler" config={{}} {...props} />;
const NO_DISPONIBLE = () => Object.assign(new Error('Supabase 404'), { code: 'NO-DISPONIBLE' });
const interruptor = () => screen.queryByRole('switch');

afterEach(cleanup);
beforeEach(() => {
  oblidaSondaConnexions();
  vi.clearAllMocks();
  m.user = { id: 'U' };
  m.capacitats = new Set(['seguiments', 'connexionsPubliques']);
  m.preferencies.mockResolvedValue(preferencies('publica', [fila('una-altra', 'publica', 'persona', 'Secreta'), fila('pepa', 'publica')]));
  m.desa.mockResolvedValue({});
});

describe('visibilitatDe · només la global i la d’esta connexió', () => {
  test('la global privada per defecte; la fila del destí, pública si no diu privada; sense fila, null', () => {
    expect(visibilitatDe(null, PEPA)).toEqual({ global: 'privada', vincle: null });
    expect(visibilitatDe(preferencies('publica', [fila('pepa', undefined)]), PEPA)).toEqual({ global: 'publica', vincle: 'publica' });
    expect(visibilitatDe(preferencies('publica', [fila('pepa', 'privada')]), PEPA)).toEqual({ global: 'publica', vincle: 'privada' });
    expect(visibilitatDe(preferencies('publica', [fila('pepa', 'publica', 'entitat')]), PEPA)).toEqual({ global: 'publica', vincle: null });
  });
});

describe('quan es pinta', () => {
  test('sense la capacitat, res i cap lectura', async () => {
    m.capacitats = new Set(['seguiments']);
    const { container } = render(bloc());
    await act(async () => {});
    expect(container.textContent).toBe('');
    expect(m.preferencies).not.toHaveBeenCalled();
  });

  test('sense la migració (NO-DISPONIBLE), res', async () => {
    m.preferencies.mockRejectedValue(NO_DISPONIBLE());
    const { container } = render(bloc());
    await waitFor(() => expect(m.preferencies).toHaveBeenCalled());
    await act(async () => {});
    expect(container.textContent).toBe('');
  });

  test('sense sessió ni barret, res', async () => {
    m.user = null;
    const { container } = render(bloc());
    await act(async () => {});
    expect(container.textContent).toBe('');
    expect(m.preferencies).not.toHaveBeenCalled();
  });

  test('la global privada domina: cap interruptor, i on es canvia', async () => {
    m.preferencies.mockResolvedValue(preferencies('privada', [fila('pepa', 'publica')]));
    render(bloc());
    expect(await screen.findByText('Les teues connexions són privades: esta no es mostra a la teua fitxa pública. Es canvia a «Visibilitat de les connexions», a la privacitat del teu Perfil.')).toBeTruthy();
    expect(interruptor()).toBeNull();
  });

  test('la fila encara no hi és: res', async () => {
    m.preferencies.mockResolvedValue(preferencies('publica', [fila('una-altra', 'publica')]));
    const { container } = render(bloc());
    await waitFor(() => expect(m.preferencies).toHaveBeenCalled());
    await act(async () => {});
    expect(container.textContent).toBe('');
  });
});

describe('l’interruptor', () => {
  test('la persona: llig les seues preferències, mostra només esta connexió i l’ajuda abans del clic', async () => {
    render(bloc());
    const control = await screen.findByRole('switch', { name: 'Mostrar la connexió amb Pepa Soler a la teua fitxa pública' });
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(m.preferencies).toHaveBeenCalledWith({ tipus: 'persona', id: 'U' }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    const ajuda = screen.getByText('Encara que la mostres, no es veurà si Pepa Soler l’amaga per la seua banda.');
    expect(ajuda.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.body.textContent).not.toContain('Secreta');
    expect(control.textContent).toContain('Pública');
  });

  test('amagar-la: desa la visibilitat d’esta connexió i torna a llegir', async () => {
    render(bloc());
    const control = await screen.findByRole('switch');
    m.preferencies.mockResolvedValue(preferencies('publica', [fila('pepa', 'privada')]));
    await act(async () => { fireEvent.click(control); });
    expect(m.desa).toHaveBeenCalledTimes(1);
    expect(m.desa).toHaveBeenCalledWith({ tipus: 'persona', id: 'U', visibilitatConnexions: 'privada', connexio: { tipus: 'persona', id: 'pepa' } }, {});
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('switch').textContent).toContain('Privada');
  });

  test('amb el barret d’una entitat: les preferències de l’entitat i el seu nom', async () => {
    render(bloc({ com: 'org-r', nomCom: 'El Rentonar' }));
    const control = await screen.findByRole('switch', { name: 'Mostrar la connexió amb Pepa Soler a la fitxa pública de El Rentonar' });
    expect(m.preferencies).toHaveBeenCalledWith({ tipus: 'entitat', id: 'org-r' }, expect.anything());
    await act(async () => { fireEvent.click(control); });
    expect(m.desa).toHaveBeenCalledWith({ tipus: 'entitat', id: 'org-r', visibilitatConnexions: 'privada', connexio: { tipus: 'persona', id: 'pepa' } }, {});
  });

  test('l’entitat amb la global privada ho diu amb el seu nom', async () => {
    m.preferencies.mockResolvedValue({ tipus: 'entitat', id: 'org-r', visibilitatConnexions: 'privada', connexions: [] });
    render(bloc({ com: 'org-r', nomCom: 'El Rentonar' }));
    expect(await screen.findByText('Les connexions de El Rentonar són privades: esta no es mostra a la seua fitxa pública. Es canvia a «Visibilitat de les connexions», a la privacitat de l’entitat.')).toBeTruthy();
  });

  test('si el canvi falla, ho diu i l’interruptor no canvia', async () => {
    render(bloc());
    const control = await screen.findByRole('switch');
    m.desa.mockRejectedValue(Object.assign(new Error('Supabase 400: cru'), { code: 'SDP-CONN-001' }));
    await act(async () => { fireEvent.click(control); });
    expect(screen.getByRole('status').textContent).toBe('No s’ha pogut canviar la visibilitat de la connexió. Torna-ho a provar.');
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
    expect(document.body.textContent).not.toContain('cru');
  });

  test('una lectura que falla per un altre motiu ho diu, sense interruptor', async () => {
    m.preferencies.mockRejectedValue(Object.assign(new Error('x'), { code: 'DESCONEGUT' }));
    render(bloc());
    expect(await screen.findByText('No s’ha pogut llegir si esta connexió es mostra a la fitxa pública.')).toBeTruthy();
    expect(interruptor()).toBeNull();
  });

  test('un altre destí és una altra clau: la resposta tardana del vell no es pinta', async () => {
    let resol;
    m.preferencies.mockImplementationOnce(() => new Promise((r) => { resol = r; }));
    const vista = render(bloc());
    await waitFor(() => expect(m.preferencies).toHaveBeenCalledTimes(1));
    m.preferencies.mockResolvedValue(preferencies('publica', [fila('berta', 'privada')]));
    vista.rerender(bloc({ connexio: { tipus: 'persona', id: 'berta' }, nom: 'Berta' }));
    const control = await screen.findByRole('switch', { name: 'Mostrar la connexió amb Berta a la teua fitxa pública' });
    await act(async () => { resol(preferencies('publica', [fila('pepa', 'publica')])); });
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(screen.getAllByRole('switch')).toHaveLength(1);
  });
});

/* Respostes tardanes: entrada real, backend, ABA i propietat de cada operació. */
describe('àmbit de les operacions asíncrones', () => {
const A = { mode: 'local', tenantId: '11111111-1111-4111-8111-111111111111' };
const B = { mode: 'local', tenantId: '22222222-2222-4222-8222-222222222222' };
const target = { tipus: 'persona', id: 'synthetic-peer' };
const pref = (vis = 'publica') => ({ tipus: 'persona', id: 'U', visibilitatConnexions: 'publica', connexions: [{ ...target, visibilitatConnexions: vis }] });
const block = (config = A) => <VisibilitatDeLaConnexio connexio={target} nom="Synthetic peer" config={config} />;
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
async function settle() { await act(async () => {}); }
beforeEach(() => { oblidaSondaConnexions(); m.preferencies.mockReset(); m.desa.mockReset(); m.user = { id: 'U' }; configuraBackendSessio(A); desaSessio({ access_token: 'synthetic-token', user: m.user }); m.preferencies.mockResolvedValue(pref()); m.desa.mockResolvedValue({}); });

test('una entrada nova del mateix usuari invalida la lectura anterior real', async () => {
 const old = deferred(); const fresh = deferred(); m.preferencies.mockImplementationOnce(() => old.promise).mockImplementationOnce(() => fresh.promise);
 const v = render(block()); await settle(); expect(m.preferencies).toHaveBeenCalledTimes(1);
 const epoch = entradaSessio(); desaSessio({ access_token: 'synthetic-token-new', user: { id: 'U' } }); expect(entradaSessio()).toBeGreaterThan(epoch); m.user = { id: 'U' }; v.rerender(block()); await settle();
 await act(async () => old.resolve(pref()));
 expect(screen.queryByRole('switch')).toBeNull(); expect(m.preferencies).toHaveBeenCalledTimes(2);
 await act(async () => fresh.resolve(pref('privada'))); expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
});
test('una escriptura antiga no envia una relectura amb el backend nou', async () => {
 const write = deferred(); m.desa.mockImplementationOnce(() => write.promise);
 const v = render(block(A)); await screen.findByRole('switch'); fireEvent.click(screen.getByRole('switch')); await settle();
 v.rerender(block(B)); await settle(); const reads = m.preferencies.mock.calls.length;
 await act(async () => write.resolve({}));
 expect(m.preferencies).toHaveBeenCalledTimes(reads);
});
test('A B A no deixa substituir la lectura nova per la finalització de l’escriptura vella', async () => {
 const write = deferred(); m.desa.mockImplementationOnce(() => write.promise);
 const v = render(block(A)); await screen.findByRole('switch'); fireEvent.click(screen.getByRole('switch')); await settle();
 v.rerender(block(B)); await settle(); m.preferencies.mockResolvedValue(pref('privada')); v.rerender(block(A)); await settle(); expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
 m.preferencies.mockResolvedValue(pref('publica')); const reads = m.preferencies.mock.calls.length;
 await act(async () => write.resolve({}));
 expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false'); expect(m.preferencies).toHaveBeenCalledTimes(reads);
});
test('desmuntar durant escriptura no inicia cap relectura posterior', async () => {
 const write = deferred(); m.desa.mockImplementationOnce(() => write.promise);
 const v = render(block()); await screen.findByRole('switch'); fireEvent.click(screen.getByRole('switch')); await settle(); v.unmount(); const reads = m.preferencies.mock.calls.length;
 await act(async () => write.resolve({})); expect(m.preferencies).toHaveBeenCalledTimes(reads);
});
test('l’operació vella no reté ni allibera el bloqueig de la nova després A B A', async () => {
 const old = deferred(); const fresh = deferred(); m.desa.mockImplementationOnce(() => old.promise).mockImplementationOnce(() => fresh.promise);
 const v = render(block(A)); await screen.findByRole('switch'); fireEvent.click(screen.getByRole('switch')); await settle();
 v.rerender(block(B)); await settle(); v.rerender(block(A)); await settle(); fireEvent.click(screen.getByRole('switch')); await settle(); expect(m.desa).toHaveBeenCalledTimes(2);
 await act(async () => old.resolve({})); expect(screen.getByRole('switch').disabled).toBe(true); fireEvent.click(screen.getByRole('switch')); expect(m.desa).toHaveBeenCalledTimes(2);
 m.preferencies.mockResolvedValue(pref('privada')); await act(async () => fresh.resolve({})); expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
});

});
