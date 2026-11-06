/* Onada R9 · C3 (IDEA-120 / P0-30, ordre del Mestre del 261106) · El motor del
   registre dels avisos push del Xat. És el cos de B8C-1 (marató 261101_2143)
   que vivia a avisosPushXat.js, mogut tal com era: amb la bandera encesa,
   portar-lo a l'entrada passava el sostre del paquet (G8-09, +1.513 B gzip).
   Ara el carrega, després de l'arrencada i abans de l'adaptador, el mateix
   import() que porta l'adaptador (src/main.jsx a la web,
   src/natiu/entrada.jsx a l'app); en avaluar-se s'endolla a la façana
   (connectaMotorAvisosPush), que és l'única que importa la interfície.

   Què ha canviat respecte a B8C-1, i res més:
     · la bandera i les constants són de la façana (d'allí les importa);
     · el toc d'un avís (l'oient i el toc pendent) és de la façana: un toc
       d'abans que el motor arribe no es pot perdre;
     · els oients de l'instantània són de la façana: el motor li avisa;
     · una eixida començada abans que el motor arribe continua sent eixida.
   Les regles (el gest síncron, la generació, l'eixida i l'entrada que no es
   pengen, el toc sense dades, l'instantània estable) són les de la capçalera
   d'avisosPushXat.js i les guarda avisosPushXat.test.js, que carrega els dos
   mòduls. Pur i sense cap més import: ni el worker, ni el pont natiu, ni cap
   emmagatzematge. */
import {
  CODI_DESAT_OBSOLET, CODI_DISPOSITIU_ALIE, ESTAT_AVISOS, LIMIT_BAIXA_PUSH_MS, connectaMotorAvisosPush
} from './avisosPushXat.js';

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
/* Els ganxos de la façana: el toc (cap dada) i l'avís als oients. */
let ganxos = { toca: () => {}, avisa: () => {} };

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
  try { ganxos.avisa(); } catch { /* La façana no llança; per si de cas. */ }
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

function registra(nou) {
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
  try { nou.escoltaToc(ganxos.toca); } catch { /* Sense tocs, els avisos encara serveixen. */ }
  publica();
  return true;
}

function fixaServidor(nou) {
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

function activa() {
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

function desactiva(opcions = {}) {
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

async function sincronitza() {
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

function neteja() {
  if (!adaptador) return Promise.resolve();
  const a = adaptador;
  return promesaDe(() => a.neteja()).then(() => undefined);
}

function baixaEnEixir(opcions = {}) {
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

function oblidaEnEixir(opcions = {}) {
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

function reprenTrasEixidaFallida() {
  eixint = false;
  ambitEixint = null;
  publica();
}

function baixaLocalEnEntrar(opcions = {}) {
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

/* L'endoll. La façana dona els ganxos i diu si hi havia una eixida en curs
   (la sessió ja havia començat a eixir abans que el motor arribara): sense
   servidor ni adaptador, l'àmbit de qui ix és nul, com ho hauria estat ací. */
connectaMotorAvisosPush({
  enllaca({ toca, avisa, eixint: eixidaEnCurs }) {
    ganxos = { toca, avisa };
    if (eixidaEnCurs === true) {
      eixint = true;
      publica();
    }
  },
  registra,
  disponibles: () => adaptador !== null,
  fixaServidor,
  instantania: () => instantania,
  activa,
  desactiva,
  sincronitza,
  neteja,
  baixaEnEixir,
  oblidaEnEixir,
  reprenTrasEixidaFallida,
  baixaLocalEnEntrar
});
