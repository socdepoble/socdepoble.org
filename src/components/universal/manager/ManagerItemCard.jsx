/**
 * ManagerItemCard.jsx — la fitxa de llista de l'UniversalManager.
 *
 * LLEI DE LA FITXA (Pedra Seca · dictamen 260911):
 *  · Títol (rol H1) ≤ 2 línies · subtítol (rol H2) ≤ 1 línia. Res més: l'API
 *    no té on posar entradilla, cos ni H3, i les props desconegudes es perden.
 *  · Rols tipogràfics, no etiquetes: un <h1> no pot viure dins d'un <button>
 *    (només admet contingut de frase) i cinquanta <h1> en una llista trenquen
 *    la Regla de les Capçaleres (design_guard · h1-multiple).
 *  · Media quadrada de var(--sdp-fitxa-mida). Mai un forat:
 *    imatge segura › icona del consumidor › inicial del títol.
 *  · Botó natiu: el navegador ja fa Intro, Espai i focus. Zero role, zero
 *    tabIndex, zero onKeyDown.
 *
 * La vigila tooling/gates/tractor-fitxa-gestor.mjs (F1–F3).
 */
import { useState } from 'react';
import { isSafeAsset } from '../UniversalUtils';

function Media({ imatge, icona: Icona, titol }) {
  /* Guardem l'URL que ha fallat, no un booleà: si arriba una imatge nova,
     es torna a provar sense cap efecte. Al bancal la cobertura va i ve. */
  const [srcTrencada, setSrcTrencada] = useState(null);
  const segura = typeof imatge === 'string' && isSafeAsset(imatge) ? imatge : null;

  if (segura && segura !== srcTrencada) {
    return (
      <img
        className="sdp-gestor-fitxa__imatge"
        src={segura}
        alt=""
        width="80"
        height="80"
        loading="lazy"
        decoding="async"
        onError={() => setSrcTrencada(segura)}
      />
    );
  }

  if (Icona) return <Icona size={32} />;

  /* Array.from respecta els parells subrogats: una emoji no es parteix. */
  const [inicial = ''] = Array.from(String(titol ?? '').trim());
  return <span className="sdp-gestor-fitxa__inicial">{inicial.toLocaleUpperCase('ca')}</span>;
}

export default function ManagerItemCard({ titol, subtitol, imatge, icona, actiu = false, onSelecciona }) {
  return (
    <button
      type="button"
      className="sdp-gestor-fitxa"
      aria-current={actiu ? 'true' : undefined}
      onClick={onSelecciona}
    >
      <span className="sdp-gestor-fitxa__media" aria-hidden="true">
        <Media imatge={imatge} icona={icona} titol={titol} />
      </span>
      <span className="sdp-gestor-fitxa__text">
        <span className="sdp-gestor-fitxa__titol">{titol}</span>
        {subtitol ? <span className="sdp-gestor-fitxa__subtitol">{subtitol}</span> : null}
      </span>
    </button>
  );
}
