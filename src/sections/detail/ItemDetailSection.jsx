import { useLocation, useNavigate, useParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useMur } from '../../sections/mur/MurContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useNotesData } from '../../sections/notes/NotesDataContext';
import { useMultimedia } from '../../sections/multimedia/MultimediaContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { buildDetailSectionMeta } from './detailSectionMeta.jsx';
import { useSEO } from '../../hooks/useSEO.js';
import { objecteDe, rutaConnectarObjecte, tipusDeSeccio } from '../../config/navigation.js';
import { paginaDElement, trobaElement } from './elementDeSeccio.js';

export default function ItemDetailSection() {
  const { events, feedPosts, marketItems } = useMur();
  const { towns } = useCoreContent();
  const { notes } = useNotesData();
  const { mediaItems } = useMultimedia();
  const { t } = useUIActions();
  const { sectionId, itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const SECTION_META = buildDetailSectionMeta({ events, feedPosts, marketItems, mediaItems, notes, towns, t });
  const section = SECTION_META[sectionId];
  /* T54 · el mateix resolvedor que el diàleg Connectar i el lector del MAS. */
  const fallbackItem = trobaElement(section, itemId);
  const item = location.state?.preloadedItem || fallbackItem;

  /* Enxufe universal (260929) · Ací hi havia window.scrollTo({ top: 0 }). A
     Sóc de Poble el document no llisca mai (base.css: html, body, #root i
     .sdp-root amb overflow: hidden; només llisca la columna activa), així que
     a socdepoble.org no feia res, i dins d'un amfitrió (WordPress, Sollutia)
     pujava la finestra de l'amfitrió. Tornar a dalt la columna en canviar
     d'element seria un comportament nou a socdepoble.org (Llei del Píxel). */

  useSEO({
    title: item ? section?.getTitle?.(item) : 'No trobat',
    description: item ? item.entradilla || section?.getSubtitle?.(item) : '',
    image: item ? section?.getImage?.(item) : null
  });

  if (!section || !item) {
    /* T63.2 · Sense element no hi ha xat (ni el de la ruta, que s'enduria el
       títol «Element no trobat»): Comentar es queda i el clic avisa. Una nota
       (/notes/:id, també mentre es carreguen) no en té mai i no es pinta. */
    const senseElement = tipusDeSeccio(sectionId) === 'nota' ? objecteDe({ id: itemId }, sectionId) : null;
    return (
      <UniversalPage
        title={t('section.detail.noFound.title', 'Element no trobat')}
        subtitle={t('section.detail.noFound.subtitle', 'L’enllaç no apunta a cap element existent.')}
        labels={[{ text: 'Error', className: 'sdp-badge-system' }]}
        chrome="system"
        objecte={senseElement}
      >
        <div className="content-wrapper">
          <button type="button" className="sdp-boto sdp-boto--primari" onClick={() => navigate(section?.listPath || '/xat')}>
            {t('common.back', 'Torna')}
          </button>
        </div>
      </UniversalPage>
    );
  }

  /* Lògica d'Usuari (T5): Connectar s'emporta secció, element i autoria
     perquè la nota del MAS sàpia d'on ve. T63.2 · el mateix descriptor diu on
     porta Comentar: el xat comú de l'element; una nota (/notes/:id) no en té
     i el botó no es pinta. El xat porta el nom propi de l'element (el de la
     seua targeta), no l'encapçalament de la pàgina: el d'un poble és «Sella»,
     no «Gent de Sella», entre per on s'entre. */
  const objecte = objecteDe({ ...item, title: section.getTitle(item) || item.title }, sectionId);
  const objecteXat = { ...objecte, titol: objecteDe(item, sectionId).titol || objecte.titol };

  return (
    <UniversalPage
      onConnect={() => navigate(rutaConnectarObjecte(objecte))}
      objecte={objecteXat}
      /* T54 · títol, foto, drets (T39), autoria (T4) i data (T40): les mateixes
         props que pinta el lector de connexions del MAS (elementDeSeccio.js). */
      {...paginaDElement(section, item)}
      showLogos={true}
      chrome="full"
    >
      <div className="content-wrapper">
        {section.renderBody(item)}
      </div>
    </UniversalPage>
  );
}
