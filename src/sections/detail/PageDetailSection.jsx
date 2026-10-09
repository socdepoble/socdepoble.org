import { Navigate, useParams } from '../../app/contexts/RouterContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { resolvePageSlugPath } from '../../config/navigation';
import { accioDeLaPagina } from '../../config/systemPages.js';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { PAGE_COPY } from '../text/pageContent.js';
import TextSection from '../text/TextSection';
import NotFoundPage from '../../pages/NotFoundPage';
import { PublicarDeLaPagina } from '../control/PublicarDeLaPagina.jsx';
import { destiDePagina } from '../control/destinsControl.js';

/* Ordre del Mestre (261007) · L'acció gran d'una pàgina del sistema
   (accioDeLaPagina de systemPages.js): «Anar al xat» a /page/xat. És la
   MATEIXA porta que la seua targeta del Mur i del Calendari, la gran i blava
   de Pedra Seca (PortaDePagina: sdp-boto--primari sdp-boto--gran), un Link
   del router cap a /xat. Traduïx el verb aquí dins: només es munta quan la
   pàgina en té. */
function AccioDeLaPagina({ clau }) {
  const { t } = useUIActions();
  const porta = accioDeLaPagina(clau, t);
  return porta ? <PortaDePagina porta={porta} /> : null;
}

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
 *
 * P6 (directriu 261003_2325, confirmació 4) · Les sis pàgines de la doble
 * acció del Panell acaben amb el gran botó «Publicar» (PublicarDeLaPagina,
 * pel punt d'extensió `children` de TextSection). La resta, sense res més.
 *
 * T8 (ordre del Mestre, 261004, prompt 261004_0515 §6) · Les pàgines amb
 * destí porten el mateix botó també dalt, davall de l'H1 (accioPrincipal de
 * PageFrame, per TextSection). Es decidix amb destiDePagina(slug), pura, i
 * mai amb l'element: un <PublicarDeLaPagina/> que pinta null és un element
 * vertader, i PageFrame pintaria un div.page-title-accio buit a TOTES les
 * /page/*. El de baix es conserva.
 *
 * Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») ·
 * Derogat per l'ordre del Mestre del 261004: l'efecte que, en canviar de
 * slug, buscava '.app-main' pel document (o pel shadowRoot de
 * <soc-de-poble>) i el pujava a dalt. Era codi mort: .app-main no es
 * desplaça, i App.jsx ja torna a dalt el desplaçador en una navegació de
 * router (preparaRecolocacio). Dins de WordPress, a més, consultava el
 * document de l'amfitrió i obria el shadow root des de fora.
 *
 * Ordre del Mestre (261007) · «El Xat» (/page/xat) porta davall de l'H1 el
 * gran botó «Anar al xat» cap a /xat (accioPrincipal), el mateix de la seua
 * targeta. Com el de Publicar, es decidix amb una funció pura
 * (accioDeLaPagina), mai amb l'element.
 */
export default function PageDetailSection() {
  const { slug = '' } = useParams();
  const { pages = [], pageCopy = {}, status } = useCoreContent();

  const canonica = resolvePageSlugPath(slug);
  if (canonica) return <Navigate to={canonica} replace />;

  // El slug ve de la URL: només claus pròpies («constructor» no és cap pàgina).
  const propia = (taula) => (Object.hasOwn(taula, slug) ? taula[slug] : null);
  const page = propia(pageCopy)
    || pages.find((p) => p && (String(p.slug) === slug || String(p.id) === slug))
    || propia(PAGE_COPY);
  if (page) {
    let accioPrincipal = null;
    if (destiDePagina(slug)) accioPrincipal = <PublicarDeLaPagina clau={slug} lloc="dalt" />;
    else if (accioDeLaPagina(slug)) accioPrincipal = <AccioDeLaPagina clau={slug} />;
    return (
      <TextSection page={page} pageKey={slug} accioPrincipal={accioPrincipal}>
        <PublicarDeLaPagina clau={slug} />
      </TextSection>
    );
  }

  if (status !== 'ready' && status !== 'error') {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">S'està carregant el contingut...</span>
      </div>
    );
  }
  return <NotFoundPage />;
}
