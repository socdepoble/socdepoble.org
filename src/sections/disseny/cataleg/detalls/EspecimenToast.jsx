import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Dialeg, DialegConfirmacio } from '../../../../components/PedraSeca/index.js';
import { Boto } from '../../../../components/PedraSeca/index.js';
import { Camp, CampText } from '../../../../components/PedraSeca/index.js';
import { Pista } from '../../../../components/PedraSeca/index.js';
import { Dropdown, DropdownItem } from '../../../../components/PedraSeca/index.js';
import { showToast } from '../../../../components/universal/AvisadorEfimer.jsx';

export default function EspecimenToast() {
  return (
    <Especimen id="toast" nom="showToast (avís efímer)" fitxer="src/components/universal/AvisadorEfimer.jsx"
        descripcio="Confirmació que no demana acció. Si cal actuar, és una Alerta en línia o un Dialeg."
        contracte={[['showToast(missatge, tipus, durada)', "string, 'success'|'error'|…, ms", '3000', 'Crida imperativa.']]}
        fes={['«Nota desada».']} noFacis={['Errors que cal corregir en un toast que desapareix.']}>
      <Boto onClick={() => showToast('Nota desada', 'success')}>Mostrar un avís efímer</Boto>
    </Especimen>
  );
}
