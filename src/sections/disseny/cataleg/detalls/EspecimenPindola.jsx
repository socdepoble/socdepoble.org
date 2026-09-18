import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Camp, CampText, AreaText, Selector, Casella, GrupOpcions, GrupCamps, Interruptor, Boto, Alerta, PillToggle, UniversalSearch } from '../../../../components/PedraSeca/index.js';

export default function EspecimenPindola() {
  const [vista, setVista] = useState('cards');
  return (
    <Especimen id="pindola" nom="PillToggle" fitxer="src/components/PedraSeca/PillToggle.jsx"
        descripcio="Selector de píndola: N opcions, una activa. Per a canviar la VISTA d’un contingut, no per a filtrar dades."
        contracte={[['opcions', '{ valor, etiqueta }[]', '[]', 'Opcions.'], ['valor / onCanvi', 'string / fn', '—', 'Controlat; onCanvi també sobre l’opció activa.'], ['etiqueta', 'string', '—', 'Nom del grup.']]}
        a11y={['role="group" + aria-pressed; l’estat actiu es pinta des de l’ARIA.']}
        fes={['2–4 opcions curtes.']} noFacis={['Usar-lo com a pestanyes (no hi ha tabpanel).']}>
      <PillToggle etiqueta="Vista" valor={vista} onCanvi={setVista} opcions={[{ valor: 'cards', etiqueta: 'Targetes' }, { valor: 'llista', etiqueta: 'Llista' }]} />
    </Especimen>
  );
}
