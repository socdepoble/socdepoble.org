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

  /* Onada R30 · T3-VOC · Sense sdp-divisor--amb-text ni sdp-divisor__text: cap
     full no les estilava (classes foranes). La variant amb text la diu el div
     amb role="separator"; el seu estil propi és deute de disseny, no d'ací. */
  return (
    <div className={classes} role="separator">
      <span>{text}</span>
    </div>
  );
}
