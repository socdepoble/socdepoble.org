/**
 * ControlsAdjunt.jsx — les fotos, els vídeos i les notes de veu del xat.
 *
 *   · Pla 261028_1526 (P1-66, barra única del compositor) · Ací viu l'estat
 *     dels adjunts, però els botons són a la barra del Compositor, que es
 *     munta com a fill (render-prop: `children(adjunts)`), sempre al mateix
 *     lloc: el textarea no es torna a muntar quan els adjunts arriben o se'n
 *     van. El + obri el menú (només el que funciona: «Fotos i vídeos» i, en
 *     tàctil, «Càmera», amb la quota al peu) i el botó redó grava, atura i
 *     envia el fitxer. La safata de damunt (alerta, pendents, previsualització,
 *     peu, avís d'ubicació, progrés, rellotge i Cancel·la) només ocupa lloc
 *     mentre té alguna cosa a fer.
 *   · Amb `actiu` fals (convidats, llavor, IAIA, només lectura, bloquejats)
 *     no es llig la quota ni es pren res del menú «Compartir»: el Compositor
 *     ix sense adjunts, com sempre.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Camera, FileText, ImagePlus, MapPin, Mic, RefreshCw, Send, Square, X } from 'lucide-react';
import { descartaAdjuntXat, quotaXat, teCapacitat } from '../../../data/backendPort.js';
import { errorAdjuntXat } from '../../../data/xatMultimedia.js';
import { getRuntimePolicy } from '../../../config/runtimePolicy.js';
import { CONSULTA_TACTIL } from '../../../hooks/useBarresAmbScroll.js';
import { MAX_VEU_MS, amagaUbicacioAdjunt, gravaVeu, mimeDeGravacio, preparaAdjunt, textDErrorAdjunt } from '../adjuntLocal.js';
import { normalitzaLlenguaXat, textXatV1225 } from '../i18nVistesXatV1225.js';
import { PrevisualitzacioAdjunt, callaVeuActiva, tempsDeVeu, traductorAdjunt } from './AdjuntXat.jsx';
import { ID_MENU_ADJUNTS, LIMIT_TEXT } from './Compositor.jsx';
import useCompartitPendent from '../useCompartitPendent.js';
import { alliberaFitxerCompartit, prenFitxerCompartit, tornaFitxerCompartit } from '../../../config/compartirNatiu.js';

const PORT = { quotaXat, teCapacitat, descartaAdjuntXat };
const ACCEPTA_GALERIA = 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.avif,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov';
const ACCEPTA_DOCUMENTS = '.pdf,.csv,.txt,.odt,.docx,application/pdf,text/csv,text/plain,application/vnd.oasis.opendocument.text,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
/* Gauntlet 261022_0225 (crítica Claude, MEDIA-10) · Sense la capacitat o sense
   la migració, el xat es veu com abans: cap panell ni cap alerta. */
const SENSE_PANELL = new Set(['sense-capacitat', 'SDP-XAT-001']);
/* Gauntlet 261022_0225 (crítica Claude, ADV-MEDIA-4) · L'última quota llegida
   de cada persona, per port. Conversa munta uns controls nous a cada fil: amb
   la desada, el panell hi és des del primer frame i la llista no s'encongix
   quan torna la lectura, que continua en segon pla. Un node que diu que no té
   adjunts l'oblida, i sense cap lectura bona no hi ha panell (MEDIA-10). */
const QUOTES_DESADES = new WeakMap();
/* XAT-07 · Els dos avisos de la gravació abans del sostre (segons que queden):
   la regió viva només canvia ací, mai a cada segon del rellotge. */
const AVISOS_GRAVACIO = Object.freeze({ minut: 60, final: 10 });
function quotesDe(servei) {
  let desades = QUOTES_DESADES.get(servei);
  if (!desades) { desades = new Map(); QUOTES_DESADES.set(servei, desades); }
  return desades;
}
/* v1.2.23 · X2 (ordre del Mestre 261123) · La crònica R32.41 diu que, si el telèfon talla la gravació, «es guarda la
   veu que ja s'havia recollit». Des del kit Codex R32.44, gravaVeu (adjuntLocal.js) no la resol com una nota: rebutja
   amb l'error 'gravacio' i la porta a `recuperacio` (incompleta, duradaMs null, duradaCapturaMs = el rellotge de la
   captura). Ací torna a ser, com a la v1.2.22, la nota preparada: es pot escoltar i, si la persona vol, enviar.
   Es pot enviar, i no només escoltar: la durada és la de la captura arrodonida a un enter positiu (validaAdjuntXat i
   el `durada_ms > 0` de l'àudio al servidor, que la declara el client), el mateix rellotge que una nota sencera
   (`acaba` d'adjuntLocal.js), i el reproductor la canvia per la real quan el navegador la sap (AdjuntXat.jsx,
   duradaReal). La crònica R32.17 («un fitxer tallat … no s'envia») continua certa: el port torna a validar el
   contenidor abans de pujar-lo (validaFitxerMedia a data/supabase/xatMultimedia.js, validaContenidorMedia a
   data/xatMultimediaXifrat.js), i uns bytes tallats a mig tros no ixen. Només viatja la forma d'una nota sencera
   ({ id, fitxer, tipus, duradaMs }): ni `incompleta` ni `duradaCapturaMs` no arriben al port. */
function veuRecuperada(error) {
  const recuperada = error?.code === 'gravacio' ? error.recuperacio : null;
  if (recuperada?.tipus !== 'veu' || !(recuperada.fitxer instanceof Blob) || !recuperada.fitxer.size) return null;
  const captura = Number(recuperada.duradaCapturaMs);
  if (!Number.isFinite(captura) || captura <= 0) return null;
  return {
    adjunt: { id: recuperada.id || crypto.randomUUID(), fitxer: recuperada.fitxer, tipus: 'veu', duradaMs: Math.max(1, Math.round(captura)) },
    aturada: recuperada.aturada ?? null
  };
}

export default function ControlsAdjunt({ fil, onEnvia, onTextOrfe = null, triaFitxerRef = null, servei = PORT, externalConfig, usuariId, t: tProp, locale = 'ca-ES', actiu = true, permetDocuments = null, children = null }) {
  const t = traductorAdjunt(tProp);
  // La cau és de la persona EN ESTE backend i poble, no del seu UUID a soles.
  // No valida el port des del render: la quota continua passant pel servei.
  const base = getRuntimePolicy(true)?.backendConfig || {};
  const clauQuota = JSON.stringify([
    externalConfig?.backendId ?? base.backendId ?? 'supabase',
    externalConfig?.backend_url ?? externalConfig?.backendUrl ?? externalConfig?.supabaseUrl ?? base.backendUrl ?? base.supabaseUrl ?? '',
    externalConfig?.tenant_id ?? externalConfig?.tenantId ?? base.tenantId ?? null,
    externalConfig?.dataMode ?? base.dataMode ?? 'remote', String(usuariId ?? '')
  ]);
  const [quota, setQuota] = useState(() => quotesDe(servei).get(clauQuota) ?? null);
  const [errorQuota, setErrorQuota] = useState(null);
  const [intentQuota, setIntentQuota] = useState(0);
  const [error, setError] = useState(null);
  const [preparat, setPreparat] = useState(null);
  /* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · { id, error }: la persona ha demanat «Amaga el lloc» per a eixe
     preparat i no s'ha pogut netejar (un vídeo amb so que el navegador no sap netejar). No s'envia brut fins que tria
     «Conserva el lloc» o cancel·la. */
  const [llocNoAmagat, setLlocNoAmagat] = useState(null);
  /* { idAmagat, original }: el preparat amb el lloc, per a tornar-hi amb «Conserva el lloc» després d'amagar-lo. */
  const ambLlocRef = useRef(null);
  const [url, setUrl] = useState(null);
  // null, 'tria' (preparant la foto o el vídeo) o 'grava' (el micròfon).
  const [ocupat, setOcupat] = useState(null);
  const [gravant, setGravant] = useState(false);
  const [segonsGravats, setSegonsGravats] = useState(0);
  // { id, motiu }: la nota que s'ha aturat sola ('temps' o 'mida').
  const [aturada, setAturada] = useState(null);
  const [pujant, setPujant] = useState(false);
  // null sense enviament; { fraccio: null } fins al primer byte; { fraccio: 0..1 }.
  const [progres, setProgres] = useState(null);
  const [progresCompressio, setProgresCompressio] = useState(null);
  /* El peu propi de «Compartir» es conserva; en enviar una foto o un vídeo
     s'hi suma el camp principal. Les notes de veu no porten peu. */
  const [peu, setPeu] = useState('');
  const [deCompartir, setDeCompartir] = useState(false);
  const selector = useRef(null);
  const selectorCamera = useRef(null);
  const selectorDocuments = useRef(null);
  const operacio = useRef(null);
  const revisioContext = useRef(0);
  const lecturaQuotaRef = useRef(0);
  // La guarda és síncrona: dos gestos abans del següent render només envien una volta.
  const pujadaRef = useRef(null);
  // Després d'un ACK incert, la ubicació i el binari del mateix ID són immutables.
  const intentEnviamentRef = useRef(null);
  // Canviar de fil pot tornar un Compartir al lot; «Cancel·la» el descarta.
  const cancelladesRef = useRef(new WeakSet());
  const gravadora = useRef(null);
  const viu = useRef(true);
  const contenidor = useRef(null);
  /* P1-66 · El + i el botó redó són del Compositor: les refs hi viatgen dins d'`adjunts`. */
  const botons = { adjunta: useRef(null), primari: useRef(null), cancella: useRef(null) };
  /* Gauntlet 261026_1615 (Codex C1615-02/03, Gemini G1615-04) · El fitxer del
     menú «Compartir» que té el compositor encara és del lot: si no s'envia (la
     conversa es tanca, la preparació s'avorta) torna al registre, i la seua
     còpia nativa només s'allibera quan s'envia o la persona el cancel·la. */
  const enMaRef = useRef(null);
  /* El que s'està prenent (la presa en curs, o null): la guarda de l'efecte. */
  const prenentRef = useRef(null);
  /* El que s'està enviant: si la conversa es tanca mentre puja, no torna al
     lot (el port pot haver-lo publicat ja); ho decidix el final de l'enviament. */
  const enviantRef = useRef(null);
  const tornaEnMa = () => { const pres = enMaRef.current; enMaRef.current = null; if (pres) tornaFitxerCompartit(pres); };
  const alliberaEnMa = () => { const pres = enMaRef.current; enMaRef.current = null; if (pres) alliberaFitxerCompartit(pres); };
  const origen = useRef('tria');
  const idAvis = useId();

  useEffect(() => {
    viu.current = true;
    return () => { viu.current = false; operacio.current?.abort(); gravadora.current?.cancella(); };
  }, []);
  useEffect(() => {
    revisioContext.current += 1;
    lecturaQuotaRef.current += 1;
    operacio.current?.abort(); gravadora.current?.cancella(); gravadora.current = null;
    operacio.current = null; pujadaRef.current = null; intentEnviamentRef.current = null; ambLlocRef.current = null;
    setPreparat(null); setGravant(false); setOcupat(null); setPujant(false); setProgres(null); setProgresCompressio(null); setError(null); setPeu(''); setDeCompartir(false);
    setLlocNoAmagat(null);
    /* P1-66 · L'error de la quota es queda fins que arriba una lectura nova:
       «Torna-ho a provar» (al menú del +) no fa desaparéixer el + ni li pren
       el focus mentre es torna a llegir. */
    setQuota(quotesDe(servei).get(clauQuota) ?? null);
    return () => { operacio.current?.abort(); gravadora.current?.cancella(); tornaEnMa(); prenentRef.current = null; };
  }, [servei, clauQuota, fil.id, actiu]);
  /* Una renovació del testimoni o un reintent de quota no cancel·la el fitxer
     preparat ni una pujada. Només el canvi de context de dalt ho fa. */
  useEffect(() => {
    const controller = new AbortController();
    if (!actiu || !servei.teCapacitat('xatMultimedia')) return undefined;
    const lectura = ++lecturaQuotaRef.current;
    servei.quotaXat({ ...externalConfig, signal: controller.signal })
      .then((q) => { if (!controller.signal.aborted && lecturaQuotaRef.current === lectura) { quotesDe(servei).set(clauQuota, q); setQuota(q); setErrorQuota(null); } })
      .catch((e) => {
        if (controller.signal.aborted || e?.name === 'AbortError' || lecturaQuotaRef.current !== lectura) return;
        if (SENSE_PANELL.has(String(e?.code ?? ''))) quotesDe(servei).delete(clauQuota);
        setErrorQuota(e);
      });
    return () => controller.abort();
  }, [servei, externalConfig, clauQuota, fil.id, intentQuota, actiu]);
  /* XAT-07 · El rellotge de la gravació, des que el micròfon ja grava. Compta
     segons sencers: amb el mateix segon, React no torna a pintar. */
  useEffect(() => {
    if (!gravant) return undefined;
    const inici = Date.now();
    const rellotge = setInterval(() => setSegonsGravats(Math.floor((Date.now() - inici) / 1000)), 250);
    return () => clearInterval(rellotge);
  }, [gravant]);
  useEffect(() => {
    if (!preparat) { setUrl(null); return undefined; }
    const objectUrl = URL.createObjectURL(preparat.fitxer);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [preparat]);

  /* Gauntlet 261022_0225 (crítica Claude, MEDIA-6) · Quan el control enfocat
     desapareix (gravar, triar, enviar, cancel·lar), el focus passa al control
     nou del pas: no cau al principi de la pàgina ni s'escapa del Shadow DOM.
     Només si el focus s'ha perdut o era dins del panell: mai no se'l pren al
     compositor.
     P1-66 · El pas nou és un botó de la barra: el redó (Atura, Envia el
     fitxer, Grava àudio), Cancel·la a la safata o el + en acabar. «Dins del
     panell» vol dir la safata, el +, el menú i el botó redó mentre fa (o
     acabava de fer) una acció d'adjunts; el camp d'escriure i el redó quan
     envia text no hi són mai. */
  const objectiu = gravant || preparat ? 'primari' : ocupat ? 'cancella' : origen.current === 'grava' ? 'primari' : 'adjunta';
  const objectiuAnterior = useRef(objectiu);
  const pujantAnterior = useRef(pujant);
  const accioAnterior = useRef(null);
  useEffect(() => {
    const canvia = objectiuAnterior.current !== objectiu;
    const acabaDePujar = pujantAnterior.current !== pujant;
    objectiuAnterior.current = objectiu;
    pujantAnterior.current = pujant;
    const primari = botons.primari.current;
    const accio = primari?.dataset.accio || null;
    const eraAccio = accioAnterior.current;
    accioAnterior.current = accio;
    const node = contenidor.current;
    if (!node || (!canvia && !acabaDePujar)) return;
    /* ADV-MEDIA-5 · A l'encastat, el ShadowRoot no té activeElement quan el
       focus és a la pàgina amfitriona: això no és un focus perdut. */
    const arrel = node.getRootNode();
    const actiu = arrel.activeElement ?? null;
    const actiuDoc = node.ownerDocument.activeElement;
    const perdut = actiu ? actiu.tagName === 'BODY'
      : !actiuDoc || actiuDoc === node.ownerDocument.body || actiuDoc === arrel.host;
    const dins = Boolean(actiu) && (node.contains(actiu) || actiu === botons.adjunta.current
      || Boolean(actiu.closest?.(`#${ID_MENU_ADJUNTS}`)) || (actiu === primari && Boolean(accio || eraAccio)));
    if (perdut || (canvia && dins)) botons[objectiu]?.current?.focus();
  });

  const refrescaQuota = async (signal) => {
    /* MEDIA-12 · La quota es torna a llegir a banda: si falla, l'enviament o
       el descart que ja s'han fet no es converteixen en un error. */
    const revisio = revisioContext.current;
    const lectura = ++lecturaQuotaRef.current;
    try {
      const actual = await servei.quotaXat({ ...externalConfig, signal });
      if (viu.current && !signal.aborted && revisioContext.current === revisio && lecturaQuotaRef.current === lectura) {
        quotesDe(servei).set(clauQuota, actual); setQuota(actual); setErrorQuota(null);
      }
    } catch (e) {
      // La quota anterior continua; el menú permet reintentar esta lectura.
      if (viu.current && !signal.aborted && e?.name !== 'AbortError' && revisioContext.current === revisio && lecturaQuotaRef.current === lectura) setErrorQuota(e);
    }
  };
  const descarta = () => {
    // «Cancel·la» és la persona qui no el vol: la còpia compartida se'n va.
    if (operacio.current) cancelladesRef.current.add(operacio.current);
    alliberaEnMa();
    operacio.current?.abort(); gravadora.current?.cancella(); gravadora.current = null;
    pujadaRef.current = null;
    intentEnviamentRef.current = null;
    ambLlocRef.current = null;
    setPreparat(null); setGravant(false); setOcupat(null); setPujant(false); setProgres(null); setProgresCompressio(null); setError(null); setPeu(''); setDeCompartir(false);
    setLlocNoAmagat(null);
  };
  const descartaPendent = async (id) => {
    if (pujadaRef.current) return;
    const controller = new AbortController(); operacio.current = controller;
    pujadaRef.current = controller;
    setPujant(true); setError(null);
    let descartat = false;
    try {
      await servei.descartaAdjuntXat(id, { ...externalConfig, signal: controller.signal });
      descartat = true;
      if (viu.current && !controller.signal.aborted && preparat?.id === id) setPreparat(null);
    } catch (e) { if (viu.current && !controller.signal.aborted) setError(e); }
    finally {
      if (pujadaRef.current === controller) pujadaRef.current = null;
      if (viu.current && operacio.current === controller) setPujant(false);
    }
    if (descartat && viu.current && !controller.signal.aborted) await refrescaQuota(controller.signal);
  };
  const accepta = (adjunt) => {
    if (quota && quota.usats + adjunt.fitxer.size > quota.limit) throw errorAdjuntXat('SDP-XAT-020');
    intentEnviamentRef.current = null;
    setPreparat(adjunt);
  };
  /* Torna com ha acabat: 'preparada', 'fallida' (error a la vista), 'avortada'
     (la conversa s'ha tancat o s'ha cancel·lat) o 'ocupada' (no s'ha començat).
     El menú «Compartir» ho necessita per a saber si el fitxer torna al lot. */
  const tria = async (fitxer, { ambPeu = false, permetDocuments = false } = {}) => {
    if (!fitxer || pujadaRef.current || pujant || ocupat) return 'ocupada';
    operacio.current?.abort();
    const controller = new AbortController(); operacio.current = controller;
    origen.current = 'tria';
    ambLlocRef.current = null;
    if (ambPeu) setDeCompartir(true);
    setOcupat('tria'); setError(null); setProgresCompressio(null);
    const onProgresCompressio = fraccio => {
      if (viu.current && operacio.current === controller && !controller.signal.aborted && Number.isFinite(fraccio)) {
        setProgresCompressio(anterior => Math.max(anterior ?? 0, Math.min(1, Math.max(0, fraccio))));
      }
    };
    let estat = 'avortada';
    try {
      const adjunt = await preparaAdjunt(fitxer, { signal: controller.signal, permetDocuments, onProgresCompressio });
      if (viu.current && operacio.current === controller && !controller.signal.aborted) { accepta(adjunt); estat = 'preparada'; }
    } catch (e) {
      if (viu.current && operacio.current === controller && !controller.signal.aborted) {
        if (ambPeu) { setPeu(''); setDeCompartir(false); }
        setError(e);
        estat = 'fallida';
      }
    }
    finally { if (viu.current && operacio.current === controller) { setOcupat(null); setProgresCompressio(null); } }
    return estat;
  };
  /* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · L'interruptor d'un toc: «Amaga el lloc» (Publicar sense
     geolocalització) lleva l'EXIF i el GPS del preparat; «Conserva el lloc» hi torna. Si no es pot netejar, l'avís
     del camí i el preparat no s'envia brut (llocNoAmagat) fins que la persona tria conservar-lo o cancel·la. */
  const amagaLloc = async () => {
    if (!preparat || preparat.tipus === 'veu' || preparat.conservaUbicacio === false || pujadaRef.current || pujant || ocupat
      || intentEnviamentRef.current === preparat.id) return;
    operacio.current?.abort();
    const controller = new AbortController(); operacio.current = controller;
    const ambLloc = preparat;
    setOcupat('ubicacio'); setError(null); setLlocNoAmagat(null);
    try {
      const net = await amagaUbicacioAdjunt(ambLloc, { signal: controller.signal });
      if (viu.current && operacio.current === controller && !controller.signal.aborted) {
        ambLlocRef.current = { idAmagat: net.id, original: ambLloc };
        accepta(net);
      }
    } catch (e) {
      if (viu.current && operacio.current === controller && !controller.signal.aborted && e?.name !== 'AbortError') {
        setError(e); setLlocNoAmagat({ id: ambLloc.id, error: e });
      }
    } finally {
      if (viu.current && operacio.current === controller) setOcupat(null);
    }
  };
  const conservaLloc = () => {
    if (!preparat || pujadaRef.current || pujant || ocupat || intentEnviamentRef.current === preparat.id) return;
    if (llocNoAmagat?.id === preparat.id) { setLlocNoAmagat(null); setError(null); return; }
    const desat = ambLlocRef.current;
    if (preparat.conservaUbicacio !== false || desat?.idAmagat !== preparat.id) return;
    ambLlocRef.current = null;
    setError(null);
    accepta(desat.original);
  };
  const tancaAvis = (event) => {
    const boto = event.currentTarget;
    const teniaFocus = boto.getRootNode().activeElement === boto;
    setError(null);
    if (teniaFocus) botons[preparat ? 'primari' : ocupat ? 'cancella' : 'adjunta'].current?.focus();
  };
  /* 261026 (prompt 261026_1615, tasca 2) · Una imatge del menú «Compartir» del
     dispositiu per a esta conversa (DialegCompartir) entra com si l'haguera
     triat la persona: la miniatura, el peu (el text compartit, si n'hi ha) i
     «Envia el fitxer». Mai mentre hi ha una altra cosa a mig fer; amb diverses,
     la següent arriba quan s'envia o es cancel·la l'anterior.
     Revisió 261026 · Prendre un fitxer avisa el registre i React torna a pintar
     abans d'aplicar el setOcupat de tria(): sense la guarda (una ref, no estat)
     l'efecte en prenia un altre i tria() avortava el primer. */
  const compartit = useCompartitPendent();
  const bloquejat = pujant || Boolean(ocupat) || Boolean(preparat) || gravant;
  const disponible = actiu && servei.teCapacitat('xatMultimedia') && !SENSE_PANELL.has(String(errorQuota?.code ?? ''))
    && Boolean(quota || errorQuota);
  const potTriarExtern = Boolean(disponible && quota && !bloquejat);
  // L'últim `tria`, per a l'efecte de baix sense tornar-lo a córrer a cada pintat.
  const triaRef = useRef(tria);
  const textOrfeRef = useRef(onTextOrfe);
  useEffect(() => {
    triaRef.current = tria;
    textOrfeRef.current = onTextOrfe;
    if (triaFitxerRef) {
      triaFitxerRef.current = potTriarExtern ? (fitxer) => triaRef.current(fitxer, { ambPeu: true }) : null;
    }
    return () => { if (triaFitxerRef) triaFitxerRef.current = null; };
  });
  useEffect(() => {
    if (!actiu || prenentRef.current || !quota || preparat || ocupat || pujant || gravant) return;
    if (compartit?.desti !== String(fil.id) || !compartit.fitxers.length) return;
    const pres = prenFitxerCompartit(fil.id, usuariId);
    if (!pres) return;
    prenentRef.current = pres;
    enMaRef.current = pres;
    setPeu(pres.peu.slice(0, LIMIT_TEXT));
    setDeCompartir(true);
    /* Si abans de començar ja l'han tornat (StrictMode, o la conversa s'ha
       tancat), no es prepara: ja és al lot i el prendrà qui toque. */
    Promise.resolve().then(() => (enMaRef.current === pres ? triaRef.current(pres.fitxer) : 'tornada')).catch(() => 'fallida').then((estat) => {
      // Abans de tornar res al registre: el pintat que ho seguix ha de poder prendre.
      if (prenentRef.current === pres) prenentRef.current = null;
      if (estat === 'preparada' || enMaRef.current !== pres) return;
      if (estat === 'fallida') {
        /* No s'ha pogut preparar (massa gran, quota plena): el text compartit no
           es perd ni viatja amb una altra foto, va al compositor. */
        enMaRef.current = null;
        alliberaFitxerCompartit(pres);
        if (viu.current) { if (pres.peu) textOrfeRef.current?.(pres.peu); setPeu(''); setDeCompartir(false); }
        return;
      }
      tornaEnMa();
      if (viu.current) { setPeu(''); setDeCompartir(false); }
    });
  }, [compartit, quota, preparat, ocupat, pujant, gravant, fil.id, usuariId, actiu]);

  const grava = async () => {
    if (pujadaRef.current || pujant || ocupat) return;
    // G2120-01 · La nota de veu que sonava calla abans d'obrir el micròfon.
    callaVeuActiva();
    const controller = new AbortController(); operacio.current = controller;
    origen.current = 'grava';
    ambLlocRef.current = null;
    setOcupat('grava'); setError(null);
    try {
      const control = await gravaVeu({ signal: controller.signal });
      gravadora.current = control;
      if (!controller.signal.aborted) { setSegonsGravats(0); setGravant(true); }
      // El motiu d'una aturada sola és per a avisar ací: no viatja amb l'adjunt.
      const { aturada: motiu, ...adjunt } = await control.resultat;
      if (viu.current && !controller.signal.aborted) { accepta(adjunt); setAturada(motiu ? { id: adjunt.id, motiu } : null); }
    } catch (e) {
      if (viu.current && !controller.signal.aborted) {
        /* v1.2.23 · X2 (ordre del Mestre 261123) · La veu recollida abans del tall queda preparada (veuRecuperada),
           i l'avís de l'error, «No hem pogut acabar la gravació.», diu a la vista que la gravació s'ha tallat. Si no
           cap a la quota, l'avís és el de la quota (SDP-XAT-020), com amb una nota sencera: és el que impedix
           guardar-la, i no es perd. */
        const recuperada = veuRecuperada(e);
        let avis = e;
        if (recuperada) {
          try {
            accepta(recuperada.adjunt);
            setAturada(recuperada.aturada ? { id: recuperada.adjunt.id, motiu: recuperada.aturada } : null);
          } catch (errorQuota) { avis = errorQuota; }
        }
        setError(avis);
      }
    }
    finally { if (viu.current && operacio.current === controller) { setOcupat(null); setGravant(false); gravadora.current = null; } }
  };
  const envia = async ({ text: textPrincipal = '' } = {}) => {
    if (!preparat || pujadaRef.current || pujant || ocupat) return null;
    // v1.2.23 · IDEA-331 · Ha demanat amagar el lloc i no s'ha pogut: no s'envia brut, es torna a dir per què.
    if (llocNoAmagat?.id === preparat.id) { setError(llocNoAmagat.error); return null; }
    const principal = preparat.tipus === 'veu' ? '' : String(textPrincipal);
    const text = preparat.tipus === 'veu' ? '' : [deCompartir ? peu.trim() : '', principal.trim()].filter(Boolean).join('\n\n');
    if (text.length > LIMIT_TEXT) {
      setError(new Error(t('section.xat.adjunts.peuMassaLlarg', 'El text del fitxer no pot passar de {max} caràcters. Reduïx-lo abans d’enviar.').replace('{max}', String(LIMIT_TEXT))));
      return null;
    }
    const controller = new AbortController(); operacio.current = controller;
    pujadaRef.current = controller;
    intentEnviamentRef.current = preparat.id;
    setPujant(true); setError(null); setProgres({ fraccio: null });
    /* XAT-03 · El port informa dels bytes que ja han eixit. Només compta el
       d'esta pujada: una de cancel·lada o d'un altre fil ja no pinta res. */
    const onProgres = (fraccio) => {
      if (viu.current && !controller.signal.aborted && operacio.current === controller) setProgres({ fraccio });
    };
    // El de «Compartir» passa a «s'està enviant»: tancar la conversa ja no el torna al lot.
    const compartitEnviat = enMaRef.current;
    enMaRef.current = null;
    enviantRef.current = compartitEnviat;
    let enviat = false;
    let confirmacio = null;
    try {
      const resultat = await onEnvia(fil, text ? { ...preparat, text } : preparat, { signal: controller.signal, onProgres });
      if (!Array.isArray(resultat) || !resultat.length) throw errorAdjuntXat('sense-confirmacio');
      enviat = true;
      /* v1.2.8 · Llei 0: un servidor sense 20261117193000 ha publicat sense la ubicació (xatMultimedia.js); es diu. */
      if (resultat[0]?.ubicacioNoAdmesa === true && viu.current) setError(errorAdjuntXat('ubicacio-no-admesa'));
      // Enviat: la còpia nativa ja sobra (també si la conversa s'ha tancat mentre pujava).
      if (compartitEnviat) alliberaFitxerCompartit(compartitEnviat);
      if (viu.current && !controller.signal.aborted && operacio.current === controller) {
        /* L'ID és idempotent: un reintent pot confirmar un peu anterior si
           es va perdre l'ACK. Només el text autoritatiu acredita el principal. */
        const textConfirmat = resultat[0]?.text;
        const coincideix = typeof textConfirmat === 'string' && textConfirmat === text;
        confirmacio = { enviat: true, textPrincipalInclos: coincideix && principal.trim() ? principal : null };
        if (deCompartir && peu.trim() && textConfirmat !== undefined && String(textConfirmat ?? '') !== text) textOrfeRef.current?.(peu);
        setPreparat(null); setPeu(''); setDeCompartir(false);
      }
    } catch (e) {
      // La previsualització i el mateix ID continuen disponibles per a reintentar.
      // ADV-MEDIA-7 · Un AbortError (les normes rebutjades, la sessió que canvia) calla, com al compositor.
      if (viu.current && !controller.signal.aborted && e?.name !== 'AbortError') setError(e);
    } finally {
      if (pujadaRef.current === controller) pujadaRef.current = null;
      if (viu.current && operacio.current === controller) { setPujant(false); setProgres(null); }
      if (enviantRef.current === compartitEnviat) enviantRef.current = null;
      /* No enviat: si el compositor encara hi és, el torna a tindre (es pot
         reintentar); si s'ha tancat, torna al lot. */
      if (compartitEnviat && !enviat) {
        if (cancelladesRef.current.has(controller)) alliberaFitxerCompartit(compartitEnviat);
        else if (viu.current && !controller.signal.aborted && operacio.current === controller) enMaRef.current = compartitEnviat;
        else tornaFitxerCompartit(compartitEnviat);
      }
    }
    // La quota inclou reserves i reintents: sempre tornem a llegir-la.
    if (!viu.current) return null;
    if (!controller.signal.aborted) void refrescaQuota(controller.signal);
    /* ADV-MEDIA-13 · Cancel·la durant la pujada: si Storage ja tenia l'objecte,
       la reserva queda pendent. En acabar es torna a llegir perquè aparega
       «Descarta el fitxer pendent». Un canvi de fil o de sessió la llig ell. */
    else if (operacio.current === controller) void refrescaQuota(new AbortController().signal);
    return confirmacio;
  };

  /* P1-66 · Sense capacitat, sense la migració (MEDIA-10) o sense cap lectura
     de la quota encara, el Compositor ix sense adjunts: ni + ni micròfon. El
     fragment té sempre la mateixa forma (safata, compositor): el camp no es
     torna a muntar quan els adjunts arriben. */
  if (!disponible) return <>{null}{children?.(null) ?? null}</>;
  const mb = (bytes, decimals = 1) => new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(bytes / 1_000_000);
  const potGravar = Boolean(globalThis.navigator?.mediaDevices?.getUserMedia && mimeDeGravacio(globalThis.MediaRecorder));
  /* La càmera directa, només en una pantalla tàctil (mòbil, tauleta): és on
     `capture` obri la càmera; a l'escriptori seria el mateix selector. */
  const tactil = Boolean(globalThis.matchMedia?.(CONSULTA_TACTIL)?.matches);
  const ubicacio = Number.isFinite(preparat?.ubicacio?.lat) && Number.isFinite(preparat?.ubicacio?.lng) ? preparat.ubicacio : null;
  /* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · Abans de publicar, la persona veu si el contingut conserva el
     lloc i té l'interruptor d'un toc. Sense coordenades llegides, un vídeo que no s'ha recomprimit i que la inspecció
     no ha pogut acreditar del tot (WebM, una pista opaca) també pot portar-lo: ho diu i deixa amagar-lo. */
  const amagat = preparat?.conservaUbicacio === false;
  const avisUbicacio = preparat?.tipus === 'video' && !amagat && !preparat.senseUbicacio && !ubicacio && preparat.ubicacioVerificada !== true;
  /* v1.2.23 · IDEA-331 · Gauntlet R1 del carril A (P2) · L'avís pinta el punt que el fitxer porta de veres
     (llocDelFitxer, cinc decimals: el punt exacte), no el DTO arrodonit. Sense lloc dins del fitxer (un vídeo
     recomprimit en un contenidor que no l'admet), només el DTO el situa al mapa, i l'avís ho diu (dos decimals). */
  const llocDelFitxer = !amagat && preparat?.senseUbicacio !== true && Number.isFinite(preparat?.llocDelFitxer?.lat)
    && Number.isFinite(preparat?.llocDelFitxer?.lng) ? preparat.llocDelFitxer : null;
  const graus = (valor, decimals) => new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(valor);
  const potConservarLloc = amagat && ambLlocRef.current?.idAmagat === preparat?.id;
  const llocBloquejat = Boolean(preparat && llocNoAmagat?.id === preparat.id);
  const filaLloc = amagat ? potConservarLloc : Boolean(ubicacio || llocDelFitxer || avisUbicacio);
  const haIntentatEnviar = preparat && intentEnviamentRef.current === preparat.id;
  const percentatge = (fraccio) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(fraccio);
  const minuts = String(MAX_VEU_MS / 60_000);
  const queden = MAX_VEU_MS / 1000 - segonsGravats;
  const textGravant = queden <= AVISOS_GRAVACIO.final
    ? t('section.xat.adjunts.quedenSegons', 'Queden {segons} segons: la gravació s’aturarà sola.').replace('{segons}', String(AVISOS_GRAVACIO.final))
    : queden <= AVISOS_GRAVACIO.minut
      ? t('section.xat.adjunts.quedaUnMinut', 'Queda un minut: als {minuts} minuts la gravació s’aturarà sola.').replace('{minuts}', minuts)
      : t('section.xat.adjunts.gravant', 'Gravant… Atura per escoltar-la abans d’enviar.');
  /* XAT-07 · Una nota que s'ha aturat sola ho diu, a la vista i a la regió
     viva, mentre és la preparada. */
  const avisAturada = aturada && preparat?.id === aturada.id
    ? (aturada.motiu === 'mida'
      ? t('section.xat.adjunts.aturadaMida', 'La gravació s’ha aturat sola perquè ja no hi cap més. Escolta-la abans d’enviar.')
      : t('section.xat.adjunts.aturadaTemps', 'La gravació s’ha aturat sola en arribar als {minuts} minuts. Escolta-la abans d’enviar.').replace('{minuts}', minuts))
    : '';
  const estat = gravant ? textGravant
    : ocupat === 'ubicacio' ? t('section.xat.adjunts.amagantLloc', 'Amagant la ubicació…')
      : ocupat === 'tria' && progresCompressio !== null ? t('section.xat.adjunts.comprimintVideo', 'Comprimint vídeo… {percentatge}').replace('{percentatge}', percentatge(progresCompressio))
    : ocupat === 'grava' ? t('section.xat.adjunts.esperantMicro', 'Esperant el permís del micròfon…')
      : ocupat ? t('section.xat.adjunts.preparant', 'Preparant el fitxer…') : avisAturada;
  /* P1-66 · La safata només ocupa lloc mentre hi ha alguna cosa a fer; buida,
     col·lapsa a 0 (modules.css) i no és cap grup. La regió viva dels passos i
     els selectors de fitxer hi són sempre. */
  const potDocuments = typeof permetDocuments === 'boolean'
    ? permetDocuments
    : (servei === PORT && Boolean(servei.teCapacitat?.('xatDocuments')));
  const activa = Boolean(error || quota?.pendents?.length || preparat || ocupat || gravant || progres);
  const safata = (
    <div className={activa ? 'sdp-xat-adjunts sdp-xat-adjunts--activa' : 'sdp-xat-adjunts'} role={activa ? 'group' : undefined}
      aria-label={activa ? t('section.xat.adjunts.grup', 'Adjunts del xat') : undefined} ref={contenidor}>
      {error ? <div className="sdp-xat-adjunts__fila">
        <p role="alert">{
          error?.code === 'document-format' ? textXatV1225(normalitzaLlenguaXat(locale), 'documents.errorFormat')
            : error?.code === 'document-mida' ? textXatV1225(normalitzaLlenguaXat(locale), 'documents.errorMida')
              : error?.code === 'document-contingut' ? textXatV1225(normalitzaLlenguaXat(locale), 'documents.errorContingut')
                : textDErrorAdjunt(error, t, t('section.xat.adjunts.error.envia', 'No hem pogut enviar el fitxer.'))
        }</p>
        <button type="button" className="sdp-xat-icona" onClick={tancaAvis} aria-label={t('section.xat.adjunts.tancaAvis', 'Tanca l’avís')} title={t('section.xat.adjunts.tancaAvis', 'Tanca l’avís')}><X size={20} aria-hidden="true" focusable="false" /></button>
      </div> : null}
      {quota?.pendents?.length ? <div role="group" aria-label={t('section.xat.adjunts.pendents', 'Fitxers pendents d’enviar')}>
        <p>{t('section.xat.adjunts.pendentsText', 'Tens fitxers que no s’han arribat a enviar. Pots descartar-los per recuperar espai.')}</p>
        {quota.pendents.map((a) => <button type="button" className="sdp-xat-pindola" key={a.id} disabled={pujant || Boolean(ocupat)} onClick={() => descartaPendent(a.id)}>
          {t('section.xat.adjunts.descartaPendent', 'Descarta el fitxer pendent ({mida} MB)').replace('{mida}', mb(a.bytes))}
        </button>)}
      </div> : null}
      {/* MEDIA-9 · Cancel·la també durant la pujada: amb el temps proporcional a la mida, s'ha de poder parar. */}
      {ocupat || preparat ? (
        <div className="sdp-xat-adjunts__fila">
          {preparat && url ? (
            <PrevisualitzacioAdjunt
              tipus={preparat.tipus}
              url={url}
              duradaMs={preparat.duradaMs}
              nom={preparat.nom}
              bytes={preparat.bytes ?? preparat.fitxer?.size}
              extensio={preparat.extensio}
              locale={locale}
              t={t}
            />
          ) : null}
          {/* XAT-07 · role=timer no és una regió viva que parle: els avisos van a la de baix. */}
          {gravant ? <span className="sdp-xat-adjunts__rellotge" role="timer"><span className="sdp-nomes-lector">{t('section.xat.adjunts.tempsGravacio', 'Temps de gravació')} </span>{tempsDeVeu(segonsGravats * 1000)}</span> : null}
          <button type="button" className="sdp-xat-icona sdp-xat-adjunts__cancella" ref={botons.cancella} onClick={descarta}
            aria-label={t('section.xat.adjunts.cancella', 'Cancel·la')} title={t('section.xat.adjunts.cancella', 'Cancel·la')}><X size={20} aria-hidden="true" focusable="false" /></button>
        </div>
      ) : null}
      {preparat && deCompartir && preparat.tipus !== 'veu' ? (
        <label className="sdp-xat-adjunts__peu">
          <span className="sdp-nomes-lector">{t('section.xat.adjunts.peu', 'Text del fitxer (opcional)')}</span>
          <input type="text" name="xatPeuAdjunt" autoComplete="off" maxLength={LIMIT_TEXT} value={peu} disabled={pujant || Boolean(ocupat)}
            placeholder={t('section.xat.adjunts.peuPlaceholder', 'Afig un text…')}
            onChange={(e) => setPeu(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing) { e.preventDefault(); botons.primari.current?.click(); } }} />
        </label>
      ) : null}
      {filaLloc ? <>
        {/* R32.8 · Codex (semàntica: neteja real del fitxer, reintent idempotent) + Gemini (píndola amb MapPin).
            v1.2.23 · IDEA-331 · L'avís diu que el contingut conserva el lloc; la píndola és l'interruptor: «Amaga el
            lloc» (el rètol llarg, «Publicar sense geolocalització», al title) i, amagat o no amagable, «Conserva el lloc». */}
        <div className="sdp-xat-adjunts__fila sdp-xat-ubicacio-control">
          {/* v1.2.23 · L1-03 (Gauntlet R1) · Regió viva: el resultat de l'interruptor («Ubicació amagada», o l'avís de
              conservar en tornar) s'anuncia, sense cap text nou. */}
          <p className="sdp-xat-adjunts__avis sdp-xat-ubicacio-control__estat" id={idAvis} role="status">
            <MapPin size={16} aria-hidden="true" focusable="false" />
            <span>{amagat ? t('section.xat.ubicacio.amagada', 'Ubicació amagada')
              : llocDelFitxer ? t('section.xat.adjunts.ubicacioConservada', 'Este contingut conserva la ubicació per a situar-lo al territori ({lat}°, {lng}°)')
                .replace('{lat}', graus(llocDelFitxer.lat, 5)).replace('{lng}', graus(llocDelFitxer.lng, 5))
                : ubicacio ? t('section.xat.adjunts.ubicacioNomesMapa', 'Este contingut conserva la ubicació aproximada per a situar-lo al territori ({lat}°, {lng}°): el fitxer no la porta dins.')
                  .replace('{lat}', graus(ubicacio.lat, 2)).replace('{lng}', graus(ubicacio.lng, 2))
                  : t('section.xat.adjunts.videoUbicacio', 'Este vídeo s’envia tal com és: si el mòbil hi va guardar la ubicació, qui el reba la podrà vore.')}</span>
          </p>
          {/* Gauntlet R1 del carril A · Dos rètols al mateix lloc de l'arbre: React conserva el node en canviar.
              v1.2.23 · L1-03 (Gauntlet R1) · El focus només es conserva si el botó no es desactiva mentre amaga: un botó
              enfocat que passa a disabled el perd. Mentre amaga és aria-disabled (amagaLloc i conservaLloc ja ixen amb
              `ocupat`), i el resultat l'anuncia l'avís (role=status). */}
          {amagat || llocBloquejat ? <button type="button" className="sdp-xat-pindola sdp-xat-pindola--secundaria"
            disabled={pujant || (Boolean(ocupat) && ocupat !== 'ubicacio') || haIntentatEnviar} aria-disabled={ocupat === 'ubicacio' || undefined}
            title={haIntentatEnviar ? t('section.xat.adjunts.ubicacioFixada', 'El primer intent pot haver arribat al servidor. El reintent conserva la mateixa ubicació.') : undefined}
            onClick={conservaLloc}>{t('section.xat.adjunts.conservaLloc', 'Conserva el lloc')}</button>
            : <button type="button" className="sdp-xat-pindola sdp-xat-pindola--secundaria"
              disabled={pujant || (Boolean(ocupat) && ocupat !== 'ubicacio') || haIntentatEnviar} aria-disabled={ocupat === 'ubicacio' || undefined}
              title={haIntentatEnviar ? t('section.xat.adjunts.ubicacioFixada', 'El primer intent pot haver arribat al servidor. El reintent conserva la mateixa ubicació.')
                : t('section.xat.adjunts.publicaSenseGeolocalitzacio', 'Publicar sense geolocalització')}
              onClick={amagaLloc}>{t('section.xat.adjunts.amagaLloc', 'Amaga el lloc')}</button>}
        </div>
        {haIntentatEnviar ? <p className="sdp-xat-adjunts__avis">{t('section.xat.adjunts.ubicacioFixada', 'El primer intent pot haver arribat al servidor. El reintent conserva la mateixa ubicació.')}</p> : null}
      </> : amagat ? (
        <p className="sdp-xat-adjunts__avis sdp-xat-ubicacio-control__estat">
          <MapPin size={16} aria-hidden="true" focusable="false" />
          <span>{t('section.xat.ubicacio.amagada', 'Ubicació amagada')}</span>
        </p>
      ) : null}
      {ocupat === 'tria' && progresCompressio !== null ? <p className="sdp-xat-adjunts__progres">
        <progress max="1" value={progresCompressio} aria-label={t('section.xat.adjunts.progresCompressio', 'Progrés de la compressió del vídeo')} />
      </p> : null}
      {/* XAT-03 · La barra nativa diu el percentatge als lectors; el text visible no es repetix. */}
      {progres && preparat ? (
        <p className="sdp-xat-adjunts__progres">
          <progress max="1" value={progres.fraccio ?? undefined} aria-label={t('section.xat.adjunts.progres', 'Progrés de l’enviament')} />
          {progres.fraccio === null ? null : <span aria-hidden="true">{percentatge(progres.fraccio)}</span>}
        </p>
      ) : null}
      <p className={avisAturada && estat === avisAturada ? 'sdp-xat-adjunts__estat sdp-xat-adjunts__avis' : 'sdp-xat-adjunts__estat'} role="status">{estat}</p>
      <input className="sdp-nomes-lector" type="file" ref={selector} accept={ACCEPTA_GALERIA} tabIndex={-1} aria-label={t('section.xat.adjunts.selector', 'Tria una foto o un vídeo de fins a 60 segons')} onChange={(e) => { const fitxer = e.target.files?.[0]; e.target.value = ''; tria(fitxer); }} />
      {potDocuments ? <input className="sdp-nomes-lector" type="file" ref={selectorDocuments} accept={ACCEPTA_DOCUMENTS} tabIndex={-1} aria-label={textXatV1225(normalitzaLlenguaXat(locale), 'documents.triaInput')} onChange={(e) => { const fitxer = e.target.files?.[0]; e.target.value = ''; tria(fitxer, { permetDocuments: true }); }} /> : null}
      {tactil ? <input className="sdp-nomes-lector" type="file" ref={selectorCamera} accept="image/*" capture="environment" tabIndex={-1} aria-label={t('section.xat.adjunts.selectorCamera', 'Fes una foto amb la càmera')} onChange={(e) => { const fitxer = e.target.files?.[0]; e.target.value = ''; tria(fitxer); }} /> : null}
    </div>
  );
  /* P1-66 · El botó redó de la barra, per prioritat: Atura mentre grava,
     Envia el fitxer amb un de preparat (el principal és el peu de foto/vídeo),
     Grava àudio amb el camp buit, i si no, el d'enviar text
     del Compositor. Els noms accessibles són els de sempre. */
  const primari = gravant
    ? { clau: 'atura', etiqueta: t('section.xat.adjunts.atura', 'Atura la gravació'), icona: Square, onClick: () => gravadora.current?.atura() }
    : preparat
      ? { clau: 'envia', etiqueta: pujant ? t('section.xat.adjunts.enviant', 'Enviant…') : t('section.xat.adjunts.envia', 'Envia el fitxer'), icona: Send, onClick: envia, ariaDisabled: pujant || Boolean(ocupat), ocupat: pujant || Boolean(ocupat), descritPer: filaLloc ? idAvis : undefined }
      : quota && potGravar && !ocupat
        ? { clau: 'grava', etiqueta: t('section.xat.adjunts.grava', 'Grava àudio'), icona: Mic, onClick: grava, nomesBuit: true, ariaDisabled: pujant }
        : null;
  /* El menú del +: només el que funciona (decisió del Mestre, 261028). Sense
     quota llegida, només «Torna-ho a provar»; la quota i el micròfon que no
     hi és, al peu, discrets. */
  const reintentaQuota = { id: 'reintenta', etiqueta: t('section.xat.missatge.reintenta', 'Torna-ho a provar'), icona: RefreshCw, onTria: () => setIntentQuota((n) => n + 1) };
  const opcions = quota ? [
    { id: 'fotos', etiqueta: t('section.xat.adjunts.fotos', 'Fotos i vídeos'), icona: ImagePlus, onTria: () => selector.current?.click() },
    ...(potDocuments ? [{ id: 'document', etiqueta: textXatV1225(normalitzaLlenguaXat(locale), 'documents.menuOpcio'), icona: FileText, onTria: () => selectorDocuments.current?.click() }] : []),
    ...(tactil ? [{ id: 'camera', etiqueta: t('section.xat.adjunts.camera', 'Càmera'), icona: Camera, onTria: () => selectorCamera.current?.click() }] : []),
    ...(errorQuota ? [reintentaQuota] : [])
  ] : [reintentaQuota];
  const peuMenu = [
    quota ? t('section.xat.adjunts.quota', '{usats} de {limit} MB del xat').replace('{usats}', mb(quota.usats)).replace('{limit}', mb(quota.limit, 0))
      : t('section.xat.adjunts.quotaIllegible', 'No hem pogut llegir l’espai que et queda per a fitxers.'),
    quota && errorQuota ? t('section.xat.adjunts.quotaIllegible', 'No hem pogut llegir l’espai que et queda per a fitxers.') : null,
    quota && !potGravar ? t('section.xat.adjunts.senseGravacio', 'Este navegador no permet gravar àudio.') : null
  ].filter(Boolean);
  const adjunts = {
    clauContext: JSON.stringify([clauQuota, fil.id]),
    etiqueta: t('section.xat.adjunts.menu', 'Adjunta'),
    etiquetaMenu: t('section.xat.adjunts.grup', 'Adjunts del xat'),
    refBoto: botons.adjunta,
    refPrimari: botons.primari,
    bloquejat,
    triaFitxer: potTriarExtern ? (fitxer) => tria(fitxer, { ambPeu: true }) : null,
    opcions,
    peuMenu,
    primari
  };
  return <>{safata}{children?.(adjunts) ?? null}</>;
}
