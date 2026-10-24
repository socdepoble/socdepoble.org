/**
 * contacte.js — T2 (261024; P0-18, DSA arts. 11 i 12) · L'adreça pública de
 * contacte de Sóc de Poble, en UN sol lloc: el punt únic de contacte de
 * l'Avís legal (legalContent.js), els drets i la baixa, la reserva de
 * «Informa d'un error» (xat/informeDError.js) i els textos de la moderació
 * dels cinc diccionaris. Els textos no l'interpolen (la paritat de
 * i18n.moderacio.test.js llig el valor literal): contacte.test.js comprova
 * que tota adreça de correu d'eixos fitxers, i de la que index.html porta per
 * a qui no té JavaScript, és esta.
 *
 * Mòdul sense dependències a posta: XatSection el pot importar sense
 * arrossegar el document legal (XatSection.pes.test.js).
 *
 * Un segon canal per a triar (DSA art. 12.1) és decisió del Mestre.
 */
export const CORREU_CONTACTE = 'socdepoble@socdepoble.org';
