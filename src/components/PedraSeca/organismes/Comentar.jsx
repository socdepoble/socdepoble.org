/**
 * Comentar.jsx — Ordre del Mestre (261007) · «COMENTARIS = XAT» · El botó
 * Comentar i el seu menú de dues vies, una sola peça de Pedra Seca: la
 * MATEIXA a la barra blava (universal/barres/BarraBlava.jsx) i al peu de la
 * targeta (UniversalCard). No hi ha fil de comentaris davall de cap
 * publicació: el debat és un xat.
 *   · «En privat» · un xat privat només entre la persona i l'autor de
 *     l'element (Onada 8, 261009); sense autor, o amb el pilot, Sóc de Poble,
 *     el missatge directe amb l'entitat;
 *   · «En públic» · el xat públic de l'element, amb el seu títol com a nom,
 *     com els grups «General» o «Beta testers»: hi pot entrar tothom.
 * Correcció C9 · Abans vivia a BarraBlava.jsx, i UniversalCard, un organisme
 * de Pedra Seca, importava d'una barra concreta; ara totes dues l'importen
 * d'ací (BarraBlava el reexporta). El comportament del menú és el de tots els
 * menús emergents (useMenuEmergent), el MATEIX que el de Traduir; el DOM i
 * les classes no canvien. La pell és a components.css («EL MENÚ DE
 * COMENTAR», damunt de la del menú de Traduir).
 */
import { useCallback, useId, useRef, useState } from 'react';
import { Lock, Users } from 'lucide-react';
import { CommentIcon } from '../atoms/icones.jsx';
import { IconButton } from '../atoms/controls.jsx';
import { useMenuEmergent } from '../hooks/useMenuEmergent.js';
/* El traductor de la interfície, o null fora de l'app: aleshores, la reserva
   en valencià (la còpia única, revisió del 261007). */
import { tradueix, useTraductorOpcional } from '../hooks/useTraductorOpcional.js';
import { TEXTOS_COMENTAR } from './textosComentar.js';

const COMENTAR = 'Comentar';

/* Els valors de comentarXat que obrin el menú: 'comu' (les dues vies) i
   'privat' (la pública, desactivada). */
const AMB_MENU = new Set(['comu', 'privat']);
const FILES = '[role="menuitem"]';

/**
 * Ordre del Mestre (261007) · El menú de Comentar. El comportament és el de
 * useMenuEmergent, el MATEIX que MenuTraduir: role=menu; en obrir-lo el focus
 * entra a la primera fila i en tancar-lo (Escape o una tria) torna al botó
 * (`botoRef`); l'Escape que el tanca queda consumit; un clic fora el tanca;
 * les fletxes, Inici i Fi mouen el focus.
 * La pell és la del menú de Traduir (.sdp-menu-traduir) i, com a les apps de
 * missatgeria (un patró conegut), dues files grans amb una icona a
 * l'esquerra: el nom de la via i, davall, una línia que diu on porta (la
 * descripció accessible).
 * Pedra Seca §12: com a molt 300px d'ample (--sdp-menu-ample-max); la línia de
 * davall fa salt i el nom, si no hi cabera, es talla amb punts suspensius
 * (el nom accessible, aria-labelledby, és sencer).
 * Sense xat públic (`ambPublic` fals), la fila pública es queda enfocable i
 * llegible (aria-disabled, no `disabled`), amb la raó en lloc de la línia, i
 * el clic no fa res. La tria crida onTria('privat' | 'public').
 * `mostra` (el mateix contracte que MenuTraduir): l'espècimen del catàleg el
 * pinta obert i quiet, sense furtar el focus, sense escoltar la pàgina (cap
 * clic fora ni Escape que el tanque: Disseny no té cap botó on tornar) i
 * sense tria. Les fletxes, Inici i Fi continuen movent el focus per les files.
 * Onada 8 (261009) · `privatAmb`: el nom de qui hi ha a l'altra banda de «En
 * privat» (l'autor, useAccions · comentarPrivatAmb). Amb ell, la línia de
 * davall diu «Un xat només entre tu i {nom}»; sense, la de sempre.
 */
export function MenuComentar({ ambPublic = false, privatAmb = null, onTria, onTanca, botoRef = null, mostra = false }) {
  const t = useTraductorOpcional();
  const id = useId();
  const { ref, tria, mouFocus } = useMenuEmergent({ files: FILES, onTria, onTanca, botoRef, mostra });
  const nomPrivat = typeof privatAmb === 'string' ? privatAmb.trim() : '';
  const detallPrivat = nomPrivat
    ? tradueix(t, TEXTOS_COMENTAR.privatDetallAmb).replace('{nom}', () => nomPrivat)
    : tradueix(t, TEXTOS_COMENTAR.privatDetall);

  const fila = ({ via, Icona, nom, detall, disponible }) => (
    <button type="button" role="menuitem" className="sdp-menu-traduir__item"
      aria-labelledby={`${id}-${via}`} aria-describedby={`${id}-${via}-detall`}
      aria-disabled={disponible ? undefined : 'true'} onClick={disponible ? () => tria(via) : undefined}>
      <Icona className="sdp-menu-traduir__marca" size={20} aria-hidden="true" focusable="false" />
      <span className="sdp-menu-comentar__text">
        <span id={`${id}-${via}`} className="sdp-menu-comentar__nom">{tradueix(t, nom)}</span>
        <span id={`${id}-${via}-detall`} className="sdp-menu-comentar__detall">{detall}</span>
      </span>
    </button>
  );

  return (
    <div ref={ref} className="sdp-menu-traduir sdp-menu-comentar" role="menu"
      aria-label={tradueix(t, TEXTOS_COMENTAR.menu)} onKeyDown={mouFocus}>
      {fila({ via: 'privat', Icona: Lock, nom: TEXTOS_COMENTAR.privat, detall: detallPrivat, disponible: true })}
      {fila({
        via: 'public', Icona: Users, nom: TEXTOS_COMENTAR.public,
        detall: tradueix(t, ambPublic ? TEXTOS_COMENTAR.publicDetall : TEXTOS_COMENTAR.senseXatPublic), disponible: ambPublic
      })}
    </div>
  );
}

/**
 * Ordre del Mestre (261007) · El botó Comentar, el MATEIX a la barra blava i
 * al peu de la targeta (UniversalCard). Amb `comentarXat` 'comu' o 'privat'
 * (useAccions), el clic obri i tanca el menú de les dues vies, que es pinta
 * just després del botó; el botó diu que obri un menú (aria-haspopup,
 * aria-expanded). Tancat, cap node nou (Llei del Píxel). La via triada va a
 * onComment('privat' | 'public'). Amb null (un handler propi, que mana, o les
 * accions inoperatives de l'editor), cap menú ni atribut nou: el clic va a
 * onComment, com sempre. `label`, `className`, `presentation` i
 * `ariaDisabled` són els d'IconButton. Onada 8 (261009) · `privatAmb`, el
 * nom de l'autor de «En privat» (MenuComentar); tancat, cap píxel canvia.
 */
export function BotoComentar({ label = COMENTAR, comentarXat = null, privatAmb = null, onComment, className = '', presentation = false, ariaDisabled }) {
  const boto = useRef(null);
  const [obert, setObert] = useState(false);
  const tanca = useCallback(() => setObert(false), []);
  const ambMenu = AMB_MENU.has(comentarXat) && typeof onComment === 'function';
  /* Si el botó deixa d'oferir el menú (l'editor el torna inoperatiu, un
     handler propi), el menú obert es tanca: no ha de tornar a eixir sol. */
  if (!ambMenu && obert) setObert(false);
  return (
    <>
      <IconButton label={label} onClick={ambMenu ? () => setObert((abans) => !abans) : onComment}
        className={className} presentation={presentation} ariaDisabled={ariaDisabled} refBoto={boto}
        ariaHaspopup={ambMenu ? 'menu' : undefined} ariaExpanded={ambMenu ? obert : undefined}>
        <CommentIcon className="icon" />
      </IconButton>
      {ambMenu && obert ? (
        <MenuComentar ambPublic={comentarXat === 'comu'} privatAmb={privatAmb} botoRef={boto} onTria={onComment} onTanca={tanca} />
      ) : null}
    </>
  );
}
