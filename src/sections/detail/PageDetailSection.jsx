import { useEffect } from 'react';
import { Navigate, useParams } from '../../app/contexts/RouterContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { resolvePageSlugPath } from '../../config/navigation';
import { PAGE_COPY } from '../text/pageContent.js';
import TextSection from '../text/TextSection';
import NotFoundPage from '../../pages/NotFoundPage';

/**
 * /page/:slug — pàgines de text sense ruta pròpia.
 *
 * W01 (auditoria Codex 0717): abans llegia un `pageDetailLookup` que
 * CoreContentContext no ha exportat mai; el Map sempre era buit i tota
 * visita acabava redirigida al Mur. Ara, per ordre:
 *   1. slug amb ruta canònica (projecte, legal…) → redirecció a eixa ruta;
 *   2. pàgina del contingut core (o de PAGE_COPY) → TextSection canònica,
 *      amb la mateixa precedència que TextRoute (App.jsx);
 *   3. contingut encara carregant → estat de càrrega, mai una redirecció;
 *   4. res → 404 amb noindex (NotFoundPage), no un salt silenciós al Mur.
 */
export default function PageDetailSection() {
  const { slug = '' } = useParams();
  const { pages = [], pageCopy = {}, status } = useCoreContent();

  useEffect(() => {
    const main = document.querySelector('.app-main') || document.querySelector('soc-de-poble')?.shadowRoot?.querySelector('.app-main');
    if (main) main.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [slug]);

  const canonica = resolvePageSlugPath(slug);
  if (canonica) return <Navigate to={canonica} replace />;

  // El slug ve de la URL: només claus pròpies («constructor» no és cap pàgina).
  const propia = (taula) => (Object.hasOwn(taula, slug) ? taula[slug] : null);
  const page = propia(pageCopy)
    || pages.find((p) => p && (String(p.slug) === slug || String(p.id) === slug))
    || propia(PAGE_COPY);
  if (page) return <TextSection page={page} pageKey={slug} />;

  if (status !== 'ready' && status !== 'error') {
    return (
      <div className="sdp-app-loading" role="status" aria-live="polite">
        <div className="sdp-spinner sdp-spinner--large" />
        <span className="sr-only">S'està carregant el contingut...</span>
      </div>
    );
  }
  return <NotFoundPage />;
}
