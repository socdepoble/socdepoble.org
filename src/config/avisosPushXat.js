/* B8C-1 (marató 261101_2143; Bloc B8, ordre del Mestre 261101) · Registre dels
   avisos push del Xat: la fase N2 que endolla la subscripció de la fase N1.
   Pur i sense cap import, com avisosNatius.js i compartirNatiu.js: l'entrada
   pròpia (la web) i la nativa hi registren el seu adaptador darrere de la
   bandera, i la interfície (ajustos, sincronització, toc) i l'eixida de la
   sessió (SessionContext) parlen només amb ell. Sense adaptador, tot és inert.

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
   Cap funció no llança, llevat de registrar un adaptador mal format. */

/* La bandera. Una constant literal: Rollup la plega i, apagada, ni l'adaptador
   web ni la subscripció viatgen al paquet. L'encén el Mestre (B8-CLIENT §11). */
export const AVISOS_PUSH_XAT_ACTIUS = false;

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
  SENSE_SERVIDOR: 'sense-servidor',
  ERROR: 'error'
});

/* El codi amb què un desat es rebutja quan la seua generació ja ha passat. */
export const CODI_DESAT_OBSOLET = 'AVISOS_OBSOLET';
/* B8-SERVIDOR §2.9 · `SDP-PUSH-011`: l'adreça és d'una altra persona i esta no
   ho ha triat amb un gest. L'adaptador de dades el pot traduir a este codi o
   deixar passar el missatge del servidor: el registre reconeix les dues formes. */
export const CODI_DISPOSITIU_ALIE = 'AVISOS_ALIE';

const METODES = Object.freeze(['motiu', 'estat', 'activa', 'desactiva', 'sincronitza', 'neteja', 'oblida', 'escoltaToc']);
const TIPUS = new Set(['web', 'natiu']);
const ESTATS = new Set(Object.values(ESTAT_AVISOS));
/* Un motiu que no es pot llegir no s'oferix: el més conservador. */
const MOTIU_ILLEGIBLE = 'sense-suport';

let adaptador = null;
let servidor = null;
let generacio = 0;
let eixint = false;
let ambitEixint = null;
let baixaEnCurs = null;
let estatActual = ESTAT_AVISOS.NO_DISPONIBLE;
let errorActual = null;
/* Les crides a activa i desactiva en vol, de QUALSEVOL generació: no es buida en
   canviar de persona. Serialitza els gestos: el desfés d'un desat obsolet
   (desaOdesfes) no pot matar la subscripció compartida d'un gest nou. */
let ocupades = 0;
let instantania = Object.freeze({
  disponible: false, tipus: null, motiu: null, estat: ESTAT_AVISOS.NO_DISPONIBLE,
  error: null, ocupat: false, ambServidor: false, eixint: false
});
const oients = new Set();
let tocPendent = false;
const oientsToc = new Set();

function motiuDe(a) {
  if (!a) return null;
  try {
    const motiu = a.motiu();
    return typeof motiu === 'string' && motiu ? motiu : null;
  } catch {
    return MOTIU_ILLEGIBLE;
  }
}

/* L'instantània només es reemplaça si algun camp canvia: useSyncExternalStore
   compara per referència i un objecte nou a cada lectura faria un bucle. */
function publica() {
  const nova = {
    disponible: adaptador !== null,
    tipus: adaptador ? adaptador.tipus : null,
    motiu: motiuDe(adaptador),
    estat: estatActual,
    error: errorActual,
    ocupat: ocupades > 0,
    ambServidor: servidor !== null,
    eixint
  };
  if (Object.keys(nova).every((clau) => nova[clau] === instantania[clau])) return;
  instantania = Object.freeze(nova);
  for (const oient of [...oients]) {
    try { oient(); } catch { /* Un oient trencat no talla els altres. */ }
  }
}

/* Un resultat de l'adaptador, amb un estat conegut o 'error'. */
function normalitza(resultat) {
  const estat = resultat && typeof resultat === 'object' && ESTATS.has(resultat.estat) ? resultat.estat : ESTAT_AVISOS.ERROR;
  const error = resultat && typeof resultat === 'object' && typeof resultat.error === 'string' && resultat.error ? resultat.error : null;
  return error ? { estat, error } : { estat };
}

function anota(resultat) {
  const net = normalitza(resultat);
  estatActual = net.estat;
  errorActual = net.error ?? null;
}

/* Una crida a l'adaptador com a promesa que no rebutja mai (null si falla). */
function promesaDe(crida) {
  try {
    return Promise.resolve(crida()).catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}

/* La promesa o, passat `limitMs`, null. No rebutja mai. */
function ambLimit(promesa, limitMs) {
  const ms = typeof limitMs === 'number' && Number.isFinite(limitMs) && limitMs >= 0 ? limitMs : LIMIT_BAIXA_PUSH_MS;
  let temps;
  const limit = new Promise((resol) => { temps = globalThis.setTimeout(() => resol(null), ms); });
  return Promise.race([Promise.resolve(promesa).catch(() => null), limit])
    .finally(() => { globalThis.clearTimeout(temps); });
}

const codiDe = (error) => {
  try { return error?.code ?? error?.codi ?? null; } catch { return null; }
};
const missatgeDe = (error) => {
  try { return String(error?.message ?? ''); } catch { return ''; }
};
const esNoDisponible = (error) => codiDe(error) === 'NO-DISPONIBLE';
const esAlie = (error) => codiDe(error) === CODI_DISPOSITIU_ALIE || missatgeDe(error).includes('SDP-PUSH-011');
const obsolet = () => Object.assign(new Error('Els avisos d’esta sessió ja no hi són.'), { code: CODI_DESAT_OBSOLET, codi: CODI_DESAT_OBSOLET });

/* Les dades d'un aparell, camp a camp (cap altra clau no passa al servidor). */
function dadesDesar(d, gest) {
  const font = d && typeof d === 'object' ? d : {};
  return { plataforma: font.plataforma, adreca: font.adreca, caducaMs: font.caducaMs ?? null, gest };
}
function dadesRetirar(d) {
  const font = d && typeof d === 'object' ? d : {};
  return { plataforma: font.plataforma, adreca: font.adreca };
}

const retiraDe = (s) => (d) => Promise.resolve().then(() => s.retira(dadesRetirar(d)));

/* El desat d'una generació. Si la generació passa (eixida, entrada o una altra
   persona) abans de desar, es rebutja; si passa mentre el servidor desava, es
   retira de cortesia (la sessió d'abans encara és vàlida durant la baixa) i es
   rebutja: l'adaptador desfà la subscripció en lloc d'apuntar-la. */
function desatDeLaGeneracio(gen, gest, enError) {
  return (d) => {
    const s = servidor;
    if (gen !== generacio || s === null) return Promise.reject(obsolet());
    const dades = dadesDesar(d, gest);
    return Promise.resolve()
      .then(() => s.desa(dades))
      .then((resposta) => {
        if (gen === generacio) return resposta;
        Promise.resolve().then(() => s.retira(dadesRetirar(dades))).catch(() => {});
        throw obsolet();
      }, (error) => {
        try { enError(error); } catch { /* només anota */ }
        throw error;
      });
  };
}

/**
 * Registra l'adaptador (l'entrada pròpia o la nativa, darrere de la bandera).
 * Una sola vegada: el mateix torna true i un altre llança Error. Sense
 * adaptador (null) torna false. Mal format → TypeError. No crida estat():
 * zero xarxa i zero permisos en arrencar.
 */
export function registraAvisosPush(nou) {
  if (nou == null) return false;
  if ((typeof nou !== 'object' && typeof nou !== 'function') || !TIPUS.has(nou.tipus) || METODES.some((nom) => typeof nou[nom] !== 'function')) {
    throw new TypeError('[avisosPushXat] L’adaptador necessita tipus (\'web\' o \'natiu\') i motiu(), estat(), activa(), desactiva(), sincronitza(), neteja(), oblida() i escoltaToc().');
  }
  if (adaptador) {
    if (adaptador === nou) return true;
    throw new Error('[avisosPushXat] Els avisos push ja estan registrats.');
  }
  adaptador = nou;
  estatActual = ESTAT_AVISOS.INACTIU;
  errorActual = null;
  try { nou.escoltaToc(toca); } catch { /* Sense tocs, els avisos encara serveixen. */ }
  publica();
  return true;
}

export const avisosPushDisponibles = () => adaptador !== null;

/**
 * El servidor de la persona de la sessió ({ ambit, desa, retira }) o null.
 * Torna false si el refusa: mentre dura una eixida, el mateix àmbit no hi
 * torna (cap desat en vol no pot tornar a apuntar qui ix). Null sempre
 * s'accepta i tanca l'eixida (la sessió ja és fora).
 */
export function fixaServidorAvisosPush(nou) {
  if (nou == null) {
    servidor = null;
    eixint = false;
    ambitEixint = null;
    generacio += 1;
    publica();
    return true;
  }
  if (typeof nou !== 'object' || typeof nou.desa !== 'function' || typeof nou.retira !== 'function' || typeof nou.ambit !== 'string' || !nou.ambit) return false;
  if (eixint && nou.ambit === ambitEixint) return false;
  if (servidor === null || servidor.ambit !== nou.ambit) generacio += 1;
  servidor = nou;
  eixint = false;
  ambitEixint = null;
  publica();
  return true;
}

/** L'estat per a la interfície: un objecte congelat que només canvia quan canvia algun camp. */
export const instantaniaAvisosPush = () => instantania;

/** Per a useSyncExternalStore: fn() a cada canvi. Torna la funció que deixa d'escoltar. */
export function escoltaAvisosPush(fn) {
  if (typeof fn !== 'function') return () => {};
  oients.add(fn);
  return () => { oients.delete(fn); };
}

/**
 * Activa els avisos des del GEST de la persona. SÍNCRONA fins a
 * adaptador.activa (cap espera, cap import() ni cap efecte pel camí: Safari i
 * Firefox perdrien el gest). Sense adaptador → 'no-disponible' i sense
 * servidor → 'sense-servidor', en tots dos casos sense preguntar. Un servidor
 * apagat (NO-DISPONIBLE) també és 'sense-servidor'. Mai rebutja.
 */
export function activaAvisosPush() {
  if (!adaptador) return Promise.resolve({ estat: ESTAT_AVISOS.NO_DISPONIBLE });
  if (servidor === null) return Promise.resolve({ estat: ESTAT_AVISOS.SENSE_SERVIDOR });
  const gen = generacio;
  let noDisponible = false;
  const desa = desatDeLaGeneracio(gen, true, (error) => { if (esNoDisponible(error)) noDisponible = true; });
  let crida;
  try {
    crida = Promise.resolve(adaptador.activa({ desa }));
  } catch {
    crida = Promise.resolve({ estat: ESTAT_AVISOS.ERROR });
  }
  ocupades += 1;
  publica();
  return crida.catch(() => ({ estat: ESTAT_AVISOS.ERROR })).then((resultat) => {
    const net = noDisponible && normalitza(resultat).estat === ESTAT_AVISOS.ERROR
      ? { estat: ESTAT_AVISOS.SENSE_SERVIDOR }
      : normalitza(resultat);
    ocupades = Math.max(0, ocupades - 1);
    if (gen === generacio) anota(net);
    publica();
    return net;
  });
}

/**
 * La persona apaga els avisos: desfà la subscripció i la retira del servidor.
 * Amb { local: true }, només la baixa d'este aparell (cap retirada). Mai rebutja.
 */
export function desactivaAvisosPush(opcions = {}) {
  if (!adaptador) return Promise.resolve({ estat: ESTAT_AVISOS.NO_DISPONIBLE });
  const local = opcions?.local === true;
  const gen = generacio;
  const s = servidor;
  const a = adaptador;
  const crida = promesaDe(() => a.desactiva({ retira: !local && s !== null ? retiraDe(s) : null }));
  ocupades += 1;
  publica();
  return crida.then((resultat) => {
    const net = normalitza(resultat);
    ocupades = Math.max(0, ocupades - 1);
    if (gen === generacio) anota(net);
    publica();
    return net;
  });
}

/**
 * Sincronitza sense preguntar MAI (en entrar, en canviar de persona, en tornar
 * a la vista). Durant una eixida no fa res. Espera la baixa d'una entrada a mà
 * abans de llegir la subscripció. Sense servidor fa d'interruptor: l'adaptador
 * desfà la subscripció (per això la interfície no la crida amb la sessió fora).
 * Si el servidor diu que l'aparell és d'una altra persona (SDP-PUSH-011), baixa
 * local i 'inactiu'. Mai rebutja.
 */
export async function sincronitzaAvisosPush() {
  if (!adaptador) return { estat: ESTAT_AVISOS.NO_DISPONIBLE };
  if (eixint) return { estat: estatActual };
  const pendent = baixaEnCurs;
  if (pendent) await pendent;
  if (eixint) return { estat: estatActual };
  const a = adaptador;
  const gen = generacio;
  const s = servidor;
  let alie = false;
  const desa = s !== null ? desatDeLaGeneracio(gen, false, (error) => { if (esAlie(error)) alie = true; }) : undefined;
  const retira = s !== null ? retiraDe(s) : undefined;
  let net = normalitza(await promesaDe(() => a.sincronitza({ actiu: s !== null, desa, retira, ambit: s !== null ? s.ambit : undefined })));
  if (alie && gen === generacio) {
    const baixa = normalitza(await promesaDe(() => a.desactiva({ retira: null })));
    net = baixa.estat === ESTAT_AVISOS.ERROR ? baixa : { estat: ESTAT_AVISOS.INACTIU };
  }
  if (gen === generacio) {
    anota(net);
    publica();
  }
  return net;
}

/** Tanca els avisos del Xat ja mostrats i la insígnia (en tornar a la vista). Mai rebutja. */
export function netejaAvisosPushMostrats() {
  if (!adaptador) return Promise.resolve();
  const a = adaptador;
  return promesaDe(() => a.neteja()).then(() => undefined);
}

/**
 * L'eixida de veres, ABANS de tancar la sessió (encara vàlida, per a retirar
 * l'aparell al servidor). Primer marca l'eixida (cap desat en vol no torna a
 * apuntar, i el mateix àmbit no pot tornar a fixar el servidor fins que la
 * sessió siga fora) i després la baixa amb retirada, com a molt `limitMs`.
 * Mai rebutja.
 */
export function baixaAvisosPushEnEixir(opcions = {}) {
  const s = servidor;
  /* Una segona crida (doble clic) no esborra l'àmbit de qui ix. */
  ambitEixint = s !== null ? s.ambit : (eixint ? ambitEixint : null);
  eixint = true;
  servidor = null;
  generacio += 1;
  const gen = generacio;
  /* Des d'ara, per a la interfície, el push d'esta sessió és apagat (D-B8C-8);
     si la baixa no pot desfer la subscripció, el resultat ho dirà ('error'). */
  estatActual = ESTAT_AVISOS.INACTIU;
  errorActual = null;
  publica();
  if (!adaptador) return Promise.resolve();
  const a = adaptador;
  const baixa = promesaDe(() => a.desactiva({ retira: s !== null ? retiraDe(s) : null })).then((resultat) => {
    if (gen === generacio && resultat) {
      anota(resultat);
      publica();
    }
  });
  return ambLimit(baixa, opcions?.limitMs).then(() => undefined);
}

/**
 * Després de tancar la sessió, només si ha anat bé: la baixa local (de nou,
 * idempotent i sense retirada: si la primera ha fallat, el servei de push ja
 * té l'endpoint mort), l'oblit dels desats d'esta càrrega i la neteja dels
 * avisos mostrats. L'estat torna a 'inactiu'. NO lleva l'eixida: la lleva la
 * interfície quan veu la sessió fora o una persona diferent. Mai rebutja.
 */
export function oblidaAvisosPushEnEixir(opcions = {}) {
  if (!adaptador) return Promise.resolve();
  const a = adaptador;
  generacio += 1;
  const gen = generacio;
  try { a.oblida(); } catch { /* memòria d'esta càrrega: res a esperar */ }
  const feina = Promise.all([promesaDe(() => a.desactiva({ retira: null })), promesaDe(() => a.neteja())]);
  return ambLimit(feina, opcions?.limitMs).then(() => {
    if (gen !== generacio) return;
    estatActual = ESTAT_AVISOS.INACTIU;
    errorActual = null;
    publica();
  });
}

/**
 * Si tancar la sessió ha fallat, la persona continua dins (D-B8C-8): el push
 * ja és apagat i el registre torna a admetre el seu servidor, perquè el puga
 * tornar a encendre.
 */
export function reprenAvisosPushTrasEixidaFallida() {
  eixint = false;
  ambitEixint = null;
  publica();
}

/**
 * Una entrada explícita (contrasenya, registre, testimoni natiu, pilot) obri
 * la sessió d'una persona que pot ser una altra: baixa LOCAL de la subscripció
 * que hi haja (sense retirada: encara no hi ha sessió), com a molt `limitMs`.
 * Qui entra no l'espera; sincronitzaAvisosPush, sí. Una entrada nova també
 * tanca una eixida que la interfície no haja vist acabar. Mai rebutja.
 */
export function baixaLocalAvisosPushEnEntrar(opcions = {}) {
  eixint = false;
  ambitEixint = null;
  if (!adaptador) {
    publica();
    return Promise.resolve();
  }
  const a = adaptador;
  generacio += 1;
  const gen = generacio;
  const baixa = ambLimit(promesaDe(() => a.desactiva({ retira: null })), opcions?.limitMs).then((resultat) => {
    if (gen === generacio && resultat) anota(resultat);
    if (baixaEnCurs === baixa) baixaEnCurs = null;
    publica();
  });
  baixaEnCurs = baixa;
  publica();
  return baixa;
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
