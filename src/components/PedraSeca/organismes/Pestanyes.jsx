/**
 * Pestanyes.jsx — Patró WAI-ARIA Tabs amb focus itinerant.
 *   Fletxes ←/→ mouen i activen · Inici/Fi · només la pestanya activa és
 *   a l'ordre de tabulació; Tab salta directament al panell.
 * El catàleg antic pintava <div class="tab"> i afirmava que eren accessibles
 * per teclat. No ho eren: un div no rep focus.
 *
 * pestanyes: [{ id, etiqueta, icona?, contingut }] · activa/onCanvi (opcional: controlat)
 */
import { useId, useRef, useState } from 'react';

export function Pestanyes({ pestanyes = [], activa, onCanvi, etiqueta, className }) {
  const [interna, setInterna] = useState(pestanyes[0]?.id);
  const actual = activa ?? interna;
  const base = useId();
  const refs = useRef({});

  const tria = (id) => {
    if (activa === undefined) setInterna(id);
    onCanvi?.(id);
  };

  const onKeyDown = (e, i) => {
    const n = pestanyes.length;
    const salts = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 };
    if (!(e.key in salts)) return;
    e.preventDefault();
    const seguent = pestanyes[salts[e.key]];
    tria(seguent.id);
    refs.current[seguent.id]?.focus();
  };

  return (
    <div className={['sdp-pestanyes', className].filter(Boolean).join(' ')}>
      <div role="tablist" aria-label={etiqueta} className="sdp-pestanyes__llista">
        {pestanyes.map((p, i) => {
          const Icona = p.icona;
          const sel = p.id === actual;
          return (
            <button key={p.id} type="button" role="tab" id={`${base}-t-${p.id}`}
              aria-selected={sel} aria-controls={`${base}-p-${p.id}`} tabIndex={sel ? 0 : -1}
              ref={(el) => { refs.current[p.id] = el; }}
              className="sdp-pestanyes__pestanya"
              onClick={() => tria(p.id)} onKeyDown={(e) => onKeyDown(e, i)}>
              {Icona ? <Icona size={20} aria-hidden="true" focusable="false" /> : null}
              <span>{p.etiqueta}</span>
            </button>
          );
        })}
      </div>
      {pestanyes.map((p) => (
        <div key={p.id} role="tabpanel" id={`${base}-p-${p.id}`} aria-labelledby={`${base}-t-${p.id}`}
          hidden={p.id !== actual} tabIndex={0} className="sdp-pestanyes__panell">
          {p.contingut}
        </div>
      ))}
    </div>
  );
}
