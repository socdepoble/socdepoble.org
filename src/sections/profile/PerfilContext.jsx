import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  getCurrentUser, listMyOrganizations, updateOrganization, updateProfile,
  updateUserPassword, getProfile, createOrganization, teCapacitat, uploadToStorage,
} from '../../data/backendPort.js';

import { useSession } from '../../app/contexts/SessionContext.jsx';
import { versioSessio } from '../../data/identitat.js';

const PerfilContext = createContext(null);

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
   ═══════════════════════════════════════════════════════════════════ */

export function ajustosPersona(perfil = {}) {
  return [
    { id: 'nom', titol: 'Nom', camp: 'full_name', tipus: 'text', valor: perfil.full_name || '', obert: true },
    { id: 'avatar', titol: 'Foto de perfil', camp: 'avatar_url', tipus: 'imatge', valor: perfil.avatar_url || '', obert: true },
    { id: 'correu', titol: 'Correu electrònic', tipus: 'text', valor: perfil.email || '', obert: false,
      motiu: 'El correu identifica el compte. Es canvia des d’Accedir.' },
    { id: 'privacitat', titol: 'Estat del perfil', camp: 'is_public', tipus: 'boolean',
      valor: Boolean(perfil.is_public), obert: true,
      motiu: 'Tria si vols ser visible a la gent del poble o mantindre el compte privat.' },
    { id: 'contrasenya', titol: 'Contrasenya', tipus: 'password', valor: '******', obert: true },
    { id: 'sessio', titol: 'Tancar sessió', tipus: 'accio', accio: 'logout', obert: true },
  ];
}

export function ajustosOrganitzacio(org = {}) {
  const mana = org.role === 'owner' || org.role === 'admin';
  const tancat = 'Només qui administra aquesta organització ho pot canviar.';
  return [
    { id: 'nom', titol: 'Nom', camp: 'name', tipus: 'text', valor: org.name || '', obert: mana, motiu: tancat },
    { id: 'avatar', titol: 'Foto / Logotip', camp: 'logo_url', tipus: 'imatge', valor: org.logo_url || '', obert: mana, motiu: tancat },
    { id: 'lema', titol: 'Lema', camp: 'lema', tipus: 'text', valor: org.lema || '', obert: mana, motiu: tancat },
    { id: 'descripcio', titol: 'Descripció', camp: 'description', tipus: 'area', valor: org.description || '', obert: mana, motiu: tancat },
    { id: 'membres', titol: 'Membres', tipus: 'accio', accio: 'membres', pendent: true, obert: mana, motiu: tancat },
    { id: 'identificador', titol: 'Identificador', tipus: 'text', valor: org.slug || '', obert: false,
      motiu: 'L’identificador és permanent: hi ha enllaços publicats que hi apunten.' },
    { id: 'fitxa', titol: 'Fitxa pública', tipus: 'accio', accio: 'obrir-fitxa',
      valor: `/${org.kind === 'group' ? 'grup' : 'empresa'}/${org.slug}`, obert: true },
    { id: 'eixir', titol: 'Eixir de l’organització', tipus: 'accio', accio: 'eixir', pendent: true,
      obert: org.role !== 'owner',
      motiu: 'Qui és propietari no pot eixir-se’n: primer ha de traspassar la propietat.' },
  ];
}

export function PerfilProvider({ children, config = {} }) {
  const { currentUser, generacio } = useSession();
  const scope = JSON.stringify([currentUser?.id, generacio, config.tenantId,
    config.backendId, config.supabaseUrl, config.supabaseAnonKey, config.auth?.issuer]);
  return <PerfilScope key={scope} config={config}>{children}</PerfilScope>;
}

function PerfilScope({ children, config }) {
  const owner = useRef({ id: getCurrentUser()?.id, epoch: versioSessio });
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const assertCurrent = useCallback(() => {
    if (!mounted.current || owner.current.epoch !== versioSessio || owner.current.id !== getCurrentUser()?.id) {
      throw new DOMException('La sessió del perfil ha canviat.', 'AbortError');
    }
  }, []);
  const [usuari, setUsuari] = useState(null);
  const [dadesPerfil, setDadesPerfil] = useState(null);
  const [organitzacions, setOrganitzacions] = useState([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState(null);

  /* `config` canvia d'identitat a cada render del pare. El patró del
     "ref actual" ens deixa usar-la dins dels callbacks sense fer-los
     inestables. */
  const configRef = useRef(config);
  configRef.current = config;

  // Cada scope té estat propi: el pare el desmunta en canviar sessió o backend.
  useEffect(() => {
    let viu = true;
    setUsuari(getCurrentUser());

    Promise.all([
      listMyOrganizations(configRef.current),
      getProfile(configRef.current),
    ])
      .then(([orgs, perfil]) => {
        if (!viu) return;
        assertCurrent();
        setOrganitzacions(Array.isArray(orgs) ? orgs : []);
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
  }, [assertCurrent]);

  const identitats = useMemo(() => ([
    {
      id: 'jo',
      mena: 'persona',
      nom: dadesPerfil?.full_name || usuari?.user_metadata?.name || usuari?.user_metadata?.full_name || 'El meu compte',
      avatar: dadesPerfil?.avatar_url || usuari?.user_metadata?.avatar_url,
      rol: 'Persona',
      dades: dadesPerfil,
    },
    ...organitzacions.map((o) => ({
      id: o.id,
      mena: o.kind === 'group' ? 'grup' : 'empresa',
      nom: o.name,
      avatar: o.logo_url,
      rol: o.role === 'owner' ? 'Propietari' : o.role === 'admin' ? 'Administra' : 'Membre',
      dades: o,
    })),
  ]), [usuari, organitzacions, dadesPerfil]);

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
    } else {
      const novesDades = await updateOrganization(objectiu.id, { [camp]: valor }, configRef.current);
      assertCurrent();
      setOrganitzacions((prev) =>
        prev.map((o) => (o.id === objectiu.id ? { ...o, ...(novesDades || {}), [camp]: valor } : o)),
      );
    }
  }, [identitats, assertCurrent]);

  /* Signatura TRENCADORA a propòsit: guardarAjust(identitat, ajust, valor). */
  const guardarAjust = useCallback(async (identitatObjectiuId, ajustId, valor) => {
    assertCurrent();
    const objectiu = identitats.find((i) => i.id === identitatObjectiuId);
    if (!objectiu) throw new Error(`Identitat desconeguda: ${String(identitatObjectiuId)}`);

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
    const input = dades ?? {};
    const name = typeof input.name === 'string'
      ? input.name.trim()
      : 'Organització nova';
    const kind = input.kind ?? 'company';
    const slug = typeof input.slug === 'string' && input.slug.trim()
      ? input.slug.trim().toLowerCase()
      : `org-${crypto.randomUUID()}`;

    if (
      name.length < 2 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      throw new Error('Nom o identificador invàlid.');
    }

    const payload = { ...input, name, kind, slug };
    
    const nova = await createOrganization(
      payload,
      configRef.current,
    );
    assertCurrent();
    // Assumim rol propietari immediatament per desbloquejar els ajustos locals sense necessitar recarrega
    nova.role = 'owner';
    setOrganitzacions((prev) => [...prev, nova]);
    /* La nova identitat apareixerà sola als facets (identitats canvia).
       Seleccionar-la per programació requereix que el Manager expose
       una acció de selecció: pendent del contracte de ManagerContext. */
    return nova;
  }, [assertCurrent]);

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
    guardarCampPerfil, guardarAjust, creaOrganitzacio, pujaMitja,
  }), [usuari, identitats, carregant, error, guardarCampPerfil, guardarAjust, creaOrganitzacio, pujaMitja]);

  return <PerfilContext.Provider value={valor}>{children}</PerfilContext.Provider>;
}
