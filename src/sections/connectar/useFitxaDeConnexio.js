/**
 * useFitxaDeConnexio.js — La fitxa pública de confiança de qui es connecta
 * des d'un perfil (/gent/:id, /empresa/:id, /grup/:id → Connectar) o de
 * l'organització de ?organitzacio=ID (IDEA-14, Directiva del Mestre,
 * 261024; auditoria Gemini G-04).
 *
 *   · Per què: useOriginalDeConnexio no resol mai un perfil (sectionId
 *     'perfil'), i sense element resolt la vista no oferia cap relació amb
 *     la persona o l'entitat. El nom i l'id de la relació i de «Formar part»
 *     són els d'esta fitxa (loadPerfilPublic, capacitat 'directori'), mai
 *     l'item_id, el title ni l'author de l'URL: la query només diu QUINA
 *     fitxa es demana (T71b, T43b-3).
 *   · Tipus: una persona només és una fitxa de persona, i una entitat o un
 *     grup, una d'organització. Una URL que demana `objecte=persona` amb l'id
 *     d'una entitat no en fa cap persona: no hi ha fitxa.
 *   · Inert sense la capacitat (un port sense implementació, un mock): cap
 *     crida i `estat: 'inactiu'`. La lectura porta la seua clau (tipus + id):
 *     en canviar, la d'abans s'avorta (AbortController) i no es pinta.
 *   · P1-15 del Llibre (auditoria Port Neutral 261025) · La clau és l'àmbit
 *     sencer: el backend, la persona que mira (`usuariId`), el tipus i l'id.
 *     La fitxa depén de qui mira (en llavor, loadPerfilPublic amb la persona
 *     de la sessió; en remot, l'RLS del JWT): un canvi de persona sense cap
 *     pintat entremig continuava pintant la fitxa llegida per a l'altra.
 *
 * `peticio`: { id, tipus: 'persona'|'entitat'|'grup' } o null.
 * Torna { estat: 'inactiu'|'carregant'|'llest'|'error', perfil: PerfilPublic|null }.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { loadPerfilPublic, teCapacitat } from '../../data/backendPort.js';
import { backendScope } from '../../config/backendConfig.js';

/* Un port sense la capacitat (o un mock) no ha de fer caure la vista. */
function capacitat(nom) {
  try { return teCapacitat(nom); } catch { return false; }
}

/* La clau del backend, com la dels proveïdors (useScopedResource). Una
   configuració que no es deixa llegir és un àmbit més, mai una excepció en pintar. */
function ambitDelBackend(config) {
  try { return backendScope(config); } catch { return 'backend:invàlid'; }
}

const ORGANITZACIO = Object.freeze(['entitat', 'grup']);
const TIPUS_ACCEPTATS = Object.freeze({ persona: Object.freeze(['persona']), entitat: ORGANITZACIO, grup: ORGANITZACIO });

/** La fitxa, si és del tipus demanat i porta id i nom; si no, null. */
export function fitxaDelTipus(perfil, tipus) {
  const acceptats = Object.hasOwn(TIPUS_ACCEPTATS, tipus) ? TIPUS_ACCEPTATS[tipus] : null;
  if (!acceptats || !perfil || typeof perfil !== 'object' || !acceptats.includes(perfil.tipus)) return null;
  const id = typeof perfil.id === 'string' || typeof perfil.id === 'number' ? String(perfil.id).trim() : '';
  const nom = typeof perfil.nom === 'string' ? perfil.nom.trim() : '';
  return id && nom ? perfil : null;
}

const INACTIU = Object.freeze({ estat: 'inactiu', perfil: null });
const CARREGANT = Object.freeze({ estat: 'carregant', perfil: null });

export function useFitxaDeConnexio(peticio = null, { config = {}, usuariId = null } = {}) {
  const id = String(peticio?.id ?? '').trim();
  const tipus = Object.hasOwn(TIPUS_ACCEPTATS, peticio?.tipus) ? peticio.tipus : '';
  const actiu = Boolean(id && tipus) && capacitat('directori');
  const clau = actiu ? JSON.stringify([ambitDelBackend(config), usuariId == null ? null : String(usuariId), tipus, id]) : null;
  /* { clau, estat, perfil }: el resultat només val per a la clau que l'ha demanat. */
  const [desat, setDesat] = useState(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!clau) return undefined;
    let viu = true;
    const controlador = new AbortController();
    Promise.resolve()
      .then(() => loadPerfilPublic(id, { ...configRef.current, signal: controlador.signal }))
      .then((perfil) => { if (viu) setDesat({ clau, estat: 'llest', perfil: fitxaDelTipus(perfil, tipus) }); })
      .catch(() => { if (viu) setDesat({ clau, estat: 'error', perfil: null }); });
    return () => { viu = false; controlador.abort(); };
  }, [clau, id, tipus]);

  /* Un valor estable mentre no canvia: la vista en deriva el contacte (useMemo). */
  return useMemo(() => {
    if (!clau) return INACTIU;
    return desat?.clau === clau ? { estat: desat.estat, perfil: desat.perfil } : CARREGANT;
  }, [clau, desat]);
}

export default useFitxaDeConnexio;
