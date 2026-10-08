import { Copyright } from 'lucide-react';

/**
 * BotoDretsAutor — el disparador de «Drets d'autor», davall del títol.
 *
 * T39 (ordre del Mestre, 260928) · Ja no obri cap diàleg: DocumentEditor hi
 * penja la vista a pantalla completa (drets/CopyrightPage.jsx). El marcatge i
 * la classe són els d'abans (el píxel no canvia); només perd
 * aria-haspopup="dialog", perquè ja no n'obri cap. `title` diu els drets d'ara.
 * El fitxer conserva el nom per a no trencar cap importació.
 *
 * Decisió del Mestre (261008) · Patró T7 P8 (BotoneraClassificacio): amb una
 * llicència TRIADA al document (`triada`: el camp copyright de veres, mai el
 * «© Sóc de Poble» que DocumentEditor hi posa quan no n'hi ha cap), la
 * píndola la mostra plena (sdp-badge-system, la de la carpeta triada) i el
 * seu nom accessible és «Drets d'autor: X»; un clic torna a obrir la vista per
 * a canviar-la. Sense, «Elegir drets d'autor», el DOM de sempre.
 * data-sdp-drets és el destí estable del focus (UniversalEditorShell,
 * DESTINS_FOCUS), el mateix que el copyright de la capçalera en edició.
 */
export function BotoDretsAutor({ valor = '', triada = '', onClick }) {
  const llicencia = typeof triada === 'string' ? triada.trim() : '';
  if (llicencia) {
    const etiqueta = `Drets d'autor: ${llicencia}`;
    return (
      <button type="button" className="sdp-classificacio-pindola" data-sdp-drets="" aria-label={etiqueta} title={etiqueta} onClick={onClick}>
        <span className="sp-card-label sdp-badge-system"><Copyright size={14} aria-hidden="true" /><span className="sdp-classificacio-pindola__text">{llicencia}</span></span>
      </button>
    );
  }
  return (
    <button type="button" className="sdp-classificacio-pindola" data-sdp-drets="" title={valor} onClick={onClick}>
      <span className="sp-card-label sdp-badge-buit"><Copyright size={14} aria-hidden="true" /><span className="sdp-classificacio-pindola__text">Elegir drets d'autor</span></span>
    </button>
  );
}

export default BotoDretsAutor;
