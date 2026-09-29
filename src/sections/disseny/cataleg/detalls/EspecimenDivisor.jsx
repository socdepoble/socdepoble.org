import { useLayoutEffect, useRef, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Divisor } from '../../../../components/PedraSeca/index.js';
import AppGridResizer from '../../../../components/layout/AppGridResizer.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · Dues peces que compartien nom al registre:
   el Divisor (àtom de PedraSeca que separa blocs) i AppGridResizer (la vora
   arrossegable entre columnes d'AppGridShell). Totes dues vives, cadascuna
   amb el seu contracte, contrastat amb el codi. */

/* La columna de mostra: l'amplada va a una propietat CSS des d'una ref, com
   fa AppGridShell amb --app-grid-col-sidebar. Mai un style en JSX. */
function MostraRedimensionador() {
  const [ample, setAmple] = useState(192);
  const graella = useRef(null);
  useLayoutEffect(() => {
    graella.current?.style.setProperty('--cataleg-mostra-ample', `${ample}px`);
  }, [ample]);
  return (
    <div className="sdp-especimen__mostra">
      <div ref={graella} className="sdp-especimen__redimensiona">
        <div className="sdp-especimen__caixa">Columna de mostra: {ample}px</div>
        <AppGridResizer label="Redimensionar la columna de mostra" value={ample} min={128} max={256} onResize={setAmple} />
        <div className="sdp-especimen__caixa">Detall</div>
      </div>
    </div>
  );
}

export default function EspecimenDivisor() {
  return (
    <>
      <Llinatge id="resizer" />
      <Especimen id="divisor" nom="Divisor · separació entre blocs" fitxer="src/components/PedraSeca/atoms/Divisor.jsx"
        descripcio="Sense text és un hr natiu, decoratiu. Amb text, la línia és decoració i el text és contingut: per això és un div amb role=separator i el text dins."
        contracte={[
          ['text', 'string | null', 'null', 'Sense text: hr. Amb text: div role="separator" amb el text.'],
          ['variant', 'string', "'basic'", 'Afig la classe sdp-divisor--{variant}.'],
          ['className', 'string', '—', 'Classes extra.'],
        ]}
        fes={['Divisor per a separar seccions; l’hr a mà, només dins de contingut ric.']}
        noFacis={['Un div buit amb vora per a fer de línia.', 'Deute: la variant amb text encara no té estil propi (només la línia de dalt de .sdp-divisor).']}>
        <p>Paràgraf de dalt.</p>
        <Divisor />
        <p>Paràgraf de davall.</p>
        <Divisor text="O bé" />
        <p>Una altra opció.</p>
      </Especimen>
      <Especimen id="redimensionador" nom="AppGridResizer · la vora entre columnes" fitxer="src/components/layout/AppGridResizer.jsx"
        descripcio="La vora arrossegable entre dues columnes d’AppGridShell. Llei: es mou amb el teclat o no existix. AppGridShell en pinta dos en ample (navegació i llistat), un en mitjà (el del llistat) i cap en estret; plegar una columna amaga el seu."
        contracte={[
          ['label', 'string', '—', 'Nom accessible («Redimensionar …»).'],
          ['value / min / max', 'number (px)', '—', 'Amplada d’ara i límits: aria-valuenow, aria-valuemin i aria-valuemax.'],
          ['onResize', '(px) => void', '—', 'Rep l’amplada nova, ja limitada entre min i max. Qui el munta la guarda.'],
          ['className', 'string', "''", 'AppGridShell hi posa app-grid-resizer--left o --middle.'],
        ]}
        a11y={[
          'role="separator" amb aria-orientation="vertical", aria-label i els tres aria-value*; tabIndex 0.',
          '← i → mouen 16px; Inici i Fi van al mínim i al màxim.',
          'Amb el ratolí o el dit, la zona de clic és 10px més ampla per cada costat (::before); el focus es veu com una línia.'
        ]}
        fes={['Amplada escrita com a propietat CSS des d’una ref, no com a style en JSX.', 'Limitar sempre entre min i max abans de desar.']}
        noFacis={['Confondre’l amb el Divisor: este és un control, aquell és decoració.', 'Persistir amplades en localStorage sense afegir la clau a l’inventari legal.']}>
        <MostraRedimensionador />
      </Especimen>
    </>
  );
}
