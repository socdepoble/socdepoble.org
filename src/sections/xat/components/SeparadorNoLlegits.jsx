/**
 * SeparadorNoLlegits.jsx — la franja «N missatges no llegits» de WhatsApp
 * (torn 260930, T1). Conversa la calcula una sola vegada, amb la marca de
 * lectura del moment d'obrir, i la posa davant del primer no llegit; queda
 * fixa mentre la conversa està oberta. Sempre text, singular o plural.
 */
export default function SeparadorNoLlegits({ quants = 0, t }) {
  const n = Number(quants) || 0;
  if (n <= 0) return null;
  const text = n === 1
    ? t('section.xat.separador.noLlegit', '1 missatge no llegit')
    : t('section.xat.separador.noLlegits', '{n} missatges no llegits').replace('{n}', String(n));
  return (
    <li className="sdp-xat-no-llegits">
      <span className="sdp-xat-no-llegits__pastilla">{text}</span>
    </li>
  );
}
