import { useContext } from 'react';
import { useNavigate, Link } from '../../app/contexts/RouterContext';
import { AppGridContext } from '../layout/AppGridShell';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useContent } from './ContentProvider';
import { PageFrame } from './PageFrame';
import { isSafeUrl } from './UniversalUtils';
import { rutaActual, urlPerCompartir, useUbicacioApp } from '../PedraSeca/hooks/useAccions.js';
import { usePastillaCalendari } from './barres/pastillaCalendari.js';
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
  /* MD (ordre del Mestre, 261003) · Mestre-detall en mòbil: dins d'una closca
     que l'oferix (estret, amb el detall a la vista i la secció que l'activa),
     la fletxa torna al panell d'on es venia. Un onBack propi continua manant;
     sense closca, o en ample i en mitja, l'historial de sempre. */
  const graella = useContext(AppGridContext);
  const handleBack = props.onBack || graella?.tornaDelDetall || (() => navigate(-1));
  const handleForward = props.onForward || (() => navigate(1));

  /* T63.2 (doctrina del Mestre, 260928) · Comentar obri el xat de la Pàgina
     Universal. Sense handler propi el decidix PageFrame → useAccions, una sola
     font: el de `objecte` (el descriptor tipat que passa la secció; null si
     ara no n'hi ha cap) o, sense, el xat comú de la 'pagina' d'on està la
     persona. onComment={false} vol dir «sense botó», com onConnect={false}. */
  const senseComentar = props.onComment === false;
  /* Traductor Sobirà (ordre del Mestre, 260930 · via B) · En lectura, sense
     handler propi, Traduir obri el menú de llengües: ho decidix PageFrame →
     useAccions (useTraduccioPagina). Només l'editor (accionsInoperatives,
     T36) continua portant a /traduccions: traduir-lo substituiria el cos que
     s'està escrivint. */
  const handleTranslate = props.onTranslate || (props.accionsInoperatives
    ? () => navigate('/traduccions?item_id=' + encodeURIComponent(actualTitleText || 'page'))
    : undefined);
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
  const barTime = props.topBarData?.time ?? props.time ?? config.time;

  /* Ordre del Mestre, 261001 (tasca 4) · En lectura, la pastilla de la barra
     taronja porta al Calendari en el MES que pinta (/calendari?mes=AAAA-MM,
     mes local), no al filtre del Mur, i el seu nom accessible ho diu. La data
     es llig amb el lector únic (barres/pastillaCalendari.js → editorial.js):
     la còpia d'ací passava tota data que no fóra «dd/mm/aa» per
     toISOString(), en UTC. Un onDateTime propi continua manant, amb el nom de
     sempre. */
  const alCalendari = usePastillaCalendari({ time: barTime, date: barDate, dateTime: barDateTime });
  const onDateTimePropi = props.onDateTime || config.onDateTime;
  const handleDateTime = onDateTimePropi || alCalendari.onClick;
  const nomPastilla = onDateTimePropi ? undefined : alCalendari.etiqueta;

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
      dateTimeLabel={nomPastilla}
      LinkComponent={Link}
    />
  );
}
