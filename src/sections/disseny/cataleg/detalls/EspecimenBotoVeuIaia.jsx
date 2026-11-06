/**
 * EspecimenBotoVeuIaia.jsx — «🔊 Escolta la IAIA» (IDEA-108, onada R7). Pedra
 * Seca §9: l'espècimen és el component real, no una maqueta. Un botó
 * d'alternança que fa dir un text en veu alta; tornar-lo a prémer atura la veu.
 */
import { Especimen } from '../Especimen.jsx';
import { BotoVeuIaia } from '../../../../components/PedraSeca/index.js';

export default function EspecimenBotoVeuIaia() {
  return (
    <Especimen id="boto-veu-iaia" nom="BotoVeuIaia" fitxer="src/components/PedraSeca/molecules/BotoVeuIaia.jsx"
      descripcio="El botó «Escolta la IAIA»: fa dir en veu alta un text amb la veu de la IAIA. És un botó d’alternança (aria-pressed): mentre parla, tornar-lo a prémer atura la veu. Per defecte el text no ix del dispositiu; només el contingut públic demana el servei de veu. Si el navegador no té síntesi de veu, el botó queda desactivat i ho explica."
      contracte={[
        ['text', 'string', '—', 'El que s’ha de dir en veu alta.'],
        ['idioma', 'string', '—', 'Codi de llengua del text (per exemple «ca»).'],
        ['privat', 'boolean', 'true', 'Amb true el text no ix del dispositiu; false només per a contingut públic.'],
        ['varietat', 'string', "'secundari'", 'Varietat del Boto; mentre parla es pinta com a primari.'],
        ['className', 'string', '—', 'Classe addicional del Boto.']
      ]}
      a11y={[
        'Un botó natiu amb aria-pressed que diu si està parlant; el nom accessible no canvia («Escolta la IAIA»), l’emoji és decoratiu.',
        'Si no hi ha síntesi de veu o ha fallat la càrrega, el botó queda desactivat i un missatge amb role="status" ho explica (aria-describedby).'
      ]}
      fes={[
        'Posar-lo al costat del text que diu, amb privat={false} només si el contingut és públic.',
        'Aturar la veu en desmuntar la vista que l’ha iniciada.'
      ]}
      noFacis={[
        'Deixar privat per defecte a false amb text de l’usuari: eixiria del dispositiu.',
        'Fer servir la veu com a única via d’accés al contingut: el text ha de ser sempre visible.'
      ]}>
      <p><BotoVeuIaia text="Esta és la veu de la IAIA." idioma="ca" /></p>
    </Especimen>
  );
}
