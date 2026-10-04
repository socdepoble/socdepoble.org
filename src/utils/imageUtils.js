/**
 * Redueix una imatge utilitzant Canvas i la torna com a DataURL.
 * Per defecte utilitza el format WebP amb compressió agressiva per a
 * maximitzar l'estalvi d'espai a la base de dades sense perdre qualitat.
 *
 * PRIVACITAT (ADR multimèdia D4) · És la porta de TOTES les pujades d'imatge
 * (capçalera, avatar, logotip, ajust d'imatge i text enriquit): sempre torna a
 * codificar amb el canvas, i el resultat no porta l'EXIF ni el GPS de
 * l'original. No hi ha cap drecera (ni per mida, ni per format): no n'afegiu
 * cap sense la prova de imageUtils.test.js.
 *
 * @param {File} file L'arxiu d'imatge original
 * @param {Object} options Opcions de compressió
 * @param {number} options.maxSize Mida màxima en píxels de l'eix més llarg (600 per avatar/logo, 1200 per capçalera/hero)
 * @param {string} options.format Format d'eixida (per defecte: 'image/webp')
 * @param {number} options.quality Qualitat de compressió (de 0 a 1)
 * @returns {Promise<string>} Promesa que resol amb el DataURL (Base64)
 */
export function compressImage(file, { maxSize = 600, format = 'image/webp', quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Cap arxiu proporcionat'));

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      /* Onada 4 · revisió (K3) · Una excepció dins d'onload (sense context
         2D, un canvas tacat que toDataURL rebutja) el navegador només la
         reporta: sense este try, la promesa quedava penjada per sempre i qui
         puja, «pujant» per sempre. El camí bo no canvia. */
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

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
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('El navegador no ha pogut preparar la imatge.');

          // Fons transparent per si s'usa format PNG o similar
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL(format, quality));
        } catch (err) {
          reject(err);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}
