/**
 * tooling/patrimoni/mides-webp.mjs
 *
 * Les mides (ample i alt, en píxels) d'una imatge WebP, llegides de la capçalera RIFF sense descodificar-la.
 * Les usa genera-que-dinem.mjs per a escriure l'ample i l'alt de cada làmina del receptari «Què dinem?» (la làmina
 * de capçalera és la candidata a LCP de /receptes/:slug i no ha de moure la pàgina en carregar-se), i la prova de
 * les dades per a contrastar-les amb els fitxers. Admet els tres formats de WebP: VP8 (amb pèrdua), VP8L (sense
 * pèrdua) i VP8X (estés). Un fitxer que no siga WebP dona null: qui la crida decidix si això és un error.
 */
export function midesWebp(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const text = (des, n) => String.fromCharCode(...b.subarray(des, des + n));
  if (b.length < 30 || text(0, 4) !== 'RIFF' || text(8, 4) !== 'WEBP') return null;
  const u16 = (des) => b[des] | (b[des + 1] << 8);
  const u24 = (des) => b[des] | (b[des + 1] << 8) | (b[des + 2] << 16);
  switch (text(12, 4)) {
    case 'VP8 ':
      // Capçalera de fotograma clau: la marca 9d 01 2a i, darrere, l'ample i l'alt en 14 bits.
      if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
      return { ample: u16(26) & 0x3fff, alt: u16(28) & 0x3fff };
    case 'VP8L': {
      if (b[20] !== 0x2f) return null;
      const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return { ample: (bits & 0x3fff) + 1, alt: ((bits >>> 14) & 0x3fff) + 1 };
    }
    case 'VP8X':
      return { ample: u24(24) + 1, alt: u24(27) + 1 };
    default:
      return null;
  }
}
