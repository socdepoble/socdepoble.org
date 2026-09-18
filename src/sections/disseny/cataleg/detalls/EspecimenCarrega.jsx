import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Plus, SearchX } from 'lucide-react';
import { Alerta, Insignia, EstatBuit, Carregant, Esquelet, Progres } from '../../../../components/PedraSeca/index.js';
import { Boto } from '../../../../components/PedraSeca/index.js';

export default function EspecimenCarrega() {
  return (
    <Especimen id="carrega" nom="Carregant · Esquelet" fitxer="src/components/PedraSeca/estats.jsx"
        descripcio="Carregant per a esperes curtes o accions; Esquelet quan se sap la forma del que ve (targetes, llistes)."
        contracte={[['Carregant.etiqueta', 'string', "'Carregant…'", 'Text visible i anunciat.'], ['Esquelet.linies', 'number', '3', 'Línies de text.'], ['Esquelet.ambMedia', 'boolean', 'false', 'Bloc d’imatge a dalt.']]}
        a11y={['role=status amb un sol text per al lector; les formes són aria-hidden.', 'Sense animació amb prefers-reduced-motion.']}
        fes={['Esquelet amb la mateixa forma que el contingut final.']} noFacis={['Spinners sense text.', 'Esquelets de més de 3 segons sense missatge.']}>
      <Carregant etiqueta="Carregant el Mur…" />
        <Esquelet ambMedia linies={2} />
    </Especimen>
  );
}
