import { useState } from 'react';
import { Coffee, Sandwich } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { Boto, DetallArticle } from '../../../../components/PedraSeca/index.js';

/* Esquelet comú T4/T8 · el detall d'un article. Preus d'exemple. */
const CAFE = { id: 'cafe-llet', nom: 'Cafè amb llet', categoriaId: 'cafes', secundari: 'Amb llet de la casa', valor: '2 variants' };
const CAFES = { id: 'cafes', nom: 'Cafès', icona: Coffee, ordre: 0, visible: true };
const VARIANTS = [
  { valor: 'tassa', etiqueta: 'Tassa', ajuda: '1,50 €' },
  { valor: 'got', etiqueta: 'Got', ajuda: '1,60 €' }
];
/* Un grup obligatori (disseny del Bar §A.6, flux 1): el diàleg menut. */
const ENTREPA = { id: 'entrepa-truita', nom: 'Entrepà de truita', categoriaId: 'esmorzars', valor: '3,50 €' };
const ESMORZARS = { id: 'esmorzars', nom: 'Esmorzars', icona: Sandwich, ordre: 1, visible: true };
const PANS = [
  { valor: 'barra', etiqueta: 'Pa de barra', ajuda: '3,50 €' },
  { valor: 'llesca', etiqueta: 'Pa de llesca', ajuda: '3,50 €' }
];

export default function EspecimenDetallArticle() {
  const [obert, setObert] = useState(null);
  const [avis, setAvis] = useState('Obri el detall i tria variant, quantitat i nota; o obri la tria directa i toca un pa.');
  const tanca = () => setObert(null);
  return (
    <Especimen id="detall-article" nom="DetallArticle" fitxer="src/components/PedraSeca/organismes/DetallArticle.jsx"
      descripcio="El detall d’un article dins d’un Dialeg: les variants (Tassa, Got) o l’especificació (1 kg, desnatada), la quantitat amb el teclat numèric i una nota. Guarda només un esborrany, que torna a començar a cada obertura, i el torna amb onAccepta. Amb triaDirecta és el diàleg menut d’un grup obligatori: un toc tria i tanca."
      contracte={[
        ['obert / onTanca / article / categoria', 'boolean · funció · article · categoria', '—', 'Sense article no s’obri. El títol és el nom i la descripció, l’especificació.'],
        ['variants', '[{ valor, etiqueta, ajuda? }]', '[]', 'GrupOpcions: l’ajuda porta el preu de la variant.'],
        ['triaDirecta', 'boolean', 'false', 'Grup obligatori: cada variant és un botó i un toc accepta. Sense ràdios, quantitat, nota ni «Afig».'],
        ['inicial', '{ variant?, quantitat?, nota? }', 'null', 'Per a editar una línia ja feta.'],
        ['ambQuantitat / ambNota / etiquetaNota / unitat', 'boolean · boolean · string · string', "true · true · 'Nota' · ''", 'La quantitat comença en 1 i la primera tecla la substituïx.'],
        ['onAccepta({ variant, quantitat, nota }, article)', 'funció', '—', 'Amb quantitat 0 no es pot acceptar.'],
        ['accions / children', 'node', 'null', 'Botons de més al peu; informació de més al cos (al·lèrgens).']
      ]}
      a11y={['És un Dialeg: trampa de focus, Escape i el focus torna al botó que l’ha obert.', 'Les variants són ràdios natius dins d’un fieldset amb llegenda; en la tria directa, botons natius dins del mateix fieldset.']}
      fes={['Obrir-lo des de l’acció secundària d’una rajola.', 'Fer servir triaDirecta quan el producte té un grup obligatori: dos tocs per producte.']}
      noFacis={['Fer un diàleg de variants propi a cada app.', 'Obrir el detall sencer a cada toc d’un producte amb variants: el toc afig la per defecte.']}>
      <Boto onClick={() => setObert('detall')}>Obri el detall de mostra</Boto>
      {' '}
      <Boto onClick={() => setObert('directa')}>Obri la tria directa de mostra</Boto>
      <DetallArticle obert={obert === 'detall'} article={CAFE} categoria={CAFES} variants={VARIANTS} onTanca={tanca}
        onAccepta={({ variant, quantitat, nota }) => {
          setAvis(`Acceptat: ${quantitat} × ${variant}${nota ? ` (${nota})` : ''}.`);
          tanca();
        }} />
      <DetallArticle obert={obert === 'directa'} triaDirecta article={ENTREPA} categoria={ESMORZARS} variants={PANS} etiquetaVariants="Pa"
        onTanca={tanca}
        onAccepta={({ variant, quantitat }) => {
          setAvis(`Tria directa: ${quantitat} × ${variant}.`);
          tanca();
        }} />
      <p role="status">{avis}</p>
    </Especimen>
  );
}
