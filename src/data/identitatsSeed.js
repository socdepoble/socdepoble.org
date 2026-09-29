/**
 * identitatsSeed.js — El padró pilot del mode seed: qui és qui quan no hi ha
 * servidor de dades (Lògica d'Usuari, prompt 260927_1925).
 *
 * Fins ara la llavor tenia identitats amb nom propi que no es reconeixien
 * entre elles: l'agent «Sóc de Poble» d'agentsSeed ('socdepoble'), la
 * samarreta signada per 'soc-de-poble_official' (marketSeed) i la plantilla
 * d'alta amb slug 'soc-de-poble' (appSeed); el «Javi» de l'agent 0001 i el Mac
 * Mini de 'javillinares'; i la IAIA amb dos uuid distints (agentsSeed i
 * xatSeed). Este fitxer és la taula de correspondència única. Cap altre
 * fitxer inventa identificadors nous per a estes tres identitats.
 *
 * REGLA DEL MODE SEED: la persona que ha entrat és la persona pilot («Javi»)
 * i és propietària de l'entitat pilot («Sóc de Poble»). És l'única manera de
 * provar el canal compartit del xat, el MAS de l'entitat i la fitxa sense una
 * base de dades. En remot la pertinença la diu el servidor
 * (list_my_organizations) i este fitxer no mana res: només aporta la IAIA,
 * que viu al paquet i no a cap taula.
 */
import { AGENTS_MAP } from './agentsSeed.js';

/* Un sol identificador per a la IAIA: el d'agentsSeed, que és el que arriba
   al catàleg d'agents i al perfil. xatSeed l'importa d'ací. */
export const IAIA_ID = AGENTS_MAP.IAIA.id;
export const ENTITAT_PILOT_ID = AGENTS_MAP.SOCDEPOBLE.id;
export const ENTITAT_PILOT_SLUG = 'soc-de-poble';

export const PERSONA_PILOT = Object.freeze({
  slug: 'javi',
  nom: AGENTS_MAP.JAVI.avatarName,
  /* Identificadors amb què la llavor signa contingut de la persona pilot. */
  alies: Object.freeze(['javillinares', AGENTS_MAP.JAVI.id, 'javi'])
});

export const ENTITATS_SEED = Object.freeze([Object.freeze({
  id: ENTITAT_PILOT_ID,
  slug: ENTITAT_PILOT_SLUG,
  kind: 'company',
  name: AGENTS_MAP.SOCDEPOBLE.name,
  lema: AGENTS_MAP.SOCDEPOBLE.lema,
  description: AGENTS_MAP.SOCDEPOBLE.short_bio,
  logo_url: AGENTS_MAP.SOCDEPOBLE.avatar_url,
  hero_url: '',
  presentacio_html: '',
  copyright: '',
  visibility: 'public',
  town_name: 'La Torre de les Maçanes',
  /* Identificadors amb què la llavor signa contingut de l'entitat pilot. */
  alies: Object.freeze(['soc-de-poble_official', ENTITAT_PILOT_SLUG, ENTITAT_PILOT_ID]),
  /* Membres amb rol declarat. T63.1 (decisió del Mestre, 260928): cap persona
     inventada, de manera que la llavor no en declara cap i hi mana qui té
     sessió (regla del mode seed, `rolALEntitat`). */
  membres: Object.freeze([])
})]);

export const AGENTS_IA_SEED = Object.freeze([Object.freeze({
  id: IAIA_ID,
  slug: 'iaia-maria',
  name: AGENTS_MAP.IAIA.name,
  role: AGENTS_MAP.IAIA.role,
  lema: AGENTS_MAP.IAIA.lema,
  short_bio: AGENTS_MAP.IAIA.short_bio,
  avatar_url: AGENTS_MAP.IAIA.avatar_url,
  hero_url: '',
  presentacio_html: '',
  copyright: '',
  town_name: AGENTS_MAP.IAIA.town_name,
  /* L'entitat que administra l'agent: qui hi mana pot editar-ne la fitxa. */
  owner_org_id: ENTITAT_PILOT_ID
})]);

/* T3 (mock): la resposta fixa de la IAIA, literal del prompt del Mestre. */
export const RESPOSTA_IAIA = 'Ara estic en proves, només puc respondre preguntes molt simples i no estic per a tonteries, però poc a poc aniré aprenent.';
export const BENVINGUDA_IAIA = 'Hola! Sóc la IAIA MarIA. Escriu-me el que vullgues i et diré fins on arribe.';

export const esIAIA = (id) => String(id ?? '') === IAIA_ID;
export const entitatSeed = (id) => {
  const clau = String(id ?? '');
  return ENTITATS_SEED.find((e) => e.id === clau || e.slug === clau) || null;
};
export const agentIASeed = (id) => {
  const clau = String(id ?? '');
  return AGENTS_IA_SEED.find((a) => a.id === clau || a.slug === clau) || null;
};

/**
 * Rol de `usuariId` a l'entitat `orgId` en mode seed, o null. Un membre de la
 * llavor té el rol declarat; qualsevol persona amb sessió és propietària de
 * l'entitat pilot (regla del mode seed, capçalera). Sense sessió, ningú.
 */
export function rolALEntitat(orgId, usuariId, { teSessio = false } = {}) {
  const entitat = entitatSeed(orgId);
  if (!entitat || !usuariId) return null;
  const membre = entitat.membres.find((m) => m.usuariId === String(usuariId));
  if (membre) return membre.role;
  return teSessio ? 'owner' : null;
}

/**
 * Tots els identificadors amb què un actor pot haver signat contingut. En
 * remot són l'id i l'slug; en seed s'hi afigen els àlies de la llavor. El
 * convidat no hereta els de la persona pilot: sense sessió, res és seu.
 */
export function aliesDeLActor(actor, { dataMode = 'remote' } = {}) {
  const alies = new Set();
  if (!actor?.id) return alies;
  alies.add(String(actor.id));
  if (actor.slug) alies.add(String(actor.slug));
  if (dataMode !== 'seed') return alies;
  if (actor.tipus === 'entitat') {
    const entitat = entitatSeed(actor.id) || entitatSeed(actor.slug);
    entitat?.alies.forEach((a) => alies.add(a));
  } else if (actor.tipus === 'persona' && actor.rol !== 'convidat') {
    PERSONA_PILOT.alies.forEach((a) => alies.add(a));
  }
  return alies;
}
