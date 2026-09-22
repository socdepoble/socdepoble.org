import { Especimen } from '../Especimen.jsx';

export default function EspecimenUniversalWorkspace() {
  return (
    <Especimen 
      id="universalworkspace" 
      nom="Universal Workspace" 
      fitxer="src/components/universal/workspace/UniversalWorkspace.jsx"
      descripcio="L'esquelet genèric de l'espai de treball (basat en AppGridShell). Agnòstic del domini, injecta columnes, dades i detalls per formar seccions completes."
      fes={[
        'Integrar les "Pàgines de Presentació" com el primer ítem de la llista (ex: "fonaments"), fent servir la propietat `image` de l\'ítem per mostrar una miniatura quadrada.',
        'Mantenir les capçaleres de les columnes netes i unificades sota l\'esquema de Pedra Seca.',
        'Utilitzar `UniversalPage` per a renderitzar els detalls.'
      ]}
      noFacis={[
        'Utilitzar `renderIntroCard` per forçar un banner massiu i heterogeni sobre la columna de la llista.',
        'Trencar l\'arquitectura agnòstica introduint codi específic de domini (ex: notes, disseny) a dins de `UniversalWorkspace.jsx`.'
      ]}
    >
      <table>
        <caption>Variants d'Ús i Anatomia</caption>
        <thead>
          <tr>
            <th scope="col">Variant</th>
            <th scope="col">Descripció</th>
            <th scope="col">Exemple d'Ús</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Espai Estàndard (3 columnes)</strong></td>
            <td>Columna esquerra (Categories), central (Llista d'elements) i dreta (Detall o Editor). L'element seleccionat apareix marcat amb l'estil de "píndola blava" (<code>aria-current="page"</code>).</td>
            <td>Secció de Notes, Disseny o Wiki de Poble.</td>
          </tr>
          <tr>
            <td><strong>Presentació (Intro Page)</strong></td>
            <td>Tota secció basada en l'espai universal ha de tindre la seua pròpia "pàgina de presentació". Esta pàgina s'ha d'injectar <strong>com el primer element de la llista (items)</strong>, aprofitant la miniatura (<code>image</code>) en comptes d'afegir targetes intrusives a dalt del llistat.</td>
            <td>La targeta "Bloc de notes" a les notes, o "Wiki de Poble" a la Wiki.</td>
          </tr>
        </tbody>
      </table>
      
      <table>
        <caption>Colors i Estils (Pedra Seca)</caption>
        <thead>
          <tr>
            <th scope="col">Element</th>
            <th scope="col">Estil visual i propòsit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Fons Llistat</strong></td>
            <td>Utilitza <code>var(--sdp-crom-fons)</code> (un fons clar) per al carril d'elements.</td>
          </tr>
          <tr>
            <td><strong>Element Actiu (Píndola)</strong></td>
            <td>La classe <code>.sdp-workspace-nav-item</code> en estat <code>aria-current="page"</code> utilitza el color corporatiu (blau) i radi pronunciat, destacant visualment la selecció.</td>
          </tr>
        </tbody>
      </table>
    </Especimen>
  );
}
