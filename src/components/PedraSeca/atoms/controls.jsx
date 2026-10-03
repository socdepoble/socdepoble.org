/**
 * controls.jsx — botons i controls sense router.
 * Trasllat literal des d'UniversalElements.jsx (260910). Cap canvi de comportament.
 *
 * Traductor Sobirà (ordre del Mestre, 260930) · ActionControl i IconButton
 * admeten `refBoto` (on torna el focus un desplegable en tancar-se) i
 * `ariaHaspopup` / `ariaExpanded` (un botó que obri un menú ho diu). Sense
 * elles, el marcatge és el de sempre: React no pinta un atribut undefined.
 *
 * T7 (P7) · `ariaDisabled` ('true' | undefined): un botó inoperatiu que es
 * pot enfocar i llegir (no `disabled`) i el clic continua arribant a qui el
 * munta, que hi posa el seu avís (patró de VistaEnConstruccio). Sense la
 * prop, el marcatge és el de sempre.
 */
export function ActionControl({
  label,
  title = label,
  className,
  onClick,
  disabled = false,
  refBoto,
  ariaHaspopup,
  ariaExpanded,
  ariaDisabled,
  children
}) {
  const presentationOnly = !onClick;

  return (
    <button
      ref={refBoto}
      type="button"
      className={className}
      aria-label={label}
      title={title}
      aria-haspopup={ariaHaspopup}
      aria-expanded={ariaExpanded}
      aria-disabled={ariaDisabled}
      onClick={onClick}
      disabled={disabled || presentationOnly}
    >
      {children}
    </button>
  );
}

export function DateTimeControl({ time, date, dateTime, label, onClick }) {
  if (!time && !date) return null;

  const accessibleLabel = label || ['Data i hora', time, date].filter(Boolean).join(': ');
  const content = (
    <>
      {time && <span>{time}</span>}
      {date && <span>{date}</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="btn-date-time"
        aria-label={accessibleLabel}
        title={accessibleLabel}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <time
      className="btn-date-time"
      dateTime={dateTime}
      aria-label={accessibleLabel}
    >
      {content}
    </time>
  );
}

export function IconButton({
  label,
  children,
  onClick,
  className = '',
  disabled = false,
  presentation = false,
  refBoto,
  ariaHaspopup,
  ariaExpanded,
  ariaDisabled
}) {
  if (!onClick && !presentation && !disabled) return null;

  return (
    <ActionControl
      className={['sp-card-action', className].filter(Boolean).join(' ')}
      label={label}
      onClick={onClick}
      disabled={disabled}
      refBoto={refBoto}
      ariaHaspopup={ariaHaspopup}
      ariaExpanded={ariaExpanded}
      ariaDisabled={ariaDisabled}
    >
      {children}
    </ActionControl>
  );
}

export function UniversalButton({
  children,
  onClick,
  variant = 'primary',
  size = '',
  type = 'button',
  className = '',
  disabled = false,
  icon = null,
  ariaLabel
}) {
  const sizeClass = size ? `btn-${size}` : '';
  const variantClass = variant ? `btn-${variant}` : '';

  return (
    <button
      className={['btn', variantClass, sizeClass, className].filter(Boolean).join(' ')}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
    >
      {icon && (
        <span className="icon-btn" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
