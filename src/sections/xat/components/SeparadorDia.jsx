/**
 * SeparadorDia.jsx — la pastilla «Hui · Ahir · dilluns · 4 de setembre de
 * 2026» entre missatges de dies diferents (UX-A07, XAT-P13).
 */
import { etiquetaDia } from '../temps.js';

export default function SeparadorDia({ iso, locale, t }) {
  const text = etiquetaDia(iso, { locale, t });
  if (!text) return null;
  return (
    <li className="sdp-xat-dia">
      <span className="sdp-xat-dia__pastilla">{text}</span>
    </li>
  );
}
