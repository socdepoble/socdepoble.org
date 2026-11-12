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
 *
 * P1-71 (Onada R21) · «La vista d'àlbum sobre la graella universal, amb una
 * targeta multimèdia neta». Cap component del repositori es diu
 * UniversalGridWrapper: el paper de graella universal el fa el contracte de
 * teclat de l'espai de treball (components/universal/workspace/
 * navegacioTeclat.js): un contenidor amb [data-graella-teclat] i
 * gestionaTeclaGraella, el mateix del Mur, Pobles i la Consola (damunt de
 * .sdp-card-grid) i de la Fototeca publicada, i el que UniversalWorkspace sap
 * trobar quan → entra al detall (entradaDelDetall). Cada cel·la és una
 * TargetaMultimedia (TargetaMultimedia.jsx): un sol botó natiu, sense boina,
 * sense peu social (Connectar, Comentar, Compartir, Traduir) i sense ⋮. No és
 * la UniversalCard de les publicacions dins de GraellaTargetes: el perquè, a
 * la capçalera de TargetaMultimedia.jsx. El DOM i la pell, els de sempre.
 */
import { Insignia } from '../../components/PedraSeca/index.js';
import { gestionaTeclaGraella } from '../../components/universal/workspace/navegacioTeclat.js';
import { etiquetesEstatLocal, formatKb } from './motorMultimediaLocal.js';
import { ICONES_TIPUS_LOCAL, useMiniaturesLocals } from './miniaturesLocals.js';
import { TargetaMultimedia } from './TargetaMultimedia.jsx';
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
      {elements.map((el) => (
        <li key={el.ruta}>
          <TargetaMultimedia
            nom={nomVisibleLocal(el.nom)}
            meta={`${nomVisibleLocal(el.carpeta || '/')} · ${formatKb(el.mida, locale)}`}
            miniatura={miniatures.get(el.ruta) || null}
            icona={ICONES_TIPUS_LOCAL[el.tipus]}
            extensio={el.ext}
            arxiu={el.vista !== 'imatge' && el.vista !== 'svg'}
            premuda={ambEstat ? el.ruta === seleccionat : undefined}
            refBoto={(node) => registraTessela?.(el.ruta, node)}
            onTria={() => onSelecciona?.(el)}
          >
            <InsigniesArxiuLocal t={t} el={el} exactes={exactes} />
          </TargetaMultimedia>
        </li>
      ))}
    </ul>
  );
}
