/**
 * useAdministrarOrganitzacio.js — Connectar-se a una organització per a
 * administrar-la (T43, ordre del Mestre, 260928).
 *
 *   · Llig la petició PRÒPIA (una crida) si el port té la capacitat
 *     'reclamacions'; sense ella no crida res i l'estat ho diu.
 *   · connecta(justificacio): en seed/local l'alta és immediata; en remot és
 *     una petició que revisa l'equip de Sóc de Poble.
 *   · Després d'una alta aprovada, refresca IdentitatContext i ESPERA que la
 *     pertinença hi arribe: fins llavors setActor torna false.
 *   · Canviar d'identitat MAI és automàtic: actua() i editaFitxa() són
 *     accions a part, i editar la fitxa no canvia la identitat.
 *   · T43b · Tot el que es llig o s'envia porta la CLAU (persona +
 *     organització) per a la qual es va demanar: si canvia l'una o l'altra,
 *     el que hi havia no es pinta, sense esperar cap efecte. Mentre es llig
 *     la petició pròpia, l'estat és 'comprovant' i no s'oferix el formulari.
 *   · T43b-3 · El nom ve de la pertinença o del directori (loadPerfilPublic),
 *     mai de l'URL. Sense cap dels dos, `nom` és null i la targeta diu
 *     «esta organització».
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { useSession } from '../../../app/contexts/SessionContext';
import { useIdentitat } from '../../../app/contexts/IdentitatContext.jsx';
import { lesMevesReclamacions, loadPerfilPublic, reclamaOrganitzacio, teCapacitat } from '../../../data/backendPort.js';
import { capturaSessio } from '../../../data/identitat.js';
import { rutaFitxaOrganitzacio } from '../../profile/perfilModel.js';
import { estatDeLAdministracio } from './estatAdministracio.js';
import { useUbicacioApp } from '../../../components/PedraSeca/hooks/useAccions.js';
// T4 · La tornada és el camí i la consulta sencers (rutaActual talla la consulta llarga).
import { rutaSencera } from '../../../components/universal/identitat/useIdentitatDeLaBarra.js';
import { rutaDEntrada } from '../../../config/rutaEntrada.js';

/* Un port sense la capacitat (o un mock) no ha de fer caure la vista. */
function capacitat(nom) {
  try { return teCapacitat(nom); } catch { return false; }
}

/* Només una fitxa d'organització dona nom a una organització. */
const TIPUS_ORGANITZACIO = new Set(['entitat', 'grup']);
const nomDeLaFitxa = (perfil) => (
  perfil && TIPUS_ORGANITZACIO.has(perfil.tipus) && typeof perfil.nom === 'string' ? perfil.nom.trim() || null : null
);
/* El valor desat, si és de la clau vigent. */
const deLaClau = (desat, clau) => (desat && desat.clau === clau ? desat : null);

export function useAdministrarOrganitzacio(orgId, { config = {}, ambRevisio = true } = {}) {
  const navigate = useNavigate();
  /* T4 · El router on viu l'app (o null): «Entrar» torna ací després d'entrar. */
  const router = useUbicacioApp();
  const { currentUser } = useSession();
  const { memberships = [], actor, setActor, refresh } = useIdentitat();
  const id = String(orgId ?? '').trim();
  const teSessio = Boolean(currentUser);
  const usuariId = currentUser?.id ?? null;
  const disponible = capacitat('reclamacions');
  const ambDirectori = capacitat('directori');
  const clau = `${usuariId ?? ''}\u0000${id}`;

  /* { clau, valor }, { clau, error } i { clau, nom }: vegeu la capçalera. */
  const [reclamacioDesada, setReclamacioDesada] = useState(null);
  const [lectura, setLectura] = useState(null);
  const [errorEnviament, setErrorEnviament] = useState(null);
  const [fitxa, setFitxa] = useState(null);
  const [enviant, setEnviant] = useState(false);
  const configRef = useRef(config);
  configRef.current = config;

  const reclamacio = deLaClau(reclamacioDesada, clau)?.valor ?? null;
  const error = deLaClau(errorEnviament, clau)?.error ?? null;
  const lecturaVigent = deLaClau(lectura, clau);
  const errorLectura = lecturaVigent?.error ?? null;
  const calLlegir = teSessio && disponible && Boolean(id);
  const llegint = calLlegir && !lecturaVigent;

  /* La pertinença per id o per slug (l'enllaç pot portar qualsevol dels dos). */
  const membership = useMemo(
    () => (id ? memberships.find((m) => String(m.id) === id || (m.slug && String(m.slug) === id)) || null : null),
    [memberships, id],
  );
  const entitatId = membership ? String(membership.id) : null;
  const actiu = Boolean(entitatId) && actor?.tipus === 'entitat' && String(actor.id) === entitatId;

  /* La petició pròpia d'esta organització, una lectura per persona i
     organització. Fins que acaba (bé o malament), l'estat és 'comprovant'. */
  useEffect(() => {
    if (!calLlegir) return undefined;
    let viu = true;
    const perA = clau;
    const vigent = capturaSessio();
    Promise.resolve()
      .then(() => lesMevesReclamacions(configRef.current))
      .then((llista) => {
        if (!viu) return;
        vigent();
        const meua = (Array.isArray(llista) ? llista : []).find((r) => String(r.organitzacioId) === id) || null;
        /* Una petició enviada mentrestant (per a esta clau) mana sobre la llegida. */
        setReclamacioDesada((actual) => (actual?.clau === perA ? actual : (meua ? { clau: perA, valor: meua } : null)));
        setLectura({ clau: perA, error: null });
      })
      .catch((e) => {
        /* També un AbortError amb la vista viva acaba la lectura: mai 'comprovant' per sempre. */
        if (viu) setLectura({ clau: perA, error: e });
      });
    return () => { viu = false; };
  }, [calLlegir, clau, id]);

  /* T43b-3 · El nom de confiança quan no hi ha pertinença: la fitxa pública. */
  const teMembership = Boolean(membership);
  useEffect(() => {
    if (!id || teMembership || !ambDirectori) return undefined;
    let viu = true;
    Promise.resolve()
      .then(() => loadPerfilPublic(id, configRef.current))
      .then((perfil) => { if (viu) setFitxa({ clau: id, nom: nomDeLaFitxa(perfil) }); })
      .catch(() => { if (viu) setFitxa({ clau: id, nom: null }); });
    return () => { viu = false; };
  }, [id, teMembership, ambDirectori]);

  const connecta = useCallback(async (justificacio = '') => {
    if (!teSessio || !disponible || !id || enviant) return null;
    const perA = clau;
    setEnviant(true);
    setErrorEnviament(null);
    const vigent = capturaSessio();
    try {
      const resultat = await reclamaOrganitzacio(id, { justificacio }, configRef.current);
      vigent();
      /* organitzacioId és la clau amb què s'ha demanat (id o slug): la que compara estatDeLAdministracio. */
      setReclamacioDesada({ clau: perA, valor: { ...resultat, organitzacioId: id } });
      /* Aprovada: la pertinença nova ha d'arribar a IdentitatContext. */
      if (resultat?.estat === 'aprovada') refresh?.();
      return resultat;
    } catch (e) {
      if (e?.name !== 'AbortError') setErrorEnviament({ clau: perA, error: e });
      return null;
    } finally {
      setEnviant(false);
    }
  }, [teSessio, disponible, id, clau, enviant, refresh]);

  const actua = useCallback(() => (entitatId ? setActor?.('entitat', entitatId) ?? false : false), [entitatId, setActor]);
  const editaFitxa = useCallback(() => { if (entitatId) navigate(rutaFitxaOrganitzacio(entitatId)); }, [entitatId, navigate]);
  /* T4 (ordre del Mestre, 260930) · /registre en mode Entrar i, de tornada, la ruta d'on es venia. */
  const entra = useCallback(() => navigate(rutaDEntrada({ tornar: rutaSencera(router) })), [navigate, router]);

  const estat = estatDeLAdministracio({
    teSessio, disponible, membership, reclamacio, error, orgId: id, llegint, errorLectura
  });

  return {
    estat,
    nom: membership?.name || deLaClau(fitxa, id)?.nom || null,
    rol: membership?.role || null,
    data: reclamacio?.data || null,
    carregant: enviant || estat === 'activant',
    error,
    errorLectura,
    actiu,
    ambRevisio,
    connecta,
    actua,
    editaFitxa,
    entra,
  };
}

export default useAdministrarOrganitzacio;
