import { renderPostContent } from '../../detail/detailRichText.jsx';
import { cosDeLArticle, cosPerAPintar } from './cosCanonic.js';
import { MANIFEST_DE_POBLE_HTML } from './manifestDePobleContent.js';

export {
  MANIFEST_ADHESIO_URL, MANIFEST_PDF_URL, MANIFEST_PROPOSTES_URL, MANIFEST_SOURCE_URL
} from './manifestDePobleContent.js';

/** P0-26 / IDEA-97 · El Manifest (WP 16893) es pinta des del seu contingut:
 *  `item.content` (la llavor, o la versió editada des de /notes) i, si la
 *  còpia que arriba no porta HTML (app_content en text pla), el canònic de la
 *  llavor. La figura inicial és l'única imatge del logotip: la meta omet la
 *  Hero duplicada. L'embolcall .manifest-de-poble porta la maquetació de
 *  lectura (modules.css). */
export function ManifestDePobleArticle({ item = null } = {}) {
  return (
    <div className="manifest-de-poble">
      {renderPostContent(cosPerAPintar(cosDeLArticle(item, MANIFEST_DE_POBLE_HTML)))}
    </div>
  );
}
