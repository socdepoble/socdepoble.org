/**
 * GraellaAlbumLocal.jsx — La «Graella d'àlbum» del Gestor d'arxius locals
 * (IDEA-54/55 · Onada 261029_1605): 24 tessel·les per pàgina, de TOTS els
 * tipus. Les imatges porten una miniatura real feta amb els bytes locals; la
 * resta, una targeta amb la icona del tipus i l'extensió.
 *
 * Les miniatures (useMiniaturesLocals) i les icones de tipus viuen a
 * miniaturesLocals.js (Gauntlet 261029, cicle 1: este fitxer només exporta
 * components, per Fast Refresh). `ambEstat`: la tessel·la és un commutador
 * (aria-pressed) només al Gestor autònom; a l'espai de /multimedia el clic
 * navega a la fitxa. Els noms, amb nomVisibleLocal.
 */
import { File as IconaFitxer } from 'lucide-react';
import { Insignia } from '../../components/PedraSeca/index.js';
import { gestionaTeclaGraella } from '../../components/universal/workspace/navegacioTeclat.js';
import { etiquetesEstatLocal, formatKb } from './motorMultimediaLocal.js';
import { ICONES_TIPUS_LOCAL, useMiniaturesLocals } from './miniaturesLocals.js';
import { nomVisibleLocal } from './suportGestorLocal.js';
import { TEXTOS_LOCAL as T, tradueix } from './textosGestorLocal.js';
import { useLocaleOpcional } from './useLocaleOpcional.js';

/* Les insígnies d'estat: 'duplicada' és el duplicat exacte (SHA-256); 'possibleDuplicat', l'heurística. */
const INSIGNIES = Object.freeze({
  publicada: ['exit', T['insignia.publicada']],
  bessonaWebp: ['info', T['insignia.bessona']],
  inedita: ['avis', T['insignia.inedita']],
  pesAlt: ['avis', T['insignia.pesAlt']],
  duplicada: ['error', T['insignia.duplicada']],
  possibleDuplicat: ['neutre', T['insignia.possible']]
});

export function InsigniesArxiuLocal({ t, el, exactes = null }) {
  const etiquetes = etiquetesEstatLocal(el, exactes);
  if (etiquetes.length === 0) return null;
  return (
    <span className="sdp-arxiu-local__insignies">
      {etiquetes.map((etiqueta) => {
        const [to, parell] = INSIGNIES[etiqueta] || ['neutre', null];
        return parell ? <Insignia key={etiqueta} to={to}>{tradueix(t, parell)}</Insignia> : null;
      })}
    </span>
  );
}

export function GraellaAlbumLocal({ t, font, elements = [], seleccionat = null, exactes = null, onSelecciona, registraTessela, ambEstat = true }) {
  const miniatures = useMiniaturesLocals(font, elements);
  const locale = useLocaleOpcional();
  /* IDEA-58 · Fletxes 2D (gestionaTeclaGraella): → ← ±1, ↓ ↑ la fila
     (columnes per geometria), Inici, Fi; dins de /multimedia, ← des de la
     primera columna torna a la fitxa activa de la llista. Cap selecció:
     Enter i Espai fan el clic de sempre. */
  return (
    <ul className="sdp-arxiu-local__graella" data-graella-teclat="" onKeyDown={gestionaTeclaGraella}>
      {elements.map((el) => {
        const src = miniatures.get(el.ruta);
        const Icona = ICONES_TIPUS_LOCAL[el.tipus] || IconaFitxer;
        const esImatge = el.vista === 'imatge' || el.vista === 'svg';
        return (
          <li key={el.ruta}>
            <button
              type="button"
              ref={(node) => registraTessela?.(el.ruta, node)}
              className={esImatge ? 'sdp-arxiu-local__tessela' : 'sdp-arxiu-local__tessela sdp-arxiu-local__tessela--arxiu'}
              aria-pressed={ambEstat ? (el.ruta === seleccionat ? 'true' : 'false') : undefined}
              onClick={() => onSelecciona?.(el)}
            >
              {src ? (
                <img className="sdp-arxiu-local__miniatura" src={src} alt="" loading="lazy" decoding="async" />
              ) : (
                <span className="sdp-arxiu-local__icona" aria-hidden="true">
                  <Icona size={36} focusable="false" />
                  {el.ext ? <span className="sdp-arxiu-local__ext">{`.${el.ext}`}</span> : null}
                </span>
              )}
              <span className="sdp-arxiu-local__nom">{nomVisibleLocal(el.nom)}</span>
              <span className="sdp-arxiu-local__meta">{`${nomVisibleLocal(el.carpeta || '/')} · ${formatKb(el.mida, locale)}`}</span>
              <InsigniesArxiuLocal t={t} el={el} exactes={exactes} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
