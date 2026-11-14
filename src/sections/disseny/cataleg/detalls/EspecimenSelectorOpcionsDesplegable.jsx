import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { SelectorOpcionsDesplegable } from '../../../../components/PedraSeca/molecules/SelectorOpcionsDesplegable.jsx';

const OPCIONS = [
  { id: 'casa', titol: 'Tauleta o ordinador de casa', explicacio: <p>La informació d’esta opció apareix ací mateix, abans de la següent opció. Esta mostra no crea cap còpia.</p> },
  { id: 'arxiu', titol: 'Arxiu portàtil en una memòria USB', explicacio: <p>Una alternativa amb text llarg que es pot llegir sencer: no queda amagada en un resum remot ni en un visor amb alçada fixa.</p> },
  { id: 'directe', titol: 'Pont directe entre dos aparells', explicacio: <p>Només esta explicació està desplegada. Amb les fletxes del teclat canvies la tria sense eixir del grup.</p> },
];

export default function EspecimenSelectorOpcionsDesplegable() {
  const [valor, setValor] = useState('casa');
  return <Especimen id="selector-opcions-desplegable" nom="SelectorOpcionsDesplegable"
    fitxer="src/components/PedraSeca/molecules/SelectorOpcionsDesplegable.jsx"
    descripcio="Tria exclusiva amb explicació immediatament davall de cada opció i resum final de dues frases que mai es tallen."
    contracte={[
      ['llegenda', 'ReactNode', '—', 'Nom accessible del grup.'],
      ['opcions', 'array', '—', 'id estable i únic, titol, explicacio i inhabilitada opcional.'],
      ['valor / onCanvi', 'id / funció', '—', 'Estat controlat; no fa peticions.'],
      ['resum', 'Array<ReactNode>', '[]', 'Es pinten les dues primeres frases, senceres: sense el·lipsi ni title; si no caben, fan més línies.'],
    ]}
    a11y={['Radios HTML natius: Tab entra al grup; fletxes i Espai seleccionen. El focus es conserva.', 'Cada explicació seguix el seu control al DOM; no es combina un rol radio amb aria-expanded.', 'Només es reajusta el visor quan el títol i inici del detall quedarien fora; moviment instantani.', 'El ràdio marcat es pinta amb el color del text sobre acció: 3:1 o més sobre el blau de la píndola (WCAG 1.4.11).', 'Píndola i detall comparteixen caixa i eix d’inici, també a partir de 40rem.']}
    fes={['Text explicatiu curt i sense accions automàtiques.', 'Utilitzar la mateixa peça al producte i al catàleg.']}
    noFacis={['Substituir navegació, pestanyes o un visor3D per esta peça sense revisar-ne el context.', 'Amagar tota l’explicació dins del resum final.']}>
    <SelectorOpcionsDesplegable llegenda="On vols guardar la còpia?" opcions={OPCIONS}
      valor={valor} onCanvi={setValor} resumTitol="Resum de la tria"
      resum={[`Destí triat: ${OPCIONS.find((opcio) => opcio.id === valor).titol}`, 'Una tria · explicació adjacent · sense enviaments']} />
  </Especimen>;
}
