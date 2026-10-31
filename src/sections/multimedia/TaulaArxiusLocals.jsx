/**
 * TaulaArxiusLocals.jsx — L'«Explorador d'arxius (taula)» del Gestor
 * d'arxius locals (IDEA-55 · Onada 261029_1605): 100 files per pàgina, de
 * TOTS els tipus, amb la <Taula> de Pedra Seca (regió amb nom i desplaçament
 * horitzontal operable amb teclat). El nom de cada fila és el botó que obri
 * el detall.
 *
 * Gauntlet 261029 (cicle 1) · dataCurtaLocal viu a suportGestorLocal.js (este
 * fitxer només exporta components: Fast Refresh). `ambEstat`: el botó és un
 * commutador (aria-pressed) només al Gestor autònom, on triar marca la fila;
 * a l'espai de /multimedia el clic navega a la fitxa i no commuta res. Els
 * noms es pinten amb nomVisibleLocal (cap control de direcció del text).
 *
 * IDEA-58 · Gemini 261030 (G6) · Fletxes: el <tbody> és una graella de
 * teclat (gestionaTeclaGraella) d'una columna, una fila per cel·la, on el
 * focus va al botó del nom: ↓ i → la fila de davall, ↑ i ← la de dalt,
 * Inici, Fi; dins de /multimedia, ← torna a la fitxa activa de la llista i
 * → des de la llista hi entra (entradaDelDetall). Cap fletxa tria cap fila. La regió de
 * la <Taula> conserva el seu desplaçament horitzontal amb les fletxes.
 */
import { Taula } from '../../components/PedraSeca/index.js';
import { gestionaTeclaGraella } from '../../components/universal/workspace/navegacioTeclat.js';
import { formatKb } from './motorMultimediaLocal.js';
import { InsigniesArxiuLocal } from './GraellaAlbumLocal.jsx';
import { dataCurtaLocal, nomVisibleLocal } from './suportGestorLocal.js';
import { TEXTOS_LOCAL as T, tradueix } from './textosGestorLocal.js';
import { useLocaleOpcional } from './useLocaleOpcional.js';

const COLUMNES = Object.freeze(['col.nom', 'col.carpeta', 'col.tipus', 'col.mida', 'col.estat', 'col.modificat']);

export function TaulaArxiusLocals({ t, elements = [], seleccionat = null, exactes = null, onSelecciona, registraTessela, ambEstat = true }) {
  const locale = useLocaleOpcional();
  return (
    <Taula titol={tradueix(t, T['vista.taula'])} densa>
      <thead>
        <tr>
          {COLUMNES.map((col) => <th key={col} scope="col">{tradueix(t, T[col])}</th>)}
        </tr>
      </thead>
      <tbody data-graella-teclat="" onKeyDown={gestionaTeclaGraella}>
        {elements.map((el) => (
          <tr key={el.ruta}>
            <td>
              <button
                type="button"
                ref={(node) => registraTessela?.(el.ruta, node)}
                className="sdp-boto sdp-boto--fantasma"
                aria-pressed={ambEstat ? (el.ruta === seleccionat ? 'true' : 'false') : undefined}
                onClick={() => onSelecciona?.(el)}
              >
                {nomVisibleLocal(el.nom)}
              </button>
            </td>
            <td>{nomVisibleLocal(el.carpeta || '/')}</td>
            <td>{el.ext ? el.ext.toUpperCase() : '—'}</td>
            <td>{formatKb(el.mida, locale)}</td>
            <td><InsigniesArxiuLocal t={t} el={el} exactes={exactes} /></td>
            <td>{dataCurtaLocal(el.modificat)}</td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}
