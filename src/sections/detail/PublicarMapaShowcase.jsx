/**
 * PublicarMapaShowcase.jsx — P0-110 / IDEA-241 · Aparador viu i pedagògic de
 * `/page/publicar_mapa`, carregat exclusivament en diferit (`lazyRoute`) quan
 * la persona visita aquesta pàgina (0 B afegits al Nucli Verge).
 *
 * Conté dues peces:
 *   1. `PublicarMapaMapaShowcase`: visor interactiu `MapaFotografic` situat
 *      just entre el bloc blanc de l’H1 i l’H2 taronja (`abansIntro`), hidratat
 *      amb els 19 arbres singulars catalogats per l’Associació El Rentonar a
 *      La Torre de les Maçanes.
 *   2. `PublicarMapaExempleShowcase`: exemple real d’`UniversalCard` amb el
 *      quadrat verd `SquareBadge` Opció 1 (`type: 'geo'`) abans del segon botó
 *      blau `Publicar`, traduït en les 5 llengües del sistema.
 */
import { useMemo } from 'react';
import MapaFotografic from '../mur/MapaFotografic.jsx';
import { UniversalCard } from '../../components/PedraSeca/index.js';
import { useUIActionsOpcional } from '../../app/contexts/UIContext';
import { ARBRES_MONUMENTALS_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';
import { obteSeriePatrimoni } from '../../data/patrimoni/seriesPatrimoni.js';
import {
  AUTORIA_RENTONAR,
  AVATAR_RENTONAR,
  ITEMS_CATALEG_ARBRES_RENTONAR_WP,
  MAPA_ARBRES_RENTONAR_PER_ARBRE_ID,
  RUTA_PERFIL_RENTONAR
} from '../../data/importacio/catalegArbresRentonarWp.js';
/* D3 del Mestre (acta 261112_1400) · Grafia «Rodriguez» (font primària WP 619): el subtítol i els drets de la targeta
   d'exemple venen de la mateixa fulla que els drets de les 20 pàgines del llibre (DRETS_CATALEG_ARBRES). */
import { AUTOR_ESTUDI_ARBRES, DRETS_CATALEG_ARBRES } from '../text/pageContent.dretsPatrimoni.js';

const TEXTOS_EXEMPLE_5_LLENGUES = Object.freeze({
  ca: Object.freeze({
    ariaMapa: 'Mapa fotogràfic interactiu d’exemple amb el patrimoni arbori del poble',
    titolBloc: 'Exemple real de fitxa publicada al Mapa del poble',
    explicacio: 'Quan publiques un punt d’interés, una font, un camí o un arbre singular des del Bloc de Notes amb l’àmbit Mapa, la targeta mostra automàticament el quadrat verd d’ubicació (128×128 px) per obrir-lo amb un sol toc al Mapa del territori.',
    cardTitle: 'Llorer de Villa María · Laurus nobilis',
    cardSubtitle: `Arbre Emblemàtic d’Interés Local · Estudi tècnic: ${AUTOR_ESTUDI_ARBRES}`,
    cardBody: 'Exemplar monumental de llorer als jardins històrics de Villa María (La Torre de les Maçanes), protegit pel Ple municipal del 7 de setembre de 2007 a proposta de l’Associació El Rentonar.',
    etiqueta1: 'Mapa del territori',
    etiqueta2: 'Arbres emblemàtics'
  }),
  es: Object.freeze({
    ariaMapa: 'Mapa fotográfico interactivo de ejemplo con el patrimonio arbóreo del pueblo',
    titolBloc: 'Ejemplo real de ficha publicada en el Mapa del pueblo',
    explicacio: 'Cuando publicas un punto de interés, una fuente, un camino o un árbol singular desde el Bloc de Notas con el ámbito Mapa, la tarjeta muestra automáticamente el cuadrado verde de ubicación (128×128 px) para abrirlo con un solo toque en el Mapa del territorio.',
    cardTitle: 'Laurel de Villa María · Laurus nobilis',
    cardSubtitle: `Árbol Emblemático de Interés Local · Estudio técnico: ${AUTOR_ESTUDI_ARBRES}`,
    cardBody: 'Ejemplar monumental de laurel en los jardines históricos de Villa María (La Torre de les Maçanes), protegido por el Pleno municipal del 7 de septiembre de 2007 a propuesta de la Associació El Rentonar.',
    etiqueta1: 'Mapa del territorio',
    etiqueta2: 'Árboles emblemáticos'
  }),
  en: Object.freeze({
    ariaMapa: 'Interactive photographic map showcase featuring village heritage trees',
    titolBloc: 'Live example of a card published on the Village Map',
    explicacio: 'When you publish a landmark, spring, trail or heritage tree from the Notebook under the Map scope, the card automatically displays the 128×128 px green location badge so neighbours can jump straight to its exact spot on the territory map.',
    cardTitle: 'Villa María Bay Laurel · Laurus nobilis',
    cardSubtitle: `Local Heritage Tree · Technical study: ${AUTOR_ESTUDI_ARBRES}`,
    cardBody: 'Monumental bay laurel standing in the historic Villa María gardens (La Torre de les Maçanes), protected by the Municipal Council on 7 September 2007 at the proposal of Associació El Rentonar.',
    etiqueta1: 'Territory map',
    etiqueta2: 'Heritage trees'
  }),
  gl: Object.freeze({
    ariaMapa: 'Mapa fotográfico interactivo de exemplo co patrimonio arbóreo da vila',
    titolBloc: 'Exemplo real de ficha publicada no Mapa da vila',
    explicacio: 'Cando publicas un punto de interese, unha fonte, un camiño ou unha árbore senlleira dende o Bloc de Notas co ámbito Mapa, a tarxeta amosa automaticamente o cadrado verde de localización (128×128 px) para abrilo cun só toque no Mapa do territorio.',
    cardTitle: 'Loureiro de Villa María · Laurus nobilis',
    cardSubtitle: `Árbore Emblemática de Interese Local · Estudo técnico: ${AUTOR_ESTUDI_ARBRES}`,
    cardBody: 'Exemplar monumental de loureiro nos xardíns históricos de Villa María (La Torre de les Maçanes), protexido polo Pleno municipal do 7 de setembro de 2007 por proposta da Associació El Rentonar.',
    etiqueta1: 'Mapa do territorio',
    etiqueta2: 'Árbores senlleiras'
  }),
  eu: Object.freeze({
    ariaMapa: 'Herriko zuhaitz-ondarea erakusten duen argazki-mapa interaktiboa',
    titolBloc: 'Herriko Mapan argitaratutako fitxa baten adibide erreala',
    explicacio: 'Ohar-bloketik Mapa esparruarekin interesgune bat, iturri bat, bide bat edo zuhaitz berezi bat argitaratzen duzunean, txartelak automatikoki erakusten du kokapen-lauki berdea (128×128 px) lurraldeko mapan ukitu bakarrarekin irekitzeko.',
    cardTitle: 'Villa Maríako Erramua · Laurus nobilis',
    cardSubtitle: `Tokiko Intereseko Zuhaitz Enblematikoa · Azterlan teknikoa: ${AUTOR_ESTUDI_ARBRES}`,
    cardBody: 'Villa Maríako lorategi historikoetako erramu monumentala (La Torre de les Maçanes), Udalbatzak 2007ko irailaren 7an babestua Associació El Rentonar elkartearen proposamenez.',
    etiqueta1: 'Lurraldeko mapa',
    etiqueta2: 'Zuhaitz bereziak'
  })
});

function puntsArbresDelMapa() {
  const mapaFotos = new Map(ARBRES_MONUMENTALS_2020.map((a) => [a.id, a.fotos?.foto2007 || '']));
  return ITEMS_CATALEG_ARBRES_RENTONAR_WP
    .filter((item) => Boolean(item.arbreId))
    .map((item) => ({
      id: item.arbreId,
      type: 'patrimoni',
      ambit: 'mapa',
      visibility: 'public',
      title: `${item.nom} (${item.especieCientifica})`,
      author_name: AUTORIA_RENTONAR,
      image_url: mapaFotos.get(item.arbreId) || '/assets/uploads/patrimoni/arbres-monumentals-ibanez.webp',
      geolocalitzacio: {
        lat: item.lat,
        lng: item.lng,
        precisio: 'exacta',
        precisio_m: 10,
        origen: 'exif'
      },
      dataCaptura: '2007-05-19T10:00:00+02:00'
    }));
}

export function PublicarMapaMapaShowcase() {
  const ui = useUIActionsOpcional();
  const idioma = ui?.language || 'ca';
  const textos = TEXTOS_EXEMPLE_5_LLENGUES[idioma] || TEXTOS_EXEMPLE_5_LLENGUES.ca;
  const items = useMemo(() => puntsArbresDelMapa(), []);

  return (
    <section
      className="sdp-mapa-vertical-visor"
      data-testid="publicar-mapa-visor-interactiu"
      aria-label={textos.ariaMapa}
    >
      <MapaFotografic items={items} />
    </section>
  );
}

export function PublicarMapaExempleShowcase() {
  const ui = useUIActionsOpcional();
  const idioma = ui?.language || 'ca';
  const textos = TEXTOS_EXEMPLE_5_LLENGUES[idioma] || TEXTOS_EXEMPLE_5_LLENGUES.ca;
  const llorer = MAPA_ARBRES_RENTONAR_PER_ARBRE_ID['arbre-10-llorer-de-villa-maria'];
  const arbre2020 = ARBRES_MONUMENTALS_2020.find((a) => a.id === 'arbre-10-llorer-de-villa-maria');
  const serieArbres = obteSeriePatrimoni('arbres-emblematics');

  return (
    <section
      className="sdp-publicar-mapa-exemple"
      data-testid="publicar-mapa-exemple-card"
      aria-labelledby="publicar-mapa-exemple-titol"
    >
      <h3 id="publicar-mapa-exemple-titol">{textos.titolBloc}</h3>
      <p>{textos.explicacio}</p>
      <div className="sdp-card-grid">
        <UniversalCard
          dataTestId="publicar-mapa-universal-card-arbre"
          author={AUTORIA_RENTONAR}
          location="La Torre de les Maçanes"
          authorHref={RUTA_PERFIL_RENTONAR}
          avatarUrl={AVATAR_RENTONAR}
          avatarAlt={AUTORIA_RENTONAR}
          date="2007-05-19"
          dateTime="2007-05-19"
          showDateTime={true}
          imageUrl={arbre2020?.fotos?.foto2007 || '/assets/uploads/patrimoni/arbres-monumentals-ibanez.webp'}
          imageAlt={textos.cardTitle}
          imatgePrivada={true}
          title={textos.cardTitle}
          subtitle={textos.cardSubtitle}
          body={textos.cardBody}
          mainHref="/page/arbres-monumentals?item=arbre-10-llorer-de-villa-maria"
          copyright={DRETS_CATALEG_ARBRES}
          labels={[
            { text: textos.etiqueta1, href: '/mapa' },
            { text: textos.etiqueta2, href: serieArbres?.rutaApp || '/page/arbres-monumentals' }
          ]}
          squareBadge={{
            type: 'geo',
            lat: llorer.lat,
            lng: llorer.lng,
            zoom: 18,
            id: llorer.arbreId,
            nom: textos.cardTitle
          }}
        />
      </div>
    </section>
  );
}

export default PublicarMapaMapaShowcase;
