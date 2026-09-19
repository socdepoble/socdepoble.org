/**
 * PillToggle.jsx — selector de píndola canònic de Pedra Seca (260911).
 *
 * Patró blindat pel Mestre: una píndola amb N opcions, una sola activa.
 * Substituïx les còpies soltes de `.pill` + `.pill--active` (Mur, Multimedia,
 * Onboarding) i serà el selector [Universal Cards] [Vista Comprimida].
 *
 * Decisions que no s'han de desfer:
 *  · L'estat actiu es pinta des de `[aria-pressed="true"]`, no des d'una
 *    classe. Si algú lleva l'ARIA, l'opció deixa de semblar activa: la
 *    versió inaccessible no pot tindre bon aspecte. (`.pill--active` no tenia
 *    cap regla CSS: l'estat era invisible.)
 *  · Botons natius dins d'un `role="group"`: Tab + Espai/Retorn sense JS de
 *    teclat. No és `tablist` perquè no hi ha `tabpanel`.
 *  · `onCanvi` es crida sempre, també sobre l'opció ja activa: el consumidor
 *    decidix (el Mapa del Mur es plega tornant a polsar-lo).
 *  · Actiu = blau (--sdp-accio) amb text blanc (--sdp-sobre-accio). (El taronja
 *    passa a ser secundari, per petició del Mestre)
 */
export function PillToggle({
  opcions = [],
  valor,
  onCanvi,
  etiqueta,
  className = '',
}) {
  return (
    <div
      role="group"
      aria-label={etiqueta}
      className={['sdp-pindola', className].filter(Boolean).join(' ')}
    >
      {opcions.map((opcio) => (
        <button
          key={opcio.valor}
          type="button"
          className="sdp-pindola__opcio"
          aria-pressed={opcio.valor === valor ? 'true' : 'false'}
          onClick={() => onCanvi?.(opcio.valor)}
        >
          {opcio.icona ? <span className="sdp-pindola__icona" aria-hidden="true">{opcio.icona}</span> : null}
          {opcio.text}
        </button>
      ))}
    </div>
  );
}
