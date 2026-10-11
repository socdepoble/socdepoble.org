import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { validaBackendImplementation } from '../backendPort.js';
import { CASOS, contextDeConformitat, executaCas } from '../conformitat/kit.js';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { reiniciaLocalXat } from '../localXat.js';
import * as supabase from './index.js';

/* Kit de conformitat del port (261006) passat a l'adaptador Supabase en mode
   'seed', sense xarxa. Viu ací i no a src/data/conformitat/: E1 de
   tractor-enxufe només deixa importar l'adaptador des de src/data/supabase/.
   El Bloc local desa a IndexedDB, que jsdom no té: el mateix adaptador local
   (createLocalNotesAdapter) amb un magatzem en memòria. La resta (localXat,
   localPerfils, la llavor) és la de producció. */
vi.mock('../localNotes.js', async (original) => {
  const real = await original();
  const files = new Map();
  const memoria = {
    async read(clau) { return structuredClone(files.get(clau) || {}); },
    async mutate(clau, transforma) {
      const valor = transforma(structuredClone(files.get(clau)));
      files.set(clau, structuredClone(valor));
      return valor;
    }
  };
  return { ...real, localNotes: real.createLocalNotesAdapter(memoria) };
});

/* Auditoria 261007 (B) · La passada remota parla amb un doble del servidor:
   supabase-js (el client de les RPC i del canal del Xat) es canvia només
   mentre dura la passada; la resta del mòdul és el de producció. */
const servidor = vi.hoisted(() => ({ actiu: false, client: null, fetch: null }));
vi.mock('./config.js', async (original) => {
  const real = await original();
  return { ...real, getClient: async (config) => (servidor.actiu ? servidor.client : real.getClient(config)) };
});

/* Cap petició de xarxa en mode 'seed', i ho comprovem. En la passada remota,
   cada petició va al doble del servidor. */
const xarxaSeed = vi.fn(() => { throw new Error('XARXA_PROHIBIDA_A_LA_CONFORMITAT'); });
const fetchDeProva = vi.fn((...args) => (servidor.actiu ? servidor.fetch(...args) : xarxaSeed(...args)));
beforeAll(() => {
  vi.stubGlobal('fetch', fetchDeProva);
  reiniciaLocalXat();
});
afterAll(() => {
  vi.unstubAllGlobals();
  reiniciaLocalXat();
});

/* L'spread fa falta: vitest pot exposar els exports del mòdul amb getters, i el
   port rebutja els accessors (index.test.js). */
const adaptador = { ...supabase };
/* En llavor, salut i xatDePagina només en validen la forma: el config va sense URL a posta (cap sonda). */
const ctx = contextDeConformitat({ config: { dataMode: 'seed' }, escriptures: true });
const resultats = new Map();

describe('conformitat del port · Supabase en mode seed', () => {
  test('el port l’accepta: nucli sencer i cap capacitat a mitges', () => {
    expect(() => validaBackendImplementation(adaptador)).not.toThrow();
  });

  /* En ordre: cada cas pot deixar al context el que necessita el següent. */
  for (const [index, c] of CASOS.entries()) {
    test(`${index + 1}. ${c.titol}`, async () => {
      const resultat = await executaCas(c, adaptador, ctx);
      resultats.set(index, resultat);
      expect(resultat.falles, resultat.falles.join(' · ')).toEqual([]);
      expect(resultat.estat).not.toBe('falla');
    });
  }

  test('només s’ometen les capacitats que Supabase no té', () => {
    const omesos = CASOS.map((c, index) => [c, resultats.get(index)])
      .filter(([, resultat]) => resultat?.estat === 'omés')
      .map(([c, resultat]) => `${c.metode}: ${resultat.motiu}`);
    expect(omesos).toEqual([]);
    expect(resultats.size).toBe(CASOS.length);
  });

  test('cap petició de xarxa en tota la passada', () => {
    expect(xarxaSeed).not.toHaveBeenCalled();
  });
});

/* ═══════════════ Auditoria 261007 (B) · La passada en 'remote' ═══════════════
   La passada en seed certifica els magatzems locals (localXat, localNotes,
   localPerfils): en seed cada mètode torna abans del codi remot, i ni
   mapejaFil, ni nota(), ni cap RPC o filtre PostgREST passaven pel kit. Esta
   segona passada corre el kit sencer contra el codi que va a producció, amb un
   doble del servidor:
   · supabase-js fals per al Xat: xat_fils_meus, xat_historial, xat_envia,
     xat_marca, membres_del_poble i el canal privat;
   · fetch fals per a PostgREST i GoTrue: app_content, section_submissions,
     notes (amb el PATCH buit i la verificació del 409), profiles,
     list_my_organizations, organization_directory, user_platform_roles i
     /auth/v1/health;
   · una sessió real (identitat.js) i un tenantId UUID.
   Com Postgres, el doble rebutja amb 22P02 un paràmetre uuid que no és cap
   UUID: si el kit triara una fila sintètica del Xat (Conversa.perDefecte,
   xatsPerDefecte.js), la passada cauria.
   Límit honest: són captures congelades amb els noms de columna de les
   migracions (2609272200_xat_entitats.sql, 2609282100_xat_de_pagina.sql).
   No detecten un canvi d'esquema al servidor: per a això cal una prova de fum
   contra una branca de Supabase. */

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POBLE = '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const PERSONA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const VEINA = '2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6';
const FIL = '3f405162-7c8d-4e9f-a0b1-c2d3e4f5a6b7';
const ORIGEN = 'http://localhost:54321';
const JWT = 'jwt-opac-de-conformitat';
const CONFIG_REMOT = Object.freeze({ dataMode: 'remote', supabaseUrl: ORIGEN, supabaseAnonKey: 'sb_publishable_proves', tenantId: POBLE });

const ARA = '2026-10-07T10:00:00+00:00';
const missatgeDelServidor = (seq, usuari, cos) => ({
  id: `4a5b6c7d-8e9f-4a0b-9c1d-${String(seq).padStart(12, '0')}`, fil_id: FIL, seq, usuari_id: usuari,
  autor_nom: usuari === PERSONA ? 'Persona de conformitat' : 'Veïna', com_org_id: null, cos, tipus: 'text',
  resposta_a: null, editat_al: null, esborrat_al: null, metadades: {}, es_ia: false, creat_al: ARA
});

/** Un estat nou del doble per a cada passada: res no es filtra d'una a l'altra. */
function estatDelServidor() {
  return {
    rutesDesconegudes: [],
    autoritzacions: new Set(),
    notes: new Map(),
    missatges: [missatgeDelServidor(1, VEINA, 'Bon dia!'), missatgeDelServidor(2, PERSONA, 'Hola, veïna')],
    marca: { rebut: 2, llegit: 1 },
    canalsTancats: [],
    /* Decisió 4 · Les publicacions dels veïns per secció (section_submissions);
       null és la del Mur de sempre (SUBMISSIO_DEL_MUR, declarada més avall). */
    publicacions: null
  };
}
let estat = estatDelServidor();

/* Una fila de xat_fils_meus amb totes les columnes de la migració. */
const filDelServidor = () => {
  const ultim = estat.missatges.at(-1);
  return {
    id: FIL, tipus: 'directe', titol: null, imatge_url: null, actualitzat_al: ultim.creat_al,
    altres_noms: ['Veïna'], ultim_text: ultim.cos, ultim_al: ultim.creat_al, ultim_autor_id: ultim.usuari_id,
    ultim_seq: ultim.seq, llegit_fins_seq: estat.marca.llegit, rebut_fins_seq: estat.marca.rebut,
    llegit_pels_altres_fins_seq: 1, no_llegits: Math.max(0, ultim.seq - estat.marca.llegit),
    arxivat_al: null, fixat_al: null, silenciat_fins_al: null, preferit_al: null, no_llegit_manual: false,
    org_id: null, entitat_nom: null, com_entitat: false,
    altres: [{ id: VEINA, nom: 'Veïna', tipus: 'persona', avatarUrl: null }],
    comunitat_id: null, subjecte_tipus: null, subjecte_id: null, subjecte_ruta: null, subjecte_titol: null,
    subjecte_uri: null, rol: 'membre', participants: 2
  };
};

/* Els paràmetres uuid de les RPC del Xat: Postgres rebutja un text que no ho és. */
const PARAMETRES_UUID = ['p_fil_id', 'p_tenant_id', 'p_id', 'p_altre_usuari', 'p_resposta_a'];
const errorUuid = (valor) => ({
  data: null, error: { code: '22P02', message: `invalid input syntax for type uuid: "${valor}"`, details: null, hint: null }
});

const RPC_DEL_XAT = {
  xat_fils_meus: () => [filDelServidor()],
  xat_historial: ({ p_abans_de_seq: abans, p_limit: limit }) => estat.missatges
    .filter((m) => abans === null || m.seq < abans).slice(-limit).reverse(),
  xat_nous: ({ p_despres_de_seq: despres }) => estat.missatges.filter((m) => m.seq > despres),
  xat_envia: ({ p_id: id, p_text: text }) => {
    const ja = estat.missatges.find((m) => m.id === id);
    const fila = ja || missatgeDelServidor(estat.missatges.length + 1, PERSONA, text);
    if (!ja) estat.missatges.push({ ...fila, id });
    const desat = estat.missatges.find((m) => m.id === id);
    return [{ id: desat.id, seq: desat.seq, creat_al: desat.creat_al, usuari_id: PERSONA, com_org_id: null, autor_nom: desat.autor_nom }];
  },
  xat_marca: ({ p_rebut_fins: rebut, p_llegit_fins: llegit }) => {
    estat.marca.llegit = Math.max(estat.marca.llegit, llegit ?? 0);
    estat.marca.rebut = Math.max(estat.marca.rebut, rebut ?? 0, estat.marca.llegit);
    return [{ rebut_fins_seq: estat.marca.rebut, llegit_fins_seq: estat.marca.llegit }];
  },
  membres_del_poble: () => [{ usuari_id: VEINA, nom: 'Veïna', fil_id: FIL, tipus: 'persona', avatar_url: null }]
};

/* El client de supabase-js: rpc() i el canal privat. Les consultes es poden
   esperar i porten abortSignal(), com les de PostgrestBuilder. */
const consulta = (resultat) => Object.assign(Promise.resolve(resultat), { abortSignal() { return this; } });
function clientFals() {
  return {
    rpc(nom, parametres = {}) {
      const dolent = PARAMETRES_UUID.find((clau) => parametres[clau] != null && !RE_UUID.test(String(parametres[clau])));
      if (dolent) return consulta(errorUuid(parametres[dolent]));
      const respon = RPC_DEL_XAT[nom];
      if (!respon) {
        estat.rutesDesconegudes.push(`rpc ${nom}`);
        return consulta({ data: null, error: { code: 'PGRST202', message: `Could not find the function public.${nom}` } });
      }
      return consulta({ data: structuredClone(respon(parametres)), error: null });
    },
    channel(nom) {
      const canal = { nom, on() { return canal; }, subscribe(avisa) { avisa?.('SUBSCRIBED'); return canal; } };
      return canal;
    },
    async removeChannel(canal) { estat.canalsTancats.push(canal.nom); return 'ok'; }
  };
}

/* ── PostgREST i GoTrue ── */
const resposta = (cos, { status = 200, contentRange = null } = {}) => ({
  ok: status >= 200 && status < 300, status,
  headers: { get: (nom) => (nom.toLowerCase() === 'content-range' ? contentRange : null) },
  json: async () => structuredClone(cos),
  text: async () => (cos === null ? '' : JSON.stringify(cos))
});

const COLUMNES_NOTA = { subtitle: null, lead: null, copyright: '', categories: [], tags: [], hero_image: null, logo_image: null,
  is_published: false, published_submission_id: null, status: 'activa', trashed_at: null, origen: null };
const eq = (valor) => (typeof valor === 'string' && valor.startsWith('eq.') ? valor.slice(3) : null);

function rutaDeNotes(url, metode, cos) {
  const p = url.searchParams;
  if (metode === 'POST') {
    const fila = { ...COLUMNES_NOTA, ...cos, revision: 0, created_at: ARA, updated_at: ARA };
    estat.notes.set(fila.id, fila);
    return resposta([fila], { status: 201 });
  }
  const id = eq(p.get('id'));
  if (metode === 'PATCH') {
    const fila = estat.notes.get(id);
    /* La revisió vella no toca cap fila: PostgREST torna una llista buida. */
    if (!fila || String(fila.revision) !== eq(p.get('revision'))) return resposta([]);
    Object.assign(fila, cos, { revision: fila.revision + 1, updated_at: ARA });
    return resposta([fila]);
  }
  const propies = [...estat.notes.values()].filter((n) => n.tenant_id === eq(p.get('tenant_id')));
  if (p.get('select') === 'id') return resposta(propies.filter((n) => n.id === id).map((n) => ({ id: n.id })));
  const actives = propies.filter((n) => n.owner_user_id === eq(p.get('owner_user_id')) && n.status === 'activa');
  if (id) return resposta(actives.filter((n) => n.id === id).slice(0, 1));
  const pagina = actives.sort((a, b) => (a.id < b.id ? 1 : -1)).slice(0, Number(p.get('limit')));
  return resposta(pagina, { contentRange: pagina.length ? `0-${pagina.length - 1}/${actives.length}` : '*/0' });
}

const SUBMISSIO_DEL_MUR = {
  id: '5b6c7d8e-9fa0-4b1c-8d2e-3f4a5b6c7d8e', title: 'Fira de tardor', created_at: ARA, updated_at: ARA,
  owner_user_id: VEINA, author_org_id: null,
  payload: { sectionId: 'mur', type: 'feed', title: 'Fira de tardor', author_name: 'Veïna', labels: [{ text: 'Festes', className: 'sdp-badge-category' }] }
};

/* Decisió 4 del Mestre (261007) · section_submissions com PostgREST: el
   filtre de conjunt de claus (or=(created_at.lt."X",and(created_at.eq."X",
   id.lt."Y"))), l'ordre created_at.desc,id.desc, el límit i el total amb
   Prefer: count=exact. Un `or` amb una altra forma és una ruta desconeguda:
   la passada cau si l'adaptador el codifica malament. */
const TALL_DE_CLAUS = /^\(created_at\.lt\."([^"]+)",and\(created_at\.eq\."([^"]+)",id\.lt\."([^"]+)"\)\)$/;
function rutaDePublicacions(url, opcions) {
  const p = url.searchParams;
  const publicacions = estat.publicacions || { mur: [SUBMISSIO_DEL_MUR] };
  let files = [...(publicacions[eq(p.get('section_id'))] || [])];
  if (p.has('or')) {
    const tall = TALL_DE_CLAUS.exec(p.get('or'));
    if (!tall || tall[1] !== tall[2]) {
      estat.rutesDesconegudes.push(`or ${p.get('or')}`);
      return resposta({ message: 'filtre or desconegut' }, { status: 400 });
    }
    const [, instant, , id] = tall;
    files = files.filter((f) => Date.parse(f.created_at) < Date.parse(instant)
      || (Date.parse(f.created_at) === Date.parse(instant) && f.id < id));
  }
  files.sort((a, b) => (Date.parse(b.created_at) - Date.parse(a.created_at)) || (a.id < b.id ? 1 : -1));
  const pagina = files.slice(0, Number(p.get('limit')));
  const ambTotal = /count=exact/.test(opcions.headers?.Prefer || '');
  return resposta(pagina, { contentRange: ambTotal ? (pagina.length ? `0-${pagina.length - 1}/${files.length}` : '*/0') : null });
}

function fetchDelServidor(entrada, opcions = {}) {
  const url = new URL(String(entrada));
  const metode = opcions.method || 'GET';
  const cos = typeof opcions.body === 'string' ? JSON.parse(opcions.body) : undefined;
  if (url.origin !== ORIGEN) throw new TypeError('Failed to fetch');
  if (url.pathname === '/auth/v1/health') return Promise.resolve(resposta({}));
  estat.autoritzacions.add(opcions.headers?.Authorization ?? null);
  const p = url.searchParams;
  /* Onada 11 (261010; prompt 261010_1730, tasca 2) · L'API MFA de GoTrue, com
     la documenta Supabase: un factor que no existix és 404 mfa_factor_not_found
     (repte, verify i retirada). */
  const factor = /^\/auth\/v1\/factors\/([^/]+)(?:\/(challenge|verify))?$/.exec(url.pathname);
  if (factor) return Promise.resolve(resposta({ code: 404, error_code: 'mfa_factor_not_found', msg: 'Factor not found' }, { status: 404 }));
  const ruta = {
    /* Onada 11 · El compte de conformitat no té cap factor inscrit; este node
       no té el TOTP habilitat, i una inscripció es rebutja com fa GoTrue. */
    '/auth/v1/user': () => resposta({ id: PERSONA, email: 'conformitat@poble.invalid', factors: [] }),
    '/auth/v1/factors': () => resposta({ code: 422, error_code: 'mfa_totp_enroll_not_enabled', msg: 'MFA enroll is disabled for TOTP' }, { status: 422 }),
    /* Onada 11 · Les RPC del Tauler darrere de private.es_superadmin() (aal2):
       la sessió de conformitat no té el segon factor i PostgREST torna el 42501. */
    '/rest/v1/rpc/admin_desa_contingut': () => resposta({ code: '42501', details: null, hint: null, message: 'SDP-ADMIN-003: cal confirmar el segon factor (aal2).' }, { status: 403 }),
    '/rest/v1/rpc/admin_historial_contingut': () => resposta({ code: '42501', details: null, hint: null, message: 'SDP-ADMIN-003: cal confirmar el segon factor (aal2).' }, { status: 403 }),
    '/rest/v1/app_content': () => {
      const claus = /^in\.\((.*)\)$/.exec(p.get('key') || '')?.[1]?.split(',') || [];
      return resposta(claus.includes('towns')
        ? [{ key: 'towns', payload: [{ id: 'la-torre', name: 'La Torre de les Maçanes' }], version: 1 }, { key: 'agents', payload: [], version: 1 }]
        : []);
    },
    '/rest/v1/section_submissions': () => rutaDePublicacions(url, opcions),
    '/rest/v1/notes': () => rutaDeNotes(url, metode, cos),
    '/rest/v1/profiles': () => resposta(eq(p.get('id')) === PERSONA ? [{ id: PERSONA, full_name: 'Persona de conformitat', visibility: 'private' }] : []),
    '/rest/v1/rpc/list_my_organizations': () => resposta([]),
    '/rest/v1/organization_directory': () => resposta([]),
    '/rest/v1/user_platform_roles': () => resposta([])
  }[url.pathname];
  if (!ruta) {
    estat.rutesDesconegudes.push(`${metode} ${url.pathname}`);
    return Promise.resolve(resposta({ message: 'ruta desconeguda del doble' }, { status: 404 }));
  }
  return Promise.resolve(ruta());
}

const ctxRemot = contextDeConformitat({ config: CONFIG_REMOT, escriptures: true });
const resultatsRemots = new Map();

describe('conformitat del port · Supabase en mode remote (Auditoria 261007 B)', () => {
  beforeAll(() => {
    estat = estatDelServidor();
    Object.assign(servidor, { actiu: true, client: clientFals(), fetch: fetchDelServidor });
    configuraBackendSessio(CONFIG_REMOT);
    expect(desaSessio({ access_token: JWT, user: { id: PERSONA, email: 'conformitat@poble.invalid' } })).toBe(true);
  });
  afterAll(() => {
    esborraSessio({ abast: 'tot' });
    Object.assign(servidor, { actiu: false, client: null, fetch: null });
  });

  for (const [index, c] of CASOS.entries()) {
    test(`${index + 1}. ${c.titol}`, async () => {
      const resultat = await executaCas(c, adaptador, ctxRemot);
      resultatsRemots.set(index, resultat);
      expect(resultat.falles, resultat.falles.join(' · ')).toEqual([]);
      expect(resultat.estat).not.toBe('falla');
    });
  }

  test('cap cas omés: el remot té totes les capacitats i el kit ha trobat el fil real', () => {
    const omesos = CASOS.map((c, index) => [c, resultatsRemots.get(index)])
      .filter(([, resultat]) => resultat?.estat === 'omés')
      .map(([c, resultat]) => `${c.metode}: ${resultat.motiu}`);
    expect(omesos).toEqual([]);
    expect(resultatsRemots.size).toBe(CASOS.length);
    expect(ctxRemot.filId).toBe(FIL);
    expect(ctxRemot.filEscrivible).toBe(FIL);
  });

  test('el doble ha vist el que esperava: rutes conegudes, la sessió i el canal tancat', () => {
    expect(estat.rutesDesconegudes).toEqual([]);
    expect([...estat.autoritzacions]).toEqual([`Bearer ${JWT}`]);
    expect(estat.canalsTancats).toEqual([`xat:f:${FIL}`]);
    // L'enviament idempotent: un sol missatge nou, amb l'id de la persona.
    expect(estat.missatges.filter((m) => m.id === ctxRemot.idMissatge)).toHaveLength(1);
  });

  test('loadFils en remot porta les files d’ajuda a la cua, però el kit no les tria', async () => {
    const fils = await adaptador.loadFils(CONFIG_REMOT);
    expect(fils[0].id).toBe(FIL);
    expect(fils.slice(1).every((fil) => fil.perDefecte)).toBe(true);
    expect(fils.length).toBeGreaterThan(1);
  });

  test('el doble és estricte: una fila sintètica no és cap fil i el servidor la rebutja', async () => {
    const [sintetica] = (await adaptador.loadFils(CONFIG_REMOT)).filter((fil) => fil.perDefecte);
    await expect(adaptador.loadMissatges(sintetica.id, CONFIG_REMOT)).rejects.toThrow();
    await expect(adaptador.marcaLlegit(sintetica.id, { ...CONFIG_REMOT, llegitFinsSeq: 1 })).rejects.toThrow();
  });

  test('sense cap fil real, el kit omet les lectures del fil en lloc de passar-li una fila sintètica', async () => {
    const respostaOriginal = RPC_DEL_XAT.xat_fils_meus;
    RPC_DEL_XAT.xat_fils_meus = () => [];
    try {
      const buit = contextDeConformitat({ config: CONFIG_REMOT });
      const perMetode = (metode) => CASOS.find((c) => c.metode === metode);
      expect((await executaCas(perMetode('loadFils'), adaptador, buit)).estat).toBe('ok');
      expect(buit.filId).toBeNull();
      expect((await executaCas(perMetode('loadMissatges'), adaptador, buit)).estat).toBe('omés');
    } finally {
      RPC_DEL_XAT.xat_fils_meus = respostaOriginal;
    }
  });

  /* Decisió 4 del Mestre (261007) · «Carregar-ne més» de punta a punta contra
     el doble: la primera pàgina de loadMur porta el cursor del Mur, el kit
     l'accepta, i loadSeccioPage continua des d'ell fins al final sense
     repetir ni perdre cap publicació, també amb empats de created_at al tall. */
  test('Decisió 4 · loadMur porta el cursor del Mur i loadSeccioPage continua fins al final', async () => {
    const fila = (n, creat) => ({ ...SUBMISSIO_DEL_MUR, id: `6c7d8e9f-a0b1-4c2d-8e3f-${String(n).padStart(12, '0')}`,
      title: `Publicació ${n}`, created_at: creat, payload: { ...SUBMISSIO_DEL_MUR.payload, title: `Publicació ${n}` } });
    // 53 files: 30 empatades en ARA (amb el «+» del fus) i 23 més velles, també en grups empatats.
    const files = Array.from({ length: 53 }, (_, n) => fila(n, n < 30 ? ARA : `2026-10-0${1 + (n % 5)}T08:00:00.123+00:00`));
    const urls = [];
    const fetchOriginal = servidor.fetch;
    estat.publicacions = { mur: files };
    servidor.fetch = (entrada, opcions) => { urls.push(String(entrada)); return fetchOriginal(entrada, opcions); };
    try {
      const mur = await adaptador.loadMur(PERSONA, CONFIG_REMOT);
      expect(mur.feedPosts).toHaveLength(50);
      expect(Object.keys(mur.paginacio)).toEqual(['mur']);
      const loadMur = CASOS.find((c) => c.metode === 'loadMur');
      expect(await executaCas(loadMur, adaptador, { ...ctxRemot, ownerUserId: PERSONA })).toMatchObject({ estat: 'ok', falles: [] });

      const pagina = await adaptador.loadSeccioPage({ seccio: 'mur', cursor: mur.paginacio.mur }, CONFIG_REMOT);
      expect(pagina).toMatchObject({ complete: true, nextCursor: null });
      expect(pagina.elements).toHaveLength(3);
      const vistos = [...mur.feedPosts, ...pagina.elements].map((element) => element.id);
      expect(new Set(vistos).size).toBe(53);
      expect([...vistos].sort()).toEqual(files.map((f) => f.id).sort());
      // El filtre viatja codificat: cap «+» cru que PostgREST llegiria com un espai.
      const ultima = new URL(urls.at(-1));
      expect(ultima.search).not.toContain('+');
      expect(ultima.searchParams.get('or')).toMatch(/^\(created_at\.lt\."2026-10-0\dT08:00:00\.123\+00:00",and\(/);
      expect(estat.rutesDesconegudes).toEqual([]);
    } finally {
      estat.publicacions = null;
      servidor.fetch = fetchOriginal;
    }
  });
});
