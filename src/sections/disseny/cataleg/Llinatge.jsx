/**
 * Llinatge.jsx — D'on penja una peça universal, dit dins del seu espècimen.
 *
 * T52 (ordre del Mestre, 260928: «que quede clar quin és l'element universal
 * pare que controla els altres») · Viu al costat d'Especimen.jsx perquè el
 * pinten molts especímens, i l'arbre sencer (EspecimenArbreUniversal) en fa
 * servir NomDeNode. Esmena D10 de la revisió de T52a: abans vivia dins d'un
 * espècimen i en depenien deu més. Les dades i la lògica (pares, relacions,
 * rutes) són a manifest.js, sense React; ací només es pinten.
 */
import { Link } from '../../../app/contexts/RouterContext.jsx';
import { MollaPa } from '../../../components/PedraSeca/index.js';
import {
  cadenaUniversal, esTransversal, explicaRelacio, fillsUniversals, nodeUniversal, rutaEspecimen, usuarisUniversals
} from './manifest.js';

const LLISTA = new Intl.ListFormat('ca', { type: 'conjunction' });

/** El nom d'una peça: enllaç al seu espècimen si en té i no és la d'esta pàgina. */
export function NomDeNode({ node, actual = false }) {
  const ruta = !actual && node.item ? rutaEspecimen(node.item) : null;
  return ruta ? <Link to={ruta}>{node.nom}</Link> : <strong>{node.nom}</strong>;
}

function LlistaDeNodes({ nodes }) {
  return nodes.map((node, i) => (
    <span key={node.id}>{i ? ', ' : ''}<NomDeNode node={node} /></span>
  ));
}

/* El camí des de la closca (MollaPa: l'últim pas és la peça d'esta pàgina),
   què passa quan es toca el pare (la relació), qui més la munta a l'app, qui
   en depén i quins transversals fa servir. */
export function Llinatge({ id }) {
  const node = nodeUniversal(id);
  if (!node) return null;
  const titolId = `llinatge-${id}`;
  const fills = fillsUniversals(id);
  const usa = (node.usa || []).map(nodeUniversal).filter(Boolean);
  const transversal = esTransversal(node);
  const usuaris = transversal ? usuarisUniversals(id) : [];
  const relacio = explicaRelacio(id);
  const consumidors = node.consumidors || [];
  return (
    <section className="sdp-llinatge" aria-labelledby={titolId}>
      <h3 id={titolId}>Llinatge universal</h3>
      {transversal ? (
        <p><strong>{node.nom}</strong> és transversal: no penja de cap branca i la fa servir qualsevol peça.</p>
      ) : (
        <>
          <p>El pare universal és el pas d’abans; la closca d’App.jsx és l’arrel de tot.</p>
          <MollaPa passos={cadenaUniversal(id).map((pas) => ({
            etiqueta: pas.nom,
            a: pas.id !== id && pas.item ? rutaEspecimen(pas.item) : undefined
          }))} />
        </>
      )}
      {relacio ? <p className="sdp-llinatge__relacio">{relacio}</p> : null}
      <p>{node.rol}</p>
      {consumidors.length ? <p>La munten a l’app: {LLISTA.format(consumidors)}.</p> : null}
      {fills.length ? <p>En depenen: <LlistaDeNodes nodes={fills} />.</p> : null}
      {usa.length ? <p>Fa servir: <LlistaDeNodes nodes={usa} />.</p> : null}
      {usuaris.length ? <p>La fan servir: <LlistaDeNodes nodes={usuaris} />.</p> : null}
    </section>
  );
}

export default Llinatge;
