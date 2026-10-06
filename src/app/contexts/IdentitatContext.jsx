import { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSession } from './SessionContext';
import { getDefaultUserId, listMyOrganizations } from '../../data/backendPort';
import { getVal, setVal, delVal } from '../../config/storage';

/**
 * IdentitatContext — amb quina identitat actua la persona.
 *
 * Una persona amb sessió pot actuar com ella mateixa («persona») o com una de
 * les organitzacions on mana («entitat»: empresa, grup o entitat). La tria és
 * una preferència que es recorda per compte (localStorage, clau per usuari) i
 * es valida sempre contra les pertinences reals: una preferència d'entitat
 * sense pertinença cau a «persona», mai a una identitat que no es té.
 *
 * Qui llig `actor` té tot el que cal per a signar: tipus, id, nom, avatar,
 * rol, slug i kind. Qui llig `actorKey` té la clau d'àmbit de les dades.
 */

const IdentitatContext = createContext(null);

/** Rols que poden signar publicacions en nom de l'organització. */
export const ROLS_QUE_SIGNEN = Object.freeze(['owner', 'admin']);
export const potSignarPer = (membership) => Boolean(membership) && ROLS_QUE_SIGNEN.includes(membership.role);

const CLAU_PREFERENCIA = 'actor-preference';
const clauPerUsuari = (userId) => `${CLAU_PREFERENCIA}:${userId}`;

export function llegixPreferencia(userId) {
  if (!userId) return null;
  const pref = getVal(clauPerUsuari(userId), null);
  return pref && typeof pref === 'object' && pref.type && pref.id ? pref : null;
}
export function desaPreferencia(userId, pref) {
  if (!userId) return;
  if (!pref || pref.type === 'persona') delVal(clauPerUsuari(userId));
  else setVal(clauPerUsuari(userId), pref);
}

const CAP = Object.freeze([]);

function nomDePersona(user) {
  const meta = user?.user_metadata || {};
  return meta.full_name || meta.name || user?.full_name || user?.email || 'El meu compte';
}
function avatarDePersona(user) {
  const meta = user?.user_metadata || {};
  return meta.avatar_url || meta.picture || user?.avatar_url || null;
}

export function IdentitatProvider({ children, config = {} }) {
  const { currentUser, generacio } = useSession();
  const userId = currentUser?.id || null;

  const [memberships, setMemberships] = useState(CAP);
  const [carregant, setCarregant] = useState(false);
  const [errorMemberships, setErrorMemberships] = useState(null);
  const [pref, setPref] = useState(() => llegixPreferencia(userId));

  /* `config` canvia d'identitat a cada render del pare; el patró del ref
     actual evita rellançar la càrrega per això. */
  const configRef = useRef(config);
  configRef.current = config;

  const getSafeDefaultUserId = useCallback(() => {
    try { return getDefaultUserId(configRef.current); } catch { return null; }
  }, []);

  /* En canviar de compte (o d'entrada), es rellig la preferència d'eixe compte. */
  useEffect(() => { setPref(llegixPreferencia(userId)); }, [userId, generacio]);

  /* Pertinences: només amb sessió. Una resposta d'una sessió anterior no entra. */
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);
  useEffect(() => {
    if (!userId) { setMemberships(CAP); setCarregant(false); setErrorMemberships(null); return; }
    let viu = true;
    setCarregant(true);
    setErrorMemberships(null);
    Promise.resolve()
      .then(() => listMyOrganizations(configRef.current))
      .then((rows) => {
        if (!viu) return;
        setMemberships(Array.isArray(rows) ? rows : CAP);
      })
      .catch((e) => {
        if (!viu) return;
        setMemberships(CAP);
        setErrorMemberships(e?.message || 'No s’han pogut carregar les organitzacions.');
      })
      .finally(() => { if (viu) setCarregant(false); });
    return () => { viu = false; };
  }, [userId, generacio, tick]);

  const defaultActorId = userId || getSafeDefaultUserId();

  /* La preferència d'entitat només val si la pertinença existix i pot signar. */
  const entitatActiva = useMemo(() => {
    if (!userId || pref?.type !== 'entitat' || !pref?.id) return null;
    const m = memberships.find((org) => String(org.id) === String(pref.id));
    return potSignarPer(m) ? m : null;
  }, [userId, pref, memberships]);

  const actorType = entitatActiva ? 'entitat' : 'persona';
  const actorId = entitatActiva ? entitatActiva.id : defaultActorId;
  const actorKey = `${actorType}::${actorId}`;

  const actor = useMemo(() => {
    if (entitatActiva) {
      return {
        tipus: 'entitat', id: entitatActiva.id, nom: entitatActiva.name,
        avatar: entitatActiva.logo_url || null, rol: entitatActiva.role,
        slug: entitatActiva.slug, kind: entitatActiva.kind
      };
    }
    return {
      tipus: 'persona', id: defaultActorId, nom: currentUser ? nomDePersona(currentUser) : null,
      avatar: currentUser ? avatarDePersona(currentUser) : null, rol: currentUser ? 'persona' : 'convidat',
      slug: null, kind: null
    };
  }, [entitatActiva, defaultActorId, currentUser]);

  /* Identitats amb què es pot actuar: la persona i les organitzacions on mana. */
  const identitats = useMemo(() => {
    if (!userId) return CAP;
    return [
      { tipus: 'persona', id: userId, nom: nomDePersona(currentUser), avatar: avatarDePersona(currentUser), rol: 'persona', activa: actorType === 'persona' },
      ...memberships.filter(potSignarPer).map((m) => ({
        tipus: 'entitat', id: m.id, nom: m.name, avatar: m.logo_url || null, rol: m.role, slug: m.slug, kind: m.kind,
        activa: actorType === 'entitat' && String(actorId) === String(m.id)
      }))
    ];
  }, [userId, currentUser, memberships, actorType, actorId]);

  /** Tria la identitat activa. Torna true si s'ha aplicat; false si no es pot. */
  const setActor = useCallback((type, id) => {
    if (!userId) return false;
    if (type === 'persona') {
      setPref(null);
      desaPreferencia(userId, null);
      return true;
    }
    if (type !== 'entitat' || !id) return false;
    const m = memberships.find((org) => String(org.id) === String(id));
    if (!potSignarPer(m)) return false;
    const nova = { type: 'entitat', id: m.id };
    setPref(nova);
    desaPreferencia(userId, nova);
    return true;
  }, [userId, memberships]);

  const value = useMemo(() => ({
    actorType,
    actorId,
    actorKey,
    actor,
    identitats,
    memberships,
    carregant,
    error: errorMemberships,
    refresh,
    setActor
  }), [actorType, actorId, actorKey, actor, identitats, memberships, carregant, errorMemberships, refresh, setActor]);

  return (
    <IdentitatContext.Provider value={value}>
      {children}
    </IdentitatContext.Provider>
  );
}

export function useIdentitat() {
  const context = useContext(IdentitatContext);
  if (!context) throw new Error('useIdentitat ha de ser usat dins de IdentitatProvider');
  return context;
}

/**
 * La identitat si n'hi ha proveïdor, o null (una peça muntada sola: proves,
 * catàleg). Només lectura: la font del pont de sessió de les apps
 * (plataforma/fontSessio.js, ordre del Mestre del 261006) en llig l'actor
 * actiu per a la marca.
 */
export function useIdentitatOpcional() {
  return useContext(IdentitatContext);
}
