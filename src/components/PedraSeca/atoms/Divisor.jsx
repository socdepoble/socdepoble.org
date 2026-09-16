/**
 * Divisor.jsx — Separació entre blocs.
 *
 * Sense text: <hr> natiu, decoratiu.
 * Amb text: la línia és decoració i el text és contingut real,
 * per això <hr> no serveix ací i s'usa un <div> amb el text dins.
 */
export function Divisor({ text = null, variant = 'basic', className }) {
  const classes = ['sdp-divisor', `sdp-divisor--${variant}`, className]
    .filter(Boolean).join(' ');

  if (!text) return <hr className={classes} />;

  return (
    <div className={`${classes} sdp-divisor--amb-text`} role="separator">
      <span className="sdp-divisor__text">{text}</span>
    </div>
  );
}
