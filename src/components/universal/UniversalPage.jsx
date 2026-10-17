import { useContext, useId, useSyncExternalStore } from 'react';
import { ImageIcon, ImageOff } from 'lucide-react';
import { useNavigate, Link } from '../../app/contexts/RouterContext';
import { AppGridContext } from '../layout/AppGridShell';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useContent } from './ContentProvider';
import { ImatgeDePortada, PageFrame } from './PageFrame';
import { isSafeUrl } from './UniversalUtils';
import { rutaActual, urlPerCompartir, useUbicacioApp } from '../PedraSeca/hooks/useAccions.js';
import { usePastillaCalendari } from './barres/pastillaCalendari.js';
import { objecteDePagina, rutaConnectarObjecte } from '../../config/objecteConnectable.js';
import { STORAGE_PREFIX, delVal, getVal, setVal } from '../../config/storage';

/* ── P7-A · PORTADA PLEGABLE (directriu 261003_2320 del Mestre, «Hero Image
   Toggle»; Onada 4, setena passada) ──────────────────────────────────────
   Capacitat genèrica i OPCIONAL de la Pàgina Universal: amb
   portadaPlegable={{ clau, etiquetes? }} la portada (heroImage) es veu per
   defecte i un botó amb nom la plega i la desplega, per a guanyar espai
   vertical quan la pàgina és una eina de treball (Gestoria, TPV del Bar…;
   la Bàscula es va retirar per ordre del Mestre, 261007).
     · El botó va dins del marc de la portada (.hero-image), ABANS de la
       imatge: dalt a la dreta, damunt de la il·lustració quan es veu, i en una
       franja pròpia quan està plegada. No es mou de lloc, és el primer que
       troba el teclat després de la barra blava i també es veu en mòbil.
       (La T38, que amagava la barra taronja en mòbil, la va revertir el
       Mestre el 261004: ara tota pàgina la porta, PageFrame.jsx.)
     · Disclosure: aria-expanded i aria-controls cap al contenidor de la
       imatge, que plegat porta `hidden` (fora de la vista i de l'arbre
       accessible). El text diu el que farà: «Amaga la portada» / «Mostra la
       portada» (etiquetes.amaga / etiquetes.mostra per a traduir-lo).
     · L'estat és de qui mira i de cada clau: una sola clau de storage.js
       ('portades-plegades'), síncrona i xicoteta, que només guarda les
       plegades: { v: 1, plegades: { 'plugin:gestoria': true } }. Desplegar-la
       l'esborra. Si l'emmagatzematge no respon (mode privat, quota), el canvi
       val igual en esta càrrega. L'esdeveniment `storage` la sincronitza entre
       pestanyes; dins de la pestanya, totes les pàgines amb la mateixa clau
       van a una (useSyncExternalStore).
     · Cap transició ni animació: no hi ha res que prefers-reduced-motion haja
       d'aturar.
   Sense la prop, amb una clau invàlida, sense imatge o amb un heroComponent
   propi (l'editor), PageFrame rep exactament el mateix que abans (Llei del
   Píxel). */
export const CLAU_PORTADES = 'portades-plegades';
const VERSIO_PORTADES = 1;
const PATRO_CLAU_PORTADA = /^[a-z0-9][a-z0-9:_-]{0,63}$/;
const PORTADES_BUIDES = Object.freeze({ v: VERSIO_PORTADES, plegades: Object.freeze({}) });
const ETIQUETES_PORTADA = Object.freeze({ amaga: 'Amaga la portada', mostra: 'Mostra la portada' });

let portadesEnMemoria = null;
const oientsPortades = new Set();

const esObjectePla = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const esClauDePortada = (clau) => typeof clau === 'string' && PATRO_CLAU_PORTADA.test(clau);

/* Només claus vàlides amb el valor `true`; la resta es descarta. */
function normalitzaPortades(cru) {
  if (!esObjectePla(cru) || cru.v !== VERSIO_PORTADES || !esObjectePla(cru.plegades)) return PORTADES_BUIDES;
  const plegades = {};
  for (const [clau, valor] of Object.entries(cru.plegades)) if (esClauDePortada(clau) && valor === true) plegades[clau] = true;
  return Object.freeze({ v: VERSIO_PORTADES, plegades: Object.freeze(plegades) });
}

function llegeixPortades() {
  if (portadesEnMemoria === null) portadesEnMemoria = normalitzaPortades(getVal(CLAU_PORTADES, null));
  return portadesEnMemoria;
}

function subscriuPortades(oient) {
  oientsPortades.add(oient);
  const finestra = globalThis.window;
  /* Una altra pestanya ha canviat la clau (o ho ha buidat tot: key null). */
  const enStorage = (event) => {
    const clau = event?.key ?? null;
    if (clau !== null && clau !== STORAGE_PREFIX + CLAU_PORTADES) return;
    portadesEnMemoria = null;
    oient();
  };
  finestra?.addEventListener('storage', enStorage);
  return () => {
    oientsPortades.delete(oient);
    finestra?.removeEventListener('storage', enStorage);
  };
}

function desaPortadaPlegada(clau, plegada) {
  if (!esClauDePortada(clau)) return;
  const plegades = { ...llegeixPortades().plegades };
  if (plegada) plegades[clau] = true;
  else delete plegades[clau];
  portadesEnMemoria = normalitzaPortades({ v: VERSIO_PORTADES, plegades });
  if (Object.keys(portadesEnMemoria.plegades).length) setVal(CLAU_PORTADES, portadesEnMemoria);
  else delVal(CLAU_PORTADES);
  for (const oient of [...oientsPortades]) oient();
}

/** Només per a proves: oblida la còpia en memòria (no toca l'emmagatzematge). */
export function _reiniciaPortades() {
  portadesEnMemoria = null;
}

const textDe = (valor, reserva) => (typeof valor === 'string' && valor.trim() ? valor : reserva);

function PortadaPlegable({ clau, imatge, alt, etiquetes }) {
  const portades = useSyncExternalStore(subscriuPortades, llegeixPortades, llegeixPortades);
  const idImatge = `sdp-portada-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const visible = portades.plegades[clau] !== true;
  const Icona = visible ? ImageOff : ImageIcon;
  return (
    <>
      <div className={visible ? 'sdp-portada__barra' : 'sdp-portada__barra sdp-portada__barra--plegada'}>
        <button
          type="button"
          className="sdp-boto sdp-boto--secundari sdp-portada__boto"
          aria-expanded={visible}
          aria-controls={idImatge}
          onClick={() => desaPortadaPlegada(clau, visible)}
        >
          <Icona size={20} aria-hidden="true" focusable="false" />
          <span>{visible ? textDe(etiquetes?.amaga, ETIQUETES_PORTADA.amaga) : textDe(etiquetes?.mostra, ETIQUETES_PORTADA.mostra)}</span>
        </button>
      </div>
      <div id={idImatge} hidden={!visible}>
        <ImatgeDePortada alt={alt} src={imatge} />
      </div>
    </>
  );
}

/* La topBarData amb la portada plegable, o null si la pàgina no la demana
   (o no hi ha cap portada que plegar): llavors no es toca res. */
function topBarAmbPortada(props, config) {
  const opcio = props.portadaPlegable;
  if (!esObjectePla(opcio) || !esClauDePortada(opcio.clau)) return null;
  const topBarData = props.topBarData ?? config.topBarData ?? {};
  if (topBarData.heroComponent) return null;
  const imatge = topBarData.heroImage ?? props.heroImage ?? config.heroImage;
  if (!imatge) return null;
  const alt = topBarData.heroAlt ?? props.heroAlt ?? config.heroAlt ?? '';
  return {
    ...topBarData,
    heroComponent: <PortadaPlegable clau={opcio.clau} imatge={imatge} alt={alt} etiquetes={opcio.etiquetes} />
  };
}

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
     s'està escrivint.
     Auditoria 261007 (B) · Sense cap consulta: el ?item_id= que s'hi posava no
     el llig ningú (TranslationsSection no mira la URL) i, a l'editor, el títol
     és un element i no un text, així que sempre valia 'page'. */
  const handleTranslate = props.onTranslate || (props.accionsInoperatives
    ? () => navigate('/traduccions')
    : undefined);
  const handleShare = props.onShare || (() => {
    // En memòria, la URL de la ruta de l'app; fora de memòria, la barra d'adreces com sempre.
    const hrefDePagina = router?.memoria === true ? urlPerCompartir(undefined, router) : window.location.href;
    const safeHref = isSafeUrl(hrefDePagina) ? hrefDePagina : window.location.origin;
    if (navigator.share) {
      /* Gauntlet 261017 (Bloc 0.1) · Tancar el menú de compartir (AbortError)
         no és cap error, com en compartix (PedraSeca/hooks/useAccions.js). */
      navigator.share({ title: title || document.title, url: safeHref }).catch((error) => {
        if (error?.name !== 'AbortError') console.error(error);
      });
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

  /* P7-A · Amb portadaPlegable (i una portada), la topBarData porta el marc
     plegable; sense, cap prop canvia. */
  const ambPortada = topBarAmbPortada(props, config);

  return (
    <PageFrame
      {...config}
      {...props}
      {...(ambPortada ? { topBarData: ambPortada } : null)}
      /* Barra taronja universal (ordre del Mestre, 261004) · L'única via
         d'excepció (senseBarraTaronja) és una prop explícita de la pàgina, i
         només amb `true`. La config del ContentProvider, que s'escampa
         damunt, no la pot apagar: ací es torna a escriure des de les props. */
      senseBarraTaronja={props.senseBarraTaronja === true}
      /* Logotip de l'entitat (norma del Mestre, 261004) · El mateix patró:
         l'única excepció (senseLogo) és una prop explícita de la pàgina, i
         només amb `true`. Ni la config del ContentProvider ni topBarData la
         poden posar: ací es torna a escriure des de les props. */
      senseLogo={props.senseLogo === true}
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
