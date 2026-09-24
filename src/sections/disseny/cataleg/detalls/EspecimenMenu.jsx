import { Especimen } from '../Especimen.jsx';
import { Dropdown, DropdownItem } from '../../../../components/PedraSeca/index.js';

export default function EspecimenMenu() {
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
