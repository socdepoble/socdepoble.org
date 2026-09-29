import { UniversalPage } from '../../components/universal/UniversalPage';
import { sanitizeHtml } from '../../utils/sanitize';
/* T71 · les props de la pàgina viuen a paginaDeText.js: el lector de
   connexions del MAS pinta una pàgina de text amb les mateixes. */
import { propsDePaginaDeText } from './paginaDeText.js';

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
      {...propsDePaginaDeText(page, pageKey, t)}
      showLogos={true}
      chrome={page.chrome || 'full'}
      topBarData={{ showPin: false }}
    >
      <article className="cms-preview" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.html) }} />
      {children}
    </UniversalPage>
  );
}
