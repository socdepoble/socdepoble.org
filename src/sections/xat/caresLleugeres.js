/**
 * caresLleugeres.js — P1-70 (marató nocturna 261101, T5.2) · Les cares del
 * xat es pinten de 24 a 80 px (Avatar: xs 24 · sm 32 · md 44 · lg 56 · xl 80),
 * i la de Javi Llinares arribava a cada fila amb la foto de perfil de 1200 px
 * (252 KB en JPEG). Ací, la seua foto de perfil es canvia per la miniatura de
 * 256 × 256 (AGENTS_MAP.JAVI.avatar_miniatura): la MATEIXA foto sencera, sense
 * cap retall, i per això la cara es veu igual (Llei del Píxel).
 *
 * Quins camins són la seua foto de perfil, sempre la mateixa imatge i el
 * mateix enquadrament (comprovat amb les mides i el contingut, 261101):
 *   · la del catàleg (AGENTS_MAP.JAVI.avatar_url) i la seua bessona .webp, que
 *     és la que porta el catàleg remot (supabase/seed.sql);
 *   · les còpies que porten el port de producció i el padró remot
 *     (uploads/gent/javi-llinares/avatars/ i uploads/avatars/, també .webp),
 *     les mateixes que el cens declara còpies (censImatges.js · EXCLOSES).
 * Qualsevol altre valor (una foto pujada, una URL, la cara d'una altra
 * persona) torna tal qual. Només el xat la demana (CaraXat): la fitxa, el
 * perfil i la resta de pantalles continuen amb la foto gran.
 * Pur: cap React ni cap xarxa.
 */
import { AGENTS_MAP } from '../../data/agentsSeed.js';

/** Els camins de la foto de perfil de Javi que el xat pinta amb la miniatura. */
export const FOTOS_DE_PERFIL_DE_JAVI = Object.freeze([
  AGENTS_MAP.JAVI.avatar_url,
  '/assets/fotos/javi-llinares-perfil-1200px.webp',
  '/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.jpg',
  '/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.webp',
  '/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1600px.webp',
  '/assets/uploads/avatars/javi-llinares-foto_perfil-01.jpg',
  '/assets/uploads/avatars/javi-llinares-foto_perfil-01.webp'
]);

const MINIATURES = new Map(FOTOS_DE_PERFIL_DE_JAVI.map((src) => [src, AGENTS_MAP.JAVI.avatar_miniatura]));

/** La cara que pinta el xat per a `src`: la miniatura si és la foto de perfil de Javi; si no, `src` tal qual. */
export function caraLleugera(src) {
  if (typeof src !== 'string') return src;
  return MINIATURES.get(src.trim()) ?? src;
}
