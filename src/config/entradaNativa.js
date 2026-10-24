/* Fase D (261020, tasca 1; ordre del Mestre) · Registre de l'entrada nativa
   (Sign in with Apple i Google des del full del sistema). El munta només
   src/natiu/entrada.jsx (pas 0 del §1.2 d'ARQUITECTURA.txt), una sola vegada i
   abans d'arrenca(). A la web, a la PWA i al connector queda buit:
   plataformaNativa() === 'web' i no hi ha cap botó natiu.
   Pur i sense cap import: qualsevol fitxer de src/ el pot llegir sense acostar-se
   mai al natiu (src/natiu/frontera.test.js).
   Contracte de l'adaptador:
     { plataforma: 'ios'|'android', proveidors: ('apple'|'google')[],
       demana(p, { viu }) → Promise<{ testimoni, nonce, testimoniAcces?, nom?, codiAutoritzacio? }>, oblida?(p) }
   T1 (261024; P0-04) · codiAutoritzacio és el codi d'un sol ús que torna el full
   d'Apple (null amb Google): el backend el pot canviar al servidor per a poder
   revocar l'autorització quan la persona es dona de baixa.
   Errors amb `code`: CANCELADA quan la persona tanca el full; qualsevol altre és FALLIDA.
   Fase D (261020, revisió) · viu() fals vol dir que ja no l'espera ningú: si el
   full encara no s'ha obert, l'adaptador no l'obri (CANCELADA). Un dispositiu
   natiu sense cap proveïdor també es registra (proveidors: []): la plataforma
   és la de veres i el Google web no apareix mai dins de l'app.
   Neutral de política: ací només hi ha l'ordre i la regla de botiga d'iOS; quins
   proveïdors hi ha en cada plataforma ho decidix l'adaptador (decisió D7). */
export const PROVEIDORS_NATIUS = Object.freeze(['apple', 'google']);
export const CODI_ENTRADA_NATIVA = Object.freeze({
  CANCELADA: 'entrada-nativa-cancelada',
  FALLIDA: 'entrada-nativa-fallida',
  NO_DISPONIBLE: 'entrada-nativa-no-disponible',
  EN_CURS: 'entrada-nativa-en-curs'
});
const PLATAFORMES = Object.freeze(['ios', 'android']);
/* Només l'ordre i la regla de botiga de la plataforma: a iOS, Apple primer i
   Google NOMÉS si hi ha Apple (App Store 4.8, HIG). Quins hi ha, ho diu l'adaptador. */
const ORDRE = Object.freeze({ ios: Object.freeze(['apple', 'google']), android: Object.freeze(['google', 'apple']) });
const SENSE_BOTONS = Object.freeze([]);
/* Una eixida d'abans (Android: clearCredentialState) pot encavalcar-se amb el full
   següent: la propera demana l'espera, com a molt este temps. */
const TOPALL_OBLIT_MS = 3000;
let registrat = null;
/* Fase D (261020, revisió) · La fase 1 en curs: { proveidor, actual, vius, abandonada }.
   `vius` són els viu() de qui l'espera; abandonaCredencialNativa() els buida. */
let enCurs = null;
let oblitPendent = null;

const errorNatiu = (code, missatge, causa) =>
  Object.assign(new Error(missatge, causa === undefined ? undefined : { cause: causa }), { code });
/* Resol amb la promesa o amb el topall, el que arribe primer; mai rebutja per ell. */
const ambEspera = (promesa, ms) => {
  let id = null;
  return Promise.race([promesa, new Promise((resol) => { id = setTimeout(resol, ms); })]).finally(() => clearTimeout(id));
};
const textNet = (valor) => (typeof valor === 'string' && valor.trim() ? valor.trim() : null);

/**
 * Registra l'adaptador natiu. null no fa res (només la web). Un dispositiu natiu
 * sense cap proveïdor es registra igual, amb proveidors: [] (cap botó, i la
 * plataforma és la seua). Una vegada registrat és immutable: el mateix objecte
 * torna la plataforma, un altre llança.
 * @returns {'ios'|'android'|null}
 */
export function registraEntradaNativa(adaptador) {
  if (adaptador == null) return null;
  const { plataforma, proveidors, demana, oblida = null } = adaptador;
  if (!PLATAFORMES.includes(plataforma)) throw new TypeError(`[entradaNativa] Plataforma desconeguda: ${plataforma}`);
  if (!Array.isArray(proveidors) || proveidors.some((p) => !PROVEIDORS_NATIUS.includes(p))) {
    throw new TypeError('[entradaNativa] Proveïdors fora de PROVEIDORS_NATIUS.');
  }
  if (typeof demana !== 'function' || (oblida !== null && typeof oblida !== 'function')) {
    throw new TypeError('[entradaNativa] L’adaptador necessita demana() i, si en porta, oblida().');
  }
  if (registrat) {
    if (registrat.font === adaptador) return registrat.plataforma;
    throw new Error('[entradaNativa] L’entrada nativa ja està registrada i és immutable.');
  }
  const ofertes = ORDRE[plataforma].filter((p) => proveidors.includes(p));
  const botons = plataforma === 'ios' && !ofertes.includes('apple') ? SENSE_BOTONS : Object.freeze(ofertes);
  registrat = Object.freeze({
    font: adaptador,
    plataforma,
    botons,
    demana: (p, opcions) => demana.call(adaptador, p, opcions),
    oblida: oblida ? (p) => oblida.call(adaptador, p) : null
  });
  return plataforma;
}

/** 'web' (també el connector i la PWA), 'ios' o 'android'. Síncrona. */
export const plataformaNativa = () => registrat?.plataforma ?? 'web';
/** Els botons natius, en l'ordre de la plataforma i amb la regla d'iOS aplicada. */
export const botonsNatius = () => registrat?.botons ?? SENSE_BOTONS;
export const esCancelacioNativa = (e) => e?.code === CODI_ENTRADA_NATIVA.CANCELADA;
/** Cap avís per a la persona: l'ha tancat ella. Fase D (261020, revisió) · EN_CURS
    ja no és silenci: la vista diu que hi ha una altra entrada oberta al telèfon. */
export const esSilenciNatiu = (e) => esCancelacioNativa(e);

/**
 * Fase 1: el full natiu. Sense topall: els fulls natius sempre tornen (l'eixida
 * explícita és «Cancel·la l'entrada»). Una sola alhora: a iOS, Apple només guarda
 * una resposta pendent i una segona deixaria la primera promesa penjada.
 * Fase D (261020, revisió) · Un full no es pot tancar des del JS:
 *   · el mateix proveïdor amb una fase 1 en curs (també abandonada) s'hi
 *     torna a sumar, i el full que apareix és de qui l'espera ara;
 *   · un altre proveïdor rep EN_CURS mentre la primera continua viva; si l'han
 *     abandonada («Cancel·la l'entrada»), en comença una de nova (un full penjat
 *     no bloqueja mai l'altre proveïdor);
 *   · viu() es passa a l'adaptador com «algú encara l'espera».
 * @returns {Promise<Readonly<{ testimoni: string, nonce: string|null, testimoniAcces: string|null, nom: string|null,
 *   codiAutoritzacio: string|null }>>}
 */
export async function demanaCredencialNativa(proveidor, { viu = () => true } = {}) {
  if (!registrat || !registrat.botons.includes(proveidor)) {
    throw errorNatiu(CODI_ENTRADA_NATIVA.NO_DISPONIBLE, 'Esta manera d’entrar no està disponible en este dispositiu.');
  }
  if (enCurs?.proveidor === proveidor) {
    enCurs.abandonada = false;
    enCurs.vius.add(viu);
    return enCurs.actual;
  }
  if (enCurs && !enCurs.abandonada) throw errorNatiu(CODI_ENTRADA_NATIVA.EN_CURS, 'Ja hi ha una entrada en curs.');
  const entrada = { proveidor, actual: null, vius: new Set([viu]), abandonada: false };
  const algunViu = () => [...entrada.vius].some((v) => v());
  entrada.actual = (async () => {
    if (oblitPendent) {
      const oblit = oblitPendent;
      oblitPendent = null;
      await ambEspera(oblit, TOPALL_OBLIT_MS);
    }
    let credencial;
    try {
      credencial = await registrat.demana(proveidor, { viu: algunViu });
    } catch (error) {
      if (esCancelacioNativa(error) || error?.code === CODI_ENTRADA_NATIVA.FALLIDA) throw error;
      throw errorNatiu(CODI_ENTRADA_NATIVA.FALLIDA, 'El telèfon no ha pogut completar l’entrada.', error);
    }
    const testimoni = textNet(credencial?.testimoni);
    if (!testimoni) throw errorNatiu(CODI_ENTRADA_NATIVA.FALLIDA, 'El telèfon no ha tornat cap identificació.');
    return Object.freeze({
      testimoni,
      nonce: textNet(credencial.nonce),
      testimoniAcces: textNet(credencial.testimoniAcces),
      nom: textNet(credencial.nom),
      codiAutoritzacio: textNet(credencial.codiAutoritzacio)
    });
  })();
  enCurs = entrada;
  /* Una fase 1 abandonada que torna tard no allibera la que l'ha rellevada. */
  try { return await entrada.actual; } finally { if (enCurs === entrada) enCurs = null; }
}

/**
 * Fase D (261020, revisió) · «Cancel·la l'entrada»: ningú no espera ja la fase 1
 * en curs. Si el full encara no s'ha obert, l'adaptador ja no l'obri; si ja s'ha
 * obert, la credencial tardana la descarta fluxEntradaNativa (i l'oblida), llevat
 * que la persona torne a tocar el mateix proveïdor. Sense cap en curs, res. Mai llança.
 */
export function abandonaCredencialNativa() {
  if (!enCurs) return;
  enCurs.vius.clear();
  enCurs.abandonada = true;
}

/** De millor esforç: la propera demana l'espera (fins a 3 s), mai la vista. Mai llança. */
export function oblidaCredencialNativa(proveidor) {
  let promesa;
  try { promesa = Promise.resolve(registrat?.oblida?.(proveidor)); } catch { promesa = Promise.resolve(); }
  oblitPendent = promesa.catch(() => undefined);
}
