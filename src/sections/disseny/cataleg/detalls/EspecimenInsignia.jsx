import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Plus, SearchX } from 'lucide-react';
import { Alerta, Insignia, EstatBuit, Carregant, Esquelet, Progres } from '../../../../components/PedraSeca/index.js';
import { Boto } from '../../../../components/PedraSeca/index.js';

export default function EspecimenInsignia() {
  return (
    <Especimen id="insignia" nom="Insignia" fitxer="src/components/PedraSeca/Insignia.jsx"
        descripcio="Dues famílies en una peça. Taxonomia (tipus) per a classificar; estat (to) per a informar."
        contracte={[           ['tipus', "'sistema'|'categoria'|'etiqueta'", 'null', 'Emet sdp-badge-system|category|tag.'],           ['to', "'neutre'|'info'|'exit'|'avis'|'error'", "'neutre'", 'Emet sdp-insignia--*.'],         ]}
        a11y={['El text és obligatori; el color només reforça.']}
        fes={['Una paraula o dos.']} noFacis={['Repetir en insígnia el que ja diu la carpeta.', 'Les maquetes .badge-* de Fonaments (obsoletes).']}>
      <div className="sdp-especimen__fila">
          <Insignia tipus="sistema">Mur</Insignia>
          <Insignia tipus="categoria">Productivitat</Insignia>
          <Insignia tipus="etiqueta">Tutorial</Insignia>
        </div>
        <div className="sdp-especimen__fila">
          <Insignia>Esborrany</Insignia>
          <Insignia to="info">Pendent</Insignia>
          <Insignia to="exit">Conciliada</Insignia>
          <Insignia to="avis">Per revisar</Insignia>
          <Insignia to="error">Rebutjada</Insignia>
        </div>
    </Especimen>
  );
}
