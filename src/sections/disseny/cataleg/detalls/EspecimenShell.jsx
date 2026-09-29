import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import { FranjaAmfitrio, TitolAmfitrio, textDelServidor } from '../../../../components/universal/MarcaAmfitrio.jsx';
import { createTranslator } from '../../../../config/i18n';

/* T52 (ordre del Mestre, 260928) · No hi ha cap UniversalShell ni cap peça a
   layout/: la closca és el JSX d'AppShell i de TopBar a src/app/App.jsx. Tot
   el que es diu ací s'ha contrastat amb eixe fitxer i amb layout.css. */

/* Enxufe universal, T2 (260929) · Nom de mostra de l'amfitrió (el del banc de
   proves de WordPress). El text de la franja passa pel diccionari real. */
const NOM_DE_MOSTRA = 'Gent de la Torre';

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

      <Especimen id="amfitrio" nom="Marca de l’amfitrió" fitxer="src/components/universal/MarcaAmfitrio.jsx (TitolAmfitrio · FranjaAmfitrio)"
        descripcio="Quan un amfitrió (Sollutia, MediaWiki o el WordPress de proves) declara el nom del poble (nomPoble), la closca diu a la gent on és. En escriptori, el nom va a la barra negra, com a primer fill del header; en compacte (contenidor de 1023px o menys), una franja davall de la barra negra diu «Estàs al servidor de …». Sense nomPoble no es pinta res: socdepoble.org no canvia ni un píxel."
        contracte={[
          ['TitolAmfitrio.nomPoble', 'string', '—', 'Nom del poble ja sanejat (sanejaEtiqueta). Buit: cap node.'],
          ['FranjaAmfitrio.nomPoble', 'string', '—', 'Buit: cap node.'],
          ['FranjaAmfitrio.text', 'string', '—', 'La frase traduïda: textDelServidor(t, nomPoble), clau amfitrio.servidor.']
        ]}
        a11y={[
          'El títol és text pla dins d’un <p>; el separador «|» és aria-hidden: el lector llig només el nom.',
          'La icona de la franja (MapPin) és aria-hidden i no rep el focus; la frase sencera es llig com a text.',
          'Cap dels dos és interactiu: no afigen parades de tabulació a la barra.'
        ]}
        fes={[
          'Pintar-los només quan l’amfitrió declara nomPoble, i triar escriptori o compacte per isCompact (l’amplada del contenidor), com la resta de la closca.',
          'Pintar amb crom (--sdp-crom-*): la barra negra i la franja són iguals en clar i en fosc.',
          'Sanejar el nom abans de pintar-lo: ve de l’amfitrió.'
        ]}
        noFacis={[
          'Pintar el nom amb innerHTML o dangerouslySetInnerHTML.',
          'Deixar un embolcall o una classe buida quan no hi ha nomPoble: el DOM de socdepoble.org ha de ser el mateix.',
          'Triar la variant amb media queries: una incrustació estreta dins d’una pantalla ampla és compacta.'
        ]}>
        <h4>Escriptori · a la barra negra</h4>
        <div className="sdp-amfitrio-mostra" role="group" aria-label="Mostra de la barra negra amb el nom de l’amfitrió">
          <TitolAmfitrio nomPoble={NOM_DE_MOSTRA} />
        </div>
        <h4>Compacte · franja davall de la barra negra</h4>
        <FranjaAmfitrio nomPoble={NOM_DE_MOSTRA} text={textDelServidor(createTranslator('ca'), NOM_DE_MOSTRA)} />
      </Especimen>
    </>
  );
}
