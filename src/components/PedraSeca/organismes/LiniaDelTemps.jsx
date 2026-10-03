/**
 * LiniaDelTemps.jsx — llista vertical d'apunts amb l'hora, en ordre.
 *
 * apunts: [{ id, hora: 'HH:MM', moment?, titol, detall?, icona?, ruta? }]
 *   hora    el text de la columna de l'esquerra (normalment 'HH:MM')
 *   moment  valor de <time datetime> (ISO); per defecte, l'hora si és HH:MM
 *   icona   un component de lucide per a la marca de l'eix (decoració)
 *   ruta    l'apunt és un enllaç del router propi (la tria viu a la URL)
 * Sense `ruta`, amb `onTria(id)`, cada apunt és un botó. Sense cap dels dos,
 * és text quiet. `seleccionat` (id) marca l'apunt obert amb aria-current.
 * La llista no ordena: rep els apunts en l'ordre que s'han de llegir.
 *
 * Accessibilitat: <ol> amb nom; cada acció porta l'hora dins del seu nom
 * («07:30: Cafè»), perquè la llista d'enllaços del lector de pantalla no
 * repetisca títols sense hora. Sense apunts, l'EstatBuit de Pedra Seca.
 */
import { Link } from '../../../app/contexts/RouterContext';
import { EstatBuit } from '../atoms/estats.jsx';

const HORA = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

function Cos({ apunt }) {
  return (
    <>
      {/* Els espais separen les parts al nom accessible; dins de la graella no es pinten. */}
      <span className="sdp-nomes-lector">{`${apunt.hora}:`}</span>{' '}
      <span className="sdp-linia-temps__titol">{apunt.titol}</span>
      {apunt.detall ? <>{' '}<span className="sdp-linia-temps__detall">{apunt.detall}</span></> : null}
    </>
  );
}

export function LiniaDelTemps({
  apunts = [], etiqueta, seleccionat = null, onTria, buit = 'Encara no hi ha cap apunt.', className
}) {
  if (!apunts.length) return <EstatBuit titol={buit} className={className} />;
  return (
    <ol className={['sdp-linia-temps', className].filter(Boolean).join(' ')} aria-label={etiqueta}>
      {apunts.map((apunt) => {
        const Icona = apunt.icona || null;
        const actual = seleccionat !== null && apunt.id === seleccionat ? 'true' : undefined;
        let accio;
        if (apunt.ruta) {
          accio = <Link to={apunt.ruta} className="sdp-linia-temps__accio" aria-current={actual}><Cos apunt={apunt} /></Link>;
        } else if (onTria) {
          accio = (
            <button type="button" className="sdp-linia-temps__accio" aria-current={actual} onClick={() => onTria(apunt.id)}>
              <Cos apunt={apunt} />
            </button>
          );
        } else {
          accio = <div className="sdp-linia-temps__accio"><Cos apunt={apunt} /></div>;
        }
        const moment = apunt.moment || (HORA.test(apunt.hora ?? '') ? apunt.hora : undefined);
        return (
          <li key={apunt.id} className="sdp-linia-temps__apunt">
            <time className="sdp-linia-temps__hora" dateTime={moment} aria-hidden="true">{apunt.hora}</time>
            <span className="sdp-linia-temps__eix" aria-hidden="true">
              <span className="sdp-linia-temps__marca">{Icona ? <Icona size={16} focusable="false" /> : null}</span>
            </span>
            {accio}
          </li>
        );
      })}
    </ol>
  );
}
