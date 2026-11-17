/**
 * LaVeuDeSocDePobleArticle.jsx · Onades R23 + R32.5 · Vista completa de la publicació
 * del Mur «La Veu de Sóc de Poble» (/mur/la-veu-de-soc-de-poble).
 *
 * Reunix:
 *   1. El botó de lectura oral (`BotoVeuIaia`) connectat en viu a les 7 veus
 *      obertes de Matxa-TTS v2 del Node 0 i píndola de veu activa.
 *   2. El joc interactiu d'isoglosses «D'on parles?» (`JocDonParlesCard`, lazy).
 *   3. El cos editorial sanejant i respectant edicions del Bloc de notes (`cosDeLArticle`).
 *   4. El banc d'escolta amb les 7 mostres obertes (`preload="none"`), controlador
 *      Pedra Seca de 4 estats accessibles WCAG AAA per teclat (`repos`, `carregant`,
 *      `reproduint`, `error`) i canvi immediat audible en polsar «Tria esta veu».
 *   5. El `RefranyerSonorCard` (lazy) amb 32 dites netes i gravadora de 15 s.
 */
import { lazy, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, LoaderCircle, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { renderRichText } from '../../detail/detailRichText.jsx';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { BotoVeuIaia } from '../../../components/PedraSeca/molecules/BotoVeuIaia.jsx';
import { desplacaASeccio } from '../../../components/universal/PageFrame.jsx';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import cssLaVeu from '../../../css/diferit-la-veu.css?inline';
import { useVeuLecturaPaginaActiva } from '../../../components/universal/veu/VeuLecturaPaginaContext.js';
import { tradueix, useTraductorOpcional } from '../../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { useUIActionsOpcional, useUIStateOpcional } from '../../../app/contexts/UIContext.jsx';
import { resolveAsset } from '../../../config/assetResolver.js';
import { createTranslator } from '../../../config/i18n.js';
import {
  VEUS_TERRITORIALS,
  VEU_AUTO_NAVEGADOR,
  desaVeuPreferida,
  llegeixVeuPreferida,
  subscriuVeuPreferida,
} from '../../../services/veusTerritorials.js';
import { cosDeLArticle, cosPerAPintar } from './cosCanonic.js';
import { nomDeLaVeu } from './nomDeLaVeu.js';
import { textPlaDelCos } from './NovesTecnologiesCulturaRuralArticle.jsx';
import {
  LA_VEU_DE_SOC_DE_POBLE_HTML,
  LA_VEU_DE_SOC_DE_POBLE_TRADUCCIONS,
} from './laVeuDeSocDePobleContent.js';

const T_PER_DEFECTE = createTranslator('ca');
const JocDonParlesCard = lazy(() => import('../../../components/patrimoni/JocDonParlesCard.jsx'));
const RefranyerSonorCard = lazy(() => import('../../../components/patrimoni/RefranyerSonorCard.jsx'));

const VEUS_AMB_MOSTRA = Object.freeze(VEUS_TERRITORIALS.filter((v) => Boolean(v.mostraAsset)));

function IconaCarregaMostra() {
  return <LoaderCircle className="sdp-boto__gir" size={20} aria-hidden="true" focusable="false" />;
}

const TEXTOS_MOSTRA_VEU = Object.freeze({
  ca: Object.freeze({
    escolta: 'Escolta la mostra',
    escoltaAria: 'Escolta la mostra de {veu}',
    carregant: 'Carregant mostra…',
    carregantProgres: 'S’està carregant la mostra de {veu}',
    cancelaCarrega: 'Atura la càrrega de {veu}',
    pausa: 'Pausa la mostra',
    pausaAria: 'Pausa la mostra de {veu}',
    posicioAria: 'Posició de la mostra de {veu} (fletxes esquerra i dreta per avançar o retrocedir 5 segons)',
    errorText: 'No s’ha pogut carregar l’àudio de {veu} ara mateix. Pots tornar-ho a provar o llegir la fitxa textual de la mostra.',
    reintenta: 'Torna a provar la mostra',
    transcripcioTitol: 'Fitxa i alternativa textual de la mostra',
    transcripcioCos: 'Mostra neuronal oberta de {veu} ({territori}) generada localment amb Matxa-TTS v2 al Node 0. En triar esta veu amb «Tria esta veu», el reproductor inferior llig en veu alta tots els apartats d’esta pàgina i els refranys.'
  }),
  es: Object.freeze({
    escolta: 'Escuchar muestra',
    escoltaAria: 'Escuchar la muestra de {veu}',
    carregant: 'Cargando muestra…',
    carregantProgres: 'Cargando la muestra de {veu}',
    cancelaCarrega: 'Detener la carga de {veu}',
    pausa: 'Pausar muestra',
    pausaAria: 'Pausar la muestra de {veu}',
    posicioAria: 'Posición de la muestra de {veu} (flechas izquierda y derecha para retroceder o avanzar 5 segundos)',
    errorText: 'No se ha podido cargar el audio de {veu} ahora mismo. Puedes volver a intentarlo o leer la alternativa textual de la muestra.',
    reintenta: 'Reintentar muestra',
    transcripcioTitol: 'Ficha y alternativa textual de la muestra',
    transcripcioCos: 'Muestra neuronal abierta de {veu} ({territori}) generada localmente con Matxa-TTS v2 en el Nodo 0. Al elegir esta voz, el reproductor inferior lee en voz alta todos los apartados de esta página y los refranes.'
  }),
  en: Object.freeze({
    escolta: 'Play sample',
    escoltaAria: 'Play sample for {veu}',
    carregant: 'Loading sample…',
    carregantProgres: 'Loading voice sample for {veu}',
    cancelaCarrega: 'Cancel loading for {veu}',
    pausa: 'Pause sample',
    pausaAria: 'Pause sample for {veu}',
    posicioAria: 'Playback position for {veu} (Left and Right arrows jump 5 seconds)',
    errorText: 'Could not load the audio sample for {veu} right now. Retry playback or read the text alternative below.',
    reintenta: 'Retry sample',
    transcripcioTitol: 'Sample note and text alternative',
    transcripcioCos: 'Open neural speech sample for {veu} ({territori}) synthesised locally with Matxa-TTS v2 on Node 0. Choosing this voice switches the bottom page reader and proverb archive to this voice.'
  }),
  eu: Object.freeze({
    escolta: 'Entzun lagina',
    escoltaAria: 'Entzun {veu} ahotsaren lagina',
    carregant: 'Lagina kargatzen…',
    carregantProgres: '{veu} ahotsaren lagina kargatzen',
    cancelaCarrega: 'Gelditu {veu} laginaren karga',
    pausa: 'Pausatu lagina',
    pausaAria: 'Pausatu {veu} ahotsaren lagina',
    posicioAria: '{veu} laginaren posizioa (ezker-eskuin geziekin 5 segundo aurreratu edo atzeratu)',
    errorText: 'Ezin izan da {veu} ahotsaren audioa kargatu une honetan. Saiatu berriro edo irakurri laginaren testu-alternatiba.',
    reintenta: 'Saiatu berriro',
    transcripcioTitol: 'Laginaren fitxa eta testu-alternatiba',
    transcripcioCos: '{veu} ({territori}) ahots neuronal irekiaren lagina, 0 Nodoan Matxa-TTS v2 bidez sortua. Ahots hau aukeratzean, beheko irakurgailuak orriko atal guztiak eta atsotitzak ahots honekin irakurriko ditu.'
  }),
  gl: Object.freeze({
    escolta: 'Escoitar mostra',
    escoltaAria: 'Escoitar a mostra de {veu}',
    carregant: 'Cargando mostra…',
    carregantProgres: 'Cargando a mostra de {veu}',
    cancelaCarrega: 'Deter a carga de {veu}',
    pausa: 'Pausar mostra',
    pausaAria: 'Pausar a mostra de {veu}',
    posicioAria: 'Posición da mostra de {veu} (frechas esquerda e dereita para recuar ou avanzar 5 segundos)',
    errorText: 'Non se puido cargar o audio de {veu} agora mesmo. Podes tentalo de novo ou ler a alternativa textual da mostra.',
    reintenta: 'Tentar de novo',
    transcripcioTitol: 'Ficha e alternativa textual da mostra',
    transcripcioCos: 'Mostra neuronal aberta de {veu} ({territori}) xerada localmente con Matxa-TTS v2 no Nodo 0. Ao escoller esta voz, o reprodutor inferior le en voz alta todos os apartados desta páxina e os refráns.'
  }),
});

function formataSegons(valor) {
  const net = Number.isFinite(valor) && valor > 0 ? Math.floor(valor) : 0;
  const minuts = Math.floor(net / 60);
  const segons = String(net % 60).padStart(2, '0');
  return `${minuts}:${segons}`;
}

function useIdiomaActiu() {
  try {
    const lang = useUIStateOpcional()?.language;
    return ['ca', 'es', 'en', 'eu', 'gl'].includes(lang) ? lang : 'ca';
  } catch {
    return 'ca';
  }
}

function textPlaEditorial(html) {
  if (typeof html !== 'string' || !html.trim()) return '';
  if (typeof DOMParser === 'function') {
    const analitzat = new DOMParser().parseFromString(html, 'text/html');
    for (const grup of analitzat.querySelectorAll('[data-sdp-targetes]')) {
      grup.remove();
    }
    return (analitzat.body.textContent || '').replace(/\s+/g, ' ').trim();
  }
  return textPlaDelCos(html);
}

/**
 * Controlador Pedra Seca dels 4 estats accessibles WCAG AAA per teclat
 * (`repos` | `carregant` | `reproduint` | `error`) sobre l'`<audio preload="none">`.
 */
function MostraVeuControlada({ veu, nomVeu, idioma, triada, onTriaVeu, onPausaAltres, textTria }) {
  const tx = TEXTOS_MOSTRA_VEU[idioma] || TEXTOS_MOSTRA_VEU.ca;
  const audioRef = useRef(null);
  const controlsFilaRef = useRef(null);
  const [estat, setEstat] = useState('repos');
  const [tempsActual, setTempsActual] = useState(0);
  const [durada, setDurada] = useState(0);
  const [transcripcioOberta, setTranscripcioOberta] = useState(false);

  const aturaMostra = useCallback((retornaFocus = false) => {
    const el = audioRef.current;
    if (el) {
      try { el.pause(); } catch { /* ignorat */ }
    }
    setEstat('repos');
    if (retornaFocus) controlsFilaRef.current?.querySelector('button')?.focus();
  }, []);

  const iniciaMostra = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    onPausaAltres?.(el);
    const jaLlest = Number(el.readyState ?? 0) >= 3;
    setEstat(jaLlest ? 'reproduint' : 'carregant');
    try {
      const resultat = el.play?.();
      if (resultat && typeof resultat.then === 'function') {
        await resultat;
      }
      if (!el.paused) setEstat('reproduint');
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setEstat('error');
      setTranscripcioOberta(true);
    }
  }, [onPausaAltres]);

  const reintentaMostra = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      try { el.load?.(); } catch { /* ignorat */ }
    }
    setTempsActual(0);
    iniciaMostra();
  }, [iniciaMostra]);

  const canviaPosicio = (seguentValor) => {
    const el = audioRef.current;
    const maxim = durada > 0 ? durada : Number(el?.duration || 0);
    const limitat = maxim > 0 ? Math.min(Math.max(0, seguentValor), maxim) : Math.max(0, seguentValor);
    if (el) {
      try { el.currentTime = limitat; } catch { /* ignorat */ }
    }
    setTempsActual(limitat);
  };

  const gestionaTeclatControlador = (ev) => {
    if (ev.key === 'Escape' && (estat === 'reproduint' || estat === 'carregant')) {
      ev.preventDefault();
      aturaMostra(true);
    }
  };

  const gestionaTeclatPosicio = (ev) => {
    if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      canviaPosicio(tempsActual + 5);
    } else if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      canviaPosicio(tempsActual - 5);
    } else if (ev.key === 'Home') {
      ev.preventDefault();
      canviaPosicio(0);
    } else if (ev.key === 'End' && durada > 0) {
      ev.preventDefault();
      canviaPosicio(durada);
    }
  };

  const duradaEfectiva = durada > 0 ? durada : 10;

  return (
    <li
      className="sdp-banc-veus__item"
      data-veu-id={veu.id}
      data-estat-audio={estat}
      onKeyDown={gestionaTeclatControlador}
    >
      <div className="sdp-banc-veus__item-cap">
        <div>
          <strong className="sdp-banc-veus__nom">{nomVeu}</strong>
          <span className="sdp-banc-veus__territori">{veu.territori}</span>
        </div>
        <Boto
          varietat={triada ? 'primari' : 'secundari'}
          icona={triada ? Check : null}
          aria-pressed={triada}
          onClick={(ev) => onTriaVeu(veu, ev.currentTarget)}
        >
          {textTria}
        </Boto>
      </div>

      <audio
        ref={audioRef}
        preload="none"
        className="sdp-banc-veus__audio sdp-banc-veus__audio--sincronitzat"
        src={resolveAsset(veu.mostraAsset)}
        aria-label={nomVeu}
        onLoadStart={() => {
          const el = audioRef.current;
          if (el && !el.paused) setEstat('carregant');
        }}
        onWaiting={() => setEstat('carregant')}
        onCanPlay={() => {
          const el = audioRef.current;
          if (el && !el.paused) setEstat('reproduint');
        }}
        onPlaying={() => setEstat('reproduint')}
        onPause={() => {
          setEstat((actual) => (actual === 'error' ? 'error' : 'repos'));
        }}
        onEnded={() => {
          setTempsActual(0);
          setEstat('repos');
        }}
        onLoadedMetadata={(ev) => {
          const d = Number(ev.currentTarget.duration);
          if (Number.isFinite(d) && d > 0) setDurada(d);
        }}
        onTimeUpdate={(ev) => {
          const tActual = Number(ev.currentTarget.currentTime);
          if (Number.isFinite(tActual) && tActual >= 0) setTempsActual(tActual);
        }}
        onError={() => {
          setEstat('error');
          setTranscripcioOberta(true);
        }}
      />

      <div className="sdp-banc-veus__controlador">
        <div ref={controlsFilaRef} className="sdp-banc-veus__controls-fila">
          {estat === 'reproduint' ? (
            <Boto
              varietat="primari"
              icona={Pause}
              aria-pressed="true"
              aria-label={tx.pausaAria.replace('{veu}', () => nomVeu)}
              onClick={() => aturaMostra(false)}
            >
              {tx.pausa}
            </Boto>
          ) : estat === 'carregant' ? (
            <Boto
              varietat="secundari"
              icona={IconaCarregaMostra}
              aria-busy="true"
              aria-label={tx.cancelaCarrega.replace('{veu}', () => nomVeu)}
              onClick={() => aturaMostra(false)}
            >
              {tx.carregant}
            </Boto>
          ) : (
            <Boto
              varietat="secundari"
              icona={Play}
              aria-pressed="false"
              aria-label={tx.escoltaAria.replace('{veu}', () => nomVeu)}
              onClick={iniciaMostra}
            >
              {tx.escolta}
            </Boto>
          )}

          {estat === 'carregant' ? (
            <progress
              className="sdp-banc-veus__progres"
              aria-label={tx.carregantProgres.replace('{veu}', () => nomVeu)}
            />
          ) : null}

          {estat === 'reproduint' ? (
            <div className="sdp-banc-veus__seguiment">
              <input
                type="range"
                className="sdp-banc-veus__posicio"
                min={0}
                max={duradaEfectiva}
                step={0.5}
                value={Math.min(tempsActual, duradaEfectiva)}
                aria-label={tx.posicioAria.replace('{veu}', () => nomVeu)}
                onChange={(ev) => canviaPosicio(Number(ev.target.value))}
                onKeyDown={gestionaTeclatPosicio}
              />
              <span className="sdp-banc-veus__temps" aria-hidden="true">
                {`${formataSegons(tempsActual)} / ${formataSegons(durada)}`}
              </span>
            </div>
          ) : null}
        </div>

        {estat === 'error' ? (
          <Alerta
            to="error"
            accions={(
              <Boto varietat="secundari" icona={RotateCcw} onClick={reintentaMostra}>
                {tx.reintenta}
              </Boto>
            )}
          >
            {tx.errorText.replace('{veu}', () => nomVeu)}
          </Alerta>
        ) : null}

        <details
          className="sdp-banc-veus__transcripcio"
          open={transcripcioOberta || estat === 'error'}
          onToggle={(ev) => setTranscripcioOberta(ev.currentTarget.open)}
        >
          <summary className="sdp-banc-veus__transcripcio-resum">
            {tx.transcripcioTitol}
          </summary>
          <p className="sdp-banc-veus__transcripcio-cos">
            {tx.transcripcioCos
              .replace('{veu}', () => nomVeu)
              .replace('{territori}', () => veu.territori)}
          </p>
        </details>
      </div>
    </li>
  );
}

export function LaVeuDeSocDePobleArticle({ item = {} }) {
  const t = useUIActionsOpcional()?.t || T_PER_DEFECTE;
  const tOpc = useTraductorOpcional();
  const veuPaginaActiva = useVeuLecturaPaginaActiva();
  const idioma = useIdiomaActiu();
  const idMostres = useId();
  const bancVeusRef = useRef(null);
  /* Onada R32.5 · El CSS dels 4 estats de les mostres és un full diferit (src/css/diferit-la-veu.css). */
  useFullDiferit(bancVeusRef, 'la-veu', cssLaVeu);
  const [veuPreferida, setVeuPreferida] = useState(() => llegeixVeuPreferida());

  useEffect(() => subscriuVeuPreferida(setVeuPreferida), []);

  const blocIdioma = LA_VEU_DE_SOC_DE_POBLE_TRADUCCIONS[idioma] || LA_VEU_DE_SOC_DE_POBLE_TRADUCCIONS.ca;
  const htmlCanonic = idioma === 'ca' ? LA_VEU_DE_SOC_DE_POBLE_HTML : blocIdioma.html;
  const cos = cosPerAPintar(cosDeLArticle(idioma === 'ca' ? item : null, htmlCanonic));

  const titolVeu = idioma === 'ca' ? (item?.title || blocIdioma.title) : blocIdioma.title;
  const entradillaVeu = idioma === 'ca' ? (item?.entradilla || item?.post_subtitle || blocIdioma.entradilla) : blocIdioma.entradilla;

  const textDeLaVeu = useMemo(
    () => [titolVeu, entradillaVeu, textPlaEditorial(cos)].filter(Boolean).join('\n'),
    [titolVeu, entradillaVeu, cos]
  );

  const veuActivaObj = useMemo(
    () => VEUS_TERRITORIALS.find((v) => v.id === veuPreferida) || VEUS_TERRITORIALS[0],
    [veuPreferida]
  );
  const nomVeuActiva = tradueix(tOpc, [veuActivaObj.clauNom, veuActivaObj.reservaNom]);

  const pausaAltresMostres = useCallback((excepteAudio = null) => {
    const llista = bancVeusRef.current;
    if (!llista) return;
    for (const elAudio of llista.querySelectorAll('audio')) {
      if (elAudio !== excepteAudio) {
        try { elAudio.pause(); } catch { /* ignorat */ }
      }
    }
  }, []);

  const triaVeuAmbRespostaAudible = async (veu, botoTria = null) => {
    /* Pausa qualsevol mostra estàtica del banc per evitar solapaments */
    pausaAltresMostres(null);

    const desada = desaVeuPreferida(veu.id);
    setVeuPreferida(desada);

    /* IDEA-268 · Dins de PageFrame (mòbil i escriptori), triar una veu al banc
       obri sempre el Reproductor Universal de So a la part inferior perquè la
       persona puga pausar, avançar per apartats o tancar sense so «invisible».
       Sense seguir la lectura amb el scroll: la persona es queda al banc de
       veus, i en tancar la barra el focus torna a este mateix botó. */
    if (veuPaginaActiva && typeof veuPaginaActiva === 'object' && typeof veuPaginaActiva.obriReproductor === 'function') {
      veuPaginaActiva.obriReproductor({ invocador: botoTria, seguixLectura: false });
      return;
    }

    try {
      const modul = await import('../../../services/veuIaiaService.js');
      if (modul.estaParlant()) {
        modul.parla(textDeLaVeu, { idioma, privat: false, veu: desada }).catch(() => {});
        return;
      }
      if (desada !== VEU_AUTO_NAVEGADOR) {
        const etiqueta = tradueix(tOpc, [veu.clauNom, veu.reservaNom]).replace('·', ',');
        const salutacio = `Veu activada: ${etiqueta}. Ja pots escoltar la pàgina i els refranys amb esta veu.`;
        modul.parla(salutacio, { idioma: 'ca', privat: false, veu: desada }).catch(() => {});
      }
    } catch {
      /* En proves sense síntesi o sense xarxa, la preferència ja ha quedat guardada. */
    }
  };

  const vesAlBancDeVeus = () => {
    if (bancVeusRef.current) {
      desplacaASeccio(bancVeusRef.current, { behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="sdp-article-veu">
      <div className="sdp-article-veu__escolta-cap" data-sdp-no-locutar="">
        {!veuPaginaActiva ? (
          <BotoVeuIaia
            text={textDeLaVeu}
            idioma={idioma}
            privat={false}
            aria-label={nomDeLaVeu(t, titolVeu)}
          />
        ) : null}
        <Boto varietat="secundari" icona={Volume2} onClick={vesAlBancDeVeus}>
          {tradueix(tOpc, ['patrimoni.bancVeus.veuActivaPindola', 'Veu activa: {veu}'])
            .replace('{veu}', nomVeuActiva)}
        </Boto>
      </div>

      <Suspense fallback={<p className="sdp-muted" role="status">{tradueix(tOpc, ['patrimoni.jocParla.carregant', 'S’està carregant el joc de comarques…'])}</p>}>
        <JocDonParlesCard />
      </Suspense>

      <div className="sdp-article-veu__cos">
        {renderRichText(cos)}
      </div>

      <section ref={bancVeusRef} className="sdp-subtargeta sdp-banc-veus" data-sdp-no-locutar="" aria-labelledby={idMostres}>
        <h3 id={idMostres} className="sdp-banc-veus__titol">
          {tradueix(tOpc, ['patrimoni.bancVeus.titol', 'Banc d’escolta: les 7 veus obertes multiaccent (Matxa-TTS v2)'])}
        </h3>
        <p className="sdp-banc-veus__descripcio">
          {tradueix(tOpc, [
            'patrimoni.bancVeus.descripcio',
            'Escolta les quatre veus valencianes d’estudi (Gina i Berta femenines; Arnau i Lluc masculines) al costat de la nord-occidental (Emma), la central (Èlia) i la balear (Olga). Quan prems «Tria esta veu», tota la lectura en veu alta de la pàgina i dels refranys passa a sonar immediatament amb eixa veu neuronal des del nostre Node 0.',
          ])}
        </p>
        <ul className="sdp-banc-veus__llista">
          {VEUS_AMB_MOSTRA.map((veu) => {
            const triada = veuPreferida === veu.id;
            const nomVeu = tradueix(tOpc, [veu.clauNom, veu.reservaNom]);
            const textTria = triada
              ? tradueix(tOpc, ['patrimoni.bancVeus.preferidaActiva', 'Veu preferida'])
              : tradueix(tOpc, ['patrimoni.bancVeus.triaVeu', 'Tria esta veu']);
            return (
              <MostraVeuControlada
                key={veu.id}
                veu={veu}
                nomVeu={nomVeu}
                idioma={idioma}
                triada={triada}
                textTria={textTria}
                onTriaVeu={triaVeuAmbRespostaAudible}
                onPausaAltres={pausaAltresMostres}
              />
            );
          })}
        </ul>
      </section>

      <Suspense fallback={<p className="sdp-muted" role="status">{tradueix(tOpc, ['patrimoni.refranyer.carregant', 'S’està carregant el Refranyer Sonor…'])}</p>}>
        <RefranyerSonorCard />
      </Suspense>
    </div>
  );
}

export default LaVeuDeSocDePobleArticle;
