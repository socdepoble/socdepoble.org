// @vitest-environment node
/* B5 (marató 261101_2143; spec B5-FEDERACIO §2.7 i §4.1) · El mateix joc de conformitat
   (conformitatMagatzem.js) per a les dues implementacions de cada port: la memòria i l'adaptador
   PostgREST. L'adaptador corre sobre un PostgREST doble que:
     · llig les signatures de les RPC de la migració real (supabase/migrations/*_ap_inbox_persistencia_i_cua.sql)
       i exigix el nom, els paràmetres en ordre i el tipus JSON de cada valor;
     · comprova que els sostres que viatgen són els configurats;
     · executa la semàntica amb la memòria i torna el format de PostgREST (instants «+00:00», errors
       {code, message}: SDP-AP-QUOTA amb 54000, la resta 22023).
   Les violacions del contracte s'apunten a part (un expect dins del fetch quedaria amagat per
   l'adaptador, que convertix tota fallada en magatzem_no_disponible). L'SQL real el prova l'arnés
   PGlite fora de l'arbre (registre del carril M13). */
import { afterEach, describe, expect, test } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASOS_CUA, CASOS_MAGATZEM_INBOX, FallaConformitat, exigix, exigixQueLlanca } from './conformitatMagatzem.js';
import { LIMITS_PER_DEFECTE, MISSATGES_QUOTA, RPC_AP, creaMagatzemPostgrest } from './magatzemPostgrest.js';
import { creaCuaEnMemoria } from './cuaLliurament.js';
import {
  REPRESA_EN_CURS_MS, RETENCIO_ACTIVITAT_MS, RETENCIO_LAPIDA_MS, atenPeticioInbox, clauDeDocumentActor, creaMagatzemInboxEnMemoria, hostDeQuota
} from '../../../src/data/federacio/inboxActivityPub.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const NOM_MIGRACIO = /^\d{10}_ap_inbox_persistencia_i_cua\.sql$/;
const fitxers = readdirSync(MIGRACIONS).filter((nom) => NOM_MIGRACIO.test(nom));
const SQL = fitxers.length === 1 ? readFileSync(path.join(MIGRACIONS, fitxers[0]), 'utf8') : '';
/* nom → [[paràmetre, tipus]] de cada `create or replace function public.ap_*(…)` de la migració. */
const SIGNATURES = new Map([...SQL.matchAll(/create or replace function public\.(ap_[a-z_]+)\(([^)]*)\)/g)].map(([, nom, params]) => [
  nom, params.split(',').map((p) => p.trim()).filter(Boolean).map((p) => { const [n, tipus] = p.split(/\s+/); return [n, tipus]; })
]));
const BASE = 'https://abcdefghijklmnop.supabase.co';
const CLAU = 'eyJhbGciOiJIUzI1NiJ9.prova-de-servei.signatura';
const ARA = Date.UTC(2026, 10, 2, 1, 0, 0);

const rellotge = () => { let t = ARA; return { ara: () => t, avanca: async (ms) => { t += ms; } }; };
const esInstant = (v) => typeof v === 'string' && Number.isFinite(Date.parse(v));
const TIPUS = {
  text: (v) => v === null || typeof v === 'string',
  integer: (v) => v === null || Number.isSafeInteger(v),
  bigint: (v) => Number.isSafeInteger(v),
  boolean: (v) => typeof v === 'boolean',
  timestamptz: (v) => v === null || esInstant(v),
  jsonb: (v) => v !== null && typeof v === 'object'
};
const pg = (valor) => (valor === null || valor === undefined ? null : new Date(Date.parse(valor)).toISOString().replace('Z', '+00:00'));
const json = (status, cos) => new Response(JSON.stringify(cos), { status, headers: { 'Content-Type': 'application/json' } });

/* Els sostres del cas: per a la memòria i per a l'adaptador (i el doble, que comprova que viatgen). */
function limitsDe(limits = {}) {
  const maxim = limits.maxim ?? 10_000;
  return {
    memoria: { maximPerOrigen: limits.maximPerHost ?? 1000, maxim },
    adaptador: { maximPerHost: limits.maximPerHost ?? 1000, maxim, maximSeguidors: maxim, maximAlertes: maxim, maximIntents: limits.maximIntents ?? 10 }
  };
}

let violacions = [];
afterEach(() => {
  const totes = violacions;
  violacions = [];
  expect(totes).toEqual([]);
});

function creaPostgrestDoble({ limits, ara }) {
  const memoria = creaMagatzemInboxEnMemoria(limitsDe(limits).memoria);
  const esperats = limitsDe(limits).adaptador;
  const cua = creaCuaEnMemoria({ ara, maximIntents: esperats.maximIntents });
  const crides = [];
  const viola = (text) => violacions.push(text);
  const iso = () => new Date(ara()).toISOString();
  const sostre = (nom, valor, esperat) => { if (valor !== esperat) viola(`${nom}: ${valor} en lloc de ${esperat}`); };
  const executa = {
    ap_inbox_reclama(p) {
      if (p.p_host !== hostDeQuota(p.p_actor)) viola(`ap_inbox_reclama: p_host ${p.p_host}`);
      sostre('p_retencio_s', p.p_retencio_s, RETENCIO_ACTIVITAT_MS / 1000);
      sostre('p_maxim_per_host', p.p_maxim_per_host, esperats.maximPerHost);
      sostre('p_maxim', p.p_maxim, esperats.maxim);
      return memoria.reclamaActivitat(p.p_activitat_id, { actor: p.p_actor, tipus: p.p_tipus, rebuda: iso() });
    },
    ap_inbox_confirma: (p) => memoria.confirmaActivitat(p.p_activitat_id),
    ap_inbox_allibera: (p) => memoria.alliberaActivitat(p.p_activitat_id),
    ap_seguidor_desa(p) {
      sostre('ap_seguidor_desa.p_maxim', p.p_maxim, esperats.maximSeguidors);
      return memoria.desaSeguidor({ slug: p.p_slug, actor: p.p_actor, inbox: p.p_inbox, followId: p.p_follow_id, acceptId: p.p_accept_id, des: iso() });
    },
    ap_seguidor_retira: (p) => memoria.retiraSeguidor({ slug: p.p_slug, actor: p.p_actor, followId: p.p_follow_id }),
    ap_actor_remot_retira: (p) => memoria.retiraActorRemot(p.p_actor),
    ap_alerta_desa(p) {
      sostre('ap_alerta_desa.p_maxim', p.p_maxim, esperats.maximAlertes);
      return memoria.desaAlertaRemota({
        id: p.p_id, actor: p.p_actor, via: p.p_via, activitat: p.p_activitat, tipus: p.p_tipus, url: p.p_url,
        nom: p.p_nom ?? '', text: p.p_text ?? '', publicat: p.p_publicat, caduca: p.p_caduca, rebuda: p.p_rebuda
      });
    },
    ap_alerta_retira(p) {
      sostre('p_lapida_s', p.p_lapida_s, RETENCIO_LAPIDA_MS / 1000);
      return memoria.retiraAlertaRemota({ id: p.p_id, actor: p.p_actor, activitat: p.p_activitat, lapida: p.p_lapida, ara: ara() });
    },
    async ap_alertes_vigents(p) {
      const files = await memoria.llistaAlertesVigents(p.p_ara === null ? ara() : Date.parse(p.p_ara));
      return files.sort((a, b) => Date.parse(a.rebuda) - Date.parse(b.rebuda) || (a.id < b.id ? -1 : 1)).slice(0, 500).map((a) => ({
        id: a.id, actor: a.actor, via: a.via ?? null, activitat: a.activitat, tipus: a.tipus, url: a.url ?? null, nom: a.nom, text: a.text,
        publicat: pg(a.publicat), caduca: pg(a.caduca), rebuda: pg(a.rebuda)
      }));
    },
    async ap_purga() {
      const r = await memoria.purga(ara());
      return { activitats: r.activitats, alertes: r.alertes, lapides: r.lapides, cua: await cua.purga() };
    },
    ap_cua_encua(p) {
      if (!p.p_cos || p.p_cos.id !== p.p_activitat_id) throw new TypeError('22023');
      return cua.encua({ slug: p.p_slug, inbox: p.p_inbox, activitat: p.p_cos });
    },
    ap_cua_reclama: (p) => cua.reclama(p.p_limit),
    ap_cua_resol(p) {
      sostre('p_maxim_intents', p.p_maxim_intents, esperats.maximIntents);
      return cua.resol({ id: p.p_id, resultat: p.p_resultat, esperaS: p.p_espera_s, error: p.p_error });
    }
  };
  const fetch = async (url, init) => {
    const u = new URL(url);
    const nom = u.pathname.startsWith('/rest/v1/rpc/') ? u.pathname.slice('/rest/v1/rpc/'.length) : null;
    if (u.origin !== BASE || init?.method !== 'POST') viola(`petició ${init?.method} ${url}`);
    const h = init?.headers ?? {};
    if (h.apikey !== CLAU || h.Authorization !== `Bearer ${CLAU}` || h['Content-Type'] !== 'application/json') viola(`capçaleres de ${nom}`);
    if (!(init?.signal instanceof AbortSignal)) viola(`${nom} sense topall`);
    const params = JSON.parse(init.body);
    crides.push({ nom, params });
    const signatura = SIGNATURES.get(nom);
    if (!signatura) { viola(`RPC desconeguda a la migració: ${nom}`); return json(404, { code: 'PGRST202', message: 'Could not find the function' }); }
    const noms = signatura.map(([n]) => n);
    if (Object.keys(params).join(',') !== noms.join(',')) viola(`${nom}: paràmetres ${Object.keys(params)} en lloc de ${noms}`);
    for (const [n, tipus] of signatura) if (!TIPUS[tipus]?.(params[n])) viola(`${nom}.${n}: ${JSON.stringify(params[n])} no és ${tipus}`);
    try {
      const valor = await executa[nom](params);
      return json(200, valor === undefined ? null : valor);
    } catch (error) {
      if (error instanceof RangeError && nom !== 'ap_cua_encua') return json(500, { code: '54000', message: `SDP-AP-QUOTA: ${error.message}`, details: null, hint: null });
      return json(400, { code: '22023', message: 'SDP-AP-001: paràmetre invàlid.', details: null, hint: null });
    }
  };
  return { fetch, crides, memoria, cua };
}

const adaptador = (limits, ara, extra = {}) => {
  const doble = creaPostgrestDoble({ limits, ara });
  return { doble, magatzem: creaMagatzemPostgrest({ base: BASE, clau: CLAU, fetch: doble.fetch, limits: limitsDe(limits).adaptador, ...extra }) };
};
const IMPLEMENTACIONS_INBOX = {
  memoria: (limits) => creaMagatzemInboxEnMemoria(limitsDe(limits).memoria),
  postgrest: (limits, ara) => adaptador(limits, ara).magatzem
};
const IMPLEMENTACIONS_CUA = {
  memoria: (limits, ara) => creaCuaEnMemoria({ ara, maximIntents: limitsDe(limits).adaptador.maximIntents }),
  postgrest: (limits, ara) => adaptador(limits, ara).magatzem
};

describe('contracte amb la migració', () => {
  test('hi ha una sola migració ap_inbox_persistencia_i_cua i RPC_AP en té exactament les RPC i els paràmetres, en ordre', () => {
    expect(fitxers).toHaveLength(1);
    const migracio = Object.fromEntries([...SIGNATURES].map(([nom, params]) => [nom, params.map(([n]) => n)]));
    expect(Object.fromEntries(Object.entries(RPC_AP).map(([nom, params]) => [nom, [...params]]))).toEqual(migracio);
    expect(Object.keys(migracio)).toHaveLength(13);
    // Cada tipus de la signatura el sap comprovar el doble (si la migració n'afig un altre, cal ampliar-lo).
    for (const [nom, params] of SIGNATURES) for (const [n, tipus] of params) expect([nom, n, tipus in TIPUS]).toEqual([nom, n, true]);
  });

  test('els missatges de quota de la migració són els de la memòria', () => {
    expect(SQL).toContain(`'SDP-AP-QUOTA: ${MISSATGES_QUOTA.host}'`);
    expect(SQL).toContain(`'SDP-AP-QUOTA: ${MISSATGES_QUOTA.ple}'`);
    expect(LIMITS_PER_DEFECTE).toEqual({ maximPerHost: 1000, maxim: 100_000, maximSeguidors: 10_000, maximAlertes: 10_000, maximIntents: 10 });
  });

  test('ARB-M13-03 · la represa d’una reclamació en curs té el mateix interval a la memòria i a l’SQL (5 min)', () => {
    expect(REPRESA_EN_CURS_MS).toBe(5 * 60_000);
    expect(SQL).toMatch(/l\.estat = 'en_curs' and l\.rebuda_al < now\(\) - interval '5 minutes'/);
  });
});

for (const [nomImplementacio, crea] of Object.entries(IMPLEMENTACIONS_INBOX)) {
  describe(`conformitat del port de la inbox · ${nomImplementacio}`, () => {
    for (const cas of CASOS_MAGATZEM_INBOX) {
      test(cas.nom, async () => {
        const r = rellotge();
        await cas.prova(crea(cas.limits, r.ara), { ara: r.ara, avanca: r.avanca });
      });
    }
  });
}

for (const [nomImplementacio, crea] of Object.entries(IMPLEMENTACIONS_CUA)) {
  describe(`conformitat del port de la cua · ${nomImplementacio}`, () => {
    for (const cas of CASOS_CUA) {
      test(cas.nom, async () => {
        const r = rellotge();
        await cas.prova(crea(cas.limits, r.ara), { ara: r.ara, avanca: r.avanca });
      });
    }
  });
}

describe('el joc mossega', () => {
  test('una memòria que no torna la quota en alliberar, o que allibera una confirmada, el fa caure', async () => {
    const cas = (nom) => CASOS_MAGATZEM_INBOX.find((c) => c.nom.startsWith(nom));
    const r = rellotge();
    const base = creaMagatzemInboxEnMemoria({ maximPerOrigen: 1 });
    const senseQuota = { ...base, alliberaActivitat: async () => true };
    await expect(cas('alliberar').prova(senseQuota, r)).rejects.toThrow(FallaConformitat);
    const base2 = creaMagatzemInboxEnMemoria();
    const alliberaSempre = { ...base2, alliberaActivitat: async () => true };
    await expect(cas('confirmar').prova(alliberaSempre, r)).rejects.toThrow(FallaConformitat);
  });

  test('exigixQueLlanca comprova el tipus i el missatge', async () => {
    await expect(exigixQueLlanca(async () => { throw new TypeError('x'); }, { tipus: RangeError })).rejects.toThrow(FallaConformitat);
    await expect(exigixQueLlanca(async () => { throw new RangeError('x'); }, { missatge: 'y' })).rejects.toThrow(FallaConformitat);
    await expect(exigixQueLlanca(async () => 1)).rejects.toThrow(FallaConformitat);
    expect(() => exigix(false, 'no')).toThrow('no');
  });
});

describe('l’adaptador PostgREST: transport, errors i formes', () => {
  const ambFetch = (fetch, extra = {}) => creaMagatzemPostgrest({ base: `${BASE}/`, clau: CLAU, fetch, ...extra });

  test('una base, una clau i un fetch, o TypeError; una clau sb_secret_ només va a apikey', async () => {
    for (const dolent of [{ base: 'ftp://x', clau: CLAU }, { base: BASE, clau: ' ' }, { base: `${BASE}/rest`, clau: CLAU }, { base: BASE, clau: CLAU, fetch: 7 }]) {
      expect(() => creaMagatzemPostgrest({ fetch: async () => json(200, true), ...dolent })).toThrow(TypeError);
    }
    let capcaleres = null;
    const m = creaMagatzemPostgrest({ base: BASE, clau: 'sb_secret_prova', fetch: async (url, init) => { capcaleres = init.headers; return json(200, true); } });
    expect(await m.confirmaActivitat('https://x.example/a/1')).toBe(true);
    expect(capcaleres).toEqual({ apikey: 'sb_secret_prova', 'Content-Type': 'application/json', Accept: 'application/json' });
  });

  test('quota: els dos missatges de la memòria; un 54000 amb un altre text és «ple»; la resta, magatzem_no_disponible sense detall', async () => {
    const amb = (status, cos) => ambFetch(async () => json(status, cos));
    await exigixQueLlanca(() => amb(500, { code: '54000', message: `SDP-AP-QUOTA: ${MISSATGES_QUOTA.host}` }).reclamaActivitat('https://x.example/a', { actor: 'https://x.example/u', tipus: 'Undo' }),
      { tipus: RangeError, missatge: MISSATGES_QUOTA.host });
    await exigixQueLlanca(() => amb(500, { code: '54000', message: 'SDP-AP-QUOTA: massa seguidors.' }).desaSeguidor({}), { tipus: RangeError, missatge: MISSATGES_QUOTA.ple });
    for (const [status, cos] of [[403, { code: '42501', message: 'SDP-AP-000: només el servidor. eyJsecret' }], [500, { code: '54000', message: 'program limit' }],
      [404, { code: 'PGRST202', message: 'Could not find the function public.ap_inbox_reclama' }], [400, 'no és un objecte'], [200, undefined]]) {
      const fetch = async () => (cos === undefined ? new Response('no és json', { status }) : json(status, cos));
      let error = null;
      try { await ambFetch(fetch).reclamaActivitat('https://x.example/a', { actor: 'https://x.example/u', tipus: 'Undo' }); } catch (e) { error = e; }
      expect([status, error?.constructor, error?.message]).toEqual([status, Error, 'magatzem_no_disponible']);
    }
    // Una fallada de xarxa, també.
    await expect(ambFetch(async () => { throw new TypeError('fetch failed'); }).purga()).rejects.toThrow('magatzem_no_disponible');
  });

  test('topall: una base que no respon, o un cos que penja, és magatzem_no_disponible al cap del topall', async () => {
    const inici = Date.now();
    await expect(ambFetch(() => new Promise(() => {}), { topallMs: 40 }).alliberaActivitat('https://x.example/a')).rejects.toThrow('magatzem_no_disponible');
    const pengim = { ok: true, status: 200, json: () => new Promise(() => {}) };
    await expect(ambFetch(async () => pengim, { topallMs: 40 }).alliberaActivitat('https://x.example/a')).rejects.toThrow('magatzem_no_disponible');
    expect(Date.now() - inici).toBeLessThan(2000);
  });

  test('formes: cada resposta es valida i cada fila es reconstruïx camp a camp', async () => {
    const amb = (cos) => ambFetch(async () => json(200, cos));
    await expect(amb('true').reclamaActivitat('https://x.example/a', { actor: 'https://x.example/u', tipus: 'Undo' })).rejects.toThrow('magatzem_no_disponible');
    await expect(amb('potser').desaSeguidor({})).rejects.toThrow('magatzem_no_disponible');
    await expect(amb(-1).retiraActorRemot('https://x.example/u')).rejects.toThrow('magatzem_no_disponible');
    await expect(amb({ id: 1 }).llistaAlertesVigents(ARA)).rejects.toThrow('magatzem_no_disponible');
    await expect(amb([{ id: 'https://x.example/n', actor: 'a', via: null, activitat: 'b', tipus: 'altre', url: null, nom: '', text: '', publicat: null, caduca: pg(new Date(ARA).toISOString()), rebuda: pg(new Date(ARA).toISOString()) }])
      .llistaAlertesVigents(ARA)).rejects.toThrow('magatzem_no_disponible');
    await expect(amb({ activitats: 1, alertes: 0, lapides: 0 }).purga()).rejects.toThrow('magatzem_no_disponible');
    await expect(amb([{ id: '1', slug: 's', inbox: 'i', activitat_id: 'a', cos: {}, intents: 1 }]).reclama(5)).rejects.toThrow('magatzem_no_disponible');
    await expect(amb('pendent?').resol({ id: 1, resultat: 'fet' })).rejects.toThrow('magatzem_no_disponible');
    await expect(amb(null).resol({ id: 1, resultat: 'altre' })).rejects.toThrow(TypeError);
    // Una fila bona: només els camps del contracte, i els instants en ISO.
    const fila = { id: 'https://x.example/n', actor: 'https://x.example/u', via: null, activitat: 'https://x.example/c', tipus: 'alerta', url: null, nom: 'N', text: 'T',
      publicat: '2026-11-02T00:00:00+00:00', caduca: '2026-11-03T00:00:00+00:00', rebuda: '2026-11-02T01:00:00+00:00', farcit: 'x' };
    expect(await amb([fila]).llistaAlertesVigents(ARA)).toEqual([{ id: fila.id, actor: fila.actor, via: null, activitat: fila.activitat, tipus: 'alerta', url: null, nom: 'N', text: 'T',
      publicat: '2026-11-02T00:00:00.000Z', caduca: '2026-11-03T00:00:00.000Z', rebuda: '2026-11-02T01:00:00.000Z' }]);
    const cua = { id: 7, slug: 'la-torre-de-les-macanes', inbox: 'https://m.example/inbox', activitat_id: 'https://socdepoble.org/x', cos: { id: 'https://socdepoble.org/x' }, intents: 2, extra: 1 };
    expect(await amb([cua]).reclama(5)).toEqual([{ id: 7, slug: cua.slug, inbox: cua.inbox, activitat_id: cua.activitat_id, cos: cua.cos, intents: 2 }]);
  });

  test('els sostres: un límit estrany pren el per defecte; esperaS es passa en segons enters i l’error es talla', async () => {
    const crides = [];
    const fetch = async (url, init) => { crides.push(JSON.parse(init.body)); return json(200, 'pendent'); };
    const m = ambFetch(fetch, { limits: { maximPerHost: 'molts', maximIntents: 99 } });
    await m.resol({ id: 3, resultat: 'reintent', esperaS: 44.6, error: 'x'.repeat(300) });
    expect(crides[0]).toEqual({ p_id: 3, p_resultat: 'reintent', p_espera_s: 45, p_error: 'x'.repeat(200), p_maxim_intents: 50 });
    crides.length = 0;
    const r = ambFetch(async (url, init) => { crides.push(JSON.parse(init.body)); return json(200, true); }, { limits: { maximPerHost: 'molts' } });
    await r.reclamaActivitat('https://X.example./a', { actor: 'https://X.example.:8443/u', tipus: 'Follow', rebuda: 'ignorada' });
    expect(crides[0]).toEqual({ p_activitat_id: 'https://X.example./a', p_actor: 'https://X.example.:8443/u', p_host: 'x.example', p_tipus: 'Follow', p_retencio_s: 50400, p_maxim_per_host: 1000, p_maxim: 100000 });
  });

  test('el processador sobre l’adaptador: reclama, desa el seguidor i confirma, en eixe ordre', async () => {
    const { webcrypto, generateKeyPairSync, createSign, createHash } = await import('node:crypto');
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const REMOT = 'https://mastodon.example/users/anna';
    const doc = { id: REMOT, type: 'Person', inbox: `${REMOT}/inbox`, publicKey: { id: `${REMOT}#main-key`, owner: REMOT, publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }) } };
    const LOCAL = 'https://socdepoble.org/ap/actors/la-torre-de-les-macanes.json';
    const cos = JSON.stringify({ id: `${REMOT}#follows/9`, type: 'Follow', actor: REMOT, object: LOCAL });
    const capcaleres = { host: 'socdepoble.org', date: new Date(ARA).toUTCString(), digest: `SHA-256=${createHash('sha256').update(cos).digest('base64')}`, 'content-type': 'application/activity+json' };
    const cadena = `(request-target): post /ap/inbox/la-torre-de-les-macanes\nhost: ${capcaleres.host}\ndate: ${capcaleres.date}\ndigest: ${capcaleres.digest}`;
    capcaleres.signature = `keyId="${REMOT}#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${createSign('RSA-SHA256').update(cadena).sign(privateKey, 'base64')}"`;
    const r = rellotge();
    const { doble, magatzem } = adaptador({}, r.ara);
    const resposta = await atenPeticioInbox({ metode: 'POST', cami: '/ap/inbox/la-torre-de-les-macanes', capcaleres, cos }, {
      origen: 'https://socdepoble.org', actorsLocals: ['la-torre-de-les-macanes'], magatzem, ara: ARA, subtle: webcrypto.subtle,
      obtenClauPublica: async (keyId) => ({ clau: clauDeDocumentActor(doc, keyId), documentActor: doc })
    });
    expect([resposta.status, resposta.cos, resposta.lliuraments.length]).toEqual([202, { estat: 'processada' }, 1]);
    expect(doble.crides.map((c) => c.nom)).toEqual(['ap_inbox_reclama', 'ap_seguidor_desa', 'ap_inbox_confirma']);
    expect(doble.memoria.instantania().seguidors).toHaveLength(1);
  });
});
