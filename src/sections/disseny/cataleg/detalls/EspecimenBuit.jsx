import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Plus, SearchX } from 'lucide-react';
import { Alerta, Insignia, EstatBuit, Carregant, Esquelet, Progres } from '../../../../components/PedraSeca/index.js';
import { Boto } from '../../../../components/PedraSeca/index.js';

export default function EspecimenBuit() {
  return (
    <Especimen id="buit" nom="EstatBuit" fitxer="src/components/PedraSeca/estats.jsx"
        descripcio="Llista o secció sense contingut. Explica per què i oferix l’acció que ho arregla."
        contracte={[['icona', 'Component lucide', 'Inbox', 'Decorativa.'], ['titol', 'node', '—', 'Què passa.'], ['children', 'node', 'null', 'Per què.'], ['accio', 'node', 'null', 'La porta d’eixida.']]}
        fes={['Distingir «encara no hi ha res» de «la cerca no troba res».']} noFacis={['Una pantalla en blanc.']}>
      <div className="sdp-especimen__regles">
          <EstatBuit titol="Encara no tens notes" accio={<Boto varietat="primari" icona={Plus}>Crear la primera nota</Boto>}>
            Les notes són privades fins que decidixes publicar-les.
          </EstatBuit>
          <EstatBuit icona={SearchX} titol="Cap resultat per «almàssera»">Prova amb menys paraules o revisa l’accent.</EstatBuit>
        </div>
    </Especimen>
  );
}
