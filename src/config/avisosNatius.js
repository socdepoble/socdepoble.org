/* Ordre del Mestre (261026, prompt 261026_1615, tasca 3) · Registre dels avisos
   natius del xat: la notificació del sistema, amb so i vibració, quan arriba un
   missatge i l'App no és a la vista. El munta només src/natiu/entrada.jsx; a
   la web, a la PWA i al connector queda buit i el xat avisa com sempre (el
   toast de dins de l'App).
   Pur i sense cap import, com entradaNativa.js (src/natiu/frontera.test.js).
   Contracte de l'adaptador:
     { estatPermis() → Promise<'granted'|'denied'|'prompt'|…>,
       demanaPermis() → Promise<idem>,
       avisa({ id, titol, cos, filId, vigent }) → Promise (vigent(): encara cal? es torna a mirar just abans d'avisar),
       escoltaToc(fn) : fn({ filId }) quan la persona toca un avís,
       netejaAvisos?() → Promise : lleva els avisos que ja són a la barra }
   Només avisa quan el permís ja és 'granted': mai obri cap diàleg tot sol. */
let registrat = null;
let permis = null;
let demanant = null;
/* Revisió 261026 · Cada lectura o pregunta del permís porta número: només la
   més nova l'escriu. Una primera lectura lenta ('prompt') no tapa el 'granted'
   que la persona ja ha donat. */
let versioPermis = 0;
const anotaPermis = (promesa) => {
  const meua = ++versioPermis;
  return Promise.resolve(promesa).then((estat) => {
    if (meua === versioPermis) permis = estat;
    return meua === versioPermis ? estat : permis;
  });
};
const tocs = new Set();
/* Un toc que arriba abans que ningú escolte (l'App oberta des de l'avís). */
let tocsPendents = [];

const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const toca = (toc) => {
  const filId = textNet(toc?.filId);
  if (!filId) return;
  if (!tocs.size) { tocsPendents = [...tocsPendents.slice(-4), { filId }]; return; }
  for (const oient of [...tocs]) { try { oient({ filId }); } catch { /* Un oient trencat no talla els altres. */ } }
};

/** Registra l'adaptador natiu. Una sola vegada: un altre llança. */
export function registraAvisosNatius(adaptador) {
  if (adaptador == null) return false;
  const { estatPermis, demanaPermis, avisa, escoltaToc } = adaptador;
  if ([estatPermis, demanaPermis, avisa, escoltaToc].some((f) => typeof f !== 'function')) {
    throw new TypeError('[avisosNatius] L’adaptador necessita estatPermis(), demanaPermis(), avisa() i escoltaToc().');
  }
  if (registrat) {
    if (registrat === adaptador) return true;
    throw new Error('[avisosNatius] Els avisos natius ja estan registrats.');
  }
  registrat = adaptador;
  try { escoltaToc.call(adaptador, toca); } catch { /* Sense tocs, els avisos encara serveixen. */ }
  anotaPermis(Promise.resolve().then(() => estatPermis.call(adaptador))).catch(() => {});
  return true;
}

export const avisosNatiusDisponibles = () => registrat !== null;
/** Amb permís concedit: el xat pot vigilar en segon pla per a avisar. */
export const avisosNatiusActius = () => registrat !== null && permis === 'granted';

/**
 * Demana el permís si encara no s'ha decidit. Mai torna a preguntar a qui
 * l'ha denegat: el sistema ja no ho mostraria i la persona ho canvia als ajustos.
 * @returns {Promise<string|null>} l'estat final, o null sense adaptador
 */
export function demanaPermisAvisos() {
  if (!registrat) return Promise.resolve(null);
  if (demanant) return demanant;
  demanant = (async () => {
    try {
      const actual = await anotaPermis(registrat.estatPermis());
      /* Revisió 261026 · Només 'prompt' és «encara no ho ha decidit». Android 13+
         torna 'prompt-with-rationale' després d'un «No»: tampoc es torna a preguntar. */
      if (actual !== 'prompt') return actual;
      return await anotaPermis(registrat.demanaPermis());
    } catch {
      return permis;
    } finally {
      demanant = null;
    }
  })();
  return demanant;
}

/** Torna a llegir el permís (la persona el pot canviar als ajustos del sistema). Mai pregunta. */
export function refrescaPermisAvisos() {
  if (!registrat) return Promise.resolve(null);
  return anotaPermis(Promise.resolve().then(() => registrat.estatPermis())).catch(() => permis);
}

/**
 * Un avís natiu, si es pot. Torna true si l'ha encarregat: qui crida ja no
 * cal que pinte el toast. Mai llança. `vigent` (opcional) es torna a mirar just
 * abans d'avisar: si la persona ja ha tornat a l'App, l'avís no ix (Gauntlet
 * 261026_1615, Codex C1615-09).
 * @param {{ id: number, titol: string, cos: string, filId: string, vigent?: () => boolean }} avis
 */
export function avisaNatiu(avis) {
  if (!avisosNatiusActius() || !Number.isSafeInteger(avis?.id)) return false;
  const titol = textNet(avis.titol);
  const cos = textNet(avis.cos);
  if (!titol && !cos) return false;
  try {
    const vigent = typeof avis.vigent === 'function' ? avis.vigent : null;
    Promise.resolve(registrat.avisa({ id: avis.id, titol, cos, filId: textNet(avis.filId), ...(vigent ? { vigent } : {}) })).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/** Lleva de la barra els avisos ja lliurats (en tornar a l'App). Mai llança. */
export function netejaAvisosNatius() {
  if (!registrat || typeof registrat.netejaAvisos !== 'function') return;
  try { Promise.resolve(registrat.netejaAvisos()).catch(() => {}); } catch { /* De cortesia. */ }
}

/** La persona ha tocat un avís: fn({ filId }). Torna la funció que deixa d'escoltar. */
export function escoltaTocAvis(oient) {
  if (typeof oient !== 'function') return () => {};
  tocs.add(oient);
  const pendents = tocsPendents;
  tocsPendents = [];
  for (const toc of pendents) { try { oient(toc); } catch { /* Ídem. */ } }
  return () => { tocs.delete(oient); };
}

/** Un id d'avís estable per conversa: un missatge nou substituïx l'avís anterior del mateix xat. */
export function idDAvis(filId) {
  const text = String(filId ?? '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0;
  return Math.abs(hash % 2147483647) || 1;
}
