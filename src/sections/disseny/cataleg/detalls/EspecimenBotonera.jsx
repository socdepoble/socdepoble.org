import { LayoutGrid, Palette, Type } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { Botonera } from '../../../../components/PedraSeca/index.js';

const OPCIONS = [
  { valor: 'fonaments', to: '/disseny?categoria=fonaments', text: 'Fonaments', icona: <LayoutGrid size={16} />, activa: true },
  { valor: 'color', to: '/disseny?categoria=fonaments&item=fonaments-color', text: 'Color', icona: <Palette size={16} /> },
  { valor: 'tipografia', to: '/disseny?categoria=fonaments&item=fonaments-tipografia', text: 'Tipografia', icona: <Type size={16} /> }
];

export default function EspecimenBotonera() {
  return (
    <Especimen id="botonera" nom="Botonera" fitxer="src/components/PedraSeca/molecules/Botonera.jsx"
      descripcio="Menú de navegació amb forma de píndoles. Reaprofita la pell del PillToggle (.sdp-pindola) però amb semàntica de navegació: <nav> amb aria-label i <Link aria-current='page'>, de manera que «obrir en pestanya nova» funciona."
      contracte={[
        ['opcions', '{ to, text, icona?, activa?, valor? }[]', '[]', 'Cada opció és un enllaç de router.'],
        ['etiqueta', 'string', '—', 'aria-label del <nav>: obligatori si hi ha més d’una botonera.'],
        ['vertical', 'boolean', 'false', 'Apila les opcions.']
      ]}
      a11y={['L’opció activa porta aria-current="page", no una classe.', 'Enllaços reals: Intro, botó central i menú contextual funcionen.']}
      fes={['Per a navegar entre rutes o vistes germanes amb URL pròpia.']}
      noFacis={['Per a canviar l’estat d’un mateix contingut sense URL: això és PillToggle.', 'Per a passos seqüencials: usa un assistent.']}>
      <Botonera etiqueta="Fonaments del catàleg" opcions={OPCIONS} />
      <h4>Vertical</h4>
      <Botonera etiqueta="Fonaments del catàleg (vertical)" opcions={OPCIONS} vertical />
    </Especimen>
  );
}
