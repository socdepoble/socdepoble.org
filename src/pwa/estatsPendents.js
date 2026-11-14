/* Onada R24 · CODEX-R24-13 (deute R22, pwa-01 ronda 3) · El registre explícit de l'estat pendent que només
 * viu en memòria i que el DOM no veu.
 *
 * La recuperació de desplegament (recuperacioChunkDeploy.js) no recarrega sola després d'una entrada de la
 * persona (input, change, paste, drop) ni amb un camp ple al DOM. L'estat que naix només d'un toc i es queda
 * fora del DOM (l'esborrany d'una conversa que ja no es veu, amb una emoticona del calaix o l'informe
 * d'«Informa d'un error») no deixava cap d'eixes marques i es podia perdre. Ara, el proveïdor que el guarda
 * el MARCA mentre existix (marcaEstatPendent) i el NETEJA quan desapareix (netejaEstatPendent): quan s'envia,
 * es buida o se n'oblida, també quan canvia la persona o l'actor (el proveïdor buida el seu estat i la marca
 * se'n va amb ell, com fa esborranys.js amb buidaEsborranys). L'entrada (registre.js) passa hiHaEstatPendent
 * al motor com a `tePendents`: una marca viva veta la recàrrega automàtica, i la vista diferida cau a la seua
 * barrera honesta (RouteErrorBoundary), que avisa i no esborra res.
 *
 * Cap contingut: la clau és l'identificador del proveïdor ('xat.esborranys'), mai el text, i el registre la
 * rebutja si no en té la forma. Res es desa enlloc: viu en la memòria del document i se'n va amb ell.
 * Cap clic: un toc no marca res per si sol (el clic d'una navegació és justament el que troba el tros
 * retirat, i un veto a tots els clics deixaria la recuperació sense cap cas); només un proveïdor que guarda
 * estat de veres el marca. */
const PATRO_CLAU = /^[a-z][a-z0-9]*(?:[.:-][a-z0-9]+)*$/;
const MAXIM_CLAU = 64;
const marques = new Set();

function clauDe(clau) {
  if (typeof clau !== 'string' || clau.length > MAXIM_CLAU || !PATRO_CLAU.test(clau)) {
    throw new TypeError('La clau d’un estat pendent és l’identificador del proveïdor (minúscules, xifres, «.», «:» o «-»), mai el contingut.');
  }
  return clau;
}

/** El proveïdor `clau` guarda estat que només viu en memòria: la recuperació no recarrega sola. */
export function marcaEstatPendent(clau) {
  marques.add(clauDe(clau));
}

/** El proveïdor `clau` ja no guarda res pendent (s'ha enviat, buidat o oblidat). */
export function netejaEstatPendent(clau) {
  marques.delete(clauDe(clau));
}

/** El veto `tePendents` de la recuperació: cert si algun proveïdor té estat pendent. */
export function hiHaEstatPendent() {
  return marques.size > 0;
}

/** Oblida totes les marques (proves; un document nou ja arrenca sense cap). */
export function buidaEstatsPendents() {
  marques.clear();
}
