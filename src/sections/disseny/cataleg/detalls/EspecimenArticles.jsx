import { useState } from 'react';
import { Coffee, CupSoda, LayoutGrid, List, Milk } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { GraellaArticles, LlistaArticles, PillToggle } from '../../../../components/PedraSeca/index.js';

/* Esquelet comú T4/T8 · la mateixa dada en graella i en llista. Articles
   sintètics: cap preu ni producte de cap establiment real. */
const CATEGORIES = [
  { id: 'cafes', nom: 'Cafès', icona: Coffee, ordre: 0, visible: true },
  { id: 'begudes', nom: 'Begudes', icona: CupSoda, ordre: 1, visible: true },
  { id: 'lactics', nom: 'Llet i formatge', icona: Milk, ordre: 2, visible: true }
];
const ARTICLES = [
  { id: 'tallat', nom: 'Tallat', categoriaId: 'cafes', valor: '1,30 €' },
  { id: 'cafe-llet', nom: 'Cafè amb llet', categoriaId: 'cafes', valor: '2 variants', estat: 'en-colleccio', insignia: '2' },
  { id: 'aigua', nom: 'Aigua', categoriaId: 'begudes', secundari: 'Mitjana', valor: '1,00 €' },
  { id: 'gasosa', nom: 'Gasosa', categoriaId: 'begudes', secundari: 'Esgotat', estat: 'desactivat' },
  { id: 'llet', nom: 'Llet', categoriaId: 'lactics', secundari: 'Sense lactosa', valor: '2 l' },
  { id: 'formatge', nom: 'Formatge fresc', categoriaId: 'lactics', insignia: 'NOU' },
  { id: 'logo', nom: 'Sóc de Poble', categoriaId: 'lactics', imatge: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg', secundari: 'Amb foto 1:1' }
];
const VISTES = [
  { valor: 'graella', text: 'Graella', icona: <LayoutGrid size={20} aria-hidden="true" focusable="false" /> },
  { valor: 'llista', text: 'Llista', icona: <List size={20} aria-hidden="true" focusable="false" /> }
];

export default function EspecimenArticles() {
  const [vista, setVista] = useState('graella');
  const [plegades, setPlegades] = useState([]);
  const [avis, setAvis] = useState('Toca un article o mantín-lo premut.');
  const Peca = vista === 'llista' ? LlistaArticles : GraellaArticles;
  const props = {
    articles: ARTICLES,
    categories: CATEGORIES,
    onTria: (article) => setAvis(`Toc: ${article.nom}.`),
    onAccioSecundaria: (article) => setAvis(`Acció secundària (detall): ${article.nom}.`),
    textos: { 'en-colleccio': 'A la comanda' },
    plegades,
    onPlega: (id, plegada) => setPlegades((actuals) => (plegada ? [...actuals, id] : actuals.filter((x) => x !== id)))
  };
  return (
    <Especimen id="articles" nom="GraellaArticles · LlistaArticles" fitxer="src/components/PedraSeca/organismes/GraellaArticles.jsx · LlistaArticles.jsx"
      descripcio="La mateixa dada en dues vistes intercanviables: rajoles 1:1 (Rajola) o files amb miniatura, nom, línia secundària i el valor a la dreta. Amb categories, una secció plegable per categoria en l’ordre de la persona. És el catàleg del TPV del bar i de La Compra: la intel·ligència de cada app vist els articles abans de passar-los."
      contracte={[
        ['articles', '[{ id, nom, categoriaId, secundari?, valor?, imatge?, estat?, insignia? }]', '[]', 'valor ja format («1,50 €», «2 variants», «2 kg»); estat: normal, en-colleccio o desactivat.'],
        ['categories', '[{ id, nom, icona?, visible, ordre }] | null', 'null', 'Amb categories, seccions; sense, una sola peça. Les amagades no es pinten.'],
        ['onTria(article)', 'funció', '—', 'El toc: què fa ho decidix l’app (afegir una unitat, posar a la llista).'],
        ['onAccioSecundaria(article, element)', 'funció', '—', 'Pulsació llarga, botó dret, Maj+F10 o tecla de menú: el detall.'],
        ['commutable', 'boolean', 'false', 'El toc posa i lleva de la col·lecció: aria-pressed.'],
        ['textos', "{ 'en-colleccio', desactivat, pista, senseCategoria }", 'textos neutres', 'Els textos d’estat que llig el lector («A la comanda», «A la llista»).'],
        ['renderMedia(article)', 'funció', '—', 'Un quadrat propi (la foto definitiva del Bar).'],
        ['plegades / onPlega(id, plegada)', 'string[] · funció', '[] · —', 'Seccions plegades; sense onPlega no es pleguen.']
      ]}
      a11y={['Cada article és un <button> natiu de --sdp-touch com a mínim; el nom és el nom i la línia secundària.', 'L’estat i la insígnia van a la descripció (aria-describedby), mai només en color.', 'L’acció secundària té drecera de teclat (aria-keyshortcuts="Shift+F10") i una pista per al lector.']}
      fes={['Passar el valor ja format per l’app.', 'Fer servir la icona de la categoria al marcador quan no hi ha foto.']}
      noFacis={['Fer una graella pròpia en una app: és esta.', 'Pintar l’estat només amb color.']}>
      <PillToggle etiqueta="Vista de mostra" valor={vista} onCanvi={setVista} opcions={VISTES} />
      <Peca {...props} />
      <p role="status">{avis}</p>
    </Especimen>
  );
}
