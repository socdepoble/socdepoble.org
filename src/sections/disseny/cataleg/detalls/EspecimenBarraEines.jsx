import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import UniversalToolbar from '../../../../components/universal/UniversalToolbar.jsx';
import { SelectorVisibilitat } from '../../../../components/universal/SelectorVisibilitat.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · La barra d'eines REAL de l'editor, en els
   estats que es donen a l'app. No és la barra blava (header.bar-blue de
   PageFrame): és la barra d'eines que DocumentEditor pinta damunt de la pàgina
   a través d'UniversalRichTextToolbar. Tot és local: cap canvi ix de
   l'espècimen. Esmena D5 de la revisió de T52a · la fletxa de tornar també:
   sense onBack, obriria el llistat de l'AppGridShell real de Disseny. */

const FORMATS = Object.freeze([
  ['isHeading', 'toggleHeading'],
  ['isSubheading', 'toggleSubheading'],
  ['isBold', 'toggleBold'],
  ['isItalic', 'toggleItalic'],
  ['isStrike', 'toggleStrike'],
  ['isList', 'toggleList'],
]);

/* Estat de format de mostra: cada botó alterna el seu. En l'editor, l'estat i
   les accions els dona el motor (useTipTapToolbarAdapter), mai la barra. */
function useFormatDeMostra() {
  const [actius, setActius] = useState(() => ({ isBold: true }));
  const formatState = actius;
  const formatActions = Object.fromEntries(FORMATS.map(([estat, accio]) => [
    accio, () => setActius((previ) => ({ ...previ, [estat]: !previ[estat] }))
  ]));
  return { formatState, formatActions };
}

export default function EspecimenBarraEines() {
  const format = useFormatDeMostra();
  const [avis, setAvis] = useState('Encara no has premut cap acció.');
  const [selector, setSelector] = useState(false);
  const [publica, setPublica] = useState(false);
  const torna = () => setAvis('Has premut la fletxa: dins d’un gestor en estret, tornaria al llistat.');
  return (
    <>
      <Llinatge id="barra-eines" />
      <Especimen id="barra-eines" nom="UniversalToolbar · la barra d’eines de l’editor"
        fitxer="src/components/universal/UniversalToolbar.jsx"
        descripcio="Format del text (Títol, Subtítol, Negreta, Cursiva, Ratllat i Llista), Borrar i Publicar. La barra és muda: rep l’estat i les accions i només les crida. Mesura la seua amplada: per davall de 500px el format es plega darrere del botó «Aa». La fletxa de tornar a la llista només es veu dins d’un gestor en estret."
        contracte={[
          ['formatState', '{ isHeading, isSubheading, isBold, isItalic, isStrike, isList }', '{}', 'Quins formats estan actius (aria-pressed).'],
          ['formatActions', '{ toggleHeading, …, toggleList }', '{}', 'Sense l’acció, el botó ix desactivat.'],
          ['onPublish / publishDisabled', '() => void / boolean', '— / false', 'Sense onPublish no hi ha botó Publicar.'],
          ['publishLabel', 'string | null', 'null', 'Una nota connectada no es publica: es compartix («Compartir»).'],
          ['publishPopup', "'dialog' | null", 'null', 'Publicar obri una finestra (SelectorVisibilitat): el botó ho anuncia amb aria-haspopup.'],
          ['onDelete / deleteDisabled', '() => void / boolean', '— / false', 'Sense onDelete no hi ha botó Borrar.'],
          ['onBack', '() => void', 'obri el llistat', 'La fletxa de tornar (només en estret); per defecte obri la columna del llistat d’AppGridShell.'],
          ['t', '(clau, text) => string', 'el text', 'Traducció dels noms dels botons.'],
        ]}
        a11y={[
          'role="group" amb nom «Eines de l’editor»; el format és un altre grup amb nom propi.',
          'Els botons de format són commutadors: aria-pressed i nom accessible (aria-label), perquè només es veu la icona.',
          '«Aa» porta aria-expanded i aria-controls. Un clic fora tanca el format; Escape també, i torna el focus a «Aa».'
        ]}
        fes={[
          'Passar-li l’estat i les accions des de l’adaptador del motor (UniversalRichTextToolbar).',
          'Anunciar amb publishPopup que Publicar obri una finestra.'
        ]}
        noFacis={[
          'Dir-li «barra blava»: la blava és la de navegació de PageFrame.',
          'Donar-li l’editor o cridar el motor des de la barra.'
        ]}>
        <h4>Completa (Borrar i Publicar)</h4>
        {/* 36rem com a mínim perquè sempre es veja sencera i en una fila; si la
            columna és més estreta, la regió es desplaça (i es pot recórrer amb el
            teclat, com Taula). */}
        <div className="sdp-especimen__mostra sdp-especimen__mostra--ampla" role="region"
          aria-label="Barra d’eines sencera (es desplaça si no cap)" tabIndex={0}>
          <UniversalToolbar {...format} onBack={torna}
            onDelete={() => setAvis('Has premut Borrar: l’editor obriria la confirmació.')}
            onPublish={() => setAvis('Has premut Publicar.')} />
        </div>
        <h4>Compacta (una columna de 28rem)</h4>
        <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta">
          <UniversalToolbar {...format} onBack={torna}
            onDelete={() => setAvis('Has premut Borrar: l’editor obriria la confirmació.')}
            onPublish={() => setAvis('Has premut Publicar.')} />
        </div>
        <h4>Publicar obri una finestra (publishPopup) i sense Borrar</h4>
        <div className="sdp-especimen__mostra">
          <UniversalToolbar {...format} onBack={torna} publishPopup="dialog" onPublish={() => setSelector(true)} />
        </div>
        <h4>Nota connectada: «Compartir» i sense Borrar</h4>
        <div className="sdp-especimen__mostra">
          <UniversalToolbar {...format} onBack={torna} publishLabel="Compartir" onPublish={() => setAvis('Has premut Compartir.')} />
        </div>
        <p role="status">{avis}</p>
        <SelectorVisibilitat obert={selector} onTanca={() => setSelector(false)} esPublica={publica}
          onTria={(nova) => { setPublica(nova); return true; }} />
      </Especimen>
    </>
  );
}
