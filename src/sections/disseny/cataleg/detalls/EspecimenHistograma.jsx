import { Especimen } from '../Especimen.jsx';
import { Histograma } from '../../../../components/PedraSeca/index.js';

/* Valors inventats per a la mostra. */
const PER_HORA = [0, 0, 1, 0, 0, 0, 2, 4, 3, 1, 0, 0, 0, 1, 5, 2, 1, 0, 0, 3, 2, 1, 0, 0];
const HORES = PER_HORA.map((valor, h) => {
  const hh = String(h).padStart(2, '0');
  return { id: hh, etiqueta: `${hh} h`, marca: h % 3 === 0 ? hh : '', valor };
});

const SETMANA = [
  ['dl', 'dilluns', 12], ['dt', 'dimarts', 9], ['dc', 'dimecres', 15], ['dj', 'dijous', 7],
  ['dv', 'divendres', 18], ['ds', 'dissabte', 22], ['dg', 'diumenge', 4]
].map(([marca, etiqueta, valor]) => ({ id: marca, marca, etiqueta, valor }));

export default function EspecimenHistograma() {
  return (
    <Especimen id="histograma" nom="Histograma" fitxer="src/components/PedraSeca/organismes/Histograma.jsx"
      descripcio="Barres verticals fetes només amb CSS: l’alçada és una classe de nivell (de 0 a 10, de 10 en 10 %) i no hi ha style= ni cap llibreria de gràfics. Cada barra diu el seu valor sencer al lector de pantalla."
      contracte={[
        ['barres', '{ id?, etiqueta, valor, marca? }[]', '[]', 'etiqueta: el nom sencer per al lector; marca: el text curt de davall (\'\' per a cap).'],
        ['titol', 'string', '—', 'El peu de la figura i el seu nom.'],
        ['unitat', 'string', '\'\'', 'Al text del lector («07 h: 3 episodis»).'],
        ['maxim', 'nombre', 'el més gran', 'El valor que omplin la barra sencera.'],
        ['destacada', 'id', 'null', 'La barra que es remarca (p. ex. l’hora d’ara).'],
        ['valors', 'boolean', 'true', 'La xifra damunt de cada barra (mai amb zero).'],
        ['formatValor', 'fn(valor) → text', 'String', 'Per a la xifra i el lector.']
      ]}
      a11y={['<figure> amb el nom del títol; cada barra és un element de llista amb el text sencer.', 'El dibuix (pista, barra, xifra i marca) és aria-hidden.']}
      fes={['Una marca de cada tres quan hi ha moltes barres.', 'Fixar maxim per a comparar dues setmanes amb la mateixa escala.']}
      noFacis={['Calcular alçades amb style=: les classes de nivell ja hi són.', 'Colors per categoria: no n’hi ha paleta.']}>
      <Histograma titol="Per hora del dia (mostra)" barres={HORES} unitat="apunts" destacada="14" />
      <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta">
        <Histograma titol="Per dia de la setmana (mostra)" barres={SETMANA} unitat="apunts" destacada="ds" />
      </div>
    </Especimen>
  );
}
