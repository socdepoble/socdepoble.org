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
 * Ordre del Mestre (261007) · A producció l'entitat és 'socdepoble', sense
 * guions: el slug declarat (ENTITAT_PILOT_SLUG) passa de 'soc-de-poble' a
 * 'socdepoble' i ara és el mateix text que l'id d'agentsSeed
 * (ENTITAT_PILOT_ID). La plantilla d'alta d'appSeed (i la de
 * supabase/seed.sql) encara porta 'soc-de-poble', que ja no és cap àlies:
 * una entitat creada amb ella no es reconeix com la pilot. Si l'ha de
 * reconéixer és una decisió pendent del Mestre.
 *
 * REGLA DEL MODE SEED: la persona que ha entrat és la persona pilot («Javi»)
 * i és propietària de l'entitat pilot («Sóc de Poble»). És l'única manera de
 * provar el canal compartit del xat, el MAS de l'entitat i la fitxa sense una
 * base de dades. En remot la pertinença la diu el servidor
 * (list_my_organizations) i este fitxer no mana res: només aporta la IAIA,
 * que viu al paquet i no a cap taula, i el pont per slug declarat de
 * l'entitat pilot amb el contingut que la llavor signa (aliesDeLActor, F4).
 */
import { AGENTS_MAP } from './agentsSeed.js';

/* Un sol identificador per a la IAIA: el d'agentsSeed, que és el que arriba
   al catàleg d'agents i al perfil. xatSeed l'importa d'ací. */
export const IAIA_ID = AGENTS_MAP.IAIA.id;
export const ENTITAT_PILOT_ID = AGENTS_MAP.SOCDEPOBLE.id;
export const ENTITAT_PILOT_SLUG = 'socdepoble';

export const PERSONA_PILOT = Object.freeze({
  slug: 'javi',
  nom: AGENTS_MAP.JAVI.avatarName,
  /* T3 (ordre del Mestre, 261001) · La foto del perfil de la persona pilot
     (public/assets/fotos; el paquet del connector copia public/). És l'única
     font: l'autoria de les targetes (autoriaSeed), la fitxa local sense foto
     de sessió i el perfil públic (localPerfils) la llegixen d'ací.
     AGENTS_MAP.JAVI continua portant el logo de l'entitat al catàleg
     d'agents (/perfil, la Realitat): canviar-lo no és d'esta ordre. */
  avatar: '/assets/fotos/javi-llinares-perfil-1200px.jpg',
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
  /* Identificadors amb què la llavor signa contingut de l'entitat pilot.
     Ordre del Mestre (261007) · Amb el slug declarat 'socdepoble', slug i id
     són el mateix text: el Set en deixa una sola entrada i no en perd cap si
     un dia tornen a ser distints. */
  alies: Object.freeze([...new Set(['soc-de-poble_official', ENTITAT_PILOT_SLUG, ENTITAT_PILOT_ID])]),
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
  /* Onada 10 (261010; decisió del Mestre del 261010) · «Qui és la IAIA
     MarIA?», el cos del seu perfil públic: el text del catàleg (agentsSeed.js,
     la font única), com el nom, el rol, el lema i l'avatar. Abans era buit i
     el perfil pintava la bio curta (localPerfils.js · publicDAgent). */
  presentacio_html: AGENTS_MAP.IAIA.presentacio_html,
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
 * T3 (ordre del Mestre, 261001) · Qui signa un element de la llavor, amb el
 * nom i l'avatar de la SEUA identitat: { tipus, nom, avatar }, o null.
 * L'ordre és el d'autorDe (config/navigation.js): si l'element porta
 * entitat, signa l'entitat; si no, la persona. Només es resolen les
 * identitats del padró pilot (per id o per qualsevol dels seus àlies); la
 * resta torna null i l'element conserva el que porta.
 */
export function autoriaSeed(item) {
  if (!item) return null;
  const entitatId = item.author_org_id ?? item.authorOrgId ?? item.author_entity_id ?? null;
  if (entitatId != null && String(entitatId) !== '') {
    const entitat = ENTITATS_SEED.find((e) => e.alies.includes(String(entitatId)));
    return entitat ? { tipus: 'entitat', nom: entitat.name, avatar: entitat.logo_url } : null;
  }
  const personaId = item.ownerUserId ?? item.owner_user_id ?? item.author_user_id ?? item.author_id ?? null;
  if (personaId == null || !PERSONA_PILOT.alies.includes(String(personaId))) return null;
  return { tipus: 'persona', nom: PERSONA_PILOT.nom, avatar: PERSONA_PILOT.avatar };
}

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
 * Tots els identificadors amb què un actor pot haver signat contingut:
 * · sempre, el seu id;
 * · una entitat, a més, el seu slug declarat. Ordre del Mestre (261007) ·
 *   El slug declarat de l'entitat pilot ('socdepoble') coincidix amb l'id
 *   amb què la llavor signa el seu contingut (author_entity_id de la
 *   samarreta i de l'Aplec), i pertanyALActor no mira el tipus de l'autor.
 *   Esmena de la peça dades-netes (261007) · Abans s'afegia el slug de
 *   qualsevol actor, i una persona amb l'slug de l'entitat heretava eixe
 *   contingut: la invariant de T6 («una persona amb l'slug de l'entitat no és
 *   l'entitat») quedava trencada. Una persona no signa mai per slug
 *   (IdentitatContext el deixa a null i autorDe només en llig ids): el slug
 *   només és àlies d'una entitat;
 * · una entitat del padró pilot (per id o per slug declarat), a més, els àlies
 *   amb què la llavor la signa, en QUALSEVOL mode (F4, ordre del Mestre,
 *   261004; PRD de la Marató 2230, Fase 1). La taula app_content de
 *   supabase/seed.sql signa la samarreta i l'Aplec amb 'socdepoble', i al
 *   servidor l'entitat és un uuid amb l'slug declarat ENTITAT_PILOT_SLUG.
 *   Abans (slug 'soc-de-poble') el pont era l'única via perquè el seu MAS
 *   remot els veiera; des de l'ordre del Mestre del 261007 el slug ja casa
 *   amb 'socdepoble', i el pont hi aporta els àlies que no són cap slug
 *   ('soc-de-poble_official'). És la doctrina de T6 (navigation.js): per id
 *   o slug declarat, mai pel nom;
 * · una persona, només en seed, els àlies de la persona pilot. El convidat no
 *   els hereta (sense sessió, res és seu), i en remot cap persona en rep
 *   (D1: un compte no es casa per nom amb 'javillinares').
 */
export function aliesDeLActor(actor, { dataMode = 'remote' } = {}) {
  const alies = new Set();
  if (!actor?.id) return alies;
  alies.add(String(actor.id));
  if (actor.tipus === 'entitat') {
    if (actor.slug) alies.add(String(actor.slug));
    const entitat = entitatSeed(actor.id) || entitatSeed(actor.slug);
    entitat?.alies.forEach((a) => alies.add(a));
    return alies;
  }
  if (dataMode !== 'seed') return alies;
  if (actor.tipus === 'persona' && actor.rol !== 'convidat') {
    PERSONA_PILOT.alies.forEach((a) => alies.add(a));
  }
  return alies;
}
