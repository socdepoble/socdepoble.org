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
 *
 * P1-22 (assalt 261101, T5b) · L'estat i el títol passen pel traductor
 * opcional (useTraductorOpcional): fora de l'app, el valencià de sempre. El
 * nom i el detall de cada fila arriben ja traduïts de qui els fa.
 */
import { Check, Clock, X } from 'lucide-react';
import { Alerta } from '../../components/PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';

// La classe va sencera, no interpolada: les portes (Vocabulari i Pedra Seca)
// han de poder llegir-la tal com és al CSS.
const ESTATS = Object.freeze({
  fet: { parell: Object.freeze(['section.connectar.resum.estat.fet', 'Fet']), Icona: Check, classe: 'sdp-connexio-resum__fila--fet' },
  error: { parell: Object.freeze(['section.connectar.resum.estat.error', 'No enviat']), Icona: X, classe: 'sdp-connexio-resum__fila--error' },
  pendent: { parell: Object.freeze(['section.connectar.resum.estat.pendent', 'Pendent']), Icona: Clock, classe: 'sdp-connexio-resum__fila--pendent' }
});

/* P1-22 · Els tres títols, en parells. */
const TITOLS = Object.freeze({
  parcial: Object.freeze(['section.connectar.resum.titol.parcial', 'Connectat, però no tot s’ha enviat']),
  pendent: Object.freeze(['section.connectar.resum.titol.pendent', 'Connectat: et falta un pas']),
  fet: Object.freeze(['section.connectar.resum.titol.fet', 'Connectat'])
});

/** Només les claus pròpies d'ESTATS: «toString» o «constructor» no són estats. */
function estatDeFila(estat) {
  return Object.hasOwn(ESTATS, estat) ? ESTATS[estat] : ESTATS.pendent;
}

/** El to i el títol de l'Alerta segons el pitjor resultat. P1-22 · `t` opcional. */
export function veredicteDelResum(resultats = [], t = null) {
  if (resultats.some((r) => r.estat === 'error')) return { to: 'avis', titol: tradueix(t, TITOLS.parcial) };
  if (resultats.some((r) => r.estat === 'pendent')) return { to: 'info', titol: tradueix(t, TITOLS.pendent) };
  return { to: 'exit', titol: tradueix(t, TITOLS.fet) };
}

export function ResumConnexio({ resultats = [], titol, accions = null, className }) {
  const t = useTraductorOpcional();
  const veredicte = veredicteDelResum(resultats, t);
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
                <span className="sdp-connexio-resum__estat">{tradueix(t, estat.parell)}</span>
                {fila.detall ? <span className="sdp-connexio-resum__detall">{fila.detall}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </Alerta>
  );
}
