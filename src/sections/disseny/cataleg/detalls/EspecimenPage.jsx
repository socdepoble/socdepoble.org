import { useState } from 'react';
import { Maximize } from 'lucide-react';
import { Link } from '../../../../app/contexts/RouterContext.jsx';
import { Boto, PantallaCompleta, usePantallaCompleta } from '../../../../components/PedraSeca/index.js';
import { ETIQUETA_CANVIA_AVATAR, PageFrame } from '../../../../components/universal/PageFrame.jsx';
import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* Norma del Mestre, 261004 (prompt 261004_1108, T2; skill sdp-pedra-seca §9
   i §11) · El bloc del títol de PageFrame, de veres: davant de l'H1, l'avatar
   redó de qui signa quan és una persona o la IA (avatarAutor) o, quan signa
   una entitat, el seu logotip. Les mostres no porten H1 (la pàgina de Disseny
   ja porta el seu) ni barra blava (chrome 'page'); la taronja sí, perquè és
   universal, i dins del catàleg no s'enganxa (sdp-especimen__barres).
   La imatge és la d'un agent de la IA de la llavor (agentsSeed.js, Nano
   Banana): una il·lustració del projecte, cap foto d'una persona real.
   Ordre del Mestre (261021, pla 261021_0015 §12) · Súper Ratolí ja no és al
   catàleg d'assistents: signa Nano Banana, amb el seu avatar i el seu poble. */
const AVATAR_MOSTRA = '/assets/uploads/avatars/nano-banana-comic.png';
const DATA_MOSTRA = { time: '09:30', date: '04/10/26', dateTime: '2026-10-04T09:30' };
/* Sense ruta d'autoria: la boina no porta enlloc des del catàleg i no és la
   de Sóc de Poble (el seu perfil, Onada 8), de manera que PageFrame no hi
   posa logotip. */
const SIGNA_LA_IA = { authorName: 'Nano Banana', authorLocation: 'Xixona', authorAvatar: AVATAR_MOSTRA, authorHref: null };

/* Correcció del verificador (261004) · Dins de la columna del catàleg, tres
   farciments (el cos de la pàgina de Disseny, la caixa de l'espècimen i la
   capçalera) encongixen l'avatar a l'ample de la capçalera: 109px a 1280 i
   141px a 375, mesurats. La mida de veres, mesurada en una pàgina sola: 300px
   (--sdp-avatar-capcalera) i, en un mòbil de 375px, l'ample de la capçalera,
   279px. Sense CSS nova, la segona mostra s'obri amb la pantalla completa del
   catàleg (PantallaCompleta): l'avatar hi fa 300px en escriptori, i la càmera
   hi queda al cantó; a 375px, el marge del visor (--sdp-pad-contenidor) el
   deixa en 247px. El text de les mostres ho diu. */
const ETIQUETA_PANTALLA_COMPLETA = 'Veure-la a pantalla completa';
const TITOL_PANTALLA_COMPLETA = 'La pàgina és de qui mira, a pantalla completa';

export default function EspecimenPage() {
  const [avis, setAvis] = useState('Encara no has premut l’avatar.');
  const pantalla = usePantallaCompleta();
  const avatar = { src: AVATAR_MOSTRA, alt: 'Avatar de Nano Banana' };
  const canvia = () => setAvis(`Has premut «${ETIQUETA_CANVIA_AVATAR}»: a la pàgina de veres s’obriria el canvi d’imatge; al catàleg no fa res més.`);
  return (
    <>
    <Llinatge id="page" />
    <Especimen id="page" nom="UniversalPage · el crom de pàgina" fitxer="src/components/universal/UniversalPage.jsx"
        descripcio="NO és la bastida. És el que viu dins de la Finestra: barra blava (navegació de pàgina), imatge, barra taronja (autoria i data), capçalera amb h1 i article. Davant de l’H1, el bloc del títol porta el logotip de l’entitat que signa o, si signa una persona o la IA, el seu avatar redó."
        contracte={[           ['chrome', "'full'|'context'|'system'|'page'|'none'", "'page'", 'Si es pinta la barra blava (full, context i system) i la capçalera (tots menys none). La barra taronja no en depén: la porten tots (ordre del Mestre, 261004).'],           ['title / subtitle / lead', 'node', '—', 'h1 únic de la pàgina; h2 i entradeta.'],           ['labels', '(string|{ text, className, href, onClick })[]', '[]', 'Insígnies de taxonomia.'],
          ['heroImage / heroAlt', 'string', '—', 'Imatge de capçalera; heroAlt obligatori si informa.'],
          ['senseBarraTaronja', 'boolean', 'false', 'L’única excepció a la barra taronja universal: només true la lleva, i només per ordre explícita del Mestre. Hui no la passa cap pàgina.'],
          ['logoEntitat', '{ clar, fosc?, alt }', '—', 'El logotip de l’entitat que signa, dalt de l’H1 (norma del Mestre, 261004): amb fosc, una imatge per tema; sense, una sola, de fins a 600x600. Sense, una pàgina que signa Sóc de Poble (la boina enllaça al seu perfil, /empresa/socdepoble, Onada 8) porta el seu logotip rectangular; una persona o la IA, cap: porten el seu avatar (avatarAutor).'],
          ['senseLogo', 'boolean', 'false', 'L’única excepció al logotip de l’entitat: només true el lleva, i només per ordre explícita del Mestre, amb el motiu escrit al costat. Hui no la passa cap pàgina. No lleva el logotip que puja la persona a l’editor.'],
          ['avatarAutor', '{ src, alt, onCanvia?, etiquetaCanvia?, onLleva?, etiquetaLleva?, ajuda?, pujant? }', 'null', 'L’avatar redó de qui signa quan és una persona o la IA (norma del Mestre, 261004; skill sdp-pedra-seca §11), centrat davant de l’H1: --sdp-avatar-capcalera (300px), a l’ample de la capçalera en pantalla estreta. El passa qui sap que signa una persona o la IA (el detall d’un element, la fitxa pública d’un agent IA), mai s’endevina de la ruta de la boina. La fitxa d’una persona, pública o en lectura, no el porta (ordre del Mestre, 261022): la seua cara ja viu a la barra taronja; la de la IAIA porta el logotip de Sóc de Poble. src: un camí, una URL o un sdp-media:// (el resol el port); una adreça insegura o la marca de Sóc de Poble no es pinten. Va després de les vies del logotip: amb logotip, cap avatar, i senseLogo també el lleva. Amb onCanvia (la pàgina és de qui mira), és un botó «Canvia la teua imatge» amb la marca de la càmera. Contracte-1 (261008): amb onCanvia i etiquetaCanvia, davall de l’avatar una píndola de text visible que fa el mateix; amb onLleva i una imatge pintada, una segona píndola que la lleva (etiquetaLleva, per defecte «Llevar l’avatar»). Si la referència no es pot pintar (la marca, una adreça insegura, un sdp-media:// que el port no resol), les píndoles es pinten soles, la de llevar inclosa: la persona la pot substituir o buidar. Amb fila de píndoles (línia I1, pla 261008_1201): ajuda (text) pinta una línia .sdp-camp__ajuda sencera davall de les píndoles, i pujant (només true) les deixa disabled i aria-busy mentre la imatge puja. Sense eixes claus, el DOM de sempre.'],
          /* Decisió del Mestre (261008) · drets d'autor dins de l'editor. */
          ['onCanviaCopyright', '(event) => void', '—', 'Només l’editor (DocumentEditor, quan la persona pot triar els drets): el copyright de davall del títol és un botó amb la classe de l’enllaç, data-sdp-drets i el nom «text: canviar els drets d’autor», que obri la vista de drets dins de l’editor. Sense (lectura, connexions, l’estat buit i totes les targetes), l’enllaç a /page/drets-autor de l’ordre del 261007.'],
          /* Relleu 261007 (històric de l'actor, esmena 2 del pla 261007_1645) ·
             La ranura del peu, que el contracte encara no llistava.
             Gauntlet 261017 (WP7a) · Des del Gauntlet 261016 (Bloc 3.9, F45)
             el peu ja no va davall de l'editor: només de PublicacioDetall. */
          ['peuDePagina', 'node', 'null', 'El peu de la pàgina (esmena 2 del pla 261007_1645): després de l’article i de la traducció, dins del contenidor que fa scroll i fora de l’Índex (ni la traducció ni el Lector el recullen), en un section.sdp-pagina-peu. Hi va l’històric de l’actor (PublicacionsDeLActor) davall d’una publicació oberta al Bloc de Notes (PublicacioDetall); l’editor ja no en porta. Sense, el DOM de sempre.'],
          ['etiquetaPeuDePagina', 'string', '—', 'El nom accessible del section del peu (aria-label).'],
        ]}
        a11y={[
          'Un sol h1 per pàgina: les mostres del bloc del títol no en porten cap, perquè la pàgina de Disseny ja porta el seu. A la pàgina de veres, l’H1 va just davall de l’avatar o del logotip.',
          'Sense onCanvia, l’avatar és una imatge amb el seu alt. Amb onCanvia, és un botó amb nom («Canvia la teua imatge»); la càmera és decoració (aria-hidden) i fa 48px, l’objectiu tàctil sencer.',
          'La pantalla completa de la segona mostra és la del catàleg (PantallaCompleta): el focus comença a «Eixir», Escape també ix i, en eixir, el focus torna al botó que l’ha oberta.',
        ]}
        fes={['Un sol h1 per pàgina.', 'avatarAutor només quan qui signa és una persona o la IA, i mai a la fitxa d’una persona (ordre del Mestre, Gauntlet 261022_0225); quan signa una entitat, el seu logotip (logoEntitat, o res si signa Sóc de Poble).']}
        noFacis={['Rebatejar-la a «UniversalShell»: té desenes de consumidors.', 'Posar la marca de Sóc de Poble (el quadrat verd o el logotip) com a avatar d’una persona o de la IA: PageFrame no la pinta.']}>
      <p>Aquesta mateixa pàgina de Disseny és un espècimen viu de UniversalPage amb chrome=&quot;context&quot;.</p>

      <h3>Barra Blava (Navegació i Accions)</h3>
      <p>Organitzada en tres zones d'alta densitat (sense separació extra entre icones):</p>
      <ul>
        <li><strong>Esquerra:</strong> Controls de navegació, en aquest ordre: Arrere · Índex · Endavant. Les fletxes només hi són si la pàgina en té destí.</li>
        <li><strong>Centre:</strong> Eines contextuals (traducció, xat privat, compartir), centrades respecte a tota la barra.</li>
        <li><strong>Dreta:</strong> Botó d'acció principal (Connectar). Quan la barra fa 480px d'ample o menys, també en una columna estreta d'una pantalla gran, perd el text i queda un cercle amb «+».</li>
      </ul>

      <h3>Barra Taronja (Context i Autoria)</h3>
      <p>Tota pàgina la porta, també les de sistema i les que no tenen portada (ordre del Mestre, 261004). Sense autor propi, signa Sóc de Poble amb el seu logo i enllaça al seu perfil (Onada 8: la boina porta sempre al perfil de qui signa). Distribueix les metadades de l'element actiu:</p>
      <ul>
        <li><strong>Esquerra:</strong> Identitat visual (avatar), nom i poble.</li>
        <li><strong>Centre:</strong> L’emoticona del document (EmoticonaBarra): en edició, el botó que la tria; en lectura, només si n’hi ha una de triada.</li>
        <li><strong>Dreta:</strong> Hora i data en una pastilla de text, sense icona. Mai buida: en lectura, la de creació o la de l’última modificació; en edició, la triada al calendari o la d’ara. Una font de només dia es pinta sense hora. En lectura, la pastilla és un botó que obri el Calendari en el mes de la data, amb totes les targetes d’eixe mes (ordre del Mestre, 261001).</li>
      </ul>

      <h3>Bloc del títol: avatar o logotip</h3>
      <p>Tres PageFrame de veres, sense H1 (el d’esta pàgina ja hi és) i sense barra blava. Davant de l’H1 va qui signa: una persona o la IA, amb el seu avatar redó i cap logotip; una entitat, amb el seu logotip i cap avatar (norma del Mestre, 261004). La fitxa d’una persona n’és l’excepció (ordre del Mestre, 261022): la seua cara ja viu a la barra taronja i el bloc del títol comença per l’H1. Dins d’esta columna les mostres s’encongixen: no és la mida de la pàgina de veres.</p>
      <div className="sdp-especimen__targetes">
        <figure className="sdp-especimen__figura">
          <figcaption>Una persona o la IA: l’avatar redó, cap logotip</figcaption>
          <PageFrame className="sdp-especimen__barres" chrome="page" {...SIGNA_LA_IA} {...DATA_MOSTRA} avatarAutor={avatar}>
            <p>Ací l’avatar no fa la mida de la pàgina de veres: la columna del catàleg l’encongix a l’ample de la capçalera. A la pàgina de veres (el detall d’un element que signa una persona, la fitxa d’un agent IA) fa 300px (--sdp-avatar-capcalera), centrat; en pantalla estreta, l’ample de la capçalera: 279px en un mòbil de 375px. La fitxa d’una persona ja no el porta.</p>
          </PageFrame>
        </figure>
        <figure className="sdp-especimen__figura">
          <figcaption>La pàgina és de qui mira: l’avatar és un botó</figcaption>
          <PantallaCompleta oberta={pantalla.oberta} onTanca={pantalla.tanca} titol={TITOL_PANTALLA_COMPLETA}>
            <PageFrame className="sdp-especimen__barres" chrome="page" {...SIGNA_LA_IA} {...DATA_MOSTRA} avatarAutor={{ ...avatar, onCanvia: canvia }}>
              <p>Amb onCanvia, l’avatar porta la marca de la càmera, al cantó de baix, i obri el canvi d’imatge. A pantalla completa l’avatar fa els 300px de veres en escriptori; en un mòbil de 375px, 247px, perquè la pantalla completa hi afig el seu marge (a la pàgina de veres, 279px).</p>
              <p role="status">{avis}</p>
            </PageFrame>
          </PantallaCompleta>
          <Boto id={pantalla.idObridor} icona={Maximize} onClick={pantalla.obri} aria-haspopup="dialog">{ETIQUETA_PANTALLA_COMPLETA}</Boto>
        </figure>
        <figure className="sdp-especimen__figura">
          <figcaption>Signa l’entitat: el logotip de Sóc de Poble, cap avatar</figcaption>
          <PageFrame className="sdp-especimen__barres" chrome="page" {...DATA_MOSTRA} LinkComponent={Link}>
            <p>Sense autor propi, signa Sóc de Poble: la boina porta al seu perfil i el bloc del títol, el seu logotip.</p>
          </PageFrame>
        </figure>
      </div>
    </Especimen>
    </>
  );
}
