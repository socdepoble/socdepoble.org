import { expect, test, vi } from 'vitest';
vi.mock('../src/PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
vi.mock('../src/config/runtimePolicy.js', () => ({ setRuntimePolicy: vi.fn(), getRuntimePolicy: () => ({}), esOrigenParePermes: origin => origin === 'https://pare.example.test' }));
vi.mock('../src/data/identitat.js', () => ({ adoptaSessioExterna: vi.fn(() => true), esborraSessio: vi.fn(), configuraBackendSessio: vi.fn() }));
vi.mock('../src/utils/sanitize.js', () => ({ sanitizeHtml: x => x }));
vi.mock('../src/apps/plataforma/registreApps.js', () => ({ registraAppExterna: vi.fn(() => ({ ok: true, errors: [], manifest: { id: 'reserves' } })) }));
import { CONTRACTE_NUCLI } from '../src/data/contracte.js';
import { getBackendImplementation } from '../src/data/backendPort.js';
import { setRuntimePolicy } from '../src/config/runtimePolicy.js';
import { adoptaSessioExterna } from '../src/data/identitat.js';
import { registraAppExterna } from '../src/apps/plataforma/registreApps.js';
import { CONTRACTE_AMFITRIO_V1 } from '../src/config/contracteAmfitrio.js';
import { _reiniciaAvisos, fixaCapaDelPaquet } from '../src/config/capaDelPaquet.js';
import { exposaGlobal, arrenca, configura, injectaBackendDelPaquet, quanLlest, VERBS_CUA } from '../src/host.js';

/* La capa del paquet per la via interna, com fan main.jsx i embed.jsx abans
   de muntar. Valors sintètics: la prova no depén del .env de qui l'executa. */
const PAQUET = Object.freeze({
  supabaseUrl: 'https://paquet.supabase.test',
  supabaseAnonKey: 'sb_publishable_del_paquet',
  tenantId: '11111111-1111-4111-8111-111111111111'
});
fixaCapaDelPaquet(PAQUET);

/* A1 (decisió del Mestre, 261003). Va primer: configura() encara no s'ha
   segellat i el port no porta cap adaptador. Abans, un tenant que no era UUID
   feia llançar configura() (P0-b, 261002); ara el de l'amfitrió no arriba enlloc. */
test('Model B: configura() descarta l’adaptador, backend_url, tenant_id i les claus del paquet de config, amb un sol avís', () => {
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const adaptador = Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, vi.fn()]));
    const auth = { issuer: 'https://emissor.amfitrio.test' };
    const resultat = configura({
      backend: adaptador,
      backend_url: 'https://amfitrio.example.test/wp-json/sdp',
      tenant_id: 'poble',
      config: {
        tenantId: '22222222-2222-4222-8222-222222222222', supabaseUrl: 'https://backend.amfitrio.test', dataMode: 'local',
        nomPoble: 'Sella', retornCalendariGoogle: 'https://amfitrio.example.test/tornada'
      },
      auth
    });
    expect(resultat.descartades).toEqual(['backend', 'backend_url', 'tenant_id', 'config.tenantId', 'config.supabaseUrl', 'config.dataMode']);
    expect(resultat.acceptats).toEqual([]);
    // L'adaptador de l'amfitrió no s'instal·la.
    expect(Object.keys(getBackendImplementation())).toEqual([]);
    // La política porta el backend i el tenant del paquet; de l'amfitrió, només les seues claus.
    expect(setRuntimePolicy).toHaveBeenCalledTimes(1);
    const [{ auth: authDeLaPolitica, backendConfig, rawHostConfig }] = setRuntimePolicy.mock.calls[0];
    expect(authDeLaPolitica).toBe(auth);
    expect(backendConfig).toMatchObject({
      backendUrl: PAQUET.supabaseUrl, supabaseUrl: PAQUET.supabaseUrl, supabaseAnonKey: PAQUET.supabaseAnonKey,
      tenantId: PAQUET.tenantId, backendId: 'supabase', dataMode: 'remote'
    });
    expect(rawHostConfig).toEqual({ nomPoble: 'Sella', retornCalendariGoogle: 'https://amfitrio.example.test/tornada' });
    expect(avis).toHaveBeenCalledTimes(1);
    expect(avis.mock.calls[0].join(' ')).toContain('«configura» porta backend, backend_url, tenant_id, config.tenantId');
  } finally {
    avis.mockRestore();
    setRuntimePolicy.mockClear();
    _reiniciaAvisos();
  }
});

test('Model B: la cua passa pel mateix configura(), i ni l’API ni la cua exposen la via interna del paquet', () => {
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    window.SocDePobleCua = [['configura', { tenant_id: '22222222-2222-4222-8222-222222222222', config: { poble: 'sella' } }]];
    const api = exposaGlobal({});
    expect(window.SocDePobleCua).toHaveLength(0);
    const [{ backendConfig, rawHostConfig }] = setRuntimePolicy.mock.calls[0];
    expect(backendConfig.tenantId).toBe(PAQUET.tenantId);
    expect(rawHostConfig).toEqual({ poble: 'sella' });
    expect(avis.mock.calls.map((crida) => crida.join(' '))).toEqual([expect.stringContaining('«configura» porta tenant_id')]);
    for (const intern of ['injectaBackendDelPaquet', 'fixaCapaDelPaquet']) expect(api).not.toHaveProperty(intern);
    expect(VERBS_CUA).not.toContain('injectaBackendDelPaquet');
  } finally {
    avis.mockRestore();
    setRuntimePolicy.mockClear();
    _reiniciaAvisos();
    delete window.SocDePobleCua;
  }
});

test('la cua només executa els verbs classificats; un verb desconegut o heretat d’Object.prototype no fa res', () => {
  expect([...VERBS_CUA].sort()).toEqual(Object.keys(CONTRACTE_AMFITRIO_V1.cua.verbs).sort());
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    window.SocDePobleCua = [['constructor'], ['toString'], ['hasOwnProperty'], ['borra'], 'sessio', null];
    exposaGlobal({});
    expect(window.SocDePobleCua).toHaveLength(0);
    expect(adoptaSessioExterna).not.toHaveBeenCalled();
    expect(setRuntimePolicy).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  } finally {
    error.mockRestore();
    delete window.SocDePobleCua;
  }
});

/* Correcció de l'A1 (261003): els serveis propis de Sóc de Poble (relé d'OAuth,
   bot, emissor i la clau morta version) són del paquet com el backend. Un
   origen permés (socdepoble.sollutia.com) passaria el sanejador de l'element:
   per això s'han de quedar ací. */
test('Model B: configura() tampoc no porta els serveis propis de Sóc de Poble, ni a l’arrel ni dins de config', () => {
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const resultat = configura({
      config: {
        oauthRelayUrl: 'https://socdepoble.sollutia.com/cb', botApiUrl: 'https://socdepoble.sollutia.com/bot',
        sollutiaIssuer: 'https://socdepoble.sollutia.com', version: '9.9.9', nomPoble: 'Sella'
      },
      oauthRelayUrl: 'https://socdepoble.sollutia.com/cb'
    });
    expect(resultat.descartades).toEqual(['oauthRelayUrl', 'config.oauthRelayUrl', 'config.botApiUrl', 'config.sollutiaIssuer', 'config.version']);
    const [{ backendConfig, rawHostConfig }] = setRuntimePolicy.mock.calls[0];
    expect(rawHostConfig).toEqual({ nomPoble: 'Sella' });
    for (const clau of ['oauthRelayUrl', 'botApiUrl', 'sollutiaIssuer', 'version']) expect(backendConfig, clau).not.toHaveProperty(clau);
    expect(avis).toHaveBeenCalledTimes(1);
    expect(avis.mock.calls[0].join(' ')).toContain('«configura» porta oauthRelayUrl, config.oauthRelayUrl');
  } finally {
    avis.mockRestore();
    setRuntimePolicy.mockClear();
    _reiniciaAvisos();
  }
});

/* Va abans de la prova de l'adaptador: ací el camí és el natiu (identitat.js). */
test('Model B: les opcions de sessió, per l’API o per la cua, arriben a l’adopció sense les claus del paquet', () => {
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  adoptaSessioExterna.mockClear();
  try {
    const sessio = { access_token: 'sintetic' };
    const opcions = Object.freeze({
      tenantId: '22222222-2222-4222-8222-222222222222', backend_url: 'https://backend.amfitrio.test',
      oauthRelayUrl: 'https://socdepoble.sollutia.com/cb', emissorEsperat: 'https://emissor.amfitrio.test'
    });
    window.SocDePobleCua = [['sessio', sessio, opcions]];
    const api = exposaGlobal({});
    expect(api.injectaSessio(sessio, opcions)).toBe(true);
    expect(adoptaSessioExterna.mock.calls).toEqual([
      [sessio, { emissorEsperat: 'https://emissor.amfitrio.test' }],
      [sessio, { emissorEsperat: 'https://emissor.amfitrio.test' }]
    ]);
    // Sense opcions, o amb unes que no són un objecte, l'adopció rep un objecte buit.
    api.injectaSessio(sessio);
    api.injectaSessio(sessio, null);
    expect(adoptaSessioExterna.mock.calls.slice(2)).toEqual([[sessio, {}], [sessio, {}]]);
    const delModelB = avis.mock.calls.map((crida) => crida.join(' ')).filter((text) => text.includes('Model B'));
    expect(delModelB).toEqual([expect.stringContaining('«sessio» porta tenantId, backend_url, oauthRelayUrl')]);
  } finally {
    avis.mockRestore();
    adoptaSessioExterna.mockClear();
    _reiniciaAvisos();
    delete window.SocDePobleCua;
  }
});

test('window.SocDePoble.registraApp delega en el registre de la Plataforma d’Apps i en torna el resultat', () => {
  const api = exposaGlobal({});
  expect(Object.keys(api).sort()).toEqual([...CONTRACTE_AMFITRIO_V1.api.claus].sort());
  const manifest = { schema: 'sdp.app.v1', id: 'reserves', element: 'sollutia-reserves' };
  expect(api.registraApp(manifest)).toEqual({ ok: true, errors: [], manifest: { id: 'reserves' } });
  expect(registraAppExterna).toHaveBeenCalledWith(manifest);
});

test('adaptador del paquet per la via interna: validat, 1.000 ordres drenades i esperes cancel·lables abans d’arrencar', async () => {
  expect(() => injectaBackendDelPaquet({})).toThrow('Nucli incomplet');
  window.SocDePobleCua = [['sessio', { access_token: 'synthetic' }]];
  exposaGlobal({});
  for (let i = 0; i < 1000; i++) expect(window.SocDePobleCua.push(['sessio', { access_token: 'synthetic' }])).toBe(0);
  expect(window.SocDePobleCua).toHaveLength(0);
  const controller = new AbortController();
  const pending = quanLlest({ signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  const adaptador = Object.fromEntries(CONTRACTE_NUCLI.map(key => [key, vi.fn()]));
  const resultat = injectaBackendDelPaquet(adaptador);
  expect([...resultat.acceptats].sort()).toEqual([...CONTRACTE_NUCLI].sort());
  expect(resultat.pendents).toEqual([]);
  expect(() => injectaBackendDelPaquet(adaptador)).toThrow('ja porta un adaptador');
  const ready = quanLlest({ signal: new AbortController().signal });
  await arrenca(); await expect(ready).resolves.toMatchObject({ fase: 'segellat' });
  expect(() => injectaBackendDelPaquet(adaptador)).toThrow('arrancada');
  expect(() => configura({ auth: {} })).toThrow('arrancada');
  delete window.SocDePobleCua;
});

test('el pont exigix origen exacte i la finestra del pare real', () => {
  const parent = { postMessage: vi.fn() };
  const spy = vi.spyOn(window, 'parent', 'get').mockReturnValue(parent);
  exposaGlobal({});
  parent.postMessage.mockClear();
  const data = { type: 'SDP_HOST_CMD', cmd: 'SDP_PING' };
  for (const [origin, source] of [['https://pare.example.test:444', parent], ['https://altre.example.test', parent], [window.location.origin, parent], ['https://pare.example.test', {}]]) {
    window.dispatchEvent(new MessageEvent('message', { origin, source, data }));
  }
  expect(parent.postMessage).not.toHaveBeenCalled();
  window.dispatchEvent(new MessageEvent('message', { origin: 'https://pare.example.test', source: parent, data }));
  expect(parent.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'SDP_HOST_ACK', ok: true }), 'https://pare.example.test');
  spy.mockRestore();
});
