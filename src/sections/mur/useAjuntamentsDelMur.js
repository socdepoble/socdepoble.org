/**
 * useAjuntamentsDelMur.js — T3.3 (marató nocturna 261101, carril B3) · Quines
 * de les entitats que signen una alerta del Mur són un ajuntament.
 *
 * La publicació no porta el tipus de l'entitat que la signa: només el seu id
 * (author_org_id, la columna que valida el servidor). El tipus el diu el
 * directori públic de les organitzacions, la capacitat OPCIONAL
 * 'directoriEntitats' del port (listPublicOrganizations, contracte.js): cap
 * petició nova al contracte. Un ajuntament és una fila amb kind 'city_hall'
 * (2609080000; només es crea o es reclama amb la revisió de la
 * superadministració, 2609281500 i 2610311500).
 *
 * Fail-closed: mentre no hi ha resposta, sense la capacitat, amb un error o
 * si l'entitat no és al directori (sostre LIMIT_DIRECTORI_ENTITATS), cap
 * entitat és un ajuntament i el Mur no pinta cap distintiu.
 *
 * Només pregunta si cal: amb `candidats` buit (cap publicació amb etiqueta
 * d'alerta signada per una entitat; alertesMunicipals.js · candidatsAAlerta)
 * no hi ha cap petició, i el Mur de sempre no en fa cap de nova. Torna a
 * preguntar quan canvien els candidats (una alerta nova d'una altra entitat)
 * o l'abast del backend; entretant conserva la resposta del mateix abast.
 *
 * Torna { estat, esAjuntament }: estat 'sense-candidats' | 'no-disponible' |
 * 'loading' | 'ready' | 'error'; esAjuntament(id) → booleà, estable mentre
 * la resposta no canvia.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { listPublicOrganizations } from '../../data/backendPort.js';
import { LIMIT_DIRECTORI_ENTITATS } from '../../data/contracte.js';
/* Gauntlet 2 · 261101 (G2-B3-04, Pedra Seca) · La capacitat sense llançar,
   l'abast del backend i la configuració de l'App són les de la pestanya
   «Empreses i entitats» (useEntitatsDelPoble.js), la mateixa capacitat
   'directoriEntitats': una sola còpia. */
import { abastDe, teDirectori, useConfigDeLApp } from '../pobles/useEntitatsDelPoble.js';

/** El `kind` d'un ajuntament a les files del directori. */
export const KIND_AJUNTAMENT = 'city_hall';

const CAP = Object.freeze(new Set());
const CAP_AJUNTAMENT = () => false;

/** Els ids (text) de les files del directori que són un ajuntament. Una resposta que no és una llista, cap. */
export function ajuntamentsDeLesFiles(files) {
  if (!Array.isArray(files)) return CAP;
  const ids = new Set();
  for (const fila of files) {
    if (fila && typeof fila === 'object' && fila.kind === KIND_AJUNTAMENT && fila.id != null && fila.id !== '') ids.add(String(fila.id));
  }
  return ids.size ? ids : CAP;
}

/** Quines entitats de `candidats` (ids, alertesMunicipals.js · candidatsAAlerta) són un ajuntament. */
export function useAjuntamentsDelMur(candidats) {
  const config = useConfigDeLApp() || {};
  /* La configuració canvia d'identitat a cada render: es llig d'un ref, i
     l'abast (backend, poble i mode) és el que decidix si cal tornar a demanar. */
  const configRef = useRef(config);
  configRef.current = config;
  const abast = abastDe(config);
  const ambDirectori = teDirectori();
  const llista = Array.isArray(candidats) ? candidats.map(String) : [];
  const clau = ambDirectori && llista.length ? JSON.stringify([abast, ...llista]) : null;
  const [resposta, setResposta] = useState({ abast: null, clau: null, ajuntaments: CAP, error: null });

  useEffect(() => {
    if (!clau) return undefined;
    const control = new AbortController();
    /* Dins del then: un port sense el mètode llança de manera síncrona. */
    Promise.resolve()
      .then(() => listPublicOrganizations({ limit: LIMIT_DIRECTORI_ENTITATS, signal: control.signal }, configRef.current))
      .then((files) => {
        if (!control.signal.aborted) setResposta({ abast, clau, ajuntaments: ajuntamentsDeLesFiles(files), error: null });
      })
      .catch((error) => {
        if (control.signal.aborted || error?.name === 'AbortError') return;
        setResposta({ abast, clau, ajuntaments: CAP, error });
      });
    return () => control.abort();
  }, [clau, abast]);

  /* La resposta d'un altre abast (un altre backend o poble) no val ni un sol pintat. */
  const ajuntaments = clau && resposta.abast === abast ? resposta.ajuntaments : CAP;
  const estat = !llista.length ? 'sense-candidats'
    : !ambDirectori ? 'no-disponible'
      : resposta.clau !== clau ? 'loading'
        : resposta.error ? 'error' : 'ready';
  const esAjuntament = useMemo(
    () => (ajuntaments.size ? (id) => ajuntaments.has(String(id)) : CAP_AJUNTAMENT),
    [ajuntaments]
  );
  return useMemo(() => ({ estat, esAjuntament }), [estat, esAjuntament]);
}
