import AppGridColumn from '../../../../components/layout/AppGridColumn.jsx';
import { Especimen } from '../Especimen.jsx';
import { Alerta, BarraResum, MarcColumna } from '../../../../components/PedraSeca/index.js';

/* Esquelet comú T4/T8 · el marc de cada columna de l'esquelet. */
export default function EspecimenMarcColumna() {
  return (
    <Especimen id="marc-columna" nom="MarcColumna" fitxer="src/components/PedraSeca/organismes/MarcColumna.jsx"
      descripcio="El marc de cada columna de l’esquelet sobre AppGridShell: la capçalera fixa (AppGridColumn), una fila d’eines fixa, el cos que fa scroll i un peu fix. Les columnes de src/apps/comu/esquelet no porten cap classe pròpia: tota la geometria és d’este marc."
      contracte={[
        ['capcalera', 'node', 'null', 'AppGridColumn amb el títol de la columna.'],
        ['eines', 'node', 'null', 'Selector de categoria, vista, afegit ràpid o el resum de la col·lecció.'],
        ['avis', 'node', 'null', 'Un avís de l’app dins del marc: el primer fill del cos, davall de la capçalera i de les eines; fa scroll amb el cos (Llei de Scroll). L’espai el posa l’Alerta (el seu marge), igual en totes les columnes. Sense avís, o si el node no pinta res, el DOM de sempre.'],
        ['children', 'node', '—', 'El cos: l’únic que es desplaça (Llei de Scroll).'],
        ['peu', 'node', 'null', 'La BarraResum del mòbil.'],
        ['etiqueta', 'string', '—', 'Amb etiqueta, el cos és una regió amb nom que es pot enfocar i desplaçar amb el teclat.']
      ]}
      a11y={['El cos amb etiqueta és role="region" amb tabindex="0": es desplaça amb les fletxes.']}
      fes={['Posar el que no s’ha de moure a eines o al peu.', 'Passar l’avís de la pantalla (per què ara no es pot vendre) per la prop avis: va dins del marc, al principi del cos.']}
      noFacis={['Fer scroll a la columna sencera: la capçalera es perdria.', 'Pintar un avís damunt del marc: la capçalera baixaria i deixaria d’alinear-se amb les del costat.']}>
      <div className="sdp-especimen__mostra sdp-especimen__mostra--columna">
        <MarcColumna capcalera={<AppGridColumn titol="Comanda" />}
          eines={<BarraResum etiqueta="Comanda" comptador={2} textComptador={(n) => `${n} línies`} total="4,50 €" />}
          avis={<Alerta to="avis" viva={false}>Avís de mostra: va dins del marc, davall de les eines.</Alerta>}
          peu={<p>Peu fix de mostra</p>} etiqueta="Cos de mostra">
          <p>El cos de la columna: l’única part que fa scroll.</p>
        </MarcColumna>
      </div>
    </Especimen>
  );
}
