import { useEffect } from 'react';
import { Navigate, useParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { resolveItemPath } from '../../config/navigation';
import { renderPageHtml } from './detailRichText.jsx';
import { sanitizeHtml } from '../../utils/sanitize';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useSEO } from '../../hooks/useSEO.js';

export default function PageDetailSection() {
  const { pageDetailLookup = new Map() } = useCoreContent() || {};
  const { t } = useUIActions();
  const { slug } = useParams();
  const item = pageDetailLookup.get(String(slug));

  useEffect(() => {
    const main = document.querySelector('.app-main') || document.querySelector('soc-de-poble')?.shadowRoot?.querySelector('.app-main');
    if (main) main.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [slug]);

  useSEO({
    title: item ? item.title : 'Pàgina',
    description: item ? item.post_subtitle || '' : '',
    image: item && Array.isArray(item.image_url) ? item.image_url[0] : null
  });

  if (!item) {
    return <Navigate to="/mur" replace />;
  }

  const knownPath = resolveItemPath(item);
  if (knownPath && knownPath !== `/page/${slug}`) {
    return <Navigate to={knownPath} replace />;
  }

  return (
    <UniversalPage
      title={item.title || t('section.text.page', 'Pàgina')}
      subtitle={item.post_subtitle || item.author || ''}
      chrome="system"
      showLogos={true}
    >
      <div className="detail-page">
        <div className="detail-hero card">
          {Array.isArray(item.image_url) && item.image_url[0] ? (
            <div className="media-frame media-frame--contain detail-hero__media">
              <img src={item.image_url[0]} alt={item.title || 'Pàgina'} decoding="async" />
            </div>
          ) : null}
          <div className="card__body">
            <ul className="sp-card-labels" aria-label="Categories">
              <li className="sp-card-label sdp-badge-system">{item.type || t('section.text.page', 'page')}</li>
              {item.slug && <li className="sp-card-label sdp-badge-tag">{item.slug}</li>}
            </ul>
            <h2 className="card__title">{item.title || t('section.text.page', 'Pàgina')}</h2>
            {item.post_subtitle ? <p className="section-item-card__subtitle">{item.post_subtitle}</p> : null}
            <article
              className="detail-content"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderPageHtml(item.content || '')) }}
            />
          </div>
        </div>
      </div>
    </UniversalPage>
  );
}
