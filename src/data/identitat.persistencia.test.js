import { afterEach, beforeEach, expect, test, vi } from 'vitest';
/* D1 (260926) · El registre persistent del refresh token. identitat i storage reals;
   només la política es falseja, perquè és un singleton immutable. */
const m = vi.hoisted(() => ({ policy: null }));
vi.mock('../config/runtimePolicy.js', () => ({ getRuntimePolicy: () => m.policy }));
import * as identitat from './identitat.js';
import {
  adoptaSessioExterna, desaSessio, esborraSessio, usuariDeSessio, sessioRecuperable, triaRefresc, rotaRegistre,
  oblidaRegistre, llegixRegistre, reconciliaAmbRegistre, esClauDelRegistre,
  CLAU_JWT, CLAU_REFRESC, CLAU_USUARI, CLAU_ORIGEN, CLAU_PERSISTENT
} from './identitat.js';
import { getEfimer, getVal, setVal, STORAGE_PREFIX } from '../config/storage.js';

const EMISSOR = 'https://auth.example.test';
const A = '11111111-2222-4333-8444-555555555555';
const B = '99999999-2222-4333-8444-555555555555';
const b64u = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const token = (sub, segons = 3600) => `${b64u({ alg: 'none' })}.${b64u({ sub, iss: EMISSOR, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + segons })}.c2ln`;
const politica = (persistencia = 'local') => ({ auth: { issuer: EMISSOR, audiences: ['authenticated'], persistencia } });
const entra = (sub, rt = 'r1', opcions) => desaSessio({ access_token: token(sub), refresh_token: rt, user: { id: sub } }, opcions);
const registre = () => getVal(CLAU_PERSISTENT, null);
const posaRegistre = (rt, sub) => setVal(CLAU_PERSISTENT, { v: 1, rt, sub, t: Date.now() });
const clausLocals = () => Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i));
/* Una pestanya nova: la capa efímera buida, el registre intacte. */
const pestanyaNova = () => window.sessionStorage.clear();
const quotaEn = (clau) => {
  const original = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(k, v) {
    if (k === STORAGE_PREFIX + clau) throw new DOMException('Quota', 'QuotaExceededError');
    return original.call(this, k, v);
  });
};
beforeEach(() => { m.policy = politica(); });
afterEach(() => {
  vi.restoreAllMocks();
  esborraSessio({ abast: 'tot' });
  window.sessionStorage.clear(); window.localStorage.clear(); m.policy = null;
});

test('entrada pròpia: el refresh token baixa al registre i la pestanya no el guarda', () => {
  expect(entra(A, 'r1')).toBe(true);
  expect(registre()).toMatchObject({ v: 1, rt: 'r1', sub: A });
  expect(typeof registre().t).toBe('number');
  expect(getEfimer(CLAU_REFRESC, null)).toBeNull();
  expect(getEfimer(CLAU_ORIGEN, null)).toBe('registre');
  expect(usuariDeSessio()?.id).toBe(A);
  // Cap JWT ni perfil a l'emmagatzematge local: només el registre.
  expect(clausLocals()).toEqual([STORAGE_PREFIX + CLAU_PERSISTENT]);
  expect(triaRefresc()).toEqual({ rt: 'r1', mode: 'renovacio', sub: A });
});

test('pestanya nova: ningú «dins» fins que el servidor responga, però la sessió és recuperable', () => {
  entra(A, 'r1'); pestanyaNova();
  expect(usuariDeSessio()).toBeNull();
  expect(identitat.identitat().autenticat).toBe(false);
  expect(sessioRecuperable()).toBe(true);
  expect(triaRefresc()).toEqual({ rt: 'r1', mode: 'restauracio', sub: A });
});

test('restauració: un altre compte no entra; la bona no reescriu el registre', () => {
  entra(A, 'r1'); pestanyaNova();
  const abans = registre();
  expect(desaSessio({ access_token: token(B), refresh_token: 'r2', user: { id: B } }, { restauracio: { sub: A } })).toBe(false);
  expect(getEfimer(CLAU_JWT, null)).toBeNull();
  expect(desaSessio({ access_token: token(A), refresh_token: 'r2', user: { id: A } }, { restauracio: { sub: A } })).toBe(true);
  expect(registre()).toEqual(abans);                          // la rotació és cosa d'auth.js, amb CAS
  expect(getEfimer(CLAU_REFRESC, null)).toBeNull();
  expect(getEfimer(CLAU_ORIGEN, null)).toBe('registre');
  expect(usuariDeSessio()?.id).toBe(A);
});

test('una renovació d’una pestanya que viu del registre no hi deixa el token a la pestanya', () => {
  entra(A, 'r1');
  expect(desaSessio({ access_token: token(A), refresh_token: 'r2', user: { id: A } }, { renovacio: true })).toBe(true);
  expect(getEfimer(CLAU_REFRESC, null)).toBeNull();
  expect(getEfimer(CLAU_ORIGEN, null)).toBe('registre');
  expect(registre().rt).toBe('r1');
});

test('rotaRegistre és un CAS i oblidaRegistre només esborra el token rebutjat', () => {
  entra(A, 'r1');
  expect(rotaRegistre('rX', 'r2', A)).toBe(false);            // no és el token gastat
  expect(rotaRegistre('r1', 'r2', B)).toBe(false);            // no és el compte
  expect(registre().rt).toBe('r1');
  expect(rotaRegistre('r1', 'r2', A)).toBe(true);
  expect(registre()).toMatchObject({ rt: 'r2', sub: A });
  oblidaRegistre('r1');                                       // una altra pestanya ja l'ha rotat
  expect(registre().rt).toBe('r2');
  oblidaRegistre('r2');
  expect(registre()).toBeNull();
});

test('rotaRegistre sense quota: millor cap registre que un de gastat', () => {
  entra(A, 'r1'); quotaEn(CLAU_PERSISTENT);
  expect(rotaRegistre('r1', 'r2', A)).toBe(false);
  expect(registre()).toBeNull();
});

test('esborraSessio: la pestanya conserva el registre; eixir el lleva si és del mateix compte', () => {
  entra(A, 'r1');
  esborraSessio({ abast: 'pestanya' });
  expect(usuariDeSessio()).toBeNull();
  expect(registre()?.rt).toBe('r1');
  entra(A, 'r2');
  esborraSessio();
  expect(registre()).toBeNull();
  entra(A, 'r3'); posaRegistre('rB', B);                      // el registre ja és d'un altre compte
  esborraSessio();
  expect(registre()?.sub).toBe(B);
});

test('B substituïx el registre d’A; si B no pot omplir la pestanya, no queda res recuperable', () => {
  entra(A, 'rA');
  entra(B, 'rB');
  expect(registre()).toMatchObject({ rt: 'rB', sub: B });
  esborraSessio({ abast: 'tot' });
  entra(A, 'rA'); quotaEn(CLAU_JWT);
  expect(entra(B, 'rB')).toBe(false);
  expect(registre()).toBeNull();
  expect(usuariDeSessio()).toBeNull();
  expect(sessioRecuperable()).toBe(false);
  expect(triaRefresc()).toBeNull();
});

test('registre sense quota: recurs efímer, com abans de D1', () => {
  quotaEn(CLAU_PERSISTENT);
  expect(entra(A, 'r1')).toBe(true);
  expect(registre()).toBeNull();
  expect(getEfimer(CLAU_REFRESC, null)).toBe('r1');
  expect(getEfimer(CLAU_ORIGEN, null)).toBeNull();
  expect(triaRefresc()).toEqual({ rt: 'r1', mode: 'efimer', sub: A });
});

test('la sessió de l’amfitrió no baixa mai al registre; esborra el d’un altre compte i conserva el del mateix', () => {
  expect(adoptaSessioExterna({ access_token: token(A), refresh_token: 'rh', user: { id: A } })).toBe(true);
  expect(registre()).toBeNull();
  expect(getEfimer(CLAU_REFRESC, null)).toBe('rh');
  expect(getEfimer(CLAU_ORIGEN, null)).toBe('amfitrio');
  // Renovar-la no la fa pròpia: continua sent de l'amfitrió i fora del registre.
  expect(desaSessio({ access_token: token(A), refresh_token: 'rh2', user: { id: A } }, { renovacio: true })).toBe(true);
  expect(getEfimer(CLAU_ORIGEN, null)).toBe('amfitrio');
  expect(getEfimer(CLAU_REFRESC, null)).toBe('rh2');
  expect(registre()).toBeNull();
  esborraSessio({ abast: 'tot' });
  entra(B, 'rB');
  expect(adoptaSessioExterna({ access_token: token(A), user: { id: A } })).toBe(true);
  expect(registre()).toBeNull();
  esborraSessio({ abast: 'tot' });
  entra(A, 'rA');
  expect(adoptaSessioExterna({ access_token: token(A), refresh_token: 'rh', user: { id: A } })).toBe(true);
  expect(registre()).toMatchObject({ rt: 'rA', sub: A });
  expect(triaRefresc()).toEqual({ rt: 'rh', mode: 'efimer', sub: A });
});

test('política «pestanya»: el registre vell es purga en llegir-lo i una entrada nova no en crea cap', () => {
  posaRegistre('vell', A);
  m.policy = politica('pestanya');
  expect(llegixRegistre()).toBeNull();
  expect(registre()).toBeNull();
  expect(entra(A, 'r1')).toBe(true);
  expect(registre()).toBeNull();
  expect(getEfimer(CLAU_REFRESC, null)).toBe('r1');
  expect(triaRefresc()?.mode).toBe('efimer');
});

test('sense política (proves, abans d’arrencar) no s’escriu res a l’emmagatzematge local', () => {
  m.policy = null;
  expect(entra(A, 'r1')).toBe(true);
  expect(clausLocals()).toEqual([]);
  expect(getEfimer(CLAU_REFRESC, null)).toBe('r1');
});

for (const [nom, valor] of [['v:2', { v: 2, rt: 'r', sub: A }], ['rt buit', { v: 1, rt: '', sub: A }],
  ['sub que no és uuid', { v: 1, rt: 'r', sub: 'admin' }], ['cadena', 'socdepoble']]) {
  test(`registre malformat (${nom}): s’ignora i s’esborra`, () => {
    setVal(CLAU_PERSISTENT, valor);
    expect(llegixRegistre()).toBeNull();
    expect(registre()).toBeNull();
    setVal(CLAU_PERSISTENT, valor);
    expect(sessioRecuperable()).toBe(false);
  });
}

test('reconciliació: un compte per navegador, sense tocar les sessions de l’amfitrió', () => {
  const avisos = []; const escolta = (e) => avisos.push(e.detail.user);
  window.addEventListener('sdp:auth-change', escolta);
  try {
    entra(A, 'r1');
    rotaRegistre('r1', 'r2', A);                               // una altra pestanya del mateix compte renova
    expect(reconciliaAmbRegistre()).toBe(false);
    expect(usuariDeSessio()?.id).toBe(A);
    posaRegistre('rB', B);                                    // B entra en una altra pestanya
    expect(reconciliaAmbRegistre()).toBe(true);
    expect(usuariDeSessio()).toBeNull();
    expect(registre()).toMatchObject({ rt: 'rB', sub: B });   // el de B no es toca
    expect(avisos).toEqual([null]);
    entra(A, 'r3');
    window.localStorage.removeItem(STORAGE_PREFIX + CLAU_PERSISTENT);   // A ix en una altra pestanya
    expect(reconciliaAmbRegistre()).toBe(true);
    expect(usuariDeSessio()).toBeNull();
    adoptaSessioExterna({ access_token: token(A), refresh_token: 'rh', user: { id: A } });
    posaRegistre('rB', B);
    expect(reconciliaAmbRegistre()).toBe(false);
    expect(usuariDeSessio()?.id).toBe(A);
  } finally { window.removeEventListener('sdp:auth-change', escolta); }
});

test('entradaSessio: una renovació no la mou; tornar a entrar o eixir, sí', () => {
  entra(A, 'r1');
  const entrada = identitat.entradaSessio();
  expect(desaSessio({ access_token: token(A), user: { id: A } }, { renovacio: true })).toBe(true);
  expect(identitat.entradaSessio()).toBe(entrada);
  entra(A, 'r2');
  expect(identitat.entradaSessio()).not.toBe(entrada);
  const segona = identitat.entradaSessio();
  esborraSessio({ abast: 'pestanya' });
  expect(identitat.entradaSessio()).not.toBe(segona);
});

test('esborrar la foto (avatar_url null) la lleva de la sessió, també la `picture` de Google', () => {
  desaSessio({ access_token: token(A), refresh_token: 'r1',
    user: { id: A, avatar_url: 'https://g.test/a.png', user_metadata: { avatar_url: 'https://g.test/a.png', picture: 'https://g.test/p.png', name: 'Pep' } } });
  identitat.actualitzaUsuariSessio({ avatar_url: null });
  const usuari = getEfimer(CLAU_USUARI, null);
  expect(usuari.user_metadata).not.toHaveProperty('avatar_url');
  expect(usuari.user_metadata).not.toHaveProperty('picture');
  expect(usuari).not.toHaveProperty('avatar_url');
  expect(usuari.user_metadata.name).toBe('Pep');
  // Un canvi que no parla de la foto no la toca.
  desaSessio({ access_token: token(A), refresh_token: 'r2', user: { id: A, user_metadata: { picture: 'https://g.test/p.png' } } });
  identitat.actualitzaUsuariSessio({ full_name: 'Pere' });
  expect(getEfimer(CLAU_USUARI, null).user_metadata.picture).toBe('https://g.test/p.png');
});

test('esClauDelRegistre: la clau del registre o un buidat sencer', () => {
  expect(esClauDelRegistre(STORAGE_PREFIX + CLAU_PERSISTENT)).toBe(true);
  expect(esClauDelRegistre(null)).toBe(true);
  expect(esClauDelRegistre(STORAGE_PREFIX + CLAU_USUARI)).toBe(false);
  expect(esClauDelRegistre(STORAGE_PREFIX + 'sdp:oauth:traspas')).toBe(false);
});
