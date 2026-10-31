/**
 * pastillaDeVersio.js · P1-46 (Llibre Mestre, Fita 10: «una pastilla o cita
 * clara amb la versió actual que enllace directament a la pàgina de Versions
 * del Sistema»; guàrdia nocturna 261030, Fase 3, P1Y) · La pastilla de
 * /page/descarregues: una etiqueta més de la fila de davall de l'H1 (les
 * `labels` de PageFrame, la mateixa peça que «Sistema · Descàrregues ·
 * Multiplataforma»), amb la versió canònica (config/versio.js, una sola font)
 * i un enllaç a /versions.
 *
 * Només la versió de veres, cap promesa: la decisió més nova del Mestre
 * sobre les botigues (canalsDeBotiga.js) diu que no es pinta cap
 * «pròximament», i la pastilla no en porta. El cos de la pàgina (PAGE_COPY)
 * no canvia ni un byte: l'empremta de la frontissa continua valent.
 *
 * El text diu què és («Versió 1.0.0») i no només la xifra: és també el nom
 * de l'enllaç (WCAG 2.4.4), i «v1.0.0» sol no deia on porta. Amb el build
 * segellat, « (build aammdd)», com versioCanonica().
 *
 * Pur: sense React ni xarxa. Qualsevol altra pàgina, null (cap etiqueta).
 */
import { BUILD_SISTEMA, VERSIO_SISTEMA } from '../../config/versio.js';
import { resolvePageSlugPath } from '../../config/navigation.js';

/* La clau de la pàgina del sistema que porta la pastilla (SYSTEM_PAGES). */
export const PAGINA_DE_LA_PASTILLA = 'descarregues';

/* El segell del build: sis xifres (aammdd), el de versio.js. */
const SEGELL = /^\d{6}$/;

/**
 * L'etiqueta de PageFrame ({ text, className, href }) de la pàgina `clau`,
 * o null si no és Descàrregues. `t` és el traductor de la interfície.
 * @param {string} clau
 * @param {(clau: string, reserva: string) => string} [t]
 * @param {string|null} [build]
 * @returns {{ text: string, className: string, href: string }|null}
 */
export function pastillaDeVersio(clau, t, build = BUILD_SISTEMA) {
  if (clau !== PAGINA_DE_LA_PASTILLA) return null;
  const nom = (typeof t === 'function' && t('section.text.versio', 'Versió')) || 'Versió';
  const segell = typeof build === 'string' && SEGELL.test(build) ? ` (build ${build})` : '';
  return { text: `${nom} ${VERSIO_SISTEMA}${segell}`, className: 'sdp-badge-tag', href: resolvePageSlugPath('versions') };
}
