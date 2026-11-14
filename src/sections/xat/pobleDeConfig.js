/* Onada R24 · wp_trinquet (SEO-R22-08, trinquet de l'arrencada estàtica) · El
   poble que declara l'amfitrió (pobleAmfitrio.js), en un mòdul propi:
   NotesContext.jsx, que és de l'arrencada, només en vol pobleDeConfig i,
   important-la de pobleAmfitrio.js, arrossegava al tros d'entrada el grup del
   poble del Xat (les cares, les rutes i anteposaPoble), que només fa servir el
   Xat, diferit. pobleAmfitrio.js la reexporta amb el mateix nom: cap altre
   importador no canvia. Model B: el poble és presentació i navegació
   (configAmfitrio.js), mai `tenantId`. */
import { sanejaEtiqueta, sanejaIdentificador } from '../../config/configAmfitrio.js';

/** { id, nom } del poble de l'amfitrió, o null si no n'ha declarat cap vàlid. */
export function pobleDeConfig(externalConfig) {
  const id = sanejaIdentificador(externalConfig?.poble);
  if (!id) return null;
  return { id, nom: sanejaEtiqueta(externalConfig?.nomPoble) || '' };
}
