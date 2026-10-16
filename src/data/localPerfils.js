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
 */
/* Gauntlet 261016 (Bloc 3) · `tipusDAgent`: la font única del tipus de perfil
   d'un agent del catàleg (un personatge ANIMAL és una IA). Abans n'hi havia
   una còpia ací, que el feia persona. */
import { AGENTS_MAP, tipusDAgent } from './agentsSeed.js';
import {
  AGENTS_IA_SEED, ENTITATS_SEED, PERSONA_PILOT, agentIASeed, entitatSeed, esIAIA, rolALEntitat
} from './identitatsSeed.js';
import { normalitzaCorreu, validaCorreu } from './correuOrganitzacio.js';
import { errorDeMembre, membreDOrganitzacio } from './contracte.js';
import { emojiSol } from '../utils/emoji.js';

const ROLS_QUE_MANEN = new Set(['owner', 'admin']);
/* T66 · `icon`: l'emoticona de la fitxa de la persona (profiles.icon). Còpia de
   la llista blanca de supabase/auth.js: totes dues han de dir el mateix. */
const CAMPS_PERFIL = ['full_name', 'avatar_url', 'visibility', 'town_name', 'bio', 'is_public', 'lema', 'presentacio_html', 'hero_url', 'copyright', 'icon'];
/* Grup C (261008) · `town_name`: el poble de l'organització (2610081401). */
const CAMPS_ORG = ['name', 'slug', 'description', 'kind', 'parent_organization_id', 'lema', 'logo_url', 'visibility', 'presentacio_html', 'hero_url', 'copyright', 'town_name'];
const CAMPS_AGENT = ['name', 'role', 'lema', 'short_bio', 'avatar_url', 'hero_url', 'presentacio_html', 'copyright', 'town_name'];

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
    organitzacionsMembre: new Map()
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
      estat.perfils.set(usuari.id, {
        id: usuari.id, full_name: nomDeSessio(usuari), avatar_url: avatarDeSessio(usuari),
        visibility: 'private', is_public: false, town_name: 'La Torre de les Maçanes',
        bio: AGENTS_MAP.JAVI.role, lema: AGENTS_MAP.JAVI.lema, presentacio_html: '', hero_url: '', copyright: '',
        /* T66 · Com la columna nova del servidor: null fins que se'n tria una. */
        icon: null,
        baixa_demanada_at: null, slug: PERSONA_PILOT.slug, alies: [...PERSONA_PILOT.alies],
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
    if (ROLS_QUE_MANEN.has(base) || !usuari?.id) return base;
    return connexio(orgId, usuari.id)?.rol || base;
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

  const publicDePersona = (perfil, usuari) => ({
    tipus: 'persona', id: perfil.id, slug: perfil.slug || null, nom: perfil.full_name, avatar: perfil.avatar_url || '',
    hero: perfil.hero_url || '', lema: perfil.lema || '', bio: perfil.bio || '', presentacioHtml: perfil.presentacio_html || '',
    poble: perfil.town_name || '', esIA: false, publicat: Boolean(perfil.is_public), propietari: Boolean(usuari?.id) && perfil.id === usuari.id,
    copyright: perfil.copyright || '', creat: perfil.created_at, modificat: perfil.updated_at,
    /* T66 · L'emoticona triada, ja passada per emojiSol; '' sense tria. */
    emoticona: emojiSol(perfil.icon) || ''
  });
  const publicDEntitat = (org, usuari) => ({
    tipus: org.kind === 'group' ? 'grup' : 'entitat', id: org.id, slug: org.slug || null, nom: org.name, avatar: org.logo_url || '',
    hero: org.hero_url || '', lema: org.lema || '', bio: org.description || '', presentacioHtml: org.presentacio_html || '',
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
    hero: agent.hero_url || '', lema: agent.lema || '', bio: agent.role || '', presentacioHtml: agent.presentacio_html || agent.short_bio || '',
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
      avatar: (esLaPilot(agent.id) ? PERSONA_PILOT.avatar : agent.avatar_url) || '', hero: '',
      lema: agent.lema || '', bio: agent.role || '', presentacioHtml: agent.short_bio || '', poble: agent.town_name || '',
      esIA: tipus === 'ia', publicat: true, propietari: false, copyright: '',
      /* T51 · Fitxa de només lectura: el naixement del magatzem. */
      creat: estat.naixement, modificat: estat.naixement, emoticona: ''
    };
  };

  return {
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

    listMyOrganizations(usuari) {
      return orgsOnMana(usuari).map((org) => ({ ...org, role: rolDe(org.id, usuari), tenant_id: null }));
    },

    updateOrganization(id, updates = {}) {
      const org = estat.organitzacions.get(String(id));
      if (!org) throw new Error("No s'ha pogut actualitzar l'organització.");
      actualitza(org, updates, CAMPS_ORG, moment());
      return { ...org };
    },

    listMyAgents(usuari) {
      const meues = new Set(orgsOnMana(usuari).map((org) => org.id));
      return [...estat.agents.values()].filter((a) => meues.has(a.owner_org_id)).map((a) => ({ ...a, es_ia: true }));
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
      if (rolALEntitat(org.id, usuari.id, { teSessio: true }) === 'owner') {
        llista.push(membreDePersona(usuari.id, 'owner', estat.naixement, usuari));
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
        return { llevat: estat.connexions.get(String(org.id))?.delete(membre.id) === true };
      }
      const org = orgQueGestiona(orgId, usuari);
      if (membre.tipus === 'persona') {
        const actual = connexio(org.id, membre.id);
        if (!actual) return { llevat: false };
        if (actual.rol === 'owner') throw errorDeMembre('SDP-ORGMEM-005');
        if (actual.rol === 'admin' && rolDe(org.id, usuari) !== 'owner') throw errorDeMembre('SDP-ORGMEM-006');
        return { llevat: estat.connexions.get(String(org.id)).delete(membre.id) };
      }
      const membreOrg = trobaOrg(membre.id);
      return { llevat: Boolean(membreOrg) && estat.organitzacionsMembre.get(String(org.id))?.delete(membreOrg.id) === true };
    },

    /** Per a les proves: oblida els canvis. */
    reinicia() { estat = creaMagatzem(entitats, moment()); }
  };
}

export const localPerfils = createLocalPerfilsAdapter();
export const reiniciaLocalPerfils = () => localPerfils.reinicia();
