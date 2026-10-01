/**
 * pastillaCalendari.js — la pastilla de data en LECTURA porta al Calendari.
 *
 * Ordre del Mestre, 261001 (tasca 4, «la Boina Taronja») · La pastilla de la
 * barra taronja de les pàgines (UniversalPage → PageFrame → BarraTaronja) i
 * la de la boina de les targetes (UniversalCard) és clicable en lectura i
 * porta al calendari global. Abans duien al filtre del Mur, cadascuna amb la
 * seua còpia del càlcul del dia.
 *
 * Ordre del Mestre, 261001 (carril A) · Porta al MES que pinta
 * (/calendari?mes=AAAA-MM, mes local), no al dia ni a hui: «t’ha de portar al
 * Calendari ubicat exactament en el mes i l’any […] en què es va publicar
 * eixa targeta», i davall ixen totes les targetes d'eixe mes. Abans,
 * /calendari?date=AAAA-MM-DD, i la llista quedava en un sol dia.
 *
 * Per què el Calendari i no la pàgina de l'element (el Mestre deixava triar):
 * a la targeta, el títol i la imatge ja hi porten (mainHref), i a la pàgina
 * ja s'hi és; la data és l'única peça que parla del temps, i el Calendari és
 * on es veu què més es va publicar en eixe període.
 *
 * En EDICIÓ no hi entra: la closca de l'editor hi posa el selector de T40
 * (barActions) i esta pastilla no es pinta. Qui passa un onDateTime propi (la
 * previsualització que avisa, TargetaViva) continua manant.
 *
 * El clic no arriba a la targeta que l'envolta (stopPropagation) ni fa cap
 * acció nativa (preventDefault), i navega amb el router de l'app, no amb
 * window.location: dins d'un amfitrió (WordPress) la barra d'adreces no és
 * nostra.
 *
 * Dins del mateix Calendari (les targetes de davall també porten pastilla),
 * el clic REEMPLAÇA l'entrada de l'historial, com les fletxes i els dies:
 * moure's pel calendari no l'ha d'omplir, i tres pastilles del mes que ja es
 * veu no han de demanar quatre «Enrere» per a tornar d'on es venia. Ho diu
 * el context DinsDelCalendari, que posa la pàgina /calendari: la pastilla no
 * depén de llegir la ubicació del router.
 */
import { createContext, useContext } from 'react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { etiquetaPastillaCalendari, mesDeLaPastilla, rutaCalendariDelMes } from '../editorial.js';

/** `true` dins de la pàgina /calendari (CalendariSection). */
export const DinsDelCalendari = createContext(false);

/**
 * `{ onClick, etiqueta }` per a DateTimeControl (onClick i label) a partir de
 * la mateixa pastilla que es pinta: `{ time, date, dateTime }`.
 */
export function usePastillaCalendari({ time, date, dateTime } = {}) {
  const navigate = useNavigate();
  const dinsDelCalendari = useContext(DinsDelCalendari);
  const onClick = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const ruta = rutaCalendariDelMes(mesDeLaPastilla({ dateTime, date }));
    if (dinsDelCalendari) navigate(ruta, { replace: true });
    else navigate(ruta);
  };
  return { onClick, etiqueta: etiquetaPastillaCalendari({ time, date }) };
}
