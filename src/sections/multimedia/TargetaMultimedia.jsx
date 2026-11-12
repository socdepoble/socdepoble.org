/**
 * TargetaMultimedia.jsx — La targeta d'un recurs d'àlbum de /multimedia
 * (P1-71 · Onada R21): la tessel·la de la «Graella d'àlbum» del Gestor
 * d'arxius locals (GraellaAlbumLocal.jsx), ara en una peça pròpia i neta.
 *
 * Per què no és una UniversalCard (ni va dins de GraellaTargetes) · La
 * targeta d'un recurs d'àlbum NO és la d'una publicació: sense boina
 * d'autoria, sense peu (Connectar, Comentar, Compartir, Traduir) i sense el
 * ⋮ de moderació. Un fitxer del disc de la persona no és cap objecte del Mur
 * i el seu nom no ha d'eixir del navegador (la Privadesa de
 * PaginesEspaiMultimedia.jsx). A més, el filtre d'imatges d'UniversalCard
 * (isSafeAsset) rebutja a posta les miniatures blob: dels bytes locals, i la
 * graella de les publicacions (.sdp-card-grid, columnes de 360 px) faria
 * d'una pàgina de 24 tessel·les una llista.
 *
 * CONTRACTE (neta per construcció)
 *   · Un sol control: el <button> natiu de tota la tessel·la. Cap enllaç, cap
 *     botó niat, cap menú: la cel·la de la graella de teclat
 *     (gestionaTeclaGraella) té un únic objectiu, i és este.
 *   · El nom accessible és el text de dins (el nom, «carpeta · mida» i les
 *     insígnies, `children`), que sempre hi és: la miniatura és decoració
 *     (alt="") i la icona del tipus, aria-hidden.
 *   · Una miniatura que no es pot pintar (bytes corruptes, una URL ja
 *     revocada) no deixa cap quadrat buit: torna la icona del tipus, amb un
 *     estat de React (cap estil en línia). Una miniatura nova es torna a
 *     provar.
 *   · `premuda` (booleà) → aria-pressed, només al Gestor autònom; a l'espai de
 *     /multimedia el clic navega a la fitxa i no commuta res (sense atribut).
 *   · La pell és la de sempre (modules.css, .sdp-arxiu-local__tessela i
 *     companyia): cap classe, color, radi ni mida nous. Llei del Píxel: amb
 *     una miniatura que es pinta, el DOM és el d'abans.
 *
 * Només exporta components (Fast Refresh: exportacionsComponents.test.js).
 */
import { useState } from 'react';
import { File as IconaFitxer } from 'lucide-react';

export function TargetaMultimedia({
  nom, meta, miniatura = null, icona: Icona = IconaFitxer, extensio = '', arxiu = false, premuda, onTria, refBoto, children
}) {
  /* La miniatura que ha fallat (la URL): una altra URL es torna a provar. */
  const [miniaturaFallida, setMiniaturaFallida] = useState(null);
  const ambMiniatura = Boolean(miniatura) && miniatura !== miniaturaFallida;
  return (
    <button
      type="button"
      ref={refBoto}
      className={arxiu ? 'sdp-arxiu-local__tessela sdp-arxiu-local__tessela--arxiu' : 'sdp-arxiu-local__tessela'}
      aria-pressed={typeof premuda === 'boolean' ? String(premuda) : undefined}
      onClick={onTria}
    >
      {ambMiniatura ? (
        <img
          className="sdp-arxiu-local__miniatura"
          src={miniatura}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setMiniaturaFallida(miniatura)}
        />
      ) : (
        <span className="sdp-arxiu-local__icona" aria-hidden="true">
          <Icona size={36} focusable="false" />
          {extensio ? <span className="sdp-arxiu-local__ext">{`.${extensio}`}</span> : null}
        </span>
      )}
      <span className="sdp-arxiu-local__nom">{nom}</span>
      <span className="sdp-arxiu-local__meta">{meta}</span>
      {children}
    </button>
  );
}
