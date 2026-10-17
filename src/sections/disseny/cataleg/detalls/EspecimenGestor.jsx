import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · Textos contrastats amb AppGridShell.jsx
   (mides i llindars), AppGridShell.css i modules.css (colors del Workspace).
   L'espècimen viu és esta mateixa pàgina: el catàleg és un UniversalWorkspace. */
export default function EspecimenGestor() {
  return (
    <>
      <Llinatge id="appgrid" />
      <Especimen id="gestor" nom="Gestor de tres columnes (AppGridShell)" fitxer="src/components/layout/AppGridShell.jsx"
        descripcio="Navegació · Llistat · Detall. Mesura el seu propi contenidor (ResizeObserver, no la finestra) i tria la mida: ample, mitjà o estret. La lògica i l’anatomia exactes són a .agents/skills/sdp-app-grid-shell/SKILL.md. L’espècimen viu és esta mateixa pàgina de Disseny."
        contracte={[
          ['leftColumn / middleColumn / rightColumn', 'node', '—', 'El contingut de cada columna (UniversalWorkspace hi posa navegació, llistat i detall).'],
          ['leftTitle / middleTitle', 'string', "'ESQUERRA' / 'CENTRE'", 'Els noms de la navegació i del llistat per als separadors («Redimensionar …»).'],
          ['leftIcon / middleIcon', 'Component', 'null', 'S’accepten i no es pinten: la icona de cada columna la pinta la seua capçalera (AppGridColumn).'],
          ['leftCollapsed / middleCollapsed', 'boolean', 'false', 'Columna plegada en carril de 56px (només en ample).'],
          ['initialPane', "'left' | 'middle' | null", 'null', 'Panell obert en començar en mitjà. En estret mana panellEstret.'],
          ['panellEstret', "'left' | 'middle' | null | () => …", 'null', 'Mestre-detall (261003): el panell que s’obri en muntar en estret (el primer mesurament). No es torna a forçar a cada canvi de la URL, i una closca ja muntada que passa d’ample a estret es queda amb el detall. Una funció es crida en eixe moment.'],
          ['tornaEstret', "'left' | 'middle' | null", 'null', 'On torna el detall si no se’n coneix cap panell d’abans. Amb ell, el context oferix tornaDelDetall.'],
          ['onPanell', '(panell) => void', 'null', 'En estret, avisa de cada panell assentat (null és el detall).'],
          ['aria-label / className', 'string', '—', 'Nom de l’article i classe de la pell (sdp-workspace).'],
          ['useAppGrid()', '{ mida, panellObert, setPanellObert, tancaPanells, obriPanell, tornaDelDetall, columnWidths, applyPreset }', '—', 'El context per als fills (la roda dentada aplica els presets). obriPanell obri i porta el focus al panell; tornaDelDetall només existix en estret amb el detall a la vista, i la fan servir les fletxes ← de UniversalPage i UniversalToolbar.'],
        ]}
        fes={[
          'Fila 1 de totes les columnes amb --sdp-workspace-fila1-fons: una sola franja contínua, sense filets entre columnes.',
          'Fila 2 (Tot, roda, lupa, Crear) amb --sdp-workspace-fila2-fons, un gris més clar que la fila 1, a la mateixa alçada a totes les columnes.',
          'Scroll independent a cada cos.'
        ]}
        noFacis={[
          'Pintar la barra amb --sdp-fons-invers: en fosc s’invertix i el text desapareix.',
          'Estils en línia a les subbarres (les amplades van a propietats CSS des d’una ref).',
          'Embolcallar el gestor amb una UniversalPage.'
        ]}>
        <table>
          <caption>Plegat en escriptori (especificació del Mestre, 260911)</caption>
          <thead><tr><th scope="col">Columna</th><th scope="col">Desplegada</th><th scope="col">Plegada (carril)</th></tr></thead>
          <tbody>
            <tr><td>Navegació</td><td>Barra: títol + replegar. Subbarra: «Tot» + roda dentada. Cos: acordions cap avall.</td><td>Fila barra: botó desplegar. Fila subbarra: roda dentada. Alineats.</td></tr>
            <tr><td>Llistat</td><td>Barra: títol + replegar. Subbarra: lupa + «Crear».</td><td>Només la lupa (fila subbarra): desplega i posa el focus a la cerca. «Crear» desapareix.</td></tr>
            <tr><td>Detall</td><td>Sempre visible; ocupa l’espai restant (320px com a mínim).</td><td>No es plega.</td></tr>
          </tbody>
        </table>
        <table>
          <caption>Mides (amplada del contenidor, no de la finestra)</caption>
          <thead><tr><th scope="col">Nom</th><th scope="col">Amplada del contenidor</th><th scope="col">Comportament</th></tr></thead>
          <tbody>
            <tr><td>ample</td><td>Des del màxim entre 900px i la suma navegació + llistat + 320px + 2px (una columna plegada hi compta 56px). Amb les amplades per defecte, 900px.</td><td>Tres columnes; dos separadors; carrils de plegat.</td></tr>
            <tr><td>mitja</td><td>De 720px fins a l’ample.</td><td>Llistat + Detall, amb un sol separador; la navegació és un panell superposat que s’obri des de la icona de la capçalera del llistat.</td></tr>
            <tr><td>estret</td><td>&lt; 720px</td><td>Una sola capa cada vegada i cap separador. Amb panellEstret (mestre-detall, com a les apps de missatgeria): primer la navegació, després el llistat i, en triar un element, el detall; la fletxa ← del detall torna al panell d’on es venia. Mai dos panells oberts.</td></tr>
          </tbody>
        </table>
        <table>
          <caption>Amplades de columna (px)</caption>
          <thead><tr><th scope="col">Columna</th><th scope="col">Mínim</th><th scope="col">Per defecte</th><th scope="col">Màxim</th></tr></thead>
          <tbody>
            <tr><td>Navegació</td><td>200</td><td>260</td><td>420</td></tr>
            <tr><td>Llistat</td><td>240</td><td>280</td><td>520</td></tr>
          </tbody>
        </table>
        <p>La roda dentada aplica tres presets (Compacta, Per defecte, Ampla) i l’amplada es desa al dispositiu.</p>
        <table>
          <caption>Colors i profunditat (capçaleres de columna)</caption>
          <thead><tr><th scope="col">Element</th><th scope="col">Estil visual i propòsit</th></tr></thead>
          <tbody>
            <tr><td><strong>Fila 1</strong><br />(CARPETES, COMPONENTS)</td><td>--sdp-workspace-fila1-fons, igual a totes les columnes i a totes les mides: <strong>no passa a negre</strong>.</td></tr>
            <tr><td><strong>Fila 2</strong><br />(Tot, lupa, Crear, roda dentada)</td><td>--sdp-workspace-fila2-fons, un gris més clar. És estàtica: viu fora del cos que fa scroll i separa els controls de la llista.</td></tr>
            <tr><td><strong>Cos de la navegació</strong></td><td>--sdp-workspace-nav-fons, diferent de les dues files.</td></tr>
          </tbody>
        </table>
      </Especimen>
    </>
  );
}
