import { Especimen } from '../Especimen.jsx';
import { Alerta } from '../../../../components/PedraSeca/index.js';

export default function EspecimenGestor() {
  return (
    <Especimen id="gestor" nom="Gestor de tres columnes (AppGridShell)" fitxer="src/components/layout/"
        descripcio="Carpetes · Llista · Detall. La lògica i anatomia exacta està documentada al fitxer .agents/skills/app-grid-shell/SKILL.md."
        fes={['Barra de totes les columnes en --sdp-crom-fons - una sola franja contínua.', 'Subbarra amb el mateix gris a totes les columnes i la mateixa alçada.', 'Scroll independent a cada cos.']}
        noFacis={['Pintar la barra amb --sdp-fons-invers - en fosc s’invertix i el text desapareix.', 'Estils en línia a les subbarres.']}>
      <table>
          <caption>Plegat en escriptori (especificació del Mestre, 260911)</caption>
          <thead><tr><th scope="col">Columna</th><th scope="col">Desplegada</th><th scope="col">Plegada (carril)</th></tr></thead>
          <tbody>
            <tr><td>Carpetes</td><td>Barra: títol + replegar. Subbarra: «Tot» (gran) + roda dentada. Cos: acordions cap avall.</td><td>Fila barra: botó desplegar. Fila subbarra: roda dentada. Alineats.</td></tr>
            <tr><td>Notes</td><td>Barra: títol + replegar. Subbarra: cerca + «Crear nota».</td><td>Només la lupa (fila subbarra): desplega i posa el focus a la cerca. «Crear nota» desapareix.</td></tr>
            <tr><td>Detall</td><td>Sempre visible; ocupa l’espai restant.</td><td>No es plega.</td></tr>
          </tbody>
        </table>
        <table>
          <caption>Mides</caption>
          <thead><tr><th scope="col">Nom</th><th scope="col">Amplada del contenidor</th><th scope="col">Comportament</th></tr></thead>
          <tbody>
            <tr><td>ample</td><td>≥ 1090px</td><td>Tres columnes; divisors actius; carrils de plegat.</td></tr>
            <tr><td>mitja</td><td>720–1089px</td><td>Llista + Detall; Carpetes superposada des d’una pestanya. Les capçaleres (ÀREES i COMPONENTS) salten a dalt però **no canvien de color**: mantenen el mateix fons fosc que tenien, unificant la barra visualment.</td></tr>
            <tr><td>estret</td><td>&lt; 720px</td><td>Una columna; pestanyes amb els NOMS reals (mai «Esquerra/Centre»). Les capçaleres mantenen el seu color original fosc.</td></tr>
          </tbody>
        </table>
        <table>
          <caption>Colors i Profunditat (Capçaleres de Columna)</caption>
          <thead><tr><th scope="col">Element</th><th scope="col">Estil visual i propòsit</th></tr></thead>
          <tbody>
            <tr><td><strong>Capçalera Principal</strong><br/>(ex. ÀREES, COMPONENTS)</td><td>Utilitza el fons fosc original de la columna. Quan la pantalla es redueix i estes capçaleres pugen a la part superior com a pestanyes, <strong>no han de canviar a negre</strong>, sinó mantindre el color original per agrupar-les visualment a la mateixa barra.</td></tr>
            <tr><td><strong>Subbarra Secundària</strong><br/>(ex. Cercador, Crear nota, Roda dentada)</td><td>Estàtica (mai s'amaga amb l'scroll). Utilitza un gris més claret que la llista de baix. Això dóna <strong>profunditat visual</strong> al bloc de notes i separa clarament la zona de controls estàtics de la zona dinàmica on l'usuari fa scroll.</td></tr>
          </tbody>
        </table>
    </Especimen>
  );
}
