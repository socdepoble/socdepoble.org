import { Especimen } from './Especimen.jsx';
import { Alerta } from '../../../components/PedraSeca/index.js';

/**
 * Anatomia canònica (model de Dola). L'API d'UniversalShell, Divisor i del
 * gestor la va escriure Codex en un torn paral·lel: esta pàgina fixa les
 * LLEIS i l'ANATOMIA; les taules de props s'han de sincronitzar amb el seu
 * pedaç (registre.js les marca com a «extern»).
 */
export default function PaginaEstructura() {
  return (
    <>
      <h2>Estructura</h2>
      <Alerta to="avis" titol="Pendent de sincronitzar">
        UniversalShell, Divisor i el gestor de tres columnes els va implementar Codex. Esta pàgina fixa l’anatomia i les lleis; les taules de props s’han d’afegir des del seu codi.
      </Alerta>

      <Especimen id="shell" nom="UniversalShell · la bastida" fitxer="src/components/layout/ (Codex)"
        descripcio="Tres peces i prou: Barra lateral · Barra superior fixada · Finestra de contingut. Tota ruta de l’app viu dins de la Finestra."
        a11y={['<nav> per a la barra lateral, <header> per a la superior, <main tabindex=-1> per a la finestra; el focus hi torna en canviar de ruta.', 'Calaix mòbil: Escape, vel clicable i tancament en navegar.']}
        fes={['Estat de la barra lateral en React, no en classList.', 'La barra superior és crom: mateix color en clar i fosc.']}
        noFacis={['Una segona barra superior per secció (això és el crom de UniversalPage).', 'Mutar el DOM des d’un onClick per plegar la barra.']}>
        <div className="sdp-anatomia" aria-hidden="true">
          <div className="sdp-anatomia__lat">Barra lateral<br />(Divisor a la vora)</div>
          <div className="sdp-anatomia__sup">Barra superior fixada</div>
          <div className="sdp-anatomia__fin">Finestra de contingut<br />(UniversalPage o gestor)</div>
        </div>
      </Especimen>

      <Especimen id="page" nom="UniversalPage · el crom de pàgina" fitxer="src/components/universal/UniversalPage.jsx"
        descripcio="NO és la bastida. És el que viu dins de la Finestra: barra blava (navegació de pàgina), imatge, barra taronja (autoria i data), capçalera amb h1 i article."
        contracte={[
          ['chrome', "'full'|'context'|'system'|'page'|'none'", "'page'", 'Quines barres es pinten.'],
          ['title / subtitle / lead', 'node', '—', 'h1 únic de la pàgina; h2 i entradeta.'],
          ['labels', '(string|{ text, className, href, onClick })[]', '[]', 'Insígnies de taxonomia.'],
          ['heroImage / heroAlt', 'string', '—', 'Imatge de capçalera; heroAlt obligatori si informa.'],
        ]}
        fes={['Un sol h1 per pàgina.']} noFacis={['Rebatejar-la a «UniversalShell»: té desenes de consumidors.']}>
        <p>Aquesta mateixa pàgina de Disseny és un espècimen viu de UniversalPage amb chrome=&quot;full&quot;.</p>
      </Especimen>

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
            <tr><td>mitja</td><td>720–1089px</td><td>Llista + Detall; Carpetes superposada des d’una pestanya.</td></tr>
            <tr><td>estret</td><td>&lt; 720px</td><td>Una columna; pestanyes amb els NOMS reals (mai «Esquerra/Centre»).</td></tr>
          </tbody>
        </table>
      </Especimen>

      <Especimen id="divisor" nom="Divisor (splitter)" fitxer="src/components/layout/ (Codex)"
        descripcio="Vora arrossegable entre dues columnes. Llei: accessible per teclat o no existix."
        a11y={['role="separator" + aria-orientation="vertical" + aria-valuenow/min/max + aria-controls.', '←/→ canvien l’amplada; Maj multiplica el pas; Inici/Fi van al mínim/màxim; doble clic o Intro restablixen.', 'En punter groller (tàctil) la zona creix; en «mitja» i «estret» no es pinta.']}
        fes={['Amplada escrita com a propietat CSS des d’una ref, no com a style en JSX.']}
        noFacis={['Persistir amplades en localStorage sense afegir la clau a l’inventari legal.']}>
        <p>Espècimen viu: la vora dreta de la barra lateral i les vores entre columnes del gestor de Notes.</p>
      </Especimen>
    </>
  );
}
