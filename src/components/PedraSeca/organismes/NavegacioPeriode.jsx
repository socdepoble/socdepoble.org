/**
 * NavegacioPeriode.jsx — «Hui ‹ ›» d'un període i el selector de vista.
 *
 * T10 (ordre del Mestre, 261001) · NavegacioMes (CalendariMes.jsx) porta
 * mouMes escrit dins i no servix per a moure setmanes; tampoc es pot tocar,
 * perquè la fan servir el Mur, la Consola i el selector de l'editor (Llei del
 * Píxel). Esta navegació no sap què és un període: qui la munta li diu què fan
 * les fletxes i «Hui», i quin text té cada una.
 *
 * Fase visual (prompt 261001_0445) · L'ordre i la pintura de les captures del
 * Mestre: primer «Hui» (botó secundari), després les fletxes ‹ › (fantasma,
 * només icona, 44×44, amb el nom del pas: «Setmana anterior», «Any següent»…),
 * el títol del període i, al final, el selector de les cinc vistes (Setmana,
 * Dues setmanes, Mes, Any i Agenda). La barra s'apila sola en un contenidor
 * estret (flex-wrap): cap media query.
 *
 * CONTRACTE
 *   onAnterior / onHui / onSeguent · () => void.
 *   etiquetes · { anterior, hui, seguent }: el nom de les fletxes i el text de
 *     «Hui» (per defecte, les del mes: «Mes anterior», «Hui», «Mes següent»;
 *     les que falten, les per defecte).
 *   titol · el període que es veu, en text («octubre de 2026»), o res. És un
 *     <p aria-live="polite">: no és cap encapçalament de la pàgina.
 *   vista / onCanviaVista · el selector (PillToggle: role="group" i botons amb
 *     aria-pressed): sense onCanviaVista, no n'hi ha. vistes · [{ valor, text }]
 *     (per defecte, les cinc del calendari); etiquetaVistes · el nom del grup
 *     («Vista»).
 *   className · classes de més per a la barra.
 *   accions · node opcional (ordre del Mestre, 261001: el botó de pantalla
 *     completa del Calendari). Es pinta tal qual, sense embolcall, entre el
 *     títol i el selector; sense, el DOM és el de sempre.
 *
 * Importa per camí directe (mai per index.js): la porta de dependències
 * circulars de Pedra Seca ho exigix.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';
import { PillToggle } from '../molecules/PillToggle.jsx';

const ETIQUETES_PER_DEFECTE = Object.freeze({ anterior: 'Mes anterior', hui: 'Hui', seguent: 'Mes següent' });
const VISTES_PER_DEFECTE = Object.freeze([
  Object.freeze({ valor: 'setmana', text: 'Setmana' }),
  Object.freeze({ valor: 'dues-setmanes', text: 'Dues setmanes' }),
  Object.freeze({ valor: 'mes', text: 'Mes' }),
  Object.freeze({ valor: 'any', text: 'Any' }),
  Object.freeze({ valor: 'agenda', text: 'Agenda' })
]);

export function NavegacioPeriode({
  onAnterior, onHui, onSeguent, etiquetes, titol,
  vista, onCanviaVista, vistes = VISTES_PER_DEFECTE, etiquetaVistes = 'Vista', className, accions
}) {
  const text = { ...ETIQUETES_PER_DEFECTE, ...etiquetes };
  return (
    <div className={['sdp-cal-navegacio', className].filter(Boolean).join(' ')}>
      <Boto varietat="secundari" onClick={() => onHui?.()}>{text.hui}</Boto>
      <Boto varietat="fantasma" className="sdp-cal-navegacio__fletxa" icona={ChevronLeft}
        onClick={() => onAnterior?.()} aria-label={text.anterior} />
      <Boto varietat="fantasma" className="sdp-cal-navegacio__fletxa" icona={ChevronRight}
        onClick={() => onSeguent?.()} aria-label={text.seguent} />
      {titol ? <p className="sdp-cal-navegacio__titol" aria-live="polite">{titol}</p> : null}
      {accions ?? null}
      {onCanviaVista ? (
        <PillToggle className="sdp-cal-vistes" opcions={vistes} valor={vista} onCanvi={onCanviaVista} etiqueta={etiquetaVistes} />
      ) : null}
    </div>
  );
}
