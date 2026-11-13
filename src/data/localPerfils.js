/**
 * localPerfils.js — Perfils, organitzacions i agents IA per als modes `seed` i
 * `local` (Lògica d'Usuari, prompt 260927_1925).
 *
 * Té la mateixa forma que les files del servidor (`profiles`,
 * `list_my_organizations`, `organization_directory`) perquè els adaptadors de
 * `src/data/supabase/` hi deleguen quan `runtimeDataMode !== 'remote'`:
 *   · la fitxa de qui ha entrat naix de la sessió (nom i foto de GoTrue) i de
 *     la persona pilot d'identitatsSeed; els canvis de l'Editor Universal es
 *     queden ací mentre viu la pestanya;
 *   · les organitzacions on la persona mana són les del padró pilot;
 *   · els agents IA (la IAIA) són els que administra alguna d'eixes
 *     organitzacions, i la seua fitxa és editable pel mateix camí;
 *   · el perfil públic (T4) resol un id o un slug contra tot això i, si no,
 *     contra el catàleg d'agents. T63.1 (260928): el padró del xat ja no hi
 *     aporta fitxes pròpies. Només hi queden identitats que ja es resolen
 *     abans (Javi '0001' per la persona pilot o el catàleg, l'entitat pilot i
 *     la IAIA), i les persones inventades que en eixien s'han retirat.
 *
 * Singleton de mòdul, com localXat: cap dada de negoci a localStorage
 * (tractor-persistencia L2) i cap xarxa.
 *
 * T43 (ordre del Mestre, 260928) · Administrar organitzacions i correu de
 * l'entitat, també en memòria:
 *   · `connexions` (orgId → usuariId → { rol, desDe }): qui s'hi connecta
 *     per a administrar-la hi entra a l'instant com a 'admin' (en remot, la
 *     petició la revisa l'equip de Sóc de Poble). La regla de la llavor no
 *     canvia (D1): qui té sessió ja és propietària de l'entitat pilot.
 *   · `contactes` (orgId → { correu, public }): el correu privat de
 *     l'organització i si es mostra a la fitxa pública. Només el llig i
 *     l'escriu qui l'administra; la fitxa pública només rep el públic.
 *
 * Ordre del Mestre (261008, grup C) · El poble i els membres d'una
 * organització, amb les MATEIXES regles que les RPC de 2610081402:
 *   · `town_name` és un camp més de la fitxa de l'organització (CAMPS_ORG);
 *   · les persones membres són les `connexions` (alta directa, sense
 *     invitació, amb rol 'member' o 'admin'), i han de ser del padró local
 *     de persones (`persones`, el mateix id que torna carregaMembres);
 *   · `organitzacionsMembre` (orgId → membreOrgId → desDe): una organització
 *     membre d'una altra, que no hereta cap permís (rolDe no la llig mai) i
 *     que només afig qui administra totes dues. En local només hi ha un
 *     poble: no hi ha cap frontera de poble a comprovar.
 *   · la propietària és la de la regla de la llavor i és intocable; només
 *     ella nomena, degrada o lleva administradores; qualsevol que no siga la
 *     propietària pot eixir-se'n; la llista només la veuen owner i admin.
 *   Els errors porten els codis de MISSATGES_MEMBRES_ORGANITZACIO (contracte.js).
 *
 * T51 (regla del Mestre, 260928: cap document sense data) · Cada fitxa en
 * memòria porta `created_at` i `updated_at` com les files del servidor, amb
 * la mateixa semàntica que el `default now()` i el trigger d'UPDATE:
 *   · naixen quan el servidor local crea la fitxa: la de la persona en
 *     entrar per primera vegada; les del padró pilot (organitzacions i
 *     agents) quan naix el magatzem, que és quan comencen a existir ací;
 *   · `updated_at` es renova en cada actualització que porta algun camp del
 *     contracte (una petició sense cap camp vàlid no és cap modificació);
 *   · el perfil públic en rep `creat` i `modificat`. Les fitxes de només
 *     lectura (catàleg d'agents) no es modifiquen mai ací: porten el
 *     naixement del magatzem.
 * Cap data fixa escrita a mà: el rellotge és injectable (`ara`) per a les proves.
 *
 * IDEA-22, punt 2 (Directiva del Mestre; pla 261025_0200) · La titular que
 * ha triat mostrar-se a Connectar (capacitats 'titularPublic' i
 * 'consentimentTitular'), amb les regles de titular_public (2610250300):
 *   · només la propietària (rolDe 'owner', mai una administradora) tria, i la
 *     tria es queda en memòria (`titulars`);
 *   · una pertinença owner que declare la llavor amb `titularPublic: true`
 *     també compta, i la persona del padró ha de portar `publica: true`. A
 *     posta, CAP entitat de la llavor no ho declara: la persona pilot és de
 *     veres, i la seua tria és seua;
 *   · es mostra si la persona té la fitxa pública i sense la baixa, si
 *     l'organització és pública i si qui mira no l'ha bloquejada (la
 *     moderació local només coneix els bloquejos de qui mira). Mai cap correu
 *     ni cap rol; sense sessió, null.
 */
/* Gauntlet 261016 (Bloc 3) · `tipusDAgent`: la font única del tipus de perfil
   d'un agent del catàleg (un personatge ANIMAL és una IA). Abans n'hi havia
   una còpia ací, que el feia persona. */
import { AGENTS_MAP, tipusDAgent } from './agentsSeed.js';
import {
  AGENTS_IA_SEED, ENTITATS_SEED, PERSONA_PILOT, agentIASeed, entitatSeed, esIAIA, rolALEntitat
} from './identitatsSeed.js';
import { normalitzaCorreu, validaCorreu } from './correuOrganitzacio.js';
import { errorDeConnexions, inclusioPersonaDelContracte, sollicitudEntitatDelContracte, subjecteConnexionsDelContracte, visibilitatConnexionsDelContracte, TIPUS_TRANSFERIBLES, errorDeMembre, errorDeTitular, membreDOrganitzacio } from './contracte.js';
import { esDelPobleDelFiltre, pobleDelFiltre } from './pobleOrganitzacio.js';
import { emojiSol } from '../utils/emoji.js';
import {
  FORMA_USERNAME, MINIM_USERNAME, errorDUsername, esUsernameReservat, normalitzaUsername, primerUsernameLliure
} from '../sections/onboarding/onboardingModel.js';

const ROLS_QUE_MANEN = new Set(['owner', 'admin']);
/* T66 · `icon`: l'emoticona de la fitxa de la persona (profiles.icon). Còpia de
   la llista blanca de supabase/auth.js: totes dues han de dir el mateix. */
const CAMPS_PERFIL = ['full_name', 'avatar_url', 'visibility', 'town_name', 'bio', 'is_public', 'lema', 'presentacio_html', 'hero_url', 'hero_video_url', 'copyright', 'icon'];
/* Grup C (261008) · `town_name`: el poble de l'organització (2610081401). */
/* P1-59 (c) · Les figures públiques del directori (decisió del Mestre, xat 261031). */
const KINDS_FIGURA_PUBLICA = Object.freeze(['company', 'entity', 'city_hall']);
const CAMPS_ORG = ['name', 'slug', 'description', 'kind', 'parent_organization_id', 'lema', 'logo_url', 'visibility', 'presentacio_html', 'hero_url', 'hero_video_url', 'copyright', 'town_name'];
const CAMPS_AGENT = ['name', 'role', 'lema', 'short_bio', 'avatar_url', 'hero_url', 'hero_video_url', 'presentacio_html', 'copyright', 'town_name'];
/* Pla 261022_1955 (T1) · Les columnes d'organization_directory (2610081401), en
   el seu ordre: el directori local torna la mateixa fila que el servidor. Una
   columna que la fitxa no porta ix null, com al servidor.
   R22.1 · `hero_video_url` al final, com la vista de 20261113060000. */
const COLUMNES_DIRECTORI_LOCAL = ['id', 'slug', 'name', 'kind', 'parent_organization_id', 'lema', 'description',
  'created_at', 'updated_at', 'logo_url', 'hero_url', 'presentacio_html', 'copyright', 'town_name', 'hero_video_url'];
/* Gauntlet (crític de dades) · El filtre local pot plegar de veres (el
   servidor fa un superconjunt tolerant): minúscules, sense diacrítics ni
   punt volat, i les lligadures descompostes (NFKD). */
const plegaDelDirectori = (valor) => String(valor ?? '').normalize('NFKD').replace(/\p{M}/gu, '')
  .replace(/[\u00b7\u2027\u2219]/g, '').toLowerCase();
const COLUMNES_DIRECTORI_BUIDES = Object.freeze(Object.fromEntries(['id', 'tenant_id', ...COLUMNES_DIRECTORI_LOCAL.slice(1)]
  .map((columna) => [columna, null])));

function nomDeSessio(usuari) {
  const meta = usuari?.user_metadata || {};
  return meta.full_name || meta.name || usuari?.full_name || PERSONA_PILOT.nom;
}
/* T3 (ordre del Mestre, 261001) · Com el nom, la foto cau a la de la persona
   pilot quan la sessió no en porta: la fitxa, el perfil públic i les
   targetes que signa (identitatsSeed · autoriaSeed) llegixen el mateix valor,
   PERSONA_PILOT.avatar. Abans la fitxa naixia amb '' i la boina de la
   persona pintava la silueta mentre el Mac Mini mostrava la foto. */
function avatarDeSessio(usuari) {
  const meta = usuari?.user_metadata || {};
  return meta.avatar_url || meta.picture || usuari?.avatar_url || PERSONA_PILOT.avatar;
}
/* La persona pilot al catàleg d'agents (AGENTS_MAP.JAVI): la seua foto és la
   del padró, no el logo de l'entitat que porta el catàleg. */
const esLaPilot = (id) => PERSONA_PILOT.alies.includes(String(id ?? ''));

/* Grup C (261008) · El padró local de persones del poble: les de tipus
   'persona' del padró del xat (XAT_SEED_MEMBRES, xatSeed.js), amb el mateix id
   que torna carregaMembres. Hui només la persona pilot. No s'importa xatSeed
   (porta navigation.js): localPerfils.test.js vigila que diguen el mateix. */
export const PERSONES_SEED = Object.freeze([
  Object.freeze({ id: AGENTS_MAP.JAVI.id, nom: PERSONA_PILOT.nom, avatar: PERSONA_PILOT.avatar })
]);

/* T51 · `naixement` (ISO): el moment en què el magatzem crea les fitxes del
   padró. Una fitxa que ja porta les seues dates les conserva. */
function creaMagatzem(entitats, naixement) {
  const dates = { created_at: naixement, updated_at: naixement };
  return {
    naixement,
    perfils: new Map(),
    organitzacions: new Map(entitats.map((e) => [e.id, { ...dates, ...e, membres: undefined, alies: undefined }])),
    agents: new Map(AGENTS_IA_SEED.map((a) => [a.id, { ...dates, ...a }])),
    /* T43 · orgId → usuariId → { rol, desDe }, i orgId → { correu, public }. */
    connexions: new Map(),
    contactes: new Map(),
    /* Grup C · orgId → membreOrgId → desDe. */
    organitzacionsMembre: new Map(),
    /* IDEA-22, punt 2 · orgId → usuariId de la propietària que ha triat
       mostrar-se, o null si ha dit que no (mana sobre la marca de la llavor). */
    titulars: new Map(),
    /* P1-68 · Les proves de desaElMeuUsername: { id, al } (ms), la darrera hora. */
    preferenciesConnexions: new Map(), rolsFuncionals: new Map(), sollicitudsEntitat: new Map(),
    intentsUsername: []
  };
}

const copiaCamps = (font, camps) => Object.fromEntries(camps.filter((c) => font[c] !== undefined).map((c) => [c, font[c]]));

/* T51 · Aplica els camps del contracte i, si n'hi ha cap, renova updated_at
   (com el trigger d'UPDATE del servidor). */
function actualitza(fitxa, updates, camps, moment) {
  const canvis = copiaCamps(updates, camps);
  if (Object.keys(canvis).length) Object.assign(fitxa, canvis, { updated_at: moment });
  return fitxa;
}

/* T43 · Els errors porten el mateix `code` que l'adaptador remot, perquè la
   interfície no depenga mai del text. */
const errorAmbCodi = (missatge, code) => Object.assign(new Error(missatge), { code });

/**
 * `entitats` (opcional, per a les proves): les organitzacions del padró. Per
 * defecte, les de la llavor. Una organització que no és de la llavor no té
 * cap propietària implícita, i així es pot provar l'alta com a admin.
 * `persones` (opcional, grup C): el padró local de persones del poble que es
 * poden fer membres d'una organització. Per defecte, PERSONES_SEED.
 */
export function createLocalPerfilsAdapter({ entitats = ENTITATS_SEED, persones = PERSONES_SEED, ara = () => new Date() } = {}) {
  /* T51 · El rellotge del servidor local (injectable a les proves). */
  const moment = () => ara().toISOString();
  let estat = creaMagatzem(entitats, moment());

  const perfilDe = (usuari) => {
    if (!usuari?.id) return null;
    if (!estat.perfils.has(usuari.id)) {
      const naix = moment();
      /* Pla 261018_1605 (Tasca 0 i 1, D1 i D7; ordre del Mestre, 18-10-2026) ·
         La fitxa de qui entra és la de la persona pilot (regla del mode seed),
         amb els camps canònics de PERSONA_PILOT, la font única: el poble és
         PERSONA_PILOT.poble (POBLE_FUNDACIONAL), no cap cadena escrita ací. Naix
         pública (is_public) i 'private' de visibility, com al servidor: és
         l'única visibility que admet el CHECK de profiles (2609080000). */
      estat.perfils.set(usuari.id, {
        id: usuari.id, full_name: nomDeSessio(usuari), avatar_url: avatarDeSessio(usuari),
        visibility: 'private', is_public: true, town_name: PERSONA_PILOT.poble,
        bio: PERSONA_PILOT.bio, lema: PERSONA_PILOT.lema, presentacio_html: '', hero_url: PERSONA_PILOT.hero_url, hero_video_url: '', copyright: '',
        /* T66 · Com la columna nova del servidor: null fins que se'n tria una. */
        icon: null,
        baixa_demanada_at: null, slug: PERSONA_PILOT.slug, alies: [...PERSONA_PILOT.alies],
        /* P1-68 (2610282100) · L'identificador @usuari, com la columna del
           servidor: el de la persona pilot (PERSONA_PILOT.slug, reservat i
           seu), ja confirmat. Es canvia només per desaElMeuUsername. */
        username: PERSONA_PILOT.slug, username_confirmat_at: naix,
        created_at: naix, updated_at: naix
      });
    }
    return estat.perfils.get(usuari.id);
  };

  /* T43 · Les pertinences explícites d'una organització (orgId → usuariId →
     { rol, desDe }): les connexions de Connectar i, des del grup C, els
     membres que hi afig qui l'administra. */
  const connexionsDe = (orgId) => {
    const clau = String(orgId);
    if (!estat.connexions.has(clau)) estat.connexions.set(clau, new Map());
    return estat.connexions.get(clau);
  };
  const connexio = (orgId, usuariId) => estat.connexions.get(String(orgId))?.get(String(usuariId)) || null;

  /* T43 · El rol de la llavor mana si ja administra; si no, una connexió
     feta des de Connectar (o una alta de membre). Mai es degrada una
     propietària. Les organitzacions membres no hi compten mai: no hereten. */
  const rolDe = (orgId, usuari) => {
    const base = rolALEntitat(orgId, usuari?.id, { teSessio: Boolean(usuari?.id) });
    if (!usuari?.id) return base;
    const actual = connexio(orgId, usuari.id)?.rol;
    if (actual === 'owner') return 'owner';
    const mapa = estat.connexions.get(String(orgId));
    const propietatTransferida = mapa && [...mapa.entries()].some(([id, m]) => m?.rol === 'owner' && id !== String(usuari.id));
    if (propietatTransferida) return actual || (base === 'owner' ? 'admin' : base);
    if (ROLS_QUE_MANEN.has(base)) return base;
    return actual || base;
  };
  const orgsOnMana = (usuari) => [...estat.organitzacions.values()]
    .filter((org) => ROLS_QUE_MANEN.has(rolDe(org.id, usuari)));
  /* Per id o per slug, com el perfil públic. */
  const trobaOrg = (orgId) => {
    const clau = String(orgId ?? '').trim();
    if (!clau) return null;
    const perSlug = [...estat.organitzacions.values()].find((org) => org.slug === clau);
    return estat.organitzacions.get(clau) || perSlug || (entitatSeed(clau) ? estat.organitzacions.get(entitatSeed(clau).id) : null) || null;
  };
  const contacteDe = (orgId) => estat.contactes.get(String(orgId)) || { correu: '', public: false };
  /* Només qui administra llig o escriu el correu privat. */
  const orgQueMana = (orgId, usuari) => {
    if (!usuari?.id) throw errorAmbCodi('Cal iniciar sessió.', 'SDP-ORGMAIL-000');
    const org = trobaOrg(orgId);
    if (!org) throw errorAmbCodi('Esta organització no existix en este poble.', 'SDP-ORGMAIL-002');
    const rol = rolDe(org.id, usuari);
    if (!ROLS_QUE_MANEN.has(rol)) throw errorAmbCodi('Només qui administra l’organització pot vore o canviar el seu correu.', 'SDP-ORGMAIL-001');
    return { org, rol };
  };
  /* En la llavor no hi ha «qui la va crear»: la titular del correu per
     defecte és la propietària. El seu correu només el veu ella mateixa. */
  const contacteVist = (org, rol, usuari) => {
    const { correu, public: esPublic } = contacteDe(org.id);
    const propi = rol === 'owner' && typeof usuari?.email === 'string' && usuari.email.trim() ? usuari.email.trim() : null;
    return { correu, public: esPublic && Boolean(correu), perDefecte: { origen: 'propietaria', correu: propi } };
  };

  /* ── Grup C (261008) · Els membres d'una organització ── */
  /* Qui l'administra, o SDP-ORGMEM-002, també si no existix (com el servidor). */
  const orgQueGestiona = (orgId, usuari) => {
    const org = trobaOrg(orgId);
    if (!org || !ROLS_QUE_MANEN.has(rolDe(org.id, usuari))) throw errorDeMembre('SDP-ORGMEM-002');
    return org;
  };
  const delPadro = (id) => persones.find((p) => String(p.id) === String(id)) || null;
  const membreDePersona = (personaId, rol, desDe, usuari) => {
    const persona = usuari?.id && String(personaId) === String(usuari.id)
      ? { nom: perfilDe(usuari).full_name, avatar: perfilDe(usuari).avatar_url }
      : delPadro(personaId);
    return { tipus: 'persona', id: String(personaId), nom: persona?.nom || 'Veí/na', avatar: persona?.avatar || '', rol, desDe: desDe ?? null };
  };
  const membreDOrg = (org, desDe) => ({
    tipus: 'organitzacio', id: org.id, nom: org.name || '', avatar: org.logo_url || '', rol: 'member', desDe: desDe ?? null
  });
  const organitzacionsMembreDe = (orgId) => {
    const clau = String(orgId);
    if (!estat.organitzacionsMembre.has(clau)) estat.organitzacionsMembre.set(clau, new Map());
    return estat.organitzacionsMembre.get(clau);
  };
  /* L'ordre de membres_organitzacio: les persones primer, i per nom i id. */
  const ordenaMembres = (llista) => llista.sort((a, b) => (a.tipus === b.tipus ? 0 : a.tipus === 'persona' ? -1 : 1)
    || a.nom.localeCompare(b.nom, 'ca') || a.id.localeCompare(b.id));

  /* IDEA-22, punt 2 · La titular d'una organització: la tria de la
     propietària (si encara n'és) o, sense cap tria, la marca de la llavor. */
  const declaratsDe = (orgId) => entitats.find((entitat) => String(entitat.id) === String(orgId))?.membres || [];
  const titularDe = (org) => {
    const clau = String(org.id);
    if (estat.titulars.has(clau)) {
      const triada = estat.titulars.get(clau);
      return triada && rolDe(org.id, { id: triada }) === 'owner' ? triada : null;
    }
    const declarada = declaratsDe(org.id).find((m) => m.role === 'owner' && m.titularPublic === true);
    return declarada ? String(declarada.usuariId) : null;
  };
  /* La fitxa local de la persona (pública i sense baixa; la de qui mira naix com en entrar) o, si no
     n'hi ha, la del padró marcada `publica`. */
  const fitxaDeTitular = (personaId, usuari) => {
    const fitxa = estat.perfils.get(personaId) || (usuari?.id != null && String(usuari.id) === personaId ? perfilDe(usuari) : null);
    if (fitxa) return fitxa.is_public === true && !fitxa.baixa_demanada_at ? { id: fitxa.id, nom: fitxa.full_name, avatar: fitxa.avatar_url } : null;
    const delPadroLocal = delPadro(personaId);
    return delPadroLocal?.publica === true ? { id: delPadroLocal.id, nom: delPadroLocal.nom, avatar: delPadroLocal.avatar } : null;
  };
  /* Només la propietària llig o canvia la seua tria (SDP-TIT-001 també si l'organització no existix). */
  const orgDeLaPropietaria = (orgId, usuari) => {
    if (!usuari?.id) throw errorDeTitular('SDP-TIT-000');
    const org = trobaOrg(orgId);
    if (!org || rolDe(org.id, usuari) !== 'owner') throw errorDeTitular('SDP-TIT-001');
    return org;
  };

  const publicDePersona = (perfil, usuari) => ({
    tipus: 'persona', id: perfil.id, slug: perfil.slug || null, nom: perfil.full_name, avatar: perfil.avatar_url || '',
    hero: perfil.hero_url || '', ...(perfil.hero_video_url ? { heroVideo: perfil.hero_video_url } : null),
    lema: perfil.lema || '', bio: perfil.bio || '', presentacioHtml: perfil.presentacio_html || '',
    poble: perfil.town_name || '', esIA: false, publicat: Boolean(perfil.is_public), propietari: Boolean(usuari?.id) && perfil.id === usuari.id,
    copyright: perfil.copyright || '', creat: perfil.created_at, modificat: perfil.updated_at,
    /* T66 · L'emoticona triada, ja passada per emojiSol; '' sense tria. */
    emoticona: emojiSol(perfil.icon) || '',
    /* P1-68 · Com perfil_public: l'identificador només d'una fitxa sencera
       (la pròpia o una de publicada). */
    usuari: (perfil.is_public || (Boolean(usuari?.id) && perfil.id === usuari.id)) && perfil.username ? perfil.username : null
  });
  const publicDEntitat = (org, usuari) => ({
    tipus: org.kind === 'group' ? 'grup' : 'entitat', id: org.id, slug: org.slug || null, nom: org.name, avatar: org.logo_url || '',
    hero: org.hero_url || '', ...(org.hero_video_url ? { heroVideo: org.hero_video_url } : null),
    lema: org.lema || '', bio: org.description || '', presentacioHtml: org.presentacio_html || '',
    poble: org.town_name || '', esIA: false, publicat: org.visibility === 'public',
    propietari: ROLS_QUE_MANEN.has(rolDe(org.id, usuari)), copyright: org.copyright || '',
    /* T43 · Només el correu que l'organització ha fet públic; mai el privat. */
    correu: contacteDe(org.id).public ? contacteDe(org.id).correu : '',
    creat: org.created_at, modificat: org.updated_at,
    /* T66 · Només la persona té emoticona (deute declarat). */
    emoticona: ''
  });
  const publicDAgent = (agent, usuari) => ({
    tipus: 'ia', id: agent.id, slug: agent.slug || null, nom: agent.name, avatar: agent.avatar_url || '',
    hero: agent.hero_url || '', ...(agent.hero_video_url ? { heroVideo: agent.hero_video_url } : null),
    lema: agent.lema || '', bio: agent.role || '', presentacioHtml: agent.presentacio_html || agent.short_bio || '',
    poble: agent.town_name || '', esIA: true, publicat: true,
    propietari: Boolean(agent.owner_org_id) && ROLS_QUE_MANEN.has(rolDe(agent.owner_org_id, usuari)), copyright: agent.copyright || '',
    creat: agent.created_at, modificat: agent.updated_at, emoticona: ''
  });
  /* Gauntlet 261016 (Bloc 3) · `esIA` diu el mateix que el tipus: abans només
     ho era el type 'AI', i un personatge ANIMAL eixia com a persona. */
  const publicDelCataleg = (agent) => {
    const tipus = tipusDAgent(agent);
    return {
      tipus, id: agent.id, slug: null, nom: agent.name,
      avatar: (esLaPilot(agent.id) ? PERSONA_PILOT.avatar : agent.avatar_url) || '',
      hero: agent.hero_video_url ? (agent.hero_url || '') : '',
      ...(agent.hero_video_url ? { heroVideo: agent.hero_video_url } : null),
      lema: agent.lema || '', bio: agent.role || '', presentacioHtml: agent.short_bio || '', poble: agent.town_name || '',
      esIA: tipus === 'ia', publicat: true, propietari: false, copyright: '',
      /* T51 · Fitxa de només lectura: el naixement del magatzem. */
      creat: estat.naixement, modificat: estat.naixement, emoticona: ''
    };
  };

  /* FEDI23 · preferències pròpies i projeccions mínimes, independents de la sessió observadora. */
  const textPublic = v => typeof v === 'string' ? v : '';
  const clauConn = s => `${s.tipus}:${s.id}`;
  const identitatConn = (dades, context = {}) => {
    const subjecte = subjecteConnexionsDelContracte(dades);
    if (subjecte.tipus === 'entitat') return { ...subjecte, id: String(trobaOrg(subjecte.id)?.id ?? subjecte.id) };
    if (subjecte.tipus === 'poble') {
      const poble = [context.poble, ...(context.pobles ?? [])].find(p => p && (p.id === subjecte.id || p.slug === subjecte.id));
      return { ...subjecte, id: String(poble?.id ?? subjecte.id) };
    }
    return subjecte;
  };
  const prefsDe = subjecte => estat.preferenciesConnexions.get(clauConn(subjecte));
  const globalDe = subjecte => prefsDe(subjecte)?.visibilitatConnexions ?? 'privada';
  const visibilitatVincle = (subjecte, connexio) => prefsDe(subjecte)?.connexions.get(clauConn(connexio)) ?? 'publica';
  const esPublica = (subjecte, connexio = null) => globalDe(subjecte) === 'publica' && (!connexio || visibilitatVincle(subjecte, connexio) === 'publica');
  const controlaConnexions = (dades, context = {}) => {
    const { usuari } = context;
    if (!usuari?.id) throw errorDeConnexions('SDP-CONN-000');
    const subjecte = identitatConn(dades, context);
    const autoritzat = subjecte.tipus === 'persona' ? subjecte.id === String(usuari.id)
      : subjecte.tipus === 'entitat' ? ROLS_QUE_MANEN.has(rolDe(subjecte.id, usuari))
        : context.gestionaPoble === true && context.poble?.id === subjecte.id;
    if (!autoritzat) throw errorDeConnexions('SDP-CONN-002');
    if (subjecte.tipus === 'persona') perfilDe(usuari);
    if (subjecte.tipus === 'entitat' && !trobaOrg(subjecte.id)) throw errorDeConnexions('SDP-CONN-003');
    return subjecte;
  };
  const dtoPublic = (dades, context = {}) => {
    const subjecte = identitatConn(dades, context);
    if (subjecte.tipus === 'persona') {
      const perfil = estat.perfils.get(subjecte.id);
      const persona = delPadro(subjecte.id);
      if (perfil ? perfil.is_public !== true || Boolean(perfil.baixa_demanada_at) : persona?.publica !== true) return null;
      return { ...subjecte, nom: textPublic(perfil ? perfil.full_name : persona.nom), avatar: textPublic(perfil ? perfil.avatar_url : persona.avatar), ruta: `/gent/${encodeURIComponent(subjecte.id)}` };
    }
    if (subjecte.tipus === 'entitat') {
      const org = trobaOrg(subjecte.id);
      if (!org || org.visibility !== 'public') return null;
      return { ...subjecte, nom: textPublic(org.name), avatar: textPublic(org.logo_url), ruta: `/entitats/${encodeURIComponent(subjecte.id)}` };
    }
    return context.poble?.id === subjecte.id ? { ...subjecte, nom: textPublic(context.poble.nom), avatar: '', ruta: `/pobles/${encodeURIComponent(context.poble.slug || subjecte.id)}` } : null;
  };
  const membresPublics = (dades, context = {}, { gestio = false } = {}) => {
    const subjecte = identitatConn(dades, context);
    if (!dtoPublic(subjecte, context) || (!gestio && !esPublica(subjecte))) return [];
    if (subjecte.tipus === 'poble') {
      const candidats = [...new Set([...estat.perfils.keys(), ...persones.map(p => String(p.id))])].map(id => ({ tipus: 'persona', id }))
        .concat([...estat.organitzacions.keys()].map(id => ({ tipus: 'entitat', id: String(id) })));
      return candidats.filter(c => {
        const fitxa = c.tipus === 'persona' ? estat.perfils.get(c.id) || delPadro(c.id) : trobaOrg(c.id);
        const nomPoble = fitxa?.town_name ?? fitxa?.poble;
        return nomPoble === context.poble?.nom && esPublica(c, subjecte) && (gestio || esPublica(subjecte, c));
      }).map(c => dtoPublic(c, context)).filter(Boolean).map(c => ({ ...c, creatAl: null, direccio: 'poble',
        visibilitatConnexions: gestio ? visibilitatVincle(subjecte, c) : 'publica' }));
    }
    if (subjecte.tipus !== 'entitat') return [];
    const ids = new Set([...declaratsDe(subjecte.id).map(m => String(m.usuariId)), ...(estat.connexions.get(subjecte.id)?.keys() ?? [])]);
    const resultat = [];
    for (const id of ids) {
      const persona = { tipus: 'persona', id }, dto = dtoPublic(persona);
      const rol = connexio(subjecte.id, id)?.rol ?? declaratsDe(subjecte.id).find(m => String(m.usuariId) === id)?.role;
      if (!dto || !rol || !esPublica(persona, subjecte) || !esPublica(subjecte, persona)) continue;
      const funcional = rol === 'owner' || rol === 'admin' ? 'administrador' : estat.rolsFuncionals.get(`${subjecte.id}:${id}`) ?? 'usuari';
      resultat.push({ ...dto, creatAl: connexio(subjecte.id, id)?.desDe ?? null, direccio: 'membre', rol: funcional, visibilitatConnexions: 'publica' });
    }
    for (const [id, desDe] of estat.organitzacionsMembre.get(subjecte.id) ?? []) {
      const org = { tipus: 'entitat', id: String(id) }, dto = dtoPublic(org);
      if (dto && esPublica(org, subjecte) && esPublica(subjecte, org)) resultat.push({ ...dto, creatAl: desDe, direccio: 'membre', rol: 'usuari', visibilitatConnexions: 'publica' });
    }
    return resultat;
  };

  return {
    identitatConnexions: identitatConn,
    fitxaConnexioPublica: dtoPublic,
    connexioEsPublica(dades, vincle = null, context = {}) {
      const subjecte = identitatConn(dades, context);
      return esPublica(subjecte, vincle ? identitatConn(vincle, context) : null);
    },
    visibilitatVincleConnexions(dades, vincle) { return visibilitatVincle(identitatConn(dades), identitatConn(vincle)); },
    preferenciesConnexions(dades, context = {}) {
      const subjecte = controlaConnexions(dades, context);
      return { ...subjecte, visibilitatConnexions: globalDe(subjecte), connexions: [] };
    },
    desaVisibilitatConnexions(dades, context = {}) {
      const entrada = visibilitatConnexionsDelContracte(dades);
      const subjecte = controlaConnexions({ tipus: entrada.tipus, id: entrada.id }, context);
      const prefs = prefsDe(subjecte) ?? { visibilitatConnexions: 'privada', connexions: new Map() };
      if (entrada.connexio) {
        const clau = clauConn(identitatConn(entrada.connexio, context));
        if (!prefs.connexions.has(clau) && prefs.connexions.size >= 1000) throw errorDeConnexions('SDP-CONN-001');
        prefs.connexions.set(clau, entrada.visibilitatConnexions);
      }
      else prefs.visibilitatConnexions = entrada.visibilitatConnexions;
      estat.preferenciesConnexions.set(clauConn(subjecte), prefs);
      return { ...subjecte, visibilitatConnexions: globalDe(subjecte), connexions: [] };
    },
    vinculacionsConnexions(dades, context = {}) {
      const subjecte = controlaConnexions(dades, context), resultat = [];
      // Gestió de poble: només dades consentides de l'altra part; la tria
      // pròpia no les oculta, perquè cal poder tornar a activar el vincle.
      if (subjecte.tipus === 'poble') return membresPublics(subjecte, context, { gestio: true });
      for (const org of estat.organitzacions.values()) {
        if (subjecte.tipus === 'entitat' && String(org.id) !== subjecte.id) continue;
        if (subjecte.tipus === 'poble') continue;
        const ids = subjecte.tipus === 'persona' ? [subjecte.id]
          : [...new Set([...declaratsDe(org.id).map(m => String(m.usuariId)), ...(estat.connexions.get(String(org.id))?.keys() ?? [])])];
        for (const id of ids) {
          const membre = connexio(org.id, id), declarat = declaratsDe(org.id).find(m => String(m.usuariId) === id);
          const rol = membre?.rol ?? declarat?.role;
          if (!rol) continue;
          const altre = subjecte.tipus === 'persona' ? { tipus: 'entitat', id: String(org.id) } : { tipus: 'persona', id };
          const dto = dtoPublic(altre, context);
          if (!dto) continue;
          resultat.push({ ...dto, creatAl: membre?.desDe ?? null, direccio: 'membre',
            rol: rol === 'owner' || rol === 'admin' ? 'administrador' : estat.rolsFuncionals.get(`${org.id}:${id}`) ?? 'usuari',
            visibilitatConnexions: visibilitatVincle(subjecte, altre) });
        }
      }
      if (subjecte.tipus === 'entitat') for (const [parentId, membres] of estat.organitzacionsMembre) {
        for (const [membreId, desDe] of membres) {
          const altreId = String(parentId) === subjecte.id ? String(membreId) : String(membreId) === subjecte.id ? String(parentId) : null;
          if (!altreId) continue;
          const altre = { tipus: 'entitat', id: altreId }, dto = dtoPublic(altre, context);
          if (dto) resultat.push({ ...dto, creatAl: desDe, direccio: 'membre', rol: 'usuari', visibilitatConnexions: visibilitatVincle(subjecte, altre) });
        }
      }
      return resultat;
    },
    membresIEntitatsConnectadesDe: membresPublics,
    inclouPersonaEnEntitat(dades, context = {}) {
      const entrada = inclusioPersonaDelContracte(dades);
      const { usuari } = context;
      const desat = this.desaMembreOrganitzacio(entrada.orgId, { tipus: 'persona', id: entrada.personaId, rol: entrada.rol === 'administrador' ? 'admin' : 'member' }, usuari);
      const orgId = String(trobaOrg(entrada.orgId).id);
      estat.rolsFuncionals.set(`${orgId}:${desat.id}`, entrada.rol);
      return { orgId, personaId: desat.id, rol: entrada.rol };
    },
    solicitaUnirSeAEntitat(dades, context = {}) {
      const entrada = sollicitudEntitatDelContracte(dades), { usuari } = context;
      if (!usuari?.id) throw errorDeConnexions('SDP-CONN-000');
      const org = trobaOrg(entrada.orgId);
      if (!org || org.visibility !== 'public') throw errorDeConnexions('SDP-CONN-003');
      const clau = `${org.id}:${usuari.id}`;
      if (!estat.sollicitudsEntitat.has(clau) && [...estat.sollicitudsEntitat.values()].filter(s => s.personaId === String(usuari.id)).length >= 20) throw errorDeConnexions('SDP-CONN-001');
      estat.sollicitudsEntitat.set(clau, { orgId: String(org.id), personaId: String(usuari.id), rol: entrada.rol, estat: 'pendent' });
      return { ...estat.sollicitudsEntitat.get(clau) };
    },
    getProfile(usuari) {
      const perfil = perfilDe(usuari);
      return perfil ? { ...perfil } : null;
    },

    updateProfile(usuari, updates = {}) {
      const perfil = perfilDe(usuari);
      if (!perfil) throw new Error('Cal iniciar sessió per a desar la fitxa.');
      actualitza(perfil, updates, CAMPS_PERFIL, moment());
      return { ...perfil };
    },

    /**
     * P1-68 · desa_el_meu_usuari (2610282100) en memòria, amb les mateixes
     * regles i la mateixa resposta: la sessió (SDP-USER-000), la forma (001),
     * la baixa (004), la reserva (002, llevat del que ja té), 10 proves per
     * hora (003) i, si és d'una altra fitxa, { desat: false, motiu:
     * 'ocupat', proposta } amb el primer -N lliure (primerUsernameLliure,
     * private.usuari_lliure: 100 candidats com a molt).
     */
    desaElMeuUsername(usuari, valor) {
      if (!usuari?.id) throw errorDUsername('SDP-USER-000');
      const username = normalitzaUsername(valor);
      if (username.length < MINIM_USERNAME || !FORMA_USERNAME.test(username)) throw errorDUsername('SDP-USER-001');
      const perfil = perfilDe(usuari);
      if (perfil.baixa_demanada_at) throw errorDUsername('SDP-USER-004');
      if (esUsernameReservat(username) && username !== perfil.username) throw errorDUsername('SDP-USER-002');
      const instant = ara().getTime();
      estat.intentsUsername = estat.intentsUsername.filter((intent) => intent.id !== usuari.id || instant - intent.al < 3600000);
      if (estat.intentsUsername.filter((intent) => intent.id === usuari.id).length >= 10) throw errorDUsername('SDP-USER-003');
      estat.intentsUsername.push({ id: usuari.id, al: instant });
      const dAltri = (candidat) => [...estat.perfils.values()].some((fitxa) => fitxa.id !== usuari.id && fitxa.username === candidat);
      if (dAltri(username)) return { desat: false, motiu: 'ocupat', proposta: primerUsernameLliure(username, { ocupat: dAltri }) };
      const confirmat = moment();
      Object.assign(perfil, { username, username_confirmat_at: confirmat, updated_at: confirmat });
      return { desat: true, usuari: username, confirmat_al: confirmat };
    },

    /* R22.1 · El magatzem local ja té la columna hero_video_url (CAMPS_ORG):
       la fila la porta sempre, null sense vídeo, com list_my_organizations de
       20261113060000. Així l'editor sap que el vídeo es pot desar. */
    listMyOrganizations(usuari) {
      return orgsOnMana(usuari).map((org) => ({ hero_video_url: null, ...org, role: rolDe(org.id, usuari), tenant_id: null }));
    },

    updateOrganization(id, updates = {}) {
      const org = estat.organitzacions.get(String(id));
      if (!org) throw new Error("No s'ha pogut actualitzar l'organització.");
      actualitza(org, updates, CAMPS_ORG, moment());
      /* P1-59 (c) · Decisió del Mestre (xat 261031, RGPD) · Com el disparador
         de 2610311500 (BEFORE INSERT OR UPDATE OF kind, visibility,
         parent_organization_id): una empresa, una entitat o un ajuntament
         queda pública i sense mare només quan l'actualització toca un d'eixos
         camps. Editar la descripció o el lema no canvia la visibilitat d'una
         fila ja desada, i els grups conserven la seua tria. */
      const tocaVisibilitat = ['kind', 'visibility', 'parent_organization_id'].some((camp) => Object.hasOwn(updates || {}, camp));
      if (tocaVisibilitat && KINDS_FIGURA_PUBLICA.includes(org.kind)) {
        org.visibility = 'public';
        org.parent_organization_id = null;
      }
      return { ...org };
    },

    /**
     * Pla 261022_1955 (Cercador Universal, T1) · El directori públic, amb la
     * forma de les files d'organization_directory: només visibility 'public',
     * sense visibility, membres ni àlies, i tenant_id null (en local només hi
     * ha un poble). Per nom i id. Amb `consulta`, les que porten totes les
     * paraules al nom, al slug, al lema o a la descripció, com el filtre del
     * servidor (sense plegar accents). Sense sessió també: és públic.
     * P1-11 (pla 261024_2230, T5B-01) · Amb `poble`, només les del poble
     * amb eixe nom exacte (el filtre, retallat; el town_name desat, tal
     * qual), abans del límit, com el town_name=eq. del servidor.
     */
    listPublicOrganizations({ consulta = '', limit, poble = null } = {}) {
      const paraules = plegaDelDirectori(consulta).split(/[^\p{L}\p{N}'\u2019-]+/u).filter(Boolean);
      const conte = (org) => {
        const camps = [org.name, org.slug, org.lema, org.description].map(plegaDelDirectori);
        return paraules.every((paraula) => camps.some((camp) => camp.includes(paraula)));
      };
      const delPoble = pobleDelFiltre(poble);
      const sostre = Number.isFinite(limit) && limit >= 1 ? Math.trunc(limit) : Infinity;
      return [...estat.organitzacions.values()]
        .filter((org) => org.visibility === 'public' && conte(org) && (!delPoble || esDelPobleDelFiltre(org, delPoble)))
        .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'ca') || String(a.id).localeCompare(String(b.id)))
        .slice(0, sostre)
        .map((org) => ({ ...COLUMNES_DIRECTORI_BUIDES, ...copiaCamps(org, COLUMNES_DIRECTORI_LOCAL), tenant_id: null }));
    },

    listMyAgents(usuari) {
      const meues = new Set(orgsOnMana(usuari).map((org) => org.id));
      return [...estat.agents.values()].filter((a) => meues.has(a.owner_org_id)).map((a) => ({ hero_video_url: null, ...a, es_ia: true }));
    },

    updateAgent(id, updates = {}) {
      const agent = estat.agents.get(String(id));
      if (!agent) throw new Error("No s'ha pogut actualitzar l'agent.");
      actualitza(agent, updates, CAMPS_AGENT, moment());
      return { ...agent, es_ia: true };
    },

    /** T4 · El perfil públic d'un id o slug, o null si no hi ha ningú amb eixe nom. */
    loadPerfilPublic(idOSlug, usuari) {
      const clau = String(idOSlug ?? '').trim();
      if (!clau) return null;
      const agent = estat.agents.get(clau) || (agentIASeed(clau) ? estat.agents.get(agentIASeed(clau).id) : null);
      if (agent) return publicDAgent(agent, usuari);
      /* Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre: «un sol perfil per a
         cadascuna») · També qualsevol àlies declarat d'una entitat del padró
         (el 'soc-de-poble_official' amb què la llavor signa la samarreta): la
         mateixa fitxa que el seu id. Abans només l'id i el slug, i
         /empresa/soc-de-poble_official donava «Perfil no trobat». */
      const orgSeed = entitatSeed(clau) || entitats.find((entitat) => entitat.alies?.includes(clau)) || null;
      const org = estat.organitzacions.get(clau) || (orgSeed ? estat.organitzacions.get(orgSeed.id) : null);
      if (org) return publicDEntitat(org, usuari);
      const perfil = perfilDe(usuari);
      if (perfil && (clau === perfil.id || clau === perfil.slug || PERSONA_PILOT.alies.includes(clau))) {
        return publicDePersona(perfil, usuari);
      }
      /* T3 · Sense sessió, qualsevol àlies de la persona pilot (el
         'javillinares' de la boina del Mac Mini) és la seua fitxa del
         catàleg, com '0001': abans donava «Perfil no trobat». */
      const delCataleg = Object.values(AGENTS_MAP).find((a) => a.id === clau)
        || (esLaPilot(clau) ? AGENTS_MAP.JAVI : null);
      if (delCataleg && !esIAIA(delCataleg.id)) return publicDelCataleg(delCataleg);
      return null;
    },

    /**
     * T43 · Connectar-se a una organització per a administrar-la. En la
     * llavor no hi ha revisió: la persona hi entra a l'instant com a
     * 'admin', o se li torna el rol que ja té (idempotent).
     */
    reclamaOrganitzacio(orgId, usuari) {
      if (!usuari?.id) throw errorAmbCodi('Cal iniciar sessió per a administrar una organització.', 'SDP-CLAIM-000');
      const org = trobaOrg(orgId);
      if (!org) throw errorAmbCodi('Esta organització no existix en este poble.', 'SDP-CLAIM-001');
      const actual = rolDe(org.id, usuari);
      if (ROLS_QUE_MANEN.has(actual)) {
        return { id: null, organitzacioId: org.id, estat: 'aprovada', role: actual, data: null, jaHiEra: true };
      }
      const desDe = moment();
      connexionsDe(org.id).set(String(usuari.id), { rol: 'admin', desDe });
      return { id: null, organitzacioId: org.id, estat: 'aprovada', role: 'admin', data: desDe, jaHiEra: false };
    },

    /** Sense revisió no hi ha peticions pendents. */
    lesMevesReclamacions() {
      return [];
    },

    /** T43 · El correu de l'organització, només per a qui l'administra. */
    llegeixContacteOrganitzacio(orgId, usuari) {
      const { org, rol } = orgQueMana(orgId, usuari);
      return contacteVist(org, rol, usuari);
    },

    desaContacteOrganitzacio(orgId, dades = {}, usuari) {
      const { org, rol } = orgQueMana(orgId, usuari);
      const correu = normalitzaCorreu(dades.correu);
      if (correu && !validaCorreu(correu)) throw errorAmbCodi('Escriu un correu vàlid, com ara forn@exemple.cat.', 'CORREU-INVALID');
      estat.contactes.set(String(org.id), { correu, public: Boolean(dades.public) && Boolean(correu) });
      return contacteVist(org, rol, usuari);
    },

    /**
     * Grup C · Els membres d'una organització, només per a qui l'administra:
     * la propietària de la regla de la llavor, les persones membres i les
     * organitzacions membres (sempre 'member').
     */
    llistaMembresOrganitzacio(orgId, usuari) {
      if (!usuari?.id) throw errorDeMembre('SDP-ORGMEM-000');
      const org = orgQueGestiona(orgId, usuari);
      const llista = [];
      const connectades = estat.connexions.get(String(org.id));
      /* Ronda 2 (Kit de Gemini, D06) · Si una connexió ja porta la persona que
         mira, la seua fila ix de la connexió: cap propietària duplicada.
         Lot 5 (Codex) · rolDe, perquè després d'una transferència l'antiga
         propietària de la llavor ja no compta com a owner. */
      if (!connectades?.has(String(usuari.id)) && rolDe(org.id, usuari) === 'owner') {
        llista.push(membreDePersona(usuari.id, 'owner', estat.naixement, usuari));
      }
      /* Revisió adversarial (261018) · Els membres que declara la llavor
         (identitatsSeed · membres: la persona pilot a Rentonar) també hi són,
         llevat que una connexió de Connectar ja els porte. */
      for (const declarat of entitatSeed(org.id)?.membres || []) {
        const personaId = String(declarat.usuariId);
        if (connectades?.has(personaId) || llista.some((m) => m.tipus === 'persona' && m.id === personaId)) continue;
        llista.push(membreDePersona(personaId, declarat.role, estat.naixement, usuari));
      }
      for (const [personaId, { rol, desDe }] of estat.connexions.get(String(org.id)) || []) {
        llista.push(membreDePersona(personaId, rol, desDe, usuari));
      }
      for (const [membreId, desDe] of estat.organitzacionsMembre.get(String(org.id)) || []) {
        const membreOrg = estat.organitzacions.get(membreId);
        if (membreOrg) llista.push(membreDOrg(membreOrg, desDe));
      }
      return ordenaMembres(llista);
    },

    /**
     * Grup C · Alta directa (sense invitació) o canvi de rol, amb les regles de
     * desa_membre_organitzacio (2610081402). Idempotent: el mateix rol no és
     * cap canvi i no demana ser la propietària.
     */
    desaMembreOrganitzacio(orgId, dades = {}, usuari) {
      if (!usuari?.id) throw errorDeMembre('SDP-ORGMEM-000');
      const membre = membreDOrganitzacio(dades);
      const org = orgQueGestiona(orgId, usuari);
      if (membre.tipus === 'persona') {
        if (membre.id === String(usuari.id)) throw errorDeMembre('SDP-ORGMEM-004');
        if (!delPadro(membre.id)) throw errorDeMembre('SDP-ORGMEM-003');
        const actual = connexio(org.id, membre.id);
        /* En local cap altra persona no és propietària; la guarda és la del servidor. */
        if (actual?.rol === 'owner') throw errorDeMembre('SDP-ORGMEM-005');
        if (actual?.rol !== membre.rol) {
          if ((membre.rol === 'admin' || actual?.rol === 'admin') && rolDe(org.id, usuari) !== 'owner') {
            throw errorDeMembre('SDP-ORGMEM-006');
          }
          connexionsDe(org.id).set(membre.id, { rol: membre.rol, desDe: actual?.desDe || moment() });
        }
        const desat = connexio(org.id, membre.id);
        estat.rolsFuncionals.delete(`${org.id}:${membre.id}`);
        return membreDePersona(membre.id, desat.rol, desat.desDe, usuari);
      }
      const membreOrg = trobaOrg(membre.id);
      if (!membreOrg || membreOrg.id === org.id) throw errorDeMembre('SDP-ORGMEM-007');
      if (!ROLS_QUE_MANEN.has(rolDe(membreOrg.id, usuari))) throw errorDeMembre('SDP-ORGMEM-008');
      const delOrg = organitzacionsMembreDe(org.id);
      if (!delOrg.has(membreOrg.id)) delOrg.set(membreOrg.id, moment());
      return membreDOrg(membreOrg, delOrg.get(membreOrg.id));
    },

    /**
     * Grup C · Baixa d'un membre, o «Eixir» amb el propi id. Idempotent: qui
     * no hi és torna { llevat: false }. La propietària no se'n va ni es lleva.
     */
    llevaMembreOrganitzacio(orgId, dades = {}, usuari) {
      if (!usuari?.id) throw errorDeMembre('SDP-ORGMEM-000');
      const membre = membreDOrganitzacio(dades, { ambRol: false });
      if (membre.tipus === 'persona' && membre.id === String(usuari.id)) {
        const org = trobaOrg(orgId);
        const actual = org ? rolDe(org.id, usuari) : null;
        if (!actual) return { llevat: false };
        if (actual === 'owner') throw errorDeMembre('SDP-ORGMEM-005');
        estat.rolsFuncionals.delete(`${org.id}:${membre.id}`);
        return { llevat: estat.connexions.get(String(org.id))?.delete(membre.id) === true };
      }
      const org = orgQueGestiona(orgId, usuari);
      if (membre.tipus === 'persona') {
        const actual = connexio(org.id, membre.id);
        if (!actual) return { llevat: false };
        if (actual.rol === 'owner') throw errorDeMembre('SDP-ORGMEM-005');
        if (actual.rol === 'admin' && rolDe(org.id, usuari) !== 'owner') throw errorDeMembre('SDP-ORGMEM-006');
        estat.rolsFuncionals.delete(`${org.id}:${membre.id}`);
        return { llevat: estat.connexions.get(String(org.id)).delete(membre.id) };
      }
      const membreOrg = trobaOrg(membre.id);
      return { llevat: Boolean(membreOrg) && estat.organitzacionsMembre.get(String(org.id))?.delete(membreOrg.id) === true };
    },

    /**
     * IDEA-22, punt 2 · La titular que ha triat mostrar-se, o null sense dir
     * per què (també d'una organització que no existix). `bloquejos`: els de
     * qui mira (la moderació local).
     */
    loadTitularPublic(orgId, usuari, { bloquejos = [] } = {}) {
      if (!usuari?.id) return null;
      const org = trobaOrg(orgId);
      if (!org || org.visibility !== 'public') return null;
      const personaId = titularDe(org);
      const fitxa = personaId ? fitxaDeTitular(personaId, usuari) : null;
      if (!fitxa?.nom) return null;
      const bloquejada = (Array.isArray(bloquejos) ? bloquejos : [])
        .some((bloqueig) => bloqueig?.tipus === 'persona' && String(bloqueig.id) === String(fitxa.id));
      return bloquejada ? null : { tipus: 'persona', id: String(fitxa.id), nom: fitxa.nom, avatar: fitxa.avatar || '' };
    },

    /** IDEA-22, punt 2 · La tria de la propietària, només per a ella. */
    estatTitularPublic(orgId, usuari) {
      const org = orgDeLaPropietaria(orgId, usuari);
      return { titularPublic: titularDe(org) === String(usuari.id) };
    },

    marcaTitularPublic(orgId, titularPublic, usuari) {
      if (typeof titularPublic !== 'boolean') throw errorDeTitular('SDP-TIT-002');
      const org = orgDeLaPropietaria(orgId, usuari);
      estat.titulars.set(String(org.id), titularPublic ? String(usuari.id) : null);
      return { titularPublic };
    },

    /** IDEA-24 · Transferix la propietat ('owner') a una altra persona membre i passa l'actual a 'admin'. */
    transfereixPropietatOrganitzacio(orgId, nouOwnerId, usuari) {
      if (!usuari?.id) throw errorDeMembre('SDP-ORGMEM-000');
      const org = orgQueGestiona(orgId, usuari);
      if (rolDe(org.id, usuari) !== 'owner') throw errorDeMembre('SDP-ORGMEM-006');
      /* La mateixa llista que la RPC i la interfície (contracte.js, B4). */
      if (!TIPUS_TRANSFERIBLES.includes(org.kind)) throw errorDeMembre('SDP-ORGMEM-001');
      const destiId = String(nouOwnerId ?? '').trim();
      if (!destiId || destiId === String(usuari.id)) throw errorDeMembre('SDP-ORGMEM-004');
      const actualDesti = connexio(org.id, destiId);
      if (!actualDesti) throw errorDeMembre('SDP-ORGMEM-003');
      const mapa = estat.connexions.get(String(org.id));
      const meu = mapa.get(String(usuari.id));
      const araIso = moment();
      mapa.set(String(usuari.id), { rol: 'admin', desDe: meu?.desDe || araIso });
      mapa.set(destiId, { rol: 'owner', desDe: actualDesti.desDe || araIso });
      if (estat.titulars.get(String(org.id)) === String(usuari.id)) {
        estat.titulars.set(String(org.id), null);
      }
      return {
        organizationId: String(org.id),
        anticOwnerId: String(usuari.id),
        nouOwnerId: destiId
      };
    },

    /** Per a les proves: oblida els canvis. */
    reinicia() { estat = creaMagatzem(entitats, moment()); }
  };
}

export const localPerfils = createLocalPerfilsAdapter();
export const reiniciaLocalPerfils = () => localPerfils.reinicia();
