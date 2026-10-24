/**
 * Notícies del Poble · l'app (export per defecte: RutaApps la carrega amb
 * lazy() dins de /app/lector/*).
 *
 * Ordre del Mestre (261003): l'ESTRUCTURA UX i la funcionalitat de Feedly
 * amb l'estil visual 100% Pedra Seca. «És bàsicament reciclar els nostres
 * patrons de disseny actuals per a injectar notícies externes.» Ací només hi ha:
 *   · el nucli (nucli/): l'analitzador de feeds, l'HTML per llista blanca,
 *     les dates, els filtres i l'estat de la persona;
 *   · el port (fontNoticies.js): per on entren les notícies (Model B);
 *   · el magatzem local (magatzem.js): llegits, per a després, fonts seguides;
 *   · les rutes (rutes.js): les notícies sobre l'espai de treball del Bloc de
 *     notes (vistes/Noticies.jsx) i la gestió de fonts sobre ClosaAplicacio,
 *     amb les columnes de vistes/ compostes amb peces de Pedra Seca i de
 *     l'esquelet comú.
 * Cap CSS, cap classe pròpia, cap xarxa.
 * Bloc 0 del Gauntlet (ordre del Mestre, 261016, prompt 261016_0015) · «El
 * Lector s'ha de muntar directament sobre el patró UniversalWorkspace de Bloc
 * de notes»: /noticies… és l'espai de treball (arbre de carpetes i fonts a
 * l'esquerra, llista al mig, lectura a la dreta), per la façana de l'espai i
 * la porta 'workspace' del nucli 1.2.0. L'única ClosaAplicacio es queda per a
 * /fonts, que l'ordre no toca.
 *
 * D'on ixen les notícies: la prop `font` (un port fet amb creaFontNoticies)
 * o, si no n'hi ha, la llavor sintètica, que només hi és amb el seu literal
 * propi (VITE_SDP_LECTOR_LLAVOR=1). Sense port, l'app ho diu i no obri ni el
 * magatzem: cap notícia inventada.
 * T5 (P1-07, 261024) · L'adaptador de producció entra per la plataforma:
 * useServeiNoticies() dona el servei de notícies del poble (el proxy del
 * backend segellat, plataforma/fontServeis.js), i fontRemota.js en fa
 * l'adaptador del port. L'app continua sense xarxa ni adreces. La llavor, si
 * el seu literal hi és, mana abans; sense literal i sense servei (un mòdul, un
 * paquet sense backend remot), l'estat buit de sempre. La llavor no és mai el
 * respatller del servei: quan les fonts no responen, el detall ho diu
 * (vistes/FontsSenseResposta.jsx), sense cap notícia inventada (Purga de
 * Mocks, 261016).
 * T5b (ordre del Mestre, 261024) · Les fonts del sistema són els referents de
 * coneixement obert del text legal; la persona les pot apagar i en pot afegir
 * de seues. El port del servei es fa dins de LectorAmbFont, amb el magatzem
 * de l'app: en cada ronda li diu les fonts que la persona ha deixat de seguir
 * (no es demanen) i les seues fonts personals (es lligen pel mateix servei, si
 * en sap). La primera ronda espera que el disc s'haja llegit, i un canvi de
 * tria en fa una de nova, sense tornar a «carregant».
 * Ordre del Mestre, 261016 (prompt 261016_0015, Bloc 0, «Purga de Mocks») ·
 * Les notícies fictícies no poden eixir en cap pantalla de desenvolupament:
 * abans la llavor s'encenia també amb el servidor de desenvolupament
 * (import.meta.env.DEV) i /app/lector/noticies ensenyava titulars inventats
 * com si foren del poble. Ara cal el literal explícit, i sense ell el Lector
 * de desenvolupament és el de producció: l'estat buit de davall. La llavor
 * continua sent la dada sintètica de les proves (__fixtures__/muntaLector.jsx).
 * Peça C (ordre del Mestre, 261007, prompt 261007_1628) · Correcció d'esta
 * capçalera: VITE_SDP_APP_LECTOR=1 només la compila al paquet de producció
 * (`carrega`, manifest.js); no l'obri. El manifest porta entorn
 * 'desenvolupament' i la plataforma l'apaga fora de desenvolupament
 * (interruptors.js, motiu 'entorn-desenvolupament'). Obrir-la en producció
 * demana, a més del literal, canviar eixe entorn i un port de notícies: hui
 * cap dels dos no hi és.
 *
 * Un enllaç a /noticies?article=<id> es canonitza (replace) a
 * /noticies/hui?article=<id>, la llista de «Hui» de l'enllaç compartit. I
 * l'enllaç vell a les fonts d'una carpeta en estret, /noticies/<carpeta>/fonts
 * (les columnes del 261004), a la carpeta: les fonts ja són a l'arbre.
 *
 * `magatzem`, `font` i `ara` només els passen les proves; RutaApps munta
 * l'app sense props i llavors es fa servir el navegador de veres.
 *
 * Ordre del Mestre (261024, 15:05) · «Adeu a la pàgina inflada de
 * /app/lector/fonts»: les fonts viuen a l'arbre de l'esquerra (carpetes i,
 * dins, les fonts, també les apagades i les teues), la gestió de fonts és un
 * diàleg de l'arbre (vistes/GestioFonts.jsx: seguir o apagar, afegir una font
 * https i llevar-la) i el Lector és només l'espai de treball de tres columnes.
 * La ClosaAplicacio se'n va amb la pàgina; l'enllaç vell /app/lector/fonts el
 * porta la plataforma a /app/lector/noticies (RutaApps, replace). La fila de
 * cada notícia és la del Bloc de notes (vistes/FilaNoticia.jsx), amb la
 * miniatura que dona el servei, i un vídeo es mira dins de la lectura després
 * de prémer (vistes/Lector.jsx · VideoDeLArticle).
 *
 * SN (261003) · Este mòdul, el que carrega el manifest, exporta també
 * `destinacioEnllac`: per ací el Snippet Curador del Bloc afig una font
 * personal al Lector (fontsPersonals.js), sense importar cap fitxer de l'app
 * (plataforma/destinacions.js). Les fonts personals es veuen a la gestió de
 * fonts (useFontsPersonals.js): pendents amb la llavor o un port propi; amb el
 * servei de notícies, llegides per ell (T5b, 261024), i també s'hi afigen des
 * de la gestió de fonts de l'arbre (Codex D-06, 261024).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { Carregant, EstatBuit } from '../../components/PedraSeca/index.js';
import { useApp, useRutaApp, useServeiNoticies, useSessioApp } from '../plataforma/index.js';
import { creaFontNoticies } from './fontNoticies.js';
import { creaAdaptadorRemot } from './fontRemota.js';
import { creaFontsPersonals, destinacioDe } from './fontsPersonals.js';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';
import { creaMagatzemLector } from './magatzem.js';
import { SENSE_MITJANS, mitjansDe } from './mitjans.js';
import { HUI } from './nucli/index.js';
import { CAMI_FONTS_VELL, CAMI_TOTES, RUTES_NOTICIES } from './rutes.js';
import { useFontsPersonals } from './useFontsPersonals.js';
import { useLector } from './useLector.js';
import { useNoticies } from './useNoticies.js';
import { ContextLector } from './vistes/context.js';
import { NOTICIES } from './vistes/navegacio.js';
import { EspaiNoticies } from './vistes/Noticies.jsx';

const ARA_DEL_NAVEGADOR = () => Date.now();
/* La llavor sintètica: només amb el seu literal (cap altre camí, tampoc el
   servidor de desenvolupament; ordre del Mestre, 261016). */
const LLAVOR_ACTIVA = import.meta.env.VITE_SDP_LECTOR_LLAVOR === '1';
/* El port de la llavor, o null fora del seu literal. El munta l'app i, per a
   les categories del poble, la destinació d'enllaços (una sola vegada). */
const fontDeLaLlavor = (rellotge) => (LLAVOR_ACTIVA ? creaFontNoticies(creaAdaptadorLlavor({ ara: rellotge() })) : null);
/* T5 (261024) · El port de les fonts del servei, o null sense el servei de la plataforma.
   T5b (261024) · `persona()`: el que ha triat la persona ({ noSeguides, personals }) o null. */
const fontDelServei = (servei, persona) => (servei ? creaFontNoticies(creaAdaptadorRemot({ servei, persona })) : null);
/* La tria de la persona que canvia el que es demana: les fonts apagades i les personals (ids). */
const clauDeLaTria = (noSeguides, personals) => `${[...noSeguides].sort().join(' ')}|${personals.map((font) => font.id).join(' ')}`;
/* Ordre del Mestre (261024, 15:05; Codex D-06) · Les fonts personals s'afigen des de la gestió de
   fonts de l'arbre amb l'API de sempre (fontsPersonals.js · afigFontPersonal: la validació, el disc
   i una sola transacció), sobre el magatzem de l'app. L'API tanca el seu magatzem en acabar cada
   operació; el de l'app no s'ha de tancar: esta vista no ho fa. L'avís de canvi del magatzem
   (useFontsPersonals) porta la font nova a la vista. */
const vistaSenseTancar = (magatzem) => Object.freeze({
  prepara: () => magatzem.prepara(),
  llegixPersonals: () => magatzem.llegixPersonals(),
  actualitzaPersonals: (operacio) => magatzem.actualitzaPersonals(operacio),
  tanca: () => {}
});
/* El que diu el servei d'ell mateix (servei.estat(): { disponible, personals }), net. Si no ho
   pot dir, no hi és: cap ronda no farà cap petició (el servei rebutja de colp). */
const estatNet = (cru) => Object.freeze({ disponible: cru?.disponible !== false, personals: cru?.personals === true });
const SERVEI_ABSENT = Object.freeze({ disponible: false, personals: false });

/**
 * SN (261003) · La destinació d'enllaços de fora (plataforma/destinacions.js).
 * Només n'hi ha amb port: sense, no hi ha Lector on veure la font ni
 * categories del poble. Hui el port és la llavor; el de l'amfitrió, quan
 * arribe, haurà d'entrar també ací. Crear-la no obri res: el magatzem s'obri
 * en cada operació i el port, la primera vegada que es demanen les categories.
 * Amb null (l'app encesa sense port), la plataforma no oferix la tria al
 * Snippet Curador (correcció SN-R1): cap targeta morta.
 * Ordre del Mestre, 261016 (Purga de Mocks) · Des d'ara també en
 * desenvolupament sense el literal de la llavor: el Curador hi oferix només
 * el Bloc. No es desacobla del port: una font personal desada sense port
 * aniria a la gestió de fonts, que sense port és l'estat buit, i no es veuria
 * enlloc (la targeta morta que SN-R1 prohibix).
 * T5 (261024) · El servei de notícies de la plataforma no hi entra: només es
 * pot llegir dins de l'app (un ganxo). La destinació continua sent només de la
 * llavor. T5b (261024) · Les fonts personals ja es lligen pel servei (el
 * servei comprova l'adreça contra el SSRF: supabase/functions/noticies/), però
 * obrir la destinació sense la llavor és decisió del Mestre (SN-R1).
 */
export const destinacioEnllac = LLAVOR_ACTIVA
  ? destinacioDe(creaFontsPersonals({ obriMagatzem: () => creaMagatzemLector(), font: () => fontDeLaLlavor(ARA_DEL_NAVEGADOR) }))
  : null;

/* El camí canònic d'un enllaç de notícies que no ho és, o null (replace: l'historial no guanya
   cap pas):
     /noticies?article=x       → /noticies/hui?article=x
     /noticies/<carpeta>/fonts → /noticies/<carpeta>, amb la mateixa consulta */
function canonicDe(coincidencia, search, ruta) {
  const cami = coincidencia?.ruta.path;
  if (cami === NOTICIES && new URLSearchParams(search).has('article')) return `${ruta(NOTICIES, HUI)}?${search}`;
  if (cami !== CAMI_FONTS_VELL) return null;
  const carpeta = ruta(NOTICIES, coincidencia.params.carpeta);
  return search ? `${carpeta}?${search}` : carpeta;
}

/* L'app amb un port: el magatzem, les notícies, l'espai de treball i la closca. `font`: el port
   propi (les proves) o el de la llavor; si no n'hi ha, el del servei, que es fa ací. */
function LectorAmbFont({ magatzem: magatzemPropi, font: fontPropia, servei, rellotge }) {
  const [magatzem] = useState(() => magatzemPropi || creaMagatzemLector());
  const lector = useLector(magatzem);
  const personals = useFontsPersonals(magatzem);
  /* T5b (261024) · El que ha triat la persona, per al port del servei: es llig en cada ronda i
     s'actualitza abans que la ronda isca (este efecte va davant del de useNoticies). Mentre el
     disc no s'ha llegit (l'estat i les fonts personals; un error de les personals també val),
     null, i la primera ronda espera. */
  const persona = useRef(null);
  const [font] = useState(() => fontPropia || fontDelServei(servei, () => persona.current));
  const delServei = !fontPropia;
  /* 261024 (Lector; interfície amb el servei) · El servei diu si hi és i si llig les fonts
     personals (servei.estat()). Sense estat() (un servei de proves), es dona per encés. Amb les
     personals apagades al servei, la gestió de fonts diu la veritat: queden guardades ací i es
     llegiran quan el servei les active. L'estat es llig amb l'efecte de davall (L-07). */
  const [estatServei, setEstatServei] = useState(null);
  const llegixPersonals = delServei && typeof servei?.feedPersonal === 'function' && estatServei?.personals !== false;
  /* Ordre del Mestre (261024, 15:05) · La miniatura de cada fila i el vídeo de la lectura, només
     pel servei (mitjans.js): sense servei, cap. */
  const mitjans = useMemo(() => (delServei ? mitjansDe(servei) : SENSE_MITJANS), [delServei, servei]);
  const [afigFont] = useState(() => creaFontsPersonals({ obriMagatzem: () => vistaSenseTancar(magatzem), font: () => font }).afigFontPersonal);
  const llesta = Boolean(lector.estat) && (personals.llegides || personals.error !== null);
  const noSeguides = lector.estat?.noSeguides;
  const propies = personals.fonts;
  useEffect(() => {
    persona.current = llesta ? { noSeguides, personals: propies } : null;
  }, [llesta, noSeguides, propies]);
  const tria = llesta ? clauDeLaTria(noSeguides, propies) : '';
  /* T5 (261024) · Sense xarxa, les fonts no poden respondre: la vista ho diu així, i quan torna
     la xarxa useNoticies les torna a demanar. */
  const { enLinia } = useSessioApp();
  const noticies = useNoticies(font, enLinia, delServei ? { preparat: llesta, clau: tria } : undefined);
  /* Correcció L-07 (261024 Lector final) · L'estat del servei no és una foto del muntatge. El client
     torna a preguntar després d'una fallada de pas (fora de línia, o una resposta que no és la
     definitiva), i una foto vella deixava les fonts teues «pendents» encara que el servei ja les
     llegia. Es llig: en muntar; cada vegada que acaba una ronda (`rondaAcabada`: el resultat de
     useNoticies, mai mentre carrega); i quan torna la xarxa. Mai fora de línia: el que diria
     llavors és la falta de xarxa, no el servei (eixa ja la diu la vista amb 'sense-connexio'), i
     mentrestant les teues no es marquen pendents. Quan el servei ja ha dit que hi és i que les llig
     (la resposta definitiva, que el client memoritza), no es torna a preguntar. Pintar només si
     canvia: llegir-lo no fa cap pintada de més. */
  const rondaAcabada = noticies.estat === 'carregant' ? null : noticies;
  const estatLlegit = useRef(false);
  const estatDefinitiu = useRef(false);
  useEffect(() => {
    if (!delServei || typeof servei?.estat !== 'function' || enLinia === false || estatDefinitiu.current) return undefined;
    if (rondaAcabada === null && estatLlegit.current) return undefined;
    estatLlegit.current = true;
    let viu = true;
    const posa = (nou) => {
      if (!viu) return;
      estatDefinitiu.current = nou.disponible && nou.personals;
      setEstatServei((abans) => (abans?.disponible === nou.disponible && abans?.personals === nou.personals ? abans : nou));
    };
    Promise.resolve().then(() => servei.estat()).then((cru) => posa(estatNet(cru)), () => posa(SERVEI_ABSENT));
    return () => { viu = false; };
  }, [delServei, servei, rondaAcabada, enLinia]);
  const { ruta } = useApp();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const deNoticies = useRutaApp(RUTES_NOTICIES);

  const canonic = canonicDe(deNoticies, search, ruta);
  useEffect(() => {
    if (canonic) navigate(canonic, { replace: true });
  }, [canonic, navigate]);

  /* Peça C (ordre del Mestre, 261007, prompt 261007_1628) · «Ara» és l'instant
     en què s'arriba a una ruta (camí i consulta) i es conserva mentre s'hi està.
     Abans es llegia el rellotge a cada pintada: `valor` canviava sempre i el
     useMemo de davall no estalviava res (tot el context es tornava a pintar
     amb qualsevol canvi). Canvi acceptat (diagnosi de la peça C): «Hui» i les
     hores relatives es calculen amb l'instant d'arribada a la ruta i no
     avancen fins a una navegació; abans, marcar com a llegit o una
     actualització del port feien avançar la finestra de 24 h. L'instant és el
     mateix per a totes les columnes mentre no es canvia de ruta.
     Encàrrec F del Gauntlet (261016, P3) · La ruta és el camí, la llista: la
     consulta ja només porta la notícia oberta (?article=, ?seccio=), des que
     les notícies són l'espai de treball i ?vista= no hi és. Amb la consulta,
     obrir una notícia tornava a llegir el rellotge; si la pestanya duia prou
     temps oberta, la notícia que tocava la persona ja passava de les 24 h,
     perdia «Hui» i l'espai la portava a la seua categoria (replace), mentre
     «Hui» s'encongia davall d'ella. Obrir i tancar una notícia no avança
     l'instant; canviar de llista, sí.
     `clau` és la clau de la memòria per ruta: ningú no la llig, només lliga
     el camí a les dependències (exhaustive-deps no admet una dependència que
     el càlcul no fa servir). */
  const instant = useMemo(() => ({ clau: pathname, ara: rellotge() }), [rellotge, pathname]);
  const { ara } = instant;
  /* El fus de qui llig, en minuts respecte d'UTC (+120 a l'estiu de València). */
  const desfas = -new Date(ara).getTimezoneOffset();
  const valor = useMemo(() => (lector.estat ? {
    lector, personals, noticies, font, ara, desfas, ruta, enLinia, llegixPersonals, delServei, estatServei, mitjans, afigFont
  } : null), [lector, personals, noticies, font, ara, desfas, ruta, enLinia, llegixPersonals, delServei, estatServei, mitjans, afigFont]);

  if (!valor) return <Carregant etiqueta="Obrint el lector…" />;
  /* Ordre del Mestre (261024, 15:05) · «El Lector ha de ser exclusivament un UniversalWorkspace
     pur i fluid de tres columnes»: la gestió de fonts (/fonts) ja no és cap pàgina, viu a l'arbre
     (vistes/GestioFonts.jsx), i la ClosaAplicacio que la portava se'n va. Un camí de notícies
     que no casa (una carpeta amb majúscules, massa trams) ho diu amb el text de la plataforma. */
  return (
    <ContextLector.Provider value={valor}>
      {deNoticies
        ? <EspaiNoticies params={deNoticies.params} totes={deNoticies.ruta.path === CAMI_TOTES} />
        : <PaginaQueNoExistix ruta={ruta} />}
    </ContextLector.Provider>
  );
}

/* La pàgina que no existix: el text de l'avís de la plataforma (AvisApp, PAGINA_INEXISTENT) i el
   camí a les notícies. */
function PaginaQueNoExistix({ ruta }) {
  return (
    <EstatBuit titol="Esta pàgina de l’app no existix"
      accio={<Link className="sdp-boto sdp-boto--secundari" to={ruta(NOTICIES)}>Ves a les notícies</Link>}>
      Pot ser que l’enllaç siga antic o estiga mal copiat.
    </EstatBuit>
  );
}

export default function AppLector({ magatzem = null, font: fontPropia = null, ara: araPropi = null }) {
  const rellotge = typeof araPropi === 'function' ? araPropi : ARA_DEL_NAVEGADOR;
  const servei = useServeiNoticies();
  const [font] = useState(() => fontPropia || fontDeLaLlavor(rellotge) || null);
  /* El servei de la plataforma, una sola vegada i només si no hi ha cap altre port. */
  const [delServei] = useState(() => (font ? null : servei));
  if (!font && !delServei) {
    return (
      <EstatBuit titol="Encara no hi ha cap font connectada">
        Quan el poble connecte les seues fonts de notícies, les llegiràs ací.
      </EstatBuit>
    );
  }
  return <LectorAmbFont magatzem={magatzem} font={font} servei={delServei} rellotge={rellotge} />;
}
