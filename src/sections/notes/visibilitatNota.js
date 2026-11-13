/** Textos de visibilitat del Bloc. Els membres de poble lligen la peça rica;
 * el Foraster rep una projecció anònima filtrada. La retirada es confirma
 * amb ACK del servidor i una republicació posterior crea un UUID nou.
 * Els parells [clau, reserva] mantenen el mateix contracte de traducció. */
import { esRebuigDeNormes } from '../../data/errorsBackend.js';
import { omple } from '../../config/moderacio.js';

/* Com abastConnexio.js: sense portar UIContext a un mòdul pur. */
const text = (t, [clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);
const parellVisibilitat = (nom, reserva) => Object.freeze([`section.notes.visibilitat.${nom}`, reserva]);

/** D4 · L'avís dels drets reservats de l'original (a /connectar, a l'editor i al selector). */
export const PARELL_TITOL_DRETS = Object.freeze(['section.notes.drets.titol', 'Contingut amb drets reservats']);
/* Gauntlet R22 (notes-06) · El Mur no cita el nom de qui signa l'original (connexions.js · presentacio pública:
   l'origen desat no acredita que tinga un perfil públic); sí l'origen, l'enllaç i els drets de l'original
   (payload.copyright). Clau nova: l'anterior ('section.notes.drets.text') prometia l'autoria. */
export const PARELL_TEXT_DRETS = Object.freeze(['section.notes.drets.textCita', 'El pots connectar per a tu. Si el republiques, se’n citaran l’origen, l’enllaç i els drets de l’original; no en copies el contingut sencer sense permís de qui el signa.']);
/** Gauntlet R22 (notes-06) · L'avís de l'editor per a una connexió: qui la signa (dada privada de la persona) i què se'n cita al Mur.
 * Ronda 3 · Al Mur van els drets de l'original com a copyright (NotesContext: netejaDrets(origen.drets)), i els drets
 * porten l'autoria dins («© Pepa Soler», «CC BY 4.0 · Pepa Soler»): el text no promet «sense el nom de qui el signa».
 * I l'enllaç, només si l'original en té una ruta segura (cosDeConnexioPerAlMur avisa quan no). */
export const PARELL_CONNEXIO_EDITABLE = Object.freeze(['section.notes.connexio.textEditableCita', 'Este contingut el signa {autor}. És una còpia teua: el pots editar i el pots canviar de carpeta; compartir-lo el porta al teu Mur citant-ne l’origen, l’enllaç (si en té) i els drets de l’original, que poden portar el nom de qui el signa.']);
/* Integració 261024 (Codex C-02) · El rebuig del servidor per les normes: la
   reserva valenciana de section.moderacio.normes.calAcceptar (textosModeracio.js). */
export const PARELL_MOTIU_NORMES = Object.freeze(['section.moderacio.normes.calAcceptar', 'Per a publicar, cal acceptar les normes de convivència.']);

export const TEXTOS_VISIBILITAT_NOTA = Object.freeze({
  motiuForaster: parellVisibilitat('motiu.foraster', 'Connecta amb el teu compte per a publicar la nota al Mur.'),
  motiuLocal: parellVisibilitat('motiu.local', 'Nota desada en este dispositiu. Connecta un backend per a publicar al Mur.'),
  motiuLocalConnexio: parellVisibilitat('motiu.localConnexio', 'Connexió desada en este dispositiu. Connecta un backend per a compartir-la al Mur.'),
  motiuPublicada: parellVisibilitat('motiu.publicada', 'Retirar una nota del Mur encara no té contracte de dades amb el servidor: la pots actualitzar, però no tornar a fer privada.'),
  /* F03-UI · Amb la capacitat de retirar, però en una vista que no la porta
     (el lector ConnexioDetall): on es fa, no «encara no». */
  motiuRetiraDesDelBloc: parellVisibilitat('motiu.retiraDesDelBloc', 'Des d’ací no es pot retirar: obri la nota a l’editor del teu Bloc de notes per a retirar-la del Mur. Ací només la pots actualitzar.'),
  motiuRetiraDesDelBlocConnexio: parellVisibilitat('motiu.retiraDesDelBlocConnexio', 'Des d’este lector no es pot retirar: obri el contingut a l’editor del teu Bloc de notes per a retirar-lo del Mur. Ací només el pots actualitzar.'),
  /* Verificació R21 (P1) · Una publicació del Mur oberta al Bloc sense cap
     nota (PublicacioEditable, una nota en memòria): la retirada del port va
     per una nota (updateNote) i ací no n'hi ha cap. */
  motiuRetiraSenseNota: parellVisibilitat('motiu.retiraSenseNota', 'Esta publicació no té cap nota al teu Bloc: des d’ací la pots actualitzar, però no retirar-la del Mur.'),
  /* P4 (ordre del Mestre, 261003) · La «Nota sense títol» (notaPreparada.js)
     encara no existix al servidor: es crea amb la primera cosa que s'hi escriu. */
  motiuPreparada: parellVisibilitat('motiu.preparada', 'Escriu alguna cosa a la nota per a poder-la publicar al Mur.'),
  /* Revisió de P4 · Amb text, el motiu és la creació: en camí o sense arribar. */
  motiuPreparadaCreant: parellVisibilitat('motiu.preparadaCreant', 'La nota s’està creant al servidor. D’ací a un moment la podràs publicar al Mur.'),
  motiuPreparadaFallida: parellVisibilitat('motiu.preparadaFallida', 'La nota encara no s’ha pogut crear al servidor: fins que es cree, no es pot publicar al Mur.'),
  /* Publicar és un upsert amb un id estable (publishNote): tornar-ho a provar no
     duplica res. Només per a la xarxa: la resta de motius van amb ErrorPublicacio. */
  errorPublicar: parellVisibilitat('errorPublicar', 'No s’ha pogut publicar al Mur. Torna-ho a provar: si ja havia arribat, s’actualitzarà la mateixa publicació, sense duplicats.'),
  /* Gauntlet R22 (notes-07) · El servidor ha rebutjat la revisió (SDP-MUR-REVISION): l'intent s'ha descartat i
     el pròxim és nou. Mai «es reutilitzarà la mateixa publicació». */
  errorPublicarConflicte: parellVisibilitat('errorPublicarConflicte', 'No s’ha publicat: la nota ha canviat mentrestant, potser en un altre dispositiu. Revisa la versió que tens ara i torna-la a publicar.'),
  /* Gauntlet R22 (dades-01) · Un servidor sense publica_nota_al_mur (2611122200): no s'ha publicat res i reintentar no ho canvia. */
  errorPublicarServidor: parellVisibilitat('errorPublicarServidor', 'No s’ha publicat res: el servidor encara no té la publicació de notes al Mur d’esta versió. Torna-ho a provar quan s’haja actualitzat.'),
  /* Gauntlet R22 (sql-02) · La còpia pública d'una imatge de la nota no s'ha pogut pujar (CODI_PROMOCIO_PUBLICA,
     per exemple SDP-PURGA-004 després d'una retirada): no s'envia res, mai una imatge privada al Mur. */
  errorPublicarImatge: parellVisibilitat('errorPublicarImatge', 'No s’ha publicat res: una imatge de la nota no s’ha pogut fer pública, i la resta d’este poble l’hauria vista trencada. Torna-ho a provar més tard o canvia la imatge.'),
  /* Gauntlet R22 (notes-05) · Un rebuig definitiu de publica_nota_al_mur (SDP-MUR-OWNER, SDP-MUR-PUBLICACIO):
     l'intent es descarta i reintentar igual no ho canvia. Mai «es reutilitzarà la mateixa publicació». */
  errorPublicarRebutjada: parellVisibilitat('errorPublicarRebutjada', 'No s’ha publicat: el servidor no accepta esta publicació amb esta sessió o amb este contingut. Tornar-ho a provar igual no ho canviarà; revisa la nota i la identitat amb què publiques.'),
  signantDesconegut: parellVisibilitat('signantDesconegut', 'una altra identitat'),
  signaturaAliena: parellVisibilitat('signaturaAliena', 'Esta publicació la signa {qui}: canvia a eixa identitat per a actualitzar-la.'),
  desatPendentDetall: parellVisibilitat('desatPendentDetall', 'No es pot publicar fins que es desen els canvis. {detall}'),
  desatPendent: parellVisibilitat('desatPendent', 'No es pot publicar fins que es desen els canvis pendents. Torna-ho a provar d’ací a un moment.'),
  /* Gauntlet R22 (ronda 3, sql-05) · Un camp passa del límit de mida d'una publicació (LIMITS_PUBLICACIO, el
     mateix que fa complir el servidor amb SDP-MUR-MIDA): no s'ha publicat res i reintentar igual no ho canvia. */
  errorPublicarMidaTitol: parellVisibilitat('errorPublicarMidaTitol', 'No s’ha publicat: el títol passa de 1.000 caràcters, el màxim d’una publicació. Escurça’l i torna-la a publicar.'),
  errorPublicarMidaResum: parellVisibilitat('errorPublicarMidaResum', 'No s’ha publicat: l’entradilla passa de 20.000 caràcters, el màxim d’una publicació. Escurça-la i torna-la a publicar.'),
  /* Gauntlet R22 (ronda 4) · passaDe compta l'HTML sencer (marques, atributs i les URI data:), no el text que
     es veu: el motiu parla del contingut, amb el format i les imatges enganxades. */
  errorPublicarMidaCos: parellVisibilitat('errorPublicarMidaCos', 'No s’ha publicat: el contingut de la nota (amb el format i les imatges enganxades) passa de 100.000 caràcters, el màxim d’una publicació. Escurça’l i torna-la a publicar.'),
  errorPublicarMida: parellVisibilitat('errorPublicarMida', 'No s’ha publicat: la nota passa de la mida màxima d’una publicació. Escurça-la i torna-la a publicar.'),
  /* idea61-01 (Gauntlet T7a, 261104) · Una publicació no canvia mai de secció
     (SDP-SEC-002, el trigger sdp_force_author): el motiu diu on viu i les dues
     eixides de veres, mai «torna-ho a provar». Un parell per a cada secció on
     escriu publishNote (seccioDAmbit: 'mur' o 'mercat'). */
  seccioPublicadaMur: parellVisibilitat('seccioPublicada.mur', 'Esta publicació ja és al Mur i no pot canviar de lloc. Per a actualitzar-la, torna a triar a «On es publica?» l’àmbit que tenia; per a publicar-la al Mercat, fes-ne una nota nova.'),
  seccioPublicadaMercat: parellVisibilitat('seccioPublicada.mercat', 'Esta publicació ja és al Mercat i no pot canviar de lloc. Per a actualitzar-la, torna a triar Mercat a «On es publica?»; per a publicar-la en un altre lloc, fes-ne una nota nova.'),
  /* T71b · Un contingut de fora (NotesEditor): els textos de compartir, però
     és una còpia de la persona, que l'edita: no es diu que siga d'altri. */
  externDescripcio: parellVisibilitat('extern.descripcio', 'Este contingut de fora és una còpia teua: el pots editar, i compartir-lo el porta al teu Mur citant-ne l’origen.'),
  /* D1 Opció A (261112) · Qui pot llegir el que ix al Mur. És cert hui, amb
     la fila crua oberta a anon, i ho continuarà sent amb la versió filtrada. */
  lecturaPublica: parellVisibilitat('lecturaPublica', 'Qualsevol persona, també sense compte, ho pot llegir.'),
  /* R21.1 v2 · Capacitats diferents segons identitat; la versió rica no
     es confon amb la projecció anònima. */
  versioPublica: parellVisibilitat('versioPublica', 'Qualsevol persona, també sense compte, en pot llegir la versió anònima filtrada. Les persones membres de poble poden llegir la publicació completa. Sense compte es mostra una versió filtrada: títol, text públic disponible i data, sense fotos, enllaços ni signatura. La versió anònima mai mostra identificadors interns, contacte privat ni ubicació de les fotos.'),
});

/* F03-UI (Onada R21) · Retirar del Mur des del panell en línia de /notes,
   amb la capacitat 'revocacioPublicacions'. La confirmació diu les tres
   coses que passen (desapareix per a tothom; continua privada al Bloc; si es
   republica, ix amb un enllaç nou) i els errors diuen la veritat: pendent no
   és retirada, i un rebuig no es disfressa d'èxit. */
export const TEXTOS_RETIRADA = Object.freeze({
  avis: parellVisibilitat('retirada.avis', 'Desapareixerà del Mur públic per a tothom. La nota continua privada al teu Bloc. Si la tornes a publicar, ixirà com una publicació nova, amb un enllaç nou.'),
  avisMercat: parellVisibilitat('retirada.avisMercat', 'Desapareixerà del Mercat per a tothom. La nota continua privada al teu Bloc. Si la tornes a publicar, ixirà com una publicació nova, amb un enllaç nou.'),
  avisConnexio: parellVisibilitat('retirada.avisConnexio', 'Desapareixerà del Mur públic per a tothom. El contingut continua privat al teu Bloc. Si el tornes a compartir, ixirà com una publicació nova, amb un enllaç nou.'),
  accio: parellVisibilitat('retirada.accio', 'Retirar del Mur'),
  accioMercat: parellVisibilitat('retirada.accioMercat', 'Retirar del Mercat'),
  treballant: parellVisibilitat('retirada.treballant', 'Retirant…'),
  feta: parellVisibilitat('retirada.feta', 'S’ha retirat la publicació. Ara el contingut només el veus tu, al teu Bloc.'),
  /* Verificació R21 (P1) · «es tornarà a provar», no «es farà»: la cua del
     port i el Bloc (NotesContext · reprenRetirades) la tornen a demanar, però
     el servidor encara la pot rebutjar (pendentFallida ho diu). */
  pendent: parellVisibilitat('retirada.pendent', 'La retirada queda pendent: es tornarà a provar quan torne la connexió. Fins que el servidor la confirme, la publicació continua visible.'),
  conflicte: parellVisibilitat('retirada.conflicte', 'No s’ha retirat: la nota ha canviat mentrestant, potser en un altre dispositiu. La publicació continua visible; espera que es recarregue i torna-ho a provar.'),
  permis: parellVisibilitat('retirada.permis', 'No s’ha retirat: el servidor no ho permet amb esta sessió. La publicació continua visible.'),
  desatPendent: parellVisibilitat('retirada.desatPendent', 'No s’ha retirat: abans s’han de desar els canvis pendents d’esta nota. La publicació continua visible; torna-ho a provar d’ací a un moment.'),
  error: parellVisibilitat('retirada.error', 'No s’ha pogut retirar. La publicació continua visible; torna-ho a provar.'),
  jaRetirada: parellVisibilitat('retirada.jaRetirada', 'Esta publicació ja s’ha retirat i no es pot actualitzar. Si la tornes a publicar, ixirà com una publicació nova, amb un enllaç nou.'),
  /* Paperera o esborrat amb el transport caigut: el port (mutacioDeNota) ha
     encuat la retirada i llança l'error original amb revocacioPendent. */
  pendentMoure: parellVisibilitat('retirada.pendentMoure', 'No s’ha pogut moure la nota: continua on estava. La retirada de la publicació queda pendent i es tornarà a provar quan torne la connexió.'),
  pendentBorrar: parellVisibilitat('retirada.pendentBorrar', 'No s’ha pogut borrar la nota: continua on estava. La retirada de la publicació queda pendent i es tornarà a provar quan torne la connexió.'),
  /* Verificació R21 (P1) · Mentre la retirada és pendent: ni publicar ni
     actualitzar (tornaria a pujar la fila que es vol retirar), ni arxivar
     (l'arxiu no retira i trau la nota del Bloc, on es reprén). Si el
     servidor rebutja el reintent (cap transport ni conflicte), es diu. */
  pendentBloqueja: parellVisibilitat('retirada.pendentBloqueja', 'Esta nota té una retirada del Mur pendent: no es pot publicar ni actualitzar fins que el servidor la confirme.'),
  pendentArxiu: parellVisibilitat('retirada.pendentArxiu', 'No s’ha arxivat: la retirada del Mur d’esta nota encara és pendent. Torna-ho a provar quan el servidor la confirme.'),
  pendentFallida: parellVisibilitat('retirada.pendentFallida', 'La retirada pendent no s’ha pogut fer: el servidor no l’ha acceptada. La publicació continua visible; torna-la a retirar.'),
});
const R = TEXTOS_RETIRADA;

/** F03-UI · Un text de la retirada en la llengua de `t`. */
export const textRetirada = (nom, t = null) => (Object.hasOwn(R, nom) ? text(t, R[nom]) : '');

/** F03-UI · El motiu de no haver retirat (o d'haver-ho deixat pendent), amb el
 * `tipus` que el panell en línia llig: 'pendent' es diu com a avís (no és cap
 * fallada de la persona, i la publicació continua visible fins a l'ACK);
 * qualsevol altre, com a error. */
export class ErrorRetirada extends Error {
  constructor(motiu, tipus = 'error') {
    super(motiu);
    this.name = 'ErrorRetirada';
    this.tipus = tipus;
  }
}

/* Baules de l'error (com esRebuigDeSeccio): el codi, l'estat i el missatge
   de l'error i de les seues causes, com a molt quatre. */
function baulesDe(error) {
  const baules = [];
  let baula = error;
  for (let pas = 0; baula && typeof baula === 'object' && pas < 4; pas += 1) {
    baules.push(baula);
    baula = baula.cause;
  }
  return baules;
}

/** F03-UI · Tradueix el rebuig d'updateNote({ isPublished: false }) a un
 * ErrorRetirada. Pura. L'ordre importa: revocacioPendent (mutacioDeNota de
 * backendPort.js, el transport ha caigut i la retirada s'ha encuat) mana; un
 * 409 (CAS de la revisió, senseFila de notes.js) o SDP-MUR-REVISION és un
 * conflicte; un 403, 42501 o SDP-MUR-OWNER/AUTH/TENANT és permís; la resta,
 * l'error genèric. Cap d'ells no diu que s'haja retirat. */
export function errorDeRetirada(error, t = null) {
  if (error instanceof ErrorRetirada) return error;
  if (error?.revocacioPendent === true) return new ErrorRetirada(text(t, R.pendent), 'pendent');
  const baules = baulesDe(error);
  const diu = (re) => baules.some((b) => re.test(`${b.code ?? ''} ${b.codi ?? ''} ${b.message ?? ''}`));
  if (baules.some((b) => b.status === 409) || diu(/\b40001\b|SDP-MUR-REVISION/)) return new ErrorRetirada(text(t, R.conflicte), 'conflicte');
  if (baules.some((b) => b.status === 403) || diu(/\b42501\b|SDP-MUR-(?:OWNER|AUTH|TENANT)/)) return new ErrorRetirada(text(t, R.permis), 'permis');
  return new ErrorRetirada(text(t, R.error), 'error');
}

/* F03-UI · El rebuig d'un UUID de publicació ja retirat: el trigger
   sdp_mur_anti_resurreccio (SDP-MUR-REVOKED, 23514) o la guarda local del port
   (comprovaPublicacioNoRetirada, codi MUR_PUBLICACIO_RETIRADA). Com
   SDP-SEC-002, l'adaptador encara no el traduïx a cap codi neutral: arriba
   dins del missatge («Supabase 400: {…"message":"SDP-MUR-REVOKED: …"}»). */
const CODI_MUR_RETIRADA = /\bSDP-MUR-REVOKED\b/;

/** F03-UI · Cert si `error` (o una de les seues causes) diu que l'UUID ja s'ha retirat. Pura. */
export function esRebuigDeRetirada(error) {
  return baulesDe(error).some((b) => b.codi === 'MUR_PUBLICACIO_RETIRADA'
    || CODI_MUR_RETIRADA.test(`${b.code ?? ''} ${b.message ?? ''}`));
}
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

/* Gauntlet R22 (notes-05) · Els rebuigs definitius de publica_nota_al_mur (2611122200), a més de SDP-SEC-002:
   SDP-MUR-OWNER (la nota, l'acte o l'operació no són d'esta sessió) i SDP-MUR-PUBLICACIO (un acte invàlid o un
   contingut que no es pot publicar). La RPC llança abans de cap escriptura i la transacció es desfà: retirar
   l'intent del diari no perd cap publicació feta. El codi neutral (runtime.js el posa a SDP-MUR-OWNER) o el
   prefix del missatge de la RPC («…"message":"SDP-MUR-PUBLICACIO: …"»), a l'error o a les seues causes. */
const RE_CODI_DEFINITIU = /^SDP-MUR-(?:OWNER|PUBLICACIO)$/;
const RE_REBUIG_DEFINITIU = /(?:^|[\s"'])SDP-MUR-(?:OWNER|PUBLICACIO)(?=:)/;

/** Gauntlet R22 (notes-05) · Cert si `error` (o una causa) és un rebuig definitiu SDP-MUR-OWNER o SDP-MUR-PUBLICACIO. Pura. */
export function esRebuigDefinitiuDePublicacio(error) {
  return baulesDe(error).some((b) => (typeof b.codi === 'string' && RE_CODI_DEFINITIU.test(b.codi))
    || RE_REBUIG_DEFINITIU.test(`${b.code ?? ''} ${b.message ?? ''}`));
}

const MOTIUS_NO_FETA = Object.freeze({
  conflicte: T.errorPublicarConflicte,
  servidor: T.errorPublicarServidor,
  imatge: T.errorPublicarImatge,
  rebutjada: T.errorPublicarRebutjada,
  midaTitol: T.errorPublicarMidaTitol,
  midaResum: T.errorPublicarMidaResum,
  midaCos: T.errorPublicarMidaCos,
  mida: T.errorPublicarMida
});

/** Gauntlet R22 (notes-07, dades-01, sql-02, notes-05) · El motiu d'una publicació que el servidor no ha fet:
 * 'conflicte' (SDP-MUR-REVISION), 'servidor' (sense la RPC atòmica), 'imatge' (la còpia pública d'una imatge
 * no s'ha pogut pujar) o 'rebutjada' (SDP-MUR-OWNER o SDP-MUR-PUBLICACIO). Ronda 3 (sql-05) · 'midaTitol',
 * 'midaResum', 'midaCos' o 'mida' (un camp passa de LIMITS_PUBLICACIO; vegeu motiuDeMida). Un altre tipus,
 * 'conflicte'. */
export function motiuPublicacioNoFeta(tipus = 'conflicte', t = null) {
  return text(t, Object.hasOwn(MOTIUS_NO_FETA, tipus) ? MOTIUS_NO_FETA[tipus] : T.errorPublicarConflicte);
}

/* Gauntlet R22 (ronda 3, sql-05) · Els límits de mida d'una publicació del Mur, el Mercat, l'Agenda o
   Multimèdia que el servidor fa complir en escriure (2611122200 · private.mur_limita_mida): 1.000 caràcters
   de títol (title), 20.000 de resum (description, l'entradilla de la nota) i 100.000 de cos (content). Es
   compten com char_length de PostgreSQL: punts de codi, no unitats UTF-16. El rebuig és SDP-MUR-MIDA (22001):
   la transacció es desfà sencera i reintentar la mateixa publicació no ho canvia. */
export const LIMITS_PUBLICACIO = Object.freeze({ titol: 1000, resum: 20000, cos: 100000 });
const TIPUS_DE_MIDA = new Map([['titol', 'midaTitol'], ['resum', 'midaResum'], ['cos', 'midaCos']]);

/* Els punts de codi d'un text, comptats com a molt fins a sostre + 1 (un cos amb fotos en data: pot fer
   megues: no cal recórrer-lo sencer per a saber que passa del límit). */
function passaDe(text, sostre) {
  if (typeof text !== 'string' || text.length <= sostre) return false;
  let punts = 0;
  for (let i = 0; i < text.length; i += 1) {
    const unitat = text.charCodeAt(i);
    if (unitat >= 0xd800 && unitat <= 0xdbff && i + 1 < text.length) {
      const seguent = text.charCodeAt(i + 1);
      if (seguent >= 0xdc00 && seguent <= 0xdfff) i += 1;
    }
    punts += 1;
    if (punts > sostre) return true;
  }
  return false;
}

/** Ronda 3 (sql-05) · El primer camp que passa de LIMITS_PUBLICACIO ('titol', 'resum' o 'cos'), o null. Pura. */
export function campQuePassaDelLimit({ titol = '', resum = '', cos = '' } = {}) {
  if (passaDe(titol, LIMITS_PUBLICACIO.titol)) return 'titol';
  if (passaDe(resum, LIMITS_PUBLICACIO.resum)) return 'resum';
  if (passaDe(cos, LIMITS_PUBLICACIO.cos)) return 'cos';
  return null;
}

/* El codi neutral (runtime.js el posa a SDP-MUR-MIDA), el SQLSTATE 22001 (string_data_right_truncation) o el
   prefix del missatge del disparador, a l'error o a les seues causes. El camp, del missatge del disparador
   («el títol», «el resum», «el cos»): mai es pinta el text del servidor. */
const RE_REBUIG_MIDA = /(?:^|[\s"'])SDP-MUR-MIDA(?=:)/;
const RE_CAMP_MIDA = /SDP-MUR-MIDA: el (títol|resum|cos) /;
const CAMP_DEL_SERVIDOR = new Map([['títol', 'titol'], ['resum', 'resum'], ['cos', 'cos']]);

/** Ronda 3 (sql-05) · Cert si `error` (o una causa) és el rebuig de mida d'una publicació (SDP-MUR-MIDA, 22001). Pura. */
export function esRebuigDeMida(error) {
  return baulesDe(error).some((b) => b.codi === 'SDP-MUR-MIDA' || b.sqlstate === '22001'
    || RE_REBUIG_MIDA.test(`${b.code ?? ''} ${b.message ?? ''}`));
}

/** Ronda 3 (sql-05) · El motiu d'una publicació massa llarga: el del camp (`camp` o, si no, el que diu el rebuig
 * del servidor) o, si no se sap quin, el general. */
export function motiuDeMida({ camp = null, error = null, t = null } = {}) {
  let quin = TIPUS_DE_MIDA.has(camp) ? camp : null;
  for (const b of quin ? [] : baulesDe(error)) {
    const trobat = RE_CAMP_MIDA.exec(String(b.message ?? ''));
    if (trobat) { quin = CAMP_DEL_SERVIDOR.get(trobat[1]) ?? null; break; }
  }
  return motiuPublicacioNoFeta(quin ? TIPUS_DE_MIDA.get(quin) : 'mida', t);
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
  descripcio: parellVisibilitat('nota.descripcio', 'Mentre no la publiques, la nota és només teua. Publicar-la la porta al Mur de poble.'),
  llegenda: parellVisibilitat('nota.llegenda', 'Visibilitat de la nota'),
  publica: Object.freeze({
    etiqueta: parellVisibilitat('nota.publica.etiqueta', 'Publicada al Mur'),
    /* D1 Opció A (261112) · On ix; qui ho pot llegir ho afig
       ambLecturaPublica, el mateix per a la nota i per a la connexió. */
    explicacio: parellVisibilitat('nota.publica.explicacio', 'Ix al Mur de poble.'),
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
  /* F03-UI · Només amb la retirada disponible (textosDe · retirable), en lloc d'`irreversible`. */
  reversible: parellVisibilitat('nota.reversible', 'Quan vulgues, la podràs retirar i tornarà a ser privada. Si després la tornes a publicar, ixirà com una publicació nova, amb un enllaç nou.'),
});

const PRIVADA_CONNEXIO = parellVisibilitat('connexio.privada.accio', 'Deixar-lo privat');
const PARELLS_CONNEXIO = Object.freeze({
  titol: parellVisibilitat('connexio.titol', 'Qui pot vore este contingut?'),
  /* D4 (excepció del Mestre, 260930) · la connexió s'obri a l'editor: és una
     còpia editable, però l'obra continua sent d'altri i es cita en compartir. */
  descripcio: parellVisibilitat('connexio.descripcioCita', 'És contingut d’altri: a les teues notes el llegixes i el canvies de carpeta, i el pots editar com una còpia teua; compartir-lo el porta al teu Mur citant-ne l’origen i l’enllaç.'),
  llegenda: parellVisibilitat('connexio.llegenda', 'Visibilitat del contingut'),
  publica: Object.freeze({
    etiqueta: parellVisibilitat('connexio.publica.etiqueta', 'Compartit al teu Mur'),
    /* Poliment W3C · cosDeConnexioPerAlMur (connexions.js) sempre cita d'on
       ve i l'element, però l'autor només si l'origen el porta: una pàgina
       connectada no en té cap (objecteDePagina). */
    explicacio: parellVisibilitat('connexio.publica.explicacio', 'Ix al teu Mur citant-ne l’origen.'),
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
  reversible: parellVisibilitat('connexio.reversible', 'Quan vulgues, el podràs retirar i tornarà a ser privat. Si després el tornes a compartir, ixirà com una publicació nova, amb un enllaç nou.'),
});

const grupDe = (parells, t) => Object.freeze(Object.fromEntries(Object.entries(parells).map(([camp, parell]) => [camp, text(t, parell)])));

/* D1 Opció A (261112) · Si el servidor ja servix el Mur al públic com una
   versió filtrada (kit SQL R21 de Codex: revoca el SELECT cru d'anon sobre
   section_submissions i crea public.llig_mur_public). Mentre siga false, cap
   text no promet què hi ix i què no. La prova d'acoblament
   (config/i18n.murPublic.test.js) falla si és true i el catàleg de
   migracions no fa eixes dues coses.
   F03-UI (Onada R21) · true: 2611121430_mur_foraster_projeccio_publica_opcio_a
   revoca la taula i les columnes a anon i crea la RPC. */
export const MUR_PUBLIC_FILTRAT = true;

/** D1 Opció A (261112) · Qui pot llegir el que ix al Mur i, només amb la
 * versió pública filtrada al servidor (`filtrat`), què en llig i què no hi ix mai. */
export function textLecturaPublica(t = null, filtrat = MUR_PUBLIC_FILTRAT) {
  return text(t, filtrat ? T.versioPublica : T.lecturaPublica);
}

/** D1 Opció A (261112) · L'explicació de publicar o compartir, i darrere, en la mateixa llengua, qui ho pot llegir. */
const ambLecturaPublica = (explicacio, t) => `${explicacio} ${textLecturaPublica(t)}`;

/** L'objecte que pinta el selector: la mateixa forma de sempre, en la llengua de `t`.
 * F03-UI · Amb `retirable` (la vista retira de veres, amb la capacitat del
 * port), `reversible` diu que es podrà retirar i `irreversible` no ix; sense,
 * com sempre: `irreversible` avisa que encara no es pot. */
function textosDe(parells, t, retirable = false) {
  return Object.freeze({
    titol: text(t, parells.titol),
    descripcio: text(t, parells.descripcio),
    llegenda: text(t, parells.llegenda),
    publica: Object.freeze({ ...grupDe(parells.publica, t), explicacio: ambLecturaPublica(text(t, parells.publica.explicacio), t) }),
    privada: grupDe(parells.privada, t),
    reversible: retirable ? text(t, parells.reversible) : null,
    irreversible: retirable ? null : text(t, parells.irreversible),
    avisPublica: null,
  });
}

/* En valencià, un sol objecte per a cada cas: la identitat de sempre. */
const NOTA = textosDe(PARELLS_NOTA, null);
const CONNEXIO = textosDe(PARELLS_CONNEXIO, null);
const NOTA_RETIRABLE = textosDe(PARELLS_NOTA, null, true);
const CONNEXIO_RETIRABLE = textosDe(PARELLS_CONNEXIO, null, true);
const ambDescripcioExterna = (textos, t) => Object.freeze({ ...textos, descripcio: text(t, T.externDescripcio) });
const EXTERN = ambDescripcioExterna(CONNEXIO, null);
const EXTERN_RETIRABLE = ambDescripcioExterna(CONNEXIO_RETIRABLE, null);

/** Els textos del selector: nota pròpia o connectada. Amb `t`, un objecte nou
 * amb la mateixa forma (sense cau: qui crida fa useMemo sobre `t`).
 * F03-UI · `retirable`: la vista oferix retirar-la del Mur (vegeu textosDe). */
export function textosDeNota({ connexio = false, t = null, retirable = false } = {}) {
  if (typeof t !== 'function') {
    if (retirable) return connexio ? CONNEXIO_RETIRABLE : NOTA_RETIRABLE;
    return connexio ? CONNEXIO : NOTA;
  }
  return textosDe(connexio ? PARELLS_CONNEXIO : PARELLS_NOTA, t, Boolean(retirable));
}

/** T71b · El selector d'un contingut de fora: els textos de compartir, però
 * és una còpia de la persona, que l'edita (abans TEXTOS_EXTERN de NotesEditor). */
export function textosExtern(t = null, { retirable = false } = {}) {
  if (typeof t === 'function') return ambDescripcioExterna(textosDeNota({ connexio: true, t, retirable }), t);
  return retirable ? EXTERN_RETIRABLE : EXTERN;
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
 *   · una nota ja publicada no es pot retirar del Mur sense contracte
 *     (`retirada` 'no', el de sempre). F03-UI · Amb la capacitat del port:
 *     'aci', la vista la retira (l'editor del Bloc) i no hi ha bloqueig;
 *     'bloc', la vista no la retira (el lector ConnexioDetall) i el motiu diu
 *     on es fa; 'senseNota', una publicació oberta sense cap nota
 *     (PublicacioEditable) que des d'ací no es pot retirar.
 */
export function bloqueigDeNota({ foraster = false, modeLocal = false, publicada = false, connexio = false, preparada = false, retirada = 'no', t = null } = {}) {
  if (modeLocal) return { opcio: 'publica', motiu: motiuModeLocal({ connexio, t }) };
  if (foraster) return { opcio: 'publica', motiu: text(t, T.motiuForaster) };
  if (preparada) {
    const parell = typeof preparada === 'string' && Object.hasOwn(MOTIUS_PREPARADA, preparada) ? MOTIUS_PREPARADA[preparada] : T.motiuPreparada;
    return { opcio: 'publica', motiu: text(t, parell) };
  }
  if (publicada) {
    if (retirada === 'aci') return null;
    if (retirada === 'bloc') return { opcio: 'privada', motiu: text(t, connexio ? T.motiuRetiraDesDelBlocConnexio : T.motiuRetiraDesDelBloc) };
    if (retirada === 'senseNota') return { opcio: 'privada', motiu: text(t, T.motiuRetiraSenseNota) };
    return { opcio: 'privada', motiu: text(t, T.motiuPublicada) };
  }
  return null;
}

/* Onada R20 (Bucle 1 · UX Pedra Seca en línia a /notes, cas Damià Llorens) ·
   Textos inequívocs per al panell en línia (zero modals flotants), preservant
   intacte textosDeNota per a SelectorVisibilitat i ConnexioDetall. */
const PARELLS_EN_LINIA = Object.freeze({
  llegenda: parellVisibilitat('enLinia.llegenda', 'Visibilitat i publicació de la nota'),
  privadaEtiqueta: parellVisibilitat('enLinia.privada.etiqueta', '🔒 Esborrany privat (només per a tu)'),
  privadaExplicacio: parellVisibilitat('enLinia.privada.explicacio', 'Es desa automàticament al teu Bloc de notes i ningú més la pot vore.'),
  publicaEtiqueta: parellVisibilitat('enLinia.publica.etiqueta', '📣 Públic al Mur de poble'),
  publicaEtiquetaMercat: parellVisibilitat('enLinia.publica.etiquetaMercat', '📣 Públic al Mercat de poble'),
  publicaEtiquetaConnexio: parellVisibilitat('enLinia.publica.etiquetaConnexio', '📣 Compartit al Mur de poble'),
  publicaExplicacio: parellVisibilitat('enLinia.publica.explicacio', 'Es publica amb la teua signatura i ix al Mur de poble.'),
  /* honestedat_textos-10 (R21) · Una publicació del Mercat ix al Mercat, no al
     Mur: l'explicació i l'avís de no poder-la retirar ho diuen. */
  publicaExplicacioMercat: parellVisibilitat('enLinia.publica.explicacioMercat', 'Es publica amb la teua signatura i ix al Mercat de poble.'),
  irreversibleMercat: parellVisibilitat('enLinia.irreversibleMercat', 'Una vegada al Mercat, encara no es pot retirar: la podràs actualitzar, però no tornar a fer privada.'),
  publicaExplicacioConnexio: parellVisibilitat('enLinia.publica.explicacioConnexioCita', 'Es compartix al Mur citant-ne l’origen i l’enllaç.'),
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

export function textosEnLiniaDeNota({ connexio = false, extern = false, dretsReservats = false, seccio = 'mur', retirable = false, t = null } = {}) {
  const esCita = Boolean(connexio || extern);
  const esMercat = !esCita && seccio === 'mercat';
  const base = textosAmbDrets(extern ? textosExtern(t, { retirable }) : textosDeNota({ connexio: esCita, t, retirable }), dretsReservats, t);
  const etiquetaPublica = esCita
    ? text(t, PARELLS_EN_LINIA.publicaEtiquetaConnexio)
    : esMercat
      ? text(t, PARELLS_EN_LINIA.publicaEtiquetaMercat)
      : text(t, PARELLS_EN_LINIA.publicaEtiqueta);
  /* D1 Opció A (261112) · El panell de /notes diu també qui ho pot llegir. */
  const explicacioPublica = ambLecturaPublica(esCita
    ? text(t, PARELLS_EN_LINIA.publicaExplicacioConnexio)
    : text(t, esMercat ? PARELLS_EN_LINIA.publicaExplicacioMercat : PARELLS_EN_LINIA.publicaExplicacio), t);
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
    irreversible: retirable ? null : (esMercat ? text(t, PARELLS_EN_LINIA.irreversibleMercat) : base.irreversible),
    reversible: base.reversible,
    retirada: retirable ? Object.freeze({ avis: text(t, esCita ? R.avisConnexio : (esMercat ? R.avisMercat : R.avis)), accio: text(t, esMercat ? R.accioMercat : R.accio), treballant: text(t, R.treballant), feta: text(t, R.feta) }) : null,
    avisDrets: dretsReservats ? avisDretsReservats(t) : null,
    estatPublicat: text(t, PARELLS_EN_LINIA.estatPublicat),
    veurePublicacio: text(t, esMercat ? PARELLS_EN_LINIA.veureAlMercat : PARELLS_EN_LINIA.veureAlMur),
    treballant: text(t, PARELLS_EN_LINIA.treballant),
  });
}
