/**
 * Taula.jsx — Taula de dades amb desplaçament horitzontal contingut.
 *
 * <table> natiu: no reinventem la semàntica de files i columnes.
 * L'embolcall porta tabIndex=0 perquè una taula que es desplaça
 * ha de ser operable amb teclat (WCAG 2.1.1).
 * `titol` és obligatori: una taula sense nom accessible no es pot navegar.
 */
export function Taula({ titol, densa = false, children, className }) {
  return (
    <div
      className={['sdp-taula', densa && 'sdp-taula--densa', className]
        .filter(Boolean).join(' ')}
      role="region"
      aria-label={titol}
      tabIndex={0}
    >
      <table>{children}</table>
    </div>
  );
}
