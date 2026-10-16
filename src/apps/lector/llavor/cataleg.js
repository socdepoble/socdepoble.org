/**
 * Lector de notícies · la llavor sintètica (proves i literal
 * VITE_SDP_LECTOR_LLAVOR=1, AppLector.jsx): categories i fonts
 * INVENTADES, en valencià i sense cap marca. Cada font és un feed de veres
 * (RSS 2.0, RSS 1.0 o Atom 1.0) importat com a text (?raw): passa pel mateix
 * analitzador que passaria el feed d'una font real. Les adreces dels feeds
 * són d'example.org (domini reservat, RFC 2606) i viuen als .xml, no al codi.
 */
import CLUB_PILOTA from './club-pilota.xml?raw';
import COLLA_DIMONIS from './colla-dimonis.xml?raw';
import COOPERATIVA from './cooperativa.xml?raw';
import PREGONER from './pregoner.xml?raw';
import VEU_PLACA from './veu-placa.xml?raw';

export const CATEGORIES_LLAVOR = Object.freeze([
  Object.freeze({ id: 'ajuntament', nom: 'Ajuntament i serveis', ordre: 0, icona: 'Landmark' }),
  Object.freeze({ id: 'festes', nom: 'Cultura i festes', ordre: 1, icona: 'PartyPopper' }),
  Object.freeze({ id: 'camp', nom: 'Camp i temps', ordre: 2, icona: 'Sprout' }),
  Object.freeze({ id: 'esports', nom: 'Esports', ordre: 3, icona: 'Trophy' })
]);

/* { id, nom, categoriaId, descripcio, xml }: el nom i la categoria són del
   poble (com ho decidiria l'amfitrió), no del feed. */
export const FONTS_LLAVOR = Object.freeze([
  Object.freeze({ id: 'veu-placa', nom: 'La Veu de la Plaça', categoriaId: 'ajuntament', descripcio: 'El butlletí veïnal de la plaça.', xml: VEU_PLACA }),
  Object.freeze({ id: 'pregoner', nom: 'El Pregoner del Carrer Major', categoriaId: 'ajuntament', descripcio: 'Bans i avisos.', xml: PREGONER }),
  Object.freeze({ id: 'colla-dimonis', nom: 'Colla de Dimonis de la Font Vella', categoriaId: 'festes', descripcio: 'Foc, tabals i festa.', xml: COLLA_DIMONIS }),
  Object.freeze({ id: 'cooperativa', nom: 'Cooperativa de l’Horta Vella', categoriaId: 'camp', descripcio: 'La collita, els preus i el temps.', xml: COOPERATIVA }),
  Object.freeze({ id: 'club-pilota', nom: 'Club de Pilota del Trinquet', categoriaId: 'esports', descripcio: 'Escala i corda i raspall.', xml: CLUB_PILOTA })
]);
