import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Mic, Pause, Play } from 'lucide-react';
import { teCapacitat, urlAdjuntXat } from '../../../data/backendPort.js';
import { errorAdjuntXat } from '../../../data/xatMultimedia.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../../config/xifratXat.js';
import { textDErrorAdjunt } from '../adjuntLocal.js';

/* QA-C01 (Gauntlet 261029_1858) · Retenció dels blob: desxifrats que es pinten
   o sonen. Amb el xat xifrat, el registre LRU (data/xatMultimediaXifrat.js) no
   revoca mai una URL retinguda: cada peça la reté des que la rep (el motor la
   pren en el mateix tic que la servix) fins que se'n desmunta o en rep una
   altra. Si el sostre de 100 MB no deixa crear-ne cap de nova, la peça mostra
   l'error amb «Torna-ho a provar». Bandera apagada: la mateixa crida de sempre
   ({ renova }) i cap retenció (les URL signades no es revoquen). La bandera es
   llig en cridar: una prova que simula la configuració no tomba la peça. */
const ambRetencio = () => {
  try { return E2EE_ACTIU_PER_DEFECTE === true; } catch { return false; }
};
/* La retenció d'una sola petició: la posa el motor (reten); qui rep la URL la pren o la deixa anar. */
function creaRetencio() {
  let allibera = null;
  return {
    reten: (fn) => {
      const abans = allibera;
      allibera = typeof fn === 'function' ? fn : null;
      if (abans) abans();
    },
    pren: () => {
      const fn = allibera;
      allibera = null;
      return fn;
    },
    deixa: () => {
      const fn = allibera;
      allibera = null;
      if (fn) fn();
    }
  };
}
/* La retenció de la URL que la peça té posada: una de nova allibera l'anterior,
   i desmuntar-se, l'última. Un contenidor d'estat, no una ref: la neteja ha de
   llegir el valor del moment, no el del muntatge. */
function useRetencioDeLaFont() {
  const [actual] = useState(() => ({ allibera: null }));
  useEffect(() => () => {
    const fn = actual.allibera;
    actual.allibera = null;
    if (fn) fn();
  }, [actual]);
  return useCallback((nova) => {
    const vella = actual.allibera;
    actual.allibera = typeof nova === 'function' ? nova : null;
    if (vella && vella !== nova) vella();
  }, [actual]);
}

const enValencia = (_clau, text) => text;
/* Gauntlet 261022_0225 (crítica Claude, MEDIA-5) · El traductor de les peces
   d'adjunts és el `t` que els passen, com a la resta del xat (Bombolla,
   Compositor); soltes (espècimens i proves), el valencià. No es llig cap
   context: les proves del xat el fan de mentides a mitges. */
export const traductorAdjunt = (t) => (typeof t === 'function' ? t : enValencia);

/** m:ss d'una durada en mil·lisegons. */
export function tempsDeVeu(ms, arrodonix = Math.floor) {
  const segons = Math.max(0, arrodonix((Number(ms) || 0) / 1000));
  return `${Math.floor(segons / 60)}:${String(segons % 60).padStart(2, '0')}`;
}

/* XAT-08 i l'omissió del verificador (261025) · Les notes de veu, com a
   WhatsApp, coordinades des del mòdul i sense cap context:
   · una sola sona alhora: la que comença, dins del mateix gest, para la que
     sonava (i també la que encara esperava la URL, que ja no sonarà);
   · la velocitat (1× → 1,5× → 2×) és una per a totes durant la sessió;
   · cada nota recorda on es va quedar (per persona: id → segons): eixir de la
     conversa o passar pel mode de selecció la reprén d'allí, i acabar-la
     l'oblida.
   No s'encadena la nota següent: iOS no deixa fer play() fora d'un gest. */
const VELOCITATS_VEU = Object.freeze([1, 1.5, 2]);
const MAXIM_POSICIONS = 300;
const veus = { activa: null, velocitat: VELOCITATS_VEU[0], oients: new Set(), posicions: new Map() };
function prenLaVeu(nota) {
  if (veus.activa && veus.activa !== nota) veus.activa.calla();
  veus.activa = nota;
}
function deixaLaVeu(nota) { if (veus.activa === nota) veus.activa = null; }
/* Consens Gauntlet 2120 (G2120-01) · Començar a gravar una nota de veu para
   la que estiga sonant, com si es premera Pausa: sense, la nota rebuda
   continuava sonant mentre es gravava la resposta. */
export function callaVeuActiva() {
  if (veus.activa) {
    const anterior = veus.activa;
    veus.activa = null;
    anterior.calla();
  }
}
const subscriuVelocitat = (oient) => { veus.oients.add(oient); return () => veus.oients.delete(oient); };
const velocitatVeu = () => veus.velocitat;
function seguentVelocitat() {
  veus.velocitat = VELOCITATS_VEU[(VELOCITATS_VEU.indexOf(veus.velocitat) + 1) % VELOCITATS_VEU.length];
  veus.oients.forEach((oient) => oient());
}
function recordaPosicio(clau, segons) {
  if (!clau) return;
  veus.posicions.delete(clau);
  if (!(segons > 0)) return;
  veus.posicions.set(clau, segons);
  if (veus.posicions.size > MAXIM_POSICIONS) veus.posicions.delete(veus.posicions.keys().next().value);
}
/** Només per a proves: la veu, la velocitat i les posicions són del mòdul. */
export function _reiniciaVeus() {
  veus.activa = null;
  veus.posicions.clear();
  if (veus.velocitat !== VELOCITATS_VEU[0]) { veus.velocitat = VELOCITATS_VEU[0]; veus.oients.forEach((oient) => oient()); }
}

/* Gauntlet 261022_0225 (crítica Claude, MEDIA-7) · El reproductor de veu de
   Pedra Seca: botó de reproduir i pausar, barra de posició i durada. La
   durada ve de metadades.adjunt.duradaMs (el rellotge de la gravació) fins
   que el navegador en sap una de finita: el WebM de Chromium no la porta.
   La URL es demana en prémer (MEDIA-8): el play() sense font, dins del gest,
   desbloqueja l'element a WebKit abans d'esperar la signatura. Si la
   signatura caduca abans o durant la reproducció (STRESS-7), se'n demana
   una de nova una vegada i es continua des del mateix punt.
   Gauntlet 261022_0225 (crítica Claude, ADV-MEDIA-10) · La vista quieta (el
   mode de selecció) és una altra peça, sense <audio> ni controls dins de la
   casella: en passar-hi, el reproductor es desmunta (para el so i buida el
   seu únic element) i en tornar n'hi ha un de nou, en repòs: «Reprodueix» i
   la URL en prémer (dins dels 60 s, la mateixa signatura i cap petició). */
export function ReproductorVeu({ interactiu = true, ...props }) {
  return interactiu ? <ReproductorActiu {...props} /> : <VeuQuieta duradaMs={props.duradaMs} t={props.t} />;
}

function VeuQuieta({ duradaMs = null, t }) {
  const total = Number.isFinite(duradaMs) && duradaMs > 0 ? duradaMs : 0;
  return (
    <p className="sdp-xat-veu sdp-xat-veu--quieta">
      <Mic size={20} aria-hidden="true" focusable="false" />
      <span>{t('section.xat.adjunts.veu', 'Missatge de veu')}</span>
      <span className="sdp-xat-veu__temps">{tempsDeVeu(total, Math.round)}</span>
    </p>
  );
}

function ReproductorActiu({ obteUrl, duradaMs = null, memoria = null, locale = 'ca-ES', t }) {
  const audio = useRef(null);
  const viu = useRef(true);
  const volSonar = useRef(false);
  const recarregant = useRef(false);
  /* Consens Gauntlet 2120 (C2120-04 + G2120-04) · La generació de la càrrega.
     Prémer, pausar i tornar a prémer (o A→B→A) abans que arribe la primera
     signatura en llança dues: l'error tardà de la primera parava la segona,
     i la segona, en arribar, ja no sonava. Calla, pausa i cada càrrega la
     pugen: només la càrrega vigent pinta o para. */
  const intent = useRef(0);
  const reintentat = useRef(false);
  const repren = useRef(0);
  // On anava, en segons: el que es desa en desmuntar-se i es reprén en tornar.
  const posicio = useRef(veus.posicions.get(memoria) ?? 0);
  const [sona, setSona] = useState(false);
  const [carregant, setCarregant] = useState(false);
  const [teFont, setTeFont] = useState(false);
  const [posMs, setPosMs] = useState(() => posicio.current * 1000);
  const [duradaReal, setDuradaReal] = useState(null);
  const [error, setError] = useState(null);
  // S'ha premut almenys una vegada: la pastilla de velocitat ja no se'n va.
  const [usada, setUsada] = useState(false);
  const velocitat = useSyncExternalStore(subscriuVelocitat, velocitatVeu, velocitatVeu);
  // Qui té la veu: una altra nota que comença la para com si es premera Pausa.
  const [nota] = useState(() => ({
    calla() { intent.current += 1; recarregant.current = false; volSonar.current = false; audio.current?.pause(); if (viu.current) setCarregant(false); }
  }));
  const total = duradaReal ?? (Number.isFinite(duradaMs) && duradaMs > 0 ? duradaMs : 0);
  const etiqueta = t('section.xat.adjunts.veu', 'Missatge de veu');
  const textTotal = tempsDeVeu(total, Math.round);
  const textVelocitat = `${new Intl.NumberFormat(locale).format(velocitat)}×`;

  useEffect(() => {
    viu.current = true;
    const element = audio.current;
    return () => {
      viu.current = false;
      deixaLaVeu(nota);
      recordaPosicio(memoria, element?.ended ? 0 : posicio.current);
      if (element) { element.pause(); element.removeAttribute('src'); element.load(); }
    };
  }, [nota, memoria]);
  // La font nova torna a defaultPlaybackRate: es fixen totes dues.
  useEffect(() => {
    const element = audio.current;
    if (element) { element.defaultPlaybackRate = velocitat; element.playbackRate = velocitat; }
  }, [velocitat]);
  /* QA-C01 · Després de l'efecte que buida l'<audio>: en desmuntar-se, primer
     es lleva la font i després s'allibera la URL. */
  const fixaRetencio = useRetencioDeLaFont();

  const carrega = (renova) => {
    const element = audio.current;
    const meu = ++intent.current;
    const vigent = () => intent.current === meu && volSonar.current && viu.current;
    const retencio = creaRetencio();
    recarregant.current = true;
    setCarregant(true);
    setError(null);
    obteUrl({ renova, reten: retencio.reten }).then((url) => {
      if (!vigent() || !element) { retencio.deixa(); return undefined; }
      element.src = url;
      /* La font nova ja és posada: ara es pot alliberar l'anterior. */
      fixaRetencio(retencio.pren());
      setTeFont(true);
      return element.play();
    }).catch((e) => {
      retencio.deixa();
      /* Gauntlet 261022_0225 (crítica Claude, ADV-MEDIA-2) · Una font que no
         carrega (CSP, token caducat, còdec) rebutja el play() amb
         NotSupportedError: la gestiona fallaCarrega (renova i, la segona,
         l'error amb codi). Ací només la resta, sempre amb text traduïble. */
      if (!vigent() || e?.name === 'AbortError' || e?.name === 'NotSupportedError') return;
      volSonar.current = false;
      setSona(false);
      setError(e?.code ? e : errorAdjuntXat('obrir'));
    }).finally(() => {
      /* Només la generació: un error de la càrrega vigent ja ha llevat
         volSonar, i el botó no es pot quedar «carregant». Una de vella no
         toca res: qui l'ha invalidada (calla, pausa o una altra càrrega) ja
         ha deixat recarregant i carregant com toca. */
      if (intent.current !== meu) return;
      recarregant.current = false;
      if (viu.current) setCarregant(false);
    });
  };
  const commuta = () => {
    const element = audio.current;
    if (!element) return;
    if (volSonar.current) { intent.current += 1; recarregant.current = false; volSonar.current = false; element.pause(); setCarregant(false); return; }
    volSonar.current = true;
    prenLaVeu(nota);
    setUsada(true);
    const font = element.getAttribute('src');
    if (font && !error && !element.error) { element.play()?.catch?.(() => {}); return; }
    // Sense font, o després d'un error (el botó «Torna-ho a provar»): signatura nova.
    reintentat.current = false;
    // La font nova comença a 0: es continua des d'on s'havia quedat la nota.
    repren.current = posicio.current;
    element.play()?.catch?.(() => {});
    carrega(Boolean(font));
  };
  const fallaCarrega = () => {
    // Una nota que ja no ha de sonar (pausada o callada per una altra) no renova la signatura.
    if (!volSonar.current) return;
    const element = audio.current;
    if (!element?.getAttribute('src') || !viu.current) return;
    if (reintentat.current) { volSonar.current = false; setSona(false); setCarregant(false); setError(errorAdjuntXat('obrir')); return; }
    reintentat.current = true;
    // La font nova torna a començar: es continua des d'on anava en tindre metadades.
    repren.current = element.currentTime || posMs / 1000;
    carrega(true);
  };
  const durada = (e) => {
    const segons = e.currentTarget.duration;
    if (Number.isFinite(segons) && segons > 0) setDuradaReal(segons * 1000);
  };
  /* Consens Gauntlet 2120 (G2120-05) · WebKit pot tornar a 1× en carregar una
     font nova: en tindre metadades i en sonar es reafirma la velocitat triada. */
  const fixaVelocitat = (element) => {
    element.defaultPlaybackRate = velocitatVeu();
    element.playbackRate = velocitatVeu();
  };
  const metadades = (e) => {
    durada(e);
    fixaVelocitat(e.currentTarget);
    if (repren.current) { e.currentTarget.currentTime = repren.current; repren.current = 0; }
  };

  const textPosicio = t('section.xat.adjunts.temps', '{posicio} de {durada}')
    .replace('{posicio}', tempsDeVeu(posMs)).replace('{durada}', textTotal);
  const enMarxa = sona || carregant;
  /* XAT-08 · Amb la pastilla, la fila de 16rem ha de cabre en un mòbil de
     320px: el temps passa a un sol número, com a WhatsApp (on va mentre sona
     o s'ha parat a mitges; la durada en tornar a començar). Més estreta, la
     pastilla baixa de línia (el CSS). En repòs, la fila de sempre. Un cop
     premuda, la pastilla no se'n va (ni amb l'error): el focus no es perd. */
  const textTemps = !usada ? `${tempsDeVeu(posMs)} / ${textTotal}` : enMarxa || posMs > 0 ? tempsDeVeu(posMs) : textTotal;
  return (
    <div className="sdp-xat-veu-caixa">
      <div className={usada ? 'sdp-xat-veu sdp-xat-veu--velocitat' : 'sdp-xat-veu'} role="group" aria-label={etiqueta}>
        <button
          type="button"
          className="sdp-xat-veu__boto"
          onClick={commuta}
          aria-label={enMarxa ? t('section.xat.adjunts.pausa', 'Pausa el missatge de veu') : t('section.xat.adjunts.reprodueix', 'Reprodueix el missatge de veu')}
          aria-busy={carregant || undefined}
        >
          {enMarxa ? <Pause size={20} aria-hidden="true" focusable="false" /> : <Play size={20} aria-hidden="true" focusable="false" />}
        </button>
        <input
          type="range"
          className="sdp-xat-veu__posicio"
          min="0"
          max={Math.max(total, 1) / 1000}
          step="0.1"
          value={Math.min(posMs, total) / 1000}
          disabled={!teFont || !total}
          aria-label={t('section.xat.adjunts.posicio', 'Posició del missatge de veu')}
          aria-valuetext={textPosicio}
          onChange={(e) => {
            const segons = Number(e.target.value);
            if (audio.current) audio.current.currentTime = segons;
            posicio.current = segons;
            setPosMs(segons * 1000);
          }}
        />
        <span className="sdp-xat-veu__temps">{textTemps}</span>
        {usada ? (
          <button
            type="button"
            className="sdp-xat-veu__velocitat"
            onClick={seguentVelocitat}
            aria-label={t('section.xat.adjunts.velocitat', 'Velocitat de reproducció: {velocitat}').replace('{velocitat}', textVelocitat)}
          >
            {textVelocitat}
          </button>
        ) : null}
        <audio
          ref={audio}
          preload="none"
          onPlay={(e) => { fixaVelocitat(e.currentTarget); prenLaVeu(nota); setUsada(true); setSona(true); }}
          onPlaying={() => { reintentat.current = false; }}
          onPause={() => { if (!recarregant.current) { volSonar.current = false; deixaLaVeu(nota); } setSona(false); }}
          onEnded={(e) => { volSonar.current = false; deixaLaVeu(nota); setSona(false); setPosMs(0); posicio.current = 0; recordaPosicio(memoria, 0); e.currentTarget.currentTime = 0; }}
          onTimeUpdate={(e) => { posicio.current = e.currentTarget.currentTime; setPosMs(e.currentTarget.currentTime * 1000); }}
          onLoadedMetadata={metadades}
          onDurationChange={durada}
          onError={fallaCarrega}
        />
      </div>
      {error ? (
        <p className="sdp-xat-adjunt__estat">
          {textDErrorAdjunt(error, t, t('section.xat.adjunts.error.obrir', 'No hem pogut obrir el fitxer.'))}
          {' '}<button type="button" className="sdp-xat-pindola sdp-xat-pindola--secundaria" onClick={commuta}>{t('section.xat.missatge.reintenta', 'Torna-ho a provar')}</button>
        </p>
      ) : null}
    </div>
  );
}

/* MEDIA-8 i STRESS-2 · Una foto o un vídeo demana la URL quan entra (o està a
   punt d'entrar) a la vista, no en muntar-se: obrir un historial llarg no
   llança una ràfega de peticions. Un error de càrrega renova la signatura una
   vegada sense demanar res a la persona; el segon, el botó.
   Gauntlet 261022_0225 (crítica Claude, ADV-MEDIA-6) · L'arrel és la llista
   que desplaça: amb el viewport, el marge de 200px no passa del retall de la
   llista i res no es carregava per avançat. Fora de la llista, el viewport. */
function useFontVisible(obteUrl) {
  const caixa = useRef(null);
  const reintentat = useRef(false);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver !== 'function');
  const [intent, setIntent] = useState({ n: 0, renova: false });
  /* QA-C01 · `allibera` viatja amb la URL: s'allibera després del pintat que ja
     no la mostra (una altra URL o l'estat d'error). Totes les retencions que la
     peça ha rebut viuen a `retingudes` fins llavors: si es desmunta abans que
     arribe a pintar-se una resposta ja rebuda, també s'alliberen. */
  const [estat, setEstat] = useState({ url: null, error: null, allibera: null });
  const [retingudes] = useState(() => new Set());
  useEffect(() => {
    if (visible || !caixa.current) return undefined;
    const observador = new IntersectionObserver((entrades) => {
      if (entrades.some((e) => e.isIntersecting)) { setVisible(true); observador.disconnect(); }
    }, { root: caixa.current.closest('.sdp-xat-missatges'), rootMargin: '200px 0px' });
    observador.observe(caixa.current);
    return () => observador.disconnect();
  }, [visible]);
  useEffect(() => {
    if (!visible) return undefined;
    const controller = new AbortController();
    const retencio = creaRetencio();
    setEstat((previ) => (previ.error ? { ...previ, error: null } : previ));
    obteUrl({ signal: controller.signal, renova: intent.renova, reten: retencio.reten })
      .then((url) => {
        if (controller.signal.aborted) { retencio.deixa(); return; }
        const nova = retencio.pren();
        if (nova) retingudes.add(nova);
        setEstat({ url, error: null, allibera: nova });
      })
      .catch((e) => {
        retencio.deixa();
        if (!controller.signal.aborted && e?.name !== 'AbortError') setEstat({ url: null, error: e, allibera: null });
      });
    return () => controller.abort();
  }, [visible, obteUrl, intent, retingudes]);
  const { allibera } = estat;
  /* Després de cada pintat: fora les retencions que ja no corresponen a la font posada. */
  useEffect(() => {
    for (const fn of [...retingudes]) {
      if (fn === allibera) continue;
      retingudes.delete(fn);
      fn();
    }
  }, [allibera, retingudes]);
  useEffect(() => () => {
    const totes = [...retingudes];
    retingudes.clear();
    for (const fn of totes) fn();
  }, [retingudes]);
  const fallaCarrega = useCallback(() => {
    if (reintentat.current) { setEstat({ url: null, error: errorAdjuntXat('obrir'), allibera: null }); return; }
    reintentat.current = true;
    setIntent((i) => ({ n: i.n + 1, renova: true }));
  }, []);
  const reintenta = useCallback(() => {
    reintentat.current = false;
    setIntent((i) => ({ n: i.n + 1, renova: true }));
  }, []);
  const correcte = useCallback(() => { reintentat.current = false; }, []);
  return { caixa, url: estat.url, error: estat.error, fallaCarrega, reintenta, correcte };
}

function EstatAdjunt({ error, onReintenta, t }) {
  if (!error) return <p className="sdp-xat-adjunt__estat">{t('section.xat.adjunts.carregant', 'Carregant el fitxer…')}</p>;
  return (
    <p className="sdp-xat-adjunt__estat">
      {textDErrorAdjunt(error, t, t('section.xat.adjunts.error.obrir', 'No hem pogut obrir el fitxer.'))}
      {onReintenta ? <>{' '}<button type="button" className="sdp-xat-pindola sdp-xat-pindola--secundaria" onClick={onReintenta}>{t('section.xat.missatge.reintenta', 'Torna-ho a provar')}</button></> : null}
    </p>
  );
}

function ImatgeAdjunta({ obteUrl, t, interactiu }) {
  const font = useFontVisible(obteUrl);
  return (
    <div className="sdp-xat-adjunt" ref={font.caixa}>
      {font.url ? <img className="sdp-xat-adjunt__imatge" src={font.url} alt={t('section.xat.adjunts.foto', 'Foto adjunta')} onLoad={font.correcte} onError={font.fallaCarrega} /> : null}
      {!font.url ? <EstatAdjunt error={font.error} onReintenta={interactiu ? font.reintenta : null} t={t} /> : null}
    </div>
  );
}

function VideoAdjunt({ obteUrl, t, interactiu }) {
  const font = useFontVisible(obteUrl);
  const repren = useRef(null);
  const falla = (e) => {
    const element = e.currentTarget;
    repren.current = { temps: element.currentTime, sonava: !element.paused || repren.current?.sonava };
    font.fallaCarrega();
  };
  const continua = (e) => {
    const element = e.currentTarget;
    const punt = repren.current;
    repren.current = null;
    if (!punt) return;
    if (punt.temps) element.currentTime = punt.temps;
    if (punt.sonava) element.play()?.catch?.(() => {});
  };
  return (
    <div className="sdp-xat-adjunt" ref={font.caixa}>
      {font.url ? (
        <video
          className="sdp-xat-adjunt__video"
          src={font.url}
          controls={interactiu}
          tabIndex={interactiu ? undefined : -1}
          playsInline
          preload="metadata"
          aria-label={t('section.xat.adjunts.video', 'Vídeo adjunt')}
          onLoadedMetadata={continua}
          onPlaying={font.correcte}
          onError={falla}
        />
      ) : <EstatAdjunt error={font.error} onReintenta={interactiu ? font.reintenta : null} t={t} />}
    </div>
  );
}

/** La previsualització local (URL blob:) abans d'enviar. */
export function PrevisualitzacioAdjunt({ tipus, url, onError, duradaMs = null, locale, t: tProp }) {
  const t = traductorAdjunt(tProp);
  const obteUrl = useMemo(() => () => Promise.resolve(url), [url]);
  if (tipus === 'imatge') return <img className="sdp-xat-adjunt__imatge" src={url} alt={t('section.xat.adjunts.foto', 'Foto adjunta')} onError={onError} />;
  if (tipus === 'video') return <video className="sdp-xat-adjunt__video" src={url} controls playsInline preload="metadata" onError={onError} aria-label={t('section.xat.adjunts.video', 'Vídeo adjunt')} />;
  return <ReproductorVeu key={url} obteUrl={obteUrl} duradaMs={duradaMs} locale={locale} t={t} />;
}

/** La bombolla guarda l'id, mai una URL pública ni una URL signada persistent.
 *  `interactiu` fals (el mode de selecció) la pinta sense controls: la foto i
 *  el vídeo, muntats (el mateix node); la nota de veu, quieta (ADV-MEDIA-10). */
export default function AdjuntXat({ adjunt, tipus, externalConfig, usuariId, locale, t: tProp, interactiu = true }) {
  const t = traductorAdjunt(tProp);
  const obteUrl = useCallback(({ signal, renova = false, reten = null } = {}) => (
    urlAdjuntXat(adjunt.id, { ...externalConfig, signal }, typeof reten === 'function' && ambRetencio() ? { renova, reten } : { renova })
  ), [adjunt.id, externalConfig]);
  if (!teCapacitat('xatMultimedia')) {
    return <div className="sdp-xat-adjunt"><p className="sdp-xat-adjunt__estat">{t('section.xat.adjunts.noCapacitat', 'Este node encara no pot obrir els adjunts del xat.')}</p></div>;
  }
  // Un canvi de sessió munta una peça nova: res de la URL anterior no passa a l'altra persona.
  const clau = String(usuariId ?? '');
  if (tipus === 'imatge') return <ImatgeAdjunta key={clau} obteUrl={obteUrl} t={t} interactiu={interactiu} />;
  if (tipus === 'video') return <VideoAdjunt key={clau} obteUrl={obteUrl} t={t} interactiu={interactiu} />;
  return <div className="sdp-xat-adjunt"><ReproductorVeu key={clau} obteUrl={obteUrl} duradaMs={adjunt.duradaMs} memoria={`${clau}/${adjunt.id}`} locale={locale} t={t} interactiu={interactiu} /></div>;
}
