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
 * entitat del padró per esta regla. Encàrrec 261018_1220 (Tasca 0, ordre del
 * Mestre: l'accés ha de carregar la identitat de la persona pilot i les seues
 * dues organitzacions) · Rentonar declara la persona pilot com a membre que
 * l'administra (`membres`, AGENTS_MAP.JAVI.id): no és cap persona inventada
 * (T63.1) i la regla de «qui té sessió» no s'estén a Rentonar.
 * És l'única manera de provar el canal compartit del xat,
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
/* Pla 261018_1605 (Tasca 0, D6 i D7; ordre del Mestre, 18-10-2026) · El
   classificador únic de fonts pròpies (hidrataPerfilPersonaPilot). */
import { esFontImatgePropia } from '../utils/sanitize.js';

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
/* Pla 261018_1605 (Tasca 0, D7; ordre del Mestre, 18-10-2026, que el va
   escriure) · El correu del compte remot de la persona pilot. Reconeix el
   compte mentre IDS_REMOTS_FUNDACIONALS no en declara l'UUID (esComptePersonaPilot). */
export const CORREU_PERSONA_PILOT = 'socdepoblecom@gmail.com';

/* Pla 261018_1605 (Tasca 0, D7) · PERSONA_PILOT és la FONT ÚNICA canònica de
   la fitxa de la persona pilot: nom, foto (avatar i avatar_url, el mateix
   valor), bio, lema, poble (POBLE_FUNDACIONAL) i capçalera (cap). La fitxa
   local (localPerfils.js), la hidratació de la remota
   (hidrataPerfilPersonaPilot) i l'alineació del servidor
   (supabase/snippets/2610181800_alinea_perfil_javi_llinares.sql) diuen el
   mateix que estos camps. */
export const PERSONA_PILOT = Object.freeze({
  id: AGENTS_MAP.JAVI.id,
  /* Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre: les rutes canòniques
     /javillinares, /socdepoble i /rentonar) · El slug declarat de la persona
     pilot és el de la seua ruta neta, 'javillinares', el mateix text que
     l'autoria del Mac Mini (marketSeed.js · author_id). Abans era 'javi', que
     continua sent un àlies: cap enllaç vell no es perd. */
  slug: 'javillinares',
  correu: CORREU_PERSONA_PILOT,
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
  avatar_url: AGENTS_MAP.JAVI.avatar_url,
  bio: AGENTS_MAP.JAVI.role,
  lema: AGENTS_MAP.JAVI.lema,
  poble: POBLE_FUNDACIONAL,
  hero_url: '',
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
  /* Cap propietària implícita (regla del mode seed): qui té sessió no
     l'administra per tindre-la, i qualsevol altra persona només hi entra
     connectant-s'hi (localPerfils · reclamaOrganitzacio). El xat de la llavor
     no veu eixa connexió: localXat només pregunta a rolALEntitat.
     Encàrrec 261018_1220 (Tasca 0, ordre del Mestre) · La persona pilot sí que
     l'administra: és un membre declarat amb l'id del padró
     (AGENTS_MAP.JAVI.id), i així el calaix «Amb qui actues?» del pilot porta
     les dues organitzacions fundacionals. */
  membres: Object.freeze([Object.freeze({ usuariId: AGENTS_MAP.JAVI.id, role: 'admin' })])
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

/* T3 (mock): la resposta fixa de la IAIA, literal del prompt del Mestre.
   Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25) · En llavor i en local, la
   IAIA primer busca a la Wiki pública del paquet (iaiaLocal.js); esta frase és
   la reserva quan no hi troba res o la Wiki no es pot carregar. */
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
 * Pla 261018_1605 (Tasca 0, D7; correcció de la revisió) · Ací NO entra el
 * correu: un DTO de perfil no porta les claus de GoTrue i saltaria la regla de
 * confirmació (correuPilotAcreditat), i cap qui crida no en necessita (la
 * fitxa pública, la ruta canònica i el poble de reserva passen {tipus, id,
 * slug}). L'usuari de sessió sencer el reconeix esComptePersonaPilot.
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

/* Pla 261018_1605 (Tasca 0, D7; ordre del Mestre, 18-10-2026) · El compte
   remot de la persona pilot. Mentre IDS_REMOTS_FUNDACIONALS no en declara cap
   UUID (el dona el Mestre), el reconeix el correu que el Mestre va escriure,
   CORREU_PERSONA_PILOT, sense distingir majúscules. Mai pel nom. */
export function esCorreuPersonaPilot(correu) {
  return typeof correu === 'string' && correu.trim().toLowerCase() === CORREU_PERSONA_PILOT;
}

/* El correu només compta si GoTrue l'ha confirmat o si hi ha una identitat
   de Google (Google ja l'ha verificat) que no en diu cap altre: una alta amb
   contrasenya i el correu de la persona pilot, sense confirmar, no ho és. I
   només el correu de primer nivell, el que escriu GoTrue: user_metadata
   l'escriu la persona (PUT /auth/v1/user).
   Revisió adversarial (18-10-2026) · Un objecte sense eixes proves (un perfil,
   un DTO, una sessió adoptada de l'amfitrió que només porta el correu) no
   s'acredita mai pel correu: si no, un altre compte amb el correu de Javi en
   rebria les dades canòniques. */
const teIdentitatGooglePilot = (usuari) => Array.isArray(usuari.identities) && usuari.identities.some((identitat) => {
  if (identitat?.provider !== 'google') return false;
  const correu = identitat.identity_data?.email ?? identitat.email;
  return correu == null || esCorreuPersonaPilot(correu);
});

function correuPilotAcreditat(objecte) {
  if (!esCorreuPersonaPilot(objecte.email)) return false;
  return Boolean(objecte.email_confirmed_at || objecte.confirmed_at) || teIdentitatGooglePilot(objecte);
}

/**
 * Pla 261018_1605 (Tasca 0, D7) · Un usuari de sessió o una fila de perfil
 * són de la persona pilot: per l'id d'un àlies seu o un id remot declarat
 * (IDS_REMOTS_FUNDACIONALS), pel slug d'un àlies seu (la fitxa de la llavor) o
 * pel correu acreditat del seu compte remot (correuPilotAcreditat). Mai pel nom.
 * `idsRemots` és per a les proves; per defecte, els declarats.
 */
export function esComptePersonaPilot(usuariOPerfil, { idsRemots = IDS_REMOTS_FUNDACIONALS } = {}) {
  if (!usuariOPerfil || typeof usuariOPerfil !== 'object') return false;
  const id = usuariOPerfil.id == null ? '' : String(usuariOPerfil.id);
  const slug = usuariOPerfil.slug == null ? '' : String(usuariOPerfil.slug);
  return Boolean((id && (PERSONA_PILOT.alies.includes(id) || esIdRemotDe(PERSONA_PILOT.slug, id, idsRemots)))
    || (slug && PERSONA_PILOT.alies.includes(slug))
    || correuPilotAcreditat(usuariOPerfil));
}

/* Els camps de text que la hidratació omple quan la fila els porta buits, amb
   el valor canònic de PERSONA_PILOT. Un canònic buit (hero_url: sense
   capçalera) no omple res. */
const CAMPS_CANONICS_PILOT = Object.freeze([
  ['full_name', PERSONA_PILOT.nom],
  ['town_name', PERSONA_PILOT.poble],
  ['bio', PERSONA_PILOT.bio],
  ['lema', PERSONA_PILOT.lema],
  ['hero_url', PERSONA_PILOT.hero_url]
]);
const ambText = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/**
 * Pla 261018_1605 (Tasca 0, D7; ordre del Mestre, 18-10-2026) · La fila de
 * perfil (o la de reserva) de la persona pilot, amb les dades canòniques de
 * PERSONA_PILOT on la fila no en porta: la mateixa fitxa en local i en remot.
 *   · Només omple buits (CAMPS_CANONICS_PILOT): una dada pròpia de la fila no
 *     es xafa mai, ni tan sols per a netejar-ne els espais.
 *   · avatar_url: la foto canònica només si la fila no en porta cap o la que
 *     porta no és pròpia (esFontImatgePropia: la de Google, p. ex.).
 *   · is_public: el de la fila; si no en porta, pública (D1).
 *   · visibility: mai. Una persona és sempre 'private' (CHECK de
 *     2609080000) i la publicació la diu is_public.
 * Si no és de la persona pilot (esComptePersonaPilot de la sessió o de la
 * fila), o la sessió és de la pilot però la fila és d'un altre compte, la
 * fila tal qual.
 */
export function hidrataPerfilPersonaPilot(fila, usuari = null) {
  if (!fila || typeof fila !== 'object') return fila;
  const perLaFila = esComptePersonaPilot(fila);
  if (!perLaFila) {
    if (!esComptePersonaPilot(usuari)) return fila;
    if (fila.id != null && usuari.id != null && String(fila.id) !== String(usuari.id)) return fila;
  }
  const hidratada = { ...fila };
  for (const [camp, canonic] of CAMPS_CANONICS_PILOT) {
    if (!ambText(fila[camp]) && canonic) hidratada[camp] = canonic;
  }
  const avatar = ambText(fila.avatar_url);
  if (!avatar || !esFontImatgePropia(avatar)) hidratada.avatar_url = PERSONA_PILOT.avatar;
  hidratada.is_public = fila.is_public ?? true;
  return hidratada;
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
 * Gauntlet 261016 (Bloc -1; ordre del Mestre: «Avatar de la persona pilot:
 * sempre la seua foto personal de perfil. TERMINANTMENT PROHIBIT que aparega
 * el logotip verd de l'entitat associat a ella») · El resolutor únic del nom
 * i de l'avatar de qui signa un element, per a totes les superfícies que el
 * pinten: la targeta del Mercat (targetaDeProducte.js), la del Mur i la d'un
 * acte (TargetaDelMur.jsx, que el passa ja resolt a EventCard: components/ no
 * llig la llavor), la barra taronja i les targetes incrustades del detall
 * (elementDeSeccio.js · paginaDElement), l'avatar redó de davant de l'H1
 * (detailSectionMeta.jsx · avatarAutorDElement) i el lector del MAS
 * (PublicacioDetall.jsx). Pur: cap React ni cap xarxa.
 *   · Si el signa la persona pilot (per id o per àlies, i sense cap entitat
 *     davant: autoriaSeed), el nom i la foto de PERSONA_PILOT, SEMPRE: també
 *     davant d'una altra foto, del logotip verd, d'un avatar que no és text o
 *     d'un nom curt ('Javi'). L'ordre diu «sempre».
 *   · Si el signa una entitat (encara que la persona autora siga la pilot) o
 *     qualsevol altra persona, els valors declarats que passa qui pinta
 *     (`declarat`), intactes: cada superfície conserva la seua reserva i el
 *     seu DOM (Llei del Píxel). Sense `declarat`, undefined.
 * Un nom no identifica mai la persona pilot (D1): un homònim amb un altre id
 * conserva el seu nom i la seua foto.
 */
export function signaturaDeQuiSigna(item, declarat = {}) {
  const autoria = autoriaSeed(item);
  if (autoria?.tipus === 'persona') return { nom: autoria.nom, avatar: autoria.avatar, personaPilot: true };
  return { nom: declarat?.nom, avatar: declarat?.avatar, personaPilot: false };
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
