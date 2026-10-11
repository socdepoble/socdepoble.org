/* Onada 11 (261010; prompt 261010_1730, tasca 2) · L'estil desat del poble,
   aplicat a l'arrel de la instància. Llig useCoreContent().personalitzacio
   .estil.payload (camp additiu de loadCoreContent, el que desa la faceta
   «Estil del poble» del Tauler o el «Desar» del PanellCrom) i crida
   aplicaEstil/llevaEstil (config/aplicaEstil.js) sobre la .sdp-root.
   · L'arrel: dins del shadow root de l'encastat (targetNode, el mateix que rep
     App) o, a la SPA i a l'app nativa, al document. Hi ha DUES .sdp-root
     niades: l'exterior (el punt de muntatge de PedraSecaEmbed.jsx:738, o el
     <body class="sdp-root"> d'index.html) i la interior, la d'AppShell
     (App.jsx:532). Es tria la interior, la que node.closest('.sdp-root') dona
     des de dins de l'app al PanellCrom, a FacetaEstil i al Dialeg: tokens.css
     (:34) redeclara els tokens sobre .sdp-root, així que la interior no hereta
     el crom en línia de l'exterior, i BASES (crom.js) i ESTATS (aplicaEstil.js)
     són per element. S'escriu sobre la instància, mai sobre la pàgina amfitriona.
   · LLEI DEL PÍXEL: sense estil (null) no es toca res: cap full, cap <style>,
     cap propietat en línia, i este component no pinta cap node.
   Muntat a App.jsx, dins del CoreContentProvider, en un sol lloc. */
import { useEffect } from 'react';
import { useCoreContent } from './contexts/CoreContentContext.jsx';
import { aplicaEstil, llevaEstil } from '../config/aplicaEstil.js';

/** L'arrel .sdp-root de la instància: la més interior (l'última en ordre d'arbre)
 *  dins de targetNode si n'hi ha; si no, al document. És la que closest('.sdp-root')
 *  troba des de dins de l'app, no el punt de muntatge que l'embolcalla. */
export function arrelDelPoble(targetNode = null) {
  const dins = targetNode && typeof targetNode.querySelectorAll === 'function' ? targetNode.querySelectorAll('.sdp-root') : [];
  if (dins.length) return dins[dins.length - 1];
  if (typeof document === 'undefined') return null;
  const totes = document.querySelectorAll('.sdp-root');
  return totes.length ? totes[totes.length - 1] : null;
}

export function EstilDelPoble({ targetNode = null }) {
  const { personalitzacio } = useCoreContent();
  const payload = personalitzacio?.estil?.payload ?? null;

  useEffect(() => {
    if (!payload) return undefined;
    const arrel = arrelDelPoble(targetNode);
    if (!arrel) return undefined;
    aplicaEstil(arrel, payload);
    return () => llevaEstil(arrel);
  }, [payload, targetNode]);

  return null;
}
