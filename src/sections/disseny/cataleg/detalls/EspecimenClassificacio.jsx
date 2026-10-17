import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { BotoneraClassificacio } from '../../../../components/universal/classificacio/BotoneraClassificacio.jsx';
import { DialegCarpeta } from '../../../../components/universal/classificacio/DialegCarpeta.jsx';
import { DialegValors } from '../../../../components/universal/classificacio/DialegValors.jsx';
import { DialegEmoticona } from '../../../../components/universal/classificacio/DialegEmoticona.jsx';
import { carregaCatalegEmojis } from '../../../notes/canalEmojis.js';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · La botonera REAL de davall del títol i els
   seus tres diàlegs, muntats com els munta NotesEditor: la botonera no guarda
   estat i crida onObri(tipus); qui la munta obri el diàleg (muntatge
   condicional amb key, perquè cada obertura comence de zero). Dos documents de
   mostra: un sense emoticona (la ploma) i un amb 🍅. Tot és local.
   Gauntlet 261017 (F30: «DialegEmoticona substituït per graella Unicode18
   accessible», a tota l'app) · El diàleg d'emoticona porta el catàleg Emojis
   XL, com NotesEditor (canalEmojis.js · carregaCatalegEmojis, a demanda). */

const CARPETES = Object.freeze([
  { id: 'hort', nom: 'Hort' },
  { id: 'festes', nom: 'Festes' },
  { id: 'papers', nom: 'Papers de l’ajuntament' },
]);
const CATEGORIES_BASE = Object.freeze(['General', 'Agricultura', 'Cultura']);
const ETIQUETES_BASE = Object.freeze(['tomaca', 'reg', 'falles']);
const AVIS_CARPETES = 'Crear, reanomenar i esborrar carpetes encara no té contracte de dades: per això es veuen desactivats.';

const DOCUMENTS_INICIALS = Object.freeze({
  sense: { carpeta: 'hort', categories: ['Agricultura'], etiquetes: ['tomaca'], emoticona: '' },
  amb: { carpeta: 'festes', categories: ['Cultura'], etiquetes: [], emoticona: '🍅' },
});

export default function EspecimenClassificacio() {
  const [docs, setDocs] = useState(DOCUMENTS_INICIALS);
  const [cataleg, setCataleg] = useState({ categories: [...CATEGORIES_BASE], etiquetes: [...ETIQUETES_BASE] });
  const [obert, setObert] = useState(null); // { doc, tipus }

  const tanca = () => setObert(null);
  const desa = (camp, valor) => {
    setDocs((previ) => ({ ...previ, [obert.doc]: { ...previ[obert.doc], [camp]: valor } }));
    tanca();
  };
  /* Reanomenar i esborrar són del catàleg (totes les notes): s'apliquen al moment. */
  const reanomena = (camp) => (vell, nou) => {
    setCataleg((previ) => ({ ...previ, [camp]: previ[camp].map((v) => (v === vell ? nou : v)) }));
    setDocs((previ) => Object.fromEntries(Object.entries(previ).map(([id, d]) => (
      [id, { ...d, [camp]: d[camp].map((v) => (v === vell ? nou : v)) }]
    ))));
  };
  /* Com al Bloc: una nota que es queda sense cap categoria rep «General». */
  const esborra = (camp) => (valor) => {
    const resta = (llista) => {
      const neta = llista.filter((v) => v !== valor);
      return camp === 'categories' && !neta.length ? ['General'] : neta;
    };
    setCataleg((previ) => ({ ...previ, [camp]: previ[camp].filter((v) => v !== valor) }));
    setDocs((previ) => Object.fromEntries(Object.entries(previ).map(([id, d]) => [id, { ...d, [camp]: resta(d[camp]) }])));
  };
  const propsValors = (camp) => ({
    obert: true,
    onTanca: tanca,
    cataleg: cataleg[camp],
    seleccionats: docs[obert.doc][camp],
    fixos: camp === 'categories' ? ['General'] : [],
    onDesa: (llista) => {
      setCataleg((previ) => ({ ...previ, [camp]: [...new Set([...previ[camp], ...llista])] }));
      desa(camp, llista);
    },
    onReanomena: reanomena(camp),
    onEsborra: esborra(camp),
  });
  const nomCarpeta = (id) => CARPETES.find((c) => c.id === id)?.nom;
  const clau = obert ? `${obert.tipus}:${obert.doc}` : null;

  return (
    <>
      <Llinatge id="classificacio" />
      <Especimen id="classificacio" nom="BotoneraClassificacio · Carpetes, Categories, Etiquetes i Emoticona"
        fitxer="src/components/universal/classificacio/"
        descripcio="Davall del títol, només mentre s’edita (la ranura classificacio de PageFrame): en lectura, targetes i Mur es continuen pintant les píndoles. Cada botó obri el seu diàleg. El quart és l’emoticona del document: sense emoticona hi va una ploma, que diu «açò és editable»; amb emoticona, la mateixa emoticona. El botó Emoticona es conserva (decisió del Mestre, 260928)."
        contracte={[
          ['BotoneraClassificacio', '{ carpeta, categories, etiquetes, emoticona, onObri }', '—', 'Muda: pinta els quatre botons (Boto amb aria-haspopup="dialog") i crida onObri(\'carpeta\'|\'categories\'|\'etiquetes\'|\'emoticona\').'],
          ['DialegCarpeta', '{ obert, onTanca, opcions, seleccionada, onDesa, avis }', '—', 'Una carpeta i només una (ràdios). Crear, reanomenar i esborrar, desactivats amb l’avís.'],
          ['DialegValors', '{ obert, onTanca, titol, etiquetaNou, cataleg, seleccionats, minim, fixos, onDesa, onReanomena, onEsborra, … }', '—', 'Caselles d’esta nota (es confirmen amb Desar) i accions de catàleg que s’apliquen al moment. Amb minim, l’últim valor no es pot llevar.'],
          ['DialegEmoticona', '{ obert, onTanca, actual, onDesa, carregaCataleg }', '—', 'Un sol emoji (utils/emoji.emojiSol). «Llevar» el buida. Amb carregaCataleg (() => Promise<{ GRUPS_EMOJIS }>, a demanda), la graella Emojis XL: un clic l’assigna (onDesa) i el camp de text es queda com a alternativa de teclat. A l’app tots el porten (canalEmojis.js · carregaCatalegEmojis).'],
        ]}
        a11y={[
          'Cada botó anuncia que obri una finestra (aria-haspopup="dialog"); la botonera és un grup amb nom.',
          'Els diàlegs són Dialeg natius: vel, trampa de focus i Escape.',
          'Categories: amb un sol valor triat, «Desar» espera i ho diu un avís amb role="status".'
        ]}
        fes={[
          'Muntar els diàlegs de manera condicional i amb key, com NotesEditor, perquè cada obertura comence de zero.',
          'Separar el que és d’esta nota (Desar) del que toca totes les notes (reanomenar i esborrar).'
        ]}
        noFacis={[
          'Guardar estat dins de la botonera.',
          'Pintar la botonera en lectura: allà van les píndoles.'
        ]}>
        <h4>Document sense emoticona (la ploma)</h4>
        <BotoneraClassificacio carpeta={nomCarpeta(docs.sense.carpeta)} categories={docs.sense.categories}
          etiquetes={docs.sense.etiquetes} emoticona={docs.sense.emoticona} onObri={(tipus) => setObert({ doc: 'sense', tipus })} />
        <h4>Document amb emoticona</h4>
        <BotoneraClassificacio carpeta={nomCarpeta(docs.amb.carpeta)} categories={docs.amb.categories}
          etiquetes={docs.amb.etiquetes} emoticona={docs.amb.emoticona} onObri={(tipus) => setObert({ doc: 'amb', tipus })} />

        {obert?.tipus === 'carpeta' ? (
          <DialegCarpeta key={clau} obert onTanca={tanca} opcions={CARPETES}
            seleccionada={docs[obert.doc].carpeta} onDesa={(id) => desa('carpeta', id)} avis={AVIS_CARPETES} />
        ) : null}
        {obert?.tipus === 'categories' ? (
          <DialegValors key={clau} {...propsValors('categories')} titol="Categories de la nota" etiquetaNou="Nova categoria"
            minim={1} avisMinim="Cada nota té almenys una categoria: afig-ne una altra abans de llevar esta." />
        ) : null}
        {obert?.tipus === 'etiquetes' ? (
          <DialegValors key={clau} {...propsValors('etiquetes')} titol="Etiquetes de la nota" etiquetaNou="Nova etiqueta" minim={0} />
        ) : null}
        {obert?.tipus === 'emoticona' ? (
          <DialegEmoticona key={clau} obert onTanca={tanca} actual={docs[obert.doc].emoticona}
            onDesa={(emoji) => desa('emoticona', emoji)} carregaCataleg={carregaCatalegEmojis} />
        ) : null}
      </Especimen>
    </>
  );
}
