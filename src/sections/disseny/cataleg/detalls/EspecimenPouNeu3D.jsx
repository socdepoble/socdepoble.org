/** Gauntlet 261107 · IDEA-143 R31: espècimen del pou de neu 3D. */
import { Especimen } from '../Especimen.jsx';
import PouDeLaNeuAnatomiaCard from '../../../../components/patrimoni/PouDeLaNeuAnatomiaCard.jsx';

export default function EspecimenPouNeu3D() {
  return <Especimen id="pou-neu-3d" nom="Pou de la Neu · Anatomia 3D"
    fitxer="src/components/patrimoni/PouDeLaNeuAnatomiaCard.jsx"
    descripcio="IDEA-143 · Set assemblatges de revolució, secció oberta i lectura física estimada. Les cotes de disseny de l’R31 són 11,20 m de fondària i 8,40 m de diàmetre; no substituïxen les fonts històriques del Rentonar."
    contracte={[
      ['language', 'ca | es | en | eu | gl', 'llengua de la interfície', 'Traduïx tota la targeta.'],
      ['noWebgl', 'boolean', 'false', 'Manté tota la geometria SVG sense la capa de fenòmens.'],
      ['initialExploded', 'boolean', 'false', 'Presenta la vista desmuntada d’entrada.']
    ]}
    a11y={['Botons natius, controls etiquetats i lectura numèrica viva.', 'Moviment reduït i absència de WebGL mantenen tots els controls operatius.']}
  ><PouDeLaNeuAnatomiaCard /></Especimen>;
}
