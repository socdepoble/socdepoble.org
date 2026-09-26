import { UniversalPage } from '../../components/universal/UniversalPage';
import { COPYRIGHT_SDP, formatDate, formatTime } from '../../components/universal/editorial.js';
import { resolveAsset } from '../../config/assetResolver';
import { sanitizeHtml } from '../../utils/sanitize';

import { useUIActions } from '../../app/contexts/UIContext';
import { useSEO } from '../../hooks/useSEO';

/* `children`: peces vives que van davall del text (el Tauler de Telemetria a
   /legal). El text continua sent HTML sanejat; els fills són React i no
   passen per dangerouslySetInnerHTML. */
export default function TextSection({ page, pageKey, children = null }) {
  const { t } = useUIActions();
  useSEO({
    title: page.title,
    description: page.subtitle || page.lead || 'Sóc de Poble',
    image: '/assets/system/ui/og-socdepoble-1200x630.png'
  });
  return (
    <UniversalPage
      title={page.title}
      subtitle={page.subtitle}
      lead={page.lead}
      heroImage={resolveAsset(page.image || '/assets/img/hero_panoramic_rural_view_1774720664221.png')}
      heroAlt={page.imageAlt || "Panoràmica d'un poble fictici"}
      showLogos={true}
      labels={page.labels || [
        { text: pageKey.toUpperCase(), className: 'sdp-badge-system' },
        { text: t?.('section.text.page', 'Pàgina') || 'Pàgina', className: 'sdp-badge-category' }
      ]}
      copyright={COPYRIGHT_SDP}
      time={formatTime(page.date)}
      date={formatDate(page.date)}
      dateTime={page.date || ''}
      chrome={page.chrome || 'full'}
      topBarData={{ showPin: false }}
    >
      <article className="cms-preview" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.html) }} />
      {children}
    </UniversalPage>
  );
}
