import { Especimen } from '../Especimen.jsx';

export default function EspecimenNavMobil() {
  return (
    <Especimen id="nav-mobil" nom="Barra de navegació mòbil" fitxer="src/app/App.jsx (nav.mobile-nav)"
        descripcio="≤1100px: barra inferior fixa amb 4 seccions i el Panell de Control al centre. La barra lateral passa a calaix."
        a11y={['Cada element porta icona + text (mai només icona).', 'Respecta env(safe-area-inset-bottom).']}
        fes={['Les 4 seccions de més ús.']} noFacis={['Més de 5 destinacions.', 'Amagar-la en fer scroll.']}>
      <p>Es veu reduint la finestra per davall de 1100px. L’espècimen viu és la mateixa app.</p>
    </Especimen>
  );
}
