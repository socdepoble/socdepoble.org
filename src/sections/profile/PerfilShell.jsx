import { useCallback, useMemo } from 'react';
import { useContent } from '../../components/universal/ContentProvider';
import {
  PerfilProvider,
  usePerfil,
  ajustosPersona,
  ajustosOrganitzacio,
} from './PerfilContext.jsx';
import DetallAjust from './DetallAjust.jsx';
import { useUI } from '../../app/contexts/UIContext';
import { UniversalWorkspace } from '../../components/universal/workspace';
import { UserRound, Building2, Lock } from 'lucide-react';
import { showToast } from '../../components/universal/AvisadorEfimer.jsx';

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

const getTextAjust = (item) => item?.titol || '';

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

  const model = useMemo(() => {
    const navigationGroups = [{
      id: 'identitats',
      label: 'IDENTITATS',
      options: identitats.map((i, idx) => ({ id: i.id, label: i.nom, order: idx }))
    }];

    const items = totsElsAjustos.map((ajust) => {
      const card = getCardAjust(ajust);
      return {
        id: String(ajust.uniqueId),
        categoryIds: [String(ajust.identitatId)],
        title: card.titol || '',
        subtitle: card.subtitol || '',
        image: card.imatge,
        icon: card.icona,
        searchText: getTextAjust(ajust),
        data: ajust
      };
    });

    return {
      status: 'ready',
      navigationGroups,
      items
    };
  }, [identitats, totsElsAjustos]);

  /* Slot estable: depèn només de coses que ja són estables gràcies al
     context endurit. */
  const renderDetail = useCallback(
    ({ item }) => (
      <DetallAjust
        ajust={item.data}
        identitat={identitats.find((i) => i.id === item.data?.identitatId)}
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
      const org = await creaOrganitzacio();
      return org ? { id: `${org.id}-nom` } : null;
    } catch (e) {
      console.error("[PerfilShell] No s'ha pogut crear l'organització:", e);
      showToast("No s'ha pogut crear l'organització", "error");
      throw e;
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
        model={model}
        initialSelection={{ categoryId: 'jo' }}
        labels={{ categories: 'IDENTITATS', create: 'NOVA ORG' }}
        onCreate={creaOrg}
        renderDetail={renderDetail}
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
