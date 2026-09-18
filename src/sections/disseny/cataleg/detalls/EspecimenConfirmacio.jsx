import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Dialeg, DialegConfirmacio } from '../../../../components/PedraSeca/index.js';
import { Boto } from '../../../../components/PedraSeca/index.js';
import { Camp, CampText } from '../../../../components/PedraSeca/index.js';
import { Pista } from '../../../../components/PedraSeca/index.js';
import { Dropdown, DropdownItem } from '../../../../components/PedraSeca/index.js';
import { showToast } from '../../../../components/universal/AvisadorEfimer.jsx';

export default function EspecimenConfirmacio() {
  const [confirma, setConfirma] = useState(false);
  return (
    <Especimen id="confirmacio" nom="DialegConfirmacio" fitxer="src/components/PedraSeca/Dialeg.jsx"
        descripcio="Confirmació. Amb destructiu, el focus inicial va a «Cancel·lar» i el vel no tanca (Llei de la Por Orgànica)."
        contracte={[           ['onConfirma', '() => void', '—', 'Acció confirmada.'],           ['destructiu', 'boolean', 'false', 'Botó en perill, focus a Cancel·lar, vel inactiu.'],           ['etiquetaConfirma / etiquetaCancela', 'string', "'Confirmar' / 'Cancel·lar'", 'Usa el verb real: «Esborrar la nota».'],           ['carregant', 'boolean', 'false', 'Mentre s’executa.'],         ]}
        a11y={['Un Intro distret cancel·la, no esborra.']}
        fes={['Dir què es perd: «Es perdran 3 notes».']} noFacis={['«Esteu segur?» sense dir de què.', '«Sí / No» com a etiquetes.']}>
        <Boto varietat="perill" onClick={() => setConfirma(true)}>Esborrar la nota</Boto>
        <DialegConfirmacio obert={confirma} destructiu titol="Esborrar «Guia ràpida»?"
          descripcio="La nota anirà a la paperera 30 dies. Després no es podrà recuperar."
          etiquetaConfirma="Esborrar la nota" onTanca={() => setConfirma(false)}
          onConfirma={() => { setConfirma(false); showToast('Nota a la paperera', 'success'); }} />
    </Especimen>
  );
}
