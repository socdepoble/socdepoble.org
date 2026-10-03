import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { AfegitRapid } from '../../../../components/PedraSeca/index.js';

/* Esquelet comú T4/T8 · «Necessite…» / «Busca…». Articles sintètics. */
const SUGGERIMENTS = [
  { id: 'llet', nom: 'Llet', secundari: 'Llet i formatge' },
  { id: 'llentilles', nom: 'Llentilles', secundari: 'Llegums' },
  { id: 'pa-llet', nom: 'Pa de llet', secundari: 'Forn' },
  { id: 'creilles', nom: 'Creïlles', secundari: 'Fruita i verdura' },
  { id: 'tomaques', nom: 'Tomaques', secundari: 'Fruita i verdura' }
];

export default function EspecimenAfegitRapid() {
  const [avis, setAvis] = useState('Escriu «ll» o «creilles» (sense accent).');
  return (
    <Especimen id="afegit-rapid" nom="AfegitRapid" fitxer="src/components/PedraSeca/organismes/AfegitRapid.jsx"
      descripcio="Afegir sense buscar a la graella: escrius i trien els suggeriments del catàleg, o es crea un article nou. És el «Necessite…» de La Compra i el «Busca…» del TPV. L’etiqueta sempre es veu; el text que s’escriu no va mai a la URL."
      contracte={[
        ['etiqueta / placeholder / ajuda', 'string', "'Necessite…'", 'L’etiqueta visible del camp; el placeholder només és un exemple.'],
        ['suggeriments', '[{ id, nom, secundari? }]', '[]', 'Els articles del catàleg (o els recents).'],
        ['filtra / maxim', 'boolean · number', 'true · 8', 'Filtre sense accents ni majúscules, primer els que comencen pel text.'],
        ['onTria(article)', 'funció', '—', 'Un suggeriment triat (clic, Intro o el text exacte).'],
        ['onCrea(text)', 'funció', '—', 'Crear el que no hi és. Sense, no es crea res.'],
        ['valor / onCanvi', 'string · funció', '—', 'Mode controlat, si l’app vol el text.']
      ]}
      a11y={['Combobox de l’ARIA 1.2: ↓ i ↑ recorren, Intro tria, Escape tanca i, tancat, buida.', 'L’opció activa és aria-activedescendant: el focus no ix del camp.', 'Un avís diu quants suggeriments hi ha.']}
      fes={['Buidar el camp i deixar-hi el focus després d’afegir: es poden afegir moltes coses seguides.']}
      noFacis={['Fer servir el placeholder com a etiqueta.', 'Posar el text a la URL.']}>
      <AfegitRapid suggeriments={SUGGERIMENTS} placeholder="Ex.: llet"
        onTria={(article) => setAvis(`Afegit: ${article.nom}.`)} onCrea={(text) => setAvis(`Article nou: ${text}.`)} />
      <p role="status">{avis}</p>
    </Especimen>
  );
}
