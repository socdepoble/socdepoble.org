import { ChevronDown, ChevronRight, PanelLeftClose, PanelRightOpen } from 'lucide-react';

/**
 * Capçalera única de columna.
 * Ordre visual (obert): [ esquerra / titol ] … [ accions ] [ replegar ]
 * Collapsed: [ expandir ] + accions + fills (vertical). Els fills són el rail
 * d'icones de la columna plegada: l'expandir i la roda queden sempre a dalt.
 */
export default function AppGridColumn({
  titol,
  icona: Icona = null,
  accions = [],
  startActions = [],
  endActions = [],
  esquerra = null, // node opcional a l'esquerra (ex. botó "Tot", lupa)
  plegable = false,
  obert = true,
  onPlega = null,
  onReplega = null,
  replegaTotaCapcalera = false,
  etiquetaReplega = null,
  controls = undefined,
  /* P6 (ordre del Mestre, 261003) · En «mitja» i «estret», el Replegar és
     el desplegador de la llista: es veu també en estret i declara
     aria-expanded i aria-controls (`controls`). Sense, el d'abans. */
  replegaCompacte = false,
  /* P6 · En el rail d'estret, l'Expandir obri la columna de la llista
     (tancada): es declara obridor de la closca (data-obri-columna) perquè la
     guarda del focus hi torne quan el panell es tanca. */
  expandObridor = false,
  variant = null,
  esDark = false,
  collapseBtnRef = null,
  expandBtnRef = null,
  children,
}) {
  const esAcordio = variant === 'accordion';
  const Chevron = obert ? ChevronDown : ChevronRight;

  const renderActions = (actionsList) => actionsList.map((a) => {
    let cls =
      a.variant === 'text'
        ? 'app-grid-col-header__accio-text'
        : a.variant === 'primary'
          ? 'app-grid-col-header__accio'
          : 'app-grid-col-header__accio-icon';
    if (a.className) cls = `${cls} ${a.className}`;

    /* P6 · Una acció que obri una columna de la closca (l'obridor de la
       navegació del rail de la llista) en declara el control i l'estat, i
       es marca obridor (data-obri-columna) per a la guarda del focus. */
    return (
      <button
        key={a.id}
        type="button"
        className={cls}
        onClick={() => a.onAcciona?.()}
        disabled={a.desactivat || (a.onAcciona == null && a.variant !== 'text')}
        aria-label={a.etiqueta}
        title={a.etiqueta}
        aria-pressed={a.pressed}
        aria-controls={a.controls}
        aria-expanded={a.expanded}
        data-obri-columna={a.obridor ? '' : undefined}
      >
        {a.icona ? <a.icona size={a.iconSize || 24} aria-hidden focusable="false" /> : null}
        {a.label ? <span>{a.label}</span> : null}
      </button>
    );
  });

  const resolvedEndActions = endActions.length > 0 ? endActions : accions;

  if (variant === 'collapsed') {
    const CollapsedIcon = Icona || PanelRightOpen;
    return (
      <div className={['app-grid-col-header', 'app-grid-col-header--collapsed', esDark === 'intens' ? 'app-grid-col-header--dark-intens' : esDark ? 'app-grid-col-header--dark' : ''].filter(Boolean).join(' ')}>
        {/* Fila superior del rail: el mateix botó és la fila, amb l'alçada de
            la capçalera oberta (var(--sdp-alt-accio)) i la icona centrada. La
            geometria viu a AppGridShell.css (.app-grid-col-header__rail-top),
            no en línia, i el DOM queda pla: expandir, accions i rail són
            germans (UniversalWorkspace.test.jsx ho comprova). */}
        <button
          ref={expandBtnRef}
          type="button"
          className="btn-icon app-grid-col-header__rail-top"
          onClick={onReplega}
          aria-expanded={controls ? false : undefined}
          aria-controls={controls}
          data-obri-columna={expandObridor && controls ? '' : undefined}
          aria-label={`Expandir ${titol}`}
          title={`Expandir ${titol}`}
        >
          <CollapsedIcon size={24} aria-hidden focusable="false" />
        </button>
        {renderActions(startActions)}
        {renderActions(resolvedEndActions)}
        {children}
      </div>
    );
  }

  // Opt-in per a capçaleres amb una sola acció. Les barres amb accions
  // independents conserven botons germans; mai els imbricarem en un botó.
  if (replegaTotaCapcalera && onReplega && !plegable && !esquerra &&
      startActions.length === 0 && resolvedEndActions.length === 0 && children == null) {
    const etiqueta = etiquetaReplega || `Replegar ${titol}`;
    return (
      <button
        ref={collapseBtnRef}
        type="button"
        className={`app-grid-col-header app-grid-col-header--replegable${esDark === 'intens' ? ' app-grid-col-header--dark-intens' : esDark ? ' app-grid-col-header--dark' : ''}`}
        onClick={onReplega}
        aria-label={etiqueta}
        aria-expanded={true}
        aria-controls={controls}
        title={etiqueta}
      >
        <span className="app-grid-col-header__plec">
          {Icona ? <Icona size={24} aria-hidden focusable="false" /> : null}
          {titol ? <span className="app-grid-col-header__titol">{titol}</span> : null}
        </span>
        <span className="app-grid-col-header__accio-icon" aria-hidden="true">
          <PanelLeftClose size={24} focusable="false" />
        </span>
      </button>
    );
  }

  return (
    <div className={`app-grid-col-header${esAcordio ? ' app-grid-col-header--accordion' : ''}${esDark === 'intens' ? ' app-grid-col-header--dark-intens' : esDark ? ' app-grid-col-header--dark' : ''}`}>
      {esquerra}
      {startActions.length > 0 && (
        <div className="app-grid-col-header__accions">
          {renderActions(startActions)}
        </div>
      )}

      {plegable ? (
        <button
          ref={collapseBtnRef}
          type="button"
          className="sdp-workspace-nav-item app-grid-col-header__plegable"
          onClick={onPlega}
          aria-expanded={obert}
          title={`Plegar o desplegar ${titol}`}
        >
          {Icona ? <span className="sdp-workspace-nav-item__icon"><Icona size={24} aria-hidden focusable="false" /></span> : null}
          {titol ? <span className="sdp-workspace-nav-item__label">{titol}</span> : null}
          <span className={`app-grid-col-header__chevron ${obert ? 'app-grid-col-header__chevron--obert' : ''}`}>
            <Chevron size={24} aria-hidden focusable="false" />
          </span>
        </button>
      ) : (
        <div className="app-grid-col-header__plec app-grid-col-header__plec--fix">
          {Icona ? <Icona size={24} aria-hidden focusable="false" /> : null}
          {titol ? <span className="app-grid-col-header__titol">{titol}</span> : null}
        </div>
      )}

      <div className="app-grid-col-header__accions">
        {renderActions(resolvedEndActions)}
        {children}
        {onReplega ? (
          <button
            ref={collapseBtnRef}
            type="button"
            className={replegaCompacte ? 'app-grid-col-header__accio-icon' : 'app-grid-col-header__accio-icon d-desktop-only'}
            onClick={onReplega}
            aria-label={`Replegar ${titol}`}
            title={`Replegar ${titol}`}
            aria-expanded={replegaCompacte ? true : undefined}
            aria-controls={replegaCompacte ? controls : undefined}
          >
            <PanelLeftClose size={24} aria-hidden focusable="false" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
