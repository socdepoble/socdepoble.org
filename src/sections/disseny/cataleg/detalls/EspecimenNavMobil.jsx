import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · El llindar és el BREAKPOINT MESTRE de
   layout.css (≤1023px, abans 1100) i el mateix AMPLE_MAXIM_COMPACTE d'App.jsx.
   T3 (ordre del Mestre, 260930) · Sis caselles en un ordre explícit, i
   Telefonades és un botó que obri l'avís de D17 (no una ruta ni una secció). */
export default function EspecimenNavMobil() {
  return (
    <>
      <Llinatge id="nav-mobil" />
      <Especimen id="nav-mobil" nom="Barra de navegació mòbil" fitxer="src/app/App.jsx (MobileNav · nav.mobile-nav)"
        descripcio="Fins a 1023px d’ample: barra inferior fixa amb sis caselles, en este ordre: Xat, Mur, el Panell de Control (el botó central), Pobles, Mercat i Telefonades. La barra lateral passa a calaix i conserva el seu ordre. Des de 1024px no es pinta."
        a11y={[
          'Cada secció porta icona i text (mai només icona); el botó central té nom accessible («Panell de Control») i porta a /control.',
          'Telefonades és un botó amb aria-haspopup="dialog": obri el Dialeg de D17 (projecte lliure CC, funció prevista), no navega i no s’encén mai. En tancar-lo, el focus torna al botó.',
          'Cap casella per davall de --sdp-touch. Si un rètol no hi cap, es retalla amb punts suspensius i el nom sencer queda al nom accessible.',
          'Respecta env(safe-area-inset-bottom).',
          'L’enllaç de la secció activa s’encén també a les seues subrutes.'
        ]}
        fes={['Sis caselles en l’ordre fixat: Xat, Mur, el Panell de Control com a botó central, Pobles, Mercat i Telefonades.']}
        noFacis={[
          'Més de sis caselles.',
          'Convertir Telefonades en una ruta o en una secció: la publicaria al manifest i a la barra lateral.',
          'Amagar-la en fer scroll.'
        ]}>
        <p>Es veu reduint la finestra fins a 1023px o menys. L’espècimen viu és la mateixa app.</p>
      </Especimen>
    </>
  );
}
