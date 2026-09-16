/**
 * Insignia.jsx — Una sola peça per a les dues famílies que ja vivien a l'app.
 *
 *   tipus (taxonomia, clicables pel gestor): sistema · categoria · etiqueta
 *     → emet les classes vives `sdp-badge-system|category|tag` (9 fitxers).
 *   to (estat, no clicables): info · exit · avis · error · neutre
 *     → emet `sdp-insignia--*`, el vocabulari de la Gestoria (sense CSS fins ara).
 *
 * L'estat mai no es comunica només pel color: el text és obligatori.
 */
const TAXONOMIA = { sistema: 'sdp-badge-system', categoria: 'sdp-badge-category', etiqueta: 'sdp-badge-tag' };

export function Insignia({ tipus, to = 'neutre', className, children }) {
  const base = tipus ? TAXONOMIA[tipus] : `sdp-insignia sdp-insignia--${to}`;
  return <span className={[base, className].filter(Boolean).join(' ')}>{children}</span>;
}
