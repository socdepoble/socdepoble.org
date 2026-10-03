import { useState } from 'react';
import { Apple, Croissant, Milk, SprayCan } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { useColleccioActiva } from '../../../../apps/comu/esquelet/index.js';
import { MarcEsquelet, MostraEsquelet } from './mostraEsquelet.jsx';

/* Ordre del Mestre (261002, sinergies T4/T8) · l'esquelet comú VESTIT DE
   COMPRA («La Nevera de Casa»). La intel·ligència de dades d'esta mostra
   (pendent o comprat, especificació, recents, les llistes) és un esbós
   sintètic: cap llista ni persona real. Les columnes són les mateixes que les
   de l'espècimen «vestit de bar»; només canvien les dades i dos paràmetres
   (la col·lecció va primer en el mòbil i es pinta en rajoles). */
const CATEGORIES = [
  { id: 'fruita', nom: 'Fruita i verdura', icona: Apple, ordre: 0, visible: true },
  { id: 'forn', nom: 'Forn', icona: Croissant, ordre: 1, visible: true },
  { id: 'lactics', nom: 'Llet i formatge', icona: Milk, ordre: 2, visible: true },
  { id: 'neteja', nom: 'Neteja', icona: SprayCan, ordre: 3, visible: true },
  { id: 'propis', nom: 'Articles propis', ordre: 4, visible: true }
];

const CATALEG = [
  { id: 'tomaques', nom: 'Tomaques', categoriaId: 'fruita' },
  { id: 'pomes', nom: 'Pomes', categoriaId: 'fruita' },
  { id: 'creilles', nom: 'Creïlles', categoriaId: 'fruita' },
  { id: 'pa-llenya', nom: 'Pa de llenya', categoriaId: 'forn' },
  { id: 'magdalenes', nom: 'Magdalenes', categoriaId: 'forn' },
  { id: 'llet', nom: 'Llet', categoriaId: 'lactics' },
  { id: 'formatge-fresc', nom: 'Formatge fresc', categoriaId: 'lactics', insignia: 'NOU' },
  { id: 'sabo-roba', nom: 'Sabó de roba', categoriaId: 'neteja' },
  { id: 'paper-cuina', nom: 'Paper de cuina', categoriaId: 'neteja' }
];

/* Les llistes: la llista activa va al camí (/app/compra/llista/<llistaId>).
   useColleccioActiva rep les mateixes opcions que la pantalla (primer inclòs). */
const PRIMER = 'colleccio';
const RUTA_LLISTA = Object.freeze({ parametre: 'llistaId' });
const LLISTES = [
  { id: 'casa', nom: 'Casa' },
  { id: 'mercat', nom: 'Mercat del dijous' }
];
const LLISTES_INICIALS = {
  casa: [
    { articleId: 'llet', quantitat: 2, especificacio: 'Sense lactosa', comprat: false },
    { articleId: 'pomes', quantitat: 1, especificacio: '1 kg', comprat: false },
    { articleId: 'paper-cuina', quantitat: 1, especificacio: '', comprat: true }
  ],
  mercat: [
    { articleId: 'tomaques', quantitat: 1, especificacio: '1 kg', comprat: false },
    { articleId: 'creilles', quantitat: 1, especificacio: '2 kg', comprat: false },
    { articleId: 'formatge-fresc', quantitat: 1, especificacio: '', comprat: false }
  ]
};

const slug = (text) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'article';

/* La intel·ligència de La Compra de mostra: què falta i què ja s'ha comprat a
   cada llista, i els recents. */
function useLlistesDeMostra(llistaId) {
  const [cataleg, setCataleg] = useState(CATALEG);
  const [llistes, setLlistes] = useState(LLISTES_INICIALS);
  const [recents, setRecents] = useState(['magdalenes']);
  const llista = llistes[llistaId] || [];
  const perId = new Map(cataleg.map((a) => [a.id, a]));
  const actualitza = (canvi) => setLlistes((totes) => ({ ...totes, [llistaId]: canvi(totes[llistaId] || []) }));
  const commuta = (id) => actualitza((actual) => (actual.some((l) => l.articleId === id)
    ? actual.filter((l) => l.articleId !== id)
    : [...actual, { articleId: id, quantitat: 1, especificacio: '', comprat: false }]));
  const posa = (id, { quantitat, nota }) => actualitza((actual) => [
    ...actual.filter((l) => l.articleId !== id),
    { articleId: id, quantitat: quantitat || 1, especificacio: nota, comprat: false }
  ]);
  const marca = (id) => actualitza((actual) => actual.map((l) => (l.articleId === id ? { ...l, comprat: !l.comprat } : l)));
  const fet = () => {
    setRecents((actuals) => [...new Set([...llista.filter((l) => l.comprat).map((l) => l.articleId), ...actuals])].slice(0, 6));
    actualitza((actual) => actual.filter((l) => !l.comprat));
  };
  const crea = (nom) => {
    const id = `propi-${slug(nom)}`;
    if (!perId.has(id)) setCataleg((actual) => [...actual, { id, nom: nom.trim(), categoriaId: 'propis' }]);
    actualitza((actual) => (actual.some((l) => l.articleId === id) ? actual : [...actual, { articleId: id, quantitat: 1, especificacio: '', comprat: false }]));
  };
  const pendentsDe = (id) => (llistes[id] || []).filter((l) => !l.comprat).length;
  return { cataleg, llista, recents, perId, commuta, posa, marca, fet, crea, pendentsDe };
}

function CompraDeMostra() {
  const llistaId = useColleccioActiva({ entrada: 'llista', primer: PRIMER, rutaColleccio: RUTA_LLISTA }) || 'casa';
  const compra = useLlistesDeMostra(llistaId);
  const aLaLlista = new Map(compra.llista.map((l) => [l.articleId, l]));
  const articles = compra.cataleg.map((a) => ({
    ...a,
    secundari: aLaLlista.get(a.id)?.especificacio || undefined,
    estat: aLaLlista.has(a.id) && !aLaLlista.get(a.id).comprat ? 'en-colleccio' : 'normal'
  }));
  const linies = compra.llista.map((l) => ({
    id: `l-${l.articleId}`,
    articleId: l.articleId,
    quantitat: l.quantitat,
    nom: compra.perId.get(l.articleId)?.nom || l.articleId,
    detall: l.especificacio || undefined,
    estat: l.comprat ? 'fet' : 'normal'
  }));
  const pendents = compra.pendentsDe(llistaId);
  const resum = { etiqueta: 'Llista', comptador: pendents, textComptador: (n) => `${n} ${n === 1 ? 'pendent' : 'pendents'}` };

  return (
    <MarcEsquelet
      etiqueta="Compra"
      primer={PRIMER}
      cataleg={{
        titol: 'Articles',
        categories: CATEGORIES,
        articles,
        commutable: true,
        onTria: (article) => compra.commuta(article.id),
        textosEstat: { 'en-colleccio': 'A la llista' },
        destacats: [{ id: 'recents', nom: 'Recents', articles: articles.filter((a) => compra.recents.includes(a.id)) }],
        afegit: { etiqueta: 'Necessite…', suggeriments: articles, onTria: (article) => compra.posa(article.id, {}), onCrea: compra.crea },
        detall: {
          inicialDe: (article) => {
            const l = aLaLlista.get(article.id);
            return l ? { quantitat: l.quantitat, nota: l.especificacio } : null;
          },
          etiquetaNota: 'Especificació',
          textAccepta: 'Posa a la llista',
          onAccepta: (valors, article) => compra.posa(article.id, valors)
        },
        resum
      }}
      colleccio={{
        titol: 'Llista',
        linies,
        forma: 'rajoles',
        resum: { ...resum, accio: { text: 'Fet', desactivada: !compra.llista.some((l) => l.comprat), onClick: compra.fet } },
        onTria: (l) => compra.marca(l.articleId),
        textosLinies: { fet: 'Comprat' },
        textos: { enColleccio: 'Pendent', buit: 'La llista és buida', buitText: 'Afig el que falta des del catàleg o amb «Necessite…».' }
      }}
      colleccions={{
        titol: 'Les meues llistes',
        colleccions: LLISTES.map((l) => ({ ...l, comptador: compra.pendentsDe(l.id) })),
        actiu: llistaId,
        hrefDe: (l) => `/app/compra/llista/${l.id}`,
        textComptador: (n) => `${n} ${n === 1 ? 'pendent' : 'pendents'}`
      }}
    />
  );
}

export default function EspecimenEsqueletCompra() {
  return (
    <Especimen id="esquelet-compra" nom="Esquelet · vestit de compra" fitxer="src/apps/comu/esquelet/ (ColumnaCataleg · ColumnaColleccio · ColumnaColleccions)"
      descripcio="La Compra («La Nevera de Casa») sobre el mateix esquelet que el TPV del bar: els articles de casa per categories, la llista activa i les llistes. Una altra intel·ligència de dades (pendent o comprat, especificació, recents), les mateixes columnes. La llista activa va al camí. En mòbil la llista va primer, en rajoles, i «Afig des del catàleg» porta als articles."
      contracte={[
        ['primer / rutaColleccio', "'colleccio' · { parametre }", "'cataleg' · null", 'La llista primer en el mòbil; el catàleg és el panell /cataleg i la llista activa, /llista/<id>.'],
        ['cataleg.commutable', 'boolean', 'false', 'Tocar posa o lleva de la llista: la rajola és un interruptor (aria-pressed).'],
        ['cataleg.afegit', 'props d’AfegitRapid', 'null', '«Necessite…»: suggeriments del catàleg i crear un article propi.'],
        ['cataleg.destacats', '[{ id, nom, articles }]', '[]', 'Els recents, davant de les categories.'],
        ['colleccio.forma / textosLinies', "'linies' | 'rajoles' · { fet, anullat }", "'linies' · Fet, Anul·lat", 'La llista en rajoles, a l’estil de Bring: tocar-ne una la marca com a comprada, i el text ho diu.']
      ]}
      a11y={['La rajola de la llista diu aria-pressed: pendent o no.', 'L’estat «comprat» porta text («Comprat»), en línies i en rajoles: no només ratllat ni aria-pressed.', 'El que s’escriu a «Necessite…» no va mai a la URL.']}
      fes={['Passar l’especificació com a línia secundària («1 kg», «Sense lactosa»).', 'Llegir la llista activa amb useColleccioActiva, amb el mateix primer i la mateixa rutaColleccio que la pantalla.']}
      noFacis={['Fer una llista de rajoles pròpia a La Compra.', 'Fer servir el vermell per a dir «pendent»: l’esquelet ja ho diu amb la marca i el text.']}>
      <MostraEsquelet rutaInicial="/app/compra/llista">
        <CompraDeMostra />
      </MostraEsquelet>
    </Especimen>
  );
}
