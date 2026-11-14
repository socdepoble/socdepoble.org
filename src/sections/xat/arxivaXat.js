/**
 * arxivaXat.js — L'arxiu d'una conversa per a la interfície (Onada R22 · T1,
 * continuació del Clon de WhatsApp). Mòdul pur: cap estat, cap xarxa i cap
 * emmagatzematge al navegador (D-B8C-4: res d'activitat de converses en
 * localStorage d'aparells compartits).
 *
 *   · TEXTOS_ARXIVA · parells [clau, reserva] idèntics al valor valencià.
 *   · potArxivar(fil) · si un fil admet arxivar-se (mai els actors per defecte,
 *     ni el xat de mostra de Javi, ni comunitats contenidores, ni visitants).
 *   · estatArxivatLocal(mapa, filId) · true | false | null sobre el mapa en
 *     memòria de XatContext (netejat per àmbit de sessió).
 *   · aplicaArxivatsLocals(fils, mapa) · mateixa referència si res no canvia.
 */
import { ID_FIL_DE_MOSTRA_DE_JAVI, esIdPerDefecte } from '../../data/xatsPerDefecte.js';

export const TEXTOS_ARXIVA = Object.freeze({
  menu: Object.freeze(['section.xat.arxiva.menu', 'Arxiva la conversa']),
  desfes: Object.freeze(['section.xat.arxiva.desfes', 'Desarxiva la conversa']),
  fet: Object.freeze(['section.xat.arxiva.fet', 'Conversa arxivada']),
  desfet: Object.freeze(['section.xat.arxiva.desfet', 'Conversa desarxivada']),
  nomesLocal: Object.freeze([
    'section.xat.arxiva.nomesLocal',
    'Arxivada només en esta sessió fins que tornes a obrir l’app: el servidor encara no ho guarda.'
  ]),
  error: Object.freeze([
    'section.xat.arxiva.error',
    'No s’ha pogut canviar l’arxiu de la conversa. Torna-ho a provar.'
  ]),
  safata: Object.freeze(['section.xat.arxiva.safata', 'Arxivats']),
  safataBuida: Object.freeze(['section.xat.arxiva.safataBuida', 'No tens cap conversa arxivada.']),
  torna: Object.freeze(['section.xat.arxiva.torna', 'Torna a les converses']),
  seleccionades: Object.freeze(['section.xat.arxiva.seleccionades', 'Arxivar']),
  desarxivaSeleccionades: Object.freeze(['section.xat.arxiva.desarxivaSeleccionades', 'Desarxivar'])
});

/** Cert si `fil` admet arxivar-se: conversa pròpia amb id real (no actor permanent ni visitant). */
export function potArxivar(fil) {
  if (!fil || typeof fil !== 'object') return false;
  const id = fil.id;
  if (typeof id !== 'string' || id.trim() === '') return false;
  if (esIdPerDefecte(id) || id === ID_FIL_DE_MOSTRA_DE_JAVI || id.startsWith('fake-') || fil.perDefecte) return false;
  if (fil.tipus === 'comunitat') return false;
  return fil.participant !== false;
}

/**
 * L'estat d'arxiu en memòria d'un fil: `true` (arxivat), `false` (desarxivat en
 * memòria: mana sobre el servidor) o `null` (cap entrada: mana el servidor).
 */
export function estatArxivatLocal(mapa, filId) {
  if (!(mapa instanceof Map) || !mapa.has(filId)) return null;
  const valor = mapa.get(filId);
  return typeof valor === 'boolean' ? valor : null;
}

/** Els fils amb l'arxiu en memòria aplicat; la mateixa referència si res no canvia. */
export function aplicaArxivatsLocals(fils, mapa) {
  if (!Array.isArray(fils) || !(mapa instanceof Map) || mapa.size === 0) return fils;
  let canviat = false;
  const resultat = fils.map((fil) => {
    const local = estatArxivatLocal(mapa, fil?.id);
    if (local === null || Boolean(fil.arxivat) === local) return fil;
    canviat = true;
    return { ...fil, arxivat: local };
  });
  return canviat ? resultat : fils;
}
