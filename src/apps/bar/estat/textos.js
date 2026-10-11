/**
 * El Bar · estat/textos.js — el que es diu a la persona quan una operació no
 * es fa. El text ix del `codi` de l'error (nucli, magatzem, magatzemLocal o
 * la guarda del permís de ProveidorBar), mai d'un missatge tècnic: cap valor
 * de negoci, cap clau, cap pila.
 *
 * També l'avís de la sessió (avisDeSessio): per què el Bar ven o no ven ara.
 */
const TEXTOS = Object.freeze({
  SENSE_PERMIS: 'No tens permís per a fer-ho: no s’ha desat res.',
  SENSE_TORN: 'Cal obrir el torn abans de vendre.',
  TORN_OBERT: 'Ja hi ha un torn obert.',
  TORN_TANCAT: 'Este torn ja està tancat.',
  TRASPAS_NO_LLEGIT: 'Primer cal llegir la nota de traspàs del torn anterior.',
  OBERTES_SENSE_TRASPAS: 'Hi ha comandes obertes que no passen al torn següent.',
  OBERTA_AMB_PAGAMENTS: 'Hi ha comandes obertes amb pagaments: acaba de cobrar-les abans de tancar el torn.',
  NO_OBERTA: 'Esta comanda ja no està oberta.',
  NO_TROBADA: 'No l’hem trobada: potser ja s’ha tancat.',
  CONFLICTE: 'Esta comanda ha canviat en una altra banda: torna a provar-ho.',
  MIG_MOVIMENT: 'El moviment s’ha quedat a mitges: les línies són ara a les DUES comandes. No el repetisques: mira l’avís de davall i lleva-les de la comanda on sobren abans de cobrar.',
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

/**
 * L'avís d'un «Mou» o un «Dividix» a mitges (nucli/migMoviment.js,
 * detectaMigsMoviments), per a una persona: quines línies, a quines dues
 * comandes i què fer. `nomDe(descripcio)` diu el nom d'una comanda («Taula 3»,
 * «Barra · 10:00», «Nota 0004»); el posa la vista. Res no s'arregla sol.
 * @returns {{ titol: string, text: string }}
 */
export function avisMigMoviment(mig, nomDe) {
  const titol = 'Un moviment s’ha quedat a mitges';
  if (!mig || mig.motiu === 'ERROR') {
    return { titol: 'No s’han pogut comprovar els moviments', text: 'No s’ha pogut mirar si algun moviment entre comandes s’ha quedat a mitges. Revisa les comandes obertes abans de cobrar: alguna línia podria estar dues vegades.' };
  }
  const linies = mig.linies.map((l) => `${l.quantitat} × ${l.nom}`).join(', ');
  const quines = `${mig.linies.length === 1 && mig.linies[0].quantitat === 1 ? 'La línia' : 'Les línies'} ${linies}`;
  const origen = nomDe(mig.origen);
  const desti = nomDe(mig.desti);
  if (mig.motiu === 'ORIGEN_COBRAT') {
    return { titol, text: `${quines}: ja s’han cobrat a «${origen}» i encara són a «${desti}». Revisa-la abans de cobrar: estes línies poden estar dues vegades. Si sobren, lleva-les de «${desti}».` };
  }
  if (mig.motiu === 'DESTI_COBRAT') {
    return { titol, text: `${quines}: ja s’han cobrat a «${desti}» i encara són a «${origen}». Revisa-la abans de cobrar: estes línies poden estar dues vegades. Si sobren, lleva-les de «${origen}».` };
  }
  return { titol, text: `${quines}: són a «${origen}» i també a «${desti}». Revisa-les abans de cobrar: estes línies poden estar dues vegades. Lleva-les de la comanda on sobren; no tornes a fer el moviment.` };
}

export function textError(error) {
  const codi = error?.codi;
  if (codi && Object.hasOwn(TEXTOS, codi)) return TEXTOS[codi];
  return 'No s’ha pogut fer. Torna a provar-ho.';
}

/* Un avís per motiu del pont de sessió (useSessioApp, MOTIUS). `entra`: porta
   el botó «Entra» (rutaEntrada). 'sessio' i 'lliure' no en tenen: en línia no
   cal dir res. 'comprovant-desada' diu el mateix que 'comprovant', però el
   Bar ven: el servidor comprova una sessió desada que encara no ha caigut. */
const COMPROVANT = Object.freeze({ to: 'info', text: 'Comprovant la sessió…', entra: false });
const AVISOS_SESSIO = Object.freeze({
  'sense-sessio': Object.freeze({ to: 'avis', text: 'Entra per a vendre.', entra: true }),
  comprovant: COMPROVANT,
  'comprovant-desada': COMPROVANT,
  'sense-permis': Object.freeze({ to: 'avis', text: 'Esta sessió no pot vendre.', entra: false }),
  'mode-proves': Object.freeze({ to: 'info', text: 'Mode de proves: les vendes no estan lligades a cap compte.', entra: false }),
  'fora-de-linia': Object.freeze({
    to: 'info', text: 'Sense connexió: cada venda es desa en este dispositiu. La sessió es comprovarà quan torne la xarxa.', entra: false
  })
});

/* Amb sessió (o en una app lliure) però sense xarxa. */
const SENSE_CONNEXIO = Object.freeze({ to: 'info', text: 'Sense connexió: cada venda es desa en este dispositiu.', entra: false });

/**
 * L'avís de la sessió del Bar a partir del permís de l'estat (ProveidorBar,
 * `permis`: { potEscriure, motiu, enLinia, modeProves, rutaEntrada }):
 * { to, text, entra } o null si no cal dir res ('sessio' o 'lliure' en línia).
 * Un sol avís: el motiu ja diu el més important.
 */
export function avisDeSessio(permis) {
  const motiu = permis?.motiu;
  if (typeof motiu === 'string' && Object.hasOwn(AVISOS_SESSIO, motiu)) return AVISOS_SESSIO[motiu];
  return permis?.enLinia === false ? SENSE_CONNEXIO : null;
}
