/**
 * CosPersonesConfianca.jsx — El cos del bloc «Persones de confiança» de
 * Privacitat i dades (IDEA-48, estat previ a F7 i UI de cerimònia SAS O3-GEMINI-2;
 * pla 261101_1246, T7 · S6; disseny E2EE §5.6).
 *
 * Presentacional: rep el recompte de contactes verificats en este aparell
 * (null mentre es llig), si la lectura ha fallat, si la recuperació ja està
 * activa (teRecuperacio) i, opcionalment, les 3 ranures de cerimònia SAS
 * (`ranures`: estats `pendent`, `verificat_sas`, `disputa`). Sense `ranures`,
 * mostra el recompte pur previ a F7 sense cap botó. Amb `ranures`, visualitza
 * les 3 ranures d'amics de confiança amb insígnia textual accessible, estat
 * de disputa i botons d'acció de mida gran (>= 58px, `--sdp-alt-accio`).
 * `textosMostra`, exclusiu del laboratori, substituïx els missatges de compte
 * i recuperació per estat de mostra; el comportament real per defecte es conserva.
 */
import { ShieldAlert, ShieldCheck, UserCheck, UserRound } from 'lucide-react';
import { Alerta, Boto, Insignia } from '../../components/PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { omple } from '../../config/moderacio.js';
import { ESTAT_CONFIANCA, LLINDAR_CONFIANCA, TEXTOS_CONFIANCA, estatPersonesConfianca } from './personesConfianca.js';

export const ESTATS_CERIMONIA_SAS = Object.freeze({
  pendent: 'pendent',
  verificatSas: 'verificat_sas',
  disputa: 'disputa'
});

const ESTATS_VALIDS_SAS = new Set(Object.values(ESTATS_CERIMONIA_SAS));

export const TEXTOS_CERIMONIA_SAS = Object.freeze({
  llista: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.llista', 'Ranures de cerimònia SAS']),
  ranura: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.ranura', 'Ranura {n} · {nom}']),
  ranuraSenseNom: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.ranuraSenseNom', 'Ranura {n} d’amic de confiança']),
  estat: Object.freeze({
    pendent: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.estat.pendent', 'Pendent de verificar SAS']),
    verificat_sas: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.estat.verificat_sas', 'SAS verificat']),
    disputa: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.estat.disputa', 'En disputa («No sóc jo»)'])
  }),
  detall: Object.freeze({
    pendent: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.detall.pendent', 'Compara el codi SAS per veu o en persona abans de confirmar l’ajuda.']),
    verificat_sas: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.detall.verificat_sas', 'Codi SAS comprovat i aportació confirmada per a esta ranura.']),
    disputa: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.detall.disputa', 'Cerimònia aturada per alerta de disputa en esta ranura.'])
  }),
  accio: Object.freeze({
    verifica: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.accio.verifica', 'Verificar codi SAS de {nom}']),
    revisa: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.accio.revisa', 'Revisar verificació SAS de {nom}']),
    disputa: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.accio.disputa', 'Aturar i declarar «No sóc jo»'])
  }),
  alertaDisputa: Object.freeze(['section.perfil.privacitat.confianca.cerimonia.alertaDisputa', 'S’ha declarat una disputa («No sóc jo»): la cerimònia de recuperació ha quedat bloquejada.'])
});

const TO_INSIGNIA_SAS = Object.freeze({
  pendent: 'avis',
  verificat_sas: 'exit',
  disputa: 'error'
});

function normalitzaEstatSas(valor) {
  return typeof valor === 'string' && ESTATS_VALIDS_SAS.has(valor) ? valor : ESTATS_CERIMONIA_SAS.pendent;
}

export function normalitzaRanuresCerimonia(ranures) {
  if (!Array.isArray(ranures)) return null;
  return Array.from({ length: LLINDAR_CONFIANCA }, (_, idx) => {
    const entrada = ranures[idx];
    const esText = typeof entrada === 'string';
    const estat = normalitzaEstatSas(esText ? entrada : entrada?.estat);
    const nom = !esText && typeof entrada?.nom === 'string' ? entrada.nom.trim() : '';
    const sas = !esText && typeof entrada?.sas === 'string' && entrada.sas.trim() ? entrada.sas.trim() : null;
    const id = !esText && typeof entrada?.id === 'string' && entrada.id.trim() ? entrada.id.trim() : `ranura-${idx + 1}`;
    const ocupat = !esText && entrada?.ocupat === true;
    const desactivat = !esText && entrada?.desactivat === true;
    const onAccio = !esText && typeof entrada?.onAccio === 'function' ? entrada.onAccio : null;
    return Object.freeze({ id, numero: idx + 1, nom, estat, sas, ocupat, desactivat, onAccio });
  });
}

export default function CosPersonesConfianca({
  verificats = null,
  error = false,
  teRecuperacio = false,
  ranures = null,
  onAccioRanura = null,
  onDisputa = null,
  textosMostra = null
}) {
  const t = useTraductorOpcional();
  const tr = (parell, valors = {}) => omple(tradueix(t, parell), valors);
  const ranuresNormalitzades = normalitzaRanuresCerimonia(ranures);
  const verificatsDeRanures = ranuresNormalitzades
    ? ranuresNormalitzades.filter((r) => r.estat === ESTATS_CERIMONIA_SAS.verificatSas).length
    : null;
  const efectius = Number.isSafeInteger(verificats) && verificats >= 0 ? verificats : verificatsDeRanures;
  const conegut = !error && Number.isSafeInteger(efectius) && efectius >= 0;
  const estat = conegut ? estatPersonesConfianca({ verificats: efectius, teRecuperacio }) : null;
  const enDisputa = ranuresNormalitzades
    ? ranuresNormalitzades.some((r) => r.estat === ESTATS_CERIMONIA_SAS.disputa)
    : false;

  let recompte = null;
  if (estat && !textosMostra) {
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

  if (estat && textosMostra) recompte = tr(textosMostra.recompte, { n: String(estat.verificats) });

  const coberts = estat ? Math.min(estat.verificats, LLINDAR_CONFIANCA) : 0;

  return (
    <div
      className="perfil-compte__confianca-targeta"
      data-estat={enDisputa ? ESTATS_CERIMONIA_SAS.disputa : (estat?.estat ?? (error ? 'error' : 'carregant'))}
    >
      {estat ? (
        <div className="perfil-compte__confianca-ranures" aria-hidden="true">
          {Array.from({ length: LLINDAR_CONFIANCA }, (_, idx) => {
            const ranuraSas = ranuresNormalitzades ? ranuresNormalitzades[idx] : null;
            const completada = ranuraSas
              ? ranuraSas.estat === ESTATS_CERIMONIA_SAS.verificatSas
              : idx < coberts;
            const disputa = ranuraSas?.estat === ESTATS_CERIMONIA_SAS.disputa;
            return (
              <span
                key={idx}
                data-estat-sas={ranuraSas?.estat}
                className={completada
                  ? 'perfil-compte__confianca-ranura perfil-compte__confianca-ranura--verificada'
                  : 'perfil-compte__confianca-ranura'}
              >
                {disputa ? (
                  <ShieldAlert size={18} aria-hidden="true" focusable="false" />
                ) : completada ? (
                  <UserCheck size={18} aria-hidden="true" focusable="false" />
                ) : (
                  <UserRound size={18} aria-hidden="true" focusable="false" />
                )}
              </span>
            );
          })}
          {!enDisputa && (estat.estat === ESTAT_CONFIANCA.aPunt || estat.estat === ESTAT_CONFIANCA.actiu) ? (
            <span className="perfil-compte__confianca-escut">
              <ShieldCheck size={18} aria-hidden="true" focusable="false" />
            </span>
          ) : null}
        </div>
      ) : null}
      {!textosMostra ? <p className="perfil-compte__text">{tr(TEXTOS_CONFIANCA.explica)}</p> : null}
      {teRecuperacio === true || textosMostra ? null : <p className="perfil-compte__text">{tr(TEXTOS_CONFIANCA.pendent)}</p>}
      {error ? <Alerta to="error">{tr(TEXTOS_CONFIANCA.error)}</Alerta> : null}
      {enDisputa ? <Alerta to="error">{tr(textosMostra?.alertaDisputa ?? TEXTOS_CERIMONIA_SAS.alertaDisputa)}</Alerta> : null}
      {recompte ? <p className="perfil-compte__text">{recompte}</p> : null}
      {ranuresNormalitzades ? (
        <ul className="perfil-compte__llista" aria-label={tr(textosMostra?.llista ?? TEXTOS_CERIMONIA_SAS.llista)}>
          {ranuresNormalitzades.map((ranura, idx) => {
            const etiquetaAmic = ranura.nom || String(ranura.numero);
            const titolRanura = ranura.nom
              ? tr(TEXTOS_CERIMONIA_SAS.ranura, { n: String(ranura.numero), nom: ranura.nom })
              : tr(TEXTOS_CERIMONIA_SAS.ranuraSenseNom, { n: String(ranura.numero) });
            const textEstat = tr(TEXTOS_CERIMONIA_SAS.estat[ranura.estat]);
            const textDetall = tr(textosMostra?.detall?.[ranura.estat] ?? TEXTOS_CERIMONIA_SAS.detall[ranura.estat]);
            const accioCallback = ranura.onAccio
              ?? (typeof onAccioRanura === 'function' ? () => onAccioRanura(idx, ranura) : null);
            const etiquetaBoto = ranura.estat === ESTATS_CERIMONIA_SAS.verificatSas
              ? tr(TEXTOS_CERIMONIA_SAS.accio.revisa, { nom: etiquetaAmic })
              : tr(TEXTOS_CERIMONIA_SAS.accio.verifica, { nom: etiquetaAmic });
            return (
              <li key={ranura.id} data-ranura={ranura.numero} data-estat-sas={ranura.estat}>
                <p className="perfil-compte__text">
                  <strong>{titolRanura}</strong>{' '}
                  <Insignia to={TO_INSIGNIA_SAS[ranura.estat]}>{textEstat}</Insignia>
                  {ranura.sas ? <span>{` · ${ranura.sas}`}</span> : null}
                </p>
                <p className="perfil-compte__text">{textDetall}</p>
                {accioCallback ? (
                  <div className="sdp-alerta__accions perfil-compte__accions">
                    <Boto
                      mida="gran"
                      varietat={ranura.estat === ESTATS_CERIMONIA_SAS.pendent ? 'primari' : 'secundari'}
                      carregant={ranura.ocupat}
                      disabled={ranura.desactivat || enDisputa || ranura.estat === ESTATS_CERIMONIA_SAS.disputa}
                      onClick={() => accioCallback(ranura)}
                    >
                      {etiquetaBoto}
                    </Boto>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {typeof onDisputa === 'function' ? (
        <div className="sdp-alerta__accions perfil-compte__accions">
          <Boto mida="gran" varietat="perill" disabled={enDisputa} onClick={onDisputa}>
            {tr(textosMostra?.accioDisputa ?? TEXTOS_CERIMONIA_SAS.accio.disputa)}
          </Boto>
        </div>
      ) : null}
      {!textosMostra ? <p className="perfil-compte__text">{tr(TEXTOS_CONFIANCA.risc)}</p> : null}
    </div>
  );
}
