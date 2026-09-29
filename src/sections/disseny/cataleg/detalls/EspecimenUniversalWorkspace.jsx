import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · Contracte contrastat amb
   UniversalWorkspace.jsx. L'espècimen viu és esta mateixa pàgina: Disseny,
   Notes, la Wiki, Perfil i Admin són UniversalWorkspace. Esmena D1 de la
   revisió de T52a · el Xat no: ClosCaXat munta AppGridShell directament. */
export default function EspecimenUniversalWorkspace() {
  return (
    <>
      <Llinatge id="workspace" />
      <Especimen
        id="universalworkspace"
        nom="UniversalWorkspace · el pare dels gestors"
        fitxer="src/components/universal/workspace/UniversalWorkspace.jsx"
        descripcio="L’esquelet genèric de l’espai de treball. No sap res de cap domini: rep el model i les funcions de pintat, i munta AppGridShell amb tres columnes (navegació, llistat i detall), les capçaleres (AppGridColumn), la cerca, el filtre d’etiquetes i la roda dentada. L’espècimen viu és esta mateixa pàgina de Disseny."
        contracte={[
          ['model', '{ status, error, categories | navigationGroups, items, canCreate, refresh, … }', '{}', 'Les dades. items[].image fa la miniatura quadrada; items[].icon, l’emoticona del rail.'],
          ['initialSelection / selection / onSelectionChange', '{ categoryId, itemId } / (sel, meta) => void', '—', 'Selecció controlada (Disseny la guarda a la URL). meta.reason diu si ha sigut la persona.'],
          ['renderItem', '({ item, active, onSelect }) => node', 'fitxa per defecte', 'La fitxa pròpia de cada element del llistat (Notes: NotaFitxa).'],
          ['renderDetail', '({ item, selection }) => node', '—', 'La columna dreta: una UniversalPage en lectura o un DocumentEditor en edició.'],
          ['labels / icons', 'objecte', 'CATEGORIES · ELEMENTS', 'Textos i icones de les capçaleres i dels botons.'],
          ['onCreate / onCreateError', 'funcions', '—', 'Crear un element i avisar si no es pot.'],
          ['onManageCategories', '() => void', '—', 'Afig el botó «Configurar categories». La roda dentada és sempre present i obri els presets d’amplada.'],
          ['tagFilter / collapsibleNavigation / replegaTotaCapcalera / sortable', 'boolean', 'true / true / false / false', 'Filtre d’etiquetes, grups plegables, capçalera que replega sencera i ordenació del llistat.'],
          ['listClassName / detailClassName / className', 'string', "''", 'Ganxos CSS per a la pell de cada secció.'],
        ]}
        a11y={[
          'La categoria activa porta aria-current="page"; l’element actiu del llistat, aria-current="true".',
          'Replegar i desplegar una columna torna el focus al botó que fa l’acció contrària.'
        ]}
        fes={[
          'Posar la presentació de la secció com a primer element del llistat, amb la seua miniatura (image).',
          'Pintar el detall amb UniversalPage (lectura) o DocumentEditor (edició).'
        ]}
        noFacis={[
          'Un bàner o una targeta de presentació damunt del llistat: no hi ha cap ranura per a això.',
          'Codi de domini (notes, disseny) dins d’UniversalWorkspace.jsx.',
          'Embolcallar el Workspace amb una UniversalPage.'
        ]}
      >
        <table>
          <caption>Variants d’ús i anatomia</caption>
          <thead>
            <tr>
              <th scope="col">Variant</th>
              <th scope="col">Descripció</th>
              <th scope="col">Exemple d’ús</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Espai estàndard (3 columnes)</strong></td>
              <td>Navegació (categories o grups), llistat d’elements i detall. En mitjà i estret, AppGridShell passa les columnes a pestanyes.</td>
              <td>Notes, Disseny, Wiki de Poble, Perfil i Admin. El Xat no: munta AppGridShell directament (ClosCaXat).</td>
            </tr>
            <tr>
              <td><strong>Presentació</strong></td>
              <td>Tota secció té la seua pàgina de presentació, injectada com el primer element del llistat i amb la miniatura (<code>image</code>).</td>
              <td>«Disseny Pedra Seca» ací; «Bloc de notes» a Notes.</td>
            </tr>
          </tbody>
        </table>
      </Especimen>
    </>
  );
}
