import { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSession } from './SessionContext';
import { getDefaultUserId, getProfile, listMyOrganizations } from '../../data/backendPort';
import { getVal, setVal, delVal } from '../../config/storage';
import { firmaDePersona, mateixPerfil, perfilDeFila, personaDeSessio, pobleDeLaPertinenca } from './personaDeSessio.js';

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
 * rol, slug i kind (T43, ordre del Mestre del 260928) i, ampliat per l'ordre
 * del Mestre del 13-10-2026 (pla 261013_1405, front A), `poble`: el de la
 * persona o el town_name de la pertinença de l'entitat ('' si no en té).
 * Qui llig `actorKey` té la clau d'àmbit de les dades.
 *
 * Front A, pla 261013_1405 (ordre del Mestre 13-10-2026) · La persona es
 * pinta amb la seua fila de profiles (getProfile del port neutral, només amb
 * sessió); les metadades de GoTrue són la reserva i manen mentre la fila és
 * d'abans d'una edició (firma, personaDeSessio.js). L'entrada persona
 * d'`identitats` (el calaix i la boina de les apps) porta el mateix.
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

  /* Front A, pla 261013_1405 (ordre del Mestre 13-10-2026) · La fila de
     profiles de la persona, amb el mateix patró que les pertinences: només
     amb sessió (sense, cap crida al port: App.appsLocals.test.jsx, D3), i una
     resposta d'una sessió anterior no entra (viu i fila.id === userId). Es
     torna a llegir en cada entrada, renovació (generacio), refresh() i edició
     del perfil (firma). Un error, un null o la fila de reserva deixen l'estat
     com estava: la firma ja impedix que un perfil vell es pinte, i una
     renovació que falla no fa parpellejar la foto. Res es desa enlloc: en un
     ordinador compartit del poble (T47) el primer fotograma porta les
     inicials de les metadades. */
  const firma = firmaDePersona(currentUser);
  const [perfil, setPerfil] = useState(null);
  useEffect(() => {
    if (!userId) { setPerfil(null); return; }
    let viu = true;
    Promise.resolve()
      .then(() => getProfile(configRef.current))
      .then((fila) => {
        if (!viu) return;
        const nou = perfilDeFila(fila, userId, firma);
        if (nou) setPerfil((abans) => (mateixPerfil(abans, nou) ? abans : nou));
      })
      .catch(() => {});
    return () => { viu = false; };
  }, [userId, generacio, tick, firma]);

  const persona = useMemo(() => personaDeSessio(currentUser, perfil), [currentUser, perfil]);

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

  /* Front A (261013_1405) · `poble` a tots dos: el de la persona (perfil, o
     town_name de les metadades) i el de la pertinença de l'entitat, la mateixa
     font que autoriaNota.actorAmbPobleDeLEntitat. Sense sessió, null. */
  const actor = useMemo(() => {
    if (entitatActiva) {
      return {
        tipus: 'entitat', id: entitatActiva.id, nom: entitatActiva.name,
        avatar: entitatActiva.logo_url || null, rol: entitatActiva.role,
        slug: entitatActiva.slug, kind: entitatActiva.kind, poble: pobleDeLaPertinenca(entitatActiva)
      };
    }
    return {
      tipus: 'persona', id: defaultActorId, nom: persona ? persona.nom : null,
      avatar: persona ? persona.avatar : null, rol: currentUser ? 'persona' : 'convidat',
      slug: null, kind: null, poble: persona ? persona.poble : null
    };
  }, [entitatActiva, defaultActorId, currentUser, persona]);

  /* Identitats amb què es pot actuar: la persona i les organitzacions on mana.
     La persona, sempre la primera i amb el nom, la foto i el poble de l'actor. */
  const identitats = useMemo(() => {
    if (!userId || !persona) return CAP;
    return [
      { tipus: 'persona', id: userId, nom: persona.nom, avatar: persona.avatar, poble: persona.poble, rol: 'persona', activa: actorType === 'persona' },
      ...memberships.filter(potSignarPer).map((m) => ({
        tipus: 'entitat', id: m.id, nom: m.name, avatar: m.logo_url || null, poble: pobleDeLaPertinenca(m), rol: m.role, slug: m.slug, kind: m.kind,
        activa: actorType === 'entitat' && String(actorId) === String(m.id)
      }))
    ];
  }, [userId, persona, memberships, actorType, actorId]);

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
