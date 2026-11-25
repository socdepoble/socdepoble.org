/** Destinació del Curador sobre el servei real; independent del flag de llavor.
 * El servei entra per la plataforma. No incorpora cap URL ni backend a l'app.
 * No promet afegir una font si el servidor no declara les personals operatives.
 */
import { creaFontsPersonals, destinacioDe } from './fontsPersonals.js';
import { creaMagatzemLector } from './magatzem.js';
import { creaFontNoticies } from './fontNoticies.js';
import { creaAdaptadorRemot } from './fontRemota.js';

export function creaDestinacioServei({ servei, obriMagatzem = () => creaMagatzemLector() } = {}) {
  if (!servei || typeof servei.estat !== 'function' || typeof servei.fonts !== 'function' || typeof servei.feed !== 'function' || typeof servei.feedPersonal !== 'function') return null;
  const font = creaFontNoticies(creaAdaptadorRemot({ servei }));
  const destinacio = destinacioDe(creaFontsPersonals({ obriMagatzem, font: () => font }));
  return Object.freeze({
    nomMaxim: destinacio.nomMaxim,
    categories: () => destinacio.categories(),
    async afig(entrada) {
      const estat = await servei.estat();
      if (estat?.disponible !== true || estat?.personals !== true) {
        throw Object.assign(new Error('El servei encara no permet afegir fonts personals.'), { codi: 'personals-off' });
      }
      return destinacio.afig(entrada);
    }
  });
}
