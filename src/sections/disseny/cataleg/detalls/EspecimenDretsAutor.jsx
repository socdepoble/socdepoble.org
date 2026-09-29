import { useEffect, useRef, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { PillToggle } from '../../../../components/PedraSeca/index.js';
import { BotoDretsAutor } from '../../../../components/universal/CopyrightSelector.jsx';
import { CopyrightPage } from '../../../../components/universal/drets/CopyrightPage.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T39 (ordre del Mestre, 260928) · «Drets d'autor» a pantalla completa dins
   de l'editor. El botó de sempre, davall del títol, obri la vista dins de la
   columna (ací, una columna simulada de 40rem). Quatre casos reals de l'avís
   d'herència: una nota amb drets de sèrie, una sense, la fitxa del Perfil i
   la còpia de prova del Foraster. Tot és local: no es desa res enlloc. */
const CASOS = Object.freeze([
  { valor: 'nota', text: 'Nota amb herència', ambit: 'publicacio', perDefecte: 'CC BY-SA 4.0' },
  { valor: 'nota-buida', text: 'Nota sense herència', ambit: 'publicacio', perDefecte: null },
  { valor: 'perfil', text: 'Fitxa del Perfil', ambit: 'perfil', perDefecte: null },
  { valor: 'neutre', text: 'Foraster', ambit: 'neutre', perDefecte: null },
]);

export default function EspecimenDretsAutor() {
  const [cas, setCas] = useState(CASOS[0].valor);
  const [obert, setObert] = useState(false);
  const [valor, setValor] = useState('© Sóc de Poble');
  const actual = CASOS.find((c) => c.valor === cas) || CASOS[0];
  /* Com DocumentEditor: en tancar la vista, el focus torna al botó. */
  const botoRef = useRef(null);
  const tornaFocus = useRef(false);
  const tanca = () => { tornaFocus.current = true; setObert(false); };
  useEffect(() => {
    if (obert || !tornaFocus.current) return;
    tornaFocus.current = false;
    botoRef.current?.querySelector('button')?.focus();
  }, [obert]);

  return (
    <>
    <Llinatge id="drets" />
    <Especimen id="drets-autor" nom="CopyrightPage · drets d’autor dins de l’editor"
      fitxer="src/components/universal/drets/CopyrightPage.jsx"
      descripcio="«Elegir drets d’autor» ja no obri un diàleg xicotet: la columna de l’editor passa a la vista de drets, que explica cada llicència amb un exemple de poble i diu d’on ve la de sèrie. L’editor s’amaga però continua muntat (el text i l’autodesament no es perden). Res no canvia fins a «Desar autoria»; CC0 i el text lliure demanen l’acceptació irrevocable."
      contracte={[
        ['valor', 'string', "''", 'Els drets d’ara. Preselecciona la llicència; un valor desconegut es pot «Mantindre».'],
        ['autor', 'string', "''", 'El nom de «© autor» (Tots els drets reservats). Buit: «Sóc de Poble».'],
        ['ambit', "'publicacio' | 'perfil' | 'neutre'", "'neutre'", 'Quin avís d’herència es pinta (cap per a «neutre»).'],
        ['perDefecte', 'string | null', 'null', 'Els drets de sèrie que hereten les notes noves (àmbit publicacio).'],
        ['onDesa', '(valor: string) => void', '—', 'Desar: el pare ho envia pel camí de sempre (desaLocal + desaCamp).'],
        ['onTanca', "(motiu: 'esc'|'tornar'|'boto') => void", '—', 'Tornar al document sense desar.'],
        ['BotoDretsAutor', '{ valor, onClick }', '—', 'El disparador (CopyrightSelector.jsx): el marcatge de sempre, sense aria-haspopup.'],
      ]}
      a11y={[
        'En obrir, el focus va al títol (h2, tabIndex -1); en tancar, torna al botó que l’ha oberta i la pàgina recupera el scroll.',
        'Escape, «Tornar al document» i «Cancel·lar» tornen sense desar.',
        'Ràdios natius dins d’un fieldset amb llegenda; cada llicència és una targeta sencera amb nom, explicació, exemple i permisos (sempre amb text).',
        'La closca amagada (display: none) ix de l’arbre d’accessibilitat: no queden controls invisibles al Tab.',
        'Els enllaços externs diuen al lector que s’obrin en una pestanya nova.',
      ]}
      fes={[
        'Explicar cada llicència amb paraules de poble i un exemple.',
        'Dir d’on ve la llicència de sèrie i que només canvien les notes noves.',
        'Conservar l’acceptació irrevocable de CC0 i el límit de 256 caràcters.',
      ]}
      noFacis={[
        'Desmuntar l’editor per a obrir la vista (es perdria el que s’està escrivint).',
        'Desar en triar una targeta: una llicència és una decisió legal, es confirma.',
        'Prometre que les notes que ja existixen canvien de llicència.',
      ]}>
      <PillToggle etiqueta="Cas de l’espècimen" valor={cas} onCanvi={(v) => { setCas(v); setObert(false); }}
        opcions={CASOS.map(({ valor: v, text }) => ({ valor: v, text }))} />
      {obert ? (
        <div className="sdp-especimen__columna">
          <CopyrightPage key={cas} valor={valor} autor="Pep del Mas" ambit={actual.ambit} perDefecte={actual.perDefecte}
            onDesa={(nou) => { setValor(nou); tanca(); }} onTanca={tanca} />
        </div>
      ) : (
        <div className="sdp-copyright-control" ref={botoRef}>
          <BotoDretsAutor valor={valor} onClick={() => setObert(true)} />
        </div>
      )}
      <p>Drets desats en l’espècimen: <code>{valor}</code></p>
    </Especimen>
    </>
  );
}
