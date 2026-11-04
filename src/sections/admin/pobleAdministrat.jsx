import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alerta, Boto, Camp, Carregant, Selector } from '../../components/PedraSeca/index.js';
import { useSession } from '../../app/contexts/SessionContext.jsx';
import { useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { backendScope, normalizeBackendConfig } from '../../config/backendConfig.js';
import { adminLlistaPobles, adminLligPersonalitzacio, teCapacitat } from '../../data/backendPort.js';

const errorLlegible = error => error?.status === 404
  ? 'Este servidor encara no té la gestió multipoble disponible.'
  : 'No s’ha pogut llegir l’administració dels pobles. Comprova els permisos, el segon factor i la connexió.';

/** Selecció local del Tauler: cap canvi de sessió, de runtimePolicy ni del contingut global. */
export function usePobleAdministrat(actiu) {
  const sessio = useSession();
  const configuracio = useUIStateOpcional()?.externalConfig;
  const context = useMemo(() => {
    try { const config = normalizeBackendConfig(configuracio || {}); return { config, scope: backendScope(config) }; }
    catch { return null; }
  }, [configuracio]);
  let capacitat = false;
  try { capacitat = teCapacitat('administracioMultipoble') === true; } catch { /* port no inicialitzat */ }
  const habilitat = actiu && capacitat;
  const autoritzat = context !== null && sessio.esSuperadmin === true && sessio.nivell === 'aal2';
  const identitat = JSON.stringify([sessio.currentUser?.id ?? null, sessio.generacio ?? null, sessio.esSuperadmin, sessio.nivell, context?.scope ?? 'configuracio-invalida']);
  const [llista, setLlista] = useState(null);
  const [tria, setTria] = useState(null);
  const [lectura, setLectura] = useState(null);
  const [intent, setIntent] = useState(0);
  const [intentLlista, setIntentLlista] = useState(0);
  const recarrega = useCallback(() => setIntent(n => n + 1), []);
  const files = llista?.identitat === identitat ? llista.files : [];
  // Una llista ordenada no és una elecció: només el tenant actiu autoritzat
  // pot ser inicial. Sense ell, cal triar explícitament abans de llegir/desar.
  const idTriat = tria?.identitat === identitat ? tria.id : context?.config.tenantId;
  const poble = files.find(f => f.id === idTriat) ?? null;
  const clau = `${identitat}:${poble?.id ?? ''}`;
  const configCrida = useMemo(() => poble ? Object.freeze({ tenantId: poble.id }) : null, [poble]);

  useEffect(() => {
    if (!habilitat || !autoritzat) return undefined;
    let viu = true;
    const control = new AbortController();
    setLlista({ identitat, files: [], carregant: true });
    Promise.resolve().then(() => {
      if (!viu || control.signal.aborted) throw new DOMException('Lectura cancel·lada.', 'AbortError');
      return adminLlistaPobles({ signal: control.signal });
    })
      .then(resultat => { if (viu) setLlista({ identitat, files: resultat, carregant: false }); })
      .catch(error => { if (viu && error?.name !== 'AbortError') setLlista({ identitat, files: [], carregant: false, error: errorLlegible(error) }); });
    return () => { viu = false; control.abort(); };
  }, [habilitat, autoritzat, identitat, intentLlista]);

  useEffect(() => {
    if (!habilitat || !autoritzat || !configCrida) return undefined;
    let viu = true;
    const control = new AbortController();
    setLectura({ clau, intent, carregant: true });
    Promise.resolve().then(() => {
      if (!viu || control.signal.aborted) throw new DOMException('Lectura cancel·lada.', 'AbortError');
      return adminLligPersonalitzacio({ ...configCrida, signal: control.signal });
    })
      .then(personalitzacio => { if (viu) setLectura({ clau, intent, carregant: false, personalitzacio }); })
      .catch(error => { if (viu && error?.name !== 'AbortError') setLectura({ clau, intent, carregant: false, error: errorLlegible(error) }); });
    return () => { viu = false; control.abort(); };
  }, [habilitat, autoritzat, clau, configCrida, intent]);

  if (!habilitat) return null;
  const llistaVigent = llista?.identitat === identitat ? llista : null;
  const vigent = lectura?.clau === clau && lectura.intent === intent ? lectura : null;
  const error = !context ? 'No es pot determinar el servidor actiu. Revisa la configuració abans de gestionar altres pobles.'
    : !autoritzat ? 'Cal ser superadministrador amb el segon factor confirmat per a gestionar altres pobles.'
    : llistaVigent?.error ?? vigent?.error ?? null;
  const carregant = autoritzat && !error && (!llistaVigent || llistaVigent.carregant || (poble && (!vigent || vigent.carregant)));
  const preparada = Boolean(autoritzat && poble && vigent && !vigent.carregant && !error);
  return {
    clau, configCrida, preparada,
    contingut: { status: preparada ? 'ready' : 'loading', pageCopy: {}, personalitzacio: preparada ? vigent.personalitzacio : null, refresh: recarrega },
    selector: (
      <>
        {autoritzat && files.length ? <Camp etiqueta="Poble que administres">
          <Selector value={poble?.id ?? ''} opcions={[{ valor: '', etiqueta: 'Tria el poble que vols administrar', desactivat: true }, ...files.map(f => ({ valor: f.id, etiqueta: f.nom }))]}
            onChange={e => { if (files.some(f => f.id === e.target.value)) setTria({ identitat, id: e.target.value }); }} />
        </Camp> : null}
        {error ? <Alerta to="error">{error}</Alerta> : null}
        {carregant ? <Carregant etiqueta="Carregant el poble administrat…" /> : null}
        {autoritzat && llistaVigent && !llistaVigent.carregant && !files.length && !error ? <Alerta to="info">No hi ha cap poble administrable en este servidor.</Alerta> : null}
        {autoritzat && error ? <Boto onClick={() => llistaVigent?.error ? setIntentLlista(n => n + 1) : recarrega()}>Reintentar</Boto> : null}
      </>
    )
  };
}
