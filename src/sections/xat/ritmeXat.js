import { validaRitmeXat } from '../../data/xatRitme.js';

export const MS_SONDEIG_RITME = 3000;
export const MS_INACTIVITAT_ESCRIVINT = 5000;
/** Scoped lifecycle: timers can expire evidence; only the server creates it.
 * Input is a boolean, never draft text. Revision tombstones order late writes.
 */
export function creaSessioRitmeXat({ instancia, load, publica, onChange, nextRevisio = null, doc = document, finestra = window, now = () => performance.now() }) {
  let tancat = false, absent = false, llegint = false, revisio = 0, escrivint = false, ultimaPublicacio = -Infinity;
  let sondeig, inactivitat, ajornat, caducitat;
  let instantania = { rebutPelsAltresFinsSeq: 0, llegitPelsAltresFinsSeq: 0, escrivint: [] };
  const controls = new Set();
  const focusReal = () => doc.visibilityState === 'visible' && doc.hasFocus();
  let primerPla = focusReal();
  const visible = () => primerPla && focusReal();
  const emet = () => { if (!tancat) onChange(instantania); };
  const buidaPresencia = () => { clearTimeout(caducitat); instantania = { ...instantania, escrivint: [] }; emet(); };
  async function acotada(fn, cleanup = false) {
    const control = new AbortController();
    const pending = { control, cleanup }; controls.add(pending);
    let timer, avorta;
    try {
      return await Promise.race([
        Promise.resolve().then(() => fn(control.signal)),
        new Promise((_, reject) => { avorta = () => reject(new DOMException('Cancel·lat.', 'AbortError')); control.signal.addEventListener('abort', avorta, { once: true }); }),
        new Promise((_, reject) => { timer = setTimeout(() => { control.abort(); reject(new DOMException('Temps esgotat.', 'TimeoutError')); }, 8000); })
      ]);
    } finally { clearTimeout(timer); control.signal.removeEventListener('abort', avorta); controls.delete(pending); }
  }
  async function publicaEstat(value) {
    if (absent) return;
    const versio = nextRevisio ? nextRevisio() : ++revisio;
    ultimaPublicacio = now();
    try { await acotada(signal => publica({ instancia, revisio: versio, escrivint: value }, signal), !value); }
    catch (error) { if (error?.code === 'SENSE_CAPACITAT_RITME' || error?.codi === 'sense-capacitat') { absent = true; buidaPresencia(); } }
  }
  function paraEscriure() {
    clearTimeout(inactivitat); clearTimeout(ajornat); ajornat = null;
    if (escrivint) { escrivint = false; void publicaEstat(false); }
  }
  function input(value) {
    if (tancat || absent) return;
    if (!value || !visible()) { paraEscriure(); return; }
    escrivint = true;
    clearTimeout(inactivitat);
    inactivitat = setTimeout(paraEscriure, MS_INACTIVITAT_ESCRIVINT);
    if (now() - ultimaPublicacio >= 2000) { clearTimeout(ajornat); ajornat = null; void publicaEstat(true); }
    else if (!ajornat) ajornat = setTimeout(() => { ajornat = null; if (escrivint && visible()) void publicaEstat(true); }, 2000 - (now() - ultimaPublicacio));
  }
  async function consulta() {
    clearTimeout(sondeig);
    if (tancat || absent || llegint || !visible()) return;
    llegint = true;
    const inici = now();
    try {
      const value = validaRitmeXat(await acotada(signal => load(signal)));
      if (tancat || !visible()) return;
      const retard = Math.max(0, now() - inici);
      const presencies = value.escrivint.map(p => ({ ...p, vigentMs: Math.floor(p.vigentMs - retard) })).filter(p => p.vigentMs > 0);
      instantania = { ...value, escrivint: presencies }; emet();
      clearTimeout(caducitat);
      if (presencies.length) caducitat = setTimeout(() => {
        // Fail closed until the next server observation. No fabricated renewal.
        buidaPresencia();
      }, Math.min(...presencies.map(p => p.vigentMs)));
    } catch (error) {
      buidaPresencia();
      if (error?.code === 'SENSE_CAPACITAT_RITME' || error?.codi === 'sense-capacitat') absent = true;
    } finally {
      llegint = false;
      if (!tancat && !absent && visible()) sondeig = setTimeout(consulta, MS_SONDEIG_RITME);
    }
  }
  const pausa = () => { primerPla = false; clearTimeout(sondeig); for (const p of controls) if (!p.cleanup) p.control.abort(); paraEscriure(); buidaPresencia(); };
  const canviaVisibilitat = () => { primerPla = focusReal(); if (visible()) void consulta(); else pausa(); };
  doc.addEventListener('visibilitychange', canviaVisibilitat);
  finestra.addEventListener('blur', pausa);
  finestra.addEventListener('focus', canviaVisibilitat);
  void consulta();
  return {
    input,
    stop() {
      if (tancat) return;
      for (const p of controls) if (!p.cleanup) p.control.abort();
      paraEscriure(); tancat = true;
      clearTimeout(sondeig); clearTimeout(inactivitat); clearTimeout(ajornat); clearTimeout(caducitat);
      doc.removeEventListener('visibilitychange', canviaVisibilitat);
      finestra.removeEventListener('blur', pausa); finestra.removeEventListener('focus', canviaVisibilitat);
      // Cleanup write is independently bounded; the server TTL also covers loss/logout.
    }
  };
}
