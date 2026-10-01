/**
 * PantallaCompleta.jsx — un bloc de la pàgina a tota la caixa de l'App.
 *
 * Ordre del Mestre, 261001 · «Botó de Pantalla Completa al Calendari»: el
 * calendari ha d'ocupar tot l'espai visual, sense la barra lateral ni les de
 * dalt de Sóc de Poble, en mòbil i en escriptori, i amb un botó visible per a
 * eixir. És un Dialeg de Pedra Seca de mida 'completa' i sense marc: a la SPA,
 * showModal() el porta a la capa superior, que tapa la closca i la deixa
 * inert; dins d'un <soc-de-poble>, la capa local de la Frontera C2 ocupa la
 * caixa de .sdp-root (mai el WordPress sencer). Sense Fullscreen API (decisió
 * D5): la barra del navegador no s'amaga.
 *
 * CONTRACTE
 *   PantallaCompleta · oberta (controlat) · onTanca(motiu: 'esc'|'boto') ·
 *     titol (obligatori: el nom accessible del diàleg) · etiquetaEixir
 *     ('Eixir') · children.
 *     Tancada, pinta els fills tal qual, sense cap node propi: el DOM en línia
 *     no canvia (Llei del Píxel). Oberta, els munta dins del diàleg, davall
 *     d'una franja fixa que només porta «Eixir» (decisió D8), i només fa
 *     scroll el visor (Llei de Scroll). Un clic al fons no tanca; el doble
 *     Escape que el navegador força també tanca (el pare rep 'esc').
 *   BotoPantallaCompleta · id · onClick · varietat ('fantasma') · className.
 *     Només icona, 44×44, amb el nom «Pantalla completa»; qui el munta tria la
 *     pell dels seus veïns.
 *   L'estat i el retorn del focus viuen a usePantallaCompleta (hooks/).
 *
 * Importa per camí directe (mai per index.js): la porta de dependències
 * circulars de Pedra Seca ho exigix.
 */
import { useCallback, useRef, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';
import { Dialeg } from './Dialeg.jsx';

export function PantallaCompleta({ oberta, onTanca, titol, etiquetaEixir = 'Eixir', children }) {
  if (!oberta) return <>{children}</>;
  return (
    <PantallaCompletaOberta onTanca={onTanca} titol={titol} etiquetaEixir={etiquetaEixir}>
      {children}
    </PantallaCompletaOberta>
  );
}

/* Cada obertura comença de zero. Els fills es munten quan el <dialog> ja és
   obert (`llesta`, des d'onObert): dins d'un diàleg tancat
   useAmpladaContenidor mesuraria null i, en mòbil, la Setmana pintaria un
   fotograma de set columnes. La franja va primer al DOM: showModal() i el
   focus inicial del mode local ja cauen sobre «Eixir». */
function PantallaCompletaOberta({ onTanca, titol, etiquetaEixir, children }) {
  const [llesta, setLlesta] = useState(false);
  const barra = useRef(null);
  const alObrir = useCallback(() => {
    setLlesta(true);
    barra.current?.querySelector('[data-sdp-focus-inicial]')?.focus();
  }, []);
  return (
    <Dialeg obert onTanca={(motiu) => onTanca?.(motiu)} titol={titol} variant="sense-marc" mida="completa"
      tancaEnVel={false} className="sdp-pantalla-completa" onObert={alObrir}>
      <div ref={barra} className="sdp-pantalla-completa__barra">
        {/* El nom accessible és «Eixir de la pantalla completa» (conté el text
            visible, WCAG 2.5.3). L'espai va fora de la part per al lector: el
            càlcul del nom retalla els espais de dins de cada element. */}
        <Boto varietat="secundari" icona={Minimize} data-sdp-focus-inicial aria-keyshortcuts="Escape"
          onClick={() => onTanca?.('boto')}>
          {etiquetaEixir} <span className="sdp-nomes-lector">de la pantalla completa</span>
        </Boto>
      </div>
      <div className="sdp-pantalla-completa__visor">{llesta ? children : null}</div>
    </Dialeg>
  );
}

export function BotoPantallaCompleta({ id, onClick, varietat = 'fantasma', className }) {
  return (
    <Boto id={id} varietat={varietat} icona={Maximize} onClick={onClick}
      className={['sdp-pantalla-completa__entra', className].filter(Boolean).join(' ')}
      aria-label="Pantalla completa" title="Pantalla completa" aria-haspopup="dialog" />
  );
}
