/* Noms públics de les dues entrades d'ajuda. Els identificadors operatius
   sempre venen del port: una entrada absent no es convertix en un compte. */
export const CONTACTES_AJUDA = Object.freeze([
  { nom: 'Sóc de Poble', tipus: 'entitat' },
  { nom: 'IAIA MarIA', tipus: 'ia' }
]);

export function contactesDAjuda(membres) {
  return CONTACTES_AJUDA.map(({ nom, tipus }) =>
    membres.find(m => m.nom === nom && m.tipus === tipus)
    || { nom, tipus, usuari_id: `ajuda:${tipus}`, noDisponible: true });
}
