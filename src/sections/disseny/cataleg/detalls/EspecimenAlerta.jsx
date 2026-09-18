import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Plus, SearchX } from 'lucide-react';
import { Alerta, Insignia, EstatBuit, Carregant, Esquelet, Progres } from '../../../../components/PedraSeca/index.js';
import { Boto } from '../../../../components/PedraSeca/index.js';

export default function EspecimenAlerta() {
  const [visible, setVisible] = useState(true);
  return (
    <Especimen id="alerta" nom="Alerta" fitxer="src/components/PedraSeca/Alerta.jsx"
        descripcio="Missatge en línia que es queda fins que es resol. Emet el canon sdp-alerta--* de @layer sdp."
        contracte={[           ['to', "'info'|'exit'|'avis'|'error'", "'info'", 'error → role=alert; la resta → role=status.'],           ['titol', 'node', 'null', 'Una frase que resumix.'],           ['accions', 'node', 'null', 'Botons de resolució.'],           ['onTanca', '() => void', 'null', 'Si hi és, apareix la creu (44px).'],         ]}
        a11y={['Només error interromp el lector (role=alert).', 'Icona + text + vora: llegible sense color.', '«ok» és àlies obsolet d’«exit».']}
        fes={['Dir el següent pas: «Torna-ho a provar en uns minuts».']} noFacis={['role="alert" per a una informació neutra.', 'Codis tècnics («Error 403») sense traducció.']}>
        <Alerta to="info" titol="Informació">Les notes privades només les veus tu.</Alerta>
        <Alerta to="exit" titol="Fet">La publicació ja és al Mur.</Alerta>
        <Alerta to="avis" titol="Revisa-ho">Aquesta foto pesa 12 MB; al camp tardarà a pujar.</Alerta>
        {visible ? (
          <Alerta to="error" titol="No s’ha pogut desar" onTanca={() => setVisible(false)}
            accions={<Boto varietat="secundari">Tornar-ho a provar</Boto>}>
            No hi ha connexió amb el servidor. El text continua ací; no l’has perdut.
          </Alerta>
        ) : <Boto onClick={() => setVisible(true)}>Tornar a mostrar l’error</Boto>}
    </Especimen>
  );
}
