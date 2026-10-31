/**
 * MultimediaSection.jsx — /multimedia, l'Arxiu visual del Mas.
 *
 * IDEA-55 + P1-71 (Onada 261029_1605, Bloc E; ordre del Mestre, 18:35: «igual
 * que la página de diseño o Wiki de Poble pero orientada al trabajo con
 * archivos») · Un UniversalWorkspace de tres columnes, com Disseny i la Wiki:
 *   1. MULTIMÈDIA: la portada («Arxiu Visual i Gestor d’Arxius»), les
 *      galeries publicades (Tots, IAIA, la Cronologia amb un fill per mes) i
 *      «Carpeta local · Volums muntats» amb les subcarpetes del volum actiu.
 *   2. ARXIUS: la vista de la carpeta i els seus arxius (directes), amb la
 *      lupa i l'ordenació del workspace.
 *   3. La pàgina (PaginesEspaiMultimedia.jsx).
 * La URL l'escriu esta secció (?categoria=&item=, i ?foto= per al visor): els
 * valors per defecte no s'hi escriuen i les carpetes i els arxius locals hi
 * van com a ids OPACS (arbreMultimedia.js). Una sola lectura del disc per a
 * les tres columnes (useGestorArxiusLocals.js). Les props només servixen per
 * a les proves: la ruta la munta sense cap.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, CalendarDays, Files, GalleryVerticalEnd, HardDrive, Images, LayoutGrid, Sparkles } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { useMultimedia } from './MultimediaContext';
import { useUIActions, useUIStateOpcional } from '../../app/contexts/UIContext';
import { DialegConfirmacio } from '../../components/PedraSeca/index.js';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace';
import { useSEO } from '../../hooks/useSEO';
import { fusionaMitjans } from './mediaContent.js';
import { agrupaPerMes } from './cronologia.js';
import { origenDe } from './origenImatges.js';
import { useCensImatges } from './useCensImatges.js';
import { VisorDeLArxiu } from './VisorDeLArxiu.jsx';
import { DialegDescartaLocal, InputCarpetaLocal } from './GestorMultimediaLocal.jsx';
import { ICONES_TIPUS_LOCAL, useMiniaturesLocals } from './miniaturesLocals.js';
import { DetallEspaiMultimedia } from './PaginesEspaiMultimedia.jsx';
import { carpetaDeRuta } from './motorMultimediaLocal.js';
import {
  CATEGORIA_PORTADA, GALERIA_CRONOLOGIA, GALERIA_IAIA, GALERIA_TOTS, MAX_MINIATURES_A_LA_LLISTA, PREFIX_MES, TOT,
  construeixCategoriesMultimedia, construeixItemsMultimedia, demandaDeLaUrl, idArxiuLocal, idCarpetaLocal, indexaArbreLocal,
  mateixaSeleccio, mitjansValids, paramsDeSeleccio, seleccioEfectiva
} from './arbreMultimedia.js';
import { TEXTOS_ESPAI as E, calendariDe } from './textosEspaiMultimedia.js';
import { TEXTOS_LOCAL as T, tradueix } from './textosGestorLocal.js';
import { useGestorArxiusLocals } from './useGestorArxiusLocals.js';
import { useNotesData } from '../notes/NotesDataContext';

/* Onada 0.3 (Gauntlet 261016, M04) · La marca de l'entrada de l'historial que
   ha obert el visor (des de la fitxa): tancar-lo és tornar arrere (el botó
   Arrere del navegador fa el mateix). Sense marca (un enllaç directe a
   ?foto=, la redirecció de /multimedia/<id>), tancar lleva la consulta i
   deixa la persona a la fitxa d'eixa foto. */
const MARCA_VISOR = 'sdpVisor';
const CAP = Object.freeze([]);
const MAPA_BUIT = new Map();
const CANCELA = ['common.cancela', 'Cancel·lar'];
const ICONES = Object.freeze({
  portada: GalleryVerticalEnd,
  tots: Images,
  iaia: Sparkles,
  cronologia: CalendarDays,
  mes: Calendar,
  local: HardDrive,
  vista: LayoutGrid,
  tipus: ICONES_TIPUS_LOCAL
});

const indexDe = (llista, id) => (id == null ? -1 : llista.findIndex((item) => String(item?.id) === id));
const esImatgeLocal = (el) => el.vista === 'imatge' || el.vista === 'svg';

export default function MultimediaSection({ magatzemCarpetes = null, entorn = globalThis, cripto = globalThis.crypto } = {}) {
  const { status, mediaItems, mediaTimelineGroups } = useMultimedia();
  const { t } = useUIActions();
  /* Revisió adversarial del 261016 · Els mesos de la Cronologia, en la
     llengua activa (abans, sempre en ca-ES). Sense UIProvider, el de sèrie. */
  const locale = useUIStateOpcional()?.locale || 'ca-ES';
  const [vistaWeb, setVistaWeb] = useState('graella');
  const [searchParams, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  /* IDEA-55 (Onada 261029_1605) · «Enviar al Bloc de Notes» des del Gestor
     d'arxius locals, per la via del Xat: creaNota i després /notes?nota=…
     Sense proveïdor (o sense sessió), canCreate és fals i el botó ho diu. */
  const { creaNota, canCreate } = useNotesData();
  const blocDeNotes = useMemo(() => ({
    potCrear: Boolean(canCreate),
    crea: creaNota,
    obri: (id) => navigate(`/notes?nota=${encodeURIComponent(String(id))}`)
  }), [canCreate, creaNota, navigate]);

  /* Onada 0.3 (Gauntlet 261016, M03) · El cens de public/assets
     (censImatges.js), carregat només ací: darrere dels mitjans del port i de
     les fotos vives, les imatges que encara no hi són. Mentre el port
     carrega, encara no: la graella no salta quan arriben. Amb els àlies del
     cens (revisió adversarial del 261016): una còpia que porta el port compta
     com el seu original, i el cens no hi torna a afegir la mateixa foto. */
  const { mitjans: delCens, cens, alies, llest: censLlest = true } = useCensImatges();
  const totes = useMemo(
    () => (delCens.length && status !== 'loading' ? fusionaMitjans(mediaItems, delCens, { alies }) : mediaItems),
    [mediaItems, delCens, alies, status]
  );
  /* Onada 0.3 (I35) · La Cronologia del proveïdor (cronologia.js) i, amb el
     cens, la mateixa regla sobre tot el que es pinta: les imatges sense data
     van al grup «Sense data», l'últim. */
  const timelineGroups = useMemo(
    () => (totes === mediaItems ? (mediaTimelineGroups || []) : agrupaPerMes(totes, { locale })),
    [totes, mediaItems, mediaTimelineGroups, locale]
  );
  /* Requisit del Mestre (261007) · L'apartat «IAIA»: les imatges d'IA
     (origenImatges.js · origenDe). */
  const deLaIaia = useMemo(() => totes.filter((item) => origenDe(item, cens) === 'ia'), [totes, cens]);

  /* Onada 8 (261009) · Sense `image`: useSEO no passa cap SVG a les xarxes i
     ja hi posava la imatge base. El <head> és el mateix. Bloc E · Constant:
     cap nom de fitxer ni de carpeta local arriba mai a document.title. */
  useSEO({
    title: t('section.multimedia.title', 'Arxiu visual'),
    description: t('section.multimedia.subtitle', 'Galeria d’imatges i cronologia visual del projecte.')
  });

  /* ── El catàleg publicat (ids nets i únics: cap clau repetida a la llista) ── */
  const cataleg = useMemo(
    () => ({ totes: mitjansValids(totes), deLaIaia: mitjansValids(deLaIaia), grupsMes: timelineGroups }),
    [totes, deLaIaia, timelineGroups]
  );
  const perId = useMemo(() => new Map(cataleg.totes.map((m) => [String(m.id), m])), [cataleg.totes]);
  const catalegLlest = status !== 'loading' && censLlest;

  /* ── Els textos del model, una vegada per llengua ── */
  const tr = useCallback((parell, valors) => tradueix(t, parell, valors), [t]);
  const textosModel = useMemo(() => ({
    titol: t('section.multimedia.title', 'Arxiu visual'),
    senseData: t('section.multimedia.senseData', 'Sense data'),
    portada: tr(E.portada),
    portadaSubtitol: tr(E.portadaSubtitol),
    galeriaTots: tr(E.galeriaTots),
    galeriaIaia: tr(E.galeriaIaia),
    cronologia: tr(E.cronologia),
    local: tr(E.local),
    vistaCarpeta: tr(E.vistaCarpeta),
    imatges: tr(E.imatges),
    imatgesUn: tr(E.imatgesUn),
    arxius: tr(E.arxius),
    arxiusUn: tr(E.arxiusUn),
    /* Gauntlet 261029 (i18n) · Els mesos de reserva si el navegador no porta la llengua (eu i gl a Chrome). */
    calendari: calendariDe(tr),
    document: tr(E.document),
    senseTitol: tr(E.senseTitol),
    llistaRetallada: tr(E.llistaRetallada),
    insignies: {
      publicada: tr(T['insignia.publicada']),
      bessonaWebp: tr(T['insignia.bessona']),
      inedita: tr(T['insignia.inedita']),
      pesAlt: tr(T['insignia.pesAlt']),
      duplicada: tr(T['insignia.duplicada']),
      possibleDuplicat: tr(T['insignia.possible'])
    }
  }), [t, tr]);
  /* Gauntlet 261029 (cicle 1, i18n; WCAG 3.1.2) · Totes les etiquetes de
     l'espai de treball que es veuen o es llegixen a /multimedia, traduïdes:
     abans només en passava cinc i la resta («Tot», la roda, el chevron de
     les carpetes, el menú d'ordenar…) quedava en valencià en les altres
     llengües. Sense «crear» ni «recompte»: ací no se'n pinta cap. */
  const etiquetesEspai = useMemo(() => ({
    categories: tr(E.categories),
    items: tr(E.items),
    select: tr(E.tria),
    search: tr(E.cerca),
    empty: tr(E.buit),
    /* Gauntlet 261029 (cicle 1) · Amb una cerca que no troba res, no «Esta carpeta no té cap arxiu». */
    noResults: tr(E.senseCoincidencies),
    all: tr(E.tot),
    settings: tr(E.ajustos),
    back: tr(E.torna),
    loading: tr(E.carregant),
    error: tr(E.error),
    retry: tr(E.reintenta),
    close: tr(E.tanca),
    clear: tr(E.neteja),
    tags: tr(E.etiquetes),
    expand: tr(E.desplega),
    collapse: tr(E.plega),
    sort: tr(E.ordena),
    sortTitle: tr(E.ordenaTitol),
    sortDate: tr(E.ordenaData),
    sortName: tr(E.ordenaNom)
  }), [tr]);

  /* ── El Gestor d'arxius locals: una sola lectura del disc per a les tres columnes ── */
  const seleccioRef = useRef(null);
  /* El gestor diu on ha d'anar la selecció local (després d'una operació,
     d'un volum tancat o d'una eixida de la sessió): una sola crida a
     setParams, amb replace, i ids opacs. */
  const seguixLocal = useCallback((canvi) => {
    if (canvi?.portada) {
      setParams({ categoria: null, item: null }, { replace: true });
      return;
    }
    const actual = seleccioRef.current || { carpeta: '', ruta: null };
    const ruta = canvi?.ruta !== undefined ? canvi.ruta : actual.ruta;
    const carpeta = typeof ruta === 'string' ? carpetaDeRuta(ruta) : (canvi?.carpeta !== undefined ? canvi.carpeta : actual.carpeta);
    const sal = canvi?.sal ?? null;
    setParams({
      categoria: idCarpetaLocal(sal, carpeta || ''),
      item: typeof ruta === 'string' ? idArxiuLocal(sal, ruta) : null
    }, { replace: true });
  }, [setParams]);
  const gestor = useGestorArxiusLocals({
    cens, mitjansWeb: totes, t, magatzemCarpetes, entorn, cripto, seleccioRef, onSeleccio: seguixLocal
  });
  const index = useMemo(
    () => (gestor.volumObert ? indexaArbreLocal({ sal: gestor.sal, carpetes: gestor.carpetes, elements: gestor.analisi.elements }) : null),
    [gestor.volumObert, gestor.sal, gestor.carpetes, gestor.analisi.elements]
  );

  /* ── La selecció efectiva, de la URL ── */
  const url = { categoria: searchParams.get('categoria'), item: searchParams.get('item'), foto: searchParams.get('foto') };
  const efectiva = seleccioEfectiva(url, { index, idsCataleg: perId, catalegLlest });
  seleccioRef.current = efectiva.local;
  const demanda = demandaDeLaUrl(url);
  /* El patró esperaElRol de la Wiki: 'loading' NOMÉS si la URL demana una cosa
     que encara no hi pot ser (el catàleg o un id local abans d'obrir el
     volum); així el workspace no la dona per absent ni reescriu la URL. */
  const estatModel = (demanda.cataleg && !catalegLlest) || (demanda.localProfund && !gestor.arrencadaLlesta) ? 'loading' : 'ready';
  const carpetaActiva = index && efectiva.local ? efectiva.local.carpeta : null;
  const rutaSeleccionada = efectiva.local?.ruta ?? null;

  /* ── Les miniatures de la Columna 2: les 48 imatges més recents de la carpeta ── */
  const imatgesDeLaLlista = useMemo(() => {
    if (!index || carpetaActiva === null) return CAP;
    return (index.directes.get(carpetaActiva) || [])
      .filter(esImatgeLocal)
      .sort((a, b) => (Number(b.modificat) || 0) - (Number(a.modificat) || 0))
      .slice(0, MAX_MINIATURES_A_LA_LLISTA);
  }, [index, carpetaActiva]);
  const miniaturesCrues = useMiniaturesLocals(gestor.font, imatgesDeLaLlista);
  /* Un mapa de miniatures només val per a la llista (i la font) que l'ha fet:
     quan canvien, el pintat d'eixe moment ja no en mostra cap, i el registre
     vell es revoca DESPRÉS (cap <img> amb un blob: revocat). */
  const clauMiniatures = imatgesDeLaLlista.map((el) => `${el.ruta}\u0000${el.mida}\u0000${el.modificat}`).join('\u0001');
  const miniaturesRef = useRef({ mapa: null, clau: null, font: null });
  if (miniaturesRef.current.mapa !== miniaturesCrues) {
    miniaturesRef.current = { mapa: miniaturesCrues, clau: clauMiniatures, font: gestor.font };
  }
  const miniatures = miniaturesRef.current.clau === clauMiniatures && miniaturesRef.current.font === gestor.font
    ? miniaturesCrues : MAPA_BUIT;

  /* ── El model: dependències estretes (ni el progrés de l'SHA-256 ni els missatges) ── */
  const categories = useMemo(
    () => construeixCategoriesMultimedia({ grupsMes: timelineGroups, index, textos: textosModel, icones: ICONES, locale }),
    [timelineGroups, index, textosModel, locale]
  );
  const items = useMemo(() => construeixItemsMultimedia({
    cataleg, index, elements: gestor.analisi.elements, nomVolum: gestor.nomVolum, carpetaActiva, rutaSeleccionada,
    miniatures, exactes: gestor.exactes, textos: textosModel, icones: ICONES, locale
  }), [cataleg, index, gestor.analisi.elements, gestor.nomVolum, carpetaActiva, rutaSeleccionada, miniatures, gestor.exactes, textosModel, locale]);
  const model = useMemo(
    () => ({ status: estatModel, itemsComplete: true, workspaceKey: 'multimedia', categories, items }),
    [estatModel, categories, items]
  );
  const seleccio = useMemo(
    () => ({ categoryId: efectiva.categoryId, itemId: efectiva.itemId }),
    [efectiva.categoryId, efectiva.itemId]
  );
  const [seleccioInicial] = useState(() => ({ categoryId: efectiva.categoryId, itemId: efectiva.itemId }));

  /* La tria de la persona (push) o la reconciliació (replace). La que ja és
     l'efectiva no escriu res: ?foto= i les vistes per defecte no embruten la URL. */
  const handleSelectionChange = (sel, meta) => {
    if (mateixaSeleccio(sel, seleccio)) return;
    const push = meta?.reason === 'user' || meta?.reason === 'create';
    setParams(paramsDeSeleccio(searchParams, sel), { replace: !push });
  };
  /* Navegar des de la columna del detall (una cel·la, una tessel·la, l'Accés ràpid): push.
     Focus (Gauntlet 261029, cicle 1; WCAG 2.4.3) · La pàgina nova substituïx
     la que tenia el botó, i el focus queia a <body> (el lector no anunciava
     res). Quan l'H1 de la pàgina nova es munta (refTitol, un ref de
     callback), si el focus s'ha perdut, hi va, sense desplaçar res. Una
     navegació que no canvia de pàgina, o un focus que encara és viu, no es toca. */
  const focusAlTitol = useRef(false);
  const navega = (categoryId, itemId = null) => {
    focusAlTitol.current = true;
    setParams(paramsDeSeleccio(searchParams, { categoryId, itemId }), { replace: false });
  };
  const refTitol = useCallback((node) => {
    if (!node || !focusAlTitol.current) return;
    focusAlTitol.current = false;
    const actiu = node.getRootNode?.()?.activeElement ?? null;
    if (actiu && actiu !== node.ownerDocument?.body && actiu.isConnected) return;
    node.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    focusAlTitol.current = false;
  }, [efectiva.categoryId, efectiva.itemId]);

  /* ── Les galeries publicades ── */
  const membresDe = (categoria) => {
    if (categoria === GALERIA_TOTS || categoria === TOT) return cataleg.totes;
    if (categoria === GALERIA_IAIA) return cataleg.deLaIaia;
    if (categoria === GALERIA_CRONOLOGIA) return mitjansValids(timelineGroups.flatMap((grup) => grup.items));
    if (typeof categoria === 'string' && categoria.startsWith(PREFIX_MES)) {
      return mitjansValids(timelineGroups.find((grup) => `${PREFIX_MES}${grup.key}` === categoria)?.items || CAP);
    }
    return null;
  };
  const etiquetaDe = (categoria) => categories.find((c) => c.id === categoria)?.label ?? categoria;

  /* ── El visor (?foto=): les fotos de la galeria activa o, si no hi és, de tot l'Arxiu ── */
  const fotoId = searchParams.get('foto');
  const llistaGaleria = membresDe(efectiva.categoryId);
  const enLaVista = llistaGaleria ? indexDe(llistaGaleria, fotoId) : -1;
  const llistaVisor = enLaVista >= 0 ? llistaGaleria : cataleg.totes;
  const indexVisor = enLaVista >= 0 ? enLaVista : indexDe(cataleg.totes, fotoId);
  /* ?foto=<id> amb una entrada nova a l'historial: el botó Arrere tanca el visor. */
  const obriVisor = (item) => setParams({ foto: String(item.id) }, { replace: false, state: { [MARCA_VISOR]: true } });
  /* Gauntlet 261029 (cicle 1) · Tancar és idempotent fins que la ubicació
     canvia: un Escape que arriba amb el <dialog> obert sense activació (Avant,
     F5) donava dos avisos i dos navigate(-1), i la persona eixia de l'Arxiu. */
  const tancantVisor = useRef(false);
  useEffect(() => {
    tancantVisor.current = false;
  }, [location]);
  const tancaVisor = () => {
    if (tancantVisor.current) return;
    tancantVisor.current = true;
    if (location.state?.[MARCA_VISOR]) navigate(-1);
    else {
      setParams({
        foto: null,
        categoria: efectiva.categoryId === CATEGORIA_PORTADA ? GALERIA_TOTS : efectiva.categoryId,
        item: fotoId
      }, { replace: true });
    }
  };
  /* Anterior i següent substituïxen l'entrada: Arrere continua tancant. */
  const canviaVisor = (nou) => {
    const item = llistaVisor[nou];
    if (item) setParams({ foto: String(item.id) }, { replace: true, state: location.state ?? null });
  };

  /* ── QA-A04 · Text sense desar en un arxiu que ja no és el triat: l'editor
     es queda (DetallEspaiMultimedia) i es pregunta. Cancel·lar hi torna. ── */
  const idCarpeta = (ruta) => index?.idDeCarpeta.get(ruta || '') ?? idCarpetaLocal(gestor.sal, ruta || '');
  const idArxiu = (ruta) => index?.idDArxiu.get(ruta) ?? idArxiuLocal(gestor.sal, ruta);
  const elBrut = gestor.rutaBruta ? gestor.elementDe(gestor.rutaBruta) : null;
  const congelat = Boolean(elBrut) && rutaSeleccionada !== elBrut.ruta;
  const tornaAlBrut = () => {
    if (!elBrut) return;
    setParams({ categoria: idCarpeta(elBrut.carpeta), item: idArxiu(elBrut.ruta), foto: null }, { replace: true });
  };

  const espai = {
    t, locale, gestor, index, seleccio: efectiva, textosModel, cataleg, cens, blocDeNotes, vistaWeb, setVistaWeb,
    navega, obriVisor, visorObert: indexVisor >= 0, membresDe: (c) => membresDe(c) || CAP, etiquetaDe,
    mitjaDe: (id) => perId.get(String(id)) || null, idCarpeta, idArxiu, refTitol
  };

  return (
    <>
      <UniversalWorkspace
        collapsibleNavigation={false}
        sortable
        /* MD · En mòbil, primer MULTIMÈDIA; amb ?item= (o ?foto=) a l'entrada,
           la pàgina, tret que siga el que hi havia quan la persona va deixar
           l'Arxiu (nivellMestreDetall.js). Els ids locals són opacs. */
        mestreDetall={{ clau: 'multimedia', element: searchParams.get('item') ?? searchParams.get('foto') }}
        model={model}
        initialSelection={seleccioInicial}
        selection={seleccio}
        onSelectionChange={handleSelectionChange}
        labels={etiquetesEspai}
        icons={{ categories: GalleryVerticalEnd, items: Files }}
        renderDetail={() => <DetallEspaiMultimedia espai={espai} />}
      />
      <InputCarpetaLocal gestor={gestor} />
      <DialegDescartaLocal gestor={gestor} t={t} />
      {congelat ? (
        <DialegConfirmacio
          obert
          destructiu
          titol={tr(T['text.descartaTitol'])}
          descripcio={tr(T['text.descartaText'])}
          etiquetaConfirma={tr(T['text.descarta'])}
          etiquetaCancela={tr(CANCELA)}
          onTanca={tornaAlBrut}
          onConfirma={gestor.descartaCanvis}
        />
      ) : null}
      {/* Ordre del Mestre (30-10-2026, prompt 2208, T4.2) · Només l'Arxiu diu «No té cap enllaç públic d’este lloc». */}
      <VisorDeLArxiu llista={llistaVisor} index={indexVisor} cens={cens} onTanca={tancaVisor} onCanvi={canviaVisor} avisSenseEnllac />
    </>
  );
}
