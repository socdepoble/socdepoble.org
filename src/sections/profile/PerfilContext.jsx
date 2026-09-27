import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  getCurrentUser, listMyOrganizations, updateOrganization, updateProfile,
  updateUserPassword, getProfile, teCapacitat, uploadToStorage,
  listMyAgents, updateAgent,
} from '../../data/backendPort.js';
import { creaOrganitzacio as creaOrganitzacioAlServei } from '../../data/organizations.js';

import { useSession } from '../../app/contexts/SessionContext.jsx';
import { capturaSessio, entradaSessio } from '../../data/identitat.js';

const PerfilContext = createContext(null);

/* La capacitat 'agents' és nova al port: un backend (o un mock de proves) que
   no la declare no ha de fer caure el perfil ni en llegir-ne el nom. */
function agentsDelPort() {
  try { return typeof listMyAgents === 'function' ? listMyAgents : null; } catch { return null; }
}

export function usePerfil() {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error('usePerfil fora de PerfilProvider');
  return ctx;
}

/* ═══════════════════════════════════════════════════════════════════
   CATÀLEG D'AJUSTOS

   Cada fila declara si està oberta i, si no ho està, per què. La
   interfície no pot prometre res que el contracte del servidor no
   complisca: un botó que fa `permission denied` en silenci és pitjor
   que una fila desactivada amb el motiu escrit.

   `tipus` diu QUIN giny pinta DetallAjust ('text' | 'area' |
   'password' | 'imatge' | 'boolean' | 'accio'). La UI mai més
   endevina per l'id: afegir un ajust nou no requereix tocar DetallAjust.

   `pendent` (només accions) = el backend encara no la té: es pinta
   desactivada i honesta, mai prometuda.

   `lloc` diu on viu l'ajust: 'fitxa' (el pinta l'Editor Universal de
   PerfilEditor) o 'compte' (formularis de DetallCompte).
   ═══════════════════════════════════════════════════════════════════ */

export function ajustosPersona(perfil = {}) {
  return [
    { id: 'nom', lloc: 'fitxa', titol: 'Nom', camp: 'full_name', tipus: 'text', valor: perfil.full_name || '', obert: true },
    { id: 'avatar', lloc: 'fitxa', titol: 'Foto de perfil', camp: 'avatar_url', tipus: 'imatge', valor: perfil.avatar_url || '', obert: true },
    { id: 'correu', lloc: 'compte', titol: 'Correu electrònic', tipus: 'text', valor: perfil.email || '', obert: false,
      motiu: 'El correu identifica el compte. Es canvia des d’Accedir.' },
    /* Amb una baixa en curs el servidor té el perfil congelat (política
       «profiles sense baixa»), com la fitxa: cap desat arribaria. */
    { id: 'privacitat', lloc: 'compte', titol: 'Estat del perfil', camp: 'is_public', tipus: 'boolean',
      casella: 'Perfil públic',
      valor: Boolean(perfil.is_public), obert: !perfil.baixa_demanada_at,
      motiu: perfil.baixa_demanada_at
        ? 'Tens una baixa en curs: el perfil està congelat. Es desfà cancel·lant-la a «Privacitat i dades».'
        : 'Tria si vols ser visible a la gent del poble o mantindre el compte privat.' },
    { id: 'contrasenya', lloc: 'compte', titol: 'Contrasenya', tipus: 'password', valor: '******', obert: true },
    { id: 'sessio', lloc: 'compte', titol: 'Tancar sessió', tipus: 'accio', accio: 'logout', obert: true },
  ];
}

export function ajustosOrganitzacio(org = {}) {
  const mana = org.role === 'owner' || org.role === 'admin';
  const tancat = 'Només qui administra aquesta organització ho pot canviar.';
  return [
    { id: 'nom', lloc: 'fitxa', titol: 'Nom', camp: 'name', tipus: 'text', valor: org.name || '', obert: mana, motiu: tancat },
    { id: 'avatar', lloc: 'fitxa', titol: 'Foto / Logotip', camp: 'logo_url', tipus: 'imatge', valor: org.logo_url || '', obert: mana, motiu: tancat },
    { id: 'lema', lloc: 'fitxa', titol: 'Lema', camp: 'lema', tipus: 'text', valor: org.lema || '', obert: mana, motiu: tancat },
    { id: 'descripcio', lloc: 'fitxa', titol: 'Descripció', camp: 'description', tipus: 'area', valor: org.description || '', obert: mana, motiu: tancat },
    { id: 'membres', lloc: 'compte', titol: 'Membres', tipus: 'accio', accio: 'membres', pendent: true, obert: mana, motiu: tancat },
    { id: 'identificador', lloc: 'compte', titol: 'Identificador', tipus: 'text', valor: org.slug || '', obert: false,
      motiu: 'L’identificador és permanent: hi ha enllaços publicats que hi apunten.' },
    /* Pendent fins a I7: hui la ruta pública no troba cap organització real. */
    { id: 'fitxa', lloc: 'compte', titol: 'Fitxa pública', tipus: 'accio', accio: 'obrir-fitxa', pendent: true,
      valor: `/${org.kind === 'group' ? 'grup' : 'empresa'}/${org.slug}`, obert: true },
    { id: 'eixir', lloc: 'compte', titol: 'Eixir de l’organització', tipus: 'accio', accio: 'eixir', pendent: true,
      obert: org.role !== 'owner',
      motiu: 'Qui és propietari no pot eixir-se’n: primer ha de traspassar la propietat.' },
  ];
}

/**
 * `onCanviOrganitzacions` s'avisa quan es crea o es modifica una
 * organització: PerfilShell hi passa el refresh d'IdentitatContext perquè
 * el selector d'identitat no quede desfasat fins a recarregar.
 */
export function PerfilProvider({ children, config = {}, onCanviOrganitzacions }) {
  /* L'àmbit és l'ENTRADA, no la generació del servei: la renovació horària del JWT
     mou la generació però és la mateixa sessió, i desmuntar ací perdria el que
     s'estava escrivint a la fitxa. useSession fa que es torne a calcular. */
  const { currentUser } = useSession();
  const scope = JSON.stringify([currentUser?.id, entradaSessio(), config.tenantId,
    config.backendId, config.supabaseUrl, config.supabaseAnonKey, config.auth?.issuer]);
  return (
    <PerfilScope key={scope} config={config} onCanviOrganitzacions={onCanviOrganitzacions}>
      {children}
    </PerfilScope>
  );
}

function PerfilScope({ children, config, onCanviOrganitzacions }) {
  /* capturaSessio: eixir, tornar a entrar o canviar de compte avorten; renovar, no. */
  const [owner] = useState(capturaSessio);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const assertCurrent = useCallback(() => {
    if (!mounted.current) throw new DOMException('La sessió del perfil ha canviat.', 'AbortError');
    owner();
  }, [owner]);
  const [usuari, setUsuari] = useState(null);
  const [dadesPerfil, setDadesPerfil] = useState(null);
  const [organitzacions, setOrganitzacions] = useState([]);
  /* Lògica d'Usuari (T4): els agents IA que la persona administra (la IAIA). */
  const [agents, setAgents] = useState([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState(null);

  /* `config` canvia d'identitat a cada render del pare. El patró del
     "ref actual" ens deixa usar-la dins dels callbacks sense fer-los
     inestables. */
  const configRef = useRef(config);
  configRef.current = config;
  const avisaRef = useRef(onCanviOrganitzacions);
  avisaRef.current = onCanviOrganitzacions;
  const avisaOrganitzacions = useCallback(() => {
    try { avisaRef.current?.(); } catch (e) { console.warn('[PerfilContext] Avís d’organitzacions:', e); }
  }, []);

  /* `recarrega` torna a llegir perfil i organitzacions sense tornar a la
     pantalla de càrrega (p. ex. després de cancel·lar una baixa, quan el
     servidor ha restaurat el perfil). */
  const [versioDades, setVersioDades] = useState(0);
  const recarrega = useCallback(() => setVersioDades((v) => v + 1), []);

  // Cada scope té estat propi: el pare el desmunta en canviar sessió o backend.
  useEffect(() => {
    let viu = true;
    setUsuari(getCurrentUser());

    /* Els agents són una capacitat opcional: sense ella, cap crida i cap grup.
       Una fallada seua no tomba el perfil (llista buida i avís a la consola). */
    const llistaAgentsDelPort = agentsDelPort();
    const agentsPromesa = llistaAgentsDelPort && teCapacitat('agents')
      ? Promise.resolve().then(() => llistaAgentsDelPort(configRef.current)).catch((e) => {
        console.warn('[PerfilContext] Agents IA no disponibles:', e?.message);
        return [];
      })
      : Promise.resolve([]);
    Promise.all([
      listMyOrganizations(configRef.current),
      getProfile(configRef.current),
      agentsPromesa,
    ])
      .then(([orgs, perfil, llistaAgents]) => {
        if (!viu) return;
        assertCurrent();
        setOrganitzacions(Array.isArray(orgs) ? orgs : []);
        setAgents(Array.isArray(llistaAgents) ? llistaAgents : []);
        setDadesPerfil(perfil);
        setError(null);
      })
      .catch((e) => {
        if (viu) setError(e?.message || "No s'han pogut carregar les dades del perfil.");
      })
      .finally(() => {
        if (viu) setCarregant(false);
      });

    return () => { viu = false; };
  }, [assertCurrent, versioDades]);

  /* La fila de `profiles` no porta el correu: el pren de la sessió perquè
     «El compte» el puga mostrar. */
  const dadesPersona = useMemo(() => (
    dadesPerfil && !dadesPerfil.email && usuari?.email ? { ...dadesPerfil, email: usuari.email } : dadesPerfil
  ), [dadesPerfil, usuari]);

  const identitats = useMemo(() => ([
    {
      id: 'jo',
      mena: 'persona',
      nom: dadesPerfil?.full_name || usuari?.user_metadata?.name || usuari?.user_metadata?.full_name || 'El meu compte',
      avatar: dadesPerfil?.avatar_url || usuari?.user_metadata?.avatar_url,
      rol: 'Persona',
      dades: dadesPersona,
    },
    ...organitzacions.map((o) => ({
      id: o.id,
      mena: o.kind === 'group' ? 'grup' : 'empresa',
      nom: o.name,
      avatar: o.logo_url,
      rol: o.role === 'owner' ? 'Propietari' : o.role === 'admin' ? 'Administra' : 'Membre',
      dades: o,
    })),
    ...agents.map((a) => ({
      id: a.id,
      mena: 'agent',
      nom: a.name,
      avatar: a.avatar_url,
      rol: 'Agent IA',
      dades: a,
    })),
  ]), [usuari, organitzacions, agents, dadesPerfil, dadesPersona]);

  /* ⚰️ ELIMINAT (auditoria): identitatId, ajustId, triaIdentitat,
     triaAjust, identitat, ajustos i ajust. Era el sistema de navegació
     paral·lel que la plantilla ja havia substituït però seguia viu i
     descrivint-se com a vigent — i va fer que guardarAjust escriguera
     a la identitat equivocada. La selecció viu al Manager; este context
     només dóna DADES i ACCIONS. */

  const guardarCampPerfil = useCallback(async (camp, valor, identitatObjectiuId) => {
    assertCurrent();
    if (identitatObjectiuId == null) {
      throw new Error('guardarCampPerfil: falta la identitat objectiu (tercer paràmetre, OBLIGATORI).');
    }
    const objectiu = identitats.find((item) => item.id === identitatObjectiuId);
    if (!objectiu) {
      throw new Error(`Identitat desconeguda: ${String(identitatObjectiuId)}`);
    }

    if (objectiu.mena === 'persona') {
      const rebudes = await updateProfile({ [camp]: valor }, configRef.current);
      assertCurrent();
      setDadesPerfil((prev) => ({ ...(prev || {}), ...(rebudes || {}), [camp]: valor }));
      setUsuari((prev) => ({
        ...(prev || {}),
        user_metadata: {
          ...(prev?.user_metadata || {}),
          [camp]: valor,
          name: rebudes?.full_name || prev?.user_metadata?.name,
        },
      }));
    } else if (objectiu.mena === 'agent') {
      const novesDades = await updateAgent(objectiu.id, { [camp]: valor }, configRef.current);
      assertCurrent();
      setAgents((prev) =>
        prev.map((a) => (a.id === objectiu.id ? { ...a, ...(novesDades || {}), [camp]: valor } : a)),
      );
    } else {
      const novesDades = await updateOrganization(objectiu.id, { [camp]: valor }, configRef.current);
      assertCurrent();
      setOrganitzacions((prev) =>
        prev.map((o) => (o.id === objectiu.id ? { ...o, ...(novesDades || {}), [camp]: valor } : o)),
      );
      avisaOrganitzacions();
    }
  }, [identitats, assertCurrent, avisaOrganitzacions]);

  /* Signatura TRENCADORA a propòsit: guardarAjust(identitat, ajust, valor). */
  const guardarAjust = useCallback(async (identitatObjectiuId, ajustId, valor) => {
    assertCurrent();
    const objectiu = identitats.find((i) => i.id === identitatObjectiuId);
    if (!objectiu) throw new Error(`Identitat desconeguda: ${String(identitatObjectiuId)}`);

    if (objectiu.mena === 'agent') throw new Error('Un agent IA només té fitxa: s’edita des de «La fitxa».');
    const cataleg =
      objectiu.mena === 'persona'
        ? ajustosPersona(objectiu.dades || {})
        : ajustosOrganitzacio(objectiu.dades || {});
    const ajust = cataleg.find((a) => a.id === ajustId);
    if (!ajust) throw new Error(`Ajust desconegut: ${String(ajustId)}`);
    if (!ajust.obert) throw new Error(ajust.motiu || 'Aquest ajust no es pot modificar.');
    if (ajust.tipus === 'accio') throw new Error("Les accions s'executen: no es desen.");

    if (objectiu.mena === 'persona' && ajust.id === 'contrasenya') {
      await updateUserPassword(valor, configRef.current);
      assertCurrent();
      return;
    }
    if (!ajust.camp) {
      throw new Error(`L'ajust "${ajust.id}" no té camp associat al catàleg.`);
    }
    await guardarCampPerfil(ajust.camp, valor, objectiu.id);
  }, [identitats, guardarCampPerfil, assertCurrent]);

  const creaOrganitzacio = useCallback(async (dades) => {
    assertCurrent();
    const creada = await creaOrganitzacioAlServei(dades, configRef.current, organitzacions);
    assertCurrent();
    /* El servidor pot tornar l'entitat existent en un reintent. Conservem
       el seu rol i una sola fila, sense convertir qui administra en propietari. */
    const anterior = organitzacions.find((org) => org.id === creada.id);
    const nova = { ...anterior, ...creada, role: creada.role || anterior?.role || 'owner' };
    setOrganitzacions((prev) => prev.some((org) => org.id === nova.id)
      ? prev.map((org) => org.id === nova.id ? { ...org, ...nova } : org)
      : [...prev, nova]);
    avisaOrganitzacions();
    return nova;
  }, [assertCurrent, avisaOrganitzacions, organitzacions]);

  const pujaMitja = useCallback(async (fitxer, carpeta = 'avatars') => {
    assertCurrent();
    if (!teCapacitat('mitjans')) return null;
    const res = await uploadToStorage(fitxer, { carpeta }, configRef.current);
    assertCurrent();
    return res.url;
  }, [assertCurrent]);

  /* Valor memoitzat + callbacks estables: els consumidors (i els
     useCallback que en depenguin) només es mouen quan canvien DADES,
     no quan canvia la identitat d'una funció. */
  const valor = useMemo(() => ({
    usuari, identitats, carregant, error,
    guardarCampPerfil, guardarAjust, creaOrganitzacio, pujaMitja, recarrega,
  }), [usuari, identitats, carregant, error, guardarCampPerfil, guardarAjust, creaOrganitzacio, pujaMitja, recarrega]);

  return <PerfilContext.Provider value={valor}>{children}</PerfilContext.Provider>;
}
