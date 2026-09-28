import { useState } from 'react';
import { Search } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import {
  Alerta, Boto, Camp, CampText, EstatBuit, PillToggle, ResultatCerca, Selector, UniversalSearch
} from '../../../../components/PedraSeca/index.js';

/* T45 · les mateixes peces que /cerca, amb dades de mostra: filtres per tipus
   amb recompte, resultats (ResultatCerca), estat buit i error d'una font. */
const TIPUS = [
  ['tot', 'Tot', 3],
  ['persones', 'Persones', 1],
  ['pobles', 'Pobles', 1],
  ['notes', 'Notes', 1],
  ['agenda', 'Agenda', 0]
];

export default function EspecimenCercaFiltres() {
  const [cerca, setCerca] = useState('festa major');
  const [tipus, setTipus] = useState('tot');
  return (
    <Especimen id="cerca-filtres" nom="Cerca i filtratge"
      fitxer="src/components/PedraSeca/organismes/ResultatCerca.jsx · UniversalSearch.jsx · src/css/modules.css (bloc T45)"
      descripcio="Patrons de cerca: la barra bàsica del gestor (UniversalSearch), la cerca amb filtres dins d'un formulari (Camp + CampText tipus search + Selector), els filtres per tipus amb recompte (PillToggle) i la llista de resultats (ResultatCerca: miniatura 1:1 o avatar, meta, títol enllaçat i extracte). És l'anatomia de /cerca."
      contracte={[
        ['titol', 'node', null, 'Títol del resultat; pot portar <mark> amb les paraules buscades.'],
        ['href', 'string', 'null', 'Destinació del títol. Una ruta insegura (javascript:) el deixa sense enllaç.'],
        ['meta', 'node[]', '[]', 'Dades curtes (autoria, poble, data), separades per «·».'],
        ['extracte', 'node', 'null', 'Dues línies com a màxim.'],
        ['tipus', '{ etiqueta, to }', 'null', 'Insígnia de tipus (text obligatori).'],
        ['avis', 'string', 'null', 'Insígnia d’avís, p. ex. «Privada: només la veus tu».'],
        ['imatge', '{ src, alt }', 'null', 'Miniatura 1:1; alt buit per defecte. Només http(s), ruta pròpia o data:image: un sdp-media:// sense resoldre es descarta.'],
        ['avatar', '{ nom, src, llavor }', 'null', 'Avatar md quan no hi ha imatge.'],
        ['accio', 'node', 'null', 'Una acció secundària (p. ex. «Escriu-li»).'],
        ['headingLevel', '2 | 3 | 4', '3', 'Nivell de la capçalera del títol, limitat a h2–h4.']
      ]}
      a11y={[
        'Tot camp de cerca amb etiqueta (visible o aria-label concret) i dins d’un form role="search".',
        'El recompte de resultats s’anuncia en text: «S’han trobat 12 resultats».',
        'Els filtres són botons amb aria-pressed; el recompte forma part del nom.',
        'Una acció repetida en cada resultat porta un nom propi: «Escriu-li a Pepa Güell».'
      ]}
      fes={[
        'Al gestor universal, la lupa obri la cerca i les píndoles d’etiquetes només es mostren mentre la cerca està oberta.',
        'Marca les notes i les converses com a privades: només les veu qui les té.',
        'Si una font falla, digues quina i deixa la resta de resultats visibles.'
      ]}
      noFacis={['Un tercer cercador.', 'Filtres invisibles actius: tancar la cerca els neteja.', '«Cap resultat» mentre encara es carrega.']}>
      <h4>Barra de cerca del gestor</h4>
      <UniversalSearch value={cerca} onChange={(e) => setCerca(e.target.value)} ariaLabel="Cerca al catàleg" />

      <h4>Cerca amb filtres</h4>
      <form className="search-filters" onSubmit={(e) => e.preventDefault()} aria-label="Cerca amb filtres (exemple)">
        <Camp etiqueta="Què busques?"><CampText tipus="search" placeholder="Cerca pobles, festes, documents…" /></Camp>
        <Camp etiqueta="Categoria"><Selector opcions={[{ valor: '', etiqueta: 'Totes les categories' }, { valor: 'festes', etiqueta: 'Festes' }, { valor: 'llocs', etiqueta: 'Llocs' }]} /></Camp>
        <Boto tipus="submit" varietat="primari" icona={Search}>Cerca</Boto>
      </form>

      <h4>Filtres per tipus amb recompte</h4>
      <PillToggle
        className="sdp-cerca__filtres"
        etiqueta="Filtra per tipus (exemple)"
        valor={tipus}
        onCanvi={setTipus}
        opcions={TIPUS.map(([valor, text, n]) => ({
          valor,
          text: <>{text} <span className="sdp-cerca__recompte">{n}</span></>
        }))}
      />

      <h4>Resultats de cerca</h4>
      <p role="status">S’han trobat <strong>3 resultats</strong> per a «{cerca}»</p>
      <ol className="sdp-cerca__llista">
        <li>
          <ResultatCerca
            titol="Benifallim"
            href="/pobles/benifallim"
            meta={['L’Alcoià', '110 hab']}
            extracte={<>La <mark>festa major</mark> de Benifallim s’allarga una setmana d’agost, amb actes per a tots els públics…</>}
            imatge={{ src: '/assets/towns/benifallim/1.jpg' }}
          />
        </li>
        <li>
          <ResultatCerca
            titol={<>Pepa <mark>Güell</mark></>}
            href="/gent/pepa"
            meta={['La Torre de les Maçanes']}
            avatar={{ nom: 'Pepa Güell', llavor: 'pepa' }}
            accio={<Boto varietat="secundari" aria-label="Escriu-li a Pepa Güell">Escriu-li</Boto>}
          />
        </li>
        <li>
          <ResultatCerca
            titol={<>Programa de la <mark>festa major</mark></>}
            href="/notes?nota=exemple"
            avis="Privada: només la veus tu"
            meta={['12 d’ag. 2026']}
            extracte="Esborrany amb els horaris i qui porta cada cosa."
          />
        </li>
      </ol>

      <h4>Sense resultats</h4>
      <EstatBuit icona={Search} titol="Cap resultat per a «festa majó»"
        accio={<Boto varietat="secundari">Busca a tot arreu</Boto>}>
        Revisa com ho has escrit o prova amb menys paraules: només ixen els resultats que les contenen totes.
      </EstatBuit>

      <h4>Una font ha fallat</h4>
      <Alerta to="avis" titol="No s’ha pogut buscar en el padró del poble"
        accions={<Boto varietat="secundari">Torna-ho a provar</Boto>}>
        SDP-XAT-003: no eres membre d’aquest poble.
      </Alerta>

      <h4>Paginació simplificada (anterior / següent)</h4>
      <div className="pagination-simple">
        <a href="#anterior" onClick={(e) => e.preventDefault()}>
          <span className="pagination-label">← Article anterior</span>
          <span className="pagination-title">Les festes de la Magdalena</span>
        </a>
        <a className="next" href="#seguent" onClick={(e) => e.preventDefault()}>
          <span className="pagination-label">Article següent →</span>
          <span className="pagination-title">La ruta del riu-rau</span>
        </a>
      </div>
    </Especimen>
  );
}
