/**
 * ArbreCarpetesLocals.jsx — L'arbre de subcarpetes del volum obert (IDEA-55 ·
 * Onada 261029_1605). Triar una carpeta mostra TOTS els seus fitxers (i els
 * de les seues subcarpetes) a la fototeca mixta; «Tota la carpeta» els
 * mostra tots. També hi són les carpetes buides (font.carpetes).
 *
 * Botons natius dins de llistes niades (sense role="tree", que demanaria un
 * maneig de fletxes propi): la carpeta activa porta aria-pressed i cada
 * carpeta amb filles té un botó de plegar amb aria-expanded. Els noms, amb
 * nomVisibleLocal (Gauntlet 261029, cicle 1).
 *
 * IDEA-58 · Gemini 261030 (G6) · Sense fletxes, a propòsit: este arbre només
 * el munta el Gestor autònom (GestorMultimediaLocal, `autonom`), que només
 * viu a les proves (cicle 1: decisió del Mestre pendent). A /multimedia les
 * carpetes locals són l'arbre de la Columna 1 de l'UniversalWorkspace
 * (arbreMultimedia.js), que ja té les fletxes (gestionaTeclaArbre).
 */
import { useEffect, useId, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { nomVisibleLocal } from './suportGestorLocal.js';
import { TEXTOS_LOCAL as T, tradueix } from './textosGestorLocal.js';

/* L'arbre de nodes { ruta, nom, fills } a partir de les rutes de carpeta. */
function construeixArbre(carpetes) {
  const nodes = new Map();
  const arrels = [];
  const node = (ruta) => {
    if (nodes.has(ruta)) return nodes.get(ruta);
    const barra = ruta.lastIndexOf('/');
    const nou = { ruta, nom: barra >= 0 ? ruta.slice(barra + 1) : ruta, fills: [] };
    nodes.set(ruta, nou);
    if (barra > 0) node(ruta.slice(0, barra)).fills.push(nou);
    else arrels.push(nou);
    return nou;
  };
  for (const ruta of [...carpetes].sort((a, b) => a.localeCompare(b))) {
    if (typeof ruta === 'string' && ruta !== '') node(ruta);
  }
  const ordena = (llista) => {
    llista.sort((a, b) => a.nom.localeCompare(b.nom));
    llista.forEach((n) => ordena(n.fills));
  };
  ordena(arrels);
  return arrels;
}

const ancestresDe = (ruta) => {
  const segs = String(ruta || '').split('/').filter(Boolean);
  return segs.slice(0, -1).map((_, i) => segs.slice(0, i + 1).join('/'));
};

export function ArbreCarpetesLocals({ t, carpetes = [], comptes = new Map(), total = 0, activa = '', onTria }) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const id = useId();
  const arrels = useMemo(() => construeixArbre(carpetes), [carpetes]);
  const [obertes, setObertes] = useState(() => new Set());

  /* La carpeta activa sempre es veu: s'obrin les seues mares. */
  useEffect(() => {
    const mares = ancestresDe(activa);
    if (mares.length === 0) return;
    setObertes((abans) => (mares.every((m) => abans.has(m)) ? abans : new Set([...abans, ...mares])));
  }, [activa]);

  const commuta = (ruta) => setObertes((abans) => {
    const nou = new Set(abans);
    if (nou.has(ruta)) nou.delete(ruta);
    else nou.add(ruta);
    return nou;
  });

  const pinta = (node) => {
    const oberta = obertes.has(node.ruta);
    const ambFills = node.fills.length > 0;
    return (
      <li key={node.ruta}>
        <div className="sdp-arxiu-local__node">
          {ambFills ? (
            <button
              type="button"
              className="sdp-arxiu-local__plega"
              aria-expanded={oberta ? 'true' : 'false'}
              aria-label={tr(oberta ? T.plega : T.desplega, { nom: nomVisibleLocal(node.nom) })}
              onClick={() => commuta(node.ruta)}
            >
              {oberta
                ? <ChevronDown size={18} aria-hidden="true" focusable="false" />
                : <ChevronRight size={18} aria-hidden="true" focusable="false" />}
            </button>
          ) : <span className="sdp-arxiu-local__plega-buit" aria-hidden="true" />}
          <button
            type="button"
            className="sdp-arxiu-local__carpeta"
            aria-pressed={activa === node.ruta ? 'true' : 'false'}
            onClick={() => onTria?.(node.ruta)}
          >
            <Folder size={18} aria-hidden="true" focusable="false" />
            <span className="sdp-arxiu-local__nom">{nomVisibleLocal(node.nom)}</span>
            <span className="sdp-arxiu-local__compte">{comptes.get(node.ruta) || 0}</span>
          </button>
        </div>
        {oberta && ambFills ? <ul className="sdp-arxiu-local__nivell">{node.fills.map(pinta)}</ul> : null}
      </li>
    );
  };

  return (
    <nav className="sdp-arxiu-local__panell sdp-arxiu-local__arbre" aria-labelledby={`${id}-titol`}>
      <h3 id={`${id}-titol`}>{tr(T.carpetes)}</h3>
      <ul className="sdp-arxiu-local__nivell">
        <li>
          <div className="sdp-arxiu-local__node">
            <button
              type="button"
              className="sdp-arxiu-local__carpeta"
              aria-pressed={activa === '' ? 'true' : 'false'}
              onClick={() => onTria?.('')}
            >
              <FolderOpen size={18} aria-hidden="true" focusable="false" />
              <span className="sdp-arxiu-local__nom">{tr(T.arrel, { n: total })}</span>
            </button>
          </div>
        </li>
        {arrels.map(pinta)}
      </ul>
    </nav>
  );
}
