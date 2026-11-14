/**
 * veusTerritorials.js · Onada R23 («La Veu de Sóc de Poble») · Catàleg tancat
 * de veus territorials i persistència sanejada de la preferència d'accent.
 *
 * Fulla lleugera sense dependències de React ni de xarxa: permet que tant
 * `veuIaiaService.js` com `useTraduccioPagina.js` i les targetes culturals
 * consulten o desen la veu preferida sense arrossegar el motor complet de
 * síntesi al tros d'entrada.
 */

export const CLAU_VEU_PREFERIDA = 'sdp:veu_preferida';
export const VEU_PER_DEFECTE = 'gina_valencia';
export const VEU_AUTO_NAVEGADOR = 'auto_navegador';

/**
 * Enum tancat d'identificadors de veu acceptats pel client i pel Node 0
 * (Matxa-TTS v2 multiaccent + opció nativa del dispositiu).
 */
export const VEUS_TERRITORIALS = Object.freeze([
  Object.freeze({
    id: 'gina_valencia',
    clauNom: 'section.traduir.veu.ginaValencia',
    reservaNom: 'Gina · Valencià',
    territori: 'Comarques valencianes',
    accent: 'valencia',
    mostraAsset: '/assets/audio/veus_node0/mostra_07_gina_valencia.wav',
  }),
  Object.freeze({
    id: 'arnau_valencia',
    clauNom: 'section.traduir.veu.arnauValencia',
    reservaNom: 'Arnau · Valencià',
    territori: 'Comarques valencianes',
    accent: 'valencia',
    mostraAsset: '/assets/audio/veus_node0/mostra_08_arnau_valencia.wav',
  }),
  Object.freeze({
    id: 'berta_valencia',
    clauNom: 'section.traduir.veu.bertaValencia',
    reservaNom: 'Berta · Valencià',
    territori: 'Comarques valencianes',
    accent: 'valencia',
    mostraAsset: '/assets/audio/veus_node0/mostra_09_berta_valencia.wav',
  }),
  Object.freeze({
    id: 'lluc_valencia',
    clauNom: 'section.traduir.veu.llucValencia',
    reservaNom: 'Lluc · Valencià',
    territori: 'Comarques valencianes',
    accent: 'valencia',
    mostraAsset: '/assets/audio/veus_node0/mostra_06_lluc_valencia.wav',
  }),
  Object.freeze({
    id: 'emma_occidental',
    clauNom: 'section.traduir.veu.emmaOccidental',
    reservaNom: 'Emma · Terres de l’Ebre i Ponent',
    territori: 'Nord-occidental',
    accent: 'occidental',
    mostraAsset: '/assets/audio/veus_node0/mostra_05_emma_occidental.wav',
  }),
  Object.freeze({
    id: 'elia_central',
    clauNom: 'section.traduir.veu.eliaCentral',
    reservaNom: 'Èlia · Català central',
    territori: 'Oriental central',
    accent: 'central',
    mostraAsset: '/assets/audio/veus_node0/mostra_03_elia_central.wav',
  }),
  Object.freeze({
    id: 'olga_balear',
    clauNom: 'section.traduir.veu.olgaBalear',
    reservaNom: 'Olga · Illes Balears',
    territori: 'Balear',
    accent: 'balear',
    mostraAsset: '/assets/audio/veus_node0/mostra_01_olga_balear.wav',
  }),
  Object.freeze({
    id: VEU_AUTO_NAVEGADOR,
    clauNom: 'section.traduir.veu.autoNavegador',
    reservaNom: 'Veu del dispositiu',
    territori: 'Navegador local',
    accent: 'navegador',
    mostraAsset: null,
  }),
]);

export const IDS_VEU_VALIDA = Object.freeze(VEUS_TERRITORIALS.map((veu) => veu.id));
const CONJUNT_VEUS = new Set(IDS_VEU_VALIDA);

const oientsPreferencia = new Set();
let memoriaFallback = null;

/** Valida contra l'enum tancat; qualsevol altre valor o tipus torna null. */
export function validaVeuPreferida(valor) {
  if (typeof valor !== 'string') return null;
  const net = valor.trim();
  return CONJUNT_VEUS.has(net) ? net : null;
}

/** Indica booleà si l'identificador pertany a l'enum tancat de veus. */
export function esVeuValida(valor) {
  return validaVeuPreferida(valor) !== null;
}

/** Normalitza un identificador de veu cap a un valor segur de l'enum (per defecte `gina_valencia`). */
export function normalitzaIdVeu(valor) {
  return validaVeuPreferida(valor) || VEU_PER_DEFECTE;
}

/** Reinicia la preferència de veu en memòria i localStorage per a proves aïllades. */
export function reiniciaPreferenciaVeuPerProves() {
  memoriaFallback = null;
  oientsPreferencia.clear();
  try {
    if (typeof window !== 'undefined') window.localStorage?.removeItem?.(CLAU_VEU_PREFERIDA);
  } catch { /* ignorat */ }
}

/** Torna la veu desada explícitament per la persona, o null si encara no n'ha triat cap. */
export function veuPreferidaExplicita() {
  try {
    const cru = typeof window !== 'undefined' ? window.localStorage?.getItem?.(CLAU_VEU_PREFERIDA) : null;
    const validada = validaVeuPreferida(cru);
    if (validada) return validada;
  } catch {
    /* Navegador amb emmagatzematge restringit: usa memòria de sessió. */
  }
  return validaVeuPreferida(memoriaFallback);
}

/** Torna la veu activa per a pintar al selector (per defecte `gina_valencia`). */
export function llegeixVeuPreferida() {
  return veuPreferidaExplicita() || VEU_PER_DEFECTE;
}

/** Desa la preferència validada (o la neteja si es passa null) i avisa els oients. */
export function desaVeuPreferida(valor) {
  if (valor === null) {
    memoriaFallback = null;
    try {
      if (typeof window !== 'undefined') window.localStorage?.removeItem?.(CLAU_VEU_PREFERIDA);
    } catch { /* ignorat */ }
    for (const oient of oientsPreferencia) oient(VEU_PER_DEFECTE);
    return VEU_PER_DEFECTE;
  }
  const validada = validaVeuPreferida(valor);
  if (!validada) return llegeixVeuPreferida();
  memoriaFallback = validada;
  try {
    if (typeof window !== 'undefined') window.localStorage?.setItem?.(CLAU_VEU_PREFERIDA, validada);
  } catch { /* ignorat */ }
  for (const oient of oientsPreferencia) oient(validada);
  return validada;
}

/** Subscriu canvis en la veu preferida (retorna funció per desfer la subscripció). */
export function subscriuVeuPreferida(oient) {
  if (typeof oient !== 'function') return () => {};
  oientsPreferencia.add(oient);
  return () => { oientsPreferencia.delete(oient); };
}

/** Valida un punt HTTPS de síntesi sense credencials incrustades. */
export function validaPuntHttpsVeu(valor) {
  if (typeof valor !== 'string') return null;
  const net = valor.trim();
  if (!/^https:\/\//i.test(net)) return null;
  try {
    const url = new URL(net);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return net.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

/** Comprovació síncrona lleugera de disponibilitat de síntesi (navegador o Node 0 d'entorn). */
export function sintesiVeuDisponibleLleugera({ privat = false } = {}) {
  const teSpeech = typeof window !== 'undefined'
    && Boolean(window.speechSynthesis)
    && typeof window.SpeechSynthesisUtterance === 'function';
  if (teSpeech) return true;
  if (privat) return false;
  return Boolean(validaPuntHttpsVeu(import.meta.env?.VITE_SDP_VEU_NODE0_URL));
}
