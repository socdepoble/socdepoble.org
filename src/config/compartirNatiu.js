/* Ordre del Mestre (261026, prompt 261026_1615, tasques 1 i 2) · Registre del
   que arriba des del menú «Compartir» del dispositiu: captures, fotos i text
   que la persona tria enviar a Sóc de Poble en lloc de WhatsApp o Telegram.
   L'omple només src/natiu/compartirNatiu.js (el pont amb l'App); el llig el
   Xat, que demana a quina conversa va i el posa al compositor. Res no s'envia
   tot sol: la persona veu la miniatura, hi pot afegir text i prem «Envia».
   A la web, a la PWA i al connector queda buit per sempre.
   Pur i sense cap import, com entradaNativa.js: qualsevol fitxer de src/ el
   pot llegir sense acostar-se mai al natiu (src/natiu/frontera.test.js).
   Estat: un sol lot pendent alhora. Un lot nou substituïx el pendent, triat o
   no: la persona ha tornat a compartir, com a les apps de missatgeria.
   Gauntlet 261026_1615 (Codex C1615-01/02/03/08, Gemini G1615-00/04):
     · el lot és de qui tria la conversa (propietari) i un canvi de sessió el
       descarta (canviaSessioCompartit, des de XatContext), també el que hi ha en vol;
     · prendre un fitxer no el perd: si la preparació s'avorta (canvi de
       conversa, arrere), el compositor el torna (tornaFitxerCompartit);
     · la còpia nativa només s'allibera quan s'envia o es descarta: fins
       llavors sobreviu a un reinici de l'App (el pont la torna a anunciar).
   Pla 261028_1526 (Bloc D, P1-31) · El canvi de sessió té època pròpia
   (canviaSessioCompartit): el que el pont llegia o copiava abans ja no entra,
   i un lot amb amo no canvia de mans. No és `generacio`, que també puja amb
   el «Descarta» del diàleg i tiraria un lot nou que encara s'està llegint.
   El tall arriba també al natiu (registraTalladorCompartit): les còpies d'abans
   no tornen en arrencar, encara que el procés mora a mitja còpia. */
export const MAX_FITXERS_COMPARTITS = 10;
export const MAX_TEXT_COMPARTIT = 4096;

let pendent = null;
let comptador = 0;
/* Puja a cada descart: el que s'havia pres abans ja no pot tornar. */
let generacio = 0;
/* Puja només quan canvia la sessió (persona o backend); tallSessioMs, l'hora del canvi. */
let sessio = 0;
let tallSessioMs = 0;
/* Més que tota una còpia nativa (60 s, i una lectura de 20 s): el que fa més
   temps que es va rebre ja l'ha tallat el natiu, i un rellotge que torna
   arrere després del tall no tira sense fi les comparticions bones. */
const EN_VOL_MS = 5 * 60 * 1000;
let alliberador = null;
let tallador = null;
const oients = new Set();
/* La còpia nativa de cada fitxer (la ruta del pont), fora del lot congelat. */
const rutaDe = new WeakMap();

const avisa = () => { for (const oient of [...oients]) { try { oient(pendent); } catch { /* Un oient trencat no talla els altres. */ } } };
const congela = (lot) => Object.freeze({ ...lot, fitxers: Object.freeze([...lot.fitxers]) });
const esFitxer = (valor) => typeof Blob !== 'undefined' && valor instanceof Blob;
/* Talla per caràcters sencers: un emoji al límit no queda partit per la meitat. */
const textNet = (valor) => (typeof valor === 'string' ? Array.from(valor.trim()).slice(0, MAX_TEXT_COMPARTIT).join('') : '');

/** El pont natiu diu com s'allibera la seua còpia: fn(rutes). */
export function registraAlliberadorCompartit(fn) {
  alliberador = typeof fn === 'function' ? fn : null;
}

/** El pont natiu diu com talla la sessió a la seua banda: fn(). */
export function registraTalladorCompartit(fn) {
  tallador = typeof fn === 'function' ? fn : null;
}

/* Allibera les còpies natives d'estos fitxers. Mai llança. */
function allibera(fitxers) {
  const rutes = [];
  for (const fitxer of fitxers) {
    const ruta = esFitxer(fitxer) ? rutaDe.get(fitxer) : null;
    if (ruta) { rutes.push(ruta); rutaDe.delete(fitxer); }
  }
  if (!rutes.length || !alliberador) return;
  try { Promise.resolve(alliberador(rutes)).catch(() => {}); } catch { /* La còpia es netejarà sola. */ }
}

/**
 * El pont natiu hi deixa un lot. Sense cap fitxer ni text, només es guarda si
 * hi ha rebutjats, perquè el Xat diga que no s'ha pogut rebre.
 * @param {{ fitxers?: Blob[], rutes?: (string|null)[], text?: string, rebutjats?: number, sessio?: number, rebutMs?: number }} lot
 *   `rutes`, alineades amb `fitxers`: la còpia nativa de cadascun. `sessio`
 *   (sessioCompartit() quan el pont el va rebre) i `rebutMs` (l'hora de
 *   l'intent natiu): si són d'abans de l'últim canvi de sessió, el lot no entra
 *   (`rebutMs`, si és d'una còpia que encara podia estar en vol: EN_VOL_MS).
 * @returns {number|null} l'id del lot, o null si no hi havia res
 */
export function lliuraCompartit({ fitxers = [], rutes = [], text = '', rebutjats = 0, sessio: sessioDelLot, rebutMs } = {}) {
  const llista = Array.isArray(fitxers) ? fitxers : [];
  llista.forEach((fitxer, i) => {
    const ruta = Array.isArray(rutes) ? rutes[i] : null;
    if (esFitxer(fitxer) && typeof ruta === 'string' && ruta) rutaDe.set(fitxer, ruta);
  });
  /* P1-31 · Llegit o copiat en una sessió que ja no és: fora, amb les seues
     còpies, sense avisar ningú ni tocar el lot pendent. */
  const copiatAbans = Number.isFinite(rebutMs) && rebutMs < tallSessioMs && tallSessioMs - rebutMs <= EN_VOL_MS;
  if ((sessioDelLot !== undefined && sessioDelLot !== sessio) || copiatAbans) {
    allibera(llista.filter(esFitxer));
    return null;
  }
  const valids = llista.filter(esFitxer);
  const sobrers = Math.max(0, valids.length - MAX_FITXERS_COMPARTITS);
  const net = textNet(text);
  const rebuig = Math.max(0, Math.floor(Number(rebutjats) || 0)) + sobrers + (llista.length - valids.length);
  // Els que no hi caben no tornaran mai: fora la seua còpia.
  allibera(valids.slice(MAX_FITXERS_COMPARTITS));
  if (!valids.length && !net && !rebuig) return null;
  // El lot que substituïx: el d'abans ja no s'enviarà.
  if (pendent) allibera(pendent.fitxers);
  comptador += 1;
  pendent = congela({ id: comptador, fitxers: valids.slice(0, MAX_FITXERS_COMPARTITS), text: net, rebutjats: rebuig, desti: null, propietari: null });
  avisa();
  return comptador;
}

/** El lot pendent (congelat; el mateix objecte fins al canvi següent) o null. */
export const compartitPendent = () => pendent;

/** Avisa a cada canvi del lot pendent. Torna la funció que deixa d'escoltar. */
export function subscriuCompartit(oient) {
  if (typeof oient !== 'function') return () => {};
  oients.add(oient);
  return () => { oients.delete(oient); };
}

/* El lot sense propietari és de qui el trie; amb propietari, només d'eixa persona. */
const esDe = (lot, propietari) => lot.propietari == null || lot.propietari === String(propietari ?? '');

/** La persona (propietari: el seu id) tria la conversa on va el lot. */
export function triaDestiCompartit(filId, propietari = null) {
  // P1-31 · Defensa en profunditat: un lot amb amo no el retria ningú més (ni una crida sense persona).
  if (!pendent || filId == null || filId === '' || !esDe(pendent, propietari)) return false;
  pendent = congela({ ...pendent, desti: String(filId), propietari: propietari == null ? null : String(propietari) });
  avisa();
  return true;
}

/* El lot ja no té res per a ningú: desapareix. */
function buidaSiCal() {
  if (pendent && !pendent.fitxers.length && !pendent.text) pendent = null;
}

/**
 * El compositor de la conversa triada pren el fitxer següent. El text del lot
 * fa de peu del primer fitxer i, sense fitxers, el pren prenTextCompartit.
 * El que pren encara és del lot: s'acaba amb alliberaFitxerCompartit (enviat
 * o descartat per la persona) o torna amb tornaFitxerCompartit (avortat).
 * @returns {{ fitxer: Blob, peu: string, queden: number, lot: number, desti: string, propietari: string|null, generacio: number }|null}
 */
export function prenFitxerCompartit(filId, propietari = null) {
  if (!pendent || pendent.desti !== String(filId) || !pendent.fitxers.length || !esDe(pendent, propietari)) return null;
  const [fitxer, ...resta] = pendent.fitxers;
  const peu = pendent.text;
  const { id: lot, desti, propietari: amo } = pendent;
  pendent = congela({ ...pendent, fitxers: resta, text: '' });
  buidaSiCal();
  avisa();
  return { fitxer, peu, queden: resta.length, lot, desti, propietari: amo, generacio };
}

/**
 * Torna al capdavant del lot un fitxer pres que no s'ha arribat a enviar (la
 * preparació s'ha avortat, la conversa s'ha tancat). Si el lot ja no és el
 * mateix (n'ha arribat un altre, o s'ha descartat per un canvi de sessió), el
 * fitxer no torna i se n'allibera la còpia. Torna cert si ha tornat.
 */
export function tornaFitxerCompartit(pres) {
  if (!pres || !esFitxer(pres.fitxer)) return false;
  /* Sense lot pendent, només si no n'ha arribat cap altre després (un lot
     substituït no pot tornar a la vida i tapar el més nou). */
  if (pres.generacio !== generacio || (pendent ? pendent.id !== pres.lot : pres.lot !== comptador)) {
    allibera([pres.fitxer]);
    return false;
  }
  pendent = pendent
    ? congela({ ...pendent, fitxers: [pres.fitxer, ...pendent.fitxers].slice(0, MAX_FITXERS_COMPARTITS), text: pres.peu || pendent.text })
    : congela({ id: pres.lot, fitxers: [pres.fitxer], text: textNet(pres.peu), rebutjats: 0, desti: pres.desti, propietari: pres.propietari });
  avisa();
  return true;
}

/** Un fitxer pres que ja s'ha enviat (o que la persona ha descartat): fora la còpia nativa. */
export function alliberaFitxerCompartit(pres) {
  if (pres && esFitxer(pres.fitxer)) allibera([pres.fitxer]);
}

/** El text d'un lot sense fitxers, per a l'esborrany de la conversa triada. */
export function prenTextCompartit(filId, propietari = null) {
  if (!pendent || pendent.desti !== String(filId) || pendent.fitxers.length || !pendent.text || !esDe(pendent, propietari)) return '';
  const { text } = pendent;
  pendent = congela({ ...pendent, text: '' });
  buidaSiCal();
  avisa();
  return text;
}

/**
 * La persona no el vol enviar (o ja ha llegit l'avís dels rebutjats), o la
 * sessió ha canviat. També invalida el que el compositor tenia en vol: ja no
 * podrà tornar (tornaFitxerCompartit l'allibera).
 */
export function descartaCompartit() {
  generacio += 1;
  if (!pendent) return;
  allibera(pendent.fitxers);
  pendent = null;
  avisa();
}

/** L'època de la sessió: el pont la pren en rebre un lot i la torna amb lliuraCompartit. */
export const sessioCompartit = () => sessio;

/**
 * Pla 261028_1526 (P1-31) · La sessió ha canviat (ix la persona, n'entra una
 * altra o canvia el backend amb algú dins). Ho crida XatContext; el «Descarta»
 * del diàleg no, que no és cap sessió nova. A més del descart, el que el pont
 * tenia en vol (una lectura, una còpia nativa d'abans d'ara) ja no entrarà, i
 * el natiu (el tallador) esborra les còpies d'abans: cap no torna en arrencar.
 */
export function canviaSessioCompartit(araMs = Date.now()) {
  sessio += 1;
  tallSessioMs = Number.isFinite(araMs) ? araMs : Date.now();
  descartaCompartit();
  if (!tallador) return;
  try { Promise.resolve(tallador()).catch(() => {}); } catch { /* El tall d'ací ja s'ha fet: un natiu que falla només hi deixa restes. */ }
}

/**
 * Pla 261028_1526 (P1-31) · El backend ha canviat sense ningú dins: la
 * conversa triada era de l'altre. Un lot sense amo torna a «Envia a…»; no se'n
 * descarta res (en fred, la config pot assentar-se després de la compartició).
 * Torna cert si l'ha tornat.
 */
export function reiniciaDestiCompartit() {
  if (!pendent || pendent.desti == null || pendent.propietari != null) return false;
  pendent = congela({ ...pendent, desti: null });
  avisa();
  return true;
}
