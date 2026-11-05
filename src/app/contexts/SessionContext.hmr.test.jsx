/* P1-71 / §T-06 · Blindatge HMR de SessionContext, IdentitatContext i sessionService
   contra «Comprovant la sessió…» infinit durant recàrregues en calent de Vite. */
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../host.js', () => ({
  quanLlest: async () => undefined,
}));

vi.mock('../../data/backendPort.js', () => ({
  getCurrentUser: () => null,
  teCapacitat: () => true,
  refrescaSessio: async () => false,
  logout: async () => undefined,
  elMeuRol: async () => 'usuari',
  loginWithGoogle: async () => undefined,
  loginWithPassword: async () => undefined,
  registerWithPassword: async () => undefined,
  listMyOrganizations: async () => [],
  comprovaServidor: async () => ({ ok: true }),
  demanaRecuperacioContrasenya: async () => undefined,
  definixContrasenyaNova: async () => undefined,
  entraAmbTokenDeProveidor: async () => undefined,
  getDefaultUserId: () => 'anon-local',
  getProfile: async () => null,
}));

afterEach(() => {
  cleanup();
});

const CONFIG = Object.freeze({
  supabaseUrl: 'https://poble.test',
  supabaseAnonKey: 'anon',
  tenantId: '00000000-0000-4000-8000-000000000000',
});

describe('P1-71 / §T-06 · Blindatge HMR de SessionContext i IdentitatContext', () => {
  test('dues instàncies HMR de SessionContext, IdentitatContext i sessionService conserven l’estat resolt i no tornen a «comprovant»', async () => {
    const serveiVell = await import('../../data/sessionService.js?versio=anterior');
    const sessioVella = await import('./SessionContext.jsx?versio=anterior');
    const identitatVella = await import('./IdentitatContext.jsx?versio=anterior');

    function SondaVella() {
      const { estat } = sessioVella.useSession();
      const { actorKey } = identitatVella.useIdentitat();
      return <output data-testid="sonda-vella">{`${estat}:${actorKey}`}</output>;
    }

    await act(async () => {
      render(
        <sessioVella.SessionProvider config={CONFIG}>
          <identitatVella.IdentitatProvider config={CONFIG}>
            <SondaVella />
          </identitatVella.IdentitatProvider>
        </sessioVella.SessionProvider>
      );
      await vi.dynamicImportSettled();
    });

    expect(serveiVell.getSessionState().estat).toBe('fora');
    expect(screen.getByTestId('sonda-vella').textContent).toBe('fora:persona::anon-local');

    // Simulem la recàrrega HMR de sessionService, SessionContext i IdentitatContext
    const serveiNou = await import('../../data/sessionService.js?versio=nova');
    const sessioNova = await import('./SessionContext.jsx?versio=nova');
    const identitatNova = await import('./IdentitatContext.jsx?versio=nova');

    expect(serveiNou).not.toBe(serveiVell);
    expect(sessioNova).not.toBe(sessioVella);
    expect(identitatNova).not.toBe(identitatVella);

    // La nova instància del servei conserva immediatament l'estat 'fora' (mai torna a 'comprovant')
    expect(serveiNou.getSessionState().estat).toBe('fora');

    function SondaNova() {
      const { estat } = sessioNova.useSession();
      const { actorKey } = identitatNova.useIdentitat();
      return <output data-testid="sonda-nova">{`${estat}:${actorKey}`}</output>;
    }

    cleanup();
    await act(async () => {
      render(
        <sessioVella.SessionProvider config={CONFIG}>
          <identitatVella.IdentitatProvider config={CONFIG}>
            <SondaNova />
          </identitatVella.IdentitatProvider>
        </sessioVella.SessionProvider>
      );
    });

    expect(screen.getByTestId('sonda-nova').textContent).toBe('fora:persona::anon-local');
  });
});
