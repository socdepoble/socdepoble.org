import { RequireAuth } from '../../app/guards/RequireAuth.jsx';
import { Suspense, lazy, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Eye, Lock, SlidersHorizontal, UserRound } from 'lucide-react';
import { useContent } from '../../components/universal/ContentProvider';
import { useUI } from '../../app/contexts/UIContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useSuperadminEstable } from '../../hooks/useSuperadminEstable.js';
import { Link, useLocation, useSearchParams } from '../../app/contexts/RouterContext';
import { rutaCanonicaDePerfil } from '../../config/navigation.js';
import { Boto } from '../../components/PedraSeca/index.js';
import { DefaultItemCard, UniversalWorkspace } from '../../components/universal/workspace';
import { useDocumentViu } from '../../components/universal/TargetaViva.jsx';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { teCapacitat } from '../../data/backendPort.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { estatDeConnexio, etiquetaDeConnexio } from '../../components/universal/connexio/estatConnexio.js';
import { useEnLinia } from '../../components/universal/connexio/useEnLinia.js';
import { PerfilProvider, usePerfil } from './PerfilContext.jsx';
import { PerfilEditor } from './PerfilEditor.jsx';
import { DetallCompte } from './DetallCompte.jsx';
import { DetallPrivacitat } from './DetallPrivacitat.jsx';
import { DetallVistes } from './DetallVistes.jsx';
import { DetallMultimedia } from './DetallMultimedia.jsx';
import { DetallAdministracio, DetallAplicacio, DetallNodes, DetallSenseOrganitzacions } from './DetallEspai.jsx';
import { DialegNovaOrganitzacio } from './DialegNovaOrganitzacio.jsx';
import { APLICACIONS, aplicacionsValides } from './aplicacions.js';
import { nodesDelPerfil } from './nodes.js';
import {
  ID_ADMINISTRACIO_SISTEMA, PARAM_FITXA_ORGANITZACIO, PARAM_VISTA, TEXTOS_PRIVACITAT_LLISTA, VISTA_COMPTE, VISTA_IMPORTACIO, itemsDAdministracioSistema, itemsDAplicacions, itemsDePerfil, navegacioDePerfil, seleccioInicialDePerfil,
} from './perfilModel.js';
import {
  PanellAjustosVistesColumnes, PanellCromIntegrat, PanellEmpaquetatsDesplegament, PanellNodesFediversResiliencia,
} from './admin/PanellsAdministracioSistema.jsx';
import { ambTextosPerAppIos, esAppNativaIos } from './admin/appNativaIos.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { omple } from '../../config/moderacio.js';
import { useAutodesament } from '../../data/autodesament/useAutodesament.js';
import { documentDeFitxa, fitxaPublicada, menaDeFitxa } from './perfilCamps.js';
import { ENTITATS_FITXA } from './perfilEscriptor.js';
import { avatarDeLaFitxa, potEditarFitxa, rutaDeFitxaPublica } from './fitxaDePerfil.js';
import { textosDeFitxa } from './visibilitatFitxa.js';
/* P1-f (Onada R6 · Bloc 2) · El Laboratori i el Banc porten el tesaurus sencer: només es carreguen en obrir-los. */
const LaboratoriTaxonomiaDoctoral = lazy(() => import('./admin/LaboratoriTaxonomiaDoctoral.jsx'));
const BancImportacioEditorial = lazy(() => import('./admin/BancImportacioEditorial.jsx'));
/* R13-C7 (ordre del Mestre, 08-11-2026) · «👥 Usuaris, Dispositius i Botigues»: el panell i les seues dades, diferits. */
const PanellUsuarisDispositiusBotigues = lazy(() => import('./admin/PanellUsuarisDispositiusBotigues.jsx'));

const PaginaDeLAgent = lazy(() => import('./PerfilPublicSection.jsx').then((modul) => ({ default: modul.PaginaDeLAgent })));

export { ID_ADMINISTRACIO_SISTEMA, itemsDAdministracioSistema, itemsDePerfil };

const p = (nom, reserva) => Object.freeze([`section.perfil.shell.${nom}`, reserva]);
export const TEXTOS_PERFIL_SHELL = Object.freeze({
  categories: p('categories', 'PERFIL'),
  items: p('items', 'APARTATS'),
  create: p('create', 'NOVA ORG'),
  search: p('search', 'Cercar apartats'),
  empty: p('empty', 'No hi ha apartats.'),
  fitxaPublica: Object.freeze(['section.perfil.fitxaPublica', 'Veure fitxa pública']),
  previaPersona: p('previaPersona', 'La pots obrir igualment per a vore com quedarà.'),
  sensePaginaOrganitzacio: p('sensePaginaOrganitzacio', 'La pàgina pública s’obrirà quan la fitxa siga pública.'),
  orgCreadaToast: p('orgCreadaToast', '«{nom}» ja és al teu perfil.'),
  carregant: p('carregant', 'Carregant el teu perfil…'),
  reintenta: p('reintenta', 'Tornar a provar'),
});
const ICONES = { categories: UserRound, items: SlidersHorizontal };

/* AH-02 · A la columna central d'APARTATS del Perfil, totes les files (actives
   o no) es mostren sempre com a fitxa compacta normal (`DefaultItemCard` ·
   `button.sdp-gestor-fitxa` amb `is-active` i `aria-current="true"`), mai com
   a `TargetaViva` desplegada (la Card es previsualitza dins de «Les vistes»).
   Gauntlet 261016 (encàrrec D; pla, Onada 1.1.4: «han de beure exactament de
   la mateixa instància de dades») · La compacta de «La fitxa» porta la imatge
   de la fitxa amb l'esborrany de la cua (avatarDeLaFitxa, fitxaDePerfil.js) i
   el document viu de l'editor, la mateixa que l'editor, «Les vistes» i
   «El compte». */
function FitxaDePerfil({ item, active, onSelect }) {
  const esFitxa = item?.data?.vista === 'fitxa';
  const clau = active && esFitxa ? item.data.identitatId : null;
  const viu = useDocumentViu(clau);
  const { identitats, autodesament } = usePerfil() || {};
  const identitat = esFitxa ? (identitats || []).find((i) => i.id === item.data.identitatId) || null : null;
  const potEditar = potEditarFitxa(identitat);
  const mena = menaDeFitxa(identitat);
  const id = identitat?.id;
  const ref = useMemo(() => (autodesament && potEditar && id != null ? {
    ambit: autodesament.ambit, context: autodesament.context, entitat: ENTITATS_FITXA[mena], id,
  } : null), [autodesament, potEditar, mena, id]);
  const esborrany = useAutodesament(ref).camps;
  const compacta = useMemo(() => {
    if (!identitat) return item;
    const doc = viu?.document || documentDeFitxa(identitat, esborrany);
    const image = doc.heroImage || viu?.autor?.avatar || avatarDeLaFitxa(doc, esborrany, identitat) || undefined;
    const icon = doc.icon || item.icon;
    return image === item.image && icon === item.icon ? item : { ...item, image, icon };
  }, [item, identitat, esborrany, viu]);
  return <DefaultItemCard item={compacta} active={active} onSelect={onSelect} />;
}

const renderFitxa = ({ item, active, onSelect }) => <FitxaDePerfil item={item} active={active} onSelect={onSelect} />;

/* Gauntlet 2 · 261101 (G2-T7-01) · Una fila amb el títol i el subtítol que es
   pinten. La cerca de la columna (workspaceState · filterWorkspaceItems) només
   llig searchText: si el text pintat no és el de sempre (una altra llengua),
   s'hi afig, i buscar el que es veu («privacy») la troba. El de sempre continua
   (buscar «privacitat» també). En valencià, o sense traductor, la fila no canvia. */
function ambTextosTraduits(item, title, subtitle) {
  if (title === item.title && subtitle === item.subtitle) return item;
  const searchText = [item.searchText, title, subtitle].filter(Boolean).join(' ');
  return { ...item, title, subtitle, searchText };
}

export const ETIQUETA_FITXA_PUBLICA = TEXTOS_PERFIL_SHELL.fitxaPublica[1];

export function accesAFitxaPublica(identitat, t = null) {
  if (!identitat) return null;
  const mena = menaDeFitxa(identitat);
  const perfil = mena === 'persona'
    ? { tipus: 'persona', id: identitat.dades?.id, slug: identitat.dades?.slug }
    : mena === 'agent'
      ? { tipus: 'ia', id: identitat.id }
      : { tipus: identitat.mena === 'grup' ? 'grup' : 'entitat', id: identitat.id };
  const ruta = rutaCanonicaDePerfil(perfil) || rutaDeFitxaPublica(identitat);
  if (!ruta) return null;
  if (fitxaPublicada(identitat)) return { ruta, oberta: true, avis: null };
  const { etiqueta, explicacio } = textosDeFitxa(mena, t).privada;
  const persona = mena === 'persona';
  const sufix = tradueix(t, persona ? TEXTOS_PERFIL_SHELL.previaPersona : TEXTOS_PERFIL_SHELL.sensePaginaOrganitzacio);
  return {
    ruta,
    oberta: persona,
    avis: { etiqueta, explicacio: `${explicacio} ${sufix}` },
  };
}

export function AccesFitxaPublica({ identitat, etiqueta }) {
  const id = useId();
  const t = useTraductorOpcional();
  const { showToast } = useToast();
  const acces = accesAFitxaPublica(identitat, t);
  if (!acces) return null;
  const etiquetaResolta = etiqueta ?? tradueix(t, TEXTOS_PERFIL_SHELL.fitxaPublica);
  const idAvis = acces.avis ? `${id}-avis` : undefined;
  return (
    <div className="perfil-fitxa-publica">
      {acces.avis ? (
        <p className="perfil-fitxa-publica__avis" id={idAvis} title={acces.avis.explicacio}>
          <Lock size={20} aria-hidden="true" focusable="false" />
          <span className="perfil-fitxa-publica__estat">{acces.avis.etiqueta}</span>
          <span className="sdp-sr-only">{`: ${acces.avis.explicacio}`}</span>
        </p>
      ) : null}
      {acces.oberta ? (
        <Link className="sdp-boto sdp-boto--secundari perfil-fitxa-publica__boto" to={acces.ruta} aria-describedby={idAvis}>
          <Eye size={20} aria-hidden="true" focusable="false" />
          <span>{etiquetaResolta}</span>
        </Link>
      ) : (
        <Boto
          varietat="secundari"
          icona={Eye}
          className="perfil-fitxa-publica__boto"
          aria-disabled="true"
          aria-describedby={idAvis}
          onClick={() => showToast(acces.avis?.explicacio)}
        >
          {etiquetaResolta}
        </Boto>
      )}
    </div>
  );
}

function PerfilManagerInner({ config, aplicacions, preferides, vista = null, recuperacio = null, connexio, etiquetaFitxaPublica }) {
  const { showToast } = useToast();
  const {
    identitats, contactes, guardarAjust, pujaMitja, creaOrganitzacio, recarrega, carregant, error, ambMembres,
  } = usePerfil();
  /* Ordre del Mestre (261008, membres) · Si el port sap llistar i gestionar
     els membres d'una organització. Fins que el context no ho declare
     (undefined), «El compte» es queda com era. */
  const gestionaMembres = Boolean(ambMembres);

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

  /* T43 (ordre del Mestre, 260928) · En obrir-se, el Perfil mostra
     l'organització demanada per la ruta («Edita la fitxa de {Org}») o la
     que és l'actor actiu; si no és cap de les seues, la persona. */
  const [preferidaRuta, preferidaActor] = preferides || [];
  /* Onada R6 · Bloc 2 (P1-b) · «🛡️ Administració del sistema» i els seus 6
     panells només per a superadmin (la mateixa guarda estable de les
     aplicacions internes): ni el grup, ni els apartats, ni la ruta, ni el detall. */
  const { esSuperadmin: superadminAdmin } = useSuperadminEstable();
  /* P0-63 (261108) · ?vista=compte (RUTA_COMPTE): «El compte» de la persona. */
  const initialSelection = useMemo(
    () => seleccioInicialDePerfil(identitats, [preferidaRuta, preferidaActor], { superadmin: superadminAdmin, vista }),
    [identitats, preferidaRuta, preferidaActor, superadminAdmin, vista],
  );

  /* Encàrrec 261018_1220 (Tasca 1, ordre del Mestre: «recuperar fidelment el
     Workspace de l'usuari i els de les organitzacions») · El Workspace només
     llig initialSelection en muntar-se: canviar d'identitat amb el Perfil obert
     (el calaix, «Actua com a…», una pertinença que arriba després) no hi
     canviava res. La clau és la identitat que s'ha d'obrir i, quan ve del
     calaix o de l'avatar, el número de l'anada (useIdentitatDeLaBarra ·
     espaiIdentitat): triar la mateixa identitat la torna a obrir encara que la
     persona n'haja mirat una altra a la primera columna. Recarregar les dades
     (desar la fitxa, una organització nova) no la canvia. */
  const workspaceKey = JSON.stringify(['perfil', initialSelection.categoryId, recuperacio, ...(initialSelection.itemId ? [initialSelection.itemId] : [])]);

  /* T7 · P1-22 (261101) · «Privacitat i dades» es pinta en la llengua de la
     interfície (TEXTOS_PRIVACITAT_LLISTA); fora de l'app o en valencià, el
     text de sempre. La resta de la fila no canvia; la cerca, vegeu
     ambTextosTraduits (G2-T7-01). */
  const t = useTraductorOpcional();
  /* R13-C7 · Dins de l'app d'iOS (regla 2.3.10), la card «👥 Usuaris, Dispositius i Botigues» no nomena Google. */
  const [appIos] = useState(esAppNativaIos);

  /* Tots els hooks ABANS de cap return condicional (regla de hooks). */
  const grupsNavegacio = useMemo(
    () => navegacioDePerfil(identitats, aplicacions, { superadmin: superadminAdmin }),
    [identitats, aplicacions, superadminAdmin],
  );
  const model = useMemo(() => ({
    status: 'ready',
    itemsComplete: true,
    workspaceKey,
    navigationGroups: grupsNavegacio,
    items: [
      ...itemsDePerfil(identitats, { ambPrivacitat }).map((item) => (item.data?.vista === 'privacitat'
        ? ambTextosTraduits(item, tradueix(t, TEXTOS_PRIVACITAT_LLISTA.titol), tradueix(t, TEXTOS_PRIVACITAT_LLISTA.subtitol))
        : item)),
      ...(superadminAdmin ? itemsDAdministracioSistema().map((item) => (appIos ? ambTextosPerAppIos(item) : item)) : []),
      ...itemsDAplicacions(aplicacions),
    ],
  }), [identitats, aplicacions, ambPrivacitat, workspaceKey, grupsNavegacio, t, superadminAdmin, appIos]);

  /* Slot estable: depèn només de coses que ja són estables gràcies al
     context endurit. */
  const renderDetail = useCallback(({ item }) => {
    const vista = item?.data?.vista;
    /* Onada R6 · Bloc 2 (P1-b) · Un apartat «admin-*» que arribe sense superadmin no es pinta. */
    if (typeof vista === 'string' && vista.startsWith('admin-') && !superadminAdmin) return null;
    if (vista === 'admin-taxonomia') return <DetallAdministracio item={item}><Suspense fallback={null}><LaboratoriTaxonomiaDoctoral /></Suspense></DetallAdministracio>;
    if (vista === 'admin-importacio') return <DetallAdministracio item={item}><Suspense fallback={null}><BancImportacioEditorial /></Suspense></DetallAdministracio>;
    if (vista === 'admin-crom') return <DetallAdministracio item={item}><PanellCromIntegrat /></DetallAdministracio>;
    if (vista === 'admin-vistes-columnes') return <DetallAdministracio item={item}><PanellAjustosVistesColumnes navigationGroups={grupsNavegacio} /></DetallAdministracio>;
    if (vista === 'admin-nodes-fedivers') return <DetallAdministracio item={item}><PanellNodesFediversResiliencia /></DetallAdministracio>;
    if (vista === 'admin-empaquetats') return <DetallAdministracio item={item}><PanellEmpaquetatsDesplegament /></DetallAdministracio>;
    if (vista === 'admin-usuaris-i-dispositius') return <DetallAdministracio item={item}><Suspense fallback={null}><PanellUsuarisDispositiusBotigues /></Suspense></DetallAdministracio>;
    if (vista === 'aplicacio') {
      const aplicacio = aplicacions.find((a) => a.id === item.data.aplicacioId);
      return aplicacio ? <DetallAplicacio key={aplicacio.id} aplicacio={aplicacio} /> : null;
    }
    if (vista === 'sense-organitzacions') {
      return <DetallSenseOrganitzacions persona={identitats.find((i) => i.mena === 'persona')} />;
    }
    const identitat = identitats.find((i) => i.id === item?.data?.identitatId);
    if (!identitat) return null;
    /* Ordre del Mestre (19-10-2026, Fase C, punt 9) · Damunt de cada apartat
       d'una identitat, «Veure fitxa pública» (AccesFitxaPublica). */
    const ambFitxaPublica = (detall) => (
      <>
        <AccesFitxaPublica identitat={identitat} etiqueta={etiquetaFitxaPublica} />
        {detall}
      </>
    );
    if (vista === 'fitxa') return ambFitxaPublica(<PerfilEditor key={identitat.id} identitat={identitat} />);
    /* Ordre del Mestre (261021, prompt 261021_0015, tasca 7) · La pàgina de
       l'agent, la de /iaia: per a la IAIA, amb el Selector de Realitat al peu. */
    if (vista === 'pagina') {
      return ambFitxaPublica(
        <Suspense fallback={null}>
          <PaginaDeLAgent key={identitat.id} identitat={identitat} />
        </Suspense>,
      );
    }
    /* Ordre del Mestre (261008) · la vista A4, la portada i la targeta, fora de l'editor. */
    if (vista === 'vistes') return ambFitxaPublica(<DetallVistes key={identitat.id} identitat={identitat} />);
    /* T9 (261001) · on està connectada la persona: nodes i estat de la connexió. */
    if (vista === 'nodes') {
      return ambFitxaPublica(
        <DetallNodes
          key={identitat.id}
          persona={identitat}
          nodes={connexio.nodes}
          estat={connexio.estat}
          etiquetaEstat={connexio.etiqueta}
        />,
      );
    }
    if (vista === 'privacitat') {
      return ambFitxaPublica(<DetallPrivacitat key={identitat.id} identitat={identitat} config={config} onPerfilCanviat={recarrega} />);
    }
    /* Pla 261018_1605 (Tasca 4, D8) · Les fotos de la persona: la llista i
       l'esborrat van pel port amb la configuració del Perfil.
       Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3) · I les de
       cada actor: una organització (empresa o grup) i un agent IA, també. */
    if (vista === 'multimedia') {
      return ambFitxaPublica(<DetallMultimedia key={identitat.id} identitat={identitat} config={config} />);
    }
    /* P1-11 (pla 261024_2230, T5B-03) · «Membres i connexions» d'una
       organització: el mateix DetallCompte, amb els ajustos del lloc 'membres'. */
    return ambFitxaPublica(
      <DetallCompte
        key={`${identitat.id}-${vista === 'membres' ? 'membres' : 'compte'}`}
        lloc={vista === 'membres' ? 'membres' : 'compte'}
        identitat={identitat}
        guardarAjust={guardarAjust}
        pujaMitja={pujaMitja}
        contacte={contactes?.[String(identitat.id)] || null}
        ambMembres={gestionaMembres}
      />,
    );
  }, [identitats, contactes, aplicacions, config, guardarAjust, pujaMitja, recarrega, connexio, gestionaMembres, etiquetaFitxaPublica, grupsNavegacio, superadminAdmin]);

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
    showToast(omple(tradueix(t, TEXTOS_PERFIL_SHELL.orgCreadaToast), { nom: org.name }), 'success');
  }, [creaOrganitzacio, dialeg, showToast, t]);

  useEffect(() => {
    if (!creada || !identitats.some((identitat) => identitat.id === creada.id)) return;
    creada.resolve?.({ id: `${creada.id}-fitxa` });
    setCreada(null);
  }, [creada, identitats]);

  const etiquetesWorkspace = useMemo(() => ({
    categories: tradueix(t, TEXTOS_PERFIL_SHELL.categories),
    items: tradueix(t, TEXTOS_PERFIL_SHELL.items),
    create: tradueix(t, TEXTOS_PERFIL_SHELL.create),
    search: tradueix(t, TEXTOS_PERFIL_SHELL.search),
    empty: tradueix(t, TEXTOS_PERFIL_SHELL.empty),
  }), [t]);

  /* Abans: pantalla buida i enganyosa mentre carregava. Ara: explícit. */
  if (carregant) {
    return (
      <div className="sdp-gestor-pagina perfil-pagina">
        <p className="perfil-detall-buit">{tradueix(t, TEXTOS_PERFIL_SHELL.carregant)}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sdp-gestor-pagina perfil-pagina">
        <div className="sdp-buit" role="alert">
          <p>{error}</p>
          {/* Sense reintent, la persona perdia també «El compte» i «Privacitat i dades». */}
          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={recarrega}>{tradueix(t, TEXTOS_PERFIL_SHELL.reintenta)}</button>
        </div>
      </div>
    );
  }

  /* .perfil-pagina és l'àmbit dels botons del Perfil (PerfilShell.css): la
     porten les tres eixides, i el diàleg de NOVA ORG en queda dins. */
  return (
    <div className="sdp-gestor-pagina perfil-pagina">
      <UniversalWorkspace
        key={vista === VISTA_IMPORTACIO ? 'perfil-importacio' : vista === VISTA_COMPTE ? 'perfil-compte' : 'perfil'}
        model={model}
        initialSelection={initialSelection}
        /* MD (ordre del Mestre, 261003) · En mòbil, primer PERFIL; amb
           ?organitzacio= a l'entrada («Edita la fitxa de…»), la fitxa, tret
           que la persona torne amb l'Arrere a on l'havia deixada: llavors, el
           nivell on era (nivellMestreDetall.js).
           P0-63 (261108) · Amb ?vista=compte, també el detall: «El compte». */
        mestreDetall={{ clau: 'perfil', element: vista ? `${PARAM_VISTA}=${vista}` : preferidaRuta }}
        labels={etiquetesWorkspace}
        icons={ICONES}
        tagFilter={false}
        collapsibleNavigation={false}
        amagaRodaAjustos={true}
        onCreate={onCreate}
        renderItem={renderFitxa}
        renderDetail={renderDetail}
        className="perfil-espai"
        detailClassName="perfil-espai__detall"
      />
      <DialegNovaOrganitzacio
        key={obertures}
        obert={Boolean(dialeg)}
        onTanca={tanca}
        onCrea={crea}
      />
    </div>
  );
}

const SENSE_NODES_DE_MES = Object.freeze([]);

/**
 * `aplicacions` (opcional): les utilitats d'este node. Per defecte, les
 * d'aplicacions.js; una instància federada hi pot passar les seues.
 * `nodes` (opcional, T9): nodes de més que una instància federada declara;
 * nodes.js els valida i mai els fa actius.
 */
export default function PerfilShell({ aplicacions = APLICACIONS, nodes = SENSE_NODES_DE_MES }) {
  const { externalConfig, status, t } = useUI();
  /* T9 (ordre del Mestre, 261001) · «Els nodes» diu el mateix estat que la
     franja de l'amfitrió (estatConnexio.js): mode remot, última càrrega del
     contingut core i el que diu el dispositiu. Cap petició nova. */
  const enLinia = useEnLinia();
  const modeRemot = useMemo(
    () => normalizeBackendConfig(externalConfig || {}).dataMode === 'remote',
    [externalConfig],
  );
  const nomPoble = externalConfig?.nomPoble;
  const estatConnexio = estatDeConnexio({ modeRemot, status, enLinia });
  const etiquetaConnexio = etiquetaDeConnexio(t, estatConnexio);
  /* Fase C (punt 9) · El nom de «Veure fitxa pública», per l'i18n; sense
     traductor (una peça muntada sola), el del Mestre. */
  const etiquetaFitxaPublica = tradueix(t, TEXTOS_PERFIL_SHELL.fitxaPublica);
  const connexio = useMemo(() => ({
    nodes: nodesDelPerfil({ nomPoble, extra: nodes }),
    estat: estatConnexio,
    etiqueta: etiquetaConnexio,
  }), [nomPoble, nodes, estatConnexio, etiquetaConnexio]);
  const contentContext = useContent();
  const { refresh, actor, error: errorIdentitats } = useIdentitat();
  /* T43 · ?organitzacio=ID (rutaFitxaOrganitzacio) i l'actor actiu, per a
     triar què s'obri primer. */
  const [params] = useSearchParams();
  const preferidaRuta = params?.get?.(PARAM_FITXA_ORGANITZACIO) || null;
  /* P0-63 (261108) · ?vista=compte, «El compte» de la persona; cap altre valor. */
  const vista = params?.get?.(PARAM_VISTA) === VISTA_IMPORTACIO ? VISTA_IMPORTACIO
    : (params?.get?.(PARAM_VISTA) === VISTA_COMPTE || params?.get?.('apartat') === VISTA_COMPTE) ? VISTA_COMPTE : null;
  /* Revisió adversarial (261018) · La clau del Workspace depén de l'actor: si
     una relectura de les pertinences falla (IdentitatContext buida la llista i
     l'actor cau a la persona), es conserva l'organització d'abans i el Perfil
     no salta mentre s'escriu. Ajust en pintar, sense efecte. */
  const actorEntitat = actor?.tipus === 'entitat' && actor?.id != null ? String(actor.id) : null;
  const [preferidaActor, setPreferidaActor] = useState(actorEntitat);
  if (!errorIdentitats && preferidaActor !== actorEntitat) setPreferidaActor(actorEntitat);
  const preferides = useMemo(() => [preferidaRuta, preferidaActor], [preferidaRuta, preferidaActor]);
  /* Encàrrec 261018_1220 · El número de l'anada des del calaix o l'avatar
     (useIdentitatDeLaBarra · CLAU_RECUPERACIO_ESPAI), o null. */
  const { state: estatHistorial } = useLocation();
  const recuperacio = Number.isFinite(estatHistorial?.espaiIdentitat) ? estatHistorial.espaiIdentitat : null;
  const configContingut = contentContext?.config;
  /* Memoitzada: una configuració nova a cada render tornaria a pintar el detall. */
  const config = useMemo(
    () => configContingut || externalConfig || {},
    [configContingut, externalConfig],
  );
  /* Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar definitivament la
     maquinària interna de desenvolupament de l'aside en pantalles d'usuari») ·
     Les utilitats internes (aplicacions.js · `intern`: la Consola de
     Mètriques i el Cervell) només ixen a l'aside APLICACIONS de qui és
     superadmin, el mateix criteri que DetallCompte. Sense proveïdor de sessió
     (una peça muntada sola), ningú no ho és. Una selecció que apuntava a una
     utilitat que ja no es veu la reconcilia l'espai de treball (WorkspaceContext:
     una categoria absent cau a la primera).
     Revisió adversarial del carril D (261016, problema 2) · A cada renovació
     del JWT la sessió torna a comprovar el rol i esSuperadmin val false un
     moment: les internes desapareixien i un superadmin que treballava a les
     Mètriques en queia a la persona. Ara es conserva l'últim rol resolt del
     mateix compte mentre es comprova (useSuperadminEstable). */
  const { esSuperadmin: superadmin } = useSuperadminEstable();
  const utilitats = useMemo(
    () => aplicacionsValides(aplicacions).filter((aplicacio) => !aplicacio.intern || superadmin),
    [aplicacions, superadmin],
  );

  const perfil = (
    <PerfilProvider config={config} onCanviOrganitzacions={refresh}>
      <PerfilManagerInner
        config={config}
        aplicacions={utilitats}
        preferides={preferides}
        vista={vista}
        recuperacio={recuperacio}
        connexio={connexio}
        etiquetaFitxaPublica={etiquetaFitxaPublica}
      />
    </PerfilProvider>
  );
  return vista === VISTA_IMPORTACIO ? <RequireAuth rol="superadmin">{perfil}</RequireAuth> : perfil;
}
