/**
 * xatCorporatiu.js — W4-09 (auditoria de Codex 261003_1950, «la boina
 * corporativa usa l'id de llavor en remot») · On porta l'autor «Sóc de
 * Poble» de la boina de les targetes del Panell: el xat corporatiu, el
 * missatge directe de l'entitat (/xat?amb=<id>, com «Escriu-li al xat» de la
 * seua fitxa).
 *
 *  · LLAVOR ('seed' o 'local'): l'id del padró ('socdepoble',
 *    destinsControl.XAT_SOCDEPOBLE), que resol el xat local. Cap crida.
 *  · REMOT: 'socdepoble' no és cap entitat del servidor. L'entitat es resol
 *    ABANS de fer l'enllaç, pel port del backend (loadPerfilPublic, capacitat
 *    'directori'), amb el slug declarat del pilot ('soc-de-poble',
 *    identitatsSeed.js). L'enllaç porta l'id que torna el port, siga quin
 *    siga el seu format.
 *    W4-10 (auditoria de Codex) · El format és cosa del proveïdor: ací només
 *    es comprova que el port ha resolt una entitat amb un id que cap en una
 *    consulta d'URL (esIdDeConsulta) i que l'enllaç, codificat, és una ruta
 *    que la targeta seguix (esRutaInterna). Que crea_fil_directe de Supabase vol un
 *    UUID ho comprova el seu adaptador (data/supabase/xat.js), que rebutja la
 *    resta amb un error clar abans de cap crida. Sense la capacitat, sense
 *    entitat o amb error: cap enllaç i el Panell ho diu. Mentre es resol,
 *    l'autor tampoc és enllaç.
 *  · Canvi de backend (backendScope: proveïdor, endpoint, tenant i mode): es
 *    torna a resoldre i la resposta vella es descarta (AbortController).
 *  · Fora de l'app (sense UIProvider: l'espècimen del catàleg muntat sol) no
 *    hi ha backend: el xat de la llavor, com en mode seed.
 *
 * Model B: cap import de Supabase, només el port. El slug de l'entitat de
 * suport del desplegament l'ha de confirmar el proveïdor (Sollutia).
 */
import { useEffect, useRef, useState } from 'react';
import { useUIState } from '../../app/contexts/UIContext';
import { backendScope, normalizeBackendConfig } from '../../config/backendConfig.js';
import { esRutaInterna } from '../../config/objecteConnectable.js';
import { loadPerfilPublic, teCapacitat } from '../../data/backendPort.js';
import { ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { XAT_SOCDEPOBLE } from './destinsControl.js';

const MODES_LOCALS = new Set(['seed', 'local']);
/* El mateix límit que l'id d'un subjecte de xat (contracte.js). */
const MAXIM_ID = 200;
const NO_CAP_EN_CONSULTA = /[\u0000-\u001F\u007F\s]/;

/**
 * Cert si `id` és l'id d'una entitat que pot anar a /xat?amb=: una cadena no
 * buida, de fins a 200 caràcters, sense espais ni caràcters de control (la
 * resta la codifica rutaXatCorporatiu). Cap regla de format de cap proveïdor:
 * «42», «wp:organization:42» i un UUID hi caben igual (W4-10).
 */
const esIdDeConsulta = (id) => typeof id === 'string'
  && id.length > 0 && id.length <= MAXIM_ID && !NO_CAP_EN_CONSULTA.test(id);

/** estat: 'llavor' | 'remot' (enllaç) · 'resolent' | 'absent' | 'error' (sense enllaç). */
export const XAT_DE_LLAVOR = Object.freeze({ estat: 'llavor', href: XAT_SOCDEPOBLE });
const RESOLENT = Object.freeze({ estat: 'resolent', href: null });
const ABSENT = Object.freeze({ estat: 'absent', href: null });

/** El port per defecte: només les dues peces que calen (Model B). */
const PORT = Object.freeze({ teCapacitat, loadPerfilPublic });

/* Com PerfilPublicSection: el backend és a punt quan l'amfitrió ha arrencat.
   Amb el senyal, desmuntar el Panell deixa d'esperar. */
const hostLlest = ({ signal } = {}) => import('../../host.js').then((host) => host.quanLlest({ signal }));

/** La ruta del xat corporatiu amb l'id que ha tornat el port, codificat. */
export const rutaXatCorporatiu = (id) => `/xat?amb=${encodeURIComponent(id)}`;

/**
 * Resol on porta l'autor. Pur respecte de React: el port, l'espera de
 * l'amfitrió i la clau s'injecten (les proves no toquen la xarxa).
 * Rebutja si el port falla; qui la crida decidix què es veu.
 */
export async function resolXatCorporatiu({
  dataMode, config = {}, port = PORT, llest = hostLlest, clau = ENTITAT_PILOT_SLUG
} = {}) {
  if (MODES_LOCALS.has(dataMode)) return XAT_DE_LLAVOR;
  await llest({ signal: config.signal });
  if (!port.teCapacitat('directori')) return ABSENT;
  const perfil = await port.loadPerfilPublic(clau, config);
  if (perfil?.tipus !== 'entitat' || !esIdDeConsulta(perfil.id)) return ABSENT;
  /* Revisió de W4-10 · «remot» només amb una ruta que la targeta seguix
     (esRutaDeLaPorta d'UniversalCard, W4-07: esRutaInterna, 300 caràcters com
     a molt). Un id curt però ple de caràcters codificats (é → %C3%A9) no hi
     cap: cap enllaç i el Panell ho diu, en lloc d'un autor sense enllaç i
     sense avís. */
  const href = rutaXatCorporatiu(perfil.id);
  return esRutaInterna(href) ? Object.freeze({ estat: 'remot', href }) : ABSENT;
}

/* El mode i l'abast del backend; una configuració invàlida (tenant o
   endpoint) no té abast: cap crida. */
function llegixBackend(config) {
  try {
    return { dataMode: normalizeBackendConfig(config || {}).dataMode, abast: backendScope(config || {}) };
  } catch {
    return { dataMode: 'remote', abast: null };
  }
}

/* L'estat de la interfície, o null fora de l'app (sense UIProvider: un
   espècimen del catàleg muntat sol, una prova). La forma `return useUIState()`
   dins d'un try és la que rules-of-hooks accepta (com useUbicacioApp). */
function useEstatDeLApp() {
  try {
    return useUIState();
  } catch {
    return null;
  }
}

/**
 * { estat, href } de l'autor de la boina per a la configuració de l'app.
 * href és null mentre no hi ha un xat de veres on portar. Fora de l'app no hi
 * ha cap backend: el xat de la llavor, sense crides.
 */
export function useXatCorporatiu() {
  const app = useEstatDeLApp();
  const externalConfig = app?.externalConfig;
  const { dataMode, abast } = llegixBackend(externalConfig);
  const local = app === null || MODES_LOCALS.has(dataMode);
  const configRef = useRef(externalConfig);
  configRef.current = externalConfig;
  const [resolt, setResolt] = useState(() => ({ abast: null, ...RESOLENT }));

  useEffect(() => {
    if (local || !abast) return undefined;
    const control = new AbortController();
    let viu = true;
    resolXatCorporatiu({ dataMode, config: { ...(configRef.current || {}), signal: control.signal } })
      .then((resultat) => { if (viu) setResolt({ abast, ...resultat }); })
      .catch((error) => {
        if (viu && error?.name !== 'AbortError') setResolt({ abast, estat: 'error', href: null });
      });
    return () => {
      viu = false;
      control.abort();
    };
  }, [abast, dataMode, local]);

  if (local) return XAT_DE_LLAVOR;
  if (!abast) return ABSENT;
  return resolt.abast === abast ? { estat: resolt.estat, href: resolt.href } : RESOLENT;
}
