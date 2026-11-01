/* P0-24 (G2120-07, marató 261101_2143) · La pila de capes que el botó Arrere
   d'Android tanca abans de navegar. Cada capa oberta (un Dialeg, un calaix, la
   pantalla completa…) s'hi apunta amb la funció que la tanca, la MATEIXA que
   fa servir el seu Escape. L'adaptador natiu (src/natiu/enrereNatiu.js) la
   pregunta en cada Arrere: si hi ha capa, tanca la de dalt i l'Arrere queda
   consumit; si no, el natiu torna arrere (o deixa fer el sistema).
   Pur i sense cap import, com avisosNatius.js: a la web, a la PWA i al
   connector ningú no la pregunta i no canvia res.
   L'ordre és el d'obertura, el mateix del top layer de showModal().
   Un segon Arrere just darrere del primer (abans que React haja desmuntat la
   capa) no la torna a tancar: es consumix sense cridar-la, perquè un onTanca
   que navega (navigate(-1)) no ha d'eixir dues vegades (Gauntlet 261029, cicle 1).
   Passada la finestra, o si s'obri una capa damunt, es torna a demanar. */
export const ABSORCIO_ENRERE_MS = 400;

let pila = [];
const oients = new Set();

const avisa = () => {
  const n = pila.length;
  for (const oient of [...oients]) {
    try { oient(n); } catch { /* Un oient trencat no talla els altres. */ }
  }
};

/* Obrir una capa esborra les peticions d'abans: quan la nova es tanque, la de
   sota que torna a quedar dalt (l'editor sota «Descartar canvis?») es torna a
   demanar. Llevar-ne una no esborra res (corrector 261102, ARB-B3B-03): si era
   la de dalt, la de sota ja estava neta des que es va obrir la llevada; si era
   del mig, la de dalt continua sent la mateixa i la seua petició encara val
   (esborrar-la la tornaria a cridar dins de la finestra). */
const oblidaPeticions = () => { for (const capa of pila) capa.demanadaA = null; };

/**
 * Apunta una capa oberta. Torna qui la lleva (idempotent).
 * @param {() => void} tanca el mateix camí que l'Escape de la capa
 * @returns {() => void}
 */
export function obriCapaEnrere(tanca) {
  if (typeof tanca !== 'function') return () => {};
  const capa = { tanca, demanadaA: null };
  pila = [...pila, capa];
  oblidaPeticions();
  avisa();
  return () => {
    if (!pila.includes(capa)) return;
    pila = pila.filter((c) => c !== capa);
    avisa();
  };
}

/**
 * Tanca la capa de dalt. Mai llança.
 * @param {number} [ara] l'hora en ms (les proves la passen)
 * @returns {boolean} true si hi havia capa (l'Arrere queda consumit)
 */
export function tancaCapaSuperior(ara = Date.now()) {
  const capa = pila.at(-1);
  if (!capa) return false;
  if (capa.demanadaA !== null && ara - capa.demanadaA < ABSORCIO_ENRERE_MS) return true;
  capa.demanadaA = ara;
  /* Una capa que llança també consumix l'Arrere: navegar amb el modal davant
     seria el defecte mateix. */
  try { capa.tanca(); }
  catch (e) { console.error('[pilaEnrere] La capa no s’ha pogut tancar:', e); }
  return true;
}

export const capesEnrereObertes = () => pila.length;

/**
 * Escolta els canvis de la pila: fn(nombreDeCapes). Torna qui deixa d'escoltar.
 * @param {(n: number) => void} fn
 * @returns {() => void}
 */
export function escoltaCapesEnrere(fn) {
  if (typeof fn !== 'function') return () => {};
  oients.add(fn);
  return () => { oients.delete(fn); };
}

/** Només per a proves: buida la pila i els oients. */
export function _reiniciaPilaEnrere() {
  pila = [];
  oients.clear();
}
