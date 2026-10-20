/**
 * Plataforma d'Apps Enxufables · el relleu de la barra lateral.
 *
 * App.jsx embolcalla els dos <SidebarContent> (calaix i columna) amb
 * <BarraLateral>. La decisió ve de la URL: dins d'una app disponible
 * (/app/<id>/…) pinta BarraApp; a qualsevol altra ruta torna els fills TAL
 * QUAL (Llei del Píxel: la barra de Sóc de Poble no canvia ni un píxel).
 *
 * La fletxa «← Sóc de Poble» fa push a l'última ruta de Sóc de Poble on era la
 * persona (camí i consulta), o a DEFAULT_SECTION_PATH si ha entrat a l'app
 * directament per un enllaç.
 *
 * useTitolBarraLateral: el títol del calaix (Dialeg) en compacte.
 */
import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { useUIState } from '../../app/contexts/UIContext';
import { DEFAULT_SECTION_PATH } from '../../config/sections';
import { BarraApp } from './BarraApp.jsx';
import { titolDe } from './manifestApp.js';
import { useAppActual } from './PlataformaContext.jsx';
import { analitzaRuta } from './registreApps.js';

export const TITOL_MENU_SDP = 'Menú Sóc de Poble';

export function BarraLateral({ children, isCompact = false, isDesktopSidebarClosed = false, toggleSidebar }) {
  const app = useAppActual();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const ultimaRuta = useRef(null);

  useEffect(() => {
    if (app || !pathname || analitzaRuta(pathname).dins) return undefined;
    /* Un Navigate pot canonitzar esta ruta en el mateix muntatge. Només
       recordem l'adreça quan es consolida; la neteja cancel·la els àlies que
       redirigixen abans, perquè la fletxa no torne a entrar a l'app. */
    const timer = setTimeout(() => {
      ultimaRuta.current = search ? `${pathname}?${search}` : pathname;
    }, 0);
    return () => clearTimeout(timer);
  }, [app, pathname, search]);

  const torna = useCallback(() => {
    navigate(ultimaRuta.current || DEFAULT_SECTION_PATH);
  }, [navigate]);

  if (!app) return children;
  return (
    <BarraApp
      app={app}
      isCompact={isCompact}
      isDesktopSidebarClosed={isDesktopSidebarClosed}
      toggleSidebar={toggleSidebar}
      onTorna={torna}
    />
  );
}

export function useTitolBarraLateral() {
  const app = useAppActual();
  /* Fase D (261020, tasca 4.1) · L1 · El títol seguix la llengua del text, no la demanada. */
  const { language, llenguaDelText = language } = useUIState();
  return app ? `Menú ${titolDe(app.titol, llenguaDelText)}` : TITOL_MENU_SDP;
}
