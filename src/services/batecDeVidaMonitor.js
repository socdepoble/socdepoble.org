import {
  BATEC_DE_VIDA_ACTIU,
  HORA_DESPERTAR_DEFECTE,
  HORA_PAUSA_NOCTURNA_DEFECTE,
  INTERVAL_DIA_HORES_DEFECTE,
  MINUTS_GRACIA_CORTESIA,
} from '../config/batecDeVida.js';

function parsejaHoraMinut(cadenaHora = '09:00') {
  const parts = String(cadenaHora).split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  return {
    hores: Number.isFinite(h) ? Math.max(0, Math.min(23, h)) : 9,
    minuts: Number.isFinite(m) ? Math.max(0, Math.min(59, m)) : 0,
  };
}

/**
 * Determina si un instant (ms o Date) cau dins la finestra de pausa nocturna
 * (per defecte de 22:00 a 09:00 en hora local).
 */
export function esHoraNocturna(
  instantMs,
  horaDespertar = HORA_DESPERTAR_DEFECTE,
  horaPausaNocturna = HORA_PAUSA_NOCTURNA_DEFECTE,
) {
  const data = new Date(instantMs);
  const minutsDia = data.getHours() * 60 + data.getMinutes();
  const despertar = parsejaHoraMinut(horaDespertar);
  const pausa = parsejaHoraMinut(horaPausaNocturna);
  const minDespertar = despertar.hores * 60 + despertar.minuts;
  const minPausa = pausa.hores * 60 + pausa.minuts;

  if (minPausa > minDespertar) {
    return minutsDia >= minPausa || minutsDia < minDespertar;
  }
  return minutsDia >= minPausa && minutsDia < minDespertar;
}

/**
 * Si l'instant cau en horari nocturn, retorna l'instant exacte de l'hora de despertar:
 * la de l'endemà si la pausa travessa mitjanit i ja ha començat (p. ex. 22:00→09:00
 * a les 23:00), i la del mateix dia en qualsevol altre cas (de matinada, o una pausa
 * que comença després de mitjanit, com 00:00→09:00 o 01:00→09:00).
 */
export function ajustaFiPausaNocturna(
  instantMs,
  horaDespertar = HORA_DESPERTAR_DEFECTE,
  horaPausaNocturna = HORA_PAUSA_NOCTURNA_DEFECTE,
) {
  if (!esHoraNocturna(instantMs, horaDespertar, horaPausaNocturna)) {
    return instantMs;
  }
  const data = new Date(instantMs);
  const despertar = parsejaHoraMinut(horaDespertar);
  const pausa = parsejaHoraMinut(horaPausaNocturna);
  const minutsDia = data.getHours() * 60 + data.getMinutes();
  const minPausa = pausa.hores * 60 + pausa.minuts;
  const minDespertar = despertar.hores * 60 + despertar.minuts;

  const sortida = new Date(instantMs);
  if (minPausa > minDespertar && minutsDia >= minPausa) {
    sortida.setDate(sortida.getDate() + 1);
  }
  sortida.setHours(despertar.hores, despertar.minuts, 0, 0);
  return sortida.getTime();
}

/**
 * Motor determinista de monitorització d'inactivitat del telèfon (IDEA-123).
 *
 * Garanties de disseny (les cobrix BatecDeVidaCard.test.jsx):
 * 1. Opt-in estricte: si `actiu` és `false` (o `BATEC_DE_VIDA_ACTIU = false` sense opt-in),
 *    no programa cap temporitzador ni envia cap avís.
 * 2. Finestra diürna de 6 hores (`intervalDiaHores`) amb pausa nocturna automàtica fins a les 09:00.
 * 3. Finestra de cortesia de 15 minuts (`minutsGraciaCortesia`) abans d'avisar el germà / contactes,
 *    comptada des de l'instant en què s'ha mostrat l'avís (també si l'avaluació arriba tard).
 * 4. Qualsevol moviment o interacció (`registraActivitat`, `setActiu`, reprendre amb `setPausat(false)`)
 *    cancel·la immediatament l'avís de cortesia pendent i reinicia el cicle de 6 hores. Pausar
 *    també cancel·la l'avís pendent (`onCancelCortesia`).
 * 5. Deduplicació estricta per cicle d'inactivitat: mai dispara dos avisos al germà pel mateix cicle.
 */
export function esBooleaCert(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const net = valor.trim().toLowerCase();
    if (net === 'false' || net === '0' || net === 'no' || net === '') return false;
    return net === 'true' || net === '1';
  }
  return Boolean(valor);
}

function resolInstantInicialMs(valor, fallbackMs) {
  if (valor === undefined || valor === null || valor === '') return fallbackMs;
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  const parsejat = new Date(valor).getTime();
  return Number.isFinite(parsejat) ? parsejat : fallbackMs;
}

export function creaMonitorBatecDeVida({
  actiuInicial = BATEC_DE_VIDA_ACTIU,
  pausatInicial = false,
  ultimBatecAt = null,
  ultimMovimentInicialMs = null,
  intervalDiaHores = INTERVAL_DIA_HORES_DEFECTE,
  minutsGraciaCortesia = MINUTS_GRACIA_CORTESIA,
  horaDespertar = HORA_DESPERTAR_DEFECTE,
  horaPausaNocturna = HORA_PAUSA_NOCTURNA_DEFECTE,
  personesConfianca = [],
  nowFn = () => Date.now(),
  onAvisCortesia,
  onCancelCortesia,
  onAlertaConfianca,
} = {}) {
  let actiu = esBooleaCert(actiuInicial);
  let pausat = esBooleaCert(pausatInicial);
  let llistaConfianca = Array.isArray(personesConfianca) ? [...personesConfianca] : [];
  let ultimMovimentMs = resolInstantInicialMs(
    ultimMovimentInicialMs ?? ultimBatecAt,
    nowFn(),
  );
  let cicleId = 1;
  let avisCortesiaPendent = false;
  let cicleCortesiaActiu = null;
  let cortesiaMostradaMs = null;
  const ciclesAlertats = new Set();

  function cancelaCortesiaPendent(instantMs) {
    if (!avisCortesiaPendent) return;
    avisCortesiaPendent = false;
    cicleCortesiaActiu = null;
    cortesiaMostradaMs = null;
    if (typeof onCancelCortesia === 'function') {
      onCancelCortesia({ cancelAtMs: instantMs, cicleId });
    }
  }

  function reiniciaCicle(instantMs = nowFn()) {
    ultimMovimentMs = instantMs;
    cicleId += 1;
    cancelaCortesiaPendent(instantMs);
  }

  function calculaInstantCortesiaMs() {
    const baseTargetMs = ultimMovimentMs + intervalDiaHores * 3600 * 1000;
    return ajustaFiPausaNocturna(baseTargetMs, horaDespertar, horaPausaNocturna);
  }

  /* R11 Loop 3 · Si el termini de l'alerta cau dins la pausa nocturna, la cortesia torna a comptar
     sencera des de l'hora de despertar (09:00 → 09:15), com diu la garantia 3 i el README del kit:
     abans una cortesia oberta a les 21:46–21:59 acabava a les 09:00 en punt, amb només 1–14 minuts
     de dia per a confirmar. */
  function terminiAlertaMs(baseMs, graciaMs) {
    const ajustat = ajustaFiPausaNocturna(baseMs, horaDespertar, horaPausaNocturna);
    return ajustat === baseMs ? baseMs : ajustat + graciaMs;
  }

  function avalua(instantActualMs = nowFn()) {
    if (!actiu || pausat) {
      return {
        actiu,
        pausat,
        avisCortesiaPendent: false,
        alertaDisparada: false,
        cicleId,
      };
    }

    const graciaMs = minutsGraciaCortesia * 60 * 1000;
    const instantCortesiaMs = calculaInstantCortesiaMs();
    let instantAlertaMs = terminiAlertaMs(instantCortesiaMs + graciaMs, graciaMs);
    if (avisCortesiaPendent && cortesiaMostradaMs !== null) {
      instantAlertaMs = Math.max(instantAlertaMs, terminiAlertaMs(cortesiaMostradaMs + graciaMs, graciaMs));
    }

    if (instantActualMs < instantCortesiaMs) {
      return {
        actiu,
        pausat,
        avisCortesiaPendent,
        alertaDisparada: ciclesAlertats.has(cicleId),
        cicleId,
        instantCortesiaMs,
        instantAlertaMs,
      };
    }

    if (
      !avisCortesiaPendent
      && !ciclesAlertats.has(cicleId)
      && !esHoraNocturna(instantActualMs, horaDespertar, horaPausaNocturna)
    ) {
      avisCortesiaPendent = true;
      cicleCortesiaActiu = cicleId;
      cortesiaMostradaMs = instantActualMs;
      instantAlertaMs = Math.max(instantAlertaMs, terminiAlertaMs(instantActualMs + graciaMs, graciaMs));
      if (typeof onAvisCortesia === 'function') {
        onAvisCortesia({
          cicleId,
          triggeredAtMs: instantActualMs,
          deadlineMs: instantAlertaMs,
          gpsTracked: false,
        });
      }
    }

    if (
      instantActualMs >= instantAlertaMs
      && !esHoraNocturna(instantActualMs, horaDespertar, horaPausaNocturna)
      && !ciclesAlertats.has(cicleId)
    ) {
      ciclesAlertats.add(cicleId);
      if (typeof onAlertaConfianca === 'function') {
        onAlertaConfianca({
          cicleId,
          alertedAtMs: instantActualMs,
          ultimMovimentMs,
          destinataris: [...llistaConfianca],
          gpsTracked: false,
        });
      }
    }

    return {
      actiu,
      pausat,
      avisCortesiaPendent,
      alertaDisparada: ciclesAlertats.has(cicleId),
      cicleId,
      instantCortesiaMs,
      instantAlertaMs,
    };
  }

  return {
    setPersonesConfianca(novaLlista = []) {
      llistaConfianca = Array.isArray(novaLlista) ? [...novaLlista] : [];
    },
    registraActivitat(instantMs = nowFn()) {
      reiniciaCicle(instantMs);
      return avalua(instantMs);
    },
    setActiu(nouActiu, instantMs = nowFn()) {
      actiu = esBooleaCert(nouActiu);
      reiniciaCicle(instantMs);
      return avalua(instantMs);
    },
    setPausat(nouPausat, instantMs = nowFn()) {
      const seguentPausat = esBooleaCert(nouPausat);
      const reprenent = pausat && !seguentPausat;
      pausat = seguentPausat;
      if (pausat) {
        cancelaCortesiaPendent(instantMs);
      } else if (reprenent) {
        reiniciaCicle(instantMs);
      }
      return avalua(instantMs);
    },
    avalua,
    getEstat() {
      return {
        actiu,
        pausat,
        ultimMovimentMs,
        avisCortesiaPendent,
        cicleCortesiaActiu,
        alertaDisparada: ciclesAlertats.has(cicleId),
        cicleId,
      };
    },
  };
}
