/**
 * useIncloureEnEntitat.js — Incloure una persona en una entitat que
 * administres, des de /connectar (FEDI-22, ordre del Mestre, 261103).
 *
 *   · Capacitat 'membresOrganitzacio' del port (la mateixa de «Membres i
 *     connexions» al Perfil): llistaMembresOrganitzacio per a saber si ja
 *     n'és membre i desaMembreOrganitzacio per a l'alta directa (decisió
 *     261008: sense invitació ni avís) o l'ascens de membre a
 *     administradora. Sense la capacitat, cap crida i 'no-disponible'.
 *   · C10 (crític, 261103) · La clau és l'àmbit sencer, com
 *     useFitxaDeConnexio (P1-15): el backend, la persona que mira, l'entitat i
 *     la persona visitada. La resposta d'una clau antiga no es pinta.
 *   · Minimització · De la llista de membres només es desa el ROL de la
 *     persona visitada (o null): ni la llista ni cap altre membre van a
 *     l'estat ni es pinten.
 *   · L'escriptura captura la sessió (capturaSessio): eixir o canviar de
 *     compte entremig l'avorta, i un AbortError no es pinta.
 *   · Mai crida segueix, creaFil ni sendChatMessage: formar part no és
 *     connectar-se ni avisar.
 *   · FEDI-23 (Codex) · Amb la capacitat 'connexionsPubliques', una lectura
 *     de preferenciesConnexions de l'entitat (només owner o admin) confirma
 *     que el servidor té les connexions: aleshores `ambFuncions` és true i
 *     l'escriptura és inclouPersonaEnEntitat, que desa «Treballador / Soci».
 *     De la lectura només es guarda eixe sí o no. Si falla (sense la
 *     migració, NO-DISPONIBLE), l'escriptura continua per
 *     desaMembreOrganitzacio i «Treballador / Soci» va desactivat.
 *   · Risc residual acceptat (informe FEDI-22) · Si la propietària, des
 *     d'una altra pestanya, fa administradora la persona entre la lectura i
 *     una alta com a 'member', l'alta la degradaria: el servidor ho permet a
 *     la propietària.
 *
 * Torna { estat, rolActual, ambFuncions, ocupat, resultat, error, inclou }:
 *   estat     · 'comprovant' | 'llest' | 'error-lectura' | 'no-disponible'
 *   rolActual · 'owner' | 'admin' | 'member' | null (no en forma part)
 *   ambFuncions · el servidor desa «Treballador / Soci» (FEDI-23)
 *   resultat  · 'fetMembre' | 'fetTreballador' | 'fetAdmin' | null (l'última acció que ha anat bé)
 *   error     · { codi } de l'última escriptura que ha fallat, o null
 *   inclou(rol) → Promise<boolean> · rol 'member' o 'admin', i 'treballador'
 *     només amb ambFuncions; cap altre.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  desaMembreOrganitzacio, inclouPersonaEnEntitat, llistaMembresOrganitzacio, preferenciesConnexions, teCapacitat
} from '../../../data/backendPort.js';
import { backendScope } from '../../../config/backendConfig.js';
import { capturaSessio, entradaSessio } from '../../../data/identitat.js';
import { rolsQueEsPodenEscriure } from './rolsDInclusio.js';
import { connexionsPotserDisponibles, recordaSiNoDisponibles } from '../sondaConnexions.js';

/* Un port sense la capacitat (o un mock parcial) no ha de fer caure la vista. */
export function teMembresOrganitzacio() {
  try {
    return teCapacitat('membresOrganitzacio') === true
      && typeof llistaMembresOrganitzacio === 'function' && typeof desaMembreOrganitzacio === 'function';
  } catch { return false; }
}

/* FEDI-23 · El port declara les connexions; si el servidor les té ho diu la lectura. */
function teConnexionsPubliques() {
  try {
    return teCapacitat('connexionsPubliques') === true
      && typeof preferenciesConnexions === 'function' && typeof inclouPersonaEnEntitat === 'function';
  } catch { return false; }
}

/* La clau del backend, com useFitxaDeConnexio: una configuració il·legible és un àmbit més. */
function ambitDelBackend(config) {
  try { return backendScope(config); } catch { return 'backend:invàlid'; }
}

const ROLS = Object.freeze(['owner', 'admin', 'member']);
/* El rol de la vista i el del contracte de connexions (contracte.js, connexionsPubliques). */
const ROL_DE_CONNEXIONS = Object.freeze({ admin: 'administrador', treballador: 'treballador', member: 'usuari' });
const RESULTAT = Object.freeze({ admin: 'fetAdmin', treballador: 'fetTreballador', member: 'fetMembre' });

/** El rol de la persona a la llista de membres (tipus 'persona' i el mateix id), o null. Pura. */
export function rolDeLaPersona(llista, personaId) {
  const id = String(personaId ?? '');
  const membre = (Array.isArray(llista) ? llista : [])
    .find((m) => m?.tipus === 'persona' && m.id != null && String(m.id) === id);
  return membre && ROLS.includes(membre.rol) ? membre.rol : null;
}

const codiDe = (error) => (typeof error?.code === 'string' && error.code ? error.code : null);

export function useIncloureEnEntitat({ orgId = null, personaId = null, config = {}, usuariId = null } = {}) {
  const org = String(orgId ?? '').trim();
  const persona = String(personaId ?? '').trim();
  const disponible = teMembresOrganitzacio();
  const entrada = entradaSessio();
  const clau = disponible && org && persona
    ? JSON.stringify([ambitDelBackend(config), usuariId == null ? null : String(usuariId), org, persona, entrada]) : null;
  /* { clau, estat, rol, ambFuncions } i { clau, ocupat, resultat, error }: només valen per a la seua clau. */
  const [lectura, setLectura] = useState(null);
  const [accio, setAccio] = useState(null);
  const configRef = useRef(config);
  configRef.current = config;
  const ocupatRef = useRef(null);
  const abastRef = useRef({ clau, generacio: 0 });
  if (abastRef.current.clau !== clau) {
    abastRef.current = { clau, generacio: abastRef.current.generacio + 1 };
    ocupatRef.current = null;
  }
  const generacio = abastRef.current.generacio;
  const viu = useRef(true);
  useEffect(() => {
    viu.current = true;
    return () => {
      viu.current = false;
      abastRef.current = { ...abastRef.current, generacio: abastRef.current.generacio + 1 };
      ocupatRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!clau) return undefined;
    const generacioLectura = abastRef.current.generacio;
    const controlador = new AbortController();
    const ambSenyal = { ...configRef.current, signal: controlador.signal };
    const encara = () => viu.current && !controlador.signal.aborted
      && abastRef.current.clau === clau && abastRef.current.generacio === generacioLectura
      && entradaSessio() === entrada;
    /* Només un sí o un no: la llista de connexions de l'entitat no es guarda.
       Ronda 7 (GLOBAL-06) · Un NO-DISPONIBLE es recorda per backend (sondaConnexions.js). */
    const ambit = JSON.parse(clau)[0];
    const funcions = teConnexionsPubliques() && connexionsPotserDisponibles(ambit)
      ? Promise.resolve()
        .then(() => encara() ? preferenciesConnexions({ tipus: 'entitat', id: org }, ambSenyal) : null)
        .then(() => true, (e) => { recordaSiNoDisponibles(ambit, e); return false; })
      : Promise.resolve(false);
    Promise.all([Promise.resolve().then(() => encara() ? llistaMembresOrganitzacio(org, ambSenyal) : null), funcions])
      .then(([llista, ambFuncions]) => {
        if (encara()) setLectura({ clau, generacio: generacioLectura, estat: 'llest', rol: rolDeLaPersona(llista, persona), ambFuncions });
      })
      .catch((e) => {
        if (encara()) setLectura({ clau, generacio: generacioLectura, estat: codiDe(e) === 'NO-DISPONIBLE' ? 'no-disponible' : 'error-lectura', rol: null, ambFuncions: false });
      });
    return () => controlador.abort();
  }, [clau, org, persona, entrada]);

  const lecturaVigent = lectura?.clau === clau && lectura.generacio === generacio ? lectura : null;
  const ambFuncions = lecturaVigent?.ambFuncions === true;
  const inclou = useCallback(async (rol) => {
    const encara = () => viu.current && abastRef.current.clau === clau
      && abastRef.current.generacio === generacio && entradaSessio() === entrada;
    if (!clau || ocupatRef.current || !encara() || !rolsQueEsPodenEscriure(ambFuncions).includes(rol)) return false;
    const sessio = capturaSessio();
    const opcio = { ...configRef.current };
    const operacio = {};
    ocupatRef.current = operacio;
    setAccio({ clau, generacio, ocupat: true, resultat: null, error: null });
    try {
      sessio();
      if (!encara()) return false;
      let rolNou = rol;
      if (ambFuncions) {
        /* El servidor torna el mateix rol o el port llança DESCONEGUT (seguiments.js). */
        await inclouPersonaEnEntitat({ orgId: org, personaId: persona, rol: ROL_DE_CONNEXIONS[rol] }, opcio);
      } else {
        const desat = await desaMembreOrganitzacio(org, { tipus: 'persona', id: persona, rol }, opcio);
        if (['member', 'admin'].includes(desat?.rol)) rolNou = desat.rol;
      }
      sessio();
      if (!encara()) return false;
      setLectura({ clau, generacio, estat: 'llest', rol: rolNou === 'admin' ? 'admin' : 'member', ambFuncions });
      setAccio({ clau, generacio, ocupat: false, resultat: RESULTAT[rolNou], error: null });
      return true;
    } catch (e) {
      if (encara()) setAccio(e?.name === 'AbortError' ? null : { clau, generacio, ocupat: false, resultat: null, error: { codi: codiDe(e) } });
      return false;
    } finally {
      if (ocupatRef.current === operacio) ocupatRef.current = null;
    }
  }, [clau, org, persona, ambFuncions, generacio, entrada]);

  const accioVigent = accio?.clau === clau && accio.generacio === generacio ? accio : null;
  const estat = !clau ? 'no-disponible' : (lecturaVigent?.estat ?? 'comprovant');
  return {
    estat,
    rolActual: estat === 'llest' ? lecturaVigent.rol : null,
    ambFuncions: estat === 'llest' && ambFuncions,
    ocupat: accioVigent?.ocupat === true,
    resultat: accioVigent?.resultat ?? null,
    error: accioVigent?.error ?? null,
    inclou
  };
}

export default useIncloureEnEntitat;
