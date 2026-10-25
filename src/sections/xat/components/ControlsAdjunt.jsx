import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, Mic, Send, Square, X } from 'lucide-react';
import { descartaAdjuntXat, quotaXat, teCapacitat } from '../../../data/backendPort.js';
import { errorAdjuntXat } from '../../../data/xatMultimedia.js';
import { MAX_VEU_MS, gravaVeu, mimeDeGravacio, preparaAdjunt, textDErrorAdjunt } from '../adjuntLocal.js';
import { PrevisualitzacioAdjunt, callaVeuActiva, tempsDeVeu, traductorAdjunt } from './AdjuntXat.jsx';

const PORT = { quotaXat, teCapacitat, descartaAdjuntXat };
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

export default function ControlsAdjunt({ fil, onEnvia, servei = PORT, externalConfig, usuariId, t: tProp, locale = 'ca-ES' }) {
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
  const selector = useRef(null);
  const operacio = useRef(null);
  const gravadora = useRef(null);
  const viu = useRef(true);
  const contenidor = useRef(null);
  const botons = { tria: useRef(null), grava: useRef(null), atura: useRef(null), envia: useRef(null), cancella: useRef(null) };
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
    setPreparat(null); setGravant(false); setOcupat(null); setPujant(false); setProgres(null); setError(null);
    setQuota(quotesDe(servei).get(clauQuota) ?? null); setErrorQuota(null);
    if (!servei.teCapacitat('xatMultimedia')) return undefined;
    servei.quotaXat({ ...externalConfig, signal: controller.signal })
      .then((q) => { if (!controller.signal.aborted) { quotesDe(servei).set(clauQuota, q); setQuota(q); } })
      .catch((e) => {
        if (controller.signal.aborted || e?.name === 'AbortError') return;
        if (SENSE_PANELL.has(String(e?.code ?? ''))) quotesDe(servei).delete(clauQuota);
        setErrorQuota(e);
      });
    return () => { controller.abort(); operacio.current?.abort(); gravadora.current?.cancella(); };
  }, [servei, externalConfig, clauQuota, fil.id, intentQuota]);
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
     compositor. */
  const objectiu = gravant ? 'atura' : preparat ? 'envia' : ocupat ? 'cancella' : origen.current;
  const objectiuAnterior = useRef(objectiu);
  const pujantAnterior = useRef(pujant);
  useEffect(() => {
    const canvia = objectiuAnterior.current !== objectiu;
    const acabaDePujar = pujantAnterior.current !== pujant;
    objectiuAnterior.current = objectiu;
    pujantAnterior.current = pujant;
    const node = contenidor.current;
    if (!node || (!canvia && !acabaDePujar)) return;
    /* ADV-MEDIA-5 · A l'encastat, el ShadowRoot no té activeElement quan el
       focus és a la pàgina amfitriona: això no és un focus perdut. */
    const arrel = node.getRootNode();
    const actiu = arrel.activeElement ?? null;
    const actiuDoc = node.ownerDocument.activeElement;
    const perdut = actiu ? actiu.tagName === 'BODY'
      : !actiuDoc || actiuDoc === node.ownerDocument.body || actiuDoc === arrel.host;
    if (perdut || (canvia && node.contains(actiu))) botons[objectiu]?.current?.focus();
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
    operacio.current?.abort(); gravadora.current?.cancella(); gravadora.current = null;
    setPreparat(null); setGravant(false); setOcupat(null); setProgres(null); setError(null);
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
  const tria = async (fitxer) => {
    if (!fitxer || pujant || ocupat) return;
    operacio.current?.abort();
    const controller = new AbortController(); operacio.current = controller;
    origen.current = 'tria';
    setOcupat('tria'); setError(null);
    try {
      const adjunt = await preparaAdjunt(fitxer, { signal: controller.signal });
      if (viu.current && !controller.signal.aborted) accepta(adjunt);
    } catch (e) { if (viu.current && !controller.signal.aborted) setError(e); }
    finally { if (viu.current && operacio.current === controller) setOcupat(null); }
  };
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
    try {
      const resultat = await onEnvia(fil, preparat, { signal: controller.signal, onProgres });
      if (!Array.isArray(resultat) || !resultat.length) throw errorAdjuntXat('sense-confirmacio');
      if (viu.current && !controller.signal.aborted) setPreparat(null);
    } catch (e) {
      // La previsualització i el mateix ID continuen disponibles per a reintentar.
      // ADV-MEDIA-7 · Un AbortError (les normes rebutjades, la sessió que canvia) calla, com al compositor.
      if (viu.current && !controller.signal.aborted && e?.name !== 'AbortError') setError(e);
    } finally { if (viu.current && operacio.current === controller) { setPujant(false); setProgres(null); } }
    // La quota inclou reserves i reintents: sempre tornem a llegir-la.
    if (!viu.current) return;
    if (!controller.signal.aborted) await refrescaQuota(controller.signal);
    /* ADV-MEDIA-13 · Cancel·la durant la pujada: si Storage ja tenia l'objecte,
       la reserva queda pendent. En acabar es torna a llegir perquè aparega
       «Descarta el fitxer pendent». Un canvi de fil o de sessió la llig ell. */
    else if (operacio.current === controller) await refrescaQuota(new AbortController().signal);
  };

  if (!servei.teCapacitat('xatMultimedia') || SENSE_PANELL.has(String(errorQuota?.code ?? ''))) return null;
  if (!quota && !errorQuota) return null;
  if (!quota) {
    return (
      <div className="sdp-xat-adjunts" role="group" aria-label={t('section.xat.adjunts.grup', 'Adjunts del xat')}>
        <p>
          {t('section.xat.adjunts.quotaIllegible', 'No hem pogut llegir l’espai que et queda per a fitxers.')}
          {' '}<button type="button" className="sdp-xat-pindola sdp-xat-pindola--secundaria" onClick={() => setIntentQuota((n) => n + 1)}>{t('section.xat.missatge.reintenta', 'Torna-ho a provar')}</button>
        </p>
      </div>
    );
  }
  const mb = (bytes, decimals = 1) => new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(bytes / 1_000_000);
  const potGravar = Boolean(globalThis.navigator?.mediaDevices?.getUserMedia && mimeDeGravacio(globalThis.MediaRecorder));
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
  return (
    <div className="sdp-xat-adjunts" role="group" aria-label={t('section.xat.adjunts.grup', 'Adjunts del xat')} ref={contenidor}>
      <p className="sdp-xat-adjunts__quota">{t('section.xat.adjunts.quota', '{usats} de {limit} MB del xat').replace('{usats}', mb(quota.usats)).replace('{limit}', mb(quota.limit, 0))}</p>
      {error ? <p role="alert">{textDErrorAdjunt(error, t, t('section.xat.adjunts.error.envia', 'No hem pogut enviar el fitxer.'))}</p> : null}
      {quota.pendents?.length ? <div role="group" aria-label={t('section.xat.adjunts.pendents', 'Fitxers pendents d’enviar')}>
        <p>{t('section.xat.adjunts.pendentsText', 'Tens fitxers que no s’han arribat a enviar. Pots descartar-los per recuperar espai.')}</p>
        {quota.pendents.map((a) => <button type="button" className="sdp-xat-pindola" key={a.id} disabled={pujant || Boolean(ocupat)} onClick={() => descartaPendent(a.id)}>
          {t('section.xat.adjunts.descartaPendent', 'Descarta el fitxer pendent ({mida} MB)').replace('{mida}', mb(a.bytes))}
        </button>)}
      </div> : null}
      {preparat && url ? <PrevisualitzacioAdjunt tipus={preparat.tipus} url={url} duradaMs={preparat.duradaMs} locale={locale} t={t} /> : null}
      {avisUbicacio ? <p className="sdp-xat-adjunts__avis" id={idAvis}>{t('section.xat.adjunts.videoUbicacio', 'Este vídeo s’envia tal com és: si el mòbil hi va guardar la ubicació, qui el reba la podrà vore.')}</p> : null}
      {/* XAT-03 · La barra nativa diu el percentatge als lectors; el text visible no es repetix. */}
      {progres && preparat ? (
        <p className="sdp-xat-adjunts__progres">
          <progress max="1" value={progres.fraccio ?? undefined} aria-label={t('section.xat.adjunts.progres', 'Progrés de l’enviament')} />
          {progres.fraccio === null ? null : <span aria-hidden="true">{percentatge(progres.fraccio)}</span>}
        </p>
      ) : null}
      <input className="sdp-nomes-lector" type="file" ref={selector} accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime" tabIndex={-1} aria-label={t('section.xat.adjunts.selector', 'Tria una foto o un vídeo de fins a 10 segons')} onChange={(e) => { const fitxer = e.target.files?.[0]; e.target.value = ''; tria(fitxer); }} />
      <div className="sdp-xat-adjunts__accions">
        {!preparat && !ocupat ? <>
          <button type="button" className="sdp-xat-pindola" ref={botons.tria} disabled={pujant} onClick={() => selector.current?.click()}><ImagePlus size={20} aria-hidden="true" /> {t('section.xat.adjunts.tria', 'Foto o vídeo')}</button>
          <button type="button" className="sdp-xat-pindola" ref={botons.grava} disabled={pujant || !potGravar} onClick={grava}><Mic size={20} aria-hidden="true" /> {t('section.xat.adjunts.grava', 'Grava àudio')}</button>
        </> : null}
        {/* XAT-07 · role=timer no és una regió viva que parle: els avisos van a la de baix. */}
        {gravant ? <span className="sdp-xat-adjunts__rellotge" role="timer"><span className="sdp-nomes-lector">{t('section.xat.adjunts.tempsGravacio', 'Temps de gravació')} </span>{tempsDeVeu(segonsGravats * 1000)}</span> : null}
        {gravant ? <button type="button" className="sdp-xat-pindola" ref={botons.atura} onClick={() => gravadora.current?.atura()}><Square size={20} aria-hidden="true" /> {t('section.xat.adjunts.atura', 'Atura la gravació')}</button> : null}
        {/* Mentre puja, el botó continua enfocable (aria-disabled): el focus no es perd. */}
        {preparat ? <button type="button" className="sdp-xat-pindola" ref={botons.envia} onClick={envia} aria-disabled={pujant || undefined} aria-describedby={avisUbicacio ? idAvis : undefined}><Send size={20} aria-hidden="true" /> {pujant ? t('section.xat.adjunts.enviant', 'Enviant…') : t('section.xat.adjunts.envia', 'Envia el fitxer')}</button> : null}
        {/* MEDIA-9 · També durant la pujada: amb el temps proporcional a la mida, s'ha de poder parar. */}
        {ocupat || preparat ? <button type="button" className="sdp-xat-pindola" ref={botons.cancella} onClick={descarta}><X size={20} aria-hidden="true" /> {t('section.xat.adjunts.cancella', 'Cancel·la')}</button> : null}
      </div>
      <p className={avisAturada && estat === avisAturada ? 'sdp-xat-adjunts__estat sdp-xat-adjunts__avis' : 'sdp-xat-adjunts__estat'} role="status">{estat}</p>
      {!potGravar ? <p>{t('section.xat.adjunts.senseGravacio', 'Este navegador no permet gravar àudio.')}</p> : null}
    </div>
  );
}
