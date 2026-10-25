/**
 * useTitularDeConnexio.js — La persona titular d'una entitat, a /connectar,
 * NOMÉS si ella ho ha triat (IDEA-22, punt 2 de la Directiva del Mestre,
 * àudios 01:14-01:16; pla 261025_0200).
 *
 *   · Per què: «si connectes amb una empresa i la persona propietària té el
 *     perfil públic, a la mateixa pantalla t'hi pots connectar també». Però
 *     el servidor no diu mai qui administra una entitat (2610250100,
 *     R-1 de l'informe 261025_0100): un perfil públic no és cap permís per a
 *     lligar-lo a un negoci. Per això la titular es mostra per una tria seua
 *     (titular_public, migració 2610250300): només la propietària (owner, mai
 *     una administradora ni qui ha publicat l'element), amb el perfil públic,
 *     sense la baixa demanada, d'una organització pública i sense cap
 *     bloqueig entre ella i qui mira. Ho decidix el servidor
 *     (loadTitularPublic, capacitat 'titularPublic'), mai el client: ni
 *     item.ownerUserId, ni `propietari`, ni created_by, ni quiEmSegueix.
 *   · Inert sense la capacitat (un port sense implementació, un mock), sense
 *     sessió o sense entitat: cap crida i `estat: 'inactiu'`, i la vista no
 *     en diu res (cap rastre que hi haja una titular). La lectura porta la
 *     seua clau (l'id de l'entitat): en canviar, la d'abans s'avorta
 *     (AbortController) i no es pinta. El patró de useFitxaDeConnexio, en un
 *     fitxer a banda (la prova d'aquell substituïx el port sencer).
 *
 * `orgId`: l'id de l'entitat (el del servidor en remot) o null.
 * Torna { estat: 'inactiu'|'carregant'|'llest'|'error', titular: { tipus: 'persona', id, nom, avatar } | null }.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { loadTitularPublic, teCapacitat } from '../../data/backendPort.js';
/* La forma del contracte, una sola còpia: cap correu ni cap rol arriba a la vista. */
import { titularDelContracte } from '../../data/contracte.js';

/* Un port sense la capacitat (o un mock) no ha de fer caure la vista. */
function capacitat(nom) {
  try { return teCapacitat(nom); } catch { return false; }
}

const INACTIU = Object.freeze({ estat: 'inactiu', titular: null });
const CARREGANT = Object.freeze({ estat: 'carregant', titular: null });

export function useTitularDeConnexio(orgId = null, { config = {}, teSessio = false } = {}) {
  const id = String(orgId ?? '').trim();
  const actiu = Boolean(id) && teSessio === true && capacitat('titularPublic');
  const clau = actiu ? id : null;
  /* { clau, estat, titular }: el resultat només val per a la clau que l'ha demanat. */
  const [desat, setDesat] = useState(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!clau) return undefined;
    let viu = true;
    const controlador = new AbortController();
    Promise.resolve()
      .then(() => loadTitularPublic(clau, { ...configRef.current, signal: controlador.signal }))
      .then((titular) => { if (viu) setDesat({ clau, estat: 'llest', titular: titularDelContracte(titular) }); })
      .catch(() => { if (viu) setDesat({ clau, estat: 'error', titular: null }); });
    return () => { viu = false; controlador.abort(); };
  }, [clau]);

  return useMemo(() => {
    if (!clau) return INACTIU;
    return desat?.clau === clau ? { estat: desat.estat, titular: desat.titular } : CARREGANT;
  }, [clau, desat]);
}

export default useTitularDeConnexio;
