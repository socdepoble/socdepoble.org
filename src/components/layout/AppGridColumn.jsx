import { ChevronDown, ChevronRight, PanelLeftClose, PanelRightOpen } from 'lucide-react';

/**
 * Capçalera única de columna.
 * Ordre visual (obert): [ esquerra / titol ] … [ accions ] [ replegar ]
 * Collapsed: [ expandir ] + accions (vertical).
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
      >
        {a.icona ? <a.icona size={a.iconSize || 18} aria-hidden focusable="false" /> : null}
        {a.label ? <span>{a.label}</span> : null}
      </button>
    );
  });

  const resolvedEndActions = endActions.length > 0 ? endActions : accions;

  if (variant === 'collapsed') {
    const CollapsedIcon = Icona || PanelRightOpen;
    return (
      <div className={['app-grid-col-header', 'app-grid-col-header--collapsed', esDark === 'intens' ? 'app-grid-col-header--dark-intens' : esDark ? 'app-grid-col-header--dark' : ''].filter(Boolean).join(' ')}>
        <button
          ref={expandBtnRef}
          type="button"
          className="btn-icon btn-icon--transparent"
          onClick={onReplega}
          aria-label={`Expandir ${titol}`}
          title={`Expandir ${titol}`}
        >
          <CollapsedIcon size={20} aria-hidden focusable="false" />
        </button>
        {renderActions(startActions)}
        {renderActions(resolvedEndActions)}
      </div>
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
          {Icona ? <span className="sdp-workspace-nav-item__icon"><Icona size={18} aria-hidden focusable="false" /></span> : null}
          {titol ? <span className="sdp-workspace-nav-item__label">{titol}</span> : null}
          <span className={`app-grid-col-header__chevron ${obert ? 'app-grid-col-header__chevron--obert' : ''}`}>
            <Chevron size={18} aria-hidden focusable="false" />
          </span>
        </button>
      ) : (
        <div className="app-grid-col-header__plec app-grid-col-header__plec--fix">
          {Icona ? <Icona size={20} aria-hidden focusable="false" /> : null}
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
            className="app-grid-col-header__accio-icon d-desktop-only"
            onClick={onReplega}
            aria-label={`Replegar ${titol}`}
            title={`Replegar ${titol}`}
          >
            <PanelLeftClose size={18} aria-hidden focusable="false" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
