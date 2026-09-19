import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Dialeg, DialegConfirmacio } from '../../../../components/PedraSeca/index.js';
import { Boto } from '../../../../components/PedraSeca/index.js';
import { Camp, CampText } from '../../../../components/PedraSeca/index.js';
import { Pista } from '../../../../components/PedraSeca/index.js';
import { Dropdown, DropdownItem } from '../../../../components/PedraSeca/index.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';

export default function EspecimenPista() {
  const { showToast } = useToast();
  return (
    <Especimen id="pista" nom="Pista (toggletip)" fitxer="src/components/PedraSeca/Pista.jsx"
        descripcio="Ajuda que es toca. Substituïx els tooltips de title=, que no existixen en pantalla tàctil."
        contracte={[['etiqueta', 'string', "'Ajuda'", 'Nom accessible del botó «?».'], ['children', 'node', '—', 'Text curt d’ajuda.']]}
        a11y={['aria-expanded al botó; el text s’anuncia en obrir.', 'Escape i tocar fora el tanquen.']}
        fes={['Frases curtes que expliquen un terme.']} noFacis={['Amagar ací informació imprescindible per a completar la tasca.']}>
      <p>Número de parcel·la <Pista etiqueta="Què és el número de parcel·la?">El trobaràs al rebut de l’IBI, a dalt a la dreta.</Pista></p>
    </Especimen>
  );
}
