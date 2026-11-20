/* ═══════════════════════════════════════════════════════════════════
   Ordre del Mestre (261008, grup C) · ELS MEMBRES D'UNA ORGANITZACIÓ (model)

   Pur: sense React ni xarxa. GestioMembres en pinta el resultat. Les regles
   de veres les fan complir el servidor (2610081402) i localPerfils; ací
   només es decidix QUÈ s'oferix, perquè la interfície no prometa res que el
   contracte rebutjaria (contracte.js, capacitat 'membresOrganitzacio'):
     · la propietària no es canvia ni es lleva (005);
     · ningú canvia el seu propi rol (004): eixir és l'ajust «Eixir»;
     · només la propietària nomena, degrada o lleva administradores (006);
     · una organització membre sempre és 'member' i no hereta cap permís.
   ═══════════════════════════════════════════════════════════════════ */
import { esRolQueMana } from '../../components/universal/identitat/rols.js';
/* IDEA-24 (marató 261101_2143, B4) · Els tipus que es poden transferir: una sola llista, la del contracte i la RPC. */
import { TIPUS_TRANSFERIBLES } from '../../data/contracte.js';

/** Les lletres mínimes per a cercar candidats (persones o organitzacions). */
export const MINIM_CERCA = 2;

/* La cerca de candidats espera que la persona pare d'escriure. */
export const ESPERA_CERCA = 300;

/* T5a · P1-22 (assalt 261101) · Els textos de la gestió, en parells [clau
   i18n, reserva] com TEXTOS_PRIVACITAT: cada reserva és el text de sempre,
   lletra per lletra, i el valor valencià del diccionari. Frases senceres amb
   buits d'omple() ({nom}, {org}, {n}, {consulta}), mai trossos cosits. */
const textMembres = (nom, reserva) => Object.freeze([`section.perfil.membres.${nom}`, reserva]);
export const TEXTOS_MEMBRES = Object.freeze({
  errorLlista: textMembres('errorLlista', 'No s’ha pogut llegir la llista de membres.'),
  errorCerca: textMembres('errorCerca', 'No s’ha pogut cercar a la gent del municipi.'),
  opcioEscriu: textMembres('opcio.escriu', 'Primer escriu un nom…'),
  opcioCercant: textMembres('opcio.cercant', 'Cercant…'),
  opcioTria: textMembres('opcio.tria', 'Tria un resultat…'),
  opcioCap: textMembres('opcio.cap', 'Cap resultat'),
  senseNom: textMembres('senseNom', 'Sense nom'),
  afegit: textMembres('afegit', '{nom} ja és membre de {org}.'),
  errorAfegeix: textMembres('errorAfegeix', 'No s’ha pogut afegir el membre.'),
  ascendit: textMembres('ascendit', '{nom} ja administra {org}.'),
  descendit: textMembres('descendit', '{nom} ja no administra {org}.'),
  errorRol: textMembres('errorRol', 'No s’ha pogut canviar el rol.'),
  llevat: textMembres('llevat', '{nom} ja no és membre de {org}.'),
  errorLleva: textMembres('errorLleva', 'No s’ha pogut llevar el membre.'),
  carregant: textMembres('carregant', 'Carregant els membres…'),
  taula: textMembres('taula', 'Membres de {org}'),
  colMembre: textMembres('col.membre', 'Membre'),
  colTipus: textMembres('col.tipus', 'Tipus'),
  colRol: textMembres('col.rol', 'Rol'),
  colAccions: textMembres('col.accions', 'Accions'),
  tu: textMembres('tu', '(tu)'),
  nomenaAdmin: textMembres('nomenaAdmin', 'Nomenar administradora'),
  tornaMembre: textMembres('tornaMembre', 'Tornar a membre'),
  lleva: textMembres('lleva', 'Llevar'),
  buit: textMembres('buit', 'Encara no hi ha cap membre.'),
  afegirLlegenda: textMembres('afegirLlegenda', 'Afegir un membre'),
  cercaAjuda: textMembres('cercaAjuda', 'Persones del municipi o organitzacions que també administres. Escriu almenys {n} lletres.'),
  quiAfegir: textMembres('quiAfegir', 'Qui vols afegir'),
  afegir: textMembres('afegir', 'Afegir'),
  dialegTitol: textMembres('dialegTitol', 'Llevar {nom} de {org}?'),
  dialegTitolSenseNom: textMembres('dialegTitolSenseNom', 'Llevar este membre de {org}?'),
  dialegTitolBuit: textMembres('dialegTitolBuit', 'Llevar un membre'),
  dialegDescripcio: textMembres('dialegDescripcio', 'Deixarà de ser-ne membre. Es pot tornar a afegir quan calga.'),
  /* P1-15 · El recompte de la cerca, per al lector de pantalla (el selector canvia en silenci). */
  anunciResultats: textMembres('anunciResultats', '{n} resultats per a «{consulta}».'),
  anunciUnResultat: textMembres('anunciUnResultat', 'Un resultat per a «{consulta}».'),
  anunciCapResultat: textMembres('anunciCapResultat', 'Cap resultat per a «{consulta}».'),
  /* IDEA-24 (marató 261101_2143, B4) · Transferir la propietat. */
  transfereix: textMembres('transfereix', 'Transferir la propietat'),
  transferit: textMembres('transferit', '{nom} ja és la propietària de {org}. Tu continues com a administradora.'),
  errorTransfereix: textMembres('errorTransfereix', 'No s’ha pogut transferir la propietat.'),
  dialegTransfereixTitol: textMembres('dialegTransfereixTitol', 'Transferir la propietat de {org} a {nom}?'),
  dialegTransfereixTitolBuit: textMembres('dialegTransfereixTitolBuit', 'Transferir la propietat'),
  dialegTransfereixDescripcio: textMembres('dialegTransfereixDescripcio', '{nom} en serà la propietària i tu passaràs a administradora: continuaràs gestionant la fitxa i els membres, però ja no podràs nomenar ni llevar administradores. Només {nom} et podrà tornar la propietat.'),
  /* Claus comunes: el camp de cerca i el botó de tornar de la confirmació (abans, «Cancel·lar» en totes les llengües). */
  cerca: Object.freeze(['common.search', 'Cerca']),
  cancela: Object.freeze(['common.cancela', 'Cancel·lar']),
});

/* T11-02 (Gemini, Tall 11; marató 261101_2143) · Els errors del port, pel seu
   `code` i en la llengua de la interfície. Cada reserva és la frase valenciana
   de MISSATGES_MEMBRES_ORGANITZACIO (contracte.js), lletra per lletra, i la de
   NO-DISPONIBLE, la de l'adaptador i PerfilContext. */
const textErrorMembre = (codi, reserva) => Object.freeze([`section.perfil.membres.error.${codi}`, reserva]);
export const ERRORS_MEMBRES = Object.freeze({
  'SDP-ORGMEM-000': textErrorMembre('orgmem000', 'Cal iniciar sessió.'),
  'SDP-ORGMEM-001': textErrorMembre('orgmem001', 'El tipus de membre o el rol no és vàlid.'),
  'SDP-ORGMEM-002': textErrorMembre('orgmem002', 'Només qui administra l’organització en veu i en gestiona els membres.'),
  'SDP-ORGMEM-003': textErrorMembre('orgmem003', 'Esta persona no és del municipi de l’organització o ha demanat la baixa.'),
  'SDP-ORGMEM-004': textErrorMembre('orgmem004', 'No pots canviar el teu propi rol.'),
  'SDP-ORGMEM-005': textErrorMembre('orgmem005', 'La propietària no es canvia ni es lleva.'),
  'SDP-ORGMEM-006': textErrorMembre('orgmem006', 'Només la propietària nomena, degrada o lleva administradores.'),
  'SDP-ORGMEM-007': textErrorMembre('orgmem007', 'Una organització no pot ser membre d’ella mateixa ni d’una d’un altre poble.'),
  'SDP-ORGMEM-008': textErrorMembre('orgmem008', 'Per a afegir una organització com a membre, cal que també l’administres.'),
  'NO-DISPONIBLE': textErrorMembre('noDisponible', 'El servidor de Sóc de Poble encara no gestiona els membres de les organitzacions.'),
});

export const ERRORS_TRANSFERENCIA = Object.freeze({
  'SDP-ORGMEM-003': textErrorMembre('transfereixOrgmem003', 'Només es pot transferir a una persona que siga membre de l’organització i del seu poble i que no haja demanat la baixa.'),
  'SDP-ORGMEM-006': textErrorMembre('transfereixOrgmem006', 'Només la propietària pot transferir la propietat.'),
  'NO-DISPONIBLE': textErrorMembre('transfereixNoDisponible', 'El servidor de Sóc de Poble encara no sap transferir la propietat de les organitzacions.'),
});

/** Com es diu cada tipus de membre a la taula i al selector. */
export const ETIQUETES_TIPUS = Object.freeze({
  persona: 'Persona',
  organitzacio: 'Organització',
});

/* T5a · P1-22 (assalt 261101) · Els tipus en parells [clau i18n, reserva]
   per al traductor; la reserva és l'etiqueta de dalt, lletra per lletra. */
export const PARELLS_TIPUS = Object.freeze({
  persona: Object.freeze(['section.perfil.membres.tipus.persona', ETIQUETES_TIPUS.persona]),
  organitzacio: Object.freeze(['section.perfil.membres.tipus.organitzacio', ETIQUETES_TIPUS.organitzacio]),
});

/** El parell d'un tipus de membre, o null si no és cap dels coneguts. */
export const parellDeTipus = (tipus) => (Object.hasOwn(PARELLS_TIPUS, tipus) ? PARELLS_TIPUS[tipus] : null);

const ORDRE_ROL = Object.freeze({ owner: 0, admin: 1, member: 2 });
const ORDRE_TIPUS = Object.freeze({ persona: 0, organitzacio: 1 });

/** La clau estable d'un membre o d'un candidat: el tipus i l'id. */
export const clauDeMembre = (membre) => `${membre?.tipus ?? ''}:${String(membre?.id ?? '')}`;

/* Sense accents ni majúscules, com la cerca del servidor (2609291210). */
const plega = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/**
 * La propietària primer, després les administradores i els membres; dins de
 * cada rol, les persones abans que les organitzacions, i per nom. Torna una
 * llista nova (l'entrada no es toca) i descarta els forats.
 */
export function ordenaMembres(membres = []) {
  const llista = Array.isArray(membres) ? membres.filter(Boolean) : [];
  return [...llista].sort((a, b) => (ORDRE_ROL[a.rol] ?? 3) - (ORDRE_ROL[b.rol] ?? 3)
    || (ORDRE_TIPUS[a.tipus] ?? 2) - (ORDRE_TIPUS[b.tipus] ?? 2)
    || String(a.nom ?? '').localeCompare(String(b.nom ?? ''), 'ca')
    || String(a.id ?? '').localeCompare(String(b.id ?? '')));
}

const CAP_ACCIO = Object.freeze({ rol: null, lleva: false });

/**
 * Què pot fer sobre `membre` qui mira, amb el seu rol a l'organització
 * (`rolMeu`) i el seu id de persona (`jo`). Torna { rol, lleva }: `rol` és el
 * rol al qual es pot canviar ('admin' o 'member'; null, cap canvi) i `lleva`
 * diu si es pot llevar.
 */
export function accionsSobre(membre, { rolMeu, jo } = {}) {
  if (!membre || !esRolQueMana(rolMeu) || membre.rol === 'owner') return CAP_ACCIO;
  if (membre.tipus === 'persona' && jo != null && String(membre.id) === String(jo)) return CAP_ACCIO;
  if (membre.tipus === 'organitzacio') return { rol: null, lleva: true };
  if (membre.tipus !== 'persona') return CAP_ACCIO;
  const propietaria = rolMeu === 'owner';
  if (membre.rol === 'admin') return propietaria ? { rol: 'member', lleva: true } : CAP_ACCIO;
  return { rol: propietaria ? 'admin' : null, lleva: true };
}

/**
 * IDEA-24 · Només la propietària ('owner') pot transferir la propietat a una
 * altra persona que ja siga membre ('admin' o 'member') de l'organització, i
 * només d'un grup o d'una empresa (`kind` de TIPUS_TRANSFERIBLES, contracte.js:
 * una entitat o un ajuntament canvia de titular per reclamació revisada).
 * Sense `kind`, o amb un tipus desconegut, no (fallada tancada).
 */
export function potTransferirPropietat(membre, { rolMeu, jo, kind } = {}) {
  if (!membre || rolMeu !== 'owner' || !TIPUS_TRANSFERIBLES.includes(kind)) return false;
  if (membre.tipus !== 'persona' || membre.rol === 'owner' || membre.id == null) return false;
  if (jo != null && String(membre.id) === String(jo)) return false;
  return true;
}

/**
 * Els candidats a membre de l'organització `orgId`, sense els que ja ho són
 * (`membres`) ni la persona que mira (`jo`):
 *   · `persones`: files de carregaMembres (el padró del poble, ja cercat pel
 *     servidor): només les de tipus 'persona';
 *   · `organitzacions`: files de listMyOrganizations. Només les que la
 *     persona administra (el servidor exigix administrar-les totes dues,
 *     008), mai la mateixa, i filtrades ací pel `text`, que no passa pel
 *     servidor.
 * Candidat: { tipus, id, nom, avatar }. Primer les persones, després les
 * organitzacions; cap repetit.
 */
export function candidatsDeMembre({ persones = [], organitzacions = [], membres = [], orgId = null, text = '', jo = null } = {}) {
  const exclosos = new Set((Array.isArray(membres) ? membres : []).filter(Boolean).map(clauDeMembre));
  if (jo != null) exclosos.add(clauDeMembre({ tipus: 'persona', id: jo }));
  const parts = plega(text).split(/\s+/).filter(Boolean);
  const casa = (nom) => parts.every((part) => plega(nom).includes(part));
  const deLaGent = (Array.isArray(persones) ? persones : [])
    .filter((fila) => fila && (fila.tipus ?? 'persona') === 'persona' && fila.usuari_id != null)
    .map((fila) => ({ tipus: 'persona', id: String(fila.usuari_id), nom: String(fila.nom ?? ''), avatar: fila.avatar_url || '' }));
  const deLesOrganitzacions = (Array.isArray(organitzacions) ? organitzacions : [])
    .filter((org) => org && org.id != null && esRolQueMana(org.role) && String(org.id) !== String(orgId) && casa(org.name))
    .map((org) => ({ tipus: 'organitzacio', id: String(org.id), nom: String(org.name ?? ''), avatar: org.logo_url || '' }));
  const vistos = new Set();
  return [...deLaGent, ...deLesOrganitzacions].filter((candidat) => {
    const clau = clauDeMembre(candidat);
    if (exclosos.has(clau) || vistos.has(clau)) return false;
    vistos.add(clau);
    return true;
  });
}
