/**
 * DialegCarpeta — tria la carpeta d'un document. Sempre n'hi ha una i només
 * una (ràdios): la regla d'orfandat es complix per construcció.
 *
 * Crear, reanomenar i esborrar carpetes no tenen contracte de dades al port
 * (backendPort.js, AGENTS §8): els botons es veuen deshabilitats amb l'avís
 * que passa qui el munta, en lloc d'inventar una operació que no existix.
 */
import { useState } from 'react';
import { FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { Dialeg, Boto, GrupOpcions } from '../../PedraSeca/index.js';

export function DialegCarpeta({ obert, onTanca, opcions = [], seleccionada, onDesa, avis }) {
  const [triada, setTriada] = useState(seleccionada);
  const valida = opcions.some((o) => o.id === triada);
  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol="Carpeta del document"
      descripcio="Cada document viu en una carpeta, i només en una."
      mida="s"
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => onTanca?.('boto')}>Cancel·lar</Boto>
          <Boto varietat="primari" disabled={!valida} onClick={() => onDesa?.(triada)}>Desar</Boto>
        </>
      )}
    >
      <GrupOpcions
        llegenda="Carpetes"
        opcions={opcions.map((o) => ({ valor: o.id, etiqueta: o.nom }))}
        valor={triada}
        onCanvi={setTriada}
      />
      <div className="sdp-classificacio-dialeg__reservat">
        {avis ? <p className="sdp-classificacio-dialeg__avis">{avis}</p> : null}
        <Boto varietat="fantasma" icona={FolderPlus} disabled>Crear carpeta</Boto>
        <Boto varietat="fantasma" icona={Pencil} disabled>Reanomenar carpeta</Boto>
        <Boto varietat="fantasma" icona={Trash2} disabled>Esborrar carpeta</Boto>
      </div>
    </Dialeg>
  );
}

export default DialegCarpeta;
