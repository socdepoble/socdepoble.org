// @vitest-environment jsdom
/* QA-C02 (Gauntlet 261029_1858) · L'oblit del xat xifrat en eixir amb una capa
   web BLOQUEJADA (el getter llança SecurityError ja en carregar el mòdul:
   galetes blocades, marc de tercers, política d'empresa). Abans, storage.js la
   prenia per absent (null), el pipeline la saltava i l'eixida declarava un
   oblit «reeixit» amb les claus sdp_xat_ encara al disc. Ara la façana llança,
   el pipeline la declara pendent i l'estat és OBLIT_FALLIT. El getter es posa
   ABANS d'importar els mòduls (vi.resetModules + import dinàmic). */
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const CONFIG = Object.freeze({ backendId: 'supabase', supabaseUrl: 'https://backend.example.test', dataMode: 'remote', tenantId: null });
const NOM_SESSIO = ['session', 'Storage'].join('');
const NOM_PREFERENCIES = ['local', 'Storage'].join('');

let restaura = null;
let sessio;
let preferencies;

/* La capa de sessió real queda amagada darrere d'un getter que llança. */
function bloquejaSessio(error) {
  const original = Object.getOwnPropertyDescriptor(window, NOM_SESSIO);
  Object.defineProperty(window, NOM_SESSIO, { configurable: true, get() { throw error; } });
  restaura = () => {
    if (original) Object.defineProperty(window, NOM_SESSIO, original);
    else delete window[NOM_SESSIO];
    restaura = null;
  };
}

async function carregaModuls() {
  vi.resetModules();
  const [eixida, xifrat, serveis, pipeline, magatzem] = await Promise.all([
    import('./xifratXatEixida.js'), import('./xifratXat.js'), import('./xifratXatServei.js'),
    import('./xifratXatPipeline.js'), import('./xifratXatMagatzem.js')
  ]);
  return { eixida, xifrat, serveis, pipeline, magatzem };
}

function creaPart(m, oblidaEnTancar) {
  const motorRef = {};
  const servei = m.xifrat.creaServeiAmbitXat({ motorRef });
  const magatzem = { identitat: async () => null, oblidaEnTancar, tanca() {} };
  const motor = m.pipeline.creaMotorXifrat({ cripto: webcrypto, impl: {}, servei, magatzem, ara: () => 1000 });
  motorRef.oblidaTot = (opcions) => motor.oblidaTot(opcions);
  const impl = {};
  m.serveis.registraServeiXifratXat(impl, servei);
  return { servei, motor, port: () => impl };
}

beforeEach(() => {
  sessio = window[NOM_SESSIO];
  preferencies = window[NOM_PREFERENCIES];
  for (const web of [sessio, preferencies]) {
    web.clear();
    web.setItem('sdp_xat_frase_vista', '1');
    web.setItem('altra', 'queda');
  }
});
afterEach(() => {
  restaura?.();
  for (const web of [sessio, preferencies]) web.clear();
  vi.resetModules();
});

test('capa de sessió bloquejada en carregar: OBLIT_FALLIT amb «sessio» pendent, mai un oblit reeixit fals', async () => {
  const denegat = new DOMException('Accés denegat a la capa.', 'SecurityError');
  bloquejaSessio(denegat);
  const m = await carregaModuls();
  m.eixida._reiniciaOblitXat();
  const oblidaEnTancar = vi.fn(async () => 1);
  const p = creaPart(m, oblidaEnTancar);
  const ci = m.magatzem.clauIdentitat({ backendId: 'supabase', endpoint: CONFIG.supabaseUrl, joId: A });

  const estat = await m.eixida.oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: p.port });
  expect(estat).toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['sessio'] });
  expect(estat.causes).toContain(denegat);
  // La resta sí que s'ha oblidat: IndexedDB amb la CI de qui ix i la capa de preferències.
  expect(oblidaEnTancar).toHaveBeenCalledWith(ci, { mantenSessio: false });
  expect(preferencies.getItem('sdp_xat_frase_vista')).toBeNull();
  expect(preferencies.getItem('altra')).toBe('queda');
  // El que no s'ha pogut esborrar continua al disc, i l'estat ho diu.
  expect(sessio.getItem('sdp_xat_frase_vista')).toBe('1');
  expect(m.eixida.estatOblitXat({ actiu: true, port: p.port })).toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['sessio'] });
});

test('el pipeline falla tancat: una capa que no es pot recórrer queda pendent; null (absent) no', async () => {
  const m = await carregaModuls();
  const p = creaPart(m, vi.fn(async () => 1));
  for (const capa of [{}, { length: '3' }, { length: -1 }, { length: Number.NaN }]) {
    const estat = await p.motor.oblidaTot({ sessio: capa, preferencies: null });
    expect(estat, JSON.stringify(capa)).toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['sessio'] });
  }
  const bloquejada = Object.freeze({ get length() { throw new DOMException('denegat', 'SecurityError'); }, key() {}, removeItem() {} });
  expect(await p.motor.oblidaTot({ sessio: null, preferencies: bloquejada })).toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['preferencies'] });
  expect(await p.motor.oblidaTot({ sessio: null, preferencies: undefined })).toMatchObject({ estat: 'oblidat', pendents: [] });
});
