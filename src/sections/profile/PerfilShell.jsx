import { useCallback, useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, UserRound } from 'lucide-react';
import { useContent } from '../../components/universal/ContentProvider';
import { useUI } from '../../app/contexts/UIContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { UniversalWorkspace } from '../../components/universal/workspace';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { teCapacitat } from '../../data/backendPort.js';
import { PerfilProvider, usePerfil } from './PerfilContext.jsx';
import { PerfilEditor } from './PerfilEditor.jsx';
import { DetallCompte } from './DetallCompte.jsx';
import { DetallPrivacitat } from './DetallPrivacitat.jsx';
import { DetallAplicacio, DetallSenseOrganitzacions } from './DetallEspai.jsx';
import { DialegNovaOrganitzacio } from './DialegNovaOrganitzacio.jsx';
import { APLICACIONS, aplicacionsValides } from './aplicacions.js';
import {
  PARAM_FITXA_ORGANITZACIO, empresesMare, itemsDAplicacions, itemsDePerfil, navegacioDePerfil, seleccioInicialDePerfil,
} from './perfilModel.js';

/* Els consumidors d'abans les importaven d'ací. */
export { empresesMare, itemsDePerfil };

/* Pell del Perfil: el mateix esquelet de tres columnes que el Bloc de Notes.
   1a: persona · GRUPS I EMPRESES · APLICACIONS (perfilModel.js).
   2a: els apartats de l'element triat. 3a: l'editor o la pàgina de l'apartat. */
const ETIQUETES = {
  categories: 'PERFIL',
  items: 'APARTATS',
  create: 'NOVA ORG',
  search: 'Cercar apartats',
  empty: 'No hi ha apartats.',
};
const ICONES = { categories: UserRound, items: SlidersHorizontal };

function PerfilManagerInner({ config, aplicacions, preferides }) {
  const { showToast } = useToast();
  const {
    identitats, contactes, guardarAjust, pujaMitja, creaOrganitzacio, recarrega, carregant, error,
  } = usePerfil();

  /* `dialeg` guarda el resolve de la promesa que espera el Workspace
     (createAndSelect). `creada` espera que la identitat nova arribe al
     model abans de resoldre-la: així el Workspace la troba en demanar-la. */
  const [dialeg, setDialeg] = useState(null);
  const [creada, setCreada] = useState(null);
  /* Una clau per obertura: el formulari naix buit cada vegada, però el diàleg no
     es desmunta en tancar-se (obert=false), i així el focus torna a NOVA ORG. */
  const [obertures, setObertures] = useState(0);

  /* «Privacitat i dades» només si el backend sap fer algun dels drets. */
  const ambPrivacitat = teCapacitat('compte') || teCapacitat('consentiment');

  /* Tots els hooks ABANS de cap return condicional (regla de hooks). */
  const model = useMemo(() => ({
    status: 'ready',
    itemsComplete: true,
    navigationGroups: navegacioDePerfil(identitats, aplicacions),
    items: [...itemsDePerfil(identitats, { ambPrivacitat }), ...itemsDAplicacions(aplicacions)],
  }), [identitats, aplicacions, ambPrivacitat]);

  /* Slot estable: depèn només de coses que ja són estables gràcies al
     context endurit. */
  const renderDetail = useCallback(({ item }) => {
    const vista = item?.data?.vista;
    if (vista === 'aplicacio') {
      const aplicacio = aplicacions.find((a) => a.id === item.data.aplicacioId);
      return aplicacio ? <DetallAplicacio key={aplicacio.id} aplicacio={aplicacio} /> : null;
    }
    if (vista === 'sense-organitzacions') {
      return <DetallSenseOrganitzacions persona={identitats.find((i) => i.mena === 'persona')} />;
    }
    const identitat = identitats.find((i) => i.id === item?.data?.identitatId);
    if (!identitat) return null;
    if (vista === 'fitxa') return <PerfilEditor key={identitat.id} identitat={identitat} />;
    if (vista === 'privacitat') {
      return <DetallPrivacitat key={identitat.id} identitat={identitat} config={config} onPerfilCanviat={recarrega} />;
    }
    return (
      <DetallCompte
        key={identitat.id}
        identitat={identitat}
        guardarAjust={guardarAjust}
        pujaMitja={pujaMitja}
        contacte={contactes?.[String(identitat.id)] || null}
      />
    );
  }, [identitats, contactes, aplicacions, config, guardarAjust, pujaMitja, recarrega]);

  /* T43 (ordre del Mestre, 260928) · En obrir-se, el Perfil mostra
     l'organització demanada per la ruta («Edita la fitxa de {Org}») o la
     que és l'actor actiu; si no és cap de les seues, la persona. */
  const [preferidaRuta, preferidaActor] = preferides || [];
  const initialSelection = useMemo(
    () => seleccioInicialDePerfil(identitats, [preferidaRuta, preferidaActor]),
    [identitats, preferidaRuta, preferidaActor],
  );

  const onCreate = useCallback(() => new Promise((resolve) => {
    setObertures((n) => n + 1);
    setDialeg({ resolve });
  }), []);

  const tanca = useCallback(() => {
    dialeg?.resolve(null);
    setDialeg(null);
  }, [dialeg]);

  /* Si creaOrganitzacio llança, l'error torna al diàleg, que continua obert. */
  const crea = useCallback(async (dades) => {
    const org = await creaOrganitzacio(dades);
    setCreada({ id: org.id, resolve: dialeg?.resolve });
    setDialeg(null);
    showToast(`«${org.name}» ja és al teu perfil.`, 'success');
  }, [creaOrganitzacio, dialeg, showToast]);

  useEffect(() => {
    if (!creada || !identitats.some((identitat) => identitat.id === creada.id)) return;
    creada.resolve?.({ id: `${creada.id}-fitxa` });
    setCreada(null);
  }, [creada, identitats]);

  /* Abans: pantalla buida i enganyosa mentre carregava. Ara: explícit. */
  if (carregant) {
    return (
      <div className="sdp-gestor-pagina">
        <p className="perfil-detall-buit">Carregant el teu perfil…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sdp-gestor-pagina">
        <div className="sdp-buit" role="alert">
          <p>{error}</p>
          {/* Sense reintent, la persona perdia també «El compte» i «Privacitat i dades». */}
          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={recarrega}>Tornar a provar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sdp-gestor-pagina">
      <UniversalWorkspace
        model={model}
        initialSelection={initialSelection}
        labels={ETIQUETES}
        icons={ICONES}
        tagFilter={false}
        onCreate={onCreate}
        renderDetail={renderDetail}
        className="perfil-espai"
        detailClassName="perfil-espai__detall"
      />
      <DialegNovaOrganitzacio
        key={obertures}
        obert={Boolean(dialeg)}
        onTanca={tanca}
        onCrea={crea}
        empresesMare={empresesMare(identitats)}
      />
    </div>
  );
}

/**
 * `aplicacions` (opcional): les utilitats d'este node. Per defecte, les
 * d'aplicacions.js; una instància federada hi pot passar les seues.
 */
export default function PerfilShell({ aplicacions = APLICACIONS }) {
  const { externalConfig } = useUI();
  const contentContext = useContent();
  const { refresh, actor } = useIdentitat();
  /* T43 · ?organitzacio=ID (rutaFitxaOrganitzacio) i l'actor actiu, per a
     triar què s'obri primer. */
  const [params] = useSearchParams();
  const preferidaRuta = params?.get?.(PARAM_FITXA_ORGANITZACIO) || null;
  const preferidaActor = actor?.tipus === 'entitat' && actor?.id != null ? String(actor.id) : null;
  const preferides = useMemo(() => [preferidaRuta, preferidaActor], [preferidaRuta, preferidaActor]);
  const configContingut = contentContext?.config;
  /* Memoitzada: una configuració nova a cada render tornaria a pintar el detall. */
  const config = useMemo(
    () => configContingut || externalConfig || {},
    [configContingut, externalConfig],
  );
  const utilitats = useMemo(() => aplicacionsValides(aplicacions), [aplicacions]);

  return (
    <PerfilProvider config={config} onCanviOrganitzacions={refresh}>
      <PerfilManagerInner config={config} aplicacions={utilitats} preferides={preferides} />
    </PerfilProvider>
  );
}
