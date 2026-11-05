/**
 * VideoEditorial.jsx — L'únic punt de l'App que pinta l'iframe d'un vídeo editorial.
 *
 *   · R12 de Codex, integrat al Bloc 4 de l'Onada R6. L'HTML que es desa mai
 *     no porta un iframe: el sanejador (utils/sanitize.js) el prohibix. El cos
 *     guarda un marcador inert, `<div data-sdp-youtube="ID" data-titol="…">`,
 *     amb un enllaç de reserva (richText/extensions/videoEditorial.js), i el
 *     complement declaratiu `video_youtube` de l'Aplec arriba com a dades.
 *   · Este component és qui convertix eixe id en un iframe: un id de YouTube
 *     (11 caràcters d'este alfabet) i un sol origen, el de YouTube sense galetes.
 *     Cap URL, cap altre amfitrió, cap atribut que vinga de l'HTML.
 */
import { useUIActionsOpcional } from '../../app/contexts/UIContext.jsx';
import { createTranslator } from '../../config/i18n.js';

export const ORIGEN_VIDEO_EDITORIAL = 'https://www.youtube-nocookie.com';
const FORMA_ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;
const MAXIM_TITOL = 200;
const T_PER_DEFECTE = createTranslator('ca');

/** Un id de YouTube té 11 caràcters de l'alfabet [A-Za-z0-9_-]. */
export const esIdVideoEditorial = (id) => typeof id === 'string' && FORMA_ID_YOUTUBE.test(id);

/** El títol accessible: text d'una línia, retallat; buit si no és text. */
export const titolDeVideoEditorial = (titol) => (typeof titol === 'string' ? titol.replace(/\s+/g, ' ').trim().slice(0, MAXIM_TITOL) : '');

/** El vídeo; sense un id vàlid, res (cap iframe buit ni cap origen alternatiu). */
export function VideoEditorial({ id, title }) {
  const t = useUIActionsOpcional()?.t || T_PER_DEFECTE;
  if (!esIdVideoEditorial(id)) return null;
  return (
    <iframe
      src={`${ORIGEN_VIDEO_EDITORIAL}/embed/${id}`}
      title={titolDeVideoEditorial(title) || t('editor.video.titolPerDefecte')}
      width="1080" height="608" loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
