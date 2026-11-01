/**
 * identitatDeReserva.js · P1-71 / D-7 (pla 261101_1246, decisió del Mestre) ·
 * La identitat d'un visitant anònim de NOMÉS LECTURA, en una sola font.
 *
 * Per a què serveix: en desenvolupament, una recàrrega en calent pot deixar
 * un proveïdor muntat fora d'IdentitatProvider, i useIdentitat() llança.
 * Abans, Mur, Notes i Xat tombaven el Mas sencer a l'ErrorBoundary de
 * l'arrel. Ara prenen esta reserva (useIdentitatOReserva.js): llegixen com
 * qui no ha entrat i refusen tota escriptura amb ErrorIdentitatDeLectura.
 * Mai és la identitat d'una altra persona: l'actor no té id i la clau
 * d'àmbit 'anon' no coincidix amb cap «tipus::id».
 *
 * La forma és la del valor d'IdentitatProvider (IdentitatContext.jsx), amb
 * la marca `nomesLectura` de més. En producció IdentitatProvider sempre
 * embolcalla l'App (PedraSecaEmbed.jsx): és una guarda defensiva.
 * Este mòdul no importa res: el poden fer servir els proveïdors de l'arrel
 * sense cap cicle.
 */

const CAP = Object.freeze([]);

const ACTOR_DE_RESERVA = Object.freeze({
  tipus: 'persona', id: null, nom: null, avatar: null, rol: 'convidat', slug: null, kind: null, poble: null
});

/** La reserva anònima de només lectura, congelada. */
export const IDENTITAT_DE_RESERVA = Object.freeze({
  actorType: 'persona',
  actorId: null,
  actorKey: 'anon',
  actor: ACTOR_DE_RESERVA,
  identitats: CAP,
  memberships: CAP,
  carregant: false,
  error: null,
  refresh: () => {},
  setActor: () => false,
  nomesLectura: true
});

/** Cert si `identitat` és una reserva de només lectura. */
export const esIdentitatDeLectura = (identitat) => identitat?.nomesLectura === true;

export const CODI_IDENTITAT_DE_LECTURA = 'SDP-IDENTITAT-001';

/**
 * Una escriptura refusada perquè no hi ha proveïdor d'identitat: no ha
 * arribat al port ni a la xarxa. El missatge és intern (com el «encara no
 * està disponible» de NotesDataContext.jsx): no es pinta a la interfície.
 */
export class ErrorIdentitatDeLectura extends Error {
  constructor(message = 'Sense proveïdor d’identitat el Mas és de només lectura: no s’ha desat ni enviat res.') {
    super(message);
    this.name = 'ErrorIdentitatDeLectura';
    this.code = CODI_IDENTITAT_DE_LECTURA;
  }
}
