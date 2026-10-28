/**
 * governConsola.js — les quatre pàgines del Govern del Mestre (/consola/govern/<id>), sense React.
 *
 * Pla 261016_1530, Onada 0.5 (Mandat Suprem): «Consola (/consola): el quadre
 * de comandament complet per al Mestre i l'administració del sistema», amb
 * quatre mòduls: l'estat dels requeriments en viu, el balanç de sessió, la
 * certificació humana i el canal de comunicació màquina-humà.
 *
 * És un grup a part de les nou pàgines de la maquinària (IDS_PAGINES,
 * consolaPagines.js), amb la mateixa maquinària de subpàgines que el pols
 * (polsConsola.js): un id per pàgina, la seua ruta i el seu copy. El grup no
 * entra a IDS_PAGINES, i per això ni l'Índex de la Consola ni el Diagnòstic
 * del Mas ni la Consola incrustada de la Wiki canvien.
 * Pla 261027_0845 (Guarda Nocturna), §3 · El grup continua fora
 * d'IDS_PAGINES, i l'Índex i el Diagnòstic continuen igual; la Consola
 * incrustada de la Wiki, no: ara pinta la secció del govern pel mateix cap
 * de tauler que /consola (TaulerAmbGovern, ConsolaSection.jsx), no per
 * IDS_PAGINES. Derogat: «ni […] la Consola incrustada de la Wiki canvien».
 *
 * El copy és provisional (el patró de COPY_PROVISIONAL de consolaPagines.js):
 * quan el Mestre aprove la clau PAGE_COPY.consola.govern, mana eixa.
 */
import { RUTA_CONSOLA, copyConsola } from '../consolaPagines.js';

export const RUTA_GOVERN_UI = `${RUTA_CONSOLA}/govern`;
/** La ruta compartible d'una pàgina del govern. */
export const rutaGovern = (id) => `${RUTA_GOVERN_UI}/${id}`;

/** Els ids de les pàgines del govern, en l'ordre dels mòduls del pla. */
export const IDS_GOVERN = Object.freeze(['requeriments', 'balanc', 'certificacio', 'comunicacio']);

/** El títol de la secció del tauler i de la navegació del grup. */
export const TITOL_GOVERN = 'Govern del Mestre';
export const ETIQUETA_NAV_GOVERN = 'Pàgines del govern del Mestre';
export const ENTRADETA_GOVERN = 'El quadre de comandament del Mestre: què s’ha demanat, què s’ha fet, què cal certificar i què passa a la tanda següent, en paraules planes. Davall, la sala de màquines de la Consola.';
/**
 * L'H2 de la sala de màquines al tauler de /consola, darrere del grup del
 * govern i damunt de les nou targetes de la maquinària: l'Índex de secció i
 * la navegació per encapçalaments no posen la maquinària davall del Govern
 * del Mestre. Revisió adversarial del carril F1 (problemes 2 i 9) · Era el
 * text d'un separador (Divisor), que no és cap encapçalament. Text
 * provisional, com el copy del govern: l'ha d'aprovar el Mestre.
 */
export const TITOL_SALA_MAQUINES = 'La sala de màquines de la Consola';

const COPY_PROVISIONAL = Object.freeze({
  requeriments: Object.freeze({
    title: 'Estat dels requeriments',
    subtitle: 'Per a saber què està fet, què va a mitges i què queda',
    lead: 'La matriu de requeriments, fila per fila: què està fet i segellat, què va a mitges i què passa a la tanda següent. Si la matriu és vella o un estat no s’entén, la Consola la marca obsoleta i no la pinta mai de verd.'
  }),
  balanc: Object.freeze({
    title: 'Balanç de la sessió',
    subtitle: 'Per a comparar el que es va demanar amb el que s’ha fet',
    lead: 'Demanat, fet i traslladat, comptats de la mateixa matriu: el que no s’ha acabat passa a la tanda següent amb el seu identificador i no s’esborra mai. La Consola no mou res: ho compta i ho compara.'
  }),
  certificacio: Object.freeze({
    title: 'Certificació del Mestre',
    subtitle: 'Per a validar, certificar o retornar cada tasca',
    // Revisió adversarial del carril F1 · Els tres verbs ixen a totes les files. Derogat: «certifica una tasca feta i segellada».
    lead: 'Un botó per decisió, sense escriure cap ordre: valida una fila, certifica-la o retorna-la amb una nota. Una certificació d’una fila que la matriu no dona per feta es diu així i no es pinta de verd. Cada decisió s’apunta i no es reescriu mai, i l’estat que calcula la matriu no canvia per cap decisió.'
  }),
  comunicacio: Object.freeze({
    title: 'Comunicació amb les IAs',
    subtitle: 'Per a llegir en paraules planes com va la faena',
    lead: 'Els resums de la matriu en paraules de poble: quant n’hi ha de fet, de mig fer i de pendent per a cada responsable i per a cada prioritat, i les tasques més urgents que encara queden obertes.'
  })
});

/** Una pàgina del govern pel seu id, amb la seua ruta i el seu copy; null si no existix. */
export function paginaGovern(id) {
  if (!IDS_GOVERN.includes(id)) return null;
  const copy = copyConsola().govern?.pagines?.find((p) => p.id === id) ?? COPY_PROVISIONAL[id];
  return { id, ruta: rutaGovern(id), title: copy.title, subtitle: copy.subtitle, lead: copy.lead };
}

/** Les quatre pàgines, en ordre. */
export const paginesGovern = () => IDS_GOVERN.map(paginaGovern);

/**
 * L'id d'una pàgina del govern a partir del comodí de la ruta (/consola/*):
 * 'govern/balanc' (o amb barres a les vores) → 'balanc'. Un id que no existix
 * també es torna: la seua pàgina diu que no existix. Qualsevol altra forma
 * ('govern' sol, el tauler, una pàgina de la maquinària), null.
 */
export function segmentGovern(comodi) {
  const net = String(comodi ?? '').replace(/^\/+|\/+$/g, '');
  const trobat = /^govern\/([^/]+)$/.exec(net);
  return trobat ? trobat[1] : null;
}
