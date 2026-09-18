import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Camp, CampText, AreaText, Selector, Casella, GrupOpcions, GrupCamps, Interruptor, Boto, Alerta, PillToggle, UniversalSearch } from '../../../../components/PedraSeca/index.js';

export default function EspecimenOpcions() {
  const [avisos, setAvisos] = useState(false);
  return (
    <Especimen id="opcions" nom="Casella · GrupOpcions · Interruptor · GrupCamps" fitxer="src/components/PedraSeca/formulari.jsx"
        descripcio="Casella: decisió que es confirma després. Interruptor: efecte immediat. Ràdios sempre dins d’un fieldset amb llegenda."
        contracte={[           ['Casella.etiqueta / ajuda', 'node', '—', 'Tota la fila és clicable.'],           ['GrupOpcions.opcions', '{ valor, etiqueta, ajuda? }[]', '[]', 'Ràdios natius; fletxes per teclat.'],
          ['GrupOpcions.valor / onCanvi', 'string / (valor) => void', '—', 'Controlat.'],
          ['Interruptor.actiu / onCanvi', 'boolean / (bool) => void', 'false', 'role="switch", estat en text Sí/No.'],
        ]}
        a11y={['fieldset + legend: el lector llig la pregunta abans de cada opció.', 'Zona tàctil de 44px per fila.', 'L’interruptor diu «Sí/No» en text.']}
        fes={['Interruptor per a ajustos que s’apliquen al moment.']}
        noFacis={['Un interruptor dins d’un formulari amb botó «Desar».', 'Ràdios solts sense fieldset.']}>
        <Casella etiqueta="Vull rebre el butlletí del poble" ajuda="Un correu al mes, com a molt." />
        <GrupOpcions llegenda="Mida de la lletra" valor="gran" onCanvi={() => {}} opcions={[{ valor: 'normal', etiqueta: 'Normal' }, { valor: 'gran', etiqueta: 'Gran' }, { valor: 'molt', etiqueta: 'Molt gran' }]} />
        <Interruptor etiqueta="Avisos del mercat" actiu={avisos} onCanvi={setAvisos} />
    </Especimen>
  );
}
