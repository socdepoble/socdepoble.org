import { UniversalPage } from '../../components/universal/UniversalPage';
import { MARCA_GRUP, segmentsAmbTargetes } from '../../components/universal/richText/extensions/targetes/formaDelGrup.js';
import { CosAmbTargetes } from '../../components/universal/richText/extensions/targetes/CosAmbTargetes.jsx';
import { sanitizeHtml } from '../../utils/sanitize';
/* T71 · les props de la pàgina viuen a paginaDeText.js: el lector de
   connexions del MAS pinta una pàgina de text amb les mateixes. */
import { propsDePaginaDeText } from './paginaDeText.js';
import { ProveidorSincronitzacioTargetes } from '../detail/SincronitzacioTargetes.jsx';

import { useMemo } from 'react';
import { useUIActions } from '../../app/contexts/UIContext';
import { useSEO } from '../../hooks/useSEO';
import { resolveAsset, resolRecursosDeHtml } from '../../config/assetResolver.js';
import { esAppNativa, origenPublic } from '../../config/origenPublic.js';
/* Pla 261027_1154 (P1-61) · La imatge del <head>: el selector únic i la base
   del Supabase de la capa del paquet.
   Pla 261028_1526 (P1-61, Fase 2) · Títol, descripció i imatge ixen de
   metadadesDePagina, la mateixa funció que crida el prerender del build. */
import { CAP_SOCIAL_BASE } from '../../config/imatgeSocial.js';
import { metadadesDePagina } from '../../config/metadadesSocials.js';
import { capaDelPaquet } from '../../config/capaDelPaquet.js';
/* Pla 261027_0845 (Guarda Nocturna), T1-06 · el text de les pàgines dins de
   l'app nativa, sense cap altra plataforma mòbil (regla 2.3.10 de l'App Store). */
import { htmlPerAppNativa, paginaPerAppNativa } from './perAppNativa.js';

/* Pla 261027_1154 (P1-61) · Les opcions d'urlSocialDe, les mateixes que
   detail/ItemDetailSection.jsx: l'origen públic només si és https (el de dev,
   http://localhost, cau a socdepoble.org), la base del Supabase del paquet i
   cap origen de tercers permés. */
function opcionsDeLaImatgeSocial() {
  const origen = origenPublic();
  return {
    ...(/^https:\/\//i.test(String(origen || '')) ? { origen } : null),
    supabaseUrl: capaDelPaquet().supabaseUrl,
    permesos: []
  };
}

/* Ordre del Mestre (261007) · El cos d'una pàgina de text amb targetes
   incrustades (un grup data-sdp-targetes de primer nivell: la de «Drets
   d'autor» dins de «Legal i privacitat», apartat 4) es llig pel MATEIX camí
   que les notes (renderRichText de sections/detail/detailRichText.jsx):
   segmentsAmbTargetes parteix l'HTML sanejat i CosAmbTargetes pinta cada
   targeta com la del Mur (UniversalCard). L'article conserva la seua classe
   de sempre, «cms-preview». Sense cap grup, el camí de sempre, byte a byte
   (Llei del Píxel). Ordre del Mestre (261007, «cards de veritat») · Les
   targetes es pinten sincronitzades amb el seu original
   (ProveidorSincronitzacioTargetes); la instantània, de reserva.
   Grup E (261008) · Exportat: el lector del MAS (notes/PublicacioDetall.jsx)
   pinta el cos d'una pàgina del sistema pel mateix camí.
   Pla 261027_0845 (Guarda Nocturna), T1-06 · Dins de l'app nativa
   (esAppNativa), el cos passa abans per htmlPerAppNativa: cap altra plataforma
   mòbil ni cap altra botiga (perAppNativa.js). Ho fa per a tots els qui el
   pinten (TextSection, PublicacioDetall i PluginPage). Fora de l'app, l'HTML
   de sempre, byte a byte. */
export function CosDeLaPagina({ html }) {
  const cos = esAppNativa() ? htmlPerAppNativa(html) : html;
  if (String(cos || '').includes(MARCA_GRUP)) {
    const segments = segmentsAmbTargetes(sanitizeHtml(resolRecursosDeHtml(cos)));
    if (segments.some((segment) => segment.tipus === 'targetes')) {
      return (
        <ProveidorSincronitzacioTargetes>
          <CosAmbTargetes segments={segments} className="cms-preview" />
        </ProveidorSincronitzacioTargetes>
      );
    }
  }
  return <article className="cms-preview" dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(cos)) }} />;
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
      destí que el seu Connectar. Com onConnect, només es passa quan n'hi ha.
   Pla 261027_0845 (Guarda Nocturna), T1-06 · Dins de l'app nativa, la pàgina
   que es pinta (capçalera, descripció de useSEO i cos) és la de
   paginaPerAppNativa: el Full de ruta i l'Avís legal no hi nomenen cap altra
   plataforma mòbil. Fora de l'app, el mateix objecte. */
export default function TextSection({ page: original, pageKey, accioPrincipal = null, onConnect = null, objecte = null, children = null }) {
  const page = useMemo(() => paginaPerAppNativa(original), [original]);
  const { t } = useUIActions();
  /* Pla 261027_1154 (P1-61), Fase 1 (ordre del Mestre, 261027) · Abans, la
     targeta genèrica sempre. Ara og:image és la imatge que l'autor ha triat
     per a xarxes (og_image, o si no, featured_image; Llibre Mestre, P1-61) o,
     sense, la primera imatge pròpia de la pàgina (primeraImatgeSocial
     ('pagina'): page.image i, després, les del cos), ja absoluta i https. Els
     logotips no compten, ni el panorama que la pintura posa a una pàgina sense
     image (HERO_PER_DEFECTE): eixa pàgina, i una primera imatge que no es pot
     servir ('bloquejada'), porten la targeta genèrica de sempre
     (CAP_SOCIAL_BASE, OG-1). Una pàgina que nomena el panorama ella mateixa
     (/projecte) el porta: és la seua panoràmica (P1-60). La portada que es
     pinta no canvia (Llei del Píxel).
     Revisió adversarial (261027) · La triada viatja amb el seu alt: el de
     page.image (imageAlt) si és ella, i si no (la triada per l'autor o una
     foto del cos), el títol de la pàgina. Sense MIME ni mides: no es lligen
     dels bytes.
     Pla 261028_1526 (P1-61, Fase 2) · La regla viu a metadadesDePagina
     (config/metadadesSocials.js), compartida amb el prerender: la descripció
     és ara l'entradeta i, sense, el subtítol (decisió per defecte D6, igual
     al build), en text pla i amb el seu límit; el títol, també en text pla.
     Abans era el subtítol primer, i el head servit i el de l'app no deien el
     mateix. */
  const seo = useMemo(() => {
    const metadades = metadadesDePagina(page, opcionsDeLaImatgeSocial());
    return { ...metadades, image: metadades.image || resolveAsset(CAP_SOCIAL_BASE.image.url) };
  }, [page]);
  /* Revisió adversarial (261027) · Una pàgina muntada en context (chrome
     'context': el document destacat de la columna dreta del Xat) no és la de
     la ruta: el <head> és de qui la incrusta, i ella només n'és la reserva
     (fallback, la prioritat de RouteSEO). Abans es registrava com a vista i,
     des que la imatge depén de la pàgina, cada canvi de la seua foto (una
     còpia remota que arriba) la tornava a registrar darrere de SeoDelXat
     (XatSection.jsx), que només es remunta amb el títol o la descripció: la
     pestanya perdia «(N) Xat» i l'og:image era la foto del document. */
  const enContext = page.chrome === 'context';
  useSEO({
    title: seo.title,
    description: seo.description,
    image: seo.image,
    ...(enContext ? { fallback: true } : null)
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
