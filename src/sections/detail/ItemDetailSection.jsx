import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useMur } from '../../sections/mur/MurContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useNotesData } from '../../sections/notes/NotesDataContext';
import { useMultimedia } from '../../sections/multimedia/MultimediaContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { getSectionItemPath } from '../../config/navigation';
import { buildDetailSectionMeta } from './detailSectionMeta.jsx';
import { useSEO } from '../../hooks/useSEO.js';

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
  const fallbackItem = section && section.items ? section.items.find(i => String(i.id) === String(itemId) || String(i.slug) === String(itemId)) : null;
  const item = location.state?.preloadedItem || fallbackItem;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [sectionId, itemId]);

  useSEO({
    title: item ? section?.getTitle?.(item) : 'No trobat',
    description: item ? item.entradilla || section?.getSubtitle?.(item) : '',
    image: item ? section?.getImage?.(item) : null
  });

  if (!section || !item) {
    return (
      <UniversalPage
        title={t('section.detail.noFound.title', 'Element no trobat')}
        subtitle={t('section.detail.noFound.subtitle', 'L’enllaç no apunta a cap element existent.')}
        labels={[{ text: 'Error', className: 'sdp-badge-system' }]}
        chrome="system"
      >
        <div className="content-wrapper">
          <button type="button" className="sdp-boto sdp-boto--primari" onClick={() => navigate(section?.listPath || '/xat')}>
            {t('common.back', 'Torna')}
          </button>
        </div>
      </UniversalPage>
    );
  }

  const items = section.items || [];
  const currentIndex = items.findIndex((entry) => String(entry.id) === String(item.id));
  const previous = currentIndex > 0 ? items[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1] : null;
  const image = section.getImage(item);
  const subtitle = section.getSubtitle(item);

  return (
    <UniversalPage
      title={section.getTitle(item)}
      subtitle={subtitle}
      lead={item.entradilla}
      heroImage={image}
      heroAlt={section.getTitle(item)}
      showLogos={true}
      labels={[
        { text: section.label, className: 'sdp-badge-system' },
        { text: item.id, className: 'sdp-badge-category' }
      ]}
      copyright="© Sóc de Poble / Fet per la IAIA i Nano Banana"
      authorName={item.author_name}
      authorLocation={item.author_location || item.location}
      authorAvatar={item.author_avatar || item.avatar_url || item.avatarUrl}
      time={item.time || (item.created_at ? new Date(item.created_at).toLocaleTimeString('ca-ES', {hour: '2-digit', minute: '2-digit'}) : undefined)}
      date={item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString('ca-ES') : undefined)}
      chrome="full"
    >
      <div className="content-wrapper">
        {section.renderBody(item)}
      </div>
    </UniversalPage>
  );
}
