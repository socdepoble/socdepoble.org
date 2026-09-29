import { Especimen } from '../Especimen.jsx';
import { NomDeNode } from '../Llinatge.jsx';
import { ARBRE_UNIVERSAL, ARREL_UNIVERSAL, esTransversal, etiquetaRelacio, fillsUniversals, nodeUniversal } from '../manifest.js';

/* T52 (ordre del Mestre, 260928: «que quede clar quin és l'element universal
   pare que controla els altres») · L'arbre sencer. Les dades i la lògica
   (pares, relacions, fills, rutes) són a manifest.js, sense React; el
   llinatge de cada espècimen és a cataleg/Llinatge.jsx. */

/* La relació amb el pare, només quan no és «munta» (esmena D2 de la revisió
   de T52a: la targeta és una versió de PageFrame i no n'hereta res). */
function Relacio({ node }) {
  const etiqueta = etiquetaRelacio(node);
  return etiqueta ? <em className="sdp-arbre__relacio">{etiqueta}</em> : null;
}

function Branca({ pare }) {
  const fills = fillsUniversals(pare);
  if (!fills.length) return null;
  return (
    <ul>
      {fills.map((node) => (
        <li key={node.id}>
          <NomDeNode node={node} /> <code>{node.fitxer}</code> <Relacio node={node} />
          <span className="sdp-arbre__rol">{node.rol}</span>
          <Branca pare={node.id} />
        </li>
      ))}
    </ul>
  );
}

export default function EspecimenArbreUniversal() {
  const arrel = nodeUniversal(ARREL_UNIVERSAL);
  const transversals = ARBRE_UNIVERSAL.filter(esTransversal);
  return (
    <Especimen id="arbre-universal" nom="Arbre universal · qui governa qui"
      fitxer="src/sections/disseny/cataleg/manifest.js (ARBRE_UNIVERSAL)"
      descripcio="Cada peça té un pare universal, i la relació diu què passa quan es toca. Si el pare la munta, decidix on i quan apareix, però no en canvia l’anatomia. Si la peça instancia el pare, n’hereta qualsevol canvi: per això els fills s’instancien, no es copien. Si en és una versió reduïda, no n’hereta res i un canvi s’ha de fer a tots dos. Els enllaços porten a l’espècimen de cada peça."
      a11y={['L’arbre és una llista niada: el lector de pantalla anuncia el nivell de cada peça.', 'El llinatge de cada espècimen és una molla de pa (nav + ol) amb la peça d’esta pàgina marcada amb aria-current.']}
      fes={[
        'Instanciar el pare universal (PageFrame, UniversalCard, AppGridShell, Dialeg) i passar-li dades.',
        'Dir a cada espècimen d’on penja (Llinatge) i afegir la peça ací quan naix, amb la seua relació.',
        'Recordar que UniversalToolbar és la barra d’eines de l’editor, no la barra blava.'
      ]}
      noFacis={[
        'Copiar a mà el DOM d’una barra o d’una capçalera: les còpies es desvien de l’original.',
        'Tocar PageFrame i donar per fet que la targeta també canvia: UniversalCard n’és una versió i no n’hereta res.',
        'Buscar un UniversalShell: la closca és el JSX d’App.jsx.',
        'Embolcallar un UniversalWorkspace amb una UniversalPage (la pàgina viu dins de la columna dreta).'
      ]}>
      <ul className="sdp-arbre">
        <li>
          <NomDeNode node={arrel} /> <code>{arrel.fitxer}</code>
          <span className="sdp-arbre__rol">{arrel.rol}</span>
          <Branca pare={arrel.id} />
        </li>
      </ul>
      <h4>Transversals</h4>
      <ul className="sdp-arbre">
        {transversals.map((node) => (
          <li key={node.id}>
            <NomDeNode node={node} /> <code>{node.fitxer}</code>
            <span className="sdp-arbre__rol">{node.rol}</span>
          </li>
        ))}
      </ul>
    </Especimen>
  );
}
