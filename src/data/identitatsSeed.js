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
 * (ENTITAT_PILOT_SLUG). Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre:
 * «Erradica qualsevol perfil fantasma o duplicat») · La fila 'onboarding' de
 * supabase/seed.sql (línia 17), que anava arrere i encara alçava l'entitat
 * pilot amb el slug 'soc-de-poble' (un segon «Sóc de Poble» si algú
 * l'executava), ja porta 'socdepoble' com a slug i com a parentSlug: el
 * mateix que en trau appSeed.js. Cap codi de src no llig eixa fila en temps
 * d'execució.
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
/* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «El poble és innegociable»)
   · El poble de les tres identitats del Mestre (la persona pilot, l'entitat
   pilot i Rentonar): La Torre de les Maçanes. Es llig del catàleg, la font
   única, com el nom i el lema de l'entitat pilot. */
export const POBLE_FUNDACIONAL = AGENTS_MAP.SOCDEPOBLE.town_name;

export const PERSONA_PILOT = Object.freeze({
  /* Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre: les rutes canòniques
     /javillinares, /socdepoble i /rentonar) · El slug declarat de la persona
     pilot és el de la seua ruta neta, 'javillinares', el mateix text que
     l'autoria del Mac Mini (marketSeed.js · author_id). Abans era 'javi', que
     continua sent un àlies: cap enllaç vell no es perd. */
  slug: 'javillinares',
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
  /* Identificadors amb què la llavor signa contingut de la persona pilot.
     Gauntlet 261016 (pla aprovat, Onada 1.5) · 'javi-llinares', perquè
     /gent/javi-llinares resolga la persona pilot: en llavor i en local, el
     perfil públic (localPerfils.js · loadPerfilPublic) ja resol qualsevol
     àlies, amb sessió (la seua fitxa) i sense (la del catàleg). En remot el
     servidor no resol cap persona per àlies: revisió adversarial del
     Gauntlet 261016 (encàrrec C) · la fitxa pública la pinta del paquet
     (PerfilPublicSection.jsx · perfilDeLaPersonaPilot) quan el servidor no
     la torna, una excepció a D12 que només val per a les tres identitats del
     Mestre (fundacionalDeLaClau, davall). */
  alies: Object.freeze(['javillinares', AGENTS_MAP.JAVI.id, 'javi', 'javi-llinares'])
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
  town_name: POBLE_FUNDACIONAL,
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
     de la fila del servidor (parent_organization_id, l'id de la mare). Sense
     logotip: la llavor no se l'inventa (la mediateca en registra un, però el
     fitxer no és a public/).
     Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «El Rentonar no pot
     aparèixer mai sense poble») · El poble, el de les tres identitats del
     Mestre (POBLE_FUNDACIONAL). Abans era '' i la fitxa i la barra taronja
     el pintaven sense poble. */
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
  town_name: POBLE_FUNDACIONAL,
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

/* Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre: «Tria i deixa un sol perfil
   per a cadascuna») · Les tres identitats que controla el Mestre, pel slug
   declarat de cadascuna: la persona pilot, l'entitat pilot i Rentonar. Cada
   una té UNA fitxa, i qualsevol dels seus àlies porta a eixa fitxa. */
export const CLAUS_FUNDACIONALS = Object.freeze([PERSONA_PILOT.slug, ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG]);

/* Revisió adversarial del Gauntlet 261016 (encàrrec C; troballes
   «clauFundacional reconeix per UUID una organització d'un altre poble» i
   «només pel slug») · Els ids del SERVIDOR que el Mestre declara per a
   cadascuna de les tres identitats, per la seua clau fundacional. En remot
   l'id d'una organització o d'una persona és un UUID que la llavor no pot
   saber, i el slug no prova res: només és únic dins d'un poble i el tria qui
   crea l'organització (un altre poble del node, o un veí que el prenga abans
   que el Mestre). Mentre no se'n declara cap, cap fitxa del servidor no es
   reconeix com una de les tres: ni URL canònica ni poble de reserva. Per a
   declarar-ne un, el seu UUID a la llista de la seua identitat. */
export const IDS_REMOTS_FUNDACIONALS = Object.freeze({
  [PERSONA_PILOT.slug]: Object.freeze([]),
  [ENTITAT_PILOT_SLUG]: Object.freeze([]),
  [ENTITAT_RENTONAR_SLUG]: Object.freeze([])
});

/* El tipus de perfil públic (PerfilPublic.tipus) de cada `kind` del padró. */
const TIPUS_DE_KIND = Object.freeze({ company: 'entitat', group: 'grup' });

/* Un UUID del servidor es compara en minúscules: PostgreSQL els torna així i
   una ruta els pot portar en majúscules. */
const esIdRemotDe = (clau, id, idsRemots) => Boolean(id)
  && (idsRemots?.[clau] || []).some((declarat) => String(declarat).toLowerCase() === String(id).toLowerCase());

/**
 * Revisió adversarial del Gauntlet 261016 (encàrrec C) · Quina de les tres
 * identitats del Mestre nomena la clau que es DEMANA (l'identificador d'una
 * ruta: /javillinares, /gent/0001, /grup/rentonar…): la seua clau fundacional,
 * o null. Només per un identificador que declara la llavor (l'id, un àlies o
 * el slug declarat) o per un id remot declarat (IDS_REMOTS_FUNDACIONALS); mai
 * pel nom. És el que fa servir la fitxa pública per a la reserva del paquet
 * quan el servidor no en torna la fitxa (PerfilPublicSection.jsx).
 * `idsRemots` és per a les proves; per defecte, els declarats.
 */
export function fundacionalDeLaClau(clau, { idsRemots = IDS_REMOTS_FUNDACIONALS } = {}) {
  const text = String(clau ?? '').trim();
  if (!text) return null;
  if (PERSONA_PILOT.alies.includes(text) || esIdRemotDe(PERSONA_PILOT.slug, text, idsRemots)) return PERSONA_PILOT.slug;
  const entitat = ENTITATS_SEED.find((e) => e.id === text || e.slug === text || e.alies.includes(text)
    || esIdRemotDe(e.slug, text, idsRemots));
  return entitat ? entitat.slug : null;
}

/**
 * Gauntlet 261016 (Bloc 3.5.1) · Quina de les tres identitats del Mestre és
 * un perfil públic ({ tipus, id, slug }, el DTO de loadPerfilPublic): el seu
 * slug declarat (un de CLAUS_FUNDACIONALS), o null. Mai pel nom (la doctrina
 * de T6, config/navigation.js), i amb el tipus que toca.
 * Revisió adversarial del Gauntlet 261016 (encàrrec C) · Estricta: només per
 * identificadors que declara la llavor. Abans una entitat també es reconeixia
 * pel slug que torna el servidor, i un grup «rentonar» d'un altre poble obert
 * pel seu UUID (que l'adaptador no limita al poble actiu) o una empresa que
 * prenia el slug «socdepoble» rebien la URL canònica i el poble del Mestre.
 *   · una entitat del padró, pel seu id o un àlies seu (en llavor) o per un
 *     id remot declarat (IDS_REMOTS_FUNDACIONALS); el slug de la fila no hi
 *     compta;
 *   · la persona pilot, per l'id d'un dels seus àlies o un id remot declarat,
 *     o pel slug de la seua fitxa en llavor amb sessió: este slug només el posa
 *     la llavor (localPerfils.js); el DTO remot (supabase/perfils.js ·
 *     perfilDePersona) no en porta mai cap. Si un dia el servidor en dona,
 *     esta branca s'ha de revisar.
 * Un grup, una persona o una IA amb l'id d'una altra identitat no ho és.
 * `idsRemots` és per a les proves; per defecte, els declarats.
 */
export function clauFundacional(perfil, { idsRemots = IDS_REMOTS_FUNDACIONALS } = {}) {
  if (!perfil) return null;
  const id = perfil.id == null ? '' : String(perfil.id);
  const slug = perfil.slug == null ? '' : String(perfil.slug);
  if (perfil.tipus === 'persona') {
    const declarada = (id && (PERSONA_PILOT.alies.includes(id) || esIdRemotDe(PERSONA_PILOT.slug, id, idsRemots)))
      || (slug && PERSONA_PILOT.alies.includes(slug));
    return declarada ? PERSONA_PILOT.slug : null;
  }
  if (!id) return null;
  const entitat = ENTITATS_SEED.find((e) => TIPUS_DE_KIND[e.kind] === perfil.tipus
    && (e.id === id || e.alies.includes(id) || esIdRemotDe(e.slug, id, idsRemots)));
  return entitat ? entitat.slug : null;
}

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
