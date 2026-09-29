import { useNavigate, Link } from '../../app/contexts/RouterContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useContent } from './ContentProvider';
import { PageFrame } from './PageFrame';
import { isSafeUrl, isValidDate } from './UniversalUtils';
import { rutaActual, urlPerCompartir, useUbicacioApp } from '../PedraSeca/hooks/useAccions.js';
import { objecteDePagina, rutaConnectarObjecte } from '../../config/objecteConnectable.js';

export function UniversalPage(props) {
  const { showToast } = useToast();
  const contentContext = useContent();
  const config = contentContext?.config || {};

  const navigate = useNavigate();
  /* C3 (260929) · On està l'app: el router, no la barra d'adreces, que dins
     d'un amfitrió és la de la pàgina amfitriona (useAccions.js). */
  const router = useUbicacioApp();

  const title = props.title ?? config.title;
  const actualTitleText = typeof title === 'string' ? title : '';
  
  // Ací no es compta el Connectar: PageFrame el passa per useAccions, que ja
  // el registra amb origen «pagina». Registrar-lo també ací en faria dos per clic.
  // T43 (ordre del Mestre, 260928) · D7: sense handler propi, la pàgina es
  // connecta com a objecte 'pagina' amb la ruta d'on està la persona (llegida
  // en el clic). D1: onConnect={false} vol dir «sense botó», i PageFrame ho
  // respecta amb showConnect={false}.
  const senseConnectar = props.onConnect === false;
  const handleConnect = senseConnectar ? null : (props.onConnect || (() => navigate(
    rutaConnectarObjecte(objecteDePagina({ titol: actualTitleText, ruta: rutaActual(router) }))
  )));
  const handleBack = props.onBack || (() => navigate(-1));
  const handleForward = props.onForward || (() => navigate(1));

  /* T63.2 (doctrina del Mestre, 260928) · Comentar obri el xat de la Pàgina
     Universal. Sense handler propi el decidix PageFrame → useAccions, una sola
     font: el de `objecte` (el descriptor tipat que passa la secció; null si
     ara no n'hi ha cap) o, sense, el xat comú de la 'pagina' d'on està la
     persona. onComment={false} vol dir «sense botó», com onConnect={false}. */
  const senseComentar = props.onComment === false;
  const handleTranslate = props.onTranslate || (() => navigate('/traduccions?item_id=' + encodeURIComponent(actualTitleText || 'page')));
  const handleShare = props.onShare || (() => {
    // En memòria, la URL de la ruta de l'app; fora de memòria, la barra d'adreces com sempre.
    const hrefDePagina = router?.memoria === true ? urlPerCompartir(undefined, router) : window.location.href;
    const safeHref = isSafeUrl(hrefDePagina) ? hrefDePagina : window.location.origin;
    if (navigator.share) {
      navigator.share({ title: title || document.title, url: safeHref }).catch(console.error);
    } else {
      navigator.clipboard.writeText(safeHref).then(() => {
        showToast('Enllaç copiat al porta-retalls');
      }).catch(console.error);
    }
  });

  const barDateTime = props.topBarData?.dateTime ?? props.dateTime ?? config.dateTime;
  const barDate = props.topBarData?.date ?? props.date ?? config.date;
  
  const handleDateTime = props.onDateTime || config.onDateTime || ((e) => {
    e.preventDefault();
    e.stopPropagation();
    let yyyymmdd;
    if (barDateTime) {
      yyyymmdd = barDateTime.split('T')[0];
    } else if (typeof barDate === 'string') {
      const parts = barDate.split('/');
      if (parts.length === 3) {
        let [dd, mm, yy] = parts;
        if (yy.length === 2) yy = '20' + yy;
        if (isValidDate(dd, mm, yy)) {
          yyyymmdd = `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
      } else {
        const d = new Date(barDate);
        if (!isNaN(d.getTime())) yyyymmdd = d.toISOString().split('T')[0];
      }
    }
    if (yyyymmdd) {
      navigate(`/mur?date=${encodeURIComponent(yyyymmdd)}`);
    } else {
      navigate('/mur');
    }
  });

  return (
    <PageFrame
      {...config}
      {...props}
      onConnect={handleConnect}
      showConnect={senseConnectar ? false : (props.showConnect ?? config.showConnect)}
      onBack={handleBack}
      onForward={handleForward}
      onTranslate={handleTranslate}
      onComment={senseComentar ? undefined : props.onComment}
      showComment={senseComentar ? false : (props.showComment ?? config.showComment)}
      onShare={handleShare}
      onDateTime={handleDateTime}
      LinkComponent={Link}
    />
  );
}
