import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ defineix: vi.fn(), refresh: vi.fn(), rol: vi.fn() }));
vi.mock('../src/PedraSecaEmbed.jsx', () => ({ defineCustomElement: (...args) => m.defineix(...args) }));
vi.mock('../src/utils/sanitize.js', () => ({ sanitizeHtml: x => x }));
vi.mock('../src/apps/plataforma/registreApps.js', () => ({ registraAppExterna: vi.fn(), registraModul: vi.fn() }));

let release;
let serveiActual;
let identitatActual;
let oients;
let spies;
const config = {
  backendUrl: 'https://hmr.supabase.test', backendId: 'supabase', dataMode: 'remote',
  tenantId: '11111111-1111-4111-8111-111111111111'
};

beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear(); localStorage.clear();
  m.defineix.mockReset(); m.refresh.mockReset(); m.rol.mockReset().mockResolvedValue('usuari');
  oients = [];
  spies = [window, document].map(objectiu => {
    const add = objectiu.addEventListener.bind(objectiu);
    return vi.spyOn(objectiu, 'addEventListener').mockImplementation((nom, callback, opcions) => {
      oients.push([objectiu, nom, callback, opcions]);
      return add(nom, callback, opcions);
    });
  });
});
afterEach(() => {
  release?.(); release = null;
  for (const [objectiu, nom, callback, opcions] of oients) objectiu.removeEventListener(nom, callback, opcions);
  for (const spy of spies) spy.mockRestore();
  identitatActual?.esborraSessio({ abast: 'tot' });
  serveiActual?.sincronitza();
  identitatActual = null; serveiActual = null;
});

async function primerHost({ arrenca = true } = {}) {
  const host = await import('../src/host.js?hmr=abans');
  identitatActual = await import('../src/data/identitat.js');
  identitatActual.configuraBackendSessio(config);
  const { CONTRACTE_NUCLI } = await import('../src/data/contracte.js');
  const backend = Object.fromEntries(CONTRACTE_NUCLI.map(nom => [nom, () => undefined]));
  backend.getCurrentUser = () => identitatActual.usuariDeSessio();
  backend.refrescaSessio = (...args) => m.refresh(...args);
  backend.elMeuRol = (...args) => m.rol(...args);
  host.injectaBackendDelPaquet(backend);
  if (arrenca) await host.arrenca();
  return host;
}

async function serveiNou() {
  serveiActual = await import('../src/data/sessionService.js');
  release = serveiActual.setSessionConfig(config, Symbol('HMR'));
  return serveiActual;
}
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const base64url = valor => btoa(JSON.stringify(valor)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
function sessio(segons = 3600) {
  return {
    access_token: `${base64url({ alg: 'none' })}.${base64url({ sub: A, exp: Math.floor(Date.now() / 1000) + segons })}.c2ln`,
    refresh_token: 'refresh-sintetic', user: { id: A }
  };
}
const senyalAuth = () => window.dispatchEvent(new CustomEvent('sdp:auth-change'));

test('reavaluar host conserva l’arrencada segellada i la sessió anònima es resol', async () => {
  const anterior = await primerHost();
  const actual = await import('../src/host.js');
  expect(anterior).not.toBe(actual);
  const servei = await serveiNou();
  await vi.waitFor(() => expect(servei.getSessionState().estat).toBe('fora'), { timeout: 200 });
  await expect(actual.quanLlest()).resolves.toMatchObject({ fase: 'segellat' });
  expect(actual.estat().fase).toBe('segellat');
  expect(m.defineix).toHaveBeenCalledTimes(1);
});

test('sessió activa rere HMR: cap fora fals, logout invalida el rol pendent i la configuració continua segellada', async () => {
  const anterior = await primerHost();
  identitatActual.desaSessio(sessio());
  let resolRol;
  m.rol.mockImplementation(() => new Promise(resolve => { resolRol = resolve; }));
  const servei = await serveiNou();
  const estats = [];
  const deixa = servei.subscribeSession(s => estats.push(s.estat));
  try {
    await vi.waitFor(() => expect(servei.getSessionState()).toMatchObject({ estat: 'dins', usuari: { id: A } }));
    expect(estats).not.toContain('fora');
    const actual = await import('../src/host.js');
    for (const host of [anterior, actual]) {
      expect(() => host.configura({})).toThrow('ja ha començat');
      expect(() => host.injectaBackendDelPaquet({})).toThrow('ja ha començat');
    }
    expect(() => servei.setSessionConfig({ ...config, backendUrl: 'https://altre.test' }, Symbol())).toThrow('Dos instàncies');
    identitatActual.esborraSessio({ abast: 'tot' }); senyalAuth();
    resolRol('superadmin');
    await Promise.resolve(); await Promise.resolve();
    expect(servei.getSessionState()).toMatchObject({ estat: 'fora', usuari: null, rol: null });
    expect(m.refresh).not.toHaveBeenCalled();
  } finally { deixa(); }
});

test('una renovació realment pendent continua comprovant després d’HMR, sense declarar fora', async () => {
  await primerHost();
  identitatActual.desaSessio(sessio(-60));
  let acaba;
  m.refresh.mockImplementation(() => new Promise(resolve => { acaba = resolve; }));
  const servei = await serveiNou();
  const estats = [];
  const deixa = servei.subscribeSession(s => estats.push(s.estat));
  try {
    await vi.waitFor(() => expect(m.refresh).toHaveBeenCalledTimes(1));
    expect(servei.getSessionState().estat).toBe('comprovant');
    expect(estats).not.toContain('fora');
    identitatActual.desaSessio(sessio(), { renovacio: true }); senyalAuth(); acaba(true);
    await vi.waitFor(() => expect(servei.getSessionState()).toMatchObject({ estat: 'dins', usuari: { id: A } }));
    expect(estats).not.toContain('fora');
    expect(m.refresh).toHaveBeenCalledTimes(1);
  } finally { deixa(); }
});

test('manual/defer travessa les versions: no arrenca ni resol la sessió fins a l’ordre explícita', async () => {
  const anterior = await primerHost({ arrenca: false });
  anterior.deferArrenca();
  const actual = await import('../src/host.js');
  const servei = await serveiNou();
  actual.arrencaAuto();
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(actual.estat().fase).toBe('configurable');
  expect(servei.getSessionState().estat).toBe('comprovant');
  expect(m.defineix).not.toHaveBeenCalled();
  const control = new AbortController();
  const avortada = expect(actual.quanLlest({ signal: control.signal })).rejects.toMatchObject({ name: 'AbortError' });
  control.abort(); await avortada;
  await anterior.arrenca();
  await vi.waitFor(() => expect(servei.getSessionState().estat).toBe('fora'));
  expect(m.defineix).toHaveBeenCalledTimes(1);
});

test('la fallada i el reintent explícit travessen versions sense perdre les esperes', async () => {
  const anterior = await primerHost({ arrenca: false });
  const fallada = new Error('fallada sintètica');
  m.defineix.mockImplementationOnce(() => { throw fallada; });
  const espera = expect(anterior.quanLlest()).rejects.toBe(fallada);
  await expect(anterior.arrenca()).rejects.toBe(fallada);
  await espera;
  const actual = await import('../src/host.js');
  await expect(actual.quanLlest()).resolves.toMatchObject({ fase: 'segellat' });
  await expect(anterior.quanLlest()).resolves.toMatchObject({ fase: 'segellat' });
  expect(m.defineix).toHaveBeenCalledTimes(2);
});
