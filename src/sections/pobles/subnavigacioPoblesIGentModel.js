/**
 * subnavigacioPoblesIGentModel.js — Constants multilingües i filtres purs del
 * directori de pobles i gent (separats de SubnavigacioPoblesIGent.jsx per
 * garantir puresa Fast Refresh / HMR).
 */
import { tipusDAgent } from '../../data/agentsSeed.js';
import { esAgentFicticiLegacy } from '../../data/catalegAgents.js';

export const TEXTOS_SUBNAV_POBLES_GENT = Object.freeze({
  ca: Object.freeze({
    ariaNav: 'Directori de pobles i gent',
    pobles: 'Pobles',
    perfil: 'Gent i Entitats',
    subtitolPerfil: 'Directori de persones, entitats i col·lectius d’este poble.',
    poblacio: 'Demografia',
    ariaFiltres: 'Filtra el directori per tipus',
    tots: 'Tots',
    persona: 'Persones',
    entitat: 'Entitats i Grups'
  }),
  es: Object.freeze({
    ariaNav: 'Directorio de pueblos y gente',
    pobles: 'Pueblos',
    perfil: 'Gente y Entidades',
    subtitolPerfil: 'Directorio de personas, entidades y colectivos de este pueblo.',
    poblacio: 'Demografía',
    ariaFiltres: 'Filtrar el directorio por tipo',
    tots: 'Todos',
    persona: 'Personas',
    entitat: 'Entidades y Grupos'
  }),
  en: Object.freeze({
    ariaNav: 'Towns and people directory',
    pobles: 'Towns',
    perfil: 'People & Entities',
    subtitolPerfil: 'Directory of people, entities and local groups.',
    poblacio: 'Demographics',
    ariaFiltres: 'Filter directory by type',
    tots: 'All',
    persona: 'People',
    entitat: 'Entities & Groups'
  }),
  eu: Object.freeze({
    ariaNav: 'Herrien eta jendearen direktorioa',
    pobles: 'Herriak',
    perfil: 'Jendea eta Entitateak',
    subtitolPerfil: 'Herriko pertsona, entitate eta taldeen direktorioa.',
    poblacio: 'Demografia',
    ariaFiltres: 'Iragazi direktorioa motaren arabera',
    tots: 'Denak',
    persona: 'Pertsonak',
    entitat: 'Entitateak eta Taldeak'
  }),
  gl: Object.freeze({
    ariaNav: 'Directorio de vilas e xente',
    pobles: 'Vilas',
    perfil: 'Xente e Entidades',
    subtitolPerfil: 'Directorio de persoas, entidades e colectivos desta vila.',
    poblacio: 'Demografía',
    ariaFiltres: 'Filtrar o directorio por tipo',
    tots: 'Todos',
    persona: 'Persoas',
    entitat: 'Entidades e Grupos'
  })
});

export function encapcalamentDirectoriGent(idioma = 'ca', titolTraduit = '', subtitolTraduit = '') {
  const demanada = String(idioma || 'ca').toLowerCase().split('-')[0];
  const codiIdioma = Object.hasOwn(TEXTOS_SUBNAV_POBLES_GENT, demanada) ? demanada : 'ca';
  const textos = TEXTOS_SUBNAV_POBLES_GENT[codiIdioma];
  const portaAgents = (s) => typeof s === 'string' && /\b(agents|agentes|agenteak|axentes)\b/i.test(s);
  return {
    titol: !titolTraduit || portaAgents(titolTraduit) ? textos.perfil : titolTraduit,
    subtitol: !subtitolTraduit || portaAgents(subtitolTraduit) ? textos.subtitolPerfil : subtitolTraduit
  };
}

export const ITEMS_SUBNAV = Object.freeze([
  Object.freeze({ id: 'pobles', href: '/pobles', emoji: '🏘️' }),
  Object.freeze({ id: 'perfil', href: '/perfil', emoji: '👥' }),
  Object.freeze({ id: 'poblacio', href: '/poblacio', emoji: '📊' })
]);

export const OPCIONS_FILTRE = Object.freeze([
  Object.freeze({ id: 'tots' }),
  Object.freeze({ id: 'persona' }),
  Object.freeze({ id: 'entitat' })
]);

export function esPersonatgeObsoletOIA(agent) {
  if (!agent || typeof agent !== 'object' || Array.isArray(agent)) return true;
  return esAgentFicticiLegacy(agent);
}

/** Cert si el perfil és públic i pertany al directori de persones i entitats `/perfil`. */
export function esAgentPublicDelDirectori(agent) {
  if (!agent || typeof agent !== 'object') return false;
  if (agent.publicat === false || agent.privat === true) return false;
  if (typeof agent.visibility === 'string' && agent.visibility.toLowerCase() === 'private') return false;
  if (esPersonatgeObsoletOIA(agent)) return false;
  return true;
}

/**
 * Filtra la llista del directori públic per visibilitat, excloent IA/bots/personatges
 * ficticis obsolets, i pel tipus seleccionat (`''` | `'tots'` | `'persona'` | `'entitat'`).
 */
export function filtraAgentsDelDirectori(agents = [], filtreTipus = 'tots') {
  const llista = Array.isArray(agents) ? agents.filter(esAgentPublicDelDirectori) : [];
  const filtre = !filtreTipus || filtreTipus === 'tots' ? 'tots' : filtreTipus;
  if (filtre === 'tots') return llista;
  if (filtre !== 'persona' && filtre !== 'entitat') return [];
  return llista.filter((agent) => tipusDAgent(agent) === filtre);
}
