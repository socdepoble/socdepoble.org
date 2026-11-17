// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest';
const { rpc, getResolvedConfig, denunciaContingut } = vi.hoisted(() => ({ rpc: vi.fn(), getResolvedConfig: vi.fn(), denunciaContingut: vi.fn() }));
vi.mock('./runtime.js', () => ({ rpc, getResolvedConfig }));
vi.mock('./moderacio.js', () => ({ denunciaContingut }));
import { registraDenunciaPublica, adminSafataDenuncies, adminRevisaDenuncia } from './lssi.js';
const ID = '32500000-0000-4000-8000-000000000021';
const config = { dataMode: 'remote', signal: new AbortController().signal };
beforeEach(() => { vi.clearAllMocks(); getResolvedConfig.mockReturnValue({ runtimeDataMode: 'remote' }); });

test('registre delega al camí públic validat i conserva el mateix rebut/quota', async () => {
  denunciaContingut.mockResolvedValue({ rebuda: true, repetida: true });
  await expect(registraDenunciaPublica({ publicacioId: ID, motiu: 'altre', detall: 'Prova' }, config)).resolves.toEqual({ rebuda: true, repetida: true });
  expect(denunciaContingut).toHaveBeenCalledWith({ objecte: { tipus: 'publicacio', id: ID }, motiu: 'altre', detall: 'Prova', murPublic: true }, config);
});
test('entrada hostil i modes locals fallen abans del transport', async () => {
  for (const publicacioId of ['', null, {}, 'https://example.invalid', ID + '/']) await expect(registraDenunciaPublica({ publicacioId }, config)).rejects.toMatchObject({ code: 'lssi-invalid' });
  for (const limit of [0, 101, 1.5, '10', null]) await expect(adminSafataDenuncies({ limit }, config)).rejects.toMatchObject({ code: 'lssi-invalid' });
  await expect(adminRevisaDenuncia({ id: ID, decisio: 'retirada', justificacio: ' ' }, config)).rejects.toMatchObject({ code: 'lssi-invalid' });
  await expect(adminRevisaDenuncia({ id: ID, decisio: 'pendent', justificacio: 'motiu' }, config)).rejects.toMatchObject({ code: 'lssi-invalid' });
  for (const mode of ['seed', 'local']) {
    getResolvedConfig.mockReturnValue({ runtimeDataMode: mode });
    await expect(adminSafataDenuncies({}, config)).rejects.toMatchObject({ code: 'no-disponible' });
    await expect(registraDenunciaPublica({ publicacioId: ID }, config)).rejects.toMatchObject({ code: 'no-disponible' });
  }
  expect(rpc).not.toHaveBeenCalled(); expect(denunciaContingut).not.toHaveBeenCalled();
});
test('safata i revisió envien RPC exacta, senyal i expectativa de versió', async () => {
  rpc.mockResolvedValueOnce([]);
  await expect(adminSafataDenuncies({}, config)).resolves.toEqual([]);
  expect(rpc).toHaveBeenLastCalledWith('admin_safata_denuncies_lssi', { p_estat: 'pendent', p_limit: 50 }, config, { signal: config.signal });
  rpc.mockResolvedValueOnce({ id: ID, estat: 'retirada', repetida: false });
  await expect(adminRevisaDenuncia({ id: ID, decisio: 'retirada', justificacio: ' Cautela ' }, config)).resolves.toEqual({ id: ID, estat: 'retirada', repetida: false });
  expect(rpc).toHaveBeenLastCalledWith('admin_revisa_denuncia_lssi', { p_id: ID, p_decisio: 'retirada', p_justificacio: 'Cautela', p_estat_esperat: 'pendent' }, config, { signal: config.signal });
});
test('fallada remota, quota, conflicte i resposta malformada mai es fan passar per èxit', async () => {
  for (const e of [Object.assign(new Error('quota'), { status: 429 }), Object.assign(new Error('CAS'), { status: 409 }), new DOMException('Cancel·lat', 'AbortError')]) {
    rpc.mockRejectedValueOnce(e); await expect(adminSafataDenuncies({}, config)).rejects.toBe(e);
  }
  for (const value of [null, {}, [{ id: ID, publicacioId: ID, estat: 'inventat' }]]) {
    rpc.mockResolvedValueOnce(value); await expect(adminSafataDenuncies({}, config)).rejects.toMatchObject({ code: 'lssi-resposta-invalida' });
  }
  rpc.mockResolvedValueOnce({ id: ID, estat: 'retirada' });
  await expect(adminRevisaDenuncia({ id: ID, decisio: 'retirada', justificacio: 'Motiu' }, config)).rejects.toMatchObject({ code: 'lssi-resposta-invalida' });
});
test('DTO complet valida tipus i filtre i elimina qualsevol camp alié', async () => {
  const row = { id: ID, publicacioId: ID, tenantId: ID, seccio: 'mur', motiu: 'altre', detall: null,
    estat: 'pendent', creatAl: '2026-11-17T12:00:00Z', revisadaAl: null, estatContingut: 'visible', justificacio: null };
  rpc.mockResolvedValueOnce([{ ...row, denunciant: 'privat', ip_hash: 'privat' }]);
  expect(await adminSafataDenuncies({}, config)).toEqual([row]);
  for (const extra of [{ motiu: {} }, { detall: [] }, { estat: 'retirada' }, { tenantId: null }, { creatAl: 'mai' }, { justificacio: {} }]) {
    rpc.mockResolvedValueOnce([{ ...row, ...extra }]);
    await expect(adminSafataDenuncies({}, config)).rejects.toMatchObject({ code: 'lssi-resposta-invalida' });
  }
  rpc.mockResolvedValueOnce({ id: ID, estat: 'retirada', repetida: false, denunciant: 'privat' });
  expect(await adminRevisaDenuncia({ id: ID, decisio: 'retirada', justificacio: 'Motiu' }, config)).toEqual({ id: ID, estat: 'retirada', repetida: false });
});
