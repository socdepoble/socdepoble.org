import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import {
  ActionControl, IconButton, DateTimeControl, SelectorDataHora, BotoComentar, MenuComentar,
  BackIcon, ForwardIcon, IndexIcon, TranslateIcon, CommentIcon, ShareIcon, PinIcon, IaiaIcon
} from '../../../../components/PedraSeca/index.js';
/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · el rellotge viu no és a la façana:
   l'importa PaginaApp, i ací per la seua ruta (porta del catàleg, C2). */
import { RellotgeViu } from '../../../../components/PedraSeca/atoms/RellotgeViu.jsx';
import { BarraBlava } from '../../../../components/universal/barres/BarraBlava.jsx';
import { BarraTaronja } from '../../../../components/universal/barres/BarraTaronja.jsx';
import { BotoVisibilitat } from '../../../../components/universal/barres/BotoVisibilitat.jsx';
import { IconaEstatDesament } from '../../../../components/universal/EstatDesament.jsx';
import { MenuTraduir } from '../../../../components/universal/traduccio/MenuTraduir.jsx';
import { AvisTraduccio } from '../../../../components/universal/traduccio/TraduccioPagina.jsx';
import { usePastillaCalendari } from '../../../../components/universal/barres/pastillaCalendari.js';
import { LLENGUES_TRADUCCIO } from '../../../../data/traductor.js';

const res = () => {};

/* Ordre del Mestre, 261001 (tasca 4 i carril A) · La pastilla de la barra
   en lectura, amb hora i clicable com a les pàgines: porta al Calendari en
   el mes de la data (abril de 2026, /calendari?mes=2026-04), amb el router
   de veres. */
const DATA_LECTURA = { time: '11:00', date: '25/04/26', dateTime: '2026-04-25T11:00:00' };

/* T51 (ordre del Mestre, 260928) · Les barres de veres (components/universal/
   barres/), no còpies a mà: el catàleg ja no es pot desviar de PageFrame.
   La blava es pinta dues vegades, ampla i estreta, amb totes les accions.
   La barra d'edició porta el que porta la closca de l'editor
   (UniversalEditorShell, barActions): el núvol, la visibilitat i la
   pastilla de data. Cap pin: el pin «Ancorar» és de la caputxa de la
   UniversalCard (showPin). Els àtoms es veuen també a soles, com els fan
   servir la barra blava i el peu de la targeta, i així la porta del
   catàleg (C2) troba IconButton i ActionControl pintats de veres.
   Ordre del Mestre (261007) · «COMENTARIS = XAT» (correcció C4) · La barra
   porta comentarXat 'comu', com la d'una pàgina amb xat públic: Comentar
   obri el menú de dues vies. Tancada, cap píxel canvia. */
const BLAVA = {
  onBack: res, onForward: res, onIndex: res,
  traduirVisible: true, comentarVisible: true, compartirVisible: true, connectarVisible: true,
  onTranslate: res, onComment: res, onShare: res, onConnect: res,
  comentarXat: 'comu',
};
const AUTORIA = {
  authorName: 'Sóc de Poble',
  authorLocation: 'La Torre de les Maçanes',
  authorAvatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
};

/* La regla de la pastilla (decisió del Mestre, 260928), dita una sola vegada. */
const REGLA_DATA = 'Data sempre plena, mai buida, mai guionets ni inventada. En edició, la data triada al calendari (SelectorDataHora) o, si no se n’ha triat cap, la d’ara; mai la de l’última edició. En lectura, la de creació, o la de l’última modificació si és posterior.';

/**
 * Els botons que viuen damunt de les barres de color. Dues formes i prou:
 * cercle (icona) i pastilla (text). La pell és una sola família a
 * components.css («CONTROLS DE BARRA»); els àtoms són a atoms/controls.jsx.
 */
export default function EspecimenControlsBarra() {
  const [dataTriada, setDataTriada] = useState(null);
  const alCalendari = usePastillaCalendari(DATA_LECTURA);
  return (
    <>
    <Llinatge id="barres" />
    <Especimen id="controls-barra" nom="Controls de barra · BarraBlava · BarraTaronja · IconButton · ActionControl · DateTimeControl · RellotgeViu · BotoComentar · MenuComentar" fitxer="src/components/universal/barres/ · universal/EmoticonaBarra.jsx · PedraSeca/atoms/controls.jsx · atoms/RellotgeViu.jsx · atoms/icones.jsx · PedraSeca/organismes/Comentar.jsx"
      descripcio="Les dues barres de color de PageFrame, que són components propis (T51): la blava de navegació de pàgina i la taronja d’autoria (autoria · emoticona · data). Els seus botons, i els del peu de la UniversalCard, són una sola família visual: cercles de 48px per a icones (44px, a tocar, als dos packs de la barra blava), pastilles de 48px per a text, mateix hover (vel blanc) i cap transform. A la barra blava mana l’ample de la BARRA, no el de la finestra: amb 480px o menys, CONNECTAR perd la paraula i queda el «+» en un cercle. A la taronja totes les icones són blanques dins d’un cercle de vel fosc."
      contracte={[
        ['BarraBlava', 'onBack · onForward · onIndex · *Visible · onTranslate · onComment · onShare · onConnect · comentarXat · accionsInoperatives · menuTraduir', '—', 'Presentacional: PageFrame hi posa useAccions. Sense onBack/onForward, la fletxa no es pinta.'],
        ['BarraBlava.comentarXat', "'comu' | 'privat' | null", 'null', 'Què oferix el menú de Comentar (BotoComentar i MenuComentar; ordre del Mestre, 261007, «Comentaris = xat»): \'comu\', les dues vies; \'privat\', «En públic» desactivada i amb la raó; null (un onComment propi o l’editor), cap menú. El botó es diu sempre «Comentar»; la via triada va a onComment(\'privat\' | \'public\').'],
        ['MenuComentar.ambPublic / mostra', 'boolean / boolean', 'false / false', 'Sense ambPublic, la fila «En públic» porta aria-disabled i diu «Ací encara no hi ha cap xat públic.». Amb mostra, el catàleg el pinta obert i quiet: no furta el focus, no escolta la pàgina i no tria (el mateix contracte que MenuTraduir).'],
        ['BarraBlava.menuTraduir', '{ obert, opcions, actual, onTria, onTanca } | null', 'null', 'Traductor Sobirà (260930): el posa useAccions quan l’amfitrió oferix el servei (externalConfig.traductorUrl). Traduir diu que obri un menú (aria-haspopup, aria-expanded) i, obert, MenuTraduir es pinta just després del botó. Sense servei, el clic avisa «La traducció automàtica no està disponible en este servidor.» i no hi ha menú.'],
        ['BarraTaronja.author*', 'string', '—', 'Nom, poble, avatar (es resol i es valida ací) i ruta del perfil (T4).'],
        ['BarraTaronja.emoticona / onObriEmoticona', 'string / fn', "'' / null", 'L’espai central (EmoticonaBarra). Amb onObriEmoticona, botó que obri el diàleg (la ploma blanca sense emoticona); sense, lectura: l’emoticona triada o la cel·la buida.'],
        ['BarraTaronja.barActions', 'node', 'null', 'Les accions de la dreta; mana sobre la pastilla per defecte (time · date · dateTime · onDateTime).'],
        ['BarraTaronja.etiquetaData', 'string', '—', 'Nom accessible de la pastilla per defecte. En lectura, la UniversalPage hi posa l’hora, el dia (en l’ordre en què es veuen) i on porta: «11:00 25/04/26 · Obri el calendari d’eixe mes».'],
        ['IconButton.label', 'string', '—', 'Nom accessible obligatori; és el títol del botó.'],
        ['IconButton.className', 'string', "''", 'Classes de lloc: a la barra blava, bar-blue-left__arrere i bar-blue-left__endavant (T53) o la de l’acció inoperativa.'],
        ['IconButton.onClick / presentation', 'fn / boolean', '—', 'Sense onClick ni presentation no es pinta; presentation el mostra desactivat sense semblar apagat.'],
        ['ActionControl.className', 'string', '—', 'El botó de base (IconButton el fa servir). btn-connectar per a l’acció principal (pastilla blava fosca), amb els spans sp-card-connect-text i sp-card-connect-plus; btn-icon-orange per al pin «Ancorar» de la caputxa de la UniversalCard (cercle de vel fosc, icona blanca).'],
        ['DateTimeControl.time / date / dateTime', 'string', '—', 'Pastilla amb hora i data; amb onClick és <button>, sense és <time>. Una font de només dia es pinta sense hora: l’hora no s’inventa.'],
        ['DateTimeControl.label', 'string', '«Data i hora: …»', 'Nom accessible. En lectura (pàgina i targeta) diu l’hora, el dia (en l’ordre en què es veuen, WCAG 2.5.3) i on porta el clic: el Calendari en el mes de la data, amb totes les targetes d’eixe mes (/calendari?mes=AAAA-MM).'],
        ['RellotgeViu.rellotge / etiqueta', '() => ms / string', '— / «Data i hora d’ara: hh:mm del dd/mm/aa»', 'La data i l’hora d’ara, vives (ordre del Mestre, 13-10-2026): la pastilla de sempre, sense clic ni regió viva, renovada al canvi de cada minut amb un sol temporitzador (useAra), que es neteja en desmuntar i es resincronitza en tornar a primer pla. rellotge és el rellotge injectat (la Gestoria, les proves); sense, el del dispositiu. No és a la façana: el posa PaginaApp amb rellotgeViu, a l’extrem dret de la barra taronja.']
      ]}
      a11y={['Cada icona porta aria-label i title amb l’objecte: «Comentar Samarreta…».', 'Zona tàctil de 48px en totes les formes; als packs de la barra blava, el sòl de 44px (--sdp-touch).', 'Focus visible dins de la barra amb --sdp-accent-text (blava) o --sdp-crom-focus (closca).']}
      fes={[
        'Icones de 24px, traç 2: les mateixes que .icon a tot el sistema.',
        'Ordre fix a la barra blava (Mestre, 260924): Arrere · Índex · Endavant ‖ Traduir · Comentar · Compartir … Connectar.',
        'Tres columnes (T37, 260928): navegació a l’esquerra, el trio Traduir · Comentar · Compartir centrat respecte a tota la barra i Connectar a la dreta. En barres estretes, on el pack de navegació no deixa lloc, el trio s’hi acosta tant com pot sense solapar-lo.',
        'Dins de cada pack les cel·les de 44px es toquen. Les fletxes porten més aire dins del dibuix que el llibre, i per això (T53) cada fletxa acosta el glif al llibre dins de la seua cel·la (bar-blue-left__arrere, bar-blue-left__endavant): de tinta a tinta, el pack de navegació es llig com el trio. La cel·la tàctil no canvia.',
        'Connectar porta sempre els dos spans, sp-card-connect-text i sp-card-connect-plus, i la CSS en mostra un: el «+» amb 480px d’ample de barra o menys (@container), amb la @media de 480px com a xarxa per als navegadors sense @container.',
        'Barra taronja en tres columnes (T51, 260928): autoria a l’esquerra, l’espai central de l’emoticona al centre exacte de la barra i les accions amb la data a la dreta.',
        'La ploma (lucide Feather) vol dir «triar l’emoticona». A la barra taronja, la ploma blanca és el botó d’emoticona de l’espai central, en edició i mentre no n’hi ha cap; la botonera de classificació, davall del títol, també la mostra al seu botó Emoticona quan no n’hi ha cap. En lectura mai no hi ha ploma.',
        'El desament es diu amb el núvol (CloudUpload): canvis que el servidor encara no té. Si falla, un avís.',
        'Totes les icones de la barra taronja són blanques dins del cercle de vel fosc: el núvol, el cadenat o la bola del món i la ploma. A la caputxa de la UniversalCard, el pin «Ancorar» també.',
        REGLA_DATA
      ]}
      noFacis={['Barrejar quadrats i cercles a la mateixa barra.', 'Icones negres damunt del taronja, o blanques sense el cercle de vel fosc (no arriben al contrast de 3:1).', 'Copiar a mà el marcatge d’una barra: el catàleg fa servir BarraBlava i BarraTaronja.', 'Posar a la pastilla la data de l’última edició mentre s’edita, o deixar-la buida.', 'Text per davall de 14px a la pastilla «Connectar».', 'Escalar el botó en hover: el sistema canvia el fons, no la mida.']}>

      <h4>Barra blava (navegació de pàgina)</h4>
      <div className="sdp-especimen__barres sdp-especimen__barres--contenidor">
        <BarraBlava {...BLAVA} />
      </div>
      <p>La mateixa barra en una columna de 28rem: CONNECTAR passa a «+» i el trio continua centrat a la barra.</p>
      <div className="sdp-especimen__barres sdp-especimen__barres--contenidor sdp-especimen__barres--estreta">
        <BarraBlava {...BLAVA} />
      </div>

      <h4>Traduir: el menú de llengües i l’avís (Traductor Sobirà)</h4>
      <p>A la pàgina, Traduir obri este menú just davall de la barra, centrat com el trio. La llista és tancada: Castellà, Anglés, Francés i Alemany i, amb la pàgina ja traduïda, «Original (valencià)». Es tanca en triar, en clicar fora o amb Escape, i el focus torna a Traduir. Es traduïx text, mai HTML: el títol i els blocs de lectura es tornen a pintar com a elements, amb el seu lang. Ací, obert i quiet (la mostra no furta el focus), amb la pàgina en castellà.</p>
      <div className="sdp-especimen__fila">
        <MenuTraduir opcions={LLENGUES_TRADUCCIO} actual="ES" onTria={res} onTanca={res} mostra />
      </div>
      <AvisTraduccio llengua="ES" onOriginal={res} />
      <AvisTraduccio carregant="FR" />

      <h4>Comentar: en privat o en públic</h4>
      <p>Ordre del Mestre (261007): no hi ha fil de comentaris davall de cap publicació, el debat és un xat. Comentar és el mateix botó a la barra blava i al peu de la targeta, i obri este menú just després del botó, amb el comportament del de Traduir (focus a la primera fila, Escape, clic fora, fletxes). «En privat» porta al xat només entre la persona i l’autor de l’element, encara que no el conega, i la línia en diu el nom (Onada 8); amb Sóc de Poble, sense autor o amb una publicació pròpia, al xat amb Sóc de Poble. «En públic», al xat obert de l’element, amb el seu títol com a nom. Sense xat públic, la fila es queda enfocable però desactivada i diu per què. Com a les apps de missatgeria, dues files grans amb icona i una línia que diu on porta; com a molt 300px d’ample. Ací, obert i quiet: amb la via pública i sense, i amb una autora.</p>
      <div className="sdp-especimen__fila">
        <MenuComentar ambPublic onTria={res} onTanca={res} mostra />
        <MenuComentar onTria={res} onTanca={res} mostra />
        <MenuComentar ambPublic privatAmb="Maria" onTria={res} onTanca={res} mostra />
      </div>
      <p>El botó, a soles: tancat, només diu que obri un menú (aria-haspopup, aria-expanded).</p>
      <div className="sdp-especimen__fila">
        <BotoComentar label="Comentar l’espècimen (menú)" comentarXat="comu" onComment={res} />
      </div>

      <h4>Barra taronja en lectura (autoria · emoticona · data)</h4>
      <p>Tres columnes. Al centre, només l’emoticona triada; sense, la cel·la queda buida i la data continua a la dreta. La data és la de creació, o la de l’última modificació si és posterior, amb l’hora si la font en té. La pastilla és un botó: porta al Calendari en el mes de la data, amb totes les targetes d’eixe mes.</p>
      <div className="sdp-especimen__barres">
        <BarraTaronja {...AUTORIA} emoticona="🍅" etiqueta="Autoria i data (espècimen, lectura)"
          {...DATA_LECTURA} onDateTime={alCalendari.onClick} etiquetaData={alCalendari.etiqueta} />
      </div>

      <h4>Barra taronja en edició</h4>
      <p>Al centre, el botó d’emoticona: la ploma blanca vol dir «tria l’emoticona». A la dreta, el que hi posa la closca de l’editor (UniversalEditorShell): el núvol dels canvis pendents, la visibilitat (cadenat o bola del món) i la pastilla de data: sense data triada, la d’ara; en triar un dia al calendari, el triat. Totes les icones són blanques dins del cercle de vel fosc. Cap pin: el pin «Ancorar» viu a la caputxa de la UniversalCard (showPin), als avisos del Mur.</p>
      <div className="sdp-especimen__barres">
        <BarraTaronja {...AUTORIA} onObriEmoticona={res} etiqueta="Autoria i data (espècimen, edició)"
          barActions={(
            <>
              <IconaEstatDesament estat="pendent" />
              <BotoVisibilitat etiqueta="Privat: canviar la visibilitat" onObri={res} />
              <SelectorDataHora valor={dataTriada} onTria={setDataTriada} />
            </>
          )} />
      </div>

      <h4>Els àtoms, a soles</h4>
      <p>IconButton fa el cercle transparent de la barra blava i del peu de la targeta; ActionControl és el botó de base: ací, la pastilla CONNECTAR amb els seus dos spans, i a la caputxa de la UniversalCard, el pin «Ancorar» (btn-icon-orange). DateTimeControl és la pastilla de data: amb onClick és un botó (en lectura, la UniversalPage i la UniversalCard hi posen el clic que obri el Calendari en el mes de la data); sense onClick, un &lt;time&gt; que no es clica (l’editor sense calendari i les targetes amb onDateTime={'{false}'}).</p>
      <div className="sdp-especimen__fila">
        <IconButton label="Comentar l’espècimen" onClick={res}><CommentIcon className="icon" /></IconButton>
        <IconButton label="Compartir l’espècimen (presentation)" presentation><ShareIcon className="icon" /></IconButton>
        <ActionControl className="btn-connectar sp-card-connect" label="Connectar amb l’espècimen" onClick={res}>
          <span className="sp-card-connect-text">Connectar</span>
          <span className="sp-card-connect-plus" aria-hidden="true">+</span>
        </ActionControl>
      </div>
      <div className="sdp-especimen__barres">
        <BarraTaronja {...AUTORIA} etiqueta="Autoria i data (espècimen, pastilla de només lectura)"
          barActions={<DateTimeControl time="11:00" date="25/04/26" dateTime="2026-04-25T11:00:00" />} />
      </div>

      <h4>Rellotge viu (les apps que el demanen)</h4>
      <p>Ordre del Mestre (13-10-2026): a la Gestoria, la barra taronja porta SEMPRE la data i l’hora d’ara a l’extrem dret, darrere de les seues accions. És una excepció ordenada a la regla de la pastilla, que és la data del document: PageFrame no s’inventa mai l’hora d’ara, i el rellotge només el posa PaginaApp quan la pàgina el demana (rellotgeViu). És la pastilla de sempre, amb el format únic de les barres (hh:mm i dd/mm/aa), sense clic i sense anunciar-se a cada minut.</p>
      <div className="sdp-especimen__barres">
        <BarraTaronja {...AUTORIA} etiqueta="Autoria i rellotge viu (espècimen, apps)" barActions={<RellotgeViu />} />
      </div>

      <h4>Icones pròpies</h4>
      <p>SVG de la casa a <code>atoms/icones.jsx</code>; la resta d’icones del sistema són de lucide-react.</p>
      <div className="sdp-especimen__fila sdp-especimen__icones">
        <span title="IaiaIcon"><IaiaIcon className="icon" /></span>
        <span title="BackIcon"><BackIcon className="icon" /></span>
        <span title="ForwardIcon"><ForwardIcon className="icon" /></span>
        <span title="IndexIcon"><IndexIcon className="icon" /></span>
        <span title="TranslateIcon"><TranslateIcon className="icon" /></span>
        <span title="CommentIcon"><CommentIcon className="icon" /></span>
        <span title="ShareIcon"><ShareIcon className="icon" /></span>
        <span title="PinIcon"><PinIcon className="icon" /></span>
      </div>
    </Especimen>
    </>
  );
}
