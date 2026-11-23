/* v1.2.23 · L4-02 (Gauntlet R1) · desaPublicacioPropia reconeix el conflicte (40001), la denegació (42501) i la quota
   (54000) amb la forma real del transport: runtime.js desa el SQLSTATE de PostgreSQL a `sqlstate` i només els PGRST###
   a `postgrestCode`. Abans llegia `postgrestCode === '40001'`, que el transport no omple mai. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, expect, test, vi } from 'vitest';
const I = '44000000-0000-4000-8000-000000000020', O = '44000000-0000-4000-8000-000000000030';
const state = vi.hoisted(() => ({ request: vi.fn(), guard: vi.fn() }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => ({ id: '44000000-0000-4000-8000-000000000001' }),
  getResolvedConfig: () => ({ runtimeDataMode: 'remote', hasSupabaseConfig: true, tenantId: '44000000-0000-4000-8000-000000000010', supabaseUrl: 'https://example.invalid' }),
  request: (...args) => state.request(...args) }));
vi.mock('../identitat.js', () => ({ capturaSessio: () => state.guard }));
import { desaPublicacioPropia } from './publicacionsPropies.js';

const publication = () => ({ id: I, sectionId: 'mur', payload: { title: 'Títol', content: 'Text' }, expectedUpdatedAt: '2026-11-22T22:00:00.123456Z', operationId: O });
/* v1.2.23 · L4-02 (Gauntlet R1) · La mateixa forma que runtime.js: missatge «Supabase <status>: <cos>», `status` i, del cos JSON, `sqlstate`. */
const transport = (status, sqlstate, message = '') => Object.assign(new Error(`Supabase ${status}: ${JSON.stringify({ code: sqlstate, message })}`), { status, sqlstate });
beforeEach(() => { state.request.mockReset(); state.guard.mockReset(); });

test('el transport real omple sqlstate amb el SQLSTATE i postgrestCode només amb PGRST###', () => {
  const runtime = readFileSync(path.join(process.cwd(), 'src/data/supabase/runtime.js'), 'utf8');
  expect(runtime).toContain("if (typeof detail?.code === 'string' && /^[A-Z0-9]{5}$/.test(detail.code)) failure.sqlstate = detail.code;");
  expect(runtime).toContain("if (typeof detail?.code === 'string' && /^PGRST\\d{3}$/.test(detail.code)) failure.postgrestCode = detail.code;");
});

test.each([
  ['40001', 409, 'SDP-BETA-003: la publicació ha canviat.', 'conflicte-versio'],
  ['42501', 403, 'SDP-BETA-002: publicació no disponible.', 'sense-permis'],
  ['54000', 400, 'SDP-BETA-429: quota diària de 200 operacions.', 'quota-assolida']
])('SQLSTATE %s del servidor (%i) dona un codi accionable i conserva la causa', async (sqlstate, status, message, codi) => {
  const cause = transport(status, sqlstate, message);
  state.request.mockRejectedValue(cause);
  await expect(desaPublicacioPropia(publication())).rejects.toMatchObject({ codi, code: codi, cause });
});

test('el SQLSTATE sol, sense el marcador SDP-BETA al missatge, també es reconeix', async () => {
  for (const [sqlstate, codi] of [['40001', 'conflicte-versio'], ['42501', 'sense-permis'], ['54000', 'quota-assolida']]) {
    state.request.mockRejectedValue(Object.assign(new Error('Supabase 400'), { status: 400, sqlstate }));
    await expect(desaPublicacioPropia(publication())).rejects.toMatchObject({ codi });
  }
});

test('un altre rebuig SQL torna la causa original, sense inventar cap codi', async () => {
  const cause = transport(400, '22023', 'SDP-BETA-001: petició invàlida.');
  state.request.mockRejectedValue(cause);
  await expect(desaPublicacioPropia(publication())).rejects.toBe(cause);
  const absent = Object.assign(new Error('Supabase 404'), { status: 404, postgrestCode: 'PGRST202' });
  state.request.mockRejectedValue(absent);
  await expect(desaPublicacioPropia(publication())).rejects.toMatchObject({ codi: 'esquema-absent', cause: absent });
  expect(state.request).toHaveBeenCalledTimes(2);
});
