/* Pla 261109 · R56: traça de la variant d’identificadors llargs;
   conserva les taules prèvies i reserva 12ch només a les columnes indicades. */
import { Especimen } from '../Especimen.jsx';
import { Taula, Insignia } from '../../../../components/PedraSeca/index.js';

const POBLES = [
  ['Petrer', 'Alacant', '34.000', 'exit', 'Actiu'],
  ['Ontinyent', 'València', '36.000', 'avis', 'Pendent'],
  ['Morella', 'Castelló', '2.500', 'info', 'Revisió']
];

export default function EspecimenTaula() {
  return (
    <Especimen id="taula" nom="Taula" fitxer="src/components/PedraSeca/organismes/Taula.jsx"
      descripcio="Taula de dades amb desplaçament horitzontal contingut. <table> natiu dins d'una regió amb nom accessible i tabIndex=0: una taula que es desplaça ha de ser operable amb teclat (WCAG 2.1.1)."
      contracte={[
        ['titol', 'string', '—', 'Obligatori: aria-label de la regió. Una taula sense nom no es pot navegar.'],
        ['densa', 'boolean', 'false', 'Files més curtes per a taules de referència.'],
        ['className', 'string', '—', 'sdp-taula--identificadors reserva lectura a les dues primeres columnes d’IDs; la resta de taules conserva l’amplària pròpia.'],
        ['children', '<thead> · <tbody>', '—', 'Sempre amb <th scope="col"> a la capçalera.']
      ]}
      a11y={['Capçaleres amb scope.', 'Estat en text (Insignia), mai només color.']}
      fes={['Números alineats a la dreta amb .sdp-text-dreta.']}
      noFacis={['Taules per a maquetar.', 'div amb aparença de taula.']}>
      <Taula titol="Cens de pobles (exemple)">
        <thead><tr><th scope="col">Poble</th><th scope="col">Província</th><th scope="col">Habitants</th><th scope="col">Estat</th></tr></thead>
        <tbody>
          {POBLES.map(([poble, prov, hab, to, estat]) => (
            <tr key={poble}><td>{poble}</td><td>{prov}</td><td className="sdp-text-dreta">{hab}</td><td><Insignia to={to}>{estat}</Insignia></td></tr>
          ))}
        </tbody>
      </Taula>
      <h4>Densa (referència)</h4>
      <Taula titol="Recursos (exemple dens)" densa>
        <thead><tr><th scope="col">Recurs</th><th scope="col">Tipus</th><th scope="col">Data</th></tr></thead>
        <tbody>
          <tr><td>Festa de la Mare de Déu</td><td>Esdeveniment</td><td>15/08/2024</td></tr>
          <tr><td>Plaça Major</td><td>Lloc</td><td>—</td></tr>
          <tr><td>Entrevista a l’alcalde</td><td>Notícia</td><td>03/06/2024</td></tr>
        </tbody>
      </Taula>
      <h4>Identificadors llargs</h4>
      <p>Exemple de referència: les dues primeres columnes conserven espai de lectura i la regió permet arribar a totes les dades amb teclat.</p>
      <Taula titol="Identificadors llargs (exemple)" densa className="sdp-taula--identificadors">
        <thead><tr><th scope="col">De</th><th scope="col">A</th><th scope="col">Relació</th><th scope="col">Confiança</th><th scope="col">Evidència</th></tr></thead>
        <tbody><tr>
          <td><code>hook:exemple:BeforeRead:identificador_de_fitxer_llarg</code></td>
          <td><code>skill:exemple:lectura_documental_i_verificacio</code></td>
          <td>consulta</td><td><Insignia to="neutre">Exemple</Insignia></td><td>Dades de mostra del catàleg; cap servei consultat</td>
        </tr></tbody>
      </Taula>
    </Especimen>
  );
}
