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
   enxufada ho puga escoltar sense acostar-se al natiu. */
import { MAX_FITXERS_COMPARTITS, MAX_TEXT_COMPARTIT } from '../config/compartirNatiu.js';

export const CONNECTOR_COMPARTIR = 'CompartirNatiu';
export const ESDEVENIMENT_COMPARTIT = 'compartit';
export const ESDEVENIMENT_FINESTRA = 'sdp:compartir_natiu';
/* Els formats que el xat sap preparar (adjuntLocal.js), els mateixos que copia el natiu. */
const MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 20 * 1024 * 1024;

/* Per caràcters sencers: ni un emoji partit per la meitat. */
const textNet = (valor, max) => (typeof valor === 'string' ? Array.from(valor.trim()).slice(0, max).join('') : '');
/* El nom original només es mostra: cap barra ni caràcter de control. */
const nomNet = (valor) => [...textNet(valor, 120)]
  .map((c) => (c === '/' || c === '\\' || c.charCodeAt(0) < 32 ? '_' : c)).join('') || 'captura';

/**
 * @param {{ finestra?: object, llegix?: (url: string) => Promise<Response> }} [opcions]
 * @returns {{ escolta(lliura: Function): Promise<boolean> }|null} null fora de l'App
 */
export function creaReceptorCompartit({ finestra = globalThis, llegix = (url) => globalThis.fetch(url) } = {}) {
  const pont = finestra?.Capacitor;
  if (typeof pont?.addListener !== 'function' || typeof pont?.convertFileSrc !== 'function') return null;
  const allibera = (rutes) => {
    if (!rutes.length || typeof pont.nativePromise !== 'function') return;
    Promise.resolve().then(() => pont.nativePromise(CONNECTOR_COMPARTIR, 'allibera', { rutes })).catch(() => {});
  };

  const rep = async (dades, lliura) => {
    const entrades = Array.isArray(dades?.fitxers) ? dades.fitxers.slice(0, MAX_FITXERS_COMPARTITS) : [];
    let rebutjats = Math.max(0, Math.floor(Number(dades?.rebutjats) || 0))
      + Math.max(0, (Array.isArray(dades?.fitxers) ? dades.fitxers.length : 0) - entrades.length);
    const fitxers = [];
    const rutesDelsFitxers = [];
    const urls = [];
    /* Les còpies que no arribaran mai al registre (passen del límit, format o
       ruta dolents, il·legibles) s'alliberen ara; les bones, quan s'envien. */
    const sobrants = (Array.isArray(dades?.fitxers) ? dades.fitxers.slice(MAX_FITXERS_COMPARTITS) : [])
      .map((entrada) => (typeof entrada?.ruta === 'string' ? entrada.ruta : '')).filter(Boolean);
    for (const entrada of entrades) {
      const ruta = typeof entrada?.ruta === 'string' ? entrada.ruta : '';
      if (!ruta.startsWith('/') || !MIMES.has(entrada?.mime) || Number(entrada?.mida) > MAX_BYTES) {
        rebutjats += 1;
        if (ruta) sobrants.push(ruta);
        continue;
      }
      try {
        const url = pont.convertFileSrc(ruta);
        const resposta = await llegix(url);
        if (!resposta?.ok) throw new Error(`HTTP ${resposta?.status}`);
        const blob = await resposta.blob();
        if (!blob.size || blob.size > MAX_BYTES) throw new Error('mida');
        fitxers.push(new File([blob], nomNet(entrada.nom), { type: entrada.mime }));
        rutesDelsFitxers.push(ruta);
        urls.push(url);
      } catch {
        rebutjats += 1;
        sobrants.push(ruta);
      }
    }
    allibera(sobrants);
    const assumpte = textNet(dades?.assumpte, MAX_TEXT_COMPARTIT);
    const cos = textNet(dades?.text, MAX_TEXT_COMPARTIT);
    const text = textNet(assumpte && cos && !cos.startsWith(assumpte) ? `${assumpte}\n\n${cos}` : cos || assumpte, MAX_TEXT_COMPARTIT);
    lliura({ fitxers, rutes: rutesDelsFitxers, text, rebutjats });
    try {
      finestra.dispatchEvent?.(new finestra.CustomEvent(ESDEVENIMENT_FINESTRA, {
        detail: { imatgeUri: urls[0] ?? null, imatgesUri: urls, text, rebutjats }
      }));
    } catch { /* L'avís a la finestra és de cortesia: el registre ja el té. */ }
  };

  return {
    /** Allibera la còpia nativa d'estes rutes (el registre ho crida en enviar o descartar). Mai llança. */
    allibera,
    /** Escolta el connector. Mai llança: sense connector, torna false. */
    async escolta(lliura) {
      if (typeof lliura !== 'function') return false;
      let cua = Promise.resolve();
      try {
        pont.addListener(CONNECTOR_COMPARTIR, ESDEVENIMENT_COMPARTIT, (dades, error) => {
          if (error || !dades) return;
          // Un lot rere l'altre: dos comparticions seguides no s'encavalquen.
          cua = cua.then(() => rep(dades, lliura)).catch(() => {});
        });
        return true;
      } catch {
        return false;
      }
    }
  };
}
