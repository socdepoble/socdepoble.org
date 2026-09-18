import { Especimen } from '../Especimen.jsx';
import { Alerta } from '../../../../components/PedraSeca/index.js';

export default function EspecimenDivisor() {
  return (
    <Especimen id="divisor" nom="Divisor (splitter)" fitxer="src/components/layout/ (Codex)"
        descripcio="Vora arrossegable entre dues columnes. Llei: accessible per teclat o no existix."
        a11y={['role="separator" + aria-orientation="vertical" + aria-valuenow/min/max + aria-controls.', '←/→ canvien l’amplada; Maj multiplica el pas; Inici/Fi van al mínim/màxim; doble clic o Intro restablixen.', 'En punter groller (tàctil) la zona creix; en «mitja» i «estret» no es pinta.']}
        fes={['Amplada escrita com a propietat CSS des d’una ref, no com a style en JSX.']}
        noFacis={['Persistir amplades en localStorage sense afegir la clau a l’inventari legal.']}>
      <p>Espècimen viu: la vora dreta de la barra lateral i les vores entre columnes del gestor de Notes.</p>
    </Especimen>
  );
}
