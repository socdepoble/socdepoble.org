/**
 * GraellaTargetes.jsx — el contenidor de les UniversalCard d'una llista. No
 * és cap targeta: només les posa en graella (o en columna) i, si cal, les
 * agrupa per seccions.
 *
 * Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») ·
 * Notícies i la Nevera passen a UniversalCard, i les apps no poden escriure
 * className ni ul/li (les qualitat.test.js de cada app). Esta és la peça que
 * pinta la graella canònica per elles: la mateixa div.sdp-card-grid del Mercat
 * (MercatSection) i, amb `categories`, les seccions de SeccionsCategoria.
 *
 * CONTRACTE
 *   elements      els elements de la llista ({ id, categoriaId?, … }). Amb
 *                 `children` com a funció, children(element) pinta la targeta
 *                 de cada un (i hi posa la key). Sense `elements`, els fills
 *                 són les targetes ja fetes.
 *   categories    [{ id, nom, icona?, visible, ordre }] · amb, una secció per
 *                 categoria (SeccionsCategoria), en l'ordre de la persona;
 *                 sense, una sola graella.
 *   nivell        el nivell de la capçalera de cada secció (3 a 6; 3 per
 *                 defecte). Les targetes de dins, un per davall
 *                 (headingLevel de UniversalCard).
 *   variant       'graella' (per defecte) · 'llista': en columna, per a les
 *                 targetes planes (UniversalCard variant='pla').
 *   etiqueta      el nom de la graella sense seccions (role=group), per al
 *                 lector de pantalla.
 *   plegades · onPlega · textArticles · textSenseCategoria · buit
 *                 els de SeccionsCategoria. `buit` també quan no hi ha cap
 *                 element.
 */
import { Children } from 'react';
import { SeccionsCategoria } from './SeccionsCategoria.jsx';

/* La graella de sempre (modules.css: .sdp-card-grid) o la columna de les
   targetes planes (.sdp-card-llista). Amb etiqueta, un grup amb nom. */
function Graella({ enLlista, etiqueta, children }) {
  return (
    <div className={enLlista ? 'sdp-card-llista' : 'sdp-card-grid'} role={etiqueta ? 'group' : undefined} aria-label={etiqueta || undefined}>
      {children}
    </div>
  );
}

export function GraellaTargetes({
  elements, categories = null, nivell = 3, variant = 'graella', etiqueta,
  plegades, onPlega, textArticles, textSenseCategoria, buit = null, children
}) {
  const enLlista = variant === 'llista';
  const pinta = typeof children === 'function' ? children : null;
  const llista = Array.isArray(elements) ? elements.filter((element) => element && typeof element.id === 'string') : null;

  /* Sense elements: els fills ja són les targetes. */
  if (!llista) {
    if (pinta || Children.count(children) === 0) return buit;
    return <Graella enLlista={enLlista} etiqueta={etiqueta}>{children}</Graella>;
  }
  if (!pinta) return buit;

  if (Array.isArray(categories)) {
    return (
      <SeccionsCategoria categories={categories} articles={llista} nivell={nivell} plegades={plegades} onPlega={onPlega}
        textArticles={textArticles} textSenseCategoria={textSenseCategoria} buit={buit}>
        {(delGrup) => <Graella enLlista={enLlista}>{delGrup.map(pinta)}</Graella>}
      </SeccionsCategoria>
    );
  }
  if (llista.length === 0) return buit;
  return <Graella enLlista={enLlista} etiqueta={etiqueta}>{llista.map(pinta)}</Graella>;
}
