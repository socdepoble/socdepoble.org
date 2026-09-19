import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Dialeg, DialegConfirmacio } from '../../../../components/PedraSeca/index.js';
import { Boto } from '../../../../components/PedraSeca/index.js';
import { Camp, CampText } from '../../../../components/PedraSeca/index.js';
import { Pista } from '../../../../components/PedraSeca/index.js';
import { Dropdown, DropdownItem } from '../../../../components/PedraSeca/index.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';

export default function EspecimenMenu() {
  const { showToast } = useToast();
  return (
    <Especimen id="menu" nom="Dropdown · DropdownItem" fitxer="src/components/PedraSeca/Dropdown.jsx"
        descripcio="Menú contextual. DEUTE: minWidth arriba com a estil en línia i no gestiona focus per fletxes; pendent de migrar a <dialog>       o popover."
        fes={['Accions secundàries d’un element.']} noFacis={['Navegació principal dins d’un menú flotant.']}>
        <Dropdown trigger={<button type="button" className="sdp-boto sdp-boto--secundari">Opcions de la nota</button>}>
          <DropdownItem>Fer pública</DropdownItem>
          <DropdownItem>Moure a carpeta</DropdownItem>
        </Dropdown>
    </Especimen>
  );
}
