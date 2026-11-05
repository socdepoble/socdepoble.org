import { renderRichText } from '../../detail/detailRichText.jsx';
import { VideoEditorial } from '../../../components/universal/VideoEditorial.jsx';
import { cosDeLArticle, cosPerAPintar } from './cosCanonic.js';
import { APLEC_2023_HTML, APLEC_VIDEO } from './aplec2023Content.js';

/* Un id de YouTube té 11 caràcters d'este alfabet: el valor ve de la llavor o
   del payload d'app_content i fa de tros d'una URL d'iframe. */
const FORMA_ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

/** El complement declaratiu del vídeo (`video_youtube: { id, titol }`): el de
 *  l'element si té la forma bona; si no, el canònic de l'Aplec. */
export function videoDeLAplec(item) {
  const video = item?.video_youtube;
  if (video && typeof video.id === 'string' && FORMA_ID_YOUTUBE.test(video.id)) {
    return { id: video.id, titol: typeof video.titol === 'string' && video.titol.trim() ? video.titol.trim() : APLEC_VIDEO.titol };
  }
  return APLEC_VIDEO;
}

/** P0-26 / IDEA-97 · El 2n Aplec pel Territori (WP 16880) es pinta des del seu
 *  contingut: `item.content` (la llavor, o la versió editada des de /notes)
 *  i, si la còpia que arriba no porta HTML (app_content sense cos), el
 *  canònic de la llavor. Damunt, el reportatge de NTC (YouTube nocookie),
 *  l'única peça que no pot viure a l'HTML. Les fotos de la galeria obrin el
 *  visor de l'App (que ofereix l'enllaç de la imatge); un <a> al voltant les
 *  trauria del visor (ordre del Mestre, 30-10-2026, T4.2). */
export function Aplec2023Article({ item = null } = {}) {
  const video = videoDeLAplec(item);
  return (
    <div className="aplec-2023">
      <div className="aplec-2023__video">
        <VideoEditorial id={video.id} title={video.titol} />
      </div>
      {renderRichText(cosPerAPintar(cosDeLArticle(item, APLEC_2023_HTML)))}
    </div>
  );
}
