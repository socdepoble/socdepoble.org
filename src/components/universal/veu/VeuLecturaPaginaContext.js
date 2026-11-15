/**
 * VeuLecturaPaginaContext.js · IDEA-255 (Onada R23) + IDEA-268 (Onada R27) ·
 * Context lleuger perquè qualsevol publicació o peça filla de PageFrame:
 *   1. Sàpia que PageFrame ja pinta el disparador universal sota l'entradilla
 *      (.page-intro) i no duplique cap botó a la mateixa vista (el valor és
 *      truthy quan PageFrame governa la lectura; `false` fora de PageFrame o en
 *      mode edició).
 *   2. Puga obrir, tancar o alternar el Reproductor Universal de So
 *      (`BarraReproductorVeu`) quan l'usuari interactua amb controls sonors
 *      dins de l'article (p. ex. «Tria esta veu» al Banc de Veus en mòbil).
 *      `obriReproductor({ invocador, seguixLectura })`: `invocador` és el
 *      control on torna el focus en tancar la barra, i `seguixLectura: false`
 *      fa que l'avanç automàtic de bloc no desplace la pàgina (la persona es
 *      queda on és). Sense opcions, obri com el botó «Escolta la IAIA».
 */
import { createContext, useContext } from 'react';

export const VeuLecturaPaginaContext = createContext(false);

export function useVeuLecturaPaginaActiva() {
  return useContext(VeuLecturaPaginaContext);
}

export function useControlVeuLecturaPagina() {
  const ctx = useContext(VeuLecturaPaginaContext);
  if (ctx && typeof ctx === 'object') return ctx;
  return {
    activa: Boolean(ctx),
    reproductorObert: false,
    parlant: false,
    obriReproductor: null,
    tancaReproductor: null,
    alternaReproductor: null,
  };
}
