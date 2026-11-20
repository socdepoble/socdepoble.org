/**
 * entitatsDelPobleModel.js — Funcions pures del panell «Empreses i entitats»
 * (separades d'EntitatsDelPoble.jsx per garantir puresa Fast Refresh / HMR).
 */

export const senseTraduccioEntitats = (_clau, reserva) => reserva;

/* El tipus de la fitxa pública d'una fila del directori (identitatsSeed.js ·
   TIPUS_DE_KIND): un grup és un grup; una empresa o una entitat, entitat. */
export const tipusDeKind = (kind) => (kind === 'group' ? 'grup' : 'entitat');

/** Els textos del panell ({ titol, buit, carregant, error, noDisponible }) i les etiquetes de tipus. */
export function textosDeLesEntitats(t = senseTraduccioEntitats) {
  const tradueix = typeof t === 'function' ? t : senseTraduccioEntitats;
  return {
    titol: '',
    buit: tradueix('section.detail.pobles.entitats.buit', 'Encara no hi ha cap empresa ni entitat d’este poble al directori.'),
    carregant: tradueix('section.detail.pobles.entitats.carregant', 'Carregant les empreses i entitats d’este poble…'),
    error: tradueix('section.detail.pobles.entitats.error', 'No s’han pogut carregar les empreses i entitats d’este poble'),
    noDisponible: tradueix('section.detail.pobles.entitats.noDisponible', 'Este servidor encara no llista les empreses i entitats dels pobles.'),
    tipus: {
      company: tradueix('section.detail.pobles.entitats.empresa', 'Empresa'),
      entity: tradueix('section.detail.pobles.entitats.entitat', 'Entitat'),
      group: tradueix('section.detail.pobles.entitats.grup', 'Grup')
    }
  };
}

/* Una fila del directori com a entrada de GraellaTargetes (un id textual propi). */
export const entradaDeEntitat = (fila) => ({ id: `entitat:${fila.id}`, fila });
