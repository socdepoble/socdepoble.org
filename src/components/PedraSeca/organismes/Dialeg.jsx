/**
 * Dialeg.jsx — Modal, confirmació i calaix sobre <dialog> natiu.
 *
 * PER QUÈ NATIU: showModal() dona gratis la capa superior (sense guerres de
 * z-index amb les barres de 99xxx), el vel (::backdrop), la trampa de focus
 * i l'Escape. Funciona dins d'un shadow root. Zero dependències.
 *
 * CONTRACTE
 *   obert (controlat) · onTanca(motiu: 'esc'|'vel'|'boto') · titol (obligatori:
 *   dona nom accessible) · descripcio · accions (peu) · mida s|m|g ·
 *   costat null|'esquerra'|'dreta' (calaix) · tancaEnVel
 *   El focus torna a l'element que l'havia obert.
 *
 * LLEI DE LA POR ORGÀNICA: en <DialegConfirmacio destructiu> el focus inicial
 * va a «Cancel·lar». Un Intro distret no esborra res.
 */
import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Boto } from '../index.js';

export function Dialeg({
  obert, onTanca, titol, descripcio, accions = null, mida = 'm', costat = null,
  tancaEnVel = true, className, children,
}) {
  const ref = useRef(null);
  const retorn = useRef(null);
  const tancaRef = useRef(onTanca);
  tancaRef.current = onTanca;
  const id = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (obert && !d.open) {
      const arrel = d.getRootNode();
      retorn.current = arrel.activeElement || document.activeElement;
      if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    } else if (!obert && d.open) {
      if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
      retorn.current?.focus?.();
    }
  }, [obert]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return undefined;
    /* Escape: el navegador tancaria pel seu compte i l'estat de React
       quedaria mentint (obert=true amb el diàleg tancat). Ho prevenim i
       deixem que decidisca el pare. */
    const onCancel = (e) => { e.preventDefault(); tancaRef.current?.('esc'); };
    d.addEventListener('cancel', onCancel);
    return () => d.removeEventListener('cancel', onCancel);
  }, []);

  const onClickVel = (e) => {
    if (tancaEnVel && e.target === ref.current) onTanca?.('vel');
  };

  const classes = ['sdp-dialeg', `sdp-dialeg--${mida}`, costat && `sdp-dialeg--calaix sdp-dialeg--${costat}`, className]
    .filter(Boolean).join(' ');

  return (
    <dialog ref={ref} className={classes} aria-labelledby={`${id}-titol`}
      aria-describedby={descripcio ? `${id}-desc` : undefined} onClick={onClickVel}>
      <div className="sdp-dialeg__marc">
        <header className="sdp-dialeg__cap">
          <h2 id={`${id}-titol`} className="sdp-dialeg__titol">{titol}</h2>
          <button type="button" className="sdp-dialeg__tanca" onClick={() => onTanca?.('boto')} aria-label="Tancar">
            <X size={22} aria-hidden="true" focusable="false" />
          </button>
        </header>
        {descripcio ? <p id={`${id}-desc`} className="sdp-dialeg__descripcio">{descripcio}</p> : null}
        {children ? <div className="sdp-dialeg__cos">{children}</div> : null}
        {accions ? <footer className="sdp-dialeg__peu">{accions}</footer> : null}
      </div>
    </dialog>
  );
}

export function DialegConfirmacio({
  obert, onTanca, onConfirma, titol, descripcio, children,
  etiquetaConfirma = 'Confirmar', etiquetaCancela = 'Cancel·lar', destructiu = false, carregant = false,
}) {
  return (
    <Dialeg obert={obert} onTanca={onTanca} titol={titol} descripcio={descripcio} mida="s"
      tancaEnVel={!destructiu}
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => onTanca?.('boto')} autoFocus={destructiu}>{etiquetaCancela}</Boto>
          <Boto varietat={destructiu ? 'perill' : 'primari'} onClick={onConfirma} carregant={carregant}>{etiquetaConfirma}</Boto>
        </>
      )}>
      {children}
    </Dialeg>
  );
}
