/**
 * restauradorOpenDataModel.js — Vocabulari i constants pures del restaurador Open Data municipal (Onada R32.22 · T2 HMR).
 */

const txt = (clau, reserva) => Object.freeze([`section.pobles.restaurador.${clau}`, reserva]);

export const TEXTOS_RESTAURADOR = Object.freeze({
  titol: txt('titol', 'Restaurar dades obertes del municipi'),
  explica: txt('explica', 'Comprova un paquet abans de restaurar les seues dades públiques. No inclou comptes, xats ni notes privades.'),
  fitxer: txt('fitxer', 'Paquet Open Data (ZIP)'),
  ajudaFitxer: txt('ajudaFitxer', 'Tria un paquet municipal de fins a 64 MB. La lectura i la comprovació es fan en este dispositiu.'),
  sha: txt('sha', 'Empremta SHA-256 esperada'),
  ajudaSha: txt('ajudaSha', 'Aporta els 64 caràcters de l’empremta obtinguda d’una font de confiança. El resum del mateix fitxer, per si sol, no acredita qui l’ha publicat.'),
  comprova: txt('comprova', 'Comprovar i previsualitzar'),
  descarta: txt('descarta', 'Descartar el paquet'),
  comprovant: txt('comprovant', 'Comprovant el paquet…'),
  valid: txt('valid', 'El paquet coincidix amb l’empremta aportada; l’esquema DataPackage v2, les llicències per element i el contingut s’han comprovat. Encara no s’ha restaurat.'),
  error: txt('error', 'No es pot verificar el paquet. Revisa el fitxer ZIP i l’empremta de confiança; no s’ha escrit cap dada.'),
  senseCapacitat: txt('senseCapacitat', 'Este servidor permet comprovar el paquet, però encara no admet restaurar-lo. No s’enviarà cap dada.'),
  sensePermis: txt('sensePermis', 'La restauració necessita permís d’administració i un municipi actiu confirmat.'),
  altreMunicipi: txt('altreMunicipi', 'El paquet és d’un altre municipi. Canvia al poble corresponent abans de restaurar-lo.'),
  resum: txt('resum', 'Contingut verificat'),
  municipi: txt('municipi', 'Municipi'),
  noticies: txt('noticies', 'Notícies'),
  agenda: txt('agenda', 'Agenda'),
  directori: txt('directori', 'Entitats'),
  memoria: txt('memoria', 'Memòria cultural'),
  memoriaOral: txt('memoriaOral', 'Memòria oral revisada'),
  restaura: txt('restaura', 'Restaurar en el municipi actiu'),
  restaurat: txt('restaurat', 'El servidor de dades ha confirmat la restauració del contingut públic.'),
  errorRestauracio: txt('errorRestauracio', 'El servidor no ha confirmat la restauració. Revisa els permisos o els conflictes abans de tornar-ho a provar.'),
  limit: txt('limit', 'La configuració del node, la publicació ActivityPub i els fitxers d’imatge no es restauren amb esta operació.'),
});

export const COLLECCIONS_RESUM = Object.freeze(['noticies', 'agenda', 'directori', 'memoria', 'memoriaOral']);
export const MAXIM_BYTES_OPENDATA = 64 * 1024 * 1024;
export const CONFIG_OPENDATA_BUIDA = Object.freeze({});
export const teCapacitatRestauracioOpenData = (port) => Boolean(
  port?.teCapacitat?.('restauracioDadesObertes') && typeof port.restauraDadesObertes === 'function'
);
