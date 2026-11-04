/**
 * XatControlSection.jsx — «Control del xat» (/control-xat) sobre la MATEIXA
 * closca que el Xat (ClosCaXat): rail esquerre amb la roda activa, la llista
 * d'opcions al centre i el contingut de l'opció triada a la dreta. AppGridShell
 * ja porta els separadors redimensionables en mode ample: així el panell
 * aprofita l'espai de l'iPad (requisit del Mestre, acta 260927_0230).
 *
 * En estret i en mitjà (ordre del Mestre, 260927 vesprada) seguix el mateix
 * calc que la llista de converses: la fila de títol porta el botó que obri el
 * rail, la fila 2 buida no es pinta, i en estret l'opció oberta porta la seua
 * pròpia capçalera amb la fletxa d'arrere, com la conversa.
 *
 * S'hi arriba des de l'entrada «Novetats» del rail, que és un commutador:
 * premuda de nou, torna a /xat. EXCEPCIÓ de l'onada 3B (decidida pel director
 * de l'onada): les altres entrades del rail obrin una vista de la columna
 * central (/xat?vista=<id>), però «Novetats» continua portant ací perquè és
 * una ordre anterior del Mestre (27-09) i és l'única que ja funcionava. Des
 * d'ací, el rail porta a les vistes del Xat igual que des de /xat.
 *
 * L'opció «Amplària de les columnes» fa exactament el que fa la roda del Bloc
 * de Notes (WorkspaceSettingsDialog): els tres valors predefinits d'AppGridShell.
 * La resta d'opcions diuen honestament que encara no fan res (UX-D03).
 *
 * Ordre del Mestre del 261004 (prompt 261004_0515, T5) · «Multimèdia,
 * enllaços i documents» ja no és pendent: porta (`ruta`) a la vista del rail
 * /xat?vista=multimedia, la mateixa porta que la fila d'Ajustos > Xats.
 *
 * Fase D (261020, tasca 2; pla 261020_1300) · «Privacitat i seguretat», amb
 * la moderació de l'app (la capacitat del backend), porta la llista de
 * persones i entitats bloquejades amb «Desbloqueja» (LlistaBloquejos, la
 * mateixa del perfil), i l'avís diu el que encara falta: silenciar i el
 * xifratge (crítica 261020, 17). Sense, l'opció es pinta com sempre.
 *
 * control-01 (261104) · El silenci per conversa (B8C-5) ja funciona des del
 * botó ⋮ de cada conversa: l'avís de «Privacitat i seguretat», amb la
 * moderació i sense, diu on és i només dona per pendent el que encara ho és.
 * Clau nova (section.moderacio.bloquejos.silenciIXifratge): restaPendent, als
 * diccionaris, encara diu que silenciar no existix. La fase F2c del xifratge
 * (disseny_final_e2ee.md §13) haurà de reescriure esta clau, no l'antiga.
 *
 * control-05 (261104) · En estret, triar una opció i tornar amb la fletxa no
 * deixen el focus de teclat a <body>: en obrir, va a la fletxa; en tornar, a
 * l'opció d'on es venia (el patró T67 de la fitxa d'una comunitat).
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, CircleDashed, Image as ImageIcon, PanelLeft, ShieldCheck, Timer } from 'lucide-react';
import AppGridColumn from '../../components/layout/AppGridColumn.jsx';
import { useAppGrid } from '../../components/layout/AppGridShell.jsx';
import { Boto } from '../../components/PedraSeca/index.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useSEO } from '../../hooks/useSEO';
import ClosCaXat, { BotoObriRail } from './components/ClosCaXat.jsx';
import PanellInicialMobil from './components/PanellInicialMobil.jsx';
import { PRESETS_AMPLARIA } from './amplariaColumnes.js';
import { RUTES_AJUSTOS } from './ajustosXat.js';
import { useModeracio } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { LlistaBloquejos } from '../../components/universal/LlistaBloquejos.jsx';

/* `ruta`: l'opció no s'obri a la dreta, porta a eixa ruta de l'app.
   `avis` (control-01, 261104): l'avís propi d'una opció pendent; sense, el
   genèric. */
const OPCIONS = [
  { id: 'multimedia', icona: ImageIcon, titol: ['section.xat.control.multimedia.titol', 'Multimèdia, enllaços i documents'], text: ['section.xat.control.multimedia.text', "Revisa tot el que s'ha enviat al xat."], pendent: false, ruta: RUTES_AJUSTOS.multimedia },
  { id: 'temporals', icona: Timer, titol: ['section.xat.control.temporals.titol', 'Missatges temporals'], text: ['section.xat.control.temporals.text', "Activa l'autodestrucció de missatges per a converses sensibles."], pendent: true },
  { id: 'privacitat', icona: ShieldCheck, titol: ['section.xat.control.privacitat.titol', 'Privacitat i seguretat'], text: ['section.xat.control.privacitat.text', 'Silenciar notificacions, bloquejar, xifratge extrem a extrem.'], pendent: true, avis: ['section.xat.control.privacitat.pendent', 'Per a silenciar una conversa, obri-la i, des del botó ⋮, tria «Silencia les notificacions». La resta d’esta opció encara no està disponible: es construirà en la fase següent del xat.'] },
  { id: 'espai', icona: PanelLeft, titol: ['section.xat.control.espai.titol', 'Amplària de les columnes'], text: ['section.xat.control.espai.text', 'Tria com d\'amples són les columnes de navegació i de llista, també al xat.'], pendent: false }
];

/* Torn 260930 (T1) · Els tres valors predefinits viuen a amplariaColumnes.js:
   el full «Ajustos» del Xat (FullAjustos) els oferix amb la mateixa llista i
   la mateixa applyPreset. Ací no canvia res: els mateixos botons, en el
   mateix ordre. */

export default function XatControlSection() {
  const { t } = useUIActions();
  const navigate = useNavigate();
  const moderacio = useModeracio();
  const [opcioId, setOpcioId] = useState(null);
  const opcio = OPCIONS.find((o) => o.id === opcioId) || null;
  /* control-05 (261104) · `alDetall`: la tria s'ha fet des de la llista en
     estret, que es tanca amb el focus a dins; la capçalera de l'opció el
     recull a la fletxa. `retorn`: l'opció d'on es torna amb la fletxa; la
     llista hi porta el focus quan torna a ser a l'abast. */
  const alDetall = useRef(false);
  const retorn = useRef(null);
  const torna = () => { retorn.current = opcioId; setOpcioId(null); };
  const titol = t('section.xat.control.titol', 'Control del xat');
  /* Torn 261004 (T5) · Una opció amb `ruta` hi porta; la resta s'obri a la dreta. */
  const triaOpcio = (id) => {
    const triada = OPCIONS.find((o) => o.id === id);
    if (triada?.ruta) navigate(triada.ruta);
    else setOpcioId(id);
  };

  /* Onada 8 (261009) · Sense `image`: useSEO no passa cap SVG a les xarxes i
     ja hi posava la imatge base. El <head> és el mateix. */
  useSEO({
    title: titol,
    description: t('section.xatcontrol.subtitle')
  });

  /* La capçalera de la columna porta el mateix dibuix que l'entrada del rail
     que hi ha dut (CircleDashed, «Novetats»): el que toques és el que s'obri
     (ordre del Mestre, 260927). */
  const middleColumn = (
    <aside className="sdp-workspace-column" aria-label={titol}>
      <AppGridColumn
        esDark={true}
        titol={titol}
        icona={CircleDashed}
        esquerra={<BotoObriRail etiqueta={t('section.xat.rail.menu', 'Menú')} />}
      />
      <FilaSegona />
      <div className="sdp-workspace-column__body">
        <LlistaOpcions opcioId={opcioId} onTria={triaOpcio} alDetall={alDetall} retorn={retorn} t={t} />
      </div>
    </aside>
  );

  const rightColumn = (
    <>
      <PanellInicialMobil llistaPrimer={!opcio} />
      {opcio ? <CapcaleraOpcio titol={t(opcio.titol[0], opcio.titol[1])} onTorna={torna} alDetall={alDetall} t={t} /> : null}
      <div className="sdp-xat-control">
        {opcio ? (
          <DetallOpcio opcio={opcio} moderacio={moderacio} t={t} />
        ) : (
          <p className="sdp-workspace-state" role="status">{t('section.xat.control.tria', 'Tria una opció de la llista.')}</p>
        )}
      </div>
    </>
  );

  return (
    <ClosCaXat
      activa="control"
      middleTitle={titol}
      middleIcon={CircleDashed}
      middleColumn={middleColumn}
      rightColumn={rightColumn}
    />
  );
}

/* En estret, triar una opció sempre la porta a pantalla, també la que ja
   estava triada (aleshores `opcio` no canvia i PanellInicialMobil no es
   torna a disparar): com LlistaDeLaClosca al Xat, tanca els panells abans.
   Muntada dins de la closca, llig la mida amb useAppGrid(). */
function LlistaOpcions({ opcioId, onTria, alDetall, retorn, t }) {
  const { mida, panellObert, tancaPanells } = useAppGrid();
  const llistaRef = useRef(null);
  const tria = (id) => {
    if (mida === 'estret') {
      alDetall.current = true;
      tancaPanells();
    }
    onTria(id);
  };
  /* control-05 (261104) · Tornar amb la fletxa desmunta el botó que tenia el
     focus. Quan la llista torna a ser a l'abast (en estret, un commit després,
     quan PanellInicialMobil la torna; fora d'estret, en el mateix), el focus
     va a l'opció d'on es venia, abans que es pinte i només si s'havia perdut.
     Dins d'un [inert] el navegador no l'enfocaria: s'hi espera. */
  useLayoutEffect(() => {
    const id = retorn.current;
    if (!id || opcioId !== null) return;
    const boto = llistaRef.current?.children[OPCIONS.findIndex((o) => o.id === id)]?.querySelector('button');
    if (!boto || boto.closest('[inert]')) return;
    retorn.current = null;
    if (focusPerdut(boto)) boto.focus({ preventScroll: true });
  }, [opcioId, panellObert, retorn]);
  return (
    <ul ref={llistaRef} className="sdp-xat-llista" aria-label={t('section.xat.control.opcions', 'Opcions')}>
      {OPCIONS.map((o) => {
        const Icona = o.icona;
        return (
          <li key={o.id}>
            <button
              type="button"
              className="sdp-xat-opcio"
              aria-current={opcioId === o.id ? 'true' : undefined}
              onClick={() => tria(o.id)}
            >
              <span className="sdp-xat-opcio__icona" aria-hidden="true">
                <Icona size={22} aria-hidden="true" focusable="false" />
              </span>
              <span className="sdp-xat-opcio__cos">
                <span className="sdp-xat-opcio__titol">{t(o.titol[0], o.titol[1])}</span>
                <span className="sdp-xat-opcio__text">{t(o.text[0], o.text[1])}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* La fila 2 de la columna (la de «Tot · Buscar» al Bloc de Notes) no té cap
   control al Control del xat. En ample es conserva per a mantindre el ritme
   de dos files de l'espai de treball; en estret i en mitjà, on cada píxel
   compta, una fila grisa buida no es pinta. Muntada dins de la closca. */
function FilaSegona() {
  const { mida } = useAppGrid();
  return mida === 'ample' ? <AppGridColumn esDark="intens" /> : null;
}

/* En estret l'opció oberta ocupa tota la pantalla: la seua capçalera, com la
   de la conversa, porta la fletxa que torna a la llista d'opcions. Fora
   d'estret no es veu (modules.css, .sdp-xat-capcalera--opcio). */
function CapcaleraOpcio({ titol, onTorna, alDetall, t }) {
  const { panellObert } = useAppGrid();
  const fletxaRef = useRef(null);
  /* control-05 (261104) · En estret, la tria tanca la llista (inert) amb el
     focus a dins i, sense cap obridor, la guarda d'AppGridShell l'allibera a
     <body>. Este efecte de layout, fill de la closca, va abans que la guarda
     i el porta a la fletxa, el primer control de la pantalla nova. Només
     després d'una tria de la llista en estret (`alDetall`; també la de
     l'opció que ja era oberta, quan només canvia el panell) i només si s'ha
     perdut. */
  useLayoutEffect(() => {
    if (!alDetall.current) return;
    alDetall.current = false;
    if (focusPerdut(fletxaRef.current)) fletxaRef.current?.focus({ preventScroll: true });
  }, [panellObert, alDetall]);
  return (
    <header className="sdp-xat-capcalera sdp-xat-capcalera--opcio">
      <button
        ref={fletxaRef}
        type="button"
        className="sdp-xat-icona"
        onClick={onTorna}
        aria-label={t('section.xat.control.torna', 'Torna a les opcions')}
      >
        <ArrowLeft size={24} aria-hidden="true" focusable="false" />
      </button>
      <div className="sdp-xat-capcalera__info">
        <strong className="sdp-xat-capcalera__nom">{titol}</strong>
      </div>
    </header>
  );
}

/* control-05 (261104) · El focus és perdut si no és enlloc, és a <body>, ja
   no és al document o ha quedat dins d'una columna tancada ([inert]): el
   criteri de BotoObriRail. Es llig a l'arrel del node: en el Shadow DOM tancat
   de l'encastat, document.activeElement és l'amfitrió. */
function focusPerdut(node) {
  const arrel = node?.getRootNode?.() || document;
  const actiu = arrel.activeElement;
  return !actiu || actiu === document.body || actiu === arrel.body || actiu.isConnected === false
    || Boolean(actiu.closest?.('[inert]'));
}

function DetallOpcio({ opcio, moderacio = null, t }) {
  /* Fase D (261020, tasca 2) · Els bloquejos, a «Privacitat i seguretat». */
  const ambBloquejos = opcio.id === 'privacitat' && moderacio?.disponible === true;
  return (
    <article className="sdp-xat-control__panell" aria-labelledby={`xat-control-${opcio.id}`}>
      <h2 id={`xat-control-${opcio.id}`}>{t(opcio.titol[0], opcio.titol[1])}</h2>
      <p>{t(opcio.text[0], opcio.text[1])}</p>
      {opcio.id === 'espai' ? <AmplariaColumnes t={t} /> : null}
      {ambBloquejos ? (
        <>
          <LlistaBloquejos moderacio={moderacio} />
          <p className="sdp-xat-control__avis" role="status">
            {t('section.moderacio.bloquejos.silenciIXifratge', 'Per a silenciar una conversa, obri-la i, des del botó ⋮, tria «Silencia les notificacions». El xifratge extrem a extrem encara no està disponible: es construirà en la fase següent del xat.')}
          </p>
        </>
      ) : opcio.pendent ? (
        <p className="sdp-xat-control__avis" role="status">
          {opcio.avis ? t(opcio.avis[0], opcio.avis[1]) : t('section.xat.control.pendent', 'Esta opció encara no està disponible: es construirà en la fase següent del xat.')}
        </p>
      ) : null}
    </article>
  );
}

/* La mateixa lògica que WorkspaceSettingsDialog del Bloc de Notes. */
function AmplariaColumnes({ t }) {
  const { applyPreset, columnWidths } = useAppGrid();
  return (
    <>
      <p className="sdp-xat-control__estat">
        {t('section.xat.control.espai.ara', 'Ara: navegació {left} px · llista {middle} px')
          .replace('{left}', String(columnWidths.left))
          .replace('{middle}', String(columnWidths.middle))}
      </p>
      <div className="sdp-xat-control__opcions" role="group" aria-label={t('section.xat.control.espai.titol', 'Amplària de les columnes')}>
        {PRESETS_AMPLARIA.map(([id, clau, alternativa]) => (
          <Boto key={id} varietat="secundari" onClick={() => applyPreset(id)}>{t(clau, alternativa)}</Boto>
        ))}
      </div>
    </>
  );
}
