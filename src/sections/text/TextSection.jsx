import { UniversalPage } from '../../components/universal/UniversalPage';
import { sanitizeHtml } from '../../utils/sanitize';
/* T71 · les props de la pàgina viuen a paginaDeText.js: el lector de
   connexions del MAS pinta una pàgina de text amb les mateixes. */
import { propsDePaginaDeText } from './paginaDeText.js';

import { useUIActions } from '../../app/contexts/UIContext';
import { useSEO } from '../../hooks/useSEO';
import { resolveAsset, resolRecursosDeHtml } from '../../config/assetResolver.js';

/* `children`: peces vives que van davall del text (el Tauler de Telemetria a
   /legal). El text continua sent HTML sanejat; els fills són React i no
   passen per dangerouslySetInnerHTML. Les imatges pròpies del text
   (src="/assets/…") es resolen en pintar-lo, amb la base de l'amfitrió.
   T8 (ordre del Mestre, 261004, prompt 261004_0515 §6) · `accioPrincipal`:
   l'acció gran de la pàgina, davall de l'H1 (la ranura de PageFrame). Només
   es passa quan n'hi ha: sense, les props de sempre, exactes. */
export default function TextSection({ page, pageKey, accioPrincipal = null, children = null }) {
  const { t } = useUIActions();
  useSEO({
    title: page.title,
    description: page.subtitle || page.lead || 'Sóc de Poble',
    image: resolveAsset('/assets/system/ui/og-socdepoble-1200x630.png')
  });
  return (
    <UniversalPage
      {...propsDePaginaDeText(page, pageKey, t)}
      showLogos={true}
      chrome={page.chrome || 'full'}
      topBarData={{ showPin: false }}
      {...(accioPrincipal ? { accioPrincipal } : null)}
    >
      <article className="cms-preview" dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(page.html)) }} />
      {children}
    </UniversalPage>
  );
}
