/* Auditoria 261008 (B09, 261008_1355_auditoria_claude.md) · Sense xarxa,
   l'historial cap arrere es demanava en bucle: cada fallada tornava
   `carregantMes` a false, l'efecte de Conversa tornava a crear
   l'IntersectionObserver i un observador nou NOTIFICA de seguida si el
   sentinella és a la vista. Ací Conversa va connectada al XatProvider REAL
   (com a XatSection) i el fals reproduïx eixa notificació inicial, en una
   tasca a part com el navegador. Les proves que ja hi havia
   (Conversa.revisio260930.test.jsx) usaven un fals que no la simulava.
   Comprova: dins de l'espera no hi ha cap petició; a la tercera fallada,
   cap més de sola; el botó i la xarxa que torna ('online') tornen a provar;
   i el primer èxit ho reinicia. */
import { useCallback, useEffect } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../../host.js';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { XatProvider, useXat } from '../XatContext.jsx';
import { LIMIT_PAGINA } from '../missatges.js';
import Conversa from './Conversa.jsx';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn()
}));
vi.mock('../../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: 'persona::A', identitats: undefined }) }));
vi.mock('../../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_, alternativa) => alternativa })
}));
vi.mock('../../../components/universal/NotificationContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: () => ({ showToast: mock.showToast })
}));
vi.mock('../../../data/backendPort.js', () => mock);
vi.mock('../../../host.js', () => ({ quanLlest: async () => {} }));

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
const t = (_, alternativa) => alternativa;
/* Tot llegit (cap separador que demane historial per a arribar-hi) i una
   pàgina sencera: hi ha més missatges cap arrere. */
const FIL = { id: 'fil-A', tipus: 'directe', titol: 'Pepa', altresNoms: ['Pepa'], ultimSeq: 100, llegitFinsSeq: 100, noLlegits: 0, ultimAutorId: 'X', ultimAl: '2026-10-08T10:00:00Z' };
const PAGINA = Array.from({ length: LIMIT_PAGINA }, (_, i) => ({
  id: `m-${i}`, filId: 'fil-A', usuariId: 'X', autorNom: 'Pep', text: `Text ${i}`, seq: 100 - LIMIT_PAGINA + 1 + i, creatAl: '2026-10-08T10:00:00Z'
}));
const xarxa = () => Object.assign(new Error('Load failed'), { code: 'XARXA', retriable: true });

/* IntersectionObserver fals amb la notificació inicial del navegador: en
   observar, una tasca a part informa que el node és a la vista. */
let observadors = [];
class ObservadorAmbNotificacioInicial {
  constructor(callback) {
    this.callback = callback;
    this.viu = true;
    observadors.push(this);
  }

  observe(node) {
    setTimeout(() => { if (this.viu) this.callback([{ isIntersecting: true, target: node }], this); }, 0);
  }

  disconnect() { this.viu = false; }
}

let value;
/* Conversa connectada com a XatSection: hiHaMes, carregantMes, onCarregaMes i esperaAntics del context. */
function Arnes({ obert, ambEspera = true }) {
  const xat = useXat();
  value = xat;
  const { obriFil, carregaMesAntics } = xat;
  useEffect(() => { if (obert) obriFil('fil-A'); }, [obert, obriFil]);
  const carregaMes = useCallback(() => { carregaMesAntics('fil-A'); }, [carregaMesAntics]);
  const fil = xat.chatThreads.find((f) => f.id === 'fil-A');
  if (!obert || !fil) return null;
  return (
    <Conversa
      fil={fil}
      messages={xat.chatMessages}
      onSendMessage={xat.sendChatMessage}
      onBack={() => {}}
      onEnviaAlBloc={async () => {}}
      onCopia={() => {}}
      hiHaMes={xat.hiHaMesAntics('fil-A')}
      carregantMes={xat.carregantAntics('fil-A')}
      onCarregaMes={carregaMes}
      esperaAntics={ambEspera ? xat.esperaAntics('fil-A') : null}
      onReintenta={() => {}}
      onDescarta={() => {}}
      onMarcaVist={() => {}}
      locale="ca-ES"
      t={t}
    />
  );
}
const GRAELLA = { mida: 'ample' };
const arbre = (obert, ambEspera = true) => (
  <MemoryRouter>
    <AppGridContext.Provider value={GRAELLA}>
      <XatProvider config={CONFIG}><Arnes obert={obert} ambEspera={ambEspera} /></XatProvider>
    </AppGridContext.Provider>
  </MemoryRouter>
);

const antics = () => mock.loadMissatges.mock.calls.filter(([, o]) => o?.abansDeSeq != null).length;
const pas = async (ms) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
/* Uns quants passos d'1 ms: deixa que React pinte, que els efectes creen
   l'observador, que la seua notificació (una tasca a part) arribe i que la
   fallada (una altra tasca) torne. Un temporitzador de 0 ms programat dins
   d'un pas cau 1 ms més tard: per això no n'hi ha prou amb passos de 0 ms. */
const assenta = async () => { for (let i = 0; i < 6; i += 1) await pas(1); };

beforeEach(() => {
  vi.clearAllMocks();
  observadors = [];
  mock.loadFils.mockResolvedValue([FIL]);
  /* Sense xarxa, el fetch falla uns mil·lisegons després, en una tasca
     posterior: React arriba a pintar `carregantMes` abans de la fallada, com
     al navegador. (Si fallara en la mateixa tasca, act ajuntaria els dos
     canvis i l'efecte no es tornaria a executar.) */
  mock.loadMissatges.mockImplementation(async (_, opcions) => {
    if (opcions?.abansDeSeq != null) {
      await new Promise((resol) => { setTimeout(resol, 2); });
      throw xarxa();
    }
    return opcions?.despresDeSeq != null ? [] : PAGINA;
  });
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 100, rebutFinsSeq: 100 });
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

async function conversaAmbHistorialQueFalla(ambEspera = true) {
  const vista = render(arbre(false, ambEspera));
  await vi.waitFor(() => expect(value.status).toBe('ready'));
  vi.useFakeTimers();
  vi.stubGlobal('IntersectionObserver', ObservadorAmbNotificacioInicial);
  vista.rerender(arbre(true, ambEspera));
  await assenta();
  expect(value.hiHaMesAntics('fil-A')).toBe(true);
  return vista;
}

/* Control del fals, i no del producte: sense `esperaAntics` (el contracte
   d'abans, que la Llei del Píxel conserva per a qui no el passa) el bucle es
   reproduïx. Si este control deixa de veure'l, les proves de baix no
   provarien res. */
describe('[DEFECTE] control · sense esperaAntics, el fals reproduïx el bucle de B09', () => {
  it('cada observador nou torna a demanar l’historial de seguida', async () => {
    await conversaAmbHistorialQueFalla(false);
    const primeres = antics();
    await assenta();
    await assenta();
    expect(antics()).toBeGreaterThan(primeres);
    expect(antics()).toBeGreaterThan(3);
  });
});

describe('B09 · l’historial cap arrere que falla no es demana en bucle', () => {
  it('una petició, cap dins de l’espera, una als 2 s i una als 5 s; a la tercera fallada ja no ho torna a provar sol', async () => {
    await conversaAmbHistorialQueFalla();
    /* La notificació inicial del sentinella: la primera petició, i falla. */
    expect(antics()).toBe(1);
    expect(value.esperaAntics('fil-A')).toMatchObject({ fallades: 1, manual: false });
    /* Abans de la correcció, cada observador nou en tornava a demanar una
       (vegeu el control de dalt). Dins dels 2 s, cap. */
    await pas(1000);
    await assenta();
    expect(antics()).toBe(1);
    await pas(1100);
    await assenta();
    expect(antics()).toBe(2);
    expect(value.esperaAntics('fil-A')).toMatchObject({ fallades: 2, manual: false });
    /* Dins dels 5 s següents, cap. */
    await pas(4000);
    await assenta();
    expect(antics()).toBe(2);
    await pas(1100);
    await assenta();
    expect(antics()).toBe(3);
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 3, manual: true, fins: null });
    /* Manual: ni un minut després no torna a provar sol. */
    await pas(60000);
    await assenta();
    expect(antics()).toBe(3);
  });

  it('el botó i la xarxa que torna tornen a provar; el primer èxit lleva l’espera', async () => {
    await conversaAmbHistorialQueFalla();
    await pas(2100);
    await assenta();
    await pas(5100);
    await assenta();
    expect(antics()).toBe(3);
    expect(value.esperaAntics('fil-A')).toMatchObject({ manual: true });

    /* El botó «Carrega'n més» sempre pot provar-ho. */
    fireEvent.click(screen.getByRole('button', { name: "Carrega'n més" }));
    await assenta();
    expect(antics()).toBe(4);
    expect(value.esperaAntics('fil-A')).toMatchObject({ fallades: 4, manual: true });

    /* La xarxa que torna: una petició (l'observador nou), i si falla, manual. */
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await assenta();
    expect(antics()).toBe(5);
    await pas(60000);
    await assenta();
    expect(antics()).toBe(5);

    /* El primer èxit: no hi ha cap espera i, sense més historial, cap sentinella actiu. */
    mock.loadMissatges.mockImplementation(async () => []);
    fireEvent.click(screen.getByRole('button', { name: "Carrega'n més" }));
    await assenta();
    expect(antics()).toBe(6);
    expect(value.esperaAntics('fil-A')).toBeNull();
    expect(value.hiHaMesAntics('fil-A')).toBe(false);
  });
});
