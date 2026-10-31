/**
 * Boto.jsx — El botó canònic. Canonitza el vocabulari que la Gestoria ja
 * escrivia (`sdp-boto`, `sdp-boto--primari`, `sdp-boto--accent`) i que cap
 * full definia: fins ara es pintaven com a botons d'agent d'usuari.
 *
 * varietat: primari (acció principal, una per vista) · secundari · accent
 *           (identitat taronja, publicar) · perill (destructiu) · fantasma
 * mida:     normal (48px, --sdp-touch-min) · gran (58px, --sdp-alt-accio,
 *           accions de bancal). IDEA-26 (261025) · les xifres són les del
 *           CSS de veres (components.css): abans deien 44 i 56.
 * carregant: desactiva, anuncia "Treballant…" i conserva l'amplada.
 */
import { LoaderCircle } from 'lucide-react';
import { tradueix, useTraductorOpcional } from '../hooks/useTraductorOpcional.js';

/* Gauntlet 261029 (cicle 1, i18n) · «Treballant…», en la llengua de la
   interfície; fora de l'app, la reserva de sempre. */
const TREBALLANT = Object.freeze(['common.treballant', 'Treballant…']);

export function Boto({
  varietat = 'secundari', mida = 'normal', icona: Icona = null, carregant = false,
  ple = false, tipus = 'button', className, children, disabled, ...rest
}) {
  const t = useTraductorOpcional();
  const classes = ['sdp-boto', `sdp-boto--${varietat}`, mida === 'gran' && 'sdp-boto--gran',
    ple && 'sdp-boto--ple', className].filter(Boolean).join(' ');
  return (
    <button type={tipus} className={classes} disabled={disabled || carregant}
      aria-busy={carregant || undefined} {...rest}>
      {carregant
        ? <LoaderCircle className="sdp-boto__gir" size={20} aria-hidden="true" focusable="false" />
        : Icona ? <Icona size={20} aria-hidden="true" focusable="false" /> : null}
      <span>{carregant ? tradueix(t, TREBALLANT) : children}</span>
    </button>
  );
}
