/** Server evidence only: this component never starts a peer typing timer. */
export default function IndicadorEscrivint({ quants = 0, t }) {
  if (!Number.isSafeInteger(quants) || quants < 1) return null;
  const text = quants === 1
    ? t('section.xat.presencia.un', 'Escrivint…')
    : t('section.xat.presencia.molts', '{n} persones estan escrivint…').replace('{n}', String(quants));
  return <span className="sdp-xat-escrivint" role="status" aria-live="polite" aria-atomic="true">{text}</span>;
}
