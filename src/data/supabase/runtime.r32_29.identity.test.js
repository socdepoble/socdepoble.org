import { afterEach, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio, entradaSessio } from '../identitat.js';
import { request, configuraRefrescSessio } from './runtime.js';
import { elsMeusSeguiments } from './seguiments.js';

const A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const CONFIG = Object.freeze({ dataMode: 'remote', supabaseUrl: 'https://runtime.example.test', supabaseAnonKey: 'sb_publishable_synthetic', tenantId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((r, j) => { resolve = r; reject = j; });
  return { promise, resolve, reject };
};
const entra = (id = A, renovacio = false) => {
  configuraBackendSessio(CONFIG);
  expect(desaSessio({ access_token: `token-${id}`, refresh_token: 'rt-fixture', user: { id } }, { renovacio })).toBe(true);
};
function transportAmbCosPendent() {
  const entered = deferred();
  const body = deferred();
  const fetch = vi.fn(async () => ({
    ok: true, status: 200, headers: { get: () => null },
    json: () => { entered.resolve(); return body.promise; },
  }));
  vi.stubGlobal('fetch', fetch);
  return { entered, body, fetch };
}
afterEach(() => {
  esborraSessio({ abast: 'tot' });
  sessionStorage.clear();
  localStorage.clear();
  vi.unstubAllGlobals();
  configuraRefrescSessio(async () => false);
  vi.useRealTimers();
});

for (const canvi of ['altra persona', 'eixida', 'nova entrada del mateix UUID']) {
  test(`R32.29 · 200 amb cos en vol després de ${canvi}: cap dada privada de la sessió revocada`, async () => {
    entra();
    const { entered, body } = transportAmbCosPendent();
    const pending = request('/rest/v1/private_rows', CONFIG);
    const receipt = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await entered.promise;
    esborraSessio({ abast: 'tot' });
    if (canvi !== 'eixida') entra(canvi === 'altra persona' ? B : A);
    body.resolve([{ private_owner: A, secret_note: 'fixture-only' }]);
    await receipt;
  });
}

test('R32.29 · renovar el token del mateix llinatge durant el cos no perd una lectura legítima', async () => {
  entra();
  const { entered, body } = transportAmbCosPendent();
  const pending = request('/rest/v1/private_rows', CONFIG);
  await entered.promise;
  entra(A, true);
  body.resolve([{ owner: A }]);
  await expect(pending).resolves.toEqual([{ owner: A }]);
});

test('R32.29 · la llista privada de seguiments no arriba al compte que entra mentre es descarrega', async () => {
  entra();
  const { entered, body } = transportAmbCosPendent();
  const pending = elsMeusSeguiments(CONFIG);
  const receipt = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  await entered.promise;
  esborraSessio({ abast: 'tot' });
  entra(B);
  body.resolve([{ tipus: 'persona', id: A, nom: 'Relació privada de la fixture' }]);
  await receipt;
});

test('R32.29 · el cos ja llegit després de cancel·lar el consumidor no es torna com a èxit', async () => {
  entra();
  const { entered, body } = transportAmbCosPendent();
  const controller = new AbortController();
  const pending = request('/rest/v1/private_rows', CONFIG, { signal: controller.signal });
  const receipt = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  await entered.promise;
  controller.abort();
  body.resolve([{ owner: A }]);
  await receipt;
});

for (const status of [200, 204]) {
  test(`R32.29 · resposta ${status} que arriba després de canviar de persona: es rebutja abans de llegir-ne el cos`, async () => {
    entra();
    const entered = deferred(), response = deferred();
    const json = vi.fn(async () => [{ owner: A }]);
    vi.stubGlobal('fetch', vi.fn(() => { entered.resolve(); return response.promise; }));
    const pending = request('/rest/v1/private_rows', CONFIG);
    const receipt = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await entered.promise;
    esborraSessio({ abast: 'tot' });
    entra(B);
    response.resolve({ ok: true, status, json, headers: { get: () => null } });
    await receipt;
    expect(json).not.toHaveBeenCalled();
  });
}

test('R32.29 · un error HTTP llegit després de revocar la sessió és cancel·lació del context antic', async () => {
  entra();
  const entered = deferred(), body = deferred();
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: false, status: 500,
    text: () => { entered.resolve(); return body.promise; },
  })));
  const pending = request('/rest/v1/private_rows', CONFIG);
  const receipt = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  await entered.promise;
  esborraSessio({ abast: 'tot' });
  entra(B);
  body.resolve(JSON.stringify({ message: 'Error de la fixture antiga' }));
  await receipt;
});

test('R32.29 · canviar de backend durant el cos invalida la lectura de l’àmbit anterior', async () => {
  entra();
  const { entered, body } = transportAmbCosPendent();
  const pending = request('/rest/v1/private_rows', CONFIG);
  const receipt = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  await entered.promise;
  configuraBackendSessio({ ...CONFIG, supabaseUrl: 'https://altre-runtime.example.test' });
  body.resolve([{ owner: A }]);
  await receipt;
});

test('R32.29 · la lectura pública anònima continua sense heretar el JWT en canviar la sessió', async () => {
  entra();
  const { entered, body, fetch } = transportAmbCosPendent();
  const pending = request('/rest/v1/public_rows', CONFIG, { anonim: true });
  await entered.promise;
  esborraSessio({ abast: 'tot' });
  entra(B);
  body.resolve([{ public: true }]);
  await expect(pending).resolves.toEqual([{ public: true }]);
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${CONFIG.supabaseAnonKey}`);
  expect(fetch.mock.calls[0][1].credentials).toBe('omit');
});

test('R32.29 · un callback de metadades que revoca el context no deixa escapar el cos antic', async () => {
  entra();
  const { entered, body } = transportAmbCosPendent();
  const pending = request('/rest/v1/private_rows', CONFIG, {
    onResponseMetadata: () => { esborraSessio({ abast: 'tot' }); entra(B); },
  });
  const receipt = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  await entered.promise;
  body.resolve([{ owner: A }]);
  await receipt;
});

/* v1.2.19 · Gauntlet R1 (L1-02) · Només el signal de qui crida talla l'espera del refresc post-401, la regla del
   preflight (L2-02). La variant «timeout» d'esta prova fixava la contrària (el temporitzador del fetch també la
   tallava): ara és la de davall, que exigix que el termini del fetch passe sense tallar-la. */
for (const refreshed of [true, false]) {
  test(`R32.29 · abort durant un refresc que torna ${refreshed}: cap reintent ni lectura del cos vell`, async () => {
    vi.useFakeTimers();
    entra();
    const entered = deferred(), refresh = deferred();
    configuraRefrescSessio(async () => {
      entered.resolve();
      await refresh.promise;
      if (refreshed) entra(A, true);
      return refreshed;
    });
    const text = vi.fn(async () => 'Error de la fixture inicial');
    const fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 401, text })
      .mockResolvedValue({ ok: true, status: 200, json: async () => [{ owner: A }], headers: { get: () => null } });
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    const pending = request('/rest/v1/private_rows', CONFIG, { signal: controller.signal, timeoutMs: 12000 });
    const receipt = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await entered.promise;
    const originalSignal = fetch.mock.calls[0][1].signal;
    controller.abort();
    expect(originalSignal.aborted).toBe(true);
    refresh.resolve();
    await receipt;
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(text).not.toHaveBeenCalled();
  });

  test(`v1.2.19 · Gauntlet R1 (L1-02) · el termini del fetch passa durant un refresc que torna ${refreshed}: no el talla; ${refreshed ? 'un sol reintent, amb temporitzador propi' : 'el 401 original'}`, async () => {
    vi.useFakeTimers();
    entra();
    const entered = deferred(), refresh = deferred();
    configuraRefrescSessio(async () => {
      entered.resolve();
      await refresh.promise;
      if (refreshed) entra(A, true);
      return refreshed;
    });
    const text = vi.fn(async () => 'Error de la fixture inicial');
    const fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 401, text })
      .mockResolvedValue({ ok: true, status: 200, json: async () => [{ owner: A }], headers: { get: () => null } });
    vi.stubGlobal('fetch', fetch);
    let state = 'pending';
    const pending = request('/rest/v1/private_rows', CONFIG, { signal: new AbortController().signal, timeoutMs: 12000 })
      .then(data => { state = { data }; }, error => { state = { name: error.name, status: error.status }; });
    await entered.promise;
    const originalSignal = fetch.mock.calls[0][1].signal;
    await vi.advanceTimersByTimeAsync(12000);
    expect(originalSignal.aborted).toBe(false);
    expect(state).toBe('pending');
    refresh.resolve();
    await pending;
    if (refreshed) {
      expect(state).toEqual({ data: [{ owner: A }] });
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch.mock.calls[1][1].signal).not.toBe(originalSignal);
      expect(text).not.toHaveBeenCalled();
    } else {
      expect(state).toMatchObject({ name: 'ErrorSupabase', status: 401 });
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(text).toHaveBeenCalledTimes(1);
    }
  });
}

/* v1.2.19 · Gauntlet R1 (L1-02) · Amb el temporitzador parat, un refresc que es penja el talla el topall propi de
   refreshSession (12 s, el pany inclòs, auth.js). Eixe AbortError no l'ha demanat qui crida: TimeoutError, com
   donava el temporitzador abans, i mai una cancel·lació silenciosa. Sense reintent ni lectura del cos. */
test('v1.2.19 · Gauntlet R1 (L1-02) · el topall de 12 s de la renovació post-401 dona TimeoutError, no AbortError', async () => {
  const { refreshSession } = await import('./auth.js');
  vi.useFakeTimers();
  entra();
  configuraRefrescSessio(refreshSession); // Implementació de producció.
  const text = vi.fn(async () => 'JWT de prova caducat');
  const fetch = vi.fn((url, init) => {
    if (String(url).includes('/auth/v1/token?grant_type=refresh_token')) {
      return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('avortada', 'AbortError'))));
    }
    return Promise.resolve({ ok: false, status: 401, text });
  });
  vi.stubGlobal('fetch', fetch);
  let state = 'pending';
  const pending = request('/rest/v1/private_rows', CONFIG, { timeoutMs: 1000 })
    .then(data => { state = { data }; }, error => { state = { name: error.name, message: error.message }; });
  await vi.advanceTimersByTimeAsync(1000);
  expect(state).toBe('pending');                          // el termini del fetch no talla la renovació
  await vi.advanceTimersByTimeAsync(11000);
  await pending;
  expect(state).toEqual({ name: 'TimeoutError', message: 'La petició ha trigat massa temps.' });
  expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/rest/v1/private_rows'))).toHaveLength(1);
  expect(text).not.toHaveBeenCalled();
});

/* v1.2.19 · Gauntlet R1 (L1-01) · `senseSessio`: una petició que no va en nom de la sessió d'esta pestanya no té la
   guarda d'entrada, però conserva les capçaleres i les galetes d'una petició normal (no és `anonim`). */
test('v1.2.19 · Gauntlet R1 (L1-01) · senseSessio: el canvi d’entrada pel camí no perd la resposta i no toca capçaleres ni galetes', async () => {
  entra();
  const { entered, body, fetch } = transportAmbCosPendent();
  const pending = request('/auth/v1/user', CONFIG, { method: 'PUT', senseSessio: true, headers: { Authorization: 'Bearer token-privat' }, body: { password: 'x' } });
  await entered.promise;
  esborraSessio({ abast: 'pestanya' });
  entra(B);
  body.resolve({ id: A });
  await expect(pending).resolves.toEqual({ id: A });
  const [, init] = fetch.mock.calls[0];
  expect(init.headers).toMatchObject({ apikey: CONFIG.supabaseAnonKey, Authorization: 'Bearer token-privat' });
  expect(init).not.toHaveProperty('credentials');
  // Sense l'opció, la mateixa carrera continua sent AbortError (R32.29).
  entra();
  const guarda = transportAmbCosPendent();
  const vigilada = request('/auth/v1/user', CONFIG, { method: 'PUT', headers: { Authorization: 'Bearer token-privat' }, body: { password: 'x' } });
  const receipt = expect(vigilada).rejects.toMatchObject({ name: 'AbortError' });
  await guarda.entered.promise;
  esborraSessio({ abast: 'pestanya' });
  guarda.body.resolve({ id: A });
  await receipt;
});

test('R32.29 · el runtime refusa una entrada nova que un callback presenta com a renovació del mateix UUID', async () => {
  entra();
  const originalEntry = entradaSessio();
  configuraRefrescSessio(async () => {
    entra(A); // Defensa del contracte: auth.refreshSession real usa renovacio:true.
    expect(entradaSessio()).toBeGreaterThan(originalEntry);
    return true;
  });
  const fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 })
    .mockResolvedValue({ ok: true, status: 200, json: async () => [{ owner: A }], headers: { get: () => null } });
  vi.stubGlobal('fetch', fetch);
  await expect(request('/rest/v1/private_rows', CONFIG)).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('R32.29 · una renovació 401 legítima conserva el llinatge i permet exactament un reintent', async () => {
  entra();
  const originalEntry = entradaSessio();
  configuraRefrescSessio(async () => { entra(A, true); return true; });
  const fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 })
    .mockResolvedValue({ ok: true, status: 200, json: async () => [{ owner: A }], headers: { get: () => null } });
  vi.stubGlobal('fetch', fetch);
  await expect(request('/rest/v1/private_rows', CONFIG)).resolves.toEqual([{ owner: A }]);
  expect(entradaSessio()).toBe(originalEntry);
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('R32.29 · un refresc fals amb operació viva conserva el 401 original sense reenviar', async () => {
  entra();
  const refresh = vi.fn(async () => false);
  configuraRefrescSessio(refresh);
  const text = vi.fn(async () => 'Error de la fixture inicial');
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text });
  vi.stubGlobal('fetch', fetch);
  await expect(request('/rest/v1/private_rows', CONFIG)).rejects.toMatchObject({ name: 'ErrorSupabase', status: 401 });
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(text).toHaveBeenCalledTimes(1);
});

test('R32.29 · una excepció del refresc es propaga amb operació viva, sense llegir el cos ni reenviar', async () => {
  entra();
  const cause = new Error('Refresc de prova fallit');
  configuraRefrescSessio(async () => { throw cause; });
  const text = vi.fn(async () => 'Error de la fixture inicial');
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text });
  vi.stubGlobal('fetch', fetch);
  await expect(request('/rest/v1/private_rows', CONFIG)).rejects.toBe(cause);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(text).not.toHaveBeenCalled();
});

/* v1.2.19 · Gauntlet R1 (L1-02) · «timeout»: el termini del fetch del primer consumidor passa durant l'espera i ja no la
   talla (la regla del preflight); el primer acaba com el segon. «abort»: el signal de qui crida la talla, com sempre. */
const ETIQUETA_TRIGGER = { timeout: 'el termini del fetch (L1-02: no talla l’espera)', abort: 'abort' };
for (const trigger of ['timeout', 'abort']) {
  for (const outcome of ['true', 'false', 'reject']) {
    test(`R32.29 · espera compartida real: ${ETIQUETA_TRIGGER[trigger]} del primer consumidor, refresc ${outcome} i segon consumidor intacte`, async () => {
      const { refreshSession } = await import('./auth.js');
      vi.useFakeTimers();
      entra();
      const entered = deferred(), consumers = deferred(), body = deferred();
      const sharedPromises = [], privateSignals = [];
      let sharedSignal, privateCalls = 0;
      const fetch = vi.fn(async (url, init) => {
        if (String(url).includes('/auth/v1/token?grant_type=refresh_token')) {
          sharedSignal = init.signal;
          return { ok: true, status: 200, json: () => { entered.resolve(); return body.promise; } };
        }
        expect(String(url)).toBe(`${CONFIG.supabaseUrl}/rest/v1/private_rows`);
        privateSignals.push(init.signal);
        privateCalls += 1;
        return privateCalls <= 2
          ? { ok: false, status: 401, text: async () => 'JWT de prova caducat' }
          : { ok: true, status: 200, json: async () => [{ owner: A }], headers: { get: () => null } };
      });
      vi.stubGlobal('fetch', fetch);
      configuraRefrescSessio((config) => {
        const promise = refreshSession(config); // Implementació de producció, no un callback que es penja artificialment.
        sharedPromises.push(promise);
        if (sharedPromises.length === 2) consumers.resolve();
        return promise;
      });
      const controller = new AbortController();
      const pendingA = request('/rest/v1/private_rows', CONFIG, { signal: controller.signal, timeoutMs: 1000 });
      const pendingB = request('/rest/v1/private_rows', CONFIG, { timeoutMs: 5000 });
      let stateA = 'pending', stateB = 'pending';
      const resultA = pendingA.then(data => { stateA = { data }; }, error => { stateA = { name: error.name, status: error.status }; });
      const resultB = pendingB.then(data => { stateB = { data }; }, error => { stateB = { name: error.name, status: error.status }; });
      let atDeadline, otherAtDeadline, sharedAborted, firstAborted, otherAborted;
      try {
        await Promise.all([entered.promise, consumers.promise]);
        expect(sharedPromises[0]).toBe(sharedPromises[1]);
        if (trigger === 'timeout') await vi.advanceTimersByTimeAsync(1000);
        else { controller.abort(); await vi.advanceTimersByTimeAsync(0); }
        atDeadline = stateA;
        otherAtDeadline = stateB;
        sharedAborted = sharedSignal.aborted;
        firstAborted = privateSignals[0].aborted;
        otherAborted = privateSignals[1].aborted;
      } finally {
        // Alliberar el cos també quan l'assercció falla evita deixar feina penjada a la prova.
        if (outcome === 'reject') body.reject(new SyntaxError('JSON de renovació malformat a la fixture'));
        else body.resolve(outcome === 'true'
          ? { access_token: 'token-renovat', refresh_token: 'rt-renovat', user: { id: A } }
          : {});
        await Promise.all([resultA, resultB]);
      }
      const tallat = trigger === 'abort';
      if (tallat) expect(atDeadline).toMatchObject({ name: 'AbortError' });
      else expect(atDeadline).toBe('pending');
      expect(otherAtDeadline).toBe('pending');
      expect(sharedAborted).toBe(false);
      expect(firstAborted).toBe(tallat);
      expect(otherAborted).toBe(false);
      const esperatB = outcome === 'true' ? { data: [{ owner: A }] }
        : outcome === 'false' ? { name: 'ErrorSupabase', status: 401 } : { name: 'SyntaxError' };
      if (tallat) expect(stateA).toMatchObject({ name: 'AbortError' });
      else if (outcome === 'true') expect(stateA).toEqual(esperatB);
      else expect(stateA).toMatchObject(esperatB);
      if (outcome === 'true') expect(stateB).toEqual(esperatB);
      else expect(stateB).toMatchObject(esperatB);
      // Un reintent per consumidor viu: B sempre; A també quan el termini no l'ha tallat.
      expect(privateCalls).toBe(outcome === 'true' ? (tallat ? 3 : 4) : 2);
      expect(fetch.mock.calls.filter(([url]) => String(url).includes('/auth/v1/token?grant_type=refresh_token'))).toHaveLength(1);
    });
  }
}
