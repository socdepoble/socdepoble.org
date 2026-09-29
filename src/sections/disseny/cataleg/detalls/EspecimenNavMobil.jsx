import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · El llindar és el BREAKPOINT MESTRE de
   layout.css (≤1023px, abans 1100) i el mateix AMPLE_MAXIM_COMPACTE d'App.jsx. */
export default function EspecimenNavMobil() {
  return (
    <>
      <Llinatge id="nav-mobil" />
      <Especimen id="nav-mobil" nom="Barra de navegació mòbil" fitxer="src/app/App.jsx (MobileNav · nav.mobile-nav)"
        descripcio="Fins a 1023px d’ample: barra inferior fixa amb les quatre primeres seccions de la navegació (dues a cada costat) i el Panell de control al centre. La barra lateral passa a calaix. Des de 1024px no es pinta."
        a11y={[
          'Cada secció porta icona i text (mai només icona); el botó central té nom accessible («Panell de control»).',
          'Respecta env(safe-area-inset-bottom).',
          'L’enllaç de la secció activa s’encén també a les seues subrutes.'
        ]}
        fes={['Les quatre seccions de més ús, amb el Panell de control al mig.']}
        noFacis={['Més de cinc destinacions.', 'Amagar-la en fer scroll.']}>
        <p>Es veu reduint la finestra fins a 1023px o menys. L’espècimen viu és la mateixa app.</p>
      </Especimen>
    </>
  );
}
