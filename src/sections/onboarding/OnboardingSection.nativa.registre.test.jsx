/* Fase D (261020, revisió) · correcció F2 i proves F1 · /registre a l'app nativa
   amb el registre DE VERES (config/entradaNativa.js): només l'adaptador (el full)
   és una doble. OnboardingSection.nativa.test.jsx simula el registre i no podia
   vore el pany de la fase 1: «Cancel·la l'entrada» deixava els botons morts.
   Cada cas carrega un registre nou (és d'estat de mòdul). Tot és sintètic. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), entra: vi.fn(), quanLlest: vi.fn(), config: null, t: undefined
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({
    currentUser: null, registerWithPassword: vi.fn(), loginWithPassword: vi.fn(), loginWithGoogle: vi.fn(),
    teCapacitat: (nom) => nom === 'entradaAmbToken', entraAmbTokenDeProveidor: m.entra
  })
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: m.config, t: m.t }) }));
vi.mock('../../config/dataMode.js', () => ({
  resolveDataMode: (config) => config.dataMode || 'remote',
  enterRemoteMode: vi.fn(), enterTestMode: vi.fn(), eleccioRemotaActiva: () => false, exitRemoteMode: vi.fn()
}));
vi.mock('../../host.js', () => ({ quanLlest: (...args) => m.quanLlest(...args) }));

const TENANT = '00000000-0000-4000-8000-0000000000de';
const EN_CURS = 'Ja hi ha una entrada oberta al telèfon: acaba-la o tanca-la.';
const promesaOberta = () => {
  let resol;
  const promesa = new Promise((r) => { resol = r; });
  return { promesa, resol };
};
const apple = () => screen.queryByRole('button', { name: 'Continua amb Apple' });
const google = () => screen.queryByRole('button', { name: 'Continua amb Google' });
const cancela = () => screen.getByRole('button', { name: 'Cancel·la l’entrada' });
const toca = async (boto) => { await act(async () => { fireEvent.click(boto); }); };

/** Un registre nou amb l'adaptador donat (iOS, Apple i Google) i la vista d'aquest registre. */
async function ambRegistre(demana) {
  vi.resetModules();
  const registre = await import('../../config/entradaNativa.js');
  const adaptador = { plataforma: 'ios', proveidors: ['apple', 'google'], demana: vi.fn(demana), oblida: vi.fn(async () => undefined) };
  registre.registraEntradaNativa(adaptador);
  const { default: OnboardingSection } = await import('./OnboardingSection.jsx');
  const pinta = async () => {
    const resultat = render(<OnboardingSection />);
    await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
    return resultat;
  };
  return { adaptador, pinta };
}

beforeEach(async () => {
  for (const f of [m.navigate, m.toast, m.entra, m.quanLlest]) f.mockReset();
  m.quanLlest.mockResolvedValue(undefined);
  m.entra.mockResolvedValue({ user: { id: 'U' } });
  m.config = { dataMode: 'remote', tenantId: TENANT };
  m.t = (await import('../../config/i18n.js')).createTranslator('ca');
});
afterEach(() => { cleanup(); });

describe('«Cancel·la l’entrada» amb el registre de veres', () => {
  test('un full de Google que no torna mai: cancel·lar i tocar Apple arriba a l’adaptador (cap botó mort)', async () => {
    const { adaptador, pinta } = await ambRegistre(() => new Promise(() => {}));
    await pinta();
    await toca(google());
    await toca(cancela());
    await toca(apple());
    expect(adaptador.demana).toHaveBeenCalledTimes(2);
    expect(adaptador.demana.mock.calls.map(([p]) => p)).toEqual(['google', 'apple']);
    expect(apple().getAttribute('aria-busy')).toBe('true');
    expect(screen.queryByText(EN_CURS)).toBeNull();
  });

  test('cancel·lar abans que s’òbriga el full: l’adaptador rep viu() fals i ja no l’obri', async () => {
    const { adaptador, pinta } = await ambRegistre(() => new Promise(() => {}));
    await pinta();
    await toca(google());
    const [[, { viu }]] = adaptador.demana.mock.calls;
    expect(viu()).toBe(true);
    await toca(cancela());
    expect(viu()).toBe(false);
  });

  test('cancel·lar i tornar a tocar el mateix proveïdor s’afig al full que ja venia: un sol full i la persona entra', async () => {
    const full = promesaOberta();
    const { adaptador, pinta } = await ambRegistre(() => full.promesa);
    await pinta();
    await toca(google());
    await toca(cancela());
    await toca(google());
    expect(adaptador.demana).toHaveBeenCalledTimes(1);
    const [[, { viu }]] = adaptador.demana.mock.calls;
    expect(viu()).toBe(true);
    await act(async () => { full.resol({ testimoni: 'a.b.c', nonce: 'n'.repeat(64) }); });
    expect(m.entra).toHaveBeenCalledTimes(1);
    expect(m.entra).toHaveBeenCalledWith('google', { testimoni: 'a.b.c', nonce: 'n'.repeat(64), testimoniAcces: null, nom: null }, m.config);
    expect(m.toast).toHaveBeenCalledWith('Sessió iniciada.', 'success');
    expect(adaptador.oblida).toHaveBeenCalledWith('google');
  });

  test('un altre proveïdor amb el primer full encara viu (la vista s’ha tornat a muntar): l’avís, no el silenci', async () => {
    const { adaptador, pinta } = await ambRegistre(() => new Promise(() => {}));
    const { unmount } = await pinta();
    await toca(google());
    unmount();
    await pinta();
    await toca(apple());
    expect(adaptador.demana).toHaveBeenCalledTimes(1);
    expect(screen.getByText(EN_CURS, { selector: '.sdp-alerta__text' })).toBeTruthy();
    expect(document.querySelector('.onboarding-entrada-nativa ~ [role="status"]').textContent).toBe(EN_CURS);
    expect(document.activeElement).toBe(apple());
  });
});
