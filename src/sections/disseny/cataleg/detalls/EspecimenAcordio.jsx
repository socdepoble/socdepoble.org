import { Especimen } from '../Especimen.jsx';
import { Accordion, AccordionItem } from '../../../../components/PedraSeca/index.js';

export default function EspecimenAcordio() {
  return (
    <Especimen id="acordio" nom="Accordion · AccordionItem" fitxer="src/components/PedraSeca/Accordion.jsx"
        descripcio="Contingut plegable per a preguntes freqüents i ajustos llargs."
        contracte={[['AccordionItem.title', 'node', '—', 'Capçalera clicable.'], ['AccordionItem.defaultOpen', 'boolean', 'false', '—']]}
        fes={['Preguntes freqüents.']} noFacis={['Amagar la informació principal d’una pàgina.']}>
      <Accordion>
          <AccordionItem title="Què és Sóc de Poble?"><p>Una xarxa pública per als pobles, feta des del poble.</p></AccordionItem>
          <AccordionItem title="Com puc col·laborar?"><p>Aportant fotos antigues o entrevistant els majors.</p></AccordionItem>
        </Accordion>
    </Especimen>
  );
}
