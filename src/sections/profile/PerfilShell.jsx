import { useCallback, useMemo } from 'react';
import { useContent } from '../../components/universal/ContentProvider';
import {
  PerfilProvider,
  usePerfil,
  ajustosPersona,
  ajustosOrganitzacio,
} from './PerfilContext.jsx';
import DetallAjust from './DetallAjust.jsx';
import './PerfilShell.css';
import { useUI } from '../../app/contexts/UIContext';
import { UniversalWorkspace } from '../../components/universal/workspace';
import { UserRound, Building2, Lock } from 'lucide-react';

/* ── Adaptadors a nivell de mòdul ──────────────────────────────────
   No depenen de res de l'escop → identitat eterna → els memos de la
   plantilla no s'invaliduen per un canvi de props del pare. */
const getIdAjust = (item) => item?.uniqueId;
const getTextAjust = (item) => item?.titol || '';
const getCardAjust = (ajust) => ({
  titol: ajust.titol,
  subtitol:
    ajust.id === 'avatar'
      ? ''
      : ajust.valor || (ajust.obert ? '' : ajust.motiu),
  imatge: ajust.id === 'avatar' ? ajust.valor : undefined,
  icona: !ajust.obert
    ? Lock
    : ajust.identitatMena === 'persona'
      ? UserRound
      : Building2,
});

/* Objecte estable per a la prop inicial. */
const FACETS_INICIALS = { identitat: 'jo' };

function PerfilManagerInner() {
  const {
    identitats, guardarAjust, guardarCampPerfil, pujaMitja,
    creaOrganitzacio, carregant, error,
  } = usePerfil();

  /* Tots els hooks ABANS de cap return condicional (regla de hooks). */
  const totsElsAjustos = useMemo(() => {
    return identitats.flatMap((identitat) => {
      const ajustosIdentitat =
        identitat.mena === 'persona'
          ? ajustosPersona(identitat.dades || {})
          : ajustosOrganitzacio(identitat.dades || {});
      return ajustosIdentitat.map((a) => ({
        ...a,
        uniqueId: `${identitat.id}-${a.id}`,
        identitatId: identitat.id,
        identitatMena: identitat.mena,
        identitatNom: identitat.nom,
      }));
    });
  }, [identitats]);

  const facets = useMemo(
    () => [
      {
        id: 'identitat',
        label: 'Identitat',
        options: identitats.map((i) => ({ value: i.id, label: i.nom })),
        getValue: (item) => item?.identitatId,
      },
    ],
    [identitats],
  );

  /* Slot estable: depèn només de coses que ja són estables gràcies al
     context endurit. */
  const renderEditor = useCallback(
    (item) => (
      <DetallAjust
        ajust={item}
        identitat={identitats.find((i) => i.id === item?.identitatId)}
        guardarAjust={guardarAjust}
        guardarCampPerfil={guardarCampPerfil}
        pujaMitja={pujaMitja}
      />
    ),
    [identitats, guardarAjust, guardarCampPerfil, pujaMitja],
  );

  /* El botó "+": el backend ja té createOrganization de punta a punta
     (el comentari del context ho demanava a crits). Amb catch: una
     creació que falla no mor en silenci. */
  const creaOrg = useCallback(async () => {
    try {
      return await creaOrganitzacio();
    } catch (e) {
      console.error("[PerfilShell] No s'ha pogut crear l'organització:", e);
      return null;
    }
  }, [creaOrganitzacio]);

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
        </div>
      </div>
    );
  }

  return (
    <div className="sdp-gestor-pagina">
      <UniversalWorkspace
        items={totsElsAjustos}
        facets={facets}
        facetsTitle="IDENTITATS"
        getItemId={getIdAjust}
        getItemSearchText={getTextAjust}
        getItemCard={getCardAjust}
        initialActiveFacets={FACETS_INICIALS}
        onActionCreate={creaOrg}
        createLabel="NOVA ORG"
        renderEditor={renderEditor}
      />
    </div>
  );
}

export default function PerfilShell() {
  const { externalConfig } = useUI();
  const contentContext = useContent();
  const config = contentContext?.config || externalConfig || {};

  return (
    <>

      <PerfilProvider config={config}>
        <PerfilManagerInner />
      </PerfilProvider>
    </>
  );
}
