import { useState } from 'react';
import { Landmark, LayoutGrid, List, PartyPopper } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { GraellaArticles, LlistaArticles, PillToggle } from '../../../../components/PedraSeca/index.js';

/* Ordre del Mestre (261003, tancament del Lector RSS) · l'EXCEPCIÓ a la regla
   1:1 de Pedra Seca (§8): la imatge apaïsada 16:9 de les targetes del Lector
   de notícies, i només d'elles. Notícies sintètiques: una amb una imatge
   pròpia (un recurs /assets, que passa sempre el filtre) i dues sense, que
   pinten el marcador en el mateix marc 16:9 (com una imatge d'un origen que
   l'amfitrió no permet). */
const CATEGORIES = [
  { id: 'ajuntament', nom: 'Ajuntament i serveis', icona: Landmark, ordre: 0, visible: true },
  { id: 'festes', nom: 'Cultura i festes', icona: PartyPopper, ordre: 1, visible: true }
];
const NOTICIES = [
  { id: 'llibreta', nom: 'La biblioteca recull les llibretes de receptes de les àvies', categoriaId: 'ajuntament',
    secundari: 'La Veu de la Plaça · Amb imatge pròpia: la foto ocupa el marc 16:9.', valor: 'fa 2 h', imatge: '/assets/notes/bloc_notes_vintage.jpg', insignia: 'Nou' },
  { id: 'horari', nom: 'Nou horari de l’oficina de correus', categoriaId: 'ajuntament',
    secundari: 'La Veu de la Plaça · Sense imatge: el marcador, en el mateix marc.', valor: 'fa 5 h' },
  { id: 'correfoc', nom: 'El correfoc passarà pel barranc', categoriaId: 'festes',
    secundari: 'Colla de Dimonis · Desada per a després: l’estat de col·lecció, com sempre.', valor: 'fa 1 dia', estat: 'en-colleccio' }
];
const VISTES = [
  { valor: 'llista', text: 'Revista', icona: <List size={20} aria-hidden="true" focusable="false" /> },
  { valor: 'graella', text: 'Targetes', icona: <LayoutGrid size={20} aria-hidden="true" focusable="false" /> }
];

export default function EspecimenImatgeApaisada() {
  const [vista, setVista] = useState('llista');
  const [avis, setAvis] = useState('Toca una notícia.');
  const Peca = vista === 'graella' ? GraellaArticles : LlistaArticles;
  return (
    <Especimen id="imatge-apaisada" nom="Imatge apaïsada 16:9 · excepció del Lector" fitxer="src/components/PedraSeca/organismes/agrupacio.jsx · catalegColleccio.css (.sdp-panoramica)"
      descripcio="EXCEPCIÓ a la regla 1:1 (Pedra Seca §8), autoritzada pel Mestre el 261003 i limitada a les imatges de les targetes del Lector de notícies. La variant panoramica de GraellaArticles i LlistaArticles posa la classe .sdp-panoramica al contenidor: la imatge (només d’un origen que l’amfitrió permet) i el marcador d’inicials ocupen un marc 16:9. A la Revista, una miniatura apaïsada a l’esquerra de la fila; a les Targetes, la imatge a tota l’amplada damunt del títol."
      contracte={[
        ['panoramica', 'boolean', 'false', 'Només el Lector (src/apps/lector) i este espècimen: PedraSeca/qualitat.panoramica.test.js falla si una altra app la passa o escriu la classe a mà.'],
        ['…la resta', 'les de GraellaArticles', '—', 'Sense canvis: articles, categories, onTria, textos, commutable, renderMedia.']
      ]}
      a11y={['La imatge i el marcador continuen sent decoració (aria-hidden, alt=""): el nom de la targeta és el títol i la línia secundària.', 'Cada targeta és el mateix <button> natiu de sempre: la variant només canvia la proporció.']}
      fes={['Fer-la servir només per a les notícies del Lector.', 'Deixar les imatges al filtre de sempre: un origen que l’amfitrió no permet pinta el marcador.']}
      noFacis={['Fer-la servir en una altra app o peça: la regla és 1:1.', 'Escriure .sdp-panoramica a mà: la posa la variant.', 'Fer-la servir per als logos de les fonts, que són quadrats.']}>
      <PillToggle etiqueta="Vista de mostra" valor={vista} onCanvi={setVista} opcions={VISTES} />
      <Peca
        panoramica
        articles={NOTICIES}
        categories={CATEGORIES}
        etiqueta="Notícies de mostra"
        textos={{ 'en-colleccio': 'Desat per a després' }}
        textArticles={(n) => `${n} ${n === 1 ? 'notícia' : 'notícies'}`}
        onTria={(noticia) => setAvis(`Obriries «${noticia.nom}».`)}
      />
      <p role="status">{avis}</p>
    </Especimen>
  );
}
