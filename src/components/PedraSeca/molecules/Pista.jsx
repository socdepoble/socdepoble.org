/**
 * Pista.jsx — Ajuda contextual que es TOCA, no que es sobrevola.
 * El `title` del catàleg antic no existix en pantalla tàctil ni per al
 * lector de pantalla. Açò és un toggletip: botó «?» amb aria-expanded; el
 * text s'anuncia en obrir-se; Escape i tocar fora el tanquen.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';

export function Pista({ etiqueta = 'Ajuda', children, className }) {
  const [obert, setObert] = useState(false);
  const ref = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!obert) return undefined;
    const arrel = ref.current?.getRootNode() ?? document;
    const fora = (e) => { if (!e.composedPath().includes(ref.current)) setObert(false); };
    const esc = (e) => { if (e.key === 'Escape') setObert(false); };
    arrel.addEventListener('pointerdown', fora);
    arrel.addEventListener('keydown', esc);
    return () => { arrel.removeEventListener('pointerdown', fora); arrel.removeEventListener('keydown', esc); };
  }, [obert]);

  return (
    <span ref={ref} className={['sdp-pista', className].filter(Boolean).join(' ')}>
      <button type="button" className="sdp-pista__boto" aria-expanded={obert} aria-controls={id}
        aria-label={etiqueta} onClick={() => setObert((o) => !o)}>
        <CircleHelp size={20} aria-hidden="true" focusable="false" />
      </button>
      <span id={id} role="status" className="sdp-pista__bafarada" hidden={!obert}>{obert ? children : null}</span>
    </span>
  );
}
