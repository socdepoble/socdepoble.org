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
          ['onManageCategories', '() => void', '—', 'Afig el botó «Configurar categories». La roda dentada no en depén: és sempre present (vegeu la fila de davall).'],
          ['(roda dentada)', 'Llei de la Roda Dentada', '—', 'Ordre del Mestre (261007) · El lloc estàndard de la personalització de l’espai, a tots els UniversalWorkspace, desplegat o en rail. Dues seccions: «Amplada de les columnes», amb els tres valors predefinits i «Restablir l’amplada de les columnes»; i, si la navegació té carpetes o categories, «Carpetes a la vista», un interruptor per cada carpeta de primer nivell («Tot» no s’amaga mai). Amagar una carpeta només la lleva de la navegació: MAI l’esborra, i els seus documents continuen a «Tot» i a la cerca. Sense «Tot» (mode compacte), sempre en queda una a la vista. La preferència es guarda per espai (carpetesVisibles.js).'],
          ['idEspai', 'string', 'la clau de mestreDetall o l’espai comú', 'Qui és l’espai per a les seues preferències («Carpetes a la vista»): minúscules, xifres i guions. Sense, la clau del mestre-detall ({ clau }: wiki, notes, disseny, perfil) i, si tampoc n’hi ha, l’espai comú.'],
          ['tagFilter / collapsibleNavigation / replegaTotaCapcalera / sortable', 'boolean', 'true / true / false / false', 'Filtre d’etiquetes, grups plegables, capçalera que replega sencera i ordenació del llistat.'],
          ['listClassName / detailClassName / className', 'string', "''", 'Ganxos CSS per a la pell de cada secció.'],
          ['mestreDetall', "false | 'navegacio' | 'detall' | { clau, element }", 'false', 'Mestre-detall en estret (ordre del Mestre, 261003): primera vista la navegació (o la llista si no n’hi ha) o, amb un enllaç profund, el detall. Les seccions passen { clau, element } (l’element de la URL crua): si és el de quan es va deixar el mòdul (Arrere, recàrrega), el nivell on era la persona. Es llig en muntar. Ignorat en mode compacte; en ample i mitjà no canvia res.'],
          ['tornaDeLaLlista', '() => void', 'null', 'Sense navegació, la fletxa ← de la llista en estret (labels.back). Admin: tornar al Tauler.'],
          ['obridorALaLlista', 'boolean', 'true', 'Ordre del Mestre (261026_2126, pla 261026_1615 §6) · Amb false, la carpeta de l’esquerra del títol de la llista (icons.categories) es lleva només en «mitja», la tauleta, on el rail fix de la navegació és una porta a la vista. En «estret», el mòbil, es queda: la llista oberta tapa el rail i la carpeta és l’única porta; en el mode compacte, sense rail, també. Cap funció es perd. Només el passa el Bloc de Notes.'],
        ]}
        a11y={[
          'La categoria activa porta aria-current="page"; l’element actiu del llistat, aria-current="true".',
          'Replegar i desplegar una columna torna el focus al botó que fa l’acció contrària.',
          'En estret amb mestre-detall, cada canvi de panell porta el focus al panell nou: la carpeta o la fitxa actuals, o el seu títol. Les columnes tancades porten inert i aria-hidden.'
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
        {/* Gauntlet 261025_0545 (P1-16) · La taula vessava 20px de la caixa de
            mostra a la columna del detall (1280px). Es desplaça dins de la seua
            caixa a qualsevol amplada, i la caixa és una regió amb el nom de la
            llegenda i tabIndex=0, com a EspecimenGestor.jsx. */}
        <div className="sdp-taula-prosa" role="region" aria-labelledby="universalworkspace-variants" tabIndex={0}>
        <table>
          <caption id="universalworkspace-variants">Variants d’ús i anatomia</caption>
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
              <td>Navegació (categories o grups), llistat d’elements i detall. En mitjà, la navegació és un panell que llisca damunt del llistat. En estret, amb mestreDetall, una sola capa cada vegada: carpetes → llista → detall, i la fletxa ← de la barra blava torna a la llista.</td>
              <td>Notes, Disseny, Wiki de Poble, Perfil i Admin. El Xat no: munta AppGridShell directament (ClosCaXat).</td>
            </tr>
            <tr>
              <td><strong>Presentació</strong></td>
              <td>Tota secció té la seua pàgina de presentació, injectada com el primer element del llistat i amb la miniatura (<code>image</code>).</td>
              <td>«Disseny Pedra Seca» ací; «Bloc de notes» a Notes.</td>
            </tr>
          </tbody>
        </table>
        </div>
      </Especimen>
    </>
  );
}
