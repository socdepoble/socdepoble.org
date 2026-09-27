/**
 * CapcaleraConversa.jsx — la capçalera de la conversa oberta (UX-A06, UX-D03,
 * UX-D04, XAT-M01): fletxa d'arrere només en mode estret, avatar, nom i la
 * línia dels altres membres. Cap botó de trucada ni cap promesa que no es
 * complisca: el menú «⋯» només du «Seleccionar missatges».
 *
 * En mode de selecció es convertix en la barra de la tria (eixir + recompte).
 */
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MoreVertical, X } from 'lucide-react';
import { Avatar } from '../../../components/PedraSeca/index.js';

export default function CapcaleraConversa({ fil, onTorna, onSeleccionar, seleccio = null, t }) {
  const [menuObert, setMenuObert] = useState(false);
  const menuRef = useRef(null);

  /* El menú es tanca en clicar fora o amb Escape, sense tocar document.body. */
  useEffect(() => {
    if (!menuObert) return undefined;
    const node = menuRef.current;
    const arrel = node?.getRootNode?.() || document;
    const tancaFora = (e) => { if (node && !node.contains(e.target)) setMenuObert(false); };
    const tancaEsc = (e) => { if (e.key === 'Escape') setMenuObert(false); };
    arrel.addEventListener('pointerdown', tancaFora);
    arrel.addEventListener('keydown', tancaEsc);
    return () => {
      arrel.removeEventListener('pointerdown', tancaFora);
      arrel.removeEventListener('keydown', tancaEsc);
    };
  }, [menuObert]);

  if (seleccio) {
    const { quants, onEixir } = seleccio;
    const recompte = quants === 0
      ? t('section.xat.seleccio.tria', 'Tria els missatges')
      : quants === 1
        ? t('section.xat.seleccio.triat', '1 triat')
        : t('section.xat.seleccio.triats', '{n} triats').replace('{n}', String(quants));
    return (
      <header className="sdp-xat-capcalera sdp-xat-capcalera--seleccio">
        <button type="button" className="sdp-xat-icona" onClick={onEixir} aria-label={t('section.xat.seleccio.eixir', 'Eixir de la selecció')}>
          <X size={24} aria-hidden="true" focusable="false" />
        </button>
        <strong className="sdp-xat-capcalera__info" aria-live="polite">{recompte}</strong>
      </header>
    );
  }

  const nom = fil?.name || fil?.title || t('section.xat.conversaSenseNom', 'Conversa');
  const altres = Array.isArray(fil?.altresNoms) ? fil.altresNoms : [];
  const linia = fil?.tipus === 'grup' || altres.length > 1 ? altres.join(', ') : '';

  return (
    <header className="sdp-xat-capcalera">
      <button type="button" className="sdp-xat-icona d-mobile-only" onClick={onTorna} aria-label={t('section.xat.conversa.torna', 'Torna a la llista')}>
        <ArrowLeft size={24} aria-hidden="true" focusable="false" />
      </button>
      <Avatar nom={nom} src={fil?.avatar_url} mida="sm" llavor={fil?.id} alt="" />
      <div className="sdp-xat-capcalera__info">
        <strong className="sdp-xat-capcalera__nom">{nom}</strong>
        {linia ? <span className="sdp-xat-capcalera__sub">{linia}</span> : null}
      </div>
      <div className="sdp-xat-capcalera__menu" ref={menuRef}>
        <button
          type="button"
          className="sdp-xat-icona"
          aria-label={t('section.xat.conversa.opcions', 'Opcions de la conversa')}
          aria-haspopup="menu"
          aria-expanded={menuObert}
          onClick={() => setMenuObert((obert) => !obert)}
        >
          <MoreVertical size={24} aria-hidden="true" focusable="false" />
        </button>
        {menuObert ? (
          <div className="sdp-xat-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              className="sdp-xat-menu__item"
              onClick={() => { setMenuObert(false); onSeleccionar?.(); }}
            >
              {t('section.xat.conversa.seleccionar', 'Seleccionar missatges')}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
