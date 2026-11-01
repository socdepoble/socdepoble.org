/**
 * CosPersonesConfianca.jsx — El cos del bloc «Persones de confiança» de
 * Privacitat i dades (IDEA-48, estat previ a F7; pla 261101_1246, T7 · S6).
 *
 * Presentacional: rep el recompte de contactes verificats en este aparell
 * (null mentre es llig), si la lectura ha fallat i si la recuperació ja està
 * activa (teRecuperacio), i diu què és el cercle, que encara no està actiu
 * (mentre teRecuperacio siga fals, en tots els estats), quants en té la persona,
 * quants li'n falten fins a tres i el risc de triar-les. Cap acció: el cercle
 * encara no es pot crear (F7). El títol el posa qui el munta
 * (BlocPersonesConfianca, amb el Bloc del Perfil; l'espècimen, amb el seu h4).
 * Sense cap classe nova: la de text del Perfil.
 */
import { Alerta } from '../../components/PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { omple } from '../../config/moderacio.js';
import { ESTAT_CONFIANCA, TEXTOS_CONFIANCA, estatPersonesConfianca } from './personesConfianca.js';

export default function CosPersonesConfianca({ verificats = null, error = false, teRecuperacio = false }) {
  const t = useTraductorOpcional();
  const tr = (parell, valors = {}) => omple(tradueix(t, parell), valors);
  const conegut = !error && Number.isSafeInteger(verificats) && verificats >= 0;
  const estat = conegut ? estatPersonesConfianca({ verificats, teRecuperacio }) : null;

  let recompte = null;
  if (estat) {
    const quants = estat.verificats === 0
      ? tr(TEXTOS_CONFIANCA.verificatsCap)
      : estat.verificats === 1
        ? tr(TEXTOS_CONFIANCA.verificatsUn)
        : tr(TEXTOS_CONFIANCA.verificatsDiversos, { n: String(estat.verificats) });
    let segueix = null;
    if (estat.estat === ESTAT_CONFIANCA.aPunt) segueix = tr(TEXTOS_CONFIANCA.aPunt);
    else if (estat.estat !== ESTAT_CONFIANCA.actiu) {
      segueix = estat.falten === 1 ? tr(TEXTOS_CONFIANCA.faltaUn) : tr(TEXTOS_CONFIANCA.faltaDiversos, { n: String(estat.falten) });
    }
    recompte = segueix ? `${quants} ${segueix}` : quants;
  }

  return (
    <>
      <p className="perfil-compte__text">{tr(TEXTOS_CONFIANCA.explica)}</p>
      {teRecuperacio === true ? null : <p className="perfil-compte__text">{tr(TEXTOS_CONFIANCA.pendent)}</p>}
      {error ? <Alerta to="error">{tr(TEXTOS_CONFIANCA.error)}</Alerta> : null}
      {recompte ? <p className="perfil-compte__text">{recompte}</p> : null}
      <p className="perfil-compte__text">{tr(TEXTOS_CONFIANCA.risc)}</p>
    </>
  );
}
