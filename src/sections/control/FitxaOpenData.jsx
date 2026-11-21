import { useEffect, useMemo, useState } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { Accions, Alerta, Boto, Carregant, Pila } from '../../components/PedraSeca/index.js';
import { useUIState } from '../../app/contexts/UIContext.jsx';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { useIdentitatOpcional } from '../../app/contexts/IdentitatContext.jsx';
import { backendScope, normalizeBackendConfig } from '../../config/backendConfig.js';
import { normalitzaSlugMunicipi } from '../../data/activitypub.js';
import { adminLlistaPobles, teCapacitat } from '../../data/backendPort.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import RestauradorOpenData from '../pobles/RestauradorOpenData.jsx';
import { TEXTOS_RESTAURADOR } from '../pobles/restauradorOpenDataModel.js';
import { textosOpenDataEstats } from '../pobles/i18nOpenDataEstats.js';

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
 *
 * Onada R32.11 · Lot 05: cobertura explícita dels 6 estats UI (Loading, Error
 * accionable amb reintent net, Permission, Partial, Success i Empty delegat al
 * Restaurador) mantenint RestauradorOpenData sempre muntat al primer render.
 */
export default function FitxaOpenData({ onBack, vistaRef }) {
  const uiState = useUIState();
  const externalConfig = uiState?.externalConfig;
  const idioma = uiState?.language || 'ca';
  const tx = textosOpenDataEstats(idioma);
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
  const [intent, setIntent] = useState(0);
  const clauLlista = JSON.stringify([scope, sessio?.generacio ?? null, intent]);
  const [llista, setLlista] = useState(null);
  useEffect(() => {
    if (!demanaLlista) return undefined;
    let viu = true;
    const control = new AbortController();
    Promise.resolve()
      .then(() => adminLlistaPobles({ signal: control.signal }))
      .then(files => {
        if (viu && !control.signal.aborted) {
          setLlista({ clau: clauLlista, files: Array.isArray(files) ? files : [], error: false });
        }
      })
      .catch(() => {
        /* Sense llista no hi ha municipi: es tanca en fals i s'ofereix reintent explícit. */
        if (viu && !control.signal.aborted) {
          setLlista({ clau: clauLlista, files: [], error: true });
        }
      });
    return () => { viu = false; control.abort(); };
  }, [demanaLlista, clauLlista]);
  const respostaActual = demanaLlista && llista?.clau === clauLlista ? llista : null;
  const resolentMunicipi = Boolean(demanaLlista && !respostaActual);
  const errorMunicipis = Boolean(respostaActual?.error);
  const delServidor = useMemo(() => {
    if (!respostaActual || respostaActual.error) return null;
    const fila = respostaActual.files.find(f => f && esDelTenant(tenantId)(f.id));
    return fila ? municipiDe(fila.nom, fila.slug) : null;
  }, [respostaActual, tenantId]);
  const municipi = delCataleg ?? delServidor;
  const autoritzat = Boolean(context.valid && municipi && reforcada);

  let blocEstatContext = null;
  if (!context.valid) {
    blocEstatContext = (
      <Alerta to="error" titol={tx.configInvalidaTitol}>{tx.configInvalidaText}</Alerta>
    );
  } else if (resolentMunicipi) {
    blocEstatContext = <Carregant etiqueta={tx.resolentMunicipi} />;
  } else if (errorMunicipis) {
    blocEstatContext = (
      <Alerta to="error" titol={tx.errorMunicipisTitol}>
        <p>{tx.errorMunicipisText}</p>
        <Accions>
          <Boto varietat="secundari" type="button" onClick={() => setIntent(n => n + 1)}>
            {tx.reintentaMunicipis}
          </Boto>
        </Accions>
      </Alerta>
    );
  } else if (!reforcada) {
    blocEstatContext = (
      <Alerta to="info" viva={false} titol={tx.permisLecturaTitol}>{tx.permisLecturaText}</Alerta>
    );
  } else if (autoritzat && municipi) {
    blocEstatContext = (
      <Alerta to="exit" viva={false} titol={tx.municipiActiuTitol(municipi.nom)}>{tx.municipiActiuText}</Alerta>
    );
  } else {
    blocEstatContext = (
      <Alerta to="avis" viva={false} titol={tx.senseMunicipiActiuTitol}>{tx.senseMunicipiActiuText}</Alerta>
    );
  }

  return (
    <UniversalPage title={tr('titol')} lead={tr('explica')} onBack={onBack} chrome="system" traduccio={false}>
      <div ref={vistaRef} className="content-wrapper">
        <Pila gap={4}>
          {blocEstatContext}
          <RestauradorOpenData
            key={scope}
            municipi={municipi}
            scopeKey={scope}
            config={context.config}
            autoritzat={autoritzat}
            introduccio={false}
          />
        </Pila>
      </div>
    </UniversalPage>
  );
}
