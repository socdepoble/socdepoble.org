/**
 * ResumConnexio.jsx — Què s'ha fet de veres en connectar
 * (T43, ordre del Mestre, 260928; D1, 260930: el verb és connectar).
 *
 * Presentacional, sense contextos (es pinta al catàleg de Disseny): rep una
 * fila per destinatari i la pinta dins d'una Alerta de Pedra Seca. L'estat de
 * cada fila es llig en text («Fet», «No enviat», «Pendent»), no només pel
 * color ni per la icona, que és decorativa.
 *
 * resultats: [{ clau, nom, estat: 'fet' | 'error' | 'pendent', detall? }]
 */
import { Check, Clock, X } from 'lucide-react';
import { Alerta } from '../../components/PedraSeca/index.js';

// La classe va sencera, no interpolada: les portes (Vocabulari i Pedra Seca)
// han de poder llegir-la tal com és al CSS.
const ESTATS = Object.freeze({
  fet: { text: 'Fet', Icona: Check, classe: 'sdp-connexio-resum__fila--fet' },
  error: { text: 'No enviat', Icona: X, classe: 'sdp-connexio-resum__fila--error' },
  pendent: { text: 'Pendent', Icona: Clock, classe: 'sdp-connexio-resum__fila--pendent' }
});

/** Només les claus pròpies d'ESTATS: «toString» o «constructor» no són estats. */
function estatDeFila(estat) {
  return Object.hasOwn(ESTATS, estat) ? ESTATS[estat] : ESTATS.pendent;
}

/** El to i el títol de l'Alerta segons el pitjor resultat. */
export function veredicteDelResum(resultats = []) {
  if (resultats.some((r) => r.estat === 'error')) return { to: 'avis', titol: 'Connectat, però no tot s’ha enviat' };
  if (resultats.some((r) => r.estat === 'pendent')) return { to: 'info', titol: 'Connectat: et falta un pas' };
  return { to: 'exit', titol: 'Connectat' };
}

export function ResumConnexio({ resultats = [], titol, accions = null, className }) {
  const veredicte = veredicteDelResum(resultats);
  return (
    <Alerta to={veredicte.to} titol={titol || veredicte.titol} accions={accions}
      className={['sdp-connexio-resum', className].filter(Boolean).join(' ')}>
      <ul className="sdp-connexio-resum__llista">
        {resultats.map((fila) => {
          const estat = estatDeFila(fila.estat);
          const { Icona } = estat;
          return (
            <li key={fila.clau} className={`sdp-connexio-resum__fila ${estat.classe}`}>
              <Icona className="sdp-connexio-resum__icona" size={20} aria-hidden="true" focusable="false" />
              <span className="sdp-connexio-resum__text">
                <span className="sdp-connexio-resum__nom">{fila.nom}</span>
                <span className="sdp-connexio-resum__estat">{estat.text}</span>
                {fila.detall ? <span className="sdp-connexio-resum__detall">{fila.detall}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </Alerta>
  );
}
