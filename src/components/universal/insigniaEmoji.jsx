/**
 * insigniaEmoji.jsx — l'emoji XL al quadrat d'una UniversalCard sense foto.
 *
 * Ordre del Mestre (261007) · Al quadrat d'una part sense foto, un emoji XL
 * en lloc de la icona lineal (sp-card-calendar-badge__emoji, components.css).
 * És el squareBadge de tipus 'custom' que el catàleg feia a mà
 * (EspecimenUniversalCard: 🚗 Vehicle, 🐶 Animalets, ⚙️ Consola, 🗺️ Mapa,
 * 🧾 Gestoria) i que ara també porta la targeta viva (TargetaViva) quan el
 * document no té imatge i té una emoticona triada: una sola peça (DRY).
 *
 * L'emoji és decoratiu (aria-hidden): el nom el porta l'etiqueta del quadrat
 * (`label`), que UniversalCard pinta com una imatge amb nom (role="img",
 * revisió del 261007, M2-08: un aria-label en un <div> sense rol no el llig
 * cap lector). Sense `label` (la targeta viva, que ja diu el títol), el
 * quadrat sencer és decoratiu (`decoratiu`: aria-hidden, sense nom).
 * Sense emoji, cap insígnia (null): CardBody no pinta el quadrat. Qui la fa
 * servir no la passa mai amb imatge, perquè CardBody pinta la insígnia encara
 * que n'hi haja (el patró de consola/peces.jsx: imatge ? null : insígnia).
 */
export function insigniaEmojiXL(label, emoji) {
  if (!emoji) return null;
  const contingut = <span className="sp-card-calendar-badge__emoji" aria-hidden="true">{emoji}</span>;
  return label ? { type: 'custom', label, content: contingut } : { type: 'custom', decoratiu: true, content: contingut };
}
