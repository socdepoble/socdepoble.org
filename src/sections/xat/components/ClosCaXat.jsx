/**
 * ClosCaXat.jsx — la closca compartida del Xat i del Control del xat
 * (IDEA-327 v2 · Onada R32.46): un AppGridShell amb el rail esquerre simplificat,
 * sense fila superior «⚙️ Menú» ni icones separades `[|>]` / `[<|]`.
 *
 *   · Capçalera clicable unificada (`BotoTitolSeccioXat`): `[Icona + Nom de la secció activa + ▸]`
 *     (`💬 Xats ▸`, `👥 Comunitats ▸`, `📞 Telefonades ▸`, `🖼️ Contingut multimèdia ▸`),
 *     que desplega el menú lateral cap a la dreta i el torna a plegar (`◂` obert).
 *   · Fila explícita «⚙️ Ajustos del xat» en les 5 llengües dins del menú lateral,
 *     que obri `FullAjustos`.
 *   · Peu esquerre amb l'avatar i nom de la identitat activa (`Javi`, `Sóc de Poble`,
 *     `El Rentonar`) que obri directament el selector global `CalaixIdentitats`
 *     («Amb qui actues?») canviant la identitat en tot el sistema.
 *     (v1.2.23 · X2 (ordre del Mestre 261123) · `ClosCaXat` només passa
 *     `onIdentitats` amb una identitat activa (amb SessionProvider, quan hi
 *     ha sessió); sense, `RailXat` conserva el peu «Tu: ajustos» → FullAjustos.
 *     `EspecimenXatRail` fa el mateix: li'l passa amb la sessió de la mostra i
 *     ensenya els dos peus.)
 * v1.2.23 · L5-02 (Gauntlet R1) · El calaix parla la llengua del peu: títol,
 * descripció, llista, «Activa» i rols (textosCalaixIdentitats.js i rols.js).
 * v1.2.23 · L5-01 (Gauntlet R1) · Triar una altra identitat remunta el Xat
 * (XatSection.jsx: XatWorkspace porta la clau `ambitEstable`, amb l'actor):
 * el rail nou torna el focus al seu peu (`retornIdentitatPendent`).
 *
 * v1.2.23 · IDEA-327 v2 (ordre del Mestre 261123) · T47 C01: l'«Eixir» del
 * calaix del xat pregunta abans (`preparaEixida`), com la barra negra
 * (useIdentitatDeLaBarra.js) i «Tanca la sessió» de FullAjustos (EixidaSegura.jsx).
 * Si queden canvis que el servidor encara no té, l'avís d'EixidaSegura ho diu
 * dins del calaix; si el logout falla, l'error, i no es navega.
 * v1.2.23 · IDEA-323 / IDEA-327 v2 (ordre del Mestre 261123) · Sense sessió no hi
 * ha identitat activa: el peu del Foraster és el de la v1.2.22 («Tu: ajustos» →
 * FullAjustos) i no promet cap selector que no s'obri.
 */
import { useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown, CircleDashed, Image as ImageIcon, MessageCircle, Pencil, Phone, Settings, Star, Users
} from 'lucide-react';
import AppGridShell, { useAppGrid } from '../../../components/layout/AppGridShell.jsx';
import CalaixIdentitats, { ETIQUETA_EIXIR_CALAIX, ETIQUETA_IDIOMA_CALAIX } from '../../../components/universal/identitat/CalaixIdentitats.jsx';
import { codiDeLlengua } from '../../../components/universal/identitat/codiDeLlengua.js';
import { rolDeLaIdentitat as rolDelCalaix, textosCalaixIdentitats } from '../../../components/universal/identitat/textosCalaixIdentitats.js';
/* v1.2.23 · IDEA-327 v2 (ordre del Mestre 261123) · Pes 0: FullAjustos.jsx ja
   importa EixidaSegura.jsx estàticament dins d'este mateix tros diferit del xat. */
import { AvisEixidaDelCalaix, ErrorEixidaDelCalaix } from '../../../components/universal/EixidaSegura.jsx';
import CaraXat from './CaraXat.jsx';
import { useLocation, useNavigate } from '../../../app/contexts/RouterContext';
import { useIdentitatOpcional } from '../../../app/contexts/IdentitatContext.jsx';
import { useSessioOpcional } from '../../../app/contexts/SessionContext';
import { useUIActions } from '../../../app/contexts/UIContext';
import { getVal, setVal } from '../../../config/storage.js';
import { columnaPlegadaDe, desaColumnaPlegada } from '../../../components/universal/workspace/persistenciaColumnesUI.js';
import { useXat } from '../XatContext';
import { useCaraDelPoble } from '../usePobleAmfitrio.js';
import { comunitatsAmbCaraDelPoble } from '../pobleAmfitrio.js';
import { caraDeComunitat } from '../caraDeSocDePoble.js';
import FullAjustos from './FullAjustos.jsx';
import { ClosCaXatContext } from './objectesDeContext.js';

export const CLAU_RAIL = 'sdp-xat-rail';

/** La clau de preferència de cada secció plegable del rail («mes», «comunitats»). */
export const clauSeccio = (id) => `${CLAU_RAIL}-${id}`;

/** El perfil propi: el llapis del peu del rail hi porta. */
export const RUTA_PERFIL = '/el-meu-perfil';

const CAP = Object.freeze([]);

/* v1.2.23 · costura objectes de context (ordre del Mestre 261123) · El context
   de la closca viu a ./objectesDeContext.js: este mòdul és ascendent de l'App
   i exporta constants, i cap createContext no hi pot viure
   (src/app/contexts/objectesDeContext.test.jsx). Mateix objecte, mateix ús. */

/* Controls que poden rebre el focus en obrir el rail. */
const ENFOCABLES = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const VIDA_RETORN = 1000;
let retornPendent = 0;
function marcaRetornFocus() {
  retornPendent = Date.now();
}
function recullRetornFocus() {
  const viu = retornPendent > 0 && Date.now() - retornPendent < VIDA_RETORN;
  retornPendent = 0;
  return viu;
}

/* v1.2.23 · L5-01 (Gauntlet R1) · Triar una altra identitat al calaix canvia
   l'actor i XatSection remunta el Xat sencer (la clau `ambitEstable` porta
   l'actor): el botó del peu que havia obert el calaix desapareix amb la closca
   vella i el focus queia a <body>. La closca que tria ho marca ací, i el rail
   que es munta tot seguit (RailXat) torna el focus al seu peu. Si no hi ha
   remunt (la identitat que ja era activa), torna el focus la closca de sempre
   (retornaFocusAlDisparador).
   v1.2.23 · L5-01 (Gauntlet R1) · I en eixe cas la mateixa microtasca esborra
   la marca (oblidaRetornIdentitat): un altre rail que es munte abans d'1 s
   (VIDA_RETORN) no l'hereta. Amb remunt, el rail nou ja l'ha recollida abans:
   setActor és una actualització síncrona i React la buida abans d'esta
   microtasca. */
let retornIdentitatPendent = 0;
function marcaRetornIdentitat() {
  retornIdentitatPendent = Date.now();
}
function oblidaRetornIdentitat() {
  retornIdentitatPendent = 0;
}
function recullRetornIdentitat() {
  const viu = retornIdentitatPendent > 0 && Date.now() - retornIdentitatPendent < VIDA_RETORN;
  retornIdentitatPendent = 0;
  return viu;
}

export const ENTRADES_RAIL = Object.freeze([
  { id: 'xats', accio: 'converses', Icona: MessageCircle, clau: 'section.xat.rail.xats', text: 'Xats' },
  { id: 'novetats', accio: 'control', Icona: CircleDashed, clau: 'section.xat.rail.novetats', text: 'Novetats', amagada: true },
  { id: 'comunitats', accio: 'vista', Icona: Users, clau: 'section.xat.rail.comunitats', text: 'Comunitats' },
  { id: 'telefonades', accio: 'vista', Icona: Phone, clau: 'section.xat.rail.telefonades', text: 'Telefonades' },
  { id: 'multimedia', accio: 'vista', Icona: ImageIcon, clau: 'section.xat.rail.multimedia', text: 'Contingut multimèdia' },
  { id: 'destacats', accio: 'vista', Icona: Star, clau: 'section.xat.rail.destacats', text: 'Destacats', seccio: 'mes' }
]);

/** Les vistes de la columna central que obri el rail (?vista=<id>). */
export const VISTES_XAT = Object.freeze(ENTRADES_RAIL.filter((e) => e.accio === 'vista').map((e) => e.id));

/** L'entrada del rail d'una vista (títol i icona de la seua fila de títol). */
export const entradaDeVista = (id) => ENTRADES_RAIL.find((e) => e.accio === 'vista' && e.id === id) || null;

/** La ruta d'una vista de la columna central. */
export const rutaDeVista = (id) => `/xat?vista=${encodeURIComponent(String(id))}`;

const PRINCIPALS = ENTRADES_RAIL.filter((e) => !e.seccio && !e.amagada);
const DE_MES = ENTRADES_RAIL.filter((e) => e.seccio === 'mes' && !e.amagada);

function railPlegatInicial() {
  const unificat = columnaPlegadaDe('xat', 'left');
  if (typeof unificat === 'boolean') return unificat;
  return getVal(CLAU_RAIL, 'plegat') !== 'obert';
}

function seccionsInicials() {
  return {
    mes: getVal(clauSeccio('mes'), 'obert') !== 'plegat',
    comunitats: getVal(clauSeccio('comunitats'), 'obert') !== 'plegat'
  };
}

/* v1.2.23 · L5-05 (Gauntlet R1) · La llengua de l'avís d'eixida i del calaix
   és la del text que es pinta: codiDeLlengua, el mateix mòdul que la barra
   negra (useIdentitatDeLaBarra.js), en lloc d'una còpia. */

function retornaFocusAlDisparador(origenRef) {
  const origen = origenRef.current;
  if (!origen) return;
  /* v1.2.23 · L5-01 (Gauntlet R1) · Un disparador desconnectat és d'una closca
     que ja no hi és (remunt en canviar d'identitat): la seua arrel és el
     subarbre despenjat, no el document, i res d'ell no es pot enfocar. Ho fa
     el rail nou (recullRetornIdentitat). */
  if (!origen.isConnected) return;
  const arrel = origen.getRootNode();
  const actiu = arrel.activeElement;
  const perdut = !actiu || actiu === document.body || actiu.isConnected === false || Boolean(actiu.closest?.('[inert]'));
  if (!perdut) return;
  if (origen.isConnected && !origen.closest('[inert]')) { origen.focus(); return; }
  origen.closest('.app-grid-shell')?.querySelector('.sdp-xat-obri-rail')?.focus();
}

export default function ClosCaXat({
  activa = 'converses',
  comunitatActiva = null,
  middleTitle,
  middleIcon = null,
  middleColumn,
  rightColumn
}) {
  const { t } = useUIActions();
  const navigate = useNavigate();
  const sessio = useSessioOpcional();
  const identitatCtx = useIdentitatOpcional();
  const {
    comunitats: comunitatsDelXat = CAP, joId = null, joNom = null, joAvatar = null, entitatActiva = null
  } = useXat();
  const { poble, cara } = useCaraDelPoble();
  const comunitats = useMemo(
    () => comunitatsAmbCaraDelPoble(comunitatsDelXat, poble, cara),
    [comunitatsDelXat, poble, cara]
  );
  const [plegat, setPlegat] = useState(railPlegatInicial);

  const alterna = useCallback(() => {
    setPlegat((previ) => {
      const seguent = !previ;
      setVal(CLAU_RAIL, seguent ? 'plegat' : 'obert');
      desaColumnaPlegada('xat', 'left', seguent);
      return seguent;
    });
  }, []);

  const [ajustosObert, setAjustosObert] = useState(false);
  const origenAjustos = useRef(null);
  const obriAjustos = useCallback((origen) => {
    origenAjustos.current = origen || null;
    setAjustosObert(true);
  }, []);
  const tancaAjustos = useCallback(() => setAjustosObert(false), []);
  const retornaFocusAjustos = useCallback(() => retornaFocusAlDisparador(origenAjustos), []);

  const [identitatsObert, setIdentitatsObert] = useState(false);
  const [eixint, setEixint] = useState(false);
  /* v1.2.23 · IDEA-327 v2 (ordre del Mestre 261123) · T47 C01 · Els canvis que
     queden sense desar (l'avís, dins del calaix) i si el logout ha fallat. */
  const [pendentsEixida, setPendentsEixida] = useState(null);
  const [errorEixida, setErrorEixida] = useState(false);
  /* El botó «Eixir de Sóc de Poble» que ha obert l'avís: «No eixir encara» hi torna el focus. */
  const obridorEixida = useRef(null);
  const llengua = codiDeLlengua(t);
  const origenIdentitats = useRef(null);
  /* v1.2.23 · L5-02 (Gauntlet R1) · El calaix en la llengua del peu. Els rols,
     amb les claus de sempre del Perfil (rols.js · PARELLS_ROL): en valencià,
     les mateixes etiquetes que CalaixIdentitats pinta sense traductor. */
  const textosCalaix = textosCalaixIdentitats(llengua);
  const rolDeLaIdentitat = useCallback((identitat) => rolDelCalaix(t, identitat), [t]);

  const identitatsCalaix = useMemo(() => {
    if (Array.isArray(identitatCtx?.identitats) && identitatCtx.identitats.length > 0) {
      return identitatCtx.identitats;
    }
    const base = [];
    if (joId || joNom) {
      base.push({
        tipus: 'persona',
        id: joId || 'persona-local',
        nom: joNom || t('section.xat.rail.tu', 'Tu'),
        avatar: joAvatar || null,
        rol: 'persona',
        activa: !entitatActiva
      });
    }
    if (entitatActiva?.id) {
      base.push({
        tipus: 'entitat',
        id: entitatActiva.id,
        nom: entitatActiva.nom,
        avatar: entitatActiva.avatar || null,
        rol: entitatActiva.rol || 'admin',
        activa: true
      });
    }
    return base;
  }, [identitatCtx?.identitats, joId, joNom, joAvatar, entitatActiva, t]);

  /* v1.2.23 · IDEA-323 / IDEA-327 v2 (ordre del Mestre 261123) · El peu és el
     selector d'identitat només quan n'hi ha una d'activa. Amb SessionProvider
     (l'App sempre en porta), quan hi ha una persona dins; sense proveïdor (un
     muntatge aïllat), quan el xat ja en porta una. El Foraster (remot sense
     sessió) i el convidat de la llavor tenen el peu de la v1.2.22. */
  const ambIdentitat = sessio ? Boolean(sessio.currentUser) : identitatsCalaix.length > 0;

  /* v1.2.23 · L5-05 (Gauntlet R1) · Com la barra negra (useIdentitatDeLaBarra.js):
     si la identitat activa se'n va amb el calaix obert, es tanca i s'oblida
     l'eixida a mig fer. */
  useEffect(() => {
    if (ambIdentitat) return;
    setIdentitatsObert(false);
    setPendentsEixida(null);
    setErrorEixida(false);
    setEixint(false);
  }, [ambIdentitat]);

  const oblidaEixida = useCallback(() => {
    setPendentsEixida(null);
    setErrorEixida(false);
  }, []);

  const obriIdentitats = useCallback((origen) => {
    origenIdentitats.current = origen || null;
    oblidaEixida();
    setIdentitatsObert(true);
  }, [oblidaEixida]);

  const tancaIdentitats = useCallback(() => {
    setIdentitatsObert(false);
    oblidaEixida();
    queueMicrotask(() => retornaFocusAlDisparador(origenIdentitats));
  }, [oblidaEixida]);

  const triaIdentitat = useCallback((tipus, id) => {
    marcaRetornIdentitat();
    identitatCtx?.setActor?.(tipus, id);
    setIdentitatsObert(false);
    oblidaEixida();
    queueMicrotask(() => {
      retornaFocusAlDisparador(origenIdentitats);
      oblidaRetornIdentitat();
    });
  }, [identitatCtx, oblidaEixida]);

  const vesIdioma = useCallback(() => {
    setIdentitatsObert(false);
    oblidaEixida();
    navigate('/traduccions');
  }, [navigate, oblidaEixida]);

  /* v1.2.23 · IDEA-327 v2 (ordre del Mestre 261123) · T47 C01 · Tanca la
     sessió (eixidaDeVeres: l'intent final i l'oblit de la cua). Si falla, ho
     diu dins del calaix i no navega. */
  const confirmaEixir = useCallback(async () => {
    setErrorEixida(false);
    setEixint(true);
    try {
      await sessio?.logout?.();
    } catch {
      setEixint(false);
      setErrorEixida(true);
      return;
    }
    setPendentsEixida(null);
    setEixint(false);
    setIdentitatsObert(false);
    navigate('/registre', { replace: true });
  }, [sessio, navigate]);

  /* v1.2.23 · IDEA-327 v2 (ordre del Mestre 261123) · T47 C01 · Abans d'eixir,
     preparaEixida: si queda res que el servidor encara no té, l'avís i cap
     logout; «Eixir igualment» és l'única porta a confirmaEixir. */
  const demanaEixir = useCallback(async (event) => {
    const boto = event?.currentTarget;
    obridorEixida.current = typeof boto?.focus === 'function' ? boto : null;
    if (eixint) return;
    setErrorEixida(false);
    setEixint(true);
    let queden = [];
    if (typeof sessio?.preparaEixida === 'function') {
      try { queden = await sessio.preparaEixida(); } catch { queden = []; }
    }
    if (Array.isArray(queden) && queden.length) {
      setEixint(false);
      setPendentsEixida(queden);
      return;
    }
    await confirmaEixir();
  }, [eixint, sessio, confirmaEixir]);

  /* «No eixir encara» desmunta l'avís amb el focus a dins: torna a «Eixir de Sóc de Poble». */
  const noEixirEncara = useCallback(() => {
    setPendentsEixida(null);
    const boto = obridorEixida.current;
    if (boto?.isConnected) boto.focus();
  }, []);

  const titolRail = t('section.xat.rail.menu', 'Menú');
  const valorContext = useMemo(() => ({
    railPlegat: plegat,
    alternaRail: alterna
  }), [plegat, alterna]);

  return (
    <ClosCaXatContext.Provider value={valorContext}>
      <AppGridShell
        aria-label={t('section.xat.closca', 'Espai del xat')}
        className="sdp-workspace sdp-xat"
        leftTitle={titolRail}
        middleTitle={middleTitle}
        leftIcon={Settings}
        middleIcon={middleIcon}
        leftCollapsed={plegat}
        leftColumn={(
          <RailXat
            activa={activa}
            comunitatActiva={comunitatActiva}
            plegat={plegat}
            titol={titolRail}
            t={t}
            comunitats={comunitats}
            joId={joId}
            joNom={joNom}
            joAvatar={joAvatar}
            entitatActiva={entitatActiva}
            onAjustos={obriAjustos}
            onIdentitats={ambIdentitat ? obriIdentitats : null}
          />
        )}
        middleColumn={middleColumn}
        rightColumn={rightColumn}
      >
        <FullAjustos obert={ajustosObert} onTanca={tancaAjustos} onRetornFocus={retornaFocusAjustos} />
        <CalaixIdentitats
          obert={identitatsObert}
          onTanca={tancaIdentitats}
          identitats={identitatsCalaix}
          onTria={triaIdentitat}
          onIdioma={vesIdioma}
          onEixir={demanaEixir}
          eixint={eixint}
          avisEixida={pendentsEixida ? (
            <AvisEixidaDelCalaix
              pendents={pendentsEixida}
              llengua={llengua}
              eixint={eixint}
              onNoEixir={noEixirEncara}
              onEixir={confirmaEixir}
            />
          ) : null}
          errorEixida={errorEixida ? <ErrorEixidaDelCalaix llengua={llengua} /> : null}
          etiquetaIdioma={t('topbar.identitat.idioma', ETIQUETA_IDIOMA_CALAIX)}
          etiquetaEixir={t('topbar.identitat.eixir', ETIQUETA_EIXIR_CALAIX)}
          etiquetaTitol={textosCalaix.titol}
          etiquetaDescripcio={textosCalaix.descripcio}
          etiquetaLlista={textosCalaix.llista}
          etiquetaActiva={textosCalaix.activa}
          etiquetaRol={rolDeLaIdentitat}
        />
      </AppGridShell>
    </ClosCaXatContext.Provider>
  );
}

/* ─────────────────────────────── El rail ─────────────────────────────── */

export function RailXat({
  activa = 'converses', comunitatActiva = null, plegat = false, titol, t,
  comunitats = CAP, joId = null, joNom = null, joAvatar = null, entitatActiva = null,
  onVes = null, recordaSeccions = true, onAjustos = null, onIdentitats = null
}) {
  const { mida, setPanellObert } = useAppGrid();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const ves = onVes || navigate;
  const ample = mida === 'ample';
  const controlObert = activa === 'control';
  const etiquetaPerfil = t('section.xat.rail.editaPerfil', 'Edita el perfil');
  const etiquetaMes = t('section.xat.rail.mes', 'Més');
  const etiquetaComunitats = t('section.xat.rail.comunitats', 'Comunitats');
  const etiquetaAjustosDelXat = t('section.xat.rail.ajustosDelXat', 'Ajustos del xat');
  const nomJo = joNom || t('section.xat.rail.tu', 'Tu');
  const nomIdentitatActiva = entitatActiva?.nom || nomJo;
  const llistaComunitats = Array.isArray(comunitats) ? comunitats : CAP;
  const conteMes = DE_MES.some((e) => e.id === activa);
  const conteComunitat = activa === 'comunitat' && comunitatActiva != null
    && llistaComunitats.some((c) => String(c.fil.id) === String(comunitatActiva));
  const [seccions, setSeccions] = useState(() => {
    const inicials = recordaSeccions ? seccionsInicials() : { mes: true, comunitats: true };
    return { mes: inicials.mes || conteMes, comunitats: inicials.comunitats || conteComunitat };
  });

  const obriPer = conteMes ? 'mes' : (conteComunitat ? `comunitats:${comunitatActiva}` : '');
  useEffect(() => {
    if (!obriPer) return;
    const id = obriPer === 'mes' ? 'mes' : 'comunitats';
    setSeccions((previ) => (previ[id] ? previ : { ...previ, [id]: true }));
  }, [obriPer]);

  const tancaRail = useCallback(() => {
    setPanellObert?.(mida === 'estret' ? 'middle' : null);
  }, [mida, setPanellObert]);

  /* v1.2.23 · L5-01 (Gauntlet R1) · El rail d'una closca nova després de triar
     identitat (recullRetornIdentitat, dalt): si el focus s'ha perdut, al botó
     del peu; si el peu és dins del rail tancat (fora d'ample), al botó que obri
     el rail, com retornaFocusAlDisparador. Només en muntar. */
  const refRail = useRef(null);
  useLayoutEffect(() => {
    if (!recullRetornIdentitat()) return;
    const rail = refRail.current;
    if (!rail) return;
    const actiu = rail.getRootNode().activeElement;
    if (actiu && actiu !== document.body && actiu.isConnected && !actiu.closest?.('[inert]')) return;
    const peu = rail.querySelector('.sdp-xat-rail-peu .sdp-xat-ajustos-entrada, .sdp-xat-rail-peu .sdp-workspace-rail__boto');
    if (peu && !peu.closest('[inert]')) { peu.focus(); return; }
    rail.closest('.app-grid-shell')?.querySelector('.sdp-xat-obri-rail')?.focus();
  }, []);

  const alTeclatRail = (event) => {
    if (!ample && event.key === 'Escape' && !event.defaultPrevented) {
      event.preventDefault();
      marcaRetornFocus();
      tancaRail();
    }
  };

  const alternaSeccio = (id) => {
    const obert = !seccions[id];
    if (recordaSeccions) setVal(clauSeccio(id), obert ? 'obert' : 'plegat');
    setSeccions((previ) => ({ ...previ, [id]: obert }));
  };

  const aLaLlista = pathname === '/xat';
  const tria = (fn, { retorn = true } = {}) => () => {
    if (!ample) {
      if (retorn) marcaRetornFocus();
      tancaRail();
    }
    fn();
  };
  const vesAConverses = () => { if (!aLaLlista || activa !== 'converses') ves('/xat'); };
  const vesAControl = () => ves(controlObert ? '/xat' : '/control-xat');
  const vesAVista = (id) => { if (!aLaLlista || activa !== id) ves(rutaDeVista(id)); };
  const obertaEs = (id) => activa === 'comunitat' && comunitatActiva != null && String(comunitatActiva) === String(id);
  const vesAComunitat = (id) => { if (!aLaLlista || !obertaEs(id)) ves(`/xat?comunitat=${encodeURIComponent(String(id))}`); };
  const vesAlPerfil = () => ves(RUTA_PERFIL);

  const etiquetaAjustos = entitatActiva?.nom
    ? t('section.xat.ajustos.obriComEntitat', 'Tu: ajustos (actues com a {nom})').replace('{nom}', entitatActiva.nom)
    : t('section.xat.ajustos.obri', 'Tu: ajustos');
  const etiquetaIdentitat = t('section.xat.rail.ambQuiActues', '{nom}: Amb qui actues?').replace('{nom}', nomIdentitatActiva);

  const obriAjustos = (e) => {
    const boto = e.currentTarget;
    tria(() => onAjustos(boto), { retorn: false })();
  };

  const obriSelectorIdentitat = (e) => {
    const boto = e.currentTarget;
    tria(() => onIdentitats(boto), { retorn: false })();
  };

  const accio = (entrada) => {
    if (entrada.accio === 'converses') return tria(vesAConverses);
    if (entrada.accio === 'control') return tria(vesAControl);
    return tria(() => vesAVista(entrada.id));
  };

  const estat = (entrada) => {
    if (entrada.accio === 'control') {
      return { 'aria-pressed': controlObert ? 'true' : 'false', 'aria-current': controlObert ? 'page' : undefined };
    }
    const id = entrada.accio === 'converses' ? 'converses' : entrada.id;
    return { 'aria-current': activa === id ? 'page' : undefined };
  };

  const nomDe = (comunitat) => comunitat.fil?.name || comunitat.fil?.title || t('section.xat.conversaSenseNom', 'Conversa');
  const avatarDe = (comunitat) => (
    <CaraXat nom={nomDe(comunitat)} src={caraDeComunitat(comunitat.fil)} mida="xs" llavor={comunitat.fil?.id} alt="" className="sdp-xat-avatar--quadrat" />
  );
  const avatarPropi = entitatActiva
    ? <CaraXat nom={entitatActiva.nom || nomJo} src={entitatActiva.avatar} mida="xs" llavor={entitatActiva.id} alt="" className="sdp-xat-avatar--quadrat" />
    : <CaraXat nom={nomJo} src={joAvatar} mida="xs" llavor={joId} alt="" />;

  if (ample && plegat) {
    const botoPlegat = (entrada) => {
      const etiqueta = t(entrada.clau, entrada.text);
      return (
        <li key={entrada.id}>
          <button type="button" className="sdp-workspace-rail__boto" aria-label={etiqueta} title={etiqueta} {...estat(entrada)} onClick={accio(entrada)}>
            <entrada.Icona size={24} aria-hidden="true" focusable="false" />
          </button>
        </li>
      );
    };
    return (
      <aside ref={refRail} className="sdp-workspace-column" aria-label={titol}>
        <div className="app-grid-col-header app-grid-col-header--collapsed app-grid-col-header--dark">
          <nav className="sdp-workspace-rail" aria-label={titol}>
            <ul className="sdp-workspace-rail__grup">{PRINCIPALS.map(botoPlegat)}</ul>
            <ul className="sdp-workspace-rail__grup" aria-label={etiquetaMes}>{DE_MES.map(botoPlegat)}</ul>
            {llistaComunitats.length ? (
              <ul className="sdp-workspace-rail__grup" aria-label={etiquetaComunitats}>
                {llistaComunitats.map((comunitat) => {
                  const nom = nomDe(comunitat);
                  return (
                    <li key={comunitat.fil.id}>
                      <button
                        type="button"
                        className="sdp-workspace-rail__boto"
                        aria-label={nom}
                        title={nom}
                        aria-current={obertaEs(comunitat.fil.id) ? 'page' : undefined}
                        onClick={tria(() => vesAComunitat(comunitat.fil.id))}
                      >
                        {avatarDe(comunitat)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {onAjustos ? (
              <ul className="sdp-workspace-rail__grup">
                <li>
                  <button
                    type="button"
                    className="sdp-workspace-rail__boto"
                    aria-label={etiquetaAjustosDelXat}
                    title={etiquetaAjustosDelXat}
                    aria-haspopup="dialog"
                    onClick={obriAjustos}
                  >
                    <Settings size={24} aria-hidden="true" focusable="false" />
                  </button>
                </li>
              </ul>
            ) : null}
          </nav>
          <div className="sdp-xat-rail-peu sdp-xat-rail-peu--plegat">
            {onIdentitats ? (
              <button type="button" className="sdp-workspace-rail__boto" aria-label={etiquetaIdentitat} title={etiquetaIdentitat} aria-haspopup="dialog" onClick={obriSelectorIdentitat}>
                {avatarPropi}
              </button>
            ) : onAjustos ? (
              <button type="button" className="sdp-workspace-rail__boto" aria-label={etiquetaAjustos} title={etiquetaAjustos} aria-haspopup="dialog" onClick={obriAjustos}>
                {avatarPropi}
              </button>
            ) : (
              <button type="button" className="sdp-workspace-rail__boto" aria-label={etiquetaPerfil} title={etiquetaPerfil} onClick={tria(vesAlPerfil, { retorn: false })}>
                {avatarPropi}
              </button>
            )}
          </div>
        </div>
      </aside>
    );
  }

  const filaDesplegada = (entrada) => {
    const etiqueta = t(entrada.clau, entrada.text);
    return (
      <li key={entrada.id}>
        <button type="button" className="sdp-workspace-nav-item" {...estat(entrada)} onClick={accio(entrada)}>
          <span className="sdp-workspace-nav-item__icon" aria-hidden="true">
            <entrada.Icona size={24} aria-hidden="true" focusable="false" />
          </span>
          <span className="sdp-workspace-nav-item__label">{etiqueta}</span>
        </button>
      </li>
    );
  };

  const teBotoPeu = Boolean(onIdentitats || onAjustos);

  return (
    <aside ref={refRail} className="sdp-workspace-column" aria-label={titol} onKeyDown={alTeclatRail}>
      <nav className="sdp-workspace-column__body" aria-label={titol}>
        <ul className="sdp-xat-rail-llista">{PRINCIPALS.map(filaDesplegada)}</ul>
        <SeccioRail etiqueta={etiquetaMes} obert={seccions.mes} actual={conteMes} onAlterna={() => alternaSeccio('mes')} t={t}>
          <ul className="sdp-xat-rail-llista">{DE_MES.map(filaDesplegada)}</ul>
        </SeccioRail>
        {llistaComunitats.length ? (
          <SeccioRail etiqueta={etiquetaComunitats} obert={seccions.comunitats} actual={conteComunitat} onAlterna={() => alternaSeccio('comunitats')} t={t}>
            <ul className="sdp-xat-rail-llista">
              {llistaComunitats.map((comunitat) => (
                <li key={comunitat.fil.id}>
                  <button
                    type="button"
                    className="sdp-workspace-nav-item"
                    aria-current={obertaEs(comunitat.fil.id) ? 'page' : undefined}
                    onClick={tria(() => vesAComunitat(comunitat.fil.id))}
                  >
                    <span className="sdp-workspace-nav-item__icon" aria-hidden="true">{avatarDe(comunitat)}</span>
                    <span className="sdp-workspace-nav-item__label">{nomDe(comunitat)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </SeccioRail>
        ) : null}
        {onAjustos ? (
          <ul className="sdp-xat-rail-llista">
            <li>
              <button type="button" className="sdp-workspace-nav-item" aria-haspopup="dialog" onClick={obriAjustos}>
                <span className="sdp-workspace-nav-item__icon" aria-hidden="true">
                  <Settings size={24} aria-hidden="true" focusable="false" />
                </span>
                <span className="sdp-workspace-nav-item__label">{etiquetaAjustosDelXat}</span>
              </button>
            </li>
          </ul>
        ) : null}
      </nav>
      <div className={teBotoPeu ? 'sdp-xat-rail-peu sdp-xat-rail-peu--ajustos' : 'sdp-xat-rail-peu'}>
        {onIdentitats ? (
          <button type="button" className="sdp-xat-ajustos-entrada" aria-label={etiquetaIdentitat} title={etiquetaIdentitat} aria-haspopup="dialog" onClick={obriSelectorIdentitat}>
            {avatarPropi}
            <span className="sdp-xat-rail-peu__nom">{nomIdentitatActiva}</span>
          </button>
        ) : onAjustos ? (
          <button type="button" className="sdp-xat-ajustos-entrada" aria-label={etiquetaAjustos} title={etiquetaAjustos} aria-haspopup="dialog" onClick={obriAjustos}>
            {avatarPropi}
            <span className="sdp-xat-rail-peu__nom">{t('section.xat.rail.tu', 'Tu')}</span>
          </button>
        ) : (
          <>
            {avatarPropi}
            <span className="sdp-xat-rail-peu__nom">{t('section.xat.rail.tu', 'Tu')}</span>
          </>
        )}
        <button type="button" className="sdp-xat-icona" aria-label={etiquetaPerfil} title={etiquetaPerfil} onClick={tria(vesAlPerfil, { retorn: false })}>
          <Pencil size={24} aria-hidden="true" focusable="false" />
        </button>
      </div>
    </aside>
  );
}

function SeccioRail({ etiqueta, obert, actual = false, onAlterna, t, children }) {
  const idCos = useId();
  const marca = Boolean(actual) && !obert;
  const nom = marca
    ? t('section.xat.rail.seccioActual', 'Secció {nom}, amb la pàgina actual')
    : t('section.xat.rail.seccio', 'Secció {nom}');
  return (
    <div className="sdp-xat-rail-seccio">
      <button
        type="button"
        className={marca ? 'sdp-xat-rail-seccio__cap sdp-xat-rail-seccio__cap--actual' : 'sdp-xat-rail-seccio__cap'}
        aria-expanded={obert}
        aria-controls={idCos}
        aria-label={nom.replace('{nom}', etiqueta)}
        onClick={onAlterna}
      >
        <span className="sdp-xat-rail-seccio__nom">{etiqueta}</span>
        <span className="sdp-xat-rail-seccio__xebro-cella" aria-hidden="true">
          <ChevronDown className="sdp-xat-rail-seccio__xebro" size={24} aria-hidden="true" focusable="false" />
        </span>
      </button>
      <div id={idCos} hidden={!obert}>{children}</div>
    </div>
  );
}

/* ───────────── Capçalera clicable amb nom de secció i fletxa `▸` / `◂` ───────────── */

export function BotoTitolSeccioXat({ titol, etiqueta, icona: Icona = MessageCircle }) {
  const { mida, panellObert, setPanellObert } = useAppGrid();
  const closcaCtx = useContext(ClosCaXatContext);
  const ref = useRef(null);
  const enfocaRail = useRef(false);
  const panellPrevi = useRef(panellObert);

  useEffect(() => {
    const previ = panellPrevi.current;
    panellPrevi.current = panellObert;
    if (mida === 'ample') return;
    const closca = ref.current?.closest('.app-grid-shell');
    if (!closca) return;
    const rail = closca.querySelector('#app-grid-sidebar');
    if (panellObert === 'left') {
      if (previ !== 'left' && enfocaRail.current) {
        (rail?.querySelector('.sdp-xat-rail-llista button:not([disabled])') || rail?.querySelector(ENFOCABLES))?.focus();
      }
      enfocaRail.current = false;
      return;
    }
    if (mida !== 'mitja' && panellObert !== 'middle') return;
    const triat = recullRetornFocus();
    if (previ !== 'left' && !triat) return;
    const arrel = ref.current?.getRootNode?.() || document;
    const actiu = arrel.activeElement;
    const perdut = !actiu || actiu === document.body || actiu.isConnected === false
      || rail?.contains(actiu) || Boolean(actiu.closest?.('[inert]'));
    if (perdut) ref.current?.focus();
  }, [mida, panellObert]);

  if (mida === 'ample' && !closcaCtx) return null;

  const obert = mida === 'ample'
    ? !closcaCtx.railPlegat
    : panellObert === 'left';

  const alterna = () => {
    if (mida === 'ample') {
      closcaCtx?.alternaRail?.();
      return;
    }
    enfocaRail.current = !obert;
    if (obert) setPanellObert(mida === 'estret' ? 'middle' : null);
    else {
      /* Quan l'amplària de la columna força el pas d'ample a mitjà o s'obri en tauleta/mòbil,
         deixem el rail desat com a obert si es commuta i obrim el panell esquerre. */
      setPanellObert('left');
    }
  };

  const textVisible = titol ?? etiqueta ?? 'Xats';

  return (
    <button
      ref={ref}
      type="button"
      className="sdp-xat-titol-seccio sdp-xat-obri-rail"
      aria-expanded={obert}
      aria-controls="app-grid-sidebar"
      data-obri-columna=""
      onClick={alterna}
    >
      {Icona ? <Icona size={24} aria-hidden="true" focusable="false" /> : null}
      <span className="app-grid-col-header__titol">{textVisible}</span>
      <span className="sdp-xat-titol-seccio__fletxa" aria-hidden="true">{obert ? '◂' : '▸'}</span>
    </button>
  );
}

/** Àlies de compatibilitat per a consumidors interns dels tests del Xat. */
export function BotoObriRail({ etiqueta, titol, icona = MessageCircle }) {
  return <BotoTitolSeccioXat titol={titol ?? etiqueta} icona={icona} />;
}
