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
 *
 * Fase visual (prompt 261001_0445) · Dins de les vistes noves (?vista=), la
 * pastilla tornava al calendari d'ara: rutaCalendariDelMes no sap res del
 * ?vista=. El context pot ser també una funció (mes) => ruta, i la pàgina, a
 * les vistes noves, hi posa la que porta a la vista Mes d'eixe mes. El valor
 * `true` continua igual per al calendari d'ara. Si la funció no torna cap
 * ruta, la de sempre.
 */
import { createContext, useContext } from 'react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { ACCIO_PASTILLA_DIA, RUTA_CALENDARI, etiquetaPastillaCalendari, mesDeLaPastilla, rutaCalendariDeLaData, rutaCalendariDelMes } from '../editorial.js';

/**
 * Dins de la pàgina /calendari (CalendariSection): `true` (el calendari d'ara)
 * o una funció (mes 'AAAA-MM' | null) => ruta (les vistes noves). Fora, false.
 */
export const DinsDelCalendari = createContext(false);

/* El navegador del router, o null fora d'un Router. */
function useNavegaSiHiHaRouter() {
  try {
    /* useNavigate() llança fora d'un Router (EventCard dins de proves o d'amfitrions
       sense router); el cas depén de l'arbre, no de l'estat, i l'ordre dels hooks
       no canvia entre renders. */
    return useNavigate();
  } catch {
    return null;
  }
}

/**
 * `{ onClick, etiqueta }` per a DateTimeControl (onClick i label) a partir de
 * la mateixa pastilla que es pinta: `{ time, date, dateTime }`.
 */
export function usePastillaCalendari({ time, date, dateTime } = {}) {
  const navigate = useNavegaSiHiHaRouter();
  const dinsDelCalendari = useContext(DinsDelCalendari);
  const mes = mesDeLaPastilla({ dateTime, date });
  const onClick = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (typeof navigate !== 'function') return;
    const propia = typeof dinsDelCalendari === 'function' ? dinsDelCalendari(mes) : null;
    const ruta = typeof propia === 'string' && propia ? propia : rutaCalendariDelMes(mes);
    if (dinsDelCalendari) navigate(ruta, { replace: true });
    else navigate(ruta);
  };
  return {
    onClick: mes ? onClick : null,
    etiqueta: mes ? etiquetaPastillaCalendari({ time, date }) : [time, date].filter(value => typeof value === 'string' && value.trim()).join(' ')
  };
}

/**
 * P0-77 / IDEA-208 (R16-P; ordre del Mestre, 261109 20:57) · La pastilla d'un
 * ACTE porta al seu dia: «si es un evento […] el botón de la fecha del evento
 * es pinchable y distinto a la card». Derogat, només per als actes, el carril
 * A del 261001 (al mes): una publicació continua portant al mes
 * (usePastillaCalendari). `dia`: la clau 'AAAA-MM-DD' de l'acte, la mateixa
 * que pinta la pastilla; la ruta és la de l'etiqueta «Agenda»
 * (rutaCalendariDeLaData, la vista Mes amb el dia triat). El clic, com el de
 * la pastilla del mes: preventDefault, stopPropagation (no obri la targeta) i,
 * dins del Calendari, reemplaça l'entrada de l'historial. Sense un dia que
 * existisca, `onClick` és null i qui pinta la targeta torna a la del mes.
 */
export function usePastillaDelDia({ dia, time, date } = {}) {
  const navigate = useNavegaSiHiHaRouter();
  const dinsDelCalendari = useContext(DinsDelCalendari);
  const ruta = rutaCalendariDeLaData(dia);
  const valid = ruta !== RUTA_CALENDARI;
  const onClick = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (typeof navigate !== 'function') return;
    if (dinsDelCalendari) navigate(ruta, { replace: true });
    else navigate(ruta);
  };
  return {
    onClick: valid ? onClick : null,
    etiqueta: valid ? etiquetaPastillaCalendari({ time, date }, ACCIO_PASTILLA_DIA) : undefined
  };
}
