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
  collapseBtnRef = null,
  expandBtnRef = null,
  children,
}) {
  const esAcordio = variant === 'accordion';
  const esDark = variant === 'dark';
  const esTransparent = variant === 'transparent';
  const Chevron = obert ? ChevronDown : ChevronRight;

  const renderActions = (actionsList) => actionsList.map((a) => {
    const cls =
      a.variant === 'text'
        ? 'app-grid-col-header__accio-text'
        : a.variant === 'primary'
          ? 'app-grid-col-header__accio'
          : 'app-grid-col-header__accio-icon';
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
        {a.icona ? <a.icona size={18} aria-hidden focusable="false" /> : null}
        {a.label ? <span>{a.label}</span> : null}
      </button>
    );
  });

  const resolvedEndActions = endActions.length > 0 ? endActions : accions;

  if (variant === 'collapsed') {
    const CollapsedIcon = Icona || PanelRightOpen;
    return (
      <div className="app-grid-col-header app-grid-col-header--collapsed">
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
    <div className={`app-grid-col-header${esAcordio ? ' app-grid-col-header--accordion' : ''}${esDark ? ' app-grid-col-header--dark' : ''}${esTransparent ? ' app-grid-col-header--transparent' : ''}`}>
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
          className="app-grid-col-header__plec"
          onClick={onPlega}
          aria-expanded={obert}
          title={`Plegar o desplegar ${titol}`}
        >
          <Chevron size={20} aria-hidden focusable="false" />
          {Icona ? <Icona size={20} aria-hidden focusable="false" /> : null}
          {titol ? <span className="app-grid-col-header__titol">{titol}</span> : null}
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
