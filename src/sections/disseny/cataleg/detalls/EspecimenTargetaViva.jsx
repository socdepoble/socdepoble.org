import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import { AVISOS_TARGETA_VIVA, BotoTargetaViva, TargetaViva } from '../../../../components/universal/TargetaViva.jsx';
import { RUTA_PERFIL_PROJECTE } from '../../../../config/navigation.js';

/* T50 (decisió del Mestre, 260928: «Llista + dreta si hi cap») · La targeta
   viva REAL (TargetaViva i el xip BotoTargetaViva), amb els textos d'avís de
   cada consumidor (AVISOS_TARGETA_VIVA: el Bloc de Notes promet la publicació
   al Mur; el Perfil no en promet cap). Cada lloc diu el text del seu
   consumidor: la fitxa de la llista (NotaFitxa, PerfilShell) i «Les vistes»
   del Perfil (DetallVistes). Bloc 3.4 del Gauntlet (261016) · Cap editor
   munta ja l'aside de la dreta ni el xip «Vista targeta»: Notes els va
   llevar a P4, el Perfil al pla 261015, i DocumentEditor ha perdut les claus
   targetaViva i avisTargetaViva. El xip només es veu ací. Documents de
   mostra fixos: la targeta viva és EDICIÓ (el que es publicaria ara), i per
   això sense data triada la pastilla diu la d'ara i, amb una data triada al
   calendari, la triada. */

/* Onada 8 (261009) · La boina porta al perfil de qui signa, com a l'editor. */
const AUTORIA = Object.freeze({ nom: 'Sóc de Poble', poble: 'La Torre de les Maçanes', avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png', ruta: RUTA_PERFIL_PROJECTE });
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
          ['autor / etiquetes', '{ nom, avatar, poble, ruta } / labels', 'null / []', 'La mateixa autoria de la barra taronja de l’editor i les píndoles del document. Amb ruta (Onada 8), la boina enllaça al perfil de qui signa i navega, com l’enllaç dels drets; sense, text.'],
          ['avis', '{ titol, descripcio, vista }', 'la reserva', 'El text de cada consumidor: AVISOS_TARGETA_VIVA.notes o .perfil. Sense, la reserva (AVIS_PREVISUALITZACIO), que no promet cap publicació.'],
          ['onMainClick / actual', 'fn / boolean', '— / false', 'A la llista, tornar a triar la fitxa i marcar-la com a triada (aria-current).'],
          ['BotoTargetaViva', '{ document, autor, etiquetes, avis }', '—', 'El xip «Vista targeta» i el seu diàleg (descripció: avis.vista). La targeta només es munta amb el diàleg obert. Hui només el munta este catàleg: cap editor el pinta des que DocumentEditor va perdre la clau targetaViva (Bloc 3.4, 261016).'],
          ['propsDeTargetaViva', '(document, { autor, etiquetes, ara }) => props', '—', 'Funció pura (targetaViva.js): el document dit com a props de UniversalCard, una sola traducció per a tots els llocs on es veu.'],
          ['useDocumentViu', 'hook (documentViu.js)', '—', 'La llista llig el document viu per clau; l’editor el publica amb usePublicaDocumentViu (el Perfil ho fa així).'],
          ['DetallVistes (Perfil)', '{ identitat }', '—', 'Ordre del Mestre (261008) · L’apartat «Les vistes»: la targeta en línia amb AVISOS_TARGETA_VIVA.perfil. L’editor ja no hi és muntat: el document es refà amb documentDeFitxa, la fitxa del servidor i l’esborrany que encara guarda la cua (useAutodesament).'],
        ]}
        a11y={[
          'El xip anuncia que obri una finestra (aria-haspopup="dialog").',
          'Els botons de la targeta conserven el seu nom («Comentar {títol}»…); en clicar-los, el diàleg del sistema explica per què no fan res, amb Escape i trampa de focus.',
          'A la llista, la fitxa triada porta aria-current="true", com la compacta.'
        ]}
        fes={[
          'Llista + dreta si hi cap (decisió del Mestre, 260928): la fitxa activa de la llista és la targeta viva. La dreta de l’editor s’ha retirat: cap editor munta l’aside fix ni el xip «Vista targeta» davall del títol (el Bloc de Notes els va llevar a P4; el Perfil, al pla 261015). Al Perfil, la targeta es veu també en línia a «Les vistes».',
          'Passar a cada consumidor el seu text amb avis, allà on es pinta la targeta (la fitxa de la llista i «Les vistes»): el Bloc de Notes parla de la publicació al Mur; el Perfil, de la fitxa en format targeta.',
          'Al Perfil, «Vista A4 / PDF», «Crear portada» i «Vista targeta» viuen a l’apartat «Les vistes» (ordre del Mestre, 261008), fora de l’espai d’edició; al Bloc de Notes, «Vista A4 / PDF» i «Crear portada» continuen davall del títol.'
        ]}
        noFacis={[
          'Tornar a muntar la targeta viva al costat de l’editor (l’aside de la dreta o el xip davall del títol): es va retirar a P4 i al pla 261015.',
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
        <h4>El xip «Vista targeta», sense cap editor que el munte</h4>
        <p>Cap editor el munta ja: l’aside de la dreta i este xip han eixit de DocumentEditor (el Bloc de Notes els va llevar a P4 i el Perfil, al pla 261015). Es conserva com a peça de TargetaViva.jsx, ací amb el text del Bloc de Notes; muntar-lo en una pantalla és decisió del Mestre:</p>
        <BotoTargetaViva document={NOTA_AMB} autor={AUTORIA} etiquetes={ETIQUETES} avis={AVISOS_TARGETA_VIVA.notes} />
        <p>Al Perfil, l’apartat «Les vistes» pinta la targeta en línia, amb l’avís del Perfil, com la fitxa de dalt.</p>
      </Especimen>
    </>
  );
}
