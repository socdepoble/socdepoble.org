import { useMemo } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { useUIState } from '../../app/contexts/UIContext.jsx';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { useIdentitatOpcional } from '../../app/contexts/IdentitatContext.jsx';
import { backendScope, normalizeBackendConfig } from '../../config/backendConfig.js';
import { normalitzaSlugMunicipi } from '../../data/activitypub.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import RestauradorOpenData, { TEXTOS_RESTAURADOR } from '../pobles/RestauradorOpenData.jsx';

const BUIDA = Object.freeze({});
/** El municipi actiu es resol per l'id del tenant, no pel nom ni pel ZIP.
 * Sense sessió reforçada o sense poble conegut es manté la comprovació local.
 */
export default function FitxaOpenData({ onBack }) {
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
  const municipi = useMemo(() => {
    const town = Array.isArray(towns) && context.config.tenantId ? towns.find(x => x?.id === context.config.tenantId) : null;
    const nom = typeof town?.name === 'string' ? town.name.trim() : typeof town?.title === 'string' ? town.title.trim() : '';
    const slug = typeof town?.slug === 'string' ? town.slug : normalitzaSlugMunicipi(nom);
    if (!nom || nom.length > 120 || /[<>\u0000-\u001f\u007f]/.test(nom) || !slug || normalitzaSlugMunicipi(slug) !== slug) return null;
    return { slug, nom };
  }, [towns, context.config.tenantId]);
  const user = sessio?.currentUser?.id || '';
  const scope = `${context.scope}::${user || 'anon'}::${identitat?.actorKey || 'persona'}`;
  const autoritzat = Boolean(context.valid && municipi && user && sessio?.esSuperadmin === true && sessio?.nivell === 'aal2');
  return <UniversalPage title={tr('titol')} lead={tr('explica')} onBack={onBack} chrome="system" traduccio={false}>
    <div className="content-wrapper">
      <RestauradorOpenData key={scope} municipi={municipi} scopeKey={scope} config={context.config} autoritzat={autoritzat} introduccio={false} />
    </div>
  </UniversalPage>;
}
