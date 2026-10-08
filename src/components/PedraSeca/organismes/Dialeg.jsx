/**
 * Dialeg.jsx — Modal, confirmació i calaix sobre <dialog> natiu.
 *
 * A la SPA, showModal() aporta vel, focus i Escape. En un encastament,
 * show() i un portal dins de la closca limiten la modalitat a la instància.
 *
 * CONTRACTE
 *   obert (controlat) · onTanca(motiu: 'esc'|'vel'|'boto', info?) · titol (obligatori:
 *   dona nom accessible) · descripcio · accions (peu) · mida s|m|g|completa ·
 *   costat null|'esquerra'|'dreta' (calaix) · tancaEnVel ·
 *   lloc 'centre'|'barra' (T40–T41: la finestra flotant de la barra
 *   taronja, ancorada dalt a la dreta en escriptori; en mòbil, el full inferior)
 *   El focus torna a l'element que l'havia obert.
 *   Pantalla completa (ordre del Mestre, 261001) · mida 'completa' ocupa tota
 *   la caixa de l'App: el viewport a la SPA i la de .sdp-root en un encastament
 *   (la capa local porta sdp-capa-modal--completa). onObert() es crida una
 *   vegada, quan el <dialog> ja és obert (darrere de showModal() o de show()),
 *   mai en el commit de sonda: qui mesura el contingut (useAmpladaContenidor)
 *   ha d'esperar-lo, perquè dins d'un <dialog> tancat l'amplada és nul·la.
 *   En mode local, sense-marc delega el scroll en el contingut del consumidor.
 *   info = { forcat: true } quan el navegador ja ha tancat el <dialog> pel
 *   seu compte (dos Escape seguits): el pare l'ha de donar per tancat.
 *   ambTanca (true) · Onada 4 (retallador senzill, 261008) · Amb false, la
 *   capçalera no porta la X: el peu ja diu com eixir i Escape continua
 *   tancant. Sense la prop, el DOM de sempre.
 *
 * LLEI DE LA POR ORGÀNICA: en <DialegConfirmacio destructiu> el focus inicial
 * va a «Cancel·lar». Un Intro distret no esborra res.
 */
import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';
import { obriModalLocal } from './modalLocal.js';

export function Dialeg(props) {
  const origen = useRef(null);
  const [desti, setDesti] = useState(null);
  useLayoutEffect(() => {
    const node = origen.current;
    if (!node) return;
    // La decisió és per node i es revisa en obrir: mai una marca global.
    const local = node.getRootNode().host?.localName === 'soc-de-poble';
    setDesti(local ? node.closest('.sdp-root') : null);
  }, [props.obert]);
  const local = desti?.nodeType === 1 && desti.isConnected;
  const contingut = <ContingutDialeg {...props} local={local} arrelModal={local ? desti : null} nodeRef={origen} />;
  /* Pantalla completa · la capa de la mida 'completa' perd el farciment i el
     vel; per a la resta de diàlegs, la cadena de classes és la de sempre. */
  const capa = ['sdp-capa-modal', props.costat && 'sdp-capa-modal--calaix',
    !props.costat && props.mida === 'completa' && 'sdp-capa-modal--completa'].filter(Boolean).join(' ');
  return local ? createPortal(
      <div className={capa} hidden={!props.obert} onClick={e => {
        if (e.target === e.currentTarget && props.tancaEnVel !== false) props.onTanca?.('vel');
      }}>{contingut}</div>, desti
    ) : contingut;
}

function ContingutDialeg({
  obert, onTanca, titol, descripcio, accions = null, mida = 'm', costat = null,
  tancaEnVel = true, variant = 'nadiu', lloc = 'centre', className, children, local, arrelModal, nodeRef, onObert,
  ambTanca = true,
}) {
  const ref = useRef(null);
  const retorn = useRef(null);
  const tancaRef = useRef(onTanca);
  tancaRef.current = onTanca;
  const alObrirRef = useRef(onObert);
  alObrirRef.current = onObert;
  const obertRef = useRef(obert);
  obertRef.current = obert;
  const id = useId();

  useInsertionEffect(() => {
    // El destí del portal ja existix. Els refs del diàleg nou encara no:
    // capturar ací precedix autoFocus dels fills en la fase de layout.
    if (local && obert) retorn.current = arrelModal.getRootNode().activeElement;
  }, [obert, local, arrelModal]);

  useLayoutEffect(() => {
    // Obrir abans dels efectes dels consumidors: el cercador de Nova
    // conversa ha de poder rebre focus quan el seu efecte s'execute.
    if (local && obert && ref.current) {
      const tancaLocal = obriModalLocal(ref.current, (...args) => tancaRef.current?.(...args), retorn.current);
      alObrirRef.current?.();
      return tancaLocal;
    }
  }, [obert, local]);

  useEffect(() => {
    const d = ref.current;
    if (!d || local) return;
    // El primer commit local encara servix de sonda; el layout effect del
    // pare el trasllada al portal abans de pintar. Mai obrir-lo com a modal
    // de document durant este pas ni després d'una desconnexió de l'host.
    if (d.getRootNode().host?.localName === 'soc-de-poble') return;
    if (obert && !d.open) {
      const arrel = d.getRootNode();
      retorn.current = arrel.activeElement || document.activeElement;
      if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
      alObrirRef.current?.();
    } else if (!obert && d.open) {
      if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
      retorn.current?.focus?.();
    }
  }, [obert, local]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return undefined;
    /* Escape: el navegador tancaria pel seu compte i l'estat de React
       quedaria mentint (obert=true amb el diàleg tancat). Ho prevenim i
       deixem que decidisca el pare. */
    const onCancel = (e) => { e.preventDefault(); tancaRef.current?.('esc'); };
    /* Poliment T40–T41 (ordre del Mestre, 260928) · Dos Escape seguits: el
       segon `cancel` ja no és cancel·lable (el navegador protegix l'eixida) i
       el <dialog> es tanca pel seu compte. Si React encara el volia obert,
       s'avisa el pare: si no, obert=true mentiria i el disparador ja no el
       podria reobrir. El tancament propi (obert=false) no avisa ningú. */
    const onClose = () => {
      if (obertRef.current && !d.open) {
        if (local) tancaRef.current?.('boto');
        else tancaRef.current?.('esc', { forcat: true });
      }
    };
    d.addEventListener('cancel', onCancel);
    d.addEventListener('close', onClose);
    return () => {
      d.removeEventListener('cancel', onCancel);
      d.removeEventListener('close', onClose);
    };
  }, [local]);

  const onClickVel = (e) => {
    if (tancaEnVel && e.target === ref.current) onTanca?.('vel');
  };

  /* T40–T41 (ordre del Mestre, 260928) · Una sola finestra flotant per a la
     barra taronja (data de publicació i visibilitat): el mateix <dialog>,
     amb la classe que l'ancora (modules.css, bloc T40–T41). Un calaix mana. */
  const classes = ['sdp-dialeg', `sdp-dialeg--${mida}`, costat && `sdp-dialeg--calaix sdp-dialeg--${costat}`,
    !costat && lloc === 'barra' && 'sdp-dialeg--barra', className, variant === 'sense-marc' && 'sdp-dialeg--sense-marc']
    .filter(Boolean).join(' ');

  if (variant === 'sense-marc') {
    return (
      <dialog ref={node => { ref.current = node; nodeRef.current = node; }} className={classes} aria-label={titol} aria-modal={local ? 'true' : undefined} tabIndex={local ? -1 : undefined} onClick={onClickVel}>
        {children}
      </dialog>
    );
  }

  return (
    <dialog ref={node => { ref.current = node; nodeRef.current = node; }} className={classes} aria-labelledby={`${id}-titol`} aria-modal={local ? 'true' : undefined} tabIndex={local ? -1 : undefined}
      aria-describedby={descripcio ? `${id}-desc` : undefined} onClick={onClickVel}>
      <div className="sdp-dialeg__marc">
        <header className="sdp-dialeg__cap">
          <h2 id={`${id}-titol`} className="sdp-dialeg__titol">{titol}</h2>
          {ambTanca ? (
            <button type="button" className="sdp-dialeg__tanca" onClick={() => onTanca?.('boto')} aria-label="Tancar">
              <X size={22} aria-hidden="true" focusable="false" />
            </button>
          ) : null}
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
          <Boto varietat="secundari" onClick={() => onTanca?.('boto')} autoFocus={destructiu} data-sdp-focus-inicial={destructiu || undefined}>{etiquetaCancela}</Boto>
          <Boto varietat={destructiu ? 'perill' : 'primari'} onClick={onConfirma} carregant={carregant}>{etiquetaConfirma}</Boto>
        </>
      )}>
      {children}
    </Dialeg>
  );
}
