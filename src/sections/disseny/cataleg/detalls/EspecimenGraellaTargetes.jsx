/**
 * EspecimenGraellaTargetes.jsx — el contenidor de les UniversalCard de les
 * llistes de les apps (ordre del Mestre, 261004, prompt 261004_0515: «no
 * inventar targetes»). Pedra Seca §9: l'espècimen abans de la producció
 * (Notícies i la Nevera). Dades de mostra, sense cap persona.
 */
import { Newspaper, Sprout } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { GraellaTargetes, UniversalCard } from '../../../../components/PedraSeca/index.js';

const CATEGORIES = [
  { id: 'poble', nom: 'Del poble', icona: Newspaper, visible: true, ordre: 0 },
  { id: 'camp', nom: 'Del camp', icona: Sprout, visible: true, ordre: 1 }
];

const NOTICIES = [
  { id: 'n1', categoriaId: 'poble', title: 'Obri la biblioteca de dissabte', subtitle: 'Horari nou de la tardor', body: 'Cada dissabte de 10:00 a 13:00, amb préstec de llibres i jocs.' },
  { id: 'n2', categoriaId: 'poble', title: 'Reparen el llavador vell', subtitle: 'Obres al carrer de la Font', body: 'La brigada torna a posar la teulada i neteja les piques.' },
  { id: 'n3', categoriaId: 'camp', title: 'Comença la collita de l’oliva', subtitle: 'La cooperativa obri la bàscula', body: 'De dilluns a divendres, de 16:00 a 20:00.' }
];

/* La targeta de cada element: la pinta qui munta la graella, mai la graella.
   Dins de l'espècimen (h3) i dels seus apartats (h4), el títol baixa a h5 i,
   davall d'una secció (h5), a h6. */
const targeta = (element, extres = {}) => (
  <UniversalCard key={element.id} headingLevel="h5" title={element.title} subtitle={element.subtitle} body={element.body}
    labels={[{ text: 'Notícies', className: 'sdp-badge-system' }]} {...extres} />
);

export default function EspecimenGraellaTargetes() {
  return (
    <Especimen id="graella-targetes" nom="GraellaTargetes · la graella de les targetes" fitxer="src/components/PedraSeca/organismes/GraellaTargetes.jsx"
      descripcio="No és cap targeta: posa les UniversalCard d’una llista en la graella de sempre (la .sdp-card-grid del Mercat) o en columna, i, amb categories, les agrupa en seccions (SeccionsCategoria). És la peça amb què Notícies i la Nevera deixen les seues targetes pròpies: les apps no escriuen classes ni llistes, i la graella la porta Pedra Seca."
      contracte={[
        ['elements', '{ id, categoriaId?, … }[]', '—', 'Els elements de la llista. Amb children com a funció, children(element) pinta la targeta de cada un (amb la seua key). Sense elements, els fills ja són les targetes.'],
        ['children', 'node | fn(element)', '—', 'Les targetes, o la funció que les pinta.'],
        ['categories', '{ id, nom, icona?, visible, ordre }[]', 'null', 'Amb categories, una secció per categoria en l’ordre de la persona (SeccionsCategoria); sense, una sola graella.'],
        ['nivell', '3 | 4 | 5 | 6', '3', 'El nivell de la capçalera de cada secció. Les targetes de dins, un per davall (headingLevel de UniversalCard).'],
        ['variant', "'graella' | 'llista'", "'graella'", "'llista': en columna, per a les targetes planes (UniversalCard variant='pla'), com la Revista de Notícies."],
        ['etiqueta', 'string', '—', 'El nom de la graella sense seccions: un grup amb nom per al lector de pantalla.'],
        ['plegades / onPlega / textArticles / textSenseCategoria', '—', '—', 'Els de SeccionsCategoria.'],
        ['buit', 'node', 'null', 'El que es pinta quan no hi ha cap element (un EstatBuit).']
      ]}
      a11y={['Amb seccions, cada secció és una <section> amb el seu encapçalament (aria-labelledby).', 'Sense seccions i amb etiqueta, la graella és un grup amb nom.', 'L’ordre del DOM és el de la vista i el del focus.']}
      fes={['Les targetes dins: sempre UniversalCard, amb el títol un nivell per davall de la secció.', 'Una llista de targetes planes: variant="llista".']}
      noFacis={['Una targeta pròpia de l’app, ni una graella feta amb classes a mà.', 'Posar-hi altra cosa que targetes: la graella no és un formulari.']}>
      <h4>Graella amb seccions</h4>
      <GraellaTargetes elements={NOTICIES} categories={CATEGORIES} nivell={5}>
        {(element) => targeta(element, { headingLevel: 'h6' })}
      </GraellaTargetes>
      <h4>Llista de targetes planes</h4>
      <GraellaTargetes elements={NOTICIES} variant="llista" etiqueta="Notícies en llista de mostra">
        {(element) => targeta(element, { variant: 'pla' })}
      </GraellaTargetes>
    </Especimen>
  );
}
