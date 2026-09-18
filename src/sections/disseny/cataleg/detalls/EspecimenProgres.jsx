import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Plus, SearchX } from 'lucide-react';
import { Alerta, Insignia, EstatBuit, Carregant, Esquelet, Progres } from '../../../../components/PedraSeca/index.js';
import { Boto } from '../../../../components/PedraSeca/index.js';

export default function EspecimenProgres() {
  return (
    <Especimen id="progres" nom="Progres" fitxer="src/components/PedraSeca/estats.jsx"
        descripcio="Progrés d’una tasca llarga amb <progress>       natiu. Sense valor, és indeterminat: no inventem percentatges."
        contracte={[['etiqueta', 'string', '—', 'Què progressa.'], ['valor', 'number|null', 'null', 'null = indeterminat.'], ['max', 'number', '100', '—']]}
        a11y={['<progress> natiu amb aria-label; el % visible és redundant per al lector.']}
        fes={['Pujades, importacions.']} noFacis={['Barres decoratives sense valor real (Consola Termodinàmica: cap % inventat).']}>
        <Progres etiqueta="Pujada d’imatges" valor={45} />
        <Progres etiqueta="Indexació de documents" valor={78} />
        <Progres etiqueta="Connectant amb el servidor" />
    </Especimen>
  );
}
