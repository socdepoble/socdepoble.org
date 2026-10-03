import { useState } from 'react';
import { Coffee, DoorOpen, Receipt, Undo2 } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { LiniaDelTemps } from '../../../../components/PedraSeca/index.js';

/* Un torn de bar inventat: cap dada de cap establiment ni de cap persona. */
const TORN = [
  { id: 'a-1', hora: '07:30', titol: 'Obri el torn', detall: 'Fons inicial de mostra', icona: DoorOpen },
  { id: 'a-2', hora: '07:42', titol: 'Comanda de la barra', detall: '2 cafès i 1 torrada', icona: Coffee },
  { id: 'a-3', hora: '08:15', titol: 'Tiquet cobrat', detall: 'Efectiu', icona: Receipt },
  { id: 'a-4', hora: '08:20', titol: 'Devolució', detall: 'Motiu: producte equivocat', icona: Undo2 }
];

export default function EspecimenLiniaDelTemps() {
  const [triat, setTriat] = useState('a-2');
  return (
    <Especimen id="linia-del-temps" nom="LiniaDelTemps" fitxer="src/components/PedraSeca/organismes/LiniaDelTemps.jsx"
      descripcio="Llista vertical d’apunts amb l’hora a l’esquerra i una marca sobre l’eix. Cada apunt pot ser un enllaç del router propi (ruta: la tria viu a la URL), un botó (onTria) o text quiet. No ordena: rep els apunts en l’ordre de lectura."
      contracte={[
        ['apunts', '{ id, hora, moment?, titol, detall?, icona?, ruta? }[]', '[]', 'hora és el text de l’esquerra; moment, el datetime ISO; icona, un component de lucide.'],
        ['etiqueta', 'string', '—', 'El nom de la llista.'],
        ['seleccionat', 'id', 'null', 'L’apunt obert: aria-current="true".'],
        ['onTria', 'fn(id)', '—', 'Sense ruta, cada apunt és un botó.'],
        ['buit', 'string', 'Encara no hi ha cap apunt.', 'El text de l’EstatBuit quan no hi ha apunts.']
      ]}
      a11y={['<ol> amb nom. L’hora va dins del nom de cada acció («07:42: Comanda de la barra»).', 'L’eix i la marca són decoració (aria-hidden).']}
      fes={['Preferir ruta: la tria s’ha de poder compartir i tornar arrere.', 'Una icona que diga el tipus d’apunt.']}
      noFacis={['Valors, noms o text lliure a la URL: només ids.', 'Colors per categoria: no n’hi ha paleta.']}>
      <h4>Amb tria (botons)</h4>
      <LiniaDelTemps apunts={TORN} etiqueta="Torn de mostra" seleccionat={triat} onTria={setTriat} />
      <p role="status">{`Apunt obert: ${TORN.find((a) => a.id === triat)?.titol}.`}</p>
      <h4>Text quiet i estat buit</h4>
      <div className="sdp-especimen__fila">
        <LiniaDelTemps apunts={TORN.slice(0, 2)} etiqueta="Torn de mostra, només lectura" />
        <LiniaDelTemps apunts={[]} etiqueta="Torn buit" buit="Encara no hi ha cap apunt en este torn." />
      </div>
    </Especimen>
  );
}
