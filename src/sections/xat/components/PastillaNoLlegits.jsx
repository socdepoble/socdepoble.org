/**
 * PastillaNoLlegits.jsx — el comptador de no llegits (XAT-A10, UX-B05).
 * Sempre el número dins d'una pastilla i un text per al lector de pantalla:
 * mai només un punt de color (XAT-P04).
 */
export default function PastillaNoLlegits({ quants = 0, t }) {
  const n = Number(quants) || 0;
  if (n <= 0) return null;
  const mostrat = n > 99 ? '99+' : String(n);
  const text = n === 1
    ? t('section.xat.noLlegit.un', 'Un missatge no llegit')
    : t('section.xat.noLlegit.molts', '{n} missatges no llegits').replace('{n}', String(n));
  return (
    <span className="sdp-xat-pastilla">
      <span aria-hidden="true">{mostrat}</span>
      <span className="sdp-nomes-lector">{text}</span>
    </span>
  );
}
