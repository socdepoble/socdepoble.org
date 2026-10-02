/**
 * VistaPreviaFull.jsx — el full maquetat (maquetaFull) com el veurà la gestoria.
 *
 * Pinta `full.files` fila per fila en una taula HTML que imita el full de
 * càlcul: la fila de títol, les barres INGRESSOS i GASTOS fosques amb el text
 * clar, la capçalera grisa, les dades i els totals en negreta. Les cel·les
 * combinades del full (`combinacions`) ho són també ací. És el mateix full
 * que escriuen el CSV i l'XLSX: el que es veu és el que s'envia.
 *
 * Accessible: la Taula de Pedra Seca (regió amb nom i desplaçament amb
 * teclat), capçaleres de columna com a <th scope="col"> i barres com a
 * <th scope="colgroup">. Els colors ixen dels tokens del tema, no de la
 * plantilla.
 */
import { Taula } from '../../components/PedraSeca/organismes/Taula.jsx';
import { formatData } from './nucli/dates.js';
import { formatImport } from './nucli/diners.js';

const RANG = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/;

/* «A» → 0, «H» → 7, «AA» → 26. */
function indexColumna(lletres) {
  let n = 0;
  for (const lletra of lletres) n = n * 26 + (lletra.charCodeAt(0) - 64);
  return n - 1;
}

/* Les combinacions d'una sola fila, per índex de fila: [{ inici, fi }]. */
export function combinacionsPerFila(combinacions) {
  const perFila = new Map();
  for (const rang of Array.isArray(combinacions) ? combinacions : []) {
    const r = RANG.exec(String(rang));
    if (!r || r[2] !== r[4]) continue;
    const fila = Number(r[2]) - 1;
    perFila.set(fila, [...(perFila.get(fila) ?? []), { inici: indexColumna(r[1]), fi: indexColumna(r[3]) }]);
  }
  return perFila;
}

/** El text d'una cel·la tal com el mostra el full: dates curtes i imports amb «€». */
export function textCel(cel, formats) {
  if (!cel || cel.valor == null) return '';
  if (cel.tipus === 'data') return formatData(cel.valor, formats?.dataText ?? 'dd/mm/aa');
  if (cel.tipus === 'import') return formatImport(cel.valor);
  return String(cel.valor);
}

/* Les cel·les d'una fila, amb les combinades fusionades: [{ cel, colSpan, clau }]. */
function cellesDe(fila, n, combinades) {
  const eixida = [];
  for (let i = 0; i < n; i += 1) {
    const combinacio = combinades.find((c) => c.inici === i);
    const colSpan = combinacio ? combinacio.fi - combinacio.inici + 1 : 1;
    eixida.push({ cel: fila.celles?.[i] ?? null, colSpan, clau: i });
    i += colSpan - 1;
  }
  return eixida;
}

function Dada({ cel, colSpan, formats }) {
  return (
    <td className="sdp-gestoria-full__cel" data-tipus={cel?.tipus ?? 'buida'} colSpan={colSpan > 1 ? colSpan : undefined}>
      {textCel(cel, formats)}
    </td>
  );
}

function Fila({ fila, n, combinades, formats }) {
  const celles = cellesDe(fila, n, combinades);
  switch (fila.rol) {
    case 'titol':
      return (
        <tr className="sdp-gestoria-full__titol">
          {celles.map(({ cel, colSpan, clau }) => <Dada key={clau} cel={cel} colSpan={colSpan} formats={formats} />)}
        </tr>
      );
    case 'barra':
      return (
        <tr className="sdp-gestoria-full__barra">
          {celles.map(({ cel, colSpan, clau }) => (
            <th key={clau} scope="colgroup" className="sdp-gestoria-full__cel" colSpan={colSpan > 1 ? colSpan : undefined}>
              {textCel(cel, formats)}
            </th>
          ))}
        </tr>
      );
    case 'capcalera':
      return (
        <tr className="sdp-gestoria-full__capcalera">
          {celles.map(({ cel, colSpan, clau }) => (
            <th key={clau} scope="col" className="sdp-gestoria-full__cel" colSpan={colSpan > 1 ? colSpan : undefined}>
              {textCel(cel, formats)}
            </th>
          ))}
        </tr>
      );
    case 'totals':
      return (
        <tr className="sdp-gestoria-full__totals">
          {celles.map(({ cel, colSpan, clau }) => <Dada key={clau} cel={cel} colSpan={colSpan} formats={formats} />)}
        </tr>
      );
    case 'dada':
    case 'fila':
      return (
        <tr className="sdp-gestoria-full__dada">
          {celles.map(({ cel, colSpan, clau }) => <Dada key={clau} cel={cel} colSpan={colSpan} formats={formats} />)}
        </tr>
      );
    default:
      /* Les files buides només separen blocs: el lector de pantalla no les compta. */
      return (
        <tr className="sdp-gestoria-full__buida" aria-hidden="true">
          {celles.map(({ clau, colSpan }) => <td key={clau} className="sdp-gestoria-full__cel" colSpan={colSpan > 1 ? colSpan : undefined} />)}
        </tr>
      );
  }
}

/**
 * @param {{ full: object, titol?: string }} props full: el de maquetaFull
 */
export default function VistaPreviaFull({ full, titol = 'Vista prèvia del full' }) {
  if (!full || !Array.isArray(full.files) || !Array.isArray(full.columnes)) return null;
  const n = full.columnes.length;
  const combinades = combinacionsPerFila(full.combinacions);
  return (
    <Taula titol={titol} densa className="sdp-gestoria-full">
      <tbody>
        {full.files.map((fila, i) => (
          <Fila key={`${i}-${fila.rol}`} fila={fila} n={n} combinades={combinades.get(i) ?? []} formats={full.formats} />
        ))}
      </tbody>
    </Taula>
  );
}
