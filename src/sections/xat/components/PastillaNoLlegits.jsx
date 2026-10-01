/**
 * PastillaNoLlegits.jsx — el comptador de no llegits (XAT-A10, UX-B05).
 * Sempre el número dins d'una pastilla i un text per al lector de pantalla:
 * mai només un punt de color (XAT-P04).
 *
 * Torn 260930 (T1, calc de WhatsApp Desktop):
 *   · `manual`: el fil s'ha marcat a mà com a no llegit i no té recompte. Es
 *     pinta la pastilla buida (un punt) amb el text «Marcada com a no
 *     llegida»; amb recompte, mana el número.
 *   · `silenciada`: el fil està silenciat i la pastilla és grisa.
 * Les classes van escrites senceres perquè el vocabulari canònic les puga
 * comprovar.
 */
export default function PastillaNoLlegits({ quants = 0, t, manual = false, silenciada = false }) {
  const n = Number(quants) || 0;
  if (n <= 0) {
    if (!manual) return null;
    return (
      <span className={silenciada ? 'sdp-xat-pastilla sdp-xat-pastilla--punt sdp-xat-pastilla--silenciada' : 'sdp-xat-pastilla sdp-xat-pastilla--punt'}>
        <span className="sdp-nomes-lector">{t('section.xat.noLlegit.manual', 'Marcada com a no llegida')}</span>
      </span>
    );
  }
  const mostrat = n > 99 ? '99+' : String(n);
  const text = n === 1
    ? t('section.xat.noLlegit.un', 'Un missatge no llegit')
    : t('section.xat.noLlegit.molts', '{n} missatges no llegits').replace('{n}', String(n));
  return (
    <span className={silenciada ? 'sdp-xat-pastilla sdp-xat-pastilla--silenciada' : 'sdp-xat-pastilla'}>
      <span aria-hidden="true">{mostrat}</span>
      <span className="sdp-nomes-lector">{text}</span>
    </span>
  );
}
