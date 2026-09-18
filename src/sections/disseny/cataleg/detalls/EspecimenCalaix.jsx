import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Dialeg, DialegConfirmacio } from '../../../../components/PedraSeca/index.js';
import { Boto } from '../../../../components/PedraSeca/index.js';
import { Camp, CampText } from '../../../../components/PedraSeca/index.js';
import { Pista } from '../../../../components/PedraSeca/index.js';
import { Dropdown, DropdownItem } from '../../../../components/PedraSeca/index.js';
import { showToast } from '../../../../components/universal/AvisadorEfimer.jsx';
export default function EspecimenCalaix() {
  const [calaix, setCalaix] = useState(false);

  return (
    <Especimen id="calaix" nom="Calaix (Dialeg costat)" fitxer="src/components/PedraSeca/Dialeg.jsx"
        descripcio="Panell lateral per a filtres, índex o detalls secundaris. Mateix contracte que Dialeg."
        fes={['Filtres en mòbil, índex de secció.']} noFacis={['Navegació principal: això és la barra lateral de l’UniversalShell.']}>
      <Boto onClick={() => setCalaix(true)}>Obrir calaix de filtres</Boto>
        <Dialeg obert={calaix} costat="dreta" onTanca={() => setCalaix(false)} titol="Filtres"
          accions={<Boto varietat="primari" ple onClick={() => setCalaix(false)}>Veure resultats</Boto>}>
          <p>Contingut del calaix.</p>
        </Dialeg>
    </Especimen>
  );
}
