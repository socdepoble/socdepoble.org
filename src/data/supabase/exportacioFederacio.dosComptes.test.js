/* P2-08 / P2-09 · Marató 261101_2143 (carril M14-B5-SQL) · L'exportació de
   dades amb DOS comptes reals i canvis de sessió. La sessió és la de veres
   (src/data/identitat.js: desaSessio, capturaSessio i jwtPerBackend, amb
   l'emmagatzematge de jsdom), i també ho són compte.js i el filtre del client
   (contracteExportacioFederacio.js). Només es dobla el servidor: l'RPC
   exporta_les_meues_dades() respon per al JWT que viatja EN EL MOMENT de la
   crida, amb el contracte v1 (supabase/contracts/exportacio_federacio.v1.json,
   la 2611011800) o, com un servidor d'abans de la 2610311900, amb la
   inferència per qualsevol columna uuid de la 2610241410. Cada clau porta
   marcadors SECRET-A-* o SECRET-B-*, i les columnes que no s'exporten mai,
   NOEXPORT-*. L'execució de la 2611011800 a PostgreSQL amb dos comptes i
   dades de tercers (PGlite 0.3.16, 18 comprovacions) és evidència no
   versionada, fora del repositori. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const EMISSOR = 'https://auth.example.test';
const m = vi.hoisted(() => ({ servidor: null, crides: 0 }));
vi.mock('../../config/runtimePolicy.js', () => ({
  getRuntimePolicy: () => ({ auth: { issuer: 'https://auth.example.test', audiences: ['authenticated'], persistencia: 'local' } })
}));
/* L'RPC: el doble del servidor llig el JWT viu en el moment de la crida, com request() en posar Authorization. */
vi.mock('./runtime.js', async () => {
  const identitat = await import('../identitat.js');
  return {
    getResolvedConfig: () => ({ hasSupabaseConfig: true }),
    request: vi.fn(),
    rpc: (nom, cos, config, opcions) => { m.crides += 1; return m.servidor.rpc(nom, identitat.jwtPerBackend(config), opcions); }
  };
});
/* asseguraUsuari com el d'auth.js quan el JWT és vigent: la persona de la sessió, sense xarxa. */
vi.mock('./auth.js', async () => {
  const identitat = await import('../identitat.js');
  return {
    asseguraUsuari: async (config, current) => { current(); return identitat.esBackendDeSessio(config) ? identitat.usuariDeSessio() : null; },
    logout: vi.fn()
  };
});
import { configuraBackendSessio, desaSessio, esborraSessio, CLAU_USUARI } from '../identitat.js';
import { getEfimer, setEfimer } from '../../config/storage.js';
import { exportaLesMeuesDades } from './compte.js';
import { CONTRACTE_EXPORTACIO_FEDERACIO } from './contracteExportacioFederacio.js';

const CONTRACTE_V1 = JSON.parse(readFileSync(path.join(process.cwd(), 'supabase/contracts/exportacio_federacio.v1.json'), 'utf8'));
const CONFIG = Object.freeze({ dataMode: 'remote', backendUrl: 'https://api.example.test', tenantId: '00000000-0000-4000-8000-000000000001' });
const T = CONFIG.tenantId;
const A = '11111111-2222-4333-8444-555555555555';
const B = '99999999-2222-4333-8444-555555555555';
const PERSONES = Object.freeze({ [A]: 'A', [B]: 'B' });
const id = (n) => `${n}0000000-0000-4000-8000-00000000000${n}`;

/* ── La base del servidor: dos comptes, i cada fila aliena esmenta l'altre per una columna de contrapart ── */
const FEDERACIO = Object.freeze({
  realms: [
    { id: id('a'), tenant_id: T, slug: 'la-torre-de-les-macanes', name: 'SECRET-A-realm', owner_user_id: A, moderator_id: B, private_key: 'NOEXPORT-A-clau', created_at: '2026-10-01T10:00:00Z' },
    { id: id('b'), tenant_id: T, slug: 'xixona', name: 'SECRET-B-realm', owner_user_id: B, moderator_id: A, private_key: 'NOEXPORT-B-clau', created_at: '2026-10-02T10:00:00Z' }
  ],
  user_realms: [
    { id: id('c'), tenant_id: T, user_id: A, realm_id: id('a'), role: 'member', handle: 'SECRET-A-handle', invited_by: B },
    { id: id('d'), tenant_id: T, user_id: B, realm_id: id('a'), role: 'member', handle: 'SECRET-B-handle', invited_by: A }
  ],
  connections: [
    { id: id('e'), tenant_id: T, user_id: A, target_user_id: B, remote_handle: 'SECRET-A-remot', status: 'active', access_token: 'NOEXPORT-A-token' },
    { id: id('f'), tenant_id: T, user_id: B, target_user_id: A, remote_handle: 'SECRET-B-remot', status: 'active', access_token: 'NOEXPORT-B-token' }
  ],
  posts: [
    { id: id('1'), tenant_id: T, author_id: A, reply_to_user_id: B, content: 'SECRET-A-post', ip_hash: 'NOEXPORT-A-ip', created_at: '2026-10-03T10:00:00Z' },
    { id: id('2'), tenant_id: T, author_id: B, reply_to_user_id: A, content: 'SECRET-B-post', ip_hash: 'NOEXPORT-B-ip', created_at: '2026-10-04T10:00:00Z' }
  ]
});
/* Les columnes uuid de persona que la inferència de 2610241410 mirava (totes llevat d'id, tenant_id i realm_id, que no són persones ací). */
const UUID_PERSONA = Object.freeze({ realms: ['owner_user_id', 'moderator_id'], user_realms: ['user_id', 'invited_by'],
  connections: ['user_id', 'target_user_id'], posts: ['author_id', 'reply_to_user_id'] });

const subDe = (jwt) => {
  try { return JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub ?? null; } catch { return null; }
};
const projectaV1 = (uid) => {
  const fed = { _contracte: CONTRACTE_V1.esquema };
  for (const [taula, recurs] of Object.entries(CONTRACTE_V1.recursos)) {
    fed[taula] = FEDERACIO[taula].filter((f) => f[recurs.propietari] === uid)
      .map((f) => Object.fromEntries(Object.keys(recurs.columnes).filter((c) => Object.hasOwn(f, c)).map((c) => [c, f[c]])));
  }
  return fed;
};
/* El servidor d'abans: qualsevol columna uuid de persona igual a l'uid, i la fila sencera (to_jsonb). */
const infereix = (uid) => Object.fromEntries(Object.entries(FEDERACIO).map(([taula, files]) =>
  [taula, files.filter((f) => UUID_PERSONA[taula].some((c) => f[c] === uid)).map((f) => ({ ...f }))]));

/**
 * El doble del servidor. `contracte`: 'v1' (2611011800) o 'inferencia' (2610241410).
 * `ignoraJwt`: el doble trencat de la mutació (respon sempre per a A).
 * `difereix`: la resposta es calcula en arribar la crida (amb el JWT d'eixe moment) i s'allibera després.
 */
function creaServidor({ contracte = 'v1', ignoraJwt = false } = {}) {
  let serial = 0;
  const pendents = [];
  const servidor = {
    difereix: false,
    rebudes: [],
    rpc(nom, jwt) {
      if (nom !== 'exporta_les_meues_dades') throw new Error(`RPC inesperada: ${nom}`);
      const uid = ignoraJwt ? A : subDe(jwt);
      servidor.rebudes.push(uid);
      if (!PERSONES[uid]) return Promise.reject(Object.assign(new Error('SDP-EXPORT-000: cal la sessió iniciada.'), { status: 400 }));
      const x = PERSONES[uid];
      serial += 1;
      const resposta = {
        format: 'socdepoble.exportacio.v1',
        peticio: serial,
        perfil: { id: uid, nom: `SECRET-${x}-nom` },
        notes: [{ cos: `SECRET-${x}-nota` }],
        xat: { missatges_propis: [{ text: `SECRET-${x}-missatge` }] },
        federacio_no_versionada: contracte === 'v1' ? projectaV1(uid) : infereix(uid)
      };
      if (!servidor.difereix) return Promise.resolve(structuredClone(resposta));
      return new Promise((resolve) => { pendents.push(() => resolve(structuredClone(resposta))); });
    },
    allibera() { pendents.splice(0).forEach((f) => f()); }
  };
  return servidor;
}

/* ── La sessió de veres ── */
const b64u = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
let entrades = 0;
const testimoni = (sub) => `${b64u({ alg: 'none' })}.${b64u({ sub, iss: EMISSOR, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, n: ++entrades })}.c2ln`;
const entra = (sub) => expect(desaSessio({ access_token: testimoni(sub), refresh_token: `rt-${entrades}`, user: { id: sub } })).toBe(true);
const quanSiguaEnviada = (n) => vi.waitFor(() => expect(m.servidor.rebudes).toHaveLength(n));
const exporta = () => exportaLesMeuesDades({ ...CONFIG });

/** Tot el que porta una exportació és de `x`: cap marcador ni uuid de l'altre, cap NOEXPORT, cap _contracte, i la federació només amb files pròpies. */
function comprovaQueEsDe(dades, x) {
  const altre = x === 'A' ? 'B' : 'A';
  const uidAltre = x === 'A' ? B : A;
  const uid = x === 'A' ? A : B;
  const text = JSON.stringify(dades);
  expect(text, `marcadors de ${altre}`).not.toContain(`SECRET-${altre}`);
  expect(text, 'columnes fora del contracte').not.toContain('NOEXPORT');
  expect(text, `uuid de ${altre}`).not.toContain(uidAltre);
  expect(dades.perfil.id).toBe(uid);
  expect(text).toContain(`SECRET-${x}-nota`);
  const fed = dades.federacio_no_versionada;
  expect(Object.keys(fed).sort()).toEqual(['connections', 'posts', 'realms', 'user_realms']);
  for (const [taula, files] of Object.entries(fed)) {
    const propietat = CONTRACTE_EXPORTACIO_FEDERACIO[taula].columnaPropietat;
    expect(files.length, taula).toBe(1);
    expect(files[0][propietat], taula).toBe(uid);
    for (const columna of Object.keys(files[0])) expect(CONTRACTE_EXPORTACIO_FEDERACIO[taula].columnesExportades, `${taula}.${columna}`).toContain(columna);
  }
}

beforeEach(() => {
  configuraBackendSessio(CONFIG);
  m.servidor = creaServidor();
  m.crides = 0;
});
afterEach(() => {
  esborraSessio({ abast: 'tot' });
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe('dos comptes amb el servidor v1 (2611011800)', () => {
  test('1 · A exporta: només el que és d’A, i la federació d’A és la pròpia, projectada pel contracte', async () => {
    entra(A);
    const dades = await exporta();
    comprovaQueEsDe(dades, 'A');
    expect(m.servidor.rebudes).toEqual([A]);
    /* El client descarta la marca del contracte i deixa passar sencer el que projecta el servidor. */
    const { _contracte, ...federacioV1 } = projectaV1(A);
    expect(_contracte).toBe('sdp.exportacio.federacio.v1');
    expect(dades.federacio_no_versionada).toEqual(federacioV1);
  });

  test('2 · entra B (una generació nova) i exporta: res d’A', async () => {
    entra(A);
    comprovaQueEsDe(await exporta(), 'A');
    entra(B);
    const dades = await exporta();
    comprovaQueEsDe(dades, 'B');
    expect(m.servidor.rebudes).toEqual([A, B]);
  });

  test('3 · A → B mentre l’RPC d’A és en vol: AbortError, i l’exportació següent de B és de B', async () => {
    entra(A);
    m.servidor.difereix = true;
    const feina = exporta();
    const assercio = expect(feina).rejects.toMatchObject({ name: 'AbortError' });
    await quanSiguaEnviada(1);
    entra(B);
    m.servidor.allibera();
    await assercio;
    expect(m.servidor.rebudes).toEqual([A]);
    m.servidor.difereix = false;
    comprovaQueEsDe(await exporta(), 'B');
    expect(m.servidor.rebudes).toEqual([A, B]);
  });

  test('4 · A → B → A en vol (la mateixa persona, una altra entrada): AbortError, mai la resposta vella', async () => {
    entra(A);
    m.servidor.difereix = true;
    const feina = exporta();
    const assercio = expect(feina).rejects.toMatchObject({ name: 'AbortError' });
    await quanSiguaEnviada(1);
    entra(B);
    entra(A);
    m.servidor.allibera();
    await assercio;
    m.servidor.difereix = false;
    const dades = await exporta();
    comprovaQueEsDe(dades, 'A');
    /* Una petició nova (la segona), no la primera reaprofitada. */
    expect(dades.peticio).toBe(2);
    expect(m.crides).toBe(2);
  });

  test('6 · si l’usuari desat canvia d’id sense entrada nova mentre l’RPC és en vol: AbortError (el filtre mai corre amb un uid distint del capturat)', async () => {
    entra(A);
    m.servidor.difereix = true;
    const feina = exporta();
    const assercio = expect(feina).rejects.toMatchObject({ name: 'AbortError' });
    await quanSiguaEnviada(1);
    /* Una escriptura de l'usuari desat a la pestanya, sense desaSessio: la mateixa generació, un altre id. */
    setEfimer(CLAU_USUARI, { ...getEfimer(CLAU_USUARI, null), id: B });
    m.servidor.allibera();
    await assercio;
  });

  test('sense sessió: no s’envia res', async () => {
    await expect(exporta()).rejects.toThrow('Cal iniciar sessió');
    expect(m.crides).toBe(0);
  });
});

describe('5 · dos comptes amb un servidor d’abans de la 2610311900 (inferència per qualsevol columna uuid)', () => {
  beforeEach(() => { m.servidor = creaServidor({ contracte: 'inferencia' }); });

  test('el servidor torna a A les files de B que l’esmenten, i el client les descarta amb les columnes de contrapart', async () => {
    entra(A);
    /* Premissa: la resposta crua d'A porta files i marcadors de B. */
    expect(JSON.stringify(infereix(A))).toContain('SECRET-B');
    const dades = await exporta();
    comprovaQueEsDe(dades, 'A');
    expect(dades.federacio_no_versionada).toEqual({
      realms: [{ id: id('a'), tenant_id: T, slug: 'la-torre-de-les-macanes', name: 'SECRET-A-realm', owner_user_id: A, created_at: '2026-10-01T10:00:00Z' }],
      user_realms: [{ id: id('c'), tenant_id: T, user_id: A, realm_id: id('a'), role: 'member', handle: 'SECRET-A-handle' }],
      connections: [{ id: id('e'), tenant_id: T, user_id: A, remote_handle: 'SECRET-A-remot', status: 'active' }],
      posts: [{ id: id('1'), tenant_id: T, author_id: A, content: 'SECRET-A-post', created_at: '2026-10-03T10:00:00Z' }]
    });
  });

  test('i el mateix per a B després de canviar de compte', async () => {
    entra(A);
    comprovaQueEsDe(await exporta(), 'A');
    entra(B);
    comprovaQueEsDe(await exporta(), 'B');
  });
});

describe('mutació: un servidor que no mira el JWT', () => {
  beforeEach(() => { m.servidor = creaServidor({ ignoraJwt: true }); });

  test('fa caure el cas 2: l’exportació de B porta les dades d’A', async () => {
    entra(A);
    await exporta();
    entra(B);
    const dades = await exporta();
    expect(() => comprovaQueEsDe(dades, 'B')).toThrow();
  });

  test('fa caure el cas 3: després de A → B en vol, l’exportació següent de B no és de B', async () => {
    entra(A);
    m.servidor.difereix = true;
    const feina = exporta();
    const assercio = expect(feina).rejects.toMatchObject({ name: 'AbortError' });
    await quanSiguaEnviada(1);
    entra(B);
    m.servidor.allibera();
    await assercio;
    m.servidor.difereix = false;
    const dades = await exporta();
    expect(() => comprovaQueEsDe(dades, 'B')).toThrow();
  });
});
