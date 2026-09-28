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
 *     contra el catàleg d'agents i el padró del xat.
 *
 * Singleton de mòdul, com localXat: cap dada de negoci a localStorage
 * (tractor-persistencia L2) i cap xarxa.
 *
 * T43 (ordre del Mestre, 260928) · Administrar organitzacions i correu de
 * l'entitat, també en memòria:
 *   · `connexions` (orgId::usuariId → rol): qui s'hi connecta per a
 *     administrar-la hi entra a l'instant com a 'admin' (en remot, la
 *     petició la revisa l'equip de Sóc de Poble). La regla de la llavor no
 *     canvia (D1): qui té sessió ja és propietària de l'entitat pilot.
 *   · `contactes` (orgId → { correu, public }): el correu privat de
 *     l'organització i si es mostra a la fitxa pública. Només el llig i
 *     l'escriu qui l'administra; la fitxa pública només rep el públic.
 */
import { AGENTS_MAP } from './agentsSeed.js';
import { XAT_SEED_MEMBRES } from './xatSeed.js';
import {
  AGENTS_IA_SEED, ENTITATS_SEED, PERSONA_PILOT, agentIASeed, entitatSeed, esIAIA, rolALEntitat
} from './identitatsSeed.js';
import { normalitzaCorreu, validaCorreu } from './correuOrganitzacio.js';

const ROLS_QUE_MANEN = new Set(['owner', 'admin']);
const CAMPS_PERFIL = ['full_name', 'avatar_url', 'visibility', 'town_name', 'bio', 'is_public', 'lema', 'presentacio_html', 'hero_url', 'copyright'];
const CAMPS_ORG = ['name', 'slug', 'description', 'kind', 'parent_organization_id', 'lema', 'logo_url', 'visibility', 'presentacio_html', 'hero_url', 'copyright'];
const CAMPS_AGENT = ['name', 'role', 'lema', 'short_bio', 'avatar_url', 'hero_url', 'presentacio_html', 'copyright', 'town_name'];

const TIPUS_AGENT = Object.freeze({ AI: 'ia', COMPANY: 'entitat' });
const tipusDAgent = (agent) => TIPUS_AGENT[agent?.type] || 'persona';

function nomDeSessio(usuari) {
  const meta = usuari?.user_metadata || {};
  return meta.full_name || meta.name || usuari?.full_name || PERSONA_PILOT.nom;
}
function avatarDeSessio(usuari) {
  const meta = usuari?.user_metadata || {};
  return meta.avatar_url || meta.picture || usuari?.avatar_url || '';
}

function creaMagatzem(entitats) {
  return {
    perfils: new Map(),
    organitzacions: new Map(entitats.map((e) => [e.id, { ...e, membres: undefined, alies: undefined }])),
    agents: new Map(AGENTS_IA_SEED.map((a) => [a.id, { ...a }])),
    /* T43 · orgId::usuariId → rol, i orgId → { correu, public }. */
    connexions: new Map(),
    contactes: new Map()
  };
}

const copiaCamps = (font, camps) => Object.fromEntries(camps.filter((c) => font[c] !== undefined).map((c) => [c, font[c]]));

/* T43 · Els errors porten el mateix `code` que l'adaptador remot, perquè la
   interfície no depenga mai del text. */
const errorAmbCodi = (missatge, code) => Object.assign(new Error(missatge), { code });
const clauConnexio = (orgId, usuariId) => `${String(orgId)}::${String(usuariId)}`;

/**
 * `entitats` (opcional, per a les proves): les organitzacions del padró. Per
 * defecte, les de la llavor. Una organització que no és de la llavor no té
 * cap propietària implícita, i així es pot provar l'alta com a admin.
 */
export function createLocalPerfilsAdapter({ entitats = ENTITATS_SEED } = {}) {
  let estat = creaMagatzem(entitats);

  const perfilDe = (usuari) => {
    if (!usuari?.id) return null;
    if (!estat.perfils.has(usuari.id)) {
      estat.perfils.set(usuari.id, {
        id: usuari.id, full_name: nomDeSessio(usuari), avatar_url: avatarDeSessio(usuari),
        visibility: 'private', is_public: false, town_name: 'La Torre de les Maçanes',
        bio: AGENTS_MAP.JAVI.role, lema: AGENTS_MAP.JAVI.lema, presentacio_html: '', hero_url: '', copyright: '',
        baixa_demanada_at: null, slug: PERSONA_PILOT.slug, alies: [...PERSONA_PILOT.alies]
      });
    }
    return estat.perfils.get(usuari.id);
  };

  /* T43 · El rol de la llavor mana si ja administra; si no, una connexió
     feta des de Connectar. Mai es degrada una propietària. */
  const rolDe = (orgId, usuari) => {
    const base = rolALEntitat(orgId, usuari?.id, { teSessio: Boolean(usuari?.id) });
    if (ROLS_QUE_MANEN.has(base) || !usuari?.id) return base;
    return estat.connexions.get(clauConnexio(orgId, usuari.id)) || base;
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

  const publicDePersona = (perfil, usuari) => ({
    tipus: 'persona', id: perfil.id, slug: perfil.slug || null, nom: perfil.full_name, avatar: perfil.avatar_url || '',
    hero: perfil.hero_url || '', lema: perfil.lema || '', bio: perfil.bio || '', presentacioHtml: perfil.presentacio_html || '',
    poble: perfil.town_name || '', esIA: false, publicat: Boolean(perfil.is_public), propietari: Boolean(usuari?.id) && perfil.id === usuari.id,
    copyright: perfil.copyright || ''
  });
  const publicDEntitat = (org, usuari) => ({
    tipus: org.kind === 'group' ? 'grup' : 'entitat', id: org.id, slug: org.slug || null, nom: org.name, avatar: org.logo_url || '',
    hero: org.hero_url || '', lema: org.lema || '', bio: org.description || '', presentacioHtml: org.presentacio_html || '',
    poble: org.town_name || '', esIA: false, publicat: org.visibility === 'public',
    propietari: ROLS_QUE_MANEN.has(rolDe(org.id, usuari)), copyright: org.copyright || '',
    /* T43 · Només el correu que l'organització ha fet públic; mai el privat. */
    correu: contacteDe(org.id).public ? contacteDe(org.id).correu : ''
  });
  const publicDAgent = (agent, usuari) => ({
    tipus: 'ia', id: agent.id, slug: agent.slug || null, nom: agent.name, avatar: agent.avatar_url || '',
    hero: agent.hero_url || '', lema: agent.lema || '', bio: agent.role || '', presentacioHtml: agent.presentacio_html || agent.short_bio || '',
    poble: agent.town_name || '', esIA: true, publicat: true,
    propietari: Boolean(agent.owner_org_id) && ROLS_QUE_MANEN.has(rolDe(agent.owner_org_id, usuari)), copyright: agent.copyright || ''
  });
  const publicDelCataleg = (agent) => ({
    tipus: tipusDAgent(agent), id: agent.id, slug: null, nom: agent.name, avatar: agent.avatar_url || '', hero: '',
    lema: agent.lema || '', bio: agent.role || '', presentacioHtml: agent.short_bio || '', poble: agent.town_name || '',
    esIA: agent.type === 'AI', publicat: true, propietari: false, copyright: ''
  });

  return {
    getProfile(usuari) {
      const perfil = perfilDe(usuari);
      return perfil ? { ...perfil } : null;
    },

    updateProfile(usuari, updates = {}) {
      const perfil = perfilDe(usuari);
      if (!perfil) throw new Error('Cal iniciar sessió per a desar la fitxa.');
      Object.assign(perfil, copiaCamps(updates, CAMPS_PERFIL));
      return { ...perfil };
    },

    listMyOrganizations(usuari) {
      return orgsOnMana(usuari).map((org) => ({ ...org, role: rolDe(org.id, usuari), tenant_id: null }));
    },

    updateOrganization(id, updates = {}) {
      const org = estat.organitzacions.get(String(id));
      if (!org) throw new Error("No s'ha pogut actualitzar l'organització.");
      Object.assign(org, copiaCamps(updates, CAMPS_ORG));
      return { ...org };
    },

    listMyAgents(usuari) {
      const meues = new Set(orgsOnMana(usuari).map((org) => org.id));
      return [...estat.agents.values()].filter((a) => meues.has(a.owner_org_id)).map((a) => ({ ...a, es_ia: true }));
    },

    updateAgent(id, updates = {}) {
      const agent = estat.agents.get(String(id));
      if (!agent) throw new Error("No s'ha pogut actualitzar l'agent.");
      Object.assign(agent, copiaCamps(updates, CAMPS_AGENT));
      return { ...agent, es_ia: true };
    },

    /** T4 · El perfil públic d'un id o slug, o null si no hi ha ningú amb eixe nom. */
    loadPerfilPublic(idOSlug, usuari) {
      const clau = String(idOSlug ?? '').trim();
      if (!clau) return null;
      const agent = estat.agents.get(clau) || (agentIASeed(clau) ? estat.agents.get(agentIASeed(clau).id) : null);
      if (agent) return publicDAgent(agent, usuari);
      const orgSeed = entitatSeed(clau);
      const org = estat.organitzacions.get(clau) || (orgSeed ? estat.organitzacions.get(orgSeed.id) : null);
      if (org) return publicDEntitat(org, usuari);
      const perfil = perfilDe(usuari);
      if (perfil && (clau === perfil.id || clau === perfil.slug || PERSONA_PILOT.alies.includes(clau))) {
        return publicDePersona(perfil, usuari);
      }
      const delCataleg = Object.values(AGENTS_MAP).find((a) => a.id === clau);
      if (delCataleg && !esIAIA(delCataleg.id)) return publicDelCataleg(delCataleg);
      const membre = XAT_SEED_MEMBRES.find((m) => m.usuariId === clau && m.tipus !== 'entitat' && m.tipus !== 'ia');
      if (membre) {
        return { tipus: 'persona', id: membre.usuariId, slug: null, nom: membre.nom, avatar: membre.avatarUrl || '', hero: '',
          lema: '', bio: '', presentacioHtml: '', poble: 'La Torre de les Maçanes', esIA: false, publicat: true, propietari: false, copyright: '' };
      }
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
      estat.connexions.set(clauConnexio(org.id, usuari.id), 'admin');
      return { id: null, organitzacioId: org.id, estat: 'aprovada', role: 'admin', data: new Date().toISOString(), jaHiEra: false };
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

    /** Per a les proves: oblida els canvis. */
    reinicia() { estat = creaMagatzem(entitats); }
  };
}

export const localPerfils = createLocalPerfilsAdapter();
export const reiniciaLocalPerfils = () => localPerfils.reinicia();
