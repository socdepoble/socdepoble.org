/**
 * ClosCaXat.jsx — la closca compartida del Xat i del Control del xat
 * (pla 260927_0055 §4.D, DEC-02): un AppGridShell amb el rail esquerre,
 * plegat per defecte com la barra estreta de WhatsApp Desktop i recordat
 * amb getVal/setVal('sdp-xat-rail').
 *
 * El rail calca el menú principal de WhatsApp per a Mac (ordre innegociable
 * del Mestre, 260927 vesprada): Xats, Novetats, Comunitats, Telefonades,
 * Contingut multimèdia i Destacats, en eixe ordre i amb les mateixes icones.
 * «Xats» porta a les converses i «Novetats» és, de moment, l'entrada del
 * Control del xat (/control-xat); les altres quatre encara no tenen lògica
 * pròpia i ho diuen amb un avís en clicar-les (UX-D03), en lloc de fer com
 * si. La capçalera del rail es diu «Menú» i porta la roda dentada (ordre del
 * Mestre, 18:35): eixe botó és l'accés a la configuració general del Xat,
 * mentre que la llista de baix no s'aparta de WhatsApp.
 *
 * Les dos seccions munten exactament el mateix rail: canvia només l'entrada
 * activa i el que va a les columnes central i dreta. AppGridShell ja porta
 * els separadors redimensionables en mode ample (requisit del Mestre per a
 * l'iPad, acta 260927_0230).
 *
 * Graella (ordre del Mestre, 260927 nit: «una graella ben quadrada»): totes
 * les icones del rail fan 24, com la roda de «Menú» i com la barra
 * principal, i cauen sobre el mateix eix a 28px de la vora tant plegat com
 * desplegat; les files desplegades van a sang, sense radi ni separació,
 * calcant .nav-item de la barra principal (modules.css, .sdp-xat-rail-llista).
 *
 * En estret i en mitjà (ordre del Mestre, 260927 vesprada) el Xat no usa les
 * pestanyes de la closca: cada columna porta el seu propi control a la fila
 * de títol, com WhatsApp. El rail és un panell lliscant que sempre es
 * desplega amb etiquetes (BotoObriRail l'obri des de la fila de títol de la
 * columna central i el seu propi botó el tanca), perquè un rail de 56px
 * centrat dins d'un panell de 260 o de 375px quedava perdut.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleDashed, Image as ImageIcon, MessageCircle, PanelLeftOpen, Phone, Settings, Star, Users } from 'lucide-react';
import AppGridShell, { useAppGrid } from '../../../components/layout/AppGridShell.jsx';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { useLocation, useNavigate } from '../../../app/contexts/RouterContext';
import { useUIActions } from '../../../app/contexts/UIContext';
import { useToast } from '../../../components/universal/NotificationContext.jsx';
import { getVal, setVal } from '../../../config/storage.js';

export const CLAU_RAIL = 'sdp-xat-rail';

/* Controls que poden rebre el focus en obrir el rail. */
const ENFOCABLES = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* Les sis entrades del menú de WhatsApp per a Mac, en el seu ordre i amb la
   seua icona de lucide. `accio`: 'converses' i 'control' tenen destí; la
   resta és 'pendent' fins que el Mestre decidisca on va cada cosa. */
export const ENTRADES_RAIL = Object.freeze([
  { id: 'xats', accio: 'converses', Icona: MessageCircle, clau: 'section.xat.rail.xats', text: 'Xats' },
  { id: 'novetats', accio: 'control', Icona: CircleDashed, clau: 'section.xat.rail.novetats', text: 'Novetats' },
  { id: 'comunitats', accio: 'pendent', Icona: Users, clau: 'section.xat.rail.comunitats', text: 'Comunitats' },
  { id: 'telefonades', accio: 'pendent', Icona: Phone, clau: 'section.xat.rail.telefonades', text: 'Telefonades' },
  { id: 'multimedia', accio: 'pendent', Icona: ImageIcon, clau: 'section.xat.rail.multimedia', text: 'Contingut multimèdia' },
  { id: 'destacats', accio: 'pendent', Icona: Star, clau: 'section.xat.rail.destacats', text: 'Destacats' }
]);

function railPlegatInicial() {
  return getVal(CLAU_RAIL, 'plegat') !== 'obert';
}

export default function ClosCaXat({
  activa = 'converses',
  middleTitle,
  middleIcon = null,
  middleColumn,
  rightColumn
}) {
  const { t } = useUIActions();
  const [plegat, setPlegat] = useState(railPlegatInicial);

  const alterna = useCallback(() => {
    const seguent = !plegat;
    setVal(CLAU_RAIL, seguent ? 'plegat' : 'obert');
    setPlegat(seguent);
  }, [plegat]);

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
      leftColumn={<RailXat activa={activa} plegat={plegat} onAlterna={alterna} titol={titolRail} t={t} />}
      middleColumn={middleColumn}
      rightColumn={rightColumn}
    />
  );
}

/* ─────────────────────────────── El rail ─────────────────────────────── */

/* Muntat dins de la closca: llig la mida amb useAppGrid(). En ample té les
   dos variants (plegat amb icones, desplegat amb etiquetes) que tria el
   Mestre amb el botó de replegar. En estret i en mitjà sempre va desplegat
   i, en triar-hi una entrada, el panell es tanca: en estret torna la llista
   ('middle'); en mitjà, les dos columnes (null). */
function RailXat({ activa, plegat, onAlterna, titol, t }) {
  const { mida, setPanellObert } = useAppGrid();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { showToast } = useToast();
  const ample = mida === 'ample';
  const controlObert = activa === 'control';
  const etiquetaTanca = t('section.xat.rail.tancaMenu', 'Tanca el menú');
  const collapseBtnRef = useRef(null);
  const expandBtnRef = useRef(null);
  const plegatPrevi = useRef(plegat);

  useEffect(() => {
    const canvi = plegatPrevi.current !== plegat;
    plegatPrevi.current = plegat;
    if (ample && canvi) (plegat ? expandBtnRef : collapseBtnRef).current?.focus();
  }, [ample, plegat]);

  const tancaRail = useCallback(() => {
    setPanellObert(mida === 'estret' ? 'middle' : null);
  }, [mida, setPanellObert]);

  /* «Xats» porta a /xat: amb una conversa oberta la deselecciona, i ja sent
     a /xat no afig cap entrada a l'historial. /xat i /xat/ID són la mateixa
     instància (RouterContext conserva l'element): el rail s'aparta des
     d'ací. «Novetats» és un commutador (ordre del Mestre, 260927): obri el
     Control i, premuda, el tanca; són closques distintes i canviar de ruta
     remunta el panell, però tancar-lo abans no fa cap mal. Les entrades
     pendents no naveguen: avisen i deixen el rail com estava. */
  const vesAConverses = () => {
    if (!ample) tancaRail();
    if (pathname !== '/xat') navigate('/xat');
  };
  const vesAControl = () => {
    if (!ample) tancaRail();
    navigate(controlObert ? '/xat' : '/control-xat');
  };
  const avisaPendent = () => {
    showToast(t('section.xat.rail.pendent', 'Encara no disponible: es construirà en una fase següent del xat.'), 'info');
  };
  const accions = { converses: vesAConverses, control: vesAControl, pendent: avisaPendent };

  /* Estat accessible de cada entrada: «Xats» marca la pàgina actual; «Novetats»
     és commutador i diu si el Control està obert; les pendents no en tenen. */
  const estat = (entrada) => {
    if (entrada.accio === 'converses') return { 'aria-current': activa === 'converses' ? 'page' : undefined };
    if (entrada.accio === 'control') return { 'aria-pressed': controlObert ? 'true' : 'false', 'aria-current': controlObert ? 'page' : undefined };
    return {};
  };

  if (ample && plegat) {
    /* La barra estreta de WhatsApp Desktop: només les icones, en el mateix
       ordre, just davall del botó d'expandir. */
    return (
      <aside className="sdp-workspace-column" aria-label={titol}>
        <AppGridColumn variant="collapsed" esDark={true} titol={titol} icona={Settings} onReplega={onAlterna} controls="app-grid-sidebar" expandBtnRef={expandBtnRef}>
          <nav className="sdp-workspace-rail" aria-label={titol}>
            <ul className="sdp-workspace-rail__grup">
              {ENTRADES_RAIL.map((entrada) => {
                const etiqueta = t(entrada.clau, entrada.text);
                return (
                  <li key={entrada.id}>
                    <button
                      type="button"
                      className="sdp-workspace-rail__boto"
                      aria-label={etiqueta}
                      title={etiqueta}
                      {...estat(entrada)}
                      onClick={accions[entrada.accio]}
                    >
                      <entrada.Icona size={24} aria-hidden="true" focusable="false" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </AppGridColumn>
      </aside>
    );
  }

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
        <ul className="sdp-xat-rail-llista">
          {ENTRADES_RAIL.map((entrada) => {
            const etiqueta = t(entrada.clau, entrada.text);
            return (
              <li key={entrada.id}>
                <button
                  type="button"
                  className="sdp-workspace-nav-item"
                  {...estat(entrada)}
                  onClick={accions[entrada.accio]}
                >
                  <span className="sdp-workspace-nav-item__icon" aria-hidden="true">
                    <entrada.Icona size={24} aria-hidden="true" focusable="false" />
                  </span>
                  <span className="sdp-workspace-nav-item__label">{etiqueta}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

/* ───────────────────── El botó que obri el rail (fila 1) ─────────────────── */

/* En estret i en mitjà, a l'esquerra de la fila de títol de la columna
   central (Converses o Control del xat): obri el menú del rail. En ample no
   es pinta. Muntat dins de la closca, llig la mida amb useAppGrid().

   Focus de teclat. En estret, obrir el rail fa `inert` la columna on viu
   este botó: el focus passa a la primera entrada del rail. En tancar-lo
   (des de la creu del rail, en triar-hi una entrada o des d'ací mateix en
   mitjà), si el focus s'ha quedat al rail o ha caigut a <body>, torna al
   botó quan la columna és a l'abast (sempre en mitjà; en estret, quan torna
   la llista). */
export function BotoObriRail({ etiqueta }) {
  const { mida, panellObert, setPanellObert } = useAppGrid();
  const ref = useRef(null);
  const enfocaRail = useRef(false);
  const panellPrevi = useRef(panellObert);

  useEffect(() => {
    const previ = panellPrevi.current;
    panellPrevi.current = panellObert;
    if (mida === 'ample' || previ === panellObert) return;
    const closca = ref.current?.closest('.app-grid-shell');
    if (!closca) return;
    const rail = closca.querySelector('#app-grid-sidebar');
    if (panellObert === 'left') {
      if (enfocaRail.current) {
        (rail?.querySelector('.sdp-xat-rail-llista button:not([disabled])') || rail?.querySelector(ENFOCABLES))?.focus();
      }
      enfocaRail.current = false;
      return;
    }
    if (previ !== 'left' || (mida !== 'mitja' && panellObert !== 'middle')) return;
    const actiu = document.activeElement;
    const perdut = !actiu || actiu === document.body || rail?.contains(actiu);
    if (perdut) ref.current.focus();
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
      onClick={alterna}
    >
      <PanelLeftOpen size={24} aria-hidden="true" focusable="false" />
    </button>
  );
}
