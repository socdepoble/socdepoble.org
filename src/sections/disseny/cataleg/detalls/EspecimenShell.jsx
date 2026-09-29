import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · No hi ha cap UniversalShell ni cap peça a
   layout/: la closca és el JSX d'AppShell i de TopBar a src/app/App.jsx. Tot
   el que es diu ací s'ha contrastat amb eixe fitxer i amb layout.css. */
export default function EspecimenShell() {
  return (
    <>
      <Llinatge id="closca" />
      <Especimen id="shell" nom="Closca de l’app (App.jsx)" fitxer="src/app/App.jsx (AppShell · TopBar · MobileNav)"
        descripcio="L’arrel de totes les pantalles. Quatre peces: la barra lateral (nav#app-sidebar), la barra negra (header.bar-black, la primera cosa dins de main), el contingut (main#main-content, on viu cada ruta: una UniversalPage o un UniversalWorkspace) i la navegació mòbil (nav.mobile-nav). Fins a 1023px d’ample, la barra lateral passa a calaix (un Dialeg a l’esquerra) i apareix la navegació mòbil."
        a11y={[
          'Enllaç «Salta al contingut principal» com a primer element; <nav> per a la barra lateral i per a la mòbil, <header> per a la negra i <main tabIndex=-1>.',
          'En canviar de ruta, el focus torna a main (sense desplaçar la pàgina).',
          'Calaix de 1023px o menys: és un Dialeg natiu (Escape, vel clicable) i es tanca en triar una secció.'
        ]}
        fes={[
          'Decidir el mode compacte per l’amplada del contenidor (ResizeObserver sobre l’arrel), amb el mateix llindar de 1023px que layout.css.',
          'La barra negra és crom: el mateix color en clar i en fosc. El calaix d’identitat és germà del header, no fill.'
        ]}
        noFacis={[
          'Una segona barra superior per secció: això és el crom de UniversalPage (barres blava i taronja).',
          'Mutar el DOM des d’un onClick per a plegar la barra. Deute: un efecte encara hi afig sidebar-closed amb classList, a més del className de l’arrel.'
        ]}>
        <div className="sdp-anatomia" aria-hidden="true">
          <div className="sdp-anatomia__lat">Barra lateral<br />nav#app-sidebar<br />(calaix fins a 1023px)</div>
          <div className="sdp-anatomia__sup">Barra negra · header.bar-black</div>
          <div className="sdp-anatomia__fin">main#main-content<br />(UniversalPage o UniversalWorkspace)</div>
        </div>
        <p>La navegació mòbil (nav.mobile-nav) no ix a l’anatomia: només es pinta fins a 1023px, davall de tot. L’espècimen viu és la mateixa app.</p>
      </Especimen>
    </>
  );
}
