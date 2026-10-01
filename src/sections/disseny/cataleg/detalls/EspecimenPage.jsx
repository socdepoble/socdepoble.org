import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';

export default function EspecimenPage() {
  return (
    <>
    <Llinatge id="page" />
    <Especimen id="page" nom="UniversalPage · el crom de pàgina" fitxer="src/components/universal/UniversalPage.jsx"
        descripcio="NO és la bastida. És el que viu dins de la Finestra: barra blava (navegació de pàgina), imatge, barra taronja (autoria i data), capçalera amb h1 i article."
        contracte={[           ['chrome', "'full'|'context'|'system'|'page'|'none'", "'page'", 'Quines barres es pinten.'],           ['title / subtitle / lead', 'node', '—', 'h1 únic de la pàgina; h2 i entradeta.'],           ['labels', '(string|{ text, className, href, onClick })[]', '[]', 'Insígnies de taxonomia.'],
          ['heroImage / heroAlt', 'string', '—', 'Imatge de capçalera; heroAlt obligatori si informa.'],
        ]}
        fes={['Un sol h1 per pàgina.']} noFacis={['Rebatejar-la a «UniversalShell»: té desenes de consumidors.']}>
      <p>Aquesta mateixa pàgina de Disseny és un espècimen viu de UniversalPage amb chrome=&quot;context&quot;.</p>

      <h3>Barra Blava (Navegació i Accions)</h3>
      <p>Organitzada en tres zones d'alta densitat (sense separació extra entre icones):</p>
      <ul>
        <li><strong>Esquerra:</strong> Controls de navegació, en aquest ordre: Arrere · Índex · Endavant. Les fletxes només hi són si la pàgina en té destí.</li>
        <li><strong>Centre:</strong> Eines contextuals (traducció, xat privat, compartir), centrades respecte a tota la barra.</li>
        <li><strong>Dreta:</strong> Botó d'acció principal (Connectar). Quan la barra fa 480px d'ample o menys, també en una columna estreta d'una pantalla gran, perd el text i queda un cercle amb «+».</li>
      </ul>

      <h3>Barra Taronja (Context i Autoria)</h3>
      <p>Distribueix les metadades de l'element actiu:</p>
      <ul>
        <li><strong>Esquerra:</strong> Identitat visual (avatar), nom i poble.</li>
        <li><strong>Centre:</strong> L’emoticona del document (EmoticonaBarra): en edició, el botó que la tria; en lectura, només si n’hi ha una de triada.</li>
        <li><strong>Dreta:</strong> Hora i data en una pastilla de text, sense icona. Mai buida: en lectura, la de creació o la de l’última modificació; en edició, la triada al calendari o la d’ara. Una font de només dia es pinta sense hora. En lectura, la pastilla és un botó que obri el Calendari en el mes de la data, amb totes les targetes d’eixe mes (ordre del Mestre, 261001).</li>
      </ul>
    </Especimen>
    </>
  );
}
