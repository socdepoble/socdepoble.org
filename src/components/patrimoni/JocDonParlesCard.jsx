/**
 * JocDonParlesCard.jsx · Onada R23 («La Veu de Sóc de Poble» · Fase 2 IDEA-252/257)
 * Joc interactiu de geografia lingüística, consens lèxic de poble i isoglosses
 * «D'on parles?».
 *
 * Reglament Pedra Seca: zero estils inline, 100 % tokens CSS semàntics,
 * botons i enllaços tàctils generosos (>= 48 px), navegació accessible pas a
 * pas (1/12), variants vives de poble amb votació de consens (ex. «Querilla»
 * vs «Queraïlla», «Aspencat», «Pual»), pont opcional cap a Supabase darrere del
 * port neutral (backendPort.js) amb honestedat Llei 0, i fil dedicat per pas
 * al Xat de Poble (?sobre=publicacio:la-veu-de-soc-de-poble).
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  RotateCcw,
  Share2,
  Sparkles,
  Square,
  ThumbsUp,
  Volume2,
} from 'lucide-react';
import { Boto } from '../PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../PedraSeca/molecules/Alerta.jsx';
import { tradueix, useTraductorOpcional } from '../PedraSeca/hooks/useTraductorOpcional.js';
import { desplacaASeccio } from '../universal/PageFrame.jsx';
import { useRouter } from '../../app/contexts/RouterContext.jsx';
import { useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { getBackendImplementation } from '../../data/backendPort.js';
import {
  VEUS_TERRITORIALS,
  VEU_AUTO_NAVEGADOR,
  desaVeuPreferida,
  llegeixVeuPreferida,
  subscriuVeuPreferida,
} from '../../services/veusTerritorials.js';
import {
  COMARQUES_ENQUESTA,
  OPCIONS_ABAST_COMARCAL,
  PREGUNTES_ISOGLOSSES,
  calculaAfinitatComarcal,
  construeixOpcionsVivesPregunta,
  construeixTextCompartirWhatsApp,
  desaAportacioIsoglossaLocal,
  llegeixAportacionsIsoglossesLocals,
  llegeixPerfilTerritoriJoc,
  registraSeleccioPreguntaLocal,
  rutaDebatXatParaula,
} from './isoglossesComarcals.js';

const URL_CANONICA_VEU = 'https://socdepoble.org/mur/la-veu-de-soc-de-poble';
const movimentReduit = () => typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;

function useIdiomaActiu() {
  try {
    const lang = useUIStateOpcional()?.language;
    return ['ca', 'es', 'en', 'eu', 'gl'].includes(lang) ? lang : 'ca';
  } catch {
    return 'ca';
  }
}

/* El router on viu el joc, si n'hi ha; null en un espècimen o una prova sense
   RouterProvider. Mateix patró que useRouterOpcional de PageFrame.jsx: els
   objectes de context només els importen els .jsx del seu context. */
function useRouterOpcional() {
  try {
    return useRouter() ?? null;
  } catch {
    return null;
  }
}

/**
 * Enllaç SPA cap al Xat de Poble que usa RouterContext quan és present
 * (preservant origenDelXat per tornar a l'article) i degrada a <a> net en
 * entorns d'espècimen o proves sense RouterProvider.
 */
function EnllacDebatXat({ to, className, children }) {
  const router = useRouterOpcional();
  const href = router?.basename && typeof to === 'string' && to.startsWith('/')
    ? `${router.basename}${to}`
    : to;

  const gestionaClic = (event) => {
    if (!router?.navigate) return;
    if (
      event.button === 0
      && !event.ctrlKey
      && !event.metaKey
      && !event.shiftKey
      && !event.altKey
    ) {
      event.preventDefault();
      router.navigate(to);
    }
  };

  return (
    <a href={href} className={className} onClick={gestionaClic}>
      {children}
    </a>
  );
}

export function JocDonParlesCard() {
  const t = useTraductorOpcional();
  const idioma = useIdiomaActiu();
  const idBase = useId();
  const seccioJocRef = useRef(null);
  const [peticioScroll, setPeticioScroll] = useState(null);
  const peticioScrollAtesaRef = useRef(null);

  const perfilInicial = useMemo(() => llegeixPerfilTerritoriJoc(), []);

  const [pasActual, setPasActual] = useState(0);
  const [respostes, setRespostes] = useState({});
  const [finalitzat, setFinalitzat] = useState(false);
  const [veuActiva, setVeuActiva] = useState(() => llegeixVeuPreferida());
  const [veuAplicadaAvis, setVeuAplicadaAvis] = useState(false);
  const [comptadorVots, setComptadorVots] = useState(0);
  const [escoltantPregunta, setEscoltantPregunta] = useState(false);
  const [resumRemot, setResumRemot] = useState([]);

  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [paraulaNova, setParaulaNova] = useState('');
  const [poble, setPoble] = useState(perfilInicial.poble || '');
  const [comarcaId, setComarcaId] = useState(perfilInicial.comarcaId || '');
  const [abastComarcal, setAbastComarcal] = useState('nomes_poble');
  const [preguntaRelacionada, setPreguntaRelacionada] = useState('');
  const [consentiment, setConsentiment] = useState(false);
  const [consentimentSessio, setConsentimentSessio] = useState(false);
  const [estatAportacio, setEstatAportacio] = useState(null);
  const [avisPasAvancat, setAvisPasAvancat] = useState('');
  const [aportacionsLocals, setAportacionsLocals] = useState(() => llegeixAportacionsIsoglossesLocals());

  useEffect(() => subscriuVeuPreferida(setVeuActiva), []);

  useEffect(() => {
    let actiu = true;
    const carregaConsensRemot = async () => {
      try {
        const backend = getBackendImplementation();
        if (typeof backend?.lligConsensIsoglossesPoble !== 'function') return;
        const dades = await backend.lligConsensIsoglossesPoble();
        if (actiu && Array.isArray(dades)) {
          setResumRemot(dades);
        }
      } catch {
        /* Degradació honesta (Llei 0): sense RPC remota activa, funciona amb llavor + dispositiu. */
      }
    };
    carregaConsensRemot();
    return () => { actiu = false; };
  }, []);

  const totalPreguntes = PREGUNTES_ISOGLOSSES.length;
  const preguntaActual = PREGUNTES_ISOGLOSSES[pasActual] || PREGUNTES_ISOGLOSSES[0];

  const demanaScrollCapdamunt = (mode = 'sempre') => {
    setPeticioScroll({ mode, marca: Symbol('scroll-joc-parla') });
  };

  useEffect(() => {
    if (!peticioScroll || peticioScrollAtesaRef.current === peticioScroll) return;
    peticioScrollAtesaRef.current = peticioScroll;
    const seccio = seccioJocRef.current;
    if (!seccio) return;
    if (peticioScroll.mode === 'si-fora-dalt') {
      const rect = seccio.getBoundingClientRect?.();
      if (!rect || rect.top >= 80) return;
    }
    desplacaASeccio(seccio, {
      behavior: movimentReduit() ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [peticioScroll]);

  const opcionsVivesActuals = useMemo(
    () => {
      void comptadorVots;
      return construeixOpcionsVivesPregunta(preguntaActual?.id, aportacionsLocals, resumRemot);
    },
    [preguntaActual?.id, aportacionsLocals, resumRemot, comptadorVots]
  );

  const resultat = useMemo(
    () => (finalitzat ? calculaAfinitatComarcal(respostes, aportacionsLocals, resumRemot) : null),
    [finalitzat, respostes, aportacionsLocals, resumRemot]
  );

  const avancaSeguentPas = (novesRespostes, modeScroll = 'si-fora-dalt') => {
    setRespostes(novesRespostes);
    if (pasActual + 1 < totalPreguntes) {
      setPasActual(pasActual + 1);
      demanaScrollCapdamunt(modeScroll);
    } else {
      setFinalitzat(true);
      demanaScrollCapdamunt('sempre');
    }
  };

  /* Onada R24.2 (revisió adversarial) · El vot porta només el territori que
     ha declarat qui vota (el poble i la comarca del seu perfil del joc), o
     null: mai el poble, la comarca ni l'abast del cubell dominant de la
     variant, que escrivia dades que ningú no havia dit i reforçava la comarca
     que ja manava. Votar no tria cap abast (el selector és del formulari
     d'aportació, amb 'nomes_poble' per defecte): 'no_ho_se'. */
  const sincronitzaVotRemotOpcional = (vivaObj) => {
    if (!vivaObj) return;
    try {
      const backend = getBackendImplementation();
      if (typeof backend?.votaVariantIsoglossaPoble !== 'function') return;
      Promise.resolve(
        backend.votaVariantIsoglossaPoble({
          preguntaId: preguntaActual.id,
          variantClau: vivaObj.clauMot || '',
          paraulaEtiqueta: vivaObj.etiqueta,
          poble: poble || null,
          comarcaId: comarcaId || null,
          abastComarcal: 'no_ho_se',
        })
      ).catch(() => {});
    } catch {
      /* Ignorat si el port no implementa encara la RPC remota. */
    }
  };

  const seleccionaOpcio = (opcioId) => {
    const jaEraSeleccionada = respostes[preguntaActual.id] === opcioId;
    registraSeleccioPreguntaLocal(preguntaActual.id, opcioId);
    setComptadorVots((v) => v + 1);
    if (typeof opcioId === 'string' && opcioId.startsWith('viva:') && !jaEraSeleccionada) {
      const vivaObj = opcionsVivesActuals.find((v) => v.id === opcioId);
      sincronitzaVotRemotOpcional(vivaObj);
    }
    setAvisPasAvancat('');
    avancaSeguentPas({ ...respostes, [preguntaActual.id]: opcioId }, 'si-fora-dalt');
  };

  const tornaEnrere = () => {
    setAvisPasAvancat('');
    if (finalitzat) {
      setFinalitzat(false);
      setPasActual(totalPreguntes - 1);
      demanaScrollCapdamunt('si-fora-dalt');
      return;
    }
    if (pasActual > 0) {
      setPasActual(pasActual - 1);
      demanaScrollCapdamunt('si-fora-dalt');
    }
  };

  const reiniciaJoc = () => {
    setRespostes({});
    setPasActual(0);
    setFinalitzat(false);
    setMostrarFormulari(false);
    setEstatAportacio(null);
    setVeuAplicadaAvis(false);
    setAvisPasAvancat('');
    demanaScrollCapdamunt('sempre');
  };

  const commutaFormulari = () => {
    if (mostrarFormulari) {
      setMostrarFormulari(false);
      setEstatAportacio(null);
      demanaScrollCapdamunt('si-fora-dalt');
      return;
    }
    if (!finalitzat) {
      setPreguntaRelacionada(preguntaActual.id);
    }
    if (consentimentSessio) {
      setConsentiment(true);
    }
    setEstatAportacio(null);
    setMostrarFormulari(true);
  };

  const escoltaPreguntaActual = async () => {
    try {
      const modul = await import('../../services/veuIaiaService.js');
      if (escoltantPregunta) {
        modul.atura();
        setEscoltantPregunta(false);
        return;
      }
      const enunciat = preguntaActual.enunciat.ca;
      const mots = [
        ...preguntaActual.opcions.map((o) => o.etiqueta),
        ...opcionsVivesActuals.map((v) => v.etiqueta),
      ].join(', ');
      setEscoltantPregunta(true);
      await modul.parla(`${enunciat} ${mots}.`, {
        idioma: 'ca',
        privat: false,
        veu: veuActiva,
      });
    } catch {
      /* Ignora avortaments o absència de síntesi en proves */
    } finally {
      setEscoltantPregunta(false);
    }
  };

  const comparteixPerWhatsApp = async () => {
    if (!resultat) return;
    const missatge = construeixTextCompartirWhatsApp(resultat, URL_CANONICA_VEU);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: tradueix(t, ['patrimoni.jocParla.titol', 'D’on parles? · El joc de les paraules de poble']),
          text: missatge,
          url: URL_CANONICA_VEU,
        });
        return;
      } catch {
        /* Si l'usuari cancel·la el full natiu o falla, obri l'enllaç directe de WhatsApp. */
      }
    }
    if (typeof window !== 'undefined') {
      const urlWa = `https://wa.me/?text=${encodeURIComponent(missatge)}`;
      window.open(urlWa, '_blank', 'noopener,noreferrer');
    }
  };

  const activaVeuRecomanada = async (veuId) => {
    const desada = desaVeuPreferida(veuId);
    setVeuActiva(desada);
    setVeuAplicadaAvis(true);
    if (desada !== VEU_AUTO_NAVEGADOR) {
      try {
        const modul = await import('../../services/veuIaiaService.js');
        const veuObj = VEUS_TERRITORIALS.find((v) => v.id === desada);
        const nom = veuObj ? tradueix(t, [veuObj.clauNom, veuObj.reservaNom]).replace('·', ',') : desada;
        modul.parla(`Veu activada: ${nom}. Ja pots escoltar la pàgina i els refranys amb esta veu.`, {
          idioma: 'ca',
          privat: false,
          veu: desada,
        }).catch(() => {});
      } catch {
        /* Ignorat en proves sense xarxa */
      }
    }
  };

  const enviaVariantLocal = async (event) => {
    event.preventDefault();
    const idPreguntaDesti = !finalitzat
      ? (preguntaRelacionada || preguntaActual.id)
      : preguntaRelacionada;

    const res = desaAportacioIsoglossaLocal({
      paraula: paraulaNova,
      poble,
      comarcaId,
      abastComarcal,
      preguntaId: idPreguntaDesti,
      consentiment,
    });
    if (!res.ok) {
      let missatgeError = tradueix(t, [
        'patrimoni.jocParla.errorCamps',
        'Escriu tant la paraula o expressió com el nom del teu poble.',
      ]);
      if (res.motiu === 'consentiment') {
        missatgeError = tradueix(t, [
          'patrimoni.jocParla.errorConsentiment',
          'Marca la casella de cessió lliure abans de desar la paraula.',
        ]);
      } else if (res.motiu === 'emmagatzematge') {
        missatgeError = tradueix(t, [
          'patrimoni.jocParla.errorEmmagatzematge',
          'No s’ha pogut guardar la paraula perquè la memòria local del navegador està plena o blocada. Hem conservat el que has escrit perquè no es perda res.',
        ]);
      }
      setEstatAportacio({
        tipus: 'error',
        missatge: missatgeError,
      });
      return;
    }

    let desatAlServidor = false;
    try {
      const backend = getBackendImplementation();
      if (typeof backend?.desaAportacioVeuPoble === 'function') {
        await backend.desaAportacioVeuPoble({
          tipus: 'variant_isoglossa',
          ...res.registre,
        });
        desatAlServidor = true;
      }
    } catch {
      /* Degradació honesta (Llei 0): queda guardada al dispositiu. */
    }

    const novesAportacions = llegeixAportacionsIsoglossesLocals();
    setAportacionsLocals(novesAportacions);
    setParaulaNova('');
    setConsentimentSessio(true);
    setConsentiment(true);

    if (!finalitzat) {
      setMostrarFormulari(false);
      setEstatAportacio(null);
      const textAvis = tradueix(t, [
        'patrimoni.jocParla.avisDesatIAvancat',
        'Paraula «{mot}» guardada en este dispositiu per a {poble}! Ja suma com a opció viva i passem a la següent paraula.',
      ])
        .replace('{mot}', res.registre.paraula)
        .replace('{poble}', res.registre.poble);
      setAvisPasAvancat(textAvis);
      const respostaId = res.opcioVivaId || `viva:${preguntaActual.id}:custom`;
      avancaSeguentPas({ ...respostes, [preguntaActual.id]: respostaId }, 'sempre');
      return;
    }

    setEstatAportacio({
      tipus: 'exit',
      missatge: desatAlServidor
        ? tradueix(t, [
          'patrimoni.jocParla.consensServidor',
          'La teua resposta s’ha sumat a l’enquesta col·lectiva de Sóc de Poble ({total} aportacions registrades).',
        ]).replace('{total}', String(novesAportacions.length))
        : tradueix(t, [
          'patrimoni.jocParla.consensLocal',
          'Aportació guardada en este dispositiu i llesta per sincronitzar amb el mapa de consens veïnal quan s’active la taula compartida.',
        ]),
    });
  };

  const veuRecomanadaObj = resultat
    ? VEUS_TERRITORIALS.find((v) => v.id === resultat.guanyadora.veuRecomanada) || VEUS_TERRITORIALS[0]
    : null;

  const rutaXatPasActual = rutaDebatXatParaula(preguntaActual);
  const rutaXatResultat = rutaDebatXatParaula(null);

  return (
    <section
      ref={seccioJocRef}
      className="sdp-subtargeta sdp-joc-parla"
      aria-labelledby={`${idBase}-titol`}
      data-sdp-no-locutar=""
    >
      <header className="sdp-joc-parla__capcalera">
        <p className="sdp-joc-parla__insignia">
          {tradueix(t, ['patrimoni.jocParla.insignia', 'Joc interactiu · 12 isoglosses vives'])}
        </p>
        <h3 id={`${idBase}-titol`} className="sdp-joc-parla__titol">
          {tradueix(t, ['patrimoni.jocParla.titol', 'D’on parles? · El joc de les paraules de poble'])}
        </h3>
        <p className="sdp-joc-parla__entradeta">
          {tradueix(t, [
            'patrimoni.jocParla.entradeta',
            'Tria com ho dius a casa sense pensar-t’ho dos voltes. En 12 paraules descobrim a quines comarques s’assembla més la teua parla i quina veu li escau millor.',
          ])}
        </p>
      </header>

      {avisPasAvancat ? (
        <Alerta to="info">{avisPasAvancat}</Alerta>
      ) : null}

      {!finalitzat ? (
        <div className="sdp-joc-parla__pregunta-caixa">
          <div className="sdp-joc-parla__progres-fila">
            <span className="sdp-joc-parla__comptador" aria-live="polite">
              {tradueix(t, ['patrimoni.jocParla.pas', 'Paraula {actual} de {total}'])
                .replace('{actual}', String(pasActual + 1))
                .replace('{total}', String(totalPreguntes))}
            </span>
            <div className="sdp-joc-parla__accions-resultat">
              {pasActual > 0 ? (
                <Boto varietat="secundari" onClick={tornaEnrere}>
                  <ArrowLeft size={18} aria-hidden="true" focusable="false" />
                  <span>{tradueix(t, ['patrimoni.jocParla.anterior', 'Anterior'])}</span>
                </Boto>
              ) : null}
              <Boto varietat="secundari" aria-pressed={escoltantPregunta} onClick={escoltaPreguntaActual}>
                {escoltantPregunta
                  ? <Square size={18} aria-hidden="true" focusable="false" />
                  : <Volume2 size={18} aria-hidden="true" focusable="false" />}
                <span>
                  {escoltantPregunta
                    ? tradueix(t, ['patrimoni.jocParla.aturaVeu', 'Atura'])
                    : tradueix(t, ['patrimoni.jocParla.escoltarPregunta', 'Escoltar paraules'])}
                </span>
              </Boto>
              {respostes[preguntaActual.id] ? (
                <Boto varietat="secundari" onClick={() => avancaSeguentPas(respostes, 'si-fora-dalt')}>
                  <span>{tradueix(t, ['patrimoni.jocParla.seguent', 'Següent'])}</span>
                  <ArrowRight size={18} aria-hidden="true" focusable="false" />
                </Boto>
              ) : null}
            </div>
          </div>

          <progress
            className="sdp-joc-parla__barra-progres"
            value={pasActual + 1}
            max={totalPreguntes}
            aria-label={tradueix(t, ['patrimoni.jocParla.progresAria', 'Progrés del qüestionari dialectal'])}
          />

          <h4 className="sdp-joc-parla__enunciat">
            {preguntaActual.enunciat[idioma] || preguntaActual.enunciat.ca}
          </h4>

          <div className="sdp-joc-parla__opcions" role="group" aria-label={preguntaActual.enunciat[idioma] || preguntaActual.enunciat.ca}>
            {preguntaActual.opcions.map((opcio) => {
              const seleccionada = respostes[preguntaActual.id] === opcio.id;
              return (
                <button
                  key={opcio.id}
                  type="button"
                  aria-pressed={seleccionada}
                  className={seleccionada ? 'sdp-joc-parla__opcio sdp-joc-parla__opcio--activa' : 'sdp-joc-parla__opcio'}
                  onClick={() => seleccionaOpcio(opcio.id)}
                >
                  <span className="sdp-joc-parla__opcio-mot">{opcio.etiqueta}</span>
                  <span className="sdp-joc-parla__opcio-detall">{opcio.detall}</span>
                </button>
              );
            })}

            {opcionsVivesActuals.map((viva) => {
              const seleccionada = respostes[preguntaActual.id] === viva.id;
              return (
                <button
                  key={viva.id}
                  type="button"
                  aria-pressed={seleccionada}
                  className={seleccionada ? 'sdp-joc-parla__opcio sdp-joc-parla__opcio--viva sdp-joc-parla__opcio--activa' : 'sdp-joc-parla__opcio sdp-joc-parla__opcio--viva'}
                  onClick={() => seleccionaOpcio(viva.id)}
                >
                  <span className="sdp-joc-parla__opcio-cap">
                    <span className="sdp-joc-parla__opcio-mot">{viva.etiqueta}</span>
                    <span className="sdp-joc-parla__opcio-vots">
                      <ThumbsUp size={13} aria-hidden="true" focusable="false" />
                      <span>{`${viva.vots} · ${viva.percentatgeConsens} %`}</span>
                    </span>
                  </span>
                  <span className="sdp-joc-parla__opcio-detall">
                    {`${tradueix(t, ['patrimoni.jocParla.variantDePoble', 'Variant de poble'])}: ${viva.detall}`}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="sdp-joc-parla__consens-caixa">
            <div className="sdp-joc-parla__consens-fila">
              <p className="sdp-joc-parla__consens-titol">
                {opcionsVivesActuals.length > 0
                  ? (opcionsVivesActuals.some((v) => v.votsRemots > 0)
                    ? tradueix(t, [
                      'patrimoni.jocParla.consensTitol',
                      'Consens viu de poble: com es diu més ací?',
                    ])
                    : tradueix(t, [
                      'patrimoni.jocParla.consensLocalDispositiu',
                      'Mostra documental i d’este dispositiu: com ho diem?',
                    ]))
                  : tradueix(t, [
                    'patrimoni.jocParla.consensFase2Titol',
                    'Mapa viu de consens veïnal',
                  ])}
              </p>
              <EnllacDebatXat to={rutaXatPasActual} className="sdp-joc-parla__consens-xat">
                <MessageCircle size={15} aria-hidden="true" focusable="false" />
                <span>
                  {tradueix(t, [
                    'patrimoni.jocParla.debatParaulaXat',
                    'Debatre este pas al Xat de Poble',
                  ])}
                </span>
              </EnllacDebatXat>
            </div>
            {opcionsVivesActuals.length > 0 ? (
              <p className="sdp-joc-parla__consens-resum">
                {opcionsVivesActuals
                  .map((v) => `${v.etiqueta} (${v.percentatgeConsens} % · ${v.detall})`)
                  .join(' · ')}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="sdp-joc-parla__resultat" role="region" aria-live="polite" aria-labelledby={`${idBase}-res-titol`}>
          <div className="sdp-joc-parla__resultat-destacat">
            <p className="sdp-joc-parla__resultat-etiqueta">
              <Sparkles size={18} aria-hidden="true" focusable="false" />
              <span>
                {tradueix(t, ['patrimoni.jocParla.afinitatPrincipal', '{pct} % d’afinitat comarcal'])
                  .replace('{pct}', String(resultat.ranquing[0]?.percentatge ?? 0))}
              </span>
            </p>
            <h4 id={`${idBase}-res-titol`} className="sdp-joc-parla__resultat-comarca">
              {resultat.guanyadora.nom}
            </h4>
            <p className="sdp-joc-parla__resultat-pobles">
              {resultat.guanyadora.poblesExemple}
            </p>
            <p className="sdp-joc-parla__resultat-descripcio">
              {resultat.guanyadora.descripcio[idioma] || resultat.guanyadora.descripcio.ca}
            </p>
          </div>

          <h5 className="sdp-joc-parla__subtitol-ranquing">
            {tradueix(t, ['patrimoni.jocParla.mapaAfinitats', 'Les 3 àrees més pròximes a les teues respostes'])}
          </h5>
          <ul className="sdp-joc-parla__ranquing-llista">
            {resultat.ranquing.slice(0, 3).map((item) => (
              <li key={item.area.id} className="sdp-joc-parla__ranquing-item">
                <div className="sdp-joc-parla__ranquing-fila">
                  <strong>{item.area.nom}</strong>
                  <span className="sdp-joc-parla__ranquing-pct">{`${item.percentatge} %`}</span>
                </div>
                <progress className="sdp-joc-parla__barra-progres" value={item.percentatge} max={100} />
              </li>
            ))}
          </ul>

          {veuRecomanadaObj ? (
            <div className="sdp-joc-parla__veu-caixa">
              <p className="sdp-joc-parla__veu-text">
                {tradueix(t, ['patrimoni.jocParla.veuSuggerida', 'Veu suggerida per a llegir Sóc de Poble: {veu}'])
                  .replace('{veu}', tradueix(t, [veuRecomanadaObj.clauNom, veuRecomanadaObj.reservaNom]))}
              </p>
              <Boto
                varietat={veuActiva === veuRecomanadaObj.id && veuAplicadaAvis ? 'secundari' : 'primari'}
                onClick={() => activaVeuRecomanada(veuRecomanadaObj.id)}
              >
                <Volume2 size={18} aria-hidden="true" focusable="false" />
                <span>
                  {veuActiva === veuRecomanadaObj.id && veuAplicadaAvis
                    ? tradueix(t, ['patrimoni.jocParla.veuActivada', 'Veu activada en este dispositiu'])
                    : tradueix(t, ['patrimoni.jocParla.activaVeu', 'Activa esta veu com a preferida'])}
                </span>
              </Boto>
            </div>
          ) : null}

          <div className="sdp-joc-parla__accions-resultat">
            <Boto varietat="primari" onClick={comparteixPerWhatsApp}>
              <Share2 size={18} aria-hidden="true" focusable="false" />
              <span>{tradueix(t, ['patrimoni.jocParla.compartirWhatsapp', 'Compartir el meu resultat per WhatsApp'])}</span>
            </Boto>
            <EnllacDebatXat to={rutaXatResultat} className="sdp-joc-parla__consens-xat">
              <MessageCircle size={15} aria-hidden="true" focusable="false" />
              <span>{tradueix(t, ['patrimoni.jocParla.debatreXat', 'Debatre al Xat de Poble'])}</span>
            </EnllacDebatXat>
            <Boto varietat="secundari" onClick={tornaEnrere}>
              <ArrowLeft size={18} aria-hidden="true" focusable="false" />
              <span>{tradueix(t, ['patrimoni.jocParla.revisarRespostes', 'Revisar respostes'])}</span>
            </Boto>
            <Boto varietat="secundari" onClick={reiniciaJoc}>
              <RotateCcw size={18} aria-hidden="true" focusable="false" />
              <span>{tradueix(t, ['patrimoni.jocParla.tornarJugar', 'Tornar a jugar'])}</span>
            </Boto>
          </div>
        </div>
      )}

      <div className="sdp-joc-parla__aportacio-bloc">
        <Boto
          varietat="secundari"
          aria-expanded={mostrarFormulari}
          aria-controls={`${idBase}-form-poble`}
          onClick={commutaFormulari}
        >
          <span>{tradueix(t, ['patrimoni.jocParla.alMeuPobleBoto', 'Al meu poble ho diem d’una altra manera!'])}</span>
        </Boto>

        {mostrarFormulari ? (
          <form id={`${idBase}-form-poble`} className="sdp-joc-parla__formulari" onSubmit={enviaVariantLocal}>
            <p className="sdp-joc-parla__formulari-ajuda">
              {tradueix(t, [
                'patrimoni.jocParla.formulariAjuda',
                'Ajuda la IA de Sóc de Poble a conéixer els mots vius que no sempre ixen als llibres. En desar-la, passaràs automàticament a la següent paraula!',
              ])}
            </p>
            <div className="sdp-joc-parla__camp">
              <label htmlFor={`${idBase}-paraula`}>
                {tradueix(t, ['patrimoni.jocParla.campParaula', 'Paraula o expressió del teu poble'])}
              </label>
              <input
                id={`${idBase}-paraula`}
                type="text"
                className="sdp-joc-parla__input"
                maxLength={120}
                required
                value={paraulaNova}
                onChange={(e) => setParaulaNova(e.target.value)}
                placeholder={tradueix(t, ['patrimoni.jocParla.placeholderParaula', 'Ex.: querilla, queraïlla, bajoca de careta, mullador…'])}
              />
            </div>

            <div className="sdp-joc-parla__fila-territori">
              <div className="sdp-joc-parla__camp">
                <label htmlFor={`${idBase}-poble`}>
                  {tradueix(t, ['patrimoni.jocParla.campPoble', 'Poble'])}
                </label>
                <input
                  id={`${idBase}-poble`}
                  type="text"
                  className="sdp-joc-parla__input"
                  maxLength={80}
                  required
                  value={poble}
                  onChange={(e) => setPoble(e.target.value)}
                  placeholder={tradueix(t, ['patrimoni.jocParla.placeholderPoble', 'Ex.: La Torre de les Maçanes'])}
                />
              </div>

              <div className="sdp-joc-parla__camp">
                <label htmlFor={`${idBase}-comarca`}>
                  {tradueix(t, ['patrimoni.jocParla.campComarca', 'Comarca (opcional)'])}
                </label>
                <select
                  id={`${idBase}-comarca`}
                  className="sdp-joc-parla__input"
                  value={comarcaId}
                  onChange={(e) => setComarcaId(e.target.value)}
                >
                  <option value="">{tradueix(t, ['patrimoni.jocParla.triaComarca', 'Tria comarca o deixa-ho obert'])}</option>
                  {COMARQUES_ENQUESTA.map((comarca) => (
                    <option key={comarca.id} value={comarca.id}>
                      {comarca.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="sdp-joc-parla__enquesta-abast">
              <legend>
                {tradueix(t, [
                  'patrimoni.jocParla.abastPregunta',
                  'Es diu només al teu poble o també a la comarca?',
                ])}
              </legend>
              <div className="sdp-joc-parla__abast-opcions">
                {OPCIONS_ABAST_COMARCAL.map((op) => {
                  const actiu = abastComarcal === op.id;
                  return (
                    <label
                      key={op.id}
                      className={actiu ? 'sdp-joc-parla__pindola-abast sdp-joc-parla__pindola-abast--activa' : 'sdp-joc-parla__pindola-abast'}
                    >
                      <input
                        type="radio"
                        name={`${idBase}-abast`}
                        value={op.id}
                        checked={actiu}
                        onChange={() => setAbastComarcal(op.id)}
                      />
                      <span>{tradueix(t, [op.clau, op.reserva])}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {finalitzat ? (
              <div className="sdp-joc-parla__camp">
                <label htmlFor={`${idBase}-pregunta-rel`}>
                  {tradueix(t, ['patrimoni.jocParla.campPreguntaRel', 'Sobre quina paraula del joc? (opcional)'])}
                </label>
                <select
                  id={`${idBase}-pregunta-rel`}
                  className="sdp-joc-parla__input"
                  value={preguntaRelacionada}
                  onChange={(e) => setPreguntaRelacionada(e.target.value)}
                >
                  <option value="">{tradueix(t, ['patrimoni.jocParla.capPreguntaConcreta', 'Paraula lliure del poble'])}</option>
                  {PREGUNTES_ISOGLOSSES.map((p, idx) => (
                    <option key={p.id} value={p.id}>
                      {`${idx + 1}. ${p.opcions.map((o) => o.etiqueta).join(' / ')}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <label className="sdp-joc-parla__consentiment">
              <input
                type="checkbox"
                checked={consentiment}
                onChange={(e) => setConsentiment(e.target.checked)}
              />
              <span>
                {tradueix(t, [
                  'patrimoni.jocParla.consentimentText',
                  'Cedisc lliurement esta aportació lèxica al domini comú (CC BY-SA 4.0) per a l’arxiu lingüístic i l’aprenentatge ètic de les IAs de Sóc de Poble.',
                ])}
              </span>
            </label>

            <div className="sdp-joc-parla__accions-resultat">
              <Boto type="submit" varietat="primari">
                <CheckCircle2 size={18} aria-hidden="true" focusable="false" />
                <span>
                  {!finalitzat
                    ? tradueix(t, ['patrimoni.jocParla.desaIPassa', 'Desar paraula i passar a la següent'])
                    : tradueix(t, ['patrimoni.jocParla.desaParaula', 'Desar paraula del meu poble'])}
                </span>
                {!finalitzat ? <ArrowRight size={18} aria-hidden="true" focusable="false" /> : null}
              </Boto>
            </div>

            {estatAportacio ? (
              <Alerta to={estatAportacio.tipus === 'error' ? 'error' : 'info'}>
                {estatAportacio.missatge}
              </Alerta>
            ) : null}
          </form>
        ) : null}

        {aportacionsLocals.length > 0 ? (
          <div className="sdp-joc-parla__llista-locals">
            <h5>
              {tradueix(t, ['patrimoni.jocParla.aportadesEnDispositiu', 'Paraules anotades en este dispositiu ({n})'])
                .replace('{n}', String(aportacionsLocals.length))}
            </h5>
            <ul>
              {aportacionsLocals.slice(0, 5).map((ap) => (
                <li key={ap.id}>
                  <strong>{ap.paraula}</strong>
                  {` — ${ap.pobleComarca}`}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default JocDonParlesCard;
