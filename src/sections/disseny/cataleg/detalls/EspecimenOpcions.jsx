import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Globe, Lock, Users } from 'lucide-react';
import { Casella, GrupOpcions, Interruptor } from '../../../../components/PedraSeca/index.js';

/* T44 · exemple de GrupOpcions aspecte="targetes" (el patró que farà servir
   T41 per a Pública/Privada). La tercera opció mostra `desactivada`. */
const OPCIONS_VISIBILITAT = [
  { valor: 'publica', antetitol: 'Fitxa', etiqueta: 'Pública', ajuda: 'Tothom sap que hi eres.', icona: <Globe size={28} strokeWidth={1.5} />, detall: 'La pots tornar privada quan vulgues.' },
  { valor: 'privada', antetitol: 'Fitxa', etiqueta: 'Privada', ajuda: 'Ningú no et veu.', icona: <Lock size={28} strokeWidth={1.5} /> },
  { valor: 'grup', antetitol: 'Fitxa', etiqueta: 'Només el meu grup', ajuda: 'Opció desactivada d’exemple: encara no es pot triar.', icona: <Users size={28} strokeWidth={1.5} />, desactivada: true }
];

export default function EspecimenOpcions() {
  const [avisos, setAvisos] = useState(false);
  const [visibilitat, setVisibilitat] = useState('publica');
  return (
    <Especimen id="opcions" nom="Casella · GrupOpcions · Interruptor · GrupCamps" fitxer="src/components/PedraSeca/organismes/formulari.jsx"
        descripcio="Casella: decisió que es confirma després. Interruptor: efecte immediat. Ràdios sempre dins d’un fieldset amb llegenda."
        contracte={[           ['Casella.etiqueta / ajuda', 'node', '—', 'Tota la fila és clicable.'],           ['GrupOpcions.opcions', '{ valor, etiqueta, ajuda?, desactivada? }[]', '[]', 'Ràdios natius; fletxes per teclat. desactivada: eixe ràdio no es pot triar.'],
          ['GrupOpcions.valor / onCanvi', 'string / (valor) => void', '—', 'Controlat.'],
          ['GrupOpcions.aspecte', "'llista' | 'targetes'", "'llista'", 'Targetes: cada opció és una targeta clicable sencera; el control és el mateix ràdio natiu.'],
          ['opcions[].antetitol / icona / detall', 'string / node / node', '—', 'Només en targetes.'],
          ['GrupOpcions.textTriada', 'string', "'Triat'", 'Insígnia de l’opció marcada (només en mode controlat).'],
          ['Interruptor.actiu / onCanvi', 'boolean / (bool) => void', 'false', 'role="switch", estat en text Sí/No.'],
        ]}
        a11y={['fieldset + legend: el lector llig la pregunta abans de cada opció.', 'Zona tàctil de 44px per fila.', 'L’interruptor diu «Sí/No» en text.', 'Targetes: nom = antetítol + títol (aria-labelledby); descripció = ajuda + detall (aria-describedby).', 'Targetes: la triada es llig sense color, pel punt del ràdio i la insígnia amb text.']}
        fes={['Interruptor per a ajustos que s’apliquen al moment.', 'Targetes per a una elecció protagonista de poques opcions.']}
        noFacis={['Un interruptor dins d’un formulari amb botó «Desar».', 'Ràdios solts sense fieldset.', 'Targetes amb <button> o role="radio" fet a mà.', 'Encapçalaments dins de la targeta: el label només admet contingut de frase.']}>
        <Casella etiqueta="Vull rebre el butlletí del poble" ajuda="Un correu al mes, com a molt." />
        <GrupOpcions llegenda="Mida de la lletra" valor="gran" onCanvi={() => {}} opcions={[{ valor: 'normal', etiqueta: 'Normal' }, { valor: 'gran', etiqueta: 'Gran' }, { valor: 'molt', etiqueta: 'Molt gran' }]} />
        <GrupOpcions aspecte="targetes" llegenda="Qui pot veure la fitxa" textTriada="Triada"
          valor={visibilitat} onCanvi={setVisibilitat} opcions={OPCIONS_VISIBILITAT} />
        <Interruptor etiqueta="Avisos del mercat" actiu={avisos} onCanvi={setAvisos} />
    </Especimen>
  );
}
