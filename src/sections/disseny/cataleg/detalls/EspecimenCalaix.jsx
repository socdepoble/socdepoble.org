import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Dialeg } from '../../../../components/PedraSeca/index.js';
import { Accions, Boto } from '../../../../components/PedraSeca/index.js';
export default function EspecimenCalaix() {
  const [calaix, setCalaix] = useState(false);

  return (
    <>
    <Especimen id="calaix" nom="Calaix (Dialeg costat)" fitxer="src/components/PedraSeca/organismes/Dialeg.jsx"
        descripcio="Panell lateral per a filtres, índex o detalls secundaris. Mateix contracte que Dialeg."
        fes={['Filtres en mòbil, índex de secció.']} noFacis={['Navegació principal: això és la barra lateral de la closca (App.jsx), que fins a 1023px ja es fa calaix.']}>
      {/* IDEA-26 i IDEA-27 (ordre del Mestre, 261025) · El botó, dins d'Accions i
          sol a la caixa, que respira 24px per dalt i per baix. El calaix va
          fora: tancat no es veu, i un <dialog> germà desfaria el primer i
          l'últim fill de la caixa. */}
      <Accions>
        <Boto onClick={() => setCalaix(true)}>Obrir calaix de filtres</Boto>
      </Accions>
    </Especimen>
    <Dialeg obert={calaix} costat="dreta" onTanca={() => setCalaix(false)} titol="Filtres"
      accions={<Boto varietat="primari" ple onClick={() => setCalaix(false)}>Veure resultats</Boto>}>
      <p>Contingut del calaix.</p>
    </Dialeg>
    </>
  );
}
