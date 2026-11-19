import { Especimen } from '../Especimen.jsx';
import { Dropdown, DropdownItem } from '../../../../components/PedraSeca/index.js';

export default function EspecimenMenu() {
  return (
    <Especimen id="menu" nom="Dropdown · DropdownItem" fitxer="src/components/PedraSeca/molecules/Dropdown.jsx"
        descripcio="Menú contextual amb navegació per fletxes (ArrowDown/ArrowUp/Home/End), tancament LIFO amb Escape (useCapaEnrere), retorn de focus al disparador i amplada per variable CSS sense estils en línia."
        fes={['Accions secundàries d’un element.']} noFacis={['Navegació principal dins d’un menú flotant.']}>
        <Dropdown trigger={<button type="button" className="sdp-boto sdp-boto--secundari">Opcions de la nota</button>}>
          <DropdownItem>Fer pública</DropdownItem>
          <DropdownItem>Moure a carpeta</DropdownItem>
        </Dropdown>
    </Especimen>
  );
}
