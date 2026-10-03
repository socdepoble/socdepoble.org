/**
 * textos.js — els textos llargs de Salut: l'avís i la guia del diari.
 *
 * Són dades, no HTML: cada apartat és una llista de paràgrafs que la vista
 * pinta com a text (cap marcatge cru). Valencià planer, sense noms de
 * malalties ni recomanacions de tractament. És un ESBORRANY: el text
 * definitiu l'ha de revisar el Mestre i, idealment, algú de salut.
 */

/* Puja-la quan canvie el que diu l'avís: tothom l'haurà de tornar a llegir. */
export const VERSIO_AVIS = 1;

export const FINALITAT = 'Un quadern domèstic per a apuntar com orina, beu, fa de ventre, dorm i com està la persona que cuidem, i per a ensenyar-ho al metge o a infermeria en un full clar.';

export const AVIS_SALUT = Object.freeze([
  Object.freeze({
    titol: 'Què és',
    paragrafs: Object.freeze([
      FINALITAT,
      'Servix per a no haver de recordar-ho tot de memòria i per a portar-ho a la consulta.'
    ])
  }),
  Object.freeze({
    titol: 'Què no és',
    paragrafs: Object.freeze([
      'No és un producte sanitari. No posa noms a res, no diu què li passa a ningú i no recomana tractaments ni quantitats de medicació.',
      'Quan veu alguna cosa que val la pena mirar, només diu «parla-ho amb el metge» o, si hi ha perill, «truca al 112».'
    ])
  }),
  Object.freeze({
    titol: 'On van les dades',
    paragrafs: Object.freeze([
      'Es queden en este dispositiu, dins d’este navegador. No s’envien a Sóc de Poble, ni a cap servidor, ni a cap intel·ligència artificial.',
      'Si s’esborren les dades del navegador o es canvia de dispositiu, es perden. Per això cal fer còpies de seguretat de tant en tant (Còpia i esborrat).',
      'Qui obri este navegador en este dispositiu pot veure-ho tot. L’historial del navegador guarda les adreces de l’app, que només porten dates.',
      'Si qui ho fa servir és un professional o una residència, en són els responsables, com amb qualsevol altre registre de salut.'
    ])
  }),
  Object.freeze({
    titol: 'El 112',
    paragrafs: Object.freeze([
      'Esta app no substituïx el 112 ni els serveis de salut. Si hi ha perill ara mateix, truca al 112.'
    ])
  })
]);

export const APARTATS_GUIA = Object.freeze([
  Object.freeze({
    id: 'diari-3-dies',
    titol: 'Com fer el diari de 3 dies',
    paragrafs: Object.freeze([
      'Tria tres dies seguits que siguen normals per a ell. Comença el diari a «Dies i períodes».',
      'Apunta cada vegada que orina i, si pots, quant: amb una gerra graduada o una ampolla de mesura. Si no s’ha pogut mesurar, apunta-ho igual i marca «No s’ha mesurat».',
      'Apunta també el que beu, els escapaments, els canvis d’absorbent i quan es gita, s’adorm, es desperta de nit i s’alça.',
      'L’endemà de l’últim dia, apunta la primera micció del matí: tanca el compte de la nit.',
      'Quan acabe cada dia, marca «He apuntat tot el dia». Sense això, l’app no calcula mitjanes ni índexs.',
      'Apunta el mínim necessari, amb respecte. Si ell pot participar, parla-ho amb ell.'
    ])
  }),
  Object.freeze({
    id: 'signes',
    titol: 'Signes per a cridar',
    paragrafs: Object.freeze([
      'Si hi ha perill ara mateix (una caiguda amb ferida, no respon com sempre, li costa respirar), truca al 112.',
      'Si canvia de pressa (de colp està molt més confús, inquiet o adormit que de costum), parla-ho hui mateix amb el metge o infermeria: pot tindre una causa física que cal mirar.',
      'La temperatura alta, la sang a l’orina o a la femta, el cremor o el dolor en orinar, la pell ferida o diversos dies sense fer de ventre són motius per a parlar-ne amb el metge o infermeria.',
      'Que l’app no mostre cap avís no vol dir que tot vaja bé: si et preocupa alguna cosa, consulta.'
    ])
  })
]);
export const IDS_APARTATS = Object.freeze(APARTATS_GUIA.map((apartat) => apartat.id));

/* Els errors del magatzem, dits a la persona. */
export function textError(error) {
  switch (error?.codi) {
    case 'NOMES_LECTURA': return 'Una altra pestanya està apuntant: ací només pots mirar.';
    case 'VERSIO_ANTIGA':
    case 'NO_DISPONIBLE': return 'Recarrega la pàgina per a continuar: les dades d’este dispositiu han canviat.';
    case 'BLOQUEJAT': return 'Tanca les altres pestanyes de Salut per a continuar.';
    default: return error instanceof TypeError ? 'Hi ha alguna dada que no és vàlida.' : 'No s’ha pogut desar. Torna-ho a provar.';
  }
}
