/**
 * RefranyerSonorCard.jsx · Onada R23 («La Veu de Sóc de Poble») · Catàleg viu
 * de 32 refranys populars classificats per comarca i àmbit amb escolta en veu
 * alta (`veuIaiaService.parla`) i gravació oral amb `MediaRecorder` natiu
 * (límit 15 s / 2 MB, preescolta immediata, consentiment ètic CC BY-SA 4.0 i
 * honestedat radical `Llei 0`).
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download, Mic, Search, Square, Volume2 } from 'lucide-react';
import { Boto } from '../PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../PedraSeca/molecules/Alerta.jsx';
import { tradueix, useTraductorOpcional } from '../PedraSeca/hooks/useTraductorOpcional.js';
import { useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { getBackendImplementation } from '../../data/backendPort.js';
import {
  CATEGORIES_REFRANYER,
  MAX_BYTES_GRAVACIO,
  MAX_DURADA_GRAVACIO_S,
  REFRANYS_DE_POBLE_SEED,
  desaAportacioRefranyLocal,
  filtraRefranys,
  triaMimeGravacio,
} from './refranysDePobleSeed.js';

function useIdiomaActiu() {
  try {
    const lang = useUIStateOpcional()?.language;
    return ['ca', 'es', 'en', 'eu', 'gl'].includes(lang) ? lang : 'ca';
  } catch {
    return 'ca';
  }
}

function suportaGravadora() {
  return typeof window !== 'undefined'
    && typeof window.MediaRecorder === 'function'
    && Boolean(navigator?.mediaDevices?.getUserMedia);
}

function extensioDeMime(mime) {
  const base = String(mime || '').toLowerCase();
  if (base.includes('mp4')) return 'm4a';
  if (base.includes('ogg')) return 'ogg';
  if (base.includes('wav')) return 'wav';
  return 'webm';
}

export function RefranyerSonorCard() {
  const t = useTraductorOpcional();
  const idioma = useIdiomaActiu();
  const idBase = useId();

  const [categoriaActiva, setCategoriaActiva] = useState('totes');
  const [cerca, setCerca] = useState('');
  const [parlantId, setParlantId] = useState(null);
  const [avisVeu, setAvisVeu] = useState(null);

  const [gravantObrirId, setGravantObrirId] = useState(null);
  const [estatGravacio, setEstatGravacio] = useState('repos'); // 'repos' | 'gravant' | 'llesta' | 'error'
  const [segonsGravant, setSegonsGravant] = useState(0);
  const [audioGravacio, setAudioGravacio] = useState(null); // { blob, url, durada, mida, mime }
  const [variantEscrita, setVariantEscrita] = useState('');
  const [pobleComarca, setPobleComarca] = useState('');
  const [consentiment, setConsentiment] = useState(false);
  const [missatgeGravacio, setMissatgeGravacio] = useState(null);

  const serveiVeuRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const iniciMsRef = useRef(0);
  const urlPreviewRef = useRef(null);

  const netejaRecursosAudio = useCallback((conservaPreview = false) => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch { /* ja tancat */ }
    }
    recorderRef.current = null;
    if (streamRef.current) {
      for (const pista of streamRef.current.getTracks?.() || []) {
        try { pista.stop(); } catch { /* pista tancada */ }
      }
      streamRef.current = null;
    }
    if (!conservaPreview && urlPreviewRef.current) {
      try { URL.revokeObjectURL(urlPreviewRef.current); } catch { /* ignorat */ }
      urlPreviewRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    netejaRecursosAudio(false);
    serveiVeuRef.current?.atura?.();
  }, [netejaRecursosAudio]);

  const refranysFiltrats = useMemo(
    () => filtraRefranys(REFRANYS_DE_POBLE_SEED, { categoria: categoriaActiva, cerca, idioma }),
    [categoriaActiva, cerca, idioma]
  );

  const escoltaRefrany = async (refrany) => {
    setAvisVeu(null);
    let modul = serveiVeuRef.current;
    if (!modul) {
      try {
        modul = await import('../../services/veuIaiaService.js');
        serveiVeuRef.current = modul;
      } catch {
        setAvisVeu(tradueix(t, ['patrimoni.refranyer.errorVeu', 'No s’ha pogut iniciar la síntesi de veu.']));
        return;
      }
    }
    if (parlantId === refrany.id) {
      modul.atura();
      setParlantId(null);
      return;
    }
    modul.atura();
    setParlantId(refrany.id);
    try {
      const veuExplicita = modul.veuPreferidaExplicita?.() || null;
      await modul.parla(refrany.text, {
        idioma: 'ca',
        privat: false,
        veu: veuExplicita || refrany.veuSuggerida,
      });
    } catch (err) {
      if (err?.codi !== 'VEU_AVORTADA') {
        setAvisVeu(tradueix(t, ['patrimoni.refranyer.senseVeuNavegador', 'Este navegador no pot llegir el refrany en veu alta ara mateix.']));
      }
    } finally {
      setParlantId((actual) => (actual === refrany.id ? null : actual));
    }
  };

  const obriPanellGravacio = (refrany) => {
    if (gravantObrirId === refrany.id) {
      netejaRecursosAudio(false);
      setAudioGravacio(null);
      setEstatGravacio('repos');
      setGravantObrirId(null);
      setMissatgeGravacio(null);
      return;
    }
    netejaRecursosAudio(false);
    setAudioGravacio(null);
    setEstatGravacio('repos');
    setSegonsGravant(0);
    setVariantEscrita(refrany.text);
    setConsentiment(false);
    setMissatgeGravacio(null);
    setGravantObrirId(refrany.id);
  };

  const iniciaGravacio = async () => {
    if (!suportaGravadora()) {
      setEstatGravacio('error');
      setMissatgeGravacio({
        tipus: 'error',
        text: tradueix(t, ['patrimoni.refranyer.senseGravadora', 'Este navegador no permet gravar àudio directament des de la pàgina.']),
      });
      return;
    }
    netejaRecursosAudio(false);
    setAudioGravacio(null);
    setMissatgeGravacio(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = triaMimeGravacio();
      const opcions = mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : { audioBitsPerSecond: 64000 };
      const recorder = new window.MediaRecorder(stream, opcions);
      recorderRef.current = recorder;

      const trossos = [];
      let bytesAcumulats = 0;
      iniciMsRef.current = Date.now();
      setSegonsGravant(0);
      setEstatGravacio('gravant');

      recorder.ondataavailable = (ev) => {
        if (ev?.data && ev.data.size > 0) {
          trossos.push(ev.data);
          bytesAcumulats += ev.data.size;
          if (bytesAcumulats >= MAX_BYTES_GRAVACIO && recorder.state === 'recording') {
            recorder.stop();
          }
        }
      };

      recorder.onstop = () => {
        const durada = Math.min(MAX_DURADA_GRAVACIO_S, Math.max(0.5, (Date.now() - iniciMsRef.current) / 1000));
        netejaRecursosAudio(true);
        const tipusFinal = recorder.mimeType || mime || 'audio/webm';
        const blob = new Blob(trossos, { type: tipusFinal });
        if (!blob.size || blob.size > MAX_BYTES_GRAVACIO) {
          setEstatGravacio('error');
          setMissatgeGravacio({
            tipus: 'error',
            text: blob.size > MAX_BYTES_GRAVACIO
              ? tradueix(t, ['patrimoni.refranyer.errorMida', 'La gravació supera els 2 MB màxims. Grava una locució més curta.'])
              : tradueix(t, ['patrimoni.refranyer.errorBuida', 'No s’ha capturat so del micròfon. Torna-ho a provar.']),
          });
          return;
        }
        const url = URL.createObjectURL(blob);
        urlPreviewRef.current = url;
        setAudioGravacio({
          blob,
          url,
          durada: Number(durada.toFixed(1)),
          mida: blob.size,
          mime: tipusFinal,
        });
        setEstatGravacio('llesta');
      };

      recorder.onerror = () => {
        netejaRecursosAudio(false);
        setEstatGravacio('error');
        setMissatgeGravacio({
          tipus: 'error',
          text: tradueix(t, ['patrimoni.refranyer.errorGravacio', 'S’ha interromput la gravació del micròfon.']),
        });
      };

      recorder.start(250);
      timerRef.current = setInterval(() => {
        const transcorregut = Math.floor((Date.now() - iniciMsRef.current) / 1000);
        setSegonsGravant(Math.min(MAX_DURADA_GRAVACIO_S, transcorregut));
        if (transcorregut >= MAX_DURADA_GRAVACIO_S && recorder.state === 'recording') {
          recorder.stop();
        }
      }, 250);
    } catch {
      netejaRecursosAudio(false);
      setEstatGravacio('error');
      setMissatgeGravacio({
        tipus: 'error',
        text: tradueix(t, ['patrimoni.refranyer.permisDenegat', 'Cal autoritzar l’accés al micròfon per a gravar com sona al teu poble.']),
      });
    }
  };

  const aturaGravacio = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  };

  const desaGravacio = async (event, refrany) => {
    event.preventDefault();
    if (!audioGravacio) {
      setMissatgeGravacio({
        tipus: 'error',
        text: tradueix(t, ['patrimoni.refranyer.calGravarPrimer', 'Grava primer la teua veu (fins a 15 segons) abans de desar.']),
      });
      return;
    }
    const local = desaAportacioRefranyLocal({
      refranyId: refrany.id,
      textRefrany: variantEscrita || refrany.text,
      pobleComarca,
      duradaSegons: audioGravacio.durada,
      midaBytes: audioGravacio.mida,
      mimeType: audioGravacio.mime,
      consentiment,
    });
    if (!local.ok && local.motiu !== 'emmagatzematge') {
      setMissatgeGravacio({
        tipus: 'error',
        text: local.motiu === 'consentiment'
          ? tradueix(t, ['patrimoni.refranyer.calConsentiment', 'Marca la casella de consentiment lliure per a l’arxiu oral abans de desar.'])
          : tradueix(t, ['patrimoni.refranyer.calPoble', 'Indica el nom del teu poble i comarca (mínim 2 lletres).']),
      });
      return;
    }

    const backend = getBackendImplementation();
    if (typeof backend?.desaAportacioVeuPoble === 'function' && local.registre) {
      try {
        await backend.desaAportacioVeuPoble({
          ...local.registre,
          blob: audioGravacio.blob,
        });
        setMissatgeGravacio({
          tipus: 'info',
          text: tradueix(t, [
            'patrimoni.refranyer.enviatServidor',
            'Aportació oral rebuda per a revisió a l’arxiu sonor de Sóc de Poble. Gràcies per fer créixer la nostra veu!',
          ]),
        });
        return;
      } catch {
        /* Cau amb transparència al registre local i descàrrega directa. */
      }
    }

    if (!local.ok && local.motiu === 'emmagatzematge') {
      setMissatgeGravacio({
        tipus: 'error',
        text: tradueix(t, [
          'patrimoni.refranyer.errorEmmagatzematge',
          'No s’ha pogut guardar el registre perquè la memòria local del navegador està plena o blocada. Pots descarregar directament l’àudio ara mateix perquè no es perda.',
        ]),
      });
      return;
    }

    setMissatgeGravacio({
      tipus: 'info',
      text: tradueix(t, [
        'patrimoni.refranyer.desatLocalHonest',
        'Aportació anotada en este dispositiu. El magatzem remot de mostres orals del Node 0 està en preparació: pots descarregar ara la teua gravació per conservar-la o compartir-la.',
      ]),
    });
  };

  return (
    <section
      className="sdp-subtargeta sdp-refranyer"
      aria-labelledby={`${idBase}-titol`}
      data-sdp-no-locutar=""
    >
      <header className="sdp-refranyer__capcalera">
        <p className="sdp-refranyer__insignia">
          {tradueix(t, ['patrimoni.refranyer.insignia', 'Arxiu oral viu · {n} refranys curats'])
            .replace('{n}', String(REFRANYS_DE_POBLE_SEED.length))}
        </p>
        <h3 id={`${idBase}-titol`} className="sdp-refranyer__titol">
          {tradueix(t, ['patrimoni.refranyer.titol', 'Refranyer Sonor de Poble per Comarques'])}
        </h3>
        <p className="sdp-refranyer__entradeta">
          {tradueix(t, [
            'patrimoni.refranyer.entradeta',
            'Escolta les dites amb la veu seleccionada o grava amb la teua pròpia veu com es diuen al teu poble: lèxic i melodia junts són la clau perquè la IA entenga de veres cada comarca.',
          ])}
        </p>
      </header>

      <div className="sdp-refranyer__controls">
        <div className="sdp-refranyer__cerca-caixa">
          <label htmlFor={`${idBase}-cerca`} className="sdp-refranyer__cerca-label">
            <Search size={18} aria-hidden="true" focusable="false" />
            <span>{tradueix(t, ['patrimoni.refranyer.cercaLabel', 'Cerca per paraula, comarca o tema'])}</span>
          </label>
          <input
            id={`${idBase}-cerca`}
            type="search"
            className="sdp-refranyer__cerca-input"
            value={cerca}
            onChange={(e) => setCerca(e.target.value)}
            placeholder={tradueix(t, ['patrimoni.refranyer.cercaPlaceholder', 'Ex.: olivera, Aitana, El Comtat, pa amb oli…'])}
          />
        </div>

        <div
          className="sdp-refranyer__categories"
          role="group"
          aria-label={tradueix(t, ['patrimoni.refranyer.filtreAria', 'Filtra refranys per àmbit'])}
        >
          {CATEGORIES_REFRANYER.map((cat) => {
            const activa = categoriaActiva === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={activa}
                className={activa ? 'sdp-refranyer__pindola sdp-refranyer__pindola--activa' : 'sdp-refranyer__pindola'}
                onClick={() => setCategoriaActiva(cat.id)}
              >
                {tradueix(t, [cat.clau, cat.reserva])}
              </button>
            );
          })}
        </div>
      </div>

      {avisVeu ? <Alerta to="avis">{avisVeu}</Alerta> : null}

      {refranysFiltrats.length === 0 ? (
        <p className="sdp-refranyer__buit" role="status">
          {tradueix(t, ['patrimoni.refranyer.senseResultats', 'Cap refrany coincideix amb esta cerca. Prova una altra paraula o comarca.'])}
        </p>
      ) : (
        <ul className="sdp-refranyer__llista">
          {refranysFiltrats.map((refrany) => {
            const parlant = parlantId === refrany.id;
            const obert = gravantObrirId === refrany.id;
            const catObj = CATEGORIES_REFRANYER.find((c) => c.id === refrany.categoria);
            return (
              <li key={refrany.id} className="sdp-refranyer__item">
                <div className="sdp-refranyer__meta">
                  <span className="sdp-refranyer__comarca">{refrany.comarca}</span>
                  {catObj ? (
                    <span className="sdp-refranyer__ambit">
                      {tradueix(t, [catObj.clau, catObj.reserva])}
                    </span>
                  ) : null}
                </div>

                <blockquote className="sdp-refranyer__dita" lang="ca">
                  {`«${refrany.text}»`}
                </blockquote>

                <p className="sdp-refranyer__explicacio">
                  {refrany.explicacio[idioma] || refrany.explicacio.ca}
                </p>

                <div className="sdp-refranyer__accions">
                  <Boto
                    varietat={parlant ? 'primari' : 'secundari'}
                    aria-pressed={parlant}
                    onClick={() => escoltaRefrany(refrany)}
                  >
                    {parlant
                      ? <Square size={18} aria-hidden="true" focusable="false" />
                      : <Volume2 size={18} aria-hidden="true" focusable="false" />}
                    <span>
                      {parlant
                        ? tradueix(t, ['patrimoni.refranyer.aturaVeu', 'Atura la veu'])
                        : tradueix(t, ['patrimoni.refranyer.escoltaVeu', 'Escoltar en veu alta'])}
                    </span>
                  </Boto>

                  <Boto
                    varietat={obert ? 'primari' : 'secundari'}
                    aria-expanded={obert}
                    aria-controls={`${idBase}-grav-${refrany.id}`}
                    onClick={() => obriPanellGravacio(refrany)}
                  >
                    <Mic size={18} aria-hidden="true" focusable="false" />
                    <span>
                      {tradueix(t, ['patrimoni.refranyer.gravaAlTeuPoble', 'Grava com es diu al teu poble'])}
                    </span>
                  </Boto>
                </div>

                {obert ? (
                  <form
                    id={`${idBase}-grav-${refrany.id}`}
                    className="sdp-refranyer__gravadora"
                    onSubmit={(ev) => desaGravacio(ev, refrany)}
                  >
                    <div className="sdp-refranyer__gravadora-barra">
                      {estatGravacio !== 'gravant' ? (
                        <Boto type="button" varietat="primari" onClick={iniciaGravacio}>
                          <Mic size={18} aria-hidden="true" focusable="false" />
                          <span>
                            {audioGravacio
                              ? tradueix(t, ['patrimoni.refranyer.repetirGravacio', 'Tornar a gravar (màx. 15 s)'])
                              : tradueix(t, ['patrimoni.refranyer.iniciarGravacio', 'Comença a gravar (màx. 15 s)'])}
                          </span>
                        </Boto>
                      ) : (
                        <Boto type="button" varietat="primari" onClick={aturaGravacio}>
                          <Square size={18} aria-hidden="true" focusable="false" />
                          <span>{tradueix(t, ['patrimoni.refranyer.aturarGravacio', 'Atura la gravació'])}</span>
                        </Boto>
                      )}

                      <span className="sdp-refranyer__indicador-temps" role="status" aria-live="polite">
                        {estatGravacio === 'gravant'
                          ? tradueix(t, ['patrimoni.refranyer.gravantTemps', 'Gravant en viu: {s} s / {max} s'])
                            .replace('{s}', String(segonsGravant))
                            .replace('{max}', String(MAX_DURADA_GRAVACIO_S))
                          : audioGravacio
                            ? tradueix(t, ['patrimoni.refranyer.duradaLlesta', 'Mostra llesta ({s} s)'])
                              .replace('{s}', String(audioGravacio.durada))
                            : tradueix(t, ['patrimoni.refranyer.limitInfo', 'Límit: 15 segons · 2 MB'])}
                      </span>
                    </div>

                    {audioGravacio ? (
                      <div className="sdp-refranyer__preescolta">
                        <audio
                          controls
                          src={audioGravacio.url}
                          aria-label={tradueix(t, ['patrimoni.refranyer.preescoltaAria', 'Preescolta de la teua gravació'])}
                        />
                        <a
                          className="sdp-boto sdp-boto--secundari"
                          href={audioGravacio.url}
                          download={`${refrany.id}.${extensioDeMime(audioGravacio.mime)}`}
                        >
                          <Download size={18} aria-hidden="true" focusable="false" />
                          <span>{tradueix(t, ['patrimoni.refranyer.descarregaMostra', 'Descarrega l’àudio'])}</span>
                        </a>
                      </div>
                    ) : null}

                    <div className="sdp-refranyer__camp">
                      <label htmlFor={`${idBase}-var-${refrany.id}`}>
                        {tradueix(t, ['patrimoni.refranyer.variantEscrita', 'Com es diu exactament al teu poble'])}
                      </label>
                      <input
                        id={`${idBase}-var-${refrany.id}`}
                        type="text"
                        className="sdp-refranyer__cerca-input"
                        maxLength={280}
                        required
                        value={variantEscrita}
                        onChange={(e) => setVariantEscrita(e.target.value)}
                      />
                    </div>

                    <div className="sdp-refranyer__camp">
                      <label htmlFor={`${idBase}-pob-${refrany.id}`}>
                        {tradueix(t, ['patrimoni.refranyer.pobleComarca', 'Poble i comarca'])}
                      </label>
                      <input
                        id={`${idBase}-pob-${refrany.id}`}
                        type="text"
                        className="sdp-refranyer__cerca-input"
                        maxLength={120}
                        required
                        value={pobleComarca}
                        onChange={(e) => setPobleComarca(e.target.value)}
                        placeholder={tradueix(t, ['patrimoni.refranyer.poblePlaceholder', 'Ex.: Agres (El Comtat)'])}
                      />
                    </div>

                    <label className="sdp-refranyer__consentiment">
                      <input
                        type="checkbox"
                        checked={consentiment}
                        onChange={(e) => setConsentiment(e.target.checked)}
                      />
                      <span>
                        {tradueix(t, [
                          'patrimoni.refranyer.consentimentText',
                          'Cedisc lliurement esta gravació de veu a l’arxiu oral obert de Sóc de Poble (CC BY-SA 4.0) perquè es puga escoltar i ajude a entrenar de manera ètica les veus d’IA de les nostres comarques.',
                        ])}
                      </span>
                    </label>

                    <div className="sdp-refranyer__accions">
                      <Boto type="submit" varietat="primari">
                        <CheckCircle2 size={18} aria-hidden="true" focusable="false" />
                        <span>{tradueix(t, ['patrimoni.refranyer.desaAportacio', 'Desar aportació oral'])}</span>
                      </Boto>
                    </div>

                    {missatgeGravacio ? (
                      <Alerta to={missatgeGravacio.tipus === 'error' ? 'error' : 'info'}>
                        {missatgeGravacio.text}
                      </Alerta>
                    ) : null}
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default RefranyerSonorCard;
