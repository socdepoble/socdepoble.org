/**
 * origenNota.js — D'on ve una nota que no ha escrit la persona (T5, Connectar).
 *
 * Una connexió («Connectar» sobre una casa, una faena, un poble…) crea una nota
 * al MAS de qui connecta, però el contingut és d'una altra persona. La nota
 * ho recorda amb `origen`, i per això l'editor canvia «Publicar» per
 * «Compartir» encara que la nota canvie de carpeta o d'etiquetes. El camp
 * viatja pel port com la resta de la nota: l'adaptador local el guarda tal
 * qual i el remot el desa a la columna `origen` (migració 260927_2100).
 *
 * Funció pura, sense React ni xarxa: la usen els dos adaptadors i la
 * interfície. Cap HTML: només text net i curt.
 */
import { netejaText } from '../utils/sanitize.js';

export const TIPUS_ORIGEN = Object.freeze(['connexio']);
const CAMPS = Object.freeze(['sectionId', 'itemId', 'titol', 'autorId', 'autorNom', 'autorTipus', 'ruta']);
const MAXIM = 300;

/** Torna l'origen net, o null si no és cap origen que coneguem. */
export function normalitzaOrigen(origen) {
  if (!origen || typeof origen !== 'object') return null;
  if (!TIPUS_ORIGEN.includes(origen.tipus)) return null;
  const net = { tipus: origen.tipus };
  for (const camp of CAMPS) {
    if (origen[camp] === undefined || origen[camp] === null) continue;
    const valor = netejaText(String(origen[camp]), MAXIM);
    if (valor) net[camp] = valor;
  }
  return net.itemId ? net : null;
}

/** Una nota connectada: el contingut és d'una altra persona. */
export const esConnexio = (nota) => nota?.origen?.tipus === 'connexio';
