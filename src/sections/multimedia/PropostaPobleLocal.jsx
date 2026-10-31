/**
 * PropostaPobleLocal.jsx — La proposta de poble, comarca, categoria i origen
 * d'una imatge local (IDEA-54 · Onada 261029_1605), feta pel motor
 * (`suggerixPobleLocal`). És sempre una PROPOSTA que la persona ha de
 * confirmar: es diu «proposat», amb la confiança i el motiu, i mai «és X».
 * Cada motiu, avís, àmbit i origen del motor té el seu text (la prova els
 * recorre tots): els mapes viuen a suportGestorLocal.js (Gauntlet 261029,
 * cicle 1: este fitxer només exporta components, per Fast Refresh).
 */
import { useId } from 'react';
import { Alerta, Insignia } from '../../components/PedraSeca/index.js';
import {
  TEXTOS_AMBIT_LOCAL, TEXTOS_AVIS_POBLE, TEXTOS_CONFIANCA_POBLE, TEXTOS_MOTIU_ORIGEN_LOCAL, TEXTOS_MOTIU_POBLE, TEXTOS_ORIGEN_LOCAL
} from './suportGestorLocal.js';
import { TEXTOS_LOCAL as T, tradueix } from './textosGestorLocal.js';

const TO_CONFIANCA = Object.freeze({ alta: 'exit', mitjana: 'info', baixa: 'avis' });

export function PropostaPobleLocal({ t, proposta }) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const id = useId();
  const p = proposta || {};
  const comarca = p.comarca || p.poble?.comarca || null;
  const files = [];
  if (p.poble?.nom) {
    files.push(
      <li key="poble">
        <strong>{tr(T['proposta.poble'], { poble: p.poble.nom })}</strong>
        {p.confianca && TEXTOS_CONFIANCA_POBLE[p.confianca]
          ? <> <Insignia to={TO_CONFIANCA[p.confianca]}>{tr(TEXTOS_CONFIANCA_POBLE[p.confianca])}</Insignia></>
          : null}
      </li>
    );
  }
  if (comarca) files.push(<li key="comarca">{tr(T['proposta.comarca'], { comarca })}</li>);
  if (p.motiu && TEXTOS_MOTIU_POBLE[p.motiu]) {
    files.push(<li key="motiu">{tr(TEXTOS_MOTIU_POBLE[p.motiu], { km: p.km ?? '?' })}</li>);
  }
  if (p.categoria && TEXTOS_AMBIT_LOCAL[p.categoria]) {
    files.push(<li key="categoria">{tr(T['proposta.categoria'], { categoria: tr(TEXTOS_AMBIT_LOCAL[p.categoria]) })}</li>);
  }
  if (p.origen && TEXTOS_ORIGEN_LOCAL[p.origen]) {
    files.push(
      <li key="origen">
        {tr(T['proposta.origen'], {
          origen: tr(TEXTOS_ORIGEN_LOCAL[p.origen]),
          motiu: TEXTOS_MOTIU_ORIGEN_LOCAL[p.motiuOrigen] ? tr(TEXTOS_MOTIU_ORIGEN_LOCAL[p.motiuOrigen]) : '—'
        })}
      </li>
    );
  }
  const avisos = (Array.isArray(p.avisos) ? p.avisos : []).filter((a) => TEXTOS_AVIS_POBLE[a]);

  return (
    <section className="sdp-arxiu-local__proposta" aria-labelledby={`${id}-titol`}>
      <h4 id={`${id}-titol`}>{tr(T['proposta.titol'])}</h4>
      {files.length > 0 ? <ul className="sdp-arxiu-local__llista">{files}</ul> : <p>{tr(T['proposta.cap'])}</p>}
      {avisos.length > 0 ? (
        <Alerta to="avis" viva={false}>
          <ul className="sdp-arxiu-local__llista">
            {avisos.map((a) => <li key={a}>{tr(TEXTOS_AVIS_POBLE[a])}</li>)}
          </ul>
        </Alerta>
      ) : null}
      <p className="sdp-arxiu-local__ajuda">{tr(T['proposta.ajuda'])}</p>
    </section>
  );
}
