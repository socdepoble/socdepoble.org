import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const store = vi.hoisted(() => ({ values: new Map(), efimers: new Map(), writable: true }));
vi.mock('./storage.js', () => ({ getVal: (key, fallback) => store.values.get(key) ?? fallback, setVal: (key, value) => {
  if (!store.writable) return false;
  store.values.set(key, value);
  return true;
}, delVal: (key) => {
  if (!store.writable) return false;
  store.values.delete(key);
  return true;
},
/* Encàrrec 261018_1220 · La capa efímera (de la pestanya): l'elecció de proves. */
getEfimer: (key, fallback) => store.efimers.get(key) ?? fallback, setEfimer: (key, value) => {
  if (!store.writable) return false;
  store.efimers.set(key, value);
  return true;
}, delEfimer: (key) => {
  store.efimers.delete(key);
  return true;
} }));
vi.mock('./runtimePolicy.js', () => ({ getRuntimePolicy: () => null }));
const config = { backendId: 'custom', backendUrl: 'https://example.test/api', tenantId: '00000000-0000-0000-0000-000000000000', dataMode: 'seed' };
const clau = `data-mode-choice:${JSON.stringify(['custom', 'https://example.test/api', '00000000-0000-0000-0000-000000000000'])}`;
// T13 · Quin procés de `vite` simula cada prova; '' simula un build (DEV false).
const servidor = (valor) => { vi.stubEnv('VITE_SDP_SERVIDOR_DEV', valor); vi.stubEnv('DEV', valor !== ''); };
beforeEach(() => { vi.resetModules(); store.values.clear(); store.efimers.clear(); store.writable = true; servidor('dev-a'); });
afterEach(() => { vi.unstubAllEnvs(); });

test('el mode remot és explícit, es manté després de recarregar i no transporta credencials', async () => {
  const first = await import('./dataMode.js');
  const reload = vi.fn();
  expect(first.resolveDataMode(config)).toBe('seed');
  first.enterRemoteMode({ ...config, supabaseAnonKey: 'public-key' }, reload);
  expect(reload).toHaveBeenCalledTimes(1);
  expect(JSON.stringify([...store.values])).not.toContain('public-key');
  expect(first.resolveDataMode(config)).toBe('seed');
  vi.resetModules();
  const { normalizeBackendConfig } = await import('./backendConfig.js');
  expect(normalizeBackendConfig(config).dataMode).toBe('remote');
  expect(normalizeBackendConfig({ backendId: 'custom', backend_url: 'https://example.test/api/', tenant_id: '00000000-0000-0000-0000-000000000000', dataMode: 'seed' }).dataMode).toBe('remote');
});

test('l’elecció no afecta altres proveïdors, camins ni pobles', async () => {
  const { enterRemoteMode } = await import('./dataMode.js');
  enterRemoteMode(config, vi.fn());
  vi.resetModules();
  const { resolveDataMode } = await import('./dataMode.js');
  for (const different of [{ backendId: 'other' }, { backendUrl: 'https://example.test/other' }, { tenantId: '00000000-0000-4000-8000-000000000003' }]) {
    expect(resolveDataMode({ ...config, ...different })).toBe('seed');
  }
});

test('una altra pestanya no pot canviar el mode d’un muntatge viu', async () => {
  const { resolveDataMode } = await import('./dataMode.js');
  expect(resolveDataMode(config)).toBe('seed');
  // Una elecció VÀLIDA per a este procés: només el retrat del document la para.
  store.values.set(clau, { v: 1, mode: 'remote', servidor: 'dev-a' });
  expect(resolveDataMode(config)).toBe('seed');
  vi.resetModules();
  expect((await import('./dataMode.js')).resolveDataMode(config)).toBe('remote');
});

test('entrar en un segon node conserva l’elecció del primer després de recarregar', async () => {
  const { enterRemoteMode } = await import('./dataMode.js');
  const second = { ...config, tenantId: 'segon-poble' };
  enterRemoteMode(config, vi.fn());
  enterRemoteMode(second, vi.fn());
  vi.resetModules();
  const { resolveDataMode } = await import('./dataMode.js');
  expect(resolveDataMode(config)).toBe('remote');
  expect(resolveDataMode(second)).toBe('remote');
});

test('quota denegada no recarrega ni simula una entrada real', async () => {
  const { enterRemoteMode } = await import('./dataMode.js');
  const reload = vi.fn(); store.writable = false;
  expect(() => enterRemoteMode(config, reload)).toThrow('No s’ha pogut guardar');
  expect(reload).not.toHaveBeenCalled();
});

test('T13 · un procés nou de `vite` torna al mode de VITE_DATA_MODE; el mateix procés el conserva', async () => {
  (await import('./dataMode.js')).enterRemoteMode(config, vi.fn());
  expect(store.values.get(clau)).toEqual({ v: 1, mode: 'remote', servidor: 'dev-a' });
  vi.resetModules();                                    // recàrrega, pestanya nova o reinici de Vite sol
  expect((await import('./dataMode.js')).resolveDataMode(config)).toBe('remote');
  servidor('dev-b'); vi.resetModules();                 // `npm run dev` de nou
  expect((await import('./dataMode.js')).resolveDataMode(config)).toBe('seed');
});

test('T13 · una elecció d’abans (sense empremta) no val en desenvolupament i sí en un build', async () => {
  store.values.set(clau, { v: 1, mode: 'remote' });
  expect((await import('./dataMode.js')).resolveDataMode(config)).toBe('seed');
  servidor(''); vi.resetModules();
  expect((await import('./dataMode.js')).resolveDataMode(config)).toBe('remote');
});

test('T13 · en un build l’elecció es desa com abans i dura entre càrregues', async () => {
  servidor('');
  (await import('./dataMode.js')).enterRemoteMode(config, vi.fn());
  expect(store.values.get(clau)).toEqual({ v: 1, mode: 'remote' });
  vi.resetModules();
  expect((await import('./dataMode.js')).resolveDataMode(config)).toBe('remote');
});

test('T2 · exitRemoteMode esborra l’elecció d’este node i recarrega; la càrrega següent torna al mode demanat', async () => {
  servidor('');
  const altre = { ...config, tenantId: '00000000-0000-4000-8000-000000000003' };
  const first = await import('./dataMode.js');
  first.enterRemoteMode(config, vi.fn());
  first.enterRemoteMode(altre, vi.fn());
  vi.resetModules();
  const second = await import('./dataMode.js');
  expect(second.resolveDataMode(config)).toBe('remote');
  const reload = vi.fn();
  second.exitRemoteMode(config, reload);
  expect(reload).toHaveBeenCalledTimes(1);
  expect(store.values.has(clau)).toBe(false);
  vi.resetModules();
  const third = await import('./dataMode.js');
  expect(third.resolveDataMode(config)).toBe('seed');
  expect(third.resolveDataMode(altre)).toBe('remote');
});

test('T2 · si l’emmagatzematge no deixa esborrar, exitRemoteMode avisa i no recarrega', async () => {
  const { exitRemoteMode } = await import('./dataMode.js');
  const reload = vi.fn(); store.writable = false;
  expect(() => exitRemoteMode(config, reload)).toThrow('No s’ha pogut esborrar');
  expect(reload).not.toHaveBeenCalled();
});

test('T2 · eleccioRemotaActiva només és certa quan l’elecció ha substituït un mode local', async () => {
  servidor('');
  store.values.set(clau, { v: 1, mode: 'remote' });
  const { resolveDataMode, eleccioRemotaActiva } = await import('./dataMode.js');
  expect(eleccioRemotaActiva(config)).toBe(false);
  expect(resolveDataMode(config)).toBe('remote');
  expect(eleccioRemotaActiva(config)).toBe(true);
  expect(eleccioRemotaActiva({ ...config, tenantId: '00000000-0000-4000-8000-000000000003' })).toBe(false);
  vi.resetModules();
  const release = await import('./dataMode.js');
  expect(release.resolveDataMode({ ...config, dataMode: 'remote' })).toBe('remote');
  expect(release.eleccioRemotaActiva(config)).toBe(false);
});

test('T13 · sense VITE_DATA_MODE (producció) el mode és remote encara que hi haja una elecció', async () => {
  store.values.set(clau, { v: 1, mode: 'remote', servidor: 'dev-a' });
  const { resolveDataMode } = await import('./dataMode.js');
  expect(resolveDataMode({ ...config, dataMode: undefined })).toBe('remote');
  expect(resolveDataMode({ ...config, dataMode: 'remote' })).toBe('remote');
});

/* ── Encàrrec 261018_1220 (Tasques 0 i 2) · L'elecció de proves en desenvolupament ── */
const remot = { ...config, dataMode: 'remote' };
const clauProves = `data-mode-proves:${JSON.stringify(['custom', 'https://example.test/api', '00000000-0000-0000-0000-000000000000'])}`;

test('261018 · en desenvolupament, un paquet remot passa al mode de proves en la càrrega següent d’esta pestanya', async () => {
  const primer = await import('./dataMode.js');
  const reload = vi.fn();
  expect(primer.resolveDataMode(remot)).toBe('remote');
  primer.enterTestMode({ ...remot, supabaseAnonKey: 'public-key' }, reload);
  expect(reload).toHaveBeenCalledTimes(1);
  expect(store.efimers.get(clauProves)).toEqual({ v: 1, mode: primer.MODE_DE_PROVES, servidor: 'dev-a' });
  // Revisió adversarial · res al registre de tot el navegador: les altres pestanyes no canvien.
  expect(store.values.size).toBe(0);
  expect(JSON.stringify([...store.efimers])).not.toContain('public-key');
  // El retrat del document no canvia fins a recarregar.
  expect(primer.resolveDataMode(remot)).toBe('remote');
  vi.resetModules();
  const { normalizeBackendConfig } = await import('./backendConfig.js');
  expect(normalizeBackendConfig(remot).dataMode).toBe('seed');
  // Un paquet que ja demana un mode local el conserva.
  expect(normalizeBackendConfig({ ...config, dataMode: 'local' }).dataMode).toBe('local');
});

test('261018 · una altra pestanya (sense l’elecció efímera) continua en remot', async () => {
  (await import('./dataMode.js')).enterTestMode(remot, vi.fn());
  store.efimers.clear();
  vi.resetModules();
  expect((await import('./dataMode.js')).resolveDataMode(remot)).toBe('remote');
});

test('261018 · dins de la pestanya mana sobre l’elecció remota, i entrar al servidor l’esborra', async () => {
  const { enterRemoteMode, enterTestMode } = await import('./dataMode.js');
  enterRemoteMode(config, vi.fn());
  enterTestMode(remot, vi.fn());
  vi.resetModules();
  let mode = await import('./dataMode.js');
  expect(mode.resolveDataMode(config)).toBe('seed');
  expect(mode.resolveDataMode(remot)).toBe('seed');
  expect(mode.eleccioRemotaActiva(config)).toBe(false);
  mode.enterRemoteMode(config, vi.fn());
  expect(store.efimers.has(clauProves)).toBe(false);
  vi.resetModules();
  mode = await import('./dataMode.js');
  expect(mode.resolveDataMode(remot)).toBe('remote');
  expect(mode.resolveDataMode(config)).toBe('remote');
});

test('261018 · un `npm run dev` nou torna al mode del paquet (T13)', async () => {
  (await import('./dataMode.js')).enterTestMode(remot, vi.fn());
  servidor('dev-b');
  vi.resetModules();
  expect((await import('./dataMode.js')).resolveDataMode(remot)).toBe('remote');
});

test('261018 · en un build no es pot triar i una elecció de proves desada no hi val', async () => {
  servidor('');
  const { enterTestMode } = await import('./dataMode.js');
  const reload = vi.fn();
  expect(() => enterTestMode(remot, reload)).toThrow('només es pot triar en desenvolupament');
  expect(reload).not.toHaveBeenCalled();
  expect(store.efimers.has(clauProves)).toBe(false);
  store.efimers.set(clauProves, { v: 1, mode: 'seed', servidor: '' });
  vi.resetModules();
  expect((await import('./dataMode.js')).resolveDataMode(remot)).toBe('remote');
});

test('261018 · si el navegador no deixa desar, no recarrega', async () => {
  store.writable = false;
  const { enterTestMode } = await import('./dataMode.js');
  const reload = vi.fn();
  expect(() => enterTestMode(remot, reload)).toThrow('No s’ha pogut guardar l’elecció');
  expect(reload).not.toHaveBeenCalled();
});
