/* Fase D (261020, tasca 2; pla 261020_1300) · El xat amb la moderació per
   damunt (ací, un valor de prova de ModeracioContext):
   · la porta de les normes viu dins de XatContext, a l'ÚNIC sendChatMessage
     que s'exposa (crítica 261020, troballa 1): declinar llança un AbortError
     i no s'envia ni es pinta res; el xat de la IAIA no hi passa;
   · el que ha escrit qui has bloquejat arriba anotat (sense text), la vista
     prèvia del directe s'amaga, cap avís no en salta i el directe no compta
     als no llegits (crítica 261020, troballa 15). Les dades crues no es
     toquen. */
import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/mur', showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, fallback) => fallback }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

const ara = '2026-10-20T10:00:00Z';
const PEPA = 'pepa';
const filsDelServidor = (extra = {}) => [
  { id: 'f-pepa', tipus: 'directe', titol: 'Pepa', altres: [{ id: PEPA, nom: 'Pepa', tipus: 'persona' }], ultimText: 'Insult', ultimSeq: 2,
    llegitFinsSeq: 0, noLlegits: 2, ultimAutorId: PEPA, ultimAl: ara, ...extra.pepa },
  { id: 'f-joan', tipus: 'directe', titol: 'Joan', altres: [{ id: 'joan', nom: 'Joan', tipus: 'persona' }], ultimText: 'Bon dia', ultimSeq: 1,
    llegitFinsSeq: 0, noLlegits: 1, ultimAutorId: 'joan', ultimAl: ara, ...extra.joan },
  { id: 'd-iaia', tipus: 'directe', titol: 'IAIA MarIA', altres: [{ id: IAIA_ID, nom: 'IAIA MarIA', tipus: 'ia' }], ultimSeq: 0,
    llegitFinsSeq: 0, noLlegits: 0, ultimAutorId: null, ultimAl: ara }
];
const missatge = (id, seq, usuariId, text, extra = {}) => ({ id, filId: 'f-pepa', usuariId, autorNom: usuariId, text, seq, creatAl: ara, ...extra });

let value;
function Probe() {
  value = useXat();
  return null;
}
const pepaBloquejada = (id) => id === PEPA;
const munta = (moderacio) => {
  const xat = <XatProvider config={{ backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' }}><Probe /></XatProvider>;
  return render(moderacio === undefined ? xat : <ModeracioContext.Provider value={moderacio}>{xat}</ModeracioContext.Provider>);
};
const fil = (id) => value.chatThreads.find((f) => f.id === id);

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); mock.pathname = '/mur';
  mock.session = { currentUser: { id: 'A' }, generacio: 1 };
  mock.loadFils.mockResolvedValue(filsDelServidor());
  mock.loadMissatges.mockResolvedValue([missatge('m1', 1, PEPA, 'Insult', { metadades: { adjunts: ['x'] } }), missatge('m2', 2, 'A', 'Para')]);
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 2, rebutFinsSeq: 2 });
  mock.enviaMissatge.mockImplementation(async (filId, { id, text }) => ({ id, filId, usuariId: 'A', text, seq: 9, creatAl: ara }));
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); localStorage.clear(); });

describe('la porta de les normes, a l’únic sendChatMessage', () => {
  test('declinar llança un AbortError i no s’envia ni es pinta res', async () => {
    const asseguraNormes = vi.fn(async () => false);
    munta({ esPersonaBloquejada: () => false, asseguraNormes });
    await waitFor(() => expect(value.status).toBe('ready'));
    await act(async () => {
      await expect(value.sendChatMessage(fil('f-joan'), 'Hola, Joan')).rejects.toMatchObject({ name: 'AbortError' });
    });
    expect(asseguraNormes).toHaveBeenCalledTimes(1);
    expect(mock.enviaMissatge).not.toHaveBeenCalled();
    expect(value.getThreadMessages('f-joan')).toEqual([]);
  });

  test('acceptades, s’envia com sempre (també amb la resposta citada)', async () => {
    const asseguraNormes = vi.fn(async () => true);
    munta({ esPersonaBloquejada: () => false, asseguraNormes });
    await waitFor(() => expect(value.status).toBe('ready'));
    await act(async () => { await value.sendChatMessage(fil('f-joan'), 'Hola', { respostaA: 'm0' }); });
    expect(mock.enviaMissatge).toHaveBeenCalledWith('f-joan', expect.objectContaining({ text: 'Hola', respostaA: 'm0' }), expect.anything());
  });

  test('el xat de la IAIA i un text buit no hi passen; sense proveïdor, tampoc', async () => {
    const asseguraNormes = vi.fn(async () => false);
    const vista = munta({ esPersonaBloquejada: () => false, asseguraNormes });
    await waitFor(() => expect(value.status).toBe('ready'));
    await act(async () => { await value.sendChatMessage(fil('d-iaia'), 'Hola, iaia'); });
    await act(async () => { await value.sendChatMessage(fil('f-joan'), '   '); });
    expect(asseguraNormes).not.toHaveBeenCalled();
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    vista.unmount();
    munta(undefined);
    await waitFor(() => expect(value.status).toBe('ready'));
    await act(async () => { await value.sendChatMessage(fil('f-joan'), 'Sense porta'); });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(2);
  });
});

describe('el que has bloquejat, amagat a la font', () => {
  test('els missatges de la persona bloquejada arriben anotats i sense text; els propis, igual', async () => {
    munta({ esPersonaBloquejada: pepaBloquejada, asseguraNormes: async () => true });
    await waitFor(() => expect(value.status).toBe('ready'));
    act(() => value.obriFil('f-pepa'));
    await waitFor(() => expect(value.getThreadMessages('f-pepa')).toHaveLength(2));
    const [d_ella, meu] = value.getThreadMessages('f-pepa');
    expect(d_ella).toMatchObject({ id: 'm1', seq: 1, sender: 'other', text: '', metadades: {}, bloquejat: true });
    expect(meu).toMatchObject({ id: 'm2', text: 'Para', sender: 'me' });
    expect(meu.bloquejat).toBeUndefined();
    expect(value.chatMessages[0]).toMatchObject({ id: 'm1', bloquejat: true, text: '' });
  });

  test('un missatge signat per una entitat no s’anota (no es revela qui l’opera)', async () => {
    mock.loadMissatges.mockResolvedValue([missatge('m1', 1, PEPA, 'Oferta del forn', { comOrgId: 'forn' })]);
    munta({ esPersonaBloquejada: pepaBloquejada, asseguraNormes: async () => true });
    await waitFor(() => expect(value.status).toBe('ready'));
    act(() => value.obriFil('f-pepa'));
    await waitFor(() => expect(value.getThreadMessages('f-pepa')).toHaveLength(1));
    expect(value.getThreadMessages('f-pepa')[0]).toMatchObject({ text: 'Oferta del forn' });
    expect(value.getThreadMessages('f-pepa')[0].bloquejat).toBeUndefined();
  });

  test('la vista prèvia del directe s’amaga i el directe no compta als no llegits ni als contactes freqüents', async () => {
    munta({ esPersonaBloquejada: pepaBloquejada, asseguraNormes: async () => true });
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(fil('f-pepa')).toMatchObject({ ultimText: '', ultimAmagat: true });
    expect(fil('f-joan')).toMatchObject({ ultimText: 'Bon dia' });
    expect(fil('f-joan').ultimAmagat).toBeUndefined();
    expect(value.totalNoLlegits).toBe(1);
    expect(value.contactesFrequents.map((c) => c.usuari_id)).toContain('joan');
    expect(value.contactesFrequents.map((c) => c.usuari_id)).not.toContain(PEPA);
  });

  test('sense cap bloqueig, la llista i el recompte de sempre', async () => {
    munta({ esPersonaBloquejada: () => false, asseguraNormes: async () => true });
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(fil('f-pepa')).toMatchObject({ ultimText: 'Insult' });
    expect(value.totalNoLlegits).toBe(3);
  });

  test('cap avís d’un missatge nou de qui has bloquejat; del d’una altra persona, sí', async () => {
    munta({ esPersonaBloquejada: pepaBloquejada, asseguraNormes: async () => true });
    await waitFor(() => expect(value.status).toBe('ready'));
    mock.showToast.mockClear();
    mock.loadFils.mockResolvedValue(filsDelServidor({ pepa: { ultimSeq: 3, noLlegits: 3 }, joan: { ultimSeq: 2, noLlegits: 2 } }));
    await act(async () => { await value.recarrega(); });
    await waitFor(() => expect(mock.showToast).toHaveBeenCalledTimes(1));
    expect(mock.showToast).toHaveBeenCalledWith('Missatge nou de Joan');
  });
});
