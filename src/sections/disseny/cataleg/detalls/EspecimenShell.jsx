import { Especimen } from '../Especimen.jsx';
import { Alerta } from '../../../../components/PedraSeca/index.js';

export default function EspecimenShell() {
  return (
    <Especimen id="shell" nom="UniversalShell · la bastida" fitxer="src/components/layout/ (Codex)"
        descripcio="Tres peces i prou: Barra lateral · Barra superior fixada · Finestra de contingut. Tota ruta de l’app viu dins de la Finestra."
        a11y={['<nav> per a la barra lateral, <header> per a la superior, <main tabindex=-1> per a la finestra; el focus hi torna en canviar de ruta.', 'Calaix mòbil: Escape, vel clicable i tancament en navegar.']}
        fes={['Estat de la barra lateral en React, no en classList.', 'La barra superior és crom: mateix color en clar i fosc.']}
        noFacis={['Una segona barra superior per secció (això és el crom de UniversalPage).', 'Mutar el DOM des d’un onClick per plegar la barra.']}>
        <div className="sdp-anatomia" aria-hidden="true">
          <div className="sdp-anatomia__lat">Barra lateral<br />(Divisor a la vora)</div>
          <div className="sdp-anatomia__sup">Barra superior fixada</div>
          <div className="sdp-anatomia__fin">Finestra de contingut<br />(UniversalPage o gestor)</div>
        </div>
    </Especimen>
  );
}
