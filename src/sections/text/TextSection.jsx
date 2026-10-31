import { UniversalPage } from '../../components/universal/UniversalPage';
import { MARCA_GRUP, segmentsAmbTargetes } from '../../components/universal/richText/extensions/targetes/formaDelGrup.js';
import { CosAmbTargetes } from '../../components/universal/richText/extensions/targetes/CosAmbTargetes.jsx';
import { useLlenguaDelContingut } from '../../components/universal/traduccio/llenguaDelContingut.js';
import { sanitizeHtml } from '../../utils/sanitize';
/* T71 · les props de la pàgina viuen a paginaDeText.js: el lector de
   connexions del MAS pinta una pàgina de text amb les mateixes. */
import { propsDePaginaDeText } from './paginaDeText.js';
import { ProveidorSincronitzacioTargetes } from '../detail/SincronitzacioTargetes.jsx';

import { useMemo } from 'react';
import { useUIActions } from '../../app/contexts/UIContext';
import { useSEO } from '../../hooks/useSEO';
import { resolveAsset, resolRecursosDeHtml } from '../../config/assetResolver.js';
import { esAppNativa } from '../../config/origenPublic.js';
/* Pla 261027_1154 (P1-61) · La imatge del <head>: el selector únic i la base
   del Supabase de la capa del paquet.
   Pla 261028_1526 (P1-61, Fase 2) · Títol, descripció i imatge ixen de
   metadadesDePagina, la mateixa funció que crida el prerender del build. */
import { CAP_SOCIAL_BASE } from '../../config/imatgeSocial.js';
import { metadadesDePagina } from '../../config/metadadesSocials.js';
/* Pla 261027_1154 (P1-61) · Les opcions d'urlSocialDe, les mateixes que
   detail/ItemDetailSection.jsx.
   Ordre del Mestre (30-10-2026, prompt 2208; SEO-CRIT-02) · Viuen a
   config/opcionsImatgeSocial.js: PluginPage, DesignSection i ConsolaSection
   les prenen d'allí, sense carregar este component. */
import { opcionsDeLaImatgeSocial } from '../../config/opcionsImatgeSocial.js';
/* Pla 261027_0845 (Guarda Nocturna), T1-06 · el text de les pàgines dins de
   l'app nativa, sense cap altra plataforma mòbil (regla 2.3.10 de l'App Store). */
import { htmlPerAppNativa, paginaPerAppNativa } from './perAppNativa.js';

/* Gauntlet 261030 (cicle 3, tc3-lang-ca-sobre-interficie-traduida) · Una
   etiqueta de PAGE_COPY que declara la seua llengua (PageFrame en posa el
   lang només si la interfície és en una altra): el mateix text, la mateixa
   classe i el mateix enllaç. */
const etiquetaEnValencia = (label) => {
  if (typeof label === 'string') return { text: label, lang: 'ca' };
  return label && typeof label === 'object' ? { ...label, lang: 'ca' } : label;
};

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
   de sempre, byte a byte.
   Gauntlet 261030 (cicle 3, tc3-lang-ca-sobre-interficie-traduida) · El cos
   és text de la pàgina: porta el lang que li dona PageFrame
   (useLlenguaDelContingut; només amb llenguaDelContingut i la interfície en
   una altra llengua). Sense, cap atribut. */
export function CosDeLaPagina({ html }) {
  const lang = useLlenguaDelContingut();
  const cos = esAppNativa() ? htmlPerAppNativa(html) : html;
  if (String(cos || '').includes(MARCA_GRUP)) {
    const segments = segmentsAmbTargetes(sanitizeHtml(resolRecursosDeHtml(cos)));
    if (segments.some((segment) => segment.tipus === 'targetes')) {
      return (
        <ProveidorSincronitzacioTargetes>
          <CosAmbTargetes segments={segments} className="cms-preview" lang={lang} />
        </ProveidorSincronitzacioTargetes>
      );
    }
  }
  return <article className="cms-preview" lang={lang} dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(cos)) }} />;
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
   plataforma mòbil. Fora de l'app, el mateix objecte.
   P1-46 (guàrdia nocturna 261030, Fase 3) · `etiquetaFinal`: una etiqueta més
   al final de la fila de davall de l'H1 (la pastilla de versió de
   /page/descarregues, detail/pastillaDeVersio.js): l'etiqueta o una funció
   que la torna amb el traductor d'ací (t). Com accioPrincipal, només es passa
   quan n'hi ha: sense, o si la funció torna null, les etiquetes de sempre. */
export default function TextSection({ page: original, pageKey, accioPrincipal = null, onConnect = null, objecte = null, etiquetaFinal = null, children = null }) {
  const page = useMemo(() => paginaPerAppNativa(original), [original]);
  const { t } = useUIActions();
  const etiquetaExtra = typeof etiquetaFinal === 'function' ? etiquetaFinal(t) : etiquetaFinal;
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
  const propsDeText = propsDePaginaDeText(page, pageKey, t);
  /* Gauntlet 261030 (cicle 3, tc3-lang-ca-sobre-interficie-traduida) · Les
     etiquetes de la pàgina (page.labels, PAGE_COPY) són en valencià: cada una
     ho declara i PageFrame en posa el lang amb la interfície en una altra
     llengua. Les de reserva (la clau i «Pàgina», amb t) i la pastilla final
     (etiquetaFinal, amb t) són de la interfície: tal qual. */
  const etiquetes = Array.isArray(page.labels) ? propsDeText.labels.map(etiquetaEnValencia) : propsDeText.labels;
  return (
    <UniversalPage
      {...propsDeText}
      labels={etiquetaExtra ? [...etiquetes, etiquetaExtra] : etiquetes}
      showLogos={true}
      chrome={page.chrome || 'full'}
      topBarData={{ showPin: false }}
      /* Gauntlet 261030 (Fase 3, TC3.3) · PAGE_COPY és sempre en valencià:
         amb la interfície en una altra llengua, l'H1, l'entradilla, l'alt de
         la portada i el cos en porten el lang (PageFrame ·
         llenguaDelContingut); els fills d'ací baix (botons de la interfície),
         no (cicle 3). */
      llenguaDelContingut="ca"
      {...(accioPrincipal ? { accioPrincipal } : null)}
      {...(onConnect ? { onConnect } : null)}
      {...(objecte ? { objecte } : null)}
    >
      <CosDeLaPagina html={page.html} />
      {children}
    </UniversalPage>
  );
}
