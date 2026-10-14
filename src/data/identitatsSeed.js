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
 * (ENTITAT_PILOT_ID). La plantilla d'alta d'appSeed ja el llig d'ací
 * (ENTITAT_PILOT_SLUG). Només va arrere la fila 'onboarding' de
 * supabase/seed.sql (línia 17), que encara porta 'soc-de-poble' com a slug i
 * com a parentSlug: ja no és cap àlies. Cap codi de src no llig eixa fila en
 * temps d'execució (appSeed.js); regenerar-la és una mutació governada que
 * queda pendent.
 *
 * Ordre del Mestre (261013; pla 261013_1930, Front 3) · Les entitats
 * fundacionals 'socdepoble' i 'rentonar' han d'estar operatives. Rentonar és
 * la segona entitat del padró (la pilot continua sent la primera): un grup
 * amb mare Sóc de Poble, el mateix text com a id i com a slug, i el nom, el
 * lema i la descripció que la plantilla d'alta d'appSeed llig d'ací.
 *
 * REGLA DEL MODE SEED: la persona que ha entrat és la persona pilot («Javi»)
 * i és propietària de l'entitat pilot («Sóc de Poble»), i de cap altra
 * entitat del padró. És l'única manera de provar el canal compartit del xat,
 * el MAS de l'entitat i la fitxa sense una base de dades. En l'app autònoma
 * no s'hi arriba: en seed i local entrar i registrar-se tornen MODE_LOCAL
 * (supabase/auth.js · exigeixModeRemot) i /registre passa el node a remote
 * si el servidor respon. Només s'assolix amb una sessió que injecta
 * l'amfitrió (identitat.js · adoptaSessioExterna) o amb la sessió simulada
 * d'una prova; sense sessió, ningú no administra cap entitat de la llavor.
 * En remot la pertinença la diu el servidor
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
/* Front 3 (261013) · La segona entitat fundacional. Com la pilot des del
   261007, l'id i el slug declarat són el mateix text. */
export const ENTITAT_RENTONAR_SLUG = 'rentonar';

export const PERSONA_PILOT = Object.freeze({
  slug: 'javi',
  nom: AGENTS_MAP.JAVI.avatarName,
  /* T3 (ordre del Mestre, 261001) · La foto del perfil de la persona pilot
     (public/assets/fotos; el paquet del connector copia public/). L'autoria
     de les targetes (autoriaSeed), la fitxa local sense foto de sessió i el
     perfil públic (localPerfils) la llegixen d'ací.
     Onada 11 (261010; prompt 261010_1730, tasca 6, D8) · AGENTS_MAP.JAVI ja
     porta la foto al catàleg d'agents (abans, el logo de l'entitat, que Pedra
     Seca §11 no admet per a una persona): la font única és el catàleg, i ací
     es llig d'allí, com el nom.
     Onada 12 (261011; ordres 261011_0130, punt 3, D-09) · Ratificat per
     Direcció Tècnica. El padró del xat (xatSeed.js · XAT_SEED_MEMBRES) i el
     padró local de persones (localPerfils.js · PERSONES_SEED) la prenen
     d'este camp: cap fitxer torna a escriure la ruta de la foto. */
  avatar: AGENTS_MAP.JAVI.avatar_url,
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
}), Object.freeze({
  /* Ordre del Mestre (261013; pla 261013_1930, Front 3) · Rentonar, el grup
     de treball de l'Associació ecologista El Rentonar. Nom, lema i
     descripció són els de la plantilla d'alta (appSeed.js ·
     ONBOARDING_SEED.group), que des d'ara els llig d'ací: una sola font. La
     mare és l'entitat pilot, com el parentSlug de la plantilla, amb la forma
     de la fila del servidor (parent_organization_id, l'id de la mare). Ni
     logotip ni poble: la llavor no se'ls inventa (la mediateca en registra un
     logotip, però el fitxer no és a public/). */
  id: ENTITAT_RENTONAR_SLUG,
  slug: ENTITAT_RENTONAR_SLUG,
  kind: 'group',
  name: 'Rentonar',
  lema: 'Natura i Patrimoni',
  description: 'Grup de treball de l’Associació ecologista El Rentonar.',
  parent_organization_id: ENTITAT_PILOT_ID,
  logo_url: '',
  hero_url: '',
  presentacio_html: '',
  copyright: '',
  visibility: 'public',
  town_name: '',
  alies: Object.freeze([ENTITAT_RENTONAR_SLUG]),
  /* Cap membre declarat i cap propietària implícita (regla del mode seed):
     ningú no l'administra fins que algú s'hi connecta (localPerfils ·
     reclamaOrganitzacio). El xat de la llavor no veu eixa connexió:
     localXat només pregunta a rolALEntitat. */
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
 * l'entitat pilot, i només d'ella (regla del mode seed, capçalera). Sense
 * sessió, ningú.
 * Front 3 (261013) · Abans la regla valia per a qualsevol entitat del padró
 * i només coincidia amb la pilot perquè n'hi havia una. Amb Rentonar al
 * padró, qui té sessió no n'és propietària: en la llavor no l'administra
 * ningú fins que algú s'hi connecta.
 */
export function rolALEntitat(orgId, usuariId, { teSessio = false } = {}) {
  const entitat = entitatSeed(orgId);
  if (!entitat || !usuariId) return null;
  const membre = entitat.membres.find((m) => m.usuariId === String(usuariId));
  if (membre) return membre.role;
  return teSessio && entitat.id === ENTITAT_PILOT_ID ? 'owner' : null;
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
