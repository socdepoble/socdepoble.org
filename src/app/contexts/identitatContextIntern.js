/* P1-71 / §T-06 · Constants i memòria cau interna d'IdentitatContext fora del
   cicle de Fast Refresh. Sense dependències del projecte perquè cap edició en
   calent d'un mòdul veí invalide les referències ni buide l'actor resolt. */

export const ROLS_QUE_SIGNEN = Object.freeze(['owner', 'admin']);

export const potSignarPer = (membership) =>
  Boolean(membership) && ROLS_QUE_SIGNEN.includes(membership.role);

export const CLAU_PREFERENCIA_ACTOR = 'actor-preference';

export const clauPreferenciaPerUsuari = (userId) => `${CLAU_PREFERENCIA_ACTOR}:${userId}`;

export const CAP_MEMBRESIA = Object.freeze([]);

export const estatIdentitatIntern = {
  userId: null,
  generacio: null,
  memberships: CAP_MEMBRESIA,
  perfil: null,
};
