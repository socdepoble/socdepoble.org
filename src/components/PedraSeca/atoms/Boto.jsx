/**
 * Boto.jsx — El botó canònic. Canonitza el vocabulari que la Gestoria ja
 * escrivia (`sdp-boto`, `sdp-boto--primari`, `sdp-boto--accent`) i que cap
 * full definia: fins ara es pintaven com a botons d'agent d'usuari.
 *
 * varietat: primari (acció principal, una per vista) · secundari · accent
 *           (identitat taronja, publicar) · perill (destructiu) · fantasma
 * mida:     normal (44px) · gran (56px, accions de bancal)
 * carregant: desactiva, anuncia "Treballant…" i conserva l'amplada.
 */
import { LoaderCircle } from 'lucide-react';

export function Boto({
  varietat = 'secundari', mida = 'normal', icona: Icona = null, carregant = false,
  ple = false, tipus = 'button', className, children, disabled, ...rest
}) {
  const classes = ['sdp-boto', `sdp-boto--${varietat}`, mida === 'gran' && 'sdp-boto--gran',
    ple && 'sdp-boto--ple', className].filter(Boolean).join(' ');
  return (
    <button type={tipus} className={classes} disabled={disabled || carregant}
      aria-busy={carregant || undefined} {...rest}>
      {carregant
        ? <LoaderCircle className="sdp-boto__gir" size={20} aria-hidden="true" focusable="false" />
        : Icona ? <Icona size={20} aria-hidden="true" focusable="false" /> : null}
      <span>{carregant ? 'Treballant…' : children}</span>
    </button>
  );
}
