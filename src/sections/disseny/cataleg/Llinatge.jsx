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
import { useLlenguaDisseny } from './Especimen.jsx';
import { ETIQUETES_LLINATGE } from './i18nControlsBarra.js';
import {
  cadenaUniversal, esTransversal, explicaRelacio, fillsUniversals, nodeUniversal, rutaEspecimen, usuarisUniversals
} from './manifest.js';

const LLISTES_LLENGUA = Object.freeze({
  ca: new Intl.ListFormat('ca', { type: 'conjunction' }),
  es: new Intl.ListFormat('es', { type: 'conjunction' }),
  en: new Intl.ListFormat('en', { type: 'conjunction' }),
  eu: new Intl.ListFormat('eu', { type: 'conjunction' }),
  gl: new Intl.ListFormat('gl', { type: 'conjunction' }),
});

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
  const llengua = useLlenguaDisseny();
  if (!node) return null;
  const tx = ETIQUETES_LLINATGE[llengua];
  const llista = LLISTES_LLENGUA[llengua] || LLISTES_LLENGUA.ca;
  const titolId = `llinatge-${id}`;
  const fills = fillsUniversals(id);
  const usa = (node.usa || []).map(nodeUniversal).filter(Boolean);
  const transversal = esTransversal(node);
  const usuaris = transversal ? usuarisUniversals(id) : [];
  const relacio = id === 'barres' && llengua !== 'ca' ? tx.barresRelacio : explicaRelacio(id);
  const rol = id === 'barres' && llengua !== 'ca' ? tx.barresRol : node.rol;
  const consumidors = node.consumidors || [];
  return (
    <section className="sdp-llinatge" aria-labelledby={titolId}>
      <h3 id={titolId}>{tx.titol}</h3>
      {transversal ? (
        <p><strong>{node.nom}</strong> {tx.transversal}</p>
      ) : (
        <>
          <p>{tx.pareUniversal}</p>
          <MollaPa passos={cadenaUniversal(id).map((pas) => ({
            etiqueta: pas.nom,
            a: pas.id !== id && pas.item ? rutaEspecimen(pas.item) : undefined
          }))} />
        </>
      )}
      {relacio ? <p className="sdp-llinatge__relacio">{relacio}</p> : null}
      <p>{rol}</p>
      {consumidors.length ? <p>{tx.munten} {llista.format(consumidors)}.</p> : null}
      {fills.length ? <p>{tx.depenen} <LlistaDeNodes nodes={fills} />.</p> : null}
      {usa.length ? <p>{tx.faServir} <LlistaDeNodes nodes={usa} />.</p> : null}
      {usuaris.length ? <p>{tx.fanServir} <LlistaDeNodes nodes={usuaris} />.</p> : null}
    </section>
  );
}

export default Llinatge;
