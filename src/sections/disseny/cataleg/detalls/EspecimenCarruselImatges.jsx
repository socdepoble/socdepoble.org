/**
 * EspecimenCarruselImatges.jsx — el carrusel de la portada (ordre del Mestre,
 * 261007: «aquest producte té 8 imatges. Implementa un carrusel a la imatge
 * principal d'aquesta pàgina universal perquè l'usuari puga passar les
 * fotos»). Pedra Seca §9: l'espècimen abans de la producció. Quatre fotos de
 * la samarreta de Sóc de Poble (la xica primer, com a la seua pàgina) i el cas
 * d'una sola foto, que és la portada de sempre. A l'app el munta
 * ItemDetailSection a la ranura de la portada de PageFrame.
 */
import { Especimen } from '../Especimen.jsx';
import { CarruselImatges, Centre } from '../../../../components/PedraSeca/index.js';
import { resolveAsset } from '../../../../config/assetResolver.js';

const CARPETA = '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble';
const FOTOS = [
  '01-chica-jersey.png',
  '02-samarreta-socdepoble-roly-plom-oscur-1024px.png',
  '05-samarreta-socdepoble-muntanya.jpg',
  '07-rustic-detail.png'
].map((fitxer) => ({ src: resolveAsset(`${CARPETA}/${fitxer}`), alt: 'Samarreta Sóc de Poble' }));

export default function EspecimenCarruselImatges() {
  return (
    <Especimen id="carrusel-imatges" nom="CarruselImatges" fitxer="src/components/PedraSeca/organismes/CarruselImatges.jsx"
      descripcio="Les fotos d’un element a la portada de la Pàgina Universal. Una pista horitzontal amb scroll-snap: cada foto ocupa l’amplada sencera, en quadrat, i es passa amb el dit, la roda o el trackpad, sense cap llibreria. Damunt, dos botons redons als costats i el comptador «1 / N» a baix. La primera foto és la portada: no es pinta dues vegades. Amb una sola foto, la imatge tal qual, sense controls."
      contracte={[
        ['imatges', '[{ src, alt }] | string[]', '—', 'Les fotos, en ordre i amb el src ja resolt. La primera és la principal (sense loading="lazy"); la resta es carreguen quan s’hi arriba. Les que no porten src es descarten. Sense cap, no pinta res.'],
        ['etiqueta', 'string', "'Imatges'", 'El nom del carrusel per al lector: «Imatges de …».'],
        ['etiquetes', '{ anterior, seguent, diapositives, posicio, carrusel, diapositiva }', "'Imatge anterior' · 'Imatge següent' · 'Diapositives' · 'Imatge {n} de {total}' · 'carrusel' · 'diapositiva'", 'Els textos per al lector, ja traduïts per qui el munta (la peça no llig cap context): el nom dels dos botons, el de la pista, la plantilla de la posició de cada diapositiva i del comptador, i els dos aria-roledescription.'],
        ['className', 'string', '—', 'Classes de més per a l’arrel.']
      ]}
      a11y={[
        'El patró Carousel de l’APG: una secció amb nom i aria-roledescription="carrusel"; cada diapositiva, un grup amb aria-roledescription="diapositiva" i el nom «Imatge X de N».',
        'El comptador és una regió viva educada: en canviar de foto diu «Imatge 2 de 8». Cap rotació automàtica.',
        'Les fletxes esquerra i dreta passen les fotos (amb la volta), Inici i Fi porten a la primera i a l’última, des de la pista o des dels botons. La pista rep el focus perquè es desplaça.',
        'Els botons tenen l’àrea tàctil de --sdp-touch. Amb moviment reduït, el pas salta en lloc de lliscar.'
      ]}
      fes={[
        'Passar-lo a la ranura de la portada de PageFrame (topBarData.heroComponent) quan l’element té més d’una foto.',
        'Posar com a primera foto la principal de l’element, la mateixa de la seua targeta.',
        'Resoldre els src (resolveAsset) abans de passar-los: la peça no sap res d’amfitrions.'
      ]}
      noFacis={[
        'Pintar la portada i, a més, el carrusel amb la mateixa foto: la primera diapositiva ja és la portada.',
        'Posar-hi el logotip de qui ven o el seu avatar com a foto: no és cap foto del producte.',
        'Fer-lo girar sol o amagar els botons: les fotos les passa qui mira.'
      ]}>
      <h4>Quatre fotos, la primera és la portada</h4>
      <Centre>
        <CarruselImatges imatges={FOTOS} etiqueta="Imatges de la Samarreta Sóc de Poble" />
      </Centre>
      <h4>Una sola foto: la portada de sempre, sense controls</h4>
      <Centre>
        <CarruselImatges imatges={FOTOS.slice(0, 1)} />
      </Centre>
    </Especimen>
  );
}
