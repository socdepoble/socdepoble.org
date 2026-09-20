// src/data/sessionService.js
import { caducitatJwt, MARGE_RENOVACIO_MS } from './identitat.js';
import { getCurrentUser, teCapacitat, refrescaSessio, logout, elMeuRol } from './backendPort.js';

let generacio = 0;
let temporitzador = null;
let currentConfig = {};
const listeners = new Set();
let estatActual = {
  usuari: null,
  estat: 'comprovant', // 'comprovant', 'dins', 'fora'
  rol: null,
  generacio: 0
};

export function getSessionState() {
  return estatActual;
}

export function subscribeSession(listener) {
  listeners.add(listener);
  listener(estatActual); // enviar l'estat actual immediatament
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach(l => l(estatActual));
}

export function setSessionConfig(config) {
  currentConfig = config;
  sincronitza();
}

export function sincronitza() {
  const preUsuariId = estatActual.usuari?.id;
  let u = null;
  try {
    u = getCurrentUser();
  } catch (e) {
    u = null;
  }

  // Increment generation if user changed to invalidate old loops
  if (preUsuariId !== u?.id) {
    generacio++;
    if (u) estatActual.rol = 'desconegut';
  }

  estatActual = {
    ...estatActual,
    usuari: u,
    estat: u ? 'dins' : 'fora',
    generacio
  };

  if (!u) {
    estatActual.rol = null;
    notify();
  } else {
    // Si estem dins i tenim capacitat, busquem el rol
    if (teCapacitat('sessio')) {
      const myGen = generacio;
      elMeuRol(currentConfig)
        .then(rol => {
          if (myGen !== generacio) return;
          if (estatActual.rol !== (rol || 'usuari')) {
            estatActual = { ...estatActual, rol: rol || 'usuari' };
            notify();
          }
        })
        .catch(() => {
          if (myGen !== generacio) return;
          if (estatActual.rol !== 'usuari') {
            estatActual = { ...estatActual, rol: 'usuari' };
            notify();
          }
        });
    }
    notify();
  }

  gestionaTemporitzador();
}

export async function renovaAra() {
  if (!teCapacitat('sessio')) {
    generacio++;
    await logout();
    return;
  }
  const myGen = generacio;
  try {
    const ok = await refrescaSessio(currentConfig);
    if (myGen !== generacio) return;
    if (!ok) {
      generacio++;
      await logout();
    }
  } catch (e) {
    if (myGen !== generacio) return;
    console.warn('Renovació asíncrona ajornada per xarxa', e);
  }
}

function gestionaTemporitzador() {
  if (temporitzador) {
    clearTimeout(temporitzador);
    temporitzador = null;
  }
  if (estatActual.estat !== 'dins') return;

  const exp = caducitatJwt();
  if (!exp) return; // token opac

  const espera = exp - Date.now() - MARGE_RENOVACIO_MS;
  if (espera <= 0) {
    renovaAra();
    return;
  }

  temporitzador = setTimeout(() => {
    if (caducitatJwt() <= Date.now() + MARGE_RENOVACIO_MS) {
      renovaAra();
    } else {
      sincronitza();
    }
  }, Math.min(espera, 600000));
}

// Iniciar l'escutador general
if (typeof window !== 'undefined') {
  window.addEventListener('sdp:auth-change', () => {
    // Check if the change is a logout
    const u = getCurrentUser();
    if (!u) generacio++;
    sincronitza();
  });

  const alDespertar = () => {
    if (document.visibilityState !== 'visible') return;
    const exp = caducitatJwt();
    if (!exp) return;
    if (exp <= Date.now()) { renovaAra(); return; }
    if (exp - Date.now() <= MARGE_RENOVACIO_MS) renovaAra();
  };
  document.addEventListener('visibilitychange', alDespertar);
  window.addEventListener('online', alDespertar);
}
