/**
 * visibilitatNota.js — Què diu el selector de visibilitat (T41) al Bloc de
 * Notes. Pur: sense React ni backend (Model B).
 *
 * T41 (ordre del Mestre, 260928) · Publicar és un upsert de la publicació al
 * Mur amb un id estable (publishNote): tornar a publicar l'ACTUALITZA. No hi
 * ha cap mètode al port (backendPort) per a retirar-la del Mur. Per això una
 * nota publicada no es pot tornar a fer privada, i el selector ho diu; el text
 * «ho pots tornar a fer privat» no ix mai ací, perquè no seria cert. Una nota
 * connectada és d'altri: es compartix citant l'origen (T5).
 *
 * D4 (excepció del Mestre, 260930) · La connexió és una còpia editable, i si
 * l'original porta els drets reservats («©», origen.drets) el selector i
 * l'editor ho avisen abans de republicar-la (textosAmbDrets).
 *
 * Integració 261024 · L'únic import és el detector pur del rebuig per les
 * normes (data/errorsBackend.js, la capa neutral d'errors del port).
 */
import { esRebuigDeNormes } from '../../data/errorsBackend.js';

/** D4 · L'avís dels drets reservats de l'original (a /connectar, a l'editor i al selector). */
export const TITOL_DRETS_RESERVATS = 'Contingut amb drets reservats';
export const TEXT_DRETS_RESERVATS = 'El pots connectar per a tu. Si el republiques, se’n citarà l’autoria i l’enllaç; no en copies el contingut sencer sense permís de qui el signa.';
export const AVIS_DRETS_RESERVATS = `${TITOL_DRETS_RESERVATS}. ${TEXT_DRETS_RESERVATS}`;

export const MOTIU_FORASTER = 'Connecta amb el teu compte per a publicar la nota al Mur.';
export const MOTIU_LOCAL = 'Nota desada en este dispositiu. Connecta un backend per a publicar al Mur.';
export const MOTIU_LOCAL_CONNEXIO = 'Connexió desada en este dispositiu. Connecta un backend per a compartir-la al Mur.';
export const MOTIU_PUBLICADA = 'Retirar una nota del Mur encara no té contracte de dades amb el servidor: la pots actualitzar, però no tornar a fer privada.';
/* P4 (ordre del Mestre, 261003) · La «Nota sense títol» (notaPreparada.js)
   encara no existix al servidor: es crea amb la primera cosa que s'hi escriu. */
export const MOTIU_PREPARADA = 'Escriu alguna cosa a la nota per a poder-la publicar al Mur.';
/* Revisió de P4 · Amb text, el motiu és la creació: en camí o sense arribar. */
export const MOTIU_PREPARADA_CREANT = 'La nota s’està creant al servidor. D’ací a un moment la podràs publicar al Mur.';
export const MOTIU_PREPARADA_FALLIDA = 'La nota encara no s’ha pogut crear al servidor: fins que es cree, no es pot publicar al Mur.';
const MOTIUS_PREPARADA = Object.freeze({
  buida: MOTIU_PREPARADA,
  enviant: MOTIU_PREPARADA_CREANT,
  error: MOTIU_PREPARADA_FALLIDA,
  pendent: MOTIU_PREPARADA_FALLIDA
});
/* Publicar és un upsert amb un id estable (publishNote): tornar-ho a provar no
   duplica res. Només per a la xarxa: la resta de motius van amb ErrorPublicacio. */
export const ERROR_PUBLICAR = 'No s’ha pogut publicar al Mur. Torna-ho a provar: si ja havia arribat, s’actualitzarà la mateixa publicació, sense duplicats.';
/* Integració 261024 (Codex C-02) · El rebuig del servidor per les normes: la
   reserva valenciana de section.moderacio.normes.calAcceptar (textosModeracio.js),
   que qui crida pot passar traduïda (publicaAmbMotiu · motiuNormes). */
export const MOTIU_NORMES = 'Per a publicar, cal acceptar les normes de convivència.';

/** T47 (ordre del Mestre, 260928) · publishNote no ha arribat ni a provar-ho, i
 * tornar-ho a provar tal qual no servix (desat pendent en conflicte, validació,
 * sense servidor…). El missatge és el motiu, el mateix del toast. */
export class ErrorPublicacio extends Error {
  constructor(motiu) {
    super(motiu);
    this.name = 'ErrorPublicacio';
  }
}

/** T47 · Publica (o compartix) i tradueix el resultat per al selector de
 * visibilitat, que diu en línia el missatge de l'error. `publica` és la crida
 * del context (publishNote o compartirNota) i torna una promesa:
 *   · true: publicada;
 *   · false: la xarxa (ERROR_PUBLICAR: tornar-ho a provar servix);
 *   · ErrorPublicacio: el motiu de veres (desat en conflicte, sense servidor…),
 *     que no es tapa amb «torna-ho a provar». Qualsevol altre error és tècnic
 *     i també es diu ERROR_PUBLICAR.
 * Integració 261024 (Codex C-02) · El rebuig del servidor per les normes de
 * convivència (SDP-MOD-428, esRebuigDeNormes) no és cap xarxa: amb
 * `tornaAPreguntar` (asseguraNormes({ rebutjades: true }) de qui crida), es
 * pregunta de nou i, si les accepta, es publica UNA vegada més; si no, o si
 * el servidor ho torna a rebutjar, el motiu és `motiuNormes`. Mai en bucle. */
export async function publicaAmbMotiu(publica, { tornaAPreguntar = null, motiuNormes = MOTIU_NORMES } = {}) {
  for (let intent = 0; ; intent += 1) {
    let fet;
    try {
      fet = await publica();
    } catch (error) {
      if (!esRebuigDeNormes(error)) throw new Error(error?.name === 'ErrorPublicacio' ? error.message : ERROR_PUBLICAR);
      if (intent === 0 && typeof tornaAPreguntar === 'function' && (await tornaAPreguntar()) === true) continue;
      throw new Error(motiuNormes);
    }
    if (fet === false) throw new Error(ERROR_PUBLICAR);
    return true;
  }
}

/* Grup E de l'Onada 4 (prompt 261008_1201, risc «que estiga clavat el
   comportament») · Una nota publicada s'edita com a esborrany privat i el Mur
   només canvia amb «Actualitzar al Mur». Si la publicació la signa una altra
   identitat que l'activa (la persona i l'entitat amb què actua són dues
   firmes), actualitzar-la la tornaria a signar amb l'activa: publishNote no
   l'envia i el selector diu el motiu en línia (ErrorPublicacio). */
export const SIGNANT_DESCONEGUT = 'una altra identitat';

/** Grup E (261008) · El motiu de no actualitzar una publicació que signa una altra identitat (`nom`). */
export function motiuSignaturaAliena(nom = '') {
  const qui = String(nom ?? '').trim() || SIGNANT_DESCONEGUT;
  return `Esta publicació la signa ${qui}: canvia a eixa identitat per a actualitzar-la.`;
}

/** El motiu de no publicar quan el desat previ no s'ha confirmat. `detall` és
 * el de la ploma (estatPerAlEditor): diu què passa i què cal fer. */
export function motiuDesatPendent(detall = '') {
  return detall
    ? `No es pot publicar fins que es desen els canvis. ${detall}`
    : 'No es pot publicar fins que es desen els canvis pendents. Torna-ho a provar d’ací a un moment.';
}

const IRREVERSIBLE = 'Una vegada al Mur, encara no es pot retirar: la podràs actualitzar, però no tornar a fer privada.';

const NOTA = Object.freeze({
  titol: 'Qui pot vore esta nota?',
  descripcio: 'Mentre no la publiques, la nota és només teua. Publicar-la la porta al Mur del poble.',
  llegenda: 'Visibilitat de la nota',
  publica: Object.freeze({
    etiqueta: 'Publicada al Mur',
    /* La RLS de lectura de section_submissions exigix ser del poble
       (is_town_member): el Mur no és Internet. El mateix que diu Connectar. */
    explicacio: 'Ix al Mur del poble: la llig la gent registrada del poble, no Internet.',
    accio: 'Publicar al Mur',
    accioIgual: 'Actualitzar al Mur',
  }),
  /* T3 (261024_1800, P2-11) · Sense el jargó intern «MAS» (el mateix salfumant de /connectar):
     la persona veu «privada» i a qui, no el nom de la peça. */
  privada: Object.freeze({
    etiqueta: 'Privada (només visible per a tu)',
    explicacio: 'Amb el candau, només la veus tu al teu Bloc: escriu i prova el que vulgues.',
    accio: 'Deixar-la privada',
    accioIgual: 'Deixar-la privada',
  }),
  reversible: null,
  irreversible: IRREVERSIBLE,
  avisPublica: null,
});

const CONNEXIO = Object.freeze({
  titol: 'Qui pot vore este contingut?',
  /* D4 (excepció del Mestre, 260930) · la connexió s'obri a l'editor: és una
     còpia editable, però l'obra continua sent d'altri i es cita en compartir. */
  descripcio: 'És contingut d’altri: a les teues notes el llegixes i el canvies de carpeta, i el pots editar com una còpia teua; compartir-lo el porta al teu Mur citant-ne l’origen i l’autoria.',
  llegenda: 'Visibilitat del contingut',
  publica: Object.freeze({
    etiqueta: 'Compartit al teu Mur',
    /* Poliment W3C · cosDeConnexioPerAlMur (connexions.js) sempre cita d'on
       ve i l'element, però l'autor només si l'origen el porta: una pàgina
       connectada no en té cap (objecteDePagina). */
    explicacio: 'Ix al teu Mur citant-ne l’origen: el llig la gent registrada del poble, no Internet.',
    accio: 'Compartir al Mur',
    accioIgual: 'Actualitzar al Mur',
  }),
  /* T3 (261024_1800, P2-11) · Com la nota, sense «MAS»: el contingut és privat i només el veus tu. */
  privada: Object.freeze({
    etiqueta: 'Privat (només visible per a tu)',
    explicacio: 'Amb el candau, només el veus tu, ordenat i etiquetat al teu Bloc.',
    accio: 'Deixar-lo privat',
    accioIgual: 'Deixar-lo privat',
  }),
  reversible: null,
  irreversible: 'Una vegada al Mur, encara no es pot retirar: el podràs actualitzar, però no tornar a fer privat.',
  avisPublica: null,
});

/** Els textos del selector: nota pròpia o connectada. */
export function textosDeNota({ connexio = false } = {}) {
  return connexio ? CONNEXIO : NOTA;
}

/** D4 · Els mateixos textos i, si l'original porta els drets reservats
 * (`dretsReservats`), l'avís al final de la descripció. */
export function textosAmbDrets(textos, dretsReservats = false) {
  if (!dretsReservats || !textos) return textos;
  return Object.freeze({ ...textos, descripcio: `${textos.descripcio} ${AVIS_DRETS_RESERVATS}` });
}

/**
 * El que no es pot triar, amb el motiu (null si tot es pot triar).
 *   · en mode seed/local no hi ha Mur on publicar, amb sessió o sense: és el
 *     motiu de veres, i va primer (T47, ordre del Mestre 260928);
 *   · sense sessió (Foraster, còpia de prova) no es publica;
 *   · P4 · la nota preparada (encara sense crear) no es publica. `preparada`
 *     és true o l'estat de la seua creació ('buida', 'enviant', 'error',
 *     'pendent'), que tria el motiu;
 *   · una nota ja publicada no es pot retirar del Mur (no hi ha contracte).
 */
export function bloqueigDeNota({ foraster = false, modeLocal = false, publicada = false, connexio = false, preparada = false } = {}) {
  if (modeLocal) return { opcio: 'publica', motiu: connexio ? MOTIU_LOCAL_CONNEXIO : MOTIU_LOCAL };
  if (foraster) return { opcio: 'publica', motiu: MOTIU_FORASTER };
  if (preparada) {
    const motiu = typeof preparada === 'string' && Object.hasOwn(MOTIUS_PREPARADA, preparada) ? MOTIUS_PREPARADA[preparada] : MOTIU_PREPARADA;
    return { opcio: 'publica', motiu };
  }
  if (publicada) return { opcio: 'privada', motiu: MOTIU_PUBLICADA };
  return null;
}
