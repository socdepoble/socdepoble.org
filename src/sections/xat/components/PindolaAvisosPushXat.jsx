/**
 * PindolaAvisosPushXat.jsx — Onada R9 · C3 (IDEA-120 / P0-30, ordre del Mestre
 * del 261106; G8-10). Damunt de la llista de converses, un sol toc per a
 * encendre els avisos push del Xat: «🔔 Activar notificacions del xat».
 *
 * Les condicions són les de la pàgina «Notificacions» dels Ajustos
 * (useControlAvisosPush): un adaptador registrat que s'oferix, la sessió dins
 * fora d'una eixida, el mode remot, la capacitat del port i el servidor de la
 * persona ja fixat. Llavors:
 *   · oferit i inactiu → el botó. El toc crida onCanvi(true), que és
 *     activaAvisosPush() en el MATEIX tic: cap await, cap estat ni cap efecte
 *     abans (Safari d'iOS i Firefox perdrien el gest i el permís no eixiria);
 *   · actiu → res: ja els té;
 *   · denegat → només la nota de com tornar-los a permetre (el botó no
 *     faria res: el navegador ja ha dit que no);
 *   · Safari d'iPhone o iPad sense l'app a la pantalla d'inici → les dues
 *     passes per a afegir-la (les mateixes claus que la guia de Descàrregues);
 *   · res a oferir → res. Sense clau pública VAPID al build, l'adaptador diu
 *     'sense-clau': la píndola no es pinta, no demana cap permís i no fa cap
 *     petició (Llei del Píxel: cap control mort ni cap avís que la persona no
 *     pot resoldre; l'estat honest és per a l'Administració).
 * Les notes són les de useControlAvisosPush (claus section.xat.ajustos.avisos.*).
 */
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { ESTAT_AVISOS } from '../../../config/avisosPushXat.js';
import { TEXTOS_AVISOS, useControlAvisosPush } from '../useAvisosPushXat.js';

/* Els textos propis, com a parells [clau, reserva]: la reserva és el valor
   valencià del diccionari, caràcter a caràcter. Les dues passes d'iOS són les
   de la guia de Descàrregues (ja traduïdes als cinc idiomes). */
export const TEXTOS_PINDOLA = Object.freeze({
  etiqueta: ['section.xat.push.etiqueta', 'Notificacions del xat'],
  activa: ['section.xat.push.activa', '🔔 Activar notificacions del xat'],
  ios: ['section.xat.push.ios', 'Per a rebre les notificacions del xat a l’iPhone o l’iPad, primer afig Sóc de Poble a la pantalla d’inici:'],
  pas1: ['section.descarregues.guia.ios.pas1', 'Prem Compartir ⬆️ (el quadre amb la fletxa cap amunt).'],
  pas2: ['section.descarregues.guia.ios.pas2', 'Toca «Afegeix a la pantalla d\'inici».'],
  obri: ['section.xat.push.ios.obri', 'Després obri Sóc de Poble des de la icona de la pantalla d’inici i torna ací.']
});

const RESERVA = (_clau, reserva) => reserva;

export default function PindolaAvisosPushXat({ t = RESERVA }) {
  const tr = ([clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);
  const control = useControlAvisosPush(t);
  if (control.actiu) return null;
  if (control.nomesNota) {
    return (
      <section className="sdp-xat-pindola-push" aria-label={tr(TEXTOS_PINDOLA.etiqueta)}>
        <p className="sdp-xat-pindola-push__text">{tr(TEXTOS_PINDOLA.ios)}</p>
        <ol className="sdp-xat-pindola-push__passos">
          <li>{tr(TEXTOS_PINDOLA.pas1)}</li>
          <li>{tr(TEXTOS_PINDOLA.pas2)}</li>
        </ol>
        <p className="sdp-xat-pindola-push__text">{tr(TEXTOS_PINDOLA.obri)}</p>
      </section>
    );
  }
  if (!control.oferit) return null;
  const denegat = control.estat === ESTAT_AVISOS.DENEGAT;
  return (
    <section className="sdp-xat-pindola-push" aria-label={tr(TEXTOS_PINDOLA.etiqueta)}>
      {denegat ? null : (
        <Boto varietat="primari" ple carregant={control.ocupat} onClick={() => { control.onCanvi(true); }}>
          {tr(TEXTOS_PINDOLA.activa)}
        </Boto>
      )}
      {control.nota ? (
        <p role="status" className={control.nota.error ? 'sdp-xat-pindola-push__text sdp-xat-pindola-push__text--error' : 'sdp-xat-pindola-push__text'}>
          {control.nota.text}
        </p>
      ) : null}
      {denegat ? null : <p className="sdp-xat-pindola-push__text">{tr(TEXTOS_AVISOS.cec)}</p>}
    </section>
  );
}
