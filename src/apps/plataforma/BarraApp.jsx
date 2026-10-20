/**
 * Plataforma d'Apps Enxufables · la barra lateral d'una app (relleu).
 *
 * Quan la persona entra a /app/<id>, la barra de Sóc de Poble se'n va i ve
 * esta. Reutilitza les classes de la barra de Sóc de Poble (layout.css:
 * .brand, .sidebar-control-row, .sidebar-control-btn, .sidebar-rail-toggle,
 * .app-sidebar-nav, .nav-item…): mateixa roca, mateix ritme, mateix plegat.
 *   · on hi havia CONTROL hi ha «← Sóc de Poble», que torna on era la persona;
 *   · davall, el nom de l'app;
 *   · les entrades són NavLink germans a /app/<id>/<slug>: només l'activa porta
 *     aria-current (la regla de segment de NavLink), i navegar fa push.
 */
import { ArrowLeft, PanelLeftClose } from 'lucide-react';
import BrandMark from '../../components/BrandMark';
import { NavLink } from '../../app/contexts/RouterContext';
import { useUIState } from '../../app/contexts/UIContext';
import { iconaDe } from './iconesApp.js';
import { rutaDeApp, titolDe } from './manifestApp.js';

export function BarraApp({ app, isCompact = false, isDesktopSidebarClosed = false, toggleSidebar, onTorna }) {
  /* Fase D (261020, tasca 4.1) · L1 · Els títols seguixen la llengua del text, no la demanada. */
  const { language, llenguaDelText = language } = useUIState();
  const titol = titolDe(app.titol, llenguaDelText);
  const IconaApp = iconaDe(app.icona);
  const tancaSiCompacte = () => { if (isCompact) toggleSidebar?.(); };

  const enllac = (entrada) => {
    const Icona = iconaDe(entrada.icona);
    const etiqueta = titolDe(entrada.titol, llenguaDelText);
    return (
      <NavLink key={entrada.slug} to={rutaDeApp(app.id, entrada.slug)} className="nav-item" aria-label={etiqueta} onClick={tancaSiCompacte}>
        <Icona className="icona-linia" strokeWidth={2.1} size={24} aria-hidden="true" focusable="false" />
        <span className="nav-item__text">{etiqueta}</span>
      </NavLink>
    );
  };

  return (
    <>
      <button type="button" className="brand sdp-unstyled-btn" aria-label={`Obrir o tancar menú ${titol}`}
        aria-expanded={isCompact ? true : !isDesktopSidebarClosed} aria-controls="app-sidebar" onClick={toggleSidebar}>
        <BrandMark className="app-brand__mark" />
      </button>

      <div className="sidebar-control-row">
        <button type="button" className="sidebar-control-btn" aria-label="Torna a Sóc de Poble"
          onClick={() => { tancaSiCompacte(); onTorna?.(); }}>
          <ArrowLeft className="icona-linia" size={24} strokeWidth={2.1} aria-hidden="true" focusable="false" />
          <span className="nav-item__text">Sóc de Poble</span>
        </button>
        {!isCompact && <button type="button" className="sidebar-rail-toggle"
          aria-label={isDesktopSidebarClosed ? 'Desplegar barra lateral' : 'Plegar barra lateral'}
          aria-expanded={!isDesktopSidebarClosed} aria-controls="app-sidebar" onClick={toggleSidebar}>
          {/* El mateix node que SidebarContent (App.jsx): lucide ja hi posa
              aria-hidden. La paritat la vigila integracioApp.test.jsx. */}
          {isDesktopSidebarClosed
            ? <IconaApp className="icona-linia" strokeWidth={2.1} aria-hidden="true" focusable="false" />
            : <PanelLeftClose size={24} />}
        </button>}
      </div>

      <p className="sdp-app-barra__titol">
        <IconaApp className="icona-linia" size={24} strokeWidth={2.1} aria-hidden="true" focusable="false" />
        <span className="nav-item__text">{titol}</span>
      </p>

      <div className="app-sidebar-nav">
        <div className="app-sidebar-nav__llista" role="group" aria-label={titol}>
          {app.entrades.filter((entrada) => !entrada.grup).map(enllac)}
          {app.grups.map((grup) => (
            <div key={grup.id} role="group" aria-label={titolDe(grup.titol, llenguaDelText)}>
              <hr className="app-sidebar-divider" />
              <p className="sdp-app-barra__grup"><span className="nav-item__text">{titolDe(grup.titol, llenguaDelText)}</span></p>
              {app.entrades.filter((entrada) => entrada.grup === grup.id).map(enllac)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
