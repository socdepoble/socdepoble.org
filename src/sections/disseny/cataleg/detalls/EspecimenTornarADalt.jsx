import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import { BotoTornarADalt } from '../../../../components/PedraSeca/atoms/BotoTornarADalt.jsx';

/* Ordre del Mestre (261012, vespre) · «Afig un botó suau de "Tornar a dalt"
   (Scroll to top) a la part inferior dreta (damunt de 'Pobles') per a
   facilitar la navegació». Pedra Seca §9: la peça existix ací abans que la
   closca la munte. Ací es pinta en el flux de l'espècimen: la posició fixa
   damunt de «Pobles» és de la closca (layout.css, `.sdp-root.is-compact >
   .sdp-tornar-dalt`), no de l'àtom. Les mostres no desplacen res. */
const SENSE_ACCIO = () => {};

export default function EspecimenTornarADalt() {
  return (
    <>
      <Llinatge id="tornar-dalt" />
      <Especimen id="tornar-dalt" nom="Tornar a dalt" fitxer="src/components/PedraSeca/atoms/BotoTornarADalt.jsx"
        descripcio="Botó redó i suau que porta a dalt el contingut que s’està llegint. En compacte (fins a 1023px) la closca el pinta damunt de la casella «Pobles» de la barra inferior quan el visor ha baixat més d’una pantalla i les barres es veuen, en pujar. Mai mentre es llig cap avall, ni al final del recorregut (hi taparia l’última fila, que ja no es pot baixar més), ni amb un peu ancorat a baix («Desar autoria», el compositor del Xat). En escriptori no es pinta."
        contracte={[
          ['onPuja', 'function', '—', 'El clic. La closca hi passa pujaADalt (useBarresAmbScroll): el desplaçador actiu torna a dalt i el focus va al <main>.'],
          ['etiqueta', 'string', "'Tornar a dalt'", 'Nom accessible del botó (aria-label).']
        ]}
        a11y={[
          '<button type="button"> natiu amb nom accessible («Tornar a dalt»); la fletxa és decorativa (aria-hidden).',
          'Objectiu tàctil de --sdp-touch (48px), vora de --sdp-vora-control (3,66:1, WCAG 1.4.11) i l’anell de focus de :focus-visible.',
          'En prémer, el focus va al <main> (el mateix destí que en canviar de ruta): el botó desapareix en arribar a dalt i el focus no cau al body.',
          'Amb moviment reduït el salt és instantani i l’aparició només fa la fosa.'
        ]}
        fes={[
          'Només en compacte, damunt de «Pobles», per davall de la barra inferior i del vel (--z-fab).',
          'Aparéixer quan el visor ha baixat més d’una pantalla i les barres es veuen.'
        ]}
        noFacis={[
          'Pintar-lo en escriptori: per damunt de 1023px la pantalla no canvia (Llei del Píxel).',
          'Deixar-lo davall del dit mentre es llig cap avall: amb les barres amagades no hi és.',
          'Tapar l’última fila al final del recorregut o un peu ancorat a baix: allà no es pinta.',
          'Desar la posició del scroll a localStorage o a sessionStorage: viu en memòria.'
        ]}>
        <div className="sdp-especimen__fila">
          <BotoTornarADalt onPuja={SENSE_ACCIO} />
          <BotoTornarADalt onPuja={SENSE_ACCIO} etiqueta="Tornar a l’inici del document" />
        </div>
      </Especimen>
    </>
  );
}
