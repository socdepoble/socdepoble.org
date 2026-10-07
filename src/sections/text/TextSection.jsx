import { UniversalPage } from '../../components/universal/UniversalPage';
import { MARCA_GRUP, segmentsAmbTargetes } from '../../components/universal/richText/extensions/targetes/formaDelGrup.js';
import { CosAmbTargetes } from '../../components/universal/richText/extensions/targetes/CosAmbTargetes.jsx';
import { sanitizeHtml } from '../../utils/sanitize';
/* T71 · les props de la pàgina viuen a paginaDeText.js: el lector de
   connexions del MAS pinta una pàgina de text amb les mateixes. */
import { propsDePaginaDeText } from './paginaDeText.js';
import { ProveidorSincronitzacioTargetes } from '../detail/SincronitzacioTargetes.jsx';

import { useUIActions } from '../../app/contexts/UIContext';
import { useSEO } from '../../hooks/useSEO';
import { resolveAsset, resolRecursosDeHtml } from '../../config/assetResolver.js';

/* Ordre del Mestre (261007) · El cos d'una pàgina de text amb targetes
   incrustades (un grup data-sdp-targetes de primer nivell: la de «Drets
   d'autor» dins de «Legal i privacitat», apartat 4) es llig pel MATEIX camí
   que les notes (renderRichText de sections/detail/detailRichText.jsx):
   segmentsAmbTargetes parteix l'HTML sanejat i CosAmbTargetes pinta cada
   targeta com la del Mur (UniversalCard). L'article conserva la seua classe
   de sempre, «cms-preview». Sense cap grup, el camí de sempre, byte a byte
   (Llei del Píxel). Ordre del Mestre (261007, «cards de veritat») · Les
   targetes es pinten sincronitzades amb el seu original
   (ProveidorSincronitzacioTargetes); la instantània, de reserva. */
function CosDeLaPagina({ html }) {
  if (String(html || '').includes(MARCA_GRUP)) {
    const segments = segmentsAmbTargetes(sanitizeHtml(resolRecursosDeHtml(html)));
    if (segments.some((segment) => segment.tipus === 'targetes')) {
      return (
        <ProveidorSincronitzacioTargetes>
          <CosAmbTargetes segments={segments} className="cms-preview" />
        </ProveidorSincronitzacioTargetes>
      );
    }
  }
  return <article className="cms-preview" dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(html)) }} />;
}

/* `children`: peces vives que van davall del text (el Tauler de Telemetria a
   /legal). El text continua sent HTML sanejat; els fills són React i no
   passen per dangerouslySetInnerHTML. Les imatges pròpies del text
   (src="/assets/…") es resolen en pintar-lo, amb la base de l'amfitrió.
   T8 (ordre del Mestre, 261004, prompt 261004_0515 §6) · `accioPrincipal`:
   l'acció gran de la pàgina, davall de l'H1 (la ranura de PageFrame). Només
   es passa quan n'hi ha: sense, les props de sempre, exactes.
   Ordre del Mestre (261007) ·
    · «Comentaris = xat» · Esta peça no passa cap Comentar propi: el de la
      barra blava és el menú de dues vies de totes les pàgines (PageFrame i
      useAccions), «En privat» (el xat privat amb Sóc de Poble) i «En públic»
      (el xat comú de la ruta on està la persona, si el contracte l'admet;
      si no, desactivat). Derogat el gestor propi del mateix dia, que
      saltava la via pública.
    · `onConnect` (proposta P4) · el Connectar propi d'una pàgina que es
      munta fora de la seua ruta (el document destacat de /xat). Com
      accioPrincipal, només es passa quan n'hi ha.
    · `objecte` (revisió del 261007, M3-10) · el descriptor de la pàgina
      quan es munta fora de la seua ruta: el xat públic de «En públic» és el
      de la pàgina, no el de la ruta on està la persona (/xat), el mateix
      destí que el seu Connectar. Com onConnect, només es passa quan n'hi ha. */
export default function TextSection({ page, pageKey, accioPrincipal = null, onConnect = null, objecte = null, children = null }) {
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
      {...(onConnect ? { onConnect } : null)}
      {...(objecte ? { objecte } : null)}
    >
      <CosDeLaPagina html={page.html} />
      {children}
    </UniversalPage>
  );
}
