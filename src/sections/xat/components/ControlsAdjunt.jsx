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
import { Camera, ImagePlus, Mic, RefreshCw, Send, Square, X } from 'lucide-react';
import { descartaAdjuntXat, quotaXat, teCapacitat } from '../../../data/backendPort.js';
import { errorAdjuntXat } from '../../../data/xatMultimedia.js';
import { CONSULTA_TACTIL } from '../../../hooks/useBarresAmbScroll.js';
import { MAX_VEU_MS, gravaVeu, mimeDeGravacio, preparaAdjunt, textDErrorAdjunt } from '../adjuntLocal.js';
import { PrevisualitzacioAdjunt, callaVeuActiva, tempsDeVeu, traductorAdjunt } from './AdjuntXat.jsx';
import { ID_MENU_ADJUNTS, LIMIT_TEXT } from './Compositor.jsx';
import useCompartitPendent from '../useCompartitPendent.js';
import { alliberaFitxerCompartit, prenFitxerCompartit, tornaFitxerCompartit } from '../../../config/compartirNatiu.js';

const PORT = { quotaXat, teCapacitat, descartaAdjuntXat };
const ACCEPTA_GALERIA = 'image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime';
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

export default function ControlsAdjunt({ fil, onEnvia, onTextOrfe = null, servei = PORT, externalConfig, usuariId, t: tProp, locale = 'ca-ES', actiu = true, children = null }) {
  const t = traductorAdjunt(tProp);
  const clauQuota = String(usuariId ?? '');
  const [quota, setQuota] = useState(() => quotesDe(servei).get(clauQuota) ?? null);
  const [errorQuota, setErrorQuota] = useState(null);
  const [intentQuota, setIntentQuota] = useState(0);
  const [error, setError] = useState(null);
  const [preparat, setPreparat] = useState(null);
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
  /* 261026 (prompt 261026_1615, tasca 2) · El peu de la foto o del vídeo que
     arriba del menú «Compartir»: el port ja el porta al servidor
     (publicaAdjuntXat, p_text). Les notes de veu no en porten, i una foto
     triada ací tampoc (el compositor fa com sempre; estendre-ho és decisió
     del Mestre). */
  const [peu, setPeu] = useState('');
  const [deCompartir, setDeCompartir] = useState(false);
  const selector = useRef(null);
  const selectorCamera = useRef(null);
  const operacio = useRef(null);
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
    const controller = new AbortController();
    operacio.current?.abort(); gravadora.current?.cancella(); gravadora.current = null;
    operacio.current = null;
    setPreparat(null); setGravant(false); setOcupat(null); setPujant(false); setProgres(null); setError(null); setPeu(''); setDeCompartir(false);
    /* P1-66 · L'error de la quota es queda fins que arriba una lectura nova:
       «Torna-ho a provar» (al menú del +) no fa desaparéixer el + ni li pren
       el focus mentre es torna a llegir. */
    setQuota(quotesDe(servei).get(clauQuota) ?? null);
    if (!actiu || !servei.teCapacitat('xatMultimedia')) return undefined;
    servei.quotaXat({ ...externalConfig, signal: controller.signal })
      .then((q) => { if (!controller.signal.aborted) { quotesDe(servei).set(clauQuota, q); setQuota(q); setErrorQuota(null); } })
      .catch((e) => {
        if (controller.signal.aborted || e?.name === 'AbortError') return;
        if (SENSE_PANELL.has(String(e?.code ?? ''))) quotesDe(servei).delete(clauQuota);
        setErrorQuota(e);
      });
    return () => { controller.abort(); operacio.current?.abort(); gravadora.current?.cancella(); tornaEnMa(); prenentRef.current = null; };
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
    try {
      const actual = await servei.quotaXat({ ...externalConfig, signal });
      if (viu.current && !signal.aborted) { quotesDe(servei).set(clauQuota, actual); setQuota(actual); }
    } catch { /* La quota anterior continua; el servidor decidix. */ }
  };
  const descarta = () => {
    // «Cancel·la» és la persona qui no el vol: la còpia compartida se'n va.
    alliberaEnMa();
    operacio.current?.abort(); gravadora.current?.cancella(); gravadora.current = null;
    setPreparat(null); setGravant(false); setOcupat(null); setProgres(null); setError(null); setPeu(''); setDeCompartir(false);
  };
  const descartaPendent = async (id) => {
    const controller = new AbortController(); operacio.current = controller;
    setPujant(true); setError(null);
    let descartat = false;
    try {
      await servei.descartaAdjuntXat(id, { ...externalConfig, signal: controller.signal });
      descartat = true;
      if (viu.current && !controller.signal.aborted && preparat?.id === id) setPreparat(null);
    } catch (e) { if (viu.current && !controller.signal.aborted) setError(e); }
    finally { if (viu.current && operacio.current === controller) setPujant(false); }
    if (descartat && viu.current && !controller.signal.aborted) await refrescaQuota(controller.signal);
  };
  const accepta = (adjunt) => {
    if (quota && quota.usats + adjunt.fitxer.size > quota.limit) throw errorAdjuntXat('SDP-XAT-020');
    setPreparat(adjunt);
  };
  /* Torna com ha acabat: 'preparada', 'fallida' (error a la vista), 'avortada'
     (la conversa s'ha tancat o s'ha cancel·lat) o 'ocupada' (no s'ha començat).
     El menú «Compartir» ho necessita per a saber si el fitxer torna al lot. */
  const tria = async (fitxer) => {
    if (!fitxer || pujant || ocupat) return 'ocupada';
    operacio.current?.abort();
    const controller = new AbortController(); operacio.current = controller;
    origen.current = 'tria';
    setOcupat('tria'); setError(null);
    let estat = 'avortada';
    try {
      const adjunt = await preparaAdjunt(fitxer, { signal: controller.signal });
      if (viu.current && !controller.signal.aborted) { accepta(adjunt); estat = 'preparada'; }
    } catch (e) { if (viu.current && !controller.signal.aborted) { setError(e); estat = 'fallida'; } }
    finally { if (viu.current && operacio.current === controller) setOcupat(null); }
    return estat;
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
  // L'últim `tria`, per a l'efecte de baix sense tornar-lo a córrer a cada pintat.
  const triaRef = useRef(tria);
  const textOrfeRef = useRef(onTextOrfe);
  useEffect(() => { triaRef.current = tria; textOrfeRef.current = onTextOrfe; });
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
    if (pujant || ocupat) return;
    // G2120-01 · La nota de veu que sonava calla abans d'obrir el micròfon.
    callaVeuActiva();
    const controller = new AbortController(); operacio.current = controller;
    origen.current = 'grava';
    setOcupat('grava'); setError(null);
    try {
      const control = await gravaVeu({ signal: controller.signal });
      gravadora.current = control;
      if (!controller.signal.aborted) { setSegonsGravats(0); setGravant(true); }
      // El motiu d'una aturada sola és per a avisar ací: no viatja amb l'adjunt.
      const { aturada: motiu, ...adjunt } = await control.resultat;
      if (viu.current && !controller.signal.aborted) { accepta(adjunt); setAturada(motiu ? { id: adjunt.id, motiu } : null); }
    } catch (e) { if (viu.current && !controller.signal.aborted) setError(e); }
    finally { if (viu.current && operacio.current === controller) { setOcupat(null); setGravant(false); gravadora.current = null; } }
  };
  const envia = async () => {
    if (!preparat || pujant) return;
    const controller = new AbortController(); operacio.current = controller;
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
    try {
      const text = preparat.tipus === 'veu' || !deCompartir ? '' : peu.trim();
      const resultat = await onEnvia(fil, text ? { ...preparat, text } : preparat, { signal: controller.signal, onProgres });
      if (!Array.isArray(resultat) || !resultat.length) throw errorAdjuntXat('sense-confirmacio');
      enviat = true;
      // Enviat: la còpia nativa ja sobra (també si la conversa s'ha tancat mentre pujava).
      if (compartitEnviat) alliberaFitxerCompartit(compartitEnviat);
      if (viu.current && !controller.signal.aborted) { setPreparat(null); setPeu(''); setDeCompartir(false); }
    } catch (e) {
      // La previsualització i el mateix ID continuen disponibles per a reintentar.
      // ADV-MEDIA-7 · Un AbortError (les normes rebutjades, la sessió que canvia) calla, com al compositor.
      if (viu.current && !controller.signal.aborted && e?.name !== 'AbortError') setError(e);
    } finally {
      if (viu.current && operacio.current === controller) { setPujant(false); setProgres(null); }
      if (enviantRef.current === compartitEnviat) enviantRef.current = null;
      /* No enviat: si el compositor encara hi és, el torna a tindre (es pot
         reintentar); si s'ha tancat, torna al lot. */
      if (compartitEnviat && !enviat) {
        if (viu.current && !controller.signal.aborted) enMaRef.current = compartitEnviat;
        else tornaFitxerCompartit(compartitEnviat);
      }
    }
    // La quota inclou reserves i reintents: sempre tornem a llegir-la.
    if (!viu.current) return;
    if (!controller.signal.aborted) await refrescaQuota(controller.signal);
    /* ADV-MEDIA-13 · Cancel·la durant la pujada: si Storage ja tenia l'objecte,
       la reserva queda pendent. En acabar es torna a llegir perquè aparega
       «Descarta el fitxer pendent». Un canvi de fil o de sessió la llig ell. */
    else if (operacio.current === controller) await refrescaQuota(new AbortController().signal);
  };

  /* P1-66 · Sense capacitat, sense la migració (MEDIA-10) o sense cap lectura
     de la quota encara, el Compositor ix sense adjunts: ni + ni micròfon. El
     fragment té sempre la mateixa forma (safata, compositor): el camp no es
     torna a muntar quan els adjunts arriben. */
  const disponible = actiu && servei.teCapacitat('xatMultimedia') && !SENSE_PANELL.has(String(errorQuota?.code ?? ''))
    && Boolean(quota || errorQuota);
  if (!disponible) return <>{null}{children?.(null) ?? null}</>;
  const mb = (bytes, decimals = 1) => new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(bytes / 1_000_000);
  const potGravar = Boolean(globalThis.navigator?.mediaDevices?.getUserMedia && mimeDeGravacio(globalThis.MediaRecorder));
  /* La càmera directa, només en una pantalla tàctil (mòbil, tauleta): és on
     `capture` obri la càmera; a l'escriptori seria el mateix selector. */
  const tactil = Boolean(globalThis.matchMedia?.(CONSULTA_TACTIL)?.matches);
  const avisUbicacio = preparat?.tipus === 'video' && !preparat.senseUbicacio;
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
    : ocupat === 'grava' ? t('section.xat.adjunts.esperantMicro', 'Esperant el permís del micròfon…')
      : ocupat ? t('section.xat.adjunts.preparant', 'Preparant el fitxer…') : avisAturada;
  const percentatge = (fraccio) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(fraccio);
  /* P1-66 · La safata només ocupa lloc mentre hi ha alguna cosa a fer; buida,
     col·lapsa a 0 (modules.css) i no és cap grup. La regió viva dels passos i
     els selectors de fitxer hi són sempre. */
  const activa = Boolean(error || quota?.pendents?.length || preparat || ocupat || gravant || progres);
  const safata = (
    <div className={`sdp-xat-adjunts${activa ? ' sdp-xat-adjunts--activa' : ''}`} role={activa ? 'group' : undefined}
      aria-label={activa ? t('section.xat.adjunts.grup', 'Adjunts del xat') : undefined} ref={contenidor}>
      {error ? <p role="alert">{textDErrorAdjunt(error, t, t('section.xat.adjunts.error.envia', 'No hem pogut enviar el fitxer.'))}</p> : null}
      {quota?.pendents?.length ? <div role="group" aria-label={t('section.xat.adjunts.pendents', 'Fitxers pendents d’enviar')}>
        <p>{t('section.xat.adjunts.pendentsText', 'Tens fitxers que no s’han arribat a enviar. Pots descartar-los per recuperar espai.')}</p>
        {quota.pendents.map((a) => <button type="button" className="sdp-xat-pindola" key={a.id} disabled={pujant || Boolean(ocupat)} onClick={() => descartaPendent(a.id)}>
          {t('section.xat.adjunts.descartaPendent', 'Descarta el fitxer pendent ({mida} MB)').replace('{mida}', mb(a.bytes))}
        </button>)}
      </div> : null}
      {/* MEDIA-9 · Cancel·la també durant la pujada: amb el temps proporcional a la mida, s'ha de poder parar. */}
      {ocupat || preparat ? (
        <div className="sdp-xat-adjunts__fila">
          {preparat && url ? <PrevisualitzacioAdjunt tipus={preparat.tipus} url={url} duradaMs={preparat.duradaMs} locale={locale} t={t} /> : null}
          {/* XAT-07 · role=timer no és una regió viva que parle: els avisos van a la de baix. */}
          {gravant ? <span className="sdp-xat-adjunts__rellotge" role="timer"><span className="sdp-nomes-lector">{t('section.xat.adjunts.tempsGravacio', 'Temps de gravació')} </span>{tempsDeVeu(segonsGravats * 1000)}</span> : null}
          <button type="button" className="sdp-xat-icona sdp-xat-adjunts__cancella" ref={botons.cancella} onClick={descarta}
            aria-label={t('section.xat.adjunts.cancella', 'Cancel·la')}><X size={20} aria-hidden="true" focusable="false" /></button>
        </div>
      ) : null}
      {preparat && deCompartir && preparat.tipus !== 'veu' ? (
        <label className="sdp-xat-adjunts__peu">
          <span className="sdp-nomes-lector">{t('section.xat.adjunts.peu', 'Text del fitxer (opcional)')}</span>
          <input type="text" name="xatPeuAdjunt" autoComplete="off" maxLength={LIMIT_TEXT} value={peu} disabled={pujant}
            placeholder={t('section.xat.adjunts.peuPlaceholder', 'Afig un text…')}
            onChange={(e) => setPeu(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing) { e.preventDefault(); envia(); } }} />
        </label>
      ) : null}
      {avisUbicacio ? <p className="sdp-xat-adjunts__avis" id={idAvis}>{t('section.xat.adjunts.videoUbicacio', 'Este vídeo s’envia tal com és: si el mòbil hi va guardar la ubicació, qui el reba la podrà vore.')}</p> : null}
      {/* XAT-03 · La barra nativa diu el percentatge als lectors; el text visible no es repetix. */}
      {progres && preparat ? (
        <p className="sdp-xat-adjunts__progres">
          <progress max="1" value={progres.fraccio ?? undefined} aria-label={t('section.xat.adjunts.progres', 'Progrés de l’enviament')} />
          {progres.fraccio === null ? null : <span aria-hidden="true">{percentatge(progres.fraccio)}</span>}
        </p>
      ) : null}
      <p className={avisAturada && estat === avisAturada ? 'sdp-xat-adjunts__estat sdp-xat-adjunts__avis' : 'sdp-xat-adjunts__estat'} role="status">{estat}</p>
      <input className="sdp-nomes-lector" type="file" ref={selector} accept={ACCEPTA_GALERIA} tabIndex={-1} aria-label={t('section.xat.adjunts.selector', 'Tria una foto o un vídeo de fins a 10 segons')} onChange={(e) => { const fitxer = e.target.files?.[0]; e.target.value = ''; tria(fitxer); }} />
      {tactil ? <input className="sdp-nomes-lector" type="file" ref={selectorCamera} accept="image/*" capture="environment" tabIndex={-1} aria-label={t('section.xat.adjunts.selectorCamera', 'Fes una foto amb la càmera')} onChange={(e) => { const fitxer = e.target.files?.[0]; e.target.value = ''; tria(fitxer); }} /> : null}
    </div>
  );
  /* P1-66 · El botó redó de la barra, per prioritat: Atura mentre grava,
     Envia el fitxer amb un de preparat (encara que hi haja text: el text es
     queda al camp), Grava àudio amb el camp buit, i si no, el d'enviar text
     del Compositor. Els noms accessibles són els de sempre. */
  const primari = gravant
    ? { clau: 'atura', etiqueta: t('section.xat.adjunts.atura', 'Atura la gravació'), icona: Square, onClick: () => gravadora.current?.atura() }
    : preparat
      ? { clau: 'envia', etiqueta: pujant ? t('section.xat.adjunts.enviant', 'Enviant…') : t('section.xat.adjunts.envia', 'Envia el fitxer'), icona: Send, onClick: envia, ariaDisabled: pujant, ocupat: pujant, descritPer: avisUbicacio ? idAvis : undefined }
      : quota && potGravar && !ocupat
        ? { clau: 'grava', etiqueta: t('section.xat.adjunts.grava', 'Grava àudio'), icona: Mic, onClick: grava, nomesBuit: true, ariaDisabled: pujant }
        : null;
  /* El menú del +: només el que funciona (decisió del Mestre, 261028). Sense
     quota llegida, només «Torna-ho a provar»; la quota i el micròfon que no
     hi és, al peu, discrets. */
  const opcions = quota ? [
    { id: 'fotos', etiqueta: t('section.xat.adjunts.fotos', 'Fotos i vídeos'), icona: ImagePlus, onTria: () => selector.current?.click() },
    ...(tactil ? [{ id: 'camera', etiqueta: t('section.xat.adjunts.camera', 'Càmera'), icona: Camera, onTria: () => selectorCamera.current?.click() }] : [])
  ] : [
    { id: 'reintenta', etiqueta: t('section.xat.missatge.reintenta', 'Torna-ho a provar'), icona: RefreshCw, onTria: () => setIntentQuota((n) => n + 1) }
  ];
  const peuMenu = [
    quota ? t('section.xat.adjunts.quota', '{usats} de {limit} MB del xat').replace('{usats}', mb(quota.usats)).replace('{limit}', mb(quota.limit, 0))
      : t('section.xat.adjunts.quotaIllegible', 'No hem pogut llegir l’espai que et queda per a fitxers.'),
    quota && !potGravar ? t('section.xat.adjunts.senseGravacio', 'Este navegador no permet gravar àudio.') : null
  ].filter(Boolean);
  const adjunts = {
    etiqueta: t('section.xat.adjunts.menu', 'Adjunta'),
    etiquetaMenu: t('section.xat.adjunts.grup', 'Adjunts del xat'),
    refBoto: botons.adjunta,
    refPrimari: botons.primari,
    bloquejat: pujant || Boolean(ocupat) || Boolean(preparat) || gravant,
    opcions,
    peuMenu,
    primari
  };
  return <>{safata}{children?.(adjunts) ?? null}</>;
}
