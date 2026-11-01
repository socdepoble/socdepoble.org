/* P1-20 · D15 (Assalt 10/10, T4a-C, 261101) · La Wiki compilada
   (wikiManifest.js, uns 206 kB gzip) és un tros diferit: només la importa
   estàticament la Wiki (WikiDePobleSection.jsx). El detall d'una peça de la
   Consola la demana ací, una sola vegada per document (iaiaLocal.js i
   AssignacioEmoji.jsx ja tenen el seu import() propi). Un rebuig no queda
   guardat: el pròxim intent la torna a demanar. */
let promesa = null;
let resolt = null;

export function carregaWikiManifest() {
  if (!promesa) {
    promesa = import('./wikiManifest.js')
      .then((modul) => { resolt = modul.wikiManifest; return resolt; })
      .catch((error) => { promesa = null; throw error; });
  }
  return promesa;
}

/* El manifest si ja ha arribat, o null. Qui torna a muntar-se després de la
   primera arribada el pinta des del primer fotograma, sense esperar la
   microtasca de la promesa (DetallPeca.jsx · useWikiDiferida). */
export function wikiManifestCarregat() {
  return resolt;
}
