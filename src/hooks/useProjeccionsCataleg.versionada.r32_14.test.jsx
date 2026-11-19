import { afterEach, describe, expect, test, vi } from 'vitest';
import { publicacionsVersionades } from './useProjeccionsCataleg.js';

/* Onada R32.14 · D-R32-PUB-1: el CAS general de publicacions queda cablejat però apagat per
   defecte (P1 del Gauntlet: «conflicte-versio» sense eixida encalla la cua). Amb
   VITE_SDP_PUBLICACIONS_CAS=1, només on el servidor té publica_section_submission_cas
   (Supabase remot, SQL R32.11 aplicat pel Mestre el 19-11-2026 01:37 CET). */
const TENANT = '0b6d6f9e-6c1f-4b8e-9a51-2f6c1d7e8a90';
afterEach(() => { vi.unstubAllEnvs(); });

describe('R32.14 · publicacionsVersionades (D-R32-PUB-1)', () => {
  test('sense l’interruptor (els builds d’ara), cap camí no activa el CAS general', () => {
    expect(publicacionsVersionades({ backendId: 'supabase', dataMode: 'remote', supabaseUrl: 'https://x.supabase.co', tenantId: TENANT })).toBe(false);
  });
  test('amb VITE_SDP_PUBLICACIONS_CAS=1, Supabase en mode remot publica amb CAS general', () => {
    vi.stubEnv('VITE_SDP_PUBLICACIONS_CAS', '1');
    expect(publicacionsVersionades({ backendId: 'supabase', dataMode: 'remote', supabaseUrl: 'https://x.supabase.co', tenantId: TENANT })).toBe(true);
  });
  test('amb l’interruptor, el mode local o de proves, un altre backend o una configuració invàlida continuen pel camí de sempre', () => {
    vi.stubEnv('VITE_SDP_PUBLICACIONS_CAS', '1');
    expect(publicacionsVersionades({ backendId: 'local', dataMode: 'remote', tenantId: TENANT })).toBe(false);
    expect(publicacionsVersionades({ backendId: 'supabase', dataMode: 'seed', tenantId: TENANT })).toBe(false);
    expect(publicacionsVersionades({ backendId: 'supabase', dataMode: 'local', tenantId: TENANT })).toBe(false);
    expect(publicacionsVersionades({ backendId: 'supabase', dataMode: 'remote', tenantId: 'no-uuid' })).toBe(false);
  });
  test('qualsevol altre valor de l’interruptor el deixa apagat', () => {
    vi.stubEnv('VITE_SDP_PUBLICACIONS_CAS', 'true');
    expect(publicacionsVersionades({ backendId: 'supabase', dataMode: 'remote', tenantId: TENANT })).toBe(false);
  });
});
