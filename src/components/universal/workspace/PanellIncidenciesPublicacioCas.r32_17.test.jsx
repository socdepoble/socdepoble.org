import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { creaCanalFals, creaIdbFals } from '../../../utils/__fixtures__/navegadorFals.js';

const mockState = vi.hoisted(() => ({
  user: null,
  identity: null,
  config: null,
  capacitat: true,
  publicaFn: null,
  loadFn: null
}));

vi.mock('../../../app/contexts/UIContext.jsx', () => ({
  useUIStateOpcional: () => ({ externalConfig: mockState.config }),
  useUIActionsOpcional: () => ({ language: 'ca', t: (_k, fb) => fb })
}));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({
  useSessioOpcional: () => ({ currentUser: mockState.user, estat: mockState.user ? 'dins' : 'fora' })
}));
vi.mock('../../../app/contexts/useIdentitatOReserva.js', () => ({
  useIdentitatOReserva: () => mockState.identity
}));
vi.mock('../../PedraSeca/hooks/moderacioDePoble.js', () => ({
  useModeracio: () => ({ versioBloquejos: 0 })
}));
vi.mock('../../../data/backendPort.js', () => ({
  teCapacitat: () => mockState.capacitat,
  loadProjeccionsCataleg: (...args) => mockState.loadFn(...args),
  appendSectionSubmissionNetworkOnly: (...args) => mockState.publicaFn(...args)
}));

import { configuraBackendSessio, desaSessio, esborraSessio } from '../../../data/identitat.js';
import { useProjeccionsCataleg } from '../../../hooks/useProjeccionsCataleg.js';
import {
  CODIS_IDIOMA_INCIDENCIES_CAS,
  DICCIONARI_INCIDENCIES_CAS,
  textosIncidenciesCas
} from './i18nIncidenciesPublicacioCas.js';
import { PanellIncidenciesPublicacioCas } from './PanellIncidenciesPublicacioCas.jsx';

const TENANT = '0b6d6f9e-6c1f-4b8e-9a51-2f6c1d7e8a90';
const OWNER = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const FONT = {
  font: 'herbari',
  id: 'romer',
  title: 'Romer de serra',
  subtitle: 'Salvia rosmarinus',
  lead: 'Planta aromàtica tradicional'
};

describe('Onada R32.17 · Lot 01 (D-R32.15-1) · Resolució UI d’incidències de la cua CAS', () => {
  const savedGlobals = {};

  beforeEach(() => {
    savedGlobals.indexedDB = globalThis.indexedDB;
    savedGlobals.BroadcastChannel = globalThis.BroadcastChannel;
    savedGlobals.crypto = globalThis.crypto;
    globalThis.indexedDB = creaIdbFals();
    globalThis.BroadcastChannel = creaCanalFals();
    if (!globalThis.crypto?.subtle || !globalThis.crypto?.randomUUID) {
      Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
    }
    mockState.config = {
      backendId: 'supabase',
      dataMode: 'remote',
      supabaseUrl: 'https://socdepoble.supabase.co',
      supabaseAnonKey: 'anon-test-key',
      tenantId: TENANT
    };
    mockState.user = { id: OWNER };
    mockState.identity = {
      actorKey: `persona::${OWNER}`,
      actor: { tipus: 'persona', id: OWNER },
      actorId: OWNER,
      nomesLectura: false
    };
    mockState.capacitat = true;
    configuraBackendSessio(mockState.config);
    desaSessio({ access_token: 'tok-local-test', user: { id: OWNER, user_metadata: {} } });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    esborraSessio({ abast: 'tot' });
    globalThis.indexedDB = savedGlobals.indexedDB;
    globalThis.BroadcastChannel = savedGlobals.BroadcastChannel;
  });

  test('conserva intactes l’invariant literal de VITE_SDP_PUBLICACIONS_CAS, la Llei 32 en 5 llengües i 0 :has() al CSS', () => {
    const hookSrc = readFileSync(resolve(process.cwd(), 'src/hooks/useProjeccionsCataleg.js'), 'utf8');
    expect(hookSrc).toContain("if (import.meta.env.VITE_SDP_PUBLICACIONS_CAS !== '1') return false;");

    const cssSrc = readFileSync(resolve(process.cwd(), 'src/css/diferit-incidencies-cas.css'), 'utf8');
    expect(cssSrc).not.toContain(':has(');
    expect(cssSrc).toContain('min-block-size: 3rem;');
    expect(cssSrc).toContain('[data-sdp-senior="true"] .sdp-incidencies-cas__boto');
    expect(cssSrc).toContain('min-block-size: 3.5rem;');

    const clausCa = Object.keys(DICCIONARI_INCIDENCIES_CAS.ca).sort();
    for (const lang of CODIS_IDIOMA_INCIDENCIES_CAS) {
      const tx = textosIncidenciesCas(lang);
      expect(Object.keys(tx).sort()).toEqual(clausCa);
      const tot = Object.values(tx).join(' ');
      expect(tot).toContain('Sóc de Poble');
      expect(tot).not.toMatch(/sobir[aà]|soberan|sovereign|burujabe/i);
      expect(tot).not.toMatch(/servidor del poble|servidor del pueblo/i);
    }
  });

  test('el panell resol amb versioRemota quan existeix al servidor, amb null quan no existeix, avisa P2-C i gestiona errors', async () => {
    const onResol = vi.fn().mockResolvedValueOnce({ ok: true });
    const onRefresca = vi.fn().mockResolvedValueOnce();

    const incidencies = [
      {
        clau: 'herbari:romer',
        audiencia: 'publica',
        idPublicacio: '11111111-2222-4333-8444-555555555555',
        codi: 'conflicte-versio',
        seq: 2,
        font: FONT,
        destins: [],
        esRetirada: true,
        versioLocal: '2026-11-19T10:00:00.000001Z',
        lecturaRemotaOk: true,
        filaRemotaExisteix: true,
        versioRemotaActual: '2026-11-19T11:00:00.000002Z',
        titolRemot: 'Romer de serra'
      },
      {
        clau: 'herbari:espigol',
        audiencia: 'privada',
        idPublicacio: '22222222-3333-4444-8555-666666666666',
        codi: 'rebuig-servidor',
        seq: 1,
        font: { font: 'herbari', id: 'espigol', title: 'Espígol', subtitle: '', lead: '' },
        destins: ['rebost'],
        esRetirada: false,
        versioLocal: null,
        lecturaRemotaOk: true,
        filaRemotaExisteix: false,
        versioRemotaActual: null,
        titolRemot: null
      }
    ];

    render(
      <PanellIncidenciesPublicacioCas
        incidencies={incidencies}
        onResol={onResol}
        onRefresca={onRefresca}
        idioma="ca"
      />
    );

    expect(screen.getByTestId('avis-retirada-mur-p2c').textContent).toContain('conserva publicada l’última versió pública');
    expect(screen.getAllByText(/SDP-PUB-CAS-001\/002\/004\/005/).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole('button', { name: 'Reintenta amb la versió actual del servidor' }));
    await waitFor(() => {
      expect(onResol).toHaveBeenCalledWith('herbari:romer', 'publica', {
        versioRemota: '2026-11-19T11:00:00.000002Z'
      });
    });

    onResol.mockRejectedValueOnce(Object.assign(new Error('ja no hi és'), { codi: 'sense-incidencia' }));
    fireEvent.click(screen.getByRole('button', { name: 'Torna a publicar com a creació nova' }));
    await waitFor(() => {
      expect(onResol).toHaveBeenCalledWith('herbari:espigol', 'privada', { versioRemota: null });
    });
    expect(screen.getByRole('alert').textContent).toContain('ja s’havia resolt');
  });

  test('useProjeccionsCataleg exposa incidencies durables i resolIncidencia desbloqueja la retirada P2-C quan el servidor avança', async () => {
    vi.stubEnv('VITE_SDP_PUBLICACIONS_CAS', '1');

    const filesServidor = new Map();
    let rellotge = 0;

    mockState.loadFn = async ({ audiencia }) => {
      const sectionId = audiencia === 'publica' ? 'mur' : 'notes';
      const items = [...filesServidor.values()]
        .filter((f) => f.sectionId === sectionId)
        .map((f) => ({
          id: f.id,
          sectionId: f.sectionId,
          ownerUserId: OWNER,
          title: f.payload.title,
          updated_at: f.updatedAt,
          created_at: f.createdAt,
          projeccioCataleg: f.payload.projeccioCataleg
        }));
      return { items, cursor: null };
    };

    mockState.publicaFn = async (sub) => {
      const actual = filesServidor.get(sub.id) ?? null;
      const actualToken = actual?.updatedAt ?? null;
      if ((sub.expectedUpdatedAt ?? null) !== actualToken) {
        throw Object.assign(new Error('Conflicte de versió al servidor'), { codi: 'conflicte-versio' });
      }
      const updatedAt = `2026-11-19T12:00:00.${String(++rellotge).padStart(6, '0')}Z`;
      const createdAt = actual?.createdAt ?? '2026-11-19T12:00:00.000000Z';
      const saved = {
        id: sub.id,
        sectionId: sub.sectionId,
        payload: structuredClone(sub.payload),
        operationId: sub.operationId,
        createdAt,
        updatedAt
      };
      filesServidor.set(sub.id, saved);
      return saved;
    };

    const { result } = renderHook(() => useProjeccionsCataleg({ enabled: true }));
    await waitFor(() => expect(result.current.estat).toBe('sincronitzat'));

    // 1. Publicació inicial al Mur + Rebost
    await act(async () => {
      await result.current.desa(FONT, ['mur', 'rebost']);
    });
    expect(result.current.incidencies).toEqual([]);
    expect(result.current.estat).toBe('sincronitzat');

    // 2. Una altra sessió avança la versió pública al servidor
    const filaMur = [...filesServidor.values()].find((f) => f.sectionId === 'mur');
    const novaVersioServidor = '2026-11-19T12:00:00.000050Z';
    rellotge = 100;
    filesServidor.set(filaMur.id, { ...filaMur, updatedAt: novaVersioServidor });

    // 3. L'usuari retira la referència del Mur (només deixa 'rebost') -> P2-C conflicte-versio en 'publica'
    let errorRetirada = null;
    await act(async () => {
      try {
        await result.current.desa(FONT, ['rebost']);
      } catch (err) {
        errorRetirada = err;
      }
    });
    expect(errorRetirada).toMatchObject({ codi: 'incidencia-versio' });

    await waitFor(() => expect(result.current.incidencies).toHaveLength(1));
    expect(result.current.incidencies[0]).toMatchObject({
      audiencia: 'publica',
      codi: 'conflicte-versio',
      esRetirada: true
    });

    // 4. L'usuari refresca des del servidor per llegir la versió actual i resol l'incidència
    await act(async () => {
      await result.current.refresca();
    });
    expect(result.current.incidencies[0].versioRemotaActual).toBe(novaVersioServidor);

    await act(async () => {
      await result.current.resolIncidencia(
        result.current.incidencies[0].clau,
        'publica',
        { versioRemota: novaVersioServidor }
      );
    });

    expect(result.current.incidencies).toEqual([]);
    expect(result.current.estat).toBe('sincronitzat');
  });
});
