import { Especimen } from '../Especimen.jsx';
import { Alerta } from '../../../../components/PedraSeca/index.js';

export default function EspecimenPage() {
  return (
    <Especimen id="page" nom="UniversalPage · el crom de pàgina" fitxer="src/components/universal/UniversalPage.jsx"
        descripcio="NO és la bastida. És el que viu dins de la Finestra: barra blava (navegació de pàgina), imatge, barra taronja (autoria i data), capçalera amb h1 i article."
        contracte={[           ['chrome', "'full'|'context'|'system'|'page'|'none'", "'page'", 'Quines barres es pinten.'],           ['title / subtitle / lead', 'node', '—', 'h1 únic de la pàgina; h2 i entradeta.'],           ['labels', '(string|{ text, className, href, onClick })[]', '[]', 'Insígnies de taxonomia.'],
          ['heroImage / heroAlt', 'string', '—', 'Imatge de capçalera; heroAlt obligatori si informa.'],
        ]}
        fes={['Un sol h1 per pàgina.']} noFacis={['Rebatejar-la a «UniversalShell»: té desenes de consumidors.']}>
      <p>Aquesta mateixa pàgina de Disseny és un espècimen viu de UniversalPage amb chrome=&quot;full&quot;.</p>
    </Especimen>
  );
}
