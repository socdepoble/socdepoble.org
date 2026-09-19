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

      <h3>Barra Blava (Navegació i Accions)</h3>
      <p>Organitzada en tres zones d'alta densitat (sense separació extra entre icones):</p>
      <ul>
        <li><strong>Esquerra:</strong> Controls de navegació (arrere, avant, índex).</li>
        <li><strong>Centre:</strong> Eines contextuals (traducció, xat privat, compartir), centrat matemàticament.</li>
        <li><strong>Dreta:</strong> Botó d'acció principal (Connectar/Publicar). En mòbil perd el text i passa a ser un botó circular d'addició (+).</li>
      </ul>

      <h3>Barra Taronja (Context i Autoria)</h3>
      <p>Distribueix les metadades de l'element actiu:</p>
      <ul>
        <li><strong>Esquerra:</strong> Identitat visual (avatar), nom i poble.</li>
        <li><strong>Dreta:</strong> Hora exacta (amb icona de rellotge) i data.</li>
      </ul>
    </Especimen>
  );
}
