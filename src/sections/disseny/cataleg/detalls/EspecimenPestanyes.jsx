import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { FileText, Images, History } from 'lucide-react';
import { Pestanyes } from '../../../../components/PedraSeca/index.js';
import { MollaPa, Paginacio } from '../../../../components/PedraSeca/index.js';
import { Accordion, AccordionItem } from '../../../../components/PedraSeca/index.js';

export default function EspecimenPestanyes() {
  return (
    <Especimen id="pestanyes" nom="Pestanyes" fitxer="src/components/PedraSeca/Pestanyes.jsx"
        descripcio="Vistes germanes del mateix objecte (un poble: general, fotos, història). Substituïx la maqueta de <div class='tab'>       , que no rebia focus."
        contracte={[           ['pestanyes', '{ id, etiqueta, icona?, contingut }[]', '[]', 'Pestanyes i panells.'],
          ['activa / onCanvi', 'string / (id) => void', 'primera', 'Opcional: mode controlat.'],
          ['etiqueta', 'string', '—', 'Nom del tablist.'],
        ]}
        a11y={['role tablist/tab/tabpanel amb aria-controls.', '←/→ i Inici/Fi; focus itinerant (només l’activa és tabulable).', 'Indicador de 4px, no només color.']}
        fes={['2–6 pestanyes curtes.']} noFacis={['Pestanyes per a passos seqüencials (usa un assistent).', 'Pestanyes que naveguen a altres rutes (usa enllaços).']}>
        <Pestanyes etiqueta="Fitxa del poble" pestanyes={[
          { id: 'general', etiqueta: 'General', icona: FileText, contingut: <p>La Torre de les Maçanes, l’Alcoià. 700 habitants.</p> },
          { id: 'fotos', etiqueta: 'Fotografies', icona: Images, contingut: <p>Fototeca del poble.</p> },
          { id: 'historia', etiqueta: 'Història', icona: History, contingut: <p>Memòria dels Fadrins i de l’èxode.</p> },
        ]} />
    </Especimen>
  );
}
