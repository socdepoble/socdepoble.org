import { Especimen } from '../Especimen.jsx';
import { MollaPa } from '../../../../components/PedraSeca/index.js';

export default function EspecimenMolla() {
  return (
    <Especimen id="molla" nom="MollaPa" fitxer="src/components/PedraSeca/organismes/navegacio.jsx"
      descripcio="Camí des de l’arrel fins a la pàgina actual. Obligatòria a partir del segon nivell de profunditat. Amb la classe «sdp-molla--panell» és una barra pròpia, amb aire davant del primer pas i separació del contingut (Consola)."
      contracte={[
        ['passos', '{ etiqueta, a? }[]', '[]', 'L’últim és la pàgina actual (sense enllaç).'],
        ['className', 'string', '—', '«sdp-molla--panell»: la molla com a panell propi al cim de la pàgina.']
      ]}
      a11y={['<nav aria-label="Molla de pa"> + <ol>.', 'aria-current="page" a l’últim pas.']}
      fes={['Etiquetes iguals al títol de cada pàgina.', 'El separador «›» porta el mateix marge als dos costats.']}
      noFacis={['Substituir el botó «Tornar arrere».', 'Afegir espais amb &nbsp; o marges en línia: l’espaiat és del CSS.']}>
      <MollaPa passos={[{ etiqueta: 'Inici', a: '/' }, { etiqueta: 'Pobles', a: '/pobles' }, { etiqueta: 'La Torre de les Maçanes' }]} />
      <MollaPa className="sdp-molla--panell"
        passos={[{ etiqueta: 'Consola Termodinàmica', a: '/consola' }, { etiqueta: 'Calendari de processos' }]} />
    </Especimen>
  );
}
