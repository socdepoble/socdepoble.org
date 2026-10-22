/**
 * FullAjustos.jsx — el full «Ajustos» del Xat (torn 260930, T1), amb
 * l'anatomia habitual dels ajustos de missatgeria (52 captures de referència
 * del Mestre, 20.47–21.05).
 *
 * «Tu» al peu del rail (o l'avatar, amb el rail plegat) l'obri. És un modal
 * CENTRAT de mida FIXA (480×640 a la captura: 30×40rem), amb una pila de
 * pàgines dins del MATEIX marc: navegar no el mou ni el canvia de mida, i una
 * pàgina curta no l'encongix. En estret ocupa tota la pantalla, com les
 * pantalles empeses de les apps de missatgeria en mòbil, amb el MATEIX tall
 * que convertix la
 * resta de Dialeg en full inferior (revisió adversarial 260930, P2):
 * ≤720px a socdepoble.org i [data-sdp-estret] a l'encastat (modules.css,
 * .sdp-xat-ajustos).
 *
 * Anatomia de cada pàgina (ajustosXat.js és el model):
 *   · capçalera fixa: a l'arrel, la X circular a l'esquerra (tanca tot); a
 *     cada subpàgina, el ‹ circular (torna un nivell); el títol, centrat;
 *   · a l'arrel, el cercador en píndola, fix («Cerca als ajustos»: filtra les
 *     files de tot l'arbre, amb el plegat d'accents de /cerca);
 *   · el cos, que és l'únic que fa scroll: la targeta del perfil i els grups
 *     de files en targetes (icona, etiqueta, valor gris, xebró o ✓), amb les
 *     capçaleres de secció i les notes fora de la targeta, l'acció
 *     destructiva en roig, i l'avís honest de les pàgines sense dades.
 * Els canvis s'apliquen a l'acte (tema, llengua, amplària): no hi ha cap
 * botó de desar, com a les apps de missatgeria.
 *
 * Focus: en obrir, al cercador; en entrar a una subpàgina, al seu ‹; en
 * tornar, a la fila que l'havia obert. Escape tanca el full sencer
 * (onTanca('esc') del Dialeg); dins del cercador amb text, primer l'esborra.
 * Obrir una ruta des del full el tanca.
 *
 * Dos peces:
 *   · CosAjustos: el marc presentacional (capçalera, cercador i pila). No llig
 *     cap context: tot li arriba per props, i per això el catàleg de disseny
 *     el pinta en línia, sense Dialeg (EspecimenXatAjustos).
 *   · FullAjustos (per defecte): el Dialeg de Pedra Seca (variant
 *     «sense-marc»: el <dialog> és el marc) i les dades de l'app per
 *     useXat(), UIContext, SessionContext, useAppGrid() i la cara del poble
 *     de l'amfitrió (useCaraDelPoble, per als Preferits). Model B: cap
 *     Supabase. Les fotos pujades ('sdp-media://') dels Preferits les resol
 *     el port, de manera transitiva, per CaraXat. ClosCaXat el munta una sola
 *     vegada, dins de la closca.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  ArrowDownUp, BellDot, Check, ChevronLeft, ChevronRight, CircleQuestionMark, CircleX, Heart, KeyRound,
  Lock, MessageCircle, Palette, RefreshCw, Search, Star, X
} from 'lucide-react';
import { Dialeg } from '../../../components/PedraSeca/index.js';
import CaraXat from './CaraXat.jsx';
import { caraDeComunitat } from '../caraDeSocDePoble.js';
import { AvatarResolt } from '../../../components/universal/identitat/AvatarResolt.jsx';
import { PRESETS_COLUMNES, useAppGrid } from '../../../components/layout/AppGridShell.jsx';
import { useEixidaSegura } from '../../../components/universal/EixidaSegura.jsx';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { useSessioOpcional } from '../../../app/contexts/SessionContext.jsx';
import { useUIActions, useUIState } from '../../../app/contexts/UIContext';
import { useXat } from '../XatContext';
import { useCaraDelPoble } from '../usePobleAmfitrio.js';
import { filsAmbCaraDelPoble } from '../pobleAmfitrio.js';
import {
  ARREL_AJUSTOS, OPCIONS_TEMA, RUTES_AJUSTOS, cercaAjustos, etiquetaDeFila, paginaAjustos, pilaDeResultat, textDe
} from '../ajustosXat.js';
import { PRESETS_AMPLARIA, presetDeMides } from '../amplariaColumnes.js';
import { TEXTOS_CONSTRUCCIO, textosDeVista } from './VistaEnConstruccio.jsx';

const CAP = Object.freeze([]);
const noop = () => {};
const enc = (valor) => encodeURIComponent(String(valor));

/* Els noms de lucide del model (ajustosXat.js), com IconaFiltre a la cerca. */
const ICONES = Object.freeze({
  ArrowDownUp, BellDot, CircleQuestionMark, Heart, KeyRound, Lock, MessageCircle, Palette, RefreshCw, Star
});

const ARREL = Object.freeze([Object.freeze({ id: ARREL_AJUSTOS, origen: null })]);

/* La fila que té el focus pel seu id (data-sdp-fila). Sense selector: l'id
   ve del model, però no cal escapar res si es compara el valor. */
function filaPerId(marc, id) {
  if (!marc || !id) return null;
  return [...marc.querySelectorAll('[data-sdp-fila]')].find((node) => node.dataset.sdpFila === id) || null;
}

/* ─────────────────────────── El full (Dialeg) ─────────────────────────── */

/**
 * `obert` / `onTanca(motiu)`: controlat, com el Dialeg. `onRetornFocus()`: es
 * crida en tancar-lo sense navegar si el focus s'ha perdut (qui l'havia obert
 * era dins del rail lliscant, que ara és `inert`): ClosCaXat el torna al botó
 * que obri el rail.
 */
export default function FullAjustos({ obert = false, onTanca = noop, onRetornFocus = null }) {
  const { t, setTheme, setLanguage, setContrast } = useUIActions();
  const { themePreference = null, language = null, contrastPreference = null } = useUIState();
  const { joId = null, joNom = null, joAvatar = null, chatThreads = CAP } = useXat();
  const sessio = useSessioOpcional();
  const { mida, tancaPanells, applyPreset, columnWidths } = useAppGrid();
  const navigate = useNavigate();
  const campRef = useRef(null);
  const navegant = useRef(false);
  const obertPrevi = useRef(obert);

  const usuari = sessio?.currentUser || null;
  const correu = typeof usuari?.email === 'string' && usuari.email ? usuari.email : null;
  /* Revisió adversarial 260930 (P3) · «Privacitat i dades» només existix al
     Perfil si el backend sap fer algun dels drets (PerfilShell, la mateixa
     condició per la sessió, Model B). Sense proveïdor, no se sap: null. */
  const ambPrivacitat = typeof sessio?.teCapacitat === 'function'
    ? Boolean(sessio.teCapacitat('compte') || sessio.teCapacitat('consentiment'))
    : null;
  /* Onada 3 (AV, revisió) · La comunitat del poble preferida porta la cara
     del poble, com a la llista (XatSection, filsAmbCaraDelPoble). */
  const { poble, cara } = useCaraDelPoble();
  const preferits = filsAmbCaraDelPoble(Array.isArray(chatThreads) ? chatThreads : CAP, poble, cara)
    .filter((fil) => fil?.preferit === true && !fil.arxivat);

  /* El focus al cercador, no a la X. Els efectes del pare corren després
     dels del fill: quan arriba este, el Dialeg ja ha obert el <dialog> i el
     camp ja es pot enfocar (el mateix que DialegNovaConversa). */
  useEffect(() => { if (obert) campRef.current?.focus(); }, [obert]);

  /* En tancar-lo sense navegar, el Dialeg ja ha tornat el focus a qui
     l'havia obert. Si no ha pogut (fora d'ample, el «Tu» és dins del rail
     lliscant, ja tancat i inert), ho decidix la closca. */
  useEffect(() => {
    const previ = obertPrevi.current;
    obertPrevi.current = obert;
    if (obert || !previ) return;
    if (navegant.current) { navegant.current = false; return; }
    onRetornFocus?.();
  }, [obert, onRetornFocus]);

  /* Obrir una ruta des del full el tanca (i la ruta mana sobre el focus). */
  const ves = useCallback((ruta) => {
    navegant.current = true;
    onTanca('ruta');
    navigate(ruta);
  }, [onTanca, navigate]);

  /* Un preferit obri la seua conversa. En estret la conversa ocupa la
     pantalla: es tanquen abans els panells, com LlistaOpcions del Control
     del xat, per si ja era la conversa oberta. */
  const obriConversa = useCallback((id) => {
    if (mida === 'estret') tancaPanells?.();
    ves(`/xat/${enc(id)}`);
  }, [mida, tancaPanells, ves]);

  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol={t('section.xat.ajustos.titol', 'Ajustos')}
      variant="sense-marc"
      className="sdp-xat-ajustos"
    >
      {obert ? (
        <CosAjustos
          t={t}
          campRef={campRef}
          joId={joId}
          joNom={joNom}
          joAvatar={joAvatar}
          preferits={preferits}
          correu={correu}
          ambSessio={Boolean(usuari)}
          ambPrivacitat={ambPrivacitat}
          FilaEixida={usuari ? FilaEixidaAmbSessio : null}
          tema={themePreference}
          contrast={contrastPreference}
          llengua={language}
          amplaria={presetDeMides(columnWidths, PRESETS_COLUMNES)}
          mides={columnWidths}
          onTema={(preferencia) => setTheme?.(preferencia)}
          onContrast={(preferencia) => setContrast?.(preferencia)}
          onLlengua={(codi) => setLanguage?.(codi)}
          onAmplaria={(id) => applyPreset?.(id)}
          onVes={ves}
          onObriConversa={obriConversa}
          onTanca={() => onTanca('boto')}
        />
      ) : null}
    </Dialeg>
  );
}

/* «Tanca la sessió» (captura 20.53.25: «Cerrar sesión» en roig, sense
   xebró). La mateixa eixida que «Eixir del poble» del Panell de Control
   (ControlSection.jsx: useEixidaSegura i, en acabar, /registre): primer
   envia el pendent i, si queda res que el servidor no té, ho diu ACÍ DINS
   amb l'Alerta i la persona decidix (un avís de fora quedaria davall del
   vel). Només es munta amb sessió: useEixidaSegura la demana.

   Ordre del Mestre 260930 (P2) · Sense recàrrega: a WordPress,
   window.location.reload() recarregava la pàgina sencera de l'amfitrió.
   No cal: tancar la sessió mou la generació del servei (sessionService,
   sincronitza) i els proveïdors de la persona es buiden per àmbit (Xat,
   Mur, Multimèdia i el contingut base per la persona i l'actor
   (currentUser.id i actorKey a la clau d'àmbit, sense `generacio` des de la
   Decisió 2, 261007; el Xat, per ambitEstable des de la Decisió 1); Notes,
   Perfil i la Identitat per l'usuari i l'entrada). La ruta nova desmunta el Xat, i el
   full amb ell. El text a mig escriure del xat (esborranys.js, en memòria)
   l'oblida XatProvider quan canvia la persona (XatContext, clauPersona).

   Revisió adversarial 260930 (P3) · «No eixir encara» desmunta l'Alerta amb
   el botó enfocat a dins: el focus queia a <body> i, a l'encastat, un Tab
   des d'allí ixia del modal cap a l'amfitrió. Quan l'avís se'n va sense
   eixida en curs, el focus torna a «Tanca la sessió». */
function FilaEixidaAmbSessio({ fila, etiqueta }) {
  const navigate = useNavigate();
  const despres = useCallback(() => {
    navigate('/registre', { replace: true });
  }, [navigate]);
  const eixida = useEixidaSegura({ despres });
  const botoRef = useRef(null);
  const ambAvis = Boolean(eixida.avis);
  const avisPrevi = useRef(ambAvis);
  useEffect(() => {
    const previ = avisPrevi.current;
    avisPrevi.current = ambAvis;
    if (previ && !ambAvis && !eixida.ocupat) botoRef.current?.focus();
  }, [ambAvis, eixida.ocupat]);
  return (
    <>
      <ul className="sdp-xat-ajustos__targeta">
        <li>
          <button
            ref={botoRef}
            type="button"
            className="sdp-xat-ajustos__fila sdp-xat-ajustos__fila--perill"
            data-sdp-fila={fila.id}
            onClick={eixida.demana}
            disabled={eixida.ocupat || Boolean(eixida.avis)}
          >
            <span className="sdp-xat-ajustos__linia">
              <span className="sdp-xat-ajustos__etiqueta">{etiqueta}</span>
            </span>
          </button>
        </li>
      </ul>
      {eixida.avis}
      {eixida.error ? <p className="sdp-xat-ajustos__nota sdp-xat-ajustos__nota--error" role="alert">{eixida.error}</p> : null}
    </>
  );
}

/* ───────────────────────────── El cos del full ─────────────────────────── */

/**
 * El marc del full: capçalera, cercador (a l'arrel) i la pila de pàgines.
 * Presentacional: tot per props. `pilaInicial` deixa el catàleg obrir-lo en
 * una subpàgina. `FilaEixida` (un component) pinta el grup de l'eixida quan
 * hi ha sessió; sense, el grup no hi és. `ambPrivacitat` (true, false o
 * null si no se sap) tria la nota que diu on porta «Privacitat».
 */
export function CosAjustos({
  t, campRef = null, pilaInicial = ARREL, joId = null, joNom = null, joAvatar = null, preferits = CAP, correu = null,
  ambSessio = false, ambPrivacitat = null, FilaEixida = null, tema = null, contrast = null, llengua = null, amplaria = null, mides = null,
  onTema = noop, onContrast = noop, onLlengua = noop, onAmplaria = noop, onVes = noop, onObriConversa = noop, onTanca = noop
}) {
  const [pila, setPila] = useState(() => (Array.isArray(pilaInicial) && pilaInicial.length ? pilaInicial : ARREL));
  const [terme, setTerme] = useState('');
  const marcRef = useRef(null);
  const capRef = useRef(null);
  const campPropi = useRef(null);
  const camp = campRef || campPropi;
  const moviment = useRef(null);

  const actual = pila[pila.length - 1];
  const pagina = paginaAjustos(actual.id) || paginaAjustos(ARREL_AJUSTOS);
  const aLArrel = pila.length === 1;
  const pare = aLArrel ? null : paginaAjustos(pila[pila.length - 2].id);
  const titol = textDe(pagina.titol, t);

  /* Empènyer una pàgina porta el focus al ‹ de la nova; tornar, a la fila
     que l'havia obert (a l'arrel amb cerca, al resultat premut). */
  useEffect(() => {
    const m = moviment.current;
    moviment.current = null;
    if (!m) return;
    if (m.tipus === 'endavant') { capRef.current?.focus(); return; }
    const desti = filaPerId(marcRef.current, m.origen) || (pila.length === 1 ? camp.current : capRef.current);
    desti?.focus();
  }, [pila, camp]);

  const empeny = (id, origen) => {
    moviment.current = { tipus: 'endavant' };
    setPila((previ) => [...previ, { id, origen }]);
  };
  const torna = () => {
    moviment.current = { tipus: 'enrere', origen: actual.origen };
    setPila((previ) => (previ.length > 1 ? previ.slice(0, -1) : previ));
  };
  const obriResultat = (resultat) => {
    if (resultat.fila.tipus === 'ruta') { onVes(resultat.fila.ruta); return; }
    moviment.current = { tipus: 'endavant' };
    setPila(pilaDeResultat(resultat));
  };

  /* La fila premuda: una pàgina s'empeny, una ruta s'obri, una opció es tria. */
  const prem = (fila, grup) => {
    if (fila.tipus === 'pagina') empeny(fila.pagina, fila.id);
    else if (fila.tipus === 'ruta') onVes(fila.ruta);
    else if (fila.tipus === 'opcio') {
      if (grup?.seleccio === 'tema') onTema(fila.opcio);
      else if (grup?.seleccio === 'contrast') onContrast(fila.opcio);
      else if (grup?.seleccio === 'llengua') onLlengua(fila.opcio);
      else if (grup?.seleccio === 'amplaria') onAmplaria(fila.opcio);
    }
  };

  /* El valor gris de la dreta: estat de l'app, no del model. */
  const valorDe = (clau) => {
    if (clau === 'tema') {
      const opcio = OPCIONS_TEMA.find((o) => o.opcio === tema);
      return opcio ? etiquetaDeFila(opcio, t) : '';
    }
    if (clau === 'amplaria') {
      const preset = PRESETS_AMPLARIA.find(([id]) => id === amplaria);
      return preset ? t(preset[1], preset[2]) : '';
    }
    if (clau === 'correu') return correu || '';
    return '';
  };
  /* L'opció triada de cada selecció única (el ✓ i aria-pressed). */
  const triades = { tema, contrast, llengua, amplaria };
  const triada = (grup) => (Object.hasOwn(triades, grup.seleccio) ? triades[grup.seleccio] : null);

  /* La nota del peu d'un grup: la del model o, amb `notaDinamica`, una que
     depén de l'estat de l'app. 'amplaria': les mides d'ara. 'privacitat'
     (revisió adversarial 260930, P3): «Privacitat» obri el Perfil, que no
     sap obrir-se en «Privacitat i dades»; la nota ho diu, i no promet
     l'apartat quan el backend no el té. Portar-hi de veres és decisió del
     Mestre (cal un apartat inicial al Perfil). */
  const notaDe = (grup) => {
    if (grup.notaDinamica === 'amplaria' && mides) {
      return t('section.xat.control.espai.ara', 'Ara: navegació {left} px · llista {middle} px')
        .replace('{left}', String(mides.left))
        .replace('{middle}', String(mides.middle));
    }
    if (grup.notaDinamica === 'privacitat' && typeof ambPrivacitat === 'boolean') {
      return ambPrivacitat
        ? t('section.xat.ajustos.privacitat.nota', '«Privacitat» obri el teu perfil: hi trobaràs l’apartat «Privacitat i dades».')
        : t('section.xat.ajustos.privacitat.notaSense', '«Privacitat» obri el teu perfil, però el servidor d’este poble encara no hi ofereix l’apartat «Privacitat i dades».');
    }
    return textDe(grup.nota, t);
  };

  const etiquetaTanca = t('section.xat.ajustos.tanca', 'Tanca els ajustos');
  const etiquetaTorna = pare ? t('section.xat.ajustos.torna', 'Torna a {pagina}').replace('{pagina}', textDe(pare.titol, t)) : '';
  const resultats = aLArrel ? cercaAjustos(terme, { t, ambSessio }) : null;

  let cos;
  if (resultats) cos = <ResultatsAjustos resultats={resultats} terme={terme} t={t} onObri={obriResultat} />;
  else if (pagina.especial === 'preferits') cos = <PaginaPreferits preferits={preferits} t={t} onObri={onObriConversa} />;
  else if (pagina.construccio) cos = <PaginaEnConstruccio construccio={pagina.construccio} t={t} />;
  else {
    cos = (
      <>
        {pagina.perfil ? (
          <div className="sdp-xat-ajustos__grup">
            <button
              type="button"
              className="sdp-xat-ajustos__perfil"
              data-sdp-fila="perfil"
              aria-label={`${joNom || t('section.xat.rail.tu', 'Tu')}, ${t('section.xat.ajustos.elMeuPerfil', 'El meu perfil')}`}
              onClick={() => onVes(RUTES_AJUSTOS.perfil)}
            >
              <AvatarResolt nom={joNom || t('section.xat.rail.tu', 'Tu')} src={joAvatar} mida="lg" llavor={joId} alt="" />
              <span className="sdp-xat-ajustos__perfil-nom">{joNom || t('section.xat.rail.tu', 'Tu')}</span>
            </button>
          </div>
        ) : null}
        {(pagina.grups || CAP).map((grup) => {
          if (grup.nomesAmbSessio && !ambSessio) return null;
          if (grup.nomesAmbSessio && FilaEixida) {
            const fila = grup.files[0];
            return (
              <div key={grup.id} className="sdp-xat-ajustos__grup">
                <FilaEixida fila={fila} etiqueta={etiquetaDeFila(fila, t)} />
              </div>
            );
          }
          if (grup.nomesAmbSessio) return null;
          return (
            <GrupAjustos key={grup.id} grup={grup} t={t} triada={triada(grup)} valorDe={valorDe} nota={notaDe(grup)} onPrem={prem} />
          );
        })}
      </>
    );
  }

  const etiquetaCerca = t('section.xat.ajustos.cerca', 'Cerca als ajustos');

  return (
    <div className="sdp-xat-ajustos__marc" ref={marcRef}>
      <header className="sdp-xat-ajustos__cap">
        <button
          ref={capRef}
          type="button"
          className="sdp-xat-ajustos__cercle"
          aria-label={aLArrel ? etiquetaTanca : etiquetaTorna}
          title={aLArrel ? etiquetaTanca : etiquetaTorna}
          onClick={aLArrel ? onTanca : torna}
        >
          {aLArrel
            ? <X size={22} aria-hidden="true" focusable="false" />
            : <ChevronLeft size={24} aria-hidden="true" focusable="false" />}
        </button>
        <h2 className="sdp-xat-ajustos__titol">{titol}</h2>
        <span className="sdp-xat-ajustos__dreta" aria-hidden="true" />
      </header>

      {aLArrel && pagina.cercador ? (
        <div className="sdp-xat-ajustos__cerca">
          <div className="sdp-xat-cerca__camp">
            <label className="sdp-xat-cerca__etiqueta">
              <span className="sdp-nomes-lector">{etiquetaCerca}</span>
              <Search size={20} aria-hidden="true" focusable="false" />
              <input
                ref={camp}
                type="search"
                name="xatAjustosCerca"
                autoComplete="off"
                data-sdp-focus-inicial
                value={terme}
                placeholder={etiquetaCerca}
                onChange={(e) => setTerme(e.target.value)}
                onKeyDown={(e) => {
                  /* Amb text, Escape esborra; buit, el deixa passar i tanca el full. */
                  if (e.key === 'Escape' && terme) { e.preventDefault(); e.stopPropagation(); setTerme(''); }
                }}
              />
            </label>
            {terme ? (
              <button
                type="button"
                className="sdp-xat-icona"
                aria-label={t('section.xat.nou.esborra', 'Esborra la cerca')}
                onClick={() => { setTerme(''); camp.current?.focus(); }}
              >
                <CircleX size={20} aria-hidden="true" focusable="false" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Una pàgina nova naix amb el scroll a dalt: la clau és la pàgina. */}
      <div key={actual.id} className="sdp-xat-ajustos__cos">
        {cos}
      </div>
    </div>
  );
}

/* Un grup: la capçalera de secció (fora de la targeta), les files en una
   targeta i la nota del peu (la calcula CosAjustos, notaDe). Una selecció
   única és un grup amb nom. */
function GrupAjustos({ grup, t, triada, valorDe, nota = '', onPrem }) {
  const idCap = useId();
  return (
    <div className="sdp-xat-ajustos__grup" role={grup.capcalera ? 'group' : undefined} aria-labelledby={grup.capcalera ? idCap : undefined}>
      {grup.capcalera ? <h3 id={idCap} className="sdp-xat-ajustos__seccio">{textDe(grup.capcalera, t)}</h3> : null}
      <ul className="sdp-xat-ajustos__targeta">
        {grup.files.map((fila) => (
          <li key={fila.id}>
            <FilaAjust fila={fila} etiqueta={etiquetaDeFila(fila, t)} valor={valorDe(fila.valor)}
              triada={fila.tipus === 'opcio' ? triada === fila.opcio : false} onPrem={() => onPrem(fila, grup)} />
          </li>
        ))}
      </ul>
      {nota ? <p className="sdp-xat-ajustos__nota">{nota}</p> : null}
    </div>
  );
}

/* Una fila: icona lineal (només a l'arrel, com a la referència), etiqueta, valor
   gris i, a la dreta, el xebró (navega) o el ✓ (l'opció triada). El
   separador és la vora de baix de la línia: comença a l'altura de
   l'etiqueta, no de la icona. */
function FilaAjust({ fila, etiqueta, valor = '', triada = false, onPrem }) {
  const Icona = fila.icona ? ICONES[fila.icona] : null;
  const navega = fila.tipus === 'pagina' || fila.tipus === 'ruta';
  const opcio = fila.tipus === 'opcio';
  return (
    <button
      type="button"
      className={`sdp-xat-ajustos__fila${fila.perill ? ' sdp-xat-ajustos__fila--perill' : ''}`}
      data-sdp-fila={fila.id}
      aria-pressed={opcio ? (triada ? 'true' : 'false') : undefined}
      onClick={onPrem}
    >
      {Icona ? (
        <span className="sdp-xat-ajustos__icona" aria-hidden="true">
          <Icona size={20} aria-hidden="true" focusable="false" />
        </span>
      ) : null}
      <span className="sdp-xat-ajustos__linia">
        <span className="sdp-xat-ajustos__etiqueta">{etiqueta}</span>
        {valor ? <span className="sdp-xat-ajustos__valor">{valor}</span> : null}
        {navega ? <ChevronRight className="sdp-xat-ajustos__xebro" size={20} aria-hidden="true" focusable="false" /> : null}
        {opcio && triada ? <Check className="sdp-xat-ajustos__marca" size={20} aria-hidden="true" focusable="false" /> : null}
      </span>
    </button>
  );
}

/* La cerca: una targeta amb les files trobades de tot l'arbre, amb la
   pàgina on viuen com a valor gris; sense res, l'estat buit de la referència
   (títol en negreta i una frase).
   Revisió adversarial 260930 (P3) · El terme és text de la persona: entra
   a la plantilla amb una funció de reemplaçament, perquè una cadena com a
   segon argument de replace interpreta $&, $', $` i $$ («zz$&» es mostrava
   «zz{terme}»). */
function ResultatsAjustos({ resultats, terme, t, onObri }) {
  if (!resultats.length) {
    const net = terme.trim();
    return (
      <div className="sdp-xat-ajustos__buit" role="status">
        <p className="sdp-xat-ajustos__buit-titol">{t('section.xat.ajustos.capResultat.titol', 'Cap resultat')}</p>
        <p className="sdp-xat-ajustos__buit-text">
          {t('section.xat.ajustos.capResultat.text', 'Cap ajust coincidix amb «{terme}».').replace('{terme}', () => net)}
        </p>
      </div>
    );
  }
  return (
    <div className="sdp-xat-ajustos__grup">
      <ul className="sdp-xat-ajustos__targeta">
        {resultats.map((resultat) => {
          const on = resultat.pagina === ARREL_AJUSTOS ? '' : textDe(paginaAjustos(resultat.pagina)?.titol, t);
          const fila = { ...resultat.fila, tipus: resultat.fila.tipus === 'ruta' ? 'ruta' : 'pagina', perill: false };
          return (
            <li key={`${resultat.pagina}:${resultat.fila.id}`}>
              <FilaAjust fila={fila} etiqueta={etiquetaDeFila(resultat.fila, t)} valor={on} onPrem={() => onObri(resultat)} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* Preferits (captura 20.50.36): les converses marcades com a preferides,
   amb l'avatar i el nom; prémer-ne una l'obri. Afegir-ne o reordenar-ne no
   té cap funció al Xat encara: no es pinta. Sense cap, l'estat buit.
   Gauntlet 261022_0225 (XAT-3) · Sóc de Poble hi porta el seu logo oficial,
   com a la llista (caraDeSocDePoble.js). */
function PaginaPreferits({ preferits, t, onObri }) {
  if (!preferits.length) {
    return (
      <div className="sdp-xat-ajustos__buit" role="status">
        <p className="sdp-xat-ajustos__buit-titol">{t('section.xat.ajustos.preferits.buit.titol', 'Cap preferit')}</p>
        <p className="sdp-xat-ajustos__buit-text">
          {t('section.xat.ajustos.preferits.buit.text', 'Quan tingues converses preferides, les trobaràs ací i al filtre «Preferits» de la llista de converses.')}
        </p>
      </div>
    );
  }
  return (
    <div className="sdp-xat-ajustos__grup">
      <ul className="sdp-xat-ajustos__targeta">
        {preferits.map((fil) => {
          const nom = fil.name || fil.title || t('section.xat.conversaSenseNom', 'Conversa');
          return (
            <li key={fil.id}>
              <button type="button" className="sdp-xat-ajustos__fila sdp-xat-ajustos__fila--conversa" data-sdp-fila={`conversa-${fil.id}`} onClick={() => onObri(fil.id)}>
                <CaraXat nom={nom} src={caraDeComunitat(fil)} mida="sm" llavor={fil.id} alt="" />
                <span className="sdp-xat-ajustos__linia">
                  <span className="sdp-xat-ajustos__etiqueta">{nom}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="sdp-xat-ajustos__nota">
        {t('section.xat.ajustos.preferits.nota', 'També les trobaràs al filtre «Preferits» de la llista de converses.')}
      </p>
    </div>
  );
}

/* Una pàgina sense dades: el títol en negreta i les frases grises, centrats
   (com «No hay reportes», captura 21.05.44). Destacats diu el MATEIX que la
   seua vista del rail (textosDeVista); l'avís és el genèric del xat. */
function PaginaEnConstruccio({ construccio, t }) {
  const idTitol = useId();
  const textos = construccio.vista ? textosDeVista(construccio.vista, t) : null;
  const descripcio = textos ? textos.descripcio : textDe(construccio.descripcio, t);
  const avis = (textos && textos.avis) || t(...TEXTOS_CONSTRUCCIO.avis);
  return (
    <section className="sdp-xat-ajustos__buit" aria-labelledby={idTitol}>
      <h3 id={idTitol} className="sdp-xat-ajustos__buit-titol">{t(...TEXTOS_CONSTRUCCIO.titol)}</h3>
      {descripcio ? <p className="sdp-xat-ajustos__buit-text">{descripcio}</p> : null}
      <p className="sdp-xat-ajustos__buit-text">{avis}</p>
    </section>
  );
}
