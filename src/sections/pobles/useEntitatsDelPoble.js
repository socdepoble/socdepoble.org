/**
 * useEntitatsDelPoble.js · P1-11 (pla 261024_2230, T5B-01; Llibre Mestre
 * P1-11, ordre del Mestre 261024 18:21) · Les empreses, les entitats i els
 * grups públics d'un poble, per a la segona pestanya de la seua pàgina
 * («Empreses i entitats», /pobles/:id).
 *
 * Cap petició nova al contracte: la capacitat opcional 'directoriEntitats'
 * (listPublicOrganizations) amb el filtre `poble`, que el servidor aplica
 * ABANS del límit (reserva de Codex 1945: abans, filtrar al client després
 * de tallar a 500 podia deixar fora les entitats d'un poble). El poble va
 * pel NOM de la fitxa (title, o name), el mateix que desa el selector del
 * poble d'una organització (PerfilContext · opcionsDePoble). Cap nom de poble
 * al codi.
 *
 * Torna { estat, entitats, error, refresh }:
 *   · 'no-disponible' · el node no té la capacitat (un amfitrió vàlid);
 *   · 'sense-poble' · la fitxa no porta cap nom: no es pregunta res (un
 *     filtre buit tornaria les entitats de tots els pobles);
 *   · 'loading' | 'ready' | 'error' · la crida. `refresh` la repetix.
 * Les files es tornen a filtrar pel nom exacte (esDelPobleDelFiltre): un
 * amfitrió que ignorara `poble` no posa mai a la pestanya les entitats d'un
 * altre poble. El kit de conformitat ho exigix a tots.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUIState } from '../../app/contexts/UIContext';
import { backendScope } from '../../config/backendConfig.js';
import { listPublicOrganizations, teCapacitat } from '../../data/backendPort.js';
import { esDelPobleDelFiltre, pobleDelFiltre } from '../../data/pobleOrganitzacio.js';

const CAP = Object.freeze([]);
const NO_DISPONIBLE = Object.freeze({ estat: 'no-disponible', entitats: CAP, error: null });
const SENSE_POBLE = Object.freeze({ estat: 'sense-poble', entitats: CAP, error: null });
const CARREGANT = Object.freeze({ estat: 'loading', entitats: CAP, error: null });

/* teCapacitat sense llançar, com Seguidors.jsx. */
const teDirectori = () => {
  try { return teCapacitat('directoriEntitats') === true; } catch { return false; }
};
const abastDe = (config) => {
  try { return backendScope(config || {}); } catch { return 'sense-abast'; }
};
const esCancel = (error) => error?.name === 'AbortError';

/* La configuració de l'App, o cap fora d'ella (una prova, el catàleg). */
function useConfigDeLApp() {
  try {
    return useUIState()?.externalConfig || null;
  } catch {
    return null;
  }
}

/** El nom del poble d'una fitxa de /pobles per al filtre del directori, o null. */
export const nomDelPobleDeLaFitxa = (poble) => pobleDelFiltre(
  typeof poble?.title === 'string' && poble.title.trim() ? poble.title : poble?.name
);

/** Les organitzacions públiques del poble `poble` (una fitxa de /pobles). */
export function useEntitatsDelPoble(poble) {
  const config = useConfigDeLApp() || {};
  /* La configuració canvia d'identitat a cada render: es llig d'un ref, i
     l'abast (backend, tenant i mode) és el que decidix si cal tornar a demanar. */
  const configRef = useRef(config);
  configRef.current = config;
  const nom = nomDelPobleDeLaFitxa(poble);
  const ambDirectori = teDirectori();
  const [intent, setIntent] = useState(0);
  const clau = ambDirectori && nom ? JSON.stringify([nom, abastDe(config), intent]) : null;
  const [estat, setEstat] = useState({ clau: null, estat: 'loading', entitats: CAP, error: null });

  useEffect(() => {
    if (!clau) return undefined;
    const control = new AbortController();
    /* Dins del then: un port sense el mètode llança de manera síncrona. */
    Promise.resolve()
      .then(() => listPublicOrganizations({ poble: nom, signal: control.signal }, configRef.current))
      .then((llista) => {
        if (control.signal.aborted) return;
        const files = Array.isArray(llista) ? llista.filter((fila) => fila?.id != null && esDelPobleDelFiltre(fila, nom)) : CAP;
        setEstat({ clau, estat: 'ready', entitats: files.length ? files : CAP, error: null });
      })
      .catch((error) => {
        if (control.signal.aborted || esCancel(error)) return;
        setEstat({ clau, estat: 'error', entitats: CAP, error });
      });
    return () => control.abort();
  }, [clau, nom]);

  const refresh = useCallback(() => setIntent((valor) => valor + 1), []);
  /* Objectes estables (l'estat desat o una constant): qui memoritza no torna a pintar. */
  const actual = !ambDirectori ? NO_DISPONIBLE : !nom ? SENSE_POBLE : (estat.clau === clau ? estat : CARREGANT);
  return useMemo(() => ({ estat: actual.estat, entitats: actual.entitats, error: actual.error, refresh }), [actual, refresh]);
}
