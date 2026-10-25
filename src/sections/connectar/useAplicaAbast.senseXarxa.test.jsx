/* Gauntlet 261025_0545 (D2) · Connectar sense xarxa, amb el XatProvider de
   veres (no el useXat simulat de useAplicaAbast.test.jsx). L'espera de la
   xarxa de XC-03 és per a la conversa que la persona té davant; qui envia
   per programa i espera cada enviament en sèrie («Connectar i enviar a N
   grups», la sol·licitud de «Formar part», l'avís de «Connectar amb {nom}»)
   ha de rebre una resposta acotada, com abans: els reintents de sempre i
   'error', el destinatari següent i la nota apuntada. Calcat del PoC de la
   verificació creuada (poc.connectarSenseXarxa). */
import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from '../xat/XatContext.jsx';
import { useAplicaAbast } from './useAplicaAbast.js';
import { useMissatgeAlXat } from './missatgeAlXat.js';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/connectar', showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn(), publicaAdjuntXat: vi.fn(), update: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ updateNote: mock.update }) }));
vi.mock('../../components/PedraSeca/hooks/moderacioDePoble.js', () => ({ useModeracio: () => null }));
vi.mock('../../components/PedraSeca/hooks/xatSocDePoble.js', () => ({ useXatSocDePoble: () => null }));

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
const fil = (id) => ({ id, titol: id, tipus: 'grup', potEscriure: true, altresNoms: [], ultimSeq: 0, llegitFinsSeq: 0, llegitPelsAltresFinsSeq: 0, noLlegits: 0 });
const xarxa = () => Object.assign(new Error('Failed to fetch'), { code: 'XARXA', retriable: true });
const GRUPS = { mode: 'grups', grups: [{ id: 'fil-A', nom: 'G1' }, { id: 'fil-B', nom: 'G2' }] };
const NOTA = { id: 'n1', revision: 0 };

let value;
let aplica;
let envia;
function Sonda() {
  const x = useXat();
  const a = useAplicaAbast();
  const e = useMissatgeAlXat({ interlocutor: { id: 'u-2' } });
  useLayoutEffect(() => { value = x; aplica = a.aplica; envia = e; });
  value = x; aplica = a.aplica; envia = e;
  return null;
}
const pas = async (ms) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
/* Avança el rellotge a passos d'1 s fins que la promesa acaba, com a molt `maxim` ms. */
async function finsQueAcabe(promesa, maxim = 60_000) {
  let acabat = false;
  let resultat;
  promesa.then((r) => { acabat = true; resultat = r; });
  for (let ms = 0; ms < maxim && !acabat; ms += 1000) await pas(1000);
  return { acabat, resultat };
}
const estatDe = (filId) => value.getThreadMessages(filId).filter((m) => m.sender === 'me').map((m) => `${m.text}:${m.estatEnviament}`);

let espiaLinia = null;
beforeEach(() => {
  vi.clearAllMocks();
  mock.loadFils.mockResolvedValue([fil('fil-A'), fil('fil-B')]);
  mock.loadMissatges.mockResolvedValue([]);
  mock.subscribeToXat.mockResolvedValue({ subscription: 's', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
  mock.update.mockResolvedValue({});
  mock.creaFilDirecte.mockResolvedValue('fil-D');
  mock.enviaMissatge.mockRejectedValue(xarxa());
});
afterEach(() => { cleanup(); vi.useRealTimers(); espiaLinia?.mockRestore(); espiaLinia = null; });

async function senseXarxa() {
  render(<StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>);
  await waitFor(() => expect(value.status).toBe('ready'));
  vi.useFakeTimers();
  espiaLinia = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
  return espiaLinia;
}

describe('D2 · Connectar no espera la xarxa: resposta acotada amb el XatProvider de veres', () => {
  it('«Connectar i enviar» a dos grups sense xarxa: els reintents de sempre, [error, error] i la nota apuntada', async () => {
    await senseXarxa();
    const { acabat, resultat } = await finsQueAcabe(aplica({ nota: NOTA, origen: {}, abast: GRUPS, missatge: 'hola' }));
    /* Abans de la correcció: no acabava mai, una sola crida (fil-A) i la nota sense apuntar. */
    expect(acabat).toBe(true);
    expect(resultat.resultats.map((r) => [r.id, r.estat])).toEqual([['fil-A', 'error'], ['fil-B', 'error']]);
    expect(mock.enviaMissatge.mock.calls.map(([f]) => f)).toEqual(['fil-A', 'fil-A', 'fil-A', 'fil-A', 'fil-B', 'fil-B', 'fil-B', 'fil-B']);
    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.update.mock.calls[0][1].origen.abast.aplicat).toMatchObject({ grups: [] });
    /* La bombolla es queda al xat, en error, per a tornar-la a provar. */
    expect(estatDe('fil-A')).toEqual(['hola:error']);
    expect(estatDe('fil-B')).toEqual(['hola:error']);
  });

  it('amb xarxa, el mateix camí envia i apunta (cap canvi)', async () => {
    render(<StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>);
    await waitFor(() => expect(value.status).toBe('ready'));
    let seq = 0;
    mock.enviaMissatge.mockImplementation(async (filId, cos) => ({ id: cos.id, filId, usuariId: 'A', text: cos.text, seq: (seq += 1), creatAl: '2026-10-25T06:00:00Z' }));
    let resultat;
    await act(async () => { resultat = await aplica({ nota: NOTA, origen: {}, abast: GRUPS, missatge: 'hola' }); });
    expect(resultat.resultats.map((r) => r.estat)).toEqual(['fet', 'fet']);
    expect(mock.update.mock.calls[0][1].origen.abast.aplicat).toMatchObject({ grups: ['fil-A', 'fil-B'] });
  });

  it('un fil retingut per una bombolla que espera la xarxa: Connectar no s’hi queda, i l’ordre del fil es conserva', async () => {
    const linia = await senseXarxa();
    /* La persona ha escrit a G1 sense xarxa: la seua bombolla espera la xarxa (XC-03). */
    let interactiu;
    act(() => { interactiu = value.sendChatMessage({ id: 'fil-A' }, 'primer'); });
    await pas(0);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    const { acabat, resultat } = await finsQueAcabe(aplica({ nota: NOTA, origen: {}, abast: GRUPS, missatge: 'hola' }));
    expect(acabat).toBe(true);
    expect(resultat.resultats.map((r) => [r.id, r.estat])).toEqual([['fil-A', 'error'], ['fil-B', 'error']]);
    /* A G1 no ha eixit res de Connectar (no passa davant de «primer»); G2, els reintents de sempre. */
    expect(mock.enviaMissatge.mock.calls.map(([f, cos]) => `${f}:${cos.text}`)).toEqual([
      'fil-A:primer', 'fil-B:hola', 'fil-B:hola', 'fil-B:hola', 'fil-B:hola'
    ]);
    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(estatDe('fil-A')).toEqual(['primer:pendent', 'hola:error']);
    /* Torna la xarxa: «primer» ix (el mateix id); la de Connectar es queda en error, a mà. */
    linia.mockReturnValue(true);
    mock.enviaMissatge.mockReset();
    mock.enviaMissatge.mockImplementation(async (filId, cos) => ({ id: cos.id, filId, usuariId: 'A', text: cos.text, seq: 1, creatAl: '2026-10-25T06:00:00Z' }));
    act(() => { window.dispatchEvent(new Event('online')); });
    await pas(0);
    await act(async () => { await interactiu; });
    expect(mock.enviaMissatge.mock.calls.map(([f, cos]) => `${f}:${cos.text}`)).toEqual(['fil-A:primer']);
    expect(estatDe('fil-A')).toEqual(['primer:enviat', 'hola:error']);
  });

  it('«Formar part» / «Connectar amb {nom}» (useMissatgeAlXat) sense xarxa: enviat fals, acotat, amb la ruta de la conversa', async () => {
    await senseXarxa();
    const { acabat, resultat } = await finsQueAcabe(envia('Vull formar part de l’entitat.'));
    expect(acabat).toBe(true);
    expect(resultat).toEqual({ enviat: false, filId: 'fil-D', ruta: '/xat/fil-D' });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(4);
    expect(mock.creaFilDirecte).toHaveBeenCalledWith('u-2', null, expect.any(Object));
  });

  it('la conversa que la persona té davant continua esperant la xarxa (XC-03, sense opció)', async () => {
    await senseXarxa();
    let acabat = false;
    act(() => { value.sendChatMessage({ id: 'fil-A' }, 'a mà').then(() => { acabat = true; }); });
    await pas(60_000);
    expect(acabat).toBe(false);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    expect(estatDe('fil-A')).toEqual(['a mà:pendent']);
  });
});
