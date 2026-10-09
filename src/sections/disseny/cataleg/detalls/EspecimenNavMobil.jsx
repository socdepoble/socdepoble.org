import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · El llindar és el BREAKPOINT MESTRE de
   layout.css (≤1023px, abans 1100) i el mateix AMPLE_MAXIM_COMPACTE d'App.jsx.
   T3 (ordre del Mestre, 260930; esmena del 261006) · Cinc caselles en un
   ordre explícit. Telefonades n'ha eixit per decisió del Mestre (261006):
   l'avís de D17 viu a la vista Telefonades del rail del Xat.
   Onada 5 (ordre del Mestre, 261008) · Xat, Mur, el Panell de Control,
   Mercat i Pobles (l'ordre de les quatre primeres de la barra lateral), en
   cinc pistes d'ample igual. */
export default function EspecimenNavMobil() {
  return (
    <>
      <Llinatge id="nav-mobil" />
      <Especimen id="nav-mobil" nom="Barra de navegació mòbil" fitxer="src/app/App.jsx (MobileNav · nav.mobile-nav)"
        descripcio="Fins a 1023px d’ample: barra inferior fixa amb cinc caselles, en este ordre: Xat, Mur, el Panell de Control (el botó central), Mercat i Pobles, el mateix que les quatre primeres de la barra lateral. Pobles va l’última perquè no s’hi publica. La barra lateral passa a calaix i conserva el seu ordre. Des de 1024px no es pinta."
        a11y={[
          'Cada secció porta icona i text (mai només icona); el botó central té nom accessible («Panell de Control») i porta a /control.',
          'L’únic botó de la barra és el central; les altres quatre caselles són enllaços.',
          'Cap casella per davall de --sdp-touch. Si un rètol no hi cap, es retalla amb punts suspensius i el nom sencer queda al nom accessible.',
          'Respecta env(safe-area-inset-bottom).',
          'L’enllaç de la secció activa s’encén també a les seues subrutes.'
        ]}
        fes={[
          'Cinc caselles en l’ordre fixat: Xat, Mur, el Panell de Control com a botó central, Mercat i Pobles.',
          'Cinc pistes d’ample igual de vora a vora: el botó central sempre al centre i cap espai negre sobrant als costats.'
        ]}
        noFacis={[
          'Més de sis caselles.',
          'Amagar-la en fer scroll.'
        ]}>
        <p>Es veu reduint la finestra fins a 1023px o menys. L’espècimen viu és la mateixa app.</p>
      </Especimen>
    </>
  );
}
