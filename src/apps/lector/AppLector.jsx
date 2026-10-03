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
 *   · la taula de rutes (rutes.js) sobre ClosaAplicacio, i les columnes de
 *     vistes/ compostes amb peces de Pedra Seca i de l'esquelet comú.
 * Cap CSS, cap classe pròpia, cap xarxa.
 *
 * D'on ixen les notícies: la prop `font` (un port fet amb creaFontNoticies)
 * o, si no n'hi ha, la llavor sintètica, que només hi és en desenvolupament o
 * amb el seu literal propi (VITE_SDP_LECTOR_LLAVOR=1, el patró de
 * bar/llavors). Activar l'app en producció (VITE_SDP_APP_LECTOR, manifest.js)
 * no publica, per tant, cap notícia inventada: sense port, l'app ho diu i no
 * obri ni el magatzem. L'adaptador de producció (el connector de l'amfitrió,
 * que fa de proxy) entrarà per la plataforma o per l'amfitrió, no per ací.
 *
 * Un enllaç a /noticies?article=<id> es canonitza (replace) a
 * /noticies/hui?article=<id>: en pantalla estreta, la ruta de les carpetes
 * taparia el lector.
 *
 * `magatzem`, `font` i `ara` només els passen les proves; RutaApps munta
 * l'app sense props i llavors es fa servir el navegador de veres.
 *
 * SN (261003) · Este mòdul, el que carrega el manifest, exporta també
 * `destinacioEnllac`: per ací el Snippet Curador del Bloc afig una font
 * personal al Lector (fontsPersonals.js), sense importar cap fitxer de l'app
 * (plataforma/destinacions.js). Les fonts personals es veuen a la gestió de
 * fonts, pendents del connector (useFontsPersonals.js).
 */
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { Carregant, EstatBuit } from '../../components/PedraSeca/index.js';
import { ClosaAplicacio, useApp, useRutaApp } from '../plataforma/index.js';
import { creaFontNoticies } from './fontNoticies.js';
import { creaFontsPersonals, destinacioDe } from './fontsPersonals.js';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';
import { creaMagatzemLector } from './magatzem.js';
import { HUI } from './nucli/index.js';
import { RUTES, titolsDe } from './rutes.js';
import { useFontsPersonals } from './useFontsPersonals.js';
import { useLector } from './useLector.js';
import { useNoticies } from './useNoticies.js';
import { ContextLector } from './vistes/context.js';
import { NOTICIES } from './vistes/navegacio.js';

const ARA_DEL_NAVEGADOR = () => Date.now();
/* La llavor sintètica: en desenvolupament o amb el seu literal (cap altre camí). */
const LLAVOR_ACTIVA = import.meta.env.DEV || import.meta.env.VITE_SDP_LECTOR_LLAVOR === '1';
/* El port de la llavor, o null fora del seu literal. El munta l'app i, per a
   les categories del poble, la destinació d'enllaços (una sola vegada). */
const fontDeLaLlavor = (rellotge) => (LLAVOR_ACTIVA ? creaFontNoticies(creaAdaptadorLlavor({ ara: rellotge() })) : null);

/**
 * SN (261003) · La destinació d'enllaços de fora (plataforma/destinacions.js).
 * Només n'hi ha amb port: sense, no hi ha Lector on veure la font ni
 * categories del poble. Hui el port és la llavor; el de l'amfitrió, quan
 * arribe, haurà d'entrar també ací. Crear-la no obri res: el magatzem s'obri
 * en cada operació i el port, la primera vegada que es demanen les categories.
 * Amb null (l'app encesa en producció sense port), la plataforma no oferix
 * la tria al Snippet Curador (correcció SN-R1): cap targeta morta.
 */
export const destinacioEnllac = LLAVOR_ACTIVA
  ? destinacioDe(creaFontsPersonals({ obriMagatzem: () => creaMagatzemLector(), font: () => fontDeLaLlavor(ARA_DEL_NAVEGADOR) }))
  : null;

/* L'app amb un port: el magatzem, les notícies i la closca. */
function LectorAmbFont({ magatzem: magatzemPropi, font, rellotge }) {
  const [magatzem] = useState(() => magatzemPropi || creaMagatzemLector());
  const lector = useLector(magatzem);
  const personals = useFontsPersonals(magatzem);
  const noticies = useNoticies(font);
  const { ruta } = useApp();
  const navigate = useNavigate();
  const { search } = useLocation();
  const coincidencia = useRutaApp(RUTES);
  const entrada = coincidencia ? coincidencia.ruta.path.split('/')[0] : null;

  /* /noticies?article=x → /noticies/hui?article=x (replace: l'historial no guanya cap pas). */
  const canonic = coincidencia?.ruta.path === NOTICIES && new URLSearchParams(search).has('article')
    ? `${ruta(NOTICIES, HUI)}?${search}` : null;
  useEffect(() => {
    if (canonic) navigate(canonic, { replace: true });
  }, [canonic, navigate]);

  const ara = rellotge();
  /* El fus de qui llig, en minuts respecte d'UTC (+120 a l'estiu de València). */
  const desfas = -new Date(ara).getTimezoneOffset();
  const valor = useMemo(() => (lector.estat ? { lector, personals, noticies, font, ara, desfas, ruta } : null),
    [lector, personals, noticies, font, ara, desfas, ruta]);

  if (!valor) return <Carregant etiqueta="Obrint el lector…" />;
  return (
    <ContextLector.Provider value={valor}>
      <ClosaAplicacio rutes={RUTES} titols={titolsDe(entrada)} />
    </ContextLector.Provider>
  );
}

export default function AppLector({ magatzem = null, font: fontPropia = null, ara: araPropi = null }) {
  const rellotge = typeof araPropi === 'function' ? araPropi : ARA_DEL_NAVEGADOR;
  const [font] = useState(() => fontPropia || fontDeLaLlavor(rellotge));
  if (!font) {
    return (
      <EstatBuit titol="Encara no hi ha cap font connectada">
        Quan el poble connecte les seues fonts de notícies, les llegiràs ací.
      </EstatBuit>
    );
  }
  return <LectorAmbFont magatzem={magatzem} font={font} rellotge={rellotge} />;
}
