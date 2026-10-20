/**
 * Moderacio.jsx — Fase D (261020, tasca 2; pla 261020_1300 · App Store 1.2 i
 * Google Play UGC) · «Més opcions» (⋮) de la boina: el botó i el seu menú,
 * una sola peça de Pedra Seca, la MATEIXA a la caputxa de la UniversalCard
 * (Mur, Mercat i Agenda) i a la barra taronja d'una pàgina (el detall d'un
 * element i la fitxa pública d'un perfil). Dues vies:
 *   · «Denuncia el contingut» (o «Denuncia {nom}» en un perfil) · obri el
 *     diàleg de denúncia (universal/DialegsModeracio.jsx).
 *   · «Bloqueja {nom}» · només si qui mira pot bloquejar i l'autor té nom:
 *     obri la confirmació del bloqueig.
 * El comportament del menú és el de tots els menús emergents
 * (useMenuEmergent), el MATEIX que Comentar i Traduir: role=menu, el focus
 * entra a la primera fila, Escape i un clic fora el tanquen i el focus torna
 * al ⋮; una tria el tanca, torna el focus al ⋮ i crida onTria(via, boto):
 * així el diàleg el pren per obridor i Escape tanca UNA sola cosa.
 * La pell és la del menú de Traduir (.sdp-menu-traduir) i el seu lloc,
 * davall del ⋮ i apegat a la dreta (components.css, «MODERACIÓ»). Tancat, cap
 * node més que el botó. Qui decidix si hi ha ⋮ és useAccions (`moderacio`):
 * sense ella, cap targeta ni barra no canvia ni un píxel.
 * Exporta NOMÉS els dos components (C1 també casa les constants en
 * majúscules d'un .jsx): els textos són a textosModeracio.js.
 */
import { useCallback, useRef, useState } from 'react';
import { Ban, EllipsisVertical, Flag } from 'lucide-react';
import { ActionControl } from '../atoms/controls.jsx';
import { useMenuEmergent } from '../hooks/useMenuEmergent.js';
import { tradueix, useTraductorOpcional } from '../hooks/useTraductorOpcional.js';
import { TEXTOS_MODERACIO, omple } from './textosModeracio.js';

const FILES = '[role="menuitem"]';
const PERFILS = new Set(['persona', 'entitat']);

/**
 * El menú «Opcions del contingut». `tipusObjectiu` és el tipus de l'Objectiu
 * (config/moderacio.js): un perfil ('persona' o 'entitat') diu «Denuncia
 * {nom}»; un missatge, «Denuncia el missatge»; la resta, «Denuncia el
 * contingut». La segona fila, «Bloqueja {nom}», només amb `potBloquejar` i un
 * nom. `mostra` (el contracte de MenuComentar): el catàleg el pinta obert i
 * quiet, sense furtar el focus, sense escoltar la pàgina i sense tria.
 */
export function MenuModeracio({ potBloquejar = false, nomAutor = '', tipusObjectiu = '', onTria, onTanca, botoRef = null, mostra = false }) {
  const t = useTraductorOpcional();
  const { ref, tria, mouFocus } = useMenuEmergent({ files: FILES, onTria, onTanca, botoRef, mostra });
  const nom = String(nomAutor || '').trim();
  const denuncia = PERFILS.has(tipusObjectiu) && nom
    ? omple(tradueix(t, TEXTOS_MODERACIO.denunciaPersona), { nom })
    : tradueix(t, tipusObjectiu === 'missatge' ? TEXTOS_MODERACIO.denunciaMissatge : TEXTOS_MODERACIO.denuncia);
  return (
    <div ref={ref} className="sdp-menu-traduir sdp-menu-moderacio" role="menu"
      aria-label={tradueix(t, TEXTOS_MODERACIO.menu)} onKeyDown={mouFocus}>
      <button type="button" role="menuitem" className="sdp-menu-traduir__item" onClick={() => tria('denuncia')}>
        <Flag className="sdp-menu-traduir__marca" size={20} aria-hidden="true" focusable="false" />
        <span className="sdp-menu-comentar__nom">{denuncia}</span>
      </button>
      {potBloquejar && nom ? (
        <button type="button" role="menuitem" className="sdp-menu-traduir__item" onClick={() => tria('bloqueja')}>
          <Ban className="sdp-menu-traduir__marca" size={20} aria-hidden="true" focusable="false" />
          <span className="sdp-menu-comentar__nom">{omple(tradueix(t, TEXTOS_MODERACIO.bloqueja), { nom })}</span>
        </button>
      ) : null}
    </div>
  );
}

/**
 * El ⋮ de la boina. El nom accessible porta el títol de l'element («Més
 * opcions: Fira de tardor»): deu ⋮ iguals en una llista no es distingixen
 * amb un lector de pantalla. Diu que obri un menú (aria-haspopup,
 * aria-expanded); obert, MenuModeracio es pinta just després. La via triada
 * va a onTria('denuncia' | 'bloqueja', boto). `className` és la del cercle
 * de vel fosc de la boina (.btn-icon-orange, el del pin): 48px de zona tàctil.
 */
export function BotoModeracio({ titol = '', nomAutor = '', potBloquejar = false, tipusObjectiu = '', onTria, className = 'btn-icon-orange' }) {
  const t = useTraductorOpcional();
  const boto = useRef(null);
  const [obert, setObert] = useState(false);
  const tanca = useCallback(() => setObert(false), []);
  const base = tradueix(t, TEXTOS_MODERACIO.opcions);
  const nomTitol = String(titol || '').trim();
  return (
    <span className="sdp-moderacio">
      <ActionControl className={className} label={nomTitol ? `${base}: ${nomTitol}` : base} refBoto={boto}
        ariaHaspopup="menu" ariaExpanded={obert} onClick={() => setObert((abans) => !abans)}>
        <EllipsisVertical className="icon" aria-hidden="true" focusable="false" />
      </ActionControl>
      {obert ? (
        <MenuModeracio potBloquejar={potBloquejar} nomAutor={nomAutor} tipusObjectiu={tipusObjectiu} botoRef={boto}
          onTria={(via) => onTria?.(via, boto.current)} onTanca={tanca} />
      ) : null}
    </span>
  );
}
