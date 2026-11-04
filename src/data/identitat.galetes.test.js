/* consola-p016-03 (261104) · La purga de les galetes del llegat, una vegada per document.
   usuariDeSessio() llegia document.cookie a cada crida per a una neteja que només
   cal la primera volta: Chrome ho comptava com a PerformanceIssue «DocumentCookie»
   a cada render que consulta la sessió (entre 9 i 25 per càrrega). La purga de
   l'emmagatzematge local continua a cada crida. Cada prova importa un mòdul nou
   (vi.resetModules), com un document nou: no cal cap reinici exposat. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const NATIU = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
const LLEGAT = ['socdepoble-jwt', 'socdepoble-refresh-token', 'socdepoble-user', 'sdp:oauth:verificador', 'sdp:oauth:state', 'sdp:oauth:cb'];
let lectures = 0;
let escriptures = [];

const esborraGaletes = () => {
  for (const parell of NATIU.get.call(document).split('; ').filter(Boolean)) {
    NATIU.set.call(document, `${parell.split('=')[0]}=; path=/; max-age=0`);
  }
};
const modulNou = async () => {
  vi.resetModules();
  return import('./identitat.js');
};

beforeEach(() => {
  lectures = 0; escriptures = [];
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get() { lectures += 1; return NATIU.get.call(this); },
    set(valor) { escriptures.push(valor); NATIU.set.call(this, valor); }
  });
});
afterEach(() => {
  delete document.cookie;
  esborraGaletes();
  window.sessionStorage.clear(); window.localStorage.clear();
});

test('les galetes del llegat es miren una sola vegada per document i s’esborren en la primera crida', async () => {
  NATIU.set.call(document, 'socdepoble-jwt=vell; path=/');
  NATIU.set.call(document, 'sdp:oauth:state=vell; path=/');
  NATIU.set.call(document, 'aliena=queda; path=/');
  const { usuariDeSessio } = await modulNou();

  expect(usuariDeSessio()).toBeNull();
  expect(lectures).toBe(1);
  expect(escriptures).toEqual(LLEGAT.map((k) => `${k}=; path=/; max-age=0; SameSite=Lax`));
  expect(NATIU.get.call(document)).toBe('aliena=queda');

  for (let i = 0; i < 4; i += 1) usuariDeSessio();
  expect(lectures).toBe(1);
  expect(escriptures).toHaveLength(LLEGAT.length);
});

test('sense galetes del llegat: una lectura, cap escriptura, i les crides següents ni les miren', async () => {
  const { usuariDeSessio } = await modulNou();
  for (let i = 0; i < 5; i += 1) expect(usuariDeSessio()).toBeNull();
  expect(lectures).toBe(1);
  expect(escriptures).toEqual([]);
});

test('la purga de l’usuari vell de l’emmagatzematge local continua a cada crida', async () => {
  const { usuariDeSessio, CLAU_USUARI, CLAU_JWT, CLAU_REFRESC } = await modulNou();
  const { getVal, setVal } = await import('../config/storage.js');
  usuariDeSessio();
  for (const k of [CLAU_USUARI, CLAU_JWT, CLAU_REFRESC]) setVal(k, k === CLAU_USUARI ? { id: 'vell', email: 'vella@example.test' } : 'vell');
  expect(usuariDeSessio()).toBeNull();
  for (const k of [CLAU_USUARI, CLAU_JWT, CLAU_REFRESC]) expect(getVal(k, null)).toBeNull();
  expect(lectures).toBe(1);
});
