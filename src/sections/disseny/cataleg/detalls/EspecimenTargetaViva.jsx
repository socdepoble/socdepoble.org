import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import { AVISOS_TARGETA_VIVA, BotoTargetaViva, TargetaViva } from '../../../../components/universal/TargetaViva.jsx';

/* T50 (decisió del Mestre, 260928: «Llista + dreta si hi cap») · La targeta
   viva REAL (TargetaViva i el xip BotoTargetaViva), amb els textos d'avís de
   cada consumidor (AVISOS_TARGETA_VIVA: el Bloc de Notes promet la publicació
   al Mur; el Perfil no en promet cap). Els tres llocs diuen el mateix text:
   la fitxa de la llista (NotaFitxa, PerfilShell) i l'aside i el xip de
   l'editor, que el reben de DocumentEditor (avisTargetaViva). CONTRACTE-3
   (261008) · El Perfil no munta el xip: la targeta en línia viu a «Les
   vistes» (DetallVistes), i l'espècimen ja no en pinta cap del Perfil. Documents de
   mostra fixos: la targeta viva és EDICIÓ (el que es publicaria ara), i per
   això sense data triada la pastilla diu la d'ara i, amb una data triada al
   calendari, la triada. */

const AUTORIA = Object.freeze({ nom: 'Sóc de Poble', poble: 'La Torre de les Maçanes', avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' });
const ETIQUETES = Object.freeze([{ text: 'Agricultura', className: 'sdp-badge-category' }, { text: 'tomaca', className: 'sdp-badge-tag' }]);

const NOTA_SENSE = Object.freeze({
  title: 'Planter de tomaques de la Font',
  subtitle: 'Quan i com el sembrem enguany',
  lead: 'El dissabte repartim el planter a la plaça. Porta una caixa i el teu nom a la llista.',
});
const NOTA_AMB = Object.freeze({
  ...NOTA_SENSE,
  icon: '🍅',
  heroImage: '/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.png',
  publishDate: '2026-10-12T09:00:00',
});
/* Al Perfil, el document és la fitxa: nom, biografia i lema (PerfilEditor). */
const FITXA = Object.freeze({
  title: 'Maria de la Font',
  subtitle: 'Hortolana i veïna de la Torre',
  lead: 'Si tens planter de sobra, passa per casa: el canviem.',
});

function Mostra({ peu, children }) {
  return (
    <figure className="sdp-especimen__figura">
      <figcaption>{peu}</figcaption>
      {children}
    </figure>
  );
}

export default function EspecimenTargetaViva() {
  return (
    <>
      <Llinatge id="targeta-viva" />
      <Especimen id="targeta-viva" nom="TargetaViva · la targeta del document mentre s’escriu"
        fitxer="src/components/universal/TargetaViva.jsx · targetaViva.js · documentViu.js"
        descripcio="La mateixa UniversalCard que tindrà el document (variant pla): caputxa taronja, cos i peu blau. Els botons ensenyen les proporcions però no fan res: en clicar-ne un, un diàleg ho explica amb el text del seu consumidor. L’emoticona només apareix a la caputxa si s’ha triat."
        contracte={[
          ['document', '{ title, subtitle, lead, heroImage, icon, copyright, publishDate, … }', '—', 'El de l’editor: els camps de text són HTML sanejat i es pinten en text pla; un camp buit diu el text de llavor.'],
          ['autor / etiquetes', '{ nom, avatar, poble } / labels', 'null / []', 'La mateixa autoria de la barra taronja de l’editor i les píndoles del document.'],
          ['avis', '{ titol, descripcio, vista }', 'la reserva', 'El text de cada consumidor: AVISOS_TARGETA_VIVA.notes o .perfil. Sense, la reserva (AVIS_PREVISUALITZACIO), que no promet cap publicació.'],
          ['onMainClick / actual', 'fn / boolean', '— / false', 'A la llista, tornar a triar la fitxa i marcar-la com a triada (aria-current).'],
          ['BotoTargetaViva', '{ document, autor, etiquetes, avis }', '—', 'El xip «Vista targeta» i el seu diàleg (descripció: avis.vista). La targeta només es munta amb el diàleg obert. Hui només el munta el Bloc de Notes: amb ambVistes={false} (el Perfil), DocumentEditor no el pinta.'],
          ['adapter.avisTargetaViva', '{ titol, descripcio, vista }', 'la reserva', 'L’avís que l’editor passa a l’aside i al xip: NotesEditor hi posa AVISOS_TARGETA_VIVA.notes; PerfilEditor, .perfil (al Perfil només el llig l’aside: no hi ha xip). Així la llista, l’aside i el xip diuen el mateix text.'],
          ['propsDeTargetaViva', '(document, { autor, etiquetes, ara }) => props', '—', 'Funció pura (targetaViva.js): el document dit com a props de UniversalCard, una sola traducció per als tres llocs.'],
          ['useDocumentViu', 'hook (documentViu.js)', '—', 'La llista llig el document viu per clau; l’editor el publica amb usePublicaDocumentViu (el Perfil ho fa així).'],
          ['DetallVistes (Perfil)', '{ identitat }', '—', 'Ordre del Mestre (261008) · L’apartat «Les vistes»: la targeta en línia amb AVISOS_TARGETA_VIVA.perfil. L’editor ja no hi és muntat: el document es refà amb documentDeFitxa, la fitxa del servidor i l’esborrany que encara guarda la cua (useAutodesament).'],
        ]}
        a11y={[
          'El xip anuncia que obri una finestra (aria-haspopup="dialog").',
          'Els botons de la targeta conserven el seu nom («Comentar {títol}»…); en clicar-los, el diàleg del sistema explica per què no fan res, amb Escape i trampa de focus.',
          'A la llista, la fitxa triada porta aria-current="true", com la compacta.'
        ]}
        fes={[
          'Llista + dreta si hi cap (decisió del Mestre, 260928): la fitxa activa de la llista és la targeta viva; amb l’editor de 60rem o més, un aside fix a la dreta (--sdp-targeta-viva-ample) amb scroll propi; si no hi cap, o el navegador no coneix @container, el xip «Vista targeta» davall del títol obri el diàleg (al Bloc de Notes; al Perfil, la targeta es veu a «Les vistes»).',
          'Passar a cada consumidor el seu text, als tres llocs (la fitxa de la llista amb avis, l’aside i el xip amb la clau avisTargetaViva de l’adaptador de DocumentEditor): el Bloc de Notes parla de la publicació al Mur; el Perfil, de la fitxa en format targeta.',
          'Al Perfil, «Vista A4 / PDF», «Crear portada» i «Vista targeta» viuen a l’apartat «Les vistes» (ordre del Mestre, 261008), fora de l’espai d’edició; al Bloc de Notes continuen davall del títol.'
        ]}
        noFacis={[
          'Prometre al Perfil una targeta publicada que no existix.',
          'Posar la ploma de la llista a la caputxa: la caputxa només porta l’emoticona triada.',
          'Fer que els botons de la previsualització naveguen o publiquen.'
        ]}>
        <h4>Bloc de Notes: sense emoticona i amb emoticona</h4>
        <div className="sdp-especimen__targetes">
          <Mostra peu="Sense emoticona ni data triada: la caputxa no té centre i la data és la d’ara.">
            <TargetaViva document={NOTA_SENSE} autor={AUTORIA} etiquetes={ETIQUETES} avis={AVISOS_TARGETA_VIVA.notes} />
          </Mostra>
          <Mostra peu="Amb 🍅, capçalera i una data triada al calendari: l’emoticona al centre de la caputxa i la data triada.">
            <TargetaViva document={NOTA_AMB} autor={AUTORIA} etiquetes={ETIQUETES} avis={AVISOS_TARGETA_VIVA.notes} />
          </Mostra>
        </div>
        <h4>Perfil: la fitxa en format targeta</h4>
        <div className="sdp-especimen__targetes">
          <Mostra peu="Sense emoticona triada: la caputxa no té centre, i l’avís del Perfil no promet cap publicació.">
            <TargetaViva document={FITXA} autor={AUTORIA} avis={AVISOS_TARGETA_VIVA.perfil} />
          </Mostra>
        </div>
        <h4>Si no hi cap a la dreta: el xip «Vista targeta»</h4>
        <p>Al Bloc de Notes viu davall del títol, amb «Vista A4 / PDF» i «Crear portada», i diu el text del seu consumidor, el que l’editor rep a avisTargetaViva:</p>
        <BotoTargetaViva document={NOTA_AMB} autor={AUTORIA} etiquetes={ETIQUETES} avis={AVISOS_TARGETA_VIVA.notes} />
        <p>Al Perfil no hi ha xip: l’editor de la fitxa no el munta (ambVistes={'{false}'}) i l’apartat «Les vistes» pinta la targeta en línia, amb l’avís del Perfil, com la fitxa de dalt.</p>
      </Especimen>
    </>
  );
}
