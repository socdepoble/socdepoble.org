/** Gauntlet 261107 · IDEA-143 R31: espècimen del pou de neu 3D. */
import { Especimen } from '../Especimen.jsx';
import PouDeLaNeuAnatomiaCard from '../../../../components/patrimoni/PouDeLaNeuAnatomiaCard.jsx';

export default function EspecimenPouNeu3D() {
  return <Especimen id="pou-neu-3d" nom="Pou de la Neu · Anatomia 3D"
    fitxer="src/components/patrimoni/PouDeLaNeuAnatomiaCard.jsx"
    descripcio="IDEA-143 · Set assemblatges de revolució, secció oberta i lectura física estimada. Les cotes són les del pou del Rentonar segons Josep Mª Segura Martí (1987): 13,75 m de fondària fins a les finestres, 9,80 m de diàmetre interior i mur d’1,50 m; el túnel sud i la galeria de desguàs es dibuixen interromputs."
    contracte={[
      ['language', 'ca | es | en | eu | gl', 'llengua de la interfície', 'Traduïx tota la targeta.'],
      ['noWebgl', 'boolean', 'false', 'Manté tota la geometria SVG sense la capa de fenòmens.'],
      ['initialExploded', 'boolean', 'false', 'Presenta la vista desmuntada d’entrada.']
    ]}
    a11y={['Botons natius, controls etiquetats i lectura numèrica viva.', 'Moviment reduït i absència de WebGL mantenen tots els controls operatius.']}
  ><PouDeLaNeuAnatomiaCard /></Especimen>;
}
