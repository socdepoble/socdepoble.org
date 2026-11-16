/**
 * perfilsDelPaquet.js — les fitxes públiques que el paquet ja porta, sense
 * React ni xarxa (P0-SEO-UNIVERSAL, ordre del Mestre del 13-11-2026).
 *
 * Mòdul pur i carregable des de Node: el criden la fitxa pública
 * (PerfilPublicSection.jsx, que el reexporta) i el prerender social del build
 * (tooling/seo/perfils-socials.mjs). Una sola resolució per als dos: el head
 * que servix Firebase i el que pinta l'app ixen de la mateixa funció.
 *
 * Les quatre primeres funcions venen de PerfilPublicSection.jsx sense cap
 * canvi al cos. ambReservaDelPaquet és la regla que portava el hook
 * (usePerfilPublic) més una guarda nova: una clau d'IA del paquet només la
 * resol una IA.
 */
import { AGENTS_MAP, tipusDAgent } from '../../data/agentsSeed.js';
import { PERSONA_PILOT, agentIASeed, entitatSeed, fundacionalDeLaClau } from '../../data/identitatsSeed.js';

/** El mateix DTO que loadPerfilPublic, però des del catàleg d'agents del paquet. */
export function perfilDelCataleg(agent) {
  if (!agent) return null;
  const tipus = tipusDAgent(agent);
  return {
    tipus, id: agent.id, slug: null, nom: agent.name, avatar: agent.avatar_url || '',
    hero: agent.hero_video_url ? (agent.hero_url || '') : '',
    ...(agent.hero_video_url ? { heroVideo: agent.hero_video_url } : null),
    lema: agent.lema || '',
    bio: agent.role || '', presentacioHtml: agent.short_bio || '', poble: agent.town_name || '', esIA: tipus === 'ia',
    publicat: true, propietari: false, copyright: '', emoticona: ''
  };
}

/**
 * Onada 11 (261010; prompt 261010_1730, tasca 6, D12) · El mateix DTO que
 * loadPerfilPublic, des del padró d'IA del paquet (AGENTS_IA_SEED,
 * identitatsSeed.js: hui, la IAIA MarIA), amb la seua presentació sencera
 * (com publicDAgent de data/localPerfils.js). Sense `creat` ni `modificat`:
 * cap data inventada (T51), i la barra taronja no pinta cap pastilla.
 * `propietari` és sempre false: fora de la llavor no hi ha cap rol que mane
 * sobre ella.
 */
export function perfilDeLaIADelPaquet(agent) {
  if (!agent) return null;
  return {
    tipus: 'ia', id: agent.id, slug: agent.slug || null, nom: agent.name, avatar: agent.avatar_url || '',
    hero: agent.hero_url || '', ...(agent.hero_video_url ? { heroVideo: agent.hero_video_url } : null),
    lema: agent.lema || '', bio: agent.role || '',
    presentacioHtml: agent.presentacio_html || agent.short_bio || '', poble: agent.town_name || '',
    esIA: true, publicat: true, propietari: false, copyright: agent.copyright || '', emoticona: '',
    /* Ordre del Mestre (261021, pla 261021_0015 §8.1) · La pastilla de data i
       hora de la barra taronja: les dates que declara la fila de l'agent
       (AGENTS_IA_SEED). Sense dates, cap pastilla (T51: cap data inventada). */
    creat: agent.created_at || undefined, modificat: agent.updated_at || undefined
  };
}

/**
 * Revisió adversarial del Gauntlet 261016 (encàrrec C; pla aprovat, Onada 1
 * punt 5: «perfilDeLaPersonaPilot com a fallback per a qualsevol àlies de la
 * persona pilot») · La fitxa de la persona pilot que el paquet ja publica: la
 * del catàleg (AGENTS_MAP.JAVI, la mateixa que localPerfils.js dona sense
 * sessió). Ningú no n'és propietari: fora de la llavor cap rol hi mana.
 */
export const perfilDeLaPersonaPilot = () => perfilDelCataleg(AGENTS_MAP.JAVI);

/**
 * Revisió adversarial del Gauntlet 261016 (encàrrec C) · La fitxa del paquet
 * d'una de les tres identitats del Mestre per la clau que es demana, o null.
 * La clau es reconeix per un identificador que declara la llavor
 * (identitatsSeed.js · fundacionalDeLaClau: id, àlies, slug declarat o id
 * remot declarat), mai pel nom ni pel slug que torne el servidor. Les dades són
 * les que el paquet ja publica: la persona pilot, la del catàleg; una entitat,
 * la del padró (ENTITATS_SEED), amb la forma del DTO de localPerfils.js. Sense
 * propietari, sense correu i sense dates (T51: cap data inventada).
 */
export function perfilFundacionalDelPaquet(clau) {
  const fundacional = fundacionalDeLaClau(clau);
  if (!fundacional) return null;
  if (fundacional === PERSONA_PILOT.slug) return perfilDeLaPersonaPilot();
  const entitat = entitatSeed(fundacional);
  if (!entitat) return null;
  return {
    tipus: entitat.kind === 'group' ? 'grup' : 'entitat', id: entitat.id, slug: entitat.slug, nom: entitat.name,
    avatar: entitat.logo_url || '', hero: entitat.hero_url || '',
    ...(entitat.hero_video_url ? { heroVideo: entitat.hero_video_url } : null),
    lema: entitat.lema || '', bio: entitat.description || '',
    presentacioHtml: entitat.presentacio_html || '', poble: entitat.town_name || '', esIA: false,
    publicat: entitat.visibility === 'public', propietari: false, copyright: entitat.copyright || '', correu: '', emoticona: ''
  };
}

/* Una fitxa d'organització del servidor: l'únic tipus que un slug pot portar
   (el tria qui la crea, i el CHECK de la taula admet la forma d'un UUID o
   'iaia-maria'). */
const esOrganitzacio = (perfil) => perfil?.tipus === 'entitat' || perfil?.tipus === 'grup';

/**
 * La fitxa que es pinta per a una clau (id o slug), donada la resposta del
 * servidor (un DTO de loadPerfilPublic o null). És la regla del hook
 * (usePerfilPublic), en un sol lloc per a l'app i per al build:
 *   · Onada 11 (D12) · Una IA del paquet (AGENTS_IA_SEED: hui, la IAIA MarIA)
 *     no viu a cap taula: si el servidor no dona res, la del paquet, pel seu id
 *     o pel seu slug declarat.
 *   · P0-SEO-UNIVERSAL (P2, segrest de targeta) · Si per a una clau d'IA del
 *     paquet el servidor torna una ORGANITZACIÓ (una empresa que ha pres el
 *     slug 'iaia-maria', o un slug amb la forma de l'id de la IAIA), mana el
 *     paquet: la fitxa i la targeta de la IAIA no són de qui registre eixe
 *     slug. Una fitxa remota que sí que és una IA (una sessió la pot rebre)
 *     continua manant.
 *   · Gauntlet 261016 (encàrrec C) · Les tres identitats del Mestre cauen al
 *     paquet quan el servidor no dona la fitxa, i una clau de la persona només
 *     la resol una PERSONA.
 * Per a tota altra clau, la resposta del servidor (també la buida) mana.
 */
export function ambReservaDelPaquet(clau, perfilDelServidor = null) {
  let perfil = perfilDelServidor || null;
  const ia = perfilDeLaIADelPaquet(agentIASeed(clau));
  if (ia && (!perfil || esOrganitzacio(perfil))) perfil = ia;
  const delPaquet = perfilFundacionalDelPaquet(clau);
  if (delPaquet && (!perfil || (delPaquet.tipus === 'persona' && perfil.tipus !== 'persona'))) perfil = delPaquet;
  /* D-R24.2-3 · La fila autoritzada conserva UUID, camps buits explícits,
     dates i permisos remots. La reserva només aporta camps absents a una
     fitxa sencera: una fitxa mínima privada no s'amplia amb dades del paquet. */
  else if (delPaquet && perfil.tipus === delPaquet.tipus && (perfil.publicat === true || perfil.propietari === true)) {
    perfil = { ...delPaquet, ...perfil };
  }
  return perfil;
}
