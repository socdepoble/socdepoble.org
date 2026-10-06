/**
 * Plataforma d'Apps Enxufables · ClosaAplicacio, l'esquelet comú de les apps.
 *
 * Ordre del Mestre (261002, sinergies T4/T8): el TPV del bar (categories |
 * productes | comanda) i La Compra (llistes | articles | detall) tenen la
 * mateixa forma de tres columnes. Dues intel·ligències de dades, un sol
 * esquelet: cap app munta AppGridShell a mà (qualitat.test.js ho vigila).
 * Cada app declara UNA taula de rutes i esta closca en deriva les columnes.
 *
 *   const RUTES = [
 *     { path: 'caixa', Esquerra: Categories, Mig: Productes, Detall: Comanda },
 *     { path: 'caixa/:tiquetId', params: { tiquetId: esIdOpac },
 *       Esquerra: Categories, Mig: Productes, Detall: Comanda, estret: 'detall' },
 *     { path: 'tpv', Unica: Tpv }
 *   ];
 *   <ClosaAplicacio rutes={RUTES} titols={{ esquerra: 'Categories', mig: 'Productes' }} />
 *
 *   · Paths relatius a /app/<id>; el primer tram és una entrada del manifest.
 *   · La mateixa taula alimenta les tres columnes: el mig i el detall sempre
 *     coincidixen amb la URL (coincidixRuta, paràmetres ja validats). Si dos
 *     rutes porten el mateix component a una columna, eixa columna no es
 *     desmunta en navegar: la llista conserva el seu estat.
 *   · Cada columna rep { params }. Els enllaços són absoluts, amb
 *     useApp().ruta(...), i navegar fa push.
 *   · En «estret» es veu una sola columna: `estret` ('esquerra' | 'mig' |
 *     'detall', per defecte 'mig') diu quina. Mana la URL: arrere torna a la
 *     columna d'abans. useClosaAplicacio() obri i tanca els panells.
 *   · ÀREA ÚNICA (ordre del Mestre, 261006, TPV Universal): una ruta pot
 *     portar, EN LLOC de columnes, una sola clau `Unica` (un component; cap
 *     Mig, Detall, Esquerra ni estret, ho vigila validaRutes). El TPV calca
 *     l'estructura de Loyverse (tiquet a l'esquerra, graella a la dreta) i
 *     la seua geometria és pròpia: la closca no munta AppGridShell, pinta
 *     una regió amb el nom de l'app que ocupa tota la caixa del contingut
 *     (.sdp-app-unica, apps.css) i, en compacte, s'aparta de la barra mòbil.
 *     L'àrea rep { params }, igual que una columna, i dos rutes amb el
 *     mateix Unica tampoc no la desmunten. useClosaAplicacio() és de les
 *     columnes: dins d'una àrea única no hi ha panells i llança.
 *   · Cap ruta casa: l'avís de pàgina inexistent, mai un 404 mut. Una taula
 *     mal declarada no tomba l'App: avís i consola, com un manifest invàlid.
 *   · Les rutes de columnes no porten cap classe pròpia ni cap píxel nou: la
 *     geometria és la d'AppGridShell. L'única classe pròpia és la de l'àrea.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useLocation } from '../../app/contexts/RouterContext';
import { useUIState } from '../../app/contexts/UIContext';
import AppGridShell, { useAppGrid } from '../../components/layout/AppGridShell.jsx';
import { AvisApp, PAGINA_INEXISTENT } from './AvisApp.jsx';
import { rutaDeApp, titolDe } from './manifestApp.js';
import { useApp } from './ContextApp.jsx';
import { esRutaUnica, useRutaApp, validaRutes } from './rutesAplicacio.js';

/* La columna de ClosaAplicacio i el panell d'AppGridShell que la fa visible
   en «estret» (null: cap panell obert, es veu el detall). */
const PANELL_DE = Object.freeze({ esquerra: 'left', mig: 'middle', detall: null });
const COLUMNA_DE = Object.freeze({ left: 'esquerra', middle: 'mig' });
/* Només les claus pròpies: 'constructor' no és cap columna. */
const esColumna = (columna) => typeof columna === 'string' && Object.hasOwn(PANELL_DE, columna);

/**
 * La taula d'una ClosaAplicacio: validaRutes amb columnes, i a més el primer
 * tram de cada path ha de ser una entrada del manifest (si no, RutaApps no hi
 * deixaria arribar mai).
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validaTaulaDeClosa(rutes, manifest) {
  const errors = [...validaRutes(rutes, { columnes: true }).errors];
  const entrades = new Set((manifest?.entrades || []).map((entrada) => entrada.slug));
  if (Array.isArray(rutes)) {
    rutes.forEach((ruta, i) => {
      const primer = typeof ruta?.path === 'string' ? ruta.path.split('/')[0] : '';
      if (primer && !entrades.has(primer)) errors.push(`rutes[${i}]: el primer tram «${primer}» no és cap entrada del manifest`);
    });
  }
  return { ok: errors.length === 0, errors };
}

/* En «estret», la columna que demana la ruta. Com PanellInicialMobil del Xat:
   va en fase de layout perquè cap fotograma pinte la columna equivocada, i
   torna a aplicar-se a cada canvi d'URL (triar una categoria al panell de
   l'esquerra el tanca). Si la persona tanca el panell i la ruta en vol un,
   torna eixe. No pinta res. */
function PanellEstret({ columna }) {
  const { mida, panellObert, setPanellObert, tancaPanells } = useAppGrid();
  const { pathname, search } = useLocation();
  const objectiu = esColumna(columna) ? PANELL_DE[columna] : PANELL_DE.mig;

  useLayoutEffect(() => {
    if (mida !== 'estret') return;
    if (objectiu) setPanellObert(objectiu);
    else tancaPanells();
  }, [mida, objectiu, pathname, search, setPanellObert, tancaPanells]);

  useLayoutEffect(() => {
    if (mida === 'estret' && objectiu && panellObert === null) setPanellObert(objectiu);
  }, [mida, objectiu, panellObert, setPanellObert]);

  return null;
}

/**
 * `rutes`: la taula (millor una constant del mòdul de l'app).
 * `titols`: { esquerra, mig } per als separadors de les columnes.
 */
export function ClosaAplicacio({ rutes, titols = {} }) {
  const { manifest } = useApp();
  const { language } = useUIState();
  const titol = titolDe(manifest.titol, language);
  const validacio = useMemo(() => validaTaulaDeClosa(rutes, manifest), [rutes, manifest]);
  const coincidencia = useRutaApp(validacio.ok ? rutes : null);

  useEffect(() => {
    if (!validacio.ok) console.error(`[apps] ClosaAplicacio de «${manifest.id}»: taula de rutes invàlida`, validacio.errors);
  }, [validacio, manifest.id]);

  if (!validacio.ok) {
    return (
      <AvisApp titol="Esta app no es pot obrir">
        Les seues pàgines estan mal declarades. Ho ha d’arreglar qui la manté.
      </AvisApp>
    );
  }
  if (!coincidencia) {
    return (
      <AvisApp
        titol={PAGINA_INEXISTENT.titol}
        desti={rutaDeApp(manifest.id, manifest.entradaPerDefecte)}
        etiqueta={`Ves a ${titol}`}
      >
        {PAGINA_INEXISTENT.text}
      </AvisApp>
    );
  }

  const { ruta, params } = coincidencia;
  /* Àrea única: cap AppGridShell, una regió amb el nom de l'app. */
  if (esRutaUnica(ruta)) {
    const { Unica } = ruta;
    return (
      <div className="sdp-app-unica" role="region" aria-label={titol}>
        <Unica params={params} />
      </div>
    );
  }
  const { Esquerra, Mig, Detall } = ruta;
  return (
    <AppGridShell
      aria-label={titol}
      leftTitle={titols.esquerra || 'Navegació'}
      middleTitle={titols.mig || 'Llista'}
      leftColumn={Esquerra ? <Esquerra params={params} /> : null}
      middleColumn={<Mig params={params} />}
      rightColumn={<Detall params={params} />}
    >
      <PanellEstret columna={ruta.estret || 'mig'} />
    </AppGridShell>
  );
}

/**
 * Dins d'una columna de ClosaAplicacio: la mida de la closca ('estret',
 * 'mitja' o 'ample') i els panells, amb els noms de la closca.
 *   panellObert · 'esquerra' | 'mig' | null
 *   obriPanell(columna) · 'esquerra' o 'mig'; 'detall' tanca els panells
 *   tancaPanells()
 */
export function useClosaAplicacio() {
  const { mida, panellObert, setPanellObert, tancaPanells } = useAppGrid();
  const obriPanell = useCallback((columna) => {
    if (!esColumna(columna)) return;
    if (PANELL_DE[columna]) setPanellObert(PANELL_DE[columna]);
    else tancaPanells();
  }, [setPanellObert, tancaPanells]);
  return useMemo(() => ({
    mida,
    panellObert: Object.hasOwn(COLUMNA_DE, panellObert ?? '') ? COLUMNA_DE[panellObert] : null,
    obriPanell,
    tancaPanells
  }), [mida, panellObert, obriPanell, tancaPanells]);
}
