/**
 * ClosCaXat.jsx — la closca compartida del Xat i del Control del xat
 * (pla 260927_0055 §4.D, DEC-02): un AppGridShell amb el rail esquerre,
 * plegat per defecte com la barra estreta de WhatsApp Desktop i recordat
 * amb getVal/setVal (CLAU_RAIL).
 *
 * El rail calca el menú principal de WhatsApp per a Mac (ordre innegociable
 * del Mestre, 260927 vesprada; captura 19.11.50, onada 3B):
 *   · Xats, Comunitats, Telefonades i Contingut multimèdia, en eixe ordre i
 *     amb les mateixes icones («Novetats» continua a ENTRADES_RAIL, però
 *     amagada: D16, vegeu «Destins»);
 *   · la secció plegable «Més», amb Destacats;
 *   · la secció plegable «Comunitats», amb les comunitats de
 *     useXat().comunitats (avatar QUADRAT i nom; la del poble de l'amfitrió,
 *     amb la cara del poble, com a la llista: useCaraDelPoble), que obrin la
 *     seua fitxa (/xat?comunitat=<id>, FitxaComunitat);
 *   · al peu, fix, l'avatar propi, «Tu» i el llapis «Edita el perfil»
 *     (/el-meu-perfil). Pla 261014_1450 (fronts A i C): l'avatar és la cara
 *     de la barra negra, el logo de l'entitat activa o la foto de la persona.
 * L'estat plegat o desplegat de cada secció es recorda com el del rail
 * (clauSeccio); la secció que conté l'entrada activa s'obri en arribar-hi,
 * sense tocar la preferència, i si la persona la plega estant-hi, la
 * capçalera ho diu. Plegat, el rail porta les mateixes entrades en el mateix
 * ordre (Destacats inclòs), les comunitats com a icones d'avatar quadrat i
 * l'avatar propi al peu; les seccions no hi tenen capçalera.
 *
 * Destins (onada 3B, decisió del Mestre, 260928): «Xats» porta a /xat; les
 * vistes (Comunitats, Telefonades, Contingut multimèdia i Destacats), a
 * /xat?vista=<id>, que XatSection pinta a la columna central. Telefonades,
 * Contingut multimèdia i Destacats encara no tenen lògica: s'hi pinta
 * VistaEnConstruccio, que ho diu. «Novetats» obria el Control del xat
 * (/control-xat) com a commutador (excepció de l'onada 3B). D16 (ordre del
 * Mestre, 260930): «Novetats» s'amaga amb `amagada: true`. L'entrada es
 * conserva perquè el canvi siga reversible i `activa='control'` continue
 * sent vàlida; el Control del xat s'obri des de la targeta «Ajustos del
 * xat» del Panell de Control (/control) i la ruta no canvia. Cap entrada
 * avisa amb un toast de «pendent».
 * La capçalera del rail es diu «Menú» i porta la roda dentada (ordre del
 * Mestre, 18:35).
 *
 * Torn 260930 (T1, captures 20.47.21 i 20.48.41): el peu obri el full
 * «Ajustos» (FullAjustos), com «Tú» a WhatsApp Desktop. Desplegat, l'avatar
 * i «Tu» són un sol botó; el llapis continua portant a /el-meu-perfil
 * (el lot no captura on porta el de WhatsApp). Plegat, l'avatar del peu obri
 * el full. La closca munta el full UNA sola vegada, dins d'AppGridShell (hi
 * llig la mida i els presets de les columnes). Fora d'ample, obrir-lo tanca
 * abans el panell lliscant del rail, com qualsevol tria del rail, i en
 * tancar-lo el focus torna al botó que obri el rail (el «Tu» ja és inert).
 * RailXat sense `onAjustos` conserva el peu d'abans: sense full, l'avatar
 * plegat porta al perfil. El catàleg del rail (EspecimenXatRail) li'n passa
 * un de mostra des de la revisió adversarial 260930: ensenya el peu de
 * producció.
 *
 * Les dos seccions munten exactament el mateix rail: canvia només l'entrada
 * activa (`activa`, i `comunitatActiva` per a la fitxa oberta) i el que va a
 * les columnes central i dreta. AppGridShell ja porta els separadors
 * redimensionables en mode ample (requisit del Mestre per a l'iPad, acta
 * 260927_0230).
 *
 * Graella (ordre del Mestre, 260927 nit: «una graella ben quadrada»): totes
 * les icones del rail fan 24, com la roda de «Menú» i com la barra
 * principal, i cauen sobre el mateix eix a 28px de la vora tant plegat com
 * desplegat; les files desplegades van a sang, sense radi ni separació,
 * calcant .nav-item de la barra principal (modules.css, .sdp-xat-rail-llista).
 * Els avatars de les comunitats i el propi fan 24 (Avatar xs) i ocupen la
 * cel·la de la icona: l'eix no es mou.
 *
 * En estret i en mitjà (ordre del Mestre, 260927 vesprada) el Xat no usa les
 * pestanyes de la closca: cada columna porta el seu propi control a la fila
 * de títol, com WhatsApp. El rail és un panell lliscant que sempre es
 * desplega amb etiquetes (BotoObriRail l'obri des de la fila de títol de la
 * columna central i el seu propi botó el tanca), perquè un rail de 56px
 * centrat dins d'un panell de 260 o de 375px quedava perdut.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ChevronDown, CircleDashed, Image as ImageIcon, MessageCircle, PanelLeftOpen, Pencil, Phone, Settings, Star, Users
} from 'lucide-react';
import AppGridShell, { useAppGrid } from '../../../components/layout/AppGridShell.jsx';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import CaraXat from './CaraXat.jsx';
import { useLocation, useNavigate } from '../../../app/contexts/RouterContext';
import { useUIActions } from '../../../app/contexts/UIContext';
import { getVal, setVal } from '../../../config/storage.js';
import { useXat } from '../XatContext';
import { useCaraDelPoble } from '../usePobleAmfitrio.js';
import { comunitatsAmbCaraDelPoble } from '../pobleAmfitrio.js';
import FullAjustos from './FullAjustos.jsx';

export const CLAU_RAIL = 'sdp-xat-rail';

/** La clau de preferència de cada secció plegable del rail («mes», «comunitats»). */
export const clauSeccio = (id) => `${CLAU_RAIL}-${id}`;

/** El perfil propi: el llapis del peu del rail hi porta. */
export const RUTA_PERFIL = '/el-meu-perfil';

const CAP = Object.freeze([]);

/* Controls que poden rebre el focus en obrir el rail. */
const ENFOCABLES = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* Retorn del focus després d'una tria al rail fora d'ample (estret i mitjà).
   Triar-hi una entrada tanca el panell i, sovint, desmunta el BotoObriRail
   que l'havia obert: una vista o una comunitat canvien la fila de títol de
   la columna central (un altre component), i passar del Xat al Control del
   xat, o a l'inrevés, munta una closca nova. El botó vell ja no pot tornar
   el focus i el nou naix amb el panell ja tancat: el focus es quedava dins
   del rail, que passa a `inert`, i el navegador l'enviava a <body>. La tria
   deixa esta marca i el BotoObriRail que la troba (el mateix, si no s'ha
   desmuntat, o el nou) la recull. Caduca de pressa: només val per al canvi
   que la tria acaba de provocar, mai per a una càrrega posterior. */
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

/* Les sis entrades del menú de WhatsApp per a Mac, en el seu ordre i amb la
   seua icona de lucide. `accio`: 'converses' (/xat), 'control' (el Control
   del xat, commutador) o 'vista' (/xat?vista=<id>). `seccio` 'mes': viu dins
   de la secció plegable «Més» del rail desplegat. `amagada`: l'entrada es
   conserva però el rail no la pinta, ni plegat ni desplegat (D16, Novetats). */
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

/* Les entrades que el rail pinta: les amagades (D16) queden fora. */
const PRINCIPALS = ENTRADES_RAIL.filter((e) => !e.seccio && !e.amagada);
const DE_MES = ENTRADES_RAIL.filter((e) => e.seccio === 'mes' && !e.amagada);

function railPlegatInicial() {
  return getVal(CLAU_RAIL, 'plegat') !== 'obert';
}

/* Les seccions naixen desplegades, com a la captura. */
function seccionsInicials() {
  return {
    mes: getVal(clauSeccio('mes'), 'obert') !== 'plegat',
    comunitats: getVal(clauSeccio('comunitats'), 'obert') !== 'plegat'
  };
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
  const {
    comunitats: comunitatsDelXat = CAP, joId = null, joNom = null, joAvatar = null, entitatActiva = null
  } = useXat();
  /* Onada 3 (AV, revisió) · El rail porta la mateixa cara del poble que la
     llista, la fitxa i la vista Comunitats (XatSection): amb sessió, el
     servidor no en dona cap a la comunitat del poble (pobleAmfitrio.js). */
  const { poble, cara } = useCaraDelPoble();
  const comunitats = useMemo(
    () => comunitatsAmbCaraDelPoble(comunitatsDelXat, poble, cara),
    [comunitatsDelXat, poble, cara]
  );
  const [plegat, setPlegat] = useState(railPlegatInicial);

  const alterna = useCallback(() => {
    const seguent = !plegat;
    setVal(CLAU_RAIL, seguent ? 'plegat' : 'obert');
    setPlegat(seguent);
  }, [plegat]);

  /* Torn 260930 (T1) · El full «Ajustos». `origenAjustos` és el botó del peu
     que l'ha obert: en tancar-lo sense navegar, si el Dialeg no hi ha pogut
     tornar el focus (fora d'ample el rail lliscant ja és tancat i inert), va
     al botó que obri el rail de la fila de títol, que és a l'abast. */
  const [ajustosObert, setAjustosObert] = useState(false);
  const origenAjustos = useRef(null);
  const obriAjustos = useCallback((origen) => {
    origenAjustos.current = origen || null;
    setAjustosObert(true);
  }, []);
  const tancaAjustos = useCallback(() => setAjustosObert(false), []);
  const retornaFocus = useCallback(() => {
    const origen = origenAjustos.current;
    if (!origen) return;
    const arrel = origen.getRootNode();
    const actiu = arrel.activeElement;
    const perdut = !actiu || actiu === document.body || actiu.isConnected === false || Boolean(actiu.closest?.('[inert]'));
    if (!perdut) return;
    if (origen.isConnected && !origen.closest('[inert]')) { origen.focus(); return; }
    origen.closest('.app-grid-shell')?.querySelector('.sdp-xat-obri-rail')?.focus();
  }, []);

  const titolRail = t('section.xat.rail.menu', 'Menú');

  return (
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
          onAlterna={alterna}
          titol={titolRail}
          t={t}
          comunitats={comunitats}
          joId={joId}
          joNom={joNom}
          joAvatar={joAvatar}
          entitatActiva={entitatActiva}
          onAjustos={obriAjustos}
        />
      )}
      middleColumn={middleColumn}
      rightColumn={rightColumn}
    >
      <FullAjustos obert={ajustosObert} onTanca={tancaAjustos} onRetornFocus={retornaFocus} />
    </AppGridShell>
  );
}

/* ─────────────────────────────── El rail ─────────────────────────────── */

/**
 * El rail. Muntat dins de la closca: llig la mida amb useAppGrid(). En ample
 * té les dos variants (plegat amb icones, desplegat amb etiquetes) que tria
 * el Mestre amb el botó de replegar. En estret i en mitjà sempre va
 * desplegat i, en triar-hi una entrada, el panell es tanca: en estret torna
 * la llista ('middle'); en mitjà, les dos columnes (null).
 *
 * No llig cap context de dades: `comunitats`, `joId`, `joNom`, `joAvatar` i
 * `entitatActiva` (pla 261014_1450, fronts A i C) arriben per props
 * (ClosCaXat els pren d'useXat()), i `onVes(ruta)` substituïx la
 * navegació (el catàleg de disseny la fa local). Així es pot pintar al
 * catàleg dins d'un AppGridContext. `recordaSeccions` (per defecte, sí)
 * desa l'estat de les seccions amb getVal/setVal; el catàleg el passa a
 * false perquè una demostració no canvie el rail de l'app de la persona.
 * `onAjustos(boto)` (torn 260930, T1): el peu obri el full «Ajustos»; rep el
 * botó premut, on ha de tornar el focus. Sense ell, el peu d'abans.
 */
export function RailXat({
  activa = 'converses', comunitatActiva = null, plegat = false, onAlterna, titol, t,
  comunitats = CAP, joId = null, joNom = null, joAvatar = null, entitatActiva = null,
  onVes = null, recordaSeccions = true, onAjustos = null
}) {
  const { mida, setPanellObert } = useAppGrid();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const ves = onVes || navigate;
  const ample = mida === 'ample';
  const controlObert = activa === 'control';
  const etiquetaTanca = t('section.xat.rail.tancaMenu', 'Tanca el menú');
  const etiquetaPerfil = t('section.xat.rail.editaPerfil', 'Edita el perfil');
  const etiquetaMes = t('section.xat.rail.mes', 'Més');
  const etiquetaComunitats = t('section.xat.rail.comunitats', 'Comunitats');
  const nomJo = joNom || t('section.xat.rail.tu', 'Tu');
  const collapseBtnRef = useRef(null);
  const expandBtnRef = useRef(null);
  const plegatPrevi = useRef(plegat);
  const llistaComunitats = Array.isArray(comunitats) ? comunitats : CAP;
  /* La secció que conté l'entrada activa: Destacats viu a «Més», i la
     comunitat oberta, a «Comunitats». */
  const conteMes = DE_MES.some((e) => e.id === activa);
  const conteComunitat = activa === 'comunitat' && comunitatActiva != null
    && llistaComunitats.some((c) => String(c.fil.id) === String(comunitatActiva));
  const [seccions, setSeccions] = useState(() => {
    const inicials = recordaSeccions ? seccionsInicials() : { mes: true, comunitats: true };
    return { mes: inicials.mes || conteMes, comunitats: inicials.comunitats || conteComunitat };
  });

  useEffect(() => {
    const canvi = plegatPrevi.current !== plegat;
    plegatPrevi.current = plegat;
    if (ample && canvi) (plegat ? expandBtnRef : collapseBtnRef).current?.focus();
  }, [ample, plegat]);

  /* L'estat actual no es pot quedar amagat: en arribar a una entrada que viu
     dins d'una secció plegada, la secció s'obri en esta sessió, sense tocar
     la preferència desada. Si la persona la torna a plegar, és decisió seua:
     la capçalera ho diu (SeccioRail, `actual`). */
  const obriPer = conteMes ? 'mes' : (conteComunitat ? `comunitats:${comunitatActiva}` : '');
  useEffect(() => {
    if (!obriPer) return;
    const id = obriPer === 'mes' ? 'mes' : 'comunitats';
    setSeccions((previ) => (previ[id] ? previ : { ...previ, [id]: true }));
  }, [obriPer]);

  const tancaRail = useCallback(() => {
    setPanellObert?.(mida === 'estret' ? 'middle' : null);
  }, [mida, setPanellObert]);

  const alternaSeccio = (id) => {
    const obert = !seccions[id];
    if (recordaSeccions) setVal(clauSeccio(id), obert ? 'obert' : 'plegat');
    setSeccions((previ) => ({ ...previ, [id]: obert }));
  };

  /* «Xats» porta a /xat: amb una conversa, una vista o una fitxa oberta les
     deixa, i ja sent a la llista no afig cap entrada a l'historial. /xat i
     /xat/ID són la mateixa instància (RouterContext conserva l'element): el
     rail s'aparta des d'ací. «Novetats» era un commutador (ordre del Mestre,
     260927): obria el Control i, premuda, el tancava. Des de D16 està
     amagada; el codi es conserva per si es torna a mostrar. Una vista o una comunitat
     que ja és la de la columna tampoc no repetix l'historial. Fora d'ample,
     la tria deixa la marca de retorn del focus (marcaRetornFocus) per al
     BotoObriRail de la columna, llevat del perfil, que ix del Xat. */
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
  /* Torn 260930 (T1) · El full «Ajustos»: fora d'ample, la tria tanca abans
     el panell del rail. Sense marca de retorn: el focus el pren el full i,
     en tancar-lo, la closca el torna (ClosCaXat, retornaFocus). */
  /* Pla 261014_1450 (front C) · Amb una entitat activa, el nom accessible diu
     amb qui actues; continua començant per «Tu», el que es veu (WCAG 2.5.3). */
  const etiquetaAjustos = entitatActiva?.nom
    ? t('section.xat.ajustos.obriComEntitat', 'Tu: ajustos (actues com a {nom})').replace('{nom}', entitatActiva.nom)
    : t('section.xat.ajustos.obri', 'Tu: ajustos');
  const obriAjustos = (e) => {
    const boto = e.currentTarget;
    tria(() => onAjustos(boto), { retorn: false })();
  };

  const accio = (entrada) => {
    if (entrada.accio === 'converses') return tria(vesAConverses);
    if (entrada.accio === 'control') return tria(vesAControl);
    return tria(() => vesAVista(entrada.id));
  };

  /* Estat accessible de cada entrada: la de la vista oberta marca la pàgina
     actual; «Novetats» és commutador i diu si el Control està obert (amagada
     des de D16: al Control del xat cap entrada visible marca la pàgina). */
  const estat = (entrada) => {
    if (entrada.accio === 'control') {
      return { 'aria-pressed': controlObert ? 'true' : 'false', 'aria-current': controlObert ? 'page' : undefined };
    }
    const id = entrada.accio === 'converses' ? 'converses' : entrada.id;
    return { 'aria-current': activa === id ? 'page' : undefined };
  };

  const nomDe = (comunitat) => comunitat.fil?.name || comunitat.fil?.title || t('section.xat.conversaSenseNom', 'Conversa');
  const avatarDe = (comunitat) => (
    <CaraXat nom={nomDe(comunitat)} src={comunitat.fil?.avatar_url} mida="xs" llavor={comunitat.fil?.id} alt="" className="sdp-xat-avatar--quadrat" />
  );
  /* Pla 261014_1450 (fronts A i C) · La cara del peu és la de la barra negra:
     amb una entitat activa, el SEU logo (mai la foto de la persona,
     useIdentitatDeLaBarra.js), quadrat com les comunitats; si no, la foto de
     la persona. Passa per CaraXat, com les comunitats: una foto pujada
     ('sdp-media://…') la resol el port (Avatar sol la descartaria i pintaria
     les inicials). Sense foto, el mateix Avatar de sempre (Llei del Píxel). */
  const avatarPropi = entitatActiva
    ? <CaraXat nom={entitatActiva.nom || nomJo} src={entitatActiva.avatar} mida="xs" llavor={entitatActiva.id} alt="" className="sdp-xat-avatar--quadrat" />
    : <CaraXat nom={nomJo} src={joAvatar} mida="xs" llavor={joId} alt="" />;

  if (ample && plegat) {
    /* La barra estreta de WhatsApp Desktop: només les icones, en el mateix
       ordre, just davall del botó d'expandir; al peu, l'avatar propi. */
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
      <aside className="sdp-workspace-column" aria-label={titol}>
        <AppGridColumn variant="collapsed" esDark={true} titol={titol} icona={Settings} onReplega={onAlterna} controls="app-grid-sidebar" expandBtnRef={expandBtnRef}>
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
          </nav>
          <div className="sdp-xat-rail-peu sdp-xat-rail-peu--plegat">
            {onAjustos ? (
              <button type="button" className="sdp-workspace-rail__boto" aria-label={etiquetaAjustos} title={etiquetaAjustos} aria-haspopup="dialog" onClick={obriAjustos}>
                {avatarPropi}
              </button>
            ) : (
              <button type="button" className="sdp-workspace-rail__boto" aria-label={etiquetaPerfil} title={etiquetaPerfil} onClick={tria(vesAlPerfil, { retorn: false })}>
                {avatarPropi}
              </button>
            )}
          </div>
        </AppGridColumn>
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

  return (
    <aside className="sdp-workspace-column" aria-label={titol}>
      <AppGridColumn
        esDark={true}
        titol={titol}
        icona={Settings}
        replegaTotaCapcalera
        collapseBtnRef={collapseBtnRef}
        controls="app-grid-sidebar"
        etiquetaReplega={ample ? null : etiquetaTanca}
        onReplega={ample ? onAlterna : tancaRail}
      />
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
      </nav>
      <div className={onAjustos ? 'sdp-xat-rail-peu sdp-xat-rail-peu--ajustos' : 'sdp-xat-rail-peu'}>
        {onAjustos ? (
          /* L'avatar i «Tu» en un sol botó, com «Tú» de WhatsApp: el nom
             accessible comença per «Tu», el que es veu (WCAG 2.5.3). */
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

/* Una secció plegable del rail desplegat («Més», «Comunitats»): la capçalera
   és un botó amb el xebró i aria-expanded; el nom accessible diu «Secció …»
   perquè no es confonga amb l'entrada «Comunitats» de dalt. Plegada, el seu
   contingut queda `hidden`: fora de la vista, del focus i del lector.

   El xebró va dins d'una cel·la de var(--sdp-touch), com el llapis del peu:
   amb el mateix coixí final (var(--sdp-space-2)) els dos cauen sobre el
   mateix eix vertical, com a la captura 19.11.50.

   `actual`: la secció conté l'entrada activa. Si està plegada (la persona
   l'ha plegada estant-hi), la capçalera porta el marcador blanc de la fila
   activa i el nom accessible ho diu, perquè l'estat actual no desaparega. */
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

/* ───────────────────── El botó que obri el rail (fila 1) ─────────────────── */

/* En estret i en mitjà, a l'esquerra de la fila de títol de la columna
   central (Converses, una vista o Control del xat): obri el menú del rail. En
   ample no es pinta. Muntat dins de la closca, llig la mida amb useAppGrid().

   Focus de teclat. En estret, obrir el rail fa `inert` la columna on viu
   este botó: el focus passa a la primera entrada del rail. En tancar-lo
   (des de la creu del rail, en triar-hi una entrada o des d'ací mateix en
   mitjà), si el focus s'ha quedat al rail o ha caigut a <body>, torna al
   botó quan la columna és a l'abast (sempre en mitjà; en estret, quan torna
   la llista). Si la tria ha canviat la fila de títol (una vista, una
   comunitat o l'altra secció del Xat), este botó és nou i naix amb el panell
   ja tancat: el que el porta al focus és la marca que deixa la tria
   (recullRetornFocus).

   T6 · aria-controls="app-grid-sidebar": és el botó desplegable del rail.
   data-obri-columna el declara obridor de la closca: la guarda de focus
   d'AppGridShell només tria els controls que porten les dues marques (el
   RailXat de mostra del catàleg també porta l'aria-controls); quan el panell
   es tanca amb el focus a dins, ella l'hi porta abans que este efecte arribe.
   El focus es llig a l'arrel del botó (en el Shadow DOM tancat de
   l'encastat, document.activeElement és l'amfitrió), i el que ha quedat
   dins d'un [inert] també es dona per perdut. */
export function BotoObriRail({ etiqueta }) {
  const { mida, panellObert, setPanellObert } = useAppGrid();
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
    /* Recull la marca sempre que la columna és a l'abast: la tria ja ha fet
       el seu efecte, i una marca vella no ha de robar el focus més tard. */
    const triat = recullRetornFocus();
    if (previ !== 'left' && !triat) return;
    const arrel = ref.current?.getRootNode?.() || document;
    const actiu = arrel.activeElement;
    const perdut = !actiu || actiu === document.body || actiu.isConnected === false
      || rail?.contains(actiu) || Boolean(actiu.closest?.('[inert]'));
    if (perdut) ref.current?.focus();
  }, [mida, panellObert]);

  if (mida === 'ample') return null;

  const obert = panellObert === 'left';
  const alterna = () => {
    enfocaRail.current = !obert;
    if (obert) setPanellObert(mida === 'estret' ? 'middle' : null);
    else setPanellObert('left');
  };

  return (
    <button
      ref={ref}
      type="button"
      className="sdp-xat-icona sdp-xat-obri-rail"
      aria-label={etiqueta}
      title={etiqueta}
      aria-expanded={obert}
      aria-controls="app-grid-sidebar"
      data-obri-columna=""
      onClick={alterna}
    >
      <PanelLeftOpen size={24} aria-hidden="true" focusable="false" />
    </button>
  );
}
