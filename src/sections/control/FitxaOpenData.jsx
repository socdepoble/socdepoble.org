import { useEffect, useMemo, useState } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { useUIState } from '../../app/contexts/UIContext.jsx';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { useIdentitatOpcional } from '../../app/contexts/IdentitatContext.jsx';
import { backendScope, normalizeBackendConfig } from '../../config/backendConfig.js';
import { normalitzaSlugMunicipi } from '../../data/activitypub.js';
import { adminLlistaPobles, teCapacitat } from '../../data/backendPort.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import RestauradorOpenData, { TEXTOS_RESTAURADOR } from '../pobles/RestauradorOpenData.jsx';

const BUIDA = Object.freeze({});
/* Un municipi vàlid { slug, nom } o null: les guardes de sempre. */
function municipiDe(nomCru, slugCru) {
  const nom = typeof nomCru === 'string' ? nomCru.trim() : '';
  const slug = typeof slugCru === 'string' ? slugCru : normalitzaSlugMunicipi(nom);
  if (!nom || nom.length > 120 || /[<>\u0000-\u001f\u007f]/.test(nom) || !slug || normalitzaSlugMunicipi(slug) !== slug) return null;
  return { slug, nom };
}
const esDelTenant = tenantId => valor => typeof valor === 'string' && valor.toLowerCase() === tenantId;

/** El municipi actiu es resol per l'id del tenant, no pel nom ni pel ZIP.
 * Sense sessió reforçada o sense poble conegut es manté la comprovació local.
 *
 * control-02 (revisió del Panell, 261104) · `towns.find(x => x.id === tenantId)`
 * no casava mai: el tenant és l'UUID de public.towns i les fitxes de `towns`
 * porten l'id slug (configAmfitrio.js; migració 2610282100). Un superadmin aal2
 * no podia restaurar mai. Ara, per este ordre:
 *   · la fitxa que declara el tenant (`id` o, si el catàleg el porta,
 *     `tenant_id`), sense cap crida;
 *   · si no n'hi ha, la llista dels pobles administrables del port
 *     (adminLlistaPobles, capacitat 'administracioMultipoble'), amb la porta de
 *     pobleAdministrat.jsx (superadmin amb el segon factor): la fila del tenant.
 *     Una resposta d'un abast anterior es descarta i la crida s'avorta.
 * Sense resoldre, municipi null: es tanca en fals, com abans. Mai el poble que
 * declara l'amfitrió (configAmfitrio.js: presentació, no abast de dades).
 */
export default function FitxaOpenData({ onBack, vistaRef }) {
  const { externalConfig } = useUIState();
  const { towns } = useCoreContent();
  const sessio = useSessioOpcional();
  const identitat = useIdentitatOpcional();
  const t = useTraductorOpcional();
  const tr = k => tradueix(t, TEXTOS_RESTAURADOR[k]);
  const context = useMemo(() => {
    try {
      const config = normalizeBackendConfig(externalConfig || BUIDA);
      return { config, scope: backendScope(config), valid: true };
    } catch { return { config: BUIDA, scope: 'configuracio-invalida', valid: false }; }
  }, [externalConfig]);
  const tenantId = context.config.tenantId;
  const delCataleg = useMemo(() => {
    const casa = esDelTenant(tenantId);
    const town = Array.isArray(towns) && tenantId ? towns.find(x => x && (casa(x.id) || casa(x.tenant_id))) : null;
    return town ? municipiDe(typeof town.name === 'string' ? town.name : town.title, town.slug) : null;
  }, [towns, tenantId]);
  const user = sessio?.currentUser?.id || '';
  const scope = `${context.scope}::${user || 'anon'}::${identitat?.actorKey || 'persona'}`;
  const reforcada = Boolean(user && sessio?.esSuperadmin === true && sessio?.nivell === 'aal2');
  let multipoble = false;
  try { multipoble = teCapacitat('administracioMultipoble') === true; } catch { /* port no inicialitzat */ }
  const demanaLlista = Boolean(context.valid && tenantId && !delCataleg && reforcada && multipoble);
  const clauLlista = JSON.stringify([scope, sessio?.generacio ?? null]);
  const [llista, setLlista] = useState(null);
  useEffect(() => {
    if (!demanaLlista) return undefined;
    let viu = true;
    const control = new AbortController();
    Promise.resolve()
      .then(() => adminLlistaPobles({ signal: control.signal }))
      .then(files => { if (viu) setLlista({ clau: clauLlista, files: Array.isArray(files) ? files : [] }); })
      .catch(() => { /* Sense llista no hi ha municipi: es tanca en fals. */ });
    return () => { viu = false; control.abort(); };
  }, [demanaLlista, clauLlista]);
  const delServidor = useMemo(() => {
    if (!demanaLlista || llista?.clau !== clauLlista) return null;
    const fila = llista.files.find(f => f && esDelTenant(tenantId)(f.id));
    return fila ? municipiDe(fila.nom, fila.slug) : null;
  }, [demanaLlista, llista, clauLlista, tenantId]);
  const municipi = delCataleg ?? delServidor;
  const autoritzat = Boolean(context.valid && municipi && reforcada);
  return <UniversalPage title={tr('titol')} lead={tr('explica')} onBack={onBack} chrome="system" traduccio={false}>
    <div ref={vistaRef} className="content-wrapper">
      <RestauradorOpenData key={scope} municipi={municipi} scopeKey={scope} config={context.config} autoritzat={autoritzat} introduccio={false} />
    </div>
  </UniversalPage>;
}
