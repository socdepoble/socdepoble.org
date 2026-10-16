import { useEffect, useRef, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { PillToggle } from '../../../../components/PedraSeca/index.js';
import { BotoDretsAutor } from '../../../../components/universal/CopyrightSelector.jsx';
import { CopyrightPage } from '../../../../components/universal/drets/CopyrightPage.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T39 (ordre del Mestre, 260928) · «Drets d'autor» a pantalla completa dins
   de l'editor. El botó de sempre, davall del títol, obri la vista dins de la
   columna (ací, una columna simulada de 40rem). Casos reals de l'avís
   d'herència: una nota amb drets de sèrie, una sense, la fitxa del Perfil,
   la còpia de prova del Foraster i «El compte». Tot és local: no es desa res
   enlloc. */

/* Pla 261016 (Bloc 3.1; ordre del Mestre) · «El compte» de la persona (l'ajust
   'drets-notes', DetallAjust), on es trien els drets amb què naixen les seues
   notes noves. La vista no és dins de cap document: porta les tres props
   opcionals de CopyrightPage (etiquetaTornar, introduccio i llegenda) amb els
   textos de l'ajust. Els altres casos no en porten cap: el DOM de sempre. */
const vistaDelCompte = (valor) => ({
  etiquetaTornar: 'Tornar al compte',
  introduccio: `Tria amb quins drets naixen les teues notes noves. Ara són «${valor}». Res no canvia fins que prems «Desar autoria».`,
  llegenda: 'Tria els drets de sèrie de les teues notes',
});

const CASOS = Object.freeze([
  { valor: 'nota', text: 'Nota amb herència', ambit: 'publicacio', perDefecte: 'CC BY-SA 4.0' },
  { valor: 'nota-buida', text: 'Nota sense herència', ambit: 'publicacio', perDefecte: null },
  { valor: 'perfil', text: 'Fitxa del Perfil', ambit: 'perfil', perDefecte: null },
  { valor: 'neutre', text: 'Foraster', ambit: 'neutre', perDefecte: null },
  { valor: 'compte', text: 'El compte', ambit: 'compte', perDefecte: null, opcionals: vistaDelCompte },
]);

export default function EspecimenDretsAutor() {
  const [cas, setCas] = useState(CASOS[0].valor);
  const [obert, setObert] = useState(false);
  const [valor, setValor] = useState('© Sóc de Poble');
  /* Decisió del Mestre (261008) · La llicència triada de veres (la que s'ha
     desat a l'espècimen): amb ella la píndola la mostra, com a l'editor. La
     reserva «© Sóc de Poble» no és cap tria. */
  const [triada, setTriada] = useState('');
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
      descripcio="«Elegir drets d’autor» ja no obri un diàleg xicotet: la columna de l’editor passa a la vista de drets, que explica cada llicència amb un exemple de poble i diu d’on ve la de sèrie. L’editor s’amaga però continua muntat (el text i l’autodesament no es perden). Res no canvia fins a «Desar autoria»; CC0 i el text lliure demanen l’acceptació irrevocable. Decisió del Mestre (261008): triada una llicència, la píndola la mostra i un clic la torna a obrir per a canviar-la; dins de l’editor, la línia del copyright de davall del títol també obri esta vista (PageFrame, onCanviaCopyright). En lectura i a totes les targetes, el copyright continua sent l’enllaç a /page/drets-autor."
      contracte={[
        ['valor', 'string', "''", 'Els drets d’ara. Preselecciona la llicència; un valor desconegut es pot «Mantindre».'],
        ['autor', 'string', "''", 'El text de sèrie de «Copyright (C)» (© autor), l’última opció. Buit: «Sóc de Poble».'],
        ['ambit', "'publicacio' | 'perfil' | 'compte' | 'neutre'", "'neutre'", 'Quin avís d’herència es pinta (cap per a «neutre»). «compte» (pla 261016, Bloc 3.1): «El compte» de la persona, on es trien els drets amb què naixen les seues notes noves.'],
        ['perDefecte', 'string | null', 'null', 'Els drets de sèrie que hereten les notes noves (àmbit publicacio).'],
        ['onDesa', '(valor: string) => void', '—', 'Desar: el pare ho envia pel camí de sempre (desaLocal + desaCamp).'],
        ['onTanca', "(motiu: 'esc'|'tornar'|'boto') => void", '—', 'Tornar al document sense desar.'],
        ['etiquetaTornar / introduccio / llegenda', 'string / ReactNode | null / string', "'Tornar al document' / null / 'Tria els drets d’esta obra'", 'Opcionals (pla 261016, Bloc 3.1), per a quan la vista no és dins d’un document (l’ajust de drets d’«El compte»): el botó de dalt, el paràgraf de davall del títol i la llegenda del grup d’opcions. Sense elles, el DOM i els textos de sempre (la introducció diu «Ara té «valor»»).'],
        ['BotoDretsAutor', '{ valor, triada?, onClick }', '—', 'El disparador (CopyrightSelector.jsx), amb data-sdp-drets (el destí del focus de l’editor). Sense triada, el marcatge de sempre, sense aria-haspopup: «Elegir drets d’autor». Amb triada (la llicència desada de veres, mai la reserva «© Sóc de Poble»), la píndola plena la mostra i es diu «Drets d’autor: X» (decisió del Mestre, 261008). A l’editor, la triada és document.copyright o, si l’adaptador porta la clau dretsTriats (el Perfil, on el copyright de lectura és el «© Nom» de sèrie), esta clau.'],
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
            {...actual.opcionals?.(valor)}
            onDesa={(nou) => { setValor(nou); setTriada(nou); tanca(); }} onTanca={tanca} />
        </div>
      ) : (
        <div className="sdp-copyright-control" ref={botoRef}>
          <BotoDretsAutor valor={valor} triada={triada} onClick={() => setObert(true)} />
        </div>
      )}
      <p>Drets desats en l’espècimen: <code>{valor}</code></p>
    </Especimen>
    </>
  );
}
