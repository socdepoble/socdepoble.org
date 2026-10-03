/**
 * El Bar · estat/textos.js — el que es diu a la persona quan una operació no
 * es fa. El text ix del `codi` de l'error (nucli, magatzem o magatzemLocal),
 * mai d'un missatge tècnic: cap valor de negoci, cap clau, cap pila.
 */
const TEXTOS = Object.freeze({
  SENSE_TORN: 'Cal obrir el torn abans de vendre.',
  TORN_OBERT: 'Ja hi ha un torn obert.',
  TORN_TANCAT: 'Este torn ja està tancat.',
  TRASPAS_NO_LLEGIT: 'Primer cal llegir la nota de traspàs del torn anterior.',
  OBERTES_SENSE_TRASPAS: 'Hi ha comandes obertes que no passen al torn següent.',
  OBERTA_AMB_PAGAMENTS: 'Hi ha comandes obertes amb pagaments: acaba de cobrar-les abans de tancar el torn.',
  NO_OBERTA: 'Esta comanda ja no està oberta.',
  NO_TROBADA: 'No l’hem trobada: potser ja s’ha tancat.',
  CONFLICTE: 'Esta comanda ha canviat en una altra banda: torna a provar-ho.',
  JA_TANCAT: 'Este tiquet ja està tancat i no es pot reescriure.',
  SENSE_MOTIU: 'Cal dir el motiu.',
  MARXADA: 'Esta línia ja ha marxat: per a llevar-ne, cal anul·lar-la amb motiu.',
  NOVA: 'Esta línia encara no ha marxat: es pot llevar sense motiu.',
  PAGAT_SUPERA: 'Ja s’ha cobrat més del que quedaria.',
  PASSA_PENDENT: 'No es pot cobrar més del que falta.',
  LLIURAT_INSUFICIENT: 'El que s’ha lliurat no arriba a l’import.',
  PENDENT: 'Encara falta cobrar una part.',
  BUIDA: 'La comanda és buida.',
  DEVOLUCIO_MASSA: 'No es pot tornar més del que es va vendre.',
  QUANTITAT: 'Eixa quantitat no es pot fer servir.',
  DESCOMPTE: 'Eixe descompte no es pot aplicar.',
  PREU: 'Este producte necessita el preu.',
  NOMES_LECTURA: 'Una altra pestanya està fent de caixa: esta només pot mirar.',
  BLOQUEJAT: 'Una altra pestanya té oberta una versió anterior: tanca-la per a continuar.',
  VERSIO_ANTIGA: 'Hi ha una versió nova en una altra pestanya: recarrega la pàgina.',
  NO_DISPONIBLE: 'Les dades del dispositiu han deixat de respondre: recarrega la pàgina abans de continuar.',
  CARREGANT: 'Encara s’està carregant.',
  OCUPAT: 'Tanca el torn i les comandes obertes abans de canviar la carta.',
  LLAVOR: 'Esta carta no existix.'
});

export function textError(error) {
  const codi = error?.codi;
  if (codi && Object.hasOwn(TEXTOS, codi)) return TEXTOS[codi];
  return 'No s’ha pogut fer. Torna a provar-ho.';
}
