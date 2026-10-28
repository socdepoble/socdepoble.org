import { ambExifDeLoriginal } from '../components/universal/enquadrament/exifIncrustat.js';
import {
  dibuixaDreta, navegadorAplicaOrientacio, orientacioPendent, transformacioOrientacio,
} from '../components/universal/enquadrament/orientacio.js';

/**
 * Redueix una imatge utilitzant Canvas i la torna com a DataURL.
 * Per defecte utilitza el format WebP amb compressió agressiva per a
 * maximitzar l'estalvi d'espai a la base de dades sense perdre qualitat.
 *
 * PRIVACITAT (ADR multimèdia D4) · És la porta de TOTES les pujades d'imatge
 * (capçalera, avatar, logotip, ajust d'imatge i text enriquit): sempre torna a
 * codificar amb el canvas, i el resultat no porta els bytes de l'original. No
 * hi ha cap drecera (ni per mida, ni per format): no n'afegiu cap sense la
 * prova de imageUtils.test.js.
 *
 * Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · Sense opcions,
 * el resultat continua sense l'EXIF ni el GPS: és el que reben els camins
 * sense casella (l'ordre «/» Imatge del text enriquit, el logotip). Amb
 * `conservaExif` (la casella del DialegEnquadrament, marcada de sèrie:
 * «Conserva la ubicació i la data de la foto» o, si la foto només porta la
 * càmera, «Conserva les dades de la càmera de la foto»), el WebP o el JPEG del
 * canvas porta l'EXIF publicable de `original` (exifIncrustat.js: GPS, data i
 * càmera, l'orientació a 1 i sense la miniatura de l'IFD1). Sense `original`,
 * el mateix `file`. Ací no es llança cap avís: si l'EXIF no hi cap o no es pot
 * conservar, el resultat ix net, i qui ho diu és fotoDinsDelPressupost
 * (pujadaImatge.js: ERROR_PRESSUPOST_EXIF, ERROR_EXIF_NO_CONSERVABLE i els
 * de la càmera). P1-64 (pla 261028_1526) · `precisio` arrodonix la ubicació
 * que es torna a posar ('100m' o 'poble'; l'exacta, tal qual).
 *
 * Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Si el navegador no sap el
 * format demanat, toDataURL torna PNG (Safari 16 amb WebP). Qui comprimix una
 * foto ho mira i torna a demanar JPEG (fotoDinsDelPressupost, a
 * pujadaImatge.js); ací només es pinta el fons blanc que el JPEG necessita.
 * Un PNG no porta mai l'EXIF.
 *
 * Gauntlet 261016 (P2 de Codex, relleu 02:25) · La foto ix sempre DRETA: si el
 * navegador no l'ha posada dreta en descodificar-la (Chromium 151 amb un WebP
 * d'Orientation 6), es gira ací, UNA vegada i en el mateix drawImage que la
 * reduïx, amb la decisió i el dibuix del retallador (orientacioPendent i
 * dibuixaDreta, orientacio.js). L'orientació es llig de `file`, els píxels
 * que es dibuixen: un retall del diàleg ja és dret i no en porta. Així l'EXIF
 * que torna `conservaExif`, amb l'orientació a 1, va sempre damunt d'un
 * raster dret.
 *
 * @param {File} file L'arxiu d'imatge original
 * @param {Object} options Opcions de compressió
 * @param {number} options.maxSize Mida màxima en píxels de l'eix més llarg (400 l'avatar, 600 el logotip, 1200 la capçalera i la targeta)
 * @param {string} options.format Format d'eixida (per defecte: 'image/webp'; en 'image/jpeg', amb fons blanc)
 * @param {number} options.quality Qualitat de compressió (de 0 a 1)
 * @param {boolean} options.conservaExif Torna a posar l'EXIF publicable de l'original (per defecte: false)
 * @param {Blob} options.original La foto de la qual es llig l'EXIF (per defecte: `file`)
 * @param {string} options.precisio P1-64 · La precisió de la ubicació que es conserva ('exacta', '100m' o 'poble'; sense, l'exacta)
 * @param {Function} options.orienta La sonda del navegador per format (injectable per a les proves)
 * @returns {Promise<string>} Promesa que resol amb el DataURL (Base64)
 */
export function compressImage(file, {
  maxSize = 600, format = 'image/webp', quality = 0.8, conservaExif = false, original = null, precisio,
  orienta = navegadorAplicaOrientacio,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Cap arxiu proporcionat'));

    // La lectura de l'orientació va en paral·lel amb la descodificació (mai rebutja).
    const pendent = orientacioPendent(file, { orienta });
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      /* Onada 4 · revisió (K3) · Una excepció dins d'onload (sense context
         2D, un canvas tacat que toDataURL rebutja) el navegador només la
         reporta: sense este try (ara, el rebuig de la promesa asíncrona), la
         promesa quedava penjada per sempre i qui puja, «pujant» per sempre.
         El camí bo no canvia. */
      img.onload = () => {
        (async () => {
          const orientacio = await pendent;
          // La mida DRETA: girada en 5 a 8 si encara falta girar-la.
          const dreta = transformacioOrientacio(orientacio, img.width, img.height);
          let width = dreta.amplada;
          let height = dreta.alcada;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          const canvas = document.createElement('canvas');
          let dataUrl;
          try {
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('El navegador no ha pogut preparar la imatge.');

            // Fons transparent per si s'usa format PNG o similar
            ctx.clearRect(0, 0, width, height);
            /* Gauntlet 261016 (Bloc 1) · El JPEG no té transparència: sense fons,
               la part transparent d'un PNG eixiria negra. Blanc, com l'exportador
               del retall (imatgeCanvas.js). */
            if (format === 'image/jpeg') {
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, width, height);
            }
            // Amb 1, el drawImage de sempre; si no, girada i reduïda d'un sol cop.
            dibuixaDreta(ctx, img, orientacio, width, height);

            dataUrl = canvas.toDataURL(format, quality);
          } finally {
            /* Pla 261022_1645 · El canvas s'allibera en acabar, també si falla:
               Safari d'iOS compta la memòria de tots els canvas vius i, passat
               el sostre, en torna de buits (la cerca del pressupost en fa fins
               a set seguits). El data URL ja té els bytes; cap píxel canvia. */
            canvas.width = 0;
            canvas.height = 0;
          }
          /* Bloc 1.2 · ambExifDeLoriginal no rebutja mai: sense EXIF publicable, el mateix data URL.
             P1-64 · Amb `precisio`, la ubicació ja hi va arrodonida (ajustaPrecisioGps). */
          return conservaExif ? ambExifDeLoriginal(dataUrl, original || file, { precisio }) : dataUrl;
        })().then(resolve, reject);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Gauntlet 261016 (Bloc 1 i 1.2, Llei del Quadrat i mandat de l'EXIF) · Els
   bytes d'un fitxer com a data URL, sense tocar-los. Encàrrec 261018 · Viu
   ací (abans, a NotesEditor.jsx) perquè el Perfil també el fa servir. */
export function dataUrlDelFitxer(fitxer) {
  return new Promise((resol, rebutja) => {
    const lector = new FileReader();
    lector.onload = () => resol(String(lector.result));
    lector.onerror = () => rebutja(lector.error || new Error("No s'ha pogut llegir la imatge."));
    lector.readAsDataURL(fitxer);
  });
}

export const ERROR_IMATGE_LOCAL = 'Tria una imatge PNG, JPEG, WebP, GIF o AVIF de menys de 10 MB.';

/** En mode de proves (seed, local), una imatge es desa al navegador com a data
 * URL dels mateixos bytes, amb la mateixa validació per al Bloc i el Perfil. */
export async function imatgeLocalComDataUrl(fitxer) {
  if (!/^image\/(png|jpeg|webp|gif|avif)$/.test(fitxer?.type || '') || !(fitxer.size <= 10 * 1024 * 1024)) {
    throw new Error(ERROR_IMATGE_LOCAL);
  }
  return dataUrlDelFitxer(fitxer);
}
