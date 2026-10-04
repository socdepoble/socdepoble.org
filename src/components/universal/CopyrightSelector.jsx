import { Copyright } from 'lucide-react';

/**
 * BotoDretsAutor — el disparador de «Drets d'autor», davall del títol.
 *
 * T39 (ordre del Mestre, 260928) · Ja no obri cap diàleg: DocumentEditor hi
 * penja la vista a pantalla completa (drets/CopyrightPage.jsx). El marcatge i
 * la classe són els d'abans (el píxel no canvia); només perd
 * aria-haspopup="dialog", perquè ja no n'obri cap. `title` diu els drets d'ara.
 * El fitxer conserva el nom per a no trencar cap importació.
 */
export function BotoDretsAutor({ valor = '', onClick }) {
  return (
    <button type="button" className="sdp-classificacio-pindola" title={valor} onClick={onClick}>
      <span className="sp-card-label sdp-badge-buit"><Copyright size={14} aria-hidden="true" /><span className="sdp-classificacio-pindola__text">Elegir drets d'autor</span></span>
    </button>
  );
}

export default BotoDretsAutor;
