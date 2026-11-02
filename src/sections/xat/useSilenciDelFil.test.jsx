/* B8C-5 (marató 261101_2143; B8-CLIENT §5.1) · El hook de l'entrada del silenci:
   la defensa contra un useXat parcial (ARB-08), l'etiqueta segons l'estat, el
   «Deixa de silenciar» directe i l'avís honest de cada resultat. */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ xat: {}, showToast: vi.fn() }));
vi.mock('./XatContext.jsx', () => ({ useXat: () => m.xat }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.showToast }) }));
import { useSilenciDelFil } from './useSilenciDelFil.js';

const t = (_, reserva) => reserva;
const FIL = Object.freeze({ id: 'f-pepa', silenciat: false });
const SILENCIAT = Object.freeze({ id: 'f-pepa', silenciat: true });
const diferit = () => { let resol; const promesa = new Promise((r) => { resol = r; }); return { promesa, resol }; };
const xatAmb = (silenciaFil = vi.fn(async () => ({ estat: 'fet', finsAl: null })), pot = true) => ({
  potSilenciarFil: vi.fn(() => pot), silenciaFil
});

beforeEach(() => { m.showToast.mockReset(); m.xat = xatAmb(); });
afterEach(cleanup);

describe('defensa (ARB-08)', () => {
  test.each([
    ['un useXat parcial sense potSilenciarFil', { silenciaFil: vi.fn() }],
    ['un useXat parcial sense silenciaFil', { potSilenciarFil: () => true }],
    ['un useXat buit', {}],
    ['un useXat amb un potSilenciarFil que no és cap funció', { potSilenciarFil: true, silenciaFil: vi.fn() }],
    ['un useXat amb un silenciaFil que no és cap funció', { potSilenciarFil: () => true, silenciaFil: 'silencia' }],
    ['un useXat null', null]
  ])('%s: cap entrada ni diàleg, i no llança', (_, xat) => {
    m.xat = xat;
    const { result } = renderHook(() => useSilenciDelFil(FIL, t));
    expect(result.current.accio).toBeNull();
    expect(result.current.dialeg.obert).toBe(false);
  });

  test('un fil que el context no deixa silenciar no porta entrada; tampoc un fil sense id', () => {
    m.xat = xatAmb(undefined, false);
    expect(renderHook(() => useSilenciDelFil(FIL, t)).result.current.accio).toBeNull();
    expect(m.xat.potSilenciarFil).toHaveBeenCalledWith('f-pepa');
    m.xat = xatAmb();
    expect(renderHook(() => useSilenciDelFil({ id: '' }, t)).result.current.accio).toBeNull();
    expect(renderHook(() => useSilenciDelFil(null, t)).result.current.accio).toBeNull();
  });
});

describe('sense silenci: obri el diàleg', () => {
  test('etiqueta «Silencia les notificacions»; triar-la obri el diàleg sense cridar res', () => {
    const { result } = renderHook(() => useSilenciDelFil(FIL, t));
    expect(result.current.accio.etiqueta).toBe('Silencia les notificacions');
    act(() => result.current.accio.onTria());
    expect(result.current.dialeg.obert).toBe(true);
    expect(m.xat.silenciaFil).not.toHaveBeenCalled();
    act(() => result.current.dialeg.onTanca());
    expect(result.current.dialeg.obert).toBe(false);
  });

  test('confirmar crida silenciaFil(id, durada), mostra «carregant», tanca i diu la data de fi', async () => {
    const enVol = diferit();
    m.xat = xatAmb(vi.fn(() => enVol.promesa));
    const { result } = renderHook(() => useSilenciDelFil(FIL, t, 'ca-ES'));
    act(() => result.current.accio.onTria());
    let promesa;
    act(() => { promesa = result.current.dialeg.onConfirma('1setmana'); });
    expect(m.xat.silenciaFil).toHaveBeenCalledWith('f-pepa', '1setmana');
    expect(result.current.dialeg.carregant).toBe(true);
    /* Un segon toc mentre vola no fa res. */
    act(() => { result.current.dialeg.onConfirma('sempre'); });
    expect(m.xat.silenciaFil).toHaveBeenCalledTimes(1);
    const fi = '2026-11-09T10:00:00Z';
    await act(async () => { enVol.resol({ estat: 'fet', finsAl: fi }); await promesa; });
    expect(result.current.dialeg.carregant).toBe(false);
    expect(result.current.dialeg.obert).toBe(false);
    const data = new Intl.DateTimeFormat('ca-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(fi));
    expect(m.showToast).toHaveBeenCalledWith(`Conversa silenciada fins al ${data}`, 'success');
  });

  test('«sempre» diu «Conversa silenciada»', async () => {
    m.xat = xatAmb(vi.fn(async () => ({ estat: 'fet', finsAl: '9999-12-31T00:00:00+00:00' })));
    const { result } = renderHook(() => useSilenciDelFil(FIL, t));
    await act(async () => { await result.current.dialeg.onConfirma('sempre'); });
    expect(m.showToast).toHaveBeenCalledWith('Conversa silenciada', 'success');
  });

  test('en memòria (sense servidor) ho diu: mai un silenci desat que no ho és', async () => {
    m.xat = xatAmb(vi.fn(async () => ({ estat: 'local', finsAl: '2026-11-02T18:00:00Z' })));
    const { result } = renderHook(() => useSilenciDelFil(FIL, t));
    await act(async () => { await result.current.dialeg.onConfirma('8h'); });
    expect(m.showToast).toHaveBeenCalledWith('Silenciada només en este dispositiu fins que tornes a obrir l’app: el servidor encara no ho guarda.');
  });

  test.each([
    ['un error', async () => ({ estat: 'error', finsAl: null })],
    ['una promesa que rebutja', async () => { throw new Error('xarxa'); }],
    ['un resultat buit', async () => undefined]
  ])('%s: avís d’error, el diàleg es tanca i no diu cap silenci', async (_, impl) => {
    m.xat = xatAmb(vi.fn(impl));
    const { result } = renderHook(() => useSilenciDelFil(FIL, t));
    act(() => result.current.accio.onTria());
    await act(async () => { await result.current.dialeg.onConfirma('8h'); });
    expect(m.showToast).toHaveBeenCalledTimes(1);
    expect(m.showToast).toHaveBeenCalledWith('No s’ha pogut canviar el silenci de la conversa. Torna-ho a provar.', 'error');
    expect(result.current.dialeg.obert).toBe(false);
    expect(result.current.dialeg.carregant).toBe(false);
  });
});

describe('silenciat: «Deixa de silenciar» directe', () => {
  test('etiqueta «Deixa de silenciar»; triar-la crida silenciaFil(id, \'cap\') sense obrir cap diàleg', async () => {
    const { result } = renderHook(() => useSilenciDelFil(SILENCIAT, t));
    expect(result.current.accio.etiqueta).toBe('Deixa de silenciar');
    await act(async () => { result.current.accio.onTria(); });
    expect(m.xat.silenciaFil).toHaveBeenCalledWith('f-pepa', 'cap');
    expect(result.current.dialeg.obert).toBe(false);
    expect(m.showToast).toHaveBeenCalledWith('La conversa ja no està silenciada', 'success');
  });

  test('desfet en memòria també diu que ja no està silenciada', async () => {
    m.xat = xatAmb(vi.fn(async () => ({ estat: 'local', finsAl: null })));
    const { result } = renderHook(() => useSilenciDelFil(SILENCIAT, t));
    await act(async () => { result.current.accio.onTria(); });
    expect(m.showToast).toHaveBeenCalledWith('La conversa ja no està silenciada', 'success');
  });
});

test('desmuntat mentre vola: cap avís ni cap canvi d’estat', async () => {
  const enVol = diferit();
  m.xat = xatAmb(vi.fn(() => enVol.promesa));
  const { result, unmount } = renderHook(() => useSilenciDelFil(FIL, t));
  let promesa;
  act(() => { promesa = result.current.dialeg.onConfirma('8h'); });
  unmount();
  await act(async () => { enVol.resol({ estat: 'fet', finsAl: null }); await promesa; });
  expect(m.showToast).not.toHaveBeenCalled();
});
