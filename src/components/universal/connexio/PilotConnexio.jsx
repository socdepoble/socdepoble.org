import { estatValid } from './estatConnexio.js';

/**
 * PilotConnexio.jsx — T7 (261001) · El pilot de connexió amb el node.
 *
 * Forma i color diuen l'estat (WCAG 1.4.1, mai només el color): verd i ple
 * quan està connectat; groc i en anell mentre es connecta o sense connexió.
 * L'estat va en data-estat (modules.css, .sdp-pilot), no en una classe
 * plantilla. El punt és aria-hidden: amb `etiqueta`, l'estat es diu en un
 * text només per al lector de pantalla; sense, qui el munta ja el diu en
 * text visible (la franja de l'amfitrió).
 */
export function PilotConnexio({ estat, etiqueta }) {
  return (
    <>
      <span className="sdp-pilot" data-estat={estatValid(estat)} aria-hidden="true" />
      {etiqueta ? <span className="sr-only">{etiqueta}</span> : null}
    </>
  );
}

export default PilotConnexio;
