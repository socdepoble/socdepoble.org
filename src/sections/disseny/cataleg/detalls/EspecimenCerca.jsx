import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { UniversalSearch } from '../../../../components/PedraSeca/index.js';

export default function EspecimenCerca() {
  const [cerca, setCerca] = useState("");
  return (
    <Especimen id="cerca" nom="UniversalSearch" fitxer="src/components/PedraSeca/organismes/UniversalSearch.jsx"
        descripcio="Cercador de llista. DEUTE: no admet etiqueta visible ni Camp; es manté per compatibilitat."
        a11y={['aria-label per defecte «Cercador universal». Cal passar ariaLabel concret.']}
        fes={['En formularis, usar <Camp> <CampText tipus="search" /></Camp>.']} noFacis={['Crear un tercer cercador.']}>
        <UniversalSearch value={cerca} onChange={(e) => setCerca(e.target.value)} ariaLabel="Cerca al catàleg" />
    </Especimen>
  );
}
