import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · El llindar és el BREAKPOINT MESTRE de
   layout.css (≤1023px, abans 1100) i el mateix AMPLE_MAXIM_COMPACTE d'App.jsx.
   T3 (ordre del Mestre, 260930; esmena del 261006) · Cinc caselles en un
   ordre explícit. Telefonades n'ha eixit per decisió del Mestre (261006):
   l'avís de D17 viu a la vista Telefonades del rail del Xat.
   Onada 5 (ordre del Mestre, 261008) · Xat, Mur, el Panell de Control,
   Mercat i Pobles (l'ordre de les quatre primeres de la barra lateral), en
   cinc pistes d'ample igual.
   Ordre del Mestre (261012, vespre) · «Fes que les barres acompanyen l'scroll
   (que s'oculten al baixar) per alliberar el 100% de la pantalla»: la barra
   acompanya el visor (useBarresAmbScroll, layout.css). Deroga el «No facis:
   amagar-la en fer scroll» d'abans. */
export default function EspecimenNavMobil() {
  return (
    <>
      <Llinatge id="nav-mobil" />
      <Especimen id="nav-mobil" nom="Barra de navegació mòbil" fitxer="src/app/App.jsx (MobileNav · nav.mobile-nav)"
        descripcio="Fins a 1023px d’ample: barra inferior fixa amb cinc caselles, en este ordre: Xat, Mur, el Panell de Control (el botó central), Mercat i Pobles, el mateix que les quatre primeres de la barra lateral. Pobles va l’última perquè no s’hi publica. La barra lateral passa a calaix i conserva el seu ordre. Acompanya el scroll del visor: en baixar s’amaga, amb la blava i la taronja, i torna en pujar, prop de dalt i al final. Des de 1024px no es pinta."
        a11y={[
          'Cada secció porta icona i text (mai només icona); el botó central té nom accessible («Panell de Control») i porta a /control.',
          'L’únic botó de la barra és el central; les altres quatre caselles són enllaços.',
          'Cap casella per davall de --sdp-touch. Si un rètol no hi cap, es retalla amb punts suspensius i el nom sencer queda al nom accessible.',
          'Respecta env(safe-area-inset-bottom).',
          'L’enllaç de la secció activa s’encén també a les seues subrutes.'
        ]}
        fes={[
          'Cinc caselles en l’ordre fixat: Xat, Mur, el Panell de Control com a botó central, Mercat i Pobles.',
          'Cinc pistes d’ample igual de vora a vora: el botó central sempre al centre i cap espai negre sobrant als costats.',
          'Amagar-la només quan el visor que es desplaça arriba fins a baix de la pantalla, i amb transform: la reserva del visor no canvia.',
          'Deixar-la a la vista amb un peu ancorat a baix («Desar autoria», el compositor del Xat): el peu en reserva l’alçada i no ha de quedar suspés sobre una franja buida.',
          'Tornar-la a mostrar quan el focus de teclat entra en una barra, quan s’obri un diàleg i en canviar de ruta.'
        ]}
        noFacis={[
          'Més de sis caselles.',
          'Amagar-la amb display, visibility, opacity o aria-hidden: amagar no és llevar.',
          'Tocar res per damunt de 1023px: en escriptori no hi ha seguiment del scroll i la pantalla no canvia (Llei del Píxel).'
        ]}>
        <p>Es veu reduint la finestra fins a 1023px o menys. L’espècimen viu és la mateixa app.</p>
      </Especimen>
    </>
  );
}
