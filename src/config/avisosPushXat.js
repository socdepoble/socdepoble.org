/* B8C-1 (marató 261101_2143; Bloc B8, ordre del Mestre 261101) · Registre dels
   avisos push del Xat: la fase N2 que endolla la subscripció de la fase N1.
   Pur i sense cap import, com avisosNatius.js i compartirNatiu.js: l'entrada
   pròpia (la web) i la nativa hi registren el seu adaptador darrere de la
   bandera, i la interfície (ajustos, sincronització, toc) i l'eixida de la
   sessió (SessionContext) parlen només amb ell. Sense adaptador, tot és inert.

   Onada R9 · C3 (IDEA-120 / P0-30, ordre del Mestre del 261106) · Este fitxer
   és ara la FAÇANA del registre: la bandera, les constants, el toc i els
   oients. El motor (l'estat, la generació, l'eixida i l'entrada) és a
   motorAvisosPushXat.js i arriba per import() després de l'arrencada, abans
   que l'adaptador; en avaluar-se s'endolla ací (connectaMotorAvisosPush).
   Encendre la bandera amb el motor dins de l'entrada la passava del sostre
   (G8-09). Sense motor, cada funció respon el que el registre responia sense
   adaptador, i registrar un adaptador llança (el motor ha d'arribar primer).
   Cap crida no espera el motor: activaAvisosPush continua síncrona.

   Contracte de l'adaptador (B8-CLIENT §3):
     { tipus: 'web' | 'natiu',
       motiu() → string | null            SÍNCRON i sense xarxa: per què no s'oferix,
       estat() → Promise<{ estat, motiu? }>,
       activa({ desa }) → Promise<{ estat, error? }>    des d'un gest, sense cap espera prèvia,
       desactiva({ retira }) → Promise<{ estat }>        retira null: baixa només local,
       sincronitza({ actiu, desa, retira, ambit }) → Promise<{ estat, error? }>   mai pregunta,
       neteja() → Promise<void>, oblida() → void, escoltaToc(fn) → () => void }
   desa(d) i retira(d) són del servidor que la interfície fixa per a la persona
   de la sessió (fixaServidorAvisosPush); d = { plataforma: 'web'|'ios'|'android',
   adreca, caducaMs?, gest? }. El registre hi posa `gest` ell mateix: cert des
   d'activa (el gest de la persona), fals des de sincronitza.

   Regles:
     · registrar no pregunta res, no crida cap xarxa i no demana cap permís;
     · activaAvisosPush és SÍNCRONA fins a adaptador.activa: el gest no es perd;
     · cada eixida, entrada o canvi de persona avança la `generacio`: un desat
       en vol d'una generació vella es rebutja i el seu resultat no es publica;
     · eixir i entrar a mà no es pengen mai: la baixa té límit propi i no rebutja;
     · el toc d'un avís no porta cap dada: la interfície resol el destí amb la
       sessió actual (src/sections/xat/destiDelAvis.js), mai amb res que vinga
       del servei de push.
   Cap funció no llança, llevat de registrar un adaptador mal format (o sense
   el motor). */

/* La bandera. Una constant literal: Rollup la plega i, apagada, ni el motor,
   ni l'adaptador web ni la subscripció viatgen al paquet. L'ha encesa el
   Mestre (ordre del 261106, IDEA-120 / P0-30), amb /legal 2.5 (apartats 8 i
   11) que ja diu què passa per Apple APNs, Google FCM i el servei de push del
   navegador (B8-CLIENT §11; legal.iaia.test.js, B8). Sense clau pública VAPID
   a l'entorn, l'adaptador web diu 'sense-clau' i no s'oferix res. */
export const AVISOS_PUSH_XAT_ACTIUS = true;

/** El temps màxim de la baixa en eixir o en entrar: mai bloqueja la sessió. */
export const LIMIT_BAIXA_PUSH_MS = 2500;

/** Els estats que veu la interfície (els de l'adaptador web, del natiu i del registre). */
export const ESTAT_AVISOS = Object.freeze({
  NO_DISPONIBLE: 'no-disponible',
  NO_OFERIT: 'no-oferit',
  INACTIU: 'inactiu',
  ACTIU: 'actiu',
  DENEGAT: 'denegat',
  SENSE_GEST: 'sense-gest',
  SENSE_WORKER: 'sense-worker',
  SENSE_CONNECTOR: 'sense-connector',
  /* Sanejament R15 (B3) · L'app nativa compilada sense VITE_SDP_PUSH_NATIU=1: no s'oferix res. */
  SENSE_CONFIG: 'sense-config',
  SENSE_SERVIDOR: 'sense-servidor',
  ERROR: 'error'
});

/* El codi amb què un desat es rebutja quan la seua generació ja ha passat. */
export const CODI_DESAT_OBSOLET = 'AVISOS_OBSOLET';
/* B8-SERVIDOR §2.9 · `SDP-PUSH-011`: l'adreça és d'una altra persona i esta no
   ho ha triat amb un gest. L'adaptador de dades el pot traduir a este codi o
   deixar passar el missatge del servidor: el registre reconeix les dues formes. */
export const CODI_DISPOSITIU_ALIE = 'AVISOS_ALIE';

/* El motor (motorAvisosPushXat.js), quan ha arribat. Fins aleshores no hi ha
   adaptador possible: l'única cosa que pot passar és que la sessió comence a
   eixir (o hi torne), i això es recorda per al motor. */
let motor = null;
let eixintSenseMotor = false;
const SENSE_MOTOR = [false, true].map((eixint) => Object.freeze({
  disponible: false, tipus: null, motiu: null, estat: ESTAT_AVISOS.NO_DISPONIBLE,
  error: null, ocupat: false, ambServidor: false, eixint
}));
const oients = new Set();
let tocPendent = false;
const oientsToc = new Set();

/* Avisa els oients de l'instantània (el motor, cada vegada que la seua canvia). */
function avisa() {
  for (const oient of [...oients]) {
    try { oient(); } catch { /* Un oient trencat no talla els altres. */ }
  }
}

/* L'eixida sense motor: només canvia el camp `eixint` de l'instantània. */
function eixidaSenseMotor(valor) {
  if (eixintSenseMotor === valor) return;
  eixintSenseMotor = valor;
  avisa();
}

/* El toc d'un avís: cap dada, ni la de l'adaptador. Si encara no escolta
   ningú (l'app oberta des de l'avís), queda un sol toc pendent. */
function toca() {
  if (!oientsToc.size) {
    tocPendent = true;
    return;
  }
  for (const oient of [...oientsToc]) {
    try { oient({}); } catch { /* Un oient trencat no talla els altres. */ }
  }
}

/**
 * L'endoll del motor: només el crida motorAvisosPushXat.js en avaluar-se.
 * Una sola vegada (un segon motor torna false i no canvia res). Li dona el
 * toc, l'avís als oients i si la sessió ja eixia; els oients ho saben de seguida.
 */
export function connectaMotorAvisosPush(nou) {
  if (motor !== null || !nou || typeof nou !== 'object' || typeof nou.enllaca !== 'function') return false;
  motor = nou;
  try { nou.enllaca({ toca, avisa, eixint: eixintSenseMotor }); } catch { /* el motor és pur: no hi passa */ }
  avisa();
  return true;
}

/**
 * Registra l'adaptador (l'entrada pròpia o la nativa, darrere de la bandera).
 * Una sola vegada: el mateix torna true i un altre llança Error. Sense
 * adaptador (null) torna false. Mal format → TypeError. Sense el motor →
 * Error (l'entrada el carrega abans de l'adaptador). No crida estat():
 * zero xarxa i zero permisos en arrencar.
 */
export function registraAvisosPush(nou) {
  if (nou == null) return false;
  if (motor === null) throw new Error('[avisosPushXat] El motor dels avisos push encara no ha arribat.');
  return motor.registra(nou);
}

export const avisosPushDisponibles = () => (motor !== null && motor.disponibles());

/**
 * El servidor de la persona de la sessió ({ ambit, desa, retira }) o null.
 * Torna false si el refusa: mentre dura una eixida, el mateix àmbit no hi
 * torna (cap desat en vol no pot tornar a apuntar qui ix). Null sempre
 * s'accepta i tanca l'eixida (la sessió ja és fora). Sense motor no hi ha on
 * guardar-lo: es refusa (la interfície només el fixa amb un adaptador).
 */
export function fixaServidorAvisosPush(nou) {
  if (motor !== null) return motor.fixaServidor(nou);
  if (nou != null) return false;
  eixidaSenseMotor(false);
  return true;
}

/** L'estat per a la interfície: un objecte congelat que només canvia quan canvia algun camp. */
export const instantaniaAvisosPush = () => (motor !== null ? motor.instantania() : SENSE_MOTOR[eixintSenseMotor ? 1 : 0]);

/** Per a useSyncExternalStore: fn() a cada canvi. Torna la funció que deixa d'escoltar. */
export function escoltaAvisosPush(fn) {
  if (typeof fn !== 'function') return () => {};
  oients.add(fn);
  return () => { oients.delete(fn); };
}

/**
 * Activa els avisos des del GEST de la persona. SÍNCRONA fins a
 * adaptador.activa (cap espera, cap import() ni cap efecte pel camí: Safari i
 * Firefox perdrien el gest). Sense adaptador (o sense motor) → 'no-disponible'
 * i sense servidor → 'sense-servidor', en tots dos casos sense preguntar. Un
 * servidor apagat (NO-DISPONIBLE) també és 'sense-servidor'. Mai rebutja.
 */
export function activaAvisosPush() {
  return motor !== null ? motor.activa() : Promise.resolve({ estat: ESTAT_AVISOS.NO_DISPONIBLE });
}

/**
 * La persona apaga els avisos: desfà la subscripció i la retira del servidor.
 * Amb { local: true }, només la baixa d'este aparell (cap retirada). Mai rebutja.
 */
export function desactivaAvisosPush(opcions = {}) {
  return motor !== null ? motor.desactiva(opcions) : Promise.resolve({ estat: ESTAT_AVISOS.NO_DISPONIBLE });
}

/**
 * Sincronitza sense preguntar MAI (en entrar, en canviar de persona, en tornar
 * a la vista). Durant una eixida no fa res. Espera la baixa d'una entrada a mà
 * abans de llegir la subscripció. Sense servidor fa d'interruptor: l'adaptador
 * desfà la subscripció (per això la interfície no la crida amb la sessió fora).
 * Si el servidor diu que l'aparell és d'una altra persona (SDP-PUSH-011), baixa
 * local i 'inactiu'. Mai rebutja.
 */
export function sincronitzaAvisosPush() {
  return motor !== null ? motor.sincronitza() : Promise.resolve({ estat: ESTAT_AVISOS.NO_DISPONIBLE });
}

/** Tanca els avisos del Xat ja mostrats i la insígnia (en tornar a la vista). Mai rebutja. */
export function netejaAvisosPushMostrats(opcions) {
  return motor !== null ? motor.neteja(opcions) : Promise.resolve();
}

/* R54: una lectura confirmada només pot netejar el wake que ja coneixia
   abans de començar. Ni el token ni el zero contenen dades de conversa. */
export const capturaLecturaAvisosPush = ambit => motor?.capturaLectura?.(ambit) ?? null;
export const confirmaZeroAvisosPush = lectura => motor?.confirmaZero?.(lectura) ?? Promise.resolve();

/**
 * L'eixida de veres, ABANS de tancar la sessió (encara vàlida, per a retirar
 * l'aparell al servidor). Primer marca l'eixida (cap desat en vol no torna a
 * apuntar, i el mateix àmbit no pot tornar a fixar el servidor fins que la
 * sessió siga fora) i després la baixa amb retirada, com a molt `limitMs`.
 * Mai rebutja.
 */
export function baixaAvisosPushEnEixir(opcions = {}) {
  if (motor !== null) return motor.baixaEnEixir(opcions);
  eixidaSenseMotor(true);
  return Promise.resolve();
}

/**
 * Després de tancar la sessió, només si ha anat bé: la baixa local (de nou,
 * idempotent i sense retirada: si la primera ha fallat, el servei de push ja
 * té l'endpoint mort), l'oblit dels desats d'esta càrrega i la neteja dels
 * avisos mostrats. L'estat torna a 'inactiu'. NO lleva l'eixida: la lleva la
 * interfície quan veu la sessió fora o una persona diferent. Mai rebutja.
 */
export function oblidaAvisosPushEnEixir(opcions = {}) {
  return motor !== null ? motor.oblidaEnEixir(opcions) : Promise.resolve();
}

/**
 * Si tancar la sessió ha fallat, la persona continua dins (D-B8C-8): el push
 * ja és apagat i el registre torna a admetre el seu servidor, perquè el puga
 * tornar a encendre.
 */
export function reprenAvisosPushTrasEixidaFallida() {
  if (motor !== null) motor.reprenTrasEixidaFallida();
  else eixidaSenseMotor(false);
}

/**
 * Una entrada explícita (contrasenya, registre, testimoni natiu, pilot) obri
 * la sessió d'una persona que pot ser una altra: baixa LOCAL de la subscripció
 * que hi haja (sense retirada: encara no hi ha sessió), com a molt `limitMs`.
 * Qui entra no l'espera; sincronitzaAvisosPush, sí. Una entrada nova també
 * tanca una eixida que la interfície no haja vist acabar. Mai rebutja.
 */
export function baixaLocalAvisosPushEnEntrar(opcions = {}) {
  if (motor !== null) return motor.baixaLocalEnEntrar(opcions);
  eixidaSenseMotor(false);
  return Promise.resolve();
}

/** La persona ha tocat un avís: fn({}), sense cap dada. El toc pendent es lliura una sola vegada. */
export function escoltaTocAvisPush(fn) {
  if (typeof fn !== 'function') return () => {};
  oientsToc.add(fn);
  if (tocPendent) {
    tocPendent = false;
    try { fn({}); } catch { /* Ídem. */ }
  }
  return () => { oientsToc.delete(fn); };
}
