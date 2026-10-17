/**
 * EspecimenVisorImatges.jsx — el visor de fotos a pantalla completa (Onada
 * 0.3, Gauntlet 261016; pla 261016_1530: «En fer clic sobre qualsevol imatge
 * de la galeria a /multimedia […] s'obri un visor modal / Lightbox natiu a
 * pantalla completa sobre fons fosc»). Pedra Seca §9: l'espècimen abans de la
 * producció. Tres fotos de la casa en la graella de l'Arxiu visual (les
 * mateixes cel·les-botó de /multimedia); un clic obri el visor en eixa foto,
 * amb el panell d'informació desplegat. A l'app el munta VisorDeLArxiu
 * (src/sections/multimedia), amb l'estat a ?foto=<id>.
 */
import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { VisorImatges } from '../../../../components/PedraSeca/index.js';
import { resolveAsset } from '../../../../config/assetResolver.js';

const FOTOS = [
  { src: '/assets/towns/tibi/1.jpg', titol: 'Tibi' },
  { src: '/assets/uploads/poble/la-torre-de-les-macanes/img-la-torre-de-les-ma-anes-main.jpg', titol: 'La Torre de les Maçanes' },
  { src: '/assets/nano_cards/mur_nano_card.jpg', titol: 'Mur' }
].map((foto) => ({ ...foto, src: resolveAsset(foto.src), alt: foto.titol }));

const DADES = [
  [
    { clau: 'data', etiqueta: 'Data i hora de captura', valor: 'Desconegut' },
    { clau: 'drets', etiqueta: 'Drets d’ús', valor: '© Viquipèdia / Wikimedia Commons (CC BY-SA)' },
    { clau: 'origen', etiqueta: 'Origen', valor: 'Fotografia' }
  ],
  [
    { clau: 'data', etiqueta: 'Data i hora de captura', valor: 'Desconegut' },
    { clau: 'drets', etiqueta: 'Drets d’ús', valor: 'No declarats' },
    { clau: 'origen', etiqueta: 'Origen', valor: 'Fotografia' }
  ],
  [
    { clau: 'drets', etiqueta: 'Drets d’ús', valor: 'CC BY-NC-SA 4.0 Sóc de Poble / Fet per la IAIA i Nano Banana' },
    { clau: 'origen', etiqueta: 'Origen', valor: 'Il·lustració d’IA' }
  ]
];

export default function EspecimenVisorImatges() {
  const [oberta, setOberta] = useState(-1);
  return (
    <Especimen id="visor-imatges" nom="VisorImatges" fitxer="src/components/PedraSeca/organismes/VisorImatges.jsx"
      descripcio="El visor de fotos a pantalla completa, a l’estil de Google Fotos: la foto sencera sobre el fons fosc del crom, «Tancar» a dalt a l’esquerra, el comptador, el zoom i el botó d’Informació, que desplega el panell amb les dades de la foto (data i hora, GPS, càmera, autor, poble, drets i on s’ha publicat). Anterior i següent donen la volta. És un Dialeg de mida completa: a la SPA tapa l’App sencera; dins d’un amfitrió, només la caixa de l’App."
      contracte={[
        ['obert / onTanca', "boolean / (motiu: 'esc'|'boto') => void", '—', 'Controlat pel pare. Tancat, el <dialog> és buit i no es demana cap imatge. A /multimedia l’estat és ?foto=<id>: el botó Arrere del navegador també tanca.'],
        ['imatges', '[{ src, alt, titol }]', '—', 'Les fotos, en l’ordre de la vista, amb el src ja resolt. Sense cap, no s’obri.'],
        ['index / onCanvi', 'number / (nouIndex) => void', '0', 'La foto oberta i el canvi que demanen anterior, següent, les fletxes o el lliscament (amb la volta).'],
        ['metadades', '[{ clau, etiqueta, valor }]', '[]', 'Les files del panell de la foto oberta; valor pot ser un node (un enllaç intern). El que no se sap es diu «Desconegut», mai s’inventa.'],
        ['titol', 'string', "'Visor d’imatges'", 'El nom accessible del diàleg.'],
        ['etiquetes', '{ tanca, anterior, seguent, ampliar, reduir, info, posicio, error, senseImatge }', 'en valencià', 'Els textos, ja traduïts per qui el munta: la peça no llig cap context.'],
        ['infoInicial', 'boolean', 'false', 'El panell comença desplegat.'],
        ['className', 'string', '—', 'Classes de més per al <dialog>.']
      ]}
      a11y={[
        'El focus comença a «Tancar» i, en tancar, torna a la foto que l’havia obert. Escape tanca.',
        'Les fletxes passen de foto des de qualsevol control del visor; + − i 0 amplien, redueixen i tornen a 1×; «i» plega i desplega el panell.',
        'El comptador és una regió viva educada («Imatge 3 de 20»). El panell és un <aside> amb nom, i el seu botó porta aria-expanded i aria-controls.',
        'Tots els botons tenen l’àrea tàctil de --sdp-touch. Amb moviment reduït, el zoom salta en lloc de lliscar.'
      ]}
      fes={[
        'Obrir-lo des d’una cel·la-botó de la graella i guardar la foto oberta a la URL (?foto=<id>, amb una entrada nova a l’historial).',
        'Passar els drets que toquen a cada origen: la foto d’un poble de la Viquipèdia, els de Wikimedia; una il·lustració d’IA, els de Sóc de Poble; una foto real, els seus o «No declarats».',
        'Amagar el GPS de la foto d’una persona.'
      ]}
      noFacis={[
        'Saltar a una pàgina externa o a una ruta pròpia de la foto: el visor s’obri damunt de la galeria.',
        'Demanar l’original sencer per a llegir-ne l’EXIF: n’hi ha prou amb els primers 256 KB.',
        'Posar «Fet per la IAIA» a una foto real.'
      ]}>
      <h4>Tres fotos de la casa: un clic obri el visor</h4>
      <div className="photo-grid">
        {FOTOS.map((foto, index) => (
          <button key={foto.src} type="button" className="photo-grid__boto" aria-haspopup="dialog" onClick={() => setOberta(index)}>
            <span className="photo-grid__item"><img src={foto.src} alt={foto.alt} loading="lazy" /></span>
          </button>
        ))}
      </div>
      <VisorImatges obert={oberta >= 0} imatges={FOTOS} index={Math.max(0, oberta)} onCanvi={setOberta}
        onTanca={() => setOberta(-1)} metadades={DADES[Math.max(0, oberta)]} infoInicial />
    </Especimen>
  );
}
