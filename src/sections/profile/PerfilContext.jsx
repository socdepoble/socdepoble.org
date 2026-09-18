import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  getCurrentUser, listMyOrganizations, updateOrganization, updateProfile,
  updateUserPassword, getProfile, createOrganization, teCapacitat, uploadToStorage,
} from '../../data/backendPort.js';

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

  /* Càrrega única en muntar. PENDENT de decidir: si `config` pot
     arribar TARD (config externa asíncrona), caldrà repetir-la quan
     passe de buida a plena. */
  useEffect(() => {
    let viu = true;
    setUsuari(getCurrentUser());

    Promise.all([
      listMyOrganizations(configRef.current),
      getProfile(configRef.current),
    ])
      .then(([orgs, perfil]) => {
        if (!viu) return;
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
  }, []);

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
    if (identitatObjectiuId == null) {
      throw new Error('guardarCampPerfil: falta la identitat objectiu (tercer paràmetre, OBLIGATORI).');
    }
    const objectiu = identitats.find((item) => item.id === identitatObjectiuId);
    if (!objectiu) {
      throw new Error(`Identitat desconeguda: ${String(identitatObjectiuId)}`);
    }

    if (objectiu.mena === 'persona') {
      const rebudes = await updateProfile({ [camp]: valor }, configRef.current);
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
      setOrganitzacions((prev) =>
        prev.map((o) => (o.id === objectiu.id ? { ...o, ...(novesDades || {}), [camp]: valor } : o)),
      );
    }
  }, [identitats]);

  /* Signatura TRENCADORA a propòsit: guardarAjust(identitat, ajust, valor). */
  const guardarAjust = useCallback(async (identitatObjectiuId, ajustId, valor) => {
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
      return;
    }
    if (!ajust.camp) {
      throw new Error(`L'ajust "${ajust.id}" no té camp associat al catàleg.`);
    }
    await guardarCampPerfil(ajust.camp, valor, objectiu.id);
  }, [identitats, guardarCampPerfil]);

  const creaOrganitzacio = useCallback(async (dades) => {
    const defaultName = 'Organització nova';
    const name = dades?.name || defaultName;
    const slug = dades?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
    const payload = dades ? { ...dades, slug } : { name, kind: 'group', slug };
    
    const nova = await createOrganization(
      payload,
      configRef.current,
    );
    // Assumim rol propietari immediatament per desbloquejar els ajustos locals sense necessitar recarrega
    nova.role = 'owner';
    setOrganitzacions((prev) => [...prev, nova]);
    /* La nova identitat apareixerà sola als facets (identitats canvia).
       Seleccionar-la per programació requereix que el Manager expose
       una acció de selecció: pendent del contracte de ManagerContext. */
    return nova;
  }, []);

  const pujaMitja = useCallback(async (fitxer, carpeta = 'avatars') => {
    if (!teCapacitat('mitjans')) return null;
    const res = await uploadToStorage(fitxer, { carpeta }, configRef.current);
    return res.url;
  }, []);

  /* Valor memoitzat + callbacks estables: els consumidors (i els
     useCallback que en depenguin) només es mouen quan canvien DADES,
     no quan canvia la identitat d'una funció. */
  const valor = useMemo(() => ({
    usuari, identitats, carregant, error,
    guardarCampPerfil, guardarAjust, creaOrganitzacio, pujaMitja,
  }), [usuari, identitats, carregant, error, guardarCampPerfil, guardarAjust, creaOrganitzacio, pujaMitja]);

  return <PerfilContext.Provider value={valor}>{children}</PerfilContext.Provider>;
}
