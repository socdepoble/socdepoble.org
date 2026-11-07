import { useEffect, useRef, useState } from 'react';
import { Boto } from '../PedraSeca/index.js';
import { getVal, setVal } from '../../config/storage.js';
import {
  BATEC_DE_VIDA_ACTIU,
  CLAU_STORAGE_BATEC,
  HORA_DESPERTAR_DEFECTE,
  INTERVAL_DIA_HORES_DEFECTE,
  MINUTS_GRACIA_CORTESIA,
  ompleText,
  resolTextosBatec,
} from '../../config/batecDeVida.js';
import { creaMonitorBatecDeVida, esBooleaCert } from '../../services/batecDeVidaMonitor.js';

/* Sense `storage` (getItem/setItem, per a les proves), l'estat passa per la capa
   única src/config/storage.js (getVal/setVal); `storage={null}` vol dir «sense capa». */
function lligCru(storageOverride) {
  if (storageOverride === undefined) return getVal(CLAU_STORAGE_BATEC, null);
  if (!storageOverride) return null;
  const cru = storageOverride.getItem(CLAU_STORAGE_BATEC);
  return cru ? JSON.parse(cru) : null;
}

/* Un instant desat (text ISO o mil·lisegons) en ISO, o null si no és una data vàlida. */
function normalitzaInstant(valor) {
  if (typeof valor !== 'string' && typeof valor !== 'number') return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

/* L'hora de l'últim batec en l'hora local del mòbil, no en UTC. */
function formataInstantLocal(iso) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  const dos = (n) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${dos(data.getMonth() + 1)}-${dos(data.getDate())} `
    + `${dos(data.getHours())}:${dos(data.getMinutes())}:${dos(data.getSeconds())}`;
}

function lligEstatBatec(storageOverride) {
  const defecte = {
    actiu: BATEC_DE_VIDA_ACTIU,
    pausat: false,
    intervalDiaHores: INTERVAL_DIA_HORES_DEFECTE,
    horaDespertar: HORA_DESPERTAR_DEFECTE,
    ultimBatecAt: null,
    iniciFinestraAt: null,
    avisCortesiaPendent: false,
  };
  try {
    const parsed = lligCru(storageOverride);
    if (!parsed || typeof parsed !== 'object') {
      return defecte;
    }
    return {
      actiu: esBooleaCert(parsed.actiu),
      pausat: esBooleaCert(parsed.pausat),
      intervalDiaHores: Number(parsed.intervalDiaHores) || INTERVAL_DIA_HORES_DEFECTE,
      horaDespertar: typeof parsed.horaDespertar === 'string' && parsed.horaDespertar
        ? parsed.horaDespertar
        : HORA_DESPERTAR_DEFECTE,
      ultimBatecAt: normalitzaInstant(parsed.ultimBatecAt),
      iniciFinestraAt: normalitzaInstant(parsed.iniciFinestraAt),
      avisCortesiaPendent: esBooleaCert(parsed.avisCortesiaPendent),
    };
  } catch {
    return defecte;
  }
}

export function desaEstatBatecVerificat(estat, storageOverride) {
  const serialitzat = JSON.stringify(estat);
  if (storageOverride === undefined) {
    if (!setVal(CLAU_STORAGE_BATEC, estat)) {
      return { ok: false, error: 'error-escriptura-storage' };
    }
    return JSON.stringify(getVal(CLAU_STORAGE_BATEC, null)) === serialitzat
      ? { ok: true }
      : { ok: false, error: 'verificacio-lectura-fallida' };
  }
  if (!storageOverride) {
    return { ok: false, error: 'storage-indisponible' };
  }
  try {
    storageOverride.setItem(CLAU_STORAGE_BATEC, serialitzat);
    const rellegit = storageOverride.getItem(CLAU_STORAGE_BATEC);
    if (rellegit !== serialitzat) {
      return { ok: false, error: 'verificacio-lectura-fallida' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || 'error-escriptura-storage' };
  }
}

export default function BatecDeVidaCard({
  idioma = 'ca',
  personesConfianca = [],
  actiuInicial,
  avisCortesiaInicial = false,
  intervalAvaluacioMs = 60000,
  storage,
  onBatecEmes,
  onOptInChange,
  onAvisCortesia,
  onAlertaConfianca,
}) {
  const [estat, setEstat] = useState(() => {
    const base = lligEstatBatec(storage);
    const actiuResolt = actiuInicial !== undefined ? esBooleaCert(actiuInicial) : base.actiu;
    const iniciFinestraAt = base.ultimBatecAt || base.iniciFinestraAt || (actiuResolt ? new Date().toISOString() : null);
    const inicial = {
      ...base,
      actiu: actiuResolt,
      iniciFinestraAt,
      avisCortesiaPendent: avisCortesiaInicial ? true : base.avisCortesiaPendent,
    };
    if (actiuResolt && !base.ultimBatecAt && !base.iniciFinestraAt && storage !== undefined) {
      desaEstatBatecVerificat(inicial, storage);
    }
    return inicial;
  });
  const [errorStorage, setErrorStorage] = useState(false);
  const [alertaLocalActiva, setAlertaLocalActiva] = useState(false);

  const callbacksRef = useRef({ onAvisCortesia, onAlertaConfianca, storage });
  useEffect(() => {
    callbacksRef.current = { onAvisCortesia, onAlertaConfianca, storage };
  }, [onAvisCortesia, onAlertaConfianca, storage]);

  const monitorRef = useRef(null);
  if (!monitorRef.current) {
    monitorRef.current = creaMonitorBatecDeVida({
      actiuInicial: estat.actiu,
      pausatInicial: estat.pausat,
      ultimBatecAt: estat.ultimBatecAt || estat.iniciFinestraAt,
      intervalDiaHores: estat.intervalDiaHores,
      minutsGraciaCortesia: MINUTS_GRACIA_CORTESIA,
      horaDespertar: estat.horaDespertar,
      personesConfianca,
      onAvisCortesia: (payload) => {
        setEstat((prev) => {
          const nou = { ...prev, avisCortesiaPendent: true };
          desaEstatBatecVerificat(nou, callbacksRef.current.storage);
          return nou;
        });
        if (typeof callbacksRef.current.onAvisCortesia === 'function') {
          callbacksRef.current.onAvisCortesia(payload);
        }
      },
      onCancelCortesia: () => {
        setAlertaLocalActiva(false);
      },
      onAlertaConfianca: (payload) => {
        setAlertaLocalActiva(true);
        if (typeof callbacksRef.current.onAlertaConfianca === 'function') {
          callbacksRef.current.onAlertaConfianca(payload);
        }
      },
    });
  }
  monitorRef.current.setPersonesConfianca(personesConfianca);

  useEffect(() => {
    const monitor = monitorRef.current;
    if (!monitor || !estat.actiu || estat.pausat) return undefined;
    monitor.avalua();
    const timerId = setInterval(() => {
      monitor.avalua();
    }, Math.max(1000, Number(intervalAvaluacioMs) || 60000));
    return () => clearInterval(timerId);
  }, [estat.actiu, estat.pausat, intervalAvaluacioMs]);

  const textosBase = resolTextosBatec(idioma);
  const valorsText = { hores: estat.intervalDiaHores, hora: estat.horaDespertar };
  const textos = {
    ...textosBase,
    title: ompleText(textosBase.title, valorsText),
    badgeOn: ompleText(textosBase.badgeOn, valorsText),
    scheduleDay: ompleText(textosBase.scheduleDay, valorsText),
    scheduleNight: ompleText(textosBase.scheduleNight, valorsText),
    localAlert: ompleText(textosBase.localAlert, valorsText),
  };
  const ultimBatecLocal = estat.ultimBatecAt ? formataInstantLocal(estat.ultimBatecAt) : null;
  /* R11 Loop 3 (L2-04) · Sense cap persona de confiança, ningú no pot ser avisat: la targeta ho
     diu en clar i no deixa activar el Batec (desactivar-lo, sí). */
  const nombreConfianca = Array.isArray(personesConfianca) ? personesConfianca.length : 0;
  const senseConfianca = nombreConfianca === 0;

  const aplicaCanviEstat = (parcial) => {
    const nou = { ...estat, ...parcial };
    const resultat = desaEstatBatecVerificat(nou, storage);
    setErrorStorage(!resultat.ok);
    setEstat(nou);
    return { nou, persistit: resultat.ok };
  };

  /**
   * Envia un batec puntual («Estic bé») o confirma l'avís de cortesia de 15 minuts.
   *
   * Opt-in estricte:
   * - Si `estat.actiu` és `false` (perquè `BATEC_DE_VIDA_ACTIU = false` i l'usuari no ha fet opt-in),
   *   prémer «Estic bé» registra `ultimBatecAt` i neteja `avisCortesiaPendent`, però NO activa
   *   `actiu: true` sense acció explícita sobre el botó «Activar Batec de Vida».
   * - Tampoc no reprén una pausa: només el botó de pausa la lleva.
   */
  const enviaBatecAra = () => {
    const araMs = Date.now();
    const araIso = new Date(araMs).toISOString();
    setAlertaLocalActiva(false);
    monitorRef.current?.registraActivitat(araMs);
    const { persistit } = aplicaCanviEstat({
      actiu: estat.actiu,
      ultimBatecAt: araIso,
      iniciFinestraAt: araIso,
      avisCortesiaPendent: false,
    });
    if (typeof onBatecEmes === 'function') {
      onBatecEmes({
        ultimBatecAt: araIso,
        actiu: estat.actiu,
        persistit,
        gpsTracked: false,
      });
    }
  };

  const commutaActiu = () => {
    if (!estat.actiu && senseConfianca) return;
    const nouActiu = !estat.actiu;
    const araIso = new Date().toISOString();
    monitorRef.current?.setActiu(nouActiu);
    const { persistit } = aplicaCanviEstat({
      actiu: nouActiu,
      pausat: false,
      iniciFinestraAt: nouActiu ? araIso : estat.iniciFinestraAt,
    });
    if (typeof onOptInChange === 'function') {
      onOptInChange({ actiu: nouActiu, persistit });
    }
  };

  const commutaPausa = () => {
    const nouPausat = !estat.pausat;
    monitorRef.current?.setPausat(nouPausat);
    aplicaCanviEstat({ pausat: nouPausat });
  };

  const badgeText = !estat.actiu
    ? textos.badgeOff
    : estat.pausat
      ? textos.badgePaused
      : textos.badgeOn;

  return (
    <section
      className="sdp-admin-importacio__card"
      aria-label={textos.title}
      data-sdp-batec-vida="true"
    >
      <div className="sdp-admin-importacio__card-cap">
        <span className="sdp-badge-system">{badgeText}</span>
        <span className="sdp-admin-pill">
          {estat.intervalDiaHores}h · {MINUTS_GRACIA_CORTESIA} min
        </span>
      </div>

      <h3>{textos.title}</h3>
      <p className="sdp-nota-suau">{textos.subtitle}</p>

      <div className="sdp-admin-pills" role="group" aria-label={textos.scheduleDay}>
        <span className="sdp-admin-pill">{textos.scheduleDay}</span>
        <span className="sdp-admin-pill">{textos.scheduleNight}</span>
      </div>

      <p className="sdp-nota-suau">{textos.graceNotice}</p>
      <p className="sdp-nota-suau">{textos.privacyGuarantee}</p>
      <p className="sdp-nota-suau" data-testid="batec-nomes-pagina-oberta">{textos.foregroundOnlyNotice}</p>
      {senseConfianca && (
        <p className="sdp-nota-suau" data-testid="batec-sense-destinataris">{textos.noTrustedContactsNotice}</p>
      )}

      {estat.avisCortesiaPendent && !alertaLocalActiva && (
        <p className="sdp-nota-suau" role="status" aria-live="polite">
          {textos.btnConfirmGrace}
        </p>
      )}

      {alertaLocalActiva && (
        <p className="sdp-nota-suau" role="alert">
          {senseConfianca ? `${textos.localAlert} ${textos.noOneWarned}` : textos.localAlert}
        </p>
      )}

      {errorStorage && (
        <p className="sdp-nota-suau" role="alert">
          {textos.storageErrorNotice}
        </p>
      )}

      <dl className="sdp-admin-dl">
        <div>
          <dt>{textos.lastBeatLabel}</dt>
          <dd>{ultimBatecLocal || textos.noBeatYet}</dd>
        </div>
        <div>
          <dt>{textos.trustedContactsLabel}</dt>
          <dd>{nombreConfianca}</dd>
        </div>
      </dl>

      <div className="sdp-admin-actions-inline">
        <Boto varietat="primari" onClick={enviaBatecAra}>
          {estat.avisCortesiaPendent ? textos.btnConfirmGrace : textos.btnImOk}
        </Boto>
        <Boto varietat="secundari" onClick={commutaActiu} disabled={!estat.actiu && senseConfianca}>
          {estat.actiu ? textos.btnDisableActive : textos.btnToggleActive}
        </Boto>
        {estat.actiu && (
          <Boto varietat="fantasma" onClick={commutaPausa}>
            {estat.pausat ? textos.btnResume : textos.btnPause}
          </Boto>
        )}
      </div>
    </section>
  );
}
