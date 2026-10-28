/* Ordre del Mestre (261026, prompt 261026_1615, tasques 1 i 2) · L'adaptador
   del menú «Compartir» del dispositiu. El connector és propi de l'App, no cap
   paquet npm: CompartirNatiuPlugin.java (Android) i CompartirNatiuPlugin.swift
   (iOS, amb l'extensió Compartir). Copien al moment el que arriba a la memòria
   cau privada i ho anuncien amb l'esdeveniment «compartit», retingut fins que
   algú l'escolta. Ací els fitxers es lligen per l'URL local de l'App, es
   tornen File i van al registre (config/compartirNatiu.js) amb la seua ruta.
   Gauntlet 261026_1615 (Codex C1615-03/08) · La còpia nativa NO s'allibera en
   llegir-la: és l'única que sobreviu a un reinici. L'allibera el registre (amb
   allibera(), que entrada.jsx li dona) quan la persona l'envia o la descarta;
   fins llavors les URL de l'avís a la finestra continuen vàlides. Com
   entradaSocial.js, el pont es llig del global que l'App injecta abans de la
   pàgina: cap import del nucli.
   A més del registre, s'emet «sdp:compartir_natiu» a la finestra
   (detail: { imatgeUri, imatgesUri, text, rebutjats }) perquè qualsevol peça
   enxufada ho puga escoltar sense acostar-se al natiu.
   Pla 261028_1526 (Bloc D, P1-31) · Cada lot porta l'època de la sessió del
   moment que arriba (sessio(), que entrada.jsx connecta a sessioCompartit). Si
   canvia abans que s'acabe de llegir, el lot no arriba a ningú: ni registre ni
   avís, i se n'alliberen totes les còpies, també les ja llegides. I el canvi
   arriba al natiu (tallaSessio, que entra al registre per `registraTallador`):
   hi esborra les còpies d'abans i talla la que encara copiava.
   QA-03 (Codex 261028_1611, residu C28-02) · Cada lectura porta el seu
   AbortSignal (fins a fetch i al cos) i un termini, LECTURA_COMPARTIT_MS. El
   tall de sessió les avorta totes, i la cua no espera mai un llegix que no
   l'escolta: cada espera corre contra l'avortament. Una lectura avortada o
   passada de termini es compta com a rebutjada i se n'allibera la còpia. El
   «Descarta» del diàleg no talla res. */
import { MAX_FITXERS_COMPARTITS, MAX_TEXT_COMPARTIT } from '../config/compartirNatiu.js';

export const CONNECTOR_COMPARTIR = 'CompartirNatiu';
export const ESDEVENIMENT_COMPARTIT = 'compartit';
export const ESDEVENIMENT_FINESTRA = 'sdp:compartir_natiu';
/* Els formats que el xat sap preparar (adjuntLocal.js), els mateixos que copia el natiu. */
const MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 20 * 1024 * 1024;
/** El termini de cada lectura, el mateix LECTURA_MS de CompartirNatiuPlugin.java. */
export const LECTURA_COMPARTIT_MS = 20_000;

/* Per caràcters sencers: ni un emoji partit per la meitat. */
const textNet = (valor, max) => (typeof valor === 'string' ? Array.from(valor.trim()).slice(0, max).join('') : '');
/* El nom original només es mostra: cap barra ni caràcter de control. */
const nomNet = (valor) => [...textNet(valor, 120)]
  .map((c) => (c === '/' || c === '\\' || c.charCodeAt(0) < 32 ? '_' : c)).join('') || 'captura';

/**
 * @param {{ finestra?: object, llegix?: (url: string, opcions: { signal: AbortSignal }) => Promise<Response>, sessio?: () => (number|undefined), registraTallador?: (fn: Function) => void, terminiMs?: number }} [opcions]
 *   `sessio`: l'època de la sessió (sessioCompartit); sense, cap lot no caduca.
 *   `registraTallador`: qui rep tallaSessio (registraTalladorCompartit).
 *   `terminiMs`: el termini de cada lectura (LECTURA_COMPARTIT_MS si no és un número més gran que 0).
 * @returns {{ escolta(lliura: Function): Promise<boolean>, allibera(rutes: string[]): void, tallaSessio(): void, tanca(): void }|null} null fora de l'App
 */
export function creaReceptorCompartit({
  finestra = globalThis, llegix = (url, opcions) => globalThis.fetch(url, opcions), sessio = () => undefined, registraTallador = null,
  terminiMs = LECTURA_COMPARTIT_MS
} = {}) {
  const pont = finestra?.Capacitor;
  if (typeof pont?.addListener !== 'function' || typeof pont?.convertFileSrc !== 'function') return null;
  const sessioAra = typeof sessio === 'function' ? sessio : () => undefined;
  const termini = Number.isFinite(terminiMs) && terminiMs > 0 ? terminiMs : LECTURA_COMPARTIT_MS;
  /* Una crida al connector que mai llança ni deixa cap rebuig sense amo. */
  const demana = (metode, opcions) => {
    if (typeof pont.nativePromise !== 'function') return;
    Promise.resolve().then(() => pont.nativePromise(CONNECTOR_COMPARTIR, metode, opcions)).catch(() => {});
  };
  const allibera = (rutes) => { if (rutes.length) demana('allibera', { rutes }); };
  /* QA-03 · Les lectures en vol, per a avortar-les totes de colp. */
  const enVol = new Set();
  const avortaLectures = () => { for (const control of [...enVol]) control.abort(); enVol.clear(); };
  let tancat = false;
  let oient = null;
  /* El natiu primer (l'ordre que veu el connector: tallaSessio i després
     allibera), i després les lectures. A iOS el connector encara no en té: la
     crida es rebutja i no passa res. */
  const tallaSessio = () => { demana('tallaSessio', {}); avortaLectures(); };
  /* La promesa, o un rebuig en avortar-se el senyal: un llegix que no
     l'escolta tampoc reté la cua. El rebuig tardà de l'original ja té amo. */
  const fins = (promesa, senyal) => {
    const original = Promise.resolve(promesa);
    original.catch(() => {});
    if (senyal.aborted) return Promise.reject(new Error('avortada'));
    return new Promise((resol, rebutja) => {
      const avorta = () => rebutja(new Error('avortada'));
      senyal.addEventListener('abort', avorta, { once: true });
      original.then(resol, rebutja).finally(() => senyal.removeEventListener('abort', avorta));
    });
  };
  if (typeof registraTallador === 'function') {
    try { registraTallador(tallaSessio); } catch { /* Sense tall natiu, el del registre continua valent. */ }
  }
  const rutaDe = (entrada) => (typeof entrada?.ruta === 'string' ? entrada.ruta : '');

  /* `epoca`: la sessió quan el lot va arribar (abans de cap espera de la cua). */
  const rep = async (dades, lliura, epoca) => {
    const entrades = Array.isArray(dades?.fitxers) ? dades.fitxers.slice(0, MAX_FITXERS_COMPARTITS) : [];
    let rebutjats = Math.max(0, Math.floor(Number(dades?.rebutjats) || 0))
      + Math.max(0, (Array.isArray(dades?.fitxers) ? dades.fitxers.length : 0) - entrades.length);
    const fitxers = [];
    const rutesDelsFitxers = [];
    const urls = [];
    /* Les còpies que no arribaran mai al registre (passen del límit, format o
       ruta dolents, il·legibles) s'alliberen ara; les bones, quan s'envien. */
    const sobrants = (Array.isArray(dades?.fitxers) ? dades.fitxers.slice(MAX_FITXERS_COMPARTITS) : [])
      .map(rutaDe).filter(Boolean);
    /* P1-31 · La sessió ha canviat: fora totes les còpies (les sobrants, les
       llegides i les que quedaven, `resta`) i el lot s'acaba ací. Amb el
       receptor tancat (tanca) també s'acaba, però les còpies no s'alliberen:
       el natiu les torna a anunciar en arrencar. */
    const caducat = () => tancat || sessioAra() !== epoca;
    const abandona = (resta) => {
      if (!tancat) allibera([...sobrants, ...rutesDelsFitxers, ...resta.map(rutaDe).filter(Boolean)]);
    };
    for (const [i, entrada] of entrades.entries()) {
      if (caducat()) { abandona(entrades.slice(i)); return; }
      const ruta = rutaDe(entrada);
      if (!ruta.startsWith('/') || !MIMES.has(entrada?.mime) || Number(entrada?.mida) > MAX_BYTES) {
        rebutjats += 1;
        if (ruta) sobrants.push(ruta);
        continue;
      }
      // QA-03 · Un senyal per lectura: el tall de sessió, tanca() o el termini l'avorten.
      const control = new AbortController();
      enVol.add(control);
      const rellotge = setTimeout(() => control.abort(), termini);
      try {
        const url = pont.convertFileSrc(ruta);
        const resposta = await fins(llegix(url, { signal: control.signal }), control.signal);
        if (caducat()) { abandona(entrades.slice(i)); return; }
        if (!resposta?.ok) throw new Error(`HTTP ${resposta?.status}`);
        const blob = await fins(resposta.blob(), control.signal);
        if (caducat()) { abandona(entrades.slice(i)); return; }
        if (!blob.size || blob.size > MAX_BYTES) throw new Error('mida');
        fitxers.push(new File([blob], nomNet(entrada.nom), { type: entrada.mime }));
        rutesDelsFitxers.push(ruta);
        urls.push(url);
      } catch {
        // També l'avortada: la volta següent (o la comprovació de després del bucle) mira si la sessió ha canviat.
        rebutjats += 1;
        sobrants.push(ruta);
      } finally {
        clearTimeout(rellotge);
        enVol.delete(control);
      }
    }
    // També un lot sense fitxers, o si l'última lectura ha fallat després del canvi.
    if (caducat()) { abandona([]); return; }
    allibera(sobrants);
    const assumpte = textNet(dades?.assumpte, MAX_TEXT_COMPARTIT);
    const cos = textNet(dades?.text, MAX_TEXT_COMPARTIT);
    const text = textNet(assumpte && cos && !cos.startsWith(assumpte) ? `${assumpte}\n\n${cos}` : cos || assumpte, MAX_TEXT_COMPARTIT);
    // L'hora de l'intent natiu (Android): el registre la compara amb l'últim canvi de sessió.
    const rebutMs = typeof dades?.rebutMs === 'number' && Number.isFinite(dades.rebutMs) ? dades.rebutMs : undefined;
    // El registre no l'ha pres (d'abans d'un canvi de sessió, o buit): la finestra tampoc el veu.
    if (lliura({ fitxers, rutes: rutesDelsFitxers, text, rebutjats, sessio: epoca, rebutMs }) === null) return;
    try {
      finestra.dispatchEvent?.(new finestra.CustomEvent(ESDEVENIMENT_FINESTRA, {
        detail: { imatgeUri: urls[0] ?? null, imatgesUri: urls, text, rebutjats }
      }));
    } catch { /* L'avís a la finestra és de cortesia: el registre ja el té. */ }
  };

  return {
    /** Allibera la còpia nativa d'estes rutes (el registre ho crida en enviar o descartar). Mai llança. */
    allibera,
    /** Talla la sessió a la banda nativa i avorta les lectures en vol (el registre ho crida en canviar de sessió). Mai llança. */
    tallaSessio,
    /**
     * Plega: avorta les lectures en vol, deixa d'escoltar i cap lot més no
     * arriba. Les còpies natives no s'alliberen (tornaran en arrencar), i
     * allibera i tallaSessio continuen servint el registre. Mai llança.
     */
    tanca() {
      tancat = true;
      avortaLectures();
      Promise.resolve(oient).then((asa) => asa?.remove?.()).catch(() => {});
    },
    /** Escolta el connector. Mai llança: sense connector (o ja tancat), torna false. */
    async escolta(lliura) {
      if (typeof lliura !== 'function' || tancat) return false;
      let cua = Promise.resolve();
      try {
        oient = pont.addListener(CONNECTOR_COMPARTIR, ESDEVENIMENT_COMPARTIT, (dades, error) => {
          if (error || !dades || tancat) return;
          // La sessió d'ara, abans d'esperar a la cua: un canvi mentre espera també el caduca.
          const epoca = sessioAra();
          // Un lot rere l'altre: dos comparticions seguides no s'encavalquen.
          cua = cua.then(() => rep(dades, lliura, epoca)).catch(() => {});
        });
        return true;
      } catch {
        return false;
      }
    }
  };
}
