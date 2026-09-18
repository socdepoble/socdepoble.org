import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { FileText, Images, History } from 'lucide-react';
import { Pestanyes } from '../../../../components/PedraSeca/index.js';
import { MollaPa, Paginacio } from '../../../../components/PedraSeca/index.js';
import { Accordion, AccordionItem } from '../../../../components/PedraSeca/index.js';

export default function EspecimenPaginacio() {
  const [pagina, setPagina] = useState(1);
  return (
    <Especimen id="paginacio" nom="Paginacio" fitxer="src/components/PedraSeca/navegacio.jsx"
        descripcio="Llistes llargues servides per pàgines (lligat a les RPC paginades per cursor de la Fase 2). Mai scroll infinit."
        contracte={[['pagina', 'number', '—', 'Actual (1-indexada).'], ['total', 'number', '—', 'Si és < 2, no es pinta res.'], ['onCanvi', '(n) => void', '—', '—']]}
        a11y={['Botons amb text «Anterior/Següent».', 'aria-current="page" i aria-label «Pàgina N».', 'Màxim 7 botons numèrics.']}
        fes={['Mostrar el total de resultats al costat.']} noFacis={['Scroll infinit (04_criteris_producte_i_disseny).']}>
        <Paginacio pagina={pagina} total={12} onCanvi={setPagina} />
    </Especimen>
  );
}
