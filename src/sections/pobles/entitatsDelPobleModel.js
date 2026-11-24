/**
 * entitatsDelPobleModel.js — Funcions pures del panell «Empreses i entitats»
 * (separades d'EntitatsDelPoble.jsx per garantir puresa Fast Refresh / HMR).
 */

import { resolOffline } from '../mur/i18nEstatErrorHumana.js';

export const senseTraduccioEntitats = (_clau, reserva) => reserva;

/* El tipus de la fitxa pública d'una fila del directori (identitatsSeed.js ·
   TIPUS_DE_KIND): un grup és un grup; una empresa o una entitat, entitat. */
export const tipusDeKind = (kind) => (kind === 'group' ? 'grup' : 'entitat');

/** Els textos del panell ({ titol, buit, carregant, error, noDisponible }) i les etiquetes de tipus. */
export function textosDeLesEntitats(t = senseTraduccioEntitats, idioma = 'ca') {
  const tradueix = typeof t === 'function' ? t : senseTraduccioEntitats;
  /* v1.2.24 · costura R32.75 · `tr`, com el de DesplegableEsdevenimentsCalendari.jsx: passa la clau tal qual al
     traductor i a resolOffline, i així i18n.usades i la Llei del Píxel (i18n.p122) hi lligen cada parell. */
  const tr = (clau, reserva) => resolOffline(tradueix(clau, reserva), clau, idioma);
  return {
    titol: '',
    buit: tr('section.detail.pobles.entitats.buit', 'Encara no hi ha cap empresa ni entitat d’este poble al directori.'),
    carregant: tr('section.detail.pobles.entitats.carregant', 'Carregant les empreses i entitats d’este poble…'),
    error: tr('section.detail.pobles.entitats.error', 'No s’han pogut carregar les empreses i entitats d’este poble'),
    noDisponible: tr('section.detail.pobles.entitats.noDisponible', 'Este servidor encara no llista les empreses i entitats dels pobles.'),
    tipus: {
      company: tr('section.detail.pobles.entitats.empresa', 'Empresa'),
      entity: tr('section.detail.pobles.entitats.entitat', 'Entitat'),
      group: tr('section.detail.pobles.entitats.grup', 'Grup')
    }
  };
}

/* Una fila del directori com a entrada de GraellaTargetes (un id textual propi). */
export const entradaDeEntitat = (fila) => ({ id: `entitat:${fila.id}`, fila });
