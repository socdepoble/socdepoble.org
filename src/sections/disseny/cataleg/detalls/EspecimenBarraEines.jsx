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

/* IDEA-59 / P1-72 (Mestre 261101) · Les ranures de la barra nova
   (toolbarContract.js): els cinc nivells del desplegable, en el seu ordre
   (H3, H4, H5, H6 i H2), les dues llistes i els commutadors solts. */
const ENCAPCALAMENTS = Object.freeze([
  ['isSubheading', 'toggleSubheading'],
  ['isH4', 'toggleH4'],
  ['isH5', 'toggleH5'],
  ['isH6', 'toggleH6'],
  ['isHeading', 'toggleHeading'],
]);
const LLISTES = Object.freeze([
  ['isList', 'toggleList'],
  ['isOrderedList', 'toggleOrderedList'],
]);
const COMMUTADORS = Object.freeze([
  ['isBold', 'toggleBold'],
  ['isItalic', 'toggleItalic'],
  ['isStrike', 'toggleStrike'],
  ['isCitacio', 'toggleCitacio'],
]);

/* Estat de format de mostra: cada botó alterna el seu. Com en el motor, un
   bloc té un sol nivell d'encapçalament (triar el que ja és actiu el torna a
   paràgraf) i una sola mena de llista; el Divisor no alterna res: inserix.
   En l'editor, l'estat i les accions els dona el motor
   (useTipTapToolbarAdapter), mai la barra. */
function useFormatDeMostra(avisa) {
  const [actius, setActius] = useState(() => ({ isBold: true }));
  const commuta = (estat, exclosos = []) => () => setActius((previ) => ({
    ...previ,
    ...Object.fromEntries(exclosos.map(([altre]) => [altre, false])),
    [estat]: !previ[estat]
  }));
  const formatActions = {
    ...Object.fromEntries(COMMUTADORS.map(([estat, accio]) => [accio, commuta(estat)])),
    ...Object.fromEntries(ENCAPCALAMENTS.map(([estat, accio]) => [accio, commuta(estat, ENCAPCALAMENTS)])),
    ...Object.fromEntries(LLISTES.map(([estat, accio]) => [accio, commuta(estat, LLISTES)])),
    insertDivisor: () => avisa('Has premut Divisor: l’editor inseriria una línia divisòria.'),
  };
  return { formatState: actius, formatActions };
}

export default function EspecimenBarraEines() {
  const [avis, setAvis] = useState('Encara no has premut cap acció.');
  const format = useFormatDeMostra(setAvis);
  const [selector, setSelector] = useState(false);
  const [publica, setPublica] = useState(false);
  const torna = () => setAvis('Has premut la fletxa: dins d’un gestor en estret, tornaria al llistat.');
  return (
    <>
      <Llinatge id="barra-eines" />
      <Especimen id="barra-eines" nom="UniversalToolbar · la barra d’eines de l’editor"
        fitxer="src/components/universal/UniversalToolbar.jsx"
        descripcio="Format del text: el desplegable d’encapçalaments (H3, H4, H5, H6 i, al final, H2), Negreta, Cursiva i les dues llistes (amb vinyetes i numerada). El botó «⋯» (Més eines) desplega la segona fila, just a sota: Ratllat, Citació i Divisor, i les eines principals que no caben a la primera. Borrar i Publicar, a la dreta. La barra és muda: rep l’estat i les accions i només les crida. Mesura la seua amplada: per davall de 500 px, «⋯» («Format del text») obri totes les eines de format. La fletxa de tornar a la llista només es veu dins d’un gestor en estret."
        contracte={[
          ['formatState', '{ isSubheading, isH4, isH5, isH6, isHeading, isBold, isItalic, isList, isOrderedList, isStrike, isCitacio }', '{}', 'Quins formats estan actius: aria-pressed als commutadors; al desplegable, aria-checked i el nivell actiu al botó (isSubheading és l’H3 i isHeading, l’H2).'],
          ['formatActions', '{ toggleSubheading, toggleH4, toggleH5, toggleH6, toggleHeading, toggleBold, …, toggleCitacio, insertDivisor }', '{}', 'Sense l’acció, el botó (o el nivell del desplegable) ix desactivat; sense cap nivell, el desplegable també.'],
          ['onPublish / publishDisabled', '() => void / boolean', '— / false', 'Sense onPublish no hi ha botó Publicar.'],
          ['publishLabel', 'string | null', 'null', 'Una nota connectada no es publica: es compartix («Compartir»).'],
          ['publishPopup', "'dialog' | null", 'null', 'Publicar obri una finestra (SelectorVisibilitat): el botó ho anuncia amb aria-haspopup.'],
          ['onDelete / deleteDisabled', '() => void / boolean', '— / false', 'Sense onDelete no hi ha botó Borrar.'],
          ['onProposaCard / proposaCardDisabled / proposaCardDesfer', '() => void / boolean / boolean', 'null / false / false', 'Sense onProposaCard no hi ha «Proposa Card»: en ample, el primer botó del grup de publicació; per davall de 500 px, l’última de les eines de «⋯». Amb proposaCardDesfer, el mateix botó desfà la proposta.'],
          ['onBack', '() => void', 'obri el llistat', 'La fletxa de tornar (només en estret); per defecte obri la columna del llistat d’AppGridShell.'],
          ['t', '(clau, text) => string', 'el text', 'Traducció dels noms dels botons.'],
        ]}
        a11y={[
          'role="group" amb nom «Eines de l’editor»; el format és un altre grup amb nom propi («Opcions de format del text»), i la segona fila, un altre («Més eines»).',
          'El desplegable d’encapçalaments és un botó de menú (aria-haspopup="menu" i aria-expanded) que diu el nivell actiu («Encapçalament: H3» o, fora d’un encapçalament, «Encapçalament (H): Paràgraf», on el botó només mostra «H»). L’ordre i la puntuació del nom són de cada llengua (section.notes.format.nomNivell i nomParagraf), i sempre porten el text visible. Cada nivell és un menuitemradio amb aria-checked: les fletxes, Inici i Fi s’hi mouen, Enter o Espai trien i Escape tanca i torna al botó.',
          'Negreta, Cursiva, les dues llistes, Ratllat i Citació són commutadors: aria-pressed i nom accessible (aria-label), perquè només es veu la icona. El Divisor inserix una línia: no porta aria-pressed.',
          '«⋯» porta aria-expanded i aria-controls. En ample, la segona fila és part de la barra i només la plega el mateix botó; per davall de 500 px, un clic fora tanca les eines, i Escape també, i torna el focus a «⋯» (l’Escape queda atés: el detall ja no el porta a la fitxa de la llista). Un clic o un Escape d’una finestra modal oberta damunt (la fitxa de Proposa Card) no les tanca: en tancar-se, el focus torna a Proposa Card.'
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
