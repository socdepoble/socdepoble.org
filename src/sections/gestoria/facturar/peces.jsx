/**
 * peces.jsx — les peces que comparteixen els passos de la Facturació.
 *
 * Ordre del Mestre, 261007 («tindre la facturació operativa inclús sense
 * xarxa»). Cap peça nova de disseny: el pas numerat és la targeta clara del
 * full trimestral (les classes sdp-gestoria-panell de PanellGestoria.jsx, amb
 * la seua regla a modules.css), l'estat el diu una insígnia amb text i
 * l'avís és l'Alerta de Pedra Seca, a la zona on ha passat la cosa.
 */
import { useId } from 'react';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import cssDiferitGestoria from '../../../css/diferit-gestoria.css?inline';
import { tg } from '../i18nGestoria.js';
const adoptaEstilsDiferits = (el) => { adoptaFullDiferit(el, 'gestoria', cssDiferitGestoria); };

const INSIGNIES = Object.freeze({
  fet: Object.freeze({ to: 'exit', text: 'Fet' }),
  actiu: Object.freeze({ to: 'info', text: 'Ara' }),
  bloquejat: Object.freeze({ to: 'neutre', text: 'Encara no' })
});

/**
 * Un pas numerat: una targeta amb el títol (h3), la insígnia del seu estat i el cos.
 * `insignia` ({ to, text }) substituïx la de l'estat quan el pas en diu una altra cosa.
 */
export function Pas({ numero, titol, estat, insignia = null, idioma = 'ca', children }) {
  const idTitol = useId();
  const marca = insignia ?? INSIGNIES[estat] ?? INSIGNIES.bloquejat;
  return (
    <li ref={adoptaEstilsDiferits} className="sdp-gestoria-panell__pas" data-estat={estat}>
      <section aria-labelledby={idTitol}>
        <div className="sdp-gestoria-panell__cap">
          <h3 id={idTitol} className="sdp-gestoria-panell__titol">{`${numero}. ${titol}`}</h3>
          <Insignia to={marca.to}>{tg(idioma, marca.text)}</Insignia>
        </div>
        <div className="sdp-gestoria-panell__cos">{children}</div>
      </section>
    </li>
  );
}

/** L'avís de l'última acció, només a la seua zona (perfil, llegat, factura, llibre o còpia). */
export function AvisDeZona({ avis, zona, onTanca }) {
  if (!avis || avis.zona !== zona) return null;
  return (
    <Alerta to={avis.to} titol={avis.titol} onTanca={onTanca}>
      <p ref={adoptaEstilsDiferits}>{avis.text}</p>
      {avis.detalls.length ? (
        <ul ref={adoptaEstilsDiferits} className="sdp-gestoria-panell__avisos">
          {avis.detalls.map((detall, i) => <li ref={adoptaEstilsDiferits} key={`${i}-${detall}`}>{detall}</li>)}
        </ul>
      ) : null}
    </Alerta>
  );
}

/** Una llista d'errors de formulari, en una alerta. */
export function ErrorsDelFormulari({ titol, errors }) {
  if (!errors.length) return null;
  return (
    <Alerta to="error" titol={titol}>
      <ul ref={adoptaEstilsDiferits} className="sdp-gestoria-panell__avisos">
        {errors.map((error, i) => <li ref={adoptaEstilsDiferits} key={`${i}-${error}`}>{error}</li>)}
      </ul>
    </Alerta>
  );
}

/**
 * El text d'un fitxer triat al selector (File.text, i FileReader on no n'hi ha).
 * @param {File} fitxer
 * @returns {Promise<string>}
 */
export function llegixText(fitxer) {
  if (typeof fitxer?.text === 'function') return fitxer.text();
  return new Promise((resol, rebutja) => {
    const lector = new FileReader();
    lector.onload = () => resol(String(lector.result ?? ''));
    lector.onerror = () => rebutja(lector.error ?? new Error('No s’ha pogut llegir el fitxer.'));
    lector.readAsText(fitxer);
  });
}
