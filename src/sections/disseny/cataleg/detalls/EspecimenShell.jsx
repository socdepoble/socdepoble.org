import { useEffect, useRef, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import { Accions } from '../../../../components/PedraSeca/index.js';
import {
  FranjaAmfitrio, TitolAmfitrio, etiquetesDeLaFranja, textDelNode
} from '../../../../components/universal/MarcaAmfitrio.jsx';
import { createTranslator } from '../../../../config/i18n';

/* T52 (ordre del Mestre, 260928) · No hi ha cap UniversalShell ni cap peça a
   layout/: la closca és el JSX d'AppShell i de TopBar a src/app/App.jsx. Tot
   el que es diu ací s'ha contrastat amb eixe fitxer i amb layout.css. */

/* Enxufe universal, T2 (260929) · Nom de mostra de l'amfitrió (el del banc de
   proves de WordPress). El text de la franja passa pel diccionari real. */
const NOM_DE_MOSTRA = 'Gent de la Torre';
const T_CA = createTranslator('ca');
const ETIQUETES_FRANJA = etiquetesDeLaFranja(T_CA);

/* T7 (ordre del Mestre, 261001) · Els tres estats de la connexió amb el node
   (estatConnexio.js), cadascun amb el seu text. */
const ESTATS_DE_MOSTRA = [
  ['connectat', 'Connectat · pilot verd i ple'],
  ['connectant', 'Connectant · pilot groc en anell'],
  ['desconnectat', 'Sense connexió · pilot groc en anell']
];

/* Una franja de mostra amb la X de veres, amb estat local: a l'app la X
   desa a sessionStorage (storage.js) i porta el focus a main; ací només
   l'amaga, i el focus passa al botó que la torna a mostrar. En tornar-la a
   mostrar, el focus va a la seua X: el botó desapareix i, sense, cauria al
   body (WCAG 2.4.3). En muntar la pàgina no s'enfoca res.
   IDEA-26 i IDEA-27 (ordre del Mestre, 261025) · Sense embolcall al voltant
   de l'h4 (com a primer fill perdia els 32px de dalt): la ref de la mostra
   embolcalla només la franja, i el botó va dins d'Accions. És un <button>
   cru perquè Boto no passa la ref (React 18) i el focus la necessita. */
function FranjaDeMostra({ estat, titol }) {
  const [tancada, setTancada] = useState(false);
  const mostraRef = useRef(null);
  const tornaRef = useRef(null);
  const reobertaRef = useRef(false);
  useEffect(() => {
    if (tancada) {
      tornaRef.current?.focus();
    } else if (reobertaRef.current) {
      reobertaRef.current = false;
      mostraRef.current?.querySelector('.sdp-amfitrio-franja__tanca')?.focus();
    }
  }, [tancada]);
  const torna = () => {
    reobertaRef.current = true;
    setTancada(false);
  };
  return (
    <>
      <h4>{titol}</h4>
      {tancada ? (
        <Accions>
          <button type="button" ref={tornaRef} className="sdp-boto sdp-boto--secundari" onClick={torna}>
            Tornar a mostrar la franja
          </button>
        </Accions>
      ) : (
        <div ref={mostraRef}>
          <FranjaAmfitrio
            nomPoble={NOM_DE_MOSTRA}
            text={textDelNode(T_CA, NOM_DE_MOSTRA, estat)}
            estat={estat}
            etiquetaRuta={ETIQUETES_FRANJA.mesInfo}
            etiquetaTanca={ETIQUETES_FRANJA.tanca}
            onTanca={() => setTancada(true)}
          />
        </div>
      )}
    </>
  );
}

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
          'Mutar el DOM des d’un onClick per a plegar la barra.'
        ]}>
        <div className="sdp-anatomia" aria-hidden="true">
          <div className="sdp-anatomia__lat">Barra lateral<br />nav#app-sidebar<br />(calaix fins a 1023px)</div>
          <div className="sdp-anatomia__sup">Barra negra · header.bar-black</div>
          <div className="sdp-anatomia__fin">main#main-content<br />(UniversalPage o UniversalWorkspace)</div>
        </div>
        <p>La navegació mòbil (nav.mobile-nav) no ix a l’anatomia: només es pinta fins a 1023px, davall de tot. L’espècimen viu és la mateixa app.</p>
      </Especimen>

      <Especimen id="amfitrio" nom="Marca de l’amfitrió" fitxer="src/components/universal/MarcaAmfitrio.jsx (TitolAmfitrio · FranjaAmfitrio)"
        descripcio="Quan un amfitrió (Sollutia, MediaWiki o el WordPress de proves) declara el nom del poble (nomPoble), la closca diu a la gent on és. En escriptori, el nom va a la barra negra, com a primer fill del header; en compacte (contenidor de 1023px o menys), una franja davall de la barra negra diu l’estat de la connexió amb el node: «Connectat al node de …» només quan l’App ha carregat el contingut del servidor; si no, «Connectant amb el node de …» o «Sense connexió amb el node de …». La franja porta a /fedivers (què és un node) i la X l’amaga per a eixe node fins a la pròxima pestanya. Sense nomPoble no es pinta res: socdepoble.org no canvia ni un píxel."
        contracte={[
          ['TitolAmfitrio.nomPoble', 'string', '—', 'Nom del poble ja sanejat (sanejaEtiqueta). Buit: cap node.'],
          ['FranjaAmfitrio.nomPoble', 'string', '—', 'Buit: cap node.'],
          ['FranjaAmfitrio.text', 'string', '—', 'La frase traduïda: textDelNode(t, nomPoble, estat), claus amfitrio.node, amfitrio.nodeConnectant i amfitrio.nodeSenseConnexio.'],
          ['FranjaAmfitrio.estat', "'connectat' | 'connectant' | 'desconnectat'", '—', 'estatDeConnexio (connexio/estatConnexio.js): mode remot, última càrrega del contingut i navigator.onLine. Pinta el pilot.'],
          ['FranjaAmfitrio.ruta', 'string', "'/fedivers'", 'On porta l’enllaç de la franja.'],
          ['FranjaAmfitrio.etiquetaRuta', 'string', '—', '«Què és un node?», només per al lector (amfitrio.mesInfo).'],
          ['FranjaAmfitrio.etiquetaTanca', 'string', '—', 'Nom accessible de la X (amfitrio.tanca).'],
          ['FranjaAmfitrio.onTanca', 'function', '—', 'Sense, no hi ha X. A l’app desa a sessionStorage via storage.js i porta el focus a main.']
        ]}
        a11y={[
          'El títol és text pla dins d’un <p>; el separador «|» és aria-hidden: el lector llig només el nom.',
          'La franja té dues parades de tabulació, germanes i mai una dins de l’altra: l’enllaç (frase i «Què és un node?») i la X, amb aria-label.',
          'El pilot i la fletxa són aria-hidden: l’estat el diu la frase, i el pilot el diu també amb la forma (ple o anell), no només amb el color.',
          'L’enllaç i la X fan l’àrea tàctil de --sdp-touch; a /fedivers l’enllaç porta aria-current="page".'
        ]}
        fes={[
          'Pintar-los només quan l’amfitrió declara nomPoble, i triar escriptori o compacte per isCompact (l’amplada del contenidor), com la resta de la closca.',
          'Pintar amb crom (--sdp-crom-*): la barra negra i la franja són iguals en clar i en fosc.',
          'Sanejar el nom abans de pintar-lo: ve de l’amfitrió.',
          'Dir «Connectat» només amb el pilot verd: la resta d’estats tenen la seua frase.',
          'En tancar amb la X, portar el focus a main per ref, i desar el tancament a sessionStorage només a través de storage.js.'
        ]}
        noFacis={[
          'Pintar el nom amb innerHTML o dangerouslySetInnerHTML.',
          'Deixar un embolcall o una classe buida quan no hi ha nomPoble: el DOM de socdepoble.org ha de ser el mateix.',
          'Triar la variant amb media queries: una incrustació estreta dins d’una pantalla ampla és compacta.',
          'Posar la X dins de l’enllaç, o fer el color l’únic senyal de l’estat.',
          'Sondejar el servidor per temporitzador per a encendre el verd.'
        ]}>
        <h4>Escriptori · a la barra negra</h4>
        <div className="sdp-amfitrio-mostra" role="group" aria-label="Mostra de la barra negra amb el nom de l’amfitrió">
          <TitolAmfitrio nomPoble={NOM_DE_MOSTRA} />
        </div>
        {ESTATS_DE_MOSTRA.map(([estat, titol]) => (
          <FranjaDeMostra key={estat} estat={estat} titol={`Compacte · ${titol}`} />
        ))}
      </Especimen>
    </>
  );
}
