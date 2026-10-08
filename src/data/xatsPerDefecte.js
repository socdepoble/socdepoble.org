/**
 * xatsPerDefecte.js — Ordre del Mestre (261007) · Els xats d'ajuda per
 * defecte: «Sóc de Poble» i la «IAIA MarIA» són a la llista de converses de
 * TOTA persona, també el primer dia, quan encara no ha parlat amb ningú.
 *
 * Per què: en mode seed la llavor (xatSeed.js) ja porta eixos fils, però en
 * remot els primers beta testers no tenien amb qui parlar. El Mestre ha triat
 * que no hi haja cap disparador al servidor: és el mateix frontend qui
 * sintetitza les dues files quan falten, i les retira quan arriba la
 * conversa real.
 *
 * Una fila sintètica (Conversa.perDefecte, contracte.js) NO és cap fil:
 *   · el seu id porta el prefix 'sdp-per-defecte:', que no és cap UUID: cap
 *     RPC del xat no l'accepta i ningú no l'hi ha de passar mai;
 *   · no té missatges, ni marques, ni participants (`altres` buit: «Contactes
 *     freqüents» no l'oferix);
 *   · instant 0 i sense fixar: va a la CUA de la llista, darrere de tota
 *     conversa amb activitat, en l'ordre d'AJUDA;
 *   · obrir-la és la via que diu la seua clau (sections/xat/
 *     useObriXatPerDefecte.js), mai obriFil.
 *
 * Model B: este mòdul és NEUTRE i pur. No sap res de React, de la xarxa ni
 * de cap proveïdor; només coneix el padró pilot (identitatsSeed.js), el
 * catàleg d'agents (agentsSeed.js) i la llista tancada de pàgines amb xat
 * (contracte.js). L'adaptador de Supabase el crida; un altre backend pot fer
 * igual o no fer-ho.
 */
import { AGENTS_MAP } from './agentsSeed.js';
import { PAGINES_AMB_XAT } from './contracte.js';
import { AGENTS_IA_SEED, ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, esIAIA } from './identitatsSeed.js';

/** El prefix dels ids sintètics: mai cap id de fil del servidor. */
export const PREFIX_PER_DEFECTE = 'sdp-per-defecte:';

/**
 * Ordre del Mestre (261007) · La font ÚNICA dels dos contactes d'ajuda: la
 * llista del xat (les files per defecte), «Nova conversa» (contactesAjuda.js)
 * i el xat de mostra sense sessió (FakeChatOnboarding.jsx). L'avatar de Sóc
 * de Poble és el logo quadrat que el Mestre ha fixat a foc
 * ('/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'): el del compte de la
 * marca, el mateix de la llavor. El de la IAIA, el del padró, que en remot
 * n'és l'única identitat perquè viu al paquet.
 */
export const AJUDA = Object.freeze([
  Object.freeze({ clau: 'socdepoble', nom: AGENTS_MAP.SOCDEPOBLE.name, tipus: 'entitat', avatar: AGENTS_MAP.SOCDEPOBLE.avatar_url }),
  Object.freeze({ clau: 'iaia', nom: AGENTS_MAP.IAIA.name, tipus: 'ia', avatar: AGENTS_IA_SEED[0].avatar_url })
]);

/** Els mateixos contactes, per clau ('socdepoble' | 'iaia'). */
export const AJUDA_PER_CLAU = Object.freeze(Object.fromEntries(AJUDA.map((contacte) => [contacte.clau, contacte])));

/* Les claus del xat públic de la pàgina de la IAIA: '/iaia' és la de
   PAGINES_AMB_XAT (contracte.js); '/ia' és la clau antiga de la llista del
   servidor (2609282100_xat_de_pagina.sql), que 2610042330_xat_pagina_iaia.sql
   reanomena a '/iaia'. Un fil amb qualsevol de les dues és el mateix xat.
   Auditoria 261007 (B) · La clau es valida contra la llista TANCADA del
   contracte (contracte.js no importa res: cap cicle, i este mòdul continua
   pur): si el contracte la retira, cap fil no hi casa, com a subjecteDeXat. */
const PAGINA_DE_LA_IAIA = '/iaia';
const PAGINES_DE_LA_IAIA = new Set(Object.hasOwn(PAGINES_AMB_XAT, PAGINA_DE_LA_IAIA) ? [PAGINA_DE_LA_IAIA, '/ia'] : []);

const idDe = (identitat) => String(identitat?.usuari_id ?? identitat?.usuariId ?? identitat?.id ?? '');
const altresDe = (conversa) => (Array.isArray(conversa?.altres) ? conversa.altres : []);

/** Cert si `id` és el d'una fila sintètica. */
export const esIdPerDefecte = (id) => typeof id === 'string' && id.startsWith(PREFIX_PER_DEFECTE);

/**
 * Cert si `identitat` (un dels `altres` d'una conversa o una fila del padró:
 * { id | usuari_id | usuariId, tipus, slug? }) és el contacte d'ajuda `clau`.
 * Per id o per slug declarat, mai pel nom (doctrina de T6, navigation.js).
 */
export function esLaIdentitatDAjuda(identitat, clau) {
  if (!identitat) return false;
  if (clau === 'socdepoble') {
    return identitat.tipus === 'entitat' && (identitat.slug === ENTITAT_PILOT_SLUG || idDe(identitat) === ENTITAT_PILOT_ID);
  }
  /* Auditoria 261007 (B) · La regla única de qui és la IAIA (identitatsSeed.js). */
  if (clau === 'iaia') return esIAIA(idDe(identitat));
  return false;
}

/**
 * Cert si `conversa` (una Conversa del port o un Fil de la interfície) és ja
 * el xat real del contacte d'ajuda `clau`:
 *   · 'socdepoble' · el missatge directe amb l'entitat pilot: sense subjecte
 *     (la COMUNITAT de l'entitat, els seus Avisos i el seu General porten el
 *     subjecte de la seua pàgina i no compten), amb l'entitat entre els altres
 *     (per slug o per id) o com a entitat del fil;
 *   · 'iaia' · el fil de la llavor (tipus 'iaia'), un fil amb la IAIA entre
 *     els altres, o el xat públic de la seua pàgina (subjecte 'pagina' '/iaia'
 *     o '/ia'), que és on porta la fila en remot.
 * Una fila sintètica no és mai el xat real de res.
 */
export function jaTeElXat(conversa, clau) {
  if (!conversa || conversa.perDefecte) return false;
  if (clau === 'socdepoble') {
    if (conversa.subjecte) return false;
    return String(conversa.entitatId ?? '') === ENTITAT_PILOT_ID
      || altresDe(conversa).some((altre) => esLaIdentitatDAjuda(altre, 'socdepoble'));
  }
  if (clau === 'iaia') {
    const subjecte = conversa.subjecte;
    return conversa.tipus === 'iaia'
      || altresDe(conversa).some((altre) => esLaIdentitatDAjuda(altre, 'iaia'))
      || (subjecte?.tipus === 'pagina' && PAGINES_DE_LA_IAIA.has(String(subjecte.id)));
  }
  return false;
}

/* La Conversa sintètica, amb les claus exactes del mapejaFil de l'adaptador
   (supabase/xat.js) més `perDefecte`. Sense rol, participants ni participant:
   no és cap fil del servidor. Instant 0 (cap data): a la cua. */
function conversaPerDefecte({ clau, nom, avatar }) {
  return {
    id: `${PREFIX_PER_DEFECTE}${clau}`,
    tipus: 'directe',
    titol: nom,
    altresNoms: [],
    altres: [],
    entitatId: null,
    entitatNom: null,
    comEntitat: false,
    imatgeUrl: avatar,
    actualitzatAl: null,
    ultimText: null,
    ultimAl: null,
    ultimAutorId: null,
    ultimSeq: 0,
    llegitFinsSeq: 0,
    rebutFinsSeq: 0,
    llegitPelsAltresFinsSeq: 0,
    noLlegits: 0,
    arxivatAl: null,
    fixatAl: null,
    silenciatFinsAl: null,
    preferitAl: null,
    noLlegitManual: false,
    comunitatId: null,
    subjecte: null,
    perDefecte: clau
  };
}

/**
 * Les converses amb els xats d'ajuda que falten, a la CUA (Sóc de Poble i
 * després la IAIA). Idempotent:
 *   · lleva la fila sintètica d'un contacte que ja té la conversa real;
 *   · si `afig` (per defecte), afig la que falta; amb `afig: false` només
 *     lleva (el context del xat, quan s'hi sumen els fils que llegixes com a
 *     visitant: el xat públic de /iaia retira la fila de la IAIA);
 *   · torna la MATEIXA referència si no canvia res.
 * Pura: no muta res.
 */
export function ambXatsPerDefecte(converses, { afig = true } = {}) {
  const llista = Array.isArray(converses) ? converses : [];
  const reals = llista.filter((conversa) => !conversa?.perDefecte);
  const cua = [];
  for (const contacte of AJUDA) {
    if (reals.some((conversa) => jaTeElXat(conversa, contacte.clau))) continue;
    const present = llista.find((conversa) => conversa?.perDefecte === contacte.clau);
    if (present) cua.push(present);
    else if (afig) cua.push(conversaPerDefecte(contacte));
  }
  const resultat = cua.length ? [...reals, ...cua] : reals;
  const igual = resultat.length === llista.length && resultat.every((conversa, i) => conversa === llista[i]);
  return igual && Array.isArray(converses) ? converses : resultat;
}

/** Les converses sense la fila sintètica `clau`; la mateixa referència si no n'hi havia cap. */
export function senseXatPerDefecte(converses, clau) {
  if (!Array.isArray(converses) || !converses.some((conversa) => conversa?.perDefecte === clau)) return converses;
  return converses.filter((conversa) => conversa?.perDefecte !== clau);
}

/* Els rols que manen en una entitat: els de ROLS_QUE_SIGNEN
   (IdentitatContext.jsx), que este mòdul neutre no importa.
   Auditoria 261007 (B) · No s'importa: IdentitatContext.jsx porta React, el
   port (backendPort) i el magatzem de configuració, i este mòdul el crida
   l'adaptador de Supabase i ha de seguir pur. La còpia es queda fins que la
   llista viva en un mòdul neutre de src/data que importen tots dos. */
const ROLS_QUE_GESTIONEN = new Set(['owner', 'admin']);

/**
 * Cert si, entre les identitats de la sessió (useIdentitat().identitats:
 * { tipus, id, slug, rol }), n'hi ha una que gestiona l'entitat pilot
 * (propietària o administradora). Qui hi parla en nom de Sóc de Poble no
 * pot obrir-se un xat amb ella mateixa (SDP-XAT-002): no ha de vore la fila.
 */
export function gestionaLEntitatPilot(identitats) {
  return Array.isArray(identitats) && identitats.some((identitat) => identitat?.tipus === 'entitat'
    && ROLS_QUE_GESTIONEN.has(identitat.rol)
    && (identitat.slug === ENTITAT_PILOT_SLUG || String(identitat.id ?? '') === ENTITAT_PILOT_ID));
}
