import { useMemo, useState } from 'react';
import { Boto } from '../PedraSeca/index.js';
import { getVal, setVal } from '../../config/storage.js';
import {
  CLAU_STORAGE_EMERGENCIES,
  resolTextosEmergencies,
  textEnIdioma,
} from '../../config/batecDeVida.js';
import {
  camiSvgMatriuQrVeinal,
  codificaMatriuQrVeinal,
} from '../../utils/qrDibuix.js';

/**
 * Persisteix i verifica en lectura l'estat d'emergència abans de confirmar l'èxit.
 * Sense `storageOverride` (getItem/setItem, per a les proves) passa per la capa única
 * src/config/storage.js (getVal/setVal). Si l'escriptura falla (quota, capa bloquejada o
 * absent; `storageOverride === null`), retorna `{ ok: false, error }` perquè la UI mai
 * confirme en fals un desament fallit.
 */
export function desaEstatEmergenciaLocalVerificat(payload, storageOverride) {
  const serialitzat = JSON.stringify(payload);
  if (storageOverride === undefined) {
    if (!setVal(CLAU_STORAGE_EMERGENCIES, payload)) {
      return { ok: false, error: 'error-escriptura-storage' };
    }
    return JSON.stringify(getVal(CLAU_STORAGE_EMERGENCIES, null)) === serialitzat
      ? { ok: true }
      : { ok: false, error: 'verificacio-lectura-fallida' };
  }
  if (!storageOverride) {
    return { ok: false, error: 'storage-indisponible' };
  }
  try {
    storageOverride.setItem(CLAU_STORAGE_EMERGENCIES, serialitzat);
    const rellegit = storageOverride.getItem(CLAU_STORAGE_EMERGENCIES);
    if (rellegit !== serialitzat) {
      return { ok: false, error: 'verificacio-lectura-fallida' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || 'error-escriptura-storage' };
  }
}

/**
 * `refugis` ve de la configuració del poble (tenant), publicada per l'Ajuntament:
 * cap refugi per defecte. Cada refugi: { id, nom, ubicacio, telefon?, font?, dataFont? },
 * amb `nom`, `ubicacio` i `font` en text o per idioma. El telèfon només es mostra si el
 * refugi porta font: sense font no s'atribuïx cap telèfon a cap lloc.
 */
function lligEstatEmergenciaLocal(storageOverride) {
  try {
    if (storageOverride === undefined) {
      return getVal(CLAU_STORAGE_EMERGENCIES, null);
    }
    if (!storageOverride || typeof storageOverride.getItem !== 'function') {
      return null;
    }
    const cru = storageOverride.getItem(CLAU_STORAGE_EMERGENCIES);
    return cru ? JSON.parse(cru) : null;
  } catch {
    return null;
  }
}

export default function ProtocolEmergenciesOfflineCard({
  idioma = 'ca',
  refugis = [],
  storage,
  onEstatEncuat,
  onErrorPersistencia,
}) {
  const estatInicial = useMemo(() => lligEstatEmergenciaLocal(storage), [storage]);
  const [encuat, setEncuat] = useState(() => Boolean(estatInicial && estatInicial.estat === 'estic-be' && estatInicial.codiVeinal));
  const [errorPersistencia, setErrorPersistencia] = useState(false);
  const [mostraCodiQr, setMostraCodiQr] = useState(false);
  const [codiVerificacio, setCodiVerificacio] = useState(() => (
    estatInicial && typeof estatInicial.codiVeinal === 'string' ? estatInicial.codiVeinal : ''
  ));

  const textos = resolTextosEmergencies(idioma);
  const llistaRefugis = Array.isArray(refugis) ? refugis : [];

  const dibuixQr = useMemo(
    () => (codiVerificacio ? camiSvgMatriuQrVeinal(codificaMatriuQrVeinal(codiVerificacio)) : null),
    [codiVerificacio],
  );

  const encuaEstatEsticBe = () => {
    const ara = new Date();
    const araIso = ara.toISOString();
    const dos = (n) => String(n).padStart(2, '0');
    const codi = `SDP-OK-${ara.getFullYear()}${dos(ara.getMonth() + 1)}${dos(ara.getDate())}${dos(ara.getHours())}${dos(ara.getMinutes())}`;
    const registre = {
      estat: 'estic-be',
      timestamp: araIso,
      dadesMediquesEnClar: false,
      codiVeinal: codi,
    };

    setCodiVerificacio(codi);
    const resultat = desaEstatEmergenciaLocalVerificat(registre, storage);
    if (!resultat.ok) {
      setEncuat(false);
      setErrorPersistencia(true);
      setMostraCodiQr(true);
      if (typeof onErrorPersistencia === 'function') {
        onErrorPersistencia({ error: resultat.error, codiVeinal: codi });
      }
      return;
    }

    setErrorPersistencia(false);
    setEncuat(true);
    if (typeof onEstatEncuat === 'function') {
      onEstatEncuat(registre);
    }
  };

  return (
    <section
      className="sdp-admin-importacio__card"
      aria-label={textos.title}
      data-sdp-emergencies-offline="true"
    >
      <div className="sdp-admin-importacio__card-cap">
        <span className="sdp-badge-system">{textos.badgeOfflineReady}</span>
      </div>

      <h3>{textos.title}</h3>
      <p className="sdp-nota-suau">{textos.subtitle}</p>

      <h4>{textos.sheltersTitle}</h4>
      {llistaRefugis.length === 0 ? (
        <p className="sdp-nota-suau" data-testid="refugis-buit">{textos.sheltersEmpty}</p>
      ) : (
        <dl className="sdp-admin-dl">
          {llistaRefugis.map((r) => {
            const nom = textEnIdioma(r.nom, idioma);
            const font = [textEnIdioma(r.font, idioma), r.dataFont].filter(Boolean).join(' · ');
            const telefon = r.telefon && font ? r.telefon : null;
            return (
              <div key={r.id}>
                <dt>{telefon ? `${nom} (${telefon})` : nom}</dt>
                <dd>
                  {textEnIdioma(r.ubicacio, idioma)}
                  {font ? ` · ${textos.sheltersSource}: ${font}` : ''}
                </dd>
              </div>
            );
          })}
        </dl>
      )}

      <h4>{textos.elderGuideTitle}</h4>
      <div className="sdp-admin-pills">
        <span className="sdp-admin-pill">{textos.elderStep1}</span>
        <span className="sdp-admin-pill">{textos.elderStep2}</span>
        <span className="sdp-admin-pill">{textos.elderStep3}</span>
      </div>

      <p className="sdp-nota-suau">{textos.batterySafeNotice}</p>

      {encuat && !errorPersistencia && (
        <p className="sdp-nota-suau" role="status">
          {textos.queuedStatus} {codiVerificacio ? `(${codiVerificacio})` : ''}
        </p>
      )}

      {errorPersistencia && (
        <p className="sdp-nota-suau" role="alert">
          {textos.storageErrorStatus} ({codiVerificacio})
        </p>
      )}

      {mostraCodiQr && dibuixQr && (
        <div className="sdp-admin-importacio__card-cap" data-testid="codi-qr-veinal">
          <svg
            data-testid="codi-qr-veinal-svg"
            className="sdp-admin-qr__svg"
            role="img"
            aria-label={`QR ${codiVerificacio}`}
            viewBox={`0 0 ${dibuixQr.costat} ${dibuixQr.costat}`}
            shapeRendering="crispEdges"
          >
            <rect className="sdp-admin-qr__paper" x="0" y="0" width={dibuixQr.costat} height={dibuixQr.costat} />
            <path className="sdp-admin-qr__tinta" d={dibuixQr.d} />
          </svg>
          <span className="sdp-badge-system">{codiVerificacio}</span>
        </div>
      )}

      <div className="sdp-admin-actions-inline">
        <Boto varietat="primari" onClick={encuaEstatEsticBe}>
          {textos.btnQueueOkOffline}
        </Boto>
        <Boto varietat="secundari" disabled={!codiVerificacio} onClick={() => setMostraCodiQr((v) => !v)}>
          {textos.btnShowQr}
        </Boto>
      </div>
    </section>
  );
}
