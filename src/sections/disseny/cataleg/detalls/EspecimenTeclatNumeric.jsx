import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { TeclatNumeric } from '../../../../components/PedraSeca/index.js';
import { formatEuros } from '../../../../utils/diners.js';

export default function EspecimenTeclatNumeric() {
  const [cents, setCents] = useState(0);
  const [mil, setMil] = useState(250);
  const [acceptat, setAcceptat] = useState(null);
  return (
    <Especimen id="teclat-numeric" nom="TeclatNumeric" fitxer="src/components/PedraSeca/organismes/TeclatNumeric.jsx"
      descripcio="Teclat tàctil per a imports i quantitats. Torna sempre enters: en mode import, cèntims (teclejar 1, 2, 5 dona 125, és a dir 1,25 €, com una caixa registradora); en mode quantitat, unitats. Controlat amb valor i onCanvi."
      contracte={[
        ['valor / onCanvi', 'enter / fn(enter)', '0', 'Controlat. Mai coma flotant.'],
        ['mode', '\'import\' | \'quantitat\'', '\'import\'', 'Import: cèntims, pintats amb formatEuros. Quantitat: enter amb la unitat.'],
        ['maxim', 'enter', '9999999 / 9999', 'Una xifra que el passaria no s’afig.'],
        ['etiqueta', 'string', 'Import / Quantitat', 'El nom del grup i del visor.'],
        ['unitat', 'string', '\'\'', 'En mode quantitat, al visor (ml, u.).'],
        ['onAccepta / textAccepta', 'fn(enter) / string', '— / D’acord', 'Botó primari al peu.'],
        ['desactivat', 'boolean', 'false', 'Totes les tecles disabled.']
      ]}
      a11y={['role="group" amb nom; el visor és un <output> aria-live que diu el valor nou.', 'Amb el focus dins, el teclat físic val: 0-9, Retrocés i Supr. Escape i Retorn no es toquen.']}
      fes={['Arqueig de caixa, efectiu lliurat, mil·lilitres.', 'Guardar el valor en enters i formatar-lo només en pintar-lo.']}
      noFacis={['Convertir el valor a euros amb decimals.', 'Usar-lo per a text: per a això, CampText.']}>
      <div className="sdp-especimen__fila">
        <TeclatNumeric valor={cents} onCanvi={setCents} etiqueta="Efectiu lliurat" onAccepta={setAcceptat} textAccepta="Cobra" />
        <TeclatNumeric valor={mil} onCanvi={setMil} mode="quantitat" etiqueta="Begut" unitat="ml" />
      </div>
      <p role="status">
        {acceptat === null
          ? `Torna ${cents} cèntims (${formatEuros(cents)}) i ${mil} ml.`
          : `Has cobrat ${formatEuros(acceptat)}: el teclat ha tornat l’enter ${acceptat}.`}
      </p>
    </Especimen>
  );
}
