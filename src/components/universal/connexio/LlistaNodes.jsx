import { PilotConnexio } from './PilotConnexio.jsx';

/**
 * LlistaNodes.jsx — T9 (261001) · Els nodes on és la persona, presentacional.
 *
 * `nodes` ja ve validat (sections/profile/nodes.js): { id, nom, descripcio,
 * actiu }. El node actiu és on estàs ara: porta aria-current i el pilot amb
 * l'estat dit per al lector de pantalla (`etiquetaEstat`). Els altres no en
 * porten: el pilot parla de la connexió d'ara, no d'un node on no estàs.
 * Sense hooks de proveïdor: el catàleg el munta sense UIProvider.
 */
export function LlistaNodes({ nodes = [], estat, etiquetaEstat }) {
  if (!nodes.length) return null;
  return (
    <ul className="sdp-llista-nodes">
      {nodes.map((node) => (
        <li key={node.id} className="sdp-llista-nodes__node" aria-current={node.actiu ? 'true' : undefined}>
          <p className="sdp-llista-nodes__nom">
            {node.actiu ? <PilotConnexio estat={estat} etiqueta={etiquetaEstat} /> : null}
            <strong>{node.nom}</strong>
          </p>
          {node.descripcio ? <p className="sdp-llista-nodes__descripcio">{node.descripcio}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export default LlistaNodes;
