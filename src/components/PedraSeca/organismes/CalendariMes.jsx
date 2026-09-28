/**
 * CalendariMes.jsx — El mes de calendari de Pedra Seca: navegació i graella.
 *
 * T40 (ordre del Mestre, 260928) · Una sola estructura per a la Consola
 * (CalendariMapa, amb les tasques de cada dia) i per al selector de data de
 * publicació de l'editor (SelectorDataHora, en xicotet). Reproduïx EXACTAMENT
 * el marcatge que tenia CalendariMapa: «‹ Hui ›» amb tres Boto secundaris, i
 * una Taula amb caption, capçalera dl.–dg. (abbr amb el nom llarg) i una fila
 * per setmana. Sense `compacta` ni `className`, la Taula no porta cap classe
 * més que la seua: el DOM de la Consola no canvia.
 *
 * CONTRACTE
 *   NavegacioMes · cursor {any, mes} · onCanvia(cursor) · avui (Date) ·
 *     className · etiquetes { anterior, hui, seguent }
 *   GraellaMes · any · mes (0–11) · locale · titol (nom de la regió) · avui ·
 *     renderDia(dia, { esAvui, numero }) → node · compacta · className
 *     `numero` és el marcatge de sempre del dia: <strong> i « (hui)» per al
 *     lector si és hui, o el número tal qual.
 *
 * Importa per camí directe (mai per index.js): la porta de dependències
 * circulars de Pedra Seca ho exigix.
 */
import { Boto } from '../atoms/Boto.jsx';
import { Taula } from './Taula.jsx';
import { DIES_CURTS, DIES_LLARGS, cursorDe, graellaMes, mouMes } from '../../../utils/calendari.js';

const ETIQUETES_PER_DEFECTE = Object.freeze({ anterior: 'Mes anterior', hui: 'Hui', seguent: 'Mes següent' });

export function NavegacioMes({ cursor, onCanvia, avui = new Date(), className, etiquetes = ETIQUETES_PER_DEFECTE }) {
  return (
    <div className={className}>
      <Boto varietat="secundari" onClick={() => onCanvia?.(mouMes(cursor, -1))} aria-label={etiquetes.anterior}>‹</Boto>
      <Boto varietat="secundari" onClick={() => onCanvia?.(cursorDe(avui))}>{etiquetes.hui}</Boto>
      <Boto varietat="secundari" onClick={() => onCanvia?.(mouMes(cursor, 1))} aria-label={etiquetes.seguent}>›</Boto>
    </div>
  );
}

const numeroTalQual = (_dia, { numero }) => numero;

export function GraellaMes({ any, mes, locale, titol, avui = new Date(), renderDia = numeroTalQual, compacta = false, className }) {
  const setmanes = graellaMes(any, mes);
  const titolMes = new Date(any, mes, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const esAvui = (dia) => dia === avui.getDate() && mes === avui.getMonth() && any === avui.getFullYear();
  const classe = [compacta && 'sdp-calendari--compacte', className].filter(Boolean).join(' ') || undefined;
  return (
    <Taula titol={titol ?? `Calendari de ${titolMes}`} className={classe}>
      <caption>{titolMes}</caption>
      <thead>
        <tr>{DIES_CURTS.map((d, i) => <th key={d} scope="col"><abbr title={DIES_LLARGS[i]}>{d}</abbr></th>)}</tr>
      </thead>
      <tbody>
        {setmanes.map((setmana) => (
          <tr key={setmana.find(Boolean)}>
            {setmana.map((dia, i) => {
              if (!dia) return <td key={`buit-${i}`}>{null}</td>;
              const hui = esAvui(dia);
              const numero = hui ? <><strong>{dia}</strong><span className="sdp-nomes-lector"> (hui)</span></> : dia;
              return <td key={dia}>{renderDia(dia, { esAvui: hui, numero })}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}
