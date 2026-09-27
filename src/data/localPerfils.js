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
 */
import { AGENTS_MAP } from './agentsSeed.js';
import { XAT_SEED_MEMBRES } from './xatSeed.js';
import {
  AGENTS_IA_SEED, ENTITATS_SEED, PERSONA_PILOT, agentIASeed, entitatSeed, esIAIA, rolALEntitat
} from './identitatsSeed.js';

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

function creaMagatzem() {
  return {
    perfils: new Map(),
    organitzacions: new Map(ENTITATS_SEED.map((e) => [e.id, { ...e, membres: undefined, alies: undefined }])),
    agents: new Map(AGENTS_IA_SEED.map((a) => [a.id, { ...a }]))
  };
}

const copiaCamps = (font, camps) => Object.fromEntries(camps.filter((c) => font[c] !== undefined).map((c) => [c, font[c]]));

export function createLocalPerfilsAdapter() {
  let estat = creaMagatzem();

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

  const rolDe = (orgId, usuari) => rolALEntitat(orgId, usuari?.id, { teSessio: Boolean(usuari?.id) });
  const orgsOnMana = (usuari) => [...estat.organitzacions.values()]
    .filter((org) => ROLS_QUE_MANEN.has(rolDe(org.id, usuari)));

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
    propietari: ROLS_QUE_MANEN.has(rolDe(org.id, usuari)), copyright: org.copyright || ''
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

    /** Per a les proves: oblida els canvis. */
    reinicia() { estat = creaMagatzem(); }
  };
}

export const localPerfils = createLocalPerfilsAdapter();
export const reiniciaLocalPerfils = () => localPerfils.reinicia();
