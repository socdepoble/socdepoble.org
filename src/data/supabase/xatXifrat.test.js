// @vitest-environment node
/* P1-12 Fase 4 (pla 261029_1305, E1.1 i E1.2) · El transport opac de clausXat i
   xatMultimediaXifrat: cada mètode és la seua RPC amb els seus paràmetres,
   els resultats es mapegen i prou; cap text en clar hi passa; una RPC absent
   al servidor (fase 1b/1c no aplicada) ix com a sense-capacitat-e2ee. */
import { beforeEach, describe, expect, test, vi } from 'vitest';

const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const B = 'bbbbbbbb-2222-4222-8222-222222222222';
const FIL = 'dddddddd-3333-4333-8333-333333333333';
const ID = '10000000-0000-4000-8000-000000000001';

vi.mock('./runtime.js', () => ({
  rpc: vi.fn(),
  request: vi.fn(),
  getResolvedConfig: vi.fn(() => ({ runtimeDataMode: 'remote', supabaseUrl: 'https://x.supabase.co' })),
  generateUUID: vi.fn(() => ID)
}));
vi.mock('../identitat.js', () => ({ usuariDeSessio: vi.fn(() => ({ id: A })), jwtPerBackend: vi.fn(() => 'jwt') }));

const { rpc } = await import('./runtime.js');
const X = await import('./xatXifrat.js');

beforeEach(() => { rpc.mockReset(); });

describe('clausXat', () => {
  test('enviaXifratXat: RPC xat_envia_xifrat amb el sobre tal qual; la fila torna amb text null i el sobre', async () => {
    const xifrat = { v: 1, epoca: 1, iv: 'aa', ct: 'bb', kid: 'cc', tf: 'dd' };
    rpc.mockResolvedValueOnce([{ id: ID, fil_id: FIL, seq: '7', usuari_id: A, cos: null, tipus: 'text', resposta_a: null, metadades: {}, es_ia: false, creat_al: '2026-10-29T13:00:00Z', xifrat }]);
    const fila = await X.enviaXifratXat(FIL, { id: ID, text: null, xifrat, respostaA: null, epocaNova: null });
    expect(rpc).toHaveBeenCalledWith('xat_envia_xifrat', { p_id: ID, p_fil_id: FIL, p_resposta_a: null, p_xifrat: xifrat, p_epoca_nova: null }, expect.anything(), expect.anything());
    expect(fila).toMatchObject({ id: ID, filId: FIL, seq: 7, usuariId: A, text: null, tipus: 'text', xifrat });
  });

  test('enviaXifratXat rebutja un paquet amb text en clar sense tocar la xarxa', async () => {
    await expect(X.enviaXifratXat(FIL, { id: ID, text: 'hola', xifrat: { v: 1 } })).rejects.toMatchObject({ codi: 'SDP-XAT-031' });
    expect(rpc).not.toHaveBeenCalled();
  });

  test('clausDeXat: RPC xat_claus_de i files en la forma del port', async () => {
    rpc.mockResolvedValueOnce([{ usuari_id: B, kid: 'k', sig_pub: 's', dh_pub: 'd', declaracio: 'D', autofirma: 'F', kid_anterior: null, firma_continuitat: null, creat_al: 't', retirada_al: null }]);
    const claus = await X.clausDeXat([B]);
    expect(rpc).toHaveBeenCalledWith('xat_claus_de', { p_usuaris: [B] }, expect.anything(), expect.anything());
    expect(claus).toEqual([{ usuariId: B, kid: 'k', sigPub: 's', dhPub: 'd', declaracio: 'D', autofirma: 'F', kidAnterior: null, firmaContinuitat: null, creatAl: 't', retiradaAl: null }]);
    await expect(X.clausDeXat(['no-uuid'])).rejects.toMatchObject({ code: 'format' });
  });

  test('una RPC absent al servidor (PGRST202) ix com a sense-capacitat-e2ee, mai com un èxit', async () => {
    rpc.mockRejectedValueOnce(Object.assign(new Error('PGRST202: Could not find the function public.xat_epoques_del_fil'), { status: 404 }));
    await expect(X.epoquesDelFilXat(FIL, 0)).rejects.toMatchObject({ codi: 'sense-capacitat-e2ee' });
    expect(rpc).toHaveBeenCalledWith('xat_epoques_del_fil', { p_fil_id: FIL, p_des_de: 0 }, expect.anything(), expect.anything());
  });

  test('els 13 mètodes de clausXat i els 2 de xatMultimediaXifrat existixen al transport', async () => {
    const { CAPACITATS } = await import('../contracte.js');
    for (const nom of [...CAPACITATS.clausXat, ...CAPACITATS.xatMultimediaXifrat]) expect(typeof X[nom], nom).toBe('function');
  });
});

describe('xatMultimediaXifrat', () => {
  test('publicaAdjuntXifratXat: un blob incoherent o un sobre absent no arriben a la xarxa', async () => {
    const blob = new Uint8Array(100);
    await expect(X.publicaAdjuntXifratXat(FIL, { id: ID, blob, mida: 99, xifrat: { v: 1 } })).rejects.toMatchObject({ codi: 'adjunt-incoherent' });
    await expect(X.publicaAdjuntXifratXat(FIL, { id: ID, blob, mida: 100, xifrat: null })).rejects.toMatchObject({ codi: 'adjunt-invalid' });
    expect(rpc).not.toHaveBeenCalled();
  });

  test('publicaAdjuntXifratXat: reserva com a octet-stream amb la mida xifrada i publica sense el hash', async () => {
    const blob = new Uint8Array(100);
    const xifrat = { v: 1, epoca: 1, iv: 'a', ct: 'b', kid: 'c', tf: 'd' };
    rpc.mockResolvedValueOnce([{ ruta: ID, pujat: true }]);
    rpc.mockResolvedValueOnce([{ id: ID, fil_id: FIL, seq: 3, usuari_id: A, cos: null, tipus: 'text', creat_al: 't', xifrat }]);
    const fila = await X.publicaAdjuntXifratXat(FIL, { id: ID, blob, mida: 100, xifrat, respostaA: null, epocaNova: null });
    expect(rpc.mock.calls[0].slice(0, 2)).toEqual(['xat_reserva_adjunt', { p_id: ID, p_fil_id: FIL, p_bytes: 100, p_mime: 'application/octet-stream', p_durada_ms: null }]);
    expect(rpc.mock.calls[1].slice(0, 2)).toEqual(['xat_publica_adjunt_xifrat', { p_id: ID, p_resposta_a: null, p_xifrat: xifrat, p_epoca_nova: null }]);
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('hash');
    expect(fila).toMatchObject({ id: ID, text: null, xifrat });
  });
});
