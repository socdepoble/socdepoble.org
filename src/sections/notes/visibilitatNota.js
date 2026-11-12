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
 * Integració 261024 · Els dos imports són purs: el detector del rebuig per
 * les normes (data/errorsBackend.js, la capa neutral d'errors del port) i,
 * des de P1-22, omple() de config/moderacio.js.
 *
 * P1-22 (marató 261101_2143, B3-I18N §3.A) · Cada text viu en un parell
 * [clau, reserva] i la reserva és el valencià de sempre, lletra per lletra
 * (Llei del Píxel). Les funcions reben un `t` opcional (el traductor
 * d'UIContext); sense, o si no és una funció, ixen en valencià. Les
 * constants exportades de sempre conserven el nom i el valor, nascudes del
 * parell. Les frases amb buits s'omplin amb omple() (config/moderacio.js),
 * mai cosint trossos.
 */
import { esRebuigDeNormes } from '../../data/errorsBackend.js';
import { omple } from '../../config/moderacio.js';

/* Com abastConnexio.js: sense portar UIContext a un mòdul pur. */
const text = (t, [clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);
const parellVisibilitat = (nom, reserva) => Object.freeze([`section.notes.visibilitat.${nom}`, reserva]);

/** D4 · L'avís dels drets reservats de l'original (a /connectar, a l'editor i al selector). */
export const PARELL_TITOL_DRETS = Object.freeze(['section.notes.drets.titol', 'Contingut amb drets reservats']);
export const PARELL_TEXT_DRETS = Object.freeze(['section.notes.drets.text', 'El pots connectar per a tu. Si el republiques, se’n citarà l’autoria i l’enllaç; no en copies el contingut sencer sense permís de qui el signa.']);
/* Integració 261024 (Codex C-02) · El rebuig del servidor per les normes: la
   reserva valenciana de section.moderacio.normes.calAcceptar (textosModeracio.js). */
export const PARELL_MOTIU_NORMES = Object.freeze(['section.moderacio.normes.calAcceptar', 'Per a publicar, cal acceptar les normes de convivència.']);

export const TEXTOS_VISIBILITAT_NOTA = Object.freeze({
  motiuForaster: parellVisibilitat('motiu.foraster', 'Connecta amb el teu compte per a publicar la nota al Mur.'),
  motiuLocal: parellVisibilitat('motiu.local', 'Nota desada en este dispositiu. Connecta un backend per a publicar al Mur.'),
  motiuLocalConnexio: parellVisibilitat('motiu.localConnexio', 'Connexió desada en este dispositiu. Connecta un backend per a compartir-la al Mur.'),
  motiuPublicada: parellVisibilitat('motiu.publicada', 'Retirar una nota del Mur encara no té contracte de dades amb el servidor: la pots actualitzar, però no tornar a fer privada.'),
  /* P4 (ordre del Mestre, 261003) · La «Nota sense títol» (notaPreparada.js)
     encara no existix al servidor: es crea amb la primera cosa que s'hi escriu. */
  motiuPreparada: parellVisibilitat('motiu.preparada', 'Escriu alguna cosa a la nota per a poder-la publicar al Mur.'),
  /* Revisió de P4 · Amb text, el motiu és la creació: en camí o sense arribar. */
  motiuPreparadaCreant: parellVisibilitat('motiu.preparadaCreant', 'La nota s’està creant al servidor. D’ací a un moment la podràs publicar al Mur.'),
  motiuPreparadaFallida: parellVisibilitat('motiu.preparadaFallida', 'La nota encara no s’ha pogut crear al servidor: fins que es cree, no es pot publicar al Mur.'),
  /* Publicar és un upsert amb un id estable (publishNote): tornar-ho a provar no
     duplica res. Només per a la xarxa: la resta de motius van amb ErrorPublicacio. */
  errorPublicar: parellVisibilitat('errorPublicar', 'No s’ha pogut publicar al Mur. Torna-ho a provar: si ja havia arribat, s’actualitzarà la mateixa publicació, sense duplicats.'),
  signantDesconegut: parellVisibilitat('signantDesconegut', 'una altra identitat'),
  signaturaAliena: parellVisibilitat('signaturaAliena', 'Esta publicació la signa {qui}: canvia a eixa identitat per a actualitzar-la.'),
  desatPendentDetall: parellVisibilitat('desatPendentDetall', 'No es pot publicar fins que es desen els canvis. {detall}'),
  desatPendent: parellVisibilitat('desatPendent', 'No es pot publicar fins que es desen els canvis pendents. Torna-ho a provar d’ací a un moment.'),
  /* idea61-01 (Gauntlet T7a, 261104) · Una publicació no canvia mai de secció
     (SDP-SEC-002, el trigger sdp_force_author): el motiu diu on viu i les dues
     eixides de veres, mai «torna-ho a provar». Un parell per a cada secció on
     escriu publishNote (seccioDAmbit: 'mur' o 'mercat'). */
  seccioPublicadaMur: parellVisibilitat('seccioPublicada.mur', 'Esta publicació ja és al Mur i no pot canviar de lloc. Per a actualitzar-la, torna a triar a «On es publica?» l’àmbit que tenia; per a publicar-la al Mercat, fes-ne una nota nova.'),
  seccioPublicadaMercat: parellVisibilitat('seccioPublicada.mercat', 'Esta publicació ja és al Mercat i no pot canviar de lloc. Per a actualitzar-la, torna a triar Mercat a «On es publica?»; per a publicar-la en un altre lloc, fes-ne una nota nova.'),
  /* T71b · Un contingut de fora (NotesEditor): els textos de compartir, però
     és una còpia de la persona, que l'edita: no es diu que siga d'altri. */
  externDescripcio: parellVisibilitat('extern.descripcio', 'Este contingut de fora és una còpia teua: el pots editar, i compartir-lo el porta al teu Mur citant-ne l’origen.'),
});
const T = TEXTOS_VISIBILITAT_NOTA;

/* Les constants de sempre (les importen les proves i Connectar), amb el mateix valor. */
export const TITOL_DRETS_RESERVATS = PARELL_TITOL_DRETS[1];
export const TEXT_DRETS_RESERVATS = PARELL_TEXT_DRETS[1];
export const MOTIU_FORASTER = T.motiuForaster[1];
export const MOTIU_LOCAL = T.motiuLocal[1];
export const MOTIU_LOCAL_CONNEXIO = T.motiuLocalConnexio[1];
export const MOTIU_PUBLICADA = T.motiuPublicada[1];
export const MOTIU_PREPARADA = T.motiuPreparada[1];
export const MOTIU_PREPARADA_CREANT = T.motiuPreparadaCreant[1];
export const MOTIU_PREPARADA_FALLIDA = T.motiuPreparadaFallida[1];
export const ERROR_PUBLICAR = T.errorPublicar[1];
export const MOTIU_NORMES = PARELL_MOTIU_NORMES[1];

/** D4 · «Títol. Text» dels drets reservats, en la llengua de `t`. */
export const avisDretsReservats = (t = null) => `${text(t, PARELL_TITOL_DRETS)}. ${text(t, PARELL_TEXT_DRETS)}`;
export const AVIS_DRETS_RESERVATS = avisDretsReservats();

const MOTIUS_PREPARADA = Object.freeze({
  buida: T.motiuPreparada,
  enviant: T.motiuPreparadaCreant,
  error: T.motiuPreparadaFallida,
  pendent: T.motiuPreparadaFallida
});

/** T47 · El motiu de no publicar en mode seed/local (sense Mur): nota o connexió. */
export function motiuModeLocal({ connexio = false, t = null } = {}) {
  return text(t, connexio ? T.motiuLocalConnexio : T.motiuLocal);
}

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
 * el servidor ho torna a rebutjar, el motiu és `motiuNormes`. Mai en bucle.
 * P1-22 · Sense `motiuNormes`, el de les normes en la llengua de `t`; un
 * `motiuNormes` explícit continua manant. */
export async function publicaAmbMotiu(publica, { tornaAPreguntar = null, motiuNormes = null, t = null } = {}) {
  for (let intent = 0; ; intent += 1) {
    let fet;
    try {
      fet = await publica();
    } catch (error) {
      if (!esRebuigDeNormes(error)) throw new Error(error?.name === 'ErrorPublicacio' ? error.message : text(t, T.errorPublicar));
      if (intent === 0 && typeof tornaAPreguntar === 'function' && (await tornaAPreguntar()) === true) continue;
      throw new Error(motiuNormes ?? text(t, PARELL_MOTIU_NORMES));
    }
    if (fet === false) throw new Error(text(t, T.errorPublicar));
    return true;
  }
}

/* Grup E de l'Onada 4 (prompt 261008_1201, risc «que estiga clavat el
   comportament») · Una nota publicada s'edita com a esborrany privat i el Mur
   només canvia amb «Actualitzar al Mur». Si la publicació la signa una altra
   identitat que l'activa (la persona i l'entitat amb què actua són dues
   firmes), actualitzar-la la tornaria a signar amb l'activa: publishNote no
   l'envia i el selector diu el motiu en línia (ErrorPublicacio). */
export const SIGNANT_DESCONEGUT = T.signantDesconegut[1];

/** Grup E (261008) · El motiu de no actualitzar una publicació que signa una altra identitat (`nom`). */
export function motiuSignaturaAliena(nom = '', t = null) {
  const qui = String(nom ?? '').trim() || text(t, T.signantDesconegut);
  return omple(text(t, T.signaturaAliena), { qui });
}

/** idea61-01 (Gauntlet T7a, 261104) · El motiu de no actualitzar una
 * publicació que viu en una altra secció: `seccio` és la de la fila ('mercat';
 * qualsevol altra cosa, el Mur). */
export function motiuSeccioPublicada(seccio = 'mur', t = null) {
  return text(t, seccio === 'mercat' ? T.seccioPublicadaMercat : T.seccioPublicadaMur);
}

/* idea61-01 (Gauntlet T7a, 261104) · El rebuig del servidor a un upsert que
   canvia el section_id d'una fila (el trigger sdp_force_author, l'última
   definició a 2609261500_identitat_perfil_f1.sql). Com SDP-MOD-428
   (esRebuigDeNormes, data/errorsBackend.js), l'adaptador encara no el traduïx
   a cap `code` propi: arriba al `code`, dins del missatge («Supabase 400:
   {…"message":"SDP-SEC-002: section_id is immutable"}») o a una causa. Viu
   ací, al costat del motiu, perquè errorsBackend.js és fora del lot de la
   correcció: el seu lloc és al costat d'esRebuigDeNormes. */
export const CODI_SECCIO_IMMUTABLE = 'SDP-SEC-002';

/** idea61-01 · Cert si `error` (o una de les seues causes, com a molt quatre baules) és el rebuig per canvi de secció. Pura. */
export function esRebuigDeSeccio(error) {
  let baula = error;
  for (let pas = 0; baula && typeof baula === 'object' && pas < 4; pas += 1) {
    if (`${baula.code ?? ''} ${baula.message ?? ''}`.includes(CODI_SECCIO_IMMUTABLE)) return true;
    baula = baula.cause;
  }
  return false;
}

/** El motiu de no publicar quan el desat previ no s'ha confirmat. `detall` és
 * el de la ploma (estatPerAlEditor): diu què passa i què cal fer. */
export function motiuDesatPendent(detall = '', t = null) {
  return detall ? omple(text(t, T.desatPendentDetall), { detall }) : text(t, T.desatPendent);
}

/* Els textos del selector, en parells amb la forma de l'objecte que es pinta. */
const PRIVADA_NOTA = parellVisibilitat('nota.privada.accio', 'Deixar-la privada');
const PARELLS_NOTA = Object.freeze({
  titol: parellVisibilitat('nota.titol', 'Qui pot vore esta nota?'),
  descripcio: parellVisibilitat('nota.descripcio', 'Mentre no la publiques, la nota és només teua. Publicar-la la porta al Mur del poble.'),
  llegenda: parellVisibilitat('nota.llegenda', 'Visibilitat de la nota'),
  publica: Object.freeze({
    etiqueta: parellVisibilitat('nota.publica.etiqueta', 'Publicada al Mur'),
    /* La RLS de lectura de section_submissions exigix ser del poble
       (is_town_member): el Mur no és Internet. El mateix que diu Connectar. */
    explicacio: parellVisibilitat('nota.publica.explicacio', 'Ix al Mur del poble: la llig la gent registrada del poble, no Internet.'),
    accio: parellVisibilitat('nota.publica.accio', 'Publicar al Mur'),
    accioIgual: parellVisibilitat('nota.publica.accioIgual', 'Actualitzar al Mur'),
  }),
  /* T3 (261024_1800, P2-11) · Sense el jargó intern «MAS» (el mateix salfumant de /connectar):
     la persona veu «privada» i a qui, no el nom de la peça. */
  privada: Object.freeze({
    etiqueta: parellVisibilitat('nota.privada.etiqueta', 'Privada (només visible per a tu)'),
    explicacio: parellVisibilitat('nota.privada.explicacio', 'Amb el candau, només la veus tu al teu Bloc: escriu i prova el que vulgues.'),
    accio: PRIVADA_NOTA,
    accioIgual: PRIVADA_NOTA,
  }),
  irreversible: parellVisibilitat('nota.irreversible', 'Una vegada al Mur, encara no es pot retirar: la podràs actualitzar, però no tornar a fer privada.'),
});

const PRIVADA_CONNEXIO = parellVisibilitat('connexio.privada.accio', 'Deixar-lo privat');
const PARELLS_CONNEXIO = Object.freeze({
  titol: parellVisibilitat('connexio.titol', 'Qui pot vore este contingut?'),
  /* D4 (excepció del Mestre, 260930) · la connexió s'obri a l'editor: és una
     còpia editable, però l'obra continua sent d'altri i es cita en compartir. */
  descripcio: parellVisibilitat('connexio.descripcio', 'És contingut d’altri: a les teues notes el llegixes i el canvies de carpeta, i el pots editar com una còpia teua; compartir-lo el porta al teu Mur citant-ne l’origen i l’autoria.'),
  llegenda: parellVisibilitat('connexio.llegenda', 'Visibilitat del contingut'),
  publica: Object.freeze({
    etiqueta: parellVisibilitat('connexio.publica.etiqueta', 'Compartit al teu Mur'),
    /* Poliment W3C · cosDeConnexioPerAlMur (connexions.js) sempre cita d'on
       ve i l'element, però l'autor només si l'origen el porta: una pàgina
       connectada no en té cap (objecteDePagina). */
    explicacio: parellVisibilitat('connexio.publica.explicacio', 'Ix al teu Mur citant-ne l’origen: el llig la gent registrada del poble, no Internet.'),
    /* Les mateixes claus que el botó de la tira del lector (ConnexioDetall.jsx). */
    accio: Object.freeze(['section.notes.connexio.mur.comparteix', 'Compartir al Mur']),
    accioIgual: Object.freeze(['section.notes.connexio.mur.actualitza', 'Actualitzar al Mur']),
  }),
  /* T3 (261024_1800, P2-11) · Com la nota, sense «MAS»: el contingut és privat i només el veus tu. */
  privada: Object.freeze({
    etiqueta: parellVisibilitat('connexio.privada.etiqueta', 'Privat (només visible per a tu)'),
    explicacio: parellVisibilitat('connexio.privada.explicacio', 'Amb el candau, només el veus tu, ordenat i etiquetat al teu Bloc.'),
    accio: PRIVADA_CONNEXIO,
    accioIgual: PRIVADA_CONNEXIO,
  }),
  irreversible: parellVisibilitat('connexio.irreversible', 'Una vegada al Mur, encara no es pot retirar: el podràs actualitzar, però no tornar a fer privat.'),
});

const grupDe = (parells, t) => Object.freeze(Object.fromEntries(Object.entries(parells).map(([camp, parell]) => [camp, text(t, parell)])));

/** L'objecte que pinta el selector: la mateixa forma de sempre, en la llengua de `t`. */
function textosDe(parells, t) {
  return Object.freeze({
    titol: text(t, parells.titol),
    descripcio: text(t, parells.descripcio),
    llegenda: text(t, parells.llegenda),
    publica: grupDe(parells.publica, t),
    privada: grupDe(parells.privada, t),
    reversible: null,
    irreversible: text(t, parells.irreversible),
    avisPublica: null,
  });
}

/* En valencià, un sol objecte per a cada cas: la identitat de sempre. */
const NOTA = textosDe(PARELLS_NOTA, null);
const CONNEXIO = textosDe(PARELLS_CONNEXIO, null);
const ambDescripcioExterna = (textos, t) => Object.freeze({ ...textos, descripcio: text(t, T.externDescripcio) });
const EXTERN = ambDescripcioExterna(CONNEXIO, null);

/** Els textos del selector: nota pròpia o connectada. Amb `t`, un objecte nou
 * amb la mateixa forma (sense cau: qui crida fa useMemo sobre `t`). */
export function textosDeNota({ connexio = false, t = null } = {}) {
  if (typeof t !== 'function') return connexio ? CONNEXIO : NOTA;
  return textosDe(connexio ? PARELLS_CONNEXIO : PARELLS_NOTA, t);
}

/** T71b · El selector d'un contingut de fora: els textos de compartir, però
 * és una còpia de la persona, que l'edita (abans TEXTOS_EXTERN de NotesEditor). */
export function textosExtern(t = null) {
  return typeof t === 'function' ? ambDescripcioExterna(textosDeNota({ connexio: true, t }), t) : EXTERN;
}

/** D4 · Els mateixos textos i, si l'original porta els drets reservats
 * (`dretsReservats`), l'avís al final de la descripció. */
export function textosAmbDrets(textos, dretsReservats = false, t = null) {
  if (!dretsReservats || !textos) return textos;
  return Object.freeze({ ...textos, descripcio: `${textos.descripcio} ${avisDretsReservats(t)}` });
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
export function bloqueigDeNota({ foraster = false, modeLocal = false, publicada = false, connexio = false, preparada = false, t = null } = {}) {
  if (modeLocal) return { opcio: 'publica', motiu: motiuModeLocal({ connexio, t }) };
  if (foraster) return { opcio: 'publica', motiu: text(t, T.motiuForaster) };
  if (preparada) {
    const parell = typeof preparada === 'string' && Object.hasOwn(MOTIUS_PREPARADA, preparada) ? MOTIUS_PREPARADA[preparada] : T.motiuPreparada;
    return { opcio: 'publica', motiu: text(t, parell) };
  }
  if (publicada) return { opcio: 'privada', motiu: text(t, T.motiuPublicada) };
  return null;
}

/* Onada R20 (Bucle 1 · UX Pedra Seca en línia a /notes, cas Damià Llorens) ·
   Textos inequívocs per al panell en línia (zero modals flotants), preservant
   intacte textosDeNota per a SelectorVisibilitat i ConnexioDetall. */
const PARELLS_EN_LINIA = Object.freeze({
  llegenda: parellVisibilitat('enLinia.llegenda', 'Visibilitat i publicació de la nota'),
  privadaEtiqueta: parellVisibilitat('enLinia.privada.etiqueta', '🔒 Esborrany privat (només per a tu)'),
  privadaExplicacio: parellVisibilitat('enLinia.privada.explicacio', 'Es desa automàticament al teu Bloc de notes i ningú més la pot vore.'),
  publicaEtiqueta: parellVisibilitat('enLinia.publica.etiqueta', '📣 Públic al Mur del poble'),
  publicaEtiquetaMercat: parellVisibilitat('enLinia.publica.etiquetaMercat', '📣 Públic al Mercat del poble'),
  publicaEtiquetaConnexio: parellVisibilitat('enLinia.publica.etiquetaConnexio', '📣 Compartit al Mur del poble'),
  publicaExplicacio: parellVisibilitat('enLinia.publica.explicacio', 'Es publica amb la teua signatura i ix al Mur del poble.'),
  publicaExplicacioConnexio: parellVisibilitat('enLinia.publica.explicacioConnexio', 'Es compartix al Mur citant-ne l’origen i l’autoria.'),
  publicaAccioMercat: parellVisibilitat('enLinia.publica.accioMercat', 'Publicar al Mercat'),
  publicaAccioIgualMercat: parellVisibilitat('enLinia.publica.accioIgualMercat', 'Actualitzar al Mercat'),
  pobleEtiqueta: parellVisibilitat('enLinia.poble.etiqueta', 'Poble on es publica'),
  pobleAjuda: parellVisibilitat('enLinia.poble.ajuda', 'Tens més d’un poble vinculat al teu perfil. Tria a quin poble ix esta publicació.'),
  pobleTria: parellVisibilitat('enLinia.poble.tria', '— Tria el poble de la publicació —'),
  pobleIndeterminat: parellVisibilitat('enLinia.poble.indeterminat', 'No s’ha pogut verificar en quin poble es va publicar esta nota perquè la publicació queda fora de la finestra carregada. Tria explícitament el poble abans d’actualitzar-la.'),
  motiuPobleNoDeterminat: parellVisibilitat('motiuPobleNoDeterminat', 'No s’ha pogut verificar en quin poble es va publicar esta nota. Tria explícitament el poble abans d’actualitzar-la al Mur.'),
  signatura: parellVisibilitat('enLinia.signatura', 'Publicaràs com a {nom}.'),
  estatPublicat: parellVisibilitat('enLinia.estatPublicat', 'Publicat'),
  veureAlMur: parellVisibilitat('enLinia.veureAlMur', 'Veure al Mur'),
  veureAlMercat: parellVisibilitat('enLinia.veureAlMercat', 'Veure al Mercat'),
  treballant: parellVisibilitat('enLinia.treballant', 'Publicant…'),
});

export function motiuPobleNoDeterminat(t = null) {
  return text(t, PARELLS_EN_LINIA.motiuPobleNoDeterminat);
}

export function signaturaEnLiniaDeNota(nom = '', t = null) {
  const net = String(nom ?? '').trim();
  return net ? omple(text(t, PARELLS_EN_LINIA.signatura), { nom: net }) : '';
}

export function textosEnLiniaDeNota({ connexio = false, extern = false, dretsReservats = false, seccio = 'mur', t = null } = {}) {
  const esCita = Boolean(connexio || extern);
  const esMercat = !esCita && seccio === 'mercat';
  const base = textosAmbDrets(extern ? textosExtern(t) : textosDeNota({ connexio: esCita, t }), dretsReservats, t);
  const etiquetaPublica = esCita
    ? text(t, PARELLS_EN_LINIA.publicaEtiquetaConnexio)
    : esMercat
      ? text(t, PARELLS_EN_LINIA.publicaEtiquetaMercat)
      : text(t, PARELLS_EN_LINIA.publicaEtiqueta);
  const explicacioPublica = esCita
    ? text(t, PARELLS_EN_LINIA.publicaExplicacioConnexio)
    : text(t, PARELLS_EN_LINIA.publicaExplicacio);
  const accioPublica = esMercat ? text(t, PARELLS_EN_LINIA.publicaAccioMercat) : base.publica.accio;
  const accioIgualPublica = esMercat ? text(t, PARELLS_EN_LINIA.publicaAccioIgualMercat) : base.publica.accioIgual;
  return Object.freeze({
    llegenda: text(t, PARELLS_EN_LINIA.llegenda),
    privada: Object.freeze({
      etiqueta: text(t, PARELLS_EN_LINIA.privadaEtiqueta),
      explicacio: text(t, PARELLS_EN_LINIA.privadaExplicacio),
    }),
    publica: Object.freeze({
      etiqueta: etiquetaPublica,
      explicacio: explicacioPublica,
      accio: accioPublica,
      accioIgual: accioIgualPublica,
    }),
    poble: Object.freeze({
      etiqueta: text(t, PARELLS_EN_LINIA.pobleEtiqueta),
      ajuda: text(t, PARELLS_EN_LINIA.pobleAjuda),
      tria: text(t, PARELLS_EN_LINIA.pobleTria),
      indeterminat: text(t, PARELLS_EN_LINIA.pobleIndeterminat),
    }),
    irreversible: base.irreversible,
    avisDrets: dretsReservats ? avisDretsReservats(t) : null,
    estatPublicat: text(t, PARELLS_EN_LINIA.estatPublicat),
    veurePublicacio: text(t, esMercat ? PARELLS_EN_LINIA.veureAlMercat : PARELLS_EN_LINIA.veureAlMur),
    treballant: text(t, PARELLS_EN_LINIA.treballant),
  });
}
